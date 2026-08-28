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
    // Repaint hooks for the favourite/store controls on the cards
    // currently on screen. Storing one hero can change what every OTHER
    // card may do (the vault fills up), so a deposit repaints them all.
    this.cardActions = [];

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
    // Roster room: every pull needs a free slot, so say up front how
    // many are left before a summon bounces off a full roster.
    const spaceEl = document.getElementById('summon-roster-space');
    if (spaceEl) {
      const free = GameState.rosterSpace();
      const vault = Math.max(0, GameState.MAX_STORAGE - GameState.storageCount());
      spaceEl.textContent =
        `Roster: ${GameState.rosterCount()}/${GameState.MAX_ROSTER} — ` +
        (free === 0
          // A full roster is no longer a wall: summons overflow into the
          // vault, so the readout says where they will land rather than
          // telling the player to stop.
          ? (vault > 0
            ? `full — the next ${vault} go to storage`
            : 'FULL, and the vault is too. Free up space before summoning.')
          : `${free} free slot${free === 1 ? '' : 's'}`);
      spaceEl.classList.toggle('roster-low', free > 0 && free <= 10);
      spaceEl.classList.toggle('roster-full', free === 0 && vault === 0);
      spaceEl.classList.toggle('roster-overflow', free === 0 && vault > 0);
    }
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
    const wl = document.getElementById('summon-wishlist');
    if (wl) {
      const names = GameState.wishlist()
        .map((id) => (HEROES[id] ? HEROES[id].name : id));
      wl.textContent = names.length
        ? `Wishlist (${Gacha.WISHLIST_MULT}× draw weight in plain summons): ${names.join(', ')}`
        : `Wishlist: empty — mark up to ${GameState.WISHLIST_MAX} heroes in the Compendium ` +
          `for ${Gacha.WISHLIST_MULT}× draw weight in plain summons.`;
    }
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
        // Ask the gacha who is featured rather than re-deriving it: it
        // drops anyone this scroll cannot draw, so the strip advertises
        // exactly the heroes the pity guarantee can hand over.
        const featured = Gacha.bannerFeatured(banner)
          .map((id) => HEROES[id])
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
        `Roster AND vault are full (${GameState.rosterCount()}/${results.max} + ` +
        `${GameState.storageCount()}/${GameState.MAX_STORAGE}) \u2014 room for ` +
        `${results.space}. Spend heroes in Improve to make space.`;
      return;
    }
    // Some or all of this pull may have landed in the vault instead.
    const toVault = results.filter((r) => r && r.stored).length;
    if (toVault > 0) {
      this.errorEl.textContent = `Roster full \u2014 ${toVault} of these went to ` +
        'storage. Withdraw them from the Team screen.';
    }

    this.revealing = true;
    this.updateInfo();
    this.resultsEl.innerHTML = '';
    this.cardActions = [];

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
    const { def, rarity, isNew, copies, blessing, uid } = res;

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
        tag.innerHTML = `${Blessing.markHtml(blessing)} ${b.name.toUpperCase()}`;
        tag.title = `${b.name} — ${b.blurb}`;
        front.appendChild(tag);
      }
    }
    // The two controls the Roster puts on its cards, on the summon
    // result itself. A ten-pull is exactly the moment you know which
    // copy is the keeper and which are vault fodder, and making that a
    // separate trip to the Roster meant it mostly did not happen.
    // uid is null only if the roster refused the hero, which leaves
    // nothing to favourite or store — such a card gets no controls.
    if (uid) front.append(...this.cardControls(def, uid, card));

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

  // Favourite + store buttons for one summon card, in the same classes
  // and the same two corners the Roster uses, so the gesture transfers.
  // Returns the elements; the caller appends them to the card's front
  // face (which is the positioned ancestor the CSS anchors against).
  cardControls(def, uid, card) {
    const fav = document.createElement('button');
    fav.className = 'card-fav';
    fav.type = 'button';

    const store = document.createElement('button');
    store.className = 'card-store';
    store.type = 'button';

    // Both buttons read state rather than remembering it, so a card
    // repainted after some other card's deposit tells the truth.
    const paint = () => {
      const stored = !!GameState.storedEntry(uid);
      const favd = !stored && GameState.isFavorite(uid);
      card.classList.toggle('summon-stored', stored);

      fav.textContent = favd ? '★' : '☆';
      fav.classList.toggle('on', favd);
      fav.classList.toggle('hidden', stored);
      fav.setAttribute('aria-pressed', favd ? 'true' : 'false');
      fav.title = favd
        ? `Unfavourite ${def.name} — stops pinning them to the top`
        : `Favourite ${def.name} — pins them to the top of the roster`;

      store.textContent = stored ? '✓' : '▼';
      store.disabled = stored;
      // A full vault takes nobody, so the button goes away rather than
      // sitting there failing. A card already stored keeps its ✓.
      store.classList.toggle('hidden', !stored && GameState.storageFull());
      store.title = stored
        ? `${def.name} is in storage — withdraw from the Roster's vault`
        : `Send ${def.name} to storage — gear returns to the inventory`;
    };

    // Each button is its own click target inside a card that is itself
    // a link to the compendium: swallow the event so neither doubles as
    // opening the hero's page.
    fav.addEventListener('click', (e) => {
      e.stopPropagation();
      if (GameState.storedEntry(uid)) return;
      GameState.toggleFavorite(uid);
      paint();
    });

    store.addEventListener('click', (e) => {
      e.stopPropagation();
      if (GameState.storedEntry(uid)) return;
      if (!GameState.deposit(uid)) {
        this.errorEl.textContent = `Could not store ${def.name}.`;
        paint();
        return;
      }
      this.errorEl.textContent = '';
      // Depositing frees a roster slot and fills a vault one, so the
      // header counts and every other card's store button are stale.
      this.updateInfo();
      for (const repaint of this.cardActions) repaint();
    });

    paint();
    this.cardActions.push(paint);
    return [fav, store];
  }

  update() {}
  draw() {}
}
