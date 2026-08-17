// Canvas rendering: hex grids, units, health/turn-meter bars, floating text.

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.battle = null;        // bound via setBattle for each new battle
    this.hoveredUnit = null;   // set by UI for target highlighting
    this.targetingMode = null; // 'enemy' | 'ally' | null
  }

  setBattle(battle) {
    this.battle = battle;
    this.hoveredUnit = null;
    this.targetingMode = null;
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

    // Draw units back-to-front by y so overlaps look right.
    const units = this.battle.units.slice().sort((a, b) => a.slot.y - b.slot.y);
    for (const unit of units) this.drawUnit(unit);

    this.drawFloatingTexts();
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

  drawUnit(unit) {
    const { ctx } = this;
    const { x, y } = unit.slot;

    if (!unit.alive) {
      // Fallen units: faded grave marker.
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#888';
      ctx.fillRect(x - 6, y - 10, 12, 18);
      ctx.restore();
      return;
    }

    const isActive = this.battle.activeUnit === unit;
    const flipX = unit.team === TEAM.ENEMY; // enemies face left

    // Active-turn ring under the unit.
    if (isActive) {
      ctx.strokeStyle = '#ffd76a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y + 22, 26, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Valid-target highlight while the player is picking a target.
    if (this.targetingMode) {
      const isValid =
        (this.targetingMode === 'enemy' && unit.team === TEAM.ENEMY) ||
        (this.targetingMode === 'ally' && unit.team === TEAM.PLAYER);
      if (isValid) {
        const hovered = this.hoveredUnit === unit;
        ctx.strokeStyle = hovered ? '#ff5a5a' : 'rgba(255, 138, 138, 0.5)';
        ctx.lineWidth = hovered ? 3 : 1.5;
        ctx.beginPath();
        ctx.ellipse(x, y + 22, 28, 11, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Sprite (with white flash when recently hit).
    if (unit.animator) {
      unit.animator.draw(ctx, x, y, flipX);
      if (unit.hitFlash > 0) {
        // Simple flash overlay box; per-sprite compositing can come later.
        const size = unit.animator.size();
        ctx.save();
        ctx.globalAlpha = Math.min(1, unit.hitFlash * 5) * 0.35;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - size.w / 2, y - size.h / 2, size.w, size.h);
        ctx.restore();
      }
    }

    this.drawBars(unit);

    // Positional bonus pip when active.
    if (unit.positionalActive()) {
      const dh = unit.animator ? unit.animator.sheet.displayH : 48;
      ctx.fillStyle = '#ffd76a';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('★', x + CONFIG.BAR_W / 2 + 8, y - dh / 2 - 10);
    }
  }

  drawBars(unit) {
    const { ctx } = this;
    const { x, y } = unit.slot;
    const w = CONFIG.BAR_W;
    const h = CONFIG.BAR_H;
    const dh = unit.animator ? unit.animator.sheet.displayH : 48;
    const top = y - dh / 2 - 16;

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
