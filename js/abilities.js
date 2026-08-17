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
        const raw = caster.effectiveStat('atk') * effect.mult;
        const dmg = damageFormula(raw, target.effectiveStat('def'));
        target.takeDamage(dmg);
        return { kind: 'damage', target, amount: dmg };
      }
      case 'heal': {
        const amount = Math.round(caster.effectiveStat('atk') * effect.mult);
        const healed = target.heal(amount);
        return { kind: 'heal', target, amount: healed };
      }
      case 'buff':
      case 'debuff': {
        target.addStatusEffect({
          kind: effect.type,
          stat: effect.stat,
          mult: effect.mult,
          turns: effect.turns,
        });
        return { kind: effect.type, target, stat: effect.stat, turns: effect.turns };
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
