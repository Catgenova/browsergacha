// Roster invariants. These are the rules that keep 385 heroes from
// quietly collapsing into each other or shipping broken text — the
// kind of thing that is invisible in review and obvious in play.

const fs = require('fs');
const path = require('path');
const { loadGame, test, assert, report, ROOT, FILES } = require('./harness');
const g = loadGame();
const { HEROES, BOSSES, POSITIONALS, RACES, Elements, POSITION, Quests,
  ACHIEVEMENTS, GameState, ELEMENTS, Gear } = g;

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

test('every race pack mirrors its gear set, tier for tier', () => {
  const races = new Set(heroes.map((h) => RACES.of(h)));
  for (const r of races) {
    assert(RACES.NAMES[r], `race ${r} has no display name`);
    const tiers = RACES.BONUSES[r] || [];
    if (r === 'human') {
      assert(tiers.length === 0, 'humans should have sects, not a race pack');
      continue;
    }
    assert(tiers.length >= 3, `race ${r} lacks tiers`);
    for (const t of tiers) {
      assert([3, 5, 7].includes(t.count), `${r}: tier at odd count ${t.count}`);
      assert(t.label && Object.keys(t.mods).length, `${r}: empty tier`);
    }
    // Humans have no gear set and no pack (they group into sects
    // instead); every other race's 3/5/7 tiers must be its set's
    // 2/4/6-piece bonuses exactly.
    if (r === 'human') continue;
    const set = Gear.SETS[r === 'drake' ? 'dragon' : r];
    assert(set, `race ${r} has no gear set to mirror`);
    assert(tiers.length === set.bonuses.length,
      `${r}: ${tiers.length} tiers vs ${set.bonuses.length} set bonuses`);
    set.bonuses.forEach((b, i) => {
      assert(tiers[i].count === b.pieces + 1,
        `${r}: tier ${i} at ${tiers[i].count}, set at ${b.pieces} pieces`);
      assert(tiers[i].mods[b.stat] === b.add,
        `${r}: tier ${i} ${b.stat} ${tiers[i].mods[b.stat]} != set ${b.add}`);
    });
  }
});

test('human sects hold real humans, once each, with their numbers', () => {
  const expected = {
    cryst: { number: 1, members: ['echo'] },
    hedge: { number: 3, members: ['vex', 'vivian', 'coral', 'emily'] },
    reverence: { number: 4, members: ['catherine', 'toll', 'javarious'] },
  };
  assert(Object.keys(RACES.SECTS).sort().join() === Object.keys(expected).sort().join(),
    `sects are ${Object.keys(RACES.SECTS).join(', ')}`);
  const seen = new Set();
  for (const [id, want] of Object.entries(expected)) {
    const sect = RACES.SECTS[id];
    assert(sect.number === want.number, `${id}: number ${sect.number}`);
    assert(sect.members.join() === want.members.join(),
      `${id}: members ${sect.members.join(', ')}`);
    for (const m of sect.members) {
      assert(HEROES[m], `${id}: unknown hero ${m}`);
      assert(RACES.of(HEROES[m]) === 'human', `${id}: ${m} is not human`);
      assert(!seen.has(m), `${m} stands in two sects`);
      seen.add(m);
      assert(RACES.sectOf(HEROES[m]) === sect, `sectOf(${m}) misses`);
    }
  }
  assert(RACES.sectOf(HEROES.florence) === null, 'Florence has no sect yet');
});

test('every hero resolves a full tag line', () => {
  const w = loadGame();
  const T = w.Tags;
  for (const h of heroes) {
    const tags = T.of(h);
    const kinds = tags.map((t) => t.kind);
    assert(kinds[0] === 'role', `${h.id}: first tag is ${kinds[0]}`);
    assert(/^(Front Line|Center|Back Line) (DPS|Tank|Support)$/.test(tags[0].text),
      `${h.id}: role tag "${tags[0].text}"`);
    assert(kinds.includes('race'), `${h.id}: no race/sect tag`);
    assert(kinds.includes('element'), `${h.id}: no element tag`);
    assert(T.html(h).includes('hero-tag'), `${h.id}: html renders nothing`);
  }
  // Spot checks: the labels the tags exist to communicate.
  const text = (id) => T.of(w.HEROES[id]).map((t) => t.text).join(' | ');
  assert(/Support/.test(text('emily')) && /Healer/.test(text('emily')),
    `Emily should read as a healing support: ${text('emily')}`);
  assert(/Front Line DPS/.test(text('javarious')) && /Shielder/.test(text('javarious')),
    `Javarious should read front-line DPS shielder: ${text('javarious')}`);
  assert(/Reverence Sect/.test(text('toll')), `Toll should carry his sect: ${text('toll')}`);
  assert(/Debuffer/.test(text('vex')) && /Hedge Sect/.test(text('vex')),
    `Vex should read debuffer of the Hedge: ${text('vex')}`);
});

test('the lifetime book pays about thirty thousand Diamonds, in tens', () => {
  const total = ACHIEVEMENTS.LIST.reduce((n, a) => n + (a.reward.diamonds || 0), 0);
  assert(total >= 29000 && total <= 31000,
    `achievement diamonds total ${total}, expected ~30,000`);
  for (const a of ACHIEVEMENTS.LIST) {
    const d = a.reward.diamonds;
    if (d) assert(d % 10 === 0 && d >= 10, `${a.id}: diamond reward ${d} not a clean ten`);
  }
  for (const [type, list] of Object.entries(Quests.DEFS)) {
    for (const q of list) {
      const d = q.reward.diamonds;
      if (d) assert(d % 10 === 0, `${type}/${q.id}: diamond reward ${d} not a clean ten`);
    }
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
  for (const field of ['level', 'xp', 'stars', 'equipment', 'skills']) {
    assert(guard.includes(`entry.${field}`),
      `load() never guarantees roster entry.${field}`);
  }
  // ...and the starters actually turn up as heroes.
  for (const uid of GameState.ownedHeroIds()) {
    const e = GameState.progressOf(uid);
    assert(e.heroId && GameState.defOf(uid), `roster ${uid} names no character`);
    assert(Number.isFinite(e.level) && Number.isFinite(e.stars),
      `roster ${uid} loaded without a level or star rating`);
  }
});

test('an old save survives the move from copies to heroes', () => {
  // Schema 6 and earlier kept one entry per CHARACTER with a duplicate
  // counter. Migration 7 turns each of those counters into real heroes,
  // and the team has to follow its hero to its new id.
  const old = loadGame({ save: {
    schemaVersion: 6,
    roster: {
      florence: { copies: 3, level: 20, stars: 4, equipment: {}, skills: { 0: 3 } },
      rat_archer: { copies: 1, level: 5, stars: 1 },
    },
    team: { 1: 'florence' },
    presets: [{ name: 'Old', team: { 1: 'florence' } }],
    tomes: 12,
  } });
  const S = old.GameState;
  assert(S.countOf('florence') === 3,
    `three Florences expected, got ${S.countOf('florence')}`);
  assert(S.countOf('rat_archer') === 1, 'the single hero was duplicated');

  // The one that was levelled is still the levelled one.
  const florences = S.uidsOf('florence').map((uid) => S.progressOf(uid));
  const best = florences.find((p) => p.level === 20);
  assert(best && best.stars === 4, 'the levelled Florence lost her progress');
  assert(florences.filter((p) => p.level === 1).length === 2,
    'the spare copies did not come back as fresh heroes');

  // The team pointed at a character id; it points at that hero now.
  const teamUid = S.getTeam()[1];
  assert(teamUid && S.defIdOf(teamUid) === 'florence',
    `the team lost its hero: ${JSON.stringify(S.getTeam())}`);
  assert(S.progressOf(teamUid).level === 20, 'the team got handed a fresh copy');
  assert(S.presets()[0].team[1] === teamUid, 'the preset was not repointed');
  assert(S.tomes === undefined, 'skill tomes survived the migration');
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




// ---- Quests and achievements ---------------------------------------------

test('every quest names a real counter and pays something', () => {
  const COUNTERS = new Set(['wins', 'huntWins', 'bossWins', 'campaignWins',
    'towerFloors', 'summons', 'starUps', 'polishes', 'enchants', 'salvages',
    'rerolls', 'flawless', 'synergyWins', 'fullSynergyWins']);
  const seen = new Set();
  for (const [type, list] of Object.entries(Quests.DEFS)) {
    for (const q of list) {
      assert(!seen.has(q.id), `duplicate quest id ${q.id}`);
      seen.add(q.id);
      assert(COUNTERS.has(q.counter),
        `${type}/${q.id}: counter "${q.counter}" is never bumped by the game`);
      assert(q.goal > 0, `${type}/${q.id}: goal ${q.goal}`);
      assert(Object.keys(q.reward || {}).length > 0, `${type}/${q.id}: no reward`);
    }
  }
});

test('the campaign difficulty tiers climb the way they are advertised', () => {
  const { Campaign, CAMPAIGN, Gear } = g;
  const chapters = CAMPAIGN.CHAPTERS;
  const first = chapters[0];
  const last = chapters[chapters.length - 1];
  const waveOf = (ch) => ch.nodes.find((n) => n.type === 'skirmish' || n.type === undefined)
    || ch.nodes.find((n) => n.type !== 'boss');

  for (const [tierId, from, to] of [['hard', 50, 80], ['expert', 80, 100]]) {
    assert(Campaign.levelFor(waveOf(first), tierId) === from,
      `${tierId} should start at Lv ${from}, got ${Campaign.levelFor(waveOf(first), tierId)}`);
    assert(Campaign.levelFor(waveOf(last), tierId) === to,
      `${tierId} should end at Lv ${to}, got ${Campaign.levelFor(waveOf(last), tierId)}`);

    // Monotonic across the chapters, and the holder rides the same band.
    let prev = 0;
    for (const ch of chapters) {
      const lv = Campaign.levelFor(waveOf(ch), tierId);
      assert(lv >= prev, `${tierId}: ${ch.id} drops to Lv ${lv} from ${prev}`);
      prev = lv;
      const boss = Campaign.bossNode(ch);
      assert(Campaign.levelFor(boss, tierId) === lv,
        `${tierId}: ${ch.id} holder is Lv ${Campaign.levelFor(boss, tierId)}, wave is Lv ${lv}`);
      // Every hex filled, and a full set of gear that can hold its level.
      assert(Campaign.sizeFor(waveOf(ch), tierId) === 7,
        `${tierId}: ${ch.id} fields ${Campaign.sizeFor(waveOf(ch), tierId)}, not a full formation`);
      const worn = Campaign.gearFor(waveOf(ch), tierId, HEROES.rat_archer);
      assert(worn.length === Gear.SLOTS.length, `${tierId}: ${ch.id} gear has ${worn.length} pieces`);
      for (const piece of worn) {
        assert(piece.level <= Gear.RARITIES[piece.rarity].maxLevel,
          `${tierId}: ${ch.id} ${piece.rarity} piece at Lv ${piece.level} exceeds its cap`);
      }
    }
  }

  // Normal is untouched: the tiers are a re-run, not a re-tuning.
  assert(Campaign.sizeFor(waveOf(first), 'normal') < 7, 'normal now fields a full formation');
  assert(Campaign.gearFor(waveOf(first), 'normal', HEROES.rat_archer).length === 0,
    'normal enemies were handed gear');

  // Deterministic: the fight you lost to is the fight you come back to.
  const a = JSON.stringify(Campaign.gearFor(waveOf(first), 'hard', HEROES.rat_archer));
  const b2 = JSON.stringify(Campaign.gearFor(waveOf(first), 'hard', HEROES.rat_archer));
  assert(a === b2, 'enemy gear is not stable between reads');
});

test('attunement costs and drops follow the ladder they advertise', () => {
  const { Attune, ELEMENTAL_BOSSES, ELEMENTS } = g;

  // The costs the design names, and a sane fill for the steps between.
  const named = { 1: ['small', 5], 3: ['small', 15], 4: ['medium', 5],
    6: ['medium', 15], 7: ['large', 5], 10: ['large', 20] };
  for (const [step, [size, n]] of Object.entries(named)) {
    const c = Attune.COST[step];
    assert(c && c.size === size && c.n === n,
      `attunement ${step} should cost ${n} ${size}, got ${JSON.stringify(c)}`);
  }
  for (let i = 1; i <= Attune.MAX; i++) {
    assert(Attune.COST[i], `attunement ${i} has no cost`);
  }
  assert(!Attune.costFor(Attune.MAX), 'there is an 11th attunement');
  assert(Math.abs(Attune.statMult(Attune.MAX) - 2) < 1e-9,
    `full attunement should double base stats, got ${Attune.statMult(Attune.MAX)}`);
  assert(Math.abs(Attune.statMult(1) - 1.1) < 1e-9, 'one step should be +10%');

  // Bands: small through 8, medium through 15, large to the top, and the
  // upgrade chance climbs inside each band rather than sitting flat.
  for (const [stage, size] of [[1, 'small'], [8, 'small'], [9, 'medium'],
    [15, 'medium'], [16, 'large'], [20, 'large']]) {
    assert(Attune.bandFor(stage).base === size,
      `stage ${stage} should pay ${size}, pays ${Attune.bandFor(stage).base}`);
  }
  assert(Attune.upgradeChance(8) > Attune.upgradeChance(1),
    'the medium chance does not grow across floors 1-8');
  assert(Attune.upgradeChance(15) > Attune.upgradeChance(9),
    'the large chance does not grow across floors 9-15');
  assert(Attune.upgradeChance(20) === 0, 'the top band upgrades into nothing');
  assert(Attune.quantityFor(20) > Attune.quantityFor(16),
    'the top band does not pay more the higher you climb');

  // A roll only ever pays its own band's size or one step up.
  for (const stage of [1, 8, 9, 15, 16, 20]) {
    const band = Attune.bandFor(stage);
    for (let i = 0; i < 40; i++) {
      const r = Attune.roll(stage);
      const total = r.small + r.medium + r.large;
      assert(total === Attune.quantityFor(stage),
        `stage ${stage} paid ${total} of an expected ${Attune.quantityFor(stage)}`);
      for (const size of Attune.SIZES) {
        if (size === band.base || size === band.up) continue;
        assert(r[size] === 0, `stage ${stage} paid ${size}, outside its band`);
      }
    }
  }

  // One boss per element, each with a full kit.
  const elements = Object.keys(ELEMENTS);
  const covered = Object.values(ELEMENTAL_BOSSES).map((b) => b.element);
  for (const el of elements) {
    assert(covered.includes(el), `no elemental boss for ${el}`);
  }
  for (const b of Object.values(ELEMENTAL_BOSSES)) {
    assert(b.isBoss && b.isElemental, `${b.id} is not flagged as an elemental boss`);
    assert((b.abilities || []).length === 3, `${b.id} has ${(b.abilities || []).length} abilities`);
    assert((b.passives || []).length === 3, `${b.id} has ${(b.passives || []).length} passives`);
    assert(b.stats5 && b.stats100, `${b.id} has no stage anchors`);
    assert(b.stats100.hp > b.stats5.hp, `${b.id} does not grow with stages`);
  }
});

test('a hero attunes only in its own element, up to its stars', () => {
  const { GameState, Attune, HEROES, Elements } = g;
  const fire = Object.values(HEROES).find((h) => h.element === 'fire' && (h.rarity || 1) === 3);
  assert(fire, 'no 3-star fire hero to test with');
  const uid = GameState.addHero(fire.id).uid;

  assert(GameState.attunementOf(uid) === 0, 'a new hero starts attuned');
  assert(GameState.attune(uid) === null, 'attuned with an empty purse');

  // The purse is per element: water does not buy a fire attunement.
  GameState.addElements('water', { small: 999 });
  assert(GameState.attune(uid) === null, 'the wrong element paid for an attunement');

  GameState.addElements('fire', { small: 999, medium: 999, large: 999 });
  const stars = GameState.progressOf(uid).stars;
  for (let i = 1; i <= stars; i++) {
    const r = GameState.attune(uid);
    assert(r && r.to === i, `attunement ${i} failed: ${JSON.stringify(r)}`);
  }
  // Capped by the star rating, not by the purse.
  assert(GameState.attunementOf(uid) === stars, 'attunement passed the star cap');
  assert(GameState.nextAttunement(uid) === null, 'a capped hero was offered more');
  assert(GameState.attune(uid) === null, 'a capped hero attuned anyway');

  // And it actually moves the statline the battle builds.
  const plain = new g.Unit(fire, g.TEAM.PLAYER, { level: 20, stars, attune: 0 });
  const tuned = new g.Unit(fire, g.TEAM.PLAYER, { level: 20, stars, attune: stars });
  const want = Attune.statMult(stars);
  assert(Math.abs(tuned.baseAtk / plain.baseAtk - want) < 0.02,
    `expected ${want}x ATK, got ${(tuned.baseAtk / plain.baseAtk).toFixed(3)}`);
  assert(tuned.speed === plain.speed, 'attunement moved speed');
});

test('every quest and achievement reward can be shown and paid', () => {
  // A reward the label function does not know about renders as an empty
  // column, and one the grant function does not know about pays nothing
  // when claimed. Both are silent: the quest still reads as complete.
  const PURSE = ['diamonds', 'scrollsCommon', 'scrollsRare', 'scrollsTemporal',
    'whetstones', 'arcana', 'tomes'];
  const purse = () => Object.fromEntries(PURSE.map((k) => [k, GameState[k]]));

  for (const [type, list] of Object.entries(Quests.DEFS)) {
    for (const q of list) {
      assert(Quests.rewardLabel(q.reward) !== '',
        `${type}/${q.id}: reward ${JSON.stringify(q.reward)} renders as nothing`);
      const before = purse();
      Quests.grant(q.reward);
      const moved = PURSE.some((k) => GameState[k] !== before[k]);
      assert(moved, `${type}/${q.id}: granting ${JSON.stringify(q.reward)} paid nothing`);
    }
  }

  for (const a of ACHIEVEMENTS.LIST) {
    assert(ACHIEVEMENTS.rewardText(a.reward) !== '',
      `${a.id}: reward ${JSON.stringify(a.reward)} renders as nothing`);
    const before = purse();
    GameState.claimAchievement(`probe_${a.id}`, a.reward);
    assert(PURSE.some((k) => GameState[k] !== before[k]),
      `${a.id}: claiming ${JSON.stringify(a.reward)} paid nothing`);
  }
});

test('every achievement resolves its progress on a fresh save', () => {
  const seen = new Set();
  for (const a of ACHIEVEMENTS.LIST) {
    assert(!seen.has(a.id), `duplicate achievement id ${a.id}`);
    seen.add(a.id);
    assert(a.name && a.detail && a.group, `${a.id}: missing name/detail/group`);
    // The list is built at load, and it reads Campaign and Gear while it
    // builds -- an ordering slip here is a blank achievements screen.
    const st = ACHIEVEMENTS.state(a);
    assert(Number.isFinite(st.have) && Number.isFinite(st.need) && st.need > 0,
      `${a.id}: progress ${JSON.stringify(st)}`);
    assert(ACHIEVEMENTS.rewardText(a.reward).length > 0, `${a.id}: no reward text`);
  }
});

test('the test harness loads game files in the order the page does', () => {
  // Load order is load-bearing: ACHIEVEMENTS reads the campaign's tier
  // list while it is being defined, so achievements.js after campaign.js
  // is a requirement, not a preference. If the harness and index.html
  // disagree, the tests pass on an order the browser never runs.
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const inPage = [...html.matchAll(/<script src="(js\/[^?"]+)/g)].map((m) => m[1]);
  let at = -1;
  for (const rel of FILES) {
    const i = inPage.indexOf(rel);
    assert(i >= 0, `${rel} is loaded by the harness but not by index.html`);
    assert(i > at, `${rel} loads before ${inPage[at]} in the harness ` +
      'but after it in index.html');
    at = i;
  }
});

test('lifetime stats survive a quest period rolling over', () => {
  const before = GameState.stat('wins');
  GameState.questBump('wins', 3);
  assert(GameState.stat('wins') === before + 3, 'lifetime total did not move');
  // Force the board onto a new period the way a date change would.
  GameState.questState('daily').period = 'not-today';
  GameState.questState('daily');
  assert(GameState.stat('wins') === before + 3,
    'the lifetime total reset along with the quest board');
});


test('nothing looks a boss up by its id', () => {
  // BOSSES is keyed by short name ("carrion_king") while each entry's
  // `id` is prefixed ("boss_carrion_king") -- the id is the save key for
  // stage progress, never an index into the table. A lookup by id is
  // silently undefined, and reading `.name` off it throws mid-victory,
  // which froze the board with the boss at 0 HP. Same shape for the
  // elemental bosses, whose `attuneId` *is* the key.
  for (const [key, def] of Object.entries(BOSSES)) {
    assert(def.id !== key, `${key}: boss id matches its key, so this test is moot`);
    assert(!BOSSES[def.id], `${key}: BOSSES is indexable by id`);
    assert(def.name, `${key}: no display name to carry`);
  }
  const dir = path.join(ROOT, 'js');
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    (e.isDirectory() ? walk(path.join(d, e.name))
      : e.name.endsWith('.js') ? [path.join(d, e.name)] : []));
  for (const abs of walk(dir)) {
    const rel = path.relative(ROOT, abs);
    const src = fs.readFileSync(abs, 'utf8');
    const bad = [...src.matchAll(/\bBOSSES\[([^\]]*)\]/g)]
      .filter((m) => /\bid\b/.test(m[1]));
    assert(bad.length === 0,
      `${rel}: indexes BOSSES by an id (${bad.map((m) => m[0]).join(', ')})`);
  }
});

report();
