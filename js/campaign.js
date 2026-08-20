// Campaign rules: what is open, what you fight there, and what it pays.
//
// The one thing this module guarantees is that a campaign node is the
// SAME FIGHT every time you open it. Hunts roll a fresh wave on every
// attempt, which is right for farming and wrong for a fight you are
// meant to lose to and come back for. So every roster here is derived
// from a hash of the node's own id: no stored tables, no Math.random,
// and the enemy you saw on the loss is the enemy you meet on the
// rematch.

const Campaign = (() => {
  // ---- Deterministic randomness -----------------------------------------
  // FNV-1a over the node id, then a small xorshift for the stream. Any
  // stable hash would do; this one is short and has no collisions across
  // the ~100 node ids in play.
  function seedOf(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }
  function rng(seed) {
    let s = seed || 1;
    return () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return s / 0x100000000;
    };
  }

  // ---- Difficulty tiers --------------------------------------------------
  // The same map, run again for more. A tier is deliberately NOT a
  // separate set of chapters: the routes, the line-ups and the story are
  // the content, and a second pass at them is worth more than a second
  // set of them.
  //
  // Enemies are hardened with a stat scale rather than only levels. Level
  // is a blunt lever here — heroes cap at 100, and a wave stops caring
  // about levels long before that — so the levels move a little and the
  // statline does the work.
  const TIERS = [
    { id: 'normal', label: 'Normal', scale: 1, reward: 1, levels: 0,
      blurb: 'The campaign as written.' },
    { id: 'hard', label: 'Hard', scale: 1.6, reward: 2, levels: 5,
      blurb: 'Every fight again, with enemies at 1.6x and double rewards.' },
    { id: 'expert', label: 'Expert', scale: 2.4, reward: 3, levels: 10,
      blurb: 'Every fight again, with enemies at 2.4x and triple rewards.' },
  ];
  const TIER_IDS = TIERS.map((t) => t.id);
  function tier(tierId) {
    return TIERS.find((t) => t.id === tierId) || TIERS[0];
  }
  function tierIndex(tierId) {
    const i = TIER_IDS.indexOf(tierId);
    return i < 0 ? 0 : i;
  }

  // Clears are stored per tier. Normal keeps the bare node id, so every
  // save that predates difficulty reads back exactly as it did — the new
  // tiers simply have no keys yet.
  function clearKey(nodeId, tierId = 'normal') {
    return tierId === 'normal' ? nodeId : `${nodeId}@${tierId}`;
  }

  // ---- Lookups ----------------------------------------------------------
  const byId = new Map();
  const chapterOf = new Map();
  for (const ch of CAMPAIGN.CHAPTERS) {
    for (const n of ch.nodes) { byId.set(n.id, n); chapterOf.set(n.id, ch); }
  }

  // The stat multiplier a chapter's holder fights at (see the note in
  // js/data/campaign.js). Absent means "as defined".
  function holderScale(ch) {
    return typeof ch.holderScale === 'number' ? ch.holderScale : 1;
  }

  function chapter(chapterId) {
    return CAMPAIGN.CHAPTERS.find((c) => c.id === chapterId) || null;
  }
  function node(nodeId) { return byId.get(nodeId) || null; }
  function chapterFor(nodeId) { return chapterOf.get(nodeId) || null; }
  function bossNode(ch) { return ch.nodes.find((n) => n.type === 'boss'); }

  // ---- Difficulty -------------------------------------------------------
  // A level does not mean the same thing to a holder as it does to a
  // wave. A holder is one unit facing a whole formation, so it is worth
  // roughly four levels of wave: measured against the same team, a party
  // that clears Lv-68 waves still walls at a Lv-16 boss. The holders
  // therefore get their own ladder and the waves hang below it, which
  // also keeps a chapter's numbers reading in the right order.
  const CHAPTER_INDEX = new Map(CAMPAIGN.CHAPTERS.map((c, i) => [c.id, i]));
  function holderLevel(index) {
    // ~14 at the Rat King (a full team around Lv 20) up to ~85 at the
    // Dragon (a starred team around Lv 80).
    return 14 + Math.round(index * 8.875);
  }
  function levelFor(nodeObj, tierId = 'normal') {
    const ch = chapterFor(nodeObj.id);
    const top = holderLevel(CHAPTER_INDEX.get(ch.id));
    const bump = tier(tierId).levels;
    if (nodeObj.type === 'boss') return top + bump;
    const span = ch.maxDepth || 1;
    const level = (top - 10) + Math.round((nodeObj.depth / span) * 8);
    return (nodeObj.type === 'elite' ? level + 1 : level) + bump;
  }

  // What a tier multiplies enemy stats by. Holders compound it with the
  // chapter's own tuning so a tier never undoes that work.
  function enemyScale(tierId = 'normal') { return tier(tierId).scale; }
  function holderScaleFor(ch, tierId = 'normal') {
    return holderScale(ch) * enemyScale(tierId);
  }

  // How many enemies a node fields. Wave levels flatten out as a
  // difficulty knob — a mid-game team beats a Lv-100 wave of five — so
  // later chapters bring more bodies rather than only bigger numbers.
  function sizeFor(nodeObj) {
    if (nodeObj.type === 'boss') return 1;
    const ch = chapterFor(nodeObj.id);
    const base = 3 + Math.floor(CHAPTER_INDEX.get(ch.id) / 3); // 3, 4, then 5
    if (nodeObj.type === 'elite') return Math.min(7, base + 3);
    return Math.min(7, base + Math.floor((nodeObj.depth / (ch.maxDepth || 1)) * 2));
  }

  // ---- Encounters -------------------------------------------------------
  // The chapter's own race pool, split by the same role reading the wave
  // builder uses, so campaign fights have the shape hunts do — a line to
  // break, casters behind it — while staying fixed per node.
  function poolFor(ch) {
    const ids = LOCATION_ENEMIES[ch.location] || LOCATION_ENEMIES[0];
    return ids.map((id) => ENEMIES[id]).filter(Boolean);
  }

  // A real formation, for deploy()'s front/centre/back reading. The
  // position of a slot comes from its pixel offset, so this has to be
  // built at the game's own hex size — a unit-sized one collapses the
  // whole ring into "centre".
  function formation() {
    return Hex.buildFormation(TEAM.ENEMY, CONFIG.ENEMY_FORMATION_X,
      CONFIG.FORMATION_Y, CONFIG.HEX_SIZE);
  }

  // A node's line-up: [{ def, slotIndex }], stable for a given node id.
  // `enemies` on the node pins the roster by id when a fight is worth
  // hand-building; otherwise it is drawn from the pool by role.
  // `slots` lets a caller deploy into a live battle's own formation.
  function encounter(nodeObj, slots = null) {
    const ch = chapterFor(nodeObj.id);
    if (nodeObj.type === 'boss') return [];
    const into = slots || formation();
    const pool = poolFor(ch);
    if (nodeObj.enemies) {
      const defs = nodeObj.enemies.map((id) => ENEMIES[id]).filter(Boolean);
      return Waves.deploy(
        defs.map((def) => ({ def, role: Waves.roleOf(def) })), into);
    }
    const rand = rng(seedOf(nodeObj.id));
    const count = sizeFor(nodeObj);
    // Elites are led by the pool's rarest members; ordinary fights draw
    // from the whole cohort.
    const elite = nodeObj.type === 'elite';
    const picked = [];
    if (elite) {
      const rare = pool.filter((d) => (d.rarity || 1) >= 4);
      if (rare.length) picked.push(rare[Math.floor(rand() * rare.length)]);
    }
    const byRole = {};
    for (const def of pool) (byRole[Waves.roleOf(def)] ||= []).push(def);
    const shape = ['tank', 'striker', 'support', 'striker', 'controller', 'tank'];
    for (let i = picked.length; i < count; i++) {
      const want = byRole[shape[i % shape.length]] || pool;
      const free = want.filter((d) => !picked.includes(d));
      const from = free.length ? free : pool.filter((d) => !picked.includes(d));
      if (!from.length) break;
      picked.push(from[Math.floor(rand() * from.length)]);
    }
    return Waves.deploy(
      picked.map((def) => ({ def, role: Waves.roleOf(def) })), into);
  }

  // ---- Unlocking --------------------------------------------------------
  // A chapter opens when the previous chapter's holder is down. A node
  // opens when ANY of its prerequisites is cleared — a fork is a choice
  // of route, not two errands.
  // A tier opens for a chapter when that chapter's holder is down on the
  // tier below — per chapter, not per campaign. Finishing Chapter 1 opens
  // Chapter 1 on Hard immediately, which is the point: the reward for
  // clearing something is a harder version of it, not a promise redeemed
  // eight chapters later.
  function tierUnlocked(ch, tierId = 'normal') {
    const i = tierIndex(tierId);
    if (i === 0) return true;
    const below = TIER_IDS[i - 1];
    return GameState.campaignCleared(clearKey(bossNode(ch).id, below));
  }
  function chapterUnlocked(ch, tierId = 'normal') {
    if (!tierUnlocked(ch, tierId)) return false;
    const i = CAMPAIGN.CHAPTERS.indexOf(ch);
    if (i <= 0) return true;
    // The chapter chain runs inside a tier: Chapter 2 on Hard wants
    // Chapter 1 on Hard, not Chapter 1 on Normal.
    return GameState.campaignCleared(
      clearKey(bossNode(CAMPAIGN.CHAPTERS[i - 1]).id, tierId));
  }
  function nodeUnlocked(nodeObj, tierId = 'normal') {
    const ch = chapterFor(nodeObj.id);
    if (!chapterUnlocked(ch, tierId)) return false;
    if (nodeObj.from.length === 0) return true;
    return nodeObj.from.some((id) =>
      GameState.campaignCleared(clearKey(id, tierId)));
  }
  function nodeCleared(nodeObj, tierId = 'normal') {
    return GameState.campaignCleared(clearKey(nodeObj.id, tierId));
  }

  // The highest tier currently open for a chapter, for the picker.
  function highestTier(ch) {
    let best = TIER_IDS[0];
    for (const t of TIER_IDS) if (tierUnlocked(ch, t)) best = t;
    return best;
  }

  // Chapter progress for the header: cleared / total, holder down or not.
  function chapterProgress(ch, tierId = 'normal') {
    const done = ch.nodes.filter((n) => nodeCleared(n, tierId)).length;
    return { done, total: ch.nodes.length, beaten: nodeCleared(bossNode(ch), tierId) };
  }

  // Where to go after clearing `nodeObj`: follow the road first — a
  // successor of the node just cleared — then fall back to the shallowest
  // fight still open in the chapter, and finally to the next chapter's
  // gate once this one is finished. Null when there is nowhere to go,
  // which is how the banner knows to hide the button.
  function nextMission(nodeObj, tierId = 'normal') {
    const ch = chapterFor(nodeObj.id);
    const shallowest = (list) => list
      .slice()
      .sort((a, b) => a.depth - b.depth || a.id.localeCompare(b.id))[0] || null;
    // A successor of the node just cleared is open by definition, so it
    // is not asked to prove it — that would make the answer depend on
    // whether the clear had already been written down.
    const onward = shallowest(ch.nodes.filter((n) =>
      n.id !== nodeObj.id && !nodeCleared(n, tierId) && n.from.includes(nodeObj.id)));
    if (onward) return onward;
    const elsewhere = shallowest(ch.nodes.filter((n) =>
      n.id !== nodeObj.id && nodeUnlocked(n, tierId) && !nodeCleared(n, tierId)));
    if (elsewhere) return elsewhere;
    const next = CAMPAIGN.CHAPTERS[CAMPAIGN.CHAPTERS.indexOf(ch) + 1];
    if (!next || !chapterUnlocked(next, tierId)) return null;
    return next.nodes.find((n) => n.from.length === 0) || null;
  }

  // The furthest chapter the player can currently enter — where the
  // screen opens by default.
  function currentChapter(tierId = 'normal') {
    let last = CAMPAIGN.CHAPTERS[0];
    for (const ch of CAMPAIGN.CHAPTERS) {
      if (!chapterUnlocked(ch, tierId)) break;
      last = ch;
      if (!chapterProgress(ch, tierId).beaten) break;
    }
    return last;
  }

  // ---- Rewards ----------------------------------------------------------
  // Every clear pays XP and materials scaled to what you fought. The
  // FIRST clear of a node pays a one-off bonus on top — that is the
  // campaign's actual draw, and why farming it is worse than hunting.
  // The base is always read at Normal levels and then multiplied, so a
  // tier pays EXACTLY what it advertises. Scaling off the tier's own
  // higher levels would compound with the multiplier and quietly make
  // Hard 2.6x and Expert 4.8x.
  function payout(nodeObj, tierId = 'normal') {
    const level = levelFor(nodeObj, 'normal');
    const size = sizeFor(nodeObj);
    const weight = nodeObj.type === 'boss' ? 6 : size;
    const mult = tier(tierId).reward;
    return {
      xp: Progression.enemyXp(level) * weight * mult,
      whetstones: (3 + Math.round(level * size * 0.5)) * mult,
      arcana: (1 + Math.floor((level * size) / 40)) * mult,
    };
  }

  // One-off, on the first clear only. Every node in the campaign pays a
  // summon scroll the first time it goes down, graded by what the node
  // asked of you: a skirmish on the road pays a Common, an elite out on
  // a branch pays a Rare, and the chapter holder pays a Temporal — the
  // Dark/Light currency, and the campaign's whole reason to exist.
  //
  // Scrolls only. Gear belongs to the boss ladder, which is farmable for
  // the set you actually want; a one-off piece from a node you can never
  // re-clear is a worse version of that and muddies what the campaign is
  // for.
  // Each tier keeps its own first clear, and pays the tier multiplier:
  // an Expert holder is three Temporal Scrolls, not one.
  function firstClearBonus(nodeObj, tierId = 'normal') {
    const t = tier(tierId);
    const paid = (kind, n) => ({ [kind]: n * t.reward });
    const label = t.id === 'normal' ? '' : ` (${t.label})`;
    if (nodeObj.type === 'boss') {
      return {
        scrolls: paid('temporal', 1),
        // The hunt and boss gates are opened once, by the Normal clear.
        // Re-announcing them on every tier would be noise about nothing.
        unlocks: t.id === 'normal',
        label: `Chapter cleared${label}`,
      };
    }
    if (nodeObj.type === 'elite') {
      return { scrolls: paid('rare', 1), label: `Elite bounty${label}` };
    }
    return { scrolls: paid('common', 1), label: `First clear${label}` };
  }

  // ---- Gating other modes ----------------------------------------------
  // The campaign is the spine: a hunt location and a boss open when that
  // chapter's holder goes down. The first chapter is open from the start
  // so a new save has somewhere to go.
  //
  // A save that predates the campaign keeps the hunts and bosses it had
  // already earned (see the v6 migration). That is access, not progress:
  // it opens these two gates and nothing else, so the chapter still has
  // its story, its map and its first-clear scrolls waiting.
  function locationUnlocked(loc) {
    const ch = CAMPAIGN.CHAPTERS.find((c) => c.location === Number(loc));
    if (!ch) return true;
    return chapterUnlocked(ch) || GameState.campaignHuntGranted(ch.id);
  }
  function bossUnlocked(bossKey) {
    const ch = CAMPAIGN.CHAPTERS.find((c) => c.boss === bossKey);
    if (!ch) return true;
    return chapterProgress(ch).beaten || GameState.campaignBossGranted(ch.id);
  }
  function unlockedLocations() {
    return CAMPAIGN.CHAPTERS
      .filter((c) => chapterUnlocked(c) || GameState.campaignHuntGranted(c.id))
      .map((c) => c.location);
  }

  return {
    TIERS, TIER_IDS, tier, tierIndex, tierUnlocked, highestTier, clearKey,
    enemyScale, holderScaleFor,
    chapter, node, chapterFor, bossNode, levelFor, sizeFor, encounter, holderScale,
    chapterUnlocked, nodeUnlocked, nodeCleared, chapterProgress,
    currentChapter, payout, firstClearBonus, nextMission,
    locationUnlocked, bossUnlocked, unlockedLocations,
  };
})();
