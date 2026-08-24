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
    this.holding = null; // stance-hold strip currently pinned (see battle.js)
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
      // keep idling, but still resolve the completion callback (on the
      // simulation clock, so background catch-up ticks drive it too).
      if (onComplete) this.fallbackTimer = { wait: 0.35, onComplete };
      name = 'idle';
      onComplete = null;
    }
    this.current = name;
    this.frame = 0;
    this.elapsed = 0;
    this.onComplete = onComplete;
    // An explicit play always breaks a stance hold (see battle.js).
    this.holding = null;
  }

  update(dt) {
    // Missing-animation completion runs on simulation time.
    if (this.fallbackTimer) {
      this.fallbackTimer.wait -= dt;
      if (this.fallbackTimer.wait <= 0) {
        const cb = this.fallbackTimer.onComplete;
        this.fallbackTimer = null;
        cb();
      }
    }

    const anim = this.sheet.animations[this.current];
    if (!anim) return;

    // While plain idling, occasionally fire a timed idle variant.
    if (this.current === 'idle' && !this.onComplete) {
      this.variantTimer -= dt;
      if (this.variantTimer <= 0) {
        const variants = this.variantsOf('idle');
        this.variantTimer = this.rollVariantDelay();
        // The sheet may have been swapped (mirror variants) to one with no
        // idle fidgets: re-check periodically in case it swaps back.
        if (variants.length === 0) {
          if (!isFinite(this.variantTimer)) this.variantTimer = 10;
          return;
        }
        const pick = variants[Math.floor(Math.random() * variants.length)];
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

  // A strip that exists on the server must never silently become
  // placeholder art because one fetch hiccuped (mid-deploy, flaky
  // mobile). One quick retry rides out the blip -- but only the FIRST
  // time a given file fails this session: a hero whose art simply is
  // not there yet would otherwise pay the retry delay on every battle
  // they appear in, and hunts kept finding new ones, so battles got
  // slower and slower.
  const failedSrcs = new Set();
  async function loadImageRetry(src) {
    const first = await loadImage(src);
    if (first) { failedSrcs.delete(src); return first; }
    if (failedSrcs.has(src)) return null; // known absent: fail fast
    failedSrcs.add(src);
    await new Promise((r) => setTimeout(r, 700));
    return loadImage(src);
  }

  async function load(spriteDef, def) {
    // Strip-per-animation format. The idle strip is probed first: if it
    // is not there, none of the others will be either, so a hero whose
    // art has not been delivered costs one request, not nine.
    if (spriteDef && spriteDef.strips) {
      const animations = {};
      const strips = Object.entries(spriteDef.strips);
      strips.sort(([a], [b]) => (a === 'idle' ? -1 : b === 'idle' ? 1 : 0));
      // Probe the idle strip first (a hero whose art is absent costs one
      // request, not nine), then fetch the REST IN PARALLEL -- loading a
      // seven-strip sheet serially made battle setup an image-by-image
      // crawl.
      const images = new Map();
      const idleEntry = strips[0] && strips[0][0] === 'idle' ? strips[0] : null;
      if (idleEntry) images.set('idle', await loadImageRetry(idleEntry[1].src));
      if (!idleEntry || images.get('idle')) {
        await Promise.all(strips
          .filter(([name]) => name !== 'idle')
          .map(async ([name, strip]) => images.set(name, await loadImageRetry(strip.src))));
      }
      for (const [name, strip] of strips) {
        const img = images.get(name);
        // Not delivered, or delivered but failed to decode (0x0): skip
        // it — a zero-size image poisons every frame measurement with
        // NaN and blanks whatever tries to draw it.
        if (!img || !img.width || !img.height) continue;
        // frames: 'auto' measures the count off the delivered image
        // (hero strips are square frames), so a def can be wired before
        // its art lands and still slice correctly when it does.
        const sheetFrames = strip.frames === 'auto'
          ? Math.max(1, Math.round(img.width / img.height))
          : strip.frames;
        animations[name] = {
          image: img,
          row: 0,
          // Custom playback order (1-based sheet frames) lets a pose be
          // revisited, e.g. holding an airborne frame during descent.
          order: strip.order || null,
          frames: strip.order ? strip.order.length : sheetFrames,
          fps: strip.fps,
          loop: !!strip.loop,
          frameW: Math.floor(img.width / sheetFrames),
          frameH: img.height,
          variantOf: strip.variantOf || null,
          every: strip.every || null,
          holds: strip.holds || null,
          hitFrame: strip.hitFrame || null, // effects land on this frame
          motion: strip.motion || null,     // movement phases (see battle.js)
          hop: strip.hop || null,           // in-place jump arc (see battle.js hopHeight)
          frameEffects: strip.frameEffects || null, // spawned effects per frame
          freeze: !!strip.freeze,           // hold last frame at completion
          // While the unit carries this status stat, an idling animator
          // holds this strip's FINAL frame instead (Silas's drawn bow).
          stanceHold: strip.stanceHold || null,
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
      const img = await loadImageRetry(spriteDef.src);
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

    const sheet = makePlaceholderSheet(def);
    // Authored art that failed to arrive is a fetch problem, not a
    // missing-art hero: flag it so the caches do not pin the placeholder
    // for the rest of the session.
    sheet.isFallback = !!(spriteDef && (spriteDef.strips || spriteDef.src));
    return sheet;
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
  // Definitions with no art get a character generated from their race,
  // kit, element and rarity (see js/placeholder_art.js): row 0 idle,
  // row 1 attack.

  function makePlaceholderSheet(def) {
    const art = PlaceholderArt.sheetCanvas(def);
    const mk = (row, frames, fps, loop) => ({
      image: art.canvas, row, frames, fps, loop,
      frameW: art.frameW, frameH: art.frameH,
    });
    const sheet = new SpriteSheet({
      idle: mk(0, art.idle, 5, true),
      attack: mk(1, art.attack, 12, false),
    }, art.frameH * CONFIG.SPRITE_SCALE);
    sheet.shadowOffsetX = 0;
    measureContentBounds(sheet);
    return sheet;
  }

  // Cache: one sheet promise per definition id, shared by battle units,
  // team-builder previews, and roster/summon portraits.
  const sheetCache = new Map();

  const fallbackTries = new Map();

  function getSheet(def) {
    if (!sheetCache.has(def.id)) {
      const p = load(def.sprite, def).then((sheet) => {
        if (sheet.isFallback) {
          // Evict so the next request tries the network again — a unit
          // already animating keeps this sheet, but the next screen
          // paint recovers the real art. Bounded so a genuinely absent
          // file stops costing requests after a few tries.
          const n = (fallbackTries.get(def.id) || 0) + 1;
          fallbackTries.set(def.id, n);
          if (n <= 3) sheetCache.delete(def.id);
        }
        return sheet;
      });
      sheetCache.set(def.id, p);
    }
    return sheetCache.get(def.id);
  }

  // Mirror-count sprite variants (Echo): def.mirrorSprites is an array of
  // sprite defs indexed by active-mirror count. Resolves to a parallel
  // array of SpriteSheets (cached per def).
  function getMirrorSheets(def) {
    const key = `${def.id}:mirrors`;
    if (!sheetCache.has(key)) {
      sheetCache.set(key, Promise.all(
        def.mirrorSprites.map((s) => load(s, def))));
    }
    return sheetCache.get(key);
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
    // Paint a near-white effect a solid colour. A hue rotation cannot do
    // this: rotating the hue of something desaturated leaves it
    // desaturated, which is why the bubble stayed grey. Multiply carries
    // the colour into every lit pixel and leaves the highlights bright;
    // the destination-in pass puts the original alpha back, since
    // multiply also paints the transparent margin.
    if (fx.tint) {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = fx.tint;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'destination-in';
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

  // Art authored facing LEFT. The board convention is facing right, and
  // every surface that draws a hero has to agree on this or the same
  // character faces two ways in two screens. Audited sheet by sheet
  // (idle + action strips — wind-ups mislead, strikes don't): the
  // species packs and most named heroes are authored facing right;
  // the left-authored defs carry sprite.faceLeft explicitly.
  // `anim` narrows the question to one strip: a sheet where a single
  // animation was authored the other way round (Lin's skill3 plants the
  // ball to the right while the rest of her kit faces left) carries
  // faceLeft on that strip, overriding the sheet-wide flag.
  function facesLeft(def, anim) {
    const sp = def && def.sprite;
    if (!sp) return false;
    const strip = anim && sp.strips && sp.strips[anim];
    if (strip && strip.faceLeft !== undefined) return !!strip.faceLeft;
    return !!sp.faceLeft;
  }

  // Portrait bitmaps, rendered once per hero and reused. The roster
  // grid draws hundreds of these; without a cache every refresh
  // re-decodes and re-rasterizes the same idle frames.
  const portraitCache = new Map();

  function portraitBitmap(def, size = 64) {
    const key = `${def.id}:${size}`;
    if (portraitCache.has(key)) return portraitCache.get(key);
    const promise = getSheet(def).then((sheet) => {
      if (sheet.isFallback) portraitCache.delete(key);
      const anim = sheet.animations.idle;
      const c = document.createElement('canvas');
      c.width = size * 3;      // 3x backing, matching drawPortrait
      c.height = size * 3;
      const ctx = c.getContext('2d');
      let scale = Math.min(c.width / anim.frameW, c.height / anim.frameH);
      if (scale > 1) scale = Math.floor(scale);
      ctx.imageSmoothingEnabled = scale < 1;
      ctx.imageSmoothingQuality = 'high';
      const w = anim.frameW * scale;
      const h = anim.frameH * scale;
      if (facesLeft(def)) { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
      ctx.drawImage(anim.image, 0, anim.row * anim.frameH, anim.frameW, anim.frameH,
        (c.width - w) / 2, (c.height - h) / 2, w, h);
      c._fallback = !!sheet.isFallback;
      return c;
    });
    portraitCache.set(key, promise);
    return promise;
  }

  // Paint a cached portrait into an <img>-like element cheaply.
  async function paintPortrait(canvasEl, def) {
    // The first paint swells the canvas to its 3x backing store, so the
    // logical size must be remembered -- reading .width on a repaint
    // would treat the backing resolution as the display size and paint
    // a portrait three times too large.
    const size = canvasEl._logicalSize || (canvasEl._logicalSize = canvasEl.width || 64);
    const bmp = await portraitBitmap(def, size);
    canvasEl.style.width = `${size}px`;
    canvasEl.style.height = `${size}px`;
    if (canvasEl.width !== bmp.width) {
      canvasEl.width = bmp.width;
      canvasEl.height = bmp.height;
    }
    const ctx = canvasEl.getContext('2d');
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    ctx.drawImage(bmp, 0, 0);
    // False when this painted stand-in art for a hero that ships real
    // art -- the caller should try again later rather than keep it.
    return !bmp._fallback;
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
    if (facesLeft(def)) { ctx.translate(canvasEl.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(
      anim.image,
      0, anim.row * anim.frameH, anim.frameW, anim.frameH,
      (canvasEl.width - w) / 2, (canvasEl.height - h) / 2, w, h
    );
  }

  return { load, getSheet, getMirrorSheets, getEffectSheet, drawPortrait,
    paintPortrait, portraitBitmap, loadImage, assetUrl, facesLeft };
})();
