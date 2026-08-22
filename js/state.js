// Persistent player state: summon scrolls, hero roster, saved team,
// gacha pity, gear, and upgrade materials.
// Saved to localStorage; falls back to in-memory if storage is unavailable.

const GameState = (() => {
  const KEY = 'browsergacha_save_v1';

  // Save schema version. Every structural change to the save gets a
  // numbered migration below rather than another ad-hoc patch in
  // load(), so an old save always walks a known path to the present.
  const SCHEMA = 7;

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

  // Schema 7: the roster stopped being a set of heroes with a duplicate
  // COUNTER and became a list of individual heroes. A pull now hands you
  // a whole hero rather than a tally mark, and the duplicates you were
  // holding become real heroes standing in the roster.
  MIGRATIONS.push({
    to: 7,
    what: 'roster entries became individual heroes',
    run(s) {
      const old = s.roster || {};
      const roster = {};
      let uid = 1;
      for (const [heroId, e] of Object.entries(old)) {
        // The hero as they stood, keeping level, stars, gear and skills.
        const kept = String(uid++);
        roster[kept] = {
          heroId,
          level: e.level ?? 1,
          xp: e.xp ?? 0,
          stars: e.stars ?? 1,
          equipment: e.equipment || {},
          skills: e.skills || {},
          favorite: !!e.favorite,
        };
        // Every spare copy becomes a hero of its own, fresh.
        const base = (typeof HEROES !== 'undefined' && HEROES[heroId])
          ? (HEROES[heroId].rarity || 1) : (e.stars ?? 1);
        for (let i = 1; i < (e.copies ?? 1); i++) {
          roster[String(uid++)] = { heroId, level: 1, xp: 0, stars: base,
            equipment: {}, skills: {}, favorite: false };
        }
        // The team pointed at hero ids; it points at the kept hero now.
        for (const [slot, id] of Object.entries(s.team || {})) {
          if (id === heroId) s.team[slot] = kept;
        }
        for (const preset of s.presets || []) {
          for (const [slot, id] of Object.entries(preset.team || {})) {
            if (id === heroId) preset.team[slot] = kept;
          }
        }
      }
      s.roster = roster;
      s.nextHeroUid = uid;
      delete s.tomes; // skill tomes retired with the copy model
    },
  });

  const DEFAULTS = {
    schemaVersion: SCHEMA,               // see MIGRATIONS above
    scrollsCommon: 5,                    // Common Summon Scrolls
    scrollsRare: 1,                      // Rare Summon Scrolls
    scrollsTemporal: 0,                  // Temporal Scrolls (dark/light)
    // uid -> { heroId, level, xp, stars, equipment, skills, favorite }.
    // Keyed by an instance id, not a hero id: the same character can
    // stand in the roster many times over, and each one is its own hero.
    roster: {},
    diamonds: 0,
    rosterCapBonus: 0,   // purchased roster room, in tens
    storageCapBonus: 0,  // purchased vault room, in tens
    storage: {},  // parked heroes: same entries, no gear, out of play
    nextHeroUid: 1,
    team: {},                            // slotIndex (0-6) -> roster uid
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
    starters: {},                        // starter heroes already granted
    // element -> { small, medium, large }: attunement materials, one
    // purse per element (see js/attune.js).
    elements: {},
    attuneStages: {},                    // element -> highest stage cleared
    attuneSettings: { boss: 'fire', stage: 1, repeat: 1 },
    // Material dungeons: floors cleared live in bossStages under the
    // dungeon def's id, so only the picker's choice needs its own slot.
    dungeonSettings: { boss: 'whetstone', stage: 1, repeat: 1 },
    // Daily attempt ledger: each dungeon takes three challenges a day.
    dungeonRuns: { day: '', counts: {} },   // { day: 'YYYY-MM-DD', counts: { bossId: n } }
    nextGearUid: 1,
    whetstones: 0,                       // item-leveling currency
    arcana: 0,                           // enchanting currency
    onboarded: false,                    // has the first-run tour been seen?
    // Autobattle policy: see AI.TACTICS in js/ai.js.
    tactics: { target: 'lowest', skills: 'burst', support: 'hurt' },
    // Lifetime totals, bumped alongside the per-period quest counters.
    // Quests reset; achievements need a number that never does.
    stats: {},
  };

  // The most heroes the roster will hold. Star-ups and skill-ups eat
  // heroes, so the cap is what makes those sinks matter. The storage
  // vault holds the overflow: heroes parked there are out of play (no
  // team, no sacrifices) and go in stripped of gear.
  const MAX_ROSTER = 100;  // base -- Diamonds expand it in tens
  const MAX_STORAGE = 100; // base -- likewise
  // The Diamond economy: quests pay Diamonds, and Diamonds buy room and
  // scrolls. Caps are hard ceilings on the expansions.
  const CAP_STEP = 10;
  const ROSTER_CAP_MAX = 500;
  const STORAGE_CAP_MAX = 3000;
  const ROSTER_STEP_COST = 300;
  const STORAGE_STEP_COST = 100;
  const RARE_PACK_COST = 1000;
  const RARE_PACK_COUNT = 10;
  const TEMPORAL_COST = 500;

  function freshEntry(heroId) {
    const def = typeof HEROES !== 'undefined' ? HEROES[heroId] : null;
    return {
      heroId,
      level: 1, xp: 0,
      stars: def ? def.rarity : 1,
      attune: 0,     // elemental attunements, capped by the star rating
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
    let fresh = false;   // no save on disk: a genuinely new player
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
        // A save that came off disk belongs to somebody who has already
        // worked the game out. The first-run tour is for first runs.
        if (parsed.onboarded === undefined) loaded.onboarded = true;
      } else {
        loaded = structuredClone(DEFAULTS);
        fresh = true;
      }
    } catch (e) { /* storage unavailable or corrupt: start fresh */
      loaded = structuredClone(DEFAULTS);
      from = SCHEMA;
    }
    // Walk the save up to the current schema FIRST. Everything below
    // reads the roster as a list of heroes, which is only true once
    // migration 7 has turned the copy counters into real ones.
    migrate(loaded, from);

    if (!loaded.nextHeroUid) {
      loaded.nextHeroUid = Object.keys(loaded.roster || {}).length + 1;
    }
    // The starters are granted once each, by character rather than by
    // instance: a player who has fed their Florence to a star-up does not
    // get handed another one on the next load.
    if (!loaded.starters) loaded.starters = {};
    const has = (heroId) =>
      Object.values(loaded.roster || {}).some((e) => e && e.heroId === heroId);
    let firstStarter = null;
    for (const id of STARTERS) {
      if (loaded.starters[id]) continue;
      if (!has(id)) {
        const uid = String(loaded.nextHeroUid++);
        loaded.roster[uid] = freshEntry(id);
        if (!firstStarter) firstStarter = uid;
      }
      loaded.starters[id] = true;
    }
    // A brand-new player gets one hero already on the board, the way the
    // old default team did. Only on a genuinely new save: re-placing a
    // hero every load would fight anyone who cleared their team on purpose.
    if (fresh && firstStarter && !Object.keys(loaded.team).length) {
      loaded.team[1] = firstStarter;
    }
    // Scrub heroes that no longer exist (removed characters) from saves.
    if (typeof HEROES !== 'undefined') {
      for (const [uid, entry] of Object.entries(loaded.roster)) {
        if (!entry || !HEROES[entry.heroId]) delete loaded.roster[uid];
      }
      // Invariant, not a migration: promoting a character later must
      // still lift heroes already in the roster.
      for (const entry of Object.values(loaded.roster)) {
        const base = HEROES[entry.heroId].rarity || 1;
        if (entry.stars !== undefined && entry.stars < base) entry.stars = base;
      }
      for (const [slot, uid] of Object.entries(loaded.team)) {
        if (!loaded.roster[uid]) delete loaded.team[slot];
      }
    }

    // Shape guards: fields a save must have regardless of its age.
    // These are invariants, not migrations — a BRAND NEW save stamps the
    // current schema and therefore runs no migrations at all, so the
    // defaults have to be completed here or heroes load without a level.
    for (const entry of Object.values(loaded.roster || {})) {
      if (!entry) continue;
      delete entry.copies; // the copy counter is gone; heroes are real now
      if (entry.level === undefined) entry.level = 1;
      if (entry.xp === undefined) entry.xp = 0;
      if (entry.stars === undefined) entry.stars = freshEntry(entry.heroId).stars;
      if (!entry.equipment) entry.equipment = {};
      if (!entry.skills) entry.skills = {};
      if (entry.favorite === undefined) entry.favorite = false;
      if (entry.attune === undefined) entry.attune = 0;
    }
    if (!loaded.storage) loaded.storage = {};
    if (!loaded.diamonds) loaded.diamonds = 0;
    if (!loaded.rosterCapBonus) loaded.rosterCapBonus = 0;
    if (!loaded.storageCapBonus) loaded.storageCapBonus = 0;
    if (!loaded.elements) loaded.elements = {};
    if (!loaded.attuneStages) loaded.attuneStages = {};
    if (!loaded.attuneSettings) {
      loaded.attuneSettings = { boss: 'fire', stage: 1, repeat: 1 };
    }
    if (!loaded.attuneSettings.boss) loaded.attuneSettings.boss = 'fire';
    for (const entry of Object.values(loaded.roster || {})) {
      if (entry && entry.attune === undefined) entry.attune = 0;
    }
    if (!loaded.gear) loaded.gear = {};
    if (!loaded.nextGearUid) loaded.nextGearUid = 1;
    if (!loaded.whetstones) loaded.whetstones = 0;
    if (!loaded.arcana) loaded.arcana = 0;
    if (loaded.onboarded === undefined) loaded.onboarded = false;
    if (!loaded.tactics) loaded.tactics = { target: 'lowest', skills: 'burst', support: 'hurt' };
    if (!loaded.tactics.target) loaded.tactics.target = 'lowest';
    if (!loaded.tactics.skills) loaded.tactics.skills = 'burst';
    if (!loaded.tactics.support) loaded.tactics.support = 'hurt';
    if (!loaded.stats) loaded.stats = {};
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
    if (!loaded.dungeonSettings) loaded.dungeonSettings = { boss: 'whetstone', stage: 1, repeat: 1 };
    if (!loaded.dungeonSettings.boss) loaded.dungeonSettings.boss = 'whetstone';
    if (!loaded.dungeonRuns) loaded.dungeonRuns = { day: '', counts: {} };
    if (!loaded.dungeonRuns.counts) loaded.dungeonRuns.counts = {};

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

    // ---- First-run tour ----
    get onboarded() { return !!state.onboarded; },
    setOnboarded(v) { state.onboarded = !!v; save(); },

    // ---- Autobattle tactics ----
    get tactics() { return state.tactics; },
    setTactic(key, value) {
      if (!state.tactics) state.tactics = {};
      state.tactics[key] = value;
      save();
    },

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
    // Every pull is a whole hero, not a tally mark against one you
    // already have. Returns { uid, heroId } or null when the roster is
    // full -- summoning refuses rather than dropping heroes on the floor.
    get MAX_ROSTER() {
      return Math.min(ROSTER_CAP_MAX, MAX_ROSTER + (state.rosterCapBonus || 0));
    },
    rosterCount() { return Object.keys(state.roster).length; },
    rosterFull() { return this.rosterCount() >= this.MAX_ROSTER; },
    rosterSpace() { return Math.max(0, this.MAX_ROSTER - this.rosterCount()); },

    // ---- Hero storage ----
    // A vault beside the roster. Depositing strips the hero's gear back
    // into the inventory (the vault stores heroes, not kits) and takes
    // them out of play until withdrawn; withdrawing needs roster room.
    get MAX_STORAGE() {
      return Math.min(STORAGE_CAP_MAX, MAX_STORAGE + (state.storageCapBonus || 0));
    },
    storageCount() { return Object.keys(state.storage).length; },
    storageFull() { return this.storageCount() >= this.MAX_STORAGE; },
    storedHeroIds() { return Object.keys(state.storage); },
    storedEntry(uid) {
      const e = state.storage[uid];
      return e ? { ...e } : null;
    },
    deposit(uid) {
      const e = state.roster[uid];
      if (!e || this.storageFull()) return null;
      if (this.teamSlotOf(uid) !== null) return null; // fielded heroes stay
      let gearFreed = 0;
      for (const slot of Object.keys(e.equipment || {})) {
        this.unequipGear(uid, slot);
        gearFreed++;
      }
      state.storage[uid] = e;
      delete state.roster[uid];
      save();
      return { uid, gearFreed };
    },
    withdraw(uid) {
      const e = state.storage[uid];
      if (!e || this.rosterFull()) return null;
      state.roster[uid] = e;
      delete state.storage[uid];
      save();
      return { uid };
    },

    addHero(heroId) {
      if (this.rosterFull()) return null;
      const uid = String(state.nextHeroUid++);
      state.roster[uid] = freshEntry(heroId);
      save();
      return { uid, heroId, isNew: this.countOf(heroId) === 1 };
    },

    // Roster uids, in the order they were taken in.
    ownedHeroIds() { return Object.keys(state.roster); },
    // The character a roster entry is: `defIdOf` for the id, `defOf` for
    // the definition. Call sites that want art or abilities want these.
    defIdOf(uid) {
      const e = state.roster[uid];
      return e ? e.heroId : null;
    },
    defOf(uid) {
      const id = this.defIdOf(uid);
      return (id && typeof HEROES !== 'undefined' && HEROES[id]) || null;
    },
    // How many of one character stand in the roster.
    countOf(heroId) {
      return Object.values(state.roster).filter((e) => e.heroId === heroId).length;
    },
    // Whether the player has ever had one -- the compendium's question.
    owns(heroId) { return this.countOf(heroId) > 0; },
    // Every roster uid that is this character.
    uidsOf(heroId) {
      return Object.keys(state.roster).filter((uid) => state.roster[uid].heroId === heroId);
    },

    // Favourites float to the top of the roster in every sort order, and
    // are never offered as sacrifice fodder.
    isFavorite(uid) {
      const e = state.roster[uid];
      return !!(e && e.favorite);
    },
    toggleFavorite(uid) {
      const e = state.roster[uid];
      if (!e) return false;
      e.favorite = !e.favorite;
      save();
      return e.favorite;
    },
    favoriteCount() {
      return Object.values(state.roster).filter((e) => e.favorite).length;
    },

    // ---- Progression ----
    // { heroId, level, xp, stars, skills } for a roster hero (null if gone).
    progressOf(uid) {
      const e = state.roster[uid];
      return e
        ? { heroId: e.heroId, level: e.level, xp: e.xp, stars: e.stars,
            attune: e.attune || 0, skills: { ...(e.skills || {}) } }
        : null;
    },

    // Grant XP, chaining level-ups. XP gained at max level is discarded
    // (star up to keep growing). Returns { levelsGained, level }.
    addXp(uid, amount) {
      const e = state.roster[uid];
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

    // ---- Improvement: heroes are the currency ----
    //
    // Star up by sacrificing heroes at the SAME star rating, as many as
    // the rating itself: a 3-star hero costs three 3-star heroes to
    // reach 4. Sacrificing the same CHARACTER additionally raises one of
    // their skills, so a true duplicate is worth more than a stranger of
    // the same rank.

    starUpCost(uid) {
      const e = state.roster[uid];
      return e ? Progression.starUpCost(e.stars) : 0;
    },

    // Can this hero gain a star at all? Only the star cap stands in the
    // way -- level is no longer a gate, and a star up no longer costs the
    // level you had. Starring up raises the level CEILING; what you have
    // already earned stays earned.
    starUpReady(uid) {
      const e = state.roster[uid];
      return !!e && e.stars < Progression.MAX_STARS;
    },

    // ...and whether the roster actually holds the heroes to pay for it.
    // This is what the roster card's arrow means: not "eligible" (nearly
    // everyone is) but "you could do this right now".
    starUpAffordable(uid) {
      const e = state.roster[uid];
      if (!this.starUpReady(uid)) return false;
      const need = Progression.starUpCost(e.stars);
      let found = 0;
      for (const other of Object.keys(state.roster)) {
        if (state.roster[other].stars !== e.stars) continue;
        if (!this.canSacrifice(other, uid)) continue;
        if (++found >= need) return true;
      }
      return false;
    },

    // A hero can be spent if it is not the one being improved, not on
    // the team, and not favourited. Locking the team and favourites is
    // the whole safety net on an action that destroys a hero.
    canSacrifice(uid, targetUid = null) {
      const e = state.roster[uid];
      if (!e || uid === targetUid) return false;
      if (e.favorite) return false;
      return this.teamSlotOf(uid) === null;
    },

    // What is offered when improving `targetUid`: heroes that would
    // actually contribute -- the same character (skill up) or heroes at
    // the target's CURRENT star rating (star-up fodder). Level never
    // matters. Anything that can do neither is left off the list
    // entirely rather than shown greyed out.
    sacrificeOptions(targetUid) {
      const target = state.roster[targetUid];
      if (!target) return [];
      const out = [];
      for (const uid of Object.keys(state.roster)) {
        if (!this.canSacrifice(uid, targetUid)) continue;
        const e = state.roster[uid];
        const skill = e.heroId === target.heroId;
        const star = e.stars === target.stars;
        if (!skill && !star) continue;
        out.push({ uid, heroId: e.heroId, stars: e.stars, level: e.level, skill, star });
      }
      out.sort((a, b) => (b.skill - a.skill) || (b.star - a.star) ||
        (b.stars - a.stars) || (b.level - a.level));
      return out;
    },

    // One-click shelf clearing: churn spare 1-star and 2-star heroes into
    // 3-star heroes. The plan is computed first so the button can say
    // what it will cost before anything dies; execution replays the plan
    // through sacrifice(), which re-checks every hero, so the team and
    // favourites are protected twice over.
    //
    // Recipients are picked protected-first (a hero on the team or
    // favourited cannot be fodder anyway, so starring them is pure
    // gain), then by investment; fodder is same-character first (the
    // sacrifice doubles as a skill up) and least-invested after that.
    planAutoStarUp(target = 3) {
      const model = new Map();
      for (const uid of Object.keys(state.roster)) {
        const e = state.roster[uid];
        model.set(uid, { uid, heroId: e.heroId, stars: e.stars,
          level: e.level, xp: e.xp || 0, locked: !this.canSacrifice(uid) });
      }
      const invested = (h) => h.level * 1e6 + h.xp;
      const steps = [];
      for (let s = 1; s < target; s++) {
        const cost = Progression.starUpCost(s);
        for (;;) {
          const pool = [...model.values()].filter((h) => h.stars === s);
          const recipient = pool
            .sort((a, b) => (b.locked - a.locked) || (invested(b) - invested(a)))[0];
          if (!recipient) break;
          const fodder = pool
            .filter((h) => h !== recipient && !h.locked)
            .sort((a, b) =>
              ((b.heroId === recipient.heroId) - (a.heroId === recipient.heroId)) ||
              (invested(a) - invested(b)))
            .slice(0, cost);
          if (fodder.length < cost) break;
          steps.push({ target: recipient.uid, fodder: fodder.map((h) => h.uid) });
          recipient.stars += 1;
          for (const h of fodder) model.delete(h.uid);
        }
      }
      return steps;
    },
    autoStarUp(target = 3) {
      const totals = { starUps: 0, spent: 0, skills: 0 };
      for (const step of this.planAutoStarUp(target)) {
        const r = this.sacrifice(step.target, step.fodder);
        if (!r) continue;
        totals.spent += r.spent;
        totals.skills += r.skills.length;
        if (r.starred) totals.starUps++;
      }
      return totals;
    },

    // Raise one random skill that is not already maxed. Returns the
    // ability index raised, or null when every skill is at the cap.
    raiseRandomSkill(uid) {
      const e = state.roster[uid];
      const def = this.defOf(uid);
      if (!e || !def) return null;
      const open = (def.abilities || [])
        .map((_, i) => i)
        .filter((i) => this.skillLevel(uid, i) < Progression.MAX_SKILL_LEVEL);
      if (!open.length) return null;
      const idx = open[Math.floor(Math.random() * open.length)];
      if (!e.skills) e.skills = {};
      e.skills[idx] = this.skillLevel(uid, idx) + 1;
      return idx;
    },

    // Spend a set of heroes on one. Returns a report of what it bought.
    sacrifice(targetUid, fodderUids) {
      const target = state.roster[targetUid];
      if (!target || !fodderUids || !fodderUids.length) return null;
      const spend = fodderUids.filter((uid) => this.canSacrifice(uid, targetUid));
      if (!spend.length) return null;

      const need = Progression.starUpCost(target.stars);
      const atRank = spend.filter((uid) => state.roster[uid].stars === target.stars);
      const willStar = this.starUpReady(targetUid) && atRank.length >= need;

      const report = { spent: 0, skills: [], starred: false,
        from: target.stars, to: target.stars, gearFreed: 0 };
      for (const uid of spend) {
        const e = state.roster[uid];
        // Their gear goes back to the inventory rather than down with
        // them -- the hero is the cost, not the kit they were wearing.
        for (const slot of Object.keys(e.equipment || {})) {
          this.unequipGear(uid, slot);
          report.gearFreed++;
        }
        if (e.heroId === target.heroId) {
          const idx = this.raiseRandomSkill(targetUid);
          if (idx !== null) report.skills.push(idx);
        }
        delete state.roster[uid];
        report.spent++;
        this.questBumpQuiet('sacrifices');
      }
      if (willStar) {
        // The level survives: a star up lifts the ceiling rather than
        // sending the hero back to the bottom of it.
        target.stars++;
        report.starred = true;
        report.to = target.stars;
        this.questBumpQuiet('starUps');
      }
      save();
      return report;
    },

    // ---- Attunement ----
    // One purse per element, filled by that element's boss.
    elementsOf(el) {
      const p = state.elements[el] || {};
      return { small: p.small || 0, medium: p.medium || 0, large: p.large || 0 };
    },
    addElements(el, drops) {
      const p = (state.elements[el] ||= { small: 0, medium: 0, large: 0 });
      for (const size of Attune.SIZES) p[size] = (p[size] || 0) + (drops[size] || 0);
      save();
    },
    attuneStageCleared(el) { return state.attuneStages[el] || 0; },
    recordAttuneClear(el, stage) {
      state.attuneStages[el] = Math.max(state.attuneStages[el] || 0, stage);
      save();
    },
    get attuneSettings() { return { ...state.attuneSettings }; },
    setAttuneSettings(patch) {
      Object.assign(state.attuneSettings, patch);
      save();
    },

    attunementOf(uid) {
      const e = state.roster[uid];
      return e ? (e.attune || 0) : 0;
    },
    // What stands between this hero and one more attunement, or null when
    // it is already as attuned as its stars allow.
    nextAttunement(uid) {
      const e = state.roster[uid];
      const def = this.defOf(uid);
      if (!e || !def) return null;
      const have = e.attune || 0;
      // Capped by the star rating: attunement is the second axis, and a
      // hero has to earn the room for it by starring up first.
      if (have >= Math.min(Attune.MAX, e.stars)) return null;
      const cost = Attune.costFor(have);
      if (!cost) return null;
      const purse = this.elementsOf(def.element);
      return { ...cost, element: def.element, have,
        held: purse[cost.size], can: purse[cost.size] >= cost.n };
    },
    attune(uid) {
      const next = this.nextAttunement(uid);
      if (!next || !next.can) return null;
      state.elements[next.element][next.size] -= next.n;
      state.roster[uid].attune = next.have + 1;
      this.questBumpQuiet('attunements');
      save();
      return { to: next.have + 1, element: next.element, spent: next };
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
      // Presets store roster uids. A hero that has since been spent on a
      // star-up is simply gone, and the rest of the formation still fields.
      for (const [slot, uid] of Object.entries(p.team)) {
        if (state.roster[uid]) team[slot] = uid;
        else missing++;
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
    get diamonds() { return state.diamonds; },
    addDiamonds(n) { state.diamonds += n; save(); },
    spendDiamonds(n) {
      if (state.diamonds < n) return false;
      state.diamonds -= n;
      save();
      return true;
    },
    CAP_STEP, ROSTER_CAP_MAX, STORAGE_CAP_MAX,
    ROSTER_STEP_COST, STORAGE_STEP_COST,
    RARE_PACK_COST, RARE_PACK_COUNT, TEMPORAL_COST,
    // Diamonds buy room: ten roster slots or ten vault slots per step,
    // up to hard ceilings. Returns the new cap, or null (capped/broke).
    expandRoster() {
      if (this.MAX_ROSTER >= ROSTER_CAP_MAX) return null;
      if (!this.spendDiamonds(ROSTER_STEP_COST)) return null;
      state.rosterCapBonus = (state.rosterCapBonus || 0) + CAP_STEP;
      save();
      return this.MAX_ROSTER;
    },
    expandStorage() {
      if (this.MAX_STORAGE >= STORAGE_CAP_MAX) return null;
      if (!this.spendDiamonds(STORAGE_STEP_COST)) return null;
      state.storageCapBonus = (state.storageCapBonus || 0) + CAP_STEP;
      save();
      return this.MAX_STORAGE;
    },
    // ...and scrolls, at fixed exchange rates.
    buyRareScrolls() {
      if (!this.spendDiamonds(RARE_PACK_COST)) return null;
      this.addScrolls('rare', RARE_PACK_COUNT);
      return RARE_PACK_COUNT;
    },
    buyTemporalScroll() {
      if (!this.spendDiamonds(TEMPORAL_COST)) return null;
      this.addScrolls('temporal', 1);
      return 1;
    },
    get whetstones() { return state.whetstones; },
    addWhetstones(n) { state.whetstones += n; save(); },
    get arcana() { return state.arcana; },
    addArcana(n) { state.arcana += n; save(); },

    // ---- Skill leveling ----
    // Skill levels live on the roster entry, keyed by ability index, and
    // are raised only by sacrificing another copy of the same character
    // (see sacrifice()). The Skill Tome currency that used to buy them
    // is gone.
    skillLevel(uid, idx) {
      const e = state.roster[uid];
      return (e && e.skills && e.skills[idx]) || 1;
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
      this.questBump('rerolls'); // saves
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

    // The whole inventory, worn or not.
    allGear() { return Object.values(state.gear); },

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
        else if (kind === 'diamonds') state.diamonds += amount;
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

    // Bump a progress counter on every board, and the lifetime total
    // behind it. Quest boards reset every period; achievements are the
    // long game and need a number that survives the reset.
    questBump(counter, n = 1) {
      if (!state.stats) state.stats = {};
      state.stats[counter] = (state.stats[counter] || 0) + n;
      if (typeof Quests === 'undefined') { save(); return; }
      for (const type of ['daily', 'weekly', 'monthly']) {
        const q = this.questState(type);
        q.counters[counter] = (q.counters[counter] || 0) + n;
      }
      save();
    },

    // Same as questBump without the write; used inside a batch that
    // saves once at the end.
    questBumpQuiet(counter, n = 1) {
      if (!state.stats) state.stats = {};
      state.stats[counter] = (state.stats[counter] || 0) + n;
      if (typeof Quests === 'undefined') return;
      for (const type of ['daily', 'weekly', 'monthly']) {
        const q = this.questState(type);
        q.counters[counter] = (q.counters[counter] || 0) + n;
      }
    },

    // Lifetime total for a counter (0 if it has never been bumped).
    stat(counter) { return (state.stats && state.stats[counter]) || 0; },

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
    // Material dungeons share the boss-stage ledger (keyed by the
    // dungeon def's id); only the picker's choice lives here.
    get dungeonSettings() { return { ...state.dungeonSettings }; },
    setDungeonSettings(patch) {
      Object.assign(state.dungeonSettings, patch);
      save();
    },
    // Three challenges per dungeon per day (a def can name its own limit
    // via runsPerDay — the Glitterhoard takes one), counted the moment a
    // fight starts and reset when the local date rolls over (same day
    // key the daily quests use).
    DUNGEON_RUNS_PER_DAY: 3,
    dungeonRunsPerDay(bossId) {
      const def = typeof DUNGEON_BOSSES !== 'undefined' &&
        Object.values(DUNGEON_BOSSES).find((d) => d.id === bossId);
      return (def && def.runsPerDay) || this.DUNGEON_RUNS_PER_DAY;
    },
    dungeonRunsToday(bossId) {
      if (state.dungeonRuns.day !== Quests.periodKey('daily')) return 0;
      return state.dungeonRuns.counts[bossId] || 0;
    },
    dungeonRunsLeft(bossId) {
      return Math.max(0, this.dungeonRunsPerDay(bossId) - this.dungeonRunsToday(bossId));
    },
    useDungeonRun(bossId) {
      if (this.dungeonRunsLeft(bossId) <= 0) return false;
      const day = Quests.periodKey('daily');
      if (state.dungeonRuns.day !== day) state.dungeonRuns = { day, counts: {} };
      state.dungeonRuns.counts[bossId] = (state.dungeonRuns.counts[bossId] || 0) + 1;
      save();
      return true;
    },

    // ---- Endless Tower ----
    get towerBest() { return state.tower.best; },
    recordTowerClear(floor) {
      state.tower.best = Math.max(state.tower.best, floor);
      this.questBump('towerFloors'); // saves
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
