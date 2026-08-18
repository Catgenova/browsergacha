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
        description: 'A quick jab for 100% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [{ type: 'damage', mult: 1.0 }],
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
        description: 'A spear thrust for 100% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.0 }],
      },
      {
        id: 'lunge', name: 'Lunge',
        icon: 'assets/icons/fc1791.png',
        description: 'A deep lunge for 140% ATK.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.4 }],
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
      description: 'Deals 10% extra damage to front-row enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.slot && target.slot.position === POSITION.FRONT ? 1.1 : 1;
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
        description: 'Slip behind for 150% ATK.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.5 }],
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
        description: 'A frenzied swing for 105% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [{ type: 'damage', mult: 1.05 }],
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
        description: 'A heavy blow for 105% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'slam',
        effects: [{ type: 'damage', mult: 1.05 }],
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
        description: 'A precise thrust for 105% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.05 }],
      },
      {
        id: 'flourish', name: 'Flourish',
        icon: 'assets/icons/fc729.png',
        description: 'A dazzling combination for 150% ATK.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.5 }],
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
        description: 'A lightning draw-cut for 105% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [{ type: 'damage', mult: 1.05 }],
      },
      {
        id: 'cross_slash', name: 'Cross Slash',
        icon: 'assets/icons/fc1030.png',
        description: 'Two crossing cuts for 155% ATK.',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [{ type: 'damage', mult: 1.55 }],
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
        description: 'Rip at a foe for 100% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.0 }],
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
      description: 'Deals 15% extra damage to enemies below half HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.5 ? 1.15 : 1;
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
        description: 'A darting thrust for 105% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.05 }],
      },
      {
        id: 'skewer', name: 'Skewer',
        icon: 'assets/icons/fc1622.png',
        description: 'Spear a foe clean through for 150% ATK.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.5 }],
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
      description: 'Gains +10% crit chance for 1 turn at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.1, turns: 1 });
          return null; // silent - fires every turn
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
        description: 'A heavy cut for 105% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [{ type: 'damage', mult: 1.05 }],
      },
      {
        id: 'cross_cut', name: 'Cross Cut',
        icon: 'assets/icons/fc723.png',
        description: 'Two crossing strokes for 155% ATK.',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [{ type: 'damage', mult: 1.55 }],
      },
      {
        id: 'murder_stroke', name: 'Murder Stroke',
        icon: 'assets/icons/fc734.png',
        description: 'An executioner\'s blow: 200% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [{ type: 'damage', mult: 2.0 }],
      },
    ],
    passive: {
      name: 'Corvid Cunning',
      icon: 'assets/icons/fc862.png',
      description: 'Deals 15% extra damage to enemies at full HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp >= target.maxHp ? 1.15 : 1;
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
        description: 'A rapid thrust for 105% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.05 }],
      },
      {
        id: 'gallant_lunge', name: 'Gallant Lunge',
        icon: 'assets/icons/fc736.png',
        description: 'A flamboyant lunge for 150% ATK.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.5 }],
      },
      {
        id: 'crowing_coup', name: 'Crowing Coup',
        icon: 'assets/icons/fc728.png',
        description: 'The dawn strike: 185% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.85 }],
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
        description: 'A piercing jab for 100% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.0 }],
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
        description: 'A crushing blow for 105% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'slam',
        effects: [{ type: 'damage', mult: 1.05 }],
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
      description: 'Deals 15% extra damage to enemies above half HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp >= 0.5 ? 1.15 : 1;
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
        description: 'A bolt of dark magic for 105% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.05 }],
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
      description: 'Debuffs this hero inflicts last 1 extra turn.',
      hooks: {
        debuffExtraTurns: 1,
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.15,
      description: 'Night Roost: +15% damage dealt from a back hex.',
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
        description: 'Leap to an enemy and slash clean through for 100% ATK.',
        // Slash impact rotated flat and mirrored vertically so the sweep
        // reads bottom-left to bottom-right, following the sword tip.
        cooldown: 0, targeting: 'enemy', animation: 'jumpslash', impact: 'slash',
        impactRotate: -64, impactFlipY: true,
        effects: [{ type: 'damage', mult: 1.0 }],
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
      description: 'Gains +15% SPD for 1 turn at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.15, turns: 1 });
          return {
            label: 'Blade Dance',
            message: `${unit.name} flows into the next stance (+15% SPD).`,
            floats: [{ target: unit, text: 'SPD ▲', color: '#8ad8ff' }],
          };
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
