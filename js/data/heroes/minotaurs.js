// Minotaur heroes (42). Registered into the shared
// HEROES table declared in js/data/heroes.js.

Object.assign(HEROES, {

  minotaur_warrior: {
    id: 'minotaur_warrior',
    element: 'fire',
    name: 'Minotaur Warrior',
    title: 'Maze Soldier',
    rarity: 1,
    stats: { hp: 880, atk: 110, def: 70, speed: 92 },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurwarrioridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'maze_slash', name: 'Maze Slash',
        icon: 'assets/icons/fc1447.png',
        description: 'A wide slash for 112% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.12 },
        ],
      },
      {
        id: 'war_cleave', name: 'War Cleave',
        icon: 'assets/icons/fc730.png',
        description: 'Cleave a hex row for 90% ATK.',
        cooldown: 3, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
        ],
      },
      {
        id: 'rallying_bellow', name: 'Rallying Bellow',
        icon: 'assets/icons/fc869.png',
        description: 'Bellow with fury: +30% ATK for 2 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [{ type: 'buff', stat: 'atk', mult: 1.3, turns: 2 }],
      },
    ],
    passive: {
      name: 'Stubborn',
      icon: 'assets/icons/fc867.png',
      description: 'Gains +8% DEF for 1 turn at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.08, turns: 1 });
          return null; // silent - fires every turn
        },
      },
    },
    positional: POSITIONALS.thornguard,
  },

  minotaur_bruiser: {
    id: 'minotaur_bruiser',
    element: 'water',
    name: 'Minotaur Bruiser',
    title: 'Maze Muscle',
    rarity: 1,
    stats: { hp: 950, atk: 105, def: 75, speed: 88 },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurbruiseridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'pummel', name: 'Pummel',
        icon: 'assets/icons/fc663.png',
        description: 'A flurry of three blows for 35% ATK each.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.35 },
          { type: 'damage', mult: 0.35 },
          { type: 'damage', mult: 0.35 },
        ],
      },
      {
        id: 'headbutt', name: 'Headbutt',
        icon: 'assets/icons/fc762.png',
        description: 'A concussive headbutt: 125% ATK that drains 15% turn meter.',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.25 },
          { type: 'turnMeter', amount: -0.15 },
        ],
      },
      {
        id: 'ground_stomp', name: 'Ground Stomp',
        icon: 'assets/icons/fc767.png',
        description: 'Shake a hex row for 75% ATK.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack', impact: 'slam',
        effects: [{ type: 'damage', mult: 0.75 }],
      },
    ],
    passive: {
      name: 'Thick Skull',
      icon: 'assets/icons/fc1112.png',
      description: 'Dense bone: takes 20% less damage while above 90% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.hp / unit.maxHp > 0.9 ? 0.8 : 1;
        },
      },
    },
    positional: POSITIONALS.bulwark_oath,
  },

  minotaur_guard: {
    id: 'minotaur_guard',
    element: 'water',
    name: 'Minotaur Guard',
    title: 'Gate Warden',
    rarity: 2,
    stats: { hp: 1100, atk: 115, def: 95, speed: 85 },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurgaurdidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'shield_strike', name: 'Shield Strike',
        icon: 'assets/icons/fc854.png',
        description: 'A shield shove: 95% ATK that drains 5% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
      {
        id: 'bulwark_slam', name: 'Bulwark Slam',
        icon: 'assets/icons/fc1476.png',
        description: 'A jarring slam: 130% ATK that saps -12% ATK for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
          { type: 'debuff', stat: 'atk', mult: 0.88, turns: 2 },
        ],
      },
      {
        id: 'phalanx_wall', name: 'Phalanx Wall',
        icon: 'assets/icons/fc855.png',
        description: 'Lock shields: front-hex allies take 20% less damage for 2 turns.',
        cooldown: 6, targeting: 'front-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.8, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Warden\'s Resolve',
      icon: 'assets/icons/fc856.png',
      description: 'A wall to the last: takes 25% less damage while below 30% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.alive && unit.hp / unit.maxHp < 0.3 ? 0.75 : 1;
        },
      },
    },
    positional: POSITIONALS.rallying_banner,
  },

  minotaur_crossbowman: {
    id: 'minotaur_crossbowman',
    element: 'wind',
    name: 'Minotaur Crossbowman',
    title: 'Maze Sharpshooter',
    rarity: 2,
    stats: { hp: 850, atk: 140, def: 60, speed: 105 },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurcrossbowmanidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bolt', name: 'Bolt',
        icon: 'assets/icons/fc1481.png',
        description: 'A snap shot for 100% ATK — 35% more against exposed (vulnerability-marked) targets.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0, bonusVs: { stat: 'damageTaken', mult: 1.35 } },
        ],
      },
      {
        id: 'piercing_bolt', name: 'Piercing Bolt',
        icon: 'assets/icons/fc1484.png',
        description: 'An armor-punching bolt: 140% ATK — 50% more against weakened armor.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.4, bonusVs: { stat: 'def', mult: 1.5 } },
        ],
      },
      {
        id: 'bolt_storm', name: 'Bolt Storm',
        icon: 'assets/icons/fc814.png',
        description: 'Rake ALL enemies for 80% ATK.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.8 }],
      },
    ],
    passive: {
      name: 'Deadeye',
      icon: 'assets/icons/fc719.png',
      description: 'Gains +25% crit damage for 1 turn at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.25, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.snipers_nest,
  },

  minotaur_gladiator: {
    id: 'minotaur_gladiator',
    element: 'fire',
    name: 'Minotaur Gladiator',
    title: 'Arena Idol',
    rarity: 2,
    stats: { hp: 920, atk: 138, def: 68, speed: 108 },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurgladiatoridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'arena_strike', name: 'Arena Strike',
        icon: 'assets/icons/fc1527.png',
        description: 'Strike for 100% ATK as the crowd roars: +10% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.1, turns: 1 },
        ],
      },
      {
        id: 'crowd_pleaser', name: 'Crowd Pleaser',
        icon: 'assets/icons/fc729.png',
        description: 'A showboat strike: 155% ATK, and the roar grants 15% turn meter.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.55 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.15 },
        ],
      },
      {
        id: 'executioners_round', name: 'Executioner\'s Round',
        icon: 'assets/icons/fc734.png',
        description: 'Finish the show: 195% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [{ type: 'damage', mult: 1.95 }],
      },
    ],
    passive: {
      name: 'Showman',
      icon: 'assets/icons/fc868.png',
      description: 'Always performing: deals 10% extra damage.',
      hooks: {
        damageDealtMult() { return 1.1; },
      },
    },
    positional: POSITIONALS.keystone,
  },

  minotaur_shaman: {
    id: 'minotaur_shaman',
    element: 'wind',
    name: 'Minotaur Shaman',
    title: 'Maze Mystic',
    rarity: 3,
    stats: { hp: 1150, atk: 150, def: 85, speed: 100 },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurshamanidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'spirit_jolt', name: 'Spirit Jolt',
        icon: 'assets/icons/fc970.png',
        description: 'A siphoning jolt: 90% ATK that heals the Shaman for 15% of his ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.15 },
        ],
      },
      {
        id: 'mending_totem', name: 'Mending Totem',
        icon: 'assets/icons/fc1073.png',
        description: 'Heal an ally for 12% of the shaman\'s max HP (15% if front row).',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [{ type: 'healHpPct', pct: 0.12, frontPct: 0.15 }],
      },
      {
        id: 'ancestral_winds', name: 'Ancestral Winds',
        icon: 'assets/icons/fc1113.png',
        description: 'Winds mend ALL allies for 5% of the Shaman\'s max HP over 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'hot', pct: 0.05, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Earthen Bond',
      icon: 'assets/icons/fc853.png',
      description: 'Takes 15% less damage while above half HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.hp / unit.maxHp >= 0.5 ? 0.85 : 1;
        },
      },
    },
    positional: POSITIONALS.opening_volley,
  },

  minotaur_necromancer: {
    id: 'minotaur_necromancer',
    element: 'dark',
    name: 'Minotaur Necromancer',
    title: 'Maze Gravecaller',
    rarity: 3,
    stats: { hp: 1080, atk: 168, def: 75, speed: 104 },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurnecromanceridle.png', frames: 9, fps: 5, loop: true },
        idle2: {
          src: 'assets/heroes/minotaurnecromanceridle1.png', frames: 9, fps: 5,
          variantOf: 'idle', every: [8, 16],
        },
      },
    },
    abilities: [
      {
        id: 'grave_bolt', name: 'Grave Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'A withering bolt: 95% ATK and -10% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'debuff', stat: 'atk', mult: 0.9, turns: 1 },
        ],
      },
      {
        id: 'soul_rot', name: 'Soul Rot',
        icon: 'assets/icons/fc1066.png',
        description: 'Deals 125% ATK and marks the soul: +20% damage taken for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.25 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.2, turns: 2 },
        ],
      },
      {
        id: 'raise_dead', name: 'Raise Dead',
        icon: 'assets/icons/fc1075.png',
        description: 'Drag a fallen ally back to their feet with 30% HP.',
        cooldown: 7, targeting: 'dead-ally', animation: 'attack',
        effects: [{ type: 'revive', pct: 0.3 }],
      },
    ],
    passive: {
      name: 'Harvester',
      icon: 'assets/icons/fc863.png',
      description: 'At turn start, siphons 2% of his max HP from a random enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const amount = Math.max(1, Math.round(unit.maxHp * 0.02));
          target.takeDamage(amount, unit);
          const healed = unit.heal(amount);
          return {
            label: 'Harvester',
            message: `${unit.name} harvests ${amount} HP from ${target.name}.`,
            floats: [
              { target, text: `-${amount}`, color: '#b86ae8' },
              { target: unit, text: `+${healed}`, color: '#7ae87a' },
            ],
          };
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },


  // ---- Placeholder minotaur cohort (filling the roster to 25) ------------
  // Procedural placeholder art renders until real idle sheets land at the
  // conventional flat paths (assets/heroes/minotaur<role>idle.png).

  minotaur_axeman: {
    id: 'minotaur_axeman',
    element: 'fire',
    name: 'Minotaur Axeman',
    title: 'Feller of Pillars',
    rarity: 1,
    stats: { hp: 890, atk: 113, def: 72, speed: 90 },
    tint: { body: '#7a5a3a', helm: '#9a7a4a', weapon: '#c8c0b0', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotauraxemanidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'chop', name: 'Chop',
        icon: 'assets/icons/fc1447.png',
        description: 'A workmanlike chop for 109% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.09 },
        ],
      },
      {
        id: 'overhand_hew', name: 'Overhand Hew',
        icon: 'assets/icons/fc730.png',
        description: 'A full-shoulder hew: 150% ATK, and the swing loosens him up: +8% ATK for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.5 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.08, turns: 1 },
        ],
      },
      {
        id: 'timber', name: 'Timber!',
        icon: 'assets/icons/fc767.png',
        description: 'Drop the tree on a hex row: 100% ATK and -8% DEF for 1 turn.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'debuff', stat: 'def', mult: 0.92, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Chopping Cadence',
      icon: 'assets/icons/fc867.png',
      description: 'Gains +10% crit damage for 2 turns at each turn start (briefly stacks).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.10, turns: 2 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.reckless_charge,
  },

  minotaur_herder: {
    id: 'minotaur_herder',
    element: 'water',
    name: 'Minotaur Herder',
    title: 'Driver of the Long Horns',
    rarity: 1,
    stats: { hp: 860, atk: 104, def: 70, speed: 94 },
    tint: { body: '#6a7a5a', helm: '#8a9a6a', weapon: '#b8a878', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurherderidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'crook_swipe', name: 'Crook Swipe',
        icon: 'assets/icons/fc1471.png',
        description: 'A hooking swipe: 97% ATK that drains 7% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.97 },
          { type: 'turnMeter', amount: -0.07 },
        ],
      },
      {
        id: 'herding_call', name: 'Herding Call',
        icon: 'assets/icons/fc868.png',
        description: 'Drive an ally onward: +25% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'turnMeter', amount: 0.25 },
        ],
      },
      {
        id: 'stampede_whistle', name: 'Stampede Whistle',
        icon: 'assets/icons/fc869.png',
        description: 'Whistle the charge: ALL allies gain +10% ATK for 2 turns and 5% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.1, turns: 2 },
          { type: 'turnMeter', amount: 0.05 },
        ],
      },
    ],
    passive: {
      name: 'Watchful Herd',
      icon: 'assets/icons/fc863.png',
      description: 'At turn start, the ally lowest on the turn meter gains 10% meter.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.turnMeter - b.turnMeter);
          const ally = allies[0];
          ally.turnMeter = Math.min(CONFIG.TURN_METER_MAX,
            ally.turnMeter + CONFIG.TURN_METER_MAX * 0.10);
          return null; // silent — small rolling push
        },
      },
    },
    positional: POSITIONALS.lifeline,
  },

  minotaur_digger: {
    id: 'minotaur_digger',
    element: 'water',
    name: 'Minotaur Digger',
    title: 'Spade of the Bonefield',
    rarity: 1,
    stats: { hp: 920, atk: 107, def: 78, speed: 87 },
    tint: { body: '#5a5a4a', helm: '#7a7a5a', weapon: '#a8a098', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurdiggeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'shovel_whack', name: 'Shovel Whack',
        icon: 'assets/icons/fc1472.png',
        description: 'A flat-of-the-spade whack for 101% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.01 },
        ],
      },
      {
        id: 'undermine', name: 'Undermine',
        icon: 'assets/icons/fc862.png',
        description: 'Dig out their footing: -20% DEF for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'def', mult: 0.8, turns: 2 },
        ],
      },
      {
        id: 'tunnel_collapse', name: 'Tunnel Collapse',
        icon: 'assets/icons/fc767.png',
        description: 'Drop the gallery on a hex row: 105% ATK and -10% turn meter.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.05 },
          { type: 'turnMeter', amount: -0.1 },
        ],
      },
    ],
    passive: {
      name: 'Digs In',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 15% less damage while below half HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.alive && unit.hp / unit.maxHp < 0.5 ? 0.85 : 1;
        },
      },
    },
    positional: POSITIONALS.thornguard,
  },

  minotaur_piper: {
    id: 'minotaur_piper',
    element: 'wind',
    name: 'Minotaur Piper',
    title: 'Wind of the Warrens',
    rarity: 1,
    stats: { hp: 800, atk: 109, def: 65, speed: 98 },
    tint: { body: '#4a6a6a', helm: '#6a8a8a', weapon: '#e8d8a8', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurpiperidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'skirl_blast', name: 'Skirl Blast',
        icon: 'assets/icons/fc1003.png',
        description: 'A skirling blast: 87% ATK and -6% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.87 },
          { type: 'debuff', stat: 'atk', mult: 0.94, turns: 1 },
        ],
      },
      {
        id: 'droning_dirge', name: 'Droning Dirge',
        icon: 'assets/icons/fc1084.png',
        description: 'A leaden drone: ALL enemies lose 6% turn meter and 4% SPD for 1 turn.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'turnMeter', amount: -0.06 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 1 },
        ],
      },
      {
        id: 'battle_anthem', name: 'Battle Anthem',
        icon: 'assets/icons/fc869.png',
        description: 'A soaring anthem: ALL allies gain +8% crit chance for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'critChance', add: 0.08, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Encore',
      icon: 'assets/icons/fc882.png',
      description: '+5% chance to take an extra turn after acting.',
      hooks: { extraTurnAdd: 0.05 },
    },
    positional: POSITIONALS.hexweaver,
  },

  minotaur_butcher: {
    id: 'minotaur_butcher',
    element: 'fire',
    name: 'Minotaur Butcher',
    title: 'Purveyor of Cuts',
    rarity: 1,
    stats: { hp: 930, atk: 118, def: 68, speed: 91 },
    tint: { body: '#8a4a4a', helm: '#a86a5a', weapon: '#d8d8e0', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurbutcheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'meat_hook', name: 'Meat Hook',
        icon: 'assets/icons/fc1444.png',
        description: 'A dragging hook: 93% ATK that opens a 10% ATK bleed for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.93 },
          { type: 'dot', pct: 0.1, turns: 1 },
        ],
      },
      {
        id: 'carve', name: 'Carve',
        icon: 'assets/icons/fc1447.png',
        description: 'A carving stroke: 125% ATK plus a 25% ATK bleed for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.25 },
          { type: 'dot', pct: 0.25, turns: 2 },
        ],
      },
      {
        id: 'butchers_special', name: 'Butcher\'s Special',
        icon: 'assets/icons/fc734.png',
        description: 'The good cut: 150% ATK — 70% more against bleeding prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.5, bonusVs: { kind: 'dot', mult: 1.7 } },
        ],
      },
    ],
    passive: {
      name: 'Bloodletter',
      icon: 'assets/icons/fc1093.png',
      description: '+20% DoT damage.',
      hooks: { dotBoostAdd: 0.20 },
    },
    positional: POSITIONALS.reckless_charge,
  },

  minotaur_sentry: {
    id: 'minotaur_sentry',
    element: 'wind',
    name: 'Minotaur Sentry',
    title: 'Eyes of the Long Night',
    rarity: 1,
    stats: { hp: 980, atk: 103, def: 82, speed: 89 },
    tint: { body: '#4a4a6a', helm: '#6a6a8a', weapon: '#c8c0b0', shield: '#8a8aa8', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaursentryidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'halberd_poke', name: 'Halberd Poke',
        icon: 'assets/icons/fc1461.png',
        description: 'A halberd poke: 99% ATK, held in guard: +5% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.99 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.05, turns: 1 },
        ],
      },
      {
        id: 'hold_fast', name: 'Hold Fast',
        icon: 'assets/icons/fc854.png',
        description: 'Set the halberd: takes 25% less damage and +20% DEF for 1 turn.',
        cooldown: 3, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.75, turns: 1 },
          { type: 'buff', stat: 'def', mult: 1.2, turns: 1 },
        ],
      },
      {
        id: 'alarm_bellow', name: 'Alarm Bellow',
        icon: 'assets/icons/fc869.png',
        description: 'Rouse the watch: ALL allies gain +18% DEF and 1.5% max HP regen for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.18, turns: 2 },
          { type: 'hot', pct: 0.015, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Line Watch',
      icon: 'assets/icons/fc856.png',
      description: 'Alert before the first blow: +25% dodge until this sentry takes its first turn.',
      hooks: {
        onTurnStart(unit) {
          unit._watchTurns = (unit._watchTurns || 0) + 1;
          return null;
        },
        dodgeAdd(unit) {
          return (unit._watchTurns || 0) === 0 ? 0.25 : 0;
        },
      },
    },
    positional: POSITIONALS.bulwark_oath,
  },

  minotaur_thrower: {
    id: 'minotaur_thrower',
    element: 'fire',
    name: 'Minotaur Thrower',
    title: 'Sixty-Yard Grudge',
    rarity: 1,
    stats: { hp: 870, atk: 114, def: 66, speed: 93 },
    tint: { body: '#7a6a4a', helm: '#9a8a5a', weapon: '#a8a098', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurthroweridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rock_hurl', name: 'Rock Hurl',
        icon: 'assets/icons/fc1515.png',
        description: 'A shoulder-turned hurl for 116% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.16 },
        ],
      },
      {
        id: 'boulder_toss', name: 'Boulder Toss',
        icon: 'assets/icons/fc1516.png',
        description: 'A flung boulder: 155% ATK that drains 18% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.55 },
          { type: 'turnMeter', amount: -0.18 },
        ],
      },
      {
        id: 'rockslide', name: 'Rockslide',
        icon: 'assets/icons/fc807.png',
        description: 'Bury ALL enemies: 72% ATK and -5% turn meter.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.72 },
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
    ],
    passive: {
      name: 'Long Arm',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 20% extra damage to enemies holding the center hex.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.slot && target.slot.position === POSITION.CENTER ? 1.2 : 1;
        },
      },
    },
    positional: POSITIONALS.snipers_nest,
  },

  minotaur_ravager: {
    id: 'minotaur_ravager',
    element: 'fire',
    name: 'Minotaur Ravager',
    title: 'Wrecker of Gates',
    rarity: 2,
    stats: { hp: 950, atk: 142, def: 70, speed: 102 },
    tint: { body: '#8a3a3a', helm: '#a85a4a', weapon: '#c8c0b0', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurravageridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rip_and_gore', name: 'Rip and Gore',
        icon: 'assets/icons/fc746.png',
        description: 'Horn and hoof: 65% then 55% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.65 },
          { type: 'damage', mult: 0.55 },
        ],
      },
      {
        id: 'gore_charge', name: 'Gore Charge',
        icon: 'assets/icons/fc763.png',
        description: 'A goring charge: 142% ATK; the momentum grants 8% turn meter.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.42 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.08 },
        ],
      },
      {
        id: 'rampage', name: 'Rampage',
        icon: 'assets/icons/fc800.png',
        description: 'Wreck everything: 85% ATK to ALL enemies, then +15% ATK for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.15, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Red Mist',
      icon: 'assets/icons/fc1093.png',
      description: 'Deals 30% extra damage while below 30% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return unit.hp / unit.maxHp < 0.3 ? 1.3 : 1;
        },
      },
    },
    positional: POSITIONALS.last_stand,
  },

  minotaur_warden: {
    id: 'minotaur_warden',
    element: 'water',
    name: 'Minotaur Warden',
    title: 'Keeper of the Inner Gate',
    rarity: 2,
    stats: { hp: 1080, atk: 118, def: 98, speed: 86 },
    tint: { body: '#3a4a6a', helm: '#5a6a8a', weapon: '#d8d8e0', shield: '#6a7a9a', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurwardenidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wardens_cudgel', name: 'Warden\'s Cudgel',
        icon: 'assets/icons/fc1471.png',
        description: 'A jailer\'s cudgel: 91% ATK, raised guard: takes 8% less damage until next turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.91 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.92, turns: 1 },
        ],
      },
      {
        id: 'chain_snare', name: 'Chain Snare',
        icon: 'assets/icons/fc862.png',
        description: 'Snare in chains: 105% ATK and -25% SPD for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.05 },
          { type: 'debuff', stat: 'speed', mult: 0.75, turns: 1 },
        ],
      },
      {
        id: 'gaol_wall', name: 'Gaol Wall',
        icon: 'assets/icons/fc855.png',
        description: 'Bar the gate: front-hex allies gain +22% DEF and take 10% less damage for 2 turns.',
        cooldown: 6, targeting: 'front-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.22, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.9, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Iron Custody',
      icon: 'assets/icons/fc856.png',
      description: '+10% debuff accuracy and +10% debuff resistance.',
      hooks: { accuracyAdd: 0.10, resistanceAdd: 0.10 },
    },
    positional: POSITIONALS.bulwark_oath,
  },

  minotaur_skirmisher: {
    id: 'minotaur_skirmisher',
    element: 'wind',
    name: 'Minotaur Skirmisher',
    title: 'Quick for His Size',
    rarity: 2,
    stats: { hp: 900, atk: 132, def: 72, speed: 106 },
    tint: { body: '#5a7a6a', helm: '#7a9a8a', weapon: '#c8c0b0', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurskirmisheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'twin_horns', name: 'Twin Horns',
        icon: 'assets/icons/fc746.png',
        description: 'A double hook of the horns: 62% ATK each.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.62 },
          { type: 'damage', mult: 0.62 },
        ],
      },
      {
        id: 'horn_sweep', name: 'Horn Sweep',
        icon: 'assets/icons/fc724.png',
        description: 'Sweep a hex row: 85% ATK and -6% turn meter.',
        cooldown: 3, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
          { type: 'turnMeter', amount: -0.06 },
        ],
      },
      {
        id: 'blindside', name: 'Blindside',
        icon: 'assets/icons/fc825.png',
        description: 'Hit where they aren\'t looking: 170% ATK, then slip away: +20% SPD for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.7 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.2, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Pivot Point',
      icon: 'assets/icons/fc867.png',
      description: 'Goes for the biggest target on the field: +20% damage to the enemy with the largest HP pool.',
      hooks: {
        damageDealtMult(unit, target) {
          const battle = typeof Battle !== 'undefined' ? Battle.active : null;
          if (!battle || !target) return 1;
          const biggest = battle.livingUnits(unit.enemyTeam())
            .sort((a, b) => b.maxHp - a.maxHp)[0];
          return target === biggest ? 1.20 : 1;
        },
      },
    },
    positional: POSITIONALS.focal_point,
  },

  minotaur_runesmith: {
    id: 'minotaur_runesmith',
    element: 'water',
    name: 'Minotaur Runesmith',
    title: 'Letters in Stone',
    rarity: 2,
    stats: { hp: 940, atk: 128, def: 80, speed: 96 },
    tint: { body: '#4a5a7a', helm: '#6a7a9a', weapon: '#7ac8e8', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurrunesmithidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rune_bolt', name: 'Rune Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'A carved bolt: 84% ATK, and the sigil steadies him: +6% crit chance for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.84 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.06, turns: 1 },
        ],
      },
      {
        id: 'inscribe_ward', name: 'Inscribe Ward',
        icon: 'assets/icons/fc855.png',
        description: 'Cut a ward into an ally\'s hide: heals 50% of ATK and they take 15% less damage for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.5 },
          { type: 'buff', stat: 'damageTaken', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'detonate_runes', name: 'Detonate Runes',
        icon: 'assets/icons/fc1044.png',
        description: 'Crack every sigil: 78% ATK to ALL enemies — 40% more against exposed (marked) foes.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.78, bonusVs: { stat: 'damageTaken', mult: 1.4 } },
        ],
      },
    ],
    passive: {
      name: 'Rune Shield',
      icon: 'assets/icons/fc854.png',
      description: 'At turn start, etches himself an 8% damage-reduction rune for 2 turns (briefly stacks).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.92, turns: 2 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.pivot_step,
  },

  minotaur_wrestler: {
    id: 'minotaur_wrestler',
    element: 'fire',
    name: 'Minotaur Wrestler',
    title: 'Undefeated in the Dark',
    rarity: 2,
    stats: { hp: 1000, atk: 130, def: 84, speed: 94 },
    tint: { body: '#6a4a3a', helm: '#8a6a4a', weapon: '#a88a6a', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurwrestleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'clinch', name: 'Clinch',
        icon: 'assets/icons/fc663.png',
        description: 'Lock up: 89% ATK and -6% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.89 },
          { type: 'debuff', stat: 'speed', mult: 0.94, turns: 1 },
        ],
      },
      {
        id: 'suplex', name: 'Suplex',
        icon: 'assets/icons/fc762.png',
        description: 'Lift and drop: 135% ATK that dumps 22% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.35 },
          { type: 'turnMeter', amount: -0.22 },
        ],
      },
      {
        id: 'ring_out', name: 'Ring Out',
        icon: 'assets/icons/fc767.png',
        description: 'Throw them from the ring: 125% ATK, -18% ATK for 2 turns and -10% DEF for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.25 },
          { type: 'debuff', stat: 'atk', mult: 0.82, turns: 2 },
          { type: 'debuff', stat: 'def', mult: 0.9, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Heavyweight',
      icon: 'assets/icons/fc856.png',
      description: 'Built like a wall: deals 8% more and takes 8% less damage.',
      hooks: {
        damageDealtMult() { return 1.08; },
        damageTakenMult() { return 0.92; },
      },
    },
    positional: POSITIONALS.bulwark_oath,
  },

  minotaur_geomancer: {
    id: 'minotaur_geomancer',
    element: 'water',
    name: 'Minotaur Geomancer',
    title: 'Speaker to Bedrock',
    rarity: 2,
    stats: { hp: 890, atk: 140, def: 74, speed: 100 },
    tint: { body: '#5a6a5a', helm: '#7a8a6a', weapon: '#a8c86a', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurgeomanceridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'pebble_barrage', name: 'Pebble Barrage',
        icon: 'assets/icons/fc807.png',
        description: 'Five whipped stones for 22% ATK each.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.22 },
          { type: 'damage', mult: 0.22 },
          { type: 'damage', mult: 0.22 },
          { type: 'damage', mult: 0.22 },
          { type: 'damage', mult: 0.22 },
        ],
      },
      {
        id: 'earthen_spike', name: 'Earthen Spike',
        icon: 'assets/icons/fc1050.png',
        description: 'A spear of rock: 148% ATK and -15% SPD for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.48 },
          { type: 'debuff', stat: 'speed', mult: 0.85, turns: 1 },
        ],
      },
      {
        id: 'quicksand_field', name: 'Quicksand Field',
        icon: 'assets/icons/fc1084.png',
        description: 'The field liquefies: ALL enemies lose 20% SPD for 2 turns and 10% turn meter.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'speed', mult: 0.8, turns: 2 },
          { type: 'turnMeter', amount: -0.1 },
        ],
      },
    ],
    passive: {
      name: 'Tremor Sense',
      icon: 'assets/icons/fc882.png',
      description: 'At turn start, 25% chance to slow a random enemy: -10% SPD for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          if (Math.random() >= 0.25) return null;
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          target.addStatusEffect({ kind: 'debuff', stat: 'speed', mult: 0.9, turns: 1 });
          return {
            label: 'Tremor Sense',
            message: `${unit.name}'s tremor staggers ${target.name}.`,
            floats: [{ target, text: 'SLOWED', color: '#a8c86a' }],
          };
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  minotaur_veteran: {
    id: 'minotaur_veteran',
    element: 'wind',
    name: 'Minotaur Veteran',
    title: 'Half the Scars Are His',
    rarity: 2,
    stats: { hp: 970, atk: 134, def: 82, speed: 97 },
    tint: { body: '#6a6a5a', helm: '#8a8a6a', weapon: '#c8c0b0', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurveteranidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'practiced_cut', name: 'Practiced Cut',
        icon: 'assets/icons/fc1447.png',
        description: 'Nothing fancy, nothing wasted: 114% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.14 },
        ],
      },
      {
        id: 'old_tricks', name: 'Old Tricks',
        icon: 'assets/icons/fc723.png',
        description: 'A trick they never learn: 130% ATK — 35% more against debuffed foes.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3, bonusVs: { kind: 'debuff', mult: 1.35 } },
        ],
      },
      {
        id: 'last_lesson', name: 'Last Lesson',
        icon: 'assets/icons/fc728.png',
        description: 'The lesson ends: 195% ATK, delivered from behind a raised guard (takes 15% less damage until next turn).',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.95 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.85, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Survivor\'s Instinct',
      icon: 'assets/icons/fc862.png',
      description: '+20% chance to dodge while below 30% HP.',
      hooks: {
        dodgeAdd(unit) {
          return unit.alive && unit.hp / unit.maxHp < 0.3 ? 0.20 : 0;
        },
      },
    },
    positional: POSITIONALS.last_stand,
  },

  minotaur_warlord: {
    id: 'minotaur_warlord',
    element: 'fire',
    name: 'Minotaur Warlord',
    title: 'Crown of Broken Horns',
    rarity: 3,
    stats: { hp: 1220, atk: 170, def: 94, speed: 101 },
    tint: { body: '#7a2a2a', helm: '#e8c83a', weapon: '#d8d8e0', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurwarlordidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'warlords_edict', name: 'Warlord\'s Edict',
        icon: 'assets/icons/fc1587.png',
        description: 'A decree in iron: 100% ATK, and his fury builds: +7% ATK for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.07, turns: 2 },
        ],
      },
      {
        id: 'command_the_charge', name: 'Command the Charge',
        icon: 'assets/icons/fc869.png',
        description: 'Sound the horns: ALL allies gain 15% turn meter and +8% ATK for 1 turn.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'turnMeter', amount: 0.15 },
          { type: 'buff', stat: 'atk', mult: 1.08, turns: 1 },
        ],
      },
      {
        id: 'decapitating_sweep', name: 'Decapitating Sweep',
        icon: 'assets/icons/fc730.png',
        description: 'Sweep the front line for 130% ATK.',
        cooldown: 7, targeting: 'front-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
        ],
      },
    ],
    passive: {
      name: 'Warlord\'s Presence',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, ALL allies gain +4% ATK and +4% DEF for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const ally of battle.livingUnits(unit.team)) {
            ally.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.04, turns: 1 });
            ally.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.04, turns: 1 });
          }
          return null; // silent — small rolling aura
        },
      },
    },
    positional: POSITIONALS.press_the_flank,
  },

  minotaur_colossus: {
    id: 'minotaur_colossus',
    element: 'water',
    name: 'Minotaur Colossus',
    title: 'The Walking Rampart',
    rarity: 3,
    stats: { hp: 1350, atk: 158, def: 105, speed: 84 },
    tint: { body: '#4a4a5a', helm: '#6a6a7a', weapon: '#a8a0a8', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurcolossusidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'colossal_fist', name: 'Colossal Fist',
        icon: 'assets/icons/fc663.png',
        description: 'A fist like a falling wall: 122% ATK, but so slow it costs 6% of his own meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.22 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: -0.06 },
        ],
      },
      {
        id: 'seismic_slam', name: 'Seismic Slam',
        icon: 'assets/icons/fc767.png',
        description: 'Slam a hex row: 115% ATK and -12% turn meter.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.15 },
          { type: 'turnMeter', amount: -0.12 },
        ],
      },
      {
        id: 'unmovable', name: 'Unmovable',
        icon: 'assets/icons/fc854.png',
        description: 'Become the wall: takes 50% less damage for 2 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.5, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Too Big to Fall',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 35% less damage while below 20% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.alive && unit.hp / unit.maxHp < 0.2 ? 0.65 : 1;
        },
      },
    },
    positional: POSITIONALS.rallying_banner,
  },

  minotaur_hexhorn: {
    id: 'minotaur_hexhorn',
    element: 'wind',
    name: 'Minotaur Hexhorn',
    title: 'Cursed at Both Ends',
    rarity: 3,
    stats: { hp: 1100, atk: 180, def: 82, speed: 104 },
    tint: { body: '#5a3a6a', helm: '#7a5a8a', weapon: '#b86ae8', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurhexhornidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'hex_horn', name: 'Hex Horn',
        icon: 'assets/icons/fc1050.png',
        description: 'A cursed gore: 86% ATK and -5% DEF for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.86 },
          { type: 'debuff', stat: 'def', mult: 0.95, turns: 2 },
        ],
      },
      {
        id: 'curse_of_the_maze', name: 'Curse of the Maze',
        icon: 'assets/icons/fc1084.png',
        description: 'The walls whisper: ALL enemies lose 10% ATK for 2 turns and 5% crit chance for 1 turn.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'atk', mult: 0.9, turns: 2 },
          { type: 'debuff', stat: 'critChance', add: -0.05, turns: 1 },
        ],
      },
      {
        id: 'horns_of_ruin', name: 'Horns of Ruin',
        icon: 'assets/icons/fc1044.png',
        description: 'Ruin arrives: 185% ATK — 40% more against debuffed foes.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.85, bonusVs: { kind: 'debuff', mult: 1.4 } },
        ],
      },
    ],
    passive: {
      name: 'Hexed Blood',
      icon: 'assets/icons/fc1052.png',
      description: '+15% debuff accuracy and +15% debuff resistance.',
      hooks: { accuracyAdd: 0.15, resistanceAdd: 0.15 },
    },
    positional: POSITIONALS.hexweaver,
  },

  minotaur_sunbrand: {
    id: 'minotaur_sunbrand',
    element: 'fire',
    name: 'Minotaur Sunbrand',
    title: 'Dawn Held in a Fist',
    rarity: 3,
    stats: { hp: 1130, atk: 174, def: 86, speed: 106 },
    tint: { body: '#a8622a', helm: '#e8a83a', weapon: '#f8c84a', skin: '#a88a6a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaursunbrandidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'brand_slash', name: 'Brand Slash',
        icon: 'assets/icons/fc981.png',
        description: 'A burning stroke: 105% ATK plus an 8% ATK burn for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.05 },
          { type: 'dot', pct: 0.08, turns: 2 },
        ],
      },
      {
        id: 'searing_brand', name: 'Searing Brand',
        icon: 'assets/icons/fc1052.png',
        description: 'Press the brand in: the target takes +25% damage and burns for 20% ATK, both for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'damageTaken', mult: 1.25, turns: 2 },
          { type: 'dot', pct: 0.2, turns: 2 },
        ],
      },
      {
        id: 'solar_flare', name: 'Solar Flare',
        icon: 'assets/icons/fc1044.png',
        description: 'A blinding flare: 90% ATK to ALL enemies and -6% crit chance for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'debuff', stat: 'critChance', add: -0.06, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Daybreak Fury',
      icon: 'assets/icons/fc1003.png',
      description: 'Gains +6% ATK and +6% crit chance for 1 turn at each turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.06, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.06, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.standard_bearer,
  },

  // ---- Snake cohort -------------------------------------------------------
  // Marshland natives; poison (DoT) specialists. Idle-only art for now.

  minotaur_headtaker: {
    id: 'minotaur_headtaker',
    element: 'dark',
    name: 'Minotaur Headtaker',
    title: 'The sentence is the swing.',
    rarity: 3,
    stats: { hp: 1088, atk: 164, def: 82, speed: 98 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurheadtakeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'minotaur_headtaker_edge', name: 'Headtaker\'s Edge',
        icon: 'assets/icons/fc734.png',
        description: 'Two dark cuts: 91% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.91 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'minotaur_headtaker_sentence', name: 'Headtaker\'s Sentence',
        icon: 'assets/icons/fc730.png',
        description: 'Pass judgment: 141% ATK and the target takes +12% damage for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.41 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.12, turns: 1 },
        ],
      },
      {
        id: 'minotaur_headtaker_end', name: 'Headtaker\'s End',
        icon: 'assets/icons/fc728.png',
        description: 'Carry it out: 217% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.17 },
        ],
      },
    ],
    passive: {
      name: 'Headtaker\'s Due',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 32% extra damage to enemies below 28% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.28 ? 1.32 : 1;
        },
      },
    },
    positional: POSITIONALS.standard_bearer,
  },

  minotaur_runecurser: {
    id: 'minotaur_runecurser',
    element: 'dark',
    name: 'Minotaur Runecurser',
    title: 'Carries every curse worth having.',
    rarity: 3,
    stats: { hp: 1097, atk: 169, def: 85, speed: 100 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurrunecurseridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'minotaur_runecurser_lash', name: 'Runecurser Lash',
        icon: 'assets/icons/fc1052.png',
        description: 'Two cursed lashes: 92% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.92 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'minotaur_runecurser_bane', name: 'Runecurser Bane',
        icon: 'assets/icons/fc1084.png',
        description: 'A layered curse: 142% ATK, -10% ATK and -6% DEF for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.42 },
          { type: 'debuff', stat: 'atk', mult: 0.9, turns: 2 },
          { type: 'debuff', stat: 'def', mult: 0.94, turns: 2 },
        ],
      },
      {
        id: 'minotaur_runecurser_pall', name: 'Runecurser Pall',
        icon: 'assets/icons/fc1050.png',
        description: 'A pall over everything: 96% ATK to ALL enemies and -5% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
          { type: 'debuff', stat: 'speed', mult: 0.95, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Runecurser Craft',
      icon: 'assets/icons/fc1093.png',
      description: 'Curses honed in the dark.',
      hooks: { accuracyAdd: 0.22 },
    },
    positional: POSITIONALS.vanguard_press,
  },

  minotaur_soulgorger: {
    id: 'minotaur_soulgorger',
    element: 'dark',
    name: 'Minotaur Soulgorger',
    title: 'Your vigor, redistributed.',
    rarity: 3,
    stats: { hp: 1106, atk: 174, def: 88, speed: 102 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaursoulgorgeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'minotaur_soulgorger_sip', name: 'Soulgorger\'s Sip',
        icon: 'assets/icons/fc1444.png',
        description: 'Two draining touches: 93% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.93 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'minotaur_soulgorger_feast', name: 'Soulgorger\'s Feast',
        icon: 'assets/icons/fc825.png',
        description: 'Drink deep: 143% ATK, healing himself for 34% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.43 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.34 },
        ],
      },
      {
        id: 'minotaur_soulgorger_toll', name: 'Soulgorger\'s Toll',
        icon: 'assets/icons/fc1112.png',
        description: 'Tax the living: 87% ATK to ALL enemies while he mends 8% of his max HP.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.87 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.08 },
        ],
      },
    ],
    passive: {
      name: 'Soulgorger Hunger',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, siphons 1.6% of his max HP from a random enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const amount = Math.max(1, Math.round(unit.maxHp * 0.016));
          target.takeDamage(amount, unit);
          unit.heal(amount);
          return null; // silent — small rolling hunger
        },
      },
    },
    positional: POSITIONALS.overwatch,
  },

  minotaur_duskhorn: {
    id: 'minotaur_duskhorn',
    element: 'dark',
    name: 'Minotaur Duskhorn',
    title: 'The dark keeps its edge honed.',
    rarity: 3,
    stats: { hp: 1115, atk: 179, def: 91, speed: 104 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurduskhornidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'minotaur_duskhorn_flick', name: 'Duskhorn Flick',
        icon: 'assets/icons/fc1447.png',
        description: 'Two flickering cuts: 94% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.94 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'minotaur_duskhorn_waltz', name: 'Duskhorn Waltz',
        icon: 'assets/icons/fc1587.png',
        description: 'A step through shadow: 144% ATK and +8% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.44 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.08, turns: 1 },
        ],
      },
      {
        id: 'minotaur_duskhorn_finale', name: 'Duskhorn Finale',
        icon: 'assets/icons/fc723.png',
        description: 'The last figure: 208% ATK — 25% more against debuffed prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.08, bonusVs: { kind: 'debuff', mult: 1.25 } },
        ],
      },
    ],
    passive: {
      name: 'Duskhorn Poise',
      icon: 'assets/icons/fc862.png',
      description: 'A blade kept perfectly balanced (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.09, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.05, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.focal_point,
  },

  minotaur_terrorbellow: {
    id: 'minotaur_terrorbellow',
    element: 'dark',
    name: 'Minotaur Terrorbellow',
    title: 'Fear arrives before the blow.',
    rarity: 3,
    stats: { hp: 1124, atk: 184, def: 94, speed: 106 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurterrorbellowidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'minotaur_terrorbellow_knell', name: 'Terrorbellow Knell',
        icon: 'assets/icons/fc1003.png',
        description: 'Two tolling blows: 95% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'minotaur_terrorbellow_omen', name: 'Terrorbellow Omen',
        icon: 'assets/icons/fc1084.png',
        description: 'Name their doom: 125% ATK and -11% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.25 },
          { type: 'debuff', stat: 'atk', mult: 0.89, turns: 2 },
        ],
      },
      {
        id: 'minotaur_terrorbellow_chorus', name: 'Terrorbellow Chorus',
        icon: 'assets/icons/fc807.png',
        description: 'The dread chorus: 94% ATK to ALL enemies and -6% crit chance for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.94 },
          { type: 'debuff', stat: 'critChance', add: -0.06, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Terrorbellow Presence',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, dread spreads: ALL enemies lose 3% ATK for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const e of battle.livingUnits(unit.enemyTeam())) {
            e.addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.97, turns: 1 });
          }
          return null; // silent — small rolling dread
        },
      },
    },
    positional: POSITIONALS.bloodied_fury,
  },

  minotaur_dawnpriest: {
    id: 'minotaur_dawnpriest',
    element: 'light',
    name: 'Minotaur Dawnpriest',
    title: 'Every wound answers to the light.',
    rarity: 3,
    stats: { hp: 1133, atk: 159, def: 97, speed: 108 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurdawnpriestidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'minotaur_dawnpriest_rebuke', name: 'Dawnpriest\'s Rebuke',
        icon: 'assets/icons/fc1471.png',
        description: 'Two shining raps: 96% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'minotaur_dawnpriest_grace', name: 'Dawnpriest\'s Grace',
        icon: 'assets/icons/fc1112.png',
        description: 'Pour in the light: heals an ally 125% of ATK and cleanses their debuffs.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.25 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'minotaur_dawnpriest_communion', name: 'Dawnpriest\'s Communion',
        icon: 'assets/icons/fc800.png',
        description: 'Shared light: ALL allies heal 75% of ATK plus 1.2% of max HP regen for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.75 },
          { type: 'hot', pct: 0.013, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Dawnpriest Devotion',
      icon: 'assets/icons/fc1093.png',
      description: 'Healing hands, steadied by faith.',
      hooks: { healBoostAdd: 0.22 },
    },
    positional: POSITIONALS.windrunner,
  },

  minotaur_aegishorn: {
    id: 'minotaur_aegishorn',
    element: 'light',
    name: 'Minotaur Aegishorn',
    title: 'A shield the sun would envy.',
    rarity: 3,
    stats: { hp: 1142, atk: 164, def: 100, speed: 110 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotauraegishornidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'minotaur_aegishorn_check', name: 'Aegishorn\'s Check',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield checks: 97% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.97 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'minotaur_aegishorn_ward', name: 'Aegishorn\'s Ward',
        icon: 'assets/icons/fc855.png',
        description: 'Raise the aegis over an ally: they take 6% less damage for 2 turns and heal 66% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.93, turns: 2 },
          { type: 'heal', mult: 0.66 },
        ],
      },
      {
        id: 'minotaur_aegishorn_vigil', name: 'Aegishorn\'s Vigil',
        icon: 'assets/icons/fc856.png',
        description: 'The unbroken vigil: ALL allies gain +9% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.09, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Aegishorn Constancy',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, shields the most wounded ally: takes 4% less damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.95, turns: 1 });
          return null; // silent — small rolling shelter
        },
      },
    },
    positional: POSITIONALS.pivot_step,
  },

  minotaur_radiantaxe: {
    id: 'minotaur_radiantaxe',
    element: 'light',
    name: 'Minotaur Radiantaxe',
    title: 'Morning, sharpened.',
    rarity: 3,
    stats: { hp: 1151, atk: 169, def: 79, speed: 112 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurradiantaxeidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'minotaur_radiantaxe_stroke', name: 'Radiantaxe Stroke',
        icon: 'assets/icons/fc1587.png',
        description: 'Two dawn-lit strokes: 98% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.98 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'minotaur_radiantaxe_flare', name: 'Radiantaxe Flare',
        icon: 'assets/icons/fc1447.png',
        description: 'A flare of morning: 148% ATK, and the light mends 7% of max HP.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.48 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.07 },
        ],
      },
      {
        id: 'minotaur_radiantaxe_zenith', name: 'Radiantaxe Zenith',
        icon: 'assets/icons/fc730.png',
        description: 'High noon: 211% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.11 },
        ],
      },
    ],
    passive: {
      name: 'Radiantaxe Resolve',
      icon: 'assets/icons/fc1003.png',
      description: 'Heals 4% max HP at turn start while below 55% HP.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp >= 0.55) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.04));
          if (healed <= 0) return null;
          return {
            label: 'Radiantaxe Resolve',
            message: `${unit.name}'s light knits ${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#f8d86a' }],
          };
        },
      },
    },
    positional: POSITIONALS.shield_wall,
  },

  minotaur_sunbellow: {
    id: 'minotaur_sunbellow',
    element: 'light',
    name: 'Minotaur Sunbellow',
    title: 'Good news travels armed.',
    rarity: 3,
    stats: { hp: 1160, atk: 174, def: 82, speed: 96 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaursunbellowidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'minotaur_sunbellow_call', name: 'Sunbellow\'s Call',
        icon: 'assets/icons/fc868.png',
        description: 'Two ringing notes: 99% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.99 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'minotaur_sunbellow_proclamation', name: 'Sunbellow\'s Proclamation',
        icon: 'assets/icons/fc869.png',
        description: 'Lift an ally: +12% ATK for 2 turns and 8% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.12, turns: 2 },
          { type: 'turnMeter', amount: 0.08 },
        ],
      },
      {
        id: 'minotaur_sunbellow_triumph', name: 'Sunbellow\'s Triumph',
        icon: 'assets/icons/fc882.png',
        description: 'Declare the day won: ALL allies gain +7% SPD for 2 turns and 5% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.07, turns: 2 },
          { type: 'turnMeter', amount: 0.05 },
        ],
      },
    ],
    passive: {
      name: 'Sunbellow Anthem',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start: ALL allies gain +4% crit chance for 1 turn and 1% turn meter.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) { a.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.04, turns: 1 }); if (a !== unit) a.turnMeter = Math.min(CONFIG.TURN_METER_MAX, a.turnMeter + CONFIG.TURN_METER_MAX * 0.01); }
          return null; // silent — small rolling anthem
        },
      },
    },
    positional: POSITIONALS.field_medic,
  },

  minotaur_lawhorn: {
    id: 'minotaur_lawhorn',
    element: 'light',
    name: 'Minotaur Lawhorn',
    title: 'Verdicts delivered in person.',
    rarity: 3,
    stats: { hp: 1169, atk: 179, def: 85, speed: 98 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurlawhornidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'minotaur_lawhorn_gavel', name: 'Lawhorn\'s Gavel',
        icon: 'assets/icons/fc1461.png',
        description: 'Two measured blows: 100% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'minotaur_lawhorn_inquest', name: 'Lawhorn\'s Inquest',
        icon: 'assets/icons/fc862.png',
        description: 'Open the case: 140% ATK and the target takes +16% damage for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.4 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.16, turns: 2 },
        ],
      },
      {
        id: 'minotaur_lawhorn_verdict', name: 'Lawhorn\'s Verdict',
        icon: 'assets/icons/fc744.png',
        description: 'Deliver the verdict: 213% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.13 },
        ],
      },
    ],
    passive: {
      name: 'Lawhorn Justice',
      icon: 'assets/icons/fc863.png',
      description: 'Justice sees clearly: deals 30% extra damage to stunned enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.stat === 'stun') ? 1.3 : 1;
        },
      },
    },
    positional: POSITIONALS.lifeline,
  },

  minotaur_gorebrand: {
    id: 'minotaur_gorebrand',
    element: 'wind',
    name: 'Minotaur Gorebrand',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1422, atk: 204, def: 108, speed: 104 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurgorebrandidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'minotaur_gorebrand_strike', name: 'Gorebrand\'s Strike',
        icon: 'assets/icons/fc730.png',
        description: 'Two champion blows: 85% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'minotaur_gorebrand_onslaught', name: 'Gorebrand\'s Onslaught',
        icon: 'assets/icons/fc1447.png',
        description: 'Press the advantage: 168% ATK, then +9% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.68 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.09, turns: 2 },
        ],
      },
      {
        id: 'minotaur_gorebrand_supremacy', name: 'Gorebrand\'s Supremacy',
        icon: 'assets/icons/fc767.png',
        description: 'Settle it: 219% ATK and -8% DEF for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.19 },
          { type: 'debuff', stat: 'def', mult: 0.92, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Gorebrand Supremacy',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 9% more and takes 6% less damage.',
      hooks: {
        damageDealtMult() { return 1.09; },
        damageTakenMult() { return 0.94; },
      },
    },
    positional: POSITIONALS.vanguard_press,
  },

  minotaur_runemaw: {
    id: 'minotaur_runemaw',
    element: 'water',
    name: 'Minotaur Runemaw',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1434, atk: 210, def: 112, speed: 107 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurrunemawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'minotaur_runemaw_bolt', name: 'Runemaw\'s Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'Twin arcane bolts: 86% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.86 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'minotaur_runemaw_torrent', name: 'Runemaw\'s Torrent',
        icon: 'assets/icons/fc1084.png',
        description: 'A torrent of power: 109% ATK to ALL enemies and -6% SPD for 2 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.09 },
          { type: 'debuff', stat: 'speed', mult: 0.94, turns: 2 },
        ],
      },
      {
        id: 'minotaur_runemaw_cataclysm', name: 'Runemaw\'s Cataclysm',
        icon: 'assets/icons/fc1044.png',
        description: 'The big one: 125% ATK to ALL enemies and -9% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.25 },
          { type: 'debuff', stat: 'atk', mult: 0.91, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Runemaw Resonance',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, arcane bleed sears ALL enemies for 2% of this hero\'s DEF.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.effectiveStat('def') * 0.02));
          for (const e of enemies) e.takeDamage(amount, unit);
          return null; // silent — small rolling resonance
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  minotaur_gatecolossus: {
    id: 'minotaur_gatecolossus',
    element: 'fire',
    name: 'Minotaur Gatecolossus',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1446, atk: 216, def: 116, speed: 110 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurgatecolossusidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'minotaur_gatecolossus_bash', name: 'Gatecolossus\'s Bash',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield strikes: 87% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.87 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'minotaur_gatecolossus_bulwark', name: 'Gatecolossus\'s Bulwark',
        icon: 'assets/icons/fc855.png',
        description: 'Anchor the line: ALL allies gain +11% DEF for 2 turns and take 5% less damage for 1 turn.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.11, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.95, turns: 1 },
        ],
      },
      {
        id: 'minotaur_gatecolossus_stand', name: 'Gatecolossus\'s Stand',
        icon: 'assets/icons/fc856.png',
        description: 'Refuse to fall: takes 28% less damage for 2 turns and heals 10% max HP.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.72, turns: 2 },
          { type: 'healHpPct', pct: 0.1 },
        ],
      },
    ],
    passive: {
      name: 'Gatecolossus Aegis',
      icon: 'assets/icons/fc868.png',
      description: 'The gate never buckles: takes 22% less damage while below half HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.hp / unit.maxHp < 0.5 ? 0.78 : 1;
        },
      },
    },
    positional: POSITIONALS.shield_wall,
  },

  minotaur_longhorn: {
    id: 'minotaur_longhorn',
    element: 'wind',
    name: 'Minotaur Longhorn',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1458, atk: 222, def: 120, speed: 113 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurlonghornidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'minotaur_longhorn_shot', name: 'Longhorn\'s Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'Two placed shots: 88% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.88 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'minotaur_longhorn_deadeye', name: 'Longhorn\'s Deadeye',
        icon: 'assets/icons/fc1516.png',
        description: 'The perfect line: 181% ATK and drains 9% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.81 },
          { type: 'turnMeter', amount: -0.09 },
        ],
      },
      {
        id: 'minotaur_longhorn_barrage', name: 'Longhorn\'s Barrage',
        icon: 'assets/icons/fc807.png',
        description: 'Fill the sky: 107% ATK to ALL enemies.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.07 },
          { type: 'turnMeter', amount: -0.01 },
        ],
      },
    ],
    passive: {
      name: 'Longhorn Focus',
      icon: 'assets/icons/fc862.png',
      description: 'The shot is already lined up (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.06, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.09, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.opening_volley,
  },

  minotaur_mazemyst: {
    id: 'minotaur_mazemyst',
    element: 'water',
    name: 'Minotaur Mazemyst',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1470, atk: 228, def: 124, speed: 116 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurmazemystidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'minotaur_mazemyst_touch', name: 'Mazemyst\'s Touch',
        icon: 'assets/icons/fc1112.png',
        description: 'Two chastening touches: 89% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.89 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'minotaur_mazemyst_blessing', name: 'Mazemyst\'s Blessing',
        icon: 'assets/icons/fc800.png',
        description: 'Mend an ally: 14% of max HP plus 1.9% regen for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.14 },
          { type: 'hot', pct: 0.019, turns: 2 },
        ],
      },
      {
        id: 'minotaur_mazemyst_renewal', name: 'Mazemyst\'s Renewal',
        icon: 'assets/icons/fc869.png',
        description: 'The circle holds: ALL allies heal 42% of ATK, are cleansed, and gain +6% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.42 },
          { type: 'cleanse' },
          { type: 'buff', stat: 'def', mult: 1.06, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Mazemyst Communion',
      icon: 'assets/icons/fc1003.png',
      description: 'Healing woven a little stronger.',
      hooks: { healBoostAdd: 0.19 },
    },
    positional: POSITIONALS.warding_circle,
  },

  minotaur_nullhorn: {
    id: 'minotaur_nullhorn',
    element: 'dark',
    name: 'Minotaur Nullhorn',
    title: 'Champion of the Dark',
    rarity: 4,
    stats: { hp: 1482, atk: 198, def: 102, speed: 102 },
    tint: { body: '#241f33', helm: '#3d3350', weapon: '#9a7ad0', skin: '#8a82a0' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurnullhornidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'minotaur_nullhorn_grasp', name: 'Nullhorn\'s Grasp',
        icon: 'assets/icons/fc1444.png',
        description: 'Two grasping shadows: 90% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'minotaur_nullhorn_devour', name: 'Nullhorn\'s Devour',
        icon: 'assets/icons/fc825.png',
        description: 'Feed the void: 163% ATK, healing this hero for 30% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.63 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.3 },
        ],
      },
      {
        id: 'minotaur_nullhorn_oblivion', name: 'Nullhorn\'s Oblivion',
        icon: 'assets/icons/fc734.png',
        description: 'Unmake them: 234% ATK and the target takes +18% damage for 1 turn.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.34 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.18, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Nullhorn Thirst',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, drains 1.7% of max HP from the weakest enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          enemies.sort((a, b) => a.hp - b.hp);
          const amount = Math.max(1, Math.round(unit.maxHp * 0.017));
          enemies[0].takeDamage(amount, unit);
          unit.heal(amount);
          return null; // silent — small rolling thirst
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  minotaur_gloryhorn: {
    id: 'minotaur_gloryhorn',
    element: 'light',
    name: 'Minotaur Gloryhorn',
    title: 'Champion of the Dawn',
    rarity: 4,
    stats: { hp: 1494, atk: 204, def: 106, speed: 105 },
    tint: { body: '#e0d3a8', helm: '#f5e9c0', weapon: '#ffdf70', skin: '#f0e4c8' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/minotaurgloryhornidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'minotaur_gloryhorn_radiance', name: 'Gloryhorn\'s Radiance',
        icon: 'assets/icons/fc1471.png',
        description: 'Two radiant strikes: 91% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.91 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'minotaur_gloryhorn_benediction', name: 'Gloryhorn\'s Benediction',
        icon: 'assets/icons/fc1112.png',
        description: 'Bless an ally: heals 16% of max HP and grants 10% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.16 },
          { type: 'turnMeter', amount: 0.1 },
        ],
      },
      {
        id: 'minotaur_gloryhorn_ascension', name: 'Gloryhorn\'s Ascension',
        icon: 'assets/icons/fc855.png',
        description: 'Lift the whole line: ALL allies heal 48% of ATK and gain +7% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.48 },
          { type: 'buff', stat: 'atk', mult: 1.07, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Gloryhorn Benevolence',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, ALL allies heal 0.8% of this hero\'s max HP and gain a small crit blessing for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) {
            a.heal(Math.round(unit.maxHp * 0.008), unit);
            a.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.02, turns: 1 });
          }
          return null; // silent — small rolling benevolence
        },
      },
    },
    positional: POSITIONALS.pivot_step,
  },

});
