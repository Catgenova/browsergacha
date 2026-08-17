// Gacha summon logic: rates, pity, pull resolution.
//
// Rates: 3★ 70% / 4★ 25% / 5★ 5%.
// Pity: a 5★ is guaranteed within PITY_LIMIT pulls.
// ×10 pulls guarantee at least one 4★-or-better.

const Gacha = (() => {
  const COST_SINGLE = 100;
  const COST_TEN = 900;
  const PITY_LIMIT = 40;

  const RATES = [
    { rarity: 5, p: 0.05 },
    { rarity: 4, p: 0.25 },
    { rarity: 2, p: 0.20 },
    { rarity: 1, p: 0.50 },
  ];

  function poolByRarity(rarity) {
    return Object.values(HEROES).filter((h) => h.rarity === rarity);
  }

  function rollRarity() {
    const r = Math.random();
    let acc = 0;
    for (const { rarity, p } of RATES) {
      acc += p;
      if (r < acc) return rarity;
    }
    return 1;
  }

  function pickHero(rarity) {
    let pool = poolByRarity(rarity);
    // A rolled rarity may have no heroes yet (small early pool): fall back
    // to the highest populated rarity at or below the roll, else the
    // lowest above it — a lucky roll never downgrades below its floor.
    if (pool.length === 0) {
      const available = [...new Set(Object.values(HEROES).map((h) => h.rarity))]
        .sort((a, b) => a - b);
      if (available.length === 0) return null;
      const below = available.filter((r) => r <= rarity);
      pool = poolByRarity(below.length > 0 ? below[below.length - 1] : available[0]);
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // One pull. Handles pity bookkeeping and roster insertion.
  function resolvePull(forceMinRarity = 0) {
    let rarity = rollRarity();
    if (GameState.pity + 1 >= PITY_LIMIT) rarity = 5; // pity break
    if (rarity < forceMinRarity) rarity = forceMinRarity;

    const def = pickHero(rarity);
    // Pity and display track what was actually pulled (the roll may have
    // fallen back to a populated rarity).
    GameState.setPity(def.rarity === 5 ? 0 : GameState.pity + 1);
    const { isNew, copies } = GameState.addHero(def.id);
    return { def, rarity: def.rarity, isNew, copies };
  }

  function pullOne() {
    if (!GameState.spendGems(COST_SINGLE)) return null;
    return [resolvePull()];
  }

  function pullTen() {
    if (!GameState.spendGems(COST_TEN)) return null;
    const results = [];
    for (let i = 0; i < 9; i++) results.push(resolvePull());
    // Slot 10: guaranteed 4★+ if the first nine were all 3★.
    const hasGood = results.some((r) => r.rarity >= 4);
    results.push(resolvePull(hasGood ? 0 : 4));
    return results;
  }

  return { pullOne, pullTen, COST_SINGLE, COST_TEN, PITY_LIMIT, RATES };
})();
