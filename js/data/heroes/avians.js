// Avian heroes (42). Registered into the shared
// HEROES table declared in js/data/heroes.js.

Object.assign(HEROES, {

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
    positional: POSITIONALS.toxicologist,
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
    positional: POSITIONALS.last_stand,
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
    positional: POSITIONALS.drain_the_line,
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
    positional: POSITIONALS.reckless_charge,
  },

  owl_sentinel: {
    id: 'owl_sentinel',
    element: 'light',
    name: 'Owl Sentinel',
    title: 'Watcher of Dawn',
    rarity: 3,
    stats: { hp: 1320, atk: 151, def: 108, speed: 90 },
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
    positional: POSITIONALS.rallying_banner,
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
    positional: POSITIONALS.press_the_flank,
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
    positional: POSITIONALS.hexweaver,
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
    positional: POSITIONALS.marked_quarry,
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
            amount: Math.round(unit.maxHp * 0.02), turns: 1, source: unit });
          return null; // silent — small rolling gift
        },
      },
    },
    positional: POSITIONALS.keystone,
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
    positional: POSITIONALS.hexweaver,
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
    positional: POSITIONALS.opening_volley,
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
    positional: POSITIONALS.toxicologist,
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
    positional: POSITIONALS.hexweaver,
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
    positional: POSITIONALS.reckless_charge,
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
    positional: POSITIONALS.hexweaver,
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
    positional: POSITIONALS.standard_bearer,
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
    positional: POSITIONALS.opening_volley,
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
    positional: POSITIONALS.focal_point,
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
    positional: POSITIONALS.iron_wake,
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
        description: 'A diving thrust for 130% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
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
    positional: POSITIONALS.toxicologist,
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
    positional: POSITIONALS.keystone,
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
    positional: POSITIONALS.focal_point,
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
          for (const e of enemies) Abilities.strike(unit, e, amount);
          return {
            label: 'Storm Static',
            message: `${unit.name}'s static arcs across the field.`,
            floats: enemies.map((e) => ({ target: e, text: `-${amount}`, color: '#a8b8d8' })),
          };
        },
      },
    },
    positional: POSITIONALS.hexweaver,
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
    positional: POSITIONALS.press_the_flank,
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
          for (const ally of dying) total += ally.heal(Math.round(unit.maxHp * 0.04), unit);
          if (total <= 0) return null;
          return {
            label: 'Deliverance',
            message: `${unit.name} delivers ${total} HP to the faltering.`,
            floats: [],
          };
        },
      },
    },
    positional: POSITIONALS.safe_distance,
  },

  // ---- Minotaur cohort ----------------------------------------------------
  // Bonefield natives; idle-only art for now.

  crow_headsman: {
    id: 'crow_headsman',
    element: 'dark',
    name: 'Crow Headsman',
    title: 'The sentence is the swing.',
    rarity: 3,
    stats: { hp: 1074, atk: 161, def: 80, speed: 97 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Crowheadsmanidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'crow_headsman_edge', name: 'Headsman\'s Edge',
        icon: 'assets/icons/fc734.png',
        description: 'Two dark cuts: 81% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.81 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'crow_headsman_sentence', name: 'Headsman\'s Sentence',
        icon: 'assets/icons/fc730.png',
        description: 'Pass judgment: 131% ATK and the target takes +12% damage for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.31 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.12, turns: 1 },
        ],
      },
      {
        id: 'crow_headsman_end', name: 'Headsman\'s End',
        icon: 'assets/icons/fc728.png',
        description: 'Carry it out: 207% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.07 },
        ],
      },
    ],
    passive: {
      name: 'Headsman\'s Due',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 24% extra damage to enemies below 40% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.4 ? 1.24 : 1;
        },
      },
    },
    positional: POSITIONALS.press_the_flank,
  },

  cuckoo_hexmother: {
    id: 'cuckoo_hexmother',
    element: 'dark',
    name: 'Cuckoo Hexmother',
    title: 'Carries every curse worth having.',
    rarity: 3,
    stats: { hp: 1083, atk: 166, def: 83, speed: 99 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Cuckoohexmotheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cuckoo_hexmother_lash', name: 'Hexmother Lash',
        icon: 'assets/icons/fc1052.png',
        description: 'Two cursed lashes: 82% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.82 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'cuckoo_hexmother_bane', name: 'Hexmother Bane',
        icon: 'assets/icons/fc1084.png',
        description: 'A layered curse: 132% ATK, -9% ATK and -5% DEF for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.32 },
          { type: 'debuff', stat: 'atk', mult: 0.91, turns: 2 },
          { type: 'debuff', stat: 'def', mult: 0.95, turns: 2 },
        ],
      },
      {
        id: 'cuckoo_hexmother_pall', name: 'Hexmother Pall',
        icon: 'assets/icons/fc1050.png',
        description: 'A pall over everything: 86% ATK to ALL enemies and -4% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.86 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Hexmother Craft',
      icon: 'assets/icons/fc1093.png',
      description: 'Curses honed in the dark.',
      hooks: { accuracyAdd: 0.08, dotBoostAdd: 0.18 },
    },
    positional: POSITIONALS.last_stand,
  },

  shrike_bloodtithe: {
    id: 'shrike_bloodtithe',
    element: 'dark',
    name: 'Shrike Bloodtithe',
    title: 'Your vigor, redistributed.',
    rarity: 3,
    stats: { hp: 1092, atk: 171, def: 86, speed: 101 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Shrikebloodtitheidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'shrike_bloodtithe_sip', name: 'Bloodtithe\'s Sip',
        icon: 'assets/icons/fc1444.png',
        description: 'Two draining touches: 83% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.83 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'shrike_bloodtithe_feast', name: 'Bloodtithe\'s Feast',
        icon: 'assets/icons/fc825.png',
        description: 'Drink deep: 133% ATK, healing himself for 32% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.33 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.32 },
        ],
      },
      {
        id: 'shrike_bloodtithe_toll', name: 'Bloodtithe\'s Toll',
        icon: 'assets/icons/fc1112.png',
        description: 'Tax the living: 77% ATK to ALL enemies while he mends 7% of his max HP.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.77 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.07 },
        ],
      },
    ],
    passive: {
      name: 'Bloodtithe Hunger',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, siphons 1.4% of his max HP from a random enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const amount = Math.max(1, Math.round(unit.maxHp * 0.014));
          Abilities.strike(unit, target, amount);
          unit.heal(amount);
          return null; // silent — small rolling hunger
        },
      },
    },
    positional: POSITIONALS.marked_quarry,
  },

  nightjar_duskblade: {
    id: 'nightjar_duskblade',
    element: 'dark',
    name: 'Nightjar Duskblade',
    title: 'The dark keeps its edge honed.',
    rarity: 3,
    stats: { hp: 1101, atk: 176, def: 89, speed: 103 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Nightjarduskbladeidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'nightjar_duskblade_flick', name: 'Duskblade Flick',
        icon: 'assets/icons/fc1447.png',
        description: 'Two flickering cuts: 84% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.84 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'nightjar_duskblade_waltz', name: 'Duskblade Waltz',
        icon: 'assets/icons/fc1587.png',
        description: 'A step through shadow: 134% ATK and +7% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.34 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.07, turns: 1 },
        ],
      },
      {
        id: 'nightjar_duskblade_finale', name: 'Duskblade Finale',
        icon: 'assets/icons/fc723.png',
        description: 'The last figure: 198% ATK — 25% more against debuffed prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.98, bonusVs: { kind: 'debuff', mult: 1.25 } },
        ],
      },
    ],
    passive: {
      name: 'Duskblade Poise',
      icon: 'assets/icons/fc862.png',
      description: 'A blade kept perfectly balanced (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.18, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.02, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.standard_bearer,
  },

  whippoorwill_doomsinger: {
    id: 'whippoorwill_doomsinger',
    element: 'dark',
    name: 'Whippoorwill Doomsinger',
    title: 'Fear arrives before the blow.',
    rarity: 3,
    stats: { hp: 1110, atk: 181, def: 92, speed: 105 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Whippoorwilldoomsingeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'whippoorwill_doomsinger_knell', name: 'Doomsinger Knell',
        icon: 'assets/icons/fc1003.png',
        description: 'Two tolling blows: 85% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'whippoorwill_doomsinger_omen', name: 'Doomsinger Omen',
        icon: 'assets/icons/fc1084.png',
        description: 'Name their doom: 115% ATK and -10% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.15 },
          { type: 'debuff', stat: 'atk', mult: 0.9, turns: 2 },
        ],
      },
      {
        id: 'whippoorwill_doomsinger_chorus', name: 'Doomsinger Chorus',
        icon: 'assets/icons/fc807.png',
        description: 'The dread chorus: 84% ATK to ALL enemies and -5% crit chance for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.84 },
          { type: 'debuff', stat: 'critChance', add: -0.05, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Doomsinger Presence',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, dread spreads: ALL enemies lose 2% SPD for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const e of battle.livingUnits(unit.enemyTeam())) {
            e.addStatusEffect({ kind: 'debuff', stat: 'speed', mult: 0.98, turns: 1 });
          }
          return null; // silent — small rolling dread
        },
      },
    },
    positional: POSITIONALS.vanguard_press,
  },

  dove_peacebringer: {
    id: 'dove_peacebringer',
    element: 'light',
    name: 'Dove Peacebringer',
    title: 'Every wound answers to the light.',
    rarity: 3,
    stats: { hp: 1119, atk: 186, def: 95, speed: 107 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Dovepeacebringeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'dove_peacebringer_rebuke', name: 'Peacebringer\'s Rebuke',
        icon: 'assets/icons/fc1471.png',
        description: 'Two shining raps: 86% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.86 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'dove_peacebringer_grace', name: 'Peacebringer\'s Grace',
        icon: 'assets/icons/fc1112.png',
        description: 'Pour in the light: heals an ally 114% of ATK and cleanses their debuffs.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.15 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'dove_peacebringer_communion', name: 'Peacebringer\'s Communion',
        icon: 'assets/icons/fc800.png',
        description: 'Shared light: ALL allies heal 64% of ATK plus 1.2% of max HP regen for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.65 },
          { type: 'hot', pct: 0.011, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Peacebringer Devotion',
      icon: 'assets/icons/fc1093.png',
      description: 'Healing hands, steadied by faith.',
      hooks: { healBoostAdd: 0.18 },
    },
    positional: POSITIONALS.opening_volley,
  },

  egret_aegiswing: {
    id: 'egret_aegiswing',
    element: 'light',
    name: 'Egret Aegiswing',
    title: 'A shield the sun would envy.',
    rarity: 3,
    stats: { hp: 1128, atk: 161, def: 98, speed: 109 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Egretaegiswingidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'egret_aegiswing_check', name: 'Aegiswing\'s Check',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield checks: 87% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.87 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'egret_aegiswing_ward', name: 'Aegiswing\'s Ward',
        icon: 'assets/icons/fc855.png',
        description: 'Raise the aegis over an ally: they take 13% less damage for 2 turns and heal 55% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.87, turns: 2 },
          { type: 'heal', mult: 0.56 },
        ],
      },
      {
        id: 'egret_aegiswing_vigil', name: 'Aegiswing\'s Vigil',
        icon: 'assets/icons/fc856.png',
        description: 'The unbroken vigil: ALL allies gain +7% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.07, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Aegiswing Constancy',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, shields the most wounded ally: takes 11% less damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.89, turns: 1 });
          return null; // silent — small rolling shelter
        },
      },
    },
    positional: POSITIONALS.keystone,
  },

  goldfinch_dawnlancer: {
    id: 'goldfinch_dawnlancer',
    element: 'light',
    name: 'Goldfinch Dawnlancer',
    title: 'Morning, sharpened.',
    rarity: 3,
    stats: { hp: 1137, atk: 166, def: 101, speed: 111 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Goldfinchdawnlanceridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'goldfinch_dawnlancer_stroke', name: 'Dawnlancer Stroke',
        icon: 'assets/icons/fc1587.png',
        description: 'Two dawn-lit strokes: 88% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.88 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'goldfinch_dawnlancer_flare', name: 'Dawnlancer Flare',
        icon: 'assets/icons/fc1447.png',
        description: 'A flare of morning: 138% ATK, and the light mends 6% of max HP.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.38 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.06 },
        ],
      },
      {
        id: 'goldfinch_dawnlancer_zenith', name: 'Dawnlancer Zenith',
        icon: 'assets/icons/fc730.png',
        description: 'High noon: 201% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.01 },
        ],
      },
    ],
    passive: {
      name: 'Dawnlancer Resolve',
      icon: 'assets/icons/fc1003.png',
      description: 'Heals 5% max HP at turn start while below 45% HP.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp >= 0.45) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.05));
          if (healed <= 0) return null;
          return {
            label: 'Dawnlancer Resolve',
            message: `${unit.name}'s light knits ${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#f8d86a' }],
          };
        },
      },
    },
    positional: POSITIONALS.bulwark_oath,
  },

  lark_brightcall: {
    id: 'lark_brightcall',
    element: 'light',
    name: 'Lark Brightcall',
    title: 'Good news travels armed.',
    rarity: 3,
    stats: { hp: 1146, atk: 171, def: 80, speed: 113 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Larkbrightcallidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'lark_brightcall_call', name: 'Brightcall\'s Call',
        icon: 'assets/icons/fc868.png',
        description: 'Two ringing notes: 89% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.89 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'lark_brightcall_proclamation', name: 'Brightcall\'s Proclamation',
        icon: 'assets/icons/fc869.png',
        description: 'Lift an ally: +11% ATK for 2 turns and 7% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.11, turns: 2 },
          { type: 'turnMeter', amount: 0.07 },
        ],
      },
      {
        id: 'lark_brightcall_triumph', name: 'Brightcall\'s Triumph',
        icon: 'assets/icons/fc882.png',
        description: 'Declare the day won: ALL allies gain +6% SPD for 2 turns and 4% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.06, turns: 2 },
          { type: 'turnMeter', amount: 0.04 },
        ],
      },
    ],
    passive: {
      name: 'Brightcall Anthem',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start: ALL allies gain +5% DEF for 1 turn and a sliver of healing.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) { a.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.05, turns: 1 }); a.heal(Math.round(unit.maxHp * 0.003), unit); }
          return null; // silent — small rolling anthem
        },
      },
    },
    positional: POSITIONALS.windrunner,
  },

  ibis_truthbeak: {
    id: 'ibis_truthbeak',
    element: 'light',
    name: 'Ibis Truthbeak',
    title: 'Verdicts delivered in person.',
    rarity: 3,
    stats: { hp: 1155, atk: 176, def: 83, speed: 97 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Ibistruthbeakidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'ibis_truthbeak_gavel', name: 'Truthbeak\'s Gavel',
        icon: 'assets/icons/fc1461.png',
        description: 'Two measured blows: 90% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'ibis_truthbeak_inquest', name: 'Truthbeak\'s Inquest',
        icon: 'assets/icons/fc862.png',
        description: 'Open the case: 130% ATK and the target takes +15% damage for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.15, turns: 2 },
        ],
      },
      {
        id: 'ibis_truthbeak_verdict', name: 'Truthbeak\'s Verdict',
        icon: 'assets/icons/fc744.png',
        description: 'Deliver the verdict: 203% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.03 },
        ],
      },
    ],
    passive: {
      name: 'Truthbeak Justice',
      icon: 'assets/icons/fc863.png',
      description: 'Justice sees clearly: deals 35% extra damage to enemies with 3 or more afflictions.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.filter((fx) => fx.kind === 'debuff' || fx.kind === 'dot').length >= 3 ? 1.35 : 1;
        },
      },
    },
    positional: POSITIONALS.pivot_step,
  },

  osprey_seahammer: {
    id: 'osprey_seahammer',
    element: 'fire',
    name: 'Osprey Seahammer',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1406, atk: 200, def: 105, speed: 102 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Ospreyseahammeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'osprey_seahammer_strike', name: 'Seahammer\'s Strike',
        icon: 'assets/icons/fc730.png',
        description: 'Two champion blows: 78% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.78 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'osprey_seahammer_onslaught', name: 'Seahammer\'s Onslaught',
        icon: 'assets/icons/fc1447.png',
        description: 'Press the advantage: 161% ATK, then +8% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.61 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.08, turns: 2 },
        ],
      },
      {
        id: 'osprey_seahammer_supremacy', name: 'Seahammer\'s Supremacy',
        icon: 'assets/icons/fc767.png',
        description: 'Settle it: 212% ATK and -7% DEF for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.12 },
          { type: 'debuff', stat: 'def', mult: 0.93, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Seahammer Supremacy',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 7% more and takes 5% less damage.',
      hooks: {
        damageDealtMult() { return 1.07; },
        damageTakenMult() { return 0.95; },
      },
    },
    positional: POSITIONALS.reckless_charge,
  },

  kestrel_spellgale: {
    id: 'kestrel_spellgale',
    element: 'wind',
    name: 'Kestrel Spellgale',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1418, atk: 206, def: 109, speed: 105 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Kestrelspellgaleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'kestrel_spellgale_bolt', name: 'Spellgale\'s Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'Twin arcane bolts: 79% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.79 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'kestrel_spellgale_torrent', name: 'Spellgale\'s Torrent',
        icon: 'assets/icons/fc1084.png',
        description: 'A torrent of power: 102% ATK to ALL enemies and -5% SPD for 2 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.02 },
          { type: 'debuff', stat: 'speed', mult: 0.95, turns: 2 },
        ],
      },
      {
        id: 'kestrel_spellgale_cataclysm', name: 'Spellgale\'s Cataclysm',
        icon: 'assets/icons/fc1044.png',
        description: 'The big one: 118% ATK to ALL enemies and -8% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.18 },
          { type: 'debuff', stat: 'atk', mult: 0.92, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Spellgale Resonance',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, arcane bleed sears ALL enemies for 0.8% of this hero\'s max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.maxHp * 0.008));
          for (const e of enemies) Abilities.strike(unit, e, amount);
          return null; // silent — small rolling resonance
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  condor_skywall: {
    id: 'condor_skywall',
    element: 'water',
    name: 'Condor Skywall',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1430, atk: 212, def: 113, speed: 108 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Condorskywallidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'condor_skywall_bash', name: 'Skywall\'s Bash',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield strikes: 80% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'condor_skywall_bulwark', name: 'Skywall\'s Bulwark',
        icon: 'assets/icons/fc855.png',
        description: 'Anchor the line: ALL allies gain +10% DEF for 2 turns and take 4% less damage for 1 turn.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.1, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.96, turns: 1 },
        ],
      },
      {
        id: 'condor_skywall_stand', name: 'Skywall\'s Stand',
        icon: 'assets/icons/fc856.png',
        description: 'Refuse to fall: takes 27% less damage for 2 turns and heals 9% max HP.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.73, turns: 2 },
          { type: 'healHpPct', pct: 0.09 },
        ],
      },
    ],
    passive: {
      name: 'Skywall Aegis',
      icon: 'assets/icons/fc868.png',
      description: 'The wall holds while the flock is whole: takes 18% less damage until an ally falls.',
      hooks: {
        damageTakenMult(unit) {
          const battle = typeof Battle !== 'undefined' ? Battle.active : null;
          if (!battle) return 1;
          const fallen = battle.units.some((u) => u.team === unit.team && !u.alive);
          return fallen ? 1 : 0.82;
        },
      },
    },
    positional: POSITIONALS.thornguard,
  },

  harrier_farstrike: {
    id: 'harrier_farstrike',
    element: 'fire',
    name: 'Harrier Farstrike',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1442, atk: 218, def: 117, speed: 111 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Harrierfarstrikeidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'harrier_farstrike_shot', name: 'Farstrike\'s Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'Two placed shots: 81% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.81 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'harrier_farstrike_deadeye', name: 'Farstrike\'s Deadeye',
        icon: 'assets/icons/fc1516.png',
        description: 'The perfect line: 174% ATK and drains 8% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.74 },
          { type: 'turnMeter', amount: -0.08 },
        ],
      },
      {
        id: 'harrier_farstrike_barrage', name: 'Farstrike\'s Barrage',
        icon: 'assets/icons/fc807.png',
        description: 'Fill the sky: 100% ATK to ALL enemies.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'turnMeter', amount: -0.02 },
        ],
      },
    ],
    passive: {
      name: 'Farstrike Focus',
      icon: 'assets/icons/fc862.png',
      description: 'The shot is already lined up (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.04, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.07, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.overwatch,
  },

  flamingo_rosemyst: {
    id: 'flamingo_rosemyst',
    element: 'wind',
    name: 'Flamingo Rosemyst',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1454, atk: 224, def: 121, speed: 114 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Flamingorosemystidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'flamingo_rosemyst_touch', name: 'Rosemyst\'s Touch',
        icon: 'assets/icons/fc1112.png',
        description: 'Two chastening touches: 82% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.82 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'flamingo_rosemyst_blessing', name: 'Rosemyst\'s Blessing',
        icon: 'assets/icons/fc800.png',
        description: 'Mend an ally: 13% of max HP plus 1.7% regen for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.13 },
          { type: 'hot', pct: 0.017, turns: 2 },
        ],
      },
      {
        id: 'flamingo_rosemyst_renewal', name: 'Rosemyst\'s Renewal',
        icon: 'assets/icons/fc869.png',
        description: 'The circle holds: ALL allies heal 40% of ATK, are cleansed, and gain +5% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.4 },
          { type: 'cleanse' },
          { type: 'buff', stat: 'def', mult: 1.05, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Rosemyst Communion',
      icon: 'assets/icons/fc1003.png',
      description: 'Healing woven a little stronger.',
      hooks: { healBoostAdd: 0.17 },
    },
    positional: POSITIONALS.keystone,
  },

  skua_voidbeak: {
    id: 'skua_voidbeak',
    element: 'dark',
    name: 'Skua Voidbeak',
    title: 'Champion of the Dark',
    rarity: 4,
    stats: { hp: 1466, atk: 230, def: 125, speed: 100 },
    tint: { body: '#241f33', helm: '#3d3350', weapon: '#9a7ad0', skin: '#8a82a0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Skuavoidbeakidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'skua_voidbeak_grasp', name: 'Voidbeak\'s Grasp',
        icon: 'assets/icons/fc1444.png',
        description: 'Two grasping shadows: 83% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.83 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'skua_voidbeak_devour', name: 'Voidbeak\'s Devour',
        icon: 'assets/icons/fc825.png',
        description: 'Feed the void: 156% ATK, healing this hero for 28% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.56 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.28 },
        ],
      },
      {
        id: 'skua_voidbeak_oblivion', name: 'Voidbeak\'s Oblivion',
        icon: 'assets/icons/fc734.png',
        description: 'Unmake them: 227% ATK and the target takes +17% damage for 1 turn.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.27 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.17, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Voidbeak Thirst',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, drains 1.3% of max HP from the weakest enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          enemies.sort((a, b) => a.hp - b.hp);
          const amount = Math.max(1, Math.round(unit.maxHp * 0.013));
          Abilities.strike(unit, enemies[0], amount);
          unit.heal(amount);
          return null; // silent — small rolling thirst
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  tern_lightcrest: {
    id: 'tern_lightcrest',
    element: 'light',
    name: 'Tern Lightcrest',
    title: 'Champion of the Dawn',
    rarity: 4,
    stats: { hp: 1478, atk: 200, def: 103, speed: 103 },
    tint: { body: '#e0d3a8', helm: '#f5e9c0', weapon: '#ffdf70', skin: '#f0e4c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Ternlightcrestidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'tern_lightcrest_radiance', name: 'Lightcrest\'s Radiance',
        icon: 'assets/icons/fc1471.png',
        description: 'Two radiant strikes: 84% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.84 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'tern_lightcrest_benediction', name: 'Lightcrest\'s Benediction',
        icon: 'assets/icons/fc1112.png',
        description: 'Bless an ally: heals 15% of max HP and grants 9% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.15 },
          { type: 'turnMeter', amount: 0.09 },
        ],
      },
      {
        id: 'tern_lightcrest_ascension', name: 'Lightcrest\'s Ascension',
        icon: 'assets/icons/fc855.png',
        description: 'Lift the whole line: ALL allies heal 46% of ATK and gain +6% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.46 },
          { type: 'buff', stat: 'atk', mult: 1.06, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Lightcrest Benevolence',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, ALL allies heal 0.6% of this hero\'s max HP and gain a small def blessing for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) {
            a.heal(Math.round(unit.maxHp * 0.006), unit);
            a.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.03, turns: 1 });
          }
          return null; // silent — small rolling benevolence
        },
      },
    },
    positional: POSITIONALS.pivot_step,
  },

});
