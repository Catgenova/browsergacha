// Achievements: the long game.
//
// Quests are repeating counters — win ten battles, salvage ten items —
// which is fine for a daily rhythm but says nothing about mastery. These
// are one-time goals that reward what a collection game is actually
// about: filling out races, pushing bosses, maxing a hero properly.
//
// Each entry: { id, name, detail, tier, progress(state) -> {have, need},
// reward } where reward is applied once when claimed.

const ACHIEVEMENTS = (() => {
  // Achievements count CHARACTERS collected, not heroes standing in the
  // roster: holding three Florences is one Florence for the registry.
  const owned = () => [...new Set(GameState.ownedHeroIds()
    .map((uid) => GameState.defIdOf(uid)))].filter((id) => HEROES[id]);
  // ...but mastery is about individual heroes, so those count uids.
  const heroes = () => GameState.ownedHeroIds().filter((uid) => GameState.defOf(uid));
  const raceCount = (race) => Object.values(HEROES).filter((h) => RACES.of(h) === race).length;
  const ownedOfRace = (race) =>
    owned().filter((id) => RACES.of(HEROES[id]) === race).length;
  const bestStars = () => Math.max(1,
    ...heroes().map((uid) => GameState.progressOf(uid).stars));
  const bestLevel = () => Math.max(1,
    ...heroes().map((uid) => GameState.progressOf(uid).level));
  const maxedSkills = () => heroes().filter((uid) =>
    (GameState.defOf(uid).abilities || []).every((_, i) =>
      GameState.skillLevel(uid, i) >= Progression.MAX_SKILL_LEVEL)).length;
  const bossesCleared = (stage) => Object.values(BOSSES)
    .filter((b) => GameState.bossStageCleared(b.id) >= stage).length;

  const LIST = [];
  const add = (a) => { LIST.push(a); return a; };

  // ---- Collection --------------------------------------------------------
  for (const [race, label] of Object.entries(RACES.NAMES)) {
    const total = raceCount(race);
    if (total === 0) continue;
    add({
      id: `race_${race}`,
      group: 'Collection',
      name: `${label} Registry`,
      detail: `Own every ${label} hero.`,
      progress: () => ({ have: ownedOfRace(race), need: total }),
      reward: { rare: 3 },
    });
  }
  add({
    id: 'collect_50', group: 'Collection', name: 'A Growing Company',
    detail: 'Own 50 heroes.',
    progress: () => ({ have: owned().length, need: 50 }),
    reward: { common: 10 },
  });
  add({
    id: 'collect_150', group: 'Collection', name: 'Full Barracks',
    detail: 'Own 150 heroes.',
    progress: () => ({ have: owned().length, need: 150 }),
    reward: { rare: 5 },
  });
  add({
    id: 'collect_all', group: 'Collection', name: 'The Compendium',
    detail: 'Own every hero in the game.',
    progress: () => ({ have: owned().length, need: Object.keys(HEROES).length }),
    reward: { temporal: 10 },
  });
  add({
    id: 'own_five_star', group: 'Collection', name: 'Rarest of All',
    detail: 'Summon a 5★ hero.',
    progress: () => ({
      have: owned().filter((id) => HEROES[id].rarity === 5).length ? 1 : 0, need: 1 }),
    reward: { rare: 10 },
  });

  add({
    id: 'collect_250', group: 'Collection', name: 'Standing Army',
    detail: 'Own 250 heroes.',
    progress: () => ({ have: owned().length, need: 250 }),
    reward: { temporal: 2 },
  });
  add({
    id: 'own_five_star_10', group: 'Collection', name: 'A Cabinet of Rarities',
    detail: 'Own ten 5-star heroes.',
    progress: () => ({
      have: Math.min(10, owned().filter((id) => HEROES[id].rarity === 5).length),
      need: 10 }),
    reward: { temporal: 3 },
  });
  // One registry per element, so a Dark or Light collection is a goal in
  // its own right -- they only come out of Temporal Scrolls.
  for (const [el, info] of Object.entries(ELEMENTS)) {
    const total = Object.values(HEROES).filter((h) => h.element === el).length;
    if (total === 0) continue;
    add({
      id: `element_${el}`,
      group: 'Collection',
      name: `${info.name} Registry`,
      detail: `Own every ${info.name} hero.`,
      progress: () => ({
        have: owned().filter((id) => HEROES[id].element === el).length, need: total }),
      reward: { rare: 4 },
    });
  }

  // ---- Mastery -----------------------------------------------------------
  add({
    id: 'level_50', group: 'Mastery', name: 'Seasoned',
    detail: 'Raise any hero to level 50.',
    progress: () => ({ have: Math.min(50, bestLevel()), need: 50 }),
    reward: { whetstones: 200 },
  });
  add({
    id: 'stars_7', group: 'Mastery', name: 'Ascendant',
    detail: 'Take a hero to 7★.',
    progress: () => ({ have: Math.min(7, bestStars()), need: 7 }),
    reward: { rare: 5 },
  });
  add({
    id: 'skills_maxed', group: 'Mastery', name: 'Master of the Craft',
    detail: 'Max every skill on a single hero.',
    progress: () => ({ have: Math.min(1, maxedSkills()), need: 1 }),
    reward: { rare: 4 },
  });
  add({
    id: 'skills_maxed_5', group: 'Mastery', name: 'School of Arms',
    detail: 'Max every skill on five heroes.',
    progress: () => ({ have: Math.min(5, maxedSkills()), need: 5 }),
    reward: { temporal: 2 },
  });

  // The level cap is a function of stars, so "capped" means capped for
  // where that hero is now -- a 5-star hero at level 50 counts.
  const atCap = () => heroes().filter((uid) => {
    const p = GameState.progressOf(uid);
    return p.level >= Progression.maxLevel(p.stars);
  }).length;
  add({
    id: 'level_capped', group: 'Mastery', name: 'At the Ceiling',
    detail: 'Take a hero to the level cap for their star rating.',
    progress: () => ({ have: Math.min(1, atCap()), need: 1 }),
    reward: { rare: 5 },
  });
  add({
    id: 'level_capped_7', group: 'Mastery', name: 'A Formation at the Ceiling',
    detail: 'Take seven heroes to their level cap -- a whole formation.',
    progress: () => ({ have: Math.min(7, atCap()), need: 7 }),
    reward: { temporal: 3 },
  });
  add({
    id: 'stars_10', group: 'Mastery', name: 'As Far As It Goes',
    detail: `Take a hero to ${Progression.MAX_STARS}\u2605.`,
    progress: () => ({ have: Math.min(Progression.MAX_STARS, bestStars()),
      need: Progression.MAX_STARS }),
    reward: { temporal: 2 },
  });

  // ---- Conquest ----------------------------------------------------------
  add({
    id: 'boss_all_1', group: 'Conquest', name: 'Nine Crowns',
    detail: 'Clear stage 1 of every boss.',
    progress: () => ({ have: bossesCleared(1), need: Object.keys(BOSSES).length }),
    reward: { arcana: 100 },
  });
  add({
    id: 'boss_all_10', group: 'Conquest', name: 'Kingslayer',
    detail: 'Clear stage 10 of every boss.',
    progress: () => ({ have: bossesCleared(10), need: Object.keys(BOSSES).length }),
    reward: { temporal: 5 },
  });
  add({
    id: 'tower_25', group: 'Conquest', name: 'The Long Climb',
    detail: 'Reach floor 25 of the Endless Tower.',
    progress: () => ({ have: Math.min(25, GameState.towerBest), need: 25 }),
    reward: { rare: 6 },
  });
  add({
    id: 'tower_100', group: 'Conquest', name: 'Above the Clouds',
    detail: 'Reach floor 100 of the Endless Tower.',
    progress: () => ({ have: Math.min(100, GameState.towerBest), need: 100 }),
    reward: { temporal: 10 },
  });
  add({
    id: 'tower_250', group: 'Conquest', name: 'No Roof At All',
    detail: 'Reach floor 250 of the Endless Tower.',
    progress: () => ({ have: Math.min(250, GameState.towerBest), need: 250 }),
    reward: { temporal: 20 },
  });
  add({
    id: 'boss_all_25', group: 'Conquest', name: 'The Ninefold Crown',
    detail: 'Clear stage 25 of every boss.',
    progress: () => ({ have: bossesCleared(25), need: Object.keys(BOSSES).length }),
    reward: { temporal: 10 },
  });

  // ---- Craft -------------------------------------------------------------
  const gear = () => GameState.allGear();
  const bestPlus = () => Math.max(0, ...gear().map((p) => p.plus || 0), 0);
  const rarityCount = (rarity) => gear().filter((p) => p.rarity === rarity).length;
  // A hero wearing all six slots, and one wearing six pieces of one set.
  const fullyGeared = () => heroes().filter((uid) =>
    GameState.equippedPieces(uid).length >= Gear.SLOTS.length).length;
  const fullSet = () => heroes().some((uid) => {
    const worn = GameState.equippedPieces(uid);
    if (worn.length < 6) return false;
    const counts = {};
    for (const p of worn) counts[p.set] = (counts[p.set] || 0) + 1;
    return Object.values(counts).some((n) => n >= 6);
  });

  add({
    id: 'craft_plus_9', group: 'Craft', name: 'Steady Hands',
    detail: 'Enchant a piece of gear to +9.',
    progress: () => ({ have: Math.min(9, bestPlus()), need: 9 }),
    reward: { arcana: 300 },
  });
  add({
    id: 'craft_plus_15', group: 'Craft', name: 'Perfect Temper',
    detail: `Enchant a piece of gear to +${Gear.MAX_PLUS}.`,
    progress: () => ({ have: Math.min(Gear.MAX_PLUS, bestPlus()), need: Gear.MAX_PLUS }),
    reward: { rare: 6 },
  });
  add({
    id: 'craft_legendary', group: 'Craft', name: 'Something Worth Keeping',
    detail: 'Hold a legendary piece of gear.',
    progress: () => ({ have: Math.min(1, rarityCount('legendary')), need: 1 }),
    reward: { arcana: 250 },
  });
  add({
    id: 'craft_kitted', group: 'Craft', name: 'Kitted Out',
    detail: 'Fill all six gear slots on a hero.',
    progress: () => ({ have: Math.min(1, fullyGeared()), need: 1 }),
    reward: { whetstones: 400 },
  });
  add({
    id: 'craft_kitted_7', group: 'Craft', name: 'Seven Ready',
    detail: 'Fill all six gear slots on seven heroes -- a whole formation.',
    progress: () => ({ have: Math.min(7, fullyGeared()), need: 7 }),
    reward: { arcana: 800 },
  });
  add({
    id: 'craft_full_set', group: 'Craft', name: 'Matching Armour',
    detail: 'Wear six pieces of a single set on one hero.',
    progress: () => ({ have: fullSet() ? 1 : 0, need: 1 }),
    reward: { rare: 5 },
  });
  add({
    id: 'craft_salvage_250', group: 'Craft', name: 'Scrapyard',
    detail: 'Salvage 250 items.',
    progress: () => ({ have: Math.min(250, GameState.stat('salvages')), need: 250 }),
    reward: { whetstones: 3000 },
  });
  add({
    id: 'craft_reroll_100', group: 'Craft', name: 'Chasing Substats',
    detail: 'Keep 100 rerolled substat lines.',
    progress: () => ({ have: Math.min(100, GameState.stat('rerolls')), need: 100 }),
    reward: { arcana: 1200 },
  });

  // ---- Campaign ----------------------------------------------------------
  const chaptersBeaten = (tierId) => CAMPAIGN.CHAPTERS
    .filter((ch) => Campaign.chapterProgress(ch, tierId).beaten).length;
  const nodesCleared = (tierId) => CAMPAIGN.CHAPTERS
    .reduce((n, ch) => n + Campaign.chapterProgress(ch, tierId).done, 0);
  const nodesTotal = () => CAMPAIGN.CHAPTERS.reduce((n, ch) => n + ch.nodes.length, 0);

  add({
    id: 'camp_ch1', group: 'Campaign', name: 'Out of the Clearing',
    detail: 'Beat the first chapter.',
    progress: () => ({ have: Math.min(1, chaptersBeaten('normal')), need: 1 }),
    reward: { common: 10 },
  });
  for (const tier of Campaign.TIER_IDS) {
    const label = Campaign.tier(tier).label;
    add({
      id: `camp_all_${tier}`, group: 'Campaign', name: `${label} Cleared`,
      detail: `Beat every chapter on ${label}.`,
      progress: () => ({ have: chaptersBeaten(tier), need: CAMPAIGN.CHAPTERS.length }),
      reward: tier === 'normal' ? { rare: 5 } : { temporal: 3 },
    });
  }
  add({
    id: 'camp_100', group: 'Campaign', name: 'Every Road Walked',
    detail: 'Clear every campaign node on Normal, branches included.',
    progress: () => ({ have: nodesCleared('normal'), need: nodesTotal() }),
    reward: { temporal: 3 },
  });

  // ---- Command -----------------------------------------------------------
  // What the player has actually done, rather than what they own.
  add({
    id: 'cmd_wins_100', group: 'Command', name: 'Blooded',
    detail: 'Win 100 battles.',
    progress: () => ({ have: Math.min(100, GameState.stat('wins')), need: 100 }),
    reward: { common: 10 },
  });
  add({
    id: 'cmd_wins_1000', group: 'Command', name: 'Veteran of a Thousand',
    detail: 'Win 1,000 battles.',
    progress: () => ({ have: Math.min(1000, GameState.stat('wins')), need: 1000 }),
    reward: { temporal: 2 },
  });
  add({
    id: 'cmd_flawless_100', group: 'Command', name: 'Not One Lost',
    detail: 'Win 100 battles without a single hero going down.',
    progress: () => ({ have: Math.min(100, GameState.stat('flawless')), need: 100 }),
    reward: { rare: 8 },
  });
  add({
    id: 'cmd_summons_500', group: 'Command', name: 'The Long Odds',
    detail: 'Summon 500 heroes.',
    progress: () => ({ have: Math.min(500, GameState.stat('summons')), need: 500 }),
    reward: { temporal: 2 },
  });
  add({
    id: 'cmd_starups_50', group: 'Command', name: 'Star Forge',
    detail: 'Star up 50 heroes.',
    progress: () => ({ have: Math.min(50, GameState.stat('starUps')), need: 50 }),
    reward: { rare: 10 },
  });

  function state(a) {
    const { have, need } = a.progress();
    const claimed = GameState.achievementClaimed(a.id);
    return { have: Math.min(have, need), need, done: have >= need, claimed };
  }

  function claimableCount() {
    return LIST.filter((a) => { const s = state(a); return s.done && !s.claimed; }).length;
  }

  const REWARD_LABEL = {
    common: '📜 Common Scroll', rare: '✨ Rare Scroll', temporal: '🌀 Temporal Scroll',
    whetstones: '🪨 Whetstones', arcana: '✦ Arcana',
  };
  function rewardText(reward) {
    return Object.entries(reward)
      .map(([k, v]) => `${v} ${REWARD_LABEL[k] || k}`).join(' · ');
  }

  return { LIST, state, claimableCount, rewardText };
})();
