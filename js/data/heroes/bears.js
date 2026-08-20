// Bear heroes (42). Registered into the shared
// HEROES table declared in js/data/heroes.js.

Object.assign(HEROES, {

  bear_cub: {
    id: 'bear_cub',
    element: 'wind',
    name: 'Bear Cub',
    title: 'Small Now, Notably Temporary',
    rarity: 1,
    stats: { hp: 950, atk: 98, def: 70, speed: 92 },
    tint: { body: '#a8845a', helm: '#c8a87a', weapon: '#c8c0b0', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearcubidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'clumsy_swipe', name: 'Clumsy Swipe',
        icon: 'assets/icons/fc663.png',
        description: 'An overeager swipe: 95% ATK, tumbling into +6% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.95 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.06, turns: 1 },
        ],
      },
      {
        id: 'surprise_tackle', name: 'Surprise Tackle',
        icon: 'assets/icons/fc762.png',
        description: 'Heavier than he looks: 128% ATK and drains 6% turn meter.',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.28 },
          { type: 'turnMeter', amount: -0.06 },
        ],
      },
      {
        id: 'call_for_mother', name: 'Call for Mother',
        icon: 'assets/icons/fc868.png',
        description: 'A cry that promises consequences: an ally gains +15% ATK for 2 turns and 10% turn meter.',
        cooldown: 6, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.15, turns: 2 },
          { type: 'turnMeter', amount: 0.1 },
        ],
      },
    ],
    passive: {
      name: 'Growing Boy',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, mends 1% max HP and gains +3% ATK for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.heal(Math.round(unit.maxHp * 0.01));
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.03, turns: 1 });
          return null; // silent — small rolling growth
        },
      },
    },
    positional: POSITIONALS.opening_volley,
  },

  bear_fisher: {
    id: 'bear_fisher',
    element: 'water',
    name: 'Bear Fisher',
    title: 'Standing in the River, Winning',
    rarity: 1,
    stats: { hp: 1020, atk: 100, def: 72, speed: 90 },
    tint: { body: '#6a5a4a', helm: '#8a7a5a', weapon: '#a8d8e8', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearfisheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'paw_scoop', name: 'Paw Scoop',
        icon: 'assets/icons/fc1471.png',
        description: 'A practiced scoop: 96% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
        ],
      },
      {
        id: 'salmon_slap', name: 'Salmon Slap',
        icon: 'assets/icons/fc981.png',
        description: 'Assault with a fresh salmon: 125% ATK and -5% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.25 },
          { type: 'debuff', stat: 'critChance', add: -0.05, turns: 1 },
        ],
      },
      {
        id: 'bounty_of_the_river', name: 'Bounty of the River',
        icon: 'assets/icons/fc1112.png',
        description: 'Share the catch: ALL allies heal 65% of ATK.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.65 },
        ],
      },
    ],
    passive: {
      name: 'River Patience',
      icon: 'assets/icons/fc856.png',
      description: 'Well fed: regenerates 3% max HP at turn start while above half HP.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp <= 0.5 || unit.hp >= unit.maxHp) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.03));
          if (healed <= 0) return null;
          return {
            label: 'River Patience',
            message: `${unit.name} digests: +${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#7ae87a' }],
          };
        },
      },
    },
    positional: POSITIONALS.lifeline,
  },

  bear_honeypaw: {
    id: 'bear_honeypaw',
    element: 'fire',
    name: 'Bear Honeypaw',
    title: 'Sticky and Unashamed',
    rarity: 1,
    stats: { hp: 980, atk: 96, def: 74, speed: 91 },
    tint: { body: '#c8a83a', helm: '#e8c85a', weapon: '#e8d8a8', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearhoneypawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'sticky_swat', name: 'Sticky Swat',
        icon: 'assets/icons/fc663.png',
        description: 'A honey-heavy swat: 92% ATK and -4% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.92 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 1 },
        ],
      },
      {
        id: 'honey_share', name: 'Honey Share',
        icon: 'assets/icons/fc1112.png',
        description: 'A dollop for a friend: heals an ally 140% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.4 },
        ],
      },
      {
        id: 'hive_toss', name: 'Hive Toss',
        icon: 'assets/icons/fc807.png',
        description: 'Throw the whole hive: 60% ATK to ALL enemies plus a 9% ATK sting for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.6 },
          { type: 'dot', pct: 0.09, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Honey Reserves',
      icon: 'assets/icons/fc1003.png',
      description: 'His healing is 15% stronger.',
      hooks: { healBoostAdd: 0.15 },
    },
    positional: POSITIONALS.lifeline,
  },

  bear_forestwalker: {
    id: 'bear_forestwalker',
    element: 'wind',
    name: 'Bear Forestwalker',
    title: 'The Trees Report to Him',
    rarity: 1,
    stats: { hp: 990, atk: 102, def: 73, speed: 95 },
    tint: { body: '#5a7a4a', helm: '#7a9a5a', weapon: '#a8c86a', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearforestwalkeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'branch_swat', name: 'Branch Swat',
        icon: 'assets/icons/fc1447.png',
        description: 'A tree-limb swat for 106% ATK, braced by the trunk: +4% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.06 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.04, turns: 1 },
        ],
      },
      {
        id: 'canopy_drop', name: 'Canopy Drop',
        icon: 'assets/icons/fc825.png',
        description: 'Fall out of a tree on purpose: 8% of his max HP as crushing damage.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageHpPct', pct: 0.08 },
        ],
      },
      {
        id: 'rooted_calm', name: 'Rooted Calm',
        icon: 'assets/icons/fc854.png',
        description: 'Stand like the forest: +20% DEF for 2 turns and heals 12% max HP.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.2, turns: 2 },
          { type: 'healHpPct', pct: 0.12 },
        ],
      },
    ],
    passive: {
      name: 'Forest Stride',
      icon: 'assets/icons/fc882.png',
      description: '+8% chance to dodge attacks.',
      hooks: { dodgeAdd: 0.08 },
    },
    positional: POSITIONALS.iron_wake,
  },

  bear_riverguard: {
    id: 'bear_riverguard',
    element: 'water',
    name: 'Bear Riverguard',
    title: 'Nobody Crosses Unannounced',
    rarity: 1,
    stats: { hp: 1050, atk: 99, def: 78, speed: 88 },
    tint: { body: '#4a6a7a', helm: '#6a8a9a', weapon: '#c8c0b0', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearriverguardidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'ford_check', name: 'Ford Check',
        icon: 'assets/icons/fc854.png',
        description: 'A blocking shoulder: 100% ATK, holding the line: +6% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.06, turns: 1 },
        ],
      },
      {
        id: 'undertow_drag', name: 'Undertow Drag',
        icon: 'assets/icons/fc862.png',
        description: 'Drag them into the current: 118% ATK and -10% SPD for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.18 },
          { type: 'debuff', stat: 'speed', mult: 0.9, turns: 1 },
        ],
      },
      {
        id: 'river_rise', name: 'River Rise',
        icon: 'assets/icons/fc855.png',
        description: 'The river answers: ALL allies gain +10% DEF and heal 30% of ATK.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.1, turns: 2 },
          { type: 'heal', mult: 0.3 },
        ],
      },
    ],
    passive: {
      name: 'River Stance',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 10% less damage while above 75% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.hp / unit.maxHp > 0.75 ? 0.9 : 1;
        },
      },
    },
    positional: POSITIONALS.thornguard,
  },

  bear_stonepaw: {
    id: 'bear_stonepaw',
    element: 'fire',
    name: 'Bear Stonepaw',
    title: 'Punches Geology-Grade',
    rarity: 1,
    stats: { hp: 1010, atk: 104, def: 80, speed: 87 },
    tint: { body: '#7a6a5a', helm: '#9a8a6a', weapon: '#a8a098', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearstonepawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'granite_jab', name: 'Granite Jab',
        icon: 'assets/icons/fc663.png',
        description: 'A stone one-two: two hits of 57% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.57 },
          { type: 'damage', mult: 0.57 },
        ],
      },
      {
        id: 'boulder_break', name: 'Boulder Break',
        icon: 'assets/icons/fc762.png',
        description: 'A blow that cracks stone: 146% ATK and -8% DEF for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.46 },
          { type: 'debuff', stat: 'def', mult: 0.92, turns: 1 },
        ],
      },
      {
        id: 'landslide_left', name: 'Landslide Left',
        icon: 'assets/icons/fc767.png',
        description: 'The whole hillside swings: 9% of his max HP as damage plus -8% turn meter.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageHpPct', pct: 0.09 },
          { type: 'turnMeter', amount: -0.08 },
        ],
      },
    ],
    passive: {
      name: 'Stone Fists',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, gains +10% DEF and +5% ATK for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.1, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.05, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.last_stand,
  },

  bear_berrypicker: {
    id: 'bear_berrypicker',
    element: 'water',
    name: 'Bear Berrypicker',
    title: 'Season One Berry Ahead',
    rarity: 1,
    stats: { hp: 960, atk: 97, def: 71, speed: 93 },
    tint: { body: '#8a5a7a', helm: '#a87a9a', weapon: '#c8a8c8', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearberrypickeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bramble_swat', name: 'Bramble Swat',
        icon: 'assets/icons/fc981.png',
        description: 'A thorny swat: 94% ATK plus a 6% ATK scratch for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.94 },
          { type: 'dot', pct: 0.06, turns: 1 },
        ],
      },
      {
        id: 'berry_share', name: 'Berry Share',
        icon: 'assets/icons/fc1112.png',
        description: 'Handful of the good ones: heals an ally 105% of ATK plus 2.5% of her max HP for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.05 },
          { type: 'hot', pct: 0.025, turns: 2 },
        ],
      },
      {
        id: 'winter_stores', name: 'Winter Stores',
        icon: 'assets/icons/fc800.png',
        description: 'Open the caches: ALL allies regenerate 3% of her max HP for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'hot', pct: 0.03, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Berry Stash',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, a random ally is slipped berries: heals 2% of her max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team)
            .filter((u) => u !== unit && u.hp < u.maxHp);
          if (allies.length === 0) return null;
          const ally = allies[Math.floor(Math.random() * allies.length)];
          ally.heal(Math.round(unit.maxHp * 0.02), unit);
          return null; // silent — small rolling snack
        },
      },
    },
    positional: POSITIONALS.toxicologist,
  },

  bear_napper: {
    id: 'bear_napper',
    element: 'fire',
    name: 'Bear Napper',
    title: 'Do Not Wake',
    rarity: 1,
    stats: { hp: 1080, atk: 95, def: 76, speed: 85 },
    tint: { body: '#8a7a6a', helm: '#a89a8a', weapon: '#c8b898', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearnapperidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'groggy_swipe', name: 'Groggy Swipe',
        icon: 'assets/icons/fc663.png',
        description: 'A half-asleep swipe that still hurts: 128% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.28 },
        ],
      },
      {
        id: 'rude_awakening', name: 'Rude Awakening',
        icon: 'assets/icons/fc767.png',
        description: 'You woke him: 158% ATK with a 10% chance to STUN for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.58 },
          { type: 'stun', chance: 0.1, turns: 1 },
        ],
      },
      {
        id: 'five_more_minutes', name: 'Five More Minutes',
        icon: 'assets/icons/fc1112.png',
        description: 'Roll over: heals 18% max HP and takes 15% less damage for 1 turn.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.18 },
          { type: 'buff', stat: 'damageTaken', mult: 0.85, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Deep Sleeper',
      icon: 'assets/icons/fc856.png',
      description: 'Naps through the pain: below 30% HP, heals 8% max HP at turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp >= 0.3) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.08));
          if (healed <= 0) return null;
          return {
            label: 'Deep Sleeper',
            message: `${unit.name} snores through it: +${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#7ae87a' }],
          };
        },
      },
    },
    positional: POSITIONALS.standard_bearer,
  },

  bear_growler: {
    id: 'bear_growler',
    element: 'wind',
    name: 'Bear Growler',
    title: 'Subwoofer with Claws',
    rarity: 1,
    stats: { hp: 970, atk: 101, def: 72, speed: 94 },
    tint: { body: '#5a5a5a', helm: '#7a7a7a', weapon: '#c8c0b0', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/beargrowleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'low_growl', name: 'Low Growl',
        icon: 'assets/icons/fc1003.png',
        description: 'A chest-deep growl: 89% ATK and -5% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.89 },
          { type: 'debuff', stat: 'atk', mult: 0.95, turns: 1 },
        ],
      },
      {
        id: 'sonic_snarl', name: 'Sonic Snarl',
        icon: 'assets/icons/fc1084.png',
        description: 'A snarl you feel in your teeth: 122% ATK and drains 10% turn meter.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.22 },
          { type: 'turnMeter', amount: -0.1 },
        ],
      },
      {
        id: 'valley_echo', name: 'Valley Echo',
        icon: 'assets/icons/fc807.png',
        description: 'The valley growls back: 52% ATK to ALL enemies and -4% ATK for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.52 },
          { type: 'debuff', stat: 'atk', mult: 0.96, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Warning Growl',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, ALL enemies lose 2% ATK for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const e of battle.livingUnits(unit.enemyTeam())) {
            e.addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.98, turns: 1 });
          }
          return null; // silent — small rolling dread
        },
      },
    },
    positional: POSITIONALS.iron_wake,
  },

  bear_shieldpaw: {
    id: 'bear_shieldpaw',
    element: 'water',
    name: 'Bear Shieldpaw',
    title: 'A Door That Hits Back',
    rarity: 2,
    stats: { hp: 1180, atk: 112, def: 96, speed: 86 },
    tint: { body: '#5a6a7a', helm: '#7a8a9a', weapon: '#c8c0b0', shield: '#8a9ab8', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearshieldpawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'paw_block_counter', name: 'Paw Block Counter',
        icon: 'assets/icons/fc854.png',
        description: 'Catch and return: 98% ATK, guarding: takes 5% less damage until next turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.98 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.95, turns: 1 },
        ],
      },
      {
        id: 'door_slam', name: 'Door Slam',
        icon: 'assets/icons/fc1476.png',
        description: 'Shut the door on them: 134% ATK and -10% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.34 },
          { type: 'turnMeter', amount: -0.1 },
        ],
      },
      {
        id: 'den_defense', name: 'Den Defense',
        icon: 'assets/icons/fc855.png',
        description: 'Nobody gets past: front-hex allies gain +14% DEF and 2% of his max HP regen for 2 turns.',
        cooldown: 6, targeting: 'front-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.14, turns: 2 },
          { type: 'hot', pct: 0.02, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Shield Paw',
      icon: 'assets/icons/fc856.png',
      description: 'At turn start, raises the paw: takes 6% less damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.94, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.shield_wall,
  },

  bear_salmoncaller: {
    id: 'bear_salmoncaller',
    element: 'water',
    name: 'Bear Salmoncaller',
    title: 'The Run Comes When She Sings',
    rarity: 2,
    stats: { hp: 1060, atk: 118, def: 80, speed: 96 },
    tint: { body: '#7a8a9a', helm: '#9aaab8', weapon: '#a8d8e8', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearsalmoncalleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'spawn_surge', name: 'Spawn Surge',
        icon: 'assets/icons/fc819.png',
        description: 'A silver surge: 101% ATK and -6% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.01 },
          { type: 'turnMeter', amount: -0.06 },
        ],
      },
      {
        id: 'leaping_run', name: 'Leaping Run',
        icon: 'assets/icons/fc1622.png',
        description: 'The run arrives all at once: 137% ATK, and the school carries her: +8% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.37 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.08 },
        ],
      },
      {
        id: 'great_spawning', name: 'Great Spawning',
        icon: 'assets/icons/fc1112.png',
        description: 'The river gives: ALL allies heal 50% of ATK and gain 6% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.5 },
          { type: 'turnMeter', amount: 0.06 },
        ],
      },
    ],
    passive: {
      name: 'Salmon Run',
      icon: 'assets/icons/fc882.png',
      description: 'Whenever an ally is healed, that ally also gains 3% turn meter.',
      hooks: {
        onAllyHealed(unit, healedUnit) {
          if (healedUnit === unit) return;
          healedUnit.turnMeter = Math.min(CONFIG.TURN_METER_MAX,
            healedUnit.turnMeter + CONFIG.TURN_METER_MAX * 0.03);
        },
      },
    },
    positional: POSITIONALS.field_medic,
  },

  bear_emberpelt: {
    id: 'bear_emberpelt',
    element: 'fire',
    name: 'Bear Emberpelt',
    title: 'Warm for the Wrong Reasons',
    rarity: 2,
    stats: { hp: 1090, atk: 120, def: 84, speed: 93 },
    tint: { body: '#8a4a2a', helm: '#a86a3a', weapon: '#e8843a', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearemberpeltidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'smolder_swipe', name: 'Smolder Swipe',
        icon: 'assets/icons/fc981.png',
        description: 'A smoking swipe: 96% ATK plus an 11% ATK burn for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
          { type: 'dot', pct: 0.11, turns: 2 },
        ],
      },
      {
        id: 'pelt_flare', name: 'Pelt Flare',
        icon: 'assets/icons/fc1050.png',
        description: 'The pelt catches: 131% ATK plus an 18% ATK burn for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.31 },
          { type: 'dot', pct: 0.18, turns: 1 },
        ],
      },
      {
        id: 'warmth_of_the_burn', name: 'Warmth of the Burn',
        icon: 'assets/icons/fc1044.png',
        description: 'Heat shared generously: 62% ATK to ALL enemies while the glow mends him 8% max HP.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.62 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.08 },
        ],
      },
    ],
    passive: {
      name: 'Ember Pelt',
      icon: 'assets/icons/fc1052.png',
      description: '+15% DoT damage and takes 5% less damage.',
      hooks: {
        dotBoostAdd: 0.15,
        damageTakenMult() { return 0.95; },
      },
    },
    positional: POSITIONALS.standard_bearer,
  },

  bear_nightmaw: {
    id: 'bear_nightmaw',
    element: 'dark',
    name: 'Bear Nightmaw',
    title: 'The Cave Dreams of Teeth',
    rarity: 3,
    stats: { hp: 1390, atk: 166, def: 99, speed: 98 },
    tint: { body: '#2a2a3a', helm: '#3a3a4a', weapon: '#8a6ab8', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearnightmawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'lightless_bite', name: 'Lightless Bite',
        icon: 'assets/icons/fc1444.png',
        description: 'A bite from pure dark: 99% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.99 },
        ],
      },
      {
        id: 'dream_eater', name: 'Dream Eater',
        icon: 'assets/icons/fc825.png',
        description: 'Feed on their resolve: 139% ATK, healing himself for 30% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.39 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.3 },
        ],
      },
      {
        id: 'cave_dark', name: 'Cave Dark',
        icon: 'assets/icons/fc1084.png',
        description: 'The dark closes in: ALL enemies lose 7% crit chance and 3% ATK for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'critChance', add: -0.07, turns: 1 },
          { type: 'debuff', stat: 'atk', mult: 0.97, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Midnight Appetite',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 20% extra damage to enemies carrying no buffs.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && !target.statusEffects.some((fx) => fx.kind === 'buff') ? 1.2 : 1;
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  bear_timberjack: {
    id: 'bear_timberjack',
    element: 'wind',
    name: 'Bear Timberjack',
    title: 'Clears His Own Path',
    rarity: 2,
    stats: { hp: 1120, atk: 122, def: 86, speed: 92 },
    tint: { body: '#7a5a3a', helm: '#9a7a4a', weapon: '#c8c0b0', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/beartimberjackidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'log_swing', name: 'Log Swing',
        icon: 'assets/icons/fc1472.png',
        description: 'Swing the whole log: 127% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.27 },
        ],
      },
      {
        id: 'timber_fall', name: 'Timber Fall',
        icon: 'assets/icons/fc767.png',
        description: 'Drop a trunk across a hex row: 92% ATK and -5% SPD for 1 turn.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.92 },
          { type: 'debuff', stat: 'speed', mult: 0.95, turns: 1 },
        ],
      },
      {
        id: 'clear_cut', name: 'Clear Cut',
        icon: 'assets/icons/fc730.png',
        description: 'Everything comes down: 168% ATK and -12% DEF for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.68 },
          { type: 'debuff', stat: 'def', mult: 0.88, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Lumber Rhythm',
      icon: 'assets/icons/fc882.png',
      description: '+7% chance to take an extra turn after acting.',
      hooks: { extraTurnAdd: 0.07 },
    },
    positional: POSITIONALS.bloodied_fury,
  },

  bear_denwarden: {
    id: 'bear_denwarden',
    element: 'water',
    name: 'Bear Denwarden',
    title: 'The Den Outlasts the Winter',
    rarity: 2,
    stats: { hp: 1200, atk: 110, def: 94, speed: 87 },
    tint: { body: '#4a5a6a', helm: '#6a7a8a', weapon: '#a8a0a8', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/beardenwardenidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'warden_swat', name: 'Warden Swat',
        icon: 'assets/icons/fc1471.png',
        description: 'An evicting swat: 10% of his max HP as damage.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageHpPct', pct: 0.1 },
        ],
      },
      {
        id: 'cave_in_hug', name: 'Cave-In Hug',
        icon: 'assets/icons/fc762.png',
        description: 'An overwhelming embrace: 124% ATK with a 12% chance to STUN for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.24 },
          { type: 'stun', chance: 0.12, turns: 1 },
        ],
      },
      {
        id: 'winter_den', name: 'Winter Den',
        icon: 'assets/icons/fc855.png',
        description: 'Everyone inside: ALL allies take 8% less damage and regenerate 2% of his max HP for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.92, turns: 2 },
          { type: 'hot', pct: 0.02, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Den Warden',
      icon: 'assets/icons/fc856.png',
      description: 'At turn start, tends the most wounded ally: +6% DEF for 1 turn and heals 1% of his max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.06, turns: 1 });
          allies[0].heal(Math.round(unit.maxHp * 0.01), unit);
          return null; // silent — small rolling care
        },
      },
    },
    positional: POSITIONALS.iron_wake,
  },

  bear_slugger: {
    id: 'bear_slugger',
    element: 'fire',
    name: 'Bear Slugger',
    title: 'Undefeated in Tavern Rules',
    rarity: 2,
    stats: { hp: 1070, atk: 128, def: 78, speed: 97 },
    tint: { body: '#8a6a4a', helm: '#a8845a', weapon: '#c8a878', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearsluggeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'haymaker_paw', name: 'Haymaker Paw',
        icon: 'assets/icons/fc663.png',
        description: 'The old one-two, minus the one: 118% ATK with a 6% chance to STUN for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.18 },
          { type: 'stun', chance: 0.06, turns: 1 },
        ],
      },
      {
        id: 'gut_punch', name: 'Gut Punch',
        icon: 'assets/icons/fc762.png',
        description: 'Right in the wind: 142% ATK and drains 12% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.42 },
          { type: 'turnMeter', amount: -0.12 },
        ],
      },
      {
        id: 'closing_time', name: 'Closing Time',
        icon: 'assets/icons/fc767.png',
        description: 'Everybody out: 172% ATK with a 20% chance to STUN for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.72 },
          { type: 'stun', chance: 0.2, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Heavy Hands',
      icon: 'assets/icons/fc867.png',
      description: '+6% Stun chance on single-target attacks.',
      hooks: { stunAdd: 0.06 },
    },
    positional: POSITIONALS.bloodied_fury,
  },

  bear_galeclaw: {
    id: 'bear_galeclaw',
    element: 'wind',
    name: 'Bear Galeclaw',
    title: 'Faster Than the Weather',
    rarity: 2,
    stats: { hp: 1040, atk: 124, def: 76, speed: 104 },
    tint: { body: '#6a8a8a', helm: '#8aaaa8', weapon: '#e8e8f8', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/beargaleclawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wind_rake', name: 'Wind Rake',
        icon: 'assets/icons/fc1447.png',
        description: 'A whistling rake: 104% ATK, gliding on: +5% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.04 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.05, turns: 1 },
        ],
      },
      {
        id: 'gale_rush', name: 'Gale Rush',
        icon: 'assets/icons/fc744.png',
        description: 'Arrive with the front: 141% ATK and +6% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.41 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.06 },
        ],
      },
      {
        id: 'claw_cyclone', name: 'Claw Cyclone',
        icon: 'assets/icons/fc729.png',
        description: 'A spinning storm of claws: two hits of 62% ATK to a hex row.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.62 },
          { type: 'damage', mult: 0.62 },
        ],
      },
    ],
    passive: {
      name: 'Gale Claws',
      icon: 'assets/icons/fc868.png',
      description: 'Fights loose while the pack has the numbers: +15% dodge while allies outnumber the enemy.',
      hooks: {
        dodgeAdd(unit) {
          const battle = typeof Battle !== 'undefined' ? Battle.active : null;
          if (!battle) return 0;
          return battle.livingUnits(unit.team).length >
            battle.livingUnits(unit.enemyTeam()).length ? 0.15 : 0;
        },
      },
    },
    positional: POSITIONALS.overwatch,
  },

  bear_herbmother: {
    id: 'bear_herbmother',
    element: 'water',
    name: 'Bear Herbmother',
    title: 'Poultices Strong as Paws',
    rarity: 2,
    stats: { hp: 1110, atk: 114, def: 84, speed: 94 },
    tint: { body: '#6a8a5a', helm: '#8aaa6a', weapon: '#a8c86a', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearherbmotheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'pestle_thump', name: 'Pestle Thump',
        icon: 'assets/icons/fc1471.png',
        description: 'A mortar-and-pestle thump: 97% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.97 },
        ],
      },
      {
        id: 'strong_medicine', name: 'Strong Medicine',
        icon: 'assets/icons/fc1112.png',
        description: 'It tastes terrible and works: heals an ally 16% of her max HP and cleanses their debuffs.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.16 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'grove_remedy', name: 'Grove Remedy',
        icon: 'assets/icons/fc800.png',
        description: 'The whole pharmacopoeia: ALL allies heal 45% of ATK plus 2% of her max HP for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.45 },
          { type: 'hot', pct: 0.02, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Herb Bundles',
      icon: 'assets/icons/fc1003.png',
      description: 'Her healing is 25% stronger.',
      hooks: { healBoostAdd: 0.25 },
    },
    positional: POSITIONALS.safe_distance,
  },

  bear_drumbelly: {
    id: 'bear_drumbelly',
    element: 'fire',
    name: 'Bear Drumbelly',
    title: 'Percussion Section of One',
    rarity: 2,
    stats: { hp: 1150, atk: 116, def: 88, speed: 90 },
    tint: { body: '#a87a4a', helm: '#c89a5a', weapon: '#c8b898', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/beardrumbellyidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'belly_bounce', name: 'Belly Bounce',
        icon: 'assets/icons/fc762.png',
        description: 'Bounce them off the belly: 11% of his max HP as damage.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damageHpPct', pct: 0.11 },
        ],
      },
      {
        id: 'resonant_slam', name: 'Resonant Slam',
        icon: 'assets/icons/fc767.png',
        description: 'A slam you can hum along to: 133% ATK and -8% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.33 },
          { type: 'turnMeter', amount: -0.08 },
        ],
      },
      {
        id: 'festival_beat', name: 'Festival Beat',
        icon: 'assets/icons/fc869.png',
        description: 'The good drum: ALL allies gain +8% ATK and 4% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.08, turns: 2 },
          { type: 'turnMeter', amount: 0.04 },
        ],
      },
    ],
    passive: {
      name: 'Belly Drum',
      icon: 'assets/icons/fc882.png',
      description: 'A full belly sings: whenever he is healed, gains +5% ATK for 2 turns.',
      hooks: {
        onAllyHealed(unit, healedUnit) {
          if (healedUnit !== unit) return;
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.05, turns: 2 });
        },
      },
    },
    positional: POSITIONALS.keystone,
  },

  bear_patriarch: {
    id: 'bear_patriarch',
    element: 'fire',
    name: 'Bear Patriarch',
    title: 'The Valley Remembers His Father',
    rarity: 3,
    stats: { hp: 1450, atk: 158, def: 100, speed: 94 },
    tint: { body: '#7a5a3a', helm: '#e8c83a', weapon: '#d8d8e0', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearpatriarchidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'patriarchs_swat', name: 'Patriarch\'s Swat',
        icon: 'assets/icons/fc1447.png',
        description: 'A swat with generations behind it: 126% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.26 },
        ],
      },
      {
        id: 'lay_down_the_law', name: 'Lay Down the Law',
        icon: 'assets/icons/fc730.png',
        description: 'The old law: 156% ATK, -10% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.56 },
          { type: 'debuff', stat: 'atk', mult: 0.9, turns: 2 },
        ],
      },
      {
        id: 'elders_blessing', name: 'Elder\'s Blessing',
        icon: 'assets/icons/fc869.png',
        description: 'The line endures: ALL allies gain +8% ATK for 2 turns and heal 3% of his max HP over 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.08, turns: 2 },
          { type: 'hot', pct: 0.03, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Patriarch\'s Watch',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, ALL allies gain +4% ATK for 1 turn and heal 0.5% of his max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const ally of battle.livingUnits(unit.team)) {
            ally.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.04, turns: 1 });
            ally.heal(Math.round(unit.maxHp * 0.005), unit);
          }
          return null; // silent — small rolling stewardship
        },
      },
    },
    positional: POSITIONALS.standard_bearer,
  },

  bear_frostmane: {
    id: 'bear_frostmane',
    element: 'water',
    name: 'Bear Frostmane',
    title: 'Winter Kept as a Pet',
    rarity: 3,
    stats: { hp: 1380, atk: 162, def: 98, speed: 96 },
    tint: { body: '#a8c8d8', helm: '#c8e8f8', weapon: '#a8d8e8', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearfrostmaneidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rime_swat', name: 'Rime Swat',
        icon: 'assets/icons/fc1444.png',
        description: 'A frost-caked swat: 105% ATK and -6% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.05 },
          { type: 'debuff', stat: 'speed', mult: 0.94, turns: 1 },
        ],
      },
      {
        id: 'frozen_hug', name: 'Frozen Hug',
        icon: 'assets/icons/fc762.png',
        description: 'Affection at absolute zero: 144% ATK with a 22% chance to STUN for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.44 },
          { type: 'stun', chance: 0.22, turns: 1 },
        ],
      },
      {
        id: 'manes_blizzard', name: 'Mane\'s Blizzard',
        icon: 'assets/icons/fc1044.png',
        description: 'Shake out the mane: 66% ATK to ALL enemies and -10% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.66 },
          { type: 'debuff', stat: 'speed', mult: 0.9, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Frostmane',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 12% less damage while any enemy is slowed.',
      hooks: {
        damageTakenMult(unit) {
          if (typeof Battle === 'undefined' || !Battle.active) return 1;
          return Battle.active.livingUnits(unit.enemyTeam()).some((e) =>
            e.statusEffects.some((fx) => fx.kind === 'debuff' && fx.stat === 'speed'))
            ? 0.88 : 1;
        },
      },
    },
    positional: POSITIONALS.bulwark_oath,
  },

  bear_thunderhide: {
    id: 'bear_thunderhide',
    element: 'wind',
    name: 'Bear Thunderhide',
    title: 'Weather System, Self-Contained',
    rarity: 3,
    stats: { hp: 1420, atk: 156, def: 102, speed: 92 },
    tint: { body: '#5a5a8a', helm: '#7a7aa8', weapon: '#e8e84a', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearthunderhideidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'static_swat', name: 'Static Swat',
        icon: 'assets/icons/fc1030.png',
        description: 'A crackling swat: 107% ATK and drains 7% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.07 },
          { type: 'turnMeter', amount: -0.07 },
        ],
      },
      {
        id: 'thunder_roll', name: 'Thunder Roll',
        icon: 'assets/icons/fc767.png',
        description: 'Roll through a hex row like weather: 12% of his max HP as damage.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damageHpPct', pct: 0.12 },
        ],
      },
      {
        id: 'stormfront_hide', name: 'Stormfront Hide',
        icon: 'assets/icons/fc854.png',
        description: 'Wear the storm: takes 30% less damage for 2 turns while sparks mend 4% max HP over 2 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.7, turns: 2 },
          { type: 'hot', pct: 0.04, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Thunder Hide',
      icon: 'assets/icons/fc882.png',
      description: 'At turn start, static grounds through ALL enemies for 1% of his max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.maxHp * 0.01));
          for (const e of enemies) Abilities.strike(unit, e, amount);
          return {
            label: 'Thunder Hide',
            message: `${unit.name}'s static grounds through the field.`,
            floats: enemies.map((e) => ({ target: e, text: `-${amount}`, color: '#e8e84a' })),
          };
        },
      },
    },
    positional: POSITIONALS.bulwark_oath,
  },

  bear_ancientroot: {
    id: 'bear_ancientroot',
    element: 'water',
    name: 'Bear Ancientroot',
    title: 'Older Than the Path Through',
    rarity: 3,
    stats: { hp: 1500, atk: 150, def: 104, speed: 88 },
    tint: { body: '#4a5a3a', helm: '#6a7a4a', weapon: '#8a9a7a', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearancientrootidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'root_heave', name: 'Root Heave',
        icon: 'assets/icons/fc1472.png',
        description: 'Heave a root the size of a road: 13% of his max HP as damage.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageHpPct', pct: 0.13 },
        ],
      },
      {
        id: 'sap_surge', name: 'Sap Surge',
        icon: 'assets/icons/fc1112.png',
        description: 'Old sap rises: heals an ally 18% of his max HP and grants +12% DEF for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.18 },
          { type: 'buff', stat: 'def', mult: 1.12, turns: 2 },
        ],
      },
      {
        id: 'grove_awakening', name: 'Grove Awakening',
        icon: 'assets/icons/fc855.png',
        description: 'The grove stands up: ALL allies gain +12% DEF and regenerate 2.5% of his max HP for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.12, turns: 2 },
          { type: 'hot', pct: 0.025, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Ancient Roots',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, every ally below 70% HP draws 2% of his max HP through the roots.',
      hooks: {
        onTurnStart(unit, battle) {
          const thirsty = battle.livingUnits(unit.team)
            .filter((u) => u.hp / u.maxHp < 0.7);
          if (thirsty.length === 0) return null;
          let total = 0;
          for (const ally of thirsty) total += ally.heal(Math.round(unit.maxHp * 0.02), unit);
          if (total <= 0) return null;
          return {
            label: 'Ancient Roots',
            message: `${unit.name}'s roots carry ${total} HP to the thirsty.`,
            floats: [],
          };
        },
      },
    },
    positional: POSITIONALS.warding_circle,
  },

  bear_flamemaw: {
    id: 'bear_flamemaw',
    element: 'fire',
    name: 'Bear Flamemaw',
    title: 'Eats Campfires Whole',
    rarity: 3,
    stats: { hp: 1360, atk: 166, def: 94, speed: 98 },
    tint: { body: '#8a3a1a', helm: '#e8632a', weapon: '#f8a83a', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearflamemawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'coalbite', name: 'Coalbite',
        icon: 'assets/icons/fc981.png',
        description: 'A glowing bite: 110% ATK plus a 9% ATK burn for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.1 },
          { type: 'dot', pct: 0.09, turns: 2 },
        ],
      },
      {
        id: 'swallow_the_bonfire', name: 'Swallow the Bonfire',
        icon: 'assets/icons/fc1050.png',
        description: 'Down in one: heals himself 14% max HP and his next breath scorches: 128% ATK plus a 22% ATK burn for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.28 },
          { type: 'dot', pct: 0.22, turns: 1 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.14 },
        ],
      },
      {
        id: 'mawfire', name: 'Mawfire',
        icon: 'assets/icons/fc1044.png',
        description: 'Open the furnace: 72% ATK to ALL enemies plus a 14% ATK burn for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.72 },
          { type: 'dot', pct: 0.14, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Flame Maw',
      icon: 'assets/icons/fc1093.png',
      description: '+20% DoT damage, and devouring flame mends: +10% Healing.',
      hooks: { dotBoostAdd: 0.20, healBoostAdd: 0.10 },
    },
    positional: POSITIONALS.standard_bearer,
  },

  bear_sunmother: {
    id: 'bear_sunmother',
    element: 'light',
    name: 'Bear Sunmother',
    title: 'Every Cub Counted at Dusk',
    rarity: 3,
    stats: { hp: 1440, atk: 152, def: 96, speed: 95 },
    tint: { body: '#e8d8a8', helm: '#f8e8c8', weapon: '#f8d86a', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearsunmotheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'gilded_swat', name: 'Gilded Swat',
        icon: 'assets/icons/fc1447.png',
        description: 'A golden swat: 99% ATK, and the light lifts her: heals 8% of her max HP.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.99 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.08 },
        ],
      },
      {
        id: 'gather_the_cubs', name: 'Gather the Cubs',
        icon: 'assets/icons/fc1112.png',
        description: 'Everyone accounted for: heals an ally 20% of her max HP and grants 8% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.2 },
          { type: 'turnMeter', amount: 0.08 },
        ],
      },
      {
        id: 'long_summer', name: 'Long Summer',
        icon: 'assets/icons/fc800.png',
        description: 'A season of plenty: ALL allies heal 40% of ATK, regenerate 2% of her max HP for 3 turns, and gain +6% DEF for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.4 },
          { type: 'hot', pct: 0.02, turns: 3 },
          { type: 'buff', stat: 'def', mult: 1.06, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Sun Mother',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, ALL allies heal 1% of her max HP and gain 2% turn meter.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const ally of battle.livingUnits(unit.team)) {
            ally.heal(Math.round(unit.maxHp * 0.01), unit);
            if (ally !== unit) {
              ally.turnMeter = Math.min(CONFIG.TURN_METER_MAX,
                ally.turnMeter + CONFIG.TURN_METER_MAX * 0.02);
            }
          }
          return null; // silent — small rolling warmth
        },
      },
    },
    positional: POSITIONALS.standard_bearer,
  },

  // ---- Feline cohort (the Meadow) -----------------------------------------
  // Procedural placeholder art renders until real idle sheets land at the
  // conventional flat paths (assets/heroes/cat<role>idle.png).

  bear_gravemauler: {
    id: 'bear_gravemauler',
    element: 'dark',
    name: 'Bear Gravemauler',
    title: 'The sentence is the swing.',
    rarity: 3,
    stats: { hp: 1144, atk: 176, def: 90, speed: 102 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/beargravemauleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_gravemauler_edge', name: 'Gravemauler\'s Edge',
        icon: 'assets/icons/fc734.png',
        description: 'Two dark cuts: 71% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.71 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'bear_gravemauler_sentence', name: 'Gravemauler\'s Sentence',
        icon: 'assets/icons/fc730.png',
        description: 'Pass judgment: 181% ATK and the target takes +12% damage for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.81 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.12, turns: 1 },
        ],
      },
      {
        id: 'bear_gravemauler_end', name: 'Gravemauler\'s End',
        icon: 'assets/icons/fc728.png',
        description: 'Carry it out: 257% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.57 },
        ],
      },
    ],
    passive: {
      name: 'Gravemauler\'s Due',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 23% extra damage to enemies below 38% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.38 ? 1.23 : 1;
        },
      },
    },
    positional: POSITIONALS.press_the_flank,
  },

  bear_hexclaw: {
    id: 'bear_hexclaw',
    element: 'dark',
    name: 'Bear Hexclaw',
    title: 'Carries every curse worth having.',
    rarity: 3,
    stats: { hp: 1153, atk: 181, def: 93, speed: 104 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearhexclawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_hexclaw_lash', name: 'Hexclaw Lash',
        icon: 'assets/icons/fc1052.png',
        description: 'Two cursed lashes: 72% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.72 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'bear_hexclaw_bane', name: 'Hexclaw Bane',
        icon: 'assets/icons/fc1084.png',
        description: 'A layered curse: 182% ATK, -14% ATK and -10% DEF for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.82 },
          { type: 'debuff', stat: 'atk', mult: 0.86, turns: 2 },
          { type: 'debuff', stat: 'def', mult: 0.9, turns: 2 },
        ],
      },
      {
        id: 'bear_hexclaw_pall', name: 'Hexclaw Pall',
        icon: 'assets/icons/fc1050.png',
        description: 'A pall over everything: 136% ATK to ALL enemies and -3% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.36 },
          { type: 'debuff', stat: 'speed', mult: 0.97, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Hexclaw Craft',
      icon: 'assets/icons/fc1093.png',
      description: 'Curses honed in the dark.',
      hooks: { accuracyAdd: 0.09, dotBoostAdd: 0.09 },
    },
    positional: POSITIONALS.last_stand,
  },

  bear_bloodhoney: {
    id: 'bear_bloodhoney',
    element: 'dark',
    name: 'Bear Bloodhoney',
    title: 'Your vigor, redistributed.',
    rarity: 3,
    stats: { hp: 1162, atk: 186, def: 96, speed: 106 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearbloodhoneyidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_bloodhoney_sip', name: 'Bloodhoney\'s Sip',
        icon: 'assets/icons/fc1444.png',
        description: 'Two draining touches: 73% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.73 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'bear_bloodhoney_feast', name: 'Bloodhoney\'s Feast',
        icon: 'assets/icons/fc825.png',
        description: 'Drink deep: 183% ATK, healing himself for 42% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.83 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.42 },
        ],
      },
      {
        id: 'bear_bloodhoney_toll', name: 'Bloodhoney\'s Toll',
        icon: 'assets/icons/fc1112.png',
        description: 'Tax the living: 127% ATK to ALL enemies while he mends 12% of his max HP.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.27 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.12 },
        ],
      },
    ],
    passive: {
      name: 'Bloodhoney Hunger',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, siphons 2.6% of his max HP from a random enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const amount = Math.max(1, Math.round(unit.maxHp * 0.026));
          Abilities.strike(unit, target, amount);
          unit.heal(amount);
          return null; // silent — small rolling hunger
        },
      },
    },
    positional: POSITIONALS.marked_quarry,
  },

  bear_duskpelt: {
    id: 'bear_duskpelt',
    element: 'dark',
    name: 'Bear Duskpelt',
    title: 'The dark keeps its edge honed.',
    rarity: 3,
    stats: { hp: 1171, atk: 161, def: 99, speed: 108 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearduskpeltidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_duskpelt_flick', name: 'Duskpelt Flick',
        icon: 'assets/icons/fc1447.png',
        description: 'Two flickering cuts: 74% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.74 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'bear_duskpelt_waltz', name: 'Duskpelt Waltz',
        icon: 'assets/icons/fc1587.png',
        description: 'A step through shadow: 184% ATK and +12% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.84 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.12, turns: 1 },
        ],
      },
      {
        id: 'bear_duskpelt_finale', name: 'Duskpelt Finale',
        icon: 'assets/icons/fc723.png',
        description: 'The last figure: 248% ATK — 25% more against debuffed prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.48, bonusVs: { kind: 'debuff', mult: 1.25 } },
        ],
      },
    ],
    passive: {
      name: 'Duskpelt Poise',
      icon: 'assets/icons/fc862.png',
      description: 'A blade kept perfectly balanced (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.09, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.06, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.standard_bearer,
  },

  bear_dreadroar: {
    id: 'bear_dreadroar',
    element: 'dark',
    name: 'Bear Dreadroar',
    title: 'Fear arrives before the blow.',
    rarity: 3,
    stats: { hp: 1180, atk: 166, def: 78, speed: 110 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/beardreadroaridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_dreadroar_knell', name: 'Dreadroar Knell',
        icon: 'assets/icons/fc1003.png',
        description: 'Two tolling blows: 75% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'bear_dreadroar_omen', name: 'Dreadroar Omen',
        icon: 'assets/icons/fc1084.png',
        description: 'Name their doom: 165% ATK and -15% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.65 },
          { type: 'debuff', stat: 'atk', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'bear_dreadroar_chorus', name: 'Dreadroar Chorus',
        icon: 'assets/icons/fc807.png',
        description: 'The dread chorus: 134% ATK to ALL enemies and -6% crit chance for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.34 },
          { type: 'debuff', stat: 'critChance', add: -0.06, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Dreadroar Presence',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, dread spreads: ALL enemies lose 3% SPD for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const e of battle.livingUnits(unit.enemyTeam())) {
            e.addStatusEffect({ kind: 'debuff', stat: 'speed', mult: 0.97, turns: 1 });
          }
          return null; // silent — small rolling dread
        },
      },
    },
    positional: POSITIONALS.vanguard_press,
  },

  bear_lightpaw: {
    id: 'bear_lightpaw',
    element: 'light',
    name: 'Bear Lightpaw',
    title: 'Every wound answers to the light.',
    rarity: 3,
    stats: { hp: 1189, atk: 171, def: 81, speed: 112 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearlightpawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_lightpaw_rebuke', name: 'Lightpaw\'s Rebuke',
        icon: 'assets/icons/fc1471.png',
        description: 'Two shining raps: 76% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.76 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'bear_lightpaw_grace', name: 'Lightpaw\'s Grace',
        icon: 'assets/icons/fc1112.png',
        description: 'Pour in the light: heals an ally 165% of ATK and cleanses their debuffs.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.65 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'bear_lightpaw_communion', name: 'Lightpaw\'s Communion',
        icon: 'assets/icons/fc800.png',
        description: 'Shared light: ALL allies heal 114% of ATK plus 1.7% of max HP regen for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.15 },
          { type: 'hot', pct: 0.017, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Lightpaw Devotion',
      icon: 'assets/icons/fc1093.png',
      description: 'Healing hands, steadied by faith.',
      hooks: { healBoostAdd: 0.16, resistanceAdd: 0.05 },
    },
    positional: POSITIONALS.opening_volley,
  },

  bear_aegishide: {
    id: 'bear_aegishide',
    element: 'light',
    name: 'Bear Aegishide',
    title: 'A shield the sun would envy.',
    rarity: 3,
    stats: { hp: 1198, atk: 176, def: 84, speed: 96 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearaegishideidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_aegishide_check', name: 'Aegishide\'s Check',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield checks: 77% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.77 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'bear_aegishide_ward', name: 'Aegishide\'s Ward',
        icon: 'assets/icons/fc855.png',
        description: 'Raise the aegis over an ally: they take 7% less damage for 2 turns and heal 106% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.92, turns: 2 },
          { type: 'heal', mult: 1.06 },
        ],
      },
      {
        id: 'bear_aegishide_vigil', name: 'Aegishide\'s Vigil',
        icon: 'assets/icons/fc856.png',
        description: 'The unbroken vigil: ALL allies gain +12% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.13, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Aegishide Constancy',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, shields the most wounded ally: takes 5% less damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.94, turns: 1 });
          return null; // silent — small rolling shelter
        },
      },
    },
    positional: POSITIONALS.keystone,
  },

  bear_dawnclaw: {
    id: 'bear_dawnclaw',
    element: 'light',
    name: 'Bear Dawnclaw',
    title: 'Morning, sharpened.',
    rarity: 3,
    stats: { hp: 1207, atk: 181, def: 87, speed: 98 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/beardawnclawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_dawnclaw_stroke', name: 'Dawnclaw Stroke',
        icon: 'assets/icons/fc1587.png',
        description: 'Two dawn-lit strokes: 78% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.78 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'bear_dawnclaw_flare', name: 'Dawnclaw Flare',
        icon: 'assets/icons/fc1447.png',
        description: 'A flare of morning: 188% ATK, and the light mends 11% of max HP.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.88 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.11 },
        ],
      },
      {
        id: 'bear_dawnclaw_zenith', name: 'Dawnclaw Zenith',
        icon: 'assets/icons/fc730.png',
        description: 'High noon: 251% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.51 },
        ],
      },
    ],
    passive: {
      name: 'Dawnclaw Resolve',
      icon: 'assets/icons/fc1003.png',
      description: 'Heals 1.5% max HP at turn start while below 85% HP.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp >= 0.85) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.015));
          if (healed <= 0) return null;
          return {
            label: 'Dawnclaw Resolve',
            message: `${unit.name}'s light knits ${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#f8d86a' }],
          };
        },
      },
    },
    positional: POSITIONALS.bulwark_oath,
  },

  bear_sunroarer: {
    id: 'bear_sunroarer',
    element: 'light',
    name: 'Bear Sunroarer',
    title: 'Good news travels armed.',
    rarity: 3,
    stats: { hp: 1216, atk: 186, def: 90, speed: 100 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearsunroareridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_sunroarer_call', name: 'Sunroarer\'s Call',
        icon: 'assets/icons/fc868.png',
        description: 'Two ringing notes: 79% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.79 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'bear_sunroarer_proclamation', name: 'Sunroarer\'s Proclamation',
        icon: 'assets/icons/fc869.png',
        description: 'Lift an ally: +16% ATK for 2 turns and 12% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.16, turns: 2 },
          { type: 'turnMeter', amount: 0.12 },
        ],
      },
      {
        id: 'bear_sunroarer_triumph', name: 'Sunroarer\'s Triumph',
        icon: 'assets/icons/fc882.png',
        description: 'Declare the day won: ALL allies gain +7% SPD for 2 turns and 3% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.07, turns: 2 },
          { type: 'turnMeter', amount: 0.03 },
        ],
      },
    ],
    passive: {
      name: 'Sunroarer Anthem',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start: ALL allies gain +5% crit damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) { a.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.05, turns: 1 }); }
          return null; // silent — small rolling anthem
        },
      },
    },
    positional: POSITIONALS.windrunner,
  },

  bear_oathguard: {
    id: 'bear_oathguard',
    element: 'light',
    name: 'Bear Oathguard',
    title: 'Verdicts delivered in person.',
    rarity: 3,
    stats: { hp: 1225, atk: 161, def: 93, speed: 102 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearoathguardidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_oathguard_gavel', name: 'Oathguard\'s Gavel',
        icon: 'assets/icons/fc1461.png',
        description: 'Two measured blows: 80% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'bear_oathguard_inquest', name: 'Oathguard\'s Inquest',
        icon: 'assets/icons/fc862.png',
        description: 'Open the case: 180% ATK and the target takes +20% damage for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.8 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.2, turns: 2 },
        ],
      },
      {
        id: 'bear_oathguard_verdict', name: 'Oathguard\'s Verdict',
        icon: 'assets/icons/fc744.png',
        description: 'Deliver the verdict: 253% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.53 },
        ],
      },
    ],
    passive: {
      name: 'Oathguard Justice',
      icon: 'assets/icons/fc863.png',
      description: 'Justice sees clearly: deals 30% extra damage to weakened (ATK-debuffed) enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'debuff' && fx.stat === 'atk') ? 1.3 : 1;
        },
      },
    },
    positional: POSITIONALS.pivot_step,
  },

  bear_warclaw: {
    id: 'bear_warclaw',
    element: 'water',
    name: 'Bear Warclaw',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1486, atk: 220, def: 120, speed: 112 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearwarclawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_warclaw_strike', name: 'Warclaw\'s Strike',
        icon: 'assets/icons/fc730.png',
        description: 'Two champion blows: 83% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.83 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'bear_warclaw_onslaught', name: 'Warclaw\'s Onslaught',
        icon: 'assets/icons/fc1447.png',
        description: 'Press the advantage: 196% ATK, then +13% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.96 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.13, turns: 2 },
        ],
      },
      {
        id: 'bear_warclaw_supremacy', name: 'Warclaw\'s Supremacy',
        icon: 'assets/icons/fc767.png',
        description: 'Settle it: 247% ATK and -7% DEF for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.47 },
          { type: 'debuff', stat: 'def', mult: 0.93, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Warclaw Supremacy',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 3% more and takes 8% less damage.',
      hooks: {
        damageDealtMult() { return 1.03; },
        damageTakenMult() { return 0.92; },
      },
    },
    positional: POSITIONALS.reckless_charge,
  },

  bear_runefur: {
    id: 'bear_runefur',
    element: 'fire',
    name: 'Bear Runefur',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1498, atk: 226, def: 124, speed: 115 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearrunefuridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_runefur_bolt', name: 'Runefur\'s Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'Twin arcane bolts: 84% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.84 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'bear_runefur_torrent', name: 'Runefur\'s Torrent',
        icon: 'assets/icons/fc1084.png',
        description: 'A torrent of power: 137% ATK to ALL enemies and -6% SPD for 2 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.37 },
          { type: 'debuff', stat: 'speed', mult: 0.94, turns: 2 },
        ],
      },
      {
        id: 'bear_runefur_cataclysm', name: 'Runefur\'s Cataclysm',
        icon: 'assets/icons/fc1044.png',
        description: 'The big one: 153% ATK to ALL enemies and -7% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.53 },
          { type: 'debuff', stat: 'atk', mult: 0.93, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Runefur Resonance',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, arcane bleed sears ALL enemies for 0.5% of this hero\'s ATK.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.effectiveStat('atk') * 0.005));
          for (const e of enemies) Abilities.strike(unit, e, amount);
          return null; // silent — small rolling resonance
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  bear_wallpaw: {
    id: 'bear_wallpaw',
    element: 'wind',
    name: 'Bear Wallpaw',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1510, atk: 196, def: 102, speed: 101 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearwallpawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_wallpaw_bash', name: 'Wallpaw\'s Bash',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield strikes: 85% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'bear_wallpaw_bulwark', name: 'Wallpaw\'s Bulwark',
        icon: 'assets/icons/fc855.png',
        description: 'Anchor the line: ALL allies gain +15% DEF for 2 turns and take 3% less damage for 1 turn.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.15, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.97, turns: 1 },
        ],
      },
      {
        id: 'bear_wallpaw_stand', name: 'Wallpaw\'s Stand',
        icon: 'assets/icons/fc856.png',
        description: 'Refuse to fall: takes 32% less damage for 2 turns and heals 14% max HP.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.68, turns: 2 },
          { type: 'healHpPct', pct: 0.14 },
        ],
      },
    ],
    passive: {
      name: 'Wallpaw Aegis',
      icon: 'assets/icons/fc868.png',
      description: 'Takes 16% less damage while below 55% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.alive && unit.hp / unit.maxHp < 0.55 ? 0.84 : 1;
        },
      },
    },
    positional: POSITIONALS.thornguard,
  },

  bear_farwatch: {
    id: 'bear_farwatch',
    element: 'water',
    name: 'Bear Farwatch',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1522, atk: 202, def: 106, speed: 104 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearfarwatchidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_farwatch_shot', name: 'Farwatch\'s Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'Two placed shots: 86% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.86 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'bear_farwatch_deadeye', name: 'Farwatch\'s Deadeye',
        icon: 'assets/icons/fc1516.png',
        description: 'The perfect line: 209% ATK and drains 13% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.09 },
          { type: 'turnMeter', amount: -0.13 },
        ],
      },
      {
        id: 'bear_farwatch_barrage', name: 'Farwatch\'s Barrage',
        icon: 'assets/icons/fc807.png',
        description: 'Fill the sky: 135% ATK to ALL enemies.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.35 },
          { type: 'turnMeter', amount: -0.01 },
        ],
      },
    ],
    passive: {
      name: 'Farwatch Focus',
      icon: 'assets/icons/fc862.png',
      description: 'The shot is already lined up (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.09, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.overwatch,
  },

  bear_mistfur: {
    id: 'bear_mistfur',
    element: 'fire',
    name: 'Bear Mistfur',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1534, atk: 208, def: 110, speed: 107 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearmistfuridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_mistfur_touch', name: 'Mistfur\'s Touch',
        icon: 'assets/icons/fc1112.png',
        description: 'Two chastening touches: 87% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.87 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'bear_mistfur_blessing', name: 'Mistfur\'s Blessing',
        icon: 'assets/icons/fc800.png',
        description: 'Mend an ally: 18% of max HP plus 2.7% regen for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.18 },
          { type: 'hot', pct: 0.027, turns: 2 },
        ],
      },
      {
        id: 'bear_mistfur_renewal', name: 'Mistfur\'s Renewal',
        icon: 'assets/icons/fc869.png',
        description: 'The circle holds: ALL allies heal 50% of ATK, are cleansed, and gain +4% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.5 },
          { type: 'cleanse' },
          { type: 'buff', stat: 'def', mult: 1.04, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Mistfur Communion',
      icon: 'assets/icons/fc1003.png',
      description: 'Healing woven a little stronger.',
      hooks: { healBoostAdd: 0.09, dodgeAdd: 0.06 },
    },
    positional: POSITIONALS.pivot_step,
  },

  bear_nullpaw: {
    id: 'bear_nullpaw',
    element: 'dark',
    name: 'Bear Nullpaw',
    title: 'Champion of the Dark',
    rarity: 4,
    stats: { hp: 1546, atk: 214, def: 114, speed: 110 },
    tint: { body: '#241f33', helm: '#3d3350', weapon: '#9a7ad0', skin: '#8a82a0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearnullpawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_nullpaw_grasp', name: 'Nullpaw\'s Grasp',
        icon: 'assets/icons/fc1444.png',
        description: 'Two grasping shadows: 88% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.88 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'bear_nullpaw_devour', name: 'Nullpaw\'s Devour',
        icon: 'assets/icons/fc825.png',
        description: 'Feed the void: 191% ATK, healing this hero for 38% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.91 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.38 },
        ],
      },
      {
        id: 'bear_nullpaw_oblivion', name: 'Nullpaw\'s Oblivion',
        icon: 'assets/icons/fc734.png',
        description: 'Unmake them: 262% ATK and the target takes +22% damage for 1 turn.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.62 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.22, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Nullpaw Thirst',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, drains 2.5% of max HP from the weakest enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          enemies.sort((a, b) => a.hp - b.hp);
          const amount = Math.max(1, Math.round(unit.maxHp * 0.025));
          Abilities.strike(unit, enemies[0], amount);
          unit.heal(amount);
          return null; // silent — small rolling thirst
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  bear_gloryclaw: {
    id: 'bear_gloryclaw',
    element: 'light',
    name: 'Bear Gloryclaw',
    title: 'Champion of the Dawn',
    rarity: 4,
    stats: { hp: 1558, atk: 220, def: 118, speed: 113 },
    tint: { body: '#e0d3a8', helm: '#f5e9c0', weapon: '#ffdf70', skin: '#f0e4c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/beargloryclawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_gloryclaw_radiance', name: 'Gloryclaw\'s Radiance',
        icon: 'assets/icons/fc1471.png',
        description: 'Two radiant strikes: 89% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.89 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'bear_gloryclaw_benediction', name: 'Gloryclaw\'s Benediction',
        icon: 'assets/icons/fc1112.png',
        description: 'Bless an ally: heals 20% of max HP and grants 14% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.2 },
          { type: 'turnMeter', amount: 0.14 },
        ],
      },
      {
        id: 'bear_gloryclaw_ascension', name: 'Gloryclaw\'s Ascension',
        icon: 'assets/icons/fc855.png',
        description: 'Lift the whole line: ALL allies heal 56% of ATK and gain +7% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.56 },
          { type: 'buff', stat: 'atk', mult: 1.07, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Gloryclaw Benevolence',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, ALL allies heal 1.1% of this hero\'s max HP and gain a small crit blessing for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) {
            a.heal(Math.round(unit.maxHp * 0.011), unit);
            a.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.03, turns: 1 });
          }
          return null; // silent — small rolling benevolence
        },
      },
    },
    positional: POSITIONALS.keystone,
  },

});
