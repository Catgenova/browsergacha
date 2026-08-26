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
          // No cooldown and no debuff, so every rung is damage. Each buys
          // BOTH halves of the modifier: the per-mirror term is the skill
          // on a mirror kit, and raising only the flat part would make a
          // level-up worth a quarter of what it is worth on anyone else.
          levelUps: [
            { mult: 0.10, perMirror: 0.05 },
            { mult: 0.10, perMirror: 0.05 },
            { mult: 0.10, perMirror: 0.05 },
            { mult: 0.10, perMirror: 0.05 },
            { mult: 0.10, perMirror: 0.05 },
          ],
        },
        {
          id: 'prism_wave', name: 'Prism Wave',
          icon: 'assets/icons/fc306.png',
          description: 'Sweep an enemy row for 40% DEF, +20% DEF per active crystal mirror.',
          // Base cooldown raised 3 -> 4 by the sweep rule; the last two
          // rungs hand it back and then some, landing at 2.
          cooldown: 4, targeting: 'enemy-row', animation: 'attack',
          effects: [{ type: 'damageDef', mult: 0.4, perMirror: 0.2 }],
          levelUps: [
            { mult: 0.10, perMirror: 0.05 },
            { mult: 0.10, perMirror: 0.05 },
            { mult: 0.10, perMirror: 0.05 },
            { mult: 0.10, perMirror: 0.05 },
            { cooldown: -1 },
            { cooldown: -1 },
          ],
        },
        {
          id: 'resonant_shatter', name: 'Resonant Shatter',
          icon: 'assets/icons/fc307.png',
          description: 'Blast one enemy for 70% DEF, +40% DEF per active crystal mirror, then reform 2 mirrors.',
          // Base cooldown raised 5 -> 6 by the sweep rule; fully levelled
          // it cycles at 4, one turn faster than it ever did.
          cooldown: 6, targeting: 'enemy', animation: 'skill3',
          effects: [{ type: 'damageDef', mult: 0.7, perMirror: 0.4 }],
          selfEffects: [{ type: 'mirrors', count: 2 }],
          levelUps: [
            { mult: 0.10, perMirror: 0.05 },
            { mult: 0.10, perMirror: 0.05 },
            { mult: 0.10, perMirror: 0.05 },
            { mult: 0.10, perMirror: 0.05 },
            { mult: 0.10, perMirror: 0.05 },
            { cooldown: -1 },
            { cooldown: -1 },
          ],
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
        // No cooldown and no debuff: every rung is damage, 50% -> 100%.
        levelUps: [
          { mult: 0.10 }, { mult: 0.10 }, { mult: 0.10 },
          { mult: 0.10 }, { mult: 0.10 },
        ],
      },
      {
        id: 'full_peal', name: 'Full Peal',
        icon: 'assets/icons/fc306.png',
        description: 'The peal carries across the field: 50% DEF to ALL enemies.',
        // Base cooldown raised 3 -> 4 by the sweep rule; the last two
        // rungs hand it back twice over, landing at 2.
        cooldown: 4, targeting: 'all-enemies', animation: 'attack',
        effects: [{ type: 'damageDef', mult: 0.5 }],
        levelUps: [
          { mult: 0.10 }, { mult: 0.10 }, { mult: 0.10 }, { mult: 0.10 },
          { cooldown: -1 }, { cooldown: -1 },
        ],
      },
      {
        id: 'the_reckoning', name: 'The Reckoning',
        icon: 'assets/icons/fc307.png',
        description: 'Call in the debt: ALL enemies lose 30% DEF and 30% ATK ' +
          'for 2 turns — each break rolled separately at 50%.',
        // Base cooldown raised 5 -> 6; fully levelled it cycles at 4.
        cooldown: 6, targeting: 'all-enemies', animation: 'skill3',
        // A pure debuff skill: under the old blanket multiplier its five
        // levels bought literally nothing, because it has no damage or
        // heal number to scale. `chance` is the new application gate,
        // rolled before the accuracy contest, and the ladder walks it
        // from a coin flip to a certainty.
        effects: [
          { type: 'debuff', stat: 'def', mult: 0.7, turns: 2, chance: 0.5 },
          { type: 'debuff', stat: 'atk', mult: 0.7, turns: 2, chance: 0.5 },
        ],
        // The two breaks carry their own `chance` and so roll their own
        // gate: at level 1 that is 25% for both, 50% for exactly one and
        // 25% for neither, which is why the description says "each"
        // rather than promising one roll for the pair.
        //
        // 20/20/10 reaches exactly 100%, then two severity rungs deepen
        // BOTH stats together (they are applied as a pair), then the
        // cooldown pair. At max: certain, -40%/-40%, on a 4-turn cycle.
        levelUps: [
          { debuffChance: 0.20 },
          { debuffChance: 0.20 },
          { debuffChance: 0.10 },
          { debuffPower: 0.05 },
          { debuffPower: 0.05 },
          { cooldown: -1 },
          { cooldown: -1 },
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
    // Explicit role: her bulk narrowly outweighs her punch on the stat
    // fold, but the 200 ATK paladin is a front-line DPS, not a wall.
    role: 'dps',
    stats: { hp: 1700, atk: 200, def: 160, speed: 98 },
    tint: { body: '#e8e4dc', helm: '#f0ece0', weapon: '#c8b88a', skin: '#e8c0a0' },
    sprite: {
      displayH: 90,
      // Measured 14: a closed, formal stance on a paladin who is
      // visually one of the heaviest things on the field.
      shadowScale: 1.3,
      // Authored facing left (see the facing audit) — flagged, not
      // mirrored into the files; Sprites.facesLeft() flips it right.
      faceLeft: true,
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
          const took = Abilities.drainMeter(unit, target, 0.20);
          if (!took || took.amount === 0) return null;
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
    title: 'Blade of the Nightflowers',
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
        '(up to +60%) — flowers cut easiest once they droop.',
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
          if (Math.random() >= 0.05 + (unit.synergyFreezeChance || 0)) return;
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
      // Authored facing left (see the facing audit) — flagged, not
      // mirrored into the files; Sprites.facesLeft() flips it right.
      faceLeft: true,
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
      // Authored facing left (see the facing audit) — flagged, not
      // mirrored into the files; Sprites.facesLeft() flips it right.
      faceLeft: true,
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
      displayH: 120, // 96 × 1.25 — the golem should loom
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
      // Measured 13: the prince stands with his heels together and
      // his cane tucked in, so his contact patch is far narrower
      // than his presence. Nudged up to read as a grown man.
      shadowScale: 1.4,
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
        description: 'A token of royal concern: mend one ally for 20% of ' +
          'Tanner\'s max HP.',
        cooldown: 0, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.20 },
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
      // Displayed unflipped on the hero side — no faceLeft flag.
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

  lucian: {
    id: 'lucian',
    element: 'fire',
    name: 'Lucian',
    title: 'Firebrand of the Firetroupe',
    rarity: 5,
    // Back-row fire carry, and the Firetroupe's founding member: the
    // burn is the engine — the DoT eats max HP, the forge banks
    // permanent ATK off the burning field, and the ricochet cashes it
    // all out.
    stats: { hp: 1450, atk: 280, def: 95, speed: 106 },
    tint: { body: '#5a2a20', helm: '#e86a2a', weapon: '#ffb84a', skin: '#e8b088' },
    // 256px square frames, 9 across on every strip. Three idles: the
    // base sway and two fidgets. NOTE: the skill 2 strip was uploaded
    // as "lucien" — referenced exactly as delivered.
    sprite: {
      displayH: 92,
      // Authored facing left, like Angelica and Javarious — flagged,
      // not mirrored into the files; Sprites.facesLeft() flips it right.
      faceLeft: true,
      strips: {
        idle:  { src: 'assets/heroes/Lucian/lucianidle.png', frames: 9, fps: 5, loop: true },
        idle2: { src: 'assets/heroes/Lucian/lucianidle1.png', frames: 9, fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Lucian/lucianidle2.png', frames: 9, fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        attack: { src: 'assets/heroes/Lucian/lucianskill1.png', frames: 9, fps: 12,
                  loop: false, hitFrame: 6 },
        skill2: { src: 'assets/heroes/Lucian/lucienskill2.png', frames: 9, fps: 10,
                  loop: false },
        skill3: { src: 'assets/heroes/Lucian/lucianskill3.png', frames: 9, fps: 12,
                  loop: false, hitFrame: 6 },
        death: { src: 'assets/heroes/Lucian/luciandeath.png', frames: 9, fps: 7,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'lucian_cinder_lash', name: 'Cinder Lash',
        icon: 'assets/icons/fc1025.png',
        description: 'Lash one enemy for 110% ATK and set them alight: ' +
          'the burn eats 3% of their max HP at the start of each of ' +
          'their turns, for 3 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.10 },
          { type: 'dot', targetHpPct: 0.03, turns: 3, flavor: 'burn' },
        ],
      },
      {
        id: 'lucian_stoke_the_forge', name: 'Stoke the Forge',
        icon: 'assets/icons/fc1026.png',
        description: 'Draw heat from the field: permanently gain 50 ATK ' +
          'for each burning enemy, banking up to 1000 ATK per battle.',
        cooldown: 3, targeting: 'self', animation: 'skill2',
        effects: [
          { type: 'atkPerDebuff', flavor: 'burn', per: 50, cap: 1000 },
        ],
      },
      {
        id: 'lucian_wildfire_arc', name: 'Wildfire Arc',
        icon: 'assets/icons/fc1027.png',
        description: 'Hurl fire for 125% ATK. It leaps to another enemy ' +
          'and strikes again with a 75% chance, indefinitely — and with ' +
          'one enemy left, it leaps back into them.',
        cooldown: 5, targeting: 'enemy', animation: 'skill3', impact: 'slash',
        effects: [
          { type: 'bounce', mult: 1.25, chance: 0.75 },
        ],
      },
    ],
    passive: {
      name: 'By Firelight',
      icon: 'assets/icons/fc1055.png',
      description: 'While at least one enemy burns, Lucian fights at ' +
        '+30% ATK — he works best by the light of his own fires.',
      hooks: {
        onTurnStart(unit, battle) {
          const b = battle ||
            (typeof Battle !== 'undefined' ? Battle.active : null);
          const lit = b && b.livingUnits().some((u) =>
            u.team !== unit.team && u.burning && u.burning());
          if (!lit) return null;
          unit.addStatusEffect({ kind: 'buff', stat: 'atk', mult: 1.3, turns: 1 });
          return null; // silent: it re-applies while the fires hold
        },
      },
    },
    positional: POSITIONALS.pyre_sight,
  },

  franz: {
    id: 'franz',
    element: 'fire',
    name: 'Franz',
    title: 'Firebreather of the Firetroupe',
    rarity: 4,
    // Front-line bruiser whose every throw scales off his OWN max HP —
    // the ATK line is stage dressing; the HP line IS the weapon. Hurt
    // him and he throws harder still (Showman's Blood). The art is a
    // big firebreather in showman's stripes: thrown weights, a wheel,
    // and a finale where the whole act goes up in flame.
    stats: { hp: 2100, atk: 130, def: 135, speed: 98 },
    tint: { body: '#6a2a1a', helm: '#e8a83a', weapon: '#c8c2cc', skin: '#e8b088' },
    // frames: 'auto' — the def is wired ahead of the spritesheets; the
    // loader measures the count off the delivered art (square frames),
    // and placeholder art stands in until the upload lands.
    sprite: {
      displayH: 96,
      // Authored facing left, like Angelica and Javarious — flagged,
      // not mirrored into the files; Sprites.facesLeft() flips it right.
      faceLeft: true,
      strips: {
        idle:  { src: 'assets/heroes/Franz/franzidle.png', frames: 'auto', fps: 5, loop: true },
        idle2: { src: 'assets/heroes/Franz/franzidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Franz/franzidle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        // The weight leaves his hand around frame 7.
        attack: { src: 'assets/heroes/Franz/franzskill1.png', frames: 'auto', fps: 12,
                  loop: false, hitFrame: 7 },
        // The wheel is raised mid-strip and released at frame 7.
        skill2: { src: 'assets/heroes/Franz/franzskill2.png', frames: 'auto', fps: 11,
                  loop: false, hitFrame: 7 },
        // 14 frames: the breath ignites around frame 8 and the burning
        // volley flies on the final beats.
        skill3: { src: 'assets/heroes/Franz/franzskill3.png', frames: 'auto', fps: 12,
                  loop: false, hitFrame: 12 },
        death: { src: 'assets/heroes/Franz/franzdeath.png', frames: 'auto', fps: 7,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'franz_bonk', name: 'Bonk',
        icon: 'assets/icons/fc1030.png',
        description: 'Hurl a showman\'s iron weight square off one ' +
          "enemy's head for 20% of Franz's own max HP as damage.",
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'slam',
        effects: [
          { type: 'damageHp', mult: 0.20 },
        ],
      },
      {
        id: 'franz_wagon_wheel', name: 'Wagon Wheel',
        icon: 'assets/icons/fc1031.png',
        description: 'Send a wagon wheel rolling through the enemy ' +
          'front row for 20% of his own max HP as damage to each.',
        cooldown: 3, targeting: 'front-enemies', animation: 'skill2', impact: 'slam',
        effects: [
          { type: 'damageHp', mult: 0.20 },
        ],
      },
      {
        id: 'franz_flaming_finale', name: 'Flaming Finale',
        icon: 'assets/icons/fc1032.png',
        description: 'Draw a deep breath and hose the entire enemy team ' +
          'with fire for 15% of his own max HP each.',
        cooldown: 5, targeting: 'all-enemies', animation: 'skill3', impact: 'strike',
        effects: [
          { type: 'damageHp', mult: 0.15 },
        ],
      },
    ],
    passive: {
      name: "Showman's Blood",
      icon: 'assets/icons/fc1056.png',
      description: 'Deals up to 30% extra damage in proportion to his ' +
        'missing health — the crowd loves a wounded showman.',
      hooks: {
        damageDealtMult(unit) {
          return 1 + 0.30 * (1 - unit.hp / unit.maxHp);
        },
      },
    },
    positional: POSITIONALS.hearthblood,
  },

  carl: {
    id: 'carl',
    element: 'fire',
    name: 'Carl',
    title: 'Strongman of the Firetroupe',
    rarity: 3,
    // Front-line tank in the Franz mold: swings scale off his OWN max
    // HP, and every blow he absorbs makes the pool — and therefore the
    // swings — bigger. Punishment is his training montage.
    stats: { hp: 2000, atk: 100, def: 155, speed: 95 },
    tint: { body: '#7a3a24', helm: '#b8b2bc', weapon: '#c8863a', skin: '#e8b088' },
    // Wired ahead of the art (frames measured off the delivered strips;
    // placeholder art stands in until the upload lands).
    sprite: {
      displayH: 96,
      // Authored facing RIGHT (his skill punches land to the right of
      // frame) — no faceLeft flag, unlike most of the troupe.
      strips: {
        idle:  { src: 'assets/heroes/Carl/carlidle.png', frames: 'auto', fps: 5, loop: true },
        idle2: { src: 'assets/heroes/Carl/carlidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Carl/carlidle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        attack: { src: 'assets/heroes/Carl/carlskill1.png', frames: 'auto', fps: 12,
                  loop: false, hitFrame: 6 },
        skill2: { src: 'assets/heroes/Carl/carlskill2.png', frames: 'auto', fps: 11,
                  loop: false, hitFrame: 6 },
        skill3: { src: 'assets/heroes/Carl/carlskill3.png', frames: 'auto', fps: 11,
                  loop: false, hitFrame: 6 },
        death: { src: 'assets/heroes/Carl/carldeath.png', frames: 'auto', fps: 7,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'carl_clobber', name: 'Opening Act',
        icon: 'assets/icons/fc1033.png',
        description: "The show opens: one clean bare-knuckle punch for 15% of Carl's own max HP as damage.",
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [
          { type: 'damageHp', mult: 0.15 },
        ],
      },
      {
        id: 'carl_pole_swing', name: 'Crowd-Pleaser',
        icon: 'assets/icons/fc1034.png',
        description: 'Wind up and lay one enemy out for 20% of his own ' +
          'max HP as damage, then flex for the crowd.',
        cooldown: 3, targeting: 'enemy', animation: 'skill2', impact: 'slash',
        effects: [
          { type: 'damageHp', mult: 0.20 },
        ],
      },
      {
        id: 'carl_bring_down_the_pole', name: 'Main Event',
        icon: 'assets/icons/fc1035.png',
        description: 'The headline act: a two-fisted drive for 25% of his ' +
          'own max HP as damage — a FRONT-row target takes 50% more. ' +
          'Tanks first.',
        cooldown: 5, targeting: 'enemy', animation: 'skill3', impact: 'slash',
        effects: [
          { type: 'damageHp', mult: 0.25,
            bonusPosition: { position: 'front', mult: 1.5 } },
        ],
      },
    ],
    passive: {
      name: 'Iron Appetite',
      icon: 'assets/icons/fc1057.png',
      description: 'Gains max HP equal to 10% of damage received, up to ' +
        '+50% of his starting max HP — every beating makes him bigger.',
      hooks: {
        onStruck(unit, { amount }) {
          if (!amount || amount <= 0) return;
          // The baseline is his max HP as the first blow lands — i.e.
          // battle-start, with placement and party bonuses included.
          if (unit.ironBase === undefined) unit.ironBase = unit.maxHp;
          const cap = Math.round(unit.ironBase * 0.5);
          const grown = unit.maxHp - unit.ironBase;
          const gain = Math.min(cap - grown, Math.round(amount * 0.10));
          if (gain <= 0) return;
          unit.maxHp += gain;
        },
      },
    },
    positional: POSITIONALS.strongman,
  },

  esmerelda: {
    id: 'esmerelda',
    element: 'fire',
    name: 'Esmerelda',
    title: 'Firedancer of the Firetroupe',
    rarity: 3,
    // Explicit role: the stat fold reads her 1550 HP as bulk, but the
    // ribbon dancer is a front-line DPS.
    role: 'dps',
    // Front-line DPS who spreads the troupe's burns and then feeds on
    // them: her heal reads the whole enemy team's DoTs. The art is a
    // dancer trailing burning silk ribbons through every strip.
    stats: { hp: 1550, atk: 165, def: 110, speed: 104 },
    tint: { body: '#8a2a2a', helm: '#3a2018', weapon: '#ff7a3a', skin: '#e8a888' },
    sprite: {
      displayH: 94,
      // Authored facing left, like Angelica and Javarious — flagged,
      // not mirrored into the files; Sprites.facesLeft() flips it right.
      faceLeft: true,
      strips: {
        // A 17-frame ribbon dance for the base idle; short fidgets.
        idle:  { src: 'assets/heroes/Esmerelda/esmereldaidle.png', frames: 'auto', fps: 7, loop: true },
        idle2: { src: 'assets/heroes/Esmerelda/esmereldaidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Esmerelda/esmereldaidle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        // The ribbon lashes forward early in the strip.
        attack: { src: 'assets/heroes/Esmerelda/esmereldaskill1.png', frames: 'auto', fps: 12,
                  loop: false, hitFrame: 4 },
        skill2: { src: 'assets/heroes/Esmerelda/esmereldaskill2.png', frames: 'auto', fps: 10,
                  loop: false },
        // The high arc peaks mid-strip on its way to the backline.
        skill3: { src: 'assets/heroes/Esmerelda/esmereldaskill3.png', frames: 'auto', fps: 12,
                  loop: false, hitFrame: 5 },
        death: { src: 'assets/heroes/Esmerelda/esmereldadeath.png', frames: 'auto', fps: 8,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'esmerelda_ribbon_lash', name: 'Ribbon Lash',
        icon: 'assets/icons/fc1036.png',
        description: 'Lash one enemy with a burning silk for 110% ATK ' +
          'and leave a burn eating 3% of their max HP per turn for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.10 },
          { type: 'dot', targetHpPct: 0.03, turns: 2, flavor: 'burn' },
        ],
      },
      {
        id: 'esmerelda_gathering_embers', name: 'Gathering Embers',
        icon: 'assets/icons/fc1037.png',
        description: 'Draw the heat home: heal every front-row ally for ' +
          "20% of Esmerelda's ATK per damage-over-time burning on the " +
          'enemy team.',
        cooldown: 3, targeting: 'front-allies', animation: 'skill2',
        effects: [
          { type: 'healPerDot', pct: 0.20 },
        ],
      },
      {
        id: 'esmerelda_trailing_flame', name: 'Trailing Flame',
        icon: 'assets/icons/fc1038.png',
        description: 'Send the ribbons arcing over the wall: 125% ATK to ' +
          'the enemy back row, each victim left with a burn eating 3% of ' +
          'their max HP per turn for 2 turns.',
        cooldown: 5, targeting: 'back-enemies', animation: 'skill3', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.25 },
          { type: 'dot', targetHpPct: 0.03, turns: 2, flavor: 'burn' },
        ],
      },
    ],
    passive: {
      name: 'Moth to Flame',
      icon: 'assets/icons/fc1058.png',
      description: 'Deals 15% extra damage to burning enemies — the ' +
        'dance always returns to the fire.',
      hooks: {
        damageDealtMult(unit, target) {
          return target && target.burning && target.burning() ? 1.15 : 1;
        },
      },
    },
    positional: POSITIONALS.vanguard_press,
  },

  slick: {
    id: 'slick',
    element: 'fire',
    name: 'Slick',
    title: 'Barrel Man of the Firetroupe',
    rarity: 3,
    // Center support who deals no damage at all: he is the troupe's
    // oil supply. His whole kit paints Oilslicked (burns tick twice as
    // hard) onto the enemy team, and anyone who hits the barrel gets
    // splashed for their trouble. The art is a living barrel of pitch.
    stats: { hp: 1800, atk: 110, def: 140, speed: 100 },
    tint: { body: '#5a3018', helm: '#241418', weapon: '#d8b04a', skin: '#c8863a' },
    sprite: {
      displayH: 90,
      // Authored facing left, like Angelica and Javarious — flagged,
      // not mirrored into the files; Sprites.facesLeft() flips it right.
      faceLeft: true,
      strips: {
        // The pitch never stops bubbling over the rim.
        idle:  { src: 'assets/heroes/Slick/slickidle.png', frames: 'auto', fps: 7, loop: true },
        idle2: { src: 'assets/heroes/Slick/slickidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Slick/slickidle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        // The splash arcs out at the front row mid-strip.
        attack: { src: 'assets/heroes/Slick/slickskill1.png', frames: 'auto', fps: 12,
                  loop: false, hitFrame: 6 },
        skill2: { src: 'assets/heroes/Slick/slickskill2.png', frames: 'auto', fps: 10,
                  loop: false },
        // The whole barrel goes over.
        skill3: { src: 'assets/heroes/Slick/slickskill3.png', frames: 'auto', fps: 12,
                  loop: false, hitFrame: 6 },
        death: { src: 'assets/heroes/Slick/slickdeath.png', frames: 'auto', fps: 8,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'slick_splash_zone', name: 'Splash Zone',
        icon: 'assets/icons/fc1039.png',
        description: 'Slop a wave of pitch over the enemy front row, ' +
          'leaving them Oilslicked for 3 turns — burns tick twice as ' +
          'hard on an oiled target.',
        cooldown: 0, targeting: 'front-enemies', animation: 'attack',
        effects: [
          { type: 'debuff', stat: 'oilslicked', turns: 3 },
        ],
      },
      {
        id: 'slick_fresh_coat', name: 'Fresh Coat',
        icon: 'assets/icons/fc1040.png',
        description: 'Slick his own staves with a fresh coat of oil: ' +
          '+30% SPD and +30% debuff Accuracy for 2 turns.',
        cooldown: 3, targeting: 'self', animation: 'skill2',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.30, turns: 2 },
          { type: 'buff', stat: 'accuracy', add: 0.30, turns: 2 },
        ],
      },
      {
        id: 'slick_the_big_spill', name: 'The Big Spill',
        icon: 'assets/icons/fc1041.png',
        description: 'Tip the whole barrel: every enemy is Oilslicked ' +
          'for 3 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'skill3',
        effects: [
          { type: 'debuff', stat: 'oilslicked', turns: 3 },
        ],
      },
    ],
    passive: {
      name: 'Backsplash',
      icon: 'assets/icons/fc1059.png',
      description: 'Hit the barrel, wear the barrel: any enemy who ' +
        'strikes Slick is Oilslicked for 2 turns.',
      hooks: {
        onStruck(unit, { attacker, battle }) {
          if (!attacker || !attacker.alive || attacker.team === unit.team) return;
          attacker.addStatusEffect({ kind: 'debuff', stat: 'oilslicked', turns: 2, source: unit });
          if (battle) {
            battle.addFloatingText(attacker, '≋ OILSLICKED', '#d8b04a');
            battle.log(`${attacker.name} is splashed on the follow-through — ` +
              'burns tick twice as hard (2 turns).', 'log-system');
          }
        },
      },
    },
    positional: POSITIONALS.center_ring,
  },

  samuels: {
    id: 'samuels',
    element: 'fire',
    name: 'Samuels',
    title: 'Stabby Triplets of the Firetroupe',
    rarity: 3,
    // Explicit role: three knife-throwing brothers are a front-line
    // DPS, whatever the stat fold makes of their shared HP pool.
    role: 'dps',
    // Front-line DPS who is three brothers in a stack: every skill is
    // THREE separate strikes, each rolling its own crit — the art is a
    // three-high knife-acrobat tower, and the death is it toppling.
    stats: { hp: 1600, atk: 160, def: 105, speed: 106 },
    tint: { body: '#8a4a2a', helm: '#3a2418', weapon: '#c8ccd8', skin: '#e8a878' },
    sprite: {
      displayH: 96,
      // Measured 15: three small bodies, and the band only catches
      // the middle one's feet. Widened to sit under the trio.
      shadowScale: 1.2,
      // Authored facing RIGHT (all three daggers stab to the right of
      // frame) — no faceLeft flag, unlike most of the troupe.
      strips: {
        idle:  { src: 'assets/heroes/Samuels/samuelsidle.png', frames: 'auto', fps: 7, loop: true },
        idle2: { src: 'assets/heroes/Samuels/samuelsidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Samuels/samuelsidle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        // Three knives flash in quick succession mid-strip.
        attack: { src: 'assets/heroes/Samuels/samuelsskill1.png', frames: 'auto', fps: 12,
                  loop: false, hitFrame: 4 },
        // The middle brother throws — the blade leaves on the flash.
        skill2: { src: 'assets/heroes/Samuels/samuelsskill2.png', frames: 'auto', fps: 12,
                  loop: false, hitFrame: 5 },
        skill3: { src: 'assets/heroes/Samuels/samuelsskill3.png', frames: 'auto', fps: 12,
                  loop: false, hitFrame: 5 },
        // The tower comes down.
        death: { src: 'assets/heroes/Samuels/samuelsdeath.png', frames: 'auto', fps: 8,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'samuels_stab_stab_stab', name: 'Stab, Stab, Stab',
        icon: 'assets/icons/fc1042.png',
        description: 'One knife from each brother: 3 separate strikes of ' +
          '35% ATK, each with 15% extra chance to crit.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [
          { type: 'damage', mult: 0.35, critAdd: 0.15 },
          { type: 'damage', mult: 0.35, critAdd: 0.15 },
          { type: 'damage', mult: 0.35, critAdd: 0.15 },
        ],
      },
      {
        id: 'samuels_aim_for_the_middle', name: 'Aim for the Middle',
        icon: 'assets/icons/fc1043.png',
        description: 'Three thrown blades of 40% ATK each — a target on ' +
          'the center tile takes double from every one.',
        cooldown: 3, targeting: 'enemy', animation: 'skill2', impact: 'strike',
        effects: [
          { type: 'damage', mult: 0.40, bonusPosition: { position: 'center', mult: 2 } },
          { type: 'damage', mult: 0.40, bonusPosition: { position: 'center', mult: 2 } },
          { type: 'damage', mult: 0.40, bonusPosition: { position: 'center', mult: 2 } },
        ],
      },
      {
        id: 'samuels_triplet_flurry', name: 'Triplet Flurry',
        icon: 'assets/icons/fc1044.png',
        description: 'All three brothers commit: 3 separate strikes of ' +
          '55% ATK, each with 20% extra chance to crit.',
        cooldown: 5, targeting: 'enemy', animation: 'skill3', impact: 'slash',
        effects: [
          { type: 'damage', mult: 0.55, critAdd: 0.20 },
          { type: 'damage', mult: 0.55, critAdd: 0.20 },
          { type: 'damage', mult: 0.55, critAdd: 0.20 },
        ],
      },
    ],
    passive: {
      name: 'Not a Scratch',
      icon: 'assets/icons/fc1060.png',
      description: 'At full HP the triplets deal 30% extra damage — ' +
        'untouched, they are unbearable.',
      hooks: {
        damageDealtMult(unit) {
          return unit.hp >= unit.maxHp ? 1.30 : 1;
        },
      },
    },
    positional: POSITIONALS.knifes_edge,
  },

  lin: {
    id: 'lin',
    element: 'fire',
    name: 'Lin',
    title: 'Balance Act of the Firetroupe',
    rarity: 4,
    // Front-line tank on a big red circus ball: she pulls the enemy
    // backline's eyes onto herself, sets the ball ablaze to seed burns,
    // and her heaviest play is to stop acting entirely — planting the
    // ball as a barricade that eats every hit meant for her front row.
    stats: { hp: 2300, atk: 115, def: 165, speed: 96 },
    tint: { body: '#a83232', helm: '#3a1c18', weapon: '#e84a3a', skin: '#e8b088' },
    sprite: {
      // Drawn taller than the troupe's 96: she stands ON the ball, so
      // the figure itself reads small without the extra height.
      displayH: 125,
      // Authored facing left, like the rest of the Firetroupe — flagged,
      // not mirrored into the files; Sprites.facesLeft() flips it right.
      faceLeft: true,
      strips: {
        idle:  { src: 'assets/heroes/Lin/linidle.png', frames: 'auto', fps: 7, loop: true },
        idle2: { src: 'assets/heroes/Lin/linidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Lin/linidle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        // The beckoning flourish — all eyes on the balance act.
        attack: { src: 'assets/heroes/Lin/linskill1.png', frames: 'auto', fps: 10,
                  loop: false, hitFrame: 5 },
        // The ball ignites and rolls its flame at the front row.
        skill2: { src: 'assets/heroes/Lin/linskill2.png', frames: 'auto', fps: 10,
                  loop: false, hitFrame: 5 },
        // 17 frames: she dismounts and plants the ball as a wall. The
        // final braced frame HOLDS while the Blocker buff lasts.
        // This one strip is authored the other way round: she dismounts
        // and plants the ball to the RIGHT of frame, so it opts out of
        // the sheet-wide faceLeft flip.
        skill3: { src: 'assets/heroes/Lin/linskill3.png', frames: 'auto', fps: 10,
                  loop: false, stanceHold: 'blocker', faceLeft: false },
        death: { src: 'assets/heroes/Lin/lindeath.png', frames: 'auto', fps: 8,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'lin_center_of_attention', name: 'Center of Attention',
        icon: 'assets/icons/fc1045.png',
        description: 'A flourish nobody can ignore: taunts the enemy ' +
          'back row — on its next turn each victim must throw its ' +
          'skill 1 at Lin and nothing else.',
        cooldown: 0, targeting: 'back-enemies', animation: 'attack',
        effects: [
          // turns: 2 because statuses tick at the victim's turn start —
          // this covers exactly ONE of the victim's turns.
          { type: 'debuff', stat: 'taunted', turns: 2 },
        ],
      },
      {
        id: 'lin_blazing_ball', name: 'Blazing Ball',
        icon: 'assets/icons/fc1046.png',
        description: 'Set the ball alight and roll it down the line: ' +
          'the enemy front row takes 2 burns, each eating 3% of their ' +
          'max HP per turn for 2 turns.',
        cooldown: 3, targeting: 'front-enemies', animation: 'skill2',
        effects: [
          { type: 'dot', targetHpPct: 0.03, turns: 2, flavor: 'burn' },
          { type: 'dot', targetHpPct: 0.03, turns: 2, flavor: 'burn' },
        ],
      },
      {
        id: 'lin_ball_barricade', name: 'Ball Barricade',
        icon: 'assets/icons/fc1047.png',
        description: 'Plant the ball and brace: Lin gains Blocker for 2 ' +
          'turns — she cannot act, but absorbs all damage aimed at ' +
          'front-row allies, mitigating 25% of it.',
        cooldown: 5, targeting: 'self', animation: 'skill3',
        effects: [
          { type: 'buff', stat: 'blocker', turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Used to the Heat',
      icon: 'assets/icons/fc1061.png',
      description: 'Takes 15% less damage from burning enemies — she ' +
        'dances over fire for a living.',
      hooks: {
        damageTakenMult(unit, attacker) {
          return attacker && attacker.burning && attacker.burning() ? 0.85 : 1;
        },
      },
    },
    positional: POSITIONALS.limelight,
  },

  koe: {
    id: 'koe',
    element: 'fire',
    name: 'Koe',
    title: 'Mime of the Firetroupe',
    rarity: 4,
    // Back-line support who never says a word: an invisible remedy that
    // fits whoever receives it, a rope-pull that drags the front line up
    // the action bar, and the classic invisible wall — a Bubble that
    // eats one whole hit. When a burning enemy strikes an ally, the
    // remedy arrives unasked.
    stats: { hp: 1900, atk: 125, def: 130, speed: 108 },
    tint: { body: '#e8e4de', helm: '#241f22', weapon: '#c83a3a', skin: '#f0e8e0' },
    sprite: {
      displayH: 92,
      // Displayed unflipped on the hero side — no faceLeft flag.
      strips: {
        idle:  { src: 'assets/heroes/Koe/koeidle.png', frames: 'auto', fps: 7, loop: true },
        idle2: { src: 'assets/heroes/Koe/koeidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Koe/koeidle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        // The open-palmed offering — something from nothing.
        attack: { src: 'assets/heroes/Koe/koeskill1.png', frames: 'auto', fps: 10,
                  loop: false, hitFrame: 5 },
        // The rope-pull, hand over hand.
        skill2: { src: 'assets/heroes/Koe/koeskill2.png', frames: 'auto', fps: 10,
                  loop: false, hitFrame: 5 },
        // Both palms flat on the invisible wall.
        skill3: { src: 'assets/heroes/Koe/koeskill3.png', frames: 'auto', fps: 10,
                  loop: false, hitFrame: 6 },
        death: { src: 'assets/heroes/Koe/koedeath.png', frames: 'auto', fps: 8,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'koe_something_from_nothing', name: 'Something From Nothing',
        icon: 'assets/icons/fc1048.png',
        description: 'Produce an invisible remedy: heal one ally for 15% ' +
          'of THEIR max HP and lift 2 debuffs.',
        cooldown: 0, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', targetPct: 0.15 },
          { type: 'cleanse', count: 2 },
        ],
      },
      {
        id: 'koe_pull_the_rope', name: 'Pull the Rope',
        icon: 'assets/icons/fc1049.png',
        description: 'Haul the front line forward on a rope only Koe can ' +
          'see: front-row allies gain 30% SPD for 2 turns and 20% turn ' +
          'meter at once.',
        cooldown: 3, targeting: 'front-allies', animation: 'skill2',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.30, turns: 2 },
          { type: 'turnMeter', amount: 0.20 },
        ],
      },
      {
        id: 'koe_the_invisible_wall', name: 'The Invisible Wall',
        icon: 'assets/icons/fc1050.png',
        description: 'Press both palms flat and the wall is THERE: every ' +
          'front-row ally gains a Bubble for 2 turns that absorbs one ' +
          'whole hit.',
        cooldown: 5, targeting: 'front-allies', animation: 'skill3',
        effects: [
          { type: 'bubble', turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Silent Alarm',
      icon: 'assets/icons/fc1062.png',
      description: 'When an ally is struck by a burning enemy, Koe ' +
        'answers at once — Something From Nothing, cast on them, free.',
      hooks: {
        onAllyStruck(unit, { ally, attacker, battle }) {
          if (!attacker || attacker.team === unit.team) return;
          if (!attacker.burning || !attacker.burning()) return;
          if (!unit.alive || !ally.alive || ally === attacker) return;
          const basic = unit.abilities && unit.abilities[0];
          if (!basic) return;
          const results = Abilities.execute(basic.def, unit, ally, battle) || [];
          const healed = results.find && results.find((r) => r && r.kind === 'heal');
          if (battle) {
            if (healed && healed.amount > 0) {
              battle.addFloatingText(ally, `+${healed.amount}`, '#8ae88a');
            }
            battle.log(`${unit.name} answers in silence — ` +
              `${basic.def.name} for ${ally.name}.`, 'log-system');
          }
        },
      },
    },
    positional: POSITIONALS.vanishing_act,
  },

  cleo: {
    id: 'cleo',
    element: 'fire',
    name: 'Cleo',
    title: 'Fortune Teller of the Firetroupe',
    rarity: 5,
    // Back-line support who reads the whole fight in her crystal ball:
    // triage healing that finds the lowest bars on its own, a strip
    // that tears blessings off the enemy team, and a passive drip that
    // pays out every single time an enemy burns — the Firetroupe's
    // burn economy made into a healing engine.
    stats: { hp: 2050, atk: 155, def: 145, speed: 110 },
    tint: { body: '#c83a3a', helm: '#8a2a2a', weapon: '#ffb04a', skin: '#e8b898' },
    sprite: {
      displayH: 92,
      // Authored facing RIGHT (her profile and gaze point right of
      // frame) — no faceLeft flag, unlike most of the troupe.
      strips: {
        idle:  { src: 'assets/heroes/Cleo/cleoidle.png', frames: 'auto', fps: 7, loop: true },
        idle2: { src: 'assets/heroes/Cleo/cleoidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Cleo/cleoidle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        // The ball glows gold — a kind reading.
        attack: { src: 'assets/heroes/Cleo/cleoskill1.png', frames: 'auto', fps: 10,
                  loop: false, hitFrame: 5 },
        // The flame swirls higher — two fates read at once.
        skill2: { src: 'assets/heroes/Cleo/cleoskill2.png', frames: 'auto', fps: 10,
                  loop: false, hitFrame: 5 },
        // Wisps fly out of the ball and come back with stolen luck.
        skill3: { src: 'assets/heroes/Cleo/cleoskill3.png', frames: 'auto', fps: 10,
                  loop: false, hitFrame: 6 },
        // The ball flares, bursts, and the reading ends.
        death: { src: 'assets/heroes/Cleo/cleodeath.png', frames: 'auto', fps: 8,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'cleo_kind_fortune', name: 'A Kind Fortune',
        icon: 'assets/icons/fc1051.png',
        description: 'The ball finds whoever needs it most: heals the ' +
          'lowest-HP ally for 20% of their max HP.',
        cooldown: 0, targeting: 'lowest-allies', allyCount: 1, animation: 'attack',
        effects: [
          { type: 'healHpPct', targetPct: 0.20 },
        ],
      },
      {
        id: 'cleo_twin_fates', name: 'Twin Fates',
        icon: 'assets/icons/fc1052.png',
        description: 'Two readings at once: heals the 2 lowest-HP allies ' +
          'for 25% of their max HP each and lifts one debuff from each.',
        cooldown: 3, targeting: 'lowest-allies', allyCount: 2, animation: 'skill2',
        effects: [
          { type: 'healHpPct', targetPct: 0.25 },
          { type: 'cleanse', count: 1 },
        ],
      },
      {
        id: 'cleo_fortunes_reversed', name: 'Fortunes Reversed',
        icon: 'assets/icons/fc1053.png',
        description: 'The wisps fly out and come back with stolen luck: ' +
          'strips one buff from every enemy.',
        cooldown: 5, targeting: 'all-enemies', animation: 'skill3',
        effects: [
          { type: 'stripBuffs', count: 1 },
        ],
      },
    ],
    passive: {
      name: 'Read the Flames',
      icon: 'assets/icons/fc1063.png',
      description: 'Every fire tells her something: each time an enemy ' +
        'takes burn damage, the lowest-HP ally is healed for 5% of ' +
        'their max HP.',
      hooks: {
        onEnemyBurnTick(unit, { battle }) {
          if (!unit.alive || !battle) return;
          const low = battle.livingUnits(unit.team)
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
          if (!low || low.hp >= low.maxHp) return;
          const healed = low.heal(Math.round(low.maxHp * 0.05), unit);
          if (healed > 0) {
            battle.addFloatingText(low, `+${healed}`, '#8ae88a');
          }
        },
      },
    },
    positional: POSITIONALS.cruel_fortune,
  },

  artur: {
    id: 'artur',
    element: 'light',
    name: 'Artur',
    title: 'Scribe of Reverence',
    rarity: 3,
    // Back-line tempo support: he writes allies' turns into the record
    // early, sharpens their crits by annotation, and what he has set
    // down in permanent ink no enemy can scratch out — the team's turn
    // meters cannot be drained while he stands.
    role: 'support',
    stats: { hp: 1650, atk: 115, def: 125, speed: 112 },
    tint: { body: '#ece8dc', helm: '#d8ceb4', weapon: '#e8b04a', skin: '#e8c0a0' },
    sprite: {
      displayH: 92,
      // Authored facing left — flagged, not mirrored into the files;
      // Sprites.facesLeft() flips him right.
      faceLeft: true,
      strips: {
        idle:  { src: 'assets/heroes/Artur/arturidle.png', frames: 'auto', fps: 7, loop: true },
        idle2: { src: 'assets/heroes/Artur/arturidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Artur/arturidle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        // The quill flicks a margin note into the air.
        attack: { src: 'assets/heroes/Artur/arturskill1.png', frames: 'auto', fps: 10,
                  loop: false, hitFrame: 5 },
        // The page takes its gold leaf.
        skill2: { src: 'assets/heroes/Artur/arturskill2.png', frames: 'auto', fps: 10,
                  loop: false, hitFrame: 5 },
        // The page turns for everyone at once.
        skill3: { src: 'assets/heroes/Artur/arturskill3.png', frames: 'auto', fps: 10,
                  loop: false, hitFrame: 5 },
        death: { src: 'assets/heroes/Artur/arturdeath.png', frames: 'auto', fps: 8,
                 loop: false, freeze: true },
      },
    },
    abilities: [
      {
        id: 'artur_margin_note', name: 'Margin Note',
        icon: 'assets/icons/fc1064.png',
        description: "A sharp annotation in one ally's margin: +30% Crit " +
          'Chance for 2 turns and 30% turn meter at once.',
        cooldown: 0, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'buff', stat: 'critChance', add: 0.30, turns: 2 },
          { type: 'turnMeter', amount: 0.30 },
        ],
      },
      {
        id: 'artur_illuminated_letter', name: 'Illuminated Letter',
        icon: 'assets/icons/fc1065.png',
        description: "Gold leaf on one ally's initial: +60% Crit Damage " +
          'for 2 turns and 30% turn meter at once.',
        cooldown: 3, targeting: 'ally', animation: 'skill2',
        effects: [
          { type: 'buff', stat: 'critDamage', add: 0.60, turns: 2 },
          { type: 'turnMeter', amount: 0.30 },
        ],
      },
      {
        id: 'artur_turn_the_page', name: 'Turn the Page',
        icon: 'assets/icons/fc1067.png',
        description: 'The whole chapter advances: every ally gains 15% ' +
          'turn meter.',
        cooldown: 5, targeting: 'all-allies', animation: 'skill3',
        effects: [
          { type: 'turnMeter', amount: 0.15 },
        ],
      },
    ],
    passive: {
      name: 'Permanent Ink',
      icon: 'assets/icons/fc1068.png',
      description: 'What Artur has written stands: effects that would ' +
        "drain his team's turn meters are refused while he lives.",
      hooks: {
        // Presence hook: Abilities.meterGuarded() looks for it on any
        // living teammate before letting a drain through.
        meterGuard: true,
      },
    },
    positional: POSITIONALS.shorthand,
  },

  tumble: {
    id: 'tumble',
    element: 'wind',
    name: 'Tumble',
    title: 'Whirling Dervish of the Whisperchime',
    rarity: 4,
    // Center-hex support who fights by never stopping. He owns exactly
    // two poses — a spin and a fall — so every skill he throws is the
    // same whirl seen from a different distance. What the whirl does is
    // take things away: blessings off the front rank, then the ground
    // itself, turning the enemy formation a hex at a time so their wall
    // ends up in the back and their casters end up in front.
    stats: { hp: 1750, atk: 130, def: 120, speed: 118 },
    tint: { body: '#5a8a3a', helm: '#8a6a3a', weapon: '#e8e4d8', skin: '#e8c8a8' },
    sprite: {
      displayH: 96,
      // Measured 23, but his idle is drawn mid-air above his own
      // leaf-spin. A grounded disc that size reads as him standing
      // in a hole; pulled in so he floats.
      shadowScale: 0.8,
      // Two strips, and only two: the spin and the death. Every action
      // animation points AT THE SPIN on purpose — he is mid-tumble for
      // everything he does, so a skill is one full revolution and then
      // back to idling. (The idle file ships as 'tumbeidle.png'.)
      strips: {
        idle:   { src: 'assets/heroes/Tumble/tumbeidle.png', frames: 'auto', fps: 10, loop: true },
        attack: { src: 'assets/heroes/Tumble/tumbeidle.png', frames: 'auto', fps: 16, loop: false },
        skill2: { src: 'assets/heroes/Tumble/tumbeidle.png', frames: 'auto', fps: 14, loop: false },
        skill3: { src: 'assets/heroes/Tumble/tumbeidle.png', frames: 'auto', fps: 18, loop: false },
        death:  { src: 'assets/heroes/Tumble/tumbledeath.png', frames: 'auto', fps: 10,
                  loop: false, freeze: true },
      },
    },
    role: 'support',
    abilities: [
      {
        id: 'tumble_passing_whirl', name: 'Passing Whirl',
        icon: 'assets/icons/fc1140.png',
        description: 'Whirl through the enemy front row for 50% ATK each, ' +
          'with a 50% chance to tear one blessing off each of them.',
        cooldown: 0, targeting: 'front-enemies', animation: 'attack', impact: 'slash',
        effects: [
          { type: 'damage', mult: 0.50 },
          { type: 'stripBuffs', count: 1, chance: 0.50 },
        ],
      },
      {
        id: 'tumble_quickstep', name: 'Quickstep',
        icon: 'assets/icons/fc1141.png',
        description: 'The whole troupe picks up his tempo: +30% Speed to ' +
          'every ally for 2 turns.',
        cooldown: 3, targeting: 'all-allies', animation: 'skill2',
        effects: [
          { type: 'buff', stat: 'speed', mult: 1.30, turns: 2 },
        ],
      },
      {
        id: 'tumble_carousel', name: 'Carousel',
        icon: 'assets/icons/fc1142.png',
        description: 'A spin wide enough to catch both outer rows for 50% ' +
          'ATK, and the whole enemy formation turns one hex clockwise ' +
          'around its middle — front ranks swung to the back, casters ' +
          'dragged to the front.',
        cooldown: 5, targeting: 'flank-enemies', animation: 'skill3', impact: 'slash',
        effects: [
          { type: 'damage', mult: 0.50 },
        ],
        // The spin itself lands once, after the sweep — not once per
        // fighter it clipped on the way round.
        selfEffects: [
          { type: 'rotateFormation', side: 'enemies', dir: 'cw' },
        ],
      },
    ],
    passive: {
      name: 'Chime Tax',
      icon: 'assets/icons/fc1160.png',
      description: 'Every blessing Tumble tears away pays him 10 turn ' +
        'meter — a busy front row spins him back around that much sooner.',
      hooks: {
        onStripBuff(unit, { count }) {
          if (!count || count <= 0) return null;
          unit.turnMeter = Math.min(CONFIG.TURN_METER_MAX,
            unit.turnMeter + CONFIG.TURN_METER_MAX * 0.10 * count);
          return null; // the strip line already says what happened
        },
      },
    },
    positional: POSITIONALS.eye_of_the_ring,
  },

  posie: {
    id: 'posie',
    element: 'wind',
    name: 'Posie',
    title: 'Boughbearer of the Whisperchime',
    rarity: 5,
    // Back-line healer who carries a flowering bough taller than she is
    // and swings it from one wounded ally to the next. Two of her heals
    // are measured off HER pool, so investing in her HP feeds the whole
    // party; the third is measured off the patient, so it lands hardest
    // on whoever has the most to lose. The bough does not stop where it
    // is pointed: it keeps swinging while the wind is with it.
    stats: { hp: 2350, atk: 120, def: 150, speed: 112 },
    tint: { body: '#4a7a3a', helm: '#e8dcc0', weapon: '#f0e8b8', skin: '#e8c8a8' },
    sprite: {
      displayH: 96,
      // Authored facing right, like the species packs — no flag.
      strips: {
        idle:  { src: 'assets/heroes/Posie/posieidle.png', frames: 'auto', fps: 7, loop: true },
        idle2: { src: 'assets/heroes/Posie/posieidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Posie/posieidle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        attack: { src: 'assets/heroes/Posie/posieskill1.png', frames: 'auto', fps: 10,
                  loop: false },
        skill2: { src: 'assets/heroes/Posie/posieskill2.png', frames: 'auto', fps: 10,
                  loop: false },
        skill3: { src: 'assets/heroes/Posie/posieskill3.png', frames: 'auto', fps: 8,
                  loop: false },
        death:  { src: 'assets/heroes/Posie/posiedeath.png', frames: 'auto', fps: 8,
                  loop: false, freeze: true },
      },
    },
    role: 'support',
    abilities: [
      {
        id: 'posie_bloom', name: 'Bloom',
        icon: 'assets/icons/fc1170.png',
        description: "Tip the bough over one ally: heals them for 20% of " +
          "Posie's own max HP.",
        cooldown: 0, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.20 },
        ],
      },
      {
        id: 'posie_windfall', name: 'Windfall',
        icon: 'assets/icons/fc1171.png',
        description: 'Heal one ally for 20% of THEIR own max HP — and the ' +
          'bough has a 50% chance to swing on to the lowest-HP ally and ' +
          'heal again, over and over while the rolls hold.',
        cooldown: 3, targeting: 'ally', animation: 'skill2',
        effects: [
          { type: 'healHpPct', targetPct: 0.20 },
        ],
        // The swing is the skill: it re-casts ITSELF on whoever is worst
        // off, and keeps going. The rail is set far past where a run of
        // coin flips realistically reaches (12 links is one in 4,096).
        chain: { id: 'posie_windfall', chance: 0.50, to: 'lowest-ally', maxDepth: 12 },
      },
      {
        id: 'posie_high_summer', name: 'High Summer',
        icon: 'assets/icons/fc1172.png',
        description: "The whole bough opens at once: heal every ally for " +
          "25% of Posie's max HP and raise their Resistance by 30% for 2 turns.",
        cooldown: 5, targeting: 'all-allies', animation: 'skill3',
        effects: [
          { type: 'healHpPct', pct: 0.25 },
          { type: 'buff', stat: 'resistance', add: 0.30, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Nothing Falls Far',
      icon: 'assets/icons/fc1180.png',
      description: 'Healing past full is not spilled: the overflow settles ' +
        'on that ally as a shield for 2 turns.',
      hooks: {
        onOverheal(unit, { overflow, target }) {
          if (!target || overflow <= 0) return;
          target.addShield(overflow, 2, unit);
        },
      },
    },
    positional: POSITIONALS.bough_bearer,
  },

  galen: {
    id: 'galen',
    element: 'wind',
    name: 'Galen',
    title: 'Pinwheel of the Whisperchime',
    rarity: 3,
    // Back-line damage on a pinwheel staff. The sect takes things away;
    // Galen is the one who profits from having taken them. Two of his
    // three skills tear blessings off, and everything he throws lands
    // harder on an enemy already stripped bare.
    stats: { hp: 1450, atk: 175, def: 95, speed: 114 },
    tint: { body: '#3a6a4a', helm: '#e8e4d8', weapon: '#c8b45a', skin: '#e8c8a8' },
    sprite: {
      displayH: 96,
      // Authored facing right — the pinwheel swings that way. No flag.
      strips: {
        idle:  { src: 'assets/heroes/Galen/galenidle.png', frames: 'auto', fps: 7, loop: true },
        idle2: { src: 'assets/heroes/Galen/galenidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Galen/galenidle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        attack: { src: 'assets/heroes/Galen/galenskill1.png', frames: 'auto', fps: 12,
                  loop: false },
        skill2: { src: 'assets/heroes/Galen/galenskill2.png', frames: 'auto', fps: 12,
                  loop: false },
        skill3: { src: 'assets/heroes/Galen/galenskill3.png', frames: 'auto', fps: 12,
                  loop: false },
        death:  { src: 'assets/heroes/Galen/galendeath.png', frames: 'auto', fps: 10,
                  loop: false, freeze: true },
      },
    },
    role: 'dps',
    abilities: [
      {
        id: 'galen_gust', name: 'Gust',
        icon: 'assets/icons/fc1190.png',
        description: 'Let the pinwheel choose: 125% ATK to a RANDOM enemy.',
        cooldown: 0, targeting: 'random-enemies', animation: 'attack', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.25 },
        ],
      },
      {
        id: 'galen_stripwind', name: 'Stripwind',
        icon: 'assets/icons/fc1191.png',
        description: 'A cutting pass on one enemy: 140% ATK, and two ' +
          'blessings are torn away.',
        cooldown: 3, targeting: 'enemy', animation: 'skill2', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.40 },
          { type: 'stripBuffs', count: 2 },
        ],
      },
      {
        id: 'galen_squall', name: 'Squall',
        icon: 'assets/icons/fc1192.png',
        description: 'The wind reaches over the wall: 120% ATK to the ' +
          'enemy BACK row, tearing one blessing off each of them.',
        cooldown: 5, targeting: 'back-enemies', animation: 'skill3', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.20 },
          { type: 'stripBuffs', count: 1 },
        ],
      },
    ],
    passive: {
      name: 'Bare Branches',
      icon: 'assets/icons/fc1200.png',
      description: 'Deals 25% extra damage to enemies carrying no buffs — ' +
        'what the wind has already stripped, it breaks.',
      hooks: {
        damageDealtMult(unit, target) {
          if (!target) return 1;
          return target.statusEffects.some((fx) => fx.kind === 'buff') ? 1 : 1.25;
        },
      },
    },
    positional: POSITIONALS.weathervane,
  },

  ilyra: {
    id: 'ilyra',
    element: 'wind',
    name: 'Ilyra',
    title: 'Windward of the Whisperchime',
    rarity: 3,
    // Back-line cleanser. Every skill she has does the same two things
    // at a widening scope — a measure of healing off her own pool, and
    // one curse lifted — so the question with Ilyra is never WHAT she
    // does, only how many people she does it to. Her passive turns the
    // enemy's debuffing against them: every hex laid on her side hands
    // her the meter to answer it.
    stats: { hp: 1900, atk: 105, def: 135, speed: 110 },
    tint: { body: '#6b8a3a', helm: '#f2ede0', weapon: '#d88ab8', skin: '#e8c8a8' },
    sprite: {
      displayH: 96,
      // Authored facing right (her cast reaches to the right of
      // frame) — no flag. Seven strips, nine frames each.
      strips: {
        idle:  { src: 'assets/heroes/Ilyra/ilyraidle.png', frames: 'auto', fps: 7, loop: true },
        idle2: { src: 'assets/heroes/Ilyra/ilyraidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Ilyra/ilyraidle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        attack: { src: 'assets/heroes/Ilyra/ilyraskill1.png', frames: 'auto', fps: 10,
                  loop: false },
        skill2: { src: 'assets/heroes/Ilyra/ilyraskill2.png', frames: 'auto', fps: 10,
                  loop: false },
        skill3: { src: 'assets/heroes/Ilyra/ilyraskill3.png', frames: 'auto', fps: 10,
                  loop: false },
        death:  { src: 'assets/heroes/Ilyra/ilyradeath.png', frames: 'auto', fps: 8,
                  loop: false, freeze: true },
      },
    },
    role: 'support',
    abilities: [
      {
        id: 'ilyra_clear_sky', name: 'Clear Sky',
        icon: 'assets/icons/fc1210.png',
        description: "One ally is aired out: heals for 15% of Ilyra's own " +
          'max HP and lifts one debuff.',
        cooldown: 0, targeting: 'ally', animation: 'attack',
        effects: [
          { type: 'healHpPct', pct: 0.15 },
          { type: 'cleanse', count: 1 },
        ],
      },
      {
        id: 'ilyra_following_wind', name: 'Following Wind',
        icon: 'assets/icons/fc1211.png',
        description: "The front rank gets the weather at its back: heals " +
          "the FRONT row for 20% of Ilyra's max HP each and lifts one " +
          'debuff from each.',
        cooldown: 3, targeting: 'front-allies', animation: 'skill2',
        effects: [
          { type: 'healHpPct', pct: 0.20 },
          { type: 'cleanse', count: 1 },
        ],
      },
      {
        id: 'ilyra_changing_weather', name: 'Changing Weather',
        icon: 'assets/icons/fc1212.png',
        description: "The whole field turns over: heals EVERY ally for 15% " +
          "of Ilyra's max HP and lifts one debuff from each.",
        cooldown: 5, targeting: 'all-allies', animation: 'skill3',
        effects: [
          { type: 'healHpPct', pct: 0.15 },
          { type: 'cleanse', count: 1 },
        ],
      },
    ],
    passive: {
      name: 'Kindly Hours',
      icon: 'assets/icons/fc1220.png',
      description: 'Every debuff laid on her side hands Ilyra 10 turn ' +
        'meter — the more the enemy curses her team, the sooner she is ' +
        'up to undo it.',
      hooks: {
        onAllyDebuffed(unit) {
          unit.turnMeter = Math.min(CONFIG.TURN_METER_MAX,
            unit.turnMeter + CONFIG.TURN_METER_MAX * 0.10);
        },
      },
    },
    positional: POSITIONALS.still_air,
  },

  ryn: {
    id: 'ryn',
    element: 'wind',
    name: 'Ryn',
    title: 'Crosswind of the Whisperchime',
    rarity: 4,
    // Front-line damage with no utility at all and no apology for it.
    // Her whole kit is three swings of the same pair of chakrams; what
    // makes her frightening is the passive underneath them, which reads
    // her SPEED and pays it back as damage in steps. Every point of
    // haste on this hero — gear, her own hex, an ally's tempo buff — is
    // damage waiting for the next breakpoint.
    stats: { hp: 1900, atk: 180, def: 125, speed: 128 },
    tint: { body: '#4a6a3a', helm: '#c8b45a', weapon: '#e8c86a', skin: '#8a5a3a' },
    sprite: {
      displayH: 96,
      // Authored facing RIGHT, like the rest of the Whisperchime
      // uploads — her stance, both chakrams and the Crosscut strike
      // frame all drive right of frame. She carried faceLeft: true for
      // a while, which is what made her fight backwards; the flag was
      // read off a wind-up frame rather than the swing. No flag.
      strips: {
        idle:  { src: 'assets/heroes/Ryn/rynidle.png', frames: 'auto', fps: 7, loop: true },
        idle2: { src: 'assets/heroes/Ryn/rynidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Ryn/rynidle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        attack: { src: 'assets/heroes/Ryn/rynskill1.png', frames: 'auto', fps: 14,
                  loop: false },
        skill2: { src: 'assets/heroes/Ryn/rynskill2.png', frames: 'auto', fps: 14,
                  loop: false },
        skill3: { src: 'assets/heroes/Ryn/rynskill3.png', frames: 'auto', fps: 14,
                  loop: false },
        death:  { src: 'assets/heroes/Ryn/ryndeath.png', frames: 'auto', fps: 8,
                  loop: false, freeze: true },
      },
    },
    role: 'dps',
    abilities: [
      {
        id: 'ryn_crosscut', name: 'Crosscut', 
        icon: 'assets/icons/fc1230.png',
        description: 'One clean pass of both chakrams: 100% ATK to a single enemy.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.00 },
        ],
      },
      {
        id: 'ryn_shear', name: 'Shear',
        icon: 'assets/icons/fc1231.png',
        description: 'Both blades through the same gap: 140% ATK to a single enemy.',
        cooldown: 3, targeting: 'enemy', animation: 'skill2', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.40 },
        ],
      },
      {
        id: 'ryn_scything_gale', name: 'Scything Gale',
        icon: 'assets/icons/fc1232.png',
        description: 'A running cut down the whole line: 130% ATK to the ' +
          'enemy FRONT row.',
        cooldown: 5, targeting: 'front-enemies', animation: 'skill3', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.30 },
        ],
      },
    ],
    passive: {
      name: 'Terminal Velocity',
      icon: 'assets/icons/fc1240.png',
      description: 'Deals 20% more damage for every full 50 SPD she has — ' +
        '+40% at 100, +60% at 150. Speed is her damage stat.',
      hooks: {
        damageDealtMult(unit) {
          // Read her speed AS FOUGHT: gear, her front hex and any ally's
          // tempo buff all count, so a Quickstep can carry her over the
          // next breakpoint mid-fight.
          const spd = unit.effectiveStat ? unit.effectiveStat('speed') : 0;
          return 1 + 0.20 * Math.floor(spd / 50);
        },
      },
    },
    positional: POSITIONALS.headwind,
  },

  imani: {
    id: 'imani',
    element: 'wind',
    name: 'Imani',
    title: 'Chimewright of the Whisperchime',
    rarity: 4,
    // The sect's namesake, sitting cross-legged behind a bar of bells
    // she never stops ringing. Two of her three skills choose their own
    // victims — the chime rings for whoever it rings for — and her
    // passive is the exact inverse of Galen's: where he breaks what has
    // been stripped bare, Imani hits hardest into an enemy still
    // wearing everything their supports gave them.
    stats: { hp: 1850, atk: 175, def: 120, speed: 116 },
    tint: { body: '#4a6a3a', helm: '#f0ece0', weapon: '#e8c86a', skin: '#a06a4a' },
    sprite: {
      // 67, not the roster's usual 96 — a 30% cut. displayH scales by
      // HEIGHT, and she is the only hero drawn seated: her frame is all
      // torso and a bell bar that spans 225 of its 256px, where a
      // standing hero like Ryn spans 184. Matching her height to theirs
      // therefore made her read half again as wide on the board. The
      // art is untouched; this is the display size only.
      displayH: 67,
      // Authored facing right (her cast reaches right of frame); she is
      // near enough frontal either way. No flag.
      strips: {
        idle:  { src: 'assets/heroes/Imani/imaniidle.png', frames: 'auto', fps: 7, loop: true },
        idle2: { src: 'assets/heroes/Imani/imaniidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Imani/imaniidle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        attack: { src: 'assets/heroes/Imani/imaniskill1.png', frames: 'auto', fps: 11,
                  loop: false },
        skill2: { src: 'assets/heroes/Imani/imaniskill2.png', frames: 'auto', fps: 11,
                  loop: false },
        skill3: { src: 'assets/heroes/Imani/imaniskill3.png', frames: 'auto', fps: 11,
                  loop: false },
        death:  { src: 'assets/heroes/Imani/imanideath.png', frames: 'auto', fps: 8,
                  loop: false, freeze: true },
      },
    },
    role: 'dps',
    abilities: [
      {
        id: 'imani_single_note', name: 'Single Note',
        icon: 'assets/icons/fc1250.png',
        description: 'One bell, struck clean: 125% ATK to a single enemy.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.25 },
        ],
      },
      {
        id: 'imani_two_bells', name: 'Two Bells',
        icon: 'assets/icons/fc1251.png',
        description: 'The bar swings twice: 130% ATK to TWO random enemies.',
        cooldown: 3, targeting: 'random-enemies', targetCount: 2,
        animation: 'skill2', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.30 },
        ],
      },
      {
        id: 'imani_full_peal', name: 'All The Bells',
        icon: 'assets/icons/fc1252.png',
        description: 'Every bell at once: 130% ATK to THREE random ' +
          'enemies, and the sound drags at them — -30% Speed for 2 turns.',
        cooldown: 5, targeting: 'random-enemies', targetCount: 3,
        animation: 'skill3', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.30 },
          { type: 'debuff', stat: 'speed', mult: 0.70, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Answering Bells',
      icon: 'assets/icons/fc1260.png',
      description: 'Deals 20% extra damage for every buff the target is ' +
        'carrying — the more their supports have given them, the louder ' +
        'the bells answer.',
      hooks: {
        damageDealtMult(unit, target) {
          if (!target) return 1;
          const buffs = target.statusEffects.filter((fx) => fx.kind === 'buff').length;
          return 1 + 0.20 * buffs;
        },
      },
    },
    positional: POSITIONALS.chime_bar,
  },

  sable: {
    id: 'sable',
    element: 'dark',
    name: 'Sable',
    title: 'Gravetender of the Nightflowers',
    rarity: 3,
    // A back-line dark carry who does not so much attack as PLANT.
    // Every swing seeds ordinary poison -- the same plate a player
    // already knows on sight, not a recoloured one -- and his second
    // skill is the flower opening: every poison on the field comes due
    // at once. Nothing is wasted when a seeded enemy falls, because
    // that is exactly when he is paid.
    stats: { hp: 1350, atk: 180, def: 90, speed: 108 },
    tint: { body: '#2a2038', helm: '#6a4a8a', weapon: '#e8d8f0', skin: '#e8d8c8' },
    sprite: {
      displayH: 96,
      strips: {
        idle:  { src: 'assets/heroes/Sable/sableidle.png', frames: 'auto', fps: 7, loop: true },
        idle2: { src: 'assets/heroes/Sable/sableidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Sable/sableidle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        attack: { src: 'assets/heroes/Sable/sableskill1.png', frames: 'auto', fps: 11,
                  loop: false },
        skill2: { src: 'assets/heroes/Sable/sableskill2.png', frames: 'auto', fps: 11,
                  loop: false },
        skill3: { src: 'assets/heroes/Sable/sableskill3.png', frames: 'auto', fps: 11,
                  loop: false },
        death:  { src: 'assets/heroes/Sable/sabledeath.png', frames: 'auto', fps: 8,
                  loop: false, freeze: true },
      },
    },
    role: 'dps',
    abilities: [
      {
        id: 'sable_seedfall', name: 'Seedfall',
        icon: 'assets/icons/fc1283.png',
        description: 'Scatters seed across the field: 70% ATK to two random ' +
          'enemies, each left poisoned for 30% ATK a turn over 3 turns.',
        cooldown: 0, targeting: 'random-enemies', targetCount: 2,
        animation: 'attack', impact: 'strike_purple',
        effects: [
          { type: 'damage', mult: 0.70 },
          { type: 'dot', pct: 0.30, turns: 3 },
        ],
      },
      {
        id: 'sable_open_the_flower', name: 'Open The Flower',
        icon: 'assets/icons/fc1284.png',
        description: 'The bloom on his staff opens and every seeded enemy ' +
          'answers: all poison on the field comes due at once, dealing every ' +
          'remaining tick immediately and burning itself out.',
        cooldown: 3, targeting: 'all-enemies', animation: 'skill2',
        effects: [
          { type: 'detonate' },
        ],
      },
      {
        id: 'sable_grave_garden', name: 'Grave Garden',
        icon: 'assets/icons/fc1285.png',
        description: 'The whole field goes to seed: 110% ATK to every enemy, ' +
          'and each is poisoned for 30% ATK a turn over 3 turns.',
        cooldown: 5, targeting: 'all-enemies', animation: 'skill3',
        impact: 'strike_purple',
        effects: [
          { type: 'damage', mult: 1.10 },
          { type: 'dot', pct: 0.30, turns: 3 },
        ],
      },
    ],
    passive: {
      name: 'What Grows Back',
      icon: 'assets/icons/fc1286.png',
      description: 'Nothing seeded is ever wasted: whenever a poisoned enemy ' +
        'dies, Sable gains 15 AP.',
      hooks: {
        onUnitDied(unit, { victim }) {
          if (!victim || victim.team === unit.team) return null;
          if (!victim.statusEffects.some((fx) => fx.kind === 'dot')) return null;
          unit.turnMeter = Math.min(CONFIG.TURN_METER_MAX,
            unit.turnMeter + CONFIG.TURN_METER_MAX * 0.15);
          return { floats: [{ target: unit, text: '\u2740 +15 AP', color: '#c79aff' }] };
        },
      },
    },
    positional: POSITIONALS.deep_roots,
  },

  evelune: {
    id: 'evelune',
    element: 'dark',
    name: 'Evelune',
    title: 'First Chair of the Nightflowers',
    rarity: 4,
    // The sect's amplifier, and the first hero who creates almost
    // nothing of her own. She hands the team its cooldowns back early,
    // holds everyone else's blessings a turn longer, and carries a
    // quarter of every blessing to a second ally. On a team with
    // nothing to amplify she is a mediocre 4-star; on a team full of
    // supports she is the reason the whole thing runs.
    stats: { hp: 1800, atk: 135, def: 130, speed: 118 },
    tint: { body: '#3a2a52', helm: '#e8e0f0', weapon: '#8a6a4a', skin: '#c89a78' },
    sprite: {
      displayH: 96,
      strips: {
        idle:  { src: 'assets/heroes/Evelune/eveluneidle.png', frames: 'auto', fps: 7, loop: true },
        idle2: { src: 'assets/heroes/Evelune/eveluneidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Evelune/eveluneidle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        attack: { src: 'assets/heroes/Evelune/eveluneskill1.png', frames: 'auto', fps: 11,
                  loop: false },
        skill2: { src: 'assets/heroes/Evelune/eveluneskill2.png', frames: 'auto', fps: 11,
                  loop: false },
        skill3: { src: 'assets/heroes/Evelune/eveluneskill3.png', frames: 'auto', fps: 10,
                  loop: false },
        death:  { src: 'assets/heroes/Evelune/evelunedeath.png', frames: 'auto', fps: 8,
                  loop: false, freeze: true },
      },
    },
    role: 'support',
    abilities: [
      {
        id: 'evelune_struck_note', name: 'Struck Note',
        icon: 'assets/icons/fc1287.png',
        description: 'One note, struck hard: 130% ATK to a single enemy, and ' +
          'the discord costs them 20 AP.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'strike_purple',
        effects: [
          { type: 'damage', mult: 1.30 },
          { type: 'turnMeter', amount: -0.20 },
        ],
      },
      {
        id: 'evelune_play_it_again', name: 'Play It Again',
        icon: 'assets/icons/fc1288.png',
        description: 'The same phrase, sooner: every ally gets 1 turn back ' +
          'off all of their cooldowns.',
        cooldown: 4, targeting: 'all-allies', animation: 'skill2',
        effects: [
          { type: 'cooldownReduce', turns: 1 },
        ],
      },
      {
        id: 'evelune_hold_the_chord', name: 'Hold The Chord',
        icon: 'assets/icons/fc1289.png',
        description: 'A chord held open over the whole line: mends every ally ' +
          "for 15% of Evelune's max HP, and every blessing the team is " +
          'wearing lasts 1 turn longer.',
        cooldown: 5, targeting: 'all-allies', animation: 'skill3', impact: 'heal_purple',
        effects: [
          { type: 'healHpPct', pct: 0.15 },
          { type: 'extendBuffs', turns: 1 },
        ],
      },
    ],
    passive: {
      name: 'The Chord Carries',
      icon: 'assets/icons/fc1290.png',
      description: 'A note struck on one string sounds the next: every buff ' +
        'that lands on an ally has a 25% chance to also land on another ' +
        'ally, with the time it had left.',
      hooks: {
        onAllyBuffed(unit, { receiver, effect, battle }) {
          if (!battle || !effect || effect.kind !== 'buff') return null;
          if (Math.random() >= 0.25) return null;
          const others = battle.livingUnits(unit.team)
            .filter((u) => u !== receiver && !u.buffsSealed());
          if (others.length === 0) return null;
          const to = others[Math.floor(Math.random() * others.length)];
          // The copy carries the same terms and the same time; its
          // source stays whoever earned the credit for the original.
          to.addStatusEffect({ ...effect });
          return { floats: [{ target: to, text: '\u266a CARRIES', color: '#ffd76a' }] };
        },
      },
    },
    positional: POSITIONALS.first_chair,
  },

  lysandra: {
    id: 'lysandra',
    element: 'dark',
    name: 'Lysandra',
    title: 'Needleworker of the Nightflowers',
    rarity: 4,
    // A front-line carry whose damage is not really hers: she ties a
    // thread to one enemy, drags the rest of their line onto her
    // needle, and lets them kill their own carry by hitting her. Every
    // number in her statline is there to keep her standing while that
    // happens.
    stats: { hp: 1900, atk: 175, def: 155, speed: 108 },
    tint: { body: '#3a2a58', helm: '#e8e0f0', weapon: '#d8d0e8', skin: '#e8d0b8' },
    sprite: {
      displayH: 96,
      strips: {
        idle:  { src: 'assets/heroes/Lysandra/lysandraidle.png', frames: 'auto', fps: 7, loop: true },
        idle2: { src: 'assets/heroes/Lysandra/lysandraidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Lysandra/lysandraidle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        attack: { src: 'assets/heroes/Lysandra/lysandraskill1.png', frames: 'auto', fps: 11,
                  loop: false },
        skill2: { src: 'assets/heroes/Lysandra/lysandraskill2.png', frames: 'auto', fps: 11,
                  loop: false },
        skill3: { src: 'assets/heroes/Lysandra/lysandraskill3.png', frames: 'auto', fps: 11,
                  loop: false },
        death:  { src: 'assets/heroes/Lysandra/lysandradeath.png', frames: 'auto', fps: 10,
                  loop: false, freeze: true },
      },
    },
    role: 'dps',
    abilities: [
      {
        id: 'lysandra_running_stitch', name: 'Running Stitch',
        icon: 'assets/icons/fc1291.png',
        description: 'One clean stitch: 130% ATK to a single enemy, and ' +
          'Lysandra mends for 20% of what it cost them.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'strike_purple',
        effects: [
          { type: 'damage', mult: 1.30, healDealt: { to: 'self', frac: 0.20 } },
        ],
      },
      {
        id: 'lysandra_slip_knot', name: 'Slip Knot',
        icon: 'assets/icons/fc1292.png',
        description: 'A loop thrown over the whole line: 110% ATK to the ' +
          'enemy FRONT row, and every one of them is taunted onto her ' +
          'needle for 1 turn.',
        cooldown: 3, targeting: 'front-enemies', animation: 'skill2', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.10 },
          { type: 'debuff', stat: 'taunted', turns: 1 },
        ],
      },
      {
        id: 'lysandra_soul_bond', name: 'Soul Bond',
        icon: 'assets/icons/fc1293.png',
        // The gate, not a cooldown: one thread at a time.
        blockedWhile: 'soulbond',
        description: 'The knot tied off: 160% ATK to a single enemy and a ' +
          'thread run through them. While it holds, every point of damage ' +
          'Lysandra takes is dealt to them as well, unmitigated. She cannot ' +
          'throw a second thread until that one is dead or cut.',
        cooldown: 5, targeting: 'enemy', animation: 'skill3', impact: 'strike_purple',
        effects: [
          { type: 'damage', mult: 1.60 },
          { type: 'soulBond' },
        ],
      },
    ],
    passive: {
      name: 'Pull It Taut',
      icon: 'assets/icons/fc1294.png',
      description: 'Committed while the thread is tied: +25% ATK and +25% ' +
        'DEF for as long as a Soul Bond of hers is still on something living.',
      hooks: {
        statMult(unit, stat) {
          if (stat !== 'atk' && stat !== 'def') return 1;
          const b = typeof Battle !== 'undefined' ? Battle.active : null;
          if (!b) return 1;
          const tied = b.livingUnits().some((u) => u !== unit &&
            u.statusEffects.some((fx) => fx.stat === 'soulbond' && fx.source === unit));
          return tied ? 1.25 : 1;
        },
      },
    },
    positional: POSITIONALS.spool,
  },

  morrow: {
    id: 'morrow',
    element: 'dark',
    name: 'Morrow',
    title: 'Pallbearer of the Nightflowers',
    rarity: 4,
    // The sect's gravedigger, and the body it was missing. Everything
    // he throws is priced off his DEF, so the gear that keeps him
    // standing is the gear that hits; he volunteers for the whole enemy
    // team at once and gets fed by every corpse it makes, whoever it
    // belonged to. His last swing is the weight of all of them.
    stats: { hp: 2500, atk: 110, def: 175, speed: 90 },
    tint: { body: '#2e2440', helm: '#c8a84a', weapon: '#8a7ab8', skin: '#d8c8b0' },
    sprite: {
      displayH: 96,
      strips: {
        idle:  { src: 'assets/heroes/Morrow/morrowidle.png', frames: 'auto', fps: 7, loop: true },
        idle2: { src: 'assets/heroes/Morrow/morrowidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Morrow/morrowidle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        attack: { src: 'assets/heroes/Morrow/morrowskill1.png', frames: 'auto', fps: 11,
                  loop: false },
        skill2: { src: 'assets/heroes/Morrow/morrowskill2.png', frames: 'auto', fps: 11,
                  loop: false },
        skill3: { src: 'assets/heroes/Morrow/morrowskill3.png', frames: 'auto', fps: 10,
                  loop: false },
        death:  { src: 'assets/heroes/Morrow/morrowdeath.png', frames: 'auto', fps: 8,
                  loop: false, freeze: true },
      },
    },
    role: 'tank',
    abilities: [
      {
        id: 'morrow_groundbreak', name: 'Groundbreak',
        icon: 'assets/icons/fc1295.png',
        description: 'The maul comes down: 70% DEF to the enemy FRONT row, ' +
          "and something grows where it landed — Morrow mends 8% of his " +
          'own max HP.',
        cooldown: 0, targeting: 'front-enemies', animation: 'attack', impact: 'slam',
        effects: [
          { type: 'damageDef', mult: 0.70 },
        ],
        selfEffects: [
          { type: 'healHpPct', pct: 0.08 },
        ],
        // Both halves of the skill level, at their own rates: the DEF
        // damage in tens, the HP-priced mend in fives. 70% -> 100% DEF
        // and 8% -> 18% of his pool.
        levelUps: [
          { mult: 0.10 }, { mult: 0.10 }, { mult: 0.10 },
          { heal: 0.05 }, { heal: 0.05 },
        ],
      },
      {
        id: 'morrow_wisteria', name: 'Wisteria',
        icon: 'assets/icons/fc1296.png',
        description: 'The garden on his back comes into flower: each enemy has ' +
          'a 50% chance to be taunted onto him for 1 turn, and Morrow takes ' +
          '+50% DEF for 2 turns.',
        // Base cooldown raised 5 -> 6; the last two rungs land it at 4.
        cooldown: 6, targeting: 'all-enemies', animation: 'skill2',
        effects: [
          { type: 'debuff', stat: 'taunted', turns: 1, chance: 0.5 },
        ],
        selfEffects: [
          { type: 'buff', stat: 'def', mult: 1.50, turns: 2 },
        ],
        // The one skill on the roster that carries a debuff and a buff at
        // once, which is why the duration rung is buff-only: rung 4
        // lengthens his ward to 3 turns and deliberately leaves the taunt
        // at 1. A taunt has no `mult`, so severity is not available to it
        // -- chance is its whole ladder.
        levelUps: [
          { debuffChance: 0.20 },
          { debuffChance: 0.20 },
          { debuffChance: 0.10 },
          { duration: 1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
      {
        id: 'morrow_pallbearer', name: 'Pallbearer',
        icon: 'assets/icons/fc1297.png',
        description: 'He brings down everything he has had to carry: 200% DEF ' +
          'to a single enemy, and 20% DEF more for every unit that has ' +
          'fallen this fight, either side.',
        // Base cooldown raised 6 -> 7; fully levelled it cycles at 5.
        cooldown: 7, targeting: 'enemy', animation: 'skill3', impact: 'slam',
        effects: [
          { type: 'damageDef', mult: 2.00, perDeath: 0.20 },
        ],
        // Both halves again, same rule as Aniani's mirrors: the per-death
        // term is what makes this skill his, so a rung that only raised
        // the flat part would be worth a fraction of the same rung
        // elsewhere. 200%+20/death becomes 250%+45/death.
        levelUps: [
          { mult: 0.10, perDeath: 0.05 },
          { mult: 0.10, perDeath: 0.05 },
          { mult: 0.10, perDeath: 0.05 },
          { mult: 0.10, perDeath: 0.05 },
          { mult: 0.10, perDeath: 0.05 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    passive: {
      name: 'Grave Soil',
      icon: 'assets/icons/fc1298.png',
      description: 'The garden does not ask whose corpse it was: whenever ' +
        'any unit on the field falls, friend or enemy, Morrow mends 10% of ' +
        'his max HP.',
      hooks: {
        onUnitDied(unit) {
          if (!unit.alive) return null;
          const mend = Math.max(1, Math.round(unit.maxHp * 0.10));
          const healed = unit.heal(mend, unit);
          if (healed <= 0) return null;
          return { floats: [{ target: unit, text: `+${healed}`, color: '#7ae87a' }] };
        },
      },
    },
    positional: POSITIONALS.mourners_row,
  },

  valere: {
    id: 'valere',
    element: 'dark',
    name: 'Valere',
    title: 'Suitor of the Nightflowers',
    rarity: 4,
    // Not a curse-flinger -- a suitor. Everything he does is presented
    // rather than thrown, and the point of him is that he opens the
    // door for the rest of the sect: strip the enemy's resistance and
    // Sable's poison, Lysandra's thread and Morrow's taunt all stick.
    // His last move is a two-way cleanse -- his own side walks away
    // clean and one of theirs wears the lot.
    stats: { hp: 1700, atk: 145, def: 125, speed: 114 },
    tint: { body: '#2a2140', helm: '#6a4a9a', weapon: '#e8e0f0', skin: '#e8d8c8' },
    sprite: {
      displayH: 96,
      strips: {
        idle:  { src: 'assets/heroes/Valere/valereidle.png', frames: 'auto', fps: 7, loop: true },
        idle2: { src: 'assets/heroes/Valere/valereidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Valere/valereidle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        attack: { src: 'assets/heroes/Valere/valereskill1.png', frames: 'auto', fps: 11,
                  loop: false },
        skill2: { src: 'assets/heroes/Valere/valereskill2.png', frames: 'auto', fps: 11,
                  loop: false },
        skill3: { src: 'assets/heroes/Valere/valereskill3.png', frames: 'auto', fps: 11,
                  loop: false },
        death:  { src: 'assets/heroes/Valere/valeredeath.png', frames: 'auto', fps: 8,
                  loop: false, freeze: true },
      },
    },
    role: 'support',
    abilities: [
      {
        id: 'valere_a_rose_for_you', name: 'A Rose For You',
        icon: 'assets/icons/fc1299.png',
        description: 'A gift they cannot refuse: 90% ATK to one enemy, and ' +
          'their ATK falls 30% for 2 turns.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'strike_purple',
        effects: [
          { type: 'damage', mult: 0.90 },
          { type: 'debuff', stat: 'atk', mult: 0.70, turns: 2 },
        ],
      },
      {
        id: 'valere_the_whole_bouquet', name: 'The Whole Bouquet',
        icon: 'assets/icons/fc1300.png',
        description: 'Every bloom at once: the WHOLE enemy team loses 30% ' +
          'Resistance and 20% DEF for 2 turns. Nothing they are handed ' +
          'after this is easy to refuse.',
        cooldown: 4, targeting: 'all-enemies', animation: 'skill2',
        effects: [
          { type: 'debuff', stat: 'resistance', add: -0.30, turns: 2 },
          { type: 'debuff', stat: 'def', mult: 0.80, turns: 2 },
        ],
      },
      {
        id: 'valere_something_rarer', name: 'Something Rarer',
        icon: 'assets/icons/fc1301.png',
        description: 'He presents one enemy with everything his own side was ' +
          'carrying: every debuff and poison on Valere\'s team moves onto ' +
          'them with the time it had left, and their DEF falls 30% for 3 ' +
          'turns regardless.',
        cooldown: 7, targeting: 'enemy', animation: 'skill3', impact: 'strike_purple',
        effects: [
          { type: 'debuff', stat: 'def', mult: 0.70, turns: 3 },
          { type: 'transferDebuffs' },
        ],
      },
    ],
    passive: {
      name: 'Nothing Is Refused',
      icon: 'assets/icons/fc1302.png',
      description: 'He cannot force the first flower on anyone — but a ' +
        'debuff he lays on an enemy already carrying one can never be ' +
        'resisted.',
      hooks: {
        noResistWhenAfflicted: true,
      },
    },
    positional: POSITIONALS.long_stems,
  },

  lenore: {
    id: 'lenore',
    element: 'dark',
    name: 'Lenore',
    title: 'Passing Bell of the Nightflowers',
    rarity: 3,
    // The sect's mourner, and the accessible half of its centre hex --
    // where Evelune sells tempo, Lenore sells bulk. Every figure she
    // heals is a share of her OWN pool, so the gear that keeps her
    // standing is the gear that mends. Her passive is the whole hero:
    // a bell rung for a death is a bell she gets to ring again sooner.
    stats: { hp: 1850, atk: 110, def: 140, speed: 106 },
    tint: { body: '#2c2244', helm: '#c8a84a', weapon: '#d8c078', skin: '#e8d8c8' },
    sprite: {
      displayH: 96,
      strips: {
        idle:  { src: 'assets/heroes/Lenore/lenoreidle.png', frames: 'auto', fps: 7, loop: true },
        idle2: { src: 'assets/heroes/Lenore/lenoreidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Lenore/lenoreidle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        attack: { src: 'assets/heroes/Lenore/lenoreskill1.png', frames: 'auto', fps: 10,
                  loop: false },
        skill2: { src: 'assets/heroes/Lenore/lenoreskill2.png', frames: 'auto', fps: 11,
                  loop: false },
        skill3: { src: 'assets/heroes/Lenore/lenoreskill3.png', frames: 'auto', fps: 11,
                  loop: false },
        death:  { src: 'assets/heroes/Lenore/lenoredeath.png', frames: 'auto', fps: 8,
                  loop: false, freeze: true },
      },
    },
    role: 'support',
    abilities: [
      {
        id: 'lenore_single_toll', name: 'Single Toll',
        icon: 'assets/icons/fc1303.png',
        description: 'One ring, for whoever needs it: the ally in the worst ' +
          "shape recovers 20% of Lenore's max HP.",
        cooldown: 0, targeting: 'lowest-allies', allyCount: 1,
        animation: 'attack', impact: 'heal_purple',
        effects: [
          { type: 'healHpPct', pct: 0.20 },
        ],
      },
      {
        id: 'lenore_muffled_peal', name: 'Muffled Peal',
        icon: 'assets/icons/fc1304.png',
        description: 'Rung muffled, the way it is rung for the dead: the ' +
          'whole team braces at +30% DEF for 2 turns and recovers 10% of ' +
          "Lenore's max HP a turn while the sound holds.",
        cooldown: 5, targeting: 'all-allies', animation: 'skill2', impact: 'heal_purple',
        effects: [
          { type: 'buff', stat: 'def', mult: 1.30, turns: 2 },
          { type: 'hot', pct: 0.10, turns: 2 },
        ],
      },
      {
        id: 'lenore_open_ring', name: 'Open Ring',
        icon: 'assets/icons/fc1305.png',
        description: 'The bell opened all the way: every ally recovers 20% ' +
          "of Lenore's max HP and takes a shield worth 10% of it for 2 turns.",
        cooldown: 6, targeting: 'all-allies', animation: 'skill3', impact: 'heal_purple',
        effects: [
          { type: 'healHpPct', pct: 0.20 },
          { type: 'shield', pct: 0.10, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'The Passing Bell',
      icon: 'assets/icons/fc1306.png',
      description: 'A bell rung for a death is a bell she rings again ' +
        'sooner: whenever an ally falls, every one of her cooldowns drops ' +
        'by 1 turn.',
      hooks: {
        onUnitDied(unit, { victim }) {
          if (!unit.alive || !victim || victim === unit) return null;
          if (victim.team !== unit.team) return null;
          let moved = 0;
          for (const a of unit.abilities) {
            if (a.cooldownRemaining <= 0) continue;
            a.cooldownRemaining -= 1;
            moved++;
          }
          if (moved === 0) return null;
          return { floats: [{ target: unit, text: '\u266a -1 CD', color: '#8ee8ff' }] };
        },
      },
    },
    positional: POSITIONALS.bell_tower,
  },

  dorian: {
    id: 'dorian',
    element: 'dark',
    name: 'Dorian',
    title: 'Glaive of the Nightflowers',
    rarity: 5,
    // A front-line carry who does not out-damage a healer so much as
    // remove the healer from the argument. Both of his locks are
    // single-target and both are ORDINARY debuffs -- the seal is the
    // same one Asher uses, on the same plate -- and his passive pays
    // him for every one the target is wearing. Against a team with no
    // sustain he is a plain 5-star; against one built on it he is the
    // reason it does not work.
    stats: { hp: 1800, atk: 260, def: 135, speed: 112 },
    tint: { body: '#241c30', helm: '#e8e4e0', weapon: '#c8c4d8', skin: '#e0c0a0' },
    sprite: {
      displayH: 96,
      strips: {
        idle:  { src: 'assets/heroes/Dorian/dorianidle.png', frames: 'auto', fps: 7, loop: true },
        idle2: { src: 'assets/heroes/Dorian/dorianidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Dorian/dorianidle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        attack: { src: 'assets/heroes/Dorian/dorianskill1.png', frames: 'auto', fps: 11,
                  loop: false },
        skill2: { src: 'assets/heroes/Dorian/dorianskill2.png', frames: 'auto', fps: 11,
                  loop: false },
        skill3: { src: 'assets/heroes/Dorian/dorianskill3.png', frames: 'auto', fps: 11,
                  loop: false },
        death:  { src: 'assets/heroes/Dorian/doriandeath.png', frames: 'auto', fps: 8,
                  loop: false, freeze: true },
      },
    },
    role: 'dps',
    abilities: [
      {
        id: 'dorian_low_sweep', name: 'Low Sweep',
        icon: 'assets/icons/fc1307.png',
        description: 'The glaive comes across at knee height: 140% ATK to a ' +
          'single enemy.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.40 },
        ],
      },
      {
        id: 'dorian_nothing_for_the_pain', name: 'Nothing For The Pain',
        icon: 'assets/icons/fc1308.png',
        description: '150% ATK to a single enemy, and for 2 turns nothing ' +
          'can heal them — no mend, no regen, no drain.',
        cooldown: 3, targeting: 'enemy', animation: 'skill2', impact: 'slash',
        effects: [
          { type: 'damage', mult: 1.50 },
          { type: 'healBlock', turns: 2 },
        ],
      },
      {
        id: 'dorian_no_physician', name: 'No Physician',
        icon: 'assets/icons/fc1309.png',
        description: 'The lit blade: 190% ATK to a single enemy, who for 2 ' +
          'turns can neither be healed NOR take any new blessing.',
        cooldown: 5, targeting: 'enemy', animation: 'skill3', impact: 'strike_purple',
        effects: [
          { type: 'damage', mult: 1.90 },
          { type: 'healBlock', turns: 2 },
          { type: 'buffBlock', turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Past Helping',
      icon: 'assets/icons/fc1310.png',
      description: 'Deals 20% extra damage for each of his two locks the ' +
        'target is under — 40% against an enemy who can be neither mended ' +
        'nor blessed.',
      hooks: {
        damageDealtMult(unit, target) {
          if (!target) return 1;
          let locks = 0;
          if (target.healBlocked && target.healBlocked()) locks++;
          if (target.buffsSealed && target.buffsSealed()) locks++;
          return 1 + 0.20 * locks;
        },
      },
    },
    positional: POSITIONALS.reach,
  },

  noctelle: {
    id: 'noctelle',
    element: 'dark',
    name: 'Noctelle',
    title: 'Silent Moth of the Nightflowers',
    rarity: 3,
    // The first Nightflower wired, and the sect's thesis in one hero:
    // nothing she does is free, and everything she does is taken from
    // someone else. Her damage comes off her OWN pool and lands as
    // healing on whoever is worst off, so a big HP bar is the whole
    // kit -- the wound, the mend, and the reason she survives the
    // back row.
    stats: { hp: 2100, atk: 95, def: 120, speed: 104 },
    tint: { body: '#2a2438', helm: '#6a5a8a', weapon: '#b8a8d8', skin: '#e0d0e8' },
    // Her art arrived after her kit was wired, and nothing connected the
    // two: with no sprite block she fell through to the procedural
    // placeholder and shipped as a grey box for weeks, with the real
    // sheets sitting in the repo the whole time.
    //
    // 256px square frames, 9 across, except the death at 17. One idle
    // fidget (the moth wings settle); no ready strip. Authored facing
    // right — staff hand and the cast both build right of frame — like
    // the rest of the Nightflowers, so no faceLeft flag.
    sprite: {
      displayH: 96,
      strips: {
        idle:  { src: 'assets/heroes/Noctelle/noctelleidle.png', frames: 'auto', fps: 7, loop: true },
        idle2: { src: 'assets/heroes/Noctelle/noctelleidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        attack: { src: 'assets/heroes/Noctelle/noctelleskill1.png', frames: 'auto', fps: 11,
                  loop: false },
        skill2: { src: 'assets/heroes/Noctelle/noctelleskill2.png', frames: 'auto', fps: 11,
                  loop: false },
        skill3: { src: 'assets/heroes/Noctelle/noctelleskill3.png', frames: 'auto', fps: 11,
                  loop: false },
        death:  { src: 'assets/heroes/Noctelle/noctelledeath.png', frames: 'auto', fps: 8,
                  loop: false, freeze: true },
      },
    },
    role: 'support',
    abilities: [
      {
        id: 'noctelle_silent_wing', name: 'Silent Wing',
        icon: 'assets/icons/fc1276.png',
        description: "10% of Noctelle's own max HP as damage to one " +
          'enemy, and the ally in the worst shape is mended for exactly ' +
          'what the wound cost.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'strike_purple',
        effects: [
          { type: 'damageHp', mult: 0.10, healDealt: { to: 'lowest-ally', frac: 1 } },
        ],
      },
      {
        id: 'noctelle_nightbloom', name: 'Nightbloom',
        icon: 'assets/icons/fc1277.png',
        description: "Mends one ally for 20% of Noctelle's own max HP " +
          'and lifts a debuff off them.',
        cooldown: 3, targeting: 'ally', animation: 'skill2', impact: 'heal_purple',
        effects: [
          { type: 'healHpPct', pct: 0.20 },
          { type: 'cleanse', count: 1 },
        ],
      },
      {
        id: 'noctelle_moth_dust', name: 'Moth Dust',
        icon: 'assets/icons/fc1278.png',
        description: "10% of Noctelle's own max HP as damage to the enemy " +
          'BACK row, and the dust drags at them: -30% Speed for 2 turns.',
        cooldown: 5, targeting: 'back-enemies', animation: 'skill3', impact: 'strike_purple',
        effects: [
          { type: 'damageHp', mult: 0.10 },
          { type: 'debuff', stat: 'speed', mult: 0.70, turns: 2 },
        ],
      },
    ],
    passive: {
      name: 'Dust On The Wind',
      icon: 'assets/icons/fc1282.png',
      description: 'Moth Dust deals double damage to Wind heroes — the ' +
        'scales find nothing to cling to on anyone else.',
      hooks: {
        damageDealtMult(unit, target, ability) {
          if (!ability || ability.id !== 'noctelle_moth_dust') return 1;
          return target && target.element === 'wind' ? 2 : 1;
        },
      },
    },
    positional: POSITIONALS.lamplight,
  },

  asher: {
    id: 'asher',
    element: 'wind',
    name: 'Asher',
    title: 'Bell Thief of the Whisperchime',
    rarity: 5,
    // The sect's answer to a buffed enemy team, and the one member who
    // gets STRONGER for meeting one. Every blessing he takes off them
    // he puts on himself, and his passive pays 25% for each one he is
    // wearing — so the same swing that undresses their carry dresses
    // him. His third skill closes the door behind it: nothing new gets
    // onto that target for three turns.
    stats: { hp: 2000, atk: 245, def: 150, speed: 106 },
    tint: { body: '#6a5a3a', helm: '#c8b878', weapon: '#8a7a5a', skin: '#e8c8a8' },
    sprite: {
      displayH: 96,
      strips: {
        idle:  { src: 'assets/heroes/Asher/asheridle.png', frames: 'auto', fps: 7, loop: true },
        idle2: { src: 'assets/heroes/Asher/asheridle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Asher/asheridle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        attack: { src: 'assets/heroes/Asher/asherskill1.png', frames: 'auto', fps: 11,
                  loop: false },
        skill2: { src: 'assets/heroes/Asher/asherskill2.png', frames: 'auto', fps: 11,
                  loop: false },
        skill3: { src: 'assets/heroes/Asher/asherskill3.png', frames: 'auto', fps: 11,
                  loop: false },
        death:  { src: 'assets/heroes/Asher/asherdeath.png', frames: 'auto', fps: 8,
                  loop: false, freeze: true },
      },
    },
    role: 'dps',
    abilities: [
      {
        id: 'asher_downstroke', name: 'Downstroke',
        icon: 'assets/icons/fc1273.png',
        description: 'The hammer comes down on one of them for 130% ATK.',
        cooldown: 0, targeting: 'enemy', animation: 'attack', impact: 'strike',
        effects: [
          { type: 'damage', mult: 1.30 },
        ],
      },
      {
        id: 'asher_helping_myself', name: 'Helping Myself',
        icon: 'assets/icons/fc1274.png',
        description: '150% ATK to a single enemy, and one buff comes off ' +
          'them and onto Asher with whatever time it had left.',
        cooldown: 3, targeting: 'enemy', animation: 'skill2', impact: 'slam',
        effects: [
          { type: 'damage', mult: 1.50 },
          { type: 'stealBuffs', count: 1 },
        ],
      },
      {
        id: 'asher_nothing_for_you', name: 'Nothing For You',
        icon: 'assets/icons/fc1275.png',
        description: '175% ATK to a single enemy, TWO of their buffs move ' +
          'onto Asher, and the target is sealed against every new blessing ' +
          'for 3 turns.',
        cooldown: 5, targeting: 'enemy', animation: 'skill3', impact: 'slam',
        effects: [
          { type: 'damage', mult: 1.75 },
          { type: 'stealBuffs', count: 2 },
          { type: 'buffBlock', turns: 3 },
        ],
      },
    ],
    passive: {
      name: 'Borrowed Weather',
      icon: 'assets/icons/fc1281.png',
      description: 'Deals 25% extra damage for every buff Asher himself is ' +
        'carrying — his own, his supports\', and everything he has taken.',
      hooks: {
        damageDealtMult(unit) {
          const worn = unit.statusEffects.filter((fx) => fx.kind === 'buff').length;
          return 1 + 0.25 * worn;
        },
      },
    },
    positional: POSITIONALS.clapper,
  },

  wren: {
    id: 'wren',
    element: 'wind',
    name: 'Wren',
    title: 'Windbreak of the Whisperchime',
    rarity: 3,
    // Front-line tank whose swings are measured off her OWN pool, so
    // every point of HP is offence as well as defence. Her third skill
    // is the sect's whole thesis in one move: reach past the wall,
    // haul the back line out into the open, and shove the wall in
    // behind them. Her passive then bills everyone standing in the
    // wrong hex — including everyone SHE just moved.
    stats: { hp: 2400, atk: 90, def: 160, speed: 92 },
    tint: { body: '#3a5a4a', helm: '#8a8a7a', weapon: '#c8c8b8', skin: '#e8c8a8' },
    sprite: {
      displayH: 96,
      // Her cloak sweeps well behind her heels, and the shadow
      // followed the cloth rather than the woman inside it. She
      // measures ~38 raw, i.e. past the 32 clamp, so the scale has to
      // drop her below the ceiling before it does anything visible —
      // 0.85 looked like a no-op for exactly that reason.
      shadowScale: 0.72,
      // The strips arrived out of order, and are wired to the skills
      // they actually animate: skill1's file is her THIRD skill, the
      // 'skill 2 3' file is her second, and skill3's file is her first.
      // The space in that filename is escaped rather than renamed —
      // the uploads are left exactly as delivered.
      strips: {
        idle:  { src: 'assets/heroes/Wren/wrenidle.png', frames: 'auto', fps: 7, loop: true },
        idle2: { src: 'assets/heroes/Wren/wrenidle1.png', frames: 'auto', fps: 6, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        idle3: { src: 'assets/heroes/Wren/wrenidle2.png', frames: 'auto', fps: 7, loop: false,
                 variantOf: 'idle', every: [8, 15] },
        attack: { src: 'assets/heroes/Wren/wrenskill3.png', frames: 'auto', fps: 11,
                  loop: false },
        skill2: { src: 'assets/heroes/Wren/wrenskill%202%203.png', frames: 'auto', fps: 11,
                  loop: false },
        skill3: { src: 'assets/heroes/Wren/wrenskill1.png', frames: 'auto', fps: 11,
                  loop: false },
        death:  { src: 'assets/heroes/Wren/wrendeath.png', frames: 'auto', fps: 8,
                  loop: false, freeze: true },
      },
    },
    role: 'tank',
    abilities: [
      {
        id: 'wren_breakwater', name: 'Breakwater',
        icon: 'assets/icons/fc1270.png',
        description: "A shoulder into the whole line: the enemy FRONT row " +
          "takes 10% of Wren's own max HP as damage.",
        cooldown: 0, targeting: 'front-enemies', animation: 'attack', impact: 'slash',
        effects: [
          { type: 'damageHp', mult: 0.10 },
        ],
      },
      {
        id: 'wren_shoulder_check', name: 'Shoulder Check',
        icon: 'assets/icons/fc1271.png',
        description: "Everything she has, into one of them: 15% of Wren's " +
          'own max HP as damage to a single enemy.',
        cooldown: 3, targeting: 'enemy', animation: 'skill2', impact: 'slash',
        effects: [
          { type: 'damageHp', mult: 0.15 },
        ],
      },
      {
        id: 'wren_out_you_come', name: 'Out You Come',
        icon: 'assets/icons/fc1272.png',
        description: 'Reach past the wall for a BACK-row enemy: 10% of ' +
          "Wren's max HP as damage, and they trade hexes with whoever was " +
          'covering them — their caster out in the open, their wall shoved ' +
          'in behind.',
        cooldown: 5, targeting: 'enemy', animation: 'skill3', impact: 'slash',
        effects: [
          { type: 'damageHp', mult: 0.10 },
          { type: 'swapRank' },
        ],
      },
    ],
    passive: {
      name: 'Out Of Place',
      icon: 'assets/icons/fc1280.png',
      description: 'Deals 30% extra damage to enemies standing outside ' +
        'their own positional hex — anyone the wind has moved, including ' +
        'everyone she just moved herself.',
      hooks: {
        damageDealtMult(unit, target) {
          // Only a fighter who HAS a favoured hex can be out of it.
          if (!target || !target.positional) return 1;
          return target.positionalActive() ? 1 : 1.30;
        },
      },
    },
    positional: POSITIONALS.windbreak,
  },
});
