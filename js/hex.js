// Hex math for the 7-slot "flower" formation: 1 center hex ringed by 6.
// Pointy-top axial coordinates. Slot 0 is the center; slots 1-6 go
// clockwise starting from the hex toward the enemy side.

const Hex = (() => {
  // Axial directions for a pointy-top ring, ordered so that for the PLAYER
  // side (facing right / +x) slot 1 leans toward the enemy.
  const RING_DIRS = [
    { q: 1, r: 0 },   // right
    { q: 1, r: -1 },  // upper-right
    { q: 0, r: -1 },  // upper-left
    { q: -1, r: 0 },  // left
    { q: -1, r: 1 },  // lower-left
    { q: 0, r: 1 },   // lower-right
  ];

  // Axial -> pixel offset from the formation center (pointy-top).
  // The y axis is foreshortened so the grid reads as a floor seen from a
  // low top-down angle, matching the hero sprites.
  function axialToPixel(q, r, size) {
    return {
      x: size * Math.sqrt(3) * (q + r / 2),
      y: size * 1.5 * r * CONFIG.HEX_SQUASH,
    };
  }

  // Build the 7 slots for one side's formation.
  // team: TEAM.PLAYER faces +x, TEAM.ENEMY faces -x (mirrored).
  function buildFormation(team, centerX, centerY, size) {
    const facing = team === TEAM.PLAYER ? 1 : -1;
    const slots = [];

    const cells = [{ q: 0, r: 0 }, ...RING_DIRS];
    cells.forEach((cell, i) => {
      const off = axialToPixel(cell.q, cell.r, size);
      const x = centerX + off.x * facing; // mirror the enemy formation
      const y = centerY + off.y;

      // Position category from horizontal offset toward the enemy.
      // Flower columns: back (3 hexes), center column (1 hex), front (3 hexes).
      let position;
      const dxTowardEnemy = (x - centerX) * facing;
      if (Math.abs(dxTowardEnemy) < 1) position = POSITION.CENTER;
      else if (dxTowardEnemy > 0) position = POSITION.FRONT;
      else position = POSITION.BACK;

      slots.push({
        index: i,
        team,
        q: cell.q,
        r: cell.r,
        x,
        y,
        position,
        unit: null, // occupied by a Unit or null
      });
    });

    return slots;
  }

  // Corner points of a pointy-top hex centered at (x, y), for drawing.
  // Same vertical foreshortening as the layout.
  function corners(x, y, size) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      pts.push({
        x: x + size * Math.cos(angle),
        y: y + size * Math.sin(angle) * CONFIG.HEX_SQUASH,
      });
    }
    return pts;
  }

  return { buildFormation, corners };
})();
