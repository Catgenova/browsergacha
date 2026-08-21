// Character progression: levels, XP, and star-ups.
//
// - Heroes are summoned at level 1 with stars equal to their gacha rarity.
// - Max level is 10 per star (1★ -> 10, 2★ -> 20 ... 10★ -> 100).
// - Star-ups require max level plus N spare duplicates, where N is the
//   CURRENT star count (1★->2★ costs 1 dup ... 9★->10★ costs 9).
// - Starring up boosts base stats permanently and raises the level cap.
//   The level itself is kept: a star up lifts the ceiling, it does not
//   send the hero back to the bottom of it.
// - The whole party gains XP on victory, based on enemy levels.

const Progression = (() => {
  const MAX_STARS = 10;

  function maxLevel(stars) {
    return stars * 10;
  }

  // Heroes at the SAME star rating consumed to go from `stars` to
  // `stars + 1`: three 3-star heroes to reach 4.
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

  // ---- Boss stages ----
  // Each boss has 20 stages; stage 1 is level 5 and every stage adds 5
  // levels (stage 20 = level 100).
  const BOSS_MAX_STAGE = 20;
  function bossLevel(stage) {
    return stage * 5;
  }

  // Bosses can declare exact stats at level 5 and level 100
  // (def.stats5 / def.stats100); every level in between interpolates
  // linearly, letting each stat grow on its own curve. Levels beyond
  // 100 (Endless Tower) extrapolate along the same line.
  // A single number for "how strong is this hero right now", so a
  // 385-hero roster can be sorted by something more useful than level.
  // Offence and durability are combined multiplicatively — a glass
  // cannon and a wall that cannot kill both score poorly — and speed
  // matters because acting first is acting more often.
  function power(stats) {
    const offence = (stats.atk || 1) *
      (1 + (stats.critChance ?? 0.15) * ((stats.critDamage ?? 1.5) - 1));
    const durability = (stats.hp || 1) * (1 + (stats.def || 0) / 300);
    const tempo = (stats.speed || 100) / 100;
    return Math.round(Math.sqrt(offence * durability) * tempo);
  }

  function bossScaledStats(def, level) {
    const t = Math.max(0, (level - 5) / 95);
    const lerp = (a, b) => Math.round(a + (b - a) * t);
    return {
      hp: lerp(def.stats5.hp, def.stats100.hp),
      atk: lerp(def.stats5.atk, def.stats100.atk),
      def: lerp(def.stats5.def, def.stats100.def),
      speed: def.stats5.speed,
      critChance: def.stats5.critChance,
      critDamage: def.stats5.critDamage,
    };
  }

  // ---- Skill leveling ----
  // Every active skill levels 1..5. Each level past 1 adds +10% to the
  // skill's damage / heal / poison numbers. The only way to raise one is
  // to sacrifice another copy of the same character (see
  // GameState.sacrifice); there is no currency for it.
  const MAX_SKILL_LEVEL = 5;
  function skillPower(level) {          // effect multiplier at `level`
    return 1 + 0.10 * (level - 1);
  }

  return {
    MAX_STARS, maxLevel, starUpCost, xpToNext, statMult, scaledStats, enemyXp,
    BOSS_MAX_STAGE, bossLevel, bossScaledStats, power,
    MAX_SKILL_LEVEL, skillPower,
  };
})();
