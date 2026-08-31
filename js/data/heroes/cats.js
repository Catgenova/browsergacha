// The Stillwater cats. Sect No. 13, water, and the first order on the
// roster built around the ACTION BAR rather than around damage, healing
// or hexes.
//
// The pack was written before a single cat (js/races.js):
//
//   2pc Cold Current  landed hits have a 15% chance to cut 20% off the
//                     victim's action bar
//   3pc Undertow      action bar taken from an enemy is handed to
//                     whoever took it
//   4pc Still Water   the party's action bars cannot be pushed backwards
//
// Every kit below is written INTO that frame, and two consequences of
// it shape all nine:
//
// WIDTH IS WORTH MORE HERE THAN ANYWHERE ELSE. Cold Current rolls once
// per target a cast actually damaged (Abilities.execute), so a sweep
// over five bodies rolls five times where a single-target hit rolls
// once. That is why the 1-star opens on a front-row sweep and why the
// damage dealers reach wide rather than deep.
//
// AND A DRAIN IS INCOME, NOT DENIAL. Under Undertow every point taken
// off an enemy lands on the cat that took it, so `turnMeter` effects
// with a negative amount are this sect's damage spell as much as its
// control. They are still contested -- drainMeter rolls accuracy against
// resistance and refuses outright against a meterGuard -- which is the
// valve that stops a party-wide drain being a free extra turn.
//
// The nine hold the bird shape, 1/2/3/2/1, because water carries every
// rarity band. Statlines here are RATIOS: js/data/balance.js solves each
// one to the shared power budget and applies the rarity shelf, so what
// is written below says "shaped like a tank" or "shaped like glass" and
// not "is worth this much". Speed is the exception -- it is identity,
// not budget, and is the number that decides who acts first.
//
// All nine sheets are authored facing RIGHT, so none carries a
// `faceLeft` flag.

const CATS = {
  // ---- 1-star ------------------------------------------------------
  // A very small animal behind a very long spear. The whole joke is the
  // reach, and the reach is what makes it a front-row sweeper at
  // cooldown 0 -- which at 1 star is the cheapest Cold Current engine
  // the sect owns. Five bodies in the front rank is five drain rolls a
  // turn from a hero anybody can field on day one.
  tip: {
    id: 'tip',
    element: 'water',
    name: 'Tip',
    title: 'The Long Needle of Stillwater',
    rarity: 1,
    // Glass with a fast clock: it wants turns, not fights.
    stats: { hp: 760, atk: 128, def: 52, speed: 126 },
    tint: { body: '#3a6ea8', helm: '#8ecbff', weapon: '#c8e4ff', shield: '#2a4a70' },
    sprite: {
      displayH: 62,
      strips: {
        idle: { src: 'assets/heroes/stillwater/Tipidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'tip_needle', name: 'Needle',
        icon: 'assets/icons/fc1000.png',
        description: 'Enemy front row: 62% ATK damage.',
        cooldown: 0, targeting: 'front-enemies', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 0.62 }],
        levelUps: [
          { mult: 0.08 },
          { mult: 0.08 },
          { mult: 0.08 },
          { mult: 0.08 },
          { mult: 0.08 },
        ],
      },
    ],
    passive: {
      name: 'Small Target',
      icon: 'assets/icons/fc1001.png',
      description: '+20% Dodge while at full HP.',
      hooks: {
        dodgeAdd: (unit) => (unit.hp >= unit.maxHp ? 0.20 : 0),
      },
    },
    positional: POSITIONALS.long_needle,
  },

  // ---- 2-star ------------------------------------------------------
  // The brawler. Where Tip is width, Brock is the single body taken
  // apart: his opener is the sect's cheapest DIRECT drain, and under
  // Undertow that is 15% of a bar into his own every turn for free.
  brock: {
    id: 'brock',
    element: 'water',
    name: 'Brock',
    title: 'Alley Work',
    rarity: 2,
    stats: { hp: 1080, atk: 122, def: 74, speed: 114 },
    tint: { body: '#d88a4a', helm: '#3a6ea8', weapon: '#8ecbff', shield: '#2a4a70' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/stillwater/brockidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'brock_jab', name: 'Jab',
        icon: 'assets/icons/fc1002.png',
        description: 'One enemy: 115% ATK damage; 50% chance: -15% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.15 },
          { type: 'turnMeter', amount: -0.15, chance: 0.50 },
        ],
        levelUps: [
          { mult: 0.10 },
          { debuffChance: 0.25 },
          { mult: 0.10 },
          { meter: 0.05 },
          { debuffChance: 0.25 },
        ],
      },
      {
        id: 'brock_alley_work', name: 'Alley Work',
        icon: 'assets/icons/fc1004.png',
        // Three DISTINCT bodies, which is three Cold Current rolls --
        // the reason this is worth more on a Stillwater board than the
        // same damage aimed once.
        description: '3 random enemies: 85% ATK damage.',
        cooldown: 3, targeting: 'random-enemies', targetCount: 3,
        animation: 'idle', impact: 'punch_blast',
        effects: [{ type: 'damage', mult: 0.85 }],
        levelUps: [
          { mult: 0.10 },
          { cooldown: -1 },
          { mult: 0.10 },
          { mult: 0.10 },
          { cooldown: -1 },
          { mult: 0.10 },
        ],
      },
    ],
    passive: {
      name: 'Quick Paws',
      icon: 'assets/icons/fc1005.png',
      description: 'On dealing damage: 15% chance to gain 8% turn meter.',
      hooks: {
        onDealtDamage(unit) {
          if (Math.random() >= 0.15) return null;
          unit.turnMeter += CONFIG.TURN_METER_MAX * 0.08;
          return { label: 'Quick Paws',
            floats: [{ target: unit, text: '▲', color: '#8ecbff' }] };
        },
      },
    },
    positional: POSITIONALS.close_quarters,
  },

  // The archer, and the sect's first MASS drain. Volley is the shape the
  // whole order is built to throw: every enemy damaged rolls Cold
  // Current, every enemy rolls the written drain on top, and Undertow
  // pays all of it into Friday. On a full board it is the biggest single
  // swing of turn order a 2-star has ever had access to -- which is why
  // it sits behind a 4-turn cooldown and a contested roll per victim.
  friday: {
    id: 'friday',
    element: 'water',
    name: 'Friday',
    title: 'Looses on the Turn',
    rarity: 2,
    stats: { hp: 940, atk: 134, def: 62, speed: 120 },
    tint: { body: '#e8a45a', helm: '#3a6ea8', weapon: '#c8a86a', shield: '#2a4a70' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/stillwater/fridayidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'friday_loose', name: 'Draw and Loose',
        icon: 'assets/icons/fc1006.png',
        description: 'One enemy and their row: 65% ATK damage.',
        cooldown: 0, targeting: 'enemy-row', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 0.65 }],
        levelUps: [
          { mult: 0.08 },
          { mult: 0.08 },
          { mult: 0.08 },
          { mult: 0.08 },
          { mult: 0.08 },
        ],
      },
      {
        id: 'friday_volley', name: 'Volley',
        icon: 'assets/icons/fc1007.png',
        description: 'All enemies: 55% ATK damage; 50% chance: -20% turn meter.',
        cooldown: 4, targeting: 'all-enemies', animation: 'idle', impact: 'strike',
        effects: [
          { type: 'damage', mult: 0.55 },
          { type: 'turnMeter', amount: -0.20, chance: 0.50 },
        ],
        levelUps: [
          { debuffChance: 0.25 },
          { mult: 0.08 },
          { cooldown: -1 },
          { debuffChance: 0.25 },
          { meter: 0.05 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Sights',
      icon: 'assets/icons/fc1008.png',
      // Reads the state the rest of the sect creates: everything the
      // cats do pushes bars down, and this is what makes a pushed-down
      // bar worth pushing.
      description: '+25% damage to enemies whose action bar is below a quarter.',
      hooks: {
        damageDealtMult(unit, target) {
          if (!target) return 1;
          return target.turnMeter < CONFIG.TURN_METER_MAX * 0.25 ? 1.25 : 1;
        },
      },
    },
    positional: POSITIONALS.loosed_early,
  },

  // ---- 3-star ------------------------------------------------------
  // The wall, and the joke in the name is the point: Tiny is the largest
  // animal in the sect. A tank whose damage scales off DEF, so the
  // statline it wants and the statline it fights with are the same one.
  //
  // Dead Weight is the reason a Stillwater party can open a fight
  // already ahead: a party-wide drain on a body that was never going to
  // out-damage anybody, converted by Undertow into a bar that lets the
  // wall act again before the enemy does.
  tiny: {
    id: 'tiny',
    element: 'water',
    name: 'Tiny',
    title: 'The Weight of Stillwater',
    rarity: 3,
    // Twice anyone's health, a third of the swing, and slow.
    stats: { hp: 2260, atk: 84, def: 168, speed: 94 },
    tint: { body: '#c8c8d8', helm: '#3a6ea8', weapon: '#8a9ab0', shield: '#2a4a70' },
    sprite: {
      displayH: 92,
      strips: {
        idle: { src: 'assets/heroes/stillwater/Tinyidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'tiny_settle', name: 'Settle',
        icon: 'assets/icons/fc1009.png',
        description: 'One enemy: 85% DEF damage.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'slash_slam',
        effects: [{ type: 'damageDef', mult: 0.85 }],
        levelUps: [
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
        ],
      },
      {
        id: 'tiny_immovable', name: 'Immovable',
        icon: 'assets/icons/fc1018.png',
        description: 'Self: shield worth 130% DEF for 3 turns; draws enemy attacks for 2 turns.',
        cooldown: 4, targeting: 'self', animation: 'idle', impact: 'shield_bubble',
        effects: [
          { type: 'shield', defMult: 1.30, turns: 3 },
          { type: 'taunt', turns: 2 },
        ],
        levelUps: [
          { mult: 0.15 },
          { cooldown: -1 },
          { mult: 0.15 },
          { duration: 1 },
          { cooldown: -1 },
          { mult: 0.15 },
        ],
      },
      {
        id: 'tiny_dead_weight', name: 'Dead Weight',
        icon: 'assets/icons/fc1020.png',
        description: 'All enemies: 50% chance: -25% turn meter.',
        cooldown: 5, targeting: 'all-enemies', animation: 'idle', impact: 'water_ball',
        effects: [{ type: 'turnMeter', amount: -0.25, chance: 0.50 }],
        levelUps: [
          { debuffChance: 0.25 },
          { cooldown: -1 },
          { meter: 0.05 },
          { debuffChance: 0.25 },
          { cooldown: -1 },
          { meter: 0.05 },
          { meter: 0.05 },
        ],
      },
    ],
    passive: {
      name: 'Loafed',
      icon: 'assets/icons/fc1021.png',
      // Through drainMeter, so it obeys the guard and the resistance
      // contest like every other taking -- and so Undertow pays it.
      description: 'When struck: the attacker loses 8% turn meter.',
      hooks: {
        onStruck(unit, attacker) {
          if (!attacker || !attacker.alive || attacker.team === unit.team) return null;
          const r = Abilities.drainMeter(unit, attacker, 0.08);
          if (!r || !(r.amount < 0)) return null;
          return { label: 'Loafed',
            message: `${attacker.name} loses ground against ${unit.name}.`,
            floats: [{ target: attacker, text: 'METER ▼', color: '#d78aff' }] };
        },
      },
    },
    positional: POSITIONALS.settled_low,
  },

  // The disciplined striker: an armoured tiger with a polearm, and the
  // sect's answer to "who actually kills things". Orr is paid for the
  // board the other eight create -- every bar the cats push down makes
  // his passive deeper, so he is worth least on turn one and most on
  // turn five.
  orr: {
    id: 'orr',
    element: 'water',
    name: 'Orr',
    title: 'Halberd of the Slack Tide',
    rarity: 3,
    stats: { hp: 1320, atk: 168, def: 96, speed: 108 },
    tint: { body: '#e08a3a', helm: '#2a6a8a', weapon: '#8ecbff', shield: '#1a4a6a' },
    sprite: {
      displayH: 88,
      strips: {
        idle: { src: 'assets/heroes/stillwater/Orridle (1).png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'orr_halberd_sweep', name: 'Halberd Sweep',
        icon: 'assets/icons/fc1022.png',
        // Wider than a front sweep and cheaper per body: the haft
        // reaches the rank behind the one it is aimed at, which is the
        // shape Cold Current wants and the reason his opener is not
        // simply another front-row swing.
        description: 'Enemy front and center rows: 58% ATK damage.',
        cooldown: 0, targeting: 'front-and-center-enemies',
        animation: 'idle', impact: 'horizonal_slash',
        effects: [{ type: 'damage', mult: 0.58 }],
        levelUps: [
          { mult: 0.08 },
          { mult: 0.08 },
          { mult: 0.08 },
          { mult: 0.08 },
          { mult: 0.08 },
        ],
      },
      {
        id: 'orr_run_through', name: 'Run Through',
        icon: 'assets/icons/fc1028.png',
        description: 'One enemy: 165% ATK damage (ignores 25% DEF).',
        cooldown: 3, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.65, ignoreDef: 0.25 }],
        levelUps: [
          { mult: 0.15 },
          { mult: 0.15 },
          { cooldown: -1 },
          { mult: 0.15 },
          { cooldown: -1 },
          { mult: 0.15 },
        ],
      },
      {
        id: 'orr_undertow_cut', name: 'Undertow Cut',
        icon: 'assets/icons/fc1029.png',
        description: 'Enemy back row: 130% ATK damage; 50% chance: -25% turn meter.',
        cooldown: 5, targeting: 'back-enemies',
        animation: 'idle', impact: 'slash_effect',
        effects: [
          { type: 'damage', mult: 1.30 },
          { type: 'turnMeter', amount: -0.25, chance: 0.50 },
        ],
        levelUps: [
          { mult: 0.12 },
          { debuffChance: 0.25 },
          { cooldown: -1 },
          { meter: 0.05 },
          { debuffChance: 0.25 },
          { cooldown: -1 },
          { mult: 0.12 },
        ],
      },
    ],
    passive: {
      name: 'Caught Between Tides',
      icon: 'assets/icons/fc1070.png',
      description: '+8% damage for each enemy whose action bar is below half, to +32%.',
      hooks: {
        damageDealtMult(unit) {
          const b = typeof Battle !== 'undefined' ? Battle.active : null;
          if (!b) return 1;
          const slack = b.livingUnits(unit.enemyTeam())
            .filter((u) => u.turnMeter < CONFIG.TURN_METER_MAX * 0.5).length;
          return 1 + 0.08 * Math.min(4, slack);
        },
      },
    },
    positional: POSITIONALS.the_long_haft,
  },

  // The court. Princess is the giving half of the sect: where the rest
  // take bars off enemies, she hands them to allies, and the gift ledger
  // (Unit.meterGifts) credits her for the damage the bought turn does --
  // so a support with no damage line of her own still reads on the
  // meter.
  princess: {
    id: 'princess',
    element: 'water',
    name: 'Princess',
    title: 'Who Decides Who Goes',
    rarity: 3,
    stats: { hp: 1240, atk: 96, def: 108, speed: 116 },
    tint: { body: '#f0ead8', helm: '#3a6ea8', weapon: '#c8e4ff', shield: '#8ecbff' },
    sprite: {
      displayH: 84,
      strips: {
        idle: { src: 'assets/heroes/stillwater/princessidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'princess_summons', name: 'Summons',
        icon: 'assets/icons/fc1071.png',
        description: 'One ally: +22% turn meter.',
        cooldown: 0, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'turnMeter', amount: 0.22 }],
        levelUps: [
          { meter: 0.03 },
          { meter: 0.03 },
          { meter: 0.03 },
          { meter: 0.03 },
          { meter: 0.03 },
        ],
      },
      {
        id: 'princess_court_order', name: 'Court Order',
        icon: 'assets/icons/fc1072.png',
        description: 'All allies: +14% turn meter; +15% ATK for 2 turns.',
        cooldown: 3, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [
          { type: 'turnMeter', amount: 0.14 },
          { type: 'buff', stat: 'atk', mult: 1.15, turns: 2 },
        ],
        levelUps: [
          { meter: 0.03 },
          { buffPower: 0.05 },
          { cooldown: -1 },
          { meter: 0.03 },
          { buffPower: 0.05 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'princess_precedence', name: 'Precedence',
        icon: 'assets/icons/fc1074.png',
        description: 'One ally: +60% turn meter; removes 1 debuff.',
        cooldown: 5, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        effects: [
          { type: 'turnMeter', amount: 0.60 },
          { type: 'cleanse', count: 1 },
        ],
        levelUps: [
          { meter: 0.05 },
          { cleanseCount: 1 },
          { cooldown: -1 },
          { meter: 0.05 },
          { cooldown: -1 },
          { meter: 0.05 },
          { cleanseCount: 1 },
        ],
      },
    ],
    passive: {
      name: 'Protocol',
      icon: 'assets/icons/fc1076.png',
      description: 'Start of each turn: +8% turn meter to the ally with the lowest action bar.',
      hooks: {
        onTurnStart(unit, battle) {
          if (!battle) return null;
          const mates = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (!mates.length) return null;
          const last = mates.reduce((a, b) => (b.turnMeter < a.turnMeter ? b : a));
          last.turnMeter += CONFIG.TURN_METER_MAX * 0.08;
          return { label: 'Protocol',
            message: `${unit.name} sends ${last.name} ahead.`,
            floats: [{ target: last, text: '▲', color: '#8ecbff' }] };
        },
      },
    },
    positional: POSITIONALS.order_of_march,
  },

  // ---- 4-star ------------------------------------------------------
  // The orb caster, and the sect's pivot: Standing Wave is the only
  // skill in the game that moves BOTH bars at once, taking from every
  // enemy and paying every ally in the same cast. Under Undertow the
  // taken half also lands on Sands, so one button swings the turn order
  // three ways.
  sands: {
    id: 'sands',
    element: 'water',
    name: 'Sands',
    title: 'Reads the Water',
    rarity: 4,
    stats: { hp: 1280, atk: 128, def: 92, speed: 118 },
    tint: { body: '#8a9ab8', helm: '#3a6ea8', weapon: '#8ecbff', shield: '#2a4a70' },
    sprite: {
      displayH: 84,
      strips: {
        idle: { src: 'assets/heroes/stillwater/sandsidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'sands_undertow', name: 'Set Against',
        icon: 'assets/icons/fc1077.png',
        description: 'One enemy: 80% ATK damage; 50% chance: -20% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'water_ball',
        effects: [
          { type: 'damage', mult: 0.80 },
          { type: 'turnMeter', amount: -0.20, chance: 0.50 },
        ],
        levelUps: [
          { mult: 0.08 },
          { debuffChance: 0.25 },
          { mult: 0.08 },
          { debuffChance: 0.25 },
          { meter: 0.04 },
        ],
      },
      {
        id: 'sands_standing_wave', name: 'Standing Wave',
        icon: 'assets/icons/fc1078.png',
        description: 'All enemies: 50% chance: -18% turn meter. Self: +12% turn meter.',
        cooldown: 4, targeting: 'all-enemies', animation: 'idle', impact: 'up_splash',
        effects: [{ type: 'turnMeter', amount: -0.18, chance: 0.50 }],
        selfEffects: [{ type: 'turnMeter', amount: 0.12 }],
        levelUps: [
          { debuffChance: 0.25 },
          { cooldown: -1 },
          { meter: 0.04 },
          { debuffChance: 0.25 },
          { cooldown: -1 },
          { meter: 0.04 },
        ],
      },
      {
        id: 'sands_glassing_off', name: 'Glassing Off',
        icon: 'assets/icons/fc1079.png',
        description: 'All allies: shield worth 100% ATK for 3 turns; +18% turn meter.',
        cooldown: 5, targeting: 'all-allies', animation: 'idle', impact: 'shield_bubble',
        effects: [
          { type: 'shield', mult: 1.00, turns: 3 },
          { type: 'turnMeter', amount: 0.18 },
        ],
        levelUps: [
          { mult: 0.15 },
          { meter: 0.04 },
          { cooldown: -1 },
          { mult: 0.15 },
          { cooldown: -1 },
          { meter: 0.04 },
          { mult: 0.15 },
        ],
      },
    ],
    passive: {
      name: 'Set of the Tide',
      icon: 'assets/icons/fc1081.png',
      description: 'On dealing damage: +5% turn meter to the ally with the lowest action bar.',
      hooks: {
        onDealtDamage(unit) {
          const b = typeof Battle !== 'undefined' ? Battle.active : null;
          if (!b) return null;
          const mates = b.livingUnits(unit.team).filter((u) => u !== unit);
          if (!mates.length) return null;
          const last = mates.reduce((a, x) => (x.turnMeter < a.turnMeter ? x : a));
          last.turnMeter += CONFIG.TURN_METER_MAX * 0.05;
          return { label: 'Set of the Tide',
            floats: [{ target: last, text: '▲', color: '#8ecbff' }] };
        },
      },
    },
    positional: POSITIONALS.reads_the_water,
  },

  // The comfort. Donut is the only cat who mends, and the mending is
  // wired to the same axis as everything else: every heal she lands also
  // moves the patient up the order, so a party she is keeping alive is
  // also a party acting more often.
  donut: {
    id: 'donut',
    element: 'water',
    name: 'Donut',
    title: 'The Warm Spot',
    rarity: 4,
    stats: { hp: 1620, atk: 104, def: 122, speed: 106 },
    tint: { body: '#f4f0e4', helm: '#8ecbff', weapon: '#c8e4ff', shield: '#3a6ea8' },
    sprite: {
      displayH: 82,
      strips: {
        idle: { src: 'assets/heroes/stillwater/donutidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'donut_cushion', name: 'Cushion',
        icon: 'assets/icons/fc1082.png',
        description: 'The 2 lowest-health allies: heals 12% of caster max HP.',
        cooldown: 0, targeting: 'lowest-allies', targetCount: 2,
        animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'healHpPct', pct: 0.12 }],
        levelUps: [
          { heal: 0.05 },
          { heal: 0.05 },
          { heal: 0.05 },
          { heal: 0.05 },
          { heal: 0.05 },
        ],
      },
      {
        id: 'donut_warm_spot', name: 'Warm Spot',
        icon: 'assets/icons/fc1083.png',
        description: 'All allies: heals 10% of caster max HP; +10% turn meter.',
        cooldown: 4, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [
          { type: 'healHpPct', pct: 0.10 },
          { type: 'turnMeter', amount: 0.10 },
        ],
        levelUps: [
          { heal: 0.05 },
          { meter: 0.03 },
          { cooldown: -1 },
          { heal: 0.05 },
          { cooldown: -1 },
          { meter: 0.03 },
        ],
      },
      {
        id: 'donut_curl_up', name: 'Curl Up',
        icon: 'assets/icons/fc1085.png',
        description: 'All allies: shield worth 70% ATK for 3 turns; removes 1 debuff.',
        cooldown: 5, targeting: 'all-allies', animation: 'idle', impact: 'shield_bubble',
        effects: [
          { type: 'shield', mult: 0.70, turns: 3 },
          { type: 'cleanse', count: 1 },
        ],
        levelUps: [
          { mult: 0.15 },
          { cleanseCount: 1 },
          { cooldown: -1 },
          { mult: 0.15 },
          { cooldown: -1 },
          { mult: 0.15 },
          { cleanseCount: 1 },
        ],
      },
    ],
    passive: {
      name: 'Purr',
      icon: 'assets/icons/fc1086.png',
      description: 'On healing an ally: that ally gains 6% turn meter.',
      hooks: {
        onAllyHealed(unit, healed) {
          if (!healed || healed === unit) return null;
          healed.turnMeter += CONFIG.TURN_METER_MAX * 0.06;
          return { label: 'Purr',
            floats: [{ target: healed, text: '▲', color: '#8ecbff' }] };
        },
      },
    },
    positional: POSITIONALS.the_warm_spot,
  },

  // ---- 5-star ------------------------------------------------------
  // The anchor, and the sect's thesis said once at full volume. Tub is a
  // FRONT-LINE SUPPORT: it stands where the blows land and its whole kit
  // is turn order, which is the shape nothing else on the roster has.
  //
  // Slack Tide is the ceiling of the design -- every enemy loses nearly
  // half a bar, every ally gains a fifth of one, and under Undertow the
  // taken half lands on Tub. Behind a 6-turn cooldown and a contested
  // roll per victim, because a party that could do that twice would not
  // be playing a fight, it would be watching one.
  tub: {
    id: 'tub',
    element: 'water',
    name: 'Tub',
    title: 'Still Water Runs Deep',
    rarity: 5,
    stats: { hp: 2040, atk: 132, def: 148, speed: 102 },
    tint: { body: '#c8a86a', helm: '#2a6a8a', weapon: '#8ecbff', shield: '#1a4a6a' },
    sprite: {
      displayH: 96,
      strips: {
        idle: { src: 'assets/heroes/stillwater/Tubidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'tub_anchor', name: 'Anchor',
        icon: 'assets/icons/fc1087.png',
        description: 'One enemy: 105% DEF damage; 50% chance: -15% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'slash_slam',
        effects: [
          { type: 'damageDef', mult: 1.05 },
          { type: 'turnMeter', amount: -0.15, chance: 0.50 },
        ],
        levelUps: [
          { mult: 0.10 },
          { debuffChance: 0.25 },
          { mult: 0.10 },
          { debuffChance: 0.25 },
          { meter: 0.04 },
        ],
      },
      {
        id: 'tub_breakwater', name: 'Haul Out',
        icon: 'assets/icons/fc1090.png',
        description: 'All allies: shield worth 120% ATK for 3 turns; +22% turn meter.',
        cooldown: 4, targeting: 'all-allies', animation: 'idle', impact: 'shield_bubble',
        effects: [
          { type: 'shield', mult: 1.20, turns: 3 },
          { type: 'turnMeter', amount: 0.22 },
        ],
        levelUps: [
          { mult: 0.15 },
          { meter: 0.04 },
          { cooldown: -1 },
          { mult: 0.15 },
          { cooldown: -1 },
          { meter: 0.04 },
        ],
      },
      {
        id: 'tub_slack_tide', name: 'Slack Tide',
        icon: 'assets/icons/fc1092.png',
        description: 'All enemies: 50% chance: -40% turn meter. Self: +20% turn meter.',
        cooldown: 6, targeting: 'all-enemies', animation: 'idle', impact: 'water_fall',
        effects: [{ type: 'turnMeter', amount: -0.40, chance: 0.50 }],
        selfEffects: [{ type: 'turnMeter', amount: 0.20 }],
        levelUps: [
          { debuffChance: 0.25 },
          { cooldown: -1 },
          { meter: 0.05 },
          { debuffChance: 0.25 },
          { cooldown: -1 },
          { meter: 0.05 },
          { meter: 0.05 },
        ],
      },
    ],
    passive: {
      name: 'Deep Keel',
      icon: 'assets/icons/fc1093.png',
      // Pulls the party UP to its own line rather than handing out a
      // flat share: a support that has already acted is worth nothing to
      // the order, and this spends its position instead of its turn.
      description: 'Start of each turn: +10% turn meter to every ally with a lower action bar.',
      hooks: {
        onTurnStart(unit, battle) {
          if (!battle) return null;
          const behind = battle.livingUnits(unit.team)
            .filter((u) => u !== unit && u.turnMeter < unit.turnMeter);
          if (!behind.length) return null;
          for (const u of behind) u.turnMeter += CONFIG.TURN_METER_MAX * 0.10;
          return { label: 'Deep Keel',
            message: `${unit.name} brings the line up.`,
            floats: behind.map((u) => ({ target: u, text: '▲', color: '#8ecbff' })) };
        },
      },
    },
    positional: POSITIONALS.deep_keel,
  },
};

Object.assign(HEROES, CATS);

if (typeof module !== 'undefined' && module.exports) module.exports = { CATS };
