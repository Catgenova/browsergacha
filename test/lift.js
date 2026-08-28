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
const CAP = Number(process.argv[4] || 400);

if (!HERO || !HEROES[HERO]) {
  console.error('usage: node test/lift.js <heroId> [sims] [ticks]');
  process.exit(1);
}

// The party the hero under test joins. Whoever is being measured is
// pulled OUT of the base six and seated in the spare hex, so the two
// runs field the same bodies bar one. The first pass left the hero in
// the base map as well and both sides came out identical -- 0 +/- 0,
// which is exactly what a probe measuring nothing looks like, and is
// worth remembering as the failure mode of a paired design.
const BASE = { aurek: 1, durn: 2, mavros: 6, solari: 0, aster: 3, rizzo: 4 };
const SEAT = { ...BASE };
delete SEAT[HERO];
// The first hex nobody in the base party is on. Hardcoding one worked
// until a fixture put a base hero there and the run died on "slot
// occupied" -- the seat has to be found, not assumed, because the base
// party is meant to be edited.
const taken = new Set(Object.values(SEAT));
SEAT[HERO] = [0, 1, 2, 3, 4, 5, 6].find((i) => !taken.has(i));
if (SEAT[HERO] === undefined) {
  console.error('no free hex for the hero under test — trim the base party');
  process.exit(1);
}
const FOE = Object.keys(ENEMIES)[0];

function run(seed, withHero) {
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

const withs = [];
const withouts = [];
for (let i = 0; i < SIMS; i++) {
  withs.push(run(1000 + i, true));
  withouts.push(run(1000 + i, false));
}
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
// Paired standard error: the seed is shared, so the DIFFERENCE is the
// sample and its spread is what says whether the figure means anything.
const se = (xs) => {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1) / xs.length);
};
const diffs = withs.map((w, i) => w.dealt - withouts[i].dealt);
const base = mean(withouts.map((r) => r.dealt));
// Negative is FASTER, so the sign is flipped on the way out: a hero who
// clears the wave sooner should read as a positive number like every
// other lift in this project.
const tickDiffs = withs.map((w, i) => withouts[i].ticks - w.ticks);
const clearRate = (rs) => `${Math.round(mean(rs.map((r) => (r.cleared ? 1 : 0))) * 100)}%`;

console.log(`${HERO}: ${SIMS} paired fights, cap ${CAP} ticks, vs a fixed wave`);
const outcome = (rs) => `cleared ${clearRate(rs)}, wiped ` +
  `${Math.round(mean(rs.map((r) => (r.wiped ? 1 : 0))) * 100)}%`;
console.log(`  ticks to finish  with ${Math.round(mean(withs.map((r) => r.ticks)))}` +
  ` (${outcome(withs)})`);
console.log(`                without ${Math.round(mean(withouts.map((r) => r.ticks)))}` +
  ` (${outcome(withouts)})`);
// Only meaningful when fights are actually ENDING in a clear. A run
// that stops early because the party died is not a fast one, and a
// "faster by -566 ticks" printed under an 80% wipe rate reads as the
// exact opposite of what happened.
const anyCleared = withs.concat(withouts).some((r) => r.cleared);
if (anyCleared) {
  console.log(`  faster by ${Math.round(mean(tickDiffs))} +/- ${Math.round(se(tickDiffs))}` +
    ` ticks  (${(mean(tickDiffs) / mean(withouts.map((r) => r.ticks)) * 100).toFixed(1)}%)`);
} else {
  console.log('  (no run cleared the wave — read the outcome line above, ' +
    'not the tick counts)');
}
console.log(`  damage in window ${Math.round(mean(withs.map((r) => r.dealt)))}` +
  ` vs ${Math.round(base)}  ->  ${Math.round(mean(diffs))} +/- ${Math.round(se(diffs))}` +
  `  (${(mean(diffs) / base * 100).toFixed(1)}%)`);
console.log(`  party standing  with ${mean(withs.map((r) => r.standing)).toFixed(2)}` +
  `  without ${mean(withouts.map((r) => r.standing)).toFixed(2)}`);
