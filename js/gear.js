// Gear: six equipment slots per hero, every piece belongs to a Set, and
// wearing enough pieces of one set grants its bonuses (tiers stack).
//
// Every item has:
//   - a LEVEL that linearly scales its slot-fixed base stat (a level 1
//     weapon gives ~5 ATK; level 90 gives 500). Levels are bought with
//     Whetstones (polishing), costing more each level.
//   - a RARITY (normal/uncommon/rare/epic/legendary) that sets its max
//     level and max substat count (1/2/3/4/5). Items drop with one sub
//     fewer than their max (legendary: 4 subs plus a free bonus boost).
//   - an ENCHANT level (+0..+15) bought with Arcana. At +3/6/9/12/15 a
//     new substat rolls if the item is below its rarity's cap,
//     otherwise a random existing substat gets boosted.
//
// Base stats per slot: weapon raw ATK, gloves raw DEF, chest raw HP,
// boots raw SPD, ring ATK% (caps at 100%), amulet HP% (caps at 100%).
// Raw substats cap at 50% of the slot base-stat maximum.

const Gear = (() => {
  const SLOTS = ['weapon', 'gloves', 'chest', 'boots', 'ring', 'amulet'];

  const SLOT_LABELS = {
    weapon: 'Weapon', gloves: 'Gloves', chest: 'Chest',
    boots: 'Boots', ring: 'Ring', amulet: 'Amulet',
  };

  const SLOT_ICONS = {
    dragon: {
      weapon: 'assets/icons/fc1590.png',
      gloves: 'assets/icons/fc1568.png',
      chest: 'assets/icons/fc1815.png',
      boots: 'assets/icons/fc2164.png',
      ring: 'assets/icons/fc2186.png',
      amulet: 'assets/icons/fc2181.png',
    },
    rat: {
      weapon: 'assets/icons/fc1443.png',
      gloves: 'assets/icons/fc1488.png',
      chest: 'assets/icons/fc1921.png',
      boots: 'assets/icons/fc1938.png',
      ring: 'assets/icons/fc1843.png',
      amulet: 'assets/icons/fc2190.png',
    },
    avian: {
      weapon: 'assets/icons/fc1609.png',
      gloves: 'assets/icons/fc1648.png',
      chest: 'assets/icons/fc1817.png',
      boots: 'assets/icons/fc2159.png',
      ring: 'assets/icons/fc2187.png',
      amulet: 'assets/icons/fc2177.png',
    },
    minotaur: {
      weapon: 'assets/icons/fc1467.png',
      gloves: 'assets/icons/fc1486.png',
      chest: 'assets/icons/fc1925.png',
      boots: 'assets/icons/fc1941.png',
      ring: 'assets/icons/fc1845.png',
      amulet: 'assets/icons/fc2183.png',
    },
    snake: {
      weapon: 'assets/icons/fc1689.png',
      gloves: 'assets/icons/fc1487.png',
      chest: 'assets/icons/fc1826.png',
      boots: 'assets/icons/fc1946.png',
      ring: 'assets/icons/fc1847.png',
      amulet: 'assets/icons/fc2065.png',
    },
    wolf: {
      weapon: 'assets/icons/fc1600.png',
      gloves: 'assets/icons/fc1489.png',
      chest: 'assets/icons/fc1920.png',
      boots: 'assets/icons/fc1939.png',
      ring: 'assets/icons/fc1844.png',
      amulet: 'assets/icons/fc2178.png',
    },
    boar: {
      weapon: 'assets/icons/fc1601.png',
      gloves: 'assets/icons/fc1490.png',
      chest: 'assets/icons/fc1922.png',
      boots: 'assets/icons/fc1940.png',
      ring: 'assets/icons/fc1846.png',
      amulet: 'assets/icons/fc2179.png',
    },
    bear: {
      weapon: 'assets/icons/fc1602.png',
      gloves: 'assets/icons/fc1491.png',
      chest: 'assets/icons/fc1923.png',
      boots: 'assets/icons/fc1937.png',
      ring: 'assets/icons/fc1848.png',
      amulet: 'assets/icons/fc2180.png',
    },
    cat: {
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

  // Slot-fixed base stat, scaling linearly from v1 (level 1) to v90
  // (level 90). Percent bases cap at 100%.
  const BASE_SCALE = {
    weapon: { stat: 'atkFlat', v1: 5, v90: 500 },
    gloves: { stat: 'defFlat', v1: 3, v90: 300 },
    chest:  { stat: 'hpFlat',  v1: 30, v90: 3000 },
    boots:  { stat: 'spdFlat', v1: 2, v90: 50 },
    ring:   { stat: 'atkPct',  v1: 0.02, v90: 1.0 },
    amulet: { stat: 'hpPct',   v1: 0.02, v90: 1.0 },
  };

  function baseStat(piece) {
    const t = BASE_SCALE[piece.slot];
    const f = (piece.level - 1) / 89;
    const raw = t.v1 + (t.v90 - t.v1) * f;
    const pct = t.stat.endsWith('Pct');
    return {
      stat: t.stat,
      value: pct ? Math.min(1, Math.round(raw * 100) / 100) : Math.round(raw),
    };
  }

  // Substat pool. Raw caps are 50% of the matching base-stat max.
  const SUB_POOL = {
    atkFlat:    { roll: [5, 20],       cap: 250,  label: 'ATK' },
    defFlat:    { roll: [3, 12],       cap: 150,  label: 'DEF' },
    hpFlat:     { roll: [30, 120],     cap: 1500, label: 'HP' },
    spdFlat:    { roll: [1, 4],        cap: 25,   label: 'SPD' },
    atkPct:     { roll: [0.03, 0.08],  cap: 0.5,  pct: true, label: 'ATK' },
    defPct:     { roll: [0.03, 0.08],  cap: 0.5,  pct: true, label: 'DEF' },
    hpPct:      { roll: [0.03, 0.08],  cap: 0.5,  pct: true, label: 'HP' },
    critChance: { roll: [0.02, 0.05],  cap: 0.25, pct: true, label: 'Crit Rate' },
    critDamage: { roll: [0.03, 0.07],  cap: 0.5,  pct: true, label: 'Crit DMG' },
    accuracy:   { roll: [0.03, 0.08],  cap: 0.5,  pct: true, label: 'Accuracy' },
    resistance: { roll: [0.03, 0.08],  cap: 0.5,  pct: true, label: 'Resistance' },
  };

  function rollValue(t) {
    const v = t.roll[0] + Math.random() * (t.roll[1] - t.roll[0]);
    return t.pct ? Math.round(v * 100) / 100 : Math.round(v);
  }

  // Add a new substat the piece doesn't already have.
  function rollSub(piece) {
    const taken = new Set(piece.subs.map((s) => s.stat));
    const open = Object.keys(SUB_POOL).filter((k) => !taken.has(k));
    if (open.length === 0) return null;
    const stat = open[Math.floor(Math.random() * open.length)];
    const sub = { stat, value: rollValue(SUB_POOL[stat]) };
    piece.subs.push(sub);
    return sub;
  }

  // Strengthen a random existing substat by 50-100% of a fresh roll.
  function boostSub(piece) {
    if (piece.subs.length === 0) return null;
    const sub = piece.subs[Math.floor(Math.random() * piece.subs.length)];
    const t = SUB_POOL[sub.stat];
    const gain = rollValue(t) * (0.5 + Math.random() * 0.5);
    sub.value = Math.min(t.cap, t.pct
      ? Math.round((sub.value + gain) * 100) / 100
      : Math.round(sub.value + gain));
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

  // A fresh drop: level 1, +0, starting subs = rarity max minus one
  // (legendary also gets one free bonus boost).
  function drop(setId, stage) {
    const rarity = rollRarity(stage);
    const piece = {
      set: setId,
      slot: SLOTS[Math.floor(Math.random() * SLOTS.length)],
      rarity,
      level: 1,
      plus: 0,
      subs: [],
    };
    for (let i = 0; i < RARITIES[rarity].maxSubs - 1; i++) rollSub(piece);
    if (rarity === 'legendary') boostSub(piece);
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

  // Advance one enchant level, applying milestone substat rolls/boosts.
  // Returns a description of what happened at a milestone (or null).
  function applyEnchant(piece) {
    piece.plus++;
    if (piece.plus % 3 !== 0) return null;
    if (piece.subs.length < RARITIES[piece.rarity].maxSubs) {
      const sub = rollSub(piece);
      return sub ? `New substat: ${subLabel(sub)}` : null;
    }
    const sub = boostSub(piece);
    return sub ? `Boosted: ${subLabel(sub)}` : null;
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
    const pct = stat.endsWith('Pct') || stat === 'critChance' || stat === 'critDamage';
    return pct ? `+${Math.round(value * 100)}% ${label}` : `+${value} ${label}`;
  }

  function subLabel(sub) { return statText(sub.stat, sub.value); }

  function pieceName(piece) {
    const plus = piece.plus > 0 ? ` +${piece.plus}` : '';
    return `${RARITIES[piece.rarity].name} ${SETS[piece.set].name} ${SLOT_LABELS[piece.slot]}${plus}`;
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
    baseStat, drop, maxLevel, polishCost, arcanaCost, enchantSuccessRate, applyEnchant,
    icon, pieceName, describe, statText, subLabel, aggregate, applyToStats,
  };
})();
