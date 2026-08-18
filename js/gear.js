// Gear: six equipment slots per hero, every piece belongs to a Set, and
// wearing enough pieces of one set grants its bonuses (tiers stack: a
// 6-piece wearer has the 2pc, 4pc, and 6pc bonuses at once).
//
// Pieces drop from boss fights; their main-stat magnitude scales with
// the boss's level, plus a random roll. The first farmable set is the
// Dragon set (from the Dragon boss).

const Gear = (() => {
  const SLOTS = ['weapon', 'gloves', 'chest', 'boots', 'ring', 'amulet'];

  const SLOT_LABELS = {
    weapon: 'Weapon', gloves: 'Gloves', chest: 'Chest',
    boots: 'Boots', ring: 'Ring', amulet: 'Amulet',
  };

  // Icons per set+slot (assets/icons pack).
  const SLOT_ICONS = {
    dragon: {
      weapon: 'assets/icons/fc1590.png',
      gloves: 'assets/icons/fc1568.png',
      chest: 'assets/icons/fc1815.png',
      boots: 'assets/icons/fc2164.png',
      ring: 'assets/icons/fc2186.png',
      amulet: 'assets/icons/fc2181.png',
    },
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
  };

  // Main stat is fixed per slot; magnitude scales with the drop level.
  const SLOT_STATS = {
    weapon: { stat: 'atkPct', base: 0.10, perLevel: 0.0020 },
    gloves: { stat: 'atkFlat', base: 12, perLevel: 1.2 },
    chest: { stat: 'defPct', base: 0.10, perLevel: 0.0020 },
    boots: { stat: 'spdFlat', base: 4, perLevel: 0.22 },
    ring: { stat: 'hpPct', base: 0.10, perLevel: 0.0020 },
    amulet: { stat: 'critDmg', base: 0.12, perLevel: 0.0040 },
  };

  // Roll a fresh drop: random slot, level-scaled main stat ±15%.
  function roll(setId, level) {
    const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)];
    const t = SLOT_STATS[slot];
    const variance = 0.85 + Math.random() * 0.30;
    const raw = (t.base + t.perLevel * level) * variance;
    const value =
      t.stat === 'atkFlat' ? Math.round(raw) :
      t.stat === 'spdFlat' ? Math.round(raw) :
      Math.round(raw * 100) / 100;
    return { set: setId, slot, stat: t.stat, value, level };
  }

  function icon(piece) {
    const set = SLOT_ICONS[piece.set];
    return set ? set[piece.slot] : null;
  }

  function pieceName(piece) {
    return `${SETS[piece.set].name} ${SLOT_LABELS[piece.slot]}`;
  }

  function statLabel(piece) {
    switch (piece.stat) {
      case 'atkPct': return `+${Math.round(piece.value * 100)}% ATK`;
      case 'defPct': return `+${Math.round(piece.value * 100)}% DEF`;
      case 'hpPct': return `+${Math.round(piece.value * 100)}% HP`;
      case 'atkFlat': return `+${piece.value} ATK`;
      case 'spdFlat': return `+${piece.value} SPD`;
      case 'critDmg': return `+${Math.round(piece.value * 100)}% Crit DMG`;
      default: return '';
    }
  }

  function describe(piece) {
    return `${pieceName(piece)} · ${statLabel(piece)} · Lv ${piece.level}`;
  }

  // Sum piece main stats + earned set bonuses into one modifier bundle.
  function aggregate(pieces) {
    const mods = {
      hpPct: 0, atkPct: 0, defPct: 0, atkFlat: 0, spdFlat: 0,
      critChance: 0, critDamage: 0,
    };
    const setCounts = {};
    for (const p of pieces) {
      if (!p) continue;
      setCounts[p.set] = (setCounts[p.set] || 0) + 1;
      switch (p.stat) {
        case 'hpPct': mods.hpPct += p.value; break;
        case 'atkPct': mods.atkPct += p.value; break;
        case 'defPct': mods.defPct += p.value; break;
        case 'atkFlat': mods.atkFlat += p.value; break;
        case 'spdFlat': mods.spdFlat += p.value; break;
        case 'critDmg': mods.critDamage += p.value; break;
      }
    }
    for (const [setId, count] of Object.entries(setCounts)) {
      const set = SETS[setId];
      if (!set) continue;
      for (const b of set.bonuses) {
        if (count < b.pieces) continue;
        if (b.stat === 'critChance') mods.critChance += b.add;
        if (b.stat === 'critDamage') mods.critDamage += b.add;
      }
    }
    return { mods, setCounts };
  }

  // Apply gear to level/star-scaled stats -> final battle stats.
  function applyToStats(stats, pieces) {
    const { mods } = aggregate(pieces);
    return {
      hp: Math.round(stats.hp * (1 + mods.hpPct)),
      atk: Math.round(stats.atk * (1 + mods.atkPct) + mods.atkFlat),
      def: Math.round(stats.def * (1 + mods.defPct)),
      speed: Math.round(stats.speed + mods.spdFlat),
      critChance: (stats.critChance ?? 0.15) + mods.critChance,
      critDamage: (stats.critDamage ?? 1.5) + mods.critDamage,
    };
  }

  return {
    SLOTS, SLOT_LABELS, SETS,
    roll, icon, pieceName, statLabel, describe, aggregate, applyToStats,
  };
})();
