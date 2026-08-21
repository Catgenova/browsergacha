// Procedural placeholder characters.
//
// Most of the roster ships without hand-made art. Rather than give every
// one of them the same knight blob in a different colour, build a small
// pixel character out of what the definition already tells us:
//
//   race     -> silhouette: head shape, ears/horns, tail, build, and for
//               snakes a coil instead of legs
//   kit      -> what they're holding: staff for healers, bow for the
//               ranged cohort, shield for anyone who reduces damage taken
//   element  -> accent colour on crest, orb, cape and shield boss
//   rarity   -> a cape at 4*, a helm gem at 5*
//   id hash  -> the coin flips inside each of those (which sword, which
//               ear set, one pixel of height), so two rat warriors in the
//               same colours still read as different rats
//
// Output is a char grid painted through a palette, so the outline pass
// runs once per frame over the composed figure and props that move
// (the weapon arm thrusts on attack) keep their outline.

const PlaceholderArt = (() => {
  const W = 22;          // grid width in art pixels
  const H = 25;          // grid height
  const CX = 7;          // body centre column (leaves room for a weapon)
  const HIP = 18;        // first leg row; the idle bob moves rows above it
  const HAND = { x: 15, y: 15 }; // weapon hand, props are drawn around it
  // The figure and the weapon are kept three columns apart (head reaches
  // x12, weapons start at x16) so their outlines never touch and fuse
  // into one dark bar.

  // ---- palette ----------------------------------------------------------

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16)];
  }

  function mix(hex, target, f) {
    const [r, g, b] = hexToRgb(hex);
    const [tr, tg, tb] = target;
    const c = (a, t) => Math.round(a + (t - a) * f);
    return `rgb(${c(r, tr)},${c(g, tg)},${c(b, tb)})`;
  }

  const darker = (hex, f) => mix(hex, [12, 10, 18], f);
  const lighter = (hex, f) => mix(hex, [255, 250, 240], f);

  function paletteFor(tint, element) {
    const body = tint.body || '#4a6fd4';
    const skin = tint.skin || '#e8b88a';
    const helm = tint.helm || '#8d9bb8';
    const accent = (ELEMENTS[element] && ELEMENTS[element].color) || '#d8d8e0';
    return {
      B: body,
      b: darker(body, 0.28),
      D: darker(body, 0.5),
      H: helm,
      h: darker(helm, 0.3),
      S: skin,
      s: darker(skin, 0.25),
      W: tint.weapon || '#d8d8e0',
      X: tint.shield || helm,
      E: accent,
      e: darker(accent, 0.35),
      Y: lighter(tint.weapon || '#d8d8e0', 0.45), // horn / beak / bone
      K: '#15121c',                               // eye
      O: darker(body, 0.82),                      // outline
    };
  }

  // ---- grid helpers -----------------------------------------------------

  function layer() {
    const cells = new Array(W * H).fill('');
    const px = (x, y, ch) => {
      if (!ch || x < 0 || y < 0 || x >= W || y >= H) return;
      cells[y * W + x] = ch;
    };
    const rect = (x, y, w, h, ch) => {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, ch);
    };
    // Points along a rough line, for tails and horns.
    const trail = (pts, ch) => pts.forEach(([x, y]) => px(x, y, ch));
    return { cells, px, rect, trail };
  }

  // ---- deterministic per-hero variation ---------------------------------

  function hashOf(id) {
    let h = 2166136261;
    for (let i = 0; i < id.length; i++) {
      h ^= id.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // A tiny stream of stable "coin flips" per hero.
  function roller(id) {
    let h = hashOf(id);
    return {
      pick(list) {
        h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
        return list[h % list.length];
      },
      chance(p) {
        h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0;
        return (h % 1000) / 1000 < p;
      },
    };
  }

  // ---- race silhouettes -------------------------------------------------

  const RACE_LOOK = {
    rat:      { build: 'slim',  head: 'snout',  ears: 'round',   tail: 'rope' },
    avian:    { build: 'slim',  head: 'beak',   ears: 'crest',   tail: 'fan' },
    minotaur: { build: 'broad', head: 'muzzle', ears: 'horns',   tail: 'tuft' },
    snake:    { build: 'slim',  head: 'hood',   ears: 'none',    tail: 'coil' },
    wolf:     { build: 'med',   head: 'muzzle', ears: 'pointed', tail: 'brush' },
    boar:     { build: 'broad', head: 'snout',  ears: 'flop',    tail: 'curl' },
    bear:     { build: 'broad', head: 'muzzle', ears: 'round',   tail: 'stub' },
    cat:      { build: 'slim',  head: 'muzzle', ears: 'pointed', tail: 'whip' },
    drake:    { build: 'med',   head: 'snout',  ears: 'swept',   tail: 'spade',
                wing: true },
    human:    { build: 'med',   head: 'plain',  ears: 'none',    tail: 'none' },
  };

  const BUILD = { slim: 6, med: 7, broad: 9 };

  // ---- what the hero is holding -----------------------------------------

  const HEAL = new Set(['heal', 'hot', 'healHpPct', 'revive']);
  const HURT = new Set(['damage', 'damageDef', 'damageHpPct', 'dot']);
  const RANGED_NAME = /archer|slinger|sniper|gunner|marksman|hunter|bowman|arbalest|fletcher/;
  const CASTER_NAME = /mage|shaman|priest|witch|seer|oracle|sage|warlock|conjur|arcan|cleric|druid|monk|mystic|augur|diviner|channel/;

  function propFor(def, rng) {
    const effects = [];
    for (const ab of def.abilities || []) {
      for (const fx of ab.effects || []) effects.push({ ...fx, targeting: ab.targeting });
    }
    const heals = effects.some((f) => HEAL.has(f.type));
    const hurts = effects.some((f) => HURT.has(f.type));
    const guards = effects.some((f) =>
      f.type === 'buff' && (f.stat === 'damageTaken' || f.stat === 'def'));
    const ranged = RANGED_NAME.test(def.id) ||
      effects.filter((f) => HURT.has(f.type) &&
        (f.targeting === 'all-enemies' || f.targeting === 'back-enemies')).length >= 2;

    if (heals || !hurts || CASTER_NAME.test(def.id)) {
      return { weapon: 'staff', shield: false };
    }
    if (ranged) return { weapon: 'bow', shield: false };
    if (guards) return { weapon: rng.pick(['sword', 'hammer']), shield: true };
    return { weapon: rng.pick(['sword', 'axe', 'spear', 'hammer', 'dagger']),
      shield: rng.chance(0.2) };
  }

  // ---- drawing ----------------------------------------------------------

  function drawHead(L, look, rng, headTop) {
    const { px, rect, trail } = L;
    const y = headTop; // skull occupies y+1 .. y+6, x4..10

    if (look.head === 'hood') {
      // Cobra hood spread behind the head, drawn first so the head sits on it.
      rect(4, y, 8, 1, 'b');
      rect(3, y + 1, 10, 1, 'B');
      rect(2, y + 2, 12, 2, 'B');
      rect(3, y + 4, 10, 1, 'B');
      rect(4, y + 5, 8, 1, 'b');
      px(2, y + 2, 'b');
      px(13, y + 2, 'b');
      px(2, y + 3, 'b');
      px(13, y + 3, 'b');
      rect(5, y + 1, 6, 5, 'S');
      rect(10, y + 3, 3, 2, 'S');
      px(12, y + 3, 'K');
      px(11, y + 5, 'e'); // flicked tongue
      px(9, y + 2, 'K');
      return;
    }

    rect(4, y + 1, 7, 6, 'S');
    px(10, y + 1, 's');
    px(10, y + 6, 's');

    if (look.head === 'muzzle') {
      rect(10, y + 3, 3, 3, 'S');
      px(12, y + 3, 'K');
      px(11, y + 5, 's');
    } else if (look.head === 'snout') {
      rect(10, y + 4, 3, 2, 'S');
      px(12, y + 4, 'K');
    } else if (look.head === 'beak') {
      rect(10, y + 3, 2, 1, 'Y');
      rect(10, y + 4, 3, 1, 'Y');
      rect(10, y + 5, 2, 1, 'Y');
    }

    // Eye, set back from the muzzle.
    px(look.head === 'plain' ? 9 : 8, y + 3, 'K');

    // Head covering: a cap, a full helm, or bare fur.
    const cover = rng.pick(['cap', 'helm', 'bare', 'cap']);
    if (cover === 'cap') {
      rect(4, y, 7, 1, 'H');
      rect(3, y + 1, 1, 2, 'H');
    } else if (cover === 'helm') {
      rect(4, y, 7, 2, 'H');
      rect(3, y, 1, 4, 'h');
      px(10, y + 2, 'h');
    } else {
      rect(4, y, 7, 1, 'b');
      trail([[3, y + 1], [3, y + 2]], 'b');
    }
  }

  function drawEars(L, look, headTop) {
    const { px, rect, trail } = L;
    const y = headTop;
    switch (look.ears) {
      case 'round':
        rect(3, y - 2, 3, 2, 'S');
        rect(8, y - 2, 3, 2, 'S');
        px(4, y - 1, 's');
        px(9, y - 1, 's');
        break;
      case 'pointed':
        trail([[4, y - 3], [4, y - 2], [5, y - 2], [4, y - 1], [5, y - 1], [6, y - 1]], 'S');
        trail([[10, y - 3], [9, y - 2], [10, y - 2], [8, y - 1], [9, y - 1], [10, y - 1]], 'S');
        break;
      case 'horns': // curl out and up from the temples
        trail([[3, y], [2, y - 1], [1, y - 1], [1, y - 2], [2, y - 3]], 'Y');
        trail([[11, y], [12, y - 1], [13, y - 1], [13, y - 2], [12, y - 3]], 'Y');
        break;
      case 'swept': // drake: both horns sweep back over the shoulders
        trail([[5, y - 1], [4, y - 2], [3, y - 2], [2, y - 3]], 'Y');
        trail([[8, y - 1], [7, y - 2], [6, y - 3], [5, y - 3]], 'Y');
        break;
      case 'crest':
        trail([[6, y - 2], [7, y - 3], [8, y - 2], [7, y - 1]], 'E');
        break;
      case 'flop':
        trail([[3, y + 1], [2, y + 2], [2, y + 3], [3, y + 4]], 'S');
        trail([[11, y + 1], [12, y + 2], [12, y + 3], [11, y + 4]], 'S');
        px(13, y + 5, 'Y'); // tusks out of the snout
        px(11, y + 6, 'Y');
        break;
      default:
        break;
    }
  }

  function drawTail(L, look) {
    const { trail } = L;
    switch (look.tail) {
      case 'rope':
        trail([[2, 16], [1, 17], [0, 18], [0, 19], [1, 20]], 's');
        break;
      case 'brush':
        trail([[2, 15], [1, 15], [0, 16], [0, 17], [1, 16], [1, 17],
          [0, 18], [1, 18], [1, 19]], 'b');
        break;
      case 'whip':
        trail([[2, 16], [1, 15], [0, 14], [0, 13], [1, 12]], 'B');
        break;
      case 'fan':
        trail([[2, 15], [1, 16], [0, 17], [1, 17], [0, 18], [1, 18], [2, 18]], 'b');
        break;
      case 'curl':
        trail([[2, 15], [1, 15], [1, 14], [2, 14]], 's');
        break;
      case 'stub':
        trail([[2, 16], [2, 17]], 'b');
        break;
      case 'tuft':
        trail([[2, 15], [1, 16], [1, 17], [0, 18]], 'b');
        break;
      case 'spade':
        trail([[2, 15], [1, 16], [0, 17], [0, 18], [1, 18], [0, 19]], 'b');
        break;
      default:
        break;
    }
  }

  function drawBody(L, def, look, prop, rng) {
    const { px, rect } = L;
    const w = BUILD[look.build];
    const x0 = CX - Math.floor(w / 2);
    const x1 = x0 + w - 1;

    drawTail(L, look);

    if (look.wing) { // folded wing behind the shoulder
      rect(0, 10, 3, 2, 'b');
      rect(0, 12, 3, 2, 'b');
      rect(1, 14, 2, 2, 'D');
    }

    if (def.rarity >= 4) { // cape
      rect(x0 - 1, 10, 1, 8, 'E');
      rect(x0 - 2, 12, 1, 5, 'e');
    }

    // Torso, waisted by a row, with the far side in shadow.
    for (let y = 11; y <= 17; y++) {
      const inset = y >= 15 ? 1 : 0;
      rect(x0 + inset, y, w - inset * 2, 1, 'B');
      px(x1 - inset, y, 'b');
    }
    rect(x0, 16, w, 1, 'H'); // belt
    px(CX, 16, 'E');         // buckle, in the hero's element
    if (def.rarity >= 3) px(CX, 12, 'E'); // crest on the chest

    // Off arm, and a shield on it when the kit protects.
    rect(x1, 12, 3, 2, 'B'); // weapon-side shoulder: wide enough that
    // the prop arm still touches it when the lunge moves it a pixel.
    rect(x0 - 1, 12, 1, 3, 'B');
    px(x0 - 1, 15, 'S');
    if (prop.shield) {
      rect(x0 - 3, 11, 3, 5, 'X');
      px(x0 - 2, 13, 'E');
      px(x0 - 3, 11, 'h');
    }

    // Legs, or a stacked coil for the snakes.
    if (look.tail === 'coil') {
      rect(4, 18, 7, 1, 'B');
      rect(3, 19, 9, 1, 'b');
      rect(2, 20, 11, 1, 'B');
      rect(2, 21, 12, 1, 'b');
      rect(1, 22, 12, 1, 'B');
      px(4, 20, 'D');
      px(8, 20, 'D');
      px(6, 22, 'D');
      px(10, 22, 'D');
    } else {
      const legW = look.build === 'broad' ? 3 : 2;
      const lx = x0 + 1;
      const rx = x1 - legW;
      rect(lx, 18, legW, 4, 'D');
      rect(rx, 18, legW, 4, 'D');
      rect(lx, 22, legW + 1, 1, 'h');
      rect(rx, 22, legW + 1, 1, 'h');
    }

    const headTop = 3 + (rng.chance(0.4) ? 1 : 0); // a pixel of height variance
    rect(CX - 1, headTop + 7, 3, 11 - (headTop + 7), 'S'); // neck
    drawEars(L, look, headTop);
    drawHead(L, look, rng, headTop);
    if (def.rarity >= 5) px(CX, headTop, 'E'); // helm gem
  }

  // Weapons hang off x16 so they never crowd the face, and every grip
  // touches the hand orthogonally -- a diagonal touch reads as a floating
  // weapon once the outline pass runs between them.
  function drawProp(L, prop) {
    const { px, rect, trail } = L;

    if (prop.weapon === 'bow') {
      // Archers hold the bow up at chest height rather than down at the hip.
      trail([[11, 12], [12, 12], [13, 12], [14, 12]], 'B');
      rect(14, 11, 2, 2, 'S');
      // String down the inside, limbs bowing out: the aperture between
      // them has to close at both tips or the outline floods it.
      trail([[16, 7], [16, 8], [16, 9], [16, 10], [16, 11], [16, 12], [16, 13],
        [16, 14], [16, 15]], 'h');
      trail([[17, 6], [18, 7], [18, 8], [18, 9], [18, 10], [18, 11], [18, 12],
        [18, 13], [18, 14], [17, 15], [19, 10], [19, 11]], 'W');
      return;
    }

    trail([[11, 12], [12, 12], [12, 13], [13, 14], [14, 15]], 'B');
    rect(14, 15, 2, 2, 'S');

    switch (prop.weapon) {
      case 'sword':
        rect(16, 6, 2, 8, 'W');
        px(16, 5, 'W');
        rect(15, 14, 3, 1, 'H');
        rect(16, 15, 1, 2, 'D');
        break;
      case 'axe':
        rect(16, 8, 1, 8, 'D');
        rect(17, 9, 2, 1, 'W');
        rect(17, 10, 2, 2, 'W');
        rect(17, 12, 1, 1, 'W');
        px(18, 11, 'h');
        break;
      case 'spear':
        rect(16, 5, 1, 11, 'D');
        rect(16, 3, 1, 2, 'W');
        px(17, 5, 'W');
        break;
      case 'hammer':
        rect(16, 9, 1, 7, 'D');
        rect(16, 6, 3, 3, 'W');
        px(16, 6, 'h');
        px(18, 8, 'h');
        break;
      case 'dagger':
        rect(16, 11, 1, 3, 'W');
        rect(15, 14, 3, 1, 'H');
        px(16, 15, 'D');
        break;
      case 'staff':
        rect(16, 7, 1, 9, 'D');
        rect(16, 4, 3, 3, 'E');
        px(16, 4, 'e');
        px(18, 6, 'e');
        px(17, 5, 'W');
        break;
      default:
        break;
    }
  }

  // ---- composition ------------------------------------------------------

  // Merge the two layers into one frame, offsetting the body's upper half
  // (the bob) and the prop arm (the thrust), then outline whatever results.
  function compose(body, prop, pose) {
    const out = new Array(W * H).fill('');
    const put = (x, y, ch) => {
      if (!ch || x < 0 || y < 0 || x >= W || y >= H) return;
      out[y * W + x] = ch;
    };
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const ch = body.cells[y * W + x];
        if (!ch) continue;
        put(x + pose.dx, y + (y < HIP ? pose.bob : 0), ch);
      }
    }
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const ch = prop.cells[y * W + x];
        if (!ch) continue;
        put(x + pose.dx + pose.wdx, y + pose.bob + pose.wdy, ch);
      }
    }
    // Outline pass. Only cells reachable from outside the figure are
    // outlined, so enclosed gaps -- a bow's aperture, the space between
    // an arm and the ribs -- stay transparent instead of filling in with
    // a black blob.
    const outside = new Array(W * H).fill(false);
    const stack = [];
    const visit = (x, y) => {
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const i = y * W + x;
      if (outside[i] || out[i]) return;
      outside[i] = true;
      stack.push(i);
    };
    for (let x = 0; x < W; x++) { visit(x, 0); visit(x, H - 1); }
    for (let y = 0; y < H; y++) { visit(0, y); visit(W - 1, y); }
    while (stack.length) {
      const i = stack.pop();
      const x = i % W, y = (i - x) / W;
      visit(x - 1, y); visit(x + 1, y); visit(x, y - 1); visit(x, y + 1);
    }

    const outlined = out.slice();
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (!outside[i]) continue;
        const near = (y > 0 && out[i - W]) || (y < H - 1 && out[i + W]) ||
          (x > 0 && out[i - 1]) || (x < W - 1 && out[i + 1]);
        if (near) outlined[i] = 'O';
      }
    }
    return outlined;
  }

  const IDLE = [
    { dx: 0, bob: 0, wdx: 0, wdy: 0 },
    { dx: 0, bob: 0, wdx: 0, wdy: 0 },
    { dx: 0, bob: 1, wdx: 0, wdy: 0 },
    { dx: 0, bob: 1, wdx: 0, wdy: 0 },
  ];

  // Wind back, then lunge; the weapon arm leads the body by a pixel and
  // drops as it swings through.
  const ATTACK = [
    { dx: -1, bob: 0, wdx: 0, wdy: -1 },
    { dx: -2, bob: 1, wdx: 0, wdy: -1 },
    { dx: 1,  bob: 0, wdx: 1, wdy: 1 },
    { dx: 2,  bob: 0, wdx: 1, wdy: 1 },
    { dx: 1,  bob: 0, wdx: 0, wdy: 1 },
  ];

  // Build the two-row spritesheet canvas for a definition.
  function sheetCanvas(def) {
    const rng = roller(def.id || 'unknown');
    const race = (typeof RACES !== 'undefined' && RACES.of(def)) || 'human';
    const look = RACE_LOOK[race] || RACE_LOOK.human;
    const prop = propFor(def, rng);
    const palette = paletteFor(def.tint || {}, def.element);

    const body = layer();
    const propL = layer();
    drawBody(body, def, look, prop, rng);
    drawProp(propL, prop);

    const canvas = document.createElement('canvas');
    canvas.width = W * Math.max(IDLE.length, ATTACK.length);
    canvas.height = H * 2;
    const ctx = canvas.getContext('2d');

    const paint = (poses, row) => poses.forEach((pose, i) => {
      const cells = compose(body, propL, pose);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const ch = cells[y * W + x];
          if (!ch) continue;
          ctx.fillStyle = palette[ch] || palette.B;
          ctx.fillRect(i * W + x, row * H + y, 1, 1);
        }
      }
    });
    paint(IDLE, 0);
    paint(ATTACK, 1);

    return { canvas, frameW: W, frameH: H,
      idle: IDLE.length, attack: ATTACK.length };
  }

  return { sheetCanvas, W, H };
})();
