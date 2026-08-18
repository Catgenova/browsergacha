// Enemy roster: units derived from their hero definitions (same art and
// abilities), with stats scaled up so an enemy squad threatens a hero
// team. Each hunt location fields its own race of enemies.

function enemyFromHero(heroId, statScale) {
  const h = HEROES[heroId];
  return {
    id: h.id, // shared id -> shared sprite sheet cache
    name: h.name,
    rarity: h.rarity,
    element: h.element,
    stats: {
      hp: Math.round(h.stats.hp * statScale),
      atk: Math.round(h.stats.atk * statScale),
      def: Math.round(h.stats.def * statScale),
      speed: h.stats.speed,
    },
    tint: h.tint,
    sprite: h.sprite,
    abilities: h.abilities,
    passive: h.passive,
    positional: h.positional,
  };
}

const ENEMIES = {
  // Rat cohort (the Clearing)
  rat_archer: enemyFromHero('rat_archer', 1.4),
  rat_brawler: enemyFromHero('rat_brawler', 1.4),
  rat_spearman: enemyFromHero('rat_spearman', 1.4),
  rat_assassin: enemyFromHero('rat_assassin', 1.3),
  rat_berserker: enemyFromHero('rat_berserker', 1.3),
  rat_mauler: enemyFromHero('rat_mauler', 1.3),
  rat_duelist: enemyFromHero('rat_duelist', 1.3),
  rat_samurai: enemyFromHero('rat_samurai', 1.25),
  // Avian cohort (the Canyon)
  vulture_reaver: enemyFromHero('vulture_reaver', 1.4),
  kingfisher: enemyFromHero('kingfisher', 1.3),
  rook_swordsman: enemyFromHero('rook_swordsman', 1.3),
  rooster_duelist: enemyFromHero('rooster_duelist', 1.3),
  owl_sentinel: enemyFromHero('owl_sentinel', 1.3),
  eagle_champion: enemyFromHero('eagle_champion', 1.25),
  raven_hexer: enemyFromHero('raven_hexer', 1.25),
  // Minotaur cohort (the Bonefield)
  minotaur_warrior: enemyFromHero('minotaur_warrior', 1.4),
  minotaur_bruiser: enemyFromHero('minotaur_bruiser', 1.4),
  minotaur_guard: enemyFromHero('minotaur_guard', 1.3),
  minotaur_crossbowman: enemyFromHero('minotaur_crossbowman', 1.3),
  minotaur_gladiator: enemyFromHero('minotaur_gladiator', 1.3),
  minotaur_shaman: enemyFromHero('minotaur_shaman', 1.25),
  minotaur_necromancer: enemyFromHero('minotaur_necromancer', 1.25),
};

// Which enemies roam each hunt location, keyed by BATTLE_BGS index.
// Locations without a pool are locked in the hunt picker until a race
// moves in.
const LOCATION_ENEMIES = {
  0: [ // Clearing — the rat cohort
    'rat_archer', 'rat_brawler', 'rat_spearman', 'rat_assassin',
    'rat_berserker', 'rat_mauler', 'rat_duelist', 'rat_samurai',
  ],
  1: [ // Canyon — the avian cohort
    'vulture_reaver', 'kingfisher', 'rook_swordsman', 'rooster_duelist',
    'owl_sentinel', 'eagle_champion', 'raven_hexer',
  ],
  2: [ // Bonefield — the minotaur cohort
    'minotaur_warrior', 'minotaur_bruiser', 'minotaur_guard',
    'minotaur_crossbowman', 'minotaur_gladiator', 'minotaur_shaman',
    'minotaur_necromancer',
  ],
};
