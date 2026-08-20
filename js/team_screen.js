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
    this.rosterSearch = document.getElementById('roster-search');
    this.rosterSort = document.getElementById('roster-sort');
    this.rosterSearch.addEventListener('input', () => {
      this.rosterMsg = null;
      this.buildRoster();
    });
    this.rosterSort.addEventListener('change', () => this.buildRoster());
    // "Hide maxed" declutters heroes already at their level cap. The
    // preference sticks across sessions (display-only, not part of the save).
    this.hideMaxed = document.getElementById('hide-maxed');
    try { this.hideMaxed.checked = localStorage.getItem('bg_hideMaxed') === '1'; } catch (e) {}
    this.hideMaxed.addEventListener('change', () => {
      try { localStorage.setItem('bg_hideMaxed', this.hideMaxed.checked ? '1' : '0'); } catch (e) {}
      this.buildRoster();
    });
    // Star up everything that's ready, in one click. With hundreds of
    // heroes, hunting for the ★⬆ badges one card at a time is the most
    // tedious thing left on this screen.
    this.starUpAllBtn = document.getElementById('star-up-all-btn');
    if (this.starUpAllBtn) {
      this.starUpAllBtn.addEventListener('click', () => {
        const done = GameState.starUpAll();
        if (done.length === 0) return;
        const names = done.slice(0, 4).map((d) => `${d.name} ${d.to}★`).join(', ');
        this.rosterMsg = `Starred up ${done.length} hero${done.length > 1 ? 'es' : ''}: ` +
          `${names}${done.length > 4 ? `, +${done.length - 4} more` : ''}.`;
        this.refresh();
      });
    }

    this.reportEl = document.getElementById('roster-report');
    const reportBtn = document.getElementById('roster-report-btn');
    if (reportBtn) {
      reportBtn.addEventListener('click', () => {
        const show = this.reportEl.classList.contains('hidden');
        this.reportEl.classList.toggle('hidden', !show);
        if (show) this.renderReport();
      });
    }

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
    this.buildLocationOptions();
    // Stage 0 is the training ground: level 1 enemies for fresh teams.
    this.stageSel.innerHTML =
      '<option value="0">Stage 0 (Lv 1)</option>' +
      Array.from({ length: 20 }, (_, i) =>
        `<option value="${i + 1}">Stage ${i + 1} (Lv ${(i + 1) * 5})</option>`).join('');
    const ws = GameState.waveSettings;
    if (!this.huntOpen(ws.location)) {
      GameState.setWaveSettings({ location: 0 }); // saved biome is not open
      ws.location = 0;
    }
    this.locationSel.value = String(ws.location);
    this.stageSel.value = String(ws.stage);
    this.repeatSel.value = String(ws.repeat);
    const saveWave = () => GameState.setWaveSettings({
      location: Number(this.locationSel.value),
      stage: Number(this.stageSel.value),
      repeat: this.repeatSel.value === 'inf' ? 'inf' : Number(this.repeatSel.value),
    });
    [this.locationSel, this.stageSel, this.repeatSel].forEach((sel) =>
      sel.addEventListener('change', () => { saveWave(); this.updateButtons(); }));

    this.fightBtn.addEventListener('click', () => {
      if (GameState.teamSize() === 0) return;
      if (!this.huntOpen(Number(this.locationSel.value))) return;
      this.app.screens.battle.requestBattle('wave');
      this.app.showScreen('battle');
    });
    this.towerBtn = document.getElementById('tower-btn');
    this.towerStatus = document.getElementById('tower-status');
    this.towerBtn.addEventListener('click', () => {
      if (GameState.teamSize() === 0) return;
      this.app.screens.battle.requestBattle('tower');
      this.app.showScreen('battle');
    });
    // Boss picker: which boss, stage (gated by per-boss clears), and
    // repeat (cleared stages only).
    this.bossBtn = document.getElementById('boss-btn');
    this.bossSel = document.getElementById('boss-select');
    this.bossStageSel = document.getElementById('boss-stage-select');
    this.bossRepeatSel = document.getElementById('boss-repeat-select');
    this.buildBossOptions();
    if (!(GameState.bossSettings.boss in BOSSES) ||
        !Campaign.bossUnlocked(GameState.bossSettings.boss)) {
      const first = Object.keys(BOSSES).find((k) => Campaign.bossUnlocked(k));
      GameState.setBossSettings({ boss: first || 'dragon' });
    }
    this.bossSel.value = GameState.bossSettings.boss;
    this.bossRepeatSel.value = String(GameState.bossSettings.repeat);
    const saveBoss = () => GameState.setBossSettings({
      boss: this.bossSel.value,
      stage: Number(this.bossStageSel.value),
      repeat: this.bossRepeatSel.value === 'inf' ? 'inf' : Number(this.bossRepeatSel.value),
    });
    this.bossSel.addEventListener('change', () => { saveBoss(); this.updateButtons(); });
    this.bossStageSel.addEventListener('change', () => { saveBoss(); this.updateButtons(); });
    this.bossRepeatSel.addEventListener('change', saveBoss);
    this.bossBtn.addEventListener('click', () => {
      if (GameState.teamSize() === 0) return;
      if (!Campaign.bossUnlocked(this.bossSel.value)) return;
      this.app.screens.battle.requestBattle('boss');
      this.app.showScreen('battle');
    });
    this.clearBtn.addEventListener('click', () => {
      GameState.clearTeam();
      this.selection = null;
      this.refresh();
    });
  }

  // A hunt location is open when it has an enemy race AND the campaign
  // chapter set there has been reached. The campaign is the spine: you
  // hunt where you have already marched.
  huntOpen(loc) {
    return !!LOCATION_ENEMIES[loc] && Campaign.locationUnlocked(loc);
  }

  buildLocationOptions() {
    const keep = this.locationSel.value;
    this.locationSel.innerHTML = CONFIG.LOCATION_NAMES
      .map((n, i) => {
        const open = this.huntOpen(i);
        return `<option value="${i}" ${open ? '' : 'disabled'}>` +
          `${n}${open ? '' : ' 🔒'}</option>`;
      }).join('');
    if (keep && this.huntOpen(Number(keep))) this.locationSel.value = keep;
  }

  buildBossOptions() {
    const keep = this.bossSel.value;
    this.bossSel.innerHTML = Object.entries(BOSSES)
      .map(([key, b]) => {
        const open = Campaign.bossUnlocked(key);
        return `<option value="${key}" ${open ? '' : 'disabled'}>` +
          `${Elements.badge(b.element)} ${b.name}${open ? '' : ' 🔒'}</option>`;
      }).join('');
    if (keep && Campaign.bossUnlocked(keep)) this.bossSel.value = keep;
  }

  async enter() {
    this.selection = null;
    // Campaign progress since the last visit may have opened a hunt
    // location or a boss, so the pickers are rebuilt rather than being
    // frozen at construction.
    this.buildLocationOptions();
    this.buildBossOptions();
    // Paint immediately. Sprite sheets are fetched in the background by
    // refresh() and appear as they arrive — the screen must never wait
    // on the network to show a roster it already has in the save.
    this.refresh();
  }

  exit() {}

  // Idle-animation players for the heroes on the field. Only placed
  // heroes are ever drawn, so this loads seven sheets, not the roster's:
  // building one per owned hero meant hundreds of image loads, in
  // series, before the screen would paint at all.
  //
  // Not awaited by callers — each sprite pops in on the frame after its
  // sheet lands.
  async ensureAnimators() {
    const wanted = Object.values(GameState.getTeam())
      .filter((id) => HEROES[id] && !this.animators.has(id));
    await Promise.all(wanted.map(async (heroId) => {
      const sheet = await Sprites.getSheet(HEROES[heroId]);
      const player = new AnimationPlayer(sheet);
      player.play('idle');
      player.elapsed = Math.random() * 0.5;
      this.animators.set(heroId, player);
    }));
  }

  refresh() {
    this.buildRoster();
    this.updateDetails();
    this.updateButtons();
    // The team may have changed since the last paint; anything newly
    // placed needs a player. Cheap when nothing has.
    this.ensureAnimators();
  }

  updateButtons() {
    // Star-up-all: say how many are waiting, and grey out when none are.
    if (this.starUpAllBtn) {
      const ready = GameState.starUpReadyCount();
      this.starUpAllBtn.textContent = ready > 0
        ? `★⬆ Star up all (${ready})` : '★⬆ Star up all';
      this.starUpAllBtn.disabled = ready === 0;
      this.starUpAllBtn.classList.toggle('gold', ready > 0);
    }

    const size = GameState.teamSize();
    this.teamCountEl.textContent = `${size}/7 heroes placed`;

    // Party synergy readout: race packs and element resonance the team
    // has live (and any group one short of its first tier).
    const raceEl = document.getElementById('race-bonuses');
    if (raceEl) {
      const defs = Object.values(GameState.getTeam())
        .map((id) => HEROES[id]).filter(Boolean);
      const parts = [];
      for (const [race, count] of Object.entries(RACES.counts(defs))) {
        if (count < 2) continue;
        const tiers = RACES.activeTiers(race, count);
        if (tiers.length > 0) {
          parts.push(`<b>${RACES.NAMES[race]} ×${count}</b>: ` +
            tiers.map((t) => t.label.replace(/^\d+: /, '')).join(' · '));
        } else {
          parts.push(`${RACES.NAMES[race]} ×${count} <span class="race-next">(3 unlocks a pack bonus)</span>`);
        }
      }
      for (const [el, count] of Object.entries(RACES.elementCounts(defs))) {
        if (count < 2) continue;
        const tiers = RACES.activeElementTiers(el, count);
        if (tiers.length > 0) {
          parts.push(`<b>${RACES.ELEMENT_NAMES[el]} ×${count}</b>: ` +
            tiers.map((t) => t.label.replace(/^\d+: /, '')).join(' · '));
        } else {
          parts.push(`${RACES.ELEMENT_NAMES[el]} ×${count} <span class="race-next">(3 unlocks a resonance)</span>`);
        }
      }
      raceEl.innerHTML = parts.length
        ? 'Party synergy — ' + parts.join(' &nbsp;|&nbsp; ')
        : '';
      raceEl.classList.toggle('hidden', parts.length === 0);
    }
    this.fightBtn.disabled = size === 0 || !this.huntOpen(Number(this.locationSel.value));
    this.towerBtn.disabled = size === 0;
    // Bosses only take challengers once their chapter has been cleared;
    // at the start of a save that is every one of them.
    const bossOpen = Campaign.bossUnlocked(this.bossSel.value);
    this.bossBtn.disabled = size === 0 || !bossOpen;
    this.bossBtn.title = bossOpen
      ? 'Take on the boss with your current team'
      : 'Clear this boss\'s campaign chapter to challenge it';
    this.bossStageSel.disabled = !bossOpen;
    const nextFloor = GameState.towerBest + 1;
    const floorLv = Math.max(2, Math.ceil(nextFloor * 1.5));
    this.towerStatus.textContent =
      `Best floor ${GameState.towerBest} — next: floor ${nextFloor} ` +
      `(Lv ~${floorLv}${nextFloor % 10 === 0 ? ' · BOSS' : ''})`;

    // Boss stage list for the SELECTED boss: cleared stages ✓
    // (repeatable), the next stage open, everything past it locked.
    const bossKey = this.bossSel.value in BOSSES ? this.bossSel.value : 'dragon';
    if (!bossOpen) {
      this.bossStageSel.innerHTML = '<option>🔒 Locked</option>';
      this.bossRepeatSel.disabled = true;
      return;
    }
    const cleared = GameState.bossStageCleared(BOSSES[bossKey].id);
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
    // One-line result note for bulk actions (star-up-all).
    const msgEl = document.getElementById('roster-msg');
    if (msgEl) {
      msgEl.textContent = this.rosterMsg || '';
      msgEl.classList.toggle('hidden', !this.rosterMsg);
    }
    const team = GameState.getTeam();
    const inTeam = new Set(Object.values(team));
    // Card reuse: rebuilding 385 cards (and 385 portrait canvases) on
    // every click is the single most expensive thing this screen does.
    // Keep the DOM nodes keyed by hero and only re-order/refresh them.
    if (!this.cardCache) this.cardCache = new Map();

    // Search filters by name or element; sort defaults to level, then
    // stars, then rarity.
    const query = (this.rosterSearch.value || '').trim().toLowerCase();
    const p = (id) => GameState.progressOf(id);
    const byLevel = (a, b) =>
      p(b).level - p(a).level || p(b).stars - p(a).stars ||
      HEROES[b].rarity - HEROES[a].rarity || a.localeCompare(b);
    const powerOf = (id) => {
      const pr = p(id);
      return Progression.power(Gear.applyToStats(
        Progression.scaledStats(HEROES[id], pr.level, pr.stars),
        GameState.equippedPieces(id)));
    };
    // Favourites lead every sort order. They are not exempt from the
    // filters above — a favourite that the search or "hide maxed" drops
    // stays dropped; this only reorders what survived.
    const favoritesFirst = (cmp) => (a, b) =>
      (GameState.isFavorite(b) ? 1 : 0) - (GameState.isFavorite(a) ? 1 : 0) ||
      cmp(a, b);
    const SORTS = {
      power: (a, b) => powerOf(b) - powerOf(a) || byLevel(a, b),
      level: byLevel,
      stars: (a, b) => p(b).stars - p(a).stars || byLevel(a, b),
      rarity: (a, b) => HEROES[b].rarity - HEROES[a].rarity || byLevel(a, b),
      name: (a, b) => HEROES[a].name.localeCompare(HEROES[b].name),
      element: (a, b) =>
        (HEROES[a].element || '').localeCompare(HEROES[b].element || '') || byLevel(a, b),
    };
    const ids = GameState.ownedHeroIds()
      .filter((id) => HEROES[id])
      .filter((id) => {
        if (!query) return true;
        const h = HEROES[id];
        return h.name.toLowerCase().includes(query) ||
          (h.element || '').toLowerCase().includes(query);
      })
      // "Hide maxed": drop heroes at their level cap (the cards tagged
      // MAX). Team members stay visible so placements are never hidden.
      .filter((id) => {
        if (!this.hideMaxed.checked || inTeam.has(id)) return true;
        const pr = p(id);
        return pr.level < Progression.maxLevel(pr.stars);
      })
      .sort(favoritesFirst(SORTS[this.rosterSort.value] || SORTS.level));

    const frag = document.createDocumentFragment();
    for (const heroId of ids) {
      frag.appendChild(this.rosterCard(heroId, inTeam));
    }
    this.rosterEl.replaceChildren(frag);
  }

  // Portrait painting is deferred until a card comes near the viewport.
  // Each portrait decodes a sprite sheet and rasterizes a 192px bitmap on
  // the main thread; doing that for a 300-hero roster up front stalled
  // startup for seconds, nearly all of it for cards scrolled far out of
  // sight. Once painted a card is left alone — the bitmap is cached and
  // the card node is reused across rebuilds.
  watchPortrait(card) {
    if (typeof IntersectionObserver === 'undefined') {
      card._painted = true;
      Sprites.paintPortrait(card._portrait, HEROES[card.dataset.heroId]);
      return;
    }
    if (!this._portraitObs) {
      this._portraitObs = new IntersectionObserver((entries, obs) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          obs.unobserve(e.target);
          if (e.target._painted) continue;
          e.target._painted = true;
          Sprites.paintPortrait(e.target._portrait, HEROES[e.target.dataset.heroId]);
        }
      }, { rootMargin: '600px' }); // a couple of screens of headroom while scrolling
    }
    this._portraitObs.observe(card);
  }

  // One roster card, built once and refreshed in place afterwards.
  rosterCard(heroId, inTeam) {
    const def = HEROES[heroId];
    const progress = GameState.progressOf(heroId);
    let card = this.cardCache.get(heroId);
    if (!card) {
      card = document.createElement('div');
      card.className = 'roster-card';
      card.dataset.heroId = heroId;
      const portrait = document.createElement('canvas');
      portrait.width = 64;
      portrait.height = 64;
      portrait.className = 'portrait';
      // Painted from a cached bitmap — drawn once per hero, not per
      // refresh — and only once the card is near the viewport. See
      // portraitObserver().
      card._portrait = portrait;
      this.watchPortrait(card);
      const name = document.createElement('div');
      name.className = 'card-name';
      name.textContent = `${Elements.badge(def.element)} ${def.name}`.trim();
      const stars = document.createElement('div');
      stars.className = `card-stars rarity-${def.rarity}`;
      const level = document.createElement('div');
      level.className = 'card-level';
      const badge = document.createElement('div');
      badge.className = 'card-badge';
      badge.textContent = 'IN TEAM';
      const dupes = document.createElement('div');
      dupes.className = 'card-copies';
      const up = document.createElement('div');
      up.className = 'card-starup';
      up.title = 'Ready to star up!';
      up.textContent = '★⬆';
      const fav = document.createElement('button');
      fav.className = 'card-fav';
      fav.type = 'button';
      // Its own click target inside a clickable card: swallow the event
      // so favouriting never doubles as selecting.
      fav.addEventListener('click', (e) => {
        e.stopPropagation();
        GameState.toggleFavorite(heroId);
        this.buildRoster();   // re-sort so it moves immediately
      });
      card.append(portrait, name, stars, level, badge, dupes, up, fav);
      card.addEventListener('click', () => this.selectHero(heroId, 'roster'));
      card._parts = { stars, level, badge, dupes, up, fav };
      this.cardCache.set(heroId, card);
    }
    // Refresh the parts that actually change.
    const { stars, level, badge, dupes, up, fav } = card._parts;
    const favorited = GameState.isFavorite(heroId);
    fav.textContent = favorited ? '★' : '☆';
    fav.classList.toggle('on', favorited);
    fav.title = favorited
      ? `Unfavourite ${def.name} — stops pinning them to the top`
      : `Favourite ${def.name} — pins them to the top of the roster`;
    fav.setAttribute('aria-pressed', favorited ? 'true' : 'false');
    card.classList.toggle('selected',
      !!this.selection && this.selection.heroId === heroId);
    stars.textContent = progress.stars <= 5
      ? '★'.repeat(progress.stars) : `${progress.stars}★`;
    const capped = progress.level >= Progression.maxLevel(progress.stars);
    level.textContent = `Lv ${progress.level}${capped ? ' (MAX)' : ''}`;
    level.classList.toggle('card-level-max', capped);
    badge.classList.toggle('hidden', !inTeam.has(heroId));
    const copies = GameState.copiesOf(heroId);
    dupes.textContent = `×${copies}`;
    dupes.classList.toggle('hidden', copies <= 1);
    up.classList.toggle('hidden', !GameState.canStarUp(heroId));
    return card;
  }

  // Roster report: with hundreds of heroes owned, "who should I invest
  // in?" has no answer on a wall of cards. This ranks what you own by
  // current power, names the best hero per element and per race (which
  // is what team-building actually asks), and flags the fielded team's
  // weakest link.
  renderReport() {
    const ids = GameState.ownedHeroIds().filter((id) => HEROES[id]);
    if (ids.length === 0) {
      this.reportEl.innerHTML = '<div class="details-empty">No heroes yet.</div>';
      return;
    }
    const rows = ids.map((id) => {
      const pr = GameState.progressOf(id);
      const stats = Gear.applyToStats(
        Progression.scaledStats(HEROES[id], pr.level, pr.stars),
        GameState.equippedPieces(id));
      const gearCount = Object.keys(GameState.equipmentOf(id)).length;
      return {
        id, def: HEROES[id], pr, stats, gearCount,
        power: Progression.power(stats),
        // Ceiling if fully invested at this star tier: shows headroom.
        potential: Progression.power(
          Progression.scaledStats(HEROES[id], Progression.maxLevel(pr.stars), pr.stars)),
      };
    }).sort((a, b) => b.power - a.power);

    const top = rows.slice(0, 10);
    const bestBy = (keyFn, label) => {
      const best = {};
      for (const r of rows) {
        const k = keyFn(r);
        if (!k) continue;
        if (!best[k] || r.power > best[k].power) best[k] = r;
      }
      return Object.entries(best)
        .sort((a, b) => b[1].power - a[1].power)
        .map(([k, r]) => `<div class="report-row">
          <span class="report-key">${label(k)}</span>
          <span class="report-name">${r.def.name}</span>
          <span class="report-power">${r.power.toLocaleString()}</span>
        </div>`).join('');
    };

    // Where the deployed team is thin.
    const team = Object.values(GameState.getTeam()).filter((id) => HEROES[id]);
    const teamRows = rows.filter((r) => team.includes(r.id))
      .sort((a, b) => a.power - b.power);
    const bench = rows.filter((r) => !team.includes(r.id));
    let advice = '<div class="report-note">Deploy a team to see suggestions.</div>';
    if (teamRows.length && bench.length) {
      const weakest = teamRows[0];
      const better = bench.find((r) => r.power > weakest.power * 1.15);
      advice = better
        ? `<div class="report-note">Weakest fielded hero: <b>${weakest.def.name}</b>
             (${weakest.power.toLocaleString()}). <b>${better.def.name}</b>
             (${better.power.toLocaleString()}) is stronger and on the bench.</div>`
        : `<div class="report-note">Your fielded team is your strongest available —
             the bench has nothing better than <b>${weakest.def.name}</b>.</div>`;
    }
    // Heroes carrying no gear at all are the cheapest power on offer.
    const naked = rows.filter((r) => r.gearCount === 0).length;
    const underGeared = rows.slice(0, 20).filter((r) => r.gearCount < 6);

    this.reportEl.innerHTML = `
      <div class="report-grid">
        <div class="report-card">
          <div class="report-title">Strongest heroes</div>
          ${top.map((r, i) => `<div class="report-row">
            <span class="report-key">${i + 1}.</span>
            <span class="report-name">${Elements.badge(r.def.element)} ${r.def.name}</span>
            <span class="report-power">${r.power.toLocaleString()}</span>
            <span class="report-sub">Lv ${r.pr.level} · ${r.gearCount}/6 gear</span>
          </div>`).join('')}
        </div>
        <div class="report-card">
          <div class="report-title">Best per element</div>
          ${bestBy((r) => r.def.element, (k) => `${Elements.badge(k)} ${RACES.ELEMENT_NAMES[k] || k}`)}
          <div class="report-title" style="margin-top:10px">Best per race</div>
          ${bestBy((r) => RACES.of(r.def), (k) => RACES.NAMES[k] || k)}
        </div>
        <div class="report-card">
          <div class="report-title">Where to invest</div>
          ${advice}
          <div class="report-note">${rows.length} heroes owned ·
            ${naked} wearing no gear at all.</div>
          ${underGeared.length ? `<div class="report-note">Cheapest gains — top heroes with
            empty slots: ${underGeared.slice(0, 5).map((r) =>
              `<b>${r.def.name}</b> (${r.gearCount}/6)`).join(', ')}.</div>` : ''}
          ${top[0] && top[0].potential > top[0].power * 1.2
            ? `<div class="report-note"><b>${top[0].def.name}</b> is at
               ${Math.round((top[0].power / top[0].potential) * 100)}% of this star
               tier's ceiling — levelling pays before summoning does.</div>` : ''}
        </div>
      </div>`;
  }

  // ---- Selection & placement ---------------------------------------------

  selectHero(heroId, from) {
    this.gearMsg = null;
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

    // Abilities with skill levels: each level past 1 adds +10% power.
    // Skill Tomes come only from Endless Tower milestone chests.
    const abilitiesHtml = def.abilities.map((a, i) => {
      const cd = a.cooldown > 0 ? `CD ${a.cooldown}` : 'No CD';
      const icon = a.icon
        ? `<img class="detail-icon" src="${Sprites.assetUrl(a.icon)}" alt="">`
        : '';
      const lv = GameState.skillLevel(def.id, i);
      const maxed = lv >= Progression.MAX_SKILL_LEVEL;
      const bonus = Math.round((Progression.skillPower(lv) - 1) * 100);
      const powerText = bonus > 0 ? ` · +${bonus}% power` : '';
      const upBtn = maxed
        ? '<span class="skill-max">MAX</span>'
        : `<button class="skill-up-btn" data-idx="${i}"
             title="Spend Skill Tomes (Endless Tower drops) for +10% power"
             ${GameState.tomes >= Progression.skillUpCost(lv) ? '' : 'disabled'}>
             ▲ ${Progression.skillUpCost(lv)} 📖</button>`;
      return `<div class="detail-ability">${icon}<b>${a.name}</b>
        <span class="cd">Lv ${lv}/${Progression.MAX_SKILL_LEVEL} · ${cd}${powerText}</span>
        ${upBtn}<br>${a.description}</div>`;
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
    // panel (level/polish + enchant) and set bonuses. A hero currently
    // fighting has their loadout frozen.
    const gearLocked = this.app.heroInBattle(def.id);
    const equipment = GameState.equipmentOf(def.id);
    if (!this.gearFocus || !equipment[this.gearFocus]) {
      this.gearFocus = Gear.SLOTS.find((s) => equipment[s]) || null;
    }
    // Rate every option against THIS hero, so the picker says which
    // piece is actually an upgrade instead of just listing numbers.
    const baseStats = Progression.scaledStats(def, progress.level, progress.stars);
    const gearRows = Gear.SLOTS.map((slot) => {
      const uid = equipment[slot];
      const piece = uid ? GameState.gearById(uid) : null;
      const wornScore = Gear.scoreFor(piece, baseStats);
      const delta = (p) => {
        if (!piece) return ' (+new)';
        const d = Gear.scoreFor(p, baseStats) - wornScore;
        if (Math.abs(d) < wornScore * 0.005) return ' (=)';
        const pct = wornScore > 0 ? Math.round((d / wornScore) * 100) : 100;
        return d > 0 ? ` (▲${pct}%)` : ` (▼${-pct}%)`;
      };
      const options = [`<option value="">— empty —</option>`];
      if (piece) {
        options.push(`<option value="${piece.uid}" selected>${Gear.describe(piece)}${piece.locked ? ' 🔒' : ''}</option>`);
      }
      for (const p of GameState.unequippedGear(slot)) {
        options.push(`<option value="${p.uid}">${Gear.describe(p)}${delta(p)}${p.locked ? ' 🔒' : ''}</option>`);
      }
      const iconSrc = piece ? Gear.icon(piece) : null;
      const iconHtml = iconSrc
        ? `<img class="detail-icon" src="${Sprites.assetUrl(iconSrc)}" alt="">`
        : '<span class="gear-slot-empty"></span>';
      const focused = slot === this.gearFocus ? ' gear-row-focused' : '';
      const lock = gearLocked ? ' gear-locked' : '';
      return `
        <div class="gear-row${focused}${lock}" data-slot="${slot}">
          ${iconHtml}<span class="gear-slot-name">${Gear.SLOT_LABELS[slot]}</span>
          <select class="gear-select" data-slot="${slot}" ${gearLocked ? 'disabled' : ''}>${options.join('')}</select>
        </div>`;
    }).join('') + (gearLocked
      ? '<div class="gear-locked-note">⚔ In battle — gear is locked until the fight ends.</div>'
      : '');

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
      if (count === 0) return '';
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
      ${gearLocked ? '' : `<button id="auto-equip-btn" class="panel-btn gear-auto-btn"
        title="Fit the best unworn pieces to this hero. Locked gear stays put; nobody else is undressed.">⚙ Auto-equip</button>`}
      ${gearRows}
      ${this.gearMsg ? `<div class="gear-auto-msg">${this.gearMsg}</div>` : ''}
      ${gearDetailHtml}
      ${setBonusHtml}
      <div class="detail-section">Abilities <span class="cd">(📖 ${GameState.tomes} tomes)</span></div>
      ${abilitiesHtml}
      <div class="detail-section">Passive</div>
      <div class="detail-ability">${def.passive.icon ? `<img class="detail-icon" src="${Sprites.assetUrl(def.passive.icon)}" alt="">` : ''}<b>${def.passive.name}</b><br>${def.passive.description}</div>
      <div class="detail-section">Positional bonus</div>
      <div class="detail-ability ${bonusLive ? 'bonus-live' : ''}">
        ${def.positional.name ? `<b>${def.positional.name}</b><br>` : ''}${def.positional.description}
        ${bonusLive ? '<br><b>★ Active in current slot</b>' : ''}
      </div>
      ${starUpHtml}
      ${slotIndex !== null ? '<button id="remove-hero-btn" class="panel-btn danger">Remove from team</button>' : ''}
    `;

    const autoBtn = document.getElementById('auto-equip-btn');
    if (autoBtn) {
      autoBtn.addEventListener('click', () => {
        const n = GameState.autoEquip(def.id);
        this.gearMsg = n > 0
          ? `Auto-equip: ${n} slot${n > 1 ? 's' : ''} upgraded.`
          : 'Auto-equip: already wearing the best available.';
        this.refresh();
      });
    }

    const removeBtn = document.getElementById('remove-hero-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        GameState.clearTeamSlot(slotIndex);
        this.selection = null;
        this.refresh();
      });
    }

    this.detailsEl.querySelectorAll('.skill-up-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (GameState.upgradeSkill(def.id, Number(btn.dataset.idx))) this.refresh();
      });
    });

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
