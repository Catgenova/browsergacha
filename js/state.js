// Persistent player state: summon scrolls, hero roster, saved team,
// gacha pity, gear, and upgrade materials.
// Saved to localStorage; falls back to in-memory if storage is unavailable.

const GameState = (() => {
  const KEY = 'browsergacha_save_v1';
  // Rolling backup of the healthiest recent save, one key over. Written
  // on load, never overwritten by a save holding fewer heroes than it —
  // so whatever goes wrong, the copy worth restoring survives it.
  // GameState.restoreBackup() (from the console) swaps it back in.
  const BACKUP_KEY = KEY + '_backup';

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
    // heroId -> true, stamped the first time a character is ever
    // obtained and never cleared. The roster tracks heroes you HOLD;
    // this tracks characters you have ever HAD — the compendium and
    // the summon NEW! banner read this, so feeding your only Florence
    // to a star-up doesn't un-discover Florence.
    collected: {},
    diamonds: 0,
    rosterCapBonus: 0,   // purchased roster room, in tens
    storageCapBonus: 0,  // purchased vault room, in tens
    storage: {},  // parked heroes: same entries, no gear, out of play
    // Quarantine for roster entries whose character definition failed
    // to load (mid-deploy script failure, removed character). Entries
    // wait here intact and return to the roster when the def is back.
    limbo: {},
    nextHeroUid: 1,
    team: {},                            // slotIndex (0-6) -> roster uid
    pity: 0,                             // plain rare pulls since last 5★
    // bannerId -> { count, claimed: [heroId] }: the banner pity ledger.
    // `count` is elective pulls toward the next guarantee; `claimed`
    // lists featured heroes already handed over (out of the pity pool
    // for the rest of that banner).
    bannerPity: {},
    // Up to three heroIds drawing at double weight in PLAIN summons.
    wishlist: [],
    // World Rift: this week's best damage score and which milestone
    // marks have already paid out (keyed by score threshold).
    worldRift: { week: '', best: 0, claimed: [] },
    bossStages: {},                      // bossId -> highest stage cleared
    waveSettings: { location: 0, stage: 1, repeat: 1 }, // hunt picker
    bossSettings: { boss: 'dragon', stage: 1, repeat: 1 }, // boss picker
    gear: {},                            // uid -> gear piece
    autoSalvage: 'none',                 // melt drops below this rarity
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
    // Login bonuses. Two SEPARATE daily claims:
    //  - `day`/`cycle`: the one-time First Seven Days hero track (`day`
    //    is the last day ITS claim was taken; cycle 7 = done for good).
    //  - `monthDay`/`monthKey`/`stamps`/`stampedDays`: the monthly
    //    calendar. `stampedDays` lists the day-numbers of the month
    //    actually stamped (claimed or bought back); `stamps` counts them
    //    in claim order, which is what the Nth-stamp reward reads.
    login: { day: '', cycle: 0, monthKey: '', stamps: 0,
      monthDay: '', stampedDays: [] },
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
  // The dumpling counter. Only the middle of the ladder is for sale: a
  // 1-star is what a lucky battle drop pays and is not worth a
  // transaction, and 9- and 10-stars are the top of the Kitchen board,
  // which should not be purchasable.
  //
  // The two ends are fixed (200 for a 4-star, 10,000 for an 8-star); the
  // three between them are chosen so POINTS PER DIAMOND never goes
  // backwards, because a player who buys up a rung should never get less
  // for their money:
  //
  //   4*     500 pts /    200 = 2.50
  //   5*   1,000 pts /    400 = 2.50
  //   6*   5,000 pts /  1,600 = 3.13
  //   7*  10,000 pts /  3,000 = 3.33
  //   8*  50,000 pts / 10,000 = 5.00
  //
  // It is not a smooth curve because the dumpling ladder it prices is
  // not one either -- the point values alternate x5 and x2 -- so the
  // rule held here is monotonicity rather than a constant rate.
  const DUMPLING_PRICES = { 4: 200, 5: 400, 6: 1600, 7: 3000, 8: 10000 };

  function freshEntry(heroId) {
    const def = typeof HEROES !== 'undefined' ? HEROES[heroId] : null;
    return {
      heroId,
      level: 1, xp: 0,
      stars: def ? def.rarity : 1,
      attune: 0,     // elemental attunements, capped by the star rating
      starPoints: 0, // banked toward the next star (see Progression.STAR_POINTS)
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
        // Keep the backup at least this healthy. A wiped or shrunken
        // save (fewer heroes than the backup holds) does NOT overwrite
        // it — that is exactly the save you'd want back.
        try {
          const count = Object.keys(parsed.roster || {}).length;
          const prev = JSON.parse(localStorage.getItem(BACKUP_KEY) || 'null');
          const prevCount = prev ? Object.keys(prev.roster || {}).length : -1;
          if (count >= prevCount) localStorage.setItem(BACKUP_KEY, raw);
        } catch (e) { /* the backup is best-effort */ }
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
    // One copy of a character per formation. Saves from before the rule
    // (or presets applied under it) can carry two copies of the same
    // hero — keep the first slot, drop the rest, on the team and every
    // preset alike.
    const dedupeTeam = (team) => {
      const seenChars = new Set();
      for (const slot of Object.keys(team).sort((a, b) => a - b)) {
        const entry = loaded.roster[team[slot]];
        const heroId = entry && entry.heroId;
        if (!heroId || seenChars.has(heroId)) delete team[slot];
        else seenChars.add(heroId);
      }
    };
    dedupeTeam(loaded.team);
    for (const preset of loaded.presets || []) dedupeTeam(preset.team || {});
    // Heroes whose character has no definition are QUARANTINED, never
    // deleted. "No definition" is weak evidence: a data script that
    // fails to fetch for one page load — mid-deploy, flaky cache —
    // leaves HEROES partially built, and hard-deleting on that once
    // cost a player their entire roster (the wipe was then saved, and
    // permanent). Limbo keeps the entry whole — level, stars, gear,
    // favourite — and hands it straight back on the first load where
    // the definition exists again.
    if (!loaded.limbo) loaded.limbo = {};
    if (typeof HEROES !== 'undefined') {
      for (const [uid, entry] of Object.entries(loaded.limbo)) {
        if (entry && entry.heroId && HEROES[entry.heroId]) {
          if (!loaded.roster[uid]) loaded.roster[uid] = entry;
          delete loaded.limbo[uid];
        }
      }
      for (const [uid, entry] of Object.entries(loaded.roster)) {
        if (!entry) delete loaded.roster[uid];
        else if (!HEROES[entry.heroId]) {
          loaded.limbo[uid] = entry;
          delete loaded.roster[uid];
        }
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
    // A save with a collection but not one hero ANYWHERE — roster,
    // storage or limbo — is the wreck the old delete-on-missing-def
    // scrub left behind; normal play cannot reach it. The entries that
    // held levels and gear are gone for good, but the collection
    // registry survived the wipe: regrant one fresh copy of every
    // character ever collected so the account itself comes back.
    if (typeof HEROES !== 'undefined' &&
        !Object.keys(loaded.roster).length &&
        !Object.keys(loaded.storage || {}).length &&
        !Object.keys(loaded.limbo).length &&
        Object.keys(loaded.collected || {}).length) {
      for (const heroId of Object.keys(loaded.collected)) {
        if (HEROES[heroId]) {
          loaded.roster[String(loaded.nextHeroUid++)] = freshEntry(heroId);
        }
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
      // A save from before star points existed starts the bar empty. It
      // is not back-paid: the heroes those saves already spent bought a
      // star under the old rule and got it.
      if (entry.starPoints === undefined) entry.starPoints = 0;
    }
    if (!loaded.storage) loaded.storage = {};
    // Collection registry invariant: anything currently held has, by
    // definition, been collected. This also seeds the registry for saves
    // predating it — heroes spent before then are gone from history, but
    // everything standing survives.
    if (!loaded.collected) loaded.collected = {};
    for (const entry of Object.values(loaded.roster || {})) {
      if (entry && entry.heroId) loaded.collected[entry.heroId] = true;
    }
    for (const entry of Object.values(loaded.storage || {})) {
      if (entry && entry.heroId) loaded.collected[entry.heroId] = true;
    }
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
    if (!loaded.autoSalvage) loaded.autoSalvage = 'none';
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
    if (!loaded.login) {
      loaded.login = { day: '', cycle: 0, monthKey: '', stamps: 0,
        monthDay: '', stampedDays: [] };
    }
    // Saves from the single-claim era: the one claim covered both, and
    // only the stamp COUNT was kept — synthesize the day list as the
    // first N days of the month.
    if (loaded.login.monthDay === undefined) loaded.login.monthDay = loaded.login.day;
    if (!Array.isArray(loaded.login.stampedDays)) {
      loaded.login.stampedDays = Array.from(
        { length: loaded.login.stamps || 0 }, (_, i) => i + 1);
    }

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

    // The escape hatch for a save that went wrong: swap the rolling
    // backup in as the live save and reboot. Run from the console as
    // GameState.restoreBackup().
    restoreBackup() {
      let raw = null;
      try { raw = localStorage.getItem(BACKUP_KEY); } catch (e) { /* gone */ }
      if (!raw) return false;
      try { localStorage.setItem(KEY, raw); } catch (e) { return false; }
      if (typeof location !== 'undefined' && location.reload) location.reload();
      return true;
    },

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

    // Where a newly-granted hero or dumpling can go: the roster if it has
    // room, otherwise the vault. Only when BOTH are full is there
    // nowhere to put it.
    //
    // Overflowing to storage rather than refusing is the difference
    // between "your summon was cancelled" and "your summon is waiting in
    // the vault". A pull that arrives as a hero should never evaporate
    // because the roster happened to be one slot short.
    intakeShelf() {
      if (!this.rosterFull()) return 'roster';
      if (!this.storageFull()) return 'storage';
      return null;
    },
    intakeSpace() {
      return this.rosterSpace() + Math.max(0, this.MAX_STORAGE - this.storageCount());
    },

    addHero(heroId) {
      const shelf = this.intakeShelf();
      if (!shelf) return null;
      const uid = String(state.nextHeroUid++);
      const entry = freshEntry(heroId);
      // The blessing roll: this COPY may arrive Blessed or Godtouched.
      const blessing = typeof Blessing !== 'undefined' ? Blessing.roll() : null;
      if (blessing) entry.blessing = blessing;
      // Keepers pin themselves: a 5★, a Dark/Light 4★, or any blessed
      // copy arrives favourited — top of the roster, safe from fodder.
      const def = typeof HEROES !== 'undefined' ? HEROES[heroId] : null;
      if (blessing || (def && (def.rarity >= 5 ||
          (def.rarity === 4 && ['light', 'dark'].includes(def.element))))) {
        entry.favorite = true;
      }
      if (shelf === 'storage') state.storage[uid] = entry;
      else state.roster[uid] = entry;
      // NEW! means new to the COLLECTION, not to the current roster: a
      // character once held and since spent is a dupe, not a discovery.
      const isNew = !state.collected[heroId];
      state.collected[heroId] = true;
      save();
      return { uid, heroId, isNew, blessing, stored: shelf === 'storage' };
    },

    // Hand the player a dumpling at `stars`. It goes in through the
    // ordinary roster path so the cap, the save and the listeners behave
    // exactly as they do for a hero -- a dumpling occupies a roster slot,
    // which is the price of it sitting where you can see it.
    addDumpling(stars = 1) {
      const shelf = this.intakeShelf();
      if (!shelf) return null;
      const uid = String(state.nextHeroUid++);
      const s = Math.max(1, Math.min(Progression.MAX_STARS, Math.round(stars)));
      const entry = {
        heroId: 'dumpling',
        level: 1, xp: 0, stars: s,
        attune: 0, starPoints: 0,
        equipment: {}, skills: {}, favorite: false,
      };
      if (shelf === 'storage') state.storage[uid] = entry;
      else state.roster[uid] = entry;
      save();
      return { uid, stars: s, stored: shelf === 'storage' };
    },

    // How many are in hand. Counts the vault as well as the roster,
    // because overflow puts them there and a readout that ignored it
    // would tell a player they own none while a dozen sit in storage.
    dumplingCount() {
      const isDump = (e) => e && e.heroId === 'dumpling';
      return Object.values(state.roster).filter(isDump).length +
        Object.values(state.storage).filter(isDump).length;
    },

    // The permanent collection: characters ever obtained, whether or not
    // a copy still stands in the roster. Compendium/achievement fuel.
    everCollected(heroId) { return !!state.collected[heroId]; },
    collectedDefIds() { return Object.keys(state.collected); },

    // Roster uids, in the order they were taken in.
    ownedHeroIds() { return Object.keys(state.roster); },
    // The character a roster entry is: `defIdOf` for the id, `defOf` for
    // the definition. Call sites that want art or abilities want these.
    //
    // A uid is a uid whichever shelf it is on. `entryOf` finds it on
    // either -- the roster first, then the vault -- so the accessors
    // below can answer "what is this" for something parked in storage.
    // `ownedHeroIds` stays roster-only on purpose: this widens what can
    // be LOOKED UP, not what any screen lists.
    entryOf(uid) {
      return state.roster[uid] || state.storage[uid] || null;
    },
    defIdOf(uid) {
      const e = this.entryOf(uid);
      return e ? e.heroId : null;
    },
    // The one place a CHARACTER ID becomes a definition. Heroes first,
    // then the consumables that also sit in the roster without being
    // heroes (dumplings). Everything that sweeps `Object.values(HEROES)`
    // -- gacha, compendium, balance, the benches, the data tests -- keeps
    // seeing heroes only, which is the point of the split.
    defById(heroId) {
      if (!heroId) return null;
      if (typeof HEROES !== 'undefined' && HEROES[heroId]) return HEROES[heroId];
      if (typeof DUMPLINGS !== 'undefined' && DUMPLINGS[heroId]) return DUMPLINGS[heroId];
      return null;
    },

    // ...and the same lookup from a roster uid.
    defOf(uid) {
      return this.defById(this.defIdOf(uid));
    },

    // Is this roster entry a dumpling (or anything else that is fodder
    // rather than a fighter)?
    isConsumable(uid) {
      const def = this.defOf(uid);
      return !!(def && def.consumable);
    },

    // Points this roster entry is worth when spent, its own def's scale
    // included.
    fodderValue(uid) {
      const e = this.entryOf(uid);
      return e ? Progression.starValue(e.stars, this.defOf(uid)) : 0;
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
      const e = this.entryOf(uid);
      return e
        ? { heroId: e.heroId, level: e.level, xp: e.xp, stars: e.stars,
            attune: e.attune || 0, blessing: e.blessing || null,
            starPoints: e.starPoints || 0,
            skills: { ...(e.skills || {}) } }
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
    // Star up by BANKING points. Every hero spent is worth
    // Progression.starValue(its stars), every rating costs
    // Progression.starUpCost(current) to reach, and the bar fills a
    // little at a time -- so anything can be fed to anything and nothing
    // is ever one body short forever. Overflow rolls into the next bar,
    // and a single generous sacrifice can carry a hero up several
    // ratings at once. Sacrificing the same CHARACTER additionally
    // raises one of their skills, so a true duplicate is still worth
    // more than a stranger.

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
      let bank = e.starPoints || 0;
      const need = Progression.starUpCost(e.stars);
      if (bank >= need) return true;
      for (const other of Object.keys(state.roster).concat(Object.keys(state.storage))) {
        if (!this.canSacrifice(other, uid)) continue;
        bank += this.fodderValue(other);
        if (bank >= need) return true;
      }
      return false;
    },

    // A hero can be spent if it is not the one being improved, not on
    // the team, and not favourited. Locking the team and favourites is
    // the whole safety net on an action that destroys a hero.
    //
    // A CONSUMABLE can also be spent out of the vault, and it has to be.
    // Overflow sends anything summoned past the roster cap to storage,
    // which is right for a hero -- it is out of play until withdrawn --
    // and destroys a dumpling, whose only purpose is to be eaten by a
    // star-up bar. Worse, the roster is fullest exactly when a player is
    // buying dumplings to star up and clear it, so the overflow rule
    // collided head-on with the reason dumplings exist: three 8-star
    // dumplings, 150,000 star-up points, sat in a vault that could not
    // spend them and showed them on no screen that could.
    //
    // A stored hero stays locked. That is a real safety net -- putting
    // something somewhere safe must not put it on the menu -- and a
    // dumpling has nothing to be protected from.
    canSacrifice(uid, targetUid = null) {
      if (uid === targetUid) return false;
      const e = this.entryOf(uid);
      if (!e || e.favorite) return false;
      if (!state.roster[uid] && !this.isConsumable(uid)) return false;
      return this.teamSlotOf(uid) === null;
    },

    // What is offered when improving `targetUid`: everything that can be
    // spent, because under the points rule everything CONTRIBUTES. The
    // old list showed only same-rank heroes and true duplicates, which
    // was right when a 1-star could do nothing for a 3-star and is a lie
    // now that it is worth a point.
    //
    // Cheapest first, duplicates ahead of strangers: the order a player
    // wants is "clear the junk, and take the skill up while you are
    // here". Level breaks the tie so the least-invested copy goes first.
    sacrificeOptions(targetUid) {
      const target = state.roster[targetUid];
      if (!target) return [];
      const out = [];
      // Both shelves. canSacrifice is what decides whether a vault entry
      // is actually offered -- consumables yes, heroes no -- so this
      // does not need to know the rule, only to show it the candidates.
      for (const uid of Object.keys(state.roster).concat(Object.keys(state.storage))) {
        if (!this.canSacrifice(uid, targetUid)) continue;
        const e = this.entryOf(uid);
        out.push({
          uid, heroId: e.heroId, stars: e.stars, level: e.level,
          skill: e.heroId === target.heroId,
          consumable: this.isConsumable(uid),
          // Which shelf it comes off, so the row can say so: spending
          // something out of the vault should not be a silent surprise.
          stored: !state.roster[uid],
          value: this.fodderValue(uid),
        });
      }
      // Duplicates lead, THEN dumplings, then cheapest first.
      //
      // Dumplings were on top for a while, on the reasoning that they
      // exist only to be eaten. But a duplicate is the only fodder that
      // buys something a dumpling cannot -- a skill level -- and it is
      // the one row a player would be sorry to scroll past. A dumpling
      // is never a skill up (the target is never a dumpling, so no
      // dumpling can share its character), so the two keys never fight.
      out.sort((a, b) => (b.skill - a.skill) || (b.consumable - a.consumable) ||
        (a.stars - b.stars) || (a.level - b.level));
      return out;
    },

    // Every hero at or below `maxStars` that can be spent on `targetUid`,
    // minus anything in `already`. The bottom-shelf sweep: a roster fills
    // up with 1- and 2-star strangers nobody will ever field, and ticking
    // them one at a time is the tedium this exists to remove.
    //
    // DUMPLINGS ARE EXCLUDED even when their rating qualifies. A 3-star
    // dumpling is a hundred points a player bought or won on purpose, and
    // a button labelled "sweep the junk" must not eat it by accident --
    // they have their own button, which spends the fewest it can.
    planStarSweep(targetUid, maxStars, already = []) {
      const skip = new Set(already);
      const uids = this.sacrificeOptions(targetUid)
        .filter((o) => !o.consumable && o.stars <= maxStars && !skip.has(o.uid))
        .map((o) => o.uid);
      return { uids, points: uids.reduce((n, u) => n + this.fodderValue(u), 0) };
    },

    // Pick the smallest set of dumplings that finishes `targetUid`'s star
    // bar, ignoring anything in `already` (the fodder the player has
    // ticked by hand). Returns { uids, points, need, short }.
    //
    // Smallest FIRST, not largest: overflow rolls into the next rating so
    // a big dumpling is never wasted, but it is not returned either, and
    // spending a 4-star on a bar a 1-star would have finished is a choice
    // for the player rather than a convenience button.
    //
    // Greedy-ascending alone over-picks, though. Needing 24 with a 1-star
    // (10) and a 4-star (500) in hand it takes the 10, is still short,
    // takes the 500, and has now spent both where the 500 alone would
    // have done. So the greedy pass is followed by a prune from the
    // dearest down, dropping anything the rest already covers.
    planDumplingFill(targetUid, already = []) {
      const e = state.roster[targetUid];
      if (!e) return { uids: [], points: 0, need: 0, short: 0 };
      const skip = new Set(already);
      const picked = already.reduce((n, u) => n + this.fodderValue(u), 0);
      const need = Progression.starUpCost(e.stars) - (e.starPoints || 0) - picked;
      const spare = this.sacrificeOptions(targetUid)
        .filter((o) => o.consumable && !skip.has(o.uid))
        .sort((a, b) => a.value - b.value);
      if (need <= 0) return { uids: [], points: 0, need: 0, short: 0 };

      const take = [];
      let have = 0;
      for (const o of spare) {
        if (have >= need) break;
        take.push(o);
        have += o.value;
      }
      // `take` is ascending, so walking it backwards drops the dearest
      // redundant pick first.
      for (let i = take.length - 1; i >= 0; i--) {
        if (have - take[i].value >= need) {
          have -= take[i].value;
          take.splice(i, 1);
        }
      }
      return { uids: take.map((o) => o.uid), points: have, need,
        short: Math.max(0, need - have) };
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
          level: e.level, xp: e.xp || 0, points: e.starPoints || 0,
          value: this.fodderValue(uid),
          consumable: this.isConsumable(uid),
          locked: !this.canSacrifice(uid) });
      }
      const invested = (h) => h.level * 1e6 + h.xp;
      const steps = [];
      for (let s = 1; s < target; s++) {
        const cost = Progression.starUpCost(s);
        for (;;) {
          const pool = [...model.values()]
            .filter((h) => h.stars === s && !h.consumable);
          const recipient = pool
            .sort((a, b) => (b.locked - a.locked) || (invested(b) - invested(a)))[0];
          if (!recipient) break;
          // Fodder is drawn from the whole model now, not just the
          // recipient's own rank -- points are points. It is capped at
          // heroes NO DEARER than the recipient, though: spending a
          // 4-star to push a 3-star to 4 destroys more than it makes,
          // and an automated button must never do that on its own.
          const bank = recipient.points || 0;
          const fodder = [];
          let have = bank;
          const shelf = [...model.values()]
            // Dumplings are exempt from the "no dearer than the
            // recipient" rule: their rating is a label on a food item,
            // not a claim about power, so a 5-star dumpling is not a
            // 5-star hero being wasted.
            .filter((h) => h !== recipient && !h.locked &&
              (h.consumable || h.stars <= s))
            .sort((a, b) =>
              ((b.heroId === recipient.heroId) - (a.heroId === recipient.heroId)) ||
              (a.value - b.value) || (invested(a) - invested(b)));
          for (const h of shelf) {
            if (have >= cost) break;
            fodder.push(h);
            have += h.value;
          }
          if (have < cost) break;
          steps.push({ target: recipient.uid, fodder: fodder.map((h) => h.uid) });
          // Mirror what sacrifice() will do, so the next pass over this
          // rank plans against the state it is actually going to find.
          recipient.stars += 1;
          recipient.points = have - cost;
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
      // Each ability caps at its own slot's ceiling: laddered skills run
      // 6/7/8 by slot, unswept ones stay on the legacy 5.
      const open = (def.abilities || [])
        .map((_, i) => i)
        .filter((i) => this.skillLevel(uid, i) <
          Progression.skillCap(def.abilities[i], i));
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
      // A dumpling is fodder, never a recipient. Letting one be starred
      // up would let a player pour a roster into a thing whose only
      // purpose is to be poured somewhere else.
      if (this.isConsumable(targetUid)) return null;
      const spend = fodderUids.filter((uid) => this.canSacrifice(uid, targetUid));
      if (!spend.length) return null;

      const report = { spent: 0, skills: [], starred: false, points: 0,
        from: target.stars, to: target.stars, gearFreed: 0 };
      for (const uid of spend) {
        const e = this.entryOf(uid);
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
        // Banked BEFORE the entry goes, and only while there is a rating
        // left to buy: points fed to a hero at the cap would sit in a
        // bar with nothing on the other side of it.
        if (target.stars < Progression.MAX_STARS) {
          report.points += Progression.starValue(e.stars, this.defOf(uid));
        }
        // Off whichever shelf it was standing on.
        delete state.roster[uid];
        delete state.storage[uid];
        report.spent++;
        this.questBumpQuiet('sacrifices');
      }
      target.starPoints = (target.starPoints || 0) + report.points;
      // Cascade: a bank big enough for several ratings buys several. The
      // remainder rolls forward every time, so nothing paid is lost --
      // that rollover is the whole point of a bar over a shopping list.
      while (target.stars < Progression.MAX_STARS &&
             target.starPoints >= Progression.starUpCost(target.stars)) {
        target.starPoints -= Progression.starUpCost(target.stars);
        // The level survives: a star up lifts the ceiling rather than
        // sending the hero back to the bottom of it.
        target.stars++;
        report.starred = true;
        report.to = target.stars;
        this.questBumpQuiet('starUps');
      }
      // At the cap there is no next bar to hold anything.
      if (target.stars >= Progression.MAX_STARS) target.starPoints = 0;
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
      // A dumpling has no skills, no element and no hex, and cannot
      // fight. It is refused HERE rather than hidden from the roster,
      // because the roster is where it lives and the formation is the
      // one thing it cannot do.
      if (this.isConsumable(heroId)) return false;
      // One copy of a CHARACTER on the field: remove the hero from any
      // slot it already occupies, and evict any OTHER copy of the same
      // character — two Tides never stand in one formation.
      const defId = this.defIdOf(heroId);
      for (const [slot, id] of Object.entries(state.team)) {
        if (id === heroId || (defId && this.defIdOf(id) === defId)) {
          delete state.team[slot];
        }
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
    // One number for "how strong is the formation right now": every
    // fielded hero's power, gear included, added up. The fight picker
    // holds it against what it is about to send you into.
    teamPower() {
      if (typeof Progression === 'undefined' || typeof Gear === 'undefined') return 0;
      let total = 0;
      for (const uid of Object.values(state.team)) {
        const def = this.defOf(uid);
        const pr = this.progressOf(uid);
        if (!def || !pr) continue;
        total += Progression.power(Gear.applyToStats(
          Progression.scaledStats(def, pr.level, pr.stars), this.equippedPieces(uid)));
      }
      return total;
    },

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
      // star-up is simply gone, and the rest of the formation still
      // fields. One copy of a character only — a preset saved before
      // the rule cannot smuggle a second Tide back in.
      const seen = new Set();
      for (const [slot, uid] of Object.entries(p.team)) {
        const defId = this.defIdOf(uid);
        if (state.roster[uid] && defId && !seen.has(defId)) {
          team[slot] = uid;
          seen.add(defId);
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
    DUMPLING_PRICES,
    dumplingPrice(stars) { return DUMPLING_PRICES[stars] || null; },
    // Buy one dumpling off the shop counter. Returns the grant receipt
    // (with `stored` when the roster was full and it went to the vault),
    // or null.
    buyDumpling(stars) {
      const price = this.dumplingPrice(stars);
      if (!price) return null;
      // Room is checked BEFORE the diamonds are taken. addDumpling
      // refuses when the roster and vault are both full, and a purchase
      // that charged for a dumpling it then could not hand over would be
      // the worst bug on this screen.
      if (!this.intakeShelf()) return { error: 'no-room' };
      if (!this.spendDiamonds(price)) return null;
      const got = this.addDumpling(stars);
      if (!got) {                      // belt and braces; should not happen
        this.addDiamonds(price);
        return { error: 'no-room' };
      }
      return got;
    },
    get whetstones() { return state.whetstones; },
    // ---- Login bonuses ----
    // Rewards are {hero, common, rare, temporal, whetstones, arcana,
    // diamonds} bags (see Events.LOGIN_WEEK / monthlyLoginReward).
    grantLoginReward(r) {
      if (r.hero) this.addHero(r.hero);
      if (r.common) this.addScrolls('common', r.common);
      if (r.rare) this.addScrolls('rare', r.rare);
      if (r.temporal) this.addScrolls('temporal', r.temporal);
      if (r.whetstones) state.whetstones += r.whetstones;
      if (r.arcana) state.arcana += r.arcana;
      if (r.diamonds) state.diamonds += r.diamonds;
      if (r.elements) {
        this.addElements(r.elements.el, { small: r.elements.small || 0,
          medium: r.elements.medium || 0, large: r.elements.large || 0 });
      }
    },
    // Roll the calendar to the current month, wiping a stale page.
    _loginMonth() {
      const month = Quests.periodKey('monthly');
      if (state.login.monthKey !== month) {
        state.login.monthKey = month;
        state.login.stamps = 0;
        state.login.stampedDays = [];
      }
      return month;
    },

    // The First Seven Days: one hero per login day until all seven.
    firstSevenClaimable() {
      return typeof Events !== 'undefined' &&
        state.login.cycle < Events.LOGIN_WEEK.length &&
        state.login.day !== Quests.periodKey('daily');
    },
    claimFirstSeven() {
      if (!this.firstSevenClaimable()) return null;
      const week = Events.LOGIN_WEEK[state.login.cycle];
      // A hero reward needs a roster slot; refuse rather than vanish it.
      if (week.hero && !this.intakeShelf()) return { error: 'roster-full' };
      const day = state.login.cycle + 1;
      state.login.cycle++;
      this.grantLoginReward(week);
      state.login.day = Quests.periodKey('daily');
      save();
      return { week, day };
    },

    // The monthly calendar: its own daily stamp.
    monthlyClaimable() {
      return state.login.monthDay !== Quests.periodKey('daily');
    },
    claimMonthly() {
      if (!this.monthlyClaimable() || typeof Events === 'undefined') return null;
      this._loginMonth();
      const now = new Date();
      const dayOfMonth = now.getDate();
      state.login.stamps++;
      state.login.stampedDays.push(dayOfMonth);
      // The date's weekday sets the stamp's reward; crossing a login
      // milestone pays its bonus on top.
      const reward = Events.calendarDayReward(
        now.getFullYear(), now.getMonth(), dayOfMonth);
      this.grantLoginReward(reward);
      const milestone = Events.LOGIN_MONTH_MILESTONES[state.login.stamps] || null;
      if (milestone) this.grantLoginReward(milestone);
      state.login.monthDay = Quests.periodKey('daily');
      save();
      return { reward, milestone, stamps: state.login.stamps, dayOfMonth };
    },

    // Either claim still open? (feeds the quest-tab dot)
    loginClaimable() {
      return this.firstSevenClaimable() || this.monthlyClaimable();
    },
    loginInfo() {
      const month = Quests.periodKey('monthly');
      const fresh = state.login.monthKey === month;
      return {
        firstSevenClaimable: this.firstSevenClaimable(),
        monthlyClaimable: this.monthlyClaimable(),
        claimable: this.loginClaimable(),
        cycle: state.login.cycle,
        stamps: fresh ? state.login.stamps : 0,
        stampedDays: fresh ? [...state.login.stampedDays] : [],
      };
    },

    // ---- Calendar catch-up ----
    // Prior days of THIS month that were never stamped. An unclaimed
    // today is not "missed" — it is claimed free, above.
    LOGIN_CATCHUP_COST: 20, // diamonds per missed day
    loginMissedList() {
      const month = Quests.periodKey('monthly');
      const stamped = new Set(
        state.login.monthKey === month ? state.login.stampedDays : []);
      const out = [];
      for (let d = 1; d < new Date().getDate(); d++) {
        if (!stamped.has(d)) out.push(d);
      }
      return out;
    },
    loginMissedDays() { return this.loginMissedList().length; },
    loginCatchUpCost() { return this.loginMissedDays() * this.LOGIN_CATCHUP_COST; },
    // Buy every missed calendar day at once: each one stamps the month
    // and pays its stamp's reward, exactly as if it had been logged.
    // The First Seven Days track is untouched.
    buyLoginCatchUp() {
      if (typeof Events === 'undefined') return null;
      const missedList = this.loginMissedList();
      if (missedList.length === 0) return null;
      const cost = missedList.length * this.LOGIN_CATCHUP_COST;
      if (!this.spendDiamonds(cost)) return { error: 'diamonds', cost, missed: missedList.length };
      this._loginMonth();
      const now = new Date();
      const rewards = [];
      for (const dayOfMonth of missedList) {
        state.login.stamps++;
        state.login.stampedDays.push(dayOfMonth);
        const r = Events.calendarDayReward(
          now.getFullYear(), now.getMonth(), dayOfMonth);
        this.grantLoginReward(r);
        rewards.push({ n: state.login.stamps, label: r.label });
        const milestone = Events.LOGIN_MONTH_MILESTONES[state.login.stamps];
        if (milestone) this.grantLoginReward(milestone);
      }
      save();
      return { bought: missedList.length, cost, stamps: state.login.stamps, rewards };
    },

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

    // ---- Auto-salvage ----
    // A standing rule for incoming loot: anything BELOW this rarity is
    // turned straight into materials as it drops, so the inventory
    // stops filling with grey pieces nobody was ever going to wear.
    // 'none' (the default) keeps everything.
    get autoSalvage() { return state.autoSalvage || 'none'; },
    setAutoSalvage(rarity) {
      const ok = rarity === 'none' || Gear.RARITY_ORDER.includes(rarity);
      state.autoSalvage = ok ? rarity : 'none';
      save();
      return state.autoSalvage;
    },
    autoSalvages(piece) {
      const bar = this.autoSalvage;
      if (!piece || bar === 'none' || typeof Gear === 'undefined') return false;
      const rank = Gear.RARITY_ORDER.indexOf(bar);
      return rank > 0 && Gear.RARITY_ORDER.indexOf(piece.rarity) < rank;
    },

    // Every drop enters the save through here, so the standing rule
    // cannot be routed around. Returns { uid } for a piece that was
    // kept, or { salvaged: { whetstones, arcana } } for one melted on
    // arrival. (It is added and then salvaged rather than skipped, so
    // the yield and the salvage counter follow the ordinary path.)
    grantGear(piece) {
      const uid = this.addGear(piece);
      if (!this.autoSalvages(piece)) return { uid };
      const got = this.salvageGear(uid);
      return got ? { salvaged: got } : { uid };
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
    // What a star up actually BUYS, for the Star Up panel to show
    // before it eats bodies. A star up is irreversible and costs up to
    // nine heroes, so "spend 9 to reach 10 stars" is not enough to
    // decide on -- you want to see the numbers move.
    //
    // Computed down the same path the Team screen DISPLAYS (scaled
    // stats, then gear), so the "after" figure is the figure that will
    // appear there, not a different arithmetic that happens to agree
    // most of the time.
    //
    // Note what is NOT here: skill caps. Progression.skillCap reads the
    // ability's slot and its rung count, never the hero's stars, so a
    // star up does not raise them. Saying otherwise would be the easy
    // lie for this panel to tell.
    starUpPreview(uid) {
      const def = this.defOf(uid);
      const pr = this.progressOf(uid);
      if (!def || !pr) return null;
      if (pr.stars >= Progression.MAX_STARS) return null;
      const worn = this.equippedPieces(uid);
      const at = (stars) => Gear.applyToStats(
        Progression.scaledStats(def, pr.level, stars), worn);
      const now = at(pr.stars);
      const next = at(pr.stars + 1);
      const keys = ['hp', 'atk', 'def'];
      const stats = {};
      for (const k of keys) stats[k] = { now: now[k], next: next[k] };
      return {
        stars: { now: pr.stars, next: pr.stars + 1 },
        stats,
        // Speed is identity through the star curve by design, so it is
        // reported unchanged rather than omitted -- a player looking for
        // it should find it and see that it holds.
        speed: { now: now.speed, next: next.speed },
        power: { now: Progression.power(now), next: Progression.power(next) },
        levelCap: {
          now: Progression.maxLevel(pr.stars),
          next: Progression.maxLevel(pr.stars + 1),
        },
      };
    },

    // Fit the best available pieces to a hero, slot by slot. Only
    // considers gear nobody is wearing (plus what this hero already
    // has), never disturbs another hero's loadout, and leaves locked
    // pieces where they are. Returns how many slots changed.
    autoEquip(heroId) {
      const entry = state.roster[heroId];
      // `heroId` is a roster UID, not a character id. Indexing HEROES
      // with it found nothing, so this returned 0 for every hero and
      // auto-equip has been a silent no-op since the roster became a
      // list of instances -- the button reported "already wearing the
      // best available" over eight empty slots. Resolve it the way the
      // rest of the file does.
      const def = this.defOf(heroId);
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

    // ---- Gear loadouts ----
    // A named snapshot of one hero's eight slots, kept on the hero.
    // Formations have presets; this is the same idea for kit, so
    // re-gearing between a boss team and a hunt team is one click
    // instead of eight. Pieces are remembered by uid: anything since
    // salvaged, or worn by someone who is mid-fight, simply does not
    // come back, and the rest of the loadout still lands.
    MAX_LOADOUTS: 4,
    loadoutsOf(heroId) {
      const entry = state.roster[heroId];
      const book = (entry && entry.loadouts) || {};
      return Object.entries(book).map(([name, slots]) => ({
        name, pieces: Object.keys(slots).length,
      }));
    },
    saveLoadout(heroId, name) {
      const entry = state.roster[heroId];
      if (!entry) return null;
      const clean = String(name || '').trim().slice(0, 24);
      if (!clean) return null;
      if (!entry.loadouts) entry.loadouts = {};
      if (!entry.loadouts[clean] &&
          Object.keys(entry.loadouts).length >= this.MAX_LOADOUTS) return null;
      entry.loadouts[clean] = { ...(entry.equipment || {}) };
      save();
      return clean;
    },
    deleteLoadout(heroId, name) {
      const entry = state.roster[heroId];
      if (!entry || !entry.loadouts || !entry.loadouts[name]) return false;
      delete entry.loadouts[name];
      save();
      return true;
    },
    // Wear a saved loadout. Slots the loadout does not name are left
    // alone rather than stripped — it is a kit to put on, not a rule
    // about what the hero may not wear.
    applyLoadout(heroId, name) {
      const entry = state.roster[heroId];
      const slots = entry && entry.loadouts && entry.loadouts[name];
      if (!slots || this.heroGearLocked(heroId)) return null;
      let equipped = 0, missing = 0;
      for (const uid of Object.values(slots)) {
        if (!state.gear[uid]) { missing++; continue; }
        if (entry.equipment && Object.values(entry.equipment).includes(uid)) {
          equipped++; // already worn: the slot is right where it should be
          continue;
        }
        if (this.equipGear(heroId, uid)) equipped++;
        else missing++;
      }
      save();
      return { equipped, missing };
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

    // Boards that read the LIFETIME totals rather than the period
    // counters: grinding done before a rung was ever visible still
    // counts on these, and they never reset.
    lifetimeBoard(type) { return type === 'journey' || type === 'kitchen'; },

    // Claim a completed quest's reward. Returns the reward or null.
    // The lifetime boards read the totals behind the counters; the timed
    // boards read the period counters that reset with them.
    claimQuest(type, id) {
      const def = (Quests.DEFS[type] || []).find((d) => d.id === id);
      if (!def) return null;
      const q = this.questState(type);
      if (q.claimed[id]) return null;
      const have = this.lifetimeBoard(type)
        ? this.stat(def.counter) : (q.counters[def.counter] || 0);
      if (have < def.goal) return null;
      q.claimed[id] = true;
      Quests.grant(def.reward);
      save();
      return def.reward;
    },

    // Claim every finished quest on one board (or every board, with no
    // argument). Returns what was collected: a count and the merged
    // reward, so the screen can say what just landed in one line.
    claimAllQuests(type = null) {
      if (typeof Quests === 'undefined') return { claimed: 0, reward: {} };
      const types = type ? [type] : ['daily', 'weekly', 'monthly', 'journey', 'kitchen'];
      const total = {};
      let claimed = 0;
      for (const t of types) {
        for (const def of Quests.DEFS[t] || []) {
          const got = this.claimQuest(t, def.id);
          if (!got) continue;
          claimed++;
          for (const [k, v] of Object.entries(got)) {
            // Every other reward is a scalar to be summed. Dumplings are
            // {stars, n}, so they are tallied by star instead -- adding
            // two of those objects together gives "[object Object]".
            if (k === 'dumplings') {
              const by = (total.dumplings ||= {});
              by[v.stars] = (by[v.stars] || 0) + v.n;
            } else {
              total[k] = (total[k] || 0) + v;
            }
          }
        }
      }
      return { claimed, reward: total };
    },

    // Number of completed-but-unclaimed quests across all boards.
    claimableQuestCount() {
      if (typeof Quests === 'undefined') return 0;
      let n = 0;
      for (const type of ['daily', 'weekly', 'monthly', 'journey', 'kitchen']) {
        const q = this.questState(type);
        for (const def of Quests.DEFS[type]) {
          const have = this.lifetimeBoard(type)
            ? this.stat(def.counter) : (q.counters[def.counter] || 0);
          if (!q.claimed[def.id] && have >= def.goal) n++;
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
    // The banner pity ledger, per banner id (see Gacha).
    //
    // Banners now come back around on a rotation, so the ledger is read
    // against a RUN key. The pull counter carries across runs — a week
    // of progress toward the guarantee is never binned — but the list
    // of heroes already handed over belongs to the run it was filled
    // in, so a sect returning weeks later offers its whole featured
    // pool again. A ledger saved before runs existed has no run stamp
    // and is taken at face value.
    bannerPity(bannerId, run = null) {
      const s = (state.bannerPity || {})[bannerId];
      if (!s) return { count: 0, claimed: [], run };
      const stale = run !== null && s.run !== undefined && s.run !== run;
      return { count: s.count || 0,
        claimed: stale ? [] : [...(s.claimed || [])], run };
    },
    setBannerPity(bannerId, s) {
      if (!state.bannerPity) state.bannerPity = {};
      const prev = (state.bannerPity || {})[bannerId] || {};
      state.bannerPity[bannerId] = {
        count: s.count || 0, claimed: [...(s.claimed || [])],
        run: s.run !== undefined && s.run !== null ? s.run : prev.run };
      save();
    },
    // ---- World Rift ----
    // The weekly damage race's ledger. A stale week reads as a blank
    // page; recording rolls it over.
    worldRiftInfo() {
      const week = Events.worldRiftWeekKey();
      const fresh = state.worldRift && state.worldRift.week === week;
      return { week, best: fresh ? state.worldRift.best : 0,
        claimed: fresh ? [...state.worldRift.claimed] : [] };
    },
    recordWorldRift(score) {
      const week = Events.worldRiftWeekKey();
      if (!state.worldRift || state.worldRift.week !== week) {
        state.worldRift = { week, best: 0, claimed: [] };
      }
      score = Math.round(score);
      const prevBest = state.worldRift.best;
      const newBest = score > prevBest;
      if (newBest) state.worldRift.best = score;
      // Milestones pay once per week, the moment the best crosses them.
      const crossed = [];
      for (const m of Events.WORLD_RIFT_MILESTONES) {
        if (state.worldRift.best < m.score) continue;
        if (state.worldRift.claimed.includes(m.score)) continue;
        state.worldRift.claimed.push(m.score);
        const reward = { ...m.reward };
        if (reward.riftElements) {
          this.addElements(Events.worldRiftElement(), { large: reward.riftElements });
          delete reward.riftElements;
        }
        this.grantLoginReward(reward);
        crossed.push(m);
      }
      save();
      return { score, best: state.worldRift.best, prevBest, newBest, crossed };
    },

    // ---- Summon wishlist ----
    // Up to WISHLIST_MAX characters the player is hunting: they draw at
    // double weight inside whatever star band a PLAIN pull rolls (see
    // Gacha.weightedDraw — banner pulls run the banner's tilt instead).
    WISHLIST_MAX: 3,
    wishlist() { return [...(state.wishlist || [])]; },
    isWishlisted(heroId) { return (state.wishlist || []).includes(heroId); },
    toggleWishlist(heroId) {
      if (!state.wishlist) state.wishlist = [];
      const i = state.wishlist.indexOf(heroId);
      if (i >= 0) {
        state.wishlist.splice(i, 1);
        save();
        return { on: false };
      }
      if (state.wishlist.length >= this.WISHLIST_MAX) {
        return { error: 'full', max: this.WISHLIST_MAX };
      }
      state.wishlist.push(heroId);
      save();
      return { on: true };
    },
  };
})();
