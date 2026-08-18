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

  // Resolve one effect against one unit. Returns a log-friendly result.
  function applyEffect(effect, caster, target) {
    switch (effect.type) {
      case 'damage': {
        const raw = caster.effectiveStat('atk') * effect.mult *
          caster.damageDealtMult(target) *
          Elements.mult(caster.element, target.element);
        let dmg = damageFormula(raw, target.effectiveStat('def'));
        const crit = Math.random() < caster.effectiveStat('critChance');
        if (crit) dmg = Math.round(dmg * caster.effectiveStat('critDamage'));
        dmg = Math.round(dmg * target.damageTakenMult());
        target.takeDamage(dmg);
        return { kind: 'damage', target, amount: dmg, crit };
      }
      case 'heal': {
        const amount = Math.round(caster.effectiveStat('atk') * effect.mult);
        const healed = target.heal(amount);
        return { kind: 'heal', target, amount: healed };
      }
      case 'healHpPct': {
        // Heal scaled off the CASTER's max HP; optional bigger cut for
        // front-row targets.
        const front = target.slot && target.slot.position === POSITION.FRONT;
        const pct = front && effect.frontPct ? effect.frontPct : effect.pct;
        const healed = target.heal(Math.round(caster.maxHp * pct));
        return { kind: 'heal', target, amount: healed };
      }
      case 'hot': {
        // Heal-over-time: fixed amount (locked at cast) at the start of
        // each of the target's turns.
        target.addStatusEffect({
          kind: 'hot',
          amount: Math.round(caster.maxHp * effect.pct),
          turns: effect.turns,
        });
        return { kind: 'hot', target, turns: effect.turns };
      }
      case 'damageHpPct': {
        // Flat damage scaled off the caster's max HP (ignores DEF).
        const dmg = Math.round(caster.maxHp * effect.pct * caster.damageDealtMult(target)
          * target.damageTakenMult());
        target.takeDamage(dmg);
        return { kind: 'damage', target, amount: dmg, crit: false };
      }
      case 'cleanse': {
        // Strip all debuffs from the target.
        const before = target.statusEffects.length;
        target.statusEffects = target.statusEffects.filter((fx) => fx.kind !== 'debuff');
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
      case 'buff':
      case 'debuff': {
        // Debuffer passives can extend the duration of applied debuffs.
        let turns = effect.turns;
        if (effect.type === 'debuff' && caster.passives) {
          for (const p of caster.passives) {
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
    const results = [];
    for (const target of targets) {
      for (const effect of ability.effects) {
        const res = applyEffect(effect, caster, target);
        if (res) results.push(res);
      }
    }
    // Optional rider effects the ability applies to the caster itself.
    for (const effect of ability.selfEffects || []) {
      const res = applyEffect(effect, caster, caster);
      if (res) results.push(res);
    }
    return results;
  }

  return { execute, resolveTargets, damageFormula };
})();
