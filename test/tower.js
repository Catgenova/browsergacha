// The tower bench: does the Endless Tower actually get harder?
//
//   node test/tower.js [sims]
//
// Fields a party at four power profiles -- from a mid-game account up
// to a fully maxed one -- against the real composition of a set of
// tower floors, and prints the win rate, the wipe rate and the ticks a
// run takes. The floors come from js/tower.js, the same module the
// battle screen builds the fight from, so this measures the shipped
// curve rather than a copy of it.
//
// Read the WIPE column as carefully as the win column. A floor a party
// cannot clear is only a hard floor if the party also DIES there; a
// column of `0%w/0%L` is a fight that never ends, which is what the
// old linear curve degenerated into at depth and the reason the curve
// was replaced. See the header of js/tower.js.

const { loadGame } = require('./harness');
const g = loadGame();
const { HEROES, ENEMIES, LOCATION_ENEMIES, Unit, Battle, Meter, TEAM, RACES,
  Waves, Tower } = g;

const SIMS = Number(process.argv[2] || 7);
// Long enough that a slow clear is a clear and not a censored loss.
const CAP = 3000;

// Six bodies that between them cover a line, damage and a healer, so
// the bench is not measuring one archetype's matchup.
const PARTY = ['aurek', 'durn', 'mavros', 'solari', 'aster', 'rizzo'];

// Gear profiles. Not rolled: a bench wants the same eight pieces every
// run, or the spread swamps the signal being measured.
function gearFor(tier) {
  if (tier === 'none') return [];
  const spec = {
    rare: { rarity: 'rare', level: 45,
      subs: [['atkPct', 0.07], ['hpPct', 0.07], ['critDamage', 0.07]] },
    epic: { rarity: 'epic', level: 75,
      subs: [['atkPct', 0.08], ['hpPct', 0.08], ['critDamage', 0.08], ['critChance', 0.06]] },
    bis: { rarity: 'legendary', level: 90,
      subs: [['atkPct', 0.09], ['critDamage', 0.09], ['hpPct', 0.09],
        ['critChance', 0.07], ['defPct', 0.09]] },
  }[tier];
  const mains = { weapon: 'critDamage', helm: 'atkPct', chest: 'hpPct',
    gloves: 'atkPct', belt: 'defPct', boots: 'spdFlat', ring: 'critChance',
    amulet: 'critDamage' };
  return Object.entries(mains).map(([slot, main]) => ({
    set: 'dragon', slot, main, rarity: spec.rarity, level: spec.level, plus: 0,
    subs: spec.subs.map(([stat, value]) => ({ stat, value })),
  }));
}

// One run of one floor, built exactly the way BattleScreen builds it.
function run(seed, floor, prof) {
  g.seed(seed);
  Meter.resetBattle();
  const battle = new Battle();
  battle.autoMode = true;
  const units = [];
  PARTY.forEach((id, i) => {
    const u = new Unit(HEROES[id], TEAM.PLAYER, { level: prof.level,
      stars: prof.stars, attune: prof.attune || 0, gear: gearFor(prof.gear) });
    battle.placeUnit(u, i);
    units.push(u);
  });
  RACES.applyParty(units);

  const { level, statScale } = Tower.floorSpec(floor);
  const locs = Object.keys(LOCATION_ENEMIES).map(Number);
  const pool = LOCATION_ENEMIES[locs[(floor - 1) % locs.length]]
    .map((id) => ENEMIES[id]).filter(Boolean);
  for (const { def, slotIndex } of
       Waves.deploy(Waves.compose(pool, 7), battle.enemySlots)) {
    const lv = Math.max(1, level + Math.floor(Math.random() * 3) - 1);
    battle.placeUnit(
      new Unit(def, TEAM.ENEMY, { level: lv, stars: def.rarity, statScale }),
      slotIndex);
  }

  let ticks = 0;
  while (ticks < CAP && battle.livingUnits(TEAM.PLAYER).length &&
         battle.livingUnits(TEAM.ENEMY).length) {
    battle.update(0.05);
    ticks++;
  }
  return {
    cleared: battle.livingUnits(TEAM.ENEMY).length === 0,
    wiped: battle.livingUnits(TEAM.PLAYER).length === 0,
    ticks,
  };
}

const PROFILES = [
  { name: 'early  Lv40  5*  a0  ungeared', level: 40, stars: 5, gear: 'none' },
  { name: 'mid    Lv60  6*  a3  rare',     level: 60, stars: 6, attune: 3, gear: 'rare' },
  { name: 'late   Lv80  8*  a6  epic',     level: 80, stars: 8, attune: 6, gear: 'epic' },
  { name: 'maxed  Lv100 10* a10 BiS',      level: 100, stars: 10, attune: 10, gear: 'bis' },
];
const FLOORS = (process.argv[3] || '50,100,150,200,250,300,400,600').split(',').map(Number);

console.log(`Endless Tower bench -- ${SIMS} sims/floor, ${CAP}-tick cap`);
console.log(`curve: linear to floor ${Tower.ANCHOR}, then ` +
  `x${Tower.RATE} per floor\n`);
console.log('floor'.padStart(6), 'power'.padStart(10),
  PROFILES.map((p) => p.name.split(/\s+/)[0].padStart(13)).join(''));

for (const f of FLOORS) {
  const cells = PROFILES.map((prof) => {
    let win = 0, wipe = 0;
    for (let s = 0; s < SIMS; s++) {
      const r = run(500 + s, f, prof);
      if (r.cleared) win++;
      if (r.wiped) wipe++;
    }
    return `${Math.round(100 * win / SIMS)}%w/${Math.round(100 * wipe / SIMS)}%L`
      .padStart(13);
  });
  const p = Tower.power(f);
  const shown = p >= 1000 ? `${Math.round(p)}x` : `${p.toFixed(1)}x`;
  console.log(String(f).padStart(6), shown.padStart(10), cells.join(''));
}

// The property the whole rewrite exists for, printed so it can be read
// rather than trusted: the step from one floor to the next, as a
// percentage, at several depths.
console.log('\nstep from floor N to N+1:');
for (const f of [10, 50, 100, 200, 400, 800]) {
  const step = (Tower.power(f + 1) / Tower.power(f) - 1) * 100;
  console.log(`  ${String(f).padStart(4)} -> ${String(f + 1).padEnd(4)} ` +
    `${step.toFixed(2)}%`);
}
