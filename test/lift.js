// The asymmetric bench: what a MIRROR cannot see.
//
// test/archetypes.js fields seven against a copy of themselves, which is
// the right shape for measuring a hero's own output and the wrong shape
// for measuring a party BUFF: both sides get it, so it cancels, and the
// lift column reads zero. Every pure buffer on the roster comes out at
// or below nothing there -- Wanda 44.8, Artur -55.7, Polo -156.6, and
// then Orien at -5.6 and Nestora at -29 when they were written.
//
// So: the same party twice against a FIXED enemy wave, once with the
// hero and once without, paired on the seed. What survives is the
// difference the hero actually makes to the team's damage.
//
//   node test/lift.js <heroId> [sims] [ticks]
//
// `ticks` is the CAP, not the length: the fight runs until the wave is
// down or the cap is hit. That matters, and a hero broke the first
// version to prove it -- see below.
//
//   node test/lift.js nestora 25 200    ->  -11 +/- 31   (-0.3%)
//   node test/lift.js nestora 25 400    ->  286 +/- 73    (6.0%)
//   node test/lift.js nestora 25 1200   -> 1742 +/- 162  (12.9%)
//
// TURNS ARE SERIALISED. Battle.update stops filling every meter on the
// field while one unit is acting, so a tick budget is not a turn budget:
// put two more bodies on the board and the four heroes already there
// each get FEWER turns inside the same number of ticks. The first
// version of this file reported damage-in-a-window and nothing else,
// and it read Click -- a summoner whose own damage is zero -- at -379
// +/- 35, a confident negative that was entirely the bench's own
// accounting. Adding bodies made the party busier and the window did
// not grow.
//
// So the headline is TIME TO CLEAR, which has no such bias: more bodies
// clear the wave sooner or they do not, and that is the question a
// player is actually asking. Damage-in-window is still printed, because
// it is the right measure for the fights that never clear, but it is no
// longer the number the tool leads with.

const { loadGame } = require('./harness');
const g = loadGame();
const { HEROES, ENEMIES, Unit, Battle, Meter, TEAM, RACES } = g;

const HERO = process.argv[2];
const SIMS = Number(process.argv[3] || 25);
// 1600, not 400: with the wave named rather than accidental, a run
// takes ~900 ticks to clear, and a cap under that censors every one of
// them back into the damage-in-window figure this bench exists to
// avoid quoting.
const CAP = Number(process.argv[4] || 1600);

const SWEEP = HERO === '--csv' || HERO === '--all';
if (!SWEEP && (!HERO || !HEROES[HERO])) {
  console.error('usage: node test/lift.js <heroId|--csv|--all> [sims] [ticks] [foeId]');
  process.exit(1);
}

// The party the hero under test joins. Whoever is being measured is
// pulled OUT of the base six and seated in the spare hex, so the two
// runs field the same bodies bar one. The first pass left the hero in
// the base map as well and both sides came out identical -- 0 +/- 0,
// which is exactly what a probe measuring nothing looks like, and is
// worth remembering as the failure mode of a paired design.
const BASE = { aurek: 1, durn: 2, mavros: 6, solari: 0, aster: 3, rizzo: 4 };
// The seating is per-hero, so a sweep can measure the whole roster in
// one process instead of paying the game load 92 times over.
function seatFor(hero) {
  const seat = { ...BASE };
  delete seat[hero];
  // The first hex nobody in the base party is on. Hardcoding one worked
  // until a fixture put a base hero there and the run died on "slot
  // occupied" -- the seat has to be found, not assumed, because the base
  // party is meant to be edited.
  const taken = new Set(Object.values(seat));
  seat[hero] = [0, 1, 2, 3, 4, 5, 6].find((i) => !taken.has(i));
  return seat[hero] === undefined ? null : seat;
}
// The wave. This was `Object.keys(ENEMIES)[0]` -- whatever the table
// happened to list first -- which is not a fixture, it is an accident,
// and the accident went bad: the first key is `echo`, the game's
// tankiest 5-star mirror bulwark. Six of those at level 40 is 82k of
// health behind 1500 DEF, so nothing cleared at ANY cap, every run was
// censored, and the only number left was damage-in-window -- exactly
// the biased figure the header above warns about. A named, ordinary
// 3-star opponent instead, so the wave actually falls and time-to-clear
// is a real number again.
const FOE = process.argv[5] || 'barrington';
if (!ENEMIES[FOE]) {
  console.error(`no such enemy: ${FOE}`);
  process.exit(1);
}

function run(seed, withHero, HERO, SEAT) {
  g.seed(seed);
  Meter.resetBattle();
  const battle = new Battle();
  battle.autoMode = true;
  const units = [];
  for (const [id, slot] of Object.entries(SEAT)) {
    if (id === HERO && !withHero) continue;
    const u = new Unit(HEROES[id], TEAM.PLAYER, { level: 40, stars: 5 });
    battle.placeUnit(u, slot);
    units.push(u);
  }
  // Party bonuses are applied to whoever is actually fielded, so
  // dropping the hero drops a sect head-count with them -- which is
  // honest: that IS part of what fielding them is worth.
  RACES.applyParty(units);
  // Killable inside a long cap, so time-to-clear is a real number
  // rather than a censored one. Too deep and every run hits the cap and
  // the headline says nothing; too shallow and the fight is over before
  // a hero whose value accumulates has shown any of it.
  for (let i = 0; i < 6; i++) {
    const f = new Unit(ENEMIES[FOE], TEAM.ENEMY, { level: 40, stars: 5 });
    f.hp = f.maxHp;
    battle.placeUnit(f, i);
  }
  let ticks = 0;
  while (ticks < CAP && battle.livingUnits(TEAM.PLAYER).length &&
         battle.livingUnits(TEAM.ENEMY).length) {
    battle.update(0.05);
    ticks++;
  }
  const foes = battle.units.filter((u) => u.team === TEAM.ENEMY);
  const cleared = battle.livingUnits(TEAM.ENEMY).length === 0;
  return {
    dealt: foes.reduce((n, u) => n + (u.maxHp - Math.max(0, u.hp)), 0),
    standing: battle.livingUnits(TEAM.PLAYER).length,
    // Censored at the cap when the wave never went down, and the share
    // of runs that cleared is printed beside it so a reader can see how
    // much of the figure is real.
    ticks, cleared, wiped: battle.livingUnits(TEAM.PLAYER).length === 0,
  };
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
// Paired standard error: the seed is shared, so the DIFFERENCE is the
// sample and its spread is what says whether the figure means anything.
const se = (xs) => {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1) / xs.length);
};
const rate = (rs, k) => mean(rs.map((r) => (r[k] ? 1 : 0)));

function measure(hero) {
  const seat = seatFor(hero);
  if (!seat) return null;
  const withs = [];
  const withouts = [];
  for (let i = 0; i < SIMS; i++) {
    withs.push(run(1000 + i, true, hero, seat));
    withouts.push(run(1000 + i, false, hero, seat));
  }
  // Negative is FASTER, so the sign is flipped on the way out: a hero
  // who clears the wave sooner should read as a positive number like
  // every other lift in this project.
  const tickDiffs = withs.map((w, i) => withouts[i].ticks - w.ticks);
  const diffs = withs.map((w, i) => w.dealt - withouts[i].dealt);
  const withoutTicks = mean(withouts.map((r) => r.ticks));
  return {
    hero,
    withTicks: mean(withs.map((r) => r.ticks)),
    withoutTicks,
    faster: mean(tickDiffs),
    fasterErr: se(tickDiffs),
    fasterPct: (mean(tickDiffs) / withoutTicks) * 100,
    dealt: mean(withs.map((r) => r.dealt)),
    dealtBase: mean(withouts.map((r) => r.dealt)),
    dealtDiff: mean(diffs),
    dealtErr: se(diffs),
    standing: mean(withs.map((r) => r.standing)),
    standingBase: mean(withouts.map((r) => r.standing)),
    clearedWith: rate(withs, 'cleared'),
    clearedWithout: rate(withouts, 'cleared'),
    wipedWith: rate(withs, 'wiped'),
    // Only meaningful when fights are actually ENDING in a clear. A run
    // that stops early because the party died is not a fast one, and a
    // "faster by -566 ticks" printed under an 80% wipe rate reads as the
    // exact opposite of what happened.
    anyCleared: withs.concat(withouts).some((r) => r.cleared),
  };
}

// A whole-roster sweep, so the figure the mirror bench cannot see gets
// measured for everyone rather than for whoever was suspected.
if (HERO === '--csv' || HERO === '--all') {
  const rows = [];
  for (const id of Object.keys(HEROES)) {
    const m = measure(id);
    if (m) rows.push(m);
  }
  const p1 = (x) => x.toFixed(1);
  if (HERO === '--csv') {
    console.log(`Lift bench \u2014 ${rows.length} heroes, ${SIMS} paired fights each, ` +
      `cap ${CAP} ticks, vs six ${ENEMIES[FOE].name} at Lv 40 5\u2605`);
    console.log('hero,name,rarity,withTicks,withoutTicks,faster,fasterErr,fasterPct,' +
      'clearedWith,clearedWithout,standing,standingBase');
    for (const m of rows.sort((a, b) => b.faster - a.faster)) {
      const d = HEROES[m.hero];
      console.log([m.hero, d.name, d.rarity, Math.round(m.withTicks),
        Math.round(m.withoutTicks), Math.round(m.faster), Math.round(m.fasterErr),
        p1(m.fasterPct), Math.round(m.clearedWith * 100), Math.round(m.clearedWithout * 100),
        m.standing.toFixed(2), m.standingBase.toFixed(2)].join(','));
    }
  } else {
    for (const m of rows.sort((a, b) => b.faster - a.faster)) {
      console.log(`${HEROES[m.hero].name.padEnd(12)} ${String(Math.round(m.faster)).padStart(5)}` +
        ` +/- ${String(Math.round(m.fasterErr)).padStart(3)}  (${p1(m.fasterPct)}%)`);
    }
  }
  process.exit(0);
}

const m = measure(HERO);
if (!m) {
  console.error('no free hex for the hero under test \u2014 trim the base party');
  process.exit(1);
}
console.log(`${HERO}: ${SIMS} paired fights, cap ${CAP} ticks, vs a fixed wave`);
const pc = (x) => `${Math.round(x * 100)}%`;
console.log(`  ticks to finish  with ${Math.round(m.withTicks)}` +
  ` (cleared ${pc(m.clearedWith)}, wiped ${pc(m.wipedWith)})`);
console.log(`                without ${Math.round(m.withoutTicks)}` +
  ` (cleared ${pc(m.clearedWithout)})`);
if (m.anyCleared) {
  console.log(`  faster by ${Math.round(m.faster)} +/- ${Math.round(m.fasterErr)}` +
    ` ticks  (${m.fasterPct.toFixed(1)}%)`);
} else {
  console.log('  (no run cleared the wave \u2014 read the outcome line above, ' +
    'not the tick counts)');
}
console.log(`  damage in window ${Math.round(m.dealt)} vs ${Math.round(m.dealtBase)}` +
  `  ->  ${Math.round(m.dealtDiff)} +/- ${Math.round(m.dealtErr)}` +
  `  (${(m.dealtDiff / m.dealtBase * 100).toFixed(1)}%)`);
console.log(`  party standing  with ${m.standing.toFixed(2)}` +
  `  without ${m.standingBase.toFixed(2)}`);
