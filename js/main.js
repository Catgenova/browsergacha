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

  // Scale the fixed 960px layout to fill the viewport (no scrolling).
  fitToScreen() {
    const root = document.getElementById('game-root');
    root.style.transform = 'none';
    const h = root.offsetHeight;
    const k = Math.min(
      (window.innerWidth - 24) / root.offsetWidth,
      (window.innerHeight - 24) / h,
      2.5 // sanity cap for huge monitors
    );
    root.style.transform = `scale(${Math.max(0.4, k)})`;
  },
};

(function main() {
  // Deploys stamp __VERSION__/__BUILD__; locally, show "dev" instead.
  const versionTag = document.getElementById('version-tag');
  if (versionTag.textContent.includes('__')) versionTag.textContent = 'dev';

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

  // Testing helper: free gems.
  document.getElementById('dev-gems-btn').addEventListener('click', () => {
    GameState.addGems(1000);
    // Refresh summon-button enabled states if that screen is showing.
    if (App.active === App.screens.summon) App.screens.summon.updateInfo();
  });

  GameState.onChange(() => App.updateGems());
  App.updateGems();
  App.showScreen('team');

  // Keep the layout fitted: on window resize and whenever screen content
  // changes height (roster growth, summon results, screen switches).
  window.addEventListener('resize', () => App.fitToScreen());
  new ResizeObserver(() => App.fitToScreen())
    .observe(document.getElementById('game-root'));
  App.fitToScreen();

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
