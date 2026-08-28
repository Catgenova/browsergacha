// Dumplings: fodder with a face.
//
// Not a hero, and deliberately NOT in HEROES for the same reason summons
// are not: everything that walks that table -- the gacha, the compendium,
// the power ladder, the balance pass in js/data/balance.js, and every
// data test that sweeps "every hero" -- would have to learn an exception
// for a thing with no element, no skills, no passive and no hex. Nine
// exemptions to save one table is a bad trade, and it was a bad trade
// when the summons faced the same choice.
//
// So a dumpling lives here, and exactly one thing knows about it:
// GameState.defOf resolves a roster uid through HEROES and then through
// this table. That is enough for it to be owned, listed, sorted,
// favourited and spent, which is the whole of what a dumpling does.
//
// What it is FOR is the star-up bank. A hero is worth its rating's own
// value as fodder (1, 2, 6, 24, ...); a dumpling is worth far more and
// on its own scale, so `starPoints` below overrides the factorials for
// this def alone. A 1-star dumpling is worth ten 1-star heroes; a
// 5-star one is worth more than eight 5-star heroes.
//
//   1*      10        6*     5,000
//   2*      50        7*    10,000
//   3*     100        8*    50,000
//   4*     500        9*   100,000
//   5*   1,000       10*   500,000

const DUMPLINGS = {
  dumpling: {
    id: 'dumpling',
    // The flag every consumer keys off. `defOf` hands these back beside
    // real heroes, so anything that assumes abilities, a passive or a hex
    // asks this first.
    consumable: true,
    // No element on purpose: a dumpling cannot be ascended (that spends
    // elements a hero drinks by matching), and it takes no part in the
    // element party bonuses.
    element: null,
    name: 'Dumpling',
    title: 'Best Eaten Fresh',
    rarity: 1,
    // A dumpling never fights, so these exist only to keep the roster
    // card, the power sort and the stat block from dividing by nothing.
    // They are not balanced against anything and never will be.
    stats: { hp: 1, atk: 1, def: 1, speed: 1 },
    tint: { body: '#f0e4c8', helm: '#d8c8a0', weapon: '#8a9a5a', shield: '#c8a86a' },
    sprite: {
      displayH: 72,
      strips: {
        idle: { src: 'assets/heroes/dumpling/dumplingidle.png',
                frames: 9, fps: 5, loop: true },
      },
    },
    // Empty rather than absent: `(def.abilities || [])` is the pattern
    // everywhere, and an empty array walks through all of it.
    abilities: [],
    passive: null,
    positional: null,
    // What one is worth in the star-up bank, by its own star rating.
    // Read by Progression.starValue, which prefers a def's own table to
    // the factorials.
    starPoints: [0, 10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000, 500000],
  },
};

if (typeof module !== 'undefined' && module.exports) module.exports = { DUMPLINGS };
