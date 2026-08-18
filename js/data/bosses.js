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
        description: 'Rake the entire front line for 150% ATK.',
        cooldown: 0, targeting: 'front-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.5 }],
      },
      {
        id: 'fire_breath', name: 'Fire Breath',
        icon: 'assets/icons/fc998.png',
        description: 'Engulf ALL heroes for 90% ATK — heroes shrouded in ' +
          'methane fog are IGNITED for double damage.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9, bonusVs: { stat: 'methane', mult: 2 } },
        ],
      },
      {
        id: 'methane_fog', name: 'Methane Fog',
        icon: 'assets/icons/fc675.png',
        description: 'Blanket the party in flammable fog for 3 turns ' +
          '(resistible). Fire Breath detonates it.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'debuff', stat: 'methane', mult: 1, turns: 3 }],
      },
    ],
    // Bosses carry three unique passives (and no positional bonuses).
    passives: [
      {
        name: 'Enrage',
        icon: 'assets/icons/fc743.png',
        description: 'Deals 30% extra damage while below half HP.',
        hooks: {
          damageDealtMult(unit) {
            return unit.hp / unit.maxHp < 0.5 ? 1.3 : 1;
          },
        },
      },
      {
        name: 'Ancient Scales',
        icon: 'assets/icons/fc853.png',
        description: 'Takes 50% less damage while below 30% HP.',
        hooks: {
          damageTakenMult(unit) {
            return unit.hp / unit.maxHp < 0.3 ? 0.5 : 1;
          },
        },
      },
      {
        name: 'Draconic Vigor',
        icon: 'assets/icons/fc713.png',
        description: 'Regenerates 5% max HP at the start of each turn.',
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
        description: 'Crush a hero for 125% ATK and slow them: -10% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.25 },
          { type: 'debuff', stat: 'speed', mult: 0.9, turns: 1 },
        ],
      },
      {
        id: 'gnawing_horde', name: 'Gnawing Horde',
        icon: 'assets/icons/fc1066.png',
        description: 'The horde swarms ALL heroes: 80% ATK and -15% ATK for 2 turns.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'debuff', stat: 'atk', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'rat_flood', name: 'Rat Flood',
        icon: 'assets/icons/fc1067.png',
        description: 'Drown a hero row in vermin: 140% ATK and their action bars are cut by 30%.',
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
        description: 'Has a 15% chance to dodge any attack.',
        hooks: { dodgeAdd: 0.15 },
      },
      {
        name: 'Crown of Filth',
        icon: 'assets/icons/fc1050.png',
        description: 'Deals 20% extra damage to debuffed enemies.',
        hooks: {
          damageDealtMult(unit, target) {
            return target && target.statusEffects &&
              target.statusEffects.some((fx) => fx.kind === 'debuff') ? 1.2 : 1;
          },
        },
      },
      {
        name: 'Royal Haste',
        icon: 'assets/icons/fc885.png',
        description: 'Has a 20% chance to take another turn after acting.',
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
        description: 'Tear at a hero for 120% ATK and rend armor: -15% DEF for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'debuff', stat: 'def', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'wing_buffet', name: 'Wing Buffet',
        icon: 'assets/icons/fc785.png',
        description: 'Batter ALL heroes for 75% ATK and knock their action bars back 15%.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'turnMeter', amount: -0.15 },
        ],
      },
      {
        id: 'death_from_above', name: 'Death From Above',
        icon: 'assets/icons/fc763.png',
        description: 'A murderous dive on one hero: 250% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 2.5 }],
      },
    ],
    passives: [
      {
        name: 'Carrion Gorge',
        icon: 'assets/icons/fc713.png',
        description: 'Regenerates 5% max HP at the start of each turn.',
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
        description: 'Deals 30% extra damage to enemies below half HP.',
        hooks: {
          damageDealtMult(unit, target) {
            return target && target.alive && target.hp / target.maxHp < 0.5 ? 1.3 : 1;
          },
        },
      },
      {
        name: 'Storm Wings',
        icon: 'assets/icons/fc793.png',
        description: 'Has a 20% chance to dodge any attack.',
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
        description: 'A monstrous axe sweep across the front line for 140% ATK.',
        cooldown: 0, targeting: 'front-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.4 }],
      },
      {
        id: 'labyrinthine_charge', name: 'Labyrinthine Charge',
        icon: 'assets/icons/fc767.png',
        description: 'Charge through a hero row for 130% ATK.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.3 }],
      },
      {
        id: 'wrath_of_the_maze', name: 'Wrath of the Maze',
        icon: 'assets/icons/fc999.png',
        description: 'The maze quakes: 100% ATK to ALL heroes and shatters armor, -20% DEF for 2 turns.',
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
        description: 'Deals 25% extra damage to heroes at full HP.',
        hooks: {
          damageDealtMult(unit, target) {
            return target && target.alive && target.hp >= target.maxHp ? 1.25 : 1;
          },
        },
      },
      {
        name: 'Labyrinth Walls',
        icon: 'assets/icons/fc853.png',
        description: 'Takes 30% less damage while above 70% HP.',
        hooks: {
          damageTakenMult(unit) {
            return unit.hp / unit.maxHp > 0.7 ? 0.7 : 1;
          },
        },
      },
      {
        name: 'Undying Fury',
        icon: 'assets/icons/fc743.png',
        description: 'Deals 40% extra damage while below half HP.',
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
        description: 'A royal strike for 120% ATK that poisons for 30% ATK per turn (2 turns).',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'dot', pct: 0.3, turns: 2 },
        ],
      },
      {
        id: 'venomous_deluge', name: 'Venomous Deluge',
        icon: 'assets/icons/fc1067.png',
        description: 'Drench ALL heroes: 70% ATK plus poison for 35% ATK per turn (2 turns).',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.7 },
          { type: 'dot', pct: 0.35, turns: 2 },
        ],
      },
      {
        id: 'constrict_and_devour', name: 'Constrict & Devour',
        icon: 'assets/icons/fc748.png',
        description: 'Crush ALL heroes for 90% ATK — poisoned heroes take double damage.',
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
        description: '+50% debuff resistance.',
        hooks: { resistanceAdd: 0.50 },
      },
      {
        name: 'Lingering Venom',
        icon: 'assets/icons/fc1069.png',
        description: '+75% DoT damage.',
        hooks: { dotBoostAdd: 0.75 },
      },
      {
        name: 'Molt',
        icon: 'assets/icons/fc713.png',
        description: 'Regenerates 4% max HP at the start of each turn.',
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
};
