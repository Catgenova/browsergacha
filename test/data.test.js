// Roster invariants. These are the rules that keep 385 heroes from
// quietly collapsing into each other or shipping broken text — the
// kind of thing that is invisible in review and obvious in play.

const { loadGame, test, assert, report } = require('./harness');
const g = loadGame();
const { HEROES, BOSSES, POSITIONALS, RACES, Elements, POSITION } = g;

const heroes = Object.values(HEROES);
const passivesOf = (d) => d.passives || (d.passive ? [d.passive] : []);
const fingerprint = (a) =>
  JSON.stringify([a.targeting, a.cooldown, a.effects, a.selfEffects || null]);
const hookPrint = (p) =>
  Object.entries(p.hooks || {}).map(([k, v]) => `${k}:${String(v)}`).join('|');

// ---- Shape ---------------------------------------------------------------

test('every hero has the full contract', () => {
  for (const h of heroes) {
    assert(h.id && h.name, `hero missing id/name: ${JSON.stringify(h).slice(0, 60)}`);
    assert(h.rarity >= 1 && h.rarity <= 5, `${h.id}: bad rarity ${h.rarity}`);
    assert(h.element, `${h.id}: no element`);
    assert((h.abilities || []).length === 3, `${h.id}: ${(h.abilities || []).length} abilities`);
    assert(passivesOf(h).length >= 1, `${h.id}: no passive`);
    assert(h.positional, `${h.id}: no positional`);
    assert(h.stats && h.stats.hp > 0, `${h.id}: no stats`);
  }
});

test('hero object keys match their ids', () => {
  for (const [key, h] of Object.entries(HEROES)) {
    assert(key === h.id, `key ${key} holds id ${h.id}`);
  }
});

// ---- Uniqueness ----------------------------------------------------------

test('no two heroes share an ability id', () => {
  const seen = new Map();
  for (const h of heroes) for (const a of h.abilities) {
    assert(!seen.has(a.id), `${h.id}/${a.id} duplicates ${seen.get(a.id)}`);
    seen.set(a.id, h.id);
  }
});

test('no two heroes share an ability name', () => {
  const seen = new Map();
  for (const h of heroes) for (const a of h.abilities) {
    assert(!seen.has(a.name), `"${a.name}": ${h.id} and ${seen.get(a.name)}`);
    seen.set(a.name, h.id);
  }
});

test('no two abilities are mechanically identical', () => {
  const seen = new Map();
  for (const h of heroes) for (const a of h.abilities) {
    const fp = fingerprint(a);
    assert(!seen.has(fp), `${h.id}/${a.id} plays exactly like ${seen.get(fp)}`);
    seen.set(fp, `${h.id}/${a.id}`);
  }
});

test('no two heroes share a passive name or behavior', () => {
  const names = new Map(), prints = new Map();
  for (const h of heroes) for (const p of passivesOf(h)) {
    assert(!names.has(p.name), `passive "${p.name}": ${h.id} and ${names.get(p.name)}`);
    names.set(p.name, h.id);
    const fp = hookPrint(p);
    if (!fp) continue;
    assert(!prints.has(fp), `${h.id}'s passive behaves exactly like ${prints.get(fp)}'s`);
    prints.set(fp, h.id);
  }
});

// ---- Text ----------------------------------------------------------------

test('no escaped-unicode or literal escapes in player-facing text', () => {
  const bad = [];
  const check = (who, text) => {
    if (typeof text === 'string' && /\\u[0-9a-fA-F]{4}|\\n|\\t/.test(text)) {
      bad.push(`${who}: ${text.slice(0, 60)}`);
    }
  };
  for (const h of heroes) {
    check(h.id, h.name); check(h.id, h.title);
    for (const a of h.abilities) { check(h.id, a.name); check(h.id, a.description); }
    for (const p of passivesOf(h)) { check(h.id, p.name); check(h.id, p.description); }
    check(h.id, h.positional.description);
  }
  for (const P of Object.values(POSITIONALS)) {
    check(P.id, P.name); check(P.id, P.description);
  }
  assert(bad.length === 0, bad.slice(0, 4).join(' | '));
});

test('every ability and passive has a description', () => {
  for (const h of heroes) {
    for (const a of h.abilities) assert(a.description, `${h.id}/${a.id} has no description`);
    for (const p of passivesOf(h)) assert(p.description, `${h.id} passive "${p.name}" has none`);
  }
});

// ---- Positioning ---------------------------------------------------------

test('positionals name a real hex and carry text', () => {
  const valid = new Set(Object.values(POSITION));
  for (const h of heroes) {
    const p = h.positional;
    assert(valid.has(p.position), `${h.id}: bad position ${p.position}`);
    assert(p.description, `${h.id}: positional has no description`);
  }
});

test('passives never gate on the hero own hex (that is the positional layer)', () => {
  const offenders = [];
  for (const h of heroes) for (const p of passivesOf(h)) {
    const src = Object.values(p.hooks || {}).map(String).join('\n');
    if (/unit\.slot|positionalActive/.test(src)) offenders.push(`${h.id}/${p.name}`);
  }
  assert(offenders.length === 0, offenders.join(', '));
});

test('every positional archetype is used by someone', () => {
  const used = new Set(heroes.map((h) => h.positional.id).filter(Boolean));
  const unused = Object.keys(POSITIONALS).filter((k) => !used.has(k));
  assert(unused.length === 0, `unused: ${unused.join(', ')}`);
});

// ---- Races and elements --------------------------------------------------

test('every hero belongs to a race', () => {
  const raceless = heroes.filter((h) => !RACES.of(h)).map((h) => h.id);
  assert(raceless.length === 0, `raceless: ${raceless.slice(0, 6).join(', ')}`);
});

test('every race with heroes has a name and three bonus tiers', () => {
  const races = new Set(heroes.map((h) => RACES.of(h)));
  for (const r of races) {
    assert(RACES.NAMES[r], `race ${r} has no display name`);
    assert((RACES.BONUSES[r] || []).length === 3, `race ${r} lacks 3 tiers`);
  }
});

test('elements are real, and Dark/Light are always 3-star or better', () => {
  const known = new Set([...Elements.BASIC, ...Elements.TEMPORAL]);
  for (const h of heroes) {
    assert(known.has(h.element), `${h.id}: unknown element ${h.element}`);
    if (Elements.TEMPORAL.includes(h.element)) {
      assert(h.rarity >= 3, `${h.id} is a ${h.rarity}-star ${h.element} hero`);
    }
  }
});

// ---- Bosses --------------------------------------------------------------

test('bosses declare scaling anchors, a gear set and passives', () => {
  for (const b of Object.values(BOSSES)) {
    assert(b.stats5 && b.stats100, `${b.id}: missing stage anchors`);
    assert(b.gearSet, `${b.id}: no gear set to drop`);
    assert((b.abilities || []).length >= 1, `${b.id}: no abilities`);
    assert(passivesOf(b).length >= 1, `${b.id}: no passives`);
  }
});

test('a brand-new save yields complete roster entries', () => {
  // Fresh saves stamp the current schema and run no migrations, so the
  // defaults themselves have to be complete — a hero that loads without
  // a level renders as "Lv undefined".
  const src = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'js/state.js'), 'utf8');
  const guard = src.slice(src.indexOf('Shape guards'));
  for (const field of ['copies', 'level', 'xp', 'stars', 'equipment', 'skills']) {
    assert(guard.includes(`entry.${field}`),
      `load() never guarantees roster entry.${field}`);
  }
});


test('every campaign chapter is a well-formed, walkable graph', () => {
  const { CAMPAIGN, BOSSES, LOCATION_ENEMIES, CONFIG } = g;
  const problems = [];
  const seenIds = new Set();
  for (const ch of CAMPAIGN.CHAPTERS) {
    if (!BOSSES[ch.boss]) problems.push(`${ch.id}: unknown boss ${ch.boss}`);
    if (!LOCATION_ENEMIES[ch.location]) problems.push(`${ch.id}: location ${ch.location} has no enemies`);
    if (!CONFIG.LOCATION_NAMES[ch.location]) problems.push(`${ch.id}: location ${ch.location} has no name`);
    if (!ch.intro || !ch.outro) problems.push(`${ch.id}: missing story text`);

    const ids = new Set(ch.nodes.map((n) => n.id));
    const bosses = ch.nodes.filter((n) => n.type === 'boss');
    if (bosses.length !== 1) problems.push(`${ch.id}: ${bosses.length} boss nodes`);
    const entries = ch.nodes.filter((n) => n.from.length === 0);
    if (entries.length !== 1) problems.push(`${ch.id}: ${entries.length} entrances`);

    const cells = new Set();
    for (const n of ch.nodes) {
      if (seenIds.has(n.id)) problems.push(`duplicate node id ${n.id}`);
      seenIds.add(n.id);
      // A placeholder name means the shape grew past its name list.
      if (/^Stage \d+$/.test(n.name)) problems.push(`${n.id}: unnamed`);
      const cell = `${n.col},${n.row}`;
      if (cells.has(cell)) problems.push(`${ch.id}: two nodes at ${cell}`);
      cells.add(cell);
      for (const f of n.from) {
        if (!ids.has(f)) problems.push(`${n.id}: prerequisite ${f} is not in this chapter`);
      }
    }

    // Every node must be reachable from the entrance, or it is content
    // nobody can ever open.
    const seen = new Set([entries[0] && entries[0].id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const n of ch.nodes) {
        if (seen.has(n.id)) continue;
        if (n.from.some((f) => seen.has(f))) { seen.add(n.id); grew = true; }
      }
    }
    for (const n of ch.nodes) {
      if (!seen.has(n.id)) problems.push(`${n.id}: unreachable`);
    }
  }
  assert(problems.length === 0, problems.slice(0, 6).join(' | '));
});

test('campaign difficulty rises across and within chapters', () => {
  const { CAMPAIGN, Campaign } = g;
  const problems = [];
  let prevBossLevel = 0;
  for (const ch of CAMPAIGN.CHAPTERS) {
    const boss = Campaign.bossNode(ch);
    const bossLv = Campaign.levelFor(boss);
    const entry = ch.nodes.find((n) => n.from.length === 0);
    if (Campaign.levelFor(entry) >= bossLv) {
      problems.push(`${ch.id}: entrance is not easier than the holder`);
    }
    if (bossLv <= prevBossLevel) {
      problems.push(`${ch.id}: holder at Lv ${bossLv} is not past the last one (${prevBossLevel})`);
    }
    prevBossLevel = bossLv;
    // An elite must out-weigh an ordinary node at the same depth.
    for (const e of ch.nodes.filter((n) => n.type === 'elite')) {
      const peer = ch.nodes.find((n) => n.type === 'normal' && n.depth === e.depth);
      if (peer && Campaign.levelFor(e) <= Campaign.levelFor(peer)) {
        problems.push(`${e.id}: elite is no harder than ${peer.id}`);
      }
    }
  }
  assert(prevBossLevel <= 100, `the final holder is Lv ${prevBossLevel}, past the level cap`);
  assert(problems.length === 0, problems.slice(0, 5).join(' | '));
});

test('every campaign node pays a first-clear scroll, graded by node type', () => {
  const { CAMPAIGN, Campaign } = g;
  const WANT = { normal: 'common', elite: 'rare', boss: 'temporal' };
  const problems = [];
  const seen = new Set();
  for (const ch of CAMPAIGN.CHAPTERS) {
    for (const n of ch.nodes) {
      const bonus = Campaign.firstClearBonus(n);
      const scrolls = bonus.scrolls || {};
      const kinds = Object.keys(scrolls);
      const want = WANT[n.type];
      if (!want) { problems.push(`${n.id}: unknown node type ${n.type}`); continue; }
      seen.add(n.type);
      // Exactly one kind, the right one, and at least one of it — a node
      // that pays nothing is a fight with no first-clear reason to exist.
      if (kinds.length !== 1 || kinds[0] !== want) {
        problems.push(`${n.id} (${n.type}): pays ${JSON.stringify(scrolls)}, expected ${want}`);
      } else if (!(scrolls[want] >= 1)) {
        problems.push(`${n.id}: ${want} scroll count is ${scrolls[want]}`);
      }
      if (!bonus.label) problems.push(`${n.id}: first-clear bonus has no label`);
      // Gear is the boss ladder's business — the campaign pays scrolls.
      if (bonus.gear) problems.push(`${n.id}: still offers gear`);
    }
  }
  assert(problems.length === 0, problems.slice(0, 6).join(' | '));
  for (const type of Object.keys(WANT)) {
    assert(seen.has(type), `no ${type} node exists, so its grade is untested`);
  }
});

test('next mission follows the road, then the map, then the next chapter', () => {
  const { CAMPAIGN, Campaign, GameState } = g;
  const ch = CAMPAIGN.CHAPTERS[0];
  const entry = ch.nodes.find((n) => n.from.length === 0);

  // Nothing cleared yet: after the entrance, the next fight is one it
  // actually feeds.
  const first = Campaign.nextMission(entry);
  assert(first, 'no next mission after the entrance');
  assert(first.from.includes(entry.id),
    `next mission ${first.id} does not follow on from ${entry.id}`);

  // Walk the whole chapter; every step must offer somewhere to go, and
  // never a node that is cleared or still locked.
  let at = entry;
  const visited = new Set();
  for (let i = 0; i < ch.nodes.length; i++) {
    GameState.recordCampaignClear(at.id);
    visited.add(at.id);
    const next = Campaign.nextMission(at);
    if (!next) break;
    assert(!Campaign.nodeCleared(next), `${next.id} is already cleared`);
    assert(Campaign.nodeUnlocked(next), `${next.id} is still locked`);
    at = next;
  }
  assert(visited.size === ch.nodes.length,
    `walked ${visited.size} of ${ch.nodes.length} nodes before running dry`);

  // Chapter finished: the next mission is the following chapter's gate.
  const boss = Campaign.bossNode(ch);
  const across = Campaign.nextMission(boss);
  assert(across, 'no next mission after clearing the chapter');
  assert(Campaign.chapterFor(across.id) === CAMPAIGN.CHAPTERS[1],
    `expected chapter two, got ${across.id}`);
  assert(across.from.length === 0, `${across.id} is not a chapter entrance`);

  // And the last chapter ends the road rather than wrapping around.
  const last = CAMPAIGN.CHAPTERS[CAMPAIGN.CHAPTERS.length - 1];
  for (const n of last.nodes) GameState.recordCampaignClear(n.id);
  assert(Campaign.nextMission(Campaign.bossNode(last)) === null,
    'the final chapter offered a next mission');
});

test('every hero classifies into exactly one of the six archetypes', () => {
  const { HEROES } = g;
  const bench = require('./archetypes');
  const counts = {};
  const problems = [];
  for (const def of Object.values(HEROES)) {
    const key = bench.archetypeOf(def);
    if (!bench.ARCHETYPES.includes(key)) {
      problems.push(`${def.id}: landed in "${key}", which is not an archetype`);
      continue;
    }
    counts[key] = (counts[key] || 0) + 1;
    // A hero must be able to post the number its bucket is ranked on, or
    // it is being compared on something it cannot do. Supports are the
    // exception: a cleanse-only kit is a real support that never heals,
    // and the bench labels those rather than flagging them.
    const headline = bench.HEADLINE[key];
    if (headline === 'dps' && !bench.kitCan(def, headline)) {
      problems.push(`${def.id}: binned as ${key} but deals no damage`);
    }
  }
  assert(problems.length === 0, problems.slice(0, 6).join(' | '));
  for (const key of bench.ARCHETYPES) {
    assert(counts[key] >= 4,
      `${key} holds ${counts[key] || 0} heroes — too few to compare against`);
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  assert(total === Object.keys(HEROES).length,
    `${total} heroes classified out of ${Object.keys(HEROES).length}`);
});

test('ability descriptions quote the numbers the ability actually applies', () => {
  const { HEROES, BOSSES, ENEMIES } = g;
  // Rescaling DoT once already left 82 descriptions quoting the old
  // numbers, so the text and the effect are checked against each other.
  const pct = (x) => String(Math.round(x * 1000) / 10);
  const problems = [];
  const pools = [HEROES, BOSSES, ENEMIES];
  for (const pool of pools) {
    for (const def of Object.values(pool)) {
      for (const ab of def.abilities || []) {
        // Poison and healing both scale off a single figure that the
        // text repeats, so the two can be checked against each other.
        const eff = (ab.effects || []).find((e) => e.type === 'dot') ||
          (ab.effects || []).find((e) => e.type === 'heal');
        if (!eff || !ab.description) continue;
        const value = eff.type === 'dot' ? eff.pct : eff.mult;
        // The number may be written 60 or 60.0; accept either, and allow
        // a description that deliberately gives no figure at all.
        const quoted = [...ab.description.matchAll(/(\d+(?:\.\d+)?)%/g)]
          .map((m) => m[1].replace(/\.0$/, ''));
        if (quoted.length === 0) continue;
        if (!quoted.includes(pct(value))) {
          problems.push(`${def.id}/${ab.id}: applies ${pct(value)}% but says ` +
            `"${ab.description.slice(0, 60)}"`);
        }
      }
    }
  }
  assert(problems.length === 0,
    `${problems.length} stale: ` + problems.slice(0, 4).join(' | '));
});

report();
