// App shell: top bar, screen switching, and the single game loop that
// drives whichever screen is active.

const App = {
  screens: {},
  active: null,

  async showScreen(name) {
    const next = this.screens[name];
    if (!next) return;
    if (this.active) {
      this.active.exit();
      this.active.el.classList.add('hidden');
    }
    document.querySelectorAll('.nav-tab').forEach((tab) =>
      tab.classList.toggle('active', tab.dataset.screen === name));
    this.active = next;
    next.el.classList.remove('hidden');
    await next.enter();
  },

  updateGems() {
    document.getElementById('gem-count').textContent = GameState.gems.toLocaleString();
  },
};

(function main() {
  App.screens.summon = new SummonScreen(App);
  App.screens.team = new TeamScreen(App);
  App.screens.battle = new BattleScreen(App);

  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.dataset.screen === 'battle' && GameState.teamSize() === 0) {
        // No team yet — bounce to the builder instead.
        App.showScreen('team');
        return;
      }
      App.showScreen(tab.dataset.screen);
    });
  });

  GameState.onChange(() => App.updateGems());
  App.updateGems();
  App.showScreen('team');

  let lastTime = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    if (App.active) {
      App.active.update(dt);
      App.active.draw();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
