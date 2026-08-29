// Boss definitions. A boss fights alone: it occupies the whole enemy
// formation, standing on the center tile with a sprite that spans all
// seven hexes. `isBoss` makes row/back targeting always include it and
// switches the renderer to boss-scale bars and shadow.
//
// Bosses lean on high speed (extra turns) and AoE to fight a full
// seven-hero party with a single action bar.

const BOSSES = {
  dragon: {
    id: 'boss_dragon',
    element: 'fire',
    gearSet: 'dragon',
    name: 'Dragon',
    title: 'Tyrant of the Clearing',
    rarity: 5,
    isBoss: true,
    background: 'assets/battle_bg_volcano.png', // boss arena, all stages
    stats: { hp: 15000, atk: 500, def: 300, speed: 130 }, // lv5 reference
    // Exact anchors: stage 1 (Lv 5) and stage 20 (Lv 100), interpolated.
    stats5: { hp: 15000, atk: 500, def: 300, speed: 130 },
    stats100: { hp: 100000, atk: 12500, def: 2000, speed: 130 },
    sprite: {
      displayH: 230,
      strips: {
        idle: { src: 'assets/bosses/dragonidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cleave_sweep', name: 'Cleave Sweep',
        icon: 'assets/icons/fc730.png',
        description: 'Enemy front row: 150% ATK damage.',
        cooldown: 0, targeting: 'front-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.5 }],
      },
      {
        id: 'fire_breath', name: 'Fire Breath',
        icon: 'assets/icons/fc998.png',
        description: 'All enemies: 90% ATK damage (180% vs a fogged target).',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9, bonusVs: { stat: 'methane', mult: 2 } },
        ],
      },
      {
        id: 'methane_fog', name: 'Methane Fog',
        icon: 'assets/icons/fc675.png',
        description: 'All enemies: Methane Fog: takes double damage from Fire Breath for 3 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'debuff', stat: 'methane', mult: 1, turns: 3 }],
      },
    ],
    // Bosses carry three unique passives (and no positional bonuses).
    passives: [
      {
        name: 'Enrage',
        icon: 'assets/icons/fc743.png',
        description: '+30% damage dealt while below half HP.',
        hooks: {
          damageDealtMult(unit) {
            return unit.hp / unit.maxHp < 0.5 ? 1.3 : 1;
          },
        },
      },
      {
        name: 'Ancient Scales',
        icon: 'assets/icons/fc853.png',
        description: '-50% damage taken while below 30% HP.',
        hooks: {
          damageTakenMult(unit) {
            return unit.hp / unit.maxHp < 0.3 ? 0.5 : 1;
          },
        },
      },
      {
        name: 'Draconic Vigor',
        icon: 'assets/icons/fc713.png',
        description: 'Start of each turn: heals 5% of max HP.',
        hooks: {
          onTurnStart(unit) {
            const healed = unit.heal(Math.round(unit.maxHp * 0.05));
            if (healed <= 0) return null;
            return {
              label: 'Draconic Vigor',
              message: `The ${unit.name}'s wounds knit closed (+${healed} HP).`,
              floats: [{ target: unit, text: `+${healed}`, color: '#7ae87a' }],
            };
          },
        },
      },
    ],
    positional: null,
  },

  rat_king: {
    id: 'boss_rat_king',
    element: 'dark',
    gearSet: 'rat',
    background: 'assets/battle_bg_clearing.png',
    name: 'Rat King',
    title: 'Monarch of the Under-Sewers',
    rarity: 5,
    isBoss: true,
    stats: { hp: 13000, atk: 450, def: 260, speed: 145 }, // lv5 reference
    stats5: { hp: 13000, atk: 450, def: 260, speed: 145 },
    stats100: { hp: 85000, atk: 11000, def: 1700, speed: 145 },
    sprite: {
      displayH: 230,
      strips: {
        idle: { src: 'assets/bosses/Ratkingidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'scepter_smash', name: 'Scepter Smash',
        icon: 'assets/icons/fc1477.png',
        description: 'One enemy: 125% ATK damage; -10% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.25 },
          { type: 'debuff', stat: 'speed', mult: 0.9, turns: 1 },
        ],
      },
      {
        id: 'gnawing_horde', name: 'Gnawing Horde',
        icon: 'assets/icons/fc1066.png',
        description: 'All enemies: 80% ATK damage; -15% ATK for 2 turns.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'debuff', stat: 'atk', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'rat_flood', name: 'Rat Flood',
        icon: 'assets/icons/fc1067.png',
        description: 'One enemy and their row: 140% ATK damage; -30% turn meter.',
        cooldown: 7, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.4 },
          { type: 'turnMeter', amount: -0.3 },
        ],
      },
    ],
    passives: [
      {
        name: 'Skitterguard',
        icon: 'assets/icons/fc882.png',
        description: '+15% Dodge.',
        hooks: { dodgeAdd: 0.15 },
      },
      {
        name: 'Crown of Filth',
        icon: 'assets/icons/fc1050.png',
        description: '+20% damage to debuffed enemies.',
        hooks: {
          damageDealtMult(unit, target) {
            // A dot is a debuff, so a poisoned hero is a debuffed one.
            // This read `kind === 'debuff'` alone, which let a party
            // running poisons walk past a rider its own card names.
            return Unit.isDebuffed(target) ? 1.2 : 1;
          },
        },
      },
      {
        name: 'Royal Haste',
        icon: 'assets/icons/fc885.png',
        description: '20% chance to act again after each turn.',
        hooks: { extraTurnAdd: 0.20 },
      },
    ],
    positional: null,
  },

  carrion_king: {
    id: 'boss_carrion_king',
    element: 'wind',
    gearSet: 'avian',
    background: 'assets/battle_bg_canyon.png',
    name: 'Carrion King',
    title: 'Sovereign of the Bonefield',
    rarity: 5,
    isBoss: true,
    stats: { hp: 14000, atk: 480, def: 280, speed: 138 }, // lv5 reference
    stats5: { hp: 14000, atk: 480, def: 280, speed: 138 },
    stats100: { hp: 90000, atk: 12000, def: 1800, speed: 138 },
    sprite: {
      displayH: 230,
      strips: {
        idle: { src: 'assets/bosses/Carrionkingidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rending_beak', name: 'Rending Beak',
        icon: 'assets/icons/fc746.png',
        description: 'One enemy: 120% ATK damage; -15% DEF for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'debuff', stat: 'def', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'wing_buffet', name: 'Wing Buffet',
        icon: 'assets/icons/fc785.png',
        description: 'All enemies: 75% ATK damage; -15% turn meter.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'turnMeter', amount: -0.15 },
        ],
      },
      {
        id: 'death_from_above', name: 'Death From Above',
        icon: 'assets/icons/fc763.png',
        description: 'One enemy: 250% ATK damage.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 2.5 }],
      },
    ],
    passives: [
      {
        name: 'Carrion Gorge',
        icon: 'assets/icons/fc713.png',
        description: 'Start of each turn: heals 5% of max HP.',
        hooks: {
          onTurnStart(unit) {
            const healed = unit.heal(Math.round(unit.maxHp * 0.05));
            if (healed <= 0) return null;
            return {
              label: 'Carrion Gorge',
              message: `The ${unit.name} gorges on carrion (+${healed} HP).`,
              floats: [{ target: unit, text: `+${healed}`, color: '#7ae87a' }],
            };
          },
        },
      },
      {
        name: 'Bone Picker',
        icon: 'assets/icons/fc863.png',
        description: '+30% damage to enemies below half HP.',
        hooks: {
          damageDealtMult(unit, target) {
            return target && target.alive && target.hp / target.maxHp < 0.5 ? 1.3 : 1;
          },
        },
      },
      {
        name: 'Storm Wings',
        icon: 'assets/icons/fc793.png',
        description: '+20% Dodge.',
        hooks: { dodgeAdd: 0.20 },
      },
    ],
    positional: null,
  },

  labyrinth_king: {
    id: 'boss_labyrinth_king',
    element: 'fire',
    gearSet: 'minotaur',
    background: 'assets/battle_bg_bonefield.png',
    name: 'Labyrinth King',
    title: 'Tyrant of the Endless Maze',
    rarity: 5,
    isBoss: true,
    stats: { hp: 16000, atk: 520, def: 340, speed: 122 }, // lv5 reference
    stats5: { hp: 16000, atk: 520, def: 340, speed: 122 },
    stats100: { hp: 110000, atk: 11500, def: 2400, speed: 122 },
    sprite: {
      displayH: 230,
      strips: {
        idle: { src: 'assets/heroes/labyrinthkingidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'axe_of_the_maze', name: 'Axe of the Maze',
        icon: 'assets/icons/fc1467.png',
        description: 'Enemy front row: 140% ATK damage.',
        cooldown: 0, targeting: 'front-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.4 }],
      },
      {
        id: 'labyrinthine_charge', name: 'Labyrinthine Charge',
        icon: 'assets/icons/fc767.png',
        description: 'One enemy and their row: 130% ATK damage.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.3 }],
      },
      {
        id: 'wrath_of_the_maze', name: 'Wrath of the Maze',
        icon: 'assets/icons/fc999.png',
        description: 'All enemies: 100% ATK damage; -20% DEF for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'debuff', stat: 'def', mult: 0.8, turns: 2 },
        ],
      },
    ],
    passives: [
      {
        name: 'Bull Rush',
        icon: 'assets/icons/fc1038.png',
        description: '+25% damage to enemies at full HP.',
        hooks: {
          damageDealtMult(unit, target) {
            return target && target.alive && target.hp >= target.maxHp ? 1.25 : 1;
          },
        },
      },
      {
        name: 'Labyrinth Walls',
        icon: 'assets/icons/fc853.png',
        description: '-30% damage taken while above 70% HP.',
        hooks: {
          damageTakenMult(unit) {
            return unit.hp / unit.maxHp > 0.7 ? 0.7 : 1;
          },
        },
      },
      {
        name: 'Undying Fury',
        icon: 'assets/icons/fc743.png',
        description: '+40% damage dealt while below half HP.',
        hooks: {
          damageDealtMult(unit) {
            return unit.hp / unit.maxHp < 0.5 ? 1.4 : 1;
          },
        },
      },
    ],
    positional: null,
  },

  snake_empress: {
    id: 'boss_snake_empress',
    element: 'water',
    gearSet: 'snake',
    background: 'assets/battle_bg_glade.png',
    name: 'Snake Empress',
    title: 'Matriarch of the Glade Marshes',
    rarity: 5,
    isBoss: true,
    stats: { hp: 14000, atk: 470, def: 290, speed: 135 }, // lv5 reference
    stats5: { hp: 14000, atk: 470, def: 290, speed: 135 },
    stats100: { hp: 95000, atk: 11000, def: 1900, speed: 135 },
    sprite: {
      displayH: 230,
      faceLeft: true, // art is drawn facing left; don't mirror as an enemy
      strips: {
        idle: { src: 'assets/heroes/snakeempressidle.png', frames: 11, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'empress_fang', name: 'Empress Fang',
        icon: 'assets/icons/fc746.png',
        description: 'One enemy: 120% ATK damage; 60% ATK per turn for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'dot', pct: 0.6, turns: 2 },
        ],
      },
      {
        id: 'venomous_deluge', name: 'Venomous Deluge',
        icon: 'assets/icons/fc1067.png',
        description: 'All enemies: 70% ATK damage; 70% ATK per turn for 2 turns.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.7 },
          { type: 'dot', pct: 0.7, turns: 2 },
        ],
      },
      {
        id: 'constrict_and_devour', name: 'Constrict & Devour',
        icon: 'assets/icons/fc748.png',
        description: 'All enemies: 90% ATK damage (180% vs a target with a DoT).',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9, bonusVs: { kind: 'dot', mult: 2 } },
        ],
      },
    ],
    passives: [
      {
        name: "Empress's Blood",
        icon: 'assets/icons/fc856.png',
        description: '+50% Resistance.',
        hooks: { resistanceAdd: 0.50 },
      },
      {
        name: 'Lingering Venom',
        icon: 'assets/icons/fc1069.png',
        description: 'DoTs this unit applies tick 75% harder.',
        hooks: { dotBoostAdd: 0.75 },
      },
      {
        name: 'Molt',
        icon: 'assets/icons/fc713.png',
        description: 'Start of each turn: heals 4% of max HP.',
        hooks: {
          onTurnStart(unit) {
            const healed = unit.heal(Math.round(unit.maxHp * 0.04));
            if (healed <= 0) return null;
            return {
              label: 'Molt',
              message: `The ${unit.name} sheds her wounds (+${healed} HP).`,
              floats: [{ target: unit, text: `+${healed}`, color: '#7ae87a' }],
            };
          },
        },
      },
    ],
    positional: null,
  },
  winter_alpha: {
    id: 'boss_winter_alpha',
    element: 'water',
    gearSet: 'wolf',
    name: 'Winter Alpha',
    title: 'Sovereign of the Snowfield',
    rarity: 5,
    isBoss: true,
    background: 'assets/battle_bg_snowfield.png',
    stats: { hp: 15000, atk: 490, def: 310, speed: 142 }, // lv5 reference
    // Exact anchors: stage 1 (Lv 5) and stage 20 (Lv 100), interpolated.
    stats5: { hp: 15000, atk: 490, def: 310, speed: 142 },
    stats100: { hp: 105000, atk: 12000, def: 2100, speed: 142 },
    sprite: {
      displayH: 230,
      strips: {
        idle: { src: 'assets/bosses/winteralphaidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'winterfang', name: 'Winterfang',
        icon: 'assets/icons/fc734.png',
        description: 'One enemy: 140% ATK damage; 30% chance: stunned for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.4 },
          { type: 'stun', chance: 0.3, turns: 1 },
        ],
      },
      {
        id: 'blizzard_howl', name: 'Blizzard Howl',
        icon: 'assets/icons/fc1084.png',
        description: 'All enemies: 85% ATK damage; -20% SPD for 2 turns.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
          { type: 'debuff', stat: 'speed', mult: 0.8, turns: 2 },
        ],
      },
      {
        id: 'avalanche_pounce', name: 'Avalanche Pounce',
        icon: 'assets/icons/fc767.png',
        description: 'Enemy front row: 150% ATK damage (300% vs a stunned target).',
        cooldown: 6, targeting: 'front-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.5, bonusVs: { stat: 'stun', mult: 2 } },
        ],
      },
    ],
    // Bosses carry three unique passives (and no positional bonuses).
    passives: [
      {
        name: 'Alpha Predator',
        icon: 'assets/icons/fc863.png',
        description: '+30% damage to slowed or stunned enemies.',
        hooks: {
          damageDealtMult(unit, target) {
            return target && target.statusEffects.some((fx) =>
              fx.kind === 'debuff' && (fx.stat === 'speed' || fx.stat === 'stun'))
              ? 1.3 : 1;
          },
        },
      },
      {
        name: 'Winter Coat',
        icon: 'assets/icons/fc856.png',
        description: '-30% damage taken while above half HP.',
        hooks: {
          damageTakenMult(unit) {
            return unit.hp / unit.maxHp > 0.5 ? 0.7 : 1;
          },
        },
      },
      {
        name: 'Endless Hunt',
        icon: 'assets/icons/fc882.png',
        description: '15% chance to act again after each turn.',
        hooks: { extraTurnAdd: 0.15 },
      },
    ],
    positional: null,
  },
  boar_king: {
    id: 'boss_boar_king',
    element: 'wind',
    gearSet: 'boar',
    name: 'Boar King',
    title: 'Unmoved Monarch of the Savanna',
    rarity: 5,
    isBoss: true,
    background: 'assets/battle_bg_savanna.png',
    stats: { hp: 17000, atk: 460, def: 360, speed: 118 }, // lv5 reference
    // Exact anchors: stage 1 (Lv 5) and stage 20 (Lv 100), interpolated.
    stats5: { hp: 17000, atk: 460, def: 360, speed: 118 },
    stats100: { hp: 120000, atk: 10500, def: 2600, speed: 118 },
    sprite: {
      displayH: 230,
      strips: {
        idle: { src: 'assets/bosses/boarkingidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'tusk_gore', name: 'Tusk Gore',
        icon: 'assets/icons/fc746.png',
        description: 'One enemy: 145% ATK damage; -15% DEF for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.45 },
          { type: 'debuff', stat: 'def', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'earthshaker_charge', name: 'Earthshaker Charge',
        icon: 'assets/icons/fc767.png',
        description: 'All enemies: 80% ATK damage; -10% turn meter.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'turnMeter', amount: -0.10 },
        ],
      },
      {
        id: 'shieldbreaker_stampede', name: 'Shieldbreaker Stampede',
        icon: 'assets/icons/fc730.png',
        description: 'Enemy front row: 160% ATK damage (280% vs a target whose DEF has been changed).',
        cooldown: 6, targeting: 'front-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.6, bonusVs: { stat: 'def', mult: 1.75 } },
        ],
      },
    ],
    // Bosses carry three unique passives (and no positional bonuses).
    passives: [
      {
        name: 'Ironhide',
        icon: 'assets/icons/fc856.png',
        description: '20% chance to reflect all incoming damage.',
        hooks: { reflectAdd: 0.20 },
      },
      {
        name: "Sovereign's Bulk",
        icon: 'assets/icons/fc854.png',
        description: '-20% damage taken.',
        hooks: {
          damageTakenMult() { return 0.8; },
        },
      },
      {
        name: 'Trample Momentum',
        icon: 'assets/icons/fc882.png',
        description: '12% chance to act again after each turn.',
        hooks: { extraTurnAdd: 0.12 },
      },
    ],
    positional: null,
  },
  elder_bear: {
    id: 'boss_elder_bear',
    element: 'fire',
    gearSet: 'bear',
    name: 'Elder Bear',
    title: 'Old God of the Valley',
    rarity: 5,
    isBoss: true,
    background: 'assets/battle_bg_valley.png',
    stats: { hp: 20000, atk: 440, def: 300, speed: 115 }, // lv5 reference
    // Exact anchors: stage 1 (Lv 5) and stage 20 (Lv 100), interpolated.
    stats5: { hp: 20000, atk: 440, def: 300, speed: 115 },
    stats100: { hp: 140000, atk: 10000, def: 2200, speed: 115 },
    sprite: {
      displayH: 230,
      strips: {
        idle: { src: 'assets/bosses/elderbearidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'ancient_maul', name: 'Ancient Maul',
        icon: 'assets/icons/fc767.png',
        description: 'One enemy: 150% ATK damage; self: heals 50% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.5 }],
        selfEffects: [{ type: 'heal', mult: 0.5 }],
      },
      {
        id: 'ursine_roar', name: 'Ursine Roar',
        icon: 'assets/icons/fc1084.png',
        description: 'All enemies: 80% ATK damage; -15% ATK for 2 turns.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'debuff', stat: 'atk', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'hibernate', name: 'Hibernate',
        icon: 'assets/icons/fc1112.png',
        description: 'Self: heals 20% of caster max HP; -25% damage taken for 2 turns.',
        cooldown: 7, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.20 },
          { type: 'buff', stat: 'damageTaken', mult: 0.75, turns: 2 },
        ],
      },
    ],
    // Bosses carry three unique passives (and no positional bonuses).
    passives: [
      {
        name: 'Old Blood',
        icon: 'assets/icons/fc1093.png',
        description: 'Start of each turn: heals 6% of max HP.',
        hooks: {
          onTurnStart(unit) {
            const healed = unit.heal(Math.round(unit.maxHp * 0.06));
            if (healed <= 0) return null;
            return {
              label: 'Old Blood',
              message: `${unit.name}'s old blood knits ${healed} HP.`,
              floats: [{ target: unit, text: `+${healed}`, color: '#7ae87a' }],
            };
          },
        },
      },
      {
        name: 'Guttural Vigor',
        icon: 'assets/icons/fc1003.png',
        description: '+30% healing done.',
        hooks: { healBoostAdd: 0.30 },
      },
      {
        name: 'Crushing Paws',
        icon: 'assets/icons/fc863.png',
        description: '+25% damage to enemies at full HP.',
        hooks: {
          damageDealtMult(unit, target) {
            return target && target.alive && target.hp >= target.maxHp ? 1.25 : 1;
          },
        },
      },
    ],
    positional: null,
  },
  lion_regent: {
    id: 'boss_lion_regent',
    element: 'wind',
    gearSet: 'cat',
    name: 'Lion Regent',
    title: 'Crowned Idler of the Meadow',
    rarity: 5,
    isBoss: true,
    background: 'assets/battle_bg_meadow.png',
    stats: { hp: 14500, atk: 475, def: 290, speed: 150 }, // lv5 reference
    // Exact anchors: stage 1 (Lv 5) and stage 20 (Lv 100), interpolated.
    stats5: { hp: 14500, atk: 475, def: 290, speed: 150 },
    stats100: { hp: 100000, atk: 11500, def: 1950, speed: 150 },
    sprite: {
      displayH: 230,
      strips: {
        idle: { src: 'assets/bosses/lionregentidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'regal_pounce', name: 'Regal Pounce',
        icon: 'assets/icons/fc763.png',
        description: 'One enemy: 140% ATK damage; -15% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.4 },
          { type: 'turnMeter', amount: -0.15 },
        ],
      },
      {
        id: 'commanding_roar', name: 'Commanding Roar',
        icon: 'assets/icons/fc1084.png',
        description: 'All enemies: 75% ATK damage; -12% turn meter; self: +15% turn meter.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'turnMeter', amount: -0.12 },
        ],
        selfEffects: [{ type: 'turnMeter', amount: 0.15 }],
      },
      {
        id: 'nine_lives_flurry', name: 'Nine Lives Flurry',
        icon: 'assets/icons/fc744.png',
        description: 'Enemy front row: 3 hits of 65% ATK damage.',
        cooldown: 6, targeting: 'front-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.65 },
          { type: 'damage', mult: 0.65 },
          { type: 'damage', mult: 0.65 },
        ],
      },
    ],
    // Bosses carry three unique passives (and no positional bonuses).
    passives: [
      {
        name: 'Predator of Tempo',
        icon: 'assets/icons/fc863.png',
        description: '+30% damage to enemies below half turn meter.',
        hooks: {
          damageDealtMult(unit, target) {
            return target && target.turnMeter < CONFIG.TURN_METER_MAX * 0.5
              ? 1.3 : 1;
          },
        },
      },
      {
        name: 'Feline Grace',
        icon: 'assets/icons/fc882.png',
        description: '+20% Dodge.',
        hooks: { dodgeAdd: 0.20 },
      },
      {
        name: 'Endless Prowl',
        icon: 'assets/icons/fc868.png',
        description: 'Start of each turn: +10% SPD for 2 turns, stacking.',
        hooks: {
          onTurnStart(unit) {
            unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.1, turns: 2 });
            return null; // silent — the prowl never stops
          },
        },
      },
    ],
    positional: null,
  },
};
