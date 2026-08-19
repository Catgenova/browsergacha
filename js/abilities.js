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
  function damageFormula(rawAtk, targetDef) {
    // Simple mitigation curve; keeps damage positive and DEF meaningful.
    const mitigation = targetDef / (targetDef + 300);
    return Math.max(1, Math.round(rawAtk * (1 - mitigation)));
  }

  // Debuff landing roll: accuracy (attacker) offsets resistance
  // (defender); the land chance is floored at 15%.
  function debuffLands(caster, target) {
    const resistance = target.debuffResistance ? target.debuffResistance() : 0;
    const accuracy = caster.debuffAccuracy ? caster.debuffAccuracy() : 0;
    const chance = Math.max(0.15, 1 - Math.max(0, resistance - accuracy));
    return Math.random() < chance;
  }

  // Resolve one effect against one unit. Returns a log-friendly result.
  // `power` is the caster's skill-level multiplier for the ability this
  // effect belongs to; it scales damage/heal/poison numbers only.
  function applyEffect(effect, caster, target, power = 1) {
    switch (effect.type) {
      case 'damage': {
        // Dodge: a fully evaded hit deals nothing.
        if (Math.random() < (target.dodgeChance ? target.dodgeChance() : 0)) {
          return { kind: 'damage', target, amount: 0, dodged: true };
        }
        let raw = caster.effectiveStat('atk') * effect.mult * power *
          caster.damageDealtMult(target) *
          Elements.mult(caster.element, target.element);
        // Combo hits: multiplied damage against a marked status — by
        // stat (methane fog) or by kind (detonating poisons).
        if (effect.bonusVs && target.statusEffects.some((fx) =>
            (effect.bonusVs.stat && fx.stat === effect.bonusVs.stat) ||
            (effect.bonusVs.kind && fx.kind === effect.bonusVs.kind))) {
          raw *= effect.bonusVs.mult;
        }
        let dmg = damageFormula(raw, target.effectiveStat('def'));
        const crit = Math.random() < caster.effectiveStat('critChance');
        if (crit) dmg = Math.round(dmg * caster.effectiveStat('critDamage'));
        dmg = Math.round(dmg * target.damageTakenMult());
        target.takeDamage(dmg);
        return { kind: 'damage', target, amount: dmg, crit };
      }
      case 'heal': {
        const amount = Math.round(caster.effectiveStat('atk') * effect.mult * power);
        const healed = target.heal(amount);
        return { kind: 'heal', target, amount: healed };
      }
      case 'healHpPct': {
        // Heal scaled off the CASTER's max HP; optional bigger cut for
        // front-row targets.
        const front = target.slot && target.slot.position === POSITION.FRONT;
        const pct = front && effect.frontPct ? effect.frontPct : effect.pct;
        const healed = target.heal(Math.round(caster.maxHp * pct * power));
        return { kind: 'heal', target, amount: healed };
      }
      case 'hot': {
        // Heal-over-time: fixed amount (locked at cast) at the start of
        // each of the target's turns.
        target.addStatusEffect({
          kind: 'hot',
          amount: Math.round(caster.maxHp * effect.pct * power),
          turns: effect.turns,
        });
        return { kind: 'hot', target, turns: effect.turns };
      }
      case 'damageHpPct': {
        // Flat damage scaled off the caster's max HP (ignores DEF).
        const dmg = Math.round(caster.maxHp * effect.pct * power
          * caster.damageDealtMult(target) * target.damageTakenMult());
        target.takeDamage(dmg);
        return { kind: 'damage', target, amount: dmg, crit: false };
      }
      case 'cleanse': {
        // Strip all debuffs (poisons included) from the target.
        const before = target.statusEffects.length;
        target.statusEffects = target.statusEffects.filter(
          (fx) => fx.kind !== 'debuff' && fx.kind !== 'dot');
        return { kind: 'cleanse', target, count: before - target.statusEffects.length };
      }
      case 'revive': {
        if (target.alive) return null;
        target.revive(effect.pct);
        return { kind: 'revive', target, amount: target.hp };
      }
      case 'turnMeter': {
        // Push the target's action bar by a fraction of max (negative cuts).
        target.turnMeter = Math.max(0, Math.min(CONFIG.TURN_METER_MAX,
          target.turnMeter + effect.amount * CONFIG.TURN_METER_MAX));
        return { kind: 'meter', target, amount: effect.amount };
      }
      case 'dot': {
        // Poison / damage-over-time: locked in at cast off the caster's
        // ATK, amplified by DoT boosts, resisted like any debuff.
        if (!debuffLands(caster, target)) {
          return { kind: 'debuff', target, stat: 'dot', resisted: true };
        }
        const amount = Math.round(caster.effectiveStat('atk') * effect.pct *
          power * (1 + caster.dotBoost()));
        // Clinging-flame passives can extend inflicted DoT durations.
        let dotTurns = effect.turns;
        for (const p of caster.passives || []) {
          if (p.hooks && p.hooks.dotExtraTurns) dotTurns += p.hooks.dotExtraTurns;
        }
        target.addStatusEffect({ kind: 'dot', amount, turns: dotTurns });
        return { kind: 'dot', target, amount, turns: dotTurns };
      }
      case 'buff':
      case 'debuff': {
        // Debuffs can be resisted (accuracy vs resistance); buffs always
        // land. Debuffer passives can extend applied debuff durations.
        let turns = effect.turns;
        if (effect.type === 'debuff') {
          if (!debuffLands(caster, target)) {
            return { kind: 'debuff', target, stat: effect.stat, resisted: true };
          }
          for (const p of caster.passives || []) {
            if (p.hooks && p.hooks.debuffExtraTurns) turns += p.hooks.debuffExtraTurns;
          }
        }
        target.addStatusEffect({
          kind: effect.type,
          stat: effect.stat,
          mult: effect.mult,
          add: effect.add,
          turns,
        });
        return { kind: effect.type, target, stat: effect.stat, turns };
      }
      default:
        console.warn('Unknown effect type', effect.type);
        return null;
    }
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
      case 'back-enemies':
        // Every living enemy standing in a back-position hex (a boss
        // spans every hex, so it always qualifies).
        return battle.livingUnits(caster.enemyTeam())
          .filter((u) => u.isBoss || u.slot.position === POSITION.BACK);
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

  function execute(ability, caster, chosenTarget, battle) {
    const targets = resolveTargets(ability, caster, chosenTarget, battle);
    // Skill-level power: +10% per level past 1 on this ability's numbers.
    const power = caster.skillPowerFor ? caster.skillPowerFor(ability) : 1;
    const results = [];
    for (const target of targets) {
      for (const effect of ability.effects) {
        const res = applyEffect(effect, caster, target, power);
        if (res) results.push(res);
      }
    }
    // Optional rider effects the ability applies to the caster itself.
    for (const effect of ability.selfEffects || []) {
      const res = applyEffect(effect, caster, caster, power);
      if (res) results.push(res);
    }
    return results;
  }

  return { execute, resolveTargets, damageFormula };
})();
