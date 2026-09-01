// The Emberpride cats. Sect No. 14, fire, and the pride that charges its
// OWN action bar off aggression -- the second verb of the cat triad,
// where Stillwater takes and Zephyrclaw gives.
//
// The pack was written before a single cat (js/races.js):
//
//   2pc First Blood     drawing first blood from an undamaged enemy pays
//                       the attacker 15% action bar
//   3pc Taste for It    a critical hit refunds 20% of the action bar
//   4pc The Pride Eats  a kill hands the whole party 10% action bar
//
// Every kit below is written INTO that frame, and three consequences of
// it shape all nine:
//
// CRITS ARE TEMPO. Taste for It hands a fifth of a bar back per crit,
// so crit chance is not just damage here -- it is turns. That is why
// the 1-star's only skill is a crit blessing, why the 4-star support
// chants crit onto the whole party, and why the strikers carry critAdd
// riders instead of flat multipliers.
//
// OPENERS MATTER ONCE. First Blood pays per body actually blooded, and
// an enemy is only undamaged once -- so the kits that want it swing
// early and wide rather than deep, and the passives that read a
// target's health split the fight between them: Torra is paid for the
// first swing, Saffra for every one after it, Onyx for the last.
//
// AND KILLS ARE SHARED. The Pride Eats pays the whole table when a hunt
// closes, so the sect wants FINISHERS -- which is why the executes live
// here and not in Stillwater, whose drains want the fight long.
//
// The nine hold the full spread, 1/2/3/2/1, because fire carries every
// rarity band. Statlines are RATIOS (js/data/balance.js solves them to
// the shared budget and applies the rarity shelf); speed is identity,
// not budget. All nine sheets are authored facing RIGHT, so none
// carries a `faceLeft` flag.

const EMBERPRIDE = {
  // ---- 1-star ------------------------------------------------------
  // The smallest cat with the biggest voice. Kiva does not fight; she
  // decides who crits, and under Taste for It a crit blessing is a
  // tempo engine anybody can field on day one.
  kiva: {
    id: 'kiva',
    element: 'fire',
    name: 'Kiva',
    title: 'The Loudest Ember',
    rarity: 1,
    stats: { hp: 820, atk: 96, def: 64, speed: 120 },
    tint: { body: '#e8a04a', helm: '#c83a2a', weapon: '#ffd76a', shield: '#8a2a1a' },
    sprite: {
      displayH: 62,
      strips: {
        idle: { src: 'assets/heroes/emberpride/kivaidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'kiva_cheer_on', name: 'Cheer On',
        icon: 'assets/icons/fc1100.png',
        description: 'One ally: +15% Crit Chance for 2 turns.',
        cooldown: 0, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'buff', stat: 'critChance', add: 0.15, turns: 2 }],
        levelUps: [
          { buffPower: 0.05 },
          { buffPower: 0.05 },
          { duration: 1 },
          { buffPower: 0.05 },
          { buffPower: 0.05 },
        ],
      },
    ],
    passive: {
      name: 'Favorite',
      icon: 'assets/icons/fc1101.png',
      // The opposite read from Princess's Protocol: she sends the
      // stragglers, Kiva sends the killer. The pride's whole economy
      // pays off the hardest hitter acting often.
      description: 'Start of each turn: +5% turn meter to the ally with the highest ATK.',
      hooks: {
        onTurnStart(unit, battle) {
          if (!battle) return null;
          const mates = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (!mates.length) return null;
          const star = mates.reduce((a, b) =>
            (b.effectiveStat('atk') > a.effectiveStat('atk') ? b : a));
          star.turnMeter += CONFIG.TURN_METER_MAX * 0.05;
          return { label: 'Favorite',
            message: `${unit.name} cheers ${star.name} forward.`,
            floats: [{ target: star, text: '▲', color: '#ffb060' }] };
        },
      },
    },
    positional: POSITIONALS.loudest_voice,
  },

  // ---- 2-star ------------------------------------------------------
  // The flail. Torra is the First Blood specialist: her passive pays
  // the same moment the pack does, so her opening swing is worth almost
  // half again what the number on the card says.
  torra: {
    id: 'torra',
    element: 'fire',
    name: 'Torra',
    title: 'Swings First',
    rarity: 2,
    stats: { hp: 1060, atk: 126, def: 72, speed: 115 },
    tint: { body: '#a89078', helm: '#c83a2a', weapon: '#ffd76a', shield: '#6a2a1a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/emberpride/torraidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'torra_flail_swing', name: 'Flail Swing',
        icon: 'assets/icons/fc1102.png',
        description: 'One enemy: 125% ATK damage.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'punch',
        effects: [{ type: 'damage', mult: 1.25 }],
        levelUps: [
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
        ],
      },
      {
        id: 'torra_overhead_wreck', name: 'Overhead Wreck',
        icon: 'assets/icons/fc1103.png',
        // The swing charges the swinger: Emberpride's verb written into
        // her own kit, not just the pack's.
        description: 'One enemy: 195% ATK damage. Self: +10% turn meter.',
        cooldown: 3, targeting: 'enemy', animation: 'idle', impact: 'slash_slam',
        effects: [{ type: 'damage', mult: 1.95 }],
        selfEffects: [{ type: 'turnMeter', amount: 0.10 }],
        levelUps: [
          { mult: 0.15 },
          { cooldown: -1 },
          { meter: 0.03 },
          { mult: 0.15 },
          { cooldown: -1 },
          { mult: 0.15 },
        ],
      },
    ],
    passive: {
      name: 'First Swing',
      icon: 'assets/icons/fc1104.png',
      description: '+25% damage to enemies at full HP.',
      hooks: {
        damageDealtMult: (u, t) =>
          (t && t.maxHp > 0 && t.hp >= t.maxHp ? 1.25 : 1),
      },
    },
    positional: POSITIONALS.first_lunge,
  },

  // The den mother. Nala holds the door, and every blow she takes winds
  // her up -- the pride's aggression economy read from the receiving
  // end.
  nala: {
    id: 'nala',
    element: 'fire',
    name: 'Nala',
    title: 'The Den Door',
    rarity: 2,
    stats: { hp: 1420, atk: 92, def: 118, speed: 104 },
    tint: { body: '#c8a878', helm: '#8a2a1a', weapon: '#e8a04a', shield: '#c83a2a' },
    sprite: {
      displayH: 78,
      strips: {
        idle: { src: 'assets/heroes/emberpride/nalaidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'nala_swat', name: 'Swat',
        icon: 'assets/icons/fc1105.png',
        description: 'One enemy: 90% DEF damage.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'punch',
        effects: [{ type: 'damageDef', mult: 0.90 }],
        levelUps: [
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
        ],
      },
      {
        id: 'nala_stand_over', name: 'Stand Over',
        icon: 'assets/icons/fc1106.png',
        // The bodyguard, not the taunt: Lin's blocker stance, planted by
        // a mother instead of a spearman. She takes the hits aimed at
        // her row and closes her own wounds to keep standing there.
        description: 'Self: takes the hits aimed at front-row allies for 2 turns; heals 10% max HP.',
        cooldown: 4, targeting: 'self', animation: 'idle', impact: 'shield_bubble',
        effects: [
          { type: 'buff', stat: 'blocker', turns: 2 },
          { type: 'healHpPct', pct: 0.10 },
        ],
        levelUps: [
          { heal: 0.05 },
          { cooldown: -1 },
          { duration: 1 },
          { heal: 0.05 },
          { cooldown: -1 },
          { heal: 0.05 },
        ],
      },
    ],
    passive: {
      name: 'Hackles',
      icon: 'assets/icons/fc1107.png',
      description: 'When struck by an enemy: +5% turn meter.',
      hooks: {
        onStruck(unit, attacker) {
          if (!attacker || attacker.team === unit.team) return null;
          unit.turnMeter += CONFIG.TURN_METER_MAX * 0.05;
          return { label: 'Hackles',
            floats: [{ target: unit, text: '▲', color: '#ffb060' }] };
        },
      },
    },
    positional: POSITIONALS.den_door,
  },

  // ---- 3-star ------------------------------------------------------
  // The duelist. Saffra is the sect's crit engine in person: a rider on
  // every swing, paid twice by Taste for It and the fire resonance both.
  saffra: {
    id: 'saffra',
    element: 'fire',
    name: 'Saffra',
    title: 'Every Cut a Promise',
    rarity: 3,
    stats: { hp: 1180, atk: 172, def: 78, speed: 118 },
    tint: { body: '#d88a4a', helm: '#c83a2a', weapon: '#ffd76a', shield: '#8a2a1a' },
    sprite: {
      displayH: 80,
      strips: {
        idle: { src: 'assets/heroes/emberpride/saffraidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'saffra_clean_cut', name: 'Clean Cut',
        icon: 'assets/icons/fc1108.png',
        description: 'One enemy: 105% ATK damage (+20% Crit Chance).',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.05, critAdd: 0.20 }],
        levelUps: [
          { mult: 0.08 },
          { mult: 0.08 },
          { mult: 0.08 },
          { mult: 0.08 },
          { mult: 0.08 },
        ],
      },
      {
        id: 'saffra_two_openings', name: 'Two Openings',
        icon: 'assets/icons/fc1109.png',
        // Two separate blows, two separate crit rolls: under Taste for
        // It this is the cheapest double chance at a refund the sect
        // sells.
        description: 'One enemy: 90% ATK damage, twice.',
        cooldown: 3, targeting: 'enemy', animation: 'idle', impact: 'slash_effect',
        effects: [
          { type: 'damage', mult: 0.90 },
          { type: 'damage', mult: 0.90 },
        ],
        levelUps: [
          { mult: 0.08 },
          { cooldown: -1 },
          { mult: 0.08 },
          { mult: 0.08 },
          { cooldown: -1 },
          { mult: 0.08 },
        ],
      },
      {
        id: 'saffra_red_line', name: 'Red Line',
        icon: 'assets/icons/fc1110.png',
        description: 'One enemy: 210% ATK damage (ignores 20% DEF).',
        cooldown: 5, targeting: 'enemy', animation: 'idle', impact: 'horizonal_slash',
        effects: [{ type: 'damage', mult: 2.10, ignoreDef: 0.20 }],
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
      name: 'Bloodletter',
      icon: 'assets/icons/fc1111.png',
      // Torra's mirror: she is paid for the first swing, Saffra for
      // every one after it.
      description: '+20% damage to enemies below full HP.',
      hooks: {
        damageDealtMult: (u, t) =>
          (t && t.maxHp > 0 && t.hp < t.maxHp ? 1.20 : 1),
      },
    },
    positional: POSITIONALS.vanguard_press,
  },

  // The sniper. Onyx closes hunts, which under The Pride Eats is a
  // party-wide payday -- so his execute is the sect's most social
  // number.
  onyx: {
    id: 'onyx',
    element: 'fire',
    name: 'Onyx',
    title: 'The Last Light You See',
    rarity: 3,
    stats: { hp: 1120, atk: 176, def: 70, speed: 112 },
    tint: { body: '#4a4a52', helm: '#c83a2a', weapon: '#ffd76a', shield: '#2a2a30' },
    sprite: {
      displayH: 80,
      strips: {
        idle: { src: 'assets/heroes/emberpride/onyxidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'onyx_dark_shot', name: 'Dark Shot',
        icon: 'assets/icons/fc1112.png',
        description: 'One enemy: 110% ATK damage.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.10 }],
        levelUps: [
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
        ],
      },
      {
        id: 'onyx_rake_the_back', name: 'Rake the Back',
        icon: 'assets/icons/fc1113.png',
        description: 'Enemy back row: 95% ATK damage.',
        cooldown: 3, targeting: 'back-enemies', animation: 'idle', impact: 'slash_effect',
        effects: [{ type: 'damage', mult: 0.95 }],
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
        id: 'onyx_last_light', name: 'Last Light',
        icon: 'assets/icons/fc1114.png',
        description: 'One enemy: 175% ATK damage (+25% Crit Chance).',
        cooldown: 5, targeting: 'enemy', animation: 'idle', impact: 'horizonal_slash',
        effects: [{ type: 'damage', mult: 1.75, critAdd: 0.25 }],
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
      name: "Executioner's Patience",
      icon: 'assets/icons/fc1115.png',
      description: '+30% damage to enemies below 30% HP.',
      hooks: {
        damageDealtMult: (u, t) =>
          (t && t.maxHp > 0 && t.hp / t.maxHp < 0.30 ? 1.30 : 1),
      },
    },
    positional: POSITIONALS.sunset_perch,
  },

  // The medic. Mei's mends are ATK-priced on purpose: fire's own
  // resonance sells ATK, so a full fire party is also buying her
  // healing without anyone deciding to.
  mei: {
    id: 'mei',
    element: 'fire',
    name: 'Mei',
    title: 'Keeps the Coals In',
    rarity: 3,
    stats: { hp: 1260, atk: 118, def: 96, speed: 110 },
    tint: { body: '#f0e4c8', helm: '#c83a2a', weapon: '#ffd76a', shield: '#e8a04a' },
    sprite: {
      displayH: 78,
      strips: {
        idle: { src: 'assets/heroes/emberpride/meiidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'mei_mend_quick', name: 'Mend Quick',
        icon: 'assets/icons/fc1116.png',
        description: 'One ally: heals 90% ATK.',
        cooldown: 0, targeting: 'lowest-ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'heal', mult: 0.90 }],
        levelUps: [
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
        ],
      },
      {
        id: 'mei_warm_circle', name: 'Warm Circle',
        icon: 'assets/icons/fc1117.png',
        description: 'All allies: heals 50% ATK; +15% ATK for 2 turns.',
        cooldown: 3, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [
          { type: 'heal', mult: 0.50 },
          { type: 'buff', stat: 'atk', mult: 1.15, turns: 2 },
        ],
        levelUps: [
          { mult: 0.05 },
          { buffPower: 0.05 },
          { cooldown: -1 },
          { mult: 0.05 },
          { buffPower: 0.05 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'mei_burn_bright_again', name: 'Burn Bright Again',
        icon: 'assets/icons/fc1118.png',
        // The rekindling: the burst closes the wound and the coals keep
        // it closed. The regrowth ticks are heal events, so under
        // Healer's-Reward-style hooks and the fire pack a mend that
        // keeps mending keeps paying.
        description: 'One ally: heals 120% ATK; regenerates 5% of caster max HP for 2 turns.',
        cooldown: 5, targeting: 'lowest-ally', animation: 'idle', impact: 'heal_gold',
        effects: [
          { type: 'heal', mult: 1.20 },
          { type: 'hot', pct: 0.05, turns: 2 },
        ],
        levelUps: [
          { mult: 0.15 },
          { heal: 0.02 },
          { cooldown: -1 },
          { mult: 0.15 },
          { cooldown: -1 },
          { duration: 1 },
          { heal: 0.02 },
        ],
      },
    ],
    passive: {
      name: 'Steady Paws',
      icon: 'assets/icons/fc1119.png',
      description: '+15% healing done while above half HP.',
      hooks: {
        healBoostAdd: (unit) =>
          (unit.maxHp > 0 && unit.hp / unit.maxHp > 0.5 ? 0.15 : 0),
      },
    },
    positional: POSITIONALS.triage_lantern,
  },

  // ---- 4-star ------------------------------------------------------
  // The drillmaster. Boros sells the two things the pack converts into
  // tempo -- ATK and crit -- and nothing else, which is the whole
  // design: he is worth exactly as much as the pride around him.
  boros: {
    id: 'boros',
    element: 'fire',
    name: 'Boros',
    title: 'Beats the Drum',
    rarity: 4,
    stats: { hp: 1340, atk: 108, def: 104, speed: 112 },
    tint: { body: '#b8683a', helm: '#8a2a1a', weapon: '#ffd76a', shield: '#c83a2a' },
    sprite: {
      displayH: 84,
      strips: {
        idle: { src: 'assets/heroes/emberpride/borosidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boros_sharpen', name: 'Sharpen',
        icon: 'assets/icons/fc1120.png',
        description: 'One ally: +20% ATK for 2 turns.',
        cooldown: 0, targeting: 'ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'buff', stat: 'atk', mult: 1.20, turns: 2 }],
        levelUps: [
          { buffPower: 0.05 },
          { buffPower: 0.05 },
          { duration: 1 },
          { buffPower: 0.05 },
          { buffPower: 0.05 },
        ],
      },
      {
        id: 'boros_battle_chant', name: 'Battle Chant',
        icon: 'assets/icons/fc1121.png',
        description: 'All allies: +15% Crit Chance for 2 turns.',
        cooldown: 4, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'buff', stat: 'critChance', add: 0.15, turns: 2 }],
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
        id: 'boros_pride_roars', name: 'Pride Roars',
        icon: 'assets/icons/fc1122.png',
        description: 'All allies: +20% ATK for 2 turns; +10% turn meter.',
        cooldown: 5, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.20, turns: 2 },
          { type: 'turnMeter', amount: 0.10 },
        ],
        levelUps: [
          { buffPower: 0.05 },
          { meter: 0.03 },
          { cooldown: -1 },
          { buffPower: 0.05 },
          { cooldown: -1 },
          { duration: 1 },
          { meter: 0.03 },
        ],
      },
    ],
    passive: {
      name: 'War Drums',
      icon: 'assets/icons/fc1123.png',
      // The third read on the same idea: Protocol sends the straggler,
      // Favorite sends the killer, War Drums doubles down on whoever is
      // already about to go.
      description: 'Start of each turn: +8% turn meter to the readiest other ally.',
      hooks: {
        onTurnStart(unit, battle) {
          if (!battle) return null;
          const mates = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (!mates.length) return null;
          const next = mates.reduce((a, b) => (b.turnMeter > a.turnMeter ? b : a));
          next.turnMeter += CONFIG.TURN_METER_MAX * 0.08;
          return { label: 'War Drums',
            message: `${unit.name} drums ${next.name} onward.`,
            floats: [{ target: next, text: '▲', color: '#ffb060' }] };
        },
      },
    },
    positional: POSITIONALS.drum_line,
  },

  // The gate. Magnus is the armoured answer to a pride of glass: he
  // holds the blows the strikers cannot take, and claws back at
  // whatever lands them.
  magnus: {
    id: 'magnus',
    element: 'fire',
    name: 'Magnus',
    title: 'The Gate Holds',
    rarity: 4,
    stats: { hp: 1780, atk: 106, def: 138, speed: 100 },
    tint: { body: '#c8963a', helm: '#8a2a1a', weapon: '#e8a04a', shield: '#c83a2a' },
    sprite: {
      displayH: 92,
      strips: {
        idle: { src: 'assets/heroes/emberpride/magnusidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'magnus_maul', name: 'Maul',
        icon: 'assets/icons/fc1124.png',
        description: 'One enemy: 100% DEF damage.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'slash_slam',
        effects: [{ type: 'damageDef', mult: 1.00 }],
        levelUps: [
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
        ],
      },
      {
        id: 'magnus_hold_the_gate', name: 'Shut the Gate',
        icon: 'assets/icons/fc1125.png',
        // No shield, on purpose: Magnus is the punish tank. He draws
        // the blows onto raw hide and lets Claw Back answer them --
        // the DEF buff is the whole of his cover.
        description: 'Self: draws enemy attacks for 2 turns; +25% DEF for 2 turns.',
        cooldown: 4, targeting: 'self', animation: 'idle', impact: 'shield_bubble',
        effects: [
          { type: 'taunt', turns: 2 },
          { type: 'buff', stat: 'def', mult: 1.25, turns: 2 },
        ],
        levelUps: [
          { buffPower: 0.05 },
          { duration: 1 },
          { cooldown: -1 },
          { buffPower: 0.05 },
          { cooldown: -1 },
          { buffPower: 0.05 },
        ],
      },
      {
        id: 'magnus_break_the_charge', name: 'Break the Charge',
        icon: 'assets/icons/fc1126.png',
        description: 'One enemy: 160% DEF damage (ignores 20% DEF).',
        cooldown: 5, targeting: 'enemy', animation: 'idle', impact: 'slash_slam',
        effects: [{ type: 'damageDef', mult: 1.60, ignoreDef: 0.20 }],
        levelUps: [
          { mult: 0.10 },
          { cooldown: -1 },
          { mult: 0.10 },
          { mult: 0.10 },
          { cooldown: -1 },
          { mult: 0.10 },
          { mult: 0.10 },
        ],
      },
    ],
    passive: {
      name: 'Claw Back',
      icon: 'assets/icons/fc1127.png',
      // Through Abilities.strike, so the rake obeys the DEF curve,
      // dodge and wards like any blow -- and Unit.struck() already
      // holds the retaliation guard, so a rake can never chain into
      // another rake.
      description: 'When struck: 20% chance to rake the attacker for 40% ATK.',
      hooks: {
        onStruck(unit, attacker) {
          if (!attacker || !attacker.alive || attacker.team === unit.team) return null;
          if (Math.random() >= 0.20) return null;
          const raw = unit.effectiveStat('atk') * 0.40;
          const r = Abilities.strike(unit, attacker, raw, { crit: false });
          if (!r || !(r.amount > 0)) return null;
          return { label: 'Claw Back',
            message: `${unit.name} rakes ${attacker.name} for ${r.amount}.`,
            floats: [{ target: attacker, text: `-${r.amount}`, color: '#ffb060' }] };
        },
      },
    },
    positional: POSITIONALS.settled_low,
  },

  // ---- 5-star ------------------------------------------------------
  // The war engine. Rajan is the sect's thesis at full volume: two
  // cannons means two crit rolls a turn for Taste for It, his barrage
  // is the First Blood harvester, and Both Barrels is the finisher The
  // Pride Eats exists to pay for. Cannon Heat ramps him into the long
  // fight the rest of the kit is trying to end.
  rajan: {
    id: 'rajan',
    element: 'fire',
    name: 'Rajan',
    title: 'Both Barrels of the Dawn',
    rarity: 5,
    stats: { hp: 1400, atk: 188, def: 92, speed: 116 },
    tint: { body: '#e8963a', helm: '#c83a2a', weapon: '#ffd76a', shield: '#8a2a1a' },
    sprite: {
      displayH: 96,
      strips: {
        idle: { src: 'assets/heroes/emberpride/rajanidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rajan_twin_report', name: 'Twin Report',
        icon: 'assets/icons/fc1128.png',
        // Two blows, two crit rolls: the cooldown-0 version of the
        // sect's whole crit economy.
        description: 'One enemy: 55% ATK damage, twice.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [
          { type: 'damage', mult: 0.55 },
          { type: 'damage', mult: 0.55 },
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
        id: 'rajan_suppressing_fire', name: 'Suppressing Fire',
        icon: 'assets/icons/fc1129.png',
        description: 'All enemies: 60% ATK damage; 50% chance: burns for 3% of target max HP for 2 turns.',
        cooldown: 4, targeting: 'all-enemies', animation: 'idle', impact: 'fire_ball',
        effects: [
          { type: 'damage', mult: 0.60 },
          { type: 'dot', targetHpPct: 0.03, turns: 2, chance: 0.50, flavor: 'burn' },
        ],
        levelUps: [
          { debuffChance: 0.25 },
          { cooldown: -1 },
          { mult: 0.10 },
          { debuffChance: 0.25 },
          { cooldown: -1 },
          { mult: 0.10 },
        ],
      },
      {
        id: 'rajan_both_barrels', name: 'Both Barrels',
        icon: 'assets/icons/fc1130.png',
        description: 'One enemy: 230% ATK damage (+25% Crit Chance, ignores 20% DEF).',
        cooldown: 6, targeting: 'enemy', animation: 'idle', impact: 'fire_ball',
        effects: [{ type: 'damage', mult: 2.30, critAdd: 0.25, ignoreDef: 0.20 }],
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
      name: 'Cannon Heat',
      icon: 'assets/icons/fc1131.png',
      // Through raiseAtk, the same permanent-raise plumbing the `raise`
      // effect uses, so the cap is enforced where the raise happens and
      // the ramp survives every read of effectiveStat.
      description: 'Start of each turn: +5% ATK for the rest of the fight, to +25%.',
      hooks: {
        onTurnStart(unit) {
          const added = Abilities.raiseAtk(unit, 0.05, 0.25);
          if (added <= 0) return null;
          return { label: 'Cannon Heat',
            floats: [{ target: unit, text: 'ATK ▲', color: '#ffb060' }] };
        },
      },
    },
    positional: POSITIONALS.braced_recoil,
  },
};

Object.assign(HEROES, EMBERPRIDE);

if (typeof module !== 'undefined' && module.exports) module.exports = { EMBERPRIDE };
