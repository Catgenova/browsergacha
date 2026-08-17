// Spritesheet loading + animation playback.
//
// Spritesheet contract (see assets/README.md):
//   - One PNG per hero, one animation per row, frames left-to-right.
//   - The hero definition declares frame size and per-animation row/frame
//     count/fps, e.g.:
//       sprite: {
//         src: 'assets/heroes/sir_pixel.png',
//         frameW: 32, frameH: 32,
//         animations: {
//           idle:   { row: 0, frames: 4, fps: 6,  loop: true  },
//           attack: { row: 1, frames: 5, fps: 10, loop: false },
//         },
//       }
//
// If the PNG is missing (or hasn't been provided yet) a procedurally drawn
// pixel-art placeholder sheet is generated so the game stays runnable.

class SpriteSheet {
  constructor(image, frameW, frameH, animations) {
    this.image = image;
    this.frameW = frameW;
    this.frameH = frameH;
    this.animations = animations;
  }
}

class AnimationPlayer {
  constructor(sheet) {
    this.sheet = sheet;
    this.current = 'idle';
    this.frame = 0;
    this.elapsed = 0;
    this.onComplete = null;
  }

  play(name, onComplete = null) {
    if (!this.sheet.animations[name]) name = 'idle';
    this.current = name;
    this.frame = 0;
    this.elapsed = 0;
    this.onComplete = onComplete;
  }

  update(dt) {
    const anim = this.sheet.animations[this.current];
    if (!anim) return;
    this.elapsed += dt;
    const frameDuration = 1 / anim.fps;
    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration;
      this.frame++;
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

  // Draw centered at (x, y) with the unit's feet near the bottom.
  draw(ctx, x, y, scale, flipX) {
    const anim = this.sheet.animations[this.current] || this.sheet.animations.idle;
    const sx = this.frame * this.sheet.frameW;
    const sy = anim.row * this.sheet.frameH;
    const w = this.sheet.frameW * scale;
    const h = this.sheet.frameH * scale;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(x, y);
    if (flipX) ctx.scale(-1, 1);
    ctx.drawImage(
      this.sheet.image,
      sx, sy, this.sheet.frameW, this.sheet.frameH,
      -w / 2, -h / 2, w, h
    );
    ctx.restore();
  }
}

const Sprites = (() => {
  // Load a hero's spritesheet; fall back to a generated placeholder.
  function load(spriteDef, tint) {
    return new Promise((resolve) => {
      const finishWithPlaceholder = () => {
        const sheet = makePlaceholderSheet(tint);
        resolve(sheet);
      };

      if (!spriteDef || !spriteDef.src) {
        finishWithPlaceholder();
        return;
      }

      const img = new Image();
      img.onload = () => {
        resolve(new SpriteSheet(img, spriteDef.frameW, spriteDef.frameH, spriteDef.animations));
      };
      img.onerror = finishWithPlaceholder;
      img.src = spriteDef.src;
    });
  }

  // ---- Placeholder generation -------------------------------------------
  // Draws a tiny 16x16 knight-ish figure into an offscreen spritesheet:
  //   row 0: idle (4 frames, gentle bob)
  //   row 1: attack (5 frames, lunge + swing)
  // This exercises the exact same animation pipeline real sheets will use.

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
        let ch = BASE_FRAME[y][x];
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

    return new SpriteSheet(canvas, frameW, frameH, PLACEHOLDER.animations);
  }

  return { load };
})();
