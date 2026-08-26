// The great leveling: every hero is cut to the same cloth.
//
// ALL characters share ONE base power budget (Progression.power, the
// number the roster sorts by). Each hero keeps their identity — the
// RATIOS between HP, ATK and DEF are preserved, and speed stays exactly
// as authored — but the magnitudes are scaled so everyone lands on the
// same budget.
//
// Rarity is expressed where the star system says it should be, and
// nowhere else: starting stars, the level cap that comes with them, and
// summon odds. A 5-star and a 3-star begin from the same numbers; the
// 5-star simply climbs twenty levels further.
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
  const TARGET = 520; // the long-standing shared budget

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
    const s = (lo + hi) / 2;
    def.stats = {
      ...def.stats,
      hp: Math.round((def.stats.hp * s) / 5) * 5,
      atk: Math.round(def.stats.atk * s),
      def: Math.round(def.stats.def * s),
    };
  }
})();
