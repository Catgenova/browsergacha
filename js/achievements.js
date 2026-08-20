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
  const owned = () => GameState.ownedHeroIds().filter((id) => HEROES[id]);
  const raceCount = (race) => Object.values(HEROES).filter((h) => RACES.of(h) === race).length;
  const ownedOfRace = (race) =>
    owned().filter((id) => RACES.of(HEROES[id]) === race).length;
  const bestStars = () => Math.max(1,
    ...owned().map((id) => GameState.progressOf(id).stars));
  const bestLevel = () => Math.max(1,
    ...owned().map((id) => GameState.progressOf(id).level));
  const maxedSkills = () => owned().filter((id) =>
    (HEROES[id].abilities || []).every((_, i) =>
      GameState.skillLevel(id, i) >= Progression.MAX_SKILL_LEVEL)).length;
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
    reward: { tomes: 3 },
  });
  add({
    id: 'skills_maxed_5', group: 'Mastery', name: 'School of Arms',
    detail: 'Max every skill on five heroes.',
    progress: () => ({ have: Math.min(5, maxedSkills()), need: 5 }),
    reward: { tomes: 10 },
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
    reward: { tomes: 5 },
  });
  add({
    id: 'tower_100', group: 'Conquest', name: 'Above the Clouds',
    detail: 'Reach floor 100 of the Endless Tower.',
    progress: () => ({ have: Math.min(100, GameState.towerBest), need: 100 }),
    reward: { temporal: 10 },
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
    whetstones: '🪨 Whetstones', arcana: '✦ Arcana', tomes: '📖 Skill Tomes',
  };
  function rewardText(reward) {
    return Object.entries(reward)
      .map(([k, v]) => `${v} ${REWARD_LABEL[k] || k}`).join(' · ');
  }

  return { LIST, state, claimableCount, rewardText };
})();
