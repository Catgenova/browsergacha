// Gacha summon logic. Summons are paid for EXCLUSIVELY with scrolls
// that drop from battle victories:
//   - Common Summon Scroll:   1★ 60% / 2★ 30% / 3★ 10%
//   - Rare Summon Scroll:     3★ 80% / 4★ 18% / 5★ 2%
//   - Temporal Summon Scroll: 3★ 85% / 4★ 12% / 5★ 3%
// Dark and Light heroes are always at least 3★, so Temporal Scrolls
// never roll below that — the old 1★/2★ weight folds into 3★.
// Common/Rare scrolls summon Wind/Water/Fire heroes; Dark and Light
// heroes come ONLY from Temporal Scrolls (1% drop from normal hunts and
// from boss stage 15+, plus every 50th tower floor).
// One scroll per summon. Pity: a 5★ is guaranteed within PITY_LIMIT
// PLAIN rare-scroll pulls (once a 5★ hero exists in the pool). Banner
// pulls run a pity of their own instead — every BANNER_PITY_EVERY
// elective pulls hand over one of the banner's featured heroes, who
// then leaves that banner's pity pool for good; once all of them have
// been claimed the banner's pity is spent for its remaining run.

const Gacha = (() => {
  const PITY_LIMIT = 100;
  const BANNER_PITY_EVERY = 50;
  const WISHLIST_MULT = 2; // wishlisted heroes' weight in plain pulls

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
      { rarity: 3, p: 0.85 },
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

  // A banner rate-up (see Events.SUMMON_BANNERS) tilts the draw WITHIN
  // the rolled band: each hero carries a weight, and the banner's sect
  // carries double. Band rates are untouched. `banner` is falsy for a
  // flat pull, or the scroll kind being pulled — banners run one per
  // scroll and can overlap, so the weight must come off the banner the
  // player actually elected (`true` falls back to the first running
  // banner, for callers that predate concurrency).
  function weightedDraw(pool, banner, date) {
    // Two tilts, never stacked: an elective banner pull runs the
    // banner's sect weighting; a PLAIN pull runs the player's wishlist
    // (up to three characters at double weight inside the rolled band).
    let weights = null;
    if (banner && typeof Events !== 'undefined' && Events.bannerWeight) {
      const scroll = typeof banner === 'string' ? banner : null;
      weights = pool.map((h) => Events.bannerWeight(h, date, scroll));
    } else if (!banner && typeof GameState !== 'undefined' && GameState.wishlist) {
      const wish = new Set(GameState.wishlist());
      if (wish.size > 0) {
        weights = pool.map((h) => (wish.has(h.id) ? WISHLIST_MULT : 1));
      }
    }
    if (!weights || weights.every((w) => w === 1)) {
      return pool[Math.floor(Math.random() * pool.length)];
    }
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r < 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  function pickHero(rarity, elements = null, banner = false, date = new Date()) {
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
    return weightedDraw(pool, banner, date);
  }

  // A banner's featured pool: every member of its sect, the heroes on
  // its display strip.
  function bannerFeatured(b) {
    return Object.values(HEROES)
      .filter((h) => {
        const s = typeof RACES !== 'undefined' ? RACES.sectOf(h) : null;
        return s && s.id === b.sect;
      })
      .map((h) => h.id);
  }

  // The banner's pity ledger, dressed for the UI: pulls made toward the
  // next guarantee, heroes already claimed, and who is still in the pool.
  function bannerPityInfo(b) {
    const s = GameState.bannerPity(b.id);
    return { ...s, every: BANNER_PITY_EVERY,
      remaining: bannerFeatured(b).filter((id) => !s.claimed.includes(id)) };
  }

  // One pull with a scroll of `kind`. PLAIN rare pulls tick the 5★ pity
  // ladder (the break fires while a 5★ hero exists); banner pulls tick
  // their banner's own pity instead.
  function resolvePull(kind, banner = false) {
    const elements = POOL_ELEMENTS[kind] || null;
    // Banner pity: the pull that lands on the 50th mark hands over one
    // of the featured heroes still in the pool, at random, and crosses
    // them off. With nobody left in the pool the counter stops moving —
    // the pity is spent for the rest of the banner.
    let pityDef = null;
    if (banner && typeof Events !== 'undefined' && Events.currentBanner) {
      const b = Events.currentBanner(new Date(), kind);
      if (b) {
        const s = GameState.bannerPity(b.id);
        const remaining = bannerFeatured(b).filter((id) => !s.claimed.includes(id));
        if (remaining.length > 0) {
          const count = s.count + 1;
          if (count >= BANNER_PITY_EVERY) {
            const id = remaining[Math.floor(Math.random() * remaining.length)];
            pityDef = HEROES[id];
            GameState.setBannerPity(b.id, { count: 0, claimed: [...s.claimed, id] });
          } else {
            GameState.setBannerPity(b.id, { count, claimed: s.claimed });
          }
        }
      }
    }
    let def = pityDef;
    if (!def) {
      let rarity = rollRarity(kind);
      if (kind === 'rare' && !banner &&
          GameState.pity + 1 >= PITY_LIMIT && poolByRarity(5, elements).length > 0) {
        rarity = 5; // pity break
      }
      def = pickHero(rarity, elements, banner ? kind : false);
    }
    if (kind === 'rare' && !banner) {
      GameState.setPity(def.rarity === 5 ? 0 : GameState.pity + 1);
    }
    const added = GameState.addHero(def.id);
    return { def, rarity: def.rarity, uid: added ? added.uid : null,
      isNew: !!added && added.isNew, copies: GameState.countOf(def.id),
      blessing: (added && added.blessing) || null,
      bannerPity: !!pityDef };
  }

  // Spend `count` scrolls of `kind` for that many summons.
  //
  // A pull that would not fit is refused outright rather than part-filled:
  // a summon now hands over a whole hero, and dropping some of them on
  // the floor because the roster is full is not something to do quietly.
  // Returns { error, space } instead of results when there is no room.
  // `opts.banner` marks an elective banner pull: same scrolls, same
  // band rates, but the running banner's sect draws at double weight.
  function pull(kind, count, opts = {}) {
    if (GameState.rosterSpace() < count) {
      return { error: 'roster-full', space: GameState.rosterSpace(),
        need: count, max: GameState.MAX_ROSTER };
    }
    if (!GameState.spendScrolls(kind, count)) return null;
    const results = [];
    for (let i = 0; i < count; i++) results.push(resolvePull(kind, !!opts.banner));
    GameState.questBump('summons', count);
    return results;
  }

  return { pull, pickHero, PITY_LIMIT, RATES,
    BANNER_PITY_EVERY, bannerPityInfo, WISHLIST_MULT };
})();
