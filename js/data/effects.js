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
    frames: 5, fps: 14, vertical: true, displayH: 104,
  },
  // Dust cloud kicked up on a jump (frame-per-file sequence).
  jump_cloud: {
    seq: { pattern: 'assets/take_off_##.png', count: 7 },
    fps: 16, displayH: 46,
  },
  // Skid clouds splitting to both sides on landing.
  land_cloud: {
    seq: { pattern: 'assets/land_##.png', count: 8 },
    fps: 16, displayH: 48,
  },
  // Nature-green healing glow (charge effect recolored) — Vivian's spells.
  heal_green: {
    src: 'assets/charge effect_spritesheets.png',
    grid: { cols: 5, rows: 2 }, fps: 16, displayH: 96, hue: -60,
  },
  // Green impact burst for Vivian's briar attack.
  strike_green: {
    src: 'assets/strike_effect_spritesheet.png',
    frames: 5, fps: 15, displayH: 95, hue: -60,
  },
  // Purple hex burst for Vex's curses.
  strike_purple: {
    src: 'assets/strike_effect_spritesheet.png',
    frames: 5, fps: 15, displayH: 95, hue: 100,
  },
  // Javarious's shield: a soap bubble painted gold. Frame 0 is the intact
  // bubble, held over whoever is shielded; frames 1-5 are the burst,
  // played when the shield is broken by a hit (see Unit.absorb).
  shield_bubble: {
    src: 'assets/bubble_pop_one_spritesheet_512px_by_512px_per_frame.png',
    grid: { cols: 3, rows: 2 }, frames: 6, fps: 14, displayH: 130,
    tint: '#ffd76a',
  },
  // Golden holy glow for Emily's blessings.
  heal_gold: {
    src: 'assets/charge effect_spritesheets.png',
    grid: { cols: 5, rows: 2 }, fps: 16, displayH: 96, hue: -130,
  },
};
