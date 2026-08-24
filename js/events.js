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
  // The First Seven Days: a one-time welcome track. Each of the
  // player's first seven login days (nonconsecutive — any seven) pays
  // one hero, in order, and then the track is complete for good.
  const LOGIN_WEEK = [
    { hero: 'florence', label: 'Tide — 4★ hero 💧' },
    { hero: 'ari', label: 'Ari — 3★ hero 💧' },
    { hero: 'cain', label: 'Cain — 4★ hero 💧' },
    { hero: 'tanner', label: 'Tanner — 4★ hero 💧' },
    { hero: 'angelica', label: 'Angelica — 3★ hero 💧' },
    { hero: 'bit', label: 'Bit — 5★ hero 💧' },
    { hero: 'sawyer', label: 'Sawyer — 5★ hero 🌙' },
  ];

  // The monthly calendar pays BY WEEKDAY — every date's stamp brings
  // that day-of-week's reward, repeating across the whole month:
  //   Sun: Rare Scroll · Mon-Fri: 5 Large Elements (fire, water, wind,
  //   light, dark in weekday order) · Sat: a Temporal Scroll.
  // Indexed by Date.getDay() (0 Sunday .. 6 Saturday).
  const LOGIN_CAL_WEEKDAY = [
    { rare: 1, label: '1 Rare Scroll ✨' },
    { elements: { el: 'fire', large: 5 }, label: '5 Large Fire Elements 🔥' },
    { elements: { el: 'water', large: 5 }, label: '5 Large Water Elements 💧' },
    { elements: { el: 'wind', large: 5 }, label: '5 Large Wind Elements 🍃' },
    { elements: { el: 'light', large: 5 }, label: '5 Large Light Elements ☀️' },
    { elements: { el: 'dark', large: 5 }, label: '5 Large Dark Elements 🌙' },
    { temporal: 1, label: '1 Temporal Scroll 🌀' },
  ];
  // The reward the given calendar date pays when stamped.
  function calendarDayReward(year, monthIndex, day) {
    return LOGIN_CAL_WEEKDAY[new Date(year, monthIndex, day).getDay()];
  }

  // On top of the daily stamps: milestone bonuses for TOTAL logins
  // claimed in the month, paid the moment the count is reached.
  const LOGIN_MONTH_MILESTONES = {
    7:  { temporal: 1, label: '1 Temporal Scroll 🌀' },
    14: { temporal: 2, label: '2 Temporal Scrolls 🌀' },
    21: { temporal: 3, label: '3 Temporal Scrolls 🌀' },
    28: { temporal: 5, label: '5 Temporal Scrolls 🌀' },
  };

  return { DAY_ELEMENT, ALL_ELEMENTS, DROP_MULT,
    isWeekend, boostedElements, elementBoost, scheduleLabel,
    SUMMON_BANNERS, currentBanner, bannerWeight, bannerLabel,
    LOGIN_WEEK, LOGIN_CAL_WEEKDAY, calendarDayReward, LOGIN_MONTH_MILESTONES };
})();
