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

  ike: {
    id: 'ike',
    element: 'water',
    name: 'Ike',
    title: 'Boarding Pike',
    rarity: 3,
    // Sturdier than Hallow and nowhere near a tank: he lands within a
    // few points of Sawyer, the roster's other front-line damage dealer,
    // which is the band a front-row DPS belongs in. The first pass at
    // this line read as a TANK by a single point of the Tags
    // classifier -- bulk 213 against punch 212 -- which is exactly the
    // kind of thing that is invisible until something prints the label.
    // (Ratios only; js/data/balance.js scales all three to the shared
    // budget and leaves speed alone.)
    stats: { hp: 1400, atk: 240, def: 120, speed: 104 },
    tint: { body: '#e8eef4', helm: '#1a3a7a', weapon: '#b8863a', shield: '#2a4a8a' },
    sprite: {
      displayH: 96, // he stands tall on the pike -- a heron's legs
      strips: {
        idle: { src: 'assets/heroes/gulldigger/Ikeidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'sweep_the_deck', name: 'Sweep the Deck',
        icon: 'assets/icons/fc1045.png',
        description: 'Work the pike along the enemy front rank: 70% ATK to the enemy FRONT row, ' +
          'and 6% more to each of them for every enemy beyond the first the sweep catches.',
        cooldown: 0, targeting: 'front-enemies', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 0.7, perTarget: 0.06 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { perTarget: 0.02 },
          { perTarget: 0.02 },
        ],
      },
      {
        id: 'gaff_and_haul', name: 'Gaff and Haul',
        icon: 'assets/icons/fc1050.png',
        description: 'Drive the hook through a whole rank: 115% ATK to one enemy and everyone ' +
          'level with them, and 8% more to each for every enemy beyond the first on the line.',
        cooldown: 4, targeting: 'enemy-row', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.15, perTarget: 0.08 }],
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
        id: 'skewer', name: 'Skewer',
        icon: 'assets/icons/fc89.png',
        description: 'Both wings behind it, straight through one bird: 260% ATK to a single enemy.',
        cooldown: 7, targeting: 'enemy', animation: 'idle', impact: 'strike',
        // Deliberately no crowd bonus. Every other button he owns wants
        // a full enemy line; this is the one he presses when there is
        // one bird left and the sect's whole thesis has stopped paying.
        effects: [{ type: 'damage', mult: 2.6 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Long Reach',
      icon: 'assets/icons/fc1117.png',
      description: 'His front-row sweeps reach the enemy CENTER hex as well.',
      hooks: {
        // Read by resolveTargets, which folds the centre into every
        // 'front-enemies' cast this hero makes. It is a damage passive
        // wearing a targeting hook: one more body in the sweep is one
        // more stack of his own crowd bonus, on every skill that has
        // one.
        reachesCenter: true,
      },
    },
    positional: POSITIONALS.bloodied_fury,
  },

  jack: {
    id: 'jack',
    element: 'water',
    name: 'Jack',
    title: 'Powder Monkey',
    rarity: 1,
    // The bottom of the sect: fast, cheap, and made of paper. He is
    // priced to be spent, which is the whole reason his passive only
    // pays once he has been. (Ratios only; js/data/balance.js scales
    // all three to the shared budget and leaves speed alone.)
    stats: { hp: 900, atk: 200, def: 85, speed: 118 },
    tint: { body: '#8a6a4a', helm: '#1a5ac8', weapon: '#c8ccd4', shield: '#1a5ac8' },
    sprite: {
      displayH: 74, // the smallest bird on the line
      strips: {
        idle: { src: 'assets/heroes/gulldigger/Jackidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    // ONE skill, and it has to be cooldown-free: a 1-star with a
    // cooldown would spend whole turns with nothing to press. The
    // contract test in data.test.js holds both halves of that.
    abilities: [
      {
        id: 'shivwork', name: 'Shivwork',
        icon: 'assets/icons/fc819.png',
        description: 'In under the guard and out again: 60% ATK to the enemy FRONT row, ' +
          'and 5% more to each of them for every enemy beyond the first he gets among.',
        cooldown: 0, targeting: 'front-enemies', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 0.6, perTarget: 0.05 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { perTarget: 0.02 },
          { perTarget: 0.02 },
        ],
      },
    ],
    passive: {
      name: 'Powder Monkey',
      icon: 'assets/icons/fc786.png',
      description: 'He is carrying the charges. When Jack falls, the keg goes with ' +
        'him: 180% of his ATK to every enemy on a front hex, and 12% more to each ' +
        'of them for every enemy beyond the first caught in the blast.',
      hooks: {
        // The one passive on the roster that pays out for its OWNER
        // dying rather than for somebody else doing it. The victim is
        // rung into its own death for exactly this (js/hero.js).
        //
        // Damage goes through Abilities.strike, which is exported so
        // hooks deal damage down the same pipeline an ability does --
        // the DEF curve, dodge, guards, reflect and the damage meter
        // all still apply, and the keg is credited to Jack.
        onUnitDied(unit, { victim, battle }) {
          if (victim !== unit || !battle) return null;
          const foes = battle.livingUnits(unit.enemyTeam())
            .filter((u) => u.isBoss || u.slot.position === POSITION.FRONT);
          if (foes.length === 0) return null;
          // Same arithmetic the sect's skills use: every body beyond the
          // first deepens the blast for all of them.
          const mult = 1.8 + 0.12 * (foes.length - 1);
          const floats = [];
          for (const foe of foes) {
            const raw = unit.effectiveStat('atk') * mult *
              Elements.mult(unit.element, foe.element);
            const hit = Abilities.strike(unit, foe, raw);
            if (hit && hit.amount > 0) {
              floats.push({ target: foe, text: `-${hit.amount}`, color: '#e8a04a' });
            }
          }
          if (floats.length === 0) return null;
          return { message: `${unit.name}'s powder goes up with him!`, floats };
        },
      },
    },
    positional: POSITIONALS.first_blood,
  },
});
