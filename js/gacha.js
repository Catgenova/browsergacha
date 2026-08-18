// Gacha summon logic. Summons are paid for EXCLUSIVELY with scrolls
// that drop from battle victories:
//   - Common Summon Scroll: 1★ 60% / 2★ 30% / 3★ 10%
//   - Rare Summon Scroll:   3★ 80% / 4★ 18% / 5★ 2%
// One scroll per summon. Pity: a 5★ is guaranteed within PITY_LIMIT
// rare-scroll pulls (once a 5★ hero exists in the pool).

const Gacha = (() => {
  const PITY_LIMIT = 40;

  const RATES = {
    common: [
      { rarity: 3, p: 0.10 },
      { rarity: 2, p: 0.30 },
      { rarity: 1, p: 0.60 },
    ],
    rare: [
      { rarity: 5, p: 0.02 },
      { rarity: 4, p: 0.18 },
      { rarity: 3, p: 0.80 },
    ],
  };

  function poolByRarity(rarity) {
    return Object.values(HEROES).filter((h) => h.rarity === rarity);
  }

  function rollRarity(kind) {
    const r = Math.random();
    let acc = 0;
    for (const { rarity, p } of RATES[kind]) {
      acc += p;
      if (r < acc) return rarity;
    }
    return RATES[kind][RATES[kind].length - 1].rarity;
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

  // One pull with a scroll of `kind`. Rare-scroll pulls tick the 5★
  // pity counter; the pity break only fires while a 5★ hero exists.
  function resolvePull(kind) {
    let rarity = rollRarity(kind);
    if (kind === 'rare' &&
        GameState.pity + 1 >= PITY_LIMIT && poolByRarity(5).length > 0) {
      rarity = 5; // pity break
    }
    const def = pickHero(rarity);
    if (kind === 'rare') {
      GameState.setPity(def.rarity === 5 ? 0 : GameState.pity + 1);
    }
    const { isNew, copies } = GameState.addHero(def.id);
    return { def, rarity: def.rarity, isNew, copies };
  }

  // Spend `count` scrolls of `kind` for that many summons.
  function pull(kind, count) {
    if (!GameState.spendScrolls(kind, count)) return null;
    const results = [];
    for (let i = 0; i < count; i++) results.push(resolvePull(kind));
    return results;
  }

  return { pull, PITY_LIMIT, RATES };
})();
