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
};
