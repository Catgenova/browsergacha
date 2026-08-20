// Rules tests: the roster has to survive contact with the engine.
// Every ability is executed and every hook is fired for all 385 heroes,
// then the systems that are easy to break silently (gear scoring, AI
// profiles, the damage meter, mirrors) get targeted checks.

const { loadGame, test, assert, report } = require('./harness');
const g = loadGame();
const { HEROES, BOSSES, Abilities, Unit, Gear, AI, Meter, POSITION, TEAM, Hex, CONFIG } = g;

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

test('bosses fight as tyrants and player heroes stay predictable', () => {
  const battle = makeBattle();
  const boss = new Unit(Object.values(BOSSES)[0], TEAM.ENEMY, { level: 50, stars: 5 });
  assert(AI.profileFor(boss).name === 'Tyrant', 'boss is not a tyrant');
  const hero = place(battle, HEROES.rat_archer, TEAM.PLAYER, 1);
  assert(AI.profileFor(hero).name === 'Balanced', 'player hero is not balanced on auto');
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

test('star up all promotes exactly the eligible heroes', () => {
  const { GameState } = g;
  // Ready: at the level cap with spare duplicates.
  const ready = 'rat_archer';
  for (let i = 0; i < 8; i++) GameState.addHero(ready);
  GameState.addXp(ready, 1e9);
  // Not ready: enough copies, but sitting at level 1.
  const lowLevel = 'rat_brawler';
  for (let i = 0; i < 8; i++) GameState.addHero(lowLevel);
  // Not ready: at the cap, but only one copy.
  const noCopies = 'rat_spearman';
  GameState.addHero(noCopies);
  GameState.addXp(noCopies, 1e9);

  const expected = GameState.starUpReadyCount();
  assert(expected >= 1, 'nothing was set up as ready');
  assert(GameState.canStarUp(ready), 'the ready hero is not eligible');
  assert(!GameState.canStarUp(lowLevel), 'a level-1 hero should not be eligible');
  assert(!GameState.canStarUp(noCopies), 'a hero without duplicates should not be eligible');

  const before = GameState.progressOf(ready).stars;
  const done = GameState.starUpAll();
  assert(done.length === expected,
    `starred ${done.length} but ${expected} were ready`);
  assert(GameState.progressOf(ready).stars === before + 1,
    'the ready hero did not gain a star');
  assert(GameState.progressOf(ready).level === 1,
    'a star-up must reset the level');
  assert(GameState.progressOf(lowLevel).stars ===
    HEROES[lowLevel].rarity, 'an ineligible hero was starred up');
  // A second sweep does nothing: a star-up resets to level 1.
  assert(GameState.starUpAll().length === 0, 'a hero starred up twice in a row');
});

report();
