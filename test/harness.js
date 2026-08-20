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
  'js/config.js', 'js/hex.js', 'js/elements.js', 'js/races.js',
  'js/abilities.js', 'js/progression.js', 'js/gear.js', 'js/hero.js',
  'js/data/positionals.js', 'js/data/heroes.js',
  'js/data/heroes/humans.js', 'js/data/heroes/rats.js', 'js/data/heroes/avians.js', 'js/data/heroes/minotaurs.js', 'js/data/heroes/snakes.js', 'js/data/heroes/wolfs.js', 'js/data/heroes/boars.js', 'js/data/heroes/bears.js', 'js/data/heroes/cats.js', 'js/data/heroes/drakes.js',
  'js/data/enemies.js',
  'js/data/bosses.js', 'js/ai.js', 'js/meter.js', 'js/quests.js', 'js/battle.js', 'js/state.js',
];

function loadGame() {
  const sandbox = {
    console,
    Math,
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
  const EXPORTS = ['CONFIG', 'POSITION', 'TEAM', 'HEROES', 'BOSSES', 'ENEMIES',
    'LOCATION_ENEMIES', 'POSITIONALS', 'RACES', 'Elements', 'Gear',
    'Progression', 'Abilities', 'Unit', 'AI', 'Meter', 'Hex', 'Quests', 'Battle', 'BattleState', 'GameState'];
  vm.runInContext(
    `Object.assign(globalThis, { ${EXPORTS.map((n) =>
      `${n}: typeof ${n} !== 'undefined' ? ${n} : undefined`).join(', ')} });`,
    ctx);
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
