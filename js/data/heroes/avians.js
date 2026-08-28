// Avian heroes. Registered into the shared HEROES table declared in
// js/data/heroes.js. Two sects live here, and they are built on
// opposite arithmetic:
//
//   Gulldigger    water, pirate seabirds. `perTarget` -- worth more the
//                 bigger the crowd a cast catches.
//   Phoenix Court fire, red and gold. `perBurn` -- worth more the more
//                 fires are already lit. Their damage dealers set the
//                 burns and their court is paid for them, so the two
//                 halves have to be fielded together to be worth
//                 anything at all.
//   Sunbrood      light, gold and white. Speed first, then max HP,
//                 then healing -- and the ORDER matters, because light
//                 already sells max HP at 2pc and 4pc, so the brood has
//                 to SPEND a pool rather than sell a bigger one. Aurek
//                 pays HP for damage; nothing else in the game does,
//                 and only a sect with two healers and a health
//                 obsession could afford to.
//
//                 They are also the first sect on a different shape:
//                 the light and dark orders have no 1-star and no
//                 2-star, so this one is four 3-stars, three 4-stars
//                 and two 5-stars.
//   Razorwings    wind, green and white. SPEED, spent as damage rather
//                 than banked as more turns. That distinction is the
//                 whole sect: the wind ELEMENT pack already sells speed
//                 as extra turns (Following Wind, Crosswind, Second
//                 Gust), and a sect tier always lands on top of an
//                 element tier, so a Razorwing selling raw speed again
//                 would only compound what the party already holds.
//                 They convert it instead -- being faster than the
//                 thing in front of you is worth something on the swing
//                 itself.
//
// Where a human sect is nine heroes of whatever rarity they happened to
// be written at, a bird sect is built to a shape — one 1★, two 2★,
// three 3★, two 4★ and a single 5★ — and each sect declares its own in
// js/races.js rather than inheriting one.

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
          'and 3% more to each of them for every enemy beyond the first that the squall catches.',
        // His cheap sweep, and it was compounding twice: it hits every
        // body on the field AND gets deeper for each one. The crowd
        // bonus is the half that scales, so it is the half that moves.
        cooldown: 5, targeting: 'all-enemies', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 0.6, perTarget: 0.03 }],
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
        description: 'Pull the cork out entirely: 140% ATK to ALL enemies, and 10% more to ' +
          'each of them for every enemy beyond the first caught in it, with a 50% chance ' +
          'each to knock 20% off their action bars.',
        cooldown: 8, targeting: 'all-enemies', animation: 'idle', impact: 'strike',
        effects: [
          { type: 'damage', mult: 1.4, perTarget: 0.10 },
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
        // These numbers were cut once and put straight back. The cut was
        // made when Jack benched above the whole 3-star shelf -- but that
        // was the STAR MULTIPLIER talking, not the skill: it compounded
        // per star gained above base rarity, so at the shared ceiling the
        // cheapest hero on the roster had climbed the furthest and
        // finished 2.44x ahead of a 5-star. Rarity is priced in the base
        // budget now (js/data/balance.js) and the ceiling is level, so
        // the cut was double-counting a bug that no longer exists.
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
          "5% of Peck's max HP, and 2% more each for every ally beyond the first at the table.",
        cooldown: 6, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        // Deliberately feeble at a thin table and the best team heal in
        // the game at a full one. Benched against every all-allies mend
        // at cap: at five bodies he sits just under Posie's High
        // Summer, a 5-star; at three he is behind Ilyra; at seven he is
        // ahead of both. The sect's whole argument, on the friendly
        // side of the field.
        effects: [{ type: 'healHpPct', pct: 0.05, perTarget: 0.02 }],
        // One `heal` rung instead of two. At a full table the crowd
        // bonus is already most of the mend; doubling the base on top of
        // it was the part that ran away.
        levelUps: [
          { heal: 0.05 },
          { perTarget: 0.02 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'a_full_belly', name: 'A Full Belly',
        icon: 'assets/icons/fc1113.png',
        description: 'Second helpings all round: ALL allies gain a ward worth 5% of ' +
          "Peck's max HP for 3 turns, and 2% more each for every ally beyond the first fed.",
        cooldown: 7, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'shield', pct: 0.05, perTarget: 0.02, turns: 3 }],
        // Same cut as the pot, for the same reason: `heal` rungs price
        // the ward too.
        levelUps: [
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
        // Three power rungs took this to 35% off ALL incoming damage for
        // the whole side, on a two-turn cooldown against a three-turn
        // duration -- permanent uptime, and it put a 4-star ahead of
        // every 5-star tank on the bench. One rung now, so it tops out
        // at 25%. The ladder is deliberately shorter than its slot
        // allows (the contract permits that); the skill's own level cap
        // comes down with it, which is the rest of the cut.
        levelUps: [
          { buffPower: 0.05 },
          { duration: 1 },
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

  polo: {
    id: 'polo',
    element: 'water',
    name: 'Polo',
    title: 'Cartographer',
    rarity: 4,
    // A pure buffer: he does no damage and mends nobody, so the whole
    // of him is what he hands other people. Sturdy enough to survive
    // being reached, because the crew is holding a chart it cannot
    // read without him.
    // (Ratios only; js/data/balance.js scales all three to the shared
    // budget and leaves speed alone.)
    stats: { hp: 1750, atk: 95, def: 150, speed: 108 },
    tint: { body: '#dfe6ee', helm: '#1a5ac8', weapon: '#c8a86a', shield: '#8a6a3a' },
    sprite: {
      displayH: 92,
      strips: {
        idle: { src: 'assets/heroes/gulldigger/Poloidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'take_a_bearing', name: 'Take a Bearing',
        icon: 'assets/icons/fc1050.png',
        description: 'Fix somebody\'s position and hold them to it: one ally gains 25% ' +
          'Accuracy and 25% Resistance for 2 turns.',
        cooldown: 0, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        // Two stats almost nothing on the roster hands out, and the two
        // the Gulldiggers most need: half the sect's riders are gated
        // rolls, and a crew this frail cannot afford to be hexed.
        effects: [
          { type: 'buff', stat: 'accuracy', add: 0.15, turns: 2 },
          { type: 'buff', stat: 'resistance', add: 0.15, turns: 2 },
        ],
        levelUps: [
          { buffPower: 0.05 },
          { buffPower: 0.05 },
          { buffPower: 0.05 },
          { duration: 1 },
        ],
      },
      {
        id: 'sound_the_depths', name: 'Sound the Depths',
        icon: 'assets/icons/fc823.png',
        description: 'Read the bottom and mark the shoals: ALL allies gain 10% Crit Chance ' +
          'for 3 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        // The roster's first TEAM crit buff -- Artur hands crit to one
        // ally at a time and nobody else hands it out at all. Sized
        // against him deliberately: at cap, and with his own hex
        // counted, Polo gives the WHOLE crew what Artur gives one bird,
        // and pays a four-turn cooldown for it where Artur pays none.
        effects: [{ type: 'buff', stat: 'critChance', add: 0.10, turns: 3 }],
        levelUps: [
          { buffPower: 0.05 },
          { buffPower: 0.05 },
          { duration: 1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'every_berth_charted', name: 'Every Berth Charted',
        icon: 'assets/icons/fc1117.png',
        description: 'The whole deck, drawn to scale: for 2 turns every ally counts as ' +
          'standing on their own favoured hex, wherever they actually are.',
        cooldown: 7, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        // The map. Every hero in the game carries a bonus locked to one
        // hex and spends the whole fight either on it or without it;
        // for two turns Polo suspends that, and a formation built for
        // one thing gets to be built for another. Carried as a plain
        // status so it expires, is sealed, and is stripped like any
        // other blessing.
        effects: [{ type: 'buff', stat: 'charted', turns: 2 }],
        levelUps: [
          { duration: 1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Dead Reckoning',
      icon: 'assets/icons/fc866.png',
      description: 'He does not need the hex to know where he is: Polo\'s own positional ' +
        'bonus is active on every tile of the field.',
      hooks: {
        // Read directly out of positionalActive(), which is the single
        // question every hex bonus in the game already asks.
        alwaysPositioned: true,
      },
    },
    positional: POSITIONALS.chart_table,
  },
});

// ---- The Phoenix Court -----------------------------------------------------
//
// Fire and blessings, and one mechanic tying them together: `perBurn`
// deepens a Court blessing (and a Court mend) for every enemy currently
// carrying a burn. Flurry, Barrington and Kavit light them; Stoddard,
// Stella, Sarena, Orri and Chirp spend them; Korvid makes sure there is
// still a court standing to spend anything.

Object.assign(HEROES, {

  korvid: {
    id: 'korvid',
    element: 'fire',
    name: 'Korvid',
    title: 'Shield of the Court',
    rarity: 5,
    // Named outright. Two of his three skills point at his own side --
    // a team ward and a raise -- so the classifier reads him as a
    // support, and his statline (2135 HP behind 214 DEF) says otherwise
    // in the loudest possible terms. Catherine carries the same
    // override for the same reason.
    role: 'tank',
    stats: { hp: 2500, atk: 95, def: 250, speed: 92 },
    tint: { body: '#2a2630', helm: '#c8a03a', weapon: '#e8a83a', shield: '#c83a2a' },
    sprite: {
      displayH: 104, // wings out, he is the widest bird in the game
      strips: {
        idle: { src: 'assets/heroes/phoenixcourt/Korvididle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'shield_bell', name: 'Shield Bell',
        icon: 'assets/icons/fc1045.png',
        description: 'Ring the boss of the shield across the enemy front rank: 65% of ' +
          "Korvid's DEF, and a 50% chance each to set them burning for 20% ATK a turn " +
          'over 3 turns.',
        cooldown: 0, targeting: 'front-enemies', animation: 'idle', impact: 'strike',
        effects: [
          { type: 'damageDef', mult: 0.65 },
          { type: 'dot', pct: 0.20, turns: 3, chance: 0.5, flavor: 'burn' },
        ],
        levelUps: [
          { debuffChance: 0.2 },
          { debuffChance: 0.2 },
          { debuffChance: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'close_the_ranks', name: 'Close the Ranks',
        icon: 'assets/icons/fc1113.png',
        description: 'Set the shield down where the whole court can get behind it: ALL ' +
          'allies gain a ward worth 100% of Korvid\'s ATK for 3 turns, and 10% more for ' +
          'every burning enemy.',
        cooldown: 5, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'shield', mult: 1.0, turns: 3 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { duration: 1 },
          { mult: 0.1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'from_the_ashes', name: 'From the Ashes',
        icon: 'assets/icons/fc786.png',
        description: 'The Court does not end: raise one fallen ally at 40% health, and ' +
          'give every ally 20% ATK for 3 turns.',
        cooldown: 8, targeting: 'dead-ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'revive', pct: 0.40 }],
        selfEffects: [{ type: 'buff', stat: 'atk', mult: 1.20, turns: 3 }],
        levelUps: [
          { heal: 0.05 },
          { heal: 0.05 },
          { buffPower: 0.05 },
          { heal: 0.05 },
          { duration: 1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'The Court Stands',
      icon: 'assets/icons/fc1053.png',
      description: 'He is only as strong as the court behind him: Korvid takes 5% less ' +
        'damage for every other ally still standing.',
      hooks: {
        // The inverse of a lone wall. Korvid is at his softest in the
        // fight he has left to hold on his own, which is the opposite
        // of Talon -- who sets deeper the more ENEMIES are pulling --
        // and gives the two tanks different fights to want.
        damageTakenMult(unit) {
          const b = typeof Battle !== 'undefined' ? Battle.active : null;
          if (!b) return 1;
          const court = b.livingUnits(unit.team).filter((u) => u !== unit).length;
          return 1 - 0.05 * Math.min(6, court);
        },
      },
    },
    positional: POSITIONALS.phoenix_shield,
  },

  kavit: {
    id: 'kavit',
    element: 'fire',
    name: 'Kavit',
    title: 'Ash Knives',
    rarity: 4,
    stats: { hp: 1050, atk: 255, def: 75, speed: 114 },
    tint: { body: '#6a4a3a', helm: '#8a3a2a', weapon: '#c8ccd4', shield: '#4a2a20' },
    sprite: {
      displayH: 94,
      strips: {
        idle: { src: 'assets/heroes/phoenixcourt/Kavitidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'twin_cut', name: 'Twin Cut',
        icon: 'assets/icons/fc89.png',
        description: 'Both knives, one after the other: 75% ATK twice to a single enemy.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'damage', mult: 0.75 },
        ],
        levelUps: [
          { mult: 0.05 },
          { mult: 0.05 },
          { mult: 0.05 },
          { mult: 0.05 },
          { mult: 0.05 },
        ],
      },
      {
        id: 'cinder_in_the_wound', name: 'Cinder in the Wound',
        icon: 'assets/icons/fc819.png',
        description: 'Leave something in it: 130% ATK to one enemy, with a 50% chance to ' +
          'set them burning for 30% ATK a turn over 3 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [
          { type: 'damage', mult: 1.3 },
          { type: 'dot', pct: 0.30, turns: 3, chance: 0.5, flavor: 'burn' },
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
        id: 'carrion_call', name: 'Carrion Call',
        icon: 'assets/icons/fc1050.png',
        description: 'A vulture knows when to come down: 200% ATK to one enemy, and half ' +
          'again against anyone already burning.',
        cooldown: 7, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 2.0, bonusVs: { flavor: 'burn', mult: 1.5 } }],
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
      name: 'Ash Knives',
      icon: 'assets/icons/fc1117.png',
      description: 'Every fire on the field is one more thing to cut: Kavit deals 5% more ' +
        'damage for each burning enemy.',
      hooks: {
        damageDealtMult(unit) {
          const b = typeof Battle !== 'undefined' ? Battle.active : null;
          if (!b) return 1;
          const lit = b.livingUnits(unit.enemyTeam())
            .filter((u) => u.burning && u.burning()).length;
          return 1 + 0.05 * Math.min(4, lit);
        },
      },
    },
    positional: POSITIONALS.overwatch,
  },

  flurry: {
    id: 'flurry',
    element: 'fire',
    name: 'Flurry',
    title: 'Firebrand of the Court',
    rarity: 3,
    stats: { hp: 1400, atk: 245, def: 115, speed: 110 },
    tint: { body: '#e8e4e0', helm: '#c83a2a', weapon: '#e8903a', shield: '#c8a03a' },
    sprite: {
      displayH: 96,
      strips: {
        idle: { src: 'assets/heroes/phoenixcourt/flurryidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'brandwork', name: 'Brandwork',
        icon: 'assets/icons/fc1045.png',
        description: 'A burning blade along the front rank: 75% ATK to the enemy FRONT row, ' +
          'with a 50% chance each to set them burning for 15% ATK a turn over 2 turns.',
        cooldown: 0, targeting: 'front-enemies', animation: 'idle', impact: 'strike',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'dot', pct: 0.15, turns: 2, chance: 0.5, flavor: 'burn' },
        ],
        levelUps: [
          { debuffChance: 0.2 },
          { debuffChance: 0.2 },
          { debuffChance: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'running_flame', name: 'Running Flame',
        icon: 'assets/icons/fc823.png',
        description: 'Drag the blade and let it catch: 140% ATK to one enemy and everyone ' +
          'level with them.',
        cooldown: 4, targeting: 'enemy-row', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.4 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'crest_and_comb', name: 'Crest and Comb',
        icon: 'assets/icons/fc786.png',
        description: 'Everything he has, into one bird: 250% ATK to a single enemy.',
        cooldown: 7, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 2.5 }],
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
      name: 'Catches Quick',
      icon: 'assets/icons/fc1066.png',
      // She used to carry `burnRekindle` as well as the Court's 2pc,
      // which meant a Flurry standing with the sect spread TWICE and
      // lit three fires on a single re-burn. The tier owns the spread
      // now; her passive moved to an axis the Court does not sell.
      // Fires, tick size and duration are all bought elsewhere in the
      // pack, so hers front-loads what is already there: the fire bites
      // the moment it catches instead of waiting a turn. It adds to the
      // pack rather than multiplying through it.
      description: 'Flurry\'s fires take at once: every burn she sets deals its ' +
        'first tick the instant it lands, instead of waiting for the enemy\'s turn.',
      hooks: { dotBitesOnApply: true },
    },
    positional: POSITIONALS.vanguard_press,
  },

  barrington: {
    id: 'barrington',
    element: 'fire',
    name: 'Barrington',
    title: 'Duellist of the Court',
    rarity: 3,
    stats: { hp: 1100, atk: 250, def: 85, speed: 118 },
    tint: { body: '#e8e4dc', helm: '#2a3a6a', weapon: '#d8dce4', shield: '#c83a2a' },
    sprite: {
      displayH: 96,
      strips: {
        idle: { src: 'assets/heroes/phoenixcourt/Barringtonidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'point_work', name: 'Point Work',
        icon: 'assets/icons/fc89.png',
        description: 'A rapier does not swing: 145% ATK to a single enemy, slipping past ' +
          '15% of their DEF.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.45, ignoreDef: 0.15 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'riposte', name: 'Riposte',
        icon: 'assets/icons/fc819.png',
        description: 'Answer the opening: 110% ATK to one enemy, and Barrington takes 30% ' +
          'Crit Chance for 3 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.1 }],
        selfEffects: [{ type: 'buff', stat: 'critChance', add: 0.30, turns: 3 }],
        levelUps: [
          { buffPower: 0.05 },
          { buffPower: 0.05 },
          { mult: 0.1 },
          { duration: 1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'the_whole_line', name: 'The Whole Line',
        icon: 'assets/icons/fc1050.png',
        description: 'Down the length of the rank, one thrust each: 105% ATK to the enemy ' +
          'BACK row, with a 50% chance each to set them burning for 20% ATK a turn over ' +
          '3 turns.',
        cooldown: 7, targeting: 'back-enemies', animation: 'idle', impact: 'strike',
        effects: [
          { type: 'damage', mult: 1.05 },
          { type: 'dot', pct: 0.20, turns: 3, chance: 0.5, flavor: 'burn' },
        ],
        levelUps: [
          { debuffChance: 0.2 },
          { debuffChance: 0.2 },
          { debuffChance: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Form',
      icon: 'assets/icons/fc1041.png',
      description: 'A duellist finishes what he opens: 10% more damage to any enemy ' +
        'that is already burning.',
      hooks: {
        damageDealtMult: (u, t) => (t && t.burning && t.burning() ? 1.10 : 1),
      },
    },
    positional: POSITIONALS.pyre_sight,
  },

  stoddard: {
    id: 'stoddard',
    element: 'fire',
    name: 'Stoddard',
    title: 'Censer of the Court',
    rarity: 3,
    stats: { hp: 1750, atk: 175, def: 135, speed: 102 },
    tint: { body: '#e8e4dc', helm: '#c83a2a', weapon: '#c8a03a', shield: '#8a2a20' },
    sprite: {
      displayH: 98,
      strips: {
        idle: { src: 'assets/heroes/phoenixcourt/Stoddardidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'swing_the_censer', name: 'Swing the Censer',
        icon: 'assets/icons/fc823.png',
        description: 'Coals on a chain, out across the line: 60% ATK to ALL enemies, with ' +
          'a 50% chance each to set them burning for 15% ATK a turn over 2 turns.',
        cooldown: 0, targeting: 'all-enemies', animation: 'idle', impact: 'strike',
        effects: [
          { type: 'damage', mult: 0.6 },
          { type: 'dot', pct: 0.15, turns: 2, chance: 0.5, flavor: 'burn' },
        ],
        levelUps: [
          { debuffChance: 0.2 },
          { debuffChance: 0.2 },
          { debuffChance: 0.1 },
          { debuffPower: 0.05 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'incense_and_oath', name: 'Incense and Oath',
        icon: 'assets/icons/fc1113.png',
        description: 'The smoke settles on his own side: ALL allies gain 12% ATK for 3 ' +
          'turns, and 3% more for every burning enemy.',
        cooldown: 5, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'buff', stat: 'atk', mult: 1.12, perBurn: 0.03, turns: 3 }],
        levelUps: [
          { buffPower: 0.05 },
          { perBurn: 0.01 },
          { duration: 1 },
          { buffPower: 0.05 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'last_rites', name: 'Last Rites',
        icon: 'assets/icons/fc1073.png',
        description: 'Read over the whole court at once: heal ALL allies for 12% of ' +
          "Stoddard's max HP, and 3% more for every burning enemy.",
        cooldown: 7, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'healHpPct', pct: 0.12, perBurn: 0.03 }],
        levelUps: [
          { heal: 0.05 },
          { heal: 0.05 },
          { perBurn: 0.01 },
          { heal: 0.05 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'The Smoke Carries',
      icon: 'assets/icons/fc866.png',
      description: 'Gains 5% action bar whenever an enemy catches fire.',
      hooks: { onBurnLit: 0.05 },
    },
    positional: POSITIONALS.censer_swing,
  },

  stella: {
    id: 'stella',
    element: 'fire',
    name: 'Stella',
    title: 'Keeper of the Coal',
    rarity: 2,
    stats: { hp: 1850, atk: 110, def: 140, speed: 100 },
    tint: { body: '#d8c8b0', helm: '#c8a03a', weapon: '#e8903a', shield: '#8a5a3a' },
    sprite: {
      displayH: 84, // a small round bird holding something enormous
      strips: {
        idle: { src: 'assets/heroes/phoenixcourt/stellaidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'warm_the_coal', name: 'Warm the Coal',
        icon: 'assets/icons/fc1041.png',
        description: "Hold it out to whoever needs it: heal one ally for 18% of Stella's " +
          'max HP, and 3% more for every burning enemy.',
        cooldown: 0, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'healHpPct', pct: 0.18, perBurn: 0.03 }],
        levelUps: [
          { heal: 0.05 },
          { heal: 0.05 },
          { heal: 0.05 },
          { perBurn: 0.01 },
          { heal: 0.05 },
        ],
      },
      {
        id: 'bank_the_fire', name: 'Bank the Fire',
        icon: 'assets/icons/fc1073.png',
        description: 'Set it down where the whole court can feel it: ALL allies recover ' +
          "5% of Stella's max HP at the start of each of their turns for 3 turns.",
        cooldown: 5, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'hot', pct: 0.05, turns: 3 }],
        levelUps: [
          { heal: 0.02 },
          { heal: 0.02 },
          { duration: 1 },
          { heal: 0.02 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Never Goes Out',
      icon: 'assets/icons/fc1053.png',
      description: 'The coal outlasts the bird: the first time Stella would fall each ' +
        'battle, she survives on 1 health instead.',
      hooks: { lastEmber: true },
    },
    positional: POSITIONALS.slow_simmer,
  },

  sarena: {
    id: 'sarena',
    element: 'fire',
    name: 'Sarena',
    title: 'Fanbearer of the Court',
    rarity: 4,
    // Promoted from 2-star, which is a change of KIT rather than of
    // numbers: js/data/balance.js holds every hero to the same power
    // budget whatever their stars, so what four stars buys her is a
    // third skill, a higher level ceiling and worse summon odds -- not
    // a bigger statline.
    stats: { hp: 1500, atk: 130, def: 120, speed: 112 },
    tint: { body: '#e8e4dc', helm: '#c83a2a', weapon: '#e8903a', shield: '#c8a03a' },
    sprite: {
      displayH: 92,
      strips: {
        idle: { src: 'assets/heroes/phoenixcourt/Sarenaidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'open_the_fans', name: 'Open the Fans',
        icon: 'assets/icons/fc1113.png',
        description: 'One fan turned toward a single bird: that ally gains 15% ATK for 2 ' +
          'turns, and 3% more for every burning enemy.',
        cooldown: 0, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'buff', stat: 'atk', mult: 1.15, perBurn: 0.03, turns: 2 }],
        levelUps: [
          { buffPower: 0.05 },
          { buffPower: 0.05 },
          { perBurn: 0.01 },
          { duration: 1 },
          { buffPower: 0.05 },
        ],
      },
      {
        id: 'both_fans_wide', name: 'Both Fans Wide',
        icon: 'assets/icons/fc866.png',
        description: 'Both fans, both wings, the whole court: ALL allies gain 15% action ' +
          'bar and 10% SPD for 3 turns.',
        cooldown: 5, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [
          { type: 'turnMeter', amount: 0.15 },
          { type: 'buff', stat: 'speed', mult: 1.10, turns: 3 },
        ],
        levelUps: [
          { meter: 0.03 },
          { buffPower: 0.05 },
          { duration: 1 },
          { meter: 0.03 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'the_long_figure', name: 'The Long Figure',
        icon: 'assets/icons/fc1053.png',
        description: 'The turn the whole court waits for: ALL allies gain 25% Crit Damage ' +
          'for 3 turns, and 5% more for every burning enemy.',
        cooldown: 7, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        // Crit DAMAGE, team-wide, which nothing else on the roster hands
        // out -- Artur gives it to one ally at a time and Polo gives the
        // team crit CHANCE. The two stack into the same swing without
        // either being a copy of the other.
        effects: [{ type: 'buff', stat: 'critDamage', add: 0.25, perBurn: 0.05, turns: 3 }],
        levelUps: [
          { buffPower: 0.05 },
          { buffPower: 0.05 },
          { perBurn: 0.01 },
          { buffPower: 0.05 },
          { duration: 1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Draught',
      icon: 'assets/icons/fc1066.png',
      description: 'Fans feed a fire: burns on enemies tick 15% harder while Sarena stands.',
      hooks: { dotBoostAdd: 0.15 },
    },
    positional: POSITIONALS.fanfare,
  },

  orri: {
    id: 'orri',
    element: 'fire',
    name: 'Orri',
    title: 'Archivist of the Court',
    rarity: 2,
    stats: { hp: 1600, atk: 120, def: 145, speed: 104 },
    tint: { body: '#e8e8e4', helm: '#4a3a5a', weapon: '#c8a03a', shield: '#8a2a20' },
    sprite: {
      displayH: 92,
      strips: {
        idle: { src: 'assets/heroes/phoenixcourt/Orridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'read_it_back', name: 'Read It Back',
        icon: 'assets/icons/fc1050.png',
        description: 'Everything is written down: lift the two oldest hexes from one ally ' +
          'and give them 20% Resistance for 3 turns.',
        cooldown: 0, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        effects: [
          { type: 'cleanse', count: 2 },
          { type: 'buff', stat: 'resistance', add: 0.20, turns: 3 },
        ],
        levelUps: [
          { buffPower: 0.05 },
          { cleanseCount: 1 },
          { buffPower: 0.05 },
          { duration: 1 },
          { buffPower: 0.05 },
        ],
      },
      {
        id: 'the_standing_order', name: 'The Standing Order',
        icon: 'assets/icons/fc1117.png',
        description: 'Enter it into the record: every blessing already on the court gains ' +
          '2 turns.',
        cooldown: 5, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'extendBuffs', turns: 2 }],
        levelUps: [
          { duration: 1 },
          { duration: 1 },
          { duration: 1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Marginalia',
      icon: 'assets/icons/fc1041.png',
      description: 'A note in the margin outlives the page: the blessings Orri hands out ' +
        'cannot be stripped away.',
      hooks: { unstrippableBuffs: true },
    },
    positional: POSITIONALS.still_air,
  },

  chirp: {
    id: 'chirp',
    element: 'fire',
    name: 'Chirp',
    title: 'Taper of the Court',
    rarity: 1,
    stats: { hp: 950, atk: 130, def: 95, speed: 122 },
    tint: { body: '#e88a3a', helm: '#c83a2a', weapon: '#e8c83a', shield: '#3a8a5a' },
    sprite: {
      displayH: 66, // the smallest bird on the roster, by a distance
      strips: {
        idle: { src: 'assets/heroes/phoenixcourt/chirpidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    // ONE skill, cooldown-free: a 1-star is a character, not a kit.
    abilities: [
      {
        id: 'taper', name: 'Taper',
        icon: 'assets/icons/fc866.png',
        description: 'Touch the quill to somebody and light them up: one ally gains 12% ' +
          'ATK for 2 turns, and 5% more for every burning enemy.',
        cooldown: 0, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'buff', stat: 'atk', mult: 1.12, perBurn: 0.05, turns: 2 }],
        levelUps: [
          { buffPower: 0.05 },
          { perBurn: 0.01 },
          { duration: 1 },
          { buffPower: 0.05 },
          { perBurn: 0.01 },
        ],
      },
    ],
    passive: {
      name: 'Never Lands',
      icon: 'assets/icons/fc1062.png',
      description: 'Nothing that small holds still: gains 8% action bar whenever an ally ' +
        'is blessed.',
      hooks: {
        onAllyBuffed(unit, { receiver }) {
          if (!unit.alive || receiver === unit) return null;
          unit.turnMeter += CONFIG.TURN_METER_MAX * 0.08;
          return { floats: [{ target: unit, text: '▲', color: '#e8c83a' }] };
        },
      },
    },
    positional: POSITIONALS.hoverpoint,
  },

  // ---- Razorwings ---------------------------------------------------------

  // The bottom of the sect and the first bird into it. A stooping
  // falcon: fastest thing on the field, and made of very little.
  tervan: {
    id: 'tervan',
    element: 'wind',
    name: 'Tervan',
    title: 'Stoop of the Razorwings',
    rarity: 1,
    // Ratios only; js/data/balance.js scales the three combat stats to
    // the shared budget for the shelf and leaves speed alone. Speed is
    // therefore the one number here that is really a design choice, and
    // his is the highest on the roster: the sect's whole thesis is that
    // being first is worth something, and he is the cheapest way to buy
    // it.
    stats: { hp: 860, atk: 215, def: 80, speed: 136 },
    tint: { body: '#8a6a4a', helm: '#2f6f4a', weapon: '#c8ccd4', shield: '#e8d8a8' },
    sprite: {
      displayH: 72, // small, and most of what you see is wingspan
      strips: {
        idle: { src: 'assets/heroes/razorwings/tervanidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    // ONE skill, and it has to be cooldown-free: a 1-star with a
    // cooldown would spend whole turns with nothing to press. The
    // contract test in data.test.js holds both halves of that.
    abilities: [
      {
        id: 'stoop', name: 'Stoop',
        icon: 'assets/icons/fc819.png',
        // 155%, not the 105% he shipped with. The bench put him at 0.24x
        // his archetype's median -- a quarter of the next worst front
        // DPS -- because a single-target basic at 7v7 does a third of
        // the work a row sweep does, and Jack, the other 1-star in the
        // bucket, sweeps. Focus fire has to be paid for in size or it
        // is simply less damage.
        description: 'Fold the wings and fall: 155% ATK to one enemy.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.55 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
        ],
      },
    ],
    passive: {
      name: 'Windshear',
      icon: 'assets/icons/fc1062.png',
      // Speed spent as damage, and deliberately NOT through
      // damageDealtMult: that is the channel Crosswind (wind's own 3pc)
      // already pays into off the same stat, and a second helping there
      // would just be the party bonus twice. Armour blindness is its
      // own channel, so this reads as a different thing on the sheet as
      // well as in the maths.
      description: 'Nothing slow gets its guard up in time: Tervan ignores 15% of the DEF ' +
        'of any enemy slower than he is.',
      hooks: {
        defIgnoreAdd(unit, target) {
          if (!unit || !target) return 0;
          return unit.effectiveStat('speed') > target.effectiveStat('speed') ? 0.15 : 0;
        },
      },
    },
    // Ryn's hex, and it was Reckless Charge until the bench: +20%
    // dealt for +10% taken is a bad trade for the frailest body in the
    // game, and he was taking more damage per second than anything
    // else in his bucket while holding the lowest effective HP in it.
    // Speed costs him nothing, feeds his own armour blindness, and
    // feeds both of the sect's damage tiers.
    positional: POSITIONALS.headwind,
  },

  // The top of the sect: a gatekeeper who does not chase anything down.
  // He opens a hole in the field, drops whoever is standing there
  // through it, and shoots what comes out the other side dizzy.
  //
  // Displacement is not new -- Wren yanks a caster into the open and
  // Tumble spins a whole formation -- so the point of Nehru is NOT that
  // he moves people. Both of those are Whisperchime, and both move
  // people for position. Nehru moves them for SPEED: a fighter who has
  // just been through a gate is reeling, and a reeling fighter is
  // exactly what every Razorwing tier is paid to stand in front of. He
  // manufactures the sect's condition rather than taking a bigger cut
  // of it, which is the same shape Tumble, Lenore and Hallow take with
  // their own sects.
  nehru: {
    id: 'nehru',
    element: 'wind',
    name: 'Nehru',
    title: 'Gatekeeper of the Razorwings',
    rarity: 5,
    // A caster's build: the damage and the speed, none of the armour.
    // Fast for a 5-star, and deliberately still behind Tervan -- the
    // 1-star keeps the roster's speed crown.
    stats: { hp: 1090, atk: 268, def: 74, speed: 120 },
    tint: { body: '#e8e4d8', helm: '#2f6f4a', weapon: '#5fd8c8', shield: '#c8a83a' },
    sprite: {
      displayH: 98, // he stands tall, and the staff stands taller
      strips: {
        idle: { src: 'assets/heroes/razorwings/nehruidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'nehru_riftshot', name: 'Riftshot',
        icon: 'assets/icons/fc823.png',
        description: 'A bolt that arrives before the sound does: 115% ATK to one enemy.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.15 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'nehru_waygate', name: 'Waygate',
        icon: 'assets/icons/fc1142.png',
        // The swap is Wren's mechanic; what Nehru does WITH it is not.
        // She reaches past a wall to expose the caster behind it. He
        // throws whoever is in front of him out the far side of the
        // field and they come out of it dizzy, which is the half the
        // sect cares about.
        description: 'Open the gate under one enemy: 120% ATK, they trade hexes with ' +
          'whoever stands level with them, and they come out reeling — 25% less SPD ' +
          'for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [
          { type: 'damage', mult: 1.20 },
          { type: 'swapRank' },
          { type: 'debuff', stat: 'speed', mult: 0.75, turns: 2 },
        ],
        // Six rungs is what slot 2 allows, and a cooldown skill buys
        // exactly two turns back. No duration rung: `duration` lengthens
        // friendly timers only, and lengthening a hex has no ladder key
        // at all -- the severity rungs are what deepen this one.
        levelUps: [
          { mult: 0.1 },
          { debuffPower: 0.05 },
          { mult: 0.1 },
          { debuffPower: 0.05 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'nehru_vanishing_point', name: 'Vanishing Point',
        icon: 'assets/icons/fc1272.png',
        // Reads the target's HEX rather than whether they are standing
        // outside it: "+damage to the displaced" is the Whisperchime
        // 4pc's line, and this sect does not need a second printing of
        // it. Keyed to the back row it becomes half of a combination
        // instead -- gate their front rank into the back, then put this
        // through them -- and Far Gate pays on the same reading, so his
        // hex and his finisher want the same thing.
        description: 'Everything he has, into one hole in the air: 250% ATK to one ' +
          'enemy, and 50% more if they are standing on a BACK hex.',
        cooldown: 7, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [
          { type: 'damage', mult: 2.5,
            bonusPosition: { position: POSITION.BACK, mult: 1.5 } },
        ],
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
      name: 'Displacement',
      icon: 'assets/icons/fc1066.png',
      // The sect's currency, manufactured. Overtake and Terminal
      // Velocity are both paid off the gap between a Razorwing and
      // whoever is in front of them, and every other bird in the sect
      // can only widen that gap from its own end. Nehru widens it from
      // the other end, for everybody.
      //
      // Contested like any other hex rather than landing free: an
      // always-on party-wide speed cut would make the sect's two damage
      // tiers unconditional against everything with a pulse, and a boss
      // carries 50% resistance precisely so that a rider like this has
      // to earn it.
      description: 'The air does not quite close behind him: enemies Nehru damages lose ' +
        '10% SPD for 2 turns.',
      hooks: {
        onDealtDamage(unit, { target, battle } = {}) {
          if (!unit.alive || !target || !target.alive) return null;
          if (target.team === unit.team) return null;
          if (!Abilities.takeLands(unit, target)) return null;
          target.addStatusEffect({ kind: 'debuff', stat: 'speed', mult: 0.90,
            turns: 2, source: unit });
          if (battle && battle.addFloatingText) {
            battle.addFloatingText(target, 'SPD \u25bc', '#8ee8ff');
          }
          return null;
        },
      },
    },
    positional: POSITIONALS.far_gate,
  },

  // The sect's sweeper, and the third different answer to the same
  // question. Tervan spends a speed lead as armour blindness and Nehru
  // manufactures the lead by slowing what he throws through a gate;
  // Cirrus does not convert his tempo at all -- he takes theirs. A bar
  // knocked backwards is a turn the enemy does not get and a Razorwing
  // does, which is the only place in the sect that speed is answered
  // with speed rather than with damage.
  cirrus: {
    id: 'cirrus',
    element: 'wind',
    name: 'Cirrus',
    title: 'Stormwright of the Razorwings',
    rarity: 4,
    stats: { hp: 1180, atk: 205, def: 88, speed: 124 },
    tint: { body: '#e8e4d8', helm: '#2f6f4a', weapon: '#5fd8c8', shield: '#c8a83a' },
    sprite: {
      displayH: 92,
      strips: {
        idle: { src: 'assets/heroes/razorwings/cirrusidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cirrus_whorl', name: 'Whorl',
        icon: 'assets/icons/fc823.png',
        description: 'A pocket of turning air, opened under one enemy: 110% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.10 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'cirrus_cross_vortex', name: 'Cross Vortex',
        icon: 'assets/icons/fc1142.png',
        description: 'Two fronts meeting over the whole field: 75% ATK to every enemy.',
        cooldown: 4, targeting: 'all-enemies', animation: 'idle', impact: 'slash',
        effects: [{ type: 'damage', mult: 0.75 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'cirrus_downdraught', name: 'Downdraught',
        icon: 'assets/icons/fc1272.png',
        description: 'The whole sky falls at once: 120% ATK to every enemy.',
        cooldown: 7, targeting: 'all-enemies', animation: 'idle', impact: 'slam',
        effects: [{ type: 'damage', mult: 1.20 }],
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
      name: 'Backdraft',
      icon: 'assets/icons/fc1062.png',
      // Deliberately NOT damageDealtMult. Overtake and Terminal
      // Velocity both multiply into that channel already, and a third
      // helping on the same axis -- however differently it reads on the
      // card -- would take a fielded sect from 1.625 to over 2x against
      // anything slow. The action bar is the one resource the sect
      // cares about that none of its damage tiers touch.
      //
      // The chance gate is what keeps it honest on a sweep: Cross
      // Vortex catches the whole enemy team, and a certainty here would
      // knock every bar on the field backwards every fourth turn. The
      // drain itself is contested and meterGuard-aware like any other,
      // because it runs through drainMeter with everything else.
      description: 'The air closes badly behind him: every hit has a 20% chance to knock ' +
        "20% off the victim's action bar.",
      hooks: { apDrainAdd: 0.20 },
    },
    // Hallow's hex, and it fits the second bird to wear it as well as
    // the first: two of his three skills catch the whole field.
    positional: POSITIONALS.stormglass,
  },

  // The sect's blesser, and the one bird who welds its two halves
  // together. Everything else in the Razorwings turns speed into
  // damage on the swing; Kiri turns it into ATK before the swing ever
  // happens, which is the only place in the sect where being fast is
  // worth something to somebody ELSE.
  //
  // Deliberately not the meter support: Wanda already pipes the side
  // and hands the whole crew a push, and a second one of those is a
  // recolour with different feathers. Kiri never touches the action
  // bar.
  kiri: {
    id: 'kiri',
    element: 'wind',
    name: 'Kiri',
    title: 'Hoverwing of the Razorwings',
    rarity: 2,
    // A hummingbird's build: almost nothing to her, and second only to
    // Tervan on the whole roster for speed.
    stats: { hp: 1100, atk: 96, def: 96, speed: 130 },
    tint: { body: '#2f8f7a', helm: '#e8e4d8', weapon: '#c8a83a', shield: '#5fd8c8' },
    sprite: {
      displayH: 70, // tiny -- but Chirp keeps the smallest-bird title
      strips: {
        idle: { src: 'assets/heroes/razorwings/kiriidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    // TWO skills: a 2-star gets a second button and no third.
    abilities: [
      {
        id: 'kiri_pinwheel', name: 'Pinwheel',
        icon: 'assets/icons/fc866.png',
        // Chirp's Taper is the nearest thing on the roster -- a cd0
        // single-ally ATK blessing -- and the difference is what the
        // rider reads. Hers grows with the fires already lit; this one
        // grows with the wing receiving it, which is Kiri's passive
        // doing the work rather than the skill.
        description: 'Hold the vane up and let it spin: one ally gains 15% ATK for 2 turns.',
        cooldown: 0, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'buff', stat: 'atk', mult: 1.15, turns: 2 }],
        levelUps: [
          { buffPower: 0.05 },
          { buffPower: 0.05 },
          { duration: 1 },
          { buffPower: 0.05 },
          { buffPower: 0.05 },
        ],
      },
      {
        id: 'kiri_thermal', name: 'Thermal',
        icon: 'assets/icons/fc1062.png',
        description: 'The whole flight finds the rising air: every ally gains 10% ATK ' +
          'for 2 turns.',
        cooldown: 5, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'buff', stat: 'atk', mult: 1.10, turns: 2 }],
        levelUps: [
          { buffPower: 0.05 },
          { buffPower: 0.05 },
          { duration: 1 },
          { buffPower: 0.05 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Hover',
      icon: 'assets/icons/fc1066.png',
      // The sect's two halves, welded. Every Razorwing tier is paid off
      // the gap between an attacker and their mark, which means a fast
      // wing is already worth more per swing -- and this makes them
      // worth more per BLESSING too, on a channel none of the tiers
      // touch. Read off the receiver rather than off Kiri, so she is
      // rewarded for buffing the right bird rather than for being fast
      // herself; her own speed never enters it.
      //
      // Capped, because the rungs are cheap: five of them at +5% is
      // +25% on top of a blessing that already ladders.
      description: "Kiri reads the air around whoever she blesses: her buffs are worth " +
        '5% more for every 10 SPD they hold above 100, up to 25% more.',
      hooks: {
        buffPowerAdd(unit, receiver) {
          if (!receiver || !receiver.effectiveStat) return 0;
          const over = receiver.effectiveStat('speed') - 100;
          if (over <= 0) return 0;
          return Math.min(0.25, Math.floor(over / 10) * 0.05);
        },
      },
    },
    positional: POSITIONALS.standard_bearer,
  },

  // The sect's wall, and the answer to a question the Razorwings had
  // not had to face yet: what a TANK does in an order whose whole
  // thesis is being faster and hitting harder.
  //
  // The answer is that he tanks on the sect's own currency. Every
  // Razorwing tier is paid off the gap between an attacker and their
  // mark; Strix reads the same gap from the other side of the field and
  // shelters the flight from anything he can outrun. Nothing slow gets
  // past him -- and something faster than him goes straight through,
  // which is the price and the reason he is not simply a wall.
  //
  // Not the dodge tank: Oak already owns that, hex and riposte
  // together. Not a second Snub the Cable either. This is the fifth
  // different thing the sect does with a speed comparison, after armour
  // blindness, a blessing, a drained bar and a gate.
  strix: {
    id: 'strix',
    element: 'wind',
    name: 'Strix',
    title: 'Bulwark of the Razorwings',
    rarity: 2,
    // The heavy one, and the slowest bird in the sect -- but still
    // quick by the roster's standards, which his own passive requires:
    // a shelter that only stops what it outruns is worth nothing on a
    // body that outruns nobody.
    stats: { hp: 1620, atk: 82, def: 128, speed: 112 },
    tint: { body: '#8a7a5a', helm: '#2f6f4a', weapon: '#c8a83a', shield: '#e8e4d8' },
    sprite: {
      displayH: 96, // wings out, planted -- he takes up the whole hex
      strips: {
        idle: { src: 'assets/heroes/razorwings/strixidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'strix_mantle', name: 'Mantle',
        icon: 'assets/icons/fc819.png',
        description: 'Wings out and forward: 70% ATK to the enemy FRONT row.',
        cooldown: 0, targeting: 'front-enemies', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 0.70 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'strix_headwind', name: 'Headwind',
        icon: 'assets/icons/fc1272.png',
        // A tank cooldown that is also the sect's engine. Slowing the
        // whole enemy line widens the gap every Razorwing tier is paid
        // off, deepens his own shelter, and is the ordinary speed hex
        // rather than a new plate invented to mean the same thing.
        description: 'Set against the whole line: a 50% chance each to strip 20% SPD ' +
          'off every enemy for 2 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'idle', impact: 'slam',
        effects: [{ type: 'debuff', stat: 'speed', mult: 0.80, turns: 2, chance: 0.5 }],
        levelUps: [
          { debuffChance: 0.2 },
          { debuffChance: 0.2 },
          { debuffChance: 0.1 },
          { debuffPower: 0.05 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Nothing Slow Gets Past',
      icon: 'assets/icons/fc1062.png',
      // Cover rather than a ward: the reduction is HIS, so the damage
      // meter credits him for it instead of it vanishing into the
      // defences of whichever bird was not hit.
      description: 'While Strix stands, every ally takes 10% less damage from enemies ' +
        'slower than he is.',
      hooks: {
        coverMult(unit, victim, attacker) {
          if (!unit.alive || !attacker || !attacker.effectiveStat) return 1;
          if (attacker.team === unit.team) return 1;
          return unit.effectiveStat('speed') > attacker.effectiveStat('speed')
            ? 0.90 : 1;
        },
      },
    },
    // Talon's hex, and it reads the same on a bird who is holding the
    // line for a flight of casters: anyone who swings at him pays a
    // slice of their own turn for it.
    positional: POSITIONALS.set_fast,
  },

  // The still thing in a sect that never stops. Everything else in the
  // Razorwings is priced off motion; Calima stands in the middle of the
  // flower and raises haze, and what the haze is for is the one thing
  // that beats the whole order -- being slowed.
  //
  // The sect's warder rather than its healer. Ilyra is already the wind
  // 3-star mender, down to a skill called Following Wind, and a second
  // one of those is a recolour with longer legs. Absorb is a different
  // mechanic from a mend and almost nobody on the roster casts it: six
  // abilities in the whole game before this one.
  calima: {
    id: 'calima',
    element: 'wind',
    name: 'Calima',
    title: 'Haze of the Razorwings',
    rarity: 3,
    stats: { hp: 1420, atk: 104, def: 112, speed: 118 },
    tint: { body: '#e8a8b8', helm: '#2f6f4a', weapon: '#5fd8c8', shield: '#e8e4d8' },
    sprite: {
      displayH: 94, // long legs, and the staff stands taller again
      strips: {
        idle: { src: 'assets/heroes/razorwings/calimaidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'calima_haze', name: 'Haze',
        icon: 'assets/icons/fc866.png',
        description: "Warm air off the shallows: one ally gains a ward worth 14% of " +
          "Calima's max HP for 2 turns.",
        cooldown: 0, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'shield', pct: 0.14, turns: 2 }],
        levelUps: [
          { heal: 0.02 },
          { heal: 0.02 },
          { duration: 1 },
          { heal: 0.02 },
          { heal: 0.02 },
        ],
      },
      {
        id: 'calima_standing_water', name: 'Standing Water',
        icon: 'assets/icons/fc1062.png',
        description: "The whole flat goes still: every ally gains a ward worth 7% of " +
          "Calima's max HP, and 2% more each for every ally sharing it, for 3 turns.",
        cooldown: 5, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'shield', pct: 0.07, perTarget: 0.02, turns: 3 }],
        levelUps: [
          { heal: 0.02 },
          { perTarget: 0.01 },
          { heal: 0.02 },
          { perTarget: 0.01 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'calima_clearing', name: 'Clearing',
        icon: 'assets/icons/fc1272.png',
        description: 'The haze lifts and takes something with it: every ally recovers ' +
          '12% of their max HP and sheds one affliction.',
        cooldown: 7, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [
          { type: 'healHpPct', pct: 0.12 },
          { type: 'cleanse', count: 1 },
        ],
        levelUps: [
          { heal: 0.02 },
          { heal: 0.02 },
          { cleanseCount: 1 },
          { heal: 0.02 },
          { heal: 0.02 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Slack Water',
      icon: 'assets/icons/fc1066.png',
      // The sect's one real weakness, answered. Every Razorwing tier is
      // priced off outrunning the other side, so the counter to the
      // whole order is a speed hex -- and a bird carrying Calima's haze
      // simply cannot be given one. Tied to the ward rather than to her
      // standing there, so it is paid for cast by cast and runs out
      // when the ward does.
      description: 'Nothing settles on still water: an ally carrying one of ' +
        "Calima's wards cannot be slowed.",
      hooks: { slowGuard: true },
    },
    // Peck's hex, and it is worth more here than it is to him: a
    // Razorwing party takes its turns quickly, so a ward measured in
    // TURNS burns down faster in this flight than in any other, and the
    // extra one is the difference between a ward that covers a round
    // and one that covers a swing.
    positional: POSITIONALS.slow_simmer,
  },

  // The flight's apothecary, and the answer to a problem the Razorwings
  // make for themselves. A sect built to take more turns than anybody
  // else runs into its own COOLDOWNS more often than anybody else: the
  // faster the flight flies, the more of its turns arrive with the good
  // buttons still cooling. Mendral is the only bird who does anything
  // about that, and the drip runs quicker here than it would in any
  // slower order, because it is paid out on HIS turns and his come
  // round often.
  //
  // Cooldowns are all but untouched elsewhere -- one skill on Evelune
  // and a Nightflower tier, and nothing at all on the gear channel --
  // so this is a whole axis the sect gets to own rather than a fourth
  // reading of the speed comparison.
  mendral: {
    id: 'mendral',
    element: 'wind',
    name: 'Mendral',
    title: 'Apothecary of the Razorwings',
    rarity: 3,
    stats: { hp: 1380, atk: 110, def: 104, speed: 122 },
    tint: { body: '#e8b0c0', helm: '#2f6f4a', weapon: '#c8a83a', shield: '#e8e4d8' },
    sprite: {
      displayH: 94,
      strips: {
        idle: { src: 'assets/heroes/razorwings/Mendralidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'mendral_spoonfeed', name: 'Spoonfeed',
        icon: 'assets/icons/fc866.png',
        // Priced off the PATIENT rather than off him, which is what the
        // bill is for: a big bird gets a big dose. It is also what keeps
        // this from being Ilyra's Clear Sky with a longer neck -- hers
        // is measured out of her own pool.
        description: "A measured dose off the end of the bill: one ally recovers 14% of " +
          'their OWN max HP.',
        cooldown: 0, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'healHpPct', targetPct: 0.14 }],
        levelUps: [
          { heal: 0.02 },
          { heal: 0.02 },
          { heal: 0.02 },
          { heal: 0.02 },
          { heal: 0.02 },
        ],
      },
      {
        id: 'mendral_green_vial', name: 'Green Vial',
        icon: 'assets/icons/fc1062.png',
        // Deeper than Evelune's Play It Again and narrower: she hands
        // the whole room one turn back, he hands one bird two.
        description: 'Whatever is in the green one: one ally gets 2 turns back on every ' +
          'cooldown they are sitting on.',
        cooldown: 5, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'cooldownReduce', turns: 2 }],
        levelUps: [
          { refund: 1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'mendral_long_draught', name: 'Long Draught',
        icon: 'assets/icons/fc1272.png',
        description: 'Something for everyone, and it keeps working: every ally recovers ' +
          "6% of Mendral's max HP a turn for 3 turns.",
        cooldown: 7, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'hot', pct: 0.06, turns: 3 }],
        levelUps: [
          { heal: 0.02 },
          { heal: 0.02 },
          { duration: 1 },
          { heal: 0.02 },
          { heal: 0.02 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'The Standing Dose',
      icon: 'assets/icons/fc1066.png',
      // Paid out on HIS turn, which is the sect link: a Razorwing party
      // comes round often, so the drip is faster in this flight than it
      // would be anywhere else. Longest cooldown first, so it always
      // lands where the wait is worst rather than being spent on
      // somebody a turn from ready anyway.
      description: "Never without something in the bag: at the start of each of Mendral's " +
        'turns, the ally sitting on the longest cooldown gets a turn of it back.',
      hooks: {
        onTurnStart(unit, battle) {
          if (!battle || !unit.alive) return null;
          let worst = null;
          let ability = null;
          for (const ally of battle.livingUnits(unit.team)) {
            for (const a of (ally.abilities || [])) {
              if (a.cooldownRemaining > 0 &&
                  (!ability || a.cooldownRemaining > ability.cooldownRemaining)) {
                ability = a; worst = ally;
              }
            }
          }
          if (!ability) return null;
          ability.cooldownRemaining -= 1;
          return { floats: [{ target: worst, text: '\u2696 -1 CD', color: '#8ee8a8' }] };
        },
      },
    },
    positional: POSITIONALS.field_medic,
  },

  // The sect's other wall, and deliberately the opposite of the first
  // one. Strix prevents: he reads the speed gap from the defensive side
  // and takes damage off the flight before it lands. Balmor prevents
  // nothing. He is a pelican, and what a pelican has is a BILL -- so he
  // takes the blow, keeps it, and hands it back later at somebody
  // else's expense.
  //
  // Nothing else on the roster banks damage. The nearest thing is
  // Lucian's forge heat, which is also a per-battle counter living on
  // the caster and also only means anything next to the kit that fills
  // it; the difference is that his is fed by the fight going well and
  // Balmor's is fed by the fight going badly.
  balmor: {
    id: 'balmor',
    element: 'wind',
    name: 'Balmor',
    title: 'Bill of the Razorwings',
    rarity: 3,
    // Built to be hit: the heaviest bird in the sect, and the second
    // slowest. He is the one Razorwing who does not especially mind
    // being outrun, because nothing he does is priced off the gap.
    stats: { hp: 1980, atk: 94, def: 148, speed: 106 },
    tint: { body: '#e8e4d8', helm: '#2f6f4a', weapon: '#e8903a', shield: '#c8a83a' },
    sprite: {
      displayH: 98,
      strips: {
        idle: { src: 'assets/heroes/razorwings/Balmoridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'balmor_bill_slap', name: 'Bill Slap',
        icon: 'assets/icons/fc819.png',
        description: 'A yard of beak, swung flat: 90% ATK to one enemy.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 0.90 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'balmor_broad_shadow', name: 'Broad Shadow',
        icon: 'assets/icons/fc1062.png',
        // Spread over the front rank rather than hoarded: Bo keeps his
        // own hide and Talon covers the whole crew, so this one takes
        // the middle -- and it is in real tension with the bill, since
        // damage he does not take is damage he does not get to keep.
        description: 'Wings out over the whole rank: front-row allies take 15% less ' +
          'damage for 2 turns.',
        cooldown: 5, targeting: 'front-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'buff', stat: 'damageTaken', mult: 0.85, turns: 2 }],
        levelUps: [
          { buffPower: 0.05 },
          { duration: 1 },
          { buffPower: 0.05 },
          { buffPower: 0.05 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'balmor_tip_the_bill', name: 'Tip the Bill',
        icon: 'assets/icons/fc1272.png',
        description: 'Upend the whole bill over one enemy: everything Balmor has been ' +
          'given so far, given back as a single blow.',
        cooldown: 6, targeting: 'enemy', animation: 'idle', impact: 'slam',
        effects: [{ type: 'spendPouch' }],
        levelUps: [
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Catchall',
      icon: 'assets/icons/fc1066.png',
      // Capped against his own POOL, not his ATK. The first draft
      // measured the bill in ATK the way a skill multiplier is measured
      // and it was nonsense: a tank's ATK is small precisely because he
      // is a tank, so 250% of it came to 528 while a single ordinary
      // blow landed on him for 2521. The bill was full after one hit
      // and "keeps a share of every blow" meant nothing.
      //
      // Health is the scale he actually absorbs on, and it moves with
      // his gear and his stars the way incoming damage does.
      //
      // The RATE is what the bench corrected. Half of every blow into a
      // quarter of his pool took thirteen hits to fill at level 30 and
      // ONE HUNDRED AND SIXTEEN at level 100 -- because his DEF grows
      // with his pool, so each blow is a smaller share of it the
      // further he is invested, and the bill quietly died at endgame
      // while reading fine everywhere I had tested it. The whole blow
      // into an eighth of the pool fills in about a fight at both ends
      // of the curve.
      description: 'Nothing is wasted on a pelican: Balmor keeps every blow he takes in ' +
        'his bill, up to an eighth of his max HP.',
      hooks: {
        onStruck(unit, { amount } = {}) {
          if (!unit.alive || !(amount > 0)) return null;
          const cap = unit.maxHp * 0.125;
          const before = unit.pouch || 0;
          if (before >= cap) return null;
          unit.pouch = Math.min(cap, before + amount);
          return null;
        },
      },
    },
    positional: POSITIONALS.bedrock,
  },

  // The last bird, the senior wall, and the third answer to the same
  // job. Strix PREVENTS -- he reads the speed gap and takes damage off
  // the flight before it lands. Balmor ABSORBS -- he keeps what he is
  // given and hands it back. Brannoc does neither: he PUNISHES, and he
  // is the only one of the three who is worth anything while the enemy
  // is ignoring him, which is the tank's real problem rather than the
  // one tanks are usually built for.
  //
  // Carl, Slick, Toll and Oak all answer being hit themselves. Nobody
  // answers somebody ELSE being hit, and that is the whole difference:
  // the more the other side works around him, the more he charges for
  // it.
  //
  // He also does not restate the sect's thesis, and that is deliberate
  // -- Balmor already broke the pattern. Five conversions of a speed
  // comparison is a sect; seven would be a gimmick.
  brannoc: {
    id: 'brannoc',
    element: 'wind',
    name: 'Brannoc',
    title: 'Standing Line of the Razorwings',
    rarity: 4,
    stats: { hp: 2240, atk: 128, def: 162, speed: 104 },
    tint: { body: '#e8e0c8', helm: '#2f6f4a', weapon: '#c8a83a', shield: '#8a9a5a' },
    sprite: {
      displayH: 102, // the tallest bird in the sect
      strips: {
        idle: { src: 'assets/heroes/razorwings/Brannocidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'brannoc_rake', name: 'Rake',
        icon: 'assets/icons/fc819.png',
        description: 'A long reach across the near hexes: 75% ATK to the enemy front row ' +
          'and their middle.',
        cooldown: 0, targeting: 'front-and-center-enemies', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 0.75 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'brannoc_broken_ground', name: 'Broken Ground',
        icon: 'assets/icons/fc1062.png',
        // The third kind of defence, after Strix's prevention and
        // Balmor's absorption: suppression. Damage stopped at the
        // source rather than at the target.
        description: 'Take the footing out from under the rank: 90% ATK to the enemy ' +
          'front row, with a 50% chance each to cut 25% off their ATK for 2 turns.',
        cooldown: 5, targeting: 'front-enemies', animation: 'idle', impact: 'slam',
        effects: [
          { type: 'damage', mult: 0.90 },
          { type: 'debuff', stat: 'atk', mult: 0.75, turns: 2, chance: 0.5 },
        ],
        levelUps: [
          { debuffChance: 0.2 },
          { debuffChance: 0.2 },
          { debuffChance: 0.1 },
          { mult: 0.1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'brannoc_last_word', name: 'Last Word',
        icon: 'assets/icons/fc1272.png',
        description: 'Everything he has been saving up, into one of them: 220% ATK to a ' +
          'single enemy.',
        cooldown: 7, targeting: 'enemy', animation: 'idle', impact: 'slam',
        effects: [{ type: 'damage', mult: 2.20 }],
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
      name: 'Answer For It',
      icon: 'assets/icons/fc1066.png',
      // Fired inside the retaliation guard the engine already holds
      // open, so an answer can never set off another answer -- two of
      // these on one field would otherwise bounce blows off each other
      // until the stack gave out.
      //
      // The counter is thrown through the ordinary pipe with
      // `assist: false`, because it is his blow and nobody else's
      // setup: an ATK buff on him is his own business, and the meter
      // should read it as damage he dealt rather than splitting it.
      description: 'Go through him and he charges for it: whenever an enemy damages one ' +
        "of Brannoc's allies, he strikes them back for 40% ATK.",
      hooks: {
        onAllyStruck(unit, { ally, attacker, battle } = {}) {
          if (!unit.alive || !attacker || !attacker.alive) return null;
          if (attacker.team === unit.team) return null;
          if (!ally || ally === unit || ally.team !== unit.team) return null;
          Abilities.strike(unit, attacker,
            unit.effectiveStat('atk') * 0.40, { assist: false });
          return { floats: [{ target: attacker, text: '\u21ba', color: '#c8a83a' }] };
        },
      },
    },
    // Florence's hex, and it reads as well on him: the more of him they
    // take, the harder every answer lands.
    positional: POSITIONALS.last_stand,
  },

  // ---- Sunbrood -----------------------------------------------------------

  // The brood's front line, and the only fighter in the game who pays
  // HEALTH for damage. Every swing costs him a slice of his own pool
  // and lands a quarter harder for it, per enemy caught -- so a wide
  // swing is a bigger bill, and a long fight is a bill he cannot settle
  // alone.
  //
  // That is the point of him. Light's own pack sells max HP twice over
  // (Congregation at 2pc, Matins at 4pc), so a Sunbrood who sold a
  // bigger pool would only be handing the party its own element bonus
  // back -- the Flurry problem, which this roster has now met three
  // times. Aurek SPENDS the pool instead, and the two healers the brood
  // is built around are what make the spending survivable. He is the
  // one hero here whose kit does not work without the sect.
  aurek: {
    id: 'aurek',
    element: 'light',
    name: 'Aurek',
    title: 'Reveille of the Sunbrood',
    rarity: 3,
    // A bruiser's split rather than a glass cannon's: the mechanic
    // needs a pool to spend, so the budget goes into health that a
    // pure DPS would have taken as attack.
    stats: { hp: 1520, atk: 178, def: 96, speed: 116 },
    tint: { body: '#e8e0c8', helm: '#e8c84a', weapon: '#f0d878', shield: '#c8a83a' },
    sprite: {
      displayH: 94,
      strips: {
        idle: { src: 'assets/heroes/sunbrood/aurekidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'aurek_sunder', name: 'Sunder',
        icon: 'assets/icons/fc819.png',
        description: 'The mace comes down once, hard: 120% ATK to one enemy.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.20 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'aurek_first_light', name: 'First Light',
        icon: 'assets/icons/fc1062.png',
        description: 'A swing wide enough to catch the whole rank: 85% ATK to the enemy ' +
          'FRONT row. Every one of them is another slice off his own bill.',
        cooldown: 4, targeting: 'front-enemies', animation: 'idle', impact: 'slam',
        effects: [{ type: 'damage', mult: 0.85 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'aurek_break_of_day', name: 'Break of Day',
        icon: 'assets/icons/fc1272.png',
        description: 'Everything at once, on one of them: 240% ATK to a single enemy.',
        cooldown: 7, targeting: 'enemy', animation: 'idle', impact: 'slam',
        effects: [{ type: 'damage', mult: 2.40 }],
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
      name: 'Burn the Wick',
      icon: 'assets/icons/fc1066.png',
      // Nothing else in the game pays health for power. The cost is
      // charged PER ENEMY HIT rather than per cast, so the wide swing
      // is the expensive one and the choice between his skills is a
      // real one; and it can never kill him, because a hero who can
      // lose a fight to his own basic is not a cost, he is a trap.
      description: 'He burns himself to burn brighter: every enemy Aurek hits costs him ' +
        '3% of his max HP, and everything he throws lands 25% harder.',
      hooks: {
        damageDealtMult: () => 1.25,
        onDealtDamage(unit, { target, battle } = {}) {
          if (!unit.alive || !target || target.team === unit.team) return null;
          const cost = Math.round(unit.maxHp * 0.03);
          // Never fatal: floored at a single point of health.
          unit.hp = Math.max(1, unit.hp - cost);
          if (battle && battle.addFloatingText) {
            battle.addFloatingText(unit, `-${cost}`, '#e8c84a');
          }
          return null;
        },
      },
    },
    positional: POSITIONALS.strongman,
  },

  // The brood's shield, and a tank whose output is HEALING. Four
  // passives on the roster answer being struck -- Toll rings the bell,
  // Carl grows on it, Slick oils whoever swung, Balmor banks it -- and
  // not one of them turns it into a mend. Durn does: what the shield
  // catches goes to whoever is worst off, which welds the sect's third
  // pillar to the one job that guarantees a steady supply of it.
  //
  // His two cooldowns spend his POOL rather than growing it, the same
  // rule Aurek follows and for the same reason: light already sells max
  // HP at 2pc and 4pc, so the brood has to be a sect that turns a big
  // pool into something, not one that asks for a bigger one. A tank has
  // the deepest pool on the field, which makes him the natural place to
  // spend it from.
  durn: {
    id: 'durn',
    element: 'light',
    name: 'Durn',
    title: 'Shieldbearer of the Sunbrood',
    rarity: 3,
    // A shield-bearer's split: armour over bulk, where Balmor takes the
    // bulk over the armour. Quick for a wall, and deliberately: 110
    // becomes 121 under the brood's own 2pc, which is the first rung of
    // Wingbeat Mend -- a Sunbrood built slower would hand the sect a
    // tier that pays nothing.
    stats: { hp: 1820, atk: 88, def: 168, speed: 110 },
    tint: { body: '#e8e4d8', helm: '#e8c84a', weapon: '#c8a83a', shield: '#f0d878' },
    sprite: {
      displayH: 96,
      strips: {
        idle: { src: 'assets/heroes/sunbrood/Durnidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'durn_shield_hand', name: 'Shield Hand',
        icon: 'assets/icons/fc819.png',
        // Priced off DEF, not ATK: a shieldbearer hits with the thing he
        // is holding, and it means the stat he actually stacks feeds
        // both halves of him. 0.50 is the bottom of the band the other
        // DEF-scaled cd0 skills sit in (Toll 0.50, Korvid 0.65, Morrow
        // and Talon 0.70, Bit 0.80), which is where a 3-star belongs
        // among five 4-and-5-stars -- and it keeps his output close to
        // what the old 85% ATK produced rather than quietly paying him
        // for the change.
        description: 'The boss of the shield, swung flat: 50% of his DEF to one enemy.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damageDef', mult: 0.50 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'durn_reflect_the_sun', name: 'Reflect the Sun',
        icon: 'assets/icons/fc866.png',
        // Priced off HIS pool, which is the deepest on the field. A
        // tank as the party's reserve rather than its wall.
        description: "Turn the shield face-up and let it catch the light: every ally " +
          "recovers 8% of DURN'S max HP.",
        cooldown: 5, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'healHpPct', pct: 0.08 }],
        levelUps: [
          { heal: 0.02 },
          { heal: 0.02 },
          { heal: 0.02 },
          { heal: 0.02 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'durn_hold_the_line', name: 'Hold the Line',
        icon: 'assets/icons/fc1272.png',
        // The front rank only. A shield covers what is behind IT, not
        // the whole field, and a cd7 that warded seven birds off a
        // tank's pool was most of why he read strong for a 3-star.
        description: "Everyone behind the shield: FRONT-row allies gain a ward worth " +
          "10% of Durn's max HP for 3 turns.",
        cooldown: 7, targeting: 'front-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'shield', pct: 0.10, turns: 3 }],
        levelUps: [
          { heal: 0.02 },
          { heal: 0.02 },
          { duration: 1 },
          { heal: 0.02 },
          { heal: 0.02 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'What the Shield Catches',
      icon: 'assets/icons/fc1066.png',
      // Never himself. He catches for other birds -- a tank who mends
      // his own hide off being hit is a self-sustain engine, and this
      // is meant to be a conversion the party spends rather than one he
      // keeps. It is also why his hex points at the same ally: the
      // wounded one is where everything he does goes.
      description: 'What the shield catches, the brood gets back: every blow Durn takes ' +
        'mends the most-wounded OTHER ally for 15% of it.',
      hooks: {
        onStruck(unit, { amount, battle } = {}) {
          if (!unit.alive || !(amount > 0) || !battle) return null;
          const hurt = battle.livingUnits(unit.team)
            .filter((u) => u !== unit && u.hp < u.maxHp)
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
          if (!hurt) return null;
          const healed = hurt.heal(Math.round(amount * 0.15), unit);
          if (healed <= 0) return null;
          return { floats: [{ target: hurt, text: `+${healed}`, color: '#f0d878' }] };
        },
      },
    },
    // The last positional nobody had claimed, and it reads as though it
    // were written for him: the most-wounded ally, mended off HIS pool,
    // which is the same bird his passive is already looking at.
    positional: POSITIONALS.rallying_banner,
  },
});
