// Gacha summon logic. Summons are paid for EXCLUSIVELY with scrolls
// that drop from battle victories:
//   - Common Summon Scroll:   1★ 60% / 2★ 30% / 3★ 10%
//   - Rare Summon Scroll:     3★ 80% / 4★ 18% / 5★ 2%
//   - Temporal Summon Scroll: 1★ 30% / 2★ 30% / 3★ 25% / 4★ 12% / 5★ 3%
// Common/Rare scrolls summon Wind/Water/Fire heroes; Dark and Light
// heroes come ONLY from Temporal Scrolls (1% drop from boss stage 15+).
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
    temporal: [
      { rarity: 5, p: 0.03 },
      { rarity: 4, p: 0.12 },
      { rarity: 3, p: 0.25 },
      { rarity: 2, p: 0.30 },
      { rarity: 1, p: 0.30 },
    ],
  };

  // Which elements each scroll type can summon.
  const POOL_ELEMENTS = {
    common: Elements.BASIC,
    rare: Elements.BASIC,
    temporal: Elements.TEMPORAL,
  };

  function poolByRarity(rarity, elements = null) {
    return Object.values(HEROES).filter(
      (h) => h.rarity === rarity &&
        (!elements || elements.includes(h.element))
    );
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

  function pickHero(rarity, elements = null) {
    // The scroll's element pool applies; if that pool is entirely empty
    // (e.g. no dark/light heroes yet) fall back to all elements.
    const inPool = (r) => poolByRarity(r, elements);
    const anyInPool = Object.values(HEROES)
      .some((h) => !elements || elements.includes(h.element));
    const pick = anyInPool ? inPool : (r) => poolByRarity(r);
    let pool = pick(rarity);
    // A rolled rarity may have no heroes yet (small early pool): fall back
    // to the highest populated rarity at or below the roll, else the
    // lowest above it — a lucky roll never downgrades below its floor.
    if (pool.length === 0) {
      const source = Object.values(HEROES).filter(
        (h) => !anyInPool || !elements || elements.includes(h.element));
      const available = [...new Set(source.map((h) => h.rarity))]
        .sort((a, b) => a - b);
      if (available.length === 0) return null;
      const below = available.filter((r) => r <= rarity);
      pool = pick(below.length > 0 ? below[below.length - 1] : available[0]);
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // One pull with a scroll of `kind`. Rare-scroll pulls tick the 5★
  // pity counter; the pity break only fires while a 5★ hero exists.
  function resolvePull(kind) {
    const elements = POOL_ELEMENTS[kind] || null;
    let rarity = rollRarity(kind);
    if (kind === 'rare' &&
        GameState.pity + 1 >= PITY_LIMIT && poolByRarity(5, elements).length > 0) {
      rarity = 5; // pity break
    }
    const def = pickHero(rarity, elements);
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
