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
  }

  enter() {
    this.updateInfo();
  }

  exit() {}

  updateInfo() {
    this.scrollsEl.textContent =
      `Scrolls: 📜 ${GameState.scrollsCommon} common · ✨ ${GameState.scrollsRare} rare · 🌀 ${GameState.scrollsTemporal} temporal`;
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

  summon(kind, count) {
    if (this.revealing) return;
    this.errorEl.textContent = '';

    const results = Gacha.pull(kind, count);
    if (!results) {
      this.errorEl.textContent = 'Not enough scrolls!';
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
    name.textContent = def.name;

    const stars = document.createElement('div');
    stars.className = `card-stars rarity-${rarity}`;
    stars.textContent = '★'.repeat(rarity);

    const status = document.createElement('div');
    status.className = isNew ? 'card-new' : 'card-dupe';
    status.textContent = isNew ? 'NEW!' : `Copy ×${copies}`;

    front.append(portrait, name, stars, status);
    inner.append(back, front);
    card.appendChild(inner);
    return card;
  }

  update() {}
  draw() {}
}
