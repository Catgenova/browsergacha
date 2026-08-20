// Drake heroes (42). Registered into the shared
// HEROES table declared in js/data/heroes.js.

Object.assign(HEROES, {

  drake_whelp: {
    id: 'drake_whelp',
    element: 'fire',
    name: 'Drake Whelp',
    title: 'Practicing His Big Roar',
    rarity: 1,
    stats: { hp: 770, atk: 111, def: 64, speed: 95 },
    tint: { body: '#a8432a', helm: '#c8633a', weapon: '#e8843a', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakewhelpidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'whelp_snap', name: 'Whelp Snap',
        icon: 'assets/icons/fc746.png',
        description: 'An eager snap: 100% ATK plus a 5% ATK scorch for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'dot', pct: 0.05, turns: 1 },
        ],
      },
      {
        id: 'practice_breath', name: 'Practice Breath',
        icon: 'assets/icons/fc1050.png',
        description: 'Almost a real one: 127% ATK plus a 12% ATK burn for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.27 },
          { type: 'dot', pct: 0.12, turns: 1 },
        ],
      },
      {
        id: 'tantrum', name: 'Tantrum',
        icon: 'assets/icons/fc744.png',
        description: 'A full meltdown: 156% ATK and -6% ATK for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.56 },
          { type: 'debuff', stat: 'atk', mult: 0.94, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Whelp\'s Mimicry',
      icon: 'assets/icons/fc863.png',
      description: 'Copies whatever hurt them: deals 15% extra damage to enemies carrying any status effect.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.length > 0 ? 1.15 : 1;
        },
      },
    },
    positional: POSITIONALS.toxicologist,
  },

  drake_ashling: {
    id: 'drake_ashling',
    element: 'fire',
    name: 'Drake Ashling',
    title: 'Hatched in the Cinders',
    rarity: 1,
    stats: { hp: 745, atk: 113, def: 60, speed: 98 },
    tint: { body: '#6a5a5a', helm: '#8a7a7a', weapon: '#e8843a', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakeashlingidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'ash_snap', name: 'Ash Snap',
        icon: 'assets/icons/fc981.png',
        description: 'A gritty snap: 98% ATK and -3% crit chance for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.98 },
          { type: 'debuff', stat: 'critChance', add: -0.03, turns: 1 },
        ],
      },
      {
        id: 'cinder_burst', name: 'Cinder Burst',
        icon: 'assets/icons/fc1044.png',
        description: 'Kick up the embers: 118% ATK plus an 8% ATK burn for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.18 },
          { type: 'dot', pct: 0.08, turns: 2 },
        ],
      },
      {
        id: 'ash_storm', name: 'Ash Storm',
        icon: 'assets/icons/fc807.png',
        description: 'A choking cloud: 54% ATK to ALL enemies and -4% crit chance for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.54 },
          { type: 'debuff', stat: 'critChance', add: -0.04, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Ash Cloud',
      icon: 'assets/icons/fc882.png',
      description: '+15% chance to dodge while below 40% HP.',
      hooks: {
        dodgeAdd(unit) {
          return unit.alive && unit.hp / unit.maxHp < 0.4 ? 0.15 : 0;
        },
      },
    },
    positional: POSITIONALS.toxicologist,
  },

  drake_cinderwing: {
    id: 'drake_cinderwing',
    element: 'fire',
    name: 'Drake Cinderwing',
    title: 'Leaves Footprints That Glow',
    rarity: 1,
    stats: { hp: 755, atk: 114, def: 61, speed: 97 },
    tint: { body: '#8a3a2a', helm: '#a85a3a', weapon: '#f8a83a', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakecinderwingidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wing_singe', name: 'Wing Singe',
        icon: 'assets/icons/fc981.png',
        description: 'A brushing wing: 91% ATK plus an 11% ATK burn for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.91 },
          { type: 'dot', pct: 0.11, turns: 1 },
        ],
      },
      {
        id: 'cinder_dive', name: 'Cinder Dive',
        icon: 'assets/icons/fc763.png',
        description: 'A glowing dive: 137% ATK plus a 16% ATK burn for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.37 },
          { type: 'dot', pct: 0.16, turns: 1 },
        ],
      },
      {
        id: 'trail_of_fire', name: 'Trail of Fire',
        icon: 'assets/icons/fc724.png',
        description: 'Drag flame through a hex row: 78% ATK plus a 10% ATK burn for 1 turn.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.78 },
          { type: 'dot', pct: 0.1, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Cinder Trail',
      icon: 'assets/icons/fc1052.png',
      description: 'At turn start, sparks catch two random enemies: 3% of his ATK as burns for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.effectiveStat('atk') * 0.03));
          for (let i = 0; i < Math.min(2, enemies.length); i++) {
            const t = enemies[Math.floor(Math.random() * enemies.length)];
            t.addStatusEffect({ kind: 'dot', amount, turns: 1 });
          }
          return null; // silent — small rolling embers
        },
      },
    },
    positional: POSITIONALS.standard_bearer,
  },

  drake_steamhisser: {
    id: 'drake_steamhisser',
    element: 'water',
    name: 'Drake Steamhisser',
    title: 'Half Kettle, All Attitude',
    rarity: 1,
    stats: { hp: 790, atk: 108, def: 68, speed: 93 },
    tint: { body: '#5a7a8a', helm: '#7a9aa8', weapon: '#a8d8e8', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakesteamhisseridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'scald_hiss', name: 'Scald Hiss',
        icon: 'assets/icons/fc819.png',
        description: 'A jet of steam: 97% ATK and -4% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.97 },
          { type: 'debuff', stat: 'atk', mult: 0.96, turns: 1 },
        ],
      },
      {
        id: 'pressure_release', name: 'Pressure Release',
        icon: 'assets/icons/fc1622.png',
        description: 'The whistle blows: 141% ATK and -9% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.41 },
          { type: 'turnMeter', amount: -0.09 },
        ],
      },
      {
        id: 'boiling_fog', name: 'Boiling Fog',
        icon: 'assets/icons/fc800.png',
        description: 'A scalding mist: 56% ATK to ALL enemies and -3% ATK for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.56 },
          { type: 'debuff', stat: 'atk', mult: 0.97, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Steam Veil',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 12% less damage while above 85% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.hp / unit.maxHp > 0.85 ? 0.88 : 1;
        },
      },
    },
    positional: POSITIONALS.pivot_step,
  },

  drake_geyserling: {
    id: 'drake_geyserling',
    element: 'water',
    name: 'Drake Geyserling',
    title: 'Erupts on a Schedule',
    rarity: 1,
    stats: { hp: 775, atk: 106, def: 66, speed: 94 },
    tint: { body: '#4a6a8a', helm: '#6a8aa8', weapon: '#7ac8e8', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakegeyserlingidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'spout_jab', name: 'Spout Jab',
        icon: 'assets/icons/fc1461.png',
        description: 'A pressurized jab: 94% ATK that knocks off 5% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.94 },
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
      {
        id: 'geyser_lift', name: 'Geyser Lift',
        icon: 'assets/icons/fc1112.png',
        description: 'Lift an ally on the plume: heals 120% of ATK and grants 6% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.2 },
          { type: 'turnMeter', amount: 0.06 },
        ],
      },
      {
        id: 'full_eruption', name: 'Full Eruption',
        icon: 'assets/icons/fc767.png',
        description: 'Right on time: 151% ATK and -14% turn meter.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.51 },
          { type: 'turnMeter', amount: -0.14 },
        ],
      },
    ],
    passive: {
      name: 'Geyser Pulse',
      icon: 'assets/icons/fc882.png',
      description: 'At turn start, 30% chance to lift a random ally 8% up the turn meter.',
      hooks: {
        onTurnStart(unit, battle) {
          if (Math.random() >= 0.30) return null;
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          const ally = allies[Math.floor(Math.random() * allies.length)];
          ally.turnMeter = Math.min(CONFIG.TURN_METER_MAX,
            ally.turnMeter + CONFIG.TURN_METER_MAX * 0.08);
          return null; // silent — small rolling lift
        },
      },
    },
    positional: POSITIONALS.safe_distance,
  },

  drake_ashglider: {
    id: 'drake_ashglider',
    element: 'wind',
    name: 'Drake Ashglider',
    title: 'Rides the Updraft Off Ruin',
    rarity: 1,
    stats: { hp: 735, atk: 112, def: 58, speed: 102 },
    tint: { body: '#7a7a8a', helm: '#9a9aa8', weapon: '#c8c0b0', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakeashglideridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'glide_rake', name: 'Glide Rake',
        icon: 'assets/icons/fc1447.png',
        description: 'A pass of talons: 99% ATK, banking away: +4% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.99 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.04, turns: 1 },
        ],
      },
      {
        id: 'thermal_loop', name: 'Thermal Loop',
        icon: 'assets/icons/fc744.png',
        description: 'Loop and strike again: two hits of 66% ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.66 },
          { type: 'damage', mult: 0.66 },
        ],
      },
      {
        id: 'downdraft', name: 'Downdraft',
        icon: 'assets/icons/fc807.png',
        description: 'Slam the air down: 58% ATK to ALL enemies and -4% SPD for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.58 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Glide on Updraft',
      icon: 'assets/icons/fc868.png',
      description: 'Gains +6% SPD and +4% crit chance for 1 turn at each turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.06, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.04, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  drake_smokewing: {
    id: 'drake_smokewing',
    element: 'wind',
    name: 'Drake Smokewing',
    title: 'Signals Nothing but Trouble',
    rarity: 1,
    stats: { hp: 760, atk: 109, def: 63, speed: 99 },
    tint: { body: '#4a4a4a', helm: '#6a6a6a', weapon: '#a8a0a8', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakesmokewingidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'smoke_slap', name: 'Smoke Slap',
        icon: 'assets/icons/fc663.png',
        description: 'A sooty slap: 103% ATK and -3% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.03 },
          { type: 'debuff', stat: 'atk', mult: 0.97, turns: 1 },
        ],
      },
      {
        id: 'blinding_plume', name: 'Blinding Plume',
        icon: 'assets/icons/fc1084.png',
        description: 'A column of black: 124% ATK and -8% crit chance for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.24 },
          { type: 'debuff', stat: 'critChance', add: -0.08, turns: 1 },
        ],
      },
      {
        id: 'smother', name: 'Smother',
        icon: 'assets/icons/fc730.png',
        description: 'Wrap them in smoke: 162% ATK and -6% SPD for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.62 },
          { type: 'debuff', stat: 'speed', mult: 0.94, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Smokescreen',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, drifting smoke costs ALL enemies 3% crit chance for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const e of battle.livingUnits(unit.enemyTeam())) {
            e.addStatusEffect({ kind: 'debuff', stat: 'critChance', add: -0.03, turns: 1 });
          }
          return null; // silent — small rolling haze
        },
      },
    },
    positional: POSITIONALS.focal_point,
  },

  drake_lavalapper: {
    id: 'drake_lavalapper',
    element: 'fire',
    name: 'Drake Lavalapper',
    title: 'Drinks Straight from the Flow',
    rarity: 1,
    stats: { hp: 800, atk: 107, def: 70, speed: 92 },
    tint: { body: '#a8542a', helm: '#e8632a', weapon: '#f8c84a', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakelavalapperidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'molten_lick', name: 'Molten Lick',
        icon: 'assets/icons/fc981.png',
        description: 'A dripping strike: 96% ATK plus a 13% ATK burn for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
          { type: 'dot', pct: 0.13, turns: 1 },
        ],
      },
      {
        id: 'lava_gulp', name: 'Lava Gulp',
        icon: 'assets/icons/fc1112.png',
        description: 'A hot drink: heals himself 14% max HP and +8% ATK for 2 turns.',
        cooldown: 4, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.14 },
          { type: 'buff', stat: 'atk', mult: 1.08, turns: 2 },
        ],
      },
      {
        id: 'molten_spit', name: 'Molten Spit',
        icon: 'assets/icons/fc1044.png',
        description: 'Share the drink: 132% ATK plus a 19% ATK burn for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.32 },
          { type: 'dot', pct: 0.19, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Molten Meal',
      icon: 'assets/icons/fc1093.png',
      description: 'Runs hot: heals 2.5% max HP at turn start while below 70% HP.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp >= 0.7) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.025));
          if (healed <= 0) return null;
          return {
            label: 'Molten Meal',
            message: `${unit.name} sips the flow: +${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#f8a83a' }],
          };
        },
      },
    },
    positional: POSITIONALS.shield_wall,
  },

  drake_ventcrawler: {
    id: 'drake_ventcrawler',
    element: 'wind',
    name: 'Drake Ventcrawler',
    title: 'At Home in the Fumes',
    rarity: 1,
    stats: { hp: 765, atk: 110, def: 65, speed: 96 },
    tint: { body: '#5a6a5a', helm: '#7a8a7a', weapon: '#a8c86a', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakeventcrawleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'vent_claw', name: 'Vent Claw',
        icon: 'assets/icons/fc1444.png',
        description: 'A claw from the crack: 101% ATK plus a 7% ATK sear for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.01 },
          { type: 'dot', pct: 0.07, turns: 1 },
        ],
      },
      {
        id: 'fume_cloud', name: 'Fume Cloud',
        icon: 'assets/icons/fc1084.png',
        description: 'Vent gases: -10% ATK and -6% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'atk', mult: 0.9, turns: 1 },
          { type: 'debuff', stat: 'critChance', add: -0.06, turns: 1 },
        ],
      },
      {
        id: 'crawlspace_ambush', name: 'Crawlspace Ambush',
        icon: 'assets/icons/fc825.png',
        description: 'From beneath the crust: 148% ATK — 20% more against debuffed prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.48, bonusVs: { kind: 'debuff', mult: 1.2 } },
        ],
      },
    ],
    passive: {
      name: 'Vent Heat',
      icon: 'assets/icons/fc1052.png',
      description: '+12% DoT damage.',
      hooks: { dotBoostAdd: 0.12 },
    },
    positional: POSITIONALS.toxicologist,
  },

  drake_magmascale: {
    id: 'drake_magmascale',
    element: 'fire',
    name: 'Drake Magmascale',
    title: 'Armor Still Cooling',
    rarity: 2,
    stats: { hp: 1000, atk: 122, def: 90, speed: 90 },
    tint: { body: '#6a3a2a', helm: '#a8432a', weapon: '#e8843a', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakemagmascaleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'scale_grind', name: 'Scale Grind',
        icon: 'assets/icons/fc854.png',
        description: 'Grind them against cooling stone: 105% ATK, hardening: +5% DEF for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.05 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.05, turns: 2 },
        ],
      },
      {
        id: 'magma_press', name: 'Magma Press',
        icon: 'assets/icons/fc1476.png',
        description: 'Press them into the flow: 136% ATK plus a 14% ATK burn for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.36 },
          { type: 'dot', pct: 0.14, turns: 2 },
        ],
      },
      {
        id: 'molten_bulwark', name: 'Molten Bulwark',
        icon: 'assets/icons/fc855.png',
        description: 'Cooling crust: takes 22% less damage and +18% DEF for 2 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.78, turns: 2 },
          { type: 'buff', stat: 'def', mult: 1.18, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Magma Scales',
      icon: 'assets/icons/fc856.png',
      description: '+7% chance to reflect all incoming damage.',
      hooks: { reflectAdd: 0.07 },
    },
    positional: POSITIONALS.iron_wake,
  },

  drake_sootback: {
    id: 'drake_sootback',
    element: 'wind',
    name: 'Drake Sootback',
    title: 'Never Quite Clean',
    rarity: 2,
    stats: { hp: 920, atk: 128, def: 74, speed: 103 },
    tint: { body: '#3a3a3a', helm: '#5a5a5a', weapon: '#c8c0b0', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakesootbackidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'soot_swipe', name: 'Soot Swipe',
        icon: 'assets/icons/fc1447.png',
        description: 'A grimy swipe: 108% ATK and -2% crit chance for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.08 },
          { type: 'debuff', stat: 'critChance', add: -0.02, turns: 1 },
        ],
      },
      {
        id: 'black_wind', name: 'Black Wind',
        icon: 'assets/icons/fc724.png',
        description: 'A dirty gust down a hex row: 88% ATK and -5% ATK for 1 turn.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.88 },
          { type: 'debuff', stat: 'atk', mult: 0.95, turns: 1 },
        ],
      },
      {
        id: 'soot_avalanche', name: 'Soot Avalanche',
        icon: 'assets/icons/fc807.png',
        description: 'Everything he ever rolled in: 64% ATK to ALL enemies and -2% turn meter.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.64 },
          { type: 'turnMeter', amount: -0.02 },
        ],
      },
    ],
    passive: {
      name: 'Soot Cover',
      icon: 'assets/icons/fc862.png',
      description: 'At turn start, shrugs into the soot: takes 10% less damage and +4% SPD for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.9, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.04, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  drake_boilbelly: {
    id: 'drake_boilbelly',
    element: 'water',
    name: 'Drake Boilbelly',
    title: 'Stomach of a Hot Spring',
    rarity: 2,
    stats: { hp: 1010, atk: 120, def: 84, speed: 94 },
    tint: { body: '#5a6a7a', helm: '#7a8a9a', weapon: '#a8d8e8', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakeboilbellyidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'belly_scald', name: 'Belly Scald',
        icon: 'assets/icons/fc762.png',
        description: 'A boiling press: 107% ATK and -4% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.07 },
          { type: 'debuff', stat: 'def', mult: 0.96, turns: 1 },
        ],
      },
      {
        id: 'rolling_boil', name: 'Rolling Boil',
        icon: 'assets/icons/fc1622.png',
        description: 'The belly rumbles: 139% ATK and -11% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.39 },
          { type: 'turnMeter', amount: -0.11 },
        ],
      },
      {
        id: 'spring_burst', name: 'Spring Burst',
        icon: 'assets/icons/fc800.png',
        description: 'The spring gives back: ALL allies heal 48% of ATK and gain +5% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.48 },
          { type: 'buff', stat: 'def', mult: 1.05, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Boiling Blood',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 18% extra damage while below 60% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return unit.hp / unit.maxHp < 0.6 ? 1.18 : 1;
        },
      },
    },
    positional: POSITIONALS.bulwark_oath,
  },

  drake_charblade: {
    id: 'drake_charblade',
    element: 'fire',
    name: 'Drake Charblade',
    title: 'Edge Quenched in Fire',
    rarity: 2,
    stats: { hp: 940, atk: 136, def: 72, speed: 102 },
    tint: { body: '#5a3a3a', helm: '#8a4a2a', weapon: '#e8632a', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakecharbladeidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'charred_cut', name: 'Charred Cut',
        icon: 'assets/icons/fc1587.png',
        description: 'A blackened edge: 110% ATK plus a 6% ATK burn for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.1 },
          { type: 'dot', pct: 0.06, turns: 2 },
        ],
      },
      {
        id: 'quench_strike', name: 'Quench Strike',
        icon: 'assets/icons/fc1447.png',
        description: 'Steel meets flesh, hissing: 153% ATK plus a 12% ATK burn for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.53 },
          { type: 'dot', pct: 0.12, turns: 1 },
        ],
      },
      {
        id: 'blade_of_embers', name: 'Blade of Embers',
        icon: 'assets/icons/fc730.png',
        description: 'The edge ignites: 171% ATK — 45% more against burning or poisoned prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.71, bonusVs: { kind: 'dot', mult: 1.45 } },
        ],
      },
    ],
    passive: {
      name: 'Charred Edge',
      icon: 'assets/icons/fc867.png',
      description: 'Gains +15% crit damage for 1 turn at each turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.15, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.last_stand,
  },

  drake_pyroclast: {
    id: 'drake_pyroclast',
    element: 'fire',
    name: 'Drake Pyroclast',
    title: 'Moves Like Bad News Downhill',
    rarity: 2,
    stats: { hp: 960, atk: 134, def: 76, speed: 100 },
    tint: { body: '#7a2a1a', helm: '#a8432a', weapon: '#f8a83a', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakepyroclastidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'surge_slam', name: 'Surge Slam',
        icon: 'assets/icons/fc767.png',
        description: 'Arrive like a flow front: 118% ATK and -4% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.18 },
          { type: 'turnMeter', amount: -0.04 },
        ],
      },
      {
        id: 'pyroclastic_rush', name: 'Pyroclastic Rush',
        icon: 'assets/icons/fc744.png',
        description: 'Too fast to outrun: 147% ATK plus a 13% ATK burn for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.47 },
          { type: 'dot', pct: 0.13, turns: 2 },
        ],
      },
      {
        id: 'burying_wave', name: 'Burying Wave',
        icon: 'assets/icons/fc1044.png',
        description: 'The hillside arrives: 68% ATK to ALL enemies plus an 8% ATK burn for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.68 },
          { type: 'dot', pct: 0.08, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Pyroclastic Flow',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, radiant heat sears ALL enemies for 1% of his ATK.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.effectiveStat('atk') * 0.01));
          for (const e of enemies) e.takeDamage(amount, unit);
          return {
            label: 'Pyroclastic Flow',
            message: `${unit.name}'s heat washes the field.`,
            floats: enemies.map((e) => ({ target: e, text: `-${amount}`, color: '#f8a83a' })),
          };
        },
      },
    },
    positional: POSITIONALS.reckless_charge,
  },

  drake_mistwing: {
    id: 'drake_mistwing',
    element: 'water',
    name: 'Drake Mistwing',
    title: 'Rain That Bites Back',
    rarity: 2,
    stats: { hp: 930, atk: 126, def: 78, speed: 101 },
    tint: { body: '#7a9aa8', helm: '#9abac8', weapon: '#c8e8f8', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakemistwingidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'mist_lash', name: 'Mist Lash',
        icon: 'assets/icons/fc819.png',
        description: 'A whipping drizzle: 102% ATK and -3% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.02 },
          { type: 'debuff', stat: 'speed', mult: 0.97, turns: 1 },
        ],
      },
      {
        id: 'cloud_cover', name: 'Cloud Cover',
        icon: 'assets/icons/fc855.png',
        description: 'Wrap an ally in mist: they take 18% less damage for 2 turns and heal 40% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.82, turns: 2 },
          { type: 'heal', mult: 0.4 },
        ],
      },
      {
        id: 'drowning_mist', name: 'Drowning Mist',
        icon: 'assets/icons/fc1084.png',
        description: 'The air turns to water: ALL enemies lose 6% ATK and 4% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'atk', mult: 0.94, turns: 2 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Mist Veil',
      icon: 'assets/icons/fc856.png',
      description: '+15% debuff resistance and +5% chance to dodge.',
      hooks: { resistanceAdd: 0.15, dodgeAdd: 0.05 },
    },
    positional: POSITIONALS.hexweaver,
  },

  drake_thermalrider: {
    id: 'drake_thermalrider',
    element: 'wind',
    name: 'Drake Thermalrider',
    title: 'Commutes by Eruption',
    rarity: 2,
    stats: { hp: 910, atk: 130, def: 70, speed: 108 },
    tint: { body: '#8a7a5a', helm: '#a89a6a', weapon: '#e8d8a8', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakethermalrideridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rising_rake', name: 'Rising Rake',
        icon: 'assets/icons/fc1447.png',
        description: 'Strike on the way up: 106% ATK, lifted: +5% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.06 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.05 },
        ],
      },
      {
        id: 'dive_bomb', name: 'Dive Bomb',
        icon: 'assets/icons/fc763.png',
        description: 'Trade altitude for argument: 157% ATK, but climbing back costs 6% meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.57 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: -0.06 },
        ],
      },
      {
        id: 'updraft_carry', name: 'Updraft Carry',
        icon: 'assets/icons/fc868.png',
        description: 'Share the thermal: ALL allies gain +6% SPD for 2 turns and 3% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.06, turns: 2 },
          { type: 'turnMeter', amount: 0.03 },
        ],
      },
    ],
    passive: {
      name: 'Ride the Thermal',
      icon: 'assets/icons/fc882.png',
      description: '+6% chance for an extra turn and +4% chance to dodge.',
      hooks: { extraTurnAdd: 0.06, dodgeAdd: 0.04 },
    },
    positional: POSITIONALS.overwatch,
  },

  drake_obsidianfang: {
    id: 'drake_obsidianfang',
    element: 'dark',
    name: 'Drake Obsidianfang',
    title: 'Edges the Mountain Made',
    rarity: 3,
    stats: { hp: 1200, atk: 184, def: 82, speed: 106 },
    tint: { body: '#1a1a2a', helm: '#3a3a4a', weapon: '#8a6ab8', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakeobsidianfangidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'glass_bite', name: 'Glass Bite',
        icon: 'assets/icons/fc1444.png',
        description: 'Volcanic glass, applied: 113% ATK plus an 8% ATK bleed for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.13 },
          { type: 'dot', pct: 0.08, turns: 1 },
        ],
      },
      {
        id: 'razor_shard', name: 'Razor Shard',
        icon: 'assets/icons/fc825.png',
        description: 'A flung edge: 149% ATK and -7% DEF for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.49 },
          { type: 'debuff', stat: 'def', mult: 0.93, turns: 2 },
        ],
      },
      {
        id: 'obsidian_execution', name: 'Obsidian Execution',
        icon: 'assets/icons/fc734.png',
        description: 'The sharpest thing on the mountain: 198% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.98 },
        ],
      },
    ],
    passive: {
      name: 'Obsidian Edge',
      icon: 'assets/icons/fc863.png',
      description: 'Shatters the nearly-broken: deals 40% extra damage to enemies below 20% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.2 ? 1.4 : 1;
        },
      },
    },
    positional: POSITIONALS.toxicologist,
  },

  drake_slagmaw: {
    id: 'drake_slagmaw',
    element: 'fire',
    name: 'Drake Slagmaw',
    title: 'Chews What the Forge Rejects',
    rarity: 2,
    stats: { hp: 1030, atk: 118, def: 92, speed: 89 },
    tint: { body: '#5a4a3a', helm: '#7a5a3a', weapon: '#a8a098', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakeslagmawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'slag_chomp', name: 'Slag Chomp',
        icon: 'assets/icons/fc746.png',
        description: 'A metal-shearing bite: 109% ATK and -5% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.09 },
          { type: 'debuff', stat: 'def', mult: 0.95, turns: 1 },
        ],
      },
      {
        id: 'spit_slag', name: 'Spit Slag',
        icon: 'assets/icons/fc981.png',
        description: 'Molten leavings: 128% ATK plus a 17% ATK burn for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.28 },
          { type: 'dot', pct: 0.17, turns: 1 },
        ],
      },
      {
        id: 'foundry_wall', name: 'Foundry Wall',
        icon: 'assets/icons/fc855.png',
        description: 'Stand like poured iron: front-hex allies gain +16% DEF for 2 turns and he takes 10% less damage for 1 turn.',
        cooldown: 6, targeting: 'front-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.16, turns: 2 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.9, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Slag Armor',
      icon: 'assets/icons/fc856.png',
      description: 'Molten rock cools into plate: hardens by 5% each turn, stacking to 15% less damage taken.',
      hooks: {
        onTurnStart(unit) {
          const stacks = unit.statusEffects.filter((fx) => fx.stat === 'slag').length;
          if (stacks >= 3) return null;
          unit.addStatusEffect({ kind: 'buff', stat: 'slag', turns: 99 });
          return null;
        },
        damageTakenMult(unit) {
          const stacks = Math.min(3, unit.statusEffects.filter((fx) => fx.stat === 'slag').length);
          return 1 - 0.05 * stacks;
        },
      },
    },
    positional: POSITIONALS.iron_wake,
  },

  drake_stormvent: {
    id: 'drake_stormvent',
    element: 'wind',
    name: 'Drake Stormvent',
    title: 'Weather Leaves Through Him',
    rarity: 2,
    stats: { hp: 925, atk: 132, def: 71, speed: 105 },
    tint: { body: '#5a6a8a', helm: '#7a8aa8', weapon: '#e8e84a', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakestormventidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'vent_gust', name: 'Vent Gust',
        icon: 'assets/icons/fc1030.png',
        description: 'A knockdown gust: 104% ATK and -6% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.04 },
          { type: 'turnMeter', amount: -0.06 },
        ],
      },
      {
        id: 'shear_burst', name: 'Shear Burst',
        icon: 'assets/icons/fc724.png',
        description: 'Wind shear down a hex row: 91% ATK and -3% SPD for 1 turn.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.91 },
          { type: 'debuff', stat: 'speed', mult: 0.97, turns: 1 },
        ],
      },
      {
        id: 'storm_discharge', name: 'Storm Discharge',
        icon: 'assets/icons/fc807.png',
        description: 'The vent lets go: 66% ATK to ALL enemies and -4% turn meter.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.66 },
          { type: 'turnMeter', amount: -0.04 },
        ],
      },
    ],
    passive: {
      name: 'Static Vent',
      icon: 'assets/icons/fc867.png',
      description: '+6% chance to drain 20% AP on attack.',
      hooks: { apDrainAdd: 0.06 },
    },
    positional: POSITIONALS.hexweaver,
  },

  drake_calderalord: {
    id: 'drake_calderalord',
    element: 'fire',
    name: 'Drake Calderalord',
    title: 'Landlord of the Crater',
    rarity: 3,
    stats: { hp: 1220, atk: 172, def: 92, speed: 100 },
    tint: { body: '#8a2a1a', helm: '#e8c83a', weapon: '#f8a83a', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakecalderalordidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'caldera_claim', name: 'Caldera Claim',
        icon: 'assets/icons/fc746.png',
        description: 'Rent is due: 118% ATK plus a 7% ATK burn for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.18 },
          { type: 'dot', pct: 0.07, turns: 1 },
        ],
      },
      {
        id: 'crater_slam', name: 'Crater Slam',
        icon: 'assets/icons/fc767.png',
        description: 'Bring the rim down: 144% ATK to a hex row plus a 9% ATK burn for 1 turn.',
        cooldown: 5, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.44 },
          { type: 'dot', pct: 0.09, turns: 1 },
        ],
      },
      {
        id: 'eruption_decree', name: 'Eruption Decree',
        icon: 'assets/icons/fc1044.png',
        description: 'The mountain rules in his favor: 84% ATK to ALL enemies plus a 12% ATK burn for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.84 },
          { type: 'dot', pct: 0.12, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Caldera Heart',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, ALL allies gain +3% ATK and +3% crit chance for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const ally of battle.livingUnits(unit.team)) {
            ally.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.03, turns: 1 });
            ally.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.03, turns: 1 });
          }
          return null; // silent — small rolling heat
        },
      },
    },
    positional: POSITIONALS.press_the_flank,
  },

  drake_tempestwing: {
    id: 'drake_tempestwing',
    element: 'wind',
    name: 'Drake Tempestwing',
    title: 'The Sky Over the Mountain',
    rarity: 3,
    stats: { hp: 1120, atk: 178, def: 82, speed: 112 },
    tint: { body: '#4a5a8a', helm: '#6a7aa8', weapon: '#e8e8f8', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/draketempestwingidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'tempest_rake', name: 'Tempest Rake',
        icon: 'assets/icons/fc1030.png',
        description: 'Claws on the wind: 115% ATK and -6% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.15 },
          { type: 'turnMeter', amount: -0.06 },
        ],
      },
      {
        id: 'wing_of_the_storm', name: 'Wing of the Storm',
        icon: 'assets/icons/fc744.png',
        description: 'One beat of the wing: 166% ATK and -10% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.66 },
          { type: 'turnMeter', amount: -0.1 },
        ],
      },
      {
        id: 'mountain_gale', name: 'Mountain Gale',
        icon: 'assets/icons/fc807.png',
        description: 'The summit exhales: 74% ATK to ALL enemies, -5% SPD for 1 turn and -3% meter.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.74 },
          { type: 'debuff', stat: 'speed', mult: 0.95, turns: 1 },
          { type: 'turnMeter', amount: -0.03 },
        ],
      },
    ],
    passive: {
      name: 'Tempest Wings',
      icon: 'assets/icons/fc882.png',
      description: 'At turn start, gusts cost ALL enemies 1% turn meter while he gains +6% SPD for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const e of battle.livingUnits(unit.enemyTeam())) {
            e.turnMeter = Math.max(0, e.turnMeter - CONFIG.TURN_METER_MAX * 0.01);
          }
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.06, turns: 1 });
          return null; // silent — small rolling gale
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  drake_deepvent: {
    id: 'drake_deepvent',
    element: 'water',
    name: 'Drake Deepvent',
    title: 'Pressure Given Patience',
    rarity: 3,
    stats: { hp: 1280, atk: 164, def: 98, speed: 95 },
    tint: { body: '#2a4a5a', helm: '#4a6a7a', weapon: '#7ac8e8', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakedeepventidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'pressure_bite', name: 'Pressure Bite',
        icon: 'assets/icons/fc746.png',
        description: 'Deep-sea force: 115% ATK and -5% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.15 },
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
      {
        id: 'thermal_plume', name: 'Thermal Plume',
        icon: 'assets/icons/fc1112.png',
        description: 'A warm column: heals an ally 15% of his max HP and grants +8% SPD for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.15 },
          { type: 'buff', stat: 'speed', mult: 1.08, turns: 2 },
        ],
      },
      {
        id: 'vent_collapse', name: 'Vent Collapse',
        icon: 'assets/icons/fc1622.png',
        description: 'The pressure wins: 187% ATK and -12% turn meter.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.87 },
          { type: 'turnMeter', amount: -0.12 },
        ],
      },
    ],
    passive: {
      name: 'Deep Pressure Vent',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 30% less damage while below 25% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.alive && unit.hp / unit.maxHp < 0.25 ? 0.7 : 1;
        },
      },
    },
    positional: POSITIONALS.iron_wake,
  },

  drake_hellscale: {
    id: 'drake_hellscale',
    element: 'fire',
    name: 'Drake Hellscale',
    title: 'Scales Forged Below',
    rarity: 3,
    stats: { hp: 1180, atk: 184, def: 86, speed: 104 },
    tint: { body: '#6a1a1a', helm: '#a8432a', weapon: '#e8632a', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakehellscaleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'hellfire_rake', name: 'Hellfire Rake',
        icon: 'assets/icons/fc981.png',
        description: 'Claws that remember the deep fire: 114% ATK plus a 10% ATK burn for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.14 },
          { type: 'dot', pct: 0.1, turns: 1 },
        ],
      },
      {
        id: 'scale_shrapnel', name: 'Scale Shrapnel',
        icon: 'assets/icons/fc1044.png',
        description: 'Shed burning scales: 96% ATK to a hex row plus a 7% ATK burn for 1 turn.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
          { type: 'dot', pct: 0.07, turns: 1 },
        ],
      },
      {
        id: 'hells_regard', name: 'Hell\'s Regard',
        icon: 'assets/icons/fc734.png',
        description: 'A look that melts stone: 214% ATK.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.14 },
        ],
      },
    ],
    passive: {
      name: 'Hellscale',
      icon: 'assets/icons/fc1093.png',
      description: 'Deals 8% extra damage and +10% DoT damage.',
      hooks: {
        damageDealtMult() { return 1.08; },
        dotBoostAdd: 0.10,
      },
    },
    positional: POSITIONALS.standard_bearer,
  },

  drake_mirrorscale: {
    id: 'drake_mirrorscale',
    element: 'water',
    name: 'Drake Mirrorscale',
    title: 'Polished by the Steam',
    rarity: 3,
    stats: { hp: 1240, atk: 160, def: 100, speed: 97 },
    tint: { body: '#8aa8b8', helm: '#a8c8d8', weapon: '#e8e8f8', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakemirrorscaleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'gleam_flash', name: 'Gleam Flash',
        icon: 'assets/icons/fc1084.png',
        description: 'A blinding reflection: 108% ATK and -5% crit chance for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.08 },
          { type: 'debuff', stat: 'critChance', add: -0.05, turns: 1 },
        ],
      },
      {
        id: 'mirror_guard', name: 'Mirror Guard',
        icon: 'assets/icons/fc855.png',
        description: 'Angle the scales: an ally takes 15% less damage for 2 turns and heals 10% of his max HP.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.85, turns: 2 },
          { type: 'healHpPct', pct: 0.1 },
        ],
      },
      {
        id: 'prismatic_wall', name: 'Prismatic Wall',
        icon: 'assets/icons/fc854.png',
        description: 'The wall of light: ALL allies take 7% less damage for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.93, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Mirror Scales',
      icon: 'assets/icons/fc856.png',
      description: '+6% chance to reflect all incoming damage and +12% debuff resistance.',
      hooks: { reflectAdd: 0.06, resistanceAdd: 0.12 },
    },
    positional: POSITIONALS.thornguard,
  },

  drake_sunscale: {
    id: 'drake_sunscale',
    element: 'light',
    name: 'Drake Sunscale',
    title: 'Dawn Reflected a Thousand Times',
    rarity: 3,
    stats: { hp: 1200, atk: 168, def: 90, speed: 102 },
    tint: { body: '#e8c86a', helm: '#f8e8a8', weapon: '#f8d86a', skin: '#c88a6a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakesunscaleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'radiant_rake', name: 'Radiant Rake',
        icon: 'assets/icons/fc1447.png',
        description: 'Claws of morning light: 105% ATK, gleaming: +4% crit chance and +4% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.05 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.04, turns: 1 },
          { type: 'buff', stat: 'speed', mult: 1.04, turns: 1 },
        ],
      },
      {
        id: 'sunscale_ward', name: 'Sunscale Ward',
        icon: 'assets/icons/fc1112.png',
        description: 'A scale of pure dawn: heals an ally 17% of her max HP and cleanses their debuffs.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.17 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'thousand_dawns', name: 'Thousand Dawns',
        icon: 'assets/icons/fc855.png',
        description: 'Every scale a sunrise: ALL allies heal 52% of ATK and gain +6% crit chance for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.52 },
          { type: 'buff', stat: 'critChance', add: 0.06, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Sunscale Radiance',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, allies below 80% HP bask: heal 1.5% of her max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          const dim = battle.livingUnits(unit.team)
            .filter((u) => u.hp / u.maxHp < 0.8);
          if (dim.length === 0) return null;
          let total = 0;
          for (const ally of dim) total += ally.heal(Math.round(unit.maxHp * 0.015));
          if (total <= 0) return null;
          return {
            label: 'Sunscale Radiance',
            message: `${unit.name}'s glow restores ${total} HP.`,
            floats: [],
          };
        },
      },
    },
    positional: POSITIONALS.lifeline,
  },

  // ---- Twilight cohorts: dark & light 3-star heroes for every race --------
  // Summoned exclusively from Temporal Scrolls, like all Dark/Light heroes.
  // Procedural placeholder art renders until real idle sheets land.

  drake_gravewing: {
    id: 'drake_gravewing',
    element: 'dark',
    name: 'Drake Gravewing',
    title: 'The sentence is the swing.',
    rarity: 3,
    stats: { hp: 1172, atk: 182, def: 94, speed: 104 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakegravewingidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'drake_gravewing_edge', name: 'Gravewing\'s Edge',
        icon: 'assets/icons/fc734.png',
        description: 'Two dark cuts: 91% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.91 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'drake_gravewing_sentence', name: 'Gravewing\'s Sentence',
        icon: 'assets/icons/fc730.png',
        description: 'Pass judgment: 200% ATK and the target takes +12% damage for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.01 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.12, turns: 1 },
        ],
      },
      {
        id: 'drake_gravewing_end', name: 'Gravewing\'s End',
        icon: 'assets/icons/fc728.png',
        description: 'Carry it out: 277% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.77 },
        ],
      },
    ],
    passive: {
      name: 'Gravewing\'s Due',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 34% extra damage to enemies below 26% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.26 ? 1.34 : 1;
        },
      },
    },
    positional: POSITIONALS.standard_bearer,
  },

  drake_hexscorch: {
    id: 'drake_hexscorch',
    element: 'dark',
    name: 'Drake Hexscorch',
    title: 'Carries every curse worth having.',
    rarity: 3,
    stats: { hp: 1181, atk: 187, def: 97, speed: 106 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakehexscorchidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'drake_hexscorch_lash', name: 'Hexscorch Lash',
        icon: 'assets/icons/fc1052.png',
        description: 'Two cursed lashes: 92% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.92 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'drake_hexscorch_bane', name: 'Hexscorch Bane',
        icon: 'assets/icons/fc1084.png',
        description: 'A layered curse: 202% ATK, -16% ATK and -12% DEF for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.02 },
          { type: 'debuff', stat: 'atk', mult: 0.84, turns: 2 },
          { type: 'debuff', stat: 'def', mult: 0.88, turns: 2 },
        ],
      },
      {
        id: 'drake_hexscorch_pall', name: 'Hexscorch Pall',
        icon: 'assets/icons/fc1050.png',
        description: 'A pall over everything: 156% ATK to ALL enemies and -5% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.56 },
          { type: 'debuff', stat: 'speed', mult: 0.95, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Hexscorch Craft',
      icon: 'assets/icons/fc1093.png',
      description: 'Curses honed in the dark.',
      hooks: { accuracyAdd: 0.11, resistanceAdd: 0.13 },
    },
    positional: POSITIONALS.vanguard_press,
  },

  drake_bloodember: {
    id: 'drake_bloodember',
    element: 'dark',
    name: 'Drake Bloodember',
    title: 'Your vigor, redistributed.',
    rarity: 3,
    stats: { hp: 1190, atk: 162, def: 100, speed: 108 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakebloodemberidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'drake_bloodember_sip', name: 'Bloodember\'s Sip',
        icon: 'assets/icons/fc1444.png',
        description: 'Two draining touches: 93% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.93 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'drake_bloodember_feast', name: 'Bloodember\'s Feast',
        icon: 'assets/icons/fc825.png',
        description: 'Drink deep: 202% ATK, healing himself for 46% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.03 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.46 },
        ],
      },
      {
        id: 'drake_bloodember_toll', name: 'Bloodember\'s Toll',
        icon: 'assets/icons/fc1112.png',
        description: 'Tax the living: 147% ATK to ALL enemies while he mends 14% of his max HP.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.47 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.14 },
        ],
      },
    ],
    passive: {
      name: 'Bloodember Hunger',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, siphons 1.5% of his max HP from a random enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const amount = Math.max(1, Math.round(unit.maxHp * 0.015));
          target.takeDamage(amount, unit);
          unit.heal(amount);
          return null; // silent — small rolling hunger
        },
      },
    },
    positional: POSITIONALS.overwatch,
  },

  drake_duskflier: {
    id: 'drake_duskflier',
    element: 'dark',
    name: 'Drake Duskflier',
    title: 'The dark keeps its edge honed.',
    rarity: 3,
    stats: { hp: 1199, atk: 167, def: 79, speed: 110 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakeduskflieridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'drake_duskflier_flick', name: 'Duskflier Flick',
        icon: 'assets/icons/fc1447.png',
        description: 'Two flickering cuts: 94% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.94 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'drake_duskflier_waltz', name: 'Duskflier Waltz',
        icon: 'assets/icons/fc1587.png',
        description: 'A step through shadow: 204% ATK and +14% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.04 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.14, turns: 1 },
        ],
      },
      {
        id: 'drake_duskflier_finale', name: 'Duskflier Finale',
        icon: 'assets/icons/fc723.png',
        description: 'The last figure: 268% ATK — 25% more against debuffed prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.68, bonusVs: { kind: 'debuff', mult: 1.25 } },
        ],
      },
    ],
    passive: {
      name: 'Duskflier Poise',
      icon: 'assets/icons/fc862.png',
      description: 'A blade kept perfectly balanced (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.11, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.03, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.focal_point,
  },

  drake_dreadfume: {
    id: 'drake_dreadfume',
    element: 'dark',
    name: 'Drake Dreadfume',
    title: 'Fear arrives before the blow.',
    rarity: 3,
    stats: { hp: 1208, atk: 172, def: 82, speed: 112 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakedreadfumeidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'drake_dreadfume_knell', name: 'Dreadfume Knell',
        icon: 'assets/icons/fc1003.png',
        description: 'Two tolling blows: 95% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'drake_dreadfume_omen', name: 'Dreadfume Omen',
        icon: 'assets/icons/fc1084.png',
        description: 'Name their doom: 184% ATK and -17% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.85 },
          { type: 'debuff', stat: 'atk', mult: 0.83, turns: 2 },
        ],
      },
      {
        id: 'drake_dreadfume_chorus', name: 'Dreadfume Chorus',
        icon: 'assets/icons/fc807.png',
        description: 'The dread chorus: 154% ATK to ALL enemies and -4% crit chance for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.54 },
          { type: 'debuff', stat: 'critChance', add: -0.04, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Dreadfume Presence',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, dread spreads: ALL enemies lose 1.5% ATK for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const e of battle.livingUnits(unit.enemyTeam())) {
            e.addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.985, turns: 1 });
          }
          return null; // silent — small rolling dread
        },
      },
    },
    positional: POSITIONALS.bloodied_fury,
  },

  drake_lightscale: {
    id: 'drake_lightscale',
    element: 'light',
    name: 'Drake Lightscale',
    title: 'Every wound answers to the light.',
    rarity: 3,
    stats: { hp: 1217, atk: 177, def: 85, speed: 96 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakelightscaleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'drake_lightscale_rebuke', name: 'Lightscale\'s Rebuke',
        icon: 'assets/icons/fc1471.png',
        description: 'Two shining raps: 96% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'drake_lightscale_grace', name: 'Lightscale\'s Grace',
        icon: 'assets/icons/fc1112.png',
        description: 'Pour in the light: heals an ally 185% of ATK and cleanses their debuffs.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.85 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'drake_lightscale_communion', name: 'Lightscale\'s Communion',
        icon: 'assets/icons/fc800.png',
        description: 'Shared light: ALL allies heal 135% of ATK plus 1.9% of max HP regen for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.35 },
          { type: 'hot', pct: 0.018, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Lightscale Devotion',
      icon: 'assets/icons/fc1093.png',
      description: 'Healing hands, steadied by faith.',
      hooks: { healBoostAdd: 0.26 },
    },
    positional: POSITIONALS.windrunner,
  },

  drake_aegisplate: {
    id: 'drake_aegisplate',
    element: 'light',
    name: 'Drake Aegisplate',
    title: 'A shield the sun would envy.',
    rarity: 3,
    stats: { hp: 1226, atk: 182, def: 88, speed: 98 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakeaegisplateidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'drake_aegisplate_check', name: 'Aegisplate\'s Check',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield checks: 97% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.97 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'drake_aegisplate_ward', name: 'Aegisplate\'s Ward',
        icon: 'assets/icons/fc855.png',
        description: 'Raise the aegis over an ally: they take 16% less damage for 2 turns and heal 126% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.84, turns: 2 },
          { type: 'heal', mult: 1.26 },
        ],
      },
      {
        id: 'drake_aegisplate_vigil', name: 'Aegisplate\'s Vigil',
        icon: 'assets/icons/fc856.png',
        description: 'The unbroken vigil: ALL allies gain +1% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.01, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Aegisplate Constancy',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, shields the most wounded ally: takes 14% less damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.86, turns: 1 });
          return null; // silent — small rolling shelter
        },
      },
    },
    positional: POSITIONALS.pivot_step,
  },

  drake_dawnflare: {
    id: 'drake_dawnflare',
    element: 'light',
    name: 'Drake Dawnflare',
    title: 'Morning, sharpened.',
    rarity: 3,
    stats: { hp: 1235, atk: 187, def: 91, speed: 100 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakedawnflareidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'drake_dawnflare_stroke', name: 'Dawnflare Stroke',
        icon: 'assets/icons/fc1587.png',
        description: 'Two dawn-lit strokes: 98% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.98 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'drake_dawnflare_flare', name: 'Dawnflare Flare',
        icon: 'assets/icons/fc1447.png',
        description: 'A flare of morning: 208% ATK, and the light mends 13% of max HP.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.08 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.13 },
        ],
      },
      {
        id: 'drake_dawnflare_zenith', name: 'Dawnflare Zenith',
        icon: 'assets/icons/fc730.png',
        description: 'High noon: 271% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.71 },
        ],
      },
    ],
    passive: {
      name: 'Dawnflare Resolve',
      icon: 'assets/icons/fc1003.png',
      description: 'Heals 3.5% max HP at turn start while below 60% HP.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp >= 0.6) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.035));
          if (healed <= 0) return null;
          return {
            label: 'Dawnflare Resolve',
            message: `${unit.name}'s light knits ${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#f8d86a' }],
          };
        },
      },
    },
    positional: POSITIONALS.shield_wall,
  },

  drake_sunspire: {
    id: 'drake_sunspire',
    element: 'light',
    name: 'Drake Sunspire',
    title: 'Good news travels armed.',
    rarity: 3,
    stats: { hp: 1244, atk: 162, def: 94, speed: 102 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakesunspireidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'drake_sunspire_call', name: 'Sunspire\'s Call',
        icon: 'assets/icons/fc868.png',
        description: 'Two ringing notes: 99% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.99 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'drake_sunspire_proclamation', name: 'Sunspire\'s Proclamation',
        icon: 'assets/icons/fc869.png',
        description: 'Lift an ally: +18% ATK for 2 turns and 14% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.18, turns: 2 },
          { type: 'turnMeter', amount: 0.14 },
        ],
      },
      {
        id: 'drake_sunspire_triumph', name: 'Sunspire\'s Triumph',
        icon: 'assets/icons/fc882.png',
        description: 'Declare the day won: ALL allies gain +5% SPD for 2 turns and 5% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.05, turns: 2 },
          { type: 'turnMeter', amount: 0.05 },
        ],
      },
    ],
    passive: {
      name: 'Sunspire Anthem',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start: ALL allies gain +2.5% ATK for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) { a.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.025, turns: 1 }); }
          return null; // silent — small rolling anthem
        },
      },
    },
    positional: POSITIONALS.field_medic,
  },

  drake_oathflame: {
    id: 'drake_oathflame',
    element: 'light',
    name: 'Drake Oathflame',
    title: 'Verdicts delivered in person.',
    rarity: 3,
    stats: { hp: 1253, atk: 167, def: 97, speed: 104 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakeoathflameidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'drake_oathflame_gavel', name: 'Oathflame\'s Gavel',
        icon: 'assets/icons/fc1461.png',
        description: 'Two measured blows: 100% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'drake_oathflame_inquest', name: 'Oathflame\'s Inquest',
        icon: 'assets/icons/fc862.png',
        description: 'Open the case: 200% ATK and the target takes +22% damage for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.0 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.22, turns: 2 },
        ],
      },
      {
        id: 'drake_oathflame_verdict', name: 'Oathflame\'s Verdict',
        icon: 'assets/icons/fc744.png',
        description: 'Deliver the verdict: 273% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.73 },
        ],
      },
    ],
    passive: {
      name: 'Oathflame Justice',
      icon: 'assets/icons/fc863.png',
      description: 'Justice sees clearly: deals 28% extra damage to exposed (vulnerability-marked) enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.stat === 'damageTaken' && fx.kind === 'debuff') ? 1.28 : 1;
        },
      },
    },
    positional: POSITIONALS.lifeline,
  },

  // ---- Champion cohorts: 4-star heroes for every race ---------------------
  // Elemental champions summon from Rare Scrolls; dark/light champions
  // from Temporal Scrolls. Placeholder art until idle sheets land.

  drake_warscale: {
    id: 'drake_warscale',
    element: 'wind',
    name: 'Drake Warscale',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1518, atk: 228, def: 126, speed: 116 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakewarscaleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'drake_warscale_strike', name: 'Warscale\'s Strike',
        icon: 'assets/icons/fc730.png',
        description: 'Two champion blows: 97% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.97 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'drake_warscale_onslaught', name: 'Warscale\'s Onslaught',
        icon: 'assets/icons/fc1447.png',
        description: 'Press the advantage: 210% ATK, then +15% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.1 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.15, turns: 2 },
        ],
      },
      {
        id: 'drake_warscale_supremacy', name: 'Warscale\'s Supremacy',
        icon: 'assets/icons/fc767.png',
        description: 'Settle it: 261% ATK and -9% DEF for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.61 },
          { type: 'debuff', stat: 'def', mult: 0.91, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Warscale Supremacy',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 6% more and takes 6% less damage.',
      hooks: {
        damageDealtMult() { return 1.06; },
        damageTakenMult() { return 0.94; },
      },
    },
    positional: POSITIONALS.reckless_charge,
  },

  drake_runewing: {
    id: 'drake_runewing',
    element: 'water',
    name: 'Drake Runewing',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1530, atk: 198, def: 104, speed: 102 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakerunewingidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'drake_runewing_bolt', name: 'Runewing\'s Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'Twin arcane bolts: 98% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.98 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'drake_runewing_torrent', name: 'Runewing\'s Torrent',
        icon: 'assets/icons/fc1084.png',
        description: 'A torrent of power: 151% ATK to ALL enemies and -4% SPD for 2 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.51 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 2 },
        ],
      },
      {
        id: 'drake_runewing_cataclysm', name: 'Runewing\'s Cataclysm',
        icon: 'assets/icons/fc1044.png',
        description: 'The big one: 166% ATK to ALL enemies and -9% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.67 },
          { type: 'debuff', stat: 'atk', mult: 0.91, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Runewing Resonance',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, arcane bleed sears ALL enemies for 2.5% of this hero\'s DEF.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.effectiveStat('def') * 0.025));
          for (const e of enemies) e.takeDamage(amount, unit);
          return null; // silent — small rolling resonance
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  drake_wallscale: {
    id: 'drake_wallscale',
    element: 'fire',
    name: 'Drake Wallscale',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1542, atk: 204, def: 108, speed: 105 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakewallscaleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'drake_wallscale_bash', name: 'Wallscale\'s Bash',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield strikes: 99% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.99 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'drake_wallscale_bulwark', name: 'Wallscale\'s Bulwark',
        icon: 'assets/icons/fc855.png',
        description: 'Anchor the line: ALL allies gain +17% DEF for 2 turns and take 5% less damage for 1 turn.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.17, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.95, turns: 1 },
        ],
      },
      {
        id: 'drake_wallscale_stand', name: 'Wallscale\'s Stand',
        icon: 'assets/icons/fc856.png',
        description: 'Refuse to fall: takes 34% less damage for 2 turns and heals 16% max HP.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.66, turns: 2 },
          { type: 'healHpPct', pct: 0.16 },
        ],
      },
    ],
    passive: {
      name: 'Wallscale Aegis',
      icon: 'assets/icons/fc868.png',
      description: 'Scales lock down as the wounds mount: takes 10% less damage, and 20% less below a quarter HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.hp / unit.maxHp < 0.25 ? 0.80 : 0.90;
        },
      },
    },
    positional: POSITIONALS.iron_wake,
  },

  drake_farwing: {
    id: 'drake_farwing',
    element: 'wind',
    name: 'Drake Farwing',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1554, atk: 210, def: 112, speed: 108 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakefarwingidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'drake_farwing_shot', name: 'Farwing\'s Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'Two placed shots: 100% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'drake_farwing_deadeye', name: 'Farwing\'s Deadeye',
        icon: 'assets/icons/fc1516.png',
        description: 'The perfect line: 223% ATK and drains 15% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.23 },
          { type: 'turnMeter', amount: -0.15 },
        ],
      },
      {
        id: 'drake_farwing_barrage', name: 'Farwing\'s Barrage',
        icon: 'assets/icons/fc807.png',
        description: 'Fill the sky: 149% ATK to ALL enemies.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.49 },
          { type: 'turnMeter', amount: -0.01 },
        ],
      },
    ],
    passive: {
      name: 'Farwing Focus',
      icon: 'assets/icons/fc862.png',
      description: 'The shot is already lined up (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.11, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.03, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: POSITIONALS.overwatch,
  },

  drake_mistflame: {
    id: 'drake_mistflame',
    element: 'water',
    name: 'Drake Mistflame',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1566, atk: 216, def: 116, speed: 111 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakemistflameidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'drake_mistflame_touch', name: 'Mistflame\'s Touch',
        icon: 'assets/icons/fc1112.png',
        description: 'Two chastening touches: 71% then 21% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.71 },
          { type: 'damage', mult: 0.21 },
        ],
      },
      {
        id: 'drake_mistflame_blessing', name: 'Mistflame\'s Blessing',
        icon: 'assets/icons/fc800.png',
        description: 'Mend an ally: 20% of max HP plus 3.1% regen for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.2 },
          { type: 'hot', pct: 0.031, turns: 2 },
        ],
      },
      {
        id: 'drake_mistflame_renewal', name: 'Mistflame\'s Renewal',
        icon: 'assets/icons/fc869.png',
        description: 'The circle holds: ALL allies heal 54% of ATK, are cleansed, and gain +6% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.54 },
          { type: 'cleanse' },
          { type: 'buff', stat: 'def', mult: 1.06, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Mistflame Communion',
      icon: 'assets/icons/fc1003.png',
      description: 'Healing woven a little stronger.',
      hooks: { healBoostAdd: 0.31 },
    },
    positional: POSITIONALS.pivot_step,
  },

  drake_nullflame: {
    id: 'drake_nullflame',
    element: 'dark',
    name: 'Drake Nullflame',
    title: 'Champion of the Dark',
    rarity: 4,
    stats: { hp: 1578, atk: 222, def: 120, speed: 114 },
    tint: { body: '#241f33', helm: '#3d3350', weapon: '#9a7ad0', skin: '#8a82a0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakenullflameidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'drake_nullflame_grasp', name: 'Nullflame\'s Grasp',
        icon: 'assets/icons/fc1444.png',
        description: 'Two grasping shadows: 72% then 21% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.72 },
          { type: 'damage', mult: 0.21 },
        ],
      },
      {
        id: 'drake_nullflame_devour', name: 'Nullflame\'s Devour',
        icon: 'assets/icons/fc825.png',
        description: 'Feed the void: 205% ATK, healing this hero for 42% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.05 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.42 },
        ],
      },
      {
        id: 'drake_nullflame_oblivion', name: 'Nullflame\'s Oblivion',
        icon: 'assets/icons/fc734.png',
        description: 'Unmake them: 276% ATK and the target takes +24% damage for 1 turn.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.76 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.24, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Nullflame Thirst',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, drains 1.1% of max HP from the weakest enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          enemies.sort((a, b) => a.hp - b.hp);
          const amount = Math.max(1, Math.round(unit.maxHp * 0.011));
          enemies[0].takeDamage(amount, unit);
          unit.heal(amount);
          return null; // silent — small rolling thirst
        },
      },
    },
    positional: POSITIONALS.hexweaver,
  },

  drake_gloryflame: {
    id: 'drake_gloryflame',
    element: 'light',
    name: 'Drake Gloryflame',
    title: 'Champion of the Dawn',
    rarity: 4,
    stats: { hp: 1590, atk: 228, def: 124, speed: 100 },
    tint: { body: '#e0d3a8', helm: '#f5e9c0', weapon: '#ffdf70', skin: '#f0e4c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/drakegloryflameidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'drake_gloryflame_radiance', name: 'Gloryflame\'s Radiance',
        icon: 'assets/icons/fc1471.png',
        description: 'Two radiant strikes: 73% then 21% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.73 },
          { type: 'damage', mult: 0.21 },
        ],
      },
      {
        id: 'drake_gloryflame_benediction', name: 'Gloryflame\'s Benediction',
        icon: 'assets/icons/fc1112.png',
        description: 'Bless an ally: heals 22% of max HP and grants 16% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.22 },
          { type: 'turnMeter', amount: 0.16 },
        ],
      },
      {
        id: 'drake_gloryflame_ascension', name: 'Gloryflame\'s Ascension',
        icon: 'assets/icons/fc855.png',
        description: 'Lift the whole line: ALL allies heal 60% of ATK and gain +5% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.6 },
          { type: 'buff', stat: 'atk', mult: 1.05, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Gloryflame Benevolence',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, ALL allies heal 1.3% of this hero\'s max HP and gain a small def blessing for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) {
            a.heal(Math.round(unit.maxHp * 0.013));
            a.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.04, turns: 1 });
          }
          return null; // silent — small rolling benevolence
        },
      },
    },
    positional: POSITIONALS.warding_circle,
  },

});
