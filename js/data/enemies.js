// Enemy definitions. Same shape as heroes, but enemies may use fewer
// abilities and have no positional bonus or passive.

const ENEMIES = {
  gloop: {
    id: 'gloop',
    name: 'Gloop',
    stats: {
      hp: 900,
      atk: 150,
      def: 80,
      speed: 85,
    },
    tint: { body: '#5aa860', helm: '#4a8850', skin: '#7ac880', weapon: '#7ac880', shield: '#4a8850' },
    sprite: null, // always placeholder for now
    abilities: [
      {
        id: 'slam',
        name: 'Slime Slam',
        description: 'Slams one hero for 100% ATK.',
        cooldown: 0,
        targeting: 'enemy',
        animation: 'attack',
        effects: [{ type: 'damage', mult: 1.0 }],
      },
      {
        id: 'acid_spit',
        name: 'Acid Spit',
        description: 'Spits acid for 120% ATK and lowers DEF by 20% for 2 turns.',
        cooldown: 3,
        targeting: 'enemy',
        animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'debuff', stat: 'def', mult: 0.8, turns: 2 },
        ],
      },
    ],
    passive: null,
    positional: null,
  },

  gloop_brute: {
    id: 'gloop_brute',
    name: 'Gloop Brute',
    stats: {
      hp: 1600,
      atk: 190,
      def: 150,
      speed: 70,
    },
    tint: { body: '#3a7a48', helm: '#2a5a38', skin: '#5aa868', weapon: '#5aa868', shield: '#2a5a38' },
    sprite: null,
    abilities: [
      {
        id: 'crush',
        name: 'Crush',
        description: 'Crushes one hero for 110% ATK.',
        cooldown: 0,
        targeting: 'enemy',
        animation: 'attack',
        effects: [{ type: 'damage', mult: 1.1 }],
      },
      {
        id: 'war_bellow',
        name: 'War Bellow',
        description: 'Bellows, raising own ATK by 40% for 2 turns.',
        cooldown: 4,
        targeting: 'self',
        animation: 'attack',
        effects: [{ type: 'buff', stat: 'atk', mult: 1.4, turns: 2 }],
      },
    ],
    passive: null,
    positional: null,
  },

  hex_wisp: {
    id: 'hex_wisp',
    name: 'Hex Wisp',
    stats: {
      hp: 700,
      atk: 170,
      def: 60,
      speed: 115,
    },
    tint: { body: '#7a4a9a', helm: '#9a6ac8', skin: '#c8a8e8', weapon: '#e8c8ff', shield: '#5a3a7a' },
    sprite: null,
    abilities: [
      {
        id: 'zap',
        name: 'Wisp Zap',
        description: 'Zaps one hero for 100% ATK.',
        cooldown: 0,
        targeting: 'enemy',
        animation: 'attack',
        effects: [{ type: 'damage', mult: 1.0 }],
      },
      {
        id: 'withering_hex',
        name: 'Withering Hex',
        description: 'Curses ALL heroes, lowering their ATK by 15% for 2 turns.',
        cooldown: 4,
        targeting: 'all-enemies',
        animation: 'attack',
        effects: [{ type: 'debuff', stat: 'atk', mult: 0.85, turns: 2 }],
      },
    ],
    passive: null,
    positional: null,
  },
};
