// Canvas rendering: hex grids, units, health/turn-meter bars, floating text.

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.battle = null;        // bound via setBattle for each new battle
    this.hoveredUnit = null;   // set by UI for target highlighting
    this.targetingMode = null; // 'enemy' | 'ally' | null
    this.rowMode = false;      // highlight the hovered enemy's whole row
  }

  setBattle(battle) {
    this.battle = battle;
    this.hoveredUnit = null;
    this.targetingMode = null;
    this.rowMode = false;
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
    this.drawFormation(this.battle.playerSlots, '#3a4a6a', '#22293d');
    this.drawFormation(this.battle.enemySlots, '#6a3a3a', '#3d2222');

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

  drawFormation(slots, strokeColor, fillColor) {
    const { ctx } = this;
    for (const slot of slots) {
      const pts = Hex.corners(slot.x, slot.y, CONFIG.HEX_SIZE - 3);
      ctx.beginPath();
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // Sprite center so the unit's feet stand on its tile (slightly below
  // the tile center, body rising above the grid).
  spriteCenterY(unit, tileY) {
    const dh = unit.animator ? unit.animator.sheet.displayH : 48;
    return tileY - dh / 2 + 14;
  }

  drawUnit(unit) {
    const { ctx } = this;
    const { x, y } = this.battle.motionPos(unit);
    const dh = unit.animator ? unit.animator.sheet.displayH : 48;
    const yc = this.spriteCenterY(unit, y);

    if (!unit.alive) {
      if (unit.animator && unit.animator.current === 'death') {
        // Death animation plays out and freezes on its final frame.
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

    // Active-turn ring at the unit's feet.
    if (isActive) {
      ctx.strokeStyle = '#ffd76a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y + 16, 26, 8, 0, 0, Math.PI * 2);
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
        ctx.ellipse(x, y + 16, 28, 9, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Sprite; recently-hit units flash white along their own silhouette.
    if (unit.animator) {
      const flash = unit.hitFlash > 0 ? Math.min(1, unit.hitFlash * 5) * 0.85 : 0;
      unit.animator.draw(ctx, x, yc, flipX, flash);
    }

    this.drawBars(unit, x, yc - dh / 2);

    // Positional bonus pip when active.
    if (unit.positionalActive()) {
      ctx.fillStyle = '#ffd76a';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('★', x + CONFIG.BAR_W / 2 + 8, yc - dh / 2 - 10);
    }
  }

  // spriteTop: the y of the unit sprite's top edge; bars stack above it.
  drawBars(unit, x, spriteTop) {
    const { ctx } = this;
    const w = CONFIG.BAR_W;
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

    // Name
    ctx.fillStyle = unit.team === TEAM.PLAYER ? '#bcd6ff' : '#ffc4b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(unit.name, x, top - 5);
  }

  drawFloatingTexts() {
    const { ctx } = this;
    for (const ft of this.battle.floatingTexts) {
      const rise = ft.age * 30;
      const alpha = ft.age < 0.8 ? 1 : 1 - (ft.age - 0.8) / 0.3;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = ft.color;
      ctx.font = ft.big ? 'bold 20px monospace' : 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y - rise);
      ctx.restore();
    }
  }
}
