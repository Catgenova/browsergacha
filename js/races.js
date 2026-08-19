// Race synergy: fielding 3 / 5 / 7 heroes of one race grants the whole
// party's members of that race stacking bonuses (tiers add up, like
// gear sets). Applied to the PLAYER party when a battle is built.

const RACES = (() => {
  // Bird heroes are named by species, so the avian race is a lookup set.
  const BIRD_SPECIES = new Set([
    'vulture', 'kingfisher', 'rook', 'rooster', 'owl', 'eagle', 'raven',
    'sparrow', 'pelican', 'heron', 'finch', 'duck', 'magpie', 'woodpecker',
    'gull', 'crane', 'falcon', 'parrot', 'goose', 'hawk', 'swan', 'phoenix',
    'albatross', 'peacock', 'stork', 'crow', 'cuckoo', 'shrike', 'nightjar',
    'whippoorwill', 'dove', 'egret', 'goldfinch', 'lark', 'ibis',
  ]);
  const PREFIXES = new Set([
    'rat', 'minotaur', 'snake', 'wolf', 'boar', 'bear', 'cat', 'drake',
  ]);

  const NAMES = {
    rat: 'Rat', avian: 'Avian', minotaur: 'Minotaur', snake: 'Snake',
    wolf: 'Wolf', boar: 'Boar', bear: 'Bear', cat: 'Cat', drake: 'Drake',
  };

  // Which race a hero definition belongs to (null for the founders and
  // bosses — they stand outside the packs).
  function of(def) {
    if (!def || !def.id) return null;
    const head = def.id.split('_')[0];
    if (PREFIXES.has(head)) return head;
    if (BIRD_SPECIES.has(head)) return 'avian';
    return null;
  }

  // Tiered bonuses per race; tiers STACK (a 7-race party gets all three).
  // mods use the same stat channels as gear (see Gear.applyToStats/Unit).
  const BONUSES = {
    rat: [
      { count: 3, mods: { dodge: 0.05 }, label: '3: +5% Dodge' },
      { count: 5, mods: { dodge: 0.05 }, label: '5: +5% more Dodge' },
      { count: 7, mods: { extraTurn: 0.10 }, label: '7: +10% chance for an extra turn' },
    ],
    avian: [
      { count: 3, mods: { spdPct: 0.05 }, label: '3: +5% SPD' },
      { count: 5, mods: { spdPct: 0.05 }, label: '5: +5% more SPD' },
      { count: 7, mods: { spdPct: 0.10 }, label: '7: +10% more SPD' },
    ],
    minotaur: [
      { count: 3, mods: { atkPct: 0.05 }, label: '3: +5% ATK' },
      { count: 5, mods: { atkPct: 0.05 }, label: '5: +5% more ATK' },
      { count: 7, mods: { atkPct: 0.10 }, label: '7: +10% more ATK' },
    ],
    snake: [
      { count: 3, mods: { accuracy: 0.10 }, label: '3: +10% Debuff Accuracy' },
      { count: 5, mods: { accuracy: 0.10 }, label: '5: +10% more Accuracy' },
      { count: 7, mods: { dotBoost: 0.25 }, label: '7: +25% DoT Damage' },
    ],
    wolf: [
      { count: 3, mods: { stun: 0.04 }, label: '3: +4% Stun chance' },
      { count: 5, mods: { stun: 0.04 }, label: '5: +4% more Stun chance' },
      { count: 7, mods: { stun: 0.07 }, label: '7: +7% more Stun chance' },
    ],
    boar: [
      { count: 3, mods: { defPct: 0.08 }, label: '3: +8% DEF' },
      { count: 5, mods: { defPct: 0.08 }, label: '5: +8% more DEF' },
      { count: 7, mods: { reflect: 0.10 }, label: '7: +10% chance to reflect damage' },
    ],
    bear: [
      { count: 3, mods: { hpPct: 0.08 }, label: '3: +8% HP' },
      { count: 5, mods: { hpPct: 0.08 }, label: '5: +8% more HP' },
      { count: 7, mods: { regen: 0.03 }, label: '7: restores 3% max HP each turn' },
    ],
    cat: [
      { count: 3, mods: { apDrain: 0.05 }, label: '3: +5% AP Drain on attack' },
      { count: 5, mods: { apDrain: 0.05 }, label: '5: +5% more AP Drain' },
      { count: 7, mods: { apGain: 0.03 }, label: '7: +3% AP on every character turn' },
    ],
    drake: [
      { count: 3, mods: { dotBoost: 0.08 }, label: '3: +8% DoT Damage' },
      { count: 5, mods: { dotBoost: 0.07 }, label: '5: +7% more DoT Damage' },
      { count: 7, mods: { dotBoost: 0.15 }, label: '7: +15% more DoT Damage' },
    ],
  };

  // Element synergy: fielding 3/5/7 heroes of one ELEMENT also grants
  // stacking bonuses, themed to the element's identity.
  const ELEMENT_NAMES = {
    water: 'Water', fire: 'Fire', wind: 'Wind', dark: 'Dark', light: 'Light',
  };
  const ELEMENT_BONUSES = {
    water: [
      { count: 3, mods: { healBoost: 0.08 }, label: '3: +8% Healing' },
      { count: 5, mods: { healBoost: 0.08 }, label: '5: +8% more Healing' },
      { count: 7, mods: { regen: 0.02 }, label: '7: restores 2% max HP each turn' },
    ],
    fire: [
      { count: 3, mods: { atkPct: 0.04 }, label: '3: +4% ATK' },
      { count: 5, mods: { atkPct: 0.04 }, label: '5: +4% more ATK' },
      { count: 7, mods: { critDamage: 0.15 }, label: '7: +15% Crit Damage' },
    ],
    wind: [
      { count: 3, mods: { spdPct: 0.04 }, label: '3: +4% SPD' },
      { count: 5, mods: { spdPct: 0.04 }, label: '5: +4% more SPD' },
      { count: 7, mods: { dodge: 0.05 }, label: '7: +5% Dodge' },
    ],
    dark: [
      { count: 3, mods: { critChance: 0.05 }, label: '3: +5% Crit Chance' },
      { count: 5, mods: { critChance: 0.05 }, label: '5: +5% more Crit Chance' },
      { count: 7, mods: { atkPct: 0.08 }, label: '7: +8% ATK' },
    ],
    light: [
      { count: 3, mods: { resistance: 0.06 }, label: '3: +6% Resistance' },
      { count: 5, mods: { resistance: 0.06 }, label: '5: +6% more Resistance' },
      { count: 7, mods: { takenMult: 0.96 }, label: '7: takes 4% less damage' },
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
    return (BONUSES[race] || []).filter((t) => count >= t.count);
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
      for (const unit of units) {
        if (of(unit.def) !== race) continue;
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
    of, NAMES, BONUSES, counts, activeTiers,
    ELEMENT_NAMES, ELEMENT_BONUSES, elementCounts, activeElementTiers,
    applyParty,
  };
})();
