// Avian heroes. Registered into the shared HEROES table declared in
// js/data/heroes.js.
//
// The Gulldiggers are the first sect that is not human: pirate seabirds
// who fight the way weather does — all at once, and to everybody. Where
// a human sect is nine heroes of whatever rarity they happened to be
// written at, a bird sect is built to a shape: one 1★, two 2★, three
// 3★, two 4★, and a single 5★ at the top of it.
//
// Their shared mechanic is `perTarget` (js/abilities.js): damage priced
// off the SIZE OF THE CROWD a cast catches. It is the reason the sect
// exists — every other AoE dealer on the roster is paid the same for a
// sweep that lands on one bird as for one that lands on seven, and the
// Gulldiggers are not.

Object.assign(HEROES, {

  hallow: {
    id: 'hallow',
    element: 'water',
    name: 'Hallow',
    title: 'Storm Bottler',
    rarity: 5,
    // A backline glass cannon: the highest attack the balance layer will
    // hand a body this soft. He is priced to die to anything that
    // reaches him, which is the cost of a kit that never has to choose a
    // target. (Every stat here is a RATIO — js/data/balance.js scales
    // all three to the shared power budget and leaves speed alone.)
    stats: { hp: 1000, atk: 265, def: 68, speed: 108 },
    tint: { body: '#3a4a6a', helm: '#1a2a4a', weapon: '#4ac8e8', shield: '#e8a04a' },
    sprite: {
      displayH: 92,
      strips: {
        // One nine-frame idle so far — the rest of his set is still to
        // come, and the animator falls back to the idle for anything a
        // hero has not got yet.
        idle: { src: 'assets/heroes/gulldigger/Hallowidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cork_snap', name: 'Cork Snap',
        icon: 'assets/icons/fc819.png',
        description: 'Thumb the cork off and let one bolt out: 160% ATK to a single enemy.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.6 }],
        // No crowd bonus: this is the one button he owns that is aimed
        // rather than poured, and it is deliberately the better press
        // when there is only one bird left standing.
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'squall_line', name: 'Squall Line',
        icon: 'assets/icons/fc823.png',
        description: 'Tip the bottle across the whole enemy line: 60% ATK to ALL enemies, ' +
          'and 8% more to each of them for every enemy beyond the first that the squall catches.',
        cooldown: 5, targeting: 'all-enemies', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 0.6, perTarget: 0.08 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { perTarget: 0.02 },
          { perTarget: 0.02 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'uncork_the_bottle', name: 'Uncork the Bottle',
        icon: 'assets/icons/fc786.png',
        description: 'Pull the cork out entirely: 140% ATK to ALL enemies, and 12% more to ' +
          'each of them for every enemy beyond the first caught in it, with a 50% chance ' +
          'each to knock 20% off their action bars.',
        cooldown: 8, targeting: 'all-enemies', animation: 'idle', impact: 'strike',
        effects: [
          { type: 'damage', mult: 1.4, perTarget: 0.12 },
          { type: 'turnMeter', amount: -0.20, chance: 0.5 },
        ],
        levelUps: [
          { perTarget: 0.02 },
          { debuffChance: 0.2 },
          { debuffChance: 0.2 },
          { debuffChance: 0.1 },
          { mult: 0.1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Eye of the Storm',
      icon: 'assets/icons/fc866.png',
      description: 'Gains 5% action bar for every enemy struck by a skill that hits more than one.',
      hooks: {
        // Fired once per victim by the battle's damage bookkeeping. The
        // meter is NOT clamped here: a gift that would push him past the
        // cap is worth more than the cap, and clamping it used to hand
        // an overfilled unit a demotion (see the roster-wide guard in
        // test/rules.test.js).
        onSweepHit(unit) {
          unit.turnMeter += CONFIG.TURN_METER_MAX * 0.05;
          return { floats: [{ target: unit, text: '▲', color: '#8ee8ff' }] };
        },
      },
    },
    positional: POSITIONALS.stormglass,
  },
});
