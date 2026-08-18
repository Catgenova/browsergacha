// Persistent player state: summon scrolls, hero roster, saved team,
// gacha pity, gear, and upgrade materials.
// Saved to localStorage; falls back to in-memory if storage is unavailable.

const GameState = (() => {
  const KEY = 'browsergacha_save_v1';

  const DEFAULTS = {
    scrollsCommon: 5,                    // Common Summon Scrolls
    scrollsRare: 1,                      // Rare Summon Scrolls
    scrollsTemporal: 0,                  // Temporal Scrolls (dark/light)
    // heroId -> { copies, level, xp, stars }
    roster: { florence: { copies: 1 } },
    team: { 1: 'florence' },             // slotIndex (0-6) -> heroId
    pity: 0,                             // pulls since last 5★
    bossStages: {},                      // bossId -> highest stage cleared
    waveSettings: { location: 0, stage: 1, repeat: 1 }, // hunt picker
    bossSettings: { boss: 'dragon', stage: 1, repeat: 1 }, // boss picker
    gear: {},                            // uid -> gear piece
    quests: {},                          // { daily, monthly } progress
    tower: { best: 0 },                  // Endless Tower highest floor
    nextGearUid: 1,
    whetstones: 0,                       // item-leveling currency
    arcana: 0,                           // enchanting currency
    tomes: 0,                            // skill-leveling currency (tower only)
  };

  function freshEntry(heroId) {
    const def = typeof HEROES !== 'undefined' ? HEROES[heroId] : null;
    return {
      copies: 1, level: 1, xp: 0,
      stars: def ? def.rarity : 1,
      equipment: {}, // slot -> gear uid
      skills: {},    // ability index -> skill level (absent = 1)
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
      if (!entry.skills) entry.skills = {};
    }
    if (!loaded.gear) loaded.gear = {};
    if (!loaded.nextGearUid) loaded.nextGearUid = 1;
    if (!loaded.whetstones) loaded.whetstones = 0;
    if (!loaded.arcana) loaded.arcana = 0;
    if (!loaded.tomes) loaded.tomes = 0;
    if (!loaded.waveSettings) loaded.waveSettings = { location: 0, stage: 1, repeat: 1 };
    if (!loaded.quests) loaded.quests = {};
    if (!loaded.tower) loaded.tower = { best: 0 };
    if (!loaded.bossSettings) loaded.bossSettings = { boss: 'dragon', stage: 1, repeat: 1 };
    if (!loaded.bossSettings.boss) loaded.bossSettings.boss = 'dragon';
    // Gems are retired; grant scroll defaults to migrated saves.
    if (loaded.scrollsCommon === undefined) loaded.scrollsCommon = 5;
    if (loaded.scrollsRare === undefined) loaded.scrollsRare = 1;
    if (loaded.scrollsTemporal === undefined) loaded.scrollsTemporal = 0;
    delete loaded.gems;
    // Migrate first-generation gear (fixed main stat, no rarity) to the
    // leveled/rarity schema: rare, level carried over (capped), no subs.
    for (const piece of Object.values(loaded.gear)) {
      if (!piece.rarity) {
        piece.rarity = 'rare';
        piece.level = Math.min(piece.level || 1, 60);
        piece.plus = 0;
        piece.subs = [];
        delete piece.stat;
        delete piece.value;
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

    // ---- Summon scrolls ----
    get scrollsCommon() { return state.scrollsCommon; },
    get scrollsRare() { return state.scrollsRare; },
    get scrollsTemporal() { return state.scrollsTemporal; },
    addScrolls(kind, n) {
      const key = kind === 'rare' ? 'scrollsRare'
        : kind === 'temporal' ? 'scrollsTemporal' : 'scrollsCommon';
      state[key] += n;
      save();
    },
    spendScrolls(kind, n) {
      const key = kind === 'rare' ? 'scrollsRare'
        : kind === 'temporal' ? 'scrollsTemporal' : 'scrollsCommon';
      if (state[key] < n) return false;
      state[key] -= n;
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
      return e
        ? { copies: e.copies, level: e.level, xp: e.xp, stars: e.stars,
            skills: { ...(e.skills || {}) } }
        : null;
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

    // ---- Upgrade currencies ----
    get whetstones() { return state.whetstones; },
    addWhetstones(n) { state.whetstones += n; save(); },
    get arcana() { return state.arcana; },
    addArcana(n) { state.arcana += n; save(); },
    get tomes() { return state.tomes; },
    addTomes(n) { state.tomes += n; save(); },

    // ---- Skill leveling ----
    // Skill levels live on the roster entry, keyed by ability index.
    skillLevel(heroId, idx) {
      const e = state.roster[heroId];
      return (e && e.skills && e.skills[idx]) || 1;
    },
    // Spend Skill Tomes to raise one ability a level (max 5).
    upgradeSkill(heroId, idx) {
      const e = state.roster[heroId];
      if (!e) return false;
      const lv = this.skillLevel(heroId, idx);
      if (lv >= Progression.MAX_SKILL_LEVEL) return false;
      const cost = Progression.skillUpCost(lv);
      if (state.tomes < cost) return false;
      state.tomes -= cost;
      if (!e.skills) e.skills = {};
      e.skills[idx] = lv + 1;
      save();
      return true;
    },

    // Spend whetstones to raise an item one level.
    polishGear(uid) {
      const piece = state.gear[uid];
      if (!piece || piece.level >= Gear.maxLevel(piece)) return false;
      const cost = Gear.polishCost(piece.level);
      if (state.whetstones < cost) return false;
      state.whetstones -= cost;
      piece.level++;
      save();
      this.questBump('polishes');
      return true;
    },

    // Auto-polish: keep leveling until the item caps or whetstones run
    // dry. Returns { levels, spent }.
    autoPolishGear(uid) {
      const before = state.whetstones;
      let levels = 0;
      while (this.polishGear(uid)) levels++;
      return { levels, spent: before - state.whetstones };
    },

    // Auto-enchant: keep attempting until +15 or arcana runs dry.
    // Returns { attempts, successes, spent, milestones }.
    autoEnchantGear(uid) {
      const before = state.arcana;
      let attempts = 0;
      let successes = 0;
      const milestones = [];
      for (;;) {
        const r = this.enchantGear(uid);
        if (!r) break;
        attempts++;
        if (r.success) {
          successes++;
          if (r.milestone) milestones.push(r.milestone);
        }
      }
      return { attempts, successes, spent: before - state.arcana, milestones };
    },

    // Spend arcana to attempt an enchant. The attempt can fail (success
    // falls from 95% at +1 to 5% at +15) and a failure still burns the
    // Arcana. Returns null if no attempt was possible, else
    // { success, milestone }.
    enchantGear(uid) {
      const piece = state.gear[uid];
      if (!piece || piece.plus >= Gear.MAX_PLUS) return null;
      const cost = Gear.arcanaCost(piece.plus);
      if (state.arcana < cost) return null;
      state.arcana -= cost;
      if (Math.random() >= Gear.enchantSuccessRate(piece.plus)) {
        save();
        this.questBump('enchants');
        return { success: false };
      }
      const milestone = Gear.applyEnchant(piece);
      save();
      this.questBump('enchants');
      return { success: true, milestone };
    },

    // Hero currently wearing a piece, or null.
    wearerOf(uid) {
      for (const [heroId, entry] of Object.entries(state.roster)) {
        for (const worn of Object.values(entry.equipment || {})) {
          if (worn === uid) return heroId;
        }
      }
      return null;
    },

    // Destroy a piece for materials: whetstones scale with rarity and
    // level, plus half the Arcana spent on its enchant comes back.
    salvageGear(uid) {
      const piece = state.gear[uid];
      if (!piece) return null;
      for (const entry of Object.values(state.roster)) {
        for (const [slot, worn] of Object.entries(entry.equipment || {})) {
          if (worn === uid) delete entry.equipment[slot];
        }
      }
      const rarityMult = { normal: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 };
      const whetstones = Math.round((5 + piece.level * 2) * (rarityMult[piece.rarity] || 1));
      const arcanaSpent = 3 * piece.plus + (piece.plus * (piece.plus - 1)) / 2;
      const arcana = Math.floor(arcanaSpent / 2);
      delete state.gear[uid];
      state.whetstones += whetstones;
      state.arcana += arcana;
      save();
      this.questBump('salvages');
      return { whetstones, arcana };
    },

    // Salvage every UNEQUIPPED piece below the given rarity. Returns
    // the count and total material yield.
    salvageAllBelow(rarity) {
      const rank = Gear.RARITY_ORDER.indexOf(rarity);
      if (rank <= 0) return { count: 0, whetstones: 0, arcana: 0 };
      const targets = this.unequippedGear()
        .filter((p) => Gear.RARITY_ORDER.indexOf(p.rarity) < rank);
      const total = { count: 0, whetstones: 0, arcana: 0 };
      for (const p of targets) {
        const r = this.salvageGear(p.uid);
        if (r) {
          total.count++;
          total.whetstones += r.whetstones;
          total.arcana += r.arcana;
        }
      }
      return total;
    },

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

    // ---- Quests ----
    // Progress for one board ('daily' | 'monthly'), resetting whenever
    // the stored period key no longer matches the current one.
    questState(type) {
      const key = Quests.periodKey(type);
      let q = state.quests[type];
      if (!q || q.period !== key) {
        q = { period: key, counters: {}, claimed: {} };
        state.quests[type] = q;
        save();
      }
      return q;
    },

    // Bump a progress counter on every board.
    questBump(counter, n = 1) {
      if (typeof Quests === 'undefined') return;
      for (const type of ['daily', 'weekly', 'monthly']) {
        const q = this.questState(type);
        q.counters[counter] = (q.counters[counter] || 0) + n;
      }
      save();
    },

    // Claim a completed quest's reward. Returns the reward or null.
    claimQuest(type, id) {
      const def = (Quests.DEFS[type] || []).find((d) => d.id === id);
      if (!def) return null;
      const q = this.questState(type);
      if (q.claimed[id]) return null;
      if ((q.counters[def.counter] || 0) < def.goal) return null;
      q.claimed[id] = true;
      Quests.grant(def.reward);
      save();
      return def.reward;
    },

    // Number of completed-but-unclaimed quests across all boards.
    claimableQuestCount() {
      if (typeof Quests === 'undefined') return 0;
      let n = 0;
      for (const type of ['daily', 'weekly', 'monthly']) {
        const q = this.questState(type);
        for (const def of Quests.DEFS[type]) {
          if (!q.claimed[def.id] && (q.counters[def.counter] || 0) >= def.goal) n++;
        }
      }
      return n;
    },

    // ---- Hunt settings (location / stage / repeat picker) ----
    get waveSettings() { return { ...state.waveSettings }; },
    setWaveSettings(patch) {
      Object.assign(state.waveSettings, patch);
      save();
    },
    get bossSettings() { return { ...state.bossSettings }; },
    setBossSettings(patch) {
      Object.assign(state.bossSettings, patch);
      save();
    },

    // ---- Endless Tower ----
    get towerBest() { return state.tower.best; },
    recordTowerClear(floor) {
      state.tower.best = Math.max(state.tower.best, floor);
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
