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
  //   salvages      item salvaged
  //   flawless      battle won with nobody down
  //   sacrifices    hero spent on another hero
  const DEFS = {
    daily: [
      { id: 'd_hunts', name: 'Win 5 hunts', counter: 'huntWins', goal: 5,
        reward: { scrollsCommon: 2 } },
      { id: 'd_boss', name: 'Clear a boss stage', counter: 'bossWins', goal: 1,
        reward: { scrollsRare: 1 } },
      { id: 'd_wins', name: 'Win 10 battles', counter: 'wins', goal: 10,
        reward: { diamonds: 50 } },
      { id: 'd_flawless', name: 'Win 3 battles without losing a hero',
        counter: 'flawless', goal: 3, reward: { diamonds: 70 } },
      { id: 'd_campaign', name: 'Clear a campaign node', counter: 'campaignWins',
        goal: 1, reward: { scrollsCommon: 2 } },
      { id: 'd_summon', name: 'Summon a hero', counter: 'summons', goal: 1,
        reward: { diamonds: 30 } },
      { id: 'd_polish', name: 'Polish items 5 times', counter: 'polishes', goal: 5,
        reward: { diamonds: 40 } },
      { id: 'd_tower', name: 'Climb 3 tower floors', counter: 'towerFloors', goal: 3,
        reward: { diamonds: 40 } },
    ],
    weekly: [
      { id: 'w_wins', name: 'Win 40 battles', counter: 'wins', goal: 40,
        reward: { scrollsRare: 2 } },
      { id: 'w_hunts', name: 'Win 25 hunts', counter: 'huntWins', goal: 25,
        reward: { diamonds: 130 } },
      { id: 'w_boss', name: 'Clear 7 boss stages', counter: 'bossWins', goal: 7,
        reward: { diamonds: 150 } },
      { id: 'w_campaign', name: 'Clear 10 campaign nodes', counter: 'campaignWins',
        goal: 10, reward: { scrollsRare: 2 } },
      { id: 'w_flawless', name: 'Win 15 battles without losing a hero',
        counter: 'flawless', goal: 15, reward: { diamonds: 200 } },
      { id: 'w_summons', name: 'Summon 10 heroes', counter: 'summons', goal: 10,
        reward: { scrollsCommon: 5 } },
      { id: 'w_salvage', name: 'Salvage 10 items', counter: 'salvages', goal: 10,
        reward: { diamonds: 170 } },
      { id: 'w_tower', name: 'Climb 15 tower floors', counter: 'towerFloors', goal: 15,
        reward: { diamonds: 250 } },
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
        reward: { diamonds: 400 } },
      { id: 'm_salvage', name: 'Salvage 25 items', counter: 'salvages', goal: 25,
        reward: { diamonds: 500 } },
      { id: 'm_tower', name: 'Climb 50 tower floors', counter: 'towerFloors', goal: 50,
        reward: { scrollsRare: 4 } },
      { id: 'm_starup', name: 'Star up 10 heroes', counter: 'starUps', goal: 10,
        reward: { scrollsRare: 4 } },
    ],
  };

  // ---- The Journey: one thousand quests that never reset ---------------
  // A fourth board beside the timed three. Every lifetime counter the
  // game tracks becomes a chain of escalating milestones — a thousand
  // rungs in all — checked against the lifetime totals (the same
  // numbers the achievements read), so progress earned before a rung
  // was ever visible still counts. Goals grow ~14.5% per tier, rounded
  // to two significant digits; rewards escalate with the tier, with a
  // scroll beat every 5th, a rare beat every 10th, and a Temporal
  // Scroll every 25th.
  (() => {
    const CHAINS = [
      // [counter, phrasing, first goal, tiers]
      ['wins', (g) => `Win ${g} battles`, 15, 77],
      ['huntWins', (g) => `Win ${g} hunts`, 15, 77],
      ['bossWins', (g) => `Clear ${g} boss stages`, 5, 77],
      ['campaignWins', (g) => `Clear ${g} campaign nodes`, 5, 77],
      ['towerFloors', (g) => `Climb ${g} tower floors`, 5, 77],
      ['summons', (g) => `Summon ${g} heroes`, 5, 77],
      ['polishes', (g) => `Polish items ${g} times`, 10, 77],
      ['enchants', (g) => `Attempt ${g} enchants`, 5, 77],
      ['salvages', (g) => `Salvage ${g} items`, 5, 77],
      ['flawless', (g) => `Win ${g} battles without losing a hero`, 5, 77],
      ['starUps', (g) => `Star up ${g} heroes`, 2, 77],
      ['sacrifices', (g) => `Spend ${g} heroes on star-ups`, 3, 77],
      ['attunements', (g) => `Attune heroes ${g} times`, 3, 76],
    ];
    // Two significant digits, so ladders read as 150 / 170 / 200 rather
    // than 149 / 171 / 196.
    const nice = (x) => {
      const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(x)) - 1));
      return Math.round(x / mag) * mag;
    };
    const rewardFor = (tier) => {
      if (tier % 25 === 0) return { scrollsTemporal: Math.ceil(tier / 25) };
      if (tier % 10 === 0) return { scrollsRare: 2 + Math.floor(tier / 10) };
      if (tier % 5 === 0) return { scrollsCommon: 3 + Math.floor(tier / 5) };
      return { diamonds: 40 + tier * 10 };
    };
    const journey = [];
    for (const [counter, phrase, base, tiers] of CHAINS) {
      let prev = 0;
      for (let t = 1; t <= tiers; t++) {
        const goal = Math.max(prev + 1, nice(base * Math.pow(1.145, t - 1)));
        prev = goal;
        journey.push({
          id: `j_${counter}_${t}`, name: phrase(goal.toLocaleString()),
          counter, goal, reward: rewardFor(t), tier: t, tiers,
        });
      }
    }
    DEFS.journey = journey;
  })();

  // ---- The Kitchen: five hundred quests that pay in dumplings --------
  //
  // A fifth board beside the timed three and the Journey. It runs the
  // same lifetime counters against its own ladder, and pays in DUMPLINGS
  // rather than currency -- fodder with a face, worth far more in the
  // star-up bank than a hero of the same rating.
  //
  // The star of the dumpling climbs with the tier rather than the count
  // does: ten 1-star dumplings are a hundred points and ten roster
  // slots, where one 3-star is a hundred points and one slot. Paying in
  // bigger dumplings instead of more of them is what keeps a board this
  // long from burying the player in roster clutter.
  (() => {
    const CHAINS = [
      // [counter, phrasing, first goal, tiers]
      ['wins', (g) => `Win ${g} battles`, 20, 63],
      ['huntWins', (g) => `Win ${g} hunts`, 20, 63],
      ['bossWins', (g) => `Clear ${g} boss stages`, 8, 63],
      ['campaignWins', (g) => `Clear ${g} campaign nodes`, 8, 63],
      ['towerFloors', (g) => `Climb ${g} tower floors`, 8, 63],
      ['starUps', (g) => `Star up ${g} heroes`, 3, 63],
      ['sacrifices', (g) => `Spend ${g} heroes on star-ups`, 5, 63],
      ['flawless', (g) => `Win ${g} battles without losing a hero`, 8, 59],
    ];
    const nice = (x) => {
      const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(x)) - 1));
      return Math.round(x / mag) * mag;
    };
    // Tier 1-8 pays a 1-star, 9-16 a 2-star, and so on to a 10-star at
    // the very top of a chain. Two of them early, one of them later:
    // the count comes DOWN as the rating goes up, so the roster cost of
    // clearing the board stays roughly flat while the payout climbs.
    const payFor = (tier) => {
      const stars = Math.min(10, 1 + Math.floor((tier - 1) / 8));
      return { dumplings: { stars, n: stars <= 2 ? 2 : 1 } };
    };
    const kitchen = [];
    for (const [counter, phrase, base, tiers] of CHAINS) {
      let prev = 0;
      for (let t = 1; t <= tiers; t++) {
        const goal = Math.max(prev + 1, nice(base * Math.pow(1.16, t - 1)));
        prev = goal;
        kitchen.push({
          id: `k_${counter}_${t}`, name: phrase(goal.toLocaleString()),
          counter, goal, reward: payFor(t), tier: t, tiers,
        });
      }
    }
    DEFS.kitchen = kitchen;
  })();

  // Period keys in local time: daily 'YYYY-MM-DD', weekly the date of
  // that week's Monday prefixed 'w', monthly 'YYYY-MM'. The Journey
  // never rolls over — its "period" is a constant.
  function periodKey(type) {
    if (type === 'journey' || type === 'kitchen') return 'forever';
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
    if (reward.diamonds) parts.push(`${reward.diamonds} 💎`);
    if (reward.scrollsCommon) parts.push(`${reward.scrollsCommon} 📜`);
    if (reward.scrollsRare) parts.push(`${reward.scrollsRare} ✨`);
    if (reward.scrollsTemporal) parts.push(`${reward.scrollsTemporal} 🌀`);
    if (reward.whetstones) parts.push(`${reward.whetstones} 🪨`);
    if (reward.arcana) parts.push(`${reward.arcana} ✦`);
    if (reward.dumplings) {
      const { stars, n } = reward.dumplings;
      parts.push(`${n > 1 ? `${n}× ` : ''}${stars}★ 🥟`);
    }
    return parts.join(' · ');
  }

  // Grant a quest reward into the save.
  //
  // Returns a receipt naming the keys it actually understood. A reward
  // key that grant() has never heard of pays nothing and says nothing --
  // the quest still reads as claimed -- so the receipt is what
  // test/data.test.js checks against the reward, rather than watching a
  // purse that a roster-paid reward would never move.
  function grant(reward) {
    const handled = [];
    const take = (key, fn) => { if (reward[key]) { fn(reward[key]); handled.push(key); } };
    take('diamonds', (v) => GameState.addDiamonds(v));
    take('scrollsCommon', (v) => GameState.addScrolls('common', v));
    take('scrollsRare', (v) => GameState.addScrolls('rare', v));
    take('scrollsTemporal', (v) => GameState.addScrolls('temporal', v));
    take('whetstones', (v) => GameState.addWhetstones(v));
    take('arcana', (v) => GameState.addArcana(v));
    // Dumplings are roster entries, so a full roster refuses them. The
    // quest is still claimed -- refusing the claim would strand a
    // finished quest behind a roster the player may never empty -- and
    // the screen says how many actually landed.
    const receipt = { handled };
    take('dumplings', ({ stars, n }) => {
      let made = 0;
      for (let i = 0; i < n; i++) if (GameState.addDumpling(stars)) made++;
      receipt.dumplings = { stars, wanted: n, made };
    });
    return receipt;
  }

  return { DEFS, periodKey, timeToReset, formatCountdown, rewardLabel, grant };
})();
