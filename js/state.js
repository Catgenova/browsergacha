// Persistent player state: gems, hero roster, saved team, gacha pity.
// Saved to localStorage; falls back to in-memory if storage is unavailable.

const GameState = (() => {
  const KEY = 'browsergacha_save_v1';

  const DEFAULTS = {
    gems: 3000,
    roster: { sir_pixel: { copies: 1 } }, // heroId -> { copies }
    team: { 1: 'sir_pixel' },             // slotIndex (0-6) -> heroId
    pity: 0,                              // pulls since last 5★
  };

  // Heroes every player owns, granted retroactively to existing saves too.
  const STARTERS = ['sir_pixel', 'florence', 'vivian', 'coral'];

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
      if (!loaded.roster[id]) loaded.roster[id] = { copies: 1 };
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
      state.roster[heroId] = { copies: 1 };
      save();
      return { isNew: true, copies: 1 };
    },
    ownedHeroIds() { return Object.keys(state.roster); },
    copiesOf(heroId) { return state.roster[heroId] ? state.roster[heroId].copies : 0; },

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

    // ---- Gacha pity ----
    get pity() { return state.pity; },
    setPity(n) { state.pity = n; save(); },
  };
})();
