// Loads the game's data and rule modules into a bare Node context.
//
// The game ships as plain <script> files with no bundler, so the tests
// evaluate those files in a sandbox with the few browser globals the
// data layer touches. Nothing here needs a DOM: heroes, bosses, gear,
// races, positionals and the combat rules are all pure data + logic.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

// Files under test, in load order (mirrors index.html).
const FILES = [
  // Same order as index.html, and a test in data.test.js keeps it that
  // way: load order is load-bearing (ACHIEVEMENTS reads the campaign's
  // tier list while it is being defined), so a harness that loads the
  // files in a different order tests an order the browser never runs.
  'js/meter.js', 'js/config.js', 'js/hex.js', 'js/elements.js', 'js/events.js', 'js/races.js', 'js/tags.js',
  'js/abilities.js', 'js/progression.js', 'js/attune.js', 'js/gear.js', 'js/hero.js', 'js/data/positionals.js',
  'js/data/heroes.js', 'js/data/heroes/humans.js', 'js/data/heroes/rats.js',
  'js/data/heroes/avians.js', 'js/data/heroes/minotaurs.js', 'js/data/heroes/snakes.js',
  'js/data/heroes/wolfs.js', 'js/data/heroes/boars.js', 'js/data/heroes/bears.js',
  'js/data/heroes/cats.js', 'js/data/heroes/drakes.js', 'js/data/balance.js', 'js/data/enemies.js',
  'js/data/campaign.js', 'js/data/bosses.js', 'js/data/elemental_bosses.js', 'js/data/dungeons.js', 'js/quests.js', 'js/state.js',
  'js/gacha.js', 'js/ai.js', 'js/waves.js', 'js/campaign.js', 'js/achievements.js', 'js/battle.js',
];

// `opts.save` pre-seeds localStorage before any game file runs, which is
// the only way to exercise the save loader and its migrations: state.js
// reads storage once, at load.
function loadGame(opts = {}) {
  // The sandbox gets its own Math so a caller can make the whole engine
  // deterministic — crits, dodges, wave picks and all — without touching
  // the host's. Inherited methods (floor, min, ...) resolve through the
  // prototype; only `random` is ever shadowed.
  const sandboxMath = Object.create(Math);
  const sandbox = {
    console,
    Math: sandboxMath,
    JSON,
    Date,
    structuredClone,
    // Sprite loading and rendering never run in these tests; the data
    // files only reference these lazily, so stubs are enough.
    document: { getElementById: () => null, createElement: () => ({ getContext: () => null }) },
    window: {},
    Image: function Image() {},
    // A real in-memory store, not a no-op: tests that care whether
    // something is persisted need to read back what was written.
    localStorage: (() => {
      const store = new Map();
      if (opts.save !== undefined) {
        store.set('browsergacha_save_v1', JSON.stringify(opts.save));
      }
      return {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => { store.set(k, String(v)); },
        removeItem: (k) => { store.delete(k); },
        clear: () => store.clear(),
      };
    })(),
  };
  sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  for (const rel of FILES) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    try {
      vm.runInContext(code, ctx, { filename: rel });
    } catch (e) {
      throw new Error(`${rel} failed to load: ${e.message}`);
    }
  }
  // Top-level `const` in a vm script lives in the context's lexical
  // scope, not on the sandbox object, so surface what the tests need.
  const EXPORTS = ['CONFIG', 'POSITION', 'TEAM', 'HEROES', 'BOSSES', 'ENEMIES', 'Tags',
    'LOCATION_ENEMIES', 'POSITIONALS', 'RACES', 'Elements', 'Gear',
    'Progression', 'Abilities', 'Unit', 'AI', 'Meter', 'Hex', 'Quests', 'Battle', 'BattleState', 'GameState', 'Events',
    'Waves', 'CAMPAIGN', 'Campaign', 'ACHIEVEMENTS', 'Gacha',
    'Attune', 'ELEMENTAL_BOSSES', 'DUNGEON_BOSSES', 'ELEMENTS', 'Unit'];
  vm.runInContext(
    `Object.assign(globalThis, { ${EXPORTS.map((n) =>
      `${n}: typeof ${n} !== 'undefined' ? ${n} : undefined`).join(', ')} });`,
    ctx);
  // Deterministic runs: seed() installs a small xorshift PRNG in place of
  // Math.random, so the same seed replays the same battle exactly.
  // unseed() hands control back to the real one.
  ctx.seed = (n) => {
    let x = (n >>> 0) || 0x9e3779b9;
    sandboxMath.random = () => {
      x ^= x << 13; x >>>= 0;
      x ^= x >> 17;
      x ^= x << 5; x >>>= 0;
      return x / 0x100000000;
    };
  };
  ctx.unseed = () => { delete sandboxMath.random; };

  ctx.savedState = () => {
    const raw = ctx.localStorage.getItem('browsergacha_save_v1');
    return raw ? JSON.parse(raw) : null;
  };
  return ctx;
}

// ---- Tiny test runner ----------------------------------------------------

const results = { passed: 0, failed: [] };

function test(name, fn) {
  try {
    fn();
    results.passed++;
  } catch (e) {
    results.failed.push({ name, message: e.message });
  }
}

function assert(cond, message) {
  if (!cond) throw new Error(message || 'assertion failed');
}

function report() {
  const total = results.passed + results.failed.length;
  for (const f of results.failed) console.error(`  FAIL  ${f.name}\n        ${f.message}`);
  console.log(`\n${results.passed}/${total} checks passed`);
  if (results.failed.length) {
    console.error(`${results.failed.length} failing`);
    process.exit(1);
  }
}

module.exports = { loadGame, test, assert, report, ROOT, FILES };
