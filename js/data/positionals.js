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
    description: 'Front hex: +35% damage dealt while below 40% HP.',
    hooks: {
      damageDealtMult: (u) => (u.hp / u.maxHp < 0.4 ? 1.35 : 1),
    },
  });

  def('vanguard_press', {
    position: POSITION.FRONT,
    name: 'Vanguard Press',
    description: 'Front hex: +25% damage to front-row enemies.',
    hooks: {
      damageDealtMult: (u, t) =>
        (t && t.slot && (t.isBoss || t.slot.position === POSITION.FRONT) ? 1.25 : 1),
    },
  });

  def('rallying_banner', {
    position: POSITION.FRONT,
    name: 'Rallying Banner',
    description: 'Front hex: start of each turn, heals the most-wounded ally 4% of caster max HP.',
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
    description: 'Front hex: +8% Crit Chance per 25% of max HP missing, up to +24%.',
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
    description: 'Front hex: +10% DEF for 2 turns at the start of each turn, stacking.',
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
    description: 'Back hex: +20% damage to Dark enemies.',
    hooks: {
      damageDealtMult: (u, t) => (t && t.element === 'dark' ? 1.20 : 1),
    },
  });

  def('ghost_step', {
    position: POSITION.FRONT,
    name: 'Ghost Step',
    description: 'Front hex: +15% Dodge.',
    hooks: { dodgeAdd: 0.15 },
  });

  def('reckless_charge', {
    position: POSITION.FRONT,
    name: 'Reckless Charge',
    description: 'Front hex: +20% damage dealt and +10% damage taken.',
    hooks: {
      damageDealtMult: () => 1.20,
      damageTakenMult: () => 1.10,
    },
  });

  // ---- BACK: reach, tempo, and support ----------------------------------

  def('overwatch', {
    position: POSITION.BACK,
    name: 'Overwatch',
    description: 'Back hex: +10% Crit Chance and +25% Crit Damage.',
    hooks: {
      onTurnStart(unit) {
        unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.10, turns: 1 });
        unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.25, turns: 1 });
        return null;
      },
    },
  });

  // Nehru's hex: a gate opens where it likes, and what it likes is the
  // far side of the field. The mirror of Vanguard Press -- that one
  // rewards trading blows with whoever stands opposite, this one
  // rewards reaching past them entirely.
  //
  // It is also what makes his own Waygate a decision rather than a
  // flourish: the portal trades a fighter's hex for the one level with
  // it, so throwing an enemy FRONT rank into the back walks them into
  // this, and dragging their caster forward walks them out of it.
  def('far_gate', {
    position: POSITION.BACK,
    name: 'Far Gate',
    description: 'Back hex: +25% damage to back-row enemies.',
    hooks: {
      // A boss occupies the whole formation and is never "in the back",
      // so it is excluded rather than counted both ways -- the same
      // reading Vanguard Press takes from the other end of the field.
      damageDealtMult: (u, t) =>
        (t && t.slot && !t.isBoss && t.slot.position === POSITION.BACK ? 1.25 : 1),
    },
  });

  // Hallow's hex: the storm is worse where there is more sky to fill.
  def('stormglass', {
    position: POSITION.BACK,
    name: 'Stormglass',
    description: 'Back hex: +15% damage with all-enemy skills.',
    hooks: {
      // Reads the ABILITY rather than the target, so it pays once per
      // victim of a genuine team sweep and never on a single-target
      // strike -- a bonus for the shape of the cast, not the aim of it.
      damageDealtMult: (u, t, ability) =>
        (ability && ability.targeting === 'all-enemies' ? 1.15 : 1),
    },
  });

  // Jack's hex: the smallest bird on the boarding line gets to pick
  // who has not been hit yet. The mirror of Tumble's Eye of the Ring,
  // which pays for finishing rather than for starting.
  def('first_blood', {
    position: POSITION.FRONT,
    name: 'First Blood',
    description: 'Front hex: +25% damage to enemies at full HP.',
    hooks: {
      damageDealtMult: (u, t) => (t && t.hp >= t.maxHp ? 1.25 : 1),
    },
  });

  // Peck's hex: the pot sits in the middle of the deck and stays hot.
  def('slow_simmer', {
    position: POSITION.CENTER,
    name: 'Slow Simmer',
    description: 'Center hex: shields this hero applies last 1 turn longer.',
    hooks: { shieldExtraTurns: 1 },
  });

  // Talon's hex: swing at an anchor and it is your footing that goes.
  def('set_fast', {
    position: POSITION.FRONT,
    name: 'Set Fast',
    description: 'Front hex: +20% DEF, and anyone who strikes this hero loses 10% turn meter.',
    hooks: {
      statMult: (u, stat) => (stat === 'def' ? 1.20 : 1),
      onStruck(unit, { attacker, battle }) {
        if (!attacker || !attacker.alive || attacker.team === unit.team) return null;
        // Straight off the bar rather than through drainMeter: this is
        // the attacker's own swing costing them, not a hex Talon threw,
        // so there is no application gate to roll and nothing to
        // resist.
        const before = attacker.turnMeter;
        attacker.turnMeter = Math.max(0, attacker.turnMeter - CONFIG.TURN_METER_MAX * 0.10);
        if (attacker.turnMeter >= before) return null;
        if (battle) battle.addFloatingText(attacker, '\u2693', '#8ecfe8');
        return null;
      },
    },
  });

  // Bo's hex: a pouch that big holds more of whatever you put in it.
  def('deep_pouch', {
    position: POSITION.FRONT,
    name: 'Deep Pouch',
    description: 'Front hex: +30% healing received.',
    // The receiving end of field_medic. Nothing on the roster read the
    // patient's side of a heal before this, which is why a tank who is
    // built to be healed had nowhere to put it.
    hooks: { healTakenAdd: 0.30 },
  });

  // Wanda's hex: from the stern she can see the whole deck, and the
  // call reaches all of it.
  def('weather_eye', {
    position: POSITION.BACK,
    name: 'Weather Eye',
    description: 'Back hex: +25% turn meter given to allies.',
    hooks: { meterGiftAdd: 0.25 },
  });

  // Polo's hex: the chart table is in the stern cabin, and the work is
  // better done sitting down.
  def('chart_table', {
    position: POSITION.BACK,
    name: 'Chart Table',
    description: 'Back hex: buffs this hero applies grant an extra +10%.',
    hooks: { buffPowerAdd: 0.10 },
  });

  // ---- Phoenix Court -----------------------------------------------------

  // Korvid's hex: the shield is the Court, and the Court does not move.
  def('phoenix_shield', {
    position: POSITION.FRONT,
    name: 'Phoenix Shield',
    description: 'Front hex: +25% DEF, and -20% damage taken from burning enemies.',
    hooks: {
      statMult: (u, stat) => (stat === 'def' ? 1.25 : 1),
      damageTakenMult: (u, attacker) =>
        (attacker && attacker.burning && attacker.burning() ? 0.80 : 1),
    },
  });

  // Stoddard's hex: the censer swings widest from the middle of the aisle.
  def('censer_swing', {
    position: POSITION.CENTER,
    name: 'Censer Swing',
    description: 'Center hex: burns this hero sets tick 25% harder.',
    hooks: { dotBoostAdd: 0.25 },
  });

  // Chirp's hex: too small and too fast to be worth a swing.
  def('hoverpoint', {
    position: POSITION.BACK,
    name: 'Hoverpoint',
    description: 'Back hex: +20% Dodge and +10% SPD.',
    hooks: {
      dodgeAdd: 0.20,
      statMult: (u, stat) => (stat === 'speed' ? 1.10 : 1),
    },
  });

  // Sarena's hex: the fans read the room from the back of it.
  def('fanfare', {
    position: POSITION.BACK,
    name: 'Fanfare',
    description: 'Back hex: buffs this hero applies grant an extra +5% per burning enemy.',
    hooks: { perBurnAdd: 0.05 },
  });

  def('field_medic', {
    position: POSITION.BACK,
    name: 'Field Medic',
    description: 'Back hex: +25% healing done.',
    hooks: { healBoostAdd: 0.25 },
  });

  // Posie's hex: standing back, the bough finds its own way onward.
  def('bough_bearer', {
    position: POSITION.BACK,
    name: 'Bough Bearer',
    description: 'Back hex: +15% chance for a healing chain to repeat.',
    hooks: { chainChanceAdd: 0.15 },
  });

  def('windrunner', {
    position: POSITION.BACK,
    name: 'Windrunner',
    description: 'Back hex: +12% SPD and +8% Dodge.',
    stat: 'speed', mult: 1.12,
    hooks: { dodgeAdd: 0.08 },
  });

  def('shorthand', {
    position: POSITION.BACK,
    name: 'Shorthand',
    description: 'Back hex: +15 SPD.',
    stat: 'speed', add: 15,
  });

  def('cruel_fortune', {
    position: POSITION.BACK,
    name: 'Cruel Fortune',
    description: 'Back hex: each buff this hero strips has a 20% chance to leave a 2-turn burn.',
    hooks: { stripBurnChance: 0.20 },
  });

  def('vanishing_act', {
    position: POSITION.BACK,
    name: 'Vanishing Act',
    description: 'Back hex: +15% Dodge.',
    hooks: { dodgeAdd: 0.15 },
  });

  def('hexweaver', {
    position: POSITION.BACK,
    name: 'Hexweaver',
    description: 'Back hex: +20% Accuracy, and debuffs this hero applies last 1 turn longer.',
    hooks: { accuracyAdd: 0.20, debuffExtraTurns: 1 },
  });

  // ---- CENTER: the anchor ------------------------------------------------

  def('center_ring', {
    position: POSITION.CENTER,
    name: 'Center Ring',
    description: 'Center hex: +20% Accuracy.',
    hooks: { accuracyAdd: 0.20 },
  });

  // Tumble's hex: the middle of the ring, where the whole tent watches.
  def('eye_of_the_ring', {
    position: POSITION.CENTER,
    name: 'Eye of the Ring',
    description: 'Center hex: +35% Accuracy.',
    hooks: { accuracyAdd: 0.35 },
  });

  def('standard_bearer', {
    position: POSITION.CENTER,
    name: 'Standard Bearer',
    description: 'Center hex: start of each turn, all allies gain +6% ATK for 1 turn.',
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
    description: 'Center hex: start of each turn, removes 1 debuff from one ally.',
    hooks: {
      onTurnStart(unit, battle) {
        if (!battle) return null;
        for (const ally of battle.livingUnits(unit.team)) {
          const i = ally.statusEffects.findIndex(
            Unit.isDebuff);
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

  // Nemeris's hex: from the middle of the nest he can see which of them
  // is closest to going, and the egg's shadow falls over that one.
  //
  // Deliberately NOT a mend and NOT a tempo push. The Sunbrood pack
  // already sells healing done at 2pc, 3pc and 4pc, and speed at 2pc;
  // light sells max HP at 2pc and 4pc. Damage TAKEN is the one axis
  // nothing above him touches, so the hex makes the wounded bird harder
  // to kill while the pack makes it easier to mend -- two verbs on the
  // same target rather than the same verb twice.
  def('under_the_egg', {
    position: POSITION.CENTER,
    name: 'Under the Egg',
    description: 'Center hex: start of each turn, the lowest-health ally gains +30% DEF for 1 turn.',
    hooks: {
      onTurnStart(unit, battle) {
        if (!battle) return null;
        const hurt = battle.livingUnits(unit.team)
          .filter((u) => u.maxHp > 0)
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (!hurt) return null;
        hurt.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.30, turns: 1 });
        return {
          label: 'Under the Egg',
          message: `${unit.name} tucks ${hurt.name} into the egg's shadow.`,
          floats: [{ target: hurt, text: 'DEF \u25b2', color: '#ffe8a8' }],
        };
      },
    },
  });

  // Aster's hex: the note carries as far as there is room behind him to
  // let it out. Raises the ceiling on his ramp rather than the rate --
  // the back row is where an artillery piece is left alone long enough
  // to reach the top of it, so the hex pays exactly the hero who can
  // afford to stand still.
  def('carrying_distance', {
    position: POSITION.BACK,
    name: 'Carrying Distance',
    description: 'Back hex: Long Note stacks to +70% instead of +50%.',
    hooks: { longNoteCap: 7 },
  });

  // Rizzo's hex: the range at which a split shaft still has the legs to
  // matter. Raises what the second arrow is WORTH rather than how often
  // it flies -- the frequency is his crit chance, which is gear, and a
  // hex that stacked on top of gear would pay twice for the same thing.
  def('called_shot', {
    position: POSITION.BACK,
    name: 'Called Shot',
    description: 'Back hex: the split shaft carries 100% of the hit instead of 50%.',
    hooks: { critCarry: 1 },
  });

  // Mavros's hex: standing at the gate he can put the casque over one
  // more rank. Widens WHO the shelter covers rather than what it stops,
  // which is the only lever a hero whose passive is already binary has
  // -- and the rank it adds is the centre, where the brood keeps its
  // healer.
  def('gatepost', {
    position: POSITION.FRONT,
    name: 'Gatepost',
    description: 'Front hex: the crit shelter also covers center-row allies.',
    hooks: { critShelterWide: true },
  });

  // Orien's hex: light straight down finds every gap there is. Standing
  // back is what gives him the angle -- and it is the only lever that
  // matters to a hero whose payout is one big stored blow, because the
  // thing standing between the orb and the enemy is armour.
  def('noon_angle', {
    position: POSITION.BACK,
    name: 'Noon Angle',
    description: 'Back hex: attacks ignore 30% of the target\'s DEF.',
    hooks: { defIgnoreAdd: 0.30 },
  });

  // Solari's hex: from the middle she can hold the angle, and the light
  // she takes off them comes back to her. Sibling to Tumble's Chime Tax
  // -- the same `onStripBuff` channel, paid out differently: his strips
  // buy turn meter, hers buy cooldown. Deliberately not another party
  // buff, because that is Orien's whole job and a hex has no business
  // doing a skill's work.
  def('heliograph', {
    position: POSITION.CENTER,
    name: 'Heliograph',
    description: 'Center hex: each buff this hero strips takes 1 turn off all their cooldowns.',
    hooks: {
      onStripBuff(unit, { count } = {}) {
        if (!count || count <= 0) return null;
        for (const a of (unit.abilities || [])) {
          if (a.cooldownRemaining > 0) {
            a.cooldownRemaining = Math.max(0, a.cooldownRemaining - count);
          }
        }
        return { floats: [{ target: unit, text: '\u21ba', color: '#ffd76a' }] };
      },
    },
  });

  // Nestora's hex: the nest goes at the back, where it is not knocked
  // over. Raises the CEILING on what a bird can be raised to rather
  // than the rate -- the rate is her turn coming round, which the sect
  // already buys with speed, and paying for that twice is the trap this
  // whole roster is written to avoid.
  def('the_high_nest', {
    position: POSITION.BACK,
    name: 'The High Nest',
    description: 'Back hex: the ATK raise caps at +50% instead of +30%.',
    hooks: { raiseCap: 0.50 },
  });

  // Necros's hex: the circle is drawn in the middle or it is not drawn.
  // Pays the BODIES rather than the bird -- a summoner standing where he
  // can work is worth more through what he digs up, which is the only
  // lever that does not just make him a better caster.
  def('gravecircle', {
    position: POSITION.CENTER,
    name: 'Gravecircle',
    description: 'Center hex: raised bodies come up with 25% more health.',
    hooks: { summonHpAdd: 0.25 },
  });

  // Click's hex: a bell rung from the middle of the room is heard in all
  // of it. Widens the ward rather than lengthening it, because the
  // LENGTH is already her passive's job and a hex that paid the same
  // axis twice would be the compounding trap on a single hero.
  def('long_peal', {
    position: POSITION.CENTER,
    name: 'Long Peal',
    description: 'Center hex: shields this hero applies are 30% larger.',
    hooks: { shieldPowerAdd: 0.30 },
  });

  // Rend's hex: the bit is off and the mouth is open. Every affliction
  // that lands anywhere on his side is COPIED onto him -- the original
  // stays where it fell, so this rescues nobody; it just means the bird
  // whose armour is other people's curses is never short of any.
  //
  // Deliberately not another cap-raiser. Aster's hex and Nestora's both
  // lift a ceiling, and a third would be a habit rather than a design;
  // this one changes what the hero is FED instead of what he can hold.
  def('open_mouth', {
    position: POSITION.FRONT,
    name: 'Open Mouth',
    description: 'Front hex: every debuff or DoT landing on an ally is copied onto this hero.',
    hooks: { afflictionSink: true },
  });

  // Crook's hex: standing at the front is where the pockets are. Deepens
  // the theft rather than widening what it hits, because how MUCH of a
  // move he takes is the whole mechanic and a hex that hit more birds
  // for less would be a different hero.
  def('fence', {
    position: POSITION.FRONT,
    name: 'Fence',
    description: 'Front hex: cooldowns this hero pushes are pushed 1 turn deeper.',
    hooks: { cooldownPushAdd: 1 },
  });

  // Pox's hex: standing back is standing upwind. Raises the RATE the
  // plague travels rather than a ceiling -- three hexes on this roster
  // already lift a cap (Aster's note, Nestora's nest, and it was a
  // habit forming) and what matters about a plague is how often it
  // jumps, not how much of it one bird can hold.
  def('upwind', {
    position: POSITION.BACK,
    name: 'Upwind',
    description: 'Back hex: +15% chance for this hero\'s debuffs to spread to a second enemy.',
    hooks: { debuffSpread: 0.15 },
  });

  // Malachar's hex: a lantern lit before the fighting starts is already
  // holding something. Answers the one real problem with a hero whose
  // whole value is a running total -- on turn one the total is zero and
  // he is a 4-star support handing out ordinary blessings.
  def('struck_early', {
    position: POSITION.BACK,
    name: 'Struck Early',
    description: 'Back hex: the lantern starts each battle already counting 3 deaths.',
    hooks: { lanternStart: 3 },
  });

  // Shrike's hex: the thornbush is where the larder is, and what goes on
  // a thorn does not come off it. Nothing else on the roster refuses a
  // revive, and it is a real answer to the four things that hand them
  // out -- Emily, Korvid, Malachar, Nestora -- rather than another
  // percentage.
  //
  // Necros is untouched by it on purpose: he does not raise a corpse,
  // he takes it apart for parts, and pulling a body off the board is
  // not the same as putting it back on its feet.
  def('thornbush', {
    position: POSITION.BACK,
    name: 'Thornbush',
    description: 'Back hex: enemies this hero kills cannot be revived.',
    hooks: {
      onUnitDied(unit, { victim, killer } = {}) {
        if (!victim || killer !== unit) return null;
        victim.unraisable = true;
        return { floats: [{ target: victim, text: '\u2020', color: '#c86ae8' }] };
      },
    },
  });

  // Omen's hex: from the back he can see further ahead. Buys the clock
  // an extra turn, which is the one lever that makes an omen worth MORE
  // rather than sooner -- every blow the party lands in that turn is
  // another share on the pile.
  def('further_ahead', {
    position: POSITION.BACK,
    name: 'Further Ahead',
    description: 'Back hex: dooms this hero lays run 1 turn longer and fill for that turn.',
    hooks: { doomExtraTurns: 1 },
  });

  // Carrion's hex: standing where the bodies fall means never waiting
  // for the next one. A RATE, not a ceiling -- three hexes on this
  // roster already lift a cap and it had become a habit -- and the rate
  // is the only thing that matters to a hero whose meals are handed out
  // one per turn.
  def('first_at_the_table', {
    position: POSITION.FRONT,
    name: 'First at the Table',
    description: 'Front hex: consumes 2 bodies a turn instead of 1.',
    hooks: { extraMeals: 1 },
  });

  def('press_the_flank', {
    position: POSITION.CENTER,
    name: 'Press the Flank',
    description: 'Center hex: +20% damage to enemies below half HP.',
    hooks: {
      damageDealtMult: (u, t) => (t && t.hp / t.maxHp < 0.5 ? 1.20 : 1),
    },
  });

  def('drain_the_line', {
    position: POSITION.CENTER,
    name: 'Drain the Line',
    description: 'Center hex: 15% chance on any hit to take 20% turn meter.',
    hooks: { apDrainAdd: 0.15 },
  });

  def('second_wind', {
    position: POSITION.BACK,
    name: 'Second Wind',
    description: 'Back hex: below half HP, +20% turn meter after each of their turns.',
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
    description: 'Front hex: +25% DEF.',
    stat: 'def', mult: 1.25,
  });

  def('spillway', {
    position: POSITION.BACK,
    name: 'Spillway',
    description: 'Back hex: +25% overheal damage.',
    hooks: { overhealBoost: 0.25 },
  });

  def('limelight', {
    position: POSITION.FRONT,
    name: 'Limelight',
    description: 'Front hex: -15% damage taken from taunted enemies.',
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
    description: 'Front hex: +30% Crit Damage.',
    stat: 'critDamage', add: 0.30,
  });

  def('strongman', {
    position: POSITION.FRONT,
    name: 'Strongman',
    description: 'Front hex: +15% max HP.',
    stat: 'hp', mult: 1.15,
  });

  def('hearthblood', {
    position: POSITION.FRONT,
    name: 'Hearthblood',
    description: 'Front hex: heals 5% of max HP at the start of each turn.',
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
    description: 'Front hex: +20% max HP.',
    stat: 'hp', mult: 1.20,
  });

  def('clapper', {
    position: POSITION.FRONT,
    name: 'Clapper',
    description: 'Front hex: +30% Accuracy.',
    hooks: { accuracyAdd: 0.30 },
  });

  def('reach', {
    position: POSITION.FRONT,
    name: 'Reach',
    description: 'Front hex: +40% Accuracy.',
    hooks: { accuracyAdd: 0.40 },
  });

  def('bell_tower', {
    position: POSITION.CENTER,
    name: 'Bell Tower',
    description: 'Center hex: start of each turn, heals all allies 5% of caster max HP.',
    hooks: {
      onTurnStart(unit, battle) {
        if (!battle) return null;
        const mend = Math.max(1, Math.round(unit.maxHp * 0.05));
        const floats = [];
        for (const ally of battle.livingUnits(unit.team)) {
          const healed = ally.heal(mend, unit);
          if (healed > 0) floats.push({ target: ally, text: `+${healed}`, color: '#7ae87a' });
        }
        return floats.length ? { floats } : null;
      },
    },
  });

  def('long_stems', {
    position: POSITION.BACK,
    name: 'Long Stems',
    description: 'Back hex: debuffs this hero applies last 1 turn longer.',
    hooks: { debuffExtraTurns: 1 },
  });

  def('mourners_row', {
    position: POSITION.FRONT,
    name: "Mourner's Row",
    description: 'Front hex: back-row allies take 20% less damage.',
    hooks: {
      coverMult(unit, ally) {
        return ally.slot && ally.slot.position === POSITION.BACK ? 0.80 : 1;
      },
    },
  });

  def('spool', {
    position: POSITION.FRONT,
    name: 'Spool',
    description: 'Front hex: +30% DEF.',
    stat: 'def', mult: 1.30,
  });

  def('first_chair', {
    position: POSITION.CENTER,
    name: 'First Chair',
    description: 'Center hex: +25% SPD.',
    stat: 'speed', mult: 1.25,
  });

  def('deep_roots', {
    position: POSITION.BACK,
    name: 'Deep Roots',
    description: 'Back hex: DoTs this hero applies tick 30% harder.',
    hooks: { dotBoostAdd: 0.30 },
  });

  def('lamplight', {
    position: POSITION.BACK,
    name: 'Lamplight',
    description: 'Back hex: Silent Wing also heals this hero for the amount it gives away.',
    hooks: { drainSelfShare: 1 },
  });

  def('chime_bar', {
    position: POSITION.CENTER,
    name: 'Chime Bar',
    description: 'Center hex: +15% ATK.',
    stat: 'atk', mult: 1.15,
  });

  def('headwind', {
    position: POSITION.FRONT,
    name: 'Headwind',
    description: 'Front hex: +10% SPD.',
    stat: 'speed', mult: 1.10,
  });

  def('still_air', {
    position: POSITION.BACK,
    name: 'Still Air',
    description: 'Back hex: +30% Resistance.',
    hooks: { resistanceAdd: 0.30 },
  });

  def('weathervane', {
    position: POSITION.BACK,
    name: 'Weathervane',
    description: 'Back hex: +20% Accuracy.',
    hooks: { accuracyAdd: 0.20 },
  });

  def('pyre_sight', {
    position: POSITION.BACK,
    name: 'Pyre Sight',
    description: 'Back hex: +30% Accuracy.',
    hooks: { accuracyAdd: 0.30 },
  });

  def('giantslayer', {
    position: POSITION.BACK,
    name: 'Giantslayer',
    description: 'Back hex: attacks add 2% of the target\'s max HP to their damage.',
    hooks: { targetHpBonus: 0.02 },
  });

  def('cold_forge', {
    position: POSITION.BACK,
    name: 'Cold Forge',
    description: 'Back hex: +15% ATK and +10% DEF.',
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
    description: 'Center hex: start of each turn, -30% DEF for 2 turns to a random enemy.',
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
    description: 'Center hex: when an enemy freezes, all ability cooldowns -1 turn.',
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

  // ---- Stillwater (No. 13): nine cats on one axis ----------------------
  // The sect reads the action bar from every side, so its hexes do too:
  // reach, timing, weight, order, and where the giver stands relative to
  // the given.

  def('long_needle', {
    position: POSITION.FRONT,
    name: 'Long Needle',
    // Hit them before they go. Everything else the cats do pushes bars
    // DOWN, so this is the one hex in the sect worth more at the top of
    // a turn cycle than the bottom -- and it is on the 1-star, whose
    // whole job is to swing first and often.
    description: 'Front hex: +30% damage to enemies whose action bar is over half.',
    hooks: {
      damageDealtMult: (u, t) =>
        (t && t.turnMeter > CONFIG.TURN_METER_MAX * 0.5 ? 1.30 : 1),
    },
  });

  def('close_quarters', {
    position: POSITION.FRONT,
    name: 'Close Quarters',
    // Feeds the same channel Cold Current does, so a Brock on his hex in
    // a full sect is rolling a quarter of the time on every body he
    // touches -- and under Undertow every one of those rolls is his.
    description: 'Front hex: +10% chance for this hero to take turn meter on a hit.',
    hooks: { apDrainAdd: 0.10 },
  });

  def('loosed_early', {
    position: POSITION.CENTER,
    name: 'Loosed Early',
    description: 'Center hex: +12% damage with all-enemy skills.',
    hooks: {
      damageDealtMult: (u, t, ability) =>
        (ability && ability.targeting === 'all-enemies' ? 1.12 : 1),
    },
  });

  def('settled_low', {
    position: POSITION.FRONT,
    name: 'Settled Low',
    description: 'Front hex: shields on this hero last 1 turn longer.',
    hooks: { shieldExtraTurns: 1 },
  });

  def('the_long_haft', {
    position: POSITION.FRONT,
    name: 'The Long Haft',
    description: "Front hex: attacks ignore 20% of the target's DEF.",
    hooks: { defIgnoreAdd: 0.20 },
  });

  def('order_of_march', {
    position: POSITION.BACK,
    name: 'Order of March',
    // The giving half of the sect, sharpened. Weather Eye (Wanda's) is
    // the same channel at 25%; this is the smaller share on a hero whose
    // whole kit is the push, which is the trade -- she gives more often,
    // Wanda gives harder.
    description: 'Back hex: +15% turn meter given to allies.',
    hooks: { meterGiftAdd: 0.15 },
  });

  def('reads_the_water', {
    position: POSITION.BACK,
    name: 'Reads the Water',
    // Accuracy is the stat that decides whether a drain lands at all:
    // drainMeter rolls it against the victim's resistance before a
    // single point moves. On the sect's mass-drain hero it is worth more
    // than a damage line would be.
    description: 'Back hex: +25% Accuracy.',
    hooks: { accuracyAdd: 0.25 },
  });

  def('the_warm_spot', {
    position: POSITION.CENTER,
    name: 'The Warm Spot',
    description: 'Center hex: +25% healing done.',
    hooks: { healBoostAdd: 0.25 },
  });

  def('deep_keel', {
    position: POSITION.FRONT,
    name: 'Deep Keel',
    // The 4-piece early, for one cat and only while it holds its hex --
    // a party that has not yet fielded four still has an answer to a
    // drain team, and it is standing in the front rank where it can be
    // killed for it.
    description: 'Front hex: this hero cannot be pushed backwards in the order.',
    hooks: { meterGuard: true },
  });

  return P;
})();
