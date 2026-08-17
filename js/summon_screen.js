// Gacha summon screen: spend gems, reveal pulled heroes as flipping cards.

class SummonScreen {
  constructor(app) {
    this.app = app;
    this.el = document.getElementById('screen-summon');
    this.resultsEl = document.getElementById('summon-results');
    this.oneBtn = document.getElementById('summon-one-btn');
    this.tenBtn = document.getElementById('summon-ten-btn');
    this.pityEl = document.getElementById('pity-counter');
    this.errorEl = document.getElementById('summon-error');
    this.revealing = false;

    this.oneBtn.addEventListener('click', () => this.summon(1));
    this.tenBtn.addEventListener('click', () => this.summon(10));
  }

  enter() {
    this.updateInfo();
  }

  exit() {}

  updateInfo() {
    this.pityEl.textContent =
      `Pity: 5★ guaranteed within ${Gacha.PITY_LIMIT - GameState.pity} pulls`;
    this.oneBtn.disabled = this.revealing || GameState.gems < Gacha.COST_SINGLE;
    this.tenBtn.disabled = this.revealing || GameState.gems < Gacha.COST_TEN;
  }

  summon(count) {
    if (this.revealing) return;
    this.errorEl.textContent = '';

    const results = count === 1 ? Gacha.pullOne() : Gacha.pullTen();
    if (!results) {
      this.errorEl.textContent = 'Not enough gems!';
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
      setTimeout(() => card.classList.add('revealed'), delay);
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
