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
    this.chosen = new Set(); // roster uids marked as star-up fodder
    this.message = '';       // one-line result note for panel actions
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
    this.chosen.clear();
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
    // Fodder that has already been spent (or otherwise left the roster)
    // cannot stay ticked.
    for (const uid of [...this.chosen]) {
      if (!GameState.defOf(uid)) this.chosen.delete(uid);
    }
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
        this.chosen.clear();
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
    const inert = !!this.selected && GameState.isConsumable(this.selected);
    for (const tab of this.tabsEl.querySelectorAll('.ros-tab')) {
      tab.classList.toggle('active', !inert && tab.dataset.panel === this.panel);
      tab.classList.toggle('ros-tab-inert', inert);
    }
    if (!this.selected) {
      this.panelEl.innerHTML =
        '<div class="details-empty">Select a hero from the grid.</div>';
      return;
    }
    // A dumpling has no skills, no gear, no element and no hex, so it
    // gets one panel rather than five that would all say "none". The
    // rail stays visible but goes inert, which reads as "not for this"
    // instead of as a screen that lost its tabs.
    if (GameState.isConsumable(this.selected)) return this.renderConsumable();
    if (this.panel === 'ascend') return this.renderAscend();
    if (this.panel === 'starup') return this.renderStarUp();
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
  // The dumpling dossier. One number matters -- what it is worth in the
  // bank -- so that number is the panel, with the rest of the ladder
  // beside it so a player can see what a bigger one would be worth.
  renderConsumable() {
    const uid = this.selected;
    const def = GameState.defOf(uid);
    const pr = GameState.progressOf(uid);
    const num = (v) => Math.round(v || 0).toLocaleString();
    const worth = Progression.starValue(pr.stars, def);

    const ladder = Array.from({ length: Progression.MAX_STARS }, (_, i) => {
      const st = i + 1;
      return `<div class="ros-rung${st === pr.stars ? ' earned' : ''}">
        <span class="ros-rung-lv">${st}&#9733;</span>
        <span class="ros-rung-text">${num(Progression.starValue(st, def))} points</span></div>`;
    }).join('');

    this.panelEl.innerHTML = `
      <div class="ros-head">
        <div class="detail-name rarity-1">${def.name}
          <span class="detail-title">${def.title || ''}</span></div>
        <div class="card-stars rarity-1">${Attune.starsHtml(pr.stars, 0, null)}</div>
        <div class="detail-element">No element &middot; not a fighter</div>
      </div>
      <div class="ros-power">Worth <b>${num(worth)}</b> star-up points</div>
      <div class="ros-skill-desc">A dumpling has no skills and cannot be placed on a
        formation. It exists to be fed to a hero on the Star Up tab, where it is worth
        far more than a hero of the same rating.</div>
      <div class="detail-section">What a dumpling is worth</div>
      <div class="ros-ladder">${ladder}</div>
      <div class="ros-note">You hold ${GameState.dumplingCount()} dumpling${
        GameState.dumplingCount() === 1 ? '' : 's'}, vault included. They take up
        roster room like anyone else, so they are worth spending rather than
        hoarding — and one in storage cannot be fed to anybody until it is
        withdrawn.</div>`;
  }

  // ---- Ascend -----------------------------------------------------------
  //
  // The second growth axis: elements won off the elemental bosses, spent
  // for +10% base stats a step. It is capped by the star rating rather
  // than by the purse, which is the part players miss -- so the cap, the
  // room left in it, and what the next step actually costs are all on
  // the panel rather than inferred from a greyed-out button.
  renderAscend() {
    const uid = this.selected;
    const def = GameState.defOf(uid);
    const pr = GameState.progressOf(uid);
    const info = Elements.info(def.element);
    const have = pr.attune || 0;
    const room = Math.min(Attune.MAX, pr.stars);
    const next = GameState.nextAttunement(uid);
    const purse = GameState.elementsOf(def.element);

    // One pip per star, filled in the hero's own colour as far as they
    // are ascended: the cap IS the star count, so drawing them together
    // says why the room runs out without a sentence about it.
    const pips = Array.from({ length: Math.max(1, pr.stars) }, (_, i) =>
      `<span class="ros-pip" style="color:${
        i < have && info ? info.color : '#4a4468'}">&#9733;</span>`).join('');

    const held = Attune.SIZES.map((size) => {
      const n = purse[size];
      const short = next && next.size === size && n < next.n;
      return `<div class="ros-purse${short ? ' ros-purse-short' : ''}">
        <b>${n}</b><span>${Attune.SIZE_LABEL[size]}</span></div>`;
    }).join('');

    // What the step is worth, in the hero's actual numbers rather than as
    // "+10%": the multiplier is on BASE stats, so the figure a player
    // sees move is not the one the percentage names.
    const base = Progression.scaledStats(def, pr.level, pr.stars);
    const at = (n) => {
      const m = Attune.statMult(n);
      return { hp: Math.round(base.hp * m), atk: Math.round(base.atk * m),
        def: Math.round(base.def * m) };
    };
    const now = at(have);
    const then = at(have + 1);
    const num = (v) => Math.round(v || 0).toLocaleString();
    const row = (label, a, b) =>
      `<div class="imp-pv-row"><span class="imp-pv-k">${label}</span>` +
      `<span class="imp-pv-now">${num(a)}</span>` +
      `<span class="imp-pv-arrow">&rarr;</span>` +
      `<span class="imp-pv-next up">${num(b)}</span></div>`;

    let line, preview = '';
    if (have >= Attune.MAX) {
      line = `Fully ascended &mdash; +${Attune.MAX * 10}% base stats.`;
    } else if (have >= room) {
      line = `Ascended as far as ${pr.stars}&#9733; allows. ` +
        'Star up to open the next step.';
    } else if (next) {
      line = `Next step costs <b>${next.n} ${Attune.SIZE_LABEL[next.size]}</b> ` +
        `${info ? info.name : def.element} elements &mdash; you hold ${next.held}.`;
      preview = `<div class="imp-preview${next.can ? ' armed' : ''}">
        <div class="imp-pv-head">Ascension ${have} &rarr; ${have + 1}</div>
        ${row('HP', now.hp, then.hp)}
        ${row('ATK', now.atk, then.atk)}
        ${row('DEF', now.def, then.def)}
        <div class="imp-pv-note">Speed is left alone on purpose: a flat
          percentage on it would reorder the whole turn economy.</div>
      </div>`;
    }

    this.panelEl.innerHTML = `
      ${this.header(uid)}
      <div class="detail-section">Ascension
        <span class="cd">${have} / ${room} &middot; +${have * 10}% base stats</span></div>
      <div class="ros-pips">${pips}</div>
      <div class="ros-skill-desc">${line}</div>
      ${preview}
      ${next ? `<button id="ros-ascend" class="panel-btn gold" ${next.can ? '' : 'disabled'}>
        Ascend to ${have + 1}</button>` : ''}
      ${this.message ? `<div class="gear-auto-msg">${this.message}</div>` : ''}
      <div class="detail-section">${info ? info.name : def.element} elements held</div>
      <div class="ros-purses">${held}</div>
      <div class="ros-note">Elements drop from the ${
        info ? info.name : def.element} elemental boss. A hero only ever
        drinks its own element.</div>`;

    const btn = document.getElementById('ros-ascend');
    if (btn && !btn.disabled) {
      btn.addEventListener('click', () => {
        const r = GameState.attune(uid);
        if (!r) return;
        this.message = `${def.name} ascended to ${r.to} — +${r.to * 10}% base stats.`;
        if (typeof Sound !== 'undefined') Sound.play('levelup');
        this.refresh();
      });
    }
  }

  // ---- Star Up ----------------------------------------------------------
  //
  // Stars cost BODIES: as many heroes at the same rating as the rating
  // itself. Sacrificing the same character also raises one of their
  // skills, so a true duplicate is worth more than a stranger of the same
  // rank -- which is why the candidate rows say which of the two things
  // each one buys.
  renderStarUp() {
    const uid = this.selected;
    const def = GameState.defOf(uid);
    const pr = GameState.progressOf(uid);
    const maxed = pr.stars >= Progression.MAX_STARS;
    const bank = pr.starPoints || 0;
    const need = Progression.starUpCost(pr.stars);
    const options = GameState.sacrificeOptions(uid);
    const { picked, picking, skillPicks, toStars, after, willStar } =
      this.starUpTotals(uid);

    const num = (v) => Math.round(v || 0).toLocaleString();
    // Two-tone bar: what is banked already, and what the current picks
    // would add on top of it. Seeing the second segment reach the end is
    // the whole interaction.
    const pctOf = (v) => (need > 0 ? Math.min(100, (v / need) * 100) : 100);
    const barHtml = maxed ? '' : `
      <div class="ros-starbar">
        <div class="ros-starbar-have" style="width:${pctOf(bank).toFixed(1)}%"></div>
        <div class="ros-starbar-add" style="width:${
          Math.max(0, pctOf(bank + picking) - pctOf(bank)).toFixed(1)}%"></div>
      </div>
      <div class="ros-starbar-line">
        <span>${num(bank)}${picking ? ` <i>+${num(picking)}</i>` : ''} / ${num(need)}</span>
        <span class="cd">${willStar
          ? `reaches ${toStars}&#9733;${after ? ` with ${num(after)} carried over` : ''}`
          : `${num(Math.max(0, need - bank - picking))} more for ${pr.stars + 1}&#9733;`}</span>
      </div>`;

    const pv = GameState.starUpPreview(uid);
    const row = (label, a, b) => {
      const up = b > a;
      return `<div class="imp-pv-row"><span class="imp-pv-k">${label}</span>` +
        `<span class="imp-pv-now">${num(a)}</span>` +
        `<span class="imp-pv-arrow">&rarr;</span>` +
        `<span class="imp-pv-next${up ? ' up' : ''}">${num(b)}</span></div>`;
    };
    const preview = pv ? `<div class="imp-preview${willStar ? ' armed' : ''}">
      <div class="imp-pv-head">${pv.stars.now}&#9733; &rarr; ${pv.stars.next}&#9733;${
        willStar ? '' : ' <span class="imp-note">(when the bar fills)</span>'}</div>
      ${row('HP', pv.stats.hp.now, pv.stats.hp.next)}
      ${row('ATK', pv.stats.atk.now, pv.stats.atk.next)}
      ${row('DEF', pv.stats.def.now, pv.stats.def.next)}
      ${row('SPD', pv.speed.now, pv.speed.next)}
      ${row('Power', pv.power.now, pv.power.next)}
      ${row('Level cap', pv.levelCap.now, pv.levelCap.next)}
      <div class="imp-pv-note">Skill caps are set by the skill, not the
        star, so they do not move. A star up also opens one more
        ascension step.</div>
    </div>` : '';

    const rowFor = (o) => {
      const on = this.chosen.has(o.uid);
      // Through defOf, not HEROES: a dumpling is a roster entry whose
      // def lives in its own table, and indexing HEROES with its id
      // hands back undefined and throws on the next line.
      const fodder = GameState.defOf(o.uid);
      const tags = [];
      if (o.skill) tags.push('<span class="imp-tag imp-tag-skill">SKILL UP</span>');
      tags.push(`<span class="imp-tag imp-tag-dim">${o.stars}&#9733;</span>`);
      tags.push(`<span class="ros-worth">+${num(o.value)}</span>`);
      return `<div class="imp-opt${on ? ' chosen' : ''}" data-uid="${o.uid}">
        <canvas class="imp-portrait" width="34" height="34"></canvas>
        <div class="imp-row-text">
          <div class="imp-row-name">${Elements.badge(fodder.element)} ${fodder.name}</div>
          <div class="imp-row-sub">Lv ${o.level}</div>
        </div>${tags.join('')}</div>`;
    };

    this.panelEl.innerHTML = `
      ${this.header(uid)}
      <div class="detail-section">Star up
        <span class="cd">${pr.stars}&#9733; &middot; Lv cap ${
          Progression.maxLevel(pr.stars)}</span></div>
      ${maxed
        ? '<div class="ros-skill-desc">Already at the star cap. Sacrifices here ' +
          'only buy skill levels now.</div>'
        : barHtml}
      ${preview}
      <button id="ros-sac" class="panel-btn gold" ${picked.length ? '' : 'disabled'}>
        ${picked.length
          ? `Sacrifice ${picked.length} hero${picked.length > 1 ? 'es' : ''}` +
            (willStar ? ` — ${pr.stars}★ to ${toStars}★` : maxed ? '' : ` — +${num(picking)}`)
          : 'Choose sacrifices below'}
      </button>
      ${!maxed && options.some((o) => o.consumable && !this.chosen.has(o.uid))
        ? `<button id="ros-eat" class="panel-btn"
            title="Tick the smallest set of dumplings that fills the bar. If they
all together are not enough, every one of them is picked.">🥟 Fill with dumplings</button>`
        : ''}
      ${this.message ? `<div class="gear-auto-msg">${this.message}</div>` : ''}
      <div class="ros-note ros-skill-note">${skillPicks
        ? `${skillPicks} cop${skillPicks > 1 ? 'ies' : 'y'} of ${def.name} chosen — ` +
          `${skillPicks} random skill level${skillPicks > 1 ? 's' : ''}.`
        : `Sacrificing another ${def.name} also raises a random skill.`}</div>
      <div class="detail-section">Sacrifices${
        options.length ? ` <span class="cd ros-chosen-count">${picked.length} chosen</span>` : ''}</div>
      ${options.length
        ? `<div class="imp-opts">${options.map(rowFor).join('')}</div>`
        : `<div class="ros-note">Nothing to spend: every other hero you own is
           favourited or fielded, and those are never offered.</div>`}`;

    this.panelEl.querySelectorAll('.imp-opt').forEach((el) => {
      Sprites.paintPortrait(el.querySelector('canvas'), GameState.defOf(el.dataset.uid));
      el.addEventListener('click', () => {
        const u = el.dataset.uid;
        if (this.chosen.has(u)) this.chosen.delete(u);
        else this.chosen.add(u);
        this.message = '';
        // Only the parts that moved. Re-rendering the whole panel would
        // rebuild -- and repaint the portrait of -- every candidate row
        // on every tick, and the list is the whole roster now.
        el.classList.toggle('chosen', this.chosen.has(u));
        this.refreshStarUpTotals(uid);
      });
    });

    // Wired unconditionally. It was wired only when it was already
    // enabled, which is never on the first render -- nothing is picked
    // yet -- so the button that refreshStarUpTotals then ENABLED had no
    // listener on it and did nothing when pressed. A disabled button
    // does not fire clicks, so the guard bought nothing and cost the
    // whole interaction.
    const eat = document.getElementById('ros-eat');
    if (eat) eat.addEventListener('click', () => this.fillWithDumplings(uid));

    const go = document.getElementById('ros-sac');
    if (go) {
      go.addEventListener('click', () => {
        if (go.disabled || !this.chosen.size) return;
        const report = GameState.sacrifice(uid, [...this.chosen]);
        this.chosen.clear();
        if (!report) { this.message = 'Nothing was spent.'; this.refresh(); return; }
        const bits = [`Spent ${report.spent} hero${report.spent > 1 ? 'es' : ''}` +
          (report.points ? ` for ${num(report.points)} points.` : '.')];
        if (report.starred) {
          bits.push(`${def.name} is now ${report.to}★!` +
            (report.from < report.to - 1 ? ` (up ${report.to - report.from} ratings)` : ''));
        }
        if (report.skills.length) {
          bits.push(`Skill up: ${report.skills.map((i) => def.abilities[i].name).join(', ')}.`);
        }
        if (report.gearFreed) {
          bits.push(`${report.gearFreed} piece${report.gearFreed > 1 ? 's' : ''} of gear returned.`);
        }
        this.message = bits.join(' ');
        if (typeof Sound !== 'undefined') Sound.play(report.starred ? 'levelup' : 'click');
        this.refresh();
      });
    }
  }

  // Tick the smallest set of dumplings that finishes the bar, or every
  // one of them when they do not add up to it. The choosing itself is
  // GameState.planDumplingFill -- it is the part with a subtle rule in
  // it (see there), so it lives where a test can reach it.
  fillWithDumplings(uid) {
    const plan = GameState.planDumplingFill(uid, [...this.chosen]);
    for (const u of plan.uids) this.chosen.add(u);
    const n = plan.uids.length;
    const num = (v) => Math.round(v || 0).toLocaleString();
    this.message = plan.need <= 0
      ? 'The bar is already covered by what is picked.'
      : n === 0
        ? 'No dumplings to spend.'
        : plan.short === 0
          ? `Picked ${n} dumpling${n === 1 ? '' : 's'} for ${num(plan.points)} points.`
          // "...or all of them if not enough": every dumpling in hand
          // goes in, and the note says how far short that leaves the bar.
          : `Picked all ${n} dumpling${n === 1 ? '' : 's'} for ${num(plan.points)} ` +
            `points — still ${num(plan.short)} short.`;
    this.renderStarUp();
  }

  // Where the current picks land: the same cascade sacrifice() runs,
  // played forward without spending anything. A player choosing fodder is
  // asking "is this enough yet", and once one bar can overflow into the
  // next that answer is a moving target rather than a subtraction.
  //
  // Split out because the full render and the in-place update below both
  // need it, and two copies of a cascade is two chances to disagree with
  // the transaction it is predicting.
  starUpTotals(uid) {
    const def = GameState.defOf(uid);
    const pr = GameState.progressOf(uid);
    const picked = [...this.chosen].filter((u) => GameState.defOf(u));
    const picking = picked.reduce(
      (n, u) => n + GameState.fodderValue(u), 0);
    const bank = pr.starPoints || 0;
    let toStars = pr.stars;
    let after = bank + picking;
    while (toStars < Progression.MAX_STARS &&
           after >= Progression.starUpCost(toStars)) {
      after -= Progression.starUpCost(toStars);
      toStars++;
    }
    return {
      picked, picking, bank, toStars, after,
      willStar: toStars > pr.stars,
      skillPicks: picked.filter((u) => GameState.defIdOf(u) === def.id).length,
    };
  }

  // The bar, the forecast and the button, updated in place while the
  // candidate list below them is left alone. A full re-render would
  // rebuild -- and repaint the portrait of -- every candidate row on
  // every tick, and that list is the whole roster now.
  refreshStarUpTotals(uid) {
    const pr = GameState.progressOf(uid);
    const def = GameState.defOf(uid);
    if (!pr || !def) return;
    const t = this.starUpTotals(uid);
    const need = Progression.starUpCost(pr.stars);
    const maxed = pr.stars >= Progression.MAX_STARS;
    const num = (v) => Math.round(v || 0).toLocaleString();
    const pctOf = (v) => (need > 0 ? Math.min(100, (v / need) * 100) : 100);
    const q = (sel) => this.panelEl.querySelector(sel);

    const add = q('.ros-starbar-add');
    if (add) {
      add.style.width =
        `${Math.max(0, pctOf(t.bank + t.picking) - pctOf(t.bank)).toFixed(1)}%`;
    }
    const line = q('.ros-starbar-line');
    if (line) {
      line.innerHTML =
        `<span>${num(t.bank)}${t.picking ? ` <i>+${num(t.picking)}</i>` : ''} / ${
          num(need)}</span>` +
        `<span class="cd">${t.willStar
          ? `reaches ${t.toStars}&#9733;${
            t.after ? ` with ${num(t.after)} carried over` : ''}`
          : `${num(Math.max(0, need - t.bank - t.picking))} more for ${
            pr.stars + 1}&#9733;`}</span>`;
    }
    const preview = q('.imp-preview');
    if (preview) {
      preview.classList.toggle('armed', t.willStar);
      const head = preview.querySelector('.imp-pv-head .imp-note');
      if (head) head.classList.toggle('hidden', t.willStar);
    }
    const count = q('.ros-chosen-count');
    if (count) count.textContent = `${t.picked.length} chosen`;
    const note = q('.ros-skill-note');
    if (note) {
      note.innerHTML = t.skillPicks
        ? `${t.skillPicks} cop${t.skillPicks > 1 ? 'ies' : 'y'} of ${def.name} chosen — ` +
          `${t.skillPicks} random skill level${t.skillPicks > 1 ? 's' : ''}.`
        : `Sacrificing another ${def.name} also raises a random skill.`;
    }
    const go = document.getElementById('ros-sac');
    if (go) {
      go.disabled = t.picked.length === 0;
      go.textContent = t.picked.length
        ? `Sacrifice ${t.picked.length} hero${t.picked.length > 1 ? 'es' : ''}` +
          (t.willStar ? ` — ${pr.stars}\u2605 to ${t.toStars}\u2605`
            : maxed ? '' : ` — +${num(t.picking)}`)
        : 'Choose sacrifices below';
    }
  }

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
