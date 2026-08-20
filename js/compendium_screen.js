// Hero Compendium: the reference view for every hero in the game —
// owned or not. A filterable index on the left, and a full dossier on
// the right: live animation player, stats, the whole kit, race/element
// synergies the hero contributes to, and where they can be summoned.

class CompendiumScreen {
  constructor(app) {
    this.app = app;
    this.el = document.getElementById('screen-compendium');
    this.listEl = document.getElementById('comp-list');
    this.detailEl = document.getElementById('comp-detail');
    this.searchEl = document.getElementById('comp-search');
    this.rarityEl = document.getElementById('comp-filter-rarity');
    this.elementEl = document.getElementById('comp-filter-element');
    this.raceEl = document.getElementById('comp-filter-race');
    this.ownedEl = document.getElementById('comp-owned');

    // Filter pickers built from the live data, so new elements/races
    // show up without touching the markup.
    const elements = [...new Set(Object.values(HEROES).map((h) => h.element).filter(Boolean))];
    this.elementEl.innerHTML = '<option value="">All elements</option>' +
      elements.map((e) => {
        const info = Elements.info(e);
        return `<option value="${e}">${Elements.badge(e)} ${info ? info.name : e}</option>`;
      }).join('');
    const races = [...new Set(Object.values(HEROES).map((h) => RACES.of(h)).filter(Boolean))];
    this.raceEl.innerHTML = '<option value="">All races</option>' +
      races.map((r) => `<option value="${r}">${RACES.NAMES[r]}</option>`).join('') +
      '<option value="none">No race</option>';

    for (const el of [this.searchEl, this.rarityEl, this.elementEl, this.raceEl, this.ownedEl]) {
      el.addEventListener(el === this.searchEl ? 'input' : 'change', () => this.buildList());
    }

    this.selectedId = null;
    this.animator = null;    // AnimationPlayer for the detail preview
    this.animName = 'idle';
    this.mirrorSheets = null; // mirror-count variants, when the hero has them
    this.mirrorCount = null;

    // Preview canvas lives inside the detail panel (rebuilt per hero).
    this.previewCanvas = null;
    this.previewW = 260;
    this.previewH = 260;
  }

  async enter() {
    this.buildList();
    if (!this.selectedId) {
      // Open on something the player owns when possible.
      const owned = GameState.ownedHeroIds().filter((id) => HEROES[id]);
      this.selectedId = owned[0] || Object.keys(HEROES)[0];
    }
    await this.select(this.selectedId);
  }

  exit() {}

  // ---- Index -------------------------------------------------------------

  filteredIds() {
    const q = (this.searchEl.value || '').trim().toLowerCase();
    const rarity = this.rarityEl.value;
    const element = this.elementEl.value;
    const race = this.raceEl.value;
    const ownedOnly = this.ownedEl.checked;
    const owned = new Set(GameState.ownedHeroIds());
    return Object.values(HEROES)
      .filter((h) => {
        if (rarity && h.rarity !== Number(rarity)) return false;
        if (element && h.element !== element) return false;
        if (race) {
          const r = RACES.of(h) || 'none';
          if (r !== race) return false;
        }
        if (ownedOnly && !owned.has(h.id)) return false;
        if (!q) return true;
        return h.name.toLowerCase().includes(q) ||
          (h.title || '').toLowerCase().includes(q) ||
          (h.element || '').toLowerCase().includes(q);
      })
      // Rarity first (the headliners lead), then name.
      .sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name))
      .map((h) => h.id);
  }

  buildList() {
    const ids = this.filteredIds();
    const owned = new Set(GameState.ownedHeroIds());
    this.listEl.innerHTML =
      `<div class="comp-count">${ids.length} of ${Object.keys(HEROES).length} heroes</div>`;
    for (const id of ids) {
      const def = HEROES[id];
      const row = document.createElement('div');
      row.className = 'comp-row' + (id === this.selectedId ? ' selected' : '') +
        (owned.has(id) ? '' : ' locked');
      row.dataset.heroId = id;
      const stars = def.rarity <= 5 ? '★'.repeat(def.rarity) : `${def.rarity}★`;
      row.innerHTML = `
        <canvas class="comp-portrait" width="44" height="44"></canvas>
        <div class="comp-row-text">
          <div class="comp-row-name">${Elements.badge(def.element)} ${def.name}</div>
          <div class="comp-row-sub">${def.title || ''}</div>
        </div>
        <div class="comp-row-stars rarity-${def.rarity}">${stars}</div>`;
      Sprites.drawPortrait(row.querySelector('canvas'), def);
      row.addEventListener('click', () => this.select(id));
      this.listEl.appendChild(row);
    }
  }

  // ---- Detail dossier ----------------------------------------------------

  async select(heroId) {
    this.selectedId = heroId;
    this.listEl.querySelectorAll('.comp-row').forEach((r) =>
      r.classList.toggle('selected', r.dataset.heroId === heroId));
    const def = HEROES[heroId];
    if (!def) return;

    this.mirrorSheets = null;
    this.mirrorCount = def.mirrors ? def.mirrors.max : null;

    const sheet = await Sprites.getSheet(def);
    if (this.selectedId !== heroId) return; // a later click won the race
    this.renderDetail(def, sheet);

    // Animation preview: start on idle, keep the current pick if the new
    // hero also has it.
    const names = this.animationNames(sheet);
    if (!names.includes(this.animName)) this.animName = names[0] || 'idle';
    this.animator = new AnimationPlayer(sheet);
    this.playAnim(this.animName);

    // Mirror-count variants (Aniani) are seven full sheets — load them
    // in the background so the dossier never waits on them.
    if (def.mirrorSprites) {
      Sprites.getMirrorSheets(def).then((sheets) => {
        if (this.selectedId !== heroId) return;
        this.mirrorSheets = sheets;
        this.syncMirrorPreview();
      });
    }
  }

  // Animations worth showing, in a sensible reading order.
  animationNames(sheet) {
    const order = ['idle', 'ready', 'attack', 'heal', 'skill3', 'buff', 'rowslash',
      'jumpslash', 'idle2', 'idle3', 'death'];
    const have = Object.keys(sheet.animations);
    return [...order.filter((n) => have.includes(n)),
      ...have.filter((n) => !order.includes(n))];
  }

  // Friendly names: map a strip to the ability that plays it.
  animLabel(def, name) {
    const byAnim = (def.abilities || []).find((a) => a.animation === name);
    const fixed = {
      idle: 'Idle', ready: 'Ready', death: 'Death',
      idle2: 'Idle fidget I', idle3: 'Idle fidget II',
    };
    if (fixed[name]) return fixed[name];
    return byAnim ? byAnim.name : name.charAt(0).toUpperCase() + name.slice(1);
  }

  playAnim(name) {
    this.animName = name;
    if (!this.animator) return;
    const anim = this.animator.sheet.animations[name];
    this.animator.play(name);
    // One-shots (attacks, death) replay on a loop here so the dossier
    // keeps showing them instead of freezing on the last frame.
    if (anim && !anim.loop) {
      this.animator.onComplete = null;
      this.replayTimer = 0.9;
    } else {
      this.replayTimer = null;
    }
    this.detailEl.querySelectorAll('.comp-anim-btn').forEach((b) =>
      b.classList.toggle('active', b.dataset.anim === name));
  }

  syncMirrorPreview() {
    if (!this.animator || !this.mirrorSheets || this.mirrorCount === null) return;
    const sheet = this.mirrorSheets[this.mirrorCount];
    if (sheet) {
      const cur = this.animator.current;
      const frame = this.animator.frame;
      this.animator.sheet = sheet;
      if (sheet.animations[cur]) {
        this.animator.current = cur;
        this.animator.frame = Math.min(frame, sheet.animations[cur].frames - 1);
      }
    }
  }

  // Which scrolls can produce this hero, with their rates.
  summonSources(def) {
    const rows = [];
    for (const kind of ['common', 'rare', 'temporal']) {
      const pool = kind === 'temporal' ? Elements.TEMPORAL : Elements.BASIC;
      if (!pool.includes(def.element)) continue;
      const rate = (Gacha.RATES[kind] || []).find((r) => r.rarity === def.rarity);
      if (!rate) continue;
      const icon = kind === 'common' ? '📜' : kind === 'rare' ? '✨' : '🌀';
      const name = kind.charAt(0).toUpperCase() + kind.slice(1);
      rows.push(`${icon} ${name} Scroll — ${Math.round(rate.p * 100)}% for ${def.rarity}★`);
    }
    return rows;
  }

  renderDetail(def, sheet) {
    const owned = GameState.ownedHeroIds().includes(def.id);
    const progress = owned ? GameState.progressOf(def.id) : null;
    const stars = def.rarity <= 5 ? '★'.repeat(def.rarity) : `${def.rarity}★`;
    const elInfo = def.element ? Elements.info(def.element) : null;
    const race = RACES.of(def);

    const animBtns = this.animationNames(sheet).map((n) =>
      `<button class="comp-anim-btn" data-anim="${n}">${this.animLabel(def, n)}</button>`
    ).join('');

    // Mirror-count picker for heroes whose art tracks a resource. Shown
    // as soon as the hero declares variants; the slider starts working
    // the moment the background sheet load finishes.
    const mirrorPicker = def.mirrorSprites ? `
      <div class="comp-mirror-picker">
        <span class="comp-label">Crystal mirrors</span>
        <input id="comp-mirror-range" type="range" min="0" max="${def.mirrors.max}"
          value="${this.mirrorCount}" step="1">
        <b id="comp-mirror-value">${this.mirrorCount}</b>
      </div>` : '';

    const s = def.stats || {};
    const statsHtml = `
      <div class="comp-stat"><span class="k">HP</span><span class="v">${s.hp ?? '—'}</span></div>
      <div class="comp-stat"><span class="k">ATK</span><span class="v">${s.atk ?? '—'}</span></div>
      <div class="comp-stat"><span class="k">DEF</span><span class="v">${s.def ?? '—'}</span></div>
      <div class="comp-stat"><span class="k">SPD</span><span class="v">${s.speed ?? '—'}</span></div>`;

    let ownedHtml = '<div class="comp-note">Not yet summoned — stats shown are the level 1 base.</div>';
    if (progress) {
      const scaled = Progression.scaledStats(def, progress.level, progress.stars);
      const pStars = progress.stars <= 5 ? '★'.repeat(progress.stars) : `${progress.stars}★`;
      ownedHtml = `
        <div class="comp-owned-row">
          <b>Yours</b> — Lv ${progress.level} · ${pStars} · ×${progress.copies} copies
          <span class="comp-note">HP ${scaled.hp} · ATK ${scaled.atk} · DEF ${scaled.def} · SPD ${scaled.speed}</span>
        </div>`;
    }

    const abilitiesHtml = (def.abilities || []).map((a, i) => {
      const cd = a.cooldown > 0 ? `${a.cooldown}-turn cooldown` : 'No cooldown';
      const icon = a.icon
        ? `<img class="detail-icon" src="${Sprites.assetUrl(a.icon)}" alt="">` : '';
      const lv = owned ? GameState.skillLevel(def.id, i) : 1;
      const lvText = owned && lv > 1
        ? ` · Lv ${lv} (+${Math.round((Progression.skillPower(lv) - 1) * 100)}% power)` : '';
      const target = CompendiumScreen.TARGET_LABELS[a.targeting] || a.targeting;
      return `<div class="comp-ability">
        <div class="comp-ability-head">${icon}<b>${a.name}</b>
          <span class="comp-tag">Skill ${i + 1}</span></div>
        <div class="comp-ability-meta">${target} · ${cd}${lvText}</div>
        <div class="comp-ability-desc">${a.description}</div>
      </div>`;
    }).join('');

    const passives = def.passives || (def.passive ? [def.passive] : []);
    const passiveHtml = passives.map((p) => `
      <div class="comp-ability passive">
        <div class="comp-ability-head">
          ${p.icon ? `<img class="detail-icon" src="${Sprites.assetUrl(p.icon)}" alt="">` : ''}
          <b>${p.name}</b><span class="comp-tag">Passive</span></div>
        <div class="comp-ability-desc">${p.description}</div>
      </div>`).join('');

    const posHtml = def.positional ? `
      <div class="comp-ability passive">
        <div class="comp-ability-head"><b>Position bonus</b>
          <span class="comp-tag">${def.positional.position === POSITION.FRONT ? 'Front hex' :
            def.positional.position === POSITION.BACK ? 'Back hex' : 'Center hex'}</span></div>
        <div class="comp-ability-desc">${def.positional.description}</div>
      </div>` : '';

    // Party synergies this hero counts toward.
    const synergyRows = [];
    if (race && RACES.BONUSES[race]) {
      synergyRows.push(`<div class="comp-syn"><b>${RACES.NAMES[race]} pack</b>` +
        RACES.BONUSES[race].map((t) => `<span>${t.label}</span>`).join('') + '</div>');
    }
    if (def.element && RACES.ELEMENT_BONUSES[def.element]) {
      synergyRows.push(`<div class="comp-syn"><b>${RACES.ELEMENT_NAMES[def.element]} resonance</b>` +
        RACES.ELEMENT_BONUSES[def.element].map((t) => `<span>${t.label}</span>`).join('') + '</div>');
    }

    const sources = this.summonSources(def);
    const sourceHtml = sources.length
      ? sources.map((r) => `<div class="comp-source">${r}</div>`).join('')
      : '<div class="comp-source">Not available from summon scrolls.</div>';

    this.detailEl.innerHTML = `
      <div class="comp-hero-head">
        <div class="comp-preview">
          <canvas id="comp-canvas" width="${this.previewW}" height="${this.previewH}"></canvas>
        </div>
        <div class="comp-id">
          <div class="comp-stars rarity-${def.rarity}">${stars}</div>
          <h2 class="comp-name">${def.name}</h2>
          <div class="comp-title">${def.title || ''}</div>
          <div class="comp-badges">
            ${elInfo ? `<span class="comp-badge" style="border-color:${elInfo.color};color:${elInfo.color}">${Elements.badge(def.element)} ${elInfo.name}</span>` : ''}
            ${race ? `<span class="comp-badge">${RACES.NAMES[race]}</span>` : ''}
            <span class="comp-badge">${def.rarity}★</span>
            ${owned ? '<span class="comp-badge owned">Owned</span>' : ''}
          </div>
          <div class="comp-stats">${statsHtml}</div>
          ${ownedHtml}
        </div>
      </div>

      <div class="comp-section">Animations</div>
      <div class="comp-anim-bar">${animBtns}</div>
      ${mirrorPicker}

      <div class="comp-section">Skills</div>
      ${abilitiesHtml}
      ${passiveHtml}
      ${posHtml}

      ${synergyRows.length ? `<div class="comp-section">Party synergy</div>${synergyRows.join('')}` : ''}

      <div class="comp-section">Where to find</div>
      ${sourceHtml}
    `;

    this.previewCanvas = document.getElementById('comp-canvas');
    this.detailEl.querySelectorAll('.comp-anim-btn').forEach((b) => {
      b.addEventListener('click', () => this.playAnim(b.dataset.anim));
    });
    const range = document.getElementById('comp-mirror-range');
    if (range) {
      range.addEventListener('input', () => {
        this.mirrorCount = Number(range.value);
        document.getElementById('comp-mirror-value').textContent = this.mirrorCount;
        this.syncMirrorPreview();
      });
    }
  }

  // ---- Loop --------------------------------------------------------------

  update(dt) {
    if (!this.animator) return;
    this.animator.update(dt);
    // Replay one-shot animations on a gentle cycle.
    if (this.replayTimer !== null && this.replayTimer !== undefined) {
      const anim = this.animator.sheet.animations[this.animName];
      if (anim && this.animator.frame >= anim.frames - 1) {
        this.replayTimer -= dt;
        if (this.replayTimer <= 0) {
          this.animator.play(this.animName);
          this.replayTimer = 0.9;
        }
      }
    }
  }

  draw() {
    const c = this.previewCanvas;
    if (!c || !this.animator) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    // Ground shadow, then the sprite standing on it.
    const baseY = c.height - 26;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(c.width / 2, baseY + 6, 34, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const size = this.animator.size();
    this.animator.draw(ctx, c.width / 2, baseY - size.h / 2 + 8, false);
  }
}

// Human-readable targeting labels for the dossier.
CompendiumScreen.TARGET_LABELS = {
  enemy: 'Single enemy',
  'enemy-row': 'Enemy row',
  'all-enemies': 'All enemies',
  'front-enemies': 'Front-row enemies',
  'back-enemies': 'Back-row enemies',
  ally: 'Single ally',
  'all-allies': 'All allies',
  'front-allies': 'Front-line allies',
  'dead-ally': 'A fallen ally',
  'self-and-wounded-allies': 'Self + most wounded allies',
  self: 'Self',
};
