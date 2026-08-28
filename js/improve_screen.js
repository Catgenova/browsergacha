// Improve: the screen where heroes are spent on other heroes.
//
// The roster is a list of individual heroes now, not a set of characters
// with duplicate counters, so growth costs bodies:
//
//   STAR UP   bank points. Every hero is worth Progression.starValue(its
//             stars) and every rating costs that rating's own worth, so
//             four 3-stars reach 4 -- and so do twenty-four 1-stars, over
//             as many sittings as you like, with the overflow rolling
//             into the next bar.
//   SKILL UP  sacrificing the same CHARACTER also raises one of their
//             skills, so a true duplicate is worth more than a stranger
//             of the same rank.
//
// The candidate list shows everything spendable, because under the
// points rule everything contributes. It used to show same-rank heroes
// and duplicates only, which was right when a 1-star could do nothing
// for a 3-star.

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
    // Auto star up: one button per target star (3-7), each forging
    // every hero below that rank as far toward it as the fodder shelf
    // allows. It spends heroes, so the first press on a button shows
    // the price and the second one pays it; arming one disarms the
    // rest.
    this.autoBtns = [...document.querySelectorAll('.imp-auto-btn')];
    this.autoArmed = null; // the armed button's target star, or null
    for (const btn of this.autoBtns) {
      const target = Number(btn.dataset.target);
      btn.addEventListener('click', () => {
        const plan = GameState.planAutoStarUp(target);
        if (!plan.length) return;
        if (this.autoArmed !== target) {
          this.autoArmed = target;
          this.renderAuto();
          return;
        }
        this.autoArmed = null;
        const r = GameState.autoStarUp(target);
        this.message = `Auto star up to ${target}★: ${r.starUps} star up${r.starUps === 1 ? '' : 's'}, ` +
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
    // A fresh target (or a target whose stars just changed) gets a
    // fresh view: scroll to the top so the fodder that matches the
    // CURRENT star rating leads, instead of whatever region the last
    // pick left in view.
    this.resetScroll = true;
  }

  enter() { this.autoArmed = null; this.refresh(); }
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

  // Each auto button always says what it would do right now; disabled
  // when the shelf has nothing to forge toward its star.
  renderAuto() {
    for (const btn of this.autoBtns) {
      const target = Number(btn.dataset.target);
      const plan = GameState.planAutoStarUp(target);
      const spend = plan.reduce((n, st) => n + st.fodder.length, 0);
      const armed = this.autoArmed === target && plan.length > 0;
      btn.disabled = !plan.length;
      btn.classList.toggle('armed', armed);
      btn.innerHTML = armed
        ? `${target}&#9733;: spend ${spend} for ${plan.length} — sure?`
        : `${target}&#9733;${plan.length ? ` (${plan.length})` : ''}`;
      btn.title = plan.length
        ? `Forge toward ${target}★: ${plan.length} star up${plan.length === 1 ? '' : 's'} for ` +
          `${spend} spare hero${spend === 1 ? '' : 'es'}. Team members and favourites are never spent.`
        : `Nothing on the shelf can star up toward ${target}★ right now.`;
    }
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
        <p>Star ups are banked in POINTS. A hero is worth what its rating
        is worth &mdash; 1&#9733; a point, 2&#9733; two, 3&#9733; six,
        4&#9733; twenty-four &mdash; and reaching a rating costs what that
        rating is worth. So four 3&#9733; heroes reach 4&#9733;, and so do
        twenty-four 1&#9733; heroes, in as many sittings as you like.
        Anything left over rolls into the next bar. Sacrificing another
        copy of the same character also raises one of their skills.</p>
        <p class="imp-note">Heroes on your team and favourites are never
        offered as sacrifices.</p>
      </div>`;
      return;
    }

    // Toggling a sacrifice re-renders this whole panel; without saving
    // the scroll, every pick snapped the list back to the top. But a
    // NEW context -- fresh target, or a completed star-up -- resets to
    // the top instead, so the list reads for the current star rating.
    const keepScroll = !this.resetScroll;
    this.resetScroll = false;
    const panelScroll = keepScroll ? this.detailEl.scrollTop : 0;
    const optsEl = this.detailEl.querySelector('.imp-opts');
    const optsScroll = keepScroll && optsEl ? optsEl.scrollTop : 0;

    const uid = this.selected;
    const def = GameState.defOf(uid);
    const pr = GameState.progressOf(uid);
    const cap = Progression.maxLevel(pr.stars);
    const maxed = pr.stars >= Progression.MAX_STARS;
    const need = Progression.starUpCost(pr.stars);

    const options = GameState.sacrificeOptions(uid);
    const picked = [...this.chosen];
    // Points, not head count: a star up is a bank now, so what matters
    // is what the picks are WORTH and where that lands the hero.
    const bank = pr.starPoints || 0;
    const picking = picked.reduce(
      (n, u) => n + Progression.starValue(GameState.progressOf(u).stars), 0);
    let toStars = pr.stars;
    let after = bank + picking;
    while (toStars < Progression.MAX_STARS &&
           after >= Progression.starUpCost(toStars)) {
      after -= Progression.starUpCost(toStars);
      toStars++;
    }
    const skillPicks = picked.filter((u) => GameState.defIdOf(u) === def.id).length;
    const willStar = toStars > pr.stars;

    const skillsHtml = def.abilities.map((a, i) => {
      const lv = GameState.skillLevel(uid, i);
      const cap = Progression.skillCap(a, i);
      const full = lv >= cap;
      return `<div class="imp-skill${full ? ' imp-skill-max' : ''}">
        <span>${a.name}</span><b>Lv ${lv}/${cap}</b></div>`;
    }).join('');

    const rowFor = (o) => {
      const on = this.chosen.has(o.uid);
      const fodder = HEROES[o.heroId];
      const info = Elements.info(fodder.element);
      const tags = [];
      if (o.skill) tags.push('<span class="imp-tag imp-tag-skill">SKILL UP</span>');
      tags.push(`<span class="imp-tag imp-tag-dim">${o.stars}&#9733;</span>`);
      tags.push(`<span class="ros-worth">+${o.value}</span>`);
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

    const num = (v) => Math.round(v || 0).toLocaleString();
    const canStar = maxed ? 'Already at the star cap.'
      : `<b>${num(bank + picking)} / ${num(need)}</b> points` +
        (picking ? ` (${num(bank)} banked, ${num(picking)} picked)` : ' banked') +
        `. ${willStar
          ? `Reaches ${toStars}&#9733;` + (after ? `, ${num(after)} carried over` : '') + '.'
          : `${num(need - bank - picking)} more for ${pr.stars + 1}&#9733;.`} ` +
        `Raises the level cap to ${Progression.maxLevel(pr.stars + 1)}; ` +
        'the level is kept.'

    // What the star up buys, shown before it is paid for. Dim until the
    // sacrifices are actually picked, so the panel reads as a forecast
    // rather than a promise it cannot keep yet.
    const previewHtml = (() => {
      const pv = GameState.starUpPreview(uid);
      if (!pv) return '';
      const n = (v) => Math.round(v || 0).toLocaleString();
      const row = (label, now, next) => {
        const up = next > now;
        return `<div class="imp-pv-row"><span class="imp-pv-k">${label}</span>` +
          `<span class="imp-pv-now">${n(now)}</span>` +
          `<span class="imp-pv-arrow">&rarr;</span>` +
          `<span class="imp-pv-next${up ? ' up' : ''}">${n(next)}</span></div>`;
      };
      return `<div class="imp-preview${willStar ? ' armed' : ''}">
        <div class="imp-pv-head">${pv.stars.now}&#9733; &rarr; ${pv.stars.next}&#9733;${
          willStar ? '' : ' <span class="imp-note">(if you pick enough)</span>'}</div>
        ${row('HP', pv.stats.hp.now, pv.stats.hp.next)}
        ${row('ATK', pv.stats.atk.now, pv.stats.atk.next)}
        ${row('DEF', pv.stats.def.now, pv.stats.def.next)}
        ${row('SPD', pv.speed.now, pv.speed.next)}
        ${row('Power', pv.power.now, pv.power.next)}
        ${row('Level cap', pv.levelCap.now, pv.levelCap.next)}
        <div class="imp-pv-note">Skill caps are set by the skill, not the
          star, so they do not move.</div>
      </div>`;
    })();

    this.detailEl.innerHTML = `
      <div class="imp-head rarity-${def.rarity}">${Elements.badge(def.element)} ${def.name}${
        GameState.teamSlotOf(uid) !== null
          ? ' <span class="imp-tag imp-team-tag">IN TEAM</span>' : ''}</div>
      <div class="imp-sub">Lv ${pr.level} / ${cap} &middot; ${
        Attune.starsHtml(pr.stars, pr.attune, def.element)} &middot; ${pr.stars}&#9733;</div>
      ${Tags.html(def)}

      <div class="imp-section">Star up</div>
      <div class="imp-line">${canStar}</div>
      ${previewHtml}

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
            (willStar ? ` and star up to ${toStars}★`
              : maxed ? ''
              : ` — +${picking} points, no star up yet`)
          : 'Choose sacrifices below'}
      </button>
      ${this.message ? `<div class="imp-msg">${this.message}</div>` : ''}

      <div class="imp-section">Sacrifices ${options.length
        ? `<span class="imp-note">${picked.length} chosen</span>` : ''}</div>
      ${options.length
        ? `<div class="imp-opts">${options.map(rowFor).join('')}</div>`
        : `<div class="imp-line imp-note">Nothing eligible: you need another
           ${def.name} for a skill level, or a spare hero at
           ${pr.stars}&#9733; for a star up. Favourited and fielded heroes
           are never offered.</div>`}`;

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
    // A star-up changes what counts as at-rank fodder: rebuild the view
    // from the top so the list reads for the NEW star rating.
    if (report && report.starred) this.resetScroll = true;
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
