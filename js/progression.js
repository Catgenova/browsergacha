// Character progression: levels, XP, and star-ups.
//
// - Heroes are summoned at level 1 with stars equal to their gacha rarity.
// - Max level is 10 per star (1★ -> 10, 2★ -> 20 ... 10★ -> 100).
// - Star-ups require max level plus N spare duplicates, where N is the
//   CURRENT star count (1★->2★ costs 1 dup ... 9★->10★ costs 9).
// - Starring up boosts base stats permanently and resets level to 1.
// - The whole party gains XP on victory, based on enemy levels.

const Progression = (() => {
  const MAX_STARS = 10;

  function maxLevel(stars) {
    return stars * 10;
  }

  // Duplicates consumed to go from `stars` to `stars + 1`.
  function starUpCost(stars) {
    return stars;
  }

  // XP required to advance from `level` to `level + 1`.
  function xpToNext(level) {
    return 60 + 20 * (level - 1);
  }

  // Stat multiplier: +5% of base per level, +25% compounding per star
  // gained above the hero's base rarity. Speed and crit stay flat so
  // turn-order balance holds at every level.
  function statMult(level, stars, baseRarity) {
    return (1 + 0.05 * (level - 1)) * Math.pow(1.25, stars - (baseRarity ?? stars));
  }

  function scaledStats(def, level, stars) {
    const m = statMult(level, stars, def.rarity);
    return {
      hp: Math.round(def.stats.hp * m),
      atk: Math.round(def.stats.atk * m),
      def: Math.round(def.stats.def * m),
      speed: def.stats.speed,
      critChance: def.stats.critChance,
      critDamage: def.stats.critDamage,
    };
  }

  // XP a single defeated enemy grants to each party member.
  function enemyXp(level) {
    return 20 + 8 * level;
  }

  return { MAX_STARS, maxLevel, starUpCost, xpToNext, statMult, scaledStats, enemyXp };
})();
