// Canvas rendering: hex grids, units, health/turn-meter bars, floating text.

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.battle = null;        // bound via setBattle for each new battle
    this.hoveredUnit = null;   // set by UI for target highlighting
    this.targetingMode = null; // 'enemy' | 'ally' | null
    this.targetingSource = null; // whoever is choosing, for matchup hints
    this.rowMode = false;      // highlight the hovered enemy's whole row
    // Battle backdrops: all loaded up front; each new battle rotates to
    // the next (gradient fallback until loaded / when missing).
    this.bgImages = (CONFIG.BATTLE_BGS || []).map(() => null);
    (CONFIG.BATTLE_BGS || []).forEach((src, i) => {
      Sprites.loadImage(src).then((img) => { this.bgImages[i] = img; });
    });
    this.bgIndex = 0;
  }

  // `bgPin` pins the backdrop: a BATTLE_BGS index (hunt locations) or an
  // image path (boss arenas). Null rotates as before.
  setBattle(battle, bgPin = null) {
    this.battle = battle;
    this.hoveredUnit = null;
    this.targetingMode = null;
    this.rowMode = false;
    this.customBg = null;
    if (typeof bgPin === 'string') {
      // Boss arena image, loaded once and cached; until it arrives (or
      // if the file is missing) drawBackground falls back to bgIndex.
      Renderer.customBgCache = Renderer.customBgCache || new Map();
      if (Renderer.customBgCache.has(bgPin)) {
        this.customBg = Renderer.customBgCache.get(bgPin);
      } else {
        Sprites.loadImage(bgPin).then((img) => {
          Renderer.customBgCache.set(bgPin, img);
          this.customBg = img;
        });
      }
      bgPin = null; // fall through to rotation as the fallback backdrop
    }
    if (this.bgImages.length > 0) {
      if (bgPin !== null) {
        this.bgIndex = bgPin % this.bgImages.length;
      } else {
        Renderer.bgRotation = ((Renderer.bgRotation ?? -1) + 1) % this.bgImages.length;
        this.bgIndex = Renderer.bgRotation;
      }
    }
  }

  // How much to enlarge nameplates, bars and pips. They are interface,
  // not art, so they should stay readable at whatever size the board is
  // shown rather than shrinking with it — on a phone the canvas is drawn
  // at 960 logical and displayed near 374 CSS px, which renders 10px text
  // at under 4px. 1 on desktop, capped at 1.8 on a phone: past that the
  // nameplates are wider than the hex they belong to and collide.
  //
  // The rect read forces layout, so it is only redone when the backing
  // store changes size — which is exactly when the displayed size did,
  // since sizeCanvases() derives one from the other.
  uiScale() {
    if (this._uiFor !== this.canvas.width) {
      this._uiFor = this.canvas.width;
      const shown = this.canvas.getBoundingClientRect().width || CONFIG.CANVAS_W;
      this._ui = Math.min(1.8, Math.max(1, CONFIG.CANVAS_W / shown));
    }
    return this._ui;
  }

  // A monospace font string, enlarged for a small display.
  uiFont(px, weight = '') {
    return `${weight}${Math.round(px * this.uiScale())}px monospace`;
  }

  draw() {
    const { ctx } = this;
    if (!this.battle) return;
    // Backing store may be larger than the logical 960x540 (hi-DPI);
    // draw in logical coordinates on top of a scale transform.
    const q = this.canvas.width / CONFIG.CANVAS_W;
    ctx.setTransform(q, 0, 0, q, 0, 0);
    ctx.clearRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

    // Who moves next, resolved once per frame rather than once per
    // plate — every plate needs the answer and it is the same answer.
    this.nextUp = this.battle.nextUpUnit ? this.battle.nextUpUnit() : null;

    this.drawBackground();
    this.drawFormation(this.battle.playerSlots, 'rgba(120, 150, 220, 0.6)');
    this.drawFormation(this.battle.enemySlots, 'rgba(220, 120, 110, 0.6)');

    // Draw units back-to-front by y; units mid-attack-motion draw last
    // so they pass in front of everything they fly over.
    const units = this.battle.units.slice().sort((a, b) => a.slot.y - b.slot.y);
    for (const unit of units) if (!unit.motionState) this.drawUnit(unit);
    for (const unit of units) if (unit.motionState) this.drawUnit(unit);

    this.drawVisualEffects();
    this.drawFloatingTexts();
  }

  // One still frame of an effect sheet, centred, at an explicit height.
  // The one-shot player owns the animated case; this is for art that
  // persists while a state does (a shield bubble) rather than playing out.
  drawEffectFrame(id, index, x, y, opts = {}) {
    const sheets = this.battle && this.battle.effectSheets;
    const sheet = sheets && sheets[id];
    if (!sheet) return;
    const anim = sheet.animations.play;
    if (!anim) return;
    const cols = anim.cols || anim.frames;
    const sx = anim.vertical ? 0 : (index % cols) * anim.frameW;
    const sy = anim.vertical ? index * anim.frameH
      : (anim.cols ? Math.floor(index / cols) * anim.frameH : 0);
    const h = opts.height || sheet.displayH;
    const w = anim.frameW * (h / anim.frameH);
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = opts.alpha === undefined ? 1 : opts.alpha;
    ctx.drawImage(anim.image, sx, sy, anim.frameW, anim.frameH,
      x - w / 2, y - h / 2, w, h);
    ctx.restore();
  }

  drawVisualEffects() {
    const { ctx } = this;
    // One-shot impact sprites (slash/strike/punch/slam art).
    for (const fx of this.battle.effectSprites) {
      if (fx.rotate || fx.flipY) {
        ctx.save();
        ctx.translate(fx.x, fx.y);
        if (fx.flipY) ctx.scale(1, -1); // vertical mirror of the final image
        if (fx.rotate) ctx.rotate(fx.rotate);
        fx.player.draw(ctx, 0, 0, false);
        ctx.restore();
      } else {
        fx.player.draw(ctx, fx.x, fx.y, false);
      }
    }

    for (const fx of this.battle.visualEffects) {
      if (fx.kind !== 'windshear') continue;
      const t = Math.min(1, fx.age / fx.duration);

      // Sprite wave (preferred): travels along the path, art plays through.
      if (fx.player) {
        const x = fx.sx + (fx.ex - fx.sx) * t;
        const y = fx.sy + (fx.ey - fx.sy) * t;
        const angle = Math.atan2(fx.ey - fx.sy, fx.ex - fx.sx);
        ctx.save();
        ctx.translate(x, y);
        if (fx.dir >= 0) {
          ctx.rotate(angle);
        } else {
          ctx.scale(-1, 1);
          ctx.rotate(Math.atan2(fx.ey - fx.sy, -(fx.ex - fx.sx)));
        }
        fx.player.draw(ctx, 0, 0, false);
        ctx.restore();
        continue;
      }

      // Fallback: drawn crescents.
      const angle = Math.atan2(fx.ey - fx.sy, fx.ex - fx.sx);
      const fade = t > 0.7 ? (1 - t) / 0.3 : 1;
      // Leading crescent plus two trailing ghosts.
      for (let i = 0; i < 3; i++) {
        const tt = t - i * 0.1;
        if (tt < 0) continue;
        const gx = fx.sx + (fx.ex - fx.sx) * tt;
        const gy = fx.sy + (fx.ey - fx.sy) * tt;
        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(angle);
        ctx.globalAlpha = fade * (i === 0 ? 0.95 : 0.35 / i);
        ctx.strokeStyle = i === 0 ? '#e8faff' : '#8ad8ff';
        ctx.lineWidth = 5 - i;
        ctx.shadowColor = '#8ad8ff';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(-34, 0, 44, -Math.PI / 2.5, Math.PI / 2.5);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  drawBackground() {
    const { ctx } = this;
    const bg = this.customBg || this.bgImages[this.bgIndex];
    if (bg) {
      // Cover-fit: fill the canvas, cropping overflow, centered.
      const img = bg;
      const scale = Math.max(CONFIG.CANVAS_W / img.width, CONFIG.CANVAS_H / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, (CONFIG.CANVAS_W - w) / 2, (CONFIG.CANVAS_H - h) / 2, w, h);
      return;
    }

    const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_H);
    grad.addColorStop(0, '#221e30');
    grad.addColorStop(1, '#161320');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

    // Center divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.setLineDash([6, 10]);
    ctx.beginPath();
    ctx.moveTo(CONFIG.CANVAS_W / 2, 40);
    ctx.lineTo(CONFIG.CANVAS_W / 2, CONFIG.CANVAS_H - 40);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Outline-only tiles: the field art shows through untinted.
  drawFormation(slots, strokeColor) {
    const { ctx } = this;
    for (const slot of slots) {
      const pts = Hex.corners(slot.x, slot.y, CONFIG.HEX_SIZE - 3);
      ctx.beginPath();
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // Sprite center so the unit's ART feet (not the padded frame edge)
  // stand on its tile, slightly below the tile center.
  spriteCenterY(unit, tileY) {
    const sheet = unit.animator && unit.animator.sheet;
    const dh = sheet ? sheet.displayH : 48;
    return tileY - dh / 2 + 5 + (sheet && sheet.footPad || 0);
  }

  // Whether a unit's sprite draws mirrored. Enemies face left by
  // default; art authored facing left (sprite.faceLeft) inverts that.
  spriteFlipped(unit) {
    const anim = unit.animator && unit.animator.current;
    return (unit.team === TEAM.ENEMY) !== Sprites.facesLeft(unit.def, anim);
  }

  // Where a unit's feet sit horizontally: frame center plus the art's
  // shadow offset (mirrored for flipped sprites).
  feetX(unit, baseX) {
    const off = (unit.animator && unit.animator.sheet.shadowOffsetX) || 0;
    return baseX + (this.spriteFlipped(unit) ? -off : off);
  }

  // Soft shadow orb on the ground beneath a unit; shrinks and fades as
  // the character gains altitude (jumps).
  drawShadow(unit) {
    const { ctx } = this;
    const g = this.battle.motionGround(unit);
    const sheet = unit.animator && unit.animator.sheet;
    const size = sheet ? sheet.size() : { w: 48 };
    const s = Math.max(0.35, Math.min(1, 1 - g.height / 220));
    // Measured ground footprint (see measureContentBounds) — unique per
    // hero, because a seated chimewright and a slim moth do not stand on
    // the same amount of ground. Falls back to the old frame-width
    // estimate when the art could not be measured. Bosses keep their own
    // ceiling: their art is far larger than a hero's.
    const base = (sheet && sheet.shadowRX) || Math.min(34, size.w * 0.3);
    const rx = Math.min(unit.isBoss ? 120 : 40, base) * s;
    ctx.save();
    ctx.fillStyle = `rgba(8, 14, 8, ${0.32 * (0.55 + 0.45 * s)})`;
    ctx.beginPath();
    ctx.ellipse(this.feetX(unit, g.x), g.groundY + 8, rx, rx * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawUnit(unit) {
    const { ctx } = this;
    const { x, y } = this.battle.motionPos(unit);
    const dh = unit.animator ? unit.animator.sheet.displayH : 48;
    const yc = this.spriteCenterY(unit, y);

    if (!unit.alive) {
      // Revive targeting: fallen allies glow as valid targets.
      if (this.targetingMode === 'dead-ally' && unit.team === TEAM.PLAYER) {
        const hovered = this.hoveredUnit === unit;
        ctx.strokeStyle = hovered ? '#ffe8a8' : 'rgba(255, 232, 168, 0.5)';
        ctx.lineWidth = hovered ? 3 : 1.5;
        ctx.beginPath();
        ctx.ellipse(this.feetX(unit, x), y + 7, 28, 9, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (unit.animator && unit.animator.current === 'death') {
        // Death animation plays out and freezes on its final frame.
        this.drawShadow(unit);
        unit.animator.draw(ctx, x, yc, this.spriteFlipped(unit));
      } else {
        // Fallback for units without death art: faded grave marker.
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#888';
        ctx.fillRect(x - 6, y - 10, 12, 18);
        ctx.restore();
      }
      return;
    }

    const isActive = this.battle.activeUnit === unit;
    const flipX = this.spriteFlipped(unit);

    this.drawShadow(unit);

    // Active-turn ring stays on the ground (with the shadow) even while
    // the unit is airborne mid-attack.
    if (isActive) {
      const g = this.battle.motionGround(unit);
      ctx.strokeStyle = '#ffd76a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(this.feetX(unit, g.x), g.groundY + 7, 26, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Valid-target highlight while the player is picking a target.
    if (this.targetingMode) {
      const isValid =
        (this.targetingMode === 'enemy' && unit.team === TEAM.ENEMY) ||
        (this.targetingMode === 'ally' && unit.team === TEAM.PLAYER);
      if (isValid) {
        // Row abilities light up the hovered enemy's whole row.
        const hovered = this.hoveredUnit === unit ||
          (this.rowMode && this.hoveredUnit && unit.team === TEAM.ENEMY &&
            Math.abs(unit.slot.y - this.hoveredUnit.slot.y) < 2);
        ctx.strokeStyle = hovered ? '#ff5a5a' : 'rgba(255, 138, 138, 0.5)';
        ctx.lineWidth = hovered ? 3 : 1.5;
        ctx.beginPath();
        ctx.ellipse(this.feetX(unit, x), y + 7, 28, 9, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Blessed/Godtouched copies pulse — a soft radial aura painted
    // BEHIND the sprite (silver or gold), so the art itself stays clean.
    if (unit.blessing && typeof Blessing !== 'undefined') {
      const b = Blessing.of(unit.blessing);
      if (b) {
        const hp0 = (unit.animator && unit.animator.sheet.headPad) || 0;
        const fp0 = (unit.animator && unit.animator.sheet.footPad) || 0;
        const visH0 = Math.max(8, dh - hp0 - fp0);
        const cx = this.feetX(unit, x);
        const cy = yc - dh / 2 + hp0 + visH0 / 2;
        const pulse = 0.5 + 0.5 *
          Math.sin(performance.now() / 480 + (unit.slot ? unit.slot.index : 0));
        const r = visH0 * (0.62 + 0.06 * pulse);
        ctx.save();
        const grad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
        grad.addColorStop(0, `rgba(${b.glow}, ${0.45 + 0.30 * pulse})`);
        grad.addColorStop(0.7, `rgba(${b.glow}, ${0.18 + 0.14 * pulse})`);
        grad.addColorStop(1, `rgba(${b.glow}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        // A pulsing ground ring seals the read at sprite scale, where a
        // soft halo alone can sink into a bright background. Smaller
        // than the gold active-turn ring so the two never blur together.
        ctx.strokeStyle = `rgba(${b.glow}, ${0.45 + 0.45 * pulse})`;
        ctx.lineWidth = 1.5 + pulse;
        ctx.beginPath();
        ctx.ellipse(cx, y + 7, 21, 6.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Sprite; recently-hit units flash white along their own silhouette.
    if (unit.animator) {
      const flash = unit.hitFlash > 0 ? Math.min(1, unit.hitFlash * 5) * 0.85 : 0;
      unit.animator.draw(ctx, x, yc, flipX, flash);
    }

    // Bars sit just above the visible art (skip padded headroom).
    const headPad = (unit.animator && unit.animator.sheet.headPad) || 0;
    const visualTop = yc - dh / 2 + headPad;

    // Shield: a gold bubble around whoever is holding one, drawn over the
    // art so it reads as enclosing them. The source is mostly
    // transparent (a glossy rim and a highlight), so the hero shows
    // through at 75% opacity rather than being washed out.
    const shield = unit.shieldTotal ? unit.shieldTotal() : 0;
    if (shield > 0) {
      // Centred on the VISIBLE art, not the frame: sheets carry padding
      // above the head and below the feet, and centring on the frame put
      // the bubble low enough for the hero's head to stick out of it.
      const footPad = (unit.animator && unit.animator.sheet.footPad) || 0;
      const visH = Math.max(8, dh - headPad - footPad);
      // The bubble fills about 73% of its frame, so the frame is drawn
      // bigger than the hero for the bubble itself to enclose them.
      const breathe = 1 + Math.sin(performance.now() / 520 + unit.slot.index) * 0.03;
      this.drawEffectFrame('shield_bubble', 0, this.feetX(unit, x), visualTop + visH / 2,
        { alpha: 0.75, height: visH * 1.5 * breathe });
    }
    // Tanner's Bubble: one whole hit held off, drawn as blue glass so
    // it reads apart from the gold shield sphere.
    if ((unit.statusEffects || []).some((fx) => fx.kind === 'bubble')) {
      const footPad = (unit.animator && unit.animator.sheet.footPad) || 0;
      const visH = Math.max(8, dh - headPad - footPad);
      const cx = this.feetX(unit, x);
      const cy = visualTop + visH / 2;
      const breathe = 1 + Math.sin(performance.now() / 430 + unit.slot.index) * 0.04;
      const r = visH * 0.62 * breathe;
      const ctx2 = this.ctx;
      ctx2.save();
      const grad = ctx2.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.15, cx, cy, r);
      grad.addColorStop(0, 'rgba(210,240,255,0.35)');
      grad.addColorStop(0.72, 'rgba(94,194,240,0.10)');
      grad.addColorStop(1, 'rgba(94,194,240,0.30)');
      ctx2.fillStyle = grad;
      ctx2.beginPath();
      ctx2.arc(cx, cy, r, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.strokeStyle = 'rgba(150,220,250,0.7)';
      ctx2.lineWidth = 1.5;
      ctx2.stroke();
      // The glossy highlight that sells it as a soap bubble.
      ctx2.fillStyle = 'rgba(240,250,255,0.45)';
      ctx2.beginPath();
      ctx2.ellipse(cx - r * 0.38, cy - r * 0.42, r * 0.16, r * 0.09, -0.6, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.restore();
    }
    this.drawBars(unit, x, visualTop);

    // Charging warning: what this unit is about to unleash.
    if (unit.telegraph) {
      ctx.save();
      ctx.font = this.uiFont(10, 'bold ');
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 4;
      const pulse = 0.55 + 0.45 * Math.abs(Math.sin(Date.now() / 260));
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#ff9a5a';
      ctx.fillText(`⚠ ${unit.telegraph.def.name}`, x, visualTop - 34);
      ctx.restore();
    }

    // Elemental matchup while the player is picking a target: the
    // ±15/25% swing was invisible until the damage had already landed.
    if (this.targetingMode && this.targetingSource &&
        unit.team !== this.targetingSource.team && unit.alive) {
      const m = Elements.mult(this.targetingSource.element, unit.element);
      if (m !== 1) {
        ctx.save();
        ctx.font = this.uiFont(10, 'bold ');
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 4;
        ctx.fillStyle = m > 1 ? '#ffd76a' : '#8ecbff';
        ctx.fillText(m > 1 ? '▲ WEAK' : '▼ RESIST', x, visualTop - 22);
        ctx.restore();
      }
    }

    // Positional bonus pip when active.
    if (unit.positionalActive()) {
      ctx.fillStyle = '#ffd76a';
      ctx.font = this.uiFont(10);
      ctx.textAlign = 'center';
      ctx.fillText('★', x + CONFIG.BAR_W / 2 + 8, visualTop - 10);
    }
  }

  // The distinct status icons a unit is currently showing, in the
  // order the effects landed. Stat modifiers split by buff/debuff;
  // shields and mirrors arrive as one icon with a number beside it.
  statusIcons(unit) {
    const seen = new Map();
    for (const fx of unit.statusEffects || []) {
      // Shields are a pool, not a flag: shown once below with what is
      // LEFT of them, not one icon per stack.
      if (fx.kind === 'shield') continue;
      let key;
      if (fx.kind === 'dot') key = fx.flavor === 'burn' ? 'burn' : 'dot';
      else if (fx.kind === 'hot' || fx.kind === 'bubble') key = fx.kind;
      else if (fx.stat === 'damageTaken') key = fx.kind === 'buff' ? 'ward' : 'vulnerable';
      else key = fx.stat;
      const def = StatusIcons.DEFS[key];
      if (!def) continue;
      const variant = (fx.kind === 'buff' || fx.kind === 'hot') ? 'buff' : 'debuff';
      const id = def.stat ? `${key}:${variant}` : key;
      const prev = seen.get(id);
      if (prev) { prev.count++; continue; }
      seen.set(id, { key, variant, count: 1, label: '' });
    }
    const shield = unit.shieldTotal ? unit.shieldTotal() : 0;
    if (shield > 0) {
      const shown = shield >= 1000 ? `${(shield / 1000).toFixed(1)}k` : String(shield);
      seen.set('shield', { key: 'shield', variant: 'buff', count: 1, label: shown });
    }
    // Crystal mirrors are a resource, not a status, but they belong on
    // the plate for the same reason: they change what the hit does.
    if (unit.mirrorMax > 0 && unit.mirrors > 0) {
      seen.set('mirrors', { key: 'mirrors', variant: 'buff', count: 1,
        label: String(unit.mirrors) });
    }
    return [...seen.values()];
  }

  statusRowH() {
    return Math.round(11 * Math.min(1.5, this.uiScale())) + 2;
  }

  // The icon row, laid out centered above the health bar.
  drawStatusIcons(unit, x, top, w) {
    const icons = this.statusIcons(unit);
    if (icons.length === 0) return false;
    const { ctx } = this;
    const s = this.statusRowH() - 2;
    ctx.save();
    ctx.font = this.uiFont(7, 'bold ');
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const widths = icons.map((ic) =>
      s + 1 + (ic.label ? ctx.measureText(ic.label).width + 2 : 0));
    const totalW = widths.reduce((a, b) => a + b, 0) - 1;
    let cx = x - Math.min(totalW, w * 1.8) / 2;
    for (let i = 0; i < icons.length; i++) {
      const ic = icons[i];
      const cv = StatusIcons.canvas(ic.key, ic.variant, s);
      if (cv) ctx.drawImage(cv, Math.round(cx), Math.round(top));
      // Stack count, tucked into the plate corner.
      if (ic.count > 1) {
        ctx.shadowColor = 'rgba(0,0,0,0.95)';
        ctx.shadowBlur = 2;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(String(ic.count), cx + s - 4, top + s - 1);
        ctx.shadowBlur = 0;
      }
      // Shield / mirror amounts read beside their icon.
      if (ic.label) {
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 3;
        ctx.fillStyle = '#7ae8d8';
        ctx.fillText(ic.label, cx + s + 2, top + s - 2);
        ctx.shadowBlur = 0;
      }
      cx += widths[i];
    }
    ctx.restore();
    return true;
  }

  // spriteTop: the y of the unit sprite's top edge; bars stack above it.
  drawBars(unit, x, spriteTop) {
    const { ctx } = this;
    // Boss bars span the whole formation the boss occupies.
    const w = unit.isBoss ? CONFIG.BAR_W * 3 : CONFIG.BAR_W;
    const h = Math.round(CONFIG.BAR_H * this.uiScale());
    const top = spriteTop - 16;

    // Status icons: what's actually on this unit right now (stuns,
    // poisons, buffs, wards, Aniani's mirrors), drawn as pictograph
    // plates in a row directly above the health bar. The name slides up
    // to make room whenever the row is showing.
    const rowH = this.statusRowH();
    const hasIcons = this.drawStatusIcons(unit, x, top - rowH, w);
    const nameY = hasIcons ? top - rowH - 4 : top - 5;

    // Health bar
    const hpFrac = unit.hp / unit.maxHp;
    ctx.fillStyle = '#0e0c14';
    ctx.fillRect(x - w / 2 - 1, top - 1, w + 2, h + 2);
    ctx.fillStyle = '#3a3450';
    ctx.fillRect(x - w / 2, top, w, h);
    ctx.fillStyle = hpFrac > 0.5 ? '#4ad46a' : hpFrac > 0.25 ? '#e8c84a' : '#e85a4a';
    ctx.fillRect(x - w / 2, top, w * hpFrac, h);

    // Turn meter bar.
    //
    // Meters overfill past 100% so that turn order stays concrete when a
    // dozen units are all "ready" at once, and the bar has to show that
    // or the player sees a wall of identical full bars and cannot tell
    // who moves. Three states:
    //
    //   under 100%   blue, filling
    //   100%+        full gold bar, with the overflow drawn back over it
    //                in darker orange as a second lap
    //   next to act  the same two, in red — the one unit who moves next
    //
    // Nobody acts below 100%, so the blue-to-gold change is also the
    // line between "waiting" and "queued".
    const tmTop = top + h + 2;
    const tmH = h - 1;
    const raw = unit.turnMeter / CONFIG.TURN_METER_MAX;
    const tmFrac = Math.min(1, raw);
    const overflow = Math.min(1, Math.max(0, raw - 1));
    const isNext = this.nextUp === unit;
    ctx.fillStyle = '#0e0c14';
    ctx.fillRect(x - w / 2 - 1, tmTop - 1, w + 2, tmH + 2);
    ctx.fillStyle = '#3a3450';
    ctx.fillRect(x - w / 2, tmTop, w, tmH);
    ctx.fillStyle = isNext ? '#e8443a' : (tmFrac >= 1 ? '#ffd76a' : '#8ecbff');
    ctx.fillRect(x - w / 2, tmTop, w * tmFrac, tmH);
    // The overflow lap. A unit at 180% shows a bar 80% covered in the
    // darker shade, so depth of queue is readable at a glance.
    if (overflow > 0) {
      ctx.fillStyle = isNext ? '#8f2018' : '#c8701a';
      ctx.fillRect(x - w / 2, tmTop, w * overflow, tmH);
    }

    // Name (shadowed for readability over bright field art)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 3;
    ctx.fillStyle = unit.team === TEAM.PLAYER ? '#bcd6ff' : '#ffc4b8';
    ctx.font = this.uiFont(10);
    ctx.textAlign = 'center';
    // Enlarged plates do not fit side by side, and the sprite already
    // says which hero it is. Below full size the plate carries element
    // and level; the name is spent on whoever is acting or hovered.
    const roomy = this.uiScale() < 1.25;
    const named = roomy || unit === this.hoveredUnit ||
      (this.battle && unit === this.battle.activeUnit);
    const label = named
      ? `Lv${unit.level} ${unit.name}`
      : `Lv${unit.level}`;
    ctx.fillText(label, x, nameY);
    // Element mark: a dot in the element's color where the emoji badge
    // used to sit — the canvas draws its own icons.
    const elInfo = unit.element && Elements.info(unit.element);
    if (elInfo) {
      const r = 2.4 * Math.min(1.6, this.uiScale());
      ctx.beginPath();
      ctx.fillStyle = elInfo.color;
      ctx.arc(x - ctx.measureText(label).width / 2 - r - 4, nameY - 3.5, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawFloatingTexts() {
    const { ctx } = this;
    for (const ft of this.battle.floatingTexts) {
      const rise = ft.age * 30;
      const alpha = ft.age < 0.8 ? 1 : 1 - (ft.age - 0.8) / 0.3;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 3;
      ctx.fillStyle = ft.color;
      ctx.font = this.uiFont(ft.big ? 20 : 15, 'bold ');
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y - rise);
      ctx.restore();
    }
  }
}
