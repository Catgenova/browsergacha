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
    this.onFrameChange = null; // (frameNumber1Based) => void, fires per frame
    this.variantTimer = this.rollVariantDelay();
  }

  frameDuration(anim, frameNumber) {
    return (1 / anim.fps) * ((anim.holds && anim.holds[frameNumber]) || 1);
  }

  // Real-time progress (0..1) through an inclusive 1-based frame range of
  // the current animation, accounting for holds/fast frames. Drives
  // attack motion so movement speed follows the animation's pacing.
  progressIn(range) {
    const anim = this.sheet.animations[this.current];
    if (!anim) return 1;
    const [a, b] = range;
    const f = this.frame + 1;
    if (f < a) return 0;
    if (f > b) return 1;
    let total = 0;
    for (let i = a; i <= b; i++) total += this.frameDuration(anim, i);
    let done = 0;
    for (let i = a; i < f; i++) done += this.frameDuration(anim, i);
    done += Math.min(this.elapsed, this.frameDuration(anim, f));
    return Math.min(1, done / total);
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
      if (this.frame < anim.frames && this.onFrameChange) {
        this.onFrameChange(this.frame + 1);
      }
      if (this.frame >= anim.frames) {
        if (anim.loop) {
          this.frame = 0;
        } else {
          this.frame = anim.frames - 1;
          const cb = this.onComplete;
          this.onComplete = null;
          if (cb) cb();
          // freeze: stay on the final frame (death poses) instead of
          // returning to idle.
          if (!anim.freeze) this.play('idle');
          else this.elapsed = 0;
          return;
        }
      }
    }
  }

  size() {
    return this.sheet.size(this.current);
  }

  // Draw centered at (x, y), scaled to the sheet's display height.
  // whiteFlash (0..1) tints the sprite's own silhouette white — hit flash.
  draw(ctx, x, y, flipX, whiteFlash = 0) {
    const anim = this.sheet.animations[this.current] || this.sheet.animations.idle;
    if (!anim) return;
    const scale = this.sheet.displayH / anim.frameH;
    const w = anim.frameW * scale;
    const h = anim.frameH * scale;
    // Map playback index -> sheet frame (identity unless order remaps it).
    const sheetFrame = anim.order ? anim.order[this.frame] - 1 : this.frame;
    let sx, sy;
    if (anim.cols) { // grid layout (left-right, top-bottom)
      sx = (sheetFrame % anim.cols) * anim.frameW;
      sy = Math.floor(sheetFrame / anim.cols) * anim.frameH;
    } else if (anim.vertical) {
      sx = 0;
      sy = sheetFrame * anim.frameH;
    } else {
      sx = sheetFrame * anim.frameW;
      sy = anim.row * anim.frameH;
    }

    ctx.save();
    // High-res art shrinking down gets quality resampling; low-res pixel
    // art blowing up keeps crisp nearest-neighbor.
    ctx.imageSmoothingEnabled = scale < 1;
    ctx.imageSmoothingQuality = 'high';
    ctx.translate(x, y);
    if (flipX) ctx.scale(-1, 1);
    ctx.drawImage(anim.image, sx, sy, anim.frameW, anim.frameH, -w / 2, -h / 2, w, h);

    if (whiteFlash > 0) {
      const scratch = AnimationPlayer.scratch ||
        (AnimationPlayer.scratch = document.createElement('canvas'));
      if (scratch.width < anim.frameW) scratch.width = anim.frameW;
      if (scratch.height < anim.frameH) scratch.height = anim.frameH;
      const sctx = scratch.getContext('2d');
      sctx.clearRect(0, 0, anim.frameW, anim.frameH);
      sctx.drawImage(anim.image, sx, sy, anim.frameW, anim.frameH, 0, 0, anim.frameW, anim.frameH);
      sctx.globalCompositeOperation = 'source-in';
      sctx.fillStyle = '#ffffff';
      sctx.fillRect(0, 0, anim.frameW, anim.frameH);
      sctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = Math.min(1, whiteFlash);
      ctx.drawImage(scratch, 0, 0, anim.frameW, anim.frameH, -w / 2, -h / 2, w, h);
    }
    ctx.restore();
  }
}

const Sprites = (() => {
  // Cache-bust sprite images with the deployed build id, so an updated
  // sheet can never pair with a stale cached image (which would slice
  // frames at the wrong width). Locally the tag has no hex sha -> no-op.
  function assetUrl(src) {
    const tag = document.getElementById('version-tag');
    const m = tag && tag.textContent.match(/[0-9a-f]{8}/);
    return m ? `${src}?v=${m[0]}` : src;
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = assetUrl(src);
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
          // Custom playback order (1-based sheet frames) lets a pose be
          // revisited, e.g. holding an airborne frame during descent.
          order: strip.order || null,
          frames: strip.order ? strip.order.length : strip.frames,
          fps: strip.fps,
          loop: !!strip.loop,
          frameW: Math.floor(img.width / strip.frames),
          frameH: img.height,
          variantOf: strip.variantOf || null,
          every: strip.every || null,
          holds: strip.holds || null,
          hitFrame: strip.hitFrame || null, // effects land on this frame
          motion: strip.motion || null,     // movement phases (see battle.js)
          frameEffects: strip.frameEffects || null, // spawned effects per frame
          freeze: !!strip.freeze,           // hold last frame at completion
        };
      }
      if (animations.idle) {
        const sheet = new SpriteSheet(animations, spriteDef.displayH || 88);
        // Horizontal offset (display px) of the character's feet from the
        // frame center — for art where the body sits off-center.
        sheet.shadowOffsetX = spriteDef.shadowOffsetX || 0;
        measureContentBounds(sheet);
        return sheet;
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

  // Measure the transparent padding above and below the character in the
  // idle art, so units can be anchored by their actual feet rather than
  // the frame edge (sheets pad differently per artist). Stored on the
  // sheet in display pixels: footPad (below feet), headPad (above head).
  function measureContentBounds(sheet) {
    sheet.footPad = 0;
    sheet.headPad = 0;
    try {
      const anim = sheet.animations.idle;
      const c = document.createElement('canvas');
      c.width = anim.frameW;
      c.height = anim.frameH;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(anim.image, 0, anim.row * anim.frameH, anim.frameW, anim.frameH,
        0, 0, anim.frameW, anim.frameH);
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      const rowOpaque = (y, x0, x1) => {
        for (let x = x0; x < x1; x += 2) {
          if (data[(y * c.width + x) * 4 + 3] > 40) return true;
        }
        return false;
      };
      // Feet line: scan only the central band of columns, so trailing
      // capes/dresses at the frame edges don't count as "the bottom".
      const bandX0 = Math.floor(c.width * 0.32);
      const bandX1 = Math.ceil(c.width * 0.68);
      let bottom = c.height - 1;
      while (bottom > 0 && !rowOpaque(bottom, bandX0, bandX1)) bottom--;
      let top = 0;
      while (top < bottom && !rowOpaque(top, 0, c.width)) top++;
      const scale = sheet.displayH / anim.frameH;
      sheet.footPad = Math.round((c.height - 1 - bottom) * scale);
      sheet.headPad = Math.round(top * scale);

      // Feet centroid: where the character actually stands horizontally.
      // Averaged over the lowest content rows (mid 70% of columns), so
      // off-center bodies get their shadow under the boots, not the frame
      // center. A def-provided shadowOffsetX overrides the measurement.
      if (sheet.shadowOffsetX === 0) {
        const rows = Math.max(2, Math.round(c.height * 0.05));
        let sx = 0, n = 0;
        const cx0 = Math.floor(c.width * 0.15);
        const cx1 = Math.ceil(c.width * 0.85);
        for (let y = Math.max(0, bottom - rows); y <= bottom; y++) {
          for (let x = cx0; x < cx1; x += 2) {
            if (data[(y * c.width + x) * 4 + 3] > 40) { sx += x; n++; }
          }
        }
        if (n > 0) {
          sheet.shadowOffsetX = Math.round((sx / n - c.width / 2) * scale);
        }
      }
    } catch (e) { /* tainted canvas on file:// — keep zero padding */ }
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

  // Frame-per-file sequences ('##' in the pattern is the zero-padded
  // index): stitched into a horizontal strip at load, bottom-aligned so
  // ground effects sit on their baseline.
  async function loadSequenceImage(seq) {
    const imgs = [];
    for (let i = 1; i <= seq.count; i++) {
      const n = String(i).padStart(seq.pad || 2, '0');
      const img = await loadImage(seq.pattern.replace('##', n));
      if (img) imgs.push(img);
    }
    if (imgs.length === 0) return null;
    const frameW = Math.max(...imgs.map((i) => i.width));
    const frameH = Math.max(...imgs.map((i) => i.height));
    const canvas = document.createElement('canvas');
    canvas.width = frameW * imgs.length;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d');
    imgs.forEach((img, i) =>
      ctx.drawImage(img, i * frameW + (frameW - img.width) / 2, frameH - img.height));
    return { image: canvas, frameW, frameH, frames: imgs.length };
  }

  // Standalone effect sheets (see js/data/effects.js): one 'play'
  // animation per sheet. Supports single-row, vertical, and grid layouts
  // plus an optional hue rotation (degrees) baked in at load — e.g.
  // recoloring the cyan effect pack green. Resolves to null if missing.
  async function loadEffectSheet(fx) {
    let image, frameW, frameH, frames, cols = null;
    if (fx.seq) {
      const stitched = await loadSequenceImage(fx.seq);
      if (!stitched) return null;
      ({ image, frameW, frameH, frames } = stitched);
    } else {
      const img = await loadImage(fx.src);
      if (!img) return null;
      image = img;
      if (fx.grid) {
        cols = fx.grid.cols;
        frames = fx.frames || fx.grid.cols * fx.grid.rows;
        frameW = Math.floor(img.width / fx.grid.cols);
        frameH = Math.floor(img.height / fx.grid.rows);
      } else {
        frames = fx.frames;
        frameW = fx.vertical ? img.width : Math.floor(img.width / fx.frames);
        frameH = fx.vertical ? Math.floor(img.height / fx.frames) : img.height;
      }
    }
    if (fx.hue) {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      ctx.filter = `hue-rotate(${fx.hue}deg)`;
      ctx.drawImage(image, 0, 0);
      image = canvas;
    }
    const animations = {
      play: {
        image, row: 0, frames, fps: fx.fps, loop: false,
        frameW, frameH,
        vertical: !fx.seq && !fx.grid && !!fx.vertical,
        cols,
      },
    };
    return new SpriteSheet(animations, fx.displayH || frameH);
  }

  function getEffectSheet(id) {
    const key = `fx:${id}`;
    if (!sheetCache.has(key)) {
      const fx = typeof EFFECTS !== 'undefined' && EFFECTS[id];
      sheetCache.set(key, fx ? loadEffectSheet(fx) : Promise.resolve(null));
    }
    return sheetCache.get(key);
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

  return { load, getSheet, getEffectSheet, drawPortrait, loadImage, assetUrl };
})();
