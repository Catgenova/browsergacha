// Team builder: place owned heroes onto the 7-slot hex formation.
//
// Interaction model (click-based):
//   - Click a roster card to select that hero, then click a hex to place it.
//   - Click a placed hero to select it, then click another hex to move/swap.
//   - "Remove from team" in the details panel clears the selected hero's slot.
// While a hero is selected, hexes matching its positional bonus glow gold.

class TeamScreen {
  constructor(app) {
    this.app = app;
    this.el = document.getElementById('screen-team');
    this.canvas = document.getElementById('team-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.logicalW = 560;
    this.logicalH = 400;
    app.hiDpiCanvases.push({ el: this.canvas, w: this.logicalW, h: this.logicalH });
    this.rosterEl = document.getElementById('roster-grid');
    this.detailsEl = document.getElementById('hero-details');
    this.fightBtn = document.getElementById('fight-btn');
    this.clearBtn = document.getElementById('clear-team-btn');
    this.teamCountEl = document.getElementById('team-count');

    // Formation geometry (player side only, centered in the canvas).
    this.slots = Hex.buildFormation(
      TEAM.PLAYER, this.logicalW / 2, this.logicalH / 2 - 10, 56
    );

    // Selection: { heroId, from: 'roster' | slotIndex }
    this.selection = null;
    this.hoveredSlot = null;
    this.animators = new Map(); // heroId -> AnimationPlayer (idle preview)

    this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.onCanvasMove(e));
    this.fightBtn.addEventListener('click', () => {
      if (GameState.teamSize() === 0) return;
      this.app.showScreen('battle');
    });
    this.clearBtn.addEventListener('click', () => {
      GameState.clearTeam();
      this.selection = null;
      this.refresh();
    });
  }

  async enter() {
    this.selection = null;
    await this.ensureAnimators();
    this.refresh();
  }

  exit() {}

  // Build idle-animation players for every owned hero (placed previews).
  async ensureAnimators() {
    for (const heroId of GameState.ownedHeroIds()) {
      if (this.animators.has(heroId)) continue;
      const def = HEROES[heroId];
      if (!def) continue;
      const sheet = await Sprites.getSheet(def);
      const player = new AnimationPlayer(sheet);
      player.play('idle');
      player.elapsed = Math.random() * 0.5;
      this.animators.set(heroId, player);
    }
  }

  refresh() {
    this.buildRoster();
    this.updateDetails();
    this.updateButtons();
  }

  updateButtons() {
    const size = GameState.teamSize();
    this.teamCountEl.textContent = `${size}/7 heroes placed`;
    this.fightBtn.disabled = size === 0;
  }

  // ---- Roster panel ------------------------------------------------------

  buildRoster() {
    this.rosterEl.innerHTML = '';
    const team = GameState.getTeam();
    const inTeam = new Set(Object.values(team));

    const ids = GameState.ownedHeroIds()
      .filter((id) => HEROES[id])
      .sort((a, b) => HEROES[b].rarity - HEROES[a].rarity || a.localeCompare(b));

    for (const heroId of ids) {
      const def = HEROES[heroId];
      const card = document.createElement('div');
      card.className = 'roster-card' + (this.selection && this.selection.heroId === heroId ? ' selected' : '');
      card.dataset.heroId = heroId;

      const portrait = document.createElement('canvas');
      portrait.width = 64;
      portrait.height = 64;
      portrait.className = 'portrait';
      Sprites.drawPortrait(portrait, def);

      const name = document.createElement('div');
      name.className = 'card-name';
      name.textContent = def.name;

      const stars = document.createElement('div');
      stars.className = `card-stars rarity-${def.rarity}`;
      stars.textContent = '★'.repeat(def.rarity);

      card.append(portrait, name, stars);

      if (inTeam.has(heroId)) {
        const badge = document.createElement('div');
        badge.className = 'card-badge';
        badge.textContent = 'IN TEAM';
        card.appendChild(badge);
      }
      const copies = GameState.copiesOf(heroId);
      if (copies > 1) {
        const dupes = document.createElement('div');
        dupes.className = 'card-copies';
        dupes.textContent = `×${copies}`;
        card.appendChild(dupes);
      }

      card.addEventListener('click', () => this.selectHero(heroId, 'roster'));
      this.rosterEl.appendChild(card);
    }
  }

  // ---- Selection & placement ---------------------------------------------

  selectHero(heroId, from) {
    if (this.selection && this.selection.heroId === heroId) {
      this.selection = null; // toggle off
    } else {
      this.selection = { heroId, from };
    }
    this.refresh();
  }

  slotAt(px, py) {
    let best = null;
    let bestDist = Infinity;
    for (const slot of this.slots) {
      const d = Math.hypot(px - slot.x, py - slot.y);
      if (d < bestDist) { bestDist = d; best = slot; }
    }
    return bestDist <= 52 ? best : null;
  }

  onCanvasClick(e) {
    const { x, y } = this.canvasPoint(e);
    const slot = this.slotAt(x, y);
    if (!slot) return;

    const team = GameState.getTeam();
    const occupant = team[slot.index];

    if (this.selection) {
      const sel = this.selection;
      if (sel.from === 'roster') {
        GameState.setTeamSlot(slot.index, sel.heroId); // replaces any occupant
      } else if (typeof sel.from === 'number') {
        GameState.swapTeamSlots(sel.from, slot.index); // move or swap
      }
      this.selection = null;
      this.refresh();
    } else if (occupant) {
      this.selectHero(occupant, slot.index);
    }
  }

  onCanvasMove(e) {
    const { x, y } = this.canvasPoint(e);
    this.hoveredSlot = this.slotAt(x, y);
    this.canvas.style.cursor = this.hoveredSlot ? 'pointer' : 'default';
  }

  canvasPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.logicalW / rect.width),
      y: (e.clientY - rect.top) * (this.logicalH / rect.height),
    };
  }

  // ---- Details panel -----------------------------------------------------

  updateDetails() {
    if (!this.selection) {
      this.detailsEl.innerHTML =
        '<div class="details-empty">Select a hero to see details.<br><br>' +
        'Click a roster hero, then a hex to place them.<br>' +
        'Click a placed hero, then another hex to move or swap.</div>';
      return;
    }

    const def = HEROES[this.selection.heroId];
    const slotIndex = GameState.teamSlotOf(def.id);
    const placedSlot = slotIndex !== null ? this.slots[slotIndex] : null;
    const bonusLive = placedSlot && placedSlot.position === def.positional.position;

    const abilitiesHtml = def.abilities.map((a) => {
      const cd = a.cooldown > 0 ? `CD ${a.cooldown}` : 'No CD';
      return `<div class="detail-ability"><b>${a.name}</b> <span class="cd">${cd}</span><br>${a.description}</div>`;
    }).join('');

    this.detailsEl.innerHTML = `
      <div class="detail-name rarity-${def.rarity}">${def.name} <span class="detail-title">${def.title || ''}</span></div>
      <div class="card-stars rarity-${def.rarity}">${'★'.repeat(def.rarity)}</div>
      <div class="detail-stats">
        HP ${def.stats.hp} · ATK ${def.stats.atk} · DEF ${def.stats.def} · SPD ${def.stats.speed}
      </div>
      <div class="detail-section">Abilities</div>
      ${abilitiesHtml}
      <div class="detail-section">Passive</div>
      <div class="detail-ability"><b>${def.passive.name}</b><br>${def.passive.description}</div>
      <div class="detail-section">Positional bonus</div>
      <div class="detail-ability ${bonusLive ? 'bonus-live' : ''}">
        ${def.positional.description}
        ${bonusLive ? '<br><b>★ Active in current slot</b>' : ''}
      </div>
      ${slotIndex !== null ? '<button id="remove-hero-btn" class="panel-btn danger">Remove from team</button>' : ''}
    `;

    const removeBtn = document.getElementById('remove-hero-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        GameState.clearTeamSlot(slotIndex);
        this.selection = null;
        this.refresh();
      });
    }
  }

  // ---- Canvas rendering --------------------------------------------------

  update(dt) {
    for (const player of this.animators.values()) player.update(dt);
  }

  draw() {
    const { ctx } = this;
    const q = this.canvas.width / this.logicalW;
    ctx.setTransform(q, 0, 0, q, 0, 0);
    ctx.clearRect(0, 0, this.logicalW, this.logicalH);

    const grad = ctx.createLinearGradient(0, 0, 0, this.logicalH);
    grad.addColorStop(0, '#221e30');
    grad.addColorStop(1, '#161320');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.logicalW, this.logicalH);

    const team = GameState.getTeam();
    const selDef = this.selection ? HEROES[this.selection.heroId] : null;

    for (const slot of this.slots) {
      const pts = Hex.corners(slot.x, slot.y, 53);
      ctx.beginPath();
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();

      const bonusHex = selDef && slot.position === selDef.positional.position;
      ctx.fillStyle = bonusHex ? 'rgba(255, 215, 106, 0.12)' : '#22293d';
      ctx.fill();
      ctx.strokeStyle =
        this.hoveredSlot === slot ? '#8ecbff' : bonusHex ? '#ffd76a' : '#3a4a6a';
      ctx.lineWidth = this.hoveredSlot === slot || bonusHex ? 2 : 1.5;
      ctx.stroke();

      // Position category label at the hex bottom.
      ctx.fillStyle = 'rgba(232, 228, 216, 0.35)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(slot.position.toUpperCase(), slot.x, slot.y + 40);

      // Placed hero.
      const heroId = team[slot.index];
      if (heroId && HEROES[heroId]) {
        const def = HEROES[heroId];
        const animator = this.animators.get(heroId);
        if (animator) animator.draw(ctx, slot.x, slot.y - 4, false);

        ctx.fillStyle = '#bcd6ff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(def.name, slot.x, slot.y - 32);

        // Gold ring when this hero's positional bonus is live here.
        if (def.positional.position === slot.position) {
          ctx.fillStyle = '#ffd76a';
          ctx.fillText('★', slot.x + 26, slot.y - 30);
        }

        // Selection ring.
        if (this.selection && this.selection.heroId === heroId) {
          ctx.strokeStyle = '#ffd76a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(slot.x, slot.y + 22, 26, 10, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // Hint when carrying a roster hero.
    if (this.selection) {
      ctx.fillStyle = '#8ecbff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        this.selection.from === 'roster'
          ? `Placing ${HEROES[this.selection.heroId].name} — click a hex`
          : `Moving ${HEROES[this.selection.heroId].name} — click a destination hex`,
        this.canvas.width / 2, 24
      );
    }
  }
}
