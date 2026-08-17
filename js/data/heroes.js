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
        description: 'Leap to an enemy and slash clean through for 100% ATK.',
        // Slash impact rotated flat and mirrored vertically so the sweep
        // reads bottom-left to bottom-right, following the sword tip.
        cooldown: 0, targeting: 'enemy', animation: 'jumpslash', impact: 'slash',
        impactRotate: -64, impactFlipY: true,
        effects: [{ type: 'damage', mult: 1.0 }],
      },
      {
        id: 'crystal_resonance', name: 'Crystal Resonance',
        description: 'Attune to the blade: +50% crit chance and +50% crit damage for 3 turns.',
        cooldown: 5, targeting: 'self', animation: 'buff',
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

  vivian: {
    id: 'vivian',
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
        description: 'Heal an ally for 10% of Vivian\'s max HP — 20% if they hold a front hex.',
        cooldown: 0, targeting: 'ally', animation: 'cast', impact: 'heal_green',
        effects: [{ type: 'healHpPct', pct: 0.10, frontPct: 0.20 }],
      },
      {
        id: 'thicket_blessing', name: 'Thicket Blessing',
        description: 'Bless the entire front row with regrowth: heal 5% of Vivian\'s max HP per turn for 4 turns.',
        cooldown: 5, targeting: 'front-allies', animation: 'cast', impact: 'heal_green',
        effects: [{ type: 'hot', pct: 0.05, turns: 4 }],
      },
      {
        id: 'briar_burst', name: 'Briar Burst',
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
    name: 'Vex',
    title: 'Doll Witch',
    rarity: 4,
    stats: { hp: 1250, atk: 200, def: 105, speed: 115 },
    tint: { body: '#5a3a7a', helm: '#7a4a9a', weapon: '#c8a86a', shield: '#3a2a4a' },
    sprite: {
      displayH: 50, // scaled down for her crouched pose
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
        description: 'Stab the doll: 90% ATK to one enemy and -15% ATK for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'strike_purple',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'debuff', stat: 'atk', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'creeping_malaise', name: 'Creeping Malaise',
        description: 'Curse ALL enemies: -25% DEF and -15% SPD for 2 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'cast', impact: 'strike_purple',
        effects: [
          { type: 'debuff', stat: 'def', mult: 0.75, turns: 2 },
          { type: 'debuff', stat: 'speed', mult: 0.85, turns: 2 },
        ],
      },
      {
        id: 'doom_mark', name: 'Doom Mark',
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

  coral: {
    id: 'coral',
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
        description: 'Strike one enemy with a surging wave for 110% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.1 }],
      },
      {
        id: 'undertow', name: 'Undertow',
        description: 'Drag the enemy back row under for 90% ATK.',
        cooldown: 6, targeting: 'back-enemies', animation: 'attack', impact: 'strike',
        effects: [{ type: 'damage', mult: 0.9 }],
      },
      {
        id: 'maelstrom_spear', name: 'Maelstrom Spear',
        description: 'Skewer one enemy with a focused torrent for 240% ATK.',
        cooldown: 7, targeting: 'enemy', animation: 'attack3', impact: 'strike',
        effects: [{ type: 'damage', mult: 2.4 }],
      },
    ],
    passive: {
      name: 'Riptide',
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
