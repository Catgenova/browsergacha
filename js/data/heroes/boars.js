// Boar heroes (42). Registered into the shared
// HEROES table declared in js/data/heroes.js.

Object.assign(HEROES, {

  boar_tusker: {
    id: 'boar_tusker',
    element: 'fire',
    name: 'Boar Tusker',
    title: 'Two Points of Argument',
    rarity: 1,
    stats: { hp: 860, atk: 110, def: 76, speed: 90 },
    tint: { body: '#8a5a3a', helm: '#a87a4a', weapon: '#e8e0d8', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boartuskeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'tusk_jab', name: 'Tusk Jab',
        icon: 'assets/icons/fc746.png',
        description: 'A hooking tusk for 111% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.11 },
        ],
      },
      {
        id: 'goring_rush', name: 'Goring Rush',
        icon: 'assets/icons/fc763.png',
        description: 'A short, brutal rush: 142% ATK and -7% DEF for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.42 },
          { type: 'debuff', stat: 'def', mult: 0.93, turns: 1 },
        ],
      },
      {
        id: 'double_gore', name: 'Double Gore',
        icon: 'assets/icons/fc744.png',
        description: 'Both tusks: two hits of 82% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.82 },
          { type: 'damage', mult: 0.82 },
        ],
      },
    ],
    passive: {
      name: 'First Gore',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 18% extra damage to enemies at full HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp >= target.maxHp ? 1.18 : 1;
        },
      },
    },
    positional: POSITIONALS.reckless_charge,
  },

  boar_forager: {
    id: 'boar_forager',
    element: 'water',
    name: 'Boar Forager',
    title: 'Finds Lunch Anywhere',
    rarity: 1,
    stats: { hp: 880, atk: 102, def: 78, speed: 89 },
    tint: { body: '#7a6a5a', helm: '#9a8a6a', weapon: '#b8a878', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarforageridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snout_shove', name: 'Snout Shove',
        icon: 'assets/icons/fc663.png',
        description: 'A rooting shove: 96% ATK that drains 6% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.96 },
          { type: 'turnMeter', amount: -0.06 },
        ],
      },
      {
        id: 'share_the_find', name: 'Share the Find',
        icon: 'assets/icons/fc1112.png',
        description: 'Split the truffle: heals an ally 115% of ATK and grants 5% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.15 },
          { type: 'turnMeter', amount: 0.05 },
        ],
      },
      {
        id: 'forage_feast', name: 'Forage Feast',
        icon: 'assets/icons/fc800.png',
        description: 'Lay out the haul: ALL allies heal 45% of ATK and gain +8% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.45 },
          { type: 'buff', stat: 'def', mult: 1.08, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Truffle Cache',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, eats a little: heals himself 2% and the most wounded other ally 1% of his max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          const self = unit.heal(Math.round(unit.maxHp * 0.02));
          const allies = battle.livingUnits(unit.team)
            .filter((u) => u !== unit && u.hp < u.maxHp);
          if (allies.length > 0) {
            allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
            allies[0].heal(Math.round(unit.maxHp * 0.01), unit);
          }
          return null; // silent — small rolling snack
        },
      },
    },
    positional: POSITIONALS.lifeline,
  },

  boar_mudback: {
    id: 'boar_mudback',
    element: 'water',
    name: 'Boar Mudback',
    title: 'Armored in the Wallow',
    rarity: 1,
    stats: { hp: 940, atk: 100, def: 84, speed: 86 },
    tint: { body: '#5a4a3a', helm: '#7a6a4a', weapon: '#a8a098', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarmudbackidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'mud_slap', name: 'Mud Slap',
        icon: 'assets/icons/fc981.png',
        description: 'A wet slap of mud: 88% ATK and -5% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.88 },
          { type: 'debuff', stat: 'atk', mult: 0.95, turns: 1 },
        ],
      },
      {
        id: 'wallow_charge', name: 'Wallow Charge',
        icon: 'assets/icons/fc762.png',
        description: 'A slithering charge: 126% ATK, recoated: +10% DEF for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.26 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.1, turns: 2 },
        ],
      },
      {
        id: 'mudslide', name: 'Mudslide',
        icon: 'assets/icons/fc767.png',
        description: 'Send the wallow downhill: 80% ATK to a hex row and -8% SPD for 1 turn.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'debuff', stat: 'speed', mult: 0.92, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Wallow',
      icon: 'assets/icons/fc856.png',
      description: 'At turn start, the mud draws out one poison and mends 1% max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          const idx = unit.statusEffects.findIndex((fx) => fx.kind === 'dot');
          if (idx === -1) return null;
          unit.statusEffects.splice(idx, 1);
          unit.heal(Math.round(unit.maxHp * 0.01));
          return {
            label: 'Wallow',
            message: `${unit.name}'s mud coat draws out the poison.`,
            floats: [{ target: unit, text: 'CLEANSE', color: '#a89a6a' }],
          };
        },
      },
    },
    positional: POSITIONALS.thornguard,
  },

  boar_thistlehide: {
    id: 'boar_thistlehide',
    element: 'wind',
    name: 'Boar Thistlehide',
    title: 'Hugs Are Inadvisable',
    rarity: 1,
    stats: { hp: 900, atk: 104, def: 82, speed: 88 },
    tint: { body: '#6a7a4a', helm: '#8a9a5a', weapon: '#a8c86a', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarthistlehideidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bristle_rake', name: 'Bristle Rake',
        icon: 'assets/icons/fc1444.png',
        description: 'A raking pass of quills: 97% ATK plus a 14% ATK bleed for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.97 },
          { type: 'dot', pct: 0.14, turns: 1 },
        ],
      },
      {
        id: 'quill_shake', name: 'Quill Shake',
        icon: 'assets/icons/fc807.png',
        description: 'Shake loose a cloud of thistles: 58% ATK to ALL enemies.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.58 },
        ],
      },
      {
        id: 'thistle_wall', name: 'Thistle Wall',
        icon: 'assets/icons/fc854.png',
        description: 'Bristle up: +25% DEF and takes 15% less damage for 2 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.25, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.85, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Thistle Coat',
      icon: 'assets/icons/fc867.png',
      description: '+8% chance to reflect all incoming damage.',
      hooks: { reflectAdd: 0.08 },
    },
    positional: POSITIONALS.thornguard,
  },

  boar_charger: {
    id: 'boar_charger',
    element: 'fire',
    name: 'Boar Charger',
    title: 'Brakes Not Included',
    rarity: 1,
    stats: { hp: 830, atk: 116, def: 68, speed: 96 },
    tint: { body: '#a84a2a', helm: '#c86a3a', weapon: '#c8c0b0', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarchargeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'headlong_rush', name: 'Headlong Rush',
        icon: 'assets/icons/fc744.png',
        description: 'A committed rush: 118% ATK, but overshooting costs 5% of his own meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.18 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
      {
        id: 'full_gallop', name: 'Full Gallop',
        icon: 'assets/icons/fc763.png',
        description: 'Terminal boar velocity: 152% ATK with a 15% chance to STUN for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.52 },
          { type: 'stun', chance: 0.15, turns: 1 },
        ],
      },
      {
        id: 'through_the_wall', name: 'Through the Wall',
        icon: 'assets/icons/fc767.png',
        description: 'Go through, not around: 175% ATK and -10% DEF for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.75 },
          { type: 'debuff', stat: 'def', mult: 0.9, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Momentum Tusks',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 15% extra damage while above 80% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return unit.hp / unit.maxHp > 0.8 ? 1.15 : 1;
        },
      },
    },
    positional: POSITIONALS.reckless_charge,
  },

  boar_rootdigger: {
    id: 'boar_rootdigger',
    element: 'water',
    name: 'Boar Rootdigger',
    title: 'The Ground Gives Up First',
    rarity: 1,
    stats: { hp: 910, atk: 103, def: 80, speed: 87 },
    tint: { body: '#6a5a4a', helm: '#8a7a5a', weapon: '#b8a878', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarrootdiggeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'root_rip', name: 'Root Rip',
        icon: 'assets/icons/fc1472.png',
        description: 'Tear through roots and shins alike: 122% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.22 },
        ],
      },
      {
        id: 'turned_earth', name: 'Turned Earth',
        icon: 'assets/icons/fc862.png',
        description: 'Churn their footing: -12% SPD and -8% DEF for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'speed', mult: 0.88, turns: 1 },
          { type: 'debuff', stat: 'def', mult: 0.92, turns: 1 },
        ],
      },
      {
        id: 'sinkhole', name: 'Sinkhole',
        icon: 'assets/icons/fc767.png',
        description: 'Open the ground: 130% ATK and -20% turn meter.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
          { type: 'turnMeter', amount: -0.2 },
        ],
      },
    ],
    passive: {
      name: 'Deep Roots',
      icon: 'assets/icons/fc856.png',
      description: '+15% debuff resistance and takes 4% less damage.',
      hooks: {
        resistanceAdd: 0.15,
        damageTakenMult() { return 0.96; },
      },
    },
    positional: POSITIONALS.lifeline,
  },

  boar_sunbasker: {
    id: 'boar_sunbasker',
    element: 'fire',
    name: 'Boar Sunbasker',
    title: 'Professional Warm Rock',
    rarity: 1,
    stats: { hp: 890, atk: 108, def: 74, speed: 89 },
    tint: { body: '#c88a4a', helm: '#e8a85a', weapon: '#e8d8a8', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarsunbaskeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'warm_shoulder', name: 'Warm Shoulder',
        icon: 'assets/icons/fc663.png',
        description: 'A sun-warmed shoulder check: 124% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.24 },
        ],
      },
      {
        id: 'stored_heat', name: 'Stored Heat',
        icon: 'assets/icons/fc1050.png',
        description: 'Release the day\'s heat: 128% ATK plus a 32% ATK burn for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.28 },
          { type: 'dot', pct: 0.32, turns: 1 },
        ],
      },
      {
        id: 'long_nap', name: 'Long Nap',
        icon: 'assets/icons/fc1112.png',
        description: 'Doze off mid-battle: recovers 30% max HP and +15% DEF for 1 turn.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.30 },
          { type: 'buff', stat: 'def', mult: 1.15, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Basking Heat',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, gains +6% ATK for 1 turn and mends 1.5% max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.06, turns: 1 });
          unit.heal(Math.round(unit.maxHp * 0.015));
          return null; // silent — small rolling warmth
        },
      },
    },
    positional: POSITIONALS.press_the_flank,
  },

  boar_dustroller: {
    id: 'boar_dustroller',
    element: 'wind',
    name: 'Boar Dustroller',
    title: 'Ambient Dirt Hazard',
    rarity: 1,
    stats: { hp: 850, atk: 107, def: 72, speed: 94 },
    tint: { body: '#9a8a6a', helm: '#b8a87a', weapon: '#c8b898', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boardustrolleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'dusty_headbutt', name: 'Dusty Headbutt',
        icon: 'assets/icons/fc762.png',
        description: 'A gritty headbutt: 101% ATK and -3% crit chance for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.01 },
          { type: 'debuff', stat: 'critChance', add: -0.03, turns: 1 },
        ],
      },
      {
        id: 'roll_out', name: 'Roll Out',
        icon: 'assets/icons/fc744.png',
        description: 'A rolling strike: 136% ATK, dusting himself off: +6% DEF for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.36 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.06, turns: 2 },
        ],
      },
      {
        id: 'dust_devil', name: 'Dust Devil',
        icon: 'assets/icons/fc807.png',
        description: 'Kick up a blinding column: ALL enemies lose 6% crit chance and 3% SPD for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'critChance', add: -0.06, turns: 1 },
          { type: 'debuff', stat: 'speed', mult: 0.97, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Dust Cloud',
      icon: 'assets/icons/fc882.png',
      description: 'Kicks up more dust the harder it is pressed: +12% dodge, doubled below half HP.',
      hooks: {
        dodgeAdd(unit) {
          return unit.hp / unit.maxHp < 0.5 ? 0.24 : 0.12;
        },
      },
    },
    positional: POSITIONALS.standard_bearer,
  },

  boar_squealer: {
    id: 'boar_squealer',
    element: 'wind',
    name: 'Boar Squealer',
    title: 'Alarm with Legs',
    rarity: 1,
    stats: { hp: 820, atk: 105, def: 70, speed: 97 },
    tint: { body: '#b87a8a', helm: '#d89aa8', weapon: '#c8c0b0', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarsquealeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'ear_splitter', name: 'Ear-Splitter',
        icon: 'assets/icons/fc1003.png',
        description: 'A squeal at point blank: 91% ATK and -6% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.91 },
          { type: 'debuff', stat: 'atk', mult: 0.94, turns: 1 },
        ],
      },
      {
        id: 'panic_call', name: 'Panic Call',
        icon: 'assets/icons/fc868.png',
        description: 'A rallying shriek: an ally gains 15% turn meter and +10% SPD for 1 turn.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'turnMeter', amount: 0.15 },
          { type: 'buff', stat: 'speed', mult: 1.1, turns: 1 },
        ],
      },
      {
        id: 'deafening_chorus', name: 'Deafening Chorus',
        icon: 'assets/icons/fc1084.png',
        description: 'The whole sounder joins in: ALL enemies lose 8% ATK for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'atk', mult: 0.92, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Piercing Squeal',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, a random enemy loses 4% DEF for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          target.addStatusEffect({ kind: 'debuff', stat: 'def', mult: 0.96, turns: 1 });
          return null; // silent — small rolling screech
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  boar_ironhide: {
    id: 'boar_ironhide',
    element: 'water',
    name: 'Boar Ironhide',
    title: 'Dents Incoming Weapons',
    rarity: 2,
    stats: { hp: 1060, atk: 116, def: 100, speed: 86 },
    tint: { body: '#5a5a6a', helm: '#7a7a8a', weapon: '#a8a0a8', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarironhideidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'iron_shoulder', name: 'Iron Shoulder',
        icon: 'assets/icons/fc854.png',
        description: 'A plated shoulder slam: 90% of DEF as damage.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 0.9 },
        ],
      },
      {
        id: 'anvil_stance', name: 'Anvil Stance',
        icon: 'assets/icons/fc855.png',
        description: 'Set like an anvil: +30% DEF for 2 turns and takes 10% less damage for 1 turn.',
        cooldown: 3, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.3, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.9, turns: 1 },
        ],
      },
      {
        id: 'iron_avalanche', name: 'Iron Avalanche',
        icon: 'assets/icons/fc1476.png',
        description: 'Bring the whole harness down: 140% of DEF as damage.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 1.4 },
        ],
      },
    ],
    passive: {
      name: 'Ironhide Plates',
      icon: 'assets/icons/fc856.png',
      description: '+10% chance to reflect all incoming damage.',
      hooks: { reflectAdd: 0.10 },
    },
    positional: POSITIONALS.iron_wake,
  },

  boar_bulwark: {
    id: 'boar_bulwark',
    element: 'water',
    name: 'Boar Bulwark',
    title: 'The Line Is Him',
    rarity: 2,
    stats: { hp: 1100, atk: 112, def: 104, speed: 84 },
    tint: { body: '#4a5a6a', helm: '#6a7a8a', weapon: '#c8c0b0', shield: '#8a9ab8', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarbulwarkidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'shield_snout', name: 'Shield Snout',
        icon: 'assets/icons/fc1471.png',
        description: 'A snout-first block-and-strike: 75% of DEF as damage, guarding: takes 8% less damage until next turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 0.75 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.92, turns: 1 },
        ],
      },
      {
        id: 'hold_the_wall', name: 'Hold the Wall',
        icon: 'assets/icons/fc855.png',
        description: 'Anchor the wall: front-hex allies gain +18% DEF and take 5% less damage for 2 turns.',
        cooldown: 5, targeting: 'front-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.18, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.95, turns: 2 },
        ],
      },
      {
        id: 'rampart_toss', name: 'Rampart Toss',
        icon: 'assets/icons/fc767.png',
        description: 'Heave them off the wall: 120% of DEF as damage and -12% turn meter.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 1.2 },
          { type: 'turnMeter', amount: -0.12 },
        ],
      },
    ],
    passive: {
      name: 'Rampart Stance',
      icon: 'assets/icons/fc854.png',
      description: 'Gains +12% DEF for 2 turns at each turn start (briefly stacks).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.12, turns: 2 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.thornguard,
  },

  boar_brushfire: {
    id: 'boar_brushfire',
    element: 'fire',
    name: 'Boar Brushfire',
    title: 'Sparks Follow Him Around',
    rarity: 2,
    stats: { hp: 920, atk: 134, def: 76, speed: 99 },
    tint: { body: '#a85a2a', helm: '#c87a3a', weapon: '#e8843a', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarbrushfireidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'spark_tusk', name: 'Spark Tusk',
        icon: 'assets/icons/fc981.png',
        description: 'A flint-striking tusk: 94% ATK plus a 26% ATK burn for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.94 },
          { type: 'dot', pct: 0.26, turns: 1 },
        ],
      },
      {
        id: 'firebreak_charge', name: 'Firebreak Charge',
        icon: 'assets/icons/fc744.png',
        description: 'Charge through the burn line: 138% ATK plus a 40% ATK burn for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.38 },
          { type: 'dot', pct: 0.4, turns: 2 },
        ],
      },
      {
        id: 'brushfire_ring', name: 'Brushfire Ring',
        icon: 'assets/icons/fc1044.png',
        description: 'Light the grass in a ring: 55% ATK to ALL enemies plus a 30% ATK burn for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.55 },
          { type: 'dot', pct: 0.3, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Smoldering Bristles',
      icon: 'assets/icons/fc1093.png',
      description: '+10% DoT damage and deals 5% extra damage.',
      hooks: {
        dotBoostAdd: 0.10,
        damageDealtMult() { return 1.05; },
      },
    },
    positional: POSITIONALS.keystone,
  },

  boar_stampeder: {
    id: 'boar_stampeder',
    element: 'fire',
    name: 'Boar Stampeder',
    title: 'First of Many Hooves',
    rarity: 2,
    stats: { hp: 950, atk: 130, def: 80, speed: 101 },
    tint: { body: '#8a4a3a', helm: '#a86a4a', weapon: '#c8c0b0', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarstampederidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'hoof_beat', name: 'Hoof Beat',
        icon: 'assets/icons/fc762.png',
        description: 'A drumming strike: 104% ATK, building speed: +5% SPD for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.04 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.05, turns: 2 },
        ],
      },
      {
        id: 'herd_charge', name: 'Herd Charge',
        icon: 'assets/icons/fc763.png',
        description: 'Hit like the whole herd: 148% ATK and -8% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.48 },
          { type: 'turnMeter', amount: -0.08 },
        ],
      },
      {
        id: 'endless_stampede', name: 'Endless Stampede',
        icon: 'assets/icons/fc730.png',
        description: 'The stampede arrives: 78% ATK to a hex row, twice.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.78 },
          { type: 'damage', mult: 0.78 },
        ],
      },
    ],
    passive: {
      name: 'Stampede Heart',
      icon: 'assets/icons/fc882.png',
      description: '+6% chance to take an extra turn after acting.',
      hooks: { extraTurnAdd: 0.06 },
    },
    positional: POSITIONALS.reckless_charge,
  },

  boar_thornmail: {
    id: 'boar_thornmail',
    element: 'wind',
    name: 'Boar Thornmail',
    title: 'Wearable Retaliation',
    rarity: 2,
    stats: { hp: 1000, atk: 118, def: 96, speed: 88 },
    tint: { body: '#5a6a3a', helm: '#7a8a4a', weapon: '#a8c86a', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarthornmailidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'thorn_press', name: 'Thorn Press',
        icon: 'assets/icons/fc1461.png',
        description: 'Press the thorns in: 85% of DEF as damage plus a 12% ATK bleed for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 0.85 },
          { type: 'dot', pct: 0.12, turns: 1 },
        ],
      },
      {
        id: 'barbed_lockup', name: 'Barbed Lockup',
        icon: 'assets/icons/fc862.png',
        description: 'Wrap them in barbs: 110% of DEF as damage and -10% SPD for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 1.1 },
          { type: 'debuff', stat: 'speed', mult: 0.9, turns: 2 },
        ],
      },
      {
        id: 'hedge_of_spines', name: 'Hedge of Spines',
        icon: 'assets/icons/fc855.png',
        description: 'Become the hedge: ALL allies gain +12% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.12, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Bristleback',
      icon: 'assets/icons/fc867.png',
      description: '+8% chance to reflect all incoming damage and +8% debuff resistance.',
      hooks: { reflectAdd: 0.08, resistanceAdd: 0.08 },
    },
    positional: POSITIONALS.bulwark_oath,
  },

  boar_mireguard: {
    id: 'boar_mireguard',
    element: 'water',
    name: 'Boar Mireguard',
    title: 'Swamp Property Enforcement',
    rarity: 2,
    stats: { hp: 1040, atk: 114, def: 98, speed: 87 },
    tint: { body: '#4a5a4a', helm: '#6a7a5a', weapon: '#8a9a7a', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarmireguardidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bog_shoulder', name: 'Bog Shoulder',
        icon: 'assets/icons/fc854.png',
        description: 'A sodden check: 80% of DEF as damage and -6% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 0.8 },
          { type: 'debuff', stat: 'speed', mult: 0.94, turns: 1 },
        ],
      },
      {
        id: 'quagmire_hold', name: 'Quagmire Hold',
        icon: 'assets/icons/fc862.png',
        description: 'Drag them into the mire: -15% SPD and -10% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'speed', mult: 0.85, turns: 2 },
          { type: 'debuff', stat: 'atk', mult: 0.9, turns: 2 },
        ],
      },
      {
        id: 'swampwall_slam', name: 'Swampwall Slam',
        icon: 'assets/icons/fc1476.png',
        description: 'The swamp itself swings: 125% of DEF as damage.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 1.25 },
        ],
      },
    ],
    passive: {
      name: 'Mire Stance',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 20% less damage while below 40% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.alive && unit.hp / unit.maxHp < 0.4 ? 0.8 : 1;
        },
      },
    },
    positional: POSITIONALS.thornguard,
  },

  boar_gorehorn: {
    id: 'boar_gorehorn',
    element: 'fire',
    name: 'Boar Gorehorn',
    title: 'Shields Are a Suggestion',
    rarity: 2,
    stats: { hp: 930, atk: 138, def: 78, speed: 98 },
    tint: { body: '#7a3a2a', helm: '#9a5a3a', weapon: '#e8e0d8', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boargorehornidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'horn_hook', name: 'Horn Hook',
        icon: 'assets/icons/fc746.png',
        description: 'A hooking gore: 106% ATK — 20% more against DEF-altered foes.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.06, bonusVs: { stat: 'def', mult: 1.2 } },
        ],
      },
      {
        id: 'shieldsplitter', name: 'Shieldsplitter',
        icon: 'assets/icons/fc1472.png',
        description: 'Split the guard: 135% ATK and -12% DEF for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.35 },
          { type: 'debuff', stat: 'def', mult: 0.88, turns: 2 },
        ],
      },
      {
        id: 'gore_the_line', name: 'Gore the Line',
        icon: 'assets/icons/fc730.png',
        description: 'Rip along the shields: 95% ATK to the front line.',
        cooldown: 6, targeting: 'front-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
        ],
      },
    ],
    passive: {
      name: 'Gore Momentum',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 25% extra damage to enemies with raised DEF (any DEF buff).',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'buff' && fx.stat === 'def') ? 1.25 : 1;
        },
      },
    },
    positional: POSITIONALS.last_stand,
  },

  boar_grassrunner: {
    id: 'boar_grassrunner',
    element: 'wind',
    name: 'Boar Grassrunner',
    title: 'Rumor in the Reeds',
    rarity: 2,
    stats: { hp: 880, atk: 128, def: 74, speed: 107 },
    tint: { body: '#7a9a5a', helm: '#9aba6a', weapon: '#c8c0b0', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boargrassrunneridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'reed_rush', name: 'Reed Rush',
        icon: 'assets/icons/fc1447.png',
        description: 'A rustling strike: 108% ATK, slipping onward: +6% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.08 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.06, turns: 1 },
        ],
      },
      {
        id: 'circling_run', name: 'Circling Run',
        icon: 'assets/icons/fc825.png',
        description: 'Strike from a new angle: 144% ATK — 20% more against slowed or hasted prey.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.44, bonusVs: { stat: 'speed', mult: 1.2 } },
        ],
      },
      {
        id: 'grass_maze', name: 'Grass Maze',
        icon: 'assets/icons/fc807.png',
        description: 'Lead them in circles: ALL enemies lose 8% SPD and 4% turn meter.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'speed', mult: 0.92, turns: 1 },
          { type: 'turnMeter', amount: -0.04 },
        ],
      },
    ],
    passive: {
      name: 'Tall Grass',
      icon: 'assets/icons/fc882.png',
      description: '+7% chance to dodge and +3% chance for an extra turn.',
      hooks: { dodgeAdd: 0.07, extraTurnAdd: 0.03 },
    },
    positional: POSITIONALS.hexweaver,
  },

  boar_nightsow: {
    id: 'boar_nightsow',
    element: 'dark',
    name: 'Boar Nightsow',
    title: 'What Rustles After Midnight',
    rarity: 3,
    stats: { hp: 1150, atk: 179, def: 87, speed: 104 },
    tint: { body: '#2a2a3a', helm: '#4a3a4a', weapon: '#8a6ab8', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarnightsowidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'midnight_gore', name: 'Midnight Gore',
        icon: 'assets/icons/fc1444.png',
        description: 'A gore from the dark: 112% ATK — 15% more against poisoned or bleeding prey.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.12, bonusVs: { kind: 'dot', mult: 1.15 } },
        ],
      },
      {
        id: 'shadow_rut', name: 'Shadow Rut',
        icon: 'assets/icons/fc1084.png',
        description: 'Carve a dark furrow: 140% ATK and the target takes +15% damage for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.4 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.15, turns: 2 },
        ],
      },
      {
        id: 'nightfall_charge', name: 'Nightfall Charge',
        icon: 'assets/icons/fc734.png',
        description: 'Night falls at a gallop: 188% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.88 },
        ],
      },
    ],
    passive: {
      name: 'Night Forage',
      icon: 'assets/icons/fc863.png',
      description: 'Preys on the overwhelmed: deals 25% extra damage to enemies with 2 or more afflictions.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.filter((fx) => fx.kind === 'debuff' || fx.kind === 'dot').length >= 2 ? 1.25 : 1;
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  boar_drummer: {
    id: 'boar_drummer',
    element: 'wind',
    name: 'Boar Drummer',
    title: 'Sets the Sounder\'s Pace',
    rarity: 2,
    stats: { hp: 900, atk: 120, def: 82, speed: 95 },
    tint: { body: '#8a7a5a', helm: '#a89a6a', weapon: '#c8a878', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boardrummeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'drum_hoof', name: 'Drum Hoof',
        icon: 'assets/icons/fc663.png',
        description: 'A rhythmic stomp: 99% ATK that drains 4% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.99 },
          { type: 'turnMeter', amount: -0.04 },
        ],
      },
      {
        id: 'quickstep_beat', name: 'Quickstep Beat',
        icon: 'assets/icons/fc868.png',
        description: 'Beat the advance: an ally gains +12% SPD for 2 turns and 8% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.12, turns: 2 },
          { type: 'turnMeter', amount: 0.08 },
        ],
      },
      {
        id: 'thunder_of_hooves', name: 'Thunder of Hooves',
        icon: 'assets/icons/fc869.png',
        description: 'The ground keeps the beat: ALL allies gain +6% ATK and +6% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.06, turns: 2 },
          { type: 'buff', stat: 'speed', mult: 1.06, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'War Drums',
      icon: 'assets/icons/fc882.png',
      description: 'At turn start, ALL allies gain 3% turn meter.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const ally of battle.livingUnits(unit.team)) {
            if (ally === unit) continue;
            ally.turnMeter = Math.min(CONFIG.TURN_METER_MAX,
              ally.turnMeter + CONFIG.TURN_METER_MAX * 0.03);
          }
          return null; // silent — small rolling tempo
        },
      },
    },
    positional: POSITIONALS.drain_the_line,
  },

  boar_warchief: {
    id: 'boar_warchief',
    element: 'fire',
    name: 'Boar Warchief',
    title: 'Crowned by Collision',
    rarity: 3,
    stats: { hp: 1240, atk: 168, def: 98, speed: 98 },
    tint: { body: '#8a3a2a', helm: '#e8c83a', weapon: '#d8d8e0', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarwarchiefidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'chiefs_gore', name: 'Chief\'s Gore',
        icon: 'assets/icons/fc746.png',
        description: 'A commanding gore: 114% ATK and -6% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.14 },
          { type: 'debuff', stat: 'def', mult: 0.94, turns: 1 },
        ],
      },
      {
        id: 'war_banner_charge', name: 'War Banner Charge',
        icon: 'assets/icons/fc869.png',
        description: 'Raise the tusks: ALL allies gain +10% ATK and +8% DEF for 2 turns.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.1, turns: 2 },
          { type: 'buff', stat: 'def', mult: 1.08, turns: 2 },
        ],
      },
      {
        id: 'kingslayer_rush', name: 'Kingslayer Rush',
        icon: 'assets/icons/fc730.png',
        description: 'A charge fit to end dynasties: 210% ATK and -10% turn meter.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.1 },
          { type: 'turnMeter', amount: -0.1 },
        ],
      },
    ],
    passive: {
      name: 'Chieftain\'s Bulk',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, ALL allies gain +6% DEF for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const ally of battle.livingUnits(unit.team)) {
            ally.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.06, turns: 1 });
          }
          return null; // silent — small rolling aura
        },
      },
    },
    positional: POSITIONALS.keystone,
  },

  boar_earthshaker: {
    id: 'boar_earthshaker',
    element: 'water',
    name: 'Boar Earthshaker',
    title: 'Registers on Instruments',
    rarity: 3,
    stats: { hp: 1320, atk: 150, def: 110, speed: 84 },
    tint: { body: '#4a4a4a', helm: '#6a6a5a', weapon: '#a8a098', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarearthshakeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'tremor_stomp', name: 'Tremor Stomp',
        icon: 'assets/icons/fc767.png',
        description: 'A ground-splitting stomp: 95% of DEF as damage and -5% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 0.95 },
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
      {
        id: 'faultline', name: 'Faultline',
        icon: 'assets/icons/fc1044.png',
        description: 'Crack a hex row open: 100% of DEF as damage and -10% SPD for 1 turn.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 1.0 },
          { type: 'debuff', stat: 'speed', mult: 0.9, turns: 1 },
        ],
      },
      {
        id: 'continental_slam', name: 'Continental Slam',
        icon: 'assets/icons/fc1476.png',
        description: 'Move the earth: 90% of DEF as damage to ALL enemies.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 0.9 },
        ],
      },
    ],
    passive: {
      name: 'Seismic Bulk',
      icon: 'assets/icons/fc856.png',
      description: '+10% chance to reflect all incoming damage and +10% debuff resistance.',
      hooks: { reflectAdd: 0.10, resistanceAdd: 0.10 },
    },
    positional: POSITIONALS.bulwark_oath,
  },

  boar_bramblelord: {
    id: 'boar_bramblelord',
    element: 'wind',
    name: 'Boar Bramblelord',
    title: 'The Hedge Has Opinions',
    rarity: 3,
    stats: { hp: 1150, atk: 170, def: 92, speed: 100 },
    tint: { body: '#4a6a3a', helm: '#6a8a4a', weapon: '#a8c86a', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarbramblelordidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'briar_gore', name: 'Briar Gore',
        icon: 'assets/icons/fc981.png',
        description: 'A thorn-wrapped gore: 100% ATK plus a 30% ATK bleed for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'dot', pct: 0.3, turns: 2 },
        ],
      },
      {
        id: 'strangling_growth', name: 'Strangling Growth',
        icon: 'assets/icons/fc1052.png',
        description: 'Brambles climb them: 120% ATK, -12% SPD for 2 turns plus a 24% ATK bleed for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'debuff', stat: 'speed', mult: 0.88, turns: 2 },
          { type: 'dot', pct: 0.24, turns: 2 },
        ],
      },
      {
        id: 'wall_of_briars', name: 'Wall of Briars',
        icon: 'assets/icons/fc855.png',
        description: 'Raise the living hedge: ALL allies gain +10% DEF and take 6% less damage for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.1, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.94, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Bramble Crown',
      icon: 'assets/icons/fc1093.png',
      description: 'His bleeds cling: +10% DoT damage and DoTs last 1 extra turn.',
      hooks: { dotBoostAdd: 0.10, dotExtraTurns: 1 },
    },
    positional: POSITIONALS.warding_circle,
  },

  boar_cinderback: {
    id: 'boar_cinderback',
    element: 'fire',
    name: 'Boar Cinderback',
    title: 'Walking Campfire Violation',
    rarity: 3,
    stats: { hp: 1200, atk: 160, def: 100, speed: 92 },
    tint: { body: '#5a3a2a', helm: '#e8632a', weapon: '#f8a83a', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarcinderbackidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'ember_shoulder', name: 'Ember Shoulder',
        icon: 'assets/icons/fc854.png',
        description: 'A glowing check: 88% of DEF as damage plus an 16% ATK burn for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 0.88 },
          { type: 'dot', pct: 0.16, turns: 1 },
        ],
      },
      {
        id: 'coal_bed_roll', name: 'Coal Bed Roll',
        icon: 'assets/icons/fc1050.png',
        description: 'Roll through them trailing coals: 105% of DEF as damage to a hex row plus a 20% ATK burn for 1 turn.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 1.05 },
          { type: 'dot', pct: 0.2, turns: 1 },
        ],
      },
      {
        id: 'furnace_bloom', name: 'Furnace Bloom',
        icon: 'assets/icons/fc1044.png',
        description: 'The cinders flare white: +35% DEF and takes 20% less damage for 2 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.35, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.8, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Cinder Bristles',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, shed embers sear ALL enemies for 1.5% of his DEF.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.effectiveStat('def') * 0.015));
          for (const e of enemies) Abilities.strike(unit, e, amount);
          return {
            label: 'Cinder Bristles',
            message: `${unit.name}'s embers sear the field.`,
            floats: enemies.map((e) => ({ target: e, text: `-${amount}`, color: '#e8843a' })),
          };
        },
      },
    },
    positional: POSITIONALS.shield_wall,
  },

  boar_rainbringer: {
    id: 'boar_rainbringer',
    element: 'water',
    name: 'Boar Rainbringer',
    title: 'Smells Like Coming Storms',
    rarity: 3,
    stats: { hp: 1180, atk: 156, def: 94, speed: 97 },
    tint: { body: '#4a6a8a', helm: '#6a8aa8', weapon: '#a8d8e8', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarrainbringeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rain_slick_gore', name: 'Rain-Slick Gore',
        icon: 'assets/icons/fc819.png',
        description: 'A sliding gore: 103% ATK and -4% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.03 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 1 },
        ],
      },
      {
        id: 'cloudburst', name: 'Cloudburst',
        icon: 'assets/icons/fc1112.png',
        description: 'Call the rain down: ALL allies heal 50% of ATK and gain +5% SPD for 2 turns.',
        cooldown: 4, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.5 },
          { type: 'buff', stat: 'speed', mult: 1.05, turns: 2 },
        ],
      },
      {
        id: 'monsoon_wall', name: 'Monsoon Wall',
        icon: 'assets/icons/fc800.png',
        description: 'A wall of grey water: 70% ATK to ALL enemies and -6% turn meter.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.7 },
          { type: 'turnMeter', amount: -0.06 },
        ],
      },
    ],
    passive: {
      name: 'Rain Blessing',
      icon: 'assets/icons/fc1093.png',
      description: 'Whenever an ally is healed, that ally also gains +4% SPD for 1 turn.',
      hooks: {
        onAllyHealed(unit, healedUnit) {
          if (healedUnit === unit) return;
          healedUnit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.04, turns: 1 });
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  boar_dawnsow: {
    id: 'boar_dawnsow',
    element: 'light',
    name: 'Boar Dawnsow',
    title: 'Sunrise Made Stubborn',
    rarity: 3,
    stats: { hp: 1260, atk: 152, def: 96, speed: 94 },
    tint: { body: '#e8d8a8', helm: '#f8e8c8', weapon: '#f8d86a', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boardawnsowidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'gilded_tusk', name: 'Gilded Tusk',
        icon: 'assets/icons/fc1447.png',
        description: 'A gleaming tusk: 98% ATK, and the light steadies her: +6% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.98 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.06, turns: 1 },
        ],
      },
      {
        id: 'daybreak_ward', name: 'Daybreak Ward',
        icon: 'assets/icons/fc855.png',
        description: 'Wrap an ally in morning light: heals 14% of her max HP and they take 12% less damage for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.14 },
          { type: 'buff', stat: 'damageTaken', mult: 0.88, turns: 2 },
        ],
      },
      {
        id: 'first_light_of_the_sounder', name: 'First Light of the Sounder',
        icon: 'assets/icons/fc1112.png',
        description: 'Dawn reaches everyone: ALL allies heal 60% of ATK and gain +8% DEF for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.6 },
          { type: 'buff', stat: 'def', mult: 1.08, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Dawn Warmth',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, shields the most wounded ally: takes 15% less damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.85, turns: 1 });
          return null; // silent — small rolling warmth
        },
      },
    },
    positional: POSITIONALS.warding_circle,
  },

  // ---- Bear cohort (the Valley) -------------------------------------------
  // Procedural placeholder art renders until real idle sheets land at the
  // conventional flat paths (assets/heroes/bear<role>idle.png).

  boar_tombtusk: {
    id: 'boar_tombtusk',
    element: 'dark',
    name: 'Boar Tombtusk',
    title: 'The sentence is the swing.',
    rarity: 3,
    stats: { hp: 1130, atk: 173, def: 88, speed: 101 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boartombtuskidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_tombtusk_edge', name: 'Tombtusk\'s Edge',
        icon: 'assets/icons/fc734.png',
        description: 'Two dark cuts: 91% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.91 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'boar_tombtusk_sentence', name: 'Tombtusk\'s Sentence',
        icon: 'assets/icons/fc730.png',
        description: 'Pass judgment: 171% ATK and the target takes +12% damage for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.71 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.12, turns: 1 },
        ],
      },
      {
        id: 'boar_tombtusk_end', name: 'Tombtusk\'s End',
        icon: 'assets/icons/fc728.png',
        description: 'Carry it out: 246% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.47 },
        ],
      },
    ],
    passive: {
      name: 'Tombtusk\'s Due',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 26% extra damage to enemies below 33% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.33 ? 1.26 : 1;
        },
      },
    },
    positional: POSITIONALS.keystone,
  },

  boar_hexbristle: {
    id: 'boar_hexbristle',
    element: 'dark',
    name: 'Boar Hexbristle',
    title: 'Carries every curse worth having.',
    rarity: 3,
    stats: { hp: 1139, atk: 178, def: 91, speed: 103 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarhexbristleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_hexbristle_lash', name: 'Hexbristle Lash',
        icon: 'assets/icons/fc1052.png',
        description: 'Two cursed lashes: 92% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.92 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'boar_hexbristle_bane', name: 'Hexbristle Bane',
        icon: 'assets/icons/fc1084.png',
        description: 'A layered curse: 172% ATK, -13% ATK and -9% DEF for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.72 },
          { type: 'debuff', stat: 'atk', mult: 0.87, turns: 2 },
          { type: 'debuff', stat: 'def', mult: 0.91, turns: 2 },
        ],
      },
      {
        id: 'boar_hexbristle_pall', name: 'Hexbristle Pall',
        icon: 'assets/icons/fc1050.png',
        description: 'A pall over everything: 126% ATK to ALL enemies and -5% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.26 },
          { type: 'debuff', stat: 'speed', mult: 0.95, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Hexbristle Craft',
      icon: 'assets/icons/fc1093.png',
      description: 'Curses honed in the dark.',
      hooks: { accuracyAdd: 0.14, resistanceAdd: 0.06 },
    },
    positional: POSITIONALS.reckless_charge,
  },

  boar_bloodsnout: {
    id: 'boar_bloodsnout',
    element: 'dark',
    name: 'Boar Bloodsnout',
    title: 'Your vigor, redistributed.',
    rarity: 3,
    stats: { hp: 1148, atk: 183, def: 94, speed: 105 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarbloodsnoutidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_bloodsnout_sip', name: 'Bloodsnout\'s Sip',
        icon: 'assets/icons/fc1444.png',
        description: 'Two draining touches: 93% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.93 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'boar_bloodsnout_feast', name: 'Bloodsnout\'s Feast',
        icon: 'assets/icons/fc825.png',
        description: 'Drink deep: 173% ATK, healing himself for 40% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.73 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.4 },
        ],
      },
      {
        id: 'boar_bloodsnout_toll', name: 'Bloodsnout\'s Toll',
        icon: 'assets/icons/fc1112.png',
        description: 'Tax the living: 116% ATK to ALL enemies while he mends 11% of his max HP.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.17 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.11 },
        ],
      },
    ],
    passive: {
      name: 'Bloodsnout Hunger',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, siphons 2.4% of his max HP from a random enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const amount = Math.max(1, Math.round(unit.maxHp * 0.024));
          Abilities.strike(unit, target, amount);
          unit.heal(amount);
          return null; // silent — small rolling hunger
        },
      },
    },
    positional: POSITIONALS.opening_volley,
  },

  boar_nightrooter: {
    id: 'boar_nightrooter',
    element: 'dark',
    name: 'Boar Nightrooter',
    title: 'The dark keeps its edge honed.',
    rarity: 3,
    stats: { hp: 1157, atk: 158, def: 97, speed: 107 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarnightrooteridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_nightrooter_flick', name: 'Nightrooter Flick',
        icon: 'assets/icons/fc1447.png',
        description: 'Two flickering cuts: 94% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.94 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'boar_nightrooter_waltz', name: 'Nightrooter Waltz',
        icon: 'assets/icons/fc1587.png',
        description: 'A step through shadow: 174% ATK and +11% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.74 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.11, turns: 1 },
        ],
      },
      {
        id: 'boar_nightrooter_finale', name: 'Nightrooter Finale',
        icon: 'assets/icons/fc723.png',
        description: 'The last figure: 238% ATK — 25% more against debuffed prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.38, bonusVs: { kind: 'debuff', mult: 1.25 } },
        ],
      },
    ],
    passive: {
      name: 'Nightrooter Poise',
      icon: 'assets/icons/fc862.png',
      description: 'A blade kept perfectly balanced (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.14, turns: 2 });
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.02, turns: 2 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.press_the_flank,
  },

  boar_doomgrunter: {
    id: 'boar_doomgrunter',
    element: 'dark',
    name: 'Boar Doomgrunter',
    title: 'Fear arrives before the blow.',
    rarity: 3,
    stats: { hp: 1166, atk: 163, def: 100, speed: 109 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boardoomgrunteridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_doomgrunter_knell', name: 'Doomgrunter Knell',
        icon: 'assets/icons/fc1003.png',
        description: 'Two tolling blows: 95% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'boar_doomgrunter_omen', name: 'Doomgrunter Omen',
        icon: 'assets/icons/fc1084.png',
        description: 'Name their doom: 155% ATK and -14% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.55 },
          { type: 'debuff', stat: 'atk', mult: 0.86, turns: 2 },
        ],
      },
      {
        id: 'boar_doomgrunter_chorus', name: 'Doomgrunter Chorus',
        icon: 'assets/icons/fc807.png',
        description: 'The dread chorus: 124% ATK to ALL enemies and -5% crit chance for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.24 },
          { type: 'debuff', stat: 'critChance', add: -0.05, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Doomgrunter Presence',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, dread spreads: ALL enemies lose 3% DEF for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const e of battle.livingUnits(unit.enemyTeam())) {
            e.addStatusEffect({ kind: 'debuff', stat: 'def', mult: 0.97, turns: 1 });
          }
          return null; // silent — small rolling dread
        },
      },
    },
    positional: POSITIONALS.last_stand,
  },

  boar_lightsnout: {
    id: 'boar_lightsnout',
    element: 'light',
    name: 'Boar Lightsnout',
    title: 'Every wound answers to the light.',
    rarity: 3,
    stats: { hp: 1175, atk: 168, def: 79, speed: 111 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarlightsnoutidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_lightsnout_rebuke', name: 'Lightsnout\'s Rebuke',
        icon: 'assets/icons/fc1471.png',
        description: 'Two shining raps: 96% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'boar_lightsnout_grace', name: 'Lightsnout\'s Grace',
        icon: 'assets/icons/fc1112.png',
        description: 'Pour in the light: heals an ally 155% of ATK and cleanses their debuffs.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.55 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'boar_lightsnout_communion', name: 'Lightsnout\'s Communion',
        icon: 'assets/icons/fc800.png',
        description: 'Shared light: ALL allies heal 105% of ATK plus 1.6% of max HP regen for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.05 },
          { type: 'hot', pct: 0.015, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Lightsnout Devotion',
      icon: 'assets/icons/fc1093.png',
      description: 'Healing hands, steadied by faith.',
      hooks: { healBoostAdd: 0.14, dodgeAdd: 0.04 },
    },
    positional: POSITIONALS.safe_distance,
  },

  boar_aegisback: {
    id: 'boar_aegisback',
    element: 'light',
    name: 'Boar Aegisback',
    title: 'A shield the sun would envy.',
    rarity: 3,
    stats: { hp: 1184, atk: 173, def: 82, speed: 113 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boaraegisbackidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_aegisback_check', name: 'Aegisback\'s Check',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield checks: 97% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.97 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'boar_aegisback_ward', name: 'Aegisback\'s Ward',
        icon: 'assets/icons/fc855.png',
        description: 'Raise the aegis over an ally: they take 14% less damage for 2 turns and heal 96% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.86, turns: 2 },
          { type: 'heal', mult: 0.96 },
        ],
      },
      {
        id: 'boar_aegisback_vigil', name: 'Aegisback\'s Vigil',
        icon: 'assets/icons/fc856.png',
        description: 'The unbroken vigil: ALL allies gain +2% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.02, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Aegisback Constancy',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, shields the most wounded ally: takes 12% less damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.88, turns: 1 });
          return null; // silent — small rolling shelter
        },
      },
    },
    positional: POSITIONALS.warding_circle,
  },

  boar_dawntusk: {
    id: 'boar_dawntusk',
    element: 'light',
    name: 'Boar Dawntusk',
    title: 'Morning, sharpened.',
    rarity: 3,
    stats: { hp: 1193, atk: 178, def: 85, speed: 97 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boardawntuskidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_dawntusk_stroke', name: 'Dawntusk Stroke',
        icon: 'assets/icons/fc1587.png',
        description: 'Two dawn-lit strokes: 98% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.98 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'boar_dawntusk_flare', name: 'Dawntusk Flare',
        icon: 'assets/icons/fc1447.png',
        description: 'A flare of morning: 178% ATK, and the light mends 10% of max HP.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.78 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.1 },
        ],
      },
      {
        id: 'boar_dawntusk_zenith', name: 'Dawntusk Zenith',
        icon: 'assets/icons/fc730.png',
        description: 'High noon: 241% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.41 },
        ],
      },
    ],
    passive: {
      name: 'Dawntusk Resolve',
      icon: 'assets/icons/fc1003.png',
      description: 'Heals 9% max HP at turn start while below 25% HP.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp >= 0.25) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.09));
          if (healed <= 0) return null;
          return {
            label: 'Dawntusk Resolve',
            message: `${unit.name}'s light knits ${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#f8d86a' }],
          };
        },
      },
    },
    positional: POSITIONALS.iron_wake,
  },

  boar_sunbristle: {
    id: 'boar_sunbristle',
    element: 'light',
    name: 'Boar Sunbristle',
    title: 'Good news travels armed.',
    rarity: 3,
    stats: { hp: 1202, atk: 183, def: 88, speed: 99 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarsunbristleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_sunbristle_call', name: 'Sunbristle\'s Call',
        icon: 'assets/icons/fc868.png',
        description: 'Two ringing notes: 99% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.99 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'boar_sunbristle_proclamation', name: 'Sunbristle\'s Proclamation',
        icon: 'assets/icons/fc869.png',
        description: 'Lift an ally: +15% ATK for 2 turns and 11% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.15, turns: 2 },
          { type: 'turnMeter', amount: 0.11 },
        ],
      },
      {
        id: 'boar_sunbristle_triumph', name: 'Sunbristle\'s Triumph',
        icon: 'assets/icons/fc882.png',
        description: 'Declare the day won: ALL allies gain +6% SPD for 2 turns and 5% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.06, turns: 2 },
          { type: 'turnMeter', amount: 0.05 },
        ],
      },
    ],
    passive: {
      name: 'Sunbristle Anthem',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start: ALL allies gain +3% ATK and +2% DEF for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) { a.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.03, turns: 1 }); a.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.02, turns: 1 }); }
          return null; // silent — small rolling anthem
        },
      },
    },
    positional: POSITIONALS.opening_volley,
  },

  boar_oathtusker: {
    id: 'boar_oathtusker',
    element: 'light',
    name: 'Boar Oathtusker',
    title: 'Verdicts delivered in person.',
    rarity: 3,
    stats: { hp: 1211, atk: 158, def: 91, speed: 101 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boaroathtuskeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_oathtusker_gavel', name: 'Oathtusker\'s Gavel',
        icon: 'assets/icons/fc1461.png',
        description: 'Two measured blows: 100% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'boar_oathtusker_inquest', name: 'Oathtusker\'s Inquest',
        icon: 'assets/icons/fc862.png',
        description: 'Open the case: 170% ATK and the target takes +19% damage for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.7 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.19, turns: 2 },
        ],
      },
      {
        id: 'boar_oathtusker_verdict', name: 'Oathtusker\'s Verdict',
        icon: 'assets/icons/fc744.png',
        description: 'Deliver the verdict: 243% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.43 },
        ],
      },
    ],
    passive: {
      name: 'Oathtusker Justice',
      icon: 'assets/icons/fc863.png',
      description: 'Justice sees clearly: deals 30% extra damage to enemies with lowered crit chance.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'debuff' && fx.stat === 'critChance') ? 1.3 : 1;
        },
      },
    },
    positional: POSITIONALS.keystone,
  },

  boar_battletusk: {
    id: 'boar_battletusk',
    element: 'wind',
    name: 'Boar Battletusk',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1470, atk: 216, def: 117, speed: 110 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarbattletuskidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_battletusk_strike', name: 'Battletusk\'s Strike',
        icon: 'assets/icons/fc730.png',
        description: 'Two champion blows: 76% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.76 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'boar_battletusk_onslaught', name: 'Battletusk\'s Onslaught',
        icon: 'assets/icons/fc1447.png',
        description: 'Press the advantage: 189% ATK, then +12% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.89 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.12, turns: 2 },
        ],
      },
      {
        id: 'boar_battletusk_supremacy', name: 'Battletusk\'s Supremacy',
        icon: 'assets/icons/fc767.png',
        description: 'Settle it: 240% ATK and -6% DEF for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.4 },
          { type: 'debuff', stat: 'def', mult: 0.94, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Battletusk Supremacy',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 11% more and takes 2% less damage.',
      hooks: {
        damageDealtMult() { return 1.11; },
        damageTakenMult() { return 0.98; },
      },
    },
    positional: POSITIONALS.last_stand,
  },

  boar_runesnout: {
    id: 'boar_runesnout',
    element: 'water',
    name: 'Boar Runesnout',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1482, atk: 222, def: 121, speed: 113 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarrunesnoutidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_runesnout_bolt', name: 'Runesnout\'s Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'Twin arcane bolts: 77% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.77 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'boar_runesnout_torrent', name: 'Runesnout\'s Torrent',
        icon: 'assets/icons/fc1084.png',
        description: 'A torrent of power: 130% ATK to ALL enemies and -5% SPD for 2 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
          { type: 'debuff', stat: 'speed', mult: 0.95, turns: 2 },
        ],
      },
      {
        id: 'boar_runesnout_cataclysm', name: 'Runesnout\'s Cataclysm',
        icon: 'assets/icons/fc1044.png',
        description: 'The big one: 146% ATK to ALL enemies and -9% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.46 },
          { type: 'debuff', stat: 'atk', mult: 0.91, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Runesnout Resonance',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, arcane bleed sears ALL enemies for 1% of this hero\'s DEF.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.effectiveStat('def') * 0.01));
          for (const e of enemies) Abilities.strike(unit, e, amount);
          return null; // silent — small rolling resonance
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  boar_wallhide: {
    id: 'boar_wallhide',
    element: 'fire',
    name: 'Boar Wallhide',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1494, atk: 228, def: 125, speed: 116 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarwallhideidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_wallhide_bash', name: 'Wallhide\'s Bash',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield strikes: 78% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.78 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'boar_wallhide_bulwark', name: 'Wallhide\'s Bulwark',
        icon: 'assets/icons/fc855.png',
        description: 'Anchor the line: ALL allies gain +14% DEF for 2 turns and take 5% less damage for 1 turn.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.14, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.95, turns: 1 },
        ],
      },
      {
        id: 'boar_wallhide_stand', name: 'Wallhide\'s Stand',
        icon: 'assets/icons/fc856.png',
        description: 'Refuse to fall: takes 31% less damage for 2 turns and heals 13% max HP.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.69, turns: 2 },
          { type: 'healHpPct', pct: 0.13 },
        ],
      },
    ],
    passive: {
      name: 'Wallhide Aegis',
      icon: 'assets/icons/fc868.png',
      description: 'Takes 18% less damage while below 45% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.alive && unit.hp / unit.maxHp < 0.45 ? 0.82 : 1;
        },
      },
    },
    positional: POSITIONALS.bulwark_oath,
  },

  boar_fartusk: {
    id: 'boar_fartusk',
    element: 'wind',
    name: 'Boar Fartusk',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1506, atk: 198, def: 103, speed: 102 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarfartuskidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_fartusk_shot', name: 'Fartusk\'s Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'Two placed shots: 79% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.79 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'boar_fartusk_deadeye', name: 'Fartusk\'s Deadeye',
        icon: 'assets/icons/fc1516.png',
        description: 'The perfect line: 202% ATK and drains 12% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.02 },
          { type: 'turnMeter', amount: -0.12 },
        ],
      },
      {
        id: 'boar_fartusk_barrage', name: 'Fartusk\'s Barrage',
        icon: 'assets/icons/fc807.png',
        description: 'Fill the sky: 128% ATK to ALL enemies.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.28 },
          { type: 'turnMeter', amount: -0.02 },
        ],
      },
    ],
    passive: {
      name: 'Fartusk Focus',
      icon: 'assets/icons/fc862.png',
      description: 'The shot is already lined up (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.11, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.snipers_nest,
  },

  boar_mistbristle: {
    id: 'boar_mistbristle',
    element: 'water',
    name: 'Boar Mistbristle',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1518, atk: 204, def: 107, speed: 105 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarmistbristleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_mistbristle_touch', name: 'Mistbristle\'s Touch',
        icon: 'assets/icons/fc1112.png',
        description: 'Two chastening touches: 80% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'boar_mistbristle_blessing', name: 'Mistbristle\'s Blessing',
        icon: 'assets/icons/fc800.png',
        description: 'Mend an ally: 17% of max HP plus 2.5% regen for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.17 },
          { type: 'hot', pct: 0.025, turns: 2 },
        ],
      },
      {
        id: 'boar_mistbristle_renewal', name: 'Mistbristle\'s Renewal',
        icon: 'assets/icons/fc869.png',
        description: 'The circle holds: ALL allies heal 48% of ATK, are cleansed, and gain +6% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.48 },
          { type: 'cleanse' },
          { type: 'buff', stat: 'def', mult: 1.06, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Mistbristle Communion',
      icon: 'assets/icons/fc1003.png',
      description: 'Healing woven a little stronger.',
      hooks: { healBoostAdd: 0.27 },
    },
    positional: POSITIONALS.lifeline,
  },

  boar_nulltusk: {
    id: 'boar_nulltusk',
    element: 'dark',
    name: 'Boar Nulltusk',
    title: 'Champion of the Dark',
    rarity: 4,
    stats: { hp: 1530, atk: 210, def: 111, speed: 108 },
    tint: { body: '#241f33', helm: '#3d3350', weapon: '#9a7ad0', skin: '#8a82a0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarnulltuskidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_nulltusk_grasp', name: 'Nulltusk\'s Grasp',
        icon: 'assets/icons/fc1444.png',
        description: 'Two grasping shadows: 81% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.81 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'boar_nulltusk_devour', name: 'Nulltusk\'s Devour',
        icon: 'assets/icons/fc825.png',
        description: 'Feed the void: 184% ATK, healing this hero for 36% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.84 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.36 },
        ],
      },
      {
        id: 'boar_nulltusk_oblivion', name: 'Nulltusk\'s Oblivion',
        icon: 'assets/icons/fc734.png',
        description: 'Unmake them: 255% ATK and the target takes +21% damage for 1 turn.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.55 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.21, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Nulltusk Thirst',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, drains 2.3% of max HP from the weakest enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          enemies.sort((a, b) => a.hp - b.hp);
          const amount = Math.max(1, Math.round(unit.maxHp * 0.023));
          Abilities.strike(unit, enemies[0], amount);
          unit.heal(amount);
          return null; // silent — small rolling thirst
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  boar_glorytusk: {
    id: 'boar_glorytusk',
    element: 'light',
    name: 'Boar Glorytusk',
    title: 'Champion of the Dawn',
    rarity: 4,
    stats: { hp: 1542, atk: 216, def: 115, speed: 111 },
    tint: { body: '#e0d3a8', helm: '#f5e9c0', weapon: '#ffdf70', skin: '#f0e4c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarglorytuskidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_glorytusk_radiance', name: 'Glorytusk\'s Radiance',
        icon: 'assets/icons/fc1471.png',
        description: 'Two radiant strikes: 82% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.82 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'boar_glorytusk_benediction', name: 'Glorytusk\'s Benediction',
        icon: 'assets/icons/fc1112.png',
        description: 'Bless an ally: heals 19% of max HP and grants 13% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.19 },
          { type: 'turnMeter', amount: 0.13 },
        ],
      },
      {
        id: 'boar_glorytusk_ascension', name: 'Glorytusk\'s Ascension',
        icon: 'assets/icons/fc855.png',
        description: 'Lift the whole line: ALL allies heal 54% of ATK and gain +6% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.54 },
          { type: 'buff', stat: 'atk', mult: 1.06, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Glorytusk Benevolence',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, ALL allies heal 0.9% of this hero\'s max HP and gain a small def blessing for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) {
            a.heal(Math.round(unit.maxHp * 0.009), unit);
            a.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.02, turns: 1 });
          }
          return null; // silent — small rolling benevolence
        },
      },
    },
    positional: POSITIONALS.keystone,
  },

});
