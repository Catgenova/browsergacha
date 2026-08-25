// Rules tests: the roster has to survive contact with the engine.
// Every ability is executed and every hook is fired for all 385 heroes,
// then the systems that are easy to break silently (gear scoring, AI
// profiles, the damage meter, mirrors) get targeted checks.

const { loadGame, test, assert, report } = require('./harness');
const g = loadGame();
const { HEROES, BOSSES, Abilities, Unit, Gear, AI, Meter, POSITION, TEAM, Hex, CONFIG,
  Battle, GameState, RACES } = g;

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
  const foeA = place(battle, HEROES.rat_brawler, TEAM.ENEMY, 1);
  const foeB = place(battle, HEROES.rat_archer, TEAM.ENEMY, 4);
  const mate = place(battle, HEROES.rat_knight, TEAM.PLAYER, 4);
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
  const foe = place(battle, HEROES.rat_brawler, TEAM.ENEMY, 1);
  const mate = place(battle, HEROES.rat_archer, TEAM.PLAYER, 4);
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
  const hero = place(battle, HEROES.rat_knight, TEAM.PLAYER, 1);
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
  const prey = [place(battle, HEROES.rat_archer, TEAM.PLAYER, 4),
    place(battle, HEROES.rat_knight, TEAM.PLAYER, 1)];
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
  const hero = place(battle, HEROES.rat_archer, TEAM.PLAYER, 1);
  assert(AI.profileFor(hero).name === 'Your tactics',
    'player hero is not using the player tactics on auto');

  // Every option in every axis has to resolve to something the engine
  // can call, or a saved tactic silently falls back mid-fight.
  const foes = [place(battle, HEROES.rat_brawler, TEAM.ENEMY, 1),
    place(battle, HEROES.rat_knight, TEAM.ENEMY, 4)];
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
  const hero = place(battle, HEROES.rat_brawler, TEAM.PLAYER, 1);
  const support = place(battle, HEROES.rat_archer, TEAM.PLAYER, 4);
  const foe = place(battle, HEROES.rat_knight, TEAM.ENEMY, 1);
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
  const foe = place(battle, HEROES.rat_knight, TEAM.ENEMY, 1);
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
  const hero = place(battle, HEROES.rat_brawler, TEAM.PLAYER, 1);
  const foe = place(battle, HEROES.rat_archer, TEAM.ENEMY, 1);
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
  const hero = place(battle, HEROES.rat_brawler, TEAM.PLAYER, 1);
  const buffer = place(battle, HEROES.rat_archer, TEAM.PLAYER, 4);
  const foe = place(battle, HEROES.rat_knight, TEAM.ENEMY, 1);
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
  const mate = place(battle, HEROES.rat_brawler, TEAM.PLAYER, 1);
  const foeA = place(battle, HEROES.rat_archer, TEAM.ENEMY, 1);
  const foeB = place(battle, HEROES.rat_knight, TEAM.ENEMY, 4);

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
  const runner = place(battle, HEROES.rat_brawler, TEAM.PLAYER, 1);
  const buffer = place(battle, HEROES.rat_archer, TEAM.PLAYER, 4);
  const foe = place(battle, HEROES.rat_knight, TEAM.ENEMY, 1);

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
  const mate = place(battle, HEROES.rat_brawler, TEAM.PLAYER, 1);
  const buffer = place(battle, HEROES.rat_knight, TEAM.PLAYER, 4);
  const foe = place(battle, HEROES.rat_archer, TEAM.ENEMY, 1);
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
  const mate = place(battle, HEROES.rat_brawler, TEAM.PLAYER, 1);
  const buffer = place(battle, HEROES.rat_archer, TEAM.PLAYER, 5);
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
  // A protector whose kit reduces an ally's damageTaken.
  const wardDef = Object.values(HEROES).find((h) => h.abilities.some((a) =>
    (a.effects || []).some((e) => e.type === 'buff' && e.stat === 'damageTaken')));
  assert(wardDef, 'no damageTaken ward anywhere in the roster');
  const ward = place(battle, wardDef, TEAM.PLAYER, 4);
  const mate = place(battle, HEROES.rat_brawler, TEAM.PLAYER, 1);
  const foe = place(battle, HEROES.rat_archer, TEAM.ENEMY, 1);
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
  const mate = place(battle, HEROES.rat_brawler, TEAM.PLAYER, 1);
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
  const foe = place(battle, HEROES.rat_brawler, TEAM.ENEMY, 1);
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

    const caster = place(battle, HEROES.rat_brawler, TEAM.PLAYER, 1);
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
    const mate = place(battle, HEROES.rat_archer, TEAM.PLAYER, 4);
    const foes = [1, 2, 4].map((i) => place(battle, HEROES.rat_brawler, TEAM.ENEMY, i));
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
  const wallHero = Object.values(HEROES).find((h) => h.positional.id === 'shield_wall');
  const u = place(battle, wallHero, TEAM.PLAYER, 1);
  const byPosition = {};
  for (const s of battle.playerSlots) byPosition[s.position] = s;
  u.slot = byPosition[POSITION.FRONT];
  u.hp = u.maxHp;
  const inPlace = u.damageTakenMult();
  u.slot = { position: 'nowhere', x: 0, y: 0 };
  const outOfPlace = u.damageTakenMult();
  assert(inPlace < 1, `shield wall did nothing in position: ${inPlace}`);
  assert(outOfPlace === 1, `shield wall still applied out of position: ${outOfPlace}`);
});



// ---- Threat, telegraphs, elements ---------------------------------------

test('the front line draws attacks away from the back', () => {
  const battle = makeBattle();
  const byPos = {};
  for (const s of battle.playerSlots) byPos[s.position] = s;
  const wall = place(battle, HEROES.rat_knight, TEAM.PLAYER, 1);
  const squishy = place(battle, HEROES.rat_archer, TEAM.PLAYER, 4);
  wall.slot = byPos[POSITION.FRONT];
  squishy.slot = byPos[POSITION.BACK];
  // The back-liner is far softer, so the old AI always picked it.
  squishy.hp = Math.round(squishy.maxHp * 0.2);
  const attacker = place(battle, HEROES.rat_brawler, TEAM.ENEMY, 1);
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
  const bait = place(battle, HEROES.rat_knight, TEAM.PLAYER, 1);
  const squishy = place(battle, HEROES.rat_archer, TEAM.PLAYER, 4);
  bait.slot = byPos[POSITION.BACK];       // not even in front
  squishy.slot = byPos[POSITION.FRONT];
  bait.addStatusEffect({ kind: 'buff', stat: 'taunt', turns: 2 });
  const attacker = place(battle, HEROES.rat_brawler, TEAM.ENEMY, 1);
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
  const ids = ['rat_knight', 'rat_archer', 'rat_cook']
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
  const pinned = GameState.addHero('rat_cook').uid;
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
  const sameChar = [GameState.addHero(hero.id).uid, GameState.addHero(hero.id).uid];
  const strangers = [];
  for (const other of Object.values(HEROES)) {
    if (strangers.length >= need) break;
    if (other.id === hero.id) continue;
    if ((other.rarity || 1) !== stars) continue;
    strangers.push(GameState.addHero(other.id).uid);
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
    assert(GameState.addHero('rat_archer'), 'addHero refused below the cap');
  }
  assert(GameState.rosterCount() === max, `roster holds ${GameState.rosterCount()}`);
  assert(GameState.addHero('rat_archer') === null, 'a hero was added past the cap');

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
  assert(Campaign.gearFor(boss1, 'hard', HEROES.rat_brawler).length === 0 &&
    Campaign.gearFor(boss1, 'expert', HEROES.rat_brawler).length === 0,
    'the holder came armed');
  assert(Campaign.gearFor(entry, 'hard', HEROES.rat_brawler).length > 0,
    'the rank and file lost their tier gear');
  assert(Campaign.gearFor(entry, 'normal', HEROES.rat_brawler).length === 0,
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
  const foe = new Unit(HEROES.rat_brawler, TEAM.ENEMY, { level: 30, stars: 1 });
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
  const cheap = Object.values(w.HEROES).find((h) => (h.rarity || 1) === 1);
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

test('auto star up forges the 1-2 star shelf into 3-star heroes', () => {
  const w = loadGame();
  const G = w.GameState;
  const ones = Object.values(w.HEROES).filter((h) => (h.rarity || 1) === 1);
  assert(ones.length >= 2, 'need two 1-star characters for this test');
  // Six 1-star bodies: pairs make three 2-stars, which make one 3-star.
  const uids = [];
  for (let i = 0; i < 6; i++) uids.push(G.addHero(ones[i % 2].id).uid);
  // The keeper: favourited and levelled, so it must be the survivor.
  const keeper = uids[0];
  G.toggleFavorite(keeper);
  const r = G.autoStarUp();
  assert(r.starUps === 4, `expected 4 star ups (3x 1->2, 1x 2->3), got ${r.starUps}`);
  assert(r.spent === 5, `expected 5 heroes spent, got ${r.spent}`);
  assert(G.progressOf(keeper) && G.progressOf(keeper).stars === 3,
    'the favourite should survive and stand at 3 stars');
  const left = uids.filter((u) => G.progressOf(u));
  assert(left.length === 1, `expected one survivor, found ${left.length}`);
  // Idempotent: a second press finds nothing to do.
  assert(G.planAutoStarUp().length === 0, 'a second pass should plan nothing');
});

test('element resonance tiers land on the numbers on the tin', () => {
  const w = loadGame();
  const R = w.RACES;
  // Additive channels step 15% -> 20% exactly.
  const totals = {};
  for (const [el, tiers] of Object.entries(R.ELEMENT_BONUSES)) {
    totals[el] = tiers;
    assert(tiers.length === 3, `${el}: expected 3 tiers`);
    assert(tiers.map((t) => t.count).join() === '3,5,7', `${el}: tier counts`);
  }
  const sum = (el, key) => R.ELEMENT_BONUSES[el]
    .reduce((n, t) => n + (t.mods[key] || 0), 0);
  assert(Math.abs(sum('fire', 'critChance') - 0.20) < 1e-9, 'fire crit total');
  assert(Math.abs(sum('dark', 'accuracy') - 0.20) < 1e-9, 'dark accuracy total');
  assert(Math.abs(sum('light', 'healBoost') - 0.20) < 1e-9, 'light healing total');
  assert(Math.abs(R.ELEMENT_BONUSES.fire[2].mods.critDamage - 0.80) < 1e-9, 'fire crit damage');
  assert(Math.abs(R.ELEMENT_BONUSES.water[2].mods.reflect - 0.15) < 1e-9, 'water reflect');
  // Multiplicative channels: the product of the two steps is ~1.20.
  for (const [el, key] of [['wind', 'spdPct'], ['water', 'defPct']]) {
    const [t3, t5] = R.ELEMENT_BONUSES[el];
    const product = (1 + t3.mods[key]) * (1 + t5.mods[key]);
    assert(Math.abs(product - 1.20) < 0.005, `${el} ${key} total ${product}`);
  }
  assert(R.ELEMENT_BONUSES.light[2].mods.takenMult === 0.85, 'light 7pc damage cut');
});

test('wind resonance feeds AP only off enemy turns', () => {
  const battle = makeBattle();
  const hero = place(battle, HEROES.florence, TEAM.PLAYER, 0);
  const foe = place(battle, HEROES.rat_brawler, TEAM.ENEMY, 0);
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
  const foe = place(battle, HEROES.rat_brawler, TEAM.ENEMY, 0);
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

test('race packs pay the gear set to the whole party and stack with gear', () => {
  const battle = makeBattle();
  const rats = ['rat_warrior', 'rat_brawler', 'rat_duelist']
    .map((id, i) => place(battle, HEROES[id], TEAM.PLAYER, i));
  const human = place(battle, HEROES.florence, TEAM.PLAYER, 3);
  // One rat already wears dodge from actual gear; the pack adds on top.
  rats[0].gearDodge = 0.10;
  const twoPc = Gear.SETS.rat.bonuses[0]; // the 2pc bonus = the 3-hero tier
  assert(twoPc.stat === 'dodge', 'rat set 2pc is expected to be dodge');
  const active = RACES.applyParty(battle.units.filter((u) => u.team === TEAM.PLAYER));
  const pack = active.find((a) => a.title === 'Rat pack');
  assert(pack && pack.count === 3, 'three rats should light the pack');
  assert(Math.abs(human.gearDodge - twoPc.add) < 1e-9,
    `the non-rat should get the party-wide dodge, got ${human.gearDodge}`);
  assert(Math.abs(rats[0].gearDodge - (0.10 + twoPc.add)) < 1e-9,
    `worn gear and the pack should stack, got ${rats[0].gearDodge}`);
});

test('hero storage: gear comes off on deposit, play resumes on withdraw', () => {
  const w = loadGame();
  const G = w.GameState;
  const cheap = Object.values(w.HEROES).find((h) => (h.rarity || 1) === 1);
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
  const centerFoe = place(battle, HEROES.rat_brawler, TEAM.ENEMY, 0);
  const frontFoe = place(battle, HEROES.rat_brawler, TEAM.ENEMY, 1);
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
  const foeA = place(battle, HEROES.rat_brawler, TEAM.ENEMY, 1);
  const foeB = place(battle, HEROES.rat_brawler, TEAM.ENEMY, 2);
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
    Abilities.execute(HEROES.rat_brawler.abilities[0], foeB, pol, battle);
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
  const foe = place(battle, HEROES.rat_brawler, TEAM.ENEMY, 1);
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
  const foeA = place(battle, HEROES.rat_brawler, TEAM.ENEMY, 1);
  const foeB = place(battle, HEROES.rat_brawler, TEAM.ENEMY, 2);
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
  const foe = place(battle, HEROES.rat_knight, TEAM.ENEMY, 1);
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
  const mateA = place(battle, HEROES.rat_brawler, TEAM.PLAYER, 1);
  const mateB = place(battle, HEROES.rat_knight, TEAM.PLAYER, 2);
  const foeHigh = place(battle, HEROES.rat_knight, TEAM.ENEMY, 1);
  const foeLow = place(battle, HEROES.rat_brawler, TEAM.ENEMY, 2);
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
  const foeFront = place(battle, HEROES.rat_knight, TEAM.ENEMY, 1);
  const foeCenter = place(battle, HEROES.rat_knight, TEAM.ENEMY, 0);
  const foeBack = place(battle, HEROES.rat_knight, TEAM.ENEMY, 4);
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
  const mate = place(battle, HEROES.rat_brawler, TEAM.PLAYER, 1);
  const slow = place(battle, HEROES.rat_knight, TEAM.PLAYER, 2);
  const foe = place(battle, HEROES.rat_mauler, TEAM.ENEMY, 1);
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
  Abilities.execute(HEROES.rat_mauler.abilities[0], foe, mate, battle);
  assert(mate.hp === mate.maxHp, 'the bubble let the hit through');
  assert(!mate.statusEffects.some((fx) => fx.kind === 'bubble'), 'the bubble survived the pop');
  Abilities.execute(HEROES.rat_mauler.abilities[0], foe, mate, battle);
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

test('summon banners: Cryst rides the Rare scroll open-ended, Reverence the Temporal through Aug 29', () => {
  const E = g.Events;
  const during = new Date(2026, 7, 25, 12); // Aug 25 — both banners run
  const after = new Date(2026, 7, 30, 0, 1); // Aug 30 — Reverence has ended
  const farOut = new Date(2027, 3, 1);       // until further notice means it

  // One banner per scroll kind, running concurrently.
  assert(E.activeBanners(during).length === 2,
    `Aug 25 runs ${E.activeBanners(during).length} banners`);
  assert(E.currentBanner(during, 'rare').id === 'cryst_rateup',
    'the Rare banner is not Cryst');
  assert(E.currentBanner(during, 'temporal').id === 'reverence_rateup',
    'the Temporal banner is not Reverence');
  assert(E.currentBanner(new Date(2026, 7, 29, 23, 59), 'temporal').id === 'reverence_rateup',
    'Reverence bowed out early');
  assert(E.currentBanner(after, 'temporal') === null,
    'the Temporal banner outlived Aug 29');
  assert(E.currentBanner(after, 'rare').id === 'cryst_rateup' &&
    E.currentBanner(farOut, 'rare').id === 'cryst_rateup',
    'Cryst on the Rare scroll is until further notice');
  // Cryst never rides the Temporal banner: its all-water roster cannot
  // drop from the light/dark-only Temporal pool.
  assert(E.SUMMON_BANNERS.every((b) => b.sect !== 'cryst' || b.scroll !== 'temporal'),
    'Cryst scheduled on the Temporal scroll');

  // Weights come off the banner for the scroll being pulled.
  assert(E.bannerWeight(HEROES.toll, during, 'temporal') === 2, 'Toll unweighted on his banner');
  assert(E.bannerWeight(HEROES.polarus, during, 'rare') === 2, 'the King unweighted on his');
  assert(E.bannerWeight(HEROES.polarus, during, 'temporal') === 1, 'the King crashed the Temporal');
  assert(E.bannerWeight(HEROES.toll, during, 'rare') === 1, 'Toll crashed the Rare');
  assert(E.bannerWeight(HEROES.toll, after, 'temporal') === 1, 'Toll overstayed');
  assert(E.bannerWeight(HEROES.rat_brawler, during, 'rare') === 1, 'a rat on the banner');

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
  assert(seen > expectedFlat * 1.4 && seen < expectedTilted * 1.25,
    `banner share ${seen.toFixed(3)} vs flat ${expectedFlat.toFixed(3)} / tilted ${expectedTilted.toFixed(3)}`);

  // Rare-scroll elective pulls tilt toward Cryst the same way — and
  // keep doing it long after August (until further notice).
  const poolR = Object.values(HEROES).filter((h) => h.rarity === 3);
  const cryCount = poolR.filter((h) =>
    RACES.sectOf(h) && RACES.sectOf(h).id === 'cryst').length;
  assert(cryCount > 0, 'no 3-star Cryst heroes in the rare pool');
  let cryHits = 0;
  for (let i = 0; i < draws; i++) {
    const def = g.Gacha.pickHero(3, null, 'rare', farOut);
    const sect = RACES.sectOf(def);
    if (sect && sect.id === 'cryst') cryHits++;
  }
  const cryFlat = cryCount / poolR.length;
  const cryTilted = (cryCount * 2) / (poolR.length + cryCount);
  const crySeen = cryHits / draws;
  assert(crySeen > cryFlat * 1.4 && crySeen < cryTilted * 1.25,
    `cryst share ${crySeen.toFixed(3)} vs flat ${cryFlat.toFixed(3)} / tilted ${cryTilted.toFixed(3)}`);

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
  const one = Object.values(w.HEROES).find((h) => h.rarity === 1);
  for (let i = 0; i < 24; i++) G.addHero(one.id);

  // Plans are monotonic in the target: aiming at 4★ includes every
  // step the 3★ plan takes plus the ranks above it.
  const p3 = G.planAutoStarUp(3).length;
  const p4 = G.planAutoStarUp(4).length;
  assert(p3 > 0, 'a shelf of 24 spares planned nothing');
  assert(p4 > p3, `target 4 planned ${p4} steps vs target 3's ${p3}`);

  // Executing the 4★ plan performs exactly what it promised, and a new
  // 4★ hero exists that did not before.
  const fours = () => G.ownedHeroIds()
    .filter((uid) => G.progressOf(uid).stars >= 4).length;
  const before = fours();
  const r = G.autoStarUp(4);
  assert(r.starUps === p4, `planned ${p4} star ups, performed ${r.starUps}`);
  assert(fours() > before, 'no new 4-star hero was forged');
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
  const bl = G.addHero(pick((h) => h.rarity === 1).id);
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
  // Sectless picks, so the running Cryst banner can't muddy the
  // banners-unaffected check below.
  const picks = pool3.filter((h) => !w.RACES.sectOf(h)).slice(0, 4);

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
  const ones = Object.values(w.HEROES).filter((h) => (h.rarity || 1) === 1);
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
  const foe = new U(H.rat_knight, T.ENEMY, { level: 30, stars: 3 });
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
  const foeA = place(battle, HEROES.rat_brawler, TEAM.ENEMY, 1);
  const foeB = place(battle, HEROES.rat_knight, TEAM.ENEMY, 2);
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

test('prismatic accord and motley company pay the party', () => {
  const battle = makeBattle();
  // One hero of every element, each from a different race/sect group.
  const picks = [];
  const used = new Set();
  for (const el of Object.keys(RACES.ELEMENT_NAMES)) {
    const def = Object.values(HEROES).find((h) => h.element === el &&
      RACES.groupOf(h) && !used.has(RACES.groupOf(h)));
    assert(def, `no hero found for element ${el}`);
    used.add(RACES.groupOf(def));
    picks.push(def);
  }
  const units = picks.map((d, i) => place(battle, d, TEAM.PLAYER, i));
  const before = units.map((u) => ({ crit: u.baseCritChance, dodge: u.gearDodge,
    spd: u.speed, acc: u.gearAccuracy, res: u.gearResistance, taken: u.synergyTakenMult }));
  const titles = RACES.applyParty(units).map((s) => s.title);
  assert(titles.includes('Prismatic accord'), 'the rainbow did not light');
  assert(titles.includes('Motley company'), 'the motley bonus did not fire');
  units.forEach((u, i) => {
    assert(Math.abs(u.baseCritChance - before[i].crit - 0.15) < 1e-9, 'crit not paid');
    assert(Math.abs(u.gearDodge - before[i].dodge - 0.10) < 1e-9, 'dodge not paid');
    assert(u.speed === Math.round(before[i].spd * 1.15), 'speed not paid');
    assert(Math.abs(u.gearAccuracy - before[i].acc - 0.30) < 1e-9, 'accuracy not paid');
    assert(Math.abs(u.gearResistance - before[i].res - 0.40) < 1e-9, 'resistance not paid');
    assert(u.synergyTakenMult === before[i].taken,
      'five groups must not grant the seven-group tier');
  });
  // Sect grouping: two Reverence members are ONE motley group; a
  // Reverence hero beside a Hedge hero are two.
  assert(RACES.diversityCount([HEROES.catherine, HEROES.toll]) === 1, 'sect-mates split');
  assert(RACES.diversityCount([HEROES.catherine, HEROES.vex]) === 2, 'sects merged');
  // A party missing an element lights no rainbow.
  assert(!RACES.prismActive([HEROES.catherine, HEROES.toll]), 'rainbow from one color');
});

test('blessed and godtouched: the summon lottery, stat lifts, packs and resurrection', () => {
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

  // Packs pay everyone fielded, against a like-for-like control team.
  const party = (blessings) => blessings.map((kind) => mk(kind));
  const run = (team) => { RACES.applyParty(team); return team; };
  const ctrl3 = run(party([null, null, null, null]));
  const ble3 = run(party(['blessed', 'blessed', 'blessed', null]));
  ble3.forEach((u, i) => {
    assert(Math.abs(u.baseCritDamage - ctrl3[i].baseCritDamage - 0.25) < 1e-9,
      '3 blessed must pay +25% crit damage to everyone');
    assert(u.resurrectChance === 0, '3 blessed paid the 5-pack tier');
  });
  const ctrl5 = run(party([null, null, null, null, null]));
  const ble5 = run(party(['blessed', 'blessed', 'blessed', 'blessed', 'blessed']));
  ble5.forEach((u, i) => {
    assert(Math.abs(u.resurrectChance - 0.15) < 1e-9, '5 blessed must pay 15% resurrect');
    // Only the copies' own +20% base lift — no 7-pack HP at five.
    assert(u.maxHp === Math.round(ctrl5[i].maxHp * 1.2), '5 blessed paid the 7-pack HP');
  });
  const ctrl7 = run(party(Array(7).fill(null)));
  const god7 = run(party(Array(7).fill('godtouched')));
  god7.forEach((u, i) => {
    assert(Math.abs(u.baseCritDamage - ctrl7[i].baseCritDamage - 0.50) < 1e-9,
      '7 godtouched must pay +50% crit damage');
    assert(Math.abs(u.resurrectChance - 0.30) < 1e-9, '7 godtouched must pay 30% resurrect');
    // The copies' own +40% base lift, then the 7-pack's +40% on top.
    assert(u.maxHp === Math.round(Math.round(ctrl7[i].maxHp * 1.4) * 1.4),
      '7 godtouched must pay +40% HP on top of the base lift');
  });
  // Strict counts: godtouched copies do not feed the Blessed pack.
  const titles = RACES.applyParty(party(['godtouched', 'godtouched', 'godtouched']))
    .filter((s) => s.title.endsWith('company')).map((s) => s.title);
  assert(titles.includes('Godtouched company') && !titles.includes('Blessed company'),
    `3 godtouched lit: ${titles.join(', ')}`);

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

test('the Reverence sect set: a DEF floor, an opening shield, shields off every blow', () => {
  const tiers = RACES.SECT_BONUSES.reverence;
  assert(tiers.length === 3 && tiers[0].mods.defPct === 0.10 &&
    tiers[1].mods.startShield === 0.15 && tiers[2].mods.shieldOnDeal === 0.10,
    'the Reverence table drifted');

  const battle = makeBattle();
  const members = ['catherine', 'toll', 'javarious', 'leonardo', 'oak', 'silas', 'eli'];
  const units = members.map((id, i) => place(battle, HEROES[id], TEAM.PLAYER, i));
  const before = units.map((u) => ({ def: u.baseDef }));
  const active = RACES.applyParty(units);
  const entry = active.find((s) => s.title === 'Reverence sect');
  assert(entry && entry.count === 7 && entry.labels.length === 3,
    `sect pack read ${JSON.stringify(entry)}`);
  units.forEach((u, i) => {
    assert(u.baseDef === Math.round(before[i].def * 1.10), 'the DEF floor was not paid');
    assert(u.shieldTotal() === Math.round(u.maxHp * 0.15),
      `opening shield reads ${u.shieldTotal()} of ${u.maxHp}`);
    assert(Math.abs(u.synergyShieldOnDeal - 0.10) < 1e-9, 'no shield off blows');
  });
  // The 7pc in motion: landing a 500 blow banks 50 shield on the dealer.
  const foe = place(battle, HEROES.rat_brawler, TEAM.ENEMY, 1);
  const dealer = units[0];
  dealer.hookSources = () => []; // isolate the synergy from kit hooks
  const held = dealer.shieldTotal();
  dealer.dealt(500, foe);
  assert(dealer.shieldTotal() === held + 50,
    `a 500 blow banked ${dealer.shieldTotal() - held} shield`);

  // Three fielded: the DEF tier alone — no shields yet.
  const b2 = makeBattle();
  const trio = ['catherine', 'toll', 'oak'].map((id, i) => place(b2, HEROES[id], TEAM.PLAYER, i));
  const defs = trio.map((u) => u.baseDef);
  const e2 = RACES.applyParty(trio).find((s) => s.title === 'Reverence sect');
  assert(e2 && e2.labels.length === 1, 'three members should pay one tier');
  trio.forEach((u, i) => {
    assert(u.baseDef === Math.round(defs[i] * 1.10), 'trio DEF off');
    assert(u.shieldTotal() === 0 && u.synergyShieldOnDeal === 0,
      'higher tiers paid early');
  });
});

test('the Cryst sect set: an ATK floor, an opening freeze, colder freeze rolls', () => {
  const tiers = RACES.SECT_BONUSES.cryst;
  assert(tiers.length === 3 && tiers[0].mods.atkPct === 0.10 &&
    tiers[1].mods.openingFreeze === 1 && tiers[2].mods.freezeChance === 0.15,
    'the Cryst table drifted');

  const battle = makeBattle();
  const members = ['polarus', 'echo', 'florence', 'andrew', 'ari', 'cain', 'bit'];
  const units = members.map((id, i) => place(battle, HEROES[id], TEAM.PLAYER, i));
  const atkBefore = units.map((u) => u.baseAtk);
  const entry = RACES.applyParty(units).find((s) => s.title === 'Cryst sect');
  assert(entry && entry.count === 7 && entry.labels.length === 3,
    `sect pack read ${JSON.stringify(entry)}`);
  units.forEach((u, i) => {
    assert(u.baseAtk === Math.round(atkBefore[i] * 1.10), 'the ATK floor was not paid');
    assert(u.synergyOpeningFreeze === 1, 'no opening freeze armed');
    assert(Math.abs(u.synergyFreezeChance - 0.15) < 1e-9, 'freeze rolls no colder');
  });

  // The 7pc bonus makes an 85% freeze roll a certainty (0.85 + 0.15):
  // a hundred casts must all pass the chance gate (frozen or resisted,
  // never a silent miss).
  const foe = place(battle, HEROES.rat_brawler, TEAM.ENEMY, 1);
  const caster = units[4]; // Ari
  for (let i = 0; i < 100; i++) {
    foe.statusEffects = [];
    const r = Abilities.applyEffect(
      { type: 'freeze', chance: 0.85, turns: 2 }, caster, foe);
    assert(r !== null, `cast ${i + 1} missed a guaranteed freeze roll`);
  }

  // Three fielded: the ATK tier alone.
  const b2 = makeBattle();
  const trio = ['florence', 'ari', 'cain'].map((id, i) => place(b2, HEROES[id], TEAM.PLAYER, i));
  const atks = trio.map((u) => u.baseAtk);
  const e2 = RACES.applyParty(trio).find((s) => s.title === 'Cryst sect');
  assert(e2 && e2.labels.length === 1, 'three members should pay one tier');
  trio.forEach((u, i) => {
    assert(u.baseAtk === Math.round(atks[i] * 1.10), 'trio ATK off');
    assert(u.synergyOpeningFreeze === 0 && u.synergyFreezeChance === 0,
      'higher tiers paid early');
  });
});

test('the Firetroupe sect set: accuracy tiers and the Oilslick mark', () => {
  const tiers = RACES.SECT_BONUSES.firetroupe;
  assert(tiers.length === 3 && tiers[0].mods.accuracy === 0.15 &&
    tiers[1].mods.accuracy === 0.05 && tiers[2].mods.oilOnHit === 0.10,
    'the Firetroupe table drifted');

  // Two members fielded is below every tier: no pack fires.
  const b0 = makeBattle();
  const duo = ['lucian', 'franz'].map((id, i) => place(b0, HEROES[id], TEAM.PLAYER, i));
  assert(!RACES.applyParty(duo).some((s) => s.title === 'Firetroupe sect'),
    'two performers lit the whole pack');

  // The 7pc channel: a landed hit slicks the victim for 2 turns.
  const w = loadGame();
  const { HEROES: H, Abilities: A, Unit: U, TEAM: T, Elements: E } = w;
  const franz = new U(H.franz, T.PLAYER, { level: 30, stars: 4 });
  const vex = new U(H.vex, T.PLAYER, { level: 30, stars: 3 });
  const foe = new U(H.rat_knight, T.ENEMY, { level: 30, stars: 3 });
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
  const mate = new U(H.rat_knight, T.PLAYER, { level: 30, stars: 3 });
  const foeA = new U(H.rat_brawler, T.ENEMY, { level: 30, stars: 3 });
  const foeB = new U(H.rat_archer, T.ENEMY, { level: 30, stars: 3 });
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

  const foeFront = new U(H.rat_knight, T.ENEMY, { level: 30, stars: 3 });
  const foeBack = new U(H.rat_archer, T.ENEMY, { level: 30, stars: 3 });
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
  const foe = new U(H.rat_knight, T.ENEMY, { level: 30, stars: 3 });
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
  const foeB = new U(H.rat_archer, T.ENEMY, { level: 30, stars: 3 });
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
  const foeA = new U(H.rat_knight, T.ENEMY, { level: 30, stars: 3 });
  const foeB = new U(H.rat_archer, T.ENEMY, { level: 30, stars: 3 });
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
  const foe = new U(H.rat_knight, T.ENEMY, { level: 30, stars: 3 });
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
  const foeFront = new U(H.rat_knight, T.ENEMY, { level: 30, stars: 3 });
  const foeBack = new U(H.rat_archer, T.ENEMY, { level: 30, stars: 3 });
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
  const foeFront = new U(H.rat_knight, T.ENEMY, { level: 30, stars: 3 });
  const foeCenter = new U(H.rat_brawler, T.ENEMY, { level: 30, stars: 3 });
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
  const mate = new U(H.rat_knight, T.PLAYER, { level: 30, stars: 3 });
  const backMate = new U(H.rat_archer, T.PLAYER, { level: 30, stars: 3 });
  const foeFront = new U(H.rat_brawler, T.ENEMY, { level: 30, stars: 3 });
  const foeBack = new U(H.rat_archer, T.ENEMY, { level: 30, stars: 3 });
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
  const mate = new U(H.rat_knight, T.PLAYER, { level: 30, stars: 3 });
  const backMate = new U(H.rat_archer, T.PLAYER, { level: 30, stars: 3 });
  const foe = new U(H.rat_brawler, T.ENEMY, { level: 30, stars: 3 });
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
  const hurt = new U(H.rat_knight, T.PLAYER, { level: 30, stars: 3 });
  const hurtier = new U(H.rat_warrior, T.PLAYER, { level: 30, stars: 3 });
  const foeA = new U(H.rat_brawler, T.ENEMY, { level: 30, stars: 3 });
  const foeB = new U(H.rat_archer, T.ENEMY, { level: 30, stars: 3 });
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
  const mate = new U(H.rat_knight, T.PLAYER, { level: 30, stars: 3 });
  const foe = new U(H.rat_brawler, T.ENEMY, { level: 30, stars: 3 });
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

report();
