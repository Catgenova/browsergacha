// Campaign screen: chapter picker, branching node map, node dossier.
//
// The map is DOM, not canvas: nodes are buttons on an absolutely
// positioned grid and the routes between them are a single SVG behind.
// That keeps every node focusable and hoverable for free, which a
// canvas map would have had to reinvent.

class CampaignScreen {
  constructor(app) {
    this.app = app;
    this.el = document.getElementById('screen-campaign');
    this.chaptersEl = document.getElementById('camp-chapters');
    this.storyEl = document.getElementById('camp-story');
    this.mapEl = document.getElementById('camp-map');
    this.edgesEl = document.getElementById('camp-edges');
    this.nodesEl = document.getElementById('camp-nodes');
    this.detailEl = document.getElementById('camp-detail');

    this.chapterId = null;
    this.selectedId = null;

    // Re-lay the edges when the map box changes size (window resize,
    // screen switch); the nodes move with the grid on their own.
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => this.drawEdges()).observe(this.mapEl);
    }
  }

  enter() {
    // Open where the player left off, unless that chapter is not
    // actually reachable (a fresh save, or data that moved under them).
    const saved = Campaign.chapter(GameState.campaignChapter);
    const ch = saved && Campaign.chapterUnlocked(saved)
      ? saved : Campaign.currentChapter();
    this.show(ch.id);
  }

  exit() {}
  update() {}
  draw() {}

  show(chapterId) {
    this.chapterId = chapterId;
    GameState.setCampaignChapter(chapterId);
    const ch = Campaign.chapter(chapterId);
    this.selectedId = this.defaultNode(ch);
    this.renderChapters();
    this.renderStory(ch);
    this.renderMap(ch);
    this.renderDetail();
  }

  // Land the cursor on the first thing worth fighting: the shallowest
  // open-but-uncleared node, or the boss once the chapter is done.
  defaultNode(ch) {
    const open = ch.nodes
      .filter((n) => Campaign.nodeUnlocked(n) && !Campaign.nodeCleared(n))
      .sort((a, b) => a.depth - b.depth);
    return (open[0] || Campaign.bossNode(ch)).id;
  }

  renderChapters() {
    this.chaptersEl.innerHTML = CAMPAIGN.CHAPTERS.map((ch) => {
      const open = Campaign.chapterUnlocked(ch);
      const { done, total, beaten } = Campaign.chapterProgress(ch);
      const state = !open ? 'locked' : beaten ? 'beaten' : 'open';
      const mark = !open ? '🔒' : beaten ? '✓' : `${done}/${total}`;
      return `<button class="camp-chapter ${state}
        ${ch.id === this.chapterId ? 'active' : ''}" data-chapter="${ch.id}"
        ${open ? '' : 'disabled'}
        title="${open ? ch.title : 'Clear the previous chapter to open this one'}">
        <span class="camp-ch-name">${ch.title}</span>
        <span class="camp-ch-mark">${mark}</span>
      </button>`;
    }).join('');
    this.chaptersEl.querySelectorAll('.camp-chapter:not([disabled])')
      .forEach((btn) => btn.addEventListener('click',
        () => this.show(btn.dataset.chapter)));
  }

  renderStory(ch) {
    const { beaten } = Campaign.chapterProgress(ch);
    this.storyEl.innerHTML = `
      <div class="camp-story-title">${ch.title}
        <span class="camp-story-sub">${ch.subtitle}</span></div>
      <p class="camp-story-text">${ch.intro}</p>
      ${beaten ? `<p class="camp-story-text camp-outro">${ch.outro}</p>` : ''}`;
  }

  renderMap(ch) {
    const cols = Math.max(...ch.nodes.map((n) => n.col)) + 1;
    const rows = Math.max(...ch.nodes.map((n) => n.row)) + 1;
    this.mapEl.style.setProperty('--camp-cols', cols);
    this.mapEl.style.setProperty('--camp-rows', rows);

    // Variation selectors forced: without them ⚔/☠ fall back to the
    // pixel font's text presentation and render as tofu.
    const ICON = { normal: '⚔️', elite: '☠️', boss: '👑' };
    this.nodesEl.innerHTML = ch.nodes.map((n) => {
      const open = Campaign.nodeUnlocked(n);
      const done = Campaign.nodeCleared(n);
      const state = done ? 'done' : open ? 'open' : 'locked';
      return `<button class="camp-node t-${n.type} s-${state}"
        data-node="${n.id}"
        style="grid-column:${n.col + 1};grid-row:${n.row + 1}"
        ${open ? '' : 'disabled'}
        title="${open ? `${n.name} — Lv ${Campaign.levelFor(n)}` : 'Locked'}">
        <span class="camp-node-icon">${done ? '✓' : open ? ICON[n.type] : '🔒'}</span>
        <span class="camp-node-name">${open ? n.name : '???'}</span>
      </button>`;
    }).join('');
    this.nodesEl.querySelectorAll('.camp-node:not([disabled])')
      .forEach((btn) => btn.addEventListener('click', () => {
        this.selectedId = btn.dataset.node;
        this.renderMap(Campaign.chapter(this.chapterId));
        this.renderDetail();
      }));
    for (const btn of this.nodesEl.querySelectorAll('.camp-node')) {
      btn.classList.toggle('selected', btn.dataset.node === this.selectedId);
    }
    this.drawEdges();
  }

  // Routes, drawn from the nodes' measured positions so they follow the
  // grid at any scale. Each edge is coloured by whether it has been
  // walked yet, which is what makes a branch legible at a glance.
  drawEdges() {
    const ch = Campaign.chapter(this.chapterId);
    if (!ch) return;
    const box = this.mapEl.getBoundingClientRect();
    if (!box.width) return;
    const centre = (id) => {
      const el = this.nodesEl.querySelector(`[data-node="${id}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left - box.left + r.width / 2,
        y: r.top - box.top + r.height / 2 };
    };
    const parts = [];
    for (const n of ch.nodes) {
      for (const fromId of n.from) {
        const a = centre(fromId); const b = centre(n.id);
        if (!a || !b) continue;
        const walked = Campaign.nodeCleared(Campaign.node(fromId)) &&
          Campaign.nodeCleared(n);
        const live = Campaign.nodeUnlocked(n);
        const cls = walked ? 'walked' : live ? 'live' : 'dim';
        // A gentle S-curve, so parallel routes read as separate roads
        // rather than one thick line.
        const mx = (a.x + b.x) / 2;
        parts.push(`<path class="camp-edge ${cls}"
          d="M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}" />`);
      }
    }
    this.edgesEl.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    this.edgesEl.innerHTML = parts.join('');
  }

  renderDetail() {
    const n = Campaign.node(this.selectedId);
    if (!n) { this.detailEl.innerHTML = ''; return; }
    const ch = Campaign.chapterFor(n.id);
    const open = Campaign.nodeUnlocked(n);
    const done = Campaign.nodeCleared(n);
    const level = Campaign.levelFor(n);
    const pay = Campaign.payout(n);

    // Who is waiting there. The boss node is one named holder; every
    // other node lists its fixed line-up, which never changes.
    let lineup;
    if (n.type === 'boss') {
      const boss = BOSSES[ch.boss];
      lineup = `<div class="camp-foe camp-foe-boss">${boss ? boss.name : ch.boss}
        <span class="camp-foe-lv">Lv ${level}</span></div>`;
    } else {
      lineup = Campaign.encounter(n).map(({ def }) =>
        `<div class="camp-foe">${Elements.badge(def.element)} ${def.name}
          <span class="camp-foe-lv">Lv ${level}</span></div>`).join('');
    }

    const bonus = Campaign.firstClearBonus(n);
    const bonusBits = [];
    if (bonus.scrolls) {
      if (bonus.scrolls.common) bonusBits.push(`${bonus.scrolls.common}× 📜`);
      if (bonus.scrolls.rare) bonusBits.push(`${bonus.scrolls.rare}× ✨`);
    }
    if (bonus.gear && bonus.gear.set) bonusBits.push('a gear piece');
    if (bonus.unlocks) {
      bonusBits.push(`the ${CONFIG.LOCATION_NAMES[ch.location]} hunt and the ` +
        `${BOSSES[ch.boss] ? BOSSES[ch.boss].name : ch.boss} boss`);
    }

    this.detailEl.innerHTML = `
      <div class="camp-detail-head">
        <div class="camp-detail-name">${open ? n.name : '???'}</div>
        <div class="camp-detail-type t-${n.type}">
          ${n.type === 'boss' ? 'Chapter holder'
            : n.type === 'elite' ? 'Elite' : 'Skirmish'} · Lv ${level}
        </div>
      </div>
      ${open ? `
        <div class="camp-section-title">Waiting for you</div>
        <div class="camp-lineup">${lineup}</div>
        <div class="camp-section-title">Every clear</div>
        <div class="camp-rewards">
          +${pay.xp.toLocaleString()} XP each · +${pay.whetstones} 🪨 · +${pay.arcana} ✦
        </div>
        ${bonusBits.length ? `
          <div class="camp-section-title">
            ${bonus.label}${done ? ' — taken' : ''}
          </div>
          <div class="camp-rewards ${done ? 'camp-spent' : 'camp-firstclear'}">
            ${bonusBits.join(' · ')}
          </div>` : ''}
        <button id="camp-fight-btn" class="panel-btn gold">
          ${done ? 'Fight again' : 'Fight!'}
        </button>
      ` : `<div class="details-empty">
          Clear a route into this one to see what holds it.
        </div>`}`;

    const btn = document.getElementById('camp-fight-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        if (GameState.teamSize() === 0) {
          this.app.showScreen('team');
          return;
        }
        this.app.screens.battle.requestCampaign(n.id);
        this.app.showScreen('battle');
      });
    }
  }
}
