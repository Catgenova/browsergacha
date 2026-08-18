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
    // Hunt picker: location (background), stage (enemy levels), repeat.
    this.locationSel = document.getElementById('location-select');
    this.stageSel = document.getElementById('stage-select');
    this.repeatSel = document.getElementById('repeat-select');
    this.locationSel.innerHTML = CONFIG.LOCATION_NAMES
      .map((n, i) => `<option value="${i}">${n}</option>`).join('');
    this.stageSel.innerHTML = Array.from({ length: 20 }, (_, i) =>
      `<option value="${i + 1}">Stage ${i + 1} (Lv ${(i + 1) * 5})</option>`).join('');
    const ws = GameState.waveSettings;
    this.locationSel.value = String(ws.location);
    this.stageSel.value = String(ws.stage);
    this.repeatSel.value = String(ws.repeat);
    const saveWave = () => GameState.setWaveSettings({
      location: Number(this.locationSel.value),
      stage: Number(this.stageSel.value),
      repeat: this.repeatSel.value === 'inf' ? 'inf' : Number(this.repeatSel.value),
    });
    [this.locationSel, this.stageSel, this.repeatSel].forEach((sel) =>
      sel.addEventListener('change', saveWave));

    this.fightBtn.addEventListener('click', () => {
      if (GameState.teamSize() === 0) return;
      this.app.screens.battle.requestBattle('wave');
      this.app.showScreen('battle');
    });
    // Boss picker: stage (gated by clears) and repeat (cleared stages only).
    this.bossBtn = document.getElementById('boss-btn');
    this.bossStageSel = document.getElementById('boss-stage-select');
    this.bossRepeatSel = document.getElementById('boss-repeat-select');
    this.bossRepeatSel.value = String(GameState.bossSettings.repeat);
    const saveBoss = () => GameState.setBossSettings({
      stage: Number(this.bossStageSel.value),
      repeat: this.bossRepeatSel.value === 'inf' ? 'inf' : Number(this.bossRepeatSel.value),
    });
    this.bossStageSel.addEventListener('change', () => { saveBoss(); this.updateButtons(); });
    this.bossRepeatSel.addEventListener('change', saveBoss);
    this.bossBtn.addEventListener('click', () => {
      if (GameState.teamSize() === 0) return;
      this.app.screens.battle.requestBattle('boss');
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
    this.bossBtn.disabled = size === 0;

    // Boss stage list: cleared stages ✓ (repeatable), the next stage
    // open, everything past it locked.
    const cleared = GameState.bossStageCleared(BOSSES.dragon.id);
    const maxPick = Math.min(Progression.BOSS_MAX_STAGE, cleared + 1);
    const saved = Math.min(GameState.bossSettings.stage, maxPick);
    this.bossStageSel.innerHTML = Array.from(
      { length: Progression.BOSS_MAX_STAGE }, (_, i) => {
        const s = i + 1;
        const mark = s <= cleared ? ' ✓' : s === maxPick ? '' : ' 🔒';
        return `<option value="${s}" ${s > maxPick ? 'disabled' : ''}>` +
          `Stage ${s} (Lv ${Progression.bossLevel(s)})${mark}</option>`;
      }).join('');
    this.bossStageSel.value = String(saved);
    // Uncleared stages can't be repeated: lock the repeat picker at ×1.
    const uncleared = saved > cleared;
    this.bossRepeatSel.disabled = uncleared;
    this.bossRepeatSel.value = uncleared ? '1' : String(GameState.bossSettings.repeat);
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
      name.textContent = `${Elements.badge(def.element)} ${def.name}`.trim();

      const progress = GameState.progressOf(heroId);
      const stars = document.createElement('div');
      stars.className = `card-stars rarity-${def.rarity}`;
      stars.textContent = progress.stars <= 5
        ? '★'.repeat(progress.stars)
        : `${progress.stars}★`;

      const level = document.createElement('div');
      level.className = 'card-level';
      const capped = progress.level >= Progression.maxLevel(progress.stars);
      level.textContent = `Lv ${progress.level}${capped ? ' (MAX)' : ''}`;
      if (capped) level.classList.add('card-level-max');

      card.append(portrait, name, stars, level);

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
      const icon = a.icon
        ? `<img class="detail-icon" src="${Sprites.assetUrl(a.icon)}" alt="">`
        : '';
      return `<div class="detail-ability">${icon}<b>${a.name}</b> <span class="cd">${cd}</span><br>${a.description}</div>`;
    }).join('');

    // Progression: scaled stats (gear included), level/XP bar, star-up.
    const progress = GameState.progressOf(def.id);
    const equipped = GameState.equippedPieces(def.id);
    const stats = Gear.applyToStats(
      Progression.scaledStats(def, progress.level, progress.stars), equipped);
    const cap = Progression.maxLevel(progress.stars);
    const atCap = progress.level >= cap;
    const xpNeed = atCap ? 0 : Progression.xpToNext(progress.level);
    const xpPct = atCap ? 100 : Math.min(100, Math.round((progress.xp / xpNeed) * 100));
    const starsText = progress.stars <= 5 ? '★'.repeat(progress.stars) : `${progress.stars}★`;

    // Gear: one row per slot with an equip picker, plus a focused-piece
    // panel (level/polish + enchant) and set bonuses.
    const equipment = GameState.equipmentOf(def.id);
    if (!this.gearFocus || !equipment[this.gearFocus]) {
      this.gearFocus = Gear.SLOTS.find((s) => equipment[s]) || null;
    }
    const gearRows = Gear.SLOTS.map((slot) => {
      const uid = equipment[slot];
      const piece = uid ? GameState.gearById(uid) : null;
      const options = [`<option value="">— empty —</option>`];
      if (piece) {
        options.push(`<option value="${piece.uid}" selected>${Gear.describe(piece)}</option>`);
      }
      for (const p of GameState.unequippedGear(slot)) {
        options.push(`<option value="${p.uid}">${Gear.describe(p)}</option>`);
      }
      const iconSrc = piece ? Gear.icon(piece) : null;
      const iconHtml = iconSrc
        ? `<img class="detail-icon" src="${Sprites.assetUrl(iconSrc)}" alt="">`
        : '<span class="gear-slot-empty"></span>';
      const focused = slot === this.gearFocus ? ' gear-row-focused' : '';
      return `
        <div class="gear-row${focused}" data-slot="${slot}">
          ${iconHtml}<span class="gear-slot-name">${Gear.SLOT_LABELS[slot]}</span>
          <select class="gear-select" data-slot="${slot}">${options.join('')}</select>
        </div>`;
    }).join('');

    // Focused piece: full readout with upgrade buttons.
    let gearDetailHtml = '';
    const focusUid = this.gearFocus ? equipment[this.gearFocus] : null;
    const focusPiece = focusUid ? GameState.gearById(focusUid) : null;
    if (focusPiece) {
      const rar = Gear.RARITIES[focusPiece.rarity];
      const base = Gear.baseStat(focusPiece);
      const capLevel = Gear.maxLevel(focusPiece);
      const atMax = focusPiece.level >= capLevel;
      const polishCost = atMax ? 0 : Gear.polishCost(focusPiece.level);
      const atMaxPlus = focusPiece.plus >= Gear.MAX_PLUS;
      const enchCost = atMaxPlus ? 0 : Gear.arcanaCost(focusPiece.plus);
      const subsHtml = focusPiece.subs.length
        ? focusPiece.subs.map((s) => `<div class="set-bonus">${Gear.subLabel(s)}</div>`).join('')
        : '<div class="set-bonus">No substats yet</div>';
      gearDetailHtml = `
        <div class="detail-ability gear-detail">
          <b style="color:${rar.color}">${Gear.pieceName(focusPiece)}</b>
          <span class="cd">Lv ${focusPiece.level}/${capLevel} · ${Gear.statText(base.stat, base.value)}</span>
          ${subsHtml}
          <div class="set-bonus">Upgrade and salvage at the Blacksmith</div>
        </div>`;
    }

    const { setCounts } = Gear.aggregate(equipped);
    const setBonusHtml = Object.values(Gear.SETS).map((set) => {
      const count = setCounts[set.id] || 0;
      if (count === 0 && equipped.length === 0) return '';
      const rows = set.bonuses.map((b) =>
        `<div class="set-bonus ${count >= b.pieces ? 'set-bonus-live' : ''}">${b.label}</div>`
      ).join('');
      return `<div class="detail-ability"><b>${set.name} set (${count}/6)</b>${rows}</div>`;
    }).join('');

    let starUpHtml = '';
    if (progress.stars < Progression.MAX_STARS) {
      const cost = Progression.starUpCost(progress.stars);
      const spare = progress.copies - 1;
      const can = GameState.canStarUp(def.id);
      starUpHtml = `
        <div class="detail-section">Star up</div>
        <div class="detail-ability">
          ${progress.stars}★ → ${progress.stars + 1}★: needs Lv ${cap} and ${cost} duplicate${cost > 1 ? 's' : ''}
          (have ${spare}). Boosts base stats +25%, resets level to 1.
        </div>
        <button id="star-up-btn" class="panel-btn gold" ${can ? '' : 'disabled'}>
          Star up ${can ? '' : atCap ? '(need duplicates)' : `(need Lv ${cap})`}
        </button>`;
    } else {
      starUpHtml = `
        <div class="detail-section">Star up</div>
        <div class="detail-ability">Max stars reached — ${Progression.MAX_STARS}★.</div>`;
    }

    this.detailsEl.innerHTML = `
      <div class="detail-name rarity-${def.rarity}">${Elements.badge(def.element)} ${def.name} <span class="detail-title">${def.title || ''}</span></div>
      ${def.element && Elements.info(def.element) ? `<div class="detail-element" style="color:${Elements.info(def.element).color}">${Elements.info(def.element).name} element</div>` : ''}
      <div class="card-stars rarity-${def.rarity}">${starsText}</div>
      <div class="detail-level">
        Lv ${progress.level} / ${cap}${atCap ? ' <span class="card-level-max">(MAX)</span>' : ''}
        <span class="xp-text">${atCap ? 'Star up to continue leveling' : `XP ${progress.xp} / ${xpNeed}`}</span>
      </div>
      <div class="xp-bar"><div class="xp-fill" style="width:${xpPct}%"></div></div>
      <div class="detail-stats">
        HP ${stats.hp} · ATK ${stats.atk} · DEF ${stats.def} · SPD ${stats.speed}
      </div>
      <div class="detail-section">Gear</div>
      ${gearRows}
      ${gearDetailHtml}
      ${setBonusHtml}
      <div class="detail-section">Abilities</div>
      ${abilitiesHtml}
      <div class="detail-section">Passive</div>
      <div class="detail-ability">${def.passive.icon ? `<img class="detail-icon" src="${Sprites.assetUrl(def.passive.icon)}" alt="">` : ''}<b>${def.passive.name}</b><br>${def.passive.description}</div>
      <div class="detail-section">Positional bonus</div>
      <div class="detail-ability ${bonusLive ? 'bonus-live' : ''}">
        ${def.positional.description}
        ${bonusLive ? '<br><b>★ Active in current slot</b>' : ''}
      </div>
      ${starUpHtml}
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

    const starUpBtn = document.getElementById('star-up-btn');
    if (starUpBtn && !starUpBtn.disabled) {
      starUpBtn.addEventListener('click', () => {
        if (GameState.starUp(def.id)) this.refresh();
      });
    }

    this.detailsEl.querySelectorAll('.gear-select').forEach((sel) => {
      sel.addEventListener('change', () => {
        if (sel.value) GameState.equipGear(def.id, sel.value);
        else GameState.unequipGear(def.id, sel.dataset.slot);
        this.gearFocus = sel.dataset.slot;
        this.refresh();
      });
    });
    this.detailsEl.querySelectorAll('.gear-row').forEach((row) => {
      row.addEventListener('click', (e) => {
        if (e.target.tagName === 'SELECT') return; // let the picker work
        this.gearFocus = row.dataset.slot;
        this.updateDetails();
      });
    });
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
      if (bonusHex) {
        ctx.fillStyle = 'rgba(255, 215, 106, 0.12)';
        ctx.fill();
      }
      ctx.strokeStyle =
        this.hoveredSlot === slot ? '#8ecbff' : bonusHex ? '#ffd76a' : 'rgba(120, 150, 220, 0.6)';
      ctx.lineWidth = this.hoveredSlot === slot || bonusHex ? 2 : 1.5;
      ctx.stroke();

      // Position category label at the hex bottom.
      ctx.fillStyle = 'rgba(232, 228, 216, 0.35)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(slot.position.toUpperCase(), slot.x, slot.y + 24);
    }

    // Placed heroes, back-to-front by row so front rows overlap correctly.
    const placed = this.slots
      .filter((slot) => team[slot.index] && HEROES[team[slot.index]])
      .sort((a, b) => a.y - b.y);
    for (const slot of placed) {
      const heroId = team[slot.index];
      const def = HEROES[heroId];
      const animator = this.animators.get(heroId);
      const sheet = animator && animator.sheet;
      const dh = sheet ? sheet.displayH : 48;
      const yc = slot.y - dh / 2 + 5 + ((sheet && sheet.footPad) || 0);
      // Ground shadow orb.
      const rx = Math.min(34, (sheet ? sheet.size().w : 48) * 0.3);
      ctx.fillStyle = 'rgba(8, 14, 8, 0.32)';
      ctx.beginPath();
      ctx.ellipse(slot.x, slot.y + 8, rx, rx * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      if (animator) animator.draw(ctx, slot.x, yc, false);

      const visualTop = yc - dh / 2 + ((sheet && sheet.headPad) || 0);
      ctx.fillStyle = '#bcd6ff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(def.name, slot.x, visualTop - 6);

      // Gold star when this hero's positional bonus is live here.
      if (def.positional.position === slot.position) {
        ctx.fillStyle = '#ffd76a';
        ctx.fillText('★', slot.x + 26, visualTop - 4);
      }

      // Selection ring at the feet.
      if (this.selection && this.selection.heroId === heroId) {
        ctx.strokeStyle = '#ffd76a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(slot.x, slot.y + 7, 26, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
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
        this.logicalW / 2, 24
      );
    }
  }
}
