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
    // Storage: the roster grid doubles as the vault view. Clicking a
    // stored hero inspects them in the details panel; the ▲ on the card
    // (or the panel's Withdraw button) returns them to the roster, and
    // depositing lives on the roster hero's detail.
    this.storageView = false;
    this.storageBtn = document.getElementById('storage-btn');
    if (this.storageBtn) {
      this.storageBtn.addEventListener('click', () => {
        this.storageView = !this.storageView;
        this.rosterMsg = null;
        // A vault inspection has nothing to point at back in the roster.
        if (!this.storageView && this.selection && this.selection.from === 'storage') {
          this.selection = null;
        }
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
    this.clearBtn.addEventListener('click', () => {
      GameState.clearTeam();
      this.selection = null;
      this.refresh();
    });

    // ---- Team presets ----
    // Named snapshots of the formation, so the campaign team and the
    // boss team are one click apart instead of rebuilt by hand.
    this.presetSel = document.getElementById('preset-select');
    this.presetMsg = document.getElementById('preset-msg');
    const saveBtn = document.getElementById('preset-save');
    const loadBtn = document.getElementById('preset-load');
    const delBtn = document.getElementById('preset-delete');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        if (GameState.teamSize() === 0) {
          this.presetNote('Place a hero first — there is nothing to save.');
          return;
        }
        const suggested = this.presetSel.value || `Team ${GameState.presets().length + 1}`;
        const name = prompt('Name this formation:', suggested);
        if (name === null) return;
        const saved = GameState.savePreset(name);
        if (!saved) {
          this.presetNote(GameState.presets().length >= GameState.MAX_PRESETS
            ? `All ${GameState.MAX_PRESETS} preset slots are full — delete one first.`
            : 'That name is empty.');
          return;
        }
        this.buildPresetOptions(saved);
        this.presetNote(`Saved "${saved}" — ${GameState.teamSize()} heroes.`);
      });
    }
    if (loadBtn) {
      loadBtn.addEventListener('click', () => {
        const name = this.presetSel.value;
        if (!name) return;
        const r = GameState.loadPreset(name);
        if (!r) return;
        this.selection = null;
        this.refresh();
        this.presetNote(r.missing
          ? `Loaded "${name}" — ${r.placed} placed, ${r.missing} no longer owned.`
          : `Loaded "${name}".`);
      });
    }
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        const name = this.presetSel.value;
        if (!name) return;
        if (!confirm(`Delete the formation "${name}"?`)) return;
        GameState.deletePreset(name);
        this.buildPresetOptions();
        this.presetNote(`Deleted "${name}".`);
      });
    }
    this.buildPresetOptions();
  }

  presetNote(text) {
    if (this.presetMsg) this.presetMsg.textContent = text;
  }

  // Rebuild the preset picker, keeping `select` chosen when it survives.
  buildPresetOptions(select = null) {
    if (!this.presetSel) return;
    const presets = GameState.presets();
    const keep = select || this.presetSel.value;
    this.presetSel.innerHTML = presets.length
      ? presets.map((p) =>
        `<option value="${p.name}">${p.name} (${Object.keys(p.team).length})</option>`).join('')
      : '<option value="">No saved formations</option>';
    if (presets.some((p) => p.name === keep)) this.presetSel.value = keep;
    const empty = presets.length === 0;
    for (const id of ['preset-load', 'preset-delete']) {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = empty;
    }
  }

  // A hunt location is open when it has an enemy race AND the campaign
  // chapter set there has been reached. The campaign is the spine: you
  // hunt where you have already marched.
  async enter() {
    this.selection = null;
    this.buildPresetOptions();
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
      .filter((uid) => GameState.defOf(uid) && !this.animators.has(uid));
    await Promise.all(wanted.map(async (heroId) => {
      const sheet = await Sprites.getSheet(GameState.defOf(heroId));
      const player = new AnimationPlayer(sheet);
      player.play('idle');
      player.elapsed = Math.random() * 0.5;
      this.animators.set(heroId, player);
    }));
  }

  refresh() {
    // The repaint below can tear out the scroll anchor (see swapGrid)
    // and the details panel can change the page's height; both read to
    // the player as the page snapping to the top. Pin the scroll across
    // the whole repaint — scrollTo clamps if the page got shorter.
    const pageY = window.scrollY;
    this.buildRoster();
    this.updateDetails();
    this.updateButtons();
    // The team may have changed since the last paint; anything newly
    // placed needs a player. Cheap when nothing has.
    this.ensureAnimators();
    if (window.scrollY !== pageY) window.scrollTo(0, pageY);
  }

  updateButtons() {
    const size = GameState.teamSize();
    const power = GameState.teamPower();
    this.teamCountEl.textContent = `${size}/7 heroes placed` +
      (size ? ` · ${power.toLocaleString()} power` : '');
    this.renderPartyBonuses();
  }

  // What the party as placed is earning, and what the next hero of an
  // element would add. Shown here rather than on a hero card because it
  // is a fact about the FORMATION -- and because the whole point of the
  // 2/3/4 thresholds is that you can see a second element come within
  // reach while you are still arranging the first.
  renderPartyBonuses() {
    const el = document.getElementById('party-bonuses');
    if (!el) return;
    const defs = Object.values(GameState.getTeam())
      .map((uid) => GameState.defOf(uid)).filter(Boolean);
    const groups = RACES.previewParty(defs);
    if (groups.length === 0) {
      el.innerHTML = '';
      el.classList.add('hidden');
      return;
    }
    el.classList.remove('hidden');
    const info = typeof Elements !== 'undefined' ? Elements.info : null;
    el.innerHTML = groups.map((grp) => {
      const colour = info && info(grp.element) ? info(grp.element).color : '';
      const rows = grp.tiers.map((t) =>
        `<div class="pb-tier${t.earned ? ' pb-live' : ''}">` +
        `<span class="pb-need">${t.count}</span>` +
        `<span class="pb-name">${t.name}</span>` +
        `<span class="pb-what">${t.label}</span></div>`).join('');
      const earned = grp.tiers.filter((t) => t.earned).length;
      return `<div class="pb-group${earned ? ' pb-group-live' : ''}">
        <div class="pb-head"${colour ? ` style="color:${colour}"` : ''}>
          ${grp.name} <span class="pb-count">${grp.count} fielded</span></div>
        ${rows}</div>`;
    }).join('');
  }

  // ---- Roster panel ------------------------------------------------------

  buildRoster() {
    // One-line result note for bulk actions (star-up-all).
    const msgEl = document.getElementById('roster-msg');
    if (msgEl) {
      msgEl.textContent = this.rosterMsg || '';
      msgEl.classList.toggle('hidden', !this.rosterMsg);
    }
    // Roster capacity, on the bar everyone actually looks at.
    const capEl = document.getElementById('roster-cap');
    if (capEl) {
      const n = GameState.rosterCount();
      capEl.textContent = `${n} / ${GameState.MAX_ROSTER}`;
      capEl.classList.toggle('roster-cap-full', n >= GameState.MAX_ROSTER);
    }
    if (this.storageBtn) {
      this.storageBtn.textContent = this.storageView
        ? '← Back to roster'
        : `🏛 Storage ${GameState.storageCount()} / ${GameState.MAX_STORAGE}`;
      this.storageBtn.classList.toggle('storage-open', this.storageView);
    }
    if (this.storageView) { this.buildStorage(); return; }
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
      GameState.defOf(b).rarity - GameState.defOf(a).rarity || a.localeCompare(b);
    const powerOf = (id) => {
      const pr = p(id);
      return Progression.power(Gear.applyToStats(
        Progression.scaledStats(GameState.defOf(id), pr.level, pr.stars),
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
      rarity: (a, b) => GameState.defOf(b).rarity - GameState.defOf(a).rarity || byLevel(a, b),
      name: (a, b) => GameState.defOf(a).name.localeCompare(GameState.defOf(b).name),
      element: (a, b) =>
        (GameState.defOf(a).element || '').localeCompare(GameState.defOf(b).element || '') || byLevel(a, b),
    };
    const ids = GameState.ownedHeroIds()
      .filter((id) => GameState.defOf(id))
      .filter((id) => {
        if (!query) return true;
        const h = GameState.defOf(id);
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
    this.swapGrid(frag);
  }

  // Swapping the whole grid in one replaceChildren tears out the
  // browser's scroll anchor (on a real click that includes the focused
  // card), which Chrome answers by snapping the page to the top. Pin
  // the scroll across the swap so storing or re-sorting a hero deep in
  // the list leaves the page where the player was.
  swapGrid(frag) {
    const pageY = window.scrollY;
    const gridY = this.rosterEl.scrollTop;
    this.rosterEl.replaceChildren(frag);
    this.rosterEl.scrollTop = gridY;
    if (window.scrollY !== pageY) window.scrollTo(0, pageY);
  }

  // The vault, drawn in the roster's grid. Cards are built fresh each
  // time (no cache): the vault is visited rarely. Clicking a card
  // inspects the hero in the details panel, same as the roster; the ▲
  // on the card (or the panel's button) withdraws.
  buildStorage() {
    const msgEl = document.getElementById('roster-msg');
    if (msgEl) {
      msgEl.textContent = this.rosterMsg ||
        `Stored heroes are out of play and hold no gear. Click one to inspect ` +
        `it; the ▲ (or the Withdraw button) returns it to the roster. To ` +
        `deposit, select a benched hero and use "Send to storage".`;
      msgEl.classList.remove('hidden');
    }
    const query = this.rosterSearch.value.trim().toLowerCase();
    const uids = GameState.storedHeroIds()
      .map((uid) => ({ uid, e: GameState.storedEntry(uid) }))
      .filter((r) => r.e && HEROES[r.e.heroId])
      .map((r) => ({ ...r, def: HEROES[r.e.heroId] }))
      .filter((r) => !query || r.def.name.toLowerCase().includes(query) ||
        (r.def.element || '').toLowerCase().includes(query))
      .sort((a, b) => (b.e.stars - a.e.stars) || (b.e.level - a.e.level) ||
        a.def.name.localeCompare(b.def.name));

    const frag = document.createDocumentFragment();
    for (const r of uids) {
      const card = document.createElement('div');
      card.className = 'roster-card stored-card';
      card.title = `Inspect ${r.def.name}`;
      if (this.selection && this.selection.heroId === r.uid) card.classList.add('selected');
      const portrait = document.createElement('canvas');
      portrait.width = 64; portrait.height = 64;
      portrait.className = 'portrait';
      Sprites.paintPortrait(portrait, r.def);
      const name = document.createElement('div');
      name.className = 'card-name';
      name.textContent = `${Elements.badge(r.def.element)} ${r.def.name}`.trim();
      const stars = document.createElement('div');
      stars.className = `card-stars rarity-${r.def.rarity}`;
      stars.innerHTML = Attune.starsHtml(r.e.stars, r.e.attune, r.def.element);
      const level = document.createElement('div');
      level.className = 'card-level';
      level.textContent = `Lv ${r.e.level}`;
      const up = document.createElement('button');
      up.className = 'card-store';
      up.type = 'button';
      up.textContent = '▲';
      up.title = `Withdraw ${r.def.name} to the roster`;
      const withdraw = () => {
        if (GameState.rosterFull()) {
          this.rosterMsg = 'The roster is full — make room before withdrawing.';
          this.buildRoster();
          return;
        }
        const res = GameState.withdraw(r.uid);
        this.rosterMsg = res ? `${r.def.name} returned to the roster.` : 'Could not withdraw.';
        // The uid survives the move, so an inspection in progress follows
        // the hero back to the roster instead of going stale.
        if (res && this.selection && this.selection.heroId === r.uid) {
          this.selection = { heroId: r.uid, from: 'roster' };
        }
        this.refresh();
      };
      up.addEventListener('click', (e) => { e.stopPropagation(); withdraw(); });
      card.append(portrait, name, stars, level, up);
      if (r.e.blessing && typeof Blessing !== 'undefined') {
        card.classList.add(`blessing-${r.e.blessing}`);
        card.insertAdjacentHTML('beforeend', Blessing.iconHtml(r.e.blessing));
      }
      // Clicking the card inspects, exactly like a roster card; only the
      // explicit ▲ (or the details panel's button) withdraws.
      card.addEventListener('click', () => this.selectHero(r.uid, 'storage'));
      frag.appendChild(card);
    }
    if (!uids.length) {
      const empty = document.createElement('div');
      empty.className = 'storage-empty';
      empty.textContent = query
        ? 'Nothing in storage matches.'
        : 'The vault is empty. Select a hero and use "Send to storage" to park them here.';
      frag.appendChild(empty);
    }
    this.swapGrid(frag);
  }

  // Portrait painting is deferred until a card comes near the viewport.
  // Each portrait decodes a sprite sheet and rasterizes a 192px bitmap on
  // the main thread; doing that for a 300-hero roster up front stalled
  // startup for seconds, nearly all of it for cards scrolled far out of
  // sight. Once painted a card is left alone — the bitmap is cached and
  // the card node is reused across rebuilds.
  watchPortrait(card) {
    const paint = (el) => {
      el._painted = true;
      Sprites.paintPortrait(el._portrait, GameState.defOf(el.dataset.heroId))
        .then((real) => {
          // A failed fetch painted stand-in art; let the next rebuild
          // retry so a network blip never sticks for the session.
          if (!real) el._painted = false;
        });
    };
    if (typeof IntersectionObserver === 'undefined') {
      paint(card);
      return;
    }
    if (!this._portraitObs) {
      this._portraitObs = new IntersectionObserver((entries, obs) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          obs.unobserve(e.target);
          if (e.target._painted) continue;
          paint(e.target);
        }
      }, { rootMargin: '600px' }); // a couple of screens of headroom while scrolling
    }
    this._portraitObs.observe(card);
  }

  // One roster card, built once and refreshed in place afterwards.
  rosterCard(heroId, inTeam) {
    const def = GameState.defOf(heroId);
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
      const store = document.createElement('button');
      store.className = 'card-store';
      store.type = 'button';
      store.textContent = '▼';
      store.title = `Send ${def.name} to storage — gear returns to the inventory`;
      store.addEventListener('click', (e) => {
        e.stopPropagation();
        const r = GameState.deposit(heroId);
        this.rosterMsg = r
          ? `${def.name} sent to storage` +
            (r.gearFreed ? ` — ${r.gearFreed} piece${r.gearFreed > 1 ? 's' : ''} of gear returned.` : '.')
          : 'Could not store this hero.';
        if (this.selection && this.selection.heroId === heroId) this.selection = null;
        this.refresh();
      });
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
      card.append(portrait, name, stars, level, badge, fav, store);
      // Blessed/Godtouched copies: the mark is permanent to the uid, so
      // it is stamped once at build time — a pulsing portrait glow plus
      // the kind's glyph on the card.
      if (progress.blessing && typeof Blessing !== 'undefined') {
        card.classList.add(`blessing-${progress.blessing}`);
        card.insertAdjacentHTML('beforeend', Blessing.iconHtml(progress.blessing));
      }
      card.addEventListener('click', () => this.selectHero(heroId, 'roster'));
      card._parts = { stars, level, badge, fav, store };
      this.cardCache.set(heroId, card);
    }
    // Refresh the parts that actually change.
    // A card whose last paint fell back to stand-in art (asset fetch
    // failed) gets watched again, so the real sprite lands on the next
    // rebuild instead of sticking for the session.
    if (!card._painted) this.watchPortrait(card);
    const { stars, level, badge, fav, store } = card._parts;
    const favorited = GameState.isFavorite(heroId);
    fav.textContent = favorited ? '★' : '☆';
    fav.classList.toggle('on', favorited);
    fav.title = favorited
      ? `Unfavourite ${def.name} — stops pinning them to the top`
      : `Favourite ${def.name} — pins them to the top of the roster`;
    fav.setAttribute('aria-pressed', favorited ? 'true' : 'false');
    card.classList.toggle('selected',
      !!this.selection && this.selection.heroId === heroId);
    // Attuned stars burn in their element's colour, so the card says how
    // far a hero has come on both axes at a glance.
    stars.innerHTML = Attune.starsHtml(progress.stars, progress.attune, def.element);
    const capped = progress.level >= Progression.maxLevel(progress.stars);
    level.textContent = `Lv ${progress.level}${capped ? ' (MAX)' : ''}`;
    level.classList.toggle('card-level-max', capped);
    badge.classList.toggle('hidden', !inTeam.has(heroId));
    // Fielded heroes cannot be deposited, and a full vault takes nobody.
    store.classList.toggle('hidden', inTeam.has(heroId) || GameState.storageFull());
    return card;
  }

  // Roster report: with hundreds of heroes owned, "who should I invest
  // in?" has no answer on a wall of cards. This ranks what you own by
  // current power, names the best hero per element and per race (which
  // is what team-building actually asks), and flags the fielded team's
  // weakest link.
  renderReport() {
    const ids = GameState.ownedHeroIds().filter((id) => GameState.defOf(id));
    if (ids.length === 0) {
      this.reportEl.innerHTML = '<div class="details-empty">No heroes yet.</div>';
      return;
    }
    const rows = ids.map((id) => {
      const pr = GameState.progressOf(id);
      const stats = Gear.applyToStats(
        Progression.scaledStats(GameState.defOf(id), pr.level, pr.stars),
        GameState.equippedPieces(id));
      const gearCount = Object.keys(GameState.equipmentOf(id)).length;
      return {
        id, def: GameState.defOf(id), pr, stats, gearCount,
        power: Progression.power(stats),
        // Ceiling if fully invested at this star tier: shows headroom.
        potential: Progression.power(
          Progression.scaledStats(GameState.defOf(id), Progression.maxLevel(pr.stars), pr.stars)),
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
    const team = Object.values(GameState.getTeam()).filter((id) => GameState.defOf(id));
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
            <span class="report-key report-rank">${i + 1}.</span>
            <span class="report-name">${Elements.badge(r.def.element)} ${r.def.name}</span>
            <span class="report-power">${r.power.toLocaleString()}</span>
            <span class="report-sub">Lv ${r.pr.level} · ${r.gearCount}/6 gear</span>
          </div>`).join('')}
        </div>
        <div class="report-card">
          <div class="report-title">Best per element</div>
          ${bestBy((r) => r.def.element, (k) =>
    `${Elements.badge(k)} ${(Elements.info(k) || {}).name || k}`)}
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

  // The full stat block for a hero detail panel: the four primaries,
  // then the secondaries every build actually turns on — crit, crit
  // damage, accuracy, resistance, dodge. `stats` may or may not have
  // been through Gear.applyToStats; bare scaled stats fall back to the
  // engine's baselines (15% crit, 150% crit damage, 0 for the rest).
  fullStatsHtml(stats) {
    const pct = (v) => {
      const n = Math.round((v || 0) * 1000) / 10;
      return `${Number.isInteger(n) ? n : n.toFixed(1)}%`;
    };
    const n = (v) => Math.round(v || 0).toLocaleString();
    return `
      <div class="detail-stats">
        HP ${n(stats.hp)} · ATK ${n(stats.atk)} · DEF ${n(stats.def)} · SPD ${n(stats.speed)}
      </div>
      <div class="detail-stats detail-stats-sub">
        CRIT ${pct(stats.critChance ?? 0.15)} ·
        CRIT DMG ${pct(stats.critDamage ?? 1.5)} ·
        ACC ${pct(stats.accuracy)} ·
        RES ${pct(stats.resistance)} ·
        DODGE ${pct(stats.dodge)}
      </div>`;
  }

  // Gear loadouts: named snapshots of a hero's eight slots, in the same
  // shape as the formation presets above the roster, because they solve
  // the same problem one level down.
  loadoutHtml(uid) {
    const saved = GameState.loadoutsOf(uid);
    const options = saved.length
      ? saved.map((l) =>
        `<option value="${l.name}">${l.name} (${l.pieces})</option>`).join('')
      : '<option value="">No saved loadouts</option>';
    return `
      <div class="loadout-row">
        <span class="loadout-label" title="Save this hero's whole kit under a name and put it back on in one click">Kit:</span>
        <select id="loadout-select" ${saved.length ? '' : 'disabled'}>${options}</select>
        <button id="loadout-load" class="panel-btn" ${saved.length ? '' : 'disabled'}
          title="Wear this saved kit">Wear</button>
        <button id="loadout-save" class="panel-btn"
          title="Save the eight slots as they stand (up to ${GameState.MAX_LOADOUTS} per hero)">Save…</button>
        <button id="loadout-delete" class="panel-btn danger" ${saved.length ? '' : 'disabled'}
          title="Delete this saved kit">✕</button>
      </div>`;
  }

  wireLoadouts(uid) {
    const sel = document.getElementById('loadout-select');
    const on = (id, fn) => {
      const btn = document.getElementById(id);
      if (btn && !btn.disabled) btn.addEventListener('click', fn);
    };
    on('loadout-save', () => {
      const suggested = (sel && sel.value) || `Kit ${GameState.loadoutsOf(uid).length + 1}`;
      const name = prompt('Name this loadout:', suggested);
      if (name === null) return;
      const saved = GameState.saveLoadout(uid, name);
      this.gearMsg = saved
        ? `Saved loadout "${saved}".`
        : `All ${GameState.MAX_LOADOUTS} loadout slots are full — delete one first.`;
      this.refresh();
    });
    on('loadout-load', () => {
      if (!sel || !sel.value) return;
      const r = GameState.applyLoadout(uid, sel.value);
      this.gearMsg = !r ? 'That loadout could not be worn.'
        : r.missing
          ? `Wore "${sel.value}" — ${r.equipped} pieces on, ${r.missing} gone or in use.`
          : `Wore "${sel.value}" — ${r.equipped} pieces on.`;
      this.refresh();
    });
    on('loadout-delete', () => {
      if (!sel || !sel.value) return;
      if (!confirm(`Delete the loadout "${sel.value}"?`)) return;
      GameState.deleteLoadout(uid, sel.value);
      this.gearMsg = 'Loadout deleted.';
      this.refresh();
    });
  }

  updateDetails() {
    if (!this.selection) {
      this.detailsEl.innerHTML =
        '<div class="details-empty">Select a hero to see details.<br><br>' +
        'Click a roster hero, then a hex to place them.<br>' +
        'Click a placed hero, then another hex to move or swap.</div>';
      return;
    }
    if (this.selection.from === 'storage') { this.updateStorageDetails(); return; }

    const uid = this.selection.heroId;   // a roster uid, not a character id
    const def = GameState.defOf(uid);
    const slotIndex = GameState.teamSlotOf(uid);
    const placedSlot = slotIndex !== null ? this.slots[slotIndex] : null;
    const bonusLive = placedSlot && placedSlot.position === def.positional.position;

    // Abilities with skill levels. A reworked skill spends each level on
    // an explicit rung -- power, cooldown, debuff chance, duration (see
    // docs/skill-level-process.md); the rest still take the old blanket
    // +10%. Raised only by sacrificing another copy, over in Improve.
    const abilitiesHtml = def.abilities.map((a, i) => {
      const icon = a.icon
        ? `<img class="detail-icon" src="${Sprites.assetUrl(a.icon)}" alt="">`
        : '';
      const lv = GameState.skillLevel(uid, i);
      const cap = Progression.skillCap(a, i);
      const cdTurns = Progression.skillCooldown(a, lv);
      const cd = cdTurns > 0 ? `CD ${cdTurns}` : 'No CD';
      const maxed = lv >= cap;
      const bonusText = Progression.skillBonusText(a, lv);
      const powerText = bonusText ? ` · ${bonusText}` : '';
      return `<div class="detail-ability">${icon}<b>${a.name}</b>
        <span class="cd">Lv ${lv}/${cap} · ${cd}${powerText}</span>
        ${maxed ? '<span class="skill-max">MAX</span>' : ''}<br>${a.description}
        ${Progression.skillFactsHtml(a, lv)}</div>`;
    }).join('');

    // Progression: scaled stats (gear included), level/XP bar, star-up.
    const progress = GameState.progressOf(uid);
    const equipped = GameState.equippedPieces(uid);
    const stats = Gear.applyToStats(
      Progression.scaledStats(def, progress.level, progress.stars), equipped);
    const cap = Progression.maxLevel(progress.stars);
    const atCap = progress.level >= cap;
    const xpNeed = atCap ? 0 : Progression.xpToNext(progress.level);
    const xpPct = atCap ? 100 : Math.min(100, Math.round((progress.xp / xpNeed) * 100));
    const starsText = Attune.starsHtml(progress.stars, progress.attune, def.element);

    // Gear: one row per slot with an equip picker, plus a focused-piece
    // panel (level/polish + enchant) and set bonuses. A hero currently
    // fighting has their loadout frozen.
    const gearLocked = this.app.heroInBattle(uid);
    const equipment = GameState.equipmentOf(uid);
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

    this.detailsEl.innerHTML = `
      <div class="detail-name rarity-${def.rarity}">${Elements.badge(def.element)} ${def.name} <span class="detail-title">${def.title || ''}</span></div>
      ${def.element && Elements.info(def.element) ? `<div class="detail-element" style="color:${Elements.info(def.element).color}">${Elements.info(def.element).name} element</div>` : ''}
      ${RACES.sectOf(def) ? `<div class="detail-element detail-sect">${RACES.sectOf(def).name} Sect &middot; No. ${RACES.sectOf(def).number}</div>` : ''}
      ${Tags.html(def)}
      <div class="card-stars rarity-${def.rarity}">${starsText}</div>
      <div class="detail-level">
        Lv ${progress.level} / ${cap}${atCap ? ' <span class="card-level-max">(MAX)</span>' : ''}
        <span class="xp-text">${atCap ? 'Star up to raise the cap' : `XP ${progress.xp} / ${xpNeed}`}</span>
      </div>
      <div class="xp-bar"><div class="xp-fill" style="width:${xpPct}%"></div></div>
      ${this.fullStatsHtml(stats)}
      <div class="detail-section">Gear</div>
      ${gearLocked ? '' : `<button id="auto-equip-btn" class="panel-btn gear-auto-btn"
        title="Fit the best unworn pieces to this hero. Locked gear stays put; nobody else is undressed.">⚙ Auto-equip</button>`}
      ${gearLocked ? '' : this.loadoutHtml(uid)}
      ${gearRows}
      ${this.gearMsg ? `<div class="gear-auto-msg">${this.gearMsg}</div>` : ''}
      ${gearDetailHtml}
      ${setBonusHtml}
      <div class="detail-section">Abilities <span class="cd">(raised in Improve)</span></div>
      ${abilitiesHtml}
      <div class="detail-section">Passive</div>
      <div class="detail-ability">${def.passive.icon ? `<img class="detail-icon" src="${Sprites.assetUrl(def.passive.icon)}" alt="">` : ''}<b>${def.passive.name}</b><br>${def.passive.description}</div>
      <div class="detail-section">Positional bonus</div>
      <div class="detail-ability ${bonusLive ? 'bonus-live' : ''}">
        ${def.positional.name ? `<b>${def.positional.name}</b><br>` : ''}${def.positional.description}
        ${bonusLive ? '<br><b>★ Active in current slot</b>' : ''}
      </div>
      ${slotIndex !== null ? '<button id="remove-hero-btn" class="panel-btn danger">Remove from team</button>' : ''}
      <div class="detail-section">Storage</div>
      <button id="deposit-btn" class="panel-btn"
        ${slotIndex !== null || GameState.storageFull() ? 'disabled' : ''}
        title="${slotIndex !== null
          ? 'Fielded heroes cannot be stored — remove them from the team first.'
          : GameState.storageFull() ? 'The vault is full.'
          : 'Park this hero in the vault (' + GameState.storageCount() + '/' + GameState.MAX_STORAGE + '). Their gear is removed and returned to the inventory.'}">
        Send to storage
      </button>
    `;

    const autoBtn = document.getElementById('auto-equip-btn');
    if (autoBtn) {
      autoBtn.addEventListener('click', () => {
        const n = GameState.autoEquip(uid);
        this.gearMsg = n > 0
          ? `Auto-equip: ${n} slot${n > 1 ? 's' : ''} upgraded.`
          : 'Auto-equip: already wearing the best available.';
        this.refresh();
      });
    }
    this.wireLoadouts(uid);

    const depositBtn = document.getElementById('deposit-btn');
    if (depositBtn && !depositBtn.disabled) {
      depositBtn.addEventListener('click', () => {
        const r = GameState.deposit(uid);
        if (!r) { this.gearMsg = 'Could not store this hero.'; this.refresh(); return; }
        this.selection = null;
        this.rosterMsg = `${def.name} sent to storage` +
          (r.gearFreed ? ` — ${r.gearFreed} piece${r.gearFreed > 1 ? 's' : ''} of gear returned.` : '.');
        if (typeof Sound !== 'undefined') Sound.play('click');
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

    this.detailsEl.querySelectorAll('.gear-select').forEach((sel) => {
      sel.addEventListener('change', () => {
        if (sel.value) GameState.equipGear(uid, sel.value);
        else GameState.unequipGear(uid, sel.dataset.slot);
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

  // A stored hero's dossier: everything the roster view shows minus gear
  // (the vault strips it), with the one action that applies here —
  // withdrawing — in place of the roster's buttons.
  updateStorageDetails() {
    const uid = this.selection.heroId;
    const e = GameState.storedEntry(uid);
    const def = e && HEROES[e.heroId];
    if (!def) { this.selection = null; this.updateDetails(); return; }

    const stats = Progression.scaledStats(def, e.level, e.stars);
    const cap = Progression.maxLevel(e.stars);
    const atCap = e.level >= cap;
    const xpNeed = atCap ? 0 : Progression.xpToNext(e.level);
    const xpPct = atCap ? 100 : Math.min(100, Math.round((e.xp / xpNeed) * 100));
    const abilitiesHtml = def.abilities.map((a, i) => {
      const icon = a.icon
        ? `<img class="detail-icon" src="${Sprites.assetUrl(a.icon)}" alt="">`
        : '';
      const lv = (e.skills && e.skills[i]) || 1;
      const cap = Progression.skillCap(a, i);
      const cdTurns = Progression.skillCooldown(a, lv);
      const cd = cdTurns > 0 ? `CD ${cdTurns}` : 'No CD';
      const maxed = lv >= cap;
      const bonusText = Progression.skillBonusText(a, lv);
      const powerText = bonusText ? ` · ${bonusText}` : '';
      return `<div class="detail-ability">${icon}<b>${a.name}</b>
        <span class="cd">Lv ${lv}/${cap} · ${cd}${powerText}</span>
        ${maxed ? '<span class="skill-max">MAX</span>' : ''}<br>${a.description}
        ${Progression.skillFactsHtml(a, lv)}</div>`;
    }).join('');

    const full = GameState.rosterFull();
    this.detailsEl.innerHTML = `
      <div class="detail-name rarity-${def.rarity}">${Elements.badge(def.element)} ${def.name} <span class="detail-title">${def.title || ''}</span></div>
      ${def.element && Elements.info(def.element) ? `<div class="detail-element" style="color:${Elements.info(def.element).color}">${Elements.info(def.element).name} element</div>` : ''}
      ${RACES.sectOf(def) ? `<div class="detail-element detail-sect">${RACES.sectOf(def).name} Sect &middot; No. ${RACES.sectOf(def).number}</div>` : ''}
      ${Tags.html(def)}
      <div class="card-stars rarity-${def.rarity}">${Attune.starsHtml(e.stars, e.attune, def.element)}</div>
      <div class="detail-level">
        Lv ${e.level} / ${cap}${atCap ? ' <span class="card-level-max">(MAX)</span>' : ''}
        <span class="xp-text">${atCap ? 'Star up to raise the cap' : `XP ${e.xp} / ${xpNeed}`}</span>
      </div>
      <div class="xp-bar"><div class="xp-fill" style="width:${xpPct}%"></div></div>
      ${this.fullStatsHtml(stats)}
      <div class="detail-stats">🏛 In storage — out of play, holding no gear.</div>
      <div class="detail-section">Abilities <span class="cd">(raised in Improve)</span></div>
      ${abilitiesHtml}
      <div class="detail-section">Passive</div>
      <div class="detail-ability">${def.passive.icon ? `<img class="detail-icon" src="${Sprites.assetUrl(def.passive.icon)}" alt="">` : ''}<b>${def.passive.name}</b><br>${def.passive.description}</div>
      <div class="detail-section">Positional bonus</div>
      <div class="detail-ability">
        ${def.positional.name ? `<b>${def.positional.name}</b><br>` : ''}${def.positional.description}
      </div>
      <div class="detail-section">Storage</div>
      <button id="withdraw-btn" class="panel-btn gold" ${full ? 'disabled' : ''}
        title="${full
          ? 'The roster is full — make room before withdrawing.'
          : 'Return this hero to the roster (' + GameState.rosterCount() + '/' + GameState.MAX_ROSTER + ').'}">
        Withdraw to roster
      </button>
    `;

    const wBtn = document.getElementById('withdraw-btn');
    if (wBtn && !wBtn.disabled) {
      wBtn.addEventListener('click', () => {
        const res = GameState.withdraw(uid);
        if (!res) { this.rosterMsg = 'Could not withdraw.'; this.refresh(); return; }
        // Same uid, new home: keep them selected as a roster hero so the
        // panel flips straight to the full dossier, gear picker and all.
        this.selection = { heroId: uid, from: 'roster' };
        this.rosterMsg = `${def.name} returned to the roster.`;
        if (typeof Sound !== 'undefined') Sound.play('click');
        this.refresh();
      });
    }
  }

  // ---- Canvas rendering --------------------------------------------------

  update(dt) {
    for (const player of this.animators.values()) player.update(dt);
  }

  // Hex labels and hero names hold their size at whatever width the
  // board is displayed, instead of shrinking with it. See the matching
  // note in js/render.js.
  uiFont(px) {
    if (this._uiFor !== this.canvas.width) {
      this._uiFor = this.canvas.width;
      const shown = this.canvas.getBoundingClientRect().width || this.logicalW;
      this._ui = Math.min(1.8, Math.max(1, this.logicalW / shown));
    }
    return `${Math.round(px * this._ui)}px monospace`;
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
    const selDef = this.selection ? GameState.defOf(this.selection.heroId) : null;

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
      ctx.font = this.uiFont(9);
      ctx.textAlign = 'center';
      ctx.fillText(slot.position.toUpperCase(), slot.x, slot.y + 24);
    }

    // Placed heroes, back-to-front by row so front rows overlap correctly.
    const placed = this.slots
      .filter((slot) => team[slot.index] && GameState.defOf(team[slot.index]))
      .sort((a, b) => a.y - b.y);
    for (const slot of placed) {
      const heroId = team[slot.index];
      const def = GameState.defOf(heroId);
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
      if (animator) animator.draw(ctx, slot.x, yc, Sprites.facesLeft(def));

      const visualTop = yc - dh / 2 + ((sheet && sheet.headPad) || 0);
      ctx.fillStyle = '#bcd6ff';
      ctx.font = this.uiFont(10);
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
      ctx.font = this.uiFont(12);
      ctx.textAlign = 'center';
      ctx.fillText(
        this.selection.from === 'roster'
          ? `Placing ${GameState.defOf(this.selection.heroId).name} — click a hex`
          : `Moving ${GameState.defOf(this.selection.heroId).name} — click a destination hex`,
        this.logicalW / 2, 24
      );
    }
  }
}
