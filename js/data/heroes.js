// Hero definitions. Every hero follows the same contract:
//   - 3 active abilities: one short cooldown, one no cooldown, one long cooldown
//   - 1 passive ability (hook-based)
//   - 1 positional bonus, active only in the matching grid position
//   - sprite: spritesheet reference (placeholder art is generated when the
//     PNG is absent — drop real sheets into assets/heroes/ to replace it)

const HEROES = {
  sir_pixel: {
    id: 'sir_pixel',
    name: 'Sir Pixel',
    rarity: 4,
    stats: {
      hp: 1400,
      atk: 220,
      def: 140,
      speed: 100,
    },
    tint: { body: '#4a6fd4', helm: '#8d9bb8', shield: '#b8862e' },
    sprite: {
      src: 'assets/heroes/sir_pixel.png', // not present yet -> placeholder
      frameW: 32,
      frameH: 32,
      animations: {
        idle:   { row: 0, frames: 4, fps: 6,  loop: true  },
        attack: { row: 1, frames: 5, fps: 10, loop: false },
      },
    },
    abilities: [
      {
        id: 'valiant_strike',
        name: 'Valiant Strike',
        description: 'Slash one enemy for 100% ATK.',
        cooldown: 0,
        targeting: 'enemy',
        animation: 'attack',
        effects: [{ type: 'damage', mult: 1.0 }],
      },
      {
        id: 'shield_bash',
        name: 'Shield Bash',
        description: 'Bash one enemy for 140% ATK and lower its DEF by 30% for 2 turns.',
        cooldown: 3,
        targeting: 'enemy',
        animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.4 },
          { type: 'debuff', stat: 'def', mult: 0.7, turns: 2 },
        ],
      },
      {
        id: 'judgement',
        name: 'Radiant Judgement',
        description: 'Smite ALL enemies for 90% ATK and raise own DEF by 40% for 2 turns.',
        cooldown: 6,
        targeting: 'all-enemies',
        animation: 'attack',
        effects: [{ type: 'damage', mult: 0.9 }],
        selfEffects: [{ type: 'buff', stat: 'def', mult: 1.4, turns: 2 }],
      },
    ],
    passive: {
      name: 'Second Wind',
      description: 'Recovers 4% max HP at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          const amount = Math.round(unit.maxHp * 0.04);
          const healed = unit.heal(amount);
          if (healed > 0) {
            return { kind: 'passive-heal', amount: healed, label: 'Second Wind' };
          }
          return null;
        },
      },
    },
    positional: {
      position: POSITION.FRONT,
      stat: 'def',
      mult: 1.25,
      description: 'Vanguard: +25% DEF while in a front hex.',
    },
  },
};
