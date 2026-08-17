// Hero definitions. Every hero follows the same contract:
//   - 3 active abilities: one no-cooldown, one short cooldown, one long cooldown
//   - 1 passive ability: hooks.onTurnStart(unit, battle) -> null | {
//       label, message, floats: [{ target, text, color }] }
//   - 1 positional bonus, active only in the matching grid position
//   - sprite: spritesheet reference (placeholder art is generated when the
//     PNG is absent — drop real sheets into assets/heroes/ to replace it)
//
// Rarity drives gacha rates and rough stat budgets (3★ < 4★ < 5★).

// Shared sprite declaration until real sheets land; per-hero PNGs will
// override frame sizes/rows as needed.
function defaultSprite(id) {
  return {
    src: `assets/heroes/${id}.png`,
    frameW: 32,
    frameH: 32,
    animations: {
      idle:   { row: 0, frames: 4, fps: 6,  loop: true  },
      attack: { row: 1, frames: 5, fps: 10, loop: false },
    },
  };
}

// Passive helper: heal self for pct of max HP each turn.
function regenPassive(name, pct) {
  return {
    name,
    description: `Recovers ${Math.round(pct * 100)}% max HP at the start of each turn.`,
    hooks: {
      onTurnStart(unit) {
        const healed = unit.heal(Math.round(unit.maxHp * pct));
        if (healed <= 0) return null;
        return {
          label: name,
          message: `${unit.name}'s ${name} restores ${healed} HP.`,
          floats: [{ target: unit, text: `+${healed}`, color: '#7ae87a' }],
        };
      },
    },
  };
}

const HEROES = {
  // ---- 3★ ---------------------------------------------------------------

  bram: {
    id: 'bram',
    name: 'Bram',
    title: 'Thornback',
    rarity: 3,
    stats: { hp: 1500, atk: 150, def: 170, speed: 80 },
    tint: { body: '#6a7a4a', helm: '#8a9a6a', shield: '#5a4a30' },
    sprite: defaultSprite('bram'),
    abilities: [
      {
        id: 'thorn_jab', name: 'Thorn Jab',
        description: 'Jab one enemy for 100% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.0 }],
      },
      {
        id: 'brace', name: 'Brace',
        description: 'Raise own DEF by 50% for 2 turns.',
        cooldown: 3, targeting: 'self', animation: 'attack',
        effects: [{ type: 'buff', stat: 'def', mult: 1.5, turns: 2 }],
      },
      {
        id: 'bramble_wall', name: 'Bramble Wall',
        description: 'Raise ALL allies\' DEF by 30% for 2 turns.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [{ type: 'buff', stat: 'def', mult: 1.3, turns: 2 }],
      },
    ],
    passive: regenPassive('Stone Skin', 0.03),
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.3,
      description: 'Bulwark: +30% DEF while in a front hex.',
    },
  },

  lyra: {
    id: 'lyra',
    name: 'Lyra',
    title: 'Swift Arrow',
    rarity: 3,
    stats: { hp: 1000, atk: 200, def: 90, speed: 110 },
    tint: { body: '#7a5a3a', helm: '#caa86a', weapon: '#e8e0c8' },
    sprite: defaultSprite('lyra'),
    abilities: [
      {
        id: 'quick_shot', name: 'Quick Shot',
        description: 'Shoot one enemy for 100% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.0 }],
      },
      {
        id: 'piercing_bolt', name: 'Piercing Bolt',
        description: 'Pierce one enemy for 150% ATK.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.5 }],
      },
      {
        id: 'arrow_storm', name: 'Arrow Storm',
        description: 'Rain arrows on ALL enemies for 80% ATK.',
        cooldown: 5, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.8 }],
      },
    ],
    passive: {
      name: 'Focus',
      description: 'Gains +10% ATK for 1 turn at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.1, turns: 1 });
          return {
            label: 'Focus',
            message: `${unit.name} focuses (+10% ATK this turn).`,
            floats: [{ target: unit, text: 'ATK ▲', color: '#8ecbff' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.2,
      description: 'Deadeye: +20% ATK while in a back hex.',
    },
  },

  milo: {
    id: 'milo',
    name: 'Milo',
    title: 'Acolyte',
    rarity: 3,
    stats: { hp: 1100, atk: 160, def: 110, speed: 95 },
    tint: { body: '#c8c0a8', helm: '#e8dcc0', weapon: '#caa86a' },
    sprite: defaultSprite('milo'),
    abilities: [
      {
        id: 'smite', name: 'Smite',
        description: 'Smite one enemy for 90% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.9 }],
      },
      {
        id: 'mend', name: 'Mend',
        description: 'Heal one ally for 120% ATK.',
        cooldown: 2, targeting: 'ally', animation: 'attack',
        effects: [{ type: 'heal', mult: 1.2 }],
      },
      {
        id: 'sanctuary', name: 'Sanctuary',
        description: 'Heal ALL allies for 70% ATK.',
        cooldown: 5, targeting: 'all-allies', animation: 'attack',
        effects: [{ type: 'heal', mult: 0.7 }],
      },
    ],
    passive: {
      name: 'Mending Light',
      description: 'Heals the most wounded ally for 3% of Milo\'s max HP each turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team)
            .filter((u) => u.hp < u.maxHp)
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          if (allies.length === 0) return null;
          const target = allies[0];
          const healed = target.heal(Math.round(unit.maxHp * 0.03));
          if (healed <= 0) return null;
          return {
            label: 'Mending Light',
            message: `${unit.name}'s Mending Light heals ${target.name} for ${healed}.`,
            floats: [{ target, text: `+${healed}`, color: '#7ae87a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'def', mult: 1.25,
      description: 'Sheltered: +25% DEF while in the center hex.',
    },
  },

  // ---- 4★ ---------------------------------------------------------------

  florence: {
    id: 'florence',
    name: 'Florence',
    title: 'Crystal Blade',
    rarity: 4,
    stats: { hp: 1450, atk: 240, def: 130, speed: 105 },
    // Placeholder tint (silver armor, crystal sword) until strips load.
    tint: { body: '#8d9bb8', helm: '#c8d0e0', weapon: '#8ad8ff', shield: '#a83a3a' },
    sprite: {
      displayH: 88,
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
            { frame: 8,  effect: 'jump_cloud', at: 'origin',       dy: 28 },
            { frame: 18, effect: 'land_cloud', at: 'targetBehind', dy: 28 },
          ],
        },
      },
    },
    abilities: [
      {
        id: 'crystal_slash', name: 'Crystal Slash',
        description: 'Leap to an enemy and slash clean through for 100% ATK.',
        // Slash impact rotated to sweep left-to-right with the sword tip.
        cooldown: 0, targeting: 'enemy', animation: 'jumpslash', impact: 'slash', impactRotate: -90,
        effects: [{ type: 'damage', mult: 1.0 }],
      },
      {
        id: 'crystal_resonance', name: 'Crystal Resonance',
        description: 'Attune to the blade: +50% crit chance and +50% crit damage for 3 turns.',
        cooldown: 5, targeting: 'self', animation: 'buff', impact: 'slam',
        effects: [
          { type: 'buff', stat: 'critChance', add: 0.5, turns: 3 },
          { type: 'buff', stat: 'critDamage', add: 0.5, turns: 3 },
        ],
      },
      {
        id: 'prism_break', name: 'Prism Break',
        description: 'Leap skyward and hurl a shearing wave that cuts an entire enemy row for 170% ATK.',
        cooldown: 7, targeting: 'enemy-row', animation: 'rowslash', vfx: 'windshear', impact: 'slash',
        effects: [{ type: 'damage', mult: 1.7 }],
      },
    ],
    passive: {
      name: 'Blade Dance',
      description: 'Gains +15% SPD for 1 turn at the start of each turn.',
      hooks: {
        onTurnStart(unit) {
          unit.addStatusEffect({ kind: 'buff', stat: 'speed', mult: 1.15, turns: 1 });
          return {
            label: 'Blade Dance',
            message: `${unit.name} flows into the next stance (+15% SPD).`,
            floats: [{ target: unit, text: 'SPD ▲', color: '#8ad8ff' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.2,
      description: 'Duelist: +20% ATK while in a front hex.',
    },
  },

  sir_pixel: {
    id: 'sir_pixel',
    name: 'Sir Pixel',
    title: 'Errant Knight',
    rarity: 4,
    stats: { hp: 1400, atk: 220, def: 140, speed: 100 },
    tint: { body: '#4a6fd4', helm: '#8d9bb8', shield: '#b8862e' },
    sprite: defaultSprite('sir_pixel'),
    abilities: [
      {
        id: 'valiant_strike', name: 'Valiant Strike',
        description: 'Slash one enemy for 100% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.0 }],
      },
      {
        id: 'shield_bash', name: 'Shield Bash',
        description: 'Bash one enemy for 140% ATK and lower its DEF by 30% for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.4 },
          { type: 'debuff', stat: 'def', mult: 0.7, turns: 2 },
        ],
      },
      {
        id: 'judgement', name: 'Radiant Judgement',
        description: 'Smite ALL enemies for 90% ATK and raise own DEF by 40% for 2 turns.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.9 }],
        selfEffects: [{ type: 'buff', stat: 'def', mult: 1.4, turns: 2 }],
      },
    ],
    passive: regenPassive('Second Wind', 0.04),
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.25,
      description: 'Vanguard: +25% DEF while in a front hex.',
    },
  },

  cindra: {
    id: 'cindra',
    name: 'Cindra',
    title: 'Ember Witch',
    rarity: 4,
    stats: { hp: 1150, atk: 260, def: 95, speed: 105 },
    tint: { body: '#a83a3a', helm: '#d86a3a', weapon: '#ffc84a', shield: '#7a2a2a' },
    sprite: defaultSprite('cindra'),
    abilities: [
      {
        id: 'ember_bolt', name: 'Ember Bolt',
        description: 'Scorch one enemy for 100% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.0 }],
      },
      {
        id: 'flame_lash', name: 'Flame Lash',
        description: 'Lash one enemy for 130% ATK and lower its ATK by 25% for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
          { type: 'debuff', stat: 'atk', mult: 0.75, turns: 2 },
        ],
      },
      {
        id: 'inferno', name: 'Inferno',
        description: 'Engulf ALL enemies for 110% ATK.',
        cooldown: 6, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.1 }],
      },
    ],
    passive: {
      name: 'Rising Heat',
      description: 'Below 50% HP, gains +20% ATK for 1 turn at turn start.',
      hooks: {
        onTurnStart(unit) {
          if (unit.hp / unit.maxHp >= 0.5) return null;
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.2, turns: 1 });
          return {
            label: 'Rising Heat',
            message: `${unit.name} burns hotter (+20% ATK this turn).`,
            floats: [{ target: unit, text: 'ATK ▲', color: '#ff9a5a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.BACK, stat: 'atk', mult: 1.25,
      description: 'Long Fuse: +25% ATK while in a back hex.',
    },
  },

  vex: {
    id: 'vex',
    name: 'Vex',
    title: 'Shadowblade',
    rarity: 4,
    stats: { hp: 1050, atk: 270, def: 85, speed: 125 },
    tint: { body: '#3a3a4a', helm: '#5a5a7a', skin: '#c8a88a', weapon: '#9a8aff' },
    sprite: defaultSprite('vex'),
    abilities: [
      {
        id: 'shadow_cut', name: 'Shadow Cut',
        description: 'Cut one enemy for 105% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.05 }],
      },
      {
        id: 'hamstring', name: 'Hamstring',
        description: 'Strike for 120% ATK and lower the target\'s SPD by 30% for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.2 },
          { type: 'debuff', stat: 'speed', mult: 0.7, turns: 2 },
        ],
      },
      {
        id: 'deathmark', name: 'Deathmark',
        description: 'Ambush one enemy for 220% ATK.',
        cooldown: 6, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 2.2 }],
      },
    ],
    passive: {
      name: 'Shadow Veil',
      description: 'While in a back hex, gains +25% DEF for 1 turn at turn start.',
      hooks: {
        onTurnStart(unit) {
          if (!unit.slot || unit.slot.position !== POSITION.BACK) return null;
          unit.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.25, turns: 1 });
          return {
            label: 'Shadow Veil',
            message: `${unit.name} melts into shadow (+25% DEF this turn).`,
            floats: [{ target: unit, text: 'DEF ▲', color: '#9a8aff' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'atk', mult: 1.2,
      description: 'First Blood: +20% ATK while in a front hex.',
    },
  },

  // ---- 5★ ---------------------------------------------------------------

  zephyra: {
    id: 'zephyra',
    name: 'Zephyra',
    title: 'Stormcaller',
    rarity: 5,
    stats: { hp: 1350, atk: 300, def: 110, speed: 115 },
    tint: { body: '#3a6a8a', helm: '#8ad8ff', weapon: '#ffe86a', shield: '#2a4a6a' },
    sprite: defaultSprite('zephyra'),
    abilities: [
      {
        id: 'spark', name: 'Spark',
        description: 'Shock one enemy for 100% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.0 }],
      },
      {
        id: 'chain_lightning', name: 'Chain Lightning',
        description: 'Blast ALL enemies for 75% ATK.',
        cooldown: 3, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'damage', mult: 0.75 }],
      },
      {
        id: 'tempest', name: 'Tempest',
        description: 'Unleash the storm: 130% ATK to ALL enemies, -20% SPD for 2 turns.',
        cooldown: 7, targeting: 'all-enemies', animation: 'attack',
        effects: [
          { type: 'damage', mult: 1.3 },
          { type: 'debuff', stat: 'speed', mult: 0.8, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Static Charge',
      description: 'Zaps a random enemy for 25% ATK at the start of each turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const enemies = battle.livingUnits(unit.enemyTeam());
          if (enemies.length === 0) return null;
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const dmg = Abilities.damageFormula(
            unit.effectiveStat('atk') * 0.25, target.effectiveStat('def'));
          target.takeDamage(dmg);
          return {
            label: 'Static Charge',
            message: `${unit.name}'s Static Charge zaps ${target.name} for ${dmg}.`,
            floats: [{ target, text: `-${dmg}`, color: '#ffe86a' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.CENTER, stat: 'atk', mult: 1.3,
      description: 'Eye of the Storm: +30% ATK while in the center hex.',
    },
  },

  aurelius: {
    id: 'aurelius',
    name: 'Aurelius',
    title: 'Dawn Paladin',
    rarity: 5,
    stats: { hp: 1800, atk: 230, def: 180, speed: 90 },
    tint: { body: '#c8a83a', helm: '#ffe8a8', shield: '#e8e8f0', weapon: '#fff8d8' },
    sprite: defaultSprite('aurelius'),
    abilities: [
      {
        id: 'dawn_strike', name: 'Dawn Strike',
        description: 'Strike one enemy for 100% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.0 }],
      },
      {
        id: 'consecrate', name: 'Consecrate',
        description: 'Heal one ally for 100% ATK and raise their DEF by 25% for 2 turns.',
        cooldown: 3, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'heal', mult: 1.0 },
          { type: 'buff', stat: 'def', mult: 1.25, turns: 2 },
        ],
      },
      {
        id: 'aegis_of_dawn', name: 'Aegis of Dawn',
        description: 'Heal ALL allies for 60% ATK and raise their DEF by 30% for 2 turns.',
        cooldown: 7, targeting: 'all-allies', animation: 'attack',
        effects: [
          { type: 'heal', mult: 0.6 },
          { type: 'buff', stat: 'def', mult: 1.3, turns: 2 },
        ],
      },
    ],
    passive: {
      name: "Guardian's Aegis",
      description: 'Grants ALL allies +10% DEF for 1 turn at the start of each turn.',
      hooks: {
        onTurnStart(unit, battle) {
          const allies = battle.livingUnits(unit.team);
          allies.forEach((u) =>
            u.addStatusEffect({ kind: 'buff', stat: 'def', mult: 1.1, turns: 1 }));
          return {
            label: "Guardian's Aegis",
            message: `${unit.name}'s aegis shields the team (+10% DEF this turn).`,
            floats: [{ target: unit, text: 'DEF ▲', color: '#ffe8a8' }],
          };
        },
      },
    },
    positional: {
      position: POSITION.FRONT, stat: 'def', mult: 1.3,
      description: 'Dawnguard: +30% DEF while in a front hex.',
    },
  },
};
