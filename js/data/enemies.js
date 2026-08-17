// Enemy roster: rat cohort units derived from their hero definitions
// (same art and abilities), with stats scaled up so a squad of 1★ rats
// threatens a 4★ hero team. More rats join as their sheets land.

function ratEnemy(heroId, statScale) {
  const h = HEROES[heroId];
  return {
    id: h.id, // shared id -> shared sprite sheet cache
    name: h.name,
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
  rat_archer: ratEnemy('rat_archer', 1.4),
  rat_brawler: ratEnemy('rat_brawler', 1.4),
  rat_assassin: ratEnemy('rat_assassin', 1.3),
  rat_spearman: ratEnemy('rat_spearman', 1.4),
  rat_berserker: ratEnemy('rat_berserker', 1.3),
  rat_mauler: ratEnemy('rat_mauler', 1.3),
  rat_duelist: ratEnemy('rat_duelist', 1.3),
};
