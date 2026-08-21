// Cat heroes (42). Registered into the shared
// HEROES table declared in js/data/heroes.js.

Object.assign(HEROES, {

  cat_mouser: {
    id: 'cat_mouser',
    element: 'wind',
    name: 'Cat Mouser',
    title: 'Employed, Unlike Most Cats',
    rarity: 1,
    stats: { hp: 700, atk: 113, def: 56, speed: 106 },
    tint: { body: '#8a8a7a', helm: '#a8a89a', weapon: '#c8c0b0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catmouseridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'quick_bat', name: 'Quick Bat',
        icon: 'assets/icons/fc663.png',
        description: 'A batting paw: 93% ATK that flicks away 4% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.93 },
          { type: 'turnMeter', amount: -0.04 },
        ],
      },
      {
        id: 'corner_trap', name: 'Corner Trap',
        icon: 'assets/icons/fc825.png',
        description: 'Nowhere left to run: 134% ATK — 30% more against slowed or hasted prey.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.34, bonusVs: { stat: 'speed', mult: 1.3 } },
        ],
      },
      {
        id: 'pest_control', name: 'Pest Control',
        icon: 'assets/icons/fc744.png',
        description: 'Strictly business: 184% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.84 },
        ],
      },
    ],
    passive: {
      name: 'Mouse Sense',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 18% extra damage to enemies below 30% turn meter.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.turnMeter < CONFIG.TURN_METER_MAX * 0.3 ? 1.18 : 1;
        },
      },
    },
    positional: POSITIONALS.windrunner,
  },

  cat_angler: {
    id: 'cat_angler',
    element: 'water',
    name: 'Cat Angler',
    title: 'Paws Never Get Wet',
    rarity: 1,
    stats: { hp: 740, atk: 109, def: 60, speed: 100 },
    tint: { body: '#6a7a8a', helm: '#8a9aa8', weapon: '#a8d8e8', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catangleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'hooked_claw', name: 'Hooked Claw',
        icon: 'assets/icons/fc1444.png',
        description: 'A fish-hook swipe: 98% ATK that reels in 5% turn meter for herself.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.98 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.05 },
        ],
      },
      {
        id: 'patient_cast', name: 'Patient Cast',
        icon: 'assets/icons/fc862.png',
        description: 'Read the water: the target takes +22% damage for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'damageTaken', mult: 1.22, turns: 2 },
        ],
      },
      {
        id: 'perfect_catch', name: 'Perfect Catch',
        icon: 'assets/icons/fc734.png',
        description: 'The one she waited for: 172% ATK — 40% more against exposed (marked) prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.72, bonusVs: { stat: 'damageTaken', mult: 1.4 } },
        ],
      },
    ],
    passive: {
      name: 'Anglers Focus',
      icon: 'assets/icons/fc882.png',
      description: 'While above 80% HP, gains +12% crit chance for 1 turn at turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp <= 0.8) return null;
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.12, turns: 1 });
          return null; // silent — small rolling focus
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  cat_hearthcat: {
    id: 'cat_hearthcat',
    element: 'fire',
    name: 'Cat Hearthcat',
    title: 'Owns the Fireplace, Rents It Out',
    rarity: 1,
    stats: { hp: 780, atk: 105, def: 66, speed: 95 },
    tint: { body: '#c86a3a', helm: '#e88a4a', weapon: '#e8d8a8', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/cathearthcatidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'warm_swat', name: 'Warm Swat',
        icon: 'assets/icons/fc663.png',
        description: 'A toasty swat: 100% ATK plus a 12% ATK singe for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'dot', pct: 0.12, turns: 1 },
        ],
      },
      {
        id: 'coal_flick', name: 'Coal Flick',
        icon: 'assets/icons/fc981.png',
        description: 'Flick a live coal: 121% ATK plus a 30% ATK burn for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.21 },
          { type: 'dot', pct: 0.3, turns: 1 },
        ],
      },
      {
        id: 'hearth_glow', name: 'Hearth Glow',
        icon: 'assets/icons/fc1112.png',
        description: 'Share the warm spot: ALL allies heal 40% of ATK and gain +4% ATK for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.4 },
          { type: 'buff', stat: 'atk', mult: 1.04, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Hearth Warmth',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, mends 1.5% max HP and gains +3% crit chance for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.heal(Math.round(unit.maxHp * 0.015));
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.03, turns: 1 });
          return null; // silent — small rolling comfort
        },
      },
    },
    positional: POSITIONALS.lifeline,
  },

  cat_alleyscrapper: {
    id: 'cat_alleyscrapper',
    element: 'fire',
    name: 'Cat Alleyscrapper',
    title: 'Eight Lives of Experience',
    rarity: 1,
    stats: { hp: 760, atk: 112, def: 62, speed: 98 },
    tint: { body: '#5a5a5a', helm: '#7a7a6a', weapon: '#c8c0b0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catalleyscrapperidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'scrap_swipe', name: 'Scrap Swipe',
        icon: 'assets/icons/fc663.png',
        description: 'A no-rules swipe: 105% ATK and -4% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.05 },
          { type: 'debuff', stat: 'atk', mult: 0.96, turns: 1 },
        ],
      },
      {
        id: 'trash_lid_bash', name: 'Trash Lid Bash',
        icon: 'assets/icons/fc854.png',
        description: 'The alley provides: 129% ATK with an 8% chance to STUN for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.29 },
          { type: 'stun', chance: 0.08, turns: 1 },
        ],
      },
      {
        id: 'yowling_fury', name: 'Yowling Fury',
        icon: 'assets/icons/fc744.png',
        description: 'All claws at once: three cuts of 54% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.54 },
          { type: 'damage', mult: 0.54 },
          { type: 'damage', mult: 0.54 },
        ],
      },
    ],
    passive: {
      name: 'Ninth Life',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 40% less damage while below 15% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.alive && unit.hp / unit.maxHp < 0.15 ? 0.6 : 1;
        },
      },
    },
    positional: POSITIONALS.last_stand,
  },

  cat_birdwatcher: {
    id: 'cat_birdwatcher',
    element: 'wind',
    name: 'Cat Birdwatcher',
    title: 'Chirps Back, Insultingly',
    rarity: 1,
    stats: { hp: 720, atk: 111, def: 58, speed: 103 },
    tint: { body: '#7a8a6a', helm: '#9aaa7a', weapon: '#c8c0b0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catbirdwatcheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'window_pounce', name: 'Window Pounce',
        icon: 'assets/icons/fc1444.png',
        description: 'Through the curtain: 102% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.02 },
          { type: 'turnMeter', amount: -0.03 },
        ],
      },
      {
        id: 'feather_snatch', name: 'Feather Snatch',
        icon: 'assets/icons/fc825.png',
        description: 'Almost had it: 140% ATK and steals 8% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.4 },
          { type: 'turnMeter', amount: -0.08 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.08 },
        ],
      },
      {
        id: 'chatter_burst', name: 'Chatter Burst',
        icon: 'assets/icons/fc1084.png',
        description: 'That maddening chirp: ALL enemies lose 5% ATK and 2% turn meter.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'atk', mult: 0.95, turns: 1 },
          { type: 'turnMeter', amount: -0.02 },
        ],
      },
    ],
    passive: {
      name: 'Bird Watcher',
      icon: 'assets/icons/fc862.png',
      description: 'Eyes on the perch: +25% damage to enemies in a back hex.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.slot && !target.isBoss &&
            target.slot.position === POSITION.BACK ? 1.25 : 1;
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  cat_pouncer: {
    id: 'cat_pouncer',
    element: 'water',
    name: 'Cat Pouncer',
    title: 'Physics-Defying Since Kittenhood',
    rarity: 1,
    stats: { hp: 730, atk: 114, def: 57, speed: 105 },
    tint: { body: '#4a6a8a', helm: '#6a8aa8', weapon: '#c8c0b0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catpounceridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wiggle_pounce', name: 'Wiggle Pounce',
        icon: 'assets/icons/fc763.png',
        description: 'The tell-tale wiggle, then: 108% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.08 },
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
      {
        id: 'ceiling_drop', name: 'Ceiling Drop',
        icon: 'assets/icons/fc825.png',
        description: 'From an impossible angle: 149% ATK with a 10% chance to STUN for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.49 },
          { type: 'stun', chance: 0.1, turns: 1 },
        ],
      },
      {
        id: 'endless_energy', name: 'Endless Energy',
        icon: 'assets/icons/fc882.png',
        description: 'The zoomies, weaponized: +25% SPD for 2 turns and 20% turn meter.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.25, turns: 2 },
          { type: 'turnMeter', amount: 0.2 },
        ],
      },
    ],
    passive: {
      name: 'Pounce Timing',
      icon: 'assets/icons/fc867.png',
      description: 'Deals 25% extra damage to enemies above 90% turn meter.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.turnMeter > CONFIG.TURN_METER_MAX * 0.9 ? 1.25 : 1;
        },
      },
    },
    positional: POSITIONALS.overwatch,
  },

  cat_bellringer: {
    id: 'cat_bellringer',
    element: 'water',
    name: 'Cat Bellringer',
    title: 'The Bell Was Their Idea',
    rarity: 1,
    stats: { hp: 750, atk: 107, def: 63, speed: 99 },
    tint: { body: '#8a7a9a', helm: '#a89ab8', weapon: '#e8c83a', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catbellringeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bell_chime', name: 'Bell Chime',
        icon: 'assets/icons/fc1003.png',
        description: 'A resonant strike: 90% ATK and -6% turn meter... they hate the bell.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'turnMeter', amount: -0.06 },
        ],
      },
      {
        id: 'curfew_toll', name: 'Curfew Toll',
        icon: 'assets/icons/fc1084.png',
        description: 'The hour is late: ALL enemies lose 5% turn meter.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
      {
        id: 'midnight_peal', name: 'Midnight Peal',
        icon: 'assets/icons/fc767.png',
        description: 'The big bell: 145% ATK and -18% turn meter.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.45 },
          { type: 'turnMeter', amount: -0.18 },
        ],
      },
    ],
    passive: {
      name: 'Bell Toll',
      icon: 'assets/icons/fc882.png',
      description: 'At turn start, a random enemy loses 3% turn meter.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          target.turnMeter = Math.max(0, target.turnMeter - CONFIG.TURN_METER_MAX * 0.03);
          return null; // silent — small rolling toll
        },
      },
    },
    positional: POSITIONALS.standard_bearer,
  },

  cat_emberchaser: {
    id: 'cat_emberchaser',
    element: 'fire',
    name: 'Cat Emberchaser',
    title: 'Chases Sparks, Catches Some',
    rarity: 1,
    stats: { hp: 710, atk: 115, def: 55, speed: 104 },
    tint: { body: '#a8542a', helm: '#c8743a', weapon: '#f8a83a', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catemberchaseridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'spark_swat', name: 'Spark Swat',
        icon: 'assets/icons/fc981.png',
        description: 'Bat a live spark: 97% ATK plus a 18% ATK singe for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.97 },
          { type: 'dot', pct: 0.18, turns: 1 },
        ],
      },
      {
        id: 'ember_dash', name: 'Ember Dash',
        icon: 'assets/icons/fc744.png',
        description: 'A streak of orange: 143% ATK, carried onward: +7% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.43 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.07 },
        ],
      },
      {
        id: 'spark_shower', name: 'Spark Shower',
        icon: 'assets/icons/fc1044.png',
        description: 'Scatter the fire: 57% ATK to ALL enemies plus a 14% ATK singe for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.57 },
          { type: 'dot', pct: 0.14, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Chase the Spark',
      icon: 'assets/icons/fc868.png',
      description: 'Gains +7% SPD and +8% crit damage for 1 turn at each turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.07, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.08, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.toxicologist,
  },

  cat_longtail: {
    id: 'cat_longtail',
    element: 'wind',
    name: 'Cat Longtail',
    title: 'Balance Is a Birthright',
    rarity: 1,
    stats: { hp: 725, atk: 110, def: 59, speed: 102 },
    tint: { body: '#9a8a7a', helm: '#b8a89a', weapon: '#c8c0b0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catlongtailidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'tail_lash', name: 'Tail Lash',
        icon: 'assets/icons/fc1447.png',
        description: 'A whip of the tail: 96% ATK and -3% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
          { type: 'debuff', stat: 'speed', mult: 0.97, turns: 1 },
        ],
      },
      {
        id: 'high_wire_strike', name: 'High-Wire Strike',
        icon: 'assets/icons/fc825.png',
        description: 'From the fence top: 139% ATK, landing light: +6% SPD for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.39 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.06, turns: 2 },
        ],
      },
      {
        id: 'nimble_recovery', name: 'Nimble Recovery',
        icon: 'assets/icons/fc854.png',
        description: 'Always lands standing: cleanses own debuffs and gains 15% turn meter.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'cleanse' },
          { type: 'turnMeter', amount: 0.15 },
        ],
      },
    ],
    passive: {
      name: 'Tail Balance',
      icon: 'assets/icons/fc882.png',
      description: '+13% chance to dodge while above 60% HP.',
      hooks: {
        dodgeAdd(unit) {
          return unit.hp / unit.maxHp > 0.6 ? 0.13 : 0;
        },
      },
    },
    positional: POSITIONALS.pivot_step,
  },

  cat_swashbuckler: {
    id: 'cat_swashbuckler',
    element: 'water',
    name: 'Cat Swashbuckler',
    title: 'Boots Sold Separately',
    rarity: 2,
    stats: { hp: 840, atk: 132, def: 66, speed: 110 },
    tint: { body: '#3a5a8a', helm: '#e8433a', weapon: '#d8d8e0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catswashbuckleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'flashing_point', name: 'Flashing Point',
        icon: 'assets/icons/fc1587.png',
        description: 'A gleaming thrust: 107% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.07 },
          { type: 'turnMeter', amount: -0.06 },
        ],
      },
      {
        id: 'riposte_flourish', name: 'Riposte Flourish',
        icon: 'assets/icons/fc1454.png',
        description: 'Parry, wink, reply: 146% ATK and +10% crit chance for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.46 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.1, turns: 1 },
        ],
      },
      {
        id: 'grand_duel', name: 'Grand Duel',
        icon: 'assets/icons/fc728.png',
        description: 'The finishing lesson: 196% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.96 },
        ],
      },
    ],
    passive: {
      name: 'En Garde',
      icon: 'assets/icons/fc867.png',
      description: 'Gains +8% crit chance and +12% crit damage for 1 turn at each turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.08, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.12, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.reckless_charge,
  },

  cat_shadowpaw: {
    id: 'cat_shadowpaw',
    element: 'dark',
    name: 'Cat Shadowpaw',
    title: 'Was Never Actually There',
    rarity: 3,
    stats: { hp: 1030, atk: 181, def: 72, speed: 114 },
    tint: { body: '#1a1a2a', helm: '#3a3a4a', weapon: '#8a6ab8', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catshadowpawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'umbral_swipe', name: 'Umbral Swipe',
        icon: 'assets/icons/fc1444.png',
        description: 'A swipe from a shadow that was empty: 111% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.11 },
          { type: 'turnMeter', amount: -0.04 },
        ],
      },
      {
        id: 'shadow_pin', name: 'Shadow Pin',
        icon: 'assets/icons/fc825.png',
        description: 'Pin their shadow to the ground: 136% ATK and -14% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.36 },
          { type: 'turnMeter', amount: -0.14 },
        ],
      },
      {
        id: 'total_eclipse', name: 'Total Eclipse',
        icon: 'assets/icons/fc734.png',
        description: 'The light gives up: 182% ATK — 35% more against enemies below half turn meter.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.82 },
        ],
      },
    ],
    passive: {
      name: 'Shadow Meld',
      icon: 'assets/icons/fc862.png',
      description: '+8% chance to drain 20% AP on attack.',
      hooks: { apDrainAdd: 0.08 },
    },
    positional: POSITIONALS.marked_quarry,
  },

  cat_lynxarcher: {
    id: 'cat_lynxarcher',
    element: 'wind',
    name: 'Cat Lynxarcher',
    title: 'Sees the Arrow Land First',
    rarity: 2,
    stats: { hp: 830, atk: 136, def: 62, speed: 108 },
    tint: { body: '#8a7a5a', helm: '#a89a6a', weapon: '#b8a878', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catlynxarcheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'tufted_shot', name: 'Tufted Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'A whisker-guided arrow: 109% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.09 },
          { type: 'turnMeter', amount: -0.03 },
        ],
      },
      {
        id: 'lead_the_target', name: 'Lead the Target',
        icon: 'assets/icons/fc1516.png',
        description: 'Aim where they will be: 151% ATK — 25% more against slowed or hasted prey.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.51, bonusVs: { stat: 'speed', mult: 1.25 } },
        ],
      },
      {
        id: 'skyline_volley', name: 'Skyline Volley',
        icon: 'assets/icons/fc807.png',
        description: 'Arrows over the rooftops: 63% ATK to ALL enemies.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.63 },
          { type: 'turnMeter', amount: -0.03 },
        ],
      },
    ],
    passive: {
      name: 'Lynx Eye',
      icon: 'assets/icons/fc863.png',
      description: 'Gains +20% crit damage and +4% crit chance for 1 turn at each turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.20, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.04, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.opening_volley,
  },

  cat_pantherblade: {
    id: 'cat_pantherblade',
    element: 'fire',
    name: 'Cat Pantherblade',
    title: 'Silence with an Edge',
    rarity: 2,
    stats: { hp: 860, atk: 140, def: 64, speed: 109 },
    tint: { body: '#2a2a2a', helm: '#4a3a3a', weapon: '#d8d8e0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catpantherbladeidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'velvet_cut', name: 'Velvet Cut',
        icon: 'assets/icons/fc1447.png',
        description: 'You hear it after it lands: 112% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.12 },
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
      {
        id: 'silent_lunge', name: 'Silent Lunge',
        icon: 'assets/icons/fc825.png',
        description: 'Between heartbeats: 154% ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.54 },
          { type: 'turnMeter', amount: -0.1 },
        ],
      },
      {
        id: 'night_execution', name: 'Night Execution',
        icon: 'assets/icons/fc734.png',
        description: 'The quiet ending: 178% ATK plus an 36% ATK bleed for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.78 },
          { type: 'dot', pct: 0.36, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Panther Stalk',
      icon: 'assets/icons/fc862.png',
      description: 'Stalks the unwary: deals 20% extra damage to enemies with no debuffs.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && !target.statusEffects.some((fx) => fx.kind === 'debuff' || fx.kind === 'dot') ? 1.2 : 1;
        },
      },
    },
    positional: POSITIONALS.toxicologist,
  },

  cat_tomcat: {
    id: 'cat_tomcat',
    element: 'fire',
    name: 'Cat Tomcat',
    title: 'Loud About Everything',
    rarity: 2,
    stats: { hp: 880, atk: 130, def: 72, speed: 101 },
    tint: { body: '#c88a4a', helm: '#e8a85a', weapon: '#c8c0b0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/cattomcatidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'brash_swipe', name: 'Brash Swipe',
        icon: 'assets/icons/fc663.png',
        description: 'Two big showy swipes: 61% ATK each.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.61 },
          { type: 'damage', mult: 0.61 },
        ],
      },
      {
        id: 'caterwaul', name: 'Caterwaul',
        icon: 'assets/icons/fc1084.png',
        description: 'An unreasonable noise: ALL enemies lose 6% ATK and 4% crit chance for 1 turn.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'atk', mult: 0.94, turns: 1 },
          { type: 'debuff', stat: 'critChance', add: -0.04, turns: 1 },
        ],
      },
      {
        id: 'king_of_the_fence', name: 'King of the Fence',
        icon: 'assets/icons/fc730.png',
        description: 'Prove it again: 167% ATK, then swaggers: +10% ATK for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.67 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.1, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Swagger',
      icon: 'assets/icons/fc867.png',
      description: 'Gains +5% ATK and +5% SPD for 1 turn at each turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.05, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.05, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.bloodied_fury,
  },

  cat_silkdancer: {
    id: 'cat_silkdancer',
    element: 'water',
    name: 'Cat Silkdancer',
    title: 'Gravity Signed a Waiver',
    rarity: 2,
    stats: { hp: 810, atk: 128, def: 65, speed: 112 },
    tint: { body: '#b8a8c8', helm: '#d8c8e8', weapon: '#e8e8f8', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catsilkdanceridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'ribbon_step', name: 'Ribbon Step',
        icon: 'assets/icons/fc1447.png',
        description: 'A dancing cut: 103% ATK, flowing on: +4% SPD and 4% meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.03 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.04, turns: 1 },
          { type: 'turnMeter', amount: 0.04 },
        ],
      },
      {
        id: 'veil_spin', name: 'Veil Spin',
        icon: 'assets/icons/fc729.png',
        description: 'A spinning veil across a hex row: 98% ATK and -4% turn meter.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.98 },
          { type: 'turnMeter', amount: -0.04 },
        ],
      },
      {
        id: 'finale_leap', name: 'Finale Leap',
        icon: 'assets/icons/fc882.png',
        description: 'The impossible final pose: +20% SPD for 2 turns, cleansed, and 10% turn meter.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.2, turns: 2 },
          { type: 'cleanse' },
          { type: 'turnMeter', amount: 0.1 },
        ],
      },
    ],
    passive: {
      name: 'Silk Steps',
      icon: 'assets/icons/fc882.png',
      description: '+9% chance to take an extra turn after acting.',
      hooks: { extraTurnAdd: 0.09 },
    },
    positional: POSITIONALS.standard_bearer,
  },

  cat_clockwatcher: {
    id: 'cat_clockwatcher',
    element: 'wind',
    name: 'Cat Clockwatcher',
    title: 'Knows Exactly When Dinner Is',
    rarity: 2,
    stats: { hp: 850, atk: 126, def: 70, speed: 107 },
    tint: { body: '#6a6a8a', helm: '#8a8aa8', weapon: '#e8c83a', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catclockwatcheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'minute_hand', name: 'Minute Hand',
        icon: 'assets/icons/fc1461.png',
        description: 'Right on schedule: 104% ATK and -7% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.04 },
          { type: 'turnMeter', amount: -0.07 },
        ],
      },
      {
        id: 'pendulum_swing', name: 'Pendulum Swing',
        icon: 'assets/icons/fc767.png',
        description: 'Tick, tock: 133% ATK and -16% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.33 },
          { type: 'turnMeter', amount: -0.16 },
        ],
      },
      {
        id: 'stopped_clock', name: 'Stopped Clock',
        icon: 'assets/icons/fc1084.png',
        description: 'Time out: ALL enemies lose 8% turn meter and 4% SPD for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'turnMeter', amount: -0.08 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Clockwork Timing',
      icon: 'assets/icons/fc863.png',
      description: '+5% chance to drain 20% AP on attack.',
      hooks: { apDrainAdd: 0.05 },
    },
    positional: POSITIONALS.standard_bearer,
  },

  cat_purrmother: {
    id: 'cat_purrmother',
    element: 'water',
    name: 'Cat Purrmother',
    title: 'The Purr Is Medicinal',
    rarity: 2,
    stats: { hp: 900, atk: 120, def: 76, speed: 100 },
    tint: { body: '#d8c8b8', helm: '#e8d8c8', weapon: '#e8d8a8', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catpurrmotheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'gentle_correction', name: 'Gentle Correction',
        icon: 'assets/icons/fc663.png',
        description: 'Claws in, mostly: 95% ATK and -4% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'debuff', stat: 'atk', mult: 0.96, turns: 1 },
        ],
      },
      {
        id: 'healing_purr', name: 'Healing Purr',
        icon: 'assets/icons/fc1112.png',
        description: 'The deep purr: heals an ally 14% of her max HP plus 2% regen for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.14 },
          { type: 'hot', pct: 0.02, turns: 2 },
        ],
      },
      {
        id: 'nap_pile', name: 'Nap Pile',
        icon: 'assets/icons/fc800.png',
        description: 'Everyone in the sunbeam: ALL allies heal 42% of ATK and regenerate 1.5% of her max HP for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.42 },
          { type: 'hot', pct: 0.015, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Healing Purr Aura',
      icon: 'assets/icons/fc1003.png',
      description: 'Her healing is 20% stronger.',
      hooks: { healBoostAdd: 0.20 },
    },
    positional: POSITIONALS.warding_circle,
  },

  cat_highwaycat: {
    id: 'cat_highwaycat',
    element: 'fire',
    name: 'Cat Highwaycat',
    title: 'Your Meter or Your Life',
    rarity: 2,
    stats: { hp: 845, atk: 134, def: 63, speed: 111 },
    tint: { body: '#4a3a2a', helm: '#6a5a3a', weapon: '#d8d8e0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/cathighwaycatidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'toll_swipe', name: 'Toll Swipe',
        icon: 'assets/icons/fc1444.png',
        description: 'Payment collected: 101% ATK, pocketing 6% turn meter for himself.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.01 },
          { type: 'turnMeter', amount: -0.06 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.06 },
        ],
      },
      {
        id: 'stand_and_deliver', name: 'Stand and Deliver',
        icon: 'assets/icons/fc825.png',
        description: 'The classic line: 144% ATK and -12% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.44 },
          { type: 'turnMeter', amount: -0.12 },
        ],
      },
      {
        id: 'clean_getaway', name: 'Clean Getaway',
        icon: 'assets/icons/fc744.png',
        description: 'Gone before the shout: 158% ATK, escaping with +15% SPD for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.58 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.15, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Highway Toll',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 20% extra damage to enemies above 75% turn meter.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.turnMeter > CONFIG.TURN_METER_MAX * 0.75 ? 1.2 : 1;
        },
      },
    },
    positional: POSITIONALS.opening_volley,
  },

  cat_ratter: {
    id: 'cat_ratter',
    element: 'wind',
    name: 'Cat Ratter',
    title: 'Contract Work, Paid in Kind',
    rarity: 2,
    stats: { hp: 870, atk: 131, def: 68, speed: 105 },
    tint: { body: '#7a6a5a', helm: '#9a8a6a', weapon: '#c8c0b0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catratteridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'terrier_shake', name: 'Terrier Shake',
        icon: 'assets/icons/fc1444.png',
        description: 'Grab and shake: 106% ATK and -6% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.06 },
          { type: 'debuff', stat: 'def', mult: 0.94, turns: 1 },
        ],
      },
      {
        id: 'burrow_flush', name: 'Burrow Flush',
        icon: 'assets/icons/fc724.png',
        description: 'Flush them into the open: 96% ATK to a hex row and -3% turn meter.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
          { type: 'turnMeter', amount: -0.03 },
        ],
      },
      {
        id: 'exterminator', name: 'Exterminator',
        icon: 'assets/icons/fc734.png',
        description: 'The contract concludes: 186% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.86 },
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
    ],
    passive: {
      name: 'Born Ratter',
      icon: 'assets/icons/fc867.png',
      description: 'Professional pride: deals 30% extra damage to rats (the Rat King included).',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.def && target.def.id && target.def.id.indexOf('rat') !== -1 ? 1.3 : 1;
        },
      },
    },
    positional: POSITIONALS.reckless_charge,
  },

  cat_tigerlord: {
    id: 'cat_tigerlord',
    element: 'fire',
    name: 'Cat Tigerlord',
    title: 'The Jungle Pays Tribute',
    rarity: 3,
    stats: { hp: 1130, atk: 182, def: 84, speed: 106 },
    tint: { body: '#c8742a', helm: '#2a2a2a', weapon: '#d8d8e0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/cattigerlordidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'tigers_claim', name: 'Tiger\'s Claim',
        icon: 'assets/icons/fc746.png',
        description: 'A ruling stroke: 115% ATK and -5% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.15 },
          { type: 'debuff', stat: 'def', mult: 0.95, turns: 1 },
        ],
      },
      {
        id: 'burning_stripes', name: 'Burning Stripes',
        icon: 'assets/icons/fc744.png',
        description: 'Stripes in the tall grass: 162% ATK plus a 28% ATK bleed for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.62 },
          { type: 'dot', pct: 0.28, turns: 1 },
        ],
      },
      {
        id: 'kings_hunt', name: 'King\'s Hunt',
        icon: 'assets/icons/fc730.png',
        description: 'The hunt ends where he says: 145% ATK to the front line.',
        cooldown: 7, targeting: 'front-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.45 },
        ],
      },
    ],
    passive: {
      name: 'Apex Stripes',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 10% extra damage, and +5% chance for an extra turn.',
      hooks: {
        damageDealtMult() { return 1.1; },
        extraTurnAdd: 0.05,
      },
    },
    positional: POSITIONALS.keystone,
  },

  cat_snowlynx: {
    id: 'cat_snowlynx',
    element: 'water',
    name: 'Cat Snowlynx',
    title: 'Winter Fits Her Perfectly',
    rarity: 3,
    stats: { hp: 1090, atk: 176, def: 82, speed: 109 },
    tint: { body: '#d8e0e8', helm: '#e8e8f8', weapon: '#a8d8e8', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catsnowlynxidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'powder_step', name: 'Powder Step',
        icon: 'assets/icons/fc1444.png',
        description: 'Silent over snow: 110% ATK and -4% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.1 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 1 },
        ],
      },
      {
        id: 'drift_ambush', name: 'Drift Ambush',
        icon: 'assets/icons/fc825.png',
        description: 'The snowbank was her: 159% ATK with a 15% chance to STUN for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.59 },
          { type: 'stun', chance: 0.15, turns: 1 },
        ],
      },
      {
        id: 'white_silence', name: 'White Silence',
        icon: 'assets/icons/fc1044.png',
        description: 'Snowfall swallows sound: ALL enemies lose 7% SPD for 2 turns and 3% turn meter.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'speed', mult: 0.93, turns: 2 },
          { type: 'turnMeter', amount: -0.03 },
        ],
      },
    ],
    passive: {
      name: 'Snow Silence',
      icon: 'assets/icons/fc856.png',
      description: 'At turn start, a random enemy loses 4% SPD for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          target.addStatusEffect({ kind: 'debuff', stat: 'speed', mult: 0.96, turns: 1 });
          return null; // silent — small rolling hush
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  cat_cheetahstrike: {
    id: 'cat_cheetahstrike',
    element: 'wind',
    name: 'Cat Cheetahstrike',
    title: 'Arrives Before the Decision',
    rarity: 3,
    stats: { hp: 1050, atk: 186, def: 78, speed: 118 },
    tint: { body: '#d8b04a', helm: '#2a2a2a', weapon: '#c8c0b0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catcheetahstrikeidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'blur_claw', name: 'Blur Claw',
        icon: 'assets/icons/fc1447.png',
        description: 'Too fast to parry: 113% ATK, streaking on: +5% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.13 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.05 },
        ],
      },
      {
        id: 'full_sprint', name: 'Full Sprint',
        icon: 'assets/icons/fc744.png',
        description: 'The ground loses: 174% ATK, then must breathe: -8% own turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.74 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: -0.08 },
        ],
      },
      {
        id: 'sonic_pounce', name: 'Sonic Pounce',
        icon: 'assets/icons/fc763.png',
        description: 'Break the air: 205% ATK with a 12% chance to STUN for 1 turn.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.05 },
          { type: 'stun', chance: 0.12, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Explosive Start',
      icon: 'assets/icons/fc882.png',
      description: 'The first strike of the hunt: +35% damage on her first turn of battle.',
      hooks: {
        onTurnStart(unit) {
          unit._turnCount = (unit._turnCount || 0) + 1;
          return null; // counting silently
        },
        damageDealtMult(unit) {
          return (unit._turnCount || 0) <= 1 ? 1.35 : 1;
        },
      },
    },
    positional: POSITIONALS.opening_volley,
  },

  cat_pumaprowler: {
    id: 'cat_pumaprowler',
    element: 'water',
    name: 'Cat Pumaprowler',
    title: 'The Long Quiet Before',
    rarity: 3,
    stats: { hp: 1160, atk: 170, def: 90, speed: 104 },
    tint: { body: '#8a7a6a', helm: '#a89a8a', weapon: '#c8c0b0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catpumaprowleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'prowling_swipe', name: 'Prowling Swipe',
        icon: 'assets/icons/fc663.png',
        description: 'Patience, then claws: 114% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.14 },
          { type: 'turnMeter', amount: -0.04 },
        ],
      },
      {
        id: 'ridge_stalk', name: 'Ridge Stalk',
        icon: 'assets/icons/fc862.png',
        description: 'Marked from above: the target takes +28% damage for 1 turn and loses 8% turn meter.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'damageTaken', mult: 1.28, turns: 1 },
          { type: 'turnMeter', amount: -0.08 },
        ],
      },
      {
        id: 'silent_takedown', name: 'Silent Takedown',
        icon: 'assets/icons/fc734.png',
        description: 'The quiet answer: 191% ATK — 35% more against exposed (marked) prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.91, bonusVs: { stat: 'damageTaken', mult: 1.35 } },
        ],
      },
    ],
    passive: {
      name: 'Prowler\'s Patience',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 15% less damage while below 60% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.alive && unit.hp / unit.maxHp < 0.6 ? 0.85 : 1;
        },
      },
    },
    positional: POSITIONALS.bulwark_oath,
  },

  cat_lionheart: {
    id: 'cat_lionheart',
    element: 'fire',
    name: 'Cat Lionheart',
    title: 'Courage in a Small Package',
    rarity: 3,
    stats: { hp: 1210, atk: 168, def: 92, speed: 102 },
    tint: { body: '#c89a4a', helm: '#e8b85a', weapon: '#d8d8e0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catlionheartidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'braveheart_slash', name: 'Braveheart Slash',
        icon: 'assets/icons/fc1587.png',
        description: 'No hesitation: 116% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.16 },
          { type: 'turnMeter', amount: -0.03 },
        ],
      },
      {
        id: 'rallying_roar', name: 'Rallying Roar',
        icon: 'assets/icons/fc869.png',
        description: 'Bigger than he looks: ALL allies gain +9% ATK for 2 turns and 5% turn meter.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.09, turns: 2 },
          { type: 'turnMeter', amount: 0.05 },
        ],
      },
      {
        id: 'lions_share', name: 'Lion\'s Share',
        icon: 'assets/icons/fc730.png',
        description: 'Claim the biggest fight: 176% ATK and -10% ATK for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.76 },
          { type: 'debuff', stat: 'atk', mult: 0.9, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Lion Heart',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, ALL allies gain +5% crit chance for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const ally of battle.livingUnits(unit.team)) {
            ally.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.05, turns: 1 });
          }
          return null; // silent — small rolling courage
        },
      },
    },
    positional: POSITIONALS.keystone,
  },

  cat_moonwhisker: {
    id: 'cat_moonwhisker',
    element: 'light',
    name: 'Cat Moonwhisker',
    title: 'Sees by Light That Is Not There',
    rarity: 3,
    stats: { hp: 1140, atk: 164, def: 86, speed: 107 },
    tint: { body: '#e8e0d8', helm: '#f8e8c8', weapon: '#f8d86a', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catmoonwhiskeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'moonbeam_swat', name: 'Moonbeam Swat',
        icon: 'assets/icons/fc1447.png',
        description: 'A silvered swat: 100% ATK, gathering light: +5% crit chance for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'turnMeter', amount: -0.04 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.05, turns: 1 },
        ],
      },
      {
        id: 'lunar_blessing', name: 'Lunar Blessing',
        icon: 'assets/icons/fc1112.png',
        description: 'Moonlight mends: heals an ally 13% of her max HP and grants 12% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.13 },
          { type: 'turnMeter', amount: 0.12 },
        ],
      },
      {
        id: 'full_moon_rite', name: 'Full Moon Rite',
        icon: 'assets/icons/fc855.png',
        description: 'The whole pride glows: ALL allies heal 55% of ATK, gain +5% SPD for 2 turns, and 4% turn meter.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.55 },
          { type: 'buff', stat: 'speed', mult: 1.05, turns: 2 },
          { type: 'turnMeter', amount: 0.04 },
        ],
      },
    ],
    passive: {
      name: 'Moonlit Whiskers',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, the most afflicted ally sheds one debuff and gains 5% turn meter.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team);
          let worst = null, count = 0;
          for (const a of allies) {
            const n = a.statusEffects.filter(
              (fx) => fx.kind === 'debuff' || fx.kind === 'dot').length;
            if (n > count) { worst = a; count = n; }
          }
          if (!worst) return null;
          const idx = worst.statusEffects.findIndex(
            (fx) => fx.kind === 'debuff' || fx.kind === 'dot');
          worst.statusEffects.splice(idx, 1);
          worst.turnMeter = Math.min(CONFIG.TURN_METER_MAX,
            worst.turnMeter + CONFIG.TURN_METER_MAX * 0.05);
          return {
            label: 'Moonlit Whiskers',
            message: `${unit.name}'s moonlight frees ${worst.name}.`,
            floats: [{ target: worst, text: 'CLEANSE', color: '#f8d86a' }],
          };
        },
      },
    },
    positional: POSITIONALS.field_medic,
  },

  // ---- Drake cohort (the Volcano) -----------------------------------------
  // Procedural placeholder art renders until real idle sheets land at the
  // conventional flat paths (assets/heroes/drake<role>idle.png).

  cat_headhunter: {
    id: 'cat_headhunter',
    element: 'dark',
    name: 'Cat Headhunter',
    title: 'The sentence is the swing.',
    rarity: 3,
    stats: { hp: 1158, atk: 179, def: 92, speed: 103 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catheadhunteridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_headhunter_edge', name: 'Headhunter\'s Edge',
        icon: 'assets/icons/fc734.png',
        description: 'Two dark cuts: 81% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.81 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'cat_headhunter_sentence', name: 'Headhunter\'s Sentence',
        icon: 'assets/icons/fc730.png',
        description: 'Pass judgment: 191% ATK and the target takes +12% damage for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.91 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.12, turns: 1 },
        ],
      },
      {
        id: 'cat_headhunter_end', name: 'Headhunter\'s End',
        icon: 'assets/icons/fc728.png',
        description: 'Carry it out: 267% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.67 },
        ],
      },
    ],
    passive: {
      name: 'Headhunter\'s Due',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 21% extra damage to enemies below 42% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.42 ? 1.21 : 1;
        },
      },
    },
    positional: POSITIONALS.standard_bearer,
  },

  cat_hexwhisker: {
    id: 'cat_hexwhisker',
    element: 'dark',
    name: 'Cat Hexwhisker',
    title: 'Carries every curse worth having.',
    rarity: 3,
    stats: { hp: 1167, atk: 184, def: 95, speed: 105 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/cathexwhiskeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_hexwhisker_lash', name: 'Hexwhisker Lash',
        icon: 'assets/icons/fc1052.png',
        description: 'Two cursed lashes: 82% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.82 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'cat_hexwhisker_bane', name: 'Hexwhisker Bane',
        icon: 'assets/icons/fc1084.png',
        description: 'A layered curse: 192% ATK, -15% ATK and -11% DEF for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.92 },
          { type: 'debuff', stat: 'atk', mult: 0.85, turns: 2 },
          { type: 'debuff', stat: 'def', mult: 0.89, turns: 2 },
        ],
      },
      {
        id: 'cat_hexwhisker_pall', name: 'Hexwhisker Pall',
        icon: 'assets/icons/fc1050.png',
        description: 'A pall over everything: 145% ATK to ALL enemies and -4% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.46 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Hexwhisker Craft',
      icon: 'assets/icons/fc1093.png',
      description: 'Curses honed in the dark.',
      hooks: { accuracyAdd: 0.16, dotBoostAdd: 0.04 },
    },
    positional: POSITIONALS.vanguard_press,
  },

  cat_bloodlapper: {
    id: 'cat_bloodlapper',
    element: 'dark',
    name: 'Cat Bloodlapper',
    title: 'Your vigor, redistributed.',
    rarity: 3,
    stats: { hp: 1176, atk: 159, def: 98, speed: 107 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catbloodlapperidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_bloodlapper_sip', name: 'Bloodlapper\'s Sip',
        icon: 'assets/icons/fc1444.png',
        description: 'Two draining touches: 83% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.83 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'cat_bloodlapper_feast', name: 'Bloodlapper\'s Feast',
        icon: 'assets/icons/fc825.png',
        description: 'Drink deep: 193% ATK, healing himself for 44% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.93 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.44 },
        ],
      },
      {
        id: 'cat_bloodlapper_toll', name: 'Bloodlapper\'s Toll',
        icon: 'assets/icons/fc1112.png',
        description: 'Tax the living: 137% ATK to ALL enemies while he mends 13% of his max HP.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.37 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.13 },
        ],
      },
    ],
    passive: {
      name: 'Bloodlapper Hunger',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, siphons 2.8% of his max HP from a random enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const amount = Math.max(1, Math.round(unit.maxHp * 0.028));
          Abilities.strike(unit, target, amount);
          unit.heal(amount);
          return null; // silent — small rolling hunger
        },
      },
    },
    positional: POSITIONALS.overwatch,
  },

  cat_duskstalker: {
    id: 'cat_duskstalker',
    element: 'dark',
    name: 'Cat Duskstalker',
    title: 'The dark keeps its edge honed.',
    rarity: 3,
    stats: { hp: 1185, atk: 164, def: 101, speed: 109 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catduskstalkeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_duskstalker_flick', name: 'Duskstalker Flick',
        icon: 'assets/icons/fc1447.png',
        description: 'Two flickering cuts: 84% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.84 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'cat_duskstalker_waltz', name: 'Duskstalker Waltz',
        icon: 'assets/icons/fc1587.png',
        description: 'A step through shadow: 194% ATK and +13% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.94 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.13, turns: 1 },
        ],
      },
      {
        id: 'cat_duskstalker_finale', name: 'Duskstalker Finale',
        icon: 'assets/icons/fc723.png',
        description: 'The last figure: 258% ATK — 25% more against debuffed prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.58, bonusVs: { kind: 'debuff', mult: 1.25 } },
        ],
      },
    ],
    passive: {
      name: 'Duskstalker Poise',
      icon: 'assets/icons/fc862.png',
      description: 'A blade kept perfectly balanced (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.04, turns: 2 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.06, turns: 2 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.focal_point,
  },

  cat_doomyowler: {
    id: 'cat_doomyowler',
    element: 'dark',
    name: 'Cat Doomyowler',
    title: 'Fear arrives before the blow.',
    rarity: 3,
    stats: { hp: 1194, atk: 169, def: 80, speed: 111 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catdoomyowleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_doomyowler_knell', name: 'Doomyowler Knell',
        icon: 'assets/icons/fc1003.png',
        description: 'Two tolling blows: 85% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'cat_doomyowler_omen', name: 'Doomyowler Omen',
        icon: 'assets/icons/fc1084.png',
        description: 'Name their doom: 175% ATK and -16% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.75 },
          { type: 'debuff', stat: 'atk', mult: 0.84, turns: 2 },
        ],
      },
      {
        id: 'cat_doomyowler_chorus', name: 'Doomyowler Chorus',
        icon: 'assets/icons/fc807.png',
        description: 'The dread chorus: 144% ATK to ALL enemies and -7% crit chance for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.44 },
          { type: 'debuff', stat: 'critChance', add: -0.07, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Doomyowler Presence',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, dread spreads: ALL enemies lose 2.5% turn meter.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const e of battle.livingUnits(unit.enemyTeam())) {
            e.turnMeter = Math.max(0, e.turnMeter - CONFIG.TURN_METER_MAX * 0.025);
          }
          return null; // silent — small rolling dread
        },
      },
    },
    positional: POSITIONALS.bloodied_fury,
  },

  cat_lightpurr: {
    id: 'cat_lightpurr',
    element: 'light',
    name: 'Cat Lightpurr',
    title: 'Every wound answers to the light.',
    rarity: 3,
    stats: { hp: 1203, atk: 174, def: 83, speed: 113 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catlightpurridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_lightpurr_rebuke', name: 'Lightpurr\'s Rebuke',
        icon: 'assets/icons/fc1471.png',
        description: 'Two shining raps: 86% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.86 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'cat_lightpurr_grace', name: 'Lightpurr\'s Grace',
        icon: 'assets/icons/fc1112.png',
        description: 'Pour in the light: heals an ally 92.7% of ATK and cleanses their debuffs.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.927 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'cat_lightpurr_communion', name: 'Lightpurr\'s Communion',
        icon: 'assets/icons/fc800.png',
        description: 'Shared light: ALL allies heal 66.2% of ATK plus 1.1% of max HP regen for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.662 },
          { type: 'hot', pct: 0.011, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Lightpurr Devotion',
      icon: 'assets/icons/fc1093.png',
      description: 'Healing hands, steadied by faith.',
      hooks: { healBoostAdd: 0.24, dodgeAdd: 0.02 },
    },
    positional: POSITIONALS.windrunner,
  },

  cat_aegistail: {
    id: 'cat_aegistail',
    element: 'light',
    name: 'Cat Aegistail',
    title: 'A shield the sun would envy.',
    rarity: 3,
    stats: { hp: 1212, atk: 179, def: 86, speed: 97 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/cataegistailidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_aegistail_check', name: 'Aegistail\'s Check',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield checks: 87% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.87 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'cat_aegistail_ward', name: 'Aegistail\'s Ward',
        icon: 'assets/icons/fc855.png',
        description: 'Raise the aegis over an ally: they take 5% less damage for 2 turns and heal 217.5% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.95, turns: 2 },
          { type: 'heal', mult: 2.175 },
        ],
      },
      {
        id: 'cat_aegistail_vigil', name: 'Aegistail\'s Vigil',
        icon: 'assets/icons/fc856.png',
        description: 'The unbroken vigil: ALL allies gain +13% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.14, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Aegistail Constancy',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, shields the most wounded ally: takes 3% less damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.97, turns: 1 });
          return null; // silent — small rolling shelter
        },
      },
    },
    positional: POSITIONALS.pivot_step,
  },

  cat_dawnpouncer: {
    id: 'cat_dawnpouncer',
    element: 'light',
    name: 'Cat Dawnpouncer',
    title: 'Morning, sharpened.',
    rarity: 3,
    stats: { hp: 1221, atk: 184, def: 89, speed: 99 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catdawnpounceridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_dawnpouncer_stroke', name: 'Dawnpouncer Stroke',
        icon: 'assets/icons/fc1587.png',
        description: 'Two dawn-lit strokes: 88% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.88 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'cat_dawnpouncer_flare', name: 'Dawnpouncer Flare',
        icon: 'assets/icons/fc1447.png',
        description: 'A flare of morning: 198% ATK, and the light mends 12% of max HP.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.98 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.12 },
        ],
      },
      {
        id: 'cat_dawnpouncer_zenith', name: 'Dawnpouncer Zenith',
        icon: 'assets/icons/fc730.png',
        description: 'High noon: 261% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.61 },
        ],
      },
    ],
    passive: {
      name: 'Dawnpouncer Resolve',
      icon: 'assets/icons/fc1003.png',
      description: 'Heals 12% max HP at turn start while below 15% HP.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp >= 0.15) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.12));
          if (healed <= 0) return null;
          return {
            label: 'Dawnpouncer Resolve',
            message: `${unit.name}'s light knits ${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#f8d86a' }],
          };
        },
      },
    },
    positional: POSITIONALS.shield_wall,
  },

  cat_sunsinger: {
    id: 'cat_sunsinger',
    element: 'light',
    name: 'Cat Sunsinger',
    title: 'Good news travels armed.',
    rarity: 3,
    stats: { hp: 1230, atk: 159, def: 92, speed: 101 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catsunsingeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_sunsinger_call', name: 'Sunsinger\'s Call',
        icon: 'assets/icons/fc868.png',
        description: 'Two ringing notes: 89% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.89 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'cat_sunsinger_proclamation', name: 'Sunsinger\'s Proclamation',
        icon: 'assets/icons/fc869.png',
        description: 'Lift an ally: +17% ATK for 2 turns and 13% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.17, turns: 2 },
          { type: 'turnMeter', amount: 0.13 },
        ],
      },
      {
        id: 'cat_sunsinger_triumph', name: 'Sunsinger\'s Triumph',
        icon: 'assets/icons/fc882.png',
        description: 'Declare the day won: ALL allies gain +8% SPD for 2 turns and 4% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.08, turns: 2 },
          { type: 'turnMeter', amount: 0.04 },
        ],
      },
    ],
    passive: {
      name: 'Sunsinger Anthem',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start: ALL allies gain +2% SPD for 2 turns.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) { a.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.02, turns: 2 }); }
          return null; // silent — small rolling anthem
        },
      },
    },
    positional: POSITIONALS.field_medic,
  },

  cat_oathclaw: {
    id: 'cat_oathclaw',
    element: 'light',
    name: 'Cat Oathclaw',
    title: 'Verdicts delivered in person.',
    rarity: 3,
    stats: { hp: 1239, atk: 164, def: 95, speed: 103 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catoathclawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_oathclaw_gavel', name: 'Oathclaw\'s Gavel',
        icon: 'assets/icons/fc1461.png',
        description: 'Two measured blows: 90% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'cat_oathclaw_inquest', name: 'Oathclaw\'s Inquest',
        icon: 'assets/icons/fc862.png',
        description: 'Open the case: 190% ATK and the target takes +21% damage for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.9 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.21, turns: 2 },
        ],
      },
      {
        id: 'cat_oathclaw_verdict', name: 'Oathclaw\'s Verdict',
        icon: 'assets/icons/fc744.png',
        description: 'Deliver the verdict: 263% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.63 },
        ],
      },
    ],
    passive: {
      name: 'Oathclaw Justice',
      icon: 'assets/icons/fc863.png',
      description: 'Justice sees clearly: deals 25% extra damage to armor-broken enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'debuff' && fx.stat === 'def') ? 1.25 : 1;
        },
      },
    },
    positional: POSITIONALS.lifeline,
  },

  cat_bladewhisker: {
    id: 'cat_bladewhisker',
    element: 'fire',
    name: 'Cat Bladewhisker',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1502, atk: 224, def: 123, speed: 114 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catbladewhiskeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_bladewhisker_strike', name: 'Bladewhisker\'s Strike',
        icon: 'assets/icons/fc730.png',
        description: 'Two champion blows: 90% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'cat_bladewhisker_onslaught', name: 'Bladewhisker\'s Onslaught',
        icon: 'assets/icons/fc1447.png',
        description: 'Press the advantage: 203% ATK, then +14% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.03 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.14, turns: 2 },
        ],
      },
      {
        id: 'cat_bladewhisker_supremacy', name: 'Bladewhisker\'s Supremacy',
        icon: 'assets/icons/fc767.png',
        description: 'Settle it: 254% ATK and -8% DEF for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.54 },
          { type: 'debuff', stat: 'def', mult: 0.92, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Bladewhisker Supremacy',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 12% more and takes 3% less damage.',
      hooks: {
        damageDealtMult() { return 1.12; },
        damageTakenMult() { return 0.97; },
      },
    },
    positional: POSITIONALS.bloodied_fury,
  },

  cat_runepurr: {
    id: 'cat_runepurr',
    element: 'wind',
    name: 'Cat Runepurr',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1514, atk: 230, def: 127, speed: 100 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catrunepurridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_runepurr_bolt', name: 'Runepurr\'s Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'Twin arcane bolts: 59.6% then 32.1% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.596 },
          { type: 'damage', mult: 0.321 },
        ],
      },
      {
        id: 'cat_runepurr_torrent', name: 'Runepurr\'s Torrent',
        icon: 'assets/icons/fc1084.png',
        description: 'A torrent of power: 94.3% ATK to ALL enemies and -7% SPD for 2 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.943 },
          { type: 'debuff', stat: 'speed', mult: 0.93, turns: 2 },
        ],
      },
      {
        id: 'cat_runepurr_cataclysm', name: 'Runepurr\'s Cataclysm',
        icon: 'assets/icons/fc1044.png',
        description: 'The big one: 104.8% ATK to ALL enemies and -8% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.048 },
          { type: 'debuff', stat: 'atk', mult: 0.92, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Runepurr Resonance',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, arcane bleed sears ALL enemies for 1.5% of this hero\'s max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.maxHp * 0.015));
          for (const e of enemies) Abilities.strike(unit, e, amount);
          return null; // silent — small rolling resonance
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  cat_walltail: {
    id: 'cat_walltail',
    element: 'water',
    name: 'Cat Walltail',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1526, atk: 200, def: 105, speed: 103 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catwalltailidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_walltail_bash', name: 'Walltail\'s Bash',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield strikes: 92% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.92 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'cat_walltail_bulwark', name: 'Walltail\'s Bulwark',
        icon: 'assets/icons/fc855.png',
        description: 'Anchor the line: ALL allies gain +16% DEF for 2 turns and take 4% less damage for 1 turn.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.16, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.96, turns: 1 },
        ],
      },
      {
        id: 'cat_walltail_stand', name: 'Walltail\'s Stand',
        icon: 'assets/icons/fc856.png',
        description: 'Refuse to fall: takes 33% less damage for 2 turns and heals 15% max HP.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.67, turns: 2 },
          { type: 'healHpPct', pct: 0.15 },
        ],
      },
    ],
    passive: {
      name: 'Walltail Aegis',
      icon: 'assets/icons/fc868.png',
      description: 'Unhurried and unhurt: takes 17% less damage while above 70% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.hp / unit.maxHp > 0.7 ? 0.83 : 1;
        },
      },
    },
    positional: POSITIONALS.shield_wall,
  },

  cat_farwhisker: {
    id: 'cat_farwhisker',
    element: 'fire',
    name: 'Cat Farwhisker',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1538, atk: 206, def: 109, speed: 106 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catfarwhiskeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_farwhisker_shot', name: 'Farwhisker\'s Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'Two placed shots: 93% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.93 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'cat_farwhisker_deadeye', name: 'Farwhisker\'s Deadeye',
        icon: 'assets/icons/fc1516.png',
        description: 'The perfect line: 216% ATK and drains 14% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.16 },
          { type: 'turnMeter', amount: -0.14 },
        ],
      },
      {
        id: 'cat_farwhisker_barrage', name: 'Farwhisker\'s Barrage',
        icon: 'assets/icons/fc807.png',
        description: 'Fill the sky: 142% ATK to ALL enemies.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.42 },
          { type: 'turnMeter', amount: -0.02 },
        ],
      },
    ],
    passive: {
      name: 'Farwhisker Focus',
      icon: 'assets/icons/fc862.png',
      description: 'The shot is already lined up (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.06, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.06, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.marked_quarry,
  },

  cat_mistpaw: {
    id: 'cat_mistpaw',
    element: 'wind',
    name: 'Cat Mistpaw',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1550, atk: 212, def: 113, speed: 109 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catmistpawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_mistpaw_touch', name: 'Mistpaw\'s Touch',
        icon: 'assets/icons/fc1112.png',
        description: 'Two chastening touches: 94% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.94 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'cat_mistpaw_blessing', name: 'Mistpaw\'s Blessing',
        icon: 'assets/icons/fc800.png',
        description: 'Mend an ally: 19% of max HP plus 2.9% regen for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.19 },
          { type: 'hot', pct: 0.029, turns: 2 },
        ],
      },
      {
        id: 'cat_mistpaw_renewal', name: 'Mistpaw\'s Renewal',
        icon: 'assets/icons/fc869.png',
        description: 'The circle holds: ALL allies heal 52% of ATK, are cleansed, and gain +5% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.52 },
          { type: 'cleanse' },
          { type: 'buff', stat: 'def', mult: 1.05, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Mistpaw Communion',
      icon: 'assets/icons/fc1003.png',
      description: 'Healing woven a little stronger.',
      hooks: { healBoostAdd: 0.07, resistanceAdd: 0.12 },
    },
    positional: POSITIONALS.warding_circle,
  },

  cat_nullwhisker: {
    id: 'cat_nullwhisker',
    element: 'dark',
    name: 'Cat Nullwhisker',
    title: 'Champion of the Dark',
    rarity: 4,
    stats: { hp: 1562, atk: 218, def: 117, speed: 112 },
    tint: { body: '#241f33', helm: '#3d3350', weapon: '#9a7ad0', skin: '#8a82a0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catnullwhiskeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_nullwhisker_grasp', name: 'Nullwhisker\'s Grasp',
        icon: 'assets/icons/fc1444.png',
        description: 'Two grasping shadows: 95% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'cat_nullwhisker_devour', name: 'Nullwhisker\'s Devour',
        icon: 'assets/icons/fc825.png',
        description: 'Feed the void: 198% ATK, healing this hero for 40% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.98 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.4 },
        ],
      },
      {
        id: 'cat_nullwhisker_oblivion', name: 'Nullwhisker\'s Oblivion',
        icon: 'assets/icons/fc734.png',
        description: 'Unmake them: 269% ATK and the target takes +23% damage for 1 turn.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.69 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.23, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Nullwhisker Thirst',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, drains 2.7% of max HP from the weakest enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          enemies.sort((a, b) => a.hp - b.hp);
          const amount = Math.max(1, Math.round(unit.maxHp * 0.027));
          Abilities.strike(unit, enemies[0], amount);
          unit.heal(amount);
          return null; // silent — small rolling thirst
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  cat_glorypaw: {
    id: 'cat_glorypaw',
    element: 'light',
    name: 'Cat Glorypaw',
    title: 'Champion of the Dawn',
    rarity: 4,
    stats: { hp: 1574, atk: 224, def: 121, speed: 115 },
    tint: { body: '#e0d3a8', helm: '#f5e9c0', weapon: '#ffdf70', skin: '#f0e4c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catglorypawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_glorypaw_radiance', name: 'Glorypaw\'s Radiance',
        icon: 'assets/icons/fc1471.png',
        description: 'Two radiant strikes: 96% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'cat_glorypaw_benediction', name: 'Glorypaw\'s Benediction',
        icon: 'assets/icons/fc1112.png',
        description: 'Bless an ally: heals 21% of max HP and grants 15% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.21 },
          { type: 'turnMeter', amount: 0.15 },
        ],
      },
      {
        id: 'cat_glorypaw_ascension', name: 'Glorypaw\'s Ascension',
        icon: 'assets/icons/fc855.png',
        description: 'Lift the whole line: ALL allies heal 58% of ATK and gain +8% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.58 },
          { type: 'buff', stat: 'atk', mult: 1.08, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Glorypaw Benevolence',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, ALL allies heal 0.3% of this hero\'s max HP and gain a small speed blessing for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) {
            a.heal(Math.round(unit.maxHp * 0.003), unit);
            a.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.04, turns: 1 });
          }
          return null; // silent — small rolling benevolence
        },
      },
    },
    positional: POSITIONALS.keystone,
  },

});
