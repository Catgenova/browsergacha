// Gear: eight equipment slots per hero, every piece belongs to a Set,
// and wearing enough pieces of one set grants its bonuses (tiers
// stack).
//
// Every item has:
//   - a MAIN stat rolled at drop from its slot's pool (see
//     MAIN_POOLS), and a LEVEL that linearly scales it between the
//     stat's v1 and v90 anchors. Levels are bought with Whetstones
//     (polishing), costing more each level.
//   - a RARITY (normal/uncommon/rare/epic/legendary) that sets its max
//     level and substat count (1/2/3/4/5). Items drop with their full
//     count of distinct substats.
//   - an ENCHANT level (+0..+15) bought with Arcana. At +3/6/9/12/15
//     one EXISTING substat eats another roll from its own range — the
//     line grows (marked with an arrow per boost), no new line appears.
//
// Main pools: helm/gloves/belt roll flat ATK/HP/DEF or ATK%/DEF%/
// Accuracy/Resistance; weapon/chest/ring/amulet roll Crit Rate/Crit
// DMG/HP%; boots are always flat SPD.

const Gear = (() => {
  const SLOTS = ['weapon', 'helm', 'chest', 'gloves', 'belt', 'boots', 'ring', 'amulet'];

  const SLOT_LABELS = {
    weapon: 'Weapon', helm: 'Helm', chest: 'Chest', gloves: 'Gloves',
    belt: 'Belt', boots: 'Boots', ring: 'Ring', amulet: 'Amulet',
  };

  const SLOT_ICONS = {
    dragon: {
      helm: 'assets/icons/fc2053.png',
      belt: 'assets/icons/fc2068.png',
      weapon: 'assets/icons/fc1590.png',
      gloves: 'assets/icons/fc1568.png',
      chest: 'assets/icons/fc1815.png',
      boots: 'assets/icons/fc2164.png',
      ring: 'assets/icons/fc2186.png',
      amulet: 'assets/icons/fc2181.png',
    },
    rat: {
      helm: 'assets/icons/fc1951.png',
      belt: 'assets/icons/fc2069.png',
      weapon: 'assets/icons/fc1443.png',
      gloves: 'assets/icons/fc1488.png',
      chest: 'assets/icons/fc1921.png',
      boots: 'assets/icons/fc1938.png',
      ring: 'assets/icons/fc1843.png',
      amulet: 'assets/icons/fc2190.png',
    },
    avian: {
      helm: 'assets/icons/fc2052.png',
      belt: 'assets/icons/fc2067.png',
      weapon: 'assets/icons/fc1609.png',
      gloves: 'assets/icons/fc1648.png',
      chest: 'assets/icons/fc1817.png',
      boots: 'assets/icons/fc2159.png',
      ring: 'assets/icons/fc2187.png',
      amulet: 'assets/icons/fc2177.png',
    },
    minotaur: {
      helm: 'assets/icons/fc2054.png',
      belt: 'assets/icons/fc2069.png',
      weapon: 'assets/icons/fc1467.png',
      gloves: 'assets/icons/fc1486.png',
      chest: 'assets/icons/fc1925.png',
      boots: 'assets/icons/fc1941.png',
      ring: 'assets/icons/fc1845.png',
      amulet: 'assets/icons/fc2183.png',
    },
    snake: {
      helm: 'assets/icons/fc1953.png',
      belt: 'assets/icons/fc2067.png',
      weapon: 'assets/icons/fc1689.png',
      gloves: 'assets/icons/fc1487.png',
      chest: 'assets/icons/fc1826.png',
      boots: 'assets/icons/fc1946.png',
      ring: 'assets/icons/fc1847.png',
      amulet: 'assets/icons/fc2065.png',
    },
    wolf: {
      helm: 'assets/icons/fc1950.png',
      belt: 'assets/icons/fc2069.png',
      weapon: 'assets/icons/fc1600.png',
      gloves: 'assets/icons/fc1489.png',
      chest: 'assets/icons/fc1920.png',
      boots: 'assets/icons/fc1939.png',
      ring: 'assets/icons/fc1844.png',
      amulet: 'assets/icons/fc2178.png',
    },
    boar: {
      helm: 'assets/icons/fc2077.png',
      belt: 'assets/icons/fc2068.png',
      weapon: 'assets/icons/fc1601.png',
      gloves: 'assets/icons/fc1490.png',
      chest: 'assets/icons/fc1922.png',
      boots: 'assets/icons/fc1940.png',
      ring: 'assets/icons/fc1846.png',
      amulet: 'assets/icons/fc2179.png',
    },
    bear: {
      helm: 'assets/icons/fc2078.png',
      belt: 'assets/icons/fc2069.png',
      weapon: 'assets/icons/fc1602.png',
      gloves: 'assets/icons/fc1491.png',
      chest: 'assets/icons/fc1923.png',
      boots: 'assets/icons/fc1937.png',
      ring: 'assets/icons/fc1848.png',
      amulet: 'assets/icons/fc2180.png',
    },
    cat: {
      helm: 'assets/icons/fc1956.png',
      belt: 'assets/icons/fc2067.png',
      weapon: 'assets/icons/fc1603.png',
      gloves: 'assets/icons/fc1492.png',
      chest: 'assets/icons/fc1924.png',
      boots: 'assets/icons/fc1936.png',
      ring: 'assets/icons/fc1849.png',
      amulet: 'assets/icons/fc2182.png',
    },
  };

  const RARITY_ORDER = ['normal', 'uncommon', 'rare', 'epic', 'legendary'];
  const RARITIES = {
    normal:    { name: 'Normal',    maxLevel: 30, maxSubs: 1, color: '#b8b2cc' },
    uncommon:  { name: 'Uncommon',  maxLevel: 45, maxSubs: 2, color: '#a8e0a8' },
    rare:      { name: 'Rare',      maxLevel: 60, maxSubs: 3, color: '#8ecbff' },
    epic:      { name: 'Epic',      maxLevel: 75, maxSubs: 4, color: '#d78aff' },
    legendary: { name: 'Legendary', maxLevel: 90, maxSubs: 5, color: '#ffd76a' },
  };

  const SETS = {
    dragon: {
      id: 'dragon',
      name: 'Dragon',
      bonuses: [
        { pieces: 2, stat: 'critChance', add: 0.15, label: '2pc: +15% Crit Rate' },
        { pieces: 4, stat: 'critChance', add: 0.20, label: '4pc: +20% Crit Rate' },
        { pieces: 6, stat: 'critDamage', add: 0.80, label: '6pc: +80% Crit Damage' },
      ],
    },
    rat: {
      id: 'rat',
      name: 'Rat',
      bonuses: [
        { pieces: 2, stat: 'dodge', add: 0.05, label: '2pc: +5% Dodge' },
        { pieces: 4, stat: 'dodge', add: 0.10, label: '4pc: +10% Dodge' },
        { pieces: 6, stat: 'extraTurn', add: 0.15, label: '6pc: +15% chance to take another turn' },
      ],
    },
    avian: {
      id: 'avian',
      name: 'Avian',
      bonuses: [
        { pieces: 2, stat: 'spdFlat', add: 10, label: '2pc: +10 SPD' },
        { pieces: 4, stat: 'spdFlat', add: 20, label: '4pc: +20 SPD' },
        { pieces: 6, stat: 'spdPct', add: 0.25, label: '6pc: +25% SPD' },
      ],
    },
    minotaur: {
      id: 'minotaur',
      name: 'Minotaur',
      bonuses: [
        { pieces: 2, stat: 'atkPct', add: 0.10, label: '2pc: +10% ATK' },
        { pieces: 4, stat: 'atkPct', add: 0.20, label: '4pc: +20% ATK' },
        { pieces: 6, stat: 'atkPct', add: 0.40, label: '6pc: +40% ATK' },
      ],
    },
    snake: {
      id: 'snake',
      name: 'Snake',
      bonuses: [
        { pieces: 2, stat: 'accuracy', add: 0.20, label: '2pc: +20% Debuff Accuracy' },
        { pieces: 4, stat: 'accuracy', add: 0.40, label: '4pc: +40% Debuff Accuracy' },
        { pieces: 6, stat: 'dotBoost', add: 0.50, label: '6pc: +50% DoT Damage' },
      ],
    },
    wolf: {
      id: 'wolf',
      name: 'Wolf',
      bonuses: [
        { pieces: 2, stat: 'stun', add: 0.10, label: '2pc: +10% Stun chance on single-target attacks' },
        { pieces: 4, stat: 'stun', add: 0.15, label: '4pc: +15% Stun chance on single-target attacks' },
        { pieces: 6, stat: 'cdr', add: 1, label: '6pc: -1 turn on all ability cooldowns' },
      ],
    },
    boar: {
      id: 'boar',
      name: 'Boar',
      bonuses: [
        { pieces: 2, stat: 'defPct', add: 0.20, label: '2pc: +20% DEF' },
        { pieces: 4, stat: 'defPct', add: 0.40, label: '4pc: +40% DEF' },
        { pieces: 6, stat: 'reflect', add: 0.15, label: '6pc: +15% chance to reflect all incoming damage' },
      ],
    },
    bear: {
      id: 'bear',
      name: 'Bear',
      bonuses: [
        { pieces: 2, stat: 'hpPct', add: 0.20, label: '2pc: +20% HP' },
        { pieces: 4, stat: 'hpPct', add: 0.40, label: '4pc: +40% HP' },
        { pieces: 6, stat: 'regen', add: 0.10, label: '6pc: restores 10% max HP each turn' },
        { pieces: 6, stat: 'healBoost', add: 0.20, label: '6pc: +20% Healing' },
      ],
    },
    cat: {
      id: 'cat',
      name: 'Cat',
      bonuses: [
        { pieces: 2, stat: 'apDrain', add: 0.10, label: '2pc: +10% chance to drain 20% AP on attack' },
        { pieces: 4, stat: 'apDrain', add: 0.15, label: '4pc: +15% chance to drain 20% AP on attack' },
        { pieces: 6, stat: 'apGain', add: 0.05, label: '6pc: gains 5% AP on every character turn' },
      ],
    },
  };

  // Main-stat rulebook: every main scales linearly from v1 (level 1) to
  // v90 (level 90). Fractional stats are stored as fractions (0.45 =
  // 45%).
  const MAIN_STATS = {
    atkFlat:    { v1: 5,    v90: 500 },
    hpFlat:     { v1: 25,   v90: 2500 },
    defFlat:    { v1: 5,    v90: 500 },
    spdFlat:    { v1: 3,    v90: 30 },
    atkPct:     { v1: 0.05, v90: 0.45, pct: true },
    defPct:     { v1: 0.05, v90: 0.45, pct: true },
    hpPct:      { v1: 0.05, v90: 0.45, pct: true },
    accuracy:   { v1: 0.05, v90: 0.45, pct: true },
    resistance: { v1: 0.05, v90: 0.45, pct: true },
    critChance: { v1: 0.05, v90: 0.45, pct: true },
    critDamage: { v1: 0.10, v90: 0.80, pct: true },
  };

  // What each slot's main stat can ROLL as when the piece drops. The
  // armor slots (helm/gloves/belt) roll raw stats or utility percents;
  // the striking slots (weapon/chest/ring/amulet) roll the crit book and
  // HP%; boots are always flat SPD.
  const MAIN_POOLS = {
    weapon: ['critChance', 'critDamage', 'hpPct'],
    helm:   ['atkFlat', 'hpFlat', 'defFlat', 'atkPct', 'defPct', 'accuracy', 'resistance'],
    chest:  ['critChance', 'critDamage', 'hpPct'],
    gloves: ['atkFlat', 'hpFlat', 'defFlat', 'atkPct', 'defPct', 'accuracy', 'resistance'],
    belt:   ['atkFlat', 'hpFlat', 'defFlat', 'atkPct', 'defPct', 'accuracy', 'resistance'],
    boots:  ['spdFlat'],
    ring:   ['critChance', 'critDamage', 'hpPct'],
    amulet: ['critChance', 'critDamage', 'hpPct'],
  };

  // Pieces minted before mains rolled carry no `main`; they keep the
  // stat their slot used to fix, on the new value curve.
  const LEGACY_MAIN = {
    weapon: 'atkFlat', gloves: 'defFlat', chest: 'hpFlat',
    boots: 'spdFlat', ring: 'atkPct', amulet: 'hpPct',
  };

  function rollMain(slot, rand = Math.random) {
    const pool = MAIN_POOLS[slot] || ['atkFlat'];
    return pool[Math.floor(rand() * pool.length)];
  }

  function mainStatOf(piece) {
    return piece.main || LEGACY_MAIN[piece.slot] || MAIN_POOLS[piece.slot][0];
  }

  function baseStat(piece) {
    const stat = mainStatOf(piece);
    const t = MAIN_STATS[stat];
    const f = (piece.level - 1) / 89;
    const raw = t.v1 + (t.v90 - t.v1) * f;
    return {
      stat,
      value: t.pct ? Math.round(raw * 100) / 100 : Math.round(raw),
    };
  }

  // Substat pool. Every roll is a whole step: flats land on integers,
  // percents on whole points. The ranges are the rulebook —
  //   SPD / Crit Rate           +4..7
  //   flat ATK / flat DEF       +8..14
  //   flat HP                   +100..180
  //   ATK% / DEF% / HP% / Accuracy / Crit DMG   +6..9%
  // Resistance no longer rolls (legacy pieces that carry it still
  // display and count).
  const SUB_POOL = {
    atkFlat:    { roll: [8, 14],       label: 'ATK' },
    defFlat:    { roll: [8, 14],       label: 'DEF' },
    hpFlat:     { roll: [100, 180],    label: 'HP' },
    spdFlat:    { roll: [4, 7],        label: 'SPD' },
    atkPct:     { roll: [0.06, 0.09],  pct: true, label: 'ATK' },
    defPct:     { roll: [0.06, 0.09],  pct: true, label: 'DEF' },
    hpPct:      { roll: [0.06, 0.09],  pct: true, label: 'HP' },
    critChance: { roll: [0.04, 0.07],  pct: true, label: 'Crit Rate' },
    critDamage: { roll: [0.06, 0.09],  pct: true, label: 'Crit DMG' },
    accuracy:   { roll: [0.06, 0.09],  pct: true, label: 'Accuracy' },
    resistance: { roll: [0.06, 0.09],  pct: true, label: 'Resistance', legacy: true },
  };
  const ROLLABLE = Object.keys(SUB_POOL).filter((k) => !SUB_POOL[k].legacy);

  // `rand` lets a caller supply its own source. The campaign builds enemy
  // gear from a hash of the node id, so the fight you lost to is the
  // fight you come back to -- substats included. Rolls are uniform over
  // the whole steps of the range, both ends included.
  function rollValue(t, rand = Math.random) {
    if (t.pct) {
      const lo = Math.round(t.roll[0] * 100);
      const hi = Math.round(t.roll[1] * 100);
      return (lo + Math.floor(rand() * (hi - lo + 1))) / 100;
    }
    return t.roll[0] + Math.floor(rand() * (t.roll[1] - t.roll[0] + 1));
  }

  // Add a substat roll. Base rolls (`allowDup` false) pick a stat the
  // piece doesn't already carry; enchant rolls take the pool as it
  // comes, so +12 ATK can land on top of +11 ATK.
  function rollSub(piece, rand = Math.random, allowDup = false) {
    const taken = new Set(piece.subs.map((s) => s.stat));
    const open = allowDup ? ROLLABLE : ROLLABLE.filter((k) => !taken.has(k));
    if (open.length === 0) return null;
    const stat = open[Math.floor(rand() * open.length)];
    const sub = { stat, value: rollValue(SUB_POOL[stat], rand) };
    piece.subs.push(sub);
    return sub;
  }

  // Drop rarity odds interpolate between two extremes across the 20
  // stages: stage 1 skews hard common (1% legendary), stage 20 skews
  // hard legendary (30% legendary).
  const RARITY_WEIGHTS = {
    stage1:  { normal: 60, uncommon: 25, rare: 10, epic: 4,  legendary: 1 },
    stage20: { normal: 2,  uncommon: 8,  rare: 25, epic: 35, legendary: 30 },
  };

  function rarityWeights(stage) {
    const t = Math.min(1, Math.max(0, (stage - 1) / 19));
    const w = {};
    for (const k of RARITY_ORDER) {
      w[k] = RARITY_WEIGHTS.stage1[k] + (RARITY_WEIGHTS.stage20[k] - RARITY_WEIGHTS.stage1[k]) * t;
    }
    return w;
  }

  function rollRarity(stage) {
    const w = rarityWeights(stage);
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const k of RARITY_ORDER) {
      r -= w[k];
      if (r < 0) return k;
    }
    return 'normal';
  }

  // A fresh drop: level 1, +0, and the rarity's full count of base
  // substats — Normal 1 up to Legendary 5, all distinct stats.
  function drop(setId, stage) {
    const rarity = rollRarity(stage);
    const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)];
    const piece = {
      set: setId,
      slot,
      main: rollMain(slot),
      rarity,
      level: 1,
      plus: 0,
      subs: [],
    };
    for (let i = 0; i < RARITIES[rarity].maxSubs; i++) rollSub(piece);
    return piece;
  }

  // ---- Leveling (Whetstones) ----
  function maxLevel(piece) { return RARITIES[piece.rarity].maxLevel; }
  // Superlinear: early levels stay cheap, high levels get expensive
  // (Lv1 ~6, Lv30 ~137, Lv60 ~377, Lv89 ~677 whetstones).
  function polishCost(level) { return 5 + Math.ceil(Math.pow(level, 1.5) * 0.8); }

  // ---- Enchanting (Arcana) ----
  const MAX_PLUS = 15;
  function arcanaCost(plus) { return 3 + plus; }

  // Success chance for the attempt from `plus` to `plus + 1`: 95% for
  // +1, falling linearly to 5% for +15. A failed attempt still burns
  // the Arcana.
  function enchantSuccessRate(plus) {
    return 0.95 - (0.90 * plus) / 14;
  }

  // Enchant milestones don't mint new lines — they pick one of the
  // piece's EXISTING substats and add a fresh roll from that stat's own
  // range onto its value. `boosts` counts the milestones the line has
  // eaten, so the display can put one arrow beside it per boost.
  function boostSub(piece, rand = Math.random) {
    if (!piece.subs.length) return null;
    const sub = piece.subs[Math.floor(rand() * piece.subs.length)];
    const add = rollValue(SUB_POOL[sub.stat], rand);
    // Percent rolls live as hundredths; re-snap after adding so float
    // drift never leaves a line at 0.13000000000000002.
    sub.value = SUB_POOL[sub.stat].pct
      ? Math.round((sub.value + add) * 100) / 100
      : sub.value + add;
    sub.boosts = (sub.boosts || 0) + 1;
    return sub;
  }

  // Advance one enchant level. Every third level boosts one existing
  // substat with another roll from the same range the base roll used —
  // the line grows, no sixth line appears. Five milestones to +15.
  function applyEnchant(piece) {
    piece.plus++;
    if (piece.plus % 3 !== 0) return null;
    const sub = boostSub(piece);
    return sub ? `Enchant boost: ${subLabel(sub)}` : null;
  }

  // ---- Display ----
  function icon(piece) {
    const set = SLOT_ICONS[piece.set];
    return set ? set[piece.slot] : null;
  }

  function statText(stat, value) {
    const t = SUB_POOL[stat] || {};
    const label = t.label ||
      { atkFlat: 'ATK', defFlat: 'DEF', hpFlat: 'HP', spdFlat: 'SPD', atkPct: 'ATK', hpPct: 'HP' }[stat] || stat;
    // The pool already says which stats are fractions; ask it rather than
    // guessing from the name. Guessing printed accuracy and resistance as
    // "+0.06" while crit, which is the same kind of number, read "+5%".
    const pct = t.pct !== undefined
      ? t.pct
      : (stat.endsWith('Pct') || stat === 'critChance' || stat === 'critDamage');
    return pct ? `+${Math.round(value * 100)}% ${label}` : `+${value} ${label}`;
  }

  function subLabel(sub) { return statText(sub.stat, sub.value); }

  function pieceName(piece) {
    const plus = piece.plus > 0 ? ` +${piece.plus}` : '';
    return `${RARITIES[piece.rarity].name} ${SETS[piece.set].name} ${SLOT_LABELS[piece.slot]}${plus}`;
  }

  // How much a piece is worth TO A PARTICULAR HERO. Weighted by what
  // that hero's own statline says they're for: a 300-ATK striker cares
  // about ATK%, a wall cares about DEF and HP. Everything is normalized
  // against the hero's base stats so the comparison is apples-to-apples
  // rather than "bigger number wins".
  function scoreFor(piece, base) {
    if (!piece) return 0;
    const hp = base.hp || 1, atk = base.atk || 1, def = base.def || 1;
    const spd = base.speed || 1;
    // Role weights: share of the hero's budget in each stat.
    const offense = atk / (atk + def);         // 0..1, higher = striker
    const defense = 1 - offense;
    const W = {
      atkFlat: (100 / atk) * offense,
      atkPct: 100 * offense,
      defFlat: (100 / def) * defense,
      defPct: 100 * defense,
      hpFlat: (100 / hp) * defense * 0.9,
      hpPct: 90 * defense,
      spdFlat: (100 / spd) * 1.2,
      spdPct: 120,
      critChance: 140 * offense,
      critDamage: 70 * offense,
      accuracy: 40,
      resistance: 40,
    };
    let score = 0;
    const b = baseStat(piece);
    score += (W[b.stat] || 0) * b.value;
    for (const sub of piece.subs || []) score += (W[sub.stat] || 0) * sub.value;
    // Enchant levels are pure upside.
    score *= 1 + (piece.plus || 0) * 0.02;
    return score;
  }

  function describe(piece) {
    const b = baseStat(piece);
    return `${pieceName(piece)} · Lv ${piece.level} · ${statText(b.stat, b.value)}`;
  }

  // ---- Aggregation ----
  function aggregate(pieces) {
    const mods = {
      hpPct: 0, atkPct: 0, defPct: 0,
      hpFlat: 0, atkFlat: 0, defFlat: 0, spdFlat: 0, spdPct: 0,
      critChance: 0, critDamage: 0, dodge: 0, extraTurn: 0,
      accuracy: 0, resistance: 0, dotBoost: 0, stun: 0, cdr: 0, reflect: 0,
      regen: 0, healBoost: 0, apDrain: 0, apGain: 0,
    };
    const add = (stat, value) => {
      if (stat in mods) mods[stat] += value;
    };
    const setCounts = {};
    for (const p of pieces) {
      if (!p) continue;
      setCounts[p.set] = (setCounts[p.set] || 0) + 1;
      const b = baseStat(p);
      add(b.stat, b.value);
      for (const sub of p.subs || []) add(sub.stat, sub.value);
    }
    for (const [setId, count] of Object.entries(setCounts)) {
      const set = SETS[setId];
      if (!set) continue;
      for (const bonus of set.bonuses) {
        if (count >= bonus.pieces) add(bonus.stat, bonus.add);
      }
    }
    return { mods, setCounts };
  }

  // Apply gear to level/star-scaled stats -> final battle stats.
  function applyToStats(stats, pieces) {
    const { mods } = aggregate(pieces);
    return {
      hp: Math.round(stats.hp * (1 + mods.hpPct) + mods.hpFlat),
      atk: Math.round(stats.atk * (1 + mods.atkPct) + mods.atkFlat),
      def: Math.round(stats.def * (1 + mods.defPct) + mods.defFlat),
      speed: Math.round((stats.speed + mods.spdFlat) * (1 + mods.spdPct)),
      critChance: (stats.critChance ?? 0.15) + mods.critChance,
      critDamage: (stats.critDamage ?? 1.5) + mods.critDamage,
      dodge: mods.dodge,
      extraTurn: mods.extraTurn,
      accuracy: mods.accuracy,
      resistance: mods.resistance,
      dotBoost: mods.dotBoost,
      stun: mods.stun,
      cdr: mods.cdr,
      reflect: mods.reflect,
      regen: mods.regen,
      healBoost: mods.healBoost,
      apDrain: mods.apDrain,
      apGain: mods.apGain,
    };
  }

  return {
    SLOTS, SLOT_LABELS, SETS, RARITIES, RARITY_ORDER, MAX_PLUS,
    MAIN_POOLS, MAIN_STATS, rollMain,
    baseStat, drop, maxLevel, polishCost, arcanaCost, enchantSuccessRate, applyEnchant,
    rollSub, boostSub,
    icon, pieceName, describe, statText, subLabel, aggregate, applyToStats, scoreFor,
  };
})();
