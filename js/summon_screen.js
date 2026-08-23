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
    // The elective banner pulls: same scrolls as the banner's kind, but
    // the running sect draws at double weight inside its star band.
    this.bannerBtns = [
      { el: document.getElementById('summon-banner-one'), count: 1 },
      { el: document.getElementById('summon-banner-ten'), count: 10 },
    ];
    for (const b of this.bannerBtns) {
      b.el.addEventListener('click', () => {
        const banner = typeof Events !== 'undefined' ? Events.currentBanner() : null;
        if (banner) this.summon(banner.scroll, b.count, { banner: true });
      });
    }
    this.builtBannerId = null;
  }

  enter() {
    this.updateInfo();
  }

  exit() {}

  updateInfo() {
    this.scrollsEl.textContent =
      `Scrolls: 📜 ${GameState.scrollsCommon} common · ✨ ${GameState.scrollsRare} rare · 🌀 ${GameState.scrollsTemporal} temporal`;
    // The running rate-up banner points at its elective block below.
    const bannerEl = document.getElementById('summon-banner');
    const banner = typeof Events !== 'undefined' ? Events.currentBanner() : null;
    if (bannerEl) {
      bannerEl.textContent = banner
        ? `⚡ Banner: ${banner.name} — scroll down to pull on it!` : '';
      bannerEl.classList.toggle('hidden', !banner);
    }
    this.updateBannerBlock(banner);
    // Pity is only meaningful once a 5★ hero exists to be pitied into.
    const has5 = Object.values(HEROES).some((h) => h.rarity === 5);
    this.pityEl.textContent = has5
      ? `Pity: 5★ guaranteed within ${Math.max(1, Gacha.PITY_LIMIT - GameState.pity)} rare pulls`
      : '';
    for (const b of this.buttons) {
      const have = b.kind === 'rare' ? GameState.scrollsRare
        : b.kind === 'temporal' ? GameState.scrollsTemporal
        : GameState.scrollsCommon;
      b.el.disabled = this.revealing || have < b.count;
    }
  }

  // The elective banner block: name, the featured sect, its own pull
  // buttons. Rebuilt only when the calendar turns a page.
  updateBannerBlock(banner) {
    const block = document.getElementById('banner-block');
    if (!block) return;
    block.classList.toggle('hidden', !banner);
    if (!banner) return;
    const SCROLL = { common: ['📜', 'Common'], rare: ['✨', 'Rare'], temporal: ['🌀', 'Temporal'] };
    const [icon, scrollName] = SCROLL[banner.scroll] || ['📜', banner.scroll];
    if (this.builtBannerId !== banner.id) {
      this.builtBannerId = banner.id;
      document.getElementById('banner-title').textContent = `⚡ Banner: ${banner.name}`;
      document.getElementById('banner-sub').textContent =
        `${banner.label} Uses ${scrollName} ${icon} scrolls — the star rates are the scroll's own.`;
      const strip = document.getElementById('banner-featured');
      strip.innerHTML = '';
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
        card.title = `Open ${def.name} in the compendium`;
        card.addEventListener('click', () => {
          this.app.screens.compendium.openHero(def.id);
          this.app.showScreen('compendium');
        });
        strip.appendChild(card);
      }
    }
    const have = banner.scroll === 'rare' ? GameState.scrollsRare
      : banner.scroll === 'temporal' ? GameState.scrollsTemporal
      : GameState.scrollsCommon;
    for (const b of this.bannerBtns) {
      b.el.textContent = `Banner ×${b.count} (${b.count} ${icon})`;
      b.el.disabled = this.revealing || have < b.count;
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
      }, delay);
    });

    const totalDelay = 250 + results.length * 220 + 600;
    setTimeout(() => {
      this.revealing = false;
      this.updateInfo();
    }, totalDelay);
  }

  buildCard(res) {
    const { def, rarity, isNew, copies } = res;

    const card = document.createElement('div');
    card.className = `summon-card rarity-${rarity}`;

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
