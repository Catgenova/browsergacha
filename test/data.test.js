// Roster invariants. These are the rules that keep the roster from
// quietly collapsing into each other or shipping broken text — the
// kind of thing that is invisible in review and obvious in play.

const fs = require('fs');
const path = require('path');
const { loadGame, test, assert, report, ROOT, FILES } = require('./harness');
const g = loadGame();
const { HEROES, BOSSES, POSITIONALS, RACES, Elements, POSITION, Quests,
  ACHIEVEMENTS, GameState, ELEMENTS, Gear, Progression, DUMMIES } = g;

const heroes = Object.values(HEROES);
const passivesOf = (d) => d.passives || (d.passive ? [d.passive] : []);
const fingerprint = (a) =>
  JSON.stringify([a.targeting, a.cooldown, a.effects, a.selfEffects || null,
    a.chain || null]);
const hookPrint = (p) =>
  Object.entries(p.hooks || {}).map(([k, v]) => `${k}:${String(v)}`).join('|');

// ---- Shape ---------------------------------------------------------------

test('every hero has the full contract', () => {
  for (const h of heroes) {
    assert(h.id && h.name, `hero missing id/name: ${JSON.stringify(h).slice(0, 60)}`);
    assert(h.rarity >= 1 && h.rarity <= 5, `${h.id}: bad rarity ${h.rarity}`);
    assert(h.element, `${h.id}: no element`);
    // A hero carries one active per star, up to the three the slot
    // system has rungs for: a 1-star is a body with a knife, a 2-star
    // gets a second button, and 3-star and up carry the full kit. The
    // bottom of a sect is a character, not a smaller version of one --
    // its single skill IS the character, with no slot 2 or 3 to hide
    // behind.
    const wantSkills = Math.min(3, h.rarity);
    assert((h.abilities || []).length === wantSkills,
      `${h.id}: ${(h.abilities || []).length} abilities, a ${h.rarity}-star has ${wantSkills}`);
    // Slot 1 is always free to press. It is the only button a 1-star
    // owns and the fallback for everyone else, so a cooldown on it
    // would mean turns with nothing at all to do.
    assert(h.abilities[0].cooldown === 0,
      `${h.id}: skill 1 has a ${h.abilities[0].cooldown}-turn cooldown`);
    assert(passivesOf(h).length >= 1, `${h.id}: no passive`);
    assert(h.positional, `${h.id}: no positional`);
    assert(h.stats && h.stats.hp > 0, `${h.id}: no stats`);
  }
});

// Every sprite strip a hero points at is a file that is actually there.
//
// Filenames are whatever the artist uploaded and the case is not
// consistent -- Mendralidle.png next to kiriidle.png in the same folder
// -- and a served page is case-sensitive where a local filesystem check
// might not be. A wrong-case src does not throw: the hero silently
// falls back to the generated placeholder and looks fine in a test,
// which is exactly how one shipped before this check existed.
test('every sprite strip points at a file that exists', () => {
  const missing = [];
  for (const h of heroes) {
    const sp = h.sprite;
    if (!sp) continue;
    const srcs = [];
    for (const strip of Object.values(sp.strips || {})) {
      if (strip && strip.src) srcs.push(strip.src);
    }
    if (sp.src) srcs.push(sp.src); // legacy single-sheet defs
    for (const src of srcs) {
      // A src is a URL, so a filename with spaces in it arrives
      // percent-encoded (Wren's 'wrenskill%202%203.png' is a real file
      // called 'wrenskill 2 3.png'). Decode before touching the disk,
      // or this check invents a bug the browser does not have.
      const full = path.join(ROOT, decodeURIComponent(src));
      if (!fs.existsSync(full)) { missing.push(`${h.id}: ${src}`); continue; }
      // Case-exact, checked against the directory listing rather than
      // by stat: on a case-insensitive filesystem existsSync says yes
      // to a name the web server will say 404 to.
      const dir = path.dirname(full);
      const base = path.basename(full);
      if (!fs.readdirSync(dir).includes(base)) {
        missing.push(`${h.id}: ${src} (wrong case on disk)`);
      }
    }
  }
  assert(missing.length === 0, `sprite strips with no file:\n  ${missing.join('\n  ')}`);
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
  // The rule guards the GENERICS against accidental cloning. A named
  // hero's numbers are authored to spec (Silas's basic is exactly 115%,
  // which one rat also happens to swing; Coral's and Ari's basics are
  // both specced at a plain 110%), so any collision involving a named
  // hero is allowed; two GENERICS colliding is still an error.
  const named = new Set(['coral', 'emily', 'toll', 'echo', 'javarious',
    'catherine', 'vex', 'vivian', 'leonardo', 'oak', 'silas', 'eli', 'florence',
    'sawyer', 'polarus', 'andrew', 'angelica', 'ari', 'cain', 'bit', 'tanner',
    'lucian', 'franz', 'carl', 'esmerelda', 'slick', 'samuels', 'lin', 'koe', 'cleo', 'artur',
    'tumble', 'posie', 'galen', 'ilyra', 'ryn', 'imani', 'wren', 'asher']);
  const seen = new Map();
  for (const h of heroes) for (const a of h.abilities) {
    const fp = fingerprint(a);
    if (seen.has(fp)) {
      const other = seen.get(fp);
      assert(named.has(h.id) || named.has(other.heroId),
        `${h.id}/${a.id} plays exactly like ${other.label}`);
      continue;
    }
    seen.set(fp, { heroId: h.id, label: `${h.id}/${a.id}` });
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
  // The rule is about the CASTER: where a hero stands is the
  // positional layer's business, so a passive that quietly pays out
  // only from one hex is a positional wearing a passive's coat.
  // Reading where the TARGET stands is a different thing entirely —
  // Wren bills enemies for standing outside their own favoured hex —
  // so the check names the caster explicitly rather than banning the
  // idea of positions in passives altogether.
  const offenders = [];
  for (const h of heroes) for (const p of passivesOf(h)) {
    const src = Object.values(p.hooks || {}).map(String).join('\n');
    if (/unit\.slot|unit\.positionalActive/.test(src)) offenders.push(`${h.id}/${p.name}`);
  }
  assert(offenders.length === 0, offenders.join(', '));
});

// A per-battle bank (Balmor's bill, Orien's orb) has three places its
// ceiling can be written: the descriptor the renderer draws from, the
// hook that fills it, and the card the player reads. They used to be
// two independent copies and a card that mentioned no number at all.
// The descriptor is the source now, and this holds the other two to it.
test('every bank has a descriptor, and its card says what it holds', () => {
  const { HEROES } = g;
  const problems = [];
  // A word for each fraction the cards are allowed to say it in. A bank
  // is a fraction of max HP, and "an eighth" has to be as checkable as
  // "15%" or the prose quietly drifts off the number.
  const WORDS = { 0.125: ['an eighth', '12.5%'], 0.15: ['15%'], 0.20: ['a fifth', '20%'],
    0.25: ['a quarter', '25%'] };
  for (const h of Object.values(HEROES)) {
    const spends = (h.abilities || []).filter((a) =>
      (a.effects || []).some((e) => e.type === 'spendPouch'));
    const bank = [h.passive, ...(h.passives || [])].filter(Boolean)
      .map((p) => p.bank).find(Boolean);
    if (!spends.length && !bank) continue;
    if (spends.length && !bank) {
      problems.push(`${h.id}: spends a bank with no descriptor to draw`);
      continue;
    }
    if (!spends.length) {
      problems.push(`${h.id}: banks something nothing ever spends`);
      continue;
    }
    // The spend has to empty the property the descriptor names.
    for (const a of spends) {
      const e = a.effects.find((x) => x.type === 'spendPouch');
      const store = e.store || 'pouch';
      if (store !== bank.prop) {
        problems.push(`${h.id}/${a.id}: empties '${store}', the bank is '${bank.prop}'`);
      }
    }
    // And the card has to name the ceiling. A bank is invisible before a
    // fight starts, so the description is the only place a player can
    // learn what pressing the button is worth.
    const words = WORDS[bank.capPct];
    if (!words) {
      problems.push(`${h.id}: a ${bank.capPct} cap with no wording recorded for it`);
      continue;
    }
    for (const a of spends) {
      const text = a.description || '';
      if (!words.some((wd) => text.includes(wd))) {
        problems.push(`${h.id}/${a.id}: the card never says ${words[0]}`);
      }
    }
  }
  assert(problems.length === 0, problems.join('\n  '));
});

test('every positional archetype is used by someone', () => {
  // "Someone" includes the test-only enemy bodies in test/dummies.js:
  // they are fielded by the rules tests exactly as a hero is, so an
  // archetype only they wear is still exercised. An archetype nobody
  // at all wears is dead weight and gets deleted.
  const used = new Set([...heroes, ...Object.values(DUMMIES)]
    .map((h) => h.positional && h.positional.id).filter(Boolean));
  const unused = Object.keys(POSITIONALS).filter((k) => !used.has(k));
  assert(unused.length === 0, `unused: ${unused.join(', ')}`);
});

// ---- Races and elements --------------------------------------------------

test('every hero belongs to a race', () => {
  const raceless = heroes.filter((h) => !RACES.of(h)).map((h) => h.id);
  assert(raceless.length === 0, `raceless: ${raceless.slice(0, 6).join(', ')}`);
});

test('every sect holds one race, once each, with its number', () => {
  // Sects were a human institution until the Gulldiggers. The rule is
  // no longer "a sect is human" but "a sect is ONE race" -- the race is
  // declared per sect and every member has to answer to it.
  const expected = {
    cryst: { number: 1, members: ['polarus', 'echo', 'florence', 'andrew', 'angelica', 'ari', 'cain', 'bit', 'tanner',
      'coral'] },
    // DEFUNCT: the Hedge never grew past two. Vex went to the
    // Nightflowers and Coral to Cryst, each to the sect their element
    // already answered to. The entry stays so No. 3 is never reissued.
    hedge: { number: 3, defunct: true, members: [] },
    reverence: { number: 4, members: ['catherine', 'toll', 'javarious', 'leonardo', 'oak', 'silas', 'eli', 'emily', 'artur'] },
    // DEFUNCT: Sawyer was its only member and moved to the Nightflowers.
    // The entry stays so No. 2 is never reissued; the flag is what says
    // this is a closed order rather than an unfinished one.
    shadowflower: { number: 2, defunct: true, members: [] },
    firetroupe: { number: 5, members: ['lucian', 'franz', 'carl', 'esmerelda', 'slick', 'samuels', 'lin', 'koe', 'cleo'] },
    // Named and numbered ahead of its roster; members land as the
    // Nightflowers are wired.
    nightflower: { number: 6, members: ['sawyer', 'noctelle', 'sable', 'evelune',
      'lysandra', 'morrow', 'valere', 'lenore', 'dorian', 'vex'] },
    whisperchime: { number: 7, members: ['tumble', 'posie', 'galen', 'ilyra', 'ryn', 'vivian', 'imani', 'wren', 'asher'] },
    // The first non-human sect. Filled one bird at a time; the shape it
    // is being filled to is checked below.
    gulldigger: { number: 8, race: 'avian', members: ['hallow', 'ike', 'jack', 'phil', 'peck', 'talon', 'bo', 'wanda', 'polo'] },
    phoenixcourt: { number: 9, race: 'avian',
      members: ['korvid', 'kavit', 'flurry', 'barrington', 'stoddard',
                'stella', 'sarena', 'orri', 'chirp'] },
    // The wind bird sect, filling one bird at a time. The shape check
    // below is a CEILING, so it holds while the sect is part-built.
    razorwings: { number: 10, race: 'avian', members: ['tervan', 'nehru', 'cirrus', 'kiri', 'strix', 'calima', 'mendral', 'balmor', 'brannoc'] },
    // The light brood. No 1-star and no 2-star: the light and dark
    // orders run four 3-stars, three 4-stars and two 5-stars instead.
    sunbrood: { number: 11, race: 'avian', members: ['aurek', 'durn', 'nemeris', 'aster', 'rizzo', 'mavros', 'orien', 'solari', 'nestora'] },
    // The dark birds. Named, numbered and PACKED ahead of a single
    // hero: this sect has less free ground than any other on the roster
    // (its element already sells the whole make-a-debuff-stick axis and
    // the Nightflowers are already dark debuffs and death), so knowing
    // what the three tiers may not be was most of the design and it was
    // settled before the art arrived. Empty members is not defunct --
    // the flag below is what tells a closed order from an unfilled one.
    hollowbone: { number: 12, race: 'avian', members: ['necros', 'click', 'rend', 'crook', 'pox'] },
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
      const race = want.race || 'human';
      assert(RACES.of(HEROES[m]) === race, `${id}: ${m} is not ${race}`);
      assert(!seen.has(m), `${m} stands in two sects`);
      seen.add(m);
      assert(RACES.sectOf(HEROES[m]) === sect, `sectOf(${m}) misses`);
    }
  }
  assert(RACES.sectOf(HEROES.florence) === RACES.SECTS.cryst,
    'Tide marches with Cryst now');

  // Live and buried are different states, and the difference is
  // enforced rather than implied by an empty array. A standing order
  // has members; a closed one never gains any and never gives its
  // number away.
  for (const [id, want] of Object.entries(expected)) {
    const sect = RACES.SECTS[id];
    assert(!!sect.defunct === !!want.defunct,
      `${id}: defunct is ${!!sect.defunct}, expected ${!!want.defunct}`);
    if (sect.defunct) {
      assert(sect.members.length === 0,
        `${id} is a closed order but holds ${sect.members.length} hero(es)`);
    } else if (want.founding) {
      // Founded, numbered, packed, waiting on art. Neither standing nor
      // buried, and the flag has to be DECLARED on both sides -- a sect
      // that lost its roster to a bad edit still fails, because nothing
      // here infers "founding" from an empty array.
      assert(!!sect.founding, `${id} is expected to be a founding order and is not`);
      assert(sect.members.length === 0,
        `${id} is still marked founding but holds ${sect.members.length} hero(es)`);
    } else {
      assert(!sect.founding, `${id} is a filled order still marked founding`);
      assert(sect.members.length > 0, `${id} is a standing order with nobody in it`);
    }
  }
  // Numbers are unique across BOTH, so a buried order's designation is
  // spent and cannot be handed to a new sect.
  const numbers = Object.values(RACES.SECTS).map((s) => s.number);
  assert(new Set(numbers).size === numbers.length,
    `two sects share a number: ${numbers.sort((a, b) => a - b).join(', ')}`);

  // liveSects() is what anything offering sects as a CHOICE should ask
  // for -- a filter, a banner schedule, a list of where heroes come
  // from. It must not include a closed order.
  const live = RACES.liveSects().map((s) => s.id).sort();
  const wantLive = Object.entries(expected)
    .filter(([, w]) => !w.defunct).map(([id]) => id).sort();
  assert(live.join() === wantLive.join(),
    `liveSects() is ${live.join(', ')}`);

  // A non-human sect is built to a fixed shape rather than to whatever
  // rarities its members happened to be written at: 1/2/3/2/1 across
  // 1★ to 5★. Checked as a CEILING while the sect fills, so a bird
  // added at the wrong rarity fails the moment it lands rather than
  // eight heroes later.
  for (const [id, want] of Object.entries(expected)) {
    if (!want.race) continue;
    const sect = RACES.SECTS[id];
    // The shape is DECLARED on the sect rather than assumed from the
    // first one written. The Gulldiggers run 1/2/3/2/1; the Phoenix
    // Court runs three 2-stars and a single 4-star. Whatever a sect
    // declares, it has to hold to -- and it still has to add to nine.
    assert(sect.shape, `${id}: no declared star shape`);
    const have = {};
    for (const m of sect.members) {
      const r = HEROES[m].rarity;
      have[r] = (have[r] || 0) + 1;
      assert(have[r] <= (sect.shape[r] || 0),
        `${id}: ${have[r]} heroes at ${r}-star, its shape allows ${sect.shape[r] || 0}`);
    }
    const declared = Object.values(sect.shape).reduce((a, c) => a + c, 0);
    assert(declared === 9,
      `${id}: its shape adds to ${declared}, and a sect holds nine`);
    assert(sect.members.length <= 9,
      `${id}: ${sect.members.length} members, a sect holds nine`);
  }
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
  assert(/Debuffer/.test(text('vex')) && /Nightflower Sect/.test(text('vex')),
    `Vex should read debuffer of the Nightflowers: ${text('vex')}`);
  // Coral moved with her. Both tags follow membership, so a hero whose
  // sect closes must never be left reading the closed one.
  assert(/Cryst Sect/.test(text('coral')),
    `Coral should read Cryst: ${text('coral')}`);
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

test('every hero shares one base power budget, with nobody exempt', () => {
  // There is no exemption list any more. It used to grandfather thirty
  // named heroes onto their authored statlines, which made rarity mean
  // two different things depending on when a hero was written — an
  // exempt 3-star out-hit a balanced 5-star at their respective caps.
  //
  // One budget per SHELF now (js/data/balance.js): everybody is cut to
  // the same cloth and then scaled by what their rarity is worth. So the
  // invariant is no longer one number for the whole roster -- it is that
  // a shelf is uniform and that the shelves are ordered. Asserted that
  // way rather than against a magic figure per shelf, so re-pricing a
  // shelf does not mean re-typing this test.
  const byShelf = new Map();
  for (const h of heroes) {
    if (!byShelf.has(h.rarity)) byShelf.set(h.rarity, []);
    byShelf.get(h.rarity).push(h);
  }
  const middle = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const shelfPower = new Map();
  for (const [rarity, shelf] of byShelf) {
    const powers = shelf.map((h) => Progression.power(h.stats));
    const mid = middle(powers);
    shelfPower.set(rarity, mid);
    shelf.forEach((h, i) => {
      assert(Math.abs(powers[i] - mid) <= 20,
        `${h.id}: base power ${powers[i]}, off a ${rarity}-star shelf sitting at ${mid}`);
    });
  }
  const shelves = [...shelfPower.keys()].sort((a, b) => a - b);
  for (let i = 1; i < shelves.length; i++) {
    assert(shelfPower.get(shelves[i]) > shelfPower.get(shelves[i - 1]),
      `the ${shelves[i]}-star shelf (${shelfPower.get(shelves[i])}) does not sit above ` +
      `the ${shelves[i - 1]}-star one (${shelfPower.get(shelves[i - 1])})`);
  }

  // THE ENDGAME IS NOT INVERTED. This is the regression: the star
  // multiplier used to count only stars gained ABOVE base rarity, so at
  // the shared ceiling a 1-star had compounded nine times and a 5-star
  // five, and the cheap hero finished 2.44x ahead off an identical base.
  // Median power at 10 stars / level 100 ran 75,184 for a 1-star against
  // 20,906 for a 5-star. It has to climb with rarity, not fall.
  const powerAtTen = (h) => {
    const u = new g.Unit(h, g.TEAM.PLAYER, { level: 100, stars: 10 });
    return Progression.power({ hp: u.maxHp, atk: u.effectiveStat('atk'),
      def: u.effectiveStat('def'), speed: u.effectiveStat('speed') });
  };
  const ceiling = shelves.map((r) => middle(byShelf.get(r).map(powerAtTen)));
  for (let i = 1; i < ceiling.length; i++) {
    assert(ceiling[i] > ceiling[i - 1],
      `at 10 stars the ${shelves[i]}-star shelf reaches ${ceiling[i]}, ` +
      `at or under the ${shelves[i - 1]}-star shelf's ${ceiling[i - 1]}`);
  }

  // Rarity still separates them further up too: a 5-star climbs to a
  // level cap a 3-star never reaches.
  //
  // Measured as POWER, not as any single stat -- a glass-cannon 3-star
  // out-hits a wall 5-star on raw ATK by design, and always should.
  const powerAtCap = (h) => {
    const u = new g.Unit(h, g.TEAM.PLAYER, { level: Progression.maxLevel(h.rarity),
      stars: h.rarity });
    return Progression.power({ hp: u.maxHp, atk: u.effectiveStat('atk'),
      def: u.effectiveStat('def'), speed: u.effectiveStat('speed') });
  };
  // Every hero, held against itself: more stars is strictly more hero.
  for (const h of heroes.slice(0, 8)) {
    const lo = new g.Unit(h, g.TEAM.PLAYER, { level: Progression.maxLevel(3), stars: 3 });
    const hi = new g.Unit(h, g.TEAM.PLAYER, { level: Progression.maxLevel(5), stars: 5 });
    assert(hi.maxHp > lo.maxHp && hi.effectiveStat('atk') > lo.effectiveStat('atk'),
      `${h.id} does not grow between a 3-star cap and a 5-star one`);
  }
  // And across the roster, the bands do not overlap at their caps.
  const band = (r) => heroes.filter((h) => h.rarity === r).map(powerAtCap);
  const [three, four, five] = [band(3), band(4), band(5)];
  const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
  assert(med(three) < med(four) && med(four) < med(five),
    `median power at cap does not climb: ${med(three)} / ${med(four)} / ${med(five)}`);
  assert(Math.max(...three) < Math.min(...five),
    `a 3-star reaches ${Math.max(...three)} at cap, above the weakest 5-star's ${Math.min(...five)}`);
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

test('dungeon bosses each pay exactly one thing, scaled by floor', () => {
  const { DUNGEON_BOSSES } = g;
  const keys = Object.keys(DUNGEON_BOSSES);
  assert(keys.length === 4, `expected four dungeons, found ${keys.length}`);
  const w = DUNGEON_BOSSES.whetstone;
  const a = DUNGEON_BOSSES.arcana;
  const x = DUNGEON_BOSSES.xp;
  const d = DUNGEON_BOSSES.diamond;
  assert(w && w.whetstonesPer > 0 && !w.arcanaPer && !w.xpMult && !w.diamondsFor,
    'the Grindhouse must pay whetstones and nothing else');
  assert(a && a.arcanaPer > 0 && !a.whetstonesPer && !a.xpMult && !a.diamondsFor,
    'the Arcanum Vault must pay arcana and nothing else');
  assert(x && x.xpMult > 6 && !x.whetstonesPer && !x.arcanaPer && !x.diamondsFor,
    'the Proving Grounds must out-pay the standard boss x6 XP and nothing else');
  assert(d && d.diamondsFor && !d.whetstonesPer && !d.arcanaPer && !d.xpMult,
    'the Glitterhoard must pay Diamonds and nothing else');
  // The purse runs 50 at floor 1 to 250 at floor 20, in tens, rising.
  assert(d.diamondsFor(1) === 50 && d.diamondsFor(20) === 250,
    `diamond anchors off: ${d.diamondsFor(1)} / ${d.diamondsFor(20)}`);
  for (let f = 1; f <= 20; f++) {
    assert(d.diamondsFor(f) % 10 === 0, `floor ${f} pays a ragged ${d.diamondsFor(f)}`);
    if (f > 1) assert(d.diamondsFor(f) >= d.diamondsFor(f - 1),
      `floor ${f} pays less than floor ${f - 1}`);
  }
  assert(d.runsPerDay === 1, 'the Glitterhoard takes one challenge a day');
  for (const b of Object.values(DUNGEON_BOSSES)) {
    assert(b.stats5 && b.stats100, `${b.id}: missing stage anchors`);
    assert(b.isBoss && !b.gearSet, `${b.id}: dungeons drop materials, not gear`);
    assert((b.abilities || []).length >= 3, `${b.id}: thin kit`);
    assert((b.passives || []).length >= 3, `${b.id}: no passives`);
    assert(b.dungeonName, `${b.id}: no dungeon name`);
    // Ids live in the shared bossStages ledger; keep them out of the
    // gear bosses' namespace.
    assert(b.id.startsWith('dungeon_'), `${b.id}: id must be dungeon-prefixed`);
    assert(!Object.values(BOSSES).some((gb) => gb.id === b.id),
      `${b.id}: collides with a gear boss`);
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
      silas: { copies: 1, level: 5, stars: 3 },
    },
    team: { 1: 'florence' },
    presets: [{ name: 'Old', team: { 1: 'florence' } }],
    tomes: 12,
  } });
  const S = old.GameState;
  assert(S.countOf('florence') === 3,
    `three Florences expected, got ${S.countOf('florence')}`);
  assert(S.countOf('silas') === 1, 'the single hero was duplicated');

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


test('every hero with art on disk is actually wired to it', () => {
  const { HEROES } = g;
  // A hero with a missing or broken sprite block does not error: it
  // quietly renders the procedural placeholder, which is the right
  // fallback for a hero with genuinely no art and exactly what let
  // Noctelle ship as a grey box for weeks with six finished strips
  // sitting in the repo. Nothing distinguished "no art yet" from "art
  // present but unwired" — this does.
  const artDir = path.join(ROOT, 'assets', 'heroes');
  if (!fs.existsSync(artDir)) return;
  // Art folders are named for the hero, not the id (Echo/ holds
  // Aniani), so match on folder name against both.
  const folders = fs.readdirSync(artDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .filter((e) => fs.readdirSync(path.join(artDir, e.name))
      .some((f) => f.toLowerCase().endsWith('.png')));

  const unwired = [];
  const dangling = [];
  for (const dir of folders) {
    const key = dir.name.toLowerCase();
    const hero = Object.values(HEROES).find((h) =>
      h.id.toLowerCase() === key || (h.name || '').toLowerCase() === key);
    if (!hero) continue;   // art for a hero not on the roster: not our problem here
    const strips = hero.sprite && hero.sprite.strips;
    if (!strips || !strips.idle) {
      unwired.push(`${hero.id} (assets/heroes/${dir.name} has art, def has no sprite.strips.idle)`);
      continue;
    }
    // And every path it names must exist, so a typo or a renamed file
    // surfaces as a failure rather than as a silent placeholder.
    for (const [name, strip] of Object.entries(strips)) {
      const src = strip && strip.src;
      if (!src) continue;
      const abs = path.join(ROOT, decodeURIComponent(src));
      if (!fs.existsSync(abs)) dangling.push(`${hero.id}.${name} -> ${src}`);
    }
  }
  assert(unwired.length === 0, `art on disk but not wired: ${unwired.join('; ')}`);
  assert(dangling.length === 0, `sprite paths pointing at nothing: ${dangling.join('; ')}`);
});


test('campaign and hunt waves field 3-star enemies only', () => {
  const { LOCATION_ENEMIES, ENEMIES, HEROES } = g;
  // The roaming pool stands in for the retired 3-star cohorts, so it
  // must stay at that weight: a 4- or 5-star in the pool hands random
  // hunt waves a signature kit (mirrors, hex stacking, freeze lock)
  // against a player who may still be on a starter team. Nodes that
  // want a heavyweight pin it explicitly instead.
  const offenders = [];
  for (const [loc, ids] of Object.entries(LOCATION_ENEMIES)) {
    assert(ids.length > 0, `location ${loc}: empty enemy pool`);
    for (const id of ids) {
      const e = ENEMIES[id];
      assert(e, `location ${loc}: unknown enemy ${id}`);
      if (e.rarity !== 3) offenders.push(`${loc}:${id} (${e.rarity}-star)`);
    }
  }
  assert(offenders.length === 0,
    `non-3-star enemies roaming: ${offenders.slice(0, 6).join(', ')}`);
  // ENEMIES itself stays a full mirror of the roster — the explicit
  // `enemies: [...]` escape hatch and the compendium both need it.
  assert(Object.keys(ENEMIES).length === Object.keys(HEROES).length,
    'ENEMIES no longer mirrors the whole hero roster');
  // And the pool must not be empty of any element the game can attune,
  // or an elemental hunt would have nothing to field.
  const elements = new Set(LOCATION_ENEMIES[0].map((id) => ENEMIES[id].element));
  assert(elements.size >= 4,
    `roaming pool covers only ${elements.size} elements: ${[...elements].join(', ')}`);
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
        // A DoT ticks off the caster's ATK (pct) or, for burns, the
        // victim's max HP (targetHpPct) — the text quotes whichever.
        const value = eff.type === 'dot' ? (eff.pct ?? eff.targetHpPct) : eff.mult;
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
    'flawless',
    // Bumped by sacrifice() and recordAttuneClear() in state.js.
    'sacrifices', 'attunements']);
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
      const worn = Campaign.gearFor(waveOf(ch), tierId, DUMMIES.rat_archer);
      assert(worn.length === Gear.SLOTS.length, `${tierId}: ${ch.id} gear has ${worn.length} pieces`);
      for (const piece of worn) {
        assert(piece.level <= Gear.RARITIES[piece.rarity].maxLevel,
          `${tierId}: ${ch.id} ${piece.rarity} piece at Lv ${piece.level} exceeds its cap`);
      }
    }
  }

  // Normal is untouched: the tiers are a re-run, not a re-tuning.
  assert(Campaign.sizeFor(waveOf(first), 'normal') < 7, 'normal now fields a full formation');
  assert(Campaign.gearFor(waveOf(first), 'normal', DUMMIES.rat_archer).length === 0,
    'normal enemies were handed gear');

  // Deterministic: the fight you lost to is the fight you come back to.
  const a = JSON.stringify(Campaign.gearFor(waveOf(first), 'hard', DUMMIES.rat_archer));
  const b2 = JSON.stringify(Campaign.gearFor(waveOf(first), 'hard', DUMMIES.rat_archer));
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
    // Fixtures under test/ are test-only bodies (see test/dummies.js);
    // the page has no business loading them, so they are exempt from
    // the ordering check rather than smuggled into index.html.
    if (rel.startsWith('test/')) continue;
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

test('every swept skill obeys the level-up rules', () => {
  const { HEROES, Progression } = g;
  // docs/skill-level-process.md, enforced. The sweep runs hero by hero
  // over 47 heroes; without this, rung counts and cooldown pairs drift
  // between the first batch and the last and nobody notices until a
  // player asks why one skill 3 levels differently from another.
  const problems = [];
  for (const h of Object.values(HEROES)) {
    (h.abilities || []).forEach((a, i) => {
      if (!a.levelUps) return;
      const slotRungs = Progression.skillRungs(i);
      const rungs = a.levelUps.length;
      const lad = Progression.skillLadder(a, Progression.skillCap(a, i));
      const where = `${h.id} s${i + 1}`;

      // A ladder may be shorter than its slot when the skill runs out of
      // improvable axes, but never longer.
      if (rungs > slotRungs) problems.push(`${where}: ${rungs} rungs, slot allows ${slotRungs}`);
      if (rungs < 1) problems.push(`${where}: empty ladder`);

      // Cooldown skills buy exactly two turns back, and never reach 0.
      if (a.cooldown > 0 && rungs >= 2) {
        if ((lad.cooldown || 0) !== -2) {
          problems.push(`${where}: cooldown skill bought ${lad.cooldown || 0} turns, wanted -2`);
        }
        if (Progression.skillCooldown(a, Progression.skillCap(a, i)) < 1) {
          problems.push(`${where}: cooldown reaches zero`);
        }
      }
      if (!a.cooldown && lad.cooldown) {
        problems.push(`${where}: a cooldown-free skill bought cooldown rungs`);
      }

      // Every gated hex must land exactly on certainty at the top of its
      // ladder: short of it, the rungs stop before what they promise;
      // past it, the last rung is partly wasted. Two exemptions, both
      // recorded in the process doc. A `bounce` chance is a chain-
      // continuation roll, not a landing gate -- a wildfire that always
      // leaps never stops. And hard CC on a cooldown-free skill keeps
      // its authored gate: a freeze the caster can throw every single
      // turn must never become certain.
      for (const e of [...(a.effects || []), ...(a.selfEffects || [])]) {
        if (e.chance === undefined || e.type === 'bounce') continue;
        const top = e.chance + (lad.debuffChance || 0);
        const spammableCC = e.type === 'freeze' && !a.cooldown;
        if (spammableCC) {
          if (top > 0.500001) {
            problems.push(`${where}: a cooldown-free freeze reaches ${Math.round(top * 100)}%`);
          }
        } else if (Math.abs(top - 1) > 0.000001) {
          problems.push(`${where}: gate tops out at ${Math.round(top * 100)}%, wanted 100%`);
        }
      }

      // AP drains and buff strips are gated like any other hex: 50% at
      // base, bought up to certain. Anything that takes a turn away or
      // tears a blessing off has to pay the same admission.
      for (const e of [...(a.effects || []), ...(a.selfEffects || [])]) {
        const drain = e.type === 'turnMeter' && e.amount < 0;
        const strip = e.type === 'stripBuffs' || e.type === 'stealBuffs';
        // A block is a denial: it takes healing or blessings away from
        // them for a few turns. Same admission as everything else.
        const block = e.type === 'healBlock' || e.type === 'buffBlock';
        if (!drain && !strip && !block) continue;
        const what = drain ? 'an AP drain' : strip ? 'a buff strip' : 'a block';
        if (e.chance === undefined) {
          problems.push(`${where}: ${what} with no 50% gate`);
        } else if (Math.abs(e.chance - 0.5) > 0.000001) {
          problems.push(`${where}: ${what} opens at ${e.chance}, wanted 0.5`);
        }
      }

      // Severity rungs need something to deepen; duration rungs need a
      // buff to lengthen. A rung with no target silently buys nothing.
      const all = [...(a.effects || []), ...(a.selfEffects || [])];
      // Duration lengthens anything friendly that runs on a timer: a
      // buff, a shield, a heal-over-time, or a one-hit ward.
      // `extendBuffs` belongs here too: it does nothing BUT add turns to
      // a timer, so a duration rung is exactly what widens it.
      const TIMED = new Set(['buff', 'shield', 'hot', 'bubble', 'extendBuffs']);
      if (lad.duration && !all.some((e) => TIMED.has(e.type))) {
        problems.push(`${where}: duration rungs but nothing timed to lengthen`);
      }
      // `raise` counts: it is a permanent blessing written onto a base
      // stat rather than into statusEffects, and Abilities reads
      // `lad.buffPower` off it exactly as it does off an ordinary buff.
      // The rule is "a rung must have something to act on", not "a rung
      // must point at a status effect".
      const BLESSING = new Set(['buff', 'raise']);
      if (lad.buffPower && !all.some((e) => BLESSING.has(e.type))) {
        problems.push(`${where}: buffPower rungs but no buff`);
      }
      if (lad.debuffPower && !all.some((e) =>
        (e.type === 'debuff' && (e.mult !== undefined || e.add !== undefined)) ||
        e.type === 'dot')) {
        problems.push(`${where}: debuffPower rungs but nothing with a magnitude to deepen`);
      }
      // The `heal` rung is the SMALL rate, used by everything priced off
      // a health pool -- mends, wards, revives, and HP-priced damage.
      // `healDealt` is priced off the wound rather than a pool, but it
      // is a mend measured in percent and moves in the same small steps.
      const HP_PRICED = (e) => /^heal/.test(e.type) || e.type === 'hot' ||
        e.type === 'revive' || e.type === 'damageHpPct' || e.type === 'damageHp' ||
        e.healDealt !== undefined ||
        (e.type === 'shield' && e.pct !== undefined);
      if (lad.heal && !all.some(HP_PRICED)) {
        problems.push(`${where}: heal rungs but nothing priced off a health pool`);
      }
      // A cleanse with no `count` already lifts everything, so widening
      // it buys nothing -- the rung needs a capped cleanse to widen.
      if (lad.cleanseCount &&
          !all.some((e) => e.type === 'cleanse' && e.count !== undefined)) {
        problems.push(`${where}: cleanse rungs but no capped cleanse to widen`);
      }
      if (lad.stripCount && !all.some((e) =>
        e.type === 'stripBuffs' || e.type === 'stealBuffs')) {
        problems.push(`${where}: strip rungs but nothing that strips`);
      }
      if (lad.per && !all.some((e) => e.per !== undefined)) {
        problems.push(`${where}: per rungs but nothing priced per head`);
      }
      if (lad.meter && !all.some((e) => e.type === 'turnMeter')) {
        problems.push(`${where}: meter rungs but nothing that moves a meter`);
      }
      // `cooldownPush` counts: it is the hostile mirror of
      // cooldownReduce and reads `lad.refund` off the same rung to
      // deepen the theft. The rule is "a rung must have something to act
      // on", not "a rung must point at a friendly effect".
      const COOLDOWN_MOVERS = new Set(['cooldownReduce', 'cooldownPush']);
      if (lad.refund && !all.some((e) => COOLDOWN_MOVERS.has(e.type))) {
        problems.push(`${where}: refund rungs but no cooldowns moved`);
      }
      // A chain rung lives on the ABILITY, not an effect: it widens the
      // odds the cast re-fires itself.
      if (lad.chain && !a.chain) {
        problems.push(`${where}: chain rungs but the skill never chains`);
      }
      // A perTarget rung steepens a crowd bonus, so there has to be one
      // to steepen -- and a crowd bonus on a skill that can only ever
      // catch one bird is a number that never fires.
      // A perBurn rung steepens a fire-fed blessing, so there has to
      // be one to steepen.
      if (lad.perBurn && !all.some((e) => e.perBurn !== undefined)) {
        problems.push(`${where}: perBurn rungs but nothing fed by a fire`);
      }
      if (lad.perTarget && !all.some((e) => e.perTarget !== undefined)) {
        problems.push(`${where}: perTarget rungs but nothing priced per enemy hit`);
      }
      if (all.some((e) => e.perTarget !== undefined) &&
          ['enemy', 'ally', 'self', 'dead-ally'].includes(a.targeting)) {
        problems.push(`${where}: a crowd bonus on a single-target skill`);
      }
    });
  }
  assert(problems.length === 0, `rule violations:\n  ${problems.join('\n  ')}`);
});

test('every gated skill says so in its own description', () => {
  const { HEROES } = g;
  // A hex that rolls for it and a hex that always lands play completely
  // differently, and the card text is the only place a player finds out
  // which one they have. Twelve descriptions were left behind by the
  // sweep -- one of them advertising a 40% freeze that had been 50% in
  // the data the whole time -- so the rule is pinned rather than
  // remembered. A `bounce` chance is exempt: it decides how far a chain
  // travels, not whether anything lands.
  const wrong = [];
  for (const h of Object.values(HEROES)) {
    (h.abilities || []).forEach((a, i) => {
      const gates = (a.effects || [])
        .filter((e) => e.chance !== undefined && e.type !== 'bounce');
      if (!gates.length) return;
      const want = [...new Set(gates.map((e) => `${Math.round(e.chance * 100)}%`))];
      const missing = want.filter((w) => !(a.description || '').includes(w));
      if (missing.length) {
        wrong.push(`${h.id} s${i + 1} never mentions ${missing.join(', ')}`);
      }
    });
  }
  assert(wrong.length === 0, wrong.join('; '));
});

test('the sweep raised skill 2 and 3 base cooldowns by one', () => {
  const { HEROES } = g;
  // The rule is a BASE change, so it has to be visible in the data, not
  // only in the ladder. Recorded as the known post-sweep values: a hero
  // whose cooldown is edited later has to come back through here.
  const EXPECTED = {
    echo: [0, 4, 6], toll: [0, 4, 6], catherine: [0, 4, 6], leonardo: [0, 4, 5],
    oak: [0, 4, 6], silas: [0, 4, 3], eli: [0, 4, 6], sawyer: [0, 4, 6],
    polarus: [0, 4, 6], andrew: [0, 4, 5], angelica: [0, 4, 6], ari: [0, 4, 6],
    morrow: [0, 6, 7],
    cain: [0, 6, 6], bit: [0, 4, 6], tanner: [0, 4, 6], florence: [0, 6, 8],
    vivian: [0, 6, 7], vex: [0, 6, 8], emily: [0, 6, 8], coral: [0, 7, 8],
    javarious: [0, 4, 5], lucian: [0, 4, 6],
    franz: [0, 4, 6], carl: [0, 4, 6], esmerelda: [0, 4, 6], slick: [0, 4, 6],
    samuels: [0, 4, 6], lin: [0, 4, 6], koe: [0, 4, 6], cleo: [0, 4, 6],
    artur: [0, 4, 6], tumble: [0, 4, 6],
    dorian: [0, 4, 6], noctelle: [0, 4, 6], asher: [0, 4, 6], wren: [0, 4, 6],
    posie: [0, 4, 8], galen: [0, 4, 6], ilyra: [0, 4, 8], ryn: [0, 4, 6],
    imani: [0, 4, 6], sable: [0, 4, 6], evelune: [0, 5, 6], lysandra: [0, 4, 6],
    valere: [0, 5, 8], lenore: [0, 6, 7],
  };
  const wrong = [];
  for (const [id, cds] of Object.entries(EXPECTED)) {
    const h = HEROES[id];
    if (!h) { wrong.push(`${id}: gone from the roster`); continue; }
    cds.forEach((want, i) => {
      const got = h.abilities[i] && h.abilities[i].cooldown;
      if (got !== want) wrong.push(`${id} s${i + 1}: cd ${got}, expected ${want}`);
    });
  }
  assert(wrong.length === 0, wrong.join('; '));
});

report();
