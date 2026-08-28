// Roster: the hero dossier.
//
// The Team screen answers "where does this hero stand"; this one answers
// "what is this hero". Those are different questions and they were
// sharing one very tall panel, so the roster grid, the gear picker, the
// skill readout and the progression bars all competed for the same
// column and the player scrolled past two of them to reach the third.
//
// Here the grid is dense and permanent on the left, and everything about
// the selected hero lives behind a rail of sub-tabs on the right, so
// switching what you are looking AT never moves what you are looking
// FROM. Deliberately no formation: a hex has no meaning without the
// board, and the board belongs to Team.
//
// The tab rail is data-driven (see PANELS) because more panels are
// coming into it -- star up, skill up and attunement are all still on
// their own screens.

class RosterScreen {
  constructor(app) {
    this.app = app;
    this.el = document.getElementById('screen-roster');
    this.gridEl = document.getElementById('ros-grid');
    this.emptyEl = document.getElementById('ros-empty');
    this.panelEl = document.getElementById('ros-panel');
    this.countEl = document.getElementById('ros-count');
    this.searchEl = document.getElementById('ros-search');
    this.sortEl = document.getElementById('ros-sort');
    this.tabsEl = document.getElementById('ros-tabs');

    this.selected = null;    // roster uid
    this.panel = 'info';     // which sub-tab is open
    this.skillIdx = 0;       // which skill the Skill panel is showing
    this.gearFocus = null;   // which gear slot the Gear panel expands
    this.message = '';       // one-line result note for gear actions
    this.cardCache = new Map();

    if (this.searchEl) this.searchEl.addEventListener('input', () => this.buildGrid());
    if (this.sortEl) this.sortEl.addEventListener('change', () => this.buildGrid());
    for (const tab of this.tabsEl.querySelectorAll('.ros-tab')) {
      tab.addEventListener('click', () => {
        this.panel = tab.dataset.panel;
        this.message = '';
        this.renderPanel();
      });
    }
  }

  // Open the screen on a particular hero, so other screens can link here.
  select(uid) {
    this.selected = uid;
    this.skillIdx = 0;
    this.gearFocus = null;
    this.message = '';
  }

  enter() { this.refresh(); }
  exit() {}
  update() {}
  draw() {}

  refresh() {
    // A hero that was sacrificed, stored or otherwise left the roster
    // cannot stay selected.
    if (this.selected && !GameState.defOf(this.selected)) this.selected = null;
    this.buildGrid();
    this.renderPanel();
  }

  // ---- left: the grid -------------------------------------------------

  sortedIds() {
    const query = (this.searchEl.value || '').trim().toLowerCase();
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
    const SORTS = {
      power: (a, b) => powerOf(b) - powerOf(a) || byLevel(a, b),
      level: byLevel,
      stars: (a, b) => p(b).stars - p(a).stars || byLevel(a, b),
      rarity: (a, b) => GameState.defOf(b).rarity - GameState.defOf(a).rarity || byLevel(a, b),
      name: (a, b) => GameState.defOf(a).name.localeCompare(GameState.defOf(b).name),
      element: (a, b) =>
        (GameState.defOf(a).element || '').localeCompare(GameState.defOf(b).element || '') ||
        byLevel(a, b),
    };
    // Favourites lead every order, exactly as they do on the Team
    // screen -- the same roster sorted two ways in two places would be
    // the tell that one of them is wrong.
    const favoritesFirst = (cmp) => (a, b) =>
      (GameState.isFavorite(b) ? 1 : 0) - (GameState.isFavorite(a) ? 1 : 0) || cmp(a, b);
    return GameState.ownedHeroIds()
      .filter((id) => GameState.defOf(id))
      .filter((id) => {
        if (!query) return true;
        const h = GameState.defOf(id);
        return h.name.toLowerCase().includes(query) ||
          (h.element || '').toLowerCase().includes(query);
      })
      .sort(favoritesFirst(SORTS[this.sortEl.value] || SORTS.power));
  }

  buildGrid() {
    const n = GameState.rosterCount();
    this.countEl.textContent = `${n} / ${GameState.MAX_ROSTER}`;
    this.countEl.classList.toggle('ros-count-full', n >= GameState.MAX_ROSTER);

    const ids = this.sortedIds();
    const frag = document.createDocumentFragment();
    for (const uid of ids) frag.appendChild(this.tile(uid));
    // Pin the scroll across the swap: replaceChildren tears out the
    // browser's scroll anchor, and a re-sort that jumps a long grid back
    // to the top loses the player's place for no reason.
    const top = this.gridEl.scrollTop;
    this.gridEl.replaceChildren(frag);
    this.gridEl.scrollTop = top;
    this.emptyEl.classList.toggle('hidden', ids.length > 0);
  }

  // One grid tile, built once and refreshed in place afterwards. The
  // portraits are the expensive part -- a few hundred canvases repainted
  // on every click is the one thing that makes this screen feel slow --
  // so nodes are cached by uid and only the parts that change are
  // rewritten.
  tile(uid) {
    const def = GameState.defOf(uid);
    let el = this.cardCache.get(uid);
    if (!el) {
      el = document.createElement('div');
      el.className = 'ros-tile';
      el.dataset.uid = uid;
      el.title = def.name;
      const portrait = document.createElement('canvas');
      portrait.width = 64;
      portrait.height = 64;
      portrait.className = 'ros-portrait';
      el._portrait = portrait;
      const stars = document.createElement('div');
      stars.className = `ros-tile-stars rarity-${def.rarity}`;
      const level = document.createElement('div');
      level.className = 'ros-tile-level';
      const fav = document.createElement('div');
      fav.className = 'ros-tile-fav';
      fav.textContent = '★';
      el.append(portrait, stars, level, fav);
      el.addEventListener('click', () => {
        this.selected = uid;
        this.skillIdx = 0;
        this.gearFocus = null;
        this.message = '';
        this.buildGrid();
        this.renderPanel();
      });
      el._parts = { stars, level, fav };
      this.watchPortrait(el);
      this.cardCache.set(uid, el);
    }
    if (!el._painted) this.watchPortrait(el);
    const pr = GameState.progressOf(uid);
    const { stars, level, fav } = el._parts;
    stars.innerHTML = Attune.starsHtml(pr.stars, pr.attune, def.element);
    const capped = pr.level >= Progression.maxLevel(pr.stars);
    level.textContent = pr.level;
    level.classList.toggle('ros-tile-level-max', capped);
    fav.classList.toggle('hidden', !GameState.isFavorite(uid));
    el.classList.toggle('selected', this.selected === uid);
    el.classList.toggle('in-team', GameState.teamSlotOf(uid) !== null);
    return el;
  }

  // Paint a tile's portrait only once it is near the viewport, and let a
  // failed asset fetch be retried on the next rebuild rather than
  // sticking as stand-in art for the session.
  watchPortrait(el) {
    const paint = (node) => {
      node._painted = true;
      Sprites.paintPortrait(node._portrait, GameState.defOf(node.dataset.uid))
        .then((real) => { if (!real) node._painted = false; });
    };
    if (typeof IntersectionObserver === 'undefined') { paint(el); return; }
    if (!this._obs) {
      this._obs = new IntersectionObserver((entries, obs) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          obs.unobserve(e.target);
          if (e.target._painted) continue;
          paint(e.target);
        }
      }, { rootMargin: '400px' });
    }
    this._obs.observe(el);
  }

  // ---- right: the sub-tabs -------------------------------------------

  renderPanel() {
    for (const tab of this.tabsEl.querySelectorAll('.ros-tab')) {
      tab.classList.toggle('active', tab.dataset.panel === this.panel);
    }
    if (!this.selected) {
      this.panelEl.innerHTML =
        '<div class="details-empty">Select a hero from the grid.</div>';
      return;
    }
    if (this.panel === 'skill') return this.renderSkill();
    if (this.panel === 'gear') return this.renderGear();
    return this.renderInfo();
  }

  header(uid) {
    const def = GameState.defOf(uid);
    const pr = GameState.progressOf(uid);
    const info = def.element && Elements.info(def.element);
    const sect = RACES.sectOf(def);
    return `
      <div class="ros-head">
        <div class="detail-name rarity-${def.rarity}">${Elements.badge(def.element)} ${def.name}
          <span class="detail-title">${def.title || ''}</span></div>
        <div class="card-stars rarity-${def.rarity}">${Attune.starsHtml(pr.stars, pr.attune, def.element)}</div>
        ${info ? `<div class="detail-element" style="color:${info.color}">${info.name} element</div>` : ''}
        ${sect ? `<div class="detail-element detail-sect">${sect.name} Sect &middot; No. ${sect.number}</div>` : ''}
      </div>`;
  }

  renderInfo() {
    const uid = this.selected;
    const def = GameState.defOf(uid);
    const pr = GameState.progressOf(uid);
    const equipped = GameState.equippedPieces(uid);
    const base = Progression.scaledStats(def, pr.level, pr.stars);
    const stats = Gear.applyToStats(base, equipped);
    const cap = Progression.maxLevel(pr.stars);
    const atCap = pr.level >= cap;
    const xpNeed = atCap ? 0 : Progression.xpToNext(pr.level);
    const xpPct = atCap ? 100 : Math.min(100, Math.round((pr.xp / xpNeed) * 100));
    const slot = GameState.teamSlotOf(uid);

    const n = (v) => Math.round(v || 0).toLocaleString();
    const pct = (v) => {
      const x = Math.round((v || 0) * 1000) / 10;
      return `${Number.isInteger(x) ? x : x.toFixed(1)}%`;
    };
    // Gear is shown as what it ADDED, not folded silently into the
    // total: "which of these numbers did I earn and which did I equip"
    // is the question a stat block on a gear screen is actually asked.
    const row = (label, now, was) => {
      const lift = Math.round(now) - Math.round(was);
      return `<div class="ros-stat"><span>${label}</span><b>${n(now)}</b>${
        lift ? `<i class="ros-stat-lift">${lift > 0 ? '+' : ''}${n(lift)}</i>` : '<i></i>'}</div>`;
    };
    const flat = (label, v) => `<div class="ros-stat"><span>${label}</span><b>${pct(v)}</b><i></i></div>`;

    this.panelEl.innerHTML = `
      ${this.header(uid)}
      ${Tags.html(def)}
      <div class="detail-level">
        Lv ${pr.level} / ${cap}${atCap ? ' <span class="card-level-max">(MAX)</span>' : ''}
        <span class="xp-text">${atCap ? 'Star up to raise the cap' : `XP ${pr.xp} / ${xpNeed}`}</span>
      </div>
      <div class="xp-bar"><div class="xp-fill" style="width:${xpPct}%"></div></div>
      <div class="ros-power">Power <b>${n(Progression.power(stats))}</b>${
        slot !== null ? '<span class="ros-fielded">Fielded</span>' : ''}</div>
      <div class="detail-section">Stats <span class="cd">(gear in green)</span></div>
      <div class="ros-stats">
        ${row('HP', stats.hp, base.hp)}
        ${row('ATK', stats.atk, base.atk)}
        ${row('DEF', stats.def, base.def)}
        ${row('SPD', stats.speed, base.speed)}
        ${flat('CRIT', stats.critChance ?? 0.15)}
        ${flat('CRIT DMG', stats.critDamage ?? 1.5)}
        ${flat('ACC', stats.accuracy)}
        ${flat('RES', stats.resistance)}
        ${flat('DODGE', stats.dodge)}
      </div>
      <div class="ros-note">Skills, passive and hex bonus are on the Skill tab.</div>`;
  }

  // The skill panel: a strip of skill buttons carrying their own level
  // over their cap, and under it the selected skill's ladder -- one line
  // per rung, lit for the ones bought and dim for the ones ahead. That
  // dim half is the point: a skill readout that only lists what you have
  // cannot answer "is the next copy worth it".
  // The whole kit, in strip order: the active skills, then the passive,
  // then the hex bonus. The last two used to be paragraphs at the bottom
  // of Info, which put the two halves of a hero's kit on two different
  // tabs -- and the half that never levels is exactly the half a player
  // forgets they own.
  kitEntries(uid) {
    const def = GameState.defOf(uid);
    const out = (def.abilities || []).map((a, i) => ({
      kind: 'active', def: a, idx: i, name: a.name,
      lv: GameState.skillLevel(uid, i), cap: Progression.skillCap(a, i),
    }));
    if (def.passive) out.push({ kind: 'passive', def: def.passive, name: def.passive.name });
    if (def.positional) {
      out.push({
        kind: 'positional', def: def.positional,
        name: def.positional.name || 'Hex bonus',
        position: def.positional.position,
      });
    }
    return out;
  }

  renderSkill() {
    const uid = this.selected;
    const def = GameState.defOf(uid);
    const kit = this.kitEntries(uid);
    if (this.skillIdx >= kit.length) this.skillIdx = 0;

    const strip = kit.map((e, i) => {
      // An active carries its level over its cap, the way the fight's own
      // skill buttons do. The other two carry what they ARE, because
      // neither has a number and both were previously unlabelled.
      let icon, badge, cls = '';
      if (e.kind === 'active') {
        icon = e.def.icon ? `<img src="${Sprites.assetUrl(e.def.icon)}" alt="">`
          : `<span class="ros-skill-glyph">${i + 1}</span>`;
        badge = `${e.lv}/${e.cap}`;
        if (e.lv >= e.cap) cls += ' maxed';
      } else if (e.kind === 'passive') {
        icon = e.def.icon ? `<img src="${Sprites.assetUrl(e.def.icon)}" alt="">`
          : Icons.svg('passive');
        badge = 'PASSIVE';
        cls += ' ros-skill-passive';
      } else {
        icon = Icons.svg(`hex-${e.position}`);
        badge = String(e.position || '').toUpperCase();
        cls += ' ros-skill-passive';
      }
      return `<button class="ros-skill-btn${i === this.skillIdx ? ' active' : ''}${cls}"
        data-idx="${i}" title="${e.name}">${icon}<span class="ros-skill-lv">${badge}</span></button>`;
    }).join('');

    const entry = kit[this.skillIdx];
    let body = '<div class="details-empty">This hero has no kit to show.</div>';
    if (entry && entry.kind !== 'active') {
      body = this.staticEntryHtml(uid, entry);
    } else if (entry) {
      const a = entry.def;
      // `entry.idx` and not `this.skillIdx`: the strip holds the passive
      // and the hex bonus too now, so a strip position stops being an
      // ability index the moment anything is inserted before the actives.
      const lv = GameState.skillLevel(uid, entry.idx);
      const cap = Progression.skillCap(a, entry.idx);
      const cdTurns = Progression.skillCooldown(a, lv);
      const rungs = (a.levelUps || []).slice(0, cap - 1);
      // Legacy skills carry no ladder at all -- they take the old
      // blanket +10% a level. Saying so beats printing an empty table
      // that reads as "levelling this does nothing".
      const ladder = rungs.length
        ? rungs.map((_, i) => {
          const at = i + 2;                    // rung 0 is the step to Lv.2
          const earned = lv >= at;
          return `<div class="ros-rung${earned ? ' earned' : ''}">
            <span class="ros-rung-lv">Lv.${at}</span>
            <span class="ros-rung-text">${Progression.rungText(a, i)}</span></div>`;
        }).join('')
        : `<div class="ros-rung earned"><span class="ros-rung-lv">Each</span>
           <span class="ros-rung-text">+10% power a level (up to Lv.${cap})</span></div>`;
      const pctDone = cap > 1 ? Math.round(((lv - 1) / (cap - 1)) * 100) : 100;

      body = `
        <div class="ros-skill-name">${a.name}
          ${lv >= cap ? '<span class="skill-max">MAX</span>' : ''}</div>
        <div class="ros-skill-meta">Lv ${lv} / ${cap} &middot; ${
          cdTurns > 0 ? `CD ${cdTurns}` : 'No cooldown'}</div>
        <div class="xp-bar"><div class="xp-fill" style="width:${pctDone}%"></div></div>
        <div class="ros-skill-desc">${a.description}</div>
        ${Progression.skillFactsHtml(a, lv)}
        <div class="detail-section">Skill ups</div>
        <div class="ros-ladder">${ladder}</div>
        <div class="ros-note">Raised by sacrificing another copy of ${def.name}, over in Improve.</div>`;
    }

    this.panelEl.innerHTML = `${this.header(uid)}
      <div class="ros-skill-strip">${strip}</div>
      ${body}`;

    for (const btn of this.panelEl.querySelectorAll('.ros-skill-btn')) {
      btn.addEventListener('click', () => {
        this.skillIdx = Number(btn.dataset.idx);
        this.renderSkill();
      });
    }
  }

  // The two halves of a kit that never level. They have no ladder and no
  // cooldown, so the panel says what they are and what they do -- and,
  // for a hex bonus, whether it is actually paying out right now, which
  // is the only thing about a positional a player ever gets wrong.
  staticEntryHtml(uid, entry) {
    const def = GameState.defOf(uid);
    const isHex = entry.kind === 'positional';
    let meta = 'Passive &middot; always on';
    let note = 'Passives cannot be levelled — this is the whole of it.';
    if (isHex) {
      const slotIndex = GameState.teamSlotOf(uid);
      const slot = slotIndex !== null && this.app.screens && this.app.screens.team
        ? (this.app.screens.team.slots || [])[slotIndex] : null;
      const live = slot && slot.position === entry.position;
      const where = String(entry.position || '').toUpperCase();
      meta = `Hex bonus &middot; pays out on a ${where} hex`;
      note = slotIndex === null
        ? 'Not fielded — place them on a ' + where.toLowerCase() +
          ' hex on the Team screen for this to pay.'
        : live
          ? '★ Active — they are standing on a ' + where.toLowerCase() + ' hex.'
          : 'Fielded, but not on a ' + where.toLowerCase() + ' hex, so this is paying nothing.';
    }
    return `
      <div class="ros-skill-name">${entry.name}</div>
      <div class="ros-skill-meta">${meta}</div>
      <div class="ros-skill-desc">${entry.def.description}</div>
      <div class="ros-note${isHex && /^★/.test(note) ? ' ros-note-live' : ''}">${note}</div>`;
  }

  renderGear() {
    const uid = this.selected;
    const def = GameState.defOf(uid);
    const pr = GameState.progressOf(uid);
    const locked = this.app.heroInBattle(uid);
    const equipment = GameState.equipmentOf(uid);
    if (!this.gearFocus || !equipment[this.gearFocus]) {
      this.gearFocus = Gear.SLOTS.find((s) => equipment[s]) || null;
    }
    // Every option is rated against THIS hero, so the picker says which
    // piece is an upgrade instead of leaving the player to compare
    // substats in their head.
    const baseStats = Progression.scaledStats(def, pr.level, pr.stars);
    const rows = Gear.SLOTS.map((slot) => {
      const wornUid = equipment[slot];
      const piece = wornUid ? GameState.gearById(wornUid) : null;
      const wornScore = Gear.scoreFor(piece, baseStats);
      const delta = (p) => {
        if (!piece) return ' (+new)';
        const d = Gear.scoreFor(p, baseStats) - wornScore;
        if (Math.abs(d) < wornScore * 0.005) return ' (=)';
        const pc = wornScore > 0 ? Math.round((d / wornScore) * 100) : 100;
        return d > 0 ? ` (▲${pc}%)` : ` (▼${-pc}%)`;
      };
      const options = ['<option value="">— empty —</option>'];
      if (piece) {
        options.push(`<option value="${piece.uid}" selected>${Gear.describe(piece)}${
          piece.locked ? ' 🔒' : ''}</option>`);
      }
      for (const p of GameState.unequippedGear(slot)) {
        options.push(`<option value="${p.uid}">${Gear.describe(p)}${delta(p)}${
          p.locked ? ' 🔒' : ''}</option>`);
      }
      const iconSrc = piece ? Gear.icon(piece) : null;
      const icon = iconSrc
        ? `<img class="detail-icon" src="${Sprites.assetUrl(iconSrc)}" alt="">`
        : '<span class="gear-slot-empty"></span>';
      return `<div class="gear-row${slot === this.gearFocus ? ' gear-row-focused' : ''}${
        locked ? ' gear-locked' : ''}" data-slot="${slot}">
        ${icon}<span class="gear-slot-name">${Gear.SLOT_LABELS[slot]}</span>
        <select class="gear-select" data-slot="${slot}" ${locked ? 'disabled' : ''}>${
          options.join('')}</select></div>`;
    }).join('');

    let focusHtml = '';
    const focusUid = this.gearFocus ? equipment[this.gearFocus] : null;
    const focus = focusUid ? GameState.gearById(focusUid) : null;
    if (focus) {
      const rar = Gear.RARITIES[focus.rarity];
      const base = Gear.baseStat(focus);
      const capLevel = Gear.maxLevel(focus);
      const subs = focus.subs.length
        ? focus.subs.map((s) => `<div class="set-bonus">${Gear.subLabel(s)}</div>`).join('')
        : '<div class="set-bonus">No substats yet</div>';
      focusHtml = `<div class="detail-ability gear-detail">
        <b style="color:${rar.color}">${Gear.pieceName(focus)}</b>
        <span class="cd">Lv ${focus.level}/${capLevel} · ${Gear.statText(base.stat, base.value)}</span>
        ${subs}
        <div class="set-bonus">Upgrade and salvage at the Blacksmith</div>
      </div>`;
    }

    const { setCounts } = Gear.aggregate(GameState.equippedPieces(uid));
    const sets = Object.values(Gear.SETS).map((set) => {
      const count = setCounts[set.id] || 0;
      if (count === 0) return '';
      const bonuses = set.bonuses.map((b) =>
        `<div class="set-bonus ${count >= b.pieces ? 'set-bonus-live' : ''}">${b.label}</div>`).join('');
      return `<div class="detail-ability"><b>${set.name} set (${count}/6)</b>${bonuses}</div>`;
    }).join('');

    const saved = GameState.loadoutsOf(uid);
    const loadout = locked ? '' : `
      <div class="loadout-row">
        <span class="loadout-label" title="Save this hero's whole kit under a name and put it back on in one click">Kit:</span>
        <select id="ros-loadout-select" ${saved.length ? '' : 'disabled'}>${
          saved.length
            ? saved.map((l) => `<option value="${l.name}">${l.name} (${l.pieces})</option>`).join('')
            : '<option value="">No saved loadouts</option>'}</select>
        <button id="ros-loadout-load" class="panel-btn" ${saved.length ? '' : 'disabled'}
          title="Wear this saved kit">Wear</button>
        <button id="ros-loadout-save" class="panel-btn"
          title="Save the eight slots as they stand (up to ${GameState.MAX_LOADOUTS} per hero)">Save…</button>
        <button id="ros-loadout-delete" class="panel-btn danger" ${saved.length ? '' : 'disabled'}
          title="Delete this saved kit">✕</button>
      </div>`;

    this.panelEl.innerHTML = `
      ${this.header(uid)}
      ${locked ? '' : `<button id="ros-auto-equip" class="panel-btn gear-auto-btn"
        title="Fit the best unworn pieces to this hero. Locked gear stays put; nobody else is undressed.">⚙ Auto-equip</button>`}
      ${loadout}
      ${rows}
      ${locked ? '<div class="gear-locked-note">⚔ In battle — gear is locked until the fight ends.</div>' : ''}
      ${this.message ? `<div class="gear-auto-msg">${this.message}</div>` : ''}
      ${focusHtml}
      ${sets}`;

    this.wireGear(uid);
  }

  wireGear(uid) {
    const on = (id, fn) => {
      const btn = document.getElementById(id);
      if (btn && !btn.disabled) btn.addEventListener('click', fn);
    };
    on('ros-auto-equip', () => {
      const n = GameState.autoEquip(uid);
      this.message = n > 0
        ? `Auto-equip: ${n} slot${n > 1 ? 's' : ''} upgraded.`
        : 'Auto-equip: already wearing the best available.';
      this.refresh();
    });
    const sel = document.getElementById('ros-loadout-select');
    on('ros-loadout-save', () => {
      const suggested = (sel && sel.value) || `Kit ${GameState.loadoutsOf(uid).length + 1}`;
      const name = prompt('Name this loadout:', suggested);
      if (name === null) return;
      const savedName = GameState.saveLoadout(uid, name);
      this.message = savedName
        ? `Saved loadout "${savedName}".`
        : `All ${GameState.MAX_LOADOUTS} loadout slots are full — delete one first.`;
      this.refresh();
    });
    on('ros-loadout-load', () => {
      if (!sel || !sel.value) return;
      const r = GameState.applyLoadout(uid, sel.value);
      this.message = !r ? 'That loadout could not be worn.'
        : r.missing
          ? `Wore "${sel.value}" — ${r.equipped} pieces on, ${r.missing} gone or in use.`
          : `Wore "${sel.value}" — ${r.equipped} pieces on.`;
      this.refresh();
    });
    on('ros-loadout-delete', () => {
      if (!sel || !sel.value) return;
      if (!confirm(`Delete the loadout "${sel.value}"?`)) return;
      GameState.deleteLoadout(uid, sel.value);
      this.message = 'Loadout deleted.';
      this.refresh();
    });

    this.panelEl.querySelectorAll('.gear-select').forEach((s) => {
      s.addEventListener('change', () => {
        if (s.value) GameState.equipGear(uid, s.value);
        else GameState.unequipGear(uid, s.dataset.slot);
        this.gearFocus = s.dataset.slot;
        this.message = '';
        this.refresh();
      });
    });
    this.panelEl.querySelectorAll('.gear-row').forEach((row) => {
      row.addEventListener('click', (e) => {
        if (e.target.tagName === 'SELECT') return;   // let the picker work
        this.gearFocus = row.dataset.slot;
        this.renderGear();
      });
    });
  }
}
