// Standalone effect spritesheets (impact flashes, projectile waves).
// One animation per sheet, frames in a horizontal row unless
// vertical: true (frames stacked top-to-bottom).
//
// Abilities reference these by id via `impact:` (played on each affected
// unit when the ability lands) — damage abilities default to 'strike'.
// The windshear projectile uses 'windshear_wave' as its sprite.

const EFFECTS = {
  // Vertical crescent slash appearing and dissipating — sword hits.
  slash: {
    src: 'assets/slash_effect_spritesheet.png',
    frames: 6, fps: 15, displayH: 110,
  },
  // Ring burst with radiating sparks — generic magic/impact hit.
  strike: {
    src: 'assets/strike_effect_spritesheet.png',
    frames: 5, fps: 15, displayH: 95,
  },
  // Star burst — blunt hits.
  punch: {
    src: 'assets/punch_spritesheet.png',
    frames: 5, fps: 15, displayH: 95,
  },
  // Ground-slam wave arc — big cast moments.
  slam: {
    src: 'assets/slash_slam_spritesheet.png',
    frames: 7, fps: 14, displayH: 85,
  },
  // Horizontal shearing swirl (vertical strip) — projectile wave.
  windshear_wave: {
    src: 'assets/horizonal_slash_effect_spritesheet.png',
    frames: 5, fps: 14, vertical: true, displayH: 64,
  },
};
