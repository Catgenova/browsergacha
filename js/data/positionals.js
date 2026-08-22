// Positional bonuses: what a hero gains from holding the hex their
// training suits. These are hook-driven like passives (see Unit.
// hookSources), so standing in the right place changes HOW a hero
// fights — not just their stat line — and every one is conditional,
// reactive, or aimed at a slice of the enemy board. Placement is a
// real decision.
//
// Each entry: { position, name, description, hooks } and, where the
// effect is a plain multiplier the engine already understands,
// { stat, mult }. Heroes reference these by name, so the effects read
// as recognizable keywords across the roster.

const POSITIONALS = (() => {
  const P = {};
  const def = (id, o) => { P[id] = { id, ...o }; return P[id]; };

  // ---- FRONT: the line that gets hit ------------------------------------

  def('shield_wall', {
    position: POSITION.FRONT,
    name: 'Shield Wall',
    description: 'Front hex: takes 18% less damage while at or above half HP — hold the line while the healers keep up.',
    hooks: {
      damageTakenMult: (u) => (u.hp / u.maxHp >= 0.5 ? 0.82 : 1),
    },
  });

  def('last_stand', {
    position: POSITION.FRONT,
    name: 'Last Stand',
    description: 'Front hex: +35% ATK while below 40% HP. The closer to death, the harder the swing.',
    hooks: {
      damageDealtMult: (u) => (u.hp / u.maxHp < 0.4 ? 1.35 : 1),
    },
  });

  def('vanguard_press', {
    position: POSITION.FRONT,
    name: 'Vanguard Press',
    description: 'Front hex: +25% damage to enemies in THEIR front row. Trades blows with whoever stands opposite.',
    hooks: {
      damageDealtMult: (u, t) =>
        (t && t.slot && (t.isBoss || t.slot.position === POSITION.FRONT) ? 1.25 : 1),
    },
  });

  def('thornguard', {
    position: POSITION.FRONT,
    name: 'Thornguard',
    description: 'Front hex: 12% chance to bounce an incoming hit straight back at the attacker.',
    hooks: { reflectAdd: 0.12 },
  });

  def('rallying_banner', {
    position: POSITION.FRONT,
    name: 'Rallying Banner',
    description: 'Front hex: at the start of each turn, the most-wounded ally recovers 4% of this hero\'s max HP.',
    hooks: {
      onTurnStart(unit, battle) {
        if (!battle) return null;
        const allies = battle.livingUnits(unit.team)
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
        const hurt = allies[0];
        if (!hurt || hurt.hp >= hurt.maxHp) return null;
        const healed = hurt.heal(Math.round(unit.maxHp * 0.04), unit);
        if (healed <= 0) return null;
        return {
          label: 'Rallying Banner',
          message: `${unit.name}'s banner mends ${hurt.name} for ${healed} HP.`,
          floats: [{ target: hurt, text: `+${healed}`, color: '#7ae87a' }],
        };
      },
    },
  });

  def('bloodied_fury', {
    position: POSITION.FRONT,
    name: 'Bloodied Fury',
    description: 'Front hex: +8% Crit Chance for every 25% of max HP missing (up to +24%).',
    hooks: {
      onTurnStart(unit) {
        const missing = 1 - unit.hp / unit.maxHp;
        const stacks = Math.min(3, Math.floor(missing / 0.25));
        if (stacks <= 0) return null;
        unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.08 * stacks, turns: 1 });
        return null; // silent: it re-applies every turn
      },
    },
  });

  def('iron_wake', {
    position: POSITION.FRONT,
    name: 'Iron Wake',
    description: 'Front hex: digs in each turn, stacking +10% DEF for 2 turns as the fight drags on.',
    hooks: {
      onTurnStart(unit) {
        unit.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.10, turns: 2 });
        return null;
      },
    },
  });

  def('ghost_step', {
    position: POSITION.FRONT,
    name: 'Ghost Step',
    description: 'Front hex: +15% chance to dodge. The line holds because he is never quite where the blow lands.',
    hooks: { dodgeAdd: 0.15 },
  });

  def('reckless_charge', {
    position: POSITION.FRONT,
    name: 'Reckless Charge',
    description: 'Front hex: deals 20% more damage, and takes 10% more. A blade with no guard.',
    hooks: {
      damageDealtMult: () => 1.20,
      damageTakenMult: () => 1.10,
    },
  });

  def('bulwark_oath', {
    position: POSITION.FRONT,
    name: 'Bulwark Oath',
    description: 'Front hex: +15% DEF, and shrugs off debuffs 15% more often.',
    stat: 'def', mult: 1.15,
    hooks: { resistanceAdd: 0.15 },
  });

  // ---- BACK: reach, tempo, and support ----------------------------------

  def('snipers_nest', {
    position: POSITION.BACK,
    name: "Sniper's Nest",
    description: 'Back hex: +30% damage to enemies in THEIR back row. Punishes casters and healers hiding behind the line.',
    hooks: {
      damageDealtMult: (u, t) =>
        (t && t.slot && !t.isBoss && t.slot.position === POSITION.BACK ? 1.30 : 1),
    },
  });

  def('overwatch', {
    position: POSITION.BACK,
    name: 'Overwatch',
    description: 'Back hex: +10% Crit Chance and +25% Crit Damage — patient shots land heavy.',
    hooks: {
      onTurnStart(unit) {
        unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.10, turns: 1 });
        unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.25, turns: 1 });
        return null;
      },
    },
  });

  def('field_medic', {
    position: POSITION.BACK,
    name: 'Field Medic',
    description: 'Back hex: every heal this hero casts is 25% stronger.',
    hooks: { healBoostAdd: 0.25 },
  });

  def('windrunner', {
    position: POSITION.BACK,
    name: 'Windrunner',
    description: 'Back hex: +12% SPD and +8% Dodge. Acts sooner, gets caught less.',
    stat: 'speed', mult: 1.12,
    hooks: { dodgeAdd: 0.08 },
  });

  def('hexweaver', {
    position: POSITION.BACK,
    name: 'Hexweaver',
    description: 'Back hex: +20% debuff Accuracy, and the debuffs this hero lands stick for 1 extra turn.',
    hooks: { accuracyAdd: 0.20, debuffExtraTurns: 1 },
  });

  def('toxicologist', {
    position: POSITION.BACK,
    name: 'Toxicologist',
    description: 'Back hex: poisons and burns this hero inflicts deal 30% more, and last 1 turn longer.',
    hooks: { dotBoostAdd: 0.30, dotExtraTurns: 1 },
  });

  def('opening_volley', {
    position: POSITION.BACK,
    name: 'Opening Volley',
    description: 'Back hex: 20% chance each turn to shave a turn off one cooldown — big skills come around faster.',
    hooks: {
      onTurnStart(unit) {
        if (Math.random() >= 0.20) return null;
        const cooling = unit.abilities.filter((a) => a.cooldownRemaining > 0);
        if (cooling.length === 0) return null;
        const pick = cooling.sort((a, b) => b.cooldownRemaining - a.cooldownRemaining)[0];
        pick.cooldownRemaining--;
        return {
          label: 'Opening Volley',
          message: `${unit.name} readies ${pick.def.name} a turn early.`,
          floats: [{ target: unit, text: 'CD ▼', color: '#8ecbff' }],
        };
      },
    },
  });

  def('safe_distance', {
    position: POSITION.BACK,
    name: 'Safe Distance',
    description: 'Back hex: takes 15% less damage while any ally still holds a front hex.',
    hooks: {
      damageTakenMult(unit) {
        const battle = typeof Battle !== 'undefined' ? Battle.active : null;
        if (!battle) return 1;
        const screened = battle.livingUnits(unit.team)
          .some((u) => u !== unit && u.slot && u.slot.position === POSITION.FRONT);
        return screened ? 0.85 : 1;
      },
    },
  });

  def('marked_quarry', {
    position: POSITION.BACK,
    name: 'Marked Quarry',
    description: 'Back hex: +30% damage to enemies already carrying a debuff. Finishes what the party started.',
    hooks: {
      damageDealtMult: (u, t) =>
        (t && t.statusEffects.some((fx) => fx.kind === 'debuff' || fx.kind === 'dot') ? 1.30 : 1),
    },
  });

  // ---- CENTER: the anchor ------------------------------------------------

  def('standard_bearer', {
    position: POSITION.CENTER,
    name: 'Standard Bearer',
    description: 'Center hex: at the start of each turn, every ally gains +6% ATK for 1 turn.',
    hooks: {
      onTurnStart(unit, battle) {
        if (!battle) return null;
        for (const ally of battle.livingUnits(unit.team)) {
          ally.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.06, turns: 1 });
        }
        return {
          label: 'Standard Bearer',
          message: `${unit.name} raises the standard — the party presses forward.`,
          floats: [{ target: unit, text: 'ATK ▲', color: '#8ecbff' }],
        };
      },
    },
  });

  def('keystone', {
    position: POSITION.CENTER,
    name: 'Keystone',
    description: 'Center hex: +12% ATK and +12% DEF. Nothing flashy — the shape the formation is built around.',
    stat: 'atk', mult: 1.12,
    hooks: {
      onTurnStart(unit) {
        unit.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.12, turns: 1 });
        return null;
      },
    },
  });

  def('focal_point', {
    position: POSITION.CENTER,
    name: 'Focal Point',
    description: 'Center hex: 12% chance to act again immediately after taking a turn.',
    hooks: { extraTurnAdd: 0.12 },
  });

  def('warding_circle', {
    position: POSITION.CENTER,
    name: 'Warding Circle',
    description: 'Center hex: at the start of each turn, strips one debuff from a hobbled ally.',
    hooks: {
      onTurnStart(unit, battle) {
        if (!battle) return null;
        for (const ally of battle.livingUnits(unit.team)) {
          const i = ally.statusEffects.findIndex(
            (fx) => fx.kind === 'debuff' || fx.kind === 'dot');
          if (i === -1) continue;
          ally.statusEffects.splice(i, 1);
          return {
            label: 'Warding Circle',
            message: `${unit.name}'s ward burns a curse off ${ally.name}.`,
            floats: [{ target: ally, text: 'CLEANSED', color: '#ffe8a8' }],
          };
        }
        return null;
      },
    },
  });

  def('pivot_step', {
    position: POSITION.CENTER,
    name: 'Pivot Step',
    description: 'Center hex: +10% Dodge, and +10% SPD while below half HP — hardest to pin down when it matters.',
    hooks: {
      dodgeAdd: 0.10,
      onTurnStart(unit) {
        if (unit.hp / unit.maxHp >= 0.5) return null;
        unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.10, turns: 1 });
        return null;
      },
    },
  });

  def('lifeline', {
    position: POSITION.CENTER,
    name: 'Lifeline',
    description: 'Center hex: whenever an ally is healed, this hero recovers 2% of their own max HP.',
    hooks: {
      onAllyHealed(unit, healedUnit) {
        if (healedUnit === unit || !unit.alive) return null;
        const healed = unit.heal(Math.round(unit.maxHp * 0.02));
        if (healed <= 0) return null;
        return { floats: [{ target: unit, text: `+${healed}`, color: '#7ae87a' }] };
      },
    },
  });

  def('press_the_flank', {
    position: POSITION.CENTER,
    name: 'Press the Flank',
    description: 'Center hex: +20% damage to enemies below half HP. Closes out wounded targets.',
    hooks: {
      damageDealtMult: (u, t) => (t && t.hp / t.maxHp < 0.5 ? 1.20 : 1),
    },
  });

  def('drain_the_line', {
    position: POSITION.CENTER,
    name: 'Drain the Line',
    description: 'Center hex: 15% chance on any hit to knock 20% off the victim\'s action bar.',
    hooks: { apDrainAdd: 0.15 },
  });

  return P;
})();
