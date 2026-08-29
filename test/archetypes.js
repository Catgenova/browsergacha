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
// WHAT A BOON IS WORTH. `boons` and `hexes` count how many blessings a
// hero is sustaining and refuse to price them, because turning a DEF
// buff or a cleanse into HP means inventing an exchange rate. `lift`
// prices them without inventing one: the same fight is run twice off
// the same seed, once with the hero and once with the hero's own BLANK
// -- their statline and their hex, one plain swing, no passive, no
// kit -- and the difference in what the whole side produced is what the
// kit was worth. A cleanse, an immunity, a meter push and a cooldown
// refresh all land in it, because it never asks what they do.
//
// It comes with `+/-`, its own standard error over the paired runs, and
// the bar is not decoration. Swapping a hero for a blank changes the
// whole trajectory of a 60-second fight, so the two runs diverge
// chaotically even off one seed and the difference of two noisy totals
// is noisier than either. At 9 sims Calima's lift is 17 error bars wide
// and Kiri's is 0.2 -- Kiri's contribution is real and simply smaller
// than what this method can resolve. A lift under about twice its bar
// is an unmeasured effect, not a small one. Use --sims 9 or more before
// reading anything off it.
//
// `worth/s` is a different question and both are worth having: it is
// what the LEDGERS credit, which double-counts a buffer's share of an
// ally's swing on purpose (see js/meter.js), while `lift` is what the
// team actually gained. Leonardo's ledgers say 559 and his lift says
// 221; both are true answers to different questions.
//
//   node test/archetypes.js                      # everything
//   node test/archetypes.js --sims 9             # steadier numbers, and
//                                                # the minimum for lift
//   node test/archetypes.js --archetype back_dps # one bucket
//   node test/archetypes.js --top 10             # best and worst only
//   node test/archetypes.js --csv                # for a spreadsheet

const { loadGame } = require('./harness');
const g = loadGame();
const { HEROES, POSITION, TEAM, Battle, Unit, Meter, Progression, Gear, Abilities,
  CONFIG } = g;

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

// The 7v7 mirror is a full-formation slugfest, and a slugfest pays a
// sweep three or four times over while a single-target kit gets one
// swing. That is a real thing about the game, but it is not the ONLY
// thing: every boss in the campaign is one body. Measured only in the
// crowd, all four single-target 5-star front-liners read as broken --
// Asher, Javarious, Dorian and Sawyer at 0.37x to 0.60x -- while every
// AoE kit in the same bucket reads as strong.
//
// So each hero is measured twice, in the same team, against two shapes
// of opponent: the seven-body line it already faced, and ONE opponent
// carrying the whole enemy side's health. `solo` is the second reading.
// A hero with their own body and none of their kit: the same statline,
// the same hex, one plain 100%-ATK swing, and nothing else. Every buff,
// hex, cleanse, ward, meter push and passive is gone.
//
// This is the control the boon measurement needs. `boons` and `hexes`
// count how many blessings a hero is SUSTAINING, deliberately refusing
// to price them, because converting a DEF buff or a cleanse into HP
// means inventing an exchange rate. Running the same fight twice --
// once with the hero, once with their own blank -- prices them without
// inventing anything: whatever the rest of the team does differently IS
// the kit, in the same HP the other columns are already measured in.
//
// The positional stays. It is part of standing in that hex rather than
// part of the kit, and stripping it would fold the hex's value into the
// hero's and flatter every positional-heavy build.
const blankCache = new Map();
function blankOf(def) {
  if (blankCache.has(def.id)) return blankCache.get(def.id);
  const blank = {
    ...def,
    id: `${def.id}__blank`,
    name: `${def.name} (blank)`,
    abilities: [{
      id: `${def.id}__blank_swing`, name: 'Swing',
      description: 'A plain swing, and nothing else.',
      cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
      effects: [{ type: 'damage', mult: 1.0 }],
      levelUps: [{ mult: 0.1 }],
    }],
    passive: { name: 'Nothing', description: 'Nothing.', hooks: {} },
  };
  blankCache.set(def.id, blank);
  return blank;
}

function runOne(def, cast, seedValue, boss = false, blank = false) {
  g.seed(seedValue);
  Meter.resetBattle();
  const battle = new Battle();
  battle.autoMode = true;

  const position = def.positional ? def.positional.position : POSITION.FRONT;
  const seated = blank ? blankOf(def) : def;
  const hero = seat(battle, seated, TEAM.PLAYER, position);
  for (const ally of cast.allies) seat(battle, ally, TEAM.PLAYER, ally.positional.position);
  if (boss) {
    // One opponent, pooled: the same total health and the same total
    // attack the seven would have brought, so the fight is the same
    // size and only its SHAPE has changed.
    const stand = cast.foes[Math.floor(cast.foes.length / 2)];
    const solo = seat(battle, stand, TEAM.ENEMY, POSITION.FRONT);
    if (solo) {
      solo.maxHp *= cast.foes.length;
      solo.hp = solo.maxHp;
      solo.baseAtk *= cast.foes.length;
    }
  } else {
    for (const foe of cast.foes) seat(battle, foe, TEAM.ENEMY, foe.positional.position);
  }

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
  let acting = null;
  const realStartTurn = Unit.prototype.startTurn;
  const realMeterDamage = Meter.damage;
  Unit.prototype.startTurn = function (...rest) {
    acting = this;
    try { return realStartTurn.apply(this, rest); } finally { acting = null; }
  };
  Meter.damage = (unit, amount) => {
    // Damage bought rather than swung for used to arrive here too, told
    // apart by Unit.assisting. It has its own ledger now -- Meter.damage
    // carries only what a hero swung for -- so the assist figure is read
    // straight off `facilitated` below and this patch is left with the
    // one job of spotting a tick.
    if (acting && acting !== hero && unit === hero && !Unit.retaliating) {
      // ...unless it is a retaliation. An onStruck hook can fire while
      // another unit is acting (it hit us on its turn), which looks exactly
      // like a poison tick from out here. Unit.retaliating tells them apart.
      dotDealt += Math.round(amount);
    }
    return realMeterDamage(unit, amount);
  };
  // ---- The action bar, both directions -------------------------------
  //
  // Nothing measured this before the Stillwater cats, whose entire kit
  // is turn order: a sect that takes turns away and hands them out read
  // as a room of heroes doing nothing at all.
  //
  // Both halves are read off Unit.apTaken / Unit.apGiven, the engine's
  // own action-bar ledger, after the fight. The engine books them at
  // every path that moves somebody else's meter -- the drain funnel, the
  // turnMeter gift, a speed buff's share of the fill, and the two hooks
  // that reach across the line themselves -- so the bench asks the book
  // rather than trying to keep one of its own. An earlier version
  // patched Abilities.drainMeter from out here and read zero for every
  // hero in the game: the effect calls the module-internal closure, not
  // the export, so the patch never fired.
  //
  // Units are built fresh per run, so the counters start at zero and end
  // at the run's total. Bars, not points: 1.0 is one full turn's worth.
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
    const row = Meter.rows(kind, 'battle').list.find((r) => r.id === seated.id);
    return row ? row.value : 0;
  };
  // What the WHOLE player side produced, the hero included. The meter
  // only tallies TEAM.PLAYER, so this is exactly the side under test.
  const teamTotal = ['damage', 'healing', 'mitigated'].reduce(
    (sum, kind) => sum + Meter.rows(kind, 'battle').total, 0);
  return {
    seconds,
    stalled: !winner,
    died: !hero.alive,
    apTaken: hero.apTaken,
    apGiven: hero.apGiven,
    teamTotal,
    damage: mine('damage'),
    poison: dotDealt,
    // Own swings and bought swings are separate ledgers now, so this is
    // a read rather than a tally kept during the run.
    assist: mine('facilitated'),
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
const round = (n, p = 1) =>
  (typeof n === 'number' && Number.isFinite(n) ? Number(n.toFixed(p)) : n);

// Paired lift and its standard error. Pairing matters: run i and blank
// i share a seed and a cast, so differencing them cancels everything
// the two fights had in common and leaves the kit plus whatever
// trajectory divergence the swap caused. The spread of those paired
// differences IS the uncertainty, so it is measured rather than assumed.
function liftStats(runs, blanks) {
  const d = runs.map((r, i) => r.teamTotal / r.seconds -
    blanks[i].teamTotal / blanks[i].seconds);
  const n = d.length;
  const mean = d.reduce((a, b) => a + b, 0) / n;
  if (n < 2) return { lift: mean, liftErr: Infinity };
  const varSum = d.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
  return { lift: mean, liftErr: Math.sqrt(varSum / n) };
}
const pad = (s, n) => String(s).padStart(n);

function measure(def, cast) {
  const runs = [];
  const solos = [];
  const blanks = [];
  for (let i = 0; i < SIMS; i++) {
    runs.push(runOne(def, castWithout(cast, def), 1000 + i * 7919));
    solos.push(runOne(def, castWithout(cast, def), 1000 + i * 7919, true));
    // The same fight, same seed, same cast, same hex -- with the hero's
    // own blank standing in their place. Everything that differs is the
    // kit.
    blanks.push(runOne(def, castWithout(cast, def), 1000 + i * 7919, false, true));
  }
  const avg = (pick) => runs.reduce((s, r) => s + pick(r), 0) / runs.length;
  const avgSolo = (pick) => solos.reduce((s, r) => s + pick(r), 0) / solos.length;
  const avgBlank = (pick) => blanks.reduce((s, r) => s + pick(r), 0) / blanks.length;
  // Direct and poison must reconstruct the hero's own damage. Assist is
  // NOT part of that sum any more and must not be checked against it:
  // damage and facilitation are two ledgers now (see js/meter.js), the
  // first holding the whole of what a hero swung for and the second the
  // slice of somebody ELSE's swing their buffs and breaks bought. A
  // support who dealt nothing all fight and enabled forty thousand is
  // the ordinary case, not a broken split -- this check used to read
  // that as attribution being broken because assists were carved out of
  // the attacker's own column back when the two shared a ledger.
  for (const r of runs) {
    if (r.poison > r.damage + 1) {
      throw new Error(`${def.id}: poison ${Math.round(r.poison)} exceeds ` +
        `total damage ${Math.round(r.damage)} — damage attribution is broken`);
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
    // Own swings, less the ticks. Assist is not subtracted: it was
    // never added, because it lives in its own ledger.
    direct: avg((r) => (r.damage - r.poison) / r.seconds),
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
    // Assist belongs here and used to arrive by accident: when assists
    // were carved out of the attacker's own column, r.damage carried
    // the buffer's share and worth/s picked it up. Moving facilitation
    // to its own ledger silently emptied this of every boon it was
    // supposed to hold, which is why Leonardo posted 564 assist and 0
    // worth. It is added explicitly now.
    'worth/s': avg((r) =>
      (r.healing + r.mitigated + r.damage + r.assist) / r.seconds),
    // The differential, PAIRED. What the whole side produced with this
    // hero in the hex, less what it produced with the hero's own blank
    // in the same hex on the same seed -- per second, in the same HP as
    // every other column. This is the one number that prices a cleanse,
    // an immunity, a meter push or a DEF buff, because it never asks
    // what they are worth: it asks what the team did differently, and
    // the answer includes them.
    //
    // It comes with an error bar, and it has to. Swapping a hero for a
    // blank changes the whole trajectory of a 60-second fight -- who
    // dies, in what order, who was holding what when -- so the two runs
    // diverge chaotically even off one seed, and the difference of two
    // noisy totals is noisier than either. Measured across sim counts,
    // Calima's lift held to 3% while Kiri's ran 112 / 72 / 15 and
    // Slick's changed SIGN. A lift smaller than its own error bar is
    // not a small contribution, it is an unmeasured one, and the table
    // says so rather than printing a number that reads like a finding.
    ...liftStats(runs, blanks),
    // Effective health: the pool an attacker actually has to chew
    // through, once this hero's dodges, reflects and guards are counted.
    // Survival time saturates in a mirror — nobody dies inside the
    // window — so this is what separates one tank from another.
    ehp: maxHp / Math.max(0.05, 1 - mitRatio),
    // The same kit against ONE opponent. A sweep collapses to a single
    // hit here and a single-target kit loses nothing, so the ratio
    // between this and `dps` is the plainest statement of which shape
    // of fight a hero is for.
    solo: avgSolo((r) => r.damage / r.seconds),
    'solo heal/s': avgSolo((r) => r.healing / r.seconds),
    boons: avg((r) => r.boons),
    hexes: avg((r) => r.hexes),
    // Action bar moved, per second, as a share of a full bar: 1.0 is one
    // whole turn's worth of meter a second. Kept as two columns because
    // taking a turn off an enemy and handing one to an ally are
    // different jobs even though they cost the same to buy.
    // Bars of action bar per second: 1.00 means this hero moves a whole
    // turn's worth of meter every second of the fight.
    'ap-/s': avg((r) => r.apTaken / r.seconds),
    'ap+/s': avg((r) => r.apGiven / r.seconds),
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
  ['solo', 'solo', 8, 1],
  ['boons', 'boons', 6, 2], ['hexes', 'hexes', 6, 2],
  ['ap-/s', 'ap-/s', 7, 3], ['ap+/s', 'ap+/s', 7, 3],
  // Both numbers, always. A lift is only a finding when it is bigger
  // than the bar beside it; printing the one without the other would
  // dress noise up as a measurement, which for the small-effect heroes
  // this column exists to measure is most of them.
  ['lift', 'lift', 8, 1], ['liftErr', '+/-', 7, 0],
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

// ---- Value ---------------------------------------------------------------
//
// One number for a hero, comparable across every role in the game.
//
// The bucket reports above deliberately refuse to do this: each bucket
// judges its members on the one axis that bucket exists for, and a tank's
// ehp and a healer's worth/s are not the same kind of number. That is
// right for balancing a role and useless for the question "is this
// 5-star actually better than that 3-star", which is a question about
// the whole roster at once.
//
// Value answers it by measuring six axes and adding them up:
//
//   offence     damage a second
//   durability  effective HP, and damage mitigated a second
//   healing     HP mended a second
//   buffing     damage a hero's blessings bought, and blessings held
//   debuffing   hexes held on the enemy side
//   tempo       action bar taken off enemies, and handed to allies
//
// Each raw figure is divided by the ROSTER MEAN of that figure, which is
// the whole trick: an axis only a fifth of the roster can post at all
// has a fifth of the mean, so its specialists score five times on it.
// Every axis therefore carries the same total mass across the roster,
// and a healer is not punished for dealing no damage any more than a
// striker is punished for mending none. Six axes, each averaging 1.00
// per hero, so a hero of exactly average worth on everything scores 6.
// The scale is then divided through so the 3-star cohort averages 1.00.
//
// Two axes pair two figures (durability, buffing, tempo); the pair is
// averaged before it enters the sum, so an axis is one share whether it
// is measured one way or two.
//
// Every hero is measured on ITS OWN HEX, in one shared reference cast --
// not the bucket casts the reports above use. A cross-role number has to
// come from a cross-role fight, or a front-row tank is being rated
// against other tanks and a back-row support against other supports, and
// the two readings never belonged on the same scale.

// The reference cast: one standard 7v7 drawn from the whole roster, the
// same one for every hero benched. Two picks from the middle of each of
// the six buckets, walking outward from each bucket's median, so the
// standard fight contains tanks to break, strikers for a blessing to
// ride, and menders to out-damage -- every axis has something in the
// room to work on. Dealt out by power, alternating sides, so neither
// side is the stronger one.
function referenceCast() {
  const byPower = (a, b) => powerOf(a) - powerOf(b) || a.id.localeCompare(b.id);
  const outward = ORDER.filter((k) => buckets[k] && buckets[k].length).map((k) => {
    const p = buckets[k].slice().sort(byPower);
    const mid = Math.floor(p.length / 2);
    const order = [];
    for (let d = 0; order.length < p.length; d++) {
      if (mid + d < p.length) order.push(p[mid + d]);
      if (d > 0 && mid - d >= 0) order.push(p[mid - d]);
    }
    return order;
  });
  const need = SQUAD - 1 + SQUAD;
  const picks = [];
  for (let i = 0; picks.length < need; i++) {
    let any = false;
    for (const p of outward) {
      if (!p[i]) continue;
      picks.push(p[i]);
      any = true;
      if (picks.length >= need) break;
    }
    if (!any) break;
  }
  picks.sort((a, b) => powerOf(b) - powerOf(a) || a.id.localeCompare(b.id));
  const allies = [];
  const foes = [];
  for (const d of picks) {
    const roomForFoes = foes.length < SQUAD;
    const toFoes = roomForFoes && (allies.length >= SQUAD - 1 || foes.length <= allies.length);
    (toFoes ? foes : allies).push(d);
  }
  const pool = Object.values(HEROES).slice().sort(byPower);
  return { pool, allies, foes };
}

// The direct run only. No solo pass and no blank pass: Value never asks
// what the kit is worth against one body or what the team would have
// done without it, so two thirds of the simulation is not run.
function measureValue(def, cast) {
  const runs = [];
  for (let i = 0; i < SIMS; i++) {
    runs.push(runOne(def, castWithout(cast, def), 1000 + i * 7919));
  }
  const avg = (pick) => runs.reduce((s, r) => s + pick(r), 0) / runs.length;
  const mitRatio = avg((r) => r.mitRatio);
  const maxHp = avg((r) => r.maxHp);
  return {
    id: def.id, name: def.name, rarity: def.rarity, power: powerOf(def),
    dps: avg((r) => r.damage / r.seconds),
    'heal/s': avg((r) => r.healing / r.seconds),
    'mit/s': avg((r) => r.mitigated / r.seconds),
    assist: avg((r) => r.assist / r.seconds),
    boons: avg((r) => r.boons),
    hexes: avg((r) => r.hexes),
    'ap-/s': avg((r) => r.apTaken / r.seconds),
    'ap+/s': avg((r) => r.apGiven / r.seconds),
    ehp: maxHp / Math.max(0.05, 1 - mitRatio),
  };
}

// Each axis, and the raw column(s) it is built from.
const AXES = [
  ['offence', ['dps']],
  ['durability', ['ehp', 'mit/s']],
  ['healing', ['heal/s']],
  ['buffing', ['assist', 'boons']],
  ['debuffing', ['hexes']],
  ['tempo', ['ap-/s', 'ap+/s']],
];
// Where the scale is pinned, and what the rarities are aiming at. The
// anchor is the 3-star cohort because it is the broadest and the least
// exceptional: 1.00 means "an ordinary 3-star's worth".
const VALUE_ANCHOR = 3;
const VALUE_TARGET = { 1: 0.70, 2: 0.85, 3: 1.00, 4: 1.15, 5: 1.30 };

function scoreValue(rows) {
  const mean = {};
  for (const [, cols] of AXES) {
    for (const c of cols) {
      mean[c] = rows.reduce((s, r) => s + (r[c] || 0), 0) / rows.length;
    }
  }
  for (const r of rows) {
    r.axes = {};
    for (const [axis, cols] of AXES) {
      // Square root, because an axis SATURATES. A hero mending nine
      // times the roster's average is not worth nine ordinary heroes to
      // a team of seven -- the fourth healer in a squad is worth less
      // than the first, and the same is true of the fourth striker.
      // Straight normals said otherwise and produced a table with a
      // 40x spread in which the median hero read 0.5 and no rarity
      // curve could exist; compression is the model of diminishing
      // returns the sum was missing, not a knob turned to fit.
      const parts = cols.map((c) =>
        (mean[c] > 0 ? Math.sqrt((r[c] || 0) / mean[c]) : 0));
      r.axes[axis] = parts.reduce((a, b) => a + b, 0) / parts.length;
    }
  }
  // Compression is not uniform across axes -- the more lopsided the
  // axis, the harder the root bites -- so each is divided through by its
  // own post-compression mean. Without this the flattest axes quietly
  // carry the most weight: offence took 24% of the total and tempo 11%,
  // for no reason but the shape of their distributions. After it, every
  // axis carries exactly one sixth, which is the claim this metric is
  // making and now the one it keeps.
  for (const [axis] of AXES) {
    const m = rows.reduce((s, r) => s + r.axes[axis], 0) / rows.length;
    if (m > 0) for (const r of rows) r.axes[axis] /= m;
  }
  for (const r of rows) r.raw = AXES.reduce((s, [a]) => s + r.axes[a], 0);
  const anchor = rows.filter((r) => r.rarity === VALUE_ANCHOR);
  const base = anchor.length
    ? anchor.reduce((s, r) => s + r.raw, 0) / anchor.length
    : rows.reduce((s, r) => s + r.raw, 0) / rows.length;
  for (const r of rows) {
    r.value = base > 0 ? r.raw / base : 0;
    for (const [axis] of AXES) r.axes[axis] /= base;
  }
  rows.sort((a, b) => b.value - a.value);
  return rows;
}

let refCastCache = null;
function valueBench() {
  const cast = (refCastCache ||= referenceCast());
  return scoreValue(Object.values(HEROES).map((def) => measureValue(def, cast)));
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
  valueBench, referenceCast, scoreValue, AXES, VALUE_TARGET, VALUE_ANCHOR,
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

// ---- The Value ranking ---------------------------------------------------
const valueRows = valueBench();
const refCast = refCastCache;
console.log(`\nVALUE — all ${valueRows.length} heroes on one scale, ` +
  `${SQUAD}v${SQUAD} against one shared cast, each on its own hex`);
console.log(`  reference allies: ${refCast.allies.map((d) => d.name).join(', ')}`);
console.log(`  reference foes:   ${refCast.foes.map((d) => d.name).join(', ')}`);
console.log('  ' + '#'.padStart(4) + '  ' + 'hero'.padEnd(24) + '★'.padStart(3) +
  AXES.map(([a]) => pad(a.slice(0, 6), 8)).join('') + pad('VALUE', 8));
valueRows.forEach((r, i) => {
  console.log('  ' + pad(i + 1, 4) + '  ' + r.name.padEnd(24) + pad(r.rarity, 3) +
    AXES.map(([a]) => pad(round(r.axes[a], 2), 8)).join('') +
    pad(round(r.value, 2), 8));
});
console.log('\n  by rarity — mean value, against the target curve');
for (const star of [1, 2, 3, 4, 5]) {
  const cohort = valueRows.filter((r) => r.rarity === star);
  if (!cohort.length) continue;
  const mean = cohort.reduce((s, r) => s + r.value, 0) / cohort.length;
  const target = VALUE_TARGET[star];
  const off = target > 0 ? mean / target - 1 : 0;
  console.log(`  ${star}★  ${pad(cohort.length, 3)} heroes   mean ` +
    `${pad(round(mean, 3), 6)}   target ${round(target, 2).toFixed(2)}   ` +
    `${off >= 0 ? '+' : ''}${(off * 100).toFixed(1)}%` +
    (Math.abs(off) > 0.10 ? '  ←← off curve' : ''));
}

if (CSV) {
  console.log('\nrank,hero,rarity,power,' +
    AXES.map(([a]) => a).join(',') + ',value');
  valueRows.forEach((r, i) => {
    console.log([i + 1, r.name, r.rarity, r.power,
      ...AXES.map(([a]) => round(r.axes[a], 3)), round(r.value, 3)].join(','));
  });
}

console.log(`\nOUTLIERS — ${flagged.length} hero(es) off their archetype's median`);
if (!flagged.length) console.log('  none; every bucket is within 0.4×–2× of its median');
for (const f of flagged.sort((a, b) => b.ratio - a.ratio)) {
  console.log(`  ${TITLE[f.key].padEnd(20)} ${f.name.padEnd(24)} ` +
    `${f.headline} ${pad(round(f.value), 8)}  ${round(f.ratio, 2)}× median`);
}
console.log(`\n${((Date.now() - started) / 1000).toFixed(1)}s\n`);
