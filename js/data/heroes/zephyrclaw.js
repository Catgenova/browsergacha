// The Zephyrclaw cats. Sect No. 15, wind, and the pride that GIVES: the
// third verb of the cat meter, where Stillwater takes and Emberpride
// charges its own.
//
// The pack was written before a single cat (js/races.js):
//
//   2pc Tailwind           an ally's own turn refunds 5% action bar per
//                          full 25 SPD above 100
//   3pc First Off the Mark the party opens every battle with 15% action bar
//   4pc Windfall           a speed blessing granted to an ally also
//                          pushes their action bar 10% on the spot
//
// Every kit below is written INTO that frame, and three consequences of
// it shape all nine:
//
// SPEED IS THE STAT. Tailwind's rungs start at 125 SPD and wind
// resonance stacks its own pace on top, so the whole pride is statted
// fast -- 118 to 130 where the other cats run 100 to 120 -- and the
// tanks are the only ones allowed to be slow, because their job is to
// still be standing when the fast ones come back around.
//
// A SPEED BLESSING PAYS TWICE. Under Windfall every +SPD an ally
// receives also moves their bar on the spot, so the supports here sing
// pace rather than strength: Suri and Tessa are speed anthems, and
// Aveline's passive hands one out without spending a turn on it.
//
// AND THE GIFT IS THE KIT. Meter handed to an ally credits the giver
// with the damage the bought turn deals (Unit.meterGifts), so a support
// with no damage line still reads on the meter -- Caracall's whole kit
// is other people's turns.
//
// The nine hold the full spread, 1/2/3/2/1, because wind carries every
// rarity band. Statlines are RATIOS (js/data/balance.js); speed is
// identity, not budget. All nine sheets face RIGHT, so none carries a
// `faceLeft` flag.

const ZEPHYRCLAW = {
  // ---- 1-star ------------------------------------------------------
  // The pup with the staff, and the cheapest wall the sect owns. Soren
  // is a TANK at 1 star because the pride's glass runs fast and thin,
  // and somebody has to stand still in all that wind.
  soren: {
    id: 'soren',
    element: 'wind',
    name: 'Soren',
    title: 'Stands in the Gale',
    rarity: 1,
    stats: { hp: 1150, atk: 82, def: 96, speed: 112 },
    tint: { body: '#b8c4cc', helm: '#4a7a5a', weapon: '#8a9a6a', shield: '#2a4a3a' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/zephyrclaw/sorenidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'soren_hold_fast', name: 'Hold Fast',
        icon: 'assets/icons/fc1132.png',
        description: 'One enemy: 80% DEF damage.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'punch',
        effects: [{ type: 'damageDef', mult: 0.80 }],
        levelUps: [
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
        ],
      },
    ],
    passive: {
      name: 'Braced Against the Wind',
      icon: 'assets/icons/fc1133.png',
      // Full includes overfilled: in a sect that hands bars around, the
      // pup is braced exactly when the pride has been feeding him.
      description: 'Takes 15% less damage while the action bar is full.',
      hooks: {
        damageTakenMult: (unit) =>
          (unit.turnMeter >= CONFIG.TURN_METER_MAX ? 0.85 : 1),
      },
    },
    positional: POSITIONALS.strongman,
  },

  // ---- 2-star ------------------------------------------------------
  // The first anthem. Suri sings pace, and under Windfall every verse
  // is also a shove: a +SPD blessing moves the bar the moment it lands.
  suri: {
    id: 'suri',
    element: 'wind',
    name: 'Suri',
    title: 'Sings Them Onward',
    rarity: 2,
    stats: { hp: 1050, atk: 98, def: 80, speed: 124 },
    tint: { body: '#d8c8a8', helm: '#4a7a5a', weapon: '#a8d8b8', shield: '#2a4a3a' },
    sprite: {
      displayH: 72,
      strips: {
        idle: { src: 'assets/heroes/zephyrclaw/suriidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'suri_keep_up', name: 'Keep Up',
        icon: 'assets/icons/fc1134.png',
        description: 'One ally: +15% SPD for 2 turns.',
        cooldown: 0, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'buff', stat: 'speed', mult: 1.15, turns: 2 }],
        levelUps: [
          { buffPower: 0.05 },
          { buffPower: 0.05 },
          { duration: 1 },
          { buffPower: 0.05 },
          { buffPower: 0.05 },
        ],
      },
      {
        id: 'suri_wind_at_your_back', name: 'Wind at Your Back',
        icon: 'assets/icons/fc1135.png',
        description: 'All allies: +10% SPD for 2 turns.',
        cooldown: 4, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'buff', stat: 'speed', mult: 1.10, turns: 2 }],
        levelUps: [
          { buffPower: 0.05 },
          { cooldown: -1 },
          { duration: 1 },
          { buffPower: 0.05 },
          { cooldown: -1 },
          { buffPower: 0.05 },
        ],
      },
    ],
    passive: {
      name: 'Backs the Wind',
      icon: 'assets/icons/fc1136.png',
      // Kiva's Favorite sends the hardest hitter; Suri backs whoever is
      // already fastest, because in this sect pace IS the payload.
      description: 'Start of each turn: +5% turn meter to the ally with the highest SPD.',
      hooks: {
        onTurnStart(unit, battle) {
          if (!battle) return null;
          const mates = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (!mates.length) return null;
          const fleet = mates.reduce((a, b) =>
            (b.effectiveStat('speed') > a.effectiveStat('speed') ? b : a));
          fleet.turnMeter += CONFIG.TURN_METER_MAX * 0.05;
          return { label: 'Backs the Wind',
            floats: [{ target: fleet, text: '▲', color: '#a8e8c8' }] };
        },
      },
    },
    positional: POSITIONALS.eye_of_the_gale,
  },

  // The other half of the pair: where Suri blesses pace, Caracall hands
  // the bar over directly, and the gift ledger pays him for every turn
  // he buys.
  caracall: {
    id: 'caracall',
    element: 'wind',
    name: 'Caracall',
    title: 'Gives With Both Paws',
    rarity: 2,
    stats: { hp: 1100, atk: 94, def: 86, speed: 120 },
    tint: { body: '#c8a06a', helm: '#4a7a5a', weapon: '#a8d8b8', shield: '#2a4a3a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/zephyrclaw/caracallidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'caracall_nudge', name: 'Nudge',
        icon: 'assets/icons/fc1137.png',
        description: 'One ally: +18% turn meter.',
        cooldown: 0, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'turnMeter', amount: 0.18 }],
        levelUps: [
          { meter: 0.03 },
          { meter: 0.03 },
          { meter: 0.03 },
          { meter: 0.03 },
          { meter: 0.03 },
        ],
      },
      {
        id: 'caracall_updraft', name: 'Updraft',
        icon: 'assets/icons/fc1138.png',
        description: 'All allies: +12% turn meter.',
        cooldown: 4, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'turnMeter', amount: 0.12 }],
        levelUps: [
          { meter: 0.03 },
          { cooldown: -1 },
          { meter: 0.03 },
          { meter: 0.03 },
          { cooldown: -1 },
          { meter: 0.03 },
        ],
      },
    ],
    passive: {
      name: 'Open-Pawed',
      icon: 'assets/icons/fc1139.png',
      // The same channel Weather Eye and the gale hex read, carried as
      // a passive: every gift he makes is a tenth wider.
      description: 'Turn meter Caracall gives to allies is 10% wider.',
      hooks: { meterGiftAdd: 0.10 },
    },
    positional: POSITIONALS.thermal_rise,
  },

  // ---- 3-star ------------------------------------------------------
  // The skirmisher. Damar's whole kit is being faster than the problem:
  // his passive pays him for holding the lead, and his pass buys the
  // speed that keeps it.
  damar: {
    id: 'damar',
    element: 'wind',
    name: 'Damar',
    title: 'Point of the Spear',
    rarity: 3,
    stats: { hp: 1150, atk: 170, def: 74, speed: 128 },
    tint: { body: '#a8845a', helm: '#4a7a5a', weapon: '#c8e8d8', shield: '#2a4a3a' },
    sprite: {
      displayH: 82,
      strips: {
        idle: { src: 'assets/heroes/zephyrclaw/damaridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'damar_spearpoint', name: 'Spearpoint',
        icon: 'assets/icons/fc1140.png',
        description: 'One enemy: 110% ATK damage.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.10 }],
        levelUps: [
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
        ],
      },
      {
        id: 'damar_skirmishers_pass', name: "Skirmisher's Pass",
        icon: 'assets/icons/fc1141.png',
        description: 'One enemy: 150% ATK damage. Self: +15% SPD for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'idle', impact: 'slash_effect',
        effects: [{ type: 'damage', mult: 1.50 }],
        selfEffects: [{ type: 'buff', stat: 'speed', mult: 1.15, turns: 2 }],
        levelUps: [
          { mult: 0.15 },
          { cooldown: -1 },
          { buffPower: 0.05 },
          { mult: 0.15 },
          { cooldown: -1 },
          { mult: 0.15 },
        ],
      },
      {
        id: 'damar_lance_of_the_gale', name: 'Lance of the Gale',
        icon: 'assets/icons/fc1142.png',
        description: 'One enemy: 200% ATK damage (ignores 25% DEF).',
        cooldown: 5, targeting: 'enemy', animation: 'idle', impact: 'horizonal_slash',
        effects: [{ type: 'damage', mult: 2.00, ignoreDef: 0.25 }],
        levelUps: [
          { mult: 0.15 },
          { cooldown: -1 },
          { mult: 0.15 },
          { mult: 0.15 },
          { cooldown: -1 },
          { mult: 0.15 },
          { mult: 0.15 },
        ],
      },
    ],
    passive: {
      name: 'Out in Front',
      icon: 'assets/icons/fc1143.png',
      description: '+20% damage while holding the highest SPD on the field.',
      hooks: {
        damageDealtMult(unit) {
          const b = typeof Battle !== 'undefined' ? Battle.active : null;
          if (!b) return 1;
          const mine = unit.effectiveStat('speed');
          const ahead = b.livingUnits().some((u) =>
            u !== unit && u.effectiveStat('speed') > mine);
          return ahead ? 1 : 1.20;
        },
      },
    },
    positional: POSITIONALS.leading_edge,
  },

  // The sweep. Kira reaches wide, and her passive reads the gift
  // ledger: a turn her allies helped buy swings harder, which is the
  // giving sect's aggression stated as one line.
  kira: {
    id: 'kira',
    element: 'wind',
    name: 'Kira',
    title: 'Carried by the Gale',
    rarity: 3,
    stats: { hp: 1200, atk: 165, def: 80, speed: 122 },
    tint: { body: '#e8d8b8', helm: '#4a7a5a', weapon: '#a8d8b8', shield: '#2a4a3a' },
    sprite: {
      displayH: 80,
      strips: {
        idle: { src: 'assets/heroes/zephyrclaw/kiraidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'kira_twin_gust', name: 'Twin Gust',
        icon: 'assets/icons/fc1144.png',
        description: 'Enemy front row: 65% ATK damage.',
        cooldown: 0, targeting: 'front-enemies', animation: 'idle', impact: 'horizonal_slash',
        effects: [{ type: 'damage', mult: 0.65 }],
        levelUps: [
          { mult: 0.08 },
          { mult: 0.08 },
          { mult: 0.08 },
          { mult: 0.08 },
          { mult: 0.08 },
        ],
      },
      {
        id: 'kira_cutting_wind', name: 'Cutting Wind',
        icon: 'assets/icons/fc1145.png',
        description: 'Enemy front and center rows: 60% ATK damage.',
        cooldown: 3, targeting: 'front-and-center-enemies',
        animation: 'idle', impact: 'slash_effect',
        effects: [{ type: 'damage', mult: 0.60 }],
        levelUps: [
          { mult: 0.08 },
          { cooldown: -1 },
          { mult: 0.08 },
          { mult: 0.08 },
          { cooldown: -1 },
          { mult: 0.08 },
        ],
      },
      {
        id: 'kira_stormfall', name: 'Stormfall',
        icon: 'assets/icons/fc1146.png',
        description: 'All enemies: 70% ATK damage.',
        cooldown: 5, targeting: 'all-enemies', animation: 'idle', impact: 'slash_slam',
        effects: [{ type: 'damage', mult: 0.70 }],
        levelUps: [
          { mult: 0.08 },
          { cooldown: -1 },
          { mult: 0.08 },
          { mult: 0.08 },
          { cooldown: -1 },
          { mult: 0.08 },
          { mult: 0.08 },
        ],
      },
    ],
    passive: {
      name: 'Wind Under Her',
      icon: 'assets/icons/fc1147.png',
      // turnGifts is the set of pushes that bought the turn being taken
      // (Unit.startTurn holds it for exactly this kind of read): a turn
      // somebody paid for lands harder.
      description: '+20% damage on a turn that allies helped buy.',
      hooks: {
        damageDealtMult: (unit) =>
          (unit.turnGifts && unit.turnGifts.length ? 1.20 : 1),
      },
    },
    positional: POSITIONALS.vanguard_press,
  },

  // The wall that shares. Bondo is a tank whose sturdiness is the
  // party's tempo: every blow he takes hands a slice of bar to whoever
  // is furthest from acting.
  bondo: {
    id: 'bondo',
    element: 'wind',
    name: 'Bondo',
    title: 'Takes It and Passes It On',
    rarity: 3,
    stats: { hp: 1650, atk: 92, def: 128, speed: 108 },
    tint: { body: '#8a7a5a', helm: '#4a7a5a', weapon: '#a8d8b8', shield: '#2a4a3a' },
    sprite: {
      displayH: 90,
      strips: {
        idle: { src: 'assets/heroes/zephyrclaw/bondoidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bondo_shoulder_check', name: 'Lean In',
        icon: 'assets/icons/fc1148.png',
        description: 'One enemy: 95% DEF damage.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'punch',
        effects: [{ type: 'damageDef', mult: 0.95 }],
        levelUps: [
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
        ],
      },
      {
        id: 'bondo_windbreak', name: 'Windbreak',
        icon: 'assets/icons/fc1149.png',
        description: 'Self: shield worth 115% DEF for 3 turns; draws enemy attacks for 2 turns.',
        cooldown: 4, targeting: 'self', animation: 'idle', impact: 'shield_bubble',
        effects: [
          { type: 'shield', defMult: 1.15, turns: 3 },
          { type: 'taunt', turns: 2 },
        ],
        levelUps: [
          { mult: 0.15 },
          { cooldown: -1 },
          { duration: 1 },
          { mult: 0.15 },
          { cooldown: -1 },
          { mult: 0.15 },
        ],
      },
      {
        id: 'bondo_dig_in', name: 'Dig In',
        icon: 'assets/icons/fc1150.png',
        description: 'Enemy front row: 100% DEF damage.',
        cooldown: 5, targeting: 'front-enemies', animation: 'idle', impact: 'slash_slam',
        effects: [{ type: 'damageDef', mult: 1.00 }],
        levelUps: [
          { mult: 0.10 },
          { cooldown: -1 },
          { mult: 0.10 },
          { mult: 0.10 },
          { cooldown: -1 },
          { mult: 0.10 },
          { mult: 0.10 },
        ],
      },
    ],
    passive: {
      name: 'Pass It Along',
      icon: 'assets/icons/fc1151.png',
      // Booked as a real gift -- ledger and AP column both -- because it
      // is one: the blow bought somebody's turn.
      description: 'When struck by an enemy: +5% turn meter to the ally with the lowest action bar.',
      hooks: {
        onStruck(unit, attacker) {
          if (!attacker || attacker.team === unit.team) return null;
          const b = typeof Battle !== 'undefined' ? Battle.active : null;
          if (!b) return null;
          const mates = b.livingUnits(unit.team).filter((u) => u !== unit);
          if (!mates.length) return null;
          const last = mates.reduce((a, x) => (x.turnMeter < a.turnMeter ? x : a));
          const gained = CONFIG.TURN_METER_MAX * 0.05;
          last.turnMeter += gained;
          last.meterGifts.push({ source: unit, amount: gained });
          last.bookAp(unit, gained);
          return { label: 'Pass It Along',
            floats: [{ target: last, text: '▲', color: '#a8e8c8' }] };
        },
      },
    },
    positional: POSITIONALS.settled_low,
  },

  // ---- 4-star ------------------------------------------------------
  // The shepherd. Aveline is the wall the anthem stands behind, and her
  // passive is a Windfall trigger that costs no turn: a slow ally gets
  // pace, and at four claws the pace also moves their bar.
  aveline: {
    id: 'aveline',
    element: 'wind',
    name: 'Aveline',
    title: 'The Flock Comes First',
    rarity: 4,
    stats: { hp: 1750, atk: 100, def: 140, speed: 112 },
    tint: { body: '#d8d0c0', helm: '#4a7a5a', weapon: '#a8d8b8', shield: '#2a4a3a' },
    sprite: {
      displayH: 88,
      strips: {
        idle: { src: 'assets/heroes/zephyrclaw/avelineidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'aveline_crook_strike', name: 'Crook Strike',
        icon: 'assets/icons/fc1152.png',
        description: 'One enemy: 105% DEF damage.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'punch',
        effects: [{ type: 'damageDef', mult: 1.05 }],
        levelUps: [
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
        ],
      },
      {
        id: 'aveline_shepherds_wall', name: "Shepherd's Wall",
        icon: 'assets/icons/fc1153.png',
        description: 'Self: shield worth 140% DEF for 3 turns; draws enemy attacks for 2 turns.',
        cooldown: 4, targeting: 'self', animation: 'idle', impact: 'shield_bubble',
        effects: [
          { type: 'shield', defMult: 1.40, turns: 3 },
          { type: 'taunt', turns: 2 },
        ],
        levelUps: [
          { mult: 0.15 },
          { duration: 1 },
          { cooldown: -1 },
          { mult: 0.15 },
          { cooldown: -1 },
          { mult: 0.15 },
        ],
      },
      {
        id: 'aveline_gather_the_flock', name: 'Gather the Flock',
        icon: 'assets/icons/fc1154.png',
        description: 'All allies: shield worth 90% ATK for 3 turns; +10% turn meter.',
        cooldown: 5, targeting: 'all-allies', animation: 'idle', impact: 'shield_bubble',
        effects: [
          { type: 'shield', mult: 0.90, turns: 3 },
          { type: 'turnMeter', amount: 0.10 },
        ],
        levelUps: [
          { mult: 0.15 },
          { meter: 0.03 },
          { cooldown: -1 },
          { mult: 0.15 },
          { cooldown: -1 },
          { mult: 0.15 },
          { meter: 0.03 },
        ],
      },
    ],
    passive: {
      name: 'Set the Pace',
      icon: 'assets/icons/fc1155.png',
      // A real blessing with a real source, so everything that reads
      // speed buffs answers it: Tailwind's rungs, the bank that credits
      // her the fill it buys, and at 4pc the Windfall shove.
      description: 'Start of each turn: the slowest ally gains +10% SPD for 2 turns.',
      hooks: {
        onTurnStart(unit, battle) {
          if (!battle) return null;
          const mates = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (!mates.length) return null;
          const slow = mates.reduce((a, b) =>
            (b.effectiveStat('speed') < a.effectiveStat('speed') ? b : a));
          slow.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.10,
            turns: 2, source: unit });
          return { label: 'Set the Pace',
            message: `${unit.name} sets the pace for ${slow.name}.`,
            floats: [{ target: slow, text: 'SPD ▲', color: '#a8e8c8' }] };
        },
      },
    },
    positional: POSITIONALS.den_door,
  },

  // The second anthem, at full volume. Tessa is the sect's Windfall
  // battery: every verse is a speed blessing, and her passive keeps
  // them all ringing a turn longer.
  tessa: {
    id: 'tessa',
    element: 'wind',
    name: 'Tessa',
    title: 'The Anthem of Going',
    rarity: 4,
    stats: { hp: 1250, atk: 110, def: 95, speed: 126 },
    tint: { body: '#e8c8a8', helm: '#4a7a5a', weapon: '#c8e8d8', shield: '#2a4a3a' },
    sprite: {
      displayH: 82,
      strips: {
        idle: { src: 'assets/heroes/zephyrclaw/tessaidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'tessa_quickstep', name: 'Light Feet',
        icon: 'assets/icons/fc1156.png',
        description: 'One ally: +20% SPD for 2 turns.',
        cooldown: 0, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'buff', stat: 'speed', mult: 1.20, turns: 2 }],
        levelUps: [
          { buffPower: 0.05 },
          { buffPower: 0.05 },
          { duration: 1 },
          { buffPower: 0.05 },
          { buffPower: 0.05 },
        ],
      },
      {
        id: 'tessa_anthem_of_the_open_sky', name: 'Anthem of the Open Sky',
        icon: 'assets/icons/fc1157.png',
        description: 'All allies: +15% SPD for 2 turns.',
        cooldown: 4, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'buff', stat: 'speed', mult: 1.15, turns: 2 }],
        levelUps: [
          { buffPower: 0.05 },
          { cooldown: -1 },
          { duration: 1 },
          { buffPower: 0.05 },
          { cooldown: -1 },
          { buffPower: 0.05 },
        ],
      },
      {
        id: 'tessa_off_you_go', name: 'Off You Go',
        icon: 'assets/icons/fc1158.png',
        description: 'All allies: +15% turn meter; removes 1 debuff.',
        cooldown: 5, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [
          { type: 'turnMeter', amount: 0.15 },
          { type: 'cleanse', count: 1 },
        ],
        levelUps: [
          { meter: 0.03 },
          { cleanseCount: 1 },
          { cooldown: -1 },
          { meter: 0.03 },
          { cooldown: -1 },
          { meter: 0.03 },
          { cleanseCount: 1 },
        ],
      },
    ],
    passive: {
      name: 'Da Capo',
      icon: 'assets/icons/fc1159.png',
      // The song comes back around: a small slice of the extra-turn
      // channel the bosses already roll (extraTurnAdd), and half of
      // what wind resonance sells at 4 birds. It touches none of her
      // skill numbers, which matters: a passive that deepened her own
      // blessings would make every card on her sheet understate what
      // actually lands.
      description: '5% chance to act again after acting.',
      hooks: { extraTurnAdd: 0.05 },
    },
    positional: POSITIONALS.order_of_march,
  },

  // ---- 5-star ------------------------------------------------------
  // The arrow the whole sect exists to loose. Lira is a BACK-LINE
  // striker in a pride of givers: everything the other eight hand out
  // -- pace, bars, extra turns -- lands on her as damage, and Overrun
  // prices the overfill they stack on her at 10% a quarter-bar.
  lira: {
    id: 'lira',
    element: 'wind',
    name: 'Lira',
    title: 'Where the Wind Was Going',
    rarity: 5,
    stats: { hp: 1200, atk: 190, def: 80, speed: 130 },
    tint: { body: '#e8e0d0', helm: '#4a7a5a', weapon: '#8ae8c8', shield: '#2a4a3a' },
    sprite: {
      displayH: 84,
      strips: {
        idle: { src: 'assets/heroes/zephyrclaw/liraidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'lira_arrow_on_the_wind', name: 'Arrow on the Wind',
        icon: 'assets/icons/fc1160.png',
        description: 'One enemy: 115% ATK damage.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.15 }],
        levelUps: [
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
        ],
      },
      {
        id: 'lira_rain_of_points', name: 'Rain of Points',
        icon: 'assets/icons/fc1161.png',
        description: 'All enemies: 65% ATK damage.',
        cooldown: 4, targeting: 'all-enemies', animation: 'idle', impact: 'slash_effect',
        effects: [{ type: 'damage', mult: 0.65 }],
        levelUps: [
          { mult: 0.08 },
          { cooldown: -1 },
          { mult: 0.08 },
          { mult: 0.08 },
          { cooldown: -1 },
          { mult: 0.08 },
        ],
      },
      {
        id: 'lira_the_long_shot', name: 'The Parting Shot',
        icon: 'assets/icons/fc1162.png',
        description: 'One enemy: 240% ATK damage (ignores 25% DEF). Self: +15% turn meter.',
        cooldown: 6, targeting: 'enemy', animation: 'idle', impact: 'horizonal_slash',
        effects: [{ type: 'damage', mult: 2.40, ignoreDef: 0.25 }],
        selfEffects: [{ type: 'turnMeter', amount: 0.15 }],
        levelUps: [
          { mult: 0.20 },
          { cooldown: -1 },
          { mult: 0.20 },
          { mult: 0.20 },
          { cooldown: -1 },
          { mult: 0.20 },
          { mult: 0.20 },
        ],
      },
    ],
    passive: {
      name: 'Overrun',
      icon: 'assets/icons/fc1163.png',
      // Read at the swing, where the bar still holds everything the
      // pride stacked on it -- the meter resets AFTER the ability
      // resolves (Battle.afterAction), so overfill is spendable exactly
      // once, on the turn it bought.
      description: '+10% damage per full 25% of action bar held past full, to +40%.',
      hooks: {
        damageDealtMult(unit) {
          const over = unit.turnMeter - CONFIG.TURN_METER_MAX;
          if (over <= 0) return 1;
          const steps = Math.min(4, Math.floor(over / (CONFIG.TURN_METER_MAX * 0.25)));
          return 1 + 0.10 * steps;
        },
      },
    },
    positional: POSITIONALS.downwind_shot,
  },
};

Object.assign(HEROES, ZEPHYRCLAW);

if (typeof module !== 'undefined' && module.exports) module.exports = { ZEPHYRCLAW };
