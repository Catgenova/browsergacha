// Gacha summon logic. Summons are paid for EXCLUSIVELY with scrolls
// that drop from battle victories:
//   - Common Summon Scroll:   50% dumpling / 50% hero at 1★ 60% / 2★ 30% / 3★ 10%
//   - Rare Summon Scroll:     3★ 80% / 4★ 18% / 5★ 2%
//   - Temporal Summon Scroll: 3★ 85% / 4★ 12% / 5★ 3%
// Dark and Light heroes are always at least 3★, so Temporal Scrolls
// never roll below that — the old 1★/2★ weight folds into 3★.
// Common/Rare scrolls summon Wind/Water/Fire heroes; Dark and Light
// heroes come ONLY from Temporal Scrolls (1% drop from normal hunts and
// from boss stage 15+, plus every 50th tower floor).
// Half of every common scroll is a DUMPLING rather than a hero, on its
// own star ladder (5★ 5% / 4★ 10% / 3★ 15% / 2★ 30% / 1★ 40%). The hero
// half keeps the band rates it always had, so a common pull is now 1★
// hero 30%, 2★ 15%, 3★ 5%, dumpling 50%.
//
// The common scroll is the one a player has hundreds of and no use for
// once the 1- and 2-star bands are collected; this is what it buys
// instead. A dumpling is inventory rather than a character, so it costs
// no roster slot and cannot overflow into the vault.
//
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

  // The dumpling table for each scroll, in the same shape as RATES: how
  // often the scroll pays out in dumplings at all, and the star ladder
  // it rolls when it does. Rare and Temporal are absent rather than set
  // to zero -- those scrolls sell heroes, and a scroll not in this table
  // simply never rolls here.
  const DUMPLING_CHANCE = { common: 0.50 };
  const DUMPLING_STARS = [
    { stars: 5, p: 0.05 },
    { stars: 4, p: 0.10 },
    { stars: 3, p: 0.15 },
    { stars: 2, p: 0.30 },
    { stars: 1, p: 0.40 },
  ];

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

  // Walk a weighted band table and hand back the named field. Shared by
  // the rarity roll and the dumpling star roll, which are the same
  // shape and used to be the same six lines written twice.
  function rollBand(table, key) {
    const r = Math.random();
    let acc = 0;
    for (const row of table) {
      acc += row.p;
      if (r < acc) return row[key];
    }
    return table[table.length - 1][key];
  }

  function rollRarity(kind) {
    return rollBand(RATES[kind], 'rarity');
  }

  // Does this scroll pay out in a dumpling, and at what rating? Returns
  // the star rating, or null for a hero pull.
  function rollDumpling(kind) {
    const chance = DUMPLING_CHANCE[kind] || 0;
    if (!(chance > 0) || Math.random() >= chance) return null;
    return rollBand(DUMPLING_STARS, 'stars');
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
    // A rolled rarity may have no heroes at all. This is now the normal
    // case rather than an early-pool edge: retiring the generated
    // cohorts emptied the 1- and 2-star bands entirely, so every roll
    // into them promotes. The rule is unchanged — the highest populated
    // rarity at or below the roll, else the lowest above it — which
    // means a lucky roll never downgrades below its floor, and a roll
    // with nothing beneath it rolls UP to the nearest band that exists.
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
  // Which rarities a scroll can actually produce. Read off the rate
  // table rather than written down twice.
  function scrollRarities(kind) {
    return new Set((RATES[kind] || RATES.rare).map((r) => r.rarity));
  }

  // The heroes a banner features: its sect, MINUS anyone the scroll
  // cannot draw. Every bannered sect used to be 3-star and up, so the
  // rarity filter was invisible -- until the bird sects arrived, which
  // run a 1-star and two 2-stars each. Without it the Rare banner would
  // advertise heroes a Rare pull can never roll, and worse, hand one of
  // them over as the fifty-pull GUARANTEE: a promise paid in a hero the
  // scroll does not sell.
  function bannerFeatured(b) {
    const can = scrollRarities(b.scroll || 'rare');
    return Object.values(HEROES)
      .filter((h) => {
        const s = typeof RACES !== 'undefined' ? RACES.sectOf(h) : null;
        return s && s.id === b.sect && can.has(h.rarity);
      })
      .map((h) => h.id);
  }

  // The banner's pity ledger, dressed for the UI: pulls made toward the
  // next guarantee, heroes already claimed, and who is still in the pool.
  function bannerPityInfo(b) {
    const s = GameState.bannerPity(b.id, b.run || null);
    return { ...s, every: BANNER_PITY_EVERY,
      remaining: bannerFeatured(b).filter((id) => !s.claimed.includes(id)) };
  }

  // One pull with a scroll of `kind`. PLAIN rare pulls tick the 5★ pity
  // ladder (the break fires while a 5★ hero exists); banner pulls tick
  // their banner's own pity instead.
  function resolvePull(kind, banner = false, dumplingStars = null) {
    // A dumpling was rolled for this scroll. Hand it over and stop:
    // there is no rarity band to roll, no element pool to draw from, no
    // pity to tick and no roster slot to find. `rarity` carries the
    // star rating so the card, its border and the reveal sound all read
    // a 5-star dumpling as the 5-star pull it is.
    if (dumplingStars) {
      GameState.addDumpling(dumplingStars, 1);
      return { def: GameState.defById('dumpling'), dumpling: true,
        stars: dumplingStars, rarity: dumplingStars, uid: null,
        isNew: false, copies: GameState.dumplingsAt(dumplingStars),
        blessing: null, stored: false, bannerPity: false };
    }
    const elements = POOL_ELEMENTS[kind] || null;
    // Banner pity: the pull that lands on the 50th mark hands over one
    // of the featured heroes still in the pool, at random, and crosses
    // them off. With nobody left in the pool the counter stops moving —
    // the pity is spent for the rest of the banner.
    let pityDef = null;
    if (banner && typeof Events !== 'undefined' && Events.currentBanner) {
      const b = Events.currentBanner(new Date(), kind);
      if (b) {
        const run = b.run || null;
        const s = GameState.bannerPity(b.id, run);
        const remaining = bannerFeatured(b).filter((id) => !s.claimed.includes(id));
        if (remaining.length > 0) {
          const count = s.count + 1;
          if (count >= BANNER_PITY_EVERY) {
            const id = remaining[Math.floor(Math.random() * remaining.length)];
            pityDef = HEROES[id];
            GameState.setBannerPity(b.id, { count: 0, claimed: [...s.claimed, id], run });
          } else {
            GameState.setBannerPity(b.id, { count, claimed: s.claimed, run });
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
      // Carried through so the screen can say a hero went to the vault
      // rather than the roster. Without it the overflow is silent, and a
      // player watching the reveal has no idea where the hero went.
      stored: !!(added && added.stored),
      bannerPity: !!pityDef };
  }

  // Spend `count` scrolls of `kind` for that many summons.
  //
  // A pull that would not fit is refused outright rather than part-filled:
  // a summon hands over a whole hero, and dropping some of them on the
  // floor is not something to do quietly.
  //
  // "Fit" counts the VAULT as well as the roster now. A full roster used
  // to cancel the pull outright, which meant a player one slot short lost
  // the summon rather than the shelf space -- so heroes overflow into
  // storage and only a roster AND vault both full refuses.
  // Returns { error, space } instead of results when there is no room.
  // `opts.banner` marks an elective banner pull: same scrolls, same
  // band rates, but the running banner's sect draws at double weight.
  function pull(kind, count, opts = {}) {
    // The dumpling rolls happen BEFORE the space check, because a
    // dumpling is inventory: it takes no roster slot and cannot
    // overflow, so only the heroes in the plan have to fit. Without
    // this a full roster would refuse the very pull that hands over the
    // dumplings you star up with to empty it -- and refuse it for
    // summons that were never going to need a slot.
    //
    const banner = !!opts.banner;
    const plan = [];
    // A banner pull draws no dumplings. A banner is an elective pull at
    // a featured sect and its whole promise is those heroes; paying half
    // of them in dumplings would make the banner strictly worse than the
    // plain pull it costs the same as, and it would put a dumpling in
    // front of the fifty-pull guarantee. No common-scroll banner runs
    // today (both wheels are Rare and Temporal), so this is the rule
    // written down before it is needed rather than a live exception.
    for (let i = 0; i < count; i++) plan.push(banner ? null : rollDumpling(kind));
    const heroes = plan.filter((d) => !d).length;
    if (GameState.intakeSpace() < heroes) {
      return { error: 'roster-full', space: GameState.intakeSpace(),
        need: heroes, max: GameState.MAX_ROSTER };
    }
    if (!GameState.spendScrolls(kind, count)) return null;
    const results = [];
    for (const stars of plan) results.push(resolvePull(kind, banner, stars));
    GameState.questBump('summons', count);
    return results;
  }

  return { pull, pickHero, PITY_LIMIT, RATES,
    DUMPLING_CHANCE, DUMPLING_STARS, rollDumpling,
    BANNER_PITY_EVERY, bannerPityInfo, bannerFeatured, scrollRarities,
    WISHLIST_MULT };
})();
