// Enemy roster.
//
// The nine procedurally-generated cohorts (rats, avians, minotaurs,
// snakes, wolves, boars, bears, cats and drakes — 378 definitions that
// shared a single idle frame apiece) have been retired. Until purpose-
// built enemies are drawn, the maps field the HERO roster itself: every
// fully-animated hero is a possible opponent, at whatever level the
// node or floor calls for.
//
// Enemies are still their own definitions rather than the hero objects,
// because an enemy statline is scaled up so a squad of them threatens a
// hero team — and because a fight must not be able to mutate the
// definition a player's own copy of that hero reads from.

// The retired cohorts were deliberately weak statlines, so they were
// scaled 1.2-1.4 to make a squad of them threatening. An authored hero
// is already 30-45% richer in HP and DEF than the generated 3-star it
// replaces, so the same multiplier would have made every wave roughly
// half again as tanky overnight. 1.15 keeps an enemy squad above an
// ungeared mirror of itself while landing close to the difficulty the
// old cohorts actually produced.
const ENEMY_STAT_SCALE = 1.15;

function enemyFromHero(heroId, statScale = ENEMY_STAT_SCALE) {
  const h = HEROES[heroId];
  if (!h) return null;
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

// Every hero, mirrored as an enemy. Built once at load, so a wave picks
// out of a plain object exactly as it did when the cohorts existed.
const ENEMIES = (() => {
  const out = {};
  for (const id of Object.keys(HEROES)) {
    const e = enemyFromHero(id);
    if (e) out[id] = e;
  }
  return out;
})();

// Which enemies roam each hunt location, keyed by BATTLE_BGS index.
//
// STOPGAP: with the generated cohorts gone there is no per-location
// race to draw on, so every location fields the same roster and the
// wave composer picks at random within it. The nine keys are kept
// because the hunt picker, the campaign map and the compendium all read
// this to decide which locations exist and are unlocked — narrowing a
// location back down to its own cast is a matter of listing ids here.
//
// The pool is 3-star heroes ONLY. The generated cohorts they replaced
// were 3-star statlines, so fielding the whole roster quietly handed
// every campaign node and hunt wave 4- and 5-star kits: not just bigger
// numbers, but signature mechanics (Aniani's mirrors, Sawyer's hexes,
// Polarus's freeze lock) turned against a player who may still be on
// their starter team. Restricting the pool restores the difficulty the
// cohorts produced until purpose-built enemies are drawn.
//
// ENEMIES still mirrors the FULL roster on purpose — a campaign node
// that wants a specific heavyweight can still pin it with
// `enemies: [...]`, and the dungeon and boss tables are unaffected.
// To widen this back out, drop the rarity filter.
// The band roaming enemies are drawn AT, not a ceiling. It read `<=`
// while 3-star WAS the bottom of the roster, which made the two
// identical -- until the Gulldiggers put a 1-star on the shelf and a
// sect's cheapest body started turning up as a roaming hunt enemy. A
// 1-star wave is as wrong as a 5-star one, in the other direction.
const ENEMY_RARITY = 3;
const LOCATION_ENEMIES = (() => {
  const pool = Object.keys(ENEMIES)
    .filter((id) => ENEMIES[id].rarity === ENEMY_RARITY);
  const out = {};
  for (let loc = 0; loc < CONFIG.BATTLE_BGS.length; loc++) out[loc] = pool;
  return out;
})();
