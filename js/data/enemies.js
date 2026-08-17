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
};
