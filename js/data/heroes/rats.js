// Rat heroes (42). Registered into the shared
// HEROES table declared in js/data/heroes.js.

Object.assign(HEROES, {

  rat_archer: {
    id: 'rat_archer',
    element: 'wind',
    name: 'Rat Archer',
    title: 'Burrow Scout',
    rarity: 1,
    stats: { hp: 700, atk: 115, def: 55, speed: 100 },
    tint: { body: '#5a7a4a', helm: '#7a9a5a', weapon: '#a88a5a', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_archer/ratarcheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'quick_shot', name: 'Quick Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'Loose an arrow for 100% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.0 }],
      },
      {
        id: 'aimed_shot', name: 'Aimed Shot',
        icon: 'assets/icons/fc1516.png',
        description: 'A careful shot for 140% ATK.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.4 }],
      },
      {
        id: 'arrow_rain', name: 'Arrow Rain',
        icon: 'assets/icons/fc807.png',
        description: 'Pepper ALL enemies for 70% ATK.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.7 }],
      },
    ],
    passive: {
      name: 'Twitchy',
      icon: 'assets/icons/fc882.png',
      description: 'Gains +8% SPD for 1 turn at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.08, turns: 1 });
          return null; // silent — too minor to log every turn
        },
      },
    },
    positional: POSITIONALS.overwatch,
  },

  rat_brawler: {
    id: 'rat_brawler',
    element: 'fire',
    name: 'Rat Brawler',
    title: 'Gutter Scrapper',
    rarity: 1,
    stats: { hp: 900, atk: 105, def: 80, speed: 90 },
    tint: { body: '#8a6a4a', helm: '#a8845a', weapon: '#b8b0a8', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_brawler/ratbrawleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'jab', name: 'Jab',
        icon: 'assets/icons/fc663.png',
        description: 'Two quick jabs for 50% ATK each.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.5 },
          { type: 'damage', mult: 0.5 },
        ],
      },
      {
        id: 'haymaker', name: 'Haymaker',
        icon: 'assets/icons/fc762.png',
        description: 'A wild swing for 150% ATK.',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [{ type: 'damage', mult: 1.5 }],
      },
      {
        id: 'gutter_stance', name: 'Gutter Stance',
        icon: 'assets/icons/fc854.png',
        description: 'Hunker down: +40% DEF for 2 turns.',
        cooldown: 5, targeting: 'self', animation: 'attack',
        effects: [{ type: 'buff', stat: 'def', mult: 1.4, turns: 2 }],
      },
    ],
    passive: {
      name: 'Thick Hide',
      icon: 'assets/icons/fc1112.png',
      description: 'Recovers 3% max HP at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          const healed = unit.heal(Math.round(unit.maxHp * 0.03));
          if (healed <= 0) return null;
          return {
            label: 'Thick Hide',
            message: `${unit.name}'s Thick Hide restores ${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#7ae87a' }],
          };
        },
      },
    },
    positional: POSITIONALS.rallying_banner,
  },

  rat_spearman: {
    id: 'rat_spearman',
    element: 'water',
    name: 'Rat Spearman',
    title: 'Tunnel Guard',
    rarity: 1,
    stats: { hp: 820, atk: 110, def: 70, speed: 95 },
    tint: { body: '#6a6a8a', helm: '#8a8aa8', weapon: '#c8c0b0', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_spearman/ratspearmanidle.png', frames: 14, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'poke', name: 'Poke',
        icon: 'assets/icons/fc1461.png',
        description: 'A spear thrust for 108% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.08 },
        ],
      },
      {
        id: 'lunge', name: 'Lunge',
        icon: 'assets/icons/fc1791.png',
        description: 'A deep lunge: 130% ATK and -10% SPD for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
          { type: 'debuff', stat: 'speed', mult: 0.9, turns: 1 },
        ],
      },
      {
        id: 'sweeping_thrust', name: 'Sweeping Thrust',
        icon: 'assets/icons/fc724.png',
        description: 'Rake a hex row for 80% ATK.',
        cooldown: 5, targeting: 'enemy-row', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.8 }],
      },
    ],
    passive: {
      name: 'Set Spear',
      icon: 'assets/icons/fc1801.png',
      description: 'A braced spear catches the charge: +18% damage to enemies still at full HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.hp >= target.maxHp ? 1.18 : 1;
        },
      },
    },
    positional: POSITIONALS.rallying_banner,
  },

  // ---- 2★ rat cohort ------------------------------------------------------

  rat_assassin: {
    id: 'rat_assassin',
    element: 'wind',
    name: 'Rat Assassin',
    title: 'Sewer Shadow',
    rarity: 2,
    stats: { hp: 800, atk: 135, def: 60, speed: 115, critChance: 0.25 },
    tint: { body: '#3a3a4a', helm: '#5a5a6a', weapon: '#b8b0c8', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_assassin/ratassassinidle.png', frames: 16, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'shiv', name: 'Shiv',
        icon: 'assets/icons/fc1444.png',
        description: 'A quick stab for 105% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.05 }],
      },
      {
        id: 'backstab', name: 'Backstab',
        icon: 'assets/icons/fc825.png',
        description: 'Slip behind for 145% ATK — 30% more against debuffed prey.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.45, bonusVs: { kind: 'debuff', mult: 1.3 } },
        ],
      },
      {
        id: 'throat_cut', name: 'Throat Cut',
        icon: 'assets/icons/fc734.png',
        description: 'Go for the kill: 200% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 2.0 }],
      },
    ],
    passive: {
      name: 'Opportunist',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 20% extra damage to enemies below half HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.5 ? 1.2 : 1;
        },
      },
    },
    positional: POSITIONALS.snipers_nest,
  },

  rat_berserker: {
    id: 'rat_berserker',
    element: 'fire',
    name: 'Rat Berserker',
    title: 'Plague Fury',
    rarity: 2,
    stats: { hp: 950, atk: 145, def: 55, speed: 100 },
    tint: { body: '#8a4a3a', helm: '#a86a4a', weapon: '#c8b0a0', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_berserker/ratberserkeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wild_swing', name: 'Wild Swing',
        icon: 'assets/icons/fc744.png',
        description: 'A reckless swing: 130% ATK, but drops his guard (-10% DEF for 1 turn).',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 0.9, turns: 1 },
        ],
      },
      {
        id: 'reckless_cleave', name: 'Reckless Cleave',
        icon: 'assets/icons/fc745.png',
        description: 'An all-out cleave for 155% ATK.',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [{ type: 'damage', mult: 1.55 }],
      },
      {
        id: 'blood_frenzy', name: 'Blood Frenzy',
        icon: 'assets/icons/fc743.png',
        description: 'Work into a frenzy: +40% ATK for 3 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [{ type: 'buff', stat: 'atk', mult: 1.4, turns: 3 }],
      },
    ],
    passive: {
      name: 'Pain Fueled',
      icon: 'assets/icons/fc1093.png',
      description: 'Deals 25% extra damage while below half HP.',
      hooks: {
        damageDealtMult(unit) {
          return unit.hp / unit.maxHp < 0.5 ? 1.25 : 1;
        },
      },
    },
    positional: POSITIONALS.last_stand,
  },

  rat_mauler: {
    id: 'rat_mauler',
    element: 'water',
    name: 'Rat Mauler',
    title: 'Cellar Crusher',
    rarity: 2,
    stats: { hp: 1100, atk: 130, def: 75, speed: 85 },
    tint: { body: '#5a4a3a', helm: '#7a6a5a', weapon: '#a89078', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_mauler/ratmauleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'club_smash', name: 'Club Smash',
        icon: 'assets/icons/fc1471.png',
        description: 'A club blow for 115% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.15 },
        ],
      },
      {
        id: 'bone_crusher', name: 'Bone Crusher',
        icon: 'assets/icons/fc1476.png',
        description: 'Deals 140% ATK and cracks armor: -20% DEF for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'slam',
        effects: [
          { type: 'damage', mult: 1.4 },
          { type: 'debuff', stat: 'def', mult: 0.8, turns: 2 },
        ],
      },
      {
        id: 'overhead_slam', name: 'Overhead Slam',
        icon: 'assets/icons/fc767.png',
        description: 'Bring it all down: 185% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack', impact: 'slam',
        effects: [{ type: 'damage', mult: 1.85 }],
      },
    ],
    passive: {
      name: 'Bully',
      icon: 'assets/icons/fc657.png',
      description: 'Deals 15% extra damage to enemies above half HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp >= 0.5 ? 1.15 : 1;
        },
      },
    },
    positional: POSITIONALS.standard_bearer,
  },

  rat_duelist: {
    id: 'rat_duelist',
    element: 'wind',
    name: 'Rat Duelist',
    title: 'Gutter Gentry',
    rarity: 2,
    stats: { hp: 850, atk: 140, def: 65, speed: 110 },
    tint: { body: '#7a3a5a', helm: '#9a5a7a', weapon: '#d8d0e0', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_duelist/ratduelistidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'riposte', name: 'Riposte',
        icon: 'assets/icons/fc1454.png',
        description: 'A measured riposte: 95% ATK, then +25% crit damage for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critDamage', add: 0.25, turns: 1 },
        ],
      },
      {
        id: 'flourish', name: 'Flourish',
        icon: 'assets/icons/fc729.png',
        description: 'A dazzling feint: 135% ATK and +15% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.35 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.15, turns: 1 },
        ],
      },
      {
        id: 'coup_de_grace', name: 'Coup de Grâce',
        icon: 'assets/icons/fc728.png',
        description: 'The decisive strike: 190% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.9 }],
      },
    ],
    passive: {
      name: 'Duelist\'s Eye',
      icon: 'assets/icons/fc719.png',
      description: 'Gains +10% crit chance for 1 turn at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.1, turns: 1 });
          return null; // silent — fires every turn
        },
      },
    },
    positional: POSITIONALS.bloodied_fury,
  },

  // ---- 3★ rat cohort ------------------------------------------------------

  rat_samurai: {
    id: 'rat_samurai',
    element: 'fire',
    name: 'Rat Samurai',
    title: 'Ronin of the Drain',
    rarity: 3,
    stats: { hp: 1150, atk: 175, def: 90, speed: 105 },
    tint: { body: '#8a2a2a', helm: '#3a3a3a', weapon: '#d8d8e0', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_samurai/ratsamuraiidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'iai_cut', name: 'Iai Cut',
        icon: 'assets/icons/fc1587.png',
        description: 'A single flawless draw-cut for 125% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.25 },
        ],
      },
      {
        id: 'cross_slash', name: 'Cross Slash',
        icon: 'assets/icons/fc1030.png',
        description: 'Two crossing cuts for 80% ATK each.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'damage', mult: 0.8 },
        ],
      },
      {
        id: 'crescent_moon', name: 'Crescent Moon',
        icon: 'assets/icons/fc1003.png',
        description: 'One sweeping cut along a hex row for 120% ATK.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack', impact: 'slash',
        effects: [{ type: 'damage', mult: 1.2 }],
      },
    ],
    passive: {
      name: 'Iaijutsu',
      icon: 'assets/icons/fc1038.png',
      description: 'Deals 25% extra damage to enemies at full HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp >= target.maxHp ? 1.25 : 1;
        },
      },
    },
    positional: POSITIONALS.focal_point,
  },



  // ---- Placeholder rat cohort (filling the roster to 25) -----------------
  // Procedural placeholder art renders until real idle sheets land at the
  // conventional paths (assets/heroes/<id>/<id-no-underscore>idle.png).

  rat_warrior: {
    id: 'rat_warrior',
    element: 'fire',
    name: 'Rat Warrior',
    title: 'Sword of the Warren',
    rarity: 1,
    stats: { hp: 850, atk: 112, def: 72, speed: 92 },
    tint: { body: '#7a4a3a', helm: '#9a6a4a', weapon: '#d8d8e0', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_warrior/ratwarrioridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'warren_slash', name: 'Warren Slash',
        icon: 'assets/icons/fc1447.png',
        description: 'Cut for 100% ATK, then raise the shield: +10% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.1, turns: 1 },
        ],
      },
      {
        id: 'shield_splitter', name: 'Shield Splitter',
        icon: 'assets/icons/fc1476.png',
        description: 'Smash armor: 125% ATK and -15% DEF for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.25 },
          { type: 'debuff', stat: 'def', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'battle_roar', name: 'Battle Roar',
        icon: 'assets/icons/fc869.png',
        description: 'Bellow a challenge: +30% ATK for 2 turns.',
        cooldown: 5, targeting: 'self', animation: 'attack',
        effects: [{ type: 'buff', stat: 'atk', mult: 1.3, turns: 2 }],
      },
    ],
    passive: {
      name: 'Second Wind',
      icon: 'assets/icons/fc1112.png',
      description: 'Recovers 6% max HP at turn start while below half HP.',
      hooks: {
        onTurnStart(unit) {
          if (unit.hp / unit.maxHp >= 0.5) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.06));
          if (healed <= 0) return null;
          return {
            label: 'Second Wind',
            message: `${unit.name} catches a second wind for ${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#7ae87a' }],
          };
        },
      },
    },
    positional: POSITIONALS.bloodied_fury,
  },

  rat_slinger: {
    id: 'rat_slinger',
    element: 'water',
    name: 'Rat Slinger',
    title: 'Gutter Stonecast',
    rarity: 1,
    stats: { hp: 720, atk: 114, def: 58, speed: 98 },
    tint: { body: '#4a6a7a', helm: '#6a8a9a', weapon: '#a8a098', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_slinger/ratslingeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'pebble_toss', name: 'Pebble Toss',
        icon: 'assets/icons/fc1515.png',
        description: 'A stinging stone: 90% ATK and -8% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'debuff', stat: 'atk', mult: 0.92, turns: 1 },
        ],
      },
      {
        id: 'skull_crack', name: 'Skull Crack',
        icon: 'assets/icons/fc1516.png',
        description: 'A dazing shot: 120% ATK and drains 15% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'turnMeter', amount: -0.15 },
        ],
      },
      {
        id: 'rock_volley', name: 'Rock Volley',
        icon: 'assets/icons/fc807.png',
        description: 'Rain stones on ALL enemies for 65% ATK.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.65 }],
      },
    ],
    passive: {
      name: 'Rear Sniper',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 12% extra damage to back-row enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.slot && target.slot.position === POSITION.BACK ? 1.12 : 1;
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  rat_scout: {
    id: 'rat_scout',
    element: 'wind',
    name: 'Rat Scout',
    title: 'Whisker in the Weeds',
    rarity: 1,
    stats: { hp: 750, atk: 108, def: 62, speed: 102 },
    tint: { body: '#5a7a5a', helm: '#7a9a7a', weapon: '#b8a878', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_scout/ratscoutidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'quick_nick', name: 'Quick Nick',
        icon: 'assets/icons/fc1444.png',
        description: 'A darting cut for 92% ATK; footwork grants +8% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.92 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.08, turns: 1 },
        ],
      },
      {
        id: 'mark_target', name: 'Mark Target',
        icon: 'assets/icons/fc862.png',
        description: 'Expose a weakness: the target takes +25% damage for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'debuff', stat: 'damageTaken', mult: 1.25, turns: 2 }],
      },
      {
        id: 'hit_and_run', name: 'Hit and Run',
        icon: 'assets/icons/fc882.png',
        description: 'Strike for 130% ATK, then gain +30% SPD for 2 turns.',
        cooldown: 5, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.3 }],
        selfEffects: [{ type: 'buff', stat: 'speed', mult: 1.3, turns: 2 }],
      },
    ],
    passive: {
      name: 'Pathfinder',
      icon: 'assets/icons/fc868.png',
      description: '+10% chance to dodge attacks.',
      hooks: { dodgeAdd: 0.10 },
    },
    positional: POSITIONALS.hexweaver,
  },

  rat_miner: {
    id: 'rat_miner',
    element: 'fire',
    name: 'Rat Miner',
    title: 'Deep Warren Digger',
    rarity: 1,
    stats: { hp: 880, atk: 110, def: 78, speed: 88 },
    tint: { body: '#6a5a3a', helm: '#c8a83a', weapon: '#a8a0a8', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_miner/ratmineridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'pick_swing', name: 'Pick Swing',
        icon: 'assets/icons/fc1472.png',
        description: 'An over-heavy swing: 120% ATK, but costs 10% of his own turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: -0.10 },
        ],
      },
      {
        id: 'lantern_flash', name: 'Lantern Flash',
        icon: 'assets/icons/fc1084.png',
        description: 'Blind with lamplight: the target loses 15% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'debuff', stat: 'atk', mult: 0.85, turns: 2 }],
      },
      {
        id: 'cave_in', name: 'Cave-In',
        icon: 'assets/icons/fc767.png',
        description: 'Bring the roof down on a hex row for 85% ATK.',
        cooldown: 5, targeting: 'enemy-row', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.85 }],
      },
    ],
    passive: {
      name: 'Ore Sense',
      icon: 'assets/icons/fc867.png',
      description: 'Deals 18% extra damage to enemies with weakened DEF.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some(
            (fx) => fx.kind === 'debuff' && fx.stat === 'def') ? 1.18 : 1;
        },
      },
    },
    positional: POSITIONALS.iron_wake,
  },

  rat_cook: {
    id: 'rat_cook',
    element: 'water',
    name: 'Rat Cook',
    title: 'Stewmaster of the Sump',
    rarity: 1,
    stats: { hp: 800, atk: 104, def: 70, speed: 94 },
    tint: { body: '#e8e0d8', helm: '#f8f0e8', weapon: '#a8a0a8', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_cook/ratcookidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'ladle_whack', name: 'Ladle Whack',
        icon: 'assets/icons/fc663.png',
        description: 'Bonk with the big spoon for 90% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [{ type: 'damage', mult: 0.9 }],
      },
      {
        id: 'hot_soup', name: 'Hot Soup',
        icon: 'assets/icons/fc1112.png',
        description: 'Serve an ally soup: heals 103.8% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [{ type: 'heal', mult: 1.038 }],
      },
      {
        id: 'grand_feast', name: 'Grand Feast',
        icon: 'assets/icons/fc800.png',
        description: 'Lay a feast: heals ALL allies for 55.4% of ATK plus 1.4% of the Cook\'s max HP for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.554 },
          { type: 'hot', pct: 0.014, turns: 2 },
        ],
      },
    ],
    passive: {
      name: "Soup's On",
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, feeds the most wounded ally 3% of the Cook\'s max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team)
            .filter((u) => u.hp < u.maxHp);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          const target = allies[0];
          const healed = target.heal(Math.round(unit.maxHp * 0.03), unit);
          if (healed <= 0) return null;
          return {
            label: "Soup's On",
            message: `${unit.name} slips ${target.name} a snack for ${healed} HP.`,
            floats: [{ target, text: `+${healed}`, color: '#7ae87a' }],
          };
        },
      },
    },
    positional: POSITIONALS.lifeline,
  },

  rat_torchbearer: {
    id: 'rat_torchbearer',
    element: 'fire',
    name: 'Rat Torchbearer',
    title: 'Lightbringer Below',
    rarity: 1,
    stats: { hp: 780, atk: 112, def: 64, speed: 96 },
    tint: { body: '#8a5a2a', helm: '#e8a83a', weapon: '#f8c84a', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_torchbearer/rattorchbeareridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'torch_jab', name: 'Torch Jab',
        icon: 'assets/icons/fc981.png',
        description: 'Thrust the brand: 90% ATK and a singe of 16% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'dot', pct: 0.16, turns: 1 },
        ],
      },
      {
        id: 'set_alight', name: 'Set Alight',
        icon: 'assets/icons/fc1050.png',
        description: 'Hit for 80% ATK and burn for 50% ATK per turn for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'dot', pct: 0.5, turns: 2 },
        ],
      },
      {
        id: 'wall_of_flame', name: 'Wall of Flame',
        icon: 'assets/icons/fc1044.png',
        description: 'Ignite ALL enemies: 40% ATK burn per turn for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'dot', pct: 0.4, turns: 2 }],
      },
    ],
    passive: {
      name: 'Kindling',
      icon: 'assets/icons/fc1003.png',
      description: 'His burns cling: damage-over-time he inflicts lasts 1 extra turn.',
      hooks: { dotExtraTurns: 1 },
    },
    positional: POSITIONALS.press_the_flank,
  },

  // ---- 2★ placeholder rats ------------------------------------------------

  rat_knight: {
    id: 'rat_knight',
    element: 'water',
    name: 'Rat Knight',
    title: 'Sworn Shield of the Nest',
    rarity: 2,
    stats: { hp: 1000, atk: 118, def: 95, speed: 90 },
    tint: { body: '#7a7a8a', helm: '#a8a8b8', weapon: '#d8d8e0', shield: '#5a6a9a', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_knight/ratknightidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'mace_strike', name: 'Mace Strike',
        icon: 'assets/icons/fc1471.png',
        description: 'Strike for 95% ATK and brace behind the shield: takes 10% less damage until his next turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.9, turns: 1 },
        ],
      },
      {
        id: 'pommel_bash', name: 'Pommel Bash',
        icon: 'assets/icons/fc762.png',
        description: 'Stagger the target: 115% ATK and drains 10% turn meter.',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.15 },
          { type: 'turnMeter', amount: -0.10 },
        ],
      },
      {
        id: 'phalanx_guard', name: 'Phalanx Guard',
        icon: 'assets/icons/fc855.png',
        description: 'Brace the front line: +20% DEF and 2% of the Knight\'s max HP regen for 2 turns.',
        cooldown: 5, targeting: 'front-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.2, turns: 2 },
          { type: 'hot', pct: 0.02, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Bulwark',
      icon: 'assets/icons/fc856.png',
      description: 'A shield wall needs a wall: takes 15% less damage while at least two other allies still stand.',
      hooks: {
        damageTakenMult(unit) {
          const battle = typeof Battle !== 'undefined' ? Battle.active : null;
          if (!battle) return 1;
          return battle.livingUnits(unit.team).length >= 3 ? 0.85 : 1;
        },
      },
    },
    positional: POSITIONALS.rallying_banner,
  },

  rat_shaman: {
    id: 'rat_shaman',
    element: 'water',
    name: 'Rat Shaman',
    title: 'Voice of Old Whiskers',
    rarity: 2,
    stats: { hp: 860, atk: 126, def: 72, speed: 100 },
    tint: { body: '#4a5a8a', helm: '#8a6ab8', weapon: '#b8a878', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_shaman/ratshamanidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'whisker_hex', name: 'Whisker Hex',
        icon: 'assets/icons/fc1052.png',
        description: 'A jinx for 90% ATK that softens armor: -7% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'debuff', stat: 'def', mult: 0.93, turns: 1 },
        ],
      },
      {
        id: 'spirit_mend', name: 'Spirit Mend',
        icon: 'assets/icons/fc1112.png',
        description: 'Heal an ally for 256.6% of ATK and cleanse their debuffs.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 2.566 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'ancestors_wrath', name: "Ancestor's Wrath",
        icon: 'assets/icons/fc1084.png',
        description: 'The old spirits rend ALL enemies: 70% ATK and -5% DEF for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.7 },
          { type: 'debuff', stat: 'def', mult: 0.95, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Spirit Ward',
      icon: 'assets/icons/fc854.png',
      description: '+35% debuff resistance.',
      hooks: { resistanceAdd: 0.35 },
    },
    positional: POSITIONALS.hexweaver,
  },

  rat_monk: {
    id: 'rat_monk',
    element: 'wind',
    name: 'Rat Monk',
    title: 'Fist of the Still Water',
    rarity: 2,
    stats: { hp: 900, atk: 130, def: 76, speed: 108 },
    tint: { body: '#c88a3a', helm: '#b8b0a8', weapon: '#b8b0a8', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_monk/ratmonkidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'palm_strike', name: 'Palm Strike',
        icon: 'assets/icons/fc663.png',
        description: 'A flowing palm blow: 105% ATK and 8% turn meter back.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.05 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.08 },
        ],
      },
      {
        id: 'chi_burst', name: 'Chi Burst',
        icon: 'assets/icons/fc1030.png',
        description: 'Channel chi into a strike for 150% ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [{ type: 'damage', mult: 1.5 }],
      },
      {
        id: 'meditate', name: 'Meditate',
        icon: 'assets/icons/fc1112.png',
        description: 'Center the self: cleanse own debuffs and recover 42.6% max HP.',
        cooldown: 5, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'cleanse' },
          { type: 'healHpPct', pct: 0.426 },
        ],
      },
    ],
    passive: {
      name: 'Flow State',
      icon: 'assets/icons/fc882.png',
      description: '+8% chance to take an extra turn after acting.',
      hooks: { extraTurnAdd: 0.08 },
    },
    positional: POSITIONALS.focal_point,
  },

  rat_gunner: {
    id: 'rat_gunner',
    element: 'fire',
    name: 'Rat Gunner',
    title: 'Powderwhisker',
    rarity: 2,
    stats: { hp: 820, atk: 138, def: 60, speed: 97 },
    tint: { body: '#3a3a3a', helm: '#8a2a2a', weapon: '#6a6a7a', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_gunner/ratgunneridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'musket_shot', name: 'Musket Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'A crack of powder: 125% ATK, then reloads (-8% of his own turn meter).',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.25 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: -0.08 },
        ],
      },
      {
        id: 'piercing_round', name: 'Piercing Round',
        icon: 'assets/icons/fc1621.png',
        description: 'A punched slug for 145% ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.45 }],
      },
      {
        id: 'grapeshot', name: 'Grapeshot',
        icon: 'assets/icons/fc807.png',
        description: 'Spray the front line for 90% ATK.',
        cooldown: 6, targeting: 'front-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.9 }],
      },
    ],
    passive: {
      name: 'Steady Aim',
      icon: 'assets/icons/fc1516.png',
      description: 'Gains +5% crit chance for 2 turns at each turn start (briefly stacks).',
      hooks: {
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.05, turns: 2 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.snipers_nest,
  },

  rat_thief: {
    id: 'rat_thief',
    element: 'wind',
    name: 'Rat Thief',
    title: 'Fingers of the Fog',
    rarity: 2,
    stats: { hp: 810, atk: 132, def: 62, speed: 112 },
    tint: { body: '#4a4a5a', helm: '#2a2a3a', weapon: '#b8b0c8', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_thief/ratthiefidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snatch_strike', name: 'Snatch Strike',
        icon: 'assets/icons/fc1444.png',
        description: 'Strike for 100% ATK and gain 10% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.0 }],
        selfEffects: [{ type: 'turnMeter', amount: 0.10 }],
      },
      {
        id: 'hamstring', name: 'Hamstring',
        icon: 'assets/icons/fc825.png',
        description: 'Cut low: 110% ATK and -15% SPD for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.1 },
          { type: 'debuff', stat: 'speed', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'smoke_bomb', name: 'Smoke Bomb',
        icon: 'assets/icons/fc1084.png',
        description: 'Choking smoke: ALL enemies lose 10% ATK for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'debuff', stat: 'atk', mult: 0.9, turns: 1 }],
      },
    ],
    passive: {
      name: 'Cutpurse',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 15% extra damage to enemies above half turn meter.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.turnMeter > CONFIG.TURN_METER_MAX * 0.5 ? 1.15 : 1;
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  rat_herbalist: {
    id: 'rat_herbalist',
    element: 'water',
    name: 'Rat Herbalist',
    title: 'Rootpicker',
    rarity: 2,
    stats: { hp: 840, atk: 122, def: 68, speed: 99 },
    tint: { body: '#4a7a4a', helm: '#6a9a5a', weapon: '#8ab86a', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_herbalist/ratherbalistidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'thorn_flick', name: 'Thorn Flick',
        icon: 'assets/icons/fc981.png',
        description: 'Flick a barbed seed for 95% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.95 }],
      },
      {
        id: 'healing_herbs', name: 'Healing Herbs',
        icon: 'assets/icons/fc1112.png',
        description: 'Dress wounds: heals 120% of ATK, then 3% of the Herbalist\'s max HP for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.2 },
          { type: 'hot', pct: 0.03, turns: 2 },
        ],
      },
      {
        id: 'bitter_remedy', name: 'Bitter Remedy',
        icon: 'assets/icons/fc855.png',
        description: 'A foul tonic that cleanses ALL allies\' debuffs.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [{ type: 'cleanse' }],
      },
    ],
    passive: {
      name: 'Poultice',
      icon: 'assets/icons/fc1093.png',
      description: 'Sheds one debuff from herself at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          const idx = unit.statusEffects.findIndex(
            (fx) => fx.kind === 'debuff' || fx.kind === 'dot');
          if (idx === -1) return null;
          unit.statusEffects.splice(idx, 1);
          return {
            label: 'Poultice',
            message: `${unit.name}'s poultice draws out an affliction.`,
            floats: [{ target: unit, text: 'CLEANSE', color: '#7ae8e8' }],
          };
        },
      },
    },
    positional: POSITIONALS.warding_circle,
  },

  // ---- 3★ placeholder rats ------------------------------------------------

  rat_captain: {
    id: 'rat_captain',
    element: 'water',
    name: 'Rat Captain',
    title: 'Commodore of the Culvert',
    rarity: 3,
    stats: { hp: 1180, atk: 165, def: 92, speed: 102 },
    tint: { body: '#2a4a8a', helm: '#e8c83a', weapon: '#d8d8e0', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_captain/ratcaptainidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'sabre_cut', name: 'Sabre Cut',
        icon: 'assets/icons/fc1587.png',
        description: 'An officer\'s stroke: 110% ATK that drains 5% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.1 },
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
      {
        id: 'hold_the_line', name: 'Hold the Line',
        icon: 'assets/icons/fc855.png',
        description: 'Steel the ranks: ALL allies gain +25% DEF for 2 turns.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [{ type: 'buff', stat: 'def', mult: 1.25, turns: 2 }],
      },
      {
        id: 'charge_order', name: 'Charge Order',
        icon: 'assets/icons/fc869.png',
        description: 'Sound the charge: ALL allies gain 20% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [{ type: 'turnMeter', amount: 0.20 }],
      },
    ],
    passive: {
      name: 'Rally Cry',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, ALL allies gain +5% ATK for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const ally of battle.livingUnits(unit.team)) {
            ally.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.05, turns: 1 });
          }
          return {
            label: 'Rally Cry',
            message: `${unit.name} rallies the warren: +5% ATK.`,
            floats: [],
          };
        },
      },
    },
    positional: POSITIONALS.focal_point,
  },

  rat_ninja: {
    id: 'rat_ninja',
    element: 'wind',
    name: 'Rat Ninja',
    title: 'Silent Whisker',
    rarity: 3,
    stats: { hp: 1080, atk: 180, def: 82, speed: 110 },
    tint: { body: '#2a2a3a', helm: '#3a3a4a', weapon: '#d8d8e0', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_ninja/ratninjaidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'shuriken_toss', name: 'Shuriken Toss',
        icon: 'assets/icons/fc728.png',
        description: 'Two spinning stars for 60% ATK each.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.6 },
          { type: 'damage', mult: 0.6 },
        ],
      },
      {
        id: 'shadow_strike', name: 'Shadow Strike',
        icon: 'assets/icons/fc825.png',
        description: 'Blink through shadow for 170% ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.7 }],
      },
      {
        id: 'silent_end', name: 'Silent End',
        icon: 'assets/icons/fc734.png',
        description: 'One perfect cut: 230% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 2.3 }],
      },
    ],
    passive: {
      name: 'Smoke Veil',
      icon: 'assets/icons/fc862.png',
      description: 'Struck once, gone the next: +25% dodge for a turn after losing HP.',
      hooks: {
        onTurnStart(unit) {
          const wasHit = unit._veilHp !== undefined && unit.hp < unit._veilHp;
          unit._veilHp = unit.hp;
          if (!wasHit) return null;
          unit.addStatusEffect({ kind: 'buff', stat: 'veil', turns: 1 });
          return {
            label: 'Smoke Veil',
            message: `${unit.name} vanishes into smoke.`,
            floats: [{ target: unit, text: 'VEIL', color: '#8ee8ff' }],
          };
        },
        dodgeAdd(unit) {
          return unit.statusEffects.some((fx) => fx.stat === 'veil') ? 0.25 : 0;
        },
      },
    },
    positional: POSITIONALS.overwatch,
  },

  rat_pyromancer: {
    id: 'rat_pyromancer',
    element: 'fire',
    name: 'Rat Pyromancer',
    title: 'Ember Sage',
    rarity: 3,
    stats: { hp: 1060, atk: 182, def: 80, speed: 101 },
    tint: { body: '#8a2a1a', helm: '#e86a2a', weapon: '#f8a83a', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_pyromancer/ratpyromanceridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cinder_bolt', name: 'Cinder Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'A searing bolt: 80% ATK plus a 20% ATK burn for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'dot', pct: 0.2, turns: 2 },
        ],
      },
      {
        id: 'immolate', name: 'Immolate',
        icon: 'assets/icons/fc1052.png',
        description: 'Hit for 60% ATK and burn for 80% ATK per turn for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.6 },
          { type: 'dot', pct: 0.8, turns: 2 },
        ],
      },
      {
        id: 'firestorm', name: 'Firestorm',
        icon: 'assets/icons/fc1044.png',
        description: '85% ATK to ALL enemies — burning targets take 50% more.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.85, bonusVs: { kind: 'dot', mult: 1.5 } }],
      },
    ],
    passive: {
      name: 'Accelerant',
      icon: 'assets/icons/fc1093.png',
      description: 'Deals 25% extra damage to enemies suffering damage over time.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'dot') ? 1.25 : 1;
        },
      },
    },
    positional: POSITIONALS.toxicologist,
  },

  rat_tidecaller: {
    id: 'rat_tidecaller',
    element: 'water',
    name: 'Rat Tidecaller',
    title: 'Drainsinger',
    rarity: 3,
    stats: { hp: 1100, atk: 172, def: 86, speed: 104 },
    tint: { body: '#2a5a8a', helm: '#4a8ab8', weapon: '#7ac8e8', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_tidecaller/rattidecalleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'water_whip', name: 'Water Whip',
        icon: 'assets/icons/fc819.png',
        description: 'A dragging lash: 90% ATK that drains 8% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'turnMeter', amount: -0.08 },
        ],
      },
      {
        id: 'tidal_slam', name: 'Tidal Slam',
        icon: 'assets/icons/fc1622.png',
        description: 'A crushing wave: 150% ATK and drains 20% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.5 },
          { type: 'turnMeter', amount: -0.20 },
        ],
      },
      {
        id: 'great_wave', name: 'Great Wave',
        icon: 'assets/icons/fc800.png',
        description: 'Sweep ALL enemies for 80% ATK and drain 10% turn meter.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'turnMeter', amount: -0.10 },
        ],
      },
    ],
    passive: {
      name: 'Undertow',
      icon: 'assets/icons/fc882.png',
      description: 'At turn start, 25% chance to drain 10% turn meter from a random enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          if (Math.random() >= 0.25) return null;
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          target.turnMeter = Math.max(0, target.turnMeter - CONFIG.TURN_METER_MAX * 0.10);
          return {
            label: 'Undertow',
            message: `${unit.name}'s undertow drags at ${target.name}.`,
            floats: [{ target, text: '-10% METER', color: '#7ac8e8' }],
          };
        },
      },
    },
    positional: POSITIONALS.keystone,
  },

  rat_stormcaller: {
    id: 'rat_stormcaller',
    element: 'wind',
    name: 'Rat Stormcaller',
    title: 'Gale of the Gutters',
    rarity: 3,
    stats: { hp: 1070, atk: 178, def: 81, speed: 106 },
    tint: { body: '#5a5a8a', helm: '#8a8ac8', weapon: '#e8e84a', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_stormcaller/ratstormcalleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'spark_lash', name: 'Spark Lash',
        icon: 'assets/icons/fc1050.png',
        description: 'A forking arc that hits for 70% then 40% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.7 },
          { type: 'damage', mult: 0.4 },
        ],
      },
      {
        id: 'chain_lightning', name: 'Chain Lightning',
        icon: 'assets/icons/fc1030.png',
        description: 'Arc through a hex row for 95% ATK.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.95 }],
      },
      {
        id: 'thunderhead', name: 'Thunderhead',
        icon: 'assets/icons/fc807.png',
        description: 'A rolling storm: 70% ATK to ALL enemies and -10% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.7 },
          { type: 'debuff', stat: 'speed', mult: 0.9, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Static Charge',
      icon: 'assets/icons/fc867.png',
      description: 'Gains +8% ATK for 2 turns at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.08, turns: 2 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  // ---- Bird cohort --------------------------------------------------------
  // Idle-only art for now, like the rats; attack/death strips can land
  // later without kit changes.

  rat_gravecarver: {
    id: 'rat_gravecarver',
    element: 'dark',
    name: 'Rat Gravecarver',
    title: 'The sentence is the swing.',
    rarity: 3,
    stats: { hp: 1060, atk: 158, def: 78, speed: 96 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_gravecarver/ratgravecarveridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_gravecarver_edge', name: 'Gravecarver\'s Edge',
        icon: 'assets/icons/fc734.png',
        description: 'Two dark cuts: 71% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.71 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'rat_gravecarver_sentence', name: 'Gravecarver\'s Sentence',
        icon: 'assets/icons/fc730.png',
        description: 'Pass judgment: 121% ATK and the target takes +12% damage for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.21 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.12, turns: 1 },
        ],
      },
      {
        id: 'rat_gravecarver_end', name: 'Gravecarver\'s End',
        icon: 'assets/icons/fc728.png',
        description: 'Carry it out: 197% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.97 },
        ],
      },
    ],
    passive: {
      name: 'Gravecarver\'s Due',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 22% extra damage to enemies below 45% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.45 ? 1.22 : 1;
        },
      },
    },
    positional: POSITIONALS.keystone,
  },

  rat_hexweaver: {
    id: 'rat_hexweaver',
    element: 'dark',
    name: 'Rat Hexweaver',
    title: 'Carries every curse worth having.',
    rarity: 3,
    stats: { hp: 1069, atk: 163, def: 81, speed: 98 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_hexweaver/rathexweaveridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_hexweaver_lash', name: 'Hexweaver Lash',
        icon: 'assets/icons/fc1052.png',
        description: 'Two cursed lashes: 72% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.72 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'rat_hexweaver_bane', name: 'Hexweaver Bane',
        icon: 'assets/icons/fc1084.png',
        description: 'A layered curse: 122% ATK, -8% ATK and -4% DEF for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.22 },
          { type: 'debuff', stat: 'atk', mult: 0.92, turns: 2 },
          { type: 'debuff', stat: 'def', mult: 0.96, turns: 2 },
        ],
      },
      {
        id: 'rat_hexweaver_pall', name: 'Hexweaver Pall',
        icon: 'assets/icons/fc1050.png',
        description: 'A pall over everything: 76% ATK to ALL enemies and -3% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.76 },
          { type: 'debuff', stat: 'speed', mult: 0.97, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Hexweaver Craft',
      icon: 'assets/icons/fc1093.png',
      description: 'Curses honed in the dark.',
      hooks: { accuracyAdd: 0.12, dotBoostAdd: 0.08 },
    },
    positional: POSITIONALS.reckless_charge,
  },

  rat_bloodleech: {
    id: 'rat_bloodleech',
    element: 'dark',
    name: 'Rat Bloodleech',
    title: 'Your vigor, redistributed.',
    rarity: 3,
    stats: { hp: 1078, atk: 168, def: 84, speed: 100 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_bloodleech/ratbloodleechidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_bloodleech_sip', name: 'Bloodleech\'s Sip',
        icon: 'assets/icons/fc1444.png',
        description: 'Two draining touches: 73% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.73 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'rat_bloodleech_feast', name: 'Bloodleech\'s Feast',
        icon: 'assets/icons/fc825.png',
        description: 'Drink deep: 123% ATK, healing himself for 30% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.23 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.3 },
        ],
      },
      {
        id: 'rat_bloodleech_toll', name: 'Bloodleech\'s Toll',
        icon: 'assets/icons/fc1112.png',
        description: 'Tax the living: 67% ATK to ALL enemies while he mends 6% of his max HP.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.67 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.06 },
        ],
      },
    ],
    passive: {
      name: 'Bloodleech Hunger',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, siphons 1.2% of his max HP from a random enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const amount = Math.max(1, Math.round(unit.maxHp * 0.012));
          Abilities.strike(unit, target, amount);
          unit.heal(amount);
          return null; // silent — small rolling hunger
        },
      },
    },
    positional: POSITIONALS.opening_volley,
  },

  rat_nightfang: {
    id: 'rat_nightfang',
    element: 'dark',
    name: 'Rat Nightfang',
    title: 'The dark keeps its edge honed.',
    rarity: 3,
    stats: { hp: 1087, atk: 173, def: 87, speed: 102 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_nightfang/ratnightfangidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_nightfang_flick', name: 'Nightfang Flick',
        icon: 'assets/icons/fc1447.png',
        description: 'Two flickering cuts: 74% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.74 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'rat_nightfang_waltz', name: 'Nightfang Waltz',
        icon: 'assets/icons/fc1587.png',
        description: 'A step through shadow: 124% ATK and +6% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.24 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.06, turns: 1 },
        ],
      },
      {
        id: 'rat_nightfang_finale', name: 'Nightfang Finale',
        icon: 'assets/icons/fc723.png',
        description: 'The last figure: 188% ATK — 25% more against debuffed prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.88, bonusVs: { kind: 'debuff', mult: 1.25 } },
        ],
      },
    ],
    passive: {
      name: 'Nightfang Poise',
      icon: 'assets/icons/fc862.png',
      description: 'A blade kept perfectly balanced (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.07, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.03, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.press_the_flank,
  },

  rat_doomcrier: {
    id: 'rat_doomcrier',
    element: 'dark',
    name: 'Rat Doomcrier',
    title: 'Fear arrives before the blow.',
    rarity: 3,
    stats: { hp: 1096, atk: 178, def: 90, speed: 104 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_doomcrier/ratdoomcrieridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_doomcrier_knell', name: 'Doomcrier Knell',
        icon: 'assets/icons/fc1003.png',
        description: 'Two tolling blows: 75% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'rat_doomcrier_omen', name: 'Doomcrier Omen',
        icon: 'assets/icons/fc1084.png',
        description: 'Name their doom: 105% ATK and -9% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.05 },
          { type: 'debuff', stat: 'atk', mult: 0.91, turns: 2 },
        ],
      },
      {
        id: 'rat_doomcrier_chorus', name: 'Doomcrier Chorus',
        icon: 'assets/icons/fc807.png',
        description: 'The dread chorus: 74% ATK to ALL enemies and -4% crit chance for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.74 },
          { type: 'debuff', stat: 'critChance', add: -0.04, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Doomcrier Presence',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, dread spreads: ALL enemies lose 2% DEF for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const e of battle.livingUnits(unit.enemyTeam())) {
            e.addStatusEffect({ kind: 'debuff', stat: 'def', mult: 0.98, turns: 1 });
          }
          return null; // silent — small rolling dread
        },
      },
    },
    positional: POSITIONALS.last_stand,
  },

  rat_lightmender: {
    id: 'rat_lightmender',
    element: 'light',
    name: 'Rat Lightmender',
    title: 'Every wound answers to the light.',
    rarity: 3,
    stats: { hp: 1105, atk: 183, def: 93, speed: 106 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_lightmender/ratlightmenderidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_lightmender_rebuke', name: 'Lightmender\'s Rebuke',
        icon: 'assets/icons/fc1471.png',
        description: 'Two shining raps: 76% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.76 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'rat_lightmender_grace', name: 'Lightmender\'s Grace',
        icon: 'assets/icons/fc1112.png',
        description: 'Pour in the light: heals an ally 105% of ATK and cleanses their debuffs.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.05 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'rat_lightmender_communion', name: 'Lightmender\'s Communion',
        icon: 'assets/icons/fc800.png',
        description: 'Shared light: ALL allies heal 55% of ATK plus 1.1% of max HP regen for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.55 },
          { type: 'hot', pct: 0.01, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Lightmender Devotion',
      icon: 'assets/icons/fc1093.png',
      description: 'Healing hands, steadied by faith.',
      hooks: { healBoostAdd: 0.12 },
    },
    positional: POSITIONALS.safe_distance,
  },

  rat_aegisbearer: {
    id: 'rat_aegisbearer',
    element: 'light',
    name: 'Rat Aegisbearer',
    title: 'A shield the sun would envy.',
    rarity: 3,
    stats: { hp: 1114, atk: 158, def: 96, speed: 108 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_aegisbearer/rataegisbeareridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_aegisbearer_check', name: 'Aegisbearer\'s Check',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield checks: 77% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.77 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'rat_aegisbearer_ward', name: 'Aegisbearer\'s Ward',
        icon: 'assets/icons/fc855.png',
        description: 'Raise the aegis over an ally: they take 12% less damage for 2 turns and heal 138% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.88, turns: 2 },
          { type: 'heal', mult: 1.38 },
        ],
      },
      {
        id: 'rat_aegisbearer_vigil', name: 'Aegisbearer\'s Vigil',
        icon: 'assets/icons/fc856.png',
        description: 'The unbroken vigil: ALL allies gain +5% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.05, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Aegisbearer Constancy',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, shields the most wounded ally: takes 10% less damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.9, turns: 1 });
          return null; // silent — small rolling shelter
        },
      },
    },
    positional: POSITIONALS.warding_circle,
  },

  rat_dawnblade: {
    id: 'rat_dawnblade',
    element: 'light',
    name: 'Rat Dawnblade',
    title: 'Morning, sharpened.',
    rarity: 3,
    stats: { hp: 1123, atk: 163, def: 99, speed: 110 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_dawnblade/ratdawnbladeidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_dawnblade_stroke', name: 'Dawnblade Stroke',
        icon: 'assets/icons/fc1587.png',
        description: 'Two dawn-lit strokes: 78% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.78 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'rat_dawnblade_flare', name: 'Dawnblade Flare',
        icon: 'assets/icons/fc1447.png',
        description: 'A flare of morning: 128% ATK, and the light mends 5% of max HP.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.28 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.05 },
        ],
      },
      {
        id: 'rat_dawnblade_zenith', name: 'Dawnblade Zenith',
        icon: 'assets/icons/fc730.png',
        description: 'High noon: 191% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.91 },
        ],
      },
    ],
    passive: {
      name: 'Dawnblade Resolve',
      icon: 'assets/icons/fc1003.png',
      description: 'Heals 3% max HP at turn start while below 65% HP.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp >= 0.65) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.03));
          if (healed <= 0) return null;
          return {
            label: 'Dawnblade Resolve',
            message: `${unit.name}'s light knits ${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#f8d86a' }],
          };
        },
      },
    },
    positional: POSITIONALS.iron_wake,
  },

  rat_sunherald: {
    id: 'rat_sunherald',
    element: 'light',
    name: 'Rat Sunherald',
    title: 'Good news travels armed.',
    rarity: 3,
    stats: { hp: 1132, atk: 168, def: 78, speed: 112 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_sunherald/ratsunheraldidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_sunherald_call', name: 'Sunherald\'s Call',
        icon: 'assets/icons/fc868.png',
        description: 'Two ringing notes: 79% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.79 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'rat_sunherald_proclamation', name: 'Sunherald\'s Proclamation',
        icon: 'assets/icons/fc869.png',
        description: 'Lift an ally: +10% ATK for 2 turns and 6% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.1, turns: 2 },
          { type: 'turnMeter', amount: 0.06 },
        ],
      },
      {
        id: 'rat_sunherald_triumph', name: 'Sunherald\'s Triumph',
        icon: 'assets/icons/fc882.png',
        description: 'Declare the day won: ALL allies gain +5% SPD for 2 turns and 3% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.05, turns: 2 },
          { type: 'turnMeter', amount: 0.03 },
        ],
      },
    ],
    passive: {
      name: 'Sunherald Anthem',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start: ALL allies gain +2% ATK and +2% SPD for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) { a.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.02, turns: 1 }); a.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.02, turns: 1 }); }
          return null; // silent — small rolling anthem
        },
      },
    },
    positional: POSITIONALS.opening_volley,
  },

  rat_lightjudge: {
    id: 'rat_lightjudge',
    element: 'light',
    name: 'Rat Lightjudge',
    title: 'Verdicts delivered in person.',
    rarity: 3,
    stats: { hp: 1141, atk: 173, def: 81, speed: 96 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_lightjudge/ratlightjudgeidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_lightjudge_gavel', name: 'Lightjudge\'s Gavel',
        icon: 'assets/icons/fc1461.png',
        description: 'Two measured blows: 80% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'rat_lightjudge_inquest', name: 'Lightjudge\'s Inquest',
        icon: 'assets/icons/fc862.png',
        description: 'Open the case: 120% ATK and the target takes +14% damage for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.14, turns: 2 },
        ],
      },
      {
        id: 'rat_lightjudge_verdict', name: 'Lightjudge\'s Verdict',
        icon: 'assets/icons/fc744.png',
        description: 'Deliver the verdict: 193% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.93 },
        ],
      },
    ],
    passive: {
      name: 'Lightjudge Justice',
      icon: 'assets/icons/fc863.png',
      description: 'Justice sees clearly: deals 15% extra damage to buffed enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'buff') ? 1.15 : 1;
        },
      },
    },
    positional: POSITIONALS.keystone,
  },

  rat_warpike: {
    id: 'rat_warpike',
    element: 'water',
    name: 'Rat Warpike',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1390, atk: 196, def: 102, speed: 100 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_warpike/ratwarpikeidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_warpike_strike', name: 'Warpike\'s Strike',
        icon: 'assets/icons/fc730.png',
        description: 'Two champion blows: 71% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.71 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'rat_warpike_onslaught', name: 'Warpike\'s Onslaught',
        icon: 'assets/icons/fc1447.png',
        description: 'Press the advantage: 154% ATK, then +7% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.54 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.07, turns: 2 },
        ],
      },
      {
        id: 'rat_warpike_supremacy', name: 'Warpike\'s Supremacy',
        icon: 'assets/icons/fc767.png',
        description: 'Settle it: 205% ATK and -6% DEF for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.05 },
          { type: 'debuff', stat: 'def', mult: 0.94, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Warpike Supremacy',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 5% more and takes 3% less damage.',
      hooks: {
        damageDealtMult() { return 1.05; },
        damageTakenMult() { return 0.97; },
      },
    },
    positional: POSITIONALS.last_stand,
  },

  rat_hexcrown: {
    id: 'rat_hexcrown',
    element: 'fire',
    name: 'Rat Hexcrown',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1402, atk: 202, def: 106, speed: 103 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_hexcrown/rathexcrownidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_hexcrown_bolt', name: 'Hexcrown\'s Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'Twin arcane bolts: 72% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.72 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'rat_hexcrown_torrent', name: 'Hexcrown\'s Torrent',
        icon: 'assets/icons/fc1084.png',
        description: 'A torrent of power: 95% ATK to ALL enemies and -4% SPD for 2 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 2 },
        ],
      },
      {
        id: 'rat_hexcrown_cataclysm', name: 'Hexcrown\'s Cataclysm',
        icon: 'assets/icons/fc1044.png',
        description: 'The big one: 111% ATK to ALL enemies and -7% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.11 },
          { type: 'debuff', stat: 'atk', mult: 0.93, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Hexcrown Resonance',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, arcane bleed sears ALL enemies for 1.5% of this hero\'s ATK.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.effectiveStat('atk') * 0.015));
          for (const e of enemies) Abilities.strike(unit, e, amount);
          return null; // silent — small rolling resonance
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  rat_wallwhisker: {
    id: 'rat_wallwhisker',
    element: 'wind',
    name: 'Rat Wallwhisker',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1414, atk: 208, def: 110, speed: 106 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_wallwhisker/ratwallwhiskeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_wallwhisker_bash', name: 'Wallwhisker\'s Bash',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield strikes: 73% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.73 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'rat_wallwhisker_bulwark', name: 'Wallwhisker\'s Bulwark',
        icon: 'assets/icons/fc855.png',
        description: 'Anchor the line: ALL allies gain +9% DEF for 2 turns and take 3% less damage for 1 turn.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.09, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.97, turns: 1 },
        ],
      },
      {
        id: 'rat_wallwhisker_stand', name: 'Wallwhisker\'s Stand',
        icon: 'assets/icons/fc856.png',
        description: 'Refuse to fall: takes 26% less damage for 2 turns and heals 8% max HP.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.74, turns: 2 },
          { type: 'healHpPct', pct: 0.08 },
        ],
      },
    ],
    passive: {
      name: 'Wallwhisker Aegis',
      icon: 'assets/icons/fc868.png',
      description: 'Takes 15% less damage while above half HP, and 8% less below it.',
      hooks: {
        damageTakenMult(unit) {
          return unit.hp / unit.maxHp > 0.5 ? 0.85 : 0.92;
        },
      },
    },
    positional: POSITIONALS.iron_wake,
  },

  rat_longsight: {
    id: 'rat_longsight',
    element: 'water',
    name: 'Rat Longsight',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1426, atk: 214, def: 114, speed: 109 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_longsight/ratlongsightidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_longsight_shot', name: 'Longsight\'s Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'Two placed shots: 74% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.74 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'rat_longsight_deadeye', name: 'Longsight\'s Deadeye',
        icon: 'assets/icons/fc1516.png',
        description: 'The perfect line: 167% ATK and drains 7% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.67 },
          { type: 'turnMeter', amount: -0.07 },
        ],
      },
      {
        id: 'rat_longsight_barrage', name: 'Longsight\'s Barrage',
        icon: 'assets/icons/fc807.png',
        description: 'Fill the sky: 93% ATK to ALL enemies.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.93 },
          { type: 'turnMeter', amount: -0.01 },
        ],
      },
    ],
    passive: {
      name: 'Longsight Focus',
      icon: 'assets/icons/fc862.png',
      description: 'The shot is already lined up (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.10, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.10, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.snipers_nest,
  },

  rat_mistmender: {
    id: 'rat_mistmender',
    element: 'fire',
    name: 'Rat Mistmender',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1438, atk: 220, def: 118, speed: 112 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_mistmender/ratmistmenderidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_mistmender_touch', name: 'Mistmender\'s Touch',
        icon: 'assets/icons/fc1112.png',
        description: 'Two chastening touches: 75% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'rat_mistmender_blessing', name: 'Mistmender\'s Blessing',
        icon: 'assets/icons/fc800.png',
        description: 'Mend an ally: 12% of max HP plus 1.5% regen for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.12 },
          { type: 'hot', pct: 0.015, turns: 2 },
        ],
      },
      {
        id: 'rat_mistmender_renewal', name: 'Mistmender\'s Renewal',
        icon: 'assets/icons/fc869.png',
        description: 'The circle holds: ALL allies heal 38% of ATK, are cleansed, and gain +4% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.38 },
          { type: 'cleanse' },
          { type: 'buff', stat: 'def', mult: 1.04, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Mistmender Communion',
      icon: 'assets/icons/fc1003.png',
      description: 'Healing woven a little stronger.',
      hooks: { healBoostAdd: 0.13 },
    },
    positional: POSITIONALS.lifeline,
  },

  rat_nullfang: {
    id: 'rat_nullfang',
    element: 'dark',
    name: 'Rat Nullfang',
    title: 'Champion of the Dark',
    rarity: 4,
    stats: { hp: 1450, atk: 226, def: 122, speed: 115 },
    tint: { body: '#241f33', helm: '#3d3350', weapon: '#9a7ad0', skin: '#8a82a0' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_nullfang/ratnullfangidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_nullfang_grasp', name: 'Nullfang\'s Grasp',
        icon: 'assets/icons/fc1444.png',
        description: 'Two grasping shadows: 76% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.76 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'rat_nullfang_devour', name: 'Nullfang\'s Devour',
        icon: 'assets/icons/fc825.png',
        description: 'Feed the void: 149% ATK, healing this hero for 26% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.49 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.26 },
        ],
      },
      {
        id: 'rat_nullfang_oblivion', name: 'Nullfang\'s Oblivion',
        icon: 'assets/icons/fc734.png',
        description: 'Unmake them: 220% ATK and the target takes +16% damage for 1 turn.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.2 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.16, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Nullfang Thirst',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, drains 1% of max HP from the weakest enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          enemies.sort((a, b) => a.hp - b.hp);
          const amount = Math.max(1, Math.round(unit.maxHp * 0.01));
          Abilities.strike(unit, enemies[0], amount);
          unit.heal(amount);
          return null; // silent — small rolling thirst
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  rat_glorytail: {
    id: 'rat_glorytail',
    element: 'light',
    name: 'Rat Glorytail',
    title: 'Champion of the Dawn',
    rarity: 4,
    stats: { hp: 1462, atk: 196, def: 126, speed: 101 },
    tint: { body: '#e0d3a8', helm: '#f5e9c0', weapon: '#ffdf70', skin: '#f0e4c8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_glorytail/ratglorytailidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_glorytail_radiance', name: 'Glorytail\'s Radiance',
        icon: 'assets/icons/fc1471.png',
        description: 'Two radiant strikes: 77% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.77 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'rat_glorytail_benediction', name: 'Glorytail\'s Benediction',
        icon: 'assets/icons/fc1112.png',
        description: 'Bless an ally: heals 14% of max HP and grants 8% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.14 },
          { type: 'turnMeter', amount: 0.08 },
        ],
      },
      {
        id: 'rat_glorytail_ascension', name: 'Glorytail\'s Ascension',
        icon: 'assets/icons/fc855.png',
        description: 'Lift the whole line: ALL allies heal 44% of ATK and gain +5% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.44 },
          { type: 'buff', stat: 'atk', mult: 1.05, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Glorytail Benevolence',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, ALL allies heal 0.4% of this hero\'s max HP and gain a small atk blessing for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) {
            a.heal(Math.round(unit.maxHp * 0.004), unit);
            a.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.02, turns: 1 });
          }
          return null; // silent — small rolling benevolence
        },
      },
    },
    positional: POSITIONALS.pivot_step,
  },

});
