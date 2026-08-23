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

  return { DAY_ELEMENT, ALL_ELEMENTS, DROP_MULT,
    isWeekend, boostedElements, elementBoost, scheduleLabel };
})();
