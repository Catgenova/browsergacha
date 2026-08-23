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
        // Long flail strike: eight frames of wind-up spin, the head
        // flies out over 9-13 and connects on 12, then the recovery.
        attack: { src: 'assets/heroes/Catherine/catherineskill1.png', frames: 17, fps: 13,
                  loop: false, hitFrame: 12 },
        // Consecration: the radiance builds from a spark and crests at
        // frame 7, when the heal lands; the halo burns through 9.
        heal:  { src: 'assets/heroes/Catherine/catherineskill2.png', frames: 9, fps: 10,
                 loop: false, hitFrame: 7, holds: { 9: 2 } },
        // Reverent Sweep: the same spin-up, then the flail whirls into a
        // radial burst on 11-12 (the sweep lands there) and trails a
        // long arc through the recovery.
        skill3: { src: 'assets/heroes/Catherine/catherineskill3.png', frames: 17, fps: 13,
                  loop: false, hitFrame: 12, holds: { 12: 2 } },
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
        id: 'reverent_sweep', name: 'Reverent Sweep',
        icon: 'assets/icons/fc940.png',
        description: 'Sweep the flail through the enemy front line for 150% ATK.',
        cooldown: 5, targeting: 'front-enemies', animation: 'skill3',
        impact: 'slash',
        effects: [{ type: 'damage', mult: 1.5 }],
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

  leonardo: {
    id: 'leonardo',
    element: 'light',
    name: 'Leonardo',
    title: 'Herald of Reverence',
    rarity: 3,
    stats: { hp: 1450, atk: 160, def: 145, speed: 106 },
    tint: { body: '#d8d0c0', helm: '#e8d898', weapon: '#f0e0a8', skin: '#e0b898' },
    sprite: {
      displayH: 90,
      strips: {
        idle:  { src: 'assets/heroes/Leonardo/leonardoidle.png', frames: 9, fps: 5, loop: true },
        // Timed fidgets while he idles: two short ceremonial flourishes.
        idle2: { src: 'assets/heroes/Leonardo/leonardoidle1.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Leonardo/leonardoidle2.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        // His three proclamations: each buff lands as the gesture crests.
        skill1: { src: 'assets/heroes/Leonardo/leonardoskill1.png', frames: 9, fps: 10,
                  loop: false, hitFrame: 6 },
        skill2: { src: 'assets/heroes/Leonardo/leonardoskill2.png', frames: 9, fps: 10,
                  loop: false, hitFrame: 6 },
        skill3: { src: 'assets/heroes/Leonardo/leonardoskill3.png', frames: 9, fps: 10,
                  loop: false, hitFrame: 6 },
        death: { src: 'assets/heroes/Leonardo/leonardodeath.png', frames: 9, fps: 7,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'processional', name: 'Processional',
        icon: 'assets/icons/fc885.png',
        description: 'The herald sets the pace: ALL allies gain +25% SPD for 2 turns.',
        cooldown: 0, targeting: 'all-allies', animation: 'skill1',
        effects: [{ type: 'buff', stat: 'speed', mult: 1.25, turns: 2 }],
      },
      {
        id: 'call_to_arms', name: 'Call to Arms',
        icon: 'assets/icons/fc868.png',
        description: 'A ringing proclamation: ALL allies gain +30% ATK for 2 turns.',
        cooldown: 3, targeting: 'all-allies', animation: 'skill2',
        effects: [{ type: 'buff', stat: 'atk', mult: 1.3, turns: 2 }],
      },
      {
        id: 'rite_of_absolution', name: 'Rite of Absolution',
        icon: 'assets/icons/fc855.png',
        description: 'Absolve the party: removes up to 2 debuffs from every ally.',
        cooldown: 4, targeting: 'all-allies', animation: 'skill3',
        effects: [{ type: 'cleanse', count: 2 }],
      },
    ],
    passive: {
      name: 'Exalted Rebuke',
      icon: 'assets/icons/fc862.png',
      description: 'Carrying 3 or more buffs at the start of his turn, the ' +
        'herald rebukes the readiest enemy: -20% turn meter.',
      hooks: {
        onTurnStart(unit, battle) {
          if (!battle) return null;
          const buffs = unit.statusEffects.filter((fx) => fx.kind === 'buff').length;
          if (buffs < 3) return null;
          const foes = battle.livingUnits().filter((u) => u.team !== unit.team);
          if (!foes.length) return null;
          const target = foes.sort((a, b) => b.turnMeter - a.turnMeter)[0];
          target.turnMeter = Math.max(0,
            target.turnMeter - CONFIG.TURN_METER_MAX * 0.2);
          return {
            label: 'Exalted Rebuke',
            message: `${unit.name}'s rebuke stalls ${target.name} — 20% turn meter lost.`,
            floats: [{ target, text: 'AP ▼', color: '#f0e0a8' }],
          };
        },
      },
    },
    positional: POSITIONALS.warding_circle,
  },

  oak: {
    id: 'oak',
    element: 'light',
    name: 'Oak',
    title: 'Confessor of Reverence',
    rarity: 4,
    stats: { hp: 1450, atk: 230, def: 130, speed: 100 },
    tint: { body: '#8a7a5a', helm: '#c8b078', weapon: '#e8d8a0', skin: '#d8b090' },
    sprite: {
      displayH: 90,
      strips: {
        idle:  { src: 'assets/heroes/Oak/oakidle.png', frames: 9, fps: 5, loop: true },
        // Timed fidgets while he idles. (The first strip's filename
        // carries an upstream typo — 'ilde' — kept as uploaded.)
        idle2: { src: 'assets/heroes/Oak/oakilde1.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Oak/oakidle2.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        // The confession cycle: each rite lands mid-swing.
        attack: { src: 'assets/heroes/Oak/oakskill1.png', frames: 9, fps: 12,
                  loop: false, hitFrame: 6 },
        skill2: { src: 'assets/heroes/Oak/oakskill2.png', frames: 9, fps: 12,
                  loop: false, hitFrame: 6 },
        skill3: { src: 'assets/heroes/Oak/oakskill3.png', frames: 7, fps: 10,
                  loop: false, hitFrame: 5 },
        death: { src: 'assets/heroes/Oak/oakdeath.png', frames: 9, fps: 7,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'oak_confession', name: 'Confession',
        icon: 'assets/icons/fc746.png',
        description: 'A measured strike for 110% ATK — 20% chance to chain ' +
          'straight into Penance.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [{ type: 'damage', mult: 1.1 }],
        chain: { id: 'oak_penance', chance: 0.2 },
      },
      {
        id: 'oak_penance', name: 'Penance',
        icon: 'assets/icons/fc767.png',
        description: 'A punishing blow for 150% ATK — 25% chance to chain ' +
          'straight into Absolution.',
        cooldown: 3, targeting: 'enemy', animation: 'skill2', impact: 'slash',
        effects: [{ type: 'damage', mult: 1.5 }],
        chain: { id: 'oak_absolution', chance: 0.25 },
      },
      {
        id: 'oak_absolution', name: 'Absolution',
        icon: 'assets/icons/fc730.png',
        description: 'The final rite: 175% ATK — 30% chance to begin the ' +
          'cycle again with Confession.',
        cooldown: 5, targeting: 'enemy', animation: 'skill3', impact: 'slash',
        effects: [{ type: 'damage', mult: 1.75 }],
        chain: { id: 'oak_confession', chance: 0.3 },
      },
    ],
    passive: {
      name: "Confessor's Riposte",
      icon: 'assets/icons/fc882.png',
      description: 'When Oak dodges an attack, he has a 50% chance to answer ' +
        'with Confession on the spot.',
      hooks: {
        onDodge(unit, { attacker, battle }) {
          if (Math.random() >= 0.5) return;
          const foes = battle.livingUnits().filter((u) => u.team !== unit.team);
          const foe = attacker && attacker.alive ? attacker
            : foes[Math.floor(Math.random() * foes.length)];
          if (!foe) return;
          battle.log(`${unit.name} slips the blow and answers with Confession!`,
            unit.team === TEAM.PLAYER ? 'log-player' : 'log-enemy');
          Abilities.execute(unit.def.abilities[0], unit, foe, battle);
        },
      },
    },
    positional: POSITIONALS.ghost_step,
  },

  silas: {
    id: 'silas',
    element: 'light',
    name: 'Silas',
    title: 'Boltcaster of Reverence',
    rarity: 3,
    stats: { hp: 1150, atk: 250, def: 95, speed: 104 },
    tint: { body: '#c8bca0', helm: '#e8dcb8', weapon: '#f8f0c8', skin: '#d8b898' },
    sprite: {
      displayH: 90,
      strips: {
        idle:  { src: 'assets/heroes/Silas/silasidle.png', frames: 9, fps: 5, loop: true },
        // Timed fidgets while he idles. The first is a little spring off
        // the ground — the art tucks his feet on 6-8, and the hop arc
        // lifts him to match.
        idle2: { src: 'assets/heroes/Silas/silasidle1.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15], hop: { frames: [5, 9], height: 30 } },
        idle3: { src: 'assets/heroes/Silas/silasidle2.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        // Boltshot: the release snaps on frame 6.
        attack: { src: 'assets/heroes/Silas/silasskill1.png', frames: 9, fps: 12,
                  loop: false, hitFrame: 6 },
        // Lumen Arrow: the empowered line shot, loosed on frame 5.
        skill2: { src: 'assets/heroes/Silas/silasskill2.png', frames: 8, fps: 11,
                  loop: false, hitFrame: 5 },
        // Aiming Stance: he settles, draws, and holds — and KEEPS
        // holding: while the aiming status lasts, he stays on this
        // strip's final crouched frame instead of idling.
        skill3: { src: 'assets/heroes/Silas/silasskill3.png', frames: 9, fps: 10,
                  loop: false, hitFrame: 7, stanceHold: 'aiming' },
        death: { src: 'assets/heroes/Silas/silasdeath.png', frames: 9, fps: 7,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'silas_boltshot', name: 'Boltshot',
        icon: 'assets/icons/fc746.png',
        description: 'A snapped shot at one enemy for 115% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [{ type: 'damage', mult: 1.15 }],
      },
      {
        id: 'silas_lumen_arrow', name: 'Lumen Arrow',
        icon: 'assets/icons/fc1050.png',
        description: 'Loose a holy arrow through an enemy row for 200% ATK. ' +
          'Can only be fired from Aiming Stance.',
        cooldown: 3, targeting: 'enemy-row', animation: 'skill2', impact: 'slash',
        requires: 'aiming',
        effects: [{ type: 'damage', mult: 2.0 }],
      },
      {
        id: 'silas_aiming_stance', name: 'Aiming Stance',
        icon: 'assets/icons/fc882.png',
        description: 'Settle and draw: his next shot deals 100% extra damage. ' +
          'The stance holds until he shoots — or a direct hit lands on him.',
        cooldown: 2, targeting: 'self', animation: 'skill3',
        effects: [{ type: 'buff', stat: 'aiming', mult: 1, turns: 99 }],
      },
    ],
    passive: {
      name: 'Stillness of the Marksman',
      icon: 'assets/icons/fc793.png',
      description: 'While in Aiming Stance, Silas has a +25% chance to dodge ' +
        'attacks — and the stance doubles the shot it feeds.',
      hooks: {
        dodgeAdd(unit) {
          return unit.statusEffects.some((fx) => fx.stat === 'aiming') ? 0.25 : 0;
        },
        damageDealtMult(unit) {
          return unit.statusEffects.some((fx) => fx.stat === 'aiming') ? 2 : 1;
        },
      },
    },
    positional: POSITIONALS.dawn_piercer,
  },

  eli: {
    id: 'eli',
    element: 'light',
    name: 'Eli',
    title: 'Sigil of Reverence',
    rarity: 3,
    stats: { hp: 1150, atk: 245, def: 95, speed: 106 },
    tint: { body: '#b8ac88', helm: '#e0d4a8', weapon: '#f0e8c0', skin: '#d0a888' },
    sprite: {
      displayH: 90,
      strips: {
        // (Two filenames carry upstream quirks — the capital-E idle and
        // the transposed 'ile' fidget — kept exactly as uploaded.)
        idle:  { src: 'assets/heroes/Eli/Eliidle.png', frames: 9, fps: 5, loop: true },
        idle2: { src: 'assets/heroes/Eli/ileidle1.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Eli/eliidle2.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        // The sigils flare as each cast lands.
        attack: { src: 'assets/heroes/Eli/eliskill1.png', frames: 9, fps: 12,
                  loop: false, hitFrame: 6 },
        skill2: { src: 'assets/heroes/Eli/eliskill2.png', frames: 9, fps: 12,
                  loop: false, hitFrame: 6 },
        skill3: { src: 'assets/heroes/Eli/eliskill3.png', frames: 9, fps: 10,
                  loop: false, hitFrame: 6 },
        death: { src: 'assets/heroes/Eli/elideath.png', frames: 9, fps: 7,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'eli_sigil_bolt', name: 'Sigil Bolt',
        icon: 'assets/icons/fc1050.png',
        description: 'Brand one enemy for 100% ATK and cut their turn meter by 20%.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.0 },
          { type: 'turnMeter', amount: -0.20 },
        ],
      },
      {
        id: 'eli_sealing_glyph', name: 'Sealing Glyph',
        icon: 'assets/icons/fc862.png',
        description: 'Cast a glyph across the enemy BACK row: 90% ATK and ' +
          '-15% turn meter to each.',
        cooldown: 3, targeting: 'back-enemies', animation: 'skill2', impact: 'slash',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'turnMeter', amount: -0.15 },
        ],
      },
      {
        id: 'eli_quickening_sigil', name: 'Quickening Sigil',
        icon: 'assets/icons/fc885.png',
        description: 'Inscribe himself: +30% SPD and +25% Crit Chance for ' +
          '3 turns — then take another turn immediately.',
        cooldown: 5, targeting: 'self', animation: 'skill3', extraTurn: true,
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.3, turns: 3 },
          { type: 'buff', stat: 'critChance', add: 0.25, turns: 3 },
        ],
      },
    ],
    passive: {
      name: "Sigil's Judgment",
      icon: 'assets/icons/fc863.png',
      description: 'Deals 25% extra damage to enemies below half turn meter — ' +
        'the ones his sigils have already slowed.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.turnMeter < CONFIG.TURN_METER_MAX * 0.5
            ? 1.25 : 1;
        },
      },
    },
    positional: POSITIONALS.windrunner,
  },

  sawyer: {
    id: 'sawyer',
    element: 'dark',
    name: 'Sawyer',
    title: 'Blade of Shadowflower',
    rarity: 5,
    // Front-row carry money: the ATK line leads, the DEF line pays for
    // it, and Night Bloom is how he affords standing in the front hexes.
    stats: { hp: 1700, atk: 265, def: 120, speed: 104 },
    tint: { body: '#3a3448', helm: '#c8963a', weapon: '#8a4ae8', skin: '#d8a888' },
    // 256px square frames: 9 across, except the death at 8 and skill 3
    // at 15. Three idles — the base sway and two fidgets, the second a
    // full sword flourish with slash trails.
    sprite: {
      displayH: 90,
      strips: {
        idle:  { src: 'assets/heroes/Sawyer/sawyeridle.png', frames: 9, fps: 5, loop: true },
        idle2: { src: 'assets/heroes/Sawyer/sawyeridle1.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Sawyer/sawyeridle2.png', frames: 9, fps: 8, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        // The dark burst blooms around the target on frames 7-8.
        attack: { src: 'assets/heroes/Sawyer/sawyerskill1.png', frames: 9, fps: 12,
                  loop: false, hitFrame: 7 },
        // Blade charge — the sweep that lights the sword white.
        skill2: { src: 'assets/heroes/Sawyer/sawyerskill2.png', frames: 9, fps: 10,
                  loop: false },
        // Long windup into the horizontal skewer at frame 12.
        skill3: { src: 'assets/heroes/Sawyer/sawyerskill3.png', frames: 15, fps: 12,
                  loop: false, hitFrame: 12 },
        death: { src: 'assets/heroes/Sawyer/sawyerdeath.png', frames: 8, fps: 7,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'sawyer_petalfall_cut', name: 'Petalfall Cut',
        icon: 'assets/icons/fc1054.png',
        description: 'Carve one enemy for 150% ATK and scatter 2 random ' +
          'debuffs over them for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.5 },
          { type: 'randomDebuffs', count: 2, turns: 2 },
        ],
      },
      {
        id: 'sawyer_night_bloom', name: 'Night Bloom',
        icon: 'assets/icons/fc1053.png',
        description: 'Come into flower: +30% ATK, +30% DEF and +30% SPD ' +
          'for 3 turns.',
        cooldown: 3, targeting: 'self', animation: 'skill2',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.3, turns: 3 },
          { type: 'buff', stat: 'def', mult: 1.3, turns: 3 },
          { type: 'buff', stat: 'speed', mult: 1.3, turns: 3 },
        ],
      },
      {
        id: 'sawyer_deadheading', name: 'Deadheading',
        icon: 'assets/icons/fc1051.png',
        description: 'Run one enemy through for 230% ATK. A unit holding ' +
          'the CENTER hex takes 50% more — cut the central bloom first.',
        cooldown: 5, targeting: 'enemy', animation: 'skill3', impact: 'slash',
        effects: [
          { type: 'damage', mult: 2.3,
            bonusPosition: { position: 'center', mult: 1.5 } },
        ],
      },
    ],
    passive: {
      name: 'Wilting Garden',
      icon: 'assets/icons/fc1119.png',
      description: 'Deals 10% extra damage per debuff on the target ' +
        '(up to +30%) — flowers cut easiest once they droop.',
      hooks: {
        damageDealtMult(unit, target) {
          if (!target) return 1;
          const hexes = target.statusEffects.filter(
            (fx) => fx.kind === 'debuff' || fx.kind === 'dot').length;
          return 1 + 0.10 * Math.min(3, hexes);
        },
      },
    },
    positional: POSITIONALS.reckless_charge,
  },

  polarus: {
    id: 'polarus',
    element: 'water',
    name: 'Polarus',
    title: 'King of Cryst',
    rarity: 5,
    // A center-tile carry: the statline holds court rather than rushes.
    // The freezes are the throughput — every one refunds his cooldowns
    // from the Frost Throne.
    stats: { hp: 1800, atk: 255, def: 135, speed: 100 },
    tint: { body: '#e8e2d4', helm: '#7ad8e8', weapon: '#8ee8ff', skin: '#e8c8a8' },
    // 256px square frames: 9 across, except the death at 17. Three
    // idles — the regal sway, a beard stroke and a crown adjust.
    sprite: {
      displayH: 96,
      strips: {
        idle:  { src: 'assets/heroes/Polarus/polarusidle.png', frames: 9, fps: 5, loop: true },
        idle2: { src: 'assets/heroes/Polarus/polarusidle1.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Polarus/polarusidle2.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        // The ice bolt leaves his hand mid-strip.
        attack: { src: 'assets/heroes/Polarus/polarusskill1.png', frames: 9, fps: 12,
                  loop: false, hitFrame: 5 },
        // The whiteout into crystal form — rests on the crystalline pose.
        skill2: { src: 'assets/heroes/Polarus/polarusskill2.png', frames: 9, fps: 10,
                  loop: false, holds: { 8: 5 } },
        // The court-wide frost nova, crackling at frame 6.
        skill3: { src: 'assets/heroes/Polarus/polarusskill3.png', frames: 9, fps: 10,
                  loop: false, hitFrame: 6 },
        death: { src: 'assets/heroes/Polarus/polarusdeath.png', frames: 17, fps: 7,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'polarus_glacial_bolt', name: 'Glacial Bolt',
        icon: 'assets/icons/fc1011.png',
        description: 'Hurl a shard of court ice for 125% ATK, with a 30% ' +
          'chance to freeze the target solid — unable to act for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.25 },
          { type: 'freeze', chance: 0.30, turns: 2 },
        ],
      },
      {
        id: 'polarus_crystalline_mantle', name: 'Crystalline Mantle',
        icon: 'assets/icons/fc1016.png',
        description: 'Take on Crystalline form for 2 turns: enemies who ' +
          'strike him have a 30% chance to freeze solid on contact.',
        cooldown: 3, targeting: 'self', animation: 'skill2',
        effects: [
          { type: 'buff', stat: 'crystalline', mult: 1, turns: 2 },
        ],
      },
      {
        id: 'polarus_shatterfall', name: 'Shatterfall',
        icon: 'assets/icons/fc1014.png',
        description: 'Sweep the whole enemy team for 80% ATK — the frozen ' +
          'take 300% instead — then the ice shatters away.',
        cooldown: 5, targeting: 'all-enemies', animation: 'skill3', impact: 'slash',
        effects: [
          // 0.8 x 3.75 keeps the frozen payout at the specced 300%.
          { type: 'damage', mult: 0.8, bonusVs: { stat: 'freeze', mult: 3.75 } },
          { type: 'removeStatus', stat: 'freeze' },
        ],
      },
    ],
    passive: {
      name: "The King's Winter",
      icon: 'assets/icons/fc1010.png',
      description: 'Every hit he lands carries the cold: 5% chance to ' +
        'freeze the victim solid for 2 turns.',
      hooks: {
        onDealtDamage(unit, { target, battle }) {
          if (!target || !target.alive || target.team === unit.team) return;
          if (Math.random() >= 0.05) return;
          const r = Abilities.freeze(unit, target);
          if (battle && r && !r.resisted) {
            battle.addFloatingText(target, '❄ FROZEN', '#8ee8ff', true);
            battle.log(`${target.name} freezes solid in the king's winter ` +
              `(${r.turns} turns)!`, 'log-system');
          }
        },
      },
    },
    positional: POSITIONALS.frost_throne,
  },

  andrew: {
    id: 'andrew',
    element: 'water',
    name: 'Andrew',
    title: 'Casualty of Cryst',
    rarity: 3,
    // A center support who still swings a pick: the statline splits the
    // difference between hitting and holding the middle of the flower.
    stats: { hp: 1250, atk: 200, def: 120, speed: 98 },
    tint: { body: '#8a6a4a', helm: '#5a4632', weapon: '#b8b2c0', skin: '#d8a878' },
    // 256px square frames: 9 across on every strip. Three idles — the
    // shouldered pick, and two weary fidgets. (The skill 3 strip's
    // filename carries an upstream capital A, kept as uploaded.)
    sprite: {
      displayH: 90,
      strips: {
        idle:  { src: 'assets/heroes/Andrew/andrewidle.png', frames: 9, fps: 5, loop: true },
        idle2: { src: 'assets/heroes/Andrew/andrewidle1.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Andrew/andrewidle2.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        // The pick comes off the shoulder and lands mid-strip.
        attack: { src: 'assets/heroes/Andrew/andrewskill1.png', frames: 9, fps: 12,
                  loop: false, hitFrame: 6 },
        // Raising the pick as the crystals on his back glow.
        skill2: { src: 'assets/heroes/Andrew/andrewskill2.png', frames: 9, fps: 10,
                  loop: false },
        // The crystal spoil bursts across the back line on frame 7.
        skill3: { src: 'assets/heroes/Andrew/Andrewskill3.png', frames: 9, fps: 11,
                  loop: false, hitFrame: 7 },
        death: { src: 'assets/heroes/Andrew/andrewdeath.png', frames: 9, fps: 7,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'andrew_pickwork', name: 'Pickwork',
        icon: 'assets/icons/fc1044.png',
        description: 'A working swing for 110% ATK that knocks 15 action ' +
          'points off the target.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.1 },
          { type: 'turnMeter', amount: -0.15 },
        ],
      },
      {
        id: 'andrew_shore_up', name: 'Shore Up',
        icon: 'assets/icons/fc1099.png',
        description: 'Brace the whole team the way you brace a tunnel: ' +
          '+30% DEF for 2 turns.',
        cooldown: 3, targeting: 'all-allies', animation: 'skill2',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.3, turns: 2 },
        ],
      },
      {
        id: 'andrew_crystal_spoil', name: 'Crystal Spoil',
        icon: 'assets/icons/fc1013.png',
        description: 'Hurl a basketful of sharp spoil across the enemy ' +
          'BACK row for 90% ATK each.',
        cooldown: 4, targeting: 'back-enemies', animation: 'skill3', impact: 'slash',
        effects: [
          { type: 'damage', mult: 0.9 },
        ],
      },
    ],
    passive: {
      name: 'Two Masters',
      icon: 'assets/icons/fc1015.png',
      description: 'The court gives and the court takes: beside Aniani he ' +
        'swings +30% ATK harder; under Polarus he carries -30% DEF.',
      hooks: {
        onTurnStart(unit, battle) {
          if (!battle) return null;
          const mates = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (mates.some((u) => u.def && u.def.id === 'echo')) {
            unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.3, turns: 1 });
          }
          if (mates.some((u) => u.def && u.def.id === 'polarus')) {
            unit.addStatusEffect({ kind: 'debuff', stat: 'def', mult: 0.7, turns: 1 });
          }
          return null; // silent: it re-applies every turn
        },
      },
    },
    positional: POSITIONALS.undermine,
  },

  angelica: {
    id: 'angelica',
    element: 'water',
    name: 'Angelica',
    title: 'Crystcaster',
    rarity: 3,
    // A back-line caster who starts modest and compounds: every enemy
    // frozen anywhere in the fight adds another tenth to her ATK.
    stats: { hp: 1100, atk: 235, def: 90, speed: 102 },
    tint: { body: '#e8e4da', helm: '#f0ece2', weapon: '#7ae0e8', skin: '#e8c8a8' },
    // 256px square frames: 9 across, except the death at 17. Three
    // idles — the hooded sway and two crystal-flare fidgets.
    sprite: {
      displayH: 90,
      // Authored facing left; flagged rather than mirrored into the
      // files — Sprites.facesLeft() flips her right everywhere.
      faceLeft: true,
      strips: {
        idle:  { src: 'assets/heroes/Angelica/angelicaidle.png', frames: 9, fps: 5, loop: true },
        idle2: { src: 'assets/heroes/Angelica/angelicaidle1.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Angelica/angelicaidle2.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        // The staff crystal flares as the shard flies.
        attack: { src: 'assets/heroes/Angelica/angelicaskill1.png', frames: 9, fps: 12,
                  loop: false, hitFrame: 7 },
        // The conjured orb leaves her hand mid-strip.
        skill2: { src: 'assets/heroes/Angelica/angelicaskill2.png', frames: 9, fps: 11,
                  loop: false, hitFrame: 7 },
        // The staff slams and the burst crackles out on frame 7.
        skill3: { src: 'assets/heroes/Angelica/angelicaskill3.png', frames: 9, fps: 10,
                  loop: false, hitFrame: 7 },
        death: { src: 'assets/heroes/Angelica/angelicadeath.png', frames: 17, fps: 7,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'angelica_shardcast', name: 'Shardcast',
        icon: 'assets/icons/fc1012.png',
        description: 'Loose a crystal shard for 90% ATK with a 30% chance ' +
          'to freeze the target solid for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [
          { type: 'damage', mult: 0.9 },
          { type: 'freeze', chance: 0.30, turns: 2 },
        ],
      },
      {
        id: 'angelica_rimeorb', name: 'Rimeorb',
        icon: 'assets/icons/fc1023.png',
        description: 'Conjure and hurl a sphere of packed rime: 125% ATK ' +
          'and a 40% chance to freeze for 2 turns.',
        cooldown: 3, targeting: 'enemy', animation: 'skill2', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.25 },
          { type: 'freeze', chance: 0.40, turns: 2 },
        ],
      },
      {
        id: 'angelica_cryst_lance', name: 'Cryst Lance',
        icon: 'assets/icons/fc1017.png',
        description: 'Drive the staff home: 150% ATK and a coin-flip 50% ' +
          'chance to freeze the target solid for 2 turns.',
        cooldown: 5, targeting: 'enemy', animation: 'skill3', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.5 },
          { type: 'freeze', chance: 0.50, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Cold Arithmetic',
      icon: 'assets/icons/fc1015.png',
      description: 'Every enemy frozen this fight — by anyone — adds a ' +
        'permanent +10% ATK to her for the rest of it. The winter compounds.',
      hooks: {
        onEnemyFrozen(unit) {
          // One tally effect, grown in place: +10% of base per freeze,
          // additive, for the whole fight.
          const fx = unit.statusEffects.find((f) => f.frostTally !== undefined);
          if (fx) {
            fx.frostTally++;
            fx.mult = 1 + 0.10 * fx.frostTally;
          } else {
            unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.1,
              turns: 9999, frostTally: 1 });
          }
        },
      },
    },
    positional: POSITIONALS.cold_forge,
  },

  ari: {
    id: 'ari',
    element: 'water',
    name: 'Ari',
    title: 'Crystquiver',
    rarity: 3,
    // A back-line archer built to finish what the freezers start: every
    // enemy that ices over eats a free arrow from her passive.
    stats: { hp: 1080, atk: 240, def: 88, speed: 105 },
    tint: { body: '#e4e0d4', helm: '#f0ece0', weapon: '#7ae0e8', skin: '#d8b090' },
    // 256px square frames: 9 across, except skill 1 at 11 and skill 2
    // at 12. Three idles — the hooded stance and two quiver fidgets.
    sprite: {
      displayH: 90,
      strips: {
        idle:  { src: 'assets/heroes/Ari/ariidle.png', frames: 9, fps: 5, loop: true },
        idle2: { src: 'assets/heroes/Ari/ariidle1.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Ari/ariidle2.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        // Draw and loose — the arrow leaves on frame 8.
        attack: { src: 'assets/heroes/Ari/ariskill1.png', frames: 11, fps: 12,
                  loop: false, hitFrame: 8 },
        // The bow charges to full crystal glow before the shot.
        skill2: { src: 'assets/heroes/Ari/ariskill2.png', frames: 12, fps: 12,
                  loop: false, hitFrame: 10 },
        // The crystal volley fans out on frame 7.
        skill3: { src: 'assets/heroes/Ari/ariskill3.png', frames: 9, fps: 11,
                  loop: false, hitFrame: 7 },
        death: { src: 'assets/heroes/Ari/arideath.png', frames: 9, fps: 7,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'ari_crystbarb', name: 'Crystbarb',
        icon: 'assets/icons/fc1019.png',
        description: 'Loose a crystal-tipped arrow for 110% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.1 },
        ],
      },
      {
        id: 'ari_lancing_shot', name: 'Lancing Shot',
        icon: 'assets/icons/fc1017.png',
        description: 'A charged shot for 135% ATK that slips past 10% of ' +
          "the target's DEF.",
        cooldown: 3, targeting: 'enemy', animation: 'skill2', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.35, ignoreDef: 0.10 },
        ],
      },
      {
        id: 'ari_marrow_volley', name: 'Marrow Volley',
        icon: 'assets/icons/fc1012.png',
        description: 'A fanned volley for 140% ATK that adds 5% of the ' +
          "target's max HP to the blow.",
        cooldown: 5, targeting: 'enemy', animation: 'skill3', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.4, targetHpPct: 0.05 },
        ],
      },
    ],
    passive: {
      name: 'Frozen Quarry',
      icon: 'assets/icons/fc1010.png',
      description: 'The moment an enemy freezes — by anyone\'s ice — she ' +
        'looses Crystbarb at them, free.',
      hooks: {
        onEnemyFrozen(unit, target, caster, battle) {
          if (!battle || !target.alive) return;
          battle.log(`${unit.name} marks the frozen quarry — Crystbarb flies!`,
            unit.team === TEAM.PLAYER ? 'log-player' : 'log-enemy');
          Abilities.execute(unit.def.abilities[0], unit, target, battle);
        },
      },
    },
    positional: POSITIONALS.giantslayer,
  },

  cain: {
    id: 'cain',
    element: 'water',
    name: 'Cain',
    title: 'Chaplain of Cryst',
    rarity: 4,
    // Every heal in his kit is a share of HIS max HP, so the statline is
    // nearly all pool: the bigger the chaplain, the bigger the mercy —
    // and the bigger the overflow when mercy isn't needed.
    stats: { hp: 2100, atk: 110, def: 150, speed: 96 },
    tint: { body: '#e8e4d8', helm: '#f0ece2', weapon: '#7ae0e8', skin: '#e0c0a0' },
    // 256px square frames: 9 across on every strip. Three idles — the
    // stooped sway and two beard-and-staff fidgets.
    sprite: {
      displayH: 92,
      strips: {
        idle:  { src: 'assets/heroes/Cain/cainidle.png', frames: 9, fps: 5, loop: true },
        idle2: { src: 'assets/heroes/Cain/cainidle1.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Cain/cainidle2.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        // The staff orb charges and bursts mid-strip.
        attack: { src: 'assets/heroes/Cain/cainskill1.png', frames: 9, fps: 10,
                  loop: false, hitFrame: 5 },
        // The waters wind around him before finding their targets.
        skill2: { src: 'assets/heroes/Cain/cainskill2.png', frames: 9, fps: 10,
                  loop: false, hitFrame: 7 },
        // The great sweep — the blessing crests on frame 7.
        skill3: { src: 'assets/heroes/Cain/cainskill3.png', frames: 9, fps: 10,
                  loop: false, hitFrame: 7 },
        death: { src: 'assets/heroes/Cain/caindeath.png', frames: 9, fps: 7,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'cain_tidemend', name: 'Tidemend',
        icon: 'assets/icons/fc1023.png',
        description: 'Mend one ally for 30% of Cain\'s own max HP.',
        cooldown: 0, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.30 },
        ],
      },
      {
        id: 'cain_twin_mercies', name: 'Twin Mercies',
        icon: 'assets/icons/fc1016.png',
        description: 'The two most-wounded allies are each restored for ' +
          '35% of Cain\'s own max HP.',
        cooldown: 3, targeting: 'lowest-allies', allyCount: 2, animation: 'skill2',
        effects: [
          { type: 'healHpPct', pct: 0.35 },
        ],
      },
      {
        id: 'cain_quickening_waters', name: 'Quickening Waters',
        icon: 'assets/icons/fc1024.png',
        description: 'Pour 50% of Cain\'s own max HP into one ally and ' +
          'send them onward with +30% SPD for 2 turns.',
        cooldown: 5, targeting: 'ally', animation: 'skill3',
        effects: [
          { type: 'healHpPct', pct: 0.50 },
          { type: 'buff', stat: 'speed', mult: 1.3, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Nothing Is Wasted',
      icon: 'assets/icons/fc1015.png',
      description: 'Healing past full does not spill on the ground: the ' +
        'overflow strikes the healthiest enemy (by HP%) as damage.',
      hooks: {
        onOverheal(unit, { overflow, battle }) {
          if (!battle || overflow <= 0) return;
          const foes = battle.livingUnits().filter((u) => u.team !== unit.team);
          if (!foes.length) return;
          const foe = foes.sort((a, b) => (b.hp / b.maxHp) - (a.hp / a.maxHp))[0];
          // The Spillway (and any future conduit) widens the channel.
          let raw = overflow;
          for (const p of unit.hookSources()) {
            if (p.hooks && p.hooks.overhealBoost) raw *= 1 + p.hooks.overhealBoost;
          }
          const r = Abilities.strike(unit, foe, raw);
          if (r.amount > 0) {
            battle.addFloatingText(foe, 'OVERFLOW', '#7ae8d8');
            battle.log(`${unit.name}'s surplus mercy lashes ${foe.name} for ${r.amount}!`,
              unit.team === TEAM.PLAYER ? 'log-player' : 'log-enemy');
          }
        },
      },
    },
    positional: POSITIONALS.spillway,
  },

  bit: {
    id: 'bit',
    element: 'water',
    name: 'Bit',
    title: 'Engine of Cryst',
    rarity: 5,
    // A mining construct the court built out of its own crystal: every
    // number in his kit is DEF-scaled, so the wall IS the weapon.
    stats: { hp: 2450, atk: 85, def: 295, speed: 90 },
    tint: { body: '#4aa8e8', helm: '#8ad8ff', weapon: '#c8963a', shield: '#7ae0e8' },
    // 256px square frames: 9 across, except skill 3 at 15. Three idles —
    // the heavy sway and two drill-arm fidgets.
    sprite: {
      displayH: 96,
      strips: {
        idle:  { src: 'assets/heroes/Bit/bitidle.png', frames: 9, fps: 5, loop: true },
        idle2: { src: 'assets/heroes/Bit/bitidle1.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Bit/bitidle2.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        // The drill spins up and bites on frame 6.
        attack: { src: 'assets/heroes/Bit/bitskill1.png', frames: 9, fps: 11,
                  loop: false, hitFrame: 6 },
        // The bit swells to full bore before the slam.
        skill2: { src: 'assets/heroes/Bit/bitskill2.png', frames: 9, fps: 11,
                  loop: false, hitFrame: 6 },
        // Fifteen frames of wind-up into the breakthrough at 10.
        skill3: { src: 'assets/heroes/Bit/bitskill3.png', frames: 15, fps: 12,
                  loop: false, hitFrame: 10 },
        death: { src: 'assets/heroes/Bit/bitdeath.png', frames: 9, fps: 7,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'bit_bore_sweep', name: 'Bore Sweep',
        icon: 'assets/icons/fc1013.png',
        description: 'Grind the enemy FRONT row for 80% of Bit\'s DEF each ' +
          'and strip 30% of their DEF for 1 turn.',
        cooldown: 0, targeting: 'front-enemies', animation: 'attack', impact: 'slash',
        effects: [
          { type: 'damageDef', mult: 0.8 },
          { type: 'debuff', stat: 'def', mult: 0.7, turns: 1 },
        ],
      },
      {
        id: 'bit_core_sample', name: 'Core Sample',
        icon: 'assets/icons/fc1089.png',
        description: 'The bit at full bore, driven into one enemy for ' +
          '125% of Bit\'s DEF.',
        cooldown: 3, targeting: 'enemy', animation: 'skill2', impact: 'slash',
        effects: [
          { type: 'damageDef', mult: 1.25 },
        ],
      },
      {
        id: 'bit_breakthrough', name: 'Breakthrough',
        icon: 'assets/icons/fc1014.png',
        description: 'Drive through the enemy FRONT row and CENTER at once ' +
          'for 90% of Bit\'s DEF each.',
        cooldown: 5, targeting: 'front-and-center-enemies', animation: 'skill3', impact: 'slash',
        effects: [
          { type: 'damageDef', mult: 0.9 },
        ],
      },
    ],
    passive: {
      name: 'Case-Hardened',
      icon: 'assets/icons/fc1101.png',
      description: 'While carrying a DEF buff, his damage is increased ' +
        '20% — a harder shell drills harder.',
      hooks: {
        damageDealtMult(unit) {
          return unit.statusEffects.some(
            (fx) => fx.kind === 'buff' && fx.stat === 'def') ? 1.20 : 1;
        },
      },
    },
    positional: POSITIONALS.bedrock,
  },

  tanner: {
    id: 'tanner',
    element: 'water',
    name: 'Tanner',
    title: 'Prince of Cryst',
    rarity: 4,
    // A tempo support in court dress: token heals, real gifts — turn
    // meter handed out every round, and a bubble that voids whole hits.
    stats: { hp: 1550, atk: 140, def: 145, speed: 108 },
    tint: { body: '#3a5a9a', helm: '#2a3a6a', weapon: '#c8b070', skin: '#e8c8a8' },
    // 256px square frames: 9 across, except the idle at 13 — the prince
    // sways with his cane at length. Two gesturing fidgets.
    sprite: {
      displayH: 90,
      strips: {
        idle:  { src: 'assets/heroes/Tanner/tanneridle.png', frames: 13, fps: 6, loop: true },
        idle2: { src: 'assets/heroes/Tanner/tanneridle1.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Tanner/tanneridle2.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        // A conjured droplet, sprinkled with princely economy.
        attack: { src: 'assets/heroes/Tanner/tannerskill1.png', frames: 9, fps: 10,
                  loop: false, hitFrame: 6 },
        // The cane flourish that scatters blue plumes over an ally.
        skill2: { src: 'assets/heroes/Tanner/tannerskill2.png', frames: 9, fps: 11,
                  loop: false, hitFrame: 6 },
        // The spin that blows the bubbles — rings of water at 6.
        skill3: { src: 'assets/heroes/Tanner/tannerskill3.png', frames: 9, fps: 10,
                  loop: false, hitFrame: 6 },
        death: { src: 'assets/heroes/Tanner/tannerdeath.png', frames: 9, fps: 7,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'tanner_royal_gesture', name: 'Royal Gesture',
        icon: 'assets/icons/fc1023.png',
        description: 'A token of royal concern: mend one ally for 5% of ' +
          'Tanner\'s max HP.',
        cooldown: 0, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.05 },
        ],
      },
      {
        id: 'tanner_royal_favor', name: 'Royal Favor',
        icon: 'assets/icons/fc1091.png',
        description: 'Bestow the court\'s favor on one ally: +30% ATK for ' +
          '2 turns and +50 turn meter on the spot.',
        cooldown: 3, targeting: 'ally', animation: 'skill2',
        effects: [
          { type: 'buff', stat: 'atk', mult: 1.3, turns: 2 },
          { type: 'turnMeter', amount: 0.50 },
        ],
      },
      {
        id: 'tanner_bubble_court', name: 'Bubble Court',
        icon: 'assets/icons/fc1016.png',
        description: 'Blow a bubble around every ally for 2 turns: each ' +
          'bubble swallows ONE entire hit, then pops.',
        cooldown: 5, targeting: 'all-allies', animation: 'skill3',
        effects: [
          { type: 'bubble', turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Noblesse Oblige',
      icon: 'assets/icons/fc1092.png',
      description: 'At the start of each of his turns, the ally furthest ' +
        'from acting gains +10 turn meter. Rank has its duties.',
      hooks: {
        onTurnStart(unit, battle) {
          if (!battle) return null;
          const mates = battle.livingUnits(unit.team).filter((u) => u !== unit);
          if (!mates.length) return null;
          const ally = mates.sort((a, b) => a.turnMeter - b.turnMeter)[0];
          const before = ally.turnMeter;
          ally.turnMeter = Math.min(CONFIG.TURN_METER_MAX,
            ally.turnMeter + CONFIG.TURN_METER_MAX * 0.10);
          const gained = ally.turnMeter - before;
          // The turn this buys can credit its damage back to the prince.
          if (gained > 0 && ally.meterGifts) {
            ally.meterGifts.push({ source: unit, amount: gained });
          }
          return {
            label: 'Noblesse Oblige',
            message: `${unit.name} waves ${ally.name} onward — +10 turn meter.`,
            floats: [{ target: ally, text: 'AP ▲', color: '#5ec2f0' }],
          };
        },
      },
    },
    positional: POSITIONALS.second_wind,
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
    // Placeholder tint (silver armor, crystal sword, blue plume) until
    // strips load.
    tint: { body: '#8d9bb8', helm: '#c8d0e0', weapon: '#8ad8ff', shield: '#3a5ac8' },
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
        // Timed fidget variations (no ready stance — she holds her idle).
        idle2:  { src: 'assets/heroes/emily/emilyidle1.png', frames: 9,  fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        idle3:  { src: 'assets/heroes/emily/emilyidle2.png', frames: 9,  fps: 6, loop: false,
                  variantOf: 'idle', every: [7, 14] },
        // Single-target blessing.
        cast:   { src: 'assets/heroes/emily/emilyskill1.png', frames: 9, fps: 10, loop: false,
                  hitFrame: 6 },
        // Team chorus.
        cast2:  { src: 'assets/heroes/emily/emilyskill2.png', frames: 9, fps: 10, loop: false,
                  hitFrame: 6 },
        // Radiant halo — the revival lands as the light peaks.
        revive: { src: 'assets/heroes/emily/emilyskill3.png', frames: 9, fps: 10, loop: false,
                  hitFrame: 8 },
        // The long fall: seventeen frames, frozen on the last.
        death:  { src: 'assets/heroes/emily/emilydeath.png', frames: 17, fps: 8, loop: false,
                  freeze: true },
      },
    },
    abilities: [
      {
        id: 'lightmend', name: 'Lightmend',
        icon: 'assets/icons/fc1041.png',
        description: 'Bathe one ally in light, healing 30% of Emily\'s max HP.',
        cooldown: 0, targeting: 'ally', animation: 'cast', impact: 'heal_gold',
        effects: [{ type: 'healHpPct', pct: 0.30 }],
      },
      {
        id: 'purifying_chorus', name: 'Purifying Chorus',
        icon: 'assets/icons/fc1046.png',
        description: 'Heal ALL allies for 20% of Emily\'s max HP and cleanse their debuffs.',
        cooldown: 5, targeting: 'all-allies', animation: 'cast2', impact: 'heal_gold',
        effects: [
          { type: 'healHpPct', pct: 0.20 },
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
    title: 'Leader of Reverence',
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
      displayH: 104, // drawn 1.15x the house 90 — the leader stands taller
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
