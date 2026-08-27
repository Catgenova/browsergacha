// Character progression: levels, XP, and star-ups.
//
// - Heroes are summoned at level 1 with stars equal to their gacha rarity.
// - Max level is 10 per star (1★ -> 10, 2★ -> 20 ... 10★ -> 100).
// - Star-ups require max level plus N spare duplicates, where N is the
//   CURRENT star count (1★->2★ costs 1 dup ... 9★->10★ costs 9).
// - Starring up boosts base stats permanently and raises the level cap.
//   The level itself is kept: a star up lifts the ceiling, it does not
//   send the hero back to the bottom of it.
// - The whole party gains XP on victory, based on enemy levels.

const Progression = (() => {
  const MAX_STARS = 10;

  function maxLevel(stars) {
    return stars * 10;
  }

  // Heroes at the SAME star rating consumed to go from `stars` to
  // `stars + 1`: three 3-star heroes to reach 4.
  function starUpCost(stars) {
    return stars;
  }

  // XP required to advance from `level` to `level + 1`.
  function xpToNext(level) {
    return 60 + 20 * (level - 1);
  }

  // Stat multiplier: +5% of base per level, +25% compounding per star.
  // Speed and crit stay flat so turn-order balance holds at every level.
  //
  // This used to read `stars - baseRarity` -- the multiplier counted only
  // the stars a hero had been GAINED above the shelf they were summoned
  // on. Since every hero starts from the same base budget, that made the
  // roster upside down at the shared endgame: a 1-star climbing to 10
  // takes nine compounding steps and a 5-star takes five, so the cheap
  // hero finished 1.25^4 = 2.44x ahead, for 45 duplicates against 35. The
  // bench measured exactly that -- median power at 10 stars / level 100
  // ran 75,184 for a 1-star against 20,906 for a 5-star.
  //
  // Keyed off `stars` alone, a 10-star is a 10-star whatever shelf it
  // came from, and rarity is expressed once, in the base budget
  // (js/data/balance.js). The curve is ANCHORED AT THREE STARS -- the
  // shelf that is meant to sit on the median -- so a 3-star hero's
  // numbers are unchanged at every star and every level, and the
  // campaign stays tuned against the same yardstick it was built on.
  // 1- and 2-stars come down from there, 4- and 5-stars go up.
  const ANCHOR = 3;
  function statMult(level, stars) {
    return (1 + 0.05 * (level - 1)) * Math.pow(1.25, stars - ANCHOR);
  }

  function scaledStats(def, level, stars) {
    const m = statMult(level, stars);
    return {
      hp: Math.round(def.stats.hp * m),
      atk: Math.round(def.stats.atk * m),
      def: Math.round(def.stats.def * m),
      speed: def.stats.speed,
      critChance: def.stats.critChance,
      critDamage: def.stats.critDamage,
    };
  }

  // XP a single defeated enemy grants to each party member.
  function enemyXp(level) {
    return 20 + 8 * level;
  }

  // ---- Boss stages ----
  // Each boss has 20 stages; stage 1 is level 5 and every stage adds 5
  // levels (stage 20 = level 100).
  const BOSS_MAX_STAGE = 20;
  function bossLevel(stage) {
    return stage * 5;
  }

  // Bosses can declare exact stats at level 5 and level 100
  // (def.stats5 / def.stats100); every level in between interpolates
  // linearly, letting each stat grow on its own curve. Levels beyond
  // 100 (Endless Tower) extrapolate along the same line.
  // A single number for "how strong is this hero right now", so a
  // 385-hero roster can be sorted by something more useful than level.
  // Offence and durability are combined multiplicatively — a glass
  // cannon and a wall that cannot kill both score poorly — and speed
  // matters because acting first is acting more often.
  function power(stats) {
    const offence = (stats.atk || 1) *
      (1 + (stats.critChance ?? 0.15) * ((stats.critDamage ?? 1.5) - 1));
    const durability = (stats.hp || 1) * (1 + (stats.def || 0) / 300);
    const tempo = (stats.speed || 100) / 100;
    return Math.round(Math.sqrt(offence * durability) * tempo);
  }

  function bossScaledStats(def, level) {
    const t = Math.max(0, (level - 5) / 95);
    const lerp = (a, b) => Math.round(a + (b - a) * t);
    return {
      hp: lerp(def.stats5.hp, def.stats100.hp),
      atk: lerp(def.stats5.atk, def.stats100.atk),
      def: lerp(def.stats5.def, def.stats100.def),
      speed: def.stats5.speed,
      critChance: def.stats5.critChance,
      critDamage: def.stats5.critDamage,
    };
  }

  // ---- Skill leveling ----
  // The only way to raise a skill is to sacrifice another copy of the
  // same character (see GameState.sacrifice); there is no currency.
  //
  // Deeper slots buy more rungs, which is what lets a skill 3 afford a
  // damage track AND two cooldown reductions. A skill starts at level 1,
  // so its cap is one above its rung count.
  const SKILL_RUNGS = [5, 6, 7];        // by ability index
  function skillRungs(idx) { return SKILL_RUNGS[idx] ?? SKILL_RUNGS[SKILL_RUNGS.length - 1]; }
  function maxSkillLevel(idx) { return skillRungs(idx) + 1; }

  // The old blanket multiplier: +10% to every number in the ability per
  // level. It did nothing observable on a skill whose only job is to
  // land a debuff, which is why the ladder system (see
  // docs/skill-level-process.md) replaces it. Kept because the roster is
  // being swept hero by hero: an ability with no `levelUps` ladder still
  // levels the old way, so unswept heroes are untouched.
  const MAX_SKILL_LEVEL = 5;            // legacy cap, ladder-less abilities
  function skillPower(level) {          // effect multiplier at `level`
    return 1 + 0.10 * (level - 1);
  }

  // Cap for one ability: laddered skills use their slot's cap, the rest
  // stay on the legacy 5 until they are swept.
  function skillCap(abilityDef, idx) {
    if (!abilityDef || !abilityDef.levelUps) return MAX_SKILL_LEVEL;
    // A slot's rung count is the CEILING, not a quota. A few skills have
    // fewer improvable axes than rungs available -- Silas's aiming
    // stance is a flag with no magnitude and no meaningful duration, so
    // its only axis is cooldown. Capping at the ladder's real length
    // beats padding it with rungs that buy nothing.
    return Math.min(maxSkillLevel(idx), abilityDef.levelUps.length + 1);
  }

  // Sum the ladder rungs earned at `level` into one bag of deltas. Rung
  // 0 is the step from level 1 to 2, so a level-1 skill earns nothing.
  // Unknown rung keys are summed too — the consumer decides what it
  // understands, and a typo shows up as an unused key rather than as
  // silently correct behaviour.
  function skillLadder(abilityDef, level) {
    const out = {};
    const rungs = (abilityDef && abilityDef.levelUps) || [];
    for (let i = 0; i < Math.min(rungs.length, Math.max(0, level - 1)); i++) {
      for (const [k, v] of Object.entries(rungs[i] || {})) {
        out[k] = (out[k] || 0) + v;
      }
    }
    return out;
  }

  // What the earned rungs have actually bought, for the roster and
  // Improve readouts. A laddered skill lists its deltas; a legacy one
  // keeps the old blanket "+N% power" line.
  function skillBonusText(abilityDef, level) {
    if (!abilityDef || !abilityDef.levelUps) {
      const bonus = Math.round((skillPower(level) - 1) * 100);
      return bonus > 0 ? `+${bonus}% power` : '';
    }
    const l = skillLadder(abilityDef, level);
    const bits = [];
    // Flat and per-mirror rungs are listed apart on purpose. Summing
    // them reads as one number that is true at no mirror count: +50 flat
    // and +25 per mirror is +50% power with the glass gone and +200%
    // with all six up.
    if (l.mult) bits.push(`+${Math.round(l.mult * 100)}% power`);
    if (l.perMirror) bits.push(`+${Math.round(l.perMirror * 100)}%/mirror`);
    if (l.perDeath) bits.push(`+${Math.round(l.perDeath * 100)}%/death`);
    if (l.perTarget) bits.push(`+${Math.round(l.perTarget * 100)}%/enemy hit`);
    if (l.perBurn) bits.push(`+${Math.round(l.perBurn * 100)}%/fire lit`);
    // The `heal` rung is the HP-priced RATE, and HP-priced damage rides
    // it too (Wren's shoulder, Franz's bonk). Calling that "+25% heal" on
    // a skill that only ever hurts people would be a plain lie, so the
    // word follows what the skill actually does.
    if (l.heal) {
      const mends = (abilityDef.effects || []).some((e) =>
        /^heal/.test(e.type) || e.type === 'hot' || e.type === 'revive' ||
        e.type === 'shield' || e.healDealt !== undefined);
      bits.push(`+${Math.round(l.heal * 100)}% ${mends ? 'heal' : 'power'}`);
    }
    if (l.debuffChance) bits.push(`+${Math.round(l.debuffChance * 100)}% land chance`);
    if (l.debuffPower) bits.push(`+${Math.round(l.debuffPower * 100)}% effect`);
    if (l.buffPower) bits.push(`+${Math.round(l.buffPower * 100)}% boon`);
    if (l.cleanseCount) bits.push(`+${l.cleanseCount} cleansed`);
    if (l.stripCount) bits.push(`+${l.stripCount} stripped`);
    if (l.meter) bits.push(`+${Math.round(l.meter * 100)}% drain`);
    if (l.chain) bits.push(`+${Math.round(l.chain * 100)}% chain`);
    if (l.refund) bits.push(`+${l.refund} turn${l.refund === 1 ? '' : 's'} back`);
    if (l.per) bits.push(`+${l.per} ATK each`);
    if (l.duration) bits.push(`+${l.duration} turn${l.duration === 1 ? '' : 's'}`);
    if (l.cooldown) bits.push(`${l.cooldown} CD`);
    return bits.join(' · ');
  }

  // Cooldown a skill shows at `level`, after its earned -1 rungs. Mirrors
  // Unit.cooldownFor so the sheet and the fight agree.
  function skillCooldown(abilityDef, level) {
    const base = (abilityDef && abilityDef.cooldown) || 0;
    if (base <= 0) return 0;
    return Math.max(1, base + (skillLadder(abilityDef, level).cooldown || 0));
  }

  return {
    MAX_STARS, maxLevel, starUpCost, xpToNext, statMult, scaledStats, enemyXp,
    BOSS_MAX_STAGE, bossLevel, bossScaledStats, power,
    MAX_SKILL_LEVEL, skillPower,
    SKILL_RUNGS, skillRungs, maxSkillLevel, skillCap, skillLadder,
    skillBonusText, skillCooldown,
  };
})();
