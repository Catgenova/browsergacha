// The Shop: everything Diamonds buy, in one place — summon scrolls,
// dumplings, and capacity expansions. Prices and ceilings live in
// GameState; this screen just sells them.

class ShopScreen {
  constructor(app) {
    this.app = app;
    this.el = document.getElementById('screen-shop');
    this.bodyEl = document.getElementById('shop-body');
    this.message = '';
    if (this.bodyEl) {
      this.bodyEl.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-buy]');
        if (!btn || btn.disabled) return;
        this.buy(btn.dataset.buy);
      });
    }
  }

  enter() { this.message = ''; this.render(); }
  exit() {}
  update() {}
  draw() {}

  buy(what) {
    let result = null;
    if (what === 'rare') {
      result = GameState.buyRareScrolls();
      this.message = result ? `${GameState.RARE_PACK_COUNT} Rare Summon Scrolls added. ✨` : '';
    } else if (what === 'temporal') {
      result = GameState.buyTemporalScroll();
      this.message = result ? 'A Temporal Summon Scroll added. 🌀' : '';
    } else if (what === 'roster') {
      result = GameState.expandRoster();
      this.message = result ? `Roster expanded to ${result} heroes.` : '';
    } else if (what === 'storage') {
      result = GameState.expandStorage();
      this.message = result ? `Storage expanded to ${result} heroes.` : '';
    } else if (what.startsWith('dumpling')) {
      const stars = Number(what.slice('dumpling'.length));
      result = GameState.buyDumpling(stars);
      // No room check any more: dumplings are inventory, and an
      // inventory line cannot fill up.
      this.message = result
        ? `A ${stars}★ Dumpling, worth ${Progression.starValue(stars, DUMPLINGS.dumpling)
          .toLocaleString('en-US')} star-up points. ` +
          `${GameState.dumplingCount().toLocaleString('en-US')} in hand.`
        : '';
    }
    if (result === null || result === false) this.message = 'Not enough Diamonds.';
    else if (typeof Sound !== 'undefined') Sound.play('click');
    this.render();
  }

  render() {
    if (!this.bodyEl) return;
    const d = GameState.diamonds;
    const rosterCapped = GameState.MAX_ROSTER >= GameState.ROSTER_CAP_MAX;
    const storageCapped = GameState.MAX_STORAGE >= GameState.STORAGE_CAP_MAX;
    const row = ({ icon, name, detail, buy, price, disabled, note }) => `
      <div class="shop-row">
        <div class="shop-icon">${icon}</div>
        <div class="shop-text">
          <div class="shop-name">${name}</div>
          <div class="shop-detail">${detail}</div>
        </div>
        ${note ? `<span class="shop-note">${note}</span>` : ''}
        <button class="panel-btn gold" data-buy="${buy}" ${disabled ? 'disabled' : ''}>
          ${price.toLocaleString('en-US')} 💎</button>
      </div>`;

    this.bodyEl.innerHTML = `
      <div id="shop-balance">💎 <b>${d.toLocaleString('en-US')}</b> Diamonds
        <span class="shop-hint">— earned from quests, tower boss floors, and
        the occasional lucky battle drop</span></div>
      ${this.message ? `<div id="shop-msg">${this.message}</div>` : ''}

      <div class="shop-section">Summon Scrolls</div>
      ${row({
        icon: '✨', name: `${GameState.RARE_PACK_COUNT} Rare Summon Scrolls`,
        detail: 'The 3★-and-up pool. You hold ' +
          `${GameState.scrollsRare.toLocaleString('en-US')}.`,
        buy: 'rare', price: GameState.RARE_PACK_COST,
        disabled: d < GameState.RARE_PACK_COST,
      })}
      ${row({
        icon: '🌀', name: '1 Temporal Summon Scroll',
        detail: 'The only road to Dark and Light heroes. You hold ' +
          `${GameState.scrollsTemporal.toLocaleString('en-US')}.`,
        buy: 'temporal', price: GameState.TEMPORAL_COST,
        disabled: d < GameState.TEMPORAL_COST,
      })}

      <div class="shop-section">Dumplings
        <span class="shop-hint">— fodder for star-ups; 🥟 ${
          GameState.dumplingCount().toLocaleString('en-US')} in hand</span></div>
      ${Object.keys(GameState.DUMPLING_PRICES).map(Number).sort((a, b) => a - b)
        .map((stars) => {
          const price = GameState.dumplingPrice(stars);
          const pts = Progression.starValue(stars, DUMPLINGS.dumpling);
          return row({
            icon: '🥟', name: `1 ${stars}★ Dumpling`,
            detail: `Worth <b>${pts.toLocaleString('en-US')}</b> star-up points — ` +
              `${(pts / price).toFixed(2)} per 💎.`,
            buy: `dumpling${stars}`, price,
            // Diamonds are the only thing that can refuse a sale here.
            // This used to also require a free roster or vault slot,
            // because a dumpling needed somewhere to stand -- which
            // greyed the counter out on exactly the account that most
            // wanted it. Dumplings are inventory now and cannot run out
            // of room.
            disabled: d < price,
          });
        }).join('')}

      <div class="shop-section">Capacity</div>
      ${row({
        icon: '🎪', name: `Roster +${GameState.CAP_STEP} slots`,
        detail: `Currently ${GameState.rosterCount()} of ${GameState.MAX_ROSTER}; ` +
          `expandable to ${GameState.ROSTER_CAP_MAX}.`,
        buy: 'roster', price: GameState.ROSTER_STEP_COST,
        disabled: rosterCapped || d < GameState.ROSTER_STEP_COST,
        note: rosterCapped ? 'At the ceiling' : '',
      })}
      ${row({
        icon: '🏛', name: `Storage +${GameState.CAP_STEP} slots`,
        detail: `Currently ${GameState.storageCount()} of ${GameState.MAX_STORAGE}; ` +
          `expandable to ${GameState.STORAGE_CAP_MAX}.`,
        buy: 'storage', price: GameState.STORAGE_STEP_COST,
        disabled: storageCapped || d < GameState.STORAGE_STEP_COST,
        note: storageCapped ? 'At the ceiling' : '',
      })}`;
  }
}
