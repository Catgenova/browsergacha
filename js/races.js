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
  // The humans are named individuals rather than "<race> <role>", so
  // they're an explicit roster. Listed by id, not inferred, so bosses
  // and future one-off ids never fall into the race by accident.
  const HUMANS = new Set([
    'florence', 'vivian', 'vex', 'emily', 'coral', 'catherine', 'echo',
    'toll', 'javarious', 'leonardo', 'oak', 'silas',
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

  // Human sects: the named heroes belong to orders, each with an
  // assigned number (a designation, not a roster size — Reverence is
  // No. 4 and runs five strong). Members are hero ids; 'echo' is
  // Aniani. Florence stands outside the sects for now.
  const SECTS = {
    cryst:     { id: 'cryst',     name: 'Cryst',     number: 1,
                 members: ['echo'] },
    hedge:     { id: 'hedge',     name: 'Hedge',     number: 3,
                 members: ['vex', 'vivian', 'coral', 'emily'] },
    reverence: { id: 'reverence', name: 'Reverence', number: 4,
                 members: ['catherine', 'toll', 'javarious', 'leonardo', 'oak', 'silas'] },
  };
  function sectOf(defOrId) {
    const id = typeof defOrId === 'string' ? defOrId : defOrId && defOrId.id;
    if (!id) return null;
    for (const sect of Object.values(SECTS)) {
      if (sect.members.includes(id)) return sect;
    }
    return null;
  }

  let bonusCache = null;
  function buildBonuses() {
    if (bonusCache) return bonusCache;
    const out = {};
    // Load-order guard: races.js is evaluated before gear.js, so the
    // table only materialises (and caches) once Gear exists.
    if (typeof Gear === 'undefined') return out;
    for (const race of Object.keys(NAMES)) {
      if (race === 'human') continue;
      const set = Gear.SETS[SET_OF_RACE[race] || race];
      if (!set) continue;
      out[race] = set.bonuses.map((b) => ({
        count: b.pieces + 1,
        mods: { [b.stat]: b.add },
        label: `${b.pieces + 1}: ${b.label.replace(/^\dpc: /, '')}`,
      }));
    }
    bonusCache = out;
    return out;
  }

  // Element synergy: fielding 3/5/7 heroes of one ELEMENT also grants
  // stacking bonuses, themed to the element's identity.
  const ELEMENT_NAMES = {
    water: 'Water', fire: 'Fire', wind: 'Wind', dark: 'Dark', light: 'Light',
  };
  // Tiers stack: the 5-piece mod is the step from the 3-piece value to
  // the 5-piece total (e.g. 15% -> 20% is a +5% step). Additive channels
  // (crit, accuracy, healing) step exactly; multiplicative ones (SPD,
  // DEF) use a step chosen so the product still lands on the total.
  const ELEMENT_BONUSES = {
    water: [
      { count: 3, mods: { defPct: 0.15 }, label: '3: +15% DEF' },
      { count: 5, mods: { defPct: 0.0435 }, label: '5: +20% DEF total' },
      { count: 7, mods: { reflect: 0.15 }, label: '7: reflects 15% of damage taken' },
    ],
    fire: [
      { count: 3, mods: { critChance: 0.15 }, label: '3: +15% Crit Chance' },
      { count: 5, mods: { critChance: 0.05 }, label: '5: +20% Crit Chance total' },
      { count: 7, mods: { critDamage: 0.80 }, label: '7: +80% Crit Damage' },
    ],
    wind: [
      { count: 3, mods: { spdPct: 0.15 }, label: '3: +15% SPD' },
      { count: 5, mods: { spdPct: 0.0435 }, label: '5: +20% SPD total' },
      { count: 7, mods: { apOnEnemyTurn: 0.05 }, label: '7: +5 AP to each hero after every enemy turn' },
    ],
    dark: [
      { count: 3, mods: { accuracy: 0.15 }, label: '3: +15% Accuracy' },
      { count: 5, mods: { accuracy: 0.05 }, label: '5: +20% Accuracy total' },
      { count: 7, mods: { debuffExtraChance: 0.5 }, label: '7: debuffs have a 50% chance to last an extra turn' },
    ],
    light: [
      { count: 3, mods: { healBoost: 0.15 }, label: '3: +15% Healing' },
      { count: 5, mods: { healBoost: 0.05 }, label: '5: +20% Healing total' },
      { count: 7, mods: { takenMult: 0.85 }, label: '7: takes 15% less damage' },
    ],
  };

  // Race headcount for a list of hero defs (or units).
  function counts(defs) {
    const tally = {};
    for (const d of defs) {
      const r = of(d.def || d);
      if (r) tally[r] = (tally[r] || 0) + 1;
    }
    return tally;
  }

  // Element headcount for a list of hero defs (or units).
  function elementCounts(defs) {
    const tally = {};
    for (const d of defs) {
      const el = (d.def || d).element;
      if (el) tally[el] = (tally[el] || 0) + 1;
    }
    return tally;
  }

  function activeElementTiers(element, count) {
    return (ELEMENT_BONUSES[element] || []).filter((t) => count >= t.count);
  }

  // The tiers a given headcount unlocks for one race.
  function activeTiers(race, count) {
    return (buildBonuses()[race] || []).filter((t) => count >= t.count);
  }

  // Fold one tier's mods into a built Unit (same channels gear uses).
  function applyModsToUnit(unit, mods) {
    if (mods.hpPct) {
      unit.maxHp = Math.round(unit.maxHp * (1 + mods.hpPct));
      unit.hp = unit.maxHp;
    }
    if (mods.atkPct) unit.baseAtk = Math.round(unit.baseAtk * (1 + mods.atkPct));
    if (mods.defPct) unit.baseDef = Math.round(unit.baseDef * (1 + mods.defPct));
    if (mods.spdPct) unit.speed = Math.round(unit.speed * (1 + mods.spdPct));
    if (mods.spdFlat) unit.speed += mods.spdFlat;
    if (mods.cdr) unit.gearCdr += mods.cdr;
    if (mods.dodge) unit.gearDodge += mods.dodge;
    if (mods.extraTurn) unit.gearExtraTurn += mods.extraTurn;
    if (mods.stun) unit.gearStun += mods.stun;
    if (mods.reflect) unit.gearReflect += mods.reflect;
    if (mods.regen) unit.gearRegen += mods.regen;
    if (mods.apDrain) unit.gearApDrain += mods.apDrain;
    if (mods.apGain) unit.gearApGain += mods.apGain;
    if (mods.accuracy) unit.gearAccuracy += mods.accuracy;
    if (mods.dotBoost) unit.gearDotBoost += mods.dotBoost;
    if (mods.healBoost) unit.gearHealBoost += mods.healBoost;
    if (mods.resistance) unit.gearResistance += mods.resistance;
    if (mods.critChance) unit.baseCritChance += mods.critChance;
    if (mods.critDamage) unit.baseCritDamage += mods.critDamage;
    if (mods.takenMult) unit.synergyTakenMult *= mods.takenMult;
    if (mods.apOnEnemyTurn) unit.synergyApOnEnemyTurn += mods.apOnEnemyTurn;
    if (mods.debuffExtraChance) unit.synergyDebuffExtraChance += mods.debuffExtraChance;
  }

  // Apply party synergy (race packs AND element resonance) to a built
  // player team. Returns a battle-log summary:
  //   [{ title, count, labels: [...] }].
  function applyParty(units) {
    const active = [];
    const tally = counts(units);
    for (const [race, count] of Object.entries(tally)) {
      const tiers = activeTiers(race, count);
      if (tiers.length === 0) continue;
      // The pack pays out to EVERYONE fielded, not just the race that
      // earned it -- it is the party-wide copy of that race's gear set.
      for (const unit of units) {
        for (const tier of tiers) applyModsToUnit(unit, tier.mods);
      }
      active.push({ title: `${NAMES[race]} pack`, count,
        labels: tiers.map((t) => t.label) });
    }
    const elTally = elementCounts(units);
    for (const [el, count] of Object.entries(elTally)) {
      const tiers = activeElementTiers(el, count);
      if (tiers.length === 0) continue;
      for (const unit of units) {
        if (unit.def.element !== el) continue;
        for (const tier of tiers) applyModsToUnit(unit, tier.mods);
      }
      active.push({ title: `${ELEMENT_NAMES[el]} resonance`, count,
        labels: tiers.map((t) => t.label) });
    }
    return active;
  }

  return {
    of, NAMES, counts, activeTiers, SECTS, sectOf,
    get BONUSES() { return buildBonuses(); },
    ELEMENT_NAMES, ELEMENT_BONUSES, elementCounts, activeElementTiers,
    applyParty,
  };
})();
