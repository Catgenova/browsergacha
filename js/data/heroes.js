// Hero definitions. Every hero follows the same contract:
//   - 3 active abilities: one no-cooldown, one short cooldown, one long cooldown
//   - 1 passive ability: hooks.onTurnStart(unit, battle) -> null | {
//       label, message, floats: [{ target, text, color }] }
//   - 1 positional bonus, active only in the matching grid position
//   - sprite: spritesheet reference (placeholder art is generated when the
//     PNG is absent — drop real sheets into assets/heroes/ to replace it)
//
// Rarity drives gacha rates and rough stat budgets (3★ < 4★ < 5★).

const HEROES = {
  // ---- 5★ ------------------------------------------------------------------

  // Aniani (id 'echo', art in assets/heroes/Echo), the first 5★: a water
  // tank built around Crystal Mirrors — six
  // floating shields that halve incoming hits (one shatters per hit) and
  // power her DEF-scaled skills. Every animation ships in seven variants
  // (assets/heroes/Echo/gen), one per active mirror count, and the battle
  // swaps her sheet live as mirrors break and reform.
  echo: (() => {
    const A = 'assets/heroes/Echo';
    // Strip set for a given mirror count; 6 = the untouched originals.
    const strips = (k) => {
      const v = (gen, orig) => (k === 6 ? `${A}/${orig}` : `${A}/gen/${gen}_m${k}.png`);
      const s = {
        idle:   { src: v('echoidle', 'Echoidle.png'), frames: 9, fps: 5, loop: true },
        ready:  { src: v('echoready', 'Echoready.png'), frames: 9, fps: 6, loop: true },
        // Skills 1 & 2 share the strip: mirrors swirl forward and fire.
        attack: { src: v('echoskill12', 'Echoskill1and2.png'), frames: 9, fps: 10, loop: false,
                  hitFrame: 8 },
        // Skill 3: the mirrors converge and detonate in a resonant burst.
        skill3: { src: v('echoskill3', 'echoskill3.png'), frames: 9, fps: 10, loop: false,
                  hitFrame: 8 },
        death:  { src: v('echodeath', 'Echodeath.png'), frames: 24, fps: 8, loop: false,
                  freeze: true },
      };
      if (k === 6) {
        // Idle fidgets (crystal pulses) exist only as full-mirror art, so
        // only the six-mirror sheet plays them.
        s.idle2 = { src: `${A}/Echoidle2.png`, frames: 9, fps: 7, loop: false,
                    variantOf: 'idle', every: [8, 16] };
        s.idle3 = { src: `${A}/echoidle1.png`, frames: 9, fps: 7, loop: false,
                    variantOf: 'idle', every: [8, 16] };
      }
      return s;
    };
    return {
      id: 'echo',
      element: 'water',
      name: 'Aniani',
      title: 'Mirror Bulwark',
      rarity: 5,
      stats: { hp: 2400, atk: 110, def: 265, speed: 96 },
      tint: { body: '#9ab8c8', helm: '#d8e8f0', weapon: '#8ad8ff', shield: '#c8a83a' },
      mirrors: { max: 6, start: 6 },
      sprite: { displayH: 92, strips: strips(6) },
      mirrorSprites: [0, 1, 2, 3, 4, 5, 6].map((k) => ({ displayH: 92, strips: strips(k) })),
      abilities: [
        {
          id: 'mirror_lance', name: 'Mirror Lance',
          icon: 'assets/icons/fc305.png',
          description: 'Strike one enemy for 60% DEF, +30% DEF per active crystal mirror.',
          cooldown: 0, targeting: 'enemy', animation: 'attack',
          effects: [{ type: 'damageDef', mult: 0.6, perMirror: 0.3 }],
        },
        {
          id: 'prism_wave', name: 'Prism Wave',
          icon: 'assets/icons/fc306.png',
          description: 'Sweep an enemy row for 40% DEF, +20% DEF per active crystal mirror.',
          cooldown: 3, targeting: 'enemy-row', animation: 'attack',
          effects: [{ type: 'damageDef', mult: 0.4, perMirror: 0.2 }],
        },
        {
          id: 'resonant_shatter', name: 'Resonant Shatter',
          icon: 'assets/icons/fc307.png',
          description: 'Blast one enemy for 70% DEF, +40% DEF per active crystal mirror, then reform 2 mirrors.',
          cooldown: 5, targeting: 'enemy', animation: 'skill3',
          effects: [{ type: 'damageDef', mult: 0.7, perMirror: 0.4 }],
          selfEffects: [{ type: 'mirrors', count: 2 }],
        },
      ],
      passive: {
        name: 'Crystal Aegis',
        icon: 'assets/icons/fc308.png',
        description: 'Begins battle with 6 crystal mirrors. Every hit she takes is halved and shatters one mirror. While in a front hex, she reforms 1 mirror at the start of her turn.',
        hooks: {
          onTurnStart(unit) {
            // Position bonus: front-row Aniani reforms one mirror per turn.
            if (!unit.positionalActive || !unit.positionalActive()) return null;
            const gained = unit.addMirrors(1);
            if (gained <= 0) return null;
            return {
              label: 'Crystal Aegis',
              message: `${unit.name} reforms a crystal mirror.`,
              floats: [{ target: unit, text: '◆ +1', color: '#8ee8ff' }],
            };
          },
        },
      },
      positional: {
        position: POSITION.FRONT, stat: 'damage', mult: 1.0,
        description: 'Resonance: reforms 1 crystal mirror at the start of her turn while in a front hex.',
      },
    };
  })(),

  // ---- 1★ rat cohort ------------------------------------------------------
  // Idle-only art for now; attack/ready/death strips will be added later
  // (attacks gracefully hold idle until then).

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
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Skirmisher: +15% ATK while in a back hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Scrapper: +15% DEF while in a front hex.',
    },
  },

  rat_spearman: {
    id: 'rat_spearman',
    element: 'water',
    name: 'Rat Spearman',
    title: 'Tunnel Guard',
    rarity: 1,
    stats: { hp: 820, atk: 110, def: 70, speed: 95 },
    tint: { body: '#6a6a8a', helm: '#8a8aa8', weapon: '#c8c0b0', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_spearman/ratspearmanidle.png', frames: 14, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'poke', name: 'Poke',
        icon: 'assets/icons/fc1461.png',
        description: 'A spear thrust for 108% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.08 },
        ],
      },
      {
        id: 'lunge', name: 'Lunge',
        icon: 'assets/icons/fc1791.png',
        description: 'A deep lunge: 130% ATK and -10% SPD for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
          { type: 'debuff', stat: 'speed', mult: 0.9, turns: 1 },
        ],
      },
      {
        id: 'sweeping_thrust', name: 'Sweeping Thrust',
        icon: 'assets/icons/fc724.png',
        description: 'Rake a hex row for 80% ATK.',
        cooldown: 5, targeting: 'enemy-row', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.8 }],
      },
    ],
    passive: {
      name: 'Set Spear',
      icon: 'assets/icons/fc1801.png',
      description: 'Deals 15% extra damage while holding a front hex.',
      hooks: {
        damageDealtMult(unit) {
          return unit.slot && unit.slot.position === POSITION.FRONT ? 1.15 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Shield Wall: +15% DEF while in a front hex.',
    },
  },

  // ---- 2★ rat cohort ------------------------------------------------------

  rat_assassin: {
    id: 'rat_assassin',
    element: 'wind',
    name: 'Rat Assassin',
    title: 'Sewer Shadow',
    rarity: 2,
    stats: { hp: 800, atk: 135, def: 60, speed: 115, critChance: 0.25 },
    tint: { body: '#3a3a4a', helm: '#5a5a6a', weapon: '#b8b0c8', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_assassin/ratassassinidle.png', frames: 16, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'shiv', name: 'Shiv',
        icon: 'assets/icons/fc1444.png',
        description: 'A quick stab for 105% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.05 }],
      },
      {
        id: 'backstab', name: 'Backstab',
        icon: 'assets/icons/fc825.png',
        description: 'Slip behind for 145% ATK — 30% more against debuffed prey.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.45, bonusVs: { kind: 'debuff', mult: 1.3 } },
        ],
      },
      {
        id: 'throat_cut', name: 'Throat Cut',
        icon: 'assets/icons/fc734.png',
        description: 'Go for the kill: 200% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 2.0 }],
      },
    ],
    passive: {
      name: 'Opportunist',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 20% extra damage to enemies below half HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.5 ? 1.2 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.15,
      description: 'Lurker: +15% damage dealt from a back hex.',
    },
  },

  rat_berserker: {
    id: 'rat_berserker',
    element: 'fire',
    name: 'Rat Berserker',
    title: 'Plague Fury',
    rarity: 2,
    stats: { hp: 950, atk: 145, def: 55, speed: 100 },
    tint: { body: '#8a4a3a', helm: '#a86a4a', weapon: '#c8b0a0', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_berserker/ratberserkeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wild_swing', name: 'Wild Swing',
        icon: 'assets/icons/fc744.png',
        description: 'A reckless swing: 130% ATK, but drops his guard (-10% DEF for 1 turn).',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 0.9, turns: 1 },
        ],
      },
      {
        id: 'reckless_cleave', name: 'Reckless Cleave',
        icon: 'assets/icons/fc745.png',
        description: 'An all-out cleave for 155% ATK.',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [{ type: 'damage', mult: 1.55 }],
      },
      {
        id: 'blood_frenzy', name: 'Blood Frenzy',
        icon: 'assets/icons/fc743.png',
        description: 'Work into a frenzy: +40% ATK for 3 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [{ type: 'buff', stat: 'atk', mult: 1.4, turns: 3 }],
      },
    ],
    passive: {
      name: 'Pain Fueled',
      icon: 'assets/icons/fc1093.png',
      description: 'Deals 25% extra damage while below half HP.',
      hooks: {
        damageDealtMult(unit) {
          return unit.hp / unit.maxHp < 0.5 ? 1.25 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'damage', mult: 1.15,
      description: 'Bloodlust: +15% damage dealt from a front hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'hp', mult: 1.2,
      description: 'Bulwark: +20% max HP while in the center hex.',
    },
  },

  rat_duelist: {
    id: 'rat_duelist',
    element: 'wind',
    name: 'Rat Duelist',
    title: 'Gutter Gentry',
    rarity: 2,
    stats: { hp: 850, atk: 140, def: 65, speed: 110 },
    tint: { body: '#7a3a5a', helm: '#9a5a7a', weapon: '#d8d0e0', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_duelist/ratduelistidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'riposte', name: 'Riposte',
        icon: 'assets/icons/fc1454.png',
        description: 'A measured riposte: 95% ATK, then +25% crit damage for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critDamage', add: 0.25, turns: 1 },
        ],
      },
      {
        id: 'flourish', name: 'Flourish',
        icon: 'assets/icons/fc729.png',
        description: 'A dazzling feint: 135% ATK and +15% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.35 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.15, turns: 1 },
        ],
      },
      {
        id: 'coup_de_grace', name: 'Coup de Grâce',
        icon: 'assets/icons/fc728.png',
        description: 'The decisive strike: 190% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.9 }],
      },
    ],
    passive: {
      name: 'Duelist\'s Eye',
      icon: 'assets/icons/fc719.png',
      description: 'Gains +10% crit chance for 1 turn at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.1, turns: 1 });
          return null; // silent — fires every turn
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.15,
      description: 'Point of Honor: +15% ATK while in a front hex.',
    },
  },

  // ---- 3★ rat cohort ------------------------------------------------------

  rat_samurai: {
    id: 'rat_samurai',
    element: 'fire',
    name: 'Rat Samurai',
    title: 'Ronin of the Drain',
    rarity: 3,
    stats: { hp: 1150, atk: 175, def: 90, speed: 105 },
    tint: { body: '#8a2a2a', helm: '#3a3a3a', weapon: '#d8d8e0', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_samurai/ratsamuraiidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'iai_cut', name: 'Iai Cut',
        icon: 'assets/icons/fc1587.png',
        description: 'A single flawless draw-cut for 125% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.25 },
        ],
      },
      {
        id: 'cross_slash', name: 'Cross Slash',
        icon: 'assets/icons/fc1030.png',
        description: 'Two crossing cuts for 80% ATK each.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'damage', mult: 0.8 },
        ],
      },
      {
        id: 'crescent_moon', name: 'Crescent Moon',
        icon: 'assets/icons/fc1003.png',
        description: 'One sweeping cut along a hex row for 120% ATK.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack', impact: 'slash',
        effects: [{ type: 'damage', mult: 1.2 }],
      },
    ],
    passive: {
      name: 'Iaijutsu',
      icon: 'assets/icons/fc1038.png',
      description: 'Deals 25% extra damage to enemies at full HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp >= target.maxHp ? 1.25 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.2,
      description: 'Standard Bearer: +20% ATK while in the center hex.',
    },
  },



  // ---- Placeholder rat cohort (filling the roster to 25) -----------------
  // Procedural placeholder art renders until real idle sheets land at the
  // conventional paths (assets/heroes/<id>/<id-no-underscore>idle.png).

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
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.1,
      description: 'Vanguard: +10% ATK while in a front hex.',
    },
  },

  rat_slinger: {
    id: 'rat_slinger',
    element: 'water',
    name: 'Rat Slinger',
    title: 'Gutter Stonecast',
    rarity: 1,
    stats: { hp: 720, atk: 114, def: 58, speed: 98 },
    tint: { body: '#4a6a7a', helm: '#6a8a9a', weapon: '#a8a098', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_slinger/ratslingeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'pebble_toss', name: 'Pebble Toss',
        icon: 'assets/icons/fc1515.png',
        description: 'A stinging stone: 90% ATK and -8% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'debuff', stat: 'atk', mult: 0.92, turns: 1 },
        ],
      },
      {
        id: 'skull_crack', name: 'Skull Crack',
        icon: 'assets/icons/fc1516.png',
        description: 'A dazing shot: 120% ATK and drains 15% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'turnMeter', amount: -0.15 },
        ],
      },
      {
        id: 'rock_volley', name: 'Rock Volley',
        icon: 'assets/icons/fc807.png',
        description: 'Rain stones on ALL enemies for 65% ATK.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.65 }],
      },
    ],
    passive: {
      name: 'Rear Sniper',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 12% extra damage to back-row enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.slot && target.slot.position === POSITION.BACK ? 1.12 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Long Toss: +15% ATK while in a back hex.',
    },
  },

  rat_scout: {
    id: 'rat_scout',
    element: 'wind',
    name: 'Rat Scout',
    title: 'Whisker in the Weeds',
    rarity: 1,
    stats: { hp: 750, atk: 108, def: 62, speed: 102 },
    tint: { body: '#5a7a5a', helm: '#7a9a7a', weapon: '#b8a878', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_scout/ratscoutidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'quick_nick', name: 'Quick Nick',
        icon: 'assets/icons/fc1444.png',
        description: 'A darting cut for 92% ATK; footwork grants +8% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.92 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.08, turns: 1 },
        ],
      },
      {
        id: 'mark_target', name: 'Mark Target',
        icon: 'assets/icons/fc862.png',
        description: 'Expose a weakness: the target takes +25% damage for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'debuff', stat: 'damageTaken', mult: 1.25, turns: 2 }],
      },
      {
        id: 'hit_and_run', name: 'Hit and Run',
        icon: 'assets/icons/fc882.png',
        description: 'Strike for 130% ATK, then gain +30% SPD for 2 turns.',
        cooldown: 5, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.3 }],
        selfEffects: [{ type: 'buff', stat: 'speed', mult: 1.3, turns: 2 }],
      },
    ],
    passive: {
      name: 'Pathfinder',
      icon: 'assets/icons/fc868.png',
      description: '+10% chance to dodge attacks.',
      hooks: { dodgeAdd: 0.10 },
    },
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.1,
      description: 'Outrider: +10% SPD while in a back hex.',
    },
  },

  rat_miner: {
    id: 'rat_miner',
    element: 'fire',
    name: 'Rat Miner',
    title: 'Deep Warren Digger',
    rarity: 1,
    stats: { hp: 880, atk: 110, def: 78, speed: 88 },
    tint: { body: '#6a5a3a', helm: '#c8a83a', weapon: '#a8a0a8', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_miner/ratmineridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'pick_swing', name: 'Pick Swing',
        icon: 'assets/icons/fc1472.png',
        description: 'An over-heavy swing: 120% ATK, but costs 10% of his own turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: -0.10 },
        ],
      },
      {
        id: 'lantern_flash', name: 'Lantern Flash',
        icon: 'assets/icons/fc1084.png',
        description: 'Blind with lamplight: the target loses 15% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'debuff', stat: 'atk', mult: 0.85, turns: 2 }],
      },
      {
        id: 'cave_in', name: 'Cave-In',
        icon: 'assets/icons/fc767.png',
        description: 'Bring the roof down on a hex row for 85% ATK.',
        cooldown: 5, targeting: 'enemy-row', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.85 }],
      },
    ],
    passive: {
      name: 'Ore Sense',
      icon: 'assets/icons/fc867.png',
      description: 'Deals 18% extra damage to enemies with weakened DEF.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some(
            (fx) => fx.kind === 'debuff' && fx.stat === 'def') ? 1.18 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.12,
      description: 'Pit Prop: +12% DEF while in a front hex.',
    },
  },

  rat_cook: {
    id: 'rat_cook',
    element: 'water',
    name: 'Rat Cook',
    title: 'Stewmaster of the Sump',
    rarity: 1,
    stats: { hp: 800, atk: 104, def: 70, speed: 94 },
    tint: { body: '#e8e0d8', helm: '#f8f0e8', weapon: '#a8a0a8', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_cook/ratcookidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'ladle_whack', name: 'Ladle Whack',
        icon: 'assets/icons/fc663.png',
        description: 'Bonk with the big spoon for 90% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [{ type: 'damage', mult: 0.9 }],
      },
      {
        id: 'hot_soup', name: 'Hot Soup',
        icon: 'assets/icons/fc1112.png',
        description: 'Serve an ally soup: heals 150% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [{ type: 'heal', mult: 1.5 }],
      },
      {
        id: 'grand_feast', name: 'Grand Feast',
        icon: 'assets/icons/fc800.png',
        description: 'Lay a feast: heals ALL allies for 80% of ATK plus 2% of the Cook\'s max HP for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.8 },
          { type: 'hot', pct: 0.02, turns: 2 },
        ],
      },
    ],
    passive: {
      name: "Soup's On",
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, feeds the most wounded ally 3% of the Cook\'s max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team)
            .filter((u) => u.hp < u.maxHp);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          const target = allies[0];
          const healed = target.heal(Math.round(unit.maxHp * 0.03));
          if (healed <= 0) return null;
          return {
            label: "Soup's On",
            message: `${unit.name} slips ${target.name} a snack for ${healed} HP.`,
            floats: [{ target, text: `+${healed}`, color: '#7ae87a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Kitchen Post: +15% DEF while in the center hex.',
    },
  },

  rat_torchbearer: {
    id: 'rat_torchbearer',
    element: 'fire',
    name: 'Rat Torchbearer',
    title: 'Lightbringer Below',
    rarity: 1,
    stats: { hp: 780, atk: 112, def: 64, speed: 96 },
    tint: { body: '#8a5a2a', helm: '#e8a83a', weapon: '#f8c84a', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_torchbearer/rattorchbeareridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'torch_jab', name: 'Torch Jab',
        icon: 'assets/icons/fc981.png',
        description: 'Thrust the brand: 90% ATK and a singe of 8% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'dot', pct: 0.08, turns: 1 },
        ],
      },
      {
        id: 'set_alight', name: 'Set Alight',
        icon: 'assets/icons/fc1050.png',
        description: 'Hit for 80% ATK and burn for 25% ATK per turn for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'dot', pct: 0.25, turns: 2 },
        ],
      },
      {
        id: 'wall_of_flame', name: 'Wall of Flame',
        icon: 'assets/icons/fc1044.png',
        description: 'Ignite ALL enemies: 20% ATK burn per turn for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'dot', pct: 0.20, turns: 2 }],
      },
    ],
    passive: {
      name: 'Kindling',
      icon: 'assets/icons/fc1003.png',
      description: 'His burns cling: damage-over-time he inflicts lasts 1 extra turn.',
      hooks: { dotExtraTurns: 1 },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Beacon: +12% ATK while in the center hex.',
    },
  },

  // ---- 2★ placeholder rats ------------------------------------------------

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
      description: 'Takes 12% less damage while holding a front hex.',
      hooks: {
        damageTakenMult(unit) {
          return unit.slot && unit.slot.position === POSITION.FRONT ? 0.88 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.2,
      description: 'Oathkeeper: +20% DEF while in a front hex.',
    },
  },

  rat_shaman: {
    id: 'rat_shaman',
    element: 'water',
    name: 'Rat Shaman',
    title: 'Voice of Old Whiskers',
    rarity: 2,
    stats: { hp: 860, atk: 126, def: 72, speed: 100 },
    tint: { body: '#4a5a8a', helm: '#8a6ab8', weapon: '#b8a878', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_shaman/ratshamanidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'whisker_hex', name: 'Whisker Hex',
        icon: 'assets/icons/fc1052.png',
        description: 'A jinx for 90% ATK that softens armor: -7% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'debuff', stat: 'def', mult: 0.93, turns: 1 },
        ],
      },
      {
        id: 'spirit_mend', name: 'Spirit Mend',
        icon: 'assets/icons/fc1112.png',
        description: 'Heal an ally for 130% of ATK and cleanse their debuffs.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.3 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'ancestors_wrath', name: "Ancestor's Wrath",
        icon: 'assets/icons/fc1084.png',
        description: 'The old spirits rend ALL enemies: 70% ATK and -5% DEF for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.7 },
          { type: 'debuff', stat: 'def', mult: 0.95, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Spirit Ward',
      icon: 'assets/icons/fc854.png',
      description: '+35% debuff resistance.',
      hooks: { resistanceAdd: 0.35 },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.15,
      description: 'Warded Circle: +15% DEF while in a back hex.',
    },
  },

  rat_monk: {
    id: 'rat_monk',
    element: 'wind',
    name: 'Rat Monk',
    title: 'Fist of the Still Water',
    rarity: 2,
    stats: { hp: 900, atk: 130, def: 76, speed: 108 },
    tint: { body: '#c88a3a', helm: '#b8b0a8', weapon: '#b8b0a8', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_monk/ratmonkidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'palm_strike', name: 'Palm Strike',
        icon: 'assets/icons/fc663.png',
        description: 'A flowing palm blow: 105% ATK and 8% turn meter back.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.05 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.08 },
        ],
      },
      {
        id: 'chi_burst', name: 'Chi Burst',
        icon: 'assets/icons/fc1030.png',
        description: 'Channel chi into a strike for 150% ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [{ type: 'damage', mult: 1.5 }],
      },
      {
        id: 'meditate', name: 'Meditate',
        icon: 'assets/icons/fc1112.png',
        description: 'Center the self: cleanse own debuffs and recover 25% max HP.',
        cooldown: 5, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'cleanse' },
          { type: 'healHpPct', pct: 0.25 },
        ],
      },
    ],
    passive: {
      name: 'Flow State',
      icon: 'assets/icons/fc882.png',
      description: '+8% chance to take an extra turn after acting.',
      hooks: { extraTurnAdd: 0.08 },
    },
    positional: {
      position: POSITION.CENTER, stat: 'speed', mult: 1.1,
      description: 'Perfect Balance: +10% SPD while in the center hex.',
    },
  },

  rat_gunner: {
    id: 'rat_gunner',
    element: 'fire',
    name: 'Rat Gunner',
    title: 'Powderwhisker',
    rarity: 2,
    stats: { hp: 820, atk: 138, def: 60, speed: 97 },
    tint: { body: '#3a3a3a', helm: '#8a2a2a', weapon: '#6a6a7a', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_gunner/ratgunneridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'musket_shot', name: 'Musket Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'A crack of powder: 125% ATK, then reloads (-8% of his own turn meter).',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.25 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: -0.08 },
        ],
      },
      {
        id: 'piercing_round', name: 'Piercing Round',
        icon: 'assets/icons/fc1621.png',
        description: 'A punched slug for 145% ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.45 }],
      },
      {
        id: 'grapeshot', name: 'Grapeshot',
        icon: 'assets/icons/fc807.png',
        description: 'Spray the front line for 90% ATK.',
        cooldown: 6, targeting: 'front-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.9 }],
      },
    ],
    passive: {
      name: 'Steady Aim',
      icon: 'assets/icons/fc1516.png',
      description: 'Gains +5% crit chance for 2 turns at each turn start (briefly stacks).',
      hooks: {
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.05, turns: 2 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.18,
      description: 'Firing Line: +18% ATK while in a back hex.',
    },
  },

  rat_thief: {
    id: 'rat_thief',
    element: 'wind',
    name: 'Rat Thief',
    title: 'Fingers of the Fog',
    rarity: 2,
    stats: { hp: 810, atk: 132, def: 62, speed: 112 },
    tint: { body: '#4a4a5a', helm: '#2a2a3a', weapon: '#b8b0c8', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_thief/ratthiefidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snatch_strike', name: 'Snatch Strike',
        icon: 'assets/icons/fc1444.png',
        description: 'Strike for 100% ATK and gain 10% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.0 }],
        selfEffects: [{ type: 'turnMeter', amount: 0.10 }],
      },
      {
        id: 'hamstring', name: 'Hamstring',
        icon: 'assets/icons/fc825.png',
        description: 'Cut low: 110% ATK and -15% SPD for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.1 },
          { type: 'debuff', stat: 'speed', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'smoke_bomb', name: 'Smoke Bomb',
        icon: 'assets/icons/fc1084.png',
        description: 'Choking smoke: ALL enemies lose 10% ATK for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'debuff', stat: 'atk', mult: 0.9, turns: 1 }],
      },
    ],
    passive: {
      name: 'Cutpurse',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 15% extra damage to enemies above half turn meter.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.turnMeter > CONFIG.TURN_METER_MAX * 0.5 ? 1.15 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.12,
      description: 'Ambusher: +12% damage dealt from a back hex.',
    },
  },

  rat_herbalist: {
    id: 'rat_herbalist',
    element: 'water',
    name: 'Rat Herbalist',
    title: 'Rootpicker',
    rarity: 2,
    stats: { hp: 840, atk: 122, def: 68, speed: 99 },
    tint: { body: '#4a7a4a', helm: '#6a9a5a', weapon: '#8ab86a', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_herbalist/ratherbalistidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'thorn_flick', name: 'Thorn Flick',
        icon: 'assets/icons/fc981.png',
        description: 'Flick a barbed seed for 95% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.95 }],
      },
      {
        id: 'healing_herbs', name: 'Healing Herbs',
        icon: 'assets/icons/fc1112.png',
        description: 'Dress wounds: heals 120% of ATK, then 3% of the Herbalist\'s max HP for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.2 },
          { type: 'hot', pct: 0.03, turns: 2 },
        ],
      },
      {
        id: 'bitter_remedy', name: 'Bitter Remedy',
        icon: 'assets/icons/fc855.png',
        description: 'A foul tonic that cleanses ALL allies\' debuffs.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [{ type: 'cleanse' }],
      },
    ],
    passive: {
      name: 'Poultice',
      icon: 'assets/icons/fc1093.png',
      description: 'Sheds one debuff from herself at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          const idx = unit.statusEffects.findIndex(
            (fx) => fx.kind === 'debuff' || fx.kind === 'dot');
          if (idx === -1) return null;
          unit.statusEffects.splice(idx, 1);
          return {
            label: 'Poultice',
            message: `${unit.name}'s poultice draws out an affliction.`,
            floats: [{ target: unit, text: 'CLEANSE', color: '#7ae8e8' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Herb Cart: +12% DEF while in the center hex.',
    },
  },

  // ---- 3★ placeholder rats ------------------------------------------------

  rat_captain: {
    id: 'rat_captain',
    element: 'water',
    name: 'Rat Captain',
    title: 'Commodore of the Culvert',
    rarity: 3,
    stats: { hp: 1180, atk: 165, def: 92, speed: 102 },
    tint: { body: '#2a4a8a', helm: '#e8c83a', weapon: '#d8d8e0', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_captain/ratcaptainidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'sabre_cut', name: 'Sabre Cut',
        icon: 'assets/icons/fc1587.png',
        description: 'An officer\'s stroke: 110% ATK that drains 5% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.1 },
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
      {
        id: 'hold_the_line', name: 'Hold the Line',
        icon: 'assets/icons/fc855.png',
        description: 'Steel the ranks: ALL allies gain +25% DEF for 2 turns.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [{ type: 'buff', stat: 'def', mult: 1.25, turns: 2 }],
      },
      {
        id: 'charge_order', name: 'Charge Order',
        icon: 'assets/icons/fc869.png',
        description: 'Sound the charge: ALL allies gain 20% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [{ type: 'turnMeter', amount: 0.20 }],
      },
    ],
    passive: {
      name: 'Rally Cry',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, ALL allies gain +5% ATK for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const ally of battle.livingUnits(unit.team)) {
            ally.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.05, turns: 1 });
          }
          return {
            label: 'Rally Cry',
            message: `${unit.name} rallies the warren: +5% ATK.`,
            floats: [],
          };
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.15,
      description: 'Flagship Post: +15% ATK while in the center hex.',
    },
  },

  rat_ninja: {
    id: 'rat_ninja',
    element: 'wind',
    name: 'Rat Ninja',
    title: 'Silent Whisker',
    rarity: 3,
    stats: { hp: 1080, atk: 180, def: 82, speed: 110 },
    tint: { body: '#2a2a3a', helm: '#3a3a4a', weapon: '#d8d8e0', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_ninja/ratninjaidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'shuriken_toss', name: 'Shuriken Toss',
        icon: 'assets/icons/fc728.png',
        description: 'Two spinning stars for 60% ATK each.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.6 },
          { type: 'damage', mult: 0.6 },
        ],
      },
      {
        id: 'shadow_strike', name: 'Shadow Strike',
        icon: 'assets/icons/fc825.png',
        description: 'Blink through shadow for 170% ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.7 }],
      },
      {
        id: 'silent_end', name: 'Silent End',
        icon: 'assets/icons/fc734.png',
        description: 'One perfect cut: 230% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 2.3 }],
      },
    ],
    passive: {
      name: 'Smoke Veil',
      icon: 'assets/icons/fc862.png',
      description: 'Takes 15% less damage while in a back hex.',
      hooks: {
        damageTakenMult(unit) {
          return unit.slot && unit.slot.position === POSITION.BACK ? 0.85 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.15,
      description: 'Night Blade: +15% damage dealt from a back hex.',
    },
  },

  rat_pyromancer: {
    id: 'rat_pyromancer',
    element: 'fire',
    name: 'Rat Pyromancer',
    title: 'Ember Sage',
    rarity: 3,
    stats: { hp: 1060, atk: 182, def: 80, speed: 101 },
    tint: { body: '#8a2a1a', helm: '#e86a2a', weapon: '#f8a83a', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_pyromancer/ratpyromanceridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cinder_bolt', name: 'Cinder Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'A searing bolt: 80% ATK plus a 10% ATK burn for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'dot', pct: 0.10, turns: 2 },
        ],
      },
      {
        id: 'immolate', name: 'Immolate',
        icon: 'assets/icons/fc1052.png',
        description: 'Hit for 60% ATK and burn for 40% ATK per turn for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.6 },
          { type: 'dot', pct: 0.40, turns: 2 },
        ],
      },
      {
        id: 'firestorm', name: 'Firestorm',
        icon: 'assets/icons/fc1044.png',
        description: '85% ATK to ALL enemies — burning targets take 50% more.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.85, bonusVs: { kind: 'dot', mult: 1.5 } }],
      },
    ],
    passive: {
      name: 'Accelerant',
      icon: 'assets/icons/fc1093.png',
      description: 'Deals 25% extra damage to enemies suffering damage over time.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'dot') ? 1.25 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Cinder Perch: +15% ATK while in a back hex.',
    },
  },

  rat_tidecaller: {
    id: 'rat_tidecaller',
    element: 'water',
    name: 'Rat Tidecaller',
    title: 'Drainsinger',
    rarity: 3,
    stats: { hp: 1100, atk: 172, def: 86, speed: 104 },
    tint: { body: '#2a5a8a', helm: '#4a8ab8', weapon: '#7ac8e8', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_tidecaller/rattidecalleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'water_whip', name: 'Water Whip',
        icon: 'assets/icons/fc819.png',
        description: 'A dragging lash: 90% ATK that drains 8% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'turnMeter', amount: -0.08 },
        ],
      },
      {
        id: 'tidal_slam', name: 'Tidal Slam',
        icon: 'assets/icons/fc1622.png',
        description: 'A crushing wave: 150% ATK and drains 20% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.5 },
          { type: 'turnMeter', amount: -0.20 },
        ],
      },
      {
        id: 'great_wave', name: 'Great Wave',
        icon: 'assets/icons/fc800.png',
        description: 'Sweep ALL enemies for 80% ATK and drain 10% turn meter.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'turnMeter', amount: -0.10 },
        ],
      },
    ],
    passive: {
      name: 'Undertow',
      icon: 'assets/icons/fc882.png',
      description: 'At turn start, 25% chance to drain 10% turn meter from a random enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          if (Math.random() >= 0.25) return null;
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          target.turnMeter = Math.max(0, target.turnMeter - CONFIG.TURN_METER_MAX * 0.10);
          return {
            label: 'Undertow',
            message: `${unit.name}'s undertow drags at ${target.name}.`,
            floats: [{ target, text: '-10% METER', color: '#7ac8e8' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Tidepool: +12% ATK while in the center hex.',
    },
  },

  rat_stormcaller: {
    id: 'rat_stormcaller',
    element: 'wind',
    name: 'Rat Stormcaller',
    title: 'Gale of the Gutters',
    rarity: 3,
    stats: { hp: 1070, atk: 178, def: 81, speed: 106 },
    tint: { body: '#5a5a8a', helm: '#8a8ac8', weapon: '#e8e84a', skin: '#b8b0a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_stormcaller/ratstormcalleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'spark_lash', name: 'Spark Lash',
        icon: 'assets/icons/fc1050.png',
        description: 'A forking arc that hits for 70% then 40% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.7 },
          { type: 'damage', mult: 0.4 },
        ],
      },
      {
        id: 'chain_lightning', name: 'Chain Lightning',
        icon: 'assets/icons/fc1030.png',
        description: 'Arc through a hex row for 95% ATK.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.95 }],
      },
      {
        id: 'thunderhead', name: 'Thunderhead',
        icon: 'assets/icons/fc807.png',
        description: 'A rolling storm: 70% ATK to ALL enemies and -10% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.7 },
          { type: 'debuff', stat: 'speed', mult: 0.9, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Static Charge',
      icon: 'assets/icons/fc867.png',
      description: 'Gains +8% ATK for 2 turns at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.08, turns: 2 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Storm Perch: +15% ATK while in a back hex.',
    },
  },

  // ---- Bird cohort --------------------------------------------------------
  // Idle-only art for now, like the rats; attack/death strips can land
  // later without kit changes.

  vulture_reaver: {
    id: 'vulture_reaver',
    element: 'wind',
    name: 'Vulture Reaver',
    title: 'Carrion Prince',
    rarity: 1,
    stats: { hp: 850, atk: 112, def: 60, speed: 98 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Vulturereaveridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'peck_and_tear', name: 'Peck & Tear',
        icon: 'assets/icons/fc746.png',
        description: 'Rip for 90% ATK and open a bleed: 12% ATK per turn for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'dot', pct: 0.12, turns: 2 },
        ],
      },
      {
        id: 'carrion_swoop', name: 'Carrion Swoop',
        icon: 'assets/icons/fc763.png',
        description: 'Dive on a foe for 145% ATK.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.45 }],
      },
      {
        id: 'feeding_frenzy', name: 'Feeding Frenzy',
        icon: 'assets/icons/fc800.png',
        description: 'Savage ALL enemies for 75% ATK.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.75 }],
      },
    ],
    passive: {
      name: 'Scavenger',
      icon: 'assets/icons/fc863.png',
      description: 'Smells death: deals 35% extra damage to enemies below 30% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.3 ? 1.35 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Circling: +15% ATK while in a back hex.',
    },
  },

  kingfisher: {
    id: 'kingfisher',
    element: 'water',
    name: 'Kingfisher',
    title: 'River Lancer',
    rarity: 2,
    stats: { hp: 900, atk: 130, def: 70, speed: 105 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Kingfisheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'dive_stab', name: 'Dive Stab',
        icon: 'assets/icons/fc1621.png',
        description: 'A darting thrust for 110% ATK — 25% more against bleeding or poisoned prey.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.1, bonusVs: { kind: 'dot', mult: 1.25 } },
        ],
      },
      {
        id: 'skewer', name: 'Skewer',
        icon: 'assets/icons/fc1622.png',
        description: 'Spear a foe clean through for 160% ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.6 },
        ],
      },
      {
        id: 'riptide_lance', name: 'Riptide Lance',
        icon: 'assets/icons/fc819.png',
        description: 'Sweep a hex row for 110% ATK.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.1 }],
      },
    ],
    passive: {
      name: "Fisher's Patience",
      icon: 'assets/icons/fc719.png',
      description: 'While at full HP, gains +20% crit chance for 1 turn at turn start.',
      hooks: {
        onTurnStart(unit) {
          if (unit.hp < unit.maxHp) return null;
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.20, turns: 1 });
          return null; // silent — patient hunter
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.15,
      description: 'Shallows Hunter: +15% ATK while in a front hex.',
    },
  },

  rook_swordsman: {
    id: 'rook_swordsman',
    element: 'wind',
    name: 'Rook Swordsman',
    title: 'Gallows Blade',
    rarity: 2,
    stats: { hp: 950, atk: 135, def: 75, speed: 100 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Rookswordsmanidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cleave', name: 'Cleave',
        icon: 'assets/icons/fc1447.png',
        description: 'A heavy cleave for 118% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.18 },
        ],
      },
      {
        id: 'cross_cut', name: 'Cross Cut',
        icon: 'assets/icons/fc723.png',
        description: 'A guarded cut: 145% ATK that dulls the foe\'s edge (-10% crit chance for 2 turns).',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.45 },
          { type: 'debuff', stat: 'critChance', add: -0.10, turns: 2 },
        ],
      },
      {
        id: 'murder_stroke', name: 'Murder Stroke',
        icon: 'assets/icons/fc734.png',
        description: 'The mordhau: two strikes of 105% ATK each.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.05 },
          { type: 'damage', mult: 1.05 },
        ],
      },
    ],
    passive: {
      name: 'Corvid Cunning',
      icon: 'assets/icons/fc862.png',
      description: 'Strikes the unready: deals 15% extra damage to enemies below half turn meter.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.turnMeter < CONFIG.TURN_METER_MAX * 0.5 ? 1.15 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'damage', mult: 1.15,
      description: 'Murder\'s Eye: +15% damage dealt from the center hex.',
    },
  },

  rooster_duelist: {
    id: 'rooster_duelist',
    element: 'fire',
    name: 'Rooster Duelist',
    title: 'Dawn Blade',
    rarity: 2,
    stats: { hp: 820, atk: 140, def: 60, speed: 115, critChance: 0.2 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Roosterduelistidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'flurry_peck', name: 'Flurry Peck',
        icon: 'assets/icons/fc1454.png',
        description: 'Four rapid pecks for 28% ATK each.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.28 },
          { type: 'damage', mult: 0.28 },
          { type: 'damage', mult: 0.28 },
          { type: 'damage', mult: 0.28 },
        ],
      },
      {
        id: 'gallant_lunge', name: 'Gallant Lunge',
        icon: 'assets/icons/fc736.png',
        description: 'A gallant advance: 145% ATK and +10% SPD for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.45 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.1, turns: 1 },
        ],
      },
      {
        id: 'crowing_coup', name: 'Crowing Coup',
        icon: 'assets/icons/fc728.png',
        description: 'A finishing flurry: 175% ATK, then crows in triumph: +15% SPD for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.75 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.15, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Strut',
      icon: 'assets/icons/fc868.png',
      description: 'Gains +10% ATK for 1 turn at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.1, turns: 1 });
          return null; // silent - fires every turn
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'damage', mult: 1.15,
      description: 'Center Stage: +15% damage dealt from a front hex.',
    },
  },

  owl_sentinel: {
    id: 'owl_sentinel',
    element: 'light',
    name: 'Owl Sentinel',
    title: 'Watcher of Dawn',
    rarity: 2,
    stats: { hp: 1050, atk: 115, def: 90, speed: 90 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Owlsentinelidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'talon_jab', name: 'Talon Jab',
        icon: 'assets/icons/fc981.png',
        description: 'A talon jab for 102% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.02 },
        ],
      },
      {
        id: 'shield_bash', name: 'Shield Bash',
        icon: 'assets/icons/fc854.png',
        description: 'Slam a foe for 135% ATK and crack armor: -15% DEF for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.35 },
          { type: 'debuff', stat: 'def', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'aegis_of_dawn', name: 'Aegis of Dawn',
        icon: 'assets/icons/fc855.png',
        description: 'Shield the front row: +30% DEF for 2 turns.',
        cooldown: 6, targeting: 'front-allies', animation: 'attack',
        effects: [{ type: 'buff', stat: 'def', mult: 1.3, turns: 2 }],
      },
    ],
    passive: {
      name: 'Vigilant',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 10% less damage from all attacks.',
      hooks: {
        damageTakenMult() {
          return 0.9;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.2,
      description: 'Bulwark of Dawn: +20% DEF while in a front hex.',
    },
  },

  eagle_champion: {
    id: 'eagle_champion',
    element: 'wind',
    name: 'Eagle Champion',
    title: 'Skycrown Marshal',
    rarity: 3,
    stats: { hp: 1250, atk: 170, def: 95, speed: 100 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Eaglechampionidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'hammer_blow', name: 'Hammer Blow',
        icon: 'assets/icons/fc1472.png',
        description: 'A crushing blow: 135% ATK, but the windup costs 12% of his own turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.35 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: -0.12 },
        ],
      },
      {
        id: 'skyfall_smash', name: 'Skyfall Smash',
        icon: 'assets/icons/fc1044.png',
        description: 'Bring the hammer down for 160% ATK.',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'slam',
        effects: [{ type: 'damage', mult: 1.6 }],
      },
      {
        id: 'judgment_peak', name: 'Judgment Peak',
        icon: 'assets/icons/fc767.png',
        description: 'The marshal\'s verdict: 210% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack', impact: 'slam',
        effects: [{ type: 'damage', mult: 2.1 }],
      },
    ],
    passive: {
      name: "Champion's Might",
      icon: 'assets/icons/fc869.png',
      description: 'Deals 25% extra damage while himself at full HP.',
      hooks: {
        damageDealtMult(unit) {
          return unit.hp >= unit.maxHp ? 1.25 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.2,
      description: 'Skycrown Banner: +20% ATK while in the center hex.',
    },
  },

  raven_hexer: {
    id: 'raven_hexer',
    element: 'dark',
    name: 'Raven Hexer',
    title: 'Nightfeather Warlock',
    rarity: 3,
    stats: { hp: 1100, atk: 165, def: 80, speed: 108 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Ravenhexeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'hex_bolt', name: 'Hex Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'A croaking bolt: 85% ATK and -8% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
          { type: 'debuff', stat: 'speed', mult: 0.92, turns: 1 },
        ],
      },
      {
        id: 'withering_curse', name: 'Withering Curse',
        icon: 'assets/icons/fc1052.png',
        description: 'Deals 120% ATK and saps strength: -20% ATK for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'debuff', stat: 'atk', mult: 0.8, turns: 2 },
        ],
      },
      {
        id: 'nights_descent', name: "Night's Descent",
        icon: 'assets/icons/fc1053.png',
        description: 'Deals 150% ATK and marks the target: +25% damage taken for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.5 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.25, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Dark Omen',
      icon: 'assets/icons/fc1084.png',
      description: '+25% debuff accuracy.',
      hooks: { accuracyAdd: 0.25 },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.15,
      description: 'Night Roost: +15% damage dealt from a back hex.',
    },
  },


  // ---- Placeholder avian cohort (filling the roster to 25) ---------------
  // Procedural placeholder art renders until real idle sheets land at the
  // conventional flat paths (assets/heroes/<Name>idle.png).

  sparrow_scrapper: {
    id: 'sparrow_scrapper',
    element: 'wind',
    name: 'Sparrow Scrapper',
    title: 'Small but Furious',
    rarity: 1,
    stats: { hp: 730, atk: 111, def: 57, speed: 103 },
    tint: { body: '#8a6a4a', helm: '#a8845a', weapon: '#c8c0b0', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Sparrowscrapperidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'peck_flurry', name: 'Peck Flurry',
        icon: 'assets/icons/fc746.png',
        description: 'Three furious pecks for 32% ATK each.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.32 },
          { type: 'damage', mult: 0.32 },
          { type: 'damage', mult: 0.32 },
        ],
      },
      {
        id: 'dust_up', name: 'Dust-Up',
        icon: 'assets/icons/fc744.png',
        description: 'A whirl of feathers: 132% ATK, then darts clear: +8% SPD for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.32 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.08, turns: 1 },
        ],
      },
      {
        id: 'defiant_chirp', name: 'Defiant Chirp',
        icon: 'assets/icons/fc869.png',
        description: 'Refuses to be small: +25% ATK and +5% crit chance for 2 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.25, turns: 2 },
          { type: 'buff', stat: 'critChance', add: 0.05, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Underdog',
      icon: 'assets/icons/fc863.png',
      description: 'Punches up: deals 20% extra damage to enemies with more current HP than him.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.hp > unit.hp ? 1.2 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Hedge Cover: +12% ATK while in a back hex.',
    },
  },

  pelican_porter: {
    id: 'pelican_porter',
    element: 'water',
    name: 'Pelican Porter',
    title: 'The Pouch Provides',
    rarity: 1,
    stats: { hp: 870, atk: 102, def: 71, speed: 92 },
    tint: { body: '#e8e0d8', helm: '#e8a83a', weapon: '#c8b898', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Pelicanporteridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'beak_scoop', name: 'Beak Scoop',
        icon: 'assets/icons/fc1471.png',
        description: 'A scooping blow for 93% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.93 },
        ],
      },
      {
        id: 'fish_delivery', name: 'Fish Delivery',
        icon: 'assets/icons/fc1112.png',
        description: 'Fresh from the pouch: heals an ally for 135% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.35 },
        ],
      },
      {
        id: 'pouch_toss', name: 'Pouch Toss',
        icon: 'assets/icons/fc800.png',
        description: 'Hurl an ally onward: heals 90% of ATK and grants 15% turn meter.',
        cooldown: 6, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.9 },
          { type: 'turnMeter', amount: 0.15 },
        ],
      },
    ],
    passive: {
      name: 'Deep Pouch',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, slips the most wounded ally a fish: 2% of his max HP regen for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team)
            .filter((u) => u !== unit && u.hp < u.maxHp);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'hot',
            amount: Math.round(unit.maxHp * 0.02), turns: 1 });
          return null; // silent — small rolling gift
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Fish Stand: +12% DEF while in the center hex.',
    },
  },

  heron_spearfisher: {
    id: 'heron_spearfisher',
    element: 'water',
    name: 'Heron Spearfisher',
    title: 'Stillness, Then Supper',
    rarity: 1,
    stats: { hp: 790, atk: 113, def: 63, speed: 97 },
    tint: { body: '#7a8a9a', helm: '#9aaab8', weapon: '#d8d8e0', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Heronspearfisheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'spear_snap', name: 'Spear Snap',
        icon: 'assets/icons/fc1461.png',
        description: 'A snapping thrust for 104% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.04 },
        ],
      },
      {
        id: 'patient_strike', name: 'Patient Strike',
        icon: 'assets/icons/fc1791.png',
        description: 'The long wait pays: 155% ATK, and the poise grants +20% crit damage for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.55 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critDamage', add: 0.2, turns: 1 },
        ],
      },
      {
        id: 'skewering_dive', name: 'Skewering Dive',
        icon: 'assets/icons/fc1621.png',
        description: 'Spear through the shallows: 165% ATK and -12% DEF for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.65 },
          { type: 'debuff', stat: 'def', mult: 0.88, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Still Water',
      icon: 'assets/icons/fc862.png',
      description: 'Strikes untroubled water: deals 18% extra damage to enemies with no status effects.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.length === 0 ? 1.18 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Reed Stand: +15% ATK while in a back hex.',
    },
  },

  finch_whistler: {
    id: 'finch_whistler',
    element: 'wind',
    name: 'Finch Whistler',
    title: 'Six Grams of Morale',
    rarity: 1,
    stats: { hp: 760, atk: 103, def: 64, speed: 100 },
    tint: { body: '#c8a83a', helm: '#e8c85a', weapon: '#e8d8a8', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Finchwhistleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'sharp_note', name: 'Sharp Note',
        icon: 'assets/icons/fc1003.png',
        description: 'A piercing note: 83% ATK that drains 6% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.83 },
          { type: 'turnMeter', amount: -0.06 },
        ],
      },
      {
        id: 'rallying_trill', name: 'Rallying Trill',
        icon: 'assets/icons/fc868.png',
        description: 'A bright trill: an ally gains +20% ATK for 2 turns and heals 40% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.2, turns: 2 },
          { type: 'heal', mult: 0.4 },
        ],
      },
      {
        id: 'chorus_of_dawn', name: 'Chorus of Dawn',
        icon: 'assets/icons/fc869.png',
        description: 'The dawn chorus: ALL allies heal 60% of ATK and gain +6% SPD for 1 turn.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.6 },
          { type: 'buff', stat: 'speed', mult: 1.06, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Cheerful Song',
      icon: 'assets/icons/fc882.png',
      description: 'Whenever an ally is healed, the Finch gains +5% ATK for 1 turn.',
      hooks: {
        onAllyHealed(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.05, turns: 1 });
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.1,
      description: 'Songperch: +10% SPD while in a back hex.',
    },
  },

  duck_sapper: {
    id: 'duck_sapper',
    element: 'fire',
    name: 'Duck Sapper',
    title: 'Quack Goes the Wall',
    rarity: 1,
    stats: { hp: 820, atk: 115, def: 66, speed: 94 },
    tint: { body: '#4a6a3a', helm: '#6a8a4a', weapon: '#a8a098', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Ducksapperidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bomb_toss', name: 'Bomb Toss',
        icon: 'assets/icons/fc981.png',
        description: 'A lobbed charge: 85% ATK plus a 9% ATK burn for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
          { type: 'dot', pct: 0.09, turns: 1 },
        ],
      },
      {
        id: 'satchel_charge', name: 'Satchel Charge',
        icon: 'assets/icons/fc1044.png',
        description: 'Set and run: 130% ATK and -15% DEF for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
          { type: 'debuff', stat: 'def', mult: 0.85, turns: 1 },
        ],
      },
      {
        id: 'powder_keg', name: 'Powder Keg',
        icon: 'assets/icons/fc1050.png',
        description: 'The big one: 80% ATK to ALL enemies plus a 12% ATK burn for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'dot', pct: 0.12, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Sputtering Fuse',
      icon: 'assets/icons/fc1052.png',
      description: 'At turn start, 20% chance a stray spark burns a random enemy (8% of his ATK for 1 turn).',
      hooks: {
        onTurnStart(unit, battle) {
          if (Math.random() >= 0.20) return null;
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          target.addStatusEffect({ kind: 'dot',
            amount: Math.max(1, Math.round(unit.effectiveStat('atk') * 0.08)), turns: 1 });
          return {
            label: 'Sputtering Fuse',
            message: `${unit.name}'s stray spark catches ${target.name}.`,
            floats: [{ target, text: 'BURNING', color: '#e8843a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Demolition Range: +12% ATK while in a back hex.',
    },
  },

  magpie_filcher: {
    id: 'magpie_filcher',
    element: 'fire',
    name: 'Magpie Filcher',
    title: 'Everything Shiny Is Hers',
    rarity: 1,
    stats: { hp: 740, atk: 117, def: 58, speed: 105 },
    tint: { body: '#2a2a3a', helm: '#e8e8f8', weapon: '#e8c83a', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Magpiefilcheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snatch_peck', name: 'Snatch Peck',
        icon: 'assets/icons/fc1444.png',
        description: 'A thieving peck: 95% ATK and 6% turn meter pocketed.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.06 },
        ],
      },
      {
        id: 'steal_shine', name: 'Steal Shine',
        icon: 'assets/icons/fc825.png',
        description: 'Steals the gleam from their eye: 115% ATK and -10% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.15 },
          { type: 'debuff', stat: 'critChance', add: -0.1, turns: 1 },
        ],
      },
      {
        id: 'treasure_dive', name: 'Treasure Dive',
        icon: 'assets/icons/fc728.png',
        description: 'Dives for the prize: 180% ATK, then gloats: +10% ATK for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.8 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.1, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Shiny Snatcher',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 20% extra damage to buffed enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'buff') ? 1.2 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.12,
      description: 'Getaway Perch: +12% damage dealt from a back hex.',
    },
  },

  woodpecker_driller: {
    id: 'woodpecker_driller',
    element: 'fire',
    name: 'Woodpecker Driller',
    title: 'Headache Included',
    rarity: 1,
    stats: { hp: 780, atk: 119, def: 61, speed: 96 },
    tint: { body: '#8a2a2a', helm: '#e8e8f8', weapon: '#c8c0b0', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Woodpeckerdrilleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'drill_peck', name: 'Drill Peck',
        icon: 'assets/icons/fc746.png',
        description: 'Two hammering pecks for 52% ATK each.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.52 },
          { type: 'damage', mult: 0.52 },
        ],
      },
      {
        id: 'hammering_burst', name: 'Hammering Burst',
        icon: 'assets/icons/fc763.png',
        description: 'A drumroll of four blows for 42% ATK each.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.42 },
          { type: 'damage', mult: 0.42 },
          { type: 'damage', mult: 0.42 },
          { type: 'damage', mult: 0.42 },
        ],
      },
      {
        id: 'trepanation', name: 'Trepanation',
        icon: 'assets/icons/fc734.png',
        description: 'Drill to the quick: 145% ATK and the target takes +30% damage for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.45 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.3, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Relentless Drumming',
      icon: 'assets/icons/fc867.png',
      description: 'Gains +6% crit chance and +6% crit damage for 1 turn at each turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.06, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.06, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Braced Tail: +12% ATK while in a front hex.',
    },
  },

  gull_raider: {
    id: 'gull_raider',
    element: 'water',
    name: 'Gull Raider',
    title: 'Your Chips Are Forfeit',
    rarity: 1,
    stats: { hp: 765, atk: 109, def: 60, speed: 99 },
    tint: { body: '#d8d8e0', helm: '#a8a8b8', weapon: '#c8c0b0', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Gullraideridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'swoop_grab', name: 'Swoop Grab',
        icon: 'assets/icons/fc1447.png',
        description: 'A grabbing swoop for 92% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.92 },
        ],
      },
      {
        id: 'mob_dive', name: 'Mob Dive',
        icon: 'assets/icons/fc763.png',
        description: 'The flock joins in: 138% ATK and drains 8% turn meter.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.38 },
          { type: 'turnMeter', amount: -0.08 },
        ],
      },
      {
        id: 'squall_screech', name: 'Squall Screech',
        icon: 'assets/icons/fc807.png',
        description: 'An ear-splitting squall: 50% ATK to ALL enemies and -5% ATK for 1 turn.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.5 },
          { type: 'debuff', stat: 'atk', mult: 0.95, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Mob Tactics',
      icon: 'assets/icons/fc862.png',
      description: 'Deals 3% extra damage for each living ally (up to +18%).',
      hooks: {
        damageDealtMult(unit) {
          if (typeof Battle === 'undefined' || !Battle.active) return 1;
          const allies = Battle.active.livingUnits(unit.team).length - 1;
          return 1 + Math.min(6, Math.max(0, allies)) * 0.03;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.12,
      description: 'Updraft: +12% SPD while in a back hex.',
    },
  },

  crane_dancer: {
    id: 'crane_dancer',
    element: 'water',
    name: 'Crane Dancer',
    title: 'Poise as a Weapon',
    rarity: 2,
    stats: { hp: 880, atk: 127, def: 73, speed: 107 },
    tint: { body: '#e8e8f8', helm: '#8a2a2a', weapon: '#c8c0b0', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Cranedanceridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'crane_kick', name: 'Crane Kick',
        icon: 'assets/icons/fc663.png',
        description: 'A snapping kick for 107% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.07 },
        ],
      },
      {
        id: 'sweeping_wing', name: 'Sweeping Wing',
        icon: 'assets/icons/fc729.png',
        description: 'A wing sweep across a hex row: 95% ATK, flowing into +5% SPD for 1 turn.',
        cooldown: 3, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.05, turns: 1 },
        ],
      },
      {
        id: 'water_mirror_dance', name: 'Water Mirror Dance',
        icon: 'assets/icons/fc882.png',
        description: 'A dance on still water: takes 25% less damage and +15% SPD for 2 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.75, turns: 2 },
          { type: 'buff', stat: 'speed', mult: 1.15, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Poised Grace',
      icon: 'assets/icons/fc868.png',
      description: '+12% chance to dodge while at full HP.',
      hooks: {
        dodgeAdd(unit) {
          return unit.hp >= unit.maxHp ? 0.12 : 0;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'speed', mult: 1.12,
      description: 'Stage Center: +12% SPD while in the center hex.',
    },
  },

  falcon_diver: {
    id: 'falcon_diver',
    element: 'wind',
    name: 'Falcon Diver',
    title: 'Two Hundred Miles an Hour of Opinion',
    rarity: 2,
    stats: { hp: 850, atk: 139, def: 64, speed: 113 },
    tint: { body: '#5a5a6a', helm: '#8a8a9a', weapon: '#c8c0b0', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Falcondiveridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'talon_rake', name: 'Talon Rake',
        icon: 'assets/icons/fc1444.png',
        description: 'A raking pass for 103% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.03 },
        ],
      },
      {
        id: 'stoop', name: 'Stoop',
        icon: 'assets/icons/fc825.png',
        description: 'A blinding dive: 175% ATK, but pulling up costs 10% of his own meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.75 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: -0.1 },
        ],
      },
      {
        id: 'terminal_velocity', name: 'Terminal Velocity',
        icon: 'assets/icons/fc734.png',
        description: 'The full drop: 215% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.15 },
        ],
      },
    ],
    passive: {
      name: 'Wind Rider',
      icon: 'assets/icons/fc882.png',
      description: '+10% chance to take an extra turn after acting.',
      hooks: { extraTurnAdd: 0.10 },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.15,
      description: 'High Perch: +15% damage dealt from a back hex.',
    },
  },

  parrot_mimic: {
    id: 'parrot_mimic',
    element: 'fire',
    name: 'Parrot Mimic',
    title: 'Repeats Your Worst Ideas',
    rarity: 2,
    stats: { hp: 830, atk: 131, def: 67, speed: 104 },
    tint: { body: '#2a8a4a', helm: '#e8433a', weapon: '#e8c83a', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Parrotmimicidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'mocking_jab', name: 'Mocking Jab',
        icon: 'assets/icons/fc663.png',
        description: 'An insulting jab: 88% ATK and -4% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.88 },
          { type: 'debuff', stat: 'atk', mult: 0.96, turns: 1 },
        ],
      },
      {
        id: 'copied_technique', name: 'Copied Technique',
        icon: 'assets/icons/fc723.png',
        description: 'Their own move, better: 150% ATK — 35% more against buffed enemies.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.5, bonusVs: { kind: 'buff', mult: 1.35 } },
        ],
      },
      {
        id: 'cacophony', name: 'Cacophony',
        icon: 'assets/icons/fc1084.png',
        description: 'Every voice at once: ALL enemies lose 8% crit chance for 1 turn and 4% turn meter.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'critChance', add: -0.08, turns: 1 },
          { type: 'turnMeter', amount: -0.04 },
        ],
      },
    ],
    passive: {
      name: 'Echoed Insults',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, a random enemy loses 5% crit chance for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          target.addStatusEffect({ kind: 'debuff', stat: 'critChance', add: -0.05, turns: 1 });
          return null; // silent — small rolling malus
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Soapbox: +12% ATK while in the center hex.',
    },
  },

  goose_bruiser: {
    id: 'goose_bruiser',
    element: 'water',
    name: 'Goose Bruiser',
    title: 'Peace Was Never an Option',
    rarity: 2,
    stats: { hp: 1010, atk: 124, def: 86, speed: 93 },
    tint: { body: '#d8d8d0', helm: '#e8843a', weapon: '#c8c0b0', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Goosebruiseridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wing_slap', name: 'Wing Slap',
        icon: 'assets/icons/fc762.png',
        description: 'A humiliating slap for 117% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.17 },
        ],
      },
      {
        id: 'honking_charge', name: 'Honking Charge',
        icon: 'assets/icons/fc869.png',
        description: 'An outraged charge: 128% ATK, wings wide: +12% DEF for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.28 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.12, turns: 1 },
        ],
      },
      {
        id: 'breakwater_stand', name: 'Breakwater Stand',
        icon: 'assets/icons/fc855.png',
        description: 'Holds the shore: front-hex allies gain +15% DEF for 2 turns and 5% turn meter.',
        cooldown: 6, targeting: 'front-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.15, turns: 2 },
          { type: 'turnMeter', amount: 0.05 },
        ],
      },
    ],
    passive: {
      name: 'Down Padding',
      icon: 'assets/icons/fc856.png',
      description: 'At turn start, recovers 2% max HP and gains +4% DEF for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.heal(Math.round(unit.maxHp * 0.02));
          unit.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.04, turns: 1 });
          return null; // silent — small rolling padding
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Beach Head: +15% DEF while in a front hex.',
    },
  },

  hawk_lancer: {
    id: 'hawk_lancer',
    element: 'fire',
    name: 'Hawk Lancer',
    title: 'The Sky Has a Point',
    rarity: 2,
    stats: { hp: 910, atk: 137, def: 71, speed: 103 },
    tint: { body: '#7a5a3a', helm: '#9a7a4a', weapon: '#d8d8e0', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Hawklanceridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'lance_dive', name: 'Lance Dive',
        icon: 'assets/icons/fc1461.png',
        description: 'A diving thrust for 120% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
        ],
      },
      {
        id: 'wingover_thrust', name: 'Wingover Thrust',
        icon: 'assets/icons/fc1791.png',
        description: 'A rolling thrust: 140% ATK, carrying speed: +7% SPD for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.4 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.07, turns: 2 },
        ],
      },
      {
        id: 'sunward_spiral', name: 'Sunward Spiral',
        icon: 'assets/icons/fc1044.png',
        description: 'Climb and fall burning: 170% ATK plus a 15% ATK burn for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.7 },
          { type: 'dot', pct: 0.15, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Talon Grip',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 25% extra damage to weakened (ATK-debuffed) enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'debuff' && fx.stat === 'atk') ? 1.25 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Thermal Column: +15% ATK while in a back hex.',
    },
  },

  swan_guardian: {
    id: 'swan_guardian',
    element: 'water',
    name: 'Swan Guardian',
    title: 'Grace, Weaponized',
    rarity: 2,
    stats: { hp: 1040, atk: 119, def: 90, speed: 91 },
    tint: { body: '#f8f0e8', helm: '#e8c83a', weapon: '#d8d8e0', shield: '#a8c8e8', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Swanguardianidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'white_wing_strike', name: 'White Wing Strike',
        icon: 'assets/icons/fc854.png',
        description: 'A guarded strike: 94% ATK, wings folded: takes 6% less damage until next turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.94 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.94, turns: 1 },
        ],
      },
      {
        id: 'sheltering_wings', name: 'Sheltering Wings',
        icon: 'assets/icons/fc855.png',
        description: 'Wrap an ally in white: they take 20% less damage for 1 turn and heal 30% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.8, turns: 1 },
          { type: 'heal', mult: 0.3 },
        ],
      },
      {
        id: 'lake_aegis', name: 'Lake Aegis',
        icon: 'assets/icons/fc1112.png',
        description: 'The still lake rises: ALL allies take 8% less damage for 2 turns and heal 30% of ATK.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.92, turns: 2 },
          { type: 'heal', mult: 0.3 },
        ],
      },
    ],
    passive: {
      name: 'Graceful Bulwark',
      icon: 'assets/icons/fc856.png',
      description: 'At turn start, shields the most wounded ally: takes 10% less damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.9, turns: 1 });
          return null; // silent — small rolling shield
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Lake Heart: +15% DEF while in the center hex.',
    },
  },

  phoenix_ascendant: {
    id: 'phoenix_ascendant',
    element: 'fire',
    name: 'Phoenix Ascendant',
    title: 'Dies Occasionally, Never Permanently',
    rarity: 3,
    stats: { hp: 1120, atk: 179, def: 83, speed: 105 },
    tint: { body: '#e8632a', helm: '#f8a83a', weapon: '#f8c84a', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Phoenixascendantidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'ember_wing', name: 'Ember Wing',
        icon: 'assets/icons/fc981.png',
        description: 'A burning wingtip: 102% ATK plus a 10% ATK burn for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.02 },
          { type: 'dot', pct: 0.1, turns: 1 },
        ],
      },
      {
        id: 'immolating_embrace', name: 'Immolating Embrace',
        icon: 'assets/icons/fc1050.png',
        description: 'Hold them close: 120% ATK plus a 35% ATK burn for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'dot', pct: 0.35, turns: 2 },
        ],
      },
      {
        id: 'supernova', name: 'Supernova',
        icon: 'assets/icons/fc1044.png',
        description: 'Go nova: 100% ATK to ALL enemies, and the afterglow mends her: 4% max HP regen for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
        ],
        selfEffects: [
          { type: 'hot', pct: 0.04, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Rebirth Embers',
      icon: 'assets/icons/fc1003.png',
      description: 'Once per battle, at turn start below 20% HP, the embers reignite: heals 25% max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.embersSpent || unit.hp / unit.maxHp >= 0.2) return null;
          unit.embersSpent = true;
          const healed = unit.heal(Math.round(unit.maxHp * 0.25));
          return {
            label: 'Rebirth Embers',
            message: `${unit.name} reignites for ${healed} HP!`,
            floats: [{ target: unit, text: `+${healed}`, color: '#f8a83a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.15,
      description: 'Pyre Heart: +15% ATK while in the center hex.',
    },
  },

  albatross_stormrider: {
    id: 'albatross_stormrider',
    element: 'wind',
    name: 'Albatross Stormrider',
    title: 'Ten Thousand Miles of Bad Weather',
    rarity: 3,
    stats: { hp: 1160, atk: 171, def: 87, speed: 102 },
    tint: { body: '#8a9ab8', helm: '#a8b8d8', weapon: '#e8e8f8', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Albatrossstormrideridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wind_shear', name: 'Wind Shear',
        icon: 'assets/icons/fc1030.png',
        description: 'A shearing gust: 97% ATK that drains 9% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.97 },
          { type: 'turnMeter', amount: -0.09 },
        ],
      },
      {
        id: 'crosswind', name: 'Crosswind',
        icon: 'assets/icons/fc724.png',
        description: 'A crosswind rakes a hex row: 110% ATK and -8% SPD for 1 turn.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.1 },
          { type: 'debuff', stat: 'speed', mult: 0.92, turns: 1 },
        ],
      },
      {
        id: 'eye_of_the_storm', name: 'Eye of the Storm',
        icon: 'assets/icons/fc807.png',
        description: 'The storm lands: 75% ATK to ALL enemies and -7% meter, while he rides the calm: +10% SPD for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'turnMeter', amount: -0.07 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.1, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Storm Static',
      icon: 'assets/icons/fc882.png',
      description: 'At turn start, static arcs off him: ALL enemies take 2% of his ATK as damage.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.effectiveStat('atk') * 0.02));
          for (const e of enemies) e.takeDamage(amount);
          return {
            label: 'Storm Static',
            message: `${unit.name}'s static arcs across the field.`,
            floats: enemies.map((e) => ({ target: e, text: `-${amount}`, color: '#a8b8d8' })),
          };
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Weather Deck: +15% ATK while in a back hex.',
    },
  },

  peacock_radiant: {
    id: 'peacock_radiant',
    element: 'fire',
    name: 'Peacock Radiant',
    title: 'A Hundred Eyes, All Judging',
    rarity: 3,
    stats: { hp: 1080, atk: 183, def: 79, speed: 107 },
    tint: { body: '#2a6a8a', helm: '#2a8a6a', weapon: '#e8c83a', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Peacockradiantidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'fan_flash', name: 'Fan Flash',
        icon: 'assets/icons/fc1084.png',
        description: 'A dazzling flash: 91% ATK and -6% crit chance for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.91 },
          { type: 'debuff', stat: 'critChance', add: -0.06, turns: 1 },
        ],
      },
      {
        id: 'hundred_eyes', name: 'Hundred Eyes',
        icon: 'assets/icons/fc862.png',
        description: 'The tail stares back: 155% ATK and -13% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.55 },
          { type: 'debuff', stat: 'atk', mult: 0.87, turns: 2 },
        ],
      },
      {
        id: 'royal_display', name: 'Royal Display',
        icon: 'assets/icons/fc869.png',
        description: 'The full fan: ALL allies gain +12% ATK and +6% crit chance for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.12, turns: 2 },
          { type: 'buff', stat: 'critChance', add: 0.06, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Iridescence',
      icon: 'assets/icons/fc868.png',
      description: 'Gains +8% SPD and +8% crit chance for 1 turn at each turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.08, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.08, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.15,
      description: 'Display Mound: +15% ATK while in the center hex.',
    },
  },

  stork_lifebringer: {
    id: 'stork_lifebringer',
    element: 'water',
    name: 'Stork Lifebringer',
    title: 'Deliveries in All Weather',
    rarity: 3,
    stats: { hp: 1210, atk: 162, def: 92, speed: 98 },
    tint: { body: '#f8f0e8', helm: '#e8433a', weapon: '#c8b898', skin: '#d8b88a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Storklifebringeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'long_beak_jab', name: 'Long Beak Jab',
        icon: 'assets/icons/fc1461.png',
        description: 'A long-reach jab: 96% ATK that steadies her for 12% of ATK in healing.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.12 },
        ],
      },
      {
        id: 'bundle_of_life', name: 'Bundle of Life',
        icon: 'assets/icons/fc1112.png',
        description: 'A well-wrapped delivery: heals an ally 15% of her max HP plus 2% regen for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.15 },
          { type: 'hot', pct: 0.02, turns: 2 },
        ],
      },
      {
        id: 'first_breath', name: 'First Breath',
        icon: 'assets/icons/fc855.png',
        description: 'The oldest delivery of all: revives a fallen ally at 35% HP.',
        cooldown: 7, targeting: 'dead-ally', animation: 'attack',
        effects: [
          { type: 'revive', pct: 0.35 },
        ],
      },
    ],
    passive: {
      name: 'Deliverance',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, any ally below 30% HP receives 4% of her max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          const dying = battle.livingUnits(unit.team)
            .filter((u) => u.hp / u.maxHp < 0.3);
          if (dying.length === 0) return null;
          let total = 0;
          for (const ally of dying) total += ally.heal(Math.round(unit.maxHp * 0.04));
          if (total <= 0) return null;
          return {
            label: 'Deliverance',
            message: `${unit.name} delivers ${total} HP to the faltering.`,
            floats: [],
          };
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.15,
      description: 'Rooftop Nest: +15% DEF while in a back hex.',
    },
  },

  // ---- Minotaur cohort ----------------------------------------------------
  // Bonefield natives; idle-only art for now.

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
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Shield Line: +15% DEF while in a front hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'hp', mult: 1.15,
      description: 'Immovable: +15% max HP while in a front hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.2,
      description: 'Gatekeeper: +20% DEF while in a front hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Overwatch: +15% ATK while in a back hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'damage', mult: 1.15,
      description: 'Center of Attention: +15% damage dealt from the center hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'hp', mult: 1.2,
      description: 'Spirit Shelter: +20% max HP while in a back hex.',
    },
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
          target.takeDamage(amount);
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
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.15,
      description: 'Grave Roost: +15% damage dealt from a back hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Fell Stance: +12% ATK while in a front hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Fold Gate: +12% DEF while in the center hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.12,
      description: 'Trenchwork: +12% DEF while in a front hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.1,
      description: 'Piper\'s Knoll: +10% SPD while in a back hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Chopping Block: +12% ATK while in a front hex.',
    },
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
      description: '+12% chance to dodge while holding a front hex.',
      hooks: {
        dodgeAdd(unit) {
          return unit.slot && unit.slot.position === POSITION.FRONT ? 0.12 : 0;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Watchpost: +15% DEF while in a front hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Throwing Lane: +15% ATK while in a back hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.15,
      description: 'Ram Position: +15% ATK while in a front hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.18,
      description: 'Gatekeeper: +18% DEF while in a front hex.',
    },
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
      description: 'Deals 15% extra damage while holding the center hex.',
      hooks: {
        damageDealtMult(unit, target) {
          return unit.slot && unit.slot.position === POSITION.CENTER ? 1.15 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'speed', mult: 1.12,
      description: 'Pivot: +12% SPD while in the center hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Anvil Stone: +15% DEF while in the center hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Corner Post: +15% DEF while in a front hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Ley Line: +12% ATK while in a back hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Old Ground: +12% ATK while in a front hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.15,
      description: 'War Banner: +15% ATK while in the center hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.2,
      description: 'Rampart: +20% DEF while in a front hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Cursing Distance: +15% ATK while in a back hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Sun Disc: +12% ATK while in the center hex.',
    },
  },

  // ---- Snake cohort -------------------------------------------------------
  // Marshland natives; poison (DoT) specialists. Idle-only art for now.

  snake_warrior: {
    id: 'snake_warrior',
    element: 'water',
    name: 'Snake Warrior',
    title: 'Marsh Blade',
    rarity: 1,
    stats: { hp: 870, atk: 112, def: 68, speed: 96 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakewarrioridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'fang_slash', name: 'Fang Slash',
        icon: 'assets/icons/fc726.png',
        description: 'Slash for 95% ATK with a lick of venom: 15% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'dot', pct: 0.15, turns: 1 },
        ],
      },
      {
        id: 'venom_cut', name: 'Venom Cut',
        icon: 'assets/icons/fc722.png',
        description: 'Deals 120% ATK and poisons for 30% ATK per turn (2 turns).',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'dot', pct: 0.3, turns: 2 },
        ],
      },
      {
        id: 'coil_crush', name: 'Coil Crush',
        icon: 'assets/icons/fc748.png',
        description: 'Constrict and crush: 170% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.7 }],
      },
    ],
    passive: {
      name: 'Scaled Hide',
      icon: 'assets/icons/fc1112.png',
      description: 'Thrives in filth: recovers 5% max HP at turn start while poisoned or debuffed.',
      hooks: {
        onTurnStart(unit) {
          const afflicted = unit.statusEffects.some(
            (fx) => fx.kind === 'debuff' || fx.kind === 'dot');
          if (!afflicted) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.05));
          if (healed <= 0) return null;
          return {
            label: 'Scaled Hide',
            message: `${unit.name}'s scales knit ${healed} HP back.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#7ae87a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Coiled Guard: +15% DEF while in a front hex.',
    },
  },

  snake_archer: {
    id: 'snake_archer',
    element: 'wind',
    name: 'Snake Archer',
    title: 'Reed Stalker',
    rarity: 1,
    stats: { hp: 720, atk: 118, def: 55, speed: 102 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakearcheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'reed_shot', name: 'Reed Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'A reed arrow for 98% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.98 },
        ],
      },
      {
        id: 'venom_arrow', name: 'Venom Arrow',
        icon: 'assets/icons/fc1516.png',
        description: 'Deals 115% ATK and poisons for 30% ATK per turn (2 turns).',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.15 },
          { type: 'dot', pct: 0.3, turns: 2 },
        ],
      },
      {
        id: 'arrow_hiss', name: 'Arrow Hiss',
        icon: 'assets/icons/fc807.png',
        description: 'A venom-tipped volley: 60% ATK to ALL enemies plus a 10% ATK poison for 1 turn.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.6 },
          { type: 'dot', pct: 0.10, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Slither Step',
      icon: 'assets/icons/fc882.png',
      description: 'Gains +6% SPD for 2 turns at each turn start (briefly stacks).',
      hooks: {
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.06, turns: 2 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Reed Blind: +15% ATK while in a back hex.',
    },
  },

  snake_assassin: {
    id: 'snake_assassin',
    element: 'dark',
    name: 'Snake Assassin',
    title: 'Silent Fang',
    rarity: 2,
    stats: { hp: 810, atk: 138, def: 58, speed: 116, critChance: 0.25 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakeassassinidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'viper_stab', name: 'Viper Stab',
        icon: 'assets/icons/fc1444.png',
        description: 'A lightning stab: 100% ATK plus 20% ATK venom for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'dot', pct: 0.20, turns: 1 },
        ],
      },
      {
        id: 'envenom', name: 'Envenom',
        icon: 'assets/icons/fc825.png',
        description: 'Deals 130% ATK and poisons for 40% ATK per turn (3 turns).',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
          { type: 'dot', pct: 0.4, turns: 3 },
        ],
      },
      {
        id: 'fang_finish', name: 'Fang Finish',
        icon: 'assets/icons/fc734.png',
        description: 'An executioner\'s bite: 160% ATK — 60% more against poisoned prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.6, bonusVs: { kind: 'dot', mult: 1.6 } },
        ],
      },
    ],
    passive: {
      name: 'Taste for Venom',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 20% extra damage to poisoned or debuffed enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects && target.statusEffects.some(
            (fx) => fx.kind === 'debuff' || fx.kind === 'dot') ? 1.2 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.15,
      description: 'Ambush Coil: +15% damage dealt from a back hex.',
    },
  },

  snake_mage: {
    id: 'snake_mage',
    element: 'fire',
    name: 'Snake Mage',
    title: 'Marsh-Light Caller',
    rarity: 2,
    stats: { hp: 830, atk: 142, def: 60, speed: 104 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakemageidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'venom_bolt', name: 'Venom Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'A gob of venom: 80% ATK plus an 18% ATK poison for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'dot', pct: 0.18, turns: 2 },
        ],
      },
      {
        id: 'corrosive_blast', name: 'Corrosive Blast',
        icon: 'assets/icons/fc1066.png',
        description: 'Deals 120% ATK and corrodes armor: -15% DEF for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'debuff', stat: 'def', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'toxic_nova', name: 'Toxic Nova',
        icon: 'assets/icons/fc1067.png',
        description: 'Deals 75% ATK to ALL enemies and poisons for 25% ATK per turn (2 turns).',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'dot', pct: 0.25, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Hexing Focus',
      icon: 'assets/icons/fc987.png',
      description: '+15% debuff accuracy.',
      hooks: { accuracyAdd: 0.15 },
    },
    positional: {
      position: POSITION.CENTER, stat: 'damage', mult: 1.15,
      description: 'Marsh Focus: +15% damage dealt from the center hex.',
    },
  },

  snake_alchemist: {
    id: 'snake_alchemist',
    element: 'water',
    name: 'Snake Alchemist',
    title: 'Venom Chemist',
    rarity: 2,
    stats: { hp: 900, atk: 125, def: 72, speed: 98 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakealchemistidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'acid_splash', name: 'Acid Splash',
        icon: 'assets/icons/fc121.png',
        description: 'Acid for 80% ATK that eats armor: -10% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'debuff', stat: 'def', mult: 0.9, turns: 1 },
        ],
      },
      {
        id: 'caustic_brew', name: 'Caustic Brew',
        icon: 'assets/icons/fc123.png',
        description: 'Deals 110% ATK and marks the target: +15% damage taken for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.1 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.15, turns: 2 },
        ],
      },
      {
        id: 'mutagen', name: 'Mutagen',
        icon: 'assets/icons/fc122.png',
        description: 'Cleanse an ally and grant +25% ATK for 2 turns.',
        cooldown: 6, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'cleanse' },
          { type: 'buff', stat: 'atk', mult: 1.25, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Iron Gut',
      icon: 'assets/icons/fc856.png',
      description: '+20% debuff resistance.',
      hooks: { resistanceAdd: 0.20 },
    },
    positional: {
      position: POSITION.FRONT, stat: 'hp', mult: 1.15,
      description: 'Hardened Brew: +15% max HP while in a front hex.',
    },
  },

  snake_shaman: {
    id: 'snake_shaman',
    element: 'wind',
    name: 'Snake Shaman',
    title: 'Mire Whisperer',
    rarity: 3,
    stats: { hp: 1120, atk: 155, def: 82, speed: 102 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakeshamanidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'spirit_fang', name: 'Spirit Fang',
        icon: 'assets/icons/fc970.png',
        description: 'A spectral bite for 85% ATK; spirits knit the Shaman for 2% max HP over 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
        ],
        selfEffects: [
          { type: 'hot', pct: 0.02, turns: 2 },
        ],
      },
      {
        id: 'swamp_blessing', name: 'Swamp Blessing',
        icon: 'assets/icons/fc1073.png',
        description: 'Swamp mud mends an ally for 10% of the Shaman\'s max HP and armors them: +15% DEF for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.10 },
          { type: 'buff', stat: 'def', mult: 1.15, turns: 2 },
        ],
      },
      {
        id: 'miasma', name: 'Miasma',
        icon: 'assets/icons/fc1068.png',
        description: 'Deals 50% ATK to ALL enemies and poisons for 35% ATK per turn (3 turns).',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.5 },
          { type: 'dot', pct: 0.35, turns: 3 },
        ],
      },
    ],
    passive: {
      name: 'Venom Master',
      icon: 'assets/icons/fc1069.png',
      description: '+25% DoT damage.',
      hooks: { dotBoostAdd: 0.25 },
    },
    positional: {
      position: POSITION.BACK, stat: 'hp', mult: 1.2,
      description: 'Mire Shelter: +20% max HP while in a back hex.',
    },
  },

  snake_healer: {
    id: 'snake_healer',
    element: 'light',
    name: 'Snake Healer',
    title: 'Molted Saint',
    rarity: 3,
    stats: { hp: 1180, atk: 148, def: 84, speed: 99 },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakehealeridle1.png', frames: 16, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'soothing_scales', name: 'Soothing Scales',
        icon: 'assets/icons/fc1041.png',
        description: 'Heal an ally for 8% of the healer\'s max HP.',
        cooldown: 0, targeting: 'ally', animation: 'attack',
        effects: [{ type: 'healHpPct', pct: 0.08 }],
      },
      {
        id: 'purifying_venom', name: 'Purifying Venom',
        icon: 'assets/icons/fc1046.png',
        description: 'Cleanse an ally and heal them for 10% of the healer\'s max HP.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'cleanse' },
          { type: 'healHpPct', pct: 0.10 },
        ],
      },
      {
        id: 'rebirth_molt', name: 'Rebirth Molt',
        icon: 'assets/icons/fc1113.png',
        description: 'Bless ALL allies with regrowth: 4% of the healer\'s max HP per turn for 3 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [{ type: 'hot', pct: 0.04, turns: 3 }],
      },
    ],
    passive: {
      name: 'Radiant Scales',
      icon: 'assets/icons/fc853.png',
      description: 'At turn start, shelters the most wounded ally: +12% DEF for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.12, turns: 1 });
          return null; // silent — small rolling shelter
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'hp', mult: 1.15,
      description: 'Sheltered Coil: +15% max HP while in a back hex.',
    },
  },

  // ---- Placeholder snake cohort (filling the roster to 25) ---------------
  // Procedural placeholder art renders until real idle sheets land at the
  // conventional flat paths (assets/heroes/snake<role>idle.png).

  snake_skirmisher: {
    id: 'snake_skirmisher',
    element: 'wind',
    name: 'Snake Skirmisher',
    title: 'Reed-Blade Runner',
    rarity: 1,
    stats: { hp: 740, atk: 112, def: 58, speed: 104 },
    tint: { body: '#5a8a5a', helm: '#7aaa6a', weapon: '#c8c0b0', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakeskirmisheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'twin_fang_jab', name: 'Twin Fang Jab',
        icon: 'assets/icons/fc1444.png',
        description: 'Two needle jabs for 55% ATK each.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.55 },
          { type: 'damage', mult: 0.55 },
        ],
      },
      {
        id: 'slipstrike', name: 'Slipstrike',
        icon: 'assets/icons/fc825.png',
        description: 'Slide past the guard: 135% ATK and 5% turn meter back.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.35 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.05 },
        ],
      },
      {
        id: 'sand_spray', name: 'Sand Spray',
        icon: 'assets/icons/fc807.png',
        description: 'Kick sand at ALL enemies: 55% ATK and -5% SPD for 1 turn.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.55 },
          { type: 'debuff', stat: 'speed', mult: 0.95, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Ambush Coil',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 20% extra damage to enemies about to act (turn meter above 80%).',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.turnMeter > CONFIG.TURN_METER_MAX * 0.8 ? 1.2 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.12,
      description: 'Reed Runner: +12% SPD while in a back hex.',
    },
  },

  snake_spitter: {
    id: 'snake_spitter',
    element: 'water',
    name: 'Snake Spitter',
    title: 'Gutter Geyser',
    rarity: 1,
    stats: { hp: 760, atk: 115, def: 60, speed: 97 },
    tint: { body: '#4a7a8a', helm: '#6a9aaa', weapon: '#8ab8c8', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakespitteridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'venom_spit', name: 'Venom Spit',
        icon: 'assets/icons/fc981.png',
        description: 'A gob of spit: 75% ATK plus 22% ATK venom for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'dot', pct: 0.22, turns: 1 },
        ],
      },
      {
        id: 'blinding_spray', name: 'Blinding Spray',
        icon: 'assets/icons/fc1084.png',
        description: 'Spray the eyes: 100% ATK and -15% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'debuff', stat: 'critChance', add: -0.15, turns: 1 },
        ],
      },
      {
        id: 'drowning_gout', name: 'Drowning Gout',
        icon: 'assets/icons/fc819.png',
        description: 'A choking torrent: 130% ATK that drains 25% turn meter.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
          { type: 'turnMeter', amount: -0.25 },
        ],
      },
    ],
    passive: {
      name: 'Spitting Arc',
      icon: 'assets/icons/fc862.png',
      description: 'Deals 12% extra damage while holding a back hex.',
      hooks: {
        damageDealtMult(unit, target) {
          return unit.slot && unit.slot.position === POSITION.BACK ? 1.12 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'High Ground: +15% ATK while in a back hex.',
    },
  },

  snake_grappler: {
    id: 'snake_grappler',
    element: 'fire',
    name: 'Snake Grappler',
    title: 'Coil of the Pit',
    rarity: 1,
    stats: { hp: 900, atk: 108, def: 74, speed: 90 },
    tint: { body: '#8a5a3a', helm: '#aa7a4a', weapon: '#c8a878', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakegrappleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'coil_grab', name: 'Coil Grab',
        icon: 'assets/icons/fc663.png',
        description: 'Seize and squeeze: 90% ATK and -10% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'debuff', stat: 'speed', mult: 0.9, turns: 1 },
        ],
      },
      {
        id: 'constricting_squeeze', name: 'Constricting Squeeze',
        icon: 'assets/icons/fc762.png',
        description: 'Crush the air out: 110% ATK and -15% ATK for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.1 },
          { type: 'debuff', stat: 'atk', mult: 0.85, turns: 1 },
        ],
      },
      {
        id: 'python_slam', name: 'Python Slam',
        icon: 'assets/icons/fc767.png',
        description: 'Whip-slam for 175% ATK, then harden scales: +15% DEF for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.75 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.15, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Iron Coils',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 12% less damage while above 70% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.hp / unit.maxHp > 0.7 ? 0.88 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Anchor Coil: +15% DEF while in a front hex.',
    },
  },

  snake_flutist: {
    id: 'snake_flutist',
    element: 'wind',
    name: 'Snake Flutist',
    title: 'Charmer Charmed',
    rarity: 1,
    stats: { hp: 780, atk: 106, def: 66, speed: 99 },
    tint: { body: '#7a6aa8', helm: '#9a8ac8', weapon: '#e8d8a8', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakeflutistidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'charming_note', name: 'Charming Note',
        icon: 'assets/icons/fc1003.png',
        description: 'A jarring note: 80% ATK that drains 10% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'turnMeter', amount: -0.1 },
        ],
      },
      {
        id: 'soothing_melody', name: 'Soothing Melody',
        icon: 'assets/icons/fc1112.png',
        description: 'Mend an ally for 100% of ATK and quicken them: +10% SPD for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.0 },
          { type: 'buff', stat: 'speed', mult: 1.1, turns: 2 },
        ],
      },
      {
        id: 'marching_tune', name: 'Marching Tune',
        icon: 'assets/icons/fc868.png',
        description: 'A driving tune: ALL allies gain +12% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.12, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Mesmer Rhythm',
      icon: 'assets/icons/fc882.png',
      description: 'At turn start, 20% chance to grant a random ally 10% turn meter.',
      hooks: {
        onTurnStart(unit, battle) {
          if (Math.random() >= 0.20) return null;
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          const ally = allies[Math.floor(Math.random() * allies.length)];
          ally.turnMeter = Math.min(CONFIG.TURN_METER_MAX,
            ally.turnMeter + CONFIG.TURN_METER_MAX * 0.10);
          return {
            label: 'Mesmer Rhythm',
            message: `${unit.name}'s rhythm carries ${ally.name} forward.`,
            floats: [{ target: ally, text: '+10% METER', color: '#c8a8e8' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'speed', mult: 1.1,
      description: 'Bandstand: +10% SPD while in the center hex.',
    },
  },

  snake_broodtender: {
    id: 'snake_broodtender',
    element: 'water',
    name: 'Snake Broodtender',
    title: 'Keeper of the Clutch',
    rarity: 1,
    stats: { hp: 850, atk: 100, def: 72, speed: 93 },
    tint: { body: '#6a8a6a', helm: '#e8e0c8', weapon: '#c8b898', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakebroodtenderidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'shell_crack', name: 'Shell Crack',
        icon: 'assets/icons/fc1471.png',
        description: 'A rap of the staff for 106% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.06 },
        ],
      },
      {
        id: 'nourishing_yolk', name: 'Nourishing Yolk',
        icon: 'assets/icons/fc1112.png',
        description: 'Feed an ally: heals 110% of ATK and +10% DEF for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.1 },
          { type: 'buff', stat: 'def', mult: 1.1, turns: 2 },
        ],
      },
      {
        id: 'brood_shield', name: 'Brood Shield',
        icon: 'assets/icons/fc855.png',
        description: 'Shelter the clutch: ALL allies take 10% less damage for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.9, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Tender\'s Watch',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, mends ALL allies for 1% of her max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          let any = 0;
          for (const ally of battle.livingUnits(unit.team)) {
            any += ally.heal(Math.round(unit.maxHp * 0.01));
          }
          if (any <= 0) return null;
          return {
            label: "Tender's Watch",
            message: `${unit.name} tends the brood for ${any} HP.`,
            floats: [],
          };
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Nest Post: +12% DEF while in the center hex.',
    },
  },

  snake_fireeater: {
    id: 'snake_fireeater',
    element: 'fire',
    name: 'Snake Fire-Eater',
    title: 'Swallower of Sparks',
    rarity: 1,
    stats: { hp: 770, atk: 116, def: 62, speed: 95 },
    tint: { body: '#a84a2a', helm: '#e8843a', weapon: '#f8c84a', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakefireeateridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'flame_gulp', name: 'Flame Gulp',
        icon: 'assets/icons/fc981.png',
        description: 'Spit stolen fire: 100% ATK plus a 12% ATK burn for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'dot', pct: 0.12, turns: 1 },
        ],
      },
      {
        id: 'belch_flame', name: 'Belch Flame',
        icon: 'assets/icons/fc1044.png',
        description: 'Belch fire over the front line for 80% ATK.',
        cooldown: 4, targeting: 'front-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
        ],
      },
      {
        id: 'swallow_the_sun', name: 'Swallow the Sun',
        icon: 'assets/icons/fc1050.png',
        description: 'Gorge on flame: +40% ATK for 1 turn and 5% max HP regen for 2 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.4, turns: 1 },
          { type: 'hot', pct: 0.05, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Inner Furnace',
      icon: 'assets/icons/fc1052.png',
      description: 'Pain feeds the furnace: deals 20% extra damage while poisoned or debuffed.',
      hooks: {
        damageDealtMult(unit, target) {
          return unit.statusEffects.some((fx) => fx.kind === 'dot' || fx.kind === 'debuff') ? 1.2 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Fire Pit: +12% ATK while in the center hex.',
    },
  },

  snake_rattler: {
    id: 'snake_rattler',
    element: 'wind',
    name: 'Snake Rattler',
    title: 'Dread Percussionist',
    rarity: 1,
    stats: { hp: 750, atk: 110, def: 64, speed: 101 },
    tint: { body: '#8a7a4a', helm: '#a8985a', weapon: '#c8b878', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakerattleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rattle_strike', name: 'Rattle Strike',
        icon: 'assets/icons/fc1444.png',
        description: 'An unnerving strike: 95% ATK and -5% crit chance for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'debuff', stat: 'critChance', add: -0.05, turns: 1 },
        ],
      },
      {
        id: 'fear_rattle', name: 'Fear Rattle',
        icon: 'assets/icons/fc1084.png',
        description: 'A dreadful rattle: ALL enemies lose 7% ATK for 1 turn.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'atk', mult: 0.93, turns: 1 },
        ],
      },
      {
        id: 'snap_bite', name: 'Snap Bite',
        icon: 'assets/icons/fc734.png',
        description: 'A lightning lunge for 205% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.05 },
        ],
      },
    ],
    passive: {
      name: 'Unnerving Presence',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, a random enemy loses 3% ATK for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          target.addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.97, turns: 1 });
          return null; // silent — small rolling malus
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Rattle Range: +12% ATK while in a back hex.',
    },
  },

  snake_lancer: {
    id: 'snake_lancer',
    element: 'water',
    name: 'Snake Lancer',
    title: 'Scalepoint Rider',
    rarity: 2,
    stats: { hp: 920, atk: 128, def: 78, speed: 100 },
    tint: { body: '#3a6a9a', helm: '#5a8aba', weapon: '#d8d8e0', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakelanceridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'scale_lance', name: 'Scale Lance',
        icon: 'assets/icons/fc1461.png',
        description: 'A lance thrust for 113% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.13 },
        ],
      },
      {
        id: 'piercing_coil', name: 'Piercing Coil',
        icon: 'assets/icons/fc1791.png',
        description: 'Drive the lance home: 150% ATK and -10% DEF for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.5 },
          { type: 'debuff', stat: 'def', mult: 0.9, turns: 2 },
        ],
      },
      {
        id: 'serpent_charge', name: 'Serpent Charge',
        icon: 'assets/icons/fc724.png',
        description: 'Charge a hex row for 120% ATK; momentum grants 10% turn meter.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.1 },
        ],
      },
    ],
    passive: {
      name: 'Fangs of Pursuit',
      icon: 'assets/icons/fc1801.png',
      description: 'Deals 25% extra damage to slowed (SPD-debuffed) enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'debuff' && fx.stat === 'speed') ? 1.25 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Couched Lance: +12% ATK while in a front hex.',
    },
  },

  snake_winddancer: {
    id: 'snake_winddancer',
    element: 'wind',
    name: 'Snake Winddancer',
    title: 'Sister of the Gale',
    rarity: 2,
    stats: { hp: 840, atk: 134, def: 62, speed: 114 },
    tint: { body: '#6a9a8a', helm: '#8abaa8', weapon: '#e8e8d8', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakewinddanceridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'zephyr_cut', name: 'Zephyr Cut',
        icon: 'assets/icons/fc1447.png',
        description: 'A gliding cut for 96% ATK; the follow-through grants +5% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.05, turns: 1 },
        ],
      },
      {
        id: 'cyclone_spin', name: 'Cyclone Spin',
        icon: 'assets/icons/fc729.png',
        description: 'Whirl through a hex row for 105% ATK.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.05 },
        ],
      },
      {
        id: 'dance_of_gales', name: 'Dance of Gales',
        icon: 'assets/icons/fc882.png',
        description: 'Become the storm: +35% SPD and +10% crit chance for 2 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.35, turns: 2 },
          { type: 'buff', stat: 'critChance', add: 0.1, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Tailwind',
      icon: 'assets/icons/fc868.png',
      description: '+15% chance to dodge while in a back hex.',
      hooks: {
        dodgeAdd(unit) {
          return unit.slot && unit.slot.position === POSITION.BACK ? 0.15 : 0;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.12,
      description: 'Gale Step: +12% damage dealt from a back hex.',
    },
  },

  snake_bogwitch: {
    id: 'snake_bogwitch',
    element: 'water',
    name: 'Snake Bog Witch',
    title: 'Whisperer in the Weeds',
    rarity: 2,
    stats: { hp: 880, atk: 138, def: 66, speed: 102 },
    tint: { body: '#4a5a3a', helm: '#6a7a4a', weapon: '#a8c86a', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakebogwitchidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bog_bolt', name: 'Bog Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'A muddy bolt: 90% ATK that leaves the target taking +10% damage for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.1, turns: 1 },
        ],
      },
      {
        id: 'sinking_mire', name: 'Sinking Mire',
        icon: 'assets/icons/fc1084.png',
        description: 'The ground swallows: ALL enemies lose 12% SPD for 2 turns.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'speed', mult: 0.88, turns: 2 },
        ],
      },
      {
        id: 'hex_of_rot', name: 'Hex of Rot',
        icon: 'assets/icons/fc1052.png',
        description: 'A rotting hex: 110% ATK plus 30% ATK decay for 3 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.1 },
          { type: 'dot', pct: 0.3, turns: 3 },
        ],
      },
    ],
    passive: {
      name: 'Marsh Power',
      icon: 'assets/icons/fc1093.png',
      description: '+15% DoT damage and +10% debuff accuracy.',
      hooks: { dotBoostAdd: 0.15, accuracyAdd: 0.10 },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Weed Blind: +15% ATK while in a back hex.',
    },
  },

  snake_shieldscale: {
    id: 'snake_shieldscale',
    element: 'fire',
    name: 'Snake Shieldscale',
    title: 'Ember Bulwark',
    rarity: 2,
    stats: { hp: 1020, atk: 116, def: 92, speed: 88 },
    tint: { body: '#8a3a2a', helm: '#a85a3a', weapon: '#d8d8e0', shield: '#c88a3a', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakeshieldscaleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'scale_bash', name: 'Scale Bash',
        icon: 'assets/icons/fc854.png',
        description: 'Bash for 92% ATK and shrug behind the scales: takes 5% less damage until next turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.92 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.95, turns: 1 },
        ],
      },
      {
        id: 'shell_slam', name: 'Shell Slam',
        icon: 'assets/icons/fc1476.png',
        description: 'A ringing slam: 128% ATK that drains 12% turn meter.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.28 },
          { type: 'turnMeter', amount: -0.12 },
        ],
      },
      {
        id: 'molten_carapace', name: 'Molten Carapace',
        icon: 'assets/icons/fc855.png',
        description: 'Glow white-hot: takes 30% less damage and regenerates 3% max HP for 2 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.7, turns: 2 },
          { type: 'hot', pct: 0.03, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Heatproof Scales',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 20% less damage while holding the center hex.',
      hooks: {
        damageTakenMult(unit) {
          return unit.slot && unit.slot.position === POSITION.CENTER ? 0.8 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Hearthstone: +15% DEF while in the center hex.',
    },
  },

  snake_venomsmith: {
    id: 'snake_venomsmith',
    element: 'water',
    name: 'Snake Venomsmith',
    title: 'Artisan of Agony',
    rarity: 2,
    stats: { hp: 870, atk: 130, def: 70, speed: 98 },
    tint: { body: '#5a7a3a', helm: '#7a9a4a', weapon: '#a8e85a', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakevenomsmithidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'toxin_dart', name: 'Toxin Dart',
        icon: 'assets/icons/fc981.png',
        description: 'A coated dart: 70% ATK plus 28% ATK venom for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.7 },
          { type: 'dot', pct: 0.28, turns: 1 },
        ],
      },
      {
        id: 'coat_blades', name: 'Coat Blades',
        icon: 'assets/icons/fc869.png',
        description: 'Pass out envenomed edges: ALL allies gain +15% ATK for 2 turns.',
        cooldown: 4, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.15, turns: 2 },
        ],
      },
      {
        id: 'overdose', name: 'Overdose',
        icon: 'assets/icons/fc1093.png',
        description: 'Trigger the toxins: 90% ATK — 120% more against poisoned prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9, bonusVs: { kind: 'dot', mult: 2.2 } },
        ],
      },
    ],
    passive: {
      name: 'Leaky Vials',
      icon: 'assets/icons/fc863.png',
      description: 'At turn start, a random enemy suffers a small poison (5% of his ATK for 1 turn).',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const amount = Math.max(1, Math.round(unit.effectiveStat('atk') * 0.05));
          target.addStatusEffect({ kind: 'dot', amount, turns: 1 });
          return null; // silent — small rolling poison
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Workbench: +12% ATK while in a back hex.',
    },
  },

  snake_oracle: {
    id: 'snake_oracle',
    element: 'wind',
    name: 'Snake Oracle',
    title: 'Reader of Sheddings',
    rarity: 2,
    stats: { hp: 860, atk: 126, def: 72, speed: 103 },
    tint: { body: '#8a8ab8', helm: '#a8a8d8', weapon: '#e8e8f8', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakeoracleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'portent_bolt', name: 'Portent Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'A foreseen strike: 94% ATK and +15% crit damage for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.94 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critDamage', add: 0.15, turns: 1 },
        ],
      },
      {
        id: 'foretell_doom', name: 'Foretell Doom',
        icon: 'assets/icons/fc862.png',
        description: 'Name the hour: the target takes +35% damage for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'damageTaken', mult: 1.35, turns: 1 },
        ],
      },
      {
        id: 'rewrite_fate', name: 'Rewrite Fate',
        icon: 'assets/icons/fc855.png',
        description: 'Unwind misfortune: cleanses ALL allies and grants 10% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'cleanse' },
          { type: 'turnMeter', amount: 0.1 },
        ],
      },
    ],
    passive: {
      name: 'Glimpse Ahead',
      icon: 'assets/icons/fc882.png',
      description: '+15% chance to dodge while above half HP.',
      hooks: {
        dodgeAdd(unit) {
          return unit.hp / unit.maxHp > 0.5 ? 0.15 : 0;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.15,
      description: 'Sheltered Sight: +15% DEF while in a back hex.',
    },
  },

  snake_pitfighter: {
    id: 'snake_pitfighter',
    element: 'fire',
    name: 'Snake Pitfighter',
    title: 'Champion of the Sand Pit',
    rarity: 2,
    stats: { hp: 940, atk: 136, def: 72, speed: 101 },
    tint: { body: '#7a4a4a', helm: '#9a6a5a', weapon: '#c8c0b0', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakepitfighteridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'pit_jab', name: 'Pit Jab',
        icon: 'assets/icons/fc663.png',
        description: 'A dirty jab: 103% ATK — 20% more against debuffed foes.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.03, bonusVs: { kind: 'debuff', mult: 1.2 } },
        ],
      },
      {
        id: 'dirty_handful', name: 'Dirty Handful',
        icon: 'assets/icons/fc1084.png',
        description: 'Sand in the eyes: 115% ATK and -8% crit chance for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.15 },
          { type: 'debuff', stat: 'critChance', add: -0.08, turns: 2 },
        ],
      },
      {
        id: 'pit_finish', name: 'Pit Finish',
        icon: 'assets/icons/fc734.png',
        description: 'End it: 155% ATK — 50% more against exposed (vulnerability-marked) foes.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.55, bonusVs: { stat: 'damageTaken', mult: 1.5 } },
        ],
      },
    ],
    passive: {
      name: 'Scrapper\'s Fury',
      icon: 'assets/icons/fc867.png',
      description: 'Gains +8% ATK and +4% SPD for 1 turn at each turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.08, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.04, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Pit Footing: +12% ATK while in a front hex.',
    },
  },

  snake_basilisk: {
    id: 'snake_basilisk',
    element: 'fire',
    name: 'Snake Basilisk',
    title: 'The Widowing Gaze',
    rarity: 3,
    stats: { hp: 1150, atk: 176, def: 88, speed: 103 },
    tint: { body: '#6a6a3a', helm: '#8a8a4a', weapon: '#e8e86a', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakebasiliskidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'petrifying_gaze', name: 'Petrifying Gaze',
        icon: 'assets/icons/fc1084.png',
        description: 'A stony stare: 88% ATK that drains 12% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.88 },
          { type: 'turnMeter', amount: -0.12 },
        ],
      },
      {
        id: 'stone_stare', name: 'Stone Stare',
        icon: 'assets/icons/fc862.png',
        description: 'Flesh stiffens: the target loses 30% SPD and 10% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'speed', mult: 0.7, turns: 2 },
          { type: 'debuff', stat: 'atk', mult: 0.9, turns: 2 },
        ],
      },
      {
        id: 'gorgons_wrath', name: 'Gorgon\'s Wrath',
        icon: 'assets/icons/fc1044.png',
        description: 'Shatter the statue: 180% ATK and the target takes +20% damage for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.8 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.2, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Stonescale',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 5% less damage and +15% debuff resistance.',
      hooks: {
        damageTakenMult() { return 0.95; },
        resistanceAdd: 0.15,
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.15,
      description: 'Plinth: +15% ATK while in the center hex.',
    },
  },

  snake_leviathan: {
    id: 'snake_leviathan',
    element: 'water',
    name: 'Snake Leviathan',
    title: 'Terror of the Drowned Road',
    rarity: 3,
    stats: { hp: 1200, atk: 168, def: 90, speed: 100 },
    tint: { body: '#2a4a6a', helm: '#3a6a8a', weapon: '#7ac8e8', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakeleviathanidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'tide_fang', name: 'Tide Fang',
        icon: 'assets/icons/fc819.png',
        description: 'Bite and tail-lash: 95% then 45% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'damage', mult: 0.45 },
        ],
      },
      {
        id: 'whirlpool_coil', name: 'Whirlpool Coil',
        icon: 'assets/icons/fc800.png',
        description: 'Drag ALL enemies under: 65% ATK and -8% turn meter.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.65 },
          { type: 'turnMeter', amount: -0.08 },
        ],
      },
      {
        id: 'leviathan_crash', name: 'Leviathan Crash',
        icon: 'assets/icons/fc1622.png',
        description: 'Fall like a tide wall: 250% ATK.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.5 },
        ],
      },
    ],
    passive: {
      name: 'Crushing Depths',
      icon: 'assets/icons/fc863.png',
      description: 'Preys on the exhausted: +25% damage to enemies below 25% turn meter.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.turnMeter < CONFIG.TURN_METER_MAX * 0.25 ? 1.25 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.15,
      description: 'Riverbed Anchor: +15% ATK while in a front hex.',
    },
  },

  snake_plaguebearer: {
    id: 'snake_plaguebearer',
    element: 'wind',
    name: 'Snake Plaguebearer',
    title: 'Gift That Keeps Giving',
    rarity: 3,
    stats: { hp: 1090, atk: 178, def: 80, speed: 105 },
    tint: { body: '#5a6a4a', helm: '#7a8a5a', weapon: '#a8c87a', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakeplaguebeareridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'plague_touch', name: 'Plague Touch',
        icon: 'assets/icons/fc1093.png',
        description: 'A mere touch: 20% ATK sickness per turn for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'dot', pct: 0.2, turns: 2 },
        ],
      },
      {
        id: 'spreading_sickness', name: 'Spreading Sickness',
        icon: 'assets/icons/fc1084.png',
        description: 'The plague leaps: ALL enemies sicken for 15% ATK per turn for 2 turns.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'dot', pct: 0.15, turns: 2 },
        ],
      },
      {
        id: 'pandemic', name: 'Pandemic',
        icon: 'assets/icons/fc1052.png',
        description: 'Ripen the plague: 60% ATK to ALL enemies — 80% more against the diseased.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.6, bonusVs: { kind: 'dot', mult: 1.8 } },
        ],
      },
    ],
    passive: {
      name: 'Virulent Strains',
      icon: 'assets/icons/fc1003.png',
      description: '+15% debuff accuracy and +15% DoT damage.',
      hooks: { accuracyAdd: 0.15, dotBoostAdd: 0.15 },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Quarantine Distance: +15% ATK while in a back hex.',
    },
  },

  snake_sandviper: {
    id: 'snake_sandviper',
    element: 'fire',
    name: 'Snake Sandviper',
    title: 'Death Under the Dune',
    rarity: 3,
    stats: { hp: 1070, atk: 184, def: 78, speed: 108 },
    tint: { body: '#b8904a', helm: '#d8b06a', weapon: '#e8d8a8', skin: '#9ab87a' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakesandviperidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'sidewind_strike', name: 'Sidewind Strike',
        icon: 'assets/icons/fc1447.png',
        description: 'A sidewinding cut: 120% ATK and +6% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.06, turns: 1 },
        ],
      },
      {
        id: 'ambush_from_below', name: 'Ambush from Below',
        icon: 'assets/icons/fc825.png',
        description: 'Erupt from the sand: 165% ATK — 25% more against debuffed prey.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.65, bonusVs: { kind: 'debuff', mult: 1.25 } },
        ],
      },
      {
        id: 'sand_burial', name: 'Sand Burial',
        icon: 'assets/icons/fc767.png',
        description: 'Drag them under: 140% ATK, -20% SPD for 2 turns and -15% turn meter.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.4 },
          { type: 'debuff', stat: 'speed', mult: 0.8, turns: 2 },
          { type: 'turnMeter', amount: -0.15 },
        ],
      },
    ],
    passive: {
      name: 'Desert Patience',
      icon: 'assets/icons/fc882.png',
      description: 'Outpaces prey: +20% damage to enemies slower than him.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && unit.effectiveStat('speed') > target.effectiveStat('speed') ? 1.2 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.15,
      description: 'Dune Blind: +15% damage dealt from a back hex.',
    },
  },

  // ---- Wolf cohort (the Snowfield) ----------------------------------------
  // Procedural placeholder art renders until real idle sheets land at the
  // conventional flat paths (assets/heroes/wolf<role>idle.png).

  wolf_pup: {
    id: 'wolf_pup',
    element: 'wind',
    name: 'Wolf Pup',
    title: 'All Teeth, No Plan',
    rarity: 1,
    stats: { hp: 720, atk: 108, def: 58, speed: 102 },
    tint: { body: '#8a8a9a', helm: '#a8a8b8', weapon: '#c8c0b0', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfpupidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'nip', name: 'Nip',
        icon: 'assets/icons/fc1444.png',
        description: 'An eager nip: 100% ATK, bouncing back with 4% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.04 },
        ],
      },
      {
        id: 'playful_pounce', name: 'Playful Pounce',
        icon: 'assets/icons/fc825.png',
        description: 'A pounce that lands harder than intended: 133% ATK with a 15% chance to STUN for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.33 },
          { type: 'stun', chance: 0.15, turns: 1 },
        ],
      },
      {
        id: 'yipping_fit', name: 'Yipping Fit',
        icon: 'assets/icons/fc1084.png',
        description: 'An unbearable racket: ALL enemies lose 6% ATK for 1 turn and 3% turn meter.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'atk', mult: 0.94, turns: 1 },
          { type: 'turnMeter', amount: -0.03 },
        ],
      },
    ],
    passive: {
      name: 'Beginner\'s Luck',
      icon: 'assets/icons/fc882.png',
      description: '+5% Stun chance on single-target attacks.',
      hooks: { stunAdd: 0.05 },
    },
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.1,
      description: 'Zoomies: +10% SPD while in a back hex.',
    },
  },

  wolf_tracker: {
    id: 'wolf_tracker',
    element: 'water',
    name: 'Wolf Tracker',
    title: 'Nose Like a Verdict',
    rarity: 1,
    stats: { hp: 780, atk: 112, def: 64, speed: 98 },
    tint: { body: '#6a7a8a', helm: '#8a9aa8', weapon: '#b8a878', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolftrackeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'track_and_bite', name: 'Track and Bite',
        icon: 'assets/icons/fc1447.png',
        description: 'A studied bite: 98% ATK that exposes the prey (+8% damage taken, 1 turn).',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.98 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.08, turns: 1 },
        ],
      },
      {
        id: 'pinning_leap', name: 'Pinning Leap',
        icon: 'assets/icons/fc763.png',
        description: 'Leap and pin: 135% ATK with a 25% chance to STUN for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.35 },
          { type: 'stun', chance: 0.25, turns: 1 },
        ],
      },
      {
        id: 'pack_signal', name: 'Pack Signal',
        icon: 'assets/icons/fc868.png',
        description: 'Signal the pack: ALL allies gain +5% crit chance for 1 turn and 8% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'critChance', add: 0.05, turns: 1 },
          { type: 'turnMeter', amount: 0.08 },
        ],
      },
    ],
    passive: {
      name: 'Scent of Blood',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 15% extra damage to enemies below 35% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.35 ? 1.15 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Trailhead: +12% ATK while in a back hex.',
    },
  },

  wolf_howler: {
    id: 'wolf_howler',
    element: 'wind',
    name: 'Wolf Howler',
    title: 'Heard Three Valleys Over',
    rarity: 1,
    stats: { hp: 760, atk: 106, def: 62, speed: 100 },
    tint: { body: '#5a6a7a', helm: '#7a8a9a', weapon: '#e8d8a8', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfhowleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bark', name: 'Bark',
        icon: 'assets/icons/fc1003.png',
        description: 'A sharp bark: 90% ATK and -4% crit chance for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'debuff', stat: 'critChance', add: -0.04, turns: 1 },
        ],
      },
      {
        id: 'piercing_howl', name: 'Piercing Howl',
        icon: 'assets/icons/fc1084.png',
        description: 'A howl that rattles bone: ALL enemies lose 7% DEF and 3% SPD for 1 turn.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'def', mult: 0.93, turns: 1 },
          { type: 'debuff', stat: 'speed', mult: 0.97, turns: 1 },
        ],
      },
      {
        id: 'moonsong', name: 'Moonsong',
        icon: 'assets/icons/fc869.png',
        description: 'The old song: ALL allies gain +8% ATK for 2 turns and heal 20% of ATK.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.08, turns: 2 },
          { type: 'heal', mult: 0.2 },
        ],
      },
    ],
    passive: {
      name: 'Carrying Voice',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, a random ally gains +5% ATK for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          const ally = allies[Math.floor(Math.random() * allies.length)];
          ally.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.05, turns: 1 });
          return null; // silent — small rolling encouragement
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.1,
      description: 'Echo Point: +10% ATK while in the center hex.',
    },
  },

  wolf_icefang: {
    id: 'wolf_icefang',
    element: 'water',
    name: 'Wolf Icefang',
    title: 'Bite First, Thaw Never',
    rarity: 1,
    stats: { hp: 800, atk: 114, def: 66, speed: 96 },
    tint: { body: '#7a9ab8', helm: '#9abad8', weapon: '#c8e8f8', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolficefangidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'frost_bite', name: 'Frost Bite',
        icon: 'assets/icons/fc1444.png',
        description: 'An icy bite: 95% ATK and -5% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'debuff', stat: 'speed', mult: 0.95, turns: 1 },
        ],
      },
      {
        id: 'icicle_crunch', name: 'Icicle Crunch',
        icon: 'assets/icons/fc734.png',
        description: 'Crunch through the chill: 145% ATK — 30% more against slowed or hasted prey.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.45, bonusVs: { stat: 'speed', mult: 1.3 } },
        ],
      },
      {
        id: 'cold_snap', name: 'Cold Snap',
        icon: 'assets/icons/fc1050.png',
        description: 'A sudden freeze: 55% ATK to ALL enemies and -10% SPD for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.55 },
          { type: 'debuff', stat: 'speed', mult: 0.9, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Cold Blood',
      icon: 'assets/icons/fc856.png',
      description: '+15% debuff resistance and +5% debuff accuracy.',
      hooks: { resistanceAdd: 0.15, accuracyAdd: 0.05 },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.12,
      description: 'Ice Stance: +12% DEF while in a front hex.',
    },
  },

  wolf_snowstalker: {
    id: 'wolf_snowstalker',
    element: 'wind',
    name: 'Wolf Snowstalker',
    title: 'The Drift That Moves',
    rarity: 1,
    stats: { hp: 750, atk: 116, def: 60, speed: 101 },
    tint: { body: '#e8e8f0', helm: '#c8c8d8', weapon: '#a8a8b8', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfsnowstalkeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'silent_step', name: 'Silent Step',
        icon: 'assets/icons/fc1447.png',
        description: 'A strike from nowhere: 119% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.19 },
        ],
      },
      {
        id: 'white_ambush', name: 'White Ambush',
        icon: 'assets/icons/fc825.png',
        description: 'Erupt from the snow: 160% ATK with a 20% chance to STUN for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.6 },
          { type: 'stun', chance: 0.2, turns: 1 },
        ],
      },
      {
        id: 'vanish_in_the_drift', name: 'Vanish in the Drift',
        icon: 'assets/icons/fc862.png',
        description: 'Become the snowfield: takes 35% less damage and +20% SPD for 1 turn.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.65, turns: 1 },
          { type: 'buff', stat: 'speed', mult: 1.2, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Snowblind',
      icon: 'assets/icons/fc882.png',
      description: 'Deals 25% extra damage to enemies with lowered crit chance.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'debuff' && fx.stat === 'critChance') ? 1.25 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.12,
      description: 'Whiteout Cover: +12% damage dealt from a back hex.',
    },
  },

  wolf_sledpuller: {
    id: 'wolf_sledpuller',
    element: 'water',
    name: 'Wolf Sledpuller',
    title: 'A Thousand Miles of Stubborn',
    rarity: 1,
    stats: { hp: 920, atk: 102, def: 80, speed: 88 },
    tint: { body: '#6a5a4a', helm: '#8a7a5a', weapon: '#c8b898', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfsledpulleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'harness_slam', name: 'Harness Slam',
        icon: 'assets/icons/fc1471.png',
        description: 'A harness-weighted slam: 100% ATK, braced: +8% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.08, turns: 1 },
        ],
      },
      {
        id: 'unstoppable_pull', name: 'Unstoppable Pull',
        icon: 'assets/icons/fc724.png',
        description: 'Drag the line through a hex row: 95% ATK and -5% turn meter.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
      {
        id: 'endurance_of_the_team', name: 'Endurance of the Team',
        icon: 'assets/icons/fc1112.png',
        description: 'Set the pace: ALL allies regenerate 2.5% of his max HP for 3 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'hot', pct: 0.025, turns: 3 },
        ],
      },
    ],
    passive: {
      name: 'Beast of Burden',
      icon: 'assets/icons/fc856.png',
      description: 'At turn start while below half HP, digs deep: +10% DEF for 2 turns.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp >= 0.5) return null;
          unit.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.1, turns: 2 });
          return null; // silent — quiet endurance
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Harness Point: +15% DEF while in a front hex.',
    },
  },

  wolf_cavehunter: {
    id: 'wolf_cavehunter',
    element: 'fire',
    name: 'Wolf Cavehunter',
    title: 'Eyes That Own the Dark',
    rarity: 1,
    stats: { hp: 790, atk: 115, def: 63, speed: 97 },
    tint: { body: '#4a3a3a', helm: '#6a5a4a', weapon: '#c8c0b0', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfcavehunteridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'darkfang', name: 'Darkfang',
        icon: 'assets/icons/fc1444.png',
        description: 'A bite from the black: 105% ATK plus a 10% ATK bleed for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.05 },
          { type: 'dot', pct: 0.1, turns: 1 },
        ],
      },
      {
        id: 'echo_pounce', name: 'Echo Pounce',
        icon: 'assets/icons/fc763.png',
        description: 'Pounce off the cave wall: 140% ATK, rebounding with 6% turn meter.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.4 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.06 },
        ],
      },
      {
        id: 'rumbling_howl', name: 'Rumbling Howl',
        icon: 'assets/icons/fc767.png',
        description: 'Shake the cavern: 90% ATK to a hex row with a 12% chance to STUN each for 1 turn.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'stun', chance: 0.12, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Night Eyes',
      icon: 'assets/icons/fc862.png',
      description: '+12% chance to dodge while below half HP.',
      hooks: {
        dodgeAdd(unit) {
          return unit.alive && unit.hp / unit.maxHp < 0.5 ? 0.12 : 0;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Cave Mouth: +12% ATK while in a back hex.',
    },
  },

  wolf_ashpelt: {
    id: 'wolf_ashpelt',
    element: 'fire',
    name: 'Wolf Ashpelt',
    title: 'Walked Out of the Wildfire',
    rarity: 1,
    stats: { hp: 770, atk: 117, def: 61, speed: 99 },
    tint: { body: '#5a4a4a', helm: '#8a5a3a', weapon: '#e8843a', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfashpeltidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cinder_snap', name: 'Cinder Snap',
        icon: 'assets/icons/fc981.png',
        description: 'A smoldering snap: 90% ATK plus a 14% ATK burn for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'dot', pct: 0.14, turns: 1 },
        ],
      },
      {
        id: 'burning_lope', name: 'Burning Lope',
        icon: 'assets/icons/fc744.png',
        description: 'A blazing run-through: 130% ATK, trailing sparks: +12% SPD for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.12, turns: 1 },
        ],
      },
      {
        id: 'wildfire_ring', name: 'Wildfire Ring',
        icon: 'assets/icons/fc1044.png',
        description: 'Circle them in flame: 50% ATK to ALL enemies plus an 18% ATK burn for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.5 },
          { type: 'dot', pct: 0.18, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Ashen Coat',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 15% less damage while poisoned or debuffed.',
      hooks: {
        damageTakenMult(unit) {
          return unit.statusEffects.some((fx) => fx.kind === 'dot' || fx.kind === 'debuff') ? 0.85 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Cinder Bed: +12% ATK while in the center hex.',
    },
  },

  wolf_ridgeback: {
    id: 'wolf_ridgeback',
    element: 'fire',
    name: 'Wolf Ridgeback',
    title: 'The Hill Fights Back',
    rarity: 1,
    stats: { hp: 880, atk: 110, def: 74, speed: 91 },
    tint: { body: '#7a5a4a', helm: '#9a7a5a', weapon: '#c8c0b0', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfridgebackidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'ridge_charge', name: 'Ridge Charge',
        icon: 'assets/icons/fc1447.png',
        description: 'A downhill charge for 121% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.21 },
        ],
      },
      {
        id: 'bristle', name: 'Bristle',
        icon: 'assets/icons/fc854.png',
        description: 'Hackles up: +30% DEF and takes 10% less damage for 1 turn.',
        cooldown: 3, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.3, turns: 1 },
          { type: 'buff', stat: 'damageTaken', mult: 0.9, turns: 1 },
        ],
      },
      {
        id: 'backbreaker', name: 'Backbreaker',
        icon: 'assets/icons/fc767.png',
        description: 'Break them over the ridge: 170% ATK and -15% turn meter.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.7 },
          { type: 'turnMeter', amount: -0.15 },
        ],
      },
    ],
    passive: {
      name: 'Bristled Hide',
      icon: 'assets/icons/fc867.png',
      description: 'Takes 10% less damage while above 60% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.hp / unit.maxHp > 0.6 ? 0.9 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'High Ground Charge: +12% ATK while in a front hex.',
    },
  },

  wolf_fangknight: {
    id: 'wolf_fangknight',
    element: 'water',
    name: 'Wolf Fangknight',
    title: 'Sworn to the Frozen Gate',
    rarity: 2,
    stats: { hp: 1020, atk: 120, def: 94, speed: 90 },
    tint: { body: '#5a6a8a', helm: '#8a9ab8', weapon: '#d8d8e0', shield: '#7a8aa8', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolffangknightidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'sworn_fang', name: 'Sworn Fang',
        icon: 'assets/icons/fc1471.png',
        description: 'A disciplined bite: 97% ATK behind the shield: takes 7% less damage until next turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.97 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.93, turns: 1 },
        ],
      },
      {
        id: 'shield_rush', name: 'Shield Rush',
        icon: 'assets/icons/fc854.png',
        description: 'A shield-first rush: 132% ATK with a 20% chance to STUN for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.32 },
          { type: 'stun', chance: 0.2, turns: 1 },
        ],
      },
      {
        id: 'winter_vigil', name: 'Winter Vigil',
        icon: 'assets/icons/fc855.png',
        description: 'Stand the long watch: front-hex allies gain +10% DEF and 3% max HP regen for 2 turns.',
        cooldown: 5, targeting: 'front-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.1, turns: 2 },
          { type: 'hot', pct: 0.03, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Oath of Winter',
      icon: 'assets/icons/fc856.png',
      description: '+20% debuff resistance and takes 3% less damage.',
      hooks: {
        resistanceAdd: 0.20,
        damageTakenMult() { return 0.97; },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.18,
      description: 'Gate Stance: +18% DEF while in a front hex.',
    },
  },

  wolf_galecaller: {
    id: 'wolf_galecaller',
    element: 'wind',
    name: 'Wolf Galecaller',
    title: 'The Storm Comes When Called',
    rarity: 2,
    stats: { hp: 860, atk: 133, def: 68, speed: 105 },
    tint: { body: '#6a8a9a', helm: '#8aaab8', weapon: '#e8e8f8', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfgalecalleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'gale_snap', name: 'Gale Snap',
        icon: 'assets/icons/fc1030.png',
        description: 'A wind-backed snap: 89% ATK that drains 5% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.89 },
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
      {
        id: 'shredding_wind', name: 'Shredding Wind',
        icon: 'assets/icons/fc724.png',
        description: 'A cutting gale through a hex row: 100% ATK and -8% ATK for 1 turn.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'debuff', stat: 'atk', mult: 0.92, turns: 1 },
        ],
      },
      {
        id: 'stormfront', name: 'Stormfront',
        icon: 'assets/icons/fc807.png',
        description: 'The front rolls in: 68% ATK to ALL enemies and -5% crit chance for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.68 },
          { type: 'debuff', stat: 'critChance', add: -0.05, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Static Ruff',
      icon: 'assets/icons/fc882.png',
      description: 'At turn start, static discharge drains 2% turn meter from ALL enemies.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          for (const e of enemies) {
            e.turnMeter = Math.max(0, e.turnMeter - CONFIG.TURN_METER_MAX * 0.02);
          }
          return null; // silent — small rolling drag
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Windward: +12% ATK while in a back hex.',
    },
  },

  wolf_frostshaman: {
    id: 'wolf_frostshaman',
    element: 'water',
    name: 'Wolf Frostshaman',
    title: 'Speaks Winter Fluently',
    rarity: 2,
    stats: { hp: 880, atk: 126, def: 72, speed: 99 },
    tint: { body: '#4a6a8a', helm: '#7a9ab8', weapon: '#a8d8e8', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolffrostshamanidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rime_bolt', name: 'Rime Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'A rimed bolt: 86% ATK that mends the caster for 10% of ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.86 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.1 },
        ],
      },
      {
        id: 'glacial_mend', name: 'Glacial Mend',
        icon: 'assets/icons/fc1112.png',
        description: 'Pack a wound with clean ice: heals an ally 13% of his max HP and +8% SPD for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.13 },
          { type: 'buff', stat: 'speed', mult: 1.08, turns: 2 },
        ],
      },
      {
        id: 'whiteout', name: 'Whiteout',
        icon: 'assets/icons/fc1084.png',
        description: 'A blinding white: ALL enemies lose 15% SPD and 5% ATK for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'speed', mult: 0.85, turns: 1 },
          { type: 'debuff', stat: 'atk', mult: 0.95, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Spirit of the North',
      icon: 'assets/icons/fc854.png',
      description: '+25% debuff resistance.',
      hooks: { resistanceAdd: 0.25 },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.12,
      description: 'Totem Ground: +12% DEF while in a back hex.',
    },
  },

  wolf_moonblade: {
    id: 'wolf_moonblade',
    element: 'dark',
    name: 'Wolf Moonblade',
    title: 'Sharpened on the New Moon',
    rarity: 2,
    stats: { hp: 830, atk: 140, def: 62, speed: 112 },
    tint: { body: '#2a2a3a', helm: '#4a4a6a', weapon: '#b8b0c8', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfmoonbladeidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'crescent_cut', name: 'Crescent Cut',
        icon: 'assets/icons/fc1587.png',
        description: 'A crescent stroke: 110% ATK — 15% more against debuffed prey.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.1, bonusVs: { kind: 'debuff', mult: 1.15 } },
        ],
      },
      {
        id: 'lunar_arc', name: 'Lunar Arc',
        icon: 'assets/icons/fc728.png',
        description: 'An arcing moonlit cut: 155% ATK, focusing: +12% crit chance for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.55 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.12, turns: 1 },
        ],
      },
      {
        id: 'eclipse_fang', name: 'Eclipse Fang',
        icon: 'assets/icons/fc734.png',
        description: 'The moon goes out: 200% ATK with a 35% chance to STUN for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.0 },
          { type: 'stun', chance: 0.35, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Dark of the Moon',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 25% extra damage to stunned enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.stat === 'stun') ? 1.25 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.15,
      description: 'Moonshadow: +15% damage dealt from a back hex.',
    },
  },

  wolf_packmother: {
    id: 'wolf_packmother',
    element: 'water',
    name: 'Wolf Packmother',
    title: 'The Den Holds',
    rarity: 2,
    stats: { hp: 950, atk: 118, def: 82, speed: 95 },
    tint: { body: '#8a7a6a', helm: '#a89a8a', weapon: '#c8b898', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfpackmotheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'matriarchs_snap', name: 'Matriarch\'s Snap',
        icon: 'assets/icons/fc1447.png',
        description: 'A corrective snap for 94% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.94 },
        ],
      },
      {
        id: 'nurture', name: 'Nurture',
        icon: 'assets/icons/fc1112.png',
        description: 'See to a packmate: heals 125% of ATK and +10% ATK for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.25 },
          { type: 'buff', stat: 'atk', mult: 1.1, turns: 2 },
        ],
      },
      {
        id: 'den_call', name: 'Den Call',
        icon: 'assets/icons/fc869.png',
        description: 'Call them home: ALL allies heal 55% of ATK and gain +10% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.55 },
          { type: 'buff', stat: 'def', mult: 1.1, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Mother\'s Vigilance',
      icon: 'assets/icons/fc1093.png',
      description: 'Whenever an ally is healed, that ally also gains +4% DEF for 1 turn.',
      hooks: {
        onAllyHealed(unit, healedUnit) {
          if (healedUnit === unit) return;
          healedUnit.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.04, turns: 1 });
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Den Door: +15% DEF while in the center hex.',
    },
  },

  wolf_dervish: {
    id: 'wolf_dervish',
    element: 'wind',
    name: 'Wolf Dervish',
    title: 'Spins Faster Than Regret',
    rarity: 2,
    stats: { hp: 870, atk: 134, def: 66, speed: 108 },
    tint: { body: '#9a8a6a', helm: '#b8a87a', weapon: '#d8d8e0', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfdervishidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'whirl_slash', name: 'Whirl Slash',
        icon: 'assets/icons/fc729.png',
        description: 'Two spinning cuts for 58% ATK each.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.58 },
          { type: 'damage', mult: 0.58 },
        ],
      },
      {
        id: 'cyclone_of_fangs', name: 'Cyclone of Fangs',
        icon: 'assets/icons/fc744.png',
        description: 'A spinning pass through a hex row: two hits of 60% ATK.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.6 },
          { type: 'damage', mult: 0.6 },
        ],
      },
      {
        id: 'thousand_cuts', name: 'Thousand Cuts',
        icon: 'assets/icons/fc723.png',
        description: 'A blur of steel: three cuts of 68% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.68 },
          { type: 'damage', mult: 0.68 },
          { type: 'damage', mult: 0.68 },
        ],
      },
    ],
    passive: {
      name: 'Momentum Spiral',
      icon: 'assets/icons/fc882.png',
      description: 'Gains +6% SPD and +6% ATK for 1 turn at each turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.06, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.06, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'speed', mult: 1.12,
      description: 'Spinning Floor: +12% SPD while in the center hex.',
    },
  },

  wolf_gnawbone: {
    id: 'wolf_gnawbone',
    element: 'fire',
    name: 'Wolf Gnawbone',
    title: 'Nothing Wasted',
    rarity: 2,
    stats: { hp: 940, atk: 136, def: 74, speed: 97 },
    tint: { body: '#6a5a5a', helm: '#8a7a6a', weapon: '#e8e0d8', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfgnawboneidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bone_crack', name: 'Bone Crack',
        icon: 'assets/icons/fc1476.png',
        description: 'A marrow-deep bite for 123% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.23 },
        ],
      },
      {
        id: 'marrow_feast', name: 'Marrow Feast',
        icon: 'assets/icons/fc734.png',
        description: 'Feed on the fight: 145% ATK, healing himself for 35% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.45 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.35 },
        ],
      },
      {
        id: 'splintering_bite', name: 'Splintering Bite',
        icon: 'assets/icons/fc1472.png',
        description: 'Splinter their guard: 165% ATK and -15% DEF for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.65 },
          { type: 'debuff', stat: 'def', mult: 0.85, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Bone Deep',
      icon: 'assets/icons/fc856.png',
      description: 'Old strength: deals 6% more and takes 4% less damage.',
      hooks: {
        damageDealtMult() { return 1.06; },
        damageTakenMult() { return 0.96; },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Boneyard Footing: +12% ATK while in a front hex.',
    },
  },

  wolf_jawlock: {
    id: 'wolf_jawlock',
    element: 'fire',
    name: 'Wolf Jawlock',
    title: 'Lets Go of Nothing',
    rarity: 2,
    stats: { hp: 980, atk: 128, def: 80, speed: 94 },
    tint: { body: '#7a4a3a', helm: '#9a6a4a', weapon: '#c8c0b0', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfjawlockidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'lock_jaw', name: 'Lock Jaw',
        icon: 'assets/icons/fc663.png',
        description: 'A clamping bite: 96% ATK with an 8% chance to STUN for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.96 },
          { type: 'stun', chance: 0.08, turns: 1 },
        ],
      },
      {
        id: 'vice_bite', name: 'Vice Bite',
        icon: 'assets/icons/fc762.png',
        description: 'The jaws close: 150% ATK with a 30% chance to STUN for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.5 },
          { type: 'stun', chance: 0.3, turns: 1 },
        ],
      },
      {
        id: 'hold_down', name: 'Hold Down',
        icon: 'assets/icons/fc767.png',
        description: 'Pin them flat: 120% ATK and -30% turn meter.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'turnMeter', amount: -0.3 },
        ],
      },
    ],
    passive: {
      name: 'Locked Jaws',
      icon: 'assets/icons/fc867.png',
      description: '+10% Stun chance on single-target attacks.',
      hooks: { stunAdd: 0.10 },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.12,
      description: 'Set Stance: +12% DEF while in a front hex.',
    },
  },

  wolf_outrider: {
    id: 'wolf_outrider',
    element: 'wind',
    name: 'Wolf Outrider',
    title: 'Farther Ahead Than You Think',
    rarity: 2,
    stats: { hp: 890, atk: 131, def: 70, speed: 109 },
    tint: { body: '#5a7a5a', helm: '#7a9a6a', weapon: '#c8c0b0', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfoutrideridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'flank_slash', name: 'Flank Slash',
        icon: 'assets/icons/fc1447.png',
        description: 'A passing cut: 102% ATK, wheeling away: +4% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.02 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.04, turns: 1 },
        ],
      },
      {
        id: 'ride_by', name: 'Ride-By',
        icon: 'assets/icons/fc825.png',
        description: 'A slashing pass: 138% ATK, carrying 10% turn meter through.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.38 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.1 },
        ],
      },
      {
        id: 'encircle', name: 'Encircle',
        icon: 'assets/icons/fc807.png',
        description: 'Cut off every retreat: 62% ATK to ALL enemies and -6% SPD for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.62 },
          { type: 'debuff', stat: 'speed', mult: 0.94, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Open Steppe',
      icon: 'assets/icons/fc868.png',
      description: 'Gains +10% SPD and +10% crit damage for 1 turn at each turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.1, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.10, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.12,
      description: 'Long Patrol: +12% SPD while in a back hex.',
    },
  },

  wolf_trapper: {
    id: 'wolf_trapper',
    element: 'water',
    name: 'Wolf Trapper',
    title: 'The Snow Hides Her Work',
    rarity: 2,
    stats: { hp: 900, atk: 129, def: 73, speed: 100 },
    tint: { body: '#8a8a7a', helm: '#a8a89a', weapon: '#a8a098', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolftrapperidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snare_toss', name: 'Snare Toss',
        icon: 'assets/icons/fc981.png',
        description: 'A weighted snare: 85% ATK and -12% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
          { type: 'debuff', stat: 'speed', mult: 0.88, turns: 1 },
        ],
      },
      {
        id: 'bear_trap', name: 'Bear Trap',
        icon: 'assets/icons/fc862.png',
        description: 'Set steel in the snow: the target takes +20% damage for 2 turns with a 25% chance to be STUNNED for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'damageTaken', mult: 1.2, turns: 2 },
          { type: 'stun', chance: 0.25, turns: 1 },
        ],
      },
      {
        id: 'spring_the_trap', name: 'Spring the Trap',
        icon: 'assets/icons/fc734.png',
        description: 'Collect the catch: 175% ATK — 45% more against exposed (vulnerability-marked) prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.75, bonusVs: { stat: 'damageTaken', mult: 1.45 } },
        ],
      },
    ],
    passive: {
      name: 'Patient Trapper',
      icon: 'assets/icons/fc863.png',
      description: '+20% debuff accuracy.',
      hooks: { accuracyAdd: 0.20 },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Trapline: +12% ATK while in a back hex.',
    },
  },

  wolf_alphafang: {
    id: 'wolf_alphafang',
    element: 'fire',
    name: 'Wolf Alphafang',
    title: 'The Question Answers Itself',
    rarity: 3,
    stats: { hp: 1170, atk: 176, def: 90, speed: 104 },
    tint: { body: '#8a3a2a', helm: '#a85a3a', weapon: '#d8d8e0', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfalphafangidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'alpha_strike', name: 'Alpha Strike',
        icon: 'assets/icons/fc1447.png',
        description: 'A ruling blow: 112% ATK with a 10% chance to STUN for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.12 },
          { type: 'stun', chance: 0.1, turns: 1 },
        ],
      },
      {
        id: 'dominate', name: 'Dominate',
        icon: 'assets/icons/fc730.png',
        description: 'Put them in their place: 150% ATK, -15% ATK for 2 turns and -5% DEF for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.5 },
          { type: 'debuff', stat: 'atk', mult: 0.85, turns: 2 },
          { type: 'debuff', stat: 'def', mult: 0.95, turns: 1 },
        ],
      },
      {
        id: 'apex_roar', name: 'Apex Roar',
        icon: 'assets/icons/fc869.png',
        description: 'The roar of the apex: 80% ATK to ALL enemies with a 15% chance to STUN each for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'stun', chance: 0.15, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Apex',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 20% extra damage while any enemy is stunned.',
      hooks: {
        damageDealtMult(unit) {
          if (typeof Battle === 'undefined' || !Battle.active) return 1;
          return Battle.active.livingUnits(unit.enemyTeam()).some((e) =>
            e.statusEffects.some((fx) => fx.stat === 'stun')) ? 1.2 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.15,
      description: 'Alpha Ground: +15% ATK while in the center hex.',
    },
  },

  wolf_winterwitch: {
    id: 'wolf_winterwitch',
    element: 'water',
    name: 'Wolf Winterwitch',
    title: 'Winter Does Her Errands',
    rarity: 3,
    stats: { hp: 1080, atk: 181, def: 80, speed: 106 },
    tint: { body: '#3a4a6a', helm: '#7a9ad8', weapon: '#a8d8f8', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfwinterwitchidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'hoarfrost_bolt', name: 'Hoarfrost Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'A creeping frost: 92% ATK and -7% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.92 },
          { type: 'debuff', stat: 'speed', mult: 0.93, turns: 1 },
        ],
      },
      {
        id: 'flash_freeze', name: 'Flash Freeze',
        icon: 'assets/icons/fc1084.png',
        description: 'Ice takes them whole: 60% ATK with a 60% chance to STUN for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.6 },
          { type: 'stun', chance: 0.6, turns: 1 },
        ],
      },
      {
        id: 'glacier_tomb', name: 'Glacier Tomb',
        icon: 'assets/icons/fc1044.png',
        description: 'Entomb them in blue ice: 220% ATK — 50% more against slowed or hasted prey.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.2, bonusVs: { stat: 'speed', mult: 1.5 } },
        ],
      },
    ],
    passive: {
      name: 'Deep Winter',
      icon: 'assets/icons/fc856.png',
      description: 'At turn start, the fastest enemy is chilled: -5% SPD for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          enemies.sort((a, b) => b.effectiveStat('speed') - a.effectiveStat('speed'));
          enemies[0].addStatusEffect({ kind: 'debuff', stat: 'speed', mult: 0.95, turns: 1 });
          return null; // silent — small rolling chill
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Frozen Court: +15% ATK while in a back hex.',
    },
  },

  wolf_thunderjaw: {
    id: 'wolf_thunderjaw',
    element: 'wind',
    name: 'Wolf Thunderjaw',
    title: 'The Sky Barks Back',
    rarity: 3,
    stats: { hp: 1140, atk: 172, def: 86, speed: 107 },
    tint: { body: '#4a4a7a', helm: '#6a6aa8', weapon: '#e8e84a', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfthunderjawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'storm_bite', name: 'Storm Bite',
        icon: 'assets/icons/fc1030.png',
        description: 'Bite and thunderclap: 100% then 30% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'damage', mult: 0.3 },
        ],
      },
      {
        id: 'thunder_lunge', name: 'Thunder Lunge',
        icon: 'assets/icons/fc763.png',
        description: 'A deafening lunge: 170% ATK with a 25% chance to STUN for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.7 },
          { type: 'stun', chance: 0.25, turns: 1 },
        ],
      },
      {
        id: 'stormbreak_howl', name: 'Stormbreak Howl',
        icon: 'assets/icons/fc807.png',
        description: 'A howl that splits clouds: 70% ATK to ALL enemies and -12% turn meter.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.7 },
          { type: 'turnMeter', amount: -0.12 },
        ],
      },
    ],
    passive: {
      name: 'Charged Fur',
      icon: 'assets/icons/fc882.png',
      description: '+8% Stun chance on single-target attacks and +4% chance for an extra turn.',
      hooks: { stunAdd: 0.08, extraTurnAdd: 0.04 },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Storm Eye: +12% ATK while in the center hex.',
    },
  },

  wolf_direhound: {
    id: 'wolf_direhound',
    element: 'fire',
    name: 'Wolf Direhound',
    title: 'Bad News Travels on Four Legs',
    rarity: 3,
    stats: { hp: 1110, atk: 178, def: 84, speed: 103 },
    tint: { body: '#3a2a2a', helm: '#5a3a3a', weapon: '#e8632a', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfdirehoundidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'hellhound_bite', name: 'Hellhound Bite',
        icon: 'assets/icons/fc981.png',
        description: 'A smoldering bite: 108% ATK plus an 11% ATK burn for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.08 },
          { type: 'dot', pct: 0.11, turns: 1 },
        ],
      },
      {
        id: 'infernal_rush', name: 'Infernal Rush',
        icon: 'assets/icons/fc744.png',
        description: 'A burning charge: 155% ATK plus a 30% ATK burn for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.55 },
          { type: 'dot', pct: 0.3, turns: 1 },
        ],
      },
      {
        id: 'immolation_howl', name: 'Immolation Howl',
        icon: 'assets/icons/fc1044.png',
        description: 'A howl of open flame: 65% ATK to ALL enemies plus a 22% ATK burn for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.65 },
          { type: 'dot', pct: 0.22, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Hellfire Pelt',
      icon: 'assets/icons/fc1093.png',
      description: '+25% DoT damage and +5% debuff accuracy.',
      hooks: { dotBoostAdd: 0.25, accuracyAdd: 0.05 },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Scorched Trail: +15% ATK while in a back hex.',
    },
  },

  wolf_glacierguard: {
    id: 'wolf_glacierguard',
    element: 'water',
    name: 'Wolf Glacierguard',
    title: 'The Ice Holds Because He Does',
    rarity: 3,
    stats: { hp: 1300, atk: 158, def: 102, speed: 86 },
    tint: { body: '#6a8aa8', helm: '#8aaac8', weapon: '#c8e8f8', shield: '#a8c8e8', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfglacierguardidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'ice_wall_bash', name: 'Ice Wall Bash',
        icon: 'assets/icons/fc854.png',
        description: 'A wall of ice and shoulder: 98% ATK, hardening: +12% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.98 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.12, turns: 1 },
        ],
      },
      {
        id: 'frozen_bulwark', name: 'Frozen Bulwark',
        icon: 'assets/icons/fc855.png',
        description: 'Raise the glacier: front-hex allies take 15% less damage and gain +10% DEF for 2 turns.',
        cooldown: 5, targeting: 'front-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.85, turns: 2 },
          { type: 'buff', stat: 'def', mult: 1.1, turns: 2 },
        ],
      },
      {
        id: 'permafrost_slam', name: 'Permafrost Slam',
        icon: 'assets/icons/fc1476.png',
        description: 'Slam the ice shelf into a hex row: 105% ATK with an 18% chance to STUN each for 1 turn.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.05 },
          { type: 'stun', chance: 0.18, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Glacial Mass',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 18% less damage while above 40% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.hp / unit.maxHp > 0.4 ? 0.82 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.2,
      description: 'Glacier Face: +20% DEF while in a front hex.',
    },
  },

  wolf_dawnmother: {
    id: 'wolf_dawnmother',
    element: 'light',
    name: 'Wolf Dawnmother',
    title: 'First Light of the Long Night',
    rarity: 3,
    stats: { hp: 1190, atk: 164, def: 88, speed: 101 },
    tint: { body: '#e8e0c8', helm: '#f8e8a8', weapon: '#f8d86a', skin: '#c8c8d8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfdawnmotheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'dawnlight_nip', name: 'Dawnlight Nip',
        icon: 'assets/icons/fc1447.png',
        description: 'A gleaming nip: 90% ATK, catching the light: +4% crit chance for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.04, turns: 1 },
        ],
      },
      {
        id: 'morning_mend', name: 'Morning Mend',
        icon: 'assets/icons/fc1112.png',
        description: 'Sunrise in a wound: heals an ally 12% of her max HP and grants 10% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.12 },
          { type: 'turnMeter', amount: 0.1 },
        ],
      },
      {
        id: 'break_of_day', name: 'Break of Day',
        icon: 'assets/icons/fc855.png',
        description: 'The night ends: ALL allies heal 70% of ATK, are cleansed, and gain 5% turn meter.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.7 },
          { type: 'cleanse' },
          { type: 'turnMeter', amount: 0.05 },
        ],
      },
    ],
    passive: {
      name: 'Light of Dawn',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, the most afflicted ally sheds one debuff and heals 2% of her max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team);
          let worst = null, count = 0;
          for (const a of allies) {
            const n = a.statusEffects.filter(
              (fx) => fx.kind === 'debuff' || fx.kind === 'dot').length;
            if (n > count) { worst = a; count = n; }
          }
          if (!worst) return null;
          const idx = worst.statusEffects.findIndex(
            (fx) => fx.kind === 'debuff' || fx.kind === 'dot');
          worst.statusEffects.splice(idx, 1);
          const healed = worst.heal(Math.round(unit.maxHp * 0.02));
          return {
            label: 'Light of Dawn',
            message: `${unit.name}'s dawnlight eases ${worst.name}.`,
            floats: [{ target: worst, text: 'CLEANSE', color: '#f8d86a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Sunrise Watch: +12% DEF while in the center hex.',
    },
  },

  // ---- Boar cohort (the Savanna) ------------------------------------------
  // Procedural placeholder art renders until real idle sheets land at the
  // conventional flat paths (assets/heroes/boar<role>idle.png).

  boar_tusker: {
    id: 'boar_tusker',
    element: 'fire',
    name: 'Boar Tusker',
    title: 'Two Points of Argument',
    rarity: 1,
    stats: { hp: 860, atk: 110, def: 76, speed: 90 },
    tint: { body: '#8a5a3a', helm: '#a87a4a', weapon: '#e8e0d8', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boartuskeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'tusk_jab', name: 'Tusk Jab',
        icon: 'assets/icons/fc746.png',
        description: 'A hooking tusk for 111% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.11 },
        ],
      },
      {
        id: 'goring_rush', name: 'Goring Rush',
        icon: 'assets/icons/fc763.png',
        description: 'A short, brutal rush: 142% ATK and -7% DEF for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.42 },
          { type: 'debuff', stat: 'def', mult: 0.93, turns: 1 },
        ],
      },
      {
        id: 'double_gore', name: 'Double Gore',
        icon: 'assets/icons/fc744.png',
        description: 'Both tusks: two hits of 82% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.82 },
          { type: 'damage', mult: 0.82 },
        ],
      },
    ],
    passive: {
      name: 'First Gore',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 18% extra damage to enemies at full HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp >= target.maxHp ? 1.18 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Tusk Line: +12% ATK while in a front hex.',
    },
  },

  boar_forager: {
    id: 'boar_forager',
    element: 'water',
    name: 'Boar Forager',
    title: 'Finds Lunch Anywhere',
    rarity: 1,
    stats: { hp: 880, atk: 102, def: 78, speed: 89 },
    tint: { body: '#7a6a5a', helm: '#9a8a6a', weapon: '#b8a878', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarforageridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snout_shove', name: 'Snout Shove',
        icon: 'assets/icons/fc663.png',
        description: 'A rooting shove: 96% ATK that drains 6% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.96 },
          { type: 'turnMeter', amount: -0.06 },
        ],
      },
      {
        id: 'share_the_find', name: 'Share the Find',
        icon: 'assets/icons/fc1112.png',
        description: 'Split the truffle: heals an ally 115% of ATK and grants 5% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.15 },
          { type: 'turnMeter', amount: 0.05 },
        ],
      },
      {
        id: 'forage_feast', name: 'Forage Feast',
        icon: 'assets/icons/fc800.png',
        description: 'Lay out the haul: ALL allies heal 45% of ATK and gain +8% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.45 },
          { type: 'buff', stat: 'def', mult: 1.08, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Truffle Cache',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, eats a little: heals himself 2% and the most wounded other ally 1% of his max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          const self = unit.heal(Math.round(unit.maxHp * 0.02));
          const allies = battle.livingUnits(unit.team)
            .filter((u) => u !== unit && u.hp < u.maxHp);
          if (allies.length > 0) {
            allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
            allies[0].heal(Math.round(unit.maxHp * 0.01));
          }
          return null; // silent — small rolling snack
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Root Larder: +12% DEF while in the center hex.',
    },
  },

  boar_mudback: {
    id: 'boar_mudback',
    element: 'water',
    name: 'Boar Mudback',
    title: 'Armored in the Wallow',
    rarity: 1,
    stats: { hp: 940, atk: 100, def: 84, speed: 86 },
    tint: { body: '#5a4a3a', helm: '#7a6a4a', weapon: '#a8a098', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarmudbackidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'mud_slap', name: 'Mud Slap',
        icon: 'assets/icons/fc981.png',
        description: 'A wet slap of mud: 88% ATK and -5% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.88 },
          { type: 'debuff', stat: 'atk', mult: 0.95, turns: 1 },
        ],
      },
      {
        id: 'wallow_charge', name: 'Wallow Charge',
        icon: 'assets/icons/fc762.png',
        description: 'A slithering charge: 126% ATK, recoated: +10% DEF for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.26 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.1, turns: 2 },
        ],
      },
      {
        id: 'mudslide', name: 'Mudslide',
        icon: 'assets/icons/fc767.png',
        description: 'Send the wallow downhill: 80% ATK to a hex row and -8% SPD for 1 turn.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'debuff', stat: 'speed', mult: 0.92, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Wallow',
      icon: 'assets/icons/fc856.png',
      description: 'At turn start, the mud draws out one poison and mends 1% max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          const idx = unit.statusEffects.findIndex((fx) => fx.kind === 'dot');
          if (idx === -1) return null;
          unit.statusEffects.splice(idx, 1);
          unit.heal(Math.round(unit.maxHp * 0.01));
          return {
            label: 'Wallow',
            message: `${unit.name}'s mud coat draws out the poison.`,
            floats: [{ target: unit, text: 'CLEANSE', color: '#a89a6a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Mud Wall: +15% DEF while in a front hex.',
    },
  },

  boar_thistlehide: {
    id: 'boar_thistlehide',
    element: 'wind',
    name: 'Boar Thistlehide',
    title: 'Hugs Are Inadvisable',
    rarity: 1,
    stats: { hp: 900, atk: 104, def: 82, speed: 88 },
    tint: { body: '#6a7a4a', helm: '#8a9a5a', weapon: '#a8c86a', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarthistlehideidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bristle_rake', name: 'Bristle Rake',
        icon: 'assets/icons/fc1444.png',
        description: 'A raking pass of quills: 97% ATK plus a 7% ATK bleed for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.97 },
          { type: 'dot', pct: 0.07, turns: 1 },
        ],
      },
      {
        id: 'quill_shake', name: 'Quill Shake',
        icon: 'assets/icons/fc807.png',
        description: 'Shake loose a cloud of thistles: 58% ATK to ALL enemies.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.58 },
        ],
      },
      {
        id: 'thistle_wall', name: 'Thistle Wall',
        icon: 'assets/icons/fc854.png',
        description: 'Bristle up: +25% DEF and takes 15% less damage for 2 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.25, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.85, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Thistle Coat',
      icon: 'assets/icons/fc867.png',
      description: '+8% chance to reflect all incoming damage.',
      hooks: { reflectAdd: 0.08 },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.12,
      description: 'Thorn Fence: +12% DEF while in a front hex.',
    },
  },

  boar_charger: {
    id: 'boar_charger',
    element: 'fire',
    name: 'Boar Charger',
    title: 'Brakes Not Included',
    rarity: 1,
    stats: { hp: 830, atk: 116, def: 68, speed: 96 },
    tint: { body: '#a84a2a', helm: '#c86a3a', weapon: '#c8c0b0', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarchargeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'headlong_rush', name: 'Headlong Rush',
        icon: 'assets/icons/fc744.png',
        description: 'A committed rush: 118% ATK, but overshooting costs 5% of his own meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.18 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
      {
        id: 'full_gallop', name: 'Full Gallop',
        icon: 'assets/icons/fc763.png',
        description: 'Terminal boar velocity: 152% ATK with a 15% chance to STUN for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.52 },
          { type: 'stun', chance: 0.15, turns: 1 },
        ],
      },
      {
        id: 'through_the_wall', name: 'Through the Wall',
        icon: 'assets/icons/fc767.png',
        description: 'Go through, not around: 175% ATK and -10% DEF for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.75 },
          { type: 'debuff', stat: 'def', mult: 0.9, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Momentum Tusks',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 15% extra damage while above 80% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return unit.hp / unit.maxHp > 0.8 ? 1.15 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.15,
      description: 'Charge Lane: +15% ATK while in a front hex.',
    },
  },

  boar_rootdigger: {
    id: 'boar_rootdigger',
    element: 'water',
    name: 'Boar Rootdigger',
    title: 'The Ground Gives Up First',
    rarity: 1,
    stats: { hp: 910, atk: 103, def: 80, speed: 87 },
    tint: { body: '#6a5a4a', helm: '#8a7a5a', weapon: '#b8a878', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarrootdiggeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'root_rip', name: 'Root Rip',
        icon: 'assets/icons/fc1472.png',
        description: 'Tear through roots and shins alike: 122% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.22 },
        ],
      },
      {
        id: 'turned_earth', name: 'Turned Earth',
        icon: 'assets/icons/fc862.png',
        description: 'Churn their footing: -12% SPD and -8% DEF for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'speed', mult: 0.88, turns: 1 },
          { type: 'debuff', stat: 'def', mult: 0.92, turns: 1 },
        ],
      },
      {
        id: 'sinkhole', name: 'Sinkhole',
        icon: 'assets/icons/fc767.png',
        description: 'Open the ground: 130% ATK and -20% turn meter.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
          { type: 'turnMeter', amount: -0.2 },
        ],
      },
    ],
    passive: {
      name: 'Deep Roots',
      icon: 'assets/icons/fc856.png',
      description: '+15% debuff resistance and takes 4% less damage.',
      hooks: {
        resistanceAdd: 0.15,
        damageTakenMult() { return 0.96; },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Rooted: +15% DEF while in the center hex.',
    },
  },

  boar_sunbasker: {
    id: 'boar_sunbasker',
    element: 'fire',
    name: 'Boar Sunbasker',
    title: 'Professional Warm Rock',
    rarity: 1,
    stats: { hp: 890, atk: 108, def: 74, speed: 89 },
    tint: { body: '#c88a4a', helm: '#e8a85a', weapon: '#e8d8a8', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarsunbaskeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'warm_shoulder', name: 'Warm Shoulder',
        icon: 'assets/icons/fc663.png',
        description: 'A sun-warmed shoulder check: 124% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.24 },
        ],
      },
      {
        id: 'stored_heat', name: 'Stored Heat',
        icon: 'assets/icons/fc1050.png',
        description: 'Release the day\'s heat: 128% ATK plus a 16% ATK burn for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.28 },
          { type: 'dot', pct: 0.16, turns: 1 },
        ],
      },
      {
        id: 'long_nap', name: 'Long Nap',
        icon: 'assets/icons/fc1112.png',
        description: 'Doze off mid-battle: recovers 30% max HP and +15% DEF for 1 turn.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.30 },
          { type: 'buff', stat: 'def', mult: 1.15, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Basking Heat',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, gains +6% ATK for 1 turn and mends 1.5% max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.06, turns: 1 });
          unit.heal(Math.round(unit.maxHp * 0.015));
          return null; // silent — small rolling warmth
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.1,
      description: 'Sun Spot: +10% ATK while in the center hex.',
    },
  },

  boar_dustroller: {
    id: 'boar_dustroller',
    element: 'wind',
    name: 'Boar Dustroller',
    title: 'Ambient Dirt Hazard',
    rarity: 1,
    stats: { hp: 850, atk: 107, def: 72, speed: 94 },
    tint: { body: '#9a8a6a', helm: '#b8a87a', weapon: '#c8b898', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boardustrolleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'dusty_headbutt', name: 'Dusty Headbutt',
        icon: 'assets/icons/fc762.png',
        description: 'A gritty headbutt: 101% ATK and -3% crit chance for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.01 },
          { type: 'debuff', stat: 'critChance', add: -0.03, turns: 1 },
        ],
      },
      {
        id: 'roll_out', name: 'Roll Out',
        icon: 'assets/icons/fc744.png',
        description: 'A rolling strike: 136% ATK, dusting himself off: +6% DEF for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.36 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.06, turns: 2 },
        ],
      },
      {
        id: 'dust_devil', name: 'Dust Devil',
        icon: 'assets/icons/fc807.png',
        description: 'Kick up a blinding column: ALL enemies lose 6% crit chance and 3% SPD for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'critChance', add: -0.06, turns: 1 },
          { type: 'debuff', stat: 'speed', mult: 0.97, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Dust Cloud',
      icon: 'assets/icons/fc882.png',
      description: '+12% chance to dodge while holding the center hex.',
      hooks: {
        dodgeAdd(unit) {
          return unit.slot && unit.slot.position === POSITION.CENTER ? 0.12 : 0;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'speed', mult: 1.1,
      description: 'Dust Bath: +10% SPD while in the center hex.',
    },
  },

  boar_squealer: {
    id: 'boar_squealer',
    element: 'wind',
    name: 'Boar Squealer',
    title: 'Alarm with Legs',
    rarity: 1,
    stats: { hp: 820, atk: 105, def: 70, speed: 97 },
    tint: { body: '#b87a8a', helm: '#d89aa8', weapon: '#c8c0b0', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarsquealeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'ear_splitter', name: 'Ear-Splitter',
        icon: 'assets/icons/fc1003.png',
        description: 'A squeal at point blank: 91% ATK and -6% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.91 },
          { type: 'debuff', stat: 'atk', mult: 0.94, turns: 1 },
        ],
      },
      {
        id: 'panic_call', name: 'Panic Call',
        icon: 'assets/icons/fc868.png',
        description: 'A rallying shriek: an ally gains 15% turn meter and +10% SPD for 1 turn.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'turnMeter', amount: 0.15 },
          { type: 'buff', stat: 'speed', mult: 1.1, turns: 1 },
        ],
      },
      {
        id: 'deafening_chorus', name: 'Deafening Chorus',
        icon: 'assets/icons/fc1084.png',
        description: 'The whole sounder joins in: ALL enemies lose 8% ATK for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'atk', mult: 0.92, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Piercing Squeal',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, a random enemy loses 4% DEF for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          target.addStatusEffect({ kind: 'debuff', stat: 'def', mult: 0.96, turns: 1 });
          return null; // silent — small rolling screech
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.1,
      description: 'Lookout Rock: +10% SPD while in a back hex.',
    },
  },

  boar_ironhide: {
    id: 'boar_ironhide',
    element: 'water',
    name: 'Boar Ironhide',
    title: 'Dents Incoming Weapons',
    rarity: 2,
    stats: { hp: 1060, atk: 116, def: 100, speed: 86 },
    tint: { body: '#5a5a6a', helm: '#7a7a8a', weapon: '#a8a0a8', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarironhideidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'iron_shoulder', name: 'Iron Shoulder',
        icon: 'assets/icons/fc854.png',
        description: 'A plated shoulder slam: 90% of DEF as damage.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 0.9 },
        ],
      },
      {
        id: 'anvil_stance', name: 'Anvil Stance',
        icon: 'assets/icons/fc855.png',
        description: 'Set like an anvil: +30% DEF for 2 turns and takes 10% less damage for 1 turn.',
        cooldown: 3, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.3, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.9, turns: 1 },
        ],
      },
      {
        id: 'iron_avalanche', name: 'Iron Avalanche',
        icon: 'assets/icons/fc1476.png',
        description: 'Bring the whole harness down: 140% of DEF as damage.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 1.4 },
        ],
      },
    ],
    passive: {
      name: 'Ironhide Plates',
      icon: 'assets/icons/fc856.png',
      description: '+10% chance to reflect all incoming damage.',
      hooks: { reflectAdd: 0.10 },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.18,
      description: 'Iron Line: +18% DEF while in a front hex.',
    },
  },

  boar_bulwark: {
    id: 'boar_bulwark',
    element: 'water',
    name: 'Boar Bulwark',
    title: 'The Line Is Him',
    rarity: 2,
    stats: { hp: 1100, atk: 112, def: 104, speed: 84 },
    tint: { body: '#4a5a6a', helm: '#6a7a8a', weapon: '#c8c0b0', shield: '#8a9ab8', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarbulwarkidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'shield_snout', name: 'Shield Snout',
        icon: 'assets/icons/fc1471.png',
        description: 'A snout-first block-and-strike: 75% of DEF as damage, guarding: takes 8% less damage until next turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 0.75 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.92, turns: 1 },
        ],
      },
      {
        id: 'hold_the_wall', name: 'Hold the Wall',
        icon: 'assets/icons/fc855.png',
        description: 'Anchor the wall: front-hex allies gain +18% DEF and take 5% less damage for 2 turns.',
        cooldown: 5, targeting: 'front-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.18, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.95, turns: 2 },
        ],
      },
      {
        id: 'rampart_toss', name: 'Rampart Toss',
        icon: 'assets/icons/fc767.png',
        description: 'Heave them off the wall: 120% of DEF as damage and -12% turn meter.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 1.2 },
          { type: 'turnMeter', amount: -0.12 },
        ],
      },
    ],
    passive: {
      name: 'Rampart Stance',
      icon: 'assets/icons/fc854.png',
      description: 'Gains +12% DEF for 2 turns at each turn start (briefly stacks).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.12, turns: 2 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.2,
      description: 'Wall Anchor: +20% DEF while in a front hex.',
    },
  },

  boar_brushfire: {
    id: 'boar_brushfire',
    element: 'fire',
    name: 'Boar Brushfire',
    title: 'Sparks Follow Him Around',
    rarity: 2,
    stats: { hp: 920, atk: 134, def: 76, speed: 99 },
    tint: { body: '#a85a2a', helm: '#c87a3a', weapon: '#e8843a', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarbrushfireidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'spark_tusk', name: 'Spark Tusk',
        icon: 'assets/icons/fc981.png',
        description: 'A flint-striking tusk: 94% ATK plus a 13% ATK burn for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.94 },
          { type: 'dot', pct: 0.13, turns: 1 },
        ],
      },
      {
        id: 'firebreak_charge', name: 'Firebreak Charge',
        icon: 'assets/icons/fc744.png',
        description: 'Charge through the burn line: 138% ATK plus a 20% ATK burn for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.38 },
          { type: 'dot', pct: 0.2, turns: 2 },
        ],
      },
      {
        id: 'brushfire_ring', name: 'Brushfire Ring',
        icon: 'assets/icons/fc1044.png',
        description: 'Light the grass in a ring: 55% ATK to ALL enemies plus a 15% ATK burn for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.55 },
          { type: 'dot', pct: 0.15, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Smoldering Bristles',
      icon: 'assets/icons/fc1093.png',
      description: '+10% DoT damage and deals 5% extra damage.',
      hooks: {
        dotBoostAdd: 0.10,
        damageDealtMult() { return 1.05; },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Fire Line: +12% ATK while in the center hex.',
    },
  },

  boar_stampeder: {
    id: 'boar_stampeder',
    element: 'fire',
    name: 'Boar Stampeder',
    title: 'First of Many Hooves',
    rarity: 2,
    stats: { hp: 950, atk: 130, def: 80, speed: 101 },
    tint: { body: '#8a4a3a', helm: '#a86a4a', weapon: '#c8c0b0', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarstampederidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'hoof_beat', name: 'Hoof Beat',
        icon: 'assets/icons/fc762.png',
        description: 'A drumming strike: 104% ATK, building speed: +5% SPD for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.04 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.05, turns: 2 },
        ],
      },
      {
        id: 'herd_charge', name: 'Herd Charge',
        icon: 'assets/icons/fc763.png',
        description: 'Hit like the whole herd: 148% ATK and -8% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.48 },
          { type: 'turnMeter', amount: -0.08 },
        ],
      },
      {
        id: 'endless_stampede', name: 'Endless Stampede',
        icon: 'assets/icons/fc730.png',
        description: 'The stampede arrives: 78% ATK to a hex row, twice.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.78 },
          { type: 'damage', mult: 0.78 },
        ],
      },
    ],
    passive: {
      name: 'Stampede Heart',
      icon: 'assets/icons/fc882.png',
      description: '+6% chance to take an extra turn after acting.',
      hooks: { extraTurnAdd: 0.06 },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Lead Position: +12% ATK while in a front hex.',
    },
  },

  boar_thornmail: {
    id: 'boar_thornmail',
    element: 'wind',
    name: 'Boar Thornmail',
    title: 'Wearable Retaliation',
    rarity: 2,
    stats: { hp: 1000, atk: 118, def: 96, speed: 88 },
    tint: { body: '#5a6a3a', helm: '#7a8a4a', weapon: '#a8c86a', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarthornmailidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'thorn_press', name: 'Thorn Press',
        icon: 'assets/icons/fc1461.png',
        description: 'Press the thorns in: 85% of DEF as damage plus a 6% ATK bleed for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 0.85 },
          { type: 'dot', pct: 0.06, turns: 1 },
        ],
      },
      {
        id: 'barbed_lockup', name: 'Barbed Lockup',
        icon: 'assets/icons/fc862.png',
        description: 'Wrap them in barbs: 110% of DEF as damage and -10% SPD for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 1.1 },
          { type: 'debuff', stat: 'speed', mult: 0.9, turns: 2 },
        ],
      },
      {
        id: 'hedge_of_spines', name: 'Hedge of Spines',
        icon: 'assets/icons/fc855.png',
        description: 'Become the hedge: ALL allies gain +12% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.12, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Bristleback',
      icon: 'assets/icons/fc867.png',
      description: '+8% chance to reflect all incoming damage and +8% debuff resistance.',
      hooks: { reflectAdd: 0.08, resistanceAdd: 0.08 },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Hedgerow: +15% DEF while in a front hex.',
    },
  },

  boar_mireguard: {
    id: 'boar_mireguard',
    element: 'water',
    name: 'Boar Mireguard',
    title: 'Swamp Property Enforcement',
    rarity: 2,
    stats: { hp: 1040, atk: 114, def: 98, speed: 87 },
    tint: { body: '#4a5a4a', helm: '#6a7a5a', weapon: '#8a9a7a', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarmireguardidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bog_shoulder', name: 'Bog Shoulder',
        icon: 'assets/icons/fc854.png',
        description: 'A sodden check: 80% of DEF as damage and -6% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 0.8 },
          { type: 'debuff', stat: 'speed', mult: 0.94, turns: 1 },
        ],
      },
      {
        id: 'quagmire_hold', name: 'Quagmire Hold',
        icon: 'assets/icons/fc862.png',
        description: 'Drag them into the mire: -15% SPD and -10% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'speed', mult: 0.85, turns: 2 },
          { type: 'debuff', stat: 'atk', mult: 0.9, turns: 2 },
        ],
      },
      {
        id: 'swampwall_slam', name: 'Swampwall Slam',
        icon: 'assets/icons/fc1476.png',
        description: 'The swamp itself swings: 125% of DEF as damage.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 1.25 },
        ],
      },
    ],
    passive: {
      name: 'Mire Stance',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 20% less damage while below 40% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.alive && unit.hp / unit.maxHp < 0.4 ? 0.8 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Bog Gate: +15% DEF while in a front hex.',
    },
  },

  boar_gorehorn: {
    id: 'boar_gorehorn',
    element: 'fire',
    name: 'Boar Gorehorn',
    title: 'Shields Are a Suggestion',
    rarity: 2,
    stats: { hp: 930, atk: 138, def: 78, speed: 98 },
    tint: { body: '#7a3a2a', helm: '#9a5a3a', weapon: '#e8e0d8', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boargorehornidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'horn_hook', name: 'Horn Hook',
        icon: 'assets/icons/fc746.png',
        description: 'A hooking gore: 106% ATK — 20% more against DEF-altered foes.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.06, bonusVs: { stat: 'def', mult: 1.2 } },
        ],
      },
      {
        id: 'shieldsplitter', name: 'Shieldsplitter',
        icon: 'assets/icons/fc1472.png',
        description: 'Split the guard: 135% ATK and -12% DEF for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.35 },
          { type: 'debuff', stat: 'def', mult: 0.88, turns: 2 },
        ],
      },
      {
        id: 'gore_the_line', name: 'Gore the Line',
        icon: 'assets/icons/fc730.png',
        description: 'Rip along the shields: 95% ATK to the front line.',
        cooldown: 6, targeting: 'front-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
        ],
      },
    ],
    passive: {
      name: 'Gore Momentum',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 25% extra damage to enemies with raised DEF (any DEF buff).',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'buff' && fx.stat === 'def') ? 1.25 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Breaching Spot: +12% ATK while in a front hex.',
    },
  },

  boar_grassrunner: {
    id: 'boar_grassrunner',
    element: 'wind',
    name: 'Boar Grassrunner',
    title: 'Rumor in the Reeds',
    rarity: 2,
    stats: { hp: 880, atk: 128, def: 74, speed: 107 },
    tint: { body: '#7a9a5a', helm: '#9aba6a', weapon: '#c8c0b0', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boargrassrunneridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'reed_rush', name: 'Reed Rush',
        icon: 'assets/icons/fc1447.png',
        description: 'A rustling strike: 108% ATK, slipping onward: +6% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.08 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.06, turns: 1 },
        ],
      },
      {
        id: 'circling_run', name: 'Circling Run',
        icon: 'assets/icons/fc825.png',
        description: 'Strike from a new angle: 144% ATK — 20% more against slowed or hasted prey.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.44, bonusVs: { stat: 'speed', mult: 1.2 } },
        ],
      },
      {
        id: 'grass_maze', name: 'Grass Maze',
        icon: 'assets/icons/fc807.png',
        description: 'Lead them in circles: ALL enemies lose 8% SPD and 4% turn meter.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'speed', mult: 0.92, turns: 1 },
          { type: 'turnMeter', amount: -0.04 },
        ],
      },
    ],
    passive: {
      name: 'Tall Grass',
      icon: 'assets/icons/fc882.png',
      description: '+7% chance to dodge and +3% chance for an extra turn.',
      hooks: { dodgeAdd: 0.07, extraTurnAdd: 0.03 },
    },
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.12,
      description: 'Reed Run: +12% SPD while in a back hex.',
    },
  },

  boar_nightsow: {
    id: 'boar_nightsow',
    element: 'dark',
    name: 'Boar Nightsow',
    title: 'What Rustles After Midnight',
    rarity: 2,
    stats: { hp: 910, atk: 136, def: 72, speed: 104 },
    tint: { body: '#2a2a3a', helm: '#4a3a4a', weapon: '#8a6ab8', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarnightsowidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'midnight_gore', name: 'Midnight Gore',
        icon: 'assets/icons/fc1444.png',
        description: 'A gore from the dark: 112% ATK — 15% more against poisoned or bleeding prey.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.12, bonusVs: { kind: 'dot', mult: 1.15 } },
        ],
      },
      {
        id: 'shadow_rut', name: 'Shadow Rut',
        icon: 'assets/icons/fc1084.png',
        description: 'Carve a dark furrow: 140% ATK and the target takes +15% damage for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.4 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.15, turns: 2 },
        ],
      },
      {
        id: 'nightfall_charge', name: 'Nightfall Charge',
        icon: 'assets/icons/fc734.png',
        description: 'Night falls at a gallop: 188% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.88 },
        ],
      },
    ],
    passive: {
      name: 'Night Forage',
      icon: 'assets/icons/fc863.png',
      description: 'Preys on the overwhelmed: deals 25% extra damage to enemies with 2 or more afflictions.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.filter((fx) => fx.kind === 'debuff' || fx.kind === 'dot').length >= 2 ? 1.25 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.12,
      description: 'Dark Thicket: +12% damage dealt from a back hex.',
    },
  },

  boar_drummer: {
    id: 'boar_drummer',
    element: 'wind',
    name: 'Boar Drummer',
    title: 'Sets the Sounder\'s Pace',
    rarity: 2,
    stats: { hp: 900, atk: 120, def: 82, speed: 95 },
    tint: { body: '#8a7a5a', helm: '#a89a6a', weapon: '#c8a878', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boardrummeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'drum_hoof', name: 'Drum Hoof',
        icon: 'assets/icons/fc663.png',
        description: 'A rhythmic stomp: 99% ATK that drains 4% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.99 },
          { type: 'turnMeter', amount: -0.04 },
        ],
      },
      {
        id: 'quickstep_beat', name: 'Quickstep Beat',
        icon: 'assets/icons/fc868.png',
        description: 'Beat the advance: an ally gains +12% SPD for 2 turns and 8% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.12, turns: 2 },
          { type: 'turnMeter', amount: 0.08 },
        ],
      },
      {
        id: 'thunder_of_hooves', name: 'Thunder of Hooves',
        icon: 'assets/icons/fc869.png',
        description: 'The ground keeps the beat: ALL allies gain +6% ATK and +6% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.06, turns: 2 },
          { type: 'buff', stat: 'speed', mult: 1.06, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'War Drums',
      icon: 'assets/icons/fc882.png',
      description: 'At turn start, ALL allies gain 3% turn meter.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const ally of battle.livingUnits(unit.team)) {
            if (ally === unit) continue;
            ally.turnMeter = Math.min(CONFIG.TURN_METER_MAX,
              ally.turnMeter + CONFIG.TURN_METER_MAX * 0.03);
          }
          return null; // silent — small rolling tempo
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'speed', mult: 1.12,
      description: 'Drum Circle: +12% SPD while in the center hex.',
    },
  },

  boar_warchief: {
    id: 'boar_warchief',
    element: 'fire',
    name: 'Boar Warchief',
    title: 'Crowned by Collision',
    rarity: 3,
    stats: { hp: 1240, atk: 168, def: 98, speed: 98 },
    tint: { body: '#8a3a2a', helm: '#e8c83a', weapon: '#d8d8e0', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarwarchiefidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'chiefs_gore', name: 'Chief\'s Gore',
        icon: 'assets/icons/fc746.png',
        description: 'A commanding gore: 114% ATK and -6% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.14 },
          { type: 'debuff', stat: 'def', mult: 0.94, turns: 1 },
        ],
      },
      {
        id: 'war_banner_charge', name: 'War Banner Charge',
        icon: 'assets/icons/fc869.png',
        description: 'Raise the tusks: ALL allies gain +10% ATK and +8% DEF for 2 turns.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.1, turns: 2 },
          { type: 'buff', stat: 'def', mult: 1.08, turns: 2 },
        ],
      },
      {
        id: 'kingslayer_rush', name: 'Kingslayer Rush',
        icon: 'assets/icons/fc730.png',
        description: 'A charge fit to end dynasties: 210% ATK and -10% turn meter.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.1 },
          { type: 'turnMeter', amount: -0.1 },
        ],
      },
    ],
    passive: {
      name: 'Chieftain\'s Bulk',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, ALL allies gain +6% DEF for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const ally of battle.livingUnits(unit.team)) {
            ally.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.06, turns: 1 });
          }
          return null; // silent — small rolling aura
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.15,
      description: 'War Throne: +15% ATK while in the center hex.',
    },
  },

  boar_earthshaker: {
    id: 'boar_earthshaker',
    element: 'water',
    name: 'Boar Earthshaker',
    title: 'Registers on Instruments',
    rarity: 3,
    stats: { hp: 1320, atk: 150, def: 110, speed: 84 },
    tint: { body: '#4a4a4a', helm: '#6a6a5a', weapon: '#a8a098', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarearthshakeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'tremor_stomp', name: 'Tremor Stomp',
        icon: 'assets/icons/fc767.png',
        description: 'A ground-splitting stomp: 95% of DEF as damage and -5% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 0.95 },
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
      {
        id: 'faultline', name: 'Faultline',
        icon: 'assets/icons/fc1044.png',
        description: 'Crack a hex row open: 100% of DEF as damage and -10% SPD for 1 turn.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 1.0 },
          { type: 'debuff', stat: 'speed', mult: 0.9, turns: 1 },
        ],
      },
      {
        id: 'continental_slam', name: 'Continental Slam',
        icon: 'assets/icons/fc1476.png',
        description: 'Move the earth: 90% of DEF as damage to ALL enemies.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 0.9 },
        ],
      },
    ],
    passive: {
      name: 'Seismic Bulk',
      icon: 'assets/icons/fc856.png',
      description: '+10% chance to reflect all incoming damage and +10% debuff resistance.',
      hooks: { reflectAdd: 0.10, resistanceAdd: 0.10 },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.2,
      description: 'Bedrock: +20% DEF while in a front hex.',
    },
  },

  boar_bramblelord: {
    id: 'boar_bramblelord',
    element: 'wind',
    name: 'Boar Bramblelord',
    title: 'The Hedge Has Opinions',
    rarity: 3,
    stats: { hp: 1150, atk: 170, def: 92, speed: 100 },
    tint: { body: '#4a6a3a', helm: '#6a8a4a', weapon: '#a8c86a', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarbramblelordidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'briar_gore', name: 'Briar Gore',
        icon: 'assets/icons/fc981.png',
        description: 'A thorn-wrapped gore: 100% ATK plus a 15% ATK bleed for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'dot', pct: 0.15, turns: 2 },
        ],
      },
      {
        id: 'strangling_growth', name: 'Strangling Growth',
        icon: 'assets/icons/fc1052.png',
        description: 'Brambles climb them: 120% ATK, -12% SPD for 2 turns plus a 12% ATK bleed for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'debuff', stat: 'speed', mult: 0.88, turns: 2 },
          { type: 'dot', pct: 0.12, turns: 2 },
        ],
      },
      {
        id: 'wall_of_briars', name: 'Wall of Briars',
        icon: 'assets/icons/fc855.png',
        description: 'Raise the living hedge: ALL allies gain +10% DEF and take 6% less damage for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.1, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.94, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Bramble Crown',
      icon: 'assets/icons/fc1093.png',
      description: 'His bleeds cling: +10% DoT damage and DoTs last 1 extra turn.',
      hooks: { dotBoostAdd: 0.10, dotExtraTurns: 1 },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Hedge Heart: +15% DEF while in the center hex.',
    },
  },

  boar_cinderback: {
    id: 'boar_cinderback',
    element: 'fire',
    name: 'Boar Cinderback',
    title: 'Walking Campfire Violation',
    rarity: 3,
    stats: { hp: 1200, atk: 160, def: 100, speed: 92 },
    tint: { body: '#5a3a2a', helm: '#e8632a', weapon: '#f8a83a', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarcinderbackidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'ember_shoulder', name: 'Ember Shoulder',
        icon: 'assets/icons/fc854.png',
        description: 'A glowing check: 88% of DEF as damage plus an 8% ATK burn for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 0.88 },
          { type: 'dot', pct: 0.08, turns: 1 },
        ],
      },
      {
        id: 'coal_bed_roll', name: 'Coal Bed Roll',
        icon: 'assets/icons/fc1050.png',
        description: 'Roll through them trailing coals: 105% of DEF as damage to a hex row plus a 10% ATK burn for 1 turn.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damageDef', mult: 1.05 },
          { type: 'dot', pct: 0.1, turns: 1 },
        ],
      },
      {
        id: 'furnace_bloom', name: 'Furnace Bloom',
        icon: 'assets/icons/fc1044.png',
        description: 'The cinders flare white: +35% DEF and takes 20% less damage for 2 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.35, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.8, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Cinder Bristles',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, shed embers sear ALL enemies for 1.5% of his DEF.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.effectiveStat('def') * 0.015));
          for (const e of enemies) e.takeDamage(amount);
          return {
            label: 'Cinder Bristles',
            message: `${unit.name}'s embers sear the field.`,
            floats: enemies.map((e) => ({ target: e, text: `-${amount}`, color: '#e8843a' })),
          };
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Hearth Line: +15% DEF while in a front hex.',
    },
  },

  boar_rainbringer: {
    id: 'boar_rainbringer',
    element: 'water',
    name: 'Boar Rainbringer',
    title: 'Smells Like Coming Storms',
    rarity: 3,
    stats: { hp: 1180, atk: 156, def: 94, speed: 97 },
    tint: { body: '#4a6a8a', helm: '#6a8aa8', weapon: '#a8d8e8', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarrainbringeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rain_slick_gore', name: 'Rain-Slick Gore',
        icon: 'assets/icons/fc819.png',
        description: 'A sliding gore: 103% ATK and -4% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.03 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 1 },
        ],
      },
      {
        id: 'cloudburst', name: 'Cloudburst',
        icon: 'assets/icons/fc1112.png',
        description: 'Call the rain down: ALL allies heal 50% of ATK and gain +5% SPD for 2 turns.',
        cooldown: 4, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.5 },
          { type: 'buff', stat: 'speed', mult: 1.05, turns: 2 },
        ],
      },
      {
        id: 'monsoon_wall', name: 'Monsoon Wall',
        icon: 'assets/icons/fc800.png',
        description: 'A wall of grey water: 70% ATK to ALL enemies and -6% turn meter.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.7 },
          { type: 'turnMeter', amount: -0.06 },
        ],
      },
    ],
    passive: {
      name: 'Rain Blessing',
      icon: 'assets/icons/fc1093.png',
      description: 'Whenever an ally is healed, that ally also gains +4% SPD for 1 turn.',
      hooks: {
        onAllyHealed(unit, healedUnit) {
          if (healedUnit === unit) return;
          healedUnit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.04, turns: 1 });
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.15,
      description: 'Stormwatch: +15% DEF while in a back hex.',
    },
  },

  boar_dawnsow: {
    id: 'boar_dawnsow',
    element: 'light',
    name: 'Boar Dawnsow',
    title: 'Sunrise Made Stubborn',
    rarity: 3,
    stats: { hp: 1260, atk: 152, def: 96, speed: 94 },
    tint: { body: '#e8d8a8', helm: '#f8e8c8', weapon: '#f8d86a', skin: '#c8a888' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boardawnsowidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'gilded_tusk', name: 'Gilded Tusk',
        icon: 'assets/icons/fc1447.png',
        description: 'A gleaming tusk: 98% ATK, and the light steadies her: +6% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.98 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.06, turns: 1 },
        ],
      },
      {
        id: 'daybreak_ward', name: 'Daybreak Ward',
        icon: 'assets/icons/fc855.png',
        description: 'Wrap an ally in morning light: heals 14% of her max HP and they take 12% less damage for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.14 },
          { type: 'buff', stat: 'damageTaken', mult: 0.88, turns: 2 },
        ],
      },
      {
        id: 'first_light_of_the_sounder', name: 'First Light of the Sounder',
        icon: 'assets/icons/fc1112.png',
        description: 'Dawn reaches everyone: ALL allies heal 60% of ATK and gain +8% DEF for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.6 },
          { type: 'buff', stat: 'def', mult: 1.08, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Dawn Warmth',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, shields the most wounded ally: takes 15% less damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.85, turns: 1 });
          return null; // silent — small rolling warmth
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Sunrise Post: +15% DEF while in the center hex.',
    },
  },

  // ---- Bear cohort (the Valley) -------------------------------------------
  // Procedural placeholder art renders until real idle sheets land at the
  // conventional flat paths (assets/heroes/bear<role>idle.png).

  bear_cub: {
    id: 'bear_cub',
    element: 'wind',
    name: 'Bear Cub',
    title: 'Small Now, Notably Temporary',
    rarity: 1,
    stats: { hp: 950, atk: 98, def: 70, speed: 92 },
    tint: { body: '#a8845a', helm: '#c8a87a', weapon: '#c8c0b0', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearcubidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'clumsy_swipe', name: 'Clumsy Swipe',
        icon: 'assets/icons/fc663.png',
        description: 'An overeager swipe: 95% ATK, tumbling into +6% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.95 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.06, turns: 1 },
        ],
      },
      {
        id: 'surprise_tackle', name: 'Surprise Tackle',
        icon: 'assets/icons/fc762.png',
        description: 'Heavier than he looks: 128% ATK and drains 6% turn meter.',
        cooldown: 3, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.28 },
          { type: 'turnMeter', amount: -0.06 },
        ],
      },
      {
        id: 'call_for_mother', name: 'Call for Mother',
        icon: 'assets/icons/fc868.png',
        description: 'A cry that promises consequences: an ally gains +15% ATK for 2 turns and 10% turn meter.',
        cooldown: 6, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.15, turns: 2 },
          { type: 'turnMeter', amount: 0.1 },
        ],
      },
    ],
    passive: {
      name: 'Growing Boy',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, mends 1% max HP and gains +3% ATK for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.heal(Math.round(unit.maxHp * 0.01));
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.03, turns: 1 });
          return null; // silent — small rolling growth
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'hp', mult: 1.12,
      description: 'Behind Mother: +12% max HP while in a back hex.',
    },
  },

  bear_fisher: {
    id: 'bear_fisher',
    element: 'water',
    name: 'Bear Fisher',
    title: 'Standing in the River, Winning',
    rarity: 1,
    stats: { hp: 1020, atk: 100, def: 72, speed: 90 },
    tint: { body: '#6a5a4a', helm: '#8a7a5a', weapon: '#a8d8e8', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearfisheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'paw_scoop', name: 'Paw Scoop',
        icon: 'assets/icons/fc1471.png',
        description: 'A practiced scoop: 96% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
        ],
      },
      {
        id: 'salmon_slap', name: 'Salmon Slap',
        icon: 'assets/icons/fc981.png',
        description: 'Assault with a fresh salmon: 125% ATK and -5% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.25 },
          { type: 'debuff', stat: 'critChance', add: -0.05, turns: 1 },
        ],
      },
      {
        id: 'bounty_of_the_river', name: 'Bounty of the River',
        icon: 'assets/icons/fc1112.png',
        description: 'Share the catch: ALL allies heal 65% of ATK.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.65 },
        ],
      },
    ],
    passive: {
      name: 'River Patience',
      icon: 'assets/icons/fc856.png',
      description: 'Well fed: regenerates 3% max HP at turn start while above half HP.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp <= 0.5 || unit.hp >= unit.maxHp) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.03));
          if (healed <= 0) return null;
          return {
            label: 'River Patience',
            message: `${unit.name} digests: +${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#7ae87a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'hp', mult: 1.12,
      description: 'Fishing Hole: +12% max HP while in the center hex.',
    },
  },

  bear_honeypaw: {
    id: 'bear_honeypaw',
    element: 'fire',
    name: 'Bear Honeypaw',
    title: 'Sticky and Unashamed',
    rarity: 1,
    stats: { hp: 980, atk: 96, def: 74, speed: 91 },
    tint: { body: '#c8a83a', helm: '#e8c85a', weapon: '#e8d8a8', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearhoneypawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'sticky_swat', name: 'Sticky Swat',
        icon: 'assets/icons/fc663.png',
        description: 'A honey-heavy swat: 92% ATK and -4% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.92 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 1 },
        ],
      },
      {
        id: 'honey_share', name: 'Honey Share',
        icon: 'assets/icons/fc1112.png',
        description: 'A dollop for a friend: heals an ally 140% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.4 },
        ],
      },
      {
        id: 'hive_toss', name: 'Hive Toss',
        icon: 'assets/icons/fc807.png',
        description: 'Throw the whole hive: 60% ATK to ALL enemies plus a 9% ATK sting for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.6 },
          { type: 'dot', pct: 0.09, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Honey Reserves',
      icon: 'assets/icons/fc1003.png',
      description: 'His healing is 15% stronger.',
      hooks: { healBoostAdd: 0.15 },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Honey Stash: +12% DEF while in the center hex.',
    },
  },

  bear_forestwalker: {
    id: 'bear_forestwalker',
    element: 'wind',
    name: 'Bear Forestwalker',
    title: 'The Trees Report to Him',
    rarity: 1,
    stats: { hp: 990, atk: 102, def: 73, speed: 95 },
    tint: { body: '#5a7a4a', helm: '#7a9a5a', weapon: '#a8c86a', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearforestwalkeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'branch_swat', name: 'Branch Swat',
        icon: 'assets/icons/fc1447.png',
        description: 'A tree-limb swat for 106% ATK, braced by the trunk: +4% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.06 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.04, turns: 1 },
        ],
      },
      {
        id: 'canopy_drop', name: 'Canopy Drop',
        icon: 'assets/icons/fc825.png',
        description: 'Fall out of a tree on purpose: 8% of his max HP as crushing damage.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageHpPct', pct: 0.08 },
        ],
      },
      {
        id: 'rooted_calm', name: 'Rooted Calm',
        icon: 'assets/icons/fc854.png',
        description: 'Stand like the forest: +20% DEF for 2 turns and heals 12% max HP.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.2, turns: 2 },
          { type: 'healHpPct', pct: 0.12 },
        ],
      },
    ],
    passive: {
      name: 'Forest Stride',
      icon: 'assets/icons/fc882.png',
      description: '+8% chance to dodge attacks.',
      hooks: { dodgeAdd: 0.08 },
    },
    positional: {
      position: POSITION.FRONT, stat: 'hp', mult: 1.12,
      description: 'Old Growth: +12% max HP while in a front hex.',
    },
  },

  bear_riverguard: {
    id: 'bear_riverguard',
    element: 'water',
    name: 'Bear Riverguard',
    title: 'Nobody Crosses Unannounced',
    rarity: 1,
    stats: { hp: 1050, atk: 99, def: 78, speed: 88 },
    tint: { body: '#4a6a7a', helm: '#6a8a9a', weapon: '#c8c0b0', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearriverguardidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'ford_check', name: 'Ford Check',
        icon: 'assets/icons/fc854.png',
        description: 'A blocking shoulder: 100% ATK, holding the line: +6% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.06, turns: 1 },
        ],
      },
      {
        id: 'undertow_drag', name: 'Undertow Drag',
        icon: 'assets/icons/fc862.png',
        description: 'Drag them into the current: 118% ATK and -10% SPD for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.18 },
          { type: 'debuff', stat: 'speed', mult: 0.9, turns: 1 },
        ],
      },
      {
        id: 'river_rise', name: 'River Rise',
        icon: 'assets/icons/fc855.png',
        description: 'The river answers: ALL allies gain +10% DEF and heal 30% of ATK.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.1, turns: 2 },
          { type: 'heal', mult: 0.3 },
        ],
      },
    ],
    passive: {
      name: 'River Stance',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 10% less damage while above 75% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.hp / unit.maxHp > 0.75 ? 0.9 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.12,
      description: 'Ford Post: +12% DEF while in a front hex.',
    },
  },

  bear_stonepaw: {
    id: 'bear_stonepaw',
    element: 'fire',
    name: 'Bear Stonepaw',
    title: 'Punches Geology-Grade',
    rarity: 1,
    stats: { hp: 1010, atk: 104, def: 80, speed: 87 },
    tint: { body: '#7a6a5a', helm: '#9a8a6a', weapon: '#a8a098', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearstonepawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'granite_jab', name: 'Granite Jab',
        icon: 'assets/icons/fc663.png',
        description: 'A stone one-two: two hits of 57% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.57 },
          { type: 'damage', mult: 0.57 },
        ],
      },
      {
        id: 'boulder_break', name: 'Boulder Break',
        icon: 'assets/icons/fc762.png',
        description: 'A blow that cracks stone: 146% ATK and -8% DEF for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.46 },
          { type: 'debuff', stat: 'def', mult: 0.92, turns: 1 },
        ],
      },
      {
        id: 'landslide_left', name: 'Landslide Left',
        icon: 'assets/icons/fc767.png',
        description: 'The whole hillside swings: 9% of his max HP as damage plus -8% turn meter.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageHpPct', pct: 0.09 },
          { type: 'turnMeter', amount: -0.08 },
        ],
      },
    ],
    passive: {
      name: 'Stone Fists',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, gains +10% DEF and +5% ATK for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.1, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.05, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Quarry Floor: +12% ATK while in a front hex.',
    },
  },

  bear_berrypicker: {
    id: 'bear_berrypicker',
    element: 'water',
    name: 'Bear Berrypicker',
    title: 'Season One Berry Ahead',
    rarity: 1,
    stats: { hp: 960, atk: 97, def: 71, speed: 93 },
    tint: { body: '#8a5a7a', helm: '#a87a9a', weapon: '#c8a8c8', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearberrypickeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bramble_swat', name: 'Bramble Swat',
        icon: 'assets/icons/fc981.png',
        description: 'A thorny swat: 94% ATK plus a 6% ATK scratch for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.94 },
          { type: 'dot', pct: 0.06, turns: 1 },
        ],
      },
      {
        id: 'berry_share', name: 'Berry Share',
        icon: 'assets/icons/fc1112.png',
        description: 'Handful of the good ones: heals an ally 105% of ATK plus 2.5% of her max HP for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.05 },
          { type: 'hot', pct: 0.025, turns: 2 },
        ],
      },
      {
        id: 'winter_stores', name: 'Winter Stores',
        icon: 'assets/icons/fc800.png',
        description: 'Open the caches: ALL allies regenerate 3% of her max HP for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'hot', pct: 0.03, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Berry Stash',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, a random ally is slipped berries: heals 2% of her max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team)
            .filter((u) => u !== unit && u.hp < u.maxHp);
          if (allies.length === 0) return null;
          const ally = allies[Math.floor(Math.random() * allies.length)];
          ally.heal(Math.round(unit.maxHp * 0.02));
          return null; // silent — small rolling snack
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'hp', mult: 1.12,
      description: 'Berry Thicket: +12% max HP while in a back hex.',
    },
  },

  bear_napper: {
    id: 'bear_napper',
    element: 'fire',
    name: 'Bear Napper',
    title: 'Do Not Wake',
    rarity: 1,
    stats: { hp: 1080, atk: 95, def: 76, speed: 85 },
    tint: { body: '#8a7a6a', helm: '#a89a8a', weapon: '#c8b898', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearnapperidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'groggy_swipe', name: 'Groggy Swipe',
        icon: 'assets/icons/fc663.png',
        description: 'A half-asleep swipe that still hurts: 128% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.28 },
        ],
      },
      {
        id: 'rude_awakening', name: 'Rude Awakening',
        icon: 'assets/icons/fc767.png',
        description: 'You woke him: 158% ATK with a 10% chance to STUN for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.58 },
          { type: 'stun', chance: 0.1, turns: 1 },
        ],
      },
      {
        id: 'five_more_minutes', name: 'Five More Minutes',
        icon: 'assets/icons/fc1112.png',
        description: 'Roll over: heals 18% max HP and takes 15% less damage for 1 turn.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.18 },
          { type: 'buff', stat: 'damageTaken', mult: 0.85, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Deep Sleeper',
      icon: 'assets/icons/fc856.png',
      description: 'Naps through the pain: below 30% HP, heals 8% max HP at turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp >= 0.3) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.08));
          if (healed <= 0) return null;
          return {
            label: 'Deep Sleeper',
            message: `${unit.name} snores through it: +${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#7ae87a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'hp', mult: 1.15,
      description: 'Nap Spot: +15% max HP while in the center hex.',
    },
  },

  bear_growler: {
    id: 'bear_growler',
    element: 'wind',
    name: 'Bear Growler',
    title: 'Subwoofer with Claws',
    rarity: 1,
    stats: { hp: 970, atk: 101, def: 72, speed: 94 },
    tint: { body: '#5a5a5a', helm: '#7a7a7a', weapon: '#c8c0b0', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/beargrowleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'low_growl', name: 'Low Growl',
        icon: 'assets/icons/fc1003.png',
        description: 'A chest-deep growl: 89% ATK and -5% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.89 },
          { type: 'debuff', stat: 'atk', mult: 0.95, turns: 1 },
        ],
      },
      {
        id: 'sonic_snarl', name: 'Sonic Snarl',
        icon: 'assets/icons/fc1084.png',
        description: 'A snarl you feel in your teeth: 122% ATK and drains 10% turn meter.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.22 },
          { type: 'turnMeter', amount: -0.1 },
        ],
      },
      {
        id: 'valley_echo', name: 'Valley Echo',
        icon: 'assets/icons/fc807.png',
        description: 'The valley growls back: 52% ATK to ALL enemies and -4% ATK for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.52 },
          { type: 'debuff', stat: 'atk', mult: 0.96, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Warning Growl',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, ALL enemies lose 2% ATK for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const e of battle.livingUnits(unit.enemyTeam())) {
            e.addStatusEffect({ kind: 'debuff', stat: 'atk', mult: 0.98, turns: 1 });
          }
          return null; // silent — small rolling dread
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.12,
      description: 'Growling Ground: +12% DEF while in a front hex.',
    },
  },

  bear_shieldpaw: {
    id: 'bear_shieldpaw',
    element: 'water',
    name: 'Bear Shieldpaw',
    title: 'A Door That Hits Back',
    rarity: 2,
    stats: { hp: 1180, atk: 112, def: 96, speed: 86 },
    tint: { body: '#5a6a7a', helm: '#7a8a9a', weapon: '#c8c0b0', shield: '#8a9ab8', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearshieldpawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'paw_block_counter', name: 'Paw Block Counter',
        icon: 'assets/icons/fc854.png',
        description: 'Catch and return: 98% ATK, guarding: takes 5% less damage until next turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.98 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.95, turns: 1 },
        ],
      },
      {
        id: 'door_slam', name: 'Door Slam',
        icon: 'assets/icons/fc1476.png',
        description: 'Shut the door on them: 134% ATK and -10% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.34 },
          { type: 'turnMeter', amount: -0.1 },
        ],
      },
      {
        id: 'den_defense', name: 'Den Defense',
        icon: 'assets/icons/fc855.png',
        description: 'Nobody gets past: front-hex allies gain +14% DEF and 2% of his max HP regen for 2 turns.',
        cooldown: 6, targeting: 'front-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.14, turns: 2 },
          { type: 'hot', pct: 0.02, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Shield Paw',
      icon: 'assets/icons/fc856.png',
      description: 'At turn start, raises the paw: takes 6% less damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.94, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'hp', mult: 1.15,
      description: 'Den Door: +15% max HP while in a front hex.',
    },
  },

  bear_salmoncaller: {
    id: 'bear_salmoncaller',
    element: 'water',
    name: 'Bear Salmoncaller',
    title: 'The Run Comes When She Sings',
    rarity: 2,
    stats: { hp: 1060, atk: 118, def: 80, speed: 96 },
    tint: { body: '#7a8a9a', helm: '#9aaab8', weapon: '#a8d8e8', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearsalmoncalleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'spawn_surge', name: 'Spawn Surge',
        icon: 'assets/icons/fc819.png',
        description: 'A silver surge: 101% ATK and -6% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.01 },
          { type: 'turnMeter', amount: -0.06 },
        ],
      },
      {
        id: 'leaping_run', name: 'Leaping Run',
        icon: 'assets/icons/fc1622.png',
        description: 'The run arrives all at once: 137% ATK, and the school carries her: +8% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.37 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.08 },
        ],
      },
      {
        id: 'great_spawning', name: 'Great Spawning',
        icon: 'assets/icons/fc1112.png',
        description: 'The river gives: ALL allies heal 50% of ATK and gain 6% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.5 },
          { type: 'turnMeter', amount: 0.06 },
        ],
      },
    ],
    passive: {
      name: 'Salmon Run',
      icon: 'assets/icons/fc882.png',
      description: 'Whenever an ally is healed, that ally also gains 3% turn meter.',
      hooks: {
        onAllyHealed(unit, healedUnit) {
          if (healedUnit === unit) return;
          healedUnit.turnMeter = Math.min(CONFIG.TURN_METER_MAX,
            healedUnit.turnMeter + CONFIG.TURN_METER_MAX * 0.03);
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'hp', mult: 1.12,
      description: 'Riverbank: +12% max HP while in a back hex.',
    },
  },

  bear_emberpelt: {
    id: 'bear_emberpelt',
    element: 'fire',
    name: 'Bear Emberpelt',
    title: 'Warm for the Wrong Reasons',
    rarity: 2,
    stats: { hp: 1090, atk: 120, def: 84, speed: 93 },
    tint: { body: '#8a4a2a', helm: '#a86a3a', weapon: '#e8843a', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearemberpeltidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'smolder_swipe', name: 'Smolder Swipe',
        icon: 'assets/icons/fc981.png',
        description: 'A smoking swipe: 96% ATK plus an 11% ATK burn for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
          { type: 'dot', pct: 0.11, turns: 2 },
        ],
      },
      {
        id: 'pelt_flare', name: 'Pelt Flare',
        icon: 'assets/icons/fc1050.png',
        description: 'The pelt catches: 131% ATK plus an 18% ATK burn for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.31 },
          { type: 'dot', pct: 0.18, turns: 1 },
        ],
      },
      {
        id: 'warmth_of_the_burn', name: 'Warmth of the Burn',
        icon: 'assets/icons/fc1044.png',
        description: 'Heat shared generously: 62% ATK to ALL enemies while the glow mends him 8% max HP.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.62 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.08 },
        ],
      },
    ],
    passive: {
      name: 'Ember Pelt',
      icon: 'assets/icons/fc1052.png',
      description: '+15% DoT damage and takes 5% less damage.',
      hooks: {
        dotBoostAdd: 0.15,
        damageTakenMult() { return 0.95; },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'hp', mult: 1.12,
      description: 'Warm Hollow: +12% max HP while in the center hex.',
    },
  },

  bear_nightmaw: {
    id: 'bear_nightmaw',
    element: 'dark',
    name: 'Bear Nightmaw',
    title: 'The Cave Dreams of Teeth',
    rarity: 2,
    stats: { hp: 1100, atk: 126, def: 82, speed: 98 },
    tint: { body: '#2a2a3a', helm: '#3a3a4a', weapon: '#8a6ab8', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearnightmawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'lightless_bite', name: 'Lightless Bite',
        icon: 'assets/icons/fc1444.png',
        description: 'A bite from pure dark: 99% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.99 },
        ],
      },
      {
        id: 'dream_eater', name: 'Dream Eater',
        icon: 'assets/icons/fc825.png',
        description: 'Feed on their resolve: 139% ATK, healing himself for 30% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.39 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.3 },
        ],
      },
      {
        id: 'cave_dark', name: 'Cave Dark',
        icon: 'assets/icons/fc1084.png',
        description: 'The dark closes in: ALL enemies lose 7% crit chance and 3% ATK for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'critChance', add: -0.07, turns: 1 },
          { type: 'debuff', stat: 'atk', mult: 0.97, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Midnight Appetite',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 20% extra damage to enemies carrying no buffs.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && !target.statusEffects.some((fx) => fx.kind === 'buff') ? 1.2 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.12,
      description: 'Cave Mouth Shadow: +12% damage dealt from a back hex.',
    },
  },

  bear_timberjack: {
    id: 'bear_timberjack',
    element: 'wind',
    name: 'Bear Timberjack',
    title: 'Clears His Own Path',
    rarity: 2,
    stats: { hp: 1120, atk: 122, def: 86, speed: 92 },
    tint: { body: '#7a5a3a', helm: '#9a7a4a', weapon: '#c8c0b0', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/beartimberjackidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'log_swing', name: 'Log Swing',
        icon: 'assets/icons/fc1472.png',
        description: 'Swing the whole log: 127% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.27 },
        ],
      },
      {
        id: 'timber_fall', name: 'Timber Fall',
        icon: 'assets/icons/fc767.png',
        description: 'Drop a trunk across a hex row: 92% ATK and -5% SPD for 1 turn.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.92 },
          { type: 'debuff', stat: 'speed', mult: 0.95, turns: 1 },
        ],
      },
      {
        id: 'clear_cut', name: 'Clear Cut',
        icon: 'assets/icons/fc730.png',
        description: 'Everything comes down: 168% ATK and -12% DEF for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.68 },
          { type: 'debuff', stat: 'def', mult: 0.88, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Lumber Rhythm',
      icon: 'assets/icons/fc882.png',
      description: '+7% chance to take an extra turn after acting.',
      hooks: { extraTurnAdd: 0.07 },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Felling Line: +12% ATK while in a front hex.',
    },
  },

  bear_denwarden: {
    id: 'bear_denwarden',
    element: 'water',
    name: 'Bear Denwarden',
    title: 'The Den Outlasts the Winter',
    rarity: 2,
    stats: { hp: 1200, atk: 110, def: 94, speed: 87 },
    tint: { body: '#4a5a6a', helm: '#6a7a8a', weapon: '#a8a0a8', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/beardenwardenidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'warden_swat', name: 'Warden Swat',
        icon: 'assets/icons/fc1471.png',
        description: 'An evicting swat: 10% of his max HP as damage.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageHpPct', pct: 0.1 },
        ],
      },
      {
        id: 'cave_in_hug', name: 'Cave-In Hug',
        icon: 'assets/icons/fc762.png',
        description: 'An overwhelming embrace: 124% ATK with a 12% chance to STUN for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.24 },
          { type: 'stun', chance: 0.12, turns: 1 },
        ],
      },
      {
        id: 'winter_den', name: 'Winter Den',
        icon: 'assets/icons/fc855.png',
        description: 'Everyone inside: ALL allies take 8% less damage and regenerate 2% of his max HP for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.92, turns: 2 },
          { type: 'hot', pct: 0.02, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Den Warden',
      icon: 'assets/icons/fc856.png',
      description: 'At turn start, tends the most wounded ally: +6% DEF for 1 turn and heals 1% of his max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.06, turns: 1 });
          allies[0].heal(Math.round(unit.maxHp * 0.01));
          return null; // silent — small rolling care
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'hp', mult: 1.18,
      description: 'Den Threshold: +18% max HP while in a front hex.',
    },
  },

  bear_slugger: {
    id: 'bear_slugger',
    element: 'fire',
    name: 'Bear Slugger',
    title: 'Undefeated in Tavern Rules',
    rarity: 2,
    stats: { hp: 1070, atk: 128, def: 78, speed: 97 },
    tint: { body: '#8a6a4a', helm: '#a8845a', weapon: '#c8a878', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearsluggeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'haymaker_paw', name: 'Haymaker Paw',
        icon: 'assets/icons/fc663.png',
        description: 'The old one-two, minus the one: 118% ATK with a 6% chance to STUN for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.18 },
          { type: 'stun', chance: 0.06, turns: 1 },
        ],
      },
      {
        id: 'gut_punch', name: 'Gut Punch',
        icon: 'assets/icons/fc762.png',
        description: 'Right in the wind: 142% ATK and drains 12% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.42 },
          { type: 'turnMeter', amount: -0.12 },
        ],
      },
      {
        id: 'closing_time', name: 'Closing Time',
        icon: 'assets/icons/fc767.png',
        description: 'Everybody out: 172% ATK with a 20% chance to STUN for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.72 },
          { type: 'stun', chance: 0.2, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Heavy Hands',
      icon: 'assets/icons/fc867.png',
      description: '+6% Stun chance on single-target attacks.',
      hooks: { stunAdd: 0.06 },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.15,
      description: 'Ring Corner: +15% ATK while in a front hex.',
    },
  },

  bear_galeclaw: {
    id: 'bear_galeclaw',
    element: 'wind',
    name: 'Bear Galeclaw',
    title: 'Faster Than the Weather',
    rarity: 2,
    stats: { hp: 1040, atk: 124, def: 76, speed: 104 },
    tint: { body: '#6a8a8a', helm: '#8aaaa8', weapon: '#e8e8f8', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/beargaleclawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wind_rake', name: 'Wind Rake',
        icon: 'assets/icons/fc1447.png',
        description: 'A whistling rake: 104% ATK, gliding on: +5% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.04 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.05, turns: 1 },
        ],
      },
      {
        id: 'gale_rush', name: 'Gale Rush',
        icon: 'assets/icons/fc744.png',
        description: 'Arrive with the front: 141% ATK and +6% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.41 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.06 },
        ],
      },
      {
        id: 'claw_cyclone', name: 'Claw Cyclone',
        icon: 'assets/icons/fc729.png',
        description: 'A spinning storm of claws: two hits of 62% ATK to a hex row.',
        cooldown: 6, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.62 },
          { type: 'damage', mult: 0.62 },
        ],
      },
    ],
    passive: {
      name: 'Gale Claws',
      icon: 'assets/icons/fc868.png',
      description: '+10% chance to dodge while in a back hex.',
      hooks: {
        dodgeAdd(unit) {
          return unit.slot && unit.slot.position === POSITION.BACK ? 0.10 : 0;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.12,
      description: 'Weather Side: +12% SPD while in a back hex.',
    },
  },

  bear_herbmother: {
    id: 'bear_herbmother',
    element: 'water',
    name: 'Bear Herbmother',
    title: 'Poultices Strong as Paws',
    rarity: 2,
    stats: { hp: 1110, atk: 114, def: 84, speed: 94 },
    tint: { body: '#6a8a5a', helm: '#8aaa6a', weapon: '#a8c86a', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearherbmotheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'pestle_thump', name: 'Pestle Thump',
        icon: 'assets/icons/fc1471.png',
        description: 'A mortar-and-pestle thump: 97% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.97 },
        ],
      },
      {
        id: 'strong_medicine', name: 'Strong Medicine',
        icon: 'assets/icons/fc1112.png',
        description: 'It tastes terrible and works: heals an ally 16% of her max HP and cleanses their debuffs.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.16 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'grove_remedy', name: 'Grove Remedy',
        icon: 'assets/icons/fc800.png',
        description: 'The whole pharmacopoeia: ALL allies heal 45% of ATK plus 2% of her max HP for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.45 },
          { type: 'hot', pct: 0.02, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Herb Bundles',
      icon: 'assets/icons/fc1003.png',
      description: 'Her healing is 25% stronger.',
      hooks: { healBoostAdd: 0.25 },
    },
    positional: {
      position: POSITION.BACK, stat: 'hp', mult: 1.12,
      description: 'Herb Garden: +12% max HP while in a back hex.',
    },
  },

  bear_drumbelly: {
    id: 'bear_drumbelly',
    element: 'fire',
    name: 'Bear Drumbelly',
    title: 'Percussion Section of One',
    rarity: 2,
    stats: { hp: 1150, atk: 116, def: 88, speed: 90 },
    tint: { body: '#a87a4a', helm: '#c89a5a', weapon: '#c8b898', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/beardrumbellyidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'belly_bounce', name: 'Belly Bounce',
        icon: 'assets/icons/fc762.png',
        description: 'Bounce them off the belly: 11% of his max HP as damage.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damageHpPct', pct: 0.11 },
        ],
      },
      {
        id: 'resonant_slam', name: 'Resonant Slam',
        icon: 'assets/icons/fc767.png',
        description: 'A slam you can hum along to: 133% ATK and -8% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.33 },
          { type: 'turnMeter', amount: -0.08 },
        ],
      },
      {
        id: 'festival_beat', name: 'Festival Beat',
        icon: 'assets/icons/fc869.png',
        description: 'The good drum: ALL allies gain +8% ATK and 4% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.08, turns: 2 },
          { type: 'turnMeter', amount: 0.04 },
        ],
      },
    ],
    passive: {
      name: 'Belly Drum',
      icon: 'assets/icons/fc882.png',
      description: 'A full belly sings: whenever he is healed, gains +5% ATK for 2 turns.',
      hooks: {
        onAllyHealed(unit, healedUnit) {
          if (healedUnit !== unit) return;
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.05, turns: 2 });
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'hp', mult: 1.15,
      description: 'Drum Circle Middle: +15% max HP while in the center hex.',
    },
  },

  bear_patriarch: {
    id: 'bear_patriarch',
    element: 'fire',
    name: 'Bear Patriarch',
    title: 'The Valley Remembers His Father',
    rarity: 3,
    stats: { hp: 1450, atk: 158, def: 100, speed: 94 },
    tint: { body: '#7a5a3a', helm: '#e8c83a', weapon: '#d8d8e0', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearpatriarchidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'patriarchs_swat', name: 'Patriarch\'s Swat',
        icon: 'assets/icons/fc1447.png',
        description: 'A swat with generations behind it: 126% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.26 },
        ],
      },
      {
        id: 'lay_down_the_law', name: 'Lay Down the Law',
        icon: 'assets/icons/fc730.png',
        description: 'The old law: 156% ATK, -10% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.56 },
          { type: 'debuff', stat: 'atk', mult: 0.9, turns: 2 },
        ],
      },
      {
        id: 'elders_blessing', name: 'Elder\'s Blessing',
        icon: 'assets/icons/fc869.png',
        description: 'The line endures: ALL allies gain +8% ATK for 2 turns and heal 3% of his max HP over 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.08, turns: 2 },
          { type: 'hot', pct: 0.03, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Patriarch\'s Watch',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, ALL allies gain +4% ATK for 1 turn and heal 0.5% of his max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const ally of battle.livingUnits(unit.team)) {
            ally.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.04, turns: 1 });
            ally.heal(Math.round(unit.maxHp * 0.005));
          }
          return null; // silent — small rolling stewardship
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'hp', mult: 1.15,
      description: 'Family Seat: +15% max HP while in the center hex.',
    },
  },

  bear_frostmane: {
    id: 'bear_frostmane',
    element: 'water',
    name: 'Bear Frostmane',
    title: 'Winter Kept as a Pet',
    rarity: 3,
    stats: { hp: 1380, atk: 162, def: 98, speed: 96 },
    tint: { body: '#a8c8d8', helm: '#c8e8f8', weapon: '#a8d8e8', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearfrostmaneidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rime_swat', name: 'Rime Swat',
        icon: 'assets/icons/fc1444.png',
        description: 'A frost-caked swat: 105% ATK and -6% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.05 },
          { type: 'debuff', stat: 'speed', mult: 0.94, turns: 1 },
        ],
      },
      {
        id: 'frozen_hug', name: 'Frozen Hug',
        icon: 'assets/icons/fc762.png',
        description: 'Affection at absolute zero: 144% ATK with a 22% chance to STUN for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.44 },
          { type: 'stun', chance: 0.22, turns: 1 },
        ],
      },
      {
        id: 'manes_blizzard', name: 'Mane\'s Blizzard',
        icon: 'assets/icons/fc1044.png',
        description: 'Shake out the mane: 66% ATK to ALL enemies and -10% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.66 },
          { type: 'debuff', stat: 'speed', mult: 0.9, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Frostmane',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 12% less damage while any enemy is slowed.',
      hooks: {
        damageTakenMult(unit) {
          if (typeof Battle === 'undefined' || !Battle.active) return 1;
          return Battle.active.livingUnits(unit.enemyTeam()).some((e) =>
            e.statusEffects.some((fx) => fx.kind === 'debuff' && fx.stat === 'speed'))
            ? 0.88 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'hp', mult: 1.15,
      description: 'Cold Front: +15% max HP while in a front hex.',
    },
  },

  bear_thunderhide: {
    id: 'bear_thunderhide',
    element: 'wind',
    name: 'Bear Thunderhide',
    title: 'Weather System, Self-Contained',
    rarity: 3,
    stats: { hp: 1420, atk: 156, def: 102, speed: 92 },
    tint: { body: '#5a5a8a', helm: '#7a7aa8', weapon: '#e8e84a', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearthunderhideidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'static_swat', name: 'Static Swat',
        icon: 'assets/icons/fc1030.png',
        description: 'A crackling swat: 107% ATK and drains 7% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.07 },
          { type: 'turnMeter', amount: -0.07 },
        ],
      },
      {
        id: 'thunder_roll', name: 'Thunder Roll',
        icon: 'assets/icons/fc767.png',
        description: 'Roll through a hex row like weather: 12% of his max HP as damage.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damageHpPct', pct: 0.12 },
        ],
      },
      {
        id: 'stormfront_hide', name: 'Stormfront Hide',
        icon: 'assets/icons/fc854.png',
        description: 'Wear the storm: takes 30% less damage for 2 turns while sparks mend 4% max HP over 2 turns.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.7, turns: 2 },
          { type: 'hot', pct: 0.04, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Thunder Hide',
      icon: 'assets/icons/fc882.png',
      description: 'At turn start, static grounds through ALL enemies for 1% of his max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.maxHp * 0.01));
          for (const e of enemies) e.takeDamage(amount);
          return {
            label: 'Thunder Hide',
            message: `${unit.name}'s static grounds through the field.`,
            floats: enemies.map((e) => ({ target: e, text: `-${amount}`, color: '#e8e84a' })),
          };
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'hp', mult: 1.18,
      description: 'Storm Shelter: +18% max HP while in a front hex.',
    },
  },

  bear_ancientroot: {
    id: 'bear_ancientroot',
    element: 'water',
    name: 'Bear Ancientroot',
    title: 'Older Than the Path Through',
    rarity: 3,
    stats: { hp: 1500, atk: 150, def: 104, speed: 88 },
    tint: { body: '#4a5a3a', helm: '#6a7a4a', weapon: '#8a9a7a', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearancientrootidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'root_heave', name: 'Root Heave',
        icon: 'assets/icons/fc1472.png',
        description: 'Heave a root the size of a road: 13% of his max HP as damage.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damageHpPct', pct: 0.13 },
        ],
      },
      {
        id: 'sap_surge', name: 'Sap Surge',
        icon: 'assets/icons/fc1112.png',
        description: 'Old sap rises: heals an ally 18% of his max HP and grants +12% DEF for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.18 },
          { type: 'buff', stat: 'def', mult: 1.12, turns: 2 },
        ],
      },
      {
        id: 'grove_awakening', name: 'Grove Awakening',
        icon: 'assets/icons/fc855.png',
        description: 'The grove stands up: ALL allies gain +12% DEF and regenerate 2.5% of his max HP for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.12, turns: 2 },
          { type: 'hot', pct: 0.025, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Ancient Roots',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, every ally below 70% HP draws 2% of his max HP through the roots.',
      hooks: {
        onTurnStart(unit, battle) {
          const thirsty = battle.livingUnits(unit.team)
            .filter((u) => u.hp / u.maxHp < 0.7);
          if (thirsty.length === 0) return null;
          let total = 0;
          for (const ally of thirsty) total += ally.heal(Math.round(unit.maxHp * 0.02));
          if (total <= 0) return null;
          return {
            label: 'Ancient Roots',
            message: `${unit.name}'s roots carry ${total} HP to the thirsty.`,
            floats: [],
          };
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'hp', mult: 1.2,
      description: 'Heartwood: +20% max HP while in the center hex.',
    },
  },

  bear_flamemaw: {
    id: 'bear_flamemaw',
    element: 'fire',
    name: 'Bear Flamemaw',
    title: 'Eats Campfires Whole',
    rarity: 3,
    stats: { hp: 1360, atk: 166, def: 94, speed: 98 },
    tint: { body: '#8a3a1a', helm: '#e8632a', weapon: '#f8a83a', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearflamemawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'coalbite', name: 'Coalbite',
        icon: 'assets/icons/fc981.png',
        description: 'A glowing bite: 110% ATK plus a 9% ATK burn for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.1 },
          { type: 'dot', pct: 0.09, turns: 2 },
        ],
      },
      {
        id: 'swallow_the_bonfire', name: 'Swallow the Bonfire',
        icon: 'assets/icons/fc1050.png',
        description: 'Down in one: heals himself 14% max HP and his next breath scorches: 128% ATK plus a 22% ATK burn for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.28 },
          { type: 'dot', pct: 0.22, turns: 1 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.14 },
        ],
      },
      {
        id: 'mawfire', name: 'Mawfire',
        icon: 'assets/icons/fc1044.png',
        description: 'Open the furnace: 72% ATK to ALL enemies plus a 14% ATK burn for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.72 },
          { type: 'dot', pct: 0.14, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Flame Maw',
      icon: 'assets/icons/fc1093.png',
      description: '+20% DoT damage, and devouring flame mends: +10% Healing.',
      hooks: { dotBoostAdd: 0.20, healBoostAdd: 0.10 },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Fire Pit Throne: +12% ATK while in the center hex.',
    },
  },

  bear_sunmother: {
    id: 'bear_sunmother',
    element: 'light',
    name: 'Bear Sunmother',
    title: 'Every Cub Counted at Dusk',
    rarity: 3,
    stats: { hp: 1440, atk: 152, def: 96, speed: 95 },
    tint: { body: '#e8d8a8', helm: '#f8e8c8', weapon: '#f8d86a', skin: '#d8b898' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearsunmotheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'gilded_swat', name: 'Gilded Swat',
        icon: 'assets/icons/fc1447.png',
        description: 'A golden swat: 99% ATK, and the light lifts her: heals 8% of her max HP.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.99 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.08 },
        ],
      },
      {
        id: 'gather_the_cubs', name: 'Gather the Cubs',
        icon: 'assets/icons/fc1112.png',
        description: 'Everyone accounted for: heals an ally 20% of her max HP and grants 8% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.2 },
          { type: 'turnMeter', amount: 0.08 },
        ],
      },
      {
        id: 'long_summer', name: 'Long Summer',
        icon: 'assets/icons/fc800.png',
        description: 'A season of plenty: ALL allies heal 40% of ATK, regenerate 2% of her max HP for 3 turns, and gain +6% DEF for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.4 },
          { type: 'hot', pct: 0.02, turns: 3 },
          { type: 'buff', stat: 'def', mult: 1.06, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Sun Mother',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, ALL allies heal 1% of her max HP and gain 2% turn meter.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const ally of battle.livingUnits(unit.team)) {
            ally.heal(Math.round(unit.maxHp * 0.01));
            if (ally !== unit) {
              ally.turnMeter = Math.min(CONFIG.TURN_METER_MAX,
                ally.turnMeter + CONFIG.TURN_METER_MAX * 0.02);
            }
          }
          return null; // silent — small rolling warmth
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'hp', mult: 1.15,
      description: 'Sunning Ledge: +15% max HP while in the center hex.',
    },
  },

  // ---- Feline cohort (the Meadow) -----------------------------------------
  // Procedural placeholder art renders until real idle sheets land at the
  // conventional flat paths (assets/heroes/cat<role>idle.png).

  cat_mouser: {
    id: 'cat_mouser',
    element: 'wind',
    name: 'Cat Mouser',
    title: 'Employed, Unlike Most Cats',
    rarity: 1,
    stats: { hp: 700, atk: 113, def: 56, speed: 106 },
    tint: { body: '#8a8a7a', helm: '#a8a89a', weapon: '#c8c0b0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catmouseridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'quick_bat', name: 'Quick Bat',
        icon: 'assets/icons/fc663.png',
        description: 'A batting paw: 93% ATK that flicks away 4% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.93 },
          { type: 'turnMeter', amount: -0.04 },
        ],
      },
      {
        id: 'corner_trap', name: 'Corner Trap',
        icon: 'assets/icons/fc825.png',
        description: 'Nowhere left to run: 134% ATK — 30% more against slowed or hasted prey.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.34, bonusVs: { stat: 'speed', mult: 1.3 } },
        ],
      },
      {
        id: 'pest_control', name: 'Pest Control',
        icon: 'assets/icons/fc744.png',
        description: 'Strictly business: 184% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.84 },
        ],
      },
    ],
    passive: {
      name: 'Mouse Sense',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 18% extra damage to enemies below 30% turn meter.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.turnMeter < CONFIG.TURN_METER_MAX * 0.3 ? 1.18 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.12,
      description: 'Skirting Board: +12% SPD while in a back hex.',
    },
  },

  cat_angler: {
    id: 'cat_angler',
    element: 'water',
    name: 'Cat Angler',
    title: 'Paws Never Get Wet',
    rarity: 1,
    stats: { hp: 740, atk: 109, def: 60, speed: 100 },
    tint: { body: '#6a7a8a', helm: '#8a9aa8', weapon: '#a8d8e8', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catangleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'hooked_claw', name: 'Hooked Claw',
        icon: 'assets/icons/fc1444.png',
        description: 'A fish-hook swipe: 98% ATK that reels in 5% turn meter for herself.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.98 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.05 },
        ],
      },
      {
        id: 'patient_cast', name: 'Patient Cast',
        icon: 'assets/icons/fc862.png',
        description: 'Read the water: the target takes +22% damage for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'damageTaken', mult: 1.22, turns: 2 },
        ],
      },
      {
        id: 'perfect_catch', name: 'Perfect Catch',
        icon: 'assets/icons/fc734.png',
        description: 'The one she waited for: 172% ATK — 40% more against exposed (marked) prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.72, bonusVs: { stat: 'damageTaken', mult: 1.4 } },
        ],
      },
    ],
    passive: {
      name: 'Anglers Focus',
      icon: 'assets/icons/fc882.png',
      description: 'While above 80% HP, gains +12% crit chance for 1 turn at turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp <= 0.8) return null;
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.12, turns: 1 });
          return null; // silent — small rolling focus
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Riverbank Perch: +12% ATK while in a back hex.',
    },
  },

  cat_hearthcat: {
    id: 'cat_hearthcat',
    element: 'fire',
    name: 'Cat Hearthcat',
    title: 'Owns the Fireplace, Rents It Out',
    rarity: 1,
    stats: { hp: 780, atk: 105, def: 66, speed: 95 },
    tint: { body: '#c86a3a', helm: '#e88a4a', weapon: '#e8d8a8', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/cathearthcatidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'warm_swat', name: 'Warm Swat',
        icon: 'assets/icons/fc663.png',
        description: 'A toasty swat: 100% ATK plus a 6% ATK singe for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'dot', pct: 0.06, turns: 1 },
        ],
      },
      {
        id: 'coal_flick', name: 'Coal Flick',
        icon: 'assets/icons/fc981.png',
        description: 'Flick a live coal: 121% ATK plus a 15% ATK burn for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.21 },
          { type: 'dot', pct: 0.15, turns: 1 },
        ],
      },
      {
        id: 'hearth_glow', name: 'Hearth Glow',
        icon: 'assets/icons/fc1112.png',
        description: 'Share the warm spot: ALL allies heal 40% of ATK and gain +4% ATK for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.4 },
          { type: 'buff', stat: 'atk', mult: 1.04, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Hearth Warmth',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, mends 1.5% max HP and gains +3% crit chance for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.heal(Math.round(unit.maxHp * 0.015));
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.03, turns: 1 });
          return null; // silent — small rolling comfort
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'hp', mult: 1.1,
      description: 'Fireplace Rug: +10% max HP while in the center hex.',
    },
  },

  cat_alleyscrapper: {
    id: 'cat_alleyscrapper',
    element: 'fire',
    name: 'Cat Alleyscrapper',
    title: 'Eight Lives of Experience',
    rarity: 1,
    stats: { hp: 760, atk: 112, def: 62, speed: 98 },
    tint: { body: '#5a5a5a', helm: '#7a7a6a', weapon: '#c8c0b0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catalleyscrapperidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'scrap_swipe', name: 'Scrap Swipe',
        icon: 'assets/icons/fc663.png',
        description: 'A no-rules swipe: 105% ATK and -4% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.05 },
          { type: 'debuff', stat: 'atk', mult: 0.96, turns: 1 },
        ],
      },
      {
        id: 'trash_lid_bash', name: 'Trash Lid Bash',
        icon: 'assets/icons/fc854.png',
        description: 'The alley provides: 129% ATK with an 8% chance to STUN for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.29 },
          { type: 'stun', chance: 0.08, turns: 1 },
        ],
      },
      {
        id: 'yowling_fury', name: 'Yowling Fury',
        icon: 'assets/icons/fc744.png',
        description: 'All claws at once: three cuts of 54% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.54 },
          { type: 'damage', mult: 0.54 },
          { type: 'damage', mult: 0.54 },
        ],
      },
    ],
    passive: {
      name: 'Ninth Life',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 40% less damage while below 15% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.alive && unit.hp / unit.maxHp < 0.15 ? 0.6 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Alley Mouth: +12% ATK while in a front hex.',
    },
  },

  cat_birdwatcher: {
    id: 'cat_birdwatcher',
    element: 'wind',
    name: 'Cat Birdwatcher',
    title: 'Chirps Back, Insultingly',
    rarity: 1,
    stats: { hp: 720, atk: 111, def: 58, speed: 103 },
    tint: { body: '#7a8a6a', helm: '#9aaa7a', weapon: '#c8c0b0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catbirdwatcheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'window_pounce', name: 'Window Pounce',
        icon: 'assets/icons/fc1444.png',
        description: 'Through the curtain: 102% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.02 },
          { type: 'turnMeter', amount: -0.03 },
        ],
      },
      {
        id: 'feather_snatch', name: 'Feather Snatch',
        icon: 'assets/icons/fc825.png',
        description: 'Almost had it: 140% ATK and steals 8% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.4 },
          { type: 'turnMeter', amount: -0.08 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.08 },
        ],
      },
      {
        id: 'chatter_burst', name: 'Chatter Burst',
        icon: 'assets/icons/fc1084.png',
        description: 'That maddening chirp: ALL enemies lose 5% ATK and 2% turn meter.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'atk', mult: 0.95, turns: 1 },
          { type: 'turnMeter', amount: -0.02 },
        ],
      },
    ],
    passive: {
      name: 'Bird Watcher',
      icon: 'assets/icons/fc862.png',
      description: 'Watches from cover: +25% damage to back-row enemies while she holds a back hex.',
      hooks: {
        damageDealtMult(unit, target) {
          return unit.slot && unit.slot.position === POSITION.BACK && target && target.slot && target.slot.position === POSITION.BACK ? 1.25 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Window Sill: +15% ATK while in a back hex.',
    },
  },

  cat_pouncer: {
    id: 'cat_pouncer',
    element: 'water',
    name: 'Cat Pouncer',
    title: 'Physics-Defying Since Kittenhood',
    rarity: 1,
    stats: { hp: 730, atk: 114, def: 57, speed: 105 },
    tint: { body: '#4a6a8a', helm: '#6a8aa8', weapon: '#c8c0b0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catpounceridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wiggle_pounce', name: 'Wiggle Pounce',
        icon: 'assets/icons/fc763.png',
        description: 'The tell-tale wiggle, then: 108% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.08 },
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
      {
        id: 'ceiling_drop', name: 'Ceiling Drop',
        icon: 'assets/icons/fc825.png',
        description: 'From an impossible angle: 149% ATK with a 10% chance to STUN for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.49 },
          { type: 'stun', chance: 0.1, turns: 1 },
        ],
      },
      {
        id: 'endless_energy', name: 'Endless Energy',
        icon: 'assets/icons/fc882.png',
        description: 'The zoomies, weaponized: +25% SPD for 2 turns and 20% turn meter.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.25, turns: 2 },
          { type: 'turnMeter', amount: 0.2 },
        ],
      },
    ],
    passive: {
      name: 'Pounce Timing',
      icon: 'assets/icons/fc867.png',
      description: 'Deals 25% extra damage to enemies above 90% turn meter.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.turnMeter > CONFIG.TURN_METER_MAX * 0.9 ? 1.25 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.12,
      description: 'Launch Pad: +12% SPD while in a back hex.',
    },
  },

  cat_bellringer: {
    id: 'cat_bellringer',
    element: 'water',
    name: 'Cat Bellringer',
    title: 'The Bell Was Their Idea',
    rarity: 1,
    stats: { hp: 750, atk: 107, def: 63, speed: 99 },
    tint: { body: '#8a7a9a', helm: '#a89ab8', weapon: '#e8c83a', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catbellringeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bell_chime', name: 'Bell Chime',
        icon: 'assets/icons/fc1003.png',
        description: 'A resonant strike: 90% ATK and -6% turn meter... they hate the bell.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'turnMeter', amount: -0.06 },
        ],
      },
      {
        id: 'curfew_toll', name: 'Curfew Toll',
        icon: 'assets/icons/fc1084.png',
        description: 'The hour is late: ALL enemies lose 5% turn meter.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
      {
        id: 'midnight_peal', name: 'Midnight Peal',
        icon: 'assets/icons/fc767.png',
        description: 'The big bell: 145% ATK and -18% turn meter.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.45 },
          { type: 'turnMeter', amount: -0.18 },
        ],
      },
    ],
    passive: {
      name: 'Bell Toll',
      icon: 'assets/icons/fc882.png',
      description: 'At turn start, a random enemy loses 3% turn meter.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          target.turnMeter = Math.max(0, target.turnMeter - CONFIG.TURN_METER_MAX * 0.03);
          return null; // silent — small rolling toll
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'speed', mult: 1.1,
      description: 'Bell Tower: +10% SPD while in the center hex.',
    },
  },

  cat_emberchaser: {
    id: 'cat_emberchaser',
    element: 'fire',
    name: 'Cat Emberchaser',
    title: 'Chases Sparks, Catches Some',
    rarity: 1,
    stats: { hp: 710, atk: 115, def: 55, speed: 104 },
    tint: { body: '#a8542a', helm: '#c8743a', weapon: '#f8a83a', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catemberchaseridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'spark_swat', name: 'Spark Swat',
        icon: 'assets/icons/fc981.png',
        description: 'Bat a live spark: 97% ATK plus a 9% ATK singe for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.97 },
          { type: 'dot', pct: 0.09, turns: 1 },
        ],
      },
      {
        id: 'ember_dash', name: 'Ember Dash',
        icon: 'assets/icons/fc744.png',
        description: 'A streak of orange: 143% ATK, carried onward: +7% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.43 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.07 },
        ],
      },
      {
        id: 'spark_shower', name: 'Spark Shower',
        icon: 'assets/icons/fc1044.png',
        description: 'Scatter the fire: 57% ATK to ALL enemies plus a 7% ATK singe for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.57 },
          { type: 'dot', pct: 0.07, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Chase the Spark',
      icon: 'assets/icons/fc868.png',
      description: 'Gains +7% SPD and +8% crit damage for 1 turn at each turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.07, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.08, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.12,
      description: 'Spark Trail: +12% damage dealt from a back hex.',
    },
  },

  cat_longtail: {
    id: 'cat_longtail',
    element: 'wind',
    name: 'Cat Longtail',
    title: 'Balance Is a Birthright',
    rarity: 1,
    stats: { hp: 725, atk: 110, def: 59, speed: 102 },
    tint: { body: '#9a8a7a', helm: '#b8a89a', weapon: '#c8c0b0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catlongtailidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'tail_lash', name: 'Tail Lash',
        icon: 'assets/icons/fc1447.png',
        description: 'A whip of the tail: 96% ATK and -3% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
          { type: 'debuff', stat: 'speed', mult: 0.97, turns: 1 },
        ],
      },
      {
        id: 'high_wire_strike', name: 'High-Wire Strike',
        icon: 'assets/icons/fc825.png',
        description: 'From the fence top: 139% ATK, landing light: +6% SPD for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.39 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.06, turns: 2 },
        ],
      },
      {
        id: 'nimble_recovery', name: 'Nimble Recovery',
        icon: 'assets/icons/fc854.png',
        description: 'Always lands standing: cleanses own debuffs and gains 15% turn meter.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'cleanse' },
          { type: 'turnMeter', amount: 0.15 },
        ],
      },
    ],
    passive: {
      name: 'Tail Balance',
      icon: 'assets/icons/fc882.png',
      description: '+13% chance to dodge while above 60% HP.',
      hooks: {
        dodgeAdd(unit) {
          return unit.hp / unit.maxHp > 0.6 ? 0.13 : 0;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'speed', mult: 1.12,
      description: 'Fence Line: +12% SPD while in the center hex.',
    },
  },

  cat_swashbuckler: {
    id: 'cat_swashbuckler',
    element: 'water',
    name: 'Cat Swashbuckler',
    title: 'Boots Sold Separately',
    rarity: 2,
    stats: { hp: 840, atk: 132, def: 66, speed: 110 },
    tint: { body: '#3a5a8a', helm: '#e8433a', weapon: '#d8d8e0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catswashbuckleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'flashing_point', name: 'Flashing Point',
        icon: 'assets/icons/fc1587.png',
        description: 'A gleaming thrust: 107% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.07 },
          { type: 'turnMeter', amount: -0.06 },
        ],
      },
      {
        id: 'riposte_flourish', name: 'Riposte Flourish',
        icon: 'assets/icons/fc1454.png',
        description: 'Parry, wink, reply: 146% ATK and +10% crit chance for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.46 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.1, turns: 1 },
        ],
      },
      {
        id: 'grand_duel', name: 'Grand Duel',
        icon: 'assets/icons/fc728.png',
        description: 'The finishing lesson: 196% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.96 },
        ],
      },
    ],
    passive: {
      name: 'En Garde',
      icon: 'assets/icons/fc867.png',
      description: 'Gains +8% crit chance and +12% crit damage for 1 turn at each turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.08, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.12, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Duelling Ground: +12% ATK while in a front hex.',
    },
  },

  cat_shadowpaw: {
    id: 'cat_shadowpaw',
    element: 'dark',
    name: 'Cat Shadowpaw',
    title: 'Was Never Actually There',
    rarity: 2,
    stats: { hp: 820, atk: 138, def: 60, speed: 114 },
    tint: { body: '#1a1a2a', helm: '#3a3a4a', weapon: '#8a6ab8', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catshadowpawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'umbral_swipe', name: 'Umbral Swipe',
        icon: 'assets/icons/fc1444.png',
        description: 'A swipe from a shadow that was empty: 111% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.11 },
          { type: 'turnMeter', amount: -0.04 },
        ],
      },
      {
        id: 'shadow_pin', name: 'Shadow Pin',
        icon: 'assets/icons/fc825.png',
        description: 'Pin their shadow to the ground: 136% ATK and -14% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.36 },
          { type: 'turnMeter', amount: -0.14 },
        ],
      },
      {
        id: 'total_eclipse', name: 'Total Eclipse',
        icon: 'assets/icons/fc734.png',
        description: 'The light gives up: 182% ATK — 35% more against enemies below half turn meter.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.82 },
        ],
      },
    ],
    passive: {
      name: 'Shadow Meld',
      icon: 'assets/icons/fc862.png',
      description: '+8% chance to drain 20% AP on attack.',
      hooks: { apDrainAdd: 0.08 },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.15,
      description: 'Umbra: +15% damage dealt from a back hex.',
    },
  },

  cat_lynxarcher: {
    id: 'cat_lynxarcher',
    element: 'wind',
    name: 'Cat Lynxarcher',
    title: 'Sees the Arrow Land First',
    rarity: 2,
    stats: { hp: 830, atk: 136, def: 62, speed: 108 },
    tint: { body: '#8a7a5a', helm: '#a89a6a', weapon: '#b8a878', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catlynxarcheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'tufted_shot', name: 'Tufted Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'A whisker-guided arrow: 109% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.09 },
          { type: 'turnMeter', amount: -0.03 },
        ],
      },
      {
        id: 'lead_the_target', name: 'Lead the Target',
        icon: 'assets/icons/fc1516.png',
        description: 'Aim where they will be: 151% ATK — 25% more against slowed or hasted prey.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.51, bonusVs: { stat: 'speed', mult: 1.25 } },
        ],
      },
      {
        id: 'skyline_volley', name: 'Skyline Volley',
        icon: 'assets/icons/fc807.png',
        description: 'Arrows over the rooftops: 63% ATK to ALL enemies.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.63 },
          { type: 'turnMeter', amount: -0.03 },
        ],
      },
    ],
    passive: {
      name: 'Lynx Eye',
      icon: 'assets/icons/fc863.png',
      description: 'Gains +20% crit damage and +4% crit chance for 1 turn at each turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.20, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.04, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Rooftop Blind: +15% ATK while in a back hex.',
    },
  },

  cat_pantherblade: {
    id: 'cat_pantherblade',
    element: 'fire',
    name: 'Cat Pantherblade',
    title: 'Silence with an Edge',
    rarity: 2,
    stats: { hp: 860, atk: 140, def: 64, speed: 109 },
    tint: { body: '#2a2a2a', helm: '#4a3a3a', weapon: '#d8d8e0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catpantherbladeidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'velvet_cut', name: 'Velvet Cut',
        icon: 'assets/icons/fc1447.png',
        description: 'You hear it after it lands: 112% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.12 },
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
      {
        id: 'silent_lunge', name: 'Silent Lunge',
        icon: 'assets/icons/fc825.png',
        description: 'Between heartbeats: 154% ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.54 },
          { type: 'turnMeter', amount: -0.1 },
        ],
      },
      {
        id: 'night_execution', name: 'Night Execution',
        icon: 'assets/icons/fc734.png',
        description: 'The quiet ending: 178% ATK plus an 18% ATK bleed for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.78 },
          { type: 'dot', pct: 0.18, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Panther Stalk',
      icon: 'assets/icons/fc862.png',
      description: 'Stalks the unwary: deals 20% extra damage to enemies with no debuffs.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && !target.statusEffects.some((fx) => fx.kind === 'debuff' || fx.kind === 'dot') ? 1.2 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.12,
      description: 'Night Cover: +12% damage dealt from a back hex.',
    },
  },

  cat_tomcat: {
    id: 'cat_tomcat',
    element: 'fire',
    name: 'Cat Tomcat',
    title: 'Loud About Everything',
    rarity: 2,
    stats: { hp: 880, atk: 130, def: 72, speed: 101 },
    tint: { body: '#c88a4a', helm: '#e8a85a', weapon: '#c8c0b0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/cattomcatidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'brash_swipe', name: 'Brash Swipe',
        icon: 'assets/icons/fc663.png',
        description: 'Two big showy swipes: 61% ATK each.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.61 },
          { type: 'damage', mult: 0.61 },
        ],
      },
      {
        id: 'caterwaul', name: 'Caterwaul',
        icon: 'assets/icons/fc1084.png',
        description: 'An unreasonable noise: ALL enemies lose 6% ATK and 4% crit chance for 1 turn.',
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'atk', mult: 0.94, turns: 1 },
          { type: 'debuff', stat: 'critChance', add: -0.04, turns: 1 },
        ],
      },
      {
        id: 'king_of_the_fence', name: 'King of the Fence',
        icon: 'assets/icons/fc730.png',
        description: 'Prove it again: 167% ATK, then swaggers: +10% ATK for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.67 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.1, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Swagger',
      icon: 'assets/icons/fc867.png',
      description: 'Gains +5% ATK and +5% SPD for 1 turn at each turn start.',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.05, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.05, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Fence Top: +12% ATK while in a front hex.',
    },
  },

  cat_silkdancer: {
    id: 'cat_silkdancer',
    element: 'water',
    name: 'Cat Silkdancer',
    title: 'Gravity Signed a Waiver',
    rarity: 2,
    stats: { hp: 810, atk: 128, def: 65, speed: 112 },
    tint: { body: '#b8a8c8', helm: '#d8c8e8', weapon: '#e8e8f8', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catsilkdanceridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'ribbon_step', name: 'Ribbon Step',
        icon: 'assets/icons/fc1447.png',
        description: 'A dancing cut: 103% ATK, flowing on: +4% SPD and 4% meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.03 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.04, turns: 1 },
          { type: 'turnMeter', amount: 0.04 },
        ],
      },
      {
        id: 'veil_spin', name: 'Veil Spin',
        icon: 'assets/icons/fc729.png',
        description: 'A spinning veil across a hex row: 98% ATK and -4% turn meter.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.98 },
          { type: 'turnMeter', amount: -0.04 },
        ],
      },
      {
        id: 'finale_leap', name: 'Finale Leap',
        icon: 'assets/icons/fc882.png',
        description: 'The impossible final pose: +20% SPD for 2 turns, cleansed, and 10% turn meter.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.2, turns: 2 },
          { type: 'cleanse' },
          { type: 'turnMeter', amount: 0.1 },
        ],
      },
    ],
    passive: {
      name: 'Silk Steps',
      icon: 'assets/icons/fc882.png',
      description: '+9% chance to take an extra turn after acting.',
      hooks: { extraTurnAdd: 0.09 },
    },
    positional: {
      position: POSITION.CENTER, stat: 'speed', mult: 1.15,
      description: 'Stage Light: +15% SPD while in the center hex.',
    },
  },

  cat_clockwatcher: {
    id: 'cat_clockwatcher',
    element: 'wind',
    name: 'Cat Clockwatcher',
    title: 'Knows Exactly When Dinner Is',
    rarity: 2,
    stats: { hp: 850, atk: 126, def: 70, speed: 107 },
    tint: { body: '#6a6a8a', helm: '#8a8aa8', weapon: '#e8c83a', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catclockwatcheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'minute_hand', name: 'Minute Hand',
        icon: 'assets/icons/fc1461.png',
        description: 'Right on schedule: 104% ATK and -7% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.04 },
          { type: 'turnMeter', amount: -0.07 },
        ],
      },
      {
        id: 'pendulum_swing', name: 'Pendulum Swing',
        icon: 'assets/icons/fc767.png',
        description: 'Tick, tock: 133% ATK and -16% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.33 },
          { type: 'turnMeter', amount: -0.16 },
        ],
      },
      {
        id: 'stopped_clock', name: 'Stopped Clock',
        icon: 'assets/icons/fc1084.png',
        description: 'Time out: ALL enemies lose 8% turn meter and 4% SPD for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'turnMeter', amount: -0.08 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Clockwork Timing',
      icon: 'assets/icons/fc863.png',
      description: '+5% chance to drain 20% AP on attack.',
      hooks: { apDrainAdd: 0.05 },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.1,
      description: 'Clock Tower: +10% ATK while in the center hex.',
    },
  },

  cat_purrmother: {
    id: 'cat_purrmother',
    element: 'water',
    name: 'Cat Purrmother',
    title: 'The Purr Is Medicinal',
    rarity: 2,
    stats: { hp: 900, atk: 120, def: 76, speed: 100 },
    tint: { body: '#d8c8b8', helm: '#e8d8c8', weapon: '#e8d8a8', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catpurrmotheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'gentle_correction', name: 'Gentle Correction',
        icon: 'assets/icons/fc663.png',
        description: 'Claws in, mostly: 95% ATK and -4% ATK for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'debuff', stat: 'atk', mult: 0.96, turns: 1 },
        ],
      },
      {
        id: 'healing_purr', name: 'Healing Purr',
        icon: 'assets/icons/fc1112.png',
        description: 'The deep purr: heals an ally 14% of her max HP plus 2% regen for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.14 },
          { type: 'hot', pct: 0.02, turns: 2 },
        ],
      },
      {
        id: 'nap_pile', name: 'Nap Pile',
        icon: 'assets/icons/fc800.png',
        description: 'Everyone in the sunbeam: ALL allies heal 42% of ATK and regenerate 1.5% of her max HP for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.42 },
          { type: 'hot', pct: 0.015, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Healing Purr Aura',
      icon: 'assets/icons/fc1003.png',
      description: 'Her healing is 20% stronger.',
      hooks: { healBoostAdd: 0.20 },
    },
    positional: {
      position: POSITION.CENTER, stat: 'hp', mult: 1.12,
      description: 'Sunbeam: +12% max HP while in the center hex.',
    },
  },

  cat_highwaycat: {
    id: 'cat_highwaycat',
    element: 'fire',
    name: 'Cat Highwaycat',
    title: 'Your Meter or Your Life',
    rarity: 2,
    stats: { hp: 845, atk: 134, def: 63, speed: 111 },
    tint: { body: '#4a3a2a', helm: '#6a5a3a', weapon: '#d8d8e0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/cathighwaycatidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'toll_swipe', name: 'Toll Swipe',
        icon: 'assets/icons/fc1444.png',
        description: 'Payment collected: 101% ATK, pocketing 6% turn meter for himself.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.01 },
          { type: 'turnMeter', amount: -0.06 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.06 },
        ],
      },
      {
        id: 'stand_and_deliver', name: 'Stand and Deliver',
        icon: 'assets/icons/fc825.png',
        description: 'The classic line: 144% ATK and -12% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.44 },
          { type: 'turnMeter', amount: -0.12 },
        ],
      },
      {
        id: 'clean_getaway', name: 'Clean Getaway',
        icon: 'assets/icons/fc744.png',
        description: 'Gone before the shout: 158% ATK, escaping with +15% SPD for 1 turn.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.58 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'speed', mult: 1.15, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Highway Toll',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 20% extra damage to enemies above 75% turn meter.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.turnMeter > CONFIG.TURN_METER_MAX * 0.75 ? 1.2 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Ambush Bend: +12% ATK while in a back hex.',
    },
  },

  cat_ratter: {
    id: 'cat_ratter',
    element: 'wind',
    name: 'Cat Ratter',
    title: 'Contract Work, Paid in Kind',
    rarity: 2,
    stats: { hp: 870, atk: 131, def: 68, speed: 105 },
    tint: { body: '#7a6a5a', helm: '#9a8a6a', weapon: '#c8c0b0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catratteridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'terrier_shake', name: 'Terrier Shake',
        icon: 'assets/icons/fc1444.png',
        description: 'Grab and shake: 106% ATK and -6% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.06 },
          { type: 'debuff', stat: 'def', mult: 0.94, turns: 1 },
        ],
      },
      {
        id: 'burrow_flush', name: 'Burrow Flush',
        icon: 'assets/icons/fc724.png',
        description: 'Flush them into the open: 96% ATK to a hex row and -3% turn meter.',
        cooldown: 4, targeting: 'enemy-row', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
          { type: 'turnMeter', amount: -0.03 },
        ],
      },
      {
        id: 'exterminator', name: 'Exterminator',
        icon: 'assets/icons/fc734.png',
        description: 'The contract concludes: 186% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.86 },
          { type: 'turnMeter', amount: -0.05 },
        ],
      },
    ],
    passive: {
      name: 'Born Ratter',
      icon: 'assets/icons/fc867.png',
      description: 'Professional pride: deals 30% extra damage to rats (the Rat King included).',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.def && target.def.id && target.def.id.indexOf('rat') !== -1 ? 1.3 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Granary Post: +12% ATK while in a front hex.',
    },
  },

  cat_tigerlord: {
    id: 'cat_tigerlord',
    element: 'fire',
    name: 'Cat Tigerlord',
    title: 'The Jungle Pays Tribute',
    rarity: 3,
    stats: { hp: 1130, atk: 182, def: 84, speed: 106 },
    tint: { body: '#c8742a', helm: '#2a2a2a', weapon: '#d8d8e0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/cattigerlordidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'tigers_claim', name: 'Tiger\'s Claim',
        icon: 'assets/icons/fc746.png',
        description: 'A ruling stroke: 115% ATK and -5% DEF for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.15 },
          { type: 'debuff', stat: 'def', mult: 0.95, turns: 1 },
        ],
      },
      {
        id: 'burning_stripes', name: 'Burning Stripes',
        icon: 'assets/icons/fc744.png',
        description: 'Stripes in the tall grass: 162% ATK plus a 14% ATK bleed for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.62 },
          { type: 'dot', pct: 0.14, turns: 1 },
        ],
      },
      {
        id: 'kings_hunt', name: 'King\'s Hunt',
        icon: 'assets/icons/fc730.png',
        description: 'The hunt ends where he says: 145% ATK to the front line.',
        cooldown: 7, targeting: 'front-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.45 },
        ],
      },
    ],
    passive: {
      name: 'Apex Stripes',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 10% extra damage, and +5% chance for an extra turn.',
      hooks: {
        damageDealtMult() { return 1.1; },
        extraTurnAdd: 0.05,
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.15,
      description: 'Claimed Ground: +15% ATK while in the center hex.',
    },
  },

  cat_snowlynx: {
    id: 'cat_snowlynx',
    element: 'water',
    name: 'Cat Snowlynx',
    title: 'Winter Fits Her Perfectly',
    rarity: 3,
    stats: { hp: 1090, atk: 176, def: 82, speed: 109 },
    tint: { body: '#d8e0e8', helm: '#e8e8f8', weapon: '#a8d8e8', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catsnowlynxidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'powder_step', name: 'Powder Step',
        icon: 'assets/icons/fc1444.png',
        description: 'Silent over snow: 110% ATK and -4% SPD for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.1 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 1 },
        ],
      },
      {
        id: 'drift_ambush', name: 'Drift Ambush',
        icon: 'assets/icons/fc825.png',
        description: 'The snowbank was her: 159% ATK with a 15% chance to STUN for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.59 },
          { type: 'stun', chance: 0.15, turns: 1 },
        ],
      },
      {
        id: 'white_silence', name: 'White Silence',
        icon: 'assets/icons/fc1044.png',
        description: 'Snowfall swallows sound: ALL enemies lose 7% SPD for 2 turns and 3% turn meter.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'speed', mult: 0.93, turns: 2 },
          { type: 'turnMeter', amount: -0.03 },
        ],
      },
    ],
    passive: {
      name: 'Snow Silence',
      icon: 'assets/icons/fc856.png',
      description: 'At turn start, a random enemy loses 4% SPD for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          target.addStatusEffect({ kind: 'debuff', stat: 'speed', mult: 0.96, turns: 1 });
          return null; // silent — small rolling hush
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Snowline: +15% ATK while in a back hex.',
    },
  },

  cat_cheetahstrike: {
    id: 'cat_cheetahstrike',
    element: 'wind',
    name: 'Cat Cheetahstrike',
    title: 'Arrives Before the Decision',
    rarity: 3,
    stats: { hp: 1050, atk: 186, def: 78, speed: 118 },
    tint: { body: '#d8b04a', helm: '#2a2a2a', weapon: '#c8c0b0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catcheetahstrikeidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'blur_claw', name: 'Blur Claw',
        icon: 'assets/icons/fc1447.png',
        description: 'Too fast to parry: 113% ATK, streaking on: +5% turn meter.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.13 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: 0.05 },
        ],
      },
      {
        id: 'full_sprint', name: 'Full Sprint',
        icon: 'assets/icons/fc744.png',
        description: 'The ground loses: 174% ATK, then must breathe: -8% own turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.74 },
        ],
        selfEffects: [
          { type: 'turnMeter', amount: -0.08 },
        ],
      },
      {
        id: 'sonic_pounce', name: 'Sonic Pounce',
        icon: 'assets/icons/fc763.png',
        description: 'Break the air: 205% ATK with a 12% chance to STUN for 1 turn.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.05 },
          { type: 'stun', chance: 0.12, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Explosive Start',
      icon: 'assets/icons/fc882.png',
      description: 'The first strike of the hunt: +35% damage on her first turn of battle.',
      hooks: {
        onTurnStart(unit) {
          unit._turnCount = (unit._turnCount || 0) + 1;
          return null; // counting silently
        },
        damageDealtMult(unit) {
          return (unit._turnCount || 0) <= 1 ? 1.35 : 1;
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.15,
      description: 'Open Runway: +15% SPD while in a back hex.',
    },
  },

  cat_pumaprowler: {
    id: 'cat_pumaprowler',
    element: 'water',
    name: 'Cat Pumaprowler',
    title: 'The Long Quiet Before',
    rarity: 3,
    stats: { hp: 1160, atk: 170, def: 90, speed: 104 },
    tint: { body: '#8a7a6a', helm: '#a89a8a', weapon: '#c8c0b0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catpumaprowleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'prowling_swipe', name: 'Prowling Swipe',
        icon: 'assets/icons/fc663.png',
        description: 'Patience, then claws: 114% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'punch',
        effects: [
          { type: 'damage', mult: 1.14 },
          { type: 'turnMeter', amount: -0.04 },
        ],
      },
      {
        id: 'ridge_stalk', name: 'Ridge Stalk',
        icon: 'assets/icons/fc862.png',
        description: 'Marked from above: the target takes +28% damage for 1 turn and loses 8% turn meter.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'damageTaken', mult: 1.28, turns: 1 },
          { type: 'turnMeter', amount: -0.08 },
        ],
      },
      {
        id: 'silent_takedown', name: 'Silent Takedown',
        icon: 'assets/icons/fc734.png',
        description: 'The quiet answer: 191% ATK — 35% more against exposed (marked) prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.91, bonusVs: { stat: 'damageTaken', mult: 1.35 } },
        ],
      },
    ],
    passive: {
      name: 'Prowler\'s Patience',
      icon: 'assets/icons/fc856.png',
      description: 'Takes 15% less damage while below 60% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.alive && unit.hp / unit.maxHp < 0.6 ? 0.85 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'hp', mult: 1.12,
      description: 'Ledge Overlook: +12% max HP while in a front hex.',
    },
  },

  cat_lionheart: {
    id: 'cat_lionheart',
    element: 'fire',
    name: 'Cat Lionheart',
    title: 'Courage in a Small Package',
    rarity: 3,
    stats: { hp: 1210, atk: 168, def: 92, speed: 102 },
    tint: { body: '#c89a4a', helm: '#e8b85a', weapon: '#d8d8e0', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catlionheartidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'braveheart_slash', name: 'Braveheart Slash',
        icon: 'assets/icons/fc1587.png',
        description: 'No hesitation: 116% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.16 },
          { type: 'turnMeter', amount: -0.03 },
        ],
      },
      {
        id: 'rallying_roar', name: 'Rallying Roar',
        icon: 'assets/icons/fc869.png',
        description: 'Bigger than he looks: ALL allies gain +9% ATK for 2 turns and 5% turn meter.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.09, turns: 2 },
          { type: 'turnMeter', amount: 0.05 },
        ],
      },
      {
        id: 'lions_share', name: 'Lion\'s Share',
        icon: 'assets/icons/fc730.png',
        description: 'Claim the biggest fight: 176% ATK and -10% ATK for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.76 },
          { type: 'debuff', stat: 'atk', mult: 0.9, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Lion Heart',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, ALL allies gain +5% crit chance for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const ally of battle.livingUnits(unit.team)) {
            ally.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.05, turns: 1 });
          }
          return null; // silent — small rolling courage
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.15,
      description: 'Pride Rock: +15% ATK while in the center hex.',
    },
  },

  cat_moonwhisker: {
    id: 'cat_moonwhisker',
    element: 'light',
    name: 'Cat Moonwhisker',
    title: 'Sees by Light That Is Not There',
    rarity: 3,
    stats: { hp: 1140, atk: 164, def: 86, speed: 107 },
    tint: { body: '#e8e0d8', helm: '#f8e8c8', weapon: '#f8d86a', skin: '#d8c8a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catmoonwhiskeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'moonbeam_swat', name: 'Moonbeam Swat',
        icon: 'assets/icons/fc1447.png',
        description: 'A silvered swat: 100% ATK, gathering light: +5% crit chance for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'turnMeter', amount: -0.04 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.05, turns: 1 },
        ],
      },
      {
        id: 'lunar_blessing', name: 'Lunar Blessing',
        icon: 'assets/icons/fc1112.png',
        description: 'Moonlight mends: heals an ally 13% of her max HP and grants 12% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.13 },
          { type: 'turnMeter', amount: 0.12 },
        ],
      },
      {
        id: 'full_moon_rite', name: 'Full Moon Rite',
        icon: 'assets/icons/fc855.png',
        description: 'The whole pride glows: ALL allies heal 55% of ATK, gain +5% SPD for 2 turns, and 4% turn meter.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.55 },
          { type: 'buff', stat: 'speed', mult: 1.05, turns: 2 },
          { type: 'turnMeter', amount: 0.04 },
        ],
      },
    ],
    passive: {
      name: 'Moonlit Whiskers',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, the most afflicted ally sheds one debuff and gains 5% turn meter.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team);
          let worst = null, count = 0;
          for (const a of allies) {
            const n = a.statusEffects.filter(
              (fx) => fx.kind === 'debuff' || fx.kind === 'dot').length;
            if (n > count) { worst = a; count = n; }
          }
          if (!worst) return null;
          const idx = worst.statusEffects.findIndex(
            (fx) => fx.kind === 'debuff' || fx.kind === 'dot');
          worst.statusEffects.splice(idx, 1);
          worst.turnMeter = Math.min(CONFIG.TURN_METER_MAX,
            worst.turnMeter + CONFIG.TURN_METER_MAX * 0.05);
          return {
            label: 'Moonlit Whiskers',
            message: `${unit.name}'s moonlight frees ${worst.name}.`,
            floats: [{ target: worst, text: 'CLEANSE', color: '#f8d86a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'hp', mult: 1.12,
      description: 'Moonrise Perch: +12% max HP while in a back hex.',
    },
  },

  // ---- Drake cohort (the Volcano) -----------------------------------------
  // Procedural placeholder art renders until real idle sheets land at the
  // conventional flat paths (assets/heroes/drake<role>idle.png).

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
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Nest Ledge: +12% ATK while in a back hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.1,
      description: 'Ashen Hollow: +10% SPD while in a back hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.1,
      description: 'Ember Ring: +10% ATK while in the center hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Vent Cloud: +12% DEF while in the center hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.12,
      description: 'Spring Mouth: +12% DEF while in a back hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.12,
      description: 'Rising Column: +12% SPD while in a back hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'speed', mult: 1.1,
      description: 'Smoke Column: +10% SPD while in the center hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'hp', mult: 1.12,
      description: 'Lava Pool Edge: +12% max HP while in a front hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Fumarole: +12% ATK while in a back hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Cooling Flow: +15% DEF while in a front hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.12,
      description: 'Cinder Drift: +12% SPD while in a back hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'hp', mult: 1.12,
      description: 'Hot Spring Rim: +12% max HP while in a front hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Forge Floor: +12% ATK while in a front hex.',
    },
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
          for (const e of enemies) e.takeDamage(amount);
          return {
            label: 'Pyroclastic Flow',
            message: `${unit.name}'s heat washes the field.`,
            floats: enemies.map((e) => ({ target: e, text: `-${amount}`, color: '#f8a83a' })),
          };
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.15,
      description: 'Flow Front: +15% ATK while in a front hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.12,
      description: 'Cloud Bank: +12% DEF while in a back hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.15,
      description: 'Thermal Column Top: +15% SPD while in a back hex.',
    },
  },

  drake_obsidianfang: {
    id: 'drake_obsidianfang',
    element: 'dark',
    name: 'Drake Obsidianfang',
    title: 'Edges the Mountain Made',
    rarity: 2,
    stats: { hp: 950, atk: 140, def: 68, speed: 106 },
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
    positional: {
      position: POSITION.BACK, stat: 'damage', mult: 1.15,
      description: 'Glass Field: +15% damage dealt from a back hex.',
    },
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
      description: 'Takes 14% less damage while holding a front hex.',
      hooks: {
        damageTakenMult(unit) {
          return unit.slot && unit.slot.position === POSITION.FRONT ? 0.86 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.18,
      description: 'Foundry Gate: +18% DEF while in a front hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Vent Ridge: +12% ATK while in a back hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.15,
      description: 'Crater Throne: +15% ATK while in the center hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.15,
      description: 'Stormline: +15% SPD while in a back hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'hp', mult: 1.15,
      description: 'Vent Mouth: +15% max HP while in a front hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.15,
      description: 'Deep Fissure: +15% ATK while in the center hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.18,
      description: 'Mirror Face: +18% DEF while in a front hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'hp', mult: 1.12,
      description: 'Sunning Stone: +12% max HP while in the center hex.',
    },
  },

  // ---- Twilight cohorts: dark & light 3-star heroes for every race --------
  // Summoned exclusively from Temporal Scrolls, like all Dark/Light heroes.
  // Procedural placeholder art renders until real idle sheets land.

  rat_gravecarver: {
    id: 'rat_gravecarver',
    element: 'dark',
    name: 'Rat Gravecarver',
    title: 'The sentence is the swing.',
    rarity: 3,
    stats: { hp: 1060, atk: 158, def: 78, speed: 96 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_gravecarver/ratgravecarveridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_gravecarver_edge', name: 'Gravecarver\'s Edge',
        icon: 'assets/icons/fc734.png',
        description: 'Two dark cuts: 71% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.71 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'rat_gravecarver_sentence', name: 'Gravecarver\'s Sentence',
        icon: 'assets/icons/fc730.png',
        description: 'Pass judgment: 121% ATK and the target takes +12% damage for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.21 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.12, turns: 1 },
        ],
      },
      {
        id: 'rat_gravecarver_end', name: 'Gravecarver\'s End',
        icon: 'assets/icons/fc728.png',
        description: 'Carry it out: 197% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.97 },
        ],
      },
    ],
    passive: {
      name: 'Gravecarver\'s Due',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 22% extra damage to enemies below 45% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.45 ? 1.22 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  rat_hexweaver: {
    id: 'rat_hexweaver',
    element: 'dark',
    name: 'Rat Hexweaver',
    title: 'Carries every curse worth having.',
    rarity: 3,
    stats: { hp: 1069, atk: 163, def: 81, speed: 98 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_hexweaver/rathexweaveridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_hexweaver_lash', name: 'Hexweaver Lash',
        icon: 'assets/icons/fc1052.png',
        description: 'Two cursed lashes: 72% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.72 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'rat_hexweaver_bane', name: 'Hexweaver Bane',
        icon: 'assets/icons/fc1084.png',
        description: 'A layered curse: 122% ATK, -8% ATK and -4% DEF for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.22 },
          { type: 'debuff', stat: 'atk', mult: 0.92, turns: 2 },
          { type: 'debuff', stat: 'def', mult: 0.96, turns: 2 },
        ],
      },
      {
        id: 'rat_hexweaver_pall', name: 'Hexweaver Pall',
        icon: 'assets/icons/fc1050.png',
        description: 'A pall over everything: 76% ATK to ALL enemies and -3% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.76 },
          { type: 'debuff', stat: 'speed', mult: 0.97, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Hexweaver Craft',
      icon: 'assets/icons/fc1093.png',
      description: 'Curses honed in the dark.',
      hooks: { accuracyAdd: 0.12, dotBoostAdd: 0.08 },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  rat_bloodleech: {
    id: 'rat_bloodleech',
    element: 'dark',
    name: 'Rat Bloodleech',
    title: 'Your vigor, redistributed.',
    rarity: 3,
    stats: { hp: 1078, atk: 168, def: 84, speed: 100 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_bloodleech/ratbloodleechidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_bloodleech_sip', name: 'Bloodleech\'s Sip',
        icon: 'assets/icons/fc1444.png',
        description: 'Two draining touches: 73% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.73 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'rat_bloodleech_feast', name: 'Bloodleech\'s Feast',
        icon: 'assets/icons/fc825.png',
        description: 'Drink deep: 123% ATK, healing himself for 30% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.23 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.3 },
        ],
      },
      {
        id: 'rat_bloodleech_toll', name: 'Bloodleech\'s Toll',
        icon: 'assets/icons/fc1112.png',
        description: 'Tax the living: 67% ATK to ALL enemies while he mends 6% of his max HP.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.67 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.06 },
        ],
      },
    ],
    passive: {
      name: 'Bloodleech Hunger',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, siphons 1.2% of his max HP from a random enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const amount = Math.max(1, Math.round(unit.maxHp * 0.012));
          target.takeDamage(amount);
          unit.heal(amount);
          return null; // silent — small rolling hunger
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  rat_nightfang: {
    id: 'rat_nightfang',
    element: 'dark',
    name: 'Rat Nightfang',
    title: 'The dark keeps its edge honed.',
    rarity: 3,
    stats: { hp: 1087, atk: 173, def: 87, speed: 102 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_nightfang/ratnightfangidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_nightfang_flick', name: 'Nightfang Flick',
        icon: 'assets/icons/fc1447.png',
        description: 'Two flickering cuts: 74% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.74 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'rat_nightfang_waltz', name: 'Nightfang Waltz',
        icon: 'assets/icons/fc1587.png',
        description: 'A step through shadow: 124% ATK and +6% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.24 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.06, turns: 1 },
        ],
      },
      {
        id: 'rat_nightfang_finale', name: 'Nightfang Finale',
        icon: 'assets/icons/fc723.png',
        description: 'The last figure: 188% ATK — 25% more against debuffed prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.88, bonusVs: { kind: 'debuff', mult: 1.25 } },
        ],
      },
    ],
    passive: {
      name: 'Nightfang Poise',
      icon: 'assets/icons/fc862.png',
      description: 'A blade kept perfectly balanced (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.07, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.03, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  rat_doomcrier: {
    id: 'rat_doomcrier',
    element: 'dark',
    name: 'Rat Doomcrier',
    title: 'Fear arrives before the blow.',
    rarity: 3,
    stats: { hp: 1096, atk: 178, def: 90, speed: 104 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_doomcrier/ratdoomcrieridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_doomcrier_knell', name: 'Doomcrier Knell',
        icon: 'assets/icons/fc1003.png',
        description: 'Two tolling blows: 75% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'rat_doomcrier_omen', name: 'Doomcrier Omen',
        icon: 'assets/icons/fc1084.png',
        description: 'Name their doom: 105% ATK and -9% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.05 },
          { type: 'debuff', stat: 'atk', mult: 0.91, turns: 2 },
        ],
      },
      {
        id: 'rat_doomcrier_chorus', name: 'Doomcrier Chorus',
        icon: 'assets/icons/fc807.png',
        description: 'The dread chorus: 74% ATK to ALL enemies and -4% crit chance for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.74 },
          { type: 'debuff', stat: 'critChance', add: -0.04, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Doomcrier Presence',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, dread spreads: ALL enemies lose 2% DEF for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const e of battle.livingUnits(unit.enemyTeam())) {
            e.addStatusEffect({ kind: 'debuff', stat: 'def', mult: 0.98, turns: 1 });
          }
          return null; // silent — small rolling dread
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  rat_lightmender: {
    id: 'rat_lightmender',
    element: 'light',
    name: 'Rat Lightmender',
    title: 'Every wound answers to the light.',
    rarity: 3,
    stats: { hp: 1105, atk: 183, def: 93, speed: 106 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_lightmender/ratlightmenderidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_lightmender_rebuke', name: 'Lightmender\'s Rebuke',
        icon: 'assets/icons/fc1471.png',
        description: 'Two shining raps: 76% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.76 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'rat_lightmender_grace', name: 'Lightmender\'s Grace',
        icon: 'assets/icons/fc1112.png',
        description: 'Pour in the light: heals an ally 105% of ATK and cleanses their debuffs.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.05 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'rat_lightmender_communion', name: 'Lightmender\'s Communion',
        icon: 'assets/icons/fc800.png',
        description: 'Shared light: ALL allies heal 55% of ATK plus 1.1% of max HP regen for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.55 },
          { type: 'hot', pct: 0.01, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Lightmender Devotion',
      icon: 'assets/icons/fc1093.png',
      description: 'Healing hands, steadied by faith.',
      hooks: { healBoostAdd: 0.12 },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
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
        description: 'Raise the aegis over an ally: they take 12% less damage for 2 turns and heal 46% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.88, turns: 2 },
          { type: 'heal', mult: 0.46 },
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
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  rat_dawnblade: {
    id: 'rat_dawnblade',
    element: 'light',
    name: 'Rat Dawnblade',
    title: 'Morning, sharpened.',
    rarity: 3,
    stats: { hp: 1123, atk: 163, def: 99, speed: 110 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_dawnblade/ratdawnbladeidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_dawnblade_stroke', name: 'Dawnblade Stroke',
        icon: 'assets/icons/fc1587.png',
        description: 'Two dawn-lit strokes: 78% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.78 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'rat_dawnblade_flare', name: 'Dawnblade Flare',
        icon: 'assets/icons/fc1447.png',
        description: 'A flare of morning: 128% ATK, and the light mends 5% of max HP.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.28 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.05 },
        ],
      },
      {
        id: 'rat_dawnblade_zenith', name: 'Dawnblade Zenith',
        icon: 'assets/icons/fc730.png',
        description: 'High noon: 191% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.91 },
        ],
      },
    ],
    passive: {
      name: 'Dawnblade Resolve',
      icon: 'assets/icons/fc1003.png',
      description: 'Heals 3% max HP at turn start while below 65% HP.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp >= 0.65) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.03));
          if (healed <= 0) return null;
          return {
            label: 'Dawnblade Resolve',
            message: `${unit.name}'s light knits ${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#f8d86a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  rat_sunherald: {
    id: 'rat_sunherald',
    element: 'light',
    name: 'Rat Sunherald',
    title: 'Good news travels armed.',
    rarity: 3,
    stats: { hp: 1132, atk: 168, def: 78, speed: 112 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_sunherald/ratsunheraldidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_sunherald_call', name: 'Sunherald\'s Call',
        icon: 'assets/icons/fc868.png',
        description: 'Two ringing notes: 79% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.79 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'rat_sunherald_proclamation', name: 'Sunherald\'s Proclamation',
        icon: 'assets/icons/fc869.png',
        description: 'Lift an ally: +10% ATK for 2 turns and 6% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.1, turns: 2 },
          { type: 'turnMeter', amount: 0.06 },
        ],
      },
      {
        id: 'rat_sunherald_triumph', name: 'Sunherald\'s Triumph',
        icon: 'assets/icons/fc882.png',
        description: 'Declare the day won: ALL allies gain +5% SPD for 2 turns and 3% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.05, turns: 2 },
          { type: 'turnMeter', amount: 0.03 },
        ],
      },
    ],
    passive: {
      name: 'Sunherald Anthem',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start: ALL allies gain +2% ATK and +2% SPD for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) { a.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.02, turns: 1 }); a.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.02, turns: 1 }); }
          return null; // silent — small rolling anthem
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  rat_lightjudge: {
    id: 'rat_lightjudge',
    element: 'light',
    name: 'Rat Lightjudge',
    title: 'Verdicts delivered in person.',
    rarity: 3,
    stats: { hp: 1141, atk: 173, def: 81, speed: 96 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_lightjudge/ratlightjudgeidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_lightjudge_gavel', name: 'Lightjudge\'s Gavel',
        icon: 'assets/icons/fc1461.png',
        description: 'Two measured blows: 80% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'rat_lightjudge_inquest', name: 'Lightjudge\'s Inquest',
        icon: 'assets/icons/fc862.png',
        description: 'Open the case: 120% ATK and the target takes +14% damage for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.14, turns: 2 },
        ],
      },
      {
        id: 'rat_lightjudge_verdict', name: 'Lightjudge\'s Verdict',
        icon: 'assets/icons/fc744.png',
        description: 'Deliver the verdict: 193% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.93 },
        ],
      },
    ],
    passive: {
      name: 'Lightjudge Justice',
      icon: 'assets/icons/fc863.png',
      description: 'Justice sees clearly: deals 15% extra damage to buffed enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'buff') ? 1.15 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  crow_headsman: {
    id: 'crow_headsman',
    element: 'dark',
    name: 'Crow Headsman',
    title: 'The sentence is the swing.',
    rarity: 3,
    stats: { hp: 1074, atk: 161, def: 80, speed: 97 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Crowheadsmanidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'crow_headsman_edge', name: 'Headsman\'s Edge',
        icon: 'assets/icons/fc734.png',
        description: 'Two dark cuts: 81% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.81 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'crow_headsman_sentence', name: 'Headsman\'s Sentence',
        icon: 'assets/icons/fc730.png',
        description: 'Pass judgment: 131% ATK and the target takes +12% damage for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.31 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.12, turns: 1 },
        ],
      },
      {
        id: 'crow_headsman_end', name: 'Headsman\'s End',
        icon: 'assets/icons/fc728.png',
        description: 'Carry it out: 207% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.07 },
        ],
      },
    ],
    passive: {
      name: 'Headsman\'s Due',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 24% extra damage to enemies below 40% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.4 ? 1.24 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  cuckoo_hexmother: {
    id: 'cuckoo_hexmother',
    element: 'dark',
    name: 'Cuckoo Hexmother',
    title: 'Carries every curse worth having.',
    rarity: 3,
    stats: { hp: 1083, atk: 166, def: 83, speed: 99 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Cuckoohexmotheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cuckoo_hexmother_lash', name: 'Hexmother Lash',
        icon: 'assets/icons/fc1052.png',
        description: 'Two cursed lashes: 82% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.82 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'cuckoo_hexmother_bane', name: 'Hexmother Bane',
        icon: 'assets/icons/fc1084.png',
        description: 'A layered curse: 132% ATK, -9% ATK and -5% DEF for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.32 },
          { type: 'debuff', stat: 'atk', mult: 0.91, turns: 2 },
          { type: 'debuff', stat: 'def', mult: 0.95, turns: 2 },
        ],
      },
      {
        id: 'cuckoo_hexmother_pall', name: 'Hexmother Pall',
        icon: 'assets/icons/fc1050.png',
        description: 'A pall over everything: 86% ATK to ALL enemies and -4% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.86 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Hexmother Craft',
      icon: 'assets/icons/fc1093.png',
      description: 'Curses honed in the dark.',
      hooks: { accuracyAdd: 0.08, dotBoostAdd: 0.18 },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  shrike_bloodtithe: {
    id: 'shrike_bloodtithe',
    element: 'dark',
    name: 'Shrike Bloodtithe',
    title: 'Your vigor, redistributed.',
    rarity: 3,
    stats: { hp: 1092, atk: 171, def: 86, speed: 101 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Shrikebloodtitheidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'shrike_bloodtithe_sip', name: 'Bloodtithe\'s Sip',
        icon: 'assets/icons/fc1444.png',
        description: 'Two draining touches: 83% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.83 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'shrike_bloodtithe_feast', name: 'Bloodtithe\'s Feast',
        icon: 'assets/icons/fc825.png',
        description: 'Drink deep: 133% ATK, healing himself for 32% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.33 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.32 },
        ],
      },
      {
        id: 'shrike_bloodtithe_toll', name: 'Bloodtithe\'s Toll',
        icon: 'assets/icons/fc1112.png',
        description: 'Tax the living: 77% ATK to ALL enemies while he mends 7% of his max HP.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.77 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.07 },
        ],
      },
    ],
    passive: {
      name: 'Bloodtithe Hunger',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, siphons 1.4% of his max HP from a random enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const amount = Math.max(1, Math.round(unit.maxHp * 0.014));
          target.takeDamage(amount);
          unit.heal(amount);
          return null; // silent — small rolling hunger
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  nightjar_duskblade: {
    id: 'nightjar_duskblade',
    element: 'dark',
    name: 'Nightjar Duskblade',
    title: 'The dark keeps its edge honed.',
    rarity: 3,
    stats: { hp: 1101, atk: 176, def: 89, speed: 103 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Nightjarduskbladeidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'nightjar_duskblade_flick', name: 'Duskblade Flick',
        icon: 'assets/icons/fc1447.png',
        description: 'Two flickering cuts: 84% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.84 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'nightjar_duskblade_waltz', name: 'Duskblade Waltz',
        icon: 'assets/icons/fc1587.png',
        description: 'A step through shadow: 134% ATK and +7% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.34 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.07, turns: 1 },
        ],
      },
      {
        id: 'nightjar_duskblade_finale', name: 'Duskblade Finale',
        icon: 'assets/icons/fc723.png',
        description: 'The last figure: 198% ATK — 25% more against debuffed prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.98, bonusVs: { kind: 'debuff', mult: 1.25 } },
        ],
      },
    ],
    passive: {
      name: 'Duskblade Poise',
      icon: 'assets/icons/fc862.png',
      description: 'A blade kept perfectly balanced (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.18, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.02, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  whippoorwill_doomsinger: {
    id: 'whippoorwill_doomsinger',
    element: 'dark',
    name: 'Whippoorwill Doomsinger',
    title: 'Fear arrives before the blow.',
    rarity: 3,
    stats: { hp: 1110, atk: 181, def: 92, speed: 105 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Whippoorwilldoomsingeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'whippoorwill_doomsinger_knell', name: 'Doomsinger Knell',
        icon: 'assets/icons/fc1003.png',
        description: 'Two tolling blows: 85% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'whippoorwill_doomsinger_omen', name: 'Doomsinger Omen',
        icon: 'assets/icons/fc1084.png',
        description: 'Name their doom: 115% ATK and -10% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.15 },
          { type: 'debuff', stat: 'atk', mult: 0.9, turns: 2 },
        ],
      },
      {
        id: 'whippoorwill_doomsinger_chorus', name: 'Doomsinger Chorus',
        icon: 'assets/icons/fc807.png',
        description: 'The dread chorus: 84% ATK to ALL enemies and -5% crit chance for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.84 },
          { type: 'debuff', stat: 'critChance', add: -0.05, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Doomsinger Presence',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, dread spreads: ALL enemies lose 2% SPD for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const e of battle.livingUnits(unit.enemyTeam())) {
            e.addStatusEffect({ kind: 'debuff', stat: 'speed', mult: 0.98, turns: 1 });
          }
          return null; // silent — small rolling dread
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  dove_peacebringer: {
    id: 'dove_peacebringer',
    element: 'light',
    name: 'Dove Peacebringer',
    title: 'Every wound answers to the light.',
    rarity: 3,
    stats: { hp: 1119, atk: 186, def: 95, speed: 107 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Dovepeacebringeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'dove_peacebringer_rebuke', name: 'Peacebringer\'s Rebuke',
        icon: 'assets/icons/fc1471.png',
        description: 'Two shining raps: 86% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.86 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'dove_peacebringer_grace', name: 'Peacebringer\'s Grace',
        icon: 'assets/icons/fc1112.png',
        description: 'Pour in the light: heals an ally 114% of ATK and cleanses their debuffs.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.15 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'dove_peacebringer_communion', name: 'Peacebringer\'s Communion',
        icon: 'assets/icons/fc800.png',
        description: 'Shared light: ALL allies heal 64% of ATK plus 1.2% of max HP regen for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.65 },
          { type: 'hot', pct: 0.011, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Peacebringer Devotion',
      icon: 'assets/icons/fc1093.png',
      description: 'Healing hands, steadied by faith.',
      hooks: { healBoostAdd: 0.18 },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  egret_aegiswing: {
    id: 'egret_aegiswing',
    element: 'light',
    name: 'Egret Aegiswing',
    title: 'A shield the sun would envy.',
    rarity: 3,
    stats: { hp: 1128, atk: 161, def: 98, speed: 109 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Egretaegiswingidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'egret_aegiswing_check', name: 'Aegiswing\'s Check',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield checks: 87% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.87 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'egret_aegiswing_ward', name: 'Aegiswing\'s Ward',
        icon: 'assets/icons/fc855.png',
        description: 'Raise the aegis over an ally: they take 13% less damage for 2 turns and heal 55% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.87, turns: 2 },
          { type: 'heal', mult: 0.56 },
        ],
      },
      {
        id: 'egret_aegiswing_vigil', name: 'Aegiswing\'s Vigil',
        icon: 'assets/icons/fc856.png',
        description: 'The unbroken vigil: ALL allies gain +7% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.07, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Aegiswing Constancy',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, shields the most wounded ally: takes 11% less damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.89, turns: 1 });
          return null; // silent — small rolling shelter
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  goldfinch_dawnlancer: {
    id: 'goldfinch_dawnlancer',
    element: 'light',
    name: 'Goldfinch Dawnlancer',
    title: 'Morning, sharpened.',
    rarity: 3,
    stats: { hp: 1137, atk: 166, def: 101, speed: 111 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Goldfinchdawnlanceridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'goldfinch_dawnlancer_stroke', name: 'Dawnlancer Stroke',
        icon: 'assets/icons/fc1587.png',
        description: 'Two dawn-lit strokes: 88% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.88 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'goldfinch_dawnlancer_flare', name: 'Dawnlancer Flare',
        icon: 'assets/icons/fc1447.png',
        description: 'A flare of morning: 138% ATK, and the light mends 6% of max HP.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.38 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.06 },
        ],
      },
      {
        id: 'goldfinch_dawnlancer_zenith', name: 'Dawnlancer Zenith',
        icon: 'assets/icons/fc730.png',
        description: 'High noon: 201% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.01 },
        ],
      },
    ],
    passive: {
      name: 'Dawnlancer Resolve',
      icon: 'assets/icons/fc1003.png',
      description: 'Heals 5% max HP at turn start while below 45% HP.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp >= 0.45) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.05));
          if (healed <= 0) return null;
          return {
            label: 'Dawnlancer Resolve',
            message: `${unit.name}'s light knits ${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#f8d86a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  lark_brightcall: {
    id: 'lark_brightcall',
    element: 'light',
    name: 'Lark Brightcall',
    title: 'Good news travels armed.',
    rarity: 3,
    stats: { hp: 1146, atk: 171, def: 80, speed: 113 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Larkbrightcallidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'lark_brightcall_call', name: 'Brightcall\'s Call',
        icon: 'assets/icons/fc868.png',
        description: 'Two ringing notes: 89% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.89 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'lark_brightcall_proclamation', name: 'Brightcall\'s Proclamation',
        icon: 'assets/icons/fc869.png',
        description: 'Lift an ally: +11% ATK for 2 turns and 7% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.11, turns: 2 },
          { type: 'turnMeter', amount: 0.07 },
        ],
      },
      {
        id: 'lark_brightcall_triumph', name: 'Brightcall\'s Triumph',
        icon: 'assets/icons/fc882.png',
        description: 'Declare the day won: ALL allies gain +6% SPD for 2 turns and 4% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.06, turns: 2 },
          { type: 'turnMeter', amount: 0.04 },
        ],
      },
    ],
    passive: {
      name: 'Brightcall Anthem',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start: ALL allies gain +5% DEF for 1 turn and a sliver of healing.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) { a.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.05, turns: 1 }); a.heal(Math.round(unit.maxHp * 0.003)); }
          return null; // silent — small rolling anthem
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  ibis_truthbeak: {
    id: 'ibis_truthbeak',
    element: 'light',
    name: 'Ibis Truthbeak',
    title: 'Verdicts delivered in person.',
    rarity: 3,
    stats: { hp: 1155, atk: 176, def: 83, speed: 97 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Ibistruthbeakidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'ibis_truthbeak_gavel', name: 'Truthbeak\'s Gavel',
        icon: 'assets/icons/fc1461.png',
        description: 'Two measured blows: 90% then 25% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'damage', mult: 0.25 },
        ],
      },
      {
        id: 'ibis_truthbeak_inquest', name: 'Truthbeak\'s Inquest',
        icon: 'assets/icons/fc862.png',
        description: 'Open the case: 130% ATK and the target takes +15% damage for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.15, turns: 2 },
        ],
      },
      {
        id: 'ibis_truthbeak_verdict', name: 'Truthbeak\'s Verdict',
        icon: 'assets/icons/fc744.png',
        description: 'Deliver the verdict: 203% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.03 },
        ],
      },
    ],
    passive: {
      name: 'Truthbeak Justice',
      icon: 'assets/icons/fc863.png',
      description: 'Justice sees clearly: deals 35% extra damage to enemies with 3 or more afflictions.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.filter((fx) => fx.kind === 'debuff' || fx.kind === 'dot').length >= 3 ? 1.35 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

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
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
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
          target.takeDamage(amount);
          unit.heal(amount);
          return null; // silent — small rolling hunger
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  snake_gravecoil: {
    id: 'snake_gravecoil',
    element: 'dark',
    name: 'Snake Gravecoil',
    title: 'The sentence is the swing.',
    rarity: 3,
    stats: { hp: 1102, atk: 167, def: 84, speed: 99 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakegravecoilidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_gravecoil_edge', name: 'Gravecoil\'s Edge',
        icon: 'assets/icons/fc734.png',
        description: 'Two dark cuts: 71% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.71 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'snake_gravecoil_sentence', name: 'Gravecoil\'s Sentence',
        icon: 'assets/icons/fc730.png',
        description: 'Pass judgment: 151% ATK and the target takes +12% damage for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.51 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.12, turns: 1 },
        ],
      },
      {
        id: 'snake_gravecoil_end', name: 'Gravecoil\'s End',
        icon: 'assets/icons/fc728.png',
        description: 'Carry it out: 227% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.27 },
        ],
      },
    ],
    passive: {
      name: 'Gravecoil\'s Due',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 38% extra damage to enemies below 22% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.22 ? 1.38 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  snake_hexscale: {
    id: 'snake_hexscale',
    element: 'dark',
    name: 'Snake Hexscale',
    title: 'Carries every curse worth having.',
    rarity: 3,
    stats: { hp: 1111, atk: 172, def: 87, speed: 101 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakehexscaleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_hexscale_lash', name: 'Hexscale Lash',
        icon: 'assets/icons/fc1052.png',
        description: 'Two cursed lashes: 72% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.72 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'snake_hexscale_bane', name: 'Hexscale Bane',
        icon: 'assets/icons/fc1084.png',
        description: 'A layered curse: 152% ATK, -11% ATK and -7% DEF for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.52 },
          { type: 'debuff', stat: 'atk', mult: 0.89, turns: 2 },
          { type: 'debuff', stat: 'def', mult: 0.93, turns: 2 },
        ],
      },
      {
        id: 'snake_hexscale_pall', name: 'Hexscale Pall',
        icon: 'assets/icons/fc1050.png',
        description: 'A pall over everything: 106% ATK to ALL enemies and -3% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.06 },
          { type: 'debuff', stat: 'speed', mult: 0.97, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Hexscale Craft',
      icon: 'assets/icons/fc1093.png',
      description: 'Curses honed in the dark.',
      hooks: { accuracyAdd: 0.18, dotBoostAdd: 0.05 },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  snake_bloodadder: {
    id: 'snake_bloodadder',
    element: 'dark',
    name: 'Snake Bloodadder',
    title: 'Your vigor, redistributed.',
    rarity: 3,
    stats: { hp: 1120, atk: 177, def: 90, speed: 103 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakebloodadderidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_bloodadder_sip', name: 'Bloodadder\'s Sip',
        icon: 'assets/icons/fc1444.png',
        description: 'Two draining touches: 73% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.73 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'snake_bloodadder_feast', name: 'Bloodadder\'s Feast',
        icon: 'assets/icons/fc825.png',
        description: 'Drink deep: 153% ATK, healing himself for 36% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.53 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.36 },
        ],
      },
      {
        id: 'snake_bloodadder_toll', name: 'Bloodadder\'s Toll',
        icon: 'assets/icons/fc1112.png',
        description: 'Tax the living: 97% ATK to ALL enemies while he mends 9% of his max HP.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.97 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.09 },
        ],
      },
    ],
    passive: {
      name: 'Bloodadder Hunger',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, siphons 1.8% of his max HP from a random enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const amount = Math.max(1, Math.round(unit.maxHp * 0.018));
          target.takeDamage(amount);
          unit.heal(amount);
          return null; // silent — small rolling hunger
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  snake_nightslither: {
    id: 'snake_nightslither',
    element: 'dark',
    name: 'Snake Nightslither',
    title: 'The dark keeps its edge honed.',
    rarity: 3,
    stats: { hp: 1129, atk: 182, def: 93, speed: 105 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakenightslitheridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_nightslither_flick', name: 'Nightslither Flick',
        icon: 'assets/icons/fc1447.png',
        description: 'Two flickering cuts: 74% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.74 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'snake_nightslither_waltz', name: 'Nightslither Waltz',
        icon: 'assets/icons/fc1587.png',
        description: 'A step through shadow: 154% ATK and +9% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.54 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.09, turns: 1 },
        ],
      },
      {
        id: 'snake_nightslither_finale', name: 'Nightslither Finale',
        icon: 'assets/icons/fc723.png',
        description: 'The last figure: 218% ATK — 25% more against debuffed prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.18, bonusVs: { kind: 'debuff', mult: 1.25 } },
        ],
      },
    ],
    passive: {
      name: 'Nightslither Poise',
      icon: 'assets/icons/fc862.png',
      description: 'A blade kept perfectly balanced (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.07, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.02, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  snake_dreadhood: {
    id: 'snake_dreadhood',
    element: 'dark',
    name: 'Snake Dreadhood',
    title: 'Fear arrives before the blow.',
    rarity: 3,
    stats: { hp: 1138, atk: 187, def: 96, speed: 107 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakedreadhoodidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_dreadhood_knell', name: 'Dreadhood Knell',
        icon: 'assets/icons/fc1003.png',
        description: 'Two tolling blows: 75% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'snake_dreadhood_omen', name: 'Dreadhood Omen',
        icon: 'assets/icons/fc1084.png',
        description: 'Name their doom: 135% ATK and -12% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.35 },
          { type: 'debuff', stat: 'atk', mult: 0.88, turns: 2 },
        ],
      },
      {
        id: 'snake_dreadhood_chorus', name: 'Dreadhood Chorus',
        icon: 'assets/icons/fc807.png',
        description: 'The dread chorus: 104% ATK to ALL enemies and -7% crit chance for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.04 },
          { type: 'debuff', stat: 'critChance', add: -0.07, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Dreadhood Presence',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, dread spreads: ALL enemies lose 2% crit chance for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const e of battle.livingUnits(unit.enemyTeam())) {
            e.addStatusEffect({ kind: 'debuff', stat: 'critChance', add: -0.02, turns: 1 });
          }
          return null; // silent — small rolling dread
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  snake_dawnpriestess: {
    id: 'snake_dawnpriestess',
    element: 'light',
    name: 'Snake Dawnpriestess',
    title: 'Every wound answers to the light.',
    rarity: 3,
    stats: { hp: 1147, atk: 162, def: 99, speed: 109 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakedawnpriestessidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_dawnpriestess_rebuke', name: 'Dawnpriestess\'s Rebuke',
        icon: 'assets/icons/fc1471.png',
        description: 'Two shining raps: 76% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.76 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'snake_dawnpriestess_grace', name: 'Dawnpriestess\'s Grace',
        icon: 'assets/icons/fc1112.png',
        description: 'Pour in the light: heals an ally 135% of ATK and cleanses their debuffs.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.35 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'snake_dawnpriestess_communion', name: 'Dawnpriestess\'s Communion',
        icon: 'assets/icons/fc800.png',
        description: 'Shared light: ALL allies heal 85% of ATK plus 1.4% of max HP regen for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.85 },
          { type: 'hot', pct: 0.014, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Dawnpriestess Devotion',
      icon: 'assets/icons/fc1093.png',
      description: 'Healing hands, steadied by faith.',
      hooks: { healBoostAdd: 0.28 },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  snake_aegiscoil: {
    id: 'snake_aegiscoil',
    element: 'light',
    name: 'Snake Aegiscoil',
    title: 'A shield the sun would envy.',
    rarity: 3,
    stats: { hp: 1156, atk: 167, def: 78, speed: 111 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakeaegiscoilidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_aegiscoil_check', name: 'Aegiscoil\'s Check',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield checks: 77% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.77 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'snake_aegiscoil_ward', name: 'Aegiscoil\'s Ward',
        icon: 'assets/icons/fc855.png',
        description: 'Raise the aegis over an ally: they take 8% less damage for 2 turns and heal 76% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.91, turns: 2 },
          { type: 'heal', mult: 0.76 },
        ],
      },
      {
        id: 'snake_aegiscoil_vigil', name: 'Aegiscoil\'s Vigil',
        icon: 'assets/icons/fc856.png',
        description: 'The unbroken vigil: ALL allies gain +3% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.03, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Aegiscoil Constancy',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, shields the most wounded ally: takes 6% less damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.93, turns: 1 });
          return null; // silent — small rolling shelter
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  snake_radiantfang: {
    id: 'snake_radiantfang',
    element: 'light',
    name: 'Snake Radiantfang',
    title: 'Morning, sharpened.',
    rarity: 3,
    stats: { hp: 1165, atk: 172, def: 81, speed: 113 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakeradiantfangidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_radiantfang_stroke', name: 'Radiantfang Stroke',
        icon: 'assets/icons/fc1587.png',
        description: 'Two dawn-lit strokes: 78% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.78 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'snake_radiantfang_flare', name: 'Radiantfang Flare',
        icon: 'assets/icons/fc1447.png',
        description: 'A flare of morning: 158% ATK, and the light mends 8% of max HP.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.58 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.08 },
        ],
      },
      {
        id: 'snake_radiantfang_zenith', name: 'Radiantfang Zenith',
        icon: 'assets/icons/fc730.png',
        description: 'High noon: 221% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.21 },
        ],
      },
    ],
    passive: {
      name: 'Radiantfang Resolve',
      icon: 'assets/icons/fc1003.png',
      description: 'Heals 7% max HP at turn start while below 35% HP.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp >= 0.35) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.07));
          if (healed <= 0) return null;
          return {
            label: 'Radiantfang Resolve',
            message: `${unit.name}'s light knits ${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#f8d86a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  snake_sunwhisper: {
    id: 'snake_sunwhisper',
    element: 'light',
    name: 'Snake Sunwhisper',
    title: 'Good news travels armed.',
    rarity: 3,
    stats: { hp: 1174, atk: 177, def: 84, speed: 97 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakesunwhisperidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_sunwhisper_call', name: 'Sunwhisper\'s Call',
        icon: 'assets/icons/fc868.png',
        description: 'Two ringing notes: 79% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.79 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'snake_sunwhisper_proclamation', name: 'Sunwhisper\'s Proclamation',
        icon: 'assets/icons/fc869.png',
        description: 'Lift an ally: +13% ATK for 2 turns and 9% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.13, turns: 2 },
          { type: 'turnMeter', amount: 0.09 },
        ],
      },
      {
        id: 'snake_sunwhisper_triumph', name: 'Sunwhisper\'s Triumph',
        icon: 'assets/icons/fc882.png',
        description: 'Declare the day won: ALL allies gain +8% SPD for 2 turns and 3% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.08, turns: 2 },
          { type: 'turnMeter', amount: 0.03 },
        ],
      },
    ],
    passive: {
      name: 'Sunwhisper Anthem',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start: ALL allies gain +3% SPD for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) { a.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.03, turns: 1 }); }
          return null; // silent — small rolling anthem
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  snake_truthscale: {
    id: 'snake_truthscale',
    element: 'light',
    name: 'Snake Truthscale',
    title: 'Verdicts delivered in person.',
    rarity: 3,
    stats: { hp: 1183, atk: 182, def: 87, speed: 99 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snaketruthscaleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_truthscale_gavel', name: 'Truthscale\'s Gavel',
        icon: 'assets/icons/fc1461.png',
        description: 'Two measured blows: 80% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'snake_truthscale_inquest', name: 'Truthscale\'s Inquest',
        icon: 'assets/icons/fc862.png',
        description: 'Open the case: 150% ATK and the target takes +17% damage for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.5 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.17, turns: 2 },
        ],
      },
      {
        id: 'snake_truthscale_verdict', name: 'Truthscale\'s Verdict',
        icon: 'assets/icons/fc744.png',
        description: 'Deliver the verdict: 223% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.23 },
        ],
      },
    ],
    passive: {
      name: 'Truthscale Justice',
      icon: 'assets/icons/fc863.png',
      description: 'Justice sees clearly: deals 30% extra damage to slowed enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'debuff' && fx.stat === 'speed') ? 1.3 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  wolf_gallowsjaw: {
    id: 'wolf_gallowsjaw',
    element: 'dark',
    name: 'Wolf Gallowsjaw',
    title: 'The sentence is the swing.',
    rarity: 3,
    stats: { hp: 1116, atk: 170, def: 86, speed: 100 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfgallowsjawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_gallowsjaw_edge', name: 'Gallowsjaw\'s Edge',
        icon: 'assets/icons/fc734.png',
        description: 'Two dark cuts: 81% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.81 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'wolf_gallowsjaw_sentence', name: 'Gallowsjaw\'s Sentence',
        icon: 'assets/icons/fc730.png',
        description: 'Pass judgment: 161% ATK and the target takes +12% damage for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.61 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.12, turns: 1 },
        ],
      },
      {
        id: 'wolf_gallowsjaw_end', name: 'Gallowsjaw\'s End',
        icon: 'assets/icons/fc728.png',
        description: 'Carry it out: 237% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.37 },
        ],
      },
    ],
    passive: {
      name: 'Gallowsjaw\'s Due',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 18% extra damage to enemies below 48% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.48 ? 1.18 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  wolf_cursehowl: {
    id: 'wolf_cursehowl',
    element: 'dark',
    name: 'Wolf Cursehowl',
    title: 'Carries every curse worth having.',
    rarity: 3,
    stats: { hp: 1125, atk: 175, def: 89, speed: 102 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfcursehowlidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_cursehowl_lash', name: 'Cursehowl Lash',
        icon: 'assets/icons/fc1052.png',
        description: 'Two cursed lashes: 82% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.82 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'wolf_cursehowl_bane', name: 'Cursehowl Bane',
        icon: 'assets/icons/fc1084.png',
        description: 'A layered curse: 162% ATK, -12% ATK and -8% DEF for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.62 },
          { type: 'debuff', stat: 'atk', mult: 0.88, turns: 2 },
          { type: 'debuff', stat: 'def', mult: 0.92, turns: 2 },
        ],
      },
      {
        id: 'wolf_cursehowl_pall', name: 'Cursehowl Pall',
        icon: 'assets/icons/fc1050.png',
        description: 'A pall over everything: 116% ATK to ALL enemies and -4% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.16 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Cursehowl Craft',
      icon: 'assets/icons/fc1093.png',
      description: 'Curses honed in the dark.',
      hooks: { accuracyAdd: 0.06, resistanceAdd: 0.18 },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  wolf_bloodmuzzle: {
    id: 'wolf_bloodmuzzle',
    element: 'dark',
    name: 'Wolf Bloodmuzzle',
    title: 'Your vigor, redistributed.',
    rarity: 3,
    stats: { hp: 1134, atk: 180, def: 92, speed: 104 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfbloodmuzzleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_bloodmuzzle_sip', name: 'Bloodmuzzle\'s Sip',
        icon: 'assets/icons/fc1444.png',
        description: 'Two draining touches: 83% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.83 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'wolf_bloodmuzzle_feast', name: 'Bloodmuzzle\'s Feast',
        icon: 'assets/icons/fc825.png',
        description: 'Drink deep: 163% ATK, healing himself for 38% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.63 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.38 },
        ],
      },
      {
        id: 'wolf_bloodmuzzle_toll', name: 'Bloodmuzzle\'s Toll',
        icon: 'assets/icons/fc1112.png',
        description: 'Tax the living: 107% ATK to ALL enemies while he mends 10% of his max HP.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.07 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.1 },
        ],
      },
    ],
    passive: {
      name: 'Bloodmuzzle Hunger',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, siphons 2.2% of his max HP from a random enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const amount = Math.max(1, Math.round(unit.maxHp * 0.022));
          target.takeDamage(amount);
          unit.heal(amount);
          return null; // silent — small rolling hunger
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  wolf_duskprowler: {
    id: 'wolf_duskprowler',
    element: 'dark',
    name: 'Wolf Duskprowler',
    title: 'The dark keeps its edge honed.',
    rarity: 3,
    stats: { hp: 1143, atk: 185, def: 95, speed: 106 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfduskprowleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_duskprowler_flick', name: 'Duskprowler Flick',
        icon: 'assets/icons/fc1447.png',
        description: 'Two flickering cuts: 84% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.84 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'wolf_duskprowler_waltz', name: 'Duskprowler Waltz',
        icon: 'assets/icons/fc1587.png',
        description: 'A step through shadow: 164% ATK and +10% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.64 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.1, turns: 1 },
        ],
      },
      {
        id: 'wolf_duskprowler_finale', name: 'Duskprowler Finale',
        icon: 'assets/icons/fc723.png',
        description: 'The last figure: 228% ATK — 25% more against debuffed prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.28, bonusVs: { kind: 'debuff', mult: 1.25 } },
        ],
      },
    ],
    passive: {
      name: 'Duskprowler Poise',
      icon: 'assets/icons/fc862.png',
      description: 'A blade kept perfectly balanced (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.05, turns: 2 });
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.05, turns: 2 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  wolf_direomen: {
    id: 'wolf_direomen',
    element: 'dark',
    name: 'Wolf Direomen',
    title: 'Fear arrives before the blow.',
    rarity: 3,
    stats: { hp: 1152, atk: 160, def: 98, speed: 108 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfdireomenidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_direomen_knell', name: 'Direomen Knell',
        icon: 'assets/icons/fc1003.png',
        description: 'Two tolling blows: 85% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'wolf_direomen_omen', name: 'Direomen Omen',
        icon: 'assets/icons/fc1084.png',
        description: 'Name their doom: 145% ATK and -13% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.45 },
          { type: 'debuff', stat: 'atk', mult: 0.87, turns: 2 },
        ],
      },
      {
        id: 'wolf_direomen_chorus', name: 'Direomen Chorus',
        icon: 'assets/icons/fc807.png',
        description: 'The dread chorus: 114% ATK to ALL enemies and -4% crit chance for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.14 },
          { type: 'debuff', stat: 'critChance', add: -0.04, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Direomen Presence',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, dread spreads: ALL enemies lose 1.5% turn meter.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const e of battle.livingUnits(unit.enemyTeam())) {
            e.turnMeter = Math.max(0, e.turnMeter - CONFIG.TURN_METER_MAX * 0.015);
          }
          return null; // silent — small rolling dread
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  wolf_lightmuzzle: {
    id: 'wolf_lightmuzzle',
    element: 'light',
    name: 'Wolf Lightmuzzle',
    title: 'Every wound answers to the light.',
    rarity: 3,
    stats: { hp: 1161, atk: 165, def: 101, speed: 110 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolflightmuzzleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_lightmuzzle_rebuke', name: 'Lightmuzzle\'s Rebuke',
        icon: 'assets/icons/fc1471.png',
        description: 'Two shining raps: 86% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.86 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'wolf_lightmuzzle_grace', name: 'Lightmuzzle\'s Grace',
        icon: 'assets/icons/fc1112.png',
        description: 'Pour in the light: heals an ally 145% of ATK and cleanses their debuffs.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.45 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'wolf_lightmuzzle_communion', name: 'Lightmuzzle\'s Communion',
        icon: 'assets/icons/fc800.png',
        description: 'Shared light: ALL allies heal 95% of ATK plus 1.4% of max HP regen for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.95 },
          { type: 'hot', pct: 0.014, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Lightmuzzle Devotion',
      icon: 'assets/icons/fc1093.png',
      description: 'Healing hands, steadied by faith.',
      hooks: { healBoostAdd: 0.08, resistanceAdd: 0.08 },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  wolf_aegisfur: {
    id: 'wolf_aegisfur',
    element: 'light',
    name: 'Wolf Aegisfur',
    title: 'A shield the sun would envy.',
    rarity: 3,
    stats: { hp: 1170, atk: 170, def: 80, speed: 112 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfaegisfuridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_aegisfur_check', name: 'Aegisfur\'s Check',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield checks: 87% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.87 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'wolf_aegisfur_ward', name: 'Aegisfur\'s Ward',
        icon: 'assets/icons/fc855.png',
        description: 'Raise the aegis over an ally: they take 10% less damage for 2 turns and heal 86% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.89, turns: 2 },
          { type: 'heal', mult: 0.86 },
        ],
      },
      {
        id: 'wolf_aegisfur_vigil', name: 'Aegisfur\'s Vigil',
        icon: 'assets/icons/fc856.png',
        description: 'The unbroken vigil: ALL allies gain +11% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.11, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Aegisfur Constancy',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, shields the most wounded ally: takes 8% less damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.91, turns: 1 });
          return null; // silent — small rolling shelter
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  wolf_dawnfang: {
    id: 'wolf_dawnfang',
    element: 'light',
    name: 'Wolf Dawnfang',
    title: 'Morning, sharpened.',
    rarity: 3,
    stats: { hp: 1179, atk: 175, def: 83, speed: 96 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfdawnfangidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_dawnfang_stroke', name: 'Dawnfang Stroke',
        icon: 'assets/icons/fc1587.png',
        description: 'Two dawn-lit strokes: 88% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.88 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'wolf_dawnfang_flare', name: 'Dawnfang Flare',
        icon: 'assets/icons/fc1447.png',
        description: 'A flare of morning: 168% ATK, and the light mends 9% of max HP.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.68 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.09 },
        ],
      },
      {
        id: 'wolf_dawnfang_zenith', name: 'Dawnfang Zenith',
        icon: 'assets/icons/fc730.png',
        description: 'High noon: 231% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.31 },
        ],
      },
    ],
    passive: {
      name: 'Dawnfang Resolve',
      icon: 'assets/icons/fc1003.png',
      description: 'Heals 2% max HP at turn start while below 75% HP.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp >= 0.75) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.02));
          if (healed <= 0) return null;
          return {
            label: 'Dawnfang Resolve',
            message: `${unit.name}'s light knits ${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#f8d86a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  wolf_sunhowl: {
    id: 'wolf_sunhowl',
    element: 'light',
    name: 'Wolf Sunhowl',
    title: 'Good news travels armed.',
    rarity: 3,
    stats: { hp: 1188, atk: 180, def: 86, speed: 98 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfsunhowlidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_sunhowl_call', name: 'Sunhowl\'s Call',
        icon: 'assets/icons/fc868.png',
        description: 'Two ringing notes: 89% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.89 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'wolf_sunhowl_proclamation', name: 'Sunhowl\'s Proclamation',
        icon: 'assets/icons/fc869.png',
        description: 'Lift an ally: +14% ATK for 2 turns and 10% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.14, turns: 2 },
          { type: 'turnMeter', amount: 0.1 },
        ],
      },
      {
        id: 'wolf_sunhowl_triumph', name: 'Sunhowl\'s Triumph',
        icon: 'assets/icons/fc882.png',
        description: 'Declare the day won: ALL allies gain +5% SPD for 2 turns and 4% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.05, turns: 2 },
          { type: 'turnMeter', amount: 0.04 },
        ],
      },
    ],
    passive: {
      name: 'Sunhowl Anthem',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start: ALL allies gain 2% turn meter.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) { if (a !== unit) a.turnMeter = Math.min(CONFIG.TURN_METER_MAX, a.turnMeter + CONFIG.TURN_METER_MAX * 0.02); }
          return null; // silent — small rolling anthem
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  wolf_oathkeeper: {
    id: 'wolf_oathkeeper',
    element: 'light',
    name: 'Wolf Oathkeeper',
    title: 'Verdicts delivered in person.',
    rarity: 3,
    stats: { hp: 1197, atk: 185, def: 89, speed: 100 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfoathkeeperidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_oathkeeper_gavel', name: 'Oathkeeper\'s Gavel',
        icon: 'assets/icons/fc1461.png',
        description: 'Two measured blows: 90% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'wolf_oathkeeper_inquest', name: 'Oathkeeper\'s Inquest',
        icon: 'assets/icons/fc862.png',
        description: 'Open the case: 160% ATK and the target takes +18% damage for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.6 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.18, turns: 2 },
        ],
      },
      {
        id: 'wolf_oathkeeper_verdict', name: 'Oathkeeper\'s Verdict',
        icon: 'assets/icons/fc744.png',
        description: 'Deliver the verdict: 233% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.33 },
        ],
      },
    ],
    passive: {
      name: 'Oathkeeper Justice',
      icon: 'assets/icons/fc863.png',
      description: 'Justice sees clearly: deals 30% extra damage to enemies suffering damage over time.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'dot') ? 1.3 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  boar_tombtusk: {
    id: 'boar_tombtusk',
    element: 'dark',
    name: 'Boar Tombtusk',
    title: 'The sentence is the swing.',
    rarity: 3,
    stats: { hp: 1130, atk: 173, def: 88, speed: 101 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boartombtuskidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_tombtusk_edge', name: 'Tombtusk\'s Edge',
        icon: 'assets/icons/fc734.png',
        description: 'Two dark cuts: 91% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.91 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'boar_tombtusk_sentence', name: 'Tombtusk\'s Sentence',
        icon: 'assets/icons/fc730.png',
        description: 'Pass judgment: 171% ATK and the target takes +12% damage for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.71 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.12, turns: 1 },
        ],
      },
      {
        id: 'boar_tombtusk_end', name: 'Tombtusk\'s End',
        icon: 'assets/icons/fc728.png',
        description: 'Carry it out: 246% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.47 },
        ],
      },
    ],
    passive: {
      name: 'Tombtusk\'s Due',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 26% extra damage to enemies below 33% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.33 ? 1.26 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  boar_hexbristle: {
    id: 'boar_hexbristle',
    element: 'dark',
    name: 'Boar Hexbristle',
    title: 'Carries every curse worth having.',
    rarity: 3,
    stats: { hp: 1139, atk: 178, def: 91, speed: 103 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarhexbristleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_hexbristle_lash', name: 'Hexbristle Lash',
        icon: 'assets/icons/fc1052.png',
        description: 'Two cursed lashes: 92% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.92 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'boar_hexbristle_bane', name: 'Hexbristle Bane',
        icon: 'assets/icons/fc1084.png',
        description: 'A layered curse: 172% ATK, -13% ATK and -9% DEF for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.72 },
          { type: 'debuff', stat: 'atk', mult: 0.87, turns: 2 },
          { type: 'debuff', stat: 'def', mult: 0.91, turns: 2 },
        ],
      },
      {
        id: 'boar_hexbristle_pall', name: 'Hexbristle Pall',
        icon: 'assets/icons/fc1050.png',
        description: 'A pall over everything: 126% ATK to ALL enemies and -5% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.26 },
          { type: 'debuff', stat: 'speed', mult: 0.95, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Hexbristle Craft',
      icon: 'assets/icons/fc1093.png',
      description: 'Curses honed in the dark.',
      hooks: { accuracyAdd: 0.14, resistanceAdd: 0.06 },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  boar_bloodsnout: {
    id: 'boar_bloodsnout',
    element: 'dark',
    name: 'Boar Bloodsnout',
    title: 'Your vigor, redistributed.',
    rarity: 3,
    stats: { hp: 1148, atk: 183, def: 94, speed: 105 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarbloodsnoutidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_bloodsnout_sip', name: 'Bloodsnout\'s Sip',
        icon: 'assets/icons/fc1444.png',
        description: 'Two draining touches: 93% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.93 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'boar_bloodsnout_feast', name: 'Bloodsnout\'s Feast',
        icon: 'assets/icons/fc825.png',
        description: 'Drink deep: 173% ATK, healing himself for 40% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.73 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.4 },
        ],
      },
      {
        id: 'boar_bloodsnout_toll', name: 'Bloodsnout\'s Toll',
        icon: 'assets/icons/fc1112.png',
        description: 'Tax the living: 116% ATK to ALL enemies while he mends 11% of his max HP.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.17 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.11 },
        ],
      },
    ],
    passive: {
      name: 'Bloodsnout Hunger',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, siphons 2.4% of his max HP from a random enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const amount = Math.max(1, Math.round(unit.maxHp * 0.024));
          target.takeDamage(amount);
          unit.heal(amount);
          return null; // silent — small rolling hunger
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  boar_nightrooter: {
    id: 'boar_nightrooter',
    element: 'dark',
    name: 'Boar Nightrooter',
    title: 'The dark keeps its edge honed.',
    rarity: 3,
    stats: { hp: 1157, atk: 158, def: 97, speed: 107 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarnightrooteridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_nightrooter_flick', name: 'Nightrooter Flick',
        icon: 'assets/icons/fc1447.png',
        description: 'Two flickering cuts: 94% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.94 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'boar_nightrooter_waltz', name: 'Nightrooter Waltz',
        icon: 'assets/icons/fc1587.png',
        description: 'A step through shadow: 174% ATK and +11% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.74 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.11, turns: 1 },
        ],
      },
      {
        id: 'boar_nightrooter_finale', name: 'Nightrooter Finale',
        icon: 'assets/icons/fc723.png',
        description: 'The last figure: 238% ATK — 25% more against debuffed prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.38, bonusVs: { kind: 'debuff', mult: 1.25 } },
        ],
      },
    ],
    passive: {
      name: 'Nightrooter Poise',
      icon: 'assets/icons/fc862.png',
      description: 'A blade kept perfectly balanced (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.14, turns: 2 });
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.02, turns: 2 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  boar_doomgrunter: {
    id: 'boar_doomgrunter',
    element: 'dark',
    name: 'Boar Doomgrunter',
    title: 'Fear arrives before the blow.',
    rarity: 3,
    stats: { hp: 1166, atk: 163, def: 100, speed: 109 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boardoomgrunteridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_doomgrunter_knell', name: 'Doomgrunter Knell',
        icon: 'assets/icons/fc1003.png',
        description: 'Two tolling blows: 95% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'boar_doomgrunter_omen', name: 'Doomgrunter Omen',
        icon: 'assets/icons/fc1084.png',
        description: 'Name their doom: 155% ATK and -14% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.55 },
          { type: 'debuff', stat: 'atk', mult: 0.86, turns: 2 },
        ],
      },
      {
        id: 'boar_doomgrunter_chorus', name: 'Doomgrunter Chorus',
        icon: 'assets/icons/fc807.png',
        description: 'The dread chorus: 124% ATK to ALL enemies and -5% crit chance for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.24 },
          { type: 'debuff', stat: 'critChance', add: -0.05, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Doomgrunter Presence',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, dread spreads: ALL enemies lose 3% DEF for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const e of battle.livingUnits(unit.enemyTeam())) {
            e.addStatusEffect({ kind: 'debuff', stat: 'def', mult: 0.97, turns: 1 });
          }
          return null; // silent — small rolling dread
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  boar_lightsnout: {
    id: 'boar_lightsnout',
    element: 'light',
    name: 'Boar Lightsnout',
    title: 'Every wound answers to the light.',
    rarity: 3,
    stats: { hp: 1175, atk: 168, def: 79, speed: 111 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarlightsnoutidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_lightsnout_rebuke', name: 'Lightsnout\'s Rebuke',
        icon: 'assets/icons/fc1471.png',
        description: 'Two shining raps: 96% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'boar_lightsnout_grace', name: 'Lightsnout\'s Grace',
        icon: 'assets/icons/fc1112.png',
        description: 'Pour in the light: heals an ally 155% of ATK and cleanses their debuffs.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.55 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'boar_lightsnout_communion', name: 'Lightsnout\'s Communion',
        icon: 'assets/icons/fc800.png',
        description: 'Shared light: ALL allies heal 105% of ATK plus 1.6% of max HP regen for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.05 },
          { type: 'hot', pct: 0.015, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Lightsnout Devotion',
      icon: 'assets/icons/fc1093.png',
      description: 'Healing hands, steadied by faith.',
      hooks: { healBoostAdd: 0.14, dodgeAdd: 0.04 },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  boar_aegisback: {
    id: 'boar_aegisback',
    element: 'light',
    name: 'Boar Aegisback',
    title: 'A shield the sun would envy.',
    rarity: 3,
    stats: { hp: 1184, atk: 173, def: 82, speed: 113 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boaraegisbackidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_aegisback_check', name: 'Aegisback\'s Check',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield checks: 97% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.97 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'boar_aegisback_ward', name: 'Aegisback\'s Ward',
        icon: 'assets/icons/fc855.png',
        description: 'Raise the aegis over an ally: they take 14% less damage for 2 turns and heal 96% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.86, turns: 2 },
          { type: 'heal', mult: 0.96 },
        ],
      },
      {
        id: 'boar_aegisback_vigil', name: 'Aegisback\'s Vigil',
        icon: 'assets/icons/fc856.png',
        description: 'The unbroken vigil: ALL allies gain +2% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.02, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Aegisback Constancy',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, shields the most wounded ally: takes 12% less damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.88, turns: 1 });
          return null; // silent — small rolling shelter
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  boar_dawntusk: {
    id: 'boar_dawntusk',
    element: 'light',
    name: 'Boar Dawntusk',
    title: 'Morning, sharpened.',
    rarity: 3,
    stats: { hp: 1193, atk: 178, def: 85, speed: 97 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boardawntuskidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_dawntusk_stroke', name: 'Dawntusk Stroke',
        icon: 'assets/icons/fc1587.png',
        description: 'Two dawn-lit strokes: 98% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.98 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'boar_dawntusk_flare', name: 'Dawntusk Flare',
        icon: 'assets/icons/fc1447.png',
        description: 'A flare of morning: 178% ATK, and the light mends 10% of max HP.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.78 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.1 },
        ],
      },
      {
        id: 'boar_dawntusk_zenith', name: 'Dawntusk Zenith',
        icon: 'assets/icons/fc730.png',
        description: 'High noon: 241% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.41 },
        ],
      },
    ],
    passive: {
      name: 'Dawntusk Resolve',
      icon: 'assets/icons/fc1003.png',
      description: 'Heals 9% max HP at turn start while below 25% HP.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp >= 0.25) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.09));
          if (healed <= 0) return null;
          return {
            label: 'Dawntusk Resolve',
            message: `${unit.name}'s light knits ${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#f8d86a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  boar_sunbristle: {
    id: 'boar_sunbristle',
    element: 'light',
    name: 'Boar Sunbristle',
    title: 'Good news travels armed.',
    rarity: 3,
    stats: { hp: 1202, atk: 183, def: 88, speed: 99 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarsunbristleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_sunbristle_call', name: 'Sunbristle\'s Call',
        icon: 'assets/icons/fc868.png',
        description: 'Two ringing notes: 99% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.99 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'boar_sunbristle_proclamation', name: 'Sunbristle\'s Proclamation',
        icon: 'assets/icons/fc869.png',
        description: 'Lift an ally: +15% ATK for 2 turns and 11% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.15, turns: 2 },
          { type: 'turnMeter', amount: 0.11 },
        ],
      },
      {
        id: 'boar_sunbristle_triumph', name: 'Sunbristle\'s Triumph',
        icon: 'assets/icons/fc882.png',
        description: 'Declare the day won: ALL allies gain +6% SPD for 2 turns and 5% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.06, turns: 2 },
          { type: 'turnMeter', amount: 0.05 },
        ],
      },
    ],
    passive: {
      name: 'Sunbristle Anthem',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start: ALL allies gain +3% ATK and +2% DEF for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) { a.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.03, turns: 1 }); a.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.02, turns: 1 }); }
          return null; // silent — small rolling anthem
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  boar_oathtusker: {
    id: 'boar_oathtusker',
    element: 'light',
    name: 'Boar Oathtusker',
    title: 'Verdicts delivered in person.',
    rarity: 3,
    stats: { hp: 1211, atk: 158, def: 91, speed: 101 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boaroathtuskeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_oathtusker_gavel', name: 'Oathtusker\'s Gavel',
        icon: 'assets/icons/fc1461.png',
        description: 'Two measured blows: 100% then 31% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'damage', mult: 0.31 },
        ],
      },
      {
        id: 'boar_oathtusker_inquest', name: 'Oathtusker\'s Inquest',
        icon: 'assets/icons/fc862.png',
        description: 'Open the case: 170% ATK and the target takes +19% damage for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.7 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.19, turns: 2 },
        ],
      },
      {
        id: 'boar_oathtusker_verdict', name: 'Oathtusker\'s Verdict',
        icon: 'assets/icons/fc744.png',
        description: 'Deliver the verdict: 243% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.43 },
        ],
      },
    ],
    passive: {
      name: 'Oathtusker Justice',
      icon: 'assets/icons/fc863.png',
      description: 'Justice sees clearly: deals 30% extra damage to enemies with lowered crit chance.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'debuff' && fx.stat === 'critChance') ? 1.3 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  bear_gravemauler: {
    id: 'bear_gravemauler',
    element: 'dark',
    name: 'Bear Gravemauler',
    title: 'The sentence is the swing.',
    rarity: 3,
    stats: { hp: 1144, atk: 176, def: 90, speed: 102 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/beargravemauleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_gravemauler_edge', name: 'Gravemauler\'s Edge',
        icon: 'assets/icons/fc734.png',
        description: 'Two dark cuts: 71% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.71 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'bear_gravemauler_sentence', name: 'Gravemauler\'s Sentence',
        icon: 'assets/icons/fc730.png',
        description: 'Pass judgment: 181% ATK and the target takes +12% damage for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.81 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.12, turns: 1 },
        ],
      },
      {
        id: 'bear_gravemauler_end', name: 'Gravemauler\'s End',
        icon: 'assets/icons/fc728.png',
        description: 'Carry it out: 257% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.57 },
        ],
      },
    ],
    passive: {
      name: 'Gravemauler\'s Due',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 23% extra damage to enemies below 38% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.38 ? 1.23 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  bear_hexclaw: {
    id: 'bear_hexclaw',
    element: 'dark',
    name: 'Bear Hexclaw',
    title: 'Carries every curse worth having.',
    rarity: 3,
    stats: { hp: 1153, atk: 181, def: 93, speed: 104 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearhexclawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_hexclaw_lash', name: 'Hexclaw Lash',
        icon: 'assets/icons/fc1052.png',
        description: 'Two cursed lashes: 72% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.72 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'bear_hexclaw_bane', name: 'Hexclaw Bane',
        icon: 'assets/icons/fc1084.png',
        description: 'A layered curse: 182% ATK, -14% ATK and -10% DEF for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.82 },
          { type: 'debuff', stat: 'atk', mult: 0.86, turns: 2 },
          { type: 'debuff', stat: 'def', mult: 0.9, turns: 2 },
        ],
      },
      {
        id: 'bear_hexclaw_pall', name: 'Hexclaw Pall',
        icon: 'assets/icons/fc1050.png',
        description: 'A pall over everything: 136% ATK to ALL enemies and -3% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.36 },
          { type: 'debuff', stat: 'speed', mult: 0.97, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Hexclaw Craft',
      icon: 'assets/icons/fc1093.png',
      description: 'Curses honed in the dark.',
      hooks: { accuracyAdd: 0.09, dotBoostAdd: 0.09 },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  bear_bloodhoney: {
    id: 'bear_bloodhoney',
    element: 'dark',
    name: 'Bear Bloodhoney',
    title: 'Your vigor, redistributed.',
    rarity: 3,
    stats: { hp: 1162, atk: 186, def: 96, speed: 106 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearbloodhoneyidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_bloodhoney_sip', name: 'Bloodhoney\'s Sip',
        icon: 'assets/icons/fc1444.png',
        description: 'Two draining touches: 73% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.73 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'bear_bloodhoney_feast', name: 'Bloodhoney\'s Feast',
        icon: 'assets/icons/fc825.png',
        description: 'Drink deep: 183% ATK, healing himself for 42% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.83 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.42 },
        ],
      },
      {
        id: 'bear_bloodhoney_toll', name: 'Bloodhoney\'s Toll',
        icon: 'assets/icons/fc1112.png',
        description: 'Tax the living: 127% ATK to ALL enemies while he mends 12% of his max HP.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.27 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.12 },
        ],
      },
    ],
    passive: {
      name: 'Bloodhoney Hunger',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, siphons 2.6% of his max HP from a random enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const amount = Math.max(1, Math.round(unit.maxHp * 0.026));
          target.takeDamage(amount);
          unit.heal(amount);
          return null; // silent — small rolling hunger
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  bear_duskpelt: {
    id: 'bear_duskpelt',
    element: 'dark',
    name: 'Bear Duskpelt',
    title: 'The dark keeps its edge honed.',
    rarity: 3,
    stats: { hp: 1171, atk: 161, def: 99, speed: 108 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearduskpeltidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_duskpelt_flick', name: 'Duskpelt Flick',
        icon: 'assets/icons/fc1447.png',
        description: 'Two flickering cuts: 74% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.74 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'bear_duskpelt_waltz', name: 'Duskpelt Waltz',
        icon: 'assets/icons/fc1587.png',
        description: 'A step through shadow: 184% ATK and +12% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.84 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.12, turns: 1 },
        ],
      },
      {
        id: 'bear_duskpelt_finale', name: 'Duskpelt Finale',
        icon: 'assets/icons/fc723.png',
        description: 'The last figure: 248% ATK — 25% more against debuffed prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.48, bonusVs: { kind: 'debuff', mult: 1.25 } },
        ],
      },
    ],
    passive: {
      name: 'Duskpelt Poise',
      icon: 'assets/icons/fc862.png',
      description: 'A blade kept perfectly balanced (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.09, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.06, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  bear_dreadroar: {
    id: 'bear_dreadroar',
    element: 'dark',
    name: 'Bear Dreadroar',
    title: 'Fear arrives before the blow.',
    rarity: 3,
    stats: { hp: 1180, atk: 166, def: 78, speed: 110 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/beardreadroaridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_dreadroar_knell', name: 'Dreadroar Knell',
        icon: 'assets/icons/fc1003.png',
        description: 'Two tolling blows: 75% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'bear_dreadroar_omen', name: 'Dreadroar Omen',
        icon: 'assets/icons/fc1084.png',
        description: 'Name their doom: 165% ATK and -15% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.65 },
          { type: 'debuff', stat: 'atk', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'bear_dreadroar_chorus', name: 'Dreadroar Chorus',
        icon: 'assets/icons/fc807.png',
        description: 'The dread chorus: 134% ATK to ALL enemies and -6% crit chance for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.34 },
          { type: 'debuff', stat: 'critChance', add: -0.06, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Dreadroar Presence',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, dread spreads: ALL enemies lose 3% SPD for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const e of battle.livingUnits(unit.enemyTeam())) {
            e.addStatusEffect({ kind: 'debuff', stat: 'speed', mult: 0.97, turns: 1 });
          }
          return null; // silent — small rolling dread
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  bear_lightpaw: {
    id: 'bear_lightpaw',
    element: 'light',
    name: 'Bear Lightpaw',
    title: 'Every wound answers to the light.',
    rarity: 3,
    stats: { hp: 1189, atk: 171, def: 81, speed: 112 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearlightpawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_lightpaw_rebuke', name: 'Lightpaw\'s Rebuke',
        icon: 'assets/icons/fc1471.png',
        description: 'Two shining raps: 76% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.76 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'bear_lightpaw_grace', name: 'Lightpaw\'s Grace',
        icon: 'assets/icons/fc1112.png',
        description: 'Pour in the light: heals an ally 165% of ATK and cleanses their debuffs.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.65 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'bear_lightpaw_communion', name: 'Lightpaw\'s Communion',
        icon: 'assets/icons/fc800.png',
        description: 'Shared light: ALL allies heal 114% of ATK plus 1.7% of max HP regen for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.15 },
          { type: 'hot', pct: 0.017, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Lightpaw Devotion',
      icon: 'assets/icons/fc1093.png',
      description: 'Healing hands, steadied by faith.',
      hooks: { healBoostAdd: 0.16, resistanceAdd: 0.05 },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  bear_aegishide: {
    id: 'bear_aegishide',
    element: 'light',
    name: 'Bear Aegishide',
    title: 'A shield the sun would envy.',
    rarity: 3,
    stats: { hp: 1198, atk: 176, def: 84, speed: 96 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearaegishideidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_aegishide_check', name: 'Aegishide\'s Check',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield checks: 77% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.77 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'bear_aegishide_ward', name: 'Aegishide\'s Ward',
        icon: 'assets/icons/fc855.png',
        description: 'Raise the aegis over an ally: they take 7% less damage for 2 turns and heal 106% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.92, turns: 2 },
          { type: 'heal', mult: 1.06 },
        ],
      },
      {
        id: 'bear_aegishide_vigil', name: 'Aegishide\'s Vigil',
        icon: 'assets/icons/fc856.png',
        description: 'The unbroken vigil: ALL allies gain +12% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.13, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Aegishide Constancy',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, shields the most wounded ally: takes 5% less damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.94, turns: 1 });
          return null; // silent — small rolling shelter
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  bear_dawnclaw: {
    id: 'bear_dawnclaw',
    element: 'light',
    name: 'Bear Dawnclaw',
    title: 'Morning, sharpened.',
    rarity: 3,
    stats: { hp: 1207, atk: 181, def: 87, speed: 98 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/beardawnclawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_dawnclaw_stroke', name: 'Dawnclaw Stroke',
        icon: 'assets/icons/fc1587.png',
        description: 'Two dawn-lit strokes: 78% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.78 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'bear_dawnclaw_flare', name: 'Dawnclaw Flare',
        icon: 'assets/icons/fc1447.png',
        description: 'A flare of morning: 188% ATK, and the light mends 11% of max HP.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.88 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.11 },
        ],
      },
      {
        id: 'bear_dawnclaw_zenith', name: 'Dawnclaw Zenith',
        icon: 'assets/icons/fc730.png',
        description: 'High noon: 251% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.51 },
        ],
      },
    ],
    passive: {
      name: 'Dawnclaw Resolve',
      icon: 'assets/icons/fc1003.png',
      description: 'Heals 1.5% max HP at turn start while below 85% HP.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp >= 0.85) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.015));
          if (healed <= 0) return null;
          return {
            label: 'Dawnclaw Resolve',
            message: `${unit.name}'s light knits ${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#f8d86a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  bear_sunroarer: {
    id: 'bear_sunroarer',
    element: 'light',
    name: 'Bear Sunroarer',
    title: 'Good news travels armed.',
    rarity: 3,
    stats: { hp: 1216, atk: 186, def: 90, speed: 100 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearsunroareridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_sunroarer_call', name: 'Sunroarer\'s Call',
        icon: 'assets/icons/fc868.png',
        description: 'Two ringing notes: 79% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.79 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'bear_sunroarer_proclamation', name: 'Sunroarer\'s Proclamation',
        icon: 'assets/icons/fc869.png',
        description: 'Lift an ally: +16% ATK for 2 turns and 12% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.16, turns: 2 },
          { type: 'turnMeter', amount: 0.12 },
        ],
      },
      {
        id: 'bear_sunroarer_triumph', name: 'Sunroarer\'s Triumph',
        icon: 'assets/icons/fc882.png',
        description: 'Declare the day won: ALL allies gain +7% SPD for 2 turns and 3% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.07, turns: 2 },
          { type: 'turnMeter', amount: 0.03 },
        ],
      },
    ],
    passive: {
      name: 'Sunroarer Anthem',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start: ALL allies gain +5% crit damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) { a.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.05, turns: 1 }); }
          return null; // silent — small rolling anthem
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  bear_oathguard: {
    id: 'bear_oathguard',
    element: 'light',
    name: 'Bear Oathguard',
    title: 'Verdicts delivered in person.',
    rarity: 3,
    stats: { hp: 1225, atk: 161, def: 93, speed: 102 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearoathguardidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_oathguard_gavel', name: 'Oathguard\'s Gavel',
        icon: 'assets/icons/fc1461.png',
        description: 'Two measured blows: 80% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'bear_oathguard_inquest', name: 'Oathguard\'s Inquest',
        icon: 'assets/icons/fc862.png',
        description: 'Open the case: 180% ATK and the target takes +20% damage for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.8 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.2, turns: 2 },
        ],
      },
      {
        id: 'bear_oathguard_verdict', name: 'Oathguard\'s Verdict',
        icon: 'assets/icons/fc744.png',
        description: 'Deliver the verdict: 253% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.53 },
        ],
      },
    ],
    passive: {
      name: 'Oathguard Justice',
      icon: 'assets/icons/fc863.png',
      description: 'Justice sees clearly: deals 30% extra damage to weakened (ATK-debuffed) enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'debuff' && fx.stat === 'atk') ? 1.3 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  cat_headhunter: {
    id: 'cat_headhunter',
    element: 'dark',
    name: 'Cat Headhunter',
    title: 'The sentence is the swing.',
    rarity: 3,
    stats: { hp: 1158, atk: 179, def: 92, speed: 103 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catheadhunteridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_headhunter_edge', name: 'Headhunter\'s Edge',
        icon: 'assets/icons/fc734.png',
        description: 'Two dark cuts: 81% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.81 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'cat_headhunter_sentence', name: 'Headhunter\'s Sentence',
        icon: 'assets/icons/fc730.png',
        description: 'Pass judgment: 191% ATK and the target takes +12% damage for 1 turn.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.91 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.12, turns: 1 },
        ],
      },
      {
        id: 'cat_headhunter_end', name: 'Headhunter\'s End',
        icon: 'assets/icons/fc728.png',
        description: 'Carry it out: 267% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.67 },
        ],
      },
    ],
    passive: {
      name: 'Headhunter\'s Due',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 21% extra damage to enemies below 42% HP.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.alive && target.hp / target.maxHp < 0.42 ? 1.21 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  cat_hexwhisker: {
    id: 'cat_hexwhisker',
    element: 'dark',
    name: 'Cat Hexwhisker',
    title: 'Carries every curse worth having.',
    rarity: 3,
    stats: { hp: 1167, atk: 184, def: 95, speed: 105 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/cathexwhiskeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_hexwhisker_lash', name: 'Hexwhisker Lash',
        icon: 'assets/icons/fc1052.png',
        description: 'Two cursed lashes: 82% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.82 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'cat_hexwhisker_bane', name: 'Hexwhisker Bane',
        icon: 'assets/icons/fc1084.png',
        description: 'A layered curse: 192% ATK, -15% ATK and -11% DEF for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.92 },
          { type: 'debuff', stat: 'atk', mult: 0.85, turns: 2 },
          { type: 'debuff', stat: 'def', mult: 0.89, turns: 2 },
        ],
      },
      {
        id: 'cat_hexwhisker_pall', name: 'Hexwhisker Pall',
        icon: 'assets/icons/fc1050.png',
        description: 'A pall over everything: 145% ATK to ALL enemies and -4% SPD for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.46 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Hexwhisker Craft',
      icon: 'assets/icons/fc1093.png',
      description: 'Curses honed in the dark.',
      hooks: { accuracyAdd: 0.16, dotBoostAdd: 0.04 },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  cat_bloodlapper: {
    id: 'cat_bloodlapper',
    element: 'dark',
    name: 'Cat Bloodlapper',
    title: 'Your vigor, redistributed.',
    rarity: 3,
    stats: { hp: 1176, atk: 159, def: 98, speed: 107 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catbloodlapperidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_bloodlapper_sip', name: 'Bloodlapper\'s Sip',
        icon: 'assets/icons/fc1444.png',
        description: 'Two draining touches: 83% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.83 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'cat_bloodlapper_feast', name: 'Bloodlapper\'s Feast',
        icon: 'assets/icons/fc825.png',
        description: 'Drink deep: 193% ATK, healing himself for 44% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.93 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.44 },
        ],
      },
      {
        id: 'cat_bloodlapper_toll', name: 'Bloodlapper\'s Toll',
        icon: 'assets/icons/fc1112.png',
        description: 'Tax the living: 137% ATK to ALL enemies while he mends 13% of his max HP.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.37 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.13 },
        ],
      },
    ],
    passive: {
      name: 'Bloodlapper Hunger',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, siphons 2.8% of his max HP from a random enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const amount = Math.max(1, Math.round(unit.maxHp * 0.028));
          target.takeDamage(amount);
          unit.heal(amount);
          return null; // silent — small rolling hunger
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  cat_duskstalker: {
    id: 'cat_duskstalker',
    element: 'dark',
    name: 'Cat Duskstalker',
    title: 'The dark keeps its edge honed.',
    rarity: 3,
    stats: { hp: 1185, atk: 164, def: 101, speed: 109 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catduskstalkeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_duskstalker_flick', name: 'Duskstalker Flick',
        icon: 'assets/icons/fc1447.png',
        description: 'Two flickering cuts: 84% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.84 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'cat_duskstalker_waltz', name: 'Duskstalker Waltz',
        icon: 'assets/icons/fc1587.png',
        description: 'A step through shadow: 194% ATK and +13% crit chance for 1 turn.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.94 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.13, turns: 1 },
        ],
      },
      {
        id: 'cat_duskstalker_finale', name: 'Duskstalker Finale',
        icon: 'assets/icons/fc723.png',
        description: 'The last figure: 258% ATK — 25% more against debuffed prey.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.58, bonusVs: { kind: 'debuff', mult: 1.25 } },
        ],
      },
    ],
    passive: {
      name: 'Duskstalker Poise',
      icon: 'assets/icons/fc862.png',
      description: 'A blade kept perfectly balanced (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.04, turns: 2 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.06, turns: 2 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  cat_doomyowler: {
    id: 'cat_doomyowler',
    element: 'dark',
    name: 'Cat Doomyowler',
    title: 'Fear arrives before the blow.',
    rarity: 3,
    stats: { hp: 1194, atk: 169, def: 80, speed: 111 },
    tint: { body: '#2a2438', helm: '#443a56', weapon: '#8a6ab8', skin: '#9a92a8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catdoomyowleridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_doomyowler_knell', name: 'Doomyowler Knell',
        icon: 'assets/icons/fc1003.png',
        description: 'Two tolling blows: 85% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'cat_doomyowler_omen', name: 'Doomyowler Omen',
        icon: 'assets/icons/fc1084.png',
        description: 'Name their doom: 175% ATK and -16% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.75 },
          { type: 'debuff', stat: 'atk', mult: 0.84, turns: 2 },
        ],
      },
      {
        id: 'cat_doomyowler_chorus', name: 'Doomyowler Chorus',
        icon: 'assets/icons/fc807.png',
        description: 'The dread chorus: 144% ATK to ALL enemies and -7% crit chance for 1 turn.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.44 },
          { type: 'debuff', stat: 'critChance', add: -0.07, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Doomyowler Presence',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, dread spreads: ALL enemies lose 2.5% turn meter.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const e of battle.livingUnits(unit.enemyTeam())) {
            e.turnMeter = Math.max(0, e.turnMeter - CONFIG.TURN_METER_MAX * 0.025);
          }
          return null; // silent — small rolling dread
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
  },

  cat_lightpurr: {
    id: 'cat_lightpurr',
    element: 'light',
    name: 'Cat Lightpurr',
    title: 'Every wound answers to the light.',
    rarity: 3,
    stats: { hp: 1203, atk: 174, def: 83, speed: 113 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catlightpurridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_lightpurr_rebuke', name: 'Lightpurr\'s Rebuke',
        icon: 'assets/icons/fc1471.png',
        description: 'Two shining raps: 86% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.86 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'cat_lightpurr_grace', name: 'Lightpurr\'s Grace',
        icon: 'assets/icons/fc1112.png',
        description: 'Pour in the light: heals an ally 175% of ATK and cleanses their debuffs.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.75 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'cat_lightpurr_communion', name: 'Lightpurr\'s Communion',
        icon: 'assets/icons/fc800.png',
        description: 'Shared light: ALL allies heal 125% of ATK plus 1.8% of max HP regen for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.25 },
          { type: 'hot', pct: 0.017, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Lightpurr Devotion',
      icon: 'assets/icons/fc1093.png',
      description: 'Healing hands, steadied by faith.',
      hooks: { healBoostAdd: 0.24, dodgeAdd: 0.02 },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  cat_aegistail: {
    id: 'cat_aegistail',
    element: 'light',
    name: 'Cat Aegistail',
    title: 'A shield the sun would envy.',
    rarity: 3,
    stats: { hp: 1212, atk: 179, def: 86, speed: 97 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/cataegistailidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_aegistail_check', name: 'Aegistail\'s Check',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield checks: 87% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.87 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'cat_aegistail_ward', name: 'Aegistail\'s Ward',
        icon: 'assets/icons/fc855.png',
        description: 'Raise the aegis over an ally: they take 5% less damage for 2 turns and heal 116% of ATK.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.95, turns: 2 },
          { type: 'heal', mult: 1.16 },
        ],
      },
      {
        id: 'cat_aegistail_vigil', name: 'Aegistail\'s Vigil',
        icon: 'assets/icons/fc856.png',
        description: 'The unbroken vigil: ALL allies gain +13% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.14, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Aegistail Constancy',
      icon: 'assets/icons/fc868.png',
      description: 'At turn start, shields the most wounded ally: takes 3% less damage for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (allies.length === 0) return null;
          allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          allies[0].addStatusEffect({ kind: 'buff', stat: 'damageTaken', mult: 0.97, turns: 1 });
          return null; // silent — small rolling shelter
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  cat_dawnpouncer: {
    id: 'cat_dawnpouncer',
    element: 'light',
    name: 'Cat Dawnpouncer',
    title: 'Morning, sharpened.',
    rarity: 3,
    stats: { hp: 1221, atk: 184, def: 89, speed: 99 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catdawnpounceridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_dawnpouncer_stroke', name: 'Dawnpouncer Stroke',
        icon: 'assets/icons/fc1587.png',
        description: 'Two dawn-lit strokes: 88% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.88 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'cat_dawnpouncer_flare', name: 'Dawnpouncer Flare',
        icon: 'assets/icons/fc1447.png',
        description: 'A flare of morning: 198% ATK, and the light mends 12% of max HP.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.98 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.12 },
        ],
      },
      {
        id: 'cat_dawnpouncer_zenith', name: 'Dawnpouncer Zenith',
        icon: 'assets/icons/fc730.png',
        description: 'High noon: 261% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.61 },
        ],
      },
    ],
    passive: {
      name: 'Dawnpouncer Resolve',
      icon: 'assets/icons/fc1003.png',
      description: 'Heals 12% max HP at turn start while below 15% HP.',
      hooks: {
        onTurnStart(unit, battle) {
          if (unit.hp / unit.maxHp >= 0.15) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.12));
          if (healed <= 0) return null;
          return {
            label: 'Dawnpouncer Resolve',
            message: `${unit.name}'s light knits ${healed} HP.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#f8d86a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  cat_sunsinger: {
    id: 'cat_sunsinger',
    element: 'light',
    name: 'Cat Sunsinger',
    title: 'Good news travels armed.',
    rarity: 3,
    stats: { hp: 1230, atk: 159, def: 92, speed: 101 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catsunsingeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_sunsinger_call', name: 'Sunsinger\'s Call',
        icon: 'assets/icons/fc868.png',
        description: 'Two ringing notes: 89% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.89 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'cat_sunsinger_proclamation', name: 'Sunsinger\'s Proclamation',
        icon: 'assets/icons/fc869.png',
        description: 'Lift an ally: +17% ATK for 2 turns and 13% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.17, turns: 2 },
          { type: 'turnMeter', amount: 0.13 },
        ],
      },
      {
        id: 'cat_sunsinger_triumph', name: 'Sunsinger\'s Triumph',
        icon: 'assets/icons/fc882.png',
        description: 'Declare the day won: ALL allies gain +8% SPD for 2 turns and 4% turn meter.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.08, turns: 2 },
          { type: 'turnMeter', amount: 0.04 },
        ],
      },
    ],
    passive: {
      name: 'Sunsinger Anthem',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start: ALL allies gain +2% SPD for 2 turns.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) { a.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.02, turns: 2 }); }
          return null; // silent — small rolling anthem
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  cat_oathclaw: {
    id: 'cat_oathclaw',
    element: 'light',
    name: 'Cat Oathclaw',
    title: 'Verdicts delivered in person.',
    rarity: 3,
    stats: { hp: 1239, atk: 164, def: 95, speed: 103 },
    tint: { body: '#d8cba0', helm: '#f0e4b8', weapon: '#f8d86a', skin: '#e8dcc0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catoathclawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_oathclaw_gavel', name: 'Oathclaw\'s Gavel',
        icon: 'assets/icons/fc1461.png',
        description: 'Two measured blows: 90% then 37% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'damage', mult: 0.37 },
        ],
      },
      {
        id: 'cat_oathclaw_inquest', name: 'Oathclaw\'s Inquest',
        icon: 'assets/icons/fc862.png',
        description: 'Open the case: 190% ATK and the target takes +21% damage for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.9 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.21, turns: 2 },
        ],
      },
      {
        id: 'cat_oathclaw_verdict', name: 'Oathclaw\'s Verdict',
        icon: 'assets/icons/fc744.png',
        description: 'Deliver the verdict: 263% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.63 },
        ],
      },
    ],
    passive: {
      name: 'Oathclaw Justice',
      icon: 'assets/icons/fc863.png',
      description: 'Justice sees clearly: deals 25% extra damage to armor-broken enemies.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.statusEffects.some((fx) => fx.kind === 'debuff' && fx.stat === 'def') ? 1.25 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

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
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
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
          target.takeDamage(amount);
          unit.heal(amount);
          return null; // silent — small rolling hunger
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.12,
      description: 'Twilight Ground: +12% ATK from the chosen hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.12,
      description: 'Radiant Ground: +12% DEF in the chosen hex.',
    },
  },

  // ---- Champion cohorts: 4-star heroes for every race ---------------------
  // Elemental champions summon from Rare Scrolls; dark/light champions
  // from Temporal Scrolls. Placeholder art until idle sheets land.

  rat_warpike: {
    id: 'rat_warpike',
    element: 'water',
    name: 'Rat Warpike',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1390, atk: 196, def: 102, speed: 100 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_warpike/ratwarpikeidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_warpike_strike', name: 'Warpike\'s Strike',
        icon: 'assets/icons/fc730.png',
        description: 'Two champion blows: 71% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.71 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'rat_warpike_onslaught', name: 'Warpike\'s Onslaught',
        icon: 'assets/icons/fc1447.png',
        description: 'Press the advantage: 154% ATK, then +7% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.54 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.07, turns: 2 },
        ],
      },
      {
        id: 'rat_warpike_supremacy', name: 'Warpike\'s Supremacy',
        icon: 'assets/icons/fc767.png',
        description: 'Settle it: 205% ATK and -6% DEF for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.05 },
          { type: 'debuff', stat: 'def', mult: 0.94, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Warpike Supremacy',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 5% more and takes 3% less damage.',
      hooks: {
        damageDealtMult() { return 1.05; },
        damageTakenMult() { return 0.97; },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
  },

  rat_hexcrown: {
    id: 'rat_hexcrown',
    element: 'fire',
    name: 'Rat Hexcrown',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1402, atk: 202, def: 106, speed: 103 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_hexcrown/rathexcrownidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_hexcrown_bolt', name: 'Hexcrown\'s Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'Twin arcane bolts: 72% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.72 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'rat_hexcrown_torrent', name: 'Hexcrown\'s Torrent',
        icon: 'assets/icons/fc1084.png',
        description: 'A torrent of power: 95% ATK to ALL enemies and -4% SPD for 2 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 2 },
        ],
      },
      {
        id: 'rat_hexcrown_cataclysm', name: 'Hexcrown\'s Cataclysm',
        icon: 'assets/icons/fc1044.png',
        description: 'The big one: 111% ATK to ALL enemies and -7% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.11 },
          { type: 'debuff', stat: 'atk', mult: 0.93, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Hexcrown Resonance',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, arcane bleed sears ALL enemies for 1.5% of this hero\\u0027s ATK.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.effectiveStat('atk') * 0.015));
          for (const e of enemies) e.takeDamage(amount);
          return null; // silent — small rolling resonance
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  rat_wallwhisker: {
    id: 'rat_wallwhisker',
    element: 'wind',
    name: 'Rat Wallwhisker',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1414, atk: 208, def: 110, speed: 106 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_wallwhisker/ratwallwhiskeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_wallwhisker_bash', name: 'Wallwhisker\'s Bash',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield strikes: 73% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.73 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'rat_wallwhisker_bulwark', name: 'Wallwhisker\'s Bulwark',
        icon: 'assets/icons/fc855.png',
        description: 'Anchor the line: ALL allies gain +9% DEF for 2 turns and take 3% less damage for 1 turn.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.09, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.97, turns: 1 },
        ],
      },
      {
        id: 'rat_wallwhisker_stand', name: 'Wallwhisker\'s Stand',
        icon: 'assets/icons/fc856.png',
        description: 'Refuse to fall: takes 26% less damage for 2 turns and heals 8% max HP.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.74, turns: 2 },
          { type: 'healHpPct', pct: 0.08 },
        ],
      },
    ],
    passive: {
      name: 'Wallwhisker Aegis',
      icon: 'assets/icons/fc868.png',
      description: 'Takes 15% less damage while holding a front hex above half HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.slot && unit.slot.position === POSITION.FRONT && unit.hp / unit.maxHp > 0.5 ? 0.85 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  rat_longsight: {
    id: 'rat_longsight',
    element: 'water',
    name: 'Rat Longsight',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1426, atk: 214, def: 114, speed: 109 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_longsight/ratlongsightidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_longsight_shot', name: 'Longsight\'s Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'Two placed shots: 74% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.74 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'rat_longsight_deadeye', name: 'Longsight\'s Deadeye',
        icon: 'assets/icons/fc1516.png',
        description: 'The perfect line: 167% ATK and drains 7% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.67 },
          { type: 'turnMeter', amount: -0.07 },
        ],
      },
      {
        id: 'rat_longsight_barrage', name: 'Longsight\'s Barrage',
        icon: 'assets/icons/fc807.png',
        description: 'Fill the sky: 93% ATK to ALL enemies.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.93 },
          { type: 'turnMeter', amount: -0.01 },
        ],
      },
    ],
    passive: {
      name: 'Longsight Focus',
      icon: 'assets/icons/fc862.png',
      description: 'The shot is already lined up (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.10, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.10, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
  },

  rat_mistmender: {
    id: 'rat_mistmender',
    element: 'fire',
    name: 'Rat Mistmender',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1438, atk: 220, def: 118, speed: 112 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_mistmender/ratmistmenderidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_mistmender_touch', name: 'Mistmender\'s Touch',
        icon: 'assets/icons/fc1112.png',
        description: 'Two chastening touches: 75% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'rat_mistmender_blessing', name: 'Mistmender\'s Blessing',
        icon: 'assets/icons/fc800.png',
        description: 'Mend an ally: 12% of max HP plus 1.5% regen for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.12 },
          { type: 'hot', pct: 0.015, turns: 2 },
        ],
      },
      {
        id: 'rat_mistmender_renewal', name: 'Mistmender\'s Renewal',
        icon: 'assets/icons/fc869.png',
        description: 'The circle holds: ALL allies heal 38% of ATK, are cleansed, and gain +4% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.38 },
          { type: 'cleanse' },
          { type: 'buff', stat: 'def', mult: 1.04, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Mistmender Communion',
      icon: 'assets/icons/fc1003.png',
      description: 'Healing woven a little stronger.',
      hooks: { healBoostAdd: 0.13 },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  rat_nullfang: {
    id: 'rat_nullfang',
    element: 'dark',
    name: 'Rat Nullfang',
    title: 'Champion of the Dark',
    rarity: 4,
    stats: { hp: 1450, atk: 226, def: 122, speed: 115 },
    tint: { body: '#241f33', helm: '#3d3350', weapon: '#9a7ad0', skin: '#8a82a0' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_nullfang/ratnullfangidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_nullfang_grasp', name: 'Nullfang\'s Grasp',
        icon: 'assets/icons/fc1444.png',
        description: 'Two grasping shadows: 76% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.76 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'rat_nullfang_devour', name: 'Nullfang\'s Devour',
        icon: 'assets/icons/fc825.png',
        description: 'Feed the void: 149% ATK, healing this hero for 26% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.49 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.26 },
        ],
      },
      {
        id: 'rat_nullfang_oblivion', name: 'Nullfang\'s Oblivion',
        icon: 'assets/icons/fc734.png',
        description: 'Unmake them: 220% ATK and the target takes +16% damage for 1 turn.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.2 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.16, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Nullfang Thirst',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, drains 1% of max HP from the weakest enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          enemies.sort((a, b) => a.hp - b.hp);
          const amount = Math.max(1, Math.round(unit.maxHp * 0.01));
          enemies[0].takeDamage(amount);
          unit.heal(amount);
          return null; // silent — small rolling thirst
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
  },

  rat_glorytail: {
    id: 'rat_glorytail',
    element: 'light',
    name: 'Rat Glorytail',
    title: 'Champion of the Dawn',
    rarity: 4,
    stats: { hp: 1462, atk: 196, def: 126, speed: 101 },
    tint: { body: '#e0d3a8', helm: '#f5e9c0', weapon: '#ffdf70', skin: '#f0e4c8' },
    sprite: {
      displayH: 70,
      strips: {
        idle: { src: 'assets/heroes/rat_glorytail/ratglorytailidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'rat_glorytail_radiance', name: 'Glorytail\'s Radiance',
        icon: 'assets/icons/fc1471.png',
        description: 'Two radiant strikes: 77% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.77 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'rat_glorytail_benediction', name: 'Glorytail\'s Benediction',
        icon: 'assets/icons/fc1112.png',
        description: 'Bless an ally: heals 14% of max HP and grants 8% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.14 },
          { type: 'turnMeter', amount: 0.08 },
        ],
      },
      {
        id: 'rat_glorytail_ascension', name: 'Glorytail\'s Ascension',
        icon: 'assets/icons/fc855.png',
        description: 'Lift the whole line: ALL allies heal 44% of ATK and gain +5% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.44 },
          { type: 'buff', stat: 'atk', mult: 1.05, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Glorytail Benevolence',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, ALL allies heal 0.4% of this hero\\u0027s max HP and gain a small atk blessing for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) {
            a.heal(Math.round(unit.maxHp * 0.004));
            a.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.02, turns: 1 });
          }
          return null; // silent — small rolling benevolence
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  osprey_seahammer: {
    id: 'osprey_seahammer',
    element: 'fire',
    name: 'Osprey Seahammer',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1406, atk: 200, def: 105, speed: 102 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Ospreyseahammeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'osprey_seahammer_strike', name: 'Seahammer\'s Strike',
        icon: 'assets/icons/fc730.png',
        description: 'Two champion blows: 78% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.78 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'osprey_seahammer_onslaught', name: 'Seahammer\'s Onslaught',
        icon: 'assets/icons/fc1447.png',
        description: 'Press the advantage: 161% ATK, then +8% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.61 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.08, turns: 2 },
        ],
      },
      {
        id: 'osprey_seahammer_supremacy', name: 'Seahammer\'s Supremacy',
        icon: 'assets/icons/fc767.png',
        description: 'Settle it: 212% ATK and -7% DEF for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.12 },
          { type: 'debuff', stat: 'def', mult: 0.93, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Seahammer Supremacy',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 7% more and takes 5% less damage.',
      hooks: {
        damageDealtMult() { return 1.07; },
        damageTakenMult() { return 0.95; },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
  },

  kestrel_spellgale: {
    id: 'kestrel_spellgale',
    element: 'wind',
    name: 'Kestrel Spellgale',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1418, atk: 206, def: 109, speed: 105 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Kestrelspellgaleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'kestrel_spellgale_bolt', name: 'Spellgale\'s Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'Twin arcane bolts: 79% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.79 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'kestrel_spellgale_torrent', name: 'Spellgale\'s Torrent',
        icon: 'assets/icons/fc1084.png',
        description: 'A torrent of power: 102% ATK to ALL enemies and -5% SPD for 2 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.02 },
          { type: 'debuff', stat: 'speed', mult: 0.95, turns: 2 },
        ],
      },
      {
        id: 'kestrel_spellgale_cataclysm', name: 'Spellgale\'s Cataclysm',
        icon: 'assets/icons/fc1044.png',
        description: 'The big one: 118% ATK to ALL enemies and -8% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.18 },
          { type: 'debuff', stat: 'atk', mult: 0.92, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Spellgale Resonance',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, arcane bleed sears ALL enemies for 0.8% of this hero\\u0027s max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.maxHp * 0.008));
          for (const e of enemies) e.takeDamage(amount);
          return null; // silent — small rolling resonance
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  condor_skywall: {
    id: 'condor_skywall',
    element: 'water',
    name: 'Condor Skywall',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1430, atk: 212, def: 113, speed: 108 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Condorskywallidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'condor_skywall_bash', name: 'Skywall\'s Bash',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield strikes: 80% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'condor_skywall_bulwark', name: 'Skywall\'s Bulwark',
        icon: 'assets/icons/fc855.png',
        description: 'Anchor the line: ALL allies gain +10% DEF for 2 turns and take 4% less damage for 1 turn.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.1, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.96, turns: 1 },
        ],
      },
      {
        id: 'condor_skywall_stand', name: 'Skywall\'s Stand',
        icon: 'assets/icons/fc856.png',
        description: 'Refuse to fall: takes 27% less damage for 2 turns and heals 9% max HP.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.73, turns: 2 },
          { type: 'healHpPct', pct: 0.09 },
        ],
      },
    ],
    passive: {
      name: 'Skywall Aegis',
      icon: 'assets/icons/fc868.png',
      description: 'Takes 16% less damage while holding the center hex above half HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.slot && unit.slot.position === POSITION.CENTER && unit.hp / unit.maxHp > 0.5 ? 0.84 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  harrier_farstrike: {
    id: 'harrier_farstrike',
    element: 'fire',
    name: 'Harrier Farstrike',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1442, atk: 218, def: 117, speed: 111 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Harrierfarstrikeidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'harrier_farstrike_shot', name: 'Farstrike\'s Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'Two placed shots: 81% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.81 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'harrier_farstrike_deadeye', name: 'Farstrike\'s Deadeye',
        icon: 'assets/icons/fc1516.png',
        description: 'The perfect line: 174% ATK and drains 8% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.74 },
          { type: 'turnMeter', amount: -0.08 },
        ],
      },
      {
        id: 'harrier_farstrike_barrage', name: 'Farstrike\'s Barrage',
        icon: 'assets/icons/fc807.png',
        description: 'Fill the sky: 100% ATK to ALL enemies.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'turnMeter', amount: -0.02 },
        ],
      },
    ],
    passive: {
      name: 'Farstrike Focus',
      icon: 'assets/icons/fc862.png',
      description: 'The shot is already lined up (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.04, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.07, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
  },

  flamingo_rosemyst: {
    id: 'flamingo_rosemyst',
    element: 'wind',
    name: 'Flamingo Rosemyst',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1454, atk: 224, def: 121, speed: 114 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Flamingorosemystidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'flamingo_rosemyst_touch', name: 'Rosemyst\'s Touch',
        icon: 'assets/icons/fc1112.png',
        description: 'Two chastening touches: 82% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.82 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'flamingo_rosemyst_blessing', name: 'Rosemyst\'s Blessing',
        icon: 'assets/icons/fc800.png',
        description: 'Mend an ally: 13% of max HP plus 1.7% regen for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.13 },
          { type: 'hot', pct: 0.017, turns: 2 },
        ],
      },
      {
        id: 'flamingo_rosemyst_renewal', name: 'Rosemyst\'s Renewal',
        icon: 'assets/icons/fc869.png',
        description: 'The circle holds: ALL allies heal 40% of ATK, are cleansed, and gain +5% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.4 },
          { type: 'cleanse' },
          { type: 'buff', stat: 'def', mult: 1.05, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Rosemyst Communion',
      icon: 'assets/icons/fc1003.png',
      description: 'Healing woven a little stronger.',
      hooks: { healBoostAdd: 0.17 },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  skua_voidbeak: {
    id: 'skua_voidbeak',
    element: 'dark',
    name: 'Skua Voidbeak',
    title: 'Champion of the Dark',
    rarity: 4,
    stats: { hp: 1466, atk: 230, def: 125, speed: 100 },
    tint: { body: '#241f33', helm: '#3d3350', weapon: '#9a7ad0', skin: '#8a82a0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Skuavoidbeakidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'skua_voidbeak_grasp', name: 'Voidbeak\'s Grasp',
        icon: 'assets/icons/fc1444.png',
        description: 'Two grasping shadows: 83% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.83 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'skua_voidbeak_devour', name: 'Voidbeak\'s Devour',
        icon: 'assets/icons/fc825.png',
        description: 'Feed the void: 156% ATK, healing this hero for 28% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.56 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.28 },
        ],
      },
      {
        id: 'skua_voidbeak_oblivion', name: 'Voidbeak\'s Oblivion',
        icon: 'assets/icons/fc734.png',
        description: 'Unmake them: 227% ATK and the target takes +17% damage for 1 turn.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.27 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.17, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Voidbeak Thirst',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, drains 1.3% of max HP from the weakest enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          enemies.sort((a, b) => a.hp - b.hp);
          const amount = Math.max(1, Math.round(unit.maxHp * 0.013));
          enemies[0].takeDamage(amount);
          unit.heal(amount);
          return null; // silent — small rolling thirst
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
  },

  tern_lightcrest: {
    id: 'tern_lightcrest',
    element: 'light',
    name: 'Tern Lightcrest',
    title: 'Champion of the Dawn',
    rarity: 4,
    stats: { hp: 1478, atk: 200, def: 103, speed: 103 },
    tint: { body: '#e0d3a8', helm: '#f5e9c0', weapon: '#ffdf70', skin: '#f0e4c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/Ternlightcrestidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'tern_lightcrest_radiance', name: 'Lightcrest\'s Radiance',
        icon: 'assets/icons/fc1471.png',
        description: 'Two radiant strikes: 84% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.84 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'tern_lightcrest_benediction', name: 'Lightcrest\'s Benediction',
        icon: 'assets/icons/fc1112.png',
        description: 'Bless an ally: heals 15% of max HP and grants 9% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.15 },
          { type: 'turnMeter', amount: 0.09 },
        ],
      },
      {
        id: 'tern_lightcrest_ascension', name: 'Lightcrest\'s Ascension',
        icon: 'assets/icons/fc855.png',
        description: 'Lift the whole line: ALL allies heal 46% of ATK and gain +6% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.46 },
          { type: 'buff', stat: 'atk', mult: 1.06, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Lightcrest Benevolence',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, ALL allies heal 0.6% of this hero\\u0027s max HP and gain a small def blessing for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) {
            a.heal(Math.round(unit.maxHp * 0.006));
            a.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.03, turns: 1 });
          }
          return null; // silent — small rolling benevolence
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
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
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
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
      description: 'At turn start, arcane bleed sears ALL enemies for 2% of this hero\\u0027s DEF.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.effectiveStat('def') * 0.02));
          for (const e of enemies) e.takeDamage(amount);
          return null; // silent — small rolling resonance
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
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
      description: 'Takes 22% less damage while holding a front hex below half HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.slot && unit.slot.position === POSITION.FRONT && unit.hp / unit.maxHp < 0.5 ? 0.78 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
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
          enemies[0].takeDamage(amount);
          unit.heal(amount);
          return null; // silent — small rolling thirst
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
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
      description: 'At turn start, ALL allies heal 0.8% of this hero\\u0027s max HP and gain a small crit blessing for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) {
            a.heal(Math.round(unit.maxHp * 0.008));
            a.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.02, turns: 1 });
          }
          return null; // silent — small rolling benevolence
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  snake_fangbrand: {
    id: 'snake_fangbrand',
    element: 'water',
    name: 'Snake Fangbrand',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1438, atk: 208, def: 111, speed: 106 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakefangbrandidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_fangbrand_strike', name: 'Fangbrand\'s Strike',
        icon: 'assets/icons/fc730.png',
        description: 'Two champion blows: 92% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.92 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'snake_fangbrand_onslaught', name: 'Fangbrand\'s Onslaught',
        icon: 'assets/icons/fc1447.png',
        description: 'Press the advantage: 175% ATK, then +10% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.75 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.1, turns: 2 },
        ],
      },
      {
        id: 'snake_fangbrand_supremacy', name: 'Fangbrand\'s Supremacy',
        icon: 'assets/icons/fc767.png',
        description: 'Settle it: 226% ATK and -9% DEF for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.26 },
          { type: 'debuff', stat: 'def', mult: 0.91, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Fangbrand Supremacy',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 10% more and takes 4% less damage.',
      hooks: {
        damageDealtMult() { return 1.1; },
        damageTakenMult() { return 0.96; },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
  },

  snake_spellscale: {
    id: 'snake_spellscale',
    element: 'fire',
    name: 'Snake Spellscale',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1450, atk: 214, def: 115, speed: 109 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakespellscaleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_spellscale_bolt', name: 'Spellscale\'s Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'Twin arcane bolts: 93% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.93 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'snake_spellscale_torrent', name: 'Spellscale\'s Torrent',
        icon: 'assets/icons/fc1084.png',
        description: 'A torrent of power: 116% ATK to ALL enemies and -7% SPD for 2 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.16 },
          { type: 'debuff', stat: 'speed', mult: 0.93, turns: 2 },
        ],
      },
      {
        id: 'snake_spellscale_cataclysm', name: 'Spellscale\'s Cataclysm',
        icon: 'assets/icons/fc1044.png',
        description: 'The big one: 132% ATK to ALL enemies and -7% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.32 },
          { type: 'debuff', stat: 'atk', mult: 0.93, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Spellscale Resonance',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, arcane bleed sears ALL enemies for 2.5% of this hero\\u0027s ATK.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.effectiveStat('atk') * 0.025));
          for (const e of enemies) e.takeDamage(amount);
          return null; // silent — small rolling resonance
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  snake_wallcoil: {
    id: 'snake_wallcoil',
    element: 'wind',
    name: 'Snake Wallcoil',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1462, atk: 220, def: 119, speed: 112 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakewallcoilidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_wallcoil_bash', name: 'Wallcoil\'s Bash',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield strikes: 94% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.94 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'snake_wallcoil_bulwark', name: 'Wallcoil\'s Bulwark',
        icon: 'assets/icons/fc855.png',
        description: 'Anchor the line: ALL allies gain +12% DEF for 2 turns and take 3% less damage for 1 turn.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.12, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.97, turns: 1 },
        ],
      },
      {
        id: 'snake_wallcoil_stand', name: 'Wallcoil\'s Stand',
        icon: 'assets/icons/fc856.png',
        description: 'Refuse to fall: takes 29% less damage for 2 turns and heals 11% max HP.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.71, turns: 2 },
          { type: 'healHpPct', pct: 0.11 },
        ],
      },
    ],
    passive: {
      name: 'Wallcoil Aegis',
      icon: 'assets/icons/fc868.png',
      description: 'Takes 13% less damage while in a back hex.',
      hooks: {
        damageTakenMult(unit) {
          return unit.slot && unit.slot.position === POSITION.BACK ? 0.87 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  snake_farfang: {
    id: 'snake_farfang',
    element: 'water',
    name: 'Snake Farfang',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1474, atk: 226, def: 123, speed: 115 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakefarfangidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_farfang_shot', name: 'Farfang\'s Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'Two placed shots: 95% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'snake_farfang_deadeye', name: 'Farfang\'s Deadeye',
        icon: 'assets/icons/fc1516.png',
        description: 'The perfect line: 188% ATK and drains 10% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.88 },
          { type: 'turnMeter', amount: -0.1 },
        ],
      },
      {
        id: 'snake_farfang_barrage', name: 'Farfang\'s Barrage',
        icon: 'assets/icons/fc807.png',
        description: 'Fill the sky: 114% ATK to ALL enemies.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.14 },
          { type: 'turnMeter', amount: -0.02 },
        ],
      },
    ],
    passive: {
      name: 'Farfang Focus',
      icon: 'assets/icons/fc862.png',
      description: 'The shot is already lined up (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critDamage', add: 0.22, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
  },

  snake_mystcoil: {
    id: 'snake_mystcoil',
    element: 'fire',
    name: 'Snake Mystcoil',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1486, atk: 196, def: 127, speed: 101 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakemystcoilidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_mystcoil_touch', name: 'Mystcoil\'s Touch',
        icon: 'assets/icons/fc1112.png',
        description: 'Two chastening touches: 96% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'snake_mystcoil_blessing', name: 'Mystcoil\'s Blessing',
        icon: 'assets/icons/fc800.png',
        description: 'Mend an ally: 15% of max HP plus 2.1% regen for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.15 },
          { type: 'hot', pct: 0.021, turns: 2 },
        ],
      },
      {
        id: 'snake_mystcoil_renewal', name: 'Mystcoil\'s Renewal',
        icon: 'assets/icons/fc869.png',
        description: 'The circle holds: ALL allies heal 44% of ATK, are cleansed, and gain +4% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.44 },
          { type: 'cleanse' },
          { type: 'buff', stat: 'def', mult: 1.04, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Mystcoil Communion',
      icon: 'assets/icons/fc1003.png',
      description: 'Healing woven a little stronger.',
      hooks: { healBoostAdd: 0.21 },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  snake_nullscale: {
    id: 'snake_nullscale',
    element: 'dark',
    name: 'Snake Nullscale',
    title: 'Champion of the Dark',
    rarity: 4,
    stats: { hp: 1498, atk: 202, def: 105, speed: 104 },
    tint: { body: '#241f33', helm: '#3d3350', weapon: '#9a7ad0', skin: '#8a82a0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakenullscaleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_nullscale_grasp', name: 'Nullscale\'s Grasp',
        icon: 'assets/icons/fc1444.png',
        description: 'Two grasping shadows: 97% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.97 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'snake_nullscale_devour', name: 'Nullscale\'s Devour',
        icon: 'assets/icons/fc825.png',
        description: 'Feed the void: 170% ATK, healing this hero for 32% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.7 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.32 },
        ],
      },
      {
        id: 'snake_nullscale_oblivion', name: 'Nullscale\'s Oblivion',
        icon: 'assets/icons/fc734.png',
        description: 'Unmake them: 241% ATK and the target takes +19% damage for 1 turn.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.41 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.19, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Nullscale Thirst',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, drains 1.9% of max HP from the weakest enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          enemies.sort((a, b) => a.hp - b.hp);
          const amount = Math.max(1, Math.round(unit.maxHp * 0.019));
          enemies[0].takeDamage(amount);
          unit.heal(amount);
          return null; // silent — small rolling thirst
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
  },

  snake_glorycoil: {
    id: 'snake_glorycoil',
    element: 'light',
    name: 'Snake Glorycoil',
    title: 'Champion of the Dawn',
    rarity: 4,
    stats: { hp: 1510, atk: 208, def: 109, speed: 107 },
    tint: { body: '#e0d3a8', helm: '#f5e9c0', weapon: '#ffdf70', skin: '#f0e4c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/snakeglorycoilidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'snake_glorycoil_radiance', name: 'Glorycoil\'s Radiance',
        icon: 'assets/icons/fc1471.png',
        description: 'Two radiant strikes: 98% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.98 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'snake_glorycoil_benediction', name: 'Glorycoil\'s Benediction',
        icon: 'assets/icons/fc1112.png',
        description: 'Bless an ally: heals 17% of max HP and grants 11% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.17 },
          { type: 'turnMeter', amount: 0.11 },
        ],
      },
      {
        id: 'snake_glorycoil_ascension', name: 'Glorycoil\'s Ascension',
        icon: 'assets/icons/fc855.png',
        description: 'Lift the whole line: ALL allies heal 50% of ATK and gain +8% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.5 },
          { type: 'buff', stat: 'atk', mult: 1.08, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Glorycoil Benevolence',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, ALL allies heal 1.2% of this hero\\u0027s max HP and gain a small speed blessing for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) {
            a.heal(Math.round(unit.maxHp * 0.012));
            a.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.02, turns: 1 });
          }
          return null; // silent — small rolling benevolence
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  wolf_bladefang: {
    id: 'wolf_bladefang',
    element: 'fire',
    name: 'Wolf Bladefang',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1454, atk: 212, def: 114, speed: 108 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfbladefangidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_bladefang_strike', name: 'Bladefang\'s Strike',
        icon: 'assets/icons/fc730.png',
        description: 'Two champion blows: 99% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.99 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'wolf_bladefang_onslaught', name: 'Bladefang\'s Onslaught',
        icon: 'assets/icons/fc1447.png',
        description: 'Press the advantage: 182% ATK, then +11% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.82 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.11, turns: 2 },
        ],
      },
      {
        id: 'wolf_bladefang_supremacy', name: 'Bladefang\'s Supremacy',
        icon: 'assets/icons/fc767.png',
        description: 'Settle it: 233% ATK and -10% DEF for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.33 },
          { type: 'debuff', stat: 'def', mult: 0.9, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Bladefang Supremacy',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 4% more and takes 7% less damage.',
      hooks: {
        damageDealtMult() { return 1.04; },
        damageTakenMult() { return 0.93; },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
  },

  wolf_runehowl: {
    id: 'wolf_runehowl',
    element: 'wind',
    name: 'Wolf Runehowl',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1466, atk: 218, def: 118, speed: 111 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfrunehowlidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_runehowl_bolt', name: 'Runehowl\'s Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'Twin arcane bolts: 100% then 43% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'damage', mult: 0.43 },
        ],
      },
      {
        id: 'wolf_runehowl_torrent', name: 'Runehowl\'s Torrent',
        icon: 'assets/icons/fc1084.png',
        description: 'A torrent of power: 123% ATK to ALL enemies and -4% SPD for 2 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.23 },
          { type: 'debuff', stat: 'speed', mult: 0.96, turns: 2 },
        ],
      },
      {
        id: 'wolf_runehowl_cataclysm', name: 'Runehowl\'s Cataclysm',
        icon: 'assets/icons/fc1044.png',
        description: 'The big one: 139% ATK to ALL enemies and -8% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.39 },
          { type: 'debuff', stat: 'atk', mult: 0.92, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Runehowl Resonance',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, arcane bleed sears ALL enemies for 1.2% of this hero\\u0027s max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.maxHp * 0.012));
          for (const e of enemies) e.takeDamage(amount);
          return null; // silent — small rolling resonance
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  wolf_shieldmane: {
    id: 'wolf_shieldmane',
    element: 'water',
    name: 'Wolf Shieldmane',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1478, atk: 224, def: 122, speed: 114 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfshieldmaneidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_shieldmane_bash', name: 'Shieldmane\'s Bash',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield strikes: 71% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.71 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'wolf_shieldmane_bulwark', name: 'Shieldmane\'s Bulwark',
        icon: 'assets/icons/fc855.png',
        description: 'Anchor the line: ALL allies gain +13% DEF for 2 turns and take 4% less damage for 1 turn.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.13, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.96, turns: 1 },
        ],
      },
      {
        id: 'wolf_shieldmane_stand', name: 'Shieldmane\'s Stand',
        icon: 'assets/icons/fc856.png',
        description: 'Refuse to fall: takes 30% less damage for 2 turns and heals 12% max HP.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.7, turns: 2 },
          { type: 'healHpPct', pct: 0.12 },
        ],
      },
    ],
    passive: {
      name: 'Shieldmane Aegis',
      icon: 'assets/icons/fc868.png',
      description: 'Takes 13% less damage while above 65% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.hp / unit.maxHp > 0.65 ? 0.87 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  wolf_farhowl: {
    id: 'wolf_farhowl',
    element: 'fire',
    name: 'Wolf Farhowl',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1490, atk: 230, def: 126, speed: 100 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolffarhowlidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_farhowl_shot', name: 'Farhowl\'s Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'Two placed shots: 72% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.72 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'wolf_farhowl_deadeye', name: 'Farhowl\'s Deadeye',
        icon: 'assets/icons/fc1516.png',
        description: 'The perfect line: 195% ATK and drains 11% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.95 },
          { type: 'turnMeter', amount: -0.11 },
        ],
      },
      {
        id: 'wolf_farhowl_barrage', name: 'Farhowl\'s Barrage',
        icon: 'assets/icons/fc807.png',
        description: 'Fill the sky: 121% ATK to ALL enemies.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.21 },
          { type: 'turnMeter', amount: -0.01 },
        ],
      },
    ],
    passive: {
      name: 'Farhowl Focus',
      icon: 'assets/icons/fc862.png',
      description: 'The shot is already lined up (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.13, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
  },

  wolf_mistmane: {
    id: 'wolf_mistmane',
    element: 'wind',
    name: 'Wolf Mistmane',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1502, atk: 200, def: 104, speed: 103 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfmistmaneidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_mistmane_touch', name: 'Mistmane\'s Touch',
        icon: 'assets/icons/fc1112.png',
        description: 'Two chastening touches: 73% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.73 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'wolf_mistmane_blessing', name: 'Mistmane\'s Blessing',
        icon: 'assets/icons/fc800.png',
        description: 'Mend an ally: 16% of max HP plus 2.3% regen for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.16 },
          { type: 'hot', pct: 0.023, turns: 2 },
        ],
      },
      {
        id: 'wolf_mistmane_renewal', name: 'Mistmane\'s Renewal',
        icon: 'assets/icons/fc869.png',
        description: 'The circle holds: ALL allies heal 46% of ATK, are cleansed, and gain +5% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.46 },
          { type: 'cleanse' },
          { type: 'buff', stat: 'def', mult: 1.05, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Mistmane Communion',
      icon: 'assets/icons/fc1003.png',
      description: 'Healing woven a little stronger.',
      hooks: { healBoostAdd: 0.23 },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  wolf_nullmaw: {
    id: 'wolf_nullmaw',
    element: 'dark',
    name: 'Wolf Nullmaw',
    title: 'Champion of the Dark',
    rarity: 4,
    stats: { hp: 1514, atk: 206, def: 108, speed: 106 },
    tint: { body: '#241f33', helm: '#3d3350', weapon: '#9a7ad0', skin: '#8a82a0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfnullmawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_nullmaw_grasp', name: 'Nullmaw\'s Grasp',
        icon: 'assets/icons/fc1444.png',
        description: 'Two grasping shadows: 74% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.74 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'wolf_nullmaw_devour', name: 'Nullmaw\'s Devour',
        icon: 'assets/icons/fc825.png',
        description: 'Feed the void: 177% ATK, healing this hero for 34% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.77 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.34 },
        ],
      },
      {
        id: 'wolf_nullmaw_oblivion', name: 'Nullmaw\'s Oblivion',
        icon: 'assets/icons/fc734.png',
        description: 'Unmake them: 248% ATK and the target takes +20% damage for 1 turn.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.48 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.2, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Nullmaw Thirst',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, drains 2.1% of max HP from the weakest enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          enemies.sort((a, b) => a.hp - b.hp);
          const amount = Math.max(1, Math.round(unit.maxHp * 0.021));
          enemies[0].takeDamage(amount);
          unit.heal(amount);
          return null; // silent — small rolling thirst
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
  },

  wolf_glorymane: {
    id: 'wolf_glorymane',
    element: 'light',
    name: 'Wolf Glorymane',
    title: 'Champion of the Dawn',
    rarity: 4,
    stats: { hp: 1526, atk: 212, def: 112, speed: 109 },
    tint: { body: '#e0d3a8', helm: '#f5e9c0', weapon: '#ffdf70', skin: '#f0e4c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/wolfglorymaneidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'wolf_glorymane_radiance', name: 'Glorymane\'s Radiance',
        icon: 'assets/icons/fc1471.png',
        description: 'Two radiant strikes: 75% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.75 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'wolf_glorymane_benediction', name: 'Glorymane\'s Benediction',
        icon: 'assets/icons/fc1112.png',
        description: 'Bless an ally: heals 18% of max HP and grants 12% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.18 },
          { type: 'turnMeter', amount: 0.12 },
        ],
      },
      {
        id: 'wolf_glorymane_ascension', name: 'Glorymane\'s Ascension',
        icon: 'assets/icons/fc855.png',
        description: 'Lift the whole line: ALL allies heal 52% of ATK and gain +5% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.52 },
          { type: 'buff', stat: 'atk', mult: 1.05, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Glorymane Benevolence',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, ALL allies heal 0.5% of this hero\\u0027s max HP and gain a small atk blessing for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) {
            a.heal(Math.round(unit.maxHp * 0.005));
            a.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.03, turns: 1 });
          }
          return null; // silent — small rolling benevolence
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  boar_battletusk: {
    id: 'boar_battletusk',
    element: 'wind',
    name: 'Boar Battletusk',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1470, atk: 216, def: 117, speed: 110 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarbattletuskidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_battletusk_strike', name: 'Battletusk\'s Strike',
        icon: 'assets/icons/fc730.png',
        description: 'Two champion blows: 76% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.76 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'boar_battletusk_onslaught', name: 'Battletusk\'s Onslaught',
        icon: 'assets/icons/fc1447.png',
        description: 'Press the advantage: 189% ATK, then +12% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.89 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.12, turns: 2 },
        ],
      },
      {
        id: 'boar_battletusk_supremacy', name: 'Battletusk\'s Supremacy',
        icon: 'assets/icons/fc767.png',
        description: 'Settle it: 240% ATK and -6% DEF for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.4 },
          { type: 'debuff', stat: 'def', mult: 0.94, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Battletusk Supremacy',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 11% more and takes 2% less damage.',
      hooks: {
        damageDealtMult() { return 1.11; },
        damageTakenMult() { return 0.98; },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
  },

  boar_runesnout: {
    id: 'boar_runesnout',
    element: 'water',
    name: 'Boar Runesnout',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1482, atk: 222, def: 121, speed: 113 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarrunesnoutidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_runesnout_bolt', name: 'Runesnout\'s Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'Twin arcane bolts: 77% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.77 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'boar_runesnout_torrent', name: 'Runesnout\'s Torrent',
        icon: 'assets/icons/fc1084.png',
        description: 'A torrent of power: 130% ATK to ALL enemies and -5% SPD for 2 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
          { type: 'debuff', stat: 'speed', mult: 0.95, turns: 2 },
        ],
      },
      {
        id: 'boar_runesnout_cataclysm', name: 'Runesnout\'s Cataclysm',
        icon: 'assets/icons/fc1044.png',
        description: 'The big one: 146% ATK to ALL enemies and -9% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.46 },
          { type: 'debuff', stat: 'atk', mult: 0.91, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Runesnout Resonance',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, arcane bleed sears ALL enemies for 1% of this hero\\u0027s DEF.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.effectiveStat('def') * 0.01));
          for (const e of enemies) e.takeDamage(amount);
          return null; // silent — small rolling resonance
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  boar_wallhide: {
    id: 'boar_wallhide',
    element: 'fire',
    name: 'Boar Wallhide',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1494, atk: 228, def: 125, speed: 116 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarwallhideidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_wallhide_bash', name: 'Wallhide\'s Bash',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield strikes: 78% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.78 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'boar_wallhide_bulwark', name: 'Wallhide\'s Bulwark',
        icon: 'assets/icons/fc855.png',
        description: 'Anchor the line: ALL allies gain +14% DEF for 2 turns and take 5% less damage for 1 turn.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.14, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.95, turns: 1 },
        ],
      },
      {
        id: 'boar_wallhide_stand', name: 'Wallhide\'s Stand',
        icon: 'assets/icons/fc856.png',
        description: 'Refuse to fall: takes 31% less damage for 2 turns and heals 13% max HP.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.69, turns: 2 },
          { type: 'healHpPct', pct: 0.13 },
        ],
      },
    ],
    passive: {
      name: 'Wallhide Aegis',
      icon: 'assets/icons/fc868.png',
      description: 'Takes 18% less damage while below 45% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.alive && unit.hp / unit.maxHp < 0.45 ? 0.82 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  boar_fartusk: {
    id: 'boar_fartusk',
    element: 'wind',
    name: 'Boar Fartusk',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1506, atk: 198, def: 103, speed: 102 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarfartuskidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_fartusk_shot', name: 'Fartusk\'s Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'Two placed shots: 79% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.79 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'boar_fartusk_deadeye', name: 'Fartusk\'s Deadeye',
        icon: 'assets/icons/fc1516.png',
        description: 'The perfect line: 202% ATK and drains 12% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.02 },
          { type: 'turnMeter', amount: -0.12 },
        ],
      },
      {
        id: 'boar_fartusk_barrage', name: 'Fartusk\'s Barrage',
        icon: 'assets/icons/fc807.png',
        description: 'Fill the sky: 128% ATK to ALL enemies.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.28 },
          { type: 'turnMeter', amount: -0.02 },
        ],
      },
    ],
    passive: {
      name: 'Fartusk Focus',
      icon: 'assets/icons/fc862.png',
      description: 'The shot is already lined up (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.11, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
  },

  boar_mistbristle: {
    id: 'boar_mistbristle',
    element: 'water',
    name: 'Boar Mistbristle',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1518, atk: 204, def: 107, speed: 105 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarmistbristleidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_mistbristle_touch', name: 'Mistbristle\'s Touch',
        icon: 'assets/icons/fc1112.png',
        description: 'Two chastening touches: 80% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'boar_mistbristle_blessing', name: 'Mistbristle\'s Blessing',
        icon: 'assets/icons/fc800.png',
        description: 'Mend an ally: 17% of max HP plus 2.5% regen for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.17 },
          { type: 'hot', pct: 0.025, turns: 2 },
        ],
      },
      {
        id: 'boar_mistbristle_renewal', name: 'Mistbristle\'s Renewal',
        icon: 'assets/icons/fc869.png',
        description: 'The circle holds: ALL allies heal 48% of ATK, are cleansed, and gain +6% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.48 },
          { type: 'cleanse' },
          { type: 'buff', stat: 'def', mult: 1.06, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Mistbristle Communion',
      icon: 'assets/icons/fc1003.png',
      description: 'Healing woven a little stronger.',
      hooks: { healBoostAdd: 0.27 },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  boar_nulltusk: {
    id: 'boar_nulltusk',
    element: 'dark',
    name: 'Boar Nulltusk',
    title: 'Champion of the Dark',
    rarity: 4,
    stats: { hp: 1530, atk: 210, def: 111, speed: 108 },
    tint: { body: '#241f33', helm: '#3d3350', weapon: '#9a7ad0', skin: '#8a82a0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarnulltuskidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_nulltusk_grasp', name: 'Nulltusk\'s Grasp',
        icon: 'assets/icons/fc1444.png',
        description: 'Two grasping shadows: 81% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.81 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'boar_nulltusk_devour', name: 'Nulltusk\'s Devour',
        icon: 'assets/icons/fc825.png',
        description: 'Feed the void: 184% ATK, healing this hero for 36% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.84 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.36 },
        ],
      },
      {
        id: 'boar_nulltusk_oblivion', name: 'Nulltusk\'s Oblivion',
        icon: 'assets/icons/fc734.png',
        description: 'Unmake them: 255% ATK and the target takes +21% damage for 1 turn.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.55 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.21, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Nulltusk Thirst',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, drains 2.3% of max HP from the weakest enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          enemies.sort((a, b) => a.hp - b.hp);
          const amount = Math.max(1, Math.round(unit.maxHp * 0.023));
          enemies[0].takeDamage(amount);
          unit.heal(amount);
          return null; // silent — small rolling thirst
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
  },

  boar_glorytusk: {
    id: 'boar_glorytusk',
    element: 'light',
    name: 'Boar Glorytusk',
    title: 'Champion of the Dawn',
    rarity: 4,
    stats: { hp: 1542, atk: 216, def: 115, speed: 111 },
    tint: { body: '#e0d3a8', helm: '#f5e9c0', weapon: '#ffdf70', skin: '#f0e4c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/boarglorytuskidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'boar_glorytusk_radiance', name: 'Glorytusk\'s Radiance',
        icon: 'assets/icons/fc1471.png',
        description: 'Two radiant strikes: 82% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.82 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'boar_glorytusk_benediction', name: 'Glorytusk\'s Benediction',
        icon: 'assets/icons/fc1112.png',
        description: 'Bless an ally: heals 19% of max HP and grants 13% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.19 },
          { type: 'turnMeter', amount: 0.13 },
        ],
      },
      {
        id: 'boar_glorytusk_ascension', name: 'Glorytusk\'s Ascension',
        icon: 'assets/icons/fc855.png',
        description: 'Lift the whole line: ALL allies heal 54% of ATK and gain +6% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.54 },
          { type: 'buff', stat: 'atk', mult: 1.06, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Glorytusk Benevolence',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, ALL allies heal 0.9% of this hero\\u0027s max HP and gain a small def blessing for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) {
            a.heal(Math.round(unit.maxHp * 0.009));
            a.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.02, turns: 1 });
          }
          return null; // silent — small rolling benevolence
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  bear_warclaw: {
    id: 'bear_warclaw',
    element: 'water',
    name: 'Bear Warclaw',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1486, atk: 220, def: 120, speed: 112 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearwarclawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_warclaw_strike', name: 'Warclaw\'s Strike',
        icon: 'assets/icons/fc730.png',
        description: 'Two champion blows: 83% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.83 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'bear_warclaw_onslaught', name: 'Warclaw\'s Onslaught',
        icon: 'assets/icons/fc1447.png',
        description: 'Press the advantage: 196% ATK, then +13% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.96 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.13, turns: 2 },
        ],
      },
      {
        id: 'bear_warclaw_supremacy', name: 'Warclaw\'s Supremacy',
        icon: 'assets/icons/fc767.png',
        description: 'Settle it: 247% ATK and -7% DEF for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.47 },
          { type: 'debuff', stat: 'def', mult: 0.93, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Warclaw Supremacy',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 3% more and takes 8% less damage.',
      hooks: {
        damageDealtMult() { return 1.03; },
        damageTakenMult() { return 0.92; },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
  },

  bear_runefur: {
    id: 'bear_runefur',
    element: 'fire',
    name: 'Bear Runefur',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1498, atk: 226, def: 124, speed: 115 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearrunefuridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_runefur_bolt', name: 'Runefur\'s Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'Twin arcane bolts: 84% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.84 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'bear_runefur_torrent', name: 'Runefur\'s Torrent',
        icon: 'assets/icons/fc1084.png',
        description: 'A torrent of power: 137% ATK to ALL enemies and -6% SPD for 2 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.37 },
          { type: 'debuff', stat: 'speed', mult: 0.94, turns: 2 },
        ],
      },
      {
        id: 'bear_runefur_cataclysm', name: 'Runefur\'s Cataclysm',
        icon: 'assets/icons/fc1044.png',
        description: 'The big one: 153% ATK to ALL enemies and -7% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.53 },
          { type: 'debuff', stat: 'atk', mult: 0.93, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Runefur Resonance',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, arcane bleed sears ALL enemies for 0.5% of this hero\\u0027s ATK.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.effectiveStat('atk') * 0.005));
          for (const e of enemies) e.takeDamage(amount);
          return null; // silent — small rolling resonance
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  bear_wallpaw: {
    id: 'bear_wallpaw',
    element: 'wind',
    name: 'Bear Wallpaw',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1510, atk: 196, def: 102, speed: 101 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearwallpawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_wallpaw_bash', name: 'Wallpaw\'s Bash',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield strikes: 85% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'bear_wallpaw_bulwark', name: 'Wallpaw\'s Bulwark',
        icon: 'assets/icons/fc855.png',
        description: 'Anchor the line: ALL allies gain +15% DEF for 2 turns and take 3% less damage for 1 turn.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.15, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.97, turns: 1 },
        ],
      },
      {
        id: 'bear_wallpaw_stand', name: 'Wallpaw\'s Stand',
        icon: 'assets/icons/fc856.png',
        description: 'Refuse to fall: takes 32% less damage for 2 turns and heals 14% max HP.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.68, turns: 2 },
          { type: 'healHpPct', pct: 0.14 },
        ],
      },
    ],
    passive: {
      name: 'Wallpaw Aegis',
      icon: 'assets/icons/fc868.png',
      description: 'Takes 16% less damage while below 55% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.alive && unit.hp / unit.maxHp < 0.55 ? 0.84 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  bear_farwatch: {
    id: 'bear_farwatch',
    element: 'water',
    name: 'Bear Farwatch',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1522, atk: 202, def: 106, speed: 104 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearfarwatchidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_farwatch_shot', name: 'Farwatch\'s Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'Two placed shots: 86% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.86 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'bear_farwatch_deadeye', name: 'Farwatch\'s Deadeye',
        icon: 'assets/icons/fc1516.png',
        description: 'The perfect line: 209% ATK and drains 13% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.09 },
          { type: 'turnMeter', amount: -0.13 },
        ],
      },
      {
        id: 'bear_farwatch_barrage', name: 'Farwatch\'s Barrage',
        icon: 'assets/icons/fc807.png',
        description: 'Fill the sky: 135% ATK to ALL enemies.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.35 },
          { type: 'turnMeter', amount: -0.01 },
        ],
      },
    ],
    passive: {
      name: 'Farwatch Focus',
      icon: 'assets/icons/fc862.png',
      description: 'The shot is already lined up (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.09, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
  },

  bear_mistfur: {
    id: 'bear_mistfur',
    element: 'fire',
    name: 'Bear Mistfur',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1534, atk: 208, def: 110, speed: 107 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearmistfuridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_mistfur_touch', name: 'Mistfur\'s Touch',
        icon: 'assets/icons/fc1112.png',
        description: 'Two chastening touches: 87% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.87 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'bear_mistfur_blessing', name: 'Mistfur\'s Blessing',
        icon: 'assets/icons/fc800.png',
        description: 'Mend an ally: 18% of max HP plus 2.7% regen for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.18 },
          { type: 'hot', pct: 0.027, turns: 2 },
        ],
      },
      {
        id: 'bear_mistfur_renewal', name: 'Mistfur\'s Renewal',
        icon: 'assets/icons/fc869.png',
        description: 'The circle holds: ALL allies heal 50% of ATK, are cleansed, and gain +4% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.5 },
          { type: 'cleanse' },
          { type: 'buff', stat: 'def', mult: 1.04, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Mistfur Communion',
      icon: 'assets/icons/fc1003.png',
      description: 'Healing woven a little stronger.',
      hooks: { healBoostAdd: 0.09, dodgeAdd: 0.06 },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  bear_nullpaw: {
    id: 'bear_nullpaw',
    element: 'dark',
    name: 'Bear Nullpaw',
    title: 'Champion of the Dark',
    rarity: 4,
    stats: { hp: 1546, atk: 214, def: 114, speed: 110 },
    tint: { body: '#241f33', helm: '#3d3350', weapon: '#9a7ad0', skin: '#8a82a0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/bearnullpawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_nullpaw_grasp', name: 'Nullpaw\'s Grasp',
        icon: 'assets/icons/fc1444.png',
        description: 'Two grasping shadows: 88% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.88 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'bear_nullpaw_devour', name: 'Nullpaw\'s Devour',
        icon: 'assets/icons/fc825.png',
        description: 'Feed the void: 191% ATK, healing this hero for 38% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.91 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.38 },
        ],
      },
      {
        id: 'bear_nullpaw_oblivion', name: 'Nullpaw\'s Oblivion',
        icon: 'assets/icons/fc734.png',
        description: 'Unmake them: 262% ATK and the target takes +22% damage for 1 turn.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.62 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.22, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Nullpaw Thirst',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, drains 2.5% of max HP from the weakest enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          enemies.sort((a, b) => a.hp - b.hp);
          const amount = Math.max(1, Math.round(unit.maxHp * 0.025));
          enemies[0].takeDamage(amount);
          unit.heal(amount);
          return null; // silent — small rolling thirst
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
  },

  bear_gloryclaw: {
    id: 'bear_gloryclaw',
    element: 'light',
    name: 'Bear Gloryclaw',
    title: 'Champion of the Dawn',
    rarity: 4,
    stats: { hp: 1558, atk: 220, def: 118, speed: 113 },
    tint: { body: '#e0d3a8', helm: '#f5e9c0', weapon: '#ffdf70', skin: '#f0e4c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/beargloryclawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bear_gloryclaw_radiance', name: 'Gloryclaw\'s Radiance',
        icon: 'assets/icons/fc1471.png',
        description: 'Two radiant strikes: 89% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.89 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'bear_gloryclaw_benediction', name: 'Gloryclaw\'s Benediction',
        icon: 'assets/icons/fc1112.png',
        description: 'Bless an ally: heals 20% of max HP and grants 14% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.2 },
          { type: 'turnMeter', amount: 0.14 },
        ],
      },
      {
        id: 'bear_gloryclaw_ascension', name: 'Gloryclaw\'s Ascension',
        icon: 'assets/icons/fc855.png',
        description: 'Lift the whole line: ALL allies heal 56% of ATK and gain +7% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.56 },
          { type: 'buff', stat: 'atk', mult: 1.07, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Gloryclaw Benevolence',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, ALL allies heal 1.1% of this hero\\u0027s max HP and gain a small crit blessing for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) {
            a.heal(Math.round(unit.maxHp * 0.011));
            a.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.03, turns: 1 });
          }
          return null; // silent — small rolling benevolence
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  cat_bladewhisker: {
    id: 'cat_bladewhisker',
    element: 'fire',
    name: 'Cat Bladewhisker',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1502, atk: 224, def: 123, speed: 114 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catbladewhiskeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_bladewhisker_strike', name: 'Bladewhisker\'s Strike',
        icon: 'assets/icons/fc730.png',
        description: 'Two champion blows: 90% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'cat_bladewhisker_onslaught', name: 'Bladewhisker\'s Onslaught',
        icon: 'assets/icons/fc1447.png',
        description: 'Press the advantage: 203% ATK, then +14% ATK for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.03 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'atk', mult: 1.14, turns: 2 },
        ],
      },
      {
        id: 'cat_bladewhisker_supremacy', name: 'Bladewhisker\'s Supremacy',
        icon: 'assets/icons/fc767.png',
        description: 'Settle it: 254% ATK and -8% DEF for 2 turns.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.54 },
          { type: 'debuff', stat: 'def', mult: 0.92, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Bladewhisker Supremacy',
      icon: 'assets/icons/fc863.png',
      description: 'Deals 12% more and takes 3% less damage.',
      hooks: {
        damageDealtMult() { return 1.12; },
        damageTakenMult() { return 0.97; },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
  },

  cat_runepurr: {
    id: 'cat_runepurr',
    element: 'wind',
    name: 'Cat Runepurr',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1514, atk: 230, def: 127, speed: 100 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catrunepurridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_runepurr_bolt', name: 'Runepurr\'s Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'Twin arcane bolts: 91% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.91 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'cat_runepurr_torrent', name: 'Runepurr\'s Torrent',
        icon: 'assets/icons/fc1084.png',
        description: 'A torrent of power: 144% ATK to ALL enemies and -7% SPD for 2 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.44 },
          { type: 'debuff', stat: 'speed', mult: 0.93, turns: 2 },
        ],
      },
      {
        id: 'cat_runepurr_cataclysm', name: 'Runepurr\'s Cataclysm',
        icon: 'assets/icons/fc1044.png',
        description: 'The big one: 160% ATK to ALL enemies and -8% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.6 },
          { type: 'debuff', stat: 'atk', mult: 0.92, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Runepurr Resonance',
      icon: 'assets/icons/fc867.png',
      description: 'At turn start, arcane bleed sears ALL enemies for 1.5% of this hero\\u0027s max HP.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.maxHp * 0.015));
          for (const e of enemies) e.takeDamage(amount);
          return null; // silent — small rolling resonance
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  cat_walltail: {
    id: 'cat_walltail',
    element: 'water',
    name: 'Cat Walltail',
    title: 'Champion of the Water',
    rarity: 4,
    stats: { hp: 1526, atk: 200, def: 105, speed: 103 },
    tint: { body: '#3a5a8a', helm: '#5a7aaa', weapon: '#8ac8e8', skin: '#b8c0c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catwalltailidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_walltail_bash', name: 'Walltail\'s Bash',
        icon: 'assets/icons/fc854.png',
        description: 'Two shield strikes: 92% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.92 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'cat_walltail_bulwark', name: 'Walltail\'s Bulwark',
        icon: 'assets/icons/fc855.png',
        description: 'Anchor the line: ALL allies gain +16% DEF for 2 turns and take 4% less damage for 1 turn.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.16, turns: 2 },
          { type: 'buff', stat: 'damageTaken', mult: 0.96, turns: 1 },
        ],
      },
      {
        id: 'cat_walltail_stand', name: 'Walltail\'s Stand',
        icon: 'assets/icons/fc856.png',
        description: 'Refuse to fall: takes 33% less damage for 2 turns and heals 15% max HP.',
        cooldown: 6, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'damageTaken', mult: 0.67, turns: 2 },
          { type: 'healHpPct', pct: 0.15 },
        ],
      },
    ],
    passive: {
      name: 'Walltail Aegis',
      icon: 'assets/icons/fc868.png',
      description: 'Takes 17% less damage while holding a front hex above 70% HP.',
      hooks: {
        damageTakenMult(unit) {
          return unit.slot && unit.slot.position === POSITION.FRONT && unit.hp / unit.maxHp > 0.7 ? 0.83 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  cat_farwhisker: {
    id: 'cat_farwhisker',
    element: 'fire',
    name: 'Cat Farwhisker',
    title: 'Champion of the Fire',
    rarity: 4,
    stats: { hp: 1538, atk: 206, def: 109, speed: 106 },
    tint: { body: '#8a3a2a', helm: '#b85a3a', weapon: '#f8a03a', skin: '#c8a088' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catfarwhiskeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_farwhisker_shot', name: 'Farwhisker\'s Shot',
        icon: 'assets/icons/fc1515.png',
        description: 'Two placed shots: 93% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.93 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'cat_farwhisker_deadeye', name: 'Farwhisker\'s Deadeye',
        icon: 'assets/icons/fc1516.png',
        description: 'The perfect line: 216% ATK and drains 14% turn meter.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.16 },
          { type: 'turnMeter', amount: -0.14 },
        ],
      },
      {
        id: 'cat_farwhisker_barrage', name: 'Farwhisker\'s Barrage',
        icon: 'assets/icons/fc807.png',
        description: 'Fill the sky: 142% ATK to ALL enemies.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.42 },
          { type: 'turnMeter', amount: -0.02 },
        ],
      },
    ],
    passive: {
      name: 'Farwhisker Focus',
      icon: 'assets/icons/fc862.png',
      description: 'The shot is already lined up (small rolling buffs each turn).',
      hooks: {
        onTurnStart(unit, battle) {
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.06, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.06, turns: 1 });
          return null; // silent — small rolling bonus
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
  },

  cat_mistpaw: {
    id: 'cat_mistpaw',
    element: 'wind',
    name: 'Cat Mistpaw',
    title: 'Champion of the Wind',
    rarity: 4,
    stats: { hp: 1550, atk: 212, def: 113, speed: 109 },
    tint: { body: '#4a7a5a', helm: '#6a9a7a', weapon: '#b8e8a8', skin: '#b8c8b0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catmistpawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_mistpaw_touch', name: 'Mistpaw\'s Touch',
        icon: 'assets/icons/fc1112.png',
        description: 'Two chastening touches: 94% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.94 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'cat_mistpaw_blessing', name: 'Mistpaw\'s Blessing',
        icon: 'assets/icons/fc800.png',
        description: 'Mend an ally: 19% of max HP plus 2.9% regen for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.19 },
          { type: 'hot', pct: 0.029, turns: 2 },
        ],
      },
      {
        id: 'cat_mistpaw_renewal', name: 'Mistpaw\'s Renewal',
        icon: 'assets/icons/fc869.png',
        description: 'The circle holds: ALL allies heal 52% of ATK, are cleansed, and gain +5% DEF for 2 turns.',
        cooldown: 6, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.52 },
          { type: 'cleanse' },
          { type: 'buff', stat: 'def', mult: 1.05, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Mistpaw Communion',
      icon: 'assets/icons/fc1003.png',
      description: 'Healing woven a little stronger.',
      hooks: { healBoostAdd: 0.07, resistanceAdd: 0.12 },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  cat_nullwhisker: {
    id: 'cat_nullwhisker',
    element: 'dark',
    name: 'Cat Nullwhisker',
    title: 'Champion of the Dark',
    rarity: 4,
    stats: { hp: 1562, atk: 218, def: 117, speed: 112 },
    tint: { body: '#241f33', helm: '#3d3350', weapon: '#9a7ad0', skin: '#8a82a0' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catnullwhiskeridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_nullwhisker_grasp', name: 'Nullwhisker\'s Grasp',
        icon: 'assets/icons/fc1444.png',
        description: 'Two grasping shadows: 95% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.95 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'cat_nullwhisker_devour', name: 'Nullwhisker\'s Devour',
        icon: 'assets/icons/fc825.png',
        description: 'Feed the void: 198% ATK, healing this hero for 40% of ATK.',
        cooldown: 4, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.98 },
        ],
        selfEffects: [
          { type: 'heal', mult: 0.4 },
        ],
      },
      {
        id: 'cat_nullwhisker_oblivion', name: 'Nullwhisker\'s Oblivion',
        icon: 'assets/icons/fc734.png',
        description: 'Unmake them: 269% ATK and the target takes +23% damage for 1 turn.',
        cooldown: 7, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 2.69 },
          { type: 'debuff', stat: 'damageTaken', mult: 1.23, turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'Nullwhisker Thirst',
      icon: 'assets/icons/fc1093.png',
      description: 'At turn start, drains 2.7% of max HP from the weakest enemy.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          enemies.sort((a, b) => a.hp - b.hp);
          const amount = Math.max(1, Math.round(unit.maxHp * 0.027));
          enemies[0].takeDamage(amount);
          unit.heal(amount);
          return null; // silent — small rolling thirst
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
  },

  cat_glorypaw: {
    id: 'cat_glorypaw',
    element: 'light',
    name: 'Cat Glorypaw',
    title: 'Champion of the Dawn',
    rarity: 4,
    stats: { hp: 1574, atk: 224, def: 121, speed: 115 },
    tint: { body: '#e0d3a8', helm: '#f5e9c0', weapon: '#ffdf70', skin: '#f0e4c8' },
    sprite: {
      displayH: 74,
      strips: {
        idle: { src: 'assets/heroes/catglorypawidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cat_glorypaw_radiance', name: 'Glorypaw\'s Radiance',
        icon: 'assets/icons/fc1471.png',
        description: 'Two radiant strikes: 96% then 49% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.96 },
          { type: 'damage', mult: 0.49 },
        ],
      },
      {
        id: 'cat_glorypaw_benediction', name: 'Glorypaw\'s Benediction',
        icon: 'assets/icons/fc1112.png',
        description: 'Bless an ally: heals 21% of max HP and grants 15% turn meter.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.21 },
          { type: 'turnMeter', amount: 0.15 },
        ],
      },
      {
        id: 'cat_glorypaw_ascension', name: 'Glorypaw\'s Ascension',
        icon: 'assets/icons/fc855.png',
        description: 'Lift the whole line: ALL allies heal 58% of ATK and gain +8% ATK for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.58 },
          { type: 'buff', stat: 'atk', mult: 1.08, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Glorypaw Benevolence',
      icon: 'assets/icons/fc1003.png',
      description: 'At turn start, ALL allies heal 0.3% of this hero\\u0027s max HP and gain a small speed blessing for 1 turn.',
      hooks: {
        onTurnStart(unit, battle) {
          for (const a of battle.livingUnits(unit.team)) {
            a.heal(Math.round(unit.maxHp * 0.003));
            a.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.04, turns: 1 });
          }
          return null; // silent — small rolling benevolence
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

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
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
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
      description: 'At turn start, arcane bleed sears ALL enemies for 2.5% of this hero\\u0027s DEF.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const amount = Math.max(1, Math.round(unit.effectiveStat('def') * 0.025));
          for (const e of enemies) e.takeDamage(amount);
          return null; // silent — small rolling resonance
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
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
      description: 'Takes 10% less damage while holding the center hex.',
      hooks: {
        damageTakenMult(unit) {
          return unit.slot && unit.slot.position === POSITION.CENTER ? 0.9 : 1;
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
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
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
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
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
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
          enemies[0].takeDamage(amount);
          unit.heal(amount);
          return null; // silent — small rolling thirst
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% ATK in the chosen hex.',
    },
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
      description: 'At turn start, ALL allies heal 1.3% of this hero\\u0027s max HP and gain a small def blessing for 1 turn.',
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
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.15,
      description: 'Champion\\u0027s Ground: +15% DEF in the chosen hex.',
    },
  },

  florence: {
    id: 'florence',
    element: 'water',
    name: 'Florence',
    title: 'Crystal Blade',
    rarity: 4,
    stats: { hp: 1450, atk: 240, def: 130, speed: 105 },
    // Placeholder tint (silver armor, crystal sword) until strips load.
    tint: { body: '#8d9bb8', helm: '#c8d0e0', weapon: '#8ad8ff', shield: '#a83a3a' },
    sprite: {
      displayH: 88,
      // Manual: her body is in the right half of the frame, and the low
      // sword blade fools the automatic feet-centroid measurement.
      shadowOffsetX: 12,
      strips: {
        idle:   { src: 'assets/heroes/florence/KnightIdle.png',  frames: 9, fps: 4, loop: true },
        // Timed fidgets, played once every 7-14s of idling (random pick):
        // helmet adjust — rests on frames 4, 6, and 8 for 3 ticks each.
        idle2:  { src: 'assets/heroes/florence/Knightidle2.png', frames: 9, fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14], holds: { 4: 3, 6: 3, 8: 3 } },
        // kneeling rest — holds the kneel (frame 7) for 15 ticks.
        idle3:  { src: 'assets/heroes/florence/Knightidle3.png', frames: 9, fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14], holds: { 7: 15 } },
        // alert stance, loops while it's her turn to act
        ready:  { src: 'assets/heroes/florence/Knightready.png', frames: 9, fps: 6, loop: true },
        // death — plays once and freezes on the final frame
        death:  { src: 'assets/heroes/florence/knightdeath.png', frames: 22, fps: 6, loop: false,
                  freeze: true },
        // sword-slam crystal burst, plays on Crystal Resonance;
        // rests on frame 16 as the crystals flare.
        buff:   { src: 'assets/heroes/florence/Knightbuff.png', frames: 20, fps: 12, loop: false,
                  holds: { 16: 5 } },
        // Skill 3 — same frames as the jump slash, but she leaps straight
        // up, the swing hurls a windshear along the enemy row, and she
        // lands back on her own hex. Same frame timing as jumpslash.
        rowslash: {
          src: 'assets/heroes/florence/Knightjumpslash.png',
          frames: 23, fps: 10, loop: false,
          // Playback order revisits sheet frame 15 (tucked airborne pose)
          // after the swing, so she hangs and falls in the jump position
          // and only hits the landing pose (21) back at the ground.
          // Playback: 1-20 as drawn, then [15 hang, 15 fall, 21-23 land].
          order: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
                  16, 17, 18, 19, 20, 15, 15, 21, 22, 23],
          // Fast ascent, fast slash, long airborne hang (playback 21),
          // fast fall (22), brief landing skid (23).
          holds: {
            7: 4,
            8: 0.5, 9: 0.5, 10: 0.5, 11: 0.5, 12: 0.5, 13: 0.5, 14: 0.5, 15: 0.5,
            16: 0.5, 17: 0.5, 18: 0.5, 19: 0.5, 20: 0.5,
            21: 8,
            23: 2,
          },
          hitFrame: 17,
          motion: [
            { frames: [1, 7],   from: 'origin',    to: 'origin' },
            { frames: [8, 15],  from: 'origin',    to: 'originAir' },
            { frames: [16, 21], from: 'originAir', to: 'originAir' },
            { frames: [22, 22], from: 'originAir', to: 'origin' },
            { frames: [23, 25], from: 'origin',    to: 'origin' },
          ],
          // Dust on liftoff, and again as she touches back down.
          frameEffects: [
            { frame: 8,  effect: 'jump_cloud', at: 'origin', dy: 18 },
            { frame: 23, effect: 'land_cloud', at: 'origin', dy: 18 },
          ],
        },
        // Skill 1 — leap to the target and slash through them:
        //   1-7   windup on her hex, holding frame 7 as she tenses
        //   8-15  airborne arc to just in front of the target
        //   16-21 fast sweeping slash carrying her behind the target,
        //         damage lands on 17, skid-stop pause held on 21
        //   22-23 recover, then snap back to her hex
        jumpslash: {
          src: 'assets/heroes/florence/Knightjumpslash.png',
          frames: 23, fps: 10, loop: false,
          holds: { 7: 4, 16: 0.5, 17: 0.5, 18: 0.5, 19: 0.5, 20: 0.5, 21: 5 },
          hitFrame: 17,
          motion: [
            { frames: [1, 7],   from: 'origin',       to: 'origin' },
            { frames: [8, 15],  from: 'origin',       to: 'targetFront', arc: 90 },
            { frames: [16, 20], from: 'targetFront',  to: 'targetBehind' },
            { frames: [21, 23], from: 'targetBehind', to: 'targetBehind' },
          ],
          // Dust: takeoff cloud as she leaves her hex, skid cloud where
          // she comes to a stop behind the target.
          frameEffects: [
            { frame: 8,  effect: 'jump_cloud', at: 'origin',       dy: 18 },
            { frame: 18, effect: 'land_cloud', at: 'targetBehind', dy: 18 },
          ],
        },
      },
    },
    abilities: [
      {
        id: 'crystal_slash', name: 'Crystal Slash',
        icon: 'assets/icons/fc1609.png',
        description: 'A crystal-edged cut for 100% ATK that focuses her: +5% crit chance for 1 turn.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.0 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'critChance', add: 0.05, turns: 1 },
        ],
      },
      {
        id: 'crystal_resonance', name: 'Crystal Resonance',
        icon: 'assets/icons/fc1024.png',
        description: 'Attune to the blade: +50% crit chance and +50% crit damage for 3 turns.',
        cooldown: 5, targeting: 'self', animation: 'buff',
        effects: [
          { type: 'buff', stat: 'critChance', add: 0.5, turns: 3 },
          { type: 'buff', stat: 'critDamage', add: 0.5, turns: 3 },
        ],
      },
      {
        id: 'prism_break', name: 'Prism Break',
        icon: 'assets/icons/fc788.png',
        description: 'Leap skyward and hurl a shearing wave that cuts an entire enemy row for 170% ATK.',
        cooldown: 7, targeting: 'enemy-row', animation: 'rowslash', vfx: 'windshear', impact: 'slash',
        effects: [{ type: 'damage', mult: 1.7 }],
      },
    ],
    passive: {
      name: 'Blade Dance',
      icon: 'assets/icons/fc731.png',
      description: 'Gains +15% SPD and +5% crit chance for 1 turn at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.15, turns: 1 });
          unit.addStatusEffect({ kind: 'buff', stat: 'critChance', add: 0.05, turns: 1 });
          return null; // silent — too minor to log every turn
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.2,
      description: 'Duelist: +20% ATK while in a front hex.',
    },
  },

  vivian: {
    id: 'vivian',
    element: 'wind',
    name: 'Vivian',
    title: 'Hedge Mage',
    rarity: 4,
    stats: { hp: 1650, atk: 140, def: 120, speed: 100 },
    // Placeholder tint (leafy greens) until her strips are uploaded.
    tint: { body: '#4a8a4a', helm: '#7ab86a', weapon: '#a8e888', shield: '#5a4a30' },
    sprite: {
      displayH: 88,
      strips: {
        idle:   { src: 'assets/heroes/vivian/hedgeidlepng.png', frames: 9, fps: 4, loop: true },
        // Timed fidget variations.
        idle2:  { src: 'assets/heroes/vivian/hedgeidle1.png', frames: 9, fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        idle3:  { src: 'assets/heroes/vivian/hedgeidle2.png', frames: 8, fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        ready:  { src: 'assets/heroes/vivian/hedgeready.png', frames: 9, fps: 6, loop: true },
        // Staff channel — used by both Verdant Mend and Thicket Blessing;
        // the heal lands as the channel peaks.
        cast:   { src: 'assets/heroes/vivian/hedgeskill1.png', frames: 8, fps: 10, loop: false,
                  hitFrame: 6 },
        // Briar Burst — energy gathers in her outstretched hand.
        attack3: { src: 'assets/heroes/vivian/hedgeskill3.png', frames: 8, fps: 10, loop: false,
                   hitFrame: 5 },
        death:  { src: 'assets/heroes/vivian/hedgedeath.png', frames: 25, fps: 6, loop: false,
                  freeze: true },
      },
    },
    abilities: [
      {
        id: 'verdant_mend', name: 'Verdant Mend',
        icon: 'assets/icons/fc1073.png',
        description: 'Heal an ally for 10% of Vivian\'s max HP — 20% if they hold a front hex.',
        cooldown: 0, targeting: 'ally', animation: 'cast', impact: 'heal_green',
        effects: [{ type: 'healHpPct', pct: 0.10, frontPct: 0.20 }],
      },
      {
        id: 'thicket_blessing', name: 'Thicket Blessing',
        icon: 'assets/icons/fc1113.png',
        description: 'Bless the entire front row with regrowth: heal 5% of Vivian\'s max HP per turn for 4 turns.',
        cooldown: 5, targeting: 'front-allies', animation: 'cast', impact: 'heal_green',
        effects: [{ type: 'hot', pct: 0.05, turns: 4 }],
      },
      {
        id: 'briar_burst', name: 'Briar Burst',
        icon: 'assets/icons/fc1066.png',
        description: 'Lash an enemy with thorns for 20% of Vivian\'s max HP and cut their action bar by 50%.',
        cooldown: 6, targeting: 'enemy', animation: 'attack3', impact: 'strike_green',
        effects: [
          { type: 'damageHpPct', pct: 0.20 },
          { type: 'turnMeter', amount: -0.5 },
        ],
      },
    ],
    passive: {
      name: 'Sympathetic Growth',
      icon: 'assets/icons/fc866.png',
      description: 'Gains 5% action bar whenever an ally is healed.',
      hooks: {
        onAllyHealed(unit) {
          unit.turnMeter = Math.min(CONFIG.TURN_METER_MAX,
            unit.turnMeter + CONFIG.TURN_METER_MAX * 0.05);
          return { floats: [{ target: unit, text: '▲', color: '#7ae87a' }] };
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'hp', mult: 1.2,
      description: 'Rooted: +20% max HP while in a back hex.',
    },
  },

  vex: {
    id: 'vex',
    element: 'dark',
    name: 'Vex',
    title: 'Doll Witch',
    rarity: 4,
    stats: { hp: 1250, atk: 200, def: 105, speed: 115 },
    tint: { body: '#5a3a7a', helm: '#7a4a9a', weapon: '#c8a86a', shield: '#3a2a4a' },
    sprite: {
      displayH: 66, // 25% smaller than standard — her art is a crouched pose
      strips: {
        idle:   { src: 'assets/heroes/vex/vexidle.png',  frames: 9,  fps: 4, loop: true },
        // Timed fidget variations.
        idle2:  { src: 'assets/heroes/vex/vexidle1.png', frames: 9,  fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        idle3:  { src: 'assets/heroes/vex/vexidle2.png', frames: 9,  fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        idle4:  { src: 'assets/heroes/vex/vexidle3.png', frames: 16, fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        ready:  { src: 'assets/heroes/vex/vexready.png', frames: 9, fps: 6, loop: true },
        // Doll rattle — the pin goes in mid-shake.
        attack: { src: 'assets/heroes/vex/vexskill1.png', frames: 9, fps: 10, loop: false,
                  hitFrame: 6 },
        // Wide curse over the enemy team.
        cast:   { src: 'assets/heroes/vex/vexskill2.png', frames: 9, fps: 10, loop: false,
                  hitFrame: 6 },
        // The doll ignites with hexfire — the mark lands on the burst.
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
        description: 'Stab the doll: 90% ATK to one enemy and -15% ATK for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'strike_purple',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'debuff', stat: 'atk', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'creeping_malaise', name: 'Creeping Malaise',
        icon: 'assets/icons/fc1117.png',
        description: 'Curse ALL enemies: -25% DEF and -15% SPD for 2 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'cast', impact: 'strike_purple',
        effects: [
          { type: 'debuff', stat: 'def', mult: 0.75, turns: 2 },
          { type: 'debuff', stat: 'speed', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'doom_mark', name: 'Doom Mark',
        icon: 'assets/icons/fc1050.png',
        description: 'Condemn one enemy: takes 40% more damage and loses 30% ATK for 3 turns.',
        cooldown: 7, targeting: 'enemy', animation: 'attack3', impact: 'strike_purple',
        effects: [
          { type: 'debuff', stat: 'damageTaken', mult: 1.4, turns: 3 },
          { type: 'debuff', stat: 'atk', mult: 0.7, turns: 3 },
        ],
      },
    ],
    passive: {
      name: 'Vile Persistence',
      icon: 'assets/icons/fc1053.png',
      description: 'Her debuffs last 1 extra turn.',
      hooks: {
        debuffExtraTurns: 1,
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'speed', mult: 1.15,
      description: 'Skulker: +15% SPD while in a back hex.',
    },
  },

  emily: {
    id: 'emily',
    element: 'light',
    name: 'Emily',
    title: 'Dawn Cleric',
    rarity: 4,
    stats: { hp: 1300, atk: 190, def: 115, speed: 105 },
    tint: { body: '#e8e0d0', helm: '#4a6ac8', weapon: '#e8c84a', shield: '#f0ead8' },
    sprite: {
      displayH: 88,
      strips: {
        idle:   { src: 'assets/heroes/emily/emilyidle.png',  frames: 9,  fps: 4, loop: true },
        // Timed fidget variations.
        idle2:  { src: 'assets/heroes/emily/emilyidle1.png', frames: 16, fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        idle3:  { src: 'assets/heroes/emily/emilyidle2.png', frames: 9,  fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        ready:  { src: 'assets/heroes/emily/emilyready.png', frames: 9, fps: 6, loop: true },
        // Single-target blessing.
        cast:   { src: 'assets/heroes/emily/emilyskill1.png', frames: 9, fps: 10, loop: false,
                  hitFrame: 6 },
        // Team chorus.
        cast2:  { src: 'assets/heroes/emily/emilyskill2.png', frames: 9, fps: 10, loop: false,
                  hitFrame: 6 },
        // Radiant halo — the revival lands as the light peaks.
        revive: { src: 'assets/heroes/emily/emilyskill3.png', frames: 9, fps: 10, loop: false,
                  hitFrame: 8 },
        death:  { src: 'assets/heroes/emily/emilydeath.png', frames: 9, fps: 6, loop: false,
                  freeze: true },
      },
    },
    abilities: [
      {
        id: 'lightmend', name: 'Lightmend',
        icon: 'assets/icons/fc1041.png',
        description: 'Bathe one ally in light, healing 130% ATK.',
        cooldown: 0, targeting: 'ally', animation: 'cast', impact: 'heal_gold',
        effects: [{ type: 'heal', mult: 1.3 }],
      },
      {
        id: 'purifying_chorus', name: 'Purifying Chorus',
        icon: 'assets/icons/fc1046.png',
        description: 'Heal ALL allies for 80% ATK and cleanse their debuffs.',
        cooldown: 5, targeting: 'all-allies', animation: 'cast2', impact: 'heal_gold',
        effects: [
          { type: 'heal', mult: 0.8 },
          { type: 'cleanse' },
        ],
      },
      {
        id: 'second_dawn', name: 'Second Dawn',
        icon: 'assets/icons/fc1075.png',
        description: 'Call a fallen ally back to the fight with 40% of their max HP.',
        cooldown: 7, targeting: 'dead-ally', animation: 'revive', impact: 'heal_gold',
        effects: [{ type: 'revive', pct: 0.4 }],
      },
    ],
    passive: {
      name: 'Serenity',
      icon: 'assets/icons/fc1091.png',
      description: 'At the start of her turn, removes one debuff from the most afflicted ally.',
      hooks: {
        onTurnStart(unit, battle) {
          const afflicted = battle.livingUnits(unit.team)
            .map((u) => ({ u, n: u.statusEffects.filter((fx) => fx.kind === 'debuff').length }))
            .filter((e) => e.n > 0)
            .sort((a, b) => b.n - a.n);
          if (afflicted.length === 0) return null;
          const target = afflicted[0].u;
          const idx = target.statusEffects.findIndex((fx) => fx.kind === 'debuff');
          target.statusEffects.splice(idx, 1);
          return {
            label: 'Serenity',
            message: `${unit.name}'s Serenity lifts a debuff from ${target.name}.`,
            floats: [{ target, text: 'CLEANSED', color: '#ffe8a8' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.2,
      description: 'Choir Heart: +20% ATK (and stronger heals) in the center hex.',
    },
  },

  coral: {
    id: 'coral',
    element: 'water',
    name: 'Coral',
    title: 'Tide Caller',
    rarity: 4,
    stats: { hp: 1150, atk: 260, def: 95, speed: 110 },
    tint: { body: '#3a6ac8', helm: '#e8d88a', weapon: '#4ac8e8', shield: '#e8e8f0' },
    sprite: {
      displayH: 88,
      strips: {
        idle:   { src: 'assets/heroes/coral/coralidle.png',  frames: 9,  fps: 4, loop: true },
        // Timed fidget variations.
        idle2:  { src: 'assets/heroes/coral/coralidle1.png', frames: 16, fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        idle3:  { src: 'assets/heroes/coral/coralidle2.png', frames: 14, fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        idle4:  { src: 'assets/heroes/coral/coralidle3.png', frames: 15, fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        ready:  { src: 'assets/heroes/coral/coralready.png', frames: 9, fps: 6, loop: true },
        // Staff sweep cast — skills 1 and 2; the surge lands mid-sweep.
        attack: { src: 'assets/heroes/coral/coralskill1.png', frames: 11, fps: 10, loop: false,
                  hitFrame: 6 },
        // Spinning burst — skill 3.
        attack3: { src: 'assets/heroes/coral/coralskill3.png', frames: 6, fps: 10, loop: false,
                   hitFrame: 4 },
        death:  { src: 'assets/heroes/coral/coraldeath.png', frames: 9, fps: 6, loop: false,
                  freeze: true },
      },
    },
    abilities: [
      {
        id: 'tide_lash', name: 'Tide Lash',
        icon: 'assets/icons/fc819.png',
        description: 'Strike one enemy with a surging wave for 110% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.1 }],
      },
      {
        id: 'undertow', name: 'Undertow',
        icon: 'assets/icons/fc821.png',
        description: 'Drag the enemy back row under for 90% ATK.',
        cooldown: 6, targeting: 'back-enemies', animation: 'attack', impact: 'strike',
        effects: [{ type: 'damage', mult: 0.9 }],
      },
      {
        id: 'maelstrom_spear', name: 'Maelstrom Spear',
        icon: 'assets/icons/fc786.png',
        description: 'Skewer one enemy with a focused torrent for 240% ATK.',
        cooldown: 7, targeting: 'enemy', animation: 'attack3', impact: 'strike',
        effects: [{ type: 'damage', mult: 2.4 }],
      },
    ],
    passive: {
      name: 'Riptide',
      icon: 'assets/icons/fc823.png',
      description: 'Deals 25% extra damage to enemies holding front hexes.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.slot && target.slot.position === POSITION.FRONT ? 1.25 : 1;
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'damage', mult: 1.2,
      description: 'Tidal Focus: +20% damage dealt while in the center hex.',
    },
  },

};
