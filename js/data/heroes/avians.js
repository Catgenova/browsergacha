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
        // Same rule as Orien's orb, for the same reason: a bank is only
        // as legible as its card. The readout under the health bar shows
        // how full the bill is DURING a fight; this has to say what the
        // bill is and what fills it before one starts.
        description: 'Upend the whole bill over one enemy: every blow Balmor has taken so ' +
          'far, handed back as one. The bill holds up to an eighth of his max HP — ' +
          'and an empty bill hands back nothing.',
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
      // What the renderer draws under his health bar, and the single
      // place the ceiling is written. The hook below reads it rather
      // than carrying its own copy, so the bar, the cap and the card can
      // never quietly disagree.
      bank: { prop: 'pouch', capPct: 0.125, label: 'BILL', color: '#e8c84a' },
      hooks: {
        onStruck(unit, { amount } = {}) {
          if (!unit.alive || !(amount > 0)) return null;
          const cap = unit.maxHp * Unit.bankOf(unit).capPct;
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

  // The brood's egg, and the bird the whole pack was written to pay.
  // Everything above him multiplies healing -- 10% at 2pc, a rung per
  // 20 SPD at 3pc, 40% more on anyone under half at 4pc -- and a
  // multiplier is worth whatever it is handed, so the sect's 5-star is
  // the one whose job is to be the biggest number to multiply.
  //
  // His mends are priced off the PATIENT's pool, which is the third
  // distinct pricing in a three-bird sect and the only one that reads
  // the light element rather than repeating it. Light hands the whole
  // party a bigger pool at 2pc and again at 4pc; Nemeris is the only
  // hero on the roster who turns a bigger pool into a bigger mend. It
  // does not compound -- a percentage of a pool restores the same
  // FRACTION however deep the pool gets -- it just means nothing the
  // element gives is wasted on him.
  //
  // Only two of his three skills are mends, though, and the middle one
  // is where the sect's arithmetic actually closes: a party-wide speed
  // buff IS a party-wide healing buff, because Wingbeat Mend prices
  // every mend off the caster's speed at the moment it lands. He does
  // not need a third heal. He needs everybody faster while the other
  // two are on cooldown.
  //
  // 128 speed is not decoration. Under the brood's own 2pc it becomes
  // 140.8, which is exactly the second rung of Wingbeat Mend: the sect
  // proving its own thesis on the hero it was built around. +10% (2pc)
  // and +10% (two rungs) is +20% before a target is even wounded, and
  // +60% on one who is.
  nemeris: {
    id: 'nemeris',
    element: 'light',
    name: 'Nemeris',
    title: 'Eggbearer of the Sunbrood',
    rarity: 5,
    // A support statline with the speed spent where the sect spends it.
    // No ATK worth speaking of: not one point of what he does is priced
    // off it.
    stats: { hp: 1750, atk: 96, def: 132, speed: 128 },
    tint: { body: '#f4f0e4', helm: '#e8c84a', weapon: '#c8a83a', shield: '#f8e08a' },
    sprite: {
      displayH: 98,
      strips: {
        idle: { src: 'assets/heroes/sunbrood/nemerisidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'nemeris_sunwarm', name: 'Sunwarm',
        icon: 'assets/icons/fc866.png',
        // 16% where Mendral's cd0 spoonfeed is 14%, which is the whole
        // gap two shelves buys on a slot-one mend.
        description: 'The first warmth of the morning, given to whoever needs it: one ally ' +
          'recovers 16% of their OWN max HP.',
        cooldown: 0, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'healHpPct', targetPct: 0.16 }],
        levelUps: [
          { heal: 0.02 },
          { heal: 0.02 },
          { heal: 0.02 },
          { heal: 0.02 },
          { heal: 0.02 },
        ],
      },
      {
        id: 'nemeris_up_with_the_sun', name: 'Up With the Sun',
        icon: 'assets/icons/fc1073.png',
        // The cash-out, and it is a speed buff rather than a third mend
        // for one reason: Wingbeat Mend reads effectiveStat('speed')
        // every time anybody casts, so a party-wide lift to the brood's
        // FIRST pillar is a party-wide lift to its third. Nemeris at 141
        // goes to 169 -- two rungs to three -- and Durn at 121 goes to
        // 145, one rung to two. It is the only speed buff in the game
        // that is also a healing buff, and it does not need a line of
        // code to be one.
        //
        // Shaped away from Tumble's Quickstep on purpose (cd4, +30%, two
        // turns): smaller number, twice the window. A burst of speed is
        // worth a burst of turns; a long one is worth every mend cast
        // inside it, which is what this hero is for.
        description: 'The brood is awake before the light is: ALL allies gain +20% Speed ' +
          'for 4 turns.',
        cooldown: 5, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'buff', stat: 'speed', mult: 1.20, turns: 4 }],
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
        id: 'nemeris_the_long_morning', name: 'The Long Morning',
        icon: 'assets/icons/fc1272.png',
        // The panic button, and the only cleanse in the sect. A healing
        // party's real loss condition is not damage, it is a heal block
        // or a stack of poisons outrunning the mends -- so the 5-star's
        // seven answers the thing his own pillar cannot.
        description: 'Night burns off the nest: every ally sheds 2 debuffs and recovers ' +
          '20% of their OWN max HP.',
        cooldown: 7, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [
          { type: 'cleanse', count: 2 },
          { type: 'healHpPct', targetPct: 0.20 },
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
      name: "The Brood's Egg",
      icon: 'assets/icons/fc1053.png',
      // The one thing no amount of healing covers: a bird deleted
      // between his turns. Everything the Sunbrood does answers
      // attrition, and this answers the hole attrition leaves.
      //
      // Distinct from Stella's coal on both counts that matter. Hers is
      // hers alone and leaves her on a single point of health -- a stay
      // of execution. His is spent on somebody else, once, and leaves
      // them standing on something real. See Unit.takeDamage for the
      // charge, and for why it is never spent on Nemeris himself.
      description: "The egg is the brood's, not his: while Nemeris stands, the first ally " +
        'who would fall is caught instead, holding on with health equal to 35% of ' +
        'his max HP. Once per battle, and never for Nemeris.',
      hooks: { eggBearer: 0.35 },
    },
    positional: POSITIONALS.under_the_egg,
  },

  // The brood's artillery, and the first Sunbrood who is neither mending
  // nor being mended. He is a horn: he reaches over the wall, he is
  // worth more the longer he is allowed to keep playing, and what he
  // mostly does for the party is make everybody ELSE's damage land.
  //
  // That last part is the point. A sect with two healers and a tank
  // whose output is healing has almost no damage of its own, and the
  // answer is not to bolt a big number onto a 3-star -- it is to give
  // the brood a hero whose seven marks the whole enemy line for 20%
  // more from everyone. The sect does not out-hit anybody. It outlasts
  // them and then charges them rent.
  //
  // He is also the one bird here who touches no pillar at all: not
  // healing, not max HP, not speed sold as anything. He just SPENDS the
  // sect's speed -- Quick Feathers takes him from 112 to 123, and every
  // turn that buys is another step up the Long Note.
  aster: {
    id: 'aster',
    element: 'light',
    name: 'Aster',
    title: 'Hornbearer of the Sunbrood',
    rarity: 3,
    // Thin, and it has to be: a ramp that sheds a step every time he is
    // struck is only a ramp if standing in the back row means something.
    stats: { hp: 1180, atk: 205, def: 82, speed: 112 },
    tint: { body: '#f0e8d0', helm: '#e8c84a', weapon: '#e07a3a', shield: '#c8a83a' },
    sprite: {
      displayH: 94,
      strips: {
        idle: { src: 'assets/heroes/sunbrood/asteridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'aster_sound_off', name: 'Sound Off',
        icon: 'assets/icons/fc823.png',
        // Sound goes over a shield wall, which is the whole reason a
        // horn is a back-row weapon. 60% where Slop Toss is 65% and
        // carries a perTarget rung on top -- that one is a Gulldigger
        // crowd skill and this is not.
        description: 'A flat blast over the top of the line: 60% ATK to the enemy BACK row.',
        cooldown: 0, targeting: 'back-enemies', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 0.60 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'aster_one_long_blast', name: 'One Long Blast',
        icon: 'assets/icons/fc1141.png',
        // Deliberately single-target, and deliberately in the middle of
        // his kit. Three sweeps would have made him a hero who does
        // nothing to a boss; this is the note held on one bird.
        description: 'The whole horn emptied at one of them: 135% ATK to a single enemy.',
        cooldown: 4, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.35 }],
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
        id: 'aster_reveille', name: 'Reveille',
        icon: 'assets/icons/fc1272.png',
        // The sect's damage, paid to everybody but him. The vulnerability
        // mark is the roster's existing one -- Doom Mark's channel, the
        // same icon a player already knows -- taken wide and shallow
        // where hers is narrow and deep (one enemy, x1.4, three turns,
        // on an eight). Reusing the mark rather than inventing a second
        // one is the point: a debuff nobody can read at a glance is a
        // debuff that may as well not be on the field.
        description: 'The note the whole field hears: 110% ATK to ALL enemies, and a 50% ' +
          'chance on each to take 10% more damage from everyone for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'idle', impact: 'slam',
        effects: [
          { type: 'damage', mult: 1.10 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.10, turns: 2, chance: 0.5 },
        ],
        // No `duration` rung: it lengthens buffs only (see Abilities,
        // case 'debuff'), so one here would have bought nothing. The mark
        // deepens instead -- `debuffPower` moves a debuff away from
        // neutral, so two rungs of 5% take 1.10 to 1.20 at the cap.
        // Seven rungs is the whole budget for a third slot, and the mark
        // now takes four of them -- which is the right split for a skill
        // whose job is what it leaves behind rather than what it hits for.
        levelUps: [
          { mult: 0.1 },
          { debuffChance: 0.25 },
          { debuffPower: 0.05 },
          { debuffChance: 0.25 },
          { debuffPower: 0.05 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Long Note',
      icon: 'assets/icons/fc1066.png',
      // A ramp charged by TURNS rather than by kills, hits or fires,
      // which is what makes the sect's first pillar worth something to a
      // hero who converts none of it: Quick Feathers buys him turns, and
      // every turn is a step. The cost is that he has to be left alone
      // to play -- one step comes off every time he is struck -- so he
      // is the reason the brood's wall is standing in front of him.
      //
      // Held on the unit as `longNote`, the way Balmor's bill is held as
      // `pouch`. Units are rebuilt per battle, so it opens empty.
      description: 'The longer he is left to play, the further it carries: +10% damage at ' +
        'the start of each of his turns, stacking to +50%. Every blow he takes ' +
        'knocks a step off.',
      hooks: {
        onTurnStart(unit) {
          const cap = Math.max(5, ...unit.hookSources().map(
            (p) => (p.hooks && p.hooks.longNoteCap) || 0));
          const before = unit.longNote || 0;
          unit.longNote = Math.min(cap, before + 1);
          if (unit.longNote === before) return null;
          return { floats: [{ target: unit, text: '♪', color: '#ffd76a' }] };
        },
        onStruck(unit) {
          if (!unit.longNote) return null;
          unit.longNote -= 1;
          return { floats: [{ target: unit, text: '♪–', color: '#c88a3a' }] };
        },
        damageDealtMult: (u) => 1 + 0.10 * (u.longNote || 0),
      },
    },
    positional: POSITIONALS.carrying_distance,
  },

  // The other half of Aster, and written as his negative. Aster is a
  // horn: wide, loud, best at the opening, and worth most for what he
  // leaves on the enemy line. Rizzo is a bow: one bird at a time, worth
  // most at the end, and worth it to nobody but himself.
  //
  // He runs on CRIT, which is the one axis neither of his packs touches
  // -- light sells max HP twice and a stay of execution, the brood sells
  // speed and healing done -- so a crit build on him is a build the sect
  // has not already paid for. That is the whole reason a healing order
  // can afford a hero whose damage is a lottery: nothing else in it is.
  //
  // Darker than the rest of the brood on the strip, too, and that is
  // about right. He is the one who finishes things.
  rizzo: {
    id: 'rizzo',
    element: 'light',
    name: 'Rizzo',
    title: 'Bowbearer of the Sunbrood',
    rarity: 3,
    stats: { hp: 1220, atk: 212, def: 86, speed: 108 },
    tint: { body: '#3a5a6a', helm: '#e8c84a', weapon: '#c8a83a', shield: '#2a3a5a' },
    sprite: {
      displayH: 94,
      strips: {
        idle: { src: 'assets/heroes/sunbrood/rizzoidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rizzo_loose', name: 'Loose',
        icon: 'assets/icons/fc823.png',
        description: 'One arrow, one bird: 95% ATK to a single enemy.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 0.95 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'rizzo_bodkin', name: 'Bodkin',
        icon: 'assets/icons/fc1141.png',
        // A narrow head made for armour, and the reason he is the answer
        // to the wall Aster's blast bounces off.
        description: 'The narrow head, for armour: 155% ATK to one enemy, slipping past ' +
          '30% of their DEF.',
        cooldown: 4, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.55, ignoreDef: 0.30 }],
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
        id: 'rizzo_the_long_shot', name: 'The Long Shot',
        icon: 'assets/icons/fc1272.png',
        // `critAdd: 1` takes the roll to a certainty (the chance is
        // capped at 1 in strike), which makes his seven the one shot
        // that is GUARANTEED to split. The kit interlocks: the passive
        // needs a crit and this one buys it outright.
        // 140%, not 240%. A guaranteed crit is already worth x1.5 on the
        // swing AND a guaranteed split, so pricing it like an ordinary
        // seven paid for the certainty twice -- and it is a 3-star, on a
        // shelf that does not need another big opening number.
        description: 'He has been holding this one since the light came up: 140% ATK to a ' +
          'single enemy, and it always crits.',
        cooldown: 7, targeting: 'enemy', animation: 'idle', impact: 'slam',
        effects: [{ type: 'damage', mult: 1.40, critAdd: 1 }],
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
      name: 'Split the Shaft',
      icon: 'assets/icons/fc1066.png',
      // Sibling to the fire pack's Encore and deliberately the other
      // shape: the encore hits the SAME bird twice, this one goes on to
      // a DIFFERENT one, so a kit carrying both widens instead of
      // doubling. It picks the weakest thing still standing, which is
      // what makes him a finisher and Aster an opener.
      description: "When Rizzo crits, the shaft splits: the enemy with the least health " +
        'left takes half the shot as well.',
      hooks: { critCarry: 0.5 },
    },
    positional: POSITIONALS.called_shot,
  },

  // The brood's second wall, and the opposite kind of one. Durn is a
  // CONVERTER: he takes the blow and turns it into a mend, which means
  // the damage still happens and the sect pays for it afterwards.
  // Mavros is a DENIER. Nothing he does gives anything back, because
  // his job is that there is nothing to give back.
  //
  // He answers the sect's actual loss condition. Everything the Sunbrood
  // owns beats attrition -- two healers, a tank whose output is healing,
  // a pack that pays 40% more on anyone under half -- and none of it
  // beats a bird deleted between turns. Nemeris's egg covers exactly one
  // such moment. Mavros covers the rest by making the big hits smaller
  // and by standing where the enemy has to look at him.
  //
  // He is also the first taunt on the roster. The channel has been wired
  // the whole time -- the AI picks a taunter outright, and Battle has a
  // whole turn shape for the enemy it drew -- with nobody carrying it.
  mavros: {
    id: 'mavros',
    element: 'light',
    name: 'Mavros',
    title: 'Casquebearer of the Sunbrood',
    rarity: 4,
    // Bulk over armour, where Durn takes the armour over the bulk. Two
    // walls of the same sect should not be the same wall, and it is the
    // same split Balmor and Strix are cut along.
    //
    // 104 is the slowest bird in the brood on purpose. He is the one
    // thing here that is not in a hurry, and the 2pc still lifts him to
    // 114 -- the sect's floor rather than an exception to it.
    stats: { hp: 2100, atk: 92, def: 150, speed: 104 },
    tint: { body: '#2a3a5a', helm: '#f0e0a8', weapon: '#c8a83a', shield: '#e8c84a' },
    sprite: {
      displayH: 100,
      // Authored facing LEFT -- the beak and the casque both point that
      // way on the strip -- so the flag turns him to face the enemy.
      // The art is never touched; the def says which way it was drawn.
      faceLeft: true,
      strips: {
        idle: { src: 'assets/heroes/sunbrood/mavrosidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'mavros_shoulder', name: 'Shoulder',
        icon: 'assets/icons/fc819.png',
        // DEF-priced, like every wall who hits with what he is wearing.
        // 0.65 is Korvid's rung of the band (Toll 0.50, Korvid 0.65,
        // Morrow and Talon 0.70, Bit 0.80) and sits a step above Durn's
        // 0.50, which is the whole of what a shelf buys on a slot one.
        description: 'He simply arrives: 65% of his DEF to one enemy.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'slam',
        effects: [{ type: 'damageDef', mult: 0.65 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'mavros_hold_the_gate', name: 'Hold the Gate',
        icon: 'assets/icons/fc856.png',
        // The roster's first taunt. It is cast on HIMSELF -- a taunt is
        // a buff on the bird being looked at, not a hex on the ones
        // looking -- and the DEF rides with it, because drawing the whole
        // field onto a wall who has not braced is just a slower loss.
        description: 'He puts himself in the doorway: enemies are drawn onto Mavros for ' +
          '2 turns, and he braces for +30% DEF while they come.',
        cooldown: 4, targeting: 'self', animation: 'idle', impact: 'heal_gold',
        effects: [
          { type: 'taunt', turns: 2 },
          { type: 'buff', stat: 'def', mult: 1.30, turns: 2 },
        ],
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
        id: 'mavros_the_whole_gate', name: 'The Whole Gate',
        icon: 'assets/icons/fc1272.png',
        description: 'The casque goes through the line: 95% of his DEF to the enemy FRONT ' +
          'row, with a 50% chance on each to swing 20% softer for 2 turns.',
        cooldown: 7, targeting: 'front-enemies', animation: 'idle', impact: 'slam',
        effects: [
          { type: 'damageDef', mult: 0.95 },
          { type: 'debuff', stat: 'atk', mult: 0.80, turns: 2, chance: 0.5 },
        ],
        levelUps: [
          { mult: 0.1 },
          { debuffChance: 0.25 },
          { debuffPower: 0.05 },
          { debuffChance: 0.25 },
          { debuffPower: 0.05 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'The Casque',
      icon: 'assets/icons/fc1066.png',
      // Crit immunity is a new axis: nothing on the roster has ever
      // touched an INCOMING crit, and it is the precise counter to the
      // one thing a healing sect cannot heal through -- a single blow
      // arriving at 150%.
      //
      // He shelters the back hexes rather than the whole party, and that
      // is aimed: Aster's ramp sheds a step every time he is struck and
      // Rizzo is made of paper, so the two birds the brood most needs
      // left alone are exactly the two standing behind Mavros.
      //
      // It reads where the VICTIM stands and never where HE does. A
      // first draft gated the shelter on him holding a front hex and the
      // data suite named it for what it was -- a positional wearing a
      // passive's coat. The placement decision lives in Gatepost, where
      // it belongs: the hex is what adds the centre rank.
      description: 'The armour has no gap to find: Mavros can never be struck critically, ' +
        'and neither can any ally standing on a BACK hex.',
      hooks: {
        critProof(unit, victim) {
          // No liveness guard: the engine scans livingUnits, so a fallen
          // casque is already out of the list before it asks. One was
          // written here and could not be made to bite, which is the
          // tell that it was never doing anything.
          if (victim === unit) return true;
          if (!victim.slot) return false;
          if (victim.slot.position === POSITION.BACK) return true;
          // His hex widens WHO is covered, not what is stopped.
          return victim.slot.position === POSITION.CENTER &&
            unit.hookSources().some((p) => p.hooks && p.hooks.critShelterWide);
        },
      },
    },
    positional: POSITIONALS.gatepost,
  },

  // The sect's first and only offensive support, and the hero who reads
  // its books rather than adding to them.
  //
  // Six birds in, the Sunbrood's problem is stated plainly in its own
  // arithmetic: light sells max HP twice and a stay of execution, the
  // brood sells speed and healing done, and NOTHING anywhere in either
  // pack points at the enemy. Two healers, a tank whose output is
  // healing and a +60% ceiling on mends means the party's real surplus
  // is waste -- every point of a team heal that lands on a bird already
  // full is simply gone. Orien is the one who catches it.
  //
  // He does not heal. That is deliberate and it is what keeps him off
  // Nemeris's ground: his orb is filled by OTHER people's spillage, so
  // he is worth exactly as much as the healers standing beside him and
  // nothing at all on his own. The conversion is the sect's stated
  // thesis pointed at the other side of the field for the first time.
  //
  // Sibling to Balmor's bill and deliberately the other source. Balmor
  // banks what is done TO him; Orien banks what is wasted on his
  // friends. Same shape of payout, opposite half of the fight.
  orien: {
    id: 'orien',
    element: 'light',
    name: 'Orien',
    title: 'Orbbearer of the Sunbrood',
    rarity: 4,
    // Health is the stat that matters to him and ATK is the one that
    // does not: the orb is capped against his own pool and not one
    // point of what he does is priced off attack.
    stats: { hp: 1700, atk: 96, def: 104, speed: 118 },
    tint: { body: '#2a4a8a', helm: '#e8c84a', weapon: '#f0d878', shield: '#c8a83a' },
    sprite: {
      displayH: 96,
      strips: {
        idle: { src: 'assets/heroes/sunbrood/orienidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'orien_kindle', name: 'Kindle',
        icon: 'assets/icons/fc1053.png',
        // Crit damage, not attack. A cd0 single-ally ATK blessing is
        // Kiri's Pinwheel exactly -- the roster's "no two abilities are
        // mechanically identical" rule named it the moment it was
        // written -- and the crit axis is better for him anyway: neither
        // of his packs touches it, and the bird it lands on hardest is
        // Rizzo, whose whole kit is a lottery ticket.
        description: 'A handful off the orb, given to one of them: an ally gains +25% Crit ' +
          'Damage for 2 turns.',
        cooldown: 0, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'buff', stat: 'critDamage', add: 0.25, turns: 2 }],
        levelUps: [
          { buffPower: 0.05 },
          { duration: 1 },
          { buffPower: 0.05 },
          { buffPower: 0.05 },
          { buffPower: 0.05 },
        ],
      },
      {
        id: 'orien_handfuls_of_sun', name: 'Handfuls of Sun',
        icon: 'assets/icons/fc1073.png',
        // The only offensive party buff either of his packs will ever
        // see, which is most of the reason he exists.
        description: 'He opens the wings and the whole brood catches it: ALL allies gain ' +
          '+20% ATK for 3 turns.',
        cooldown: 5, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'buff', stat: 'atk', mult: 1.20, turns: 3 }],
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
        id: 'orien_let_the_light_out', name: 'Let the Light Out',
        icon: 'assets/icons/fc1272.png',
        // Thrown as an ordinary blow, exactly like Balmor's bill: it can
        // be dodged, it can be reflected, and the DEF curve answers it.
        // Stored light is still a hit.
        //
        // The card has to carry the whole mechanic, because a bank is
        // invisible: nothing in the UI shows what is in the orb, so a
        // player who has not read the passive on the next tab over has
        // no idea what pressing this is worth. It names what fills it,
        // what the ceiling is, and what happens when it is empty.
        description: 'Every mend the brood wasted, thrown at one of them: Orien empties ' +
          'the orb as a single blow. It holds whatever healing has been spent on ' +
          'already-full allies since the fight began, to a ceiling of 15% of his ' +
          'max HP — and an empty orb throws nothing.',
        cooldown: 7, targeting: 'enemy', animation: 'idle', impact: 'slam',
        effects: [{ type: 'spendPouch', store: 'orb' }],
        levelUps: [
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'The Orb Fills',
      icon: 'assets/icons/fc1066.png',
      // Capped against his POOL rather than his ATK, and for the reason
      // Balmor's bill was rewritten: a support's attack stat is small
      // precisely because he is a support, so a cap measured in ATK is a
      // cap that means nothing at level 30 and less at 100. Health moves
      // with gear and stars the way the numbers it is competing against
      // do.
      //
      // 15%, and the bench is why. A quarter of his pool paid 885 at
      // level 30 and 1299 at 100 against Aurek's 240%-ATK seven at 690
      // and 940 -- the biggest single blow in the sect, on a 4-star
      // support, on top of a party-wide attack buff. 15% lands it at
      // roughly Rizzo's seven, which is where a bonus belongs.
      //
      // A party running two healers fills it in one cast. A party
      // running none never fills it at all, which is the point.
      description: 'Nothing the brood spills is wasted on Orien: every point of healing ' +
        'that lands on an ally already full is caught in the orb, up to 15% ' +
        'of his max HP.',
      bank: { prop: 'orb', capPct: 0.15, label: 'ORB', color: '#ffd76a' },
      hooks: {
        onAllyOverheal(unit, { overflow } = {}) {
          if (!unit.alive || !(overflow > 0)) return null;
          const cap = unit.maxHp * Unit.bankOf(unit).capPct;
          const before = unit.orb || 0;
          if (before >= cap) return null;
          unit.orb = Math.min(cap, before + overflow);
          const gained = Math.round(unit.orb - before);
          if (gained <= 0) return null;
          return { floats: [{ target: unit, text: `◉ ${gained}`, color: '#ffd76a' }] };
        },
      },
    },
    positional: POSITIONALS.noon_angle,
  },

  // The last 4-star, and the sect's only UNCONDITIONAL damage dealer --
  // which turned out to be the hole once the other four were written.
  // Aurek pays health for his, Aster has to be left alone to ramp into
  // his, Rizzo's is a lottery ticket, and Orien's is nothing at all
  // without two healers standing beside him. Every one of them is a
  // clause. Solari is the floor underneath the clauses.
  //
  // Her rider reads the ENEMY's blessings, which is an axis nothing on
  // the roster has ever scaled off -- and it is not what Asher does.
  // He steals them to wear; she is paid for their being there at all,
  // and then takes them off the board. A mirror does not want the light,
  // it wants the angle.
  solari: {
    id: 'solari',
    element: 'light',
    name: 'Solari',
    title: 'Glassbearer of the Sunbrood',
    rarity: 4,
    stats: { hp: 1320, atk: 235, def: 92, speed: 114 },
    tint: { body: '#f0e4d0', helm: '#e88a3a', weapon: '#e8c84a', shield: '#f0d878' },
    sprite: {
      displayH: 96,
      strips: {
        idle: { src: 'assets/heroes/sunbrood/solariidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'solari_catch_the_light', name: 'Catch the Light',
        icon: 'assets/icons/fc823.png',
        // The strip is on her FILLER, not just her seven, and the roster
        // is why: a plain 95%-ATK single-target cd0 is Rizzo's Loose
        // exactly, and "no two abilities are mechanically identical"
        // said so the moment it was written. It made the hero better.
        // Chipping one blessing off every single turn is what makes the
        // hex (a cooldown refund per strip) a live engine rather than a
        // thing that happens twice a fight, and it puts the same verb in
        // all three slots.
        description: 'A held angle and a steady hand: 95% ATK to a single enemy, with a ' +
          '50% chance to take one blessing off them.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'stripBuffs', count: 1, chance: 0.5 },
        ],
        levelUps: [
          { mult: 0.1 },
          { debuffChance: 0.25 },
          { mult: 0.1 },
          { debuffChance: 0.25 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'solari_sunspot', name: 'Sunspot',
        icon: 'assets/icons/fc1141.png',
        // A ROW, chosen. The sect's four other dealers cover single
        // targets, the back rank and the whole field; a rank the player
        // picks was the shape left over, and it is the one that suits a
        // hero standing in the middle with a line of sight to all of it.
        description: 'She holds the disc still until the ground smokes: 105% ATK to the ' +
          'chosen enemy and everyone in their row.',
        cooldown: 4, targeting: 'enemy-row', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.05 }],
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
        id: 'solari_turn_the_glass', name: 'Turn the Glass',
        icon: 'assets/icons/fc1272.png',
        // Damage FIRST, then the strip. The order is the skill: she is
        // paid for every blessing the target is wearing and only then
        // takes them off, so the fat buffed tank is both the best target
        // and the one who stops being a problem afterwards.
        description: 'Everything they were given, shown back to them: 180% ATK to one ' +
          'enemy, then a 50% chance to tear away up to 3 of their blessings.',
        cooldown: 7, targeting: 'enemy', animation: 'idle', impact: 'slam',
        effects: [
          { type: 'damage', mult: 1.80 },
          { type: 'stripBuffs', count: 3, chance: 0.5 },
        ],
        levelUps: [
          { mult: 0.1 },
          { debuffChance: 0.25 },
          { mult: 0.1 },
          { debuffChance: 0.25 },
          { mult: 0.1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'What the Mirror Shows',
      icon: 'assets/icons/fc1066.png',
      // Capped at three, which is where the arithmetic stops being a
      // rider and starts being the whole hero: an enemy party stacking
      // blessings on one body could otherwise hand her a multiplier no
      // card on the roster offers.
      //
      // Wards, heals-over-time and bubbles are not blessings and do not
      // count -- only `kind: 'buff'`, the same thing her seven tears
      // off, so what pays her and what she takes are the same list.
      description: 'A mirror gives back whatever it is shown: Solari deals 20% more ' +
        'damage for every blessing on her target, up to 60%.',
      hooks: {
        damageDealtMult(unit, target) {
          if (!target || !target.statusEffects) return 1;
          const blessings = target.statusEffects.filter((fx) => fx.kind === 'buff').length;
          return 1 + 0.20 * Math.min(3, blessings);
        },
      },
    },
    positional: POSITIONALS.heliograph,
  },

  // The ninth bird, the second 5-star, and the sect's thesis written as
  // one hero: the Sunbrood does not win the first exchange, it wins the
  // eighth. Everything she does is worth nothing on turn one and more
  // every turn after, which is the only support on the roster that is
  // deliberately WEAK at the opening.
  //
  // Her growth is written onto BASE attack rather than handed out as a
  // blessing, and that is the whole mechanic rather than a shortcut:
  // no strip on the roster can touch it (they all read statusEffects,
  // and this is not in there), and death does not take it -- Unit.revive
  // wipes statuses, so a bird raised by an ordinary buffer comes back
  // with nothing and one Nestora raised comes back as itself. Which is
  // exactly what her seven is for.
  //
  // She is also the only bird here who does not overlap Nemeris. He
  // mends, cleanses and hurries; Orien buys attack by the turn and
  // spends the party's waste; she buys attack FOREVER and answers the
  // one thing neither of them can, which is a bird already on the
  // ground.
  nestora: {
    id: 'nestora',
    element: 'light',
    name: 'Nestora',
    title: 'Nestbearer of the Sunbrood',
    rarity: 5,
    // Promoted from 3-star, which is a change of KIT rather than of
    // numbers -- js/data/balance.js holds every hero to one budget --
    // and the shelf is right for her: a hero whose value is cumulative
    // wants the level ceiling and the third skill that five stars buy.
    stats: { hp: 1620, atk: 104, def: 118, speed: 120 },
    tint: { body: '#f4f0e8', helm: '#2f6f6a', weapon: '#c8a83a', shield: '#e8c84a' },
    sprite: {
      displayH: 100,
      strips: {
        idle: { src: 'assets/heroes/sunbrood/nestoraidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'nestora_feed_the_nest', name: 'Feed the Nest',
        icon: 'assets/icons/fc866.png',
        // The passive spreads growth thin across the whole brood every
        // turn; this concentrates it on one bird. Same verb, opposite
        // distribution, one shared ceiling -- so the player is choosing
        // WHO the party's carry is going to be rather than whether to
        // grow at all.
        description: 'A beakful for the one that is loudest: an ally permanently gains ' +
          '+10% ATK for the rest of the battle. Nothing can strip it, and dying does ' +
          'not lose it.',
        cooldown: 0, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'raise', pct: 0.10, cap: 0.30 }],
        levelUps: [
          { buffPower: 0.05 },
          { buffPower: 0.05 },
          { buffPower: 0.05 },
          { buffPower: 0.05 },
          { buffPower: 0.05 },
        ],
      },
      {
        id: 'nestora_the_whole_nest', name: 'The Whole Nest',
        icon: 'assets/icons/fc1073.png',
        // The sect's only PREVENTIVE answer to being hexed. Nemeris
        // cleans up afterwards on a seven; this stops it landing, which
        // matters far more to a party whose losing condition is a heal
        // block arriving before its healer moves.
        description: 'She settles the whole brood down: ALL allies gain +25% Resistance ' +
          'for 3 turns.',
        cooldown: 5, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'buff', stat: 'resistance', add: 0.25, turns: 3 }],
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
        id: 'nestora_back_to_the_nest', name: 'Back to the Nest',
        icon: 'assets/icons/fc1272.png',
        // The sect's only revive, and the clause that makes it hers
        // costs no code at all: a revive wipes statusEffects, and what
        // she raised is not in there. A bird she has been feeding all
        // fight gets up still fed. That is the reward for a support who
        // spent eight turns being worth less than everybody else.
        description: 'Nothing that was raised here is lost: a fallen ally is back on their ' +
          'feet at 50% health, and everything Nestora grew in them is still theirs.',
        cooldown: 8, targeting: 'dead-ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'revive', pct: 0.50 }],
        levelUps: [
          { heal: 0.05 },
          { heal: 0.05 },
          { cooldown: -1 },
          { heal: 0.05 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Everything I Raised',
      icon: 'assets/icons/fc1066.png',
      // +5% a turn to +30% is six of her turns to fill a bird, and at
      // 120 base speed -- 132 under the brood's own 2pc -- that is most
      // of a real fight. She is meant to be the reason a Sunbrood party
      // wants the fight to go long, not a hero who front-loads a party
      // buff and then stands there.
      description: 'A nest is a slow business: at the start of each of her turns every ' +
        'ally permanently gains +5% ATK, up to +30%. Nothing can strip what she ' +
        'raises, and dying does not lose it.',
      hooks: {
        onTurnStart(unit, battle) {
          if (!battle) return null;
          const cap = Math.max(0.30, ...unit.hookSources().map(
            (p) => (p.hooks && p.hooks.raiseCap) || 0));
          const fed = [];
          for (const ally of battle.livingUnits(unit.team)) {
            if (Abilities.raiseAtk(ally, 0.05, cap) > 0) fed.push(ally);
          }
          if (!fed.length) return null;
          return {
            label: 'Everything I Raised',
            message: `${unit.name} feeds the nest — the brood comes up stronger.`,
            floats: fed.map((a) => ({ target: a, text: 'ATK ▲', color: '#ffd76a' })),
          };
        },
      },
    },
    positional: POSITIONALS.the_high_nest,
  },

  // The first Hollowbone, and the only hero in the game who brings
  // bodies onto the board that were never on the roster.
  //
  // Everything about him points the same way and it is not the way a
  // necromancer usually points. His basic swing is priced off how much
  // of his OWN side is still standing -- every other crowd term in the
  // engine counts the enemy, this one counts the people behind him --
  // so he is weakest exactly when the fight has gone badly, and the way
  // he answers that is to dig up more people to stand behind him. The
  // summon is not a side plate. It is the fuel for slot one.
  //
  // See js/data/summons.js for the two bodies and why they are not in
  // HEROES, and Abilities (raiseBody / the `summon` case) for the hex
  // hunt, the corpse it consumes, and the branch that fires when the
  // board is full.
  necros: {
    id: 'necros',
    element: 'dark',
    name: 'Necros',
    title: 'Bonecaller of the Hollowbone',
    rarity: 5,
    // Read carefully: his ATK is not small. Both summons take their
    // attack as a share of HIS, so a summoner with a support's statline
    // raises two bodies that cannot hit anything, and the hero stops
    // working at exactly the moment he is supposed to start.
    stats: { hp: 1580, atk: 196, def: 116, speed: 124 },
    tint: { body: '#2a2438', helm: '#e8dcc0', weapon: '#8a5ac8', shield: '#6a4a9a' },
    sprite: {
      displayH: 100,
      strips: {
        idle: { src: 'assets/heroes/hollowbone/necrosidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'necros_the_standing_count', name: 'The Standing Count',
        icon: 'assets/icons/fc823.png',
        // `perAlly` is a new term on the damage line and the only one on
        // it that counts his own side. It counts BODIES, so a raised
        // cassowary is one of them: his two summons are worth 30% of
        // this swing on top of whatever they hit for themselves.
        description: 'He counts the flock and charges for it: 45% ATK to one enemy, plus ' +
          '15% for every living body on his own side — the raised included.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 0.45, perAlly: 0.15 }],
        levelUps: [
          { mult: 0.1 },
          { perAlly: 0.05 },
          { mult: 0.1 },
          { perAlly: 0.05 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'necros_carrion_call', name: 'Second Legs',
        icon: 'assets/icons/fc1141.png',
        description: 'A bone cassowary gets up on the first free hex — an empty one, or ' +
          "one with a body still on it. With the board full the power goes into the " +
          "party's hardest hitter instead: +40% ATK and −30% DEF for 3 turns, and 30% " +
          'of their health as the price.',
        cooldown: 4, targeting: 'self', animation: 'idle', impact: 'strike_purple',
        effects: [{
          type: 'summon', id: 'crossowary_undead',
          // The heavy body: most of his pool, a little over half his
          // swing, slower than he is.
          share: { hp: 0.60, atk: 0.55, def: 0.60, speed: 0.90 },
          fallback: { atk: 1.40, def: 0.70, turns: 3, hpCut: 0.30 },
        }],
        levelUps: [
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'necros_the_long_bill', name: 'The Long Bill',
        icon: 'assets/icons/fc1272.png',
        description: 'A bone heron gets up on the first free hex — an empty one, or one ' +
          "with a body still on it. With the board full the power goes into the party's " +
          'hardest hitter instead: +40% ATK and −30% DEF for 3 turns, and 30% of their ' +
          'health as the price.',
        cooldown: 6, targeting: 'self', animation: 'idle', impact: 'strike_purple',
        effects: [{
          type: 'summon', id: 'heron_undead',
          // The sharp body: thinner than the cassowary everywhere but
          // the swing, and faster than Necros himself.
          share: { hp: 0.40, atk: 0.70, def: 0.40, speed: 1.05 },
          fallback: { atk: 1.40, def: 0.70, turns: 3, hpCut: 0.30 },
        }],
        levelUps: [
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'What I Raise, I Keep',
      icon: 'assets/icons/fc1066.png',
      // The bodies move on HIS clock. Nothing else on the roster hands
      // turn meter to a filtered set of units on the giver's own turn,
      // and it is what separates a summoner from a hero who happens to
      // leave things lying around: the cassowary is not a pet, it is a
      // limb.
      //
      // Read off `raisedBy`, which raiseBody stamps on every body it
      // stands up -- so it pays HIS dead and never somebody else's.
      description: 'The raised move when he does: at the start of each of his turns, every ' +
        'body Necros has stood up gains 20% turn meter.',
      hooks: {
        onTurnStart(unit, battle) {
          if (!battle) return null;
          const mine = battle.livingUnits(unit.team).filter((u) => u.raisedBy === unit);
          if (!mine.length) return null;
          for (const body of mine) {
            body.turnMeter += CONFIG.TURN_METER_MAX * 0.20;
          }
          return {
            label: 'What I Raise, I Keep',
            message: `${unit.name} pulls on the strings — the raised stir.`,
            floats: mine.map((u) => ({ target: u, text: '▲', color: '#b07ae8' })),
          };
        },
      },
    },
    positional: POSITIONALS.gravecircle,
  },

  // The second Hollowbone, and the sect's only sustain. A dark order of
  // eight debuffers, assassins and walls has nobody keeping anybody
  // alive, and Click does it without a single heal in her kit: what the
  // bells hand out is a ward, and a ward is health that never left.
  //
  // She is also the apprentice. She raises the same cassowary Necros
  // does off a longer cooldown and a smaller bird, which is the whole
  // relationship: he is the one who digs, she is the one who rings for
  // it. Fielding both is two bodies on the board and no new mechanic to
  // learn.
  //
  // Note the ATK on a support statline, and note that it is deliberate.
  // A summon takes its swing as a share of the summoner's, so a raiser
  // with nothing to give raises something that cannot hit -- the same
  // trap Necros's own line is written around, and it bites harder here
  // because a 3-star support is exactly where the temptation to spend
  // everything on health and defence is strongest. Her share of attack
  // is the highest on the roster (0.85) for the same reason: it is
  // 85% of a small number.
  click: {
    id: 'click',
    element: 'dark',
    name: 'Click',
    title: 'Bellbearer of the Hollowbone',
    rarity: 3,
    stats: { hp: 1420, atk: 148, def: 110, speed: 118 },
    tint: { body: '#2a2438', helm: '#e8dcc0', weapon: '#c8a83a', shield: '#8a5ac8' },
    sprite: {
      displayH: 88,
      strips: {
        idle: { src: 'assets/heroes/hollowbone/clickidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'click_first_bell', name: 'First Bell',
        icon: 'assets/icons/fc866.png',
        // Priced off HER pool rather than her attack, which is what
        // makes a support with a summoner's attack stat still worth
        // gearing for health.
        description: 'One note, held: an ally gains a ward worth 12% of Click’s max HP ' +
          'for 2 turns.',
        cooldown: 0, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'shield', pct: 0.12, turns: 2 }],
        levelUps: [
          { heal: 0.02 },
          { heal: 0.02 },
          { duration: 1 },
          { heal: 0.02 },
          { heal: 0.02 },
        ],
      },
      {
        id: 'click_ring_the_round', name: 'Ring the Round',
        icon: 'assets/icons/fc1141.png',
        // The sect's tempo tool, and the only one it has. Gated at the
        // roster-standard 50% every drain is held to.
        description: 'She swings the whole rack at once and the room forgets what it was ' +
          'doing: a 50% chance on EVERY enemy to lose 20% of their action bar.',
        cooldown: 4, targeting: 'all-enemies', animation: 'idle', impact: 'strike_purple',
        effects: [{ type: 'turnMeter', amount: -0.20, chance: 0.5 }],
        levelUps: [
          { meter: 0.05 },
          { debuffChance: 0.25 },
          { meter: 0.05 },
          { debuffChance: 0.25 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'click_last_bell', name: 'Last Bell',
        icon: 'assets/icons/fc1272.png',
        description: 'The note the dead answer: a bone cassowary gets up on the first free ' +
          'hex — an empty one, or one with a body still on it. With the board full the ' +
          "power goes into the party's hardest hitter instead: +40% ATK and −30% DEF " +
          'for 3 turns, and 30% of their health as the price.',
        cooldown: 6, targeting: 'self', animation: 'idle', impact: 'strike_purple',
        effects: [{
          type: 'summon', id: 'crossowary_undead',
          share: { hp: 0.55, atk: 0.85, def: 0.55, speed: 0.95 },
          fallback: { atk: 1.40, def: 0.70, turns: 3, hpCut: 0.30 },
        }],
        levelUps: [
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Bell, Book, Bone',
      icon: 'assets/icons/fc1066.png',
      // A ward with a conditional duration, which nothing else on the
      // roster has: every other shield on the board counts down whatever
      // is happening to the bird wearing it. Hers stops counting exactly
      // when it is doing the most work, so a bird under half health
      // keeps its ward until something spends it.
      //
      // Read off the SOURCE in Unit.tickStatusEffects, the way
      // buffExtraTurns is -- it is the ringer's doing, not the
      // recipient's luck.
      description: 'The bell does not stop for the dying: a ward from Click never runs out ' +
        'while the ally holding it is below half health. Only spending it clears it.',
      hooks: { wardHold: true },
    },
    positional: POSITIONALS.long_peal,
  },

  // The sect's wall, and a tank who WANTS to be cursed -- which in a
  // game where the dark meta is affliction is the most useful thing a
  // dark tank can be.
  //
  // Look at the art and the kit is already there: the pale cage over his
  // back is not armour he was issued, it is other birds' bones grown
  // over him. So his armour is other people's curses, his cooldown takes
  // theirs onto himself, and his big swing is the cage thrown.
  //
  // Not Valere's trick, and the difference is the whole hero. Her
  // transferDebuffs puts the party's afflictions on an ENEMY, which
  // takes them out of the fight; Rend's `drawDebuffs` puts them on
  // HIMSELF, which does not. That is a worse trade for everybody except
  // the bird who is paid for holding them, and there is exactly one.
  rend: {
    id: 'rend',
    element: 'dark',
    name: 'Rend',
    title: 'Cagebearer of the Hollowbone',
    rarity: 3,
    // Bulk over armour: the reduction he cares about is the one his
    // passive prints, and a deep pool is what turns a percentage into a
    // number. Slow, and the only Hollowbone who is -- the sect buys
    // speed at 2pc and spends it on curse depth, and he is the one bird
    // whose job does not involve landing any.
    stats: { hp: 2050, atk: 96, def: 138, speed: 100 },
    tint: { body: '#2a2438', helm: '#e8dcc0', weapon: '#c8b898', shield: '#8a5ac8' },
    sprite: {
      displayH: 96,
      strips: {
        idle: { src: 'assets/heroes/hollowbone/rendidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rend_bite_down', name: 'Bite Down',
        icon: 'assets/icons/fc819.png',
        description: 'Whatever is nearest, in the mouth: 55% of his DEF to one enemy.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damageDef', mult: 0.55 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'rend_take_it_on', name: 'Take It On',
        icon: 'assets/icons/fc1141.png',
        // No contest roll on this one, and none should be: he is taking
        // his own side's afflictions off his own side, and a bird
        // volunteering to be poisoned does not get to resist itself.
        description: 'He opens up and the party empties into him: every affliction on his ' +
          'allies comes off them and goes onto Rend, keeping whatever it was worth and ' +
          'whatever turns it had left.',
        cooldown: 4, targeting: 'self', animation: 'idle', impact: 'strike_purple',
        effects: [{ type: 'drawDebuffs' }],
        levelUps: [
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'rend_cage', name: 'Cage',
        icon: 'assets/icons/fc1272.png',
        // The armour, thrown. `perDebuff` reads what the CASTER is
        // carrying rather than the target -- every other conditional on
        // the damage line asks what is wrong with the enemy.
        description: 'He shakes the whole cage loose at once: 50% of his DEF to ALL ' +
          'enemies, plus 20% for every affliction Rend is carrying.',
        cooldown: 7, targeting: 'all-enemies', animation: 'idle', impact: 'slam',
        effects: [{ type: 'damageDef', mult: 0.50, perDebuff: 0.20 }],
        levelUps: [
          { mult: 0.1 },
          { perDebuff: 0.05 },
          { mult: 0.1 },
          { perDebuff: 0.05 },
          { mult: 0.1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Grown Over',
      icon: 'assets/icons/fc1066.png',
      // Capped at five afflictions, which is where a curse stops being
      // armour and starts being a hero who cannot be killed. It is also
      // the only reduction on the roster the ENEMY controls: they can
      // simply not curse him, and then he is a 3-star wall with a mouth.
      description: 'The cage is other birds’ bones: Rend takes 5% less damage for every ' +
        'affliction on him, up to 25%.',
      hooks: {
        damageTakenMult(unit) {
          const worn = unit.statusEffects.filter(
            (fx) => fx.kind === 'debuff' || fx.kind === 'dot').length;
          return 1 - 0.05 * Math.min(5, worn);
        },
      },
    },
    positional: POSITIONALS.open_mouth,
  },

  // The sect's first damage, and a thief rather than a duellist. He is
  // carrying a pack of somebody else's bones, a club and a pot lid, and
  // what he does with them is take your next move off you.
  //
  // Enemy COOLDOWNS are an axis nothing on the roster has ever touched.
  // Allies get their skills back early -- Evelune, Mendral, Solari's hex
  // -- and until Crook nobody took an enemy's away. It is not an action
  // bar drain wearing a different coat either, and the difference is
  // worth being precise about: a drain moves WHEN you act, this moves
  // WHAT you can do when you get there. Against a healer holding a
  // resurrection those are not the same problem at all.
  //
  // His passive then reads the state his own seven creates, so the kit
  // is one idea twice: rob the pockets, then bill them for being empty.
  crook: {
    id: 'crook',
    element: 'dark',
    name: 'Crook',
    title: 'Bonepicker of the Hollowbone',
    rarity: 3,
    // A front-row dealer's split, and thin: he is standing in the line
    // because that is where the pockets are, not because he can hold it.
    stats: { hp: 1340, atk: 214, def: 94, speed: 116 },
    tint: { body: '#2a2438', helm: '#8a5ac8', weapon: '#8a7a5a', shield: '#6a5a48' },
    sprite: {
      displayH: 92,
      strips: {
        idle: { src: 'assets/heroes/hollowbone/crookidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'crook_clout', name: 'Clout',
        icon: 'assets/icons/fc823.png',
        // The filler steals, and the bench is the reason. Written
        // without it he measured +330 +/- 646 on a paired asymmetric
        // run -- statistically nothing -- against +4431 for Aurek and
        // +5853 for Rizzo on the same fixture, and the party actually
        // stood FEWER birds with him in it. Raising the passive's rate
        // from 12% to 20% moved it to +413, which is still nothing:
        // the payout was never the problem. The CONDITION was. His
        // passive charges for skills the enemy has spent, and a theft
        // that happens once every seven turns almost never leaves any
        // spent. Moving a small one onto the button he presses every
        // turn took him to +2222 +/- 653, and 20% on top of that added
        // a further nothing, so the rate stayed where it was.
        description: 'The club, swung flat: 100% ATK to one enemy, and a 50% chance to ' +
          'push one of their cooldowns back a turn.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [
          { type: 'damage', mult: 1.00 },
          { type: 'cooldownPush', turns: 1, chance: 0.5 },
        ],
        levelUps: [
          { mult: 0.1 },
          { debuffChance: 0.25 },
          { mult: 0.1 },
          { debuffChance: 0.25 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'crook_pot_lid', name: 'Pot Lid',
        icon: 'assets/icons/fc1141.png',
        description: 'He takes the shield off his back and puts it through the line: 110% ' +
          'ATK to the enemy FRONT row.',
        cooldown: 4, targeting: 'front-enemies', animation: 'idle', impact: 'slam',
        effects: [{ type: 'damage', mult: 1.10 }],
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
        id: 'crook_pick_a_pocket', name: 'Pick a Pocket',
        icon: 'assets/icons/fc1272.png',
        // A READY skill is pushed too, which matters: without it the
        // effect does nothing at all to a fresh enemy, and a fresh enemy
        // is exactly the one worth using it on. Capped against each
        // skill's own cooldown, so nothing is ever shelved for longer
        // than a fresh cast of it would take.
        description: 'Straight into the pack: 140% ATK to one enemy, and a 50% chance to ' +
          'push every one of their cooldowns back 2 turns — the ones they had ready ' +
          'included.',
        cooldown: 7, targeting: 'enemy', animation: 'idle', impact: 'strike_purple',
        effects: [
          { type: 'damage', mult: 1.40 },
          { type: 'cooldownPush', turns: 2, chance: 0.5 },
        ],
        levelUps: [
          { mult: 0.1 },
          { debuffChance: 0.25 },
          { mult: 0.1 },
          { debuffChance: 0.25 },
          { refund: 1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Light Fingers',
      icon: 'assets/icons/fc1066.png',
      // Reads the enemy's COOLDOWNS, which nothing else does. It pays
      // against anybody who has just spent a skill, so it is never dead
      // -- and his own seven is the biggest single thing that can
      // trigger it, which is what welds the kit together.
      //
      // Slot-one fillers are skipped, exactly as they are by the push:
      // a skill on a zero cooldown is never "away", so counting it would
      // pay him for nothing.
      description: 'He charges for what you have already spent: Crook deals 12% more ' +
        'damage for every skill the target has on cooldown.',
      hooks: {
        damageDealtMult(unit, target) {
          if (!target || !Array.isArray(target.abilities)) return 1;
          const away = target.abilities.filter((a) =>
            a.cooldownRemaining > 0 && a.def && a.def.cooldown > 0).length;
          return 1 + 0.12 * away;
        },
      },
    },
    positional: POSITIONALS.fence,
  },

  // The plague doctor, and the sect's supply line. Everything the
  // Hollowbone pack does is priced per curse -- Rigor deepens each one,
  // Deadweight drags 3% of speed off each one, Dry Bones asks only
  // whether a bird is cursed at all -- and none of the four birds
  // written before him lands many. Pox is where the curses come from.
  //
  // His passive multiplies the COUNT, which is the one term in that
  // arithmetic nothing else touches: the element sells whether a curse
  // lands and how long it lasts, the pack sells how hard it bites, the
  // Nightflowers sell what it is worth to hit somebody wearing one. How
  // MANY there are was free.
  //
  // That it feeds two of his own pack's tiers is deliberate and it is
  // the Phoenix Court's arrangement, not an accident: their dealers set
  // the fires their court is paid for, and the two halves are worth
  // fielding together for exactly that reason.
  pox: {
    id: 'pox',
    element: 'dark',
    name: 'Pox',
    title: 'Bottlebearer of the Hollowbone',
    rarity: 3,
    // Declared, because the derivation gets him wrong. The bench and
    // Tags both read a kit for what it DOES, and all three of his
    // skills carry a damage line, so he classified as a back-row
    // dealer -- which is not what he is for. The damage is the delivery
    // mechanism; the curses are the hero.
    role: 'support',
    // Enough attack to matter, because his poison is priced off it and
    // a poisoner whose poison does nothing is a hero who casts three
    // status effects and goes home.
    stats: { hp: 1300, atk: 176, def: 100, speed: 122 },
    tint: { body: '#2a2438', helm: '#e8dcc0', weapon: '#8a5ac8', shield: '#6a4a9a' },
    sprite: {
      displayH: 92,
      strips: {
        idle: { src: 'assets/heroes/hollowbone/poxidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'pox_draught', name: 'Draught',
        icon: 'assets/icons/fc823.png',
        // Unflavoured on purpose: `burn` is fire's word and everything
        // that reads it (the Court's tiers, oil, Cleo's fortunes) is
        // fire's business. This is just something in you.
        description: 'Whatever is in the bottle, in them: 55% ATK, and 30% ATK a turn ' +
          'for 3 turns after.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike_purple',
        // `pct`, not `mult`: a DoT prices its tick off ATK through its
        // own field and deepens on `debuffPower`, not on the damage
        // rung. Written with `mult` first, it applied NaN and the
        // description audit said so on the same run.
        effects: [
          { type: 'damage', mult: 0.55 },
          { type: 'dot', pct: 0.30, turns: 3 },
        ],
        levelUps: [
          { mult: 0.1 },
          { debuffPower: 0.05 },
          { mult: 0.1 },
          { debuffPower: 0.05 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'pox_bad_air', name: 'Bad Air',
        icon: 'assets/icons/fc1141.png',
        description: 'He unstoppers it into the wind: a 50% chance on EVERY enemy to lose ' +
          '25% ATK for 3 turns.',
        cooldown: 4, targeting: 'all-enemies', animation: 'idle', impact: 'strike_purple',
        effects: [{ type: 'debuff', stat: 'atk', mult: 0.75, turns: 3, chance: 0.5 }],
        levelUps: [
          { debuffPower: 0.05 },
          { debuffChance: 0.25 },
          { debuffPower: 0.05 },
          { debuffChance: 0.25 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'pox_stopper_the_bottle', name: 'Stopper the Bottle',
        icon: 'assets/icons/fc1272.png',
        // Noctelle's heal block is narrow and deep -- one enemy, twice.
        // This one is wide and shallow, which is the same relationship
        // Aster's mark has with Doom Mark, and it is the sect's answer
        // to a healer comp standing beside the pack's own Dry Bones.
        description: 'Nothing gets in and nothing gets better: 90% ATK to ALL enemies, ' +
          'with a 50% chance on each to be cut off from healing for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'idle', impact: 'slam',
        effects: [
          { type: 'damage', mult: 0.90 },
          { type: 'healBlock', turns: 2, chance: 0.5 },
        ],
        // No `duration` rung: it lengthens buffs, wards and mends, never
        // a hex and never a block (see Abilities, case 'debuff'), so one
        // here would have bought nothing.
        levelUps: [
          { mult: 0.1 },
          { debuffChance: 0.25 },
          { mult: 0.1 },
          { debuffChance: 0.25 },
          { mult: 0.1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'It Gets Around',
      icon: 'assets/icons/fc1066.png',
      // A COPY, and the original is untouched -- this rescues nobody
      // and doubles nothing about the bird that was aimed at. The copy
      // is never itself spread: only the affliction actually cast is
      // ever offered to the roll, so there is no chain and no latch is
      // needed to stop one.
      description: 'A plague does not stay where it is put: every curse Pox lands has a ' +
        '30% chance to take a second enemy as well.',
      hooks: { debuffSpread: 0.30 },
    },
    positional: POSITIONALS.upwind,
  },

  // The lantern, and the sect's last support. What is in the glass is
  // whatever the fight has cost so far -- both sides, no favourites --
  // and everything he hands out is worth more for it.
  //
  // He shares an INPUT with the Nightflowers' fourth tier, which counts
  // the same bodies, and that is worth being straight about rather than
  // hiding: theirs turns the count into damage for everyone holding it,
  // his turns it into stronger blessings from one bird. Same reading,
  // different output, different sect -- and a party running both is
  // stacking two effects rather than compounding one.
  //
  // The real problem with a hero whose value is a running total is turn
  // one, when the total is zero. His hex is the answer and it does
  // nothing else: the lantern opens already holding three.
  malachar: {
    id: 'malachar',
    element: 'dark',
    name: 'Malachar',
    title: 'Lanternbearer of the Hollowbone',
    rarity: 4,
    stats: { hp: 1560, atk: 118, def: 116, speed: 120 },
    tint: { body: '#2a2438', helm: '#6a4a9a', weapon: '#c86ae8', shield: '#8a5ac8' },
    sprite: {
      displayH: 96,
      // Authored facing LEFT -- the cowl and the beak both point that
      // way on the strip. The art is never touched; the def says which
      // way it was drawn.
      faceLeft: true,
      strips: {
        idle: { src: 'assets/heroes/hollowbone/malacharidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'malachar_wickwork', name: 'Wickwork',
        icon: 'assets/icons/fc866.png',
        // SPEED, and not attack: a cd0 single-ally attack blessing is
        // Kiri's Pinwheel exactly. Speed is also the better gift here --
        // the sect's 2pc buys it and Rigor turns it into curse depth, so
        // a wing he hurries is a wing whose hexes bite harder.
        description: 'He turns the wick up under one of them: an ally gains +15% Speed ' +
          'for 3 turns.',
        cooldown: 0, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'buff', stat: 'speed', mult: 1.15, turns: 3 }],
        levelUps: [
          { buffPower: 0.05 },
          { duration: 1 },
          { buffPower: 0.05 },
          { buffPower: 0.05 },
          { buffPower: 0.05 },
        ],
      },
      {
        id: 'malachar_hold_it_up', name: 'Hold It Up',
        icon: 'assets/icons/fc1073.png',
        // Two stats, not one: a party-wide +20% ATK at cd5 is Orien's
        // Handfuls of Sun exactly, and the roster said so the moment it
        // was written. Two smaller blessings is also the better shape
        // for this hero -- the passive deepens BOTH, so the lantern is
        // worth twice as much on a skill that hands out twice as many.
        description: 'He lifts the glass and the whole flock can see: ALL allies gain ' +
          '+15% ATK and +15% DEF for 3 turns.',
        cooldown: 5, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.15, turns: 3 },
          { type: 'buff', stat: 'def', mult: 1.15, turns: 3 },
        ],
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
        id: 'malachar_what_it_kept', name: 'What It Kept',
        icon: 'assets/icons/fc1272.png',
        // The sect's only revive, and the one skill of his the passive
        // does NOT touch -- a revive is not a blessing, so it carries
        // its own scaling off the same count. The lantern gives back
        // more the more it has taken in, which is the hero said twice.
        description: 'He opens the glass over a body: a fallen ally is back up at 30% ' +
          'health, plus 5% for every unit that has died this battle.',
        cooldown: 8, targeting: 'dead-ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'revive', pct: 0.30, perDeath: 0.05 }],
        levelUps: [
          { heal: 0.05 },
          { heal: 0.05 },
          { cooldown: -1 },
          { heal: 0.05 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'The Lantern Fills',
      icon: 'assets/icons/fc1066.png',
      // `buffPowerAdd` in its function form, the same shape Kiri's hover
      // uses -- except hers reads WHO is receiving and this reads what
      // the fight has cost. Capped at eight bodies, which on a 7v7 board
      // is most of one side gone: past that a support handing out +60%
      // blessings is not a payoff, it is a different game.
      description: 'The glass keeps what the fight takes: every blessing Malachar hands ' +
        'out is 5% stronger for each unit that has died this battle, up to 40%.',
      hooks: {
        buffPowerAdd(unit) {
          const b = (typeof Battle !== 'undefined' && Battle.active) || null;
          const head = unit.hookSources().reduce(
            (n, p) => n + ((p.hooks && p.hooks.lanternStart) || 0), 0);
          return Math.min(0.40, 0.05 * ((b ? b.deaths : 0) + head));
        },
      },
    },
    positional: POSITIONALS.struck_early,
  },
});
