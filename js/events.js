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
  // The weight applies to every scroll kind and is naturally inert
  // where the sect has no heroes in the pool (Reverence is all light,
  // so its banner only bites on Temporal pulls; Cryst is all water, so
  // its turn lives in Common and Rare pulls).
  //
  // `from`/`until` are [year, monthIndex, day] local midnights; `until`
  // is exclusive — the day the next banner takes over.
  const SUMMON_BANNERS = [
    { id: 'reverence_rateup', name: 'Heralds of Reverence', sect: 'reverence',
      mult: 2, until: [2026, 7, 30],
      label: 'Rate-up: Reverence Sect heroes at 2× draw weight in Temporal 🌀 summons — through Aug 29.' },
    { id: 'cryst_rateup', name: 'Court of Cryst', sect: 'cryst',
      mult: 2, from: [2026, 7, 30],
      label: 'Rate-up: Cryst Sect heroes at 2× draw weight in Common 📜 and Rare ✨ summons.' },
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

  return { DAY_ELEMENT, ALL_ELEMENTS, DROP_MULT,
    isWeekend, boostedElements, elementBoost, scheduleLabel,
    SUMMON_BANNERS, currentBanner, bannerWeight, bannerLabel };
})();
