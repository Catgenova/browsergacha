// Elemental bosses: one per element, twenty stages each, and the only
// source of the Elements that attune a hero (see js/attune.js).
//
// They fight like the gear bosses -- alone, spanning the whole enemy
// formation, on their own stat anchors -- but each one is built around
// the thing its element does to a party, so beating five of them is five
// different problems rather than one problem in five colours:
//
//   Wind    speed and extra turns; drains the party's action bars
//   Water   drowns the front line and heals off what it deals
//   Fire    stacking burn that gets worse the longer the fight runs
//   Dark    withers: debuffs that stack and a passive that feeds on them
//   Light   shields itself and blinds; punishes a party that cannot burst
//
// Each is 5x an ordinary boss's HP anchor at stage 1 and, like the gear
// bosses, interpolates between stats5 and stats100.

const ELEMENTAL_BOSSES = (() => {
  const B = {};

  // Shared shape: the differences are the kit, not the bookkeeping.
  const boss = (id, o) => {
    B[id] = {
      id: `attune_${id}`,
      attuneId: id,
      isBoss: true,
      isElemental: true,
      rarity: 5,
      sprite: { displayH: 210, strips: {} }, // procedural art until drawn
      ...o,
    };
    return B[id];
  };

  boss('wind', {
    element: 'wind',
    name: 'Gale Sovereign',
    title: 'The Turning Sky',
    background: 'assets/battle_bg_canyon.png',
    tint: { body: '#7ae87a', helm: '#b8f0b8', weapon: '#e8f8e8', skin: '#cfe8cf' },
    stats: { hp: 62000, atk: 520, def: 240, speed: 160 },
    stats5: { hp: 62000, atk: 520, def: 240, speed: 160 },
    stats100: { hp: 430000, atk: 12800, def: 1700, speed: 190 },
    abilities: [
      {
        id: 'gale_rake', name: 'Gale Rake',
        icon: 'assets/icons/fc1065.png',
        description: 'Shear the whole party for 85% ATK and cut every action bar by 15%.',
        cooldown: 0, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.85 },
          { type: 'turnMeter', amount: -0.15 },
        ],
      },
      {
        id: 'updraft', name: 'Updraft',
        icon: 'assets/icons/fc1063.png',
        description: 'Ride the wind: +60% SPD for 3 turns and its own bar fills by 50%.',
        cooldown: 4, targeting: 'self', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.6, turns: 3 },
          { type: 'turnMeter', amount: 0.5 },
        ],
      },
      {
        id: 'the_turning', name: 'The Turning',
        icon: 'assets/icons/fc1035.png',
        description: 'The sky turns over: 190% ATK to the whole party and every ' +
          'action bar emptied by 40%.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.9 },
          { type: 'turnMeter', amount: -0.4 },
        ],
      },
    ],
    passives: [
      {
        name: 'Nothing Holds It',
        icon: 'assets/icons/fc1036.png',
        description: 'Cannot be slowed: SPD debuffs land at half strength.',
        hooks: { damageTakenMult: () => 1 },
      },
      {
        name: 'Second Wind',
        icon: 'assets/icons/fc1064.png',
        description: 'Each time it is struck, its action bar gains 4%.',
        hooks: {
          onStruck(unit) {
            unit.turnMeter = Math.min(CONFIG.TURN_METER_MAX,
              unit.turnMeter + CONFIG.TURN_METER_MAX * 0.04);
          },
        },
      },
      {
        name: 'Thin Air',
        icon: 'assets/icons/fc1037.png',
        description: 'Deals 25% extra damage to heroes holding back hexes.',
        hooks: {
          damageDealtMult(unit, target) {
            return target && target.slot && target.slot.position === POSITION.BACK ? 1.25 : 1;
          },
        },
      },
    ],
  });

  boss('water', {
    element: 'water',
    name: 'Tideholder',
    title: 'The Drowning Deep',
    background: 'assets/battle_bg_valley.png',
    tint: { body: '#8ecbff', helm: '#c8e8ff', weapon: '#e8f4ff', skin: '#a8d8f0' },
    stats: { hp: 78000, atk: 470, def: 330, speed: 112 },
    stats5: { hp: 78000, atk: 470, def: 330, speed: 112 },
    stats100: { hp: 560000, atk: 11400, def: 2400, speed: 130 },
    abilities: [
      {
        id: 'undertow', name: 'Undertow',
        icon: 'assets/icons/fc1057.png',
        description: 'Drag the front rank under for 165% ATK.',
        cooldown: 0, targeting: 'front-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.65 }],
      },
      {
        id: 'drowning_grasp', name: 'Drowning Grasp',
        icon: 'assets/icons/fc1058.png',
        description: 'One hero for 240% ATK, and the Tideholder mends 25% of its own max HP.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 2.4 }],
        selfEffects: [{ type: 'healHpPct', pct: 0.25 }],
      },
      {
        id: 'the_deep', name: 'The Deep Closes',
        icon: 'assets/icons/fc1059.png',
        description: 'The water rises: 140% ATK to all, and -35% ATK on the party for 3 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.4 },
          { type: 'debuff', stat: 'atk', mult: 0.65, turns: 3 },
        ],
      },
    ],
    passives: [
      {
        name: 'Deep Pressure',
        icon: 'assets/icons/fc1060.png',
        description: 'Takes 20% less damage while above half HP.',
        hooks: {
          damageTakenMult: (u) => (u.hp / u.maxHp > 0.5 ? 0.8 : 1),
        },
      },
      {
        name: 'It Does Not Tire',
        icon: 'assets/icons/fc1061.png',
        description: 'Restores 2% of its max HP at the start of every turn.',
        hooks: {
          onTurnStart(unit) {
            const healed = unit.heal(Math.round(unit.maxHp * 0.02), unit);
            return healed > 0 ? { label: 'Tide', message: `${unit.name} draws the water back in for ${healed}.` } : null;
          },
        },
      },
      {
        name: 'Undertow Grip',
        icon: 'assets/icons/fc1062.png',
        description: 'Deals 25% extra damage to heroes holding front hexes.',
        hooks: {
          damageDealtMult(unit, target) {
            return target && target.slot && target.slot.position === POSITION.FRONT ? 1.25 : 1;
          },
        },
      },
    ],
  });

  boss('fire', {
    element: 'fire',
    name: 'Emberthrone',
    title: 'The Long Burn',
    background: 'assets/battle_bg_volcano.png',
    tint: { body: '#ff9a5a', helm: '#ffd08a', weapon: '#ffe8c0', skin: '#e8a070' },
    stats: { hp: 66000, atk: 560, def: 260, speed: 124 },
    stats5: { hp: 66000, atk: 560, def: 260, speed: 124 },
    stats100: { hp: 470000, atk: 14000, def: 1800, speed: 142 },
    abilities: [
      {
        id: 'cinder_lash', name: 'Cinder Lash',
        icon: 'assets/icons/fc1080.png',
        description: 'Whip the party for 80% ATK and set a burn worth 30% ATK for 4 turns.',
        cooldown: 0, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.8 },
          { type: 'dot', pct: 0.3, turns: 4 },
        ],
      },
      {
        id: 'stoke', name: 'Stoke the Coals',
        icon: 'assets/icons/fc1047.png',
        description: 'Feed the fire: +45% ATK for 4 turns, and every burn on the party ' +
          'ticks again immediately.',
        cooldown: 5, targeting: 'self', animation: 'attack',
        effects: [{ type: 'buff', stat: 'atk', mult: 1.45, turns: 4 }],
      },
      {
        id: 'conflagration', name: 'Conflagration',
        icon: 'assets/icons/fc1048.png',
        description: 'Everything burns: 170% ATK to all, doubled against anyone already burning.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.7, bonusVs: { kind: 'dot', mult: 2 } }],
      },
    ],
    passives: [
      {
        name: 'Rising Heat',
        icon: 'assets/icons/fc1031.png',
        description: 'Every burn it inflicts lasts a turn longer.',
        hooks: { dotExtraTurns: 1 },
      },
      {
        name: 'Enrage',
        icon: 'assets/icons/fc1032.png',
        description: 'Deals 35% extra damage while below half HP.',
        hooks: {
          damageDealtMult: (u) => (u.hp / u.maxHp < 0.5 ? 1.35 : 1),
        },
      },
      {
        name: 'Ash Mantle',
        icon: 'assets/icons/fc1033.png',
        description: 'Takes 15% less damage from anyone who is burning.',
        hooks: { damageTakenMult: () => 1 },
      },
    ],
  });

  boss('dark', {
    element: 'dark',
    name: 'Witherking',
    title: 'The Long Night',
    background: 'assets/battle_bg_bonefield.png',
    tint: { body: '#b48aff', helm: '#d8b8ff', weapon: '#e8d8ff', skin: '#9a8ab8' },
    stats: { hp: 71000, atk: 540, def: 280, speed: 128 },
    stats5: { hp: 71000, atk: 540, def: 280, speed: 128 },
    stats100: { hp: 500000, atk: 13200, def: 1900, speed: 148 },
    abilities: [
      {
        id: 'wither', name: 'Wither',
        icon: 'assets/icons/fc1054.png',
        description: 'Drain the party for 90% ATK and strip 25% DEF for 3 turns.',
        cooldown: 0, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'debuff', stat: 'def', mult: 0.75, turns: 3 },
        ],
      },
      {
        id: 'night_falls', name: 'Night Falls',
        icon: 'assets/icons/fc1055.png',
        description: 'Mark the whole party vulnerable: +40% damage taken for 3 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'debuff', stat: 'damageTaken', mult: 1.4, turns: 3 }],
      },
      {
        id: 'long_night', name: 'The Long Night',
        icon: 'assets/icons/fc1056.png',
        description: 'Close the dark over one hero for 320% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 3.2 }],
      },
    ],
    passives: [
      {
        name: 'Feeds On Ruin',
        icon: 'assets/icons/fc1049.png',
        description: 'Its debuffs always land: they cannot be resisted.',
        hooks: { damageDealtMult: () => 1 },
      },
      {
        name: 'Creeping Dark',
        icon: 'assets/icons/fc1051.png',
        description: 'Every debuff it inflicts lasts a turn longer.',
        hooks: { debuffExtraTurns: 1 },
      },
      {
        name: 'Nightfall',
        icon: 'assets/icons/fc1057.png',
        description: 'Deals 20% extra damage for every 25% of its own HP already lost.',
        hooks: {
          damageDealtMult(unit) {
            return 1 + 0.2 * Math.floor((1 - unit.hp / unit.maxHp) / 0.25);
          },
        },
      },
    ],
  });

  boss('light', {
    element: 'light',
    name: 'Aureate Choir',
    title: 'The Unbroken Hour',
    background: 'assets/battle_bg_glade.png',
    tint: { body: '#ffd76a', helm: '#fff0b8', weapon: '#fffae0', skin: '#e8d8a8' },
    stats: { hp: 74000, atk: 500, def: 320, speed: 120 },
    stats5: { hp: 74000, atk: 500, def: 320, speed: 120 },
    stats100: { hp: 530000, atk: 12200, def: 2300, speed: 138 },
    abilities: [
      {
        id: 'chorus', name: 'Chorus',
        icon: 'assets/icons/fc1040.png',
        description: 'A rising note through the party for 95% ATK.',
        cooldown: 0, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.95 }],
      },
      {
        id: 'reliquary', name: 'Reliquary',
        icon: 'assets/icons/fc1043.png',
        description: 'Raise a shield worth 400% ATK for 4 turns. Burst it or wait it out.',
        cooldown: 5, targeting: 'self', animation: 'attack',
        effects: [{ type: 'shield', mult: 4, turns: 4 }],
      },
      {
        id: 'unbroken_hour', name: 'The Unbroken Hour',
        icon: 'assets/icons/fc1045.png',
        description: 'Blinding light: 150% ATK to all, doubled while its own shield still holds.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.5, bonusWhen: { state: 'shielded', mult: 2 } }],
      },
    ],
    passives: [
      {
        name: 'Gilded',
        icon: 'assets/icons/fc1042.png',
        description: 'Takes 25% less damage while its shield still holds.',
        hooks: {
          damageTakenMult: (u) => (u.shieldTotal && u.shieldTotal() > 0 ? 0.75 : 1),
        },
      },
      {
        name: 'Answering Light',
        icon: 'assets/icons/fc1044.png',
        description: 'Each time it is struck, it adds 10% of its DEF to its own shield.',
        hooks: {
          onStruck(unit) {
            unit.addShield(Math.max(1, Math.round(unit.effectiveStat('def') * 0.1)), 4, unit);
          },
        },
      },
      {
        name: 'Undimmed',
        icon: 'assets/icons/fc1046.png',
        description: 'Deals 20% extra damage to Dark heroes, on top of the elemental cycle.',
        hooks: {
          damageDealtMult(unit, target) {
            return target && target.element === 'dark' ? 1.2 : 1;
          },
        },
      },
    ],
  });

  return B;
})();
