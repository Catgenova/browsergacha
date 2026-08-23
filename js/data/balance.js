// The great leveling: every generic hero is cut to the same cloth.
//
// Except for the named heroes listed below, all characters share ONE
// base power budget (Progression.power, the number the roster sorts
// by). Each hero keeps their identity — the RATIOS between HP, ATK and
// DEF are preserved, and speed stays exactly as authored — but the
// magnitudes are scaled so everyone lands on the same budget. Rarity
// still matters where the star system says it does: starting stars,
// the level cap that comes with them, and summon odds.
//
// Runs once at load, after every hero file; a def added later is
// balanced by virtue of being in HEROES before this file loads.

(() => {
  const EXEMPT = new Set(['coral', 'emily', 'toll', 'echo', 'javarious',
    'catherine', 'vex', 'vivian', 'leonardo', 'oak', 'silas', 'eli', 'sawyer',
    'polarus', 'andrew', 'angelica']);
  const TARGET = 520; // the pre-balance median across the generics

  // Scale HP/ATK/DEF together (speed is identity, not budget) and
  // bisect the factor until the power lands on target — power is not
  // linear in the stats, so this is solved rather than divided.
  const powerAt = (stats, s) => Progression.power({
    ...stats, hp: stats.hp * s, atk: stats.atk * s, def: stats.def * s,
  });

  for (const def of Object.values(HEROES)) {
    if (EXEMPT.has(def.id) || !def.stats) continue;
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
