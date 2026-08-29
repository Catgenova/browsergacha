// Rules tests: the roster has to survive contact with the engine.
// Every ability is executed and every hook is fired for every hero,
// then the systems that are easy to break silently (gear scoring, AI
// profiles, the damage meter, mirrors) get targeted checks.

const { loadGame, test, assert, report } = require('./harness');
const g = loadGame();
const { HEROES, BOSSES, Abilities, Unit, Gear, AI, Meter, POSITION, TEAM, Hex, CONFIG,
  Battle, GameState, RACES, DUMMIES, Progression, POSITIONALS, SUMMONS,
  Tower, ENEMIES } = g;

// The bottom of the roster. It used to be 1-star -- the generated
// cohorts filled that shelf -- and is 3-star now that only authored
// heroes remain, so the tests that want "the cheapest body available"
// ask rather than assume.
function lowestRarity(world = g) {
  return Math.min(...Object.values(world.HEROES).map((h) => h.rarity || 1));
}

// The cheapest shelf carrying at least `n` DIFFERENT characters. The
// bottom of the roster is not necessarily stocked: a sect's 1-star is
// exactly ONE hero by the sect's own shape, so a test that needs two
// distinct bodies to melt into each other asks for a shelf that can
// actually supply them instead of assuming the floor can.
function shelfOf(n, world = g) {
  const count = new Map();
  for (const h of Object.values(world.HEROES)) {
    const r = h.rarity || 1;
    count.set(r, (count.get(r) || 0) + 1);
  }
  const shelf = [...count.entries()]
    .filter(([, c]) => c >= n).map(([r]) => r).sort((a, b) => a - b)[0];
  assert(shelf !== undefined, `no rarity has ${n} characters on it`);
  return shelf;
}

// A battle stand-in: enough surface for hooks that reach for the field.
function makeBattle() {
  const slots = Hex.buildFormation(TEAM.PLAYER, 200, 200, 56);
  const eslots = Hex.buildFormation(TEAM.ENEMY, 600, 200, 56);
  const battle = {
    units: [],
    livingUnits(team = null) {
      return battle.units.filter((u) => u.alive && (team === null || u.team === team));
    },
    // spawnImpact is what a BREAKING shield reaches for (Unit.absorb
    // bursts the bubble), so any test that spends a ward to zero lands
    // here. It was missing simply because no test had broken one yet.
    addFloatingText() {}, log() {}, spawnImpact() {},
    // Summons arrive mid-fight, so the stand-in has to be able to seat
    // one. Same contract as the real Battle: refuse an occupied hex.
    placeUnit(unit, slotIndex) {
      const slot = battle.slotsFor(unit.team)[slotIndex];
      if (slot.unit) throw new Error(`Slot ${slotIndex} is occupied`);
      slot.unit = unit;
      unit.slot = slot;
      battle.units.push(unit);
    },
    onUnitHealed(healed, amount) {
      for (const u of battle.livingUnits(healed.team)) {
        for (const p of (u.hookSources ? u.hookSources() : u.passives)) {
          const hook = p.hooks && p.hooks.onAllyHealed;
          if (hook) hook(u, healed, battle);
        }
      }
    },
    playerSlots: slots, enemySlots: eslots,
    // The real Battle exposes its hexes this way, and effects that move
    // fighters between them (Tumble's Carousel) read it.
    slotsFor(team) {
      return team === TEAM.PLAYER ? battle.playerSlots : battle.enemySlots;
    },
  };
  return battle;
}
// Max every skill on a unit. The sweep put a 50% application gate under
// each debuff, so a test that asserts "the hex lands" is describing the
// fully-levelled skill, not the base one. Cheaper and clearer than
// stubbing the roll in a dozen places.
function maxSkill(unit, ...idxs) {
  for (const i of idxs) {
    unit.abilities[i].level = g.Progression.skillCap(unit.abilities[i].def, i);
  }
  return unit;
}

function place(battle, def, team, slotIdx) {
  const u = new Unit(def, team, { level: 30, stars: def.rarity || 3 });
  u.slot = (team === TEAM.PLAYER ? battle.playerSlots : battle.enemySlots)[slotIdx];
  battle.units.push(u);
  return u;
}

// Heroes of `element` whose SECT has no pack of its own.
//
// Sect packs use the same 2/3/4 thresholds as the element sets, stack
// with them, and pay the WHOLE party -- so a test that grabs "the first
// four water heroes" gets four Cryst and silently measures Cryst's pack
// as well as water's. Each element test asks for members no sect pack
// can reach, so it measures one thing.
function elementOnly(element, world = g) {
  const all = Object.values(world.HEROES).filter((h) => h.element === element);
  const clean = all.filter((h) => {
    const sect = world.RACES.sectOf(h);
    return !sect || !(world.RACES.SECT_PARTY_BONUSES[sect.id] || []).length;
  });
  // Some elements cannot be isolated at all: every light hero is a
  // Reverence hero, so fielding four light IS fielding four Reverence
  // and both sets always land together. Where that is true the test
  // takes the whole element and accounts for the sect explicitly --
  // see partyStatMult below.
  return (clean.length >= 4 ? clean : all).map((h) => h.id);
}

// The multiplier the party bonuses SHOULD produce on a flat stat, read
// off both tables rather than typed in. Fielding n heroes of one sect is
// also fielding n of its element, and the two layers stack -- so an
// element test that hard-codes its own number quietly starts testing two
// things the moment that sect gets a pack. Derived, it keeps testing
// that the engine applies what the tables say, whatever they say.
function sectOfIds(ids, world = g) {
  const sect = world.RACES.sectOf(world.HEROES[ids[0]]);
  return sect ? sect.id : null;
}

function partyStatMult(key, element, sectId, n, world = g) {
  const R = world.RACES;
  let m = 1;
  const fold = (tiers, count) => {
    for (const t of tiers) {
      const mods = t.modsFor ? t.modsFor(count) : t.mods;
      if (mods && mods[key]) m *= 1 + mods[key];
    }
  };
  fold(R.elementTiers(element, n), n);
  if (sectId) fold(R.sectTiers(sectId, n), n);
  return m;
}

// A body big enough to MEASURE against. Damage is clamped to the health
// actually left, so a test that reads "how hard did that land" off a
// dummy small enough to be killed by it reads the dummy's pool back
// instead of the hit -- and two different hits both come back as the
// same number, which reads as "the bonus did nothing". Widening the pool
// costs the test nothing: nothing here is measuring how long a rat
// lives. (Heroes got heavier when rarity moved into the base budget, and
// that is exactly when several of these fixtures started clamping.)
function roomy(unit, times = 20) {
  unit.maxHp *= times;
  unit.hp = unit.maxHp;
  return unit;
}

test('every hero ability resolves against a live target', () => {
  const battle = makeBattle();
  const foeA = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1);
  const foeB = place(battle, DUMMIES.rat_archer, TEAM.ENEMY, 4);
  const mate = place(battle, DUMMIES.rat_knight, TEAM.PLAYER, 4);
  const broken = [];
  for (const def of Object.values(HEROES)) {
    const u = place(battle, def, TEAM.PLAYER, 1);
    for (const st of u.abilities) {
      try {
        foeA.hp = foeA.maxHp; foeB.hp = foeB.maxHp;
        mate.hp = Math.round(mate.maxHp * 0.5);
        const res = Abilities.execute(st.def, u, foeA, battle);
        if (!Array.isArray(res)) broken.push(`${def.id}/${st.def.id}: no result array`);
      } catch (e) {
        broken.push(`${def.id}/${st.def.id}: ${e.message}`);
      }
    }
    battle.units.pop();
  }
  assert(broken.length === 0, broken.slice(0, 5).join(' | '));
});

test('every hero hook runs, in and out of position, hurt and healthy', () => {
  const battle = makeBattle();
  const foe = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1);
  const mate = place(battle, DUMMIES.rat_archer, TEAM.PLAYER, 4);
  const byPosition = {};
  for (const s of battle.playerSlots) byPosition[s.position] = s;
  const broken = [];
  for (const def of Object.values(HEROES)) {
    const u = place(battle, def, TEAM.PLAYER, 1);
    try {
      for (const slot of [byPosition[def.positional.position], { position: 'nowhere', x: 0, y: 0 }]) {
        u.slot = slot;
        for (const frac of [1, 0.45, 0.15]) {
          u.hp = Math.max(1, Math.round(u.maxHp * frac));
          u.startTurn(battle);
          u.damageDealtMult(foe); u.damageTakenMult(); u.dodgeChance();
          u.extraTurnChance(); u.debuffAccuracy(); u.debuffResistance();
          u.dotBoost(); u.stunChance(); u.apDrainChance();
          u.healingBoost(); u.reflectChance();
          u.effectiveStat('atk'); u.effectiveStat('def'); u.effectiveStat('speed');
        }
        battle.onUnitHealed(mate, 25);
      }
    } catch (e) {
      broken.push(`${def.id}: ${e.message}`);
    }
    battle.units.pop();
  }
  assert(broken.length === 0, broken.slice(0, 5).join(' | '));
});

test('every boss ability and passive resolves', () => {
  const battle = makeBattle();
  const hero = place(battle, DUMMIES.rat_knight, TEAM.PLAYER, 1);
  const broken = [];
  for (const def of Object.values(BOSSES)) {
    const b = new Unit(def, TEAM.ENEMY, { level: 50, stars: 5 });
    b.slot = battle.enemySlots[0];
    battle.units.push(b);
    try {
      for (const st of b.abilities) {
        hero.hp = hero.maxHp;
        Abilities.execute(st.def, b, hero, battle);
      }
      b.startTurn(battle);
      b.damageDealtMult(hero); b.damageTakenMult();
    } catch (e) { broken.push(`${def.id}: ${e.message}`); }
    battle.units.pop();
  }
  assert(broken.length === 0, broken.join(' | '));
});

test('AI profiles pick an ability and a target for every race', () => {
  const battle = makeBattle();
  const prey = [place(battle, DUMMIES.rat_archer, TEAM.PLAYER, 4),
    place(battle, DUMMIES.rat_knight, TEAM.PLAYER, 1)];
  const broken = [];
  for (const def of Object.values(HEROES)) {
    const u = place(battle, def, TEAM.ENEMY, 0);
    const profile = AI.profileFor(u);
    try {
      const pick = profile.pick(u.abilities, u, battle);
      assert(pick && pick.def, `${def.id}: profile returned no ability`);
      const focus = profile.focus(prey, u, battle);
      assert(focus, `${def.id}: profile returned no target`);
    } catch (e) { broken.push(`${def.id}: ${e.message}`); }
    battle.units.pop();
  }
  assert(broken.length === 0, broken.slice(0, 4).join(' | '));
});

test('bosses fight as tyrants and player heroes fight to the tactics', () => {
  const battle = makeBattle();
  const boss = new Unit(Object.values(BOSSES)[0], TEAM.ENEMY, { level: 50, stars: 5 });
  assert(AI.profileFor(boss).name === 'Tyrant', 'boss is not a tyrant');
  const hero = place(battle, DUMMIES.rat_archer, TEAM.PLAYER, 1);
  assert(AI.profileFor(hero).name === 'Your tactics',
    'player hero is not using the player tactics on auto');

  // Every option in every axis has to resolve to something the engine
  // can call, or a saved tactic silently falls back mid-fight.
  const foes = [place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1),
    place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 4)];
  for (const opt of AI.TACTICS.target) {
    GameState.setTactic('target', opt.id);
    const picked = AI.profileFor(hero).focus(foes, hero, battle);
    assert(foes.includes(picked), `target tactic ${opt.id} chose nobody`);
  }
  GameState.setTactic('target', 'lowest');

  const abilities = hero.abilities;
  for (const opt of AI.TACTICS.skills) {
    GameState.setTactic('skills', opt.id);
    const chosen = AI.profileFor(hero).pick(abilities, hero, battle);
    assert(abilities.includes(chosen), `skill tactic ${opt.id} chose nothing`);
  }
  // Basics only really means basics: never a cooldown when one is free.
  GameState.setTactic('skills', 'basic');
  assert(AI.profileFor(hero).pick(abilities, hero, battle).def.cooldown === 0,
    'basics-only spent a cooldown');
  GameState.setTactic('skills', 'burst');

  for (const opt of AI.TACTICS.support) {
    GameState.setTactic('support', opt.id);
    assert(AI.healThreshold(hero) === opt.threshold,
      `support tactic ${opt.id} did not move the heal threshold`);
  }
  GameState.setTactic('support', 'hurt');
  // Enemies are never steered by the player's tactics.
  GameState.setTactic('support', 'always');
  assert(AI.healThreshold(boss) === 0.8, 'player tactics leaked onto the enemy AI');
  GameState.setTactic('support', 'hurt');
});

test('a shield absorbs before HP and credits whoever raised it', () => {
  const battle = makeBattle();
  const hero = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
  const support = place(battle, DUMMIES.rat_archer, TEAM.PLAYER, 4);
  const foe = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
  foe.dodgeChance = () => 0;
  hero.hookSources = () => [];   // no guards of its own muddying the split
  hero.statusEffects = [];

  Meter.resetSession();
  hero.hp = hero.maxHp;
  hero.addShield(400, 3, support);
  assert(hero.shieldTotal() === 400, `shield reads ${hero.shieldTotal()}`);

  // A hit smaller than the shield costs no HP at all.
  const absorbed = hero.takeDamage(150, foe);
  assert(absorbed === 0, `HP loss should be 0, got ${absorbed}`);
  assert(hero.hp === hero.maxHp, 'a fully absorbed hit still cost HP');
  assert(hero.shieldTotal() === 250, `shield should be 250, got ${hero.shieldTotal()}`);
  const mit = Meter.rows('mitigated', 'battle');
  const supportRow = mit.list.find((r) => r.id === support.def.id);
  assert(supportRow && supportRow.value === 150,
    `the shield's caster should be credited 150, got ${JSON.stringify(mit.list)}`);

  // A hit bigger than the shield spills the remainder onto HP.
  const before = hero.hp;
  const through = hero.takeDamage(400, foe);
  assert(through === 150, `expected 150 through, got ${through}`);
  assert(hero.hp === before - 150, 'HP did not take the spill');
  assert(hero.shieldTotal() === 0, 'shield should be spent');
  // A spent shield does not linger as a zero-value status effect.
  assert(!hero.statusEffects.some((fx) => fx.kind === 'shield'),
    'an empty shield stack was left on the unit');
});

test('Javarious doubles his damage while the shield holds him at full HP', () => {
  const battle = makeBattle();
  const jav = place(battle, HEROES.javarious, TEAM.PLAYER, 1);
  const foe = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
  foe.dodgeChance = () => 0;
  jav.baseCritChance = 0;  // the doubling has to be readable, not lucky
  const cut = HEROES.javarious.abilities[0];

  const hit = () => {
    foe.hp = foe.maxHp;
    Abilities.execute(cut, jav, foe, battle);
    return foe.maxHp - foe.hp;
  };

  jav.hp = jav.maxHp;
  const full = hit();
  jav.hp = jav.maxHp - 1;   // one point off full
  const chipped = hit();
  assert(full > chipped * 1.9 && full < chipped * 2.1,
    `expected roughly double at full HP: ${full} vs ${chipped}`);

  // ...and a shield keeps him at full HP through a hit, so the doubling
  // survives being attacked. That is the whole kit.
  jav.hp = jav.maxHp;
  jav.statusEffects = [];
  jav.addShield(5000, 3, jav);
  jav.takeDamage(400, foe);
  assert(jav.hp === jav.maxHp, 'the shield let HP through');
  assert(hit() > chipped * 1.9, 'the doubling did not survive a shielded hit');

  // The front-hex positional turns his own damage into more shield.
  jav.statusEffects = [];
  jav.slot = battle.playerSlots.find((s) => s.position === POSITION.FRONT);
  assert(jav.positionalActive(), 'test needs Javarious on a front hex');
  hit();
  assert(jav.shieldTotal() > 0, 'landing a blow built no shield');
});

test('gear scoring prefers the piece that suits the hero', () => {
  const striker = { hp: 1000, atk: 400, def: 60, speed: 100 };
  const wall = { hp: 3000, atk: 90, def: 400, speed: 90 };
  const atkPiece = { slot: 'weapon', rarity: 'rare', level: 60, plus: 0,
    subs: [{ stat: 'atkPct', value: 0.3 }] };
  const defPiece = { slot: 'weapon', rarity: 'rare', level: 60, plus: 0,
    subs: [{ stat: 'defPct', value: 0.3 }] };
  assert(Gear.scoreFor(atkPiece, striker) > Gear.scoreFor(defPiece, striker),
    'striker should prefer the ATK piece');
  assert(Gear.scoreFor(defPiece, wall) > Gear.scoreFor(atkPiece, wall),
    'wall should prefer the DEF piece');
});

test('the damage meter credits the right side and separates its scopes', () => {
  Meter.resetSession();
  const battle = makeBattle();
  const hero = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
  const foe = place(battle, DUMMIES.rat_archer, TEAM.ENEMY, 1);
  Abilities.execute(hero.abilities[0].def, hero, foe, battle);
  const dealt = Meter.rows('damage', 'battle');
  assert(dealt.total > 0 && dealt.list[0].name === hero.name,
    `expected ${hero.name}, got ${JSON.stringify(dealt.list)}`);
  // Enemies never appear on the player's meter.
  Abilities.execute(foe.abilities[0].def, foe, hero, battle);
  assert(!Meter.rows('damage', 'session').list.some((r) => r.name === foe.name),
    'enemy damage leaked into the meter');
  const sessionTotal = Meter.rows('damage', 'session').total;
  Meter.resetBattle();
  assert(Meter.rows('damage', 'battle').total === 0, 'battle scope did not clear');
  assert(Meter.rows('damage', 'session').total === sessionTotal, 'session scope was cleared');
});

// The two ledgers. Damage is what a hero HIT for -- the whole of it,
// the number the battle log prints. Facilitated is the slice of that
// same hit somebody else's buff or break bought, booked on top rather
// than subtracted out. They double-count on purpose: the damage column
// used to disagree with the log by exactly the assists' share, which
// read as a bug every time a support stood behind a carry.
test('a hit credits its dealer in full and its enabler separately', () => {
  const battle = makeBattle();
  const hero = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
  const buffer = place(battle, DUMMIES.rat_archer, TEAM.PLAYER, 4);
  const foe = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
  // No dodging, no crits: the split has to be readable, not lucky.
  foe.dodgeChance = () => 0;
  const hit = () => {
    Meter.resetSession();
    foe.hp = foe.maxHp;
    const before = foe.hp;
    Abilities.strike(hero, foe, 1000, { dodge: false, reflect: false });
    const landed = before - foe.hp;
    const dmg = Meter.rows('damage', 'battle');
    const fac = Meter.rows('facilitated', 'battle');
    const by = (rows, u) =>
      (rows.list.find((r) => r.id === u.def.id) || { value: 0 }).value;
    return { landed, total: dmg.total, hero: by(dmg, hero),
      heroFac: by(fac, hero), buffer: by(dmg, buffer), bufferFac: by(fac, buffer) };
  };

  const plain = hit();
  assert(plain.buffer === 0 && plain.bufferFac === 0,
    'an unbuffed swing credited someone who did nothing');
  assert(Math.abs(plain.hero - plain.landed) <= 1,
    `an unassisted hit of ${plain.landed} metered as ${plain.hero}`);

  hero.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.5, turns: 5, source: buffer });
  const buffed = hit();
  assert(buffed.bufferFac > 0, 'the buffer got no credit for a +50% ATK buff');
  // The buffer's slice is FACILITATION, not damage: they swung at
  // nothing, so their damage column stays empty.
  assert(buffed.buffer === 0,
    `the buffer was booked ${buffed.buffer} damage without throwing a punch`);
  // And the attacker keeps the WHOLE hit. This is the assertion the
  // screenshot was about: the log said 27,083 and the column said
  // 21,169, because the assists had been taken out of it.
  assert(Math.abs(buffed.hero - buffed.landed) <= 1,
    `the log would say ${buffed.landed}, the damage column says ${buffed.hero}`);
  // A x1.5 buff bought a third of the hit (1 - 1/1.5).
  const share = buffed.bufferFac / buffed.landed;
  assert(Math.abs(share - 1 / 3) < 0.02,
    `expected a third of the hit, got ${share.toFixed(3)}`);

  // Self-buffs are the hero's own business -- and they do not make a
  // hero facilitate their own swing either.
  hero.statusEffects = [];
  hero.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.5, turns: 5, source: hero });
  const solo = hit();
  assert(solo.buffer === 0 && solo.bufferFac === 0,
    'a self-buff was credited to somebody else');
  assert(solo.heroFac === 0, 'a hero facilitated their own hit');

  // An armour break on the target is the same kind of assist.
  hero.statusEffects = [];
  foe.addStatusEffect({ kind: 'debuff', stat: 'def', mult: 0.5, turns: 5, source: buffer });
  const broken = hit();
  assert(broken.bufferFac > 0, 'the armour break earned its caster nothing');
  assert(Math.abs(broken.hero - broken.landed) <= 1,
    'the armour break was taken out of the attacker\'s column');

  // ...but never across the line: an enemy's debuff is not our assist.
  foe.statusEffects = [];
  foe.addStatusEffect({ kind: 'debuff', stat: 'def', mult: 0.5, turns: 5, source: foe });
  const leak = hit();
  assert(leak.buffer === 0 && leak.bufferFac === 0,
    'credit leaked to a unit on the other team');
});

test("Leonardo's rite lifts two debuffs and his rebuke stalls the readiest foe", () => {
  const battle = makeBattle();
  const leo = place(battle, HEROES.leonardo, TEAM.PLAYER, 1);
  leo.slot = battle.playerSlots.find((s) => s.position === POSITION.CENTER);
  const mate = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
  const foeA = place(battle, DUMMIES.rat_archer, TEAM.ENEMY, 1);
  const foeB = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 4);

  // Rite of Absolution: two of three afflictions lifted, oldest first.
  mate.addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.9, turns: 3 });
  mate.addStatusEffect({ kind: 'dot', amount: 10, turns: 3 });
  mate.addStatusEffect({ kind: 'debuff', stat: 'def', mult: 0.9, turns: 3 });
  const rite = leo.abilities.find((a) => a.def.id === 'rite_of_absolution');
  Abilities.execute(rite.def, leo, mate, battle);
  const badLeft = mate.statusEffects.filter((fx) => fx.kind === 'debuff' || fx.kind === 'dot');
  assert(badLeft.length === 1 && badLeft[0].stat === 'def',
    `expected only the newest debuff to survive, got ${JSON.stringify(badLeft)}`);

  // Exalted Rebuke: with three buffs up at turn start, the enemy with
  // the fullest meter loses 20%; the other foe is untouched.
  for (const stat of ['atk', 'def', 'speed']) {
    leo.addStatusEffect({ kind: 'buff', stat, mult: 1.1, turns: 5 });
  }
  foeA.turnMeter = 800; foeB.turnMeter = 900;
  leo.startTurn(battle);
  assert(foeB.turnMeter === 900 - CONFIG.TURN_METER_MAX * 0.2,
    `readiest foe should lose 20% meter, has ${foeB.turnMeter}`);
  assert(foeA.turnMeter === 800, 'the rebuke hit the wrong enemy');

  // Two buffs are one short of the vow.
  leo.statusEffects = [];
  leo.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.1, turns: 5 });
  leo.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.1, turns: 5 });
  foeB.turnMeter = 900;
  leo.startTurn(battle);
  assert(foeB.turnMeter === 900, 'the rebuke fired below three buffs');
});

test('a speed buff banks meter gifts for the hero who granted it', () => {
  const battle = makeBattle();
  const runner = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
  const buffer = place(battle, DUMMIES.rat_archer, TEAM.PLAYER, 4);
  const foe = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);

  // Doubled speed means half of every tick's fill is the buffer's gift.
  runner.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 2, turns: 5, source: buffer });
  runner.bankSpeedGifts(100);
  runner.bankSpeedGifts(100);
  assert(runner.meterGifts.length === 1, 'ticks should merge into one gift per source');
  assert(runner.meterGifts[0].source === buffer, 'gift banked to the wrong hero');
  assert(Math.abs(runner.meterGifts[0].amount - 100) < 1e-6,
    `a x2 buff should own half the fill, banked ${runner.meterGifts[0].amount}`);

  // A self-buff and an enemy slow are nobody's gift.
  runner.statusEffects = [];
  runner.meterGifts = [];
  runner.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.3, turns: 5, source: runner });
  runner.addStatusEffect({ kind: 'debuff', stat: 'speed', mult: 0.5, turns: 5, source: foe });
  runner.bankSpeedGifts(100);
  assert(runner.meterGifts.length === 0, 'a self-buff or a slow banked a gift');
});

test('def walls and damage marks credit their caster', () => {
  const battle = makeBattle();
  const mate = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
  const buffer = place(battle, DUMMIES.rat_knight, TEAM.PLAYER, 4);
  const foe = place(battle, DUMMIES.rat_archer, TEAM.ENEMY, 1);
  mate.hookSources = () => []; foe.hookSources = () => [];
  mate.dodgeChance = () => 0; foe.dodgeChance = () => 0;

  // A +50% DEF wall: the hit that lands is smaller, and the difference
  // is mitigation belonging to whoever raised the wall.
  Meter.resetSession();
  mate.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.5, turns: 5, source: buffer });
  Abilities.strike(foe, mate, 1000, { dodge: false, reflect: false });
  const mit = Meter.rows('mitigated', 'battle');
  const walled = (mit.list.find((r) => r.id === buffer.def.id) || { value: 0 }).value;
  assert(walled > 0, 'a DEF wall earned its caster no mitigation');
  mate.statusEffects = [];

  // An amplify mark on the enemy is the offensive twin: the extra slice
  // of every hit belongs to whoever branded the target.
  Meter.resetSession();
  foe.addStatusEffect({ kind: 'debuff', stat: 'damageTaken', mult: 1.35, turns: 2, source: buffer });
  Abilities.strike(mate, foe, 1000, { dodge: false, reflect: false });
  const dmg = Meter.rows('damage', 'battle');
  const fac = Meter.rows('facilitated', 'battle');
  const by = (rows, u) =>
    (rows.list.find((r) => r.id === u.def.id) || { value: 0 }).value;
  assert(by(fac, buffer) > 0, 'an amplify mark earned its caster nothing');
  // Facilitation, not damage: the brander never swung.
  assert(by(dmg, buffer) === 0,
    `the mark's caster was booked ${by(dmg, buffer)} damage of their own`);
  // The hero who threw the punch keeps the whole of it.
  assert(Math.abs(by(dmg, mate) - dmg.total) <= 1,
    'the mark was taken out of the attacker\'s column');
  // A x1.35 mark owns 1 - 1/1.35 of the hit.
  assert(Math.abs(by(fac, buffer) / dmg.total - (1 - 1 / 1.35)) < 0.02,
    `mark share off: ${(by(fac, buffer) / dmg.total).toFixed(3)}`);
});

test('a buffed or bought mend credits its enabler', () => {
  const battle = makeBattle();
  // Any healer whose mend scales off ATK.
  const healerDef = Object.values(HEROES).find((h) => (h.abilities || []).some((a) =>
    Abilities.sideOf(a.targeting) === 'ally' &&
    (a.effects || []).some((e) => e.type === 'heal')));
  assert(healerDef, 'no ATK-scaled healer anywhere in the roster');
  const healer = place(battle, healerDef, TEAM.PLAYER, 4);
  const mate = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
  const buffer = place(battle, DUMMIES.rat_archer, TEAM.PLAYER, 5);
  const healAb = healer.abilities.find((a) =>
    Abilities.sideOf(a.def.targeting) === 'ally' &&
    (a.def.effects || []).some((e) => e.type === 'heal'));

  const mend = () => {
    Meter.resetSession();
    mate.hp = 1; // room for the whole heal, so shares are exact
    const before = mate.hp;
    Abilities.execute(healAb.def, healer, mate, battle);
    const restored = mate.hp - before;
    const heal = Meter.rows('healing', 'battle');
    const fac = Meter.rows('facilitated', 'battle');
    const by = (rows, u) =>
      (rows.list.find((r) => r.id === u.def.id) || { value: 0 }).value;
    return { restored, total: heal.total, healer: by(heal, healer),
      buffer: by(heal, buffer), bufferFac: by(fac, buffer) };
  };

  const bare = mend();
  assert(bare.buffer === 0 && bare.bufferFac === 0,
    'an unbuffed mend credited someone who did nothing');
  assert(Math.abs(bare.healer - bare.restored) <= 1,
    `a mend of ${bare.restored} metered as ${bare.healer}`);

  // An ATK buff multiplies an ATK-scaled heal, so its granter owns the
  // slice it added — a third, at x1.5 — booked as facilitation on top
  // of the healer's full number rather than carved out of it.
  healer.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.5, turns: 5, source: buffer });
  const buffed = mend();
  assert(buffed.bufferFac > 0, 'the buffer got no credit for a buffed heal');
  assert(buffed.buffer === 0,
    `the buffer was booked ${buffed.buffer} healing without mending anyone`);
  assert(Math.abs(buffed.healer - buffed.restored) <= 1,
    `the log would say ${buffed.restored} restored, the column says ${buffed.healer}`);
  assert(Math.abs(buffed.bufferFac / buffed.restored - 1 / 3) < 0.02,
    `expected a third of the heal, got ${(buffed.bufferFac / buffed.restored).toFixed(3)}`);

  // A turn bought with meter pushes pays its patron the same way:
  // half the meter given means half the turn's mend (capped at 60%).
  healer.statusEffects = [];
  healer.turnGifts = [{ source: buffer, amount: CONFIG.TURN_METER_MAX / 2 }];
  const bought = mend();
  assert(Math.abs(bought.bufferFac / bought.restored - 0.5) < 0.02,
    `a half-bought turn should pay half the mend, got ${(bought.bufferFac / bought.restored).toFixed(3)}`);
  healer.turnGifts = [];
});

test('a ward credits its mitigation to the support who cast it', () => {
  const battle = makeBattle();
  // A protector whose kit reduces an ally's damageTaken. No authored
  // hero casts one yet, so the search takes in the enemy bodies too --
  // the mechanic is the engine's, not any one hero's.
  const wardDef = [...Object.values(HEROES), ...Object.values(DUMMIES)]
    .find((h) => h.abilities.some((a) =>
      (a.effects || []).some((e) => e.type === 'buff' && e.stat === 'damageTaken')));
  assert(wardDef, 'no damageTaken ward anywhere in the roster');
  const ward = place(battle, wardDef, TEAM.PLAYER, 4);
  const mate = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
  const foe = place(battle, DUMMIES.rat_archer, TEAM.ENEMY, 1);
  const wardAb = wardDef.abilities.find((a) =>
    (a.effects || []).some((e) => e.type === 'buff' && e.stat === 'damageTaken'));

  // Unwarded first: everything prevented belongs to the target.
  Meter.resetSession();
  mate.hookSources = () => [];      // silence the ally's own guards
  mate.statusEffects = [];
  Abilities.execute(foe.abilities[0].def, foe, mate, battle);
  const solo = Meter.rows('mitigated', 'battle');
  assert(!solo.list.some((r) => r.id === wardDef.id),
    'the ward was credited before it was even cast');

  // Warded: the support takes a share of what it prevented.
  Meter.resetSession();
  mate.hp = mate.maxHp;
  Abilities.execute(wardAb, ward, mate, battle);
  const shielded = mate.statusEffects.some((fx) =>
    fx.stat === 'damageTaken' && fx.source === ward);
  assert(shielded, 'the ward did not land, or carries no source');
  for (let i = 0; i < 6; i++) {
    Abilities.execute(foe.abilities[0].def, foe, mate, battle);
  }
  const rows = Meter.rows('mitigated', 'battle');
  const wardRow = rows.list.find((r) => r.id === wardDef.id);
  assert(wardRow && wardRow.value > 0,
    `the ward earned no mitigation: ${JSON.stringify(rows.list)}`);

  // And a ward a hero puts on itself stays its own.
  Meter.resetSession();
  ward.statusEffects = [];
  ward.addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.5, turns: 9, source: ward });
  const own = ward.damageTakenBreakdown();
  assert(own.contributors.length === 0,
    'a self-cast ward should not be credited as somebody else\'s work');
});

test('healing is credited to the healer, once, however it lands', () => {
  const battle = makeBattle();
  // A cleric with a direct heal and a regen (hot) on its kit.
  const clericDef = Object.values(HEROES).find((h) =>
    h.abilities.some((a) => (a.effects || []).some((e) => e.type === 'hot')) &&
    h.abilities.some((a) => (a.effects || []).some((e) => e.type === 'heal' || e.type === 'healHpPct')));
  const cleric = place(battle, clericDef, TEAM.PLAYER, 4);
  const mate = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
  const healAb = clericDef.abilities.find((a) =>
    (a.effects || []).some((e) => e.type === 'heal' || e.type === 'healHpPct'));
  const hotAb = clericDef.abilities.find((a) =>
    (a.effects || []).some((e) => e.type === 'hot'));

  // A direct heal is booked to the caster exactly once — not to the
  // patient, and not to both.
  Meter.resetSession();
  mate.hp = 1;
  const before = mate.hp;
  Abilities.execute(healAb, cleric, mate, battle);
  const gained = mate.hp - before;
  const direct = Meter.rows('healing', 'battle');
  assert(gained > 0, 'the heal restored nothing, so this proves nothing');
  assert(direct.total === gained,
    `heal double-counted: ${direct.total} booked for ${gained} HP restored`);
  assert(direct.list.length === 1 && direct.list[0].name === cleric.name,
    `expected only ${cleric.name}: ${JSON.stringify(direct.list)}`);

  // Regen ticks belong to whoever applied the buff, not the ally
  // ticking it down.
  Meter.resetSession();
  mate.hp = 1;
  // Silence the patient's own turn-start healing (passive, positional,
  // gear regen) so the only thing on the ledger is the regen tick.
  mate.hookSources = () => [];
  mate.gearRegen = 0;
  Abilities.execute(hotAb, cleric, mate, battle);
  mate.startTurn(battle);
  const regen = Meter.rows('healing', 'battle');
  assert(regen.total > 0, 'the regen never ticked');
  assert(!regen.list.some((r) => r.name === mate.name),
    `regen was credited to the patient: ${JSON.stringify(regen.list)}`);
  assert(regen.list[0].name === cleric.name,
    `expected ${cleric.name}: ${JSON.stringify(regen.list)}`);
});

test('crystal mirrors halve nothing, reflect a quarter, and break one per hit', () => {
  Meter.resetSession();
  const battle = makeBattle();
  const echo = place(battle, HEROES.echo, TEAM.PLAYER, 1);
  const foe = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1);
  assert(echo.mirrors === 6, `starts with ${echo.mirrors} mirrors`);
  const foeBefore = foe.hp;
  const dealt = echo.takeDamage(200, foe);
  assert(dealt === 200, `mirrors should not blunt the hit: ${dealt}`);
  assert(echo.mirrors === 5, `mirror did not break: ${echo.mirrors}`);
  assert(foe.hp === foeBefore - 50, `reflect was ${foeBefore - foe.hp}, expected 50`);
});

test('every damage path is mitigated, whatever it scaled off', () => {
  const battle = makeBattle();
  const prevActive = Battle.active;
  Battle.active = battle;
  try {
    // A wall of a target: high DEF is the whole point of the check.
    const wall = place(battle, HEROES.toll, TEAM.ENEMY, 1);
    wall.dodgeChance = () => 0;
    wall.reflectChance = () => 0;
    // Toll is here for his DEF, not his kit: his own ward would mend him
    // mid-measurement and the HP accounting would stop meaning anything.
    wall.hookSources = () => [];
    const def = wall.effectiveStat('def');
    assert(def > 300, `the target's DEF (${def}) is too low to prove anything`);

    // ATK-scaled, DEF-scaled and max-HP-scaled all land at the same
    // fraction of their raw figure — none of them is a way around DEF.
    const RAW = 10000;
    const expected = Math.round(
      Abilities.damageFormula(RAW, def) * wall.damageTakenMult());
    assert(expected < RAW * 0.5,
      `DEF ${def} should blunt a raw ${RAW} well past half, got ${expected}`);

    const caster = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
    const before = wall.hp;
    const res = Abilities.strike(caster, wall, RAW);
    assert(res.amount === expected,
      `strike dealt ${res.amount}, expected ${expected}`);
    assert(before - wall.hp === expected, 'HP lost did not match the result');

    // And the effects that used to bypass it now route through it. A
    // max-HP hit from a big pool must not out-damage the curve.
    wall.hp = wall.maxHp;
    const fat = place(battle, HEROES.toll, TEAM.PLAYER, 2);
    const hpRaw = fat.maxHp * 0.5;
    const hpBefore = wall.hp;
    Abilities.execute(
      { id: 't', name: 't', targeting: 'enemy', cooldown: 0,
        effects: [{ type: 'damageHpPct', pct: 0.5 }] },
      fat, wall, battle);
    const landed = hpBefore - wall.hp;
    assert(landed > 0, 'the max-HP hit did nothing');
    assert(landed < hpRaw * 0.5,
      `max-HP damage skipped the curve: ${landed} landed from a raw ${Math.round(hpRaw)}`);
  } finally {
    Battle.active = prevActive;
  }
});

test('onStruck retaliation fires on a survived hit, and only then', () => {
  const battle = makeBattle();
  const prevActive = Battle.active;
  Battle.active = battle; // struck() needs a live battle to hand the hooks
  try {
    const toll = place(battle, HEROES.toll, TEAM.PLAYER, 1);
    const mate = place(battle, DUMMIES.rat_archer, TEAM.PLAYER, 4);
    const foes = [1, 2, 4].map((i) => place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, i));
    const byPosition = {};
    for (const sl of battle.playerSlots) byPosition[sl.position] = sl;
    toll.slot = byPosition[POSITION.FRONT];

    // The bell is priced in DEF, but what it COSTS is decided by the
    // target — it goes through the same pipeline an ability does.
    const raw = Math.round(toll.effectiveStat('def') * 0.10);
    const mend = Math.round(toll.effectiveStat('def') * 0.05);
    assert(raw > 0 && mend > 0, 'Toll has no DEF to price his kit off');
    for (const f of foes) { f.dodgeChance = () => 0; f.reflectChance = () => 0; }
    const ring = Math.round(
      Abilities.damageFormula(raw, foes[0].effectiveStat('def')) *
      foes[0].damageTakenMult());
    assert(ring < raw,
      `the bell was not mitigated: ${ring} landed from a raw ${raw}`);

    // Struck and survived: the bell hits every enemy, the ward mends.
    mate.hp = Math.round(mate.maxHp * 0.5);
    const mateBefore = mate.hp;
    const foeBefore = foes.map((f) => f.hp);
    toll.takeDamage(1, foes[0]);
    for (let i = 0; i < foes.length; i++) {
      assert(foeBefore[i] - foes[i].hp === ring,
        `enemy ${i} took ${foeBefore[i] - foes[i].hp}, expected ${ring}`);
    }
    assert(mate.hp - mateBefore === mend,
      `ally mended ${mate.hp - mateBefore}, expected ${mend}`);

    // Out of position: the ward is silent, the passive still rings.
    toll.slot = byPosition[POSITION.BACK];
    mate.hp = Math.round(mate.maxHp * 0.5);
    const outBefore = mate.hp;
    const foeOut = foes[0].hp;
    toll.takeDamage(1, foes[0]);
    assert(mate.hp === outBefore, 'the positional ward healed out of position');
    assert(foes[0].hp < foeOut, 'the passive should ring from any hex');

    // A killing blow retaliates for nothing — the dead do not answer.
    toll.slot = byPosition[POSITION.FRONT];
    const killBefore = foes.map((f) => f.hp);
    toll.takeDamage(toll.hp, foes[0]);
    assert(!toll.alive, 'the killing blow did not kill');
    assert(foes.every((f, i) => f.hp === killBefore[i]),
      'a dead unit retaliated');
  } finally {
    Battle.active = prevActive;
  }
});

test('retaliation cannot recurse when both sides answer blows', () => {
  const battle = makeBattle();
  const prevActive = Battle.active;
  Battle.active = battle;
  try {
    const byPosition = {};
    for (const sl of battle.playerSlots) byPosition[sl.position] = sl;
    const mine = place(battle, HEROES.toll, TEAM.PLAYER, 1);
    mine.slot = byPosition[POSITION.FRONT];
    // The same kit on the other side: without the guard each ring counts
    // as a strike and the two bounce off each other until someone dies.
    const theirs = place(battle, HEROES.toll, TEAM.ENEMY, 1);
    theirs.dodgeChance = () => 0;
    theirs.reflectChance = () => 0;
    const raw = Math.round(mine.effectiveStat('def') * 0.10);
    const ring = Math.round(
      Abilities.damageFormula(raw, theirs.effectiveStat('def')) *
      theirs.damageTakenMult());
    // Start him off the cap: his ward mends more than the 50-point poke
    // below, so a full-health Toll would heal straight back to maxHp and
    // the net would read 0 whether one bell rang or four.
    mine.hp = Math.round(mine.maxHp * 0.5);
    const mineBefore = mine.hp;
    const theirsBefore = theirs.hp;

    let threw = null;
    try { mine.takeDamage(50, theirs); } catch (e) { threw = e; }
    assert(!threw, `retaliation recursed: ${threw && threw.message}`);

    // Exactly one bell: retaliation damage is not itself a strike, so
    // the answer is never answered. Counting the damage is what proves
    // it — a cascade that happens to terminate still throws nothing.
    assert(theirsBefore - theirs.hp === ring,
      `their Toll took ${theirsBefore - theirs.hp}, expected exactly one ring of ${ring}`);
    // His own ward mends the whole party, himself included, so the net
    // loss is the strike less one mend — and nothing else. Anything more
    // would be their bell answering his.
    const mend = Math.round(mine.effectiveStat('def') * 0.05);
    assert(mineBefore - mine.hp === 50 - mend,
      `my Toll netted ${mineBefore - mine.hp}, expected ${50 - mend} ` +
      `(a 50 strike less his own ${mend} ward)`);
    assert(Unit.retaliating === false, 'the re-entrancy flag was left set');
  } finally {
    Battle.active = prevActive;
  }
});

test('positional hooks only fire in their own hex', () => {
  const battle = makeBattle();
  // Reckless Charge moves damage taken the OTHER way -- the point of
  // the test is that the hook is silent off its own hex, whichever
  // direction it pushes.
  const wallHero = Object.values(HEROES).find((h) =>
    h.positional.id === 'reckless_charge');
  assert(wallHero, 'no hero wears a damage-taken positional');
  const u = place(battle, wallHero, TEAM.PLAYER, 1);
  const byPosition = {};
  for (const s of battle.playerSlots) byPosition[s.position] = s;
  u.slot = byPosition[POSITION.FRONT];
  u.hp = u.maxHp;
  const inPlace = u.damageTakenMult();
  u.slot = { position: 'nowhere', x: 0, y: 0 };
  const outOfPlace = u.damageTakenMult();
  assert(inPlace !== 1, `the hex hook did nothing in position: ${inPlace}`);
  assert(outOfPlace === 1, `the hex hook still applied out of position: ${outOfPlace}`);
});



// ---- Threat, telegraphs, elements ---------------------------------------

test('the front line draws attacks away from the back', () => {
  const battle = makeBattle();
  const byPos = {};
  for (const s of battle.playerSlots) byPos[s.position] = s;
  const wall = place(battle, DUMMIES.rat_knight, TEAM.PLAYER, 1);
  const squishy = place(battle, DUMMIES.rat_archer, TEAM.PLAYER, 4);
  wall.slot = byPos[POSITION.FRONT];
  squishy.slot = byPos[POSITION.BACK];
  // The back-liner is far softer, so the old AI always picked it.
  squishy.hp = Math.round(squishy.maxHp * 0.2);
  const attacker = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1);
  const profile = AI.profileFor(attacker);
  let hitWall = 0;
  for (let i = 0; i < 400; i++) {
    if (profile.focus([wall, squishy], attacker, battle) === wall) hitWall++;
  }
  assert(hitWall > 200, `front line only drew ${hitWall}/400 attacks`);
  assert(hitWall < 400, 'the back line should never be perfectly safe');
});

test('a taunt overrides target choice entirely', () => {
  const battle = makeBattle();
  const byPos = {};
  for (const s of battle.playerSlots) byPos[s.position] = s;
  const bait = place(battle, DUMMIES.rat_knight, TEAM.PLAYER, 1);
  const squishy = place(battle, DUMMIES.rat_archer, TEAM.PLAYER, 4);
  bait.slot = byPos[POSITION.BACK];       // not even in front
  squishy.slot = byPos[POSITION.FRONT];
  bait.addStatusEffect({ kind: 'buff', stat: 'taunt', turns: 2 });
  const attacker = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1);
  const profile = AI.profileFor(attacker);
  for (let i = 0; i < 50; i++) {
    assert(profile.focus([bait, squishy], attacker, battle) === bait,
      'taunt was ignored');
  }
});

test('elemental advantage is reported on the damage result', () => {
  const battle = makeBattle();
  const water = place(battle, HEROES.echo, TEAM.PLAYER, 1);
  const fire = Object.values(HEROES).find((h) => h.element === 'fire');
  const wind = Object.values(HEROES).find((h) => h.element === 'wind');
  const vsFire = place(battle, fire, TEAM.ENEMY, 1);
  const vsWind = place(battle, wind, TEAM.ENEMY, 4);
  vsFire.gearDodge = 0; vsWind.gearDodge = 0;
  const strong = Abilities.execute(water.abilities[0].def, water, vsFire, battle)
    .find((r) => r.kind === 'damage');
  const weak = Abilities.execute(water.abilities[0].def, water, vsWind, battle)
    .find((r) => r.kind === 'damage');
  assert(strong.elem > 1, `water into fire should be strong: ${strong.elem}`);
  assert(weak.elem < 1, `water into wind should be resisted: ${weak.elem}`);
});

test('achievements all report sane progress and rewards', () => {
  // Achievements read live GameState, which the harness does not load;
  // check the definitions themselves stay well-formed.
  const src = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'js/achievements.js'), 'utf8');
  assert(/const ACHIEVEMENTS = /.test(src), 'ACHIEVEMENTS not defined');
  const ids = [...src.matchAll(/id: `?race_\$\{race\}`?|id: '([a-z0-9_]+)'/g)]
    .map((m) => m[1]).filter(Boolean);
  assert(new Set(ids).size === ids.length, 'duplicate achievement ids');
  assert(ids.length >= 10, `only ${ids.length} achievements defined`);
});

test('every substat prints as the kind of number it is', () => {
  // accuracy and resistance are fractions like crit is, and were being
  // printed raw ("+0.06 Accuracy") because the formatter guessed from
  // the stat name instead of asking the pool.
  const bad = [];
  for (let i = 0; i < 60; i += 1) {
    const piece = Gear.drop('dragon', 14);
    for (const sub of piece.subs) {
      const text = Gear.subLabel(sub);
      // A fractional value must never be printed as a bare decimal.
      if (sub.value < 1 && !text.includes('%')) {
        bad.push(`${sub.stat} ${sub.value} -> "${text}"`);
      }
    }
  }
  assert(bad.length === 0, [...new Set(bad)].slice(0, 4).join(' | '));
});

test('team presets round-trip and survive a hero going missing', () => {
  const { GameState } = g;
  const ids = ['carl', 'silas', 'angelica']
    .map((heroId) => GameState.addHero(heroId).uid);
  ids.forEach((uid, i) => GameState.setTeamSlot(i, uid));
  const before = GameState.getTeam();

  assert(GameState.savePreset('  Hunt  ') === 'Hunt', 'the name was not trimmed');
  GameState.clearTeam();
  assert(GameState.teamSize() === 0, 'the team did not clear');
  const r = GameState.loadPreset('Hunt');
  assert(r && r.placed === ids.length && r.missing === 0, JSON.stringify(r));
  assert(JSON.stringify(GameState.getTeam()) === JSON.stringify(before),
    'the formation came back different');

  // Saving the same name again overwrites rather than duplicating.
  const n = GameState.presets().length;
  GameState.savePreset('Hunt');
  assert(GameState.presets().length === n, 'a second entry appeared for one name');

  // A preset naming a hero the player does not own places the rest
  // rather than a slot pointing at nothing. setTeamSlot does not check
  // ownership, so a snapshot taken with a bogus id is the same shape as
  // a save whose hero was removed from the roster later.
  GameState.setTeamSlot(5, 'a_hero_that_is_gone');
  GameState.savePreset('Ghost');
  GameState.clearTeam();
  const ghost = GameState.loadPreset('Ghost');
  assert(ghost.missing === 1,
    `expected 1 missing hero, got ${JSON.stringify(ghost)}`);
  assert(ghost.placed === ids.length, `placed ${ghost.placed} of ${ids.length}`);
  assert(!Object.values(GameState.getTeam()).includes('a_hero_that_is_gone'),
    'the missing hero was placed anyway');
  GameState.deletePreset('Ghost');

  assert(GameState.loadPreset('nope') === null, 'an unknown preset loaded something');
  assert(GameState.deletePreset('Hunt') === true, 'delete failed');
  assert(!GameState.presets().some((p) => p.name === 'Hunt'), 'it survived deletion');
});

test('favourites toggle, persist, and lead every sort order', () => {
  const { GameState } = g;
  // Keepers pin themselves on arrival: a 5-star, a Dark/Light 4-star, or
  // any blessed copy. The blessing roll is random, so heroes added by
  // earlier tests may already sit at the top of the order -- clear the
  // board first, or this test fails roughly one run in eight on a rule
  // it is not testing. (This is what has been failing CI.)
  for (const uid of GameState.ownedHeroIds()) {
    if (GameState.isFavorite(uid)) GameState.toggleFavorite(uid);
  }
  const pinned = GameState.addHero('angelica').uid;
  if (GameState.isFavorite(pinned)) GameState.toggleFavorite(pinned);
  assert(!GameState.isFavorite(pinned), 'heroes should not start favourited');
  assert(GameState.toggleFavorite(pinned) === true, 'toggle did not set it');
  assert(GameState.isFavorite(pinned), 'the favourite did not stick');
  const count = GameState.favoriteCount();

  // Reloading a save must bring favourites back with it.
  const saved = g.savedState();
  assert(saved && saved.roster[pinned].favorite === true,
    'the favourite was never written to the save');

  // The ordering rule the roster uses: favourites first, then whatever
  // the chosen sort said, and untouched heroes keep their own order.
  const favoritesFirst = (cmp) => (a, b) =>
    (GameState.isFavorite(b) ? 1 : 0) - (GameState.isFavorite(a) ? 1 : 0) || cmp(a, b);
  const byName = (a, b) =>
    GameState.defOf(a).name.localeCompare(GameState.defOf(b).name);
  const ids = GameState.ownedHeroIds().filter((uid) => GameState.defOf(uid));
  assert(ids.length > 2, 'need a few heroes owned to sort');
  const sorted = [...ids].sort(favoritesFirst(byName));
  assert(sorted[0] === pinned, `expected ${pinned} first, got ${sorted[0]}`);
  const rest = sorted.slice(1);
  assert(rest.every((id) => !GameState.isFavorite(id)),
    'a favourite sorted below a non-favourite');
  assert(rest.join() === [...rest].sort(byName).join(),
    'the underlying sort order was disturbed');

  assert(GameState.toggleFavorite(pinned) === false, 'toggle did not clear it');
  assert(GameState.favoriteCount() === count - 1, 'the count did not follow');
});

test('star ups and skill ups are paid for in heroes', () => {
  const { GameState, Progression, HEROES } = g;

  // A 3-star hero, so the cost is three and "one is not enough" is a
  // real assertion rather than an accident of a 1-star costing one.
  const hero = Object.values(HEROES).find((h) => (h.rarity || 1) === 3);
  assert(hero, 'the roster has no 3-star hero to test with');
  const target = GameState.addHero(hero.id).uid;
  // Deliberately NOT at the level cap: level is not a gate on starring up.
  GameState.addXp(target, 900);
  const stars = GameState.progressOf(target).stars;
  assert(stars === 3, `expected a 3-star hero, got ${stars}`);
  const startLevel = GameState.progressOf(target).level;
  assert(startLevel > 1 && startLevel < Progression.maxLevel(stars),
    `test needs a part-levelled hero, got Lv ${startLevel}`);
  // The cost is POINTS now, and it is the value of the rating being
  // bought: reaching 4 stars costs what a 4-star is worth.
  const need = Progression.starUpCost(stars);
  assert(need === Progression.starValue(stars + 1),
    `${stars}* should cost a ${stars + 1}*'s worth (${
      Progression.starValue(stars + 1)}), got ${need}`);
  assert(GameState.starUpReady(target),
    'a hero below the star cap should be able to star up whatever its level');

  // Fodder: same character (skill up + rank), and strangers at the same
  // rank (rank only). Same rating, because that is what a star up eats.
  //
  // Every arrival rolls for a blessing, and a blessed copy pins itself
  // as a favourite -- which makes it refuse to be fodder. That roll is
  // random, so fodder is explicitly unpinned here; without it this test
  // fails roughly one run in eight, on a rule it is not testing.
  const fodderHero = (id) => {
    const uid = GameState.addHero(id).uid;
    if (GameState.isFavorite(uid)) GameState.toggleFavorite(uid);
    return uid;
  };
  const sameChar = [fodderHero(hero.id), fodderHero(hero.id)];
  const strangers = [];
  // Enough strangers at this rank to cover the bar in one go.
  const perHead = Progression.starValue(stars);
  const heads = Math.ceil(need / perHead);
  for (const other of Object.values(HEROES)) {
    if (strangers.length >= heads) break;
    if (other.id === hero.id) continue;
    if ((other.rarity || 1) !== stars) continue;
    strangers.push(fodderHero(other.id));
  }
  assert(strangers.length === heads, `could not find ${heads} strangers at ${stars} stars`);

  // EVERY spendable hero is offered now, because every hero is worth
  // points. The old list showed same-rank heroes and duplicates only,
  // which stopped being true the moment a 1-star became worth a point.
  const offered = GameState.sacrificeOptions(target);
  const ids = new Set(offered.map((o) => o.uid));
  assert(!ids.has(target), 'the hero being improved was offered as its own fodder');
  for (const o of offered) {
    assert(o.value === Progression.starValue(o.stars),
      `${o.heroId} at ${o.stars}* is priced ${o.value}`);
  }
  assert(sameChar.every((uid) => ids.has(uid)), 'a duplicate was not offered');
  // Skill ups sort to the top: they are the reason to keep a duplicate.
  assert(offered[0].skill, 'the list does not lead with a skill up');

  // Affordability is about heroes in hand, not about level.
  assert(GameState.starUpAffordable(target),
    'the fodder is standing right there and it says otherwise');

  // Team members and favourites are never fodder.
  GameState.setTeamSlot(0, strangers[0]);
  assert(!GameState.sacrificeOptions(target).some((o) => o.uid === strangers[0]),
    'a hero on the team was offered as a sacrifice');
  GameState.clearTeamSlot(0);
  GameState.toggleFavorite(strangers[0]);
  assert(!GameState.sacrificeOptions(target).some((o) => o.uid === strangers[0]),
    'a favourite was offered as a sacrifice');
  GameState.toggleFavorite(strangers[0]);

  // Too few points, and nothing is starred -- but the points BANK, and
  // a duplicate still pays a skill. Not being able to finish the bar in
  // one sitting is the thing this rework exists to allow.
  const before = GameState.progressOf(target);
  const partial = GameState.sacrifice(target, [sameChar[0]]);
  assert(partial.spent === 1, `spent ${partial.spent}`);
  assert(!partial.starred, 'starred up on one sacrifice');
  assert(partial.skills.length === 1, 'a duplicate paid no skill level');
  assert(GameState.progressOf(target).stars === before.stars, 'stars moved anyway');
  assert(GameState.progressOf(target).starPoints === perHead,
    `banked ${GameState.progressOf(target).starPoints}, wanted ${perHead}`);
  assert(!GameState.defOf(sameChar[0]), 'the sacrificed hero is still in the roster');

  // Enough at the rank, and it stars up -- keeping the level it had and
  // raising the ceiling above it.
  const count = GameState.rosterCount();
  const report = GameState.sacrifice(target, strangers);
  assert(report.starred, `should have starred up: ${JSON.stringify(report)}`);
  assert(report.to === stars + 1, `went to ${report.to} from ${stars}`);
  assert(GameState.progressOf(target).level === startLevel,
    `a star up must keep the level: was ${startLevel}, now ` +
    `${GameState.progressOf(target).level}`);
  assert(Progression.maxLevel(report.to) > Progression.maxLevel(stars),
    'starring up did not raise the level cap');
  assert(GameState.rosterCount() === count - heads,
    'the roster did not shrink by the heroes spent');
  for (const uid of strangers) {
    assert(!GameState.defOf(uid), 'a spent hero is still in the roster');
  }
});

test('a full roster overflows into the vault, and only a full vault refuses', () => {
  const { GameState, Gacha } = g;
  const max = GameState.MAX_ROSTER;
  assert(max === 100, `expected a 100 base cap, got ${max}`);
  while (!GameState.rosterFull()) {
    assert(GameState.addHero('silas'), 'addHero refused below the cap');
  }
  assert(GameState.rosterCount() === max, `roster holds ${GameState.rosterCount()}`);

  // Past the cap a hero goes to the VAULT rather than evaporating. A
  // summon that arrives as a hero should never be lost because the
  // roster happened to be one slot short -- that is the shelf being
  // full, not the hero being unwanted.
  const stored = GameState.storageCount();
  const over = GameState.addHero('silas');
  assert(over && over.stored === true, `overflow returned ${JSON.stringify(over)}`);
  assert(GameState.storageCount() === stored + 1, 'the overflow hero went nowhere');
  assert(GameState.rosterCount() === max, 'the roster grew past its cap');
  assert(GameState.storedEntry(over.uid), 'the overflow hero is not in the vault');

  // Dumplings do NOT take the same road, and that is deliberate: they
  // are inventory, so a full roster is not their problem. A dumpling
  // arriving here must not touch either shelf.
  const roomBefore = GameState.rosterCount();
  const vaultBefore = GameState.storageCount();
  const dump = GameState.addDumpling(2);
  assert(dump && dump.stars === 2 && dump.stored === undefined,
    `dumpling intake returned ${JSON.stringify(dump)}`);
  assert(GameState.rosterCount() === roomBefore &&
    GameState.storageCount() === vaultBefore,
    'a dumpling took a shelf slot on a full account');
  assert(GameState.dumplingsAt(2) === 1, 'the dumpling did not reach the bag');

  // A pull that cannot fit is still refused whole rather than
  // part-filled -- but "fit" counts the vault now.
  assert(GameState.intakeSpace() > 0, 'the vault is already full');
  const ok = Gacha.pull('common', 1);
  assert(Array.isArray(ok), `a pull with vault room was refused: ${JSON.stringify(ok)}`);

  // Fill the vault too, and only then does it refuse.
  while (GameState.intakeShelf()) GameState.addHero('silas');
  assert(GameState.addHero('silas') === null, 'a hero was added with nowhere to go');
  // A dumpling still arrives: it has no shelf to be short of. This is
  // the whole point of moving them off the roster -- the account that
  // most needs a dumpling is the one that has run out of room.
  const bagBefore = GameState.dumplingCount();
  assert(GameState.addDumpling(1), 'a dumpling was refused by a full account');
  assert(GameState.dumplingCount() === bagBefore + 1, 'the dumpling did not land');
  const scrolls = GameState.scrollsCommon;
  const res = Gacha.pull('common', 1);
  assert(res && res.error === 'roster-full', `expected a refusal, got ${JSON.stringify(res)}`);
  assert(GameState.scrollsCommon === scrolls, 'the scroll was spent on nothing');
});

test('a campaign node is the same fight every time it is opened', () => {
  const { CAMPAIGN, Campaign } = g;
  const fingerprint = (n) =>
    Campaign.encounter(n).map((e) => `${e.def.id}@${e.slotIndex}`).join(',');
  const problems = [];
  for (const ch of CAMPAIGN.CHAPTERS) {
    for (const n of ch.nodes) {
      if (n.type === 'boss') {
        if (Campaign.encounter(n).length !== 0) problems.push(`${n.id}: holder fields a wave`);
        continue;
      }
      const first = fingerprint(n);
      if (!first) { problems.push(`${n.id}: empty encounter`); continue; }
      // Ten reads have to agree, and nothing may share a slot.
      for (let i = 0; i < 10; i++) {
        if (fingerprint(n) !== first) { problems.push(`${n.id}: roster drifted`); break; }
      }
      const slots = Campaign.encounter(n).map((e) => e.slotIndex);
      if (new Set(slots).size !== slots.length) problems.push(`${n.id}: two enemies in one slot`);
      if (slots.some((i) => i < 0 || i > 6)) problems.push(`${n.id}: enemy off the formation`);
      // Enemies must come from this chapter's own cohort.
      const pool = new Set(g.LOCATION_ENEMIES[ch.location]);
      for (const e of Campaign.encounter(n)) {
        if (!pool.has(e.def.id)) problems.push(`${n.id}: ${e.def.id} is not from this chapter`);
      }
    }
  }
  assert(problems.length === 0, problems.slice(0, 5).join(' | '));
});

test('difficulty tiers gate per chapter and pay exactly what they promise', () => {
  // Its own save: this test walks progress forward.
  const w = loadGame({ save: { schemaVersion: 5 } });
  const { CAMPAIGN, Campaign, GameState } = w;
  const [ch1, ch2] = CAMPAIGN.CHAPTERS;
  const boss1 = Campaign.bossNode(ch1);
  const clear = (n, t) => GameState.recordCampaignClear(Campaign.clearKey(n.id, t));

  assert(Campaign.TIER_IDS.join() === 'normal,hard,expert',
    `unexpected tiers: ${Campaign.TIER_IDS.join()}`);

  // Nothing above Normal is open on a fresh save.
  assert(Campaign.tierUnlocked(ch1, 'normal'), 'Normal must always be open');
  assert(!Campaign.tierUnlocked(ch1, 'hard'), 'Hard opened before Normal was cleared');
  assert(!Campaign.tierUnlocked(ch1, 'expert'), 'Expert opened before Hard was cleared');

  // Clearing a chapter's holder opens the NEXT tier of THAT chapter, and
  // only that chapter — the reward is a harder version of what you just
  // finished, not a key to the whole game.
  clear(boss1, 'normal');
  assert(Campaign.tierUnlocked(ch1, 'hard'), 'Hard did not open after the Normal clear');
  assert(!Campaign.tierUnlocked(ch1, 'expert'), 'Expert opened a tier early');
  assert(!Campaign.tierUnlocked(ch2, 'hard'),
    'clearing chapter 1 must not open chapter 2 on Hard');
  clear(boss1, 'hard');
  assert(Campaign.tierUnlocked(ch1, 'expert'), 'Expert did not open after the Hard clear');
  assert(Campaign.highestTier(ch1) === 'expert',
    `highest tier is ${Campaign.highestTier(ch1)}`);

  // Tiers keep separate progress: the Hard run starts from the entrance
  // again rather than inheriting the Normal clears.
  const entry = ch1.nodes.find((n) => n.from.length === 0);
  clear(entry, 'normal');
  assert(Campaign.nodeCleared(entry, 'normal'), 'the Normal clear was not recorded');
  assert(!Campaign.nodeCleared(entry, 'hard'), 'a Normal clear leaked into Hard');
  assert(Campaign.chapterProgress(ch1, 'hard').done === 1,
    'Hard progress should count only its own clears (the holder)');

  // The completion checkmark demands a FULL clear: chapter 1's holder
  // is down on Normal but its side stages are not, so the chapter is
  // beaten yet NOT full. Clearing every node flips it.
  const partial = Campaign.chapterProgress(ch1, 'normal');
  assert(partial.beaten && !partial.full,
    `a holder-only clear read as full (${partial.done}/${partial.total})`);
  for (const n of ch1.nodes) clear(n, 'normal');
  const fullP = Campaign.chapterProgress(ch1, 'normal');
  assert(fullP.full && fullP.done === fullP.total,
    'a total clear did not read as full');

  // And the chapter chain still runs inside a tier.
  clear(Campaign.bossNode(ch2), 'normal');
  assert(Campaign.tierUnlocked(ch2, 'hard'), 'chapter 2 Hard should open once it falls');
  assert(Campaign.chapterUnlocked(ch2, 'hard'),
    'chapter 2 on Hard needs chapter 1 on Hard, which is cleared');

  // Rewards are EXACTLY the advertised multiple of Normal, on every
  // currency — not the tier's own harder levels compounded with it.
  for (const n of [boss1, entry, ch1.nodes.find((x) => x.type === 'elite')]) {
    const base = Campaign.payout(n, 'normal');
    for (const t of ['hard', 'expert']) {
      const mult = Campaign.tier(t).reward;
      const pay = Campaign.payout(n, t);
      for (const k of ['xp', 'whetstones', 'arcana']) {
        assert(pay[k] === base[k] * mult,
          `${n.id} ${t} ${k}: ${pay[k]}, expected ${base[k] * mult}`);
      }
      const scrolls = Campaign.firstClearBonus(n, t).scrolls;
      const baseScrolls = Campaign.firstClearBonus(n, 'normal').scrolls;
      for (const kind of Object.keys(baseScrolls)) {
        assert(scrolls[kind] === baseScrolls[kind] * mult,
          `${n.id} ${t} ${kind} scrolls: ${scrolls[kind]}`);
      }
    }
  }

  // Hard and Expert gear the rank and file but NEVER the holder: the
  // holder already compounds its chapter tuning with the tier scale,
  // and a six-piece set on top made it unbeatable rather than hard.
  assert(Campaign.gearFor(boss1, 'hard', DUMMIES.rat_brawler).length === 0 &&
    Campaign.gearFor(boss1, 'expert', DUMMIES.rat_brawler).length === 0,
    'the holder came armed');
  assert(Campaign.gearFor(entry, 'hard', DUMMIES.rat_brawler).length > 0,
    'the rank and file lost their tier gear');
  assert(Campaign.gearFor(entry, 'normal', DUMMIES.rat_brawler).length === 0,
    'Normal enemies must fight bare');
  assert(!Campaign.tierNote(boss1, 'hard').includes('gear'),
    `the tier note still advertises holder gear: ${Campaign.tierNote(boss1, 'hard')}`);

  // Harder tiers really are harder, and stay inside the level ceiling.
  for (const t of ['hard', 'expert']) {
    assert(Campaign.levelFor(boss1, t) > Campaign.levelFor(boss1, 'normal'),
      `${t} holders are no higher level than Normal`);
    assert(Campaign.enemyScale(t) > 1, `${t} does not scale enemy stats`);
    const top = Campaign.bossNode(CAMPAIGN.CHAPTERS[CAMPAIGN.CHAPTERS.length - 1]);
    assert(Campaign.levelFor(top, t) <= 100,
      `the final holder on ${t} is Lv ${Campaign.levelFor(top, t)}, past the cap`);
  }
  // A holder's own chapter tuning survives the tier multiplier.
  assert(Campaign.holderScaleFor(ch1, 'hard') ===
    Campaign.holderScale(ch1) * Campaign.enemyScale('hard'),
    'the tier scale replaced the chapter tuning instead of compounding with it');

  // Only the Normal clear opens the hunt and boss gates; re-announcing
  // them on every tier would be noise about nothing.
  assert(Campaign.firstClearBonus(boss1, 'normal').unlocks === true,
    'the Normal holder clear should open the gates');
  assert(Campaign.firstClearBonus(boss1, 'hard').unlocks === false,
    'a Hard clear re-opened gates that are already open');
});

test('a save written before difficulty reads back as Normal progress', () => {
  // Clears used to be stored under the bare node id. That is still
  // exactly what Normal writes, so an old save needs no migration.
  const w = loadGame({ save: { schemaVersion: 5 } });
  const { CAMPAIGN, Campaign, GameState } = w;
  const ch1 = CAMPAIGN.CHAPTERS[0];
  const entry = ch1.nodes.find((n) => n.from.length === 0);
  GameState.recordCampaignClear(entry.id);   // the pre-difficulty shape
  assert(Campaign.clearKey(entry.id, 'normal') === entry.id,
    'Normal must keep using the bare node id');
  assert(Campaign.nodeCleared(entry, 'normal'), 'an old clear stopped counting');
  assert(!Campaign.nodeCleared(entry, 'hard'), 'an old clear counted as a Hard clear');
  assert(GameState.campaignTier === 'normal',
    `a save with no tier read as ${GameState.campaignTier}`);
});

test('clearing a chapter opens the next one, its hunt and its boss', () => {
  // Its own game instance: this test walks a save forward, and the
  // shared one is used by everything else in this file.
  const w = loadGame({ save: { schemaVersion: 5 } });
  const { CAMPAIGN, Campaign, GameState } = w;
  const [ch1, ch2] = CAMPAIGN.CHAPTERS;

  // A fresh save: only the first chapter, its hunt, and no bosses.
  assert(Campaign.chapterUnlocked(ch1), 'the first chapter must be open from the start');
  assert(!Campaign.chapterUnlocked(ch2), 'the second chapter should be shut');
  assert(Campaign.locationUnlocked(ch1.location), 'the first hunt should be open');
  assert(!Campaign.locationUnlocked(ch2.location), 'the second hunt should be shut');
  assert(!Campaign.bossUnlocked(ch1.boss), 'no boss is open before its chapter falls');

  // Only the entrance is reachable, and a fork opens on ANY prerequisite.
  const entry = ch1.nodes.find((n) => n.from.length === 0);
  assert(Campaign.nodeUnlocked(entry), 'the entrance must be open');
  assert(ch1.nodes.filter((n) => Campaign.nodeUnlocked(n)).length === 1,
    'exactly one node should be open on a fresh save');
  GameState.recordCampaignClear(entry.id);
  const next = ch1.nodes.filter((n) => n.from.includes(entry.id));
  assert(next.length > 0 && next.every((n) => Campaign.nodeUnlocked(n)),
    'clearing a node must open everything that leads off it');

  // Taking the holder is what actually opens the world up.
  GameState.recordCampaignClear(Campaign.bossNode(ch1).id);
  assert(Campaign.chapterUnlocked(ch2), 'the next chapter did not open');
  assert(Campaign.locationUnlocked(ch2.location), 'the next hunt did not open');
  assert(Campaign.bossUnlocked(ch1.boss), 'the beaten boss did not open for challenges');
  assert(!Campaign.bossUnlocked(ch2.boss), 'an unbeaten chapter handed over its boss');

  // The first clear is the only one that pays a bonus.
  const elite = ch1.nodes.find((n) => n.type === 'elite');
  assert(GameState.recordCampaignClear(elite.id) === true, 'a first clear should report as one');
  assert(GameState.recordCampaignClear(elite.id) === false, 'a repeat clear paid out twice');
});

test('a unit told to act with every enemy already dead simply stands down', () => {
  // The last enemy can fall between a turn being granted and it being
  // taken — a poison tick, a reflect, a death rattle. Row-targeting used
  // to dereference the empty row list and take the whole battle with it.
  const { Battle, GameState } = g;
  const battle = new Battle();
  const rower = Object.values(HEROES).find((h) =>
    h.abilities.some((a) => a.targeting === 'enemy-row'));
  assert(rower, 'no hero has a row-targeting ability to test with');
  const hero = new Unit(rower, TEAM.PLAYER, { level: 30, stars: rower.rarity });
  const foe = new Unit(DUMMIES.rat_brawler, TEAM.ENEMY, { level: 30, stars: 1 });
  battle.placeUnit(hero, 1);
  battle.placeUnit(foe, 1);
  // Kill the enemy outright, then make the hero take its turn anyway.
  foe.hp = 0;
  assert(battle.livingUnits(TEAM.ENEMY).length === 0, 'the enemy is still standing');
  // Force the row ability to be the only thing it can pick.
  for (const st of hero.abilities) {
    st.cooldownRemaining = st.def.targeting === 'enemy-row' ? 0 : 99;
  }
  battle.autoAct(hero);   // must not throw
});

test('an old save keeps the hunts and bosses it already earned', () => {
  // Read the current schema off a fresh save rather than restating it,
  // so the next migration does not have to remember to edit this test.
  const probe = loadGame({ save: undefined });
  probe.GameState.setCampaignChapter('ch1');
  const CURRENT_SCHEMA = probe.savedState().schemaVersion;

  // The campaign now gates content that used to be open, so loading a
  // save from before that change must not take anything away.
  const cases = [
    { what: 'a v4 save that beat the Dragon while hunting the Valley',
      save: { schemaVersion: 4, roster: { florence: { copies: 1, level: 9, xp: 0, stars: 2 } },
        team: { 1: 'florence' }, bossStages: { boss_dragon: 4 },
        waveSettings: { location: 4, stage: 8, repeat: 1 } },
      hunts: 6, boss: 'dragon' },
    // No schemaVersion at all: the loader must read the version off the
    // RAW save, not off the defaults it merges over.
    { what: 'a save so old it predates schema versions',
      save: { roster: { florence: { copies: 3 } }, team: { 1: 'florence' },
        waveSettings: { location: 7, stage: 9, repeat: 1 } },
      hunts: 9, boss: 'winter_alpha' },
  ];
  for (const c of cases) {
    const w = loadGame({ save: c.save });
    const open = w.Campaign.unlockedLocations();
    assert(open.length === c.hunts,
      `${c.what}: ${open.length} hunts open, expected ${c.hunts}`);
    assert(w.Campaign.bossUnlocked(c.boss),
      `${c.what}: lost access to the ${c.boss}`);
    // Loading alone does not write; the migrated shape is persisted on
    // the next change, which is when the version stamp lands.
    w.GameState.setCampaignChapter('ch1');
    const saved = w.savedState();
    assert(saved.schemaVersion === CURRENT_SCHEMA,
      `${c.what}: save is at v${saved.schemaVersion}, not the current v${CURRENT_SCHEMA}`);
    assert(Object.keys(saved.campaign.granted.hunt).length === c.hunts,
      `${c.what}: granted ${Object.keys(saved.campaign.granted.hunt).length} hunts, ` +
      `expected ${c.hunts}`);
    assert(Object.keys(saved.campaign.granted.boss).length > 0,
      `${c.what}: the migration granted no boss access`);

    // Carried-over access is NOT campaign progress: the chapters are
    // open, and every one of them is still there to play.
    assert(Object.keys(saved.campaign.cleared).length === 0,
      `${c.what}: grandfathered access was written in as clears: ` +
      JSON.stringify(saved.campaign.cleared));
    const beaten = w.CAMPAIGN.CHAPTERS
      .filter((ch) => w.Campaign.chapterProgress(ch).beaten).map((ch) => ch.id);
    assert(beaten.length === 0, `${c.what}: chapters read as beaten: ${beaten}`);
    // Only the first chapter is enterable — the campaign has not started.
    const enterable = w.CAMPAIGN.CHAPTERS.filter((ch) => w.Campaign.chapterUnlocked(ch));
    assert(enterable.length === 1 && enterable[0] === w.CAMPAIGN.CHAPTERS[0],
      `${c.what}: ${enterable.length} chapters open before clearing the first`);
  }

  // A brand-new save runs no migrations and starts at chapter one only.
  const fresh = loadGame({ save: undefined });
  assert(fresh.Campaign.unlockedLocations().length === 1,
    'a new save should open exactly one hunt');
});

test('favourites and team members are never sacrifice material', () => {
  const w = loadGame();
  const G = w.GameState;
  const cheap = Object.values(w.HEROES).find((h) => (h.rarity || 1) === lowestRarity(w));
  // The summon lottery is stubbed off for the duration. A blessed copy
  // arrives ALREADY favourited (addHero pins keepers), and toggleFavorite
  // toggles -- so on the roughly one run in a thousand where the roll
  // hits, this test turned the flag OFF and then asserted a favourite
  // could not be spent. It failed about that often, which is exactly
  // often enough to look like something else.
  const realRoll = w.Blessing.roll;
  w.Blessing.roll = () => null;
  let target; let fav; let fielded; let spare;
  try {
    target = G.addHero(cheap.id).uid;
    fav = G.addHero(cheap.id).uid;
    fielded = G.addHero(cheap.id).uid;
    spare = G.addHero(cheap.id).uid;
  } finally {
    w.Blessing.roll = realRoll;
  }
  G.toggleFavorite(fav);
  G.setTeamSlot(0, fielded);
  assert(!G.canSacrifice(fav, target), 'a favourite can be sacrificed');
  assert(!G.canSacrifice(fielded, target), 'a team member can be sacrificed');
  const opts = G.sacrificeOptions(target).map((o) => o.uid);
  assert(!opts.includes(fav), 'a favourite is offered as a sacrifice');
  assert(!opts.includes(fielded), 'a team member is offered as a sacrifice');
  assert(opts.includes(spare), 'the spare hero should be offered');
  // The one-click path obeys the same locks: nothing protected is in
  // any plan step's fodder list.
  for (const step of G.planAutoStarUp()) {
    assert(!step.fodder.includes(fav) && !step.fodder.includes(fielded),
      'auto star up plans to spend a protected hero');
  }
  const r = G.sacrifice(target, [fav, fielded, spare]);
  assert(r && r.spent === 1, 'sacrifice() spent a protected hero');
  assert(G.owns(cheap.id) && G.progressOf(fav) && G.progressOf(fielded),
    'a protected hero died anyway');
});

test('auto star up forges the bottom shelf one rank up', () => {
  const w = loadGame();
  const G = w.GameState;
  const floor = shelfOf(2, w);
  const goal = floor + 1;
  const ones = Object.values(w.HEROES).filter((h) => (h.rarity || 1) === floor);
  // A star up at rank N eats N heroes, so one recipient plus its cost
  // is what a single rank costs.
  const cost = w.Progression.starUpCost(floor);
  const uids = [];
  for (let i = 0; i < cost + 1; i++) uids.push(G.addHero(ones[i % 2].id).uid);
  // The keeper: favourited, so it must be the survivor.
  const keeper = uids[0];
  G.toggleFavorite(keeper);
  const r = G.autoStarUp(goal);
  assert(r.starUps === 1, `expected 1 star up to ${goal}, got ${r.starUps}`);
  assert(r.spent === cost, `expected ${cost} heroes spent, got ${r.spent}`);
  assert(G.progressOf(keeper) && G.progressOf(keeper).stars === goal,
    `the favourite should survive and stand at ${goal} stars`);
  const left = uids.filter((u) => G.progressOf(u));
  assert(left.length === 1, `expected one survivor, found ${left.length}`);
  // Idempotent: a second press finds nothing to do.
  assert(G.planAutoStarUp(goal).length === 0, 'a second pass should plan nothing');
  // And a target at or below the floor is a no-op by construction --
  // there is nothing underneath it to forge.
  assert(G.planAutoStarUp(floor).length === 0,
    `target ${floor} planned work on a roster whose floor is ${floor}`);
});

test('wind resonance feeds AP only off enemy turns', () => {
  const battle = makeBattle();
  const hero = place(battle, HEROES.florence, TEAM.PLAYER, 0);
  const foe = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 0);
  hero.synergyApOnEnemyTurn = 0.05;
  hero.turnMeter = 0; foe.turnMeter = 0;
  // The real Battle owns grantTurnApGain; borrow it onto the stand-in.
  battle.grantTurnApGain = Battle.prototype.grantTurnApGain;
  battle.grantTurnApGain(foe);
  assert(hero.turnMeter === CONFIG.TURN_METER_MAX * 0.05,
    `an enemy turn should pay 5% AP, got ${hero.turnMeter}`);
  battle.grantTurnApGain(hero);
  assert(hero.turnMeter === CONFIG.TURN_METER_MAX * 0.05,
    'an allied turn paid wind AP');
  assert(foe.turnMeter === 0, 'the enemy gained AP from its own turn');
});

test('dark resonance can stretch a debuff by one turn', () => {
  const battle = makeBattle();
  const hero = place(battle, HEROES.vex, TEAM.PLAYER, 0);
  const foe = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 0);
  // Vex reads debuff durations off her own passive (+1); the resonance
  // adds one more on top when the coin lands.
  const debuff = hero.abilities[0].def.effects.find((e) => e.type === 'debuff');
  const base = debuff.turns + 1; // her passive extension
  // Her hex is gated at 50% until its chance rungs are bought, and this
  // test is about DURATION, not about landing: max the skill so the
  // shared stub only decides the coin flip it is here to decide.
  hero.abilities[0].level = Progression.skillCap(hero.abilities[0].def, 0);
  const origRandom = Math.random;
  const roll = (r) => {
    foe.statusEffects.length = 0;
    Math.random = () => r; // debuffLands roll and the coin share the stub
    Abilities.execute(hero.abilities[0].def, hero, foe, battle);
    const applied = foe.statusEffects.find((e) => e.kind === 'debuff');
    return applied ? applied.turns : null;
  };
  hero.synergyDebuffExtraChance = 0.5;
  assert(roll(0.99) === base, 'a lost coin flip should leave the duration alone');
  assert(roll(0.01) === base + 1, 'a won coin flip should add a turn');
  hero.synergyDebuffExtraChance = 0;
  assert(roll(0.01) === base, 'no resonance, no extension');
  Math.random = origRandom;
});

test('hero storage: gear comes off on deposit, play resumes on withdraw', () => {
  const w = loadGame();
  const G = w.GameState;
  const cheap = Object.values(w.HEROES).find((h) => (h.rarity || 1) === lowestRarity(w));
  const uid = G.addHero(cheap.id).uid;
  // Dress the hero so the strip is observable.
  const gid = G.addGear(w.Gear.drop('rat', 1));
  assert(G.equipGear(uid, gid), 'gear did not equip');
  assert(G.equippedPieces(uid).length === 1, 'equipment empty');

  const fielded = G.addHero(cheap.id).uid;
  G.setTeamSlot(0, fielded);
  assert(G.deposit(fielded) === null, 'a fielded hero was stored');

  const before = G.rosterCount();
  const r = G.deposit(uid);
  assert(r && r.gearFreed === 1, `deposit report ${JSON.stringify(r)}`);
  assert(G.rosterCount() === before - 1, 'roster did not shrink');
  assert(G.storageCount() === 1, 'vault did not grow');
  // "Out of play" used to be asserted as "progressOf/defOf go null",
  // which was a proxy rather than the property. A uid now resolves on
  // either shelf -- the star-up list has to be able to name a dumpling
  // sitting in the vault -- so the real thing is checked instead: a
  // stored hero is not listed, and cannot be spent.
  assert(!G.ownedHeroIds().includes(uid), 'a stored hero is still listed in the roster');
  assert(G.teamSlotOf(uid) === null, 'a stored hero is still fielded');
  assert(!G.canSacrifice(uid, fielded), 'a stored HERO was offered as fodder');
  const stored = G.storedEntry(uid);
  assert(stored && Object.keys(stored.equipment || {}).length === 0, 'gear went into the vault');
  assert(G.unequippedGear().some((p) => p.uid === gid), 'the stripped piece is not back in the inventory');

  const r2 = G.withdraw(uid);
  assert(r2, 'withdraw failed with roster space open');
  assert(G.storageCount() === 0 && G.progressOf(uid), 'withdraw did not restore the hero');

  // The cap: a full roster refuses withdrawals.
  G.deposit(uid);
  while (!G.rosterFull()) G.addHero(cheap.id);
  assert(G.withdraw(uid) === null, 'withdrew into a full roster');
});

test('sawyer: petalfall scatters distinct hexes, deadheading punishes the center hex', () => {
  const battle = makeBattle();
  const sawyer = place(battle, HEROES.sawyer, TEAM.PLAYER, 1);
  const centerFoe = roomy(place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 0));
  const frontFoe = roomy(place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1));
  for (const f of [centerFoe, frontFoe]) f.dodgeChance = () => 0;
  sawyer.baseCritChance = 0;  // the numbers must be readable, not lucky
  sawyer.gearAccuracy = 10;   // and the hexes must land to be counted
  // Petalfall's grab-bag now rolls a 50% application gate per hex, so
  // "both land" is a promise the skill only keeps once its chance rungs
  // are bought. Max it: that is the level the assertion describes.
  sawyer.abilities.find((a) => a.def === HEROES.sawyer.abilities[0]).level =
    Progression.skillCap(HEROES.sawyer.abilities[0], 0);

  // Skill 1: two DIFFERENT debuffs, both for 2 turns.
  Abilities.execute(HEROES.sawyer.abilities[0], sawyer, frontFoe, battle);
  const hexes = frontFoe.statusEffects.filter((fx) => fx.kind === 'debuff');
  assert(hexes.length === 2, `petalfall landed ${hexes.length} hexes`);
  assert(hexes[0].stat !== hexes[1].stat, 'petalfall dealt the same hex twice');
  assert(hexes.every((fx) => fx.turns === 2), 'petalfall hex durations off');

  // Skill 3: the same strike, half again harder against the center tile.
  // Debuffs are cleared so Wilting Garden can't tilt the comparison.
  const dead = HEROES.sawyer.abilities[2];
  const hit = (foe) => {
    foe.hp = foe.maxHp;
    foe.statusEffects.length = 0;
    Abilities.execute(dead, sawyer, foe, battle);
    return foe.maxHp - foe.hp;
  };
  const vsFront = hit(frontFoe);
  const vsCenter = hit(centerFoe);
  assert(vsCenter > vsFront * 1.4 && vsCenter < vsFront * 1.6,
    `center bonus off: ${vsFront} front vs ${vsCenter} center`);

  // Skill 2: all three war paints at once.
  Abilities.execute(HEROES.sawyer.abilities[1], sawyer, sawyer, battle);
  const paints = sawyer.statusEffects.filter((fx) => fx.kind === 'buff')
    .map((fx) => fx.stat).sort().join();
  assert(paints === 'atk,def,speed', `night bloom buffs ${paints}`);

  // Wilting Garden: two debuffs are worth +20% on the next cut. Planted
  // by hand as SPD/crit hexes — the neutral ones — so the comparison
  // reads the passive alone, not a drawn DEF-break or damage-taken hex.
  frontFoe.statusEffects.length = 0;
  const clean = hit(frontFoe);
  frontFoe.hp = frontFoe.maxHp;
  frontFoe.addStatusEffect({ kind: 'debuff', stat: 'speed', mult: 0.75, turns: 2 });
  frontFoe.addStatusEffect({ kind: 'debuff', stat: 'critChance', add: -0.15, turns: 2 });
  Abilities.execute(dead, sawyer, frontFoe, battle);
  const wilted = frontFoe.maxHp - frontFoe.hp;
  assert(wilted > clean * 1.15 && wilted < clean * 1.25,
    `wilting garden off: ${clean} clean vs ${wilted} hexed`);

  // And the CEILING, which nothing pinned until now. The card has always
  // read "up to +60%"; the code capped at three hexes and paid +30%, so
  // it promised twice what it gave. Read straight off the hook rather
  // than through a swing, so the cap is the only thing being measured.
  {
    const mult = (n) => {
      const dummy = { statusEffects: Array.from({ length: n },
        () => ({ kind: 'debuff', stat: 'speed', mult: 0.9, turns: 2 })) };
      return HEROES.sawyer.passive.hooks.damageDealtMult(sawyer, dummy);
    };
    assert(Math.abs(mult(3) - 1.30) < 1e-9, `three hexes paid ${mult(3)}`);
    assert(Math.abs(mult(6) - 1.60) < 1e-9,
      `six hexes paid ${mult(6)}, and the card promises +60%`);
    assert(Math.abs(mult(9) - 1.60) < 1e-9, `nine hexes paid ${mult(9)} — uncapped`);
  }
});

test('polarus: freeze locks, the crystal counters, shatterfall pays and thaws', () => {
  const battle = makeBattle();
  const pol = place(battle, HEROES.polarus, TEAM.PLAYER, 0); // center hex
  const foeA = roomy(place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1));
  const foeB = roomy(place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 2));
  pol.baseCritChance = 0;
  pol.gearAccuracy = 10; // the freezes must land to be readable
  for (const f of [foeA, foeB]) f.dodgeChance = () => 0;

  // Freeze is a 2-turn lockout, and freezing from the center hex
  // refunds a turn of cooldown on everything (Frost Throne).
  pol.abilities[2].cooldownRemaining = 3;
  const r = Abilities.freeze(pol, foeA);
  assert(r && !r.resisted && r.turns === 2, `freeze came back ${JSON.stringify(r)}`);
  assert(foeA.statusEffects.some((fx) => fx.stat === 'freeze'), 'no freeze status landed');
  assert(pol.abilities[2].cooldownRemaining === 2,
    `frost throne refunded to ${pol.abilities[2].cooldownRemaining}`);

  // Shatterfall: 80% ATK to the unfrozen, 300% to the frozen (x3.75),
  // and the ice comes off afterwards.
  foeA.hp = foeA.maxHp; foeB.hp = foeB.maxHp;
  Abilities.execute(HEROES.polarus.abilities[2], pol, null, battle);
  const frozenDmg = foeA.maxHp - foeA.hp;
  const plainDmg = foeB.maxHp - foeB.hp;
  assert(frozenDmg > plainDmg * 3.4 && frozenDmg < plainDmg * 4.1,
    `shatterfall paid ${plainDmg} plain vs ${frozenDmg} frozen`);
  assert(!foeA.statusEffects.some((fx) => fx.stat === 'freeze'),
    'shatterfall left the ice on');

  // Crystalline Mantle: with the dice pinned low, the striker freezes.
  Abilities.execute(HEROES.polarus.abilities[1], pol, pol, battle);
  assert(pol.statusEffects.some((fx) => fx.kind === 'buff' && fx.stat === 'crystalline'),
    'mantle did not land');
  const realRandom = Math.random;
  Math.random = () => 0.01;
  try {
    Abilities.execute(DUMMIES.rat_brawler.abilities[0], foeB, pol, battle);
  } finally {
    Math.random = realRandom;
  }
  assert(foeB.statusEffects.some((fx) => fx.stat === 'freeze'),
    'striking the crystal did not freeze the attacker');
});

test('andrew: pickwork drains AP, two masters gives and takes, undermine digs', () => {
  const battle = makeBattle();
  const andrew = place(battle, HEROES.andrew, TEAM.PLAYER, 0); // center hex
  const aniani = place(battle, HEROES.echo, TEAM.PLAYER, 1);
  const foe = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1);
  andrew.baseCritChance = 0;
  andrew.gearAccuracy = 10; // the dig must land to be readable
  foe.dodgeChance = () => 0;

  // Skill 1: honest damage plus a flat 15-point AP cut. The cut is gated
  // at 50%, so max the ladder — its chance rungs make the dig certain.
  maxSkill(andrew, 0);
  foe.turnMeter = CONFIG.TURN_METER_MAX * 0.6;
  Abilities.execute(HEROES.andrew.abilities[0], andrew, foe, battle);
  assert(Math.abs(foe.turnMeter - CONFIG.TURN_METER_MAX * 0.45) < 1,
    `pickwork left the meter at ${foe.turnMeter}`);

  // His turn starts: Aniani's company pays +30% ATK (Two Masters), and
  // the center hex undermines the only enemy for -30% DEF (2 turns).
  const atkBefore = andrew.effectiveStat('atk');
  andrew.startTurn(battle);
  assert(andrew.effectiveStat('atk') === Math.round(atkBefore * 1.3),
    `aniani's company pays ${andrew.effectiveStat('atk')} vs base ${atkBefore}`);
  assert(andrew.effectiveStat('def') === Math.round(andrew.baseDef),
    'polarus is not here, yet the king taxes him');
  const dig = foe.statusEffects.find((fx) => fx.kind === 'debuff' && fx.stat === 'def');
  assert(dig && dig.mult === 0.7 && dig.turns === 2,
    `undermine landed ${JSON.stringify(dig)}`);

  // The king arrives: the same turn start now also takes -30% DEF.
  place(battle, HEROES.polarus, TEAM.PLAYER, 2);
  andrew.startTurn(battle);
  assert(andrew.effectiveStat('def') === Math.round(andrew.baseDef * 0.7),
    `the king's tax reads ${andrew.effectiveStat('def')} vs base ${andrew.baseDef}`);

  // Shore Up braces everyone: +30% DEF on the whole team for 2 turns.
  Abilities.execute(HEROES.andrew.abilities[1], andrew, andrew, battle);
  for (const mate of [andrew, aniani]) {
    assert(mate.statusEffects.some((fx) =>
      fx.kind === 'buff' && fx.stat === 'def' && fx.mult === 1.3 && fx.turns === 2),
      `${mate.name} was not shored up`);
  }
});

test('angelica: every freeze in the fight compounds her, the forge steadies her', () => {
  const battle = makeBattle();
  const angelica = place(battle, HEROES.angelica, TEAM.PLAYER, 4); // back hex
  const polarus = place(battle, HEROES.polarus, TEAM.PLAYER, 1);
  const foeA = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1);
  const foeB = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 2);
  angelica.gearAccuracy = 10;
  polarus.gearAccuracy = 10;
  for (const f of [foeA, foeB]) f.dodgeChance = () => 0;

  // Her own freeze pays the tally...
  Abilities.freeze(angelica, foeA, 2, battle);
  assert(angelica.effectiveStat('atk') === Math.round(angelica.baseAtk * 1.1),
    `one freeze reads ${angelica.effectiveStat('atk')} vs base ${angelica.baseAtk}`);
  // ...and the King's freeze pays it just the same.
  Abilities.freeze(polarus, foeB, 2, battle);
  assert(angelica.effectiveStat('atk') === Math.round(angelica.baseAtk * 1.2),
    `two freezes read ${angelica.effectiveStat('atk')}`);

  // The chance riders on her skills go through the same door: with the
  // dice pinned, Shardcast freezes and the tally ticks again.
  foeA.statusEffects.length = 0;
  const realRandom = Math.random;
  Math.random = () => 0.01;
  try {
    Abilities.execute(HEROES.angelica.abilities[0], angelica, foeA, battle);
  } finally {
    Math.random = realRandom;
  }
  assert(foeA.statusEffects.some((fx) => fx.stat === 'freeze'),
    'shardcast did not freeze on pinned dice');
  assert(angelica.effectiveStat('atk') === Math.round(angelica.baseAtk * 1.3),
    `three freezes read ${angelica.effectiveStat('atk')}`);

  // Cold Forge: the back hex pays +15% ATK and +10% DEF at her turn
  // start, stacking with the tally.
  angelica.startTurn(battle);
  assert(angelica.effectiveStat('atk') === Math.round(angelica.baseAtk * 1.3 * 1.15),
    `forge atk reads ${angelica.effectiveStat('atk')}`);
  assert(angelica.effectiveStat('def') === Math.round(angelica.baseDef * 1.1),
    `forge def reads ${angelica.effectiveStat('def')}`);
});

test('ari: the lance slips DEF, the volley taxes max HP, the quarry eats a free arrow', () => {
  const battle = makeBattle();
  const ari = place(battle, HEROES.ari, TEAM.PLAYER, 4); // back hex — Giantslayer live
  const polarus = place(battle, HEROES.polarus, TEAM.PLAYER, 1);
  const foe = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
  ari.baseCritChance = 0;
  polarus.gearAccuracy = 10;
  foe.dodgeChance = () => 0;

  const atk = ari.effectiveStat('atk');
  const elem = g.Elements.mult(ari.element, foe.element);
  const def = foe.effectiveStat('def');
  const tithe = foe.maxHp * 0.02; // the back hex's Giantslayer rider

  const hit = (i) => {
    foe.hp = foe.maxHp;
    Abilities.execute(HEROES.ari.abilities[i], ari, foe, battle);
    return foe.maxHp - foe.hp;
  };

  // Crystbarb: 110% through the full DEF curve, plus the tithe.
  const d1 = hit(0);
  assert(d1 === Abilities.damageFormula(atk * 1.1 * elem + tithe, def),
    `crystbarb paid ${d1}`);

  // Lancing Shot: 135% against only 90% of the DEF.
  const d2 = hit(1);
  assert(d2 === Abilities.damageFormula(atk * 1.35 * elem + tithe, def * 0.9),
    `lancing shot paid ${d2}`);

  // Marrow Volley: 140% plus 5% of the target's max HP, plus the tithe.
  const d3 = hit(2);
  assert(d3 === Abilities.damageFormula(atk * 1.4 * elem + foe.maxHp * 0.05 + tithe, def),
    `marrow volley paid ${d3}`);

  // Frozen Quarry: the King freezes, and her arrow follows for free —
  // the same Crystbarb, same books.
  foe.hp = foe.maxHp;
  const r = Abilities.freeze(polarus, foe, 2, battle);
  assert(r && !r.resisted, 'the freeze was resisted');
  assert(foe.maxHp - foe.hp === d1,
    `the free arrow paid ${foe.maxHp - foe.hp} vs crystbarb's ${d1}`);
});

test('cain: mercy in shares of himself, and the overflow lashes the healthiest', () => {
  const battle = makeBattle();
  const cain = place(battle, HEROES.cain, TEAM.PLAYER, 4); // back hex — Spillway live
  const mateA = roomy(place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1));
  const mateB = roomy(place(battle, DUMMIES.rat_knight, TEAM.PLAYER, 2));
  const foeHigh = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1));
  const foeLow = roomy(place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 2));
  for (const f of [foeHigh, foeLow]) f.dodgeChance = () => 0;
  foeLow.hp = Math.round(foeLow.maxHp * 0.4); // the HEALTHY one must be lashed

  // Tidemend: 30% of Cain's own pool, not the patient's.
  mateA.hp = 1;
  Abilities.execute(HEROES.cain.abilities[0], cain, mateA, battle);
  assert(mateA.hp === Math.min(mateA.maxHp, 1 + Math.round(cain.maxHp * 0.30)),
    `tidemend left ${mateA.hp}/${mateA.maxHp}`);

  // Twin Mercies: exactly the two most-wounded allies, 25% each; a
  // full-health Cain is not among them.
  mateA.hp = 1;
  mateB.hp = Math.round(mateB.maxHp * 0.5);
  cain.hp = cain.maxHp;
  Abilities.execute(HEROES.cain.abilities[1], cain, null, battle);
  assert(mateA.hp === 1 + Math.round(cain.maxHp * 0.25), `mercy A left ${mateA.hp}`);
  assert(mateB.hp === Math.round(mateB.maxHp * 0.5) + Math.round(cain.maxHp * 0.25)
    || mateB.hp === mateB.maxHp, `mercy B left ${mateB.hp}/${mateB.maxHp}`);

  // Quickening Waters: 50% of his pool plus the send-off.
  mateA.hp = 1;
  Abilities.execute(HEROES.cain.abilities[2], cain, mateA, battle);
  assert(mateA.hp === Math.min(mateA.maxHp, 1 + Math.round(cain.maxHp * 0.50)),
    `quickening left ${mateA.hp}`);
  assert(mateA.statusEffects.some((fx) =>
    fx.kind === 'buff' && fx.stat === 'speed' && fx.mult === 1.3 && fx.turns === 2),
    'the waters did not quicken');

  // Nothing Is Wasted + Spillway: a heal on a full ally converts whole
  // into damage on the healthiest enemy, x1.25 from the back hex,
  // mitigated like any strike — and the wounded enemy is spared.
  mateA.hp = mateA.maxHp;
  foeHigh.hp = foeHigh.maxHp;
  const woundedHp = foeLow.hp;
  Abilities.execute(HEROES.cain.abilities[0], cain, mateA, battle);
  const overflow = Math.round(cain.maxHp * 0.30);
  const expected = Abilities.damageFormula(overflow * 1.25, foeHigh.effectiveStat('def'));
  assert(foeHigh.maxHp - foeHigh.hp === expected,
    `overflow lashed for ${foeHigh.maxHp - foeHigh.hp}, expected ${expected}`);
  assert(foeLow.hp === woundedHp, 'the overflow hit the wounded enemy instead');
});

test('bit: the wall is the weapon — DEF-scaled sweeps, case-hardening, bedrock', () => {
  const battle = makeBattle();
  const bit = place(battle, HEROES.bit, TEAM.PLAYER, 1); // front hex — Bedrock live
  const foeFront = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1));
  const foeCenter = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 0));
  const foeBack = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 4));
  bit.baseCritChance = 0;
  bit.gearAccuracy = 10; // the DEF strip must land to be readable
  for (const f of [foeFront, foeCenter, foeBack]) f.dodgeChance = () => 0;

  // Bedrock: the front hex pays +25% DEF, and every skill scales off it.
  const def = bit.effectiveStat('def');
  assert(def === Math.round(bit.baseDef * 1.25), `bedrock def reads ${def}`);

  const elem = g.Elements.mult(bit.element, foeFront.element);

  // Core Sample: 125% of his (bedrock-boosted) DEF through the curve.
  foeFront.hp = foeFront.maxHp;
  Abilities.execute(HEROES.bit.abilities[1], bit, foeFront, battle);
  const expected = Abilities.damageFormula(def * 1.25 * elem, foeFront.effectiveStat('def'));
  assert(foeFront.maxHp - foeFront.hp === expected,
    `core sample paid ${foeFront.maxHp - foeFront.hp}, expected ${expected}`);

  // Bore Sweep: hits the front row only, and strips 30% DEF for 1 turn.
  // The strip is gated at 50% until its chance rungs are bought, so max
  // the skill -- a guaranteed strip is what the fully-levelled skill
  // promises, not what the base one does.
  bit.abilities.find((a) => a.def === HEROES.bit.abilities[0]).level =
    Progression.skillCap(HEROES.bit.abilities[0], 0);
  foeFront.hp = foeFront.maxHp; foeBack.hp = foeBack.maxHp;
  Abilities.execute(HEROES.bit.abilities[0], bit, foeFront, battle);
  assert(foeFront.hp < foeFront.maxHp, 'bore sweep missed the front');
  assert(foeBack.hp === foeBack.maxHp, 'bore sweep reached the back row');
  const strip = foeFront.statusEffects.find((fx) => fx.kind === 'debuff' && fx.stat === 'def');
  assert(strip && strip.mult === 0.7 && strip.turns === 1,
    `the strip landed as ${JSON.stringify(strip)}`);

  // Breakthrough: front AND center, never the back.
  for (const f of [foeFront, foeCenter, foeBack]) f.hp = f.maxHp;
  Abilities.execute(HEROES.bit.abilities[2], bit, null, battle);
  assert(foeFront.hp < foeFront.maxHp && foeCenter.hp < foeCenter.maxHp,
    'breakthrough spared the wall');
  assert(foeBack.hp === foeBack.maxHp, 'breakthrough reached the back row');

  // Case-Hardened: a DEF buff turns +20% damage on; without one, off.
  foeFront.hp = foeFront.maxHp;
  foeFront.statusEffects.length = 0;
  bit.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.3, turns: 2 });
  Abilities.execute(HEROES.bit.abilities[1], bit, foeFront, battle);
  const buffedDef = bit.effectiveStat('def');
  const hardened = Abilities.damageFormula(buffedDef * 1.25 * 1.20 * elem,
    foeFront.effectiveStat('def'));
  assert(foeFront.maxHp - foeFront.hp === hardened,
    `case-hardened paid ${foeFront.maxHp - foeFront.hp}, expected ${hardened}`);
});

test('tanner: favors, bubbles that eat one hit, and meter for the laggard', () => {
  const battle = makeBattle();
  const tanner = place(battle, HEROES.tanner, TEAM.PLAYER, 4); // back hex — Second Wind live
  const mate = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
  const slow = place(battle, DUMMIES.rat_knight, TEAM.PLAYER, 2);
  const foe = place(battle, DUMMIES.rat_mauler, TEAM.ENEMY, 1);
  foe.baseCritChance = 0;
  mate.dodgeChance = () => 0;

  // Royal Favor: the ATK buff plus 50 points of meter on the spot.
  mate.turnMeter = CONFIG.TURN_METER_MAX * 0.2;
  Abilities.execute(HEROES.tanner.abilities[1], tanner, mate, battle);
  assert(mate.statusEffects.some((fx) =>
    fx.kind === 'buff' && fx.stat === 'atk' && fx.mult === 1.3 && fx.turns === 2),
    'the favor carried no ATK');
  assert(Math.abs(mate.turnMeter - CONFIG.TURN_METER_MAX * 0.7) < 1,
    `the favor filled the meter to ${mate.turnMeter}`);

  // Bubble Court: everyone bubbled; a bubble eats one WHOLE hit and
  // pops; the second hit lands.
  Abilities.execute(HEROES.tanner.abilities[2], tanner, tanner, battle);
  for (const u of [tanner, mate, slow]) {
    assert(u.statusEffects.some((fx) => fx.kind === 'bubble'), `${u.name} unbubbled`);
  }
  mate.hp = mate.maxHp;
  Abilities.execute(DUMMIES.rat_mauler.abilities[0], foe, mate, battle);
  assert(mate.hp === mate.maxHp, 'the bubble let the hit through');
  assert(!mate.statusEffects.some((fx) => fx.kind === 'bubble'), 'the bubble survived the pop');
  Abilities.execute(DUMMIES.rat_mauler.abilities[0], foe, mate, battle);
  assert(mate.hp < mate.maxHp, 'the second hit should land');

  // Noblesse Oblige: his turn start waves the laggard ally onward.
  mate.turnMeter = CONFIG.TURN_METER_MAX * 0.9;
  slow.turnMeter = CONFIG.TURN_METER_MAX * 0.1;
  tanner.startTurn(battle);
  assert(Math.abs(slow.turnMeter - CONFIG.TURN_METER_MAX * 0.2) < 1,
    `the laggard sits at ${slow.turnMeter}`);
  assert(Math.abs(mate.turnMeter - CONFIG.TURN_METER_MAX * 0.9) < 1,
    'the wrong ally was waved on');

  // Second Wind: below half HP, acting refunds 20 meter; above, none.
  tanner.hp = Math.round(tanner.maxHp * 0.4);
  tanner.useAbility(tanner.abilities[0]);
  assert(Math.abs(tanner.turnMeter - CONFIG.TURN_METER_MAX * 0.2) < 1,
    `second wind refunded to ${tanner.turnMeter}`);
  tanner.hp = tanner.maxHp;
  tanner.useAbility(tanner.abilities[0]);
  assert(tanner.turnMeter === 0, 'a healthy prince took a refund');
});

test('the event calendar: one element doubled each weekday, all five on weekends', () => {
  const E = g.Events;
  // 2026-08-24 is a Monday; the week walks forward from there.
  const day = (offset) => new Date(2026, 7, 24 + offset, 12, 0, 0);
  const week = [
    ['Monday', 'fire'], ['Tuesday', 'water'], ['Wednesday', 'wind'],
    ['Thursday', 'light'], ['Friday', 'dark'],
  ];
  week.forEach(([name, el], i) => {
    const d = day(i);
    assert(E.boostedElements(d).join() === el, `${name} boosts ${E.boostedElements(d)}`);
    assert(E.elementBoost(el, d) === 2, `${name}: ${el} is not doubled`);
    for (const other of E.ALL_ELEMENTS) {
      if (other === el) continue;
      assert(E.elementBoost(other, d) === 1, `${name}: ${other} doubled by mistake`);
    }
    assert(E.scheduleLabel(d).includes('2×'), `${name}: label reads ${E.scheduleLabel(d)}`);
  });
  // Saturday and Sunday: everything doubles.
  for (const offset of [5, 6]) {
    const d = day(offset);
    assert(E.isWeekend(d), `${d} should be a weekend`);
    for (const el of E.ALL_ELEMENTS) {
      assert(E.elementBoost(el, d) === 2, `weekend: ${el} is not doubled`);
    }
    assert(E.scheduleLabel(d).includes('EVERY'), 'the weekend label undersells it');
  }
  assert(!E.isWeekend(day(0)), 'Monday is not a weekend, whatever it feels like');
});

test('summon banners: both scrolls rotate one sect a week, wrapping forever', () => {
  const E = g.Events;
  const during = new Date(2026, 7, 25, 12);       // Aug 25 — Cryst / Reverence
  const lastCall = new Date(2026, 7, 30, 23, 59); // Sunday, minutes to go
  const after = new Date(2026, 7, 31, 0, 1);      // Monday — the wheel turns
  const farOut = new Date(2027, 3, 1);            // and keeps turning

  // One banner per scroll kind, running concurrently, at every moment
  // the calendar can produce — including long before and long after.
  for (const when of [during, lastCall, after, farOut, new Date(2025, 0, 1)]) {
    assert(E.activeBanners(when).length === 2,
      `${when.toDateString()} runs ${E.activeBanners(when).length} banners`);
    for (const scroll of ['rare', 'temporal']) {
      assert(E.activeBanners(when).filter((b) => b.scroll === scroll).length === 1,
        `the ${scroll} scroll doubled up or went dark on ${when.toDateString()}`);
    }
  }

  // The two wheels, in the order they are meant to turn. Written out
  // rather than read off BANNER_CYCLES on purpose: this is the contract
  // that the order does not shuffle under a player mid-rotation, and a
  // test that derived it from the thing it is checking would agree with
  // any reordering. The length check below is what forces an append to
  // be a deliberate edit here too.
  const rare = (y, m, d) => E.currentBanner(new Date(y, m, d, 12), 'rare').id;
  const temporal = (y, m, d) => E.currentBanner(new Date(y, m, d, 12), 'temporal').id;
  const RARE_WHEEL = ['cryst_rateup', 'firetroupe_rateup', 'whisperchime_rateup',
    'gulldigger_rateup', 'phoenixcourt_rateup', 'razorwings_rateup'];
  const TEMPORAL_WHEEL = ['reverence_rateup', 'nightflower_rateup',
    'sunbrood_rateup', 'hollowbone_rateup'];
  assert(E.BANNER_CYCLES.rare.length === RARE_WHEEL.length &&
    E.BANNER_CYCLES.temporal.length === TEMPORAL_WHEEL.length,
    'a wheel grew or shrank without this test being told');
  assert(rare(2026, 7, 26) === 'cryst_rateup', 'the Rare scroll is not on Cryst today');
  assert(temporal(2026, 7, 26) === 'reverence_rateup', 'the Temporal scroll is not on Reverence today');
  // Two full turns of the longer wheel from the epoch Monday, both
  // scrolls -- twelve weeks, which walks the Rare wheel twice and the
  // Temporal one three times, so both are walked end to end and past
  // their own wrap.
  for (let w = 0; w < RARE_WHEEL.length * 2; w++) {
    const mon = new Date(2026, 7, 24 + w * 7, 12);
    assert(E.currentBanner(mon, 'rare').id === RARE_WHEEL[w % RARE_WHEEL.length],
      `week ${w} of the Rare wheel is ${E.currentBanner(mon, 'rare').id}`);
    assert(E.currentBanner(mon, 'temporal').id === TEMPORAL_WHEEL[w % TEMPORAL_WHEEL.length],
      `week ${w} of the Temporal wheel is ${E.currentBanner(mon, 'temporal').id}`);
  }

  // A week is a week: the sitting banner holds every minute up to its
  // Monday midnight, and none of the minute after it.
  assert(E.currentBanner(lastCall, 'rare').id === 'cryst_rateup' &&
    E.currentBanner(lastCall, 'temporal').id === 'reverence_rateup',
    'the opening pair bowed out before Sunday was over');
  assert(rare(2026, 7, 31) === 'firetroupe_rateup' && rare(2026, 8, 6) === 'firetroupe_rateup',
    'the Firetroupe did not hold their whole week');
  assert(rare(2026, 8, 7) === 'whisperchime_rateup' && rare(2026, 8, 13) === 'whisperchime_rateup',
    'the Whisperchime did not hold their whole week');
  // The two bird sects were unbannered until they were appended here,
  // which is why the wheel wraps on week five now and not week three.
  assert(rare(2026, 8, 14) === 'gulldigger_rateup' && rare(2026, 8, 20) === 'gulldigger_rateup',
    'the Gulldiggers did not hold their whole week');
  assert(rare(2026, 8, 21) === 'phoenixcourt_rateup' && rare(2026, 8, 27) === 'phoenixcourt_rateup',
    'the Phoenix Court did not hold their whole week');
  // The three finished sects that had no week until they were appended:
  // the Rare wheel runs six now and the Temporal four.
  assert(rare(2026, 8, 28) === 'razorwings_rateup' && rare(2026, 9, 4) === 'razorwings_rateup',
    'the Razorwings did not hold their whole week');
  assert(rare(2026, 9, 5) === 'cryst_rateup', 'the Rare wheel did not wrap back to Cryst');
  assert(temporal(2026, 8, 7) === 'sunbrood_rateup' && temporal(2026, 8, 13) === 'sunbrood_rateup',
    'the Sunbrood did not hold their whole week');
  assert(temporal(2026, 8, 14) === 'hollowbone_rateup' && temporal(2026, 8, 20) === 'hollowbone_rateup',
    'the Hollowbone did not hold their whole week');
  assert(temporal(2026, 8, 21) === 'reverence_rateup',
    'the Temporal wheel did not bounce back to Reverence');

  // The window a banner reports is the week it actually holds, and its
  // label names the Sunday it runs through.
  const fire = E.bannerFor('rare', new Date(2026, 7, 31, 12));
  assert(+fire.from === +new Date(2026, 7, 31) && +fire.until === +new Date(2026, 8, 7),
    'the Firetroupe window is not their Monday-to-Monday week');
  assert(fire.label.includes('through Sep 6'), `the label reads "${fire.label}"`);
  assert(fire.mult === 2, 'the rate-up is not 2x');

  // A sect coming back around is a NEW run, so its featured pool is
  // whole again rather than remembering what an earlier week handed out.
  const cryst0 = E.bannerFor('rare', during).run;
  const cryst3 = E.bannerFor('rare', new Date(2026, 8, 14, 12)).run;
  assert(cryst0 !== cryst3, 'Cryst reran under the same pity key');
  g.GameState.setBannerPity('cryst_rateup', { count: 7, claimed: ['polarus'], run: cryst0 });
  assert(g.GameState.bannerPity('cryst_rateup', cryst0).claimed.length === 1,
    'the run it was filled in forgot its own claim');
  const back = g.GameState.bannerPity('cryst_rateup', cryst3);
  assert(back.claimed.length === 0, 'a returning banner remembered an old run\'s claims');
  assert(back.count === 7, 'a returning banner binned the pull counter');

  // Elementally-locked sects can only ever ride the scroll that can
  // draw them: the Temporal pool is Dark and Light only.
  // A banner features a sect you can still recruit from. Scheduling a
  // closed order would advertise a rate-up on nobody.
  for (const b of E.SUMMON_BANNERS) {
    const sect = RACES.SECTS[b.sect];
    assert(sect, `${b.id} features an unknown sect '${b.sect}'`);
    assert(!sect.defunct, `${b.id} features ${sect.name}, a closed order`);
    assert(sect.members.length > 0, `${b.id} features a sect with no heroes`);
  }

  // Derived rather than listed: a sect holding no Dark or Light hero
  // cannot ride the Temporal scroll, whoever they are. Naming the three
  // that were true when this was written meant a fourth could be
  // scheduled wrongly and the test would agree.
  for (const b of E.SUMMON_BANNERS) {
    if (b.scroll !== 'temporal') continue;
    const members = Object.values(HEROES).filter((h) =>
      RACES.sectOf(h) && RACES.sectOf(h).id === b.sect);
    assert(members.some((h) => g.Elements.TEMPORAL.includes(h.element)),
      `${b.sect} rides the Temporal scroll with nothing it can draw`);
  }
  for (const b of E.SUMMON_BANNERS) {
    const pool = b.scroll === 'temporal' ? g.Elements.TEMPORAL : g.Elements.BASIC;
    const members = Object.values(HEROES).filter((h) =>
      RACES.sectOf(h) && RACES.sectOf(h).id === b.sect);
    for (const h of members) {
      assert(pool.includes(h.element),
        `${h.id} is ${h.element}, which the ${b.scroll} scroll cannot draw`);
    }
  }

  // Weights come off the banner for the scroll being pulled.
  assert(E.bannerWeight(HEROES.toll, during, 'temporal') === 2, 'Toll unweighted on his banner');
  assert(E.bannerWeight(HEROES.polarus, during, 'rare') === 2, 'the King unweighted on his');
  assert(E.bannerWeight(HEROES.polarus, during, 'temporal') === 1, 'the King crashed the Temporal');
  assert(E.bannerWeight(HEROES.toll, during, 'rare') === 1, 'Toll crashed the Rare');
  assert(E.bannerWeight(HEROES.toll, after, 'temporal') === 1, 'Toll overstayed');
  assert(E.bannerWeight(DUMMIES.rat_brawler, during, 'rare') === 1, 'a rat on the banner');
  assert(E.bannerWeight(HEROES.polarus, after, 'rare') === 1, 'the King outstayed his banner');
  assert(E.bannerWeight(HEROES.lucian, during, 'rare') === 1, 'Lucian jumped his banner');
  assert(E.bannerWeight(HEROES.lucian, after, 'rare') === 2, 'Lucian missed his own banner');
  const chime = new Date(2026, 8, 7, 12);
  assert(E.bannerWeight(HEROES.asher, chime, 'rare') === 2, 'Asher unweighted on his own banner');
  assert(E.bannerWeight(HEROES.asher, after, 'rare') === 1, 'Asher jumped the Firetroupe queue');
  assert(E.bannerWeight(HEROES.lucian, chime, 'rare') === 1, 'the Firetroupe outstayed their week');

  // The tilt shows up in real draws: 3-star Temporal picks during the
  // Reverence banner land on sect members ~2x their per-capita share.
  const pool3 = Object.values(HEROES).filter((h) =>
    h.rarity === 3 && ['light', 'dark'].includes(h.element));
  const revCount = pool3.filter((h) =>
    RACES.sectOf(h) && RACES.sectOf(h).id === 'reverence').length;
  assert(revCount > 0, 'no 3-star Reverence heroes in the temporal pool');
  const draws = 6000;
  // Upper bound on a SAMPLED proportion, so it has to be a confidence
  // margin rather than a flat ratio. `tilted * 1.06` was 2.5 standard
  // errors at this sample size -- about one run in fifty tripped on a
  // draw that was merely lucky, and the balance passes that gate on this
  // suite ate the failure. Four sigma is still far below what a 3x
  // weight could produce, so an actually-wrong weight is still caught.
  const ceiling = (p, n) => p + 4 * Math.sqrt((p * (1 - p)) / n);
  let hits = 0;
  for (let i = 0; i < draws; i++) {
    const def = g.Gacha.pickHero(3, ['light', 'dark'], 'temporal', during);
    const sect = RACES.sectOf(def);
    if (sect && sect.id === 'reverence') hits++;
  }
  const expectedFlat = revCount / pool3.length;
  const expectedTilted = (revCount * 2) / (pool3.length + revCount);
  const seen = hits / draws;
  assert(seen > (expectedFlat + expectedTilted) / 2 && seen < ceiling(expectedTilted, draws),
    `banner share ${seen.toFixed(3)} vs flat ${expectedFlat.toFixed(3)} / tilted ${expectedTilted.toFixed(3)}`);

  // Rare-scroll elective pulls tilt the same way, toward whichever sect
  // holds the wheel that week: Cryst now, the Firetroupe next, the
  // Whisperchime the week after that.
  const poolR = Object.values(HEROES).filter((h) => h.rarity === 3);
  const rareTilt = (sectId, when) => {
    const count = poolR.filter((h) =>
      RACES.sectOf(h) && RACES.sectOf(h).id === sectId).length;
    assert(count > 0, `no 3-star ${sectId} heroes in the rare pool`);
    let hit = 0;
    for (let i = 0; i < draws; i++) {
      const def = g.Gacha.pickHero(3, null, 'rare', when);
      const sect = RACES.sectOf(def);
      if (sect && sect.id === sectId) hit++;
    }
    const flat = count / poolR.length;
    const tilted = (count * 2) / (poolR.length + count);
    const share = hit / draws;
    // The sample must land nearer the tilted figure than the flat one,
    // and must not overshoot what a 2x weight can even produce. A
    // ratio-of-flat bound would be meaningless here: a sect can be most
    // of its own star band now, so flat * 1.4 is often above 1.
    assert(share > (flat + tilted) / 2 && share < ceiling(tilted, draws),
      `${sectId} share ${share.toFixed(3)} vs flat ${flat.toFixed(3)} / tilted ${tilted.toFixed(3)}`);
  };
  rareTilt('cryst', during);
  rareTilt('firetroupe', after);
  rareTilt('whisperchime', chime);

  // The banner is ELECTIVE: an un-elected pull stays flat even while
  // the banner runs.
  let flatHits = 0;
  for (let i = 0; i < draws; i++) {
    const def = g.Gacha.pickHero(3, ['light', 'dark'], false, during);
    const sect = RACES.sectOf(def);
    if (sect && sect.id === 'reverence') flatHits++;
  }
  const flatSeen = flatHits / draws;
  assert(flatSeen > expectedFlat * 0.75 && flatSeen < expectedFlat * 1.25,
    `plain share ${flatSeen.toFixed(3)} drifted from flat ${expectedFlat.toFixed(3)}`);
});

test('pity ladders: plain rare breaks at 100, banner pity claims the featured strip', () => {
  const w = loadGame();
  const G = w.GameState, Ga = w.Gacha, R = w.RACES;

  assert(Ga.PITY_LIMIT === 100, `plain pity limit is ${Ga.PITY_LIMIT}`);
  assert(Ga.BANNER_PITY_EVERY === 50, `banner pity every ${Ga.BANNER_PITY_EVERY}`);

  // Plain rare pity: at 99 misses, the next plain pull is a 5★ and the
  // ladder resets.
  G.setPity(Ga.PITY_LIMIT - 1);
  G.addScrolls('rare', 1);
  const [broke] = Ga.pull('rare', 1);
  assert(broke.rarity === 5, `the pity break paid a ${broke.rarity}★`);
  assert(G.pity === 0, 'the break should reset the ladder');

  // Banner pulls leave the plain ladder alone and tick their own.
  const banner = w.Events.currentBanner(new Date(), 'rare');
  assert(banner && banner.sect === 'cryst', 'no rare banner running');
  G.setPity(7);
  G.addScrolls('rare', 49);
  for (let i = 0; i < 49; i++) Ga.pull('rare', 1, { banner: true });
  assert(G.pity === 7, 'banner pulls ticked the plain ladder');
  let led = G.bannerPity(banner.id);
  assert(led.count === 49 && led.claimed.length === 0,
    `ledger reads ${JSON.stringify(led)}`);

  // The 50th banner pull hands over a featured hero and crosses it off.
  G.addScrolls('rare', 1);
  const [fifty] = Ga.pull('rare', 1, { banner: true });
  const sect = R.sectOf(fifty.def);
  assert(fifty.bannerPity && sect && sect.id === 'cryst',
    `the 50th pull paid ${fifty.def.id}`);
  led = G.bannerPity(banner.id);
  assert(led.count === 0 && led.claimed.length === 1 &&
    led.claimed[0] === fifty.def.id, 'the claim was not written down');
  const info = Ga.bannerPityInfo(banner);
  assert(!info.remaining.includes(fifty.def.id), 'a claimed hero stayed in the pool');

  // With every featured hero claimed, the pity is spent: the counter
  // stops moving and no guarantee ever fires again this banner.
  G.setBannerPity(banner.id, { count: 49,
    claimed: [...info.remaining, ...led.claimed] });
  G.addScrolls('rare', 1);
  const [after] = Ga.pull('rare', 1, { banner: true });
  assert(!after.bannerPity, 'a spent pity still fired');
  assert(G.bannerPity(banner.id).count === 49, 'a spent pity kept counting');
});

test('auto star up: higher targets forge further up the ladder', () => {
  const w = loadGame();
  const G = w.GameState;
  const one = Object.values(w.HEROES).find((h) => h.rarity === lowestRarity(w));
  for (let i = 0; i < 24; i++) G.addHero(one.id);

  // Plans are monotonic in the target: aiming one rank higher includes
  // every step the lower plan takes plus the rank above it.
  const floor = lowestRarity(w);
  const lo = G.planAutoStarUp(floor + 1).length;
  const hi = G.planAutoStarUp(floor + 2).length;
  assert(lo > 0, 'a shelf of 24 spares planned nothing');
  assert(hi > lo, `target ${floor + 2} planned ${hi} steps vs ${floor + 1}'s ${lo}`);

  // Executing the higher plan performs exactly what it promised, and a
  // hero two ranks above the floor exists that did not before.
  const tall = () => G.ownedHeroIds()
    .filter((uid) => G.progressOf(uid).stars >= floor + 2).length;
  const before = tall();
  const r = G.autoStarUp(floor + 2);
  assert(r.starUps === hi, `planned ${hi} star ups, performed ${r.starUps}`);
  assert(tall() > before, `no new ${floor + 2}-star hero was forged`);
});

test('the World Rift: weekly rotation, score ledger, milestones pay once', () => {
  const w = loadGame();
  const E = w.Events, G = w.GameState;

  // The element rotates weekly and holds steady inside a week
  // (2026-08-24 is a Monday; the 30th is that week's Sunday).
  const els = [0, 1, 2, 3, 4].map((k) =>
    E.worldRiftElement(new Date(2026, 7, 24 + 7 * k)));
  assert(new Set(els).size === 5, `five weeks drew ${new Set(els).size} elements`);
  assert(E.worldRiftElement(new Date(2026, 7, 24, 1)) ===
    E.worldRiftElement(new Date(2026, 7, 30, 23)), 'the element changed mid-week');
  assert(E.worldRiftWeekKey(new Date(2026, 7, 24)) !==
    E.worldRiftWeekKey(new Date(2026, 7, 31)), 'two weeks shared a ledger key');

  // First run: best recorded, the 25k and 60k milestones pay together —
  // the ladder is 1/2/3/4/5 Temporal Scrolls, so this pays 3.
  const before = { whet: G.whetstones, arcana: G.arcana, rare: G.scrollsRare,
    temporal: G.scrollsTemporal, dia: G.diamonds };
  const r1 = G.recordWorldRift(70000);
  assert(r1.newBest && r1.best === 70000 && r1.crossed.length === 2,
    `first run reported ${JSON.stringify({ best: r1.best, crossed: r1.crossed.length })}`);
  assert(G.scrollsTemporal === before.temporal + 3 &&
    G.whetstones === before.whet && G.scrollsRare === before.rare &&
    G.diamonds === before.dia,
    'the crossed milestones paid wrong');

  // A worse run neither moves the best nor re-pays anything.
  const r2 = G.recordWorldRift(50000);
  assert(!r2.newBest && r2.best === 70000 && r2.crossed.length === 0,
    'a worse run moved the ledger');

  // A better run pays exactly the newly crossed marks: 120k (3) and
  // 250k (4), on top of the 3 already banked.
  const r3 = G.recordWorldRift(260000);
  assert(r3.newBest && r3.crossed.length === 2,
    `the better run crossed ${r3.crossed.length} marks`);
  assert(G.scrollsTemporal === before.temporal + 10,
    'the 120k/250k temporals unpaid');
  assert(G.worldRiftInfo().best === 260000 &&
    G.worldRiftInfo().claimed.length === 4, 'the ledger read back wrong');
});

test('keepers favourite themselves on arrival', () => {
  const w = loadGame();
  const G = w.GameState;
  const H = w.HEROES;
  const pick = (fn) => Object.values(H).find(fn);

  // The RARITY rule is what is under test here, and a blessing is a
  // SECOND reason to pin -- so the roll is held off while the rarity
  // half is checked. Without this the negative cases fail whenever the
  // blessing lands, which is rare enough to look like a real bug and
  // often enough to redden CI.
  const realRoll = w.Blessing.roll;
  w.Blessing.roll = () => null;

  const five = G.addHero(pick((h) => h.rarity === 5).id);
  assert(G.isFavorite(five.uid), 'a 5-star arrived unpinned');
  const four = G.addHero(pick((h) => h.rarity === 4 &&
    ['light', 'dark'].includes(h.element)).id);
  assert(G.isFavorite(four.uid), 'a Dark/Light 4-star arrived unpinned');
  const plain4 = G.addHero(pick((h) => h.rarity === 4 &&
    !['light', 'dark'].includes(h.element)).id);
  assert(!G.isFavorite(plain4.uid), 'an ordinary 4-star pinned itself');
  const plain3 = G.addHero(pick((h) => h.rarity === 3).id);
  assert(!G.isFavorite(plain3.uid), 'a 3-star pinned itself');

  // Any blessed copy pins, whatever its stars.
  w.Blessing.roll = () => 'blessed';
  const bl = G.addHero(pick((h) => h.rarity === lowestRarity(w)).id);
  w.Blessing.roll = realRoll;
  assert(G.isFavorite(bl.uid), 'a blessed 1-star arrived unpinned');
  // And the pin is an ordinary favourite — the player can lift it.
  assert(G.toggleFavorite(bl.uid) === false && !G.isFavorite(bl.uid),
    'the automatic pin refused to come off');
});

test('the wishlist: three slots, 2x weight in plain pulls, banners unaffected', () => {
  const w = loadGame();
  const G = w.GameState;
  const pool3 = Object.values(w.HEROES).filter((h) =>
    h.rarity === 3 && ['water', 'fire', 'wind'].includes(h.element));
  // Picks from outside whichever sect holds the Rare scroll today, so
  // the running banner can't muddy the banners-unaffected check below.
  // (Nobody is sectless any more -- every authored hero has a home.)
  const rare = w.Events.currentBanner(new Date(), 'rare');
  const picks = pool3.filter((h) => {
    const sect = w.RACES.sectOf(h);
    return !sect || !rare || sect.id !== rare.sect;
  }).slice(0, 4);
  assert(picks.length === 4,
    `only ${picks.length} 3-star heroes outside the running Rare banner`);

  // Three slots, toggling on and off.
  assert(G.toggleWishlist(picks[0].id).on && G.toggleWishlist(picks[1].id).on &&
    G.toggleWishlist(picks[2].id).on, 'wishing failed');
  assert(G.toggleWishlist(picks[3].id).error === 'full', 'a fourth slot opened');
  assert(G.toggleWishlist(picks[2].id).on === false && G.wishlist().length === 2,
    'toggle-off failed');
  G.toggleWishlist(picks[2].id);
  assert(G.isWishlisted(picks[0].id) && !G.isWishlisted(picks[3].id),
    'membership reads wrong');

  // Plain 3★ draws land on wishlisted characters at ~2x their
  // per-capita share; the band itself never moved.
  const wish = new Set(G.wishlist());
  const draws = 6000;
  let hits = 0;
  for (let i = 0; i < draws; i++) {
    const def = w.Gacha.pickHero(3, ['water', 'fire', 'wind'], false);
    if (wish.has(def.id)) hits++;
  }
  const flat = 3 / pool3.length;
  const tilted = 6 / (pool3.length + 3);
  const seen = hits / draws;
  assert(seen > flat * 1.4 && seen < tilted * 1.35,
    `wishlist share ${seen.toFixed(4)} vs flat ${flat.toFixed(4)} / tilted ${tilted.toFixed(4)}`);

  // A banner pull runs the banner's tilt, not the wishlist's: the
  // wishlisted trio (none of them Cryst) stays at or below flat share.
  assert(picks.slice(0, 3).every((h) => {
    const s = w.RACES.sectOf(h);
    return !s || s.id !== 'cryst';
  }), 'test picks collide with the running banner sect');
  let bHits = 0;
  for (let i = 0; i < draws; i++) {
    const def = w.Gacha.pickHero(3, null, 'rare');
    if (wish.has(def.id)) bHits++;
  }
  const all3 = Object.values(w.HEROES).filter((h) => h.rarity === 3).length;
  const bFlat = 3 / all3;
  assert(bHits / draws < bFlat * 1.35,
    `banner pulls honored the wishlist (${(bHits / draws).toFixed(4)} vs flat ${bFlat.toFixed(4)})`);
});

test('login bonuses: two separate claims, a real calendar, catch-up buys days', () => {
  const w = loadGame();
  const G = w.GameState;
  const E = w.Events;

  const order = ['florence', 'ari', 'cain', 'tanner', 'angelica', 'bit', 'sawyer'];
  E.LOGIN_WEEK.forEach((r, i) => {
    assert(r.hero === order[i], `day ${i + 1} pays ${r.hero}, wanted ${order[i]}`);
  });

  // The two claims are independent: taking the hero leaves the stamp.
  assert(G.firstSevenClaimable() && G.monthlyClaimable(), 'fresh save not claimable');
  const tideBefore = G.countOf('florence');
  const heroGot = G.claimFirstSeven();
  assert(heroGot && heroGot.day === 1, `hero claim reported ${JSON.stringify(heroGot)}`);
  assert(G.countOf('florence') === tideBefore + 1, 'day 1 paid no Tide');
  assert(!G.firstSevenClaimable(), 'hero claim still open');
  assert(G.monthlyClaimable(), 'the hero claim swallowed the stamp');

  // The weekday menu: Sun rare scroll, Mon-Fri five large elements in
  // fire/water/wind/light/dark order, Sat temporal.
  const wk = E.LOGIN_CAL_WEEKDAY;
  assert(wk[0].rare === 1 && wk[6].temporal === 1, 'weekend scrolls off the menu');
  ['fire', 'water', 'wind', 'light', 'dark'].forEach((el, i) => {
    const r = wk[i + 1].elements;
    assert(r && r.el === el && r.large === 5,
      `weekday ${i + 1} pays ${JSON.stringify(wk[i + 1])}, wanted 5 large ${el}`);
  });
  assert([7, 14, 21, 28].every((n, i) =>
    E.LOGIN_MONTH_MILESTONES[n].temporal === [1, 2, 3, 5][i]),
    'milestone scroll counts drifted');

  // Bookkeeping for the payouts below: tally scrolls and large
  // elements, and build expectations straight off the tables.
  const snap = () => {
    const s = { rare: G.scrollsRare, temporal: G.scrollsTemporal };
    for (const el of ['fire', 'water', 'wind', 'light', 'dark']) {
      s[el] = G.elementsOf(el).large;
    }
    return s;
  };
  const expected = (base, rewards) => {
    const want = { ...base };
    for (const r of rewards) {
      if (r.rare) want.rare += r.rare;
      if (r.temporal) want.temporal += r.temporal;
      if (r.elements) want[r.elements.el] += r.elements.large || 0;
    }
    return want;
  };
  const check = (got, want, tag) => {
    for (const k of Object.keys(want)) {
      assert(got[k] === want[k], `${tag}: ${k} read ${got[k]}, wanted ${want[k]}`);
    }
  };

  // The stamp records today's actual calendar day and pays that
  // weekday's reward.
  const now = new Date();
  const today = now.getDate();
  const todayReward = E.calendarDayReward(now.getFullYear(), now.getMonth(), today);
  const before = snap();
  const stampGot = G.claimMonthly();
  assert(stampGot && stampGot.dayOfMonth === today && stampGot.stamps === 1,
    `stamp reported ${JSON.stringify(stampGot)}`);
  assert(stampGot.reward.label === todayReward.label,
    `stamp paid ${stampGot.reward.label}, the weekday says ${todayReward.label}`);
  check(snap(), expected(before, [todayReward]), 'first stamp');
  assert(G.loginInfo().stampedDays.join() === String(today),
    `stamped days read ${G.loginInfo().stampedDays}`);
  assert(G.claimMonthly() === null && G.claimFirstSeven() === null,
    'a double claim went through');

  // Catch-up: buys exactly the unstamped PRIOR days of the month, each
  // paying its own weekday reward, with milestone bonuses landing as
  // the stamp count crosses 7/14/21/28.
  const missedList = G.loginMissedList();
  assert(missedList.length === today - 1, `missed ${missedList.length} of ${today - 1}`);
  assert(G.loginCatchUpCost() === missedList.length * 20, 'cost off the menu');
  if (missedList.length === 0) {
    assert(G.buyLoginCatchUp() === null, 'bought zero days');
  } else {
    const broke = G.buyLoginCatchUp();
    assert(broke && broke.error === 'diamonds', 'a broke catch-up went through');
    G.addDiamonds(G.loginCatchUpCost());
    const base = snap();
    const bought = G.buyLoginCatchUp();
    assert(bought && bought.bought === missedList.length, 'the buy came up short');
    const paid = missedList.map((d) =>
      E.calendarDayReward(now.getFullYear(), now.getMonth(), d));
    for (const [n, m] of Object.entries(E.LOGIN_MONTH_MILESTONES)) {
      if (Number(n) > 1 && Number(n) <= 1 + missedList.length) paid.push(m);
    }
    check(snap(), expected(base, paid), 'catch-up');
    assert(G.loginMissedDays() === 0, 'days still missing after the buy');
    const days = G.loginInfo().stampedDays;
    assert(days.length === today, `calendar shows ${days.length} of ${today} days`);
    for (let d = 1; d <= today; d++) {
      assert(days.includes(d), `day ${d} missing from the calendar`);
    }
    // The hero track did not move.
    assert(G.loginInfo().cycle === 1, 'catch-up dragged the hero track');
  }
});

test('the collection is forever: NEW! and the compendium track characters ever held', () => {
  const w = loadGame();
  const G = w.GameState;
  const ones = Object.values(w.HEROES).filter((h) => (h.rarity || 1) === shelfOf(2, w));
  const [a, b] = ones;

  const first = G.addHero(a.id);
  assert(first.isNew, 'first-ever copy of a character was not NEW!');
  const second = G.addHero(a.id);
  assert(!second.isNew, 'a dupe in hand flagged as NEW!');
  assert(G.everCollected(a.id), 'collection registry missed a summon');

  // Spend every copy of A as star-up fodder for B: gone from the
  // roster, but not from history.
  //
  // Unfavourited first, and that is not tidying. addHero rolls a
  // blessing, a blessed copy arrives favourited, and a favourite is
  // never offered as fodder -- so roughly one run in twenty spent one
  // copy instead of two and failed here for a reason that had nothing
  // to do with the collection registry.
  const target = G.addHero(b.id).uid;
  for (const uid of [first.uid, second.uid]) {
    if (G.isFavorite(uid)) G.toggleFavorite(uid);
  }
  const r = G.sacrifice(target, [first.uid, second.uid]);
  assert(r && r.spent === 2, `fodder did not burn: ${JSON.stringify(r)}`);
  assert(G.countOf(a.id) === 0, 'copies of A survived the sacrifice');
  assert(G.everCollected(a.id), 'losing the last copy erased the collection mark');
  assert(G.collectedDefIds().includes(a.id), 'collectedDefIds dropped a spent character');

  // Re-summoning a character you once held is a return, not a discovery.
  const again = G.addHero(a.id);
  assert(!again.isNew, 're-collecting a spent character flagged as NEW!');
  assert(!G.everCollected('nobody_by_this_id'), 'registry invented a character');
});

test('diamonds buy room and scrolls, within the ceilings', () => {
  const w = loadGame();
  const G = w.GameState;
  assert(G.diamonds === 0, 'a fresh save should start with no diamonds');
  assert(G.expandRoster() === null, 'expanded a roster with no diamonds');
  G.addDiamonds(10000);

  const r0 = G.MAX_ROSTER;
  assert(G.expandRoster() === r0 + 10, 'roster should grow by ten');
  assert(G.diamonds === 10000 - G.ROSTER_STEP_COST, 'roster expansion mispriced');
  const s0 = G.MAX_STORAGE;
  assert(G.expandStorage() === s0 + 10, 'storage should grow by ten');

  const rare0 = G.scrollsRare;
  assert(G.buyRareScrolls() === 10 && G.scrollsRare === rare0 + 10,
    'the rare pack should pay ten scrolls');
  const t0 = G.scrollsTemporal;
  assert(G.buyTemporalScroll() === 1 && G.scrollsTemporal === t0 + 1,
    'the temporal purchase should pay one scroll');
  assert(G.diamonds === 10000 - G.ROSTER_STEP_COST - G.STORAGE_STEP_COST -
    G.RARE_PACK_COST - G.TEMPORAL_COST, 'exchange prices drifted');

  // Ceilings hold however rich the player is.
  G.addDiamonds(1000000);
  let guard = 200;
  while (G.expandRoster() !== null && guard-- > 0) {}
  assert(G.MAX_ROSTER === G.ROSTER_CAP_MAX, `roster cap ${G.MAX_ROSTER}`);
  guard = 400;
  while (G.expandStorage() !== null && guard-- > 0) {}
  assert(G.MAX_STORAGE === G.STORAGE_CAP_MAX, `storage cap ${G.MAX_STORAGE}`);
  // The bonus survives the save round-trip via shape guards, not schema.
  const raw = JSON.parse(w.localStorage.getItem('browsergacha_save_v1'));
  assert(raw.rosterCapBonus === G.ROSTER_CAP_MAX - 100, 'bonus not persisted');
});

test("Oak's rites chain into each other and his dodge can riposte", () => {
  const w = loadGame();
  const { HEROES: H, Abilities: A, Unit: U, TEAM: T, Hex: X, Meter: M } = w;
  const mk = () => {
    const battle = {
      units: [],
      livingUnits(team = null) {
        return battle.units.filter((u) => u.alive && (team === null || u.team === team));
      },
      addFloatingText() {}, log() {}, onUnitHealed() {},
      playerSlots: X.buildFormation(T.PLAYER, 200, 200, 56),
      enemySlots: X.buildFormation(T.ENEMY, 600, 200, 56),
    };
    return battle;
  };
  const battle = mk();
  const oak = new U(H.oak, T.PLAYER, { level: 30, stars: 4 });
  const foe = new U(DUMMIES.rat_knight, T.ENEMY, { level: 30, stars: 3 });
  foe.hookSources = () => [];
  foe.dodgeChance = () => 0;
  battle.units.push(oak, foe);

  // Chain forced ON: one cast of Confession lands all three rites.
  w.seed(1); // deterministic, then force the chain rolls
  const rolls = [0.0]; // every Math.random -> 0 => chains always fire, no crit... 0 < critChance though!
  // Zero makes crits fire too, which is fine — amounts only need to be 3 hits.
  w.unseed();
  const Math2 = w.Math;
  Math2.random = () => 0.0;
  foe.hp = foe.maxHp = 10 ** 9; // survive the full cycle
  let res = A.execute(oak.abilities[0].def, oak, foe, battle);
  let hits = res.filter((r) => r.kind === 'damage' && r.amount > 0).length;
  assert(hits >= 3, `forced chains should land at least 3 hits, saw ${hits}`);

  // Chain forced OFF: exactly one hit.
  Math2.random = () => 0.99;
  res = A.execute(oak.abilities[0].def, oak, foe, battle);
  hits = res.filter((r) => r.kind === 'damage').length;
  assert(hits === 1, `with cold dice one cast is one hit, saw ${hits}`);

  // The riposte: guarantee the dodge and the 50% roll, then let the foe
  // swing at Oak — he should deal damage back inside the foe's action.
  oak.dodgeChance = () => 1;
  Math2.random = () => 0.0;
  w.Battle.active = battle; // dodged() reads the active battle
  const hpBefore = foe.hp;
  A.execute(foe.abilities[0].def, foe, oak, battle);
  w.Battle.active = null;
  assert(foe.hp < hpBefore, 'a guaranteed dodge with a hot roll should riposte');
  delete Math2.random;
});

test("Silas's Aiming Stance gates, doubles, spends, and breaks correctly", () => {
  const battle = makeBattle();
  const silas = place(battle, HEROES.silas, TEAM.PLAYER, 4);
  const foeA = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1);
  const foeB = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 2);
  foeA.dodgeChance = () => 0; foeB.dodgeChance = () => 0;
  silas.dodgeChance = () => 0;
  foeA.hookSources = () => []; foeB.hookSources = () => [];
  const inStance = () => silas.statusEffects.some((fx) => fx.stat === 'aiming');
  const arrow = silas.abilities.find((a) => a.def.id === 'silas_lumen_arrow');
  const stance = silas.abilities.find((a) => a.def.id === 'silas_aiming_stance');
  const bolt = silas.abilities.find((a) => a.def.id === 'silas_boltshot');

  // Gated: Lumen Arrow is not ready without the stance.
  assert(!silas.readyAbilities().includes(arrow), 'the arrow fired without a stance');
  Abilities.execute(stance.def, silas, silas, battle);
  assert(inStance(), 'Aiming Stance did not stick');
  assert(silas.readyAbilities().includes(arrow), 'the stance did not unlock the arrow');

  // The stance doubles the shot, then is spent by it.
  foeA.hp = foeA.maxHp = 10 ** 9; foeB.hp = foeB.maxHp = 10 ** 9;
  silas.baseCritChance = 0; // crits off for clean doubling
  Abilities.execute(bolt.def, silas, foeA, battle); // spends the gating stance
  Abilities.execute(stance.def, silas, silas, battle);
  assert(inStance(), 'could not re-enter the stance');
  const aimed = Abilities.execute(bolt.def, silas, foeA, battle)
    .find((r) => r.kind === 'damage').amount;
  assert(!inStance(), 'the shot did not spend the stance');
  const bare = Abilities.execute(bolt.def, silas, foeA, battle)
    .find((r) => r.kind === 'damage').amount;
  assert(Math.abs(aimed - bare * 2) <= 2,
    `an aimed shot should double: aimed ${aimed} vs bare ${bare}`);

  // A landed single-target hit breaks it; a row volley does not.
  Abilities.execute(stance.def, silas, silas, battle);
  Abilities.execute({ id: 't_aoe', name: 'AoE', cooldown: 0, targeting: 'all-enemies',
    effects: [{ type: 'damage', mult: 0.5 }] }, foeA, silas, battle);
  assert(inStance(), 'an AoE hit should NOT break the stance');
  Abilities.execute({ id: 't_st', name: 'Jab', cooldown: 0, targeting: 'enemy',
    effects: [{ type: 'damage', mult: 0.5 }] }, foeA, silas, battle);
  assert(!inStance(), 'a landed direct hit should break the stance');

  // A dodged direct hit reveals nothing: stance holds, and the passive
  // supplies the dodge while aiming.
  Abilities.execute(stance.def, silas, silas, battle);
  delete silas.dodgeChance; // restore the real one (passive +25%)
  assert(silas.dodgeChance() === 0.25, `stance dodge is ${silas.dodgeChance()}`);
  silas.dodgeChance = () => 1;
  Abilities.execute(stance.def, silas, silas, battle);
  Abilities.execute({ id: 't_st3', name: 'Jab3', cooldown: 0, targeting: 'enemy',
    effects: [{ type: 'damage', mult: 0.5 }] }, foeA, silas, battle);
  assert(inStance(), 'a dodged hit must not break the stance');
});

test('blessed and godtouched: the summon lottery, stat lifts and resurrection', () => {
  const B = g.Blessing;

  // The roll owns exact slices: 1/10,000 Godtouched at the bottom,
  // 1/1,000 Blessed right above it, nothing past both.
  assert(B.roll(() => 0.00005) === 'godtouched', 'the bottom slice is Godtouched');
  assert(B.roll(() => 0.0005) === 'blessed', 'the next slice is Blessed');
  assert(B.roll(() => 0.00111) === null, 'past both slices still rolled something');
  assert(B.roll(() => 0.5) === null, 'an ordinary roll came up blessed');

  // Stat lifts on the built unit: +20% / +40% to HP/ATK/DEF, speed alone.
  const def = HEROES.coral;
  const mk = (blessing) => new Unit(def, TEAM.PLAYER, { level: 20, stars: def.rarity, blessing });
  const plain = mk(null), bl = mk('blessed'), gt = mk('godtouched');
  assert(bl.maxHp === Math.round(plain.maxHp * 1.2) &&
    bl.baseAtk === Math.round(plain.baseAtk * 1.2) &&
    bl.baseDef === Math.round(plain.baseDef * 1.2),
    `blessed stats off: ${bl.maxHp}/${bl.baseAtk}/${bl.baseDef} vs ${plain.maxHp}/${plain.baseAtk}/${plain.baseDef}`);
  assert(gt.maxHp === Math.round(plain.maxHp * 1.4) &&
    gt.baseAtk === Math.round(plain.baseAtk * 1.4) &&
    gt.baseDef === Math.round(plain.baseDef * 1.4), 'godtouched stats off');
  assert(bl.speed === plain.speed && gt.speed === plain.speed,
    'a blessing must not touch speed');

  // The summon pipeline stamps the roll on the copy.
  const w = loadGame();
  const realRoll = w.Blessing.roll;
  w.Blessing.roll = () => 'godtouched';
  const added = w.GameState.addHero(def.id);
  w.Blessing.roll = realRoll;
  assert(added && added.blessing === 'godtouched', 'addHero dropped the roll');
  assert(w.GameState.progressOf(added.uid).blessing === 'godtouched',
    'the roster entry lost its blessing');

  // Resurrection: the killing blow may not stick — once per battle.
  const u = mk(null);
  u.resurrectChance = 1;
  const dealt = u.takeDamage(u.maxHp + 999);
  assert(u.alive && u.resurrected && u.hp === Math.max(1, Math.round(u.maxHp * 0.30)),
    `resurrection left hp at ${u.hp} of ${u.maxHp}`);
  assert(dealt === u.maxHp + 999, 'the blow itself must still count as dealt');
  u.takeDamage(u.maxHp * 10);
  assert(!u.alive, 'a second resurrection went through');
});

// Damage-over-time STACKS. Every application lays its own plate, keeps
// its own tick and counts down its own fuse -- a second poison is a
// second poison, not a longer first one. The nameplate collapses
// identical plates into one icon with a count on it, so a stack of
// three still reads at a glance; the numbers underneath stay separate
// so that a deep burn is never overwritten by a shallow one and a
// caster is never quietly denied the damage they paid a turn for.
test('damage-over-time stacks: every application is its own plate', () => {
  const battle = new Battle();
  const burnerA = new Unit(HEROES.esmerelda, TEAM.PLAYER, { level: 30, stars: 3 });
  const burnerB = new Unit(HEROES.lucian, TEAM.PLAYER, { level: 30, stars: 3 });
  battle.placeUnit(burnerA, 0);
  battle.placeUnit(burnerB, 1);
  const foe = roomy(place(battle, DUMMIES.rat_archer, TEAM.ENEMY, 4), 800);
  foe.dodgeChance = () => 0; foe.reflectChance = () => 0;
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const fires = () => foe.statusEffects.filter((fx) => fx.kind === 'dot');
    // Priced off the victim's pool, so the tick is a predictable
    // fraction rather than a number that moves with the caster's gear.
    const lay = (caster, flavor, pct, turns) => Abilities.applyEffect(
      { type: 'dot', targetHpPct: pct, turns, flavor }, caster, foe, 1);

    // The same caster, the same flavour, twice: TWO plates.
    lay(burnerA, 'burn', 0.04, 3);
    lay(burnerA, 'burn', 0.04, 3);
    assert(fires().length === 2,
      `one caster's two burns left ${fires().length} plates, wanted 2`);

    // A shallower, shorter third does not overwrite either of them, and
    // does not get swallowed by them: it is its own fire.
    lay(burnerA, 'burn', 0.01, 1);
    const three = fires();
    assert(three.length === 3, `a third burn left ${three.length} plates`);
    const deep = three[0].amount;
    assert(three.filter((fx) => fx.amount === deep).length === 2 &&
      three.filter((fx) => fx.amount < deep).length === 1,
      `the ticks read ${three.map((fx) => fx.amount).join('/')} — a plate was merged`);
    const shortest = Math.min(...three.map((fx) => fx.turns));
    assert(three.filter((fx) => fx.turns === shortest).length === 1 &&
      shortest < Math.max(...three.map((fx) => fx.turns)),
      `the fuses read ${three.map((fx) => fx.turns).join('/')} — the short one was stretched`);

    // A DIFFERENT caster stacks too, and keeps its own credit.
    lay(burnerB, 'burn', 0.04, 3);
    assert(fires().length === 4, `a second caster left ${fires().length} plates`);
    assert(fires().some((fx) => fx.source === burnerB),
      'the second caster lost the credit for their own fire');

    // A different FLAVOUR is a separate thing on top of all of it.
    lay(burnerA, 'poison', 0.04, 3);
    assert(fires().filter((fx) => fx.flavor === 'poison').length === 1 &&
      fires().filter((fx) => fx.flavor === 'burn').length === 4,
      `the flavours read ${fires().map((fx) => fx.flavor).join('/')}`);

    // And the stack TICKS as a stack: four fires at 400 hurt roughly
    // four times what one at 400 does. Measured as a ratio, because the
    // DEF curve answers each tick separately and absolute numbers here
    // would be pinning the curve rather than the stacking.
    const bite = (n) => {
      const mark = roomy(place(battle, DUMMIES.rat_archer, TEAM.ENEMY, 3), 800);
      mark.dodgeChance = () => 0; mark.reflectChance = () => 0;
      for (let i = 0; i < n; i++) {
        mark.addStatusEffect({ kind: 'dot', amount: 20000, turns: 3,
          flavor: 'burn', source: burnerA });
      }
      const before = mark.hp;
      mark.startTurn(battle);
      battle.units = battle.units.filter((u) => u !== mark);
      return before - mark.hp;
    };
    const one = bite(1), four = bite(4);
    assert(one > 0 && four > one * 3.5,
      `one fire ticked ${one} and four ticked ${four} — the stack is not stacking`);
  } finally { Battle.active = prev; }
});

test('the Oilslick mark: burns tick double, direct hits gain nothing', () => {
  // The oil-on-hit engine channel: a landed hit slicks the victim for
  // 2 turns. (Set directly — nothing grants it party-wide any more.)
  const w = loadGame();
  const { HEROES: H, Abilities: A, Unit: U, TEAM: T, Elements: E } = w;
  const franz = new U(H.franz, T.PLAYER, { level: 30, stars: 4 });
  const vex = new U(H.vex, T.PLAYER, { level: 30, stars: 3 });
  const foe = new U(DUMMIES.rat_knight, T.ENEMY, { level: 30, stars: 3 });
  foe.hp = foe.maxHp = 10 ** 6;
  foe.hookSources = () => [];
  foe.dodgeChance = () => 0;
  franz.baseCritChance = -1;
  franz.synergyOilOnHit = 1; // certainty, for the assertion
  franz.dealt(500, foe);
  const oil = foe.statusEffects.find((fx) => fx.stat === 'oilslicked');
  assert(oil && oil.turns === 2, 'the hit left no oil');

  // Oiled: direct hits gain NOTHING (oil is a burn amplifier, not a
  // damage mark) — a fire hit lands at its plain value.
  const expect = (mult) => Math.round(A.damageFormula(
    franz.maxHp * 0.20 * E.mult('fire', foe.element) * mult,
    foe.effectiveStat('def')));
  franz.synergyOilOnHit = 0;
  let hp0 = foe.hp;
  A.execute(franz.abilities[0].def, franz, foe, null);
  assert(Math.abs((hp0 - foe.hp) - expect(1)) <= 1,
    `fire vs oil dealt ${hp0 - foe.hp}, expected ~${expect(1)}`);

  // What oil DOES buy: burns tick twice as hard while it holds. Same
  // burn, with and without the slick, must land 2:1.
  const burner = new U(H.esmerelda, T.PLAYER, { level: 30, stars: 3 });
  const tickWith = (oil) => {
    foe.hp = foe.maxHp;
    foe.statusEffects = [];
    if (oil) foe.addStatusEffect({ kind: 'debuff', stat: 'oilslicked', turns: 2, source: burner });
    foe.addStatusEffect({ kind: 'dot', amount: 500, turns: 2, flavor: 'burn', source: burner });
    foe.startTurn(null);
    return foe.maxHp - foe.hp;
  };
  const dry = tickWith(false);
  const oiledTick = tickWith(true);
  assert(dry > 0 && Math.abs(oiledTick - dry * 2) <= 2,
    `oiled burn ticked ${oiledTick} vs dry ${dry} — expected double`);
  assert(vex.element !== 'fire', 'sanity: vex still the non-fire control');
});

test("Esmerelda's kit: ribbon burns, gathering embers, moth to flame", () => {
  const w = loadGame();
  const { HEROES: H, Abilities: A, Unit: U, TEAM: T, Battle: B, Meter: M,
    Elements: E, POSITION: P } = w;
  M.resetBattle();
  const battle = new B();
  const esme = new U(H.esmerelda, T.PLAYER, { level: 30, stars: 3 });
  maxSkill(esme, 0, 2);   // the two burn gates, not the gathering
  const mate = new U(DUMMIES.rat_knight, T.PLAYER, { level: 30, stars: 3 });
  const foeA = new U(DUMMIES.rat_brawler, T.ENEMY, { level: 30, stars: 3 });
  const foeB = new U(DUMMIES.rat_archer, T.ENEMY, { level: 30, stars: 3 });
  battle.placeUnit(esme, battle.playerSlots.findIndex((s) => s.position === P.FRONT));
  battle.placeUnit(mate, battle.playerSlots.findIndex((s) => s.position === P.BACK));
  battle.placeUnit(foeA, battle.enemySlots.findIndex((s) => s.position === P.FRONT));
  battle.placeUnit(foeB, battle.enemySlots.findIndex((s) => s.position === P.BACK));
  for (const f of [foeA, foeB]) {
    f.hp = f.maxHp = 10 ** 6;
    f.hookSources = () => [];
    f.dodgeChance = () => 0;
  }
  esme.baseCritChance = -1;

  // Ribbon Lash: 110% plus a two-turn burn at 3% of the victim's pool.
  A.execute(esme.abilities[0].def, esme, foeA, battle);
  const burn = foeA.statusEffects.find((fx) => fx.kind === 'dot' && fx.flavor === 'burn');
  assert(burn && burn.turns === 2 && burn.amount === Math.round(foeA.maxHp * 0.03),
    `lash burn reads ${burn && burn.amount} for ${burn && burn.turns}`);

  // Trailing Flame reaches the BACK row and burns it too.
  A.execute(esme.abilities[2].def, esme, null, battle);
  assert(foeB.burning(), 'the arc missed the backline');
  assert(!foeB.statusEffects.some((fx) => fx.stat === 'oilslicked'),
    'sanity: nothing else stuck to the target');

  // Gathering Embers: 20% ATK per enemy DoT, paid to front-row allies.
  // Two burns tick on the field, so the heal is exactly 2 x 20% ATK.
  esme.hp = Math.round(esme.maxHp * 0.4);
  const hp0 = esme.hp;
  const mateHp0 = (mate.hp = Math.round(mate.maxHp * 0.5));
  A.execute(esme.abilities[1].def, esme, null, battle);
  const want = Math.round(esme.effectiveStat('atk') * 0.20 * 2);
  assert(esme.hp === hp0 + want,
    `front-row self heal read ${esme.hp - hp0}, expected ${want}`);
  assert(mate.hp === mateHp0, 'the back-row ally was healed by a front-row gather');

  // Moth to Flame: exactly 15% more into a burning target.
  const dmg = (foe) => {
    const h0 = foe.hp;
    A.execute(esme.abilities[0].def, esme, foe, battle);
    return h0 - foe.hp;
  };
  foeA.statusEffects = [];
  const cold = dmg(foeA);        // burn cleared: baseline hit (re-burns it)
  const hot = dmg(foeA);         // now burning: the moth returns
  assert(Math.abs(hot / cold - 1.15) < 0.02,
    `moth ratio ${(hot / cold).toFixed(3)}, expected ~1.15`);
});

test("Carl's kit: pole swings, Iron Appetite, and the strongman", () => {
  const w = loadGame();
  const { HEROES: H, Abilities: A, Unit: U, TEAM: T, Battle: B, Meter: M,
    Elements: E, POSITION: P } = w;
  M.resetBattle();
  const battle = new B();
  const carl = new U(H.carl, T.PLAYER, { level: 30, stars: 3 });
  const builtMax = carl.maxHp;
  const frontIdx = battle.playerSlots.findIndex((s) => s.position === P.FRONT);
  battle.placeUnit(carl, frontIdx);
  // Strongman: +15% max HP, applied once at placement on the front hex.
  assert(carl.maxHp === Math.round(builtMax * 1.15),
    `strongman read ${carl.maxHp} vs built ${builtMax}`);

  const foeFront = new U(DUMMIES.rat_knight, T.ENEMY, { level: 30, stars: 3 });
  const foeBack = new U(DUMMIES.rat_archer, T.ENEMY, { level: 30, stars: 3 });
  battle.placeUnit(foeFront, battle.enemySlots.findIndex((s) => s.position === P.FRONT));
  battle.placeUnit(foeBack, battle.enemySlots.findIndex((s) => s.position === P.BACK));
  for (const f of [foeFront, foeBack]) {
    f.hp = f.maxHp = 10 ** 6;
    f.hookSources = () => [];
    f.dodgeChance = () => 0;
  }
  carl.baseCritChance = -1;

  const exp = (mult, foe, extra = 1) => Math.round(A.damageFormula(
    carl.maxHp * mult * E.mult('fire', foe.element) * extra,
    foe.effectiveStat('def')));
  // Opening Act: exactly 15% of his (strongman-built) max HP through the pipeline.
  let hp0 = foeBack.hp;
  A.execute(carl.abilities[0].def, carl, foeBack, battle);
  assert(Math.abs((hp0 - foeBack.hp) - exp(0.15, foeBack)) <= 1,
    `Opening Act dealt ${hp0 - foeBack.hp}, expected ~${exp(0.15, foeBack)}`);
  // Main Event: a FRONT-row victim takes 50% more.
  hp0 = foeFront.hp;
  A.execute(carl.abilities[2].def, carl, foeFront, battle);
  assert(Math.abs((hp0 - foeFront.hp) - exp(0.25, foeFront, 1.5)) <= 1,
    `front-row Pole dealt ${hp0 - foeFront.hp}, expected ~${exp(0.25, foeFront, 1.5)}`);
  hp0 = foeBack.hp;
  A.execute(carl.abilities[2].def, carl, foeBack, battle);
  assert(Math.abs((hp0 - foeBack.hp) - exp(0.25, foeBack)) <= 1,
    `back-row Pole dealt ${hp0 - foeBack.hp}, expected ~${exp(0.25, foeBack)}`);

  // Iron Appetite: 10% of damage received becomes max HP, capped at
  // +50% of the pool as the first blow found it.
  const max0 = carl.maxHp;
  carl.takeDamage(1000);
  assert(carl.maxHp === max0 + 100,
    `1000 damage grew ${carl.maxHp - max0} max HP`);
  carl.hp = 10 ** 9; // survive the flood that proves the cap
  carl.takeDamage(10 ** 7);
  assert(carl.maxHp === max0 + Math.round(max0 * 0.5),
    `the appetite ran to ${carl.maxHp} vs cap ${max0 + Math.round(max0 * 0.5)}`);
});

test("Franz's kit: HP-scaled bonks, wounded fury, and the hearth's regen", () => {
  const w = loadGame();
  const { HEROES: H, Abilities: A, Unit: U, TEAM: T, Battle: B, Meter: M,
    Elements: E, POSITION: P } = w;
  M.resetBattle();
  const battle = new B();
  const franz = new U(H.franz, T.PLAYER, { level: 30, stars: 4 });
  const foe = new U(DUMMIES.rat_knight, T.ENEMY, { level: 30, stars: 3 });
  const frontIdx = battle.playerSlots.findIndex((s) => s.position === P.FRONT);
  battle.placeUnit(franz, frontIdx);
  battle.placeUnit(foe, 1);
  foe.hp = foe.maxHp = 10 ** 6;
  foe.hookSources = () => [];
  foe.dodgeChance = () => 0;
  franz.baseCritChance = -1; // no crits: the sums must be exact

  // Bonk deals exactly 20% of FRANZ's max HP, through the one damage
  // pipeline (element multiplier in, mitigated by the victim's DEF).
  const elem = E.mult('fire', foe.element);
  const expect = (mult, hpFrac) => Math.round(A.damageFormula(
    franz.maxHp * mult * (1 + 0.30 * (1 - hpFrac)) * elem,
    foe.effectiveStat('def')));
  let hp0 = foe.hp;
  A.execute(franz.abilities[0].def, franz, foe, battle);
  const atFull = hp0 - foe.hp;
  assert(Math.abs(atFull - expect(0.20, 1)) <= 1,
    `full-HP Bonk dealt ${atFull}, expected ~${expect(0.20, 1)}`);

  // Showman's Blood: the same swing grows with his missing health —
  // +15% at half, +30% on his last sliver.
  franz.hp = franz.maxHp / 2;
  hp0 = foe.hp;
  A.execute(franz.abilities[0].def, franz, foe, battle);
  const atHalf = hp0 - foe.hp;
  assert(Math.abs(atHalf - expect(0.20, 0.5)) <= 1,
    `half-HP Bonk dealt ${atHalf}, expected ~${expect(0.20, 0.5)}`);
  assert(atHalf > atFull, 'a wounded strongman must hit harder');
  franz.hp = 1;
  hp0 = foe.hp;
  A.execute(franz.abilities[0].def, franz, foe, battle);
  const atSliver = hp0 - foe.hp;
  assert(Math.abs(atSliver - expect(0.20, 1 / franz.maxHp)) <= 1,
    `sliver Bonk dealt ${atSliver}`);

  // Tent Collapse reaches the whole enemy team at 15%.
  const foeB = new U(DUMMIES.rat_archer, T.ENEMY, { level: 30, stars: 3 });
  battle.placeUnit(foeB, 5);
  foeB.hp = foeB.maxHp = 10 ** 6;
  foeB.hookSources = () => [];
  foeB.dodgeChance = () => 0;
  franz.hp = franz.maxHp;
  const a0 = foe.hp, b0 = foeB.hp;
  A.execute(franz.abilities[2].def, franz, null, battle);
  assert(a0 - foe.hp > 0 && b0 - foeB.hp > 0, 'the tent missed someone');
  const eB = Math.round(A.damageFormula(franz.maxHp * 0.15 *
    E.mult('fire', foeB.element), foeB.effectiveStat('def')));
  assert(Math.abs((b0 - foeB.hp) - eB) <= 1,
    `collapse dealt ${b0 - foeB.hp} to the back, expected ~${eB}`);

  // Hearthblood: on the front hex his turn opens with 5% max HP back;
  // parked elsewhere the hearth goes cold.
  franz.hp = Math.round(franz.maxHp * 0.5);
  let before = franz.hp;
  franz.startTurn(battle);
  assert(franz.hp === before + Math.round(franz.maxHp * 0.05),
    `front-hex regen read ${franz.hp - before}`);
  franz.slot = battle.playerSlots.find((s) => s.position === P.BACK);
  before = franz.hp;
  franz.startTurn(battle);
  assert(franz.hp === before, 'the hearth followed him off the front row');
});

test("Lucian's kit: the burn, the forge, the ricochet, and firelight", () => {
  const w = loadGame();
  const { HEROES: H, Abilities: A, Unit: U, TEAM: T, Battle: B, Meter: M } = w;
  M.resetBattle();
  const battle = new B();
  battle.autoMode = true;
  const lucian = new U(H.lucian, T.PLAYER, { level: 30, stars: 5 });
  const foeA = new U(DUMMIES.rat_knight, T.ENEMY, { level: 30, stars: 3 });
  const foeB = new U(DUMMIES.rat_archer, T.ENEMY, { level: 30, stars: 3 });
  battle.placeUnit(lucian, 5);
  battle.placeUnit(foeA, 1);
  battle.placeUnit(foeB, 4);
  for (const f of [foeA, foeB]) {
    f.hp = f.maxHp = 10 ** 6;
    f.hookSources = () => [];
    f.dodgeChance = () => 0;
  }

  // Cinder Lash: damage plus a burn ticking exactly 3% of the VICTIM's
  // max HP (rats carry no resistance, so the land roll is certain).
  // The burn also rolls the 50% application gate now, so the skill is
  // maxed -- at which point it is certain again.
  lucian.abilities[0].level = Progression.skillCap(lucian.abilities[0].def, 0);
  A.execute(lucian.abilities[0].def, lucian, foeA, battle);
  const burn = foeA.statusEffects.find((fx) => fx.kind === 'dot' && fx.flavor === 'burn');
  assert(burn, 'the burn failed to land');
  assert(burn.amount === Math.round(foeA.maxHp * 0.03) && burn.turns === 3,
    `burn reads ${burn && burn.amount} for ${burn && burn.turns} turns`);
  assert(foeA.burning() && !foeB.burning(), 'burning() misreads the field');

  // Stoke the Forge: +50 flat ATK per burning enemy, banked to 1000.
  const atk0 = lucian.baseAtk;
  A.execute(lucian.abilities[1].def, lucian, lucian, battle);
  assert(lucian.baseAtk === atk0 + 50 && lucian.forgeBanked === 50,
    `one fire banked ${lucian.forgeBanked}`);
  lucian.forgeBanked = 990;
  A.execute(lucian.abilities[1].def, lucian, lucian, battle);
  assert(lucian.baseAtk === atk0 + 60 && lucian.forgeBanked === 1000,
    'the cap leaked');
  A.execute(lucian.abilities[1].def, lucian, lucian, battle);
  assert(lucian.baseAtk === atk0 + 60, 'a full forge kept gaining');

  // By Firelight: his turn opens at +30% ATK while anything burns, and
  // cold once the fires are out.
  const before = lucian.effectiveStat('atk');
  lucian.startTurn(battle);
  assert(Math.abs(lucian.effectiveStat('atk') - before * 1.3) < 1.5,
    `firelight read ${lucian.effectiveStat('atk')} vs base ${before}`);
  lucian.statusEffects = [];
  foeA.statusEffects = [];
  lucian.startTurn(battle);
  assert(lucian.effectiveStat('atk') === before, 'the buff outlived the fires');

  // Wildfire Arc: chance 1 ricochets to the runaway guard (30 hits),
  // chance 0 stops at one — and with a single enemy standing, every
  // bounce lands back in them.
  const always = A.applyEffect({ type: 'bounce', mult: 1.25, chance: 1 },
    lucian, foeA, 1);
  assert(Array.isArray(always) && always.length === 30,
    `chance-1 bounced ${always.length} times`);
  const once = A.applyEffect({ type: 'bounce', mult: 1.25, chance: 0 },
    lucian, foeA, 1);
  assert(once.length === 1, `chance-0 bounced ${once.length} times`);
  foeB.hp = 0;
  const solo = A.applyEffect({ type: 'bounce', mult: 1.25, chance: 1 },
    lucian, foeA, 1);
  assert(solo.length === 30 && solo.every((r) => r.target === foeA),
    'a lone enemy escaped the ricochet');
});

test("Eli's sigils drain meters and the Quickening grants a real extra turn", () => {
  const w = loadGame();
  const { HEROES: H, Abilities: A, Unit: U, TEAM: T, Battle: B, Meter: M, CONFIG: C } = w;
  w.seed(7);
  M.resetBattle();
  const battle = new B();
  battle.autoMode = true;
  const eli = new U(H.eli, T.PLAYER, { level: 30, stars: 3 });
  const foe = new U(DUMMIES.rat_knight, T.ENEMY, { level: 30, stars: 3 });
  battle.placeUnit(eli, 5);
  battle.placeUnit(foe, 1);
  foe.hp = foe.maxHp = 10 ** 9;
  foe.hookSources = () => []; foe.dodgeChance = () => 0;

  // Sigil Bolt cuts the victim's meter by 20% of max. The bolt's drain is
  // gated at 50%, so max the ladder — its chance rungs carry it to certain.
  maxSkill(eli, 0);
  foe.turnMeter = 800;
  A.execute(eli.abilities[0].def, eli, foe, battle);
  assert(foe.turnMeter === 800 - C.TURN_METER_MAX * 0.2,
    `expected a 20% meter cut, meter at ${foe.turnMeter}`);

  // Quickening Sigil: buffs land, and afterAction refills his meter for
  // an immediate second turn instead of rolling the dice.
  const quick = eli.abilities.find((a) => a.def.id === 'eli_quickening_sigil');
  battle.activeUnit = eli;
  A.execute(quick.def, eli, eli, battle);
  battle.afterAction(eli, quick);
  assert(eli.turnMeter === C.TURN_METER_MAX,
    `the sigil should refill the meter outright, at ${eli.turnMeter}`);
  assert(eli.statusEffects.some((fx) => fx.stat === 'speed' && fx.mult === 1.3) &&
    eli.statusEffects.some((fx) => fx.stat === 'critChance' && fx.add === 0.25),
    'the sigil buffs did not land');
  // An ordinary ability grants no such refill.
  battle.activeUnit = eli;
  battle.afterAction(eli, eli.abilities[0]);
  assert(eli.turnMeter < C.TURN_METER_MAX, 'a plain bolt also refilled the meter');
  w.unseed();
});

test('substats follow the rulebook: counts by rarity, ranges by stat', () => {
  const w = loadGame();
  const G = w.Gear;
  w.seed(42);
  const RANGES = {
    spdFlat: [4, 7], critChance: [0.04, 0.07],
    atkFlat: [8, 14], defFlat: [8, 14], hpFlat: [100, 180],
    atkPct: [0.06, 0.09], defPct: [0.06, 0.09], hpPct: [0.06, 0.09],
    accuracy: [0.06, 0.09], critDamage: [0.06, 0.09],
  };
  const COUNT = { normal: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
  for (let i = 0; i < 300; i++) {
    const p = G.drop('dragon', 1 + (i % 20));
    assert(p.subs.length === COUNT[p.rarity],
      `${p.rarity} dropped ${p.subs.length} base subs`);
    const seen = new Set();
    for (const s of p.subs) {
      assert(!seen.has(s.stat), `${p.rarity}: base rolls duplicated ${s.stat}`);
      seen.add(s.stat);
      const r = RANGES[s.stat];
      assert(r, `rolled a stat off the rulebook: ${s.stat}`);
      assert(s.value >= r[0] - 1e-9 && s.value <= r[1] + 1e-9,
        `${s.stat} rolled ${s.value}, range ${r}`);
      // Whole steps only: integers for flats, whole points for percents.
      const snapped = r[1] < 1 ? Math.round(s.value * 100) / 100 : Math.round(s.value);
      assert(Math.abs(snapped - s.value) < 1e-9, `${s.stat} rolled a ragged ${s.value}`);
    }
  }
  // Enchanting: every third level boosts one EXISTING substat with
  // another roll from its own range — the line count never grows, the
  // boosted line's value does, and it books one arrow per milestone.
  const p = G.drop('dragon', 20);
  p.rarity = 'legendary';
  while (p.subs.length < 5) G.rollSub(p);
  const baseValues = p.subs.map((s) => s.value);
  for (let plus = 1; plus <= 15; plus++) {
    const msg = G.applyEnchant(p);
    assert(p.subs.length === 5, `+${plus} changed the line count to ${p.subs.length}`);
    if (plus % 3 === 0) assert(msg, `milestone +${plus} rolled nothing`);
    else assert(!msg, `+${plus} is no milestone yet it rolled`);
  }
  const boosts = p.subs.reduce((n, s) => n + (s.boosts || 0), 0);
  assert(boosts === 5, `a +15 piece should carry 5 boosts, has ${boosts}`);
  p.subs.forEach((s, i) => {
    const r = RANGES[s.stat];
    const grew = s.value - baseValues[i];
    if (!s.boosts) {
      assert(Math.abs(grew) < 1e-9, `${s.stat} moved without a boost`);
      return;
    }
    // Each boost adds one whole roll from the stat's own range.
    assert(grew >= s.boosts * r[0] - 1e-9 && grew <= s.boosts * r[1] + 1e-9,
      `${s.stat} grew ${grew} over ${s.boosts} boosts, range ${r}`);
  });
  w.unseed();
});

test('dungeons take three challenges a day, per dungeon, reset daily', () => {
  const w = loadGame();
  const G = w.GameState;
  const id = 'dungeon_whetstone';
  assert(G.dungeonRunsLeft(id) === 3, 'a fresh day should hold three challenges');
  assert(G.useDungeonRun(id) && G.useDungeonRun(id), 'early challenges refused');
  assert(G.dungeonRunsLeft(id) === 1, `expected one left, got ${G.dungeonRunsLeft(id)}`);
  // Each dungeon keeps its own ledger.
  assert(G.dungeonRunsLeft('dungeon_xp') === 3, 'spending one gate drained another');
  // The Glitterhoard opens exactly once a day.
  assert(G.dungeonRunsLeft('dungeon_diamond') === 1, 'the hoard should offer one challenge');
  assert(G.useDungeonRun('dungeon_diamond'), "the hoard's one challenge was refused");
  assert(!G.useDungeonRun('dungeon_diamond'), 'the hoard took a second challenge');
  assert(G.useDungeonRun(id), 'the third challenge was refused');
  assert(!G.useDungeonRun(id), 'a fourth challenge slipped through');

  // The ledger survives the save round-trip...
  const raw = w.savedState();
  assert(raw.dungeonRuns && raw.dungeonRuns.counts[id] === 3, 'ledger not persisted');
  // ...and a save from an earlier day starts the count fresh.
  raw.dungeonRuns.day = '2000-01-01';
  const G2 = loadGame({ save: raw }).GameState;
  assert(G2.dungeonRunsLeft(id) === 3, "yesterday's spent challenges carried over");
});

test("Slick's kit: splash zones, fresh coats, and the backsplash", () => {
  const w = loadGame();
  const { HEROES: H, Abilities: A, Unit: U, TEAM: T, Battle: B, Meter: M,
    POSITION: P } = w;
  M.resetBattle();
  const battle = new B();
  const slick = new U(H.slick, T.PLAYER, { level: 30, stars: 3 });
  maxSkill(slick, 0, 2);  // the two oil gates, not the self-buff
  const foeFront = new U(DUMMIES.rat_knight, T.ENEMY, { level: 30, stars: 3 });
  const foeBack = new U(DUMMIES.rat_archer, T.ENEMY, { level: 30, stars: 3 });
  const centerIdx = battle.playerSlots.findIndex((s) => s.position === P.CENTER);
  battle.placeUnit(slick, centerIdx);
  battle.placeUnit(foeFront, battle.enemySlots.findIndex((s) => s.position === P.FRONT));
  battle.placeUnit(foeBack, battle.enemySlots.findIndex((s) => s.position === P.BACK));
  for (const f of [foeFront, foeBack]) {
    f.hookSources = () => [];
    f.dodgeChance = () => 0;
  }

  // Center Ring: +20% debuff accuracy from the center hex, on top of the
  // 15 everybody starts with.
  assert(Math.abs(slick.debuffAccuracy() - (Unit.BASE_ACCURACY + 0.20)) < 1e-9,
    `center accuracy read ${slick.debuffAccuracy()}`);

  const oilOn = (u) => u.statusEffects.find((fx) => fx.stat === 'oilslicked');

  // Splash Zone: the front row is oiled for 3 turns, the back row is dry.
  A.execute(slick.abilities[0].def, slick, null, battle);
  assert(oilOn(foeFront) && oilOn(foeFront).turns === 3,
    'the front row stayed dry');
  assert(!oilOn(foeBack), 'the splash reached a row it should not');

  // The Big Spill: everyone is oiled.
  foeFront.statusEffects = [];
  A.execute(slick.abilities[2].def, slick, null, battle);
  assert(oilOn(foeFront) && oilOn(foeBack) && oilOn(foeBack).turns === 3,
    'the barrel missed somebody');

  // Fresh Coat: +30% SPD and +30% debuff accuracy, on top of the hex.
  const spd0 = slick.effectiveStat('speed');
  A.execute(slick.abilities[1].def, slick, slick, battle);
  assert(slick.effectiveStat('speed') === Math.round(spd0 * 1.30),
    `coated speed read ${slick.effectiveStat('speed')} from ${spd0}`);
  assert(Math.abs(slick.debuffAccuracy() - (Unit.BASE_ACCURACY + 0.50)) < 1e-9,
    `coated accuracy read ${slick.debuffAccuracy()}`);

  // Backsplash: an enemy who strikes the barrel wears the barrel.
  foeFront.statusEffects = [];
  const prevActive = B.active;
  B.active = battle;
  try {
    slick.struck(100, foeFront);
  } finally {
    B.active = prevActive;
  }
  assert(oilOn(foeFront) && oilOn(foeFront).turns === 2,
    'the attacker came away clean');
});

test("Samuels's kit: triple strikes, crit riders, and the center toss", () => {
  const w = loadGame();
  const { HEROES: H, Abilities: A, Unit: U, TEAM: T, Battle: B, Meter: M,
    Elements: E, POSITION: P } = w;
  M.resetBattle();
  const battle = new B();
  const sam = new U(H.samuels, T.PLAYER, { level: 30, stars: 3 });
  const foeFront = new U(DUMMIES.rat_knight, T.ENEMY, { level: 30, stars: 3 });
  const foeCenter = new U(DUMMIES.rat_brawler, T.ENEMY, { level: 30, stars: 3 });
  battle.placeUnit(sam, battle.playerSlots.findIndex((s) => s.position === P.FRONT));
  battle.placeUnit(foeFront, battle.enemySlots.findIndex((s) => s.position === P.FRONT));
  battle.placeUnit(foeCenter, battle.enemySlots.findIndex((s) => s.position === P.CENTER));
  for (const f of [foeFront, foeCenter]) {
    f.hp = f.maxHp = 10 ** 6;
    f.hookSources = () => [];
    f.dodgeChance = () => 0;
  }
  sam.baseCritChance = -1; // clamps to 0: only the knives' riders crit

  // Knife's Edge: +30% crit damage, flat, from the front hex.
  assert(Math.abs(sam.effectiveStat('critDamage') - 1.8) < 1e-9,
    `edge read ${sam.effectiveStat('critDamage')}`);

  const Math2 = w.Math;
  const realRandom = Math2.random;
  const hit = (ability, foe) => {
    const hp0 = foe.hp;
    A.execute(ability.def, sam, foe, battle);
    return hp0 - foe.hp;
  };
  try {
    // No crits (0.99 clears every rider): Stab, Stab, Stab is exactly
    // three 35% knives, each carrying the full-HP +30% passive.
    Math2.random = () => 0.99;
    const raw = (mult) => sam.effectiveStat('atk') * mult * 1.30 *
      E.mult('fire', foeFront.element);
    const one = Math.round(A.damageFormula(raw(0.35), foeFront.effectiveStat('def')));
    assert(hit(sam.abilities[0], foeFront) === 3 * one,
      'three knives did not sum to three knives');

    // Rider proof: at 0.10 the 15% rider crits every knife (0.10 < 0.15)
    // while a riderless blade cannot crit at all.
    Math2.random = () => 0.10;
    const critOne = Math.round(one * 1.8);
    assert(hit(sam.abilities[0], foeFront) === 3 * critOne,
      'the crit rider did not fire');
    const thrown = Math.round(A.damageFormula(raw(0.40), foeFront.effectiveStat('def')));
    assert(hit(sam.abilities[1], foeFront) === 3 * thrown,
      'a riderless blade crit anyway');

    // Aim for the Middle: the center tile eats double from every blade.
    const thrownC = Math.round(A.damageFormula(
      raw(0.40) * 2 * E.mult('fire', foeCenter.element) /
      E.mult('fire', foeFront.element),
      foeCenter.effectiveStat('def')));
    assert(hit(sam.abilities[1], foeCenter) === 3 * thrownC,
      'the center toss did not double');

    // Not a Scratch: one scratch and the +30% is gone.
    Math2.random = () => 0.99;
    sam.hp -= 1;
    const oneHurt = Math.round(A.damageFormula(
      sam.effectiveStat('atk') * 0.35 * E.mult('fire', foeFront.element),
      foeFront.effectiveStat('def')));
    assert(hit(sam.abilities[0], foeFront) === 3 * oneHurt,
      'the passive survived a scratch');
  } finally {
    Math2.random = realRandom;
  }
});

test("Lin's kit: the taunt, the double burn, and the Ball Barricade", () => {
  const w = loadGame();
  const { HEROES: H, Abilities: A, Unit: U, TEAM: T, Battle: B, Meter: M,
    POSITION: P } = w;
  M.resetBattle();
  const battle = new B();
  const lin = new U(H.lin, T.PLAYER, { level: 30, stars: 4 });
  maxSkill(lin, 0);       // the taunt gate only
  const mate = new U(DUMMIES.rat_knight, T.PLAYER, { level: 30, stars: 3 });
  const backMate = new U(DUMMIES.rat_archer, T.PLAYER, { level: 30, stars: 3 });
  const foeFront = new U(DUMMIES.rat_brawler, T.ENEMY, { level: 30, stars: 3 });
  const foeBack = new U(DUMMIES.rat_archer, T.ENEMY, { level: 30, stars: 3 });
  battle.placeUnit(lin, battle.playerSlots.findIndex((s) => s.position === P.FRONT));
  battle.placeUnit(mate, battle.playerSlots.findIndex((s, i) =>
    s.position === P.FRONT && !battle.playerSlots[i].unit));
  battle.placeUnit(backMate, battle.playerSlots.findIndex((s) => s.position === P.BACK));
  battle.placeUnit(foeFront, battle.enemySlots.findIndex((s) => s.position === P.FRONT));
  battle.placeUnit(foeBack, battle.enemySlots.findIndex((s) => s.position === P.BACK));
  for (const u of [mate, backMate, foeFront, foeBack]) {
    u.hp = u.maxHp = 10 ** 6;
    u.hookSources = () => [];
    u.dodgeChance = () => 0;
  }
  lin.baseCritChance = -1;
  lin.gearDodge = 0;

  // Center of Attention marks the BACK row, not the front.
  A.execute(lin.abilities[0].def, lin, null, battle);
  const taunt = foeBack.statusEffects.find((fx) => fx.stat === 'taunted');
  assert(taunt && taunt.turns === 2 && taunt.source === lin,
    'the back row was not drawn out');
  assert(!foeFront.statusEffects.some((fx) => fx.stat === 'taunted'),
    'the taunt spilled onto the front row');

  // The taunted victim's turn: basic skill, thrown at Lin, nothing else.
  const calls = [];
  const realPerform = battle.performAbility;
  battle.performAbility = (u, a, t) => calls.push({ u, a, t });
  battle.autoAct(foeBack);
  battle.performAbility = realPerform;
  assert(calls.length === 1 && calls[0].a === foeBack.abilities[0] &&
    calls[0].t === lin, 'the taunt did not command the turn');

  // Blazing Ball: TWO separate burns on each front-row enemy. Maxed,
  // because each burn rolls its own 50% application gate now -- and the
  // expected tick is read off the ladder rather than hard-coded, since
  // the same max that guarantees the burns also deepens them.
  maxSkill(lin, 1);
  const ballDef = lin.abilities[1].def;
  const ballLad = Progression.skillLadder(ballDef, Progression.skillCap(ballDef, 1));
  const tick = Math.round(foeFront.maxHp *
    (ballDef.effects[0].targetHpPct + (ballLad.debuffPower || 0)));
  A.execute(ballDef, lin, null, battle);
  const burns = foeFront.statusEffects.filter(
    (fx) => fx.kind === 'dot' && fx.flavor === 'burn');
  assert(burns.length === 2 && burns.every((fx) => fx.amount === tick),
    `the ball rolled ${burns.length} burns at ${burns.map((f) => f.amount)}, wanted 2 x ${tick}`);
  assert(!foeBack.statusEffects.some((fx) => fx.kind === 'dot'),
    'the ball reached the back row');

  // Ball Barricade: Lin absorbs a front-row ally's hit at 25% off...
  A.execute(lin.abilities[2].def, lin, lin, battle);
  assert(lin.statusEffects.some((fx) => fx.stat === 'blocker'), 'no stance');
  B.active = battle;
  try {
    const raw = 5000;
    const linHp0 = lin.hp;
    const mateHp0 = mate.hp;
    A.strike(foeFront, mate, raw);
    assert(mate.hp === mateHp0, 'the guarded ally was still hit');
    // The redirected hit still rides Lin's own defences: foeFront is
    // burning from Blazing Ball, so Used to the Heat shaves 15% more.
    const expect = Math.round(
      Math.round(A.damageFormula(raw * 0.75, lin.effectiveStat('def'))) * 0.85);
    assert(linHp0 - lin.hp === expect,
      `the guard took ${linHp0 - lin.hp}, expected ${expect}`);
    // ...but not a BACK-row ally's, and never a DoT tick.
    const backHp0 = backMate.hp;
    A.strike(foeFront, backMate, raw);
    assert(backMate.hp < backHp0, 'the barricade covered the back row');
    const mateHp1 = mate.hp;
    A.strike(foeFront, mate, raw, { redirect: false });
    assert(mate.hp < mateHp1, 'a non-redirectable hit was redirected');
  } finally {
    B.active = null;
  }

  // Used to the Heat + Limelight: 15% less from burning attackers, 15%
  // less from taunted ones, stacking multiplicatively from the front hex.
  lin.statusEffects = [];
  assert(Math.abs(lin.damageTakenMult(foeFront) - 0.85) < 1e-9,
    'a burning attacker hit full-weight');
  assert(Math.abs(lin.damageTakenMult(foeBack) - 0.85) < 1e-9,
    'a taunted attacker hit full-weight');
  foeBack.addStatusEffect({ kind: 'dot', amount: 1, turns: 2, flavor: 'burn', source: lin });
  assert(Math.abs(lin.damageTakenMult(foeBack) - 0.85 * 0.85) < 1e-9,
    'burning + taunted did not stack');
});

test("Koe's kit: the remedy, the rope, the wall, and the silent alarm", () => {
  const w = loadGame();
  const { HEROES: H, Abilities: A, Unit: U, TEAM: T, Battle: B, Meter: M,
    POSITION: P, CONFIG: C } = w;
  M.resetBattle();
  const battle = new B();
  const koe = new U(H.koe, T.PLAYER, { level: 30, stars: 4 });
  const mate = roomy(new U(DUMMIES.rat_knight, T.PLAYER, { level: 30, stars: 3 }));
  const backMate = new U(DUMMIES.rat_archer, T.PLAYER, { level: 30, stars: 3 });
  const foe = new U(DUMMIES.rat_brawler, T.ENEMY, { level: 30, stars: 3 });
  battle.placeUnit(koe, battle.playerSlots.findIndex((s) => s.position === P.BACK));
  battle.placeUnit(mate, battle.playerSlots.findIndex((s) => s.position === P.FRONT));
  battle.placeUnit(backMate, battle.playerSlots.findIndex((s, i) =>
    s.position === P.BACK && !battle.playerSlots[i].unit));
  battle.placeUnit(foe, battle.enemySlots.findIndex((s) => s.position === P.FRONT));
  for (const u of [mate, backMate, foe]) {
    u.hookSources = () => [];
    u.dodgeChance = () => 0;
  }
  foe.hp = foe.maxHp = 10 ** 6;

  // Vanishing Act: +15% dodge from the back hex.
  assert(Math.abs(koe.dodgeChance() - 0.15) < 1e-9,
    `the mime dodges at ${koe.dodgeChance()}`);

  // Something From Nothing: 15% of the ALLY's pool, and exactly two
  // debuffs lifted — oldest first, the third stays.
  mate.hp = Math.round(mate.maxHp * 0.4);
  mate.addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.75, turns: 2 });
  mate.addStatusEffect({ kind: 'debuff', stat: 'def', mult: 0.75, turns: 2 });
  mate.addStatusEffect({ kind: 'dot', amount: 50, turns: 2, flavor: 'burn', source: foe });
  const hp0 = mate.hp;
  A.execute(koe.abilities[0].def, koe, mate, battle);
  assert(mate.hp - hp0 === Math.round(mate.maxHp * 0.15),
    `the remedy restored ${mate.hp - hp0}`);
  const left = mate.statusEffects.filter(
    (fx) => fx.kind === 'debuff' || fx.kind === 'dot');
  assert(left.length === 1 && left[0].kind === 'dot',
    'the cleanse did not lift exactly two');

  // Pull the Rope: the FRONT line only — speed up, meter up.
  mate.statusEffects = [];
  mate.turnMeter = 0;
  backMate.turnMeter = 0;
  const spd0 = mate.effectiveStat('speed');
  A.execute(koe.abilities[1].def, koe, null, battle);
  assert(mate.effectiveStat('speed') === Math.round(spd0 * 1.30),
    'the rope did not quicken the line');
  assert(mate.turnMeter === 0.20 * C.TURN_METER_MAX,
    `the rope pulled ${mate.turnMeter} meter`);
  assert(backMate.turnMeter === 0 &&
    !backMate.statusEffects.some((fx) => fx.stat === 'speed'),
    'the rope reached the back row');

  // The Invisible Wall: a Bubble that eats one WHOLE hit.
  A.execute(koe.abilities[2].def, koe, null, battle);
  assert(mate.statusEffects.some((fx) => fx.kind === 'bubble'), 'no wall');
  mate.hp = mate.maxHp;
  const res = A.strike(foe, mate, 5000);
  assert(res.amount === 0 && res.bubbled && mate.hp === mate.maxHp,
    'the wall let the hit through');
  assert(!mate.statusEffects.some((fx) => fx.kind === 'bubble'),
    'the wall survived the hit it ate');

  // Silent Alarm: a BURNING attacker's blow is answered with the remedy;
  // a clean attacker's is not.
  B.active = battle;
  try {
    mate.hp = Math.round(mate.maxHp * 0.4);
    let before = mate.hp;
    let dealt = A.strike(foe, mate, 1000).amount;
    assert(mate.hp === before - dealt, 'the alarm rang for a clean attacker');
    foe.addStatusEffect({ kind: 'dot', amount: 50, turns: 3, flavor: 'burn', source: koe });
    before = mate.hp;
    dealt = A.strike(foe, mate, 1000).amount;
    assert(mate.hp === before - dealt + Math.round(mate.maxHp * 0.15),
      `the alarm paid ${mate.hp - before + dealt}`);
  } finally {
    B.active = null;
  }
});

test("Cleo's kit: triage by the ball, stolen luck, and reading the flames", () => {
  const w = loadGame();
  const { HEROES: H, Abilities: A, Unit: U, TEAM: T, Battle: B, Meter: M,
    POSITION: P } = w;
  M.resetBattle();
  const battle = new B();
  const cleo = new U(H.cleo, T.PLAYER, { level: 30, stars: 5 });
  const hurt = new U(DUMMIES.rat_knight, T.PLAYER, { level: 30, stars: 3 });
  const hurtier = new U(DUMMIES.rat_warrior, T.PLAYER, { level: 30, stars: 3 });
  const foeA = new U(DUMMIES.rat_brawler, T.ENEMY, { level: 30, stars: 3 });
  const foeB = new U(DUMMIES.rat_archer, T.ENEMY, { level: 30, stars: 3 });
  battle.placeUnit(cleo, battle.playerSlots.findIndex((s) => s.position === P.BACK));
  battle.placeUnit(hurt, battle.playerSlots.findIndex((s) => s.position === P.FRONT));
  battle.placeUnit(hurtier, battle.playerSlots.findIndex((s, i) =>
    s.position === P.FRONT && !battle.playerSlots[i].unit));
  battle.placeUnit(foeA, battle.enemySlots.findIndex((s) => s.position === P.FRONT));
  battle.placeUnit(foeB, battle.enemySlots.findIndex((s) => s.position === P.BACK));
  for (const u of [hurt, hurtier, foeA, foeB]) {
    u.hookSources = () => [];
    u.dodgeChance = () => 0;
  }

  // A Kind Fortune: no chosen target — the ball finds the lowest bar.
  hurt.hp = Math.round(hurt.maxHp * 0.5);
  hurtier.hp = Math.round(hurtier.maxHp * 0.2);
  const h0 = hurtier.hp;
  const other0 = hurt.hp;
  A.execute(cleo.abilities[0].def, cleo, null, battle);
  assert(hurtier.hp - h0 === Math.round(hurtier.maxHp * 0.20),
    `the ball paid ${hurtier.hp - h0}`);
  assert(hurt.hp === other0, 'the single reading healed a second ally');

  // Twin Fates: the TWO lowest healed 25% each, one debuff lifted each,
  // and full-HP Cleo (third wheel) left out of the reading.
  hurt.hp = Math.round(hurt.maxHp * 0.3);
  hurtier.hp = Math.round(hurtier.maxHp * 0.3);
  for (const u of [hurt, hurtier]) {
    u.addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.75, turns: 2 });
    u.addStatusEffect({ kind: 'debuff', stat: 'def', mult: 0.75, turns: 2 });
  }
  const a0 = hurt.hp, b0 = hurtier.hp, cleo0 = cleo.hp;
  A.execute(cleo.abilities[1].def, cleo, null, battle);
  assert(hurt.hp - a0 === Math.round(hurt.maxHp * 0.25) &&
    hurtier.hp - b0 === Math.round(hurtier.maxHp * 0.25),
    'the twin reading paid wrong');
  assert(cleo.hp === cleo0, 'the reader read herself');
  assert(hurt.statusEffects.filter((fx) => fx.kind === 'debuff').length === 1 &&
    hurtier.statusEffects.filter((fx) => fx.kind === 'debuff').length === 1,
    'each fate should lift exactly one debuff');

  // Fortunes Reversed: one buff torn from EVERY enemy, oldest first; an
  // unbuffed enemy is no error. Cruel Fortune (back hex): at 0.1 the
  // 20% roll replaces the torn buff with a 3%-pool 2-turn burn.
  foeA.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.25, turns: 3 });
  foeA.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.25, turns: 3 });
  // The strip is gated at 50%. Level 4 buys all three chance rungs (a
  // certain strip) without reaching the stripCount rungs above them, so
  // the tear stays at one buff.
  cleo.abilities[2].level = 4;
  const Math2 = w.Math;
  const realRandom = Math2.random;
  try {
    Math2.random = () => 0.1;
    A.execute(cleo.abilities[2].def, cleo, null, battle);
    const buffs = foeA.statusEffects.filter((fx) => fx.kind === 'buff');
    assert(buffs.length === 1 && buffs[0].stat === 'def',
      'the strip should take the oldest buff only');
    const burn = foeA.statusEffects.find((fx) => fx.kind === 'dot' && fx.flavor === 'burn');
    assert(burn && burn.turns === 2 && burn.amount === Math.round(foeA.maxHp * 0.03),
      'cruel fortune did not light the torn blessing');
    assert(!foeB.statusEffects.some((fx) => fx.kind === 'dot'),
      'an unbuffed enemy had nothing to strip, so nothing to burn');
    // At 0.9 the roll fails: strip lands, no burn follows.
    foeA.statusEffects = [];
    foeA.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.25, turns: 3 });
    Math2.random = () => 0.9;
    A.execute(cleo.abilities[2].def, cleo, null, battle);
    assert(!foeA.statusEffects.some((fx) => fx.kind === 'buff') &&
      !foeA.statusEffects.some((fx) => fx.kind === 'dot'),
      'a failed roll still burned');
  } finally {
    Math2.random = realRandom;
  }

  // Read the Flames: every burn tick on an enemy pays the lowest ally
  // 5% of their pool.
  B.active = battle;
  try {
    foeA.statusEffects = [];
    foeA.hp = foeA.maxHp = 10 ** 6;
    foeA.addStatusEffect({ kind: 'dot', amount: 100, turns: 2, flavor: 'burn', source: cleo });
    hurtier.hp = Math.round(hurtier.maxHp * 0.2);
    const low0 = hurtier.hp;
    foeA.startTurn(battle);
    assert(hurtier.hp - low0 === Math.round(hurtier.maxHp * 0.05),
      `the flames paid ${hurtier.hp - low0}`);
  } finally {
    B.active = null;
  }
});

test("Artur's kit: annotations, the page turn, and permanent ink", () => {
  const w = loadGame();
  const { HEROES: H, Abilities: A, Unit: U, TEAM: T, Battle: B, Meter: M,
    POSITION: P, CONFIG: C } = w;
  M.resetBattle();
  const battle = new B();
  const artur = new U(H.artur, T.PLAYER, { level: 30, stars: 3 });
  const mate = new U(DUMMIES.rat_knight, T.PLAYER, { level: 30, stars: 3 });
  const foe = new U(DUMMIES.rat_brawler, T.ENEMY, { level: 30, stars: 3 });
  battle.placeUnit(artur, battle.playerSlots.findIndex((s) => s.position === P.BACK));
  battle.placeUnit(mate, battle.playerSlots.findIndex((s) => s.position === P.FRONT));
  battle.placeUnit(foe, battle.enemySlots.findIndex((s) => s.position === P.FRONT));
  mate.hookSources = () => [];

  // Shorthand: +15 flat SPD from the back hex.
  const bare = new U(H.artur, T.PLAYER, { level: 30, stars: 3 });
  assert(artur.effectiveStat('speed') === bare.effectiveStat('speed') + 15,
    `shorthand read ${artur.effectiveStat('speed')} vs ${bare.effectiveStat('speed')}`);

  // Margin Note: +30% crit chance for 2 turns and 30% meter, at once.
  const cc0 = mate.effectiveStat('critChance');
  mate.turnMeter = 0;
  A.execute(artur.abilities[0].def, artur, mate, battle);
  assert(Math.abs(mate.effectiveStat('critChance') - (cc0 + 0.30)) < 1e-9,
    'the margin note did not sharpen the crit');
  assert(mate.turnMeter === 0.30 * C.TURN_METER_MAX, 'the note paid no meter');

  // Illuminated Letter: +60% crit damage for 2 turns and 30% meter.
  const cd0 = mate.effectiveStat('critDamage');
  mate.turnMeter = 0;
  A.execute(artur.abilities[1].def, artur, mate, battle);
  assert(Math.abs(mate.effectiveStat('critDamage') - (cd0 + 0.60)) < 1e-9,
    'the gold leaf did not take');
  assert(mate.turnMeter === 0.30 * C.TURN_METER_MAX, 'the letter paid no meter');

  // Turn the Page: every ally advances 15%.
  artur.turnMeter = 0;
  mate.turnMeter = 0;
  A.execute(artur.abilities[2].def, artur, null, battle);
  assert(mate.turnMeter === 0.15 * C.TURN_METER_MAX &&
    artur.turnMeter === 0.15 * C.TURN_METER_MAX, 'the page did not turn');

  // Permanent Ink: a meter cut on any teammate is refused while the
  // scribe lives — and lands the moment he does not.
  B.active = battle;
  try {
    mate.turnMeter = 0.50 * C.TURN_METER_MAX;
    const r = A.applyEffect({ type: 'turnMeter', amount: -0.30 }, foe, mate, 1);
    assert(r.guarded && mate.turnMeter === 0.50 * C.TURN_METER_MAX,
      'the ink did not hold');
    artur.hp = 0;
    const r2 = A.applyEffect({ type: 'turnMeter', amount: -0.30 }, foe, mate, 1);
    assert(!r2.guarded && mate.turnMeter === 0.20 * C.TURN_METER_MAX,
      'a dead scribe still guarded the page');
  } finally {
    B.active = null;
  }
});

test('gear mains: eight slots, per-slot roll pools, and the value book', () => {
  const G = g.Gear;
  assert(G.SLOTS.length === 8 && G.SLOTS.includes('helm') && G.SLOTS.includes('belt'),
    `the rack holds ${G.SLOTS.length}`);

  // Every drop's main comes from its slot's pool; boots are always SPD.
  for (let i = 0; i < 200; i++) {
    const p = G.drop('dragon', 10);
    assert(G.MAIN_POOLS[p.slot].includes(p.main),
      `${p.slot} rolled a ${p.main} main`);
    if (p.slot === 'boots') assert(p.main === 'spdFlat', 'boots rolled off-book');
  }
  const armor = ['atkFlat', 'hpFlat', 'defFlat', 'atkPct', 'defPct', 'accuracy', 'resistance'];
  const strike = ['critChance', 'critDamage', 'hpPct'];
  for (const s of ['helm', 'gloves', 'belt']) {
    assert(JSON.stringify(G.MAIN_POOLS[s]) === JSON.stringify(armor), `${s} pool drifted`);
  }
  for (const s of ['weapon', 'chest', 'ring', 'amulet']) {
    assert(JSON.stringify(G.MAIN_POOLS[s]) === JSON.stringify(strike), `${s} pool drifted`);
  }

  // The value book: level 1 pays the min, level 90 the max, exactly.
  const at = (slot, main, level) =>
    G.baseStat({ slot, main, level }).value;
  assert(at('helm', 'atkFlat', 1) === 5 && at('helm', 'atkFlat', 90) === 500, 'flat ATK book');
  assert(at('belt', 'hpFlat', 1) === 25 && at('belt', 'hpFlat', 90) === 2500, 'flat HP book');
  assert(at('gloves', 'defFlat', 1) === 5 && at('gloves', 'defFlat', 90) === 500, 'flat DEF book');
  assert(at('boots', 'spdFlat', 1) === 3 && at('boots', 'spdFlat', 90) === 30, 'SPD book');
  assert(at('ring', 'critChance', 1) === 0.05 && at('ring', 'critChance', 90) === 0.45, 'crit book');
  assert(at('weapon', 'critDamage', 1) === 0.10 && at('weapon', 'critDamage', 90) === 0.80, 'crit DMG book');
  assert(at('amulet', 'hpPct', 1) === 0.05 && at('amulet', 'hpPct', 90) === 0.45, 'HP% book');
  assert(at('helm', 'accuracy', 90) === 0.45 && at('belt', 'resistance', 90) === 0.45, 'ACC/RES book');

  // A pre-rework piece (no `main`) keeps the stat its slot used to fix.
  const legacy = { slot: 'weapon', rarity: 'rare', level: 90, plus: 0, subs: [] };
  assert(G.baseStat(legacy).stat === 'atkFlat', 'legacy weapon lost its ATK');

  // The main feeds battle stats: an accuracy helm reaches debuffAccuracy.
  const stats = G.applyToStats({ hp: 1000, atk: 100, def: 100, speed: 100 },
    [{ set: 'dragon', slot: 'helm', main: 'accuracy', rarity: 'rare', level: 90, plus: 0, subs: [] }]);
  assert(Math.abs(stats.accuracy - 0.45) < 1e-9, 'the accuracy main went nowhere');
});

test('one copy of a character per formation', () => {
  const w = loadGame();
  const G = w.GameState;
  const tideA = G.addHero('florence').uid;
  const tideB = G.addHero('florence').uid;
  const cain = G.addHero('cain').uid;

  // Placing the second copy evicts the first — never two Tides at once.
  G.setTeamSlot(0, tideA);
  G.setTeamSlot(3, cain);
  G.setTeamSlot(5, tideB);
  let team = G.getTeam();
  assert(team[5] === tideB && team[0] === undefined && team[3] === cain,
    `the field held ${JSON.stringify(team)}`);
  const chars = Object.values(team).map((u) => G.defIdOf(u));
  assert(new Set(chars).size === chars.length, 'a character stood twice');

  // Moving the SAME copy still just moves it.
  G.setTeamSlot(1, tideB);
  team = G.getTeam();
  assert(team[1] === tideB && team[5] === undefined, 'the move duplicated');

  // A save minted before the rule (two copies placed) is scrubbed on
  // load — first slot wins.
  const raw = w.savedState();
  raw.team = { 0: tideA, 2: tideB, 3: cain };
  const G2 = loadGame({ save: raw }).GameState;
  const t2 = G2.getTeam();
  assert(t2[0] === tideA && t2[2] === undefined && t2[3] === cain,
    `the old save kept ${JSON.stringify(t2)}`);

  // A pre-rule preset cannot smuggle the second copy back in.
  raw.presets = [{ name: 'old', team: { 0: tideA, 1: tideB, 4: cain } }];
  const G3 = loadGame({ save: raw }).GameState;
  const r = G3.loadPreset('old');
  const t3 = G3.getTeam();
  const chars3 = Object.values(t3).map((u) => G3.defIdOf(u));
  assert(new Set(chars3).size === chars3.length && r.placed === 2,
    'the preset fielded a character twice');
});

test('a missing character definition quarantines the hero, never deletes it', () => {
  // A data script that fails to fetch for one page load leaves HEROES
  // partially built. That must never destroy the entries it orphans.
  const w = loadGame();
  w.GameState.addHero('cain');
  const raw = w.savedState();
  const uid = String(Object.keys(raw.roster).length + 1);
  raw.roster[uid] = { heroId: 'ghost_character', level: 30, xp: 12, stars: 4,
    equipment: { weapon: 'g1' }, skills: {}, favorite: true, attune: 2 };
  raw.nextHeroUid = Number(uid) + 1;

  const w2 = loadGame({ save: raw });
  assert(!w2.GameState.ownedHeroIds().includes(uid), 'the ghost stayed in play');
  w2.GameState.addHero('cain'); // any mutation persists the loaded shape
  const after = w2.savedState();
  const held = after.limbo[uid];
  assert(held && held.level === 30 && held.equipment.weapon === 'g1' && held.favorite,
    'limbo did not keep the hero whole');

  // The moment the definition exists again, the hero walks back out.
  after.limbo[uid].heroId = 'cain';
  const w3 = loadGame({ save: after });
  assert(w3.GameState.ownedHeroIds().includes(uid) &&
    w3.GameState.defIdOf(uid) === 'cain', 'limbo did not hand the hero back');
});

test('a wiped save regrows its roster from the collection registry', () => {
  const w = loadGame();
  const raw = w.savedState() || {};
  // The wreck the old scrub left: not one hero anywhere, but the
  // collection registry intact and every starter already stamped.
  raw.schemaVersion = 7;
  raw.roster = {};
  raw.storage = {};
  raw.limbo = {};
  raw.team = {};
  raw.nextHeroUid = 40;
  raw.starters = { florence: true, vivian: true, coral: true, vex: true, emily: true };
  raw.collected = { florence: true, cain: true, oak: true };

  const G = loadGame({ save: raw }).GameState;
  const chars = G.ownedHeroIds().map((u) => G.defIdOf(u)).sort();
  assert(JSON.stringify(chars) === JSON.stringify(['cain', 'florence', 'oak']),
    `the account came back as ${JSON.stringify(chars)}`);

  // But a roster that is merely EMPTY BY CHOICE — everything parked in
  // storage — is not a wreck, and must not be "restored".
  raw.storage = { 9: { heroId: 'florence', level: 3, xp: 0, stars: 1,
    equipment: {}, skills: {}, favorite: false, attune: 0 } };
  const G2 = loadGame({ save: raw }).GameState;
  assert(G2.ownedHeroIds().length === 0, 'the parked save was "restored" anyway');
});

test('the rolling backup survives and restores', () => {
  const w = loadGame();
  w.GameState.addHero('cain');
  const raw = w.savedState();

  // Booting off a save writes it to the backup slot...
  const w2 = loadGame({ save: raw });
  const KEY = 'browsergacha_save_v1';
  const backed = JSON.parse(w2.localStorage.getItem(KEY + '_backup'));
  assert(backed && Object.keys(backed.roster).length === Object.keys(raw.roster).length,
    'the backup was not written on load');

  // ...and restoreBackup() swaps it back in as the live save.
  w2.GameState.addHero('oak');
  assert(w2.savedState().nextHeroUid !== raw.nextHeroUid, 'mutation did not save');
  assert(w2.GameState.restoreBackup() === true, 'restore refused');
  assert(w2.localStorage.getItem(KEY) === w2.localStorage.getItem(KEY + '_backup'),
    'the live save is not the backup');
});

test('the Journey holds exactly one thousand well-formed quests', () => {
  const w = loadGame();
  const defs = w.Quests.DEFS.journey;
  assert(defs.length === 1000, `the Journey holds ${defs.length} quests`);
  const ids = new Set(defs.map((d) => d.id));
  assert(ids.size === 1000, 'journey quest ids collide');
  // Ladders climb strictly, and every rung pays something.
  const prev = {};
  for (const d of defs) {
    assert(d.goal > (prev[d.counter] || 0),
      `${d.id} does not climb past its predecessor`);
    prev[d.counter] = d.goal;
    assert(Object.keys(d.reward).length > 0, `${d.id} pays nothing`);
  }
});

test('Journey rungs claim off lifetime totals and never reset', () => {
  const w = loadGame();
  const G = w.GameState;
  const first = w.Quests.DEFS.journey.find((d) => d.counter === 'wins');
  // Not there yet: the claim refuses.
  assert(G.claimQuest('journey', first.id) === null, 'claimed early');
  G.questBump('wins', first.goal);
  const before = G.diamonds;
  const reward = G.claimQuest('journey', first.id);
  assert(reward && G.diamonds === before + (reward.diamonds || 0),
    'the first rung did not pay');
  assert(G.claimQuest('journey', first.id) === null, 'double-claimed');
  // The claim survives a save/load round trip — no period ever rolls it.
  const G2 = loadGame({ save: w.savedState() }).GameState;
  assert(G2.claimQuest('journey', first.id) === null,
    'the claim was forgotten across a reload');
});

test('Claim All sweeps a board, including rungs it uncovers', () => {
  const w = loadGame();
  const G = w.GameState;
  // Three dailies' worth of progress, claimed in one press.
  G.questBump('wins', 10);
  G.questBump('huntWins', 5);
  const before = G.diamonds;
  const got = G.claimAllQuests('daily');
  assert(got.claimed >= 2, `Claim All took only ${got.claimed} dailies`);
  assert(G.diamonds > before || got.reward.scrollsCommon,
    'Claim All paid nothing');
  assert(G.claimAllQuests('daily').claimed === 0, 'a second sweep double-paid');

  // The Journey reads lifetime totals, so ONE sweep takes every rung a
  // long-standing counter has already earned — not just the next one.
  const w2 = loadGame();
  const G2 = w2.GameState;
  G2.questBump('wins', 100);
  const first = G2.claimAllQuests('journey');
  assert(first.claimed > 5, `one journey sweep took only ${first.claimed} rungs`);
  assert(G2.claimAllQuests('journey').claimed === 0, 'the sweep left rungs behind');
});

test('auto-salvage melts drops below the bar and keeps the rest', () => {
  const w = loadGame();
  const G = w.GameState, Gear = w.Gear;
  assert(G.autoSalvage === 'none', 'auto-salvage should start off');
  const grey = { set: 'wolf', slot: 'ring', main: 'critChance',
    rarity: 'normal', level: 1, plus: 0, subs: [] };
  const gold = { ...grey, rarity: 'legendary' };

  // Off: everything is kept.
  const kept = G.grantGear({ ...grey });
  assert(kept.uid && G.gearById(kept.uid), 'a drop vanished with the rule off');

  G.setAutoSalvage('rare');
  const held = G.allGear().length;
  const melted = G.grantGear({ ...grey });
  assert(melted.salvaged && melted.salvaged.whetstones > 0,
    'the grey drop was not melted');
  assert(G.allGear().length === held, 'the melted piece stayed in the bag');
  const legendary = G.grantGear({ ...gold });
  assert(legendary.uid && G.gearById(legendary.uid),
    'the rule ate a legendary it should have kept');

  // The setting rides the save.
  assert(loadGame({ save: w.savedState() }).GameState.autoSalvage === 'rare',
    'the rule was forgotten on reload');
});

test('gear loadouts: save a kit, lose a piece, wear what is left', () => {
  const w = loadGame();
  const G = w.GameState, Gear = w.Gear;
  const uid = G.addHero('cain').uid;
  const mk = (slot) => G.addGear({ set: 'wolf', slot,
    main: slot === 'boots' ? 'spdFlat' : 'critChance',
    rarity: 'epic', level: 1, plus: 0, subs: [] });
  const ring = mk('ring'), boots = mk('boots');
  G.equipGear(uid, ring);
  G.equipGear(uid, boots);
  assert(G.saveLoadout(uid, 'Boss kit') === 'Boss kit', 'the kit would not save');
  assert(G.loadoutsOf(uid)[0].pieces === 2, 'the kit saved the wrong count');

  // Strip the hero, then put the kit back on.
  G.unequipGear(uid, 'ring');
  G.unequipGear(uid, 'boots');
  assert(Object.keys(G.equipmentOf(uid)).length === 0, 'the hero is still dressed');
  const worn = G.applyLoadout(uid, 'Boss kit');
  assert(worn.equipped === 2 && worn.missing === 0,
    `wore ${worn.equipped}, missed ${worn.missing}`);

  // A piece salvaged since the snapshot is simply gone; the rest lands.
  G.unequipGear(uid, 'ring');
  G.salvageGear(ring);
  G.unequipGear(uid, 'boots');
  const partial = G.applyLoadout(uid, 'Boss kit');
  assert(partial.equipped === 1 && partial.missing === 1,
    `after salvage: wore ${partial.equipped}, missed ${partial.missing}`);

  // The book is capped, and delete frees a slot again.
  for (let i = 0; i < 10; i++) G.saveLoadout(uid, `Kit ${i}`);
  assert(G.loadoutsOf(uid).length === G.MAX_LOADOUTS,
    `the book holds ${G.loadoutsOf(uid).length}`);
  assert(G.deleteLoadout(uid, 'Boss kit'), 'delete failed');
  assert(G.saveLoadout(uid, 'One more') === 'One more', 'the freed slot was not reused');
});

test('team power adds up the fielded heroes and moves with gear', () => {
  const w = loadGame();
  const G = w.GameState;
  G.clearTeam();
  assert(G.teamPower() === 0, 'an empty formation has power');
  const a = G.addHero('cain').uid;
  G.setTeamSlot(0, a);
  const solo = G.teamPower();
  assert(solo > 0, 'a fielded hero counts for nothing');
  const b = G.addHero('oak').uid;
  G.setTeamSlot(1, b);
  assert(G.teamPower() > solo, 'the second hero added nothing');
  // Gear lifts it; the bench never counts.
  const bench = G.addHero('emily').uid;
  const withBench = G.teamPower();
  assert(withBench === G.teamPower() && bench, 'the bench moved the number');
  const piece = G.addGear({ set: 'wolf', slot: 'weapon', main: 'critDamage',
    rarity: 'legendary', level: 90, plus: 0, subs: [] });
  G.equipGear(a, piece);
  assert(G.teamPower() > withBench, 'gear did not raise team power');
});

test("Tumble's kit: the whirl strips, the carousel turns the field", () => {
  const A = Abilities, H = HEROES;
  const def = H.tumble;
  assert(def && def.element === 'wind' && def.rarity === 4, 'Tumble drifted');
  assert(RACES.sectOf(def).id === 'whisperchime', 'Tumble left the Whisperchime');

  // ---- Skill 1: the front row only, damage plus a rolled strip ----
  const b = makeBattle();
  const tum = place(b, def, TEAM.PLAYER, 0);
  const foes = [1, 2, 3].map((i) => place(b, DUMMIES.rat_knight, TEAM.ENEMY, i));
  const front = foes.filter((u) => u.slot.position === POSITION.FRONT);
  assert(front.length > 0, 'nobody is holding the enemy front row');
  for (const f of foes) {
    f.hp = f.maxHp = 10 ** 6;
    f.dodgeChance = () => 0;
    f.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.5, turns: 3 });
  }
  const R = g.Math;                     // the sandbox's own Math
  R.random = () => 0.01;                // every rider roll lands
  tum.turnMeter = 0;
  A.execute(def.abilities[0], tum, foes[0], b);
  delete R.random;
  const stripped = front.filter((f) =>
    !f.statusEffects.some((fx) => fx.kind === 'buff' && fx.stat === 'atk'));
  assert(stripped.length === front.length,
    `the whirl stripped ${stripped.length} of ${front.length}`);
  for (const f of front) assert(f.hp < f.maxHp, 'the whirl dealt no damage');
  // Chime Tax: 10 meter per blessing torn away.
  const want = CONFIG.TURN_METER_MAX * 0.10 * front.length;
  assert(Math.abs(tum.turnMeter - want) < 1e-6,
    `Chime Tax paid ${tum.turnMeter}, expected ${want}`);

  // A failed roll takes nothing and pays nothing.
  const b2 = makeBattle();
  const tum2 = place(b2, def, TEAM.PLAYER, 0);
  const foe2 = place(b2, DUMMIES.rat_knight, TEAM.ENEMY, 1);
  foe2.hp = foe2.maxHp = 10 ** 6;
  foe2.dodgeChance = () => 0;
  foe2.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.5, turns: 3 });
  tum2.turnMeter = 0;
  R.random = () => 0.99;
  A.execute(def.abilities[0], tum2, foe2, b2);
  delete R.random;
  assert(foe2.statusEffects.some((fx) => fx.kind === 'buff'),
    'a missed roll still tore the blessing off');
  assert(tum2.turnMeter === 0, 'a missed roll still paid Chime Tax');

  // ---- Skill 2: the whole party picks up the tempo ----
  const b3 = makeBattle();
  const tum3 = place(b3, def, TEAM.PLAYER, 0);
  const mate = place(b3, H.cain, TEAM.PLAYER, 2);
  const before = mate.effectiveStat('speed');
  A.execute(def.abilities[1], tum3, null, b3);
  assert(Math.abs(mate.effectiveStat('speed') - Math.round(before * 1.3)) <= 1,
    `ally speed went ${before} -> ${mate.effectiveStat('speed')}`);
  assert(tum3.statusEffects.some((fx) => fx.stat === 'speed'),
    'Tumble left himself out of his own tempo');

  // ---- Skill 3: both outer rows, and the field turns ----
  const b4 = makeBattle();
  const tum4 = place(b4, def, TEAM.PLAYER, 0);
  const ring = [1, 2, 3, 4, 5, 6].map((i) => place(b4, DUMMIES.rat_knight, TEAM.ENEMY, i));
  const mid = place(b4, DUMMIES.rat_archer, TEAM.ENEMY, 0);
  for (const u of [...ring, mid]) { u.hp = u.maxHp = 10 ** 6; u.dodgeChance = () => 0; }
  // The sweep spares the middle hex.
  const hit = A.execute(def.abilities[2], tum4, ring[0], b4)
    .filter((r) => r.kind === 'damage').map((r) => r.target);
  assert(!hit.includes(mid), 'the carousel clipped the centre hex');
  assert(hit.length === ring.length, `the carousel caught ${hit.length} of ${ring.length}`);

  // Everyone on the ring moved exactly one hex clockwise ON SCREEN:
  // ascending atan2 about the ring's own centre.
  const slots = b4.slotsFor(TEAM.ENEMY).filter((sl) => sl.position !== POSITION.CENTER);
  const cx = slots.reduce((a, sl) => a + sl.x, 0) / slots.length;
  const cy = slots.reduce((a, sl) => a + sl.y, 0) / slots.length;
  const cw = [...slots].sort((a, b) =>
    Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
  ring.forEach((u, i) => {
    const from = cw.indexOf(b4.enemySlots[i + 1]);
    assert(u.slot === cw[(from + 1) % cw.length],
      `${u.name} did not land one hex clockwise`);
  });
  assert(mid.slot === b4.enemySlots[0], 'the pivot moved');
  // And the point of it: standing changes with the ground.
  assert(ring.some((u) => u.slot.position !== b4.enemySlots[ring.indexOf(u) + 1].position),
    'the spin left every fighter in the same kind of hex');

  // ---- The centre hex pays him accuracy ----
  assert(def.positional && def.positional.name === 'Eye of the Ring' &&
    def.positional.hooks.accuracyAdd === 0.35, 'the centre bonus drifted');
  const b5 = makeBattle();
  const mid5 = place(b5, def, TEAM.PLAYER, 0);
  const off5 = place(b5, def, TEAM.PLAYER, 1);
  assert(mid5.slot.position === POSITION.CENTER, 'slot 0 is not the middle hex');
  assert(Math.abs(mid5.debuffAccuracy() - off5.debuffAccuracy() - 0.35) < 1e-9,
    'the middle hex paid the wrong accuracy');
});

test('taking is contested: strips and AP drains roll accuracy vs resistance', () => {
  const A = Abilities, H = HEROES;
  const R = g.Math;
  const mk = () => {
    const b = makeBattle();
    const caster = place(b, H.cleo, TEAM.PLAYER, 0);
    const foe = place(b, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    foe.hp = foe.maxHp = 10 ** 6;
    foe.dodgeChance = () => 0;
    foe.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.5, turns: 3 });
    foe.turnMeter = CONFIG.TURN_METER_MAX * 0.8;
    return { b, caster, foe };
  };
  const strip = { type: 'stripBuffs', count: 1 };
  const drain = { type: 'turnMeter', amount: -0.20 };

  // An unresisting target loses both, every time — the rule only bites
  // where there is resistance to bite on.
  {
    const { caster, foe } = mk();
    assert(A.applyEffect(strip, caster, foe, 1).count === 1, 'a bare target kept its buff');
    assert(A.applyEffect(drain, caster, foe, 1).amount < 0, 'a bare target kept its meter');
  }

  // Half resistance, and a roll that fails: both are refused, and both
  // say so rather than silently doing nothing.
  {
    const { caster, foe } = mk();
    foe.gearResistance = 0.50;
    R.random = () => 0.90;
    const s1 = A.applyEffect(strip, caster, foe, 1);
    const d1 = A.applyEffect(drain, caster, foe, 1);
    delete R.random;
    assert(s1.resisted && s1.count === 0, 'the strip went through resistance');
    assert(foe.statusEffects.some((fx) => fx.kind === 'buff'), 'the blessing was torn anyway');
    assert(d1.resisted && d1.amount === 0, 'the drain went through resistance');
    assert(foe.turnMeter === CONFIG.TURN_METER_MAX * 0.8, 'meter moved on a resist');
  }

  // Same resistance, a roll that lands: both take hold.
  {
    const { caster, foe } = mk();
    foe.gearResistance = 0.50;
    R.random = () => 0.10;
    const s2 = A.applyEffect(strip, caster, foe, 1);
    const d2 = A.applyEffect(drain, caster, foe, 1);
    delete R.random;
    assert(s2.count === 1 && !s2.resisted, 'the strip was refused on a good roll');
    assert(d2.amount < 0 && !d2.resisted, 'the drain was refused on a good roll');
  }

  // Accuracy is the answer to resistance: the same 0.9 roll that failed
  // above lands once the caster out-accuracies the target.
  {
    const { caster, foe } = mk();
    foe.gearResistance = 0.50;
    caster.gearAccuracy = 0.50;
    R.random = () => 0.90;
    const s3 = A.applyEffect(strip, caster, foe, 1);
    const d3 = A.applyEffect(drain, caster, foe, 1);
    delete R.random;
    assert(s3.count === 1, 'accuracy did not cancel resistance for the strip');
    assert(d3.amount < 0, 'accuracy did not cancel resistance for the drain');
  }

  // Nothing is unhittable: past the floor, 15% still gets through.
  {
    const { caster, foe } = mk();
    foe.gearResistance = 5;
    R.random = () => 0.10;
    const s4 = A.applyEffect(strip, caster, foe, 1);
    delete R.random;
    assert(s4.count === 1, 'the 15% floor was lost');
  }

  // Handing meter to an ALLY is a gift, not a taking — never rolled.
  {
    const b = makeBattle();
    const giver = place(b, H.artur, TEAM.PLAYER, 0);
    const ally = place(b, H.cain, TEAM.PLAYER, 2);
    ally.gearResistance = 5;
    ally.turnMeter = 0;
    R.random = () => 0.99;
    const gift = A.applyEffect({ type: 'turnMeter', amount: 0.30 }, giver, ally, 1);
    delete R.random;
    assert(gift.amount > 0 && !gift.resisted, 'an ally resisted a gift of meter');
  }

  // The guard outranks the contest: Permanent Ink refuses the drain
  // before any roll is taken.
  {
    const b = makeBattle();
    const caster = place(b, H.cleo, TEAM.PLAYER, 0);
    const foe = place(b, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    const scribe = place(b, H.artur, TEAM.ENEMY, 2);
    assert(scribe.hookSources().some((p) => p.hooks && p.hooks.meterGuard),
      'sanity: Artur still guards meters');
    foe.turnMeter = CONFIG.TURN_METER_MAX * 0.8;
    // meterGuarded reads the LIVE battle to find the guard's teammates.
    const prevActive = Battle.active;
    Battle.active = b;
    R.random = () => 0.10;              // a roll that would otherwise land
    const guarded = A.applyEffect(drain, caster, foe, 1);
    delete R.random;
    Battle.active = prevActive;
    assert(guarded.guarded && guarded.amount === 0, 'the ink let the drain through');
  }
});

test("Posie's kit: two pools, a bough that keeps swinging, a summer ward", () => {
  const A = Abilities, H = HEROES, R = g.Math;
  const def = H.posie;
  assert(def && def.element === 'wind' && def.rarity === 5, 'Posie drifted');
  assert(RACES.sectOf(def).id === 'whisperchime', 'Posie left the Whisperchime');

  // ---- Skill 1 heals off HER pool; skill 2 heals off THEIRS ----
  const b = makeBattle();
  const posie = place(b, def, TEAM.PLAYER, 5);       // a back hex
  const big = place(b, H.franz, TEAM.PLAYER, 1);     // a bigger pool than hers
  posie.healingBoost = () => 0;
  big.hp = 1;
  A.applyEffect({ type: 'healHpPct', pct: 0.20 }, posie, big, 1);
  assert(big.hp - 1 === Math.round(posie.maxHp * 0.20),
    `Bloom healed ${big.hp - 1}, expected 20% of Posie's ${posie.maxHp}`);
  big.hp = 1;
  A.applyEffect({ type: 'healHpPct', targetPct: 0.20 }, posie, big, 1);
  assert(big.hp - 1 === Math.round(big.maxHp * 0.20),
    `Windfall healed ${big.hp - 1}, expected 20% of the patient's ${big.maxHp}`);

  // ---- The bough swings on to whoever is worst off ----
  const b2 = makeBattle();
  const p2 = place(b2, def, TEAM.PLAYER, 5);
  const hurt = place(b2, H.cain, TEAM.PLAYER, 1);
  const fine = place(b2, H.oak, TEAM.PLAYER, 2);
  p2.healingBoost = () => 0;
  hurt.hp = 1; fine.hp = fine.maxHp;
  const windfall = def.abilities[1];
  assert(windfall.chain && windfall.chain.to === 'lowest-ally' &&
    windfall.chain.id === windfall.id, 'Windfall stopped chaining into itself');
  R.random = () => 0.99;                    // every jump roll fails
  const once = A.execute(windfall, p2, fine, b2).filter((r) => r.kind === 'heal');
  delete R.random;
  assert(once.length === 1, `a cold roll still swung ${once.length} times`);

  hurt.hp = 1; fine.hp = fine.maxHp;
  R.random = () => 0.01;                    // every jump roll lands
  const many = A.execute(windfall, p2, fine, b2).filter((r) => r.kind === 'heal');
  delete R.random;
  assert(many.length === 1 + windfall.chain.maxDepth,
    `a hot run swung ${many.length}, expected ${1 + windfall.chain.maxDepth}`);
  // The first jump goes to the ally who was worst off — and it keeps
  // re-choosing, so once that ally is topped up the bough moves on
  // rather than pouring the rest into a full bar.
  assert(many[1].target === hurt, 'the first jump missed the lowest ally');
  assert(hurt.hp === hurt.maxHp, 'the chain never finished the job');
  assert(many.some((r) => r.target !== hurt),
    'the bough kept swinging at an ally who no longer needed it');

  // ---- The back hex widens the channel ----
  assert(def.positional.name === 'Bough Bearer' &&
    def.positional.hooks.chainChanceAdd === 0.15, 'the back-hex bonus drifted');
  const b3 = makeBattle();
  const back = place(b3, def, TEAM.PLAYER, 5);
  const front = place(b3, def, TEAM.PLAYER, 1);
  const mate = place(b3, H.cain, TEAM.PLAYER, 2);
  mate.hp = 1;
  assert(back.slot.position === POSITION.BACK && front.slot.position !== POSITION.BACK,
    'sanity: the two Posies are not in different rows');
  // A roll of 0.60 clears 0.50 + 0.15 but not 0.50 alone.
  R.random = () => 0.60;
  const fromBack = A.execute(windfall, back, mate, b3).filter((r) => r.kind === 'heal');
  const fromFront = A.execute(windfall, front, mate, b3).filter((r) => r.kind === 'heal');
  delete R.random;
  assert(fromBack.length > 1, 'the back hex did not widen the channel');
  assert(fromFront.length === 1, 'the front hex chained anyway');

  // ---- High Summer: a team heal and a real resistance buff ----
  const b4 = makeBattle();
  const p4 = place(b4, def, TEAM.PLAYER, 5);
  const ally = place(b4, H.cain, TEAM.PLAYER, 1);
  p4.healingBoost = () => 0;
  ally.hp = 1;
  const before = ally.debuffResistance();
  A.execute(def.abilities[2], p4, null, b4);
  assert(ally.hp - 1 === Math.round(p4.maxHp * 0.10),
    `High Summer healed ${ally.hp - 1}, expected 10% of ${p4.maxHp}`);
  assert(Math.abs(ally.debuffResistance() - before - 0.30) < 1e-9,
    `resistance went ${before} -> ${ally.debuffResistance()}`);
  // And that resistance has to actually do something: it is the stat
  // the contested-take rule reads.
  const foe = place(b4, DUMMIES.rat_knight, TEAM.ENEMY, 1);
  ally.turnMeter = CONFIG.TURN_METER_MAX * 0.8;
  R.random = () => 0.85;                   // beats 1 - 0.30 = 0.70
  const drained = A.applyEffect({ type: 'turnMeter', amount: -0.20 }, foe, ally, 1);
  delete R.random;
  assert(drained.resisted, 'the summer ward bought no resistance at all');

  // ---- Nothing Falls Far: the overflow settles as a shield ----
  const b5 = makeBattle();
  const p5 = place(b5, def, TEAM.PLAYER, 5);
  const full = place(b5, H.cain, TEAM.PLAYER, 1);
  p5.healingBoost = () => 0;
  full.hp = full.maxHp;                    // nothing to heal: all overflow
  assert(full.shieldTotal() === 0, 'sanity: the ally already had a shield');
  A.applyEffect({ type: 'healHpPct', pct: 0.20 }, p5, full, 1);
  assert(full.shieldTotal() === Math.round(p5.maxHp * 0.20),
    `the overflow left a ${full.shieldTotal()} shield, expected ${Math.round(p5.maxHp * 0.20)}`);
});

test("Galen's kit: the wind picks the mark, and breaks what it stripped", () => {
  const A = Abilities, H = HEROES, R = g.Math;
  const def = H.galen;
  assert(def && def.element === 'wind' && def.rarity === 3, 'Galen drifted');
  assert(RACES.sectOf(def).id === 'whisperchime', 'Galen left the Whisperchime');
  assert(def.role === 'dps', 'Galen is not binned as damage');

  const arena = () => {
    const b = makeBattle();
    const galen = place(b, def, TEAM.PLAYER, 5);      // a back hex
    const foes = [1, 2, 3, 4, 5, 6].map((i) => place(b, DUMMIES.rat_knight, TEAM.ENEMY, i));
    for (const f of foes) {
      f.hp = f.maxHp = 10 ** 7;
      f.dodgeChance = () => 0;
      f.debuffResistance = () => 0;                   // isolate from the resist roll
    }
    galen.baseCritChance = -1;                        // no crits in the arithmetic
    return { b, galen, foes };
  };

  // ---- Skill 1 lands on ONE enemy, and not always the same one ----
  {
    const { b, galen, foes } = arena();
    const seen = new Set();
    for (let i = 0; i < 60; i++) {
      const hit = A.execute(def.abilities[0], galen, null, b)
        .filter((r) => r.kind === 'damage');
      assert(hit.length === 1, `Gust hit ${hit.length} enemies`);
      seen.add(hit[0].target);
    }
    assert(seen.size > 1, 'the random gust always chose the same enemy');
  }

  // ---- Skill 2: one enemy, 140% ATK, two blessings gone ----
  {
    const { b, galen, foes } = arena();
    const mark = foes[0];
    for (let i = 0; i < 3; i++) {
      mark.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.1, turns: 5 });
    }
    // The strip is gated at 50%; its chance rungs buy it back to certain.
    maxSkill(galen, 1);
    const res = A.execute(def.abilities[1], galen, mark, b);
    const stripped = res.find((r) => r.kind === 'stripBuff');
    assert(stripped && stripped.count === 2, `Stripwind tore ${stripped && stripped.count}`);
    assert(mark.statusEffects.filter((fx) => fx.kind === 'buff').length === 1,
      'the wrong number of blessings survived');
    assert(res.filter((r) => r.kind === 'damage').length === 1, 'Stripwind spread out');
  }

  // ---- Skill 3: the BACK row only, one blessing each ----
  {
    const { b, galen, foes } = arena();
    for (const f of foes) f.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.1, turns: 5 });
    const back = foes.filter((f) => f.slot.position === POSITION.BACK);
    assert(back.length > 0, 'nobody is holding the enemy back row');
    maxSkill(galen, 2);   // close the 50% strip gate
    const res = A.execute(def.abilities[2], galen, null, b);
    const hit = res.filter((r) => r.kind === 'damage').map((r) => r.target);
    assert(hit.length === back.length && hit.every((u) => back.includes(u)),
      'Squall reached outside the back row');
    for (const f of back) {
      assert(!f.statusEffects.some((fx) => fx.kind === 'buff'),
        'a back-row blessing survived the squall');
    }
    for (const f of foes.filter((x) => !back.includes(x))) {
      assert(f.statusEffects.some((fx) => fx.kind === 'buff'),
        'the squall stripped somebody it never hit');
    }
  }

  // ---- Bare Branches: 25% more into a target with nothing on it ----
  {
    const { b, galen, foes } = arena();
    const bare = foes[0], blessed = foes[1];
    blessed.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.1, turns: 5 });
    // Same defence on both, so the only difference is the passive.
    blessed.effectiveStat = bare.effectiveStat.bind(bare);
    // The multiplier lives in the damage EFFECT, so measure it there.
    const hit = (foe) => {
      const before = foe.hp;
      A.applyEffect({ type: 'damage', mult: 1.0 }, galen, foe, 1);
      return before - foe.hp;
    };
    const onBare = hit(bare);
    const onBlessed = hit(blessed);
    assert(onBare > onBlessed, `bare ${onBare} vs blessed ${onBlessed}`);
    assert(Math.abs(onBare / onBlessed - 1.25) < 0.02,
      `the passive paid ${(onBare / onBlessed).toFixed(3)}x, expected 1.25x`);
  }

  // ---- The back hex sharpens him ----
  {
    assert(def.positional.name === 'Weathervane' &&
      def.positional.hooks.accuracyAdd === 0.20, 'the back-hex bonus drifted');
    const b = makeBattle();
    const back = place(b, def, TEAM.PLAYER, 5);
    const front = place(b, def, TEAM.PLAYER, 1);
    assert(back.slot.position === POSITION.BACK, 'slot 5 is not a back hex');
    assert(Math.abs(back.debuffAccuracy() - front.debuffAccuracy() - 0.20) < 1e-9,
      'the back hex paid the wrong accuracy');
  }

  // ---- And his strips answer to resistance, like every taking ----
  {
    const { b, galen, foes } = arena();
    const stubborn = foes[0];
    stubborn.debuffResistance = () => 0.60;
    stubborn.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.1, turns: 5 });
    // Max the skill so the 50% gate is closed: what is being measured
    // here is the RESIST that follows it, not the gate itself. At level
    // 1 a 0.95 roll would fail the gate and never reach the contest --
    // which is exactly the distinction the two readouts exist to draw.
    maxSkill(galen, 1);
    R.random = () => 0.95;
    const res = A.execute(def.abilities[1], galen, stubborn, b);
    delete R.random;
    const strip = res.find((r) => r.kind === 'stripBuff');
    assert(strip && strip.resisted, 'a stubborn target lost its blessing anyway');
    assert(res.some((r) => r.kind === 'damage'), 'a resisted strip ate the damage too');
  }
});

test("Ilyra's kit: the same mercy at three widths, paid for by the enemy", () => {
  const A = Abilities, H = HEROES;
  const def = H.ilyra;
  assert(def && def.element === 'wind' && def.rarity === 3, 'Ilyra drifted');
  assert(RACES.sectOf(def).id === 'whisperchime', 'Ilyra left the Whisperchime');

  const hex = (u, n = 1) => {
    for (let i = 0; i < n; i++) {
      u.addStatusEffect({ kind: 'debuff', stat: 'def', mult: 0.8, turns: 3 });
    }
  };

  // ---- Skill 1: one ally, 15% of HER pool, one curse lifted ----
  {
    const b = makeBattle();
    const ilyra = place(b, def, TEAM.PLAYER, 5);
    const mate = place(b, H.franz, TEAM.PLAYER, 1);
    ilyra.healingBoost = () => 0;
    mate.hp = 1;
    hex(mate, 3);
    A.execute(def.abilities[0], ilyra, mate, b);
    assert(mate.hp - 1 === Math.round(ilyra.maxHp * 0.15),
      `Clear Sky healed ${mate.hp - 1}, expected 15% of ${ilyra.maxHp}`);
    assert(mate.statusEffects.filter((fx) => fx.kind === 'debuff').length === 2,
      'Clear Sky lifted the wrong number of curses');
  }

  // ---- Skill 2 is the FRONT row at 20%; skill 3 is everyone at 15% ----
  {
    const b = makeBattle();
    const ilyra = place(b, def, TEAM.PLAYER, 5);
    ilyra.healingBoost = () => 0;
    const mates = [1, 2, 3, 4, 6].map((i) => place(b, H.franz, TEAM.PLAYER, i));
    for (const m of mates) { m.hp = 1; hex(m, 2); }
    const front = mates.filter((m) => m.slot.position === POSITION.FRONT);
    const rest = mates.filter((m) => !front.includes(m));
    assert(front.length > 0 && rest.length > 0, 'sanity: the party is all one row');
    A.execute(def.abilities[1], ilyra, null, b);
    for (const m of front) {
      assert(m.hp - 1 === Math.round(ilyra.maxHp * 0.20),
        `a front ally got ${m.hp - 1}, expected 20% of ${ilyra.maxHp}`);
      assert(m.statusEffects.filter((fx) => fx.kind === 'debuff').length === 1,
        'a front ally kept both curses');
    }
    for (const m of rest) {
      assert(m.hp === 1, 'Following Wind reached past the front row');
    }

    // Now the team-wide one, at the smaller number, for everybody.
    for (const m of mates) m.hp = 1;
    ilyra.hp = 1;
    A.execute(def.abilities[2], ilyra, null, b);
    for (const m of mates) {
      assert(m.hp - 1 === Math.round(ilyra.maxHp * 0.05),
        `Changing Weather gave ${m.hp - 1}, expected 5% of ${ilyra.maxHp}`);
    }
    assert(ilyra.hp > 1, 'Changing Weather left the caster out');
  }

  // ---- Kindly Hours: every hex on her side pays her 10 meter ----
  {
    const b = makeBattle();
    const ilyra = place(b, def, TEAM.PLAYER, 5);
    const mate = place(b, H.franz, TEAM.PLAYER, 1);
    const foe = place(b, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    const prevActive = Battle.active;
    Battle.active = b;                   // the ring reads the live battle
    try {
      ilyra.turnMeter = 0;
      hex(mate, 1);
      assert(Math.abs(ilyra.turnMeter - CONFIG.TURN_METER_MAX * 0.10) < 1e-6,
        `one ally hex paid ${ilyra.turnMeter}`);
      hex(mate, 2);
      assert(Math.abs(ilyra.turnMeter - CONFIG.TURN_METER_MAX * 0.30) < 1e-6,
        'three hexes did not pay three times');
      // A poison counts as a curse; a blessing does not, and neither
      // does anything landing on the ENEMY side.
      ilyra.turnMeter = 0;
      mate.addStatusEffect({ kind: 'dot', amount: 10, turns: 2 });
      assert(ilyra.turnMeter > 0, 'a poison paid nothing');
      ilyra.turnMeter = 0;
      mate.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.2, turns: 2 });
      assert(ilyra.turnMeter === 0, 'a blessing paid her');
      hex(foe, 3);
      assert(ilyra.turnMeter === 0, 'the enemy being cursed paid her');
      // And it pays for her own misfortune too — she is on her own side.
      ilyra.turnMeter = 0;
      hex(ilyra, 1);
      assert(ilyra.turnMeter > 0, 'her own curse paid nothing');
    } finally { Battle.active = prevActive; }
  }

  // ---- Still Air: the back hex is 30% resistance, and it bites ----
  {
    assert(def.positional.name === 'Still Air' &&
      def.positional.hooks.resistanceAdd === 0.30, 'the back-hex bonus drifted');
    const b = makeBattle();
    const back = place(b, def, TEAM.PLAYER, 5);
    const front = place(b, def, TEAM.PLAYER, 1);
    assert(Math.abs(back.debuffResistance() - front.debuffResistance() - 0.30) < 1e-9,
      'the back hex paid the wrong resistance');
    // 30% resistance refuses a taking on a roll that would beat 0%.
    const thief = place(b, H.galen, TEAM.ENEMY, 1);
    thief.debuffAccuracy = () => 0;
    back.turnMeter = CONFIG.TURN_METER_MAX * 0.5;
    const R = g.Math;
    R.random = () => 0.85;               // beats 1 - 0.30 = 0.70
    const drained = A.applyEffect({ type: 'turnMeter', amount: -0.20 }, thief, back, 1);
    delete R.random;
    assert(drained.resisted, 'Still Air bought nothing against a drain');
  }
});

test("Ryn's kit: speed is the damage stat", () => {
  const A = Abilities, H = HEROES;
  const def = H.ryn;
  assert(def && def.element === 'wind' && def.rarity === 4, 'Ryn drifted');
  assert(RACES.sectOf(def).id === 'whisperchime', 'Ryn left the Whisperchime');
  assert(def.role === 'dps', 'Ryn is not binned as damage');
  // Authored facing right, like every other Whisperchime upload. This
  // asserted faceLeft === true for a while, which pinned the bug in
  // place: the flag was read off a wind-up frame instead of the swing,
  // and the test then defended it.
  assert(!def.sprite.faceLeft, 'Ryn is flipped again — her art faces right');

  // ---- Terminal Velocity: 20% per FULL 50 SPD, read as fought ----
  {
    const b = makeBattle();
    const ryn = place(b, def, TEAM.PLAYER, 5);      // a back hex: no front bonus
    const steps = [[49, 1.0], [50, 1.2], [99, 1.2], [100, 1.4], [149, 1.4], [150, 1.6]];
    for (const [spd, want] of steps) {
      ryn.effectiveStat = (stat) => (stat === 'speed' ? spd : 100);
      const got = ryn.damageDealtMult(null);
      assert(Math.abs(got - want) < 1e-9,
        `at ${spd} SPD the passive paid ${got}, expected ${want}`);
    }
  }

  // A tempo buff can carry her over the next breakpoint mid-fight.
  {
    const b = makeBattle();
    const ryn = place(b, def, TEAM.PLAYER, 5);
    ryn.speed = 130;                                 // one step short of 150
    const before = ryn.damageDealtMult(null);
    ryn.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.30, turns: 2 });
    const after = ryn.damageDealtMult(null);
    assert(ryn.effectiveStat('speed') >= 150 && after > before,
      `a 30% tempo buff took her ${before} -> ${after} at ${ryn.effectiveStat('speed')} SPD`);
  }

  // ---- The front hex pays speed, which pays damage ----
  {
    assert(def.positional.name === 'Headwind' && def.positional.mult === 1.10 &&
      def.positional.stat === 'speed', 'the front-hex bonus drifted');
    const b = makeBattle();
    const front = place(b, def, TEAM.PLAYER, 1);
    const back = place(b, def, TEAM.PLAYER, 5);
    assert(front.slot.position === POSITION.FRONT, 'slot 1 is not a front hex');
    assert(front.effectiveStat('speed') === Math.round(back.effectiveStat('speed') * 1.10),
      `front ${front.effectiveStat('speed')} vs back ${back.effectiveStat('speed')}`);
  }

  // ---- The three swings: single, single, front row ----
  {
    const b = makeBattle();
    const ryn = place(b, def, TEAM.PLAYER, 1);
    const foes = [1, 2, 3, 4, 5, 6].map((i) => place(b, DUMMIES.rat_knight, TEAM.ENEMY, i));
    for (const f of foes) { f.hp = f.maxHp = 10 ** 7; f.dodgeChance = () => 0; }
    ryn.baseCritChance = -1;
    const one = A.execute(def.abilities[0], ryn, foes[0], b).filter((r) => r.kind === 'damage');
    const two = A.execute(def.abilities[1], ryn, foes[0], b).filter((r) => r.kind === 'damage');
    assert(one.length === 1 && two.length === 1, 'a single-target swing spread out');
    assert(two[0].amount > one[0].amount, `140% (${two[0].amount}) did not beat 100% (${one[0].amount})`);
    assert(Math.abs(two[0].amount / one[0].amount - 1.4) < 0.02,
      `the two swings sit at ${(two[0].amount / one[0].amount).toFixed(2)}x, expected 1.4x`);

    const front = foes.filter((f) => f.slot.position === POSITION.FRONT);
    const swept = A.execute(def.abilities[2], ryn, null, b)
      .filter((r) => r.kind === 'damage').map((r) => r.target);
    assert(swept.length === front.length && swept.every((u) => front.includes(u)),
      'Scything Gale reached outside the enemy front row');
  }
});

test("Imani's kit: the chime picks its own victims, and answers their blessings", () => {
  const A = Abilities, H = HEROES;
  const def = H.imani;
  assert(def && def.element === 'wind' && def.rarity === 4, 'Imani drifted');
  assert(RACES.sectOf(def).id === 'whisperchime', 'Imani left the Whisperchime');
  assert(def.role === 'dps', 'Imani is not binned as damage');

  const arena = () => {
    const b = makeBattle();
    const imani = place(b, def, TEAM.PLAYER, 0);     // the centre hex
    const foes = [1, 2, 3, 4, 5, 6].map((i) => place(b, DUMMIES.rat_knight, TEAM.ENEMY, i));
    for (const f of foes) {
      f.hp = f.maxHp = 10 ** 7;
      f.dodgeChance = () => 0;
      f.debuffResistance = () => 0;
    }
    imani.baseCritChance = -1;
    return { b, imani, foes };
  };

  // ---- Skill 2 draws TWO distinct enemies; skill 3 draws THREE ----
  {
    const { b, imani, foes } = arena();
    for (const [ability, want] of [[def.abilities[1], 2], [def.abilities[2], 3]]) {
      const spread = new Set();
      for (let i = 0; i < 40; i++) {
        const hit = A.execute(ability, imani, null, b).filter((r) => r.kind === 'damage');
        assert(hit.length === want, `${ability.name} hit ${hit.length}, expected ${want}`);
        assert(new Set(hit.map((r) => r.target)).size === want,
          `${ability.name} rang the same bell twice`);
        hit.forEach((r) => spread.add(r.target));
      }
      assert(spread.size > want, `${ability.name} always chose the same enemies`);
    }
  }

  // A thin field simply gets everyone standing, not a crash.
  {
    const b = makeBattle();
    const imani = place(b, def, TEAM.PLAYER, 0);
    const lone = place(b, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    lone.hp = lone.maxHp = 10 ** 7;
    lone.dodgeChance = () => 0;
    const hit = A.execute(def.abilities[2], imani, null, b).filter((r) => r.kind === 'damage');
    assert(hit.length === 1 && hit[0].target === lone,
      `a one-enemy field took ${hit.length} hits`);
  }

  // ---- Skill 3 also drags at their speed ----
  {
    const { b, imani, foes } = arena();
    maxSkill(imani, 2);   // close the 50% gate on the drag
    const before = foes.map((f) => f.effectiveStat('speed'));
    const hit = A.execute(def.abilities[2], imani, null, b)
      .filter((r) => r.kind === 'damage').map((r) => r.target);
    for (const f of hit) {
      assert(f.statusEffects.some((fx) => fx.kind === 'debuff' && fx.stat === 'speed'),
        'a struck enemy kept its full speed');
    }
    const untouched = foes.filter((f) => !hit.includes(f));
    for (const f of untouched) {
      assert(f.effectiveStat('speed') === before[foes.indexOf(f)],
        'the peal slowed somebody it never rang for');
    }
  }

  // ---- Answering Bells: +20% per buff ON THE TARGET ----
  {
    const { b, imani, foes } = arena();
    const bare = foes[0], dressed = foes[1];
    dressed.effectiveStat = bare.effectiveStat.bind(bare);  // same defence
    const hit = (foe) => {
      const before = foe.hp;
      A.applyEffect({ type: 'damage', mult: 1.0 }, imani, foe, 1);
      return before - foe.hp;
    };
    const plain = hit(bare);
    for (let i = 0; i < 3; i++) {
      dressed.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.1, turns: 5 });
    }
    const loud = hit(dressed);
    assert(Math.abs(loud / plain - 1.6) < 0.03,
      `three blessings paid ${(loud / plain).toFixed(3)}x, expected 1.6x`);
    // And she is the mirror of Galen: he wants them bare, she wants them dressed.
    assert(H.galen.passive.hooks.damageDealtMult(imani, dressed) === 1 &&
      H.galen.passive.hooks.damageDealtMult(imani, bare) === 1.25,
      'the sect no longer pulls in two directions');
  }

  // ---- The centre hex pays attack ----
  {
    assert(def.positional.name === 'Chime Bar' && def.positional.stat === 'atk' &&
      def.positional.mult === 1.15, 'the centre bonus drifted');
    const b = makeBattle();
    const mid = place(b, def, TEAM.PLAYER, 0);
    const off = place(b, def, TEAM.PLAYER, 1);
    assert(mid.slot.position === POSITION.CENTER, 'slot 0 is not the middle hex');
    assert(mid.effectiveStat('atk') === Math.round(off.effectiveStat('atk') * 1.15),
      `centre ${mid.effectiveStat('atk')} vs off-centre ${off.effectiveStat('atk')}`);
  }
});

test("Wren's kit: her own bulk is the weapon, and the line gets rearranged", () => {
  const A = Abilities, H = HEROES;
  const def = H.wren;
  assert(def && def.element === 'wind' && def.rarity === 3, 'Wren drifted');
  assert(RACES.sectOf(def).id === 'whisperchime', 'Wren left the Whisperchime');
  assert(def.role === 'tank', 'Wren is not binned as a tank');

  // Her strips are wired to the skills they actually animate, not to
  // the numbers in their filenames.
  assert(def.sprite.strips.attack.src.endsWith('wrenskill3.png'), 'skill 1 lost its strip');
  assert(def.sprite.strips.skill3.src.endsWith('wrenskill1.png'), 'skill 3 lost its strip');
  assert(def.sprite.strips.skill2.src.includes('%20'), 'the spaced filename was not escaped');

  const arena = () => {
    const b = makeBattle();
    const wren = place(b, def, TEAM.PLAYER, 1);       // a front hex
    const foes = [1, 2, 3, 4, 5, 6].map((i) => place(b, DUMMIES.rat_knight, TEAM.ENEMY, i));
    for (const f of foes) {
      f.hp = f.maxHp = 10 ** 7;
      f.dodgeChance = () => 0;
      f.effectiveStat = () => 0;                     // no DEF curve in the way
    }
    wren.baseCritChance = -1;
    // Elemental matchup and her own out-of-place bonus both ride on top
    // of the HP scaling; the helper reports them so a test that only
    // cares about the 10%/15% can divide them back out.
    const riders = (foe) => g.Elements.mult('wind', foe.element) *
      wren.damageDealtMult(foe);
    return { b, wren, foes, riders };
  };

  // ---- Skills 1 and 2 are measured off HER pool ----
  {
    const { b, wren, foes, riders } = arena();
    const front = foes.filter((f) => f.slot.position === POSITION.FRONT);
    const want = front.map((f) => Math.round(wren.maxHp * 0.10 * riders(f)));
    A.execute(def.abilities[0], wren, null, b);
    front.forEach((f, i) => {
      const dealt = f.maxHp - f.hp;
      assert(Math.abs(dealt - want[i]) <= 2,
        `Breakwater dealt ${dealt}, expected ${want[i]} (10% of ${wren.maxHp} with riders)`);
    });
    for (const f of foes.filter((x) => !front.includes(x))) {
      assert(f.hp === f.maxHp, 'Breakwater reached past the front row');
    }
    const mark = foes[0];
    mark.hp = mark.maxHp;
    const want2 = Math.round(wren.maxHp * 0.15 * riders(mark));
    A.execute(def.abilities[1], wren, mark, b);
    assert(Math.abs((mark.maxHp - mark.hp) - want2) <= 2,
      `Shoulder Check dealt ${mark.maxHp - mark.hp}, expected ${want2}`);
  }

  // ---- Out You Come: the row trades hexes ----
  {
    const { b, wren, foes } = arena();
    const back = foes.find((f) => f.slot.position === POSITION.BACK);
    const rowFront = foes.find((f) => f.slot.position === POSITION.FRONT &&
      Math.abs(f.slot.y - back.slot.y) < 1);
    assert(rowFront, 'sanity: nobody is covering that back hex');
    const backHex = back.slot, frontHex = rowFront.slot;
    A.execute(def.abilities[2], wren, back, b);
    assert(back.slot === frontHex, 'the back-liner was not hauled forward');
    assert(rowFront.slot === backHex, 'the cover was not shoved in behind');
    assert(backHex.unit === rowFront && frontHex.unit === back,
      'the hexes disagree with the fighters standing on them');
    assert(back.slot.position === POSITION.FRONT &&
      rowFront.slot.position === POSITION.BACK, 'the swap did not change rank');
  }

  // Striking the front of a row trades the same pair — the move is
  // symmetric — and the middle column has no partner to trade with.
  {
    const { b, wren, foes } = arena();
    const f0 = foes.find((f) => f.slot.position === POSITION.FRONT);
    const partner = foes.find((f) => f.slot.position === POSITION.BACK &&
      Math.abs(f.slot.y - f0.slot.y) < 1);
    A.execute(def.abilities[2], wren, f0, b);
    assert(f0.slot.position === POSITION.BACK && partner.slot.position === POSITION.FRONT,
      'the trade did not work from the front end of the row');

    const b2 = makeBattle();
    const w2 = place(b2, def, TEAM.PLAYER, 1);
    const mid = place(b2, DUMMIES.rat_knight, TEAM.ENEMY, 0);
    mid.hp = mid.maxHp = 10 ** 7; mid.dodgeChance = () => 0;
    const hex = mid.slot;
    A.execute(def.abilities[2], w2, mid, b2);
    assert(mid.slot === hex, 'the middle column was dragged somewhere');
  }

  // ---- Out Of Place: 30% more into anyone standing wrong ----
  {
    const { b, wren, foes } = arena();
    const settled = foes.find((f) => f.positionalActive());
    const displaced = foes.find((f) => f.positional && !f.positionalActive());
    assert(settled && displaced, 'sanity: need one enemy in place and one out of it');
    assert(Math.abs(wren.damageDealtMult(settled) - 1) < 1e-9,
      'she billed an enemy standing in the right hex');
    assert(Math.abs(wren.damageDealtMult(displaced) - 1.30) < 1e-9,
      'the out-of-place bonus drifted');
    // And her own skill 3 creates the condition it profits from.
    const back = foes.find((f) => f.slot.position === POSITION.BACK &&
      f.positionalActive());
    if (back) {
      A.execute(def.abilities[2], wren, back, b);
      assert(Math.abs(wren.damageDealtMult(back) - 1.30) < 1e-9,
        'hauling them out did not put them out of place');
    }
  }

  // ---- The front hex is the tank bonus, and it feeds her damage ----
  {
    assert(def.positional.name === 'Windbreak' && def.positional.stat === 'hp' &&
      def.positional.mult === 1.20, 'the front-hex bonus drifted');
    // A max-HP positional is applied once, AT PLACEMENT, so this one
    // has to go through a real Battle rather than the stand-in.
    const real = new Battle();
    const front = new Unit(def, TEAM.PLAYER, { level: 30, stars: 3 });
    const back = new Unit(def, TEAM.PLAYER, { level: 30, stars: 3 });
    real.placeUnit(front, 1);
    real.placeUnit(back, 5);
    assert(front.slot.position === POSITION.FRONT &&
      back.slot.position === POSITION.BACK, 'sanity: those are not opposite rows');
    assert(front.maxHp === Math.round(back.maxHp * 1.20),
      `front ${front.maxHp} vs back ${back.maxHp}`);
    assert(front.hp === front.maxHp, 'the bonus left her short of full');
  }
});

test("Asher's kit: he wears what he takes, and shuts the door behind him", () => {
  const A = Abilities, H = HEROES;
  const def = H.asher;
  assert(def && def.element === 'wind' && def.rarity === 5, 'Asher drifted');
  assert(RACES.sectOf(def).id === 'whisperchime', 'Asher left the Whisperchime');
  assert(def.role === 'dps', 'Asher is not binned as a DPS');

  const arena = () => {
    const b = makeBattle();
    const asher = place(b, def, TEAM.PLAYER, 1);      // a front hex
    const foes = [1, 2].map((i) => place(b, DUMMIES.rat_knight, TEAM.ENEMY, i));
    for (const f of foes) {
      f.hp = f.maxHp = 10 ** 7;
      f.dodgeChance = () => 0;
      f.debuffResistance = () => 0;
      f.effectiveStat = () => 0;
    }
    asher.baseCritChance = -1;
    return { b, asher, foes };
  };

  // ---- Helping Myself moves the buff, it does not destroy it ----
  {
    const { b, asher, foes } = arena();
    const mark = foes[0];
    mark.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.4, turns: 4 });
    maxSkill(asher, 1);   // close the 50% gate on the theft
    const res = A.execute(def.abilities[1], asher, mark, b);
    const steal = res.find((r) => r.kind === 'stealBuff');
    assert(steal && steal.count === 1, `stole ${steal && steal.count}, wanted 1`);
    assert(!mark.statusEffects.some((fx) => fx.kind === 'buff'),
      'the buff is still on the victim');
    const worn = asher.statusEffects.filter((fx) => fx.kind === 'buff');
    assert(worn.length === 1 && worn[0].stat === 'atk' && worn[0].mult === 1.4,
      'the stolen buff did not arrive intact');
    assert(worn[0].turns === 4, `stolen buff kept ${worn[0].turns} turns, wanted 4`);
    assert(worn[0].source === asher, 'the stolen buff still credits its old caster');
  }

  // ---- Nothing For You takes two and seals the target ----
  {
    const { b, asher, foes } = arena();
    const mark = foes[0];
    for (const stat of ['atk', 'def', 'speed']) {
      mark.addStatusEffect({ kind: 'buff', stat, mult: 1.2, turns: 3 });
    }
    maxSkill(asher, 2);   // close the 50% gates on the theft and the seal
    A.execute(def.abilities[2], asher, mark, b);
    assert(mark.statusEffects.filter((fx) => fx.kind === 'buff').length === 1,
      'Nothing For You did not take exactly two');
    assert(asher.statusEffects.filter((fx) => fx.kind === 'buff').length === 2,
      'Asher is not wearing both of them');
    assert(mark.buffsSealed(), 'the target was not sealed');
    const seal = mark.statusEffects.find((fx) => fx.stat === 'buffblock');
    assert(seal.kind === 'debuff' && seal.turns === 3,
      'the seal is not a 3-turn debuff');

    // Sealed means sealed, from every direction: the ability path
    // reports it, and a raw hook-style call is refused outright.
    const before = mark.statusEffects.length;
    const blocked = A.applyEffect({ type: 'buff', stat: 'atk', mult: 1.5, turns: 2 },
      asher, mark, 1);
    assert(blocked.sealed, 'a buff cast onto a sealed target was not reported as sealed');
    assert(mark.addStatusEffect({ kind: 'buff', stat: 'def', mult: 2, turns: 2 }) === false,
      'addStatusEffect let a buff through the seal');
    assert(mark.statusEffects.length === before, 'something got onto a sealed target');

    // A heal-over-time is not a stat buff and still lands.
    mark.addStatusEffect({ kind: 'hot', amount: 10, turns: 2 });
    assert(mark.statusEffects.some((fx) => fx.kind === 'hot'),
      'the seal wrongly swallowed a heal-over-time');

    // And it expires like any other debuff.
    for (let i = 0; i < 3; i++) mark.tickStatusEffects();
    assert(!mark.buffsSealed(), 'the seal outlived its three turns');
  }

  // ---- A resisted theft leaves the blessing where it was ----
  {
    const { b, asher, foes } = arena();
    const mark = foes[0];
    mark.debuffResistance = () => 10;               // nothing gets through
    mark.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.4, turns: 4 });
    // Max the skill so the 50% gate is shut: what is measured here is
    // the RESIST that follows it. At level 1 a 0.99 roll would fail the
    // gate and never reach the contest -- which is exactly the
    // distinction the two readouts exist to draw.
    maxSkill(asher, 1);
    const R = g.Math;                       // the sandbox's own Math
    R.random = () => 0.99;
    let res;
    try { res = A.execute(def.abilities[1], asher, mark, b); }
    finally { delete R.random; }
    const steal = res.find((r) => r.kind === 'stealBuff');
    assert(steal && steal.resisted, 'the theft was not contested');
    assert(mark.statusEffects.some((fx) => fx.kind === 'buff'),
      'a resisted theft still took the buff');
    assert(!asher.statusEffects.some((fx) => fx.kind === 'buff'),
      'a resisted theft still dressed the thief');
  }

  // ---- Borrowed Weather pays 25% per buff HE is wearing ----
  {
    const { asher, foes } = arena();
    const mark = foes[0];
    assert(asher.damageDealtMult(mark) === 1, 'an unbuffed Asher is not at 1.00');
    asher.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.1, turns: 5 });
    assert(Math.abs(asher.damageDealtMult(mark) - 1.25) < 1e-9,
      `one buff gave ${asher.damageDealtMult(mark)}, wanted 1.25`);
    asher.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.1, turns: 5 });
    asher.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.1, turns: 5 });
    assert(Math.abs(asher.damageDealtMult(mark) - 1.75) < 1e-9,
      `three buffs gave ${asher.damageDealtMult(mark)}, wanted 1.75`);
    // The count is buffs only: a shield or a debuff pays nothing.
    asher.addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.8, turns: 5 });
    assert(Math.abs(asher.damageDealtMult(mark) - 1.75) < 1e-9,
      'a debuff was counted as a blessing');
  }

  // ---- Skill 2 is a real self-combo: the theft feeds the next swing ----
  {
    const { b, asher, foes } = arena();
    const mark = foes[0];
    mark.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.4, turns: 4 });
    maxSkill(asher, 1);   // close the 50% gate so the combo actually starts
    A.execute(def.abilities[1], asher, mark, b);
    const after = asher.damageDealtMult(mark);
    assert(Math.abs(after - 1.25) < 1e-9,
      `after one theft Asher hits at ${after}, wanted 1.25`);
  }

  // ---- The front hex sharpens him, because he has to connect ----
  {
    assert(def.positional.name === 'Clapper' &&
      def.positional.position === POSITION.FRONT &&
      def.positional.hooks.accuracyAdd === 0.30, 'the front-hex bonus drifted');
    const b = makeBattle();
    const on = place(b, def, TEAM.PLAYER, 1);
    const off = place(b, def, TEAM.PLAYER, 5);
    assert(on.slot.position === POSITION.FRONT &&
      off.slot.position === POSITION.BACK, 'sanity: those are not opposite rows');
    assert(Math.abs((on.debuffAccuracy() - off.debuffAccuracy()) - 0.30) < 1e-9,
      `front ${on.debuffAccuracy()} vs back ${off.debuffAccuracy()}`);
  }
});

test("Noctelle's kit: the wound and the mend are the same number", () => {
  const A = Abilities, H = HEROES;
  const def = H.noctelle;
  assert(def && def.element === 'dark' && def.rarity === 3, 'Noctelle drifted');
  assert(RACES.sectOf(def).id === 'nightflower', 'Noctelle left the Nightflowers');
  assert(def.role === 'support', 'Noctelle is not binned as a support');

  // `back` picks which hex she stands on: her own back hex turns the
  // drain into a second mend, so the tests that care about the plain
  // drain put her somewhere else.
  const arena = (back = false) => {
    const b = makeBattle();
    const noc = place(b, def, TEAM.PLAYER, back ? 5 : 1);
    const allies = [2, 3].map((i) => place(b, DUMMIES.rat_knight, TEAM.PLAYER, i));
    const foes = [1, 2, 3].map((i) => place(b, DUMMIES.rat_knight, TEAM.ENEMY, i));
    for (const f of foes) {
      f.hp = f.maxHp = 10 ** 7;
      f.dodgeChance = () => 0;
      f.debuffResistance = () => 0;
      f.effectiveStat = () => 0;                     // no DEF curve in the way
    }
    for (const a of allies) { a.maxHp = 5000; a.hp = 1000; }
    noc.baseCritChance = -1;
    return { b, noc, allies, foes };
  };

  // ---- Silent Wing: 10% of HER pool, handed to whoever is worst off ----
  {
    const { b, noc, allies, foes } = arena();
    allies[0].hp = 400;                              // the one in the worst shape
    allies[1].hp = 3000;
    noc.hp = noc.maxHp;
    const before = allies[0].hp;
    const res = A.execute(def.abilities[0], noc, foes[0], b);
    const hit = res.find((r) => r.kind === 'damage');
    const mend = res.find((r) => r.kind === 'heal');
    const want = Math.round(noc.maxHp * 0.10 * g.Elements.mult('dark', foes[0].element));
    assert(Math.abs(hit.amount - want) <= 1,
      `Silent Wing dealt ${hit.amount}, expected ${want} (10% of ${noc.maxHp})`);
    assert(mend && mend.target === allies[0],
      'the mend did not find the ally in the worst shape');
    assert(mend.amount === hit.amount,
      `mended ${mend.amount} for a wound of ${hit.amount}`);
    assert(allies[0].hp === before + hit.amount, 'the ally did not actually gain it');
    assert(allies[1].hp === 3000, 'the healthier ally was mended instead');
    // Off her own hex, the drain feeds one person only.
    assert(res.filter((r) => r.kind === 'heal').length === 1,
      'the drain paid twice from the wrong hex');
  }

  // ---- Nightbloom: 20% of her pool, and one debuff lifted ----
  {
    const { b, noc, allies } = arena();
    const mark = allies[0];
    mark.hp = 1000;
    mark.addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.7, turns: 4 });
    mark.addStatusEffect({ kind: 'debuff', stat: 'def', mult: 0.7, turns: 4 });
    const res = A.execute(def.abilities[1], noc, mark, b);
    const mend = res.find((r) => r.kind === 'heal');
    assert(mend.amount === Math.round(noc.maxHp * 0.20),
      `Nightbloom mended ${mend.amount}, expected ${Math.round(noc.maxHp * 0.20)}`);
    assert(mark.statusEffects.filter((fx) => fx.kind === 'debuff').length === 1,
      'Nightbloom lifted the wrong number of debuffs');
  }

  // ---- Moth Dust: the back row, slowed, and doubled against Wind ----
  {
    const { b, noc, foes } = arena();
    maxSkill(noc, 2);   // close the 50% gate on the dust
    const back = foes.filter((f) => f.slot.position === POSITION.BACK);
    assert(back.length > 0, 'sanity: no enemy back row to hit');
    const res = A.execute(def.abilities[2], noc, back[0], b);
    const hits = res.filter((r) => r.kind === 'damage');
    assert(hits.length === back.length,
      `Moth Dust hit ${hits.length} of ${back.length} back-row enemies`);
    for (const f of back) {
      assert(f.statusEffects.some((fx) => fx.kind === 'debuff' && fx.stat === 'speed' &&
        fx.mult === 0.70 && fx.turns === 2), `${f.def.id} was not slowed`);
    }
    // Moth Dust drains nobody: only Silent Wing carries the rider.
    assert(!res.some((r) => r.kind === 'heal'), 'Moth Dust mended someone');
  }

  // ---- Dust On The Wind doubles ONE skill, against ONE element ----
  {
    const { b, noc, foes } = arena();
    // Moth Dust only reaches the BACK row, so the target it is measured
    // against has to be standing there.
    const mark = foes.find((f) => f.slot.position === POSITION.BACK);
    assert(mark, 'sanity: no enemy back row to measure against');
    const dust = def.abilities[2], wing = def.abilities[0];
    const windy = { element: 'wind' }, dusty = { element: 'dark' };
    assert(noc.damageDealtMult(windy, dust) === 2,
      'Moth Dust is not doubled against a Wind hero');
    assert(noc.damageDealtMult(dusty, dust) === 1,
      'Moth Dust is doubled against something that is not Wind');
    assert(noc.damageDealtMult(windy, wing) === 1,
      'Silent Wing rode the Moth Dust bonus');
    assert(noc.damageDealtMult(windy, null) === 1,
      'the bonus fired with no ability in hand');

    // And it shows up in the damage, not just the multiplier: the same
    // skill into a Wind target lands for twice what a Dark one takes.
    mark.element = 'dark';
    const plain = (() => { const h = mark.hp;
      A.applyEffect({ type: 'damageHp', mult: 0.10 }, noc, mark, 1); return h - mark.hp; })();
    mark.element = 'wind';
    const doubled = A.execute(dust, noc, mark, b)
      .filter((r) => r.kind === 'damage' && r.target === mark)[0];
    const elem = g.Elements.mult('dark', 'wind') / g.Elements.mult('dark', 'dark');
    assert(Math.abs(doubled.amount / (plain * elem) - 2) < 0.02,
      `Moth Dust into Wind dealt ${doubled.amount} vs ${plain} plain`);
  }

  // ---- Lamplight: on her back hex the drain feeds her too ----
  {
    assert(def.positional.name === 'Lamplight' &&
      def.positional.position === POSITION.BACK &&
      def.positional.hooks.drainSelfShare === 1, 'the back-hex bonus drifted');
    const { b, noc, allies, foes } = arena(true);
    assert(noc.slot.position === POSITION.BACK, 'sanity: she is not on a back hex');
    allies[0].hp = 400;
    noc.hp = Math.round(noc.maxHp * 0.5);
    const before = noc.hp;
    const res = A.execute(def.abilities[0], noc, foes[0], b);
    const hit = res.find((r) => r.kind === 'damage');
    const mends = res.filter((r) => r.kind === 'heal');
    assert(mends.length === 2, `the hex paid ${mends.length} mends, wanted 2`);
    const mine = mends.find((m) => m.target === noc);
    assert(mine && mine.amount === hit.amount,
      `she kept ${mine && mine.amount} of a ${hit.amount} wound`);
    // She spends 10% of her pool and gets the same back, so the skill
    // is free to her -- that is the whole point of the hex.
    assert(noc.hp === Math.min(noc.maxHp, before + hit.amount),
      'the self-mend did not land');
  }

  // ---- She is an ally too: alone, the drain simply comes back ----
  {
    const b = makeBattle();
    const noc = place(b, def, TEAM.PLAYER, 1);
    const foe = place(b, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    foe.hp = foe.maxHp = 10 ** 7;
    foe.dodgeChance = () => 0;
    foe.effectiveStat = () => 0;
    noc.baseCritChance = -1;
    noc.hp = Math.round(noc.maxHp * 0.5);
    const before = noc.hp;
    const res = A.execute(def.abilities[0], noc, foe, b);
    const hit = res.find((r) => r.kind === 'damage');
    assert(noc.hp === before + hit.amount,
      'with nobody else standing, the drain went nowhere');
  }
});

test("Sable's kit: he plants ordinary poison, then calls it all due at once", () => {
  const A = Abilities, H = HEROES;
  const def = H.sable;
  assert(def && def.element === 'dark' && def.rarity === 3, 'Sable drifted');
  assert(RACES.sectOf(def).id === 'nightflower', 'Sable left the Nightflowers');
  assert(def.role === 'dps', 'Sable is not binned as a DPS');

  // The seed is the game's ORDINARY poison -- no bespoke flavor, so it
  // wears the plate every player already reads at a glance.
  for (const ab of [def.abilities[0], def.abilities[2]]) {
    const dot = ab.effects.find((e) => e.type === 'dot');
    assert(dot, `${ab.id} plants nothing`);
    assert(dot.flavor === undefined, `${ab.id} invented a debuff flavour`);
    assert(dot.pct === 0.30 && dot.turns === 3, `${ab.id}'s poison drifted`);
  }

  const arena = (back = false) => {
    const b = makeBattle();
    const sable = place(b, def, TEAM.PLAYER, back ? 5 : 1);
    const foes = [1, 2, 3].map((i) => place(b, DUMMIES.rat_knight, TEAM.ENEMY, i));
    for (const f of foes) {
      f.hp = f.maxHp = 10 ** 7;
      f.dodgeChance = () => 0;
      f.debuffResistance = () => 0;
      f.effectiveStat = () => 0;
    }
    sable.baseCritChance = -1;
    return { b, sable, foes };
  };

  // ---- Seedfall reaches two distinct enemies and seeds both ----
  {
    const { b, sable, foes } = arena();
    assert(def.abilities[0].targeting === 'random-enemies' &&
      def.abilities[0].targetCount === 2, 'Seedfall stopped scattering');
    maxSkill(sable, 0);   // close the 50% gate on the seed
    const res = A.execute(def.abilities[0], sable, null, b);
    const hits = res.filter((r) => r.kind === 'damage');
    assert(hits.length === 2, `Seedfall hit ${hits.length}, wanted 2`);
    assert(hits[0].target !== hits[1].target, 'Seedfall seeded the same enemy twice');
    for (const h of hits) {
      assert(h.target.statusEffects.some((fx) => fx.kind === 'dot'),
        `${h.target.def.id} took the hit but no seed`);
    }
    // Untouched enemies stay clean.
    const seeded = new Set(hits.map((h) => h.target));
    for (const f of foes) {
      if (seeded.has(f)) continue;
      assert(!f.statusEffects.some((fx) => fx.kind === 'dot'),
        'an enemy Seedfall never reached was poisoned anyway');
    }
  }

  // ---- Grave Garden seeds the whole field ----
  {
    const { b, sable, foes } = arena();
    maxSkill(sable, 2);   // close the 50% gate on the seed
    const res = A.execute(def.abilities[2], sable, null, b);
    assert(res.filter((r) => r.kind === 'damage').length === foes.length,
      'Grave Garden missed part of the field');
    for (const f of foes) {
      assert(f.statusEffects.some((fx) => fx.kind === 'dot'), `${f.def.id} went unseeded`);
    }
  }

  // ---- Open The Flower pays exactly what waiting would have ----
  {
    const { b, sable, foes } = arena();
    maxSkill(sable, 2);                            // close the seed's gate
    A.execute(def.abilities[2], sable, null, b);   // seed everyone
    const owed = foes.map((f) => f.statusEffects
      .filter((fx) => fx.kind === 'dot')
      .reduce((n, fx) => n + fx.amount * fx.turns, 0));
    assert(owed.every((n) => n > 0), 'nothing was owed to detonate');
    const before = foes.map((f) => f.hp);
    const res = A.execute(def.abilities[1], sable, null, b);
    const blasts = res.filter((r) => r.kind === 'detonate');
    assert(blasts.length === foes.length, `detonated ${blasts.length} of ${foes.length}`);
    foes.forEach((f, i) => {
      assert(before[i] - f.hp === owed[i],
        `${f.def.id} paid ${before[i] - f.hp} for ${owed[i]} owed`);
      assert(!f.statusEffects.some((fx) => fx.kind === 'dot'),
        'the poison survived its own detonation');
    });
    // A clean field detonates to nothing rather than misreporting.
    const again = A.execute(def.abilities[1], sable, null, b);
    assert(!again.some((r) => r.kind === 'detonate'),
      'an unseeded field still reported a detonation');
  }

  // ---- Any poison is a fuse, not only his own ----
  {
    const { b, sable, foes } = arena();
    const mark = foes[0];
    // A burn from someone else entirely.
    mark.addStatusEffect({ kind: 'dot', flavor: 'burn', amount: 200, turns: 2,
      source: foes[1] });
    const before = mark.hp;
    const res = A.execute(def.abilities[1], sable, mark, b);
    const blast = res.find((r) => r.kind === 'detonate' && r.target === mark);
    assert(blast && before - mark.hp === 400,
      `a borrowed burn paid ${before - mark.hp}, wanted 400`);
  }

  // ---- What Grows Back pays only for a POISONED enemy corpse ----
  {
    const { b, sable, foes } = arena();
    const prev = Battle.active;
    Battle.active = b;
    try {
      sable.turnMeter = 0;
      // An unpoisoned enemy dying pays nothing.
      foes[0].hp = 1;
      foes[0].takeDamage(50);
      assert(!foes[0].alive, 'sanity: the enemy did not die');
      assert(sable.turnMeter === 0, 'an unseeded corpse paid out');
      // A poisoned one pays 15 AP.
      foes[1].addStatusEffect({ kind: 'dot', amount: 10, turns: 2, source: sable });
      foes[1].hp = 1;
      foes[1].takeDamage(50);
      assert(!foes[1].alive, 'sanity: the poisoned enemy did not die');
      assert(Math.abs(sable.turnMeter - CONFIG.TURN_METER_MAX * 0.15) < 1e-6,
        `a poisoned corpse paid ${sable.turnMeter}`);
      // An ALLY dying poisoned pays nothing -- the hook rings for both
      // sides, so the side check has to be real.
      const mate = place(b, DUMMIES.rat_brawler, TEAM.PLAYER, 2);
      mate.addStatusEffect({ kind: 'dot', amount: 10, turns: 2, source: foes[2] });
      const held = sable.turnMeter;
      mate.hp = 1;
      mate.takeDamage(10 ** 7);
      assert(!mate.alive, 'sanity: the ally did not die');
      assert(sable.turnMeter === held, 'a fallen ally paid Sable');
    } finally { Battle.active = prev; }
  }

  // ---- Deep Roots makes the seed bite harder from the back hex ----
  {
    assert(def.positional.name === 'Deep Roots' &&
      def.positional.position === POSITION.BACK &&
      def.positional.hooks.dotBoostAdd === 0.30, 'the back-hex bonus drifted');
    const back = arena(true), front = arena(false);
    assert(back.sable.slot.position === POSITION.BACK &&
      front.sable.slot.position !== POSITION.BACK, 'sanity: same hex twice');
    const seedOn = (a) => {
      maxSkill(a.sable, 2);   // close the seed's gate on both hexes
      A.execute(def.abilities[2], a.sable, null, a.b);
      return a.foes[0].statusEffects.find((fx) => fx.kind === 'dot').amount;
    };
    const deep = seedOn(back), shallow = seedOn(front);
    assert(Math.abs(deep / shallow - 1.30) < 0.02,
      `back hex seeded ${deep} vs ${shallow} off it`);
  }
});

test("Evelune's kit: she creates almost nothing and multiplies everything", () => {
  const A = Abilities, H = HEROES;
  const def = H.evelune;
  assert(def && def.element === 'dark' && def.rarity === 4, 'Evelune drifted');
  assert(RACES.sectOf(def).id === 'nightflower', 'Evelune left the Nightflowers');
  assert(def.role === 'support', 'Evelune is not binned as a support');

  const arena = (centre = false) => {
    const b = makeBattle();
    const eve = place(b, def, TEAM.PLAYER, centre ? 0 : 1);
    const mates = [2, 3].map((i) => place(b, DUMMIES.rat_knight, TEAM.PLAYER, i));
    const foes = [1, 2].map((i) => place(b, DUMMIES.rat_brawler, TEAM.ENEMY, i));
    for (const f of foes) {
      f.hp = f.maxHp = 10 ** 7;
      f.dodgeChance = () => 0;
      f.debuffResistance = () => 0;
      f.effectiveStat = () => 0;
    }
    for (const m of mates) { m.maxHp = 6000; m.hp = 2000; }
    eve.baseCritChance = -1;
    return { b, eve, mates, foes };
  };
  // The spread is a coin the tests do not want flipped under them.
  const noSpread = (fn) => {
    const R = g.Math; R.random = () => 0.99;
    try { return fn(); } finally { delete R.random; }
  };

  // ---- Struck Note: damage, and 20 AP off the target ----
  {
    const { b, eve, foes } = arena();
    const mark = foes[0];
    maxSkill(eve, 0);   // close the 50% gate on the discord
    mark.turnMeter = CONFIG.TURN_METER_MAX * 0.8;
    const before = mark.turnMeter;
    const res = noSpread(() => A.execute(def.abilities[0], eve, mark, b));
    assert(res.some((r) => r.kind === 'damage' && r.amount > 0), 'the note did no damage');
    assert(Math.abs(before - mark.turnMeter - CONFIG.TURN_METER_MAX * 0.20) < 1e-6,
      `the drain took ${before - mark.turnMeter}, wanted 20 AP`);
  }

  // ---- Play It Again hands the team a turn back ----
  {
    const { b, eve, mates } = arena();
    for (const m of mates) for (const a of m.abilities) a.cooldownRemaining = 3;
    // One skill already ready must not be driven negative.
    mates[0].abilities[0].cooldownRemaining = 0;
    // Evelune's own refresh must not refresh itself.
    const self = eve.abilities.find((a) => a.def.id === 'evelune_play_it_again');
    self.cooldownRemaining = 4;
    eve.abilities[2].cooldownRemaining = 5;
    noSpread(() => A.execute(def.abilities[1], eve, null, b));
    for (const m of mates) {
      for (const a of m.abilities) {
        assert(a.cooldownRemaining >= 0, 'a cooldown went negative');
      }
      assert(m.abilities[1].cooldownRemaining === 2, 'an ally kept its full cooldown');
      assert(m.abilities[0].cooldownRemaining === 0 ||
        m.abilities[0].cooldownRemaining === 2, 'a ready skill was disturbed');
    }
    assert(mates[0].abilities[0].cooldownRemaining === 0,
      'a skill already ready was pushed below zero');
    assert(self.cooldownRemaining === 4,
      `Play It Again refreshed itself to ${self.cooldownRemaining}`);
    assert(eve.abilities[2].cooldownRemaining === 4,
      'Evelune did not get her OTHER skills back');
  }

  // ---- Hold The Chord: a mend, and one more turn on every blessing ----
  {
    const { b, eve, mates } = arena();
    const mate = mates[0];
    mate.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.2, turns: 2 });
    mate.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.2, turns: 1 });
    mate.addStatusEffect({ kind: 'debuff', stat: 'speed', mult: 0.8, turns: 3 });
    const hp = mate.hp;
    noSpread(() => A.execute(def.abilities[2], eve, null, b));
    assert(mate.hp - hp === Math.round(eve.maxHp * 0.15),
      `the chord mended ${mate.hp - hp}, wanted ${Math.round(eve.maxHp * 0.15)}`);
    const buffs = mate.statusEffects.filter((fx) => fx.kind === 'buff');
    assert(buffs.find((fx) => fx.stat === 'atk').turns === 3 &&
      buffs.find((fx) => fx.stat === 'def').turns === 2, 'the blessings did not hold');
    assert(mate.statusEffects.find((fx) => fx.kind === 'debuff').turns === 3,
      'the chord extended a DEBUFF');
    // It creates nothing: an unblessed ally simply gets the mend.
    assert(mates[1].statusEffects.filter((fx) => fx.kind === 'buff').length === 0,
      'the chord invented a blessing out of nothing');
  }

  // ---- The Chord Carries: a quarter of every blessing reaches a second ally ----
  {
    const { b, eve, mates } = arena();
    const prev = Battle.active;
    Battle.active = b;
    const R = g.Math;
    try {
      // Rolled in: the blessing lands twice, with the time it had left.
      R.random = () => 0.01;
      mates[0].addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.5, turns: 3 });
      const elsewhere = [eve, mates[1]].filter((u) =>
        u.statusEffects.some((fx) => fx.kind === 'buff' && fx.stat === 'atk'));
      assert(elsewhere.length === 1, `the chord carried to ${elsewhere.length} allies`);
      const copy = elsewhere[0].statusEffects.find((fx) => fx.stat === 'atk');
      assert(copy.mult === 1.5 && copy.turns === 3, 'the copy lost its terms');
      // ...and it does NOT carry again from the copy.
      const total = b.livingUnits(TEAM.PLAYER)
        .reduce((n, u) => n + u.statusEffects.filter((fx) => fx.kind === 'buff').length, 0);
      assert(total === 2, `one blessing became ${total}`);
      // Rolled out: nothing spreads.
      R.random = () => 0.99;
      mates[0].addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.2, turns: 2 });
      assert(!mates[1].statusEffects.some((fx) => fx.stat === 'def') &&
        !eve.statusEffects.some((fx) => fx.stat === 'def'),
        'a failed roll spread anyway');
      // A DEBUFF never carries, however the coin lands.
      R.random = () => 0.01;
      mates[0].addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.7, turns: 2 });
      assert(!mates[1].statusEffects.some((fx) => fx.kind === 'debuff'),
        'the chord carried a curse');
    } finally { delete R.random; Battle.active = prev; }
  }

  // ---- A sealed ally is never a destination ----
  {
    const { b, eve, mates } = arena();
    const prev = Battle.active;
    Battle.active = b;
    const R = g.Math;
    try {
      for (const u of [eve, mates[1]]) {
        u.addStatusEffect({ kind: 'debuff', stat: 'buffblock', turns: 3 });
      }
      R.random = () => 0.01;
      mates[0].addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.5, turns: 3 });
      assert(!eve.statusEffects.some((fx) => fx.kind === 'buff') &&
        !mates[1].statusEffects.some((fx) => fx.kind === 'buff'),
        'the chord carried onto a sealed ally');
    } finally { delete R.random; Battle.active = prev; }
  }

  // ---- First Chair: the middle of the ring plays faster ----
  {
    assert(def.positional.name === 'First Chair' &&
      def.positional.position === POSITION.CENTER &&
      def.positional.stat === 'speed' && def.positional.mult === 1.25,
      'the centre-hex bonus drifted');
    const { eve: mid } = arena(true);
    const { eve: off } = arena(false);
    assert(mid.slot.position === POSITION.CENTER &&
      off.slot.position !== POSITION.CENTER, 'sanity: same hex twice');
    assert(mid.effectiveStat('speed') === Math.round(off.effectiveStat('speed') * 1.25),
      `centre ${mid.effectiveStat('speed')} vs off-centre ${off.effectiveStat('speed')}`);
  }
});

test("Lysandra's kit: one thread, and their own line kills their carry", () => {
  const A = Abilities, H = HEROES;
  const def = H.lysandra;
  assert(def && def.element === 'dark' && def.rarity === 4, 'Lysandra drifted');
  assert(RACES.sectOf(def).id === 'nightflower', 'Lysandra left the Nightflowers');
  assert(def.role === 'dps', 'Lysandra is not binned as a DPS');

  const arena = (front = true) => {
    const b = makeBattle();
    const ly = place(b, def, TEAM.PLAYER, front ? 1 : 5);
    const foes = [1, 2, 3, 4].map((i) => place(b, DUMMIES.rat_knight, TEAM.ENEMY, i));
    for (const f of foes) {
      f.hp = f.maxHp = 10 ** 7;
      f.dodgeChance = () => 0;
      f.debuffResistance = () => 0;
      f.effectiveStat = () => 0;
    }
    ly.baseCritChance = -1;
    return { b, ly, foes };
  };
  const live = (b, fn) => {
    const prev = Battle.active; Battle.active = b;
    try { return fn(); } finally { Battle.active = prev; }
  };

  // ---- Running Stitch mends her for a fifth of what it cost them ----
  {
    const { b, ly, foes } = arena();
    ly.hp = Math.round(ly.maxHp * 0.5);
    const before = ly.hp;
    const res = live(b, () => A.execute(def.abilities[0], ly, foes[0], b));
    const hit = res.find((r) => r.kind === 'damage');
    const mend = res.find((r) => r.kind === 'heal');
    assert(mend && mend.target === ly, 'the stitch mended nobody');
    assert(mend.amount === Math.round(hit.amount * 0.20),
      `mended ${mend.amount} for a ${hit.amount} cut`);
    assert(ly.hp === before + mend.amount, 'she did not actually gain it');
  }

  // ---- Slip Knot catches the front row and taunts it ----
  {
    const { b, ly, foes } = arena();
    const front = foes.filter((f) => f.slot.position === POSITION.FRONT);
    assert(front.length > 0, 'sanity: no enemy front row');
    maxSkill(ly, 1);   // close the 50% gate on the loop
    live(b, () => A.execute(def.abilities[1], ly, null, b));
    for (const f of foes) {
      const pulled = f.statusEffects.some((fx) => fx.stat === 'taunted');
      assert(pulled === front.includes(f),
        `${f.def.id} on the ${f.slot.position} hex was ${pulled ? '' : 'not '}taunted`);
    }
  }

  // ---- Soul Bond: everything she takes, they take, unmitigated ----
  {
    const { b, ly, foes } = arena();
    const mark = foes[0];
    const bystander = foes[1];
    live(b, () => A.execute(def.abilities[2], ly, mark, b));
    assert(mark.statusEffects.some((fx) => fx.stat === 'soulbond' && fx.source === ly),
      'the thread did not tie');
    const theirs = mark.hp, others = bystander.hp, hers = ly.hp;
    live(b, () => ly.takeDamage(500));
    assert(hers - ly.hp === 500, 'she did not take the blow herself');
    assert(theirs - mark.hp === 500,
      `the bond paid ${theirs - mark.hp} for a 500 blow`);
    assert(bystander.hp === others, 'an unbound enemy paid too');

    // A shield of hers is HER business: the thread still pays in full.
    ly.addStatusEffect({ kind: 'shield', amount: 10 ** 6, turns: 5 });
    const t2 = mark.hp, h2 = ly.hp;
    live(b, () => ly.takeDamage(400));
    assert(ly.hp === h2, 'sanity: the shield did not hold');
    assert(t2 - mark.hp === 400, 'the thread stopped paying behind a shield');
    ly.statusEffects = ly.statusEffects.filter((fx) => fx.kind !== 'shield');

    // Poison she is carrying pays the thread too -- ALL damage counts.
    const t3 = mark.hp;
    live(b, () => ly.takeDamage(37));
    assert(t3 - mark.hp === 37, 'a small tick did not carry');
  }

  // ---- One thread at a time, and it frees on death ----
  {
    const { b, ly, foes } = arena();
    const bond = def.abilities[2];
    assert(bond.blockedWhile === 'soulbond', 'the gate came off Soul Bond');
    const state = ly.abilities.find((a) => a.def === bond);
    live(b, () => {
      A.execute(bond, ly, foes[0], b);
      state.cooldownRemaining = 0;                  // cooldown is not the gate
      assert(ly.blockedByOwnStatus(bond), 'a second thread was allowed');
      assert(!ly.readyAbilities().some((a) => a.def === bond),
        'Soul Bond is offered while its own thread holds');
      // Cut the thread and it comes back.
      A.applyEffect({ type: 'cleanse' }, ly, foes[0], 1);
      assert(!ly.blockedByOwnStatus(bond), 'cutting the thread did not free it');
      // Tie it again, then kill the far end.
      A.execute(bond, ly, foes[1], b);
      state.cooldownRemaining = 0;
      assert(ly.blockedByOwnStatus(bond), 'the second thread did not hold');
      foes[1].hp = 1;
      foes[1].takeDamage(10);
      assert(!foes[1].alive, 'sanity: the bound enemy lived');
      assert(!ly.blockedByOwnStatus(bond), 'a dead end still held the thread');
      assert(ly.readyAbilities().some((a) => a.def === bond),
        'Soul Bond stayed shut after its target fell');
    });
    // ...but the cooldown still has to be up.
    state.cooldownRemaining = 2;
    live(b, () => assert(!ly.readyAbilities().some((a) => a.def === bond),
      'Soul Bond ignored its own cooldown'));
  }

  // ---- A bonded enemy who reflects cannot start a loop ----
  {
    const { b, ly, foes } = arena();
    const mark = foes[0];
    live(b, () => {
      A.execute(def.abilities[2], ly, mark, b);
      // Their thorns: any damage they take comes straight back at her.
      const real = mark.takeDamage.bind(mark);
      mark.takeDamage = (n, who) => { const paid = real(n, who); ly.takeDamage(paid); return paid; };
      const before = ly.hp;
      ly.takeDamage(100);
      // One pass out, one pass back: 100 of her own plus 100 reflected.
      assert(before - ly.hp === 200,
        `the loop ran ${(before - ly.hp) / 100} times instead of twice`);
    });
  }

  // ---- Pull It Taut: the stance holds only while the thread does ----
  {
    const { b, ly, foes } = arena();
    live(b, () => {
      const loose = { atk: ly.effectiveStat('atk'), def: ly.effectiveStat('def') };
      A.execute(def.abilities[2], ly, foes[0], b);
      const tied = { atk: ly.effectiveStat('atk'), def: ly.effectiveStat('def') };
      // Within a point: `loose` is already rounded, so re-rounding it
      // against a stat the engine rounds once, at the end, can disagree
      // by one on either side of a .5 boundary.
      assert(Math.abs(tied.atk - loose.atk * 1.15) <= 1,
        `ATK ${loose.atk} -> ${tied.atk}, wanted x1.15`);
      assert(Math.abs(tied.def - loose.def * 1.15) <= 1,
        `DEF ${loose.def} -> ${tied.def}, wanted x1.15`);
      // Other stats are untouched.
      const spd = ly.effectiveStat('speed');
      A.applyEffect({ type: 'cleanse' }, ly, foes[0], 1);
      assert(ly.effectiveStat('atk') === loose.atk, 'the stance outlived the thread');
      assert(ly.effectiveStat('speed') === spd, 'the stance moved a stat it should not');
    });
  }

  // ---- Spool: the anvil holds harder on a front hex ----
  {
    assert(def.positional.name === 'Spool' &&
      def.positional.position === POSITION.FRONT &&
      def.positional.stat === 'def' && def.positional.mult === 1.30,
      'the front-hex bonus drifted');
    const { ly: on } = arena(true);
    const { ly: off } = arena(false);
    assert(on.slot.position === POSITION.FRONT &&
      off.slot.position !== POSITION.FRONT, 'sanity: same hex twice');
    assert(on.effectiveStat('def') === Math.round(off.effectiveStat('def') * 1.30),
      `front ${on.effectiveStat('def')} vs back ${off.effectiveStat('def')}`);
  }
});

test("Morrow's kit: he volunteers for all of it and is fed by the result", () => {
  const A = Abilities, H = HEROES;
  const def = H.morrow;
  assert(def && def.element === 'dark' && def.rarity === 4, 'Morrow drifted');
  assert(RACES.sectOf(def).id === 'nightflower', 'Morrow left the Nightflowers');
  assert(def.role === 'tank', 'Morrow is not binned as a tank');
  // Everything he throws is priced off DEF, so his gear pulls one way.
  for (const ab of def.abilities) {
    for (const e of (ab.effects || [])) {
      if (/^damage/.test(e.type)) {
        assert(e.type === 'damageDef', `${ab.id} scales off ${e.type}, not DEF`);
      }
    }
  }

  const arena = (front = true) => {
    const b = new Battle();
    const mk = (d, team, slot) => {
      const u = new Unit(d, team, { level: 30, stars: d.rarity || 3 });
      b.placeUnit(u, slot);
      return u;
    };
    const mo = mk(def, TEAM.PLAYER, front ? 1 : 0);
    const backMate = mk(DUMMIES.rat_archer, TEAM.PLAYER, 5);
    const frontMate = mk(DUMMIES.rat_knight, TEAM.PLAYER, 2);
    const foes = [1, 2, 3, 4].map((i) => mk(DUMMIES.rat_knight, TEAM.ENEMY, i));
    for (const f of foes) {
      f.hp = f.maxHp = 10 ** 7;
      f.dodgeChance = () => 0;
      f.effectiveStat = () => 0;
    }
    mo.baseCritChance = -1;
    return { b, mo, backMate, frontMate, foes };
  };
  const live = (b, fn) => {
    const prev = Battle.active; Battle.active = b;
    try { return fn(); } finally { Battle.active = prev; }
  };

  // ---- Groundbreak: the front row, off DEF, and something grows ----
  {
    const { b, mo, foes } = arena();
    const front = foes.filter((f) => f.slot.position === POSITION.FRONT);
    mo.hp = Math.round(mo.maxHp * 0.5);
    const before = mo.hp;
    const res = live(b, () => A.execute(def.abilities[0], mo, null, b));
    assert(res.filter((r) => r.kind === 'damage').length === front.length,
      'Groundbreak missed part of the front row');
    assert(mo.hp - before === Math.round(mo.maxHp * 0.08),
      `the sprout mended ${mo.hp - before}, wanted ${Math.round(mo.maxHp * 0.08)}`);
  }

  // ---- Wisteria: the WHOLE enemy team, and a wall to survive it ----
  {
    const { b, mo, foes } = arena();
    for (const f of foes) f.debuffResistance = () => 0;
    // Wisteria's taunt now rolls a 50% application gate before the
    // accuracy contest, so "everyone is taunted" is only true once the
    // chance rungs are bought. Max the skill and it is a certainty
    // again -- which is the whole shape of the rework.
    const wis = mo.abilities.find((x) => x.def === def.abilities[1]);
    wis.level = Progression.skillCap(def.abilities[1], 1);
    const before = mo.effectiveStat('def');
    live(b, () => A.execute(def.abilities[1], mo, null, b));
    for (const f of foes) {
      assert(f.statusEffects.some((fx) => fx.stat === 'taunted' && fx.turns === 1),
        `${f.def.id} on the ${f.slot.position} hex was not taunted`);
    }
    assert(mo.effectiveStat('def') === Math.round(before * 1.50),
      `DEF ${before} -> ${mo.effectiveStat('def')}, wanted x1.5`);
    // Base 6 since the sweep raised every skill 2 and 3 by a turn; the
    // last two rungs bring it back to 4.
    assert(def.abilities[1].cooldown === 6, 'Wisteria drifted off its 6-turn base cooldown');
    assert(Progression.skillCooldown(def.abilities[1], 7) === 4,
      'Wisteria does not reach a 4-turn cycle at max');
  }

  // ---- Pallbearer swings the weight of everyone already buried ----
  {
    const { b, mo, foes } = arena();
    const mark = foes[0];
    const swing = () => {
      const h = mark.hp;
      live(b, () => A.applyEffect(def.abilities[2].effects[0], mo, mark, 1));
      return h - mark.hp;
    };
    b.deaths = 0;
    const cold = swing();
    b.deaths = 5;
    const heavy = swing();
    // 2.00 base, +0.20 a body: five dead is 3.00, exactly 1.5x the base.
    assert(Math.abs(heavy / cold - 1.5) < 0.02,
      `five bodies swung ${heavy} against a base of ${cold}`);
    b.deaths = 0;
  }

  // ---- ...and the count is real, kept by the battle, both sides ----
  {
    const { b, mo, foes, frontMate } = arena();
    assert(b.deaths === 0, 'a fresh battle started with bodies in it');
    live(b, () => {
      foes[0].hp = 1; foes[0].takeDamage(10);
      assert(b.deaths === 1, `an enemy death counted ${b.deaths}`);
      frontMate.hp = 1; frontMate.takeDamage(10 ** 7);
      assert(b.deaths === 2, `an ally death did not count: ${b.deaths}`);
    });
  }

  // ---- Grave Soil: fed by any corpse, whoever it belonged to ----
  {
    const { b, mo, foes, frontMate } = arena();
    live(b, () => {
      mo.hp = Math.round(mo.maxHp * 0.4);
      const want = Math.max(1, Math.round(mo.maxHp * 0.10));
      const h0 = mo.hp;
      foes[0].hp = 1; foes[0].takeDamage(10);
      assert(mo.hp - h0 === want, `an enemy corpse mended ${mo.hp - h0}, wanted ${want}`);
      const h1 = mo.hp;
      frontMate.hp = 1; frontMate.takeDamage(10 ** 7);
      assert(mo.hp - h1 === want, `an ally corpse mended ${mo.hp - h1}, wanted ${want}`);
    });
    // A dead Morrow is not mended by the next corpse.
    live(b, () => {
      mo.hp = 1; mo.takeDamage(10 ** 7);
      assert(!mo.alive, 'sanity: he lived');
      foes[1].hp = 1; foes[1].takeDamage(10);
      assert(mo.hp === 0, 'a corpse mended a corpse');
    });
  }

  // ---- Mourner's Row shelters the BACK hexes, and is credited for it ----
  {
    assert(def.positional.name === "Mourner's Row" &&
      def.positional.position === POSITION.FRONT, 'the front-hex bonus drifted');
    const { b, mo, backMate, frontMate } = arena(true);
    live(b, () => {
      assert(mo.slot.position === POSITION.FRONT, 'sanity: he is not on a front hex');
      assert(backMate.slot.position === POSITION.BACK &&
        frontMate.slot.position === POSITION.FRONT, 'sanity: mates on the wrong hexes');
      assert(Math.abs(backMate.damageTakenMult() - 0.80) < 1e-9,
        `the back hex takes ${backMate.damageTakenMult()}, wanted 0.80`);
      assert(backMate.damageTakenBreakdown().contributors.some((c) => c.source === mo),
        'the cover was not credited to Morrow');
      assert(mo.damageTakenMult() === 1, 'he sheltered himself');
    });
    // Off a front hex it stops. The front-row mate carries a guard of
    // its own (the fixture's Bulwark), so what is measured is whether
    // MORROW moved it, not what it started at.
    const off = arena(false);
    live(off.b, () => {
      assert(off.mo.slot.position !== POSITION.FRONT, 'sanity: same hex twice');
      assert(off.backMate.damageTakenMult() === 1,
        'the cover reached from the wrong hex');
      assert(Math.abs(off.frontMate.damageTakenMult() -
        live(b, () => frontMate.damageTakenMult())) < 1e-9,
        'a front-row ally was sheltered too');
      assert(!live(b, () => frontMate.damageTakenBreakdown().contributors
        .some((c) => c.source === mo)), 'Morrow was credited for covering the front row');
    });
    live(b, () => {
      mo.hp = 1; mo.takeDamage(10 ** 7);
      assert(backMate.damageTakenMult() === 1, 'a fallen mourner still sheltered');
    });
  }
});

test("Valere's kit: he opens the door, then hands them the bill", () => {
  const A = Abilities, H = HEROES;
  const def = H.valere;
  assert(def && def.element === 'dark' && def.rarity === 4, 'Valere drifted');
  assert(RACES.sectOf(def).id === 'nightflower', 'Valere left the Nightflowers');
  assert(def.role === 'support', 'Valere is not binned as a support');
  assert(def.abilities[1].cooldown === 5 && def.abilities[2].cooldown === 8,
    'his cooldowns drifted');

  const arena = (back = false) => {
    const b = makeBattle();
    const va = place(b, def, TEAM.PLAYER, back ? 5 : 1);
    const mates = [2, 3].map((i) => place(b, DUMMIES.rat_knight, TEAM.PLAYER, i));
    const foes = [1, 2, 3].map((i) => place(b, DUMMIES.rat_brawler, TEAM.ENEMY, i));
    for (const f of foes) {
      f.hp = f.maxHp = 10 ** 7;
      f.dodgeChance = () => 0;
      f.debuffResistance = () => 0;
      f.effectiveStat = () => 0;
    }
    va.baseCritChance = -1;
    return { b, va, mates, foes };
  };
  const live = (b, fn) => {
    const prev = Battle.active; Battle.active = b;
    try { return fn(); } finally { Battle.active = prev; }
  };

  // ---- The Whole Bouquet is the enabler: resistance comes off ----
  {
    const { b, va, foes } = arena();
    // Level 4 buys all three chance rungs -- both blooms certain --
    // without reaching the debuffPower rung above them, so the two
    // magnitudes measured below stay at their authored values.
    va.abilities[1].level = 4;
    for (const f of foes) delete f.debuffResistance;   // read the real figure
    const before = foes.map((f) => f.debuffResistance());
    live(b, () => A.execute(def.abilities[1], va, null, b));
    foes.forEach((f, i) => {
      // Resistance floors at zero rather than going negative -- a hex
      // that is already certain cannot become more certain. Against an
      // ordinary body the 30-point strip therefore eats the 15 they
      // start with; against a boss holding 65 it takes a real bite.
      const want = Math.max(0, before[i] - 0.30);
      assert(Math.abs(f.debuffResistance() - want) < 1e-9,
        `${f.def.id} resistance ${before[i]} -> ${f.debuffResistance()}, wanted ${want}`);
      const res = f.statusEffects.find((fx) => fx.stat === 'resistance');
      assert(res && res.turns === 2, 'the bouquet did not last 2 turns');
      assert(f.statusEffects.some((fx) => fx.stat === 'def' && fx.mult === 0.80),
        `${f.def.id} kept its armour`);
    });
  }

  // ---- Nothing Is Refused: the first flower rolls, the rest do not ----
  {
    const { b, va, foes } = arena();
    const mark = foes[0];
    mark.debuffResistance = () => 10;          // nothing should ever land
    const R = g.Math;
    try {
      // The rose's 50% gate is a separate question from whether they can
      // refuse it: max the skill so the flower is always OFFERED, and
      // what is measured below is purely the passive's bypass.
      maxSkill(va, 0);
      R.random = () => 0.99;                   // every roll fails
      live(b, () => A.execute(def.abilities[0], va, mark, b));
      assert(!mark.statusEffects.some((fx) => fx.kind === 'debuff'),
        'the first flower was forced on a clean target');
      // Now they are carrying something from somewhere else.
      mark.addStatusEffect({ kind: 'debuff', stat: 'speed', mult: 0.8, turns: 3 });
      live(b, () => A.execute(def.abilities[0], va, mark, b));
      assert(mark.statusEffects.some((fx) => fx.kind === 'debuff' && fx.stat === 'atk'),
        'an already-afflicted target still refused him');
      // A poison counts as carrying something, and somebody ELSE with
      // the same opening still gets refused.
      const clean = foes[1];
      clean.debuffResistance = () => 10;
      live(b, () => A.execute(def.abilities[0], va, clean, b));
      assert(!clean.statusEffects.some((fx) => fx.kind === 'debuff'),
        'the exemption leaked onto a clean target');
      clean.addStatusEffect({ kind: 'dot', amount: 10, turns: 2 });
      live(b, () => A.execute(def.abilities[0], va, clean, b));
      assert(clean.statusEffects.some((fx) => fx.stat === 'atk'),
        'a poisoned target was not already afflicted enough');
    } finally { delete R.random; }
  }

  // ---- Something Rarer: his side walks clean, one of theirs wears it ----
  {
    const { b, va, mates, foes } = arena();
    const mark = foes[0];
    // The transfer is ungated -- it moves his own side's afflictions
    // rather than forcing a new one -- but the DEF break riding along
    // with it is a hex like any other. Level 4 buys all three chance
    // rungs so the break is certain, and stops below the debuffPower
    // rungs so its magnitude is still the authored one.
    va.abilities[2].level = 4;
    mates[0].addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.5, turns: 4 });
    mates[0].addStatusEffect({ kind: 'dot', amount: 99, turns: 3, source: foes[1] });
    mates[1].addStatusEffect({ kind: 'debuff', stat: 'speed', mult: 0.6, turns: 2 });
    va.addStatusEffect({ kind: 'debuff', stat: 'def', mult: 0.5, turns: 5 });
    // A buff on his side must NOT go with them.
    mates[0].addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.3, turns: 3 });
    const res = live(b, () => A.execute(def.abilities[2], va, mark, b));
    const moved = res.find((r) => r.kind === 'transferDebuffs');
    assert(moved && moved.count === 4, `moved ${moved && moved.count}, wanted 4`);
    for (const u of [va, ...mates]) {
      assert(!u.statusEffects.some((fx) => fx.kind === 'debuff' || fx.kind === 'dot'),
        `${u.def.id} kept an affliction`);
    }
    assert(mates[0].statusEffects.some((fx) => fx.kind === 'buff'),
      'a blessing went with the bouquet');
    const worn = mark.statusEffects;
    assert(worn.filter((fx) => fx.kind === 'debuff').length >= 4, 'the target is not buried');
    assert(worn.some((fx) => fx.stat === 'atk' && fx.mult === 0.5 && fx.turns === 4),
      'a moved debuff lost its terms');
    const dot = worn.find((fx) => fx.kind === 'dot');
    assert(dot && dot.source === va, 'a moved poison still credits the enemy who cast it');
    // ...and the rider, once its gate is bought closed, lands on top of
    // everything that was moved, so the cast is never a dead turn.
    assert(worn.some((fx) => fx.stat === 'def' && fx.mult === 0.70 && fx.turns === 3),
      'the guaranteed cut did not land');
  }

  // ---- A refused transfer is a no-op, not a bonfire ----
  {
    const { b, va, mates, foes } = arena();
    const mark = foes[0];
    mark.debuffResistance = () => 10;
    mates[0].addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.5, turns: 4 });
    const R = g.Math;
    let res;
    try {
      R.random = () => 0.99;
      // Only the transfer is under test; the rider would afflict them
      // and switch the passive on, so it is cast on its own. It goes
      // through execute() rather than applyEffect() because that is
      // what tells Abilities which battle is being fought.
      res = live(b, () => A.execute(
        { id: 'probe', targeting: 'enemy', effects: [{ type: 'transferDebuffs' }] },
        va, mark, b))[0];
    } finally { delete R.random; }
    assert(res && res.resisted, 'the transfer was not contested');
    assert(mates[0].statusEffects.some((fx) => fx.stat === 'atk' && fx.turns === 4),
      'a refused transfer destroyed the affliction it could not move');
    assert(!mark.statusEffects.some((fx) => fx.kind === 'debuff'),
      'a refused transfer landed anyway');
  }

  // ---- Nothing to hand over is reported, not faked ----
  {
    const { b, va, foes } = arena();
    const res = live(b, () => A.execute(
      { id: 'probe', targeting: 'enemy', effects: [{ type: 'transferDebuffs' }] },
      va, foes[0], b))[0];
    assert(res && res.count === 0 && !res.resisted, 'an empty bouquet misreported');
  }

  // ---- Long Stems: cut long, they keep ----
  {
    assert(def.positional.name === 'Long Stems' &&
      def.positional.position === POSITION.BACK &&
      def.positional.hooks.debuffExtraTurns === 1, 'the back-hex bonus drifted');
    const on = arena(true), off = arena(false);
    assert(on.va.slot.position === POSITION.BACK &&
      off.va.slot.position !== POSITION.BACK, 'sanity: same hex twice');
    const turnsOf = (a) => {
      maxSkill(a.va, 0);   // close the rose's 50% gate on both hexes
      live(a.b, () => A.execute(def.abilities[0], a.va, a.foes[0], a.b));
      return a.foes[0].statusEffects.find((fx) => fx.stat === 'atk').turns;
    };
    // Measured once each: calling these inside the message would cast
    // again and read a second, different rose.
    const onHex = turnsOf(on), offHex = turnsOf(off);
    assert(onHex === offHex + 1, `back hex ${onHex} turns vs ${offHex} off it`);
  }
});

test("Lenore's kit: the bell is priced off her own pool, and a death rings it sooner", () => {
  const A = Abilities, H = HEROES;
  const def = H.lenore;
  assert(def && def.element === 'dark' && def.rarity === 3, 'Lenore drifted');
  assert(RACES.sectOf(def).id === 'nightflower', 'Lenore left the Nightflowers');
  assert(def.role === 'support', 'Lenore is not binned as a support');
  assert(def.abilities[1].cooldown === 6 && def.abilities[2].cooldown === 7,
    'her cooldowns drifted');
  // Every figure she hands out is a share of HER pool, never her ATK.
  for (const ab of def.abilities) {
    for (const e of (ab.effects || [])) {
      if (['healHpPct', 'hot', 'shield'].includes(e.type)) {
        assert(e.pct !== undefined && e.mult === undefined,
          `${ab.id}'s ${e.type} is not priced off her max HP`);
      }
    }
  }

  const arena = (centre = true) => {
    const b = new Battle();
    const mk = (d, team, slot) => {
      const u = new Unit(d, team, { level: 30, stars: d.rarity || 3 });
      b.placeUnit(u, slot);
      return u;
    };
    const le = mk(def, TEAM.PLAYER, centre ? 0 : 1);
    const mates = [2, 3].map((i) => mk(DUMMIES.rat_knight, TEAM.PLAYER, i));
    const foe = mk(DUMMIES.rat_brawler, TEAM.ENEMY, 1);
    for (const m of mates) { m.maxHp = 8000; m.hp = 2000; }
    return { b, le, mates, foe };
  };
  const live = (b, fn) => {
    const prev = Battle.active; Battle.active = b;
    try { return fn(); } finally { Battle.active = prev; }
  };

  // ---- Single Toll finds the worst-off ally, not a chosen one ----
  {
    const { b, le, mates } = arena();
    mates[0].hp = 400;                       // the one in the worst shape
    mates[1].hp = 7000;
    const before = mates[0].hp, spared = mates[1].hp;
    live(b, () => A.execute(def.abilities[0], le, mates[1], b));
    assert(mates[0].hp - before === Math.round(le.maxHp * 0.20),
      `the toll mended ${mates[0].hp - before}, wanted ${Math.round(le.maxHp * 0.20)}`);
    assert(mates[1].hp === spared,
      'the toll went to the ally that was picked rather than the one bleeding');
  }

  // ---- Muffled Peal: the whole team braces AND regenerates ----
  {
    const { b, le, mates } = arena();
    const defs = mates.map((m) => m.effectiveStat('def'));
    live(b, () => A.execute(def.abilities[1], le, null, b));
    const want = Math.round(le.maxHp * 0.10);
    for (const u of [le, ...mates]) {
      assert(u.statusEffects.some((fx) => fx.kind === 'buff' && fx.stat === 'def' &&
        fx.mult === 1.30 && fx.turns === 2), `${u.def.id} did not brace`);
      const hot = u.statusEffects.find((fx) => fx.kind === 'hot');
      assert(hot && hot.amount === want && hot.turns === 2,
        `${u.def.id}'s regen is ${hot && hot.amount}, wanted ${want}`);
      assert(hot.source === le, 'the regen does not credit the bell');
    }
    mates.forEach((m, i) => assert(m.effectiveStat('def') === Math.round(defs[i] * 1.30),
      'the brace did not move DEF'));
  }

  // ---- Open Ring: a mend and a shield, both off her pool ----
  {
    const { b, le, mates } = arena();
    const before = mates.map((m) => m.hp);
    live(b, () => A.execute(def.abilities[2], le, null, b));
    const mend = Math.round(le.maxHp * 0.10), wall = Math.round(le.maxHp * 0.10);
    mates.forEach((m, i) => {
      assert(m.hp - before[i] === mend, `${m.def.id} mended ${m.hp - before[i]}`);
      assert(m.shieldTotal() === wall, `${m.def.id} has ${m.shieldTotal()} of shield`);
    });
    assert(le.shieldTotal() === wall, 'the bell-ringer shielded everyone but herself');
    // And the shield really is a pool that eats damage before HP.
    const hp = mates[0].hp;
    live(b, () => mates[0].takeDamage(wall));
    assert(mates[0].hp === hp && mates[0].shieldTotal() === 0,
      'the shield did not absorb the blow whole');
  }

  // ---- The Passing Bell: an ALLY death takes a turn off everything ----
  {
    const { b, le, mates, foe } = arena();
    live(b, () => {
      for (const a of le.abilities) a.cooldownRemaining = 4;
      le.abilities[0].cooldownRemaining = 0;      // a ready skill stays ready
      // An ENEMY falling is not her grief.
      foe.hp = 1; foe.takeDamage(10);
      assert(!foe.alive, 'sanity: the enemy lived');
      assert(le.abilities[1].cooldownRemaining === 4,
        'an enemy death rang her bell');
      // An ally falling does.
      mates[0].hp = 1; mates[0].takeDamage(10 ** 7);
      assert(!mates[0].alive, 'sanity: the ally lived');
      assert(le.abilities[1].cooldownRemaining === 3 &&
        le.abilities[2].cooldownRemaining === 3,
        `a fallen ally moved her to ${le.abilities[1].cooldownRemaining}`);
      assert(le.abilities[0].cooldownRemaining === 0,
        'a ready skill was pushed below zero');
      // A second death takes another turn, one at a time.
      mates[1].hp = 1; mates[1].takeDamage(10 ** 7);
      assert(le.abilities[1].cooldownRemaining === 2, 'the second bell did not ring');
      // Her own death rings nothing.
      le.abilities[1].cooldownRemaining = 4;
      le.hp = 1; le.takeDamage(10 ** 7);
      assert(!le.alive, 'sanity: she lived');
      assert(le.abilities[1].cooldownRemaining === 4, 'she rang her own passing bell');
    });
  }

  // ---- Bell Tower: the middle keeps ringing every turn ----
  {
    assert(def.positional.name === 'Bell Tower' &&
      def.positional.position === POSITION.CENTER, 'the centre-hex bonus drifted');
    const mid = arena(true), off = arena(false);
    assert(mid.le.slot.position === POSITION.CENTER &&
      off.le.slot.position !== POSITION.CENTER, 'sanity: same hex twice');
    const tick = (a) => {
      const before = a.mates.map((m) => m.hp);
      live(a.b, () => a.le.startTurn(a.b));
      return a.mates.map((m, i) => m.hp - before[i]);
    };
    const rung = tick(mid), silent = tick(off);
    const want = Math.round(mid.le.maxHp * 0.05);
    assert(rung.every((n) => n === want), `the tower mended ${rung}, wanted ${want}`);
    assert(silent.every((n) => n === 0), `it rang off its own hex: ${silent}`);
  }
});

test("Dorian's kit: he does not out-heal a healer, he removes the healer", () => {
  const A = Abilities, H = HEROES;
  const def = H.dorian;
  assert(def && def.element === 'dark' && def.rarity === 5, 'Dorian drifted');
  assert(RACES.sectOf(def).id === 'nightflower', 'Dorian left the Nightflowers');
  assert(def.role === 'dps', 'Dorian is not binned as a DPS');
  // The seal he casts is the SAME one Asher casts, on the same plate.
  const seal = def.abilities[2].effects.find((e) => e.type === 'buffBlock');
  assert(seal, 'No Physician stopped sealing');
  assert(H.asher.abilities.some((a) =>
    (a.effects || []).some((e) => e.type === 'buffBlock')),
    'sanity: nobody else uses the seal');

  const arena = (front = true) => {
    const b = makeBattle();
    const dor = place(b, def, TEAM.PLAYER, front ? 1 : 5);
    const medic = place(b, DUMMIES.rat_knight, TEAM.PLAYER, 2);
    const foes = [1, 2].map((i) => place(b, DUMMIES.rat_brawler, TEAM.ENEMY, i));
    for (const f of foes) {
      f.hp = f.maxHp = 10 ** 7;
      f.dodgeChance = () => 0;
      f.debuffResistance = () => 0;
      f.effectiveStat = () => 0;
    }
    dor.baseCritChance = -1;
    return { b, dor, medic, foes };
  };
  const live = (b, fn) => {
    const prev = Battle.active; Battle.active = b;
    try { return fn(); } finally { Battle.active = prev; }
  };

  // ---- The lock stops every kind of mending there is ----
  {
    const { b, dor, foes } = arena();
    const mark = foes[0];
    maxSkill(dor, 1);   // close the 50% gate on the lock
    live(b, () => A.execute(def.abilities[1], dor, mark, b));
    assert(mark.healBlocked(), 'the lock did not land');
    const lock = mark.statusEffects.find((fx) => fx.stat === 'healblock');
    assert(lock.kind === 'debuff' && lock.turns === 2, 'the lock is not a 2-turn debuff');

    mark.hp = Math.round(mark.maxHp * 0.5);
    const hp = mark.hp;
    // A cast heal.
    assert(mark.heal(5000, dor) === 0, 'a cast mend got through');
    // A regen tick, and a drain rider.
    mark.addStatusEffect({ kind: 'hot', amount: 500, turns: 2, source: foes[1] });
    live(b, () => mark.startTurn(b));
    assert(mark.hp === hp, 'a regen tick got through');
    live(b, () => A.applyEffect(
      { type: 'damageHp', mult: 0.01, healDealt: { to: 'self', frac: 1 } },
      mark, foes[1], 1));
    assert(mark.hp === hp, 'a drain got through');
    // An ability-cast mend reports itself as refused rather than as a zero.
    const res = live(b, () => A.applyEffect({ type: 'healHpPct', pct: 0.5 }, dor, mark, 1));
    assert(res && res.blocked && res.amount === 0, 'a refused mend misreported');

    // ...but a REVIVE is not healing, and is deliberately untouched.
    mark.hp = 0;
    assert(!mark.alive, 'sanity: he lived');
    mark.revive(0.4, dor);
    assert(mark.alive && mark.hp === Math.round(mark.maxHp * 0.4),
      'the lock stopped a revive it was never meant to stop');
    // And a shield is not healing either.
    mark.addStatusEffect({ kind: 'shield', amount: 900, turns: 3 });
    assert(mark.shieldTotal() === 900, 'the lock ate a shield');
  }

  // ---- The lock expires, and then mending works again ----
  {
    const { b, dor, foes } = arena();
    const mark = foes[0];
    live(b, () => A.execute(def.abilities[1], dor, mark, b));
    for (let i = 0; i < 2; i++) mark.tickStatusEffects();
    assert(!mark.healBlocked(), 'the lock outlived its two turns');
    mark.hp = 100;
    assert(mark.heal(500, dor) === 400 || mark.hp > 100, 'mending stayed shut');
  }

  // ---- No Physician shuts both doors at once ----
  {
    const { b, dor, foes } = arena();
    const mark = foes[0];
    // Two gates, rolled apart: at level 1 both doors shut only a quarter
    // of the time. Bought to certain, the blade does what it says.
    maxSkill(dor, 2);
    live(b, () => A.execute(def.abilities[2], dor, mark, b));
    assert(mark.healBlocked() && mark.buffsSealed(),
      'the lit blade left a door open');
    assert(mark.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 2, turns: 3 }) === false,
      'a blessing reached a sealed target');
    assert(mark.heal(9999, dor) === 0, 'a mend reached a cut-off target');
  }

  // ---- Past Helping pays per lock, and only for HIS two ----
  {
    const { b, dor, foes } = arena();
    const mark = foes[0];
    assert(dor.damageDealtMult(mark) === 1, 'an untouched enemy already paid');
    mark.addStatusEffect({ kind: 'debuff', stat: 'healblock', turns: 3 });
    assert(Math.abs(dor.damageDealtMult(mark) - 1.20) < 1e-9,
      `one lock gave ${dor.damageDealtMult(mark)}`);
    mark.addStatusEffect({ kind: 'debuff', stat: 'buffblock', turns: 3 });
    assert(Math.abs(dor.damageDealtMult(mark) - 1.40) < 1e-9,
      `both locks gave ${dor.damageDealtMult(mark)}`);
    // Some other affliction is not one of his locks.
    mark.addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.5, turns: 3 });
    assert(Math.abs(dor.damageDealtMult(mark) - 1.40) < 1e-9,
      'an unrelated debuff was counted as a lock');
    // ...and it shows in the damage, not just the multiplier.
    const clean = foes[1];
    const hit = (t) => { const h = t.hp;
      live(b, () => A.applyEffect({ type: 'damage', mult: 1.40 }, dor, t, 1));
      return h - t.hp; };
    const elem = g.Elements.mult('dark', mark.element) /
      g.Elements.mult('dark', clean.element);
    assert(Math.abs(hit(mark) / (hit(clean) * elem) - 1.40) < 0.02,
      'the locks did not show up in the swing');
  }

  // ---- Reach: the front hex is what makes the locks stick ----
  {
    assert(def.positional.name === 'Reach' &&
      def.positional.position === POSITION.FRONT &&
      def.positional.hooks.accuracyAdd === 0.40, 'the front-hex bonus drifted');
    const { dor: on } = arena(true);
    const { dor: off } = arena(false);
    assert(on.slot.position === POSITION.FRONT &&
      off.slot.position !== POSITION.FRONT, 'sanity: same hex twice');
    assert(Math.abs((on.debuffAccuracy() - off.debuffAccuracy()) - 0.40) < 1e-9,
      `front ${on.debuffAccuracy()} vs back ${off.debuffAccuracy()}`);
  }
});

test('turn meters overfill, and gifts never push a unit backwards', () => {
  const A = Abilities, H = HEROES;
  const MAX = CONFIG.TURN_METER_MAX;
  const battle = makeBattle();
  const ids = Object.keys(H);
  const giver = place(battle, H[ids[0]], TEAM.PLAYER, 0);
  const target = place(battle, H[ids[1]], TEAM.PLAYER, 1);

  // A unit already past 100% must GAIN from a meter push. This used to
  // clamp to MAX, so gifting a unit sitting at 140% dropped them to
  // 100% -- the buff was a nerf, and it silently flattened the very
  // ordering the overfill exists to keep.
  target.turnMeter = MAX * 1.4;
  const before = target.turnMeter;
  A.applyEffect({ type: 'turnMeter', amount: 0.30 }, giver, target, 1);
  assert(target.turnMeter > before,
    `meter gift shrank the bar: ${before} -> ${target.turnMeter}`);
  assert(Math.abs(target.turnMeter - (before + MAX * 0.30)) < 1,
    `gift did not land in full: expected ${before + MAX * 0.30}, got ${target.turnMeter}`);

  // Drains still floor at zero rather than going negative.
  target.turnMeter = MAX * 0.1;
  A.applyEffect({ type: 'turnMeter', amount: -5 }, giver, target, 1);
  assert(target.turnMeter >= 0, 'a drain drove the meter negative');
});

test('the next-up indicator agrees with who actually acts', () => {
  const H = HEROES;
  const MAX = CONFIG.TURN_METER_MAX;
  const nextUp = (b) => Battle.prototype.nextUpUnit.call(b);
  const battle = makeBattle();
  const ids = Object.keys(H);
  const a = place(battle, H[ids[0]], TEAM.PLAYER, 0);
  const b = place(battle, H[ids[1]], TEAM.PLAYER, 1);
  const c = place(battle, H[ids[2]], TEAM.ENEMY, 0);
  battle.activeUnit = null;

  // With several units over the line, the highest meter is next -- the
  // same rule tick() sorts by, so the plate cannot promise a turn the
  // engine then hands to someone else.
  a.turnMeter = MAX * 1.2;
  b.turnMeter = MAX * 1.9;
  c.turnMeter = MAX * 1.5;
  assert(nextUp(battle) === b, 'next-up disagreed with the highest meter');
  const ready = battle.livingUnits()
    .filter((u) => u.turnMeter >= MAX)
    .sort((x, y) => y.turnMeter - x.turnMeter);
  assert(ready[0] === nextUp(battle), 'indicator and tick() ordering diverged');

  // Exactly one unit is ever flagged, however deep the queue.
  const flagged = battle.livingUnits().filter((u) => u === nextUp(battle));
  assert(flagged.length === 1, `${flagged.length} units flagged as next`);

  // The unit currently acting is not its own "next": while someone is
  // on screen, the indicator points at whoever follows them.
  battle.activeUnit = b;
  assert(nextUp(battle) === c,
    'the acting unit was reported as next up instead of the one after it');
  battle.activeUnit = null;

  // With nobody ready it projects: fastest to arrive wins, not the
  // highest meter, so the indicator still names someone mid-fill.
  a.turnMeter = MAX * 0.9; b.turnMeter = MAX * 0.5; c.turnMeter = 0;
  a.speed = 10; b.speed = 400; c.speed = 10;
  assert(nextUp(battle) === b,
    'projection ignored speed and picked the fuller-but-slower meter');
});

test("Aniani's skill ladder reaches the damage, the cooldown and the caps", () => {
  const A = Abilities, H = HEROES, P = Progression;
  const def = H.echo;
  const [lance, wave, shatter] = def.abilities;

  // Per-slot rungs: 5/6/7, so caps are 6/7/8.
  assert(P.skillCap(lance, 0) === 6, `skill 1 cap ${P.skillCap(lance, 0)}`);
  assert(P.skillCap(wave, 1) === 7, `skill 2 cap ${P.skillCap(wave, 1)}`);
  assert(P.skillCap(shatter, 2) === 8, `skill 3 cap ${P.skillCap(shatter, 2)}`);
  assert(lance.levelUps.length === 5 && wave.levelUps.length === 6 &&
    shatter.levelUps.length === 7, 'rung counts drifted from 5/6/7');

  // The sweep rule raised skills 2 and 3 by one turn at base...
  assert(wave.cooldown === 4, `Prism Wave base cd ${wave.cooldown}`);
  assert(shatter.cooldown === 6, `Resonant Shatter base cd ${shatter.cooldown}`);
  // ...and the last two rungs hand back two, ending better than before.
  assert(P.skillCooldown(wave, 7) === 2, `Wave at max cd ${P.skillCooldown(wave, 7)}`);
  assert(P.skillCooldown(shatter, 8) === 4, `Shatter at max cd ${P.skillCooldown(shatter, 8)}`);
  // A cooldown rung must never make a skill free.
  assert(P.skillCooldown(shatter, 8) >= 1, 'a cooldown rung reached zero');

  // The rungs must actually land in the damage, not merely in the table.
  // Both halves of the modifier move: 60+30/mirror at Lv1 becomes
  // 110+55/mirror at Lv6, which at six mirrors is 240% -> 440% DEF.
  const battle = makeBattle();
  const cast = (level) => {
    const u = place(battle, def, TEAM.PLAYER, 0);
    const foe = place(battle, def, TEAM.ENEMY, 0);
    u.mirrors = 6; foe.mirrors = 0;
    const st = u.abilities.find((x) => x.def === lance);
    st.level = level;
    const bonus = u.skillBonusFor(lance);
    return { u, foe, bonus };
  };
  const lo = cast(1), hi = cast(6);
  assert(Object.keys(lo.bonus).length === 0, 'level 1 earned a rung it should not have');
  assert(Math.abs(hi.bonus.mult - 0.50) < 1e-9, `flat rungs ${hi.bonus.mult}`);
  assert(Math.abs(hi.bonus.perMirror - 0.25) < 1e-9, `mirror rungs ${hi.bonus.perMirror}`);
  const eff = lance.effects[0];
  const total = (b) => eff.mult + (b.mult || 0) + (eff.perMirror + (b.perMirror || 0)) * 6;
  assert(Math.abs(total(lo.bonus) - 2.40) < 1e-9, `Lv1 at six mirrors ${total(lo.bonus)}`);
  assert(Math.abs(total(hi.bonus) - 4.40) < 1e-9, `Lv6 at six mirrors ${total(hi.bonus)}`);

  // A laddered skill must NOT also take the old blanket multiplier, or
  // every rung would be paid twice.
  assert(hi.u.skillPowerFor(lance) === 1,
    'a laddered skill is still taking the legacy skillPower multiplier');

  // The readout must not fuse the two halves into one number that is
  // true at no mirror count.
  const text = P.skillBonusText(lance, 6);
  assert(text.includes('+50% power') && text.includes('+25%/mirror'),
    `ladder readout fused its halves: ${text}`);
});

test('the whole roster is swept, and a ladderless skill still works', () => {
  const H = HEROES, P = Progression;
  // The sweep is finished: every ability on every hero carries a ladder.
  // Pinned here so a hero added later cannot quietly ship on the legacy
  // blanket multiplier and level five times for nothing observable.
  const bare = Object.values(H)
    .flatMap((h) => (h.abilities || []).map((a, i) => ({ h, a, i })))
    .filter(({ a }) => !a.levelUps)
    .map(({ h, i }) => `${h.id} s${i + 1}`);
  assert(bare.length === 0, `no ladder on: ${bare.join(', ')}`);

  // The legacy path stays wired all the same. It is what a new hero
  // lands on before their kit is laddered, and a migration that rotted
  // the moment the last real user of it left would be a trap.
  const relic = { id: 'relic', name: 'Relic', cooldown: 0, effects: [{ type: 'damage', mult: 1 }] };
  assert(P.skillCap(relic, 0) === P.MAX_SKILL_LEVEL, 'a ladderless skill lost the legacy cap');
  assert(Math.abs(P.skillPower(5) - 1.4) < 1e-9, 'legacy skillPower drifted');
  assert(P.skillBonusText(relic, 5) === '+40% power',
    `legacy readout changed: ${P.skillBonusText(relic, 5)}`);
  const battle = makeBattle();
  const u = place(battle, H.ryn, TEAM.PLAYER, 0);
  u.abilities.push({ def: relic, level: 5, cooldownRemaining: 0 });
  assert(Math.abs(u.skillPowerFor(relic) - 1.4) < 1e-9,
    'a ladderless ability stopped scaling with skill level');
});

test("Toll's Reckoning: a 50% base gate that levels to a certainty", () => {
  const A = Abilities, H = HEROES, P = Progression;
  const R = g.Math;
  const def = H.toll;
  const [first, peal, reck] = def.abilities;

  // Base: the sweep rule's cooldowns, and a coin flip on both stats.
  assert(peal.cooldown === 4, `Full Peal base cd ${peal.cooldown}`);
  assert(reck.cooldown === 6, `Reckoning base cd ${reck.cooldown}`);
  assert(reck.effects.every((e) => e.chance === 0.5),
    'the Reckoning did not get its 50% base application chance');
  assert(P.skillCooldown(peal, 7) === 2 && P.skillCooldown(reck, 8) === 4,
    'cooldown rungs did not land');
  assert(first.levelUps.length === 5 && peal.levelUps.length === 6 &&
    reck.levelUps.length === 7, 'rung counts drifted from 5/6/7');

  // The chance rungs must reach EXACTLY 100 -- short changes the skill
  // from reliable to nearly-reliable, over wastes a rung.
  const lad = P.skillLadder(reck, P.skillCap(reck, 2));
  assert(Math.abs(lad.debuffChance - 0.50) < 1e-9,
    `chance rungs sum to ${lad.debuffChance}, not 0.50`);
  assert(Math.abs(lad.debuffPower - 0.10) < 1e-9,
    `severity rungs sum to ${lad.debuffPower}, not 0.10`);

  const battle = makeBattle();
  const toll = place(battle, def, TEAM.PLAYER, 0);
  const foe = place(battle, H.catherine, TEAM.ENEMY, 0);
  const st = toll.abilities.find((x) => x.def === reck);
  // The REAL ability object, not a spread copy: skillBonusFor finds a
  // unit's level by def reference, so a clone silently reports level 1
  // and the gate would look broken when it is not.
  const cast = (level, roll) => {
    st.level = level;
    foe.statusEffects = [];
    R.random = () => roll;          // one value for the gate and the contest
    const out = A.execute(reck, toll, foe, battle);
    delete R.random;
    return out;
  };

  // At level 1 the gate is 0.5: a roll of 0.75 fails it and the hex
  // never reaches the accuracy contest at all.
  let res = cast(1, 0.75);
  assert(res.some((r) => r.missed), 'a 0.75 roll got past a 50% gate');
  assert(foe.statusEffects.length === 0, 'a missed hex still applied');

  // Fully levelled the gate is 1.0, so the same roll lands.
  res = cast(P.skillCap(reck, 2), 0.75);
  assert(!res.some((r) => r.missed), 'a maxed 100% gate still missed');
  assert(foe.statusEffects.length === 2,
    `expected DEF and ATK breaks, got ${foe.statusEffects.length}`);

  // And severity moved AWAY from neutral on both: -30% became -40%.
  for (const fx of foe.statusEffects) {
    assert(Math.abs(fx.mult - 0.60) < 1e-9,
      `${fx.stat} break landed at ${fx.mult}, expected 0.60`);
  }

  // The two breaks roll their own gates rather than sharing one, so a
  // level-1 Reckoning can land the DEF break and miss the ATK break.
  // The description says "each" for exactly this reason; if the rolls
  // are ever fused into one, that wording becomes a lie.
  // Measured rather than seeded: each effect draws for its gate AND for
  // the accuracy contest, so a hand-fed roll sequence tests the stub,
  // not the rule. With the contest neutralised, 400 level-1 casts must
  // show all three outcomes.
  st.level = 1;
  foe.debuffResistance = () => 0;
  toll.debuffAccuracy = () => 1;
  const tally = { 0: 0, 1: 0, 2: 0 };
  for (let n = 0; n < 400; n++) {
    foe.statusEffects = [];
    A.execute(reck, toll, foe, battle);
    tally[foe.statusEffects.length] = (tally[foe.statusEffects.length] || 0) + 1;
  }
  assert(tally[1] > 0,
    `independent gates should allow partial lands: ${JSON.stringify(tally)}`);
  assert(tally[0] > 0 && tally[2] > 0,
    `a 50% gate should also miss both and land both: ${JSON.stringify(tally)}`);

  // A level-1 cast that passes the gate keeps the undeepened -30%.
  cast(1, 0.10);
  assert(foe.statusEffects.length === 2 && foe.statusEffects.every(
    (fx) => Math.abs(fx.mult - 0.70) < 1e-9),
    'an unlevelled hex was already deepened');
});

test('severity rungs deepen a reduction and amplify an amplifier', () => {
  const A = Abilities, H = HEROES;
  const R = g.Math;
  // The rung is "further from neutral", so one rule serves a -30% stat
  // break (mult below 1) and a +30% vulnerability mark (mult above 1).
  // Getting this backwards would make vulnerability marks WEAKER as they
  // level, and nothing else in the suite would notice.
  const battle = makeBattle();
  const caster = place(battle, H.toll, TEAM.PLAYER, 0);
  const foe = place(battle, H.catherine, TEAM.ENEMY, 0);
  caster.skillBonusFor = () => ({ debuffPower: 0.05 });
  const lay = (mult, stat) => {
    foe.statusEffects = [];
    R.random = () => 0.01;
    A.execute({ id: 'probe', targeting: 'enemy',
      effects: [{ type: 'debuff', stat, mult, turns: 2, chance: 1 }] },
      caster, foe, battle);
    delete R.random;
    return foe.statusEffects[0];
  };
  const down = lay(0.70, 'def');
  assert(down && Math.abs(down.mult - 0.65) < 1e-9,
    `a reduction should deepen to 0.65, got ${down && down.mult}`);
  const up = lay(1.30, 'damageTaken');
  assert(up && Math.abs(up.mult - 1.35) < 1e-9,
    `an amplifier should rise to 1.35, got ${up && up.mult}`);
});

test("Morrow proves the buff-duration and heal rungs", () => {
  const A = Abilities, H = HEROES, P = Progression;
  const def = H.morrow;
  const [ground, wis, pall] = def.abilities;

  // The heal rung moves in FIVES because it is priced off a health
  // pool, while the damage on the same skill moves in tens.
  const gl = P.skillLadder(ground, P.skillCap(ground, 0));
  assert(Math.abs(gl.mult - 0.30) < 1e-9, `damage rungs ${gl.mult}`);
  assert(Math.abs(gl.heal - 0.10) < 1e-9, `heal rungs ${gl.heal}`);

  const battle = makeBattle();
  const mo = place(battle, def, TEAM.PLAYER, 0);
  const st = mo.abilities.find((x) => x.def === ground);
  // applyEffect alone cannot see the ladder -- it reads the ability
  // currently being executed -- so drive the real cast path.
  const mendViaCast = (level) => {
    st.level = level;
    mo.hp = 1;
    A.execute(ground, mo, place(battle, def, TEAM.ENEMY, 0), battle);
    return mo.hp - 1;
  };
  const low = mendViaCast(1);
  const high = mendViaCast(P.skillCap(ground, 0));
  assert(Math.abs(low - Math.round(mo.maxHp * 0.08)) <= 1,
    `level 1 mend ${low}, wanted ${Math.round(mo.maxHp * 0.08)}`);
  assert(Math.abs(high - Math.round(mo.maxHp * 0.18)) <= 1,
    `maxed mend ${high}, wanted ${Math.round(mo.maxHp * 0.18)}`);

  // The duration rung is BUFF-ONLY. Wisteria carries a taunt and a ward
  // on one skill; rung 4 must lengthen the ward and leave the hex alone,
  // or a defensive rung silently becomes an offensive one.
  const wl = P.skillLadder(wis, P.skillCap(wis, 1));
  assert(wl.duration === 1, `ward duration rungs ${wl.duration}`);
  const wisSt = mo.abilities.find((x) => x.def === wis);
  wisSt.level = P.skillCap(wis, 1);
  const foe = place(battle, H.catherine, TEAM.ENEMY, 1);
  foe.debuffResistance = () => 0;
  mo.statusEffects = []; foe.statusEffects = [];
  A.execute(wis, mo, foe, battle);
  const ward = mo.statusEffects.find((fx) => fx.stat === 'def');
  const taunt = foe.statusEffects.find((fx) => fx.stat === 'taunted');
  assert(ward && ward.turns === 3, `ward lasted ${ward && ward.turns}, wanted 3`);
  assert(taunt && taunt.turns === 1,
    `the buff-duration rung leaked onto the taunt: ${taunt && taunt.turns} turns`);

  // perDeath takes a rung like perMirror does.
  const pl = P.skillLadder(pall, P.skillCap(pall, 2));
  assert(Math.abs(pl.mult - 0.50) < 1e-9 && Math.abs(pl.perDeath - 0.25) < 1e-9,
    `Pallbearer rungs ${JSON.stringify(pl)}`);
  assert(P.skillCooldown(pall, 8) === 5, 'Pallbearer should cycle at 5 fully levelled');
});

test('AP drains and buff strips roll a 50% gate that skill ups buy to certain', () => {
  const w = loadGame();
  const { HEROES: H, Abilities: A, Unit: U, TEAM: T, Battle: B, Meter: M,
    CONFIG: C, Progression: P } = w;
  M.resetBattle();

  // Taking a turn away and tearing a blessing off are hexes like any
  // other: 50% before accuracy is even consulted, bought to certainty by
  // the ladder. Both halves matter -- a gate nobody can close is a nerf,
  // and a gate that never opens is a dead skill.
  const drainBattle = new B();
  const eli = new U(H.eli, T.PLAYER, { level: 30, stars: 3 });
  const foe = new U(DUMMIES.rat_knight, T.ENEMY, { level: 30, stars: 3 });
  drainBattle.placeUnit(eli, 5);
  drainBattle.placeUnit(foe, 1);
  foe.hp = foe.maxHp = 10 ** 9;
  foe.hookSources = () => [];
  foe.dodgeChance = () => 0;
  foe.effectiveStat = ((base) => function (stat) {
    // Resistance out of the way: the gate is what is being measured.
    return stat === 'resistance' ? 0 : base.call(this, stat);
  })(foe.effectiveStat);

  const bolt = eli.abilities[0];
  let landed = 0;
  for (let i = 0; i < 600; i++) {
    foe.turnMeter = C.TURN_METER_MAX;
    A.execute(bolt.def, eli, foe, drainBattle);
    if (foe.turnMeter < C.TURN_METER_MAX) landed++;
  }
  assert(landed > 240 && landed < 360,
    `an unlevelled bolt should drain about half the time, drained ${landed}/600`);

  bolt.level = P.skillCap(bolt.def, 0);
  landed = 0;
  for (let i = 0; i < 200; i++) {
    foe.turnMeter = C.TURN_METER_MAX;
    A.execute(bolt.def, eli, foe, drainBattle);
    if (foe.turnMeter < C.TURN_METER_MAX) landed++;
  }
  assert(landed === 200, `a maxed bolt should never miss, drained ${landed}/200`);

  // The same shape on the other side of the rule: Cleo's whole-team
  // strip. Her chance rungs sit at the bottom of the ladder, so level 4
  // closes the gate before the stripCount rungs widen the tear.
  const stripBattle = new B();
  const cleo = new U(H.cleo, T.PLAYER, { level: 30, stars: 5 });
  const mark = new U(DUMMIES.rat_brawler, T.ENEMY, { level: 30, stars: 3 });
  stripBattle.placeUnit(cleo, 5);
  stripBattle.placeUnit(mark, 1);
  mark.hookSources = () => [];
  mark.dodgeChance = () => 0;
  mark.effectiveStat = ((base) => function (stat) {
    return stat === 'resistance' ? 0 : base.call(this, stat);
  })(mark.effectiveStat);

  const fortunes = cleo.abilities[2];
  const blessAndStrip = () => {
    mark.statusEffects = [];
    mark.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.25, turns: 3 });
    A.execute(fortunes.def, cleo, null, stripBattle);
    return !mark.statusEffects.some((fx) => fx.kind === 'buff');
  };
  let torn = 0;
  for (let i = 0; i < 600; i++) if (blessAndStrip()) torn++;
  assert(torn > 240 && torn < 360,
    `an unlevelled strip should land about half the time, tore ${torn}/600`);

  fortunes.level = 4;
  torn = 0;
  for (let i = 0; i < 200; i++) if (blessAndStrip()) torn++;
  assert(torn === 200, `a strip bought to certain should never miss, tore ${torn}/200`);
});

test('the batch-four rungs buy what they promise: chain, refund, extend, tick, keep', () => {
  const w = loadGame();
  const { HEROES: H, Abilities: A, Unit: U, TEAM: T, Battle: B, Meter: M,
    Progression: P } = w;
  M.resetBattle();
  const max = (unit, i) => { unit.abilities[i].level = P.skillCap(unit.abilities[i].def, i); };

  // Five kits in this batch needed a rung the engine had never had to
  // pay before. Each one is only worth writing down if it moves a number
  // a player can see, so each is measured at level 1 against its cap.

  // -- Posie's `chain`: the bough swings on more often --------------
  {
    const battle = new B();
    const posie = new U(H.posie, T.PLAYER, { level: 30, stars: 4 });
    const hurt = new U(DUMMIES.rat_knight, T.PLAYER, { level: 30, stars: 3 });
    battle.placeUnit(posie, 5); battle.placeUnit(hurt, 1);
    B.active = battle;
    const swings = (levelled) => {
      posie.abilities[1].level = levelled ? P.skillCap(posie.abilities[1].def, 1) : 1;
      let links = 0;
      for (let i = 0; i < 900; i++) {
        hurt.hp = 1;
        const heals = A.execute(posie.abilities[1].def, posie, hurt, battle)
          .filter((r) => r.kind === 'heal');
        links += heals.length;
      }
      return links / 900;
    };
    const base = swings(false), bought = swings(true);
    // 50% -> 60% takes the expected chain from 1/(1-p) = 2.0 links to
    // 2.5. Measured over 900 casts the gap is far wider than the noise.
    assert(bought > base + 0.2,
      `the chain rung bought nothing: ${base.toFixed(2)} -> ${bought.toFixed(2)} links`);
  }

  // -- Evelune's `refund` and `duration` ----------------------------
  {
    const battle = new B();
    const eve = new U(H.evelune, T.PLAYER, { level: 30, stars: 4 });
    const mate = new U(H.ryn, T.PLAYER, { level: 30, stars: 3 });
    battle.placeUnit(eve, 5); battle.placeUnit(mate, 1);
    B.active = battle;
    const handBack = () => {
      for (const a of mate.abilities) a.cooldownRemaining = 4;
      A.execute(eve.abilities[1].def, eve, null, battle);
      return 4 - mate.abilities[1].cooldownRemaining;
    };
    assert(handBack() === 1, 'the unlevelled refresh gave back more than a turn');
    max(eve, 1);
    assert(handBack() === 2, 'the refund rung handed back nothing');

    // extendBuffs takes `duration`: the chord is held one turn longer.
    const held = () => {
      mate.statusEffects = [];
      mate.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.2, turns: 2 });
      A.execute(eve.abilities[2].def, eve, null, battle);
      return mate.statusEffects.find((fx) => fx.kind === 'buff').turns;
    };
    assert(held() === 3, 'the plain chord did not hold the blessing a turn longer');
    max(eve, 2);
    assert(held() === 4, 'the duration rung did not lengthen the chord');
  }

  // -- Sable's `debuffPower` on an ATK-priced tick -------------------
  {
    const battle = new B();
    const sable = new U(H.sable, T.PLAYER, { level: 30, stars: 4 });
    const foe = new U(DUMMIES.rat_knight, T.ENEMY, { level: 30, stars: 3 });
    battle.placeUnit(sable, 5); battle.placeUnit(foe, 1);
    B.active = battle;
    foe.hp = foe.maxHp = 10 ** 9;
    foe.dodgeChance = () => 0;
    foe.debuffResistance = () => 0;
    const tick = () => {
      foe.statusEffects = [];
      A.execute(sable.abilities[2].def, sable, null, battle);
      const dot = foe.statusEffects.find((fx) => fx.kind === 'dot');
      return dot ? dot.amount : 0;
    };
    max(sable, 2);   // gate closed, and the severity rung with it
    const deep = tick();
    // Level 5 buys all four rungs below the severity one: the gate is
    // shut (level 4 leaves it at 90% and the seed misses one cast in ten)
    // but the tick is still the authored 30% ATK.
    sable.abilities[2].level = 5;
    const shallow = tick();
    assert(shallow > 0 && deep > 0, 'the seed never landed');
    // 30% ATK a turn -> 40%: a third more per tick.
    assert(Math.abs(deep / shallow - 4 / 3) < 0.03,
      `the severity rung paid ${(deep / shallow).toFixed(3)}x, wanted 1.333x`);
  }

  // -- Lysandra's `heal`: a wider share of the wound kept ------------
  {
    const battle = new B();
    const ly = new U(H.lysandra, T.PLAYER, { level: 30, stars: 4 });
    const foe = new U(DUMMIES.rat_knight, T.ENEMY, { level: 30, stars: 3 });
    battle.placeUnit(ly, 1); battle.placeUnit(foe, 1);
    B.active = battle;
    foe.hp = foe.maxHp = 10 ** 9;
    foe.dodgeChance = () => 0;
    ly.baseCritChance = -1;
    const kept = () => {
      ly.hp = Math.round(ly.maxHp * 0.4);
      const before = ly.hp;
      const res = A.execute(ly.abilities[0].def, ly, foe, battle);
      const dealt = res.find((r) => r.kind === 'damage').amount;
      return (ly.hp - before) / dealt;
    };
    const plain = kept();
    assert(Math.abs(plain - 0.20) < 0.01, `the stitch kept ${plain.toFixed(3)}, wanted 0.20`);
    max(ly, 0);
    const wide = kept();
    assert(Math.abs(wide - 0.25) < 0.01, `the heal rung kept ${wide.toFixed(3)}, wanted 0.25`);
  }
});

test('the last four: HP-priced damage takes the small rate, and blocks are gated', () => {
  const w = loadGame();
  const { HEROES: H, Abilities: A, Unit: U, TEAM: T, Battle: B, Meter: M,
    Progression: P } = w;
  M.resetBattle();
  const max = (unit, i) => { unit.abilities[i].level = P.skillCap(unit.abilities[i].def, i); };

  // -- Wren's shoulder is priced off her own pool ---------------------
  {
    const battle = new B();
    const wren = new U(H.wren, T.PLAYER, { level: 30, stars: 4 });
    const foe = new U(DUMMIES.rat_knight, T.ENEMY, { level: 30, stars: 3 });
    battle.placeUnit(wren, 1); battle.placeUnit(foe, 1);
    B.active = battle;
    foe.hp = foe.maxHp = 10 ** 9;
    foe.dodgeChance = () => 0;
    foe.effectiveStat = () => 0;          // no mitigation in the arithmetic
    wren.baseCritChance = -1;
    const swing = () => {
      const before = foe.hp;
      A.execute(wren.abilities[1].def, wren, foe, battle);
      return before - foe.hp;
    };
    const plain = swing();
    max(wren, 1);
    const levelled = swing();
    // 15% of her max HP -> 35%: four `heal` rungs at five points each.
    // On the ATK rate the same four rungs would have paid 55%, which on
    // a tank's health pool is a different game entirely.
    assert(Math.abs(levelled / plain - 35 / 15) < 0.02,
      `the shoulder paid ${(levelled / plain).toFixed(3)}x, wanted 2.333x`);
    assert(P.skillBonusText(H.wren.abilities[1], P.skillCap(H.wren.abilities[1], 1))
      .startsWith('+20% power'),
      `a skill that only hurts people should not advertise heal: ` +
      P.skillBonusText(H.wren.abilities[1], 7));
  }

  // -- Dorian's two locks, Asher's theft: gated, and bought shut ------
  {
    const battle = new B();
    const dor = new U(H.dorian, T.PLAYER, { level: 30, stars: 4 });
    const asher = new U(H.asher, T.PLAYER, { level: 30, stars: 4 });
    const foe = new U(DUMMIES.rat_knight, T.ENEMY, { level: 30, stars: 3 });
    battle.placeUnit(dor, 1); battle.placeUnit(asher, 2); battle.placeUnit(foe, 1);
    B.active = battle;
    foe.hp = foe.maxHp = 10 ** 9;
    foe.dodgeChance = () => 0;
    foe.debuffResistance = () => 0;

    const rate = (n, fn) => {
      let hits = 0;
      for (let i = 0; i < n; i++) { foe.statusEffects = []; if (fn()) hits++; }
      return hits / n;
    };
    const locked = () => {
      A.execute(dor.abilities[1].def, dor, foe, battle);
      return foe.healBlocked();
    };
    const base = rate(600, locked);
    assert(base > 0.4 && base < 0.6, `an unlevelled lock landed ${base.toFixed(2)} of the time`);
    max(dor, 1);
    assert(rate(200, locked) === 1, 'a bought lock still missed');

    // The lit blade rolls its two doors APART, so at base both shut
    // only about a quarter of the time -- the same independence Toll's
    // Reckoning has, and the description says so.
    const both = rate(900, () => {
      A.execute(dor.abilities[2].def, dor, foe, battle);
      return foe.healBlocked() && foe.buffsSealed();
    });
    assert(both > 0.17 && both < 0.33,
      `two independent gates shut together ${both.toFixed(2)} of the time, wanted ~0.25`);
    max(dor, 2);
    assert(rate(200, () => {
      A.execute(dor.abilities[2].def, dor, foe, battle);
      return foe.healBlocked() && foe.buffsSealed();
    }) === 1, 'the bought blade still left a door open');

    // Asher's theft takes the same admission as a strip.
    const steal = () => {
      asher.statusEffects = [];
      foe.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.2, turns: 4 });
      A.execute(asher.abilities[1].def, asher, foe, battle);
      return asher.statusEffects.some((fx) => fx.kind === 'buff');
    };
    const took = rate(600, steal);
    assert(took > 0.4 && took < 0.6, `an unlevelled theft landed ${took.toFixed(2)}`);
    max(asher, 1);
    assert(rate(200, steal) === 1, 'a bought theft still came up empty');
  }
});

test('a meter gift never knocks an overfilled unit backwards', () => {
  const w = loadGame();
  const { HEROES: H, Unit: U, TEAM: T, Battle: B, Meter: M, CONFIG: C } = w;
  M.resetBattle();
  // Meters overfill past 100% so turn order among everyone already ready
  // stays concrete. Any passive that GIVES meter and clamps to the cap
  // turns its own gift into a punishment: a unit sitting at 140% handed
  // 5% would drop to 100%. Every gain path is checked here because the
  // clamp was removed from the ability code once and left in six
  // passives, where it went unnoticed.
  const battle = new B();
  const viv = new U(H.vivian, T.PLAYER, { level: 30, stars: 4 });
  const mate = new U(DUMMIES.rat_knight, T.PLAYER, { level: 30, stars: 3 });
  battle.placeUnit(viv, 5); battle.placeUnit(mate, 1);
  B.active = battle;

  const over = C.TURN_METER_MAX * 1.4;
  viv.turnMeter = over;
  mate.hp = Math.round(mate.maxHp * 0.5);
  mate.heal(50, viv);
  assert(viv.turnMeter > over,
    `Sympathetic Growth cut an overfilled meter from ${over} to ${viv.turnMeter}`);

  // Tanner hands the ally furthest from acting 10% at the start of his.
  const battle2 = new B();
  const prince = new U(H.tanner, T.PLAYER, { level: 30, stars: 5 });
  const subject = new U(DUMMIES.rat_knight, T.PLAYER, { level: 30, stars: 3 });
  battle2.placeUnit(prince, 5); battle2.placeUnit(subject, 1);
  B.active = battle2;
  subject.turnMeter = over;
  prince.startTurn(battle2);
  assert(subject.turnMeter > over,
    `Tanner's duty cut an overfilled meter to ${subject.turnMeter}`);

  // And the roster-wide guard: no gain path may clamp to the cap.
  const src = require('fs').readFileSync('js/data/heroes/humans.js', 'utf8') +
    require('fs').readFileSync('js/data/elemental_bosses.js', 'utf8');
  const clamps = src.match(/turnMeter = Math\.min\(CONFIG\.TURN_METER_MAX/g) || [];
  assert(clamps.length === 0,
    `${clamps.length} passive(s) still clamp a meter gain to the cap`);
});

test('a row sweep collapses onto the next row in rather than fizzling', () => {
  // Seven skills aim at the enemy BACK row and five at the ally FRONT
  // row. Both used to return an empty target set when nobody stood
  // there -- the turn and the cooldown spent on nothing. Lin's Center
  // of Attention is a skill 1 with no cooldown, so that was her basic
  // attack disappearing against a team with an empty back line.
  const backSweeps = [];
  const frontSweeps = [];
  for (const def of Object.values(HEROES)) {
    def.abilities.forEach((a, i) => {
      if (a.targeting === 'back-enemies') backSweeps.push([def, a, i]);
      if (a.targeting === 'front-allies') frontSweeps.push([def, a, i]);
    });
  }
  assert(backSweeps.length > 0 && frontSweeps.length > 0,
    'no row sweeps found -- the targeting names must have changed');

  // Every back-row sweep, cast at a team standing only in the FRONT
  // hexes. It has to find them.
  for (const [def, a] of backSweeps) {
    const battle = makeBattle();
    const caster = place(battle, def, TEAM.PLAYER, 0);
    const frontIdx = battle.enemySlots
      .map((s, i) => [s, i]).filter(([s]) => s.position === POSITION.FRONT)
      .map(([, i]) => i);
    const foes = frontIdx.map((i) => place(battle, HEROES.oak, TEAM.ENEMY, i));
    const hit = Abilities.resolveTargets(a, caster, null, battle);
    assert(hit.length === foes.length,
      `${def.id} ${a.name} found ${hit.length} of ${foes.length} front-row ` +
      'enemies when the back row was empty');
    assert(hit.every((u) => u.slot.position === POSITION.FRONT),
      `${def.id} ${a.name} collapsed onto the wrong row`);
  }

  // And every front-row ally sweep, cast by a team standing only in the
  // BACK hexes.
  for (const [def, a] of frontSweeps) {
    const battle = makeBattle();
    const backIdx = battle.playerSlots
      .map((s, i) => [s, i]).filter(([s]) => s.position === POSITION.BACK)
      .map(([, i]) => i);
    const caster = place(battle, def, TEAM.PLAYER, backIdx[0]);
    const mates = backIdx.map((i, n) =>
      n === 0 ? caster : place(battle, HEROES.oak, TEAM.PLAYER, i));
    const hit = Abilities.resolveTargets(a, caster, null, battle);
    assert(hit.length === mates.length,
      `${def.id} ${a.name} blessed ${hit.length} of ${mates.length} back-row ` +
      'allies when the front row was empty');
  }

  // The centre is preferred over the front: a back sweep stops at the
  // first row it finds walking inward, it does not skip to the far side.
  const battle = makeBattle();
  const lin = place(battle, HEROES.lin, TEAM.PLAYER, 0);
  const centreIdx = battle.enemySlots.findIndex(
    (sl) => sl.position === POSITION.CENTER);
  const frontIdx = battle.enemySlots.findIndex(
    (sl) => sl.position === POSITION.FRONT);
  const middle = place(battle, HEROES.oak, TEAM.ENEMY, centreIdx);
  place(battle, HEROES.oak, TEAM.ENEMY, frontIdx);
  const landed = Abilities.resolveTargets(
    lin.abilities[0].def, lin, null, battle);
  assert(landed.length === 1 && landed[0] === middle,
    'a back sweep skipped the centre and went straight to the front');

  // rowFallback is what the ability bar puts in its tooltip, so it has
  // to agree with where the sweep actually went -- and stay quiet when
  // the printed row is occupied.
  const note = Abilities.rowFallback(lin.abilities[0].def, lin, battle);
  assert(note && note.aimed === POSITION.BACK && note.landed === POSITION.CENTER,
    `rowFallback said ${JSON.stringify(note)} for a back sweep landing centre`);
  const backIdx = battle.enemySlots.findIndex(
    (sl) => sl.position === POSITION.BACK);
  place(battle, HEROES.oak, TEAM.ENEMY, backIdx);
  assert(Abilities.rowFallback(lin.abilities[0].def, lin, battle) === null,
    'rowFallback spoke up for a sweep landing exactly where it was aimed');

  // Nobody left standing is still nobody: the collapse walks the rows,
  // it does not invent a target.
  const empty = makeBattle();
  const alone = place(empty, HEROES.lin, TEAM.PLAYER, 0);
  assert(Abilities.resolveTargets(
    alone.abilities[0].def, alone, null, empty).length === 0,
    'a row sweep found a target on an empty side');
});

test('Hallow prices a storm off the size of the crowd it catches', () => {
  // The Gulldigger mechanic: `perTarget` pays for every body BEYOND the
  // first. Every other AoE dealer on the roster is paid the same for a
  // sweep that lands on one enemy as for one that lands on seven.
  const hallow = HEROES.hallow;
  const squall = hallow.abilities[1];
  const uncork = hallow.abilities[2];
  assert(squall.effects[0].perTarget > 0 && uncork.effects[0].perTarget > 0,
    'Hallow lost his crowd bonus');

  // One field, N identical dummies, damage measured per body.
  function sweep(ability, foeCount, hex = POSITION.CENTER, maxed = false) {
    const battle = makeBattle();
    const arr = battle.playerSlots;
    const h = new Unit(hallow, TEAM.PLAYER, { level: 30, stars: 5 });
    h.slot = arr[arr.findIndex((sl) => sl.position === hex)];
    battle.units.push(h);
    if (maxed) {
      h.abilities.forEach((a, i) => { a.level = Progression.skillCap(a.def, i); });
    }
    for (let i = 0; i < foeCount; i++) {
      const f = new Unit(DUMMIES.rat_knight, TEAM.ENEMY, { level: 30, stars: 4 });
      f.slot = battle.enemySlots[i];
      f.hp = f.maxHp = 9e6;
      battle.units.push(f);
    }
    const foes = battle.livingUnits(TEAM.ENEMY);
    const before = foes.map((u) => u.hp);
    const real = Math.random;
    Math.random = () => 0.99; // no crit, and the AP gate fails
    Abilities.execute(ability, h, foes[0], battle);
    Math.random = real;
    return { each: before[0] - foes[0].hp, meter: h.turnMeter,
      all: foes.map((u, i) => before[i] - u.hp) };
  }

  // Every victim of one cast takes the SAME storm -- the crowd is
  // counted once, for the whole sweep.
  const wide = sweep(squall, 5);
  assert(new Set(wide.all).size === 1,
    `one squall dealt ${[...new Set(wide.all)].join('/')} to different birds`);

  // And the curve is exactly the printed one: base at a crowd of one,
  // plus perTarget for each body after that.
  const one = sweep(squall, 1).each;
  for (const n of [3, 5, 7]) {
    const got = sweep(squall, n).each;
    const want = (squall.effects[0].mult + squall.effects[0].perTarget * (n - 1)) /
      squall.effects[0].mult;
    assert(Math.abs(got / one - want) < 0.02,
      `Squall Line at ${n} bodies paid ${(got / one).toFixed(3)}x, wanted ${want.toFixed(3)}x`);
  }

  // The trade that makes it a decision: against a lone target his
  // cooldown-free single-target press beats his own ultimate.
  const solo = sweep(hallow.abilities[0], 1, POSITION.CENTER, true).each;
  const ult = sweep(uncork, 1, POSITION.CENTER, true).each;
  assert(solo > ult * 0.8,
    `Uncork (${ult}) buries Cork Snap (${solo}) even against one bird`);

  // Eye of the Storm pays per body struck, and only on a real sweep.
  const step = CONFIG.TURN_METER_MAX * 0.05;
  for (const n of [3, 5, 7]) {
    const got = sweep(squall, n).meter;
    assert(Math.abs(got - step * n) < 0.001,
      `a ${n}-bird squall paid ${got} meter, wanted ${step * n}`);
  }
  assert(sweep(hallow.abilities[0], 5).meter === 0,
    'a single-target strike paid the sweep passive');

  // Stormglass reads the shape of the cast, not the aim of it: the back
  // hex pays on a team sweep and never on Cork Snap.
  const flatCtr = sweep(squall, 5, POSITION.CENTER).each;
  const flatBack = sweep(squall, 5, POSITION.BACK).each;
  // Read the figure off the hex rather than restating it, so a balance
  // pass moves one number instead of two.
  const hexPays = hallow.positional.hooks.damageDealtMult(
    null, null, { targeting: 'all-enemies' });
  assert(Math.abs(flatBack / flatCtr - hexPays) < 0.02,
    `Stormglass paid ${(flatBack / flatCtr).toFixed(3)}x on a team sweep, wanted ${hexPays}x`);
  const snapCtr = sweep(hallow.abilities[0], 5, POSITION.CENTER).each;
  const snapBack = sweep(hallow.abilities[0], 5, POSITION.BACK).each;
  assert(snapCtr === snapBack,
    'Stormglass paid out on a single-target strike');
});

test("Ike's pike reaches the centre hex, and only his does", () => {
  const ike = HEROES.ike;
  const sweep = ike.abilities[0];
  assert(sweep.targeting === 'front-enemies', 'Sweep the Deck stopped being a front sweep');

  // A field with the enemy standing in named hexes, and Ike out front.
  function field(positions, def = ike) {
    const battle = makeBattle();
    const h = new Unit(def, TEAM.PLAYER, { level: 30, stars: def.rarity });
    h.slot = battle.playerSlots[
      battle.playerSlots.findIndex((sl) => sl.position === POSITION.FRONT)];
    battle.units.push(h);
    const taken = new Set();
    for (const pos of positions) {
      const i = battle.enemySlots.findIndex(
        (sl, n) => sl.position === pos && !taken.has(n));
      taken.add(i);
      const f = new Unit(DUMMIES.rat_knight, TEAM.ENEMY, { level: 30, stars: 4 });
      f.slot = battle.enemySlots[i];
      f.hp = f.maxHp = 9e6;
      battle.units.push(f);
    }
    return { battle, h };
  }
  const hitPositions = (ability, positions, def = ike) => {
    const { battle, h } = field(positions, def);
    return Abilities.resolveTargets(ability, h, null, battle)
      .map((u) => u.slot.position).sort();
  };
  const F = POSITION.FRONT, C = POSITION.CENTER, B = POSITION.BACK;

  // The whole passive: a front sweep that also takes the centre.
  assert(hitPositions(sweep, [F, F, F]).join() === [F, F, F].join(),
    'Sweep the Deck invented a target that was not there');
  const withCentre = hitPositions(sweep, [F, F, F, C]);
  assert(withCentre.length === 4 && withCentre.includes(C),
    `Long Reach missed the centre: hit ${withCentre.join()}`);
  // It never reaches further than the centre.
  assert(!hitPositions(sweep, [F, C, B]).includes(B),
    'Long Reach went all the way to the back row');

  // The reach is his, not the targeting's: a front sweep cast by a hero
  // without the hook stops at the front rank.
  const toll = HEROES.toll;
  assert(toll.abilities[0].targeting === 'front-enemies', 'First Toll moved');
  assert(!hitPositions(toll.abilities[0], [F, F, C], toll).includes(C),
    'Long Reach leaked onto a hero who does not have it');

  // And it does not touch his other two skills, which are not front
  // sweeps at all.
  assert(hitPositions(ike.abilities[2], [F, F, C]).length === 0,
    'Skewer resolved a group without being handed a target');

  // The extra body pays twice: one more victim AND a deeper crowd
  // bonus on every victim, which is why the passive is worth a slot.
  function damage(positions) {
    const { battle, h } = field(positions);
    h.abilities.forEach((a, i) => { a.level = Progression.skillCap(a.def, i); });
    const foes = battle.livingUnits(TEAM.ENEMY);
    const before = foes.map((u) => u.hp);
    const real = Math.random;
    Math.random = () => 0.99;
    Abilities.execute(sweep, h, foes[0], battle);
    Math.random = real;
    const each = foes.map((u, i) => before[i] - u.hp).filter((x) => x > 0);
    return { each: each[0], total: each.reduce((a, c) => a + c, 0) };
  }
  const three = damage([F, F, F]);
  const four = damage([F, F, F, C]);
  assert(four.each > three.each,
    `a fourth body did not deepen the crowd bonus (${three.each} -> ${four.each})`);
  assert(four.total > three.total * 1.3,
    `the centre hex added only ${Math.round((four.total / three.total - 1) * 100)}%`);
});

test("Jack is one skill and a powder keg, and the keg only goes off for him", () => {
  const jack = HEROES.jack;
  assert(jack.rarity === 1 && jack.abilities.length === 1,
    `Jack is a ${jack.rarity}-star with ${jack.abilities.length} skills`);
  assert(jack.abilities[0].cooldown === 0, "Jack's only skill has a cooldown");

  // A real Battle, not the stub: the death ring lives on Battle.active
  // and the keg is fired from inside it.
  function field() {
    const battle = new Battle();
    const j = new Unit(jack, TEAM.PLAYER, { level: 30, stars: 1 });
    battle.placeUnit(j, 1);
    // Three enemies spread across the hexes, so the keg has both a
    // front row to hit and somebody behind it to leave alone.
    battle.enemySlots.forEach((sl, i) => {
      if (i > 3) return;
      const f = new Unit(DUMMIES.rat_knight, TEAM.ENEMY, { level: 5, stars: 3 });
      battle.placeUnit(f, i);
    });
    return { battle, j };
  }

  // Kill Jack and the front row should feel it.
  let { battle, j } = field();
  let foes = battle.livingUnits(j.enemyTeam());
  foes.forEach((u) => { u.hp = u.maxHp = 9e6; });
  const before = foes.map((u) => u.hp);
  j.takeDamage(9e9);
  assert(!j.alive, 'Jack survived nine billion');
  const dealt = foes.map((u, i) => before[i] - u.hp);
  const front = foes.filter((u) => u.isBoss || u.slot.position === POSITION.FRONT);
  assert(front.length > 0, 'the probe stood nobody on a front hex');
  const hurtFront = foes.filter((u, i) => dealt[i] > 0 &&
    (u.isBoss || u.slot.position === POSITION.FRONT));
  assert(hurtFront.length === front.length,
    `the keg reached ${hurtFront.length} of ${front.length} front-hex enemies`);
  foes.forEach((u, i) => {
    const isFront = u.isBoss || u.slot.position === POSITION.FRONT;
    assert(isFront || dealt[i] === 0,
      `the keg hit a ${u.slot.position}-hex enemy for ${dealt[i]}`);
  });

  // It is HIS death that sets it off -- an ally dying beside him does
  // nothing, which is what separates this from every other onUnitDied
  // passive on the roster.
  ({ battle, j } = field());
  foes = battle.livingUnits(j.enemyTeam());
  foes.forEach((u) => { u.hp = u.maxHp = 9e6; });
  const quiet = foes.map((u) => u.hp);
  foes[foes.length - 1].takeDamage(9e9); // an enemy falls; Jack lives
  assert(j.alive, 'the probe killed the wrong bird');
  const stray = foes.filter((u, i) => u.alive && quiet[i] - u.hp > 0);
  assert(stray.length === 0,
    `the keg went off for somebody else's death, hitting ${stray.length}`);

  // And the three passives that already read onUnitDied still ignore
  // their own: adding the corpse to the ring must not have paid them.
  for (const id of ['morrow', 'lenore', 'sable']) {
    const b = new Battle();
    const self = new Unit(HEROES[id], TEAM.PLAYER, { level: 30, stars: HEROES[id].rarity });
    b.placeUnit(self, 1);
    b.placeUnit(new Unit(DUMMIES.rat_knight, TEAM.ENEMY, { level: 5, stars: 3 }), 1);
    self.hp = Math.round(self.maxHp / 2);
    const cds = self.abilities.map((a) => { a.cooldownRemaining = 2; return 2; });
    self.takeDamage(9e9);
    assert(!self.alive, `${id} survived nine billion`);
    assert(self.hp === 0, `${id} mended himself out of his own death to ${self.hp}`);
    self.abilities.forEach((a, i) => {
      assert(a.cooldownRemaining === cds[i],
        `${id}'s own death moved his own cooldown to ${a.cooldownRemaining}`);
    });
  }
});

test('Phil throws past armour, and the harder the armour the more it is worth', () => {
  const phil = HEROES.phil;
  assert(phil.rarity === 2 && phil.abilities.length === 2,
    `Phil is a ${phil.rarity}-star with ${phil.abilities.length} skills`);
  assert(phil.passive.hooks.defIgnoreAdd > 0, 'Phil lost his armour-blindness');

  // One back-hex victim of a stated DEF, hit by Slop Toss.
  function hit(defStat, hero = phil) {
    const battle = makeBattle();
    const h = new Unit(hero, TEAM.PLAYER, { level: 30, stars: hero.rarity });
    h.slot = battle.playerSlots[
      battle.playerSlots.findIndex((sl) => sl.position === POSITION.BACK)];
    battle.units.push(h);
    const f = new Unit(DUMMIES.rat_knight, TEAM.ENEMY, { level: 30, stars: 4 });
    f.slot = battle.enemySlots.find((sl) => sl.position === POSITION.BACK);
    f.hp = f.maxHp = 9e6;
    f.baseDef = defStat;
    battle.units.push(f);
    const before = f.hp;
    const real = Math.random;
    Math.random = () => 0.99; // no crit, and the rot gate fails
    Abilities.execute(hero.abilities[0], h, f, battle);
    Math.random = real;
    return before - f.hp;
  }

  // Measured against the same victim with the hook on and off, so the
  // only thing that changed is the armour it slipped past.
  const saved = phil.passive.hooks.defIgnoreAdd;
  const gains = [];
  for (const armour of [100, 400, 1200]) {
    const withPen = hit(armour);
    delete phil.passive.hooks.defIgnoreAdd;
    const without = hit(armour);
    phil.passive.hooks.defIgnoreAdd = saved;
    assert(withPen > without,
      `Finds a Gap did nothing against ${armour} DEF (${without} -> ${withPen})`);
    gains.push(withPen / without);
  }
  // The whole argument for the passive: it is the sect's answer to a
  // front rank made of armour, so it has to be worth MORE the tankier
  // the target is, not a flat rider.
  assert(gains[2] > gains[1] && gains[1] > gains[0],
    `the gap paid ${gains.map((x) => `${Math.round((x - 1) * 100)}%`).join(' / ')} ` +
    'against rising armour -- it should climb');

  // It is his, not the targeting's: strip it and an identical sweep by
  // another hero is unaffected either way.
  const other = HEROES.hallow;
  const before = hit(400, other);
  delete phil.passive.hooks.defIgnoreAdd;
  const after = hit(400, other);
  phil.passive.hooks.defIgnoreAdd = saved;
  assert(before === after, "Phil's armour-blindness leaked onto Hallow");

  // And the rot lands with the gate forced open, at the printed size.
  const battle = makeBattle();
  const h = new Unit(phil, TEAM.PLAYER, { level: 30, stars: 2 });
  h.slot = battle.playerSlots[
    battle.playerSlots.findIndex((sl) => sl.position === POSITION.BACK)];
  battle.units.push(h);
  const f = new Unit(DUMMIES.rat_knight, TEAM.ENEMY, { level: 30, stars: 4 });
  f.slot = battle.enemySlots.find((sl) => sl.position === POSITION.BACK);
  f.hp = f.maxHp = 9e6;
  battle.units.push(f);
  const real = Math.random;
  Math.random = () => 0;
  Abilities.execute(phil.abilities[1], h, f, battle);
  Math.random = real;
  const rot = f.statusEffects.filter((fx) => fx.kind === 'dot');
  assert(rot.length === 1, `Chum the Water left ${rot.length} rots`);
  assert(rot[0].turns === 3, `the rot runs ${rot[0].turns} turns`);
  const want = Math.round(h.effectiveStat('atk') * 0.25);
  assert(Math.abs(rot[0].amount - want) <= 1,
    `the rot ticks ${rot[0].amount}, wanted about ${want}`);
});

test('Peck feeds a full table better than a thin one, and wastes no overheal', () => {
  const peck = HEROES.peck;
  const pot = peck.abilities[1];
  const belly = peck.abilities[2];
  assert(pot.effects[0].perTarget > 0 && belly.effects[0].perTarget > 0,
    'Peck lost his crowd bonus');
  assert(peck.abilities[0].effects[0].perTarget === undefined,
    'the single-bowl mend grew a crowd bonus');

  // Peck plus `n - 1` starving mates, all at 1 HP.
  function table(idx, n, hex = POSITION.CENTER, maxed = true) {
    const battle = makeBattle();
    const p = new Unit(peck, TEAM.PLAYER, { level: 30, stars: 3 });
    p.slot = battle.playerSlots[
      battle.playerSlots.findIndex((sl) => sl.position === hex)];
    battle.units.push(p);
    if (maxed) {
      p.abilities.forEach((a, i) => { a.level = Progression.skillCap(a.def, i); });
    }
    const mates = [p];
    for (let i = 0; i < n - 1; i++) {
      // Roomy: the helping is a share of PECK's pool, and a 1-star's is
      // smaller than one serving -- without room the last birds read
      // back their own capacity instead of what they were handed.
      const m = roomy(new Unit(HEROES.jack, TEAM.PLAYER, { level: 30, stars: 1 }));
      m.slot = battle.playerSlots.filter(
        (sl) => !battle.units.some((u) => u.slot === sl))[0];
      battle.units.push(m);
      mates.push(m);
    }
    mates.forEach((u) => { u.hp = 1; });
    const before = mates.map((u) => u.hp);
    const real = Math.random;
    Math.random = () => 0.99;
    Abilities.execute(peck.abilities[idx], p, mates[mates.length - 1], battle);
    Math.random = real;
    return {
      healed: mates.map((u, i) => u.hp - before[i]),
      ward: mates.map((u) => u.shieldTotal()),
      wardTurns: (p.statusEffects.find((fx) => fx.kind === 'shield') || {}).turns,
    };
  }

  // One pot, one helping size: the crowd is counted once for the whole
  // sitting, so the last bird served eats as well as the first.
  const five = table(1, 5);
  assert(new Set(five.healed).size === 1,
    `one pot fed ${[...new Set(five.healed)].join('/')} to different birds`);

  // And the helping GROWS with the table. This is the sect's whole
  // argument on the friendly side, so it is pinned rather than assumed.
  const sizes = [1, 3, 5, 7].map((n) => table(1, n).healed[0]);
  for (let i = 1; i < sizes.length; i++) {
    assert(sizes[i] > sizes[i - 1],
      `the pot did not stretch: ${sizes.join(' -> ')}`);
  }
  const lad = Progression.skillLadder(pot, Progression.skillCap(pot, 1));
  const step = (pot.effects[0].perTarget + (lad.perTarget || 0)) * 2;
  assert(Math.abs((sizes[1] / sizes[0]) - 1 -
    step / (pot.effects[0].pct + (lad.heal || 0))) < 0.02,
    `two extra mouths moved the helping by ${(sizes[1] / sizes[0] - 1).toFixed(3)}`);

  // The ward takes the same bonus, and Slow Simmer keeps it warm one
  // turn longer -- from the centre hex only.
  const wards = [1, 3, 5, 7].map((n) => table(2, n).ward[0]);
  for (let i = 1; i < wards.length; i++) {
    assert(wards[i] > wards[i - 1], `the ward did not stretch: ${wards.join(' -> ')}`);
  }
  const mid = table(2, 5, POSITION.CENTER).wardTurns;
  const off = table(2, 5, POSITION.BACK).wardTurns;
  assert(mid === off + 1,
    `Slow Simmer gave ${mid} turns from the centre against ${off} elsewhere`);

  // Nothing Goes Back in the Pot: mend somebody who is already full and
  // half of the waste sets as a ward instead.
  function overfeed(hero) {
    const battle = makeBattle();
    const h = new Unit(hero, TEAM.PLAYER, { level: 30, stars: hero.rarity });
    h.slot = battle.playerSlots[
      battle.playerSlots.findIndex((sl) => sl.position === POSITION.CENTER)];
    battle.units.push(h);
    const mate = new Unit(HEROES.jack, TEAM.PLAYER, { level: 30, stars: 1 });
    mate.slot = battle.playerSlots.filter(
      (sl) => !battle.units.some((u) => u.slot === sl))[0];
    battle.units.push(mate);
    mate.hp = mate.maxHp; // nothing to mend: all of it is waste
    const mend = hero.abilities.find((a) =>
      Abilities.sideOf(a.targeting) === 'ally' &&
      (a.effects || []).some((e) => /^heal/.test(e.type)));
    assert(mend, `${hero.id} has no ally mend to overfeed with`);
    Abilities.execute(mend, h, mate, battle);
    return mate.shieldTotal();
  }
  assert(overfeed(peck) > 0, 'Peck let a full bowl go to waste');
  assert(overfeed(HEROES.emily) === 0,
    "another healer's overheal turned into a ward -- the passive leaked");
});

test('Talon sets deeper the more of them pull, and takes the strain for the crew', () => {
  const talon = HEROES.talon;
  assert(talon.passive.hooks.damageTakenMult, 'Talon lost Ground Tackle');

  // A real Battle: Ground Tackle counts the living, and Set Fast fires
  // out of takeDamage, so both need Battle.active.
  //
  // The victims are rat_brawlers, NOT rat_knights. The knight's own
  // passive (Bulwark) gives it 15% mitigation once three of its allies
  // stand, so a bench that varies enemy COUNT against knights measures
  // the knight rather than the hero -- which is exactly the trap this
  // comment exists to stop the next person walking into.
  function field(nFoes, hex = POSITION.FRONT, frontOnly = true) {
    const battle = new Battle();
    const t = new Unit(talon, TEAM.PLAYER, { level: 30, stars: 4 });
    battle.placeUnit(t, battle.playerSlots.findIndex((sl) => sl.position === hex));
    t.abilities.forEach((a, i) => { a.level = Progression.skillCap(a.def, i); });
    const idx = frontOnly
      ? battle.enemySlots.map((sl, i) => [sl, i])
        .filter(([sl]) => sl.position === POSITION.FRONT).map(([, i]) => i)
      : battle.enemySlots.map((sl, i) => i);
    const foes = [];
    for (let i = 0; i < nFoes; i++) {
      const f = new Unit(DUMMIES.rat_brawler, TEAM.ENEMY, { level: 30, stars: 4 });
      battle.placeUnit(f, idx[i]);
      f.hp = f.maxHp = 9e6;
      foes.push(f);
    }
    return { battle, t, foes };
  }

  // Ground Tackle: 5% off per living enemy, and it stops at six so a
  // seven-hex field and a boss room are worth the same.
  const taken = [1, 2, 4, 6, 7].map((n) =>
    field(n, POSITION.FRONT, false).t.damageTakenMult(null));
  for (let i = 1; i < 4; i++) {
    assert(taken[i] < taken[i - 1],
      `Ground Tackle did not deepen: ${taken.map((x) => x.toFixed(2)).join(' -> ')}`);
  }
  assert(Math.abs(taken[3] - taken[4]) < 0.001,
    `the seventh enemy still paid: ${taken[3].toFixed(2)} vs ${taken[4].toFixed(2)}`);
  assert(Math.abs(taken[3] - 0.70) < 0.001,
    `a full line leaves him on x${taken[3].toFixed(2)}, wanted x0.70`);

  // His swing is priced off DEF and takes the sect's crowd bonus.
  const swing = [1, 2, 3].map((n) => {
    const { battle, t, foes } = field(n);
    const before = foes.map((u) => u.hp);
    const real = Math.random;
    Math.random = () => 0.99;
    Abilities.execute(t.abilities[0].def, t, foes[0], battle);
    Math.random = real;
    const dealt = foes.map((u, i) => before[i] - u.hp);
    assert(dealt.every((d) => d === dealt[0]),
      `one swing dealt ${[...new Set(dealt)].join('/')} to different bodies`);
    return dealt[0];
  });
  for (let i = 1; i < swing.length; i++) {
    assert(swing[i] > swing[i - 1],
      `Anchor Swing did not deepen with the crowd: ${swing.join(' -> ')}`);
  }

  // Snub the Cable: the first team-wide mitigation on the roster, and
  // buffPower deepens it AWAY from neutral rather than toward it.
  {
    const { battle, t } = field(3);
    const mate = new Unit(HEROES.jack, TEAM.PLAYER, { level: 30, stars: 1 });
    battle.placeUnit(mate, battle.playerSlots.findIndex(
      (sl) => sl.position === POSITION.BACK));
    const plain = mate.damageTakenMult(null);
    Abilities.execute(t.abilities[1].def, t, mate, battle);
    const covered = mate.damageTakenMult(null);
    assert(covered < plain, `the crew took x${covered} against x${plain} uncovered`);
    const printed = talon.abilities[1].effects[0].mult;
    assert(covered < printed - 0.001,
      `a maxed Snub sat at x${covered}, no deeper than its printed x${printed}`);
  }

  // Set Fast: swinging at an anchor costs the swinger, and only while
  // he is standing on the hex it names.
  for (const [hex, shouldPay] of [[POSITION.FRONT, true], [POSITION.CENTER, false]]) {
    const { t, foes } = field(2, hex);
    foes[0].turnMeter = CONFIG.TURN_METER_MAX * 0.9;
    const before = foes[0].turnMeter;
    t.takeDamage(100, foes[0]);
    const paid = before - foes[0].turnMeter;
    assert(shouldPay ? paid > 0 : paid === 0,
      `on the ${hex} hex the attacker paid ${Math.round(paid)} meter`);
  }
});

test('Bo eats one meal per bird he knocks down, and a big pouch holds more', () => {
  const bo = HEROES.bo;
  assert(bo.passive.hooks.onDealtDamage, 'Bo lost Full Pouch');

  function field(nFoes, hex = POSITION.FRONT) {
    const battle = new Battle();
    const b = new Unit(bo, TEAM.PLAYER, { level: 30, stars: 3 });
    battle.placeUnit(b, battle.playerSlots.findIndex((sl) => sl.position === hex));
    b.abilities.forEach((a, i) => { a.level = Progression.skillCap(a.def, i); });
    // rat_brawler, not rat_knight: the knight's Bulwark passive changes
    // its own mitigation once three allies stand, which would move the
    // damage under a test that varies enemy COUNT.
    const idx = battle.enemySlots.map((sl, i) => [sl, i])
      .filter(([sl]) => sl.position === POSITION.FRONT).map(([, i]) => i);
    const foes = [];
    for (let i = 0; i < nFoes; i++) {
      const f = new Unit(DUMMIES.rat_brawler, TEAM.ENEMY, { level: 30, stars: 4 });
      battle.placeUnit(f, idx[i]);
      f.hp = f.maxHp = 9e6;
      foes.push(f);
    }
    return { battle, b, foes };
  }

  // One meal per body: the sect's crowd bonus, eaten rather than dealt.
  const meals = [1, 2, 3].map((n) => {
    const { battle, b, foes } = field(n);
    b.hp = Math.round(b.maxHp / 2);
    const before = b.hp;
    const real = Math.random;
    Math.random = () => 0.99;
    Abilities.execute(bo.abilities[0], b, foes[0], battle);
    Math.random = real;
    const dealt = foes.map((u) => u.maxHp - u.hp).filter((x) => x > 0);
    assert(dealt.length === n, `the sweep caught ${dealt.length} of ${n}`);
    return b.hp - before;
  });
  for (let i = 1; i < meals.length; i++) {
    assert(meals[i] > meals[i - 1], `the pouch did not fill: ${meals.join(' -> ')}`);
  }
  // Each body is worth the SAME meal -- it is priced off his pool, not
  // off the damage, which is what separates it from a drain.
  assert(Math.abs(meals[2] / meals[0] - 3) < 0.05,
    `three birds fed him ${(meals[2] / meals[0]).toFixed(2)}x one, wanted 3x`);

  // A tank does not out-hit the sect's striker on totals: Bo has one
  // damage button and Ike has three, plus a passive that widens his.
  assert(bo.abilities.filter((a) =>
    (a.effects || []).some((e) => /^damage/.test(e.type))).length === 2,
    'Bo grew a third damage skill');

  // Deep Pouch: read on the PATIENT, so it widens a mend from anywhere.
  for (const [hex, wants] of [[POSITION.FRONT, true], [POSITION.CENTER, false]]) {
    const { b } = field(1, hex);
    b.hp = 1;
    const got = b.heal(1000, null);
    assert(wants ? got > 1000 : got === 1000,
      `on the ${hex} hex a 1000 mend gave him ${got}`);
  }
  // And it is his alone.
  {
    const battle = new Battle();
    const other = new Unit(HEROES.talon, TEAM.PLAYER, { level: 30, stars: 4 });
    battle.placeUnit(other, battle.playerSlots.findIndex(
      (sl) => sl.position === POSITION.FRONT));
    other.hp = 1;
    assert(other.heal(1000, null) === 1000,
      "Deep Pouch leaked onto another hero on the same hex");
  }

  // The pouch stays shut for an ally's damage and for a whiff.
  {
    const { battle, b, foes } = field(1);
    b.hp = Math.round(b.maxHp / 2);
    const before = b.hp;
    foes[0].takeDamage(0, b);
    assert(b.hp === before, 'a zero-damage hit still fed him');
  }
});

test('Wanda pipes louder to a fuller deck, and only her blessings carry', () => {
  const wanda = HEROES.wanda;
  assert(wanda.rarity === 2 && wanda.abilities.length === 2,
    `Wanda is a ${wanda.rarity}-star with ${wanda.abilities.length} skills`);
  const call = wanda.abilities[1];
  assert(call.effects[0].perTarget > 0, 'the call lost its crowd bonus');

  function crew(n, hex = POSITION.BACK) {
    const battle = new Battle();
    const w = new Unit(wanda, TEAM.PLAYER, { level: 30, stars: 2 });
    battle.placeUnit(w, battle.playerSlots.findIndex((sl) => sl.position === hex));
    w.abilities.forEach((a, i) => { a.level = Progression.skillCap(a.def, i); });
    const mates = [w];
    for (let i = 0; i < n - 1; i++) {
      const free = battle.playerSlots.findIndex(
        (sl) => !battle.units.some((u) => u.slot === sl));
      const m = new Unit(HEROES.jack, TEAM.PLAYER, { level: 30, stars: 1 });
      battle.placeUnit(m, free);
      mates.push(m);
    }
    mates.forEach((u) => { u.turnMeter = 0; });
    return { battle, w, mates };
  }

  // The call is worth more the more of the crew answers it -- the
  // sect's crowd bonus, on tempo rather than on damage.
  const pushed = [1, 3, 5, 7].map((n) => {
    const { battle, w, mates } = crew(n);
    Abilities.execute(call, w, mates[mates.length - 1], battle);
    const got = mates.map((u) => u.turnMeter);
    assert(new Set(got).size === 1,
      `one call pushed ${[...new Set(got)].join('/')} to different birds`);
    return got[0];
  });
  for (let i = 1; i < pushed.length; i++) {
    assert(pushed[i] > pushed[i - 1],
      `the call did not carry further: ${pushed.map(Math.round).join(' -> ')}`);
  }

  // Weather Eye widens what she hands out, from the back hex only.
  const fromBack = (() => {
    const { battle, w, mates } = crew(3, POSITION.BACK);
    Abilities.execute(wanda.abilities[0], w, mates[1], battle);
    return mates[1].turnMeter;
  })();
  const fromMiddle = (() => {
    const { battle, w, mates } = crew(3, POSITION.CENTER);
    Abilities.execute(wanda.abilities[0], w, mates[1], battle);
    return mates[1].turnMeter;
  })();
  assert(fromBack > fromMiddle,
    `Weather Eye paid nothing: ${Math.round(fromBack)} vs ${Math.round(fromMiddle)}`);

  // She does not out-pipe Artur, who is the roster's tempo support and
  // a rank above her, on the cooldown-free button they share.
  {
    const artur = HEROES.artur;
    const his = artur.abilities[0];
    const hisLad = Progression.skillLadder(his, Progression.skillCap(his, 0));
    const hers = wanda.abilities[0];
    const herLad = Progression.skillLadder(hers, Progression.skillCap(hers, 0));
    // Find the meter effect by TYPE: Margin Note carries more than one
    // effect and the push is not the first of them.
    const top = (a, lad) => {
      const push = a.effects.find((e) => e.type === 'turnMeter' && e.amount > 0);
      assert(push, `${a.name} stopped pushing an action bar`);
      return push.amount + (lad.meter || 0);
    };
    assert(top(hers, herLad) <= top(his, hisLad),
      `Wanda's basic pipe tops out at ${top(hers, herLad)} against Artur's ${top(his, hisLad)}`);
  }

  // Carries on the Wind lengthens HER blessings and nobody else's.
  {
    const { battle, w, mates } = crew(3);
    Abilities.execute(call, w, mates[1], battle);
    const hers = mates[1].statusEffects.find((fx) => fx.stat === 'atk');
    const printed = call.effects[1].turns +
      (Progression.skillLadder(call, Progression.skillCap(call, 1)).duration || 0);
    assert(hers && hers.turns === printed + 1,
      `her own buff ran ${hers && hers.turns} turns against a printed ${printed}`);

    const free = battle.playerSlots.findIndex(
      (sl) => !battle.units.some((u) => u.slot === sl));
    const talon = new Unit(HEROES.talon, TEAM.PLAYER, { level: 30, stars: 4 });
    battle.placeUnit(talon, free);
    Abilities.execute(HEROES.talon.abilities[1], talon, mates[1], battle);
    const his = mates[1].statusEffects.find((fx) => fx.stat === 'damageTaken');
    assert(his && his.turns === HEROES.talon.abilities[1].effects[0].turns,
      `Talon's buff ran ${his && his.turns} turns beside Wanda -- her passive leaked`);
  }
});

test("Polo's chart puts everybody on their own hex for a while", () => {
  const polo = HEROES.polo;
  const chart = polo.abilities[2];
  assert(polo.passive.hooks.alwaysPositioned, 'Polo lost Dead Reckoning');

  // Talon's Set Fast is a FRONT hex bonus. Stand him in the BACK, where
  // it does nothing, and hand him the map.
  const battle = new Battle();
  const p = new Unit(polo, TEAM.PLAYER, { level: 30, stars: 4 });
  battle.placeUnit(p, battle.playerSlots.findIndex((sl) => sl.position === POSITION.BACK));
  const talon = new Unit(HEROES.talon, TEAM.PLAYER, { level: 30, stars: 4 });
  const spare = battle.playerSlots.map((sl, i) => [sl, i])
    .filter(([sl]) => sl.position === POSITION.BACK &&
      !battle.units.some((u) => u.slot === sl)).map(([, i]) => i)[0];
  battle.placeUnit(talon, spare);
  assert(talon.positional.position === POSITION.FRONT,
    "Talon's hex moved -- pick another off-hex subject");

  const adrift = talon.effectiveStat('def');
  assert(!talon.positionalActive(), 'Talon had his hex bonus in the wrong row');
  Abilities.execute(chart, p, talon, battle);
  assert(talon.positionalActive(), 'the chart did not put him on his hex');
  const charted = talon.effectiveStat('def');
  assert(charted > adrift,
    `the chart gave him nothing: ${adrift} -> ${charted}`);

  // And it is a blessing like any other: it runs out.
  talon.statusEffects = talon.statusEffects.filter((fx) => fx.stat !== 'charted');
  assert(!talon.positionalActive() && talon.effectiveStat('def') === adrift,
    'the chart outlived its own status effect');

  // Dead Reckoning is his alone. Wanda off her back hex stays off it.
  {
    const b2 = new Battle();
    const p2 = new Unit(polo, TEAM.PLAYER, { level: 30, stars: 4 });
    b2.placeUnit(p2, b2.playerSlots.findIndex((sl) => sl.position === POSITION.FRONT));
    assert(p2.positionalActive(),
      'Dead Reckoning failed to carry his own hex off it');
    const w = new Unit(HEROES.wanda, TEAM.PLAYER, { level: 30, stars: 2 });
    b2.placeUnit(w, b2.playerSlots.findIndex((sl) => sl.position === POSITION.CENTER));
    assert(w.positionalActive() === false,
      'Dead Reckoning leaked onto an ally standing off her hex');
  }

  // Chart Table deepens what he hands out. Because Dead Reckoning makes
  // his own hex unconditional, this is on wherever he stands -- which
  // is what the passive says on the card, not an accident.
  function bearing(hero, hex) {
    const b3 = new Battle();
    const h = new Unit(hero, TEAM.PLAYER, { level: 30, stars: hero.rarity });
    b3.placeUnit(h, b3.playerSlots.findIndex((sl) => sl.position === hex));
    const mate = new Unit(HEROES.jack, TEAM.PLAYER, { level: 30, stars: 1 });
    b3.placeUnit(mate, b3.playerSlots.findIndex((sl) => sl.position === POSITION.FRONT));
    Abilities.execute(hero.abilities[0], h, mate, b3);
    const acc = mate.statusEffects.find((fx) => fx.stat === 'accuracy');
    return acc ? acc.add : 0;
  }
  const printed = polo.abilities[0].effects[0].add;
  assert(bearing(polo, POSITION.BACK) > printed,
    'Chart Table added nothing to his own blessing');
  assert(bearing(polo, POSITION.CENTER) === bearing(polo, POSITION.BACK),
    'Dead Reckoning did not carry Chart Table off the back hex');

  // It does not leak: another buffer's blessing lands at its own size.
  {
    const b4 = new Battle();
    const w = new Unit(HEROES.wanda, TEAM.PLAYER, { level: 30, stars: 2 });
    b4.placeUnit(w, b4.playerSlots.findIndex((sl) => sl.position === POSITION.BACK));
    const mate = new Unit(HEROES.jack, TEAM.PLAYER, { level: 30, stars: 1 });
    b4.placeUnit(mate, b4.playerSlots.findIndex((sl) => sl.position === POSITION.FRONT));
    Abilities.execute(HEROES.wanda.abilities[1], w, mate, b4);
    const atk = mate.statusEffects.find((fx) => fx.stat === 'atk');
    const want = HEROES.wanda.abilities[1].effects[1].mult;
    assert(atk && Math.abs(atk.mult - want) < 0.001,
      `Wanda's buff landed at x${atk && atk.mult} instead of its printed x${want}`);
  }

  // He hands the WHOLE crew less crit than Artur hands one ally, which
  // is the trade for it being team-wide and on a cooldown.
  {
    const his = polo.abilities[1];
    const hisTop = his.effects[0].add +
      (Progression.skillLadder(his, Progression.skillCap(his, 1)).buffPower || 0) +
      polo.positional.hooks.buffPowerAdd;
    const arturs = HEROES.artur.abilities[0];
    const crit = arturs.effects.find((e) => e.stat === 'critChance');
    const arturTop = crit.add +
      (Progression.skillLadder(arturs, Progression.skillCap(arturs, 0)).buffPower || 0);
    assert(hisTop <= arturTop,
      `Polo hands the team +${Math.round(hisTop * 100)}% crit against Artur's ` +
      `+${Math.round(arturTop * 100)}% to one ally`);
  }
});

test('a mitigation ward refreshes itself, and stacks between two casters', () => {
  // A ward whose duration outruns its own cooldown always overlaps
  // itself, and damageTakenBreakdown multiplies every damageTaken
  // status it finds. Talon's Snub the Cable (3 turns at cap, 2-turn
  // cooldown) reached four stacks and 87.5% prevented -- a number no
  // card in the game offers.
  const battle = new Battle();
  const talon = new Unit(HEROES.talon, TEAM.PLAYER, { level: 30, stars: 4 });
  battle.placeUnit(talon, battle.playerSlots.findIndex(
    (sl) => sl.position === POSITION.FRONT));
  talon.abilities.forEach((a, i) => { a.level = Progression.skillCap(a.def, i); });
  const foe = new Unit(DUMMIES.rat_brawler, TEAM.ENEMY, { level: 30, stars: 4 });
  battle.placeUnit(foe, 1);

  const readings = [];
  for (let i = 0; i < 4; i++) {
    Abilities.execute(talon.abilities[1].def, talon, talon, battle);
    readings.push(talon.damageTakenMult(null));
  }
  const held = talon.statusEffects.filter((fx) => fx.stat === 'damageTaken');
  assert(held.length === 1,
    `four casts left ${held.length} wards stacked on one bird`);
  assert(readings.every((r) => Math.abs(r - readings[0]) < 1e-9),
    `the ward deepened itself: ${readings.map((r) => r.toFixed(3)).join(' -> ')}`);

  // But two DIFFERENT protectors still stack -- that is two heroes
  // covering one body, and it should be worth more than one.
  const bo = new Unit(HEROES.bo, TEAM.PLAYER, { level: 30, stars: 3 });
  battle.placeUnit(bo, battle.playerSlots.findIndex(
    (sl) => !battle.units.some((u) => u.slot === sl)));
  const alone = bo.damageTakenMult(null);
  Abilities.execute(talon.abilities[1].def, talon, bo, battle);
  const covered = bo.damageTakenMult(null);
  assert(covered < alone,
    'a second protector added nothing on top of the first');
  Abilities.execute(bo.abilities[1].def, bo, bo, battle);
  assert(bo.damageTakenMult(null) < covered,
    "Bo's own ward failed to stack with the one Talon gave him");
  assert(bo.statusEffects.filter((fx) => fx.stat === 'damageTaken').length === 2,
    'two casters did not leave two wards');

  // The deeper of two casts from one caster is the one that is kept.
  const b2 = new Battle();
  const t2 = new Unit(HEROES.talon, TEAM.PLAYER, { level: 30, stars: 4 });
  b2.placeUnit(t2, b2.playerSlots.findIndex((sl) => sl.position === POSITION.FRONT));
  Abilities.execute(t2.abilities[1].def, t2, t2, b2);           // level 1
  const shallow = t2.statusEffects.find((fx) => fx.stat === 'damageTaken').mult;
  t2.abilities[1].level = Progression.skillCap(t2.abilities[1].def, 1);
  Abilities.execute(t2.abilities[1].def, t2, t2, b2);           // maxed
  const kept = t2.statusEffects.find((fx) => fx.stat === 'damageTaken').mult;
  assert(kept < shallow,
    `the refresh kept the shallower cover (${shallow} over ${kept})`);
});

test('the Phoenix Court is paid for the fires it lights', () => {
  const COURT = RACES.SECTS.phoenixcourt.members;
  assert(COURT.length === 9, `the Court fields ${COURT.length}`);
  assert(COURT.every((id) => HEROES[id].element === 'fire'),
    'somebody in the Court is not on fire');

  // A field with `lit` of its enemies already burning.
  function field(id, foeCount, lit) {
    const battle = new Battle();
    const def = HEROES[id];
    const h = new Unit(def, TEAM.PLAYER, { level: 30, stars: def.rarity });
    battle.placeUnit(h, battle.playerSlots.findIndex(
      (sl) => sl.position === (def.positional ? def.positional.position : POSITION.FRONT)));
    h.abilities.forEach((a, i) => { a.level = Progression.skillCap(a.def, i); });
    const foes = [];
    for (let i = 0; i < foeCount; i++) {
      const f = new Unit(DUMMIES.rat_brawler, TEAM.ENEMY, { level: 30, stars: 4 });
      battle.placeUnit(f, i);
      f.hp = f.maxHp = 9e6;
      if (i < lit) {
        f.addStatusEffect({ kind: 'dot', amount: 10, turns: 5, flavor: 'burn' });
      }
      foes.push(f);
    }
    return { battle, h, foes };
  }

  // perBurn: the blessing is worth more for every fire already lit.
  // Checked on all four of the Court's buff-carriers, because the whole
  // sect hangs off this one term.
  for (const [id, idx, stat] of [['chirp', 0, 'atk'], ['sarena', 0, 'atk'],
    ['stoddard', 1, 'atk']]) {
    const read = [0, 1, 3].map((lit) => {
      const { battle, h } = field(id, 3, lit);
      const mate = new Unit(HEROES.korvid, TEAM.PLAYER, { level: 30, stars: 5 });
      battle.placeUnit(mate, battle.playerSlots.findIndex(
        (sl) => !battle.units.some((u) => u.slot === sl)));
      Abilities.execute(h.abilities[idx].def, h, mate, battle);
      const fx = mate.statusEffects.find((x) => x.stat === stat);
      assert(fx, `${id} landed no ${stat} blessing at all`);
      return fx.mult;
    });
    assert(read[2] > read[1] && read[1] > read[0],
      `${id}'s blessing did not grow with the fires: ${read.map((r) => r.toFixed(2)).join(' -> ')}`);
  }
  // And a Court MEND runs on the same fuel.
  {
    const read = [0, 1, 3].map((lit) => {
      const { battle, h } = field('stella', 3, lit);
      const mate = new Unit(HEROES.korvid, TEAM.PLAYER, { level: 30, stars: 5 });
      battle.placeUnit(mate, battle.playerSlots.findIndex(
        (sl) => !battle.units.some((u) => u.slot === sl)));
      mate.hp = 1;
      Abilities.execute(h.abilities[0].def, h, mate, battle);
      return mate.hp;
    });
    assert(read[2] > read[1] && read[1] > read[0],
      `Stella's mend did not grow with the fires: ${read.join(' -> ')}`);
  }

  // Flurry no longer SPREADS -- the sect's 2pc owns that outright, and
  // her carrying it too meant a Flurry standing with her own Court lit
  // three plates on a single re-burn while the tiers above priced all
  // three. Alone she stacks like anyone else: one plate per cast.
  {
    const { battle, h, foes } = field('flurry', 1, 0);
    const real = Math.random;
    Math.random = () => 0;
    Abilities.execute(h.abilities[0].def, h, foes[0], battle);
    const first = foes[0].statusEffects.filter((f) => f.kind === 'dot').length;
    Abilities.execute(h.abilities[0].def, h, foes[0], battle);
    Math.random = real;
    const burns = foes[0].statusEffects.filter((f) => f.kind === 'dot');
    assert(first === 1 && burns.length === 2,
      `two casts left ${burns.length} separate fires, wanted 2`);
    assert(!(HEROES.flurry.passive.hooks || {}).burnRekindle,
      'Flurry picked the spread back up and compounds with her own sect again');
  }

  // What she carries instead: her fires TAKE AT ONCE. The burn pays its
  // first tick in the instant it lands, so the same cast costs a fresh
  // target strictly more from her than from a Court bird without the
  // passive -- measured against Barrington, who shares her element, her
  // sect and nothing else that would explain the gap.
  {
    const bite = (id) => {
      const { battle, h, foes } = field(id, 1, 0);
      const real = Math.random;
      Math.random = () => 0;
      // Same burn from either bird, so the comparison is the passive
      // and not the kit: applied by hand, at a fixed tick.
      const before = foes[0].hp;
      Abilities.applyEffect({ type: 'dot', targetHpPct: 0.01, turns: 3, flavor: 'burn' },
        h, foes[0], 1);
      Math.random = real;
      return { spent: before - foes[0].hp, plates: foes[0].statusEffects.filter(
        (f) => f.kind === 'dot').length };
    };
    const hers = bite('flurry'), theirs = bite('barrington');
    assert(theirs.spent === 0,
      `a bird without the passive took ${theirs.spent} off on application`);
    assert(hers.spent > 0,
      'Flurry\'s fire waited a turn to bite — the passive did nothing');
    // And it is a BITE, not an extra plate: the fire still reads as one.
    assert(hers.plates === 1 && theirs.plates === 1,
      `the bite left ${hers.plates} plates against ${theirs.plates}`);
  }

  // Stoddard is paid for the moment something catches.
  {
    const { battle, h, foes } = field('stoddard', 3, 0);
    h.turnMeter = 0;
    const real = Math.random;
    Math.random = () => 0;
    Abilities.execute(h.abilities[0].def, h, foes[0], battle);
    Math.random = real;
    assert(h.turnMeter > 0, 'Stoddard heard nothing catch');
  }

  // Stella refuses exactly one killing blow, and is not REVIVED by it:
  // she never goes down, so what she is carrying stays with her.
  {
    const { battle, h } = field('stella', 1, 0);
    h.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.2, turns: 5 });
    h.takeDamage(9e9);
    assert(h.alive && h.hp === 1, `Stella went to ${h.hp} and alive=${h.alive}`);
    assert(h.statusEffects.some((f) => f.stat === 'atk'),
      'the coal wiped what she was carrying, which is a revive, not a refusal');
    h.takeDamage(9e9);
    assert(!h.alive, 'the coal refused a second killing blow');
  }

  // Orri's blessings cannot be torn off.
  {
    const battle = new Battle();
    const orri = new Unit(HEROES.orri, TEAM.PLAYER, { level: 30, stars: 2 });
    battle.placeUnit(orri, battle.playerSlots.findIndex(
      (sl) => sl.position === POSITION.BACK));
    const mate = new Unit(HEROES.korvid, TEAM.PLAYER, { level: 30, stars: 5 });
    battle.placeUnit(mate, battle.playerSlots.findIndex(
      (sl) => sl.position === POSITION.FRONT));
    Abilities.execute(orri.abilities[0].def, orri, mate, battle);
    const pinned = mate.statusEffects.filter((f) => f.kind === 'buff').length;
    assert(pinned > 0, 'Orri handed out no blessing to protect');
    const thief = new Unit(HEROES.cleo, TEAM.ENEMY, { level: 30, stars: 5 });
    battle.placeUnit(thief, 0);
    const strip = Object.values(HEROES).flatMap((x) => x.abilities)
      .find((a) => (a.effects || []).some((e) => e.type === 'stripBuffs'));
    const real = Math.random;
    Math.random = () => 0;
    Abilities.execute(strip, thief, mate, battle);
    Math.random = real;
    assert(mate.statusEffects.filter((f) => f.kind === 'buff').length === pinned,
      `${strip.name} tore one of Orri's blessings off the record`);
  }

  // Kavit hits harder into a fire than into a bird that is not lit.
  {
    const hit = (lit) => {
      const { battle, h, foes } = field('kavit', 1, lit);
      const before = foes[0].hp;
      const real = Math.random;
      Math.random = () => 0.99;
      Abilities.execute(h.abilities[2].def, h, foes[0], battle);
      Math.random = real;
      return before - foes[0].hp;
    };
    const cold = hit(0);
    const alight = hit(1);
    assert(alight > cold * 1.3,
      `Carrion Call paid ${cold} into a cold bird and ${alight} into a burning one`);
  }

  // Korvid is softest alone: the opposite of Talon, who sets deeper the
  // more ENEMIES are pulling. The two tanks want different fights.
  {
    const read = [0, 3, 6].map((n) => {
      const battle = new Battle();
      const k = new Unit(HEROES.korvid, TEAM.PLAYER, { level: 30, stars: 5 });
      battle.placeUnit(k, battle.playerSlots.findIndex(
        (sl) => sl.position === POSITION.FRONT));
      for (let i = 0; i < n; i++) {
        battle.placeUnit(new Unit(HEROES.chirp, TEAM.PLAYER, { level: 30, stars: 1 }),
          battle.playerSlots.findIndex((sl) => !battle.units.some((u) => u.slot === sl)));
      }
      return k.damageTakenMult(null);
    });
    assert(read[0] > read[1] && read[1] > read[2],
      `The Court Stands paid ${read.map((r) => r.toFixed(2)).join(' -> ')} as the court filled`);
  }
});

// A hero whose action strips have not been delivered yet points its
// abilities straight at 'idle' -- a LOOPING animation. A loop never
// reaches a final frame, so it can never fire the completion callback
// that advances the turn, and the whole side stalls until the battle's
// ten-second watchdog force-finishes each action ("X's action never
// resolved"). The animator has to resolve those on a timer instead.
// sprites.js is not in the harness (it needs Image/canvas at draw
// time), so it is evaluated here on its own -- the playback classes at
// the top of the file are pure.
test('looping action animations still fire their completion callback', () => {
  const vm = require('vm');
  const src = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'js/sprites.js'), 'utf8');
  const box = vm.createContext({ Image: function () {}, document: undefined,
    console, Math });
  vm.runInContext(src + '\nthis.AnimationPlayer = AnimationPlayer;' +
    '\nthis.SpriteSheet = SpriteSheet;', box);

  const sheet = new box.SpriteSheet({
    idle: { frames: 9, fps: 5, loop: true, frameW: 64, frameH: 64, row: 0 },
    attack: { frames: 6, fps: 12, loop: false, frameW: 64, frameH: 64, row: 1 },
  }, 92);

  // The avian case: the ability names 'idle' on purpose.
  {
    const p = new box.AnimationPlayer(sheet);
    let done = 0;
    p.play('idle', () => { done++; });
    for (let i = 0; i < 60 && done === 0; i++) p.update(1 / 60);
    assert(done === 1, `a looping action animation resolved ${done} times`);
  }

  // A one-shot still resolves the ordinary way, at its final frame.
  {
    const p = new box.AnimationPlayer(sheet);
    let done = 0;
    p.play('attack', () => { done++; });
    for (let i = 0; i < 120 && done === 0; i++) p.update(1 / 60);
    assert(done === 1, `a one-shot action animation resolved ${done} times`);
  }

  // An animation the sheet does not carry at all keeps its old fallback.
  {
    const p = new box.AnimationPlayer(sheet);
    let done = 0;
    p.play('skill3', () => { done++; });
    assert(p.current === 'idle', `a missing animation played '${p.current}'`);
    for (let i = 0; i < 60 && done === 0; i++) p.update(1 / 60);
    assert(done === 1, `a missing action animation resolved ${done} times`);
  }
});

// The facing audit, recorded. Twice now a hero has shipped mirrored --
// Ryn, then Catherine -- and both times for the same reason: the call
// was made off a frame where the WEAPON leads or trails the body, which
// at thumbnail size reads as the direction of travel. It is not. The
// head, the lead knee and the fall of the death pose are.
//
// So the flags are pinned here rather than re-eyeballed. Adding art is
// meant to touch this list; a flag that changes without anyone meaning
// it shows up as a named failure instead of a character quietly turning
// their back on the enemy.
test('the facing audit is what it was last time somebody looked', () => {
  // Malachar came off this list: his strip is authored facing RIGHT
  // like every other bird in the Hollowbone -- the beak points right and
  // the lantern hangs on that side -- and the flag was carried on a
  // comment that described the art wrongly, so he spent his fights
  // turned away from whatever he was hitting. The other eleven were
  // re-checked against their own idle frames at the same time and all
  // eleven are correct.
  const LEFT = ['andrew', 'angelica', 'artur', 'cain', 'esmerelda',
    'franz', 'javarious', 'lin', 'lucian', 'mavros', 'slick'];
  // One strip authored the other way round from its own sheet: Lin's
  // skill3 plants the ball to the right while the rest of her faces left.
  const STRIP = { 'lin:skill3': false };

  const left = [], strips = {};
  for (const h of Object.values(HEROES)) {
    const sp = h.sprite || {};
    if (sp.faceLeft) left.push(h.id);
    for (const [name, st] of Object.entries(sp.strips || {})) {
      if (st.faceLeft !== undefined) strips[`${h.id}:${name}`] = !!st.faceLeft;
    }
  }
  const added = left.filter((id) => !LEFT.includes(id)).sort();
  const gone = LEFT.filter((id) => !left.includes(id)).sort();
  assert(added.length === 0,
    `newly flagged as left-facing, and not recorded here: ${added.join(', ')}`);
  assert(gone.length === 0,
    `no longer flagged as left-facing: ${gone.join(', ')}`);

  const wantStrips = Object.keys(STRIP).sort().join(',');
  const gotStrips = Object.keys(strips).sort().join(',');
  assert(wantStrips === gotStrips,
    `per-strip facing overrides moved: recorded [${wantStrips}], found [${gotStrips}]`);
  for (const [key, want] of Object.entries(STRIP)) {
    assert(strips[key] === want, `${key} is now faceLeft: ${strips[key]}`);
  }

  // Catherine specifically: her flail TRAILS left through the swing,
  // which is what the audit misread. Every strip of hers faces right.
  assert(!HEROES.catherine.sprite.faceLeft,
    'Catherine is flipped again — her art faces right, the flail just trails');
});

// The resolved skill readout has to agree with the fight, or it is worse
// than no readout at all. Every laddered ability is executed twice --
// once at skill level 1, once at its cap -- and the RATIO of what landed
// is checked against the ratio the readout claims. Comparing ratios
// rather than absolutes is what makes this cheap and exact: the DEF
// curve, elements, crit and every mitigation term are identical between
// the two runs, so they cancel, and what is left is the multiplier the
// ladder bought.
test('the skill readout states the numbers the fight actually uses', () => {
  const P = Progression;
  const wrong = [];

  const arena = (def, idx, skillLevel) => {
    const battle = makeBattle();
    const prev = Battle.active;
    Battle.active = battle;
    const u = place(battle, def, TEAM.PLAYER, 1);
    u.abilities[idx].level = skillLevel;
    u.critChance = () => 0;               // no dice in the reading
    // Two kinds of passive make a skill land bigger than its own card
    // claims, and neither is the card being wrong.
    //
    // A passive that makes DoTs bite the instant they land (Flurry)
    // puts burn damage into the same moment as the strike, so the HP
    // that leaves is the damage line PLUS a tick whose own ladder the
    // damage line never claimed.
    //
    // A buffPowerAdd hook written as a FUNCTION (Kiri's hover) reads
    // the RECEIVER, so what the blessing is worth depends on who is
    // standing there -- a number the readout cannot print at all,
    // because at display time there is no receiver. The numeric form
    // is left alone: that one is the same for everybody and the
    // readout can and should account for it.
    //
    // Suppressed rather than skipped, so both heroes' skills are still
    // measured -- assigned, not spliced, because `passives` comes off
    // the def by reference.
    u.passives = (u.passives || []).filter((pv) => {
      const h = pv.hooks || {};
      if (h.dotBitesOnApply) return false;
      if (typeof h.buffPowerAdd === 'function') return false;
      return true;
    });
    const foe = roomy(place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1), 200);
    foe.dodgeChance = () => 0;
    foe.reflectChance = () => 0;
    return { battle, u, foe, done: () => { Battle.active = prev; } };
  };

  for (const def of Object.values(HEROES)) {
    def.abilities.forEach((a, idx) => {
      if (!a.levelUps) return;
      const cap = P.skillCap(a, idx);
      if (cap <= 1) return;
      const lo = P.skillFacts(a, 1);
      const hi = P.skillFacts(a, cap);
      const where = `${def.id} s${idx + 1}`;

      // The two readings must describe the same skill, entry for entry.
      if (lo.length !== hi.length ||
          lo.some((f, i) => f.label !== hi[i].label)) {
        wrong.push(`${where}: the readout changes shape between levels`);
        return;
      }

      // ---- damage, measured ----
      // Only where the swing is PURELY its multiplier. A kit carrying a
      // rider -- per mirror, per corpse, per body caught, or a flat
      // share of the target's health -- adds a term the ratio cannot
      // see: Aniani's six mirrors and Ari's max-HP rider are most of
      // their damage, so the measured ratio is diluted by design and
      // says nothing about whether the readout is right. Those riders
      // are reported as their own lines and checked by shape above.
      const rider = (a.effects || []).some((e) => e.perMirror || e.perDeath ||
        e.perTarget || e.perBurn || e.targetHpPct || e.bonusVs ||
        e.bonusPosition || e.bonusWhen);
      const dIdx = rider ? -1 : hi.findIndex((f) => /^Damage \(/.test(f.label));
      // Measured unconditionally, NOT only where the readout claims a
      // gain. Gating on the claim let a readout that wrongly says
      // "nothing changed" skip its own check -- which is precisely the
      // bug worth catching, since a rung feeding the wrong key reads as
      // no gain at all.
      if (dIdx >= 0) {
        const hit = (lvl) => {
          const A2 = arena(def, idx, lvl);
          const before = A2.foe.hp;
          const real = Math.random;
          Math.random = () => 0.99;       // no gate ever fails us out
          try { Abilities.execute(a, A2.u, A2.foe, A2.battle); }
          finally { Math.random = real; A2.done(); }
          return before - A2.foe.hp;
        };
        const one = hit(1), full = hit(cap);
        if (one > 0) {
          const measured = full / one;
          const claimed = hi[dIdx].now / lo[dIdx].base;
          // A point of rounding on each of two strikes.
          if (Math.abs(measured - claimed) > 0.02) {
            wrong.push(`${where}: ${a.name} hit ${measured.toFixed(3)}x harder at cap, ` +
              `readout claims ${claimed.toFixed(3)}x`);
          }
        }
      }

      // ---- cooldown, read off the unit that will pay it ----
      const cd = hi.find((f) => f.label === 'Cooldown');
      if (cd) {
        const A2 = arena(def, idx, cap);
        const live = A2.u.cooldownFor(a);
        A2.done();
        if (live !== cd.now) {
          wrong.push(`${where}: readout says cooldown ${cd.now}, the unit pays ${live}`);
        }
      }

      // ---- buff severity and duration, read off the applied status ----
      const buff = (a.effects || []).find((e) => e.type === 'buff' &&
        typeof e.mult === 'number');
      if (buff) {
        const fact = hi.find((f) => f.kind === 'signed');
        if (fact) {
          const A2 = arena(def, idx, cap);
          const real = Math.random;
          Math.random = () => 0.99;
          try { Abilities.execute(a, A2.u, A2.foe, A2.battle); }
          finally { Math.random = real; }
          const live = [A2.u, ...A2.battle.livingUnits(TEAM.PLAYER)]
            .flatMap((x) => x.statusEffects)
            .find((fx) => fx.kind === 'buff' && fx.stat === buff.stat);
          A2.done();
          if (live && Math.abs(live.mult - fact.now) > 1e-6) {
            wrong.push(`${where}: readout says ${buff.stat} ${fact.now}, ` +
              `the buff landed at ${live.mult}`);
          }
        }
      }
    });
  }
  assert(wrong.length === 0, wrong.slice(0, 6).join(' | ') +
    (wrong.length > 6 ? ` (+${wrong.length - 6} more)` : ''));
});

// The star-up forecast has to be the numbers the Team screen will show
// afterwards, or it is a sales pitch. Star ups are irreversible and cost
// up to nine heroes.
test('the star-up forecast matches what the hero actually becomes', () => {
  const st = loadGame();
  const G = st.GameState, P = st.Progression;
  const added = G.addHero('talon');
  const uid = added.uid;
  const pv = G.starUpPreview(uid);
  assert(pv, 'no forecast for a hero below the star cap');

  const pr = G.progressOf(uid);
  assert(pv.stars.now === pr.stars && pv.stars.next === pr.stars + 1,
    `forecast reads ${pv.stars.now}->${pv.stars.next} for a ${pr.stars}-star`);

  // The "after" figures must come down the same path the Team screen
  // DISPLAYS: scaled stats, then gear.
  const worn = G.equippedPieces(uid);
  const truth = st.Gear.applyToStats(
    P.scaledStats(st.HEROES.talon, pr.level, pr.stars + 1), worn);
  for (const k of ['hp', 'atk', 'def']) {
    assert(pv.stats[k].next === truth[k],
      `forecast says ${k} ${pv.stats[k].next}, the hero becomes ${truth[k]}`);
  }
  assert(pv.power.next === P.power(truth),
    `forecast power ${pv.power.next}, actual ${P.power(truth)}`);

  // A star is +25% on the three scaled stats, and SPEED IS IDENTITY --
  // turn order must not drift as heroes climb.
  for (const k of ['hp', 'atk', 'def']) {
    const ratio = pv.stats[k].next / pv.stats[k].now;
    assert(ratio > 1, `${k} does not grow with a star`);
  }
  assert(pv.speed.next === pv.speed.now, 'a star up moved SPD');
  assert(pv.levelCap.next === P.maxLevel(pr.stars + 1), 'wrong level cap forecast');

  // And the claim the panel makes in words: skill caps are set by the
  // skill, not the star, so they must NOT move.
  st.HEROES.talon.abilities.forEach((a, i) => {
    assert(P.skillCap(a, i) === P.skillCap(a, i),
      'skillCap is not a pure function of the ability and its slot');
  });
  const capsBefore = st.HEROES.talon.abilities.map((a, i) => P.skillCap(a, i));
  const capsAfter = st.HEROES.talon.abilities.map((a, i) => P.skillCap(a, i));
  assert(capsBefore.join() === capsAfter.join(), 'skill caps moved with stars');

  // Nothing to forecast at the ceiling. progressOf hands out a COPY, so
  // the hero is seeded at ten stars through a save instead of poked.
  const capped = loadGame({ save: { schemaVersion: 7, nextHeroUid: 2,
    roster: { 1: { heroId: 'talon', level: 40, xp: 0, stars: 10,
      equipment: {}, skills: {} } } } });
  assert(capped.GameState.progressOf('1').stars === 10, 'the seed did not take');
  assert(capped.GameState.starUpPreview('1') === null,
    'a 10-star was offered a star up');
});

// Tapping a hero has to select THAT hero. Formation hexes sit close
// together and sprites are taller than the tiles they stand on, so the
// hit boxes overlap almost everywhere on the player's side; picking the
// first match in roster order meant a point squarely on one hero could
// return the one behind them. On a phone the whole board is a few
// hundred pixels wide and there is no aiming your way out of it.
test('a point on a hero selects that hero, not whoever overlaps them', () => {
  // A real Battle: makeBattle() is a lightweight stub with no hit test.
  const battle = new Battle();
  const seated = [];
  for (let i = 0; i < 5; i++) {
    const u = new Unit(HEROES.talon, TEAM.PLAYER, { level: 30, stars: 4 });
    battle.placeUnit(u, i);
    seated.push(u);
  }

  // The overlap has to be built here. Nothing loads images in this
  // harness, so every unit falls back to a 48x48 box and no two of them
  // touch -- which is exactly the geometry the bug does NOT appear in.
  // In the browser the sprites are 74-125px tall on hexes ~40px apart
  // and the boxes overlap almost everywhere, so the sizes are stubbed to
  // that shape and the rule is tested against it.
  for (const u of seated) {
    u.animator = { sheet: { size: () => ({ w: 96, h: 110 }) } };
  }
  const overlapping = seated.some((a) => seated.some((b) =>
    b !== a && Math.abs(a.slot.x - b.slot.x) <= 96));
  assert(overlapping, 'the fixture does not actually overlap, so it proves nothing');

  const misses = [];
  for (const u of seated) {
    // Dead centre of the sprite box, which is anchored feet-on-tile.
    const size = u.animator.sheet.size();
    const cy = u.slot.y - size.h / 2 + 5;
    const hit = battle.unitAt(u.slot.x, cy);
    if (hit !== u) {
      misses.push(`a tap on the hero at x${Math.round(u.slot.x)} selected ` +
        `${hit ? `the one at x${Math.round(hit.slot.x)}` : 'nobody'}`);
    }
  }
  assert(misses.length === 0, misses.join('; '));

  // And a point on nobody still selects nobody.
  assert(battle.unitAt(-500, -500) === null, 'empty space selected a unit');
});

// The phone board is cropped to the action band by a CSS rule that pulls
// the canvas left and scales it up to compensate (width 127.66%,
// margin-left -13.83% -- see the mobile block in css/style.css).
// sizeCanvases() used to write `width: 100%` INLINE, which outranks that
// rule: the canvas kept the pull and lost the zoom, so it sat 51px off
// the left of its own crop. The player's front rank was clipped away, a
// dead strip showed on the right, and because canvasPoint() divides by
// the canvas's measured width, every tap mapped ~28% off target.
//
// Asserted against the source: the layout itself needs a browser, but
// "does this file write an inline canvas width on the mobile path" does
// not, and that is the thing that broke.
test('the mobile canvas width is left to the stylesheet', () => {
  const src = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'js/main.js'), 'utf8');
  const fn = src.slice(src.indexOf('sizeCanvases('));
  const mobileArm = fn.slice(fn.indexOf('if (mobile) {'), fn.indexOf('} else {'));
  assert(!/style\.width\s*=\s*['"`](?!\s*['"`])/.test(mobileArm),
    'sizeCanvases sets a non-empty inline width on the mobile path, ' +
    'which overrides the crop rule in css/style.css');

  // And the stylesheet has to actually carry both halves, or clearing
  // the inline width just leaves the canvas at its intrinsic size.
  const css = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'css/style.css'), 'utf8');
  assert(/html\.is-mobile canvas\s*\{[^}]*width:\s*100%/.test(css),
    'no fluid default width for canvases on mobile');
  assert(/#battle-canvas-crop\s*>\s*#battle-canvas\s*\{[^}]*width:\s*127\.66%/.test(css),
    'the battle crop no longer scales the canvas up to match its pull');
});

// A banner's featured pool is also its PITY pool: the fifty-pull mark
// hands over one of them at random. So it can only ever hold heroes the
// scroll being pulled can actually produce, or the guarantee pays out in
// a hero that scroll does not sell.
//
// This was invisible while every bannered sect was 3-star and up. The
// bird sects each run a 1-star and two 2-stars, and the Rare scroll
// draws 3/4/5 only.
test('a banner features only what its scroll can draw', () => {
  const E = g.Events;
  const Gacha = g.Gacha;
  for (const b of E.SUMMON_BANNERS) {
    const can = Gacha.scrollRarities(b.scroll);
    const featured = Gacha.bannerFeatured(b);
    assert(featured.length > 0, `${b.id} features nobody`);

    for (const id of featured) {
      const h = HEROES[id];
      assert(RACES.sectOf(h) && RACES.sectOf(h).id === b.sect,
        `${b.id} features ${id}, who is not in the sect`);
      assert(can.has(h.rarity),
        `${b.id} features ${h.name} at ${h.rarity}-star, which a ` +
        `${b.scroll} pull cannot roll`);
    }

    // And nobody drawable is left out -- the filter must trim the pool,
    // not shrink it to whoever happens to survive.
    const drawable = Object.values(HEROES).filter((h) =>
      RACES.sectOf(h) && RACES.sectOf(h).id === b.sect && can.has(h.rarity));
    assert(featured.length === drawable.length,
      `${b.id} features ${featured.length} of ${drawable.length} drawable heroes`);
  }

  // The bird sects are the case that forced this: they must be featured,
  // and their cheap heroes must not be.
  const gull = E.SUMMON_BANNERS.find((b) => b.sect === 'gulldigger');
  assert(gull, 'the Gulldiggers hold no banner');
  const gullPool = Gacha.bannerFeatured(gull);
  assert(gullPool.includes('hallow'), 'the Gulldigger banner leaves out its 5-star');
  assert(!gullPool.includes('jack'), 'a 1-star is in a Rare banner pool');
  const court = E.SUMMON_BANNERS.find((b) => b.sect === 'phoenixcourt');
  assert(court, 'the Phoenix Court holds no banner');
  assert(!Gacha.bannerFeatured(court).includes('chirp'),
    'a 1-star is in a Rare banner pool');

  // The scroll tables themselves, so the filter is reading something real.
  assert(!Gacha.scrollRarities('rare').has(1) && !Gacha.scrollRarities('rare').has(2),
    'the Rare scroll now draws below 3-star, which changes all of the above');
  assert(Gacha.scrollRarities('common').has(1),
    'the Common scroll no longer draws 1-star heroes');
});

// Element party bonuses, back at 2/3/4 instead of 3/5/7. A party is
// seven strong, so the old thresholds meant one element or nothing;
// these let a party carry two or three and be paid for each.
test('element party bonuses pay the element that earned them, in tiers', () => {
  const windIds = elementOnly('wind');
  assert(windIds.length >= 4, 'not enough wind heroes to test four of them');
  const fireId = Object.values(HEROES).find((h) => h.element === 'fire').id;

  const party = (windCount, extra = []) => {
    const battle = new Battle();
    const units = [];
    for (let i = 0; i < windCount; i++) {
      const u = new Unit(HEROES[windIds[i]], TEAM.PLAYER, { level: 30, stars: 3 });
      battle.placeUnit(u, i);
      units.push(u);
    }
    for (const id of extra) {
      const u = new Unit(HEROES[id], TEAM.PLAYER, { level: 30, stars: 3 });
      battle.placeUnit(u, units.length);
      units.push(u);
    }
    const summary = RACES.applyParty(units);
    return { battle, units, summary };
  };

  // ---- The ladder: nothing at one, then one tier per step ----
  const counts = [1, 2, 3, 4].map((n) => {
    const { summary } = party(n);
    const wind = summary.find((b) => b.element === 'wind');
    return wind ? wind.labels.length : 0;
  });
  assert(counts.join() === '0,1,2,3',
    `wind tiers at 1/2/3/4 heroes were ${counts.join('/')}`);

  // ---- 2pc Following Wind: +10% SPD, and only to wind ----
  {
    const bare = new Unit(HEROES[windIds[0]], TEAM.PLAYER, { level: 30, stars: 3 });
    const bareFire = new Unit(HEROES[fireId], TEAM.PLAYER, { level: 30, stars: 3 });
    const { units } = party(2, [fireId]);
    const windUnit = units[0], fireUnit = units[2];
    // Every wind hero is a Whisperchime hero, so this is both layers --
    // derived rather than typed, like light's, so a sect tier that ever
    // touches SPD is caught instead of quietly absorbed.
    const wantSpd = Math.round(bare.speed *
      partyStatMult('spdPct', 'wind', 'whisperchime', 2));
    assert(windUnit.speed === wantSpd,
      `wind SPD ${windUnit.speed}, wanted ${wantSpd}`);
    assert(fireUnit.speed === bareFire.speed,
      'the fire hero collected the wind element bonus');
  }

  // ---- 3pc Crosswind: damage scales with speed ABOVE 100 ----
  {
    const { units } = party(3);
    const u = units[0];
    // The hook rides effectiveStat('speed'), so it must move when speed
    // does rather than being read once at build.
    const at = (spd) => { u.speed = spd; return u.damageDealtMult(null, null); };
    const slow = at(100), mid = at(125), fast = at(175);
    assert(Math.abs(slow - 1) < 1e-9, `at 100 SPD Crosswind paid ${slow}`);
    assert(Math.abs(mid - 1.05) < 1e-9, `at 125 SPD Crosswind paid ${mid}`);
    assert(Math.abs(fast - 1.15) < 1e-9, `at 175 SPD Crosswind paid ${fast}`);
    // Two heroes short of the tier get nothing from it.
    const two = party(2).units[0];
    two.speed = 175;
    assert(Math.abs(two.damageDealtMult(null, null) - 1) < 1e-9,
      'Crosswind paid out at two wind heroes');
  }

  // ---- 4pc Second Gust: an extra-turn chance the engine reads ----
  {
    const bare = new Unit(HEROES[windIds[0]], TEAM.PLAYER, { level: 30, stars: 3 });
    const { units } = party(4);
    assert(Math.abs(units[0].extraTurnChance() - (bare.extraTurnChance() + 0.10)) < 1e-9,
      `Second Gust gave ${units[0].extraTurnChance()} vs a base of ${bare.extraTurnChance()}`);
  }

  // ---- The bonus must not be written into the hero DEFINITION ----
  // hero.js takes `passives` by reference, so a bonus that pushed onto
  // it would stick to the def and every future copy would carry it.
  {
    const before = (HEROES[windIds[0]].passives ||
      [HEROES[windIds[0]].passive]).length;
    party(3);
    party(3);
    const after = (HEROES[windIds[0]].passives ||
      [HEROES[windIds[0]].passive]).length;
    assert(before === after,
      `the hero definition grew from ${before} to ${after} passives`);
    const fresh = new Unit(HEROES[windIds[0]], TEAM.PLAYER, { level: 30, stars: 3 });
    assert(!fresh.passives.some((p) => p.partyBonus),
      'a freshly built hero arrived carrying a party bonus');
  }

  // ---- An element with no table pays nothing, and does not throw ----
  // Whichever elements are still unwritten -- fire and water were the
  // examples here until they were filled in, so it asks rather than
  // names one.
  {
    const unwritten = ['fire', 'water', 'wind', 'light', 'dark']
      .find((el) => !(RACES.ELEMENT_PARTY_BONUSES[el] || []).length &&
        Object.values(HEROES).some((h) => h.element === el));
    if (unwritten) {
      const id = Object.values(HEROES).find((h) => h.element === unwritten).id;
      const { summary } = party(0, [id, id, id, id]);
      assert(!summary.some((b) => b.element === unwritten),
        `${unwritten} paid out a bonus it has no table for`);
    }
  }
});

// Water's set is defensive, and its 4pc is the first tier that is
// CONDITIONAL on where a hero stands -- so it has to be read live, not
// stamped onto the unit at build.
test('water party bonuses: armour, a bounce, and a front line that holds', () => {
  const waterIds = elementOnly('water');
  assert(waterIds.length >= 4, 'not enough water heroes to test four');

  // Seat deliberately: slot order on the player side is
  // center, front, front, back, back, back, front.
  const party = (n) => {
    const battle = new Battle();
    const units = [];
    for (let i = 0; i < n; i++) {
      const u = new Unit(HEROES[waterIds[i]], TEAM.PLAYER, { level: 30, stars: 3 });
      battle.placeUnit(u, i);
      units.push(u);
    }
    RACES.applyParty(units);
    return { battle, units };
  };

  // ---- 2pc Cold Iron: +15% DEF ----
  {
    const bare = new Unit(HEROES[waterIds[0]], TEAM.PLAYER, { level: 30, stars: 3 });
    const { units } = party(2);
    // Both water sects have packs now, so there are no pack-free water
    // heroes left to isolate with: derive from whichever sect the
    // fixture actually fielded.
    const wantDef = Math.round(bare.baseDef *
      partyStatMult('defPct', 'water', sectOfIds(waterIds), 2));
    assert(units[0].baseDef === wantDef,
      `DEF ${units[0].baseDef}, wanted ${wantDef}`);
  }

  // ---- 3pc Riptide: a CHANCE to bounce, capped with everything else ----
  {
    const bare = new Unit(HEROES[waterIds[0]], TEAM.PLAYER, { level: 30, stars: 3 });
    const { units } = party(3);
    assert(Math.abs(units[0].reflectChance() - (bare.reflectChance() + 0.15)) < 1e-9,
      `reflect ${units[0].reflectChance()} vs a base of ${bare.reflectChance()}`);
    assert(party(2).units[0].reflectChance() === bare.reflectChance(),
      'Riptide paid out at two water heroes');
  }

  // ---- 4pc Ice Shelf: front hexes only, and read LIVE ----
  {
    const { battle, units } = party(4);
    const byPosition = {};
    for (const sl of battle.playerSlots) {
      if (!byPosition[sl.position]) byPosition[sl.position] = sl;
    }
    const u = units[0];
    const prev = Battle.active;
    Battle.active = battle;
    try {
      u.slot = byPosition[POSITION.FRONT];
      const front = u.damageTakenMult(null);
      u.slot = byPosition[POSITION.BACK];
      const back = u.damageTakenMult(null);
      assert(Math.abs(front / back - 0.80) < 1e-9,
        `front took ${front} and back took ${back}, wanted a 0.80 ratio`);
      // Moved forward mid-fight, the shelf has to pick it up.
      u.slot = byPosition[POSITION.FRONT];
      assert(Math.abs(u.damageTakenMult(null) - front) < 1e-9,
        'Ice Shelf did not follow a hero who moved back to the front');
    } finally { Battle.active = prev; }
  }

  // ---- Three water heroes do not hold the shelf ----
  {
    const { battle, units } = party(3);
    const front = battle.playerSlots.find((s) => s.position === POSITION.FRONT);
    const prev = Battle.active;
    Battle.active = battle;
    try {
      units[0].slot = front;
      assert(Math.abs(units[0].damageTakenMult(null) - 1) < 1e-9,
        'Ice Shelf paid out at three water heroes');
    } finally { Battle.active = prev; }
  }
});

// Fire's set is offensive, and its 4pc is the first party bonus that
// needed new engine code -- a crit can land a second time. That echo is
// the part worth testing hard: a re-entrant damage path that rolls a
// chance is exactly where an infinite loop lives.
test('fire party bonuses: ATK, a burn payoff, and a crit that lands twice', () => {
  const fireIds = elementOnly('fire');
  assert(fireIds.length >= 4, 'not enough fire heroes to test four');

  const party = (n) => {
    const battle = new Battle();
    const units = [];
    for (let i = 0; i < n; i++) {
      const u = new Unit(HEROES[fireIds[i]], TEAM.PLAYER, { level: 30, stars: 3 });
      battle.placeUnit(u, i);
      units.push(u);
    }
    RACES.applyParty(units);
    return { battle, units };
  };

  // ---- 2pc Stoked: the ATK STAT, so ATK-priced mends rise with it ----
  {
    const bare = new Unit(HEROES[fireIds[0]], TEAM.PLAYER, { level: 30, stars: 3 });
    const { units } = party(2);
    // Derived ahead of need: once the Phoenix Court has a pack there
    // will be no pack-free fire heroes either.
    const wantAtk = Math.round(bare.baseAtk *
      partyStatMult('atkPct', 'fire', sectOfIds(fireIds), 2));
    assert(units[0].baseAtk === wantAtk,
      `ATK ${units[0].baseAtk}, wanted ${wantAtk}`);
  }

  // ---- 3pc Moth to Flame: reads the TARGET's state, live ----
  {
    const { battle, units } = party(3);
    const foe = roomy(place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1), 50);
    const prev = Battle.active;
    Battle.active = battle;
    try {
      const cold = units[0].damageDealtMult(foe, null);
      foe.addStatusEffect({ kind: 'dot', amount: 10, turns: 3,
        flavor: 'burn', source: units[0] });
      const alight = units[0].damageDealtMult(foe, null);
      assert(Math.abs(cold - 1) < 1e-9, `a cold target paid ${cold}`);
      assert(Math.abs(alight - 1.25) < 1e-9, `a burning target paid ${alight}`);
    } finally { Battle.active = prev; }
  }

  // ---- 4pc Encore: a crit that lands again ----
  {
    const { battle, units } = party(4);
    const caster = units[0];
    const foe = roomy(place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1), 500);
    foe.dodgeChance = () => 0;
    foe.reflectChance = () => 0;
    const prev = Battle.active;
    Battle.active = battle;
    const real = Math.random;
    try {
      // Forced crit, forced echo: the second blow must land and be
      // reported, and it must be half the swing.
      caster.effectiveStat = ((base) => function (stat) {
        if (stat === 'critChance') return 1;
        if (stat === 'critDamage') return 1;   // keep the arithmetic plain
        return base.call(this, stat);
      })(Unit.prototype.effectiveStat);
      Math.random = () => 0;                    // every roll succeeds
      const hit = Abilities.strike(caster, foe, 1000, { crit: true });
      assert(hit.crit, 'the forced crit did not crit');
      assert(hit.echo > 0, 'the echo did not land');
      // Half the RAW, so the DEF curve answers it in its own right --
      // the echo is a blow, not a copy of the first number.
      const solo = Abilities.strike(caster, foe, 500, { crit: false });
      assert(Math.abs(hit.echo - solo.amount) <= 1,
        `the echo dealt ${hit.echo}, a half-swing deals ${solo.amount}`);

      // It must NOT echo itself. With every roll succeeding, a
      // self-echoing implementation recurses until the stack dies, so
      // reaching this line at all is most of the assertion.
      assert(Unit.echoing !== true, 'the echo guard was left set');

      // A crit with the tier NOT held echoes nothing.
      const three = party(3);
      const lone = three.units[0];
      lone.effectiveStat = caster.effectiveStat;
      const foe3 = roomy(place(three.battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1), 500);
      foe3.dodgeChance = () => 0;
      foe3.reflectChance = () => 0;
      Battle.active = three.battle;
      const noEcho = Abilities.strike(lone, foe3, 1000, { crit: true });
      assert(!noEcho.echo, `three fire heroes echoed for ${noEcho.echo}`);

      // And a NON-crit never echoes, however the dice fall.
      Battle.active = battle;
      const plain = Abilities.strike(caster, foe, 1000, { crit: false });
      assert(!plain.echo, 'a non-crit echoed');
    } finally {
      Math.random = real;
      delete caster.effectiveStat;
      Battle.active = prev;
    }
  }
});

// Light's set is built on the health pool: a bigger one, a stay of
// execution at the bottom of it, and a ward priced off it.
test('light party bonuses: a bigger pool, a last bell, and an opening ward', () => {
  const lightIds = elementOnly('light');
  assert(lightIds.length >= 4, 'not enough light heroes to test four');

  const party = (n) => {
    const battle = new Battle();
    const units = [];
    for (let i = 0; i < n; i++) {
      const u = new Unit(HEROES[lightIds[i]], TEAM.PLAYER, { level: 30, stars: 3 });
      battle.placeUnit(u, i);
      units.push(u);
    }
    RACES.applyParty(units);
    return { battle, units };
  };

  // ---- 2pc Congregation: +15% max HP, and the hero arrives full ----
  {
    const bare = new Unit(HEROES[lightIds[0]], TEAM.PLAYER, { level: 30, stars: 3 });
    const { units } = party(2);
    // Every light hero is Reverence, so this is both sets at once.
    const want = Math.round(bare.maxHp * partyStatMult('hpPct', 'light', 'reverence', 2));
    assert(units[0].maxHp === want,
      `max HP ${units[0].maxHp}, wanted ${want}`);
    assert(units[0].hp === units[0].maxHp,
      'the hero did not arrive at the top of their new pool');
  }

  // ---- 3pc The Last Bell: below a quarter, read live ----
  {
    const { battle, units } = party(3);
    const u = units[0];
    const prev = Battle.active;
    Battle.active = battle;
    try {
      u.hp = u.maxHp;
      assert(Math.abs(u.damageTakenMult(null) - 1) < 1e-9, 'the bell rang at full HP');
      u.hp = Math.round(u.maxHp * 0.30);
      assert(Math.abs(u.damageTakenMult(null) - 1) < 1e-9, 'the bell rang at 30% HP');
      u.hp = Math.round(u.maxHp * 0.20);
      assert(Math.abs(u.damageTakenMult(null) - 0.70) < 1e-9,
        `at 20% HP the bell paid ${u.damageTakenMult(null)}`);
      // Two light heroes do not hold it.
      const two = party(2);
      const t = two.units[0];
      t.hp = Math.round(t.maxHp * 0.10);
      Battle.active = two.battle;
      assert(Math.abs(t.damageTakenMult(null) - 1) < 1e-9,
        'the bell rang at two light heroes');
    } finally { Battle.active = prev; }
  }

  // ---- 4pc Matins: an opening ward, priced off the FINAL pool ----
  {
    const { units } = party(4);
    const u = units[0];
    const ward = u.shieldTotal ? u.shieldTotal() : 0;
    assert(ward > 0, 'the party opened the fight with no ward');
    // 15% of the pool AFTER Congregation's lift -- if the ward were
    // granted before the HP tier, it would be 15% of the smaller pool
    // and this is the assertion that catches it.
    assert(Math.abs(ward - Math.round(u.maxHp * 0.15)) <= 1,
      `ward ${ward}, wanted 15% of the final pool (${Math.round(u.maxHp * 0.15)})`);
    const bare = new Unit(HEROES[lightIds[0]], TEAM.PLAYER, { level: 30, stars: 3 });
    assert(ward > Math.round(bare.maxHp * 0.15),
      'the ward was priced off the pool the hero walked in with');
    assert(u.maxHp === Math.round(bare.maxHp *
      partyStatMult('hpPct', 'light', 'reverence', 4)),
      'the pool the ward was priced off is not both sets applied');

    // Three light heroes get no ward at all.
    const three = party(3);
    assert((three.units[0].shieldTotal ? three.units[0].shieldTotal() : 0) === 0,
      'three light heroes opened with a ward');
  }
});

// Dark's set is about landing what you throw. Two of its three tiers are
// currently INERT, and that is recorded here rather than left in a
// commit message: the landing contest is
//   max(0.15, 1 - max(0, resistance - accuracy))
// and nothing in the game carries resistance, so at 0 it is already a
// certainty. Both halves are stated -- that they do nothing today, and
// that they work the moment a target has a ward to beat. If resistance
// is ever given to bosses or elites, the first assertion is the one that
// will fail, which is exactly the reminder wanted at that moment.
test('dark party bonuses: accuracy, ward-piercing, and a hex that lingers', () => {
  const darkIds = elementOnly('dark');
  assert(darkIds.length >= 4, 'not enough dark heroes to test four');

  const party = (n) => {
    const battle = new Battle();
    const units = [];
    for (let i = 0; i < n; i++) {
      const u = new Unit(HEROES[darkIds[i]], TEAM.PLAYER, { level: 30, stars: 3 });
      battle.placeUnit(u, i);
      units.push(u);
    }
    RACES.applyParty(units);
    return { battle, units };
  };

  // ---- The premise: everyone starts at 15, a boss holds 65 ----
  {
    const bare = new Unit(HEROES[darkIds[0]], TEAM.ENEMY, { level: 30, stars: 3 });
    assert(Math.abs(bare.debuffAccuracy() - 0.15) < 1e-9,
      `a bare hero's accuracy is ${bare.debuffAccuracy()}`);
    assert(Math.abs(bare.debuffResistance() - 0.15) < 1e-9,
      `a bare hero's resistance is ${bare.debuffResistance()}`);
    const boss = new Unit(BOSSES.dragon, TEAM.ENEMY, { level: 60, stars: 5 });
    assert(Math.abs(boss.debuffResistance() - 0.65) < 1e-9,
      `a boss holds ${boss.debuffResistance()}, wanted 0.65`);
    // Accuracy tops out above resistance on purpose: a fully-built
    // attacker can always beat a fully-built defender.
    const brute = new Unit(HEROES[darkIds[0]], TEAM.PLAYER, { level: 30, stars: 3 });
    brute.gearAccuracy = 99;
    assert(brute.debuffAccuracy() === 1, `accuracy capped at ${brute.debuffAccuracy()}`);
    const wall = new Unit(HEROES[darkIds[0]], TEAM.ENEMY, { level: 30, stars: 3 });
    wall.gearResistance = 99;
    assert(wall.debuffResistance() === 0.85,
      `resistance capped at ${wall.debuffResistance()}`);
  }

  // ---- 2pc Unerring: the stat moves, even though it buys nothing yet --
  {
    const bare = new Unit(HEROES[darkIds[0]], TEAM.PLAYER, { level: 30, stars: 3 });
    const { units } = party(2);
    assert(Math.abs(units[0].debuffAccuracy() - (bare.debuffAccuracy() + 0.25)) < 1e-9,
      `accuracy ${units[0].debuffAccuracy()} vs a base of ${bare.debuffAccuracy()}`);
  }

  // ---- 2pc + 3pc, measured against a BOSS ----
  {
    const { battle, units } = party(3);
    const caster = units[0];
    const boss = new Unit(BOSSES.dragon, TEAM.ENEMY, { level: 60, stars: 5 });
    battle.placeUnit(boss, 0);
    const prev = Battle.active;
    Battle.active = battle;
    const real = Math.random;
    try {
      // Boss 0.65. A bare caster brings 0.15, so 1 - 0.50 = 0.50.
      // The party brings 0.15 + 0.25 accuracy and pierces 20% of the
      // ward: seen 0.52, so 1 - (0.52 - 0.40) = 0.88.
      const lands = (who, roll) => {
        Math.random = () => roll;
        return Abilities.takeLands(who, boss);
      };
      const bare = new Unit(HEROES[darkIds[0]], TEAM.PLAYER, { level: 30, stars: 3 });
      battle.placeUnit(bare, 5);
      assert(lands(bare, 0.49) && !lands(bare, 0.51),
        'an unaided caster does not sit on a coin flip against a boss');
      assert(lands(caster, 0.87), 'the warded party was refused under its own chance');
      assert(!lands(caster, 0.89), 'the warded party landed above its own chance');
    } finally { Math.random = real; Battle.active = prev; }
  }

  // ---- and against a PEER, they still change nothing ----
  // 15 against 15 is already a certainty, and no amount of accuracy
  // improves on certain. That is not a bug: it is why the tiers are
  // priced for the fight they exist for.
  {
    const { battle, units } = party(3);
    const foe = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1);
    const bare = new Unit(HEROES[darkIds[0]], TEAM.PLAYER, { level: 30, stars: 3 });
    battle.placeUnit(bare, 5);
    const prev = Battle.active;
    Battle.active = battle;
    const real = Math.random;
    try {
      Math.random = () => 0.99;
      assert(Abilities.takeLands(units[0], foe) === Abilities.takeLands(bare, foe),
        'accuracy changed the outcome against an ordinary body');
    } finally { Math.random = real; Battle.active = prev; }
  }

  // ---- 4pc Lingering: the live tier ----
  {
    const bare = new Unit(HEROES[darkIds[0]], TEAM.PLAYER, { level: 30, stars: 3 });
    assert(bare.synergyDebuffExtraChance === 0, 'a bare hero already lingers');
    const { units } = party(4);
    assert(Math.abs(units[0].synergyDebuffExtraChance - 0.50) < 1e-9,
      `Lingering set the channel to ${units[0].synergyDebuffExtraChance}`);
    assert(party(3).units[0].synergyDebuffExtraChance === 0,
      'Lingering paid out at three dark heroes');
  }
});

// The first SECT pack. Sects use the same 2/3/4 thresholds as the
// elements and stack with them, but pay the WHOLE PARTY rather than only
// their own -- that difference is the point of having both, and it is
// the first thing asserted here.
test('Cryst sect pack: paid to everyone, and the ice is what pays', () => {
  const cryst = RACES.SECTS.cryst.members;

  const party = (n, tagalong = null) => {
    const battle = new Battle();
    const units = [];
    for (let i = 0; i < n; i++) {
      const u = new Unit(HEROES[cryst[i]], TEAM.PLAYER, { level: 30, stars: 3 });
      battle.placeUnit(u, i);
      units.push(u);
    }
    if (tagalong) {
      const u = new Unit(HEROES[tagalong], TEAM.PLAYER, { level: 30, stars: 3 });
      battle.placeUnit(u, units.length);
      units.push(u);
    }
    const summary = RACES.applyParty(units);
    return { battle, units, summary };
  };

  // ---- 2pc Cold Iron Court: +10% DEF, TO EVERYONE ----
  {
    // A fire hero standing with two Cryst: not water, not Cryst, and
    // still paid. That is the rule that separates a sect from an element.
    const outsider = Object.values(HEROES).find((h) => h.element === 'fire').id;
    const bare = new Unit(HEROES[outsider], TEAM.PLAYER, { level: 30, stars: 3 });
    const { units } = party(2, outsider);
    const guest = units[units.length - 1];
    assert(guest.def.id === outsider, 'the fixture lost its guest');
    assert(guest.baseDef === Math.round(bare.baseDef * 1.10),
      `the guest's DEF is ${guest.baseDef}, wanted ${Math.round(bare.baseDef * 1.10)}`);
    // And the Cryst themselves hold BOTH sets: water's 15% and the
    // sect's 10%, applied in turn rather than summed.
    const bareCryst = new Unit(HEROES[cryst[0]], TEAM.PLAYER, { level: 30, stars: 3 });
    assert(units[0].baseDef === Math.round(Math.round(bareCryst.baseDef * 1.15) * 1.10),
      `a Cryst hero's DEF is ${units[0].baseDef}, wanted both sets`);
  }

  // ---- 3pc Crystquiver: armour-blindness that reads the target ----
  {
    const { battle, units } = party(3);
    const caster = units[0];
    const warm = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 200);
    const cold = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 2), 200);
    warm.dodgeChance = () => 0; cold.dodgeChance = () => 0;
    warm.reflectChance = () => 0; cold.reflectChance = () => 0;
    cold.addStatusEffect({ kind: 'debuff', stat: 'freeze', turns: 3, source: caster });
    assert(cold.frozen() && !warm.frozen(), 'the fixture did not freeze one of them');
    const prev = Battle.active;
    Battle.active = battle;
    try {
      const hitWarm = Abilities.strike(caster, warm, 2000, {});
      const hitCold = Abilities.strike(caster, cold, 2000, {});
      assert(hitCold.amount > hitWarm.amount,
        `the frozen target took ${hitCold.amount} and the warm one ${hitWarm.amount}`);
    } finally { Battle.active = prev; }

    // Two Cryst do not carry the quiver.
    const two = party(2);
    const foe = roomy(place(two.battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 200);
    foe.dodgeChance = () => 0; foe.reflectChance = () => 0;
    foe.addStatusEffect({ kind: 'debuff', stat: 'freeze', turns: 3, source: two.units[0] });
    Battle.active = two.battle;
    try {
      const a = Abilities.strike(two.units[0], foe, 2000, {});
      const b = Abilities.strike(two.units[0], foe, 2000, {});
      assert(Math.abs(a.amount - b.amount) <= 1, 'the fixture is not deterministic');
    } finally { Battle.active = prev; }
  }

  // ---- 4pc Frostbite: counts the FIELD, not the target ----
  {
    const { battle, units } = party(4);
    const caster = units[0];
    const foes = [1, 2, 4].map((i) =>
      roomy(place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, i), 200));
    const prev = Battle.active;
    Battle.active = battle;
    try {
      assert(Math.abs(caster.damageDealtMult(foes[0], null) - 1) < 1e-9,
        'Frostbite paid with nothing frozen');
      // Freeze a DIFFERENT enemy than the one being hit: the field being
      // cold is the condition, so the swing at the warm one gets it too.
      foes[1].addStatusEffect({ kind: 'debuff', stat: 'freeze', turns: 3, source: caster });
      assert(Math.abs(caster.damageDealtMult(foes[0], null) - 1.05) < 1e-9,
        `one frozen elsewhere paid ${caster.damageDealtMult(foes[0], null)}`);
      foes[2].addStatusEffect({ kind: 'debuff', stat: 'freeze', turns: 3, source: caster });
      assert(Math.abs(caster.damageDealtMult(foes[0], null) - 1.10) < 1e-9,
        `two frozen paid ${caster.damageDealtMult(foes[0], null)}`);
    } finally { Battle.active = prev; }

    // Three Cryst do not hold it.
    const three = party(3);
    const foe = place(three.battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1);
    foe.addStatusEffect({ kind: 'debuff', stat: 'freeze', turns: 3, source: three.units[0] });
    Battle.active = three.battle;
    try {
      assert(Math.abs(three.units[0].damageDealtMult(foe, null) - 1) < 1e-9,
        'Frostbite paid out at three Cryst');
    } finally { Battle.active = prev; }
  }

  // ---- the summary names the sect, separately from the element ----
  {
    const { summary } = party(4);
    assert(summary.some((b) => b.sect === 'cryst'), 'no Cryst pack in the summary');
    assert(summary.some((b) => b.element === 'water'), 'no water resonance in the summary');
  }
});

// Reverence's pack. Its 2pc is the first tier that scales with HOW MANY
// of the sect turned up rather than with the tier reached, which is the
// only shape a max-HP bonus can scale in: maxHp is written once at build
// and never recomputed.
test('Reverence sect pack: a chapter that grows, a vow, and last rites', () => {
  const rev = RACES.SECTS.reverence.members;

  const party = (n, tagalong = null) => {
    const battle = new Battle();
    const units = [];
    for (let i = 0; i < n; i++) {
      const u = new Unit(HEROES[rev[i]], TEAM.PLAYER, { level: 30, stars: 3 });
      battle.placeUnit(u, i);
      units.push(u);
    }
    if (tagalong) {
      const u = new Unit(HEROES[tagalong], TEAM.PLAYER, { level: 30, stars: 3 });
      battle.placeUnit(u, units.length);
      units.push(u);
    }
    RACES.applyParty(units);
    return { battle, units };
  };

  // ---- 2pc Chapter House: grows with the chapter, pays the party ----
  {
    const outsider = Object.values(HEROES).find((h) => h.element === 'fire').id;
    const bareGuest = new Unit(HEROES[outsider], TEAM.PLAYER, { level: 30, stars: 3 });
    // Two Reverence and one guest: the guest is not light, so the only
    // thing touching them is the sect -- 5% x 2 = 10%.
    const { units } = party(2, outsider);
    const guest = units[units.length - 1];
    assert(guest.maxHp === Math.round(bareGuest.maxHp * 1.10),
      `two Reverence paid the guest ${guest.maxHp}, wanted ` +
      `${Math.round(bareGuest.maxHp * 1.10)}`);

    // Four Reverence pay 20%, not 10%: the tier reads the COUNT.
    const four = party(4, outsider);
    const guest4 = four.units[four.units.length - 1];
    assert(guest4.maxHp === Math.round(bareGuest.maxHp * 1.20),
      `four Reverence paid the guest ${guest4.maxHp}, wanted ` +
      `${Math.round(bareGuest.maxHp * 1.20)}`);
    assert(guest4.hp === guest4.maxHp, 'the guest did not arrive full');
  }

  // ---- 3pc Vow of Reverence: a ward on being mended ----
  {
    const { battle, units } = party(3);
    const healer = units[0];
    const mate = units[1];
    const prev = Battle.active;
    Battle.active = battle;
    try {
      mate.hp = Math.round(mate.maxHp * 0.5);
      const before = mate.effectiveStat('def');
      battle.onUnitHealed(mate, 50);
      const vow = mate.statusEffects.find((fx) => fx.vowPack);
      assert(vow, 'the vow did not land on a mended ally');
      assert(Math.abs(vow.mult - 1.10) < 1e-9, `the vow gave ${vow.mult}`);
      assert(mate.effectiveStat('def') > before, 'the vow moved no DEF');

      // It must not re-stack on every tick of healing.
      battle.onUnitHealed(mate, 50);
      battle.onUnitHealed(mate, 50);
      assert(mate.statusEffects.filter((fx) => fx.vowPack).length === 1,
        'the vow stacked on repeated healing');

      // And it must NOT be blocked by Catherine's own ward, or the pack
      // would go quiet in the very party it belongs to.
      const cath = units.find((u) => u.def.id === 'catherine');
      if (cath) {
        const other = units.find((u) => u !== cath && u !== mate) || mate;
        other.hp = Math.round(other.maxHp * 0.5);
        battle.onUnitHealed(other, 50);
        const both = other.statusEffects.filter(
          (fx) => fx.vowPack || fx.reverence).length;
        assert(both >= 1, 'neither ward landed');
      }
    } finally { Battle.active = prev; }

    // Two Reverence do not swear it.
    const two = party(2);
    Battle.active = two.battle;
    try {
      two.units[1].hp = Math.round(two.units[1].maxHp * 0.5);
      two.battle.onUnitHealed(two.units[1], 50);
      assert(!two.units[1].statusEffects.some((fx) => fx.vowPack),
        'the vow landed at two Reverence');
    } finally { Battle.active = prev; }
  }

  // ---- 4pc Last Rites: an execute, read off the TARGET ----
  {
    const { battle, units } = party(4);
    const foe = roomy(place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1), 50);
    const prev = Battle.active;
    Battle.active = battle;
    try {
      foe.hp = foe.maxHp;
      assert(Math.abs(units[0].damageDealtMult(foe, null) - 1) < 1e-9,
        'last rites were read over a healthy enemy');
      foe.hp = Math.round(foe.maxHp * 0.30);
      assert(Math.abs(units[0].damageDealtMult(foe, null) - 1) < 1e-9,
        'last rites were read at 30% HP');
      foe.hp = Math.round(foe.maxHp * 0.20);
      assert(Math.abs(units[0].damageDealtMult(foe, null) - 1.30) < 1e-9,
        `at 20% HP last rites paid ${units[0].damageDealtMult(foe, null)}`);
    } finally { Battle.active = prev; }
  }
});

// The Firetroupe's pack applies its own mark at 2 and cashes it at 4 --
// the first pack whose tiers feed each other. Oil is not a recoloured
// hex: a burn ticks for DOUBLE on an oiled target, so this is also the
// Firetroupe making the Phoenix Court's fires worth twice as much.
test('Firetroupe sect pack: oil laid down, a hurt crowd, and a grease fire', () => {
  const troupe = RACES.SECTS.firetroupe.members;

  const party = (n) => {
    const battle = new Battle();
    const units = [];
    for (let i = 0; i < n; i++) {
      const u = new Unit(HEROES[troupe[i]], TEAM.PLAYER, { level: 30, stars: 3 });
      battle.placeUnit(u, i);
      units.push(u);
    }
    RACES.applyParty(units);
    return { battle, units };
  };

  // ---- 2pc Slick Hands: the channel, and the mark it lays ----
  {
    const bare = new Unit(HEROES[troupe[0]], TEAM.PLAYER, { level: 30, stars: 3 });
    assert(bare.synergyOilOnHit === 0, 'a bare hero already slicks');
    const { battle, units } = party(2);
    assert(Math.abs(units[0].synergyOilOnHit - 0.10) < 1e-9,
      `Slick Hands set the channel to ${units[0].synergyOilOnHit}`);

    // Landed, with the roll forced, it marks the victim.
    const foe = roomy(place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1), 200);
    foe.dodgeChance = () => 0; foe.reflectChance = () => 0;
    const prev = Battle.active;
    Battle.active = battle;
    const real = Math.random;
    try {
      Math.random = () => 0;                    // every roll succeeds
      Abilities.strike(units[0], foe, 500, {});
      assert(foe.oiled(), 'a landed hit left no oil');
    } finally { Math.random = real; Battle.active = prev; }
  }

  // ---- the oil's own payoff: burns tick DOUBLE on an oiled target ----
  {
    const { battle, units } = party(2);
    const prev = Battle.active;
    Battle.active = battle;
    try {
      // A burn tick goes through Abilities.strike, so the DEF curve
      // answers it: a small tick against a thick-hided rat rounds to
      // nothing and both readings come back zero. Squishy target, tick
      // big enough that the curve leaves something to compare.
      const bit = (oil) => {
        const foe = roomy(place(battle, DUMMIES.rat_archer, TEAM.ENEMY, 4), 500);
        foe.dodgeChance = () => 0; foe.reflectChance = () => 0;
        foe.addStatusEffect({ kind: 'dot', amount: 20000, turns: 3,
          flavor: 'burn', source: units[0] });
        if (oil) {
          foe.addStatusEffect({ kind: 'debuff', stat: 'oilslicked',
            turns: 3, source: units[0] });
        }
        const before = foe.hp;
        // startTurn is where dots actually tick; tickStatusEffects only
        // counts turns down.
        foe.startTurn(battle);
        battle.units = battle.units.filter((u) => u !== foe);
        return before - foe.hp;
      };
      const dry = bit(false), oily = bit(true);
      assert(oily > dry * 1.5,
        `a burn ticked ${dry} dry and ${oily} oiled — it should be double`);
    } finally { Battle.active = prev; }
  }

  // ---- 3pc The Crowd Loves It: counts the PARTY, not the enemy ----
  {
    const { battle, units } = party(3);
    const foe = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1);
    const prev = Battle.active;
    Battle.active = battle;
    try {
      units.forEach((u) => { u.hp = u.maxHp; });
      assert(Math.abs(units[0].damageDealtMult(foe, null) - 1) < 1e-9,
        'the crowd cheered a healthy party');
      units[1].hp = Math.round(units[1].maxHp * 0.4);
      assert(Math.abs(units[0].damageDealtMult(foe, null) - 1.05) < 1e-9,
        `one hurt ally paid ${units[0].damageDealtMult(foe, null)}`);
      units[2].hp = Math.round(units[2].maxHp * 0.2);
      assert(Math.abs(units[0].damageDealtMult(foe, null) - 1.10) < 1e-9,
        `two hurt allies paid ${units[0].damageDealtMult(foe, null)}`);
      // BELOW HALF, not merely dented. A hero at 70% is hurt and does
      // not count -- without this the threshold is unpinned and could
      // drift anywhere under full health.
      units[0].hp = Math.round(units[0].maxHp * 0.70);
      assert(Math.abs(units[0].damageDealtMult(foe, null) - 1.10) < 1e-9,
        `a hero at 70% HP joined the crowd (${units[0].damageDealtMult(foe, null)})`);
      units[0].hp = Math.round(units[0].maxHp * 0.49);
      assert(Math.abs(units[0].damageDealtMult(foe, null) - 1.15) < 1e-9,
        `at 49% they should count (${units[0].damageDealtMult(foe, null)})`);
      units[0].hp = units[0].maxHp;
      // A wounded ENEMY is not the crowd.
      foe.hp = Math.round(foe.maxHp * 0.1);
      assert(Math.abs(units[0].damageDealtMult(foe, null) - 1.10) < 1e-9,
        'a wounded enemy counted toward the crowd');
    } finally { Battle.active = prev; }
  }

  // ---- 4pc Grease Fire: reads the target's mark ----
  {
    const { battle, units } = party(4);
    const foe = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1);
    const prev = Battle.active;
    Battle.active = battle;
    try {
      units.forEach((u) => { u.hp = u.maxHp; });   // silence the 3pc
      assert(Math.abs(units[0].damageDealtMult(foe, null) - 1) < 1e-9,
        'grease fire paid on a dry target');
      foe.addStatusEffect({ kind: 'debuff', stat: 'oilslicked',
        turns: 2, source: units[0] });
      assert(Math.abs(units[0].damageDealtMult(foe, null) - 1.20) < 1e-9,
        `an oiled target paid ${units[0].damageDealtMult(foe, null)}`);
    } finally { Battle.active = prev; }

    // Three do not carry it.
    const three = party(3);
    const foe3 = place(three.battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1);
    three.units.forEach((u) => { u.hp = u.maxHp; });
    foe3.addStatusEffect({ kind: 'debuff', stat: 'oilslicked', turns: 2,
      source: three.units[0] });
    const prev2 = Battle.active;
    Battle.active = three.battle;
    try {
      assert(Math.abs(three.units[0].damageDealtMult(foe3, null) - 1) < 1e-9,
        'grease fire paid out at three Firetroupe');
    } finally { Battle.active = prev2; }
  }
});

// The Nightflowers' pack is built on death and on what the enemy is
// already carrying -- the live half of dark, since two of that element's
// three tiers sleep until resistance exists.
test('Nightflower sect pack: a wilting garden, a passing bell, cut flowers', () => {
  const night = RACES.SECTS.nightflower.members;

  const party = (n) => {
    const battle = new Battle();
    const units = [];
    for (let i = 0; i < n; i++) {
      const u = new Unit(HEROES[night[i]], TEAM.PLAYER, { level: 30, stars: 3 });
      battle.placeUnit(u, i);
      units.push(u);
    }
    RACES.applyParty(units);
    return { battle, units };
  };

  // ---- 2pc Wilting Garden: hexes AND poisons, capped at five ----
  {
    const { battle, units } = party(2);
    // Sawyer counts both himself, so pick a member who is NOT him: his
    // own passive would ride along and the reading would be two things.
    const caster = units.find((u) => u.def.id !== 'sawyer') || units[1];
    const foe = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1);
    const prev = Battle.active;
    Battle.active = battle;
    try {
      foe.statusEffects.length = 0;
      assert(Math.abs(caster.damageDealtMult(foe, null) - 1) < 1e-9,
        'the garden wilted a clean target');
      foe.addStatusEffect({ kind: 'debuff', stat: 'speed', mult: 0.9, turns: 3 });
      assert(Math.abs(caster.damageDealtMult(foe, null) - 1.08) < 1e-9,
        `one hex paid ${caster.damageDealtMult(foe, null)}`);
      // A POISON counts too -- a flower droops the same whichever did it.
      foe.addStatusEffect({ kind: 'dot', amount: 10, turns: 3,
        flavor: 'poison', source: caster });
      assert(Math.abs(caster.damageDealtMult(foe, null) - 1.16) < 1e-9,
        `a hex and a poison paid ${caster.damageDealtMult(foe, null)}`);
      // Capped at five.
      for (let i = 0; i < 8; i++) {
        foe.addStatusEffect({ kind: 'debuff', stat: 'critChance',
          add: -0.05, turns: 3 });
      }
      assert(Math.abs(caster.damageDealtMult(foe, null) - 1.40) < 1e-9,
        `a smothered target paid ${caster.damageDealtMult(foe, null)}, wanted the +40% cap`);
    } finally { Battle.active = prev; }
  }

  // ---- 3pc The Passing Bell: an ALLY's death, everyone's cooldowns ----
  {
    const { battle, units } = party(3);
    const prev = Battle.active;
    Battle.active = battle;
    try {
      for (const u of units) {
        for (const a of u.abilities) a.cooldownRemaining = 3;
      }
      const foe = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1);
      for (const a of foe.abilities || []) a.cooldownRemaining = 3;

      // An ENEMY falling rings nothing.
      foe.hp = 1;
      foe.takeDamage(99999, units[0]);
      assert(units[0].abilities.every((a) => a.cooldownRemaining === 3),
        'an enemy death rang the bell');

      // An ALLY falling shortens every survivor's cooldowns.
      const doomed = units[units.length - 1];
      doomed.hp = 1;
      doomed.takeDamage(99999, foe);
      const survivors = units.filter((u) => u.alive);
      assert(survivors.length >= 2, 'the fixture killed too much');
      for (const u of survivors) {
        assert(u.abilities.every((a) => a.cooldownRemaining === 2),
          `${u.def.name} still sits at ${u.abilities[0].cooldownRemaining}`);
      }
    } finally { Battle.active = prev; }

    // Two Nightflowers do not ring it.
    const two = party(2);
    Battle.active = two.battle;
    try {
      for (const a of two.units[0].abilities) a.cooldownRemaining = 3;
      const doomed = two.units[1];
      doomed.hp = 1;
      doomed.takeDamage(99999, two.units[0]);
      assert(two.units[0].abilities.every((a) => a.cooldownRemaining === 3),
        'the bell rang at two Nightflowers');
    } finally { Battle.active = prev; }
  }

  // ---- 4pc Cut Flowers: the body count, BOTH sides ----
  {
    const { battle, units } = party(4);
    const foe = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1);
    const prev = Battle.active;
    Battle.active = battle;
    try {
      battle.deaths = 0;
      assert(Math.abs(units[0].damageDealtMult(foe, null) - 1) < 1e-9,
        'cut flowers paid before anyone fell');
      battle.deaths = 2;
      assert(Math.abs(units[0].damageDealtMult(foe, null) - 1.10) < 1e-9,
        `two dead paid ${units[0].damageDealtMult(foe, null)}`);
      battle.deaths = 12;
      assert(Math.abs(units[0].damageDealtMult(foe, null) - 1.25) < 1e-9,
        `a full graveyard paid ${units[0].damageDealtMult(foe, null)}, wanted the +25% cap`);
    } finally { Battle.active = prev; }
  }
});

// The Whisperchime trade in boons: taken off the enemy, absent from the
// enemy, or the enemy stood somewhere they should not be.
test('Whisperchime sect pack: a tax, bare branches, and being out of place', () => {
  const chime = RACES.SECTS.whisperchime.members;

  const party = (n) => {
    const battle = new Battle();
    const units = [];
    for (let i = 0; i < n; i++) {
      const u = new Unit(HEROES[chime[i]], TEAM.PLAYER, { level: 30, stars: 3 });
      battle.placeUnit(u, i);
      units.push(u);
    }
    RACES.applyParty(units);
    return { battle, units };
  };

  // ---- 2pc Chime Tax: the WHOLE ring is paid, not just the stripper --
  {
    const { battle, units } = party(2);
    const foe = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1);
    const prev = Battle.active;
    Battle.active = battle;
    try {
      foe.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.2, turns: 3 });
      foe.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.2, turns: 3 });
      units.forEach((u) => { u.turnMeter = 0; });
      const stripper = units[0];
      Abilities.applyEffect({ type: 'stripBuffs', count: 2 }, stripper, foe, 1);
      // Two boons torn, so 20% of a bar each -- to EVERY hero, including
      // the one who did not swing. Tumble collects TWICE: the pack is
      // his own passive opened out, and he still owns the original, so
      // the sect's taxman is better at the sect's tax. Same shape as
      // Lenore double-ringing the Nightflowers' bell.
      const share = CONFIG.TURN_METER_MAX * 0.20;
      for (const u of units) {
        const want = u.def.id === 'tumble' ? share * 2 : share;
        assert(u.turnMeter > 0,
          `${u.def.name} collected no tax (${u.turnMeter})`);
        assert(Math.abs(u.turnMeter - want) < CONFIG.TURN_METER_MAX * 0.02,
          `${u.def.name} collected ${u.turnMeter}, wanted ${want}`);
      }
    } finally { Battle.active = prev; }

    // A lone Whisperchime pays no tax to anybody but themselves.
    const one = party(1);
    const foe1 = place(one.battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1);
    Battle.active = one.battle;
    try {
      foe1.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.2, turns: 3 });
      one.units[0].turnMeter = 0;
      const before = one.units[0].turnMeter;
      Abilities.applyEffect({ type: 'stripBuffs', count: 1 }, one.units[0], foe1, 1);
      const gained = one.units[0].turnMeter - before;
      // Tumble carries Chime Tax himself, so a lone Tumble still gains.
      // What must NOT happen is the PACK paying at one hero.
      const isTumble = one.units[0].def.id === 'tumble';
      if (!isTumble) {
        assert(gained === 0, `a lone Whisperchime collected ${gained}`);
      }
    } finally { Battle.active = prev; }
  }

  // ---- 3pc Bare Branches: ANY buff shelters them ----
  {
    const { battle, units } = party(3);
    // Galen carries this himself; measure on somebody who does not.
    const caster = units.find((u) => u.def.id !== 'galen') || units[1];
    const foe = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1);
    const prev = Battle.active;
    Battle.active = battle;
    try {
      // Read as a RATIO. At three Whisperchime the party also holds
      // wind's Crosswind, which multiplies the same channel off the
      // caster's speed -- an absolute reading would be measuring both.
      // Bare over blessed cancels everything that does not depend on
      // the target.
      foe.statusEffects.length = 0;
      const bareMult = caster.damageDealtMult(foe, null);
      // A DEBUFF is not a buff -- it must not shelter them.
      foe.addStatusEffect({ kind: 'debuff', stat: 'speed', mult: 0.8, turns: 3 });
      assert(Math.abs(caster.damageDealtMult(foe, null) - bareMult) < 1e-9,
        'a hex sheltered an enemy from Bare Branches');
      foe.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.2, turns: 3 });
      const blessedMult = caster.damageDealtMult(foe, null);
      assert(Math.abs(bareMult / blessedMult - 1.20) < 1e-9,
        `bare ${bareMult} over blessed ${blessedMult} is not the 1.20 the pack pays`);
    } finally { Battle.active = prev; }
  }

  // ---- 4pc Out Of Place: only somebody who HAS a hex can be out of it -
  {
    const { battle, units } = party(4);
    const caster = units.find((u) => u.def.id !== 'wren') || units[1];
    const prev = Battle.active;
    Battle.active = battle;
    try {
      // A hero seated ON their favoured hex, then moved off it.
      const foe = new Unit(HEROES.catherine, TEAM.ENEMY, { level: 30, stars: 4 });
      const slots = battle.enemySlots;
      foe.slot = slots.find((s) => s.position === foe.positional.position);
      battle.units.push(foe);
      foe.statusEffects.push({ kind: 'buff', stat: 'atk', mult: 1.01, turns: 9 });
      // Ratios again: wind's Crosswind rides the same channel.
      assert(foe.positionalActive(), 'the fixture did not seat them at home');
      const atHome = caster.damageDealtMult(foe, null);
      foe.slot = slots.find((s) => s.position !== foe.positional.position);
      assert(!foe.positionalActive(), 'the fixture did not displace them');
      const displaced = caster.damageDealtMult(foe, null);
      assert(Math.abs(displaced / atHome - 1.25) < 1e-9,
        `displaced ${displaced} over at-home ${atHome} is not the 1.25 the pack pays`);

      // A BOSS has no positional and can never be out of place, so it
      // reads exactly like an enemy standing at home.
      const boss = { positional: null, statusEffects: [{ kind: 'buff' }] };
      assert(Math.abs(caster.damageDealtMult(boss, null) - atHome) < 1e-9,
        'something with no favoured hex was called displaced');
    } finally { Battle.active = prev; }

    // Three do not carry it.
    const three = party(3);
    const foe3 = new Unit(HEROES.catherine, TEAM.ENEMY, { level: 30, stars: 4 });
    foe3.slot = three.battle.enemySlots.find(
      (s) => s.position !== foe3.positional.position);
    foe3.statusEffects.push({ kind: 'buff', stat: 'atk', mult: 1.01, turns: 9 });
    three.battle.units.push(foe3);
    Battle.active = three.battle;
    try {
      // Same ratio test one tier short: displaced must read the same as
      // a boss with no hex at all, because the tier is not held.
      const c3 = three.units[0];
      const noHex = { positional: null, statusEffects: [{ kind: 'buff' }] };
      assert(Math.abs(c3.damageDealtMult(foe3, null) -
        c3.damageDealtMult(noHex, null)) < 1e-9,
        'out of place paid at three Whisperchime');
    } finally { Battle.active = prev; }
  }
});

// The Gulldiggers fight wide. Their pack is paid per body a sweep
// catches, pays extra where a boarding party lands, and at the top
// MAKES the crowd bigger rather than hitting it harder.
test('Gulldigger sect pack: a storm, a boarding party, and a longer reach', () => {
  const gull = RACES.SECTS.gulldigger.members;

  const party = (n) => {
    const battle = new Battle();
    const units = [];
    for (let i = 0; i < n; i++) {
      const u = new Unit(HEROES[gull[i]], TEAM.PLAYER, { level: 30, stars: 3 });
      battle.placeUnit(u, i);
      units.push(u);
    }
    RACES.applyParty(units);
    return { battle, units };
  };

  // ---- 2pc Eye of the Storm: once per BODY, not once per cast ----
  {
    const { battle, units } = party(2);
    // Hallow owns the original hook; measure on a bird who does not.
    const caster = units.find((u) => u.def.id !== 'hallow') || units[1];
    const prev = Battle.active;
    Battle.active = battle;
    try {
      const foes = [1, 2, 4].map((i) =>
        roomy(place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, i), 400));
      foes.forEach((f) => { f.dodgeChance = () => 0; f.reflectChance = () => 0; });
      caster.turnMeter = 0;
      Abilities.execute({ id: 'probe_sweep', name: 'Probe Sweep', cooldown: 0,
        targeting: 'all-enemies', effects: [{ type: 'damage', mult: 0.4 }] },
        caster, foes[0], battle);
      // Three bodies struck, so three payments of 3%.
      const paid = caster.turnMeter / CONFIG.TURN_METER_MAX;
      assert(Math.abs(paid - 0.09) < 0.005,
        `a sweep over three paid ${(paid * 100).toFixed(1)}% of a bar, wanted 9%`);

      // A SINGLE-target hit pays nothing at all -- that is the point.
      caster.turnMeter = 0;
      Abilities.execute({ id: 'probe_jab', name: 'Probe Jab', cooldown: 0,
        targeting: 'enemy', effects: [{ type: 'damage', mult: 0.4 }] },
        caster, foes[0], battle);
      assert(caster.turnMeter === 0,
        `a single-target hit paid ${caster.turnMeter}`);
    } finally { Battle.active = prev; }
  }

  // ---- 3pc Gaff and Haul: a front hex, and only a front hex ----
  {
    const { battle, units } = party(3);
    const prev = Battle.active;
    Battle.active = battle;
    try {
      const front = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY,
        battle.enemySlots.findIndex((s) => s.position === POSITION.FRONT));
      const back = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY,
        battle.enemySlots.findIndex((s) => s.position === POSITION.BACK));
      const caster = units[0];
      const centre = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY,
        battle.enemySlots.findIndex((s) => s.position === POSITION.CENTER));
      const onFront = caster.damageDealtMult(front, null);
      const onBack = caster.damageDealtMult(back, null);
      const onCentre = caster.damageDealtMult(centre, null);
      assert(Math.abs(onFront / onBack - 1.20) < 1e-9,
        `front ${onFront} over back ${onBack} is not the 1.20 the pack pays`);
      // FRONT only, not "anywhere but the back". This is the same
      // distinction Long Reach turns on at 4pc: the centre bird a front
      // sweep drags in is still standing on a CENTRE hex, so the reach
      // widens the sweep without relabelling the field.
      assert(Math.abs(onCentre - onBack) < 1e-9,
        `a centre hex paid ${onCentre}, the same as a front rank`);
      // A BOSS spans every hex, the front one included, so it DOES pay.
      // This asserted the opposite for a while, off a stub with a null
      // slot: the boarding party read `target.slot.position` directly
      // and so quietly excluded the one enemy a player most wanted the
      // bonus against. A real Unit, not a stub -- the rule lives in
      // Unit.onHex now and a stub would not exercise it.
      const bossDef = Object.values(BOSSES)[0];
      const bossUnit = new Unit(bossDef, TEAM.ENEMY, { level: 30, stars: 5 });
      assert(bossUnit.isBoss, 'the fixture is not a boss');
      assert(bossUnit.onHex(POSITION.FRONT) && bossUnit.onHex(POSITION.BACK) &&
        bossUnit.onHex(POSITION.CENTER), 'a boss does not span every hex');
      assert(Math.abs(caster.damageDealtMult(bossUnit, null) - onFront) < 1e-9,
        'a boss was not billed as a front rank');
    } finally { Battle.active = prev; }
  }

  // ---- 4pc Long Reach: the sweep gets WIDER, not harder ----
  {
    const reachOf = (n) => {
      const { battle, units } = party(n);
      const prev = Battle.active;
      Battle.active = battle;
      try {
        // One enemy on a front hex, one on the centre.
        place(battle, DUMMIES.rat_brawler, TEAM.ENEMY,
          battle.enemySlots.findIndex((s) => s.position === POSITION.FRONT));
        place(battle, DUMMIES.rat_brawler, TEAM.ENEMY,
          battle.enemySlots.findIndex((s) => s.position === POSITION.CENTER));
        const caught = Abilities.resolveTargets(
          { targeting: 'front-enemies' }, units[0], null, battle);
        return caught.map((u) => u.slot.position).sort().join(',');
      } finally { Battle.active = prev; }
    };
    assert(reachOf(3) === 'front',
      `three Gulldiggers reached ${reachOf(3)} — the centre is not theirs yet`);
    assert(reachOf(4) === 'center,front',
      `four Gulldiggers reached ${reachOf(4)}, wanted the centre folded in`);
  }
});

// The third answer to the same job. Strix prevents, Balmor absorbs,
// Brannoc punishes -- and he is the only one of the three worth
// anything while the enemy is IGNORING him, which is the tank's real
// problem rather than the one tanks are usually built for.
test("Brannoc answers for what goes through him", () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const bran = place(battle, HEROES.brannoc, TEAM.PLAYER, 1);
    const mate = roomy(place(battle, HEROES.kiri, TEAM.PLAYER, 4), 200);
    const foe = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 400);
    foe.hookSources = () => [];
    mate.dodgeChance = () => 0; mate.reflectChance = () => 0;
    foe.dodgeChance = () => 0; foe.reflectChance = () => 0;

    // An ally taking a blow is answered.
    const real = Math.random;
    const before = foe.hp;
    Math.random = () => 0.99;
    try { Abilities.strike(foe, mate, 500, { dodge: false, reflect: false }); }
    finally { Math.random = real; }
    const answered = before - foe.hp;
    assert(answered > 0, 'an ally was struck and Brannoc did nothing');
    // At the printed size. NO elemental multiplier: Elements.mult is
    // applied inside applyEffect's damage case, not inside strike(), so
    // a counter thrown straight from a passive never gets element
    // advantage. That is true of every retaliation on the roster --
    // Carl's, Slick's, Toll's and Oak's all call strike() the same way
    // -- so it is the engine's existing rule rather than something this
    // bird does differently, and the expectation follows the rule.
    const want = Abilities.damageFormula(
      bran.effectiveStat('atk') * 0.40 * bran.damageDealtMult(foe, null),
      foe.effectiveStat('def'));
    assert(Math.abs(answered - want) <= 2,
      `the answer landed ${answered}, wanted ~${want}`);

    // His OWN hide is not the trigger -- that is Carl's and Oak's
    // mechanic, and the whole point of this one is that it pays while
    // the other side is going around him.
    const solo = foe.hp;
    bran.hp = bran.maxHp = 9e6;
    bran.dodgeChance = () => 0; bran.reflectChance = () => 0;
    Math.random = () => 0.99;
    try { Abilities.strike(foe, bran, 500, { dodge: false, reflect: false }); }
    finally { Math.random = real; }
    assert(foe.hp === solo,
      `being hit himself cost the attacker ${solo - foe.hp} -- this answers for ALLIES`);

    // Never for a blow his own side landed. Watch BRANNOC rather than
    // the enemy here: with the attacker-is-an-enemy guard gone the
    // answer aims at whoever swung, which for friendly fire is a
    // teammate -- and when he is the one who swung, himself. Checking
    // the foe's health cannot see any of that, which is how the first
    // draft of this assertion proved nothing.
    const friendly = foe.hp;
    const hisOwn = bran.hp;
    Math.random = () => 0.99;
    try { Abilities.strike(bran, mate, 500, { dodge: false, reflect: false }); }
    finally { Math.random = real; }
    assert(foe.hp === friendly, 'an ally hitting an ally set the answer off');
    assert(bran.hp === hisOwn,
      `Brannoc answered his own blow and took ${hisOwn - bran.hp} for it`);

    // And an answer cannot set off another answer: two Brannocs on one
    // field must not bounce blows off each other until the stack gives
    // out. Fired inside the engine's retaliation guard, so a second
    // one standing beside him changes nothing about the first.
    const twin = place(battle, HEROES.brannoc, TEAM.PLAYER, 2);
    const paired = foe.hp;
    Math.random = () => 0.99;
    try { Abilities.strike(foe, mate, 500, { dodge: false, reflect: false }); }
    finally { Math.random = real; }
    const two = paired - foe.hp;
    assert(two > 0 && two < answered * 3,
      `two Brannocs answered for ${two} against one's ${answered} -- the guard is not holding`);
    battle.units = battle.units.filter((u) => u !== twin);
  } finally { Battle.active = prev; }

  // Nine birds. The sect is finished, and this is the shape it was
  // being filled to from the first commit: one 1-star, two 2-stars,
  // three 3-stars, two 4-stars, one 5-star, every one of them wind.
  {
    const sect = RACES.SECTS.razorwings;
    assert(sect.members.length === 9,
      `the Razorwings hold ${sect.members.length}`);
    const have = {};
    for (const id of sect.members) {
      const h = HEROES[id];
      assert(h.element === 'wind', `${id} is ${h.element}, not wind`);
      have[h.rarity] = (have[h.rarity] || 0) + 1;
    }
    for (const [star, want] of Object.entries(sect.shape)) {
      assert((have[star] || 0) === want,
        `${have[star] || 0} at ${star}-star, the shape wants ${want}`);
    }
    // Every bird carries art of its own rather than a placeholder --
    // the whole sect was uploaded at once and every def has to point at
    // its own strip.
    const srcs = sect.members.map((id) => HEROES[id].sprite.strips.idle.src);
    assert(new Set(srcs).size === 9, 'two Razorwings share a sprite strip');
    assert(srcs.every((s) => s.includes('/razorwings/')),
      'a Razorwing is wearing somebody else\'s feathers');
  }
});

// The sect's other wall, and deliberately the opposite of the first.
// Strix prevents damage; Balmor prevents nothing and KEEPS it, then
// hands it back at somebody else's expense.
test("Balmor's bill: everything he was given, given back", () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    // Only a little roomy. The cap is a fraction of his POOL, so
    // inflating the pool inflates the cap out of reach of any beating
    // the test can hand out -- at 200x he would need thousands of
    // blows to fill a bill nobody could ever fill in a fight either.
    const balmor = roomy(place(battle, HEROES.balmor, TEAM.PLAYER, 1), 3);
    const foe = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 4000);
    foe.dodgeChance = () => 0; foe.reflectChance = () => 0;
    foe.hookSources = () => [];
    balmor.dodgeChance = () => 0; balmor.reflectChance = () => 0;

    // An empty bill is empty: nothing banked before anything lands.
    assert(!(balmor.pouch > 0), `the bill started holding ${balmor.pouch}`);

    // He keeps the whole of what he is given, not of what was thrown --
    // the hook reads what actually landed, after his own armour. The
    // blow is a real peer's swing rather than an invented number: a
    // 6000-raw hit takes a fifth of his pool at once, which no fight
    // does and which made the cap look like it bound on the first hit.
    const swing = new Unit(HEROES.tervan, TEAM.PLAYER, { level: 30, stars: 3 })
      .effectiveStat('atk') * 1.55;
    const real = Math.random;
    Math.random = () => 0.99;
    let landed = 0;
    try {
      const before = balmor.hp;
      Abilities.strike(foe, balmor, swing, { dodge: false, reflect: false });
      landed = before - balmor.hp;
    } finally { Math.random = real; }
    assert(landed > 0, 'the blow did not land at all');
    assert(Math.abs(balmor.pouch - landed) < 1e-6,
      `the bill holds ${balmor.pouch} off a ${landed} blow, wanted the whole of it`);

    // Capped against his POOL, not his ATK -- and the cap has to be
    // bigger than a single blow, or "keeps a share of every blow" is a
    // sentence about nothing. The first draft of this hero failed
    // exactly there: 250% of a tank's ATK was a fifth of one hit.
    const cap = balmor.maxHp * 0.125;
    assert(cap > landed,
      `the cap (${cap}) is smaller than one blow (${landed}) -- the bill fills instantly`);
    Math.random = () => 0.99;
    try {
      for (let i = 0; i < 200; i++) {
        balmor.hp = balmor.maxHp;
        Abilities.strike(foe, balmor, swing, { dodge: false, reflect: false });
      }
    } finally { Math.random = real; }
    assert(Math.abs(balmor.pouch - cap) < 1e-6,
      `a long beating filled the bill to ${balmor.pouch}, wanted the ${cap} cap`);

    // Tipping it spends the WHOLE bill and empties it.
    const held = balmor.pouch;
    const foeBefore = foe.hp;
    Math.random = () => 0.99;
    try { Abilities.execute(balmor.abilities[2].def, balmor, foe, battle); }
    finally { Math.random = real; }
    assert(balmor.pouch === 0, `the bill still holds ${balmor.pouch} after tipping`);
    const dealt = foeBefore - foe.hp;
    assert(dealt > 0, 'a full bill dealt nothing');
    // Thrown as an ordinary blow, so the DEF curve answers it: what
    // lands is what the formula makes of what was held.
    const want = Abilities.damageFormula(held * balmor.damageDealtMult(foe, null),
      foe.effectiveStat('def'));
    assert(Math.abs(dealt - want) <= 2,
      `the bill landed ${dealt}, wanted ~${want} through the curve`);

    // And tipping an EMPTY bill is a no-op rather than a free hit.
    const emptyBefore = foe.hp;
    Math.random = () => 0.99;
    try { Abilities.execute(balmor.abilities[2].def, balmor, foe, battle); }
    finally { Math.random = real; }
    assert(foe.hp === emptyBefore,
      `an empty bill still dealt ${emptyBefore - foe.hp} damage`);

    // The bill fills from blows he TAKES, not from blows he throws.
    balmor.pouch = 0;
    Math.random = () => 0.99;
    try { Abilities.execute(balmor.abilities[0].def, balmor, foe, battle); }
    finally { Math.random = real; }
    assert(!(balmor.pouch > 0),
      `hitting somebody put ${balmor.pouch} in the bill -- it fills from what he is given`);
  } finally { Battle.active = prev; }

  // The defect the archetype bench found, pinned so it cannot come back.
  // The bill has to fill in about a fight AT EVERY LEVEL. It did not:
  // half a blow into a quarter of his pool wanted 13 hits at level 30
  // and 116 at level 100, because his DEF grows with his pool and each
  // blow is a smaller share of it the further he is invested. It read
  // fine at the level everything else was tested at and was dead at the
  // level the game is actually played at.
  for (const level of [30, 100]) {
    const b3 = makeBattle();
    const prev3 = Battle.active;
    Battle.active = b3;
    try {
      const bal = new Unit(HEROES.balmor, TEAM.PLAYER, { level, stars: 3 });
      bal.slot = b3.playerSlots[1];
      bal.dodgeChance = () => 0; bal.reflectChance = () => 0;
      b3.units.push(bal);
      const hitter = new Unit(HEROES.tervan, TEAM.PLAYER, { level, stars: 3 });
      const foe2 = new Unit(DUMMIES.rat_knight, TEAM.ENEMY, { level, stars: 3 });
      foe2.slot = b3.enemySlots[0];
      foe2.hookSources = () => [];
      b3.units.push(foe2);
      const raw = hitter.effectiveStat('atk') * 1.55;
      const cap2 = bal.maxHp * 0.125;
      const real2 = Math.random;
      let blows = 0;
      Math.random = () => 0.99;
      try {
        while ((bal.pouch || 0) < cap2 && blows < 500) {
          bal.hp = bal.maxHp;
          Abilities.strike(foe2, bal, raw, { dodge: false, reflect: false });
          blows++;
        }
      } finally { Math.random = real2; }
      assert(blows <= 40,
        `at level ${level} the bill wants ${blows} blows to fill -- no fight is that ` +
        'long, so the mechanic is dead there');
    } finally { Battle.active = prev3; }
  }

  // The tension the kit is built on: Broad Shadow keeps him alive and
  // starves the bill, because damage he does not take is damage he does
  // not get to keep. Worth pinning -- if the two ever stopped pulling
  // against each other the hero would be strictly better, not
  // interesting.
  {
    const b2 = makeBattle();
    const prev2 = Battle.active;
    Battle.active = b2;
    try {
      const bank = (warded) => {
        const bal = roomy(place(b2, HEROES.balmor, TEAM.PLAYER, 1), 3);
        bal.dodgeChance = () => 0; bal.reflectChance = () => 0;
        const foe = roomy(place(b2, DUMMIES.rat_knight, TEAM.ENEMY, 1), 400);
        foe.hookSources = () => [];
        if (warded) {
          bal.addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.85,
            turns: 2, source: bal });
        }
        // A real peer's swing, not an invented figure: a blow big enough
        // to cap the bill on its own reads the same warded or bare and
        // the comparison says nothing.
        const swing = new Unit(HEROES.tervan, TEAM.PLAYER, { level: 30, stars: 3 })
          .effectiveStat('atk') * 1.55;
        const real = Math.random;
        Math.random = () => 0.99;
        try { Abilities.strike(foe, bal, swing, { dodge: false, reflect: false }); }
        finally { Math.random = real; }
        b2.units = b2.units.filter((u) => u !== bal && u !== foe);
        return bal.pouch;
      };
      const open = bank(false), covered = bank(true);
      assert(covered < open,
        `warded he banked ${covered} against ${open} bare -- the shadow is meant to ` +
        'cost him the bill');
    } finally { Battle.active = prev2; }
  }
});

// The flight's apothecary, and the answer to a problem the Razorwings
// make for themselves: a sect built to take more turns than anybody
// else runs into its own COOLDOWNS more often than anybody else.
test("Mendral's Standing Dose: a turn back, where the wait is worst", () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const mendral = place(battle, HEROES.mendral, TEAM.PLAYER, 0);
    const a = place(battle, HEROES.cirrus, TEAM.PLAYER, 1);
    const b = place(battle, HEROES.nehru, TEAM.PLAYER, 2);
    const foe = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    for (const ab of foe.abilities || []) ab.cooldownRemaining = 6;

    const cds = (u) => u.abilities.map((x) => x.cooldownRemaining);
    const setCds = (u, ...v) => u.abilities.forEach((x, i) => { x.cooldownRemaining = v[i] || 0; });

    // Longest first: the ally waiting worst is the one paid, not the
    // nearest to ready and not simply the first in the list.
    setCds(a, 1, 2, 5);
    setCds(b, 1, 3, 2);
    mendral.startTurn(battle);
    assert(cds(a)[2] === 4, `the longest wait went ${cds(a)[2]}, wanted 4`);
    assert(cds(b).join() === '1,3,2', `a shorter wait was paid instead: ${cds(b).join()}`);

    // One turn, one ability -- not a turn off everything.
    assert(cds(a).join() === '1,2,4', `the dose spread across the kit: ${cds(a).join()}`);

    // It crosses to whichever ALLY is worst off, wherever they stand.
    setCds(a, 1, 1, 1);
    setCds(b, 9, 0, 0);
    mendral.startTurn(battle);
    assert(cds(b)[0] === 8, `the worst wait on another bird went ${cds(b)[0]}, wanted 8`);

    // Never the enemy's, however long they are sitting there.
    setCds(a, 0, 0, 0); setCds(b, 0, 0, 0);
    mendral.startTurn(battle);
    assert((foe.abilities || []).every((ab) => ab.cooldownRemaining === 6),
      'Mendral handed the other side their skills back');

    // Nothing to do is not a crash: a party with everything ready is
    // the ordinary case for the first turn of a fight.
    mendral.startTurn(battle);
    assert(cds(a).join() === '0,0,0', 'a ready party had a cooldown driven negative');
  } finally { Battle.active = prev; }

  // Green Vial is the deep, narrow one: Evelune hands the whole room a
  // turn back, Mendral hands one bird two.
  {
    const b2 = makeBattle();
    const prev2 = Battle.active;
    Battle.active = b2;
    try {
      const mendral = place(b2, HEROES.mendral, TEAM.PLAYER, 0);
      const mate = place(b2, HEROES.nehru, TEAM.PLAYER, 1);
      const other = place(b2, HEROES.cirrus, TEAM.PLAYER, 2);
      mate.abilities.forEach((x) => { x.cooldownRemaining = 5; });
      other.abilities.forEach((x) => { x.cooldownRemaining = 5; });
      Abilities.execute(mendral.abilities[1].def, mendral, mate, b2);
      assert(mate.abilities.every((x) => x.cooldownRemaining === 3),
        `the vial moved them to ${mate.abilities.map((x) => x.cooldownRemaining).join()}`);
      // One bird, not the room.
      assert(other.abilities.every((x) => x.cooldownRemaining === 5),
        'the vial spilled onto the whole party');
      // A skill already ready is left alone rather than driven negative.
      mate.abilities[0].cooldownRemaining = 0;
      Abilities.execute(mendral.abilities[1].def, mendral, mate, b2);
      assert(mate.abilities[0].cooldownRemaining === 0,
        'a ready skill was driven below zero');
    } finally { Battle.active = prev2; }
  }
});

// The still thing in a sect that never stops. Her haze answers the one
// thing that beats the whole order: every Razorwing tier is priced off
// outrunning the other side, so the counter to all of it is a speed
// hex -- and a bird carrying one of Calima's wards cannot be given one.
test("Calima's Slack Water: nothing settles on still water", () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const calima = place(battle, HEROES.calima, TEAM.PLAYER, 0);
    const mate = () => {
      const u = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 4);
      u.hookSources = () => [];
      return u;
    };
    const slow = (u, from) => u.addStatusEffect(
      { kind: 'debuff', stat: 'speed', mult: 0.75, turns: 2, source: from });
    const slowed = (u) => u.statusEffects.some(
      (fx) => fx.kind === 'debuff' && fx.stat === 'speed');

    // Unwarded, a hex lands exactly as it always did.
    const bare = mate();
    slow(bare, calima);
    assert(slowed(bare), 'a speed hex failed to land on an unwarded ally');

    // Warded by Calima, it does not.
    const kept = mate();
    Abilities.execute(calima.abilities[0].def, calima, kept, battle);
    assert(kept.shieldTotal() > 0, 'Haze raised no ward at all');
    slow(kept, calima);
    assert(!slowed(kept), 'a speed hex settled on a bird carrying the haze');

    // Only SPEED. This is the answer to the one thing that beats the
    // sect, not a general hex immunity -- an armour break still lands.
    kept.addStatusEffect({ kind: 'debuff', stat: 'def', mult: 0.75, turns: 2 });
    assert(kept.statusEffects.some((fx) => fx.stat === 'def'),
      'the haze turned into a blanket immunity to every hex');
    // ...and a speed BUFF is not a hex and must still land.
    kept.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.2, turns: 2 });
    assert(kept.statusEffects.some((fx) => fx.kind === 'buff' && fx.stat === 'speed'),
      'the haze refused a speed blessing as though it were a hex');

    // It runs out with the ward rather than with her presence: spend
    // the pool and the next hex lands. Calima is still standing.
    kept.statusEffects = kept.statusEffects.filter((fx) => fx.stat !== 'def');
    kept.absorb(kept.shieldTotal());
    assert(kept.shieldTotal() === 0, 'the ward survived being spent');
    slow(kept, calima);
    assert(slowed(kept),
      'a spent ward still guarded -- the haze is tied to the ward, not to Calima');

    // An EMPTY ward guards nothing either. Spending a ward to zero
    // prunes it outright (Unit.absorb drops the plate), so that path
    // alone never reaches the check -- but a ward can be raised worth
    // nothing, and one worth nothing is not cover.
    const hollow = mate();
    hollow.addStatusEffect({ kind: 'shield', amount: 0, turns: 3, source: calima });
    slow(hollow, calima);
    assert(slowed(hollow), 'a ward worth nothing still turned a hex aside');

    // And it is HER ward that does it, not any ward. A bubble somebody
    // else put up buys nothing.
    const other = mate();
    other.addStatusEffect({ kind: 'shield', amount: 500, turns: 3, source: bare });
    slow(other, calima);
    assert(slowed(other),
      "somebody else's ward guarded against a slow -- the hook is Calima's");
  } finally { Battle.active = prev; }
});

// The sect's wall, and the answer to the question the Razorwings had
// not had to face: what a TANK does in an order built on being faster.
// He tanks on the sect's own currency -- the same speed gap every tier
// is paid off, read from the other side of the field.
test("Strix shelters the flight from anything he can outrun", () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const strix = place(battle, HEROES.strix, TEAM.PLAYER, 1);
    const mate = roomy(place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 4), 4000);
    mate.dodgeChance = () => 0; mate.reflectChance = () => 0;
    mate.hookSources = () => [];
    const mine = strix.effectiveStat('speed');

    const swing = (speed) => {
      const foe = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
      foe.speed = speed;
      foe.hookSources = () => [];
      mate.hp = mate.maxHp;
      const real = Math.random;
      Math.random = () => 0.99;           // no crit, no dodge, no reflect
      try { Abilities.strike(foe, mate, 4000, { dodge: false, reflect: false }); }
      finally { Math.random = real; }
      battle.units = battle.units.filter((u) => u !== foe);
      return mate.maxHp - mate.hp;
    };

    const slowHit = swing(mine - 20);
    const fastHit = swing(mine + 20);
    assert(slowHit < fastHit,
      `a slow swing landed ${slowHit} and a fast one ${fastHit} -- the shelter did nothing`);
    assert(Math.abs(slowHit / fastHit - 0.90) < 0.01,
      `the shelter cut the blow to ${(slowHit / fastHit).toFixed(3)}, wanted 0.90`);
    // Something faster than him goes STRAIGHT THROUGH. That is the
    // price of tanking on a comparison rather than on armour, and
    // without this the passive is just a flat 10% ward.
    const dead = swing(mine);
    assert(Math.abs(dead - fastHit) <= 1,
      'an enemy of exactly equal speed was still sheltered -- strictly faster, or nothing');

    // It is COVER, not a ward: the prevention belongs to Strix, so the
    // meter credits him rather than losing it inside the defences of
    // the bird who was not hit.
    Meter.resetSession();
    swing(mine - 20);
    const mit = Meter.rows('mitigated', 'battle');
    const his = (mit.list.find((r) => r.id === 'strix') || { value: 0 }).value;
    assert(his > 0, 'Strix was credited nothing for the damage he prevented');

    // And he shelters the FLIGHT, not himself: his own hide is his own
    // business, so the cover must not fire when he is the one hit.
    Meter.resetSession();
    const foe = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    foe.speed = mine - 20;
    foe.hookSources = () => [];
    strix.hp = strix.maxHp = 9e6;
    strix.dodgeChance = () => 0; strix.reflectChance = () => 0;
    const real = Math.random;
    Math.random = () => 0.99;
    try { Abilities.strike(foe, strix, 4000, { dodge: false, reflect: false }); }
    finally { Math.random = real; }
    const self = Meter.rows('mitigated', 'battle').list
      .find((r) => r.id === 'strix');
    assert(!self || self.value === 0,
      'Strix sheltered himself -- cover is for the ally standing behind him');
    battle.units = battle.units.filter((u) => u !== foe);
  } finally { Battle.active = prev; }

  // Headwind is the ordinary speed hex, cast wide. A tank cooldown that
  // is also the sect's engine: everything it slows is something every
  // Razorwing tier now gets paid more for standing in front of.
  {
    const b2 = makeBattle();
    const prev2 = Battle.active;
    Battle.active = b2;
    try {
      const strix = place(b2, HEROES.strix, TEAM.PLAYER, 1);
      maxSkill(strix, 1);
      const foes = [1, 2, 4].map((i) => {
        const f = roomy(place(b2, DUMMIES.rat_knight, TEAM.ENEMY, i), 400);
        f.hookSources = () => [];
        return f;
      });
      const was = foes.map((f) => f.effectiveStat('speed'));
      const real = Math.random;
      Math.random = () => 0;
      try { Abilities.execute(strix.abilities[1].def, strix, foes[0], b2); }
      finally { Math.random = real; }
      foes.forEach((f, i) => {
        assert(f.effectiveStat('speed') < was[i],
          `${f.name} kept its full ${was[i]} speed through a Headwind`);
      });
      // The ordinary speed plate, not a new one invented to mean the
      // same thing -- a player reads one icon and knows what it is.
      const hex = foes[0].statusEffects.find((fx) => fx.kind === 'debuff');
      assert(hex && hex.stat === 'speed',
        `Headwind laid a '${hex && hex.stat}' plate instead of the speed one`);
    } finally { Battle.active = prev2; }
  }
});

// The sect's blesser. Everything else in the Razorwings turns speed
// into damage on the swing; Kiri turns it into ATK before the swing,
// which is the only place in the sect where being fast is worth
// something to somebody ELSE.
test("Kiri's Hover: a blessing worth what the wing receiving it is", () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const kiri = place(battle, HEROES.kiri, TEAM.PLAYER, 0);
    // Read off the RECEIVER, never off her: a mate at a given speed has
    // to read the same whatever Kiri herself is doing.
    const mate = (speed) => {
      const u = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 4);
      u.hookSources = () => [];
      u.speed = speed;
      return u;
    };
    const blessed = (u) => {
      Abilities.execute(kiri.abilities[0].def, kiri, u, battle);
      const fx = u.statusEffects.find((f) => f.kind === 'buff' && f.stat === 'atk');
      u.statusEffects = [];
      battle.units = battle.units.filter((x) => x !== u);
      return fx ? fx.mult : 0;
    };

    // Base blessing is 1.15. Every 10 SPD over 100 deepens it 5%, and
    // the deepening moves the multiplier AWAY from neutral, so the
    // expected figure is 1.15 + the rungs rather than a percentage of it.
    const slow = blessed(mate(100));
    assert(Math.abs(slow - 1.15) < 1e-9,
      `a 100-speed wing was blessed at ${slow}, wanted the flat 1.15`);
    assert(Math.abs(blessed(mate(130)) - 1.30) < 1e-9,
      `a 130-speed wing was blessed at ${blessed(mate(130))}, wanted 1.15 + 3 rungs`);
    // Stepped, not continuous: 9 points over is not yet a rung.
    assert(Math.abs(blessed(mate(109)) - 1.15) < 1e-9,
      'nine points over 100 bought a rung it had not earned');
    // Capped at five rungs however fast the wing is.
    assert(Math.abs(blessed(mate(400)) - 1.40) < 1e-9,
      `a 400-speed wing was blessed at ${blessed(mate(400))}, wanted the +25% cap`);
    // Slower than 100 costs nothing -- it never runs backwards.
    assert(Math.abs(blessed(mate(60)) - 1.15) < 1e-9,
      'a slow wing was blessed for LESS than the printed figure');

    // Her own speed is not part of it. She is the fastest support in
    // the game and it must not inflate what she hands out.
    const fast = blessed(mate(120));
    kiri.speed = 40;
    assert(Math.abs(blessed(mate(120)) - fast) < 1e-9,
      "Kiri's own speed changed what her blessing was worth");
  } finally { Battle.active = prev; }

  // Four birds: the LAST tier can be fielded. Rip Current pays the
  // Razorwing who lands a kill, and this is the first time the count
  // has been high enough to prove it through applyParty rather than by
  // handing the hook over directly.
  {
    const b4 = makeBattle();
    const birds = ['tervan', 'nehru', 'cirrus', 'kiri'].map((id, i) => {
      const u = new Unit(HEROES[id], TEAM.PLAYER, { level: 30, stars: 3 });
      u.slot = b4.playerSlots[i];
      b4.units.push(u);
      return u;
    });
    RACES.applyParty(birds);
    const killer = birds[0];
    const bystander = birds[1];
    killer.turnMeter = 0; bystander.turnMeter = 0;
    const doomed = new Unit(DUMMIES.rat_archer, TEAM.ENEMY, { level: 30, stars: 3 });
    doomed.slot = b4.enemySlots[0];
    b4.units.push(doomed);
    doomed.hp = 1;
    const prev4 = Battle.active;
    Battle.active = b4;
    try { doomed.takeDamage(9e9, killer); } finally { Battle.active = prev4; }
    assert(Math.abs(killer.turnMeter - CONFIG.TURN_METER_MAX * 0.25) < 1e-6,
      `four fielded birds paid the killer ${killer.turnMeter}, wanted a quarter bar`);
    assert(bystander.turnMeter === 0,
      `a bystander was paid ${bystander.turnMeter} for somebody else's kill`);

    // All three tiers standing at once, which is the whole pack: the
    // damage ceiling and the meter payout are not alternatives.
    const foe = new Unit(DUMMIES.rat_knight, TEAM.ENEMY, { level: 30, stars: 3 });
    foe.slot = b4.enemySlots[1];
    const mine = killer.effectiveStat('speed');
    foe.speed = mine;
    const level = killer.damageDealtMult(foe, null);
    foe.speed = mine - 60;
    assert(Math.abs(killer.damageDealtMult(foe, null) / level - 1.625) < 1e-9,
      'the damage tiers stopped paying once the fourth bird landed');
  }
});

// The sect's sweeper. Tervan spends a speed lead as armour blindness
// and Nehru manufactures the lead by slowing what he throws through a
// gate; Cirrus takes THEIRS instead. The action bar is the one resource
// the sect cares about that none of its damage tiers touch, which is
// the whole reason his passive lives on that channel and not on the
// damage one the pack already multiplies into twice.
test("Cirrus's kit: the sweeps, and a bar knocked backwards", () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const cirrus = place(battle, HEROES.cirrus, TEAM.PLAYER, 0);
    cirrus.slot = battle.playerSlots.find((sl) => sl.position === POSITION.BACK);
    const foes = [1, 2, 4].map((i) => {
      const f = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, i), 4000);
      f.dodgeChance = () => 0; f.reflectChance = () => 0;
      f.hookSources = () => [];
      return f;
    });

    // ---- Backdraft is on the METER channel, not the damage one ----
    assert(Math.abs(cirrus.apDrainChance() - 0.20) < 1e-9,
      `Backdraft reads ${cirrus.apDrainChance()}, wanted 0.20`);
    const hooks = HEROES.cirrus.passive.hooks || {};
    assert(!hooks.damageDealtMult,
      'Cirrus is paying into damageDealtMult, which Overtake and Terminal ' +
      'Velocity already multiply into');

    // ---- the drain lands, once per body a sweep caught ----
    {
      for (const f of foes) f.turnMeter = CONFIG.TURN_METER_MAX;
      const real = Math.random;
      Math.random = () => 0;              // every gate opens
      try { Abilities.execute(cirrus.abilities[1].def, cirrus, foes[0], battle); }
      finally { Math.random = real; }
      const knocked = foes.filter((f) => f.turnMeter < CONFIG.TURN_METER_MAX);
      assert(knocked.length === foes.length,
        `a sweep over ${foes.length} bodies knocked ${knocked.length} bars back`);
      // 20% of a full bar, off each of them.
      for (const f of knocked) {
        assert(Math.abs(f.turnMeter - CONFIG.TURN_METER_MAX * 0.80) < 1e-6,
          `a drained bar sits at ${f.turnMeter}, wanted 80% of full`);
      }
    }

    // ---- and it is a CHANCE, not a certainty ----
    {
      for (const f of foes) f.turnMeter = CONFIG.TURN_METER_MAX;
      const real = Math.random;
      Math.random = () => 0.99;           // every gate fails
      try { Abilities.execute(cirrus.abilities[1].def, cirrus, foes[0], battle); }
      finally { Math.random = real; }
      assert(foes.every((f) => f.turnMeter === CONFIG.TURN_METER_MAX),
        'the drain landed on a losing roll -- it is meant to be a 20% gate');
    }

    // ---- Stormglass reads the CAST, not the aim ----
    {
      const sweep = cirrus.damageDealtMult(foes[0], cirrus.abilities[1].def);
      const single = cirrus.damageDealtMult(foes[0], cirrus.abilities[0].def);
      assert(Math.abs(sweep / single - 1.15) < 1e-9,
        `his hex paid ${(sweep / single).toFixed(3)} on a team sweep, wanted 1.15`);
      // Two of his three skills catch the whole field, which is the
      // reason he wears this hex at all.
      const wide = HEROES.cirrus.abilities
        .filter((a) => a.targeting === 'all-enemies').length;
      assert(wide === 2, `${wide} of his skills catch the field, wanted 2`);
    }
  } finally { Battle.active = prev; }

  // Three birds: the 3pc can be FIELDED for the first time. Terminal
  // Velocity scales with the size of the gap where Overtake only asks
  // whether there is one, so the pair is measured at two gap sizes --
  // a flat tier cannot tell them apart and would fail here.
  {
    const b3 = makeBattle();
    const birds = ['tervan', 'nehru', 'cirrus'].map((id, i) => {
      const u = new Unit(HEROES[id], TEAM.PLAYER, { level: 30, stars: 3 });
      u.slot = b3.playerSlots[i];
      b3.units.push(u);
      return u;
    });
    RACES.applyParty(birds);
    const foe = new Unit(DUMMIES.rat_knight, TEAM.ENEMY, { level: 30, stars: 3 });
    foe.slot = b3.enemySlots[0];
    const bird = birds[2];
    const mine = bird.effectiveStat('speed');
    const at = (gap) => { foe.speed = mine - gap; return bird.damageDealtMult(foe, null); };

    const level = at(0);
    // 20 points: Overtake's flat 1.25 and Terminal Velocity's 1.10.
    assert(Math.abs(at(20) / level - 1.25 * 1.10) < 1e-9,
      `three birds at a 20-point lead paid ${(at(20) / level).toFixed(4)}`);
    // 60+: Terminal Velocity at its cap, and the sect at its ceiling.
    assert(Math.abs(at(60) / level - 1.625) < 1e-9,
      `three birds at a 60-point lead paid ${(at(60) / level).toFixed(4)}, wanted 1.625`);
    assert(Math.abs(at(200) / level - 1.625) < 1e-9,
      'the cap stopped holding once the tier was actually fielded');

    // Three is not four: Rip Current must not be paying yet.
    const killer = birds[0];
    killer.turnMeter = 0;
    const doomed = new Unit(DUMMIES.rat_archer, TEAM.ENEMY, { level: 30, stars: 3 });
    doomed.slot = b3.enemySlots[1];
    b3.units.push(doomed);
    doomed.hp = 1;
    const prev3 = Battle.active;
    Battle.active = b3;
    try { doomed.takeDamage(9e9, killer); } finally { Battle.active = prev3; }
    assert(killer.turnMeter === 0,
      `three birds paid ${killer.turnMeter} meter for a kill -- the 4pc fired early`);
  }
});

// The Razorwings' 5-star. His job is not to move people -- Wren and
// Tumble already do that, and both are Whisperchime -- it is to make
// what he moves SLOW, which is the one thing the sect's own tiers are
// paid to stand in front of.
test("Nehru's kit: the gate, the reeling, and the far side of the field", () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const front = battle.enemySlots.filter((sl) => sl.position === POSITION.FRONT);
    const back = battle.enemySlots.filter((sl) => sl.position === POSITION.BACK);
    const at = (slot, def = DUMMIES.rat_knight) => {
      const u = new Unit(def, TEAM.ENEMY, { level: 30, stars: 3 });
      u.slot = slot;
      u.hp = u.maxHp = 9e6;
      u.dodgeChance = () => 0; u.reflectChance = () => 0;
      u.hookSources = () => [];
      battle.units.push(u);
      return u;
    };
    const nehru = place(battle, HEROES.nehru, TEAM.PLAYER, 0);
    // His own back hex, so Far Gate is live and can be accounted for.
    nehru.slot = battle.playerSlots.find((sl) => sl.position === POSITION.BACK);
    maxSkill(nehru, 1);

    // ---- Waygate: through the hole, and out of it dizzy ----
    {
      // A front-rank fighter and the one standing level behind them.
      const mark = at(front[0]);
      const partner = at(back.sort((a, b) =>
        Math.abs(a.y - front[0].y) - Math.abs(b.y - front[0].y))[0]);
      const wasSpeed = mark.effectiveStat('speed');
      const real = Math.random;
      Math.random = () => 0;               // every gate rolls open
      try { Abilities.execute(nehru.abilities[1].def, nehru, mark, battle); }
      finally { Math.random = real; }

      assert(mark.slot.position === POSITION.BACK,
        `the gate left the mark on a ${mark.slot.position} hex`);
      assert(partner.slot.position === POSITION.FRONT,
        `the fighter behind them stayed on a ${partner.slot.position} hex`);
      // Both halves of the link repaired, or something on the board is
      // standing in a hex that thinks it holds somebody else.
      assert(mark.slot.unit === mark && partner.slot.unit === partner,
        'a hex and its occupant disagree after the swap');

      // And the half the sect actually cares about.
      const hex = mark.statusEffects.find(
        (fx) => fx.kind === 'debuff' && fx.stat === 'speed');
      assert(hex, 'nobody came out of the gate reeling');
      assert(mark.effectiveStat('speed') < wasSpeed,
        `the mark left the gate at ${mark.effectiveStat('speed')} of ${wasSpeed}`);
      battle.units = battle.units.filter((u) => u !== mark && u !== partner);
    }

    // ---- Vanishing Point: 50% more into the back of the field ----
    {
      const swing = (slot) => {
        const f = at(slot);
        const before = f.hp;
        const real = Math.random;
        Math.random = () => 0.99;          // no crit in the reading
        try { Abilities.execute(nehru.abilities[2].def, nehru, f, battle); }
        finally { Math.random = real; }
        battle.units = battle.units.filter((u) => u !== f);
        return before - f.hp;
      };
      const deep = swing(back[0]);
      const near = swing(front[0]);
      // 1.5 from the skill and 1.25 from Far Gate, which reads the same
      // hex: his finisher and his own hex want the same thing, and the
      // ratio is the product of the two rather than either alone.
      const want = 1.5 * 1.25;
      assert(Math.abs(deep / near - want) < 0.02,
        `the far side paid ${(deep / near).toFixed(3)}, wanted ${want}`);
    }

    // ---- Displacement: every hit slows, and it is CONTESTED ----
    {
      const soft = at(front[0]);
      const before = soft.effectiveStat('speed');
      nehru.dealt(500, soft);
      assert(soft.effectiveStat('speed') < before,
        'a landed hit left the victim at full speed');

      // A boss's resistance is exactly what a free party-wide speed cut
      // would walk straight through, so the rider goes through the same
      // contest every hex does. Chance floors at 15%, so the roll is
      // pinned rather than the outcome assumed.
      const tough = at(back[0]);
      tough.gearResistance = 0.70;
      const real = Math.random;
      Math.random = () => 0.99;
      try { nehru.dealt(500, tough); } finally { Math.random = real; }
      assert(!tough.statusEffects.some(
        (fx) => fx.kind === 'debuff' && fx.stat === 'speed'),
        'the slow walked through a 0.85 resistance without rolling for it');

      // ...and lands on the same body when the roll goes the other way.
      Math.random = () => 0;
      try { nehru.dealt(500, tough); } finally { Math.random = real; }
      assert(tough.statusEffects.some(
        (fx) => fx.kind === 'debuff' && fx.stat === 'speed'),
        'the slow could not land even on a winning roll');

      // Never on his own side.
      const mate = place(battle, HEROES.tervan, TEAM.PLAYER, 1);
      Math.random = () => 0;
      try { nehru.dealt(500, mate); } finally { Math.random = real; }
      assert(!mate.statusEffects.some(
        (fx) => fx.kind === 'debuff' && fx.stat === 'speed'),
        'Nehru slowed his own ally');
    }
  } finally { Battle.active = prev; }

  // The sect is two birds deep now, so its FIRST tier can actually be
  // fielded -- and this is the wiring the hook tests below cannot reach:
  // membership counted, threshold met, hooks handed to real units.
  {
    const b2 = makeBattle();
    const birds = ['tervan', 'nehru'].map((id, i) => {
      const u = new Unit(HEROES[id], TEAM.PLAYER, { level: 30, stars: 3 });
      u.slot = b2.playerSlots[i];
      b2.units.push(u);
      return u;
    });
    RACES.applyParty(birds);
    const foe = new Unit(DUMMIES.rat_knight, TEAM.ENEMY, { level: 30, stars: 3 });
    foe.slot = b2.enemySlots[0];
    const mine = birds[1].effectiveStat('speed');

    foe.speed = mine - 10;
    const over = birds[1].damageDealtMult(foe, null);
    foe.speed = mine + 10;
    const under = birds[1].damageDealtMult(foe, null);
    assert(Math.abs(over / under - 1.25) < 1e-9,
      `two fielded Razorwings paid ${(over / under).toFixed(3)} for outrunning, wanted 1.25`);

    // Two is the 2pc and ONLY the 2pc: Terminal Velocity needs three,
    // so the gap must not yet change what the ratio is worth.
    foe.speed = mine - 200;
    const miles = birds[1].damageDealtMult(foe, null);
    assert(Math.abs(miles - over) < 1e-9,
      'the size of the gap paid out at two birds -- the 3pc fired early');
  }
});

// The brood's shield, and a tank whose OUTPUT is healing. Four passives
// on the roster answer being struck and not one of them turns it into a
// mend, which is the gap he fills -- and it welds the sect's third
// pillar to the one job that guarantees a steady supply of it.
test("Durn: what the shield catches, the brood gets back", () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const durn = roomy(place(battle, HEROES.durn, TEAM.PLAYER, 1), 5);
    durn.dodgeChance = () => 0; durn.reflectChance = () => 0;
    const foe = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    foe.hookSources = () => [];
    const mate = (frac, slot) => {
      const u = roomy(place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, slot), 20);
      u.hookSources = () => [];
      u.hp = Math.round(u.maxHp * frac);
      return u;
    };
    const hit = () => {
      const before = durn.hp;
      const real = Math.random;
      Math.random = () => 0.99;
      try { Abilities.strike(foe, durn, 4000, { dodge: false, reflect: false }); }
      finally { Math.random = real; }
      return before - durn.hp;
    };

    // The WORST-off ally is the one mended, not the nearest or the
    // first in the list.
    const bad = mate(0.2, 4);
    const ok = mate(0.8, 5);
    const badBefore = bad.hp, okBefore = ok.hp;
    const landed = hit();
    assert(landed > 0, 'the blow did not land');
    assert(bad.hp > badBefore, 'the worst-off ally was not mended');
    assert(ok.hp === okBefore,
      `a healthier ally was mended ${ok.hp - okBefore} as well -- it should be one bird`);
    assert(Math.abs((bad.hp - badBefore) - Math.round(landed * 0.15)) <= 1,
      `the shield paid ${bad.hp - badBefore} off a ${landed} blow, wanted 15%`);

    // NEVER himself. A tank who mends his own hide off being hit is a
    // self-sustain engine; this is a conversion the party spends.
    //
    // Measured on the LEDGER, not on his health. Comparing his HP
    // before and after his own blow cannot see this: the mend happens
    // inside the strike, so a self-heal nets straight out of the same
    // subtraction and the assertion becomes a tautology that passes
    // whatever the hook does. It did, and the sabotage proved it.
    // Half, not a sliver: at 5% he simply DIES to the test's own blow,
    // struck() never fires, and both the real hook and a sabotaged one
    // read zero. A hero has to survive the hit to answer it.
    Meter.resetSession();
    durn.hp = Math.round(durn.maxHp * 0.5);    // hurt, and the worst off
    bad.hp = bad.maxHp; ok.hp = ok.maxHp;      // and nobody else is hurt
    hit();
    assert(durn.alive, 'the fixture killed Durn before he could answer');
    const anyMend = Meter.rows('healing', 'battle').total;
    assert(anyMend === 0,
      `the shield mended ${anyMend} with nobody hurt but Durn himself`);

    // Nobody hurt is nobody to pay: no crash, no wasted heal.
    assert(bad.hp === bad.maxHp && ok.hp === ok.maxHp,
      'a full party was topped up past full');

    // The credit is HIS, so the meter reads it as healing he did rather
    // than losing it inside whoever was standing there.
    Meter.resetSession();
    durn.hp = durn.maxHp;
    bad.hp = Math.round(bad.maxHp * 0.3);
    hit();
    const row = Meter.rows('healing', 'battle').list.find((r) => r.id === 'durn');
    assert(row && row.value > 0, 'Durn was credited nothing for the healing he caused');
  } finally { Battle.active = prev; }

  // Shield Hand is priced off DEF, which is the point of a
  // shieldbearer: the stat he stacks feeds both halves of him. Measured
  // as damage rather than read off the def, so a silent switch back to
  // ATK scaling shows up as the number moving.
  {
    const b2 = makeBattle();
    const prev2 = Battle.active;
    Battle.active = b2;
    try {
      const durn = place(b2, HEROES.durn, TEAM.PLAYER, 1);
      const foe = roomy(place(b2, DUMMIES.rat_knight, TEAM.ENEMY, 1), 400);
      foe.dodgeChance = () => 0; foe.reflectChance = () => 0;
      foe.hookSources = () => [];
      const swing = () => {
        const before = foe.hp;
        const real = Math.random;
        Math.random = () => 0.99;
        try { Abilities.execute(durn.abilities[0].def, durn, foe, b2); }
        finally { Math.random = real; }
        return before - foe.hp;
      };
      const base = swing();
      // Double his DEF and the swing follows; double his ATK and it
      // does not. One of those is true of an ATK-scaled skill and the
      // other of a DEF-scaled one, so the pair pins which this is.
      durn.baseDef *= 2;
      const harder = swing();
      durn.baseDef /= 2;
      assert(harder > base * 1.5,
        `doubling his DEF moved the swing ${base} -> ${harder}; it is not DEF-scaled`);
      durn.baseAtk *= 4;
      const same = swing();
      durn.baseAtk /= 4;
      assert(same === base,
        `quadrupling his ATK moved the swing ${base} -> ${same}; it is still ATK-scaled`);
    } finally { Battle.active = prev2; }
  }

  // Hold the Line covers the front rank, not the field. A cd7 warding
  // seven birds off a tank's pool was most of why he read strong.
  {
    const wall = HEROES.durn.abilities.find((a) => a.id === 'durn_hold_the_line');
    assert(wall.targeting === 'front-allies',
      `Hold the Line reaches '${wall.targeting}', wanted the front rank only`);
  }

  // Both cooldowns are priced off HIS pool rather than growing it --
  // the rule Aurek follows, for the reason the sect exists: light sells
  // max HP at 2pc and 4pc, so the brood spends a pool instead of asking
  // for a bigger one.
  {
    const hpPriced = HEROES.durn.abilities.filter((a) =>
      (a.effects || []).some((e) => e.pct !== undefined &&
        (e.type === 'healHpPct' || e.type === 'shield')));
    assert(hpPriced.length === 2,
      `${hpPriced.length} of Durn's skills are priced off his pool, wanted 2`);
    assert(!(HEROES.durn.passive.hooks || {}).statMult,
      'Durn is selling a stat his own element pack already sells');
  }
});

// The brood's pack: tempo spent as SUSTAIN, which is the Razorwings'
// conversion pointed the other way. The sect is one bird deep so the
// tiers cannot be fielded yet -- what is tested is the hook logic
// through the real heal pipeline, handed to a unit the way applyParty
// does.
test('Sunbrood pack: speed spent as healing, and paid where it is needed', () => {
  const PACK = RACES.SECT_PARTY_BONUSES.sunbrood;
  const tier = (n) => PACK.find((t) => t.count === n);
  assert(tier(2) && tier(3) && tier(4),
    `the pack has tiers ${PACK.map((t) => t.count).join('/')}, wanted 2/3/4`);

  // Concat, never push: `passives` comes off the def by reference.
  const wear = (unit, ...tiers) => {
    unit.passives = (unit.passives || []).concat(tiers.map((t) => ({ hooks: t.hooks })));
    return unit;
  };

  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    // ---- 2pc is plain mods, and neither of them is light's own ----
    {
      const mods = tier(2).mods || {};
      assert(Math.abs(mods.spdPct - 0.10) < 1e-9 && Math.abs(mods.healBoost - 0.10) < 1e-9,
        `Quick Feathers reads ${JSON.stringify(mods)}`);
      const lightMods = RACES.ELEMENT_PARTY_BONUSES.light
        .flatMap((t) => Object.keys(t.mods || {}));
      for (const t of PACK) {
        for (const key of Object.keys(t.mods || {})) {
          assert(!lightMods.includes(key),
            `Sunbrood ${t.count}pc pays into '${key}', which a light tier already sells`);
        }
      }
    }

    // ---- 3pc: healing priced off the healer's own speed ----
    {
      const healer = place(battle, HEROES.nemeris ? HEROES.nemeris : HEROES.aurek,
        TEAM.PLAYER, 0);
      wear(healer, tier(3));
      const at = (spd) => { healer.speed = spd; return healer.healingBoost(null); };
      const base = at(100);
      assert(Math.abs(at(100) - base) < 1e-9, 'a 100-speed healer earned a rung');
      assert(Math.abs(at(119) - base) < 1e-9, '19 points over bought a rung it had not earned');
      assert(Math.abs(at(120) - base - 0.05) < 1e-9, `120 SPD paid ${at(120) - base}`);
      assert(Math.abs(at(180) - base - 0.20) < 1e-9, `180 SPD paid ${at(180) - base}`);
      // The rung is 20 and not Crosswind's 25 on purpose: light is a
      // slow element and at 25 the first rung needed 125, which one
      // light hero in ten could reach. If it ever goes back the tier
      // is decoration again.
      assert(Math.abs(at(124) - base - 0.05) < 1e-9,
        `124 SPD paid ${at(124) - base} -- the rung has gone back to 25`);
      // Slower than 100 never runs backwards.
      assert(Math.abs(at(60) - base) < 1e-9, 'a slow healer was penalised');
      battle.units = battle.units.filter((u) => u !== healer);
    }

    // ---- 4pc: reads the PATIENT, and only pays for the hurt one ----
    {
      const healer = wear(place(battle, HEROES.aurek, TEAM.PLAYER, 0), tier(4));
      const patient = (frac) => {
        const u = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 4);
        u.hookSources = () => [];
        u.hp = Math.round(u.maxHp * frac);
        return u;
      };
      const bare = healer.healingBoost(null);
      assert(Math.abs(healer.healingBoost(patient(0.9)) - bare) < 1e-9,
        'a healthy ally drew the wounded rate');
      assert(Math.abs(healer.healingBoost(patient(0.49)) - bare - 0.40) < 1e-9,
        `an ally under half drew ${healer.healingBoost(patient(0.49)) - bare}`);
      // The boundary is BELOW half, not at it.
      assert(Math.abs(healer.healingBoost(patient(0.5)) - bare) < 1e-9,
        'an ally at exactly half drew the wounded rate');
    }

    // ---- and the whole pack, through a real mend ----
    {
      const healer = wear(place(battle, HEROES.aurek, TEAM.PLAYER, 0),
        tier(3), tier(4));
      healer.speed = 150;                       // two rungs of Wingbeat
      healer.gearHealBoost += 0.10;             // stand in for the 2pc mod
      const hurt = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 4);
      hurt.hookSources = () => [];
      hurt.hp = 1;
      // 0.10 + 0.10 + 0.40. They ADD -- healingBoost sums its hooks --
      // so a full brood on a badly hurt bird is +60%, not a product.
      assert(Math.abs(healer.healingBoost(hurt) - 0.60) < 1e-9,
        `the full pack read ${healer.healingBoost(hurt)}, wanted 0.60`);
    }

    // ---- and through a REAL cast, which is the part that can break ----
    //
    // Reading healingBoost() directly proves the hook and nothing else.
    // The patient has to travel from the heal case in applyEffect down
    // into the boost, and that is five separate call sites any one of
    // which can quietly go back to passing nothing -- so this drives an
    // actual mend at an actually hurt ally and compares it to the same
    // mend at a healthy one.
    {
      const ilyra = wear(place(battle, HEROES.ilyra, TEAM.PLAYER, 0), tier(4));
      const clearSky = ilyra.abilities.find((a) =>
        (a.def.effects || []).some((e) => e.type === 'healHpPct'));
      assert(clearSky, 'Ilyra has no HP-priced mend to drive this with');
      const mend = (frac) => {
        // A deep pool either way, so both patients have room to absorb
        // the whole mend and the comparison is the boost and not the
        // ceiling.
        const u = roomy(place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 4), 50);
        u.hookSources = () => [];
        u.hp = Math.round(u.maxHp * frac);
        const before = u.hp;
        Abilities.execute(clearSky.def, ilyra, u, battle);
        const healed = u.hp - before;
        battle.units = battle.units.filter((x) => x !== u);
        return healed;
      };
      const healthy = mend(0.9);
      const hurt = mend(0.4);
      assert(healthy > 0, 'the mend restored nothing at all');
      assert(Math.abs(hurt / healthy - 1.40) < 0.02,
        `a hurt ally was mended ${(hurt / healthy).toFixed(3)}x a healthy one, wanted 1.40`);
      battle.units = battle.units.filter((u) => u !== ilyra);
    }

    // ---- every SHAPE of mend, not just the one ----
    //
    // The patient is threaded through five separate call sites in
    // applyEffect and reverting any one of them is a silent regression.
    // Driving a single healHpPct proved exactly one of the five: the
    // other four came back green under sabotage. So each shape gets
    // driven, including the two that are not strictly heals -- a
    // heal-over-time and a ward both take healing modifiers already,
    // on the stated ground that they are HP the target does not lose.
    {
      const healer = wear(place(battle, HEROES.aurek, TEAM.PLAYER, 0), tier(4));
      const shapes = [
        ['heal (ATK-priced)', { type: 'heal', mult: 0.5 },
          (u) => u.hp],
        ['healHpPct (pool-priced)', { type: 'healHpPct', pct: 0.10 },
          (u) => u.hp],
        ['hot', { type: 'hot', pct: 0.05, turns: 3 },
          (u) => (u.statusEffects.find((fx) => fx.kind === 'hot') || {}).amount || 0],
        ['shield', { type: 'shield', pct: 0.10, turns: 3 },
          (u) => u.shieldTotal()],
      ];
      for (const [name, effect, read] of shapes) {
        const got = (frac) => {
          const u = roomy(place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 4), 50);
          u.hookSources = () => [];
          u.hp = Math.round(u.maxHp * frac);
          const before = read(u);
          Abilities.applyEffect(effect, healer, u, 1);
          const after = read(u);
          battle.units = battle.units.filter((x) => x !== u);
          return after - before;
        };
        const healthy = got(0.9);
        const hurt = got(0.4);
        assert(healthy > 0, `${name}: produced nothing to measure`);
        assert(Math.abs(hurt / healthy - 1.40) < 0.02,
          `${name}: a hurt ally got ${(hurt / healthy).toFixed(3)}x a healthy one, ` +
          'wanted 1.40 -- the patient is not reaching this call site');
      }

      // healPerDot is the fifth site and needs a field to read: it is
      // priced off how many poisons are burning on the other side, so
      // without an enemy carrying one it produces nothing and the check
      // passes by measuring zero against zero.
      const lit = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
      lit.hookSources = () => [];
      lit.addStatusEffect({ kind: 'dot', amount: 10, turns: 5, flavor: 'burn' });
      const perDot = (frac) => {
        const u = roomy(place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 4), 50);
        u.hookSources = () => [];
        u.hp = Math.round(u.maxHp * frac);
        const before = u.hp;
        Abilities.applyEffect({ type: 'healPerDot', pct: 0.2 }, healer, u, 1);
        battle.units = battle.units.filter((x) => x !== u);
        return u.hp - before;
      };
      const dotHealthy = perDot(0.9);
      const dotHurt = perDot(0.4);
      assert(dotHealthy > 0, 'healPerDot produced nothing to measure');
      assert(Math.abs(dotHurt / dotHealthy - 1.40) < 0.02,
        `healPerDot: a hurt ally got ${(dotHurt / dotHealthy).toFixed(3)}x a healthy ` +
        'one, wanted 1.40 -- the patient is not reaching this call site');
    }
  } finally { Battle.active = prev; }
});

// The first Sunbrood, and the only fighter in the game who pays HEALTH
// for damage. Light's own pack sells max HP twice over, so a brood that
// sold a bigger pool would hand the party its own element bonus back;
// Aurek spends the pool instead, and the sect's healers are what make
// the spending survivable.
test("Aurek burns the wick: health spent, per body, never fatally", () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const aurek = place(battle, HEROES.aurek, TEAM.PLAYER, 1);
    const foes = [1, 2, 4].map((i) => {
      const f = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, i), 4000);
      f.dodgeChance = () => 0; f.reflectChance = () => 0;
      f.hookSources = () => [];
      return f;
    });
    const cost = Math.round(aurek.maxHp * 0.03);
    const cast = (idx, target) => {
      const before = aurek.hp;
      const real = Math.random;
      Math.random = () => 0.99;
      try { Abilities.execute(aurek.abilities[idx].def, aurek, target, battle); }
      finally { Math.random = real; }
      return before - aurek.hp;
    };

    // One enemy, one slice.
    aurek.hp = aurek.maxHp;
    assert(cast(0, foes[0]) === cost,
      `a single-target swing cost ${cast(0, foes[0])}, wanted ${cost}`);

    // PER BODY, not per cast. The wide swing is the expensive one, which
    // is the whole reason the choice between his skills is a choice.
    // Counted off the hexes rather than off the dummy list: First Light
    // catches the enemy FRONT row, and three dummies dropped into three
    // slot indices are not three front-row birds.
    const front = foes.filter((f) => f.slot.position === POSITION.FRONT);
    assert(front.length >= 2, `only ${front.length} dummies landed on front hexes`);
    aurek.hp = aurek.maxHp;
    const wide = cast(1, foes[0]);
    assert(wide === cost * front.length,
      `a swing across ${front.length} front-row bodies cost ${wide}, ` +
      `wanted ${cost * front.length}`);
    assert(wide > cost,
      'the wide swing cost the same as the single-target one -- the bill is per cast');

    // The +25% is real and applies to everything he throws. His hex is
    // Strongman, which buys max HP and nothing outgoing, so the whole
    // multiplier is the wick.
    assert(Math.abs(aurek.damageDealtMult(foes[0], null) - 1.25) < 1e-9,
      `his outgoing multiplier reads ${aurek.damageDealtMult(foes[0], null)}, wanted 1.25`);

    // NEVER fatal. A hero who can lose a fight to his own basic is not
    // paying a cost, he is a trap -- so the wick floors at one point of
    // health however low he already is.
    aurek.hp = 1;
    const atOne = cast(0, foes[0]);
    assert(aurek.alive && aurek.hp === 1,
      `at 1 HP his own swing left him at ${aurek.hp}, alive=${aurek.alive}`);
    assert(atOne === 0, `he still paid ${atOne} with nothing left to pay it with`);
    aurek.hp = Math.round(cost / 2);
    cast(0, foes[0]);
    assert(aurek.alive && aurek.hp === 1,
      'a swing he could not afford killed him instead of flooring');

    // He does not pay for hitting his own side, and cannot be made to.
    aurek.hp = aurek.maxHp;
    const mate = roomy(place(battle, HEROES.tervan, TEAM.PLAYER, 4), 200);
    const before = aurek.hp;
    aurek.dealt(500, mate);
    assert(aurek.hp === before,
      `hitting an ally cost him ${before - aurek.hp}`);
  } finally { Battle.active = prev; }

  // The design constraint that put him on this axis. Light sells max HP
  // at 2pc and again at 4pc, so a Sunbrood selling a bigger pool would
  // be the party's own element bonus twice -- and this is the third
  // sect where that trap has had to be designed around.
  const lightMods = RACES.ELEMENT_PARTY_BONUSES.light
    .flatMap((t) => Object.keys(t.mods || {}));
  assert(lightMods.includes('hpPct'),
    'light no longer sells max HP -- recheck why Aurek spends it rather than selling it');
  assert(!(HEROES.aurek.passive.hooks || {}).statMult,
    'Aurek is selling a stat his own element pack already sells');
});

// The Razorwings' pack. The sect is one bird deep, so the tiers cannot
// be FIELDED yet -- 2/3/4 members is the threshold and there is one.
// What can be tested is the part that breaks: the hook logic itself and
// its passage through the engine, exercised by handing the tier's hooks
// to a real unit exactly the way applyParty would. The fielded-count
// wiring gets its own test when the sect has four birds in it.
test('Razorwings pack: speed spent as damage, and a kill spent as meter', () => {
  const PACK = RACES.SECT_PARTY_BONUSES.razorwings;
  const tier = (n) => PACK.find((t) => t.count === n);
  assert(tier(2) && tier(3) && tier(4),
    `the pack has tiers ${PACK.map((t) => t.count).join('/')}, wanted 2/3/4`);

  // Hooks are handed over by CONCAT, never pushed: `passives` comes off
  // the hero def by reference, and pushing would write the party bonus
  // into the definition for the rest of the process.
  const wear = (unit, ...tiers) => {
    unit.passives = (unit.passives || []).concat(tiers.map((t) => ({ hooks: t.hooks })));
    return unit;
  };

  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const foe = (speed) => {
      const f = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 4000);
      f.dodgeChance = () => 0; f.reflectChance = () => 0;
      f.hookSources = () => [];
      f.speed = speed;
      return f;
    };

    // ---- 2pc Overtake: binary, on the comparison alone ----
    {
      const bird = wear(place(battle, HEROES.tervan, TEAM.PLAYER, 1), tier(2));
      const mine = bird.effectiveStat('speed');
      // Read through damageDealtMult so the positional and everything
      // else on him divides out: it is the RATIO that Overtake owns.
      const slower = bird.damageDealtMult(foe(mine - 1), null);
      const faster = bird.damageDealtMult(foe(mine + 1), null);
      const level = bird.damageDealtMult(foe(mine), null);
      assert(Math.abs(slower / faster - 1.25) < 1e-9,
        `Overtake paid ${(slower / faster).toFixed(3)} against a slower body, wanted 1.25`);
      // A single point either way flips it, and a DEAD HEAT pays nothing
      // -- strictly faster, not "at least as fast". Without this the
      // boundary is unpinned and could drift to >= without a test caring.
      assert(Math.abs(level - faster) < 1e-9,
        'Overtake paid out against an enemy of exactly equal speed');
    }

    // ---- 3pc Terminal Velocity: the SIZE of the gap, and its cap ----
    {
      const bird = wear(place(battle, HEROES.tervan, TEAM.PLAYER, 2), tier(3));
      const mine = bird.effectiveStat('speed');
      const base = bird.damageDealtMult(foe(mine), null);   // dead heat: nothing
      const at = (gap) => bird.damageDealtMult(foe(mine - gap), null) / base;
      assert(Math.abs(at(0) - 1) < 1e-9, 'a dead heat paid out');
      assert(Math.abs(at(20) - 1.10) < 1e-9, `20 points paid ${at(20).toFixed(3)}, wanted 1.10`);
      assert(Math.abs(at(60) - 1.30) < 1e-9, `60 points paid ${at(60).toFixed(3)}, wanted 1.30`);
      // Capped, and the cap is what stops a speed-stacked party from
      // scaling for ever against a slow boss.
      assert(Math.abs(at(200) - 1.30) < 1e-9,
        `a 200-point lead paid ${at(200).toFixed(3)} -- the +30% cap is not holding`);
      // Never negative: being SLOWER than the target costs nothing.
      const behind = bird.damageDealtMult(foe(mine + 60), null) / base;
      assert(Math.abs(behind - 1) < 1e-9,
        `being 60 points slower paid ${behind.toFixed(3)}, wanted 1`);
    }

    // ---- and the two of them together, because they MULTIPLY ----
    {
      const bird = wear(place(battle, HEROES.tervan, TEAM.PLAYER, 3), tier(2), tier(3));
      const mine = bird.effectiveStat('speed');
      const both = bird.damageDealtMult(foe(mine - 60), null) /
                   bird.damageDealtMult(foe(mine), null);
      // 1.25 x 1.30. Pinned deliberately: this is the sect's ceiling
      // against something slow, and if it ever moves it should move on
      // purpose rather than because a tier was edited in isolation.
      assert(Math.abs(both - 1.625) < 1e-9,
        `both tiers paid ${both.toFixed(4)} into a slow target, wanted 1.625`);
      // And nothing at all against something faster, which is the price
      // the sect pays for that ceiling.
      const uphill = bird.damageDealtMult(foe(mine + 60), null) /
                     bird.damageDealtMult(foe(mine), null);
      assert(Math.abs(uphill - 1) < 1e-9,
        `both tiers paid ${uphill.toFixed(3)} against a faster enemy, wanted nothing`);
    }
  } finally { Battle.active = prev; }

  // ---- 4pc Rip Current: the killer, and only the killer ----
  {
    const battle2 = makeBattle();
    const prev2 = Battle.active;
    Battle.active = battle2;
    try {
      const killer = wear(place(battle2, HEROES.tervan, TEAM.PLAYER, 1), tier(4));
      const mate = wear(place(battle2, HEROES.chirp, TEAM.PLAYER, 2), tier(4));
      const mark = () => {
        const f = place(battle2, DUMMIES.rat_archer, TEAM.ENEMY, 1);
        f.hp = 1;
        return f;
      };
      const want = CONFIG.TURN_METER_MAX * 0.25;

      killer.turnMeter = 0; mate.turnMeter = 0;
      mark().takeDamage(9e9, killer);
      assert(Math.abs(killer.turnMeter - want) < 1e-6,
        `the killer got ${killer.turnMeter} meter, wanted ${want}`);
      // Their own tier, not the party's: a Razorwing standing next to a
      // kill they did not land is paid nothing.
      assert(mate.turnMeter === 0,
        `a bystander was paid ${mate.turnMeter} for somebody else's kill`);

      // A death nobody dealt -- a poison tick, a reflect, a hazard --
      // pays nobody. takeDamage with no attacker is exactly that case.
      killer.turnMeter = 0;
      mark().takeDamage(9e9);
      assert(killer.turnMeter === 0,
        `a killerless death paid ${killer.turnMeter} meter`);

      // And never for an ALLY falling.
      killer.turnMeter = 0;
      const friend = place(battle2, DUMMIES.rat_archer, TEAM.PLAYER, 4);
      friend.hp = 1;
      friend.takeDamage(9e9, killer);
      assert(killer.turnMeter === 0,
        `a Razorwing was paid ${killer.turnMeter} for killing their own ally`);
    } finally { Battle.active = prev2; }
  }

  // The house rule the pack was built to. Wind's element tiers already
  // sell speed as more speed and more turns; every Razorwing tier has to
  // read the GAP or the outcome instead, or the sect is just handing the
  // party its own element bonus back a second time.
  const windMods = RACES.ELEMENT_PARTY_BONUSES.wind
    .flatMap((t) => Object.keys(t.mods || {}));
  for (const t of PACK) {
    for (const key of Object.keys(t.mods || {})) {
      assert(!windMods.includes(key),
        `Razorwings ${t.count}pc pays into '${key}', which a wind tier already sells`);
      assert(key !== 'spdPct' && key !== 'spdFlat' && key !== 'extraTurn',
        `Razorwings ${t.count}pc sells raw speed ('${key}') -- the sect spends it instead`);
    }
  }
});

// The first Razorwing. The sect's thesis is that speed is worth
// something on the SWING, not only in the turn order -- so Windshear is
// measured as damage against a slower body and an identical faster one.
test("Tervan's Windshear: armour blindness, but only against the slower", () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const t = place(battle, HEROES.tervan, TEAM.PLAYER, 1);

    // Two identical victims but for their speed: one Tervan outruns and
    // one he does not. Everything else is held equal so the only thing
    // the numbers can be reading is the comparison.
    const mark = (speed) => {
      const f = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 4000);
      f.dodgeChance = () => 0; f.reflectChance = () => 0;
      f.hookSources = () => [];
      f.baseDef = 600;
      f.speed = speed;
      return f;
    };
    // Crits are rolled inside strike() against
    // `caster.effectiveStat('critChance')` -- overriding the unit's
    // critChance() METHOD does not touch it, which is how the first
    // draft of this test turned into a coin flip that happened to land.
    // Pin the roll instead: 0.99 fails every crit gate on the field.
    const hit = (f) => {
      const before = f.hp;
      const real = Math.random;
      Math.random = () => 0.99;
      try { Abilities.execute(t.abilities[0].def, t, f, battle); }
      finally { Math.random = real; }
      battle.units = battle.units.filter((u) => u !== f);
      return before - f.hp;
    };
    const mine = t.effectiveStat('speed');
    const slower = hit(mark(mine - 20));
    const faster = hit(mark(mine + 20));
    assert(slower > faster,
      `Windshear paid nothing: ${slower} into a slower bird, ${faster} into a faster one`);

    // At the printed size. The blindness is a cut to the DEF the CURVE
    // sees, not a percentage added to the damage, so the expected pair
    // comes back through the same formula. His outgoing multiplier is
    // read off the unit rather than assumed: he stands on a front hex,
    // where Reckless Charge is worth another 20%, and hard-coding the
    // swing would be pinning his positional here by accident.
    const probe = mark(mine - 20);
    const raw = t.effectiveStat('atk') * 1.55 *
      g.Elements.mult('wind', DUMMIES.rat_knight.element) *
      t.damageDealtMult(probe, null);
    battle.units = battle.units.filter((u) => u !== probe);
    const want = Math.round(Abilities.damageFormula(raw, 600 * (1 - 0.15)));
    assert(Math.abs(slower - want) <= 2,
      `a blind hit read ${slower}, wanted ~${want} (15% off 600 DEF)`);
    const plain = Math.round(Abilities.damageFormula(raw, 600));
    assert(Math.abs(faster - plain) <= 2,
      `a sighted hit read ${faster}, wanted ~${plain} (full 600 DEF)`);

    // It is his, not the ability's: another bird throwing at the same
    // slow victim gets nothing for it.
    const other = place(battle, HEROES.chirp, TEAM.PLAYER, 2);
    const slow = mark(mine - 20);
    let leaked = 0;
    for (const p of other.hookSources()) {
      if (p.hooks && p.hooks.defIgnoreAdd) leaked++;
    }
    assert(leaked === 0, "Windshear leaked onto a bird who does not carry it");
    battle.units = battle.units.filter((u) => u !== slow && u !== other);
  } finally { Battle.active = prev; }

  // And the design constraint that put it on this channel at all. Wind's
  // own 3pc (Crosswind) already pays damageDealtMult off the same stat,
  // so a Razorwing whose speed ALSO fed that channel would be selling
  // the party bonus back to the party a second time. Armour blindness is
  // a different channel on purpose, and this is what says so.
  const hooks = HEROES.tervan.passive.hooks || {};
  assert(hooks.defIgnoreAdd, 'Tervan lost his armour-blindness');
  assert(!hooks.damageDealtMult,
    'Tervan is paying into damageDealtMult, the channel Crosswind already owns');
  const wind3 = RACES.ELEMENT_PARTY_BONUSES.wind.find((tier) => tier.count === 3);
  assert(wind3 && wind3.mods && wind3.mods.damageDealtMult !== undefined ||
    (wind3 && wind3.hooks && wind3.hooks.damageDealtMult) ||
    (wind3 && wind3.modsFor),
    'wind 3pc no longer reads as a damage-per-speed tier — recheck the overlap');
});

// The last sect. The Phoenix Court light the fires that the Firetroupe's
// oil doubles, and their pack is about making those fires LAST: longer
// by rekindling, harder per tick, and a turn longer again on top.
test('Phoenix Court sect pack: fires that catch twice, burn hotter, last longer', () => {
  const court = RACES.SECTS.phoenixcourt.members;

  const party = (n) => {
    const battle = new Battle();
    const units = [];
    for (let i = 0; i < n; i++) {
      const u = new Unit(HEROES[court[i]], TEAM.PLAYER, { level: 30, stars: 3 });
      battle.placeUnit(u, i);
      units.push(u);
    }
    RACES.applyParty(units);
    return { battle, units };
  };

  const burn = (caster, target, turns = 3) =>
    Abilities.applyEffect({ type: 'dot', amount: 500, turns, flavor: 'burn' },
      caster, target, 1);

  // ---- 2pc Catches Twice: SPREADS rather than lengthens ----
  {
    const { battle, units } = party(2);
    // Flurry owns the original hook; measure on a bird who does not.
    const caster = units.find((u) => u.def.id !== 'flurry') || units[1];
    const foe = roomy(place(battle, DUMMIES.rat_archer, TEAM.ENEMY, 4), 400);
    const prev = Battle.active;
    Battle.active = battle;
    try {
      burn(caster, foe);
      const first = foe.statusEffects.filter(
        (fx) => fx.kind === 'dot' && fx.flavor === 'burn');
      assert(first.length === 1, `the first burn laid ${first.length} fires`);
      const turnsAfterOne = first[0].turns;

      burn(caster, foe);
      const fires = foe.statusEffects.filter(
        (fx) => fx.kind === 'dot' && fx.flavor === 'burn');
      assert(fires.length === 3,
        `a burn set on a burning enemy left ${fires.length} fires, wanted 3 ` +
        '— the cast should light two, not one');
      // Every plate runs its own full duration. If the tier ever goes
      // back to stretching one fire, these stop matching.
      assert(fires.every((fx) => fx.turns === turnsAfterOne),
        `the fires run ${fires.map((fx) => fx.turns).join('/')}, wanted ` +
        `${turnsAfterOne} apiece`);
    } finally { Battle.active = prev; }

    // One Court bird does not spread, Flurry included: the tier owns
    // the hook outright now, so no bird carries it into a party of one.
    const one = party(1);
    const foe1 = roomy(place(one.battle, DUMMIES.rat_archer, TEAM.ENEMY, 4), 400);
    Battle.active = one.battle;
    try {
      burn(one.units[0], foe1);
      burn(one.units[0], foe1);
      const n = foe1.statusEffects.filter(
        (fx) => fx.kind === 'dot' && fx.flavor === 'burn').length;
      assert(n === 2, `one Court bird left ${n} fires, wanted 2`);
    } finally { Battle.active = prev; }
  }

  // ---- 3pc Draught: every tick lands harder ----
  {
    const bare = new Unit(HEROES[court[0]], TEAM.PLAYER, { level: 30, stars: 3 });
    const { units } = party(3);
    assert(Math.abs(units[0].gearDotBoost - (bare.gearDotBoost + 0.20)) < 1e-9,
      `Draught set the boost to ${units[0].gearDotBoost}`);
    assert(party(2).units[0].gearDotBoost === bare.gearDotBoost,
      'Draught fanned the fire at two Court birds');
  }

  // ---- 4pc Long Burn: a turn longer, and it COMPOUNDS with 2pc ----
  {
    const { battle, units } = party(4);
    const caster = units.find((u) => u.def.id !== 'flurry') || units[1];
    const foe = roomy(place(battle, DUMMIES.rat_archer, TEAM.ENEMY, 4), 400);
    const prev = Battle.active;
    Battle.active = battle;
    try {
      burn(caster, foe, 3);
      const fire = foe.statusEffects.find(
        (fx) => fx.kind === 'dot' && fx.flavor === 'burn');
      assert(fire.turns === 4, `a 3-turn burn landed at ${fire.turns}, wanted 4`);
      // The tiers COMPOUND: the second cast spreads to two fires under
      // 2pc, and 4pc stretches each of them, so the Court ends up with
      // three four-turn fires where a bare caster would have two threes.
      burn(caster, foe, 3);
      const spread = foe.statusEffects.filter(
        (fx) => fx.kind === 'dot' && fx.flavor === 'burn');
      assert(spread.length === 3,
        `the spread left ${spread.length} fires, wanted 3`);
      assert(spread.every((fx) => fx.turns === 4),
        `the fires run ${spread.map((fx) => fx.turns).join('/')}, wanted 4 apiece`);
    } finally { Battle.active = prev; }

    // Three do not carry it.
    const three = party(3);
    const foe3 = roomy(place(three.battle, DUMMIES.rat_archer, TEAM.ENEMY, 4), 400);
    Battle.active = three.battle;
    try {
      burn(three.units[0], foe3, 3);
      const f = foe3.statusEffects.find(
        (fx) => fx.kind === 'dot' && fx.flavor === 'burn');
      assert(f.turns === 3, `three Court birds stretched the fire to ${f.turns}`);
    } finally { Battle.active = prev; }
  }

  // ---- the element tier gave Flurry her name back ----
  {
    const fire4 = RACES.ELEMENT_PARTY_BONUSES.fire.find((t) => t.count === 4);
    assert(fire4.name !== 'Catches Twice',
      'the fire element tier is using the Court\'s name');
    const court2 = RACES.SECT_PARTY_BONUSES.phoenixcourt.find((t) => t.count === 2);
    assert(court2.name === 'Catches Twice', 'the Court lost the name');
    // The tier owns the spread AND the name. Flurry keeps a name of her
    // own beside it, so a player reading her card and the pack readout
    // together sees two things rather than one printed twice.
    assert(HEROES.flurry.passive.name !== 'Catches Twice',
      'Flurry and the tier are both called Catches Twice again');
    assert(RACES.SECT_PARTY_BONUSES.phoenixcourt.every(
      (t) => t.name !== HEROES.flurry.passive.name),
      `the Court has a tier named ${HEROES.flurry.passive.name} too`);
  }
});

// The team readout lists what a party is EARNING or nearly earning. A
// group with one hero in it is neither -- the first tier needs two -- so
// a seven-hero party of seven different elements would otherwise show
// seven boxes and no live tier in any of them.
test('the party readout hides a group with fewer than two fielded', () => {
  const defOf = (id) => HEROES[id];
  const cryst = RACES.SECTS.cryst.members.map(defOf);

  // One water hero: nothing to show, element or sect.
  {
    const groups = RACES.previewParty([cryst[0]]);
    assert(groups.length === 0,
      `a lone hero showed ${groups.map((x) => x.name).join(', ')}`);
  }

  // Two: both the element and the sect appear, and the first tier is
  // earned rather than merely listed.
  {
    const groups = RACES.previewParty([cryst[0], cryst[1]]);
    const names = groups.map((x) => x.name);
    assert(groups.some((x) => x.kind === 'element'),
      `no element group at two: ${names.join(', ')}`);
    assert(groups.some((x) => x.kind === 'sect'),
      `no sect group at two: ${names.join(', ')}`);
    for (const grp of groups) {
      assert(grp.tiers.some((t) => t.earned),
        `${grp.name} is shown with nothing earned`);
    }
  }

  // A mixed party shows only the groups that reached two. One tagalong
  // fire hero beside three Cryst must not add a fire box.
  {
    const lone = Object.values(HEROES).find((h) => h.element === 'fire');
    const groups = RACES.previewParty([cryst[0], cryst[1], cryst[2], lone]);
    assert(!groups.some((x) => x.key === 'fire'),
      'a single fire hero opened a fire group');
    assert(groups.some((x) => x.key === 'water') && groups.some((x) => x.key === 'cryst'),
      'the three-strong groups were dropped');
  }

  // The threshold is the readout's, not the rules': applyParty still
  // pays nothing at one, and the first tier still lands at two.
  {
    assert(RACES.elementTiers('water', 1).length === 0, 'water paid at one');
    assert(RACES.elementTiers('water', 2).length > 0, 'water paid nothing at two');
    assert(RACES.PREVIEW_MIN === 2, `the readout floor is ${RACES.PREVIEW_MIN}`);
  }
});

// The Sunbrood's 5-star, and the bird the whole pack was written to pay.
// Three things have to hold: the egg catches somebody ELSE exactly once,
// it is worth a share of NEMERIS's pool rather than the victim's, and it
// is deaf to the healing multipliers his own sect stacks -- otherwise
// the pack cashes out twice on the same tier.
test("Nemeris: the egg is the brood's, not his", () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const nem = place(battle, HEROES.nemeris, TEAM.PLAYER, 3);
    const mate = (slot) => {
      const u = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, slot);
      u.hookSources = () => [];
      u.dodgeChance = () => 0; u.reflectChance = () => 0;
      return u;
    };
    const kill = (u) => {
      const real = Math.random;
      Math.random = () => 0.99;
      try { Abilities.strike(foe, u, u.maxHp * 50, { dodge: false, reflect: false }); }
      finally { Math.random = real; }
    };
    const foe = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    foe.hookSources = () => [];

    // One catch, priced off Nemeris.
    const a = mate(1);
    kill(a);
    assert(a.alive, 'the egg did not catch the first ally to fall');
    const want = Math.round(nem.maxHp * 0.35);
    assert(a.hp === want,
      `caught on ${a.hp} health, not the ${want} the egg is worth`);
    // And priced off HIS pool, not the victim's: the dummy's pool is a
    // different number, so an implementation that read the wrong one
    // would land somewhere else entirely.
    assert(Math.round(a.maxHp * 0.35) !== want,
      'the fixture cannot tell the two pools apart');

    // Once. The second bird to fall stays down.
    const b = mate(2);
    kill(b);
    assert(!b.alive, 'the egg caught a second ally in one battle');

  } finally { Battle.active = prev; }
});

// Never the bearer -- and this needs its own battle to mean anything.
// Asserted at the end of the fixture above it proved nothing, because
// the egg was already spent on somebody else by then and a self-catch
// could not have fired whatever the guard said. Here the egg is whole
// and Nemeris is the first to fall.
test('Nemeris: the egg is not for him', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const nem = place(battle, HEROES.nemeris, TEAM.PLAYER, 3);
    nem.dodgeChance = () => 0; nem.reflectChance = () => 0;
    // A second bearer would be a different rule (the charge is spent off
    // whoever owns it), so he stands alone but for a plain teammate.
    const mate = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
    mate.hookSources = () => [];
    const foe = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    foe.hookSources = () => [];
    const real = Math.random;
    Math.random = () => 0.99;
    try { Abilities.strike(foe, nem, nem.maxHp * 50, { dodge: false, reflect: false }); }
    finally { Math.random = real; }
    assert(!nem.alive, 'Nemeris caught himself with his own egg');
    assert(!nem.eggSpent, 'the charge was spent on the catch that never happened');
  } finally { Battle.active = prev; }
});

// The catch sets health rather than mending it, on purpose: every
// multiplier the Sunbrood stacks reads through Unit.heal, and a save
// that grew with +60% healing done would be the pack paid twice.
test('Nemeris: the egg is deaf to healing multipliers', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const nem = place(battle, HEROES.nemeris, TEAM.PLAYER, 3);
    // A pack that pays healing done as hard as the brood's ever could.
    nem.passives.push({ hooks: { healBoostAdd: 5 } });
    const mate = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
    mate.hookSources = () => [];
    mate.dodgeChance = () => 0; mate.reflectChance = () => 0;
    const foe = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    foe.hookSources = () => [];
    const real = Math.random;
    Math.random = () => 0.99;
    try { Abilities.strike(foe, mate, mate.maxHp * 50, { dodge: false, reflect: false }); }
    finally { Math.random = real; }
    assert(mate.alive, 'the egg did not catch');
    assert(mate.hp === Math.round(nem.maxHp * 0.35),
      `a 600% healing boost moved the catch to ${mate.hp}`);
  } finally { Battle.active = prev; }
});

// His hex, and the axis it deliberately does NOT use. The pack sells
// healing done at three tiers and speed at one; damage taken is the one
// thing nothing above him touches, so the hex hands the wounded bird
// armour rather than another mend or another push up the order.
test('Nemeris: Under the Egg arms the ally lowest on health', () => {
  const battle = makeBattle();
  const nem = place(battle, HEROES.nemeris, TEAM.PLAYER, 3);
  const mate = (frac, slot) => {
    const u = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, slot);
    u.hookSources = () => [];
    u.hp = Math.round(u.maxHp * frac);
    return u;
  };
  const healthy = mate(0.95, 1);
  const hurt = mate(0.20, 2);
  const hex = POSITIONALS.under_the_egg;
  assert(HEROES.nemeris.positional === hex, 'Nemeris is not standing on his own hex');
  assert(hex.position === POSITION.CENTER, 'the eggbearer belongs in the middle');
  hex.hooks.onTurnStart(nem, battle);
  const armed = (u) => u.statusEffects.filter(
    (fx) => fx.kind === 'buff' && fx.stat === 'def' && fx.mult > 1).length;
  assert(armed(hurt) === 1, `the wounded bird got ${armed(hurt)} wards`);
  assert(armed(healthy) === 0, 'the healthy bird was tucked in instead');
  // Armour, not a mend and not tempo -- the two axes his pack already owns.
  assert(hurt.hp === Math.round(hurt.maxHp * 0.20), 'the hex healed rather than armed');
  assert(!hurt.turnMeter, 'the hex pushed the action bar');
});

// The only cleanse in the sect, and both halves of it have to land: a
// healing party's real loss condition is a heal block or a stack of
// poisons outrunning the mends, not raw damage.
test('Nemeris: The Long Morning strips and mends in one cast', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const nem = place(battle, HEROES.nemeris, TEAM.PLAYER, 3);
    const mate = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
    mate.hookSources = () => [];
    mate.hp = Math.round(mate.maxHp * 0.30);
    for (let i = 0; i < 4; i++) {
      mate.addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.9, turns: 5 });
    }
    const before = mate.hp;
    const morning = nem.abilities.find(
      (a) => a.def.id === 'nemeris_the_long_morning');
    assert(morning, 'The Long Morning is missing');
    Abilities.execute(morning.def, nem, mate, battle);
    const left = mate.statusEffects.filter((fx) => fx.kind === 'debuff').length;
    assert(left === 2, `${left} debuffs left standing, expected 2 of 4 lifted`);
    // Priced off the PATIENT's pool, which is what separates every mend
    // he casts from Durn's -- Durn's is a flat figure off his own.
    const want = Math.round(mate.maxHp * 0.20 * (1 + nem.healingBoost(mate)));
    assert(Math.abs((mate.hp - before) - want) <= 2,
      `mended ${mate.hp - before}, expected about ${want} off the patient's pool`);
  } finally { Battle.active = prev; }
});

// His cd5, and the reason it is a speed buff rather than a third mend.
// Wingbeat Mend prices every heal off the caster's speed AT THE MOMENT
// IT LANDS, so a party-wide lift to the brood's first pillar is a
// party-wide lift to its third -- the sect's arithmetic closing on
// itself, with no code behind it. Pinned because the skill is arbitrary
// if this does not hold.
test('Nemeris: Up With the Sun buys the brood a Wingbeat rung', () => {
  const battle = new Battle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const units = [];
    ['nemeris', 'durn', 'aurek'].forEach((id, i) => {
      const u = new Unit(HEROES[id], TEAM.PLAYER, { level: 30, stars: 5 });
      battle.placeUnit(u, i);
      units.push(u);
    });
    RACES.applyParty(units);
    const [nem, durn] = units;

    // 2pc buys the speed, 3pc converts it. Both are live at three.
    const before = { nem: nem.healingBoost(nem), durn: durn.healingBoost(durn) };
    const spdBefore = { nem: nem.effectiveStat('speed'), durn: durn.effectiveStat('speed') };

    const sun = nem.abilities.find((a) => a.def.id === 'nemeris_up_with_the_sun');
    assert(sun, 'Up With the Sun is missing');
    assert(sun.def.targeting === 'all-allies', 'the sunrise did not reach the whole brood');
    // Cast ONCE: an all-allies skill fans out on its own, and calling
    // it per target stacked three sunrises on the caster.
    Abilities.execute(sun.def, nem, durn, battle);

    for (const u of units) {
      const fx = u.statusEffects.filter(
        (x) => x.kind === 'buff' && x.stat === 'speed' && x.mult > 1);
      assert(fx.length === 1, `${u.name} caught ${fx.length} sunrises`);
      assert(fx[0].turns === 4, `the window is ${fx[0].turns} turns, not 4`);
    }
    assert(nem.effectiveStat('speed') > spdBefore.nem, 'Nemeris did not speed up');

    // The claim itself: a rung each, not just a faster bird.
    assert(nem.healingBoost(nem) - before.nem > 0.049,
      `Nemeris gained ${(nem.healingBoost(nem) - before.nem).toFixed(3)} healing, ` +
      'expected at least one 5% Wingbeat rung');
    assert(durn.healingBoost(durn) - before.durn > 0.049,
      `Durn gained ${(durn.healingBoost(durn) - before.durn).toFixed(3)} healing, ` +
      'expected at least one 5% Wingbeat rung');

    // And it is a buff, not a mend: nobody was healed by the sunrise.
    assert(durn.hp === durn.maxHp, 'Up With the Sun mended somebody');
  } finally { Battle.active = prev; }
});

// The brood's artillery. His ramp is charged by TURNS, which is the
// only thing in his kit that touches the sect's first pillar -- Quick
// Feathers buys him turns and every turn is a step -- and it is paid
// for by having to be left alone to play.
test('Aster: the Long Note climbs on turns and sheds on blows', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const aster = roomy(place(battle, HEROES.aster, TEAM.PLAYER, 4), 40);
    aster.dodgeChance = () => 0; aster.reflectChance = () => 0;
    const foe = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    foe.hookSources = () => [];
    // Off his hex, so the ceiling under test is the passive's own 5.
    aster.slot = battle.playerSlots[1];

    const mult = () => aster.damageDealtMult(foe);
    assert(Math.abs(mult() - 1) < 1e-9, `opened at ${mult()}, not silent`);

    aster.startTurn(battle);
    assert(Math.abs(mult() - 1.10) < 1e-9, `one turn in he is at ${mult()}, wanted 1.10`);

    // Climbs, and stops climbing.
    for (let i = 0; i < 10; i++) aster.startTurn(battle);
    assert(aster.longNote === 5, `the note reached ${aster.longNote}, wanted a cap of 5`);
    assert(Math.abs(mult() - 1.50) < 1e-9, `capped at ${mult()}, wanted 1.50`);

    // And sheds one step per blow, not all of them.
    const real = Math.random;
    Math.random = () => 0.99;
    try { Abilities.strike(foe, aster, 200, { dodge: false, reflect: false }); }
    finally { Math.random = real; }
    assert(aster.alive, 'the fixture killed him');
    assert(aster.longNote === 4,
      `a single blow took him to ${aster.longNote}, wanted one step off`);
  } finally { Battle.active = prev; }
});

// His hex raises the CEILING rather than the rate: the back row is
// where an artillery piece is left alone long enough to reach the top
// of a ramp, so the hex pays exactly the hero who can stand still.
test('Aster: Carrying Distance lifts the ceiling to +70%', () => {
  const battle = makeBattle();
  const hex = POSITIONALS.carrying_distance;
  assert(HEROES.aster.positional === hex, 'Aster is not on his own hex');
  assert(hex.position === POSITION.BACK, 'the horn belongs at the back');
  const aster = place(battle, HEROES.aster, TEAM.PLAYER, 4);
  const foe = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
  assert(aster.positionalActive(), 'slot 4 is not a back hex');
  for (let i = 0; i < 12; i++) aster.startTurn(battle);
  assert(aster.longNote === 7, `the note reached ${aster.longNote} on the hex, wanted 7`);
  assert(Math.abs(aster.damageDealtMult(foe) - 1.70) < 1e-9,
    `capped at ${aster.damageDealtMult(foe)} on the hex, wanted 1.70`);
});

// The sect's actual damage answer, and it is paid to everybody but him.
// The mark is the roster's EXISTING vulnerability channel -- Doom Mark's
// -- taken wide and shallow, because a debuff a player cannot read at a
// glance may as well not be on the field.
test("Aster: Reveille marks the line with the roster's own mark", () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  const real = Math.random;
  try {
    const aster = maxSkill(place(battle, HEROES.aster, TEAM.PLAYER, 4), 2);
    const foes = [0, 1, 2].map((i) => {
      const u = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, i), 40);
      u.hookSources = () => [];
      u.dodgeChance = () => 0; u.reflectChance = () => 0;
      return u;
    });
    const reveille = aster.abilities.find((a) => a.def.id === 'aster_reveille');
    assert(reveille, 'Reveille is missing');
    assert(reveille.def.targeting === 'all-enemies', 'the note did not carry to the line');

    Math.random = () => 0.01; // the gate opens
    Abilities.execute(reveille.def, aster, foes[0], battle);

    for (const f of foes) {
      const mark = f.statusEffects.find(
        (fx) => fx.kind === 'debuff' && fx.stat === 'damageTaken' && fx.mult > 1);
      assert(mark, `${f.name} was not marked`);
      // Maxed: 1.10 base plus two 5% debuffPower rungs.
      assert(Math.abs(mark.mult - 1.20) < 1e-9,
        `marked for ${mark.mult} at the skill cap, wanted 1.20`);
      assert(f.hp < f.maxHp, `${f.name} took no damage from the blast`);
    }
    // The mark is worth 20% to EVERYONE, not only to him -- that is the
    // whole reason a healing sect fields him.
    const ally = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
    ally.hookSources = () => [];
    assert(Math.abs(foes[0].damageTakenMult(ally) - 1.20) < 1e-9,
      `a teammate reads the mark as ${foes[0].damageTakenMult(ally)}, wanted 1.20`);

    // And the BASE mark is 10%, not 20% -- the other half is laddered.
    const base = reveille.def.effects.find((e) => e.stat === 'damageTaken');
    assert(Math.abs(base.mult - 1.10) < 1e-9,
      `the unlevelled mark is ${base.mult}, wanted 1.10`);
    const rungs = (reveille.def.levelUps || [])
      .reduce((n, r) => n + (r.debuffPower || 0), 0);
    assert(Math.abs(rungs - 0.10) < 1e-9,
      `the ladder buys ${rungs} of severity, wanted 0.10 to reach 1.20`);

    // And it is gated, at the 50% the card advertises.
    const gate = reveille.def.effects.find((e) => e.chance !== undefined);
    assert(gate && Math.abs(gate.chance - 0.5) < 1e-9,
      'the mark is not on the roster-standard 50% gate');
  } finally { Math.random = real; Battle.active = prev; }
});

// Aster's negative. He runs on CRIT, the one axis neither of his packs
// touches, and his crits do not hit harder -- they hit WIDER, onto the
// weakest thing still standing. Sibling to the fire pack's Encore and
// deliberately the other shape, so a kit carrying both widens instead
// of doubling.
test('Rizzo: a crit splits onto the weakest enemy left', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  const real = Math.random;
  try {
    const rizzo = place(battle, HEROES.rizzo, TEAM.PLAYER, 4);
    rizzo.slot = battle.playerSlots[1];          // off his hex: half strength
    const foes = [0, 1, 2].map((i) => {
      const u = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, i), 60);
      u.hookSources = () => [];
      u.dodgeChance = () => 0; u.reflectChance = () => 0;
      return u;
    });
    const [hit, middling, weakest] = foes;
    middling.hp = Math.round(middling.maxHp * 0.60);
    weakest.hp = Math.round(weakest.maxHp * 0.20);
    const before = foes.map((f) => f.hp);

    // A crit that lands: crit rolls under effectiveStat('critChance'),
    // and every other roll in strike wants a HIGH number to miss.
    let critPin = 1;
    rizzo.effectiveStat = ((base) => function (stat) {
      return stat === 'critChance' ? critPin : base.call(this, stat);
    })(rizzo.effectiveStat);
    Math.random = () => 0;
    const res = Abilities.strike(rizzo, hit, 4000, { crit: true, dodge: false, reflect: false });
    Math.random = real;

    assert(res.crit, 'the fixture did not produce a crit');
    assert(res.split > 0, 'the shaft did not split');
    assert(weakest.hp < before[2], 'the split missed the weakest enemy');
    assert(middling.hp === before[1],
      'the split landed on the middling enemy, not the weakest');
    // Half the shot, off his hex.
    const carried = before[2] - weakest.hp;
    const landed = before[0] - hit.hp;
    assert(carried > 0 && carried < landed,
      `the split carried ${carried} against a ${landed} hit -- wanted a fraction`);

    // And it cannot split again: one arrow, two birds, never three.
    // (The `Unit.echoing` latch is what stops it, and it is genuinely
    // unobservable from outside -- flipping the recursive call back to
    // `crit: true` changes nothing, because the latch refuses the
    // re-entry before the crit is ever rolled.)
    assert(foes.filter((f, i) => f.hp < before[i]).length === 2,
      'the split carried on past its second bird');

    // A plain hit does not split. The lottery IS the mechanic, so a
    // version that carried on every blow would be a different hero.
    const plainBefore = weakest.hp;
    critPin = 0;
    Math.random = () => 0.999;
    const plain = Abilities.strike(rizzo, hit, 4000,
      { crit: true, dodge: false, reflect: false });
    Math.random = real;
    assert(!plain.crit, 'the fixture crit when it was meant to miss the roll');
    assert(weakest.hp === plainBefore, 'a shot that did not crit still split');
  } finally { Math.random = real; Battle.active = prev; }
});

// His hex raises what the second arrow is WORTH, not how often it
// flies: the frequency is his crit chance, which is gear, and a hex
// stacked on gear would pay twice for the same thing.
test('Rizzo: Called Shot carries the split at full strength', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  const real = Math.random;
  try {
    const hex = POSITIONALS.called_shot;
    assert(HEROES.rizzo.positional === hex, 'Rizzo is not on his own hex');
    assert(hex.position === POSITION.BACK, 'a bowbearer belongs at the back');

    const shoot = (onHex) => {
      const b = makeBattle();
      Battle.active = b;
      const r = place(b, HEROES.rizzo, TEAM.PLAYER, 4);
      if (!onHex) r.slot = b.playerSlots[1];
      assert(r.positionalActive() === onHex, 'the fixture put him on the wrong hex');
      r.effectiveStat = ((base) => function (stat) {
        return stat === 'critChance' ? 1 : base.call(this, stat);
      })(r.effectiveStat);
      const aim = roomy(place(b, DUMMIES.rat_knight, TEAM.ENEMY, 0), 60);
      const weak = roomy(place(b, DUMMIES.rat_knight, TEAM.ENEMY, 1), 60);
      [aim, weak].forEach((u) => {
        u.hookSources = () => [];
        u.dodgeChance = () => 0; u.reflectChance = () => 0;
      });
      weak.hp = Math.round(weak.maxHp * 0.20);
      const was = weak.hp;
      Math.random = () => 0;
      Abilities.strike(r, aim, 4000, { crit: true, dodge: false, reflect: false });
      Math.random = real;
      return was - weak.hp;
    };

    const off = shoot(false);
    const on = shoot(true);
    assert(off > 0 && on > 0, 'one of the shots never split');
    assert(on > off * 1.5,
      `the hex carried ${on} against ${off} off it -- wanted roughly double`);
  } finally { Math.random = real; Battle.active = prev; }
});

// The kit interlocks: the passive needs a crit, and his seven buys one
// outright. It is the only shot he has that is GUARANTEED to split.
test('Rizzo: The Long Shot always crits', () => {
  const shot = HEROES.rizzo.abilities.find((a) => a.id === 'rizzo_the_long_shot');
  assert(shot, 'The Long Shot is missing');
  const dmg = shot.effects.find((e) => e.type === 'damage');
  assert(dmg.critAdd >= 1, `critAdd is ${dmg.critAdd}, wanted a certainty`);

  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  const real = Math.random;
  try {
    const rizzo = place(battle, HEROES.rizzo, TEAM.PLAYER, 4);
    // No crit chance of his own, and every roll in strike maxed out.
    rizzo.effectiveStat = ((base) => function (stat) {
      return stat === 'critChance' ? 0 : base.call(this, stat);
    })(rizzo.effectiveStat);
    const aim = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 0), 60);
    const weak = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 60);
    [aim, weak].forEach((u) => {
      u.hookSources = () => [];
      u.dodgeChance = () => 0; u.reflectChance = () => 0;
    });
    weak.hp = Math.round(weak.maxHp * 0.20);
    const was = weak.hp;
    Math.random = () => 0.999;   // every gate refuses
    Abilities.execute(shot, rizzo, aim, battle);
    Math.random = real;
    assert(weak.hp < was,
      'the seven did not crit, so it did not split, on a hero with no crit chance');
  } finally { Math.random = real; Battle.active = prev; }
});

// The brood's second wall, and the opposite kind of one. Durn converts
// a blow into a mend, so the damage still happens and the sect pays for
// it afterwards; Mavros denies it. Crit immunity is a new axis -- until
// him nothing on the roster touched an INCOMING crit -- and it is the
// exact counter to the one thing a healing sect cannot heal through: a
// single blow arriving at 150%.
test('Mavros: the casque has no gap to find', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  const real = Math.random;
  try {
    const mavros = roomy(place(battle, HEROES.mavros, TEAM.PLAYER, 1), 20);
    mavros.dodgeChance = () => 0; mavros.reflectChance = () => 0;
    const back = roomy(place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 4), 20);
    const front = roomy(place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 2), 20);
    const centre = roomy(place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 0), 20);
    [back, front, centre].forEach((u) => {
      u.hookSources = () => [];
      u.dodgeChance = () => 0; u.reflectChance = () => 0;
    });
    assert(back.slot.position === POSITION.BACK &&
      front.slot.position === POSITION.FRONT &&
      centre.slot.position === POSITION.CENTER, 'the fixture seated them wrong');

    const foe = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    foe.hookSources = () => [];
    foe.effectiveStat = ((base) => function (stat) {
      return stat === 'critChance' ? 1 : base.call(this, stat);
    })(foe.effectiveStat);

    const swing = (victim) => {
      Math.random = () => 0;                    // every roll says yes
      try {
        return Abilities.strike(foe, victim, 500,
          { crit: true, dodge: false, reflect: false }).crit;
      } finally { Math.random = real; }
    };

    // Off his own hex, so what is under test is the passive alone.
    mavros.slot = battle.playerSlots[4];
    assert(swing(mavros) === false, 'the casque was cracked');
    assert(swing(back) === false, 'the bird behind him was cracked');
    assert(swing(front) === true,
      'the front rank was sheltered — the shelter is the BACK hexes');
    assert(swing(centre) === true,
      'the centre was sheltered off his hex — that is Gatepost, not the passive');

    // On the gate, the centre comes under the casque too.
    mavros.slot = battle.playerSlots[1];
    assert(mavros.positionalActive(), 'slot 1 is not a front hex');
    assert(swing(centre) === false, 'Gatepost did not reach the centre');
    assert(swing(front) === true, 'Gatepost swallowed the front rank as well');

    // Dead birds shelter nobody.
    mavros.hp = 0;
    assert(swing(centre) === true, 'a fallen casque was still holding the gate');
  } finally { Math.random = real; Battle.active = prev; }
});

// The roster's first taunt. The channel has been wired the whole time --
// the AI picks a taunter outright and Battle has a turn shape for the
// enemy it drew -- with nobody carrying it.
test('Mavros: Hold the Gate draws the field and braces for it', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const mavros = place(battle, HEROES.mavros, TEAM.PLAYER, 1);
    const mate = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 4);
    mate.hookSources = () => [];
    const foes = [0, 1].map((i) => place(battle, DUMMIES.rat_knight, TEAM.ENEMY, i));

    const gate = mavros.abilities.find((a) => a.def.id === 'mavros_hold_the_gate');
    assert(gate, 'Hold the Gate is missing');
    assert(gate.def.targeting === 'self',
      'a taunt is a blessing on the bird being looked at, not a hex on the ones looking');

    const defBefore = mavros.effectiveStat('def');
    Abilities.execute(gate.def, mavros, mavros, battle);

    assert(mavros.statusEffects.some((fx) => fx.stat === 'taunt'), 'nobody was drawn');
    assert(mavros.effectiveStat('def') > defBefore,
      'he drew the whole field without bracing for it');
    assert(!mate.statusEffects.some((fx) => fx.stat === 'taunt'),
      'the taunt landed on somebody else too');

    // The AI has to actually answer it: a taunter is picked outright.
    const drawn = AI.taunting([mavros, mate]);
    assert(drawn.length === 1 && drawn[0] === mavros,
      'the targeting layer did not single him out');
  } finally { Battle.active = prev; }
});

// The sect's first offensive support, and the hero who reads its books
// rather than adding to them. Two healers and a +60% ceiling on mends
// means the Sunbrood's real surplus is WASTE, and until Orien nothing
// anywhere in either pack pointed at the enemy.
//
// He does not heal, on purpose: the orb is filled by other people's
// spillage, so he is worth exactly as much as the healers beside him
// and nothing at all on his own.
test("Orien: the orb fills on what the brood wastes, not on what he does", () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const orien = place(battle, HEROES.orien, TEAM.PLAYER, 4);
    const healer = place(battle, HEROES.nemeris, TEAM.PLAYER, 0);
    const full = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
    full.hookSources = () => [];
    assert(!orien.orb, 'the orb did not open empty');

    // A mend on somebody already full is pure waste, and all of it lands
    // in the orb -- fired off ANOTHER bird's cast, which is the rule.
    const sunwarm = healer.abilities.find((a) => a.def.id === 'nemeris_sunwarm');
    assert(sunwarm, 'the fixture lost its healer');
    Abilities.execute(sunwarm.def, healer, full, battle);
    const wasted = Math.round(full.maxHp * 0.16 * (1 + healer.healingBoost(full)));
    assert(orien.orb > 0, 'the orb caught nothing off a teammate’s overheal');
    assert(Math.abs(orien.orb - wasted) <= 2,
      `the orb caught ${Math.round(orien.orb)} of a ${wasted} spill`);

    // A mend that was NEEDED is not waste and fills nothing.
    const held = orien.orb;
    full.hp = Math.round(full.maxHp * 0.10);
    Abilities.execute(sunwarm.def, healer, full, battle);
    assert(orien.orb === held, 'the orb filled off a mend that actually landed');

    // Capped against his own pool, not his attack stat.
    orien.orb = 0;
    for (let i = 0; i < 40; i++) {
      full.hp = full.maxHp;
      Abilities.execute(sunwarm.def, healer, full, battle);
    }
    assert(Math.abs(orien.orb - orien.maxHp * 0.15) < 1,
      `the orb held ${Math.round(orien.orb)}, wanted 15% of ${orien.maxHp}`);
  } finally { Battle.active = prev; }
});

// The payout: an ordinary blow, thrown once, and the orb is empty
// afterwards. Sibling to Balmor's bill and sharing its engine case --
// `store` names which bank a hero is emptying.
test('Orien: Let the Light Out spends the orb and leaves it empty', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  const real = Math.random;
  try {
    const orien = place(battle, HEROES.orien, TEAM.PLAYER, 4);
    orien.slot = battle.playerSlots[1];          // off his hex
    const foe = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 40);
    foe.hookSources = () => [];
    foe.dodgeChance = () => 0; foe.reflectChance = () => 0;
    const out = orien.abilities.find((a) => a.def.id === 'orien_let_the_light_out');
    assert(out, 'Let the Light Out is missing');

    // Empty orb, empty shot -- he is nothing without the healers.
    Math.random = () => 0.99;
    const dry = foe.hp;
    Abilities.execute(out.def, orien, foe, battle);
    assert(foe.hp === dry, 'an empty orb still hit for something');

    orien.orb = orien.maxHp * 0.15;
    const before = foe.hp;
    Abilities.execute(out.def, orien, foe, battle);
    Math.random = real;
    assert(foe.hp < before, 'a full orb hit for nothing');
    assert(!orien.orb, 'the orb was not emptied by spending it');

    // And Balmor's bill is untouched by sharing the case.
    const bill = HEROES.balmor.abilities.find((a) =>
      (a.effects || []).some((e) => e.type === 'spendPouch'));
    assert(bill, 'Balmor lost his bill');
    assert(!bill.effects.find((e) => e.type === 'spendPouch').store,
      'the bill was given a store name; it is meant to default to the pouch');
  } finally { Math.random = real; Battle.active = prev; }
});

// His hex, and the only lever that matters to a hero whose payout is
// one big stored blow: the thing standing between the orb and the enemy
// is armour.
test('Orien: Noon Angle finds the gap', () => {
  const hex = POSITIONALS.noon_angle;
  assert(HEROES.orien.positional === hex, 'Orien is not on his own hex');
  assert(hex.position === POSITION.BACK, 'the angle wants height');

  const shoot = (onHex) => {
    const battle = makeBattle();
    const prev = Battle.active;
    Battle.active = battle;
    const real = Math.random;
    try {
      const orien = place(battle, HEROES.orien, TEAM.PLAYER, 4);
      if (!onHex) orien.slot = battle.playerSlots[1];
      assert(orien.positionalActive() === onHex, 'the fixture seated him wrong');
      const foe = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 40);
      foe.hookSources = () => [];
      foe.dodgeChance = () => 0; foe.reflectChance = () => 0;
      orien.orb = orien.maxHp * 0.15;
      const out = orien.abilities.find((a) => a.def.id === 'orien_let_the_light_out');
      const before = foe.hp;
      Math.random = () => 0.99;
      Abilities.execute(out.def, orien, foe, battle);
      return before - foe.hp;
    } finally { Math.random = real; Battle.active = prev; }
  };

  const off = shoot(false), on = shoot(true);
  assert(off > 0 && on > 0, 'one of the shots landed nothing');
  assert(on > off, `the angle carried ${on} against ${off} off it`);
});

// The bank readout. Both banks were invisible until now -- the only
// feedback was a floating number as they filled -- so a player could
// not tell mid-fight whether the button was worth nine hundred or
// nothing. bankState is what the renderer draws; it has to agree with
// what the fill hook actually did.
test('bank readout: what the bar shows is what the bank holds', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    // A hero with no bank shows no bar at all.
    const plain = place(battle, HEROES.aster, TEAM.PLAYER, 4);
    assert(plain.bankState() === null, 'a hero with no bank offered a readout');

    // Balmor's bill, filled by taking a blow.
    const balmor = roomy(place(battle, HEROES.balmor, TEAM.PLAYER, 1), 5);
    balmor.dodgeChance = () => 0; balmor.reflectChance = () => 0;
    const foe = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    foe.hookSources = () => [];
    assert(balmor.bankState().held === 0, 'the bill did not open empty');
    assert(balmor.bankState().frac === 0, 'an empty bill drew a filled bar');

    const real = Math.random;
    Math.random = () => 0.99;
    try { Abilities.strike(foe, balmor, 400, { dodge: false, reflect: false }); }
    finally { Math.random = real; }
    let st = balmor.bankState();
    assert(st.held > 0 && st.held === balmor.pouch,
      `the bar shows ${st.held} and the bill holds ${balmor.pouch}`);
    assert(st.label === 'BILL', `the bar is labelled ${st.label}`);

    // The ceiling the bar draws against is the descriptor's, and the
    // hook fills to exactly that -- one number, not two copies.
    balmor.pouch = balmor.maxHp;                 // overfull by any measure
    st = balmor.bankState();
    assert(st.frac === 1, `an overfull bill drew ${st.frac} of a bar`);
    assert(Math.abs(st.cap - balmor.maxHp * 0.125) < 1e-6,
      'the bar is drawn against a different ceiling than the card names');

    // And the fill hook takes its ceiling from the same descriptor.
    balmor.pouch = 0;
    Math.random = () => 0.99;
    try {
      for (let i = 0; i < 40; i++) {
        balmor.hp = balmor.maxHp;
        Abilities.strike(foe, balmor, 4000, { dodge: false, reflect: false });
      }
    } finally { Math.random = real; }
    assert(Math.abs(balmor.pouch - balmor.maxHp * 0.125) < 1,
      `the hook filled to ${Math.round(balmor.pouch)}, the bar caps at ` +
      `${Math.round(balmor.maxHp * 0.125)}`);
  } finally { Battle.active = prev; }
});

// The sect's only UNCONDITIONAL dealer, which turned out to be the hole
// once the other four were written: Aurek pays health, Aster has to be
// left alone to ramp, Rizzo rolls for it, Orien is nothing without two
// healers. Solari is the floor under the clauses, and her rider reads
// an axis nothing on the roster has scaled off before -- the ENEMY's
// blessings.
test('Solari: the mirror is paid for what it is shown', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const solari = place(battle, HEROES.solari, TEAM.PLAYER, 0);
    const foe = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 40);
    foe.hookSources = () => [];

    assert(Math.abs(solari.damageDealtMult(foe) - 1) < 1e-9,
      'a bare enemy already paid her something');

    const bless = (n) => {
      foe.statusEffects = [];
      for (let i = 0; i < n; i++) {
        foe.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.05, turns: 5 });
      }
      return solari.damageDealtMult(foe);
    };
    assert(Math.abs(bless(1) - 1.20) < 1e-9, `one blessing paid ${bless(1)}`);
    assert(Math.abs(bless(2) - 1.40) < 1e-9, `two paid ${bless(2)}`);
    assert(Math.abs(bless(3) - 1.60) < 1e-9, `three paid ${bless(3)}`);
    // Capped at three: an enemy party stacking blessings on one body
    // must not hand her a multiplier no card on the roster offers.
    assert(Math.abs(bless(9) - 1.60) < 1e-9, `nine paid ${bless(9)}, wanted the cap`);

    // Only blessings count -- not wards, not heals-over-time, not
    // bubbles -- so what pays her and what her seven tears off are the
    // same list.
    foe.statusEffects = [];
    foe.addStatusEffect({ kind: 'shield', amount: 500, turns: 3, source: foe });
    foe.addStatusEffect({ kind: 'hot', amount: 50, turns: 3, source: foe });
    foe.addStatusEffect({ kind: 'bubble', turns: 3, source: foe });
    assert(Math.abs(solari.damageDealtMult(foe) - 1) < 1e-9,
      'a ward or a heal-over-time was counted as a blessing');
  } finally { Battle.active = prev; }
});

// The order IS the skill: she is paid for every blessing the target is
// wearing and only THEN takes them off, so the fat buffed tank is both
// the best target and the one who stops being a problem afterwards.
test('Solari: Turn the Glass is paid first and strips second', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  const real = Math.random;
  try {
    const solari = maxSkill(place(battle, HEROES.solari, TEAM.PLAYER, 0), 2);
    const glass = solari.abilities.find((a) => a.def.id === 'solari_turn_the_glass');
    assert(glass, 'Turn the Glass is missing');

    const hit = (blessings) => {
      const foe = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 200);
      foe.hookSources = () => [];
      foe.dodgeChance = () => 0; foe.reflectChance = () => 0;
      foe.debuffResistance = () => 0;
      for (let i = 0; i < blessings; i++) {
        foe.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.01, turns: 9 });
      }
      const before = foe.hp;
      Math.random = () => 0.01;                 // gates open, no crit lottery
      try { Abilities.execute(glass.def, solari, foe, battle); }
      finally { Math.random = real; battle.units = battle.units.filter((u) => u !== foe); }
      return { dealt: before - foe.hp, left: foe.statusEffects.length };
    };

    const bare = hit(0);
    const laden = hit(3);
    assert(bare.dealt > 0 && laden.dealt > 0, 'the glass landed nothing');
    assert(laden.dealt > bare.dealt * 1.5,
      `three blessings paid ${laden.dealt} against ${bare.dealt} bare — ` +
      'she was billed after the strip, not before it');
    assert(laden.left === 0, `${laden.left} blessings survived the glass`);
  } finally { Math.random = real; Battle.active = prev; }
});

// Her hex, on the same channel as Tumble's Chime Tax and paid out
// differently: his strips buy turn meter, hers buy cooldown. It is the
// filler's strip that makes it an engine rather than a thing that
// happens twice a fight.
test('Solari: Heliograph turns a torn blessing into a cooldown', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  const real = Math.random;
  try {
    const hex = POSITIONALS.heliograph;
    assert(HEROES.solari.positional === hex, 'Solari is not on her own hex');
    assert(hex.position === POSITION.CENTER, 'the angle is held from the middle');

    const solari = place(battle, HEROES.solari, TEAM.PLAYER, 0);
    assert(solari.positionalActive(), 'slot 0 is not a center hex');
    const foe = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 200);
    foe.hookSources = () => [];
    foe.dodgeChance = () => 0; foe.reflectChance = () => 0;
    foe.debuffResistance = () => 0;
    for (let i = 0; i < 2; i++) {
      foe.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.05, turns: 9 });
    }

    solari.abilities.forEach((a) => { a.cooldownRemaining = 4; });
    const filler = solari.abilities.find((a) => a.def.id === 'solari_catch_the_light');
    filler.cooldownRemaining = 0;               // the one she is actually casting
    Math.random = () => 0.01;
    Abilities.execute(filler.def, solari, foe, battle);
    Math.random = real;

    const cds = solari.abilities.map((a) => a.cooldownRemaining);
    assert(cds[1] === 3 && cds[2] === 3,
      `one torn blessing left her cooldowns at ${cds.join('/')}, wanted a turn off each`);

    // No strip, no refund -- and asserted on what the hook RETURNS,
    // because the arithmetic alone cannot see it: taking zero turns off
    // a cooldown is indistinguishable from not running. What the guard
    // actually prevents is the ↺ float, a piece of feedback telling the
    // player something happened when nothing did.
    foe.statusEffects = [];
    solari.abilities.forEach((a) => { a.cooldownRemaining = 4; });
    assert(hex.hooks.onStripBuff(solari, { count: 0 }) === null,
      'the mirror announced a refund for tearing off nothing');
    assert(hex.hooks.onStripBuff(solari, {}) === null,
      'the mirror announced a refund with no strip reported at all');
    assert(solari.abilities[1].cooldownRemaining === 4,
      'a strip of nothing still moved a cooldown');
    const paid = hex.hooks.onStripBuff(solari, { count: 2 });
    assert(paid && paid.floats && paid.floats.length === 1,
      'a real strip said nothing to the player');
    assert(solari.abilities[1].cooldownRemaining === 2,
      `two blessings took the cooldown to ${solari.abilities[1].cooldownRemaining}`);
  } finally { Math.random = real; Battle.active = prev; }
});

// The ninth bird, and the sect's thesis written as one hero: the
// Sunbrood does not win the first exchange, it wins the eighth. Her
// growth goes onto BASE attack rather than into statusEffects, and
// three things fall out of that which are the whole design.
test('Nestora: what she raises cannot be taken', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const nestora = place(battle, HEROES.nestora, TEAM.PLAYER, 4);
    nestora.slot = battle.playerSlots[1];        // off her hex: the 30% cap
    const bird = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 2);
    bird.hookSources = () => [];
    const opened = bird.effectiveStat('atk');

    // It climbs on her turns, 5% at a time, against the statline the
    // bird walked in with rather than against itself.
    nestora.startTurn(battle);
    assert(Math.abs(bird.raisedAtk - 0.05) < 1e-9, `one turn raised ${bird.raisedAtk}`);
    assert(bird.effectiveStat('atk') > opened, 'the growth did not reach the stat');
    for (let i = 0; i < 20; i++) nestora.startTurn(battle);
    assert(Math.abs(bird.raisedAtk - 0.30) < 1e-9,
      `the nest raised ${bird.raisedAtk} off her hex, wanted a ceiling of 0.30`);
    assert(Math.abs(bird.effectiveStat('atk') - Math.round(opened * 1.30)) <= 1,
      `${opened} grew to ${bird.effectiveStat('atk')}, wanted 30% on`);

    // It is not a status effect, so no strip on the roster can reach it.
    assert(!bird.statusEffects.some((fx) => fx.kind === 'buff'),
      'the growth was handed out as an ordinary blessing after all');
    const solari = place(battle, HEROES.solari, TEAM.PLAYER, 0);
    const grown = bird.effectiveStat('atk');
    Abilities.applyEffect({ type: 'stripBuffs', count: 9 }, solari, bird);
    assert(bird.effectiveStat('atk') === grown, 'a strip took what the nest raised');

    // And death does not take it. Unit.revive wipes statusEffects, so a
    // bird raised by an ordinary buffer comes back with nothing.
    bird.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.5, turns: 5 });
    const buffed = bird.effectiveStat('atk');
    bird.hp = 0;
    bird.revive(0.5, nestora);
    assert(bird.alive, 'the fixture did not raise him');
    assert(bird.effectiveStat('atk') < buffed, 'the ordinary blessing survived death');
    assert(bird.effectiveStat('atk') === grown,
      `he came back on ${bird.effectiveStat('atk')}, not the ${grown} she raised him to`);
  } finally { Battle.active = prev; }
});

// Her filler concentrates on one bird what the passive spreads thin
// across the whole brood — same verb, opposite distribution, and ONE
// shared ceiling, so the player is choosing who the carry is rather
// than whether to grow at all.
test('Nestora: Feed the Nest spends from the same ceiling', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const nestora = place(battle, HEROES.nestora, TEAM.PLAYER, 4);
    nestora.slot = battle.playerSlots[1];
    const bird = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 2);
    bird.hookSources = () => [];
    const feed = nestora.abilities.find((a) => a.def.id === 'nestora_feed_the_nest');
    assert(feed, 'Feed the Nest is missing');

    Abilities.execute(feed.def, nestora, bird, battle);
    assert(Math.abs(bird.raisedAtk - 0.10) < 1e-9,
      `a beakful was worth ${bird.raisedAtk}, wanted 0.10`);

    // Two more fill it, and the fourth finds nothing left -- the skill
    // and the passive are not two budgets.
    Abilities.execute(feed.def, nestora, bird, battle);
    Abilities.execute(feed.def, nestora, bird, battle);
    assert(Math.abs(bird.raisedAtk - 0.30) < 1e-9, `three beakfuls made ${bird.raisedAtk}`);
    const full = bird.effectiveStat('atk');
    Abilities.execute(feed.def, nestora, bird, battle);
    nestora.startTurn(battle);
    assert(bird.effectiveStat('atk') === full,
      'a full bird kept growing past the ceiling');
  } finally { Battle.active = prev; }
});

// Her hex lifts the CEILING, not the rate. The rate is her turn coming
// round, which the sect already buys with speed at 2pc, and paying for
// that twice is the trap this whole roster is written to avoid.
test('Nestora: The High Nest raises the ceiling to +50%', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const hex = POSITIONALS.the_high_nest;
    assert(HEROES.nestora.positional === hex, 'Nestora is not on her own hex');
    assert(hex.position === POSITION.BACK, 'the nest goes at the back');

    const nestora = place(battle, HEROES.nestora, TEAM.PLAYER, 4);
    assert(nestora.positionalActive(), 'slot 4 is not a back hex');
    const bird = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 2);
    bird.hookSources = () => [];
    for (let i = 0; i < 30; i++) nestora.startTurn(battle);
    assert(Math.abs(bird.raisedAtk - 0.50) < 1e-9,
      `on the hex the nest reached ${bird.raisedAtk}, wanted 0.50`);
  } finally { Battle.active = prev; }
});

// The Hollowbone pack, written before a single bird of the sect exists.
// It has less free ground than any other on the roster -- the dark
// ELEMENT already sells whether a curse lands and how long it lasts, and
// the Nightflowers are already a dark sect of debuffs and death -- so
// all three tiers are about how hard an affliction BITES, which is the
// one axis neither of those touches.
//
// The tiers are driven directly rather than through a fielded sect: the
// roster is empty by design, so there is nobody to field.
test('Hollowbone 2pc Rigor: speed spent as debuff depth', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    // The real tier, off the sect, so the test measures the pack rather
    // than a copy of it written in the test file.
    const rigor = RACES.sectTiers('hollowbone', 2).find((t) => t.name === 'Rigor');
    assert(rigor, 'Rigor is not in the Hollowbone pack');

    const caster = place(battle, HEROES.aster, TEAM.PLAYER, 4);
    const foe = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 40);
    foe.hookSources = () => [];
    foe.debuffResistance = () => 0;

    const land = (spd) => {
      foe.statusEffects = [];
      caster.speed = spd;
      const real = Math.random;
      Math.random = () => 0.01;
      try {
        Abilities.applyEffect(
          { type: 'debuff', stat: 'atk', mult: 0.80, turns: 3 }, caster, foe);
      } finally { Math.random = real; }
      const fx = foe.statusEffects.find((x) => x.kind === 'debuff' && x.stat === 'atk');
      assert(fx, `nothing landed at ${spd} speed`);
      return fx.mult;
    };

    // Off the pack: the printed number, untouched.
    assert(Math.abs(land(140) - 0.80) < 1e-9, 'the bare hex was not 0.80');

    caster.passives.push(rigor);
    // Under 100 buys nothing; the rungs are whole steps of 20 over it.
    assert(Math.abs(land(96) - 0.80) < 1e-9, 'a slow bird was paid a rung');
    assert(Math.abs(land(119) - 0.80) < 1e-9, '119 bought a rung it had not reached');
    assert(Math.abs(land(120) - 0.75) < 1e-9, `120 landed ${land(120)}, wanted 0.75`);
    assert(Math.abs(land(160) - 0.65) < 1e-9, `160 landed ${land(160)}, wanted 0.65`);

    // Severity moves AWAY from neutral, so the same rung reads correctly
    // on an amplification: a x1.20 vulnerability rises rather than falls.
    foe.statusEffects = [];
    caster.speed = 160;
    const real = Math.random;
    Math.random = () => 0.01;
    try {
      Abilities.applyEffect(
        { type: 'debuff', stat: 'damageTaken', mult: 1.20, turns: 3 }, caster, foe);
    } finally { Math.random = real; }
    const mark = foe.statusEffects.find((x) => x.stat === 'damageTaken');
    assert(mark && Math.abs(mark.mult - 1.35) < 1e-9,
      `the mark deepened to ${mark && mark.mult}, wanted 1.35`);
  } finally { Battle.active = prev; }
});

// Carried ON the curse rather than read off the field, which is what
// makes it affordable: effectiveStat runs on every meter tick and every
// damage calculation. It also lays no second icon -- the drag rides on
// the affliction already showing, which is the standing rule.
test('Hollowbone 3pc Deadweight: every curse they land drags', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  const real = Math.random;
  try {
    const caster = place(battle, HEROES.aster, TEAM.PLAYER, 4);
    const foe = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 40);
    foe.hookSources = () => [];
    foe.debuffResistance = () => 0;
    const opened = foe.effectiveStat('speed');

    const curse = () => {
      Math.random = () => 0.01;
      try {
        Abilities.applyEffect(
          { type: 'debuff', stat: 'atk', mult: 0.90, turns: 5 }, caster, foe);
      } finally { Math.random = real; }
    };

    // Off the pack, a hex is just a hex.
    curse();
    assert(foe.effectiveStat('speed') === opened, 'a bare hex dragged');
    foe.statusEffects = [];

    // The real tier, off the sect. A locally written copy would have
    // measured the test file rather than the pack -- moving the pack's
    // 3% to 6% left the first draft passing, which is exactly the
    // failure a sabotage sweep is for.
    const deadweight = RACES.sectTiers('hollowbone', 3)
      .find((t) => t.name === 'Deadweight');
    assert(deadweight, 'Deadweight is not in the Hollowbone pack');
    caster.passives.push(deadweight);
    curse();
    assert(foe.effectiveStat('speed') === Math.round(opened * 0.97),
      `one curse left ${foe.effectiveStat('speed')} of ${opened}`);
    curse(); curse();
    assert(foe.effectiveStat('speed') === Math.round(opened * 0.97 ** 3),
      `three curses left ${foe.effectiveStat('speed')} of ${opened}`);

    // No second icon: the drag is on the hexes already there.
    assert(foe.statusEffects.length === 3,
      `${foe.statusEffects.length} statuses for three curses — it laid its own`);
    assert(foe.statusEffects.every((fx) => fx.stat === 'atk'),
      'a speed debuff was laid alongside the hex');

    // Poisons drag too. A tier that skipped the DoT half would read as a
    // bug to anybody playing a poison kit.
    foe.statusEffects = [];
    Abilities.applyEffect({ type: 'dot', mult: 0.3, turns: 3 }, caster, foe);
    assert(foe.statusEffects.some((fx) => fx.kind === 'dot' && fx.speedBite > 0),
      'a poison landed without its weight');
    assert(foe.effectiveStat('speed') < opened, 'a poison did not drag');

    // And it lifts when the curse does.
    foe.statusEffects = [];
    assert(foe.effectiveStat('speed') === opened, 'the drag outlived the curse');
  } finally { Math.random = real; Battle.active = prev; }
});

// The answer to what a debuff party actually loses to, which is not
// damage -- it is an enemy healer outrunning them.
test('Hollowbone 4pc Dry Bones: a cursed enemy mends less', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const hollow = place(battle, HEROES.aster, TEAM.PLAYER, 4);
    const foe = roomy(place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 40);
    foe.hookSources = () => [];
    const mate = roomy(place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1), 40);
    mate.hookSources = () => [];

    const mend = (unit) => {
      unit.hp = Math.round(unit.maxHp * 0.10);
      const before = unit.hp;
      unit.heal(1000, unit);
      return unit.hp - before;
    };

    // Off the pack, and cursed: the full mend.
    foe.addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.9, turns: 5 });
    assert(mend(foe) === 1000, `a bare curse cut the mend to ${mend(foe)}`);

    const dryBones = RACES.sectTiers('hollowbone', 4).find((t) => t.name === 'Dry Bones');
    assert(dryBones, 'Dry Bones is not in the Hollowbone pack');
    hollow.passives.push(dryBones);
    assert(mend(foe) === 700, `a cursed enemy recovered ${mend(foe)} of 1000`);

    // Uncursed enemies are untouched -- it is the affliction that does
    // it, not the sect merely being on the field.
    foe.statusEffects = [];
    assert(mend(foe) === 1000, `an uncursed enemy recovered ${mend(foe)}`);

    // And it never turns on its own side. A Hollowbone bird carrying a
    // hex of its own must not be reading its own party's tier.
    mate.addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.9, turns: 5 });
    assert(mend(mate) === 1000, `the pack cut its own ally's mend to ${mend(mate)}`);
  } finally { Battle.active = prev; }
});

// The sect itself. It was founded, numbered and packed before a single
// bird existed; the `founding` flag came off the day Necros landed and
// the roster test went back to demanding members.
test('Hollowbone: numbered, shaped and packed', () => {
  const sect = RACES.SECTS.hollowbone;
  assert(sect && sect.number === 12, 'the Hollowbones are not No. 12');
  assert(sect.race === 'avian', `the Hollowbones are ${sect.race}`);
  assert(!sect.founding && sect.members.length > 0,
    'the order is filling and is still marked founding');
  // Light and dark share an order structure.
  assert(JSON.stringify(sect.shape) === JSON.stringify(RACES.SECTS.sunbrood.shape),
    'the dark order is not on the same shape as the light one');
  const names = RACES.sectTiers('hollowbone', 4).map((t) => t.name);
  assert(names.join() === 'Rigor,Deadweight,Dry Bones',
    `the pack reads ${names.join(', ')}`);
});

// Seat a unit the way a real battle does -- through placeUnit, so the
// HEX knows who is on it. The plain `place` helper above only sets
// unit.slot, which is enough for a positional and not enough for
// anything that has to find an empty square.
function seatOn(battle, def, team, slotIdx, level = 30) {
  const u = new Unit(def, team, { level, stars: def.rarity || 3 });
  battle.placeUnit(u, slotIdx);
  return u;
}

// Necros brings bodies onto the board that were never on the roster --
// the only hero in the game who does. The bodies live in SUMMONS rather
// than HEROES, and that separation is load-bearing: everything that
// walks the roster reads HEROES, so a thing you can never own, level,
// gear or seat before a fight would need an exemption in every one of
// them.
test('Summons are not heroes and never reach the roster', () => {
  for (const id of Object.keys(SUMMONS)) {
    assert(!HEROES[id], `${id} is in HEROES and will turn up in the gacha`);
    assert(SUMMONS[id].summon === true, `${id} is not marked as a summon`);
  }
  // And every summon a skill names actually exists, or the button is a
  // no-op that logs nothing and looks like a bug.
  for (const h of Object.values(HEROES)) {
    for (const a of (h.abilities || [])) {
      for (const e of (a.effects || [])) {
        if (e.type !== 'summon') continue;
        assert(SUMMONS[e.id], `${h.id}/${a.id} raises '${e.id}', which does not exist`);
        assert(e.fallback, `${h.id}/${a.id} has no branch for a full board`);
      }
    }
  }
});

test('Necros: a body gets up, priced off the bird that raised it', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const necros = seatOn(battle, HEROES.necros, TEAM.PLAYER, 0);
    necros.slot = battle.playerSlots[3];        // off his hex: the bare share
    seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    const call = necros.abilities.find((a) => a.def.id === 'necros_carrion_call');
    assert(call, 'Second Legs is missing');
    assert(call.def.targeting === 'self',
      'the summon is self-targeted so its full-board branch can pick its own host');

    const before = battle.units.length;
    Abilities.execute(call.def, necros, necros, battle);
    assert(battle.units.length === before + 1, 'nothing got up');
    const body = battle.units[battle.units.length - 1];
    assert(body.def.id === 'crossowary_undead', `${body.def.id} got up instead`);
    assert(body.team === TEAM.PLAYER, 'it came up on the wrong side');
    assert(body.slot && body.slot.unit === body, 'it is not standing on a hex');
    assert(body.slot.position === POSITION.FRONT,
      'a raised body goes where the body was — in the way');

    // Its statline is a SHARE of his, which is what makes every point of
    // gear and every star on Necros an investment in it too.
    assert(body.maxHp === Math.round(necros.maxHp * 0.60),
      `${body.maxHp} health against ${Math.round(necros.maxHp * 0.60)}`);
    assert(body.baseAtk === Math.round(necros.effectiveStat('atk') * 0.55),
      `${body.baseAtk} attack against ${Math.round(necros.effectiveStat('atk') * 0.55)}`);
    assert(body.turnMeter === 0, 'it arrived already queued to act');
    assert(body.raisedBy === necros, 'nobody owns it');

    // The second button raises the other one, on the next hex along.
    const bill = necros.abilities.find((a) => a.def.id === 'necros_the_long_bill');
    Abilities.execute(bill.def, necros, necros, battle);
    const second = battle.units[battle.units.length - 1];
    assert(second.def.id === 'heron_undead', `${second.def.id} got up second`);
    assert(second.slot !== body.slot, 'both bodies were stood on one hex');
  } finally { Battle.active = prev; }
});

// A corpse is CONSUMED, and that is a real cost rather than flavour: a
// bird pulled apart for parts can no longer be raised by Nestora,
// revived by Emily, or brought back by anything else.
test('Necros: a body in the way is taken apart for the one going up', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const necros = seatOn(battle, HEROES.necros, TEAM.PLAYER, 0);
    const fallen = seatOn(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
    fallen.hookSources = () => [];
    fallen.hp = 0;
    assert(!fallen.alive, 'the fixture did not put him down');
    // Fill every other hex, so the corpse's is the only one going spare.
    [2, 3, 4, 5, 6].forEach((i) => {
      const u = seatOn(battle, DUMMIES.rat_brawler, TEAM.PLAYER, i);
      u.hookSources = () => [];
    });
    seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);

    const call = necros.abilities.find((a) => a.def.id === 'necros_carrion_call');
    Abilities.execute(call.def, necros, necros, battle);

    const body = battle.units.find((u) => u.def.id === 'crossowary_undead');
    assert(body, 'nothing got up on the corpse');
    assert(body.slot.index === 1, `it stood on hex ${body.slot.index}, not the corpse's`);
    assert(!battle.units.includes(fallen),
      'the corpse is still on the board — it can still be revived');
    assert(fallen.slot === null, 'the corpse still holds a hex');
  } finally { Battle.active = prev; }
});

// The full-board branch, and the half that makes the hero. The power
// gets out either way.
test('Necros: with nowhere to stand, it goes into the hardest hitter', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const necros = seatOn(battle, HEROES.necros, TEAM.PLAYER, 0);
    const mates = [1, 2, 3, 4, 5, 6].map((i) => {
      const u = seatOn(battle, DUMMIES.rat_brawler, TEAM.PLAYER, i);
      u.hookSources = () => [];
      return u;
    });
    seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    // One of them is plainly the party's swing, and one is nearly dead.
    const hitter = mates[2];
    hitter.baseAtk *= 4;
    const wounded = mates[0];
    wounded.hp = Math.round(wounded.maxHp * 0.05);

    const before = battle.units.length;
    const hp = hitter.hp;
    const call = necros.abilities.find((a) => a.def.id === 'necros_carrion_call');
    Abilities.execute(call.def, necros, necros, battle);

    assert(battle.units.length === before, 'something got up on a full board');
    assert(hitter.statusEffects.some((fx) => fx.kind === 'buff' && fx.stat === 'atk'),
      'the hardest hitter was not empowered');
    assert(hitter.statusEffects.some((fx) => fx.kind === 'debuff' && fx.stat === 'def'),
      'the guard was not opened');
    assert(hitter.hp === hp - Math.round(hp * 0.30),
      `it took ${hp - hitter.hp} of a 30% cut on ${hp}`);
    // Never the most-wounded ally, which is what a naive targeting layer
    // would have picked, and never Necros himself.
    assert(wounded.hp === Math.round(wounded.maxHp * 0.05),
      'the dying ally was picked and cut');
    assert(!necros.statusEffects.length, 'the summoner possessed himself');

    // And it cannot kill, however thin the host is -- not because
    // anything clamps it but because a third of what is left is never
    // all of what is left. Driven from one health, which is the
    // worst case there is.
    hitter.hp = 1;
    const bill = necros.abilities.find((a) => a.def.id === 'necros_the_long_bill');
    Abilities.execute(bill.def, necros, necros, battle);
    assert(hitter.alive && hitter.hp === 1, `the blessing left its host on ${hitter.hp}`);
  } finally { Battle.active = prev; }
});

// Slot one counts his own side, which is the interlock: the thing he
// digs up makes the swing he was already making land harder. Every
// other crowd term in the engine counts the enemy.
test('Necros: The Standing Count grows with the flock, raised included', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  const real = Math.random;
  try {
    const necros = seatOn(battle, HEROES.necros, TEAM.PLAYER, 0);
    const foe = roomy(seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 400);
    foe.hookSources = () => [];
    foe.dodgeChance = () => 0; foe.reflectChance = () => 0;
    const count = necros.abilities.find((a) => a.def.id === 'necros_the_standing_count');

    const swing = () => {
      const was = foe.hp;
      Math.random = () => 0.99;
      try { Abilities.execute(count.def, necros, foe, battle); }
      finally { Math.random = real; }
      return was - foe.hp;
    };

    const alone = swing();
    const mate = seatOn(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 2);
    mate.hookSources = () => [];
    const pair = swing();
    assert(pair > alone, `one ally added nothing (${alone} then ${pair})`);

    // A raised body counts. It is a living unit on his side, and that is
    // the whole point of the term.
    const call = necros.abilities.find((a) => a.def.id === 'necros_carrion_call');
    Abilities.execute(call.def, necros, necros, battle);
    assert(battle.units.some((u) => u.def.id === 'crossowary_undead'), 'nothing got up');
    const raised = swing();
    assert(raised > pair, `the raised body paid nothing (${pair} then ${raised})`);

    // And it shrinks when the flock does, which is what makes him weak
    // in exactly the fight he is losing.
    mate.hp = 0;
    assert(swing() < raised, 'a death cost him nothing');

    // It counts HIS side and nobody else's. Asserted absolutely rather
    // than by comparison: every check above is relative, and a version
    // counting the whole field would add the same constant to all of
    // them and slip straight through.
    const held = swing();
    const extra = seatOn(battle, DUMMIES.rat_archer, TEAM.ENEMY, 3);
    extra.hookSources = () => [];
    assert(swing() === held,
      'a fresh ENEMY changed the count — it is reading the whole field');
  } finally { Math.random = real; Battle.active = prev; }
});

// His hex pays the BODIES rather than the bird, and his passive moves
// them on his own clock -- which is what separates a summoner from a
// hero who leaves things lying around.
test('Necros: Gravecircle and the strings', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const hex = POSITIONALS.gravecircle;
    assert(HEROES.necros.positional === hex, 'Necros is not on his own hex');
    assert(hex.position === POSITION.CENTER, 'the circle is drawn in the middle');

    const raise = (onHex) => {
      const b = makeBattle();
      Battle.active = b;
      const n = seatOn(b, HEROES.necros, TEAM.PLAYER, 0);
      if (!onHex) { b.playerSlots[0].unit = null; n.slot = b.playerSlots[3]; }
      assert(n.positionalActive() === onHex, 'the fixture seated him wrong');
      seatOn(b, DUMMIES.rat_knight, TEAM.ENEMY, 1);
      const call = n.abilities.find((a) => a.def.id === 'necros_carrion_call');
      Abilities.execute(call.def, n, n, b);
      return b.units.find((u) => u.def.id === 'crossowary_undead');
    };
    const off = raise(false);
    const on = raise(true);
    assert(off && on, 'one of the bodies never got up');
    assert(on.maxHp > off.maxHp * 1.2,
      `the circle raised ${on.maxHp} against ${off.maxHp} outside it`);

    // The strings: his turn moves his dead, and only his.
    Battle.active = battle;
    const necros = seatOn(battle, HEROES.necros, TEAM.PLAYER, 0);
    seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    const call = necros.abilities.find((a) => a.def.id === 'necros_carrion_call');
    Abilities.execute(call.def, necros, necros, battle);
    const body = battle.units.find((u) => u.def.id === 'crossowary_undead');
    const stranger = seatOn(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 5);
    stranger.hookSources = () => [];
    body.turnMeter = 0;
    stranger.turnMeter = 0;
    necros.startTurn(battle);
    assert(body.turnMeter === CONFIG.TURN_METER_MAX * 0.20,
      `the raised body gained ${body.turnMeter}`);
    assert(stranger.turnMeter === 0, 'the strings pulled on somebody else’s bird');
  } finally { Battle.active = prev; }
});

// The sect's only sustain, and she does it without a heal in her kit: a
// ward is health that never left. Her passive is a ward with a
// CONDITIONAL duration, which nothing else on the roster has -- every
// other shield on the board counts down whatever is happening to the
// bird wearing it.
test('Click: the bell does not stop for the dying', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const click = seatOn(battle, HEROES.click, TEAM.PLAYER, 0);
    click.slot = battle.playerSlots[3];         // off her hex: the bare ward
    const ally = seatOn(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
    ally.hookSources = () => [];
    const bell = click.abilities.find((a) => a.def.id === 'click_first_bell');
    assert(bell, 'First Bell is missing');

    // Priced off HER pool, not her attack.
    Abilities.execute(bell.def, click, ally, battle);
    const ward = ally.statusEffects.find((fx) => fx.kind === 'shield');
    assert(ward, 'no ward went up');
    assert(ward.amount === Math.round(click.maxHp * 0.12),
      `the ward is ${ward.amount}, wanted 12% of ${click.maxHp}`);
    assert(ward.turns === 2, `the ward runs ${ward.turns} turns`);

    // Healthy: it counts down like anybody else's.
    ally.hp = ally.maxHp;
    ally.tickStatusEffects();
    assert(ward.turns === 1, `a healthy bird's ward went to ${ward.turns}`);

    // Under half: it stops counting, however many turns go by.
    ally.hp = Math.round(ally.maxHp * 0.40);
    for (let i = 0; i < 10; i++) ally.tickStatusEffects();
    assert(ally.statusEffects.includes(ward), 'the ward ran out on a dying bird');
    assert(ward.turns === 1, `the held ward drifted to ${ward.turns}`);

    // Back over half and the clock restarts.
    ally.hp = ally.maxHp;
    ally.tickStatusEffects();
    assert(!ally.statusEffects.includes(ward), 'the ward never expired again');

    // Only hers. A ward from anybody else counts down as normal.
    const other = seatOn(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 2);
    other.hookSources = () => [];
    ally.hp = Math.round(ally.maxHp * 0.10);
    ally.addShield(500, 2, other);
    for (let i = 0; i < 5; i++) ally.tickStatusEffects();
    assert(!ally.statusEffects.some((fx) => fx.kind === 'shield'),
      'somebody else’s ward was held open by Click’s passive');
  } finally { Battle.active = prev; }
});

// Her hex widens the ward rather than lengthening it: the LENGTH is
// already the passive's job, and a hex paying the same axis twice is
// the compounding trap on a single hero.
test('Click: Long Peal widens the ward, it does not hold it', () => {
  const hex = POSITIONALS.long_peal;
  assert(HEROES.click.positional === hex, 'Click is not on her own hex');
  assert(hex.position === POSITION.CENTER, 'a bell is rung from the middle of the room');

  const ring = (onHex) => {
    const battle = makeBattle();
    const prev = Battle.active;
    Battle.active = battle;
    try {
      const click = seatOn(battle, HEROES.click, TEAM.PLAYER, 0);
      if (!onHex) click.slot = battle.playerSlots[3];
      assert(click.positionalActive() === onHex, 'the fixture seated her wrong');
      const ally = seatOn(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
      ally.hookSources = () => [];
      const bell = click.abilities.find((a) => a.def.id === 'click_first_bell');
      Abilities.execute(bell.def, click, ally, battle);
      return ally.statusEffects.find((fx) => fx.kind === 'shield');
    } finally { Battle.active = prev; }
  };
  const off = ring(false);
  const on = ring(true);
  assert(off && on, 'one of the wards never went up');
  // Within a point: the hex multiplies the ward at full precision and
  // rounds once, so it is not round(round(base) * 1.3).
  assert(Math.abs(on.amount - off.amount * 1.30) <= 1,
    `the peal put up ${on.amount} against ${off.amount} off the hex`);
  assert(on.turns === off.turns, 'the hex lengthened the ward as well as widening it');
});

// The apprentice. She raises the same body Necros does off a longer
// cooldown and a smaller bird -- one mechanic, two heroes, and the
// difference is entirely in the share.
test('Click: Last Bell raises the same body off a smaller bird', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const click = seatOn(battle, HEROES.click, TEAM.PLAYER, 0);
    seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    const bell = click.abilities.find((a) => a.def.id === 'click_last_bell');
    assert(bell, 'Last Bell is missing');
    const summon = bell.def.effects.find((e) => e.type === 'summon');
    assert(summon.id === 'crossowary_undead', `she raises ${summon.id}`);
    assert(summon.fallback, 'her bell has no branch for a full board');

    Abilities.execute(bell.def, click, click, battle);
    const body = battle.units.find((u) => u.def.id === 'crossowary_undead');
    assert(body, 'nothing got up');
    assert(body.raisedBy === click, 'the body does not answer to her');
    assert(body.baseAtk === Math.round(click.effectiveStat('atk') * 0.85),
      `the body swings ${body.baseAtk} off her ${click.effectiveStat('atk')}`);

    // Necros raises a bigger one, which is what separates the master
    // from the apprentice -- same body, different bird behind it.
    const necrosCall = HEROES.necros.abilities
      .find((a) => a.id === 'necros_carrion_call').effects
      .find((e) => e.type === 'summon');
    assert(necrosCall.share.hp > summon.share.hp,
      'the apprentice raises as sturdy a body as the master does');
    assert(bell.def.cooldown > 4, 'her bell is no slower than his call');
  } finally { Battle.active = prev; }
});

// A tank who WANTS to be cursed, which in a game where the dark meta is
// affliction is the most useful thing a dark tank can be. His armour is
// other people's curses, his cooldown takes theirs onto himself, and his
// big swing is the cage thrown.
test('Rend: the cage is other birds’ bones', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const rend = seatOn(battle, HEROES.rend, TEAM.PLAYER, 1);
    rend.slot = battle.playerSlots[3];          // off his hex
    const foe = seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    foe.hookSources = () => [];

    const worn = (n) => {
      rend.statusEffects = [];
      for (let i = 0; i < n; i++) {
        rend.addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.95, turns: 9 });
      }
      return rend.damageTakenMult(foe);
    };
    assert(Math.abs(worn(0) - 1) < 1e-9, 'a clean bird already had armour');
    assert(Math.abs(worn(1) - 0.95) < 1e-9, `one curse gave ${worn(1)}`);
    assert(Math.abs(worn(3) - 0.85) < 1e-9, `three gave ${worn(3)}`);
    assert(Math.abs(worn(5) - 0.75) < 1e-9, `five gave ${worn(5)}`);
    // Capped, or a curse stops being armour and starts being a bird that
    // cannot be killed.
    assert(Math.abs(worn(20) - 0.75) < 1e-9, `twenty gave ${worn(20)}, wanted the cap`);

    // Poisons count. A cage of stat cuts and not of poisons would read
    // as a bug to anybody who has met the sect's own pack.
    rend.statusEffects = [];
    rend.addStatusEffect({ kind: 'dot', amount: 50, turns: 3 });
    assert(Math.abs(rend.damageTakenMult(foe) - 0.95) < 1e-9,
      'a poison was not part of the cage');
  } finally { Battle.active = prev; }
});

// Not Valere's trick, and the difference is the whole hero: hers puts
// the party's afflictions on an ENEMY, which takes them out of the
// fight. His puts them on HIMSELF, which does not.
test('Rend: Take It On empties the party into him', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const rend = seatOn(battle, HEROES.rend, TEAM.PLAYER, 1);
    rend.slot = battle.playerSlots[3];
    const mates = [2, 4].map((i) => {
      const u = seatOn(battle, DUMMIES.rat_brawler, TEAM.PLAYER, i);
      u.hookSources = () => [];
      return u;
    });
    const foe = seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    foe.hookSources = () => [];

    mates[0].addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.70, turns: 4 });
    mates[0].addStatusEffect({ kind: 'dot', amount: 90, turns: 3 });
    mates[1].addStatusEffect({ kind: 'debuff', stat: 'speed', mult: 0.75, turns: 2 });
    // A blessing is not an affliction and must not move.
    mates[1].addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.2, turns: 3 });

    const take = rend.abilities.find((a) => a.def.id === 'rend_take_it_on');
    assert(take, 'Take It On is missing');
    assert(take.def.targeting === 'self', 'he is taking them onto himself, not casting out');
    Abilities.execute(take.def, rend, rend, battle);

    assert(rend.statusEffects.length === 3,
      `he is wearing ${rend.statusEffects.length} of the party's three`);
    assert(mates.every((m) => !m.statusEffects.some(
      (fx) => fx.kind === 'debuff' || fx.kind === 'dot')), 'the party kept a curse');
    assert(mates[1].statusEffects.some((fx) => fx.kind === 'buff'),
      'a blessing was dragged off with the curses');
    // Worth what they were worth, with the turns they had left.
    const cut = rend.statusEffects.find((fx) => fx.stat === 'atk');
    assert(cut && Math.abs(cut.mult - 0.70) < 1e-9 && cut.turns === 4,
      'the affliction was not carried over intact');
    // They stay on his SIDE — nothing was removed from the fight, which
    // is exactly what separates this from Valere's.
    assert(!foe.statusEffects.length, 'the party’s curses ended up on the enemy');
  } finally { Battle.active = prev; }
});

// The armour, thrown. `perDebuff` reads what the CASTER is carrying,
// where every other conditional on the damage line asks what is wrong
// with the enemy.
test('Rend: Cage is priced off what he is wearing', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  const real = Math.random;
  try {
    const rend = seatOn(battle, HEROES.rend, TEAM.PLAYER, 1);
    rend.slot = battle.playerSlots[3];
    const foe = roomy(seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 400);
    foe.hookSources = () => [];
    foe.dodgeChance = () => 0; foe.reflectChance = () => 0;
    const cage = rend.abilities.find((a) => a.def.id === 'rend_cage');

    const swing = () => {
      const was = foe.hp;
      Math.random = () => 0.99;
      try { Abilities.execute(cage.def, rend, foe, battle); }
      finally { Math.random = real; }
      return was - foe.hp;
    };
    const bare = swing();
    for (let i = 0; i < 3; i++) {
      rend.addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.95, turns: 9 });
    }
    const caged = swing();
    // 50% base, +20% each: three afflictions is 110% against 50%.
    assert(Math.abs(caged / bare - 2.2) < 0.05,
      `three afflictions took ${bare} to ${caged}, wanted about 2.2x`);

    // And it reads HIM, not the target. Curses on the enemy pay nothing.
    rend.statusEffects = [];
    for (let i = 0; i < 3; i++) {
      foe.addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.95, turns: 9 });
    }
    assert(Math.abs(swing() - bare) <= 2,
      'the enemy’s own curses paid him — it is reading the wrong bird');
  } finally { Math.random = real; Battle.active = prev; }
});

// His hex feeds the passive without a cast. Deliberately not another
// cap-raiser: two hexes on this roster already lift a ceiling, and a
// third would be a habit rather than a design.
test('Rend: Open Mouth drinks what lands on his side', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  const real = Math.random;
  try {
    const hex = POSITIONALS.open_mouth;
    assert(HEROES.rend.positional === hex, 'Rend is not on his own hex');
    assert(hex.position === POSITION.FRONT, 'the mouth goes at the front');

    const rend = seatOn(battle, HEROES.rend, TEAM.PLAYER, 1);
    assert(rend.positionalActive(), 'slot 1 is not a front hex');
    const mate = seatOn(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 4);
    mate.hookSources = () => [];
    mate.debuffResistance = () => 0;
    const foe = seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    foe.hookSources = () => [];

    Math.random = () => 0.01;
    Abilities.applyEffect({ type: 'debuff', stat: 'atk', mult: 0.70, turns: 3 }, foe, mate);
    Math.random = real;

    assert(mate.statusEffects.some((fx) => fx.kind === 'debuff'),
      'the curse never landed on the ally');
    assert(rend.statusEffects.some((fx) => fx.kind === 'debuff' && fx.stat === 'atk'),
      'the mouth did not drink it');
    // A copy, not a rescue: the original stays where it fell.
    assert(mate.statusEffects.length === 1, 'the ally was let off');

    // Poisons too. A mouth that drank stat cuts and not these would be
    // inconsistent with his own passive and his own cooldown, both of
    // which count a poison as a curse -- and in a dark meta a poison is
    // most of what is being thrown. The first pass had exactly that
    // hole and a browser probe found it.
    rend.statusEffects = [];
    mate.statusEffects = [];
    Abilities.applyEffect({ type: 'dot', mult: 0.4, turns: 3 }, foe, mate);
    assert(mate.statusEffects.some((fx) => fx.kind === 'dot'), 'the poison never landed');
    assert(rend.statusEffects.some((fx) => fx.kind === 'dot'),
      'the mouth drinks stat cuts but not poisons');

    // Off the hex it drinks nothing.
    rend.statusEffects = [];
    mate.statusEffects = [];
    rend.slot = battle.playerSlots[3];
    assert(!rend.positionalActive(), 'the fixture left him on the hex');
    Math.random = () => 0.01;
    Abilities.applyEffect({ type: 'debuff', stat: 'atk', mult: 0.70, turns: 3 }, foe, mate);
    Math.random = real;
    assert(!rend.statusEffects.length, 'he drank off his own hex');
  } finally { Math.random = real; Battle.active = prev; }
});

// The sect's first damage, and a thief rather than a duellist. Enemy
// COOLDOWNS are an axis nothing on the roster had ever touched: allies
// get their skills back early -- Evelune, Mendral, Solari's hex -- and
// until Crook nobody took an enemy's away.
test('Crook: Pick a Pocket takes the next move off them', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  const real = Math.random;
  try {
    const crook = maxSkill(seatOn(battle, HEROES.crook, TEAM.PLAYER, 1), 2);
    crook.slot = battle.playerSlots[3];         // off his hex: the bare push
    const foe = roomy(seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 400);
    foe.hookSources = () => [];
    foe.dodgeChance = () => 0; foe.reflectChance = () => 0;
    foe.debuffResistance = () => 0;
    const pocket = crook.abilities.find((a) => a.def.id === 'crook_pick_a_pocket');
    assert(pocket, 'Pick a Pocket is missing');

    // Everything ready, including a fresh enemy's whole kit.
    foe.abilities.forEach((a) => { a.cooldownRemaining = 0; });
    Math.random = () => 0.01;
    Abilities.execute(pocket.def, crook, foe, battle);
    Math.random = real;

    const laddered = foe.abilities.filter((a) => a.def.cooldown > 0);
    assert(laddered.length > 0, 'the fixture enemy has no cooldowns to take');
    for (const a of laddered) {
      assert(a.cooldownRemaining > 0,
        `${a.def.name} was left ready — a fresh enemy is the one worth robbing`);
    }

    // Never shelved for longer than a fresh cast would take, and driven
    // from a kit that is ALREADY at its ceiling -- the first draft
    // pushed a ready enemy and never made the clamp bind at all, so it
    // proved nothing.
    laddered.forEach((a) => { a.cooldownRemaining = a.def.cooldown; });
    Math.random = () => 0.01;
    Abilities.execute(pocket.def, crook, foe, battle);
    Math.random = real;
    for (const a of laddered) {
      assert(a.cooldownRemaining === a.def.cooldown,
        `${a.def.name} went to ${a.cooldownRemaining} past its own ${a.def.cooldown}`);
    }
    // A slot-one filler is never taken: a skill on a zero cooldown is
    // never "away", and shelving it would be shelving the enemy's only
    // guaranteed move.
    const filler = foe.abilities.find((a) => a.def.cooldown === 0);
    assert(filler && filler.cooldownRemaining === 0, 'the enemy’s filler was taken');

    // Gated at the roster-standard 50%, and it contests like any taking.
    // Rolled on an UNLEVELLED Crook: the ladder buys the gate to a
    // certainty by design, so a maxed skill cannot demonstrate a refusal
    // — the first draft of this assertion tried and was right to fail.
    const gate = pocket.def.effects.find((e) => e.type === 'cooldownPush');
    assert(Math.abs(gate.chance - 0.5) < 1e-9, 'the theft is not on a 50% gate');
    const green = seatOn(battle, HEROES.crook, TEAM.PLAYER, 2);
    green.slot = battle.playerSlots[4];
    foe.abilities.forEach((a) => { a.cooldownRemaining = 0; });
    Math.random = () => 0.99;
    Abilities.execute(pocket.def, green, foe, battle);
    Math.random = real;
    assert(laddered.every((a) => a.cooldownRemaining === 0),
      'the gate opened on a roll that should have refused it');
  } finally { Math.random = real; Battle.active = prev; }
});

// The filler steals too, and that is a bench finding rather than a
// flourish: without it he measured +330 +/- 646 on a paired asymmetric
// run against +4431 for Aurek on the same fixture. His passive charges
// for skills the enemy has SPENT, and a theft once every seven turns
// almost never leaves any spent. The condition was the problem, not the
// rate -- so the condition is pinned.
test('Crook: the filler steals, which is what makes the passive live', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  const real = Math.random;
  try {
    const crook = seatOn(battle, HEROES.crook, TEAM.PLAYER, 1);
    crook.slot = battle.playerSlots[3];
    const foe = roomy(seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 400);
    foe.hookSources = () => [];
    foe.dodgeChance = () => 0; foe.reflectChance = () => 0;
    foe.debuffResistance = () => 0;

    const clout = crook.abilities.find((a) => a.def.id === 'crook_clout');
    assert(clout, 'Clout is missing');
    assert(clout.def.cooldown === 0, 'the thief has to be pressing this every turn');
    const push = clout.def.effects.find((e) => e.type === 'cooldownPush');
    assert(push, 'the button he presses every turn does not steal');
    assert(Math.abs(push.chance - 0.5) < 1e-9, 'the filler theft is not on a 50% gate');
    assert(push.turns === 1, `the filler takes ${push.turns} turns — it is meant to be small`);

    foe.abilities.forEach((a) => { a.cooldownRemaining = 0; });
    Math.random = () => 0.01;
    Abilities.execute(clout.def, crook, foe, battle);
    Math.random = real;
    assert(foe.abilities.some((a) => a.def.cooldown > 0 && a.cooldownRemaining === 1),
      'a swing left the whole kit ready');
    // Which is exactly what the passive then charges for.
    assert(crook.damageDealtMult(foe) > 1,
      'the state his own filler creates pays him nothing');
  } finally { Math.random = real; Battle.active = prev; }
});

// His passive reads the state his own kit creates, so it is one idea
// twice: rob the pockets, then bill them for being empty.
test('Crook: Light Fingers charges for what they have spent', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const crook = seatOn(battle, HEROES.crook, TEAM.PLAYER, 1);
    const foe = seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    foe.hookSources = () => [];

    const laddered = foe.abilities.filter((a) => a.def.cooldown > 0);
    foe.abilities.forEach((a) => { a.cooldownRemaining = 0; });
    assert(Math.abs(crook.damageDealtMult(foe) - 1) < 1e-9,
      'a fully loaded enemy already paid him');

    laddered[0].cooldownRemaining = 3;
    assert(Math.abs(crook.damageDealtMult(foe) - 1.12) < 1e-9,
      `one spent skill paid ${crook.damageDealtMult(foe)}`);
    laddered.forEach((a) => { a.cooldownRemaining = 3; });
    assert(Math.abs(crook.damageDealtMult(foe) - (1 + 0.12 * laddered.length)) < 1e-9,
      `a spent kit paid ${crook.damageDealtMult(foe)}`);

    // Fillers are skipped here too, or he would be paid for a skill
    // that is never away.
    const filler = foe.abilities.find((a) => a.def.cooldown === 0);
    const held = crook.damageDealtMult(foe);
    if (filler) {
      filler.cooldownRemaining = 3;
      assert(Math.abs(crook.damageDealtMult(foe) - held) < 1e-9,
        'a zero-cooldown filler was counted as spent');
    }
  } finally { Battle.active = prev; }
});

// His hex deepens the theft rather than widening it: how MUCH of a move
// he takes is the mechanic, and a hex that robbed more birds for less
// would be a different hero.
test('Crook: Fence pushes a turn deeper', () => {
  const hex = POSITIONALS.fence;
  assert(HEROES.crook.positional === hex, 'Crook is not on his own hex');
  assert(hex.position === POSITION.FRONT, 'the pockets are at the front');

  const rob = (onHex) => {
    const battle = makeBattle();
    const prev = Battle.active;
    Battle.active = battle;
    const real = Math.random;
    try {
      const crook = seatOn(battle, HEROES.crook, TEAM.PLAYER, 1);
      if (!onHex) crook.slot = battle.playerSlots[3];
      assert(crook.positionalActive() === onHex, 'the fixture seated him wrong');
      const foe = roomy(seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 400);
      foe.hookSources = () => [];
      foe.dodgeChance = () => 0; foe.reflectChance = () => 0;
      foe.debuffResistance = () => 0;
      // A deep cooldown, so the per-skill cap cannot mask the difference.
      const deep = foe.abilities.filter((a) => a.def.cooldown > 0)
        .sort((a, b) => b.def.cooldown - a.def.cooldown)[0];
      foe.abilities.forEach((a) => { a.cooldownRemaining = 0; });
      const pocket = crook.abilities.find((a) => a.def.id === 'crook_pick_a_pocket');
      Math.random = () => 0.01;
      Abilities.execute(pocket.def, crook, foe, battle);
      return deep.cooldownRemaining;
    } finally { Math.random = real; Battle.active = prev; }
  };
  const off = rob(false);
  const on = rob(true);
  assert(off === 2, `the bare theft took ${off} turns, wanted 2`);
  assert(on === 3, `the fence took ${on} turns, wanted 3`);
});

// The sect's supply line. Everything the Hollowbone pack does is priced
// PER CURSE -- Rigor deepens each, Deadweight drags 3% of speed off
// each, Dry Bones asks only whether a bird is cursed at all -- and none
// of the four birds written before him lands many. His passive
// multiplies the COUNT, which is the one term in that arithmetic
// nothing else touches.
test('Pox: a plague does not stay where it is put', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  const real = Math.random;
  try {
    const pox = seatOn(battle, HEROES.pox, TEAM.PLAYER, 4);
    pox.slot = battle.playerSlots[0];           // off his hex: the bare 30%
    const foes = [0, 1, 2].map((i) => {
      const u = roomy(seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, i), 40);
      u.hookSources = () => [];
      u.debuffResistance = () => 0;
      return u;
    });
    const cursed = () => foes.filter((f) =>
      f.statusEffects.some((fx) => fx.kind === 'debuff' && fx.stat === 'atk')).length;

    // The roll refuses: one bird, and the original is where it was aimed.
    foes.forEach((f) => { f.statusEffects = []; });
    Math.random = () => 0.99;
    Abilities.applyEffect({ type: 'debuff', stat: 'atk', mult: 0.75, turns: 3 },
      pox, foes[0]);
    Math.random = real;
    assert(cursed() === 1, `a refused roll still spread to ${cursed()} birds`);
    assert(foes[0].statusEffects.length === 1, 'the aimed bird was missed');

    // The roll opens: two birds, and the SECOND one is a copy -- the
    // original is untouched, so this doubles nothing about the target.
    foes.forEach((f) => { f.statusEffects = []; });
    Math.random = () => 0.01;
    Abilities.applyEffect({ type: 'debuff', stat: 'atk', mult: 0.75, turns: 3 },
      pox, foes[0]);
    Math.random = real;
    assert(cursed() === 2, `the plague took ${cursed()} birds, wanted 2`);
    assert(foes[0].statusEffects.length === 1,
      'the aimed bird caught it twice — the copy went to the wrong place');

    // Worth what the original was worth, turns and all -- and carrying
    // everything stamped onto it. A copy that skipped the pack's own
    // Deadweight would mean a bird wearing three of his hexes was
    // dragged by exactly one, which is what a browser probe found on
    // the first pass.
    const copy = foes.find((f, i) => i > 0 && f.statusEffects.length)
      .statusEffects.find((fx) => fx.stat === 'atk');
    assert(Math.abs(copy.mult - 0.75) < 1e-9 && copy.turns === 3,
      'the copy is not the curse that was cast');
    {
      const dragger = seatOn(battle, HEROES.pox, TEAM.PLAYER, 5);
      dragger.passives.push(RACES.sectTiers('hollowbone', 3)
        .find((t) => t.name === 'Deadweight'));
      // Every bird clean first: the copies land on whoever the roll
      // picks, and an older hex left lying about from the blocks above
      // would be counted as one that travelled.
      foes.forEach((f) => { f.statusEffects = []; });
      const mark = foes[2];
      const opened = mark.effectiveStat('speed');
      Math.random = () => 0.01;
      Abilities.applyEffect({ type: 'debuff', stat: 'atk', mult: 0.75, turns: 3 },
        dragger, mark);
      Math.random = real;
      const spread = foes.filter((f) => f.statusEffects.some((fx) => fx.speedBite > 0));
      assert(spread.length === 2, `${spread.length} birds carry the weight, wanted 2`);
      assert(mark.effectiveStat('speed') < opened, 'the original did not drag');
      const other = spread.find((f) => f !== mark);
      assert(other.statusEffects.every((fx) => fx.speedBite > 0),
        'the copy travelled without the weight stamped on it');
    }

    // Never onto his own side, and never a chain: one jump, not a
    // cascade through the whole enemy line.
    assert(!pox.statusEffects.length, 'the plague turned on its own caster');
    assert(cursed() < 3, 'the copy spread on again');
  } finally { Math.random = real; Battle.active = prev; }
});

// Poisons and blocks travel too. A plague that jumped stat cuts and
// nothing else would be a strange plague, and it is the block that
// matters most: it is the sect's answer to a healer comp.
test('Pox: poisons and heal blocks get around as well', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  const real = Math.random;
  try {
    const pox = seatOn(battle, HEROES.pox, TEAM.PLAYER, 4);
    pox.slot = battle.playerSlots[0];
    const foes = [0, 1].map((i) => {
      const u = roomy(seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, i), 40);
      u.hookSources = () => [];
      u.debuffResistance = () => 0;
      return u;
    });

    Math.random = () => 0.01;
    Abilities.applyEffect({ type: 'dot', pct: 0.30, turns: 3 }, pox, foes[0]);
    assert(foes[1].statusEffects.some((fx) => fx.kind === 'dot'),
      'the poison stayed where it was put');

    // And the cards say what they lay. Without this the stat on a swept
    // debuff is unpinned -- swapping Bad Air's ATK cut for a DEF cut
    // broke nothing at all.
    const air = pox.abilities.find((a) => a.def.id === 'pox_bad_air');
    const cut = air.def.effects.find((e) => e.type === 'debuff');
    assert(cut.stat === 'atk' && Math.abs(cut.mult - 0.75) < 1e-9,
      `Bad Air lays ${cut.stat} x${cut.mult}, wanted atk x0.75`);
    assert(air.def.targeting === 'all-enemies', 'bad air does not stay in one place');
    const bottle = pox.abilities.find((a) => a.def.id === 'pox_stopper_the_bottle');
    assert(bottle.def.effects.some((e) => e.type === 'healBlock'),
      'the bottle does not stopper anything');
    assert(bottle.def.targeting === 'all-enemies',
      "Noctelle's block is the narrow one; this is meant to be the wide one");

    foes.forEach((f) => { f.statusEffects = []; });
    Abilities.applyEffect({ type: 'healBlock', turns: 2, chance: 0.5 }, pox, foes[0]);
    Math.random = real;
    assert(foes[0].healBlocked(), 'the block never landed');
    assert(foes[1].healBlocked(), 'the block did not get around');
  } finally { Math.random = real; Battle.active = prev; }
});

// His hex raises the RATE the plague travels rather than a ceiling.
// Three hexes on this roster already lift a cap and it was becoming a
// habit; what matters about a plague is how often it jumps.
test('Pox: Upwind is a rate, not a ceiling', () => {
  const hex = POSITIONALS.upwind;
  assert(HEROES.pox.positional === hex, 'Pox is not on his own hex');
  assert(hex.position === POSITION.BACK, 'standing back is standing upwind');

  // A roll that sits between the two rates: refused off the hex at 30%,
  // taken on it at 45%.
  const jumps = (onHex) => {
    const battle = makeBattle();
    const prev = Battle.active;
    Battle.active = battle;
    const real = Math.random;
    try {
      const pox = seatOn(battle, HEROES.pox, TEAM.PLAYER, 4);
      if (!onHex) pox.slot = battle.playerSlots[0];
      assert(pox.positionalActive() === onHex, 'the fixture seated him wrong');
      const foes = [0, 1].map((i) => {
        const u = roomy(seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, i), 40);
        u.hookSources = () => [];
        u.debuffResistance = () => 0;
        return u;
      });
      Math.random = () => 0.38;
      Abilities.applyEffect({ type: 'debuff', stat: 'atk', mult: 0.75, turns: 3 },
        pox, foes[0]);
      return foes[1].statusEffects.length > 0;
    } finally { Math.random = real; Battle.active = prev; }
  };
  assert(!jumps(false), 'a 0.38 roll jumped off the hex, where the rate is 0.30');
  assert(jumps(true), 'a 0.38 roll refused on the hex, where the rate is 0.45');
});

// The lantern. What is in the glass is whatever the fight has cost so
// far -- both sides, no favourites -- and everything he hands out is
// worth more for it.
test('Malachar: the glass keeps what the fight takes', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    battle.deaths = 0;
    const mal = seatOn(battle, HEROES.malachar, TEAM.PLAYER, 4);
    mal.slot = battle.playerSlots[0];           // off his hex: an empty lantern
    const ally = seatOn(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
    ally.hookSources = () => [];

    const bless = () => {
      ally.statusEffects = [];
      Abilities.applyEffect({ type: 'buff', stat: 'atk', mult: 1.20, turns: 3 }, mal, ally);
      return ally.statusEffects.find((fx) => fx.stat === 'atk').mult;
    };

    assert(Math.abs(bless() - 1.20) < 1e-9, `an empty lantern gave ${bless()}`);
    battle.deaths = 1;
    assert(Math.abs(bless() - 1.25) < 1e-9, `one body gave ${bless()}`);
    battle.deaths = 5;
    assert(Math.abs(bless() - 1.45) < 1e-9, `five gave ${bless()}`);
    // Capped at eight, which on a 7v7 board is most of one side gone.
    battle.deaths = 8;
    assert(Math.abs(bless() - 1.60) < 1e-9, `eight gave ${bless()}`);
    battle.deaths = 30;
    assert(Math.abs(bless() - 1.60) < 1e-9, `thirty gave ${bless()}, wanted the cap`);

    // It moves blessings AWAY from neutral, so it deepens a gift rather
    // than flipping one -- the same rule the ladder rung follows.
    battle.deaths = 4;
    ally.statusEffects = [];
    Abilities.applyEffect({ type: 'buff', stat: 'def', mult: 1.10, turns: 3 }, mal, ally);
    const def = ally.statusEffects.find((fx) => fx.stat === 'def');
    assert(Math.abs(def.mult - 1.30) < 1e-9, `a +10% ward became ${def.mult}`);

    // The cards say what they give. Without this the stat on his filler
    // was unpinned -- swapping Wickwork's speed for attack broke
    // nothing, and speed is a deliberate choice twice over: a cd0
    // single-ally ATK blessing is Kiri's Pinwheel exactly, and the
    // sect's own Rigor turns a hurried wing into deeper hexes.
    const wick = mal.abilities.find((a) => a.def.id === 'malachar_wickwork');
    const gift = wick.def.effects.find((e) => e.type === 'buff');
    assert(gift.stat === 'speed', `Wickwork gives ${gift.stat}, wanted speed`);

    // It mends as well, because the sect has nothing else that does --
    // Click's wards are health that never left, not health coming back.
    // Priced off HIS pool, and the lantern deliberately does NOT deepen
    // it: buffPowerAdd reads blessings only, and a mend growing on the
    // same count would walk straight around the cap.
    const mend = wick.def.effects.find((e) => e.type === 'healHpPct');
    assert(mend && Math.abs(mend.pct - 0.08) < 1e-9,
      'the filler does not mend, or not off his own pool');
    {
      const hurt = seatOn(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 3);
      hurt.hookSources = () => [];
      const dose = (bodies) => {
        battle.deaths = bodies;
        hurt.hp = 1;
        // Cleared each time: blessings stack as separate effects, so a
        // leftover from the previous cast is what `find` returns and the
        // second reading is the first one over again.
        hurt.statusEffects = [];
        Abilities.execute(wick.def, mal, hurt, battle);
        return hurt.hp - 1;
      };
      const empty = dose(0);
      assert(Math.abs(empty - Math.round(mal.maxHp * 0.08)) <= 1,
        `mended ${empty}, wanted 8% of ${mal.maxHp}`);
      assert(dose(8) === empty, 'a full lantern deepened the mend as well');
      // The blessing beside it still scales, so the two halves of one
      // skill are genuinely on different rules.
      assert(hurt.statusEffects.find((fx) => fx.stat === 'speed').mult > 1.15,
        'the blessing stopped scaling when the mend was added');
    }
    const glass = mal.abilities.find((a) => a.def.id === 'malachar_hold_it_up');
    assert(glass.def.effects.filter((e) => e.type === 'buff').length === 2,
      'Hold It Up hands out one stat — it is meant to be two, and not Orien’s');

    // And only his. A blessing from anybody else is worth what it says.
    const other = seatOn(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 2);
    other.hookSources = () => [];
    ally.statusEffects = [];
    Abilities.applyEffect({ type: 'buff', stat: 'atk', mult: 1.20, turns: 3 }, other, ally);
    assert(Math.abs(ally.statusEffects.find((fx) => fx.stat === 'atk').mult - 1.20) < 1e-9,
      "somebody else's blessing was deepened by his lantern");
  } finally { Battle.active = prev; }
});

// His hex answers the one real problem with a hero whose value is a
// running total: on turn one the total is zero.
test('Malachar: Struck Early opens the lantern holding three', () => {
  const hex = POSITIONALS.struck_early;
  assert(HEROES.malachar.positional === hex, 'Malachar is not on his own hex');
  assert(hex.position === POSITION.BACK, 'the lantern is carried at the back');

  const openWith = (onHex) => {
    const battle = makeBattle();
    const prev = Battle.active;
    Battle.active = battle;
    try {
      battle.deaths = 0;
      const mal = seatOn(battle, HEROES.malachar, TEAM.PLAYER, 4);
      if (!onHex) mal.slot = battle.playerSlots[0];
      assert(mal.positionalActive() === onHex, 'the fixture seated him wrong');
      const ally = seatOn(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
      ally.hookSources = () => [];
      Abilities.applyEffect({ type: 'buff', stat: 'atk', mult: 1.20, turns: 3 }, mal, ally);
      return ally.statusEffects.find((fx) => fx.stat === 'atk').mult;
    } finally { Battle.active = prev; }
  };
  assert(Math.abs(openWith(false) - 1.20) < 1e-9, 'an off-hex lantern started full');
  assert(Math.abs(openWith(true) - 1.35) < 1e-9,
    `on the hex it opened at ${openWith(true)}, wanted three bodies' worth`);
});

// The sect's only revive, and the one skill of his the passive does NOT
// touch -- a revive is not a blessing, so it carries its own scaling
// off the same count.
test('Malachar: What It Kept gives back what the lantern took in', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const mal = seatOn(battle, HEROES.malachar, TEAM.PLAYER, 4);
    const kept = mal.abilities.find((a) => a.def.id === 'malachar_what_it_kept');
    assert(kept, 'What It Kept is missing');
    const rev = kept.def.effects.find((e) => e.type === 'revive');
    assert(rev.perDeath > 0, 'the lantern gives back a flat figure');

    const raise = (bodies) => {
      battle.deaths = bodies;
      const fallen = seatOn(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
      fallen.hookSources = () => [];
      fallen.hp = 0;
      Abilities.execute(kept.def, mal, fallen, battle);
      const frac = fallen.hp / fallen.maxHp;
      battle.units = battle.units.filter((u) => u !== fallen);
      battle.playerSlots[1].unit = null;
      return frac;
    };
    assert(Math.abs(raise(0) - 0.30) < 0.01, `an empty lantern raised at ${raise(0)}`);
    assert(Math.abs(raise(4) - 0.50) < 0.01, `four bodies raised at ${raise(4)}`);
    // Written on the effect without engine support this was a silent
    // no-op: the card said a number nothing ever read.
    assert(raise(8) > raise(0), 'the count changes nothing — perDeath is not wired');
  } finally { Battle.active = prev; }
});

// The butcher bird. A shrike impales what it catches and comes back to
// it later, and both halves are in the kit: he is paid for how far gone
// a thing already is, and what he kills does not get back up.
test('Shrike: he can see how far gone it is', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const shrike = seatOn(battle, HEROES.shrike, TEAM.PLAYER, 4);
    shrike.slot = battle.playerSlots[0];        // off his hex
    const foe = roomy(seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 40);
    foe.hookSources = () => [];

    const at = (frac) => {
      foe.hp = Math.round(foe.maxHp * frac);
      return shrike.damageDealtMult(foe);
    };
    assert(Math.abs(at(1.00) - 1.00) < 1e-9, `a full bird paid ${at(1.00)}`);
    // SMOOTH, and it has to be. Written as steps -- a rung per fifth of
    // the target gone -- it fired exactly zero times in an instrumented
    // fight: fifteen swings, every one against a bird between 89% and
    // 100% health. A stepped execute needs its first step to be
    // reachable, and a back-row dealer spreading swings across six
    // enemies rarely gets anybody a fifth of the way down in time.
    // Raising the rate on the steps changed the bench by literally
    // nothing, which is what a multiplier that never fires looks like.
    assert(Math.abs(at(0.90) - 1.05) < 1e-9, `10% gone paid ${at(0.90)}`);
    assert(Math.abs(at(0.50) - 1.25) < 1e-9, `half gone paid ${at(0.50)}`);
    assert(Math.abs(at(0.10) - 1.45) < 1e-9, `90% gone paid ${at(0.10)}`);
    // Bounded without a cap: `gone` cannot exceed 1, so a corpse caught
    // mid-sweep reads exactly the ceiling and never past it.
    assert(Math.abs(at(0) - 1.50) < 1e-9, `a corpse paid ${at(0)}`);
    assert(at(0.90) > at(0.99), 'the ramp is flat where it is meant to be smooth');

    // It reads the TARGET, where deadeye and last_stand read the hero's
    // own wounds.
    foe.hp = foe.maxHp;
    shrike.hp = 1;
    assert(Math.abs(shrike.damageDealtMult(foe) - 1) < 1e-9,
      'his own wounds paid him — it is reading the wrong bird');
  } finally { Battle.active = prev; }
});

// His filler is two strikes rather than one, and the second is priced
// by what the first did.
test('Shrike: both talons, and the second is worth more', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  const real = Math.random;
  try {
    const shrike = seatOn(battle, HEROES.shrike, TEAM.PLAYER, 4);
    shrike.slot = battle.playerSlots[0];
    const hook = shrike.abilities.find((a) => a.def.id === 'shrike_hook');
    assert(hook, 'Hook is missing');
    assert(hook.def.effects.filter((e) => e.type === 'damage').length === 2,
      'the filler is one talon — it is meant to be two');

    // A pool thin enough that the first talon moves him up a rung.
    const foe = seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    foe.hookSources = () => [];
    foe.dodgeChance = () => 0; foe.reflectChance = () => 0;
    foe.maxHp = 600; foe.hp = 600;
    const hits = [];
    const realBook = foe.takeDamage.bind(foe);
    foe.takeDamage = (amount, src) => { hits.push(amount); return realBook(amount, src); };
    Math.random = () => 0.99;
    Abilities.execute(hook.def, shrike, foe, battle);
    Math.random = real;
    assert(hits.length === 2, `${hits.length} talons landed`);
    assert(hits[1] > hits[0],
      `${hits[0]} then ${hits[1]} — the second talon was not priced by the first`);
  } finally { Math.random = real; Battle.active = prev; }
});

// Reset-on-kill is a channel nothing else has, and it is gated behind
// an actual kill at a seven's multiplier: one big hit and a long wait
// against anything healthy, and a chain only when the board is already
// breaking.
test('Shrike: The Larder hands its own cooldown back on a kill', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  const real = Math.random;
  try {
    const shrike = seatOn(battle, HEROES.shrike, TEAM.PLAYER, 4);
    shrike.slot = battle.playerSlots[0];
    const larder = shrike.abilities.find((a) => a.def.id === 'shrike_the_larder');
    assert(larder, 'The Larder is missing');

    const strike = (frac) => {
      const foe = seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
      foe.hookSources = () => [];
      foe.dodgeChance = () => 0; foe.reflectChance = () => 0;
      foe.maxHp *= 40; foe.hp = Math.round(foe.maxHp * frac);
      larder.cooldownRemaining = 7;
      Math.random = () => 0.99;
      try { Abilities.execute(larder.def, shrike, foe, battle); }
      finally {
        Math.random = real;
        battle.units = battle.units.filter((u) => u !== foe);
        battle.enemySlots[1].unit = null;
      }
      return { cd: larder.cooldownRemaining, dead: !foe.alive };
    };

    const survived = strike(1);
    assert(!survived.dead, 'the fixture killed a healthy bird');
    assert(survived.cd === 7, `a survivor handed back ${7 - survived.cd} turns`);

    const finished = strike(0.001);
    assert(finished.dead, 'the fixture failed to finish a dying bird');
    assert(finished.cd === 0, `a kill left ${finished.cd} turns on the clock`);
  } finally { Math.random = real; Battle.active = prev; }
});

// His hex is the thorn, and nothing else on the roster refuses a
// revive. It is a real answer to the four things that hand them out
// rather than another percentage.
test('Shrike: what goes on the thorn stays there', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  const real = Math.random;
  try {
    const hex = POSITIONALS.thornbush;
    assert(HEROES.shrike.positional === hex, 'Shrike is not on his own hex');
    assert(hex.position === POSITION.BACK, 'the larder is at the back');

    const shrike = seatOn(battle, HEROES.shrike, TEAM.PLAYER, 4);
    assert(shrike.positionalActive(), 'slot 4 is not a back hex');
    const mal = seatOn(battle, HEROES.malachar, TEAM.PLAYER, 5);
    const kill = (u) => {
      Math.random = () => 0.99;
      try { Abilities.strike(shrike, u, u.maxHp * 50, { dodge: false, reflect: false }); }
      finally { Math.random = real; }
    };

    // Killed by Shrike: impaled, and no revive on the roster lifts it.
    const his = seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 0);
    his.hookSources = () => [];
    his.dodgeChance = () => 0; his.reflectChance = () => 0;
    kill(his);
    assert(!his.alive && his.unraisable, 'the kill was not put on the thorn');
    his.revive(0.5, mal);
    assert(!his.alive, 'something on a thorn got back up');

    // Killed by anybody else: an ordinary corpse.
    const theirs = seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
    theirs.hookSources = () => [];
    theirs.dodgeChance = () => 0; theirs.reflectChance = () => 0;
    Math.random = () => 0.99;
    try { Abilities.strike(mal, theirs, theirs.maxHp * 50, { dodge: false, reflect: false }); }
    finally { Math.random = real; }
    assert(!theirs.alive && !theirs.unraisable, 'somebody else’s kill was impaled');
    theirs.revive(0.5, mal);
    assert(theirs.alive, 'an ordinary corpse refused an ordinary revive');

    // Off the hex he is just a bird with claws.
    shrike.slot = battle.playerSlots[0];
    const spare = seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 2);
    spare.hookSources = () => [];
    spare.dodgeChance = () => 0; spare.reflectChance = () => 0;
    kill(spare);
    assert(!spare.unraisable, 'he impaled off his own hex');
  } finally { Math.random = real; Battle.active = prev; }
});

// The seer, and Shrike's opposite number: Shrike is worth more the
// closer a thing is to dead, Omen the longer it has been coming. What
// he lays is a CLOCK, not a poison -- it does nothing at all while it
// counts, and then it happens.
test('Omen: an omen does nothing until it does', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  const real = Math.random;
  try {
    const omen = seatOn(battle, HEROES.omen, TEAM.PLAYER, 4);
    omen.slot = battle.playerSlots[0];          // off his hex: a 3-turn clock
    const foe = roomy(seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 400);
    foe.hookSources = () => [];
    foe.dodgeChance = () => 0; foe.reflectChance = () => 0;
    foe.debuffResistance = () => 0;

    Math.random = () => 0.01;
    Abilities.applyEffect({ type: 'doom', mult: 1.60, turns: 3 }, omen, foe);
    Math.random = real;
    const clock = foe.statusEffects.find((fx) => fx.stat === 'doom');
    assert(clock, 'nothing was read off him');
    assert(clock.turns === 3, `the clock runs ${clock.turns} turns`);
    // Pinned off the SKILL as well, not just the effect handed to
    // applyEffect. Moving the card's own 3 to a 6 broke nothing until
    // this was here -- the fixture was testing the engine and calling
    // it a test of the hero.
    const look = omen.abilities.find((a) => a.def.id === 'omen_the_long_look');
    const laid = look.def.effects.find((e) => e.type === 'doom');
    assert(laid.turns === 3 && Math.abs(laid.mult - 1.60) < 1e-9,
      `The Long Look reads ${laid.mult} over ${laid.turns} turns`);
    assert(Math.abs(clock.amount - Math.round(omen.effectiveStat('atk') * 1.60)) <= 1,
      `the omen is worth ${clock.amount}`);

    // Nothing at all while it counts. Every other affliction on the
    // roster does SOMETHING each turn; this one is silence and then a
    // number.
    let hp = foe.hp;
    foe.tickStatusEffects();
    assert(foe.hp === hp && clock.turns === 2, 'the clock ticked damage as it counted');
    foe.tickStatusEffects();
    assert(foe.hp === hp && clock.turns === 1, 'the clock ticked damage as it counted');

    // And then it happens. Waiting it out is not the answer it is to
    // everything else.
    foe.tickStatusEffects();
    assert(!foe.statusEffects.some((fx) => fx.stat === 'doom'), 'the clock is still there');
    assert(foe.hp < hp, 'the omen ran out and nothing came of it');

    // It is thrown as an ordinary blow, so the DEF curve answers it --
    // a prophecy is still a hit.
    assert(hp - foe.hp < clock.amount,
      'the omen landed unmitigated — it is meant to go through the curve');
  } finally { Math.random = real; Battle.active = prev; }
});

// And it FILLS. Every blow the doomed bird takes from anybody adds a
// share, so the omen is a record of the fight rather than a figure
// fixed at cast, and the whole party is loading it.
test('Omen: the whole party loads it', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  const real = Math.random;
  try {
    const omen = seatOn(battle, HEROES.omen, TEAM.PLAYER, 4);
    omen.slot = battle.playerSlots[0];
    const mate = seatOn(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
    mate.hookSources = () => [];
    const foe = roomy(seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 400);
    foe.hookSources = () => [];
    foe.dodgeChance = () => 0; foe.reflectChance = () => 0;
    foe.debuffResistance = () => 0;

    Math.random = () => 0.01;
    Abilities.applyEffect({ type: 'doom', mult: 1.60, turns: 5 }, omen, foe);
    Math.random = real;
    const clock = foe.statusEffects.find((fx) => fx.stat === 'doom');
    const laid = clock.amount;
    assert(clock.growth > 0, 'the omen was laid without its growth stamped on');

    // Somebody ELSE hits the doomed bird.
    Math.random = () => 0.99;
    try { Abilities.strike(mate, foe, 1000, { dodge: false, reflect: false }); }
    finally { Math.random = real; }
    assert(clock.amount > laid, 'an ally’s blow added nothing to what is coming');

    // A blow on an undoomed bird costs nothing and changes nothing.
    const spare = roomy(seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 2), 400);
    spare.hookSources = () => [];
    spare.dodgeChance = () => 0; spare.reflectChance = () => 0;
    const held = clock.amount;
    Math.random = () => 0.99;
    try { Abilities.strike(mate, spare, 1000, { dodge: false, reflect: false }); }
    finally { Math.random = real; }
    assert(clock.amount === held, 'hitting somebody else fed the omen');

    // The growth belongs to the PROPHECY, not the prophet: an omen he
    // laid keeps filling after he is gone.
    omen.hp = 0;
    const before = clock.amount;
    Math.random = () => 0.99;
    try { Abilities.strike(mate, foe, 1000, { dodge: false, reflect: false }); }
    finally { Math.random = real; }
    assert(clock.amount > before, 'the omen stopped filling when its reader died');
  } finally { Math.random = real; Battle.active = prev; }
});

// The payoff for a hero whose whole kit is waiting, and the reason the
// clocks are worth laying on more than one bird.
test('Omen: It Was Always Going To rings every clock at once', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  const real = Math.random;
  try {
    const omen = maxSkill(seatOn(battle, HEROES.omen, TEAM.PLAYER, 4), 2);
    omen.slot = battle.playerSlots[0];
    const foes = [0, 1, 2].map((i) => {
      const u = roomy(seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, i), 400);
      u.hookSources = () => [];
      u.dodgeChance = () => 0; u.reflectChance = () => 0;
      u.debuffResistance = () => 0;
      return u;
    });
    Math.random = () => 0.01;
    Abilities.applyEffect({ type: 'doom', mult: 1.60, turns: 9 }, omen, foes[0]);
    Abilities.applyEffect({ type: 'doom', mult: 1.60, turns: 9 }, omen, foes[1]);
    Math.random = real;
    const before = foes.map((f) => f.hp);

    const always = omen.abilities.find((a) => a.def.id === 'omen_it_was_always');
    assert(always, 'It Was Always Going To is missing');
    Math.random = () => 0.99;
    Abilities.execute(always.def, omen, foes[0], battle);
    Math.random = real;

    // Both clocks are gone and both paid; the third bird took the sweep
    // and nothing else.
    assert(!foes[0].statusEffects.some((fx) => fx.stat === 'doom') &&
      !foes[1].statusEffects.some((fx) => fx.stat === 'doom'), 'a clock survived');
    const hit = foes.map((f, i) => before[i] - f.hp);
    assert(hit[2] > 0, 'the sweep missed the undoomed bird');
    assert(hit[0] > hit[2] * 1.5 && hit[1] > hit[2] * 1.5,
      `doomed birds took ${hit[0]}/${hit[1]} against ${hit[2]} undoomed`);

    // And never his own side's. An enemy signreader's omen sitting on
    // one of your birds must not be rung by yours -- the guard reads as
    // obvious and was completely untested until a sabotage removed it
    // and nothing complained.
    const mate = roomy(seatOn(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1), 400);
    mate.hookSources = () => [];
    mate.addStatusEffect({ kind: 'debuff', stat: 'doom', turns: 9,
      amount: 5000, growth: 0, source: foes[0] });
    const mateHp = mate.hp;
    Math.random = () => 0.99;
    Abilities.execute(always.def, omen, foes[0], battle);
    Math.random = real;
    assert(mate.hp === mateHp, 'he rang an omen sitting on his own side');
    assert(mate.statusEffects.some((fx) => fx.stat === 'doom'),
      'he cleared an omen sitting on his own side');
  } finally { Math.random = real; Battle.active = prev; }
});

// His hex buys the clock a turn, which is the one lever that makes an
// omen worth MORE rather than sooner: another turn is another turn of
// the party loading it.
test('Omen: Further Ahead buys the clock a turn', () => {
  const hex = POSITIONALS.further_ahead;
  assert(HEROES.omen.positional === hex, 'Omen is not on his own hex');
  assert(hex.position === POSITION.BACK, 'he sees further from the back');

  const lay = (onHex) => {
    const battle = makeBattle();
    const prev = Battle.active;
    Battle.active = battle;
    const real = Math.random;
    try {
      const omen = seatOn(battle, HEROES.omen, TEAM.PLAYER, 4);
      if (!onHex) omen.slot = battle.playerSlots[0];
      assert(omen.positionalActive() === onHex, 'the fixture seated him wrong');
      const foe = roomy(seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1), 400);
      foe.hookSources = () => [];
      foe.debuffResistance = () => 0;
      Math.random = () => 0.01;
      Abilities.applyEffect({ type: 'doom', mult: 1.60, turns: 3 }, omen, foe);
      return foe.statusEffects.find((fx) => fx.stat === 'doom');
    } finally { Math.random = real; Battle.active = prev; }
  };
  const off = lay(false);
  const on = lay(true);
  assert(off.turns === 3, `off the hex the clock runs ${off.turns}`);
  assert(on.turns === 4, `on the hex the clock runs ${on.turns}`);
  // The hex buys TIME, not size: what it is worth at cast is unchanged.
  assert(on.amount === off.amount, 'the hex made the omen bigger as well as longer');
});

// The last Hollowbone. A carrion vulture does not hunt -- it arrives
// where things have already died and it eats -- and the sect makes
// bodies faster than any other on the roster.
//
// Not Rend's job and not Malachar's. Rend CONVERTS what is done to the
// party; Malachar COUNTS what the fight has cost and never touches a
// body. Carrion takes the body off the board, which is the only one of
// the three the enemy feels.
test('Carrion: nothing goes to waste', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const carrion = seatOn(battle, HEROES.carrion, TEAM.PLAYER, 2);
    carrion.slot = battle.playerSlots[4];       // off his hex: one meal a turn
    carrion.hp = Math.round(carrion.maxHp * 0.20);
    // The LIVING bird is seated first, so it is first in battle.units
    // and a search that forgot to ask whether a body is dead would find
    // it before any corpse. Seated after the corpses the assertion
    // proved nothing -- the array order was doing the work.
    const standing = seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 2);
    standing.hookSources = () => [];
    const fallen = [1, 0].map((i) => {
      const u = seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, i);
      u.hookSources = () => [];
      u.hp = 0;
      return u;
    });

    const before = carrion.hp;
    carrion.startTurn(battle);
    assert(carrion.hp > before, 'he ate and got nothing for it');
    assert(carrion.hp - before === Math.round(carrion.maxHp * 0.15),
      `a body was worth ${carrion.hp - before}, wanted 15% of his pool`);

    // One a turn off the hex, and the body is GONE -- off the board and
    // off its hex, not merely dead.
    const eaten = fallen.filter((u) => !battle.units.includes(u));
    assert(eaten.length === 1, `${eaten.length} bodies went in one turn`);
    assert(eaten[0].slot === null, 'the body still holds a hex');
    assert(battle.enemySlots.filter((s) => s.unit === eaten[0]).length === 0,
      'the hex still points at what he ate');

    // Which means nothing can raise it -- and the rule lives in TARGET
    // SELECTION rather than in revive(). Every revive on the roster is
    // `dead-ally` targeting, and the fallen a player or the auto-battler
    // can pick come from battle.units; a body that is not in that array
    // cannot be chosen, clicked or reached. Calling revive() on the
    // object directly still works, because nothing is guarding a method
    // nobody can get to it through, and asserting otherwise would have
    // been asserting a guard that does not exist.
    assert(!battle.units.includes(eaten[0]),
      'the body is still on the field for a revive to find');
    assert(!battle.livingUnits().includes(eaten[0]), 'the body is still in play');
    assert(battle.units.filter((u) => !u.alive).length === 1,
      'the field does not hold exactly the one corpse he left');

    // Never the living, and never himself.
    assert(battle.units.includes(standing), 'he ate somebody who was still standing');
    carrion.startTurn(battle);
    assert(battle.units.includes(carrion), 'he ate himself');

    // Rip is priced off DEF, like every wall's slot one. Unpinned, a
    // swap to ATK broke nothing at all -- and on a hero whose attack
    // stat is deliberately small it is the difference between a swing
    // and a tickle.
    {
      const rip = carrion.abilities.find((a) => a.def.id === 'carrion_rip');
      const dmg = rip.def.effects.find((e) => e.type.startsWith('damage'));
      assert(dmg.type === 'damageDef', `Rip is priced off ${dmg.type}`);
      const foe = roomy(seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, 3), 400);
      foe.hookSources = () => [];
      foe.dodgeChance = () => 0; foe.reflectChance = () => 0;
      const swing = () => {
        const was = foe.hp;
        const real = Math.random;
        Math.random = () => 0.99;
        try { Abilities.execute(rip.def, carrion, foe, battle); }
        finally { Math.random = real; }
        return was - foe.hp;
      };
      const bare = swing();
      carrion.baseDef *= 2;
      assert(swing() > bare * 1.5, 'doubling his DEF did not move the swing');
      carrion.baseDef /= 2;
      carrion.baseAtk *= 4;
      assert(Math.abs(swing() - bare) <= 2, 'quadrupling his ATK moved the swing');
      carrion.baseAtk /= 4;
    }

    // And an empty field costs nothing: the hook says so rather than
    // reporting a meal of nothing.
    const clean = makeBattle();
    Battle.active = clean;
    const alone = seatOn(clean, HEROES.carrion, TEAM.PLAYER, 2);
    assert(HEROES.carrion.passive.hooks.onTurnStart(alone, clean) === null,
      'he announced clearing up an empty field');
  } finally { Battle.active = prev; }
});

// His hex is a RATE, not a ceiling -- three hexes on this roster
// already lift a cap and it had become a habit -- and the rate is the
// only thing that matters to a hero fed one body a turn.
test('Carrion: First at the Table is two a turn', () => {
  const hex = POSITIONALS.first_at_the_table;
  assert(HEROES.carrion.positional === hex, 'Carrion is not on his own hex');
  assert(hex.position === POSITION.FRONT, 'he stands where the bodies fall');

  const clear = (onHex) => {
    const battle = makeBattle();
    const prev = Battle.active;
    Battle.active = battle;
    try {
      const carrion = seatOn(battle, HEROES.carrion, TEAM.PLAYER, 2);
      if (!onHex) carrion.slot = battle.playerSlots[4];
      assert(carrion.positionalActive() === onHex, 'the fixture seated him wrong');
      [0, 1, 3].forEach((i) => {
        const u = seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, i);
        u.hookSources = () => [];
        u.hp = 0;
      });
      carrion.startTurn(battle);
      return battle.units.filter((u) => !u.alive).length;
    } finally { Battle.active = prev; }
  };
  assert(clear(false) === 2, 'off the hex he took more than one');
  assert(clear(true) === 1, 'on the hex he did not take two');
});

// The whole table at once: worth nothing on an untouched field and a
// great deal on one that has gone badly, which is the only kind a
// 5-star wall is still standing on.
test('Carrion: The Whole Table clears everything there is', () => {
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const carrion = seatOn(battle, HEROES.carrion, TEAM.PLAYER, 2);
    const table = carrion.abilities.find((a) => a.def.id === 'carrion_the_whole_table');
    assert(table, 'The Whole Table is missing');

    // An empty field pays nothing rather than reading as a skill that
    // did something invisible.
    carrion.hp = Math.round(carrion.maxHp * 0.10);
    const dry = carrion.hp;
    Abilities.execute(table.def, carrion, carrion, battle);
    assert(carrion.hp === dry, 'an empty field mended him');

    // Four bodies, both sides, all of them.
    [0, 1, 2].forEach((i) => {
      const u = seatOn(battle, DUMMIES.rat_knight, TEAM.ENEMY, i);
      u.hookSources = () => [];
      u.hp = 0;
    });
    const ally = seatOn(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 3);
    ally.hookSources = () => [];
    ally.hp = 0;

    Abilities.execute(table.def, carrion, carrion, battle);
    assert(!battle.units.some((u) => !u.alive), 'a body was left on the table');
    assert(carrion.hp - dry === Math.round(carrion.maxHp * 0.12) * 4,
      `four bodies mended ${carrion.hp - dry}, wanted four twelfths of his pool`);
  } finally { Battle.active = prev; }
});

// Auto-equip resolves a ROSTER UID, not a character id.
//
// It used to read `HEROES[heroId]` with a uid in hand, which finds
// nothing, so the guard below it returned 0 for every hero on the
// roster: the button reported "already wearing the best available" over
// eight empty slots, and had done since the roster became a list of
// instances. Nothing caught it because nothing asked auto-equip to
// actually move a piece.
test('auto-equip fills empty slots for a hero held by uid', () => {
  const before = GameState.ownedHeroIds();
  const uid = before[0];
  assert(uid !== undefined, 'the starting roster is empty');
  // A piece for every slot, none of them worn.
  const sets = Object.keys(Gear.SETS);
  for (let i = 0; i < Gear.SLOTS.length * 3; i++) {
    GameState.addGear(Gear.drop(sets[i % sets.length], 5));
  }
  const emptyBefore = Gear.SLOTS
    .filter((s) => !GameState.equipmentOf(uid)[s]).length;
  assert(emptyBefore === Gear.SLOTS.length,
    `hero started with ${Gear.SLOTS.length - emptyBefore} pieces on`);
  const changed = GameState.autoEquip(uid);
  assert(changed > 0, 'auto-equip moved nothing with a full inventory to pick from');
  const wornAfter = Gear.SLOTS.filter((s) => GameState.equipmentOf(uid)[s]).length;
  assert(wornAfter === changed,
    `reported ${changed} slots upgraded but ${wornAfter} are worn`);
});

// The star-point economy, on its own terms.
//
// The table is the factorials, which buys two properties at once: each
// rank still costs N of the rank below (four 3-stars make a 4-star), and
// the same bar can equally be filled with anything smaller. The old rule
// had neither -- it only ever accepted same-rank heroes, so a spare
// 1-star could do nothing for a 3-star and a hero one body short of a
// star up stayed one body short of it forever.
test('star points: the table, the rollover, and the cascade', () => {
  const G = loadGame();
  const { GameState, Progression, HEROES } = G;
  const P = Progression;

  // The table, and the two readings of it agreeing.
  const WANT = [1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800];
  for (let s = 1; s <= P.MAX_STARS; s++) {
    assert(P.starValue(s) === WANT[s - 1],
      `${s}* is worth ${P.starValue(s)}, wanted ${WANT[s - 1]}`);
  }
  for (let s = 1; s < P.MAX_STARS; s++) {
    assert(P.starUpCost(s) === P.starValue(s + 1),
      `${s}* -> ${s + 1}* costs ${P.starUpCost(s)}, not a ${s + 1}*'s worth`);
    // Each rank is exactly (s+1) heroes of the rank below. This is the
    // property the factorials are chosen FOR, so it is asserted rather
    // than left as a comment.
    assert(P.starUpCost(s) === (s + 1) * P.starValue(s),
      `${s}* -> ${s + 1}* is not ${s + 1} heroes of the rank below`);
  }
  assert(P.starUpCost(P.MAX_STARS) === 0, 'the cap still quotes a price');

  const spendable = (id) => {
    const uid = GameState.addHero(id).uid;
    // Blessed arrivals pin themselves as favourites and then refuse to
    // be fodder; that roll is random and is not what this is testing.
    if (GameState.isFavorite(uid)) GameState.toggleFavorite(uid);
    return uid;
  };
  const byRarity = (r) => Object.keys(HEROES).find((k) => (HEROES[k].rarity || 1) === r);
  const one = byRarity(1), three = byRarity(3), five = byRarity(5);
  assert(one && three && five, 'the roster is missing a rarity this test needs');

  // The headline case: twenty-four 1-stars take a 3-star to 4, and they
  // do NOT have to arrive together.
  const target = spendable(three);
  assert(GameState.progressOf(target).stars === 3, 'expected a 3-star target');
  const junk = [];
  for (let i = 0; i < 24; i++) junk.push(spendable(one));
  GameState.sacrifice(target, junk.slice(0, 10));
  let pr = GameState.progressOf(target);
  assert(pr.stars === 3 && pr.starPoints === 10,
    `ten 1-stars should bank 10 and star nothing; got ${pr.stars}* / ${pr.starPoints}`);
  GameState.sacrifice(target, junk.slice(10));
  pr = GameState.progressOf(target);
  assert(pr.stars === 4 && pr.starPoints === 0,
    `twenty-four 1-stars should reach 4*; got ${pr.stars}* / ${pr.starPoints}`);

  // Cascade and rollover: one 5-star (120) dropped on a 1-star pays
  // 2 + 6 + 24 for three ratings and banks the remaining 88.
  const climber = spendable(one);
  assert(GameState.progressOf(climber).stars === 1, 'expected a 1-star climber');
  const report = GameState.sacrifice(climber, [spendable(five)]);
  const after = GameState.progressOf(climber);
  assert(report.points === 120, `a 5-star paid ${report.points}`);
  assert(after.stars === 4, `one 5-star should carry a 1-star to 4*, got ${after.stars}*`);
  assert(after.starPoints === 120 - 2 - 6 - 24,
    `rollover is ${after.starPoints}, wanted ${120 - 2 - 6 - 24}`);

  // Nothing is banked against a bar that does not exist. Seeded through
  // the save loader, because climbing to the cap honestly costs several
  // million points.
  const seeded = loadGame({ save: { schemaVersion: 7, roster: {
    cap: { heroId: three, level: 1, xp: 0, stars: P.MAX_STARS, attune: 0,
      equipment: {}, skills: {}, favorite: false, starPoints: 0 },
    food: { heroId: five, level: 1, xp: 0, stars: 5, attune: 0,
      equipment: {}, skills: {}, favorite: false, starPoints: 0 },
  }, nextHeroUid: 99 } });
  const S = seeded.GameState;
  assert(S.progressOf('cap') && S.progressOf('cap').stars === P.MAX_STARS,
    'the seeded save did not produce a capped hero');
  const r2 = S.sacrifice('cap', ['food']);
  const cappedPr = S.progressOf('cap');
  assert(r2 && r2.spent === 1, 'the sacrifice at the cap did not happen');
  assert(cappedPr.stars === P.MAX_STARS, 'a capped hero moved');
  assert(cappedPr.starPoints === 0,
    `a capped hero banked ${cappedPr.starPoints} points against nothing`);
});

// Dumplings: fodder with a face.
//
// A dumpling walks the roster without being a hero, which is a shape the
// codebase had no precedent for -- summons are hero-shaped but never
// owned, and everything else in the roster is a fighter. So the rules
// that keep it out of the places it does not belong are pinned here.
test('a dumpling is inventory, not a roster entry', () => {
  const G = loadGame();
  const { GameState, Progression, HEROES, DUMPLINGS } = G;

  // It is NOT a hero, and that is the whole reason it can exist: the
  // gacha, the compendium, the balance pass and every data test sweep
  // HEROES, and a thing with no element, skills, passive or hex would
  // need an exemption in each.
  assert(!HEROES.dumpling, 'the dumpling leaked into HEROES');
  assert(DUMPLINGS && DUMPLINGS.dumpling, 'there is no dumpling to test');

  // And it is not a roster entry either, which is the thing that
  // changed. It used to hold a uid and a slot, so it cost roster room
  // and could overflow into a vault that could not spend it. A bag
  // counted by star has no slot to hold and nothing to overflow into.
  const before = GameState.rosterCount();
  const got = GameState.addDumpling(3);
  assert(got && got.stars === 3 && got.n === 1,
    `addDumpling returned ${JSON.stringify(got)}`);
  assert(got.uid === undefined, 'a dumpling was handed a roster uid');
  assert(GameState.rosterCount() === before, 'a dumpling took a roster slot');
  assert(GameState.dumplingCount() === 1, 'the count disagrees');
  assert(GameState.dumplingsAt(3) === 1, 'the bag did not record the rating');
  assert(JSON.stringify(GameState.dumplingBag()) === '{"3":1}',
    `the bag reads ${JSON.stringify(GameState.dumplingBag())}`);

  // Its own price ladder, not the factorials.
  const WANT = [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000, 500000];
  for (let st = 1; st <= Progression.MAX_STARS; st++) {
    assert(Progression.starValue(st, DUMPLINGS.dumpling) === WANT[st - 1],
      `${st}* dumpling is worth ${Progression.starValue(st, DUMPLINGS.dumpling)}, ` +
      `wanted ${WANT[st - 1]}`);
    assert(GameState.dumplingValue(st) === WANT[st - 1],
      `dumplingValue(${st}) is ${GameState.dumplingValue(st)}`);
  }
  // A hero of the same rating is still priced off the factorials: the
  // override is per-def, not a change to the table.
  assert(Progression.starValue(3) === 6, 'the hero table moved');
  assert(GameState.dumplingPoints() === 100,
    `the bag is worth ${GameState.dumplingPoints()}`);

  // It never appears among the heroes offered as fodder -- it is not a
  // hero and has its own shelf on the panel.
  const heroId = Object.keys(HEROES).find((k) => (HEROES[k].rarity || 1) === 1);
  const heroUid = GameState.addHero(heroId).uid;
  if (GameState.isFavorite(heroUid)) GameState.toggleFavorite(heroUid);
  const target = GameState.addHero(heroId).uid;
  const offered = GameState.sacrificeOptions(target);
  assert(offered.every((o) => GameState.defIdOf(o.uid) !== 'dumpling'),
    'a dumpling turned up in the hero sacrifice list');
  assert(offered.every((o) => o.consumable === undefined),
    'sacrificeOptions still carries a consumable flag');

  // Eaten through the bag, and the points land.
  const bankBefore = GameState.progressOf(target).starPoints || 0;
  const report = GameState.sacrifice(target, [], { 3: 1 });
  assert(report && report.points === 100, `paid ${report && report.points}`);
  assert(report.dumplings === 1, `ate ${report.dumplings} dumplings`);
  assert(report.spent === 0, 'a hero was eaten too');
  assert(GameState.dumplingCount() === 0, 'the bag did not shrink');
  const bankAfter = GameState.progressOf(target).starPoints || 0;
  assert(report.starred || bankAfter === bankBefore + 100,
    `banked ${bankAfter}, wanted ${bankBefore + 100}`);

  // The bag never pays out more than it holds.
  GameState.addDumpling(1, 2);
  const over = GameState.sacrifice(target, [], { 1: 99 });
  assert(over.dumplings === 2, `${over.dumplings} came out of a bag holding 2`);
  assert(GameState.dumplingCount() === 0, 'the bag went negative');
});

test('a full roster no longer costs a dumpling anything', () => {
  // The bug this whole change exists to kill. Dumplings used to
  // overflow into the vault once the roster filled, and a vaulted
  // dumpling could not be spent -- so the shelf a dumpling landed on
  // when the roster was fullest was the one shelf it was useless on,
  // and the roster is fullest exactly when a player is buying dumplings
  // to star up and clear it.
  const G = loadGame();
  const { GameState, HEROES } = G;
  const filler = Object.keys(HEROES)[0];
  let guard = 0;
  while (GameState.rosterCount() < GameState.MAX_ROSTER && guard++ < 400) {
    if (!GameState.addHero(filler)) break;
  }
  assert(GameState.rosterCount() === GameState.MAX_ROSTER, 'the roster did not fill');
  assert(GameState.storageCount() === 0, 'the vault is not empty to start');

  GameState.addDiamonds(500000);
  const bought = [];
  for (let i = 0; i < 3; i++) bought.push(GameState.buyDumpling(8));
  assert(bought.every((b) => b && b.stars === 8), 'the shop refused on a full roster');
  assert(bought.every((b) => !b.error), 'the shop reported no room');
  assert(GameState.dumplingCount() === 3, `${GameState.dumplingCount()} in hand`);
  assert(GameState.storageCount() === 0, 'a dumpling reached the vault');
  assert(GameState.rosterCount() === GameState.MAX_ROSTER,
    'a dumpling displaced a hero');

  // And they are spendable, which is the point.
  const target = GameState.ownedHeroIds().find((id) =>
    !GameState.isFavorite(id) && GameState.teamSlotOf(id) === null);
  assert(GameState.starUpAffordable(target),
    '150,000 points in hand and the readout says it cannot be paid');
  const r = GameState.sacrifice(target, [], { 8: 3 });
  assert(r && r.points === 150000, `the bag paid ${r && r.points}`);
  assert(r.to > r.from, `${r.from}★ did not climb on 150,000 points`);
});

test('planDumplingFill takes the least it can, and everything when short', () => {
  const G = loadGame();
  const { GameState, HEROES } = G;
  const heroId = Object.keys(HEROES).find((k) => (HEROES[k].rarity || 1) === 1);
  const target = GameState.addHero(heroId).uid;
  // A 1★ needs 2 points to reach 2★, so a single 1★ dumpling (10) is
  // already too much -- and the plan must not take a second.
  GameState.addDumpling(1, 4);
  const plan = GameState.planDumplingFill(target, []);
  assert(plan.n === 1, `took ${plan.n} dumplings for a 2-point bar`);
  assert(JSON.stringify(plan.bag) === '{"1":1}', JSON.stringify(plan.bag));
  assert(plan.short === 0, 'the plan reported itself short');

  // Cheapest first: with a big one and small ones in the bag, the small
  // ones go first while they are enough.
  const G2 = loadGame();
  const t2 = G2.GameState.addHero(heroId).uid;
  G2.GameState.addDumpling(8, 1);
  G2.GameState.addDumpling(1, 1);
  const p2 = G2.GameState.planDumplingFill(t2, []);
  assert(JSON.stringify(p2.bag) === '{"1":1}',
    `an 8★ was spent when a 1★ would have done: ${JSON.stringify(p2.bag)}`);

  // Not enough: everything goes in, and the plan says how far short.
  const G3 = loadGame();
  const big = Object.keys(G3.HEROES).find((k) => (G3.HEROES[k].rarity || 1) >= 4);
  const t3 = G3.GameState.addHero(big).uid;
  G3.GameState.addDumpling(1, 2);
  const p3 = G3.GameState.planDumplingFill(t3, []);
  assert(p3.n === 2, `took ${p3.n} of 2`);
  assert(p3.short > 0, 'a 20-point bag covered a 4★ star up');
  assert(p3.points === 20, `counted ${p3.points}`);
});

test('an old save\'s dumplings are rescued out of the roster and the vault', () => {
  // The migration. A save written before this change has dumplings as
  // roster and storage entries; they must come back as bag counts with
  // nothing lost and the slots returned.
  const save = {
    // Stamped at the current schema on purpose. Dumplings postdate every
    // migration in the table, so a real save holding one is already
    // here; starting at 0 would run migration 7, which rebuilds the
    // roster keyed by character and would collapse the three 8-stars
    // into one before the sweep ever saw them.
    schemaVersion: 7,
    starters: { },
    roster: {
      '1': { heroId: 'dumpling', level: 1, xp: 0, stars: 8, equipment: {}, skills: {} },
      '2': { heroId: 'dumpling', level: 1, xp: 0, stars: 8, equipment: {}, skills: {} },
      '3': { heroId: 'dumpling', level: 1, xp: 0, stars: 1, equipment: {}, skills: {} },
    },
    storage: {
      '4': { heroId: 'dumpling', level: 1, xp: 0, stars: 8, equipment: {}, skills: {} },
      '5': { heroId: 'dumpling', level: 1, xp: 0, stars: 5, equipment: {}, skills: {} },
    },
    // And limbo, which is where roster dumplings were quietly ending up:
    // the guard that parks entries with no HEROES definition never knew
    // about the dumpling table, so one standing in the roster was
    // limboed on the next load and vanished from every screen. The sweep
    // has to run before that guard AND collect what it already took.
    limbo: {
      '9': { heroId: 'dumpling', level: 1, xp: 0, stars: 6, equipment: {}, skills: {} },
    },
    nextHeroUid: 10,
  };
  const G = loadGame({ save });
  const bag = G.GameState.dumplingBag();
  assert(G.GameState.dumplingCount() === 6,
    `${G.GameState.dumplingCount()} of 6 dumplings survived the migration`);
  assert(bag['8'] === 3, `${bag['8']} 8-stars, wanted 3 (roster AND vault)`);
  assert(bag['1'] === 1 && bag['5'] === 1 && bag['6'] === 1, JSON.stringify(bag));
  // The slots come back. The starters land on the empty roster after
  // the sweep, so what matters is that no DUMPLING is left standing on
  // either shelf.
  assert(G.GameState.ownedHeroIds().every((id) => G.GameState.defIdOf(id) !== 'dumpling'),
    'a dumpling was left in the roster');
  assert(G.GameState.storageCount() === 0, `${G.GameState.storageCount()} left in the vault`);
  // And nothing of value was lost: 3x50,000 + 10 + 1,000 + 5,000.
  assert(G.GameState.dumplingPoints() === 156010,
    `the rescued bag is worth ${G.GameState.dumplingPoints()}`);
  assert(Object.keys(G.GameState.storedHeroIds()).length === 0, 'the vault kept one');
});

// The Kitchen: five hundred quests, all of them paying dumplings.
test('the Kitchen board is 500 quests that all pay dumplings', () => {
  const G = loadGame();
  const { Quests, GameState, Progression } = G;
  const board = Quests.DEFS.kitchen;
  assert(board && board.length === 500,
    `the Kitchen holds ${board ? board.length : 0} quests, wanted 500`);

  const ids = new Set();
  for (const q of board) {
    assert(!ids.has(q.id), `duplicate Kitchen quest id ${q.id}`);
    ids.add(q.id);
    assert(q.reward && q.reward.dumplings, `${q.id} pays something else`);
    const { stars, n } = q.reward.dumplings;
    assert(stars >= 1 && stars <= Progression.MAX_STARS, `${q.id} pays a ${stars}* dumpling`);
    assert(n >= 1, `${q.id} pays ${n} dumplings`);
    assert(q.goal > 0 && Number.isFinite(q.goal), `${q.id} has goal ${q.goal}`);
    assert(Quests.rewardLabel(q.reward) !== '', `${q.id} renders no reward`);
  }
  // Goals climb within a chain, so a later rung is always more work.
  const chains = {};
  for (const q of board) (chains[q.counter] ||= []).push(q);
  for (const [counter, list] of Object.entries(chains)) {
    for (let i = 1; i < list.length; i++) {
      assert(list[i].goal > list[i - 1].goal,
        `${counter} rung ${i + 1} (${list[i].goal}) does not exceed rung ${i}`);
    }
  }

  // It reads LIFETIME totals, like the Journey: progress made before a
  // rung was visible still counts.
  assert(GameState.lifetimeBoard('kitchen'), 'the Kitchen resets like a daily');
  const first = chains.wins[0];
  GameState.questBump('wins', first.goal);
  const before = GameState.dumplingCount();
  const paid = GameState.claimQuest('kitchen', first.id);
  assert(paid && paid.dumplings, `claiming paid ${JSON.stringify(paid)}`);
  assert(GameState.dumplingCount() === before + first.reward.dumplings.n,
    'the dumplings did not land in the roster');
  assert(GameState.claimQuest('kitchen', first.id) === null, 'claimed twice');
});

// The dumpling picker: the smallest set that finishes the bar.

// The dumpling counter in the Diamond Shop.
test('the dumpling shop prices 4* to 8* and never sells a worse deal upward', () => {
  const G = loadGame();
  const { GameState, Progression, DUMPLINGS } = G;
  const D = DUMPLINGS.dumpling;

  // Only the middle of the ladder is for sale. A 1-star is what a lucky
  // battle drop pays and is not worth a transaction; 9s and 10s are the
  // top of the Kitchen board and should not be purchasable at all.
  const onSale = Object.keys(GameState.DUMPLING_PRICES).map(Number).sort((a, b) => a - b);
  assert(onSale.join(',') === '4,5,6,7,8',
    `the counter sells ${onSale.join(',')}, wanted 4,5,6,7,8`);
  for (const off of [1, 2, 3, 9, 10]) {
    assert(GameState.dumplingPrice(off) === null, `${off}* is on the counter`);
    const before = GameState.diamonds;
    assert(GameState.buyDumpling(off) === null, `${off}* was sold anyway`);
    assert(GameState.diamonds === before, `buying a ${off}* moved diamonds`);
  }

  // The two fixed ends.
  assert(GameState.dumplingPrice(4) === 200, `a 4* costs ${GameState.dumplingPrice(4)}`);
  assert(GameState.dumplingPrice(8) === 10000, `an 8* costs ${GameState.dumplingPrice(8)}`);

  // Price climbs with the rating, and so does what a diamond buys. The
  // second is the rule the middle three were chosen by: a player who
  // buys UP a rung must never get less for their money.
  let lastPrice = 0;
  let lastRate = 0;
  for (const stars of onSale) {
    const price = GameState.dumplingPrice(stars);
    const rate = Progression.starValue(stars, D) / price;
    assert(price > lastPrice, `${stars}* (${price}) is not dearer than the rung below`);
    assert(rate >= lastRate - 1e-9,
      `${stars}* pays ${rate.toFixed(3)} points a diamond, worse than the ` +
      `${lastRate.toFixed(3)} below it`);
    lastPrice = price;
    lastRate = rate;
  }

  // A purchase takes exactly the price and hands over exactly one.
  GameState.addDiamonds(1000);
  const purse = GameState.diamonds;
  const held = GameState.dumplingCount();
  const got = GameState.buyDumpling(5);
  assert(got && got.stars === 5, `bought ${JSON.stringify(got)}`);
  assert(GameState.diamonds === purse - 400,
    `a 5* cost ${purse - GameState.diamonds}, wanted 400`);
  assert(GameState.dumplingCount() === held + 1, 'the dumpling did not arrive');

  // Too few diamonds: refused, and nothing moves.
  const broke = loadGame();
  const B = broke.GameState;
  while (B.diamonds > 0) B.spendDiamonds(1);
  assert(B.buyDumpling(4) === null, 'a dumpling was sold on credit');
  assert(B.dumplingCount() === 0, 'a dumpling arrived unpaid for');

  // A full account is no longer a reason to refuse. The counter used to
  // check for room before taking the diamonds, because a dumpling
  // needed a shelf to stand on and charging for one the game could not
  // hand over would have been the worst bug on that screen. There is no
  // shelf and no room check now: an inventory line cannot fill up, so
  // the sale always completes.
  const full = loadGame();
  const F = full.GameState;
  F.addDiamonds(20000);
  while (F.intakeShelf()) F.addHero('silas');
  const beforeFull = F.diamonds;
  const res = F.buyDumpling(4);
  assert(res && res.stars === 4 && !res.error,
    `a full account got ${JSON.stringify(res)}`);
  assert(F.diamonds === beforeFull - F.dumplingPrice(4),
    `charged ${beforeFull - F.diamonds} for a ${F.dumplingPrice(4)} dumpling`);
  assert(F.dumplingsAt(4) === 1, 'the paid-for dumpling did not arrive');
});

// The bottom-shelf sweep: tick every spendable hero at or below a rating.
test('planStarSweep takes the shelf and leaves the dumplings', () => {
  const G = loadGame();
  const { GameState, HEROES } = G;
  const byR = (r) => Object.keys(HEROES).find((k) => (HEROES[k].rarity || 1) === r &&
    !['light', 'dark'].includes(HEROES[k].element));
  const spend = (r) => {
    const uid = GameState.addHero(byR(r)).uid;
    if (GameState.isFavorite(uid)) GameState.toggleFavorite(uid);
    return uid;
  };

  const target = spend(4);
  const ones = [spend(1), spend(1), spend(1), spend(1)];
  const twos = [spend(2), spend(2), spend(2)];
  const threes = [spend(3), spend(3)];
  const five = spend(5);
  const dump = GameState.addDumpling(3).uid;   // a 3-star that must survive

  const sweep1 = GameState.planStarSweep(target, 1);
  assert(sweep1.uids.length === ones.length,
    `<=1* took ${sweep1.uids.length}, wanted ${ones.length}`);
  assert(sweep1.points === ones.length, `<=1* is worth ${sweep1.points}, wanted 4`);

  const sweep3 = GameState.planStarSweep(target, 3);
  const want = ones.length + twos.length + threes.length;
  assert(sweep3.uids.length === want, `<=3* took ${sweep3.uids.length}, wanted ${want}`);
  // 4x1 + 3x2 + 2x6 = 22
  assert(sweep3.points === 22, `<=3* is worth ${sweep3.points}, wanted 22`);

  // The two things it must never touch.
  assert(!sweep3.uids.includes(five), 'the sweep ate a 5-star');
  assert(!sweep3.uids.includes(dump),
    'the sweep ate a dumpling -- they have their own button, which spends the ' +
    'fewest it can, and this one spends everything');
  assert(!sweep3.uids.includes(target), 'the sweep ate the hero being improved');

  // It is additive: what is already ticked is not offered twice, so
  // pressing <=2* and then <=3* adds only the 3-stars.
  const twoFirst = GameState.planStarSweep(target, 2);
  const thenThree = GameState.planStarSweep(target, 3, twoFirst.uids);
  assert(thenThree.uids.length === threes.length,
    `the second press re-picked ${thenThree.uids.length}, wanted just the 3-stars`);
  assert(twoFirst.points + thenThree.points === sweep3.points,
    'two presses do not add up to the one that takes everything');

  // Favourites and the fielded are never offered, exactly as by hand.
  GameState.toggleFavorite(ones[0]);
  GameState.setTeamSlot(0, ones[1]);
  const guarded = GameState.planStarSweep(target, 3);
  assert(!guarded.uids.includes(ones[0]), 'the sweep ate a favourite');
  assert(!guarded.uids.includes(ones[1]), 'the sweep ate a fielded hero');
  assert(guarded.uids.length === want - 2, `guarded sweep took ${guarded.uids.length}`);
});

// ---- The Endless Tower's difficulty curve ----------------------------
//
// The bug these guard against: enemy power used to be LINEAR in the
// floor, so the step from one floor to the next shrank towards nothing
// -- 4.3% at floor 10, 0.4% at floor 222, 0.1% at floor 800 -- while a
// player's power grows in multiplicative chunks. See js/tower.js.

test('tower: every floor above the anchor is the same step harder', () => {
  const step = (f) => Tower.power(f + 1) / Tower.power(f);
  const at200 = step(200);
  for (const f of [150, 300, 500, 1000, 2000]) {
    const d = Math.abs(step(f) - at200);
    assert(d < 1e-9, `step at floor ${f} is ${step(f)}, not ${at200}`);
  }
  // And that step is a real one, not the dribble the linear curve
  // decayed into. 1% compounding doubles the tower every ~70 floors.
  assert(at200 > 1.005, `step is only ${((at200 - 1) * 100).toFixed(2)}%`);
});

test('tower: floors up to the anchor are untouched', () => {
  for (const f of [1, 10, 50, 99, Tower.ANCHOR]) {
    assert(Tower.correction(f) === 1,
      `floor ${f} correction is ${Tower.correction(f)}, not 1`);
    const s = Tower.statScale(f);
    assert(s.hp === 1 && s.atk === 1 && s.def === 1,
      `floor ${f} scales ${JSON.stringify(s)}`);
  }
  // Continuous across the graft: no cliff at the anchor.
  const jump = Tower.power(Tower.ANCHOR + 1) / Tower.power(Tower.ANCHOR);
  assert(jump > 1 && jump < 1.02, `anchor jump is ${jump}`);
});

test('tower: power only ever climbs, and stays a finite number', () => {
  let prev = 0;
  for (let f = 1; f <= 3000; f += 7) {
    const p = Tower.power(f);
    assert(Number.isFinite(p), `floor ${f} power is ${p}`);
    assert(p >= prev, `floor ${f} power ${p} fell below ${prev}`);
    prev = p;
  }
  // Past the guard rail it flattens rather than overflowing, and the
  // stats it produces are still safe integers.
  assert(Tower.power(100000) === Tower.MAX_POWER, 'no ceiling at floor 100000');
  const def = Object.values(ENEMIES)[0];
  const u = new Unit(def, TEAM.ENEMY, { level: Tower.level(100000), stars: 3,
    statScale: Tower.statScale(100000) });
  assert(Number.isSafeInteger(u.maxHp), `deep-floor HP is ${u.maxHp}`);
  assert(Number.isSafeInteger(u.baseAtk), `deep-floor ATK is ${u.baseAtk}`);
});

test('tower: the curve rides HP and ATK, never DEF', () => {
  // DEF sits on a saturating mitigation curve (300 / (def + 300)), so
  // compounding it buys near-immunity and produces a fight neither side
  // can finish. It stays on the level curve on purpose.
  const deep = Tower.statScale(600);
  assert(deep.def === 1, `deep floors scale DEF by ${deep.def}`);
  assert(deep.hp > 20 && deep.atk > 20, `deep floors barely scale: ${deep.hp}`);
  const def = Object.values(ENEMIES)[0];
  const lvl = Tower.level(600);
  const plain = new Unit(def, TEAM.ENEMY, { level: lvl, stars: 3 });
  const scaled = new Unit(def, TEAM.ENEMY, { level: lvl, stars: 3,
    statScale: deep });
  assert(scaled.baseDef === plain.baseDef,
    `DEF moved: ${plain.baseDef} -> ${scaled.baseDef}`);
  assert(scaled.maxHp > plain.maxHp * 20, 'HP did not compound');
});

test('statScale still accepts a bare number (the campaign passes one)', () => {
  const def = Object.values(ENEMIES)[0];
  const one = new Unit(def, TEAM.ENEMY, { level: 40, stars: 3 });
  const two = new Unit(def, TEAM.ENEMY, { level: 40, stars: 3, statScale: 2 });
  assert(two.maxHp === Math.round(one.maxHp * 2) ||
         Math.abs(two.maxHp - one.maxHp * 2) <= 2, `hp ${one.maxHp} -> ${two.maxHp}`);
  assert(Math.abs(two.baseDef - one.baseDef * 2) <= 2,
    `a bare statScale stopped scaling DEF: ${one.baseDef} -> ${two.baseDef}`);
});

test('tower: a floor that runs out of turns is a LOSS', () => {
  // Without this an auto-climb that reaches a floor it can neither kill
  // nor die to never stops.
  const battle = new Battle();
  battle.autoMode = true;   // nobody is here to press buttons
  battle.turnLimit = 2;     // short enough that nothing dies first
  battle.turnLimitWinner = TEAM.ENEMY;
  const ally = new Unit(Object.values(HEROES)[0], TEAM.PLAYER, { level: 50, stars: 5 });
  const foe = new Unit(Object.values(ENEMIES)[0], TEAM.ENEMY, { level: 50, stars: 5 });
  battle.placeUnit(ally, 0);
  battle.placeUnit(foe, 0);
  let winner = null;
  battle.onBattleEnd = (w) => { winner = w; };
  for (let i = 0; i < 4000 && winner === null; i++) battle.update(0.05);
  assert(winner === TEAM.ENEMY, `clock handed the floor to ${winner}`);
  assert(Tower.TURN_LIMIT > 674,
    `deadline ${Tower.TURN_LIMIT} would steal benched clears that took 674 turns`);
});

test('tower: boss floors are every tenth, and the bosses cycle', () => {
  for (const f of [10, 20, 500]) assert(Tower.isBossFloor(f), `floor ${f} has no boss`);
  for (const f of [1, 5, 9, 11, 15, 199]) assert(!Tower.isBossFloor(f), `floor ${f} grew a boss`);
  assert(Tower.bossIndex(10, 5) === 0, 'the first boss floor is not the first boss');
  assert(Tower.bossIndex(60, 5) === 0, 'the boss list does not cycle');
  assert(Tower.bossIndex(30, 5) === 2, 'boss cadence drifted');
});

test('tower: a floor pays exactly the strain it charges', () => {
  // Rewards were linear in the floor while difficulty compounded, so a
  // floor 26x harder than the old curve still paid the old curve's
  // price. Both sides read the same function now; this is what stops
  // them drifting apart a second time.
  for (const f of [150, 222, 400, 900]) {
    assert(Tower.reward(f) === Tower.correction(f),
      `floor ${f} pays x${Tower.reward(f)} for x${Tower.correction(f)} of strain`);
  }
  assert(Math.abs(Tower.payout(1000, 400) - 1000 * Tower.correction(400)) <= 1,
    'payout does not apply the strain');
});

test('tower: a payout never shrinks, and never rounds an item away', () => {
  // Rounding must only ever round up: a deeper floor paying less than a
  // shallower one is a bug a player would feel immediately, and a lone
  // scroll rounding to zero is a reward that silently vanishes.
  for (const f of [1, 50, 100, 101, 150, 300]) {
    assert(Tower.payout(1, f) >= 1, `floor ${f} rounded a single scroll away`);
    assert(Tower.payout(437, f) >= 437, `floor ${f} paid less than base`);
  }
  let prev = 0;
  for (let f = 1; f <= 800; f += 3) {
    const p = Tower.payout(100, f);
    assert(p >= prev, `floor ${f} pays ${p}, below floor ${f - 3}'s ${prev}`);
    prev = p;
  }
});

test('tower: floors up to the anchor pay exactly what they always did', () => {
  for (const f of [1, 10, 50, 99, Tower.ANCHOR]) {
    assert(Tower.payout(1234, f) === 1234, `floor ${f} pays ${Tower.payout(1234, f)}`);
    assert(Tower.payout(1, f) === 1, `floor ${f} scroll count moved`);
  }
});

test('summon banners: every standing sect has a week on the wheel', () => {
  // The gap this closes twice over. Two bird sects shipped unbannered
  // and were noticed; the Razorwings, Sunbrood and Hollowbone then did
  // the same thing behind them -- twenty-seven finished heroes with no
  // way to go looking for them. Derived from RACES.SECTS rather than
  // from a list, so the next order to be finished cannot be forgotten
  // in turn: writing a sect into the roster and not onto a wheel fails
  // here.
  const E = g.Events;
  const scheduled = new Map();
  for (const [scroll, cycle] of Object.entries(E.BANNER_CYCLES)) {
    for (const entry of cycle) {
      assert(!scheduled.has(entry.sect),
        `${entry.sect} rides two wheels at once`);
      scheduled.set(entry.sect, scroll);
    }
  }
  for (const sect of Object.values(RACES.SECTS)) {
    // A closed order advertises a rate-up on nobody, and one still
    // being founded has nobody to advertise yet.
    if (sect.defunct || sect.founding) {
      assert(!scheduled.has(sect.id), `${sect.id} is not standing but holds a week`);
      continue;
    }
    assert(scheduled.has(sect.id),
      `${sect.name} is finished and standing but has no banner week`);
    // And on the wheel its element allows: the Temporal scroll draws
    // Dark and Light, everything else comes off the Rare.
    const members = sect.members.map((id) => HEROES[id]).filter(Boolean);
    const temporal = members.every((h) => g.Elements.TEMPORAL.includes(h.element));
    assert(scheduled.get(sect.id) === (temporal ? 'temporal' : 'rare'),
      `${sect.name} rides the ${scheduled.get(sect.id)} wheel, which cannot draw it`);
  }
});

test('banner countdown: h:mm:ss, with days only while there are days', () => {
  const E = g.Events;
  assert(E.countdown(0) === '00:00:00', `zero reads ${E.countdown(0)}`);
  assert(E.countdown(-5000) === '00:00:00', 'a finished banner counted backwards');
  assert(E.countdown(59 * 1000) === '00:00:59', E.countdown(59 * 1000));
  assert(E.countdown(3661 * 1000) === '01:01:01', E.countdown(3661 * 1000));
  // Every field stays two digits wide, which is the whole reason the
  // days are split out rather than rolled into the hours: a week is 167
  // hours and "167:59:59" is not a glanceable clock.
  assert(E.countdown((23 * 3600 + 59 * 60 + 59) * 1000) === '23:59:59',
    'the last hour before a day boundary is wrong');
  assert(E.countdown(86400 * 1000) === '1d 00:00:00', E.countdown(86400 * 1000));
  assert(E.countdown((6 * 86400 + 23 * 3600 + 59 * 60 + 59) * 1000) === '6d 23:59:59',
    'a fresh week does not read as one');
  // It counts down against the banner's own close, second by second.
  const mid = new Date(2026, 7, 26, 12, 0, 0);
  const b = E.bannerFor('rare', mid);
  const left = E.bannerTimeLeft(b, mid);
  assert(left === b.until - mid, 'the clock is not measured to the window close');
  assert(E.countdown(left) === '4d 12:00:00', E.countdown(left));
  const oneSecondLater = new Date(+mid + 1000);
  assert(E.countdown(E.bannerTimeLeft(b, oneSecondLater)) === '4d 11:59:59',
    'a second passing did not move the clock');
  // Past the close it sits at zero rather than going negative.
  assert(E.bannerTimeLeft(b, new Date(+b.until + 60000)) === 0,
    'a closed banner reported time left');
});

test('a boss stands on every hex, for damage and for bonuses alike', () => {
  // The rule: a boss is one body across the whole formation, not a unit
  // standing on one hex of it. So every hex sweep catches it, and every
  // bonus keyed to a hex row is live against it.
  //
  // It used to be half-true. The TARGET SCOPES had it, written as an
  // inline `u.isBoss ||` at each scope that happened to think of one --
  // and the hex-keyed EFFECTS did not, because they read
  // `target.slot.position` directly. A boss was on every hex for the
  // purpose of being hit and on none of them for the purpose of a
  // front-row damage bonus. Unit.onHex is the single predicate now.
  //
  // The boss is placed on EACH position in turn, and ordinary foes are
  // put on the other two rows every time. Both halves of that matter,
  // and the first draft of this test had neither: with the boss alone
  // on a centre hex, `front-enemies` caught it through its empty-row
  // fallback ("if nobody holds the front, take one at random") rather
  // than through the rule, and deleting the rule outright still passed.
  const POSITIONS = [POSITION.FRONT, POSITION.CENTER, POSITION.BACK];
  const bossDef = Object.values(BOSSES)[0];

  for (const bossAt of POSITIONS) {
    const battle = makeBattle();
    const prev = Battle.active;
    Battle.active = battle;
    try {
      const boss = new Unit(bossDef, TEAM.ENEMY, { level: 40, stars: 5 });
      battle.placeUnit(boss,
        battle.enemySlots.findIndex((s) => s.position === bossAt));
      // A live body on each of the OTHER rows, so no sweep is ever
      // rescued by its own "nobody is standing there" fallback.
      const others = [];
      for (const p of POSITIONS.filter((p) => p !== bossAt)) {
        others.push(place(battle, DUMMIES.rat_brawler, TEAM.ENEMY,
          battle.enemySlots.findIndex((s) => s.position === p)));
      }
      const hero = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 0);

      // The predicate itself: every hex, including the two it is not
      // physically standing on.
      for (const p of POSITIONS) {
        assert(boss.onHex(p), `a boss on ${bossAt} does not hold the ${p} hex`);
      }
      // ...and an ordinary unit still holds exactly one.
      const held = POSITIONS.filter((p) => others[0].onHex(p));
      assert(held.length === 1, `an ordinary foe holds ${held.length} hexes`);

      // Every hex-scoped sweep finds it, whichever row it names.
      for (const targeting of ['front-enemies', 'front-and-center-enemies',
        'flank-enemies', 'back-enemies']) {
        const caught = Abilities.resolveTargets({ targeting }, hero, null, battle);
        assert(caught.includes(boss),
          `${targeting} missed a boss standing on ${bossAt}`);
      }

      // The y-banded row sweep too, anchored on a foe the boss does NOT
      // share a pixel row with -- anchoring on the boss itself, or on a
      // body beside it, would prove nothing.
      const offRow = others.find((u) => Math.abs(u.slot.y - boss.slot.y) >= 2);
      assert(offRow, `no foe stands off the boss's row with it on ${bossAt}`);
      const row = Abilities.resolveTargets(
        { targeting: 'enemy-row' }, hero, offRow, battle);
      assert(row.includes(boss),
        `the row sweep anchored off-row missed a boss on ${bossAt}`);
      assert(boss.sharesRowWith(offRow) && offRow.sharesRowWith(boss),
        'a boss does not share a row with a unit on another row');
      // The control: two ordinary units on different rows do not.
      const pair = others.filter((u) => Math.abs(u.slot.y - offRow.slot.y) >= 2);
      if (pair.length) {
        assert(!pair[0].sharesRowWith(offRow),
          'two ordinary units on different rows shared one');
      }
    } finally { Battle.active = prev; }
  }
});

test('a hex-keyed BONUS is live against a boss, not just a hex sweep', () => {
  // The half of the rule that was missing. These read the target's slot
  // directly, so the one enemy on the field was the one enemy they
  // never fired on.
  const battle = makeBattle();
  const prev = Battle.active;
  Battle.active = battle;
  try {
    const bossDef = Object.values(BOSSES)[0];
    const boss = new Unit(bossDef, TEAM.ENEMY, { level: 40, stars: 5 });
    battle.placeUnit(boss, 0);
    const backSlot = battle.enemySlots.findIndex((s) => s.position === POSITION.BACK);
    const backFoe = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, backSlot);
    const caster = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 0);
    // No crits: every number below is a comparison between two hits, and
    // a 15% chance of one of them landing 1.5x turns an exact assertion
    // into a coin flip that passes most of the time.
    caster.baseCritChance = 0;

    // `bonusPosition`: a damage rider that only fires on a named hex.
    // Measured off HP, which is the only honest reading -- the rider is
    // applied inside the damage formula, not reported beside it.
    const hit = (victim, position) => {
      const def = { name: 'probe', targeting: 'enemy', effects: [
        { type: 'damage', mult: 1, ...(position ? { bonusPosition: { position, mult: 3 } } : {}) }] };
      victim.hp = victim.maxHp;
      Abilities.execute(def, caster, victim, battle);
      return victim.maxHp - victim.hp;
    };
    // The control first: a back-hex foe earns the rider on BACK and on
    // nothing else. Without this, a rider that fired unconditionally
    // would satisfy every boss assertion below.
    const plainFoe = hit(backFoe, null);
    assert(plainFoe > 0, 'the probe did no damage at all');
    assert(hit(backFoe, POSITION.BACK) > plainFoe * 2,
      'the control did not earn the rider on the hex it holds');
    assert(Math.abs(hit(backFoe, POSITION.FRONT) - plainFoe) < 2,
      'the control earned a rider for a hex it does not hold');

    // And the boss earns it on every hex there is.
    const plainBoss = hit(boss, null);
    assert(plainBoss > 0, 'the probe did no damage to the boss');
    for (const position of [POSITION.FRONT, POSITION.CENTER, POSITION.BACK]) {
      assert(hit(boss, position) > plainBoss * 2,
        `the ${position} rider did not fire against a boss`);
    }
  } finally { Battle.active = prev; }
});

report();
