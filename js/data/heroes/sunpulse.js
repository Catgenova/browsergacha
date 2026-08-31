// The Sunpulse cats. Sect No. 16, light, and the pride that ENDURES:
// the fourth verb of the cat meter, where Stillwater takes, Emberpride
// charges and Zephyrclaw gives.
//
// The pack was written before a single cat (js/races.js):
//
//   2pc Healer's Reward  mending an ally who is below half HP pays the
//                        healer 10% action bar
//   3pc Sunlit Wards     overhealing an ally wards them for half the
//                        spill (2 turns)
//   4pc High Noon        an ally at full HP ignores 15% of DEF
//
// Every kit below is written INTO that frame, and three consequences of
// it shape all nine:
//
// BIG MENDS, THROWN FREELY. Sunlit Wards means a heal past full is not
// waste but armour, so the four supports mend WIDE -- HP-priced pots
// aimed at whole rows -- and nobody meters out careful little sips.
// The overheal is the point.
//
// FULL IS A WEAPON. High Noon pays any untouched ally with armour
// pierce, so every striker here sustains itself: lifesteal on the
// swings (healDealt), self-mending passives, a hex that closes wounds
// at dawn. A Sunpulse carry at full HP is both harder to stop and
// harder-hitting -- and a lifesteal swing that lands at full SPILLS,
// which Sunlit Wards turns into a ward. The loop is deliberate.
//
// AND TRIAGE IS TEMPO. Healer's Reward pays the healer a tenth of a
// bar for every mend on the badly hurt, so the healers here act more
// often exactly when the fight goes wrong -- the endurance verb read
// as an economy.
//
// The nine hold the LIGHT shape, 4/3/2 from three stars up: the
// Temporal scroll never rolls below three, and a sect the gacha cannot
// sell is a shelf full of nothing. Statlines are RATIOS
// (js/data/balance.js); speed is identity. All nine sheets face RIGHT,
// so none carries a `faceLeft` flag.

const SUNPULSE = {
  // ---- 3-star ------------------------------------------------------
  // The dawn archer. Serin shoots the seats the sun reaches last, and
  // her second string drinks what it draws.
  serin: {
    id: 'serin',
    element: 'light',
    name: 'Serin',
    title: 'First Arrow of Morning',
    rarity: 3,
    stats: { hp: 1150, atk: 168, def: 76, speed: 114 },
    tint: { body: '#e8d8a8', helm: '#c8a03a', weapon: '#ffe8a8', shield: '#8a6a2a' },
    sprite: {
      displayH: 78,
      strips: {
        idle: { src: 'assets/heroes/sunpulse/serinidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'serin_daybreak_shot', name: 'Daybreak Shot',
        icon: 'assets/icons/fc1164.png',
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
        id: 'serin_drink_the_light', name: 'Drink the Light',
        icon: 'assets/icons/fc1165.png',
        // healDealt: the mend is a share of damage ACTUALLY dealt, so a
        // dodged arrow feeds nothing -- and a swig taken at full HP
        // spills, which Sunlit Wards hardens.
        description: 'One enemy: 155% ATK damage; heals for 50% of the damage dealt.',
        cooldown: 3, targeting: 'enemy', animation: 'idle', impact: 'slash_effect',
        effects: [{ type: 'damage', mult: 1.55, healDealt: { frac: 0.50 } }],
        levelUps: [
          { mult: 0.15 },
          { cooldown: -1 },
          { heal: 0.10 },
          { mult: 0.15 },
          { cooldown: -1 },
          { mult: 0.15 },
        ],
      },
      {
        id: 'serin_over_the_wall', name: 'Over the Wall',
        icon: 'assets/icons/fc1166.png',
        description: 'Enemy back row: 95% ATK damage.',
        cooldown: 5, targeting: 'back-enemies', animation: 'idle', impact: 'slash_effect',
        effects: [{ type: 'damage', mult: 0.95 }],
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
      name: 'Longlight',
      icon: 'assets/icons/fc1167.png',
      description: '+15% damage to back-row enemies.',
      hooks: {
        damageDealtMult: (u, t) =>
          (t && t.slot && (t.isBoss || t.slot.position === POSITION.BACK) ? 1.15 : 1),
      },
    },
    positional: POSITIONALS.downwind_shot,
  },

  // The steady one. Lumir closes wounds on a clock -- his own at dawn,
  // a room of enemies when the big lamp swings -- and his sweep is the
  // sect's only crowd line.
  lumir: {
    id: 'lumir',
    element: 'light',
    name: 'Lumir',
    title: 'The Lamp Swings Slow',
    rarity: 3,
    stats: { hp: 1180, atk: 164, def: 80, speed: 110 },
    tint: { body: '#d8c8b8', helm: '#c8a03a', weapon: '#ffe8a8', shield: '#8a6a2a' },
    sprite: {
      displayH: 80,
      strips: {
        idle: { src: 'assets/heroes/sunpulse/lumiridle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'lumir_lamplight', name: 'Lamplight',
        icon: 'assets/icons/fc1168.png',
        description: 'One enemy: 105% ATK damage.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.05 }],
        levelUps: [
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
        ],
      },
      {
        id: 'lumir_wide_beam', name: 'Wide Beam',
        icon: 'assets/icons/fc1169.png',
        description: 'All enemies: 55% ATK damage.',
        cooldown: 3, targeting: 'all-enemies', animation: 'idle', impact: 'slash_slam',
        effects: [{ type: 'damage', mult: 0.55 }],
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
        id: 'lumir_full_glare', name: 'Full Glare',
        icon: 'assets/icons/fc1170.png',
        description: 'One enemy: 175% ATK damage. Self: heals 15% max HP.',
        cooldown: 5, targeting: 'enemy', animation: 'idle', impact: 'horizonal_slash',
        effects: [{ type: 'damage', mult: 1.75 }],
        selfEffects: [{ type: 'healHpPct', pct: 0.15 }],
        levelUps: [
          { mult: 0.15 },
          { cooldown: -1 },
          { heal: 0.05 },
          { mult: 0.15 },
          { cooldown: -1 },
          { mult: 0.15 },
          { mult: 0.15 },
        ],
      },
    ],
    passive: {
      name: 'Gentle Glow',
      icon: 'assets/icons/fc1171.png',
      // Self-sustain on a clock: a striker who tops off between blows
      // is a striker High Noon keeps paying.
      description: 'Start of each turn: heals 5% max HP.',
      hooks: {
        onTurnStart(unit) {
          if (unit.hp >= unit.maxHp) return null;
          const healed = unit.heal(Math.round(unit.maxHp * 0.05), unit);
          if (healed <= 0) return null;
          return { label: 'Gentle Glow',
            floats: [{ target: unit, text: `+${healed}`, color: '#ffe8a8' }] };
        },
      },
    },
    positional: POSITIONALS.sunset_perch,
  },

  // The soft one. Celeste is the pure mender of the four supports, and
  // her whole kit is triage -- which under Healer's Reward is also her
  // whole tempo.
  celeste: {
    id: 'celeste',
    element: 'light',
    name: 'Celeste',
    title: 'Keeps the Candles',
    rarity: 3,
    stats: { hp: 1500, atk: 92, def: 98, speed: 108 },
    tint: { body: '#f0e8d8', helm: '#c8a03a', weapon: '#ffe8a8', shield: '#8a6a2a' },
    sprite: {
      displayH: 76,
      strips: {
        idle: { src: 'assets/heroes/sunpulse/celesteidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'celeste_candleflame', name: 'Candleflame',
        icon: 'assets/icons/fc1172.png',
        description: 'The lowest-health ally: heals 14% of caster max HP.',
        cooldown: 0, targeting: 'lowest-ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'healHpPct', pct: 0.14 }],
        levelUps: [
          { heal: 0.05 },
          { heal: 0.05 },
          { heal: 0.05 },
          { heal: 0.05 },
          { heal: 0.05 },
        ],
      },
      {
        id: 'celeste_soft_morning', name: 'Soft Morning',
        icon: 'assets/icons/fc1173.png',
        description: 'All allies: heals 8% of caster max HP.',
        cooldown: 3, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'healHpPct', pct: 0.08 }],
        levelUps: [
          { heal: 0.03 },
          { cooldown: -1 },
          { heal: 0.03 },
          { heal: 0.03 },
          { cooldown: -1 },
          { heal: 0.03 },
        ],
      },
      {
        id: 'celeste_vigil_kept', name: 'Vigil Kept',
        icon: 'assets/icons/fc1174.png',
        description: 'One ally: heals 22% of caster max HP; removes 2 debuffs.',
        cooldown: 5, targeting: 'lowest-ally', animation: 'idle', impact: 'heal_gold',
        effects: [
          { type: 'healHpPct', pct: 0.22 },
          { type: 'cleanse', count: 2 },
        ],
        levelUps: [
          { heal: 0.05 },
          { cleanseCount: 1 },
          { cooldown: -1 },
          { heal: 0.05 },
          { cooldown: -1 },
          { heal: 0.05 },
          { cleanseCount: 1 },
        ],
      },
    ],
    passive: {
      name: 'Last Candle',
      icon: 'assets/icons/fc1175.png',
      // Triage sharpened: the mend is a quarter wider exactly where
      // Healer's Reward is already paying her to aim it.
      description: '+25% healing to an ally below 25% HP.',
      hooks: {
        healBoostAdd(unit, patient) {
          if (!patient || !(patient.maxHp > 0)) return 0;
          return patient.hp / patient.maxHp < 0.25 ? 0.25 : 0;
        },
      },
    },
    positional: POSITIONALS.triage_lantern,
  },

  // The front-line chaplain. Ravi mends from inside the melee, priced
  // off ATK so fire-free strength buffs still widen him, and his bell
  // both wounds and mends in the same swing.
  ravi: {
    id: 'ravi',
    element: 'light',
    name: 'Ravi',
    title: 'Bell Before the Charge',
    rarity: 3,
    stats: { hp: 1420, atk: 118, def: 104, speed: 112 },
    tint: { body: '#d8b888', helm: '#c8a03a', weapon: '#ffe8a8', shield: '#8a6a2a' },
    sprite: {
      displayH: 82,
      strips: {
        idle: { src: 'assets/heroes/sunpulse/raviidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'ravi_morning_bell', name: 'Morning Bell',
        icon: 'assets/icons/fc1176.png',
        // healDealt to the LOWEST ally: the bell rings on an enemy and
        // the sound lands on whoever needs it, which under Healer's
        // Reward can pay him for attacking.
        description: 'One enemy: 85% ATK damage; the lowest-health ally heals ' +
          'for 60% of the damage dealt.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'punch',
        effects: [{ type: 'damage', mult: 0.85,
          healDealt: { frac: 0.60, to: 'lowest-ally' } }],
        levelUps: [
          { mult: 0.08 },
          { heal: 0.10 },
          { mult: 0.08 },
          { heal: 0.10 },
          { mult: 0.08 },
        ],
      },
      {
        id: 'ravi_call_to_prayer', name: 'Call to Prayer',
        icon: 'assets/icons/fc1177.png',
        description: 'All allies: heals 60% ATK.',
        cooldown: 4, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'heal', mult: 0.60 }],
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
        id: 'ravi_stand_together', name: 'Stand Together',
        icon: 'assets/icons/fc1178.png',
        description: 'Front-row allies: heals 110% ATK; +10% DEF for 2 turns.',
        cooldown: 5, targeting: 'front-allies', animation: 'idle', impact: 'heal_gold',
        effects: [
          { type: 'heal', mult: 1.10 },
          { type: 'buff', stat: 'def', mult: 1.10, turns: 2 },
        ],
        levelUps: [
          { mult: 0.15 },
          { buffPower: 0.05 },
          { cooldown: -1 },
          { mult: 0.15 },
          { cooldown: -1 },
          { buffPower: 0.05 },
          { mult: 0.15 },
        ],
      },
    ],
    passive: {
      name: 'Warm Blood',
      icon: 'assets/icons/fc1179.png',
      // The front-line answer to standing in the front line: every blow
      // survived closes a little. Nala converts blows to bar, Magnus to
      // claws; Ravi simply refuses to stay hurt.
      description: 'When struck: heals 5% max HP.',
      hooks: {
        onStruck(unit) {
          const healed = unit.heal(Math.round(unit.maxHp * 0.05), unit);
          if (healed <= 0) return null;
          return { label: 'Warm Blood',
            floats: [{ target: unit, text: `+${healed}`, color: '#ffe8a8' }] };
        },
      },
    },
    positional: POSITIONALS.first_to_kneel,
  },

  // ---- 4-star ------------------------------------------------------
  // The duelist in gold. Cassian is the front-row proof of High Noon:
  // every landed hit closes his own wounds, so he swings from full more
  // than any front-liner has a right to.
  cassian: {
    id: 'cassian',
    element: 'light',
    name: 'Cassian',
    title: 'Bright and Early',
    rarity: 4,
    stats: { hp: 1380, atk: 162, def: 98, speed: 116 },
    tint: { body: '#e8d0a0', helm: '#c8a03a', weapon: '#ffe8a8', shield: '#8a6a2a' },
    sprite: {
      displayH: 86,
      strips: {
        idle: { src: 'assets/heroes/sunpulse/cassianidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'cassian_gilded_cut', name: 'Gilded Cut',
        icon: 'assets/icons/fc1180.png',
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
        id: 'cassian_noonday_press', name: 'Noonday Press',
        icon: 'assets/icons/fc1181.png',
        description: 'One enemy: 165% ATK damage (ignores 15% DEF).',
        cooldown: 4, targeting: 'enemy', animation: 'idle', impact: 'slash_effect',
        effects: [{ type: 'damage', mult: 1.65, ignoreDef: 0.15 }],
        levelUps: [
          { mult: 0.15 },
          { cooldown: -1 },
          { mult: 0.15 },
          { mult: 0.15 },
          { cooldown: -1 },
          { mult: 0.15 },
        ],
      },
      {
        id: 'cassian_parade_sweep', name: 'Parade Sweep',
        icon: 'assets/icons/fc1182.png',
        description: 'Enemy front and center rows: 75% ATK damage.',
        cooldown: 5, targeting: 'front-and-center-enemies',
        animation: 'idle', impact: 'horizonal_slash',
        effects: [{ type: 'damage', mult: 0.75 }],
        levelUps: [
          { mult: 0.08 },
          { cooldown: -1 },
          { mult: 0.08 },
          { mult: 0.08 },
          { cooldown: -1 },
          { mult: 0.08 },
          { mult: 0.08 },
        ],
      },
    ],
    passive: {
      name: 'Sunstroke',
      icon: 'assets/icons/fc1183.png',
      // Lifesteal as a passive rather than a rider, so ALL three skills
      // sustain him -- and a mend landed at full spills into Sunlit
      // Wards, which is the sect's loop working as designed.
      description: 'Landing a hit mends 5% of max HP.',
      hooks: {
        onDealtDamage(unit, { amount } = {}) {
          if (!(amount > 0)) return null;
          unit.heal(Math.round(unit.maxHp * 0.05), unit);
          return null; // quiet: it fires on every swing
        },
      },
    },
    positional: POSITIONALS.vanguard_press,
  },

  // The door of the dawn house. Bram is the wall the pack turns
  // golden: he holds the line, mends behind his own shield, and his
  // finisher wards the whole party off his DEF.
  bram: {
    id: 'bram',
    element: 'light',
    name: 'Bram',
    title: 'The Door Holds Till Morning',
    rarity: 4,
    stats: { hp: 1820, atk: 98, def: 142, speed: 100 },
    tint: { body: '#c8b088', helm: '#c8a03a', weapon: '#e8d0a0', shield: '#8a6a2a' },
    sprite: {
      displayH: 92,
      strips: {
        idle: { src: 'assets/heroes/sunpulse/bramidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'bram_door_knock', name: 'Door Knock',
        icon: 'assets/icons/fc1184.png',
        description: 'One enemy: 110% DEF damage.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'punch',
        effects: [{ type: 'damageDef', mult: 1.10 }],
        levelUps: [
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
        ],
      },
      {
        id: 'bram_bar_the_way', name: 'Bar the Way',
        icon: 'assets/icons/fc1185.png',
        description: 'Self: shield worth 120% DEF for 3 turns; draws enemy attacks for 2 turns.',
        cooldown: 4, targeting: 'self', animation: 'idle', impact: 'shield_bubble',
        effects: [
          { type: 'shield', defMult: 1.20, turns: 3 },
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
        id: 'bram_house_of_dawn', name: 'House of Dawn',
        icon: 'assets/icons/fc1186.png',
        // A DEF-priced ward for everyone -- the pricing the shield case
        // learned for this sect's tanks, spent on the whole party.
        description: 'All allies: shield worth 55% of caster DEF for 3 turns.',
        cooldown: 5, targeting: 'all-allies', animation: 'idle', impact: 'shield_bubble',
        effects: [{ type: 'shield', defMult: 0.55, turns: 3 }],
        levelUps: [
          { mult: 0.10 },
          { cooldown: -1 },
          { mult: 0.10 },
          { duration: 1 },
          { cooldown: -1 },
          { mult: 0.10 },
          { mult: 0.10 },
        ],
      },
    ],
    passive: {
      name: 'Broad Shoulders',
      icon: 'assets/icons/fc1187.png',
      // The complement of light's own Last Bell: the resonance shaves
      // blows below a quarter, Bram shaves them while he is still
      // WHOLE -- so the two never pay at once.
      description: 'Takes 10% less damage while above half HP.',
      hooks: {
        damageTakenMult: (unit) =>
          (unit.maxHp > 0 && unit.hp / unit.maxHp > 0.5 ? 0.90 : 1),
      },
    },
    positional: POSITIONALS.sunrise_gate,
  },

  // The bringer of good news. Sunny is the sect's second wind: mends
  // that arrive with wards, and a spirit that quickens every time
  // somebody else is looked after.
  sunny: {
    id: 'sunny',
    element: 'light',
    name: 'Sunny',
    title: 'Good News Travels',
    rarity: 4,
    stats: { hp: 1560, atk: 96, def: 104, speed: 112 },
    tint: { body: '#f0e0b8', helm: '#c8a03a', weapon: '#ffe8a8', shield: '#8a6a2a' },
    sprite: {
      displayH: 78,
      strips: {
        idle: { src: 'assets/heroes/sunpulse/sunnyidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'sunny_pick_me_up', name: 'Pick-Me-Up',
        icon: 'assets/icons/fc1188.png',
        description: 'The lowest-health ally: heals 12% of caster max HP.',
        cooldown: 0, targeting: 'lowest-ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'healHpPct', pct: 0.12 }],
        levelUps: [
          { heal: 0.04 },
          { heal: 0.04 },
          { heal: 0.04 },
          { heal: 0.04 },
          { heal: 0.04 },
        ],
      },
      {
        id: 'sunny_rounds_of_cheer', name: 'Rounds of Cheer',
        icon: 'assets/icons/fc1189.png',
        description: 'All allies: heals 7% of caster max HP; removes 1 debuff.',
        cooldown: 4, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [
          { type: 'healHpPct', pct: 0.07 },
          { type: 'cleanse', count: 1 },
        ],
        levelUps: [
          { heal: 0.03 },
          { cleanseCount: 1 },
          { cooldown: -1 },
          { heal: 0.03 },
          { cooldown: -1 },
          { heal: 0.03 },
        ],
      },
      {
        id: 'sunny_tucked_in', name: 'Tucked In',
        icon: 'assets/icons/fc1190.png',
        description: 'One ally: heals 16% of caster max HP; shield worth 90% ATK for 3 turns.',
        cooldown: 5, targeting: 'lowest-ally', animation: 'idle', impact: 'shield_bubble',
        effects: [
          { type: 'healHpPct', pct: 0.16 },
          { type: 'shield', mult: 0.90, turns: 3 },
        ],
        levelUps: [
          { heal: 0.05 },
          { mult: 0.15 },
          { cooldown: -1 },
          { heal: 0.05 },
          { cooldown: -1 },
          { mult: 0.15 },
          { duration: 1 },
        ],
      },
    ],
    passive: {
      name: 'Lifted Spirits',
      icon: 'assets/icons/fc1191.png',
      // Reads the heal bus the way the pack's 2pc does, from the other
      // side: the pack pays the healer for triage, Sunny quickens on
      // ANY colleague's mend -- hers included, which is why the gate is
      // on the patient, not the healer.
      description: 'Whenever an ally is healed by someone else: +4% turn meter.',
      hooks: {
        onAllyHealed(unit, healedUnit, battle, info = {}) {
          if (!info.healer || info.healer === healedUnit) return null;
          if (healedUnit === unit) return null;
          unit.turnMeter += CONFIG.TURN_METER_MAX * 0.04;
          return null; // quiet: it fires constantly in this sect
        },
      },
    },
    positional: POSITIONALS.hearthlight,
  },

  // ---- 5-star ------------------------------------------------------
  // The high priest at the meridian. Khema is the biggest pot in the
  // game pointed at whole rows, and nothing she spills is wasted --
  // half becomes wards by the pack, and her own hands pass the rest to
  // whoever is still bleeding.
  khema: {
    id: 'khema',
    element: 'light',
    name: 'Khema',
    title: 'Meridian of the Sunpulse',
    rarity: 5,
    stats: { hp: 1900, atk: 104, def: 118, speed: 106 },
    tint: { body: '#e8d8b0', helm: '#c8a03a', weapon: '#ffe8a8', shield: '#8a6a2a' },
    sprite: {
      displayH: 90,
      strips: {
        idle: { src: 'assets/heroes/sunpulse/khemaidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'khema_warm_hands', name: 'Warm Hands',
        icon: 'assets/icons/fc1192.png',
        description: 'The lowest-health ally: heals 16% of caster max HP.',
        cooldown: 0, targeting: 'lowest-ally', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'healHpPct', pct: 0.16 }],
        levelUps: [
          { heal: 0.05 },
          { heal: 0.05 },
          { heal: 0.05 },
          { heal: 0.05 },
          { heal: 0.05 },
        ],
      },
      {
        id: 'khema_high_prayer', name: 'High Prayer',
        icon: 'assets/icons/fc1193.png',
        description: 'All allies: heals 10% of caster max HP.',
        cooldown: 4, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [{ type: 'healHpPct', pct: 0.10 }],
        levelUps: [
          { heal: 0.03 },
          { cooldown: -1 },
          { heal: 0.03 },
          { heal: 0.03 },
          { cooldown: -1 },
          { heal: 0.03 },
        ],
      },
      {
        id: 'khema_daylight_court', name: 'Daylight Court',
        icon: 'assets/icons/fc1194.png',
        description: 'All allies: heals 16% of caster max HP; removes 1 debuff.',
        cooldown: 6, targeting: 'all-allies', animation: 'idle', impact: 'heal_gold',
        effects: [
          { type: 'healHpPct', pct: 0.16 },
          { type: 'cleanse', count: 1 },
        ],
        levelUps: [
          { heal: 0.05 },
          { cleanseCount: 1 },
          { cooldown: -1 },
          { heal: 0.05 },
          { cooldown: -1 },
          { heal: 0.05 },
          { cleanseCount: 1 },
        ],
      },
    ],
    passive: {
      name: 'The Light Finds Another',
      icon: 'assets/icons/fc1195.png',
      // Peck wards his own spill; Khema RE-MENDS hers -- half of every
      // overheal she pours lands on the most wounded other ally, so a
      // full-team prayer over a healthy row still finds the one who
      // needed it. The redirected mend goes through heal() with Khema
      // as source, so the meter, the pack's 2pc, and Sunny's spirits
      // all see it as the mend it is.
      description: 'When Khema overheals: half the spill is mended onto the most wounded other ally.',
      hooks: {
        onOverheal(unit, { overflow, target } = {}) {
          if (!(overflow > 0)) return null;
          const b = typeof Battle !== 'undefined' ? Battle.active : null;
          if (!b) return null;
          const hurt = b.livingUnits(unit.team)
            .filter((u) => u !== target && u.hp < u.maxHp)
            .sort((a, x) => a.hp / a.maxHp - x.hp / x.maxHp)[0];
          if (!hurt) return null;
          const healed = hurt.heal(Math.round(overflow * 0.5), unit);
          if (healed <= 0) return null;
          return { label: 'The Light Finds Another',
            floats: [{ target: hurt, text: `+${healed}`, color: '#ffe8a8' }] };
        },
      },
    },
    positional: POSITIONALS.the_warm_spot,
  },

  // The noon cannon. Helios is the sect's argument that a healthy body
  // is a weapon: the hardest single swing in the pride, kept at full by
  // his own kit so High Noon and his zenith never switch off.
  helios: {
    id: 'helios',
    element: 'light',
    name: 'Helios',
    title: 'Nothing Casts a Shadow at Noon',
    rarity: 5,
    stats: { hp: 1300, atk: 192, def: 84, speed: 112 },
    tint: { body: '#e8c888', helm: '#c8a03a', weapon: '#ffe8a8', shield: '#8a6a2a' },
    sprite: {
      displayH: 88,
      strips: {
        idle: { src: 'assets/heroes/sunpulse/heliosidle.png', frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'helios_sunspoke', name: 'Sunspoke',
        icon: 'assets/icons/fc1196.png',
        description: 'One enemy: 120% ATK damage.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.20 }],
        levelUps: [
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
          { mult: 0.10 },
        ],
      },
      {
        id: 'helios_corona', name: 'Corona',
        icon: 'assets/icons/fc1197.png',
        description: 'All enemies: 70% ATK damage.',
        cooldown: 4, targeting: 'all-enemies', animation: 'idle', impact: 'slash_slam',
        effects: [{ type: 'damage', mult: 0.70 }],
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
        id: 'helios_perihelion', name: 'Perihelion',
        icon: 'assets/icons/fc1198.png',
        description: 'One enemy: 250% ATK damage (ignores 20% DEF). Self: heals 20% max HP.',
        cooldown: 6, targeting: 'enemy', animation: 'idle', impact: 'horizonal_slash',
        effects: [{ type: 'damage', mult: 2.50, ignoreDef: 0.20 }],
        selfEffects: [{ type: 'healHpPct', pct: 0.20 }],
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
      name: 'Zenith',
      icon: 'assets/icons/fc1199.png',
      // The whole sect keeps him topped up; this is what topped up is
      // FOR. Stacks with High Noon's pierce under the same condition,
      // which is the 5-star reading of the pack on purpose.
      description: '+25% damage while at full HP.',
      hooks: {
        damageDealtMult: (u) => (u.maxHp > 0 && u.hp >= u.maxHp ? 1.25 : 1),
      },
    },
    positional: POSITIONALS.zenith_seat,
  },
};

Object.assign(HEROES, SUNPULSE);

if (typeof module !== 'undefined' && module.exports) module.exports = { SUNPULSE };
