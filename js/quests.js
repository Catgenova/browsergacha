// Daily, weekly, and monthly quests. Progress counters are bumped by
// gameplay (battle wins, summons, blacksmith work) and tracked per
// period — dailies reset at local midnight, weeklies on Monday,
// monthlies on the 1st. Rewards are claimed on the Quests screen.

const Quests = (() => {
  // Counters are bumped by GameState.questBump, which also keeps a
  // lifetime total behind each one for the achievements to read.
  //
  //   wins          any battle won            huntWins   hunt won
  //   bossWins      boss stage / campaign holder cleared
  //   campaignWins  campaign node cleared     towerFloors tower floor climbed
  //   summons       heroes summoned           starUps    hero starred up
  //   polishes      item levelled             enchants   enchant attempted
  //   salvages      item salvaged             rerolls    substats rerolled
  //   flawless      battle won with nobody down
  const DEFS = {
    daily: [
      { id: 'd_hunts', name: 'Win 5 hunts', counter: 'huntWins', goal: 5,
        reward: { scrollsCommon: 2 } },
      { id: 'd_boss', name: 'Clear a boss stage', counter: 'bossWins', goal: 1,
        reward: { scrollsRare: 1 } },
      { id: 'd_wins', name: 'Win 10 battles', counter: 'wins', goal: 10,
        reward: { whetstones: 150 } },
      { id: 'd_flawless', name: 'Win 3 battles without losing a hero',
        counter: 'flawless', goal: 3, reward: { whetstones: 200 } },
      { id: 'd_campaign', name: 'Clear a campaign node', counter: 'campaignWins',
        goal: 1, reward: { scrollsCommon: 2 } },
      { id: 'd_summon', name: 'Summon a hero', counter: 'summons', goal: 1,
        reward: { arcana: 25 } },
      { id: 'd_polish', name: 'Polish items 5 times', counter: 'polishes', goal: 5,
        reward: { whetstones: 100 } },
      { id: 'd_tower', name: 'Climb 3 tower floors', counter: 'towerFloors', goal: 3,
        reward: { arcana: 40 } },
    ],
    weekly: [
      { id: 'w_wins', name: 'Win 40 battles', counter: 'wins', goal: 40,
        reward: { scrollsRare: 2 } },
      { id: 'w_hunts', name: 'Win 25 hunts', counter: 'huntWins', goal: 25,
        reward: { whetstones: 400 } },
      { id: 'w_boss', name: 'Clear 7 boss stages', counter: 'bossWins', goal: 7,
        reward: { arcana: 150 } },
      { id: 'w_campaign', name: 'Clear 10 campaign nodes', counter: 'campaignWins',
        goal: 10, reward: { scrollsRare: 2 } },
      { id: 'w_flawless', name: 'Win 15 battles without losing a hero',
        counter: 'flawless', goal: 15, reward: { arcana: 200 } },
      { id: 'w_summons', name: 'Summon 10 heroes', counter: 'summons', goal: 10,
        reward: { scrollsCommon: 5 } },
      { id: 'w_salvage', name: 'Salvage 10 items', counter: 'salvages', goal: 10,
        reward: { whetstones: 500 } },
      { id: 'w_tower', name: 'Climb 15 tower floors', counter: 'towerFloors', goal: 15,
        reward: { tomes: 1 } },
      { id: 'w_starup', name: 'Star up 3 heroes', counter: 'starUps', goal: 3,
        reward: { scrollsCommon: 8 } },
    ],
    monthly: [
      { id: 'm_wins', name: 'Win 150 battles', counter: 'wins', goal: 150,
        reward: { scrollsRare: 5 } },
      { id: 'm_hunts', name: 'Win 100 hunts', counter: 'huntWins', goal: 100,
        reward: { scrollsTemporal: 1 } },
      { id: 'm_boss', name: 'Clear 25 boss stages', counter: 'bossWins', goal: 25,
        reward: { scrollsTemporal: 1 } },
      { id: 'm_campaign', name: 'Clear 40 campaign nodes', counter: 'campaignWins',
        goal: 40, reward: { scrollsTemporal: 1 } },
      { id: 'm_flawless', name: 'Win 60 battles without losing a hero',
        counter: 'flawless', goal: 60, reward: { scrollsRare: 4 } },
      { id: 'm_summons', name: 'Summon 30 heroes', counter: 'summons', goal: 30,
        reward: { scrollsRare: 3 } },
      { id: 'm_enchant', name: 'Attempt 50 enchants', counter: 'enchants', goal: 50,
        reward: { arcana: 400 } },
      { id: 'm_salvage', name: 'Salvage 25 items', counter: 'salvages', goal: 25,
        reward: { whetstones: 1500 } },
      { id: 'm_reroll', name: 'Reroll 20 sets of substats', counter: 'rerolls',
        goal: 20, reward: { arcana: 600 } },
      { id: 'm_tower', name: 'Climb 50 tower floors', counter: 'towerFloors', goal: 50,
        reward: { tomes: 5 } },
      { id: 'm_starup', name: 'Star up 10 heroes', counter: 'starUps', goal: 10,
        reward: { scrollsRare: 4 } },
    ],
  };

  // Period keys in local time: daily 'YYYY-MM-DD', weekly the date of
  // that week's Monday prefixed 'w', monthly 'YYYY-MM'.
  function periodKey(type) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    if (type === 'monthly') return `${y}-${m}`;
    if (type === 'weekly') {
      const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      return `w${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    }
    return `${y}-${m}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // Milliseconds until this period rolls over (for the countdown).
  function timeToReset(type) {
    const now = new Date();
    let next;
    if (type === 'monthly') {
      next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    } else if (type === 'weekly') {
      const daysToMonday = 7 - ((now.getDay() + 6) % 7);
      next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToMonday);
    } else {
      next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }
    return next - now;
  }

  function formatCountdown(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h >= 48) return `${Math.floor(h / 24)}d ${h % 24}h`;
    return `${h}h ${m}m`;
  }

  function rewardLabel(reward) {
    const parts = [];
    if (reward.scrollsCommon) parts.push(`${reward.scrollsCommon} 📜`);
    if (reward.scrollsRare) parts.push(`${reward.scrollsRare} ✨`);
    if (reward.scrollsTemporal) parts.push(`${reward.scrollsTemporal} 🌀`);
    if (reward.whetstones) parts.push(`${reward.whetstones} 🪨`);
    if (reward.arcana) parts.push(`${reward.arcana} ✦`);
    if (reward.tomes) parts.push(`${reward.tomes} 📖`);
    return parts.join(' · ');
  }

  // Grant a quest reward into the save.
  function grant(reward) {
    if (reward.scrollsCommon) GameState.addScrolls('common', reward.scrollsCommon);
    if (reward.scrollsRare) GameState.addScrolls('rare', reward.scrollsRare);
    if (reward.scrollsTemporal) GameState.addScrolls('temporal', reward.scrollsTemporal);
    if (reward.whetstones) GameState.addWhetstones(reward.whetstones);
    if (reward.arcana) GameState.addArcana(reward.arcana);
    if (reward.tomes) GameState.addTomes(reward.tomes);
  }

  return { DEFS, periodKey, timeToReset, formatCountdown, rewardLabel, grant };
})();
