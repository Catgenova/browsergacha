// The Endless Tower's difficulty curve.
//
// This lived inline in battle_screen.js as two lines -- a level of
// `ceil(floor * 1.5)` and nothing else -- and those two lines had a
// problem that only shows up a couple of hundred floors in: the tower
// stops getting harder.
//
// Enemy stats come from Progression.statMult, which is LINEAR in level:
// +5% of base per level. Chain that to a level that is linear in the
// floor and a floor's enemy power is linear in the floor number too --
// about 0.075x base per floor. Linear growth has a decaying RATE, and
// that is the whole of the bug:
//
//   floor  10 -> floor  11    +4.3% enemy power
//   floor 100 -> floor 101    +0.9%
//   floor 222 -> floor 223    +0.4%
//   floor 800 -> floor 801    +0.1%
//
// A player's power does not grow that way. It grows in multiplicative
// chunks -- a star up is x1.25, an attunement is +10%, a full gear
// swap measured 5x on the bench, level 1 to 100 is 5.95x -- so every
// upgrade buys more floors than the last, and the climb runs away.
// Measured against a fully maxed party (Lv100, 10 stars, attunement
// 10, best-in-slot legendaries) the tower was clearing floor 400 in
// 630 ticks and still winning a third of its runs at floor 800.
//
// Worse, the way it eventually failed was not a defeat. Enemy OFFENCE
// is on the same flat line as enemy HP, so a geared party at floor
// 1600 could not kill the wave and the wave could not kill them: 0%
// wins and 0% losses, a fight that simply never ends.
//
// So the tower grows GEOMETRICALLY instead, at a fixed +1% per floor.
// A fixed percentage is what "endless" has to mean: floor N+1 is the
// same step above floor N forever, and no amount of banked power
// flattens the climb, because the climb is a percentage too.
//
// It is grafted on above floor 100 rather than from the bottom. Floors
// 1-100 are where a new account meets the tower, they are tuned
// against the campaign, and the two curves cross near floor 200 --
// which means nobody's existing best floor gets taken away. Above
// that the difference compounds fast:
//
//   floor   before    after
//    100      8.5x     8.5x     (anchor -- unchanged)
//    200     16.0x    22.8x
//    300     23.5x    61.8x
//    400     31.0x     167x
//    600     45.9x    1226x
//
// Enemy LEVEL still climbs 1.5 per floor and is still what the
// nameplate and the XP payout read. The geometric part rides on
// `statScale`, the per-deployment stat multiplier the campaign already
// uses to hold its chapter bosses to a curve of their own -- so this
// needs no new plumbing in Unit, and it lands on the boss floors (which
// interpolate their own stats) exactly as it lands on the wave floors.
//
// It rides on HP and ATK ONLY, and that is the second half of the fix.
// Damage is multiplied by 300 / (def + 300), a curve that saturates:
// every point of DEF is worth less than the last, and past a few
// thousand it approaches total immunity. Compounding DEF at 1% a floor
// walks straight into that asymptote -- at floor 600 an enemy would be
// turning away 99.8% of every hit -- and the result is not a hard
// fight, it is the SAME unfinishable fight the linear curve produced,
// arrived at from the other direction. HP and ATK are linear in what
// they do, so they are the knobs that can be turned honestly. DEF is
// left on the level curve, where it still climbs, just not into
// invulnerability.
//
// What that buys is a tower that KILLS you. Enemy offence compounding
// against a defence that does not means a floor past a party's ceiling
// ends in a wipe and a retreat, rather than a fight that runs until
// the player closes the tab.

const Tower = (() => {
  // Enemy level per floor. Unchanged: this is the number on the
  // nameplate and the input to the XP payout.
  const LEVEL_PER_FLOOR = 1.5;
  // Where the geometric curve is grafted on. At and below this the
  // tower is exactly what it always was.
  const ANCHOR = 100;
  // Per-floor power growth above the anchor. 1% compounding puts a
  // fully maxed party's wall near floor 300 and keeps every floor
  // after it a real step, instead of the sub-1% dribble the linear
  // curve decays into.
  const RATE = 1.01;
  // The deadline. A floor deep enough that a party cannot kill it, but
  // shallow enough that the party's own DEF still turns the wave's
  // damage away, is a fight neither side finishes -- the same DEF
  // asymptote as above, seen from the player's side this time, and it
  // cannot be tuned out of existence because the tower is endless and
  // player power is not. So the tower gets a clock, and running it out
  // is a defeat. Without one, an auto-climb that reaches such a floor
  // never stops.
  //
  // 800 turns is deliberately generous. Benched clears at the very edge
  // of a party's ceiling ran to 674 turns (a mid-game account grinding
  // out floor 250), and a deadline that steals a fight the player was
  // going to win is worse than no deadline at all.
  const TURN_LIMIT = 800;

  // A geometric curve overflows a double eventually, and long before
  // that it overflows the integer precision Math.round depends on:
  // enemy HP is rounded, and past ~9e15 a rounded float stops being
  // the number it prints. Base HP is ~2,000, so a multiplier ceiling
  // of 1e12 keeps every stat inside safe-integer range. It is reached
  // at about floor 2,900 -- roughly ten times past where a maxed party
  // stops winning -- so in practice this is a guard rail and not a
  // game rule. Past it the tower stops getting harder, which is a
  // better failure than NaN enemies.
  const MAX_POWER = 1e12;

  function level(floor) {
    return Math.max(2, Math.ceil(floor * LEVEL_PER_FLOOR));
  }

  // What Progression.statMult already gives an enemy at this floor's
  // level, star factor excluded (that varies per enemy and cancels).
  function levelPower(floor) {
    return 1 + 0.05 * (level(floor) - 1);
  }

  // The total stat multiplier a floor is MEANT to have.
  function power(floor) {
    if (floor <= ANCHOR) return levelPower(floor);
    return Math.min(MAX_POWER, levelPower(ANCHOR) * Math.pow(RATE, floor - ANCHOR));
  }

  // The correction to hand Unit as `progress.statScale`: whatever the
  // level curve does not already supply, as a bare number.
  function correction(floor) {
    return power(floor) / levelPower(floor);
  }

  // The same correction shaped for Unit, on HP and ATK only. DEF keeps
  // whatever the level curve gives it -- see the header. Below the
  // anchor this is all 1s and the early tower is untouched.
  function statScale(floor) {
    const k = correction(floor);
    return { hp: k, atk: k, def: 1 };
  }

  // What to add to a floor's intro line. Above the anchor the enemies
  // are no longer just "high level" -- the floor is carrying a stat
  // multiplier the level does not show -- and a player reading Lv 334
  // on a wave that hits far harder than Lv 334 deserves to be told why.
  // Below the anchor there is nothing extra to say, so nothing is said.
  function floorNote(floor) {
    const k = correction(floor);
    if (k < 1.05) return '';
    const shown = k >= 100 ? Math.round(k) : k.toFixed(1);
    return `, x${shown} floor strain`;
  }

  // Every tenth floor a boss bars the way.
  function isBossFloor(floor) {
    return floor % 10 === 0;
  }

  // Which boss, given the ordered list of ids. Cycles.
  function bossIndex(floor, count) {
    return count > 0 ? (Math.floor(floor / 10) - 1) % count : 0;
  }

  // Everything a caller needs to build the floor, in one object, so
  // the battle screen and test/tower.js cannot drift apart.
  function floorSpec(floor) {
    return {
      floor,
      level: level(floor),
      statScale: statScale(floor),
      power: power(floor),
      correction: correction(floor),
      isBossFloor: isBossFloor(floor),
      turnLimit: TURN_LIMIT,
    };
  }

  return { level, power, correction, statScale, floorNote, isBossFloor, bossIndex, floorSpec,
    ANCHOR, RATE, LEVEL_PER_FLOOR, MAX_POWER, TURN_LIMIT };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = { Tower };
