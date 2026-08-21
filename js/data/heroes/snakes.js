// Snake heroes (42). Registered into the shared
// HEROES table declared in js/data/heroes.js.

Object.assign(HEROES, {

  snake_warrior: {
    id: 'snake_warrior',
    element: 'water',
    name: 'Snake Warrior',
    title: 'Marsh Blade',
    rarity: 1,
    stats: { hp: 870, atk: 112, def: 68, speed: 96 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakewarrioridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'fang_slash', name: 'Fang Slash',
        icon: 'assets/icons/fc726.png',
        description: 'Slash for 95% ATK with a lick of venom: 30% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'dot', pct: 0.3, turns: 1 },
        ],
      },
      {
        id: 'venom_cut', name: 'Venom Cut',
        icon: 'assets/icons/fc722.png',
        description: 'Deals 120% ATK and poisons for 60% ATK per turn (2 turns).',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'dot', pct: 0.6, turns: 2 },
        ],
      },
      {
        id: 'coil_crush', name: 'Coil Crush',
        icon: 'assets/icons/fc748.png',
        description: 'Constrict and crush: 170% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.7 }],
      },
    ],
    passive: {
      name: 'Scaled Hide',
      icon: 'assets/icons/fc1112.png',
      description: 'Thrives in filth: recovers 5% max HP at turn start while poisoned or debuffed.',
      hooks: {
        onTurnStart(unit) {
          const afflicted = unit.statusEffects.some(
            (fx) => fx.kind === 'debuff' || fx.kind === 'dot');
          if (!afflicted) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.05));
          if (healed <= 0) return null;
          return {
            label: 'Scaled Hide',
            message: `${unit.name}'s scales knit ${healed} HP back.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#7ae87a' }],
          };
        },
      },
    },
    positional: POSITIONALS.rallying_banner,
  },

  snake_archer: {
    id: 'snake_archer',
    element: 'wind',
    name: 'Snake Archer',
    title: 'Reed Stalker',
    rarity: 1,
    stats: { hp: 720, atk: 118, def: 55, speed: 102 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakearcheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'reed_shot', name: 'Reed Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'A reed arrow for 98% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.98 },
        ],
      },
      {
        id: 'venom_arrow', name: 'Venom Arrow',
        icon: 'assets/icons/fc1516.png',
        description: 'Deals 115% ATK and poisons for 60% ATK per turn (2 turns).',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.15 },
          { type: 'dot', pct: 0.6, turns: 2 },
        ],
      },
      {
        id: 'arrow_hiss', name: 'Arrow Hiss',
        icon: 'assets/icons/fc807.png',
        description: 'A venom-tipped volley: 60% ATK to ALL enemies plus a 20% ATK poison for 1 turn.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.6 },
          { type: 'dot', pct: 0.2, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Slither Step',
      icon: 'assets/icons/fc882.png',
      description: 'Gains +6% SPD for 2 turns at each turn start (briefly stacks).',
      hooks: {
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.06, turns: 2 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.toxicologist,
  },

  snake_assassin: {
    id: 'snake_assassin',
    element: 'dark',
    name: 'Snake Assassin',
    title: 'Silent Fang',
    rarity: 3,
    stats: { hp: 1020, atk: 181, def: 70, speed: 116, critChance: 0.25 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakeassassinidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'viper_stab', name: 'Viper Stab',
        icon: 'assets/icons/fc1444.png',
        description: 'A lightning stab: 100% ATK plus 40% ATK venom for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'dot', pct: 0.4, turns: 1 },
        ],
      },
      {
        id: 'envenom', name: 'Envenom',
        icon: 'assets/icons/fc825.png',
        description: 'Deals 130% ATK and poisons for 80% ATK per turn (3 turns).',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
          { type: 'dot', pct: 0.8, turns: 3 },
        ],
      },
      {
        id: 'fang_finish', name: 'Fang Finish',
        icon: 'assets/icons/fc734.png',
        description: 'An executioner\'s bite: 160% ATK — 60% more against poisoned prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.6, bonusVs: { kind: 'dot', mult: 1.6 } },
        ],
      },
    ],
    passive: {
      name: 'Taste for Venom',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 20% extra damage to poisoned or debuffed enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects && target.statusEffects.some(
            (fx) => fx.kind === 'debuff' || fx.kind === 'dot') ? 1.2 : 1;
        },
      },
    },
    positional: POSITIONALS.toxicologist,
  },

  snake_mage: {
    id: 'snake_mage',
    element: 'fire',
    name: 'Snake Mage',
    title: 'Marsh-Light Caller',
    rarity: 2,
    stats: { hp: 830, atk: 142, def: 60, speed: 104 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakemageidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'venom_bolt', name: 'Venom Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'A gob of venom: 80% ATK plus an 36% ATK poison for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'dot', pct: 0.36, turns: 2 },
        ],
      },
      {
        id: 'corrosive_blast', name: 'Corrosive Blast',
        icon: 'assets/icons/fc1066.png',
        description: 'Deals 120% ATK and corrodes armor: -15% DEF for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'debuff', stat: 'def', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'toxic_nova', name: 'Toxic Nova',
        icon: 'assets/icons/fc1067.png',
        description: 'Deals 75% ATK to ALL enemies and poisons for 50% ATK per turn (2 turns).',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'dot', pct: 0.5, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Hexing Focus',
      icon: 'assets/icons/fc987.png',
      description: '+15% debuff accuracy.',
      hooks: { accuracyAdd: 0.15 },
    },
    positional: POSITIONALS.press_the_flank,
  },

  snake_alchemist: {
    id: 'snake_alchemist',
    element: 'water',
    name: 'Snake Alchemist',
    title: 'Venom Chemist',
    rarity: 2,
    stats: { hp: 900, atk: 125, def: 72, speed: 98 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakealchemistidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'acid_splash', name: 'Acid Splash',
        icon: 'assets/icons/fc121.png',
        description: 'Acid for 80% ATK that eats armor: -10% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'debuff', stat: 'def', mult: 0.9, turns: 1 },
        ],
      },
      {
        id: 'caustic_brew', name: 'Caustic Brew',
        icon: 'assets/icons/fc123.png',
        description: 'Deals 110% ATK and marks the target: +15% damage taken for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.1 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.15, turns: 2 },
        ],
      },
      {
        id: 'mutagen', name: 'Mutagen',
        icon: 'assets/icons/fc122.png',
        description: 'Cleanse an ally and grant +25% ATK for 2 turns.',
        cooldown: 6, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'cleanse' },
          { type: 'buff', stat: 'atk', mult: 1.25, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Iron Gut',
      icon: 'assets/icons/fc856.png',
      description: '+20% debuff resistance.',
      hooks: { resistanceAdd: 0.20 },
    },
    positional: POSITIONALS.shield_wall,
  },

  snake_shaman: {
    id: 'snake_shaman',
    element: 'wind',
    name: 'Snake Shaman',
    title: 'Mire Whisperer',
    rarity: 3,
    stats: { hp: 1120, atk: 155, def: 82, speed: 102 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakeshamanidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'spirit_fang', name: 'Spirit Fang',
        icon: 'assets/icons/fc970.png',
        description: 'A spectral bite for 85% ATK; spirits knit the Shaman for 4.3% max HP over 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
        ],
        selfEffects: [
          { type: 'hot', pct: 0.043, turns: 2 },
        ],
      },
      {
        id: 'swamp_blessing', name: 'Swamp Blessing',
        icon: 'assets/icons/fc1073.png',
        description: 'Swamp mud mends an ally for 10% of the Shaman\'s max HP and armors them: +15% DEF for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.10 },
          { type: 'buff', stat: 'def', mult: 1.15, turns: 2 },
        ],
      },
      {
        id: 'miasma', name: 'Miasma',
        icon: 'assets/icons/fc1068.png',
        description: 'Deals 50% ATK to ALL enemies and poisons for 70% ATK per turn (3 turns).',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.5 },
          { type: 'dot', pct: 0.7, turns: 3 },
        ],
      },
    ],
    passive: {
      name: 'Venom Master',
      icon: 'assets/icons/fc1069.png',
      description: '+25% DoT damage.',
      hooks: { dotBoostAdd: 0.25 },
    },
    positional: POSITIONALS.toxicologist,
  },

  snake_healer: {
    id: 'snake_healer',
    element: 'light',
    name: 'Snake Healer',
    title: 'Molted Saint',
    rarity: 3,
    stats: { hp: 1180, atk: 148, def: 84, speed: 99 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakehealeridle1.png', frames: 16, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'soothing_scales', name: 'Soothing Scales',
        icon: 'assets/icons/fc1041.png',
        description: 'Heal an ally for 8% of the healer\'s max HP.',
        cooldown: 0, targeting: 'ally', animation: 'attack',
        effects: [{ type: 'healHpPct', pct: 0.08 }],
      },
      {
        id: 'purifying_venom', name: 'Purifying Venom',
        icon: 'assets/icons/fc1046.png',
        description: 'Cleanse an ally and heal them for 10% of the healer\'s max HP.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'cleanse' },
          { type: 'healHpPct', pct: 0.10 },
        ],
      },
      {
        id: 'rebirth_molt', name: 'Rebirth Molt',
        icon: 'assets/icons/fc1113.png',
        description: 'Bless ALL allies with regrowth: 4% of the healer\'s max HP per turn for 3 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [{ type: 'hot', pct: 0.04, turns: 3 }],
      },
    ],
    passive: {
      name: 'Radiant Scales',
      icon: 'assets/icons/fc853.png',
      description: 'At turn start, shelters the most wounded ally: +12% DEF for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.12, turns: 1 });
          return null; // silent — small rolling shelter
        },
      },
    },
    positional: POSITIONALS.opening_volley,
  },

  // ---- Placeholder snake cohort (filling the roster to 25) ---------------
  // Procedural placeholder art renders until real idle sheets land at the
  // conventional flat paths (assets/heroes/snake<role>idle.png).

  snake_skirmisher: {
    id: 'snake_skirmisher',
    element: 'wind',
    name: 'Snake Skirmisher',
    title: 'Reed-Blade Runner',
    rarity: 1,
    stats: { hp: 740, atk: 112, def: 58, speed: 104 },
    tint: { body: '#5a8a5a', helm: '#7aaa6a', weapon: '#c8c0b0', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakeskirmisheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'twin_fang_jab', name: 'Twin Fang Jab',
        icon: 'assets/icons/fc1444.png',
        description: 'Two needle jabs for 55% ATK each.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.55 },
          { type: 'damage', mult: 0.55 },
        ],
      },
      {
        id: 'slipstrike', name: 'Slipstrike',
        icon: 'assets/icons/fc825.png',
        description: 'Slide past the guard: 135% ATK and 5% turn meter back.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.35 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.05 },
        ],
      },
      {
        id: 'sand_spray', name: 'Sand Spray',
        icon: 'assets/icons/fc807.png',
        description: 'Kick sand at ALL enemies: 55% ATK and -5% SPD for 1 turn.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.55 },
          { type: 'debuff', stat: 'speed', mult: 0.95, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Ambush Coil',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 20% extra damage to enemies about to act (turn meter above 80%).',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.turnMeter > CONFIG.TURN_METER_MAX * 0.8 ? 1.2 : 1;
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  snake_spitter: {
    id: 'snake_spitter',
    element: 'water',
    name: 'Snake Spitter',
    title: 'Gutter Geyser',
    rarity: 1,
    stats: { hp: 760, atk: 115, def: 60, speed: 97 },
    tint: { body: '#4a7a8a', helm: '#6a9aaa', weapon: '#8ab8c8', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakespitteridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'venom_spit', name: 'Venom Spit',
        icon: 'assets/icons/fc981.png',
        description: 'A gob of spit: 75% ATK plus 44% ATK venom for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'dot', pct: 0.44, turns: 1 },
        ],
      },
      {
        id: 'blinding_spray', name: 'Blinding Spray',
        icon: 'assets/icons/fc1084.png',
        description: 'Spray the eyes: 100% ATK and -15% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'debuff', stat: 'critChance', add: -0.15, turns: 1 },
        ],
      },
      {
        id: 'drowning_gout', name: 'Drowning Gout',
        icon: 'assets/icons/fc819.png',
        description: 'A choking torrent: 130% ATK that drains 25% turn meter.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
          { type: 'turnMeter', amount: -0.25 },
        ],
      },
    ],
    passive: {
      name: 'Spitting Arc',
      icon: 'assets/icons/fc862.png',
      description: 'Venom sacs full: +12% damage, rising to +24% while above 80% HP.',
      hooks: {
        damageDealtMult(unit) {
          return unit.hp / unit.maxHp > 0.8 ? 1.24 : 1.12;
        },
      },
    },
    positional: POSITIONALS.toxicologist,
  },

  snake_grappler: {
    id: 'snake_grappler',
    element: 'fire',
    name: 'Snake Grappler',
    title: 'Coil of the Pit',
    rarity: 1,
    stats: { hp: 900, atk: 108, def: 74, speed: 90 },
    tint: { body: '#8a5a3a', helm: '#aa7a4a', weapon: '#c8a878', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakegrappleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'coil_grab', name: 'Coil Grab',
        icon: 'assets/icons/fc663.png',
        description: 'Seize and squeeze: 90% ATK and -10% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'debuff', stat: 'speed', mult: 0.9, turns: 1 },
        ],
      },
      {
        id: 'constricting_squeeze', name: 'Constricting Squeeze',
        icon: 'assets/icons/fc762.png',
        description: 'Crush the air out: 110% ATK and -15% ATK for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.1 },
          { type: 'debuff', stat: 'atk', mult: 0.85, turns: 1 },
        ],
      },
      {
        id: 'python_slam', name: 'Python Slam',
        icon: 'assets/icons/fc767.png',
        description: 'Whip-slam for 175% ATK, then harden scales: +15% DEF for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.75 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.15, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Iron Coils',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 12% less damage while above 70% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.hp / unit.maxHp > 0.7 ? 0.88 : 1;
        },
      },
    },
    positional: POSITIONALS.iron_wake,
  },

  snake_flutist: {
    id: 'snake_flutist',
    element: 'wind',
    name: 'Snake Flutist',
    title: 'Charmer Charmed',
    rarity: 1,
    stats: { hp: 780, atk: 106, def: 66, speed: 99 },
    tint: { body: '#7a6aa8', helm: '#9a8ac8', weapon: '#e8d8a8', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakeflutistidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'charming_note', name: 'Charming Note',
        icon: 'assets/icons/fc1003.png',
        description: 'A jarring note: 80% ATK that drains 10% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'turnMeter', amount: -0.1 },
        ],
      },
      {
        id: 'soothing_melody', name: 'Soothing Melody',
        icon: 'assets/icons/fc1112.png',
        description: 'Mend an ally for 197.4% of ATK and quicken them: +10% SPD for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.974 },
          { type: 'buff', stat: 'speed', mult: 1.1, turns: 2 },
        ],
      },
      {
        id: 'marching_tune', name: 'Marching Tune',
        icon: 'assets/icons/fc868.png',
        description: 'A driving tune: ALL allies gain +12% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.12, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Mesmer Rhythm',
      icon: 'assets/icons/fc882.png',
      description: 'At turn start, 20% chance to grant a random ally 10% turn meter.',
      hooks: {
        onTurnStart(unit, battle) {
          if (Math.random() >= 0.20) return null;
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          const ally = allies[Math.floor(Math.random() * allies.length)];
          ally.turnMeter = Math.min(CONFIG.TURN_METER_MAX,
            ally.turnMeter + CONFIG.TURN_METER_MAX * 0.10);
          return {
            label: 'Mesmer Rhythm',
            message: `${unit.name}'s rhythm carries ${ally.name} forward.`,
            floats: [{ target: ally, text: '+10% METER', color: '#c8a8e8' }],
          };
        },
      },
    },
    positional: POSITIONALS.focal_point,
  },

  snake_broodtender: {
    id: 'snake_broodtender',
    element: 'water',
    name: 'Snake Broodtender',
    title: 'Keeper of the Clutch',
    rarity: 1,
    stats: { hp: 850, atk: 100, def: 72, speed: 93 },
    tint: { body: '#6a8a6a', helm: '#e8e0c8', weapon: '#c8b898', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakebroodtenderidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'shell_crack', name: 'Shell Crack',
        icon: 'assets/icons/fc1471.png',
        description: 'A rap of the staff for 106% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.06 },
        ],
      },
      {
        id: 'nourishing_yolk', name: 'Nourishing Yolk',
        icon: 'assets/icons/fc1112.png',
        description: 'Feed an ally: heals 110% of ATK and +10% DEF for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.1 },
          { type: 'buff', stat: 'def', mult: 1.1, turns: 2 },
        ],
      },
      {
        id: 'brood_shield', name: 'Brood Shield',
        icon: 'assets/icons/fc855.png',
        description: 'Shelter the clutch: ALL allies take 10% less damage for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.9, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Tender\'s Watch',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, mends ALL allies for 1% of her max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          let any = 0;
          for (const ally of battle.livingUnits(unit.team)) {
            any += ally.heal(Math.round(unit.maxHp * 0.01), unit);
          }
          if (any <= 0) return null;
          return {
            label: "Tender's Watch",
            message: `${unit.name} tends the brood for ${any} HP.`,
            floats: [],
          };
        },
      },
    },
    positional: POSITIONALS.pivot_step,
  },

  snake_fireeater: {
    id: 'snake_fireeater',
    element: 'fire',
    name: 'Snake Fire-Eater',
    title: 'Swallower of Sparks',
    rarity: 1,
    stats: { hp: 770, atk: 116, def: 62, speed: 95 },
    tint: { body: '#a84a2a', helm: '#e8843a', weapon: '#f8c84a', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakefireeateridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'flame_gulp', name: 'Flame Gulp',
        icon: 'assets/icons/fc981.png',
        description: 'Spit stolen fire: 100% ATK plus a 24% ATK burn for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'dot', pct: 0.24, turns: 1 },
        ],
      },
      {
        id: 'belch_flame', name: 'Belch Flame',
        icon: 'assets/icons/fc1044.png',
        description: 'Belch fire over the front line for 80% ATK.',
        cooldown: 4, targeting: 'front-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
        ],
      },
      {
        id: 'swallow_the_sun', name: 'Swallow the Sun',
        icon: 'assets/icons/fc1050.png',
        description: 'Gorge on flame: +40% ATK for 1 turn and 15% max HP regen for 2 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.4, turns: 1 },
          { type: 'hot', pct: 0.15, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Inner Furnace',
      icon: 'assets/icons/fc1052.png',
      description: 'Pain feeds the furnace: deals 20% extra damage while poisoned or debuffed.',
      hooks: {
        damageDealtMult(unit, target) {
          return unit.statusEffects.some((fx) => fx.kind === 'dot' || fx.kind === 'debuff') ? 1.2 : 1;
        },
      },
    },
    positional: POSITIONALS.keystone,
  },

  snake_rattler: {
    id: 'snake_rattler',
    element: 'wind',
    name: 'Snake Rattler',
    title: 'Dread Percussionist',
    rarity: 1,
    stats: { hp: 750, atk: 110, def: 64, speed: 101 },
    tint: { body: '#8a7a4a', helm: '#a8985a', weapon: '#c8b878', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakerattleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rattle_strike', name: 'Rattle Strike',
        icon: 'assets/icons/fc1444.png',
        description: 'An unnerving strike: 95% ATK and -5% crit chance for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'debuff', stat: 'critChance', add: -0.05, turns: 1 },
        ],
      },
      {
        id: 'fear_rattle', name: 'Fear Rattle',
        icon: 'assets/icons/fc1084.png',
        description: 'A dreadful rattle: ALL enemies lose 7% ATK for 1 turn.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'atk', mult: 0.93, turns: 1 },
        ],
      },
      {
        id: 'snap_bite', name: 'Snap Bite',
        icon: 'assets/icons/fc734.png',
        description: 'A lightning lunge for 205% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.05 },
        ],
      },
    ],
    passive: {
      name: 'Unnerving Presence',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, a random enemy loses 3% ATK for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          target.addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.97, turns: 1 });
          return null; // silent — small rolling malus
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  snake_lancer: {
    id: 'snake_lancer',
    element: 'water',
    name: 'Snake Lancer',
    title: 'Scalepoint Rider',
    rarity: 2,
    stats: { hp: 920, atk: 128, def: 78, speed: 100 },
    tint: { body: '#3a6a9a', helm: '#5a8aba', weapon: '#d8d8e0', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakelanceridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'scale_lance', name: 'Scale Lance',
        icon: 'assets/icons/fc1461.png',
        description: 'A lance thrust for 113% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.13 },
        ],
      },
      {
        id: 'piercing_coil', name: 'Piercing Coil',
        icon: 'assets/icons/fc1791.png',
        description: 'Drive the lance home: 150% ATK and -10% DEF for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.5 },
          { type: 'debuff', stat: 'def', mult: 0.9, turns: 2 },
        ],
      },
      {
        id: 'serpent_charge', name: 'Serpent Charge',
        icon: 'assets/icons/fc724.png',
        description: 'Charge a hex row for 120% ATK; momentum grants 10% turn meter.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.1 },
        ],
      },
    ],
    passive: {
      name: 'Fangs of Pursuit',
      icon: 'assets/icons/fc1801.png',
      description: 'Deals 25% extra damage to slowed (SPD-debuffed) enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'debuff' && fx.stat === 'speed') ? 1.25 : 1;
        },
      },
    },
    positional: POSITIONALS.reckless_charge,
  },

  snake_winddancer: {
    id: 'snake_winddancer',
    element: 'wind',
    name: 'Snake Winddancer',
    title: 'Sister of the Gale',
    rarity: 2,
    stats: { hp: 840, atk: 134, def: 62, speed: 114 },
    tint: { body: '#6a9a8a', helm: '#8abaa8', weapon: '#e8e8d8', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakewinddanceridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'zephyr_cut', name: 'Zephyr Cut',
        icon: 'assets/icons/fc1447.png',
        description: 'A gliding cut for 96% ATK; the follow-through grants +5% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.05, turns: 1 },
        ],
      },
      {
        id: 'cyclone_spin', name: 'Cyclone Spin',
        icon: 'assets/icons/fc729.png',
        description: 'Whirl through a hex row for 105% ATK.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.05 },
        ],
      },
      {
        id: 'dance_of_gales', name: 'Dance of Gales',
        icon: 'assets/icons/fc882.png',
        description: 'Become the storm: +35% SPD and +10% crit chance for 2 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.35, turns: 2 },
          { type: 'buff', stat: 'critChance', add: 0.1, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Tailwind',
      icon: 'assets/icons/fc868.png',
      description: 'Momentum builds as she moves: +12% dodge, and +8% SPD for a turn each time she acts.',
      hooks: {
        dodgeAdd: 0.12,
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.08, turns: 1 });
          return null;
        },
      },
    },
    positional: POSITIONALS.overwatch,
  },

  snake_bogwitch: {
    id: 'snake_bogwitch',
    element: 'water',
    name: 'Snake Bog Witch',
    title: 'Whisperer in the Weeds',
    rarity: 2,
    stats: { hp: 880, atk: 138, def: 66, speed: 102 },
    tint: { body: '#4a5a3a', helm: '#6a7a4a', weapon: '#a8c86a', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakebogwitchidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bog_bolt', name: 'Bog Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'A muddy bolt: 90% ATK that leaves the target taking +10% damage for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.1, turns: 1 },
        ],
      },
      {
        id: 'sinking_mire', name: 'Sinking Mire',
        icon: 'assets/icons/fc1084.png',
        description: 'The ground swallows: ALL enemies lose 12% SPD for 2 turns.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'speed', mult: 0.88, turns: 2 },
        ],
      },
      {
        id: 'hex_of_rot', name: 'Hex of Rot',
        icon: 'assets/icons/fc1052.png',
        description: 'A rotting hex: 110% ATK plus 60% ATK decay for 3 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.1 },
          { type: 'dot', pct: 0.6, turns: 3 },
        ],
      },
    ],
    passive: {
      name: 'Marsh Power',
      icon: 'assets/icons/fc1093.png',
      description: '+15% DoT damage and +10% debuff accuracy.',
      hooks: { dotBoostAdd: 0.15, accuracyAdd: 0.10 },
    },
    positional: POSITIONALS.toxicologist,
  },

  snake_shieldscale: {
    id: 'snake_shieldscale',
    element: 'fire',
    name: 'Snake Shieldscale',
    title: 'Ember Bulwark',
    rarity: 2,
    stats: { hp: 1020, atk: 116, def: 92, speed: 88 },
    tint: { body: '#8a3a2a', helm: '#a85a3a', weapon: '#d8d8e0', shield: '#c88a3a', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakeshieldscaleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'scale_bash', name: 'Scale Bash',
        icon: 'assets/icons/fc854.png',
        description: 'Bash for 92% ATK and shrug behind the scales: takes 5% less damage until next turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.92 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.95, turns: 1 },
        ],
      },
      {
        id: 'shell_slam', name: 'Shell Slam',
        icon: 'assets/icons/fc1476.png',
        description: 'A ringing slam: 128% ATK that drains 12% turn meter.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.28 },
          { type: 'turnMeter', amount: -0.12 },
        ],
      },
      {
        id: 'molten_carapace', name: 'Molten Carapace',
        icon: 'assets/icons/fc855.png',
        description: 'Glow white-hot: takes 30% less damage and regenerates 3% max HP for 2 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.7, turns: 2 },
          { type: 'hot', pct: 0.03, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Heatproof Scales',
      icon: 'assets/icons/fc856.png',
      description: 'Intact scales turn everything: takes 22% less damage while carrying no debuff or poison.',
      hooks: {
        damageTakenMult(unit) {
          const cursed = unit.statusEffects.some(
            (fx) => fx.kind === 'debuff' || fx.kind === 'dot');
          return cursed ? 1 : 0.78;
        },
      },
    },
    positional: POSITIONALS.lifeline,
  },

  snake_venomsmith: {
    id: 'snake_venomsmith',
    element: 'water',
    name: 'Snake Venomsmith',
    title: 'Artisan of Agony',
    rarity: 2,
    stats: { hp: 870, atk: 130, def: 70, speed: 98 },
    tint: { body: '#5a7a3a', helm: '#7a9a4a', weapon: '#a8e85a', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakevenomsmithidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'toxin_dart', name: 'Toxin Dart',
        icon: 'assets/icons/fc981.png',
        description: 'A coated dart: 70% ATK plus 56% ATK venom for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.7 },
          { type: 'dot', pct: 0.56, turns: 1 },
        ],
      },
      {
        id: 'coat_blades', name: 'Coat Blades',
        icon: 'assets/icons/fc869.png',
        description: 'Pass out envenomed edges: ALL allies gain +15% ATK for 2 turns.',
        cooldown: 4, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.15, turns: 2 },
        ],
      },
      {
        id: 'overdose', name: 'Overdose',
        icon: 'assets/icons/fc1093.png',
        description: 'Trigger the toxins: 90% ATK — 120% more against poisoned prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9, bonusVs: { kind: 'dot', mult: 2.2 } },
        ],
      },
    ],
    passive: {
      name: 'Leaky Vials',
      icon: 'assets/icons/fc863.png',
      description: 'At turn start, a random enemy suffers a small poison (5% of his ATK for 1 turn).',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const amount = Math.max(1, Math.round(unit.effectiveStat('atk') * 0.05));
          target.addStatusEffect({ kind: 'dot', amount, turns: 1 });
          return null; // silent — small rolling poison
        },
      },
    },
    positional: POSITIONALS.toxicologist,
  },

  snake_oracle: {
    id: 'snake_oracle',
    element: 'wind',
    name: 'Snake Oracle',
    title: 'Reader of Sheddings',
    rarity: 2,
    stats: { hp: 860, atk: 126, def: 72, speed: 103 },
    tint: { body: '#8a8ab8', helm: '#a8a8d8', weapon: '#e8e8f8', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakeoracleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'portent_bolt', name: 'Portent Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'A foreseen strike: 94% ATK and +15% crit damage for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.94 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critDamage', add: 0.15, turns: 1 },
        ],
      },
      {
        id: 'foretell_doom', name: 'Foretell Doom',
        icon: 'assets/icons/fc862.png',
        description: 'Name the hour: the target takes +35% damage for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'damageTaken', mult: 1.35, turns: 1 },
        ],
      },
      {
        id: 'rewrite_fate', name: 'Rewrite Fate',
        icon: 'assets/icons/fc855.png',
        description: 'Unwind misfortune: cleanses ALL allies and grants 10% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'cleanse' },
          { type: 'turnMeter', amount: 0.1 },
        ],
      },
    ],
    passive: {
      name: 'Glimpse Ahead',
      icon: 'assets/icons/fc882.png',
      description: '+15% chance to dodge while above half HP.',
      hooks: {
        dodgeAdd(unit) {
          return unit.hp / unit.maxHp > 0.5 ? 0.15 : 0;
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  snake_pitfighter: {
    id: 'snake_pitfighter',
    element: 'fire',
    name: 'Snake Pitfighter',
    title: 'Champion of the Sand Pit',
    rarity: 2,
    stats: { hp: 940, atk: 136, def: 72, speed: 101 },
    tint: { body: '#7a4a4a', helm: '#9a6a5a', weapon: '#c8c0b0', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakepitfighteridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'pit_jab', name: 'Pit Jab',
        icon: 'assets/icons/fc663.png',
        description: 'A dirty jab: 103% ATK — 20% more against debuffed foes.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.03, bonusVs: { kind: 'debuff', mult: 1.2 } },
        ],
      },
      {
        id: 'dirty_handful', name: 'Dirty Handful',
        icon: 'assets/icons/fc1084.png',
        description: 'Sand in the eyes: 115% ATK and -8% crit chance for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.15 },
          { type: 'debuff', stat: 'critChance', add: -0.08, turns: 2 },
        ],
      },
      {
        id: 'pit_finish', name: 'Pit Finish',
        icon: 'assets/icons/fc734.png',
        description: 'End it: 155% ATK — 50% more against exposed (vulnerability-marked) foes.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.55, bonusVs: { stat: 'damageTaken', mult: 1.5 } },
        ],
      },
    ],
    passive: {
      name: 'Scrapper\'s Fury',
      icon: 'assets/icons/fc867.png',
      description: 'Gains +8% ATK and +4% SPD for 1 turn at each turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.08, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.04, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.last_stand,
  },

  snake_basilisk: {
    id: 'snake_basilisk',
    element: 'fire',
    name: 'Snake Basilisk',
    title: 'The Widowing Gaze',
    rarity: 3,
    stats: { hp: 1150, atk: 176, def: 88, speed: 103 },
    tint: { body: '#6a6a3a', helm: '#8a8a4a', weapon: '#e8e86a', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakebasiliskidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'petrifying_gaze', name: 'Petrifying Gaze',
        icon: 'assets/icons/fc1084.png',
        description: 'A stony stare: 88% ATK that drains 12% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.88 },
          { type: 'turnMeter', amount: -0.12 },
        ],
      },
      {
        id: 'stone_stare', name: 'Stone Stare',
        icon: 'assets/icons/fc862.png',
        description: 'Flesh stiffens: the target loses 30% SPD and 10% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'speed', mult: 0.7, turns: 2 },
          { type: 'debuff', stat: 'atk', mult: 0.9, turns: 2 },
        ],
      },
      {
        id: 'gorgons_wrath', name: 'Gorgon\'s Wrath',
        icon: 'assets/icons/fc1044.png',
        description: 'Shatter the statue: 180% ATK and the target takes +20% damage for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.8 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.2, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Stonescale',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 5% less damage and +15% debuff resistance.',
      hooks: {
        damageTakenMult() { return 0.95; },
        resistanceAdd: 0.15,
      },
    },
    positional: POSITIONALS.focal_point,
  },

  snake_leviathan: {
    id: 'snake_leviathan',
    element: 'water',
    name: 'Snake Leviathan',
    title: 'Terror of the Drowned Road',
    rarity: 3,
    stats: { hp: 1200, atk: 168, def: 90, speed: 100 },
    tint: { body: '#2a4a6a', helm: '#3a6a8a', weapon: '#7ac8e8', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakeleviathanidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'tide_fang', name: 'Tide Fang',
        icon: 'assets/icons/fc819.png',
        description: 'Bite and tail-lash: 95% then 45% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'damage', mult: 0.45 },
        ],
      },
      {
        id: 'whirlpool_coil', name: 'Whirlpool Coil',
        icon: 'assets/icons/fc800.png',
        description: 'Drag ALL enemies under: 65% ATK and -8% turn meter.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.65 },
          { type: 'turnMeter', amount: -0.08 },
        ],
      },
      {
        id: 'leviathan_crash', name: 'Leviathan Crash',
        icon: 'assets/icons/fc1622.png',
        description: 'Fall like a tide wall: 250% ATK.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.5 },
        ],
      },
    ],
    passive: {
      name: 'Crushing Depths',
      icon: 'assets/icons/fc863.png',
      description: 'Preys on the exhausted: +25% damage to enemies below 25% turn meter.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.turnMeter < CONFIG.TURN_METER_MAX * 0.25 ? 1.25 : 1;
        },
      },
    },
    positional: POSITIONALS.reckless_charge,
  },

  snake_plaguebearer: {
    id: 'snake_plaguebearer',
    element: 'wind',
    name: 'Snake Plaguebearer',
    title: 'Gift That Keeps Giving',
    rarity: 3,
    stats: { hp: 1090, atk: 178, def: 80, speed: 105 },
    tint: { body: '#5a6a4a', helm: '#7a8a5a', weapon: '#a8c87a', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakeplaguebeareridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'plague_touch', name: 'Plague Touch',
        icon: 'assets/icons/fc1093.png',
        description: 'A mere touch: 40% ATK sickness per turn for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'dot', pct: 0.4, turns: 2 },
        ],
      },
      {
        id: 'spreading_sickness', name: 'Spreading Sickness',
        icon: 'assets/icons/fc1084.png',
        description: 'The plague leaps: ALL enemies sicken for 30% ATK per turn for 2 turns.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'dot', pct: 0.3, turns: 2 },
        ],
      },
      {
        id: 'pandemic', name: 'Pandemic',
        icon: 'assets/icons/fc1052.png',
        description: 'Ripen the plague: 60% ATK to ALL enemies — 80% more against the diseased.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.6, bonusVs: { kind: 'dot', mult: 1.8 } },
        ],
      },
    ],
    passive: {
      name: 'Virulent Strains',
      icon: 'assets/icons/fc1003.png',
      description: '+15% debuff accuracy and +15% DoT damage.',
      hooks: { accuracyAdd: 0.15, dotBoostAdd: 0.15 },
    },
    positional: POSITIONALS.toxicologist,
  },

  snake_sandviper: {
    id: 'snake_sandviper',
    element: 'fire',
    name: 'Snake Sandviper',
    title: 'Death Under the Dune',
    rarity: 3,
    stats: { hp: 1070, atk: 184, def: 78, speed: 108 },
    tint: { body: '#b8904a', helm: '#d8b06a', weapon: '#e8d8a8', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakesandviperidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'sidewind_strike', name: 'Sidewind Strike',
        icon: 'assets/icons/fc1447.png',
        description: 'A sidewinding cut: 120% ATK and +6% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.06, turns: 1 },
        ],
      },
      {
        id: 'ambush_from_below', name: 'Ambush from Below',
        icon: 'assets/icons/fc825.png',
        description: 'Erupt from the sand: 165% ATK — 25% more against debuffed prey.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.65, bonusVs: { kind: 'debuff', mult: 1.25 } },
        ],
      },
      {
        id: 'sand_burial', name: 'Sand Burial',
        icon: 'assets/icons/fc767.png',
        description: 'Drag them under: 140% ATK, -20% SPD for 2 turns and -15% turn meter.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.4 },
          { type: 'debuff', stat: 'speed', mult: 0.8, turns: 2 },
          { type: 'turnMeter', amount: -0.15 },
        ],
      },
    ],
    passive: {
      name: 'Desert Patience',
      icon: 'assets/icons/fc882.png',
      description: 'Outpaces prey: +20% damage to enemies slower than him.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && unit.effectiveStat('speed') > target.effectiveStat('speed') ? 1.2 : 1;
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  // ---- Wolf cohort (the Snowfield) ----------------------------------------
  // Procedural placeholder art renders until real idle sheets land at the
  // conventional flat paths (assets/heroes/wolf<role>idle.png).

  snake_gravecoil: {
    id: 'snake_gravecoil',
    element: 'dark',
    name: 'Snake Gravecoil',
    title: 'The sentence is the swing.',
    rarity: 3,
    stats: { hp: 1102, atk: 167, def: 84, speed: 99 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakegravecoilidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_gravecoil_edge', name: 'Gravecoil\'s Edge',
        icon: 'assets/icons/fc734.png',
        description: 'Two dark cuts: 71% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.71 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'snake_gravecoil_sentence', name: 'Gravecoil\'s Sentence',
        icon: 'assets/icons/fc730.png',
        description: 'Pass judgment: 151% ATK and the target takes +12% damage for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.51 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.12, turns: 1 },
        ],
      },
      {
        id: 'snake_gravecoil_end', name: 'Gravecoil\'s End',
        icon: 'assets/icons/fc728.png',
        description: 'Carry it out: 227% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.27 },
        ],
      },
    ],
    passive: {
      name: 'Gravecoil\'s Due',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 38% extra damage to enemies below 22% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.22 ? 1.38 : 1;
        },
      },
    },
    positional: POSITIONALS.focal_point,
  },

  snake_hexscale: {
    id: 'snake_hexscale',
    element: 'dark',
    name: 'Snake Hexscale',
    title: 'Carries every curse worth having.',
    rarity: 3,
    stats: { hp: 1111, atk: 172, def: 87, speed: 101 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakehexscaleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_hexscale_lash', name: 'Hexscale Lash',
        icon: 'assets/icons/fc1052.png',
        description: 'Two cursed lashes: 72% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.72 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'snake_hexscale_bane', name: 'Hexscale Bane',
        icon: 'assets/icons/fc1084.png',
        description: 'A layered curse: 152% ATK, -11% ATK and -7% DEF for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.52 },
          { type: 'debuff', stat: 'atk', mult: 0.89, turns: 2 },
          { type: 'debuff', stat: 'def', mult: 0.93, turns: 2 },
        ],
      },
      {
        id: 'snake_hexscale_pall', name: 'Hexscale Pall',
        icon: 'assets/icons/fc1050.png',
        description: 'A pall over everything: 106% ATK to ALL enemies and -3% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.06 },
          { type: 'debuff', stat: 'speed', mult: 0.97, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Hexscale Craft',
      icon: 'assets/icons/fc1093.png',
      description: 'Curses honed in the dark.',
      hooks: { accuracyAdd: 0.18, dotBoostAdd: 0.05 },
    },
    positional: POSITIONALS.bloodied_fury,
  },

  snake_bloodadder: {
    id: 'snake_bloodadder',
    element: 'dark',
    name: 'Snake Bloodadder',
    title: 'Your vigor, redistributed.',
    rarity: 3,
    stats: { hp: 1120, atk: 177, def: 90, speed: 103 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakebloodadderidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_bloodadder_sip', name: 'Bloodadder\'s Sip',
        icon: 'assets/icons/fc1444.png',
        description: 'Two draining touches: 73% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.73 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'snake_bloodadder_feast', name: 'Bloodadder\'s Feast',
        icon: 'assets/icons/fc825.png',
        description: 'Drink deep: 153% ATK, healing himself for 36% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.53 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.36 },
        ],
      },
      {
        id: 'snake_bloodadder_toll', name: 'Bloodadder\'s Toll',
        icon: 'assets/icons/fc1112.png',
        description: 'Tax the living: 97% ATK to ALL enemies while he mends 9% of his max HP.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.97 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.09 },
        ],
      },
    ],
    passive: {
      name: 'Bloodadder Hunger',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, siphons 1.8% of his max HP from a random enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const amount = Math.max(1, Math.round(unit.maxHp * 0.018));
          Abilities.strike(unit, target, amount);
          unit.heal(amount);
          return null; // silent — small rolling hunger
        },
      },
    },
    positional: POSITIONALS.snipers_nest,
  },

  snake_nightslither: {
    id: 'snake_nightslither',
    element: 'dark',
    name: 'Snake Nightslither',
    title: 'The dark keeps its edge honed.',
    rarity: 3,
    stats: { hp: 1129, atk: 182, def: 93, speed: 105 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakenightslitheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_nightslither_flick', name: 'Nightslither Flick',
        icon: 'assets/icons/fc1447.png',
        description: 'Two flickering cuts: 74% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.74 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'snake_nightslither_waltz', name: 'Nightslither Waltz',
        icon: 'assets/icons/fc1587.png',
        description: 'A step through shadow: 154% ATK and +9% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.54 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.09, turns: 1 },
        ],
      },
      {
        id: 'snake_nightslither_finale', name: 'Nightslither Finale',
        icon: 'assets/icons/fc723.png',
        description: 'The last figure: 218% ATK — 25% more against debuffed prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.18, bonusVs: { kind: 'debuff', mult: 1.25 } },
        ],
      },
    ],
    passive: {
      name: 'Nightslither Poise',
      icon: 'assets/icons/fc862.png',
      description: 'A blade kept perfectly balanced (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.07, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.02, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.keystone,
  },

  snake_dreadhood: {
    id: 'snake_dreadhood',
    element: 'dark',
    name: 'Snake Dreadhood',
    title: 'Fear arrives before the blow.',
    rarity: 3,
    stats: { hp: 1138, atk: 187, def: 96, speed: 107 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakedreadhoodidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_dreadhood_knell', name: 'Dreadhood Knell',
        icon: 'assets/icons/fc1003.png',
        description: 'Two tolling blows: 75% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'snake_dreadhood_omen', name: 'Dreadhood Omen',
        icon: 'assets/icons/fc1084.png',
        description: 'Name their doom: 135% ATK and -12% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.35 },
          { type: 'debuff', stat: 'atk', mult: 0.88, turns: 2 },
        ],
      },
      {
        id: 'snake_dreadhood_chorus', name: 'Dreadhood Chorus',
        icon: 'assets/icons/fc807.png',
        description: 'The dread chorus: 104% ATK to ALL enemies and -7% crit chance for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.04 },
          { type: 'debuff', stat: 'critChance', add: -0.07, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Dreadhood Presence',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, dread spreads: ALL enemies lose 2% crit chance for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const e of battle.livingUnits(unit.enemyTeam())) {
            e.addStatusEffect({ kind: 'debuff', stat: 'critChance', add: -0.02, turns: 1 });
          }
          return null; // silent — small rolling dread
        },
      },
    },
    positional: POSITIONALS.reckless_charge,
  },

  snake_dawnpriestess: {
    id: 'snake_dawnpriestess',
    element: 'light',
    name: 'Snake Dawnpriestess',
    title: 'Every wound answers to the light.',
    rarity: 3,
    stats: { hp: 1147, atk: 162, def: 99, speed: 109 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakedawnpriestessidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_dawnpriestess_rebuke', name: 'Dawnpriestess\'s Rebuke',
        icon: 'assets/icons/fc1471.png',
        description: 'Two shining raps: 76% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.76 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'snake_dawnpriestess_grace', name: 'Dawnpriestess\'s Grace',
        icon: 'assets/icons/fc1112.png',
        description: 'Pour in the light: heals an ally 94.1% of ATK and cleanses their debuffs.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.941 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'snake_dawnpriestess_communion', name: 'Dawnpriestess\'s Communion',
        icon: 'assets/icons/fc800.png',
        description: 'Shared light: ALL allies heal 59.2% of ATK plus 1% of max HP regen for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.592 },
          { type: 'hot', pct: 0.01, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Dawnpriestess Devotion',
      icon: 'assets/icons/fc1093.png',
      description: 'Healing hands, steadied by faith.',
      hooks: { healBoostAdd: 0.28 },
    },
    positional: POSITIONALS.field_medic,
  },

  snake_aegiscoil: {
    id: 'snake_aegiscoil',
    element: 'light',
    name: 'Snake Aegiscoil',
    title: 'A shield the sun would envy.',
    rarity: 3,
    stats: { hp: 1156, atk: 167, def: 78, speed: 111 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakeaegiscoilidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_aegiscoil_check', name: 'Aegiscoil\'s Check',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield checks: 77% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.77 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'snake_aegiscoil_ward', name: 'Aegiscoil\'s Ward',
        icon: 'assets/icons/fc855.png',
        description: 'Raise the aegis over an ally: they take 8% less damage for 2 turns and heal 76% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.91, turns: 2 },
          { type: 'heal', mult: 0.76 },
        ],
      },
      {
        id: 'snake_aegiscoil_vigil', name: 'Aegiscoil\'s Vigil',
        icon: 'assets/icons/fc856.png',
        description: 'The unbroken vigil: ALL allies gain +3% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.03, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Aegiscoil Constancy',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, shields the most wounded ally: takes 6% less damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.93, turns: 1 });
          return null; // silent — small rolling shelter
        },
      },
    },
    positional: POSITIONALS.lifeline,
  },

  snake_radiantfang: {
    id: 'snake_radiantfang',
    element: 'light',
    name: 'Snake Radiantfang',
    title: 'Morning, sharpened.',
    rarity: 3,
    stats: { hp: 1165, atk: 172, def: 81, speed: 113 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakeradiantfangidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_radiantfang_stroke', name: 'Radiantfang Stroke',
        icon: 'assets/icons/fc1587.png',
        description: 'Two dawn-lit strokes: 78% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.78 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'snake_radiantfang_flare', name: 'Radiantfang Flare',
        icon: 'assets/icons/fc1447.png',
        description: 'A flare of morning: 158% ATK, and the light mends 8% of max HP.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.58 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.08 },
        ],
      },
      {
        id: 'snake_radiantfang_zenith', name: 'Radiantfang Zenith',
        icon: 'assets/icons/fc730.png',
        description: 'High noon: 221% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.21 },
        ],
      },
    ],
    passive: {
      name: 'Radiantfang Resolve',
      icon: 'assets/icons/fc1003.png',
      description: 'Heals 7% max HP at turn start while below 35% HP.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp >= 0.35) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.07));
          if (healed <= 0) return null;
          return {
            label: 'Radiantfang Resolve',
            message: `${unit.name}'s light knits ${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#f8d86a' }],
          };
        },
      },
    },
    positional: POSITIONALS.thornguard,
  },

  snake_sunwhisper: {
    id: 'snake_sunwhisper',
    element: 'light',
    name: 'Snake Sunwhisper',
    title: 'Good news travels armed.',
    rarity: 3,
    stats: { hp: 1174, atk: 177, def: 84, speed: 97 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakesunwhisperidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_sunwhisper_call', name: 'Sunwhisper\'s Call',
        icon: 'assets/icons/fc868.png',
        description: 'Two ringing notes: 79% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.79 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'snake_sunwhisper_proclamation', name: 'Sunwhisper\'s Proclamation',
        icon: 'assets/icons/fc869.png',
        description: 'Lift an ally: +13% ATK for 2 turns and 9% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.13, turns: 2 },
          { type: 'turnMeter', amount: 0.09 },
        ],
      },
      {
        id: 'snake_sunwhisper_triumph', name: 'Sunwhisper\'s Triumph',
        icon: 'assets/icons/fc882.png',
        description: 'Declare the day won: ALL allies gain +8% SPD for 2 turns and 3% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.08, turns: 2 },
          { type: 'turnMeter', amount: 0.03 },
        ],
      },
    ],
    passive: {
      name: 'Sunwhisper Anthem',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start: ALL allies gain +3% SPD for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) { a.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.03, turns: 1 }); }
          return null; // silent — small rolling anthem
        },
      },
    },
    positional: POSITIONALS.safe_distance,
  },

  snake_truthscale: {
    id: 'snake_truthscale',
    element: 'light',
    name: 'Snake Truthscale',
    title: 'Verdicts delivered in person.',
    rarity: 3,
    stats: { hp: 1183, atk: 182, def: 87, speed: 99 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snaketruthscaleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_truthscale_gavel', name: 'Truthscale\'s Gavel',
        icon: 'assets/icons/fc1461.png',
        description: 'Two measured blows: 80% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'snake_truthscale_inquest', name: 'Truthscale\'s Inquest',
        icon: 'assets/icons/fc862.png',
        description: 'Open the case: 150% ATK and the target takes +17% damage for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.5 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.17, turns: 2 },
        ],
      },
      {
        id: 'snake_truthscale_verdict', name: 'Truthscale\'s Verdict',
        icon: 'assets/icons/fc744.png',
        description: 'Deliver the verdict: 223% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.23 },
        ],
      },
    ],
    passive: {
      name: 'Truthscale Justice',
      icon: 'assets/icons/fc863.png',
      description: 'Justice sees clearly: deals 30% extra damage to slowed enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'debuff' && fx.stat === 'speed') ? 1.3 : 1;
        },
      },
    },
    positional: POSITIONALS.warding_circle,
  },

  snake_fangbrand: {
    id: 'snake_fangbrand',
    element: 'water',
    name: 'Snake Fangbrand',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1438, atk: 208, def: 111, speed: 106 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakefangbrandidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_fangbrand_strike', name: 'Fangbrand\'s Strike',
        icon: 'assets/icons/fc730.png',
        description: 'Two champion blows: 92% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.92 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'snake_fangbrand_onslaught', name: 'Fangbrand\'s Onslaught',
        icon: 'assets/icons/fc1447.png',
        description: 'Press the advantage: 175% ATK, then +10% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.75 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.1, turns: 2 },
        ],
      },
      {
        id: 'snake_fangbrand_supremacy', name: 'Fangbrand\'s Supremacy',
        icon: 'assets/icons/fc767.png',
        description: 'Settle it: 226% ATK and -9% DEF for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.26 },
          { type: 'debuff', stat: 'def', mult: 0.91, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Fangbrand Supremacy',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 10% more and takes 4% less damage.',
      hooks: {
        damageDealtMult() { return 1.1; },
        damageTakenMult() { return 0.96; },
      },
    },
    positional: POSITIONALS.last_stand,
  },

  snake_spellscale: {
    id: 'snake_spellscale',
    element: 'fire',
    name: 'Snake Spellscale',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1450, atk: 214, def: 115, speed: 109 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakespellscaleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_spellscale_bolt', name: 'Spellscale\'s Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'Twin arcane bolts: 93% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.93 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'snake_spellscale_torrent', name: 'Spellscale\'s Torrent',
        icon: 'assets/icons/fc1084.png',
        description: 'A torrent of power: 116% ATK to ALL enemies and -7% SPD for 2 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.16 },
          { type: 'debuff', stat: 'speed', mult: 0.93, turns: 2 },
        ],
      },
      {
        id: 'snake_spellscale_cataclysm', name: 'Spellscale\'s Cataclysm',
        icon: 'assets/icons/fc1044.png',
        description: 'The big one: 132% ATK to ALL enemies and -7% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.32 },
          { type: 'debuff', stat: 'atk', mult: 0.93, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Spellscale Resonance',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, arcane bleed sears ALL enemies for 2.5% of this hero\'s ATK.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.effectiveStat('atk') * 0.025));
          for (const e of enemies) Abilities.strike(unit, e, amount);
          return null; // silent — small rolling resonance
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  snake_wallcoil: {
    id: 'snake_wallcoil',
    element: 'wind',
    name: 'Snake Wallcoil',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1462, atk: 220, def: 119, speed: 112 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakewallcoilidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_wallcoil_bash', name: 'Wallcoil\'s Bash',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield strikes: 94% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.94 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'snake_wallcoil_bulwark', name: 'Wallcoil\'s Bulwark',
        icon: 'assets/icons/fc855.png',
        description: 'Anchor the line: ALL allies gain +12% DEF for 2 turns and take 3% less damage for 1 turn.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.12, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.97, turns: 1 },
        ],
      },
      {
        id: 'snake_wallcoil_stand', name: 'Wallcoil\'s Stand',
        icon: 'assets/icons/fc856.png',
        description: 'Refuse to fall: takes 29% less damage for 2 turns and heals 11% max HP.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.71, turns: 2 },
          { type: 'healHpPct', pct: 0.11 },
        ],
      },
    ],
    passive: {
      name: 'Wallcoil Aegis',
      icon: 'assets/icons/fc868.png',
      description: 'Coils tight around the wounded: takes 16% less damage while any ally is below half HP.',
      hooks: {
        damageTakenMult(unit) {
          const battle = typeof Battle !== 'undefined' ? Battle.active : null;
          if (!battle) return 1;
          return battle.livingUnits(unit.team)
            .some((u) => u !== unit && u.hp / u.maxHp < 0.5) ? 0.84 : 1;
        },
      },
    },
    positional: POSITIONALS.iron_wake,
  },

  snake_farfang: {
    id: 'snake_farfang',
    element: 'water',
    name: 'Snake Farfang',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1474, atk: 226, def: 123, speed: 115 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakefarfangidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_farfang_shot', name: 'Farfang\'s Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'Two placed shots: 95% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'snake_farfang_deadeye', name: 'Farfang\'s Deadeye',
        icon: 'assets/icons/fc1516.png',
        description: 'The perfect line: 188% ATK and drains 10% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.88 },
          { type: 'turnMeter', amount: -0.1 },
        ],
      },
      {
        id: 'snake_farfang_barrage', name: 'Farfang\'s Barrage',
        icon: 'assets/icons/fc807.png',
        description: 'Fill the sky: 114% ATK to ALL enemies.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.14 },
          { type: 'turnMeter', amount: -0.02 },
        ],
      },
    ],
    passive: {
      name: 'Farfang Focus',
      icon: 'assets/icons/fc862.png',
      description: 'The shot is already lined up (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.22, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.snipers_nest,
  },

  snake_mystcoil: {
    id: 'snake_mystcoil',
    element: 'fire',
    name: 'Snake Mystcoil',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1486, atk: 196, def: 127, speed: 101 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakemystcoilidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_mystcoil_touch', name: 'Mystcoil\'s Touch',
        icon: 'assets/icons/fc1112.png',
        description: 'Two chastening touches: 96% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'snake_mystcoil_blessing', name: 'Mystcoil\'s Blessing',
        icon: 'assets/icons/fc800.png',
        description: 'Mend an ally: 15% of max HP plus 2.1% regen for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.15 },
          { type: 'hot', pct: 0.021, turns: 2 },
        ],
      },
      {
        id: 'snake_mystcoil_renewal', name: 'Mystcoil\'s Renewal',
        icon: 'assets/icons/fc869.png',
        description: 'The circle holds: ALL allies heal 44% of ATK, are cleansed, and gain +4% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.44 },
          { type: 'cleanse' },
          { type: 'buff', stat: 'def', mult: 1.04, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Mystcoil Communion',
      icon: 'assets/icons/fc1003.png',
      description: 'Healing woven a little stronger.',
      hooks: { healBoostAdd: 0.21 },
    },
    positional: POSITIONALS.lifeline,
  },

  snake_nullscale: {
    id: 'snake_nullscale',
    element: 'dark',
    name: 'Snake Nullscale',
    title: 'Champion of the Dark',
    rarity: 4,
    stats: { hp: 1498, atk: 202, def: 105, speed: 104 },
    tint: { body: '#241f33', helm: '#3d3350', weapon: '#9a7ad0', skin: '#8a82a0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakenullscaleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_nullscale_grasp', name: 'Nullscale\'s Grasp',
        icon: 'assets/icons/fc1444.png',
        description: 'Two grasping shadows: 97% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.97 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'snake_nullscale_devour', name: 'Nullscale\'s Devour',
        icon: 'assets/icons/fc825.png',
        description: 'Feed the void: 170% ATK, healing this hero for 32% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.7 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.32 },
        ],
      },
      {
        id: 'snake_nullscale_oblivion', name: 'Nullscale\'s Oblivion',
        icon: 'assets/icons/fc734.png',
        description: 'Unmake them: 241% ATK and the target takes +19% damage for 1 turn.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.41 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.19, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Nullscale Thirst',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, drains 1.9% of max HP from the weakest enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          enemies.sort((a, b) => a.hp - b.hp);
          const amount = Math.max(1, Math.round(unit.maxHp * 0.019));
          Abilities.strike(unit, enemies[0], amount);
          unit.heal(amount);
          return null; // silent — small rolling thirst
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  snake_glorycoil: {
    id: 'snake_glorycoil',
    element: 'light',
    name: 'Snake Glorycoil',
    title: 'Champion of the Dawn',
    rarity: 4,
    stats: { hp: 1510, atk: 208, def: 109, speed: 107 },
    tint: { body: '#e0d3a8', helm: '#f5e9c0', weapon: '#ffdf70', skin: '#f0e4c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakeglorycoilidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_glorycoil_radiance', name: 'Glorycoil\'s Radiance',
        icon: 'assets/icons/fc1471.png',
        description: 'Two radiant strikes: 98% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.98 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'snake_glorycoil_benediction', name: 'Glorycoil\'s Benediction',
        icon: 'assets/icons/fc1112.png',
        description: 'Bless an ally: heals 17% of max HP and grants 11% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.17 },
          { type: 'turnMeter', amount: 0.11 },
        ],
      },
      {
        id: 'snake_glorycoil_ascension', name: 'Glorycoil\'s Ascension',
        icon: 'assets/icons/fc855.png',
        description: 'Lift the whole line: ALL allies heal 50% of ATK and gain +8% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.5 },
          { type: 'buff', stat: 'atk', mult: 1.08, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Glorycoil Benevolence',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, ALL allies heal 1.2% of this hero\'s max HP and gain a small speed blessing for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) {
            a.heal(Math.round(unit.maxHp * 0.012), unit);
            a.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.02, turns: 1 });
          }
          return null; // silent — small rolling benevolence
        },
      },
    },
    positional: POSITIONALS.pivot_step,
  },

});
