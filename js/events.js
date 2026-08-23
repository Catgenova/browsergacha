// Events: the live calendar. First up — the elemental boss schedule.
//
// Every day of the week doubles ONE element's attunement drops from its
// elemental rift boss; the weekend doubles them all:
//
//   Monday    fire        Friday   dark
//   Tuesday   water       Saturday every element
//   Wednesday wind        Sunday   every element
//   Thursday  light
//
// The schedule reads the player's local clock, same as the daily quest
// rhythm — the day the player sees is the day the event honors.

const Events = (() => {
  // Date.getDay(): 0 Sunday .. 6 Saturday.
  const DAY_ELEMENT = { 1: 'fire', 2: 'water', 3: 'wind', 4: 'light', 5: 'dark' };
  const ALL_ELEMENTS = ['water', 'fire', 'wind', 'dark', 'light'];
  const DROP_MULT = 2;

  function isWeekend(date = new Date()) {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  // Which elements are doubled right now.
  function boostedElements(date = new Date()) {
    if (isWeekend(date)) return [...ALL_ELEMENTS];
    return [DAY_ELEMENT[date.getDay()]];
  }

  // The multiplier this element's rift drops earn today (1 or 2).
  function elementBoost(element, date = new Date()) {
    return boostedElements(date).includes(element) ? DROP_MULT : 1;
  }

  // One line for pickers and banners.
  function scheduleLabel(date = new Date()) {
    if (isWeekend(date)) {
      return `Weekend event: ${DROP_MULT}× drops from EVERY elemental rift!`;
    }
    const el = DAY_ELEMENT[date.getDay()];
    const info = typeof Elements !== 'undefined' ? Elements.info(el) : null;
    const name = info ? info.name : el;
    return `Today's event: ${DROP_MULT}× ${name} drops from the ${name} rift!`;
  }

  // ---- Summon banners ----
  // A rotating rate-up: while a banner runs, its sect's heroes draw at
  // `mult` weight WITHIN whatever star band a pull rolls — the band
  // rates themselves never move, only the contest inside the band.
  //
  // `from`/`until` are [year, monthIndex, day] local midnights; `until`
  // is exclusive — the day the next banner takes over.
  // `scroll` is the scroll kind a banner pull spends: the banner is an
  // ELECTIVE summon — pull on it and the sect draws at 2× weight inside
  // whatever star band the roll lands; pull the plain scroll instead
  // and the pool stays flat.
  const SUMMON_BANNERS = [
    { id: 'reverence_rateup', name: 'Heralds of Reverence', sect: 'reverence',
      scroll: 'temporal', mult: 2, until: [2026, 7, 30],
      label: 'Reverence Sect heroes at 2× draw weight within their star band — through Aug 29, then the Court of Cryst takes the banner.' },
    { id: 'cryst_rateup', name: 'Court of Cryst', sect: 'cryst',
      scroll: 'rare', mult: 2, from: [2026, 7, 30],
      label: 'Cryst Sect heroes at 2× draw weight within their star band.' },
  ];

  function currentBanner(date = new Date()) {
    for (const b of SUMMON_BANNERS) {
      if (b.from && date < new Date(...b.from)) continue;
      if (b.until && date >= new Date(...b.until)) continue;
      return b;
    }
    return null;
  }

  // The draw weight this hero carries in a summon pool today (1 or the
  // running banner's mult).
  function bannerWeight(def, date = new Date()) {
    const b = currentBanner(date);
    if (!b || !def) return 1;
    const sect = typeof RACES !== 'undefined' ? RACES.sectOf(def) : null;
    return sect && sect.id === b.sect ? b.mult : 1;
  }

  function bannerLabel(date = new Date()) {
    const b = currentBanner(date);
    return b ? b.label : '';
  }

  // ---- Login bonuses ----
  // The 7-day track: one step per calendar day the player claims,
  // looping forever. Day 7 is the payoff.
  const LOGIN_WEEK = [
    { common: 2, label: '2 Common Scrolls 📜' },
    { whetstones: 20, label: '20 Whetstones 🪨' },
    { rare: 1, label: '1 Rare Scroll ✨' },
    { arcana: 15, label: '15 Arcana ✦' },
    { diamonds: 25, label: '25 Diamonds 💎' },
    { rare: 2, label: '2 Rare Scrolls ✨' },
    { temporal: 1, label: '1 Temporal Scroll 🌀' },
  ];

  // The monthly calendar: a reward for your Nth login day of the month
  // (not consecutive — every stamped day counts). Milestones land on
  // 7/14/21/28 so any month can complete the card; days past 28 draw
  // from the small rotation.
  const LOGIN_MONTH_MILESTONES = {
    7:  { rare: 1, diamonds: 25, label: '1 Rare Scroll ✨ + 25 Diamonds 💎' },
    14: { rare: 3, label: '3 Rare Scrolls ✨' },
    21: { temporal: 1, label: '1 Temporal Scroll 🌀' },
    28: { temporal: 2, diamonds: 100, label: '2 Temporal Scrolls 🌀 + 100 Diamonds 💎' },
  };
  const LOGIN_MONTH_FILLER = [
    { diamonds: 10, label: '10 Diamonds 💎' },
    { whetstones: 15, label: '15 Whetstones 🪨' },
    { common: 1, label: '1 Common Scroll 📜' },
    { arcana: 10, label: '10 Arcana ✦' },
  ];
  function monthlyLoginReward(n) {
    return LOGIN_MONTH_MILESTONES[n] || LOGIN_MONTH_FILLER[n % 4];
  }

  return { DAY_ELEMENT, ALL_ELEMENTS, DROP_MULT,
    isWeekend, boostedElements, elementBoost, scheduleLabel,
    SUMMON_BANNERS, currentBanner, bannerWeight, bannerLabel,
    LOGIN_WEEK, LOGIN_MONTH_MILESTONES, monthlyLoginReward };
})();
