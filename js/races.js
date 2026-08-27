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
  // and keep one anyway. A non-human sect is nine strong by a different
  // arithmetic than the human nine: one 1★, two 2★, three 3★, two 4★
  // and a single 5★ at the top of it.
  const SECTS = {
    cryst:     { id: 'cryst',     name: 'Cryst',     number: 1,
                 members: ['polarus', 'echo', 'florence', 'andrew', 'angelica', 'ari', 'cain', 'bit', 'tanner'] },
    hedge:     { id: 'hedge',     name: 'Hedge',     number: 3,
                 members: ['vex', 'coral'] },
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
    nightflower: { id: 'nightflower', name: 'Nightflower', number: 6,
                 members: ['sawyer', 'noctelle', 'sable', 'evelune', 'lysandra',
                           'morrow', 'valere', 'lenore', 'dorian'] },
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
    // NOTE ON THE FIRST TWO TIERS. Both are correct and both currently
    // do NOTHING, because nothing in the game carries resistance --
    // zero on all 65 heroes, every enemy and every boss. The landing
    // contest is `max(0.15, 1 - max(0, resistance - accuracy))`, so at
    // resistance 0 it is already a certainty and neither more accuracy
    // nor piercing a ward that is not there can improve on it.
    //
    // They wake up the moment anything on the enemy side has resistance
    // -- an enemy hero casting one of the four resistance buffs on the
    // roster today, or bosses and elites being given a base value.
    // test/rules.test.js states both halves: that they are inert at
    // resistance 0, and that they work against a target that has some.
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
        count: 4, name: 'Catches Twice',
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

  // What a prospective party WOULD earn, without building a battle --
  // the team screen's readout. Takes hero defs rather than units.
  function previewParty(defs) {
    const out = [];
    for (const [element, count] of Object.entries(elementCounts(defs))) {
      const tiers = ELEMENT_PARTY_BONUSES[element] || [];
      if (tiers.length === 0) continue;
      out.push({
        element, name: ELEMENT_NAMES[element], count,
        tiers: tiers.map((t) => ({ ...t, earned: count >= t.count })),
      });
    }
    return out.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
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
    applyParty, previewParty };
})();
