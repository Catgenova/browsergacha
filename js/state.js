// Persistent player state: gems, hero roster, saved team, gacha pity.
// Saved to localStorage; falls back to in-memory if storage is unavailable.

const GameState = (() => {
  const KEY = 'browsergacha_save_v1';

  const DEFAULTS = {
    gems: 3000,
    // heroId -> { copies, level, xp, stars }
    roster: { florence: { copies: 1 } },
    team: { 1: 'florence' },             // slotIndex (0-6) -> heroId
    pity: 0,                             // pulls since last 5★
    bossStages: {},                      // bossId -> highest stage cleared
    gear: {},                            // uid -> gear piece
    nextGearUid: 1,
  };

  function freshEntry(heroId) {
    const def = typeof HEROES !== 'undefined' ? HEROES[heroId] : null;
    return {
      copies: 1, level: 1, xp: 0,
      stars: def ? def.rarity : 1,
      equipment: {}, // slot -> gear uid
    };
  }

  // Heroes every player owns, granted retroactively to existing saves too.
  const STARTERS = ['florence', 'vivian', 'coral', 'vex', 'emily'];

  let state = load();
  const listeners = [];

  function load() {
    let loaded;
    try {
      const raw = localStorage.getItem(KEY);
      loaded = raw
        ? { ...structuredClone(DEFAULTS), ...JSON.parse(raw) }
        : structuredClone(DEFAULTS);
    } catch (e) { /* storage unavailable or corrupt: start fresh */
      loaded = structuredClone(DEFAULTS);
    }
    for (const id of STARTERS) {
      if (!loaded.roster[id]) loaded.roster[id] = freshEntry(id);
    }
    // Scrub heroes that no longer exist (removed characters) from saves.
    if (typeof HEROES !== 'undefined') {
      for (const id of Object.keys(loaded.roster)) {
        if (!HEROES[id]) delete loaded.roster[id];
      }
      for (const [slot, id] of Object.entries(loaded.team)) {
        if (!HEROES[id]) delete loaded.team[slot];
      }
    }
    // Migrate older saves: entries gain level/xp/stars/equipment.
    for (const [id, entry] of Object.entries(loaded.roster)) {
      if (entry.level === undefined) {
        Object.assign(entry, { level: 1, xp: 0 }, { stars: freshEntry(id).stars });
      }
      if (!entry.equipment) entry.equipment = {};
    }
    if (!loaded.gear) loaded.gear = {};
    if (!loaded.nextGearUid) loaded.nextGearUid = 1;
    return loaded;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    listeners.forEach((fn) => fn(state));
  }

  return {
    onChange(fn) { listeners.push(fn); },

    // ---- Currency ----
    get gems() { return state.gems; },
    addGems(n) { state.gems += n; save(); },
    spendGems(n) {
      if (state.gems < n) return false;
      state.gems -= n;
      save();
      return true;
    },

    // ---- Roster ----
    // Returns { isNew, copies } for the pulled hero.
    addHero(heroId) {
      const entry = state.roster[heroId];
      if (entry) {
        entry.copies++;
        save();
        return { isNew: false, copies: entry.copies };
      }
      state.roster[heroId] = freshEntry(heroId);
      save();
      return { isNew: true, copies: 1 };
    },
    ownedHeroIds() { return Object.keys(state.roster); },
    copiesOf(heroId) { return state.roster[heroId] ? state.roster[heroId].copies : 0; },

    // ---- Progression ----
    // { copies, level, xp, stars } for an owned hero (null if unowned).
    progressOf(heroId) {
      const e = state.roster[heroId];
      return e ? { copies: e.copies, level: e.level, xp: e.xp, stars: e.stars } : null;
    },

    // Grant XP, chaining level-ups. XP gained at max level is discarded
    // (star up to keep growing). Returns { levelsGained, level }.
    addXp(heroId, amount) {
      const e = state.roster[heroId];
      if (!e) return null;
      const cap = Progression.maxLevel(e.stars);
      let gained = 0;
      if (e.level < cap) {
        e.xp += amount;
        while (e.level < cap && e.xp >= Progression.xpToNext(e.level)) {
          e.xp -= Progression.xpToNext(e.level);
          e.level++;
          gained++;
        }
        if (e.level >= cap) e.xp = 0; // parked at cap until star-up
      }
      save();
      return { levelsGained: gained, level: e.level };
    },

    // Spend duplicates to star up. Requires max level and enough spare
    // copies (the first copy is the hero itself). Resets level to 1.
    canStarUp(heroId) {
      const e = state.roster[heroId];
      if (!e || e.stars >= Progression.MAX_STARS) return false;
      return (
        e.level >= Progression.maxLevel(e.stars) &&
        e.copies - 1 >= Progression.starUpCost(e.stars)
      );
    },
    starUp(heroId) {
      if (!this.canStarUp(heroId)) return false;
      const e = state.roster[heroId];
      e.copies -= Progression.starUpCost(e.stars);
      e.stars++;
      e.level = 1;
      e.xp = 0;
      save();
      return true;
    },

    // ---- Team ----
    // team is { slotIndex: heroId }; a hero occupies at most one slot.
    getTeam() { return { ...state.team }; },
    teamSlotOf(heroId) {
      for (const [slot, id] of Object.entries(state.team)) {
        if (id === heroId) return Number(slot);
      }
      return null;
    },
    setTeamSlot(slotIndex, heroId) {
      // Remove the hero from any slot it already occupies, then place it.
      for (const [slot, id] of Object.entries(state.team)) {
        if (id === heroId) delete state.team[slot];
      }
      state.team[slotIndex] = heroId;
      save();
    },
    swapTeamSlots(a, b) {
      const heroA = state.team[a];
      const heroB = state.team[b];
      if (heroA !== undefined) state.team[b] = heroA; else delete state.team[b];
      if (heroB !== undefined) state.team[a] = heroB; else delete state.team[a];
      save();
    },
    clearTeamSlot(slotIndex) {
      delete state.team[slotIndex];
      save();
    },
    clearTeam() {
      state.team = {};
      save();
    },
    teamSize() { return Object.keys(state.team).length; },

    // ---- Gear ----
    // Add a dropped piece to the inventory; returns its uid.
    addGear(piece) {
      const uid = String(state.nextGearUid++);
      state.gear[uid] = { ...piece, uid };
      save();
      return uid;
    },
    gearById(uid) { return state.gear[uid] || null; },

    // Pieces not currently worn by anyone (optionally one slot only).
    unequippedGear(slot = null) {
      const worn = new Set();
      for (const entry of Object.values(state.roster)) {
        for (const uid of Object.values(entry.equipment || {})) worn.add(uid);
      }
      return Object.values(state.gear).filter(
        (p) => !worn.has(p.uid) && (!slot || p.slot === slot)
      );
    },

    // Equipped pieces for a hero, as an array (for stat aggregation).
    equippedPieces(heroId) {
      const entry = state.roster[heroId];
      if (!entry || !entry.equipment) return [];
      return Object.values(entry.equipment)
        .map((uid) => state.gear[uid])
        .filter(Boolean);
    },
    equipmentOf(heroId) {
      const entry = state.roster[heroId];
      return entry && entry.equipment ? { ...entry.equipment } : {};
    },

    // Equip a piece: pulls it off any other wearer, replaces whatever
    // is in the hero's matching slot.
    equipGear(heroId, uid) {
      const piece = state.gear[uid];
      const entry = state.roster[heroId];
      if (!piece || !entry) return false;
      for (const other of Object.values(state.roster)) {
        if (!other.equipment) continue;
        for (const [slot, worn] of Object.entries(other.equipment)) {
          if (worn === uid) delete other.equipment[slot];
        }
      }
      entry.equipment[piece.slot] = uid;
      save();
      return true;
    },
    unequipGear(heroId, slot) {
      const entry = state.roster[heroId];
      if (!entry || !entry.equipment) return;
      delete entry.equipment[slot];
      save();
    },

    // ---- Boss stages ----
    bossStageCleared(bossId) {
      return (state.bossStages && state.bossStages[bossId]) || 0;
    },
    recordBossClear(bossId, stage) {
      if (!state.bossStages) state.bossStages = {};
      state.bossStages[bossId] = Math.max(this.bossStageCleared(bossId), stage);
      save();
    },

    // ---- Gacha pity ----
    get pity() { return state.pity; },
    setPity(n) { state.pity = n; save(); },
  };
})();
