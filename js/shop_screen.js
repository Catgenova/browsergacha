// The Shop: everything Diamonds buy, in one place — summon scrolls and
// capacity expansions. Prices and ceilings live in GameState; this
// screen just sells them.

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
