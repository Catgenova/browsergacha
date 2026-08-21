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
  }

  // Open the screen on a particular hero (the team screen links here).
  select(uid) {
    this.selected = uid;
    this.chosen.clear();
    this.message = '';
  }

  enter() { this.refresh(); }
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
    this.renderList();
    this.renderDetail();
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
      const ready = GameState.starUpReady(r.uid);
      const same = GameState.countOf(r.def.id);
      return `<div class="imp-row${r.uid === this.selected ? ' selected' : ''}"
           data-uid="${r.uid}">
        <canvas class="imp-portrait" width="40" height="40"></canvas>
        <div class="imp-row-text">
          <div class="imp-row-name">${Elements.badge(r.def.element)} ${r.def.name}</div>
          <div class="imp-row-sub">Lv ${r.pr.level} · ${'★'.repeat(Math.min(5, r.pr.stars))}${
            r.pr.stars > 5 ? `+${r.pr.stars - 5}` : ''}${same > 1 ? ` · ×${same}` : ''}</div>
        </div>
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

    const uid = this.selected;
    const def = GameState.defOf(uid);
    const pr = GameState.progressOf(uid);
    const cap = Progression.maxLevel(pr.stars);
    const maxed = pr.stars >= Progression.MAX_STARS;
    const need = Progression.starUpCost(pr.stars);
    const ready = GameState.starUpReady(uid);

    const options = GameState.sacrificeOptions(uid);
    const picked = [...this.chosen];
    const atRank = picked.filter((u) => {
      const p = GameState.progressOf(u);
      return p && p.stars === pr.stars;
    }).length;
    const skillPicks = picked.filter((u) => GameState.defIdOf(u) === def.id).length;
    const willStar = ready && atRank >= need;

    const skillsHtml = def.abilities.map((a, i) => {
      const lv = GameState.skillLevel(uid, i);
      const full = lv >= Progression.MAX_SKILL_LEVEL;
      return `<div class="imp-skill${full ? ' imp-skill-max' : ''}">
        <span>${a.name}</span><b>Lv ${lv}/${Progression.MAX_SKILL_LEVEL}</b></div>`;
    }).join('');

    const rowFor = (o) => {
      const on = this.chosen.has(o.uid);
      const tags = [];
      if (o.skill) tags.push('<span class="imp-tag imp-tag-skill">SKILL UP</span>');
      if (o.star) tags.push(`<span class="imp-tag">${o.stars}&#9733;</span>`);
      return `<div class="imp-opt${on ? ' chosen' : ''}" data-uid="${o.uid}">
        <canvas class="imp-portrait" width="34" height="34"></canvas>
        <div class="imp-row-text">
          <div class="imp-row-name">${HEROES[o.heroId].name}</div>
          <div class="imp-row-sub">Lv ${o.level}</div>
        </div>
        ${tags.join('')}
      </div>`;
    };

    const canStar = maxed ? 'Already at the star cap.'
      : !ready ? `Needs Lv ${cap} first (currently Lv ${pr.level}).`
      : `${need} hero${need > 1 ? 'es' : ''} at ${pr.stars}&#9733; \u2014 ` +
        `<b>${atRank}/${need}</b> chosen.`;

    this.detailEl.innerHTML = `
      <div class="imp-head rarity-${def.rarity}">${Elements.badge(def.element)} ${def.name}</div>
      <div class="imp-sub">Lv ${pr.level} / ${cap} &middot; ${'★'.repeat(Math.min(5, pr.stars))}${
        pr.stars > 5 ? `+${pr.stars - 5}` : ''} &middot; ${pr.stars}&#9733;</div>

      <div class="imp-section">Star up</div>
      <div class="imp-line">${canStar}</div>

      <div class="imp-section">Skills</div>
      ${skillsHtml}
      <div class="imp-line imp-note">${skillPicks
        ? `${skillPicks} sacrifice${skillPicks > 1 ? 's' : ''} of ${def.name} \u2014 ` +
          `${skillPicks} random skill level${skillPicks > 1 ? 's' : ''}.`
        : 'Sacrifice another ' + def.name + ' to raise a random skill.'}</div>

      <div class="imp-section">Sacrifices ${options.length
        ? `<span class="imp-note">${picked.length} chosen</span>` : ''}</div>
      ${options.length
        ? `<div class="imp-opts">${options.map(rowFor).join('')}</div>`
        : `<div class="imp-line imp-note">Nothing in the roster can improve
           ${def.name} right now. You need another ${def.name} for a skill
           level, or a spare hero at ${pr.stars}&#9733; for a star up.</div>`}

      <button id="imp-go" class="panel-btn gold" ${picked.length ? '' : 'disabled'}>
        ${picked.length
          ? `Sacrifice ${picked.length} hero${picked.length > 1 ? 'es' : ''}` +
            `${willStar ? ' and star up' : ''}`
          : 'Choose sacrifices'}
      </button>
      ${this.message ? `<div class="imp-msg">${this.message}</div>` : ''}`;

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
