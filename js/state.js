// Persistent player state: summon scrolls, hero roster, saved team,
// gacha pity, gear, and upgrade materials.
// Saved to localStorage; falls back to in-memory if storage is unavailable.

const GameState = (() => {
  const KEY = 'browsergacha_save_v1';

  // Save schema version. Every structural change to the save gets a
  // numbered migration below rather than another ad-hoc patch in
  // load(), so an old save always walks a known path to the present.
  const SCHEMA = 6;

  // Ordered migrations: each takes a save at version < its `to` and
  // brings it up to that version. They run in order, once, on load.
  const MIGRATIONS = [
    {
      to: 1,
      what: 'gems retired in favour of summon scrolls',
      run(s) {
        delete s.gems;
        if (s.scrollsCommon === undefined) s.scrollsCommon = 5;
        if (s.scrollsRare === undefined) s.scrollsRare = 1;
        if (s.scrollsTemporal === undefined) s.scrollsTemporal = 0;
      },
    },
    {
      to: 2,
      what: 'roster entries gained level, stars, gear and skill levels',
      run(s) {
        for (const [id, entry] of Object.entries(s.roster || {})) {
          if (entry.level === undefined) {
            Object.assign(entry, { level: 1, xp: 0, stars: freshEntry(id).stars });
          }
          if (!entry.equipment) entry.equipment = {};
          if (!entry.skills) entry.skills = {};
        }
      },
    },
    {
      to: 3,
      what: 'stars can never sit below a hero base rarity (Dark/Light promotion)',
      run(s) {
        if (typeof HEROES === 'undefined') return;
        for (const [id, entry] of Object.entries(s.roster || {})) {
          const def = HEROES[id];
          if (def && entry.stars < (def.rarity || 1)) entry.stars = def.rarity;
        }
      },
    },
    {
      to: 4,
      what: 'gear pieces gained a lock flag',
      run(s) {
        for (const piece of Object.values(s.gear || {})) {
          if (piece.locked === undefined) piece.locked = false;
        }
      },
    },
    {
      to: 5,
      what: 'the campaign became the spine, and now gates hunts and bosses',
      run(s) {
        // Hunt locations and bosses used to be open from the start and
        // are now unlocked by clearing campaign chapters. A save made
        // before this change must not LOSE access to a boss it has
        // already beaten or a biome it has been farming, so seed the
        // campaign from what the save already proves.
        if (!s.campaign) s.campaign = { cleared: {}, chapter: 'ch1' };
        if (!s.campaign.cleared) s.campaign.cleared = {};
        if (typeof CAMPAIGN === 'undefined') return;
        const grant = (ch) => {
          const boss = ch.nodes.find((n) => n.type === 'boss');
          if (boss) s.campaign.cleared[boss.id] = true;
        };
        // Every boss already beaten hands over its chapter...
        for (const ch of CAMPAIGN.CHAPTERS) {
          const def = typeof BOSSES !== 'undefined' ? BOSSES[ch.boss] : null;
          if (def && (s.bossStages || {})[def.id] > 0) grant(ch);
        }
        // ...and so does the biome they were last hunting in, along with
        // everything before it, since reaching it meant it was open.
        const loc = s.waveSettings ? Number(s.waveSettings.location) : 0;
        for (const ch of CAMPAIGN.CHAPTERS) {
          if (ch.location <= loc) grant(ch);
        }
      },
    },
    {
      to: 6,
      what: 'grandfathered access no longer counts as campaign progress',
      run(s) {
        // v5 preserved a save's hunt and boss access by marking those
        // chapters' HOLDER nodes cleared. That worked for access and was
        // wrong for everything else: a chapter reads as beaten the moment
        // its holder is down, so seven chapters showed as finished on a
        // save that had never opened the campaign — story, first-clear
        // scrolls and all, silently spent.
        //
        // Access and progress are now separate. `granted` records what
        // the old save had earned; `cleared` means you actually fought it.
        if (!s.campaign) s.campaign = { cleared: {}, chapter: 'ch1' };
        if (!s.campaign.cleared) s.campaign.cleared = {};
        if (!s.campaign.granted) s.campaign.granted = { hunt: {}, boss: {} };
        if (typeof CAMPAIGN === 'undefined') return;
        const bossOf = (ch) => ch.nodes.find((n) => n.type === 'boss');
        // A holder cannot legitimately fall before the node feeding it,
        // so a chapter whose ONLY clear is its holder was written by v5.
        const isV5Grant = (ch) => {
          const boss = bossOf(ch);
          return boss && s.campaign.cleared[boss.id] &&
            !ch.nodes.some((n) => n.id !== boss.id && s.campaign.cleared[n.id]);
        };
        if (!CAMPAIGN.CHAPTERS.some(isV5Grant)) return;
        // Grandfather exactly what this save could reach a moment ago, so
        // nothing closes. v5 gated the two on different marks — a hunt
        // opened when the PREVIOUS chapter's holder fell, a boss when its
        // OWN did — so they are recorded separately here too.
        const hunts = CAMPAIGN.CHAPTERS.filter((ch, i) => {
          if (i === 0) return true;
          const prev = bossOf(CAMPAIGN.CHAPTERS[i - 1]);
          return prev && s.campaign.cleared[prev.id];
        });
        const bosses = CAMPAIGN.CHAPTERS.filter(
          (ch) => bossOf(ch) && s.campaign.cleared[bossOf(ch).id]);
        for (const ch of CAMPAIGN.CHAPTERS) {
          if (isV5Grant(ch)) delete s.campaign.cleared[bossOf(ch).id];
        }
        for (const ch of hunts) s.campaign.granted.hunt[ch.id] = true;
        for (const ch of bosses) s.campaign.granted.boss[ch.id] = true;
      },
    },
  ];

  // Bring a loaded save up to the current schema.
  //
  // `from` is passed in rather than read off `s`: the loaded object has
  // already been merged over DEFAULTS, which carries the CURRENT
  // schemaVersion, so a save that predates the field would look
  // brand-new and skip every migration it needs.
  function migrate(s, from) {
    for (const m of MIGRATIONS) {
      if (from >= m.to) continue;
      try {
        m.run(s);
      } catch (e) {
        console.warn(`save migration to v${m.to} (${m.what}) failed:`, e.message);
      }
    }
    s.schemaVersion = SCHEMA;
    return s;
  }

  const DEFAULTS = {
    schemaVersion: SCHEMA,               // see MIGRATIONS above
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
    achievements: {},                    // achievementId -> true once claimed
    tower: { best: 0 },                  // Endless Tower highest floor
    presets: [],                         // [{ name, team: {slot: heroId} }]
    // cleared: nodeId -> true (fights actually won).
    // granted: access carried over from a pre-campaign save, as
    // { hunt: chapterId -> true, boss: chapterId -> true }. It opens
    // those two gates and never counts as campaign progress.
    campaign: { cleared: {}, granted: { hunt: {}, boss: {} }, chapter: 'ch1' },
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
      favorite: false, // pinned to the top of the roster
    };
  }

  // Heroes every player owns, granted retroactively to existing saves too.
  const STARTERS = ['florence', 'vivian', 'coral', 'vex', 'emily'];

  let state = load();
  const listeners = [];

  function load() {
    let loaded;
    // The version has to come off the RAW save, before DEFAULTS supplies
    // its own; a fresh save legitimately starts at the current schema
    // and runs nothing.
    let from = SCHEMA;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        from = typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : 0;
        loaded = { ...structuredClone(DEFAULTS), ...parsed };
      } else {
        loaded = structuredClone(DEFAULTS);
      }
    } catch (e) { /* storage unavailable or corrupt: start fresh */
      loaded = structuredClone(DEFAULTS);
      from = SCHEMA;
    }
    for (const id of STARTERS) {
      if (!loaded.roster[id]) loaded.roster[id] = freshEntry(id);
    }
    // Scrub heroes that no longer exist (removed characters) from saves.
    if (typeof HEROES !== 'undefined') {
      for (const id of Object.keys(loaded.roster)) {
        if (!HEROES[id]) delete loaded.roster[id];
      }
      // Invariant, not a migration: promoting a character later must
      // still lift copies already in the roster.
      for (const [id, entry] of Object.entries(loaded.roster)) {
        const base = HEROES[id].rarity || 1;
        if (entry.stars !== undefined && entry.stars < base) entry.stars = base;
      }
      for (const [slot, id] of Object.entries(loaded.team)) {
        if (!HEROES[id]) delete loaded.team[slot];
      }
    }
    // Walk the save up to the current schema.
    migrate(loaded, from);

    // Shape guards: fields a save must have regardless of its age.
    // These are invariants, not migrations — a BRAND NEW save stamps the
    // current schema and therefore runs no migrations at all, so the
    // defaults have to be completed here or heroes load without a level.
    for (const [id, entry] of Object.entries(loaded.roster || {})) {
      if (entry.copies === undefined) entry.copies = 1;
      if (entry.level === undefined) entry.level = 1;
      if (entry.xp === undefined) entry.xp = 0;
      if (entry.stars === undefined) entry.stars = freshEntry(id).stars;
      if (!entry.equipment) entry.equipment = {};
      if (!entry.skills) entry.skills = {};
      if (entry.favorite === undefined) entry.favorite = false;
    }
    if (!loaded.gear) loaded.gear = {};
    if (!loaded.nextGearUid) loaded.nextGearUid = 1;
    if (!loaded.whetstones) loaded.whetstones = 0;
    if (!loaded.arcana) loaded.arcana = 0;
    if (!loaded.tomes) loaded.tomes = 0;
    if (!loaded.waveSettings) loaded.waveSettings = { location: 0, stage: 1, repeat: 1 };
    if (!loaded.quests) loaded.quests = {};
    if (!loaded.achievements) loaded.achievements = {};
    if (!loaded.tower) loaded.tower = { best: 0 };
    if (!Array.isArray(loaded.presets)) loaded.presets = [];
    if (!loaded.campaign) loaded.campaign = { cleared: {}, chapter: 'ch1' };
    if (!loaded.campaign.tier) loaded.campaign.tier = 'normal';
    if (!loaded.campaign.cleared) loaded.campaign.cleared = {};
    if (!loaded.campaign.granted) loaded.campaign.granted = {};
    if (!loaded.campaign.granted.hunt) loaded.campaign.granted.hunt = {};
    if (!loaded.campaign.granted.boss) loaded.campaign.granted.boss = {};
    if (!loaded.campaign.chapter) loaded.campaign.chapter = 'ch1';
    if (!loaded.bossSettings) loaded.bossSettings = { boss: 'dragon', stage: 1, repeat: 1 };
    if (!loaded.bossSettings.boss) loaded.bossSettings.boss = 'dragon';

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

    // Favourites float to the top of the roster in every sort order.
    // Purely a display preference — nothing in battle reads it.
    isFavorite(heroId) {
      const e = state.roster[heroId];
      return !!(e && e.favorite);
    },
    toggleFavorite(heroId) {
      const e = state.roster[heroId];
      if (!e) return false;
      e.favorite = !e.favorite;
      save();
      return e.favorite;
    },
    favoriteCount() {
      return Object.values(state.roster).filter((e) => e.favorite).length;
    },

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

    // Every hero that can star up right now, starred up in one pass.
    // A star-up resets the hero to level 1, so nobody qualifies twice in
    // the same sweep. Heroes currently fighting are skipped for the same
    // reason their gear is locked: their stats are already committed.
    starUpAll() {
      const done = [];
      for (const heroId of Object.keys(state.roster)) {
        if (!this.canStarUp(heroId)) continue;
        if (this.heroGearLocked(heroId)) continue;
        const from = state.roster[heroId].stars;
        if (this.starUp(heroId)) {
          const def = typeof HEROES !== 'undefined' ? HEROES[heroId] : null;
          done.push({ id: heroId, name: def ? def.name : heroId, from, to: from + 1 });
        }
      }
      return done;
    },

    // How many heroes are waiting on a star-up right now.
    starUpReadyCount() {
      return Object.keys(state.roster).filter((id) =>
        this.canStarUp(id) && !this.heroGearLocked(id)).length;
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

    // ---- Team presets ----
    // Campaign, boss, tower and hunt all want different formations, and
    // rebuilding one by hand out of 386 heroes is the slowest thing on
    // this screen. A preset is a named snapshot of the placements.
    MAX_PRESETS: 8,
    presets() {
      return state.presets.map((p) => ({ name: p.name, team: { ...p.team } }));
    },
    // Saving under an existing name overwrites it, so re-saving a tweaked
    // formation does not quietly leave two entries called the same thing.
    savePreset(name) {
      const clean = String(name || '').trim().slice(0, 24);
      if (!clean || Object.keys(state.team).length === 0) return null;
      const team = { ...state.team };
      const at = state.presets.findIndex((p) => p.name === clean);
      if (at >= 0) state.presets[at] = { name: clean, team };
      else {
        if (state.presets.length >= this.MAX_PRESETS) return null;
        state.presets.push({ name: clean, team });
      }
      save();
      return clean;
    },
    // Heroes sold or otherwise gone are dropped on load rather than
    // placing a slot that refers to nothing.
    loadPreset(name) {
      const p = state.presets.find((x) => x.name === name);
      if (!p) return null;
      const team = {};
      let missing = 0;
      for (const [slot, id] of Object.entries(p.team)) {
        if (state.roster[id] && (typeof HEROES === 'undefined' || HEROES[id])) {
          team[slot] = id;
        } else missing++;
      }
      state.team = team;
      save();
      return { placed: Object.keys(team).length, missing };
    },
    deletePreset(name) {
      const at = state.presets.findIndex((p) => p.name === name);
      if (at < 0) return false;
      state.presets.splice(at, 1);
      save();
      return true;
    },

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

    // ---- Rerolling substat values ----
    // Charges up front and parks the offer on the piece; the player then
    // keeps or discards it. Parking it on the piece (rather than in a
    // screen) means a pending offer survives navigating away and back.
    rerollGear(uid) {
      const piece = state.gear[uid];
      if (!piece || !piece.subs || piece.subs.length === 0) return null;
      if (piece.pendingSubs) return null; // decide the open offer first
      const cost = Gear.rerollCost(piece);
      if (state.arcana < cost) return null;
      state.arcana -= cost;
      piece.pendingSubs = Gear.rollSubValues(piece);
      save();
      return { cost, offered: piece.pendingSubs };
    },
    keepReroll(uid) {
      const piece = state.gear[uid];
      if (!piece || !piece.pendingSubs) return false;
      piece.subs = piece.pendingSubs;
      delete piece.pendingSubs;
      save();
      return true;
    },
    discardReroll(uid) {
      const piece = state.gear[uid];
      if (!piece || !piece.pendingSubs) return false;
      delete piece.pendingSubs;
      save();
      return true;
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
    // Locked pieces are protected from bulk salvage and from being
    // pulled off a hero by auto-equip.
    isGearLocked(uid) {
      const piece = state.gear[uid];
      return !!(piece && piece.locked);
    },
    toggleGearLock(uid) {
      const piece = state.gear[uid];
      if (!piece) return false;
      piece.locked = !piece.locked;
      save();
      return piece.locked;
    },

    salvageGear(uid) {
      const piece = state.gear[uid];
      if (!piece) return null;
      if (piece.locked) return null;
      // Salvaging strips the piece off its wearer — not while they fight.
      for (const [heroId, entry] of Object.entries(state.roster)) {
        if (Object.values(entry.equipment || {}).includes(uid) &&
            this.heroGearLocked(heroId)) return null;
      }
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
        .filter((p) => !p.locked)
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

    // Heroes fighting right now can't have their gear changed — their
    // stats were locked in when the battle was built. Checked here so
    // every path (team screen, blacksmith salvage) honors it.
    heroGearLocked(heroId) {
      return typeof App !== 'undefined' && App.heroInBattle
        ? App.heroInBattle(heroId) : false;
    },

    // Equip a piece: pulls it off any other wearer, replaces whatever
    // is in the hero's matching slot.
    equipGear(heroId, uid) {
      const piece = state.gear[uid];
      const entry = state.roster[heroId];
      if (!piece || !entry) return false;
      if (this.heroGearLocked(heroId)) return false;
      // Nor can it be stolen off someone who is fighting.
      for (const [otherId, other] of Object.entries(state.roster)) {
        if (!other.equipment) continue;
        if (Object.values(other.equipment).includes(uid) &&
            this.heroGearLocked(otherId)) return false;
      }
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
    // Fit the best available pieces to a hero, slot by slot. Only
    // considers gear nobody is wearing (plus what this hero already
    // has), never disturbs another hero's loadout, and leaves locked
    // pieces where they are. Returns how many slots changed.
    autoEquip(heroId) {
      const entry = state.roster[heroId];
      const def = typeof HEROES !== 'undefined' ? HEROES[heroId] : null;
      if (!entry || !def || this.heroGearLocked(heroId)) return 0;
      const base = Progression.scaledStats(def, entry.level, entry.stars);
      const free = this.unequippedGear();
      let changed = 0;
      for (const slot of Gear.SLOTS) {
        const wornUid = entry.equipment[slot];
        const worn = wornUid ? state.gear[wornUid] : null;
        if (worn && worn.locked) continue; // locked in place on purpose
        const wornScore = Gear.scoreFor(worn, base);
        let best = null, bestScore = wornScore;
        for (const p of free) {
          if (p.slot !== slot || p.locked) continue;
          const sc = Gear.scoreFor(p, base);
          if (sc > bestScore) { best = p; bestScore = sc; }
        }
        if (!best) continue;
        entry.equipment[slot] = best.uid;
        free.splice(free.indexOf(best), 1);
        if (worn) free.push(worn); // the piece it replaced is free again
        changed++;
      }
      if (changed) save();
      return changed;
    },

    unequipGear(heroId, slot) {
      const entry = state.roster[heroId];
      if (!entry || !entry.equipment) return false;
      if (this.heroGearLocked(heroId)) return false;
      delete entry.equipment[slot];
      save();
      return true;
    },

    // ---- Achievements ----
    achievementClaimed(id) { return !!state.achievements[id]; },
    claimAchievement(id, reward) {
      if (state.achievements[id]) return false;
      state.achievements[id] = true;
      for (const [kind, amount] of Object.entries(reward || {})) {
        if (kind === 'common') state.scrollsCommon += amount;
        else if (kind === 'rare') state.scrollsRare += amount;
        else if (kind === 'temporal') state.scrollsTemporal += amount;
        else if (kind === 'whetstones') state.whetstones += amount;
        else if (kind === 'arcana') state.arcana += amount;
        else if (kind === 'tomes') state.tomes += amount;
      }
      save();
      return true;
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

    // ---- Campaign ----
    // Progress is a flat set of cleared node ids; the graph itself lives
    // in the data, so a chapter can be re-shaped without touching saves.
    campaignCleared(nodeId) { return !!state.campaign.cleared[nodeId]; },
    // Access this save already had before the campaign existed. Opens
    // the gate named; never counts as campaign progress.
    campaignHuntGranted(chapterId) { return !!state.campaign.granted.hunt[chapterId]; },
    campaignBossGranted(chapterId) { return !!state.campaign.granted.boss[chapterId]; },
    recordCampaignClear(nodeId) {
      const isFirst = !state.campaign.cleared[nodeId];
      state.campaign.cleared[nodeId] = true;
      save();
      return isFirst;   // callers pay the one-off bonus on a true
    },
    campaignClearedCount() { return Object.keys(state.campaign.cleared).length; },
    get campaignChapter() { return state.campaign.chapter; },
    setCampaignChapter(chapterId) {
      state.campaign.chapter = chapterId;
      save();
    },
    // Which difficulty the campaign screen last had open. A save from
    // before difficulty existed simply has none, and reads as Normal.
    get campaignTier() { return state.campaign.tier || 'normal'; },
    setCampaignTier(tierId) {
      state.campaign.tier = tierId;
      save();
    },

    // ---- Gacha pity ----
    get pity() { return state.pity; },
    setPity(n) { state.pity = n; save(); },
  };
})();
