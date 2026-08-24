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

    // Heroes or bosses — the index switches between the two rosters.
    this.category = 'heroes';
    this.catEl = document.getElementById('comp-category');
    if (this.catEl) {
      this.catEl.querySelectorAll('.comp-cat').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.category = btn.dataset.cat;
          this.catEl.querySelectorAll('.comp-cat').forEach((b) =>
            b.classList.toggle('active', b === btn));
          // Boss filters don't apply; hide them to avoid dead controls.
          document.getElementById('comp-top')
            .classList.toggle('bosses-mode', this.category === 'bosses');
          this.selectedId = null;
          this.buildList();
          const first = this.listEl.querySelector('.comp-row');
          if (first) this.select(first.dataset.heroId);
        });
      });
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

  // Deep link: land on one hero's page regardless of what the screen
  // showed last (the summon cards use this). enter() picks the id up.
  openHero(heroId) {
    if (this.category === 'bosses') {
      this.category = 'heroes';
      if (this.catEl) {
        this.catEl.querySelectorAll('.comp-cat').forEach((b) =>
          b.classList.toggle('active', b.dataset.cat === 'heroes'));
        document.getElementById('comp-top').classList.remove('bosses-mode');
      }
    }
    this.selectedId = heroId;
  }

  async enter() {
    this.buildList();
    if (!this.selectedId) {
      // Open on something the player owns when possible.
      const owned = GameState.ownedHeroIds()
        .map((uid) => GameState.defIdOf(uid)).filter((id) => HEROES[id]);
      this.selectedId = owned[0] || Object.keys(HEROES)[0];
    }
    await this.select(this.selectedId);
  }

  exit() {}

  // ---- Index -------------------------------------------------------------

  // The roster currently being browsed.
  roster() {
    return this.category === 'bosses' ? this.bossRoster() : HEROES;
  }

  // Gear, elemental, and dungeon bosses, one book. Prefixed keys
  // ('el_', 'dg_') so the tables can never collide.
  bossRoster() {
    if (!this._bossRoster) {
      const out = { ...BOSSES };
      for (const [key, b] of Object.entries(ELEMENTAL_BOSSES)) out[`el_${key}`] = b;
      for (const [key, b] of Object.entries(DUNGEON_BOSSES)) out[`dg_${key}`] = b;
      this._bossRoster = out;
    }
    return this._bossRoster;
  }

  filteredIds() {
    const q = (this.searchEl.value || '').trim().toLowerCase();
    if (this.category === 'bosses') {
      // Bosses are keyed by short name ('dragon') but carry a prefixed
      // id ('boss_dragon'), so address them by key. Elemental bosses
      // ride along under their 'el_' keys, after the gear bosses.
      return Object.entries(this.bossRoster())
        .filter(([, b]) => !q || b.name.toLowerCase().includes(q) ||
          (b.title || '').toLowerCase().includes(q) ||
          (b.element || '').toLowerCase().includes(q))
        .map(([key]) => key);
    }
    const rarity = this.rarityEl.value;
    const element = this.elementEl.value;
    const race = this.raceEl.value;
    const ownedOnly = this.ownedEl.checked;
    const owned = this.ownedDefIds();
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

  // Which CHARACTERS the player has ever collected. The compendium is a
  // book of discoveries, so it reads the permanent collection registry:
  // a character stays known even after its last copy is spent on a
  // star-up. (Currently-held heroes are always in the registry too.)
  ownedDefIds() {
    return new Set(GameState.collectedDefIds().filter((id) => HEROES[id]));
  }

  buildList() {
    const ids = this.filteredIds();
    const owned = this.ownedDefIds();
    const roster = this.roster();
    const noun = this.category === 'bosses' ? 'bosses' : 'heroes';
    this.listEl.innerHTML =
      `<div class="comp-count">${ids.length} of ${Object.keys(roster).length} ${noun}</div>`;
    for (const id of ids) {
      const def = roster[id];
      const row = document.createElement('div');
      row.className = 'comp-row' + (id === this.selectedId ? ' selected' : '') +
        (this.category === 'bosses' || owned.has(id) ? '' : ' locked');
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
    const def = this.roster()[heroId];
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
    const fixed = { idle: 'Idle', ready: 'Ready', death: 'Death' };
    if (fixed[name]) return fixed[name];
    // Idle fidgets are numbered from 2 up, and heroes carry as many as
    // their art has -- naming only the first two left "Idle4" showing.
    const fidget = /^idle(\d+)$/.exec(name);
    if (fidget) {
      const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
      const n = Number(fidget[1]) - 1;
      return `Idle fidget ${ROMAN[n - 1] || n}`;
    }
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

  // Which hunting grounds field this character as an enemy.
  encounterLocations(def) {
    const out = [];
    if (typeof LOCATION_ENEMIES === 'undefined') return out;
    for (const [loc, ids] of Object.entries(LOCATION_ENEMIES)) {
      if (ids.includes(def.id)) {
        out.push(CONFIG.LOCATION_NAMES[Number(loc)] || `Location ${loc}`);
      }
    }
    return out;
  }

  renderDetail(def, sheet) {
    if (def.isBoss) return this.renderBossDetail(def, sheet);
    // The best one you hold, since the roster can carry several.
    const mine = GameState.uidsOf(def.id)
      .map((uid) => GameState.progressOf(uid))
      .sort((a, b) => (b.stars - a.stars) || (b.level - a.level));
    const owned = mine.length > 0;
    // Collected once is collected forever, even with no copy in hand.
    const known = owned || GameState.everCollected(def.id);
    const progress = mine[0] || null;
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

    const inVault = GameState.storedHeroIds()
      .some((uid) => (GameState.storedEntry(uid) || {}).heroId === def.id);
    let ownedHtml = known
      ? `<div class="comp-note">${inVault
          ? 'Collected — your copies are parked in storage.'
          : 'Collected — no copies in the roster right now.'}</div>`
      : '<div class="comp-note">Not yet summoned — stats shown are the level 1 base.</div>';
    if (progress) {
      const scaled = Progression.scaledStats(def, progress.level, progress.stars);
      const pStars = Attune.starsHtml(progress.stars, progress.attune, def.element);
      ownedHtml = `
        <div class="comp-owned-row">
          <b>Yours</b> — Lv ${progress.level} · ${pStars}${mine.length > 1 ? ` · ${mine.length} in roster` : ''}
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
        <div class="comp-ability-head"><b>${def.positional.name || 'Position bonus'}</b>
          <span class="comp-tag">${def.positional.position === POSITION.FRONT ? 'Front hex' :
            def.positional.position === POSITION.BACK ? 'Back hex' : 'Center hex'}</span></div>
        <div class="comp-ability-desc">${def.positional.description}</div>
      </div>` : '';

    // Party synergies this hero counts toward.
    const synergyRows = [];
    const sect = RACES.sectOf(def);
    if (sect) {
      const names = sect.members.map((id) =>
        HEROES[id] ? HEROES[id].name : id.charAt(0).toUpperCase() + id.slice(1));
      const sectTiers = RACES.SECT_BONUSES[sect.id];
      synergyRows.push(`<div class="comp-syn"><b>${sect.name} Sect (No. ${sect.number})</b>` +
        `<span>${names.join(', ')}</span>` +
        (sectTiers && sectTiers.length
          ? sectTiers.map((t) => `<span>${t.label}</span>`).join('')
          : '<span>Sect bonuses to come.</span>') + '</div>');
    }
    if (race && RACES.BONUSES[race] && RACES.BONUSES[race].length) {
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
            ${owned ? '<span class="comp-badge owned">Owned</span>'
              : known ? '<span class="comp-badge owned">Collected</span>' : ''}
          </div>
          ${Tags.html(def)}
          ${sources.length ? `<div class="comp-wishlist-row">
            <button id="comp-wishlist" class="panel-btn${GameState.isWishlisted(def.id) ? ' gold' : ''}">
              ${GameState.isWishlisted(def.id) ? '★ Wishlisted' : '☆ Add to wishlist'}</button>
            <span id="comp-wishlist-note"></span>
          </div>` : ''}
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
      ${(() => {
        const locs = this.encounterLocations(def);
        return locs.length
          ? `<div class="comp-source">⚔ Fought as an enemy in: ${locs.join(', ')}</div>`
          : '';
      })()}
    `;

    this.previewCanvas = document.getElementById('comp-canvas');
    // Wishlist toggle: up to three characters at double draw weight in
    // plain summons. Updated in place so the animation preview and the
    // page scroll survive the click.
    const wishBtn = document.getElementById('comp-wishlist');
    if (wishBtn) {
      wishBtn.addEventListener('click', () => {
        const note = document.getElementById('comp-wishlist-note');
        const r = GameState.toggleWishlist(def.id);
        if (r.error === 'full') {
          note.textContent =
            `The wishlist holds ${GameState.WISHLIST_MAX} — un-wishlist someone first.`;
          return;
        }
        note.textContent = r.on
          ? 'Wishlisted: 2× draw weight in plain summons.' : '';
        wishBtn.classList.toggle('gold', r.on);
        wishBtn.textContent = r.on ? '★ Wishlisted' : '☆ Add to wishlist';
      });
    }
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

  // Bosses: no rarity or summon pool, but stage scaling, several
  // passives, and a gear set that only they drop.
  renderBossDetail(def, sheet) {
    const elInfo = def.element ? Elements.info(def.element) : null;
    const cleared = def.isElemental
      ? GameState.attuneStageCleared(def.attuneId)
      : GameState.bossStageCleared(def.id);
    const maxStage = Progression.BOSS_MAX_STAGE;
    // bossScaledStats takes the def and a level, not a stage.
    const animBtns = this.animationNames(sheet).map((n) =>
      `<button class="comp-anim-btn" data-anim="${n}">${this.animLabel(def, n)}</button>`
    ).join('');

    // Stage preview: what you're walking into at a few checkpoints.
    const stages = [1, 5, 10, 15, 20].filter((st) => st <= maxStage);
    const stageRows = stages.map((st) => {
      const lv = Progression.bossLevel(st);
      const st2 = Progression.bossScaledStats(def, lv);
      const state = st <= cleared ? 'cleared' : st === cleared + 1 ? 'next' : 'locked';
      return `<tr class="stage-${state}">
        <th>Stage ${st}</th><td>Lv ${lv}</td>
        <td>${st2.hp.toLocaleString()} HP</td><td>${st2.atk} ATK</td>
        <td>${st2.def} DEF</td><td>${st2.speed} SPD</td>
        <td>${state === 'cleared' ? '✓ cleared' : state === 'next' ? 'open' : 'locked'}</td>
      </tr>`;
    }).join('');

    const abilitiesHtml = (def.abilities || []).map((a, i) => {
      const cd = a.cooldown > 0 ? `${a.cooldown}-turn cooldown` : 'No cooldown';
      const target = CompendiumScreen.TARGET_LABELS[a.targeting] || a.targeting;
      const icon = a.icon
        ? `<img class="detail-icon" src="${Sprites.assetUrl(a.icon)}" alt="">` : '';
      return `<div class="comp-ability">
        <div class="comp-ability-head">${icon}<b>${a.name}</b>
          <span class="comp-tag">Skill ${i + 1}</span></div>
        <div class="comp-ability-meta">${target} · ${cd}</div>
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

    const isDungeon = !!def.dungeonName;
    const dungeonPay = (st) => def.whetstonesPer > 0
      ? `${(def.whetstonesPer * st).toLocaleString()} 🪨`
      : def.arcanaPer > 0
        ? `${(def.arcanaPer * st).toLocaleString()} ✦`
      : def.diamondsFor
        ? `${def.diamondsFor(st).toLocaleString()} 💎`
        : `${(Progression.enemyXp(Progression.bossLevel(st)) * (def.xpMult || 6))
            .toLocaleString()} XP ⭐ each`;
    const dungeonHeadline = def.whetstonesPer > 0
      ? `${def.whetstonesPer} Whetstones 🪨 per floor — every clear of floor N
          pays N times that`
      : def.arcanaPer > 0
        ? `${def.arcanaPer} Arcana ✦ per floor — every clear of floor N pays
            N times that`
      : def.diamondsFor
        ? `50 💎 at floor 1 rising to 250 💎 at floor 20 — and only one
            challenge a day`
        : `${def.xpMult || 6}× enemy XP ⭐ for the whole team — about
            ${Math.round((def.xpMult || 6) / 6)}× what a boss fight of the
            same level pays, every clear`;
    const set = !def.isElemental && typeof Gear !== 'undefined' && Gear.SETS[def.gearSet];
    const dropHtml = def.isElemental
      ? `<div class="comp-drop"><b>${elInfo ? elInfo.name : def.element} Elements</b>
          — the only source of the Elements that attune ${elInfo ? elInfo.name : ''}
          heroes. Stages 1–8 pay Small, 9–15 Medium, 16–20 Large.</div>
        ${[1, 5, 10, 15, 20].map((st) =>
          `<div class="comp-syn"><span>Stage ${st}: ${Attune.payoutText(st)}</span></div>`).join('')}`
      : isDungeon
        ? `<div class="comp-drop"><b>${dungeonHeadline}</b>. No gear drops in
            ${def.dungeonName}.</div>
          ${[1, 5, 10, 15, 20].map((st) =>
            `<div class="comp-syn"><span>Floor ${st}: ${dungeonPay(st)}</span></div>`).join('')}`
      : set ? `
      <div class="comp-drop"><b>${set.name} set</b> — every stage drops a piece;
        higher stages roll rarer.</div>
      ${set.bonuses.map((b) => `<div class="comp-syn"><span>${b.label}</span></div>`).join('')}
    ` : '<div class="comp-source">No set drop recorded.</div>';

    this.detailEl.innerHTML = `
      <div class="comp-hero-head">
        <div class="comp-preview">
          <canvas id="comp-canvas" width="${this.previewW}" height="${this.previewH}"></canvas>
        </div>
        <div class="comp-id">
          <div class="comp-stars rarity-5">BOSS</div>
          <h2 class="comp-name">${def.name}</h2>
          <div class="comp-title">${def.title || ''}</div>
          <div class="comp-badges">
            ${elInfo ? `<span class="comp-badge" style="border-color:${elInfo.color};color:${elInfo.color}">${Elements.badge(def.element)} ${elInfo.name}</span>` : ''}
            <span class="comp-badge">Spans every hex</span>
            ${def.isElemental ? '<span class="comp-badge">Elemental boss</span>' : ''}
            ${def.dungeonName ? `<span class="comp-badge">${def.dungeonName}</span>` : ''}
            <span class="comp-badge">${passives.length} passives</span>
            ${cleared > 0 ? `<span class="comp-badge owned">Stage ${cleared} cleared</span>` : ''}
          </div>
          <div class="comp-note">Fights alone from the center tile and occupies the
            whole formation — every row-targeted attack reaches it.</div>
        </div>
      </div>

      <div class="comp-section">Animations</div>
      <div class="comp-anim-bar">${animBtns}</div>

      <div class="comp-section">Stage scaling</div>
      <div class="comp-stage-box">
        <table class="comp-stage-table"><tbody>${stageRows}</tbody></table>
        <div class="comp-note">Stages run to ${maxStage}; clearing one opens the next.</div>
      </div>

      <div class="comp-section">Skills</div>
      ${abilitiesHtml}
      ${passiveHtml}

      <div class="comp-section">Drops</div>
      ${dropHtml}
    `;
    this.previewCanvas = document.getElementById('comp-canvas');
    this.detailEl.querySelectorAll('.comp-anim-btn').forEach((b) => {
      b.addEventListener('click', () => this.playAnim(b.dataset.anim));
    });
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
    const size = this.animator.size();
    // The animator renders at battle size (~90px), which rattles around
    // a 260px stage. Blow it up to fill the box, scaled around the feet
    // so the ground line and shadow hold still. A sheet that measured
    // badly (image still decoding, or failed) yields NaN/zero sizes —
    // fall back to 1:1 rather than feeding NaN into the canvas.
    let zoom = Math.max(1, Math.min(
      (c.width - 56) / size.w, (c.height - 76) / size.h));
    if (!Number.isFinite(zoom) || zoom <= 0) zoom = 1;
    const baseY = c.height - 26;
    // Ground shadow, then the sprite standing on it.
    const shadowZoom = Math.min(zoom, 1.7);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(c.width / 2, baseY + 6, 34 * shadowZoom, 9 * shadowZoom,
      0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const def = this.roster()[this.selectedId] ||
      (typeof HEROES !== 'undefined' && HEROES[this.selectedId]) || null;
    ctx.save();
    ctx.translate(c.width / 2, baseY + 8);
    ctx.scale(zoom, zoom);
    this.animator.draw(ctx, 0, -size.h / 2, Sprites.facesLeft(def));
    ctx.restore();
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
