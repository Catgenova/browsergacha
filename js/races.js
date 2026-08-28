// Race synergy: fielding 3 / 5 / 7 heroes of one race grants the WHOLE
// party that race's gear-set bonuses (the 2/4/6-piece effects, tier for
// tier). Tiers stack, and the pack stacks with gear actually worn.
// Applied to the PLAYER party when a battle is built.

const RACES = (() => {
  // Bird heroes are named by species, so the avian race is a lookup set.
  const BIRD_SPECIES = new Set([
    'vulture', 'kingfisher', 'rook', 'rooster', 'owl', 'eagle', 'raven',
    'sparrow', 'pelican', 'heron', 'finch', 'duck', 'magpie', 'woodpecker',
    'gull', 'crane', 'falcon', 'parrot', 'goose', 'hawk', 'swan', 'phoenix',
    'albatross', 'peacock', 'stork', 'crow', 'cuckoo', 'shrike', 'nightjar',
    'whippoorwill', 'dove', 'egret', 'goldfinch', 'lark', 'ibis',
    // 4★ champion cohort — these were missing, so they silently counted
    // toward no race at all and skipped the Avian pack.
    'osprey', 'kestrel', 'condor', 'harrier', 'flamingo', 'skua', 'tern',
  ]);
  const PREFIXES = new Set([
    'rat', 'minotaur', 'snake', 'wolf', 'boar', 'bear', 'cat', 'drake',
  ]);
  // Named birds. The generated cohorts are "<species> <role>" and fall
  // out of BIRD_SPECIES above, but a sect's members are individuals with
  // names -- Hallow is not "a gull", he is Hallow -- so they get the
  // same explicit roster the humans do rather than an id prefix that
  // would force every Gulldigger to be the same species.
  const AVIANS = new Set([
    'hallow', 'ike', 'jack', 'phil', 'peck', 'talon', 'bo', 'wanda', 'polo',
    'korvid', 'kavit', 'flurry', 'barrington', 'stoddard',
    'stella', 'sarena', 'orri', 'chirp',
    // Razorwings, filling one bird at a time.
    'tervan',
  ]);

  // The humans are named individuals rather than "<race> <role>", so
  // they're an explicit roster. Listed by id, not inferred, so bosses
  // and future one-off ids never fall into the race by accident.
  const HUMANS = new Set([
    'florence', 'vivian', 'vex', 'emily', 'coral', 'catherine', 'echo',
    'toll', 'javarious', 'leonardo', 'oak', 'silas', 'eli', 'sawyer',
    'polarus', 'andrew', 'angelica', 'ari', 'cain', 'bit', 'tanner',
    'lucian', 'franz', 'carl', 'esmerelda', 'slick', 'samuels', 'lin', 'koe', 'cleo', 'artur',
    'tumble', 'posie', 'galen', 'ilyra', 'ryn', 'imani', 'wren', 'asher',
    'noctelle', 'sable', 'evelune', 'lysandra', 'morrow', 'valere', 'lenore', 'dorian',
  ]);

  const NAMES = {
    rat: 'Rat', avian: 'Avian', minotaur: 'Minotaur', snake: 'Snake',
    wolf: 'Wolf', boar: 'Boar', bear: 'Bear', cat: 'Cat', drake: 'Drake',
    human: 'Human',
  };

  // Which race a hero definition belongs to (null for the founders and
  // bosses — they stand outside the packs).
  function of(def) {
    if (!def || !def.id) return null;
    if (HUMANS.has(def.id)) return 'human';
    if (AVIANS.has(def.id)) return 'avian';
    const head = def.id.split('_')[0];
    if (PREFIXES.has(head)) return head;
    if (BIRD_SPECIES.has(head)) return 'avian';
    return null;
  }

  // Race packs mirror the race's GEAR SET exactly: the 3/5/7-hero tiers
  // are the set's 2/4/6-piece bonuses, applied to the whole party, and
  // they stack with worn gear. Derived from Gear.SETS on first use (gear
  // loads after this file), so the two tables can never drift apart.
  // Drakes wear the Dragon set. Humans have no set and no pack: the
  // named heroes group into SECTS instead (below).
  const SET_OF_RACE = { drake: 'dragon' };

  // Sects: the named heroes belong to orders, each with an assigned
  // number (a designation, not a roster size — Reverence is No. 4 and
  // runs eight strong). Members are hero ids; 'echo' is Aniani,
  // 'florence' is Tide (the Crystal Blade wears Cryst blue).
  //
  // Sects were a human institution until the Gulldiggers, who are birds
  // and keep one anyway. A non-human sect is nine strong to a DECLARED
  // shape -- one 1★, two 2★, three 3★, two 4★ and a single 5★ -- and
  // that shape is enforced as a ceiling while the sect fills.
  //
  // The human orders are looser. Nine is the usual size and none was
  // written above it, but Cryst and the Nightflowers each run ten now:
  // they took in the two heroes the Hedge left behind when it closed,
  // and taking somebody in is a better answer than turning them away to
  // keep a round number. Nothing in the engine counts on nine — sect
  // packs pay at two, three and four fielded — so the size is pinned by
  // the roster listed in data.test.js rather than by a rule here.
  const SECTS = {
    // Coral came over from the Hedge when it closed. She was already
    // wearing the colour -- a water Tide Caller among eight other water
    // heroes -- so the move only wrote down where she had been standing.
    cryst:     { id: 'cryst',     name: 'Cryst',     number: 1,
                 members: ['polarus', 'echo', 'florence', 'andrew', 'angelica', 'ari', 'cain', 'bit', 'tanner',
                           'coral'] },
    // DEFUNCT. The Hedge never grew past two, and two is not an order.
    // Vex went to the Nightflowers and Coral to Cryst -- each to the
    // sect their element and their kit already answered to -- and with
    // both gone there was nobody left to keep the door open.
    //
    // Kept in the list on the Shadowflower precedent: No. 3 is spent
    // and must never be reissued, a save that remembers the name should
    // still find it, and `defunct` says what an empty `members` array
    // cannot -- that this is a closed order rather than one waiting to
    // be filled.
    hedge:     { id: 'hedge',     name: 'Hedge',     number: 3,
                 defunct: true, members: [] },
    reverence: { id: 'reverence', name: 'Reverence', number: 4,
                 members: ['catherine', 'toll', 'javarious', 'leonardo', 'oak', 'silas', 'eli', 'emily', 'artur'] },
    // DEFUNCT. Sawyer's old home, emptied when he was recognised as the
    // Nightflower his whole kit already said he was -- Petalfall Cut,
    // Night Bloom, Deadheading, Wilting Garden. He was its only member
    // and he left, so the order is finished.
    //
    // It stays in this list rather than being deleted: No. 2 is spent
    // and must not be handed to a future sect, and a save that
    // remembers the name should still find it. `defunct` says what an
    // empty `members` array cannot -- that this is a closed order, not
    // one waiting to be filled. data.test.js holds the difference: a
    // live sect must have members, a defunct one must never gain any.
    shadowflower: { id: 'shadowflower', name: 'Shadowflower', number: 2,
                 defunct: true, members: [] },
    // Lucian's order; Franz the firebreather is its second act.
    firetroupe: { id: 'firetroupe', name: 'Firetroupe', number: 5,
                 members: ['lucian', 'franz', 'carl', 'esmerelda', 'slick', 'samuels', 'lin', 'koe', 'cleo'] },
    // The Nightflowers: the sect that grows out of what dies. Sawyer
    // was written as one long before the sect existed — Petalfall Cut,
    // Night Bloom, Deadheading, Wilting Garden — so he moved here and
    // his title moved with him.
    // Vex came over from the Hedge when it closed. The Doll Witch keeps
    // her hexes on longer than anyone, and the Nightflowers are paid by
    // the debuff -- she was writing their 2pc before she joined them.
    nightflower: { id: 'nightflower', name: 'Nightflower', number: 6,
                 members: ['sawyer', 'noctelle', 'sable', 'evelune', 'lysandra',
                           'morrow', 'valere', 'lenore', 'dorian', 'vex'] },
    // Tumble's order: acrobats who fight by never standing still.
    whisperchime: { id: 'whisperchime', name: 'Whisperchime', number: 7,
                 members: ['tumble', 'posie', 'galen', 'ilyra', 'ryn', 'vivian', 'imani', 'wren',
                           'asher'] },
    // The first sect that is not human: pirate seabirds who fight the
    // way weather does, all at once and to everybody. Hallow holds the
    // 5★ chair.
    gulldigger: { id: 'gulldigger', name: 'Gulldigger', number: 8,
                 // 1/2/3/2/1 across the star ranks, the shape a bird
                 // sect is built to.
                 shape: { 1: 1, 2: 2, 3: 3, 4: 2, 5: 1 },
                 members: ['hallow', 'ike', 'jack', 'phil', 'peck', 'talon', 'bo', 'wanda', 'polo'] },
    // Fire birds in red and gold. Their damage dealers light fires and
    // their court is paid for them: every blessing and every mend the
    // Court hands out is deeper for each enemy already burning.
    //
    // Declared rather than inherited, so a sect that ever wants a
    // different shape says so out loud instead of failing a test
    // written around the first one.
    // The third bird sect and the first wind one: hunters who fight at
    // the speed they fly. Filling one bird at a time, to the same
    // 1/2/3/2/1 shape the other two hold.
    razorwings: { id: 'razorwings', name: 'Razorwings', number: 10,
                 shape: { 1: 1, 2: 2, 3: 3, 4: 2, 5: 1 },
                 members: ['tervan'] },
    phoenixcourt: { id: 'phoenixcourt', name: 'Phoenix Court', number: 9,
                 shape: { 1: 1, 2: 2, 3: 3, 4: 2, 5: 1 },
                 members: ['korvid', 'kavit', 'flurry', 'barrington', 'stoddard',
                           'stella', 'sarena', 'orri', 'chirp'] },
  };
  const ELEMENT_NAMES = {
    water: 'Water', fire: 'Fire', wind: 'Wind', dark: 'Dark', light: 'Light',
  };

  // ---- Element party bonuses -------------------------------------------
  //
  // Field N heroes of one element and every hero OF THAT ELEMENT in the
  // party gets the tier. Tiers STACK: four wind heroes hold all three.
  //
  // The thresholds are 2/3/4, not the 3/5/7 the old packs used. That is
  // the whole point of bringing them back: a party is seven strong, so
  // 3/5/7 meant one element or nothing, while 2/3/4 lets a party carry
  // two or three elements and be paid for each. Mixing is the strategy
  // rather than the penalty.
  //
  // A tier carries `mods` (flat changes, applied at battle build) or
  // `hooks` (a passive-shaped object handed to the unit, giving a bonus
  // the whole engine hook surface), or both.
  //
  // Only wind is written so far. An element with no table simply pays
  // nothing -- the machinery does not assume five entries.
  const ELEMENT_PARTY_BONUSES = {
    // These two tiers are LIVE now, and were not always. The landing
    // contest is `max(0.15, 1 - max(0, resistance - accuracy))`, and for
    // a long time nothing in the game carried any resistance at all --
    // so it was already a certainty and neither more accuracy nor
    // piercing an absent ward could improve on it.
    //
    // Everything now starts at 15 accuracy and 15 resistance, and a BOSS
    // holds 65. Against an ordinary body 15 against 15 is still a
    // certainty and these tiers still buy nothing; against a boss they
    // are the difference between a coin flip and a sure thing, which is
    // the fight a debuff kit was always meant to build for.
    dark: [
      {
        count: 2, name: 'Unerring',
        mods: { accuracy: 0.25 },
        label: '+25% Accuracy',
      },
      {
        count: 3, name: 'Read the Wards',
        // Piercing is not extra accuracy: accuracy is subtracted from
        // whatever resistance survives, so the two only agree at 100%
        // resistance. Read in Abilities.debuffLands, which governs every
        // taking -- hexes, strips and meter drains alike.
        hooks: { resistPierce: 0.20 },
        label: 'ignores 20% of enemy Resistance',
      },
      {
        count: 4, name: 'Lingering',
        // The one live tier of the three. DEBUFFS only, not
        // damage-over-time: the channel is read inside the debuff branch
        // (abilities.js), so a burn or a poison does not get the coin
        // flip and the label must not promise it one.
        mods: { debuffExtraChance: 0.50 },
        label: 'a landed debuff has a 50% chance to last an extra turn',
      },
    ],
    light: [
      {
        count: 2, name: 'Congregation',
        // maxHp is a plain property, set once at build and never
        // recomputed (it does not go through effectiveStat the way ATK,
        // DEF and SPD do). A FLAT lift like this is therefore free; a
        // conditional one would mean making maxHp a computed stat and
        // teaching every read, and every current-HP clamp, to follow a
        // ceiling that moves.
        mods: { hpPct: 0.15 },
        label: '+15% max HP',
      },
      {
        count: 3, name: 'The Last Bell',
        // Read at the moment a blow is being priced, so it applies to
        // the NEXT hit after a hero is already low -- not to the hit
        // that put them there. That is the usual reading of a threshold
        // guard and it is what makes it a stay of execution rather than
        // a damage cap.
        hooks: {
          damageTakenMult(unit) {
            return unit.maxHp > 0 && unit.hp / unit.maxHp < 0.25 ? 0.70 : 1;
          },
        },
        label: 'a hero below 25% HP takes 30% less damage',
      },
      {
        count: 4, name: 'Matins',
        // Granted after every mod has finished shaping max HP, so the
        // ward is 15% of the pool INCLUDING Congregation's lift rather
        // than of the statline the hero walked in with.
        mods: { startShield: 0.15 },
        label: 'the party opens every fight with a ward worth 15% of max HP',
      },
    ],
    fire: [
      {
        count: 2, name: 'Stoked',
        // The ATK STAT, not a damage multiplier: it lifts every
        // ATK-priced thing the party does, mends and wards included.
        mods: { atkPct: 0.15 },
        label: '+15% ATK',
      },
      {
        count: 3, name: 'Moth to Flame',
        // The perk that makes the two fire sects want each other: the
        // Phoenix Court lights the fires, the Firetroupe collects on
        // them. Reads the TARGET, which damageDealtMult is handed.
        hooks: {
          damageDealtMult(unit, target) {
            return target && target.burning && target.burning() ? 1.25 : 1;
          },
        },
        label: '+25% damage to an enemy already burning',
      },
      {
        count: 4, name: 'Encore',
        // Renamed off "Catches Twice", which is Flurry's passive and
        // means something else entirely -- a burn rekindling rather
        // than a crit landing again. The Phoenix Court's 2pc now
        // carries that name, which is where it always belonged.
        // Read in Abilities.strike, where the crit is settled. The
        // follow-up is a real blow at half the swing -- dodge, wards and
        // the DEF curve all answer it -- but it never crits and never
        // echoes itself.
        hooks: { critEcho: 0.25 },
        label: 'a crit has a 25% chance to strike again for half',
      },
    ],
    water: [
      {
        count: 2, name: 'Cold Iron',
        mods: { defPct: 0.15 },
        label: '+15% DEF',
      },
      {
        count: 3, name: 'Riptide',
        // A CHANCE to bounce the whole blow back, not a share of it:
        // the attacker eats the hit and the target takes nothing
        // (Abilities.strike). The old water 7pc read "reflects 15% of
        // damage taken", which described a mechanic the engine has
        // never had -- the label says what actually happens.
        //
        // 15% is what a full Boar six-piece grants, so this is a whole
        // gear set's worth of reflect for three of seven party slots.
        mods: { reflect: 0.15 },
        label: '15% chance to bounce a hit back at the attacker',
      },
      {
        count: 4, name: 'Ice Shelf',
        // Paid for standing where the blows land. Read live rather than
        // stamped at build, so moving a hero forward mid-fight (or a
        // formation rotate) turns it on and off honestly.
        hooks: {
          damageTakenMult(unit) {
            return unit.slot && unit.slot.position === POSITION.FRONT ? 0.80 : 1;
          },
        },
        label: 'front-hex heroes take 20% less damage',
      },
    ],
    wind: [
      {
        count: 2, name: 'Following Wind',
        mods: { spdPct: 0.10 },
        label: '+10% SPD',
      },
      {
        count: 3, name: 'Crosswind',
        // Ryn's Terminal Velocity, opened out to the party -- speed is
        // the element's damage stat. Hers counts from zero in steps of
        // 50; this counts only what is ABOVE 100, so it pays the party
        // for building speed rather than for being wind.
        //
        // The step is 25, not the 50 the sketch used. Speed does not
        // scale with level or stars (Progression.scaledStats keeps it
        // identity), so the whole roster lives between 84 and 128 before
        // gear: at a 50 step an ungeared or lightly geared wind party
        // reads +0% and the tier is dead until a full Avian six-piece
        // turns up. At 25 it pays +5% by 125 and climbs from there.
        hooks: {
          damageDealtMult(unit) {
            const spd = unit.effectiveStat ? unit.effectiveStat('speed') : 0;
            return 1 + 0.05 * Math.floor(Math.max(0, spd - 100) / 25);
          },
        },
        label: '+5% damage per full 25 SPD above 100',
      },
      {
        count: 4, name: 'Second Gust',
        mods: { extraTurn: 0.10 },
        label: '10% chance to act again after acting',
      },
    ],
  };

  // ---- Sect party bonuses ----------------------------------------------
  //
  // Same 2/3/4 thresholds as the element sets, and stacking with them --
  // but paid to the WHOLE PARTY rather than only to the sect. That is
  // the difference between the two: an element pays its own, while a
  // sect is a committed core that lifts everybody standing with it,
  // including the hero who belongs to neither.
  //
  // Because every sect is single-element, a sect tier always lands on
  // top of an element tier: four Cryst are also four water. So these
  // lean conditional and enabling rather than adding a third flat stat
  // lift on top of the two the party already holds.
  const SECT_PARTY_BONUSES = {
    // The Razorwings SPEND speed; they do not sell more of it. The wind
    // element pack a Razorwing party is always also wearing already
    // banks speed as turns -- Following Wind, Crosswind, Second Gust --
    // and a sect tier lands on top of an element tier, so a sect that
    // sold speed again would only be handing the party its own bonus
    // back. All three of these read the GAP between the swinger and
    // whoever is in front of them, or what the swing did.
    //
    // Worth being plain about: the 2pc and the 3pc are the same
    // condition on the same channel, and damageDealtMult hooks
    // MULTIPLY. Fielding four Razorwings into something slower is
    // 1.25 x 1.30 before Crosswind, and that is the deliberate shape of
    // the sect rather than an accident -- it is also worth exactly
    // nothing against anything faster, which is the price.
    razorwings: [
      {
        count: 2, name: 'Overtake',
        // Flat, and binary: you are either faster than the thing in
        // front of you or you are not. The 3pc below is what makes the
        // SIZE of the gap matter.
        hooks: {
          damageDealtMult(unit, target) {
            if (!target || !target.effectiveStat) return 1;
            return unit.effectiveStat('speed') > target.effectiveStat('speed')
              ? 1.25 : 1;
          },
        },
        label: '+25% damage to any enemy slower than the attacker',
      },
      {
        count: 3, name: 'Terminal Velocity',
        // Continuous rather than stepped, unlike Crosswind's per-25
        // rungs: this reads a DIFFERENCE, and a difference that only
        // paid at 25-point boundaries would make a 24-point speed lead
        // worth nothing at all. Capped at 30%, which is where a 60-point
        // lead lands -- past that the sect is already winning the race
        // by more than the fight can use.
        hooks: {
          damageDealtMult(unit, target) {
            if (!target || !target.effectiveStat) return 1;
            const gap = unit.effectiveStat('speed') - target.effectiveStat('speed');
            if (gap <= 0) return 1;
            return 1 + Math.min(0.30, gap * 0.005);
          },
        },
        label: '+1% damage per 2 points of speed over the target, to +30%',
      },
      {
        count: 4, name: 'Rip Current',
        // The one tier that is not damage. A kill refills a quarter of
        // the bar, so a Razorwing party that is actually closing bodies
        // out runs away with the turn order -- and one that is only
        // chipping gets nothing, which is the check on it.
        //
        // Paid to whoever LANDED the blow, not to the party: a poison
        // tick or a reflect kills with no killer, and nobody should be
        // paid for a death they did not deal.
        hooks: {
          onUnitDied(unit, { victim, killer } = {}) {
            if (!unit.alive || !victim || killer !== unit) return null;
            if (victim.team === unit.team) return null;
            unit.turnMeter += CONFIG.TURN_METER_MAX * 0.25;
            return { floats: [{ target: unit, text: '\u25b2 25%', color: '#8ee8a8' }] };
          },
        },
        label: 'a Razorwing who lands a kill gains 25% action bar',
      },
    ],
    phoenixcourt: [
      {
        count: 2, name: 'Catches Twice',
        // Flurry's passive and Flurry's name. A burn laid on something
        // already alight lights a SECOND fire rather than one, so the
        // Court's fires get more numerous -- and the two tiers above
        // are priced per fire, so every extra plate is worth a full
        // Draught and a full Long Burn of its own.
        //
        // The tier owns this outright. Flurry used to carry the same
        // hook on her passive, which compounded: a Flurry standing with
        // her own sect spread twice and left three plates on a single
        // re-burn, and the two tiers above then priced all three. Her
        // passive front-loads fires now instead of multiplying them.
        hooks: { burnRekindle: 1 },
        label: 'a burn laid on a burning enemy lights a second fire',
      },
      {
        count: 3, name: 'Draught',
        // Sarena's. Fans feed a fire: every tick lands harder, which
        // multiplies into the Firetroupe's oil rather than competing
        // with it -- oil doubles the tick, this deepens what is doubled.
        mods: { dotBoost: 0.20 },
        label: 'burns tick 20% harder',
      },
      {
        count: 4, name: 'Long Burn',
        // Every fire the party sets outlasts itself by a turn. The
        // cheapest way to make both tiers above worth more, and it
        // compounds with the rekindle: a fire that is extended and then
        // burns a turn longer is worth two of the same cast.
        hooks: { dotExtraTurns: 1 },
        label: "the party's damage-over-time lasts 1 extra turn",
      },
    ],
    gulldigger: [
      {
        count: 2, name: 'Eye of the Storm',
        // Fired once per BODY a multi-target skill lands on, so a storm
        // over seven pays seven times and a sweep that found one target
        // pays nothing. Hallow keeps the deeper rate; he also collects
        // both, being the bird the hook was written for.
        hooks: {
          onSweepHit(unit) {
            unit.turnMeter += CONFIG.TURN_METER_MAX * 0.03;
            return null; // Hallow's own arrow already floats
          },
        },
        label: 'every enemy a sweep strikes pays the caster 3% turn meter',
      },
      {
        count: 3, name: 'Gaff and Haul',
        // Where a boarding party actually lands. Bosses have no hex, so
        // they are not a front rank and do not pay.
        hooks: {
          damageDealtMult(unit, target) {
            return target && target.slot &&
              target.slot.position === POSITION.FRONT ? 1.20 : 1;
          },
        },
        label: '+20% damage to enemies on a front hex',
      },
      {
        count: 4, name: 'Long Reach',
        // Ike's pike, handed to the crew. Not a damage number at all --
        // it folds the enemy CENTRE hex into every front-row sweep the
        // party throws, so each one catches one more body. Which is
        // what feeds the two tiers below it.
        //
        // Note the centre bird it drags in is still standing on a CENTRE
        // hex, so Gaff and Haul does not pay for them. The reach widens
        // the sweep; it does not relabel the field.
        hooks: { reachesCenter: true },
        label: "front-row sweeps also reach the enemy centre hex",
      },
    ],
    whisperchime: [
      {
        count: 2, name: 'Chime Tax',
        // Tumble's passive, and the tax is collected by the WHOLE ring.
        // The hook fires on the stripper (both call sites in
        // Abilities hand it the caster), so the party is reached from
        // there. Steals count as well as strips -- a boon taken is a
        // boon torn off.
        hooks: {
          onStripBuff(unit, { count } = {}) {
            if (!count || count <= 0) return null;
            const b = typeof Battle !== 'undefined' ? Battle.active : null;
            const ring = b ? b.livingUnits(unit.team) : [unit];
            for (const ally of ring) {
              ally.turnMeter += CONFIG.TURN_METER_MAX * 0.10 * count;
            }
            return null; // the strip line already says what happened
          },
        },
        label: 'tearing a boon away pays the whole party 10 turn meter',
      },
      {
        count: 3, name: 'Bare Branches',
        // Galen's reckoning exactly: ANY buff on them and the wind finds
        // nothing to break. He keeps the deeper rate.
        hooks: {
          damageDealtMult(unit, target) {
            if (!target || !target.statusEffects) return 1;
            return target.statusEffects.some((fx) => fx.kind === 'buff') ? 1 : 1.20;
          },
        },
        label: '+20% damage to an enemy carrying no buffs',
      },
      {
        count: 4, name: 'Out Of Place',
        // Wren's, at a shallower rate. Only a fighter who HAS a favoured
        // hex can be standing outside it -- a boss with no positional is
        // never out of place, and must not be hit as though it were.
        hooks: {
          damageDealtMult(unit, target) {
            if (!target || !target.positional) return 1;
            return target.positionalActive && target.positionalActive() ? 1 : 1.25;
          },
        },
        label: '+25% damage to enemies standing outside their positional hex',
      },
    ],
    nightflower: [
      {
        count: 2, name: 'Wilting Garden',
        // Counts hexes AND poisons, the same reckoning Sawyer's own
        // passive uses -- a flower droops the same whichever killed it.
        // He keeps the deeper rate and the higher ceiling.
        hooks: {
          damageDealtMult(unit, target) {
            if (!target || !target.statusEffects) return 1;
            const hexes = target.statusEffects.filter(
              (fx) => fx.kind === 'debuff' || fx.kind === 'dot').length;
            return 1 + 0.08 * Math.min(5, hexes);
          },
        },
        label: '+8% damage per debuff on the target, to +40%',
      },
      {
        count: 3, name: 'The Passing Bell',
        // Lenore's passive, rung by everyone. Each hero carries the hook
        // and shortens their OWN cooldowns, so a party of seven answers
        // one death seven times over.
        hooks: {
          onUnitDied(unit, { victim } = {}) {
            if (!unit.alive || !victim || victim === unit) return null;
            if (victim.team !== unit.team) return null;
            let moved = 0;
            for (const a of unit.abilities || []) {
              if (a.cooldownRemaining <= 0) continue;
              a.cooldownRemaining -= 1;
              moved++;
            }
            if (moved === 0) return null;
            return { floats: [{ target: unit, text: '\u266a -1 CD', color: '#8ee8ff' }] };
          },
        },
        label: 'when an ally falls, every cooldown drops by 1',
      },
      {
        count: 4, name: 'Cut Flowers',
        // Read off the battle's own body count, which already tallies
        // BOTH SIDES and survives a field that has cleared its dead.
        hooks: {
          damageDealtMult(unit) {
            const b = typeof Battle !== 'undefined' ? Battle.active : null;
            const fallen = (b && b.deaths) || 0;
            return 1 + 0.05 * Math.min(5, fallen);
          },
        },
        label: '+5% damage for every unit that has died this fight, to +25%',
      },
    ],
    firetroupe: [
      {
        count: 2, name: 'Slick Hands',
        // The channel survived the old removal intact and is still read
        // (hero.js, on every landed blow). Oil is not a recoloured hex:
        // a burn ticks for DOUBLE on an oiled target, so the Firetroupe
        // is handing the Phoenix Court a loaded gun.
        mods: { oilOnHit: 0.10 },
        label: 'landed hits have a 10% chance to Oilslick the victim',
      },
      {
        count: 3, name: 'The Crowd Loves It',
        // Counts the PARTY, not the enemy: the troupe plays better to a
        // house that is suffering. Peaks exactly when a fight is going
        // badly, which is the opposite of every other damage tier and
        // very much the sect.
        hooks: {
          damageDealtMult(unit) {
            const b = typeof Battle !== 'undefined' ? Battle.active : null;
            if (!b) return 1;
            const hurt = b.livingUnits(unit.team)
              .filter((u) => u.maxHp > 0 && u.hp / u.maxHp < 0.5).length;
            return 1 + 0.05 * hurt;
          },
        },
        label: '+5% damage for each hero in the party below half HP',
      },
      {
        count: 4, name: 'Grease Fire',
        hooks: {
          damageDealtMult(unit, target) {
            return target && target.oiled && target.oiled() ? 1.20 : 1;
          },
        },
        label: '+20% damage to an Oilslicked enemy',
      },
    ],
    reverence: [
      {
        count: 2, name: 'Chapter House',
        // Scales with the size of the chapter, not with the tier: two
        // Reverence pay +10%, four pay +20%, a full seven pay +35% -- to
        // EVERYONE fielded, the outsiders included. Priced off the count
        // at build, which is the only way a max-HP bonus can scale at
        // all (maxHp is set once and never recomputed).
        modsFor: (count) => ({ hpPct: 0.05 * count }),
        label: '+5% max HP for each Reverence hero fielded',
      },
      {
        count: 3, name: 'Vow of Reverence',
        // Catherine's passive, opened to the party. Marked with its own
        // flag rather than hers: sharing one would mean her 12% ward
        // blocked the pack's 10% whenever she was fielded, so the sect
        // pack would go quiet in exactly the party it belongs to.
        hooks: {
          onAllyHealed(unit, healedUnit) {
            if (!healedUnit || !healedUnit.alive) return null;
            if (healedUnit.statusEffects.some((fx) => fx.vowPack)) return null;
            healedUnit.addStatusEffect({
              kind: 'buff', stat: 'def', mult: 1.10, turns: 2, vowPack: true,
            });
            return { floats: [{ target: healedUnit, text: 'VOW \u25B2', color: '#ffe8a8' }] };
          },
        },
        label: 'an ally restored to health gains +10% DEF for 2 turns',
      },
      {
        count: 4, name: 'Last Rites',
        hooks: {
          damageDealtMult(unit, target) {
            if (!target || !target.maxHp) return 1;
            return target.hp / target.maxHp < 0.25 ? 1.30 : 1;
          },
        },
        label: '+30% damage to enemies below 25% HP',
      },
    ],
    cryst: [
      {
        count: 2, name: 'Cold Iron Court',
        mods: { defPct: 0.10 },
        label: '+10% DEF',
      },
      {
        count: 3, name: 'Crystquiver',
        // Armour-blindness that READS THE TARGET, which is why
        // defIgnoreAdd now accepts a function as well as a number. Ari's
        // name: the quiver finds the seam only once the ice has made
        // one. Capped short of 1 inside strike, like every other
        // penetration source.
        hooks: {
          defIgnoreAdd(unit, target) {
            return target && target.frozen && target.frozen() ? 0.20 : 0;
          },
        },
        label: 'ignores 20% of DEF against a frozen enemy',
      },
      {
        count: 4, name: 'Frostbite',
        // Counted across the whole enemy side, not just the hero being
        // hit: the field being cold is the condition, so freezing one
        // enemy makes every swing at every OTHER enemy harder too.
        hooks: {
          damageDealtMult(unit) {
            const b = typeof Battle !== 'undefined' ? Battle.active : null;
            if (!b || !unit.enemyTeam) return 1;
            const held = b.livingUnits(unit.enemyTeam())
              .filter((u) => u.frozen && u.frozen()).length;
            return 1 + 0.05 * held;
          },
        },
        label: '+5% damage for every frozen enemy on the field',
      },
    ],
  };

  function sectCounts(units) {
    const out = {};
    for (const u of units) {
      const sect = sectOf(u.def || u);
      if (sect) out[sect.id] = (out[sect.id] || 0) + 1;
    }
    return out;
  }

  function sectTiers(sectId, count) {
    return (SECT_PARTY_BONUSES[sectId] || []).filter((t) => count >= t.count);
  }

  function elementCounts(units) {
    const out = {};
    for (const u of units) {
      const el = (u.def || u).element;
      if (el) out[el] = (out[el] || 0) + 1;
    }
    return out;
  }

  // Flat changes, written onto the unit at battle build. Only the
  // channels the current tables use -- the old table wrote thirty of
  // them, most for packs that no longer exist, and a mod key with
  // nowhere to land should fail loudly rather than be silently dropped.
  const MOD_CHANNELS = {
    hpPct: (u, v) => { u.maxHp = Math.round(u.maxHp * (1 + v)); u.hp = u.maxHp; },
    atkPct: (u, v) => { u.baseAtk = Math.round(u.baseAtk * (1 + v)); },
    defPct: (u, v) => { u.baseDef = Math.round(u.baseDef * (1 + v)); },
    spdPct: (u, v) => { u.speed = Math.round(u.speed * (1 + v)); },
    spdFlat: (u, v) => { u.speed += v; },
    dodge: (u, v) => { u.gearDodge += v; },
    startShield: (u, v) => { u.synergyStartShield += v; },
    debuffExtraChance: (u, v) => { u.synergyDebuffExtraChance += v; },
    oilOnHit: (u, v) => { u.synergyOilOnHit += v; },
    dotBoost: (u, v) => { u.gearDotBoost += v; },
    reflect: (u, v) => { u.gearReflect += v; },
    extraTurn: (u, v) => { u.gearExtraTurn += v; },
    cdr: (u, v) => { u.gearCdr += v; },
    accuracy: (u, v) => { u.gearAccuracy += v; },
    resistance: (u, v) => { u.gearResistance += v; },
    healBoost: (u, v) => { u.gearHealBoost += v; },
    critChance: (u, v) => { u.baseCritChance += v; },
    critDamage: (u, v) => { u.baseCritDamage += v; },
    takenMult: (u, v) => { u.synergyTakenMult *= v; },
    apOnEnemyTurn: (u, v) => { u.synergyApOnEnemyTurn += v; },
  };

  function applyModsToUnit(unit, mods) {
    for (const [key, value] of Object.entries(mods || {})) {
      const write = MOD_CHANNELS[key];
      if (!write) throw new Error(`party bonus mod '${key}' has no channel`);
      write(unit, value);
    }
  }

  // Hand a unit a bonus's hooks as an extra passive. `unit.passives` may
  // BE the hero definition's own array (hero.js takes it by reference),
  // so this concats onto a fresh one -- pushing would write the bonus
  // into the def and every future copy of that hero would carry it.
  function applyHooksToUnit(unit, tier) {
    unit.passives = (unit.passives || []).concat({
      name: tier.name,
      description: tier.label,
      partyBonus: true,
      hooks: tier.hooks,
    });
  }

  // Which tiers an element has earned at `count` heroes fielded.
  function elementTiers(element, count) {
    return (ELEMENT_PARTY_BONUSES[element] || []).filter((t) => count >= t.count);
  }

  // Apply element party bonuses to a built player team, and report what
  // landed: [{ element, title, count, labels }]. Called once at battle
  // build, before the enemy side exists.
  function applyParty(units) {
    const active = [];
    for (const [element, count] of Object.entries(elementCounts(units))) {
      const tiers = elementTiers(element, count);
      if (tiers.length === 0) continue;
      for (const unit of units) {
        // The element pays its OWN. A wind hero standing with three
        // others gets the wind set; the fire hero beside them does not,
        // and collects their own element's instead.
        if ((unit.def || unit).element !== element) continue;
        for (const tier of tiers) {
          if (tier.mods) applyModsToUnit(unit, tier.mods);
          if (tier.hooks) applyHooksToUnit(unit, tier);
        }
      }
      // `label` is the effect alone -- the tier's threshold lives in
      // `count`, so each surface renders it in its own shape instead of
      // the string carrying a prefix that reads twice in the log.
      active.push({ element, title: `${ELEMENT_NAMES[element]} resonance`,
        count, labels: tiers.map((t) => `${t.name}: ${t.label}`) });
    }
    // Sect packs, after the elements. Paid to EVERY hero fielded, not
    // only to the sect that earned it.
    for (const [sectId, count] of Object.entries(sectCounts(units))) {
      const tiers = sectTiers(sectId, count);
      if (tiers.length === 0) continue;
      for (const unit of units) {
        for (const tier of tiers) {
          // `modsFor` is for a tier that scales with HOW MANY of the
          // sect turned up. The count is settled at battle build, so
          // this stays a flat write rather than a live hook -- which
          // matters for max HP, the one stat that is a plain property
          // and cannot be recomputed mid-fight.
          const mods = tier.modsFor ? tier.modsFor(count) : tier.mods;
          if (mods) applyModsToUnit(unit, mods);
          if (tier.hooks) applyHooksToUnit(unit, tier);
        }
      }
      active.push({ sect: sectId, title: `${SECTS[sectId].name} sect`,
        count, labels: tiers.map((t) => `${t.name}: ${t.label}`) });
    }
    // Opening wards, granted LAST -- after every tier above has finished
    // shaping max HP, so a ward priced as a share of the pool is a share
    // of the FINAL pool. The turn count is effectively battle-long: this
    // is the ward you start the fight behind, not one that ticks away
    // while nothing is happening.
    for (const unit of units) {
      if (unit.synergyStartShield > 0 && unit.addShield) {
        unit.addShield(Math.round(unit.maxHp * unit.synergyStartShield), 999, unit);
      }
    }
    return active;
  }

  // The smallest party that earns anything. A group with only one hero
  // fielded is not on its way to a bonus in any meaningful sense -- the
  // first tier needs two -- so the readout leaves it out rather than
  // listing every lone element in a mixed party and burying the groups
  // that are actually live.
  const PREVIEW_MIN = 2;

  // What a prospective party WOULD earn, without building a battle --
  // the team screen's readout. Takes hero defs rather than units.
  function previewParty(defs) {
    const out = [];
    for (const [element, count] of Object.entries(elementCounts(defs))) {
      const tiers = ELEMENT_PARTY_BONUSES[element] || [];
      if (tiers.length === 0 || count < PREVIEW_MIN) continue;
      out.push({
        kind: 'element', key: element, element,
        name: `${ELEMENT_NAMES[element]} resonance`, count,
        tiers: tiers.map((t) => ({ ...t, earned: count >= t.count })),
      });
    }
    for (const [sectId, count] of Object.entries(sectCounts(defs))) {
      const tiers = SECT_PARTY_BONUSES[sectId] || [];
      if (tiers.length === 0 || count < PREVIEW_MIN) continue;
      // A sect is one element, so the group borrows its colour.
      const member = defs.find((d) => {
        const s = sectOf(d);
        return s && s.id === sectId;
      });
      out.push({
        kind: 'sect', key: sectId, element: member ? member.element : null,
        name: `${SECTS[sectId].name} sect`, count,
        tiers: tiers.map((t) => ({ ...t, earned: count >= t.count })),
      });
    }
    // Sects after elements at the same size, so a party reads as its
    // elements first and the deeper commitment second.
    return out.sort((a, b) => b.count - a.count ||
      (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'element' ? -1 : 1));
  }

  // The orders still standing. Anything offering sects as a CHOICE --
  // a filter, a banner schedule, a roster of who is out there -- wants
  // this rather than SECTS, or it offers a closed order as somewhere a
  // hero could come from.
  function liveSects() {
    return Object.values(SECTS).filter((s) => !s.defunct);
  }

  function sectOf(defOrId) {
    const id = typeof defOrId === 'string' ? defOrId : defOrId && defOrId.id;
    if (!id) return null;
    for (const sect of Object.values(SECTS)) {
      if (sect.members.includes(id)) return sect;
    }
    return null;
  }

  // Party bonuses (race packs, element resonance, sect packs, blessing
  // companies, prismatic accord, motley company) were removed wholesale:
  // heroes now bring exactly what their own kit and gear say, no matter
  // who stands beside them.

  return { of, NAMES, SECTS, liveSects, sectOf,
    ELEMENT_NAMES, ELEMENT_PARTY_BONUSES, elementCounts, elementTiers,
    SECT_PARTY_BONUSES, sectCounts, sectTiers, PREVIEW_MIN,
    applyParty, previewParty };
})();
