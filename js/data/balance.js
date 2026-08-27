// The great leveling: every hero is cut to the same cloth.
//
// ALL characters share ONE base power budget (Progression.power, the
// number the roster sorts by). Each hero keeps their identity — the
// RATIOS between HP, ATK and DEF are preserved, and speed stays exactly
// as authored — but the magnitudes are scaled so everyone lands on the
// same budget.
//
// Rarity IS expressed here, and in exactly one line: SHELF below. Every
// hero is first cut to the same cloth, and then the whole bolt is scaled
// by what their shelf is worth. A 3-star is the yardstick at 1.00; a
// 5-star carries 1.25x the stats of one, a 1-star 0.80x.
//
// It did not use to be. Rarity lived only in starting stars, level cap
// and summon odds, and every hero was cut to one budget -- which sounds
// clean until you follow it to the shared endgame. Nothing else set a
// 5-star apart, so at 10 stars and level 100 the shelves were identical
// on paper and INVERTED in fact, because the star multiplier compounded
// per star gained above base rarity (see js/progression.js). The two
// rules contradicted each other. Progression now counts stars alone, so
// this file is the only place rarity is priced, and it says so plainly.
//
// There used to be an exemption list of thirty named heroes, carried
// over from before this rule existed. It made rarity mean two different
// things depending on when a hero was written — an exempt 3-star out-hit
// a balanced 5-star at their respective caps — so it is gone, and the
// old guard now share the budget with everyone else.
//
// Runs once at load, after every hero file; a def added later is
// balanced by virtue of being in HEROES before this file loads.

(() => {
  const TARGET = 520; // the long-standing shared budget, before the shelf

  // What a shelf is worth, as a flat multiplier on the finished stats.
  // These are multipliers on STATS, not on the power score: the power
  // formula is a geometric mean, so a 1.25x budget would only buy about
  // 1.16x the numbers, and the bench (and the player) reads stats. Every
  // step is a multiple of 5%.
  const SHELF = { 1: 0.80, 2: 0.85, 3: 1.00, 4: 1.10, 5: 1.25 };

  // Scale HP/ATK/DEF together (speed is identity, not budget) and
  // bisect the factor until the power lands on target — power is not
  // linear in the stats, so this is solved rather than divided.
  const powerAt = (stats, s) => Progression.power({
    ...stats, hp: stats.hp * s, atk: stats.atk * s, def: stats.def * s,
  });

  for (const def of Object.values(HEROES)) {
    if (!def.stats) continue;
    let lo = 0.2, hi = 5;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (powerAt(def.stats, mid) < TARGET) lo = mid; else hi = mid;
    }
    // One budget first, then the shelf on top of it, so the ratios a
    // hero was authored with survive both steps untouched.
    const s = ((lo + hi) / 2) * (SHELF[def.rarity] ?? 1);
    def.stats = {
      ...def.stats,
      hp: Math.round((def.stats.hp * s) / 5) * 5,
      atk: Math.round(def.stats.atk * s),
      def: Math.round(def.stats.def * s),
    };
  }
})();
