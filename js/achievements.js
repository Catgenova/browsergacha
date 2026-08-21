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

  // ---- The long ladders --------------------------------------------------
  // One hundred more lifetime goals, generated as ladders so every
  // counter the game tracks has a full arc from first steps to absurd
  // devotion. Each rung is its own achievement with its own name.
  const ladder = (group, idBase, have, detail, rungs) => {
    for (const r of rungs) {
      add({
        id: `${idBase}_${r.n}`, group, name: r.name,
        detail: detail(r.n),
        progress: () => ({ have: Math.min(r.n, have()), need: r.n }),
        reward: r.reward,
      });
    }
  };
  const stat = (k) => () => GameState.stat(k);
  const fmt = (n) => n.toLocaleString('en-US');

  // Command: what the player has done, at every scale. (58)
  ladder('Command', 'cmd_wins', stat('wins'), (n) => `Win ${fmt(n)} battles.`, [
    { n: 250, name: 'Steel Habit', reward: { whetstones: 500 } },
    { n: 500, name: 'Half a Thousand', reward: { rare: 3 } },
    { n: 2500, name: 'Warpath', reward: { temporal: 3 } },
    { n: 5000, name: 'Living Legend', reward: { temporal: 5 } },
    { n: 10000, name: 'Myth in Motion', reward: { temporal: 10 } },
  ]);
  ladder('Command', 'cmd_hunts', stat('huntWins'), (n) => `Win ${fmt(n)} hunts.`, [
    { n: 100, name: 'Field Day', reward: { whetstones: 400 } },
    { n: 250, name: 'Open Season', reward: { rare: 3 } },
    { n: 500, name: 'Master of the Wilds', reward: { arcana: 600 } },
    { n: 1000, name: 'Apex Predator', reward: { temporal: 3 } },
    { n: 2500, name: 'The Land Provides', reward: { temporal: 6 } },
  ]);
  ladder('Command', 'cmd_boss', stat('bossWins'), (n) => `Clear ${fmt(n)} boss stages.`, [
    { n: 50, name: 'Crownbreaker', reward: { rare: 2 } },
    { n: 100, name: 'Regicide Routine', reward: { arcana: 400 } },
    { n: 250, name: 'Throne After Throne', reward: { rare: 6 } },
    { n: 500, name: 'No King Stands', reward: { temporal: 4 } },
    { n: 1000, name: "Dynasty's End", reward: { temporal: 8 } },
  ]);
  ladder('Command', 'cmd_camp', stat('campaignWins'), (n) => `Clear ${fmt(n)} campaign nodes.`, [
    { n: 100, name: 'Pathfinder', reward: { whetstones: 600 } },
    { n: 250, name: 'Cartographer', reward: { rare: 4 } },
    { n: 500, name: 'Roadmaster', reward: { temporal: 3 } },
    { n: 1000, name: 'World Walker', reward: { temporal: 6 } },
  ]);
  ladder('Command', 'cmd_tower', stat('towerFloors'), (n) => `Climb ${fmt(n)} tower floors in total.`, [
    { n: 100, name: 'Stairborne', reward: { whetstones: 500 } },
    { n: 250, name: 'Skyward', reward: { rare: 3 } },
    { n: 500, name: 'Past the Birds', reward: { arcana: 700 } },
    { n: 1000, name: 'Vertigo Proof', reward: { temporal: 3 } },
    { n: 2500, name: 'Where Air Runs Thin', reward: { temporal: 8 } },
  ]);
  ladder('Command', 'cmd_summons', stat('summons'), (n) => `Summon ${fmt(n)} heroes.`, [
    { n: 50, name: 'Fresh Faces', reward: { common: 5 } },
    { n: 100, name: 'Open Door', reward: { rare: 2 } },
    { n: 250, name: 'Gathering Storm', reward: { rare: 4 } },
    { n: 1000, name: 'Grand Muster', reward: { temporal: 3 } },
    { n: 2500, name: 'Endless Ranks', reward: { temporal: 8 } },
  ]);
  ladder('Command', 'cmd_flawless', stat('flawless'), (n) => `Win ${fmt(n)} battles without losing a hero.`, [
    { n: 25, name: 'Clean Sweep', reward: { whetstones: 300 } },
    { n: 250, name: 'Untouchable', reward: { rare: 6 } },
    { n: 500, name: 'Immaculate Record', reward: { temporal: 3 } },
    { n: 1000, name: 'Perfection as Policy', reward: { temporal: 6 } },
  ]);
  ladder('Command', 'cmd_starups', stat('starUps'), (n) => `Star up ${fmt(n)} heroes.`, [
    { n: 10, name: 'Rising Stars', reward: { common: 6 } },
    { n: 25, name: 'Constellation', reward: { rare: 3 } },
    { n: 100, name: 'Star Factory', reward: { temporal: 2 } },
    { n: 250, name: 'Galaxy Forge', reward: { temporal: 5 } },
  ]);
  ladder('Command', 'cmd_sacrifices', stat('sacrifices'), (n) => `Sacrifice ${fmt(n)} heroes.`, [
    { n: 25, name: 'Necessary Losses', reward: { whetstones: 300 } },
    { n: 100, name: 'The Greater Good', reward: { rare: 3 } },
    { n: 250, name: 'Grim Arithmetic', reward: { arcana: 600 } },
    { n: 500, name: 'Ash and Ascent', reward: { temporal: 3 } },
    { n: 1000, name: 'A Thousand Farewells', reward: { temporal: 6 } },
  ]);
  ladder('Command', 'cmd_polish', stat('polishes'), (n) => `Polish items ${fmt(n)} times.`, [
    { n: 100, name: 'Elbow Grease', reward: { whetstones: 400 } },
    { n: 250, name: 'Mirror Finish', reward: { arcana: 400 } },
    { n: 500, name: 'Grindstone Devotee', reward: { rare: 5 } },
    { n: 1000, name: 'Polished to Ruin', reward: { temporal: 4 } },
  ]);
  ladder('Command', 'cmd_enchant', stat('enchants'), (n) => `Attempt ${fmt(n)} enchants.`, [
    { n: 100, name: 'Dabbling in Sparks', reward: { whetstones: 400 } },
    { n: 250, name: 'Rune Habit', reward: { arcana: 500 } },
    { n: 500, name: "Enchanter's Trance", reward: { rare: 5 } },
    { n: 1000, name: 'Glow Addict', reward: { temporal: 4 } },
  ]);
  ladder('Command', 'craft_salvage', stat('salvages'), (n) => `Salvage ${fmt(n)} items.`, [
    { n: 50, name: 'Waste Not', reward: { whetstones: 300 } },
    { n: 100, name: "Breaker's Yard", reward: { arcana: 300 } },
    { n: 500, name: 'Industrial Recycling', reward: { rare: 6 } },
    { n: 1000, name: 'Nothing Wasted', reward: { temporal: 4 } },
  ]);
  ladder('Command', 'craft_reroll', stat('rerolls'), (n) => `Keep ${fmt(n)} rerolled substat lines.`, [
    { n: 50, name: 'Second Opinions', reward: { arcana: 400 } },
    { n: 250, name: 'Dice Whisperer', reward: { rare: 5 } },
    { n: 500, name: "Fate's Editor", reward: { temporal: 3 } },
    { n: 1000, name: 'Probability Bender', reward: { temporal: 6 } },
  ]);

  ladder('Command', 'cmd_synergy', stat('synergyWins'),
    (n) => `Win ${fmt(n)} battles with a party bonus active.`, [
    { n: 25, name: 'Strength in Numbers', reward: { whetstones: 400 } },
    { n: 100, name: 'Doctrine of the Pack', reward: { rare: 4 } },
    { n: 500, name: 'Nothing Fights Alone', reward: { temporal: 4 } },
  ]);
  ladder('Command', 'cmd_full_synergy', stat('fullSynergyWins'),
    (n) => `Win ${fmt(n)} battles with a 7-strong party bonus.`, [
    { n: 10, name: 'Seven as One', reward: { rare: 3 } },
    { n: 50, name: 'The Unbroken Circle', reward: { rare: 8 } },
    { n: 250, name: 'A Single Will', reward: { temporal: 6 } },
  ]);

  // Collection: shelves upon shelves. (12)
  ladder('Collection', 'collect', () => owned().length, (n) => `Own ${n} different heroes.`, [
    { n: 25, name: 'First Shelf', reward: { common: 5 } },
    { n: 75, name: 'Wing of Portraits', reward: { rare: 3 } },
    { n: 100, name: 'Hundred Hall', reward: { rare: 5 } },
    { n: 200, name: 'Gallery of Legends', reward: { temporal: 3 } },
    { n: 300, name: 'Near Completion', reward: { temporal: 6 } },
  ]);
  const fiveStars = () => owned().filter((id) => HEROES[id].rarity === 5).length;
  ladder('Collection', 'five_star', fiveStars, (n) => `Own ${n} different 5-star heroes.`, [
    { n: 3, name: 'Triple Crown Jewels', reward: { rare: 4 } },
    { n: 5, name: 'Vault of Wonders', reward: { rare: 6 } },
    { n: 20, name: 'Museum Piece', reward: { temporal: 4 } },
    { n: 30, name: 'Myth Collector', reward: { temporal: 8 } },
  ]);
  const fourPlus = () => owned().filter((id) => HEROES[id].rarity >= 4).length;
  ladder('Collection', 'four_plus', fourPlus, (n) => `Own ${n} different heroes of 4 stars or rarer.`, [
    { n: 10, name: 'Silver Shelf', reward: { common: 8 } },
    { n: 25, name: 'Gilded Rows', reward: { rare: 4 } },
    { n: 50, name: 'Prestige Collection', reward: { temporal: 3 } },
  ]);

  // Mastery: depth, not breadth. (14)
  ladder('Mastery', 'at_cap', atCap, (n) => `Take ${n} heroes to their level cap.`, [
    { n: 3, name: 'Three at the Top', reward: { whetstones: 600 } },
    { n: 15, name: 'Fifteen Ceilings', reward: { rare: 6 } },
    { n: 25, name: 'Roof Over Everyone', reward: { temporal: 4 } },
  ]);
  ladder('Mastery', 'skillful', maxedSkills, (n) => `Max every skill on ${n} heroes.`, [
    { n: 10, name: 'Faculty of War', reward: { temporal: 3 } },
    { n: 25, name: "Grandmaster's Row", reward: { temporal: 6 } },
  ]);
  ladder('Mastery', 'best_stars', bestStars, (n) => `Take a hero to ${n}★.`, [
    { n: 4, name: 'Fourth Point', reward: { common: 6 } },
    { n: 6, name: 'Past the Old Limit', reward: { rare: 4 } },
    { n: 8, name: 'Eight-Pointed', reward: { rare: 8 } },
    { n: 9, name: 'One Shy of Legend', reward: { temporal: 3 } },
  ]);
  const bestAttune = () => Math.max(0, ...heroes().map((uid) => GameState.attunementOf(uid)), 0);
  const attunedCount = () => heroes().filter((uid) => GameState.attunementOf(uid) > 0).length;
  const totalAttune = () => heroes().reduce((n, uid) => n + GameState.attunementOf(uid), 0);
  add({
    id: 'attune_first', group: 'Mastery', name: 'First Attunement',
    detail: "Attune a hero to their element once.",
    progress: () => ({ have: Math.min(1, bestAttune()), need: 1 }),
    reward: { whetstones: 300 },
  });
  add({
    id: 'attune_half', group: 'Mastery', name: 'Half Lit',
    detail: 'Take one hero to 5 attunements.',
    progress: () => ({ have: Math.min(5, bestAttune()), need: 5 }),
    reward: { rare: 5 },
  });
  add({
    id: 'attune_full', group: 'Mastery', name: 'Fully Lit',
    detail: `Take one hero to ${Attune.MAX} attunements — every star burning.`,
    progress: () => ({ have: Math.min(Attune.MAX, bestAttune()), need: Attune.MAX }),
    reward: { temporal: 6 },
  });
  add({
    id: 'attune_choir', group: 'Mastery', name: 'Choir of Elements',
    detail: 'Attune 10 different heroes at least once.',
    progress: () => ({ have: Math.min(10, attunedCount()), need: 10 }),
    reward: { rare: 8 },
  });
  add({
    id: 'attune_prismatic', group: 'Mastery', name: 'Prismatic Age',
    detail: 'Hold 50 attunements across the roster.',
    progress: () => ({ have: Math.min(50, totalAttune()), need: 50 }),
    reward: { temporal: 5 },
  });

  // Conquest: further up every ladder the game owns. (10)
  ladder('Conquest', 'boss_all', bossesCleared, (n) => `Clear stage ${n} of every boss.`, [
    { n: 5, name: 'Firm Grip', reward: { arcana: 300 } },
    { n: 15, name: 'Iron Grip', reward: { temporal: 6 } },
    { n: 20, name: 'Total Dominion', reward: { temporal: 8 } },
  ]);
  ladder('Conquest', 'tower', () => GameState.towerBest, (n) => `Reach floor ${n} of the Endless Tower.`, [
    { n: 50, name: 'Fifty Flights', reward: { rare: 4 } },
    { n: 150, name: 'Halfway to Nowhere', reward: { temporal: 4 } },
    { n: 200, name: 'Cloudbreaker', reward: { temporal: 6 } },
    { n: 500, name: "The Top That Isn't", reward: { temporal: 25 } },
  ]);
  const EL_BOSS_KEYS = Object.keys(ELEMENTAL_BOSSES);
  const elBossesCleared = (stage) =>
    EL_BOSS_KEYS.filter((el) => GameState.attuneStageCleared(el) >= stage).length;
  add({
    id: 'elboss_all_1', group: 'Conquest', name: 'Five Storms Weathered',
    detail: 'Clear stage 1 of every elemental boss.',
    progress: () => ({ have: elBossesCleared(1), need: EL_BOSS_KEYS.length }),
    reward: { arcana: 250 },
  });
  add({
    id: 'elboss_all_10', group: 'Conquest', name: 'Elements Bowed',
    detail: 'Clear stage 10 of every elemental boss.',
    progress: () => ({ have: elBossesCleared(10), need: EL_BOSS_KEYS.length }),
    reward: { temporal: 5 },
  });
  add({
    id: 'elboss_all_20', group: 'Conquest', name: 'Primal Silence',
    detail: 'Clear stage 20 of every elemental boss.',
    progress: () => ({ have: elBossesCleared(20), need: EL_BOSS_KEYS.length }),
    reward: { temporal: 12 },
  });

  // Craft: the armoury itself. (6)
  ladder('Craft', 'armoury', () => gear().length, (n) => `Hold ${n} pieces of gear at once.`, [
    { n: 50, name: 'Quartermaster', reward: { whetstones: 400 } },
    { n: 150, name: 'Deep Armoury', reward: { arcana: 500 } },
    { n: 300, name: 'Overflowing Racks', reward: { rare: 6 } },
  ]);
  ladder('Craft', 'legendary', () => rarityCount('legendary'), (n) => `Hold ${n} legendary pieces of gear.`, [
    { n: 5, name: 'Legendary Taste', reward: { arcana: 600 } },
    { n: 10, name: 'Hall of Relics', reward: { temporal: 4 } },
  ]);
  add({
    id: 'craft_plus_12', group: 'Craft', name: 'Twelve Folds',
    detail: 'Enchant a piece of gear to +12.',
    progress: () => ({ have: Math.min(12, bestPlus()), need: 12 }),
    reward: { rare: 4 },
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
