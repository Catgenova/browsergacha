// Global game configuration and constants.
const CONFIG = {
  CANVAS_W: 960,
  CANVAS_H: 540,

  // Hex formation layout (pointy-top hexes).
  HEX_SIZE: 46,                 // center-to-corner radius of a formation cell
  PLAYER_FORMATION_X: 240,      // center of the player-side flower
  ENEMY_FORMATION_X: 720,       // center of the enemy-side flower
  FORMATION_Y: 290,

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
