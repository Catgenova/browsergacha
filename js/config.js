// Global game configuration and constants.
const CONFIG = {
  CANVAS_W: 960,
  CANVAS_H: 540,

  // Hex formation layout (pointy-top hexes).
  HEX_SIZE: 46,                 // center-to-corner radius of a formation cell
  HEX_SQUASH: 0.55,             // vertical foreshortening: tiles as floor, not walls
  PLAYER_FORMATION_X: 240,      // center of the player-side flower
  ENEMY_FORMATION_X: 720,       // center of the enemy-side flower
  FORMATION_Y: 340,             // sits both grids in the clearing's open grass

  // Battle backdrops (cover-fit behind the grids); each new battle
  // rotates to the next one.
  BATTLE_BGS: [
    'assets/battle_bg_clearing.png',
    'assets/battle_bg_canyon.png',
    'assets/battle_bg_bonefield.png',
    'assets/battle_bg_meadow.png',
    'assets/battle_bg_valley.png',
    'assets/battle_bg_savanna.png',
    'assets/battle_bg_glade.png',
    'assets/battle_bg_snowfield.png',
    'assets/battle_bg_marshland.png',
  ],
  // Player-facing names for the hunt-location picker, same order.
  LOCATION_NAMES: [
    'Clearing', 'Canyon', 'Bonefield', 'Meadow', 'Valley',
    'Savanna', 'Glade', 'Snowfield', 'Marshland',
  ],

  // Turn meter: fills at unit.speed points/sec; unit acts when full.
  TURN_METER_MAX: 1000,
  TICK_SPEED_SCALE: 4,          // global multiplier so battles move at a nice pace

  // Sprite rendering
  SPRITE_SCALE: 3,

  // Bars above each unit
  BAR_W: 56,
  BAR_H: 5,

  // Enemy AI thinking delay (ms) so turns are readable
  AI_DELAY: 550,
};

// Position categories, derived from where a slot sits relative to the enemy.
const POSITION = {
  FRONT: 'front',   // the 3 hexes closest to the enemy side
  CENTER: 'center', // the middle hex of the flower
  BACK: 'back',     // the 3 hexes furthest from the enemy side
};

const TEAM = {
  PLAYER: 'player',
  ENEMY: 'enemy',
};
