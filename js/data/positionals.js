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

  def('dawn_piercer', {
    position: POSITION.BACK,
    name: 'Dawn Piercer',
    description: 'Back hex: +20% damage to Dark-element enemies. The dark is where the bolt burns brightest.',
    hooks: {
      damageDealtMult: (u, t) => (t && t.element === 'dark' ? 1.20 : 1),
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

  // ---- BACK: reach, tempo, and support ----------------------------------

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

  // Posie's hex: standing back, the bough finds its own way onward.
  def('bough_bearer', {
    position: POSITION.BACK,
    name: 'Bough Bearer',
    description: 'Back hex: +15% chance for a healing chain to swing on again.',
    hooks: { chainChanceAdd: 0.15 },
  });

  def('windrunner', {
    position: POSITION.BACK,
    name: 'Windrunner',
    description: 'Back hex: +12% SPD and +8% Dodge. Acts sooner, gets caught less.',
    stat: 'speed', mult: 1.12,
    hooks: { dodgeAdd: 0.08 },
  });

  def('shorthand', {
    position: POSITION.BACK,
    name: 'Shorthand',
    description: 'Back hex: +15 SPD — the pen moves faster than the sword.',
    stat: 'speed', add: 15,
  });

  def('cruel_fortune', {
    position: POSITION.BACK,
    name: 'Cruel Fortune',
    description: 'Back hex: each buff this hero strips has a 20% chance to be replaced with a 2-turn burn.',
    hooks: { stripBurnChance: 0.20 },
  });

  def('vanishing_act', {
    position: POSITION.BACK,
    name: 'Vanishing Act',
    description: 'Back hex: +15% Dodge — you cannot hit what refuses to be seen.',
    hooks: { dodgeAdd: 0.15 },
  });

  def('hexweaver', {
    position: POSITION.BACK,
    name: 'Hexweaver',
    description: 'Back hex: +20% debuff Accuracy, and the debuffs this hero lands stick for 1 extra turn.',
    hooks: { accuracyAdd: 0.20, debuffExtraTurns: 1 },
  });

  // ---- CENTER: the anchor ------------------------------------------------

  def('center_ring', {
    position: POSITION.CENTER,
    name: 'Center Ring',
    description: 'Center hex: +20% debuff Accuracy — every eye on the middle of the ring.',
    hooks: { accuracyAdd: 0.20 },
  });

  // Tumble's hex: the middle of the ring, where the whole tent watches.
  def('eye_of_the_ring', {
    position: POSITION.CENTER,
    name: 'Eye of the Ring',
    description: 'Center hex: +35% debuff Accuracy — nothing slips past the middle.',
    hooks: { accuracyAdd: 0.35 },
  });

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

  def('second_wind', {
    position: POSITION.BACK,
    name: 'Second Wind',
    description: 'Back hex: below half HP, each of his turns starts the next fill with +20 turn meter.',
    hooks: {
      // Read by useAbility after the meter resets — the refund is a
      // head start on the next turn, exactly as the spec's "at the
      // beginning of your turn" cashes out mechanically.
      meterRefund: (u) => (u.hp / u.maxHp < 0.5 ? 0.20 : 0),
    },
  });

  def('bedrock', {
    position: POSITION.FRONT,
    name: 'Bedrock',
    description: 'Front hex: +25% DEF. Some things you build on.',
    stat: 'def', mult: 1.25,
  });

  def('spillway', {
    position: POSITION.BACK,
    name: 'Spillway',
    description: 'Back hex: overheal damage is increased 25% — the channel runs deeper from the rear.',
    hooks: { overhealBoost: 0.25 },
  });

  def('limelight', {
    position: POSITION.FRONT,
    name: 'Limelight',
    description: 'Front hex: takes 15% less damage from taunted enemies — they swing half-blinded by the spotlight.',
    hooks: {
      damageTakenMult(unit, attacker) {
        return attacker && attacker.statusEffects &&
          attacker.statusEffects.some((fx) => fx.stat === 'taunted') ? 0.85 : 1;
      },
    },
  });

  def('knifes_edge', {
    position: POSITION.FRONT,
    name: "Knife's Edge",
    description: 'Front hex: +30% Crit Damage — the points go in first.',
    stat: 'critDamage', add: 0.30,
  });

  def('strongman', {
    position: POSITION.FRONT,
    name: 'Strongman',
    description: 'Front hex: +15% max HP — the whole show leans on him.',
    stat: 'hp', mult: 1.15,
  });

  def('hearthblood', {
    position: POSITION.FRONT,
    name: 'Hearthblood',
    description: 'Front hex: regenerates 5% max HP at the start of his turn — the hearth keeps its keeper warm.',
    hooks: {
      onTurnStart(unit) {
        if (unit.hp >= unit.maxHp) return null;
        const healed = unit.heal(Math.round(unit.maxHp * 0.05), unit);
        if (!healed) return null;
        return { label: 'Hearthblood',
          message: `${unit.name} knits back ${healed} HP by the hearth.`,
          floats: [{ target: unit, text: `+${healed}`, color: '#7ae87a' }] };
      },
    },
  });

  // Galen's hex: back where he can watch the whole field turn.
  // Ilyra's hex: standing back, the wind bends around her.
  // Ryn's hex: out front, where the wind is already moving.
  // Imani's hex: the middle, where the whole chime hangs.
  // Wren's hex: the wall itself, and her damage comes off her own bulk.
  def('windbreak', {
    position: POSITION.FRONT,
    name: 'Windbreak',
    description: 'Front hex: +20% max HP — she is the thing the wind breaks on.',
    stat: 'hp', mult: 1.20,
  });

  def('clapper', {
    position: POSITION.FRONT,
    name: 'Clapper',
    description: 'Front hex: +30% accuracy — the striker inside the bell, ' +
      'and it never misses the rim.',
    hooks: { accuracyAdd: 0.30 },
  });

  def('lamplight', {
    position: POSITION.BACK,
    name: 'Lamplight',
    description: 'Back hex: the life she drains feeds her too — Silent Wing ' +
      'mends her for the same amount it gives away.',
    hooks: { drainSelfShare: 1 },
  });

  def('chime_bar', {
    position: POSITION.CENTER,
    name: 'Chime Bar',
    description: 'Center hex: +15% ATK — every bell on the bar rings at once.',
    stat: 'atk', mult: 1.15,
  });

  def('headwind', {
    position: POSITION.FRONT,
    name: 'Headwind',
    description: 'Front hex: +10% SPD — she meets the charge already running.',
    stat: 'speed', mult: 1.10,
  });

  def('still_air', {
    position: POSITION.BACK,
    name: 'Still Air',
    description: 'Back hex: +30% Resistance — debuffs, strips and drains all break on her.',
    hooks: { resistanceAdd: 0.30 },
  });

  def('weathervane', {
    position: POSITION.BACK,
    name: 'Weathervane',
    description: 'Back hex: +20% debuff Accuracy — he reads the wind before he swings.',
    hooks: { accuracyAdd: 0.20 },
  });

  def('pyre_sight', {
    position: POSITION.BACK,
    name: 'Pyre Sight',
    description: 'Back hex: +30% accuracy — the fire lights every mark.',
    hooks: { accuracyAdd: 0.30 },
  });

  def('giantslayer', {
    position: POSITION.BACK,
    name: 'Giantslayer',
    description: "Back hex: attacks add 2% of the target's max HP to the damage. The bigger they are.",
    hooks: { targetHpBonus: 0.02 },
  });

  def('cold_forge', {
    position: POSITION.BACK,
    name: 'Cold Forge',
    description: 'Back hex: +15% ATK and +10% DEF — the craft is better done unhurried.',
    hooks: {
      onTurnStart(unit) {
        unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.15, turns: 1 });
        unit.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.10, turns: 1 });
        return null; // silent: it re-applies every turn
      },
    },
  });

  def('undermine', {
    position: POSITION.CENTER,
    name: 'Undermine',
    description: 'Center hex: at the start of each turn, digs the ground from under a random enemy — -30% DEF for 2 turns.',
    hooks: {
      onTurnStart(unit, battle) {
        if (!battle) return null;
        const foes = battle.livingUnits().filter((u) => u.team !== unit.team);
        if (!foes.length) return null;
        const target = foes[Math.floor(Math.random() * foes.length)];
        target.addStatusEffect({ kind: 'debuff', stat: 'def', mult: 0.7, turns: 2, source: unit });
        return {
          label: 'Undermine',
          message: `${unit.name} undermines ${target.name} — their footing (and 30% of their DEF) gives way.`,
          floats: [{ target, text: 'DEF ▼', color: '#d78aff' }],
        };
      },
    },
  });

  def('frost_throne', {
    position: POSITION.CENTER,
    name: 'Frost Throne',
    description: 'Center hex: freezing an enemy refunds 1 turn of cooldown on every ability.',
    hooks: {
      // Fired from Abilities.freeze for every enemy actually frozen, by
      // any source — the bolt, the Crystalline counter, the passive.
      onFroze(unit) {
        for (const a of unit.abilities) {
          if (a.cooldownRemaining > 0) a.cooldownRemaining--;
        }
      },
    },
  });

  return P;
})();
