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
  // Rate-ups: while a banner runs, its sect's heroes draw at BANNER_MULT
  // weight WITHIN whatever star band a pull rolls — the band rates
  // themselves never move, only the contest inside the band.
  //
  // ONE banner per scroll kind, and the two scrolls run CONCURRENTLY —
  // each scroll's elective pull tilts only its own banner's sect.
  //
  // The schedule is a ROTATION, not a list of dated windows: each scroll
  // walks its own cycle one sect per week, wrapping forever, so a
  // two-entry cycle simply alternates until more sects are written into
  // it. Weeks turn at local Monday midnight, counted from BANNER_EPOCH.
  //
  // A banner sect has to be summonable from its scroll's pool: the
  // Temporal pool is Dark and Light only, so all-water Cryst, all-fire
  // Firetroupe and all-wind Whisperchime can only ever ride the Rare
  // scroll. The same rule puts the two bird sects there -- Gulldigger
  // is water, the Phoenix Court fire.
  //
  // Both were unbannered until now, which meant eighteen heroes, the
  // newest on the roster, could never be featured: the only content a
  // player could not go looking for. Appended rather than interleaved,
  // so the weeks the first three sects already hold do not move under
  // anyone mid-rotation -- the wheel simply runs five long instead of
  // three.
  //
  // The same gap had opened again behind them: the Razorwings, the
  // Sunbrood and the Hollowbone were all finished, nine heroes apiece,
  // and none of the three had a week. EVERY STANDING SECT RIDES THE
  // WHEEL -- rules.test.js asserts it from RACES.SECTS rather than from
  // a list here, so the next order to be finished cannot be forgotten
  // the way these were. A sect's element decides which wheel it rides,
  // and that is not a choice: wind Razorwings can only be drawn by the
  // Rare scroll, and the light Sunbrood and dark Hollowbone only by the
  // Temporal.
  //
  // Appended again, for the same reason as last time. The Rare wheel
  // now runs six and the Temporal four.
  const BANNER_EPOCH = new Date(2026, 7, 24); // a Monday
  const BANNER_WEEK_MS = 7 * 24 * 3600 * 1000;
  const BANNER_MULT = 2;
  const BANNER_CYCLES = {
    rare: [
      { id: 'cryst_rateup', name: 'Court of Cryst', sect: 'cryst' },
      { id: 'firetroupe_rateup', name: 'The Firetroupe', sect: 'firetroupe' },
      { id: 'whisperchime_rateup', name: 'The Whisperchime', sect: 'whisperchime' },
      { id: 'gulldigger_rateup', name: 'The Gulldiggers', sect: 'gulldigger' },
      { id: 'phoenixcourt_rateup', name: 'The Phoenix Court', sect: 'phoenixcourt' },
      { id: 'razorwings_rateup', name: 'The Razorwings', sect: 'razorwings' },
      { id: 'stillwater_rateup', name: 'Stillwater', sect: 'stillwater' },
      { id: 'emberpride_rateup', name: 'The Emberpride', sect: 'emberpride' },
      { id: 'zephyrclaw_rateup', name: 'The Zephyrclaw', sect: 'zephyrclaw' },
    ],
    temporal: [
      { id: 'reverence_rateup', name: 'Heralds of Reverence', sect: 'reverence' },
      { id: 'nightflower_rateup', name: 'The Nightflowers', sect: 'nightflower' },
      { id: 'sunbrood_rateup', name: 'The Sunbrood', sect: 'sunbrood' },
      { id: 'hollowbone_rateup', name: 'The Hollowbone', sect: 'hollowbone' },
      { id: 'sunpulse_rateup', name: 'The Sunpulse', sect: 'sunpulse' },
      { id: 'nightbane_rateup', name: 'The Nightbane', sect: 'nightbane' },
    ],
  };
  const BANNER_SCROLLS = Object.keys(BANNER_CYCLES);
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Which week of the rotation a moment falls in. Negative before the
  // epoch, and the floor keeps it walking backwards correctly.
  function bannerWeek(date = new Date()) {
    return Math.floor((date - BANNER_EPOCH) / BANNER_WEEK_MS);
  }

  // The Monday midnight that opens week `n`, and the one that closes it.
  function bannerWeekStart(n) {
    return new Date(BANNER_EPOCH.getFullYear(), BANNER_EPOCH.getMonth(),
      BANNER_EPOCH.getDate() + n * 7);
  }

  // How a banner names its sect in prose: the article dropped, and
  // " Sect" added only where it is not already implied. "Cryst Sect
  // heroes" wants the noun; "Phoenix Court Sect heroes" does not.
  function bannerNoun(entry) {
    const bare = entry.name.replace(/^(The|Court of|Heralds of) /, '');
    return /Court$/.test(bare) ? bare : `${bare} Sect`;
  }

  // The banner holding `scroll` at `date`, dressed with the window it
  // runs in. `run` is the rotation week it belongs to — the same sect
  // coming back around is a NEW run, with a fresh featured pool.
  function bannerFor(scroll, date = new Date()) {
    const cycle = BANNER_CYCLES[scroll];
    if (!cycle || cycle.length === 0) return null;
    const week = bannerWeek(date);
    const entry = cycle[((week % cycle.length) + cycle.length) % cycle.length];
    const from = bannerWeekStart(week);
    const until = bannerWeekStart(week + 1);
    // The window closes at a Monday midnight, so the last full day the
    // banner is up is the Sunday before it.
    const last = new Date(until.getFullYear(), until.getMonth(), until.getDate() - 1);
    return { ...entry, scroll, mult: BANNER_MULT, week, run: `${entry.id}#${week}`,
      from, until,
      label: `${bannerNoun(entry)} heroes ` +
        `at ${BANNER_MULT}× draw weight within their star band — through ` +
        `${MONTHS[last.getMonth()]} ${last.getDate()}.` };
  }

  // ---- Banner countdown ----
  //
  // The label names the Sunday a banner runs through, which answers
  // "roughly when" and not "how long have I got". On the last evening
  // of a week those are very different questions, and the one a player
  // is actually asking is the second.

  // Milliseconds until `banner` closes. Never negative: a banner read
  // after its own window has passed is finished, not overdue.
  function bannerTimeLeft(banner, date = new Date()) {
    return banner && banner.until ? Math.max(0, banner.until - date) : 0;
  }

  // h:mm:ss, with a day count in front while more than a day is left.
  // A banner runs a full week, so without the day the hours would climb
  // past 167 and stop being readable at a glance; with it the clock
  // never shows a field wider than two digits.
  function countdown(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const pad = (n) => String(n).padStart(2, '0');
    const days = Math.floor(total / 86400);
    const hours = Math.floor(total / 3600) % 24;
    const mins = Math.floor(total / 60) % 60;
    const secs = total % 60;
    return `${days > 0 ? `${days}d ` : ''}${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  }

  // Every banner in its window right now — one per scroll.
  function activeBanners(date = new Date()) {
    return BANNER_SCROLLS.map((s) => bannerFor(s, date)).filter(Boolean);
  }

  // The running banner — for `scroll`, when given; the first one
  // otherwise (legacy callers that predate concurrent banners).
  function currentBanner(date = new Date(), scroll = null) {
    if (scroll) return bannerFor(scroll, date);
    return activeBanners(date)[0] || null;
  }

  // Every sect that ever holds a banner, with the scroll it holds it on
  // — the flat view, for anything checking the schedule as a whole.
  const SUMMON_BANNERS = BANNER_SCROLLS.flatMap((scroll) =>
    BANNER_CYCLES[scroll].map((b) => ({ ...b, scroll, mult: BANNER_MULT })));

  // The draw weight this hero carries in a summon pool today (1 or the
  // elected banner's mult). `scroll` names the scroll being pulled so
  // the weight comes off THAT banner, not whichever runs first.
  function bannerWeight(def, date = new Date(), scroll = null) {
    const b = currentBanner(date, scroll);
    if (!b || !def) return 1;
    const sect = typeof RACES !== 'undefined' ? RACES.sectOf(def) : null;
    return sect && sect.id === b.sect ? b.mult : 1;
  }

  function bannerLabel(date = new Date()) {
    const b = currentBanner(date);
    return b ? b.label : '';
  }


  // ---- World Rift ----
  // A weekly damage race: one colossal elemental boss, unkillable on
  // purpose, a fixed turn budget — the score is the damage dealt when
  // the rift closes. The element rotates weekly (local clock, weeks
  // anchored to a Monday), and milestone rewards pay ONCE per week as
  // the weekly best crosses each mark.
  const WORLD_RIFT = { turns: 60, level: 80 };
  const RIFT_ORDER = ['fire', 'water', 'wind', 'light', 'dark'];
  const RIFT_EPOCH = new Date(2026, 0, 5); // a Monday
  function worldRiftWeek(date = new Date()) {
    return Math.floor((date - RIFT_EPOCH) / (7 * 24 * 3600 * 1000));
  }
  function worldRiftWeekKey(date = new Date()) {
    return `rift-${worldRiftWeek(date)}`;
  }
  function worldRiftElement(date = new Date()) {
    const n = RIFT_ORDER.length;
    return RIFT_ORDER[((worldRiftWeek(date) % n) + n) % n];
  }
  const WORLD_RIFT_MILESTONES = [
    { score: 25000, reward: { temporal: 1 },
      label: '1 Temporal Scroll 🌀' },
    { score: 60000, reward: { temporal: 2 },
      label: '2 Temporal Scrolls 🌀' },
    { score: 120000, reward: { temporal: 3 },
      label: '3 Temporal Scrolls 🌀' },
    { score: 250000, reward: { temporal: 4 },
      label: '4 Temporal Scrolls 🌀' },
    { score: 500000, reward: { temporal: 5 },
      label: '5 Temporal Scrolls 🌀' },
  ];

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
    SUMMON_BANNERS, BANNER_CYCLES, bannerWeek, bannerFor, activeBanners, currentBanner, bannerWeight, bannerLabel,
    bannerTimeLeft, countdown,
    WORLD_RIFT, WORLD_RIFT_MILESTONES,
    worldRiftWeek, worldRiftWeekKey, worldRiftElement,
    LOGIN_WEEK, LOGIN_CAL_WEEKDAY, calendarDayReward, LOGIN_MONTH_MILESTONES };
})();
