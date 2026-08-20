// Balance report: simulates real battles headlessly and prints what the
// numbers actually look like.
//
// The engine runs fine without a renderer — units with no animator
// resolve their abilities immediately — so the whole fight, AI profiles,
// threat, elements and all, can be played out in Node. Use it to catch
// power creep and one-hero-carries-everything before it becomes the meta.
//
//   node test/balance.js                 # default sweep
//   node test/balance.js --sims 40       # more samples per matchup
//   node test/balance.js --level 40      # team level
//   node test/balance.js --team echo,catherine,rat_knight

const { loadGame } = require('./harness');
const g = loadGame();
const { HEROES, BOSSES, ENEMIES, LOCATION_ENEMIES, CONFIG, TEAM, Battle,
  BattleState, Unit, Meter, Progression } = g;

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const SIMS = Number(arg('sims', 25));
const LEVEL = Number(arg('level', 30));
const MAX_TICKS = 20000; // ~1000 simulated seconds; a stalemate bails out

// A reference party: a tank, a healer, two strikers and a support, so
// the report reflects a normal team rather than one hero's showcase.
const DEFAULT_TEAM = ['echo', 'catherine', 'rat_knight', 'rat_archer', 'snake_spitter'];
const TEAM_IDS = arg('team', DEFAULT_TEAM.join(',')).split(',')
  .map((s) => s.trim()).filter((id) => HEROES[id]);

// Slot order fills front hexes first, matching how players deploy.
const SLOTS = [1, 2, 6, 0, 3, 5, 4];

function runBattle(enemyDefs, enemyLevel) {
  Meter.resetBattle();
  const battle = new Battle();
  battle.autoMode = true;
  TEAM_IDS.forEach((id, i) => {
    battle.placeUnit(new Unit(HEROES[id], TEAM.PLAYER,
      { level: LEVEL, stars: HEROES[id].rarity }), SLOTS[i]);
  });
  enemyDefs.forEach((def, i) => {
    battle.placeUnit(new Unit(def, TEAM.ENEMY,
      { level: enemyLevel, stars: def.rarity || 3 }), SLOTS[i]);
  });

  let winner = null;
  battle.onBattleEnd = (w) => { winner = w; };
  let ticks = 0;
  while (!winner && ticks < MAX_TICKS) {
    battle.update(0.05);
    ticks++;
  }
  const rows = Meter.rows('damage', 'battle');
  const survivors = battle.livingUnits(TEAM.PLAYER).length;
  return {
    won: winner === TEAM.PLAYER,
    stalled: !winner,
    seconds: +(ticks * 0.05).toFixed(1),
    survivors,
    damage: rows.list.map((r) => ({ name: r.name, share: r.share, value: r.value })),
  };
}

function summarize(label, results) {
  const wins = results.filter((r) => r.won).length;
  const stalls = results.filter((r) => r.stalled).length;
  const secs = results.map((r) => r.seconds).sort((a, b) => a - b);
  const median = secs[Math.floor(secs.length / 2)];
  const surv = (results.reduce((s, r) => s + r.survivors, 0) / results.length).toFixed(1);
  // Whose damage is this team actually made of?
  const totals = {};
  for (const r of results) for (const d of r.damage) {
    totals[d.name] = (totals[d.name] || 0) + d.value;
  }
  const grand = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  const shares = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, v]) => `${name} ${Math.round((v / grand) * 100)}%`);
  const rate = Math.round((wins / results.length) * 100);
  const flag = rate === 100 ? '  (trivial)' : rate === 0 ? '  (impossible)' : '';
  console.log(
    `  ${label.padEnd(26)} win ${String(rate).padStart(3)}%  ` +
    `median ${String(median).padStart(5)}s  survivors ${surv}/${TEAM_IDS.length}` +
    `${stalls ? `  STALLED ${stalls}` : ''}${flag}`);
  return { label, rate, median, shares, grand };
}

console.log(`\nBalance report — team [${TEAM_IDS.join(', ')}] at level ${LEVEL}, ` +
  `${SIMS} sims per matchup\n`);

const allShares = {};
const noteShares = (s) => {
  for (const entry of s.shares) {
    const [name, pct] = [entry.slice(0, entry.lastIndexOf(' ')), entry.split(' ').pop()];
    allShares[name] = (allShares[name] || 0) + parseInt(pct, 10);
  }
};

// ---- Hunts: every location, a spread of stages ---------------------------
console.log('HUNTS');
for (const [loc, ids] of Object.entries(LOCATION_ENEMIES)) {
  const pool = ids.map((id) => ENEMIES[id]).filter(Boolean);
  if (!pool.length) continue;
  const name = CONFIG.LOCATION_NAMES[Number(loc)] || `loc ${loc}`;
  for (const stage of [1, 5, 10]) {
    const level = stage * 5;
    const results = [];
    for (let i = 0; i < SIMS; i++) {
      const wave = Array.from({ length: 5 },
        () => pool[Math.floor(Math.random() * pool.length)]);
      results.push(runBattle(wave, level));
    }
    noteShares(summarize(`${name} stage ${stage}`, results));
  }
}

// ---- Bosses: the difficulty spine ---------------------------------------
console.log('\nBOSSES');
for (const [key, def] of Object.entries(BOSSES)) {
  for (const stage of [1, 5]) {
    const level = Progression.bossLevel(stage);
    const results = [];
    for (let i = 0; i < SIMS; i++) results.push(runBattle([def], level));
    noteShares(summarize(`${def.name} stage ${stage}`, results));
  }
}

// ---- Who is this team, really? ------------------------------------------
console.log('\nDAMAGE SHARE ACROSS EVERY MATCHUP');
const ranked = Object.entries(allShares).sort((a, b) => b[1] - a[1]);
const total = ranked.reduce((s, [, v]) => s + v, 0) || 1;
for (const [name, v] of ranked) {
  const pct = Math.round((v / total) * 100);
  const bar = '█'.repeat(Math.max(1, Math.round(pct / 2)));
  const warn = pct >= 60 ? '  ← carrying the team' : pct <= 3 ? '  ← contributing nothing' : '';
  console.log(`  ${name.padEnd(18)} ${String(pct).padStart(3)}%  ${bar}${warn}`);
}
console.log('');
