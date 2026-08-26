// Avian heroes. Registered into the shared HEROES table declared in
// js/data/heroes.js.
//
// The Gulldiggers are the first sect that is not human: pirate seabirds
// who fight the way weather does — all at once, and to everybody. Where
// a human sect is nine heroes of whatever rarity they happened to be
// written at, a bird sect is built to a shape: one 1★, two 2★, three
// 3★, two 4★, and a single 5★ at the top of it.
//
// Their shared mechanic is `perTarget` (js/abilities.js): damage priced
// off the SIZE OF THE CROWD a cast catches. It is the reason the sect
// exists — every other AoE dealer on the roster is paid the same for a
// sweep that lands on one bird as for one that lands on seven, and the
// Gulldiggers are not.

Object.assign(HEROES, {

  hallow: {
    id: 'hallow',
    element: 'water',
    name: 'Hallow',
    title: 'Storm Bottler',
    rarity: 5,
    // A backline glass cannon: the highest attack the balance layer will
    // hand a body this soft. He is priced to die to anything that
    // reaches him, which is the cost of a kit that never has to choose a
    // target. (Every stat here is a RATIO — js/data/balance.js scales
    // all three to the shared power budget and leaves speed alone.)
    stats: { hp: 1000, atk: 265, def: 68, speed: 108 },
    tint: { body: '#3a4a6a', helm: '#1a2a4a', weapon: '#4ac8e8', shield: '#e8a04a' },
    sprite: {
      displayH: 92,
      strips: {
        // One nine-frame idle so far — the rest of his set is still to
        // come, and the animator falls back to the idle for anything a
        // hero has not got yet.
        idle: { src: 'assets/heroes/gulldigger/Hallowidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cork_snap', name: 'Cork Snap',
        icon: 'assets/icons/fc819.png',
        description: 'Thumb the cork off and let one bolt out: 160% ATK to a single enemy.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.6 }],
        // No crowd bonus: this is the one button he owns that is aimed
        // rather than poured, and it is deliberately the better press
        // when there is only one bird left standing.
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'squall_line', name: 'Squall Line',
        icon: 'assets/icons/fc823.png',
        description: 'Tip the bottle across the whole enemy line: 60% ATK to ALL enemies, ' +
          'and 8% more to each of them for every enemy beyond the first that the squall catches.',
        cooldown: 5, targeting: 'all-enemies', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 0.6, perTarget: 0.08 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { perTarget: 0.02 },
          { perTarget: 0.02 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'uncork_the_bottle', name: 'Uncork the Bottle',
        icon: 'assets/icons/fc786.png',
        description: 'Pull the cork out entirely: 140% ATK to ALL enemies, and 12% more to ' +
          'each of them for every enemy beyond the first caught in it, with a 50% chance ' +
          'each to knock 20% off their action bars.',
        cooldown: 8, targeting: 'all-enemies', animation: 'idle', impact: 'strike',
        effects: [
          { type: 'damage', mult: 1.4, perTarget: 0.12 },
          { type: 'turnMeter', amount: -0.20, chance: 0.5 },
        ],
        levelUps: [
          { perTarget: 0.02 },
          { debuffChance: 0.2 },
          { debuffChance: 0.2 },
          { debuffChance: 0.1 },
          { mult: 0.1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Eye of the Storm',
      icon: 'assets/icons/fc866.png',
      description: 'Gains 5% action bar for every enemy struck by a skill that hits more than one.',
      hooks: {
        // Fired once per victim by the battle's damage bookkeeping. The
        // meter is NOT clamped here: a gift that would push him past the
        // cap is worth more than the cap, and clamping it used to hand
        // an overfilled unit a demotion (see the roster-wide guard in
        // test/rules.test.js).
        onSweepHit(unit) {
          unit.turnMeter += CONFIG.TURN_METER_MAX * 0.05;
          return { floats: [{ target: unit, text: '▲', color: '#8ee8ff' }] };
        },
      },
    },
    positional: POSITIONALS.stormglass,
  },

  ike: {
    id: 'ike',
    element: 'water',
    name: 'Ike',
    title: 'Boarding Pike',
    rarity: 3,
    // Sturdier than Hallow and nowhere near a tank: he lands within a
    // few points of Sawyer, the roster's other front-line damage dealer,
    // which is the band a front-row DPS belongs in. The first pass at
    // this line read as a TANK by a single point of the Tags
    // classifier -- bulk 213 against punch 212 -- which is exactly the
    // kind of thing that is invisible until something prints the label.
    // (Ratios only; js/data/balance.js scales all three to the shared
    // budget and leaves speed alone.)
    stats: { hp: 1400, atk: 240, def: 120, speed: 104 },
    tint: { body: '#e8eef4', helm: '#1a3a7a', weapon: '#b8863a', shield: '#2a4a8a' },
    sprite: {
      displayH: 96, // he stands tall on the pike -- a heron's legs
      strips: {
        idle: { src: 'assets/heroes/gulldigger/Ikeidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'sweep_the_deck', name: 'Sweep the Deck',
        icon: 'assets/icons/fc1045.png',
        description: 'Work the pike along the enemy front rank: 70% ATK to the enemy FRONT row, ' +
          'and 6% more to each of them for every enemy beyond the first the sweep catches.',
        cooldown: 0, targeting: 'front-enemies', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 0.7, perTarget: 0.06 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { perTarget: 0.02 },
          { perTarget: 0.02 },
        ],
      },
      {
        id: 'gaff_and_haul', name: 'Gaff and Haul',
        icon: 'assets/icons/fc1050.png',
        description: 'Drive the hook through a whole rank: 115% ATK to one enemy and everyone ' +
          'level with them, and 8% more to each for every enemy beyond the first on the line.',
        cooldown: 4, targeting: 'enemy-row', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.15, perTarget: 0.08 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { perTarget: 0.02 },
          { perTarget: 0.02 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'skewer', name: 'Skewer',
        icon: 'assets/icons/fc89.png',
        description: 'Both wings behind it, straight through one bird: 260% ATK to a single enemy.',
        cooldown: 7, targeting: 'enemy', animation: 'idle', impact: 'strike',
        // Deliberately no crowd bonus. Every other button he owns wants
        // a full enemy line; this is the one he presses when there is
        // one bird left and the sect's whole thesis has stopped paying.
        effects: [{ type: 'damage', mult: 2.6 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Long Reach',
      icon: 'assets/icons/fc1117.png',
      description: 'His front-row sweeps reach the enemy CENTER hex as well.',
      hooks: {
        // Read by resolveTargets, which folds the centre into every
        // 'front-enemies' cast this hero makes. It is a damage passive
        // wearing a targeting hook: one more body in the sweep is one
        // more stack of his own crowd bonus, on every skill that has
        // one.
        reachesCenter: true,
      },
    },
    positional: POSITIONALS.bloodied_fury,
  },

  jack: {
    id: 'jack',
    element: 'water',
    name: 'Jack',
    title: 'Powder Monkey',
    rarity: 1,
    // The bottom of the sect: fast, cheap, and made of paper. He is
    // priced to be spent, which is the whole reason his passive only
    // pays once he has been. (Ratios only; js/data/balance.js scales
    // all three to the shared budget and leaves speed alone.)
    stats: { hp: 900, atk: 200, def: 85, speed: 118 },
    tint: { body: '#8a6a4a', helm: '#1a5ac8', weapon: '#c8ccd4', shield: '#1a5ac8' },
    sprite: {
      displayH: 74, // the smallest bird on the line
      strips: {
        idle: { src: 'assets/heroes/gulldigger/Jackidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    // ONE skill, and it has to be cooldown-free: a 1-star with a
    // cooldown would spend whole turns with nothing to press. The
    // contract test in data.test.js holds both halves of that.
    abilities: [
      {
        id: 'shivwork', name: 'Shivwork',
        icon: 'assets/icons/fc819.png',
        description: 'In under the guard and out again: 60% ATK to the enemy FRONT row, ' +
          'and 5% more to each of them for every enemy beyond the first he gets among.',
        cooldown: 0, targeting: 'front-enemies', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 0.6, perTarget: 0.05 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { perTarget: 0.02 },
          { perTarget: 0.02 },
        ],
      },
    ],
    passive: {
      name: 'Powder Monkey',
      icon: 'assets/icons/fc786.png',
      description: 'He is carrying the charges. When Jack falls, the keg goes with ' +
        'him: 180% of his ATK to every enemy on a front hex, and 12% more to each ' +
        'of them for every enemy beyond the first caught in the blast.',
      hooks: {
        // The one passive on the roster that pays out for its OWNER
        // dying rather than for somebody else doing it. The victim is
        // rung into its own death for exactly this (js/hero.js).
        //
        // Damage goes through Abilities.strike, which is exported so
        // hooks deal damage down the same pipeline an ability does --
        // the DEF curve, dodge, guards, reflect and the damage meter
        // all still apply, and the keg is credited to Jack.
        onUnitDied(unit, { victim, battle }) {
          if (victim !== unit || !battle) return null;
          const foes = battle.livingUnits(unit.enemyTeam())
            .filter((u) => u.isBoss || u.slot.position === POSITION.FRONT);
          if (foes.length === 0) return null;
          // Same arithmetic the sect's skills use: every body beyond the
          // first deepens the blast for all of them.
          const mult = 1.8 + 0.12 * (foes.length - 1);
          const floats = [];
          for (const foe of foes) {
            const raw = unit.effectiveStat('atk') * mult *
              Elements.mult(unit.element, foe.element);
            const hit = Abilities.strike(unit, foe, raw);
            if (hit && hit.amount > 0) {
              floats.push({ target: foe, text: `-${hit.amount}`, color: '#e8a04a' });
            }
          }
          if (floats.length === 0) return null;
          return { message: `${unit.name}'s powder goes up with him!`, floats };
        },
      },
    },
    positional: POSITIONALS.first_blood,
  },

  phil: {
    id: 'phil',
    element: 'water',
    name: 'Phil',
    title: 'Chum Slinger',
    rarity: 2,
    // Back-line damage on a body that can take a hit or two more than
    // Hallow's -- he is the sect's cheap ranged option rather than its
    // glass cannon. (Ratios only; js/data/balance.js scales all three to
    // the shared budget and leaves speed alone.)
    stats: { hp: 1050, atk: 245, def: 78, speed: 106 },
    tint: { body: '#d8dce4', helm: '#1a5ac8', weapon: '#8a6a3a', shield: '#e8a04a' },
    sprite: {
      displayH: 88,
      strips: {
        idle: { src: 'assets/heroes/gulldigger/Philidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    // TWO skills, being a 2-star: the no-cooldown one and the short
    // one, with no long cooldown at all. The contract test in
    // data.test.js holds the count to the star rating.
    abilities: [
      {
        id: 'slop_toss', name: 'Slop Toss',
        icon: 'assets/icons/fc823.png',
        description: 'Lob a handful over the enemy line: 65% ATK to the enemy BACK row, ' +
          'and 5% more to each of them for every enemy beyond the first it lands among.',
        cooldown: 0, targeting: 'back-enemies', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 0.65, perTarget: 0.05 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { perTarget: 0.02 },
          { perTarget: 0.02 },
        ],
      },
      {
        id: 'chum_the_water', name: 'Chum the Water',
        icon: 'assets/icons/fc1117.png',
        description: 'Upend the whole bucket over the rail: 110% ATK to the enemy BACK row, ' +
          '8% more to each for every enemy beyond the first, and a 50% chance each to leave ' +
          'them rotting for 25% ATK a turn over 3 turns.',
        cooldown: 5, targeting: 'back-enemies', animation: 'idle', impact: 'strike',
        effects: [
          { type: 'damage', mult: 1.1, perTarget: 0.08 },
          { type: 'dot', pct: 0.25, turns: 3, chance: 0.5, flavor: 'rot' },
        ],
        levelUps: [
          { debuffChance: 0.2 },
          { debuffChance: 0.2 },
          { debuffChance: 0.1 },
          { perTarget: 0.02 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Finds a Gap',
      icon: 'assets/icons/fc1041.png',
      description: 'A bucket of fish guts does not care what anyone is wearing: ' +
        'everything Phil throws slips past 25% of the target\'s DEF.',
      hooks: {
        // Read by Abilities.strike, so it applies to every hit he lands
        // -- the skills, the rot, and anything a hook throws for him.
        // It is the sect's answer to the thing a crowd-scaling kit is
        // worst against: a front rank built entirely out of armour.
        defIgnoreAdd: 0.25,
      },
    },
    positional: POSITIONALS.overwatch,
  },

  peck: {
    id: 'peck',
    element: 'water',
    name: 'Peck',
    title: "Ship's Cook",
    rarity: 3,
    // Priced off his own health pool, so HP is his healing AND his
    // warding and ATK is a dead stat -- and he is the sturdiest bird in
    // the sect by a distance, because a crew this frail cannot afford
    // to lose the galley. (Ratios only; js/data/balance.js scales all
    // three to the shared budget and leaves speed alone.)
    stats: { hp: 1900, atk: 110, def: 130, speed: 100 },
    tint: { body: '#2a2a34', helm: '#1a5ac8', weapon: '#8a6a3a', shield: '#e88a3a' },
    sprite: {
      displayH: 88,
      strips: {
        idle: { src: 'assets/heroes/gulldigger/Peckidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'ladle_out', name: 'Ladle Out',
        icon: 'assets/icons/fc1041.png',
        description: "A bowl pressed into somebody's wings: heal one ally for 15% of Peck's max HP.",
        cooldown: 0, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'healHpPct', pct: 0.15 }],
        levelUps: [
          { heal: 0.05 },
          { heal: 0.05 },
          { heal: 0.05 },
          { heal: 0.05 },
          { heal: 0.05 },
        ],
      },
      {
        id: 'share_the_pot', name: 'Share the Pot',
        icon: 'assets/icons/fc1073.png',
        description: 'Set the cauldron down where everyone can reach it: heal ALL allies for ' +
          "7% of Peck's max HP, and 2% more each for every ally beyond the first at the table.",
        cooldown: 6, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        // Deliberately feeble at a thin table and the best team heal in
        // the game at a full one. Benched against every all-allies mend
        // at cap: at five bodies he sits just under Posie's High
        // Summer, a 5-star; at three he is behind Ilyra; at seven he is
        // ahead of both. The sect's whole argument, on the friendly
        // side of the field.
        effects: [{ type: 'healHpPct', pct: 0.07, perTarget: 0.02 }],
        levelUps: [
          { heal: 0.05 },
          { heal: 0.05 },
          { heal: 0.05 },
          { perTarget: 0.02 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'a_full_belly', name: 'A Full Belly',
        icon: 'assets/icons/fc1113.png',
        description: 'Second helpings all round: ALL allies gain a ward worth 8% of ' +
          "Peck's max HP for 3 turns, and 2% more each for every ally beyond the first fed.",
        cooldown: 7, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'shield', pct: 0.08, perTarget: 0.02, turns: 3 }],
        levelUps: [
          { heal: 0.05 },
          { heal: 0.05 },
          { heal: 0.05 },
          { perTarget: 0.02 },
          { duration: 1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Nothing Goes Back in the Pot',
      icon: 'assets/icons/fc866.png',
      description: 'Healing somebody who is already full is not wasted on Peck: half of ' +
        'any overheal he causes sets as a ward on that ally for 2 turns.',
      hooks: {
        // Fired by notifyOverheal, which every mend in the game already
        // reports through -- so this catches his own pot, and any of it
        // that lands on somebody who did not need it.
        onOverheal(unit, { overflow, target }) {
          if (!target || !target.alive || overflow <= 0) return null;
          const kept = Math.round(overflow * 0.5);
          if (kept <= 0) return null;
          const gained = target.addShield(kept, 2, unit);
          if (gained <= 0) return null;
          return { floats: [{ target, text: `◇ ${gained}`, color: '#e8c86a' }] };
        },
      },
    },
    positional: POSITIONALS.slow_simmer,
  },

  talon: {
    id: 'talon',
    element: 'water',
    name: 'Talon',
    title: 'Ground Tackle',
    rarity: 4,
    // The wall the rest of the sect is built behind. Four Gulldiggers
    // are among the frailest bodies on the roster -- Hallow at 825,
    // Jack at 805, Phil at 885 -- and Talon is the answer to all three
    // of them at once. His damage is priced off DEF, so the stat that
    // keeps him alive is also the stat that makes him hit.
    // (Ratios only; js/data/balance.js scales all three to the shared
    // budget and leaves speed alone.)
    stats: { hp: 2600, atk: 90, def: 280, speed: 94 },
    tint: { body: '#2a3a6a', helm: '#1a2a4a', weapon: '#8a8a94', shield: '#c8a86a' },
    sprite: {
      displayH: 100, // hunched, but he is the biggest bird on the deck
      strips: {
        idle: { src: 'assets/heroes/gulldigger/Talonidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'anchor_swing', name: 'Anchor Swing',
        icon: 'assets/icons/fc1045.png',
        description: 'Bring the whole anchor round: 70% of Talon\'s DEF to the enemy FRONT row, ' +
          'and 5% more to each of them for every enemy beyond the first it reaches.',
        cooldown: 0, targeting: 'front-enemies', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damageDef', mult: 0.7, perTarget: 0.05 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { perTarget: 0.02 },
          { perTarget: 0.02 },
        ],
      },
      {
        id: 'snub_the_cable', name: 'Snub the Cable',
        icon: 'assets/icons/fc1113.png',
        description: 'Take the strain for the whole crew: ALL allies take 20% less damage ' +
          'for 2 turns.',
        cooldown: 4, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        // The first team-wide mitigation in the game. Nothing on the
        // roster reduced incoming damage for the whole side before
        // this, which is a strange gap until you notice that no sect
        // needed it as badly as one made out of paper.
        effects: [{ type: 'buff', stat: 'damageTaken', mult: 0.80, turns: 2 }],
        levelUps: [
          { buffPower: 0.05 },
          { buffPower: 0.05 },
          { duration: 1 },
          { buffPower: 0.05 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'let_go_the_anchor', name: 'Let Go the Anchor',
        icon: 'assets/icons/fc786.png',
        description: 'Drop the whole weight of it: 140% of Talon\'s DEF to the enemy FRONT row, ' +
          '10% more to each for every enemy beyond the first, and Talon takes a ward worth ' +
          '20% of his max HP for 3 turns.',
        cooldown: 7, targeting: 'front-enemies', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damageDef', mult: 1.4, perTarget: 0.10 }],
        selfEffects: [{ type: 'shield', pct: 0.20, turns: 3 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { perTarget: 0.02 },
          { heal: 0.05 },
          { heal: 0.05 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Ground Tackle',
      icon: 'assets/icons/fc1053.png',
      description: 'The more of them pull on it, the deeper it sets: Talon takes 5% less ' +
        'damage for every living enemy, down to 30% less against a full line.',
      hooks: {
        // The sect's crowd bonus, worn by the one Gulldigger who is not
        // hitting anybody with it. Capped at six bodies so a seven-hex
        // field and a full boss room are worth the same.
        damageTakenMult(unit) {
          const b = typeof Battle !== 'undefined' ? Battle.active : null;
          if (!b) return 1;
          const foes = b.livingUnits(unit.enemyTeam()).length;
          return 1 - 0.05 * Math.min(6, foes);
        },
      },
    },
    positional: POSITIONALS.set_fast,
  },

  bo: {
    id: 'bo',
    element: 'water',
    name: 'Bo',
    title: 'Full Pouch',
    rarity: 3,
    // One stat, three jobs. Everything Bo does is priced off his own
    // health pool -- the damage, the meal, the whole kit -- so HP is
    // his offence, his sustain and his survival at once, and ATK is a
    // dead roll on him.
    //
    // Which is exactly why the pool is smaller than it wants to be. The
    // first pass gave him 5,905 at Lv 30, and an HP-priced kit turns a
    // big pool into big EVERYTHING: he out-hit Ike, the sect's actual
    // damage dealer, and out-tanked Talon, its 4-star wall. He now
    // lands at 4,839 -- comfortably under Talon, which is where a
    // 3-star tank belongs.
    // (Ratios only; js/data/balance.js scales all three to the shared
    // budget and leaves speed alone.)
    stats: { hp: 2200, atk: 100, def: 180, speed: 96 },
    tint: { body: '#e8ecf4', helm: '#1a3a8a', weapon: '#e8903a', shield: '#4a8ad8' },
    sprite: {
      displayH: 98,
      strips: {
        idle: { src: 'assets/heroes/gulldigger/Boidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bill_sweep', name: 'Bill Sweep',
        icon: 'assets/icons/fc819.png',
        description: "Rake the bill along the line: 3% of Bo's max HP as damage to the enemy FRONT row.",
        cooldown: 0, targeting: 'front-enemies', animation: 'idle', impact: 'strike',
        // No crowd bonus on the damage itself -- his crowd bonus is the
        // PASSIVE, which pays once per bird he catches. Every Gulldigger
        // expresses the sect a different way; stacking the tag on top
        // would just be Ike again with a bigger stomach.
        //
        // The rungs move in TWOS rather than the usual fives. The rate
        // rule prices a percentage of a health pool in five-point steps
        // because a pool is normally a healer's 3-4k; Bo's is 5,905,
        // and five-point steps on a cooldown-free sweep had him hitting
        // 984 a body at cap -- more than double Ike, who is the sect's
        // actual damage dealer. A tank does not out-hit the striker.
        effects: [{ type: 'damageHpPct', pct: 0.03 }],
        levelUps: [
          { heal: 0.02 },
          { heal: 0.02 },
          { heal: 0.02 },
          { heal: 0.02 },
          { heal: 0.02 },
        ],
      },
      {
        id: 'bill_full_of_sea', name: 'Bill Full of Sea',
        icon: 'assets/icons/fc1041.png',
        description: "Scoop up half the harbour and swallow it: heal 20% of Bo's max HP " +
          'and take 25% less damage for 2 turns.',
        cooldown: 4, targeting: 'self', animation: 'idle', impact: 'heal_gold',
        effects: [
          { type: 'healHpPct', pct: 0.20 },
          { type: 'buff', stat: 'damageTaken', mult: 0.75, turns: 2 },
        ],
        levelUps: [
          { heal: 0.05 },
          { heal: 0.05 },
          { buffPower: 0.05 },
          { duration: 1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
        // (heal rungs raise the mend; buffPower deepens the mitigation)
      },
      {
        id: 'swallow_it_whole', name: 'Swallow It Whole',
        icon: 'assets/icons/fc786.png',
        description: "Something far too big for him, gone in one: 30% of Bo's max HP as " +
          'damage to a single enemy, and Bo mends 25% of his own max HP on the way down.',
        cooldown: 7, targeting: 'enemy', animation: 'idle', impact: 'strike',
        // Both numbers on this card are HP-priced, so ONE heal rung
        // raises both of them -- the ladder cannot tell the bite from
        // the swallow. That is why it is short: five rungs would have
        // been worth ten, and a 50%-of-pool mend on a five-turn
        // cooldown on top of the bite.
        effects: [{ type: 'damageHpPct', pct: 0.30 }],
        selfEffects: [{ type: 'healHpPct', pct: 0.25 }],
        levelUps: [
          { heal: 0.05 },
          { heal: 0.05 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Full Pouch',
      icon: 'assets/icons/fc1073.png',
      description: 'Whatever he knocks down goes in the bill: Bo mends 4% of his max HP ' +
        'every time he damages an enemy.',
      hooks: {
        // The sect's crowd bonus, eaten rather than dealt. A front-row
        // sweep that catches three birds is three meals, so the wider
        // the fight the harder he is to put down -- and it is priced
        // off HIS pool rather than the damage, so a big fish and a
        // small one feed him exactly the same. That is what separates
        // it from a drain.
        onDealtDamage(unit, { amount, target, battle }) {
          if (!unit.alive || amount <= 0) return null;
          if (!target || target.team === unit.team) return null;
          const meal = Math.max(1, Math.round(unit.maxHp * 0.04));
          const healed = unit.heal(meal, unit);
          if (healed <= 0) return null;
          if (battle) battle.addFloatingText(unit, `+${healed}`, '#8ae88a');
          return null;
        },
      },
    },
    positional: POSITIONALS.deep_pouch,
  },

  wanda: {
    id: 'wanda',
    element: 'water',
    name: 'Wanda',
    title: 'Bosun',
    rarity: 2,
    // Nothing in her kit reads ATK or her own health pool: she is a
    // whistle with legs, and every number on her card is a flat
    // percentage. Speed is the one stat that changes what she is worth,
    // because a call given before the enemy line thins is worth more
    // than the same call given after.
    // (Ratios only; js/data/balance.js scales all three to the shared
    // budget and leaves speed alone.)
    stats: { hp: 1500, atk: 95, def: 125, speed: 116 },
    tint: { body: '#e8ecf4', helm: '#1a5ac8', weapon: '#e8b898', shield: '#c8a86a' },
    sprite: {
      displayH: 94, // she stands tall, and the conch stands taller
      strips: {
        idle: { src: 'assets/heroes/gulldigger/Wandaidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    // TWO skills, being a 2-star.
    abilities: [
      {
        id: 'pipe_the_side', name: 'Pipe the Side',
        icon: 'assets/icons/fc866.png',
        description: 'Two notes on the conch and somebody moves: one ally gains 15% action bar.',
        cooldown: 0, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        // Rungs of three rather than the usual five. At the standard
        // step this reached 45% -- and 56% off her own back hex --
        // against the 35% Artur's Margin Note tops out at, on the same
        // cooldown-free single-ally slot. He is the roster's tempo
        // support and a 4-star; a 2-star does not out-pipe him on the
        // button they share.
        effects: [{ type: 'turnMeter', amount: 0.15 }],
        levelUps: [
          { meter: 0.03 },
          { meter: 0.03 },
          { meter: 0.03 },
          { meter: 0.03 },
          { meter: 0.03 },
        ],
      },
      {
        id: 'all_hands', name: 'All Hands',
        icon: 'assets/icons/fc1113.png',
        description: 'The long call, and the whole deck answers: ALL allies gain 8% action ' +
          'bar and 2% more each for every ally beyond the first who answers, plus 15% ATK ' +
          'for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        // The sect's crowd bonus on tempo. It matters more to the
        // Gulldiggers than it would to anyone else: their damage is
        // priced off how many enemies are still standing, so a turn
        // taken EARLY -- while the enemy line is still full -- is worth
        // more than the same turn taken late. Wanda is how they get
        // their sweeps off before the crowd thins.
        effects: [
          { type: 'turnMeter', amount: 0.08, perTarget: 0.02 },
          { type: 'buff', stat: 'atk', mult: 1.15, turns: 2 },
        ],
        levelUps: [
          { meter: 0.02 },
          { perTarget: 0.01 },
          { buffPower: 0.05 },
          { duration: 1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Carries on the Wind',
      icon: 'assets/icons/fc1053.png',
      description: 'A conch heard once is heard for a while: every buff Wanda hands out ' +
        'lasts 1 turn longer.',
      hooks: {
        // Read off the SOURCE when a buff lands, so it lengthens what
        // she gives other people rather than what she happens to be
        // carrying. Completes the family: Vex lengthens her hexes,
        // Peck his wards, Wanda her blessings.
        buffExtraTurns: 1,
      },
    },
    positional: POSITIONALS.weather_eye,
  },
});
