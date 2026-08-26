// Ability resolution. Abilities are data (see js/data/heroes.js); this module
// turns an ability definition + caster + target into concrete effects.
//
// Ability definition shape:
//   {
//     id, name, description,
//     cooldown: N,            // turns; 0 = usable every turn
//     targeting: 'enemy' | 'ally' | 'self' | 'all-enemies' | 'all-allies',
//     effects: [ { type, ... } ],
//     animation: 'attack',    // which animation the caster plays
//   }
//
// Effect types implemented so far:
//   { type: 'damage', mult: 1.0 }         — mult × caster ATK, reduced by DEF
//   { type: 'heal',   mult: 0.5 }         — mult × caster ATK restored
//   { type: 'buff',   stat, mult, turns } — temporary stat multiplier
//   { type: 'debuff', stat, mult, turns } — temporary stat multiplier (< 1)

const Abilities = (() => {
  // Caster-state conditions an effect can key a bonus off, via
  //   { bonusWhen: { state: 'fullHp', mult: 2 } }
  // Named states rather than a predicate, so hero data stays data.
  const CASTER_STATES = {
    fullHp: (u) => u.hp >= u.maxHp,
    hurt: (u) => u.hp < u.maxHp,
    lowHp: (u) => u.hp / u.maxHp < 0.4,
    shielded: (u) => (u.shieldTotal ? u.shieldTotal() : 0) > 0,
  };

  function bonusWhenMult(effect, caster) {
    const cond = effect.bonusWhen;
    if (!cond) return 1;
    const test = CASTER_STATES[cond.state];
    return test && test(caster) ? cond.mult : 1;
  }

  function damageFormula(rawAtk, targetDef) {
    // Simple mitigation curve; keeps damage positive and DEF meaningful.
    const mitigation = targetDef / (targetDef + 300);
    return Math.max(1, Math.round(rawAtk * (1 - mitigation)));
  }

  // Meter-drain protection (Artur's Permanent Ink): a living teammate
  // carrying a meterGuard hook voids anything that would push this
  // unit's action bar backwards.
  function meterGuarded(victim) {
    const b = typeof Battle !== 'undefined' ? Battle.active : null;
    if (!b) return false;
    return b.livingUnits(victim.team).some((u) =>
      (u.hookSources ? u.hookSources() : []).some(
        (p) => p.hooks && p.hooks.meterGuard));
  }

  // Debuff landing roll: accuracy (attacker) offsets resistance
  // (defender); the land chance is floored at 15%.
  function debuffLands(caster, target) {
    // A caster may hold a `noResistWhenAfflicted` hook: once the target
    // is already carrying something hostile, nothing else of that
    // caster's is refused (Valere -- you took the first flower, you
    // will take the rest). Checked before the roll rather than folded
    // into accuracy, because it is a rule, not a number.
    for (const p of (caster.hookSources ? caster.hookSources() : [])) {
      if (!(p.hooks && p.hooks.noResistWhenAfflicted)) continue;
      const afflicted = (target.statusEffects || []).some(
        (fx) => fx.kind === 'debuff' || fx.kind === 'dot');
      if (afflicted) return true;
    }
    const resistance = target.debuffResistance ? target.debuffResistance() : 0;
    const accuracy = caster.debuffAccuracy ? caster.debuffAccuracy() : 0;
    const chance = Math.max(0.15, 1 - Math.max(0, resistance - accuracy));
    return Math.random() < chance;
  }

  // Anything TAKEN from an unwilling target is the same contest: laying
  // a debuff on them, tearing a blessing off them, or draining their
  // turn meter all roll the caster's accuracy against their resistance.
  // Giving something away (a buff, a heal, meter handed to an ally)
  // never rolls — nobody resists a gift.
  const takeLands = debuffLands;

  // Drain turn meter from an unwilling target, honouring both the guard
  // (Artur's Permanent Ink refuses the drain outright) and the
  // resistance contest. `frac` is the positive share of the bar to
  // remove. Exported so the ~dozen passives that reach for an enemy's
  // meter directly all obey the same rule.
  function drainMeter(caster, target, frac) {
    if (!target || !target.alive || !(frac > 0)) return null;
    if (meterGuarded(target)) {
      return { kind: 'meter', target, amount: 0, guarded: true };
    }
    if (caster && caster !== target && !takeLands(caster, target)) {
      return { kind: 'meter', target, amount: 0, resisted: true };
    }
    const before = target.turnMeter;
    target.turnMeter = Math.max(0, target.turnMeter - CONFIG.TURN_METER_MAX * frac);
    return { kind: 'meter', target,
      amount: (target.turnMeter - before) / CONFIG.TURN_METER_MAX };
  }

  // Resolve one effect against one unit. Returns a log-friendly result.
  // ---- The damage pipeline ----------------------------------------------
  // ONE path from a raw figure to HP actually lost, so nothing can score
  // damage by going around the defences. `raw` is the attacker's side of
  // the sum, already multiplied out; everything the defender gets to do
  // about it happens here:
  //
  //   DEF curve -> crit -> dodge -> guard/ward multipliers -> reflect
  //
  // Whatever the number was scaled off — ATK, DEF, max HP, or a passive
  // that just wants to deal 2% of something — it arrives here and is
  // mitigated the same way.
  //
  // The RNG is drawn in a fixed order (dodge, crit, reflect) so a seeded
  // replay stays a replay.
  function strike(caster, target, raw, opts = {}) {
    // Blocker (Lin): a planted guard absorbs every enemy hit aimed at a
    // front-row ally, a quarter softer for the stance. DoT ticks pass
    // redirect: false — a poison already in you cannot be bodyguarded.
    if (opts.redirect !== false && caster.team !== target.team &&
        target.slot && target.slot.position === POSITION.FRONT &&
        !target.statusEffects.some((fx) => fx.stat === 'blocker')) {
      const b = typeof Battle !== 'undefined' ? Battle.active : null;
      const guard = b && b.livingUnits(target.team).find((u) =>
        u !== target && u.slot &&
        u.statusEffects.some((fx) => fx.stat === 'blocker'));
      if (guard) {
        target = guard;
        raw *= 0.75;
        opts = { ...opts, dodge: false }; // a planted guard absorbs, never slips
      }
    }
    const dodged = opts.dodge === false
      ? false
      : Math.random() < (target.dodgeChance ? target.dodgeChance() : 0);
    // ignoreDef: a fraction of the target's DEF the blow slips past
    // (Ari's lancing shot) — the curve sees the rest.
    let dmg = damageFormula(raw,
      target.effectiveStat('def') * (1 - (opts.ignoreDef || 0)));
    let crit = false;
    if (opts.crit) {
      // critAdd: a per-hit crit-chance rider (Samuels's knives), on top
      // of whatever the caster's own chance already is.
      const chance = Math.min(1,
        caster.effectiveStat('critChance') + (opts.critAdd || 0));
      crit = Math.random() < chance;
      if (crit) dmg = Math.round(dmg * caster.effectiveStat('critDamage'));
    }
    if (dodged) {
      // Credit the dodger with the hit that never landed, then let
      // dodge-reactive passives answer (Oak's riposte).
      target.bookDodge(dmg);
      if (target.dodged) target.dodged(caster);
      return { kind: 'damage', target, amount: 0, dodged: true };
    }
    // Bubble (Tanner): a held breath that eats ONE entire hit, then
    // pops. Checked after the dodge — a hit that never came doesn't pop
    // it — and before everything else: the bubble takes the whole blow.
    const bi = target.statusEffects.findIndex((fx) => fx.kind === 'bubble');
    if (bi !== -1) {
      const fx = target.statusEffects[bi];
      target.statusEffects.splice(bi, 1);
      // The prevented hit is the bubble-blower's mitigation.
      if (typeof Meter !== 'undefined' && Meter.mitigated) {
        Meter.mitigated(fx.source || target, dmg);
      }
      return { kind: 'damage', target, amount: 0, bubbled: true };
    }
    // Defensive multipliers (guard passives, wards, resonance) blunt the
    // hit. blunt() books who prevented what — a ward cast by a support
    // belongs to that support, not to the ally standing behind it.
    dmg = target.blunt(dmg, { attacker: caster });
    // Reflect (Boar set 6pc / bristle passives): the whole hit bounces
    // back to the attacker instead of landing. Skipped when there is no
    // blow to bounce — a poison already inside you is not incoming.
    if (opts.reflect !== false &&
        target.reflectChance && Math.random() < target.reflectChance()) {
      const bounced = caster.takeDamage(dmg, target);
      target.bookReflect(dmg, bounced);
      return { kind: 'damage', target, amount: 0, reflected: true,
        reflectAmount: bounced };
    }
    const dealt = target.takeDamage(dmg, caster);
    // DEF buffs pushed the target up the mitigation curve; the slice the
    // curve turned away because of them is the buffers' mitigation.
    if (target.defGuardCredit) target.defGuardCredit(dmg);
    // A hit is rarely one hero's work: an ATK buff, a crit buff, a shove
    // up the action bar or an armour break on the target all bought part
    // of it. bookDamage splits the credit and books the remainder here.
    if (opts.assist === false) Meter.damage(caster, dealt);
    else caster.bookDamage(target, dealt, crit);
    // Hooks that answer landing a blow (Javarious builds his shield out
    // of his own damage). After the books, so a hook sees a settled hit.
    if (caster.dealt) caster.dealt(dealt, target);
    // Crystalline (Polarus): striking a hero wearing the crystal is how
    // you catch the cold — 30% chance the attacker freezes. Guarded like
    // retaliation so a frozen counter can never chain into another.
    if (!Unit.retaliating && dealt > 0 && caster.alive &&
        caster.team !== target.team &&
        target.statusEffects.some((fx) => fx.kind === 'buff' && fx.stat === 'crystalline') &&
        Math.random() < 0.30 + (target.synergyFreezeChance || 0)) {
      Unit.retaliating = true;
      try {
        const r = freeze(target, caster);
        const battle = typeof Battle !== 'undefined' ? Battle.active : null;
        if (battle && r && !r.resisted) {
          battle.addFloatingText(caster, '❄ FROZEN', '#8ee8ff', true);
          battle.log(`${caster.name} strikes the crystal and freezes solid for ${r.turns} turns!`, 'log-system');
        }
      } finally {
        Unit.retaliating = false;
      }
    }
    return { kind: 'damage', target, amount: dealt, crit };
  }

  // The battle the current execute() is resolving in, for effects that
  // fire deeper in the pipeline than the battle reference travels.
  let currentBattle = null;
  // The ability being resolved, for hooks that fire deeper in the
  // pipeline than the ability reference travels. A passive that only
  // pays out on ONE of its hero's skills (Noctelle's Moth Dust) reads
  // this rather than every skill having to carry a rider.
  let currentAbility = null;

  // Freeze: the ice-flavored stun — the frozen unit loses its turns.
  // One door for every source (Polarus's bolt, the Crystalline counter,
  // his passive) so the resist check and the freezer's onFroze hooks
  // (the Frost Throne's cooldown refund) always run together.
  function freeze(caster, target, turns = 2, battle = null) {
    if (!target.alive) return null;
    if (!debuffLands(caster, target)) {
      return { kind: 'debuff', target, stat: 'freeze', resisted: true };
    }
    target.addStatusEffect({ kind: 'debuff', stat: 'freeze', turns, source: caster });
    for (const p of (caster.hookSources ? caster.hookSources() : [])) {
      if (p.hooks && p.hooks.onFroze) p.hooks.onFroze(caster, target);
    }
    // Team-wide watchers: everyone opposing the frozen unit hears about
    // it, whoever landed the ice (Angelica's tally counts the King's
    // freezes as gladly as her own).
    const b = battle || currentBattle ||
      (typeof Battle !== 'undefined' ? Battle.active : null);
    if (b) {
      for (const u of b.livingUnits()) {
        if (u.team === target.team) continue;
        for (const p of (u.hookSources ? u.hookSources() : [])) {
          if (p.hooks && p.hooks.onEnemyFrozen) p.hooks.onEnemyFrozen(u, target, caster, b);
        }
      }
    }
    return { kind: 'freeze', target, turns };
  }

  // Healing past full is information some heroes act on (Cain turns the
  // overflow into damage). Fired for every direct heal that overshoots,
  // with the battle resolved the same way freeze resolves it.
  function notifyOverheal(caster, overflow, target) {
    if (overflow <= 0) return;
    const b = currentBattle ||
      (typeof Battle !== 'undefined' ? Battle.active : null);
    for (const p of (caster.hookSources ? caster.hookSources() : [])) {
      if (p.hooks && p.hooks.onOverheal) {
        p.hooks.onOverheal(caster, { overflow, target, battle: b });
      }
    }
  }

  // `power` is the caster's skill-level multiplier for the ability this
  // effect belongs to; it scales damage/heal/poison numbers only.
  function applyEffect(effect, caster, target, power = 1) {
    switch (effect.type) {
      case 'damage':
      case 'damageDef':
      case 'damageHp': {
        // 'damageDef' scales off the caster's DEF instead of ATK (Boar
        // tank-bruiser kits, Toll's bell) and 'damageHp' off the
        // caster's own MAX HP (Franz's bonks); everything downstream is
        // identical, which is the point — a big DEF or HP stat must not
        // be a way around the mitigation curve.
        const scaleStat = effect.type === 'damageDef' ? 'def' : 'atk';
        const scaleBase = effect.type === 'damageHp'
          ? caster.maxHp : caster.effectiveStat(scaleStat);
        // perMirror: extra multiplier per active crystal mirror (Echo).
        // perDeath: extra multiplier per body already on the field this
        // fight, either side (Morrow swings the weight of everyone he
        // has buried). Uncapped on purpose -- it only gets big in a
        // fight that has already gone badly for somebody.
        const bodies = (currentBattle && currentBattle.deaths) ||
          ((typeof Battle !== 'undefined' && Battle.active &&
            Battle.active.deaths) || 0);
        // Ladder rungs (docs/skill-level-process.md) add points to the
        // modifier rather than multiplying it. `perMirror` gets its own
        // rung value because on a mirror-scaled kit the per-mirror term
        // IS the skill — raising only the flat part would make a
        // level-up worth a fraction of what it is worth on anyone else.
        const lad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        const mult = effect.mult + (lad.mult || 0) +
          ((effect.perMirror || 0) + (lad.perMirror || 0)) * (caster.mirrors || 0) +
          ((effect.perDeath || 0) + (lad.perDeath || 0)) * bodies;
        const elemMult = Elements.mult(caster.element, target.element);
        let raw = scaleBase * mult * power *
          caster.damageDealtMult(target, currentAbility) * elemMult;
        // Combo hits: multiplied damage against a marked status — by
        // stat (methane fog) or by kind (detonating poisons).
        // Conditional on the CASTER's own state (Javarious at full HP).
        raw *= bonusWhenMult(effect, caster);
        if (effect.bonusVs && target.statusEffects.some((fx) =>
            (effect.bonusVs.stat && fx.stat === effect.bonusVs.stat) ||
            (effect.bonusVs.kind && fx.kind === effect.bonusVs.kind))) {
          raw *= effect.bonusVs.mult;
        }
        // Conditional on where the TARGET stands (Sawyer hunts the
        // center hex). Position is a battle-grid fact, so this only
        // fires in real formations — bench duels have no hexes.
        if (effect.bonusPosition && target.slot &&
            target.slot.position === effect.bonusPosition.position) {
          raw *= effect.bonusPosition.mult;
        }
        // Flat riders scaled off the TARGET's max HP (Ari): from the
        // effect itself and from targetHpBonus hooks. Added after the
        // multipliers — the rider is a share of the victim, not of the
        // swing — then mitigated like everything else.
        let hpFrac = effect.targetHpPct || 0;
        for (const p of (caster.hookSources ? caster.hookSources() : [])) {
          if (p.hooks && p.hooks.targetHpBonus) hpFrac += p.hooks.targetHpBonus;
        }
        if (hpFrac > 0) raw += target.maxHp * hpFrac;
        const hit = { ...strike(caster, target, raw,
          { crit: true, critAdd: effect.critAdd, ignoreDef: effect.ignoreDef }),
          elem: elemMult };
        // `healDealt` turns the wound into a mend: a share of the damage
        // ACTUALLY dealt (post-mitigation, post-dodge) is handed to
        // someone on the caster's side. `to` picks who — 'lowest-ally'
        // hunts the ally in the worst shape, 'self' keeps it. A dodged
        // or absorbed hit heals nothing, which is the point.
        if (effect.healDealt && hit.amount > 0) {
          const mends = drainToAllies(effect.healDealt, caster, hit.amount);
          if (mends.length) return [hit, ...mends];
        }
        return hit;
      }
      case 'heal': {
        const boost = 1 + (caster.healingBoost ? caster.healingBoost() : 0);
        const amount = Math.round(caster.effectiveStat('atk') * effect.mult * power * boost);
        // ATK-scaled, so an attack buff on the healer multiplied this
        // mend and its granter takes that share of the credit.
        if (target.healBlocked()) return { kind: 'heal', target, amount: 0, blocked: true };
        const healed = target.heal(amount, caster, { assists: caster.healAssists(true) });
        notifyOverheal(caster, amount - healed, target);
        return { kind: 'heal', target, amount: healed };
      }
      case 'healHpPct': {
        // Heal scaled off the CASTER's max HP; optional bigger cut for
        // front-row targets. `targetPct` scales off the TARGET's pool
        // instead (Koe's mime remedy fits whoever receives it).
        const front = target.slot && target.slot.position === POSITION.FRONT;
        // Heal rungs add points to the percentage. HP-priced numbers
        // move in fives, not tens: a percentage of a health pool is a
        // far larger figure than a percentage of an attack stat.
        const healLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        const pct = (front && effect.frontPct ? effect.frontPct
          : (effect.pct ?? effect.targetPct)) + (healLad.heal || 0);
        const hpBoost = 1 + (caster.healingBoost ? caster.healingBoost() : 0);
        const pool = effect.targetPct && !effect.pct ? target.maxHp : caster.maxHp;
        const amount = Math.round(pool * pct * power * hpBoost);
        if (target.healBlocked()) return { kind: 'heal', target, amount: 0, blocked: true };
        const healed = target.heal(amount, caster,
          { assists: caster.healAssists(false) }); // max-HP scaled: gifts only
        notifyOverheal(caster, amount - healed, target);
        return { kind: 'heal', target, amount: healed };
      }
      case 'healPerDot': {
        // Esmerelda's gathering: an ATK-scaled heal that grows with
        // every DoT currently ticking on the ENEMY team — the fires on
        // the field are the medicine.
        const b = currentBattle ||
          (typeof Battle !== 'undefined' ? Battle.active : null);
        const foes = b
          ? b.livingUnits().filter((u) => u.team !== caster.team) : [];
        const count = foes.reduce((n, u) =>
          n + u.statusEffects.filter((fx) => fx.kind === 'dot').length, 0);
        if (count === 0) return { kind: 'heal', target, amount: 0 };
        const boost = 1 + (caster.healingBoost ? caster.healingBoost() : 0);
        const amount = Math.round(caster.effectiveStat('atk') * effect.pct *
          count * power * boost);
        const healed = target.heal(amount, caster,
          { assists: caster.healAssists(true) });
        notifyOverheal(caster, amount - healed, target);
        return { kind: 'heal', target, amount: healed };
      }
      case 'hot': {
        // Heal-over-time: fixed amount (locked at cast) at the start of
        // each of the target's turns.
        target.addStatusEffect({
          kind: 'hot',
          amount: Math.round(caster.maxHp * effect.pct * power *
            (1 + (caster.healingBoost ? caster.healingBoost() : 0))),
          turns: effect.turns,
          source: caster, // so each tick is credited to whoever cast it
        });
        return { kind: 'hot', target, turns: effect.turns };
      }
      case 'damageHpPct': {
        // Scaled off the caster's max HP rather than a combat stat, and
        // mitigated like everything else — a large HP pool is not a way
        // around the DEF curve any more than a large DEF stat is.
        const raw = caster.maxHp * effect.pct * power *
          caster.damageDealtMult(target, currentAbility) *
          Elements.mult(caster.element, target.element);
        return strike(caster, target, raw);
      }
      case 'shield': {
        // A pool that eats damage before HP. Scaled off the caster's ATK
        // like a heal, and boosted by the same healing modifiers -- both
        // are HP the target does not lose.
        //
        // `pct` scales off the caster's own MAX HP instead, the way
        // healHpPct and hot already do, for a caster whose whole kit is
        // priced off her pool rather than her attack (Lenore).
        const boost = 1 + (caster.healingBoost ? caster.healingBoost() : 0);
        const base = effect.pct !== undefined
          ? caster.maxHp * effect.pct
          : caster.effectiveStat('atk') * effect.mult;
        const amount = Math.round(base * power * boost);
        const gained = target.addShield(amount, effect.turns, caster);
        return { kind: 'shield', target, amount: gained, turns: effect.turns };
      }
      case 'taunt': {
        // Force attackers onto this unit for a few turns.
        target.addStatusEffect({ kind: 'buff', stat: 'taunt', turns: effect.turns || 2 });
        return { kind: 'taunt', target, turns: effect.turns || 2 };
      }
      case 'mirrors': {
        // Replenish crystal mirrors (clamped to the unit's own maximum).
        const gained = target.addMirrors ? target.addMirrors(effect.count) : 0;
        return { kind: 'mirrors', target, amount: gained };
      }
      case 'cleanse': {
        // Strip debuffs (poisons included) from the target — all of
        // them, or only the oldest `count` when the effect names a
        // limit (Leonardo lifts two, not everything).
        const cleanseLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        let left = effect.count
          ? effect.count + (cleanseLad.cleanseCount || 0) : Infinity;
        let removed = 0;
        target.statusEffects = target.statusEffects.filter((fx) => {
          if ((fx.kind !== 'debuff' && fx.kind !== 'dot') || left <= 0) return true;
          left--; removed++;
          return false;
        });
        return { kind: 'cleanse', target, count: removed };
      }
      case 'revive': {
        if (target.alive) return null;
        target.revive(effect.pct, caster);
        return { kind: 'revive', target, amount: target.hp };
      }
      case 'turnMeter': {
        // Push the target's action bar by a fraction of max (negative cuts).
        // A cut is refused outright while a meterGuard ally stands
        // (Artur's Permanent Ink).
        if (effect.amount < 0) {
          // Taking meter is a contest; the helper owns the guard and
          // the resistance roll alike. A `meter` rung deepens the drain.
          const mLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
          return drainMeter(caster, target, -effect.amount + (mLad.meter || 0));
        }
        const before = target.turnMeter;
        // No ceiling. Meters overfill past TURN_METER_MAX so that turn
        // order among everyone already at 100% stays concrete, and
        // clamping here made a gift into a punishment: pushing a unit
        // sitting at 140% "up" by 30% used to drop them to 100%.
        target.turnMeter = Math.max(0,
          target.turnMeter + effect.amount * CONFIG.TURN_METER_MAX);
        // Remember who paid for the push, so the turn it buys can credit
        // its damage back (see Unit.outgoingAssists).
        const gained = target.turnMeter - before;
        if (gained > 0 && target !== caster && target.meterGifts) {
          target.meterGifts.push({ source: caster, amount: gained });
        }
        return { kind: 'meter', target, amount: effect.amount };
      }
      case 'dot': {
        // Poison / damage-over-time: locked in at cast off the caster's
        // ATK, amplified by DoT boosts, resisted like any debuff.
        // `targetHpPct` scales the tick off the VICTIM's max HP instead
        // (Lucian's burn), and `flavor` names the debuff for anything
        // that asks who is burning.
        if (!debuffLands(caster, target)) {
          return { kind: 'debuff', target, stat: 'dot', resisted: true };
        }
        const amount = effect.targetHpPct
          ? Math.round(target.maxHp * effect.targetHpPct * power *
              (1 + caster.dotBoost()))
          : Math.round(caster.effectiveStat('atk') * effect.pct *
              power * (1 + caster.dotBoost()));
        // Clinging-flame passives can extend inflicted DoT durations.
        let dotTurns = effect.turns;
        for (const p of (caster.hookSources ? caster.hookSources() : caster.passives || [])) {
          if (p.hooks && p.hooks.dotExtraTurns) dotTurns += p.hooks.dotExtraTurns;
        }
        target.addStatusEffect({ kind: 'dot', amount, turns: dotTurns,
          flavor: effect.flavor || null, source: caster });
        return { kind: 'dot', target, amount, turns: dotTurns,
          flavor: effect.flavor || null };
      }
      case 'atkPerDebuff': {
        // Forge heat (Lucian): permanent flat ATK for each enemy
        // carrying the named DoT flavor right now, banked up to a
        // per-battle cap — the fight itself is the fuel.
        const b = currentBattle ||
          (typeof Battle !== 'undefined' ? Battle.active : null);
        const foes = b
          ? b.livingUnits().filter((u) => u.team !== caster.team) : [];
        const count = foes.filter((u) => u.statusEffects.some((fx) =>
          fx.kind === 'dot' && fx.flavor === effect.flavor)).length;
        const banked = caster.forgeBanked || 0;
        const gain = Math.max(0, Math.min(effect.cap - banked, count * effect.per));
        if (gain > 0) {
          caster.forgeBanked = banked + gain;
          caster.baseAtk += gain;
        }
        return { kind: 'forge', target: caster, amount: gain, count,
          banked: caster.forgeBanked || 0, cap: effect.cap };
      }
      case 'bounce': {
        // A ricochet (Lucian): hit, then `chance` to leap to another
        // enemy and hit again, indefinitely. With one enemy standing it
        // bounces back into them. Each hop is a full ordinary strike.
        const b = currentBattle ||
          (typeof Battle !== 'undefined' ? Battle.active : null);
        const results = [];
        let mark = target;
        for (let hops = 0; hops < 30; hops++) { // runaway guard: p(30)≈2e-4
          results.push(applyEffect(
            { type: 'damage', mult: effect.mult }, caster, mark, power));
          if (Math.random() >= (effect.chance ?? 0.75)) break;
          const foes = b
            ? b.livingUnits().filter((u) => u.team !== caster.team)
            : (mark.alive ? [mark] : []);
          if (!foes.length) break;
          const others = foes.filter((u) => u !== mark);
          mark = others.length
            ? others[Math.floor(Math.random() * others.length)] : foes[0];
        }
        return results;
      }
      case 'stun': {
        // Stun: the target skips its next turn(s). `chance` gates the
        // roll (default always), then resistance applies like a debuff.
        if (effect.chance !== undefined && Math.random() >= effect.chance) {
          return null; // the stun simply doesn't trigger — no log noise
        }
        if (!debuffLands(caster, target)) {
          return { kind: 'debuff', target, stat: 'stun', resisted: true };
        }
        const turns = effect.turns || 1;
        target.addStatusEffect({ kind: 'debuff', stat: 'stun', turns });
        return { kind: 'stun', target, turns };
      }
      case 'buff':
      case 'debuff': {
        // Debuffs can be resisted (accuracy vs resistance); buffs always
        // land. Debuffer passives can extend applied debuff durations.
        let turns = effect.turns;
        const ladder = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        // Duration rungs extend BUFFS only. An ability can carry a buff
        // and a debuff at once -- Morrow's Wisteria wards himself while
        // taunting the enemy team -- and a blanket rung would silently
        // lengthen the hex as well as the ward. Debuff duration is not
        // one of the four rules; if it ever becomes one it needs to say
        // which half of a mixed skill it lengthens.
        if (effect.type === 'buff' && ladder.duration) turns += ladder.duration;
        // Severity rungs move the debuff AWAY FROM NEUTRAL, so the same
        // rung reads correctly on a reduction and an amplification
        // alike: a -30% DEF break (mult 0.70) deepens to 0.65, while a
        // +30% damage-taken mark (mult 1.30) rises to 1.35.
        let mult = effect.mult;
        const severity = ladder.debuffPower || 0;
        if (severity > 0 && typeof mult === 'number' && effect.type === 'debuff') {
          mult = mult < 1 ? Math.max(0, mult - severity) : mult + severity;
        }
        if (effect.type === 'debuff') {
          // Base application chance (docs/skill-level-process.md): a
          // separate gate rolled BEFORE the accuracy-versus-resistance
          // contest, so a swept debuff is a coin flip at level 1 and a
          // certainty once its chance rungs are bought. Effects with no
          // `chance` are unswept and always attempt, as they always did.
          if (effect.chance !== undefined) {
            const odds = Math.min(1, effect.chance + (ladder.debuffChance || 0));
            if (Math.random() >= odds) {
              return { kind: 'debuff', target, stat: effect.stat, missed: true };
            }
          }
          if (!debuffLands(caster, target)) {
            return { kind: 'debuff', target, stat: effect.stat, resisted: true };
          }
          for (const p of (caster.hookSources ? caster.hookSources() : caster.passives || [])) {
            if (p.hooks && p.hooks.debuffExtraTurns) turns += p.hooks.debuffExtraTurns;
          }
          // Dark resonance 7pc: a coin flip for one more turn of misery.
          if (caster.synergyDebuffExtraChance > 0 &&
              Math.random() < caster.synergyDebuffExtraChance) {
            turns += 1;
          }
        }
        // Buff severity rungs, mirroring debuffPower: `mult` moves away
        // from 1, and an `add`-style grant (Eli's flat crit chance) takes
        // the points straight on.
        let addAmt = effect.add;
        if (effect.type === 'buff' && ladder.buffPower) {
          if (typeof mult === 'number') {
            mult = mult < 1 ? Math.max(0, mult - ladder.buffPower) : mult + ladder.buffPower;
          }
          if (typeof addAmt === 'number') {
            addAmt = addAmt < 0 ? addAmt - ladder.buffPower : addAmt + ladder.buffPower;
          }
        }
        if (effect.type === 'buff' && target.buffsSealed()) {
          return { kind: 'buff', target, stat: effect.stat, sealed: true };
        }
        target.addStatusEffect({
          kind: effect.type,
          stat: effect.stat,
          // `mult`, not `effect.mult`: severity rungs have already been
          // folded in above.
          mult,
          // Who granted it. A damageTaken ward is a support's whole
          // contribution, and without this the mitigation it produces is
          // credited to the ally who was not hit.
          source: caster,
          add: addAmt,
          turns,
        });
        return { kind: effect.type, target, stat: effect.stat, turns };
      }
      case 'freeze': {
        // `chance` gates the roll (default always); the Cryst sect pack
        // sharpens every freeze roll; resistance applies like any
        // debuff inside freeze() itself.
        // A freeze is a chance-gated hostile effect like any other hex,
        // so its gate takes debuffChance rungs too.
        const fLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        if (effect.chance !== undefined &&
            Math.random() >= Math.min(1, effect.chance + (fLad.debuffChance || 0) +
              (caster.synergyFreezeChance || 0))) {
          return null; // no trigger, no log noise
        }
        return freeze(caster, target, effect.turns || 2);
      }
      case 'bubble': {
        // A blue glass sphere around the target: it absorbs one whole
        // incoming hit, pops, and is gone. Recasting refreshes the timer
        // instead of stacking a second sphere.
        const turns = effect.turns || 2;
        const held = target.statusEffects.find((fx) => fx.kind === 'bubble');
        if (held) {
          held.turns = turns;
          return { kind: 'bubble', target, turns, refreshed: true };
        }
        target.addStatusEffect({ kind: 'bubble', turns, source: caster });
        return { kind: 'bubble', target, turns };
      }
      case 'stripBuffs': {
        // Tear buffs OFF an enemy — the hostile mirror of cleanse:
        // oldest first, up to `count`. A caster with a stripBurnChance
        // hook (Cleo's Cruel Fortune) may replace each torn buff with a
        // 2-turn burn — the roll is the whole gate, like the sect oil.
        // A rider strip (Tumble's whirl) rolls per target before it
        // reaches for anything.
        if (effect.chance !== undefined && Math.random() >= effect.chance) {
          return { kind: 'stripBuff', target, count: 0, rolled: true };
        }
        // Tearing a blessing off is taking something from an unwilling
        // target, so it answers to accuracy against resistance like any
        // debuff would.
        if (!takeLands(caster, target)) {
          return { kind: 'stripBuff', target, count: 0, resisted: true };
        }
        let left = effect.count || 1;
        let removed = 0;
        target.statusEffects = target.statusEffects.filter((fx) => {
          if (fx.kind !== 'buff' || left <= 0) return true;
          left--; removed++;
          return false;
        });
        if (removed === 0) return { kind: 'stripBuff', target, count: 0 };
        let burnChance = 0;
        for (const p of (caster.hookSources ? caster.hookSources() : [])) {
          if (p.hooks && p.hooks.stripBurnChance) burnChance += p.hooks.stripBurnChance;
        }
        let burned = 0;
        for (let i = 0; i < removed; i++) {
          if (burnChance > 0 && Math.random() < burnChance) {
            target.addStatusEffect({ kind: 'dot', turns: 2, flavor: 'burn',
              amount: Math.round(target.maxHp * 0.03), source: caster });
            burned++;
          }
        }
        // Anyone who profits from tearing buffs off hears about it —
        // Tumble's Chime Tax turns each one into turn meter.
        const prevOwner = Unit.hookOwner;
        Unit.hookOwner = caster;
        try {
          for (const p of (caster.hookSources ? caster.hookSources() : [])) {
            if (p.hooks && p.hooks.onStripBuff) {
              p.hooks.onStripBuff(caster, { count: removed, target });
            }
          }
        } finally { Unit.hookOwner = prevOwner; }
        return { kind: 'stripBuff', target, count: removed, burned };
      }
      case 'transferDebuffs': {
        // The inverse of stealBuffs: every affliction on the CASTER'S
        // OWN SIDE comes off and goes onto one enemy, keeping whatever
        // turns it had left. A taking like any other, so it contests --
        // though by then the target is usually already carrying
        // something, which is exactly when Valere cannot be refused.
        const b = currentBattle ||
          (typeof Battle !== 'undefined' ? Battle.active : null);
        if (!b) return null;
        const mine = b.livingUnits(caster.team);
        const hostile = (fx) => fx.kind === 'debuff' || fx.kind === 'dot';
        const moving = mine.flatMap((ally) => ally.statusEffects.filter(hostile));
        if (moving.length === 0) return { kind: 'transferDebuffs', target, count: 0 };
        // Rolled BEFORE anything is lifted, so a refusal leaves every
        // affliction exactly where it was rather than needing to be put
        // back on the right ally afterwards.
        if (!takeLands(caster, target)) {
          return { kind: 'transferDebuffs', target, count: 0, resisted: true };
        }
        for (const ally of mine) {
          ally.statusEffects = ally.statusEffects.filter((fx) => !hostile(fx));
        }
        for (const fx of moving) {
          // Re-sourced to the man who handed it over: a poison ticking
          // on an enemy must not credit the enemy who first cast it.
          target.addStatusEffect({ ...fx, source: caster });
        }
        return { kind: 'transferDebuffs', target, count: moving.length,
          stats: moving.map((fx) => fx.stat || fx.kind) };
      }
      case 'soulBond': {
        // Tie the thread. An ordinary debuff so it cleanses, resists
        // and is read off the plate like anything else hostile -- but
        // it does not expire on a clock: it holds until the target dies
        // or somebody cuts it. Only one at a time; the ability that
        // casts it is gated on that (see Unit.blockedByOwnStatus).
        if (!debuffLands(caster, target)) {
          return { kind: 'debuff', target, stat: 'soulbond', resisted: true };
        }
        target.addStatusEffect({ kind: 'debuff', stat: 'soulbond',
          turns: Infinity, source: caster });
        return { kind: 'soulBond', target };
      }
      case 'cooldownReduce': {
        // Hand an ally their skills back early. The ability being cast
        // is skipped -- a refresh that refreshed itself would never go
        // on cooldown at all -- and a skill already ready is untouched
        // rather than driven negative.
        const by = effect.turns || 1;
        let moved = 0;
        for (const a of (target.abilities || [])) {
          if (a.def === currentAbility) continue;
          if (a.cooldownRemaining <= 0) continue;
          const was = a.cooldownRemaining;
          a.cooldownRemaining = Math.max(0, was - by);
          moved += was - a.cooldownRemaining;
        }
        return { kind: 'cooldownReduce', target, turns: by, moved };
      }
      case 'extendBuffs': {
        // Hold the note: every blessing the target is wearing runs
        // longer. Buffs only -- a debuff is somebody else's chord --
        // and it creates nothing, so a target with nothing on stays
        // with nothing on.
        const by = effect.turns || 1;
        let held = 0;
        for (const fx of target.statusEffects) {
          if (fx.kind !== 'buff') continue;
          fx.turns += by;
          held++;
        }
        return { kind: 'extendBuffs', target, turns: by, count: held };
      }
      case 'detonate': {
        // Cash a damage-over-time in for everything it had left: the
        // remaining ticks land at once and the poison is gone. Not a
        // new debuff and not a recolour of one -- the player reads the
        // ordinary poison plate and knows exactly what is about to be
        // spent.
        //
        // EVERY dot on the target goes up, not only the caster's own,
        // so a Firetroupe burn is as good a fuse as Sable's own poison.
        // Ticks are locked in at cast, so the sum is exact: detonating
        // deals precisely what waiting would have.
        const fuses = target.statusEffects.filter((fx) => fx.kind === 'dot');
        if (fuses.length === 0) return null;
        const frac = effect.frac === undefined ? 1 : effect.frac;
        let total = 0, turns = 0;
        for (const fx of fuses) {
          total += fx.amount * Math.max(0, fx.turns) * frac;
          turns += Math.max(0, fx.turns);
        }
        total = Math.round(total);
        target.statusEffects = target.statusEffects.filter((fx) => fx.kind !== 'dot');
        if (total <= 0) return { kind: 'detonate', target, amount: 0, fuses: fuses.length };
        // Through the same pipe a tick uses: you cannot dodge a poison
        // already in you, and there is no incoming blow to reflect.
        const hit = strike(caster, target, total,
          { dodge: false, reflect: false, redirect: false });
        return { kind: 'detonate', target, amount: hit.amount,
          fuses: fuses.length, turns };
      }
      case 'stealBuffs': {
        // Not a strip: the blessing comes OFF them and goes ON him,
        // carrying whatever turns it had left. Oldest first, up to
        // `count`. Taking something from an unwilling target is a
        // contest like any debuff, and a caster whose own buffs are
        // sealed still takes them away — he just cannot wear them.
        if (!takeLands(caster, target)) {
          return { kind: 'stealBuff', target, count: 0, resisted: true };
        }
        const taken = [];
        let left = effect.count || 1;
        target.statusEffects = target.statusEffects.filter((fx) => {
          if (fx.kind !== 'buff' || left <= 0) return true;
          left--; taken.push(fx);
          return false;
        });
        for (const fx of taken) {
          // Re-sourced to the thief: the numbers it produces from here
          // on are his, not the support's who cast it.
          caster.addStatusEffect({ ...fx, source: caster });
        }
        // A steal is still a removal, so anyone paid for tearing
        // blessings off (Tumble's Chime Tax) is paid for this too.
        const prevOwner = Unit.hookOwner;
        Unit.hookOwner = caster;
        try {
          for (const p of (caster.hookSources ? caster.hookSources() : [])) {
            if (p.hooks && p.hooks.onStripBuff) {
              p.hooks.onStripBuff(caster, { count: taken.length, target });
            }
          }
        } finally { Unit.hookOwner = prevOwner; }
        return { kind: 'stealBuff', target, count: taken.length,
          stats: taken.map((fx) => fx.stat) };
      }
      case 'healBlock': {
        // Cut them off from help. An ordinary debuff, so it cleanses,
        // resists and expires like the rest, and `stat` is a flag
        // rather than a number the way freeze and the seal are.
        const turns = effect.turns || 2;
        if (!debuffLands(caster, target)) {
          return { kind: 'debuff', target, stat: 'healblock', resisted: true };
        }
        const held = target.statusEffects.find(
          (fx) => fx.kind === 'debuff' && fx.stat === 'healblock');
        if (held) {
          held.turns = Math.max(held.turns, turns);
          return { kind: 'healBlock', target, turns: held.turns, refreshed: true };
        }
        target.addStatusEffect({ kind: 'debuff', stat: 'healblock', turns,
          source: caster });
        return { kind: 'healBlock', target, turns };
      }
      case 'buffBlock': {
        // Seal the target against every new blessing for a few turns.
        // Written as an ordinary debuff so it cleanses, resists and
        // expires like the rest; `stat` is a flag, not a number, the
        // same way freeze is.
        const turns = effect.turns || 3;
        if (!debuffLands(caster, target)) {
          return { kind: 'debuff', target, stat: 'buffblock', resisted: true };
        }
        const held = target.statusEffects.find(
          (fx) => fx.kind === 'debuff' && fx.stat === 'buffblock');
        if (held) {
          held.turns = Math.max(held.turns, turns);
          return { kind: 'buffBlock', target, turns: held.turns, refreshed: true };
        }
        target.addStatusEffect({ kind: 'debuff', stat: 'buffblock', turns,
          source: caster });
        return { kind: 'buffBlock', target, turns };
      }
      case 'swapRank': {
        // Haul a back-line enemy out from behind their wall, and put
        // whoever was covering them in the back. The flower pairs by
        // ROW — every back hex has exactly one front hex level with it
        // — so "the one in front of you" is never ambiguous.
        //
        // The trade is symmetric, so it reads the same whichever end of
        // the row was struck; the middle column has no partner and is
        // left alone.
        const battle = currentBattle;
        if (!battle || !target.slot) return null;
        const here = target.slot;
        if (here.position === POSITION.CENTER) return null;
        const wantFront = here.position === POSITION.BACK;
        const slots = (battle.slotsFor ? battle.slotsFor(target.team) : [])
          .filter((sl) => sl.position ===
            (wantFront ? POSITION.FRONT : POSITION.BACK));
        const partner = slots
          .sort((a, b) => Math.abs(a.y - here.y) - Math.abs(b.y - here.y))[0];
        if (!partner || partner === here) return null;
        const other = battle.units.find(
          (u) => u.slot === partner && u.team === target.team && u.alive);
        // Both halves of the link are repaired: the hexes' occupants and
        // the fighters' hexes, so nothing on the board disagrees.
        here.unit = other || null;
        partner.unit = target;
        target.slot = partner;
        if (other) other.slot = here;
        return { kind: 'swapRank', target, other, toFront: wantFront };
      }
      case 'rotateFormation': {
        // Spin a whole side one hex around its own middle. The six ring
        // hexes are ordered by their angle on SCREEN, so "clockwise"
        // means clockwise as the player sees it — the enemy flower is
        // drawn mirrored, and reading the geometry rather than the slot
        // numbering keeps the spin honest on either side of the field.
        // The middle hex is the pivot and never moves.
        //
        // What it costs the victim is position: front-line bruisers are
        // carried into the back, back-line casters are swung onto the
        // front, and every positional bonus is recomputed from where
        // they land.
        const battle = currentBattle;
        if (!battle) return null;
        const side = effect.side === 'allies' ? caster.team : caster.enemyTeam();
        const slots = (battle.slotsFor ? battle.slotsFor(side) : [])
          .filter((sl) => sl.position !== POSITION.CENTER);
        if (slots.length < 2) return null;
        const cx = slots.reduce((a, sl) => a + sl.x, 0) / slots.length;
        const cy = slots.reduce((a, sl) => a + sl.y, 0) / slots.length;
        // Screen y grows downward, so ascending atan2 IS clockwise.
        const ring = [...slots].sort((a, b) =>
          Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
        if (effect.dir === 'ccw') ring.reverse();
        // Who stands where comes off the unit list rather than the
        // hexes' own back-pointers, so a half-built board (or a corpse
        // still lying in its hex) cannot desync the spin.
        const standing = battle.units.filter((u) => u.slot && u.team === side);
        const riders = ring.map((sl) => standing.find((u) => u.slot === sl) || null);
        if (!riders.some(Boolean)) return null;
        let moved = 0;
        ring.forEach((sl, i) => {
          const rider = riders[(i - 1 + ring.length) % ring.length];
          sl.unit = rider || null;
          if (rider) {
            if (rider.slot !== sl) moved++;
            rider.slot = sl;
          }
        });
        return moved > 0
          ? { kind: 'rotate', target, side, count: moved, dir: effect.dir || 'cw' }
          : null;
      }
      case 'removeStatus': {
        // Strip every status matching `stat` off the target — Polarus's
        // shatter melting the ice he just profited from.
        const before = target.statusEffects.length;
        target.statusEffects = target.statusEffects.filter((fx) => fx.stat !== effect.stat);
        const count = before - target.statusEffects.length;
        return count > 0 ? { kind: 'removeStatus', target, stat: effect.stat, count } : null;
      }
      case 'randomDebuffs': {
        // A grab-bag hex (Sawyer): draw `count` DIFFERENT debuffs from
        // the standard book, each applied through the normal debuff path
        // so accuracy, resistance and duration extensions all hold.
        const pool = [
          { stat: 'atk', mult: 0.75 },
          { stat: 'def', mult: 0.75 },
          { stat: 'speed', mult: 0.75 },
          { stat: 'critChance', add: -0.15 },
          { stat: 'damageTaken', mult: 1.25 },
        ];
        const count = Math.min(effect.count || 1, pool.length);
        const out = [];
        for (let i = 0; i < count; i++) {
          const pick = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
          // The grab-bag's own `chance` rides on each drawn hex, so the
          // application gate (and its rungs) works here exactly as it
          // does on a named debuff. Without this the gate on the parent
          // effect would be silently ignored.
          const res = applyEffect(
            { type: 'debuff', turns: effect.turns, chance: effect.chance, ...pick },
            caster, target, power);
          if (res) out.push(res);
        }
        return out;
      }
      default:
        console.warn('Unknown effect type', effect.type);
        return null;
    }
  }

  // ---- Who an ability points at -----------------------------------------
  // The UI has to answer two questions before a target exists: which side
  // is this aimed at, and does the player have to pick someone. Both used
  // to be re-derived from hardcoded lists of targeting names in ui.js,
  // which meant a new targeting kind silently pointed at the wrong side.
  const ENEMY_TARGETING = ['enemy', 'enemy-row', 'all-enemies',
    'front-enemies', 'back-enemies', 'front-and-center-enemies'];
  const ALLY_TARGETING = ['ally', 'dead-ally', 'all-allies', 'front-allies',
    'self-and-wounded-allies', 'lowest-allies'];

  // 'enemy' | 'ally' | 'self'
  function sideOf(targeting) {
    if (targeting === 'self') return 'self';
    if (ALLY_TARGETING.includes(targeting)) return 'ally';
    if (ENEMY_TARGETING.includes(targeting)) return 'enemy';
    return 'enemy'; // the default case in resolveTargets is a single enemy
  }

  // Does the player have to click someone, or does it fire on select?
  function needsTarget(targeting) {
    return ['enemy', 'enemy-row', 'ally', 'dead-ally'].includes(targeting);
  }

  // Expand targeting into the concrete list of units affected.
  function resolveTargets(ability, caster, chosenTarget, battle) {
    switch (ability.targeting) {
      case 'self':
        return [caster];
      case 'all-enemies':
        return battle.livingUnits(caster.enemyTeam());
      case 'all-allies':
        return battle.livingUnits(caster.team);
      case 'enemy-row':
        // The chosen enemy plus everyone in its hex row (same y).
        // A boss spans every row, so it is always included.
        if (!chosenTarget) return [];
        return battle.livingUnits(caster.enemyTeam())
          .filter((u) => u.isBoss || Math.abs(u.slot.y - chosenTarget.slot.y) < 2);
      case 'front-allies':
        // Every living ally standing in a front-position hex.
        return battle.livingUnits(caster.team)
          .filter((u) => u.slot.position === POSITION.FRONT);
      case 'lowest-allies': {
        // The `allyCount` most-wounded living allies, the caster
        // included on equal terms — pure triage, no self bias (Cain).
        const n = ability.allyCount || 2;
        return battle.livingUnits(caster.team)
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)
          .slice(0, n);
      }
      case 'self-and-wounded-allies': {
        // The caster plus the `allyCount` most-wounded OTHER allies
        // (lowest HP fraction first) — triage healing.
        const n = ability.allyCount || 2;
        const others = battle.livingUnits(caster.team)
          .filter((u) => u !== caster)
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)
          .slice(0, n);
        return [caster, ...others];
      }
      case 'front-and-center-enemies': {
        // Everyone holding a front or center hex — the wall and its
        // keystone together (Bit's breakthrough). A boss spans every
        // hex; an empty front still catches one random enemy.
        const pool = battle.livingUnits(caster.enemyTeam());
        const wall = pool.filter((u) => u.isBoss ||
          u.slot.position === POSITION.FRONT ||
          u.slot.position === POSITION.CENTER);
        if (wall.length > 0) return wall;
        return pool.length > 0
          ? [pool[Math.floor(Math.random() * pool.length)]] : [];
      }
      case 'back-enemies':
        // Every living enemy standing in a back-position hex (a boss
        // spans every hex, so it always qualifies).
        return battle.livingUnits(caster.enemyTeam())
          .filter((u) => u.isBoss || u.slot.position === POSITION.BACK);
      case 'random-enemy':
      case 'random-enemies': {
        // Enemies chosen by the wind rather than by the player — Galen's
        // pinwheel goes where it goes, and Imani's chimes ring for
        // whoever they ring for. `targetCount` names how many DISTINCT
        // enemies to draw (one by default); a thin field simply gets
        // everyone standing.
        const pool = battle.livingUnits(caster.enemyTeam()).slice();
        const want = Math.max(1, ability.targetCount || 1);
        const picked = [];
        while (picked.length < want && pool.length > 0) {
          picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        }
        return picked;
      }
      case 'flank-enemies': {
        // Both outer rows at once — the front line and the back line —
        // leaving whoever holds the middle untouched (Tumble's whirl
        // passes them by). A boss spans every hex, so it always counts;
        // if only the centre is standing, the sweep still finds it.
        const pool = battle.livingUnits(caster.enemyTeam());
        const flanks = pool.filter((u) => u.isBoss ||
          u.slot.position === POSITION.FRONT ||
          u.slot.position === POSITION.BACK);
        return flanks.length > 0 ? flanks : pool;
      }
      case 'front-enemies': {
        // Every living enemy in a front-position hex; if nobody holds
        // the front line, the sweep still catches one random enemy.
        const pool = battle.livingUnits(caster.enemyTeam());
        const front = pool.filter(
          (u) => u.isBoss || u.slot.position === POSITION.FRONT);
        if (front.length > 0) return front;
        return pool.length > 0
          ? [pool[Math.floor(Math.random() * pool.length)]]
          : [];
      }
      case 'dead-ally':
        // A chosen fallen teammate (revives).
        return chosenTarget && !chosenTarget.alive ? [chosenTarget] : [];
      case 'ally':
      case 'enemy':
      default:
        return chosenTarget ? [chosenTarget] : [];
    }
  }

  // Chain-cast depth. A kit can loop (Oak's skill 3 chains back into
  // skill 1), so a run of hot rolls is cut off rather than trusted to
  // the dice.
  let chainDepth = 0;

  // Hand a share of damage dealt back to the caster's side as healing.
  // `spec` is { to, frac }: 'lowest-ally' finds the ally in the worst
  // shape (the caster included — she is an ally), 'self' is the caster.
  // A `drainSelfShare` hook (Noctelle's back-hex Lamplight) adds a
  // SECOND mend to the caster on top, so the drain feeds two people.
  function drainToAllies(spec, caster, dealt) {
    const b = currentBattle ||
      (typeof Battle !== 'undefined' ? Battle.active : null);
    const frac = spec.frac === undefined ? 1 : spec.frac;
    const share = Math.round(dealt * frac);
    if (share <= 0) return [];
    const allies = b ? b.livingUnits(caster.team) : [caster];
    let mark = caster;
    if (spec.to === 'lowest-ally' && allies.length) {
      mark = allies.slice().sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
    }
    const out = [];
    const mend = (who, amount) => {
      if (!who || !who.alive || amount <= 0) return;
      const healed = who.heal(amount, caster, { assists: caster.healAssists(false) });
      notifyOverheal(caster, amount - healed, who);
      out.push({ kind: 'heal', target: who, amount: healed, drained: true });
    };
    mend(mark, share);
    let selfShare = 0;
    for (const p of (caster.hookSources ? caster.hookSources() : [])) {
      if (p.hooks && p.hooks.drainSelfShare) selfShare += p.hooks.drainSelfShare;
    }
    // Already the lowest ally: the hex pays her once, not twice.
    if (selfShare > 0 && mark !== caster) {
      mend(caster, Math.round(dealt * frac * selfShare));
    }
    return out;
  }

  function execute(ability, caster, chosenTarget, battle) {
    // Remembered for effects that fire deeper in the pipeline than the
    // battle reference travels (freeze's team-wide watcher hooks).
    currentBattle = battle || currentBattle;
    const prevAbility = currentAbility;
    currentAbility = ability;
    try {
      return executeInner(ability, caster, chosenTarget, battle);
    } finally { currentAbility = prevAbility; }
  }

  function executeInner(ability, caster, chosenTarget, battle) {
    const targets = resolveTargets(ability, caster, chosenTarget, battle);
    // Skill-level power: +10% per level past 1 on this ability's numbers.
    const power = caster.skillPowerFor ? caster.skillPowerFor(ability) : 1;
    const results = [];
    for (const target of targets) {
      for (const effect of ability.effects) {
        const res = applyEffect(effect, caster, target, power);
        // A composite effect (randomDebuffs) reports one result per
        // debuff it landed, so the log narrates each hex separately.
        if (Array.isArray(res)) results.push(...res);
        else if (res) results.push(res);
      }
    }
    // Optional rider effects the ability applies to the caster itself.
    for (const effect of ability.selfEffects || []) {
      const res = applyEffect(effect, caster, caster, power);
      if (Array.isArray(res)) results.push(...res);
      else if (res) results.push(res);
    }
    // Cat set: any damaged target can lose 20% of its turn meter.
    const drainChance = caster.apDrainChance ? caster.apDrainChance() : 0;
    if (drainChance > 0) {
      const damaged = new Set();
      for (const res of results) {
        if (res.kind === 'damage' && res.amount > 0 && !res.dodged &&
            !res.reflected && res.target.alive) {
          damaged.add(res.target);
        }
      }
      for (const victim of damaged) {
        if (Math.random() < drainChance) {
          const drained = drainMeter(caster, victim, 0.20);
          if (drained) results.push(drained);
        }
      }
    }
    // Wolf set: single-target damaging attacks can stun the victim.
    const stunChance = caster.stunChance ? caster.stunChance() : 0;
    if (stunChance > 0 && ability.targeting === 'enemy' &&
        ability.effects.some((e) => e.type === 'damage') &&
        chosenTarget && chosenTarget.alive &&
        !chosenTarget.statusEffects.some((fx) => fx.stat === 'stun') &&
        Math.random() < stunChance) {
      if (debuffLands(caster, chosenTarget)) {
        chosenTarget.addStatusEffect({ kind: 'debuff', stat: 'stun', turns: 1 });
        results.push({ kind: 'stun', target: chosenTarget, turns: 1 });
      } else {
        results.push({ kind: 'debuff', target: chosenTarget, stat: 'stun', resisted: true });
      }
    }
    // Aiming stances (Silas). Two rules, both generic to the stat:
    // a stance is SPENT by the damaging cast it empowered — after the
    // whole volley, so every target of a row shot pays double — and a
    // LANDED single-target hit breaks the victim's stance (a volley
    // doesn't, and neither does an arrow they dodged).
    const dealsDamage = ability.effects.some((e) =>
      e.type === 'damage' || e.type === 'damageDef' || e.type === 'damageHpPct');
    if (dealsDamage) {
      const spent = caster.statusEffects.findIndex((fx) => fx.stat === 'aiming');
      if (spent !== -1) caster.statusEffects.splice(spent, 1);
    }
    if (ability.targeting === 'enemy' && chosenTarget && dealsDamage &&
        results.some((r) => r.kind === 'damage' && r.amount > 0 &&
          r.target === chosenTarget && !r.dodged && !r.reflected)) {
      const broke = chosenTarget.statusEffects.findIndex((fx) => fx.stat === 'aiming');
      if (broke !== -1) {
        chosenTarget.statusEffects.splice(broke, 1);
        if (battle && battle.addFloatingText) {
          battle.addFloatingText(chosenTarget, 'AIM BROKEN', '#ff9a5a');
        }
        if (battle && battle.log) {
          battle.log(`The blow knocks ${chosenTarget.name} out of their stance!`, 'log-system');
        }
      }
    }
    // Chain casts: an ability can name a chance to immediately cast
    // another of the caster's abilities as part of the same action — a
    // free cast that touches no cooldown and rides the same animation
    // beat. It follows the same victim while they stand, else finds
    // whoever is left; depth is capped at 4 links.
    // A hook can widen the channel (Posie's back hex makes her bough
    // jump more often), and a kit can raise its own depth rail: hers is
    // meant to run "indefinitely", which in practice means long enough
    // that the rail is never the thing that stops it.
    let chainChance = ability.chain ? ability.chain.chance : 0;
    if (ability.chain) {
      for (const p of (caster.hookSources ? caster.hookSources() : [])) {
        if (p.hooks && p.hooks.chainChanceAdd) chainChance += p.hooks.chainChanceAdd;
      }
    }
    const chainCap = (ability.chain && ability.chain.maxDepth) || 4;
    if (ability.chain && caster.alive && chainDepth < chainCap &&
        Math.random() < chainChance) {
      const next = (caster.def.abilities || []).find((a) => a.id === ability.chain.id);
      // Which way the link points: a healing chain hunts the ally who
      // needs it most, everything else follows the victim it started on.
      const allies = battle ? battle.livingUnits(caster.team) : [];
      const foes = battle
        ? battle.livingUnits().filter((u) => u.team !== caster.team) : [];
      const mark = ability.chain.to === 'lowest-ally'
        ? allies.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]
        : (chosenTarget && chosenTarget.alive
          ? chosenTarget
          : foes[Math.floor(Math.random() * foes.length)]);
      if (next && mark) {
        if (battle && battle.addFloatingText) {
          battle.addFloatingText(caster, `⛓ ${next.name}!`, '#ffd76a');
        }
        if (battle && battle.log) {
          battle.log(`${caster.name}'s ${ability.chain.to === 'lowest-ally'
            ? 'bough swings on' : 'fervor chains'} into ${next.name}!`,
            caster.team === TEAM.PLAYER ? 'log-player' : 'log-enemy');
        }
        chainDepth++;
        try {
          results.push(...execute(next, caster, mark, battle));
        } finally {
          chainDepth--;
        }
      }
    }
    return results;
  }

  // `strike` is exported so passive and positional hooks can deal damage
  // through the same pipeline instead of calling takeDamage directly,
  // which used to skip the DEF curve, dodge, guards, reflect AND the
  // damage meter all at once.
  return { execute, resolveTargets, damageFormula, strike, freeze, applyEffect,
    sideOf, needsTarget, takeLands, drainMeter };
})();
