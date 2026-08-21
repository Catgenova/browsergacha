// Human heroes (7). Registered into the shared
// HEROES table declared in js/data/heroes.js.

Object.assign(HEROES, {

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
        description: 'Begins battle with 6 crystal mirrors. Every hit she takes shatters one mirror, reflecting 25% of the damage back at the attacker.',
        hooks: {},
      },
      // The front-hex mirror reform lives here rather than in the
      // passive: where she stands is the positional's business.
      positional: {
        id: 'resonance',
        position: POSITION.FRONT,
        name: 'Resonance',
        description: 'Front hex: reforms 1 crystal mirror at the start of her turn.',
        hooks: {
          onTurnStart(unit) {
            const gained = unit.addMirrors(1);
            if (gained <= 0) return null;
            return {
              label: 'Resonance',
              message: `${unit.name} reforms a crystal mirror.`,
              floats: [{ target: unit, text: '◆ +1', color: '#8ee8ff' }],
            };
          },
        },
      },
    };
  })(),

  // Toll: a Light bulwark whose whole kit is priced in DEF. He does not
  // trade blows so much as charge for them — every hit he survives rings
  // the bell, spraying the enemy formation and mending his own line.
  toll: {
    id: 'toll',
    element: 'light',
    name: 'Toll',
    title: 'Bellringer of Reverence',
    rarity: 5,
    // Slow and enormously thick: the retaliation is the damage, so the
    // statline pays for staying upright rather than for acting often.
    stats: { hp: 2650, atk: 96, def: 300, speed: 84 },
    tint: { body: '#c8c0a8', helm: '#f0e8c8', weapon: '#ffe9a8', shield: '#d8c070' },
    // Every sheet is 256px square frames: 9 across, except the death at
    // 11. Skills 1 and 2 share one strip — both are the same swing of the
    // bell, near or wide — so skill 2 plays 'attack' too.
    sprite: {
      displayH: 92,
      strips: {
        idle:   { src: 'assets/heroes/Toll/tollidle.png', frames: 9, fps: 5, loop: true },
        idle2:  { src: 'assets/heroes/Toll/tollidle1.png', frames: 9, fps: 6, loop: false,
                  variantOf: 'idle', every: [8, 15] },
        idle3:  { src: 'assets/heroes/Toll/tollidle2.png', frames: 9, fps: 6, loop: false,
                  variantOf: 'idle', every: [8, 15] },
        ready:  { src: 'assets/heroes/Toll/tollready.png', frames: 9, fps: 6, loop: true },
        attack: { src: 'assets/heroes/Toll/tollskill1n2.png', frames: 9, fps: 10, loop: false,
                  hitFrame: 8 },
        skill3: { src: 'assets/heroes/Toll/tollskill3.png', frames: 9, fps: 10, loop: false,
                  hitFrame: 8 },
        death:  { src: 'assets/heroes/Toll/tolldeath.png', frames: 11, fps: 9, loop: false,
                  freeze: true },
      },
    },
    abilities: [
      {
        id: 'first_toll', name: 'First Toll',
        icon: 'assets/icons/fc305.png',
        description: 'Ring the bell over the front line: 50% DEF to every front-hex enemy.',
        cooldown: 0, targeting: 'front-enemies', animation: 'attack',
        effects: [{ type: 'damageDef', mult: 0.5 }],
      },
      {
        id: 'full_peal', name: 'Full Peal',
        icon: 'assets/icons/fc306.png',
        description: 'The peal carries across the field: 50% DEF to ALL enemies.',
        cooldown: 3, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'damageDef', mult: 0.5 }],
      },
      {
        id: 'the_reckoning', name: 'The Reckoning',
        icon: 'assets/icons/fc307.png',
        description: 'Call in the debt: ALL enemies lose 30% DEF and 30% ATK for 2 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'skill3',
        effects: [
          { type: 'debuff', stat: 'def', mult: 0.7, turns: 2 },
          { type: 'debuff', stat: 'atk', mult: 0.7, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Every Blow Answered',
      icon: 'assets/icons/fc308.png',
      description: 'Each time Toll is struck and survives, the bell rings: 10% of his DEF to ALL enemies.',
      hooks: {
        onStruck(unit, { battle }) {
          const foes = battle.livingUnits(
            unit.team === TEAM.PLAYER ? TEAM.ENEMY : TEAM.PLAYER);
          if (!foes.length) return null;
          // The raw figure; each foe's DEF, guards and dodge decide what
          // it actually costs them, and strike() books the meter.
          const raw = Math.max(1, Math.round(unit.effectiveStat('def') * 0.10));
          let felled = 0;
          let total = 0;
          for (const foe of foes) {
            const res = Abilities.strike(unit, foe, raw);
            total += res.amount;
            if (res.amount > 0) battle.addFloatingText(foe, `-${res.amount}`, '#ffe9a8');
            if (!foe.alive) felled++;
          }
          if (total <= 0) return null;
          battle.log(`${unit.name} is struck \u2014 the bell answers for ${total} across the field.` +
            (felled ? ` ${felled} fall!` : ''), 'log-system');
          return null; // resolved inline; the turn belongs to the attacker
        },
      },
    },
    // Where he stands decides who the ringing mends, so the ward is the
    // positional's business rather than the passive's.
    positional: {
      id: 'tolling_ward',
      position: POSITION.FRONT,
      name: 'Tolling Ward',
      description: 'Front hex: each time Toll is struck and survives, the whole party mends 5% of his DEF.',
      hooks: {
        onStruck(unit, { battle }) {
          const mend = Math.max(1, Math.round(unit.effectiveStat('def') * 0.05));
          let total = 0;
          for (const ally of battle.livingUnits(unit.team)) {
            const healed = ally.heal(mend, unit);
            if (healed > 0) {
              total += healed;
              battle.addFloatingText(ally, `+${healed}`, '#7ae87a');
            }
          }
          if (total <= 0) return null;
          battle.log(`${unit.name}'s ward answers the blow \u2014 ${total} HP across the party.`,
            'log-system');
          return null;
        },
      },
    },
  },

  // ---- 4★ ------------------------------------------------------------------

  // Catherine: a Light paladin-support. Flail attacker up front, triage
  // healer for the party's three most-wounded, and a front-line war cry
  // that she delivers hovering off the ground.

  catherine: {
    id: 'catherine',
    element: 'light',
    name: 'Catherine',
    title: 'White Paladin of Reverence',
    rarity: 4,
    stats: { hp: 1700, atk: 200, def: 160, speed: 98 },
    tint: { body: '#e8e4dc', helm: '#f0ece0', weapon: '#c8b88a', skin: '#e8c0a0' },
    sprite: {
      displayH: 90,
      strips: {
        idle:  { src: 'assets/heroes/Catherine/catherineidle.png', frames: 9, fps: 5, loop: true },
        // Timed fidgets while she idles: flail adjust, then a short prayer.
        idle2: { src: 'assets/heroes/Catherine/catherineidle1.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Catherine/catherineidle2.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        ready: { src: 'assets/heroes/Catherine/catherineready.png', frames: 9, fps: 6, loop: true },
        // Flail swing — the head connects on frame 9.
        attack: { src: 'assets/heroes/Catherine/catherineskill1.png', frames: 10, fps: 11,
                  loop: false, hitFrame: 9 },
        // Consecration: the light crests around frame 9, when the heal lands.
        heal:  { src: 'assets/heroes/Catherine/catherineskill2.png', frames: 15, fps: 12,
                 loop: false, hitFrame: 9, holds: { 9: 2 } },
        // Ascendant war cry: she lifts off after frame 4, hangs in the
        // light, and settles back down over the last four frames.
        skill3: { src: 'assets/heroes/Catherine/catherineskill3.png', frames: 15, fps: 12,
                  loop: false, hitFrame: 9, holds: { 9: 2, 10: 2 },
                  motion: [
                    { frames: [1, 4],   from: 'origin',      to: 'origin' },
                    { frames: [5, 8],   from: 'origin',      to: 'originHover' },
                    { frames: [9, 11],  from: 'originHover', to: 'originHover' },
                    { frames: [12, 15], from: 'originHover', to: 'origin' },
                  ] },
        death: { src: 'assets/heroes/Catherine/catherinedeath.png', frames: 9, fps: 7,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'reverent_strike', name: 'Reverent Strike',
        icon: 'assets/icons/fc1236.png',
        description: 'Swing the flail at a single enemy for 120% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack',
        effects: [{ type: 'damage', mult: 1.2 }],
      },
      {
        id: 'consecrated_mercy', name: 'Consecrated Mercy',
        icon: 'assets/icons/fc681.png',
        description: 'Heal herself and the 2 most-wounded allies for 30% ATK each.',
        cooldown: 3, targeting: 'self-and-wounded-allies', allyCount: 2,
        animation: 'heal',
        effects: [{ type: 'heal', mult: 0.3 }],
      },
      {
        id: 'ascendant_creed', name: 'Ascendant Creed',
        icon: 'assets/icons/fc940.png',
        description: 'Rise into the light: the front line gains +30% ATK and +30% DEF for 3 turns.',
        cooldown: 5, targeting: 'front-allies', animation: 'skill3',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.3, turns: 3 },
          { type: 'buff', stat: 'def', mult: 1.3, turns: 3 },
        ],
      },
    ],
    passive: {
      name: 'Vow of Reverence',
      icon: 'assets/icons/fc718.png',
      description: 'Any ally restored to health is shielded: +12% DEF for 2 turns.',
      hooks: {
        onAllyHealed(unit, healedUnit) {
          if (!healedUnit.alive) return null;
          if (healedUnit.statusEffects.some((fx) => fx.stat === 'def' && fx.reverence)) {
            return null; // already warded — don't stack every tick
          }
          healedUnit.addStatusEffect({
            kind: 'buff', stat: 'def', mult: 1.12, turns: 2, reverence: true,
          });
          return { floats: [{ target: healedUnit, text: 'WARD ▲', color: '#ffe8a8' }] };
        },
      },
    },
    positional: POSITIONALS.iron_wake,
  },

  // ---- 1★ rat cohort ------------------------------------------------------
  // Idle-only art for now; attack/ready/death strips will be added later
  // (attacks gracefully hold idle until then).

  florence: {
    id: 'florence',
    element: 'water',
    name: 'Tide',
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
    positional: POSITIONALS.last_stand,
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
    positional: POSITIONALS.field_medic,
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
    positional: POSITIONALS.hexweaver,
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
        description: 'Bathe one ally in light, healing 100.6% ATK.',
        cooldown: 0, targeting: 'ally', animation: 'cast', impact: 'heal_gold',
        effects: [{ type: 'heal', mult: 1.006 }],
      },
      {
        id: 'purifying_chorus', name: 'Purifying Chorus',
        icon: 'assets/icons/fc1046.png',
        description: 'Heal ALL allies for 61.9% ATK and cleanse their debuffs.',
        cooldown: 5, targeting: 'all-allies', animation: 'cast2', impact: 'heal_gold',
        effects: [
          { type: 'heal', mult: 0.619 },
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
    positional: POSITIONALS.press_the_flank,
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
    positional: POSITIONALS.drain_the_line,
  },

  javarious: {
    id: 'javarious',
    element: 'light',
    name: 'Javarious',
    title: 'Unbroken Dawn',
    rarity: 5,
    // A front-line carry whose damage is conditional on being untouched,
    // which is a contradiction until you read the shield: absorbed damage
    // never reaches HP, so a shielded Javarious is a FULL-HEALTH
    // Javarious. The shield is the win condition, not the safety net.
    stats: { hp: 1650, atk: 258, def: 125, speed: 110 },
    tint: { body: '#f0e8d8', helm: '#e8c060', weapon: '#7ae8d8', shield: '#e8c060', skin: '#8a5a3a' },
    // 256px square frames: 9 across, except skill 3 at 14 and the death
    // at 17. Four idles -- the base loop and three fidgets.
    sprite: {
      displayH: 90,
      // Authored facing left, every strip. Flagged rather than mirrored
      // into the files: the art is the artist's, and the flag is what it
      // is for -- Sprites.facesLeft() is honoured by the board, the team
      // screen, the dossier and the roster portraits alike.
      faceLeft: true,
      strips: {
        idle:   { src: 'assets/heroes/Javarious/javariousidle.png', frames: 9, fps: 5, loop: true },
        idle2:  { src: 'assets/heroes/Javarious/javariousidle1.png', frames: 9, fps: 6, loop: false,
                  variantOf: 'idle', every: [8, 15] },
        idle3:  { src: 'assets/heroes/Javarious/javariousidle2.png', frames: 9, fps: 6, loop: false,
                  variantOf: 'idle', every: [8, 15] },
        idle4:  { src: 'assets/heroes/Javarious/javariousidle3.png', frames: 9, fps: 6, loop: false,
                  variantOf: 'idle', every: [8, 15] },
        ready:  { src: 'assets/heroes/Javarious/javariousready.png', frames: 9, fps: 6, loop: true },
        attack: { src: 'assets/heroes/Javarious/javariousskill1.png', frames: 9, fps: 12, loop: false,
                  hitFrame: 7 },
        skill2: { src: 'assets/heroes/Javarious/javariousskill2.png', frames: 9, fps: 9, loop: false,
                  hitFrame: 4 },
        skill3: { src: 'assets/heroes/Javarious/javariousskill3.png', frames: 14, fps: 12, loop: false,
                  hitFrame: 12 },
        death:  { src: 'assets/heroes/Javarious/javariousdeath.png', frames: 17, fps: 10, loop: false,
                  freeze: true },
      },
    },
    abilities: [
      {
        id: 'unbroken_cut', name: 'Unbroken Cut',
        icon: 'assets/icons/fc1045.png',
        description: 'A clean cut for 155% ATK. While Javarious is at full health, it lands for double.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'strike',
        effects: [{ type: 'damage', mult: 1.55, bonusWhen: { state: 'fullHp', mult: 2 } }],
      },
      {
        id: 'dawn_reliquary', name: 'Dawn Reliquary',
        icon: 'assets/icons/fc1043.png',
        description: 'Plant the blade and take the light in: heal 20% ATK and raise a shield worth 30% ATK for 3 turns.',
        cooldown: 3, targeting: 'self', animation: 'skill2',
        effects: [
          { type: 'heal', mult: 0.2 },
          { type: 'shield', mult: 0.3, turns: 3 },
        ],
      },
      {
        id: 'daybreak_sweep', name: 'Daybreak Sweep',
        icon: 'assets/icons/fc1048.png',
        description: 'Sweep the whole enemy front rank for 140% ATK. While Javarious is at full health, it lands for double.',
        cooldown: 4, targeting: 'front-enemies', animation: 'skill3',
        effects: [{ type: 'damage', mult: 1.4, bonusWhen: { state: 'fullHp', mult: 2 } }],
      },
    ],
    passive: {
      name: 'Light Kept In',
      icon: 'assets/icons/fc1040.png',
      description: 'At the start of his turn, Javarious mends 5% of whatever shield is still standing.',
      hooks: {
        onTurnStart(unit) {
          const shield = unit.shieldTotal();
          if (shield <= 0 || unit.hp >= unit.maxHp) return null;
          const healed = unit.heal(Math.max(1, Math.round(shield * 0.05)), unit);
          if (healed <= 0) return null;
          return {
            label: 'Light Kept In',
            message: `${unit.name} draws ${healed} HP out of the light he is holding.`,
            floats: [{ target: unit, text: `+${healed}`, color: '#7ae8d8' }],
          };
        },
      },
    },
    // The shield is what keeps him at full health, and it is built out of
    // his own damage -- so the hex that puts him in reach of the enemy is
    // the hex that pays for staying untouched there.
    positional: {
      id: 'gathering_dawn',
      position: POSITION.FRONT,
      name: 'Gathering Dawn',
      description: 'Front hex: every blow Javarious lands adds 10% of its damage to his shield.',
      hooks: {
        onDealtDamage(unit, { amount }) {
          const gain = Math.round(amount * 0.10);
          if (gain <= 0) return;
          unit.addShield(gain, 3, unit);
        },
      },
    },
  },

});
