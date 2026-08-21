// Wolf heroes (42). Registered into the shared
// HEROES table declared in js/data/heroes.js.

Object.assign(HEROES, {

  wolf_pup: {
    id: 'wolf_pup',
    element: 'wind',
    name: 'Wolf Pup',
    title: 'All Teeth, No Plan',
    rarity: 1,
    stats: { hp: 720, atk: 108, def: 58, speed: 102 },
    tint: { body: '#8a8a9a', helm: '#a8a8b8', weapon: '#c8c0b0', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfpupidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'nip', name: 'Nip',
        icon: 'assets/icons/fc1444.png',
        description: 'An eager nip: 100% ATK, bouncing back with 4% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.04 },
        ],
      },
      {
        id: 'playful_pounce', name: 'Playful Pounce',
        icon: 'assets/icons/fc825.png',
        description: 'A pounce that lands harder than intended: 133% ATK with a 15% chance to STUN for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.33 },
          { type: 'stun', chance: 0.15, turns: 1 },
        ],
      },
      {
        id: 'yipping_fit', name: 'Yipping Fit',
        icon: 'assets/icons/fc1084.png',
        description: 'An unbearable racket: ALL enemies lose 6% ATK for 1 turn and 3% turn meter.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'atk', mult: 0.94, turns: 1 },
          { type: 'turnMeter', amount: -0.03 },
        ],
      },
    ],
    passive: {
      name: 'Beginner\'s Luck',
      icon: 'assets/icons/fc882.png',
      description: '+5% Stun chance on single-target attacks.',
      hooks: { stunAdd: 0.05 },
    },
    positional: POSITIONALS.hexweaver,
  },

  wolf_tracker: {
    id: 'wolf_tracker',
    element: 'water',
    name: 'Wolf Tracker',
    title: 'Nose Like a Verdict',
    rarity: 1,
    stats: { hp: 780, atk: 112, def: 64, speed: 98 },
    tint: { body: '#6a7a8a', helm: '#8a9aa8', weapon: '#b8a878', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolftrackeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'track_and_bite', name: 'Track and Bite',
        icon: 'assets/icons/fc1447.png',
        description: 'A studied bite: 98% ATK that exposes the prey (+8% damage taken, 1 turn).',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.98 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.08, turns: 1 },
        ],
      },
      {
        id: 'pinning_leap', name: 'Pinning Leap',
        icon: 'assets/icons/fc763.png',
        description: 'Leap and pin: 135% ATK with a 25% chance to STUN for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.35 },
          { type: 'stun', chance: 0.25, turns: 1 },
        ],
      },
      {
        id: 'pack_signal', name: 'Pack Signal',
        icon: 'assets/icons/fc868.png',
        description: 'Signal the pack: ALL allies gain +5% crit chance for 1 turn and 8% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'critChance', add: 0.05, turns: 1 },
          { type: 'turnMeter', amount: 0.08 },
        ],
      },
    ],
    passive: {
      name: 'Scent of Blood',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 15% extra damage to enemies below 35% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.35 ? 1.15 : 1;
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  wolf_howler: {
    id: 'wolf_howler',
    element: 'wind',
    name: 'Wolf Howler',
    title: 'Heard Three Valleys Over',
    rarity: 1,
    stats: { hp: 760, atk: 106, def: 62, speed: 100 },
    tint: { body: '#5a6a7a', helm: '#7a8a9a', weapon: '#e8d8a8', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfhowleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bark', name: 'Bark',
        icon: 'assets/icons/fc1003.png',
        description: 'A sharp bark: 90% ATK and -4% crit chance for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'debuff', stat: 'critChance', add: -0.04, turns: 1 },
        ],
      },
      {
        id: 'piercing_howl', name: 'Piercing Howl',
        icon: 'assets/icons/fc1084.png',
        description: 'A howl that rattles bone: ALL enemies lose 7% DEF and 3% SPD for 1 turn.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'def', mult: 0.93, turns: 1 },
          { type: 'debuff', stat: 'speed', mult: 0.97, turns: 1 },
        ],
      },
      {
        id: 'moonsong', name: 'Moonsong',
        icon: 'assets/icons/fc869.png',
        description: 'The old song: ALL allies gain +8% ATK for 2 turns and heal 42.9% of ATK.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.08, turns: 2 },
          { type: 'heal', mult: 0.429 },
        ],
      },
    ],
    passive: {
      name: 'Carrying Voice',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, a random ally gains +5% ATK for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          const ally = allies[Math.floor(Math.random() * allies.length)];
          ally.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.05, turns: 1 });
          return null; // silent — small rolling encouragement
        },
      },
    },
    positional: POSITIONALS.press_the_flank,
  },

  wolf_icefang: {
    id: 'wolf_icefang',
    element: 'water',
    name: 'Wolf Icefang',
    title: 'Bite First, Thaw Never',
    rarity: 1,
    stats: { hp: 800, atk: 114, def: 66, speed: 96 },
    tint: { body: '#7a9ab8', helm: '#9abad8', weapon: '#c8e8f8', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolficefangidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'frost_bite', name: 'Frost Bite',
        icon: 'assets/icons/fc1444.png',
        description: 'An icy bite: 95% ATK and -5% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'debuff', stat: 'speed', mult: 0.95, turns: 1 },
        ],
      },
      {
        id: 'icicle_crunch', name: 'Icicle Crunch',
        icon: 'assets/icons/fc734.png',
        description: 'Crunch through the chill: 145% ATK — 30% more against slowed or hasted prey.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.45, bonusVs: { stat: 'speed', mult: 1.3 } },
        ],
      },
      {
        id: 'cold_snap', name: 'Cold Snap',
        icon: 'assets/icons/fc1050.png',
        description: 'A sudden freeze: 55% ATK to ALL enemies and -10% SPD for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.55 },
          { type: 'debuff', stat: 'speed', mult: 0.9, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Cold Blood',
      icon: 'assets/icons/fc856.png',
      description: '+15% debuff resistance and +5% debuff accuracy.',
      hooks: { resistanceAdd: 0.15, accuracyAdd: 0.05 },
    },
    positional: POSITIONALS.iron_wake,
  },

  wolf_snowstalker: {
    id: 'wolf_snowstalker',
    element: 'wind',
    name: 'Wolf Snowstalker',
    title: 'The Drift That Moves',
    rarity: 1,
    stats: { hp: 750, atk: 116, def: 60, speed: 101 },
    tint: { body: '#e8e8f0', helm: '#c8c8d8', weapon: '#a8a8b8', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfsnowstalkeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'silent_step', name: 'Silent Step',
        icon: 'assets/icons/fc1447.png',
        description: 'A strike from nowhere: 119% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.19 },
        ],
      },
      {
        id: 'white_ambush', name: 'White Ambush',
        icon: 'assets/icons/fc825.png',
        description: 'Erupt from the snow: 160% ATK with a 20% chance to STUN for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.6 },
          { type: 'stun', chance: 0.2, turns: 1 },
        ],
      },
      {
        id: 'vanish_in_the_drift', name: 'Vanish in the Drift',
        icon: 'assets/icons/fc862.png',
        description: 'Become the snowfield: takes 35% less damage and +20% SPD for 1 turn.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.65, turns: 1 },
          { type: 'buff', stat: 'speed', mult: 1.2, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Snowblind',
      icon: 'assets/icons/fc882.png',
      description: 'Deals 25% extra damage to enemies with lowered crit chance.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'debuff' && fx.stat === 'critChance') ? 1.25 : 1;
        },
      },
    },
    positional: POSITIONALS.overwatch,
  },

  wolf_sledpuller: {
    id: 'wolf_sledpuller',
    element: 'water',
    name: 'Wolf Sledpuller',
    title: 'A Thousand Miles of Stubborn',
    rarity: 1,
    stats: { hp: 920, atk: 102, def: 80, speed: 88 },
    tint: { body: '#6a5a4a', helm: '#8a7a5a', weapon: '#c8b898', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfsledpulleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'harness_slam', name: 'Harness Slam',
        icon: 'assets/icons/fc1471.png',
        description: 'A harness-weighted slam: 100% ATK, braced: +8% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.08, turns: 1 },
        ],
      },
      {
        id: 'unstoppable_pull', name: 'Unstoppable Pull',
        icon: 'assets/icons/fc724.png',
        description: 'Drag the line through a hex row: 95% ATK and -5% turn meter.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
      {
        id: 'endurance_of_the_team', name: 'Endurance of the Team',
        icon: 'assets/icons/fc1112.png',
        description: 'Set the pace: ALL allies regenerate 2.5% of his max HP for 3 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'hot', pct: 0.025, turns: 3 },
        ],
      },
    ],
    passive: {
      name: 'Beast of Burden',
      icon: 'assets/icons/fc856.png',
      description: 'At turn start while below half HP, digs deep: +10% DEF for 2 turns.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp >= 0.5) return null;
          unit.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.1, turns: 2 });
          return null; // silent — quiet endurance
        },
      },
    },
    positional: POSITIONALS.shield_wall,
  },

  wolf_cavehunter: {
    id: 'wolf_cavehunter',
    element: 'fire',
    name: 'Wolf Cavehunter',
    title: 'Eyes That Own the Dark',
    rarity: 1,
    stats: { hp: 790, atk: 115, def: 63, speed: 97 },
    tint: { body: '#4a3a3a', helm: '#6a5a4a', weapon: '#c8c0b0', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfcavehunteridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'darkfang', name: 'Darkfang',
        icon: 'assets/icons/fc1444.png',
        description: 'A bite from the black: 105% ATK plus a 20% ATK bleed for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.05 },
          { type: 'dot', pct: 0.2, turns: 1 },
        ],
      },
      {
        id: 'echo_pounce', name: 'Echo Pounce',
        icon: 'assets/icons/fc763.png',
        description: 'Pounce off the cave wall: 140% ATK, rebounding with 6% turn meter.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.4 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.06 },
        ],
      },
      {
        id: 'rumbling_howl', name: 'Rumbling Howl',
        icon: 'assets/icons/fc767.png',
        description: 'Shake the cavern: 90% ATK to a hex row with a 12% chance to STUN each for 1 turn.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'stun', chance: 0.12, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Night Eyes',
      icon: 'assets/icons/fc862.png',
      description: '+12% chance to dodge while below half HP.',
      hooks: {
        dodgeAdd(unit) {
          return unit.alive && unit.hp / unit.maxHp < 0.5 ? 0.12 : 0;
        },
      },
    },
    positional: POSITIONALS.toxicologist,
  },

  wolf_ashpelt: {
    id: 'wolf_ashpelt',
    element: 'fire',
    name: 'Wolf Ashpelt',
    title: 'Walked Out of the Wildfire',
    rarity: 1,
    stats: { hp: 770, atk: 117, def: 61, speed: 99 },
    tint: { body: '#5a4a4a', helm: '#8a5a3a', weapon: '#e8843a', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfashpeltidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cinder_snap', name: 'Cinder Snap',
        icon: 'assets/icons/fc981.png',
        description: 'A smoldering snap: 90% ATK plus a 28% ATK burn for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'dot', pct: 0.28, turns: 1 },
        ],
      },
      {
        id: 'burning_lope', name: 'Burning Lope',
        icon: 'assets/icons/fc744.png',
        description: 'A blazing run-through: 130% ATK, trailing sparks: +12% SPD for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.12, turns: 1 },
        ],
      },
      {
        id: 'wildfire_ring', name: 'Wildfire Ring',
        icon: 'assets/icons/fc1044.png',
        description: 'Circle them in flame: 50% ATK to ALL enemies plus an 36% ATK burn for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.5 },
          { type: 'dot', pct: 0.36, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Ashen Coat',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 15% less damage while poisoned or debuffed.',
      hooks: {
        damageTakenMult(unit) {
          return unit.statusEffects.some((fx) => fx.kind === 'dot' || fx.kind === 'debuff') ? 0.85 : 1;
        },
      },
    },
    positional: POSITIONALS.standard_bearer,
  },

  wolf_ridgeback: {
    id: 'wolf_ridgeback',
    element: 'fire',
    name: 'Wolf Ridgeback',
    title: 'The Hill Fights Back',
    rarity: 1,
    stats: { hp: 880, atk: 110, def: 74, speed: 91 },
    tint: { body: '#7a5a4a', helm: '#9a7a5a', weapon: '#c8c0b0', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfridgebackidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'ridge_charge', name: 'Ridge Charge',
        icon: 'assets/icons/fc1447.png',
        description: 'A downhill charge for 121% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.21 },
        ],
      },
      {
        id: 'bristle', name: 'Bristle',
        icon: 'assets/icons/fc854.png',
        description: 'Hackles up: +30% DEF and takes 10% less damage for 1 turn.',
        cooldown: 3, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.3, turns: 1 },
          { type: 'buff', stat: 'damageTaken', mult: 0.9, turns: 1 },
        ],
      },
      {
        id: 'backbreaker', name: 'Backbreaker',
        icon: 'assets/icons/fc767.png',
        description: 'Break them over the ridge: 170% ATK and -15% turn meter.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.7 },
          { type: 'turnMeter', amount: -0.15 },
        ],
      },
    ],
    passive: {
      name: 'Bristled Hide',
      icon: 'assets/icons/fc867.png',
      description: 'Takes 10% less damage while above 60% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.hp / unit.maxHp > 0.6 ? 0.9 : 1;
        },
      },
    },
    positional: POSITIONALS.vanguard_press,
  },

  wolf_fangknight: {
    id: 'wolf_fangknight',
    element: 'water',
    name: 'Wolf Fangknight',
    title: 'Sworn to the Frozen Gate',
    rarity: 2,
    stats: { hp: 1020, atk: 120, def: 94, speed: 90 },
    tint: { body: '#5a6a8a', helm: '#8a9ab8', weapon: '#d8d8e0', shield: '#7a8aa8', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolffangknightidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'sworn_fang', name: 'Sworn Fang',
        icon: 'assets/icons/fc1471.png',
        description: 'A disciplined bite: 97% ATK behind the shield: takes 7% less damage until next turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.97 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.93, turns: 1 },
        ],
      },
      {
        id: 'shield_rush', name: 'Shield Rush',
        icon: 'assets/icons/fc854.png',
        description: 'A shield-first rush: 132% ATK with a 20% chance to STUN for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.32 },
          { type: 'stun', chance: 0.2, turns: 1 },
        ],
      },
      {
        id: 'winter_vigil', name: 'Winter Vigil',
        icon: 'assets/icons/fc855.png',
        description: 'Stand the long watch: front-hex allies gain +10% DEF and 3% max HP regen for 2 turns.',
        cooldown: 5, targeting: 'front-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.1, turns: 2 },
          { type: 'hot', pct: 0.03, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Oath of Winter',
      icon: 'assets/icons/fc856.png',
      description: '+20% debuff resistance and takes 3% less damage.',
      hooks: {
        resistanceAdd: 0.20,
        damageTakenMult() { return 0.97; },
      },
    },
    positional: POSITIONALS.shield_wall,
  },

  wolf_galecaller: {
    id: 'wolf_galecaller',
    element: 'wind',
    name: 'Wolf Galecaller',
    title: 'The Storm Comes When Called',
    rarity: 2,
    stats: { hp: 860, atk: 133, def: 68, speed: 105 },
    tint: { body: '#6a8a9a', helm: '#8aaab8', weapon: '#e8e8f8', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfgalecalleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'gale_snap', name: 'Gale Snap',
        icon: 'assets/icons/fc1030.png',
        description: 'A wind-backed snap: 89% ATK that drains 5% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.89 },
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
      {
        id: 'shredding_wind', name: 'Shredding Wind',
        icon: 'assets/icons/fc724.png',
        description: 'A cutting gale through a hex row: 100% ATK and -8% ATK for 1 turn.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'debuff', stat: 'atk', mult: 0.92, turns: 1 },
        ],
      },
      {
        id: 'stormfront', name: 'Stormfront',
        icon: 'assets/icons/fc807.png',
        description: 'The front rolls in: 68% ATK to ALL enemies and -5% crit chance for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.68 },
          { type: 'debuff', stat: 'critChance', add: -0.05, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Static Ruff',
      icon: 'assets/icons/fc882.png',
      description: 'At turn start, static discharge drains 2% turn meter from ALL enemies.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          for (const e of enemies) {
            e.turnMeter = Math.max(0, e.turnMeter - CONFIG.TURN_METER_MAX * 0.02);
          }
          return null; // silent — small rolling drag
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  wolf_frostshaman: {
    id: 'wolf_frostshaman',
    element: 'water',
    name: 'Wolf Frostshaman',
    title: 'Speaks Winter Fluently',
    rarity: 2,
    stats: { hp: 880, atk: 126, def: 72, speed: 99 },
    tint: { body: '#4a6a8a', helm: '#7a9ab8', weapon: '#a8d8e8', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolffrostshamanidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rime_bolt', name: 'Rime Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'A rimed bolt: 86% ATK that mends the caster for 20.3% of ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.86 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.203 },
        ],
      },
      {
        id: 'glacial_mend', name: 'Glacial Mend',
        icon: 'assets/icons/fc1112.png',
        description: 'Pack a wound with clean ice: heals an ally 13% of his max HP and +8% SPD for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.13 },
          { type: 'buff', stat: 'speed', mult: 1.08, turns: 2 },
        ],
      },
      {
        id: 'whiteout', name: 'Whiteout',
        icon: 'assets/icons/fc1084.png',
        description: 'A blinding white: ALL enemies lose 15% SPD and 5% ATK for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'speed', mult: 0.85, turns: 1 },
          { type: 'debuff', stat: 'atk', mult: 0.95, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Spirit of the North',
      icon: 'assets/icons/fc854.png',
      description: '+25% debuff resistance.',
      hooks: { resistanceAdd: 0.25 },
    },
    positional: POSITIONALS.hexweaver,
  },

  wolf_moonblade: {
    id: 'wolf_moonblade',
    element: 'dark',
    name: 'Wolf Moonblade',
    title: 'Sharpened on the New Moon',
    rarity: 3,
    stats: { hp: 1050, atk: 184, def: 75, speed: 112 },
    tint: { body: '#2a2a3a', helm: '#4a4a6a', weapon: '#b8b0c8', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfmoonbladeidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'crescent_cut', name: 'Crescent Cut',
        icon: 'assets/icons/fc1587.png',
        description: 'A crescent stroke: 110% ATK — 15% more against debuffed prey.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.1, bonusVs: { kind: 'debuff', mult: 1.15 } },
        ],
      },
      {
        id: 'lunar_arc', name: 'Lunar Arc',
        icon: 'assets/icons/fc728.png',
        description: 'An arcing moonlit cut: 155% ATK, focusing: +12% crit chance for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.55 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.12, turns: 1 },
        ],
      },
      {
        id: 'eclipse_fang', name: 'Eclipse Fang',
        icon: 'assets/icons/fc734.png',
        description: 'The moon goes out: 200% ATK with a 35% chance to STUN for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.0 },
          { type: 'stun', chance: 0.35, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Dark of the Moon',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 25% extra damage to stunned enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.stat === 'stun') ? 1.25 : 1;
        },
      },
    },
    positional: POSITIONALS.marked_quarry,
  },

  wolf_packmother: {
    id: 'wolf_packmother',
    element: 'water',
    name: 'Wolf Packmother',
    title: 'The Den Holds',
    rarity: 2,
    stats: { hp: 950, atk: 118, def: 82, speed: 95 },
    tint: { body: '#8a7a6a', helm: '#a89a8a', weapon: '#c8b898', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfpackmotheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'matriarchs_snap', name: 'Matriarch\'s Snap',
        icon: 'assets/icons/fc1447.png',
        description: 'A corrective snap for 94% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.94 },
        ],
      },
      {
        id: 'nurture', name: 'Nurture',
        icon: 'assets/icons/fc1112.png',
        description: 'See to a packmate: heals 125% of ATK and +10% ATK for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.25 },
          { type: 'buff', stat: 'atk', mult: 1.1, turns: 2 },
        ],
      },
      {
        id: 'den_call', name: 'Den Call',
        icon: 'assets/icons/fc869.png',
        description: 'Call them home: ALL allies heal 55% of ATK and gain +10% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.55 },
          { type: 'buff', stat: 'def', mult: 1.1, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Mother\'s Vigilance',
      icon: 'assets/icons/fc1093.png',
      description: 'Whenever an ally is healed, that ally also gains +4% DEF for 1 turn.',
      hooks: {
        onAllyHealed(unit, healedUnit) {
          if (healedUnit === unit) return;
          healedUnit.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.04, turns: 1 });
        },
      },
    },
    positional: POSITIONALS.keystone,
  },

  wolf_dervish: {
    id: 'wolf_dervish',
    element: 'wind',
    name: 'Wolf Dervish',
    title: 'Spins Faster Than Regret',
    rarity: 2,
    stats: { hp: 870, atk: 134, def: 66, speed: 108 },
    tint: { body: '#9a8a6a', helm: '#b8a87a', weapon: '#d8d8e0', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfdervishidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'whirl_slash', name: 'Whirl Slash',
        icon: 'assets/icons/fc729.png',
        description: 'Two spinning cuts for 58% ATK each.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.58 },
          { type: 'damage', mult: 0.58 },
        ],
      },
      {
        id: 'cyclone_of_fangs', name: 'Cyclone of Fangs',
        icon: 'assets/icons/fc744.png',
        description: 'A spinning pass through a hex row: two hits of 60% ATK.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.6 },
          { type: 'damage', mult: 0.6 },
        ],
      },
      {
        id: 'thousand_cuts', name: 'Thousand Cuts',
        icon: 'assets/icons/fc723.png',
        description: 'A blur of steel: three cuts of 68% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.68 },
          { type: 'damage', mult: 0.68 },
          { type: 'damage', mult: 0.68 },
        ],
      },
    ],
    passive: {
      name: 'Momentum Spiral',
      icon: 'assets/icons/fc882.png',
      description: 'Gains +6% SPD and +6% ATK for 1 turn at each turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.06, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.06, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.pivot_step,
  },

  wolf_gnawbone: {
    id: 'wolf_gnawbone',
    element: 'fire',
    name: 'Wolf Gnawbone',
    title: 'Nothing Wasted',
    rarity: 2,
    stats: { hp: 940, atk: 136, def: 74, speed: 97 },
    tint: { body: '#6a5a5a', helm: '#8a7a6a', weapon: '#e8e0d8', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfgnawboneidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bone_crack', name: 'Bone Crack',
        icon: 'assets/icons/fc1476.png',
        description: 'A marrow-deep bite for 123% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.23 },
        ],
      },
      {
        id: 'marrow_feast', name: 'Marrow Feast',
        icon: 'assets/icons/fc734.png',
        description: 'Feed on the fight: 145% ATK, healing himself for 35% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.45 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.35 },
        ],
      },
      {
        id: 'splintering_bite', name: 'Splintering Bite',
        icon: 'assets/icons/fc1472.png',
        description: 'Splinter their guard: 165% ATK and -15% DEF for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.65 },
          { type: 'debuff', stat: 'def', mult: 0.85, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Bone Deep',
      icon: 'assets/icons/fc856.png',
      description: 'Old strength: deals 6% more and takes 4% less damage.',
      hooks: {
        damageDealtMult() { return 1.06; },
        damageTakenMult() { return 0.96; },
      },
    },
    positional: POSITIONALS.bloodied_fury,
  },

  wolf_jawlock: {
    id: 'wolf_jawlock',
    element: 'fire',
    name: 'Wolf Jawlock',
    title: 'Lets Go of Nothing',
    rarity: 2,
    stats: { hp: 980, atk: 128, def: 80, speed: 94 },
    tint: { body: '#7a4a3a', helm: '#9a6a4a', weapon: '#c8c0b0', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfjawlockidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'lock_jaw', name: 'Lock Jaw',
        icon: 'assets/icons/fc663.png',
        description: 'A clamping bite: 96% ATK with an 8% chance to STUN for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.96 },
          { type: 'stun', chance: 0.08, turns: 1 },
        ],
      },
      {
        id: 'vice_bite', name: 'Vice Bite',
        icon: 'assets/icons/fc762.png',
        description: 'The jaws close: 150% ATK with a 30% chance to STUN for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.5 },
          { type: 'stun', chance: 0.3, turns: 1 },
        ],
      },
      {
        id: 'hold_down', name: 'Hold Down',
        icon: 'assets/icons/fc767.png',
        description: 'Pin them flat: 120% ATK and -30% turn meter.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'turnMeter', amount: -0.3 },
        ],
      },
    ],
    passive: {
      name: 'Locked Jaws',
      icon: 'assets/icons/fc867.png',
      description: '+10% Stun chance on single-target attacks.',
      hooks: { stunAdd: 0.10 },
    },
    positional: POSITIONALS.shield_wall,
  },

  wolf_outrider: {
    id: 'wolf_outrider',
    element: 'wind',
    name: 'Wolf Outrider',
    title: 'Farther Ahead Than You Think',
    rarity: 2,
    stats: { hp: 890, atk: 131, def: 70, speed: 109 },
    tint: { body: '#5a7a5a', helm: '#7a9a6a', weapon: '#c8c0b0', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfoutrideridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'flank_slash', name: 'Flank Slash',
        icon: 'assets/icons/fc1447.png',
        description: 'A passing cut: 102% ATK, wheeling away: +4% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.02 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.04, turns: 1 },
        ],
      },
      {
        id: 'ride_by', name: 'Ride-By',
        icon: 'assets/icons/fc825.png',
        description: 'A slashing pass: 138% ATK, carrying 10% turn meter through.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.38 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.1 },
        ],
      },
      {
        id: 'encircle', name: 'Encircle',
        icon: 'assets/icons/fc807.png',
        description: 'Cut off every retreat: 62% ATK to ALL enemies and -6% SPD for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.62 },
          { type: 'debuff', stat: 'speed', mult: 0.94, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Open Steppe',
      icon: 'assets/icons/fc868.png',
      description: 'Gains +10% SPD and +10% crit damage for 1 turn at each turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.1, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.10, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  wolf_trapper: {
    id: 'wolf_trapper',
    element: 'water',
    name: 'Wolf Trapper',
    title: 'The Snow Hides Her Work',
    rarity: 2,
    stats: { hp: 900, atk: 129, def: 73, speed: 100 },
    tint: { body: '#8a8a7a', helm: '#a8a89a', weapon: '#a8a098', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolftrapperidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snare_toss', name: 'Snare Toss',
        icon: 'assets/icons/fc981.png',
        description: 'A weighted snare: 85% ATK and -12% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
          { type: 'debuff', stat: 'speed', mult: 0.88, turns: 1 },
        ],
      },
      {
        id: 'bear_trap', name: 'Bear Trap',
        icon: 'assets/icons/fc862.png',
        description: 'Set steel in the snow: the target takes +20% damage for 2 turns with a 25% chance to be STUNNED for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'damageTaken', mult: 1.2, turns: 2 },
          { type: 'stun', chance: 0.25, turns: 1 },
        ],
      },
      {
        id: 'spring_the_trap', name: 'Spring the Trap',
        icon: 'assets/icons/fc734.png',
        description: 'Collect the catch: 175% ATK — 45% more against exposed (vulnerability-marked) prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.75, bonusVs: { stat: 'damageTaken', mult: 1.45 } },
        ],
      },
    ],
    passive: {
      name: 'Patient Trapper',
      icon: 'assets/icons/fc863.png',
      description: '+20% debuff accuracy.',
      hooks: { accuracyAdd: 0.20 },
    },
    positional: POSITIONALS.hexweaver,
  },

  wolf_alphafang: {
    id: 'wolf_alphafang',
    element: 'fire',
    name: 'Wolf Alphafang',
    title: 'The Question Answers Itself',
    rarity: 3,
    stats: { hp: 1170, atk: 176, def: 90, speed: 104 },
    tint: { body: '#8a3a2a', helm: '#a85a3a', weapon: '#d8d8e0', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfalphafangidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'alpha_strike', name: 'Alpha Strike',
        icon: 'assets/icons/fc1447.png',
        description: 'A ruling blow: 112% ATK with a 10% chance to STUN for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.12 },
          { type: 'stun', chance: 0.1, turns: 1 },
        ],
      },
      {
        id: 'dominate', name: 'Dominate',
        icon: 'assets/icons/fc730.png',
        description: 'Put them in their place: 150% ATK, -15% ATK for 2 turns and -5% DEF for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.5 },
          { type: 'debuff', stat: 'atk', mult: 0.85, turns: 2 },
          { type: 'debuff', stat: 'def', mult: 0.95, turns: 1 },
        ],
      },
      {
        id: 'apex_roar', name: 'Apex Roar',
        icon: 'assets/icons/fc869.png',
        description: 'The roar of the apex: 80% ATK to ALL enemies with a 15% chance to STUN each for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'stun', chance: 0.15, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Apex',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 20% extra damage while any enemy is stunned.',
      hooks: {
        damageDealtMult(unit) {
          if (typeof Battle === 'undefined' || !Battle.active) return 1;
          return Battle.active.livingUnits(unit.enemyTeam()).some((e) =>
            e.statusEffects.some((fx) => fx.stat === 'stun')) ? 1.2 : 1;
        },
      },
    },
    positional: POSITIONALS.standard_bearer,
  },

  wolf_winterwitch: {
    id: 'wolf_winterwitch',
    element: 'water',
    name: 'Wolf Winterwitch',
    title: 'Winter Does Her Errands',
    rarity: 3,
    stats: { hp: 1080, atk: 181, def: 80, speed: 106 },
    tint: { body: '#3a4a6a', helm: '#7a9ad8', weapon: '#a8d8f8', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfwinterwitchidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'hoarfrost_bolt', name: 'Hoarfrost Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'A creeping frost: 92% ATK and -7% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.92 },
          { type: 'debuff', stat: 'speed', mult: 0.93, turns: 1 },
        ],
      },
      {
        id: 'flash_freeze', name: 'Flash Freeze',
        icon: 'assets/icons/fc1084.png',
        description: 'Ice takes them whole: 60% ATK with a 60% chance to STUN for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.6 },
          { type: 'stun', chance: 0.6, turns: 1 },
        ],
      },
      {
        id: 'glacier_tomb', name: 'Glacier Tomb',
        icon: 'assets/icons/fc1044.png',
        description: 'Entomb them in blue ice: 220% ATK — 50% more against slowed or hasted prey.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.2, bonusVs: { stat: 'speed', mult: 1.5 } },
        ],
      },
    ],
    passive: {
      name: 'Deep Winter',
      icon: 'assets/icons/fc856.png',
      description: 'At turn start, the fastest enemy is chilled: -5% SPD for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          enemies.sort((a, b) => b.effectiveStat('speed') - a.effectiveStat('speed'));
          enemies[0].addStatusEffect({ kind: 'debuff', stat: 'speed', mult: 0.95, turns: 1 });
          return null; // silent — small rolling chill
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  wolf_thunderjaw: {
    id: 'wolf_thunderjaw',
    element: 'wind',
    name: 'Wolf Thunderjaw',
    title: 'The Sky Barks Back',
    rarity: 3,
    stats: { hp: 1140, atk: 172, def: 86, speed: 107 },
    tint: { body: '#4a4a7a', helm: '#6a6aa8', weapon: '#e8e84a', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfthunderjawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'storm_bite', name: 'Storm Bite',
        icon: 'assets/icons/fc1030.png',
        description: 'Bite and thunderclap: 100% then 30% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'damage', mult: 0.3 },
        ],
      },
      {
        id: 'thunder_lunge', name: 'Thunder Lunge',
        icon: 'assets/icons/fc763.png',
        description: 'A deafening lunge: 170% ATK with a 25% chance to STUN for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.7 },
          { type: 'stun', chance: 0.25, turns: 1 },
        ],
      },
      {
        id: 'stormbreak_howl', name: 'Stormbreak Howl',
        icon: 'assets/icons/fc807.png',
        description: 'A howl that splits clouds: 70% ATK to ALL enemies and -12% turn meter.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.7 },
          { type: 'turnMeter', amount: -0.12 },
        ],
      },
    ],
    passive: {
      name: 'Charged Fur',
      icon: 'assets/icons/fc882.png',
      description: '+8% Stun chance on single-target attacks and +4% chance for an extra turn.',
      hooks: { stunAdd: 0.08, extraTurnAdd: 0.04 },
    },
    positional: POSITIONALS.standard_bearer,
  },

  wolf_direhound: {
    id: 'wolf_direhound',
    element: 'fire',
    name: 'Wolf Direhound',
    title: 'Bad News Travels on Four Legs',
    rarity: 3,
    stats: { hp: 1110, atk: 178, def: 84, speed: 103 },
    tint: { body: '#3a2a2a', helm: '#5a3a3a', weapon: '#e8632a', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfdirehoundidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'hellhound_bite', name: 'Hellhound Bite',
        icon: 'assets/icons/fc981.png',
        description: 'A smoldering bite: 108% ATK plus an 13% ATK burn for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.08 },
          { type: 'dot', pct: 0.13, turns: 1 },
        ],
      },
      {
        id: 'infernal_rush', name: 'Infernal Rush',
        icon: 'assets/icons/fc744.png',
        description: 'A burning charge: 155% ATK plus a 36% ATK burn for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.55 },
          { type: 'dot', pct: 0.36, turns: 1 },
        ],
      },
      {
        id: 'immolation_howl', name: 'Immolation Howl',
        icon: 'assets/icons/fc1044.png',
        description: 'A howl of open flame: 65% ATK to ALL enemies plus a 26% ATK burn for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.65 },
          { type: 'dot', pct: 0.26, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Hellfire Pelt',
      icon: 'assets/icons/fc1093.png',
      description: '+25% DoT damage and +5% debuff accuracy.',
      hooks: { dotBoostAdd: 0.25, accuracyAdd: 0.05 },
    },
    positional: POSITIONALS.toxicologist,
  },

  wolf_glacierguard: {
    id: 'wolf_glacierguard',
    element: 'water',
    name: 'Wolf Glacierguard',
    title: 'The Ice Holds Because He Does',
    rarity: 3,
    stats: { hp: 1300, atk: 158, def: 102, speed: 86 },
    tint: { body: '#6a8aa8', helm: '#8aaac8', weapon: '#c8e8f8', shield: '#a8c8e8', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfglacierguardidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'ice_wall_bash', name: 'Ice Wall Bash',
        icon: 'assets/icons/fc854.png',
        description: 'A wall of ice and shoulder: 98% ATK, hardening: +12% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.98 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.12, turns: 1 },
        ],
      },
      {
        id: 'frozen_bulwark', name: 'Frozen Bulwark',
        icon: 'assets/icons/fc855.png',
        description: 'Raise the glacier: front-hex allies take 15% less damage and gain +10% DEF for 2 turns.',
        cooldown: 5, targeting: 'front-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.85, turns: 2 },
          { type: 'buff', stat: 'def', mult: 1.1, turns: 2 },
        ],
      },
      {
        id: 'permafrost_slam', name: 'Permafrost Slam',
        icon: 'assets/icons/fc1476.png',
        description: 'Slam the ice shelf into a hex row: 105% ATK with an 18% chance to STUN each for 1 turn.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.05 },
          { type: 'stun', chance: 0.18, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Glacial Mass',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 18% less damage while above 40% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.hp / unit.maxHp > 0.4 ? 0.82 : 1;
        },
      },
    },
    positional: POSITIONALS.iron_wake,
  },

  wolf_dawnmother: {
    id: 'wolf_dawnmother',
    element: 'light',
    name: 'Wolf Dawnmother',
    title: 'First Light of the Long Night',
    rarity: 3,
    stats: { hp: 1190, atk: 164, def: 88, speed: 101 },
    tint: { body: '#e8e0c8', helm: '#f8e8a8', weapon: '#f8d86a', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfdawnmotheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'dawnlight_nip', name: 'Dawnlight Nip',
        icon: 'assets/icons/fc1447.png',
        description: 'A gleaming nip: 90% ATK, catching the light: +4% crit chance for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.04, turns: 1 },
        ],
      },
      {
        id: 'morning_mend', name: 'Morning Mend',
        icon: 'assets/icons/fc1112.png',
        description: 'Sunrise in a wound: heals an ally 12% of her max HP and grants 10% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.12 },
          { type: 'turnMeter', amount: 0.1 },
        ],
      },
      {
        id: 'break_of_day', name: 'Break of Day',
        icon: 'assets/icons/fc855.png',
        description: 'The night ends: ALL allies heal 131.2% of ATK, are cleansed, and gain 5% turn meter.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.312 },
          { type: 'cleanse' },
          { type: 'turnMeter', amount: 0.05 },
        ],
      },
    ],
    passive: {
      name: 'Light of Dawn',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, the most afflicted ally sheds one debuff and heals 2% of her max HP.',
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
          const healed = worst.heal(Math.round(unit.maxHp * 0.02), unit);
          return {
            label: 'Light of Dawn',
            message: `${unit.name}'s dawnlight eases ${worst.name}.`,
            floats: [{ target: worst, text: 'CLEANSE', color: '#f8d86a' }],
          };
        },
      },
    },
    positional: POSITIONALS.pivot_step,
  },

  // ---- Boar cohort (the Savanna) ------------------------------------------
  // Procedural placeholder art renders until real idle sheets land at the
  // conventional flat paths (assets/heroes/boar<role>idle.png).

  wolf_gallowsjaw: {
    id: 'wolf_gallowsjaw',
    element: 'dark',
    name: 'Wolf Gallowsjaw',
    title: 'The sentence is the swing.',
    rarity: 3,
    stats: { hp: 1116, atk: 170, def: 86, speed: 100 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfgallowsjawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_gallowsjaw_edge', name: 'Gallowsjaw\'s Edge',
        icon: 'assets/icons/fc734.png',
        description: 'Two dark cuts: 81% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.81 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'wolf_gallowsjaw_sentence', name: 'Gallowsjaw\'s Sentence',
        icon: 'assets/icons/fc730.png',
        description: 'Pass judgment: 161% ATK and the target takes +12% damage for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.61 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.12, turns: 1 },
        ],
      },
      {
        id: 'wolf_gallowsjaw_end', name: 'Gallowsjaw\'s End',
        icon: 'assets/icons/fc728.png',
        description: 'Carry it out: 237% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.37 },
        ],
      },
    ],
    passive: {
      name: 'Gallowsjaw\'s Due',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 18% extra damage to enemies below 48% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.48 ? 1.18 : 1;
        },
      },
    },
    positional: POSITIONALS.focal_point,
  },

  wolf_cursehowl: {
    id: 'wolf_cursehowl',
    element: 'dark',
    name: 'Wolf Cursehowl',
    title: 'Carries every curse worth having.',
    rarity: 3,
    stats: { hp: 1125, atk: 175, def: 89, speed: 102 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfcursehowlidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_cursehowl_lash', name: 'Cursehowl Lash',
        icon: 'assets/icons/fc1052.png',
        description: 'Two cursed lashes: 82% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.82 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'wolf_cursehowl_bane', name: 'Cursehowl Bane',
        icon: 'assets/icons/fc1084.png',
        description: 'A layered curse: 162% ATK, -12% ATK and -8% DEF for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.62 },
          { type: 'debuff', stat: 'atk', mult: 0.88, turns: 2 },
          { type: 'debuff', stat: 'def', mult: 0.92, turns: 2 },
        ],
      },
      {
        id: 'wolf_cursehowl_pall', name: 'Cursehowl Pall',
        icon: 'assets/icons/fc1050.png',
        description: 'A pall over everything: 116% ATK to ALL enemies and -4% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.16 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Cursehowl Craft',
      icon: 'assets/icons/fc1093.png',
      description: 'Curses honed in the dark.',
      hooks: { accuracyAdd: 0.06, resistanceAdd: 0.18 },
    },
    positional: POSITIONALS.bloodied_fury,
  },

  wolf_bloodmuzzle: {
    id: 'wolf_bloodmuzzle',
    element: 'dark',
    name: 'Wolf Bloodmuzzle',
    title: 'Your vigor, redistributed.',
    rarity: 3,
    stats: { hp: 1134, atk: 180, def: 92, speed: 104 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfbloodmuzzleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_bloodmuzzle_sip', name: 'Bloodmuzzle\'s Sip',
        icon: 'assets/icons/fc1444.png',
        description: 'Two draining touches: 83% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.83 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'wolf_bloodmuzzle_feast', name: 'Bloodmuzzle\'s Feast',
        icon: 'assets/icons/fc825.png',
        description: 'Drink deep: 163% ATK, healing himself for 38% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.63 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.38 },
        ],
      },
      {
        id: 'wolf_bloodmuzzle_toll', name: 'Bloodmuzzle\'s Toll',
        icon: 'assets/icons/fc1112.png',
        description: 'Tax the living: 107% ATK to ALL enemies while he mends 10% of his max HP.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.07 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.1 },
        ],
      },
    ],
    passive: {
      name: 'Bloodmuzzle Hunger',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, siphons 2.2% of his max HP from a random enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const amount = Math.max(1, Math.round(unit.maxHp * 0.022));
          Abilities.strike(unit, target, amount);
          unit.heal(amount);
          return null; // silent — small rolling hunger
        },
      },
    },
    positional: POSITIONALS.snipers_nest,
  },

  wolf_duskprowler: {
    id: 'wolf_duskprowler',
    element: 'dark',
    name: 'Wolf Duskprowler',
    title: 'The dark keeps its edge honed.',
    rarity: 3,
    stats: { hp: 1143, atk: 185, def: 95, speed: 106 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfduskprowleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_duskprowler_flick', name: 'Duskprowler Flick',
        icon: 'assets/icons/fc1447.png',
        description: 'Two flickering cuts: 84% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.84 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'wolf_duskprowler_waltz', name: 'Duskprowler Waltz',
        icon: 'assets/icons/fc1587.png',
        description: 'A step through shadow: 164% ATK and +10% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.64 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.1, turns: 1 },
        ],
      },
      {
        id: 'wolf_duskprowler_finale', name: 'Duskprowler Finale',
        icon: 'assets/icons/fc723.png',
        description: 'The last figure: 228% ATK — 25% more against debuffed prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.28, bonusVs: { kind: 'debuff', mult: 1.25 } },
        ],
      },
    ],
    passive: {
      name: 'Duskprowler Poise',
      icon: 'assets/icons/fc862.png',
      description: 'A blade kept perfectly balanced (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.05, turns: 2 });
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.05, turns: 2 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.keystone,
  },

  wolf_direomen: {
    id: 'wolf_direomen',
    element: 'dark',
    name: 'Wolf Direomen',
    title: 'Fear arrives before the blow.',
    rarity: 3,
    stats: { hp: 1152, atk: 160, def: 98, speed: 108 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfdireomenidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_direomen_knell', name: 'Direomen Knell',
        icon: 'assets/icons/fc1003.png',
        description: 'Two tolling blows: 85% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'wolf_direomen_omen', name: 'Direomen Omen',
        icon: 'assets/icons/fc1084.png',
        description: 'Name their doom: 145% ATK and -13% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.45 },
          { type: 'debuff', stat: 'atk', mult: 0.87, turns: 2 },
        ],
      },
      {
        id: 'wolf_direomen_chorus', name: 'Direomen Chorus',
        icon: 'assets/icons/fc807.png',
        description: 'The dread chorus: 114% ATK to ALL enemies and -4% crit chance for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.14 },
          { type: 'debuff', stat: 'critChance', add: -0.04, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Direomen Presence',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, dread spreads: ALL enemies lose 1.5% turn meter.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const e of battle.livingUnits(unit.enemyTeam())) {
            e.turnMeter = Math.max(0, e.turnMeter - CONFIG.TURN_METER_MAX * 0.015);
          }
          return null; // silent — small rolling dread
        },
      },
    },
    positional: POSITIONALS.reckless_charge,
  },

  wolf_lightmuzzle: {
    id: 'wolf_lightmuzzle',
    element: 'light',
    name: 'Wolf Lightmuzzle',
    title: 'Every wound answers to the light.',
    rarity: 3,
    stats: { hp: 1161, atk: 165, def: 101, speed: 110 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolflightmuzzleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_lightmuzzle_rebuke', name: 'Lightmuzzle\'s Rebuke',
        icon: 'assets/icons/fc1471.png',
        description: 'Two shining raps: 86% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.86 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'wolf_lightmuzzle_grace', name: 'Lightmuzzle\'s Grace',
        icon: 'assets/icons/fc1112.png',
        description: 'Pour in the light: heals an ally 87.5% of ATK and cleanses their debuffs.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.875 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'wolf_lightmuzzle_communion', name: 'Lightmuzzle\'s Communion',
        icon: 'assets/icons/fc800.png',
        description: 'Shared light: ALL allies heal 57.3% of ATK plus 1.2% of max HP regen for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.573 },
          { type: 'hot', pct: 0.012, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Lightmuzzle Devotion',
      icon: 'assets/icons/fc1093.png',
      description: 'Healing hands, steadied by faith.',
      hooks: { healBoostAdd: 0.08, resistanceAdd: 0.08 },
    },
    positional: POSITIONALS.field_medic,
  },

  wolf_aegisfur: {
    id: 'wolf_aegisfur',
    element: 'light',
    name: 'Wolf Aegisfur',
    title: 'A shield the sun would envy.',
    rarity: 3,
    stats: { hp: 1170, atk: 170, def: 80, speed: 112 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfaegisfuridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_aegisfur_check', name: 'Aegisfur\'s Check',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield checks: 87% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.87 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'wolf_aegisfur_ward', name: 'Aegisfur\'s Ward',
        icon: 'assets/icons/fc855.png',
        description: 'Raise the aegis over an ally: they take 10% less damage for 2 turns and heal 86% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.89, turns: 2 },
          { type: 'heal', mult: 0.86 },
        ],
      },
      {
        id: 'wolf_aegisfur_vigil', name: 'Aegisfur\'s Vigil',
        icon: 'assets/icons/fc856.png',
        description: 'The unbroken vigil: ALL allies gain +11% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.11, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Aegisfur Constancy',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, shields the most wounded ally: takes 8% less damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.91, turns: 1 });
          return null; // silent — small rolling shelter
        },
      },
    },
    positional: POSITIONALS.lifeline,
  },

  wolf_dawnfang: {
    id: 'wolf_dawnfang',
    element: 'light',
    name: 'Wolf Dawnfang',
    title: 'Morning, sharpened.',
    rarity: 3,
    stats: { hp: 1179, atk: 175, def: 83, speed: 96 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfdawnfangidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_dawnfang_stroke', name: 'Dawnfang Stroke',
        icon: 'assets/icons/fc1587.png',
        description: 'Two dawn-lit strokes: 88% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.88 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'wolf_dawnfang_flare', name: 'Dawnfang Flare',
        icon: 'assets/icons/fc1447.png',
        description: 'A flare of morning: 168% ATK, and the light mends 9% of max HP.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.68 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.09 },
        ],
      },
      {
        id: 'wolf_dawnfang_zenith', name: 'Dawnfang Zenith',
        icon: 'assets/icons/fc730.png',
        description: 'High noon: 231% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.31 },
        ],
      },
    ],
    passive: {
      name: 'Dawnfang Resolve',
      icon: 'assets/icons/fc1003.png',
      description: 'Heals 2% max HP at turn start while below 75% HP.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp >= 0.75) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.02));
          if (healed <= 0) return null;
          return {
            label: 'Dawnfang Resolve',
            message: `${unit.name}'s light knits ${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#f8d86a' }],
          };
        },
      },
    },
    positional: POSITIONALS.thornguard,
  },

  wolf_sunhowl: {
    id: 'wolf_sunhowl',
    element: 'light',
    name: 'Wolf Sunhowl',
    title: 'Good news travels armed.',
    rarity: 3,
    stats: { hp: 1188, atk: 180, def: 86, speed: 98 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfsunhowlidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_sunhowl_call', name: 'Sunhowl\'s Call',
        icon: 'assets/icons/fc868.png',
        description: 'Two ringing notes: 89% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.89 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'wolf_sunhowl_proclamation', name: 'Sunhowl\'s Proclamation',
        icon: 'assets/icons/fc869.png',
        description: 'Lift an ally: +14% ATK for 2 turns and 10% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.14, turns: 2 },
          { type: 'turnMeter', amount: 0.1 },
        ],
      },
      {
        id: 'wolf_sunhowl_triumph', name: 'Sunhowl\'s Triumph',
        icon: 'assets/icons/fc882.png',
        description: 'Declare the day won: ALL allies gain +5% SPD for 2 turns and 4% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.05, turns: 2 },
          { type: 'turnMeter', amount: 0.04 },
        ],
      },
    ],
    passive: {
      name: 'Sunhowl Anthem',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start: ALL allies gain 2% turn meter.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) { if (a !== unit) a.turnMeter = Math.min(CONFIG.TURN_METER_MAX, a.turnMeter + CONFIG.TURN_METER_MAX * 0.02); }
          return null; // silent — small rolling anthem
        },
      },
    },
    positional: POSITIONALS.safe_distance,
  },

  wolf_oathkeeper: {
    id: 'wolf_oathkeeper',
    element: 'light',
    name: 'Wolf Oathkeeper',
    title: 'Verdicts delivered in person.',
    rarity: 3,
    stats: { hp: 1197, atk: 185, def: 89, speed: 100 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfoathkeeperidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_oathkeeper_gavel', name: 'Oathkeeper\'s Gavel',
        icon: 'assets/icons/fc1461.png',
        description: 'Two measured blows: 90% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'wolf_oathkeeper_inquest', name: 'Oathkeeper\'s Inquest',
        icon: 'assets/icons/fc862.png',
        description: 'Open the case: 160% ATK and the target takes +18% damage for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.6 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.18, turns: 2 },
        ],
      },
      {
        id: 'wolf_oathkeeper_verdict', name: 'Oathkeeper\'s Verdict',
        icon: 'assets/icons/fc744.png',
        description: 'Deliver the verdict: 233% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.33 },
        ],
      },
    ],
    passive: {
      name: 'Oathkeeper Justice',
      icon: 'assets/icons/fc863.png',
      description: 'Justice sees clearly: deals 30% extra damage to enemies suffering damage over time.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'dot') ? 1.3 : 1;
        },
      },
    },
    positional: POSITIONALS.warding_circle,
  },

  wolf_bladefang: {
    id: 'wolf_bladefang',
    element: 'fire',
    name: 'Wolf Bladefang',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1454, atk: 212, def: 114, speed: 108 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfbladefangidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_bladefang_strike', name: 'Bladefang\'s Strike',
        icon: 'assets/icons/fc730.png',
        description: 'Two champion blows: 99% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.99 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'wolf_bladefang_onslaught', name: 'Bladefang\'s Onslaught',
        icon: 'assets/icons/fc1447.png',
        description: 'Press the advantage: 182% ATK, then +11% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.82 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.11, turns: 2 },
        ],
      },
      {
        id: 'wolf_bladefang_supremacy', name: 'Bladefang\'s Supremacy',
        icon: 'assets/icons/fc767.png',
        description: 'Settle it: 233% ATK and -10% DEF for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.33 },
          { type: 'debuff', stat: 'def', mult: 0.9, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Bladefang Supremacy',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 4% more and takes 7% less damage.',
      hooks: {
        damageDealtMult() { return 1.04; },
        damageTakenMult() { return 0.93; },
      },
    },
    positional: POSITIONALS.bloodied_fury,
  },

  wolf_runehowl: {
    id: 'wolf_runehowl',
    element: 'wind',
    name: 'Wolf Runehowl',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1466, atk: 218, def: 118, speed: 111 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfrunehowlidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_runehowl_bolt', name: 'Runehowl\'s Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'Twin arcane bolts: 87.5% then 37.6% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.875 },
          { type: 'damage', mult: 0.376 },
        ],
      },
      {
        id: 'wolf_runehowl_torrent', name: 'Runehowl\'s Torrent',
        icon: 'assets/icons/fc1084.png',
        description: 'A torrent of power: 107.6% ATK to ALL enemies and -4% SPD for 2 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.076 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 2 },
        ],
      },
      {
        id: 'wolf_runehowl_cataclysm', name: 'Runehowl\'s Cataclysm',
        icon: 'assets/icons/fc1044.png',
        description: 'The big one: 121.6% ATK to ALL enemies and -8% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.216 },
          { type: 'debuff', stat: 'atk', mult: 0.92, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Runehowl Resonance',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, arcane bleed sears ALL enemies for 1.2% of this hero\'s max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.maxHp * 0.012));
          for (const e of enemies) Abilities.strike(unit, e, amount);
          return null; // silent — small rolling resonance
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  wolf_shieldmane: {
    id: 'wolf_shieldmane',
    element: 'water',
    name: 'Wolf Shieldmane',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1478, atk: 224, def: 122, speed: 114 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfshieldmaneidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_shieldmane_bash', name: 'Shieldmane\'s Bash',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield strikes: 71% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.71 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'wolf_shieldmane_bulwark', name: 'Shieldmane\'s Bulwark',
        icon: 'assets/icons/fc855.png',
        description: 'Anchor the line: ALL allies gain +13% DEF for 2 turns and take 4% less damage for 1 turn.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.13, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.96, turns: 1 },
        ],
      },
      {
        id: 'wolf_shieldmane_stand', name: 'Shieldmane\'s Stand',
        icon: 'assets/icons/fc856.png',
        description: 'Refuse to fall: takes 30% less damage for 2 turns and heals 12% max HP.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.7, turns: 2 },
          { type: 'healHpPct', pct: 0.12 },
        ],
      },
    ],
    passive: {
      name: 'Shieldmane Aegis',
      icon: 'assets/icons/fc868.png',
      description: 'Takes 13% less damage while above 65% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.hp / unit.maxHp > 0.65 ? 0.87 : 1;
        },
      },
    },
    positional: POSITIONALS.shield_wall,
  },

  wolf_farhowl: {
    id: 'wolf_farhowl',
    element: 'fire',
    name: 'Wolf Farhowl',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1490, atk: 230, def: 126, speed: 100 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolffarhowlidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_farhowl_shot', name: 'Farhowl\'s Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'Two placed shots: 72% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.72 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'wolf_farhowl_deadeye', name: 'Farhowl\'s Deadeye',
        icon: 'assets/icons/fc1516.png',
        description: 'The perfect line: 195% ATK and drains 11% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.95 },
          { type: 'turnMeter', amount: -0.11 },
        ],
      },
      {
        id: 'wolf_farhowl_barrage', name: 'Farhowl\'s Barrage',
        icon: 'assets/icons/fc807.png',
        description: 'Fill the sky: 121% ATK to ALL enemies.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.21 },
          { type: 'turnMeter', amount: -0.01 },
        ],
      },
    ],
    passive: {
      name: 'Farhowl Focus',
      icon: 'assets/icons/fc862.png',
      description: 'The shot is already lined up (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.13, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.marked_quarry,
  },

  wolf_mistmane: {
    id: 'wolf_mistmane',
    element: 'wind',
    name: 'Wolf Mistmane',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1502, atk: 200, def: 104, speed: 103 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfmistmaneidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_mistmane_touch', name: 'Mistmane\'s Touch',
        icon: 'assets/icons/fc1112.png',
        description: 'Two chastening touches: 73% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.73 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'wolf_mistmane_blessing', name: 'Mistmane\'s Blessing',
        icon: 'assets/icons/fc800.png',
        description: 'Mend an ally: 16% of max HP plus 2.3% regen for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.16 },
          { type: 'hot', pct: 0.023, turns: 2 },
        ],
      },
      {
        id: 'wolf_mistmane_renewal', name: 'Mistmane\'s Renewal',
        icon: 'assets/icons/fc869.png',
        description: 'The circle holds: ALL allies heal 46% of ATK, are cleansed, and gain +5% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.46 },
          { type: 'cleanse' },
          { type: 'buff', stat: 'def', mult: 1.05, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Mistmane Communion',
      icon: 'assets/icons/fc1003.png',
      description: 'Healing woven a little stronger.',
      hooks: { healBoostAdd: 0.23 },
    },
    positional: POSITIONALS.warding_circle,
  },

  wolf_nullmaw: {
    id: 'wolf_nullmaw',
    element: 'dark',
    name: 'Wolf Nullmaw',
    title: 'Champion of the Dark',
    rarity: 4,
    stats: { hp: 1514, atk: 206, def: 108, speed: 106 },
    tint: { body: '#241f33', helm: '#3d3350', weapon: '#9a7ad0', skin: '#8a82a0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfnullmawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_nullmaw_grasp', name: 'Nullmaw\'s Grasp',
        icon: 'assets/icons/fc1444.png',
        description: 'Two grasping shadows: 74% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.74 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'wolf_nullmaw_devour', name: 'Nullmaw\'s Devour',
        icon: 'assets/icons/fc825.png',
        description: 'Feed the void: 177% ATK, healing this hero for 34% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.77 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.34 },
        ],
      },
      {
        id: 'wolf_nullmaw_oblivion', name: 'Nullmaw\'s Oblivion',
        icon: 'assets/icons/fc734.png',
        description: 'Unmake them: 248% ATK and the target takes +20% damage for 1 turn.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.48 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.2, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Nullmaw Thirst',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, drains 2.1% of max HP from the weakest enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          enemies.sort((a, b) => a.hp - b.hp);
          const amount = Math.max(1, Math.round(unit.maxHp * 0.021));
          Abilities.strike(unit, enemies[0], amount);
          unit.heal(amount);
          return null; // silent — small rolling thirst
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  wolf_glorymane: {
    id: 'wolf_glorymane',
    element: 'light',
    name: 'Wolf Glorymane',
    title: 'Champion of the Dawn',
    rarity: 4,
    stats: { hp: 1526, atk: 212, def: 112, speed: 109 },
    tint: { body: '#e0d3a8', helm: '#f5e9c0', weapon: '#ffdf70', skin: '#f0e4c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfglorymaneidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_glorymane_radiance', name: 'Glorymane\'s Radiance',
        icon: 'assets/icons/fc1471.png',
        description: 'Two radiant strikes: 75% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'wolf_glorymane_benediction', name: 'Glorymane\'s Benediction',
        icon: 'assets/icons/fc1112.png',
        description: 'Bless an ally: heals 18% of max HP and grants 12% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.18 },
          { type: 'turnMeter', amount: 0.12 },
        ],
      },
      {
        id: 'wolf_glorymane_ascension', name: 'Glorymane\'s Ascension',
        icon: 'assets/icons/fc855.png',
        description: 'Lift the whole line: ALL allies heal 52% of ATK and gain +5% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.52 },
          { type: 'buff', stat: 'atk', mult: 1.05, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Glorymane Benevolence',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, ALL allies heal 0.5% of this hero\'s max HP and gain a small atk blessing for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) {
            a.heal(Math.round(unit.maxHp * 0.005), unit);
            a.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.03, turns: 1 });
          }
          return null; // silent — small rolling benevolence
        },
      },
    },
    positional: POSITIONALS.keystone,
  },

});
