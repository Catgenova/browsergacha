// Gacha summon screen: spend scrolls, reveal pulled heroes as
// flipping cards.

class SummonScreen {
  constructor(app) {
    this.app = app;
    this.el = document.getElementById('screen-summon');
    this.resultsEl = document.getElementById('summon-results');
    this.pityEl = document.getElementById('pity-counter');
    this.scrollsEl = document.getElementById('scroll-counts');
    this.errorEl = document.getElementById('summon-error');
    this.revealing = false;

    this.buttons = [
      { el: document.getElementById('summon-common-one'), kind: 'common', count: 1 },
      { el: document.getElementById('summon-common-ten'), kind: 'common', count: 10 },
      { el: document.getElementById('summon-rare-one'), kind: 'rare', count: 1 },
      { el: document.getElementById('summon-rare-ten'), kind: 'rare', count: 10 },
      { el: document.getElementById('summon-temporal-one'), kind: 'temporal', count: 1 },
      { el: document.getElementById('summon-temporal-ten'), kind: 'temporal', count: 10 },
    ];
    for (const b of this.buttons) {
      b.el.addEventListener('click', () => this.summon(b.kind, b.count));
    }
    // The elective banner pulls: same scrolls as each banner's kind,
    // but its sect draws at double weight inside the star band. Panels
    // and their buttons are built per running banner in
    // updateBannerBlock (banners can overlap, one per scroll kind).
    this.bannerBtns = [];
    this.builtBannerKey = null;
  }

  enter() {
    this.updateInfo();
  }

  exit() {}

  updateInfo() {
    this.scrollsEl.textContent =
      `Scrolls: 📜 ${GameState.scrollsCommon} common · ✨ ${GameState.scrollsRare} rare · 🌀 ${GameState.scrollsTemporal} temporal`;
    // The running rate-up banners point at their elective blocks below.
    const bannerEl = document.getElementById('summon-banner');
    const banners = typeof Events !== 'undefined' && Events.activeBanners
      ? Events.activeBanners() : [];
    if (bannerEl) {
      bannerEl.textContent = banners.length
        ? `⚡ Banner${banners.length > 1 ? 's' : ''}: ` +
          `${banners.map((b) => b.name).join(' & ')} — scroll down to pull!`
        : '';
      bannerEl.classList.toggle('hidden', !banners.length);
    }
    this.updateBannerBlock(banners);
    // Pity is only meaningful once a 5★ hero exists to be pitied into.
    const has5 = Object.values(HEROES).some((h) => h.rarity === 5);
    this.pityEl.textContent = has5
      ? `Pity: 5★ guaranteed within ${Math.max(1, Gacha.PITY_LIMIT - GameState.pity)} plain Rare pulls (banner pulls run their own pity)`
      : '';
    for (const b of this.buttons) {
      const have = b.kind === 'rare' ? GameState.scrollsRare
        : b.kind === 'temporal' ? GameState.scrollsTemporal
        : GameState.scrollsCommon;
      b.el.disabled = this.revealing || have < b.count;
    }
  }

  // The elective banner blocks: one panel per running banner — name,
  // the featured sect, its own pull buttons. Rebuilt only when the
  // calendar changes which banners run.
  updateBannerBlock(banners) {
    const block = document.getElementById('banner-block');
    if (!block) return;
    block.classList.toggle('hidden', !banners.length);
    const SCROLL = { common: ['📜', 'Common'], rare: ['✨', 'Rare'], temporal: ['🌀', 'Temporal'] };
    // A pity claim crosses a hero off the strip, so the claimed list is
    // part of the rebuild key.
    const key = banners.map((b) =>
      `${b.id}:${Gacha.bannerPityInfo(b).claimed.join(',')}`).join('|');
    if (this.builtBannerKey !== key) {
      this.builtBannerKey = key;
      this.bannerBtns = [];
      this.bannerPityEls = {};
      block.innerHTML = '';
      for (const banner of banners) {
        const [icon, scrollName] = SCROLL[banner.scroll] || ['📜', banner.scroll];
        const pity = Gacha.bannerPityInfo(banner);
        const panel = document.createElement('div');
        panel.className = 'banner-panel';
        const title = document.createElement('div');
        title.className = 'banner-panel-title';
        title.textContent = `⚡ Banner: ${banner.name}`;
        const sub = document.createElement('div');
        sub.className = 'banner-panel-sub';
        sub.textContent =
          `${banner.label} Uses ${scrollName} ${icon} scrolls — the star rates are the scroll's own.`;
        const strip = document.createElement('div');
        strip.className = 'banner-featured';
        const featured = Object.values(HEROES)
          .filter((h) => RACES.sectOf(h) && RACES.sectOf(h).id === banner.sect)
          .sort((a, b) => b.rarity - a.rarity);
        for (const def of featured) {
          const card = document.createElement('div');
          card.className = 'banner-hero';
          const canvas = document.createElement('canvas');
          canvas.width = 72;
          canvas.height = 72;
          Sprites.drawPortrait(canvas, def);
          const name = document.createElement('div');
          name.className = 'bh-name';
          name.textContent = def.name;
          const stars = document.createElement('div');
          stars.className = 'bh-stars';
          stars.textContent = '★'.repeat(def.rarity);
          card.append(canvas, name, stars);
          // A pity-claimed hero stays on display but is crossed off: it
          // cannot come from this banner's pity again.
          if (pity.claimed.includes(def.id)) {
            card.classList.add('pity-claimed');
            const x = document.createElement('div');
            x.className = 'bh-x';
            x.textContent = '✕';
            card.appendChild(x);
            card.title = `${def.name} — already claimed by this banner's pity`;
          } else {
            card.title = `Open ${def.name} in the compendium`;
          }
          card.addEventListener('click', () => {
            this.app.screens.compendium.openHero(def.id);
            this.app.showScreen('compendium');
          });
          strip.appendChild(card);
        }
        // The pity readout: how far to the next guaranteed featured
        // hero, or the fact that the pity has been spent entirely.
        const pityLine = document.createElement('div');
        pityLine.className = 'banner-pity';
        this.bannerPityEls[banner.id] = pityLine;
        const actions = document.createElement('div');
        actions.className = 'banner-panel-actions';
        for (const count of [1, 10]) {
          const btn = document.createElement('button');
          btn.className = 'panel-btn gold';
          btn.textContent = `Banner ×${count} (${count} ${icon})`;
          btn.addEventListener('click', () =>
            this.summon(banner.scroll, count, { banner: true }));
          actions.appendChild(btn);
          this.bannerBtns.push({ el: btn, count, scroll: banner.scroll });
        }
        panel.append(title, sub, strip, pityLine, actions);
        block.appendChild(panel);
      }
    }
    for (const b of this.bannerBtns) {
      const have = b.scroll === 'rare' ? GameState.scrollsRare
        : b.scroll === 'temporal' ? GameState.scrollsTemporal
        : GameState.scrollsCommon;
      b.el.disabled = this.revealing || have < b.count;
    }
    // The pity counter moves on every pull, so its line is refreshed
    // outside the rebuild.
    for (const banner of banners) {
      const el = this.bannerPityEls && this.bannerPityEls[banner.id];
      if (!el) continue;
      const info = Gacha.bannerPityInfo(banner);
      const left = info.every - info.count;
      el.textContent = info.remaining.length === 0
        ? 'Banner pity spent — every featured hero has been claimed for this banner.'
        : `Pity: a featured hero is guaranteed in ${left} banner pull${left === 1 ? '' : 's'}` +
          ` · ${info.remaining.length} of ${info.remaining.length + info.claimed.length} still in the pity pool`;
    }
  }

  summon(kind, count, opts = {}) {
    if (this.revealing) return;
    this.errorEl.textContent = '';

    const results = Gacha.pull(kind, count, opts);
    if (!results) {
      this.errorEl.textContent = 'Not enough scrolls!';
      return;
    }
    if (results.error === 'roster-full') {
      this.errorEl.textContent =
        `Roster full (${GameState.rosterCount()}/${results.max}) \u2014 ` +
        `room for ${results.space}. Spend heroes in Improve to make space.`;
      return;
    }

    this.revealing = true;
    this.updateInfo();
    this.resultsEl.innerHTML = '';

    results.forEach((res, i) => {
      const card = this.buildCard(res);
      this.resultsEl.appendChild(card);
      // Staggered flip reveal; 5★ cards land last-feeling via slight extra delay.
      const delay = 250 + i * 220 + (res.rarity === 5 ? 150 : 0);
      setTimeout(() => {
        card.classList.add('revealed');
        // The run climbs with rarity, so the ear knows what turned up
        // before the card finishes flipping.
        if (typeof Sound !== 'undefined') Sound.play('summon', res.rarity);
        // The flip transition runs 0.5s; once it lands, flatten the 3D
        // transform so the face's text renders crisp (see .settled).
        setTimeout(() => card.classList.add('settled'), 600);
      }, delay);
    });

    const totalDelay = 250 + results.length * 220 + 600;
    setTimeout(() => {
      this.revealing = false;
      this.updateInfo();
    }, totalDelay);
  }

  buildCard(res) {
    const { def, rarity, isNew, copies, blessing } = res;

    const card = document.createElement('div');
    card.className = `summon-card rarity-${rarity}`;
    if (blessing) card.classList.add(`blessing-${blessing}`);

    const inner = document.createElement('div');
    inner.className = 'summon-card-inner';

    const back = document.createElement('div');
    back.className = 'summon-face summon-back';
    back.textContent = '?';

    const front = document.createElement('div');
    front.className = `summon-face summon-front rarity-border-${rarity}`;

    const portrait = document.createElement('canvas');
    portrait.width = 72;
    portrait.height = 72;
    portrait.className = 'portrait';
    Sprites.drawPortrait(portrait, def);

    const name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = `${Elements.badge(def.element)} ${def.name}`.trim();

    // The element, named in its own colour -- the badge alone is easy
    // to miss on a card this small.
    const elInfo = Elements.info(def.element);
    const element = document.createElement('div');
    element.className = 'card-element';
    if (elInfo) {
      element.textContent = elInfo.name;
      element.style.color = elInfo.color;
    }

    const stars = document.createElement('div');
    stars.className = `card-stars rarity-${rarity}`;
    stars.textContent = '★'.repeat(rarity);

    // NEW! is first-ever-collected (compendium-new), not new-to-roster:
    // re-summoning a character you once spent reads as a return visit.
    const status = document.createElement('div');
    status.className = isNew ? 'card-new' : 'card-dupe';
    status.textContent = isNew ? 'NEW!'
      : copies > 1 ? `\u00d7${copies} in roster` : 'Collected before';

    front.append(portrait, name, element, stars, status);
    // The lottery ticket: a Blessed (1/1,000) or Godtouched (1/10,000)
    // copy announces itself on the card, over everything else.
    if (blessing && typeof Blessing !== 'undefined') {
      const b = Blessing.of(blessing);
      if (b) {
        const tag = document.createElement('div');
        tag.className = `card-blessing-tag blessing-${blessing}`;
        tag.textContent = `${b.icon} ${b.name.toUpperCase()}`;
        tag.title = `${b.name} — ${b.blurb}`;
        front.appendChild(tag);
      }
    }
    inner.append(back, front);
    card.appendChild(inner);

    // A summon card is also a link: straight to this hero's compendium
    // page, where the kit and animations live.
    card.title = `Open ${def.name} in the compendium`;
    card.classList.add('summon-linked');
    card.addEventListener('click', () => {
      this.app.screens.compendium.openHero(def.id);
      this.app.showScreen('compendium');
    });
    return card;
  }

  update() {}
  draw() {}
}
