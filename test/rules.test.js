// Rules tests: the roster has to survive contact with the engine.
// Every ability is executed and every hook is fired for every hero,
// then the systems that are easy to break silently (gear scoring, AI
// profiles, the damage meter, mirrors) get targeted checks.

const { loadGame, test, assert, report } = require('./harness');
const g = loadGame();
const { HEROES, BOSSES, Abilities, Unit, Gear, AI, Meter, POSITION, TEAM, Hex, CONFIG,
  Battle, GameState, RACES, DUMMIES, Progression } = g;

// The bottom of the roster. It used to be 1-star -- the generated
// cohorts filled that shelf -- and is 3-star now that only authored
// heroes remain, so the tests that want "the cheapest body available"
// ask rather than assume.
function lowestRarity(world = g) {
  return Math.min(...Object.values(world.HEROES).map((h) => h.rarity || 1));
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
    addFloatingText() {}, log() {},
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
function place(battle, def, team, slotIdx) {
  const u = new Unit(def, team, { level: 30, stars: def.rarity || 3 });
  u.slot = (team === TEAM.PLAYER ? battle.playerSlots : battle.enemySlots)[slotIdx];
  battle.units.push(u);
  return u;
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

test('an attack buff credits the buffer with the damage it bought', () => {
  const battle = makeBattle();
  const hero = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
  const buffer = place(battle, DUMMIES.rat_archer, TEAM.PLAYER, 4);
  const foe = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
  // No dodging, no crits: the split has to be readable, not lucky.
  foe.dodgeChance = () => 0;
  const hit = () => {
    Meter.resetSession();
    foe.hp = foe.maxHp;
    Abilities.strike(hero, foe, 1000, { dodge: false, reflect: false });
    const rows = Meter.rows('damage', 'battle');
    const by = (u) => (rows.list.find((r) => r.id === u.def.id) || { value: 0 }).value;
    return { total: rows.total, hero: by(hero), buffer: by(buffer) };
  };

  const plain = hit();
  assert(plain.buffer === 0, 'an unbuffed swing credited someone who did nothing');

  hero.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.5, turns: 5, source: buffer });
  const buffed = hit();
  assert(buffed.buffer > 0, 'the buffer got no credit for a +50% ATK buff');
  // The split comes OUT of the attacker's share, so the ledger still adds
  // up to the damage that actually landed.
  assert(Math.abs(buffed.hero + buffed.buffer - buffed.total) <= 1,
    `split does not reconstruct the hit: ${JSON.stringify(buffed)}`);
  // A x1.5 buff bought a third of the hit (1 - 1/1.5).
  const share = buffed.buffer / buffed.total;
  assert(Math.abs(share - 1 / 3) < 0.02,
    `expected a third of the hit, got ${share.toFixed(3)}`);

  // Self-buffs are the hero's own business.
  hero.statusEffects = [];
  hero.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.5, turns: 5, source: hero });
  assert(hit().buffer === 0, 'a self-buff was credited to somebody else');

  // An armour break on the target is the same kind of assist.
  hero.statusEffects = [];
  foe.addStatusEffect({ kind: 'debuff', stat: 'def', mult: 0.5, turns: 5, source: buffer });
  const broken = hit();
  assert(broken.buffer > 0, 'the armour break earned its caster nothing');
  assert(Math.abs(broken.hero + broken.buffer - broken.total) <= 1,
    'armour-break split does not reconstruct the hit');

  // ...but never across the line: an enemy's debuff is not our assist.
  foe.statusEffects = [];
  foe.addStatusEffect({ kind: 'debuff', stat: 'def', mult: 0.5, turns: 5, source: foe });
  assert(hit().buffer === 0, 'credit leaked to a unit on the other team');
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
  const rows = Meter.rows('damage', 'battle');
  const by = (u) => (rows.list.find((r) => r.id === u.def.id) || { value: 0 }).value;
  assert(by(buffer) > 0, 'an amplify mark earned its caster nothing');
  assert(Math.abs(by(buffer) + by(mate) - rows.total) <= 1,
    'amplify split does not reconstruct the hit');
  // A x1.35 mark owns 1 - 1/1.35 of the hit.
  assert(Math.abs(by(buffer) / rows.total - (1 - 1 / 1.35)) < 0.02,
    `mark share off: ${(by(buffer) / rows.total).toFixed(3)}`);
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
    Abilities.execute(healAb.def, healer, mate, battle);
    const rows = Meter.rows('healing', 'battle');
    const by = (u) => (rows.list.find((r) => r.id === u.def.id) || { value: 0 }).value;
    return { total: rows.total, healer: by(healer), buffer: by(buffer) };
  };

  assert(mend().buffer === 0, 'an unbuffed mend credited someone who did nothing');

  // An ATK buff multiplies an ATK-scaled heal, so its granter owns the
  // slice it added — a third, at x1.5 — and the ledger still adds up.
  healer.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.5, turns: 5, source: buffer });
  const buffed = mend();
  assert(buffed.buffer > 0, 'the buffer got no credit for a buffed heal');
  assert(Math.abs(buffed.healer + buffed.buffer - buffed.total) <= 1,
    `split does not reconstruct the heal: ${JSON.stringify(buffed)}`);
  assert(Math.abs(buffed.buffer / buffed.total - 1 / 3) < 0.02,
    `expected a third of the heal, got ${(buffed.buffer / buffed.total).toFixed(3)}`);

  // A turn bought with meter pushes pays its patron the same way:
  // half the meter given means half the turn's mend (capped at 60%).
  healer.statusEffects = [];
  healer.turnGifts = [{ source: buffer, amount: CONFIG.TURN_METER_MAX / 2 }];
  const bought = mend();
  assert(Math.abs(bought.buffer / bought.total - 0.5) < 0.02,
    `a half-bought turn should split the mend evenly, got ${(bought.buffer / bought.total).toFixed(3)}`);
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
  const pinned = GameState.addHero('angelica').uid;
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
  const need = Progression.starUpCost(stars);
  assert(need === stars, `cost should equal the rating, got ${need} for ${stars}`);
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
  for (const other of Object.values(HEROES)) {
    if (strangers.length >= need) break;
    if (other.id === hero.id) continue;
    if ((other.rarity || 1) !== stars) continue;
    strangers.push(fodderHero(other.id));
  }
  assert(strangers.length === need, `could not find ${need} strangers at ${stars} stars`);

  // Only contributors are offered: same character or at-rank fodder.
  // A hero that can do neither is off the list, not greyed out.
  const offered = GameState.sacrificeOptions(target);
  const ids = new Set(offered.map((o) => o.uid));
  assert(!ids.has(target), 'the hero being improved was offered as its own fodder');
  for (const o of offered) {
    assert(o.skill || o.star,
      `${o.heroId} is offered but can neither star up nor skill up`);
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

  // Too few, and nothing is starred -- but a duplicate still pays a skill.
  const before = GameState.progressOf(target);
  const partial = GameState.sacrifice(target, [sameChar[0]]);
  assert(partial.spent === 1, `spent ${partial.spent}`);
  assert(!partial.starred, 'starred up on one sacrifice');
  assert(partial.skills.length === 1, 'a duplicate paid no skill level');
  assert(GameState.progressOf(target).stars === before.stars, 'stars moved anyway');
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
  assert(GameState.rosterCount() === count - need,
    'the roster did not shrink by the heroes spent');
  for (const uid of strangers) {
    assert(!GameState.defOf(uid), 'a spent hero is still in the roster');
  }
});

test('the roster is capped and summoning refuses to overflow it', () => {
  const { GameState, Gacha } = g;
  const max = GameState.MAX_ROSTER;
  assert(max === 100, `expected a 100 base cap, got ${max}`);
  while (!GameState.rosterFull()) {
    assert(GameState.addHero('silas'), 'addHero refused below the cap');
  }
  assert(GameState.rosterCount() === max, `roster holds ${GameState.rosterCount()}`);
  assert(GameState.addHero('silas') === null, 'a hero was added past the cap');

  // A pull that cannot fit is refused whole rather than part-filled: a
  // summon hands over a hero now, and dropping some on the floor is not
  // something to do quietly.
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
  const target = G.addHero(cheap.id).uid;
  const fav = G.addHero(cheap.id).uid;
  const fielded = G.addHero(cheap.id).uid;
  const spare = G.addHero(cheap.id).uid;
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
  const floor = lowestRarity(w);
  const goal = floor + 1;
  const ones = Object.values(w.HEROES).filter((h) => (h.rarity || 1) === floor);
  assert(ones.length >= 2, `need two ${floor}-star characters for this test`);
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
  assert(G.progressOf(uid) === null || G.defOf(uid) === null, 'stored hero still in play');
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
  const centerFoe = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 0);
  const frontFoe = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1);
  for (const f of [centerFoe, frontFoe]) f.dodgeChance = () => 0;
  sawyer.baseCritChance = 0;  // the numbers must be readable, not lucky
  sawyer.gearAccuracy = 10;   // and the hexes must land to be counted

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
});

test('polarus: freeze locks, the crystal counters, shatterfall pays and thaws', () => {
  const battle = makeBattle();
  const pol = place(battle, HEROES.polarus, TEAM.PLAYER, 0); // center hex
  const foeA = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 1);
  const foeB = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 2);
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

  // Skill 1: honest damage plus a flat 15-point AP cut.
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
  const mateA = place(battle, DUMMIES.rat_brawler, TEAM.PLAYER, 1);
  const mateB = place(battle, DUMMIES.rat_knight, TEAM.PLAYER, 2);
  const foeHigh = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
  const foeLow = place(battle, DUMMIES.rat_brawler, TEAM.ENEMY, 2);
  for (const f of [foeHigh, foeLow]) f.dodgeChance = () => 0;
  foeLow.hp = Math.round(foeLow.maxHp * 0.4); // the HEALTHY one must be lashed

  // Tidemend: 30% of Cain's own pool, not the patient's.
  mateA.hp = 1;
  Abilities.execute(HEROES.cain.abilities[0], cain, mateA, battle);
  assert(mateA.hp === Math.min(mateA.maxHp, 1 + Math.round(cain.maxHp * 0.30)),
    `tidemend left ${mateA.hp}/${mateA.maxHp}`);

  // Twin Mercies: exactly the two most-wounded allies, 35% each; a
  // full-health Cain is not among them.
  mateA.hp = 1;
  mateB.hp = Math.round(mateB.maxHp * 0.5);
  cain.hp = cain.maxHp;
  Abilities.execute(HEROES.cain.abilities[1], cain, null, battle);
  assert(mateA.hp === 1 + Math.round(cain.maxHp * 0.35), `mercy A left ${mateA.hp}`);
  assert(mateB.hp === Math.round(mateB.maxHp * 0.5) + Math.round(cain.maxHp * 0.35)
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
  const foeFront = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 1);
  const foeCenter = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 0);
  const foeBack = place(battle, DUMMIES.rat_knight, TEAM.ENEMY, 4);
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

  // The Rare wheel: Cryst, the Firetroupe, the Whisperchime, and round
  // again. The Temporal wheel is two long, so it simply alternates.
  const rare = (y, m, d) => E.currentBanner(new Date(y, m, d, 12), 'rare').id;
  const temporal = (y, m, d) => E.currentBanner(new Date(y, m, d, 12), 'temporal').id;
  const RARE_WHEEL = ['cryst_rateup', 'firetroupe_rateup', 'whisperchime_rateup'];
  const TEMPORAL_WHEEL = ['reverence_rateup', 'nightflower_rateup'];
  assert(rare(2026, 7, 26) === 'cryst_rateup', 'the Rare scroll is not on Cryst today');
  assert(temporal(2026, 7, 26) === 'reverence_rateup', 'the Temporal scroll is not on Reverence today');
  // Twelve consecutive weeks from the epoch Monday, both scrolls.
  for (let w = 0; w < 12; w++) {
    const mon = new Date(2026, 7, 24 + w * 7, 12);
    assert(E.currentBanner(mon, 'rare').id === RARE_WHEEL[w % 3],
      `week ${w} of the Rare wheel is ${E.currentBanner(mon, 'rare').id}`);
    assert(E.currentBanner(mon, 'temporal').id === TEMPORAL_WHEEL[w % 2],
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
  assert(rare(2026, 8, 14) === 'cryst_rateup', 'the Rare wheel did not wrap back to Cryst');
  assert(temporal(2026, 8, 7) === 'reverence_rateup',
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
  assert(E.SUMMON_BANNERS.every((b) =>
    !['cryst', 'firetroupe', 'whisperchime'].includes(b.sect) || b.scroll !== 'temporal'),
    'an elementally-locked sect was scheduled on the Temporal scroll');
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
  let hits = 0;
  for (let i = 0; i < draws; i++) {
    const def = g.Gacha.pickHero(3, ['light', 'dark'], 'temporal', during);
    const sect = RACES.sectOf(def);
    if (sect && sect.id === 'reverence') hits++;
  }
  const expectedFlat = revCount / pool3.length;
  const expectedTilted = (revCount * 2) / (pool3.length + revCount);
  const seen = hits / draws;
  assert(seen > (expectedFlat + expectedTilted) / 2 && seen < expectedTilted * 1.06,
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
    assert(share > (flat + tilted) / 2 && share < tilted * 1.06,
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
  const realRoll = w.Blessing.roll;
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
  const ones = Object.values(w.HEROES).filter((h) => (h.rarity || 1) === lowestRarity(w));
  const [a, b] = ones;

  const first = G.addHero(a.id);
  assert(first.isNew, 'first-ever copy of a character was not NEW!');
  const second = G.addHero(a.id);
  assert(!second.isNew, 'a dupe in hand flagged as NEW!');
  assert(G.everCollected(a.id), 'collection registry missed a summon');

  // Spend every copy of A as star-up fodder for B: gone from the
  // roster, but not from history.
  const target = G.addHero(b.id).uid;
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

  // Sigil Bolt cuts the victim's meter by 20% of max.
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

  // Center Ring: +20% debuff accuracy from the center hex.
  assert(Math.abs(slick.debuffAccuracy() - 0.20) < 1e-9,
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
  assert(Math.abs(slick.debuffAccuracy() - 0.50) < 1e-9,
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

  // Blazing Ball: TWO separate burns on each front-row enemy.
  A.execute(lin.abilities[1].def, lin, null, battle);
  const burns = foeFront.statusEffects.filter(
    (fx) => fx.kind === 'dot' && fx.flavor === 'burn');
  assert(burns.length === 2 &&
    burns.every((fx) => fx.amount === Math.round(foeFront.maxHp * 0.03)),
    `the ball rolled ${burns.length} burns`);
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
  const mate = new U(DUMMIES.rat_knight, T.PLAYER, { level: 30, stars: 3 });
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
  assert(ally.hp - 1 === Math.round(p4.maxHp * 0.25),
    `High Summer healed ${ally.hp - 1}, expected 25% of ${p4.maxHp}`);
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
      assert(m.hp - 1 === Math.round(ilyra.maxHp * 0.15),
        `Changing Weather gave ${m.hp - 1}, expected 15% of ${ilyra.maxHp}`);
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
      assert(tied.atk === Math.round(loose.atk * 1.25),
        `ATK ${loose.atk} -> ${tied.atk}, wanted x1.25`);
      assert(tied.def === Math.round(loose.def * 1.25),
        `DEF ${loose.def} -> ${tied.def}, wanted x1.25`);
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
    const before = mo.effectiveStat('def');
    live(b, () => A.execute(def.abilities[1], mo, null, b));
    for (const f of foes) {
      assert(f.statusEffects.some((fx) => fx.stat === 'taunted' && fx.turns === 1),
        `${f.def.id} on the ${f.slot.position} hex was not taunted`);
    }
    assert(mo.effectiveStat('def') === Math.round(before * 1.50),
      `DEF ${before} -> ${mo.effectiveStat('def')}, wanted x1.5`);
    assert(def.abilities[1].cooldown === 5, 'Wisteria drifted off a 5-turn cooldown');
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
  assert(def.abilities[1].cooldown === 4 && def.abilities[2].cooldown === 7,
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
    for (const f of foes) delete f.debuffResistance;   // read the real figure
    const before = foes.map((f) => f.debuffResistance());
    live(b, () => A.execute(def.abilities[1], va, null, b));
    foes.forEach((f, i) => {
      assert(Math.abs(f.debuffResistance() - (before[i] - 0.30)) < 1e-9,
        `${f.def.id} resistance ${before[i]} -> ${f.debuffResistance()}`);
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
    // ...and the rider lands regardless, so it is never a dead turn.
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
      live(a.b, () => A.execute(def.abilities[0], a.va, a.foes[0], a.b));
      return a.foes[0].statusEffects.find((fx) => fx.stat === 'atk').turns;
    };
    assert(turnsOf(on) === turnsOf(off) + 1,
      `back hex ${turnsOf(on)} turns vs ${turnsOf(off)} off it`);
  }
});

test("Lenore's kit: the bell is priced off her own pool, and a death rings it sooner", () => {
  const A = Abilities, H = HEROES;
  const def = H.lenore;
  assert(def && def.element === 'dark' && def.rarity === 3, 'Lenore drifted');
  assert(RACES.sectOf(def).id === 'nightflower', 'Lenore left the Nightflowers');
  assert(def.role === 'support', 'Lenore is not binned as a support');
  assert(def.abilities[1].cooldown === 5 && def.abilities[2].cooldown === 6,
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
    const mend = Math.round(le.maxHp * 0.20), wall = Math.round(le.maxHp * 0.10);
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

test('unswept heroes keep the old blanket skill scaling', () => {
  const H = HEROES, P = Progression;
  // The roster is swept hero by hero, so most abilities have no ladder
  // yet. Those must keep the legacy cap and the legacy multiplier --
  // a half-migrated system that quietly zeroed them would be worse than
  // no migration at all.
  const legacy = Object.values(H)
    .flatMap((h) => (h.abilities || []).map((a, i) => ({ h, a, i })))
    .filter(({ a }) => !a.levelUps);
  assert(legacy.length > 0, 'no unswept abilities left -- retire this test');
  const { h, a, i } = legacy[0];
  assert(P.skillCap(a, i) === P.MAX_SKILL_LEVEL,
    `${h.id} skill ${i + 1} lost the legacy cap`);
  assert(Math.abs(P.skillPower(5) - 1.4) < 1e-9, 'legacy skillPower drifted');
  assert(P.skillBonusText(a, 5) === '+40% power',
    `legacy readout changed: ${P.skillBonusText(a, 5)}`);
  const battle = makeBattle();
  const u = place(battle, h, TEAM.PLAYER, 0);
  const st = u.abilities.find((x) => x.def === a);
  st.level = 5;
  assert(Math.abs(u.skillPowerFor(a) - 1.4) < 1e-9,
    'an unswept ability stopped scaling with skill level');
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

report();
