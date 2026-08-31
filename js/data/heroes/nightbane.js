// The Nightbane cats. Sect No. 17, dark, and the pride that HAUNTS:
// the fifth verb of the cat meter, where Stillwater takes, Emberpride
// charges, Zephyrclaw gives and Sunpulse endures.
//
// The pack was written before the roster (js/races.js):
//
//   2pc First Curse    laying a debuff on an unafflicted enemy pays the
//                      caster 10% action bar
//   3pc Coven Rhythm   laying any debuff pays the caster 5% action bar
//   4pc Witching Hour  while 3+ afflictions hold on the enemy side,
//                      allies gain 4% action bar at the start of their turns
//
// Every kit below is written INTO that frame, and three consequences of
// it shape all nine:
//
// EVERY SWING CARRIES A CURSE. The landing tiers pay per affliction
// landed, so almost every damage line here rides a 50% hex -- an ATK
// cut, a break, a slow, a stun -- bought to certainty up the ladder
// like every gate in the game. A sweep that hexes a row is a row of
// paydays, which is why the wide curses live on the cooldowns.
//
// STUNS ARE DEBUFFS, WITH EVERYTHING THAT IMPLIES. Dusk is the jailor
// the sect was named for, and wiring the first laddered stuns exposed
// two engine gaps at once: the stun gate never read debuffChance rungs
// (only bosses threw stuns, ladderless), and a stun status carried no
// source -- so it could never reach the certainty its card promised
// and would never have paid the pack. Both fixed in Abilities.
//
// AND THE HOUR IS HELD OPEN TOGETHER. Witching Hour wants three
// curses live, and Lingering (dark resonance) plus Vex's Vile
// Persistence stretch every one of them -- the sect's element and its
// defector agreeing on the same job.
//
// Vex leads the roster: the Doll Witch left the Nightflowers, and her
// entire kit crossed unchanged -- Creeping Malaise alone is fourteen
// landing rolls -- with only the body and the banner new. The nine
// hold the DARK shape, 4/3/2 from three stars up (the Temporal scroll
// never rolls below three). Statlines are RATIOS (js/data/balance.js);
// speed is identity. Sheets are wired ahead of the upload on the Franz
// precedent: frames measured off the art when it lands, placeholders
// standing in until then.

const NIGHTBANE = {
  // ---- The defector (4-star) ---------------------------------------
  vex: {
    id: 'vex',
    element: 'dark',
    name: 'Vex',
    title: 'Doll Witch',
    rarity: 4,
    stats: { hp: 1250, atk: 200, def: 105, speed: 115 },
    tint: { body: '#5a3a7a', helm: '#7a4a9a', weapon: '#c8a86a', shield: '#3a2a4a' },
    sprite: {
      displayH: 66, // 25% smaller than standard — the old art is a crouched pose
      // STILL THE OLD BODY, on purpose. The new Nightbane appearance is
      // named ("vexidle(1)") but not yet uploaded, and the suite --
      // rightly -- refuses a strip that points at nothing. The retired
      // human strips stay wired so she keeps fighting; swap this block
      // for the nightbane sheet the day it lands.
      strips: {
        idle:   { src: 'assets/heroes/vex/vexidle.png',  frames: 9,  fps: 4, loop: true },
        idle2:  { src: 'assets/heroes/vex/vexidle1.png', frames: 9,  fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        idle3:  { src: 'assets/heroes/vex/vexidle2.png', frames: 9,  fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        idle4:  { src: 'assets/heroes/vex/vexidle3.png', frames: 16, fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        ready:  { src: 'assets/heroes/vex/vexready.png', frames: 9, fps: 6, loop: true },
        attack: { src: 'assets/heroes/vex/vexskill1.png', frames: 9, fps: 10, loop: false,
                  hitFrame: 6 },
        cast:   { src: 'assets/heroes/vex/vexskill2.png', frames: 9, fps: 10, loop: false,
                  hitFrame: 6 },
        attack3: { src: 'assets/heroes/vex/vexskill3.png', frames: 9, fps: 10, loop: false,
                   hitFrame: 8 },
        death:  { src: 'assets/heroes/vex/vexdeath.png', frames: 8, fps: 6, loop: false,
                  freeze: true },
      },
    },
    abilities: [
      {
        id: 'pinprick', name: 'Pinprick',
        icon: 'assets/icons/fc89.png',
        description: 'One enemy: 90% ATK damage; 50% chance: -15% ATK for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'strike_purple',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'debuff', chance: 0.5, stat: 'atk', mult: 0.85, turns: 2 },
        ],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { debuffChance: 0.2 },
          { debuffChance: 0.2 },
          { debuffChance: 0.1 },
        ],
      },
      {
        id: 'creeping_malaise', name: 'Creeping Malaise',
        icon: 'assets/icons/fc1117.png',
        description: 'All enemies: 50% chance: -25% DEF for 2 turns; 50% chance: -15% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'cast', impact: 'strike_purple',
        effects: [
          { type: 'debuff', chance: 0.5, stat: 'def', mult: 0.75, turns: 2 },
          { type: 'debuff', chance: 0.5, stat: 'speed', mult: 0.85, turns: 2 },
        ],
        levelUps: [
          { debuffChance: 0.2 },
          { debuffChance: 0.2 },
          { debuffChance: 0.1 },
          { debuffPower: 0.05 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'doom_mark', name: 'Doom Mark',
        icon: 'assets/icons/fc1050.png',
        description: 'One enemy: 50% chance: +40% damage taken for 3 turns; 50% chance: -30% ATK for 3 turns.',
        cooldown: 8, targeting: 'enemy', animation: 'attack3', impact: 'strike_purple',
        effects: [
          { type: 'debuff', chance: 0.5, stat: 'damageTaken', mult: 1.4, turns: 3 },
          { type: 'debuff', chance: 0.5, stat: 'atk', mult: 0.7, turns: 3 },
        ],
        levelUps: [
          { debuffChance: 0.2 },
          { debuffChance: 0.2 },
          { debuffChance: 0.1 },
          { debuffPower: 0.05 },
          { debuffPower: 0.05 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Vile Persistence',
      icon: 'assets/icons/fc1053.png',
      description: 'Debuffs this hero applies last 1 turn longer.',
      hooks: {
        debuffExtraTurns: 1,
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  // ---- 3-star ------------------------------------------------------
  // The jailor. Dusk is the sect's named theme in person: the front
  // door of a prison, and the first hero in the game whose stuns ladder
  // to certainty like any other gate.
  dusk: {
    id: 'dusk',
    element: 'dark',
    name: 'Dusk',
    title: 'The Cell Fills at Sundown',
    rarity: 3,
    stats: { hp: 1600, atk: 90, def: 130, speed: 104 },
    tint: { body: '#3a3444', helm: '#6a5a8a', weapon: '#8a7aa8', shield: '#241c30' },
    // No sprite block yet: the sheet ('duskidle.png') has not
    // been uploaded, so the procedural placeholder stands in
    // (Noctelle precedent). Wire the strip when the art lands.
    abilities: [
      {
        id: 'dusk_book_them', name: 'Book Them',
        icon: 'assets/icons/fc1200.png',
        description: 'One enemy: 75% DEF damage.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'punch',
        effects: [{ type: 'damageDef', mult: 0.75 }],
        levelUps: [
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
        ],
      },
      {
        id: 'dusk_iron_door', name: 'Iron Door',
        icon: 'assets/icons/fc1201.png',
        description: 'One enemy: 90% DEF damage; 50% chance: stunned for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'idle', impact: 'slash_slam',
        effects: [
          { type: 'damageDef', mult: 0.90 },
          { type: 'stun', chance: 0.50, turns: 1 },
        ],
        levelUps: [
          { debuffChance: 0.2 },
          { cooldown: -1 },
          { debuffChance: 0.2 },
          { mult: 0.10 },
          { cooldown: -1 },
          { debuffChance: 0.1 },
        ],
      },
      {
        id: 'dusk_lights_out', name: 'Lights Out',
        icon: 'assets/icons/fc1202.png',
        description: 'Enemy front row: 70% DEF damage; 50% chance: stunned for 1 turn.',
        cooldown: 6, targeting: 'front-enemies', animation: 'idle', impact: 'slash_slam',
        effects: [
          { type: 'damageDef', mult: 0.70 },
          { type: 'stun', chance: 0.50, turns: 1 },
        ],
        levelUps: [
          { debuffChance: 0.2 },
          { cooldown: -1 },
          { debuffChance: 0.2 },
          { mult: 0.08 },
          { cooldown: -1 },
          { debuffChance: 0.1 },
          { mult: 0.08 },
        ],
      },
    ],
    passive: {
      name: 'Head Jailor',
      icon: 'assets/icons/fc1203.png',
      description: '+20% damage to stunned enemies.',
      hooks: {
        damageDealtMult: (u, t) =>
          (t && t.statusEffects &&
            t.statusEffects.some((fx) => fx.stat === 'stun') ? 1.20 : 1),
      },
    },
    positional: POSITIONALS.den_door,
  },

  // The knife. Zeth is the cheapest First Curse engine the sect owns:
  // a cooldown-0 jab that hexes half the time on day one and every
  // time once laddered.
  zeth: {
    id: 'zeth',
    element: 'dark',
    name: 'Zeth',
    title: 'A Thin Blade in the Dark',
    rarity: 3,
    stats: { hp: 1180, atk: 168, def: 76, speed: 118 },
    tint: { body: '#44384a', helm: '#7a4a9a', weapon: '#c8a8e8', shield: '#241c30' },
    // No sprite block yet: the sheet ('zethidle.png') has not
    // been uploaded, so the procedural placeholder stands in
    // (Noctelle precedent). Wire the strip when the art lands.
    abilities: [
      {
        id: 'zeth_quick_cut', name: 'Quick Cut',
        icon: 'assets/icons/fc1204.png',
        description: 'One enemy: 105% ATK damage; 50% chance: -10% ATK for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike_purple',
        effects: [
          { type: 'damage', mult: 1.05 },
          { type: 'debuff', chance: 0.5, stat: 'atk', mult: 0.90, turns: 2 },
        ],
        levelUps: [
          { mult: 0.10 },
          { debuffChance: 0.2 },
          { debuffChance: 0.2 },
          { mult: 0.10 },
          { debuffChance: 0.1 },
        ],
      },
      {
        id: 'zeth_open_vein', name: 'Open Vein',
        icon: 'assets/icons/fc1205.png',
        description: 'One enemy: 150% ATK damage; 50% chance: +15% damage taken for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'idle', impact: 'strike_purple',
        effects: [
          { type: 'damage', mult: 1.50 },
          { type: 'debuff', chance: 0.5, stat: 'damageTaken', mult: 1.15, turns: 2 },
        ],
        levelUps: [
          { mult: 0.15 },
          { debuffChance: 0.2 },
          { cooldown: -1 },
          { debuffChance: 0.2 },
          { cooldown: -1 },
          { debuffChance: 0.1 },
        ],
      },
      {
        id: 'zeth_nightfall_edge', name: 'Nightfall Edge',
        icon: 'assets/icons/fc1206.png',
        description: 'One enemy: 195% ATK damage (ignores 20% DEF).',
        cooldown: 5, targeting: 'enemy', animation: 'idle', impact: 'horizonal_slash',
        effects: [{ type: 'damage', mult: 1.95, ignoreDef: 0.20 }],
        levelUps: [
          { mult: 0.15 },
          { cooldown: -1 },
          { mult: 0.15 },
          { mult: 0.15 },
          { cooldown: -1 },
          { mult: 0.15 },
          { mult: 0.15 },
        ],
      },
    ],
    passive: {
      name: 'Sees the Wound',
      icon: 'assets/icons/fc1207.png',
      description: '+15% damage to afflicted enemies.',
      hooks: {
        damageDealtMult: (u, t) => (t && Unit.isDebuffed(t) ? 1.15 : 1),
      },
    },
    positional: POSITIONALS.first_lunge,
  },

  // The weaver of small hours. Nyx blesses her own and pins the other
  // side, and her passive chips at whoever carries the most curses --
  // pressure aimed by the whole sect's work.
  nyx: {
    id: 'nyx',
    element: 'dark',
    name: 'Nyx',
    title: 'Needle of the Small Hours',
    rarity: 3,
    stats: { hp: 1250, atk: 120, def: 95, speed: 114 },
    tint: { body: '#2e2838', helm: '#6a5a8a', weapon: '#c8a8e8', shield: '#241c30' },
    // No sprite block yet: the sheet ('nyxidle.png') has not
    // been uploaded, so the procedural placeholder stands in
    // (Noctelle precedent). Wire the strip when the art lands.
    abilities: [
      {
        id: 'nyx_shadow_pin', name: 'Shadow Pin',
        icon: 'assets/icons/fc1208.png',
        description: 'One enemy: 65% ATK damage; 50% chance: -10% DEF for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike_purple',
        effects: [
          { type: 'damage', mult: 0.65 },
          { type: 'debuff', chance: 0.5, stat: 'def', mult: 0.90, turns: 2 },
        ],
        levelUps: [
          { mult: 0.08 },
          { debuffChance: 0.2 },
          { debuffChance: 0.2 },
          { debuffChance: 0.1 },
          { mult: 0.08 },
        ],
      },
      {
        id: 'nyx_veilwork', name: 'Veilwork',
        icon: 'assets/icons/fc1209.png',
        description: 'All allies: +15% ATK for 2 turns.',
        cooldown: 4, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'buff', stat: 'atk', mult: 1.15, turns: 2 }],
        levelUps: [
          { buffPower: 0.05 },
          { cooldown: -1 },
          { duration: 1 },
          { buffPower: 0.05 },
          { cooldown: -1 },
          { buffPower: 0.05 },
        ],
      },
      {
        id: 'nyx_deep_night', name: 'Deep Night',
        icon: 'assets/icons/fc1210.png',
        description: 'All enemies: 50% chance: -10% SPD for 2 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'idle', impact: 'strike_purple',
        effects: [{ type: 'debuff', chance: 0.5, stat: 'speed', mult: 0.90, turns: 2 }],
        levelUps: [
          { debuffChance: 0.2 },
          { cooldown: -1 },
          { debuffChance: 0.2 },
          { debuffPower: 0.05 },
          { cooldown: -1 },
          { debuffChance: 0.1 },
          { debuffPower: 0.05 },
        ],
      },
    ],
    passive: {
      name: 'Small Hours',
      icon: 'assets/icons/fc1211.png',
      // Aimed by the whole sect: whoever carries the most curses takes
      // the needle. Through Abilities.strike, so the chip is mitigated
      // like any blow, and it stays home when nobody is cursed.
      description: 'Start of each turn: the most-afflicted enemy takes 40% ATK damage.',
      hooks: {
        onTurnStart(unit, battle) {
          if (!battle) return null;
          const cursed = battle.livingUnits()
            .filter((u) => u.team !== unit.team && Unit.debuffsOn(u) > 0)
            .sort((a, b) => Unit.debuffsOn(b) - Unit.debuffsOn(a))[0];
          if (!cursed) return null;
          const r = Abilities.strike(unit, cursed, unit.effectiveStat('atk') * 0.40,
            { crit: false });
          if (!r || !(r.amount > 0)) return null;
          return { label: 'Small Hours',
            message: `${unit.name}'s needle finds ${cursed.name}.`,
            floats: [{ target: cursed, text: `-${r.amount}`, color: '#c8a0e8' }] };
        },
      },
    },
    positional: POSITIONALS.thermal_rise,
  },

  // The bog. Murk slows the other side, mends his own, and drinks the
  // dark whenever it splashes back across the line.
  murk: {
    id: 'murk',
    element: 'dark',
    name: 'Murk',
    title: 'What the Marsh Keeps',
    rarity: 3,
    stats: { hp: 1450, atk: 98, def: 100, speed: 108 },
    tint: { body: '#3a4038', helm: '#5a6a4a', weapon: '#8a9a6a', shield: '#242c20' },
    // No sprite block yet: the sheet ('murkidle.png') has not
    // been uploaded, so the procedural placeholder stands in
    // (Noctelle precedent). Wire the strip when the art lands.
    abilities: [
      {
        id: 'murk_mudball', name: 'Mudball',
        icon: 'assets/icons/fc1212.png',
        description: 'One enemy: 60% ATK damage; 50% chance: -10% SPD for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'water_ball',
        effects: [
          { type: 'damage', mult: 0.60 },
          { type: 'debuff', chance: 0.5, stat: 'speed', mult: 0.90, turns: 2 },
        ],
        levelUps: [
          { mult: 0.08 },
          { debuffChance: 0.2 },
          { debuffChance: 0.2 },
          { debuffChance: 0.1 },
          { mult: 0.08 },
        ],
      },
      {
        id: 'murk_bog_balm', name: 'Bog Balm',
        icon: 'assets/icons/fc1213.png',
        description: 'All allies: heals 55% ATK.',
        cooldown: 4, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'heal', mult: 0.55 }],
        levelUps: [
          { mult: 0.10 },
          { cooldown: -1 },
          { mult: 0.10 },
          { mult: 0.10 },
          { cooldown: -1 },
          { mult: 0.10 },
        ],
      },
      {
        id: 'murk_swallowed_whole', name: 'Swallowed Whole',
        icon: 'assets/icons/fc1214.png',
        description: 'Enemy back row: 85% ATK damage; 50% chance: -15% ATK for 2 turns.',
        cooldown: 5, targeting: 'back-enemies', animation: 'idle', impact: 'strike_purple',
        effects: [
          { type: 'damage', mult: 0.85 },
          { type: 'debuff', chance: 0.5, stat: 'atk', mult: 0.85, turns: 2 },
        ],
        levelUps: [
          { mult: 0.10 },
          { debuffChance: 0.2 },
          { cooldown: -1 },
          { debuffChance: 0.2 },
          { cooldown: -1 },
          { debuffChance: 0.1 },
          { mult: 0.10 },
        ],
      },
    ],
    passive: {
      name: 'Drinks the Dark',
      icon: 'assets/icons/fc1215.png',
      // The mirror-match answer, scaled to one cat: enemy hexers feed
      // his bar. Reads the same ally-side ring Ilyra does, and pays
      // tempo where she pays comfort.
      description: 'When an ally is afflicted: +8% turn meter.',
      hooks: {
        onAllyDebuffed(unit) {
          unit.turnMeter += CONFIG.TURN_METER_MAX * 0.08;
          return null; // quiet: misery is routine here
        },
      },
    },
    positional: POSITIONALS.triage_lantern,
  },

  // ---- 4-star ------------------------------------------------------
  // The butcher. Skar cuts lines, not bodies: his cooldowns curse whole
  // rows, which under the landing tiers is a row of paydays.
  skar: {
    id: 'skar',
    element: 'dark',
    name: 'Skar',
    title: 'Cuts With the Grain',
    rarity: 4,
    stats: { hp: 1350, atk: 165, def: 95, speed: 113 },
    tint: { body: '#4a3a3a', helm: '#7a4a5a', weapon: '#c8a8b8', shield: '#2a1c20' },
    // No sprite block yet: the sheet ('skaridle.png') has not
    // been uploaded, so the procedural placeholder stands in
    // (Noctelle precedent). Wire the strip when the art lands.
    abilities: [
      {
        id: 'skar_rip', name: 'Flense',
        icon: 'assets/icons/fc1216.png',
        description: 'One enemy: 115% ATK damage.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.15 }],
        levelUps: [
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
        ],
      },
      {
        id: 'skar_rend_the_line', name: 'Rend the Line',
        icon: 'assets/icons/fc1217.png',
        description: 'Enemy front row: 75% ATK damage; 50% chance: -10% DEF for 2 turns.',
        cooldown: 4, targeting: 'front-enemies', animation: 'idle', impact: 'slash_effect',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'debuff', chance: 0.5, stat: 'def', mult: 0.90, turns: 2 },
        ],
        levelUps: [
          { debuffChance: 0.2 },
          { cooldown: -1 },
          { mult: 0.08 },
          { debuffChance: 0.2 },
          { cooldown: -1 },
          { debuffChance: 0.1 },
        ],
      },
      {
        id: 'skar_carve_deep', name: 'Carve Deep',
        icon: 'assets/icons/fc1218.png',
        description: 'One enemy: 210% ATK damage; 50% chance: -15% DEF for 3 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'idle', impact: 'horizonal_slash',
        effects: [
          { type: 'damage', mult: 2.10 },
          { type: 'debuff', chance: 0.5, stat: 'def', mult: 0.85, turns: 3 },
        ],
        levelUps: [
          { mult: 0.15 },
          { debuffChance: 0.2 },
          { cooldown: -1 },
          { debuffChance: 0.2 },
          { cooldown: -1 },
          { debuffChance: 0.1 },
          { mult: 0.15 },
        ],
      },
    ],
    passive: {
      name: 'Deeper Wounds',
      icon: 'assets/icons/fc1219.png',
      // Dorian counts his own two locks; Skar counts everything anyone
      // laid. The sect stacks curses, and he is what the stack is for.
      description: '+5% damage per debuff on the target, up to +20%.',
      hooks: {
        damageDealtMult(unit, target) {
          if (!target) return 1;
          return 1 + 0.05 * Math.min(4, Unit.debuffsOn(target));
        },
      },
    },
    positional: POSITIONALS.vanguard_press,
  },

  // The long dark. Nox works the back seats: a slow on the jab, a
  // volley for the rank the healers hide in, and armour-blindness
  // wherever the sect has already been.
  nox: {
    id: 'nox',
    element: 'dark',
    name: 'Nox',
    title: 'The Last Thing the Lamps See',
    rarity: 4,
    stats: { hp: 1200, atk: 180, def: 78, speed: 115 },
    tint: { body: '#2a2a34', helm: '#5a5a7a', weapon: '#a8a8d8', shield: '#1a1a24' },
    // No sprite block yet: the sheet ('noxidle.png') has not
    // been uploaded, so the procedural placeholder stands in
    // (Noctelle precedent). Wire the strip when the art lands.
    abilities: [
      {
        id: 'nox_dusk_bolt', name: 'Dusk Bolt',
        icon: 'assets/icons/fc1220.png',
        description: 'One enemy: 95% ATK damage; 50% chance: -10% SPD for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike_purple',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'debuff', chance: 0.5, stat: 'speed', mult: 0.90, turns: 2 },
        ],
        levelUps: [
          { mult: 0.10 },
          { debuffChance: 0.2 },
          { debuffChance: 0.2 },
          { mult: 0.10 },
          { debuffChance: 0.1 },
        ],
      },
      {
        id: 'nox_twin_shadows', name: 'Twin Shadows',
        icon: 'assets/icons/fc1221.png',
        description: 'Enemy back row: 90% ATK damage.',
        cooldown: 3, targeting: 'back-enemies', animation: 'idle', impact: 'slash_effect',
        effects: [{ type: 'damage', mult: 0.90 }],
        levelUps: [
          { mult: 0.10 },
          { cooldown: -1 },
          { mult: 0.10 },
          { mult: 0.10 },
          { cooldown: -1 },
          { mult: 0.10 },
        ],
      },
      {
        id: 'nox_total_dark', name: 'Total Dark',
        icon: 'assets/icons/fc1222.png',
        description: 'One enemy: 230% ATK damage (ignores 15% DEF).',
        cooldown: 6, targeting: 'enemy', animation: 'idle', impact: 'horizonal_slash',
        effects: [{ type: 'damage', mult: 2.30, ignoreDef: 0.15 }],
        levelUps: [
          { mult: 0.20 },
          { cooldown: -1 },
          { mult: 0.20 },
          { mult: 0.20 },
          { cooldown: -1 },
          { mult: 0.20 },
          { mult: 0.20 },
        ],
      },
    ],
    passive: {
      name: 'Night Eye',
      icon: 'assets/icons/fc1223.png',
      // High Noon's opposite number, and the same function shape:
      // Sunpulse pierces from health, Nightbane pierces through
      // sickness.
      description: 'Attacks ignore 15% of DEF against afflicted enemies.',
      hooks: {
        defIgnoreAdd: (u, t) => (t && Unit.isDebuffed(t) ? 0.15 : 0),
      },
    },
    positional: POSITIONALS.downwind_shot,
  },

  // ---- 5-star ------------------------------------------------------
  // The bell of the night office. Vesper is the giving half of the
  // haunt: her curses are wide, and every one she lands rings an ally
  // forward.
  vesper: {
    id: 'vesper',
    element: 'dark',
    name: 'Vesper',
    title: 'The Night Office',
    rarity: 5,
    stats: { hp: 1500, atk: 120, def: 105, speed: 112 },
    tint: { body: '#38304a', helm: '#7a4a9a', weapon: '#c8a8e8', shield: '#241c30' },
    // No sprite block yet: the sheet ('vesperidle.png') has not
    // been uploaded, so the procedural placeholder stands in
    // (Noctelle precedent). Wire the strip when the art lands.
    abilities: [
      {
        id: 'vesper_toll_the_hour', name: 'Toll the Hour',
        icon: 'assets/icons/fc1224.png',
        description: 'One enemy: 70% ATK damage; 50% chance: -10% ATK for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike_purple',
        effects: [
          { type: 'damage', mult: 0.70 },
          { type: 'debuff', chance: 0.5, stat: 'atk', mult: 0.90, turns: 2 },
        ],
        levelUps: [
          { mult: 0.08 },
          { debuffChance: 0.2 },
          { debuffChance: 0.2 },
          { debuffChance: 0.1 },
          { mult: 0.08 },
        ],
      },
      {
        id: 'vesper_curfew', name: 'Curfew',
        icon: 'assets/icons/fc1225.png',
        // Seven landing rolls in one cast: the sect's widest single
        // payday, and the skill that opens the Witching Hour by itself.
        description: 'All enemies: 50% chance: -10% ATK for 2 turns.',
        cooldown: 4, targeting: 'all-enemies', animation: 'idle', impact: 'strike_purple',
        effects: [{ type: 'debuff', chance: 0.5, stat: 'atk', mult: 0.90, turns: 2 }],
        levelUps: [
          { debuffChance: 0.2 },
          { cooldown: -1 },
          { debuffChance: 0.2 },
          { debuffPower: 0.05 },
          { cooldown: -1 },
          { debuffChance: 0.1 },
        ],
      },
      {
        id: 'vesper_midnight_office', name: 'Midnight Office',
        icon: 'assets/icons/fc1226.png',
        description: 'All allies: +12% turn meter; removes 1 debuff.',
        cooldown: 5, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [
          { type: 'turnMeter', amount: 0.12 },
          { type: 'cleanse', count: 1 },
        ],
        levelUps: [
          { meter: 0.03 },
          { cleanseCount: 1 },
          { cooldown: -1 },
          { meter: 0.03 },
          { cooldown: -1 },
          { meter: 0.03 },
          { cleanseCount: 1 },
        ],
      },
    ],
    passive: {
      name: 'Evensong',
      icon: 'assets/icons/fc1227.png',
      // The sect's landing hook, spent outward: the pack pays HER for
      // every curse, and Evensong passes a slice to whoever is closest
      // to acting. Booked as a real gift, so the bought turn credits
      // back.
      description: 'When Vesper lands a debuff: the readiest other ally gains 5% turn meter.',
      hooks: {
        onDebuffLanded(unit, { battle } = {}) {
          const b = battle || (typeof Battle !== 'undefined' ? Battle.active : null);
          if (!b) return null;
          const mates = b.livingUnits(unit.team).filter((u) => u !== unit);
          if (!mates.length) return null;
          const next = mates.reduce((a, x) => (x.turnMeter > a.turnMeter ? x : a));
          const gained = CONFIG.TURN_METER_MAX * 0.05;
          next.turnMeter += gained;
          next.meterGifts.push({ source: unit, amount: gained });
          next.bookAp(unit, gained);
          return { floats: [{ target: next, text: '▲', color: '#c8a0e8' }] };
        },
      },
    },
    positional: POSITIONALS.order_of_march,
  },

  // The gate nobody passes twice. Drazan is the wall that curses back:
  // his sweep hexes the room, and striking him is itself a mistake.
  drazan: {
    id: 'drazan',
    element: 'dark',
    name: 'Drazan',
    title: 'Warden of the Last Gate',
    rarity: 5,
    stats: { hp: 1950, atk: 100, def: 150, speed: 102 },
    tint: { body: '#302838', helm: '#6a5a8a', weapon: '#8a7aa8', shield: '#1c1424' },
    // No sprite block yet: the sheet ('drazanidle.png') has not
    // been uploaded, so the procedural placeholder stands in
    // (Noctelle precedent). Wire the strip when the art lands.
    abilities: [
      {
        id: 'drazan_wardens_fist', name: "Warden's Fist",
        icon: 'assets/icons/fc1228.png',
        description: 'One enemy: 115% DEF damage.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'punch',
        effects: [{ type: 'damageDef', mult: 1.15 }],
        levelUps: [
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
        ],
      },
      {
        id: 'drazan_doomgate', name: 'Doomgate',
        icon: 'assets/icons/fc1229.png',
        description: 'Self: shield worth 135% DEF for 3 turns; draws enemy attacks for 2 turns.',
        cooldown: 4, targeting: 'self', animation: 'idle', impact: 'shield_bubble',
        effects: [
          { type: 'shield', defMult: 1.35, turns: 3 },
          { type: 'taunt', turns: 2 },
        ],
        levelUps: [
          { mult: 0.15 },
          { duration: 1 },
          { cooldown: -1 },
          { mult: 0.15 },
          { cooldown: -1 },
          { mult: 0.15 },
        ],
      },
      {
        id: 'drazan_the_long_night', name: 'The Long Night Falls',
        icon: 'assets/icons/fc1230.png',
        description: 'All enemies: 60% DEF damage; 50% chance: -10% ATK for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'idle', impact: 'slash_slam',
        effects: [
          { type: 'damageDef', mult: 0.60 },
          { type: 'debuff', chance: 0.5, stat: 'atk', mult: 0.90, turns: 2 },
        ],
        levelUps: [
          { debuffChance: 0.2 },
          { cooldown: -1 },
          { mult: 0.08 },
          { debuffChance: 0.2 },
          { cooldown: -1 },
          { debuffChance: 0.1 },
          { mult: 0.08 },
        ],
      },
    ],
    passive: {
      name: 'Grim Welcome',
      icon: 'assets/icons/fc1231.png',
      // A retaliatory curse rather than a retaliatory blow: sourced to
      // Drazan, so it feeds the landing tiers and the Witching Hour
      // like anything the sect lays on purpose.
      description: 'When struck: 30% chance the attacker suffers -15% ATK for 2 turns.',
      hooks: {
        onStruck(unit, attacker) {
          if (!attacker || !attacker.alive || attacker.team === unit.team) return null;
          if (Math.random() >= 0.30) return null;
          attacker.addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.85,
            turns: 2, source: unit });
          return { label: 'Grim Welcome',
            floats: [{ target: attacker, text: 'ATK ▼', color: '#c8a0e8' }] };
        },
      },
    },
    positional: POSITIONALS.strongman,
  },
};

Object.assign(HEROES, NIGHTBANE);

if (typeof module !== 'undefined' && module.exports) module.exports = { NIGHTBANE };
