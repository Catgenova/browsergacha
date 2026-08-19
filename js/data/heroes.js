// Hero definitions. Every hero follows the same contract:
//   - 3 active abilities: one no-cooldown, one short cooldown, one long cooldown
//   - 1 passive ability: hooks.onTurnStart(unit, battle) -> null | {
//       label, message, floats: [{ target, text, color }] }
//   - 1 positional bonus, active only in the matching grid position
//   - sprite: spritesheet reference (placeholder art is generated when the
//     PNG is absent — drop real sheets into assets/heroes/ to replace it)
//
// Rarity drives gacha rates and rough stat budgets (3★ < 4★ < 5★).

const HEROES = {
  // ---- 1★ rat cohort ------------------------------------------------------
  // Idle-only art for now; attack/ready/death strips will be added later
  // (attacks gracefully hold idle until then).

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
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Skirmisher: +15% ATK while in a back hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Scrapper: +15% DEF while in a front hex.',
    },
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
      description: 'Deals 15% extra damage while holding a front hex.',
      hooks: {
        damageDealtMult(unit) {
          return unit.slot && unit.slot.position === POSITION.FRONT ? 1.15 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Shield Wall: +15% DEF while in a front hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.15,
      description: 'Lurker: +15% damage dealt from a back hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'damage', mult: 1.15,
      description: 'Bloodlust: +15% damage dealt from a front hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'hp', mult: 1.2,
      description: 'Bulwark: +20% max HP while in the center hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.15,
      description: 'Point of Honor: +15% ATK while in a front hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.2,
      description: 'Standard Bearer: +20% ATK while in the center hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.1,
      description: 'Vanguard: +10% ATK while in a front hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Long Toss: +15% ATK while in a back hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.1,
      description: 'Outrider: +10% SPD while in a back hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.12,
      description: 'Pit Prop: +12% DEF while in a front hex.',
    },
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
        description: 'Serve an ally soup: heals 150% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [{ type: 'heal', mult: 1.5 }],
      },
      {
        id: 'grand_feast', name: 'Grand Feast',
        icon: 'assets/icons/fc800.png',
        description: 'Lay a feast: heals ALL allies for 80% of ATK plus 2% of the Cook\'s max HP for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.8 },
          { type: 'hot', pct: 0.02, turns: 2 },
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
          const healed = target.heal(Math.round(unit.maxHp * 0.03));
          if (healed <= 0) return null;
          return {
            label: "Soup's On",
            message: `${unit.name} slips ${target.name} a snack for ${healed} HP.`,
            floats: [{ target, text: `+${healed}`, color: '#7ae87a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Kitchen Post: +15% DEF while in the center hex.',
    },
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
        description: 'Thrust the brand: 90% ATK and a singe of 8% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'dot', pct: 0.08, turns: 1 },
        ],
      },
      {
        id: 'set_alight', name: 'Set Alight',
        icon: 'assets/icons/fc1050.png',
        description: 'Hit for 80% ATK and burn for 25% ATK per turn for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'dot', pct: 0.25, turns: 2 },
        ],
      },
      {
        id: 'wall_of_flame', name: 'Wall of Flame',
        icon: 'assets/icons/fc1044.png',
        description: 'Ignite ALL enemies: 20% ATK burn per turn for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'dot', pct: 0.20, turns: 2 }],
      },
    ],
    passive: {
      name: 'Kindling',
      icon: 'assets/icons/fc1003.png',
      description: 'His burns cling: damage-over-time he inflicts lasts 1 extra turn.',
      hooks: { dotExtraTurns: 1 },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Beacon: +12% ATK while in the center hex.',
    },
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
      description: 'Takes 12% less damage while holding a front hex.',
      hooks: {
        damageTakenMult(unit) {
          return unit.slot && unit.slot.position === POSITION.FRONT ? 0.88 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.2,
      description: 'Oathkeeper: +20% DEF while in a front hex.',
    },
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
        description: 'Heal an ally for 130% of ATK and cleanse their debuffs.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.3 },
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
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.15,
      description: 'Warded Circle: +15% DEF while in a back hex.',
    },
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
        description: 'Center the self: cleanse own debuffs and recover 25% max HP.',
        cooldown: 5, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'cleanse' },
          { type: 'healHpPct', pct: 0.25 },
        ],
      },
    ],
    passive: {
      name: 'Flow State',
      icon: 'assets/icons/fc882.png',
      description: '+8% chance to take an extra turn after acting.',
      hooks: { extraTurnAdd: 0.08 },
    },
    positional: {
      position: POSITION.CENTER, stat: 'speed', mult: 1.1,
      description: 'Perfect Balance: +10% SPD while in the center hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.18,
      description: 'Firing Line: +18% ATK while in a back hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.12,
      description: 'Ambusher: +12% damage dealt from a back hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Herb Cart: +12% DEF while in the center hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.15,
      description: 'Flagship Post: +15% ATK while in the center hex.',
    },
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
      description: 'Takes 15% less damage while in a back hex.',
      hooks: {
        damageTakenMult(unit) {
          return unit.slot && unit.slot.position === POSITION.BACK ? 0.85 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.15,
      description: 'Night Blade: +15% damage dealt from a back hex.',
    },
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
        description: 'A searing bolt: 80% ATK plus a 10% ATK burn for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'dot', pct: 0.10, turns: 2 },
        ],
      },
      {
        id: 'immolate', name: 'Immolate',
        icon: 'assets/icons/fc1052.png',
        description: 'Hit for 60% ATK and burn for 40% ATK per turn for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.6 },
          { type: 'dot', pct: 0.40, turns: 2 },
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
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Cinder Perch: +15% ATK while in a back hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Tidepool: +12% ATK while in the center hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Storm Perch: +15% ATK while in a back hex.',
    },
  },

  // ---- Bird cohort --------------------------------------------------------
  // Idle-only art for now, like the rats; attack/death strips can land
  // later without kit changes.

  vulture_reaver: {
    id: 'vulture_reaver',
    element: 'wind',
    name: 'Vulture Reaver',
    title: 'Carrion Prince',
    rarity: 1,
    stats: { hp: 850, atk: 112, def: 60, speed: 98 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Vulturereaveridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'peck_and_tear', name: 'Peck & Tear',
        icon: 'assets/icons/fc746.png',
        description: 'Rip for 90% ATK and open a bleed: 12% ATK per turn for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'dot', pct: 0.12, turns: 2 },
        ],
      },
      {
        id: 'carrion_swoop', name: 'Carrion Swoop',
        icon: 'assets/icons/fc763.png',
        description: 'Dive on a foe for 145% ATK.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.45 }],
      },
      {
        id: 'feeding_frenzy', name: 'Feeding Frenzy',
        icon: 'assets/icons/fc800.png',
        description: 'Savage ALL enemies for 75% ATK.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.75 }],
      },
    ],
    passive: {
      name: 'Scavenger',
      icon: 'assets/icons/fc863.png',
      description: 'Smells death: deals 35% extra damage to enemies below 30% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.3 ? 1.35 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Circling: +15% ATK while in a back hex.',
    },
  },

  kingfisher: {
    id: 'kingfisher',
    element: 'water',
    name: 'Kingfisher',
    title: 'River Lancer',
    rarity: 2,
    stats: { hp: 900, atk: 130, def: 70, speed: 105 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Kingfisheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'dive_stab', name: 'Dive Stab',
        icon: 'assets/icons/fc1621.png',
        description: 'A darting thrust for 110% ATK — 25% more against bleeding or poisoned prey.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.1, bonusVs: { kind: 'dot', mult: 1.25 } },
        ],
      },
      {
        id: 'skewer', name: 'Skewer',
        icon: 'assets/icons/fc1622.png',
        description: 'Spear a foe clean through for 160% ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.6 },
        ],
      },
      {
        id: 'riptide_lance', name: 'Riptide Lance',
        icon: 'assets/icons/fc819.png',
        description: 'Sweep a hex row for 110% ATK.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.1 }],
      },
    ],
    passive: {
      name: "Fisher's Patience",
      icon: 'assets/icons/fc719.png',
      description: 'While at full HP, gains +20% crit chance for 1 turn at turn start.',
      hooks: {
        onTurnStart(unit) {
          if (unit.hp < unit.maxHp) return null;
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.20, turns: 1 });
          return null; // silent — patient hunter
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.15,
      description: 'Shallows Hunter: +15% ATK while in a front hex.',
    },
  },

  rook_swordsman: {
    id: 'rook_swordsman',
    element: 'wind',
    name: 'Rook Swordsman',
    title: 'Gallows Blade',
    rarity: 2,
    stats: { hp: 950, atk: 135, def: 75, speed: 100 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Rookswordsmanidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cleave', name: 'Cleave',
        icon: 'assets/icons/fc1447.png',
        description: 'A heavy cleave for 118% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.18 },
        ],
      },
      {
        id: 'cross_cut', name: 'Cross Cut',
        icon: 'assets/icons/fc723.png',
        description: 'A guarded cut: 145% ATK that dulls the foe\'s edge (-10% crit chance for 2 turns).',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.45 },
          { type: 'debuff', stat: 'critChance', add: -0.10, turns: 2 },
        ],
      },
      {
        id: 'murder_stroke', name: 'Murder Stroke',
        icon: 'assets/icons/fc734.png',
        description: 'The mordhau: two strikes of 105% ATK each.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.05 },
          { type: 'damage', mult: 1.05 },
        ],
      },
    ],
    passive: {
      name: 'Corvid Cunning',
      icon: 'assets/icons/fc862.png',
      description: 'Strikes the unready: deals 15% extra damage to enemies below half turn meter.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.turnMeter < CONFIG.TURN_METER_MAX * 0.5 ? 1.15 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'damage', mult: 1.15,
      description: 'Murder\'s Eye: +15% damage dealt from the center hex.',
    },
  },

  rooster_duelist: {
    id: 'rooster_duelist',
    element: 'fire',
    name: 'Rooster Duelist',
    title: 'Dawn Blade',
    rarity: 2,
    stats: { hp: 820, atk: 140, def: 60, speed: 115, critChance: 0.2 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Roosterduelistidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'flurry_peck', name: 'Flurry Peck',
        icon: 'assets/icons/fc1454.png',
        description: 'Four rapid pecks for 28% ATK each.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.28 },
          { type: 'damage', mult: 0.28 },
          { type: 'damage', mult: 0.28 },
          { type: 'damage', mult: 0.28 },
        ],
      },
      {
        id: 'gallant_lunge', name: 'Gallant Lunge',
        icon: 'assets/icons/fc736.png',
        description: 'A gallant advance: 145% ATK and +10% SPD for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.45 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.1, turns: 1 },
        ],
      },
      {
        id: 'crowing_coup', name: 'Crowing Coup',
        icon: 'assets/icons/fc728.png',
        description: 'A finishing flurry: 175% ATK, then crows in triumph: +15% SPD for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.75 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.15, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Strut',
      icon: 'assets/icons/fc868.png',
      description: 'Gains +10% ATK for 1 turn at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.1, turns: 1 });
          return null; // silent - fires every turn
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'damage', mult: 1.15,
      description: 'Center Stage: +15% damage dealt from a front hex.',
    },
  },

  owl_sentinel: {
    id: 'owl_sentinel',
    element: 'light',
    name: 'Owl Sentinel',
    title: 'Watcher of Dawn',
    rarity: 2,
    stats: { hp: 1050, atk: 115, def: 90, speed: 90 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Owlsentinelidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'talon_jab', name: 'Talon Jab',
        icon: 'assets/icons/fc981.png',
        description: 'A talon jab for 102% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.02 },
        ],
      },
      {
        id: 'shield_bash', name: 'Shield Bash',
        icon: 'assets/icons/fc854.png',
        description: 'Slam a foe for 135% ATK and crack armor: -15% DEF for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.35 },
          { type: 'debuff', stat: 'def', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'aegis_of_dawn', name: 'Aegis of Dawn',
        icon: 'assets/icons/fc855.png',
        description: 'Shield the front row: +30% DEF for 2 turns.',
        cooldown: 6, targeting: 'front-allies', animation: 'attack',
        effects: [{ type: 'buff', stat: 'def', mult: 1.3, turns: 2 }],
      },
    ],
    passive: {
      name: 'Vigilant',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 10% less damage from all attacks.',
      hooks: {
        damageTakenMult() {
          return 0.9;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.2,
      description: 'Bulwark of Dawn: +20% DEF while in a front hex.',
    },
  },

  eagle_champion: {
    id: 'eagle_champion',
    element: 'wind',
    name: 'Eagle Champion',
    title: 'Skycrown Marshal',
    rarity: 3,
    stats: { hp: 1250, atk: 170, def: 95, speed: 100 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Eaglechampionidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'hammer_blow', name: 'Hammer Blow',
        icon: 'assets/icons/fc1472.png',
        description: 'A crushing blow: 135% ATK, but the windup costs 12% of his own turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.35 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: -0.12 },
        ],
      },
      {
        id: 'skyfall_smash', name: 'Skyfall Smash',
        icon: 'assets/icons/fc1044.png',
        description: 'Bring the hammer down for 160% ATK.',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'slam',
        effects: [{ type: 'damage', mult: 1.6 }],
      },
      {
        id: 'judgment_peak', name: 'Judgment Peak',
        icon: 'assets/icons/fc767.png',
        description: 'The marshal\'s verdict: 210% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack', impact: 'slam',
        effects: [{ type: 'damage', mult: 2.1 }],
      },
    ],
    passive: {
      name: "Champion's Might",
      icon: 'assets/icons/fc869.png',
      description: 'Deals 25% extra damage while himself at full HP.',
      hooks: {
        damageDealtMult(unit) {
          return unit.hp >= unit.maxHp ? 1.25 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.2,
      description: 'Skycrown Banner: +20% ATK while in the center hex.',
    },
  },

  raven_hexer: {
    id: 'raven_hexer',
    element: 'dark',
    name: 'Raven Hexer',
    title: 'Nightfeather Warlock',
    rarity: 3,
    stats: { hp: 1100, atk: 165, def: 80, speed: 108 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Ravenhexeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'hex_bolt', name: 'Hex Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'A croaking bolt: 85% ATK and -8% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
          { type: 'debuff', stat: 'speed', mult: 0.92, turns: 1 },
        ],
      },
      {
        id: 'withering_curse', name: 'Withering Curse',
        icon: 'assets/icons/fc1052.png',
        description: 'Deals 120% ATK and saps strength: -20% ATK for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'debuff', stat: 'atk', mult: 0.8, turns: 2 },
        ],
      },
      {
        id: 'nights_descent', name: "Night's Descent",
        icon: 'assets/icons/fc1053.png',
        description: 'Deals 150% ATK and marks the target: +25% damage taken for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.5 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.25, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Dark Omen',
      icon: 'assets/icons/fc1084.png',
      description: '+25% debuff accuracy.',
      hooks: { accuracyAdd: 0.25 },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.15,
      description: 'Night Roost: +15% damage dealt from a back hex.',
    },
  },


  // ---- Placeholder avian cohort (filling the roster to 25) ---------------
  // Procedural placeholder art renders until real idle sheets land at the
  // conventional flat paths (assets/heroes/<Name>idle.png).

  sparrow_scrapper: {
    id: 'sparrow_scrapper',
    element: 'wind',
    name: 'Sparrow Scrapper',
    title: 'Small but Furious',
    rarity: 1,
    stats: { hp: 730, atk: 111, def: 57, speed: 103 },
    tint: { body: '#8a6a4a', helm: '#a8845a', weapon: '#c8c0b0', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Sparrowscrapperidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'peck_flurry', name: 'Peck Flurry',
        icon: 'assets/icons/fc746.png',
        description: 'Three furious pecks for 32% ATK each.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.32 },
          { type: 'damage', mult: 0.32 },
          { type: 'damage', mult: 0.32 },
        ],
      },
      {
        id: 'dust_up', name: 'Dust-Up',
        icon: 'assets/icons/fc744.png',
        description: 'A whirl of feathers: 132% ATK, then darts clear: +8% SPD for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.32 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.08, turns: 1 },
        ],
      },
      {
        id: 'defiant_chirp', name: 'Defiant Chirp',
        icon: 'assets/icons/fc869.png',
        description: 'Refuses to be small: +25% ATK and +5% crit chance for 2 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.25, turns: 2 },
          { type: 'buff', stat: 'critChance', add: 0.05, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Underdog',
      icon: 'assets/icons/fc863.png',
      description: 'Punches up: deals 20% extra damage to enemies with more current HP than him.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.hp > unit.hp ? 1.2 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Hedge Cover: +12% ATK while in a back hex.',
    },
  },

  pelican_porter: {
    id: 'pelican_porter',
    element: 'water',
    name: 'Pelican Porter',
    title: 'The Pouch Provides',
    rarity: 1,
    stats: { hp: 870, atk: 102, def: 71, speed: 92 },
    tint: { body: '#e8e0d8', helm: '#e8a83a', weapon: '#c8b898', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Pelicanporteridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'beak_scoop', name: 'Beak Scoop',
        icon: 'assets/icons/fc1471.png',
        description: 'A scooping blow for 93% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.93 },
        ],
      },
      {
        id: 'fish_delivery', name: 'Fish Delivery',
        icon: 'assets/icons/fc1112.png',
        description: 'Fresh from the pouch: heals an ally for 135% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.35 },
        ],
      },
      {
        id: 'pouch_toss', name: 'Pouch Toss',
        icon: 'assets/icons/fc800.png',
        description: 'Hurl an ally onward: heals 90% of ATK and grants 15% turn meter.',
        cooldown: 6, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.9 },
          { type: 'turnMeter', amount: 0.15 },
        ],
      },
    ],
    passive: {
      name: 'Deep Pouch',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, slips the most wounded ally a fish: 2% of his max HP regen for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team)
            .filter((u) => u !== unit && u.hp < u.maxHp);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'hot',
            amount: Math.round(unit.maxHp * 0.02), turns: 1 });
          return null; // silent — small rolling gift
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Fish Stand: +12% DEF while in the center hex.',
    },
  },

  heron_spearfisher: {
    id: 'heron_spearfisher',
    element: 'water',
    name: 'Heron Spearfisher',
    title: 'Stillness, Then Supper',
    rarity: 1,
    stats: { hp: 790, atk: 113, def: 63, speed: 97 },
    tint: { body: '#7a8a9a', helm: '#9aaab8', weapon: '#d8d8e0', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Heronspearfisheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'spear_snap', name: 'Spear Snap',
        icon: 'assets/icons/fc1461.png',
        description: 'A snapping thrust for 104% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.04 },
        ],
      },
      {
        id: 'patient_strike', name: 'Patient Strike',
        icon: 'assets/icons/fc1791.png',
        description: 'The long wait pays: 155% ATK, and the poise grants +20% crit damage for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.55 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critDamage', add: 0.2, turns: 1 },
        ],
      },
      {
        id: 'skewering_dive', name: 'Skewering Dive',
        icon: 'assets/icons/fc1621.png',
        description: 'Spear through the shallows: 165% ATK and -12% DEF for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.65 },
          { type: 'debuff', stat: 'def', mult: 0.88, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Still Water',
      icon: 'assets/icons/fc862.png',
      description: 'Strikes untroubled water: deals 18% extra damage to enemies with no status effects.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.length === 0 ? 1.18 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Reed Stand: +15% ATK while in a back hex.',
    },
  },

  finch_whistler: {
    id: 'finch_whistler',
    element: 'wind',
    name: 'Finch Whistler',
    title: 'Six Grams of Morale',
    rarity: 1,
    stats: { hp: 760, atk: 103, def: 64, speed: 100 },
    tint: { body: '#c8a83a', helm: '#e8c85a', weapon: '#e8d8a8', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Finchwhistleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'sharp_note', name: 'Sharp Note',
        icon: 'assets/icons/fc1003.png',
        description: 'A piercing note: 83% ATK that drains 6% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.83 },
          { type: 'turnMeter', amount: -0.06 },
        ],
      },
      {
        id: 'rallying_trill', name: 'Rallying Trill',
        icon: 'assets/icons/fc868.png',
        description: 'A bright trill: an ally gains +20% ATK for 2 turns and heals 40% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.2, turns: 2 },
          { type: 'heal', mult: 0.4 },
        ],
      },
      {
        id: 'chorus_of_dawn', name: 'Chorus of Dawn',
        icon: 'assets/icons/fc869.png',
        description: 'The dawn chorus: ALL allies heal 60% of ATK and gain +6% SPD for 1 turn.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.6 },
          { type: 'buff', stat: 'speed', mult: 1.06, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Cheerful Song',
      icon: 'assets/icons/fc882.png',
      description: 'Whenever an ally is healed, the Finch gains +5% ATK for 1 turn.',
      hooks: {
        onAllyHealed(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.05, turns: 1 });
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.1,
      description: 'Songperch: +10% SPD while in a back hex.',
    },
  },

  duck_sapper: {
    id: 'duck_sapper',
    element: 'fire',
    name: 'Duck Sapper',
    title: 'Quack Goes the Wall',
    rarity: 1,
    stats: { hp: 820, atk: 115, def: 66, speed: 94 },
    tint: { body: '#4a6a3a', helm: '#6a8a4a', weapon: '#a8a098', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Ducksapperidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bomb_toss', name: 'Bomb Toss',
        icon: 'assets/icons/fc981.png',
        description: 'A lobbed charge: 85% ATK plus a 9% ATK burn for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
          { type: 'dot', pct: 0.09, turns: 1 },
        ],
      },
      {
        id: 'satchel_charge', name: 'Satchel Charge',
        icon: 'assets/icons/fc1044.png',
        description: 'Set and run: 130% ATK and -15% DEF for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
          { type: 'debuff', stat: 'def', mult: 0.85, turns: 1 },
        ],
      },
      {
        id: 'powder_keg', name: 'Powder Keg',
        icon: 'assets/icons/fc1050.png',
        description: 'The big one: 80% ATK to ALL enemies plus a 12% ATK burn for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'dot', pct: 0.12, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Sputtering Fuse',
      icon: 'assets/icons/fc1052.png',
      description: 'At turn start, 20% chance a stray spark burns a random enemy (8% of his ATK for 1 turn).',
      hooks: {
        onTurnStart(unit, battle) {
          if (Math.random() >= 0.20) return null;
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          target.addStatusEffect({ kind: 'dot',
            amount: Math.max(1, Math.round(unit.effectiveStat('atk') * 0.08)), turns: 1 });
          return {
            label: 'Sputtering Fuse',
            message: `${unit.name}'s stray spark catches ${target.name}.`,
            floats: [{ target, text: 'BURNING', color: '#e8843a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Demolition Range: +12% ATK while in a back hex.',
    },
  },

  magpie_filcher: {
    id: 'magpie_filcher',
    element: 'fire',
    name: 'Magpie Filcher',
    title: 'Everything Shiny Is Hers',
    rarity: 1,
    stats: { hp: 740, atk: 117, def: 58, speed: 105 },
    tint: { body: '#2a2a3a', helm: '#e8e8f8', weapon: '#e8c83a', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Magpiefilcheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snatch_peck', name: 'Snatch Peck',
        icon: 'assets/icons/fc1444.png',
        description: 'A thieving peck: 95% ATK and 6% turn meter pocketed.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.06 },
        ],
      },
      {
        id: 'steal_shine', name: 'Steal Shine',
        icon: 'assets/icons/fc825.png',
        description: 'Steals the gleam from their eye: 115% ATK and -10% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.15 },
          { type: 'debuff', stat: 'critChance', add: -0.1, turns: 1 },
        ],
      },
      {
        id: 'treasure_dive', name: 'Treasure Dive',
        icon: 'assets/icons/fc728.png',
        description: 'Dives for the prize: 180% ATK, then gloats: +10% ATK for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.8 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.1, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Shiny Snatcher',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 20% extra damage to buffed enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'buff') ? 1.2 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.12,
      description: 'Getaway Perch: +12% damage dealt from a back hex.',
    },
  },

  woodpecker_driller: {
    id: 'woodpecker_driller',
    element: 'fire',
    name: 'Woodpecker Driller',
    title: 'Headache Included',
    rarity: 1,
    stats: { hp: 780, atk: 119, def: 61, speed: 96 },
    tint: { body: '#8a2a2a', helm: '#e8e8f8', weapon: '#c8c0b0', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Woodpeckerdrilleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'drill_peck', name: 'Drill Peck',
        icon: 'assets/icons/fc746.png',
        description: 'Two hammering pecks for 52% ATK each.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.52 },
          { type: 'damage', mult: 0.52 },
        ],
      },
      {
        id: 'hammering_burst', name: 'Hammering Burst',
        icon: 'assets/icons/fc763.png',
        description: 'A drumroll of four blows for 42% ATK each.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.42 },
          { type: 'damage', mult: 0.42 },
          { type: 'damage', mult: 0.42 },
          { type: 'damage', mult: 0.42 },
        ],
      },
      {
        id: 'trepanation', name: 'Trepanation',
        icon: 'assets/icons/fc734.png',
        description: 'Drill to the quick: 145% ATK and the target takes +30% damage for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.45 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.3, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Relentless Drumming',
      icon: 'assets/icons/fc867.png',
      description: 'Gains +6% crit chance and +6% crit damage for 1 turn at each turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.06, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.06, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Braced Tail: +12% ATK while in a front hex.',
    },
  },

  gull_raider: {
    id: 'gull_raider',
    element: 'water',
    name: 'Gull Raider',
    title: 'Your Chips Are Forfeit',
    rarity: 1,
    stats: { hp: 765, atk: 109, def: 60, speed: 99 },
    tint: { body: '#d8d8e0', helm: '#a8a8b8', weapon: '#c8c0b0', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Gullraideridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'swoop_grab', name: 'Swoop Grab',
        icon: 'assets/icons/fc1447.png',
        description: 'A grabbing swoop for 92% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.92 },
        ],
      },
      {
        id: 'mob_dive', name: 'Mob Dive',
        icon: 'assets/icons/fc763.png',
        description: 'The flock joins in: 138% ATK and drains 8% turn meter.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.38 },
          { type: 'turnMeter', amount: -0.08 },
        ],
      },
      {
        id: 'squall_screech', name: 'Squall Screech',
        icon: 'assets/icons/fc807.png',
        description: 'An ear-splitting squall: 50% ATK to ALL enemies and -5% ATK for 1 turn.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.5 },
          { type: 'debuff', stat: 'atk', mult: 0.95, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Mob Tactics',
      icon: 'assets/icons/fc862.png',
      description: 'Deals 3% extra damage for each living ally (up to +18%).',
      hooks: {
        damageDealtMult(unit) {
          if (typeof Battle === 'undefined' || !Battle.active) return 1;
          const allies = Battle.active.livingUnits(unit.team).length - 1;
          return 1 + Math.min(6, Math.max(0, allies)) * 0.03;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.12,
      description: 'Updraft: +12% SPD while in a back hex.',
    },
  },

  crane_dancer: {
    id: 'crane_dancer',
    element: 'water',
    name: 'Crane Dancer',
    title: 'Poise as a Weapon',
    rarity: 2,
    stats: { hp: 880, atk: 127, def: 73, speed: 107 },
    tint: { body: '#e8e8f8', helm: '#8a2a2a', weapon: '#c8c0b0', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Cranedanceridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'crane_kick', name: 'Crane Kick',
        icon: 'assets/icons/fc663.png',
        description: 'A snapping kick for 107% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.07 },
        ],
      },
      {
        id: 'sweeping_wing', name: 'Sweeping Wing',
        icon: 'assets/icons/fc729.png',
        description: 'A wing sweep across a hex row: 95% ATK, flowing into +5% SPD for 1 turn.',
        cooldown: 3, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.05, turns: 1 },
        ],
      },
      {
        id: 'water_mirror_dance', name: 'Water Mirror Dance',
        icon: 'assets/icons/fc882.png',
        description: 'A dance on still water: takes 25% less damage and +15% SPD for 2 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.75, turns: 2 },
          { type: 'buff', stat: 'speed', mult: 1.15, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Poised Grace',
      icon: 'assets/icons/fc868.png',
      description: '+12% chance to dodge while at full HP.',
      hooks: {
        dodgeAdd(unit) {
          return unit.hp >= unit.maxHp ? 0.12 : 0;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'speed', mult: 1.12,
      description: 'Stage Center: +12% SPD while in the center hex.',
    },
  },

  falcon_diver: {
    id: 'falcon_diver',
    element: 'wind',
    name: 'Falcon Diver',
    title: 'Two Hundred Miles an Hour of Opinion',
    rarity: 2,
    stats: { hp: 850, atk: 139, def: 64, speed: 113 },
    tint: { body: '#5a5a6a', helm: '#8a8a9a', weapon: '#c8c0b0', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Falcondiveridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'talon_rake', name: 'Talon Rake',
        icon: 'assets/icons/fc1444.png',
        description: 'A raking pass for 103% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.03 },
        ],
      },
      {
        id: 'stoop', name: 'Stoop',
        icon: 'assets/icons/fc825.png',
        description: 'A blinding dive: 175% ATK, but pulling up costs 10% of his own meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.75 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: -0.1 },
        ],
      },
      {
        id: 'terminal_velocity', name: 'Terminal Velocity',
        icon: 'assets/icons/fc734.png',
        description: 'The full drop: 215% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.15 },
        ],
      },
    ],
    passive: {
      name: 'Wind Rider',
      icon: 'assets/icons/fc882.png',
      description: '+10% chance to take an extra turn after acting.',
      hooks: { extraTurnAdd: 0.10 },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.15,
      description: 'High Perch: +15% damage dealt from a back hex.',
    },
  },

  parrot_mimic: {
    id: 'parrot_mimic',
    element: 'fire',
    name: 'Parrot Mimic',
    title: 'Repeats Your Worst Ideas',
    rarity: 2,
    stats: { hp: 830, atk: 131, def: 67, speed: 104 },
    tint: { body: '#2a8a4a', helm: '#e8433a', weapon: '#e8c83a', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Parrotmimicidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'mocking_jab', name: 'Mocking Jab',
        icon: 'assets/icons/fc663.png',
        description: 'An insulting jab: 88% ATK and -4% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.88 },
          { type: 'debuff', stat: 'atk', mult: 0.96, turns: 1 },
        ],
      },
      {
        id: 'copied_technique', name: 'Copied Technique',
        icon: 'assets/icons/fc723.png',
        description: 'Their own move, better: 150% ATK — 35% more against buffed enemies.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.5, bonusVs: { kind: 'buff', mult: 1.35 } },
        ],
      },
      {
        id: 'cacophony', name: 'Cacophony',
        icon: 'assets/icons/fc1084.png',
        description: 'Every voice at once: ALL enemies lose 8% crit chance for 1 turn and 4% turn meter.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'critChance', add: -0.08, turns: 1 },
          { type: 'turnMeter', amount: -0.04 },
        ],
      },
    ],
    passive: {
      name: 'Echoed Insults',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, a random enemy loses 5% crit chance for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          target.addStatusEffect({ kind: 'debuff', stat: 'critChance', add: -0.05, turns: 1 });
          return null; // silent — small rolling malus
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Soapbox: +12% ATK while in the center hex.',
    },
  },

  goose_bruiser: {
    id: 'goose_bruiser',
    element: 'water',
    name: 'Goose Bruiser',
    title: 'Peace Was Never an Option',
    rarity: 2,
    stats: { hp: 1010, atk: 124, def: 86, speed: 93 },
    tint: { body: '#d8d8d0', helm: '#e8843a', weapon: '#c8c0b0', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Goosebruiseridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wing_slap', name: 'Wing Slap',
        icon: 'assets/icons/fc762.png',
        description: 'A humiliating slap for 117% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.17 },
        ],
      },
      {
        id: 'honking_charge', name: 'Honking Charge',
        icon: 'assets/icons/fc869.png',
        description: 'An outraged charge: 128% ATK, wings wide: +12% DEF for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.28 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.12, turns: 1 },
        ],
      },
      {
        id: 'breakwater_stand', name: 'Breakwater Stand',
        icon: 'assets/icons/fc855.png',
        description: 'Holds the shore: front-hex allies gain +15% DEF for 2 turns and 5% turn meter.',
        cooldown: 6, targeting: 'front-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.15, turns: 2 },
          { type: 'turnMeter', amount: 0.05 },
        ],
      },
    ],
    passive: {
      name: 'Down Padding',
      icon: 'assets/icons/fc856.png',
      description: 'At turn start, recovers 2% max HP and gains +4% DEF for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.heal(Math.round(unit.maxHp * 0.02));
          unit.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.04, turns: 1 });
          return null; // silent — small rolling padding
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Beach Head: +15% DEF while in a front hex.',
    },
  },

  hawk_lancer: {
    id: 'hawk_lancer',
    element: 'fire',
    name: 'Hawk Lancer',
    title: 'The Sky Has a Point',
    rarity: 2,
    stats: { hp: 910, atk: 137, def: 71, speed: 103 },
    tint: { body: '#7a5a3a', helm: '#9a7a4a', weapon: '#d8d8e0', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Hawklanceridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'lance_dive', name: 'Lance Dive',
        icon: 'assets/icons/fc1461.png',
        description: 'A diving thrust for 120% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
        ],
      },
      {
        id: 'wingover_thrust', name: 'Wingover Thrust',
        icon: 'assets/icons/fc1791.png',
        description: 'A rolling thrust: 140% ATK, carrying speed: +7% SPD for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.4 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.07, turns: 2 },
        ],
      },
      {
        id: 'sunward_spiral', name: 'Sunward Spiral',
        icon: 'assets/icons/fc1044.png',
        description: 'Climb and fall burning: 170% ATK plus a 15% ATK burn for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.7 },
          { type: 'dot', pct: 0.15, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Talon Grip',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 25% extra damage to weakened (ATK-debuffed) enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'debuff' && fx.stat === 'atk') ? 1.25 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Thermal Column: +15% ATK while in a back hex.',
    },
  },

  swan_guardian: {
    id: 'swan_guardian',
    element: 'water',
    name: 'Swan Guardian',
    title: 'Grace, Weaponized',
    rarity: 2,
    stats: { hp: 1040, atk: 119, def: 90, speed: 91 },
    tint: { body: '#f8f0e8', helm: '#e8c83a', weapon: '#d8d8e0', shield: '#a8c8e8', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Swanguardianidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'white_wing_strike', name: 'White Wing Strike',
        icon: 'assets/icons/fc854.png',
        description: 'A guarded strike: 94% ATK, wings folded: takes 6% less damage until next turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.94 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.94, turns: 1 },
        ],
      },
      {
        id: 'sheltering_wings', name: 'Sheltering Wings',
        icon: 'assets/icons/fc855.png',
        description: 'Wrap an ally in white: they take 20% less damage for 1 turn and heal 30% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.8, turns: 1 },
          { type: 'heal', mult: 0.3 },
        ],
      },
      {
        id: 'lake_aegis', name: 'Lake Aegis',
        icon: 'assets/icons/fc1112.png',
        description: 'The still lake rises: ALL allies take 8% less damage for 2 turns and heal 30% of ATK.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.92, turns: 2 },
          { type: 'heal', mult: 0.3 },
        ],
      },
    ],
    passive: {
      name: 'Graceful Bulwark',
      icon: 'assets/icons/fc856.png',
      description: 'At turn start, shields the most wounded ally: takes 10% less damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.9, turns: 1 });
          return null; // silent — small rolling shield
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Lake Heart: +15% DEF while in the center hex.',
    },
  },

  phoenix_ascendant: {
    id: 'phoenix_ascendant',
    element: 'fire',
    name: 'Phoenix Ascendant',
    title: 'Dies Occasionally, Never Permanently',
    rarity: 3,
    stats: { hp: 1120, atk: 179, def: 83, speed: 105 },
    tint: { body: '#e8632a', helm: '#f8a83a', weapon: '#f8c84a', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Phoenixascendantidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'ember_wing', name: 'Ember Wing',
        icon: 'assets/icons/fc981.png',
        description: 'A burning wingtip: 102% ATK plus a 10% ATK burn for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.02 },
          { type: 'dot', pct: 0.1, turns: 1 },
        ],
      },
      {
        id: 'immolating_embrace', name: 'Immolating Embrace',
        icon: 'assets/icons/fc1050.png',
        description: 'Hold them close: 120% ATK plus a 35% ATK burn for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'dot', pct: 0.35, turns: 2 },
        ],
      },
      {
        id: 'supernova', name: 'Supernova',
        icon: 'assets/icons/fc1044.png',
        description: 'Go nova: 100% ATK to ALL enemies, and the afterglow mends her: 4% max HP regen for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
        ],
        selfEffects: [
          { type: 'hot', pct: 0.04, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Rebirth Embers',
      icon: 'assets/icons/fc1003.png',
      description: 'Once per battle, at turn start below 20% HP, the embers reignite: heals 25% max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.embersSpent || unit.hp / unit.maxHp >= 0.2) return null;
          unit.embersSpent = true;
          const healed = unit.heal(Math.round(unit.maxHp * 0.25));
          return {
            label: 'Rebirth Embers',
            message: `${unit.name} reignites for ${healed} HP!`,
            floats: [{ target: unit, text: `+${healed}`, color: '#f8a83a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.15,
      description: 'Pyre Heart: +15% ATK while in the center hex.',
    },
  },

  albatross_stormrider: {
    id: 'albatross_stormrider',
    element: 'wind',
    name: 'Albatross Stormrider',
    title: 'Ten Thousand Miles of Bad Weather',
    rarity: 3,
    stats: { hp: 1160, atk: 171, def: 87, speed: 102 },
    tint: { body: '#8a9ab8', helm: '#a8b8d8', weapon: '#e8e8f8', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Albatrossstormrideridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wind_shear', name: 'Wind Shear',
        icon: 'assets/icons/fc1030.png',
        description: 'A shearing gust: 97% ATK that drains 9% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.97 },
          { type: 'turnMeter', amount: -0.09 },
        ],
      },
      {
        id: 'crosswind', name: 'Crosswind',
        icon: 'assets/icons/fc724.png',
        description: 'A crosswind rakes a hex row: 110% ATK and -8% SPD for 1 turn.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.1 },
          { type: 'debuff', stat: 'speed', mult: 0.92, turns: 1 },
        ],
      },
      {
        id: 'eye_of_the_storm', name: 'Eye of the Storm',
        icon: 'assets/icons/fc807.png',
        description: 'The storm lands: 75% ATK to ALL enemies and -7% meter, while he rides the calm: +10% SPD for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'turnMeter', amount: -0.07 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.1, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Storm Static',
      icon: 'assets/icons/fc882.png',
      description: 'At turn start, static arcs off him: ALL enemies take 2% of his ATK as damage.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.effectiveStat('atk') * 0.02));
          for (const e of enemies) e.takeDamage(amount);
          return {
            label: 'Storm Static',
            message: `${unit.name}'s static arcs across the field.`,
            floats: enemies.map((e) => ({ target: e, text: `-${amount}`, color: '#a8b8d8' })),
          };
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Weather Deck: +15% ATK while in a back hex.',
    },
  },

  peacock_radiant: {
    id: 'peacock_radiant',
    element: 'fire',
    name: 'Peacock Radiant',
    title: 'A Hundred Eyes, All Judging',
    rarity: 3,
    stats: { hp: 1080, atk: 183, def: 79, speed: 107 },
    tint: { body: '#2a6a8a', helm: '#2a8a6a', weapon: '#e8c83a', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Peacockradiantidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'fan_flash', name: 'Fan Flash',
        icon: 'assets/icons/fc1084.png',
        description: 'A dazzling flash: 91% ATK and -6% crit chance for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.91 },
          { type: 'debuff', stat: 'critChance', add: -0.06, turns: 1 },
        ],
      },
      {
        id: 'hundred_eyes', name: 'Hundred Eyes',
        icon: 'assets/icons/fc862.png',
        description: 'The tail stares back: 155% ATK and -13% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.55 },
          { type: 'debuff', stat: 'atk', mult: 0.87, turns: 2 },
        ],
      },
      {
        id: 'royal_display', name: 'Royal Display',
        icon: 'assets/icons/fc869.png',
        description: 'The full fan: ALL allies gain +12% ATK and +6% crit chance for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.12, turns: 2 },
          { type: 'buff', stat: 'critChance', add: 0.06, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Iridescence',
      icon: 'assets/icons/fc868.png',
      description: 'Gains +8% SPD and +8% crit chance for 1 turn at each turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.08, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.08, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.15,
      description: 'Display Mound: +15% ATK while in the center hex.',
    },
  },

  stork_lifebringer: {
    id: 'stork_lifebringer',
    element: 'water',
    name: 'Stork Lifebringer',
    title: 'Deliveries in All Weather',
    rarity: 3,
    stats: { hp: 1210, atk: 162, def: 92, speed: 98 },
    tint: { body: '#f8f0e8', helm: '#e8433a', weapon: '#c8b898', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Storklifebringeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'long_beak_jab', name: 'Long Beak Jab',
        icon: 'assets/icons/fc1461.png',
        description: 'A long-reach jab: 96% ATK that steadies her for 12% of ATK in healing.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.12 },
        ],
      },
      {
        id: 'bundle_of_life', name: 'Bundle of Life',
        icon: 'assets/icons/fc1112.png',
        description: 'A well-wrapped delivery: heals an ally 15% of her max HP plus 2% regen for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.15 },
          { type: 'hot', pct: 0.02, turns: 2 },
        ],
      },
      {
        id: 'first_breath', name: 'First Breath',
        icon: 'assets/icons/fc855.png',
        description: 'The oldest delivery of all: revives a fallen ally at 35% HP.',
        cooldown: 7, targeting: 'dead-ally', animation: 'attack',
        effects: [
          { type: 'revive', pct: 0.35 },
        ],
      },
    ],
    passive: {
      name: 'Deliverance',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, any ally below 30% HP receives 4% of her max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          const dying = battle.livingUnits(unit.team)
            .filter((u) => u.hp / u.maxHp < 0.3);
          if (dying.length === 0) return null;
          let total = 0;
          for (const ally of dying) total += ally.heal(Math.round(unit.maxHp * 0.04));
          if (total <= 0) return null;
          return {
            label: 'Deliverance',
            message: `${unit.name} delivers ${total} HP to the faltering.`,
            floats: [],
          };
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.15,
      description: 'Rooftop Nest: +15% DEF while in a back hex.',
    },
  },

  // ---- Minotaur cohort ----------------------------------------------------
  // Bonefield natives; idle-only art for now.

  minotaur_warrior: {
    id: 'minotaur_warrior',
    element: 'fire',
    name: 'Minotaur Warrior',
    title: 'Maze Soldier',
    rarity: 1,
    stats: { hp: 880, atk: 110, def: 70, speed: 92 },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurwarrioridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'maze_slash', name: 'Maze Slash',
        icon: 'assets/icons/fc1447.png',
        description: 'A wide slash for 112% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.12 },
        ],
      },
      {
        id: 'war_cleave', name: 'War Cleave',
        icon: 'assets/icons/fc730.png',
        description: 'Cleave a hex row for 90% ATK.',
        cooldown: 3, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
        ],
      },
      {
        id: 'rallying_bellow', name: 'Rallying Bellow',
        icon: 'assets/icons/fc869.png',
        description: 'Bellow with fury: +30% ATK for 2 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [{ type: 'buff', stat: 'atk', mult: 1.3, turns: 2 }],
      },
    ],
    passive: {
      name: 'Stubborn',
      icon: 'assets/icons/fc867.png',
      description: 'Gains +8% DEF for 1 turn at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.08, turns: 1 });
          return null; // silent - fires every turn
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Shield Line: +15% DEF while in a front hex.',
    },
  },

  minotaur_bruiser: {
    id: 'minotaur_bruiser',
    element: 'water',
    name: 'Minotaur Bruiser',
    title: 'Maze Muscle',
    rarity: 1,
    stats: { hp: 950, atk: 105, def: 75, speed: 88 },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurbruiseridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'pummel', name: 'Pummel',
        icon: 'assets/icons/fc663.png',
        description: 'A flurry of three blows for 35% ATK each.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.35 },
          { type: 'damage', mult: 0.35 },
          { type: 'damage', mult: 0.35 },
        ],
      },
      {
        id: 'headbutt', name: 'Headbutt',
        icon: 'assets/icons/fc762.png',
        description: 'A concussive headbutt: 125% ATK that drains 15% turn meter.',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.25 },
          { type: 'turnMeter', amount: -0.15 },
        ],
      },
      {
        id: 'ground_stomp', name: 'Ground Stomp',
        icon: 'assets/icons/fc767.png',
        description: 'Shake a hex row for 75% ATK.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack', impact: 'slam',
        effects: [{ type: 'damage', mult: 0.75 }],
      },
    ],
    passive: {
      name: 'Thick Skull',
      icon: 'assets/icons/fc1112.png',
      description: 'Dense bone: takes 20% less damage while above 90% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.hp / unit.maxHp > 0.9 ? 0.8 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'hp', mult: 1.15,
      description: 'Immovable: +15% max HP while in a front hex.',
    },
  },

  minotaur_guard: {
    id: 'minotaur_guard',
    element: 'water',
    name: 'Minotaur Guard',
    title: 'Gate Warden',
    rarity: 2,
    stats: { hp: 1100, atk: 115, def: 95, speed: 85 },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurgaurdidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'shield_strike', name: 'Shield Strike',
        icon: 'assets/icons/fc854.png',
        description: 'A shield shove: 95% ATK that drains 5% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
      {
        id: 'bulwark_slam', name: 'Bulwark Slam',
        icon: 'assets/icons/fc1476.png',
        description: 'A jarring slam: 130% ATK that saps -12% ATK for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
          { type: 'debuff', stat: 'atk', mult: 0.88, turns: 2 },
        ],
      },
      {
        id: 'phalanx_wall', name: 'Phalanx Wall',
        icon: 'assets/icons/fc855.png',
        description: 'Lock shields: front-hex allies take 20% less damage for 2 turns.',
        cooldown: 6, targeting: 'front-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.8, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Warden\'s Resolve',
      icon: 'assets/icons/fc856.png',
      description: 'A wall to the last: takes 25% less damage while below 30% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.alive && unit.hp / unit.maxHp < 0.3 ? 0.75 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.2,
      description: 'Gatekeeper: +20% DEF while in a front hex.',
    },
  },

  minotaur_crossbowman: {
    id: 'minotaur_crossbowman',
    element: 'wind',
    name: 'Minotaur Crossbowman',
    title: 'Maze Sharpshooter',
    rarity: 2,
    stats: { hp: 850, atk: 140, def: 60, speed: 105 },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurcrossbowmanidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bolt', name: 'Bolt',
        icon: 'assets/icons/fc1481.png',
        description: 'A snap shot for 100% ATK — 35% more against exposed (vulnerability-marked) targets.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0, bonusVs: { stat: 'damageTaken', mult: 1.35 } },
        ],
      },
      {
        id: 'piercing_bolt', name: 'Piercing Bolt',
        icon: 'assets/icons/fc1484.png',
        description: 'An armor-punching bolt: 140% ATK — 50% more against weakened armor.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.4, bonusVs: { stat: 'def', mult: 1.5 } },
        ],
      },
      {
        id: 'bolt_storm', name: 'Bolt Storm',
        icon: 'assets/icons/fc814.png',
        description: 'Rake ALL enemies for 80% ATK.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.8 }],
      },
    ],
    passive: {
      name: 'Deadeye',
      icon: 'assets/icons/fc719.png',
      description: 'Gains +25% crit damage for 1 turn at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.25, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Overwatch: +15% ATK while in a back hex.',
    },
  },

  minotaur_gladiator: {
    id: 'minotaur_gladiator',
    element: 'fire',
    name: 'Minotaur Gladiator',
    title: 'Arena Idol',
    rarity: 2,
    stats: { hp: 920, atk: 138, def: 68, speed: 108 },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurgladiatoridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'arena_strike', name: 'Arena Strike',
        icon: 'assets/icons/fc1527.png',
        description: 'Strike for 100% ATK as the crowd roars: +10% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.1, turns: 1 },
        ],
      },
      {
        id: 'crowd_pleaser', name: 'Crowd Pleaser',
        icon: 'assets/icons/fc729.png',
        description: 'A showboat strike: 155% ATK, and the roar grants 15% turn meter.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.55 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.15 },
        ],
      },
      {
        id: 'executioners_round', name: 'Executioner\'s Round',
        icon: 'assets/icons/fc734.png',
        description: 'Finish the show: 195% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [{ type: 'damage', mult: 1.95 }],
      },
    ],
    passive: {
      name: 'Showman',
      icon: 'assets/icons/fc868.png',
      description: 'Always performing: deals 10% extra damage.',
      hooks: {
        damageDealtMult() { return 1.1; },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'damage', mult: 1.15,
      description: 'Center of Attention: +15% damage dealt from the center hex.',
    },
  },

  minotaur_shaman: {
    id: 'minotaur_shaman',
    element: 'wind',
    name: 'Minotaur Shaman',
    title: 'Maze Mystic',
    rarity: 3,
    stats: { hp: 1150, atk: 150, def: 85, speed: 100 },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurshamanidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'spirit_jolt', name: 'Spirit Jolt',
        icon: 'assets/icons/fc970.png',
        description: 'A siphoning jolt: 90% ATK that heals the Shaman for 15% of his ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.15 },
        ],
      },
      {
        id: 'mending_totem', name: 'Mending Totem',
        icon: 'assets/icons/fc1073.png',
        description: 'Heal an ally for 12% of the shaman\'s max HP (15% if front row).',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [{ type: 'healHpPct', pct: 0.12, frontPct: 0.15 }],
      },
      {
        id: 'ancestral_winds', name: 'Ancestral Winds',
        icon: 'assets/icons/fc1113.png',
        description: 'Winds mend ALL allies for 5% of the Shaman\'s max HP over 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'hot', pct: 0.05, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Earthen Bond',
      icon: 'assets/icons/fc853.png',
      description: 'Takes 15% less damage while above half HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.hp / unit.maxHp >= 0.5 ? 0.85 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'hp', mult: 1.2,
      description: 'Spirit Shelter: +20% max HP while in a back hex.',
    },
  },

  minotaur_necromancer: {
    id: 'minotaur_necromancer',
    element: 'dark',
    name: 'Minotaur Necromancer',
    title: 'Maze Gravecaller',
    rarity: 3,
    stats: { hp: 1080, atk: 168, def: 75, speed: 104 },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurnecromanceridle.png', frames: 9, fps: 5, loop: true },
        idle2: {
          src: 'assets/heroes/minotaurnecromanceridle1.png', frames: 9, fps: 5,
          variantOf: 'idle', every: [8, 16],
        },
      },
    },
    abilities: [
      {
        id: 'grave_bolt', name: 'Grave Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'A withering bolt: 95% ATK and -10% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'debuff', stat: 'atk', mult: 0.9, turns: 1 },
        ],
      },
      {
        id: 'soul_rot', name: 'Soul Rot',
        icon: 'assets/icons/fc1066.png',
        description: 'Deals 125% ATK and marks the soul: +20% damage taken for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.25 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.2, turns: 2 },
        ],
      },
      {
        id: 'raise_dead', name: 'Raise Dead',
        icon: 'assets/icons/fc1075.png',
        description: 'Drag a fallen ally back to their feet with 30% HP.',
        cooldown: 7, targeting: 'dead-ally', animation: 'attack',
        effects: [{ type: 'revive', pct: 0.3 }],
      },
    ],
    passive: {
      name: 'Harvester',
      icon: 'assets/icons/fc863.png',
      description: 'At turn start, siphons 2% of his max HP from a random enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const amount = Math.max(1, Math.round(unit.maxHp * 0.02));
          target.takeDamage(amount);
          const healed = unit.heal(amount);
          return {
            label: 'Harvester',
            message: `${unit.name} harvests ${amount} HP from ${target.name}.`,
            floats: [
              { target, text: `-${amount}`, color: '#b86ae8' },
              { target: unit, text: `+${healed}`, color: '#7ae87a' },
            ],
          };
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.15,
      description: 'Grave Roost: +15% damage dealt from a back hex.',
    },
  },


  // ---- Placeholder minotaur cohort (filling the roster to 25) ------------
  // Procedural placeholder art renders until real idle sheets land at the
  // conventional flat paths (assets/heroes/minotaur<role>idle.png).

  minotaur_axeman: {
    id: 'minotaur_axeman',
    element: 'fire',
    name: 'Minotaur Axeman',
    title: 'Feller of Pillars',
    rarity: 1,
    stats: { hp: 890, atk: 113, def: 72, speed: 90 },
    tint: { body: '#7a5a3a', helm: '#9a7a4a', weapon: '#c8c0b0', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotauraxemanidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'chop', name: 'Chop',
        icon: 'assets/icons/fc1447.png',
        description: 'A workmanlike chop for 109% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.09 },
        ],
      },
      {
        id: 'overhand_hew', name: 'Overhand Hew',
        icon: 'assets/icons/fc730.png',
        description: 'A full-shoulder hew: 150% ATK, and the swing loosens him up: +8% ATK for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.5 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.08, turns: 1 },
        ],
      },
      {
        id: 'timber', name: 'Timber!',
        icon: 'assets/icons/fc767.png',
        description: 'Drop the tree on a hex row: 100% ATK and -8% DEF for 1 turn.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'debuff', stat: 'def', mult: 0.92, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Chopping Cadence',
      icon: 'assets/icons/fc867.png',
      description: 'Gains +10% crit damage for 2 turns at each turn start (briefly stacks).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.10, turns: 2 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Fell Stance: +12% ATK while in a front hex.',
    },
  },

  minotaur_herder: {
    id: 'minotaur_herder',
    element: 'water',
    name: 'Minotaur Herder',
    title: 'Driver of the Long Horns',
    rarity: 1,
    stats: { hp: 860, atk: 104, def: 70, speed: 94 },
    tint: { body: '#6a7a5a', helm: '#8a9a6a', weapon: '#b8a878', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurherderidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'crook_swipe', name: 'Crook Swipe',
        icon: 'assets/icons/fc1471.png',
        description: 'A hooking swipe: 97% ATK that drains 7% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.97 },
          { type: 'turnMeter', amount: -0.07 },
        ],
      },
      {
        id: 'herding_call', name: 'Herding Call',
        icon: 'assets/icons/fc868.png',
        description: 'Drive an ally onward: +25% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'turnMeter', amount: 0.25 },
        ],
      },
      {
        id: 'stampede_whistle', name: 'Stampede Whistle',
        icon: 'assets/icons/fc869.png',
        description: 'Whistle the charge: ALL allies gain +10% ATK for 2 turns and 5% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.1, turns: 2 },
          { type: 'turnMeter', amount: 0.05 },
        ],
      },
    ],
    passive: {
      name: 'Watchful Herd',
      icon: 'assets/icons/fc863.png',
      description: 'At turn start, the ally lowest on the turn meter gains 10% meter.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.turnMeter - b.turnMeter);
          const ally = allies[0];
          ally.turnMeter = Math.min(CONFIG.TURN_METER_MAX,
            ally.turnMeter + CONFIG.TURN_METER_MAX * 0.10);
          return null; // silent — small rolling push
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Fold Gate: +12% DEF while in the center hex.',
    },
  },

  minotaur_digger: {
    id: 'minotaur_digger',
    element: 'water',
    name: 'Minotaur Digger',
    title: 'Spade of the Bonefield',
    rarity: 1,
    stats: { hp: 920, atk: 107, def: 78, speed: 87 },
    tint: { body: '#5a5a4a', helm: '#7a7a5a', weapon: '#a8a098', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurdiggeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'shovel_whack', name: 'Shovel Whack',
        icon: 'assets/icons/fc1472.png',
        description: 'A flat-of-the-spade whack for 101% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.01 },
        ],
      },
      {
        id: 'undermine', name: 'Undermine',
        icon: 'assets/icons/fc862.png',
        description: 'Dig out their footing: -20% DEF for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'def', mult: 0.8, turns: 2 },
        ],
      },
      {
        id: 'tunnel_collapse', name: 'Tunnel Collapse',
        icon: 'assets/icons/fc767.png',
        description: 'Drop the gallery on a hex row: 105% ATK and -10% turn meter.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.05 },
          { type: 'turnMeter', amount: -0.1 },
        ],
      },
    ],
    passive: {
      name: 'Digs In',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 15% less damage while below half HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.alive && unit.hp / unit.maxHp < 0.5 ? 0.85 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.12,
      description: 'Trenchwork: +12% DEF while in a front hex.',
    },
  },

  minotaur_piper: {
    id: 'minotaur_piper',
    element: 'wind',
    name: 'Minotaur Piper',
    title: 'Wind of the Warrens',
    rarity: 1,
    stats: { hp: 800, atk: 109, def: 65, speed: 98 },
    tint: { body: '#4a6a6a', helm: '#6a8a8a', weapon: '#e8d8a8', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurpiperidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'skirl_blast', name: 'Skirl Blast',
        icon: 'assets/icons/fc1003.png',
        description: 'A skirling blast: 87% ATK and -6% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.87 },
          { type: 'debuff', stat: 'atk', mult: 0.94, turns: 1 },
        ],
      },
      {
        id: 'droning_dirge', name: 'Droning Dirge',
        icon: 'assets/icons/fc1084.png',
        description: 'A leaden drone: ALL enemies lose 6% turn meter and 4% SPD for 1 turn.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'turnMeter', amount: -0.06 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 1 },
        ],
      },
      {
        id: 'battle_anthem', name: 'Battle Anthem',
        icon: 'assets/icons/fc869.png',
        description: 'A soaring anthem: ALL allies gain +8% crit chance for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'critChance', add: 0.08, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Encore',
      icon: 'assets/icons/fc882.png',
      description: '+5% chance to take an extra turn after acting.',
      hooks: { extraTurnAdd: 0.05 },
    },
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.1,
      description: 'Piper\'s Knoll: +10% SPD while in a back hex.',
    },
  },

  minotaur_butcher: {
    id: 'minotaur_butcher',
    element: 'fire',
    name: 'Minotaur Butcher',
    title: 'Purveyor of Cuts',
    rarity: 1,
    stats: { hp: 930, atk: 118, def: 68, speed: 91 },
    tint: { body: '#8a4a4a', helm: '#a86a5a', weapon: '#d8d8e0', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurbutcheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'meat_hook', name: 'Meat Hook',
        icon: 'assets/icons/fc1444.png',
        description: 'A dragging hook: 93% ATK that opens a 10% ATK bleed for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.93 },
          { type: 'dot', pct: 0.1, turns: 1 },
        ],
      },
      {
        id: 'carve', name: 'Carve',
        icon: 'assets/icons/fc1447.png',
        description: 'A carving stroke: 125% ATK plus a 25% ATK bleed for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.25 },
          { type: 'dot', pct: 0.25, turns: 2 },
        ],
      },
      {
        id: 'butchers_special', name: 'Butcher\'s Special',
        icon: 'assets/icons/fc734.png',
        description: 'The good cut: 150% ATK — 70% more against bleeding prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.5, bonusVs: { kind: 'dot', mult: 1.7 } },
        ],
      },
    ],
    passive: {
      name: 'Bloodletter',
      icon: 'assets/icons/fc1093.png',
      description: '+20% DoT damage.',
      hooks: { dotBoostAdd: 0.20 },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Chopping Block: +12% ATK while in a front hex.',
    },
  },

  minotaur_sentry: {
    id: 'minotaur_sentry',
    element: 'wind',
    name: 'Minotaur Sentry',
    title: 'Eyes of the Long Night',
    rarity: 1,
    stats: { hp: 980, atk: 103, def: 82, speed: 89 },
    tint: { body: '#4a4a6a', helm: '#6a6a8a', weapon: '#c8c0b0', shield: '#8a8aa8', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaursentryidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'halberd_poke', name: 'Halberd Poke',
        icon: 'assets/icons/fc1461.png',
        description: 'A halberd poke: 99% ATK, held in guard: +5% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.99 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.05, turns: 1 },
        ],
      },
      {
        id: 'hold_fast', name: 'Hold Fast',
        icon: 'assets/icons/fc854.png',
        description: 'Set the halberd: takes 25% less damage and +20% DEF for 1 turn.',
        cooldown: 3, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.75, turns: 1 },
          { type: 'buff', stat: 'def', mult: 1.2, turns: 1 },
        ],
      },
      {
        id: 'alarm_bellow', name: 'Alarm Bellow',
        icon: 'assets/icons/fc869.png',
        description: 'Rouse the watch: ALL allies gain +18% DEF and 1.5% max HP regen for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.18, turns: 2 },
          { type: 'hot', pct: 0.015, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Line Watch',
      icon: 'assets/icons/fc856.png',
      description: '+12% chance to dodge while holding a front hex.',
      hooks: {
        dodgeAdd(unit) {
          return unit.slot && unit.slot.position === POSITION.FRONT ? 0.12 : 0;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Watchpost: +15% DEF while in a front hex.',
    },
  },

  minotaur_thrower: {
    id: 'minotaur_thrower',
    element: 'fire',
    name: 'Minotaur Thrower',
    title: 'Sixty-Yard Grudge',
    rarity: 1,
    stats: { hp: 870, atk: 114, def: 66, speed: 93 },
    tint: { body: '#7a6a4a', helm: '#9a8a5a', weapon: '#a8a098', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurthroweridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rock_hurl', name: 'Rock Hurl',
        icon: 'assets/icons/fc1515.png',
        description: 'A shoulder-turned hurl for 116% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.16 },
        ],
      },
      {
        id: 'boulder_toss', name: 'Boulder Toss',
        icon: 'assets/icons/fc1516.png',
        description: 'A flung boulder: 155% ATK that drains 18% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.55 },
          { type: 'turnMeter', amount: -0.18 },
        ],
      },
      {
        id: 'rockslide', name: 'Rockslide',
        icon: 'assets/icons/fc807.png',
        description: 'Bury ALL enemies: 72% ATK and -5% turn meter.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.72 },
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
    ],
    passive: {
      name: 'Long Arm',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 20% extra damage to enemies holding the center hex.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.slot && target.slot.position === POSITION.CENTER ? 1.2 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Throwing Lane: +15% ATK while in a back hex.',
    },
  },

  minotaur_ravager: {
    id: 'minotaur_ravager',
    element: 'fire',
    name: 'Minotaur Ravager',
    title: 'Wrecker of Gates',
    rarity: 2,
    stats: { hp: 950, atk: 142, def: 70, speed: 102 },
    tint: { body: '#8a3a3a', helm: '#a85a4a', weapon: '#c8c0b0', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurravageridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rip_and_gore', name: 'Rip and Gore',
        icon: 'assets/icons/fc746.png',
        description: 'Horn and hoof: 65% then 55% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.65 },
          { type: 'damage', mult: 0.55 },
        ],
      },
      {
        id: 'gore_charge', name: 'Gore Charge',
        icon: 'assets/icons/fc763.png',
        description: 'A goring charge: 142% ATK; the momentum grants 8% turn meter.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.42 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.08 },
        ],
      },
      {
        id: 'rampage', name: 'Rampage',
        icon: 'assets/icons/fc800.png',
        description: 'Wreck everything: 85% ATK to ALL enemies, then +15% ATK for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.15, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Red Mist',
      icon: 'assets/icons/fc1093.png',
      description: 'Deals 30% extra damage while below 30% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return unit.hp / unit.maxHp < 0.3 ? 1.3 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.15,
      description: 'Ram Position: +15% ATK while in a front hex.',
    },
  },

  minotaur_warden: {
    id: 'minotaur_warden',
    element: 'water',
    name: 'Minotaur Warden',
    title: 'Keeper of the Inner Gate',
    rarity: 2,
    stats: { hp: 1080, atk: 118, def: 98, speed: 86 },
    tint: { body: '#3a4a6a', helm: '#5a6a8a', weapon: '#d8d8e0', shield: '#6a7a9a', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurwardenidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wardens_cudgel', name: 'Warden\'s Cudgel',
        icon: 'assets/icons/fc1471.png',
        description: 'A jailer\'s cudgel: 91% ATK, raised guard: takes 8% less damage until next turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.91 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.92, turns: 1 },
        ],
      },
      {
        id: 'chain_snare', name: 'Chain Snare',
        icon: 'assets/icons/fc862.png',
        description: 'Snare in chains: 105% ATK and -25% SPD for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.05 },
          { type: 'debuff', stat: 'speed', mult: 0.75, turns: 1 },
        ],
      },
      {
        id: 'gaol_wall', name: 'Gaol Wall',
        icon: 'assets/icons/fc855.png',
        description: 'Bar the gate: front-hex allies gain +22% DEF and take 10% less damage for 2 turns.',
        cooldown: 6, targeting: 'front-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.22, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.9, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Iron Custody',
      icon: 'assets/icons/fc856.png',
      description: '+10% debuff accuracy and +10% debuff resistance.',
      hooks: { accuracyAdd: 0.10, resistanceAdd: 0.10 },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.18,
      description: 'Gatekeeper: +18% DEF while in a front hex.',
    },
  },

  minotaur_skirmisher: {
    id: 'minotaur_skirmisher',
    element: 'wind',
    name: 'Minotaur Skirmisher',
    title: 'Quick for His Size',
    rarity: 2,
    stats: { hp: 900, atk: 132, def: 72, speed: 106 },
    tint: { body: '#5a7a6a', helm: '#7a9a8a', weapon: '#c8c0b0', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurskirmisheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'twin_horns', name: 'Twin Horns',
        icon: 'assets/icons/fc746.png',
        description: 'A double hook of the horns: 62% ATK each.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.62 },
          { type: 'damage', mult: 0.62 },
        ],
      },
      {
        id: 'horn_sweep', name: 'Horn Sweep',
        icon: 'assets/icons/fc724.png',
        description: 'Sweep a hex row: 85% ATK and -6% turn meter.',
        cooldown: 3, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
          { type: 'turnMeter', amount: -0.06 },
        ],
      },
      {
        id: 'blindside', name: 'Blindside',
        icon: 'assets/icons/fc825.png',
        description: 'Hit where they aren\'t looking: 170% ATK, then slip away: +20% SPD for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.7 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.2, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Pivot Point',
      icon: 'assets/icons/fc867.png',
      description: 'Deals 15% extra damage while holding the center hex.',
      hooks: {
        damageDealtMult(unit, target) {
          return unit.slot && unit.slot.position === POSITION.CENTER ? 1.15 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'speed', mult: 1.12,
      description: 'Pivot: +12% SPD while in the center hex.',
    },
  },

  minotaur_runesmith: {
    id: 'minotaur_runesmith',
    element: 'water',
    name: 'Minotaur Runesmith',
    title: 'Letters in Stone',
    rarity: 2,
    stats: { hp: 940, atk: 128, def: 80, speed: 96 },
    tint: { body: '#4a5a7a', helm: '#6a7a9a', weapon: '#7ac8e8', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurrunesmithidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rune_bolt', name: 'Rune Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'A carved bolt: 84% ATK, and the sigil steadies him: +6% crit chance for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.84 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.06, turns: 1 },
        ],
      },
      {
        id: 'inscribe_ward', name: 'Inscribe Ward',
        icon: 'assets/icons/fc855.png',
        description: 'Cut a ward into an ally\'s hide: heals 50% of ATK and they take 15% less damage for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.5 },
          { type: 'buff', stat: 'damageTaken', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'detonate_runes', name: 'Detonate Runes',
        icon: 'assets/icons/fc1044.png',
        description: 'Crack every sigil: 78% ATK to ALL enemies — 40% more against exposed (marked) foes.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.78, bonusVs: { stat: 'damageTaken', mult: 1.4 } },
        ],
      },
    ],
    passive: {
      name: 'Rune Shield',
      icon: 'assets/icons/fc854.png',
      description: 'At turn start, etches himself an 8% damage-reduction rune for 2 turns (briefly stacks).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.92, turns: 2 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Anvil Stone: +15% DEF while in the center hex.',
    },
  },

  minotaur_wrestler: {
    id: 'minotaur_wrestler',
    element: 'fire',
    name: 'Minotaur Wrestler',
    title: 'Undefeated in the Dark',
    rarity: 2,
    stats: { hp: 1000, atk: 130, def: 84, speed: 94 },
    tint: { body: '#6a4a3a', helm: '#8a6a4a', weapon: '#a88a6a', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurwrestleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'clinch', name: 'Clinch',
        icon: 'assets/icons/fc663.png',
        description: 'Lock up: 89% ATK and -6% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.89 },
          { type: 'debuff', stat: 'speed', mult: 0.94, turns: 1 },
        ],
      },
      {
        id: 'suplex', name: 'Suplex',
        icon: 'assets/icons/fc762.png',
        description: 'Lift and drop: 135% ATK that dumps 22% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.35 },
          { type: 'turnMeter', amount: -0.22 },
        ],
      },
      {
        id: 'ring_out', name: 'Ring Out',
        icon: 'assets/icons/fc767.png',
        description: 'Throw them from the ring: 125% ATK, -18% ATK for 2 turns and -10% DEF for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.25 },
          { type: 'debuff', stat: 'atk', mult: 0.82, turns: 2 },
          { type: 'debuff', stat: 'def', mult: 0.9, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Heavyweight',
      icon: 'assets/icons/fc856.png',
      description: 'Built like a wall: deals 8% more and takes 8% less damage.',
      hooks: {
        damageDealtMult() { return 1.08; },
        damageTakenMult() { return 0.92; },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Corner Post: +15% DEF while in a front hex.',
    },
  },

  minotaur_geomancer: {
    id: 'minotaur_geomancer',
    element: 'water',
    name: 'Minotaur Geomancer',
    title: 'Speaker to Bedrock',
    rarity: 2,
    stats: { hp: 890, atk: 140, def: 74, speed: 100 },
    tint: { body: '#5a6a5a', helm: '#7a8a6a', weapon: '#a8c86a', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurgeomanceridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'pebble_barrage', name: 'Pebble Barrage',
        icon: 'assets/icons/fc807.png',
        description: 'Five whipped stones for 22% ATK each.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.22 },
          { type: 'damage', mult: 0.22 },
          { type: 'damage', mult: 0.22 },
          { type: 'damage', mult: 0.22 },
          { type: 'damage', mult: 0.22 },
        ],
      },
      {
        id: 'earthen_spike', name: 'Earthen Spike',
        icon: 'assets/icons/fc1050.png',
        description: 'A spear of rock: 148% ATK and -15% SPD for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.48 },
          { type: 'debuff', stat: 'speed', mult: 0.85, turns: 1 },
        ],
      },
      {
        id: 'quicksand_field', name: 'Quicksand Field',
        icon: 'assets/icons/fc1084.png',
        description: 'The field liquefies: ALL enemies lose 20% SPD for 2 turns and 10% turn meter.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'speed', mult: 0.8, turns: 2 },
          { type: 'turnMeter', amount: -0.1 },
        ],
      },
    ],
    passive: {
      name: 'Tremor Sense',
      icon: 'assets/icons/fc882.png',
      description: 'At turn start, 25% chance to slow a random enemy: -10% SPD for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          if (Math.random() >= 0.25) return null;
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          target.addStatusEffect({ kind: 'debuff', stat: 'speed', mult: 0.9, turns: 1 });
          return {
            label: 'Tremor Sense',
            message: `${unit.name}'s tremor staggers ${target.name}.`,
            floats: [{ target, text: 'SLOWED', color: '#a8c86a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Ley Line: +12% ATK while in a back hex.',
    },
  },

  minotaur_veteran: {
    id: 'minotaur_veteran',
    element: 'wind',
    name: 'Minotaur Veteran',
    title: 'Half the Scars Are His',
    rarity: 2,
    stats: { hp: 970, atk: 134, def: 82, speed: 97 },
    tint: { body: '#6a6a5a', helm: '#8a8a6a', weapon: '#c8c0b0', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurveteranidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'practiced_cut', name: 'Practiced Cut',
        icon: 'assets/icons/fc1447.png',
        description: 'Nothing fancy, nothing wasted: 114% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.14 },
        ],
      },
      {
        id: 'old_tricks', name: 'Old Tricks',
        icon: 'assets/icons/fc723.png',
        description: 'A trick they never learn: 130% ATK — 35% more against debuffed foes.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3, bonusVs: { kind: 'debuff', mult: 1.35 } },
        ],
      },
      {
        id: 'last_lesson', name: 'Last Lesson',
        icon: 'assets/icons/fc728.png',
        description: 'The lesson ends: 195% ATK, delivered from behind a raised guard (takes 15% less damage until next turn).',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.95 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.85, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Survivor\'s Instinct',
      icon: 'assets/icons/fc862.png',
      description: '+20% chance to dodge while below 30% HP.',
      hooks: {
        dodgeAdd(unit) {
          return unit.alive && unit.hp / unit.maxHp < 0.3 ? 0.20 : 0;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Old Ground: +12% ATK while in a front hex.',
    },
  },

  minotaur_warlord: {
    id: 'minotaur_warlord',
    element: 'fire',
    name: 'Minotaur Warlord',
    title: 'Crown of Broken Horns',
    rarity: 3,
    stats: { hp: 1220, atk: 170, def: 94, speed: 101 },
    tint: { body: '#7a2a2a', helm: '#e8c83a', weapon: '#d8d8e0', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurwarlordidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'warlords_edict', name: 'Warlord\'s Edict',
        icon: 'assets/icons/fc1587.png',
        description: 'A decree in iron: 100% ATK, and his fury builds: +7% ATK for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.07, turns: 2 },
        ],
      },
      {
        id: 'command_the_charge', name: 'Command the Charge',
        icon: 'assets/icons/fc869.png',
        description: 'Sound the horns: ALL allies gain 15% turn meter and +8% ATK for 1 turn.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'turnMeter', amount: 0.15 },
          { type: 'buff', stat: 'atk', mult: 1.08, turns: 1 },
        ],
      },
      {
        id: 'decapitating_sweep', name: 'Decapitating Sweep',
        icon: 'assets/icons/fc730.png',
        description: 'Sweep the front line for 130% ATK.',
        cooldown: 7, targeting: 'front-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
        ],
      },
    ],
    passive: {
      name: 'Warlord\'s Presence',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, ALL allies gain +4% ATK and +4% DEF for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const ally of battle.livingUnits(unit.team)) {
            ally.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.04, turns: 1 });
            ally.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.04, turns: 1 });
          }
          return null; // silent — small rolling aura
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.15,
      description: 'War Banner: +15% ATK while in the center hex.',
    },
  },

  minotaur_colossus: {
    id: 'minotaur_colossus',
    element: 'water',
    name: 'Minotaur Colossus',
    title: 'The Walking Rampart',
    rarity: 3,
    stats: { hp: 1350, atk: 158, def: 105, speed: 84 },
    tint: { body: '#4a4a5a', helm: '#6a6a7a', weapon: '#a8a0a8', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurcolossusidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'colossal_fist', name: 'Colossal Fist',
        icon: 'assets/icons/fc663.png',
        description: 'A fist like a falling wall: 122% ATK, but so slow it costs 6% of his own meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.22 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: -0.06 },
        ],
      },
      {
        id: 'seismic_slam', name: 'Seismic Slam',
        icon: 'assets/icons/fc767.png',
        description: 'Slam a hex row: 115% ATK and -12% turn meter.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.15 },
          { type: 'turnMeter', amount: -0.12 },
        ],
      },
      {
        id: 'unmovable', name: 'Unmovable',
        icon: 'assets/icons/fc854.png',
        description: 'Become the wall: takes 50% less damage for 2 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.5, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Too Big to Fall',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 35% less damage while below 20% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.alive && unit.hp / unit.maxHp < 0.2 ? 0.65 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.2,
      description: 'Rampart: +20% DEF while in a front hex.',
    },
  },

  minotaur_hexhorn: {
    id: 'minotaur_hexhorn',
    element: 'wind',
    name: 'Minotaur Hexhorn',
    title: 'Cursed at Both Ends',
    rarity: 3,
    stats: { hp: 1100, atk: 180, def: 82, speed: 104 },
    tint: { body: '#5a3a6a', helm: '#7a5a8a', weapon: '#b86ae8', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurhexhornidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'hex_horn', name: 'Hex Horn',
        icon: 'assets/icons/fc1050.png',
        description: 'A cursed gore: 86% ATK and -5% DEF for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.86 },
          { type: 'debuff', stat: 'def', mult: 0.95, turns: 2 },
        ],
      },
      {
        id: 'curse_of_the_maze', name: 'Curse of the Maze',
        icon: 'assets/icons/fc1084.png',
        description: 'The walls whisper: ALL enemies lose 10% ATK for 2 turns and 5% crit chance for 1 turn.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'atk', mult: 0.9, turns: 2 },
          { type: 'debuff', stat: 'critChance', add: -0.05, turns: 1 },
        ],
      },
      {
        id: 'horns_of_ruin', name: 'Horns of Ruin',
        icon: 'assets/icons/fc1044.png',
        description: 'Ruin arrives: 185% ATK — 40% more against debuffed foes.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.85, bonusVs: { kind: 'debuff', mult: 1.4 } },
        ],
      },
    ],
    passive: {
      name: 'Hexed Blood',
      icon: 'assets/icons/fc1052.png',
      description: '+15% debuff accuracy and +15% debuff resistance.',
      hooks: { accuracyAdd: 0.15, resistanceAdd: 0.15 },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Cursing Distance: +15% ATK while in a back hex.',
    },
  },

  minotaur_sunbrand: {
    id: 'minotaur_sunbrand',
    element: 'fire',
    name: 'Minotaur Sunbrand',
    title: 'Dawn Held in a Fist',
    rarity: 3,
    stats: { hp: 1130, atk: 174, def: 86, speed: 106 },
    tint: { body: '#a8622a', helm: '#e8a83a', weapon: '#f8c84a', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaursunbrandidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'brand_slash', name: 'Brand Slash',
        icon: 'assets/icons/fc981.png',
        description: 'A burning stroke: 105% ATK plus an 8% ATK burn for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.05 },
          { type: 'dot', pct: 0.08, turns: 2 },
        ],
      },
      {
        id: 'searing_brand', name: 'Searing Brand',
        icon: 'assets/icons/fc1052.png',
        description: 'Press the brand in: the target takes +25% damage and burns for 20% ATK, both for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'damageTaken', mult: 1.25, turns: 2 },
          { type: 'dot', pct: 0.2, turns: 2 },
        ],
      },
      {
        id: 'solar_flare', name: 'Solar Flare',
        icon: 'assets/icons/fc1044.png',
        description: 'A blinding flare: 90% ATK to ALL enemies and -6% crit chance for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'debuff', stat: 'critChance', add: -0.06, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Daybreak Fury',
      icon: 'assets/icons/fc1003.png',
      description: 'Gains +6% ATK and +6% crit chance for 1 turn at each turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.06, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.06, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Sun Disc: +12% ATK while in the center hex.',
    },
  },

  // ---- Snake cohort -------------------------------------------------------
  // Marshland natives; poison (DoT) specialists. Idle-only art for now.

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
        description: 'Slash for 95% ATK with a lick of venom: 15% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'dot', pct: 0.15, turns: 1 },
        ],
      },
      {
        id: 'venom_cut', name: 'Venom Cut',
        icon: 'assets/icons/fc722.png',
        description: 'Deals 120% ATK and poisons for 30% ATK per turn (2 turns).',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'dot', pct: 0.3, turns: 2 },
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
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Coiled Guard: +15% DEF while in a front hex.',
    },
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
        description: 'Deals 115% ATK and poisons for 30% ATK per turn (2 turns).',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.15 },
          { type: 'dot', pct: 0.3, turns: 2 },
        ],
      },
      {
        id: 'arrow_hiss', name: 'Arrow Hiss',
        icon: 'assets/icons/fc807.png',
        description: 'A venom-tipped volley: 60% ATK to ALL enemies plus a 10% ATK poison for 1 turn.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.6 },
          { type: 'dot', pct: 0.10, turns: 1 },
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
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Reed Blind: +15% ATK while in a back hex.',
    },
  },

  snake_assassin: {
    id: 'snake_assassin',
    element: 'dark',
    name: 'Snake Assassin',
    title: 'Silent Fang',
    rarity: 2,
    stats: { hp: 810, atk: 138, def: 58, speed: 116, critChance: 0.25 },
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
        description: 'A lightning stab: 100% ATK plus 20% ATK venom for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'dot', pct: 0.20, turns: 1 },
        ],
      },
      {
        id: 'envenom', name: 'Envenom',
        icon: 'assets/icons/fc825.png',
        description: 'Deals 130% ATK and poisons for 40% ATK per turn (3 turns).',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
          { type: 'dot', pct: 0.4, turns: 3 },
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
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.15,
      description: 'Ambush Coil: +15% damage dealt from a back hex.',
    },
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
        description: 'A gob of venom: 80% ATK plus an 18% ATK poison for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'dot', pct: 0.18, turns: 2 },
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
        description: 'Deals 75% ATK to ALL enemies and poisons for 25% ATK per turn (2 turns).',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'dot', pct: 0.25, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Hexing Focus',
      icon: 'assets/icons/fc987.png',
      description: '+15% debuff accuracy.',
      hooks: { accuracyAdd: 0.15 },
    },
    positional: {
      position: POSITION.CENTER, stat: 'damage', mult: 1.15,
      description: 'Marsh Focus: +15% damage dealt from the center hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'hp', mult: 1.15,
      description: 'Hardened Brew: +15% max HP while in a front hex.',
    },
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
        description: 'A spectral bite for 85% ATK; spirits knit the Shaman for 2% max HP over 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
        ],
        selfEffects: [
          { type: 'hot', pct: 0.02, turns: 2 },
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
        description: 'Deals 50% ATK to ALL enemies and poisons for 35% ATK per turn (3 turns).',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.5 },
          { type: 'dot', pct: 0.35, turns: 3 },
        ],
      },
    ],
    passive: {
      name: 'Venom Master',
      icon: 'assets/icons/fc1069.png',
      description: '+25% DoT damage.',
      hooks: { dotBoostAdd: 0.25 },
    },
    positional: {
      position: POSITION.BACK, stat: 'hp', mult: 1.2,
      description: 'Mire Shelter: +20% max HP while in a back hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'hp', mult: 1.15,
      description: 'Sheltered Coil: +15% max HP while in a back hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.12,
      description: 'Reed Runner: +12% SPD while in a back hex.',
    },
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
        description: 'A gob of spit: 75% ATK plus 22% ATK venom for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'dot', pct: 0.22, turns: 1 },
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
      description: 'Deals 12% extra damage while holding a back hex.',
      hooks: {
        damageDealtMult(unit, target) {
          return unit.slot && unit.slot.position === POSITION.BACK ? 1.12 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'High Ground: +15% ATK while in a back hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Anchor Coil: +15% DEF while in a front hex.',
    },
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
        description: 'Mend an ally for 100% of ATK and quicken them: +10% SPD for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.0 },
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
    positional: {
      position: POSITION.CENTER, stat: 'speed', mult: 1.1,
      description: 'Bandstand: +10% SPD while in the center hex.',
    },
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
            any += ally.heal(Math.round(unit.maxHp * 0.01));
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
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Nest Post: +12% DEF while in the center hex.',
    },
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
        description: 'Spit stolen fire: 100% ATK plus a 12% ATK burn for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'dot', pct: 0.12, turns: 1 },
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
        description: 'Gorge on flame: +40% ATK for 1 turn and 5% max HP regen for 2 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.4, turns: 1 },
          { type: 'hot', pct: 0.05, turns: 2 },
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
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Fire Pit: +12% ATK while in the center hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Rattle Range: +12% ATK while in a back hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Couched Lance: +12% ATK while in a front hex.',
    },
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
      description: '+15% chance to dodge while in a back hex.',
      hooks: {
        dodgeAdd(unit) {
          return unit.slot && unit.slot.position === POSITION.BACK ? 0.15 : 0;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.12,
      description: 'Gale Step: +12% damage dealt from a back hex.',
    },
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
        description: 'A rotting hex: 110% ATK plus 30% ATK decay for 3 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.1 },
          { type: 'dot', pct: 0.3, turns: 3 },
        ],
      },
    ],
    passive: {
      name: 'Marsh Power',
      icon: 'assets/icons/fc1093.png',
      description: '+15% DoT damage and +10% debuff accuracy.',
      hooks: { dotBoostAdd: 0.15, accuracyAdd: 0.10 },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Weed Blind: +15% ATK while in a back hex.',
    },
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
      description: 'Takes 20% less damage while holding the center hex.',
      hooks: {
        damageTakenMult(unit) {
          return unit.slot && unit.slot.position === POSITION.CENTER ? 0.8 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Hearthstone: +15% DEF while in the center hex.',
    },
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
        description: 'A coated dart: 70% ATK plus 28% ATK venom for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.7 },
          { type: 'dot', pct: 0.28, turns: 1 },
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
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Workbench: +12% ATK while in a back hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.15,
      description: 'Sheltered Sight: +15% DEF while in a back hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Pit Footing: +12% ATK while in a front hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.15,
      description: 'Plinth: +15% ATK while in the center hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.15,
      description: 'Riverbed Anchor: +15% ATK while in a front hex.',
    },
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
        description: 'A mere touch: 20% ATK sickness per turn for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'dot', pct: 0.2, turns: 2 },
        ],
      },
      {
        id: 'spreading_sickness', name: 'Spreading Sickness',
        icon: 'assets/icons/fc1084.png',
        description: 'The plague leaps: ALL enemies sicken for 15% ATK per turn for 2 turns.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'dot', pct: 0.15, turns: 2 },
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
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Quarantine Distance: +15% ATK while in a back hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.15,
      description: 'Dune Blind: +15% damage dealt from a back hex.',
    },
  },

  florence: {
    id: 'florence',
    element: 'water',
    name: 'Florence',
    title: 'Crystal Blade',
    rarity: 4,
    stats: { hp: 1450, atk: 240, def: 130, speed: 105 },
    // Placeholder tint (silver armor, crystal sword) until strips load.
    tint: { body: '#8d9bb8', helm: '#c8d0e0', weapon: '#8ad8ff', shield: '#a83a3a' },
    sprite: {
      displayH: 88,
      // Manual: her body is in the right half of the frame, and the low
      // sword blade fools the automatic feet-centroid measurement.
      shadowOffsetX: 12,
      strips: {
        idle:   { src: 'assets/heroes/florence/KnightIdle.png',  frames: 9, fps: 4, loop: true },
        // Timed fidgets, played once every 7-14s of idling (random pick):
        // helmet adjust — rests on frames 4, 6, and 8 for 3 ticks each.
        idle2:  { src: 'assets/heroes/florence/Knightidle2.png', frames: 9, fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14], holds: { 4: 3, 6: 3, 8: 3 } },
        // kneeling rest — holds the kneel (frame 7) for 15 ticks.
        idle3:  { src: 'assets/heroes/florence/Knightidle3.png', frames: 9, fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14], holds: { 7: 15 } },
        // alert stance, loops while it's her turn to act
        ready:  { src: 'assets/heroes/florence/Knightready.png', frames: 9, fps: 6, loop: true },
        // death — plays once and freezes on the final frame
        death:  { src: 'assets/heroes/florence/knightdeath.png', frames: 22, fps: 6, loop: false,
                  freeze: true },
        // sword-slam crystal burst, plays on Crystal Resonance;
        // rests on frame 16 as the crystals flare.
        buff:   { src: 'assets/heroes/florence/Knightbuff.png', frames: 20, fps: 12, loop: false,
                  holds: { 16: 5 } },
        // Skill 3 — same frames as the jump slash, but she leaps straight
        // up, the swing hurls a windshear along the enemy row, and she
        // lands back on her own hex. Same frame timing as jumpslash.
        rowslash: {
          src: 'assets/heroes/florence/Knightjumpslash.png',
          frames: 23, fps: 10, loop: false,
          // Playback order revisits sheet frame 15 (tucked airborne pose)
          // after the swing, so she hangs and falls in the jump position
          // and only hits the landing pose (21) back at the ground.
          // Playback: 1-20 as drawn, then [15 hang, 15 fall, 21-23 land].
          order: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
                  16, 17, 18, 19, 20, 15, 15, 21, 22, 23],
          // Fast ascent, fast slash, long airborne hang (playback 21),
          // fast fall (22), brief landing skid (23).
          holds: {
            7: 4,
            8: 0.5, 9: 0.5, 10: 0.5, 11: 0.5, 12: 0.5, 13: 0.5, 14: 0.5, 15: 0.5,
            16: 0.5, 17: 0.5, 18: 0.5, 19: 0.5, 20: 0.5,
            21: 8,
            23: 2,
          },
          hitFrame: 17,
          motion: [
            { frames: [1, 7],   from: 'origin',    to: 'origin' },
            { frames: [8, 15],  from: 'origin',    to: 'originAir' },
            { frames: [16, 21], from: 'originAir', to: 'originAir' },
            { frames: [22, 22], from: 'originAir', to: 'origin' },
            { frames: [23, 25], from: 'origin',    to: 'origin' },
          ],
          // Dust on liftoff, and again as she touches back down.
          frameEffects: [
            { frame: 8,  effect: 'jump_cloud', at: 'origin', dy: 18 },
            { frame: 23, effect: 'land_cloud', at: 'origin', dy: 18 },
          ],
        },
        // Skill 1 — leap to the target and slash through them:
        //   1-7   windup on her hex, holding frame 7 as she tenses
        //   8-15  airborne arc to just in front of the target
        //   16-21 fast sweeping slash carrying her behind the target,
        //         damage lands on 17, skid-stop pause held on 21
        //   22-23 recover, then snap back to her hex
        jumpslash: {
          src: 'assets/heroes/florence/Knightjumpslash.png',
          frames: 23, fps: 10, loop: false,
          holds: { 7: 4, 16: 0.5, 17: 0.5, 18: 0.5, 19: 0.5, 20: 0.5, 21: 5 },
          hitFrame: 17,
          motion: [
            { frames: [1, 7],   from: 'origin',       to: 'origin' },
            { frames: [8, 15],  from: 'origin',       to: 'targetFront', arc: 90 },
            { frames: [16, 20], from: 'targetFront',  to: 'targetBehind' },
            { frames: [21, 23], from: 'targetBehind', to: 'targetBehind' },
          ],
          // Dust: takeoff cloud as she leaves her hex, skid cloud where
          // she comes to a stop behind the target.
          frameEffects: [
            { frame: 8,  effect: 'jump_cloud', at: 'origin',       dy: 18 },
            { frame: 18, effect: 'land_cloud', at: 'targetBehind', dy: 18 },
          ],
        },
      },
    },
    abilities: [
      {
        id: 'crystal_slash', name: 'Crystal Slash',
        icon: 'assets/icons/fc1609.png',
        description: 'A crystal-edged cut for 100% ATK that focuses her: +5% crit chance for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.05, turns: 1 },
        ],
      },
      {
        id: 'crystal_resonance', name: 'Crystal Resonance',
        icon: 'assets/icons/fc1024.png',
        description: 'Attune to the blade: +50% crit chance and +50% crit damage for 3 turns.',
        cooldown: 5, targeting: 'self', animation: 'buff',
        effects: [
          { type: 'buff', stat: 'critChance', add: 0.5, turns: 3 },
          { type: 'buff', stat: 'critDamage', add: 0.5, turns: 3 },
        ],
      },
      {
        id: 'prism_break', name: 'Prism Break',
        icon: 'assets/icons/fc788.png',
        description: 'Leap skyward and hurl a shearing wave that cuts an entire enemy row for 170% ATK.',
        cooldown: 7, targeting: 'enemy-row', animation: 'rowslash', vfx: 'windshear', impact: 'slash',
        effects: [{ type: 'damage', mult: 1.7 }],
      },
    ],
    passive: {
      name: 'Blade Dance',
      icon: 'assets/icons/fc731.png',
      description: 'Gains +15% SPD and +5% crit chance for 1 turn at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.15, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.05, turns: 1 });
          return null; // silent — too minor to log every turn
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.2,
      description: 'Duelist: +20% ATK while in a front hex.',
    },
  },

  vivian: {
    id: 'vivian',
    element: 'wind',
    name: 'Vivian',
    title: 'Hedge Mage',
    rarity: 4,
    stats: { hp: 1650, atk: 140, def: 120, speed: 100 },
    // Placeholder tint (leafy greens) until her strips are uploaded.
    tint: { body: '#4a8a4a', helm: '#7ab86a', weapon: '#a8e888', shield: '#5a4a30' },
    sprite: {
      displayH: 88,
      strips: {
        idle:   { src: 'assets/heroes/vivian/hedgeidlepng.png', frames: 9, fps: 4, loop: true },
        // Timed fidget variations.
        idle2:  { src: 'assets/heroes/vivian/hedgeidle1.png', frames: 9, fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        idle3:  { src: 'assets/heroes/vivian/hedgeidle2.png', frames: 8, fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        ready:  { src: 'assets/heroes/vivian/hedgeready.png', frames: 9, fps: 6, loop: true },
        // Staff channel — used by both Verdant Mend and Thicket Blessing;
        // the heal lands as the channel peaks.
        cast:   { src: 'assets/heroes/vivian/hedgeskill1.png', frames: 8, fps: 10, loop: false,
                  hitFrame: 6 },
        // Briar Burst — energy gathers in her outstretched hand.
        attack3: { src: 'assets/heroes/vivian/hedgeskill3.png', frames: 8, fps: 10, loop: false,
                   hitFrame: 5 },
        death:  { src: 'assets/heroes/vivian/hedgedeath.png', frames: 25, fps: 6, loop: false,
                  freeze: true },
      },
    },
    abilities: [
      {
        id: 'verdant_mend', name: 'Verdant Mend',
        icon: 'assets/icons/fc1073.png',
        description: 'Heal an ally for 10% of Vivian\'s max HP — 20% if they hold a front hex.',
        cooldown: 0, targeting: 'ally', animation: 'cast', impact: 'heal_green',
        effects: [{ type: 'healHpPct', pct: 0.10, frontPct: 0.20 }],
      },
      {
        id: 'thicket_blessing', name: 'Thicket Blessing',
        icon: 'assets/icons/fc1113.png',
        description: 'Bless the entire front row with regrowth: heal 5% of Vivian\'s max HP per turn for 4 turns.',
        cooldown: 5, targeting: 'front-allies', animation: 'cast', impact: 'heal_green',
        effects: [{ type: 'hot', pct: 0.05, turns: 4 }],
      },
      {
        id: 'briar_burst', name: 'Briar Burst',
        icon: 'assets/icons/fc1066.png',
        description: 'Lash an enemy with thorns for 20% of Vivian\'s max HP and cut their action bar by 50%.',
        cooldown: 6, targeting: 'enemy', animation: 'attack3', impact: 'strike_green',
        effects: [
          { type: 'damageHpPct', pct: 0.20 },
          { type: 'turnMeter', amount: -0.5 },
        ],
      },
    ],
    passive: {
      name: 'Sympathetic Growth',
      icon: 'assets/icons/fc866.png',
      description: 'Gains 5% action bar whenever an ally is healed.',
      hooks: {
        onAllyHealed(unit) {
          unit.turnMeter = Math.min(CONFIG.TURN_METER_MAX,
            unit.turnMeter + CONFIG.TURN_METER_MAX * 0.05);
          return { floats: [{ target: unit, text: '▲', color: '#7ae87a' }] };
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'hp', mult: 1.2,
      description: 'Rooted: +20% max HP while in a back hex.',
    },
  },

  vex: {
    id: 'vex',
    element: 'dark',
    name: 'Vex',
    title: 'Doll Witch',
    rarity: 4,
    stats: { hp: 1250, atk: 200, def: 105, speed: 115 },
    tint: { body: '#5a3a7a', helm: '#7a4a9a', weapon: '#c8a86a', shield: '#3a2a4a' },
    sprite: {
      displayH: 66, // 25% smaller than standard — her art is a crouched pose
      strips: {
        idle:   { src: 'assets/heroes/vex/vexidle.png',  frames: 9,  fps: 4, loop: true },
        // Timed fidget variations.
        idle2:  { src: 'assets/heroes/vex/vexidle1.png', frames: 9,  fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        idle3:  { src: 'assets/heroes/vex/vexidle2.png', frames: 9,  fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        idle4:  { src: 'assets/heroes/vex/vexidle3.png', frames: 16, fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        ready:  { src: 'assets/heroes/vex/vexready.png', frames: 9, fps: 6, loop: true },
        // Doll rattle — the pin goes in mid-shake.
        attack: { src: 'assets/heroes/vex/vexskill1.png', frames: 9, fps: 10, loop: false,
                  hitFrame: 6 },
        // Wide curse over the enemy team.
        cast:   { src: 'assets/heroes/vex/vexskill2.png', frames: 9, fps: 10, loop: false,
                  hitFrame: 6 },
        // The doll ignites with hexfire — the mark lands on the burst.
        attack3: { src: 'assets/heroes/vex/vexskill3.png', frames: 9, fps: 10, loop: false,
                   hitFrame: 8 },
        death:  { src: 'assets/heroes/vex/vexdeath.png', frames: 8, fps: 6, loop: false,
                  freeze: true },
      },
    },
    abilities: [
      {
        id: 'pinprick', name: 'Pinprick',
        icon: 'assets/icons/fc89.png',
        description: 'Stab the doll: 90% ATK to one enemy and -15% ATK for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'strike_purple',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'debuff', stat: 'atk', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'creeping_malaise', name: 'Creeping Malaise',
        icon: 'assets/icons/fc1117.png',
        description: 'Curse ALL enemies: -25% DEF and -15% SPD for 2 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'cast', impact: 'strike_purple',
        effects: [
          { type: 'debuff', stat: 'def', mult: 0.75, turns: 2 },
          { type: 'debuff', stat: 'speed', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'doom_mark', name: 'Doom Mark',
        icon: 'assets/icons/fc1050.png',
        description: 'Condemn one enemy: takes 40% more damage and loses 30% ATK for 3 turns.',
        cooldown: 7, targeting: 'enemy', animation: 'attack3', impact: 'strike_purple',
        effects: [
          { type: 'debuff', stat: 'damageTaken', mult: 1.4, turns: 3 },
          { type: 'debuff', stat: 'atk', mult: 0.7, turns: 3 },
        ],
      },
    ],
    passive: {
      name: 'Vile Persistence',
      icon: 'assets/icons/fc1053.png',
      description: 'Her debuffs last 1 extra turn.',
      hooks: {
        debuffExtraTurns: 1,
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.15,
      description: 'Skulker: +15% SPD while in a back hex.',
    },
  },

  emily: {
    id: 'emily',
    element: 'light',
    name: 'Emily',
    title: 'Dawn Cleric',
    rarity: 4,
    stats: { hp: 1300, atk: 190, def: 115, speed: 105 },
    tint: { body: '#e8e0d0', helm: '#4a6ac8', weapon: '#e8c84a', shield: '#f0ead8' },
    sprite: {
      displayH: 88,
      strips: {
        idle:   { src: 'assets/heroes/emily/emilyidle.png',  frames: 9,  fps: 4, loop: true },
        // Timed fidget variations.
        idle2:  { src: 'assets/heroes/emily/emilyidle1.png', frames: 16, fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        idle3:  { src: 'assets/heroes/emily/emilyidle2.png', frames: 9,  fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        ready:  { src: 'assets/heroes/emily/emilyready.png', frames: 9, fps: 6, loop: true },
        // Single-target blessing.
        cast:   { src: 'assets/heroes/emily/emilyskill1.png', frames: 9, fps: 10, loop: false,
                  hitFrame: 6 },
        // Team chorus.
        cast2:  { src: 'assets/heroes/emily/emilyskill2.png', frames: 9, fps: 10, loop: false,
                  hitFrame: 6 },
        // Radiant halo — the revival lands as the light peaks.
        revive: { src: 'assets/heroes/emily/emilyskill3.png', frames: 9, fps: 10, loop: false,
                  hitFrame: 8 },
        death:  { src: 'assets/heroes/emily/emilydeath.png', frames: 9, fps: 6, loop: false,
                  freeze: true },
      },
    },
    abilities: [
      {
        id: 'lightmend', name: 'Lightmend',
        icon: 'assets/icons/fc1041.png',
        description: 'Bathe one ally in light, healing 130% ATK.',
        cooldown: 0, targeting: 'ally', animation: 'cast', impact: 'heal_gold',
        effects: [{ type: 'heal', mult: 1.3 }],
      },
      {
        id: 'purifying_chorus', name: 'Purifying Chorus',
        icon: 'assets/icons/fc1046.png',
        description: 'Heal ALL allies for 80% ATK and cleanse their debuffs.',
        cooldown: 5, targeting: 'all-allies', animation: 'cast2', impact: 'heal_gold',
        effects: [
          { type: 'heal', mult: 0.8 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'second_dawn', name: 'Second Dawn',
        icon: 'assets/icons/fc1075.png',
        description: 'Call a fallen ally back to the fight with 40% of their max HP.',
        cooldown: 7, targeting: 'dead-ally', animation: 'revive', impact: 'heal_gold',
        effects: [{ type: 'revive', pct: 0.4 }],
      },
    ],
    passive: {
      name: 'Serenity',
      icon: 'assets/icons/fc1091.png',
      description: 'At the start of her turn, removes one debuff from the most afflicted ally.',
      hooks: {
        onTurnStart(unit, battle) {
          const afflicted = battle.livingUnits(unit.team)
            .map((u) => ({ u, n: u.statusEffects.filter((fx) => fx.kind === 'debuff').length }))
            .filter((e) => e.n > 0)
            .sort((a, b) => b.n - a.n);
          if (afflicted.length === 0) return null;
          const target = afflicted[0].u;
          const idx = target.statusEffects.findIndex((fx) => fx.kind === 'debuff');
          target.statusEffects.splice(idx, 1);
          return {
            label: 'Serenity',
            message: `${unit.name}'s Serenity lifts a debuff from ${target.name}.`,
            floats: [{ target, text: 'CLEANSED', color: '#ffe8a8' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.2,
      description: 'Choir Heart: +20% ATK (and stronger heals) in the center hex.',
    },
  },

  coral: {
    id: 'coral',
    element: 'water',
    name: 'Coral',
    title: 'Tide Caller',
    rarity: 4,
    stats: { hp: 1150, atk: 260, def: 95, speed: 110 },
    tint: { body: '#3a6ac8', helm: '#e8d88a', weapon: '#4ac8e8', shield: '#e8e8f0' },
    sprite: {
      displayH: 88,
      strips: {
        idle:   { src: 'assets/heroes/coral/coralidle.png',  frames: 9,  fps: 4, loop: true },
        // Timed fidget variations.
        idle2:  { src: 'assets/heroes/coral/coralidle1.png', frames: 16, fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        idle3:  { src: 'assets/heroes/coral/coralidle2.png', frames: 14, fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        idle4:  { src: 'assets/heroes/coral/coralidle3.png', frames: 15, fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        ready:  { src: 'assets/heroes/coral/coralready.png', frames: 9, fps: 6, loop: true },
        // Staff sweep cast — skills 1 and 2; the surge lands mid-sweep.
        attack: { src: 'assets/heroes/coral/coralskill1.png', frames: 11, fps: 10, loop: false,
                  hitFrame: 6 },
        // Spinning burst — skill 3.
        attack3: { src: 'assets/heroes/coral/coralskill3.png', frames: 6, fps: 10, loop: false,
                   hitFrame: 4 },
        death:  { src: 'assets/heroes/coral/coraldeath.png', frames: 9, fps: 6, loop: false,
                  freeze: true },
      },
    },
    abilities: [
      {
        id: 'tide_lash', name: 'Tide Lash',
        icon: 'assets/icons/fc819.png',
        description: 'Strike one enemy with a surging wave for 110% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.1 }],
      },
      {
        id: 'undertow', name: 'Undertow',
        icon: 'assets/icons/fc821.png',
        description: 'Drag the enemy back row under for 90% ATK.',
        cooldown: 6, targeting: 'back-enemies', animation: 'attack', impact: 'strike',
        effects: [{ type: 'damage', mult: 0.9 }],
      },
      {
        id: 'maelstrom_spear', name: 'Maelstrom Spear',
        icon: 'assets/icons/fc786.png',
        description: 'Skewer one enemy with a focused torrent for 240% ATK.',
        cooldown: 7, targeting: 'enemy', animation: 'attack3', impact: 'strike',
        effects: [{ type: 'damage', mult: 2.4 }],
      },
    ],
    passive: {
      name: 'Riptide',
      icon: 'assets/icons/fc823.png',
      description: 'Deals 25% extra damage to enemies holding front hexes.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.slot && target.slot.position === POSITION.FRONT ? 1.25 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'damage', mult: 1.2,
      description: 'Tidal Focus: +20% damage dealt while in the center hex.',
    },
  },

};
