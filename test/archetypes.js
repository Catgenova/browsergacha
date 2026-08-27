// Archetype bench: what every hero actually does, measured, with nothing
// but their own kit to do it with.
//
// Heroes are run at MAX stars and MAX level with NO gear, so the numbers
// are the kit and the statline and nothing else — no substat rolls, no
// set bonuses, no investment gap. Each hero is measured only against its
// own archetype, because a back-row healer and a front-row bruiser have
// no business being on the same leaderboard.
//
// The six archetypes are position (where the hero's positional wants it)
// crossed with what its kit is for:
//
//   front_dps   front_tank
//   center_dps  center_support
//   back_dps    back_support
//
// PROTOCOL. For each archetype a fixed sparring cast is drawn from that
// same archetype — six allies and seven opponents, the median-power
// members of the bucket. Every hero in the bucket is then dropped into
// the same fight in place of one ally, so the ONLY thing that changes
// between runs is the hero under test. The tested hero always takes a
// hex matching its own position, so its positional passive fires; the
// cast fills in around it and is identical for everyone, which is what
// makes the comparison fair rather than realistic.
//
// Both formations are filled: an AoE ability that hits a row or the
// whole field is worth nothing against a half-empty board, so a 3v3
// silently undervalued every hero whose kit scales with target count.
//
// Runs are seeded, so the same hero replays the same fight every time
// and a difference between two heroes is a difference in the heroes.
//
//   node test/archetypes.js                      # everything
//   node test/archetypes.js --sims 9             # steadier numbers
//   node test/archetypes.js --archetype back_dps # one bucket
//   node test/archetypes.js --top 10             # best and worst only
//   node test/archetypes.js --csv                # for a spreadsheet

const { loadGame } = require('./harness');
const g = loadGame();
const { HEROES, POSITION, TEAM, Battle, Unit, Meter, Progression, Gear, Abilities } = g;

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const has = (name) => process.argv.includes(`--${name}`);

const SIMS = Number(arg('sims', 5));
const SQUAD = Number(arg('squad', 7));      // per side; 7 fills the formation
const ONLY = arg('archetype', null);
const TOP = Number(arg('top', 0));          // 0 = show every hero
const CSV = has('csv');
const DT = 0.05;
// Measurement window. Two support lines healing each other never resolve,
// which is fine — every number here is a RATE, so a fight that runs the
// clock out still measures throughput. A shorter window also keeps the
// whole sweep to a couple of minutes.
const WINDOW = Number(arg('seconds', 60));
const MAX_TICKS = Math.round(WINDOW / DT);
// Attrition: a flat percentage of max HP bled from EVERY unit each
// second. Without it a support mirror measures nothing — both lines sit
// at full health, heals land on nobody, and half the healers score a
// flat zero that says more about the test than about them. It is applied
// to both sides so the mirror stays a mirror, and it is excluded from
// the tested hero's taken/s so combat damage stays legible.
const ATTRITION = Number(arg('attrition', 2)) / 100;

const STARS = Progression.MAX_STARS;
const LEVEL = Progression.maxLevel(STARS);

// ---- Archetypes ----------------------------------------------------------

// What a kit is FOR, from what it does rather than what it is called.
//
// Healing is not the only way to be a support. A kit that spends most of
// its abilities on its own side — buffs, turn meter, damage-reduction
// wards — is a support too, and binning it as dps ranks it on damage it
// was never built to do. The Sun heroes were reading as 0.28x of their
// bucket for exactly that reason: they are buffers, measured on a
// leaderboard of attackers.
function roleOf(def) {
  // Explicit role on the def wins (Catherine: tanky statline, DPS kit).
  if (def.role) return def.role;
  const abilities = def.abilities || [];
  const MEND = ['heal', 'healHpPct', 'hot', 'revive', 'cleanse'];
  // A mend that can only ever reach the caster is self-sustain, not
  // support work: Javarious heals himself to restore a damage condition,
  // and binning him with the healers ranked a carry on healing.
  const mends = abilities.some((a) =>
    Abilities.sideOf(a.targeting) === 'ally' &&
    (a.effects || []).some((e) => MEND.includes(e.type)));
  if (mends) return 'support';
  // A kit with no damaging effect anywhere cannot be a dps of any kind:
  // a pure debuffer (Slick oils the field and never swings) works in
  // enemy output removed and ally damage enabled, which is support work.
  const DMG = ['damage', 'damageDef', 'damageHpPct', 'damageHp', 'dot'];
  if (!abilities.some((a) => (a.effects || []).some((e) => DMG.includes(e.type)))) {
    return 'support';
  }
  const forAllies = abilities.filter((a) =>
    ['ally', 'self'].includes(Abilities.sideOf(a.targeting))).length;
  if (forAllies > abilities.length / 2) return 'support';
  const s = def.stats || {};
  // Bulk against punch, on the same scale the wave builder uses.
  const bulk = (s.hp || 0) / 10 + (s.def || 0);
  const punch = (s.atk || 0) + (s.speed || 0) / 2;
  return bulk > punch ? 'tank' : 'dps';
}

// Six buckets, not nine, and the two folds are chosen so that nothing
// lands in a bucket whose headline number it cannot produce:
//   front support -> tank   a mender on the line is there to hold it
//   center/back tank -> dps a bulky back-liner that never heals is not
//                           a support; by elimination it deals damage
// Folding bulk into SUPPORT was the obvious-looking alternative and it
// is wrong: it filled the support buckets with heroes healing zero and
// pulled their medians to nearly nothing.
const FOLDS = { front: { support: 'tank' }, center: { tank: 'dps' }, back: { tank: 'dps' } };
const folded = { front: 0, center: 0, back: 0 };

function archetypeOf(def) {
  const position = def.positional ? def.positional.position : POSITION.FRONT;
  let role = roleOf(def);
  const fold = FOLDS[position];
  if (fold && fold[role]) { folded[position]++; role = fold[role]; }
  return `${position}_${role}`;
}

const ORDER = ['front_tank', 'front_dps', 'center_support', 'center_dps',
  'back_support', 'back_dps'];
const TITLE = {
  front_tank: 'FRONT ROW — TANK', front_dps: 'FRONT ROW — DPS',
  center_support: 'CENTER — SUPPORT', center_dps: 'CENTER — DPS',
  back_support: 'BACK ROW — SUPPORT', back_dps: 'BACK ROW — DPS',
};
// The number each bucket lives or dies by.
const HEADLINE = {
  front_tank: 'ehp', front_dps: 'dps', center_support: 'worth/s',
  center_dps: 'dps', back_support: 'worth/s', back_dps: 'dps',
};
// The effect types a kit needs to be able to post a number in each
// headline. A hero whose kit simply cannot (a cleanse-only support has
// no healing to do) is reported as such instead of flagged as an outlier.
const NEEDS = {
  dps: ['damage', 'damageDef', 'damageHpPct', 'dot'],
  'heal/s': ['heal', 'healHpPct', 'hot'],
  // A support's job is HP the team did not lose, and a ward prevents it
  // just as a heal restores it. Ranking supports on healing alone put
  // every protector at the bottom of its bucket for doing its job well.
  'saved/s': ['heal', 'healHpPct', 'hot', 'buff'],
  // Everything a support contributes, in HP per second: restored, saved,
  // and removed from the enemy. An attack buff is worth exactly the extra
  // damage the ally deals with it, and since js/hero.js books that share
  // back to the buffer, it finally lands in a column. Every support kit
  // can post a number in at least one of the three.
  'worth/s': null,
  ehp: null, // every hero has an HP pool
};
function kitCan(def, headline) {
  const need = NEEDS[headline];
  if (!need) return true;
  return (def.abilities || []).some((a) =>
    (a.effects || []).some((e) => {
      if (!need.includes(e.type)) return false;
      // Only a damage-reduction ward counts toward HP saved directly.
      // ATK and speed buffs are credited too, but as a share of the
      // damage and healing the buffed ALLY produces (js/hero.js assist
      // books) — that lands in dps/heal/worth, not in saved/s.
      if (e.type === 'buff') return e.stat === 'damageTaken';
      return true;
    }));
}

const buckets = {};
for (const def of Object.values(HEROES)) {
  (buckets[archetypeOf(def)] ||= []).push(def);
}

// ---- One measured fight --------------------------------------------------

const powerOf = (def) =>
  Progression.power(Progression.scaledStats(def, LEVEL, STARS));

// Seat a unit in a hex matching its position when one is free, else
// anywhere. Only the tested hero is guaranteed its own position.
function seat(battle, def, team, wantPosition) {
  const slots = team === TEAM.PLAYER ? battle.playerSlots : battle.enemySlots;
  const free = slots.filter((s) => !s.unit);
  const pick = free.find((s) => s.position === wantPosition) || free[0];
  if (!pick) return null;
  const unit = new Unit(def, team, { level: LEVEL, stars: STARS }); // no gear
  battle.placeUnit(unit, pick.index);
  return unit;
}

function runOne(def, cast, seedValue) {
  g.seed(seedValue);
  Meter.resetBattle();
  const battle = new Battle();
  battle.autoMode = true;

  const position = def.positional ? def.positional.position : POSITION.FRONT;
  const hero = seat(battle, def, TEAM.PLAYER, position);
  for (const ally of cast.allies) seat(battle, ally, TEAM.PLAYER, ally.positional.position);
  for (const foe of cast.foes) seat(battle, foe, TEAM.ENEMY, foe.positional.position);

  // Damage taken is not on the ledger (it credits whoever dealt it), so
  // the tested hero counts its own — combat only, never attrition.
  let taken = 0;
  let bleeding = false;
  const takeDamage = hero.takeDamage.bind(hero);
  hero.takeDamage = (amount, source) => {
    defending = true;
    let dealt;
    try { dealt = takeDamage(amount, source); } finally { defending = false; }
    if (!bleeding) taken += dealt;
    return dealt;
  };
  // Mitigation of hits aimed at THIS hero, kept apart from the meter's
  // total: the meter also credits the hero for wards and DEF walls that
  // saved ALLIES, and ehp built on that read a team protector as
  // personally unkillable. Own-incoming prevention is booked to the hero
  // while it is the one dodging, reflecting, or blunting (`defending`);
  // everything else it earns is team credit and belongs in mit/s.
  let selfMit = 0;
  let defending = false;
  const realBlunt = hero.blunt.bind(hero);
  hero.blunt = (raw, opts) => {
    defending = true;
    try { return realBlunt(raw, opts); } finally { defending = false; }
  };
  const realBookDodge = hero.bookDodge.bind(hero);
  hero.bookDodge = (prevented) => { selfMit += prevented; return realBookDodge(prevented); };
  const realBookReflect = hero.bookReflect.bind(hero);
  hero.bookReflect = (prevented, bounced) => {
    selfMit += prevented;
    return realBookReflect(prevented, bounced);
  };
  const realMeterMit = Meter.mitigated;
  Meter.mitigated = (unit, amount) => {
    // `taken` above deliberately skips the attrition bleed, so booking
    // the prevention against that same bleed counts one side of it and
    // not the other: mitRatio climbs with nothing to balance it, and any
    // hero carrying a ward reads as unkillable. It put Talon at 8.09x
    // his bucket's median on a kit that is actually worth 1.78x, and
    // pinned Peck at maxHp/0.05 -- the clamp, not a measurement.
    //
    // blunt() already refuses self-credit against the bleed
    // (selfCredit: false); shield absorption happens inside takeDamage,
    // which this harness wraps in `defending`, so it needed the same
    // guard one level up.
    if (unit === hero && defending && !bleeding) selfMit += amount;
    return realMeterMit(unit, amount);
  };
  // Poison is the only damage in the game that skips the DEF curve, so a
  // single dps number hides which heroes are winning on their kit and
  // which are winning on that exemption.
  //
  // Attribution has to be exact. Reading it off the target ("this unit is
  // taking sourceless damage and carries one of my poisons") silently
  // credits the tested hero for a stack-mate's tick whenever both have
  // poison on the same enemy, which at 7v7 in a snake bucket is most of
  // the time — it produced NEGATIVE direct damage once the poison total
  // overtook the hero's real one.
  //
  // Instead: js/hero.js:406 is the only place damage is metered from
  // inside Unit.startTurn. So damage credited to the tested hero while
  // some OTHER unit is taking its turn is exactly a tick of the hero's
  // own poison — nothing else can produce it.
  let dotDealt = 0;
  let assistDealt = 0;
  let acting = null;
  const realStartTurn = Unit.prototype.startTurn;
  const realMeterDamage = Meter.damage;
  Unit.prototype.startTurn = function (...rest) {
    acting = this;
    try { return realStartTurn.apply(this, rest); } finally { acting = null; }
  };
  Meter.damage = (unit, amount) => {
    // Damage bought rather than swung for: the hero's share of an ally's
    // hit, earned by an attack buff, a crit buff, an action-bar push or an
    // armour break. Unit.assisting is set only while that share is booked.
    if (unit === hero && Unit.assisting) {
      assistDealt += Math.round(amount);
    } else if (acting && acting !== hero && unit === hero && !Unit.retaliating) {
      // ...unless it is a retaliation. An onStruck hook can fire while
      // another unit is acting (it hit us on its turn), which looks exactly
      // like a poison tick from out here. Unit.retaliating tells them apart.
      dotDealt += Math.round(amount);
    }
    return realMeterDamage(unit, amount);
  };
  const unpatch = () => {
    Unit.prototype.startTurn = realStartTurn;
    Meter.damage = realMeterDamage;
    Meter.mitigated = realMeterMit;
  };

  const bleed = () => {
    bleeding = true;
    for (const u of battle.livingUnits()) {
      // Through the unit's defences, so a ward blunts the bleed the way
      // it blunts anything else. Without this a protector has nothing to
      // protect against in a mirror, and reads as a failed healer.
      // selfCredit: false — attrition is a harness construct, so a unit
      // must not bank mitigation against it and inflate its own ehp.
      // Wards still earn their share, which is the point of routing the
      // bleed through the defences at all.
      u.takeDamage(u.blunt(Math.max(1, Math.round(u.maxHp * ATTRITION)),
        { selfCredit: false }));
    }
    bleeding = false;
  };

  // What the hero is holding on the field, sampled once a simulated
  // second. Damage, healing and mitigation all resolve into HP and can
  // share one currency; a DEF buff, a cleanse or an accuracy blessing
  // do not, and converting them into a damage-equivalent would be
  // inventing an exchange rate. So this counts what is actually true:
  // how many blessings the hero is sustaining on its own side, and how
  // many afflictions on the other.
  //
  // Buffs only -- wards and heals-over-time are already banked as
  // mitigation and healing, and counting them here would pay a hero
  // twice for one effect.
  let boonSamples = 0;
  let hexSamples = 0;
  let samples = 0;
  const sampleField = () => {
    samples++;
    for (const u of battle.livingUnits()) {
      for (const fx of u.statusEffects) {
        if (fx.source !== hero) continue;
        if (fx.kind === 'buff' && u.team === hero.team) boonSamples++;
        else if ((fx.kind === 'debuff' || fx.kind === 'dot') &&
                 u.team !== hero.team) hexSamples++;
      }
    }
  };

  let winner = null;
  battle.onBattleEnd = (w) => { winner = w; };
  let ticks = 0;
  const bleedEvery = Math.round(1 / DT); // once a simulated second
  try {
    while (!winner && ticks < MAX_TICKS) {
      battle.update(DT);
      ticks++;
      if (ticks % bleedEvery === 0) {
        sampleField();
        if (ATTRITION > 0) bleed();
      }
    }
  } finally {
    unpatch(); // these are global; never leave them installed
  }
  const seconds = Math.max(0.1, ticks * DT);
  const mine = (kind) => {
    const row = Meter.rows(kind, 'battle').list.find((r) => r.id === def.id);
    return row ? row.value : 0;
  };
  return {
    seconds,
    stalled: !winner,
    died: !hero.alive,
    damage: mine('damage'),
    poison: dotDealt,
    assist: assistDealt,
    healing: mine('healing'),
    mitigated: mine('mitigated'), // team-wide: wards, walls, own guards
    taken,
    maxHp: hero.maxHp,
    // Share of everything aimed at this hero that never landed — own
    // prevention only, so ehp stays personal survivability.
    mitRatio: selfMit + taken > 0 ? selfMit / (selfMit + taken) : 0,
    // Average number held up at any moment, not a total: a blessing
    // that lasts twice as long is worth twice as much, and one that is
    // re-cast over the top of itself is not worth two.
    boons: samples ? boonSamples / samples : 0,
    hexes: samples ? hexSamples / samples : 0,
  };
}

// The sparring cast: the median-power members of the bucket, so the
// yardstick is an ordinary member of the archetype rather than its best
// or its worst. Swapped out when the hero under test IS one of them.
// Which bucket lends a support mirror somebody to actually buff. An
// attack blessing handed round a room of healers amplifies nothing, so
// a support bucket used to measure its buffers at almost exactly zero
// -- not because the bench could not credit a buff, but because there
// was nothing in the fight for the buff to do. Every support bucket now
// fields one striker a side, drawn from the DPS bucket that shares its
// row, so a blessing has a swing to ride on and the assist ledger can
// see it. The pair is identical for every hero in the bucket, so the
// comparison stays as fair as it was.
const PARTNER = {
  front_support: 'front_dps', center_support: 'center_dps',
  back_support: 'back_dps',
};

function medianOf(pool) {
  const ranked = pool.slice().sort(
    (a, b) => powerOf(a) - powerOf(b) || a.id.localeCompare(b.id));
  return ranked[Math.floor(ranked.length / 2)];
}

function castFor(pool, key) {
  const ranked = pool.slice().sort((a, b) => powerOf(a) - powerOf(b) || a.id.localeCompare(b.id));
  const mid = Math.floor(ranked.length / 2);
  const need = SQUAD - 1 + SQUAD;
  const start = Math.max(0, Math.min(mid - Math.floor(need / 2), ranked.length - need));
  const chosen = ranked.slice(start, start + need);
  // A tiny bucket may not have enough distinct members; repeat rather
  // than fail, and say so in the header.
  while (chosen.length < need) chosen.push(ranked[chosen.length % ranked.length]);
  const allies = chosen.slice(0, SQUAD - 1);
  const foes = chosen.slice(SQUAD - 1);
  const lender = PARTNER[key] && buckets[PARTNER[key]];
  if (lender && lender.length) {
    const striker = medianOf(lender);
    if (allies.length) allies[0] = striker;
    if (foes.length) foes[0] = striker;
  }
  return { pool: ranked, allies, foes };
}

function castWithout(cast, def) {
  const swap = (list) => list.map((d) => {
    if (d.id !== def.id) return d;
    return cast.pool.find((o) => o.id !== def.id &&
      !cast.allies.includes(o) && !cast.foes.includes(o)) || d;
  });
  return { allies: swap(cast.allies), foes: swap(cast.foes) };
}

// ---- Report --------------------------------------------------------------

const median = (xs) => {
  if (!xs.length) return 0;
  const s = xs.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const round = (n, p = 1) => Number(n.toFixed(p));
const pad = (s, n) => String(s).padStart(n);

function measure(def, cast) {
  const runs = [];
  for (let i = 0; i < SIMS; i++) runs.push(runOne(def, castWithout(cast, def), 1000 + i * 7919));
  const avg = (pick) => runs.reduce((s, r) => s + pick(r), 0) / runs.length;
  // direct + poison + assist must reconstruct dps. If they do not, one of
  // the three is being attributed to the wrong hero and every split on the
  // page is fiction.
  for (const r of runs) {
    if (r.poison + r.assist > r.damage + 1) {
      throw new Error(`${def.id}: poison ${Math.round(r.poison)} + assist ` +
        `${Math.round(r.assist)} exceeds total damage ${Math.round(r.damage)} ` +
        '— damage attribution is broken');
    }
  }
  const mitRatio = avg((r) => r.mitRatio);
  const maxHp = avg((r) => r.maxHp);
  return {
    def,
    id: def.id,
    name: def.name,
    rarity: def.rarity,
    power: powerOf(def),
    dps: avg((r) => r.damage / r.seconds),
    direct: avg((r) => (r.damage - r.poison - r.assist) / r.seconds),
    poison: avg((r) => r.poison / r.seconds),
    assist: avg((r) => r.assist / r.seconds),
    'heal/s': avg((r) => r.healing / r.seconds),
    'mit/s': avg((r) => r.mitigated / r.seconds),
    'taken/s': avg((r) => r.taken / r.seconds),
    'mit%': mitRatio * 100,
    // Healing plus mitigation: what a support actually saved the team.
    'saved/s': avg((r) => (r.healing + r.mitigated) / r.seconds),
    // Saved plus dealt: the whole contribution in one number, so a hero
    // who buffs the team's attack is comparable with one who heals it.
    'worth/s': avg((r) => (r.healing + r.mitigated + r.damage) / r.seconds),
    // Effective health: the pool an attacker actually has to chew
    // through, once this hero's dodges, reflects and guards are counted.
    // Survival time saturates in a mirror — nobody dies inside the
    // window — so this is what separates one tank from another.
    ehp: maxHp / Math.max(0.05, 1 - mitRatio),
    boons: avg((r) => r.boons),
    hexes: avg((r) => r.hexes),
    deaths: runs.filter((r) => r.died).length,
    stalls: runs.filter((r) => r.stalled).length,
    seconds: avg((r) => r.seconds),
  };
}

const COLUMNS = [
  ['dps', 'dps', 8, 1], ['direct', 'direct', 8, 1], ['poison', 'poison', 8, 1],
  ['assist', 'assist', 7, 1],
  ['heal/s', 'heal/s', 9, 1], ['mit/s', 'mit/s', 7, 1],
  ['worth/s', 'worth/s', 8, 1],
  ['boons', 'boons', 6, 2], ['hexes', 'hexes', 6, 2],
  ['taken/s', 'taken/s', 8, 1], ['mit%', 'mit%', 5, 1], ['ehp', 'ehp', 8, 0],
];

const flagged = [];

function report(key, rows) {
  const headline = HEADLINE[key];
  rows.sort((a, b) => b[headline] - a[headline]);
  // The yardstick is taken over heroes whose kit can post this number.
  // A support bucket holds buffers as well as healers, and counting a
  // buffer's zero heal/s as a data point halves the healers' median and
  // makes every one of them look strong.
  const mid = median(rows.filter((r) => kitCan(r.def, headline))
    .map((r) => r[headline]));
  console.log(`\n${TITLE[key]}  —  ${rows.length} heroes, ` +
    `median ${headline} ${round(mid)}`);
  console.log('  ' + 'hero'.padEnd(24) + '★'.padStart(3) +
    COLUMNS.map(([, label, w]) => pad(label, w + 1)).join('') + '   vs median');

  const shown = TOP > 0 && rows.length > TOP * 2
    ? [...rows.slice(0, TOP), null, ...rows.slice(-TOP)]
    : rows;
  for (const r of shown) {
    if (r === null) { console.log(`  … ${rows.length - TOP * 2} more …`); continue; }
    const ratio = mid > 0 ? r[headline] / mid : 0;
    // Only the headline metric earns a flag, and only when the kit could
    // have posted a number at all — a cleanse-only support healing zero
    // is a fact about its kit, not a balance problem.
    const can = kitCan(r.def, headline);
    // Damage, healing and mitigation all resolve into HP, so worth/s
    // can hold them in one number. A blessing and a hex cannot be
    // converted into HP without inventing an exchange rate, so they get
    // their own columns -- and a hero holding a field full of them is
    // NOT idle, whatever its worth/s says. Polo posts 1.7 worth/s while
    // sustaining five blessings at a time; calling that "far below"
    // was the bench failing to look rather than the hero failing to
    // work. A low reading is only worth flagging when the hero is
    // quiet on every axis the bench can see.
    const working = r.boons >= 1 || r.hexes >= 1;
    const low = ratio <= 0.4 && !working;
    const mark = !can ? `  (no ${headline} in kit)`
      : ratio >= 2 ? ' ←← far above'
      : low ? ' ←← far below'
      : ratio <= 0.4 ? `  (works in boons/hexes)` : '';
    if (can && (ratio >= 2 || low)) {
      flagged.push({ key, name: r.name, headline, value: r[headline], ratio });
    }
    console.log('  ' + r.name.padEnd(24) + pad(r.rarity, 3) +
      COLUMNS.map(([k, , w, p]) => pad(round(r[k], p), w + 1)).join('') +
      `   ${pad(round(ratio, 2), 5)}×${mark}`);
  }
  const unresolved = rows.reduce((n, r) => n + r.stalls, 0);
  const runs = rows.length * SIMS;
  const fell = rows.filter((r) => r.deaths > 0);
  console.log(`  ${fell.length} of ${rows.length} died at least once` +
    (fell.length ? `: ${fell.slice(0, 6).map((r) => r.name).join(', ')}` +
      (fell.length > 6 ? ', …' : '') : ''));
  if (unresolved) {
    console.log(`  ${Math.round((unresolved / runs) * 100)}% of fights ran the ` +
      `${WINDOW}s clock out without a winner — expected in a mirror, and ` +
      `harmless: every column above is a rate.`);
  }
  if (mid === 0) {
    console.log('  ⚠ median is zero — this bucket is mis-binned, not balanced.');
  }
}

// ---- Run -----------------------------------------------------------------

// Importable so the test suite can guard the classification — the part
// most likely to rot silently as heroes are added — without paying for a
// few thousand simulated battles on every CI run.
// Run the whole sweep and hand back the numbers. Exported so the balance
// sheet generator can build its table from the same measurements the CLI
// prints, rather than scraping them back out of the text.
function bench(only = ONLY) {
  const wanted = ORDER.filter((k) => buckets[k] && (!only || k === only));
  const out = {};
  for (const key of wanted) {
    const cast = castFor(buckets[key], key);
    out[key] = buckets[key].map((def) => measure(def, cast))
      .map(({ def, ...rest }) => rest); // drop the def; it is not serialisable
  }
  return {
    meta: {
      heroes: Object.keys(HEROES).length,
      stars: STARS, level: LEVEL, squad: SQUAD, sims: SIMS,
      window: WINDOW, attrition: ATTRITION, folded: { ...folded },
    },
    order: wanted, titles: TITLE, headline: HEADLINE, columns: COLUMNS,
    buckets: out,
  };
}

module.exports = {
  roleOf, archetypeOf, kitCan, bench,
  ARCHETYPES: ORDER, HEADLINE, TITLE, COLUMNS,
};
if (require.main !== module) return;

const keys = ORDER.filter((k) => buckets[k] && (!ONLY || k === ONLY));
if (ONLY && !keys.length) {
  console.log(`No such archetype "${ONLY}". Try one of: ${ORDER.join(', ')}`);
  process.exit(1);
}

console.log(`\nArchetype bench — ${Object.keys(HEROES).length} heroes at ` +
  `${STARS}★ Lv ${LEVEL}, ungeared, ${SQUAD}v${SQUAD} within archetype, ` +
  `${SIMS} seeded sims each, ${WINDOW}s window, ` +
  `${Math.round(ATTRITION * 100)}%/s attrition`);
console.log(`Folded into six buckets: ${folded.front} front menders read as tanks, ` +
  `${folded.center + folded.back} bulky mid/back heroes read as dps`);

const started = Date.now();
const all = {};
for (const key of keys) {
  const pool = buckets[key];
  const cast = castFor(pool, key);
  all[key] = pool.map((def) => measure(def, cast));
}
for (const key of keys) report(key, all[key]);

if (CSV) {
  console.log('\narchetype,hero,rarity,power,' +
    COLUMNS.map(([k]) => k).join(','));
  for (const key of keys) {
    for (const r of all[key]) {
      console.log([key, r.name, r.rarity, r.power,
        ...COLUMNS.map(([k, , , p]) => round(r[k], p))].join(','));
    }
  }
}

console.log(`\nOUTLIERS — ${flagged.length} hero(es) off their archetype's median`);
if (!flagged.length) console.log('  none; every bucket is within 0.4×–2× of its median');
for (const f of flagged.sort((a, b) => b.ratio - a.ratio)) {
  console.log(`  ${TITLE[f.key].padEnd(20)} ${f.name.padEnd(24)} ` +
    `${f.headline} ${pad(round(f.value), 8)}  ${round(f.ratio, 2)}× median`);
}
console.log(`\n${((Date.now() - started) / 1000).toFixed(1)}s\n`);
