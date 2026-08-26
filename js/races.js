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
    // Sawyer's old home, emptied when he was recognised as the
    // Nightflower his whole kit already said he was. The number is kept
    // so the sect list does not renumber under saves that remember it.
    shadowflower: { id: 'shadowflower', name: 'Shadowflower', number: 2,
                 members: [] },
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
                 members: ['hallow', 'ike', 'jack', 'phil', 'peck', 'talon', 'bo', 'wanda', 'polo'] },
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
