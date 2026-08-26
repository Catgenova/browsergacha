// Status icons: every buff and debuff on the battlefield drawn as a
// real pictograph instead of a text glyph. Each icon is a small plate —
// dark ground, an edge that says at a glance whether the thing is
// helping (green) or hurting (red), and a shape drawn for what the
// status MEANS here: a flame for burning, a slick of waves for oil, a
// tower shield for the Blocker stance.
//
// Icons are vector-drawn onto offscreen canvases on first use and
// cached per (key, variant, size), so the battle renderer just blits.
// Nothing here touches the DOM at load time — the node test harness
// stubs document out, and the cache only fills in a real browser.

const StatusIcons = (() => {
  const PLATE = '#161226';
  const EDGE_GOOD = '#5fae68';
  const EDGE_BAD = '#c2596a';

  // Stat-modifier glyphs get their tint from the variant; everything
  // else carries a color of its own.
  const BUFF_C = '#8ee89a', DEBUFF_C = '#ff8a92';

  // Path helpers, all on a 12x12 design grid scaled to size s.
  const line = (ctx, u, pts) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * u, pts[0][1] * u);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * u, pts[i][1] * u);
    ctx.stroke();
  };
  const poly = (ctx, u, pts) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * u, pts[0][1] * u);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * u, pts[i][1] * u);
    ctx.closePath();
    ctx.fill();
  };
  const ring = (ctx, u, cx, cy, r) => {
    ctx.beginPath();
    ctx.arc(cx * u, cy * u, r * u, 0, Math.PI * 2);
    ctx.stroke();
  };
  const disc = (ctx, u, cx, cy, r) => {
    ctx.beginPath();
    ctx.arc(cx * u, cy * u, r * u, 0, Math.PI * 2);
    ctx.fill();
  };
  const shieldPath = (ctx, u) => {
    ctx.beginPath();
    ctx.moveTo(6 * u, 1.2 * u);
    ctx.lineTo(10.4 * u, 3 * u);
    ctx.lineTo(10.4 * u, 6.4 * u);
    ctx.bezierCurveTo(10.4 * u, 9 * u, 8.6 * u, 10.6 * u, 6 * u, 11.4 * u);
    ctx.bezierCurveTo(3.4 * u, 10.6 * u, 1.6 * u, 9 * u, 1.6 * u, 6.4 * u);
    ctx.lineTo(1.6 * u, 3 * u);
    ctx.closePath();
  };
  const flamePath = (ctx, u) => {
    ctx.beginPath();
    ctx.moveTo(6 * u, 1.2 * u);
    ctx.bezierCurveTo(7.6 * u, 3.6 * u, 9.9 * u, 5.2 * u, 9.9 * u, 7.7 * u);
    ctx.arc(6 * u, 7.7 * u, 3.9 * u, 0, Math.PI, false);
    ctx.bezierCurveTo(2.1 * u, 5.8 * u, 3.6 * u, 4.8 * u, 4.3 * u, 3 * u);
    ctx.bezierCurveTo(4.9 * u, 4.4 * u, 6.4 * u, 4.6 * u, 6 * u, 1.2 * u);
    ctx.closePath();
  };

  // Every status the engine can put on a unit. `good` picks the edge
  // color (and the ▲/▼ corner mark on the stat modifiers); `stat: true`
  // marks the six modifiers whose tint follows the variant.
  const DEFS = {
    // ---- Control --------------------------------------------------------
    stun: { title: 'Stunned', note: 'loses its next turn entirely',
      color: '#8ee8ff', good: false,
      draw(ctx, u, c) {
        ctx.fillStyle = c;
        poly(ctx, u, [[6, 0.8], [7.4, 4.6], [11.2, 6], [7.4, 7.4], [6, 11.2],
          [4.6, 7.4], [0.8, 6], [4.6, 4.6]]);
      } },
    freeze: { title: 'Frozen', note: 'cannot act while the ice holds',
      color: '#9adcff', good: false,
      draw(ctx, u, c) {
        ctx.strokeStyle = c; ctx.lineWidth = 1.3 * u; ctx.lineCap = 'round';
        line(ctx, u, [[6, 1.2], [6, 10.8]]);
        line(ctx, u, [[1.8, 3.6], [10.2, 8.4]]);
        line(ctx, u, [[10.2, 3.6], [1.8, 8.4]]);
        ctx.fillStyle = c; disc(ctx, u, 6, 6, 1.1);
      } },
    soulbond: { title: 'Soul Bound', note: 'takes every point of damage its binder takes',
      color: '#e05a9a', good: false,
      draw(ctx, u, c) {
        // A needle through a knot: the eye, the shaft, and a loop of
        // thread pulled tight around it.
        ctx.strokeStyle = c; ctx.lineWidth = 1.2 * u; ctx.lineCap = 'round';
        line(ctx, u, [[2.2, 9.8], [9.4, 2.6]]);
        ctx.beginPath();
        ctx.arc(9.4, 2.6, 0, 0, 0);
        ctx.closePath();
        ctx.lineWidth = 1 * u;
        ctx.beginPath();
        ctx.arc(4.6 * u, 5.2 * u, 2.2 * u, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = c;
        disc(ctx, u, 9.5, 2.5, 1.2);
        ctx.fillStyle = PLATE;
        disc(ctx, u, 9.5, 2.5, 0.5);
      } },
    buffblock: { title: 'Sealed', note: 'cannot receive any new buff',
      color: '#c79aff', good: false,
      draw(ctx, u, c) {
        // A padlock: shackle over a solid body, keyhole punched out.
        ctx.strokeStyle = c; ctx.lineWidth = 1.3 * u; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(6 * u, 5 * u, 2.5 * u, Math.PI, 0, false);
        ctx.stroke();
        ctx.fillStyle = c;
        poly(ctx, u, [[2.4, 5.2], [9.6, 5.2], [9.6, 10.8], [2.4, 10.8]]);
        ctx.fillStyle = PLATE;
        disc(ctx, u, 6, 7.5, 1);
        poly(ctx, u, [[5.5, 7.5], [6.5, 7.5], [6.3, 9.6], [5.7, 9.6]]);
      } },
    taunted: { title: 'Taunted', note: 'must spend its next turn on skill 1 at the taunter',
      color: '#ff9a5a', good: false,
      draw(ctx, u, c) {
        ctx.strokeStyle = c; ctx.lineWidth = 1.7 * u; ctx.lineCap = 'round';
        line(ctx, u, [[4.1, 1.6], [4.1, 7]]);
        line(ctx, u, [[7.9, 1.6], [7.9, 7]]);
        ctx.fillStyle = c;
        disc(ctx, u, 4.1, 10.2, 1);
        disc(ctx, u, 7.9, 10.2, 1);
      } },
    blocker: { title: 'Blocker', note: 'cannot act; absorbs front-row allies’ hits at 25% less',
      color: '#ffd76a', good: true,
      draw(ctx, u, c) {
        ctx.fillStyle = c;
        poly(ctx, u, [[2.4, 1.6], [9.6, 1.6], [9.6, 8.4], [6, 10.8], [2.4, 8.4]]);
        ctx.strokeStyle = PLATE; ctx.lineWidth = 1.1 * u; ctx.lineCap = 'round';
        line(ctx, u, [[6, 3.2], [6, 8.6]]);
      } },

    // ---- Damage and healing over time -----------------------------------
    burn: { title: 'Burning', note: 'fire eats a share of max HP each turn',
      color: '#ff9a5a', good: false,
      draw(ctx, u, c) {
        ctx.fillStyle = c; flamePath(ctx, u); ctx.fill();
        ctx.fillStyle = '#ffe2a0'; disc(ctx, u, 6, 7.8, 1.7);
      } },
    dot: { title: 'Poisoned', note: 'takes damage at the start of each turn',
      color: '#a8e85a', good: false,
      draw(ctx, u, c) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(6 * u, 1.4 * u);
        ctx.bezierCurveTo(8.2 * u, 4.6 * u, 9.6 * u, 6 * u, 9.6 * u, 7.9 * u);
        ctx.arc(6 * u, 7.9 * u, 3.6 * u, 0, Math.PI, false);
        ctx.bezierCurveTo(2.4 * u, 6 * u, 3.8 * u, 4.6 * u, 6 * u, 1.4 * u);
        ctx.closePath(); ctx.fill();
      } },
    hot: { title: 'Regenerating', note: 'heals at the start of each turn',
      color: '#7ae87a', good: true,
      draw(ctx, u, c) {
        ctx.fillStyle = c;
        poly(ctx, u, [[4.9, 1.8], [7.1, 1.8], [7.1, 4.9], [10.2, 4.9],
          [10.2, 7.1], [7.1, 7.1], [7.1, 10.2], [4.9, 10.2], [4.9, 7.1],
          [1.8, 7.1], [1.8, 4.9], [4.9, 4.9]]);
      } },

    // ---- Marks and stances ----------------------------------------------
    vulnerable: { title: 'Vulnerable', note: 'taking extra damage', color: '#d78aff',
      good: false,
      draw(ctx, u, c) {
        ctx.strokeStyle = c; ctx.lineWidth = 1.5 * u;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        line(ctx, u, [[2.4, 2.4], [6, 5.6], [9.6, 2.4]]);
        line(ctx, u, [[2.4, 6.6], [6, 9.8], [9.6, 6.6]]);
      } },
    ward: { title: 'Warded', note: 'taking reduced damage', color: '#8ecbff',
      good: true,
      draw(ctx, u, c) {
        ctx.strokeStyle = c; ctx.lineWidth = 1.4 * u; ctx.lineJoin = 'round';
        shieldPath(ctx, u); ctx.stroke();
      } },
    methane: { title: 'Methane fog', note: 'ignites — fire attacks hit double',
      color: '#b8e85a', good: false,
      draw(ctx, u, c) {
        ctx.fillStyle = c;
        disc(ctx, u, 3.8, 7.4, 2.2);
        disc(ctx, u, 6.4, 5.6, 2.7);
        disc(ctx, u, 8.8, 7.6, 2);
        ctx.fillRect(3.8 * u, 7.2 * u, 5 * u, 2.4 * u);
      } },
    oilslicked: { title: 'Oilslicked', note: 'burns tick twice as hard on this unit',
      color: '#d8b04a', good: false,
      draw(ctx, u, c) {
        ctx.strokeStyle = c; ctx.lineWidth = 1.3 * u; ctx.lineCap = 'round';
        for (const y of [3.2, 6, 8.8]) {
          ctx.beginPath();
          ctx.moveTo(1.6 * u, y * u);
          ctx.quadraticCurveTo(3.1 * u, (y - 1.9) * u, 4.6 * u, y * u);
          ctx.quadraticCurveTo(6.1 * u, (y + 1.9) * u, 7.6 * u, y * u);
          ctx.quadraticCurveTo(9.1 * u, (y - 1.9) * u, 10.4 * u, y * u);
          ctx.stroke();
        }
      } },
    veil: { title: 'Veiled', note: 'much harder to hit this turn', color: '#8ee8ff',
      good: true,
      draw(ctx, u, c) {
        ctx.strokeStyle = c; ctx.lineWidth = 1.3 * u; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(1.8 * u, 4.6 * u);
        ctx.quadraticCurveTo(6 * u, 8.8 * u, 10.2 * u, 4.6 * u);
        ctx.stroke();
        line(ctx, u, [[3.2, 6.9], [2.4, 8.6]]);
        line(ctx, u, [[6, 7.8], [6, 9.7]]);
        line(ctx, u, [[8.8, 6.9], [9.6, 8.6]]);
      } },
    slag: { title: 'Slag plating', note: 'hardened armour, stacking', color: '#ff9a5a',
      good: true,
      draw(ctx, u, c) {
        ctx.fillStyle = c;
        ctx.fillRect(2 * u, 7.6 * u, 8 * u, 2.6 * u);
        ctx.fillRect(3.1 * u, 4.7 * u, 5.8 * u, 2.2 * u);
        ctx.fillRect(4.2 * u, 2 * u, 3.6 * u, 2 * u);
      } },
    crystalline: { title: 'Crystalline', note: 'strike it and risk freezing on contact',
      color: '#8ee8ff', good: true,
      draw(ctx, u, c) {
        ctx.strokeStyle = c; ctx.lineWidth = 1.2 * u; ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(6 * u, 1.4 * u); ctx.lineTo(10.6 * u, 6 * u);
        ctx.lineTo(6 * u, 10.6 * u); ctx.lineTo(1.4 * u, 6 * u);
        ctx.closePath(); ctx.stroke();
        ctx.lineWidth = 0.9 * u;
        line(ctx, u, [[6, 1.4], [6, 10.6]]);
        line(ctx, u, [[1.4, 6], [10.6, 6]]);
      } },
    aiming: { title: 'Aiming Stance', note: 'the next shot strikes double',
      color: '#ffe8a8', good: true,
      draw(ctx, u, c) {
        ctx.strokeStyle = c; ctx.lineWidth = 1.2 * u; ctx.lineCap = 'round';
        ring(ctx, u, 6, 6, 3.3);
        line(ctx, u, [[6, 0.9], [6, 3.1]]);
        line(ctx, u, [[6, 8.9], [6, 11.1]]);
        line(ctx, u, [[0.9, 6], [3.1, 6]]);
        line(ctx, u, [[8.9, 6], [11.1, 6]]);
        ctx.fillStyle = c; disc(ctx, u, 6, 6, 1);
      } },
    taunt: { title: 'Taunting', note: 'enemies must attack this hero', color: '#ffd76a',
      good: true,
      draw(ctx, u, c) {
        ctx.strokeStyle = c; ctx.lineWidth = 1.3 * u; ctx.lineCap = 'round';
        line(ctx, u, [[3.4, 1.6], [3.4, 10.6]]);
        ctx.fillStyle = c;
        poly(ctx, u, [[3.4, 2], [10.4, 3.9], [3.4, 5.8]]);
      } },
    bubble: { title: 'Bubbled', note: 'the next hit pops the bubble harmlessly',
      color: '#5ec2f0', good: true,
      draw(ctx, u, c) {
        ctx.strokeStyle = c; ctx.lineWidth = 1.3 * u;
        ring(ctx, u, 6, 6, 4);
        ctx.lineWidth = 1 * u;
        ctx.beginPath();
        ctx.arc(6 * u, 6 * u, 2.4 * u, Math.PI * 1.05, Math.PI * 1.55);
        ctx.stroke();
      } },
    shield: { title: 'Shielded', note: 'absorbs damage before HP; the number is what is left',
      color: '#7ae8d8', good: true,
      draw(ctx, u, c) {
        ctx.fillStyle = c; shieldPath(ctx, u); ctx.fill();
        ctx.strokeStyle = PLATE; ctx.lineWidth = 1 * u; ctx.lineCap = 'round';
        line(ctx, u, [[4.2, 5], [5.6, 7.4]]);
        line(ctx, u, [[5.6, 7.4], [8.2, 3.8]]);
      } },
    mirrors: { title: 'Crystal mirrors', note: 'charges remaining', color: '#8ee8ff',
      good: true,
      draw(ctx, u, c) {
        ctx.fillStyle = c;
        poly(ctx, u, [[6, 1.4], [10.6, 6], [6, 10.6], [1.4, 6]]);
        ctx.fillStyle = '#e4f8ff';
        poly(ctx, u, [[6, 3.4], [8.6, 6], [6, 8.6], [3.4, 6]]);
      } },

    // ---- The six stat modifiers (tint follows buff/debuff) ---------------
    atk: { title: 'ATK', stat: true,
      draw(ctx, u, c) {
        ctx.strokeStyle = c; ctx.lineWidth = 1.5 * u; ctx.lineCap = 'round';
        line(ctx, u, [[3, 9], [9.6, 2.4]]);
        line(ctx, u, [[4.6, 4.9], [7.1, 7.4]]);
        ctx.lineWidth = 1.2 * u;
        line(ctx, u, [[2.2, 8.2], [3.8, 9.8]]);
        ctx.fillStyle = c; disc(ctx, u, 2, 10, 0.9);
      } },
    def: { title: 'DEF', stat: true,
      draw(ctx, u, c) {
        ctx.fillStyle = c; shieldPath(ctx, u); ctx.fill();
      } },
    speed: { title: 'SPD', stat: true,
      draw(ctx, u, c) {
        ctx.strokeStyle = c; ctx.lineWidth = 1.5 * u;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        line(ctx, u, [[2.2, 2.6], [5.8, 6], [2.2, 9.4]]);
        line(ctx, u, [[6.4, 2.6], [10, 6], [6.4, 9.4]]);
      } },
    accuracy: { title: 'ACC', stat: true,
      draw(ctx, u, c) {
        ctx.strokeStyle = c; ctx.lineWidth = 1.3 * u;
        ring(ctx, u, 6, 6, 3.6);
        ctx.fillStyle = c; disc(ctx, u, 6, 6, 1.4);
      } },
    critChance: { title: 'CRIT', stat: true,
      draw(ctx, u, c) {
        ctx.strokeStyle = c; ctx.lineWidth = 1.4 * u; ctx.lineCap = 'round';
        line(ctx, u, [[6, 1.4], [6, 10.6]]);
        line(ctx, u, [[2, 3.7], [10, 8.3]]);
        line(ctx, u, [[10, 3.7], [2, 8.3]]);
      } },
    critDamage: { title: 'CRIT DMG', stat: true,
      draw(ctx, u, c) {
        ctx.fillStyle = c;
        poly(ctx, u, [[2, 2], [5, 4.6], [6, 1], [7, 4.6], [10, 2], [7.9, 5.4],
          [11, 6], [7.9, 6.6], [10, 10], [7, 7.4], [6, 11], [5, 7.4], [2, 10],
          [4.1, 6.6], [1, 6], [4.1, 5.4]]);
      } },
  };

  // The battle-legend order: control first, then damage over time, then
  // the marks, then the stat modifiers and resources.
  const LEGEND = ['stun', 'freeze', 'buffblock', 'soulbond', 'taunted', 'blocker', 'burn', 'dot', 'hot',
    'vulnerable', 'ward', 'methane', 'oilslicked', 'veil', 'slag',
    'crystalline', 'aiming', 'taunt', 'bubble', 'shield', 'mirrors',
    'atk', 'def', 'speed', 'accuracy', 'critChance', 'critDamage'];

  const cache = new Map();

  // The finished plate as an offscreen canvas: `variant` is 'buff' or
  // 'debuff' for the stat modifiers and ignored elsewhere.
  function canvas(key, variant, size) {
    const def = DEFS[key];
    if (!def) return null;
    const id = `${key}|${def.stat ? variant : ''}|${size}`;
    const hit = cache.get(id);
    if (hit) return hit;
    const cv = document.createElement('canvas');
    cv.width = size; cv.height = size;
    const ctx = cv.getContext('2d');
    if (!ctx) return null;
    const buff = def.stat ? variant === 'buff' : def.good;
    // Plate and edge.
    ctx.fillStyle = buff ? EDGE_GOOD : EDGE_BAD;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = PLATE;
    ctx.fillRect(1, 1, size - 2, size - 2);
    // Glyph, inset one plate pixel on each side.
    const inset = 1.5;
    const u = (size - inset * 2) / 12;
    ctx.save();
    ctx.translate(inset, inset);
    def.draw(ctx, u, def.stat ? (variant === 'buff' ? BUFF_C : DEBUFF_C) : def.color);
    ctx.restore();
    // The stat modifiers carry a corner mark: raised or lowered.
    if (def.stat) {
      const a = Math.max(3, size * 0.34);
      ctx.fillStyle = variant === 'buff' ? EDGE_GOOD : EDGE_BAD;
      ctx.beginPath();
      if (variant === 'buff') {
        ctx.moveTo(size - a, 0); ctx.lineTo(size, 0); ctx.lineTo(size, a);
      } else {
        ctx.moveTo(size, size - a); ctx.lineTo(size, size); ctx.lineTo(size - a, size);
      }
      ctx.closePath(); ctx.fill();
    }
    cache.set(id, cv);
    return cv;
  }

  function dataURL(key, variant, size) {
    const cv = canvas(key, variant, size);
    return cv ? cv.toDataURL() : '';
  }

  return { DEFS, LEGEND, canvas, dataURL };
})();
