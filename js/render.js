// Canvas rendering: hex grids, units, health/turn-meter bars, floating text.

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.battle = null;        // bound via setBattle for each new battle
    this.hoveredUnit = null;   // set by UI for target highlighting
    this.targetingMode = null; // 'enemy' | 'ally' | null
    this.rowMode = false;      // highlight the hovered enemy's whole row
    // Battle backdrops: all loaded up front; each new battle rotates to
    // the next (gradient fallback until loaded / when missing).
    this.bgImages = (CONFIG.BATTLE_BGS || []).map(() => null);
    (CONFIG.BATTLE_BGS || []).forEach((src, i) => {
      Sprites.loadImage(src).then((img) => { this.bgImages[i] = img; });
    });
    this.bgIndex = 0;
  }

  setBattle(battle) {
    this.battle = battle;
    this.hoveredUnit = null;
    this.targetingMode = null;
    this.rowMode = false;
    // Rotate the arena for each new battle.
    if (this.bgImages.length > 0) {
      Renderer.bgRotation = ((Renderer.bgRotation ?? -1) + 1) % this.bgImages.length;
      this.bgIndex = Renderer.bgRotation;
    }
  }

  draw() {
    const { ctx } = this;
    if (!this.battle) return;
    // Backing store may be larger than the logical 960x540 (hi-DPI);
    // draw in logical coordinates on top of a scale transform.
    const q = this.canvas.width / CONFIG.CANVAS_W;
    ctx.setTransform(q, 0, 0, q, 0, 0);
    ctx.clearRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

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
    const bg = this.bgImages[this.bgIndex];
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

  // Where a unit's feet sit horizontally: frame center plus the art's
  // shadow offset (mirrored for flipped enemy sprites).
  feetX(unit, baseX) {
    const off = (unit.animator && unit.animator.sheet.shadowOffsetX) || 0;
    return baseX + (unit.team === TEAM.ENEMY ? -off : off);
  }

  // Soft shadow orb on the ground beneath a unit; shrinks and fades as
  // the character gains altitude (jumps).
  drawShadow(unit) {
    const { ctx } = this;
    const g = this.battle.motionGround(unit);
    const size = unit.animator ? unit.animator.sheet.size() : { w: 48 };
    const s = Math.max(0.35, Math.min(1, 1 - g.height / 220));
    const rx = Math.min(unit.isBoss ? 120 : 34, size.w * 0.3) * s;
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
        unit.animator.draw(ctx, x, yc, unit.team === TEAM.ENEMY);
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
    const flipX = unit.team === TEAM.ENEMY; // enemies face left

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

    // Sprite; recently-hit units flash white along their own silhouette.
    if (unit.animator) {
      const flash = unit.hitFlash > 0 ? Math.min(1, unit.hitFlash * 5) * 0.85 : 0;
      unit.animator.draw(ctx, x, yc, flipX, flash);
    }

    // Bars sit just above the visible art (skip padded headroom).
    const headPad = (unit.animator && unit.animator.sheet.headPad) || 0;
    const visualTop = yc - dh / 2 + headPad;
    this.drawBars(unit, x, visualTop);

    // Positional bonus pip when active.
    if (unit.positionalActive()) {
      ctx.fillStyle = '#ffd76a';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('★', x + CONFIG.BAR_W / 2 + 8, visualTop - 10);
    }
  }

  // spriteTop: the y of the unit sprite's top edge; bars stack above it.
  drawBars(unit, x, spriteTop) {
    const { ctx } = this;
    // Boss bars span the whole formation the boss occupies.
    const w = unit.isBoss ? CONFIG.BAR_W * 3 : CONFIG.BAR_W;
    const h = CONFIG.BAR_H;
    const top = spriteTop - 16;

    // Health bar
    const hpFrac = unit.hp / unit.maxHp;
    ctx.fillStyle = '#0e0c14';
    ctx.fillRect(x - w / 2 - 1, top - 1, w + 2, h + 2);
    ctx.fillStyle = '#3a3450';
    ctx.fillRect(x - w / 2, top, w, h);
    ctx.fillStyle = hpFrac > 0.5 ? '#4ad46a' : hpFrac > 0.25 ? '#e8c84a' : '#e85a4a';
    ctx.fillRect(x - w / 2, top, w * hpFrac, h);

    // Turn meter bar
    const tmTop = top + h + 2;
    const tmFrac = Math.min(1, unit.turnMeter / CONFIG.TURN_METER_MAX);
    ctx.fillStyle = '#0e0c14';
    ctx.fillRect(x - w / 2 - 1, tmTop - 1, w + 2, h - 1 + 2);
    ctx.fillStyle = '#3a3450';
    ctx.fillRect(x - w / 2, tmTop, w, h - 1);
    ctx.fillStyle = tmFrac >= 1 ? '#ffd76a' : '#8ecbff';
    ctx.fillRect(x - w / 2, tmTop, w * tmFrac, h - 1);

    // Name (shadowed for readability over bright field art)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 3;
    ctx.fillStyle = unit.team === TEAM.PLAYER ? '#bcd6ff' : '#ffc4b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Lv${unit.level} ${unit.name}`, x, top - 5);
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
      ctx.font = ft.big ? 'bold 20px monospace' : 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y - rise);
      ctx.restore();
    }
  }
}
