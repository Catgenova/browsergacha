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
        description: 'A royal strike for 120% ATK that poisons for 60% ATK per turn (2 turns).',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'dot', pct: 0.6, turns: 2 },
        ],
      },
      {
        id: 'venomous_deluge', name: 'Venomous Deluge',
        icon: 'assets/icons/fc1067.png',
        description: 'Drench ALL heroes: 70% ATK plus poison for 70% ATK per turn (2 turns).',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.7 },
          { type: 'dot', pct: 0.7, turns: 2 },
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
        description: 'Single out a hero: 140% ATK with a 30% chance to ' +
          'STUN for 1 turn (resistible).',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.4 },
          { type: 'stun', chance: 0.3, turns: 1 },
        ],
      },
      {
        id: 'blizzard_howl', name: 'Blizzard Howl',
        icon: 'assets/icons/fc1084.png',
        description: 'A killing wind: 85% ATK to ALL heroes and a deep ' +
          'chill: -20% SPD for 2 turns (resistible).',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
          { type: 'debuff', stat: 'speed', mult: 0.8, turns: 2 },
        ],
      },
      {
        id: 'avalanche_pounce', name: 'Avalanche Pounce',
        icon: 'assets/icons/fc767.png',
        description: 'Crash down on the front line for 150% ATK — heroes ' +
          'frozen stiff (stunned) are crushed for DOUBLE damage.',
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
        description: 'Deals 30% extra damage to slowed or stunned heroes.',
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
        description: 'Takes 30% less damage while above half HP.',
        hooks: {
          damageTakenMult(unit) {
            return unit.hp / unit.maxHp > 0.5 ? 0.7 : 1;
          },
        },
      },
      {
        name: 'Endless Hunt',
        icon: 'assets/icons/fc882.png',
        description: '15% chance to take another turn after acting.',
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
        description: 'Gore a hero for 145% ATK and split their armor: ' +
          '-15% DEF for 2 turns (resistible).',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.45 },
          { type: 'debuff', stat: 'def', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'earthshaker_charge', name: 'Earthshaker Charge',
        icon: 'assets/icons/fc767.png',
        description: 'Shake the whole savanna: 80% ATK to ALL heroes and ' +
          '-10% turn meter.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'turnMeter', amount: -0.10 },
        ],
      },
      {
        id: 'shieldbreaker_stampede', name: 'Shieldbreaker Stampede',
        icon: 'assets/icons/fc730.png',
        description: 'Trample the front line for 160% ATK — heroes whose ' +
          'DEF is altered (buffed or broken) are crushed for 75% more.',
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
        description: 'Takes 20% less damage from all sources.',
        hooks: {
          damageTakenMult() { return 0.8; },
        },
      },
      {
        name: 'Trample Momentum',
        icon: 'assets/icons/fc882.png',
        description: '12% chance to take another turn after acting.',
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
        description: 'Maul a hero for 150% ATK, feeding on the blow: ' +
          'heals himself for 50% of his ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.5 }],
        selfEffects: [{ type: 'heal', mult: 0.5 }],
      },
      {
        id: 'ursine_roar', name: 'Ursine Roar',
        icon: 'assets/icons/fc1084.png',
        description: 'A roar older than the valley: 80% ATK to ALL heroes ' +
          'and -15% ATK for 2 turns (resistible).',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'debuff', stat: 'atk', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'hibernate', name: 'Hibernate',
        icon: 'assets/icons/fc1112.png',
        description: 'Curl into the long sleep: heals 20% of his max HP ' +
          'and takes 25% less damage for 2 turns. Wounds that fester ' +
          '(DoTs) still burn through it.',
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
        description: 'Regenerates 6% max HP at the start of each turn.',
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
        description: 'His healing is 30% stronger.',
        hooks: { healBoostAdd: 0.30 },
      },
      {
        name: 'Crushing Paws',
        icon: 'assets/icons/fc863.png',
        description: 'Deals 25% extra damage to heroes at full HP.',
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
        description: 'Single out a hero: 140% ATK that steals 15% of ' +
          'their turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.4 },
          { type: 'turnMeter', amount: -0.15 },
        ],
      },
      {
        id: 'commanding_roar', name: 'Commanding Roar',
        icon: 'assets/icons/fc1084.png',
        description: 'The meadow obeys: 75% ATK to ALL heroes and -12% ' +
          'turn meter, while the Regent surges 15% up his own.',
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
        description: 'A blur of claws across the front line: three ' +
          'swipes of 65% ATK each.',
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
        description: 'Deals 30% extra damage to heroes below half turn meter.',
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
        description: '20% chance to dodge attacks.',
        hooks: { dodgeAdd: 0.20 },
      },
      {
        name: 'Endless Prowl',
        icon: 'assets/icons/fc868.png',
        description: 'Gains +10% SPD for 2 turns at the start of each turn (stacks).',
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
