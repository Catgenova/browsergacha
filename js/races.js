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
    'toll', 'javarious', 'leonardo', 'oak', 'silas', 'eli', 'sawyer',
    'polarus', 'andrew', 'angelica', 'ari', 'cain', 'bit', 'tanner',
    'lucian', 'franz', 'carl', 'esmerelda', 'slick', 'samuels', 'lin', 'koe', 'cleo', 'artur',
    'tumble', 'posie', 'galen', 'ilyra', 'ryn',
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
  // No. 4 and runs eight strong). Members are hero ids; 'echo' is
  // Aniani, 'florence' is Tide (the Crystal Blade wears Cryst blue).
  const SECTS = {
    cryst:     { id: 'cryst',     name: 'Cryst',     number: 1,
                 members: ['polarus', 'echo', 'florence', 'andrew', 'angelica', 'ari', 'cain', 'bit', 'tanner'] },
    hedge:     { id: 'hedge',     name: 'Hedge',     number: 3,
                 members: ['vex', 'coral'] },
    reverence: { id: 'reverence', name: 'Reverence', number: 4,
                 members: ['catherine', 'toll', 'javarious', 'leonardo', 'oak', 'silas', 'eli', 'emily', 'artur'] },
    // Sawyer's order; a one-member sect costs nothing and claims the
    // name until its pack is specced.
    shadowflower: { id: 'shadowflower', name: 'Shadowflower', number: 2,
                 members: ['sawyer'] },
    // Lucian's order; Franz the firebreather is its second act.
    firetroupe: { id: 'firetroupe', name: 'Firetroupe', number: 5,
                 members: ['lucian', 'franz', 'carl', 'esmerelda', 'slick', 'samuels', 'lin', 'koe', 'cleo'] },
    // The Nightflowers hold their number and their name ahead of their
    // roster — the same courtesy Shadowflower got. Members land as the
    // heroes themselves are wired.
    nightflower: { id: 'nightflower', name: 'Nightflower', number: 6,
                 members: [] },
    // Tumble's order: acrobats who fight by never standing still.
    whisperchime: { id: 'whisperchime', name: 'Whisperchime', number: 7,
                 members: ['tumble', 'posie', 'galen', 'ilyra', 'ryn', 'vivian'] },
  };
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

  return { of, NAMES, SECTS, sectOf };
})();
