// Dungeon bosses: three twenty-floor gauntlets farmed for what heroes
// need — materials and levels, never gear. Floors follow the
// boss-ladder rule — clearing one opens the next, cleared floors stay
// repeatable — and the payout scales with the floor:
//
//   Forgefather      The Grindhouse       100 Whetstones × floor
//   Arcane Warden    The Arcanum Vault     25 Arcana     × floor
//   Grandmaster      The Proving Grounds   25× enemy XP (a normal boss
//                                          pays 6×) — ~4 boss fights of
//                                          XP for the whole team
//
// They fight like the gear bosses — alone, spanning the whole enemy
// formation, interpolating between stats5 and stats100 — but drop no
// gear. `whetstonesPer`/`arcanaPer` are per-floor rates the battle
// builder multiplies by the floor being fought; `xpMult` replaces the
// standard boss ×6 on the XP the fight's enemy level is worth.

const DUNGEON_BOSSES = {
  whetstone: {
    id: 'dungeon_whetstone',
    element: 'fire',
    name: 'Forgefather',
    title: 'Keeper of the Grindhouse',
    dungeonName: 'The Grindhouse',
    whetstonesPer: 100,
    arcanaPer: 0,
    rarity: 5,
    isBoss: true,
    background: 'assets/battle_bg_volcano.png',
    tint: { body: '#8a7a68', helm: '#e8983a', weapon: '#f8d86a', skin: '#b8a890' },
    stats: { hp: 15000, atk: 490, def: 340, speed: 124 }, // lv5 reference
    stats5: { hp: 15000, atk: 490, def: 340, speed: 124 },
    stats100: { hp: 105000, atk: 11500, def: 2400, speed: 124 },
    sprite: { displayH: 230, strips: {} }, // procedural art until drawn
    abilities: [
      {
        id: 'grindstone_slam', name: 'Grindstone Slam',
        icon: 'assets/icons/fc767.png',
        description: 'Bring the wheel down across the front line for 140% ATK.',
        cooldown: 0, targeting: 'front-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.4 }],
      },
      {
        id: 'shower_of_sparks', name: 'Shower of Sparks',
        icon: 'assets/icons/fc998.png',
        description: 'Grind ALL heroes for 80% ATK and wear their armor: ' +
          '-15% DEF for 2 turns (resistible).',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'debuff', stat: 'def', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'millstone_crush', name: 'Millstone Crush',
        icon: 'assets/icons/fc730.png',
        description: 'Flatten one hero for 230% ATK with a 25% chance to ' +
          'STUN for 1 turn (resistible).',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.3 },
          { type: 'stun', chance: 0.25, turns: 1 },
        ],
      },
    ],
    passives: [
      {
        name: 'Tempered Hide',
        icon: 'assets/icons/fc856.png',
        description: 'Takes 25% less damage while above half HP.',
        hooks: {
          damageTakenMult(unit) {
            return unit.hp / unit.maxHp > 0.5 ? 0.75 : 1;
          },
        },
      },
      {
        name: 'Grind Them Down',
        icon: 'assets/icons/fc863.png',
        description: 'Deals 30% extra damage to heroes with broken armor (DEF down).',
        hooks: {
          damageDealtMult(unit, target) {
            return target && target.statusEffects.some((fx) =>
              fx.kind === 'debuff' && fx.stat === 'def') ? 1.3 : 1;
          },
        },
      },
      {
        name: 'Forge Heat',
        icon: 'assets/icons/fc713.png',
        description: 'Regenerates 4% max HP at the start of each turn.',
        hooks: {
          onTurnStart(unit) {
            const healed = unit.heal(Math.round(unit.maxHp * 0.04));
            if (healed <= 0) return null;
            return {
              label: 'Forge Heat',
              message: `The ${unit.name}'s cracks seal in the heat (+${healed} HP).`,
              floats: [{ target: unit, text: `+${healed}`, color: '#7ae87a' }],
            };
          },
        },
      },
    ],
    positional: null,
  },

  arcana: {
    id: 'dungeon_arcana',
    element: 'dark',
    name: 'Arcane Warden',
    title: 'Custodian of the Arcanum Vault',
    dungeonName: 'The Arcanum Vault',
    whetstonesPer: 0,
    arcanaPer: 25,
    rarity: 5,
    isBoss: true,
    background: 'assets/battle_bg_bonefield.png',
    tint: { body: '#5a4a8a', helm: '#8a7ab8', weapon: '#c8b8f8', skin: '#9a8ac8' },
    stats: { hp: 14000, atk: 500, def: 280, speed: 140 }, // lv5 reference
    stats5: { hp: 14000, atk: 500, def: 280, speed: 140 },
    stats100: { hp: 95000, atk: 12000, def: 1900, speed: 140 },
    sprite: { displayH: 230, strips: {} }, // procedural art until drawn
    abilities: [
      {
        id: 'hex_bolt', name: 'Hex Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'A lance of raw arcana: 120% ATK and -12% ATK for ' +
          '2 turns (resistible).',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'debuff', stat: 'atk', mult: 0.88, turns: 2 },
        ],
      },
      {
        id: 'entropy_wave', name: 'Entropy Wave',
        icon: 'assets/icons/fc999.png',
        description: 'Unravel ALL heroes for 80% ATK and bleed 10% from ' +
          'every action bar.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'turnMeter', amount: -0.10 },
        ],
      },
      {
        id: 'arcane_overload', name: 'Arcane Overload',
        icon: 'assets/icons/fc1067.png',
        description: 'Detonate a hero row for 150% ATK — hexed heroes ' +
          '(any debuff) take 50% more.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.5, bonusVs: { kind: 'debuff', mult: 1.5 } },
        ],
      },
    ],
    passives: [
      {
        name: 'Vault Wards',
        icon: 'assets/icons/fc853.png',
        description: 'Takes 20% less damage from all sources.',
        hooks: {
          damageTakenMult() { return 0.8; },
        },
      },
      {
        name: 'Feed on Weakness',
        icon: 'assets/icons/fc1069.png',
        description: 'Deals 20% extra damage to debuffed heroes.',
        hooks: {
          damageDealtMult(unit, target) {
            return target && target.statusEffects &&
              target.statusEffects.some((fx) => fx.kind === 'debuff') ? 1.2 : 1;
          },
        },
      },
      {
        name: 'Aether Step',
        icon: 'assets/icons/fc882.png',
        description: 'Has a 15% chance to dodge any attack.',
        hooks: { dodgeAdd: 0.15 },
      },
    ],
    positional: null,
  },

  xp: {
    id: 'dungeon_xp',
    element: 'light',
    name: 'Grandmaster',
    title: 'Headmaster of the Proving Grounds',
    dungeonName: 'The Proving Grounds',
    whetstonesPer: 0,
    arcanaPer: 0,
    xpMult: 25, // a normal boss fight pays 6x its enemy level's XP
    rarity: 5,
    isBoss: true,
    background: 'assets/battle_bg_meadow.png',
    tint: { body: '#c8b880', helm: '#f0e0a8', weapon: '#f8f0c8', skin: '#e0d0a0' },
    stats: { hp: 15000, atk: 480, def: 310, speed: 132 }, // lv5 reference
    stats5: { hp: 15000, atk: 480, def: 310, speed: 132 },
    stats100: { hp: 100000, atk: 11800, def: 2100, speed: 132 },
    sprite: { displayH: 230, strips: {} }, // procedural art until drawn
    abilities: [
      {
        id: 'first_lesson', name: 'First Lesson',
        icon: 'assets/icons/fc746.png',
        description: 'A measured strike for 130% ATK — the Grandmaster ' +
          'studies the answer: +8% ATK for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.3 }],
        selfEffects: [{ type: 'buff', stat: 'atk', mult: 1.08, turns: 2 }],
      },
      {
        id: 'pop_quiz', name: 'Pop Quiz',
        icon: 'assets/icons/fc999.png',
        description: 'Test ALL heroes at once: 75% ATK and -10% ATK for ' +
          '2 turns (resistible) for the unprepared.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'debuff', stat: 'atk', mult: 0.9, turns: 2 },
        ],
      },
      {
        id: 'final_exam', name: 'Final Exam',
        icon: 'assets/icons/fc730.png',
        description: 'The front line sits the exam: 160% ATK — heroes ' +
          'carrying any debuff fail it for 50% more.',
        cooldown: 6, targeting: 'front-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.6, bonusVs: { kind: 'debuff', mult: 1.5 } },
        ],
      },
    ],
    passives: [
      {
        name: 'Hard Lessons',
        icon: 'assets/icons/fc853.png',
        description: 'Takes 20% less damage from all sources.',
        hooks: {
          damageTakenMult() { return 0.8; },
        },
      },
      {
        name: 'Grading Curve',
        icon: 'assets/icons/fc863.png',
        description: 'Deals 25% extra damage to heroes at full HP.',
        hooks: {
          damageDealtMult(unit, target) {
            return target && target.alive && target.hp >= target.maxHp ? 1.25 : 1;
          },
        },
      },
      {
        name: 'Tenure',
        icon: 'assets/icons/fc713.png',
        description: 'Regenerates 4% max HP at the start of each turn.',
        hooks: {
          onTurnStart(unit) {
            const healed = unit.heal(Math.round(unit.maxHp * 0.04));
            if (healed <= 0) return null;
            return {
              label: 'Tenure',
              message: `The ${unit.name} corrects his stance (+${healed} HP).`,
              floats: [{ target: unit, text: `+${healed}`, color: '#7ae87a' }],
            };
          },
        },
      },
    ],
    positional: null,
  },
};
