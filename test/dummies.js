// Test fixtures: plain enemy bodies for the rules tests.
//
// These are five of the retired rat cohort, preserved verbatim as
// FIXTURES rather than heroes. Most rules tests need a neutral body to
// hit, heal, freeze or shove around, and an authored hero is a poor
// stand-in — every one of them carries a passive that quietly moves the
// numbers a test is trying to measure. They are NOT registered into
// HEROES, so nothing can summon them and no data-contract test applies.
const DUMMIES = {
  rat_archer: {
    id: 'rat_archer',
    element: 'wind',
    name: 'Rat Archer',
    title: 'Burrow Scout',
    rarity: 1,
    stats: { hp: 700, atk: 115, def: 55, speed: 100 },
    tint: { body: '#5a7a4a', helm: '#7a9a5a', weapon: '#a88a5a', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_archer/ratarcheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'quick_shot', name: 'Quick Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'Loose an arrow for 100% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.0 }],
      },
      {
        id: 'aimed_shot', name: 'Aimed Shot',
        icon: 'assets/icons/fc1516.png',
        description: 'A careful shot for 140% ATK.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.4 }],
      },
      {
        id: 'arrow_rain', name: 'Arrow Rain',
        icon: 'assets/icons/fc807.png',
        description: 'Pepper ALL enemies for 70% ATK.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.7 }],
      },
    ],
    passive: {
      name: 'Twitchy',
      icon: 'assets/icons/fc882.png',
      description: 'Gains +8% SPD for 1 turn at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.08, turns: 1 });
          return null; // silent — too minor to log every turn
        },
      },
    },
    positional: POSITIONALS.overwatch,
  },
  rat_brawler: {
    id: 'rat_brawler',
    element: 'fire',
    name: 'Rat Brawler',
    title: 'Gutter Scrapper',
    rarity: 1,
    stats: { hp: 900, atk: 105, def: 80, speed: 90 },
    tint: { body: '#8a6a4a', helm: '#a8845a', weapon: '#b8b0a8', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_brawler/ratbrawleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'jab', name: 'Jab',
        icon: 'assets/icons/fc663.png',
        description: 'Two quick jabs for 50% ATK each.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.5 },
          { type: 'damage', mult: 0.5 },
        ],
      },
      {
        id: 'haymaker', name: 'Haymaker',
        icon: 'assets/icons/fc762.png',
        description: 'A wild swing for 150% ATK.',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [{ type: 'damage', mult: 1.5 }],
      },
      {
        id: 'gutter_stance', name: 'Gutter Stance',
        icon: 'assets/icons/fc854.png',
        description: 'Hunker down: +40% DEF for 2 turns.',
        cooldown: 5, targeting: 'self', animation: 'attack',
        effects: [{ type: 'buff', stat: 'def', mult: 1.4, turns: 2 }],
      },
    ],
    passive: {
      name: 'Thick Hide',
      icon: 'assets/icons/fc1112.png',
      description: 'Recovers 3% max HP at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          const healed = unit.heal(Math.round(unit.maxHp * 0.03));
          if (healed <= 0) return null;
          return {
            label: 'Thick Hide',
            message: `${unit.name}'s Thick Hide restores ${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#7ae87a' }],
          };
        },
      },
    },
    positional: POSITIONALS.rallying_banner,
  },
  rat_knight: {
    id: 'rat_knight',
    element: 'water',
    name: 'Rat Knight',
    title: 'Sworn Shield of the Nest',
    rarity: 2,
    stats: { hp: 1000, atk: 118, def: 95, speed: 90 },
    tint: { body: '#7a7a8a', helm: '#a8a8b8', weapon: '#d8d8e0', shield: '#5a6a9a', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_knight/ratknightidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'mace_strike', name: 'Mace Strike',
        icon: 'assets/icons/fc1471.png',
        description: 'Strike for 95% ATK and brace behind the shield: takes 10% less damage until his next turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.9, turns: 1 },
        ],
      },
      {
        id: 'pommel_bash', name: 'Pommel Bash',
        icon: 'assets/icons/fc762.png',
        description: 'Stagger the target: 115% ATK and drains 10% turn meter.',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.15 },
          { type: 'turnMeter', amount: -0.10 },
        ],
      },
      {
        id: 'phalanx_guard', name: 'Phalanx Guard',
        icon: 'assets/icons/fc855.png',
        description: 'Brace the front line: +20% DEF and 2% of the Knight\'s max HP regen for 2 turns.',
        cooldown: 5, targeting: 'front-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.2, turns: 2 },
          { type: 'hot', pct: 0.02, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Bulwark',
      icon: 'assets/icons/fc856.png',
      description: 'A shield wall needs a wall: takes 15% less damage while at least two other allies still stand.',
      hooks: {
        damageTakenMult(unit) {
          const battle = typeof Battle !== 'undefined' ? Battle.active : null;
          if (!battle) return 1;
          return battle.livingUnits(unit.team).length >= 3 ? 0.85 : 1;
        },
      },
    },
    positional: POSITIONALS.rallying_banner,
  },
  rat_mauler: {
    id: 'rat_mauler',
    element: 'water',
    name: 'Rat Mauler',
    title: 'Cellar Crusher',
    rarity: 2,
    stats: { hp: 1100, atk: 130, def: 75, speed: 85 },
    tint: { body: '#5a4a3a', helm: '#7a6a5a', weapon: '#a89078', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_mauler/ratmauleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'club_smash', name: 'Club Smash',
        icon: 'assets/icons/fc1471.png',
        description: 'A club blow for 115% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.15 },
        ],
      },
      {
        id: 'bone_crusher', name: 'Bone Crusher',
        icon: 'assets/icons/fc1476.png',
        description: 'Deals 140% ATK and cracks armor: -20% DEF for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'slam',
        effects: [
          { type: 'damage', mult: 1.4 },
          { type: 'debuff', stat: 'def', mult: 0.8, turns: 2 },
        ],
      },
      {
        id: 'overhead_slam', name: 'Overhead Slam',
        icon: 'assets/icons/fc767.png',
        description: 'Bring it all down: 185% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack', impact: 'slam',
        effects: [{ type: 'damage', mult: 1.85 }],
      },
    ],
    passive: {
      name: 'Bully',
      icon: 'assets/icons/fc657.png',
      description: 'Deals 15% extra damage to enemies above half HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp >= 0.5 ? 1.15 : 1;
        },
      },
    },
    positional: POSITIONALS.standard_bearer,
  },
  rat_warrior: {
    id: 'rat_warrior',
    element: 'fire',
    name: 'Rat Warrior',
    title: 'Sword of the Warren',
    rarity: 1,
    stats: { hp: 850, atk: 112, def: 72, speed: 92 },
    tint: { body: '#7a4a3a', helm: '#9a6a4a', weapon: '#d8d8e0', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_warrior/ratwarrioridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'warren_slash', name: 'Warren Slash',
        icon: 'assets/icons/fc1447.png',
        description: 'Cut for 100% ATK, then raise the shield: +10% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.1, turns: 1 },
        ],
      },
      {
        id: 'shield_splitter', name: 'Shield Splitter',
        icon: 'assets/icons/fc1476.png',
        description: 'Smash armor: 125% ATK and -15% DEF for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.25 },
          { type: 'debuff', stat: 'def', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'battle_roar', name: 'Battle Roar',
        icon: 'assets/icons/fc869.png',
        description: 'Bellow a challenge: +30% ATK for 2 turns.',
        cooldown: 5, targeting: 'self', animation: 'attack',
        effects: [{ type: 'buff', stat: 'atk', mult: 1.3, turns: 2 }],
      },
    ],
    passive: {
      name: 'Second Wind',
      icon: 'assets/icons/fc1112.png',
      description: 'Recovers 6% max HP at turn start while below half HP.',
      hooks: {
        onTurnStart(unit) {
          if (unit.hp / unit.maxHp >= 0.5) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.06));
          if (healed <= 0) return null;
          return {
            label: 'Second Wind',
            message: `${unit.name} catches a second wind for ${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#7ae87a' }],
          };
        },
      },
    },
    positional: POSITIONALS.bloodied_fury,
  },
  rat_aegisbearer: {
    id: 'rat_aegisbearer',
    element: 'light',
    name: 'Rat Aegisbearer',
    title: 'A shield the sun would envy.',
    rarity: 3,
    stats: { hp: 1114, atk: 158, def: 96, speed: 108 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_aegisbearer/rataegisbeareridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_aegisbearer_check', name: 'Aegisbearer\'s Check',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield checks: 77% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.77 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'rat_aegisbearer_ward', name: 'Aegisbearer\'s Ward',
        icon: 'assets/icons/fc855.png',
        description: 'Raise the aegis over an ally: they take 12% less damage for 2 turns and heal 138% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.88, turns: 2 },
          { type: 'heal', mult: 1.38 },
        ],
      },
      {
        id: 'rat_aegisbearer_vigil', name: 'Aegisbearer\'s Vigil',
        icon: 'assets/icons/fc856.png',
        description: 'The unbroken vigil: ALL allies gain +5% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.05, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Aegisbearer Constancy',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, shields the most wounded ally: takes 10% less damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.9, turns: 1 });
          return null; // silent — small rolling shelter
        },
      },
    },
    positional: POSITIONALS.warding_circle,
  },
};
