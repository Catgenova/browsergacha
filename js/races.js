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
    'tervan', 'nehru', 'cirrus', 'kiri', 'strix', 'calima', 'mendral', 'balmor', 'brannoc',
    // Sunbrood, likewise.
    'aurek', 'durn', 'nemeris', 'aster', 'rizzo', 'mavros', 'orien', 'solari', 'nestora',
    'necros', 'click', 'rend', 'crook', 'pox', 'malachar', 'shrike', 'omen', 'carrion',
  ]);

  // The humans are named individuals rather than "<race> <role>", so
  // they're an explicit roster. Listed by id, not inferred, so bosses
  // and future one-off ids never fall into the race by accident.
  // Named cats. Same reasoning as AVIANS above: a sect's members are
  // individuals rather than "<species> <role>" generated bodies, so the
  // roster is explicit. The `cat` PREFIX still catches the generated
  // cohort ids (cat_prowler and the rest); these are the Stillwater.
  const CATS = new Set([
    'tip', 'brock', 'friday', 'tiny', 'orr', 'princess', 'sands', 'donut', 'tub',
  ]);

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
    if (CATS.has(def.id)) return 'cat';
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
                 members: ['tervan', 'nehru', 'cirrus', 'kiri', 'strix', 'calima', 'mendral', 'balmor', 'brannoc'] },
    // The light brood, and the first sect built to a DIFFERENT shape:
    // the light and dark orders have no 1-star and no 2-star at all, so
    // this one runs four 3-stars, three 4-stars and two 5-stars. It
    // still comes to nine, and the shape is still declared on the sect
    // rather than assumed from whoever was written first, which is why
    // it costs nothing to hold a second one.
    sunbrood: { id: 'sunbrood', name: 'Sunbrood', number: 11,
                 shape: { 3: 4, 4: 3, 5: 2 },
                 members: ['aurek', 'durn', 'nemeris', 'aster', 'rizzo', 'mavros', 'orien', 'solari', 'nestora'] },
    // The dark birds, named and numbered ahead of their roster and
    // running the same shape the Sunbrood does -- light and dark share
    // an order structure, four 3-stars, three 4-stars and two 5-stars.
    //
    // The pack is written FIRST here, before a single hero, and it is
    // written that way on purpose: this sect has less free ground than
    // any other on the roster. The dark ELEMENT already sells the whole
    // "make a debuff stick" axis (+25% Accuracy, 20% resistance pierced,
    // a 50% chance of an extra turn), and the Nightflowers are already a
    // dark sect of debuffs and death (+8% damage per debuff on the
    // target, cooldowns off a fallen ally, damage per body on the
    // field). Knowing what the three tiers may NOT be is most of the
    // design, so they were settled before the art arrived rather than
    // after nine birds had been fitted around a guess.
    //
    // `founding` is a third state, and it needed one. A sect used to be
    // either standing (members) or defunct (buried, never gains any),
    // and this is neither: founded, numbered, packed, and waiting on
    // art. The flag is what tells an unfilled order from a sect that
    // lost its roster to a bad edit -- it is declared here and removed
    // the day the first bird lands, at which point the roster test goes
    // back to demanding members.
    hollowbone: { id: 'hollowbone', name: 'Hollowbone', number: 12,
                 race: 'avian', shape: { 3: 4, 4: 3, 5: 2 },
                 members: ['necros', 'click', 'rend', 'crook', 'pox', 'malachar', 'shrike', 'omen', 'carrion'] },
    // The cat sect, and the first one built on the ACTION BAR rather
    // than on damage, healing or hexes. Water by element, which puts it
    // beside Cryst without treading on it: Cryst is armour and freeze,
    // Stillwater is turn economy.
    //
    // The pack is written before a single cat, on the Hollowbone
    // precedent -- founded, numbered, packed, waiting on art. Knowing
    // what the three tiers ARE is most of the design of the nine heroes
    // that have to fill them, so it is settled first rather than fitted
    // around whoever gets written earliest.
    //
    // The shape is the bird spread, 1/2/3/2/1, because water carries
    // every rarity band (the light and dark orders run 4/3/2 only
    // because their elements have no 1- or 2-star shelf). It is a
    // ceiling on an empty roster today, so it costs one line to change
    // right up until the first cat lands.
    stillwater: { id: 'stillwater', name: 'Stillwater', number: 13,
                 race: 'cat',
                 shape: { 1: 1, 2: 2, 3: 3, 4: 2, 5: 1 },
                 members: ['tip', 'brock', 'friday', 'tiny', 'orr', 'princess',
                           'sands', 'donut', 'tub'] },
    // The fire cat sect, FOUNDING: numbered, packed, waiting on art, on
    // the Stillwater precedent. Where Stillwater is the water pride that
    // owns the ENEMY's action bar -- taking turns, keeping them, refusing
    // to give its own back -- Emberpride is the fire pride that stokes
    // its OWN: aggression pays tempo, tempo pays aggression. The two
    // never read as recolours of each other because they touch opposite
    // ends of the same meter.
    //
    // The shape is the full spread, 1/2/3/2/1, because fire carries
    // every rarity band. A ceiling on an empty roster costs one line to
    // change until the first cat lands.
    emberpride: { id: 'emberpride', name: 'Emberpride', number: 14,
                 race: 'cat', founding: true,
                 shape: { 1: 1, 2: 2, 3: 3, 4: 2, 5: 1 },
                 members: [] },
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
        // The one live tier of the three, and it covers DOTS as well now:
        // a burn or a poison is a debuff, so it gets the same coin flip.
        // The channel used to be read only inside the debuff branch of
        // abilities.js, which meant a dark party running poisons -- which
        // in a dark meta is most of what is being thrown -- got nothing
        // from its own 4-piece. The label always read as though it did.
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
            return unit.onHex(POSITION.FRONT) ? 0.80 : 1;
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
    // The brood turns TEMPO into SUSTAIN, which is the Razorwings'
    // conversion pointed the other way: they spend speed as damage,
    // these spend it as healing. Different element, so the two never
    // stack, and neither one is selling what its own element already
    // sells -- light's pack is max HP twice over (Congregation at 2pc,
    // Matins at 4pc), so not one of these three touches hpPct.
    //
    // The three feed each other on purpose. Quick Feathers buys speed,
    // Wingbeat Mend prices healing off speed, and Everything Given
    // widens the whole thing exactly when it matters. They ADD rather
    // than multiply -- healingBoost sums its hooks -- so a full brood
    // mending a badly hurt bird is about +55%, not a product that runs
    // away.
    sunbrood: [
      {
        count: 2, name: 'Quick Feathers',
        // Speed is the one thing light does not already sell, so the
        // brood is free to buy it outright -- and buying it here is
        // what makes the tier above worth anything.
        mods: { spdPct: 0.10, healBoost: 0.10 },
        label: '+10% SPD and +10% healing done',
      },
      {
        count: 3, name: 'Wingbeat Mend',
        // The conversion itself, and the sect's whole thesis in one
        // line: the faster the brood flies, the more it mends.
        //
        // Stepped per 20 rather than per 25, and the difference is the
        // element. Crosswind's rungs sit on wind, where the roster runs
        // 104 to 136 and the 2pc lifts it further; light runs 84 to 116
        // and its own pack buys no speed at all. At Crosswind's rung
        // size the first one needed 125 and exactly one light hero in
        // ten could reach it, so the tier would have been decoration on
        // a sect built to any normal statline. 20 puts the first rung
        // at 120, which a bird written anywhere near the brood's own
        // pace clears. Uncapped, like Crosswind.
        hooks: {
          healBoostAdd(unit) {
            const over = unit.effectiveStat('speed') - 100;
            return over <= 0 ? 0 : Math.floor(over / 20) * 0.05;
          },
        },
        label: '+5% healing done for every full 20 SPD above 100',
      },
      {
        count: 4, name: 'Everything Given',
        // Reads the PATIENT, not the healer. A mend is worth most to
        // whoever is closest to going down, and this is the only tier
        // in the game that prices it that way.
        hooks: {
          healBoostAdd(unit, patient) {
            if (!patient || !(patient.maxHp > 0)) return 0;
            return patient.hp / patient.maxHp < 0.5 ? 0.40 : 0;
          },
        },
        label: '+40% healing to an ally below half HP',
      },
    ],
    // The Hollowbones spend speed on DEBUFF DEPTH, and that is the
    // fourth conversion of the same pillar on the roster: wind banks
    // speed as extra turns, the Razorwings spend it as damage, the
    // Sunbrood spend it as healing, and these birds spend it on how much
    // a curse is worth once it is on.
    //
    // Depth is the one thing left. Their own element sells whether a
    // debuff LANDS (accuracy, resistance pierced) and how long it LASTS
    // (Lingering) -- never how hard it bites -- so all three tiers below
    // are about what an affliction is worth rather than about getting
    // one to stick, and none of them repeats the Nightflowers.
    hollowbone: [
      {
        count: 2, name: 'Rigor',
        // The conversion itself. Stepped per 20 like the Sunbrood's
        // rung rather than per 25 like Crosswind's, and for the same
        // reason: this is a dark roster, not a wind one, and a rung
        // nobody in the sect can reach is decoration.
        //
        // `debuffPowerAdd` moves a debuff AWAY FROM NEUTRAL, exactly as
        // the `debuffPower` ladder rung does -- so a -20% ATK deepens to
        // -25% and a x1.20 vulnerability rises to x1.25, and one number
        // reads correctly on a cut and an amplification alike.
        hooks: {
          debuffPowerAdd(unit) {
            const over = unit.effectiveStat('speed') - 100;
            return over <= 0 ? 0 : Math.floor(over / 20) * 0.05;
          },
        },
        label: '+5% debuff potency for every full 20 SPD above 100',
      },
      {
        count: 3, name: 'Deadweight',
        // Every curse they lay is heavier than it looks: it drags.
        //
        // Carried ON the debuff rather than read off the field, which is
        // the whole reason it is affordable. effectiveStat is called on
        // every tick of every meter and every damage calculation, and a
        // tier that made it scan the opposing team for a hook would be
        // paid for thousands of times a fight. Instead the weight is
        // stamped onto the affliction at the moment it lands (see
        // Abilities, the debuff and dot cases) and read out of the
        // status loop that was already running.
        //
        // It also keeps the board readable, which is the standing rule:
        // this lays no second icon. The drag rides on the curse that is
        // already showing.
        hooks: { slowPerDebuff: 0.03 },
        label: 'every curse they land also drags 3% off the victim\'s Speed',
      },
      {
        count: 4, name: 'Dry Bones',
        // The answer to the thing a debuff party actually loses to,
        // which is not damage -- it is an enemy healer outrunning them.
        // Scanned off the field rather than stamped on the curse,
        // because it is a property of being afflicted at all rather than
        // of any one affliction; heal() runs a few times a turn where
        // effectiveStat runs constantly, so the scan is affordable
        // there, and it is gated behind "is this unit even cursed"
        // so an unafflicted party never pays for it.
        hooks: { healCutOnDebuff: 0.30 },
        label: 'a cursed enemy recovers 30% less from anything',
      },
    ],
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
        // Where a boarding party actually lands. A boss spans every hex,
        // the front one included, so it DOES pay -- this read
        // `target.slot.position` and so quietly excluded the one enemy
        // a player most wanted the bonus against.
        hooks: {
          damageDealtMult(unit, target) {
            return target && target.onHex(POSITION.FRONT) ? 1.20 : 1;
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
              ally.bookAp(unit, CONFIG.TURN_METER_MAX * 0.10 * count);
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
            const hexes = Unit.debuffsOn(target);
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
    // Stillwater: take the turn, keep the turn, and never lose one.
    //
    // The three tiers are one machine rather than three bonuses. Cold
    // Current MAKES the drains, Undertow turns them from denial into
    // income, and Still Water means the same trick cannot be played
    // back. A party that reaches four cats is the only party in the game
    // whose action bars cannot be touched.
    stillwater: [
      {
        count: 2, name: 'Cold Current',
        // apDrainChance is read in Abilities.execute against every
        // target a cast actually damaged, so this scales with the width
        // of the swing: a sweep over seven bodies rolls seven times.
        //
        // The AMOUNT is the engine's, not ours -- a drain on attack
        // takes a flat 20% of the bar (abilities.js), and the tier buys
        // the CHANCE. The label says 20 because that is what happens.
        hooks: { apDrainAdd: 0.15 },
        label: 'landed hits have a 15% chance to cut 20% off the ' +
          "victim's action bar",
      },
      {
        count: 3, name: 'Undertow',
        // The share is 1: everything taken changes hands. Read inside
        // Abilities.drainMeter, so it covers every drain in the game and
        // not just the one Cold Current above supplies -- a cat with a
        // drain in its own kit feeds this too.
        //
        // Nothing is siphoned off a guarded, resisted or missed drain,
        // which is what keeps this from being free income against a team
        // that answered it.
        hooks: { meterSiphon: 1 },
        label: 'action bar taken from an enemy is handed to whoever took it',
      },
      {
        count: 4, name: 'Still Water',
        // A PRESENCE hook: Abilities.meterGuarded scans living allies
        // for it, so one cat standing covers the whole party -- and it
        // is checked before the resistance contest, so it is a refusal
        // rather than a saving throw.
        //
        // Deliberately the mirror of the 2pc. The sect that takes turns
        // is the sect that cannot have its own taken, and against
        // another Stillwater party both halves cancel exactly.
        hooks: { meterGuard: true },
        label: 'the party\'s action bars cannot be pushed backwards',
      },
    ],
    // Emberpride turns the Stillwater machine around. Their cousins take
    // the enemy's bar; this pride charges its own -- every tier below is
    // the party's aggression paid back as tempo. Nothing here drains,
    // siphons or guards, so the two cat packs stay tellable at a glance,
    // and nothing here resells what fire's own resonance already sells
    // (flat ATK, damage to the burning, the crit echo).
    //
    // The three feed each other in fight order. First Blood pays the
    // opener, Taste for It pays every good swing after it, and The Pride
    // Eats pays the whole table when a hunt closes -- open hot, crit
    // often, finish together.
    emberpride: [
      {
        count: 2, name: 'First Blood',
        // Read off the receipt rather than off a snapshot: dealt() hands
        // over the HP the blow actually took, so hp + amount IS the bar
        // the victim stood at before it landed. An opener absorbed
        // entirely by a shield never fires this (no HP lost, no hook),
        // and an overkill on a full bar still reads as full.
        //
        // Fires per target actually damaged, so a sweep over a fresh
        // line pays once per body -- the same width-scaling as Cold
        // Current, and the check on it is that an enemy is only
        // undamaged once. A fight pays this at the top and then it is
        // spent, unless a mender hands it back by topping somebody up.
        hooks: {
          onDealtDamage(unit, { amount, target, battle } = {}) {
            if (!target || target.team === unit.team || !(amount > 0)) return;
            if (target.hp + amount < target.maxHp) return;
            unit.turnMeter += CONFIG.TURN_METER_MAX * 0.15;
            if (battle) battle.addFloatingText(unit, '\u25b2 15%', '#ffb060');
          },
        },
        label: 'drawing first blood from an undamaged enemy pays the ' +
          'attacker 15% action bar',
      },
      {
        count: 3, name: 'Taste for It',
        // The crit travels to this hook through the dealt() payload,
        // threaded from strike where the roll is settled. A crit echo's
        // follow-up blow can never feed it -- the echo swings with
        // crit: false -- so a lucky hit pays once, not once per bounce.
        hooks: {
          onDealtDamage(unit, { crit, battle } = {}) {
            if (!crit) return;
            unit.turnMeter += CONFIG.TURN_METER_MAX * 0.20;
            if (battle) battle.addFloatingText(unit, '\u25b2 20%', '#ffb060');
          },
        },
        label: 'a critical hit refunds 20% of the action bar',
      },
      {
        count: 4, name: 'The Pride Eats',
        // Paid off the KILLER's copy of the hook, exactly once -- the
        // death ring fires this on every watcher, so anyone else's copy
        // returns without collecting. A death nobody dealt (a poison
        // tick, a reflect) has a null killer and pays nothing, same as
        // the Razorwings' kill bonus and for the same reason.
        //
        // The whole party eats, killer included -- a sect pack lifts
        // everyone fielded, never only its own. Booked to the killer as
        // handed-out bar, since the killer is who bought the tempo.
        hooks: {
          onUnitDied(unit, { victim, killer, battle } = {}) {
            if (!victim || killer !== unit) return null;
            if (victim.team === unit.team) return null;
            const b = battle || (typeof Battle !== 'undefined' ? Battle.active : null);
            const ring = b ? b.livingUnits(unit.team) : [unit];
            for (const ally of ring) {
              ally.turnMeter += CONFIG.TURN_METER_MAX * 0.10;
              ally.bookAp(unit, CONFIG.TURN_METER_MAX * 0.10);
            }
            if (b && b.log) {
              b.log(`The pride eats \u2014 the party gains 10% action bar.`,
                'log-system');
            }
            return null;
          },
        },
        label: "a kill hands the whole party 10% action bar",
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
  // The orders that are STANDING: neither buried nor still being
  // founded. This is what anything offering sects as a choice asks for
  // -- a filter, a banner schedule, a list of where heroes come from --
  // and all three of those want the same answer for the same reason: a
  // sect with nobody in it is not somewhere a hero can come from.
  //
  // It excluded only the defunct until the Stillwater cats were founded
  // ahead of their art, which would have put an empty name in every one
  // of those lists. The banner wheel already refused a founding sect on
  // its own; this is the same rule, kept once.
  function liveSects() {
    return Object.values(SECTS).filter((s) => !s.defunct && !s.founding);
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
