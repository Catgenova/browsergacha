// Spritesheet loading + animation playback.
//
// Two sheet formats are supported (see assets/README.md):
//
// 1) Strip-per-animation (preferred for hand-made art): one PNG per
//    animation, N equal frames left-to-right. Frame size is auto-derived
//    (width / frames × height), so no pixel bookkeeping needed:
//      sprite: {
//        displayH: 88, // on-screen height in px (art is scaled to this)
//        strips: {
//          idle:   { src: 'assets/heroes/florence/idle.png',   frames: 9, fps: 8,  loop: true  },
//          attack: { src: 'assets/heroes/florence/attack.png', frames: 6, fps: 12, loop: false },
//        },
//      }
//
// 2) Single sheet: one PNG per hero, one animation per row:
//      sprite: {
//        src: 'assets/heroes/x.png', frameW: 32, frameH: 32,
//        animations: {
//          idle:   { row: 0, frames: 4, fps: 6,  loop: true  },
//          attack: { row: 1, frames: 5, fps: 10, loop: false },
//        },
//      }
//
// Missing files fall back gracefully: a missing attack strip means attack
// requests resolve as a brief one-shot of idle; a missing idle (or no
// sprite at all) generates a procedural pixel-art placeholder.

// animations: { name: { image, row, frames, fps, loop, frameW, frameH } }
class SpriteSheet {
  constructor(animations, displayH) {
    this.animations = animations;
    this.displayH = displayH; // on-screen height; width scales proportionally
  }

  // On-screen size of an animation's frames (defaults to idle).
  size(name = 'idle') {
    const anim = this.animations[name] || this.animations.idle;
    const scale = this.displayH / anim.frameH;
    return { w: anim.frameW * scale, h: this.displayH };
  }
}

class AnimationPlayer {
  constructor(sheet) {
    this.sheet = sheet;
    this.current = 'idle';
    this.frame = 0;
    this.elapsed = 0;
    this.onComplete = null;
    this.variantTimer = this.rollVariantDelay();
  }

  // Timed idle variants: animations declaring variantOf: 'idle' play once
  // every `every: [min, max]` seconds while the base idle is running.
  variantsOf(base) {
    return Object.entries(this.sheet.animations)
      .filter(([, a]) => a.variantOf === base)
      .map(([name, a]) => ({ name, every: a.every || [7, 14] }));
  }

  rollVariantDelay() {
    const variants = this.variantsOf('idle');
    if (variants.length === 0) return Infinity;
    const [min, max] = variants[0].every;
    return min + Math.random() * (max - min);
  }

  play(name, onComplete = null) {
    if (!this.sheet.animations[name]) {
      // Animation not provided (e.g. attack strip not delivered yet):
      // keep idling, but still resolve the completion callback so the
      // battle flow (which waits on it) never stalls.
      if (onComplete) setTimeout(onComplete, 350);
      name = 'idle';
      onComplete = null;
    }
    this.current = name;
    this.frame = 0;
    this.elapsed = 0;
    this.onComplete = onComplete;
  }

  update(dt) {
    const anim = this.sheet.animations[this.current];
    if (!anim) return;

    // While plain idling, occasionally fire a timed idle variant.
    if (this.current === 'idle' && !this.onComplete) {
      this.variantTimer -= dt;
      if (this.variantTimer <= 0) {
        const variants = this.variantsOf('idle');
        const pick = variants[Math.floor(Math.random() * variants.length)];
        this.variantTimer = this.rollVariantDelay();
        this.play(pick.name);
        return;
      }
    }

    this.elapsed += dt;
    // Per-frame holds: anim.holds maps 1-based frame numbers to a
    // multiplier, e.g. { 7: 5 } keeps frame 7 up for 5 ticks.
    let frameDuration = (1 / anim.fps) * ((anim.holds && anim.holds[this.frame + 1]) || 1);
    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration;
      this.frame++;
      frameDuration = (1 / anim.fps) * ((anim.holds && anim.holds[this.frame + 1]) || 1);
      if (this.frame >= anim.frames) {
        if (anim.loop) {
          this.frame = 0;
        } else {
          this.frame = anim.frames - 1;
          const cb = this.onComplete;
          this.onComplete = null;
          if (cb) cb();
          this.play('idle');
          return;
        }
      }
    }
  }

  size() {
    return this.sheet.size(this.current);
  }

  // Draw centered at (x, y), scaled to the sheet's display height.
  draw(ctx, x, y, flipX) {
    const anim = this.sheet.animations[this.current] || this.sheet.animations.idle;
    if (!anim) return;
    const scale = this.sheet.displayH / anim.frameH;
    const w = anim.frameW * scale;
    const h = anim.frameH * scale;
    const sx = this.frame * anim.frameW;
    const sy = anim.row * anim.frameH;

    ctx.save();
    // High-res art shrinking down gets quality resampling; low-res pixel
    // art blowing up keeps crisp nearest-neighbor.
    ctx.imageSmoothingEnabled = scale < 1;
    ctx.imageSmoothingQuality = 'high';
    ctx.translate(x, y);
    if (flipX) ctx.scale(-1, 1);
    ctx.drawImage(anim.image, sx, sy, anim.frameW, anim.frameH, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
}

const Sprites = (() => {
  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  async function load(spriteDef, tint) {
    // Strip-per-animation format.
    if (spriteDef && spriteDef.strips) {
      const animations = {};
      for (const [name, strip] of Object.entries(spriteDef.strips)) {
        const img = await loadImage(strip.src);
        if (!img) continue; // strip not delivered yet — skip it
        animations[name] = {
          image: img,
          row: 0,
          frames: strip.frames,
          fps: strip.fps,
          loop: !!strip.loop,
          frameW: Math.floor(img.width / strip.frames),
          frameH: img.height,
          variantOf: strip.variantOf || null,
          every: strip.every || null,
          holds: strip.holds || null,
        };
      }
      if (animations.idle) {
        return new SpriteSheet(animations, spriteDef.displayH || 88);
      }
      // No usable idle: fall through to placeholder.
    }

    // Single-sheet format.
    if (spriteDef && spriteDef.src) {
      const img = await loadImage(spriteDef.src);
      if (img) {
        const animations = {};
        for (const [name, a] of Object.entries(spriteDef.animations)) {
          animations[name] = {
            image: img,
            row: a.row,
            frames: a.frames,
            fps: a.fps,
            loop: !!a.loop,
            frameW: spriteDef.frameW,
            frameH: spriteDef.frameH,
          };
        }
        return new SpriteSheet(
          animations, spriteDef.displayH || spriteDef.frameH * CONFIG.SPRITE_SCALE);
      }
    }

    return makePlaceholderSheet(tint);
  }

  // ---- Placeholder generation -------------------------------------------
  // Draws a tiny 16x16 knight-ish figure into an offscreen spritesheet:
  //   row 0: idle (4 frames, gentle bob)
  //   row 1: attack (5 frames, lunge + swing)

  const PLACEHOLDER = {
    frameW: 16,
    frameH: 16,
    animations: {
      idle:   { row: 0, frames: 4, fps: 5,  loop: true  },
      attack: { row: 1, frames: 5, fps: 12, loop: false },
    },
  };

  // 16x16 pixel map. Keys: . transparent, O outline, B body, H helm,
  // S skin, W weapon, X shield.
  const BASE_FRAME = [
    '................',
    '.....OOOO.......',
    '....OHHHHO......',
    '....OHHHHO......',
    '....OSSSSO......',
    '.....OSSO.......',
    '....OBBBBO..W...',
    '...OBBBBBBO.W...',
    '..XOBBBBBBOW....',
    '..XOBBBBBBO.....',
    '..XOBBBBBBO.....',
    '....OBBBBO......',
    '....OB..BO......',
    '....OB..BO......',
    '...OOB..BOO.....',
    '................',
  ];

  function paletteFor(tint) {
    return {
      O: '#1a1622',
      B: tint.body || '#4a6fd4',
      H: tint.helm || '#8d9bb8',
      S: tint.skin || '#e8b88a',
      W: tint.weapon || '#d8d8e0',
      X: tint.shield || '#b8862e',
    };
  }

  function drawFrame(ctx, ox, oy, palette, shiftX, shiftY, weaponForward) {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const ch = BASE_FRAME[y][x];
        if (ch === '.') continue;
        let px = x + shiftX;
        // On attack frames, thrust the weapon column forward.
        if (weaponForward && ch === 'W') px += weaponForward;
        if (px < 0 || px > 15) continue;
        ctx.fillStyle = palette[ch];
        ctx.fillRect(ox + px, oy + y + shiftY, 1, 1);
      }
    }
  }

  function makePlaceholderSheet(tint = {}) {
    const { frameW, frameH } = PLACEHOLDER;
    const canvas = document.createElement('canvas');
    canvas.width = frameW * 5;   // widest row (attack has 5 frames)
    canvas.height = frameH * 2;  // 2 animation rows
    const ctx = canvas.getContext('2d');
    const palette = paletteFor(tint);

    // Row 0 — idle: subtle vertical bob.
    const idleBob = [0, 0, 1, 0];
    idleBob.forEach((bob, i) => drawFrame(ctx, i * frameW, 0, palette, 0, bob, 0));

    // Row 1 — attack: wind-up back, then lunge forward with weapon thrust.
    const attackMotion = [
      { x: -1, w: 0 },
      { x: -2, w: 0 },
      { x: 2,  w: 2 },
      { x: 3,  w: 3 },
      { x: 1,  w: 1 },
    ];
    attackMotion.forEach((m, i) =>
      drawFrame(ctx, i * frameW, frameH, palette, m.x, 0, m.w)
    );

    const animations = {};
    for (const [name, a] of Object.entries(PLACEHOLDER.animations)) {
      animations[name] = {
        image: canvas, row: a.row, frames: a.frames, fps: a.fps, loop: !!a.loop,
        frameW, frameH,
      };
    }
    return new SpriteSheet(animations, frameH * CONFIG.SPRITE_SCALE);
  }

  // Cache: one sheet promise per definition id, shared by battle units,
  // team-builder previews, and roster/summon portraits.
  const sheetCache = new Map();

  function getSheet(def) {
    if (!sheetCache.has(def.id)) {
      sheetCache.set(def.id, load(def.sprite, def.tint || {}));
    }
    return sheetCache.get(def.id);
  }

  // Draw a hero's idle frame 0 into a portrait canvas element.
  // Renders at 3x backing resolution so portraits stay sharp when the UI
  // scales up; the element keeps its logical CSS size.
  async function drawPortrait(canvasEl, def) {
    const sheet = await getSheet(def);
    const anim = sheet.animations.idle;
    const logicalW = canvasEl.width;
    const logicalH = canvasEl.height;
    canvasEl.style.width = `${logicalW}px`;
    canvasEl.style.height = `${logicalH}px`;
    canvasEl.width = logicalW * 3;
    canvasEl.height = logicalH * 3;

    const ctx = canvasEl.getContext('2d');
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    // Fit the frame in the backing store: crisp integer upscale for small
    // pixel frames, quality downscale for large art.
    let scale = Math.min(canvasEl.width / anim.frameW, canvasEl.height / anim.frameH);
    if (scale > 1) scale = Math.floor(scale);
    ctx.imageSmoothingEnabled = scale < 1;
    ctx.imageSmoothingQuality = 'high';
    const w = anim.frameW * scale;
    const h = anim.frameH * scale;
    ctx.drawImage(
      anim.image,
      0, anim.row * anim.frameH, anim.frameW, anim.frameH,
      (canvasEl.width - w) / 2, (canvasEl.height - h) / 2, w, h
    );
  }

  return { load, getSheet, drawPortrait };
})();
