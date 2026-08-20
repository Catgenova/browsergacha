// Campaign data: nine chapters, one per race and its homeland, each a
// small branching map that ends at that race's boss.
//
// A chapter is a directed graph, not a list. Nodes carry a (col, row)
// for layout and a `from` list naming their prerequisites; a node opens
// as soon as ANY prerequisite is cleared, so a fork is a genuine choice
// of route rather than two chores. Dead-end spurs hold the elites: they
// are never on the critical path, and they hold the chapter's gear.
//
// `holderScale` retunes a chapter's boss for the campaign without
// touching the boss definition the boss-stage ladder depends on. The
// roster is unevenly tuned against level — at the same level the Lion
// Regent is roughly three times the Rat King — so a single level ladder
// cannot give a smooth run of chapters. Each value is 85% of the
// hardest scale a plausible team for that chapter still beat in a
// headless sweep, leaving the holder a real fight with some headroom.
// Re-measure rather than nudge these by eye.
//
// Encounters are NOT stored here. js/campaign.js derives each node's
// enemy line-up deterministically from the node's own id, so a stage is
// the same fight every time it is opened — learnable, and losable. A
// node can pin its roster explicitly with `enemies: [...]` when a fight
// is worth hand-building; everything else is derived.

const CAMPAIGN = (() => {
  // ---- Map shapes -------------------------------------------------------
  // Three topologies, rotated across the chapters so no two neighbours
  // read the same. `c`/`r` are grid cells; the screen scales them to fit.
  //   normal — an ordinary fight on a route
  //   elite  — tougher, better paid, always on a spur
  //   boss   — the chapter's holder, and the only way to finish it
  const SHAPES = {
    // A single road that forks once and rejoins, with two spurs.
    fork: [
      { key: 'a', c: 0, r: 1, from: [] },
      { key: 'b', c: 1, r: 1, from: ['a'] },
      { key: 'c', c: 2, r: 0, from: ['b'] },
      { key: 'd', c: 2, r: 2, from: ['b'] },
      { key: 'e', c: 3, r: 0, from: ['c'] },
      { key: 'f', c: 3, r: 2, from: ['d'] },
      { key: 'g', c: 4, r: 1, from: ['e', 'f'] },
      { key: 'h', c: 5, r: 0, from: ['g'], type: 'elite' },
      { key: 'i', c: 5, r: 2, from: ['g'], type: 'elite' },
      { key: 'j', c: 5, r: 1, from: ['g'] },
      { key: 'boss', c: 6, r: 1, from: ['j'], type: 'boss' },
    ],
    // Three roads out of the gate, converging on a single crossing.
    roads: [
      { key: 'a', c: 0, r: 1, from: [] },
      { key: 'b', c: 1, r: 0, from: ['a'] },
      { key: 'c', c: 1, r: 1, from: ['a'] },
      { key: 'd', c: 1, r: 2, from: ['a'] },
      { key: 'e', c: 2, r: 0, from: ['b'], type: 'elite' },
      { key: 'f', c: 2, r: 1, from: ['c'] },
      { key: 'g', c: 2, r: 2, from: ['d'], type: 'elite' },
      { key: 'h', c: 3, r: 1, from: ['e', 'f', 'g'] },
      { key: 'i', c: 4, r: 0, from: ['h'] },
      { key: 'j', c: 4, r: 2, from: ['h'] },
      { key: 'k', c: 5, r: 1, from: ['i', 'j'] },
      { key: 'boss', c: 6, r: 1, from: ['k'], type: 'boss' },
    ],
    // A straight march with three optional elites hanging off it.
    gauntlet: [
      { key: 'a', c: 0, r: 1, from: [] },
      { key: 'b', c: 1, r: 1, from: ['a'] },
      { key: 'c', c: 1, r: 0, from: ['b'], type: 'elite' },
      { key: 'd', c: 2, r: 1, from: ['b'] },
      { key: 'e', c: 3, r: 1, from: ['d'] },
      { key: 'f', c: 3, r: 2, from: ['e'], type: 'elite' },
      { key: 'g', c: 4, r: 1, from: ['e'] },
      { key: 'h', c: 4, r: 0, from: ['g'], type: 'elite' },
      { key: 'i', c: 5, r: 1, from: ['g'] },
      { key: 'boss', c: 6, r: 1, from: ['i'], type: 'boss' },
    ],
  };

  // ---- Chapters ---------------------------------------------------------
  // `location` indexes CONFIG.LOCATION_NAMES / BATTLE_BGS and picks the
  // enemy pool from LOCATION_ENEMIES; `boss` keys into BOSSES. `names`
  // runs in the same order as the shape's node list.
  const CHAPTERS = [
    {
      id: 'ch1',
      holderScale: 0.95,
      title: 'The Clearing',
      subtitle: 'What the rats took',
      location: 0,
      boss: 'rat_king',
      shape: 'gauntlet',
      intro: 'It began as missing grain. Then missing tools, then missing ' +
        'neighbours. The clearing at the edge of the fields belongs to the ' +
        'rat cohort now, and their king has learned that nobody comes out ' +
        'this far to argue.',
      outro: 'The Rat King dies badly and loudly, and the clearing goes quiet ' +
        'for the first time in a season. In the wreck of his hoard, someone ' +
        'has drawn a map. The canyon is marked.',
      names: ['Trampled Furrow', 'The Grain Sheds', 'Chittering Hollow',
        'Broken Fenceline', 'The Sour Well', 'Nest of Knives',
        'Under the Millstone', 'Gnawmaster\'s Den', 'The Filth Crown',
        'Throne of Scraps'],
    },
    {
      id: 'ch2',
      holderScale: 0.45,
      title: 'The Canyon',
      subtitle: 'Everything here has wings',
      location: 1,
      boss: 'carrion_king',
      shape: 'fork',
      intro: 'The map leads to a canyon where the wind never stops and the ' +
        'thermals carry things that watch you walk. The avians do not raid ' +
        'for food. They raid because the canyon is theirs and you are in it.',
      outro: 'The Carrion King folds out of the sky one last time and does ' +
        'not come back up. The flocks scatter east, toward the bonefield, ' +
        'and something down there is already waiting for them.',
      names: ['Windcut Steps', 'The Updraft', 'Ledge of Small Bones',
        'Screaming Narrows', 'Feathered Scree', 'The Long Fall',
        'Eyrie Approach', 'Talonhold', 'The Stripped Perch', 'Kingsperch Ascent',
        'Carrion Roost'],
    },
    {
      id: 'ch3',
      holderScale: 0.65,
      title: 'The Bonefield',
      subtitle: 'A maze built out of the dead',
      location: 2,
      boss: 'labyrinth_king',
      shape: 'roads',
      intro: 'The bonefield is not a graveyard. It is a floor plan. The ' +
        'minotaurs have been building down here for longer than the fields ' +
        'have been fields, and every wall of it used to walk.',
      outro: 'The Labyrinth King falls across his own threshold, which is ' +
        'the only door he ever guarded. The passages behind him open onto ' +
        'grass, and sunlight, and the smell of a meadow.',
      names: ['Threshold of Ribs', 'The Left Passage', 'Marrow Gate',
        'The Right Passage', 'Hall of Wrong Turns', 'Chalk Corridor',
        'The Bellowing Dark', 'Skullkeep', 'Ossuary Stair',
        'The Last Corner', 'The Minotaur\'s Door', 'Horn Gallery'],
    },
    {
      id: 'ch4',
      holderScale: 0.3,
      title: 'The Meadow',
      subtitle: 'Softness is the trap',
      location: 3,
      boss: 'lion_regent',
      shape: 'fork',
      intro: 'After the bonefield the meadow looks like mercy. It is warm, ' +
        'it is open, and it is patrolled by a court of cats who have never ' +
        'once been in a hurry. Their Regent grants audiences. He rarely ' +
        'grants departures.',
      outro: 'The Lion Regent accepts the loss with more grace than he ' +
        'accepted the challenge. His court disperses uphill, into the ' +
        'valley, where something much larger is asleep.',
      names: ['Sunwarm Grass', 'The Purring Path', 'Nine Tails Crossing',
        'Velvet Ambush', 'The Long Stretch', 'Silent Pounce',
        'Court of Whiskers', 'The Gilded Claw', 'Pride Gate',
        'The Sunning Steps', 'The Regent\'s Lawn'],
    },
    {
      id: 'ch5',
      holderScale: 0.45,
      title: 'The Valley',
      subtitle: 'Wake nothing',
      location: 4,
      boss: 'elder_bear',
      shape: 'gauntlet',
      intro: 'The valley is the bears\' larder and their bedroom, and they ' +
        'do not distinguish between the two. Every path through is a path ' +
        'past something enormous that would rather be sleeping.',
      outro: 'The Elder Bear goes down like a hillside giving way. The ' +
        'valley exhales. Beyond the ridge the grass turns yellow and hard, ' +
        'and the ground starts to shake in a rhythm.',
      names: ['Berry Thicket', 'The Salmon Run', 'Clawed Pine',
        'Rockfall Pass', 'The Winter Cache', 'Den of the Sows',
        'Honeyrot Grove', 'Broadback Ridge', 'The Old Scars',
        'Elder\'s Hollow'],
    },
    {
      id: 'ch6',
      holderScale: 0.6,
      title: 'The Savanna',
      subtitle: 'They charge in a line',
      location: 5,
      boss: 'boar_king',
      shape: 'roads',
      intro: 'The boars do not ambush and they do not negotiate. They form ' +
        'up on the high yellow grass, they pick a direction, and then they ' +
        'are simply coming, and the ground is coming with them.',
      outro: 'The Boar King breaks his own charge on your line and does not ' +
        'get up. The herds turn south into the wet green, where the grass ' +
        'stops making noise underfoot.',
      names: ['Dust Line', 'The Left Flank', 'Tusk Furrow', 'The Right Flank',
        'Bristleback Rise', 'The Wallow', 'Trampled Ground',
        'Stampede Corridor', 'Gore Hollow', 'The Muster', 'The Broken Line',
        'Tusk Throne'],
    },
    {
      id: 'ch7',
      holderScale: 0.4,
      title: 'The Glade',
      subtitle: 'The green is not empty',
      location: 6,
      boss: 'snake_empress',
      shape: 'fork',
      intro: 'The marsh-glade is warm, wet and patient. The serpents here ' +
        'do not need to win a fight; they need you to still be standing in ' +
        'the same place in an hour. Their Empress has been waiting far ' +
        'longer than that.',
      outro: 'The Empress uncoils, and keeps uncoiling, and then stops. The ' +
        'glade drains cold. North of it the air starts to bite and the ' +
        'water underfoot goes hard.',
      names: ['Reed Shallows', 'The Slow Water', 'Coil Root',
        'Fangleaf Bank', 'The Sunning Stones', 'Venom Bloom',
        'Shed Skins', 'The Constrictor', 'Emerald Antechamber',
        'The Warm Dark', 'The Empress\'s Coil'],
    },
    {
      id: 'ch8',
      holderScale: 0.9,
      title: 'The Snowfield',
      subtitle: 'They hunt as one animal',
      location: 7,
      boss: 'winter_alpha',
      shape: 'gauntlet',
      intro: 'On the snowfield the wolves let you see one of them. That one ' +
        'is not the problem. The pack decides together, moves together, and ' +
        'has already decided about you.',
      outro: 'The Winter Alpha dies with the pack watching, and the pack ' +
        'does not avenge her — it simply stops being a pack. Far to the ' +
        'east the snow is melting off a mountain that is warm from inside.',
      names: ['Crust and Powder', 'The First Howl', 'Frostjaw Draw',
        'Whiteout Ridge', 'The Circling', 'Bloodied Drift',
        'Icefang Pass', 'The Flanking Wind', 'Alpha\'s Approach',
        'The Winter Den'],
    },
    {
      id: 'ch9',
      holderScale: 0.45,
      title: 'The Volcano',
      subtitle: 'The thing the others were running from',
      location: 8,
      boss: 'dragon',
      shape: 'roads',
      intro: 'Every road you have walked has pointed here, and every race ' +
        'you have fought was moving away from it. The drakes on the slopes ' +
        'are not guards. They are the ones who did not run fast enough.',
      outro: 'The Dragon comes apart over its own hoard, and the mountain ' +
        'goes quiet enough to hear the wind again. Behind you the clearing, ' +
        'the canyon, the bonefield and all the rest are just places now.',
      names: ['Ashfall Slope', 'The Cinder Road', 'Obsidian Shelf',
        'The Smoke Road', 'Emberwing Perch', 'Sulphur Terrace',
        'Molten Stair', 'The Caldera Rim', 'Hoardlight', 'Scaled Gate',
        'The Last Ascent', 'The Dragon\'s Seat'],
    },
  ];

  // Stitch the shape into each chapter: real node objects with ids,
  // names, types, prerequisites and a BFS depth for difficulty scaling.
  for (const ch of CHAPTERS) {
    const shape = SHAPES[ch.shape];
    ch.nodes = shape.map((cell, i) => ({
      id: `${ch.id}_${cell.key}`,
      key: cell.key,
      chapterId: ch.id,
      name: ch.names[i] || `Stage ${i + 1}`,
      type: cell.type || 'normal',
      col: cell.c,
      row: cell.r,
      from: cell.from.map((k) => `${ch.id}_${k}`),
    }));
    // Depth = longest path from the entrance, so a node's difficulty
    // matches how far in it is by the slowest route rather than the
    // luckiest one. The shapes are small DAGs listed in order, so a
    // single forward pass settles it.
    const byId = new Map(ch.nodes.map((n) => [n.id, n]));
    for (const n of ch.nodes) {
      n.depth = n.from.length
        ? Math.max(...n.from.map((f) => byId.get(f).depth)) + 1
        : 0;
    }
    ch.maxDepth = Math.max(...ch.nodes.map((n) => n.depth));
    delete ch.names;
  }

  return { CHAPTERS, SHAPES };
})();
