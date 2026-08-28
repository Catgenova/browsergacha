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

  // ---- Star points -----------------------------------------------------
  //
  // Starring up is a BANK now, not a shopping list. Every hero is worth
  // points as fodder, every rating costs points to reach, and the two
  // numbers are the same table -- so a hero's worth as fodder is exactly
  // what somebody else paid to become it.
  //
  // The table is the factorials, which is not a flourish: it makes each
  // rank cost exactly N of the rank below (four 3-stars make a 4-star,
  // because 4x6 = 24), while ALSO letting the whole cost be paid in
  // anything at all. Twenty-four 1-stars reach the same 4-star, and so
  // does any mixture that adds up.
  //
  //   1*      1        6*        720
  //   2*      2        7*      5,040
  //   3*      6        8*     40,320
  //   4*     24        9*    362,880
  //   5*    120       10*  3,628,800
  //
  // The old rule was "as many heroes at the SAME rating as the rating
  // itself", which meant a spare 1-star could never help a 3-star at
  // all, and a hero one body short of a star up was one body short of
  // it forever. A bank fills a little at a time and nothing is wasted.
  const STAR_POINTS = [0, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800];

  // What a hero at `stars` is worth when spent.
  //
  // A def may carry its OWN table and override the factorials: a
  // dumpling is fodder and nothing else, so it is priced on a scale of
  // its own rather than pretending to be a hero of that rating.
  function starValue(stars, def = null) {
    const s = Math.max(0, Math.min(MAX_STARS, stars));
    if (def && Array.isArray(def.starPoints)) return def.starPoints[s] || 0;
    return STAR_POINTS[s] || 0;
  }

  // Points banked to go from `stars` to `stars + 1`. Zero at the cap,
  // where there is nothing left to buy.
  function starUpCost(stars) {
    return stars >= MAX_STARS ? 0 : starValue(stars + 1);
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
  // One bag of rung deltas, rendered as human labels. Shared by the
  // whole-ladder readout below and by the per-rung readout the Roster
  // screen's skill panel prints beside each level ("Lv.2 +5% power"),
  // so the two can never drift into describing the same rung
  // differently.
  function deltaBits(abilityDef, l) {
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
    return bits;
  }

  function skillBonusText(abilityDef, level) {
    if (!abilityDef || !abilityDef.levelUps) {
      const bonus = Math.round((skillPower(level) - 1) * 100);
      return bonus > 0 ? `+${bonus}% power` : '';
    }
    return deltaBits(abilityDef, skillLadder(abilityDef, level)).join(' \u00b7 ');
  }

  // What ONE rung buys, for a ladder printed a line at a time. `i` is
  // the rung index, so rung 0 is the step from level 1 to level 2 --
  // the same indexing skillLadder walks.
  function rungText(abilityDef, i) {
    const rungs = (abilityDef && abilityDef.levelUps) || [];
    if (!rungs[i]) return '';
    const bits = deltaBits(abilityDef, rungs[i]);
    // A rung with no recognised key still happened, and saying nothing
    // reads as a level that bought nothing. Name the keys instead: an
    // unrendered rung should look like a gap in this table, not like a
    // gap in the skill.
    return bits.length ? bits.join(' \u00b7 ') : Object.keys(rungs[i]).join(', ');
  }

  // What a skill's numbers ACTUALLY are at `level`, resolved.
  //
  // The authored description carries the BASE figures -- "60% ATK to ALL
  // enemies" -- and the rungs bought since are listed separately as
  // "+20% power". Reading a skill therefore meant doing arithmetic in
  // your head, and the arithmetic is not obvious: which rung feeds which
  // number is a per-effect rule (js/abilities.js), not one rule.
  //
  // So this resolves it. Each entry is { label, base, now, kind }, and
  // the caller renders `base -> now` where they differ. THE RULES BELOW
  // MIRROR js/abilities.js EXACTLY -- a readout that disagrees with the
  // fight is worse than no readout, and test/rules.test.js holds the two
  // together by executing each ability and checking the number that
  // lands is the number shown.
  //
  // `kind` says how to render: 'pct' a percentage, 'signed' a percentage
  // read as a change from neutral (a 0.80 damage-taken ward is "-20%"),
  // 'turns' a duration, 'n' a plain count.
  function skillFacts(abilityDef, level) {
    if (!abilityDef) return [];
    const lad = skillLadder(abilityDef, level);
    const out = [];
    const add = (label, base, now, kind) => {
      if (base === undefined || base === null || Number.isNaN(base)) return;
      out.push({ label, base, now, kind });
    };
    // A rung that only exists at higher levels still reads as +0 here,
    // which is what we want: base and now match and the UI prints one
    // number.
    const g = (k) => lad[k] || 0;

    const statName = (e) => {
      const raw = e.stat || '';
      const NICE = { atk: 'ATK', def: 'DEF', speed: 'SPD', hp: 'HP',
        resistance: 'Resistance', accuracy: 'Accuracy', critChance: 'CRIT',
        critDamage: 'CRIT DMG', damageTaken: 'Damage taken',
        damageDealt: 'Damage dealt', healing: 'Healing' };
      return NICE[raw] || (raw ? raw[0].toUpperCase() + raw.slice(1) : 'Effect');
    };

    for (const e of [...(abilityDef.effects || []), ...(abilityDef.selfEffects || [])]) {
      switch (e.type) {
        // ATK/DEF-priced damage takes the `mult` rate; damage priced off
        // a HEALTH POOL takes the smaller `heal` rate (abilities.js:353).
        case 'damage': case 'damageDef': case 'damageHp': {
          const rate = e.type === 'damageHp' ? g('heal') : g('mult');
          const of = e.type === 'damageDef' ? 'DEF' : (e.type === 'damageHp' ? 'max HP' : 'ATK');
          add(`Damage (${of})`, e.mult, e.mult + rate, 'pct');
          break;
        }
        case 'damageHpPct':
          add('Damage (max HP)', e.pct, e.pct + g('heal'), 'pct');
          break;
        case 'heal':
          add('Heal (ATK)', e.mult, e.mult + g('mult'), 'pct');
          break;
        case 'healPerDot':
          add('Heal per fire (ATK)', e.pct, e.pct + g('mult'), 'pct');
          break;
        case 'healHpPct': {
          const base = e.pct === undefined ? e.targetPct : e.pct;
          const of = e.pct === undefined ? "target's max HP" : 'max HP';
          add(`Heal (${of})`, base, base + g('heal'), 'pct');
          break;
        }
        case 'hot':
          add('Regen a turn (max HP)', e.pct, e.pct + g('heal'), 'pct');
          add('Regen lasts', e.turns, e.turns + g('duration'), 'turns');
          break;
        case 'shield': {
          // HP-priced shields ride `heal`, ATK-priced ones ride `mult`
          // (abilities.js:521).
          if (e.pct !== undefined) add('Shield (max HP)', e.pct, e.pct + g('heal'), 'pct');
          else add('Shield (ATK)', e.mult, e.mult + g('mult'), 'pct');
          if (e.turns !== undefined) add('Shield lasts', e.turns, e.turns + g('duration'), 'turns');
          break;
        }
        case 'dot': {
          const label = e.flavor ? e.flavor[0].toUpperCase() + e.flavor.slice(1) : 'Damage over time';
          if (e.targetHpPct !== undefined) {
            add(`${label} a turn (target max HP)`, e.targetHpPct,
              e.targetHpPct + g('debuffPower'), 'pct');
          } else if (e.pct !== undefined) {
            add(`${label} a turn (ATK)`, e.pct, e.pct + g('debuffPower'), 'pct');
          }
          if (e.turns !== undefined) add(`${label} lasts`, e.turns, e.turns, 'turns');
          break;
        }
        case 'buff': case 'debuff': {
          const deepen = e.type === 'buff' ? g('buffPower') : g('debuffPower');
          // Severity moves the value AWAY FROM NEUTRAL, so the rung
          // reads right on a cut and a lift alike (abilities.js:739/790).
          if (typeof e.mult === 'number') {
            const now = deepen
              ? (e.mult < 1 ? Math.max(0, e.mult - deepen) : e.mult + deepen)
              : e.mult;
            add(statName(e), e.mult, now, 'signed');
          }
          if (typeof e.add === 'number') {
            const now = deepen ? (e.add < 0 ? e.add - deepen : e.add + deepen) : e.add;
            add(statName(e), e.add, now, 'pct');
          }
          // Duration rungs lengthen BUFFS only -- a mixed skill must not
          // silently lengthen its hex too (abilities.js:733).
          if (e.turns !== undefined) {
            const t = e.type === 'buff' ? e.turns + g('duration') : e.turns;
            add('Lasts', e.turns, t, 'turns');
          }
          break;
        }
        case 'turnMeter': {
          // A drain is authored negative and a gift positive; both ride
          // the `meter` rung, away from zero either way.
          const gift = e.amount > 0;
          const now = gift ? e.amount + g('meter') : e.amount - g('meter');
          add(gift ? 'Turn meter given' : 'Turn meter drained',
            Math.abs(e.amount), Math.abs(now), 'pct');
          break;
        }
        case 'cleanse':
          if (e.count !== undefined) add('Debuffs lifted', e.count, e.count + g('cleanseCount'), 'n');
          break;
        case 'stripBuffs': case 'stealBuffs': case 'transferDebuffs': {
          const c = e.count === undefined ? 1 : e.count;
          add(e.type === 'stealBuffs' ? 'Boons stolen' : 'Boons stripped',
            c, c + g('stripCount'), 'n');
          break;
        }
        case 'revive':
          add('Revived at (max HP)', e.pct, e.pct + g('heal'), 'pct');
          break;
        case 'cooldownReduce': {
          const t = e.turns === undefined ? 1 : e.turns;
          add('Cooldowns cut', t, t + g('refund'), 'turns');
          break;
        }
        case 'extendBuffs': {
          const t = e.turns === undefined ? 1 : e.turns;
          add('Boons extended', t, t + g('duration'), 'turns');
          break;
        }
        case 'atkPerDebuff':
          add('ATK per fire lit', e.per, e.per + g('per'), 'n');
          break;
        case 'bubble': {
          const t = e.turns === undefined ? 2 : e.turns;
          add('Sealed for', t, t + g('duration'), 'turns');
          break;
        }
        // A ricochet hits, then rolls to leap and hit again. The hop
        // roll takes no rung (abilities.js:696) -- only the swing does.
        case 'bounce':
          add('Damage a hop (ATK)', e.mult, e.mult + g('mult'), 'pct');
          add('Hops again', e.chance === undefined ? 0.75 : e.chance,
            e.chance === undefined ? 0.75 : e.chance, 'pct');
          break;
        default:
          if (e.turns !== undefined && e.type !== 'taunt') {
            add('Lasts', e.turns, e.turns, 'turns');
          }
          break;
      }
      // The landing gate, wherever one is authored. Rolled BEFORE the
      // accuracy-versus-resistance contest, and capped at certainty.
      if (e.chance !== undefined && e.type !== 'bounce') {
        add('Lands', e.chance, Math.min(1, e.chance + g('debuffChance')), 'pct');
      }
      // Crowd/condition riders, on whichever effect carries them.
      if (e.perTarget) add('Per extra target', e.perTarget, e.perTarget + g('perTarget'), 'pct');
      if (e.perBurn) add('Per fire lit', e.perBurn, e.perBurn + g('perBurn'), 'pct');
      if (e.perMirror) add('Per mirror', e.perMirror, e.perMirror + g('perMirror'), 'pct');
      if (e.perDeath) add('Per death', e.perDeath, e.perDeath + g('perDeath'), 'pct');
    }
    // An ability-level chain: the skill re-fires on its own roll, and
    // THAT roll is what the `chain` rung buys (abilities.js:1562). It
    // hangs off the ability rather than any one effect, so it is read
    // after the effect loop.
    if (abilityDef.chain && typeof abilityDef.chain.chance === 'number') {
      add('Chains again', abilityDef.chain.chance,
        Math.min(1, abilityDef.chain.chance + g('chain')), 'pct');
    }
    if (abilityDef.cooldown > 0) {
      add('Cooldown', abilityDef.cooldown, skillCooldown(abilityDef, level), 'turns');
    }
    return out;
  }

  // Render one fact as the UI shows it. Kept beside the rule it formats
  // so a new `kind` cannot be added in one place and missed in the other.
  function factText(fact) {
    const pc = (v) => `${Math.round(v * 100)}%`;
    switch (fact.kind) {
      case 'pct': return pc(fact.now);
      // A multiplier read as its distance from neutral: 0.80 is "-20%".
      case 'signed': {
        const d = Math.round((fact.now - 1) * 100);
        return `${d > 0 ? '+' : ''}${d}%`;
      }
      case 'turns': return `${fact.now} turn${fact.now === 1 ? '' : 's'}`;
      default: return `${fact.now}`;
    }
  }

  function factWas(fact) {
    if (fact.base === fact.now) return '';
    const pc = (v) => `${Math.round(v * 100)}%`;
    switch (fact.kind) {
      case 'pct': return pc(fact.base);
      case 'signed': {
        const d = Math.round((fact.base - 1) * 100);
        return `${d > 0 ? '+' : ''}${d}%`;
      }
      case 'turns': return `${fact.base}`;
      default: return `${fact.base}`;
    }
  }

  // The readout as the sheets render it: one chip per fact, the earned
  // value in front and the base struck through behind it where a rung
  // has moved it. Lives here, beside the rules it formats, so the four
  // screens that show a skill cannot drift apart.
  function skillFactsHtml(abilityDef, level) {
    const facts = skillFacts(abilityDef, level);
    if (!facts.length) return '';
    const rows = facts.map((f) => {
      const was = factWas(f);
      return `<span class="sf"><span class="sf-k">${f.label}</span>` +
        (was ? `<s class="sf-was">${was}</s>` : '') +
        `<b class="sf-v${was ? ' sf-up' : ''}">${factText(f)}</b></span>`;
    });
    return `<div class="skill-facts">${rows.join('')}</div>`;
  }

  // Cooldown a skill shows at `level`, after its earned -1 rungs. Mirrors
  // Unit.cooldownFor so the sheet and the fight agree.
  function skillCooldown(abilityDef, level) {
    const base = (abilityDef && abilityDef.cooldown) || 0;
    if (base <= 0) return 0;
    return Math.max(1, base + (skillLadder(abilityDef, level).cooldown || 0));
  }

  return {
    MAX_STARS, maxLevel, STAR_POINTS, starValue, starUpCost, xpToNext,
    statMult, scaledStats, enemyXp,
    BOSS_MAX_STAGE, bossLevel, bossScaledStats, power,
    MAX_SKILL_LEVEL, skillPower,
    SKILL_RUNGS, skillRungs, maxSkillLevel, skillCap, skillLadder,
    skillBonusText, rungText, skillCooldown, skillFacts, factText, factWas, skillFactsHtml,
  };
})();
