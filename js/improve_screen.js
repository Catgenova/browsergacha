// Improve: the screen where heroes are spent on other heroes.
//
// The roster is a list of individual heroes now, not a set of characters
// with duplicate counters, so growth costs bodies:
//
//   STAR UP   sacrifice as many heroes at the SAME star rating as the
//             rating itself -- three 3-star heroes to reach 4.
//   SKILL UP  sacrificing the same CHARACTER also raises one of their
//             skills, so a true duplicate is worth more than a stranger
//             of the same rank.
//
// The candidate list only ever shows heroes that do one of those two
// things. Anything that cannot contribute is not a choice, so it is not
// on the page.

class ImproveScreen {
  constructor(app) {
    this.app = app;
    this.el = document.getElementById('screen-improve');
    this.listEl = document.getElementById('imp-list');
    this.detailEl = document.getElementById('imp-detail');
    this.countEl = document.getElementById('imp-count');
    this.searchEl = document.getElementById('imp-search');
    this.selected = null;      // roster uid being improved
    this.chosen = new Set();   // roster uids marked for sacrifice
    this.message = '';
    if (this.searchEl) {
      this.searchEl.addEventListener('input', () => this.renderList());
    }
    // Auto star up: everything at 1-2 stars is forged up to 3. It
    // spends heroes, so the first press shows the price and the second
    // one pays it.
    this.autoBtn = document.getElementById('imp-auto');
    this.autoArmed = false;
    if (this.autoBtn) {
      this.autoBtn.addEventListener('click', () => {
        const plan = GameState.planAutoStarUp();
        if (!plan.length) return;
        if (!this.autoArmed) {
          this.autoArmed = true;
          this.renderAuto();
          return;
        }
        this.autoArmed = false;
        const r = GameState.autoStarUp();
        this.message = `Auto star up: ${r.starUps} star up${r.starUps === 1 ? '' : 's'}, ` +
          `${r.spent} hero${r.spent === 1 ? '' : 'es'} spent` +
          (r.skills ? `, ${r.skills} skill level${r.skills === 1 ? '' : 's'} gained` : '') + '.';
        if (typeof Sound !== 'undefined') Sound.play('levelup');
        this.refresh();
      });
    }
  }

  // Open the screen on a particular hero (the team screen links here).
  select(uid) {
    this.selected = uid;
    this.chosen.clear();
    this.message = '';
  }

  enter() { this.autoArmed = false; this.refresh(); }
  exit() {}
  update() {}
  draw() {}

  refresh() {
    // A hero that was sacrificed (or is simply gone) cannot stay selected.
    if (this.selected && !GameState.defOf(this.selected)) this.select(null);
    for (const uid of [...this.chosen]) {
      if (!GameState.defOf(uid)) this.chosen.delete(uid);
    }
    this.renderCount();
    this.renderAuto();
    this.renderList();
    this.renderDetail();
  }

  // The auto button always says what it would do right now; disabled
  // when the shelf has nothing to forge.
  renderAuto() {
    if (!this.autoBtn) return;
    const plan = GameState.planAutoStarUp();
    const spend = plan.reduce((n, st) => n + st.fodder.length, 0);
    this.autoBtn.disabled = !plan.length;
    this.autoBtn.classList.toggle('armed', this.autoArmed && !!plan.length);
    this.autoBtn.innerHTML = !plan.length
      ? 'Auto star up to 3&#9733;'
      : this.autoArmed
        ? `Spend ${spend} hero${spend === 1 ? '' : 'es'} for ${plan.length} star up${plan.length === 1 ? '' : 's'}?`
        : `Auto star up to 3&#9733; (${plan.length})`;
  }

  renderCount() {
    if (!this.countEl) return;
    const n = GameState.rosterCount();
    const max = GameState.MAX_ROSTER;
    this.countEl.innerHTML = `<b>${n}</b> / ${max} heroes` +
      (n >= max ? ' <span class="imp-full">roster full</span>' : '');
    this.countEl.classList.toggle('imp-at-cap', n >= max);
  }

  // Everyone you could pick to improve, best first.
  renderList() {
    const q = (this.searchEl ? this.searchEl.value : '').trim().toLowerCase();
    const rows = GameState.ownedHeroIds()
      .map((uid) => ({ uid, def: GameState.defOf(uid), pr: GameState.progressOf(uid) }))
      .filter((r) => r.def && r.pr)
      .filter((r) => !q || r.def.name.toLowerCase().includes(q) ||
        (r.def.element || '').toLowerCase().includes(q))
      .sort((a, b) => (b.pr.stars - a.pr.stars) || (b.pr.level - a.pr.level) ||
        a.def.name.localeCompare(b.def.name));

    this.listEl.innerHTML = rows.map((r) => {
      const ready = GameState.starUpAffordable(r.uid);
      const fielded = GameState.teamSlotOf(r.uid) !== null;
      return `<div class="imp-row${r.uid === this.selected ? ' selected' : ''}"
           data-uid="${r.uid}">
        <canvas class="imp-portrait" width="40" height="40"></canvas>
        <div class="imp-row-text">
          <div class="imp-row-name">${Elements.badge(r.def.element)} ${r.def.name}</div>
          <div class="imp-row-sub">Lv ${r.pr.level} · ${
            Attune.starsHtml(r.pr.stars, r.pr.attune, r.def.element)}</div>
        </div>
        ${fielded ? '<span class="imp-tag imp-team-tag">IN TEAM</span>' : ''}
        ${ready ? '<span class="imp-ready">★⬆</span>' : ''}
      </div>`;
    }).join('') || '<div class="imp-empty">No heroes match.</div>';

    this.listEl.querySelectorAll('.imp-row').forEach((row) => {
      Sprites.paintPortrait(row.querySelector('canvas'),
        GameState.defOf(row.dataset.uid));
      row.addEventListener('click', () => {
        this.select(row.dataset.uid);
        this.refresh();
      });
    });
  }

  renderDetail() {
    if (!this.selected) {
      this.detailEl.innerHTML = `<div class="imp-hint">
        <b>Pick a hero to improve.</b>
        <p>Star ups cost heroes at the same star rating &mdash; three 3&#9733;
        heroes to reach 4&#9733;. Sacrificing another copy of the same
        character also raises one of their skills.</p>
        <p class="imp-note">Heroes on your team and favourites are never
        offered as sacrifices.</p>
      </div>`;
      return;
    }

    // Toggling a sacrifice re-renders this whole panel; without saving
    // the scroll, every pick snapped the list back to the top.
    const panelScroll = this.detailEl.scrollTop;
    const optsEl = this.detailEl.querySelector('.imp-opts');
    const optsScroll = optsEl ? optsEl.scrollTop : 0;

    const uid = this.selected;
    const def = GameState.defOf(uid);
    const pr = GameState.progressOf(uid);
    const cap = Progression.maxLevel(pr.stars);
    const maxed = pr.stars >= Progression.MAX_STARS;
    const need = Progression.starUpCost(pr.stars);

    const options = GameState.sacrificeOptions(uid);
    const picked = [...this.chosen];
    const atRank = picked.filter((u) => {
      const p = GameState.progressOf(u);
      return p && p.stars === pr.stars;
    }).length;
    const skillPicks = picked.filter((u) => GameState.defIdOf(u) === def.id).length;
    const willStar = !maxed && atRank >= need;

    const skillsHtml = def.abilities.map((a, i) => {
      const lv = GameState.skillLevel(uid, i);
      const full = lv >= Progression.MAX_SKILL_LEVEL;
      return `<div class="imp-skill${full ? ' imp-skill-max' : ''}">
        <span>${a.name}</span><b>Lv ${lv}/${Progression.MAX_SKILL_LEVEL}</b></div>`;
    }).join('');

    const rowFor = (o) => {
      const on = this.chosen.has(o.uid);
      const fodder = HEROES[o.heroId];
      const info = Elements.info(fodder.element);
      const tags = [];
      if (o.skill) tags.push('<span class="imp-tag imp-tag-skill">SKILL UP</span>');
      tags.push(`<span class="imp-tag${o.star ? '' : ' imp-tag-dim'}">${o.stars}&#9733;</span>`);
      return `<div class="imp-opt${on ? ' chosen' : ''}" data-uid="${o.uid}">
        <canvas class="imp-portrait" width="34" height="34"></canvas>
        <div class="imp-row-text">
          <div class="imp-row-name">${Elements.badge(fodder.element)} ${fodder.name}</div>
          <div class="imp-row-sub">Lv ${o.level}${info
            ? ` &middot; <span style="color:${info.color}">${info.name}</span>` : ''}</div>
        </div>
        ${tags.join('')}
      </div>`;
    };

    const canStar = maxed ? 'Already at the star cap.'
      : `${need} hero${need > 1 ? 'es' : ''} at ${pr.stars}&#9733; \u2014 ` +
        `<b>${atRank}/${need}</b> chosen. Raises the level cap to ` +
        `${Progression.maxLevel(pr.stars + 1)}; the level is kept.`;

    this.detailEl.innerHTML = `
      <div class="imp-head rarity-${def.rarity}">${Elements.badge(def.element)} ${def.name}${
        GameState.teamSlotOf(uid) !== null
          ? ' <span class="imp-tag imp-team-tag">IN TEAM</span>' : ''}</div>
      <div class="imp-sub">Lv ${pr.level} / ${cap} &middot; ${
        Attune.starsHtml(pr.stars, pr.attune, def.element)} &middot; ${pr.stars}&#9733;</div>
      ${Tags.html(def)}

      <div class="imp-section">Star up</div>
      <div class="imp-line">${canStar}</div>

      <div class="imp-section">Skills</div>
      ${skillsHtml}
      <div class="imp-line imp-note">${skillPicks
        ? `${skillPicks} sacrifice${skillPicks > 1 ? 's' : ''} of ${def.name} \u2014 ` +
          `${skillPicks} random skill level${skillPicks > 1 ? 's' : ''}.`
        : 'Sacrifice another ' + def.name + ' to raise a random skill.'}</div>

      ${this.attuneHtml(uid, def, pr)}

      <button id="imp-go" class="panel-btn gold" ${picked.length ? '' : 'disabled'}>
        ${picked.length
          ? `Sacrifice ${picked.length} hero${picked.length > 1 ? 'es' : ''}` +
            (willStar ? ' and star up'
              : maxed ? ''
              : ` — NO star up (${atRank}/${need} at ${pr.stars}★)`)
          : 'Choose sacrifices below'}
      </button>
      ${this.message ? `<div class="imp-msg">${this.message}</div>` : ''}

      <div class="imp-section">Sacrifices ${options.length
        ? `<span class="imp-note">${picked.length} chosen</span>` : ''}</div>
      ${options.length
        ? `<div class="imp-opts">${options.map(rowFor).join('')}</div>`
        : `<div class="imp-line imp-note">Nobody is free to sacrifice --
           every other hero is favourited or on the team.</div>`}`;

    this.detailEl.scrollTop = panelScroll;
    const optsEl2 = this.detailEl.querySelector('.imp-opts');
    if (optsEl2) optsEl2.scrollTop = optsScroll;

    this.detailEl.querySelectorAll('.imp-opt').forEach((row) => {
      Sprites.paintPortrait(row.querySelector('canvas'),
        GameState.defOf(row.dataset.uid));
      row.addEventListener('click', () => {
        const u = row.dataset.uid;
        if (this.chosen.has(u)) this.chosen.delete(u);
        else this.chosen.add(u);
        this.message = '';
        this.renderDetail();
      });
    });

    const go = document.getElementById('imp-go');
    if (go && !go.disabled) {
      go.addEventListener('click', () => this.commit(uid));
    }

    const att = document.getElementById('imp-attune');
    if (att && !att.disabled) {
      att.addEventListener('click', () => {
        const r = GameState.attune(uid);
        if (!r) return;
        const info = Elements.info(r.element);
        this.message = `${def.name} is attuned to ${r.to} ` +
          `(+${r.to * 10}% base stats)${info ? `, ${info.name}` : ''}.`;
        if (typeof Sound !== 'undefined') Sound.play('levelup');
        this.refresh();
      });
    }
  }

  // Attunement: capped by the star rating, paid for in the hero's own
  // element, and shown as coloured stars because that is where it lands.
  attuneHtml(uid, def, pr) {
    const info = Elements.info(def.element);
    const have = pr.attune || 0;
    const room = Math.min(Attune.MAX, pr.stars);
    const next = GameState.nextAttunement(uid);
    const purse = GameState.elementsOf(def.element);

    const stars = Array.from({ length: pr.stars }, (_, i) =>
      `<span class="imp-star" style="color:${i < have && info ? info.color : '#4a4468'}">&#9733;</span>`
    ).join('');

    const held = Attune.SIZES.map((size) =>
      `<span class="imp-purse"><b>${purse[size]}</b> ${Attune.SIZE_LABEL[size]}</span>`
    ).join('');

    let line;
    if (have >= Attune.MAX) line = `Fully attuned &mdash; +${Attune.MAX * 10}% base stats.`;
    else if (have >= room) {
      line = `Attuned as far as ${pr.stars}&#9733; allows. Star up for more room.`;
    } else if (next) {
      line = `Next: <b>${next.n} ${Attune.SIZE_LABEL[next.size]}</b> ` +
        `${info ? info.name : def.element} Elements (have ${next.held}).`;
    }

    return `
      <div class="imp-section">Attunement
        <span class="imp-note">${have}/${room} &middot; +${have * 10}% base stats</span></div>
      <div class="imp-stars">${stars}</div>
      <div class="imp-line">${line}</div>
      <div class="imp-line imp-note">${info ? info.emoji : ''} ${held}</div>
      ${next ? `<button id="imp-attune" class="panel-btn"
        ${next.can ? '' : 'disabled'}>Attune to ${have + 1}</button>` : ''}`;
  }

  commit(uid) {
    const def = GameState.defOf(uid);
    const report = GameState.sacrifice(uid, [...this.chosen]);
    this.chosen.clear();
    if (!report) { this.message = 'Nothing was spent.'; this.refresh(); return; }

    const bits = [`Spent ${report.spent} hero${report.spent > 1 ? 'es' : ''}.`];
    if (report.starred) bits.push(`${def.name} is now ${report.to}&#9733;!`);
    if (report.skills.length) {
      const names = report.skills.map((i) => def.abilities[i].name);
      bits.push(`Skill up: ${names.join(', ')}.`);
    }
    if (report.gearFreed) {
      bits.push(`${report.gearFreed} piece${report.gearFreed > 1 ? 's' : ''} of gear returned.`);
    }
    this.message = bits.join(' ');
    if (typeof Sound !== 'undefined') Sound.play(report.starred ? 'levelup' : 'click');
    this.refresh();
  }
}
