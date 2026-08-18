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
    stats: { hp: 9000, atk: 230, def: 150, speed: 130 },
    sprite: {
      displayH: 230,
      strips: {
        idle: { src: 'assets/bosses/dragonidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'claw_swipe', name: 'Claw Swipe',
        icon: 'assets/icons/fc746.png',
        description: 'Rake a hero for 110% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.1 }],
      },
      {
        id: 'tail_sweep', name: 'Tail Sweep',
        icon: 'assets/icons/fc724.png',
        description: 'Sweep a hex row for 90% ATK.',
        cooldown: 3, targeting: 'enemy-row', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.9 }],
      },
      {
        id: 'dragon_breath', name: 'Dragon Breath',
        icon: 'assets/icons/fc998.png',
        description: 'Engulf ALL heroes in flame for 100% ATK.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.0 }],
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
        description: 'Takes 15% less damage from all attacks.',
        hooks: {
          damageTakenMult() {
            return 0.85;
          },
        },
      },
      {
        name: 'Draconic Vigor',
        icon: 'assets/icons/fc713.png',
        description: 'Regenerates 3% max HP at the start of each turn.',
        hooks: {
          onTurnStart(unit) {
            const healed = unit.heal(Math.round(unit.maxHp * 0.03));
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
    name: 'Rat King',
    title: 'Monarch of the Under-Sewers',
    rarity: 5,
    isBoss: true,
    stats: { hp: 8200, atk: 215, def: 130, speed: 140 },
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
        description: 'Crush a hero for 110% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.1 }],
      },
      {
        id: 'plague_wave', name: 'Plague Wave',
        icon: 'assets/icons/fc1066.png',
        description: 'Sicken a hero row: 95% ATK and -15% ATK for 2 turns.',
        cooldown: 3, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'debuff', stat: 'atk', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'kings_feast', name: "King's Feast",
        icon: 'assets/icons/fc1067.png',
        description: 'The horde swarms ALL heroes: 90% ATK and -15% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'debuff', stat: 'speed', mult: 0.85, turns: 2 },
        ],
      },
    ],
    passives: [
      {
        name: 'Skitterguard',
        icon: 'assets/icons/fc882.png',
        description: 'Has a 10% chance to dodge any attack.',
        hooks: { dodgeAdd: 0.10 },
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
        description: 'Has a 10% chance to take another turn after acting.',
        hooks: { extraTurnAdd: 0.10 },
      },
    ],
    positional: null,
  },

  carrion_king: {
    id: 'boss_carrion_king',
    element: 'wind',
    gearSet: 'avian',
    name: 'Carrion King',
    title: 'Sovereign of the Bonefield',
    rarity: 5,
    isBoss: true,
    stats: { hp: 8600, atk: 225, def: 135, speed: 135 },
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
        description: 'Tear at a hero for 110% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.1 }],
      },
      {
        id: 'wing_buffet', name: 'Wing Buffet',
        icon: 'assets/icons/fc785.png',
        description: 'Batter ALL heroes for 70% ATK with a storm of wings.',
        cooldown: 3, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.7 }],
      },
      {
        id: 'death_from_above', name: 'Death From Above',
        icon: 'assets/icons/fc763.png',
        description: 'A murderous dive: 200% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 2.0 }],
      },
    ],
    passives: [
      {
        name: 'Carrion Gorge',
        icon: 'assets/icons/fc713.png',
        description: 'Regenerates 4% max HP at the start of each turn.',
        hooks: {
          onTurnStart(unit) {
            const healed = unit.heal(Math.round(unit.maxHp * 0.04));
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
        description: 'Deals 20% extra damage to enemies below half HP.',
        hooks: {
          damageDealtMult(unit, target) {
            return target && target.alive && target.hp / target.maxHp < 0.5 ? 1.2 : 1;
          },
        },
      },
      {
        name: 'Storm Wings',
        icon: 'assets/icons/fc793.png',
        description: 'Has a 15% chance to dodge any attack.',
        hooks: { dodgeAdd: 0.15 },
      },
    ],
    positional: null,
  },
};
