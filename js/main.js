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

  // Canvases that should render at device resolution: {el, w, h} with
  // logical (CSS) dimensions. Registered by screens at construction.
  hiDpiCanvases: [],

  // Scale the fixed 960px layout to fill the viewport (no scrolling).
  fitToScreen() {
    const root = document.getElementById('game-root');
    root.style.transform = 'none';
    const h = root.offsetHeight;
    const k = Math.max(0.4, Math.min(
      (window.innerWidth - 24) / root.offsetWidth,
      (window.innerHeight - 24) / h,
      2.5 // sanity cap for huge monitors
    ));
    root.style.transform = `scale(${k})`;

    // Match canvas backing resolution to what's actually on screen, so
    // sprites are resampled once (source -> device pixels), not twice.
    const q = Math.min(k * (window.devicePixelRatio || 1), 3);
    for (const c of this.hiDpiCanvases) {
      const w = Math.round(c.w * q);
      if (c.el.width !== w) {
        c.el.width = w;
        c.el.height = Math.round(c.h * q);
        c.el.style.width = `${c.w}px`;
        c.el.style.height = `${c.h}px`;
      }
    }
  },
};

(function main() {
  // Deploys stamp __VERSION__/__BUILD__; locally, show "dev" instead.
  const versionTag = document.getElementById('version-tag');
  if (versionTag.textContent.includes('__')) versionTag.textContent = 'dev';

  // Pages caches index.html for up to 10 minutes, so a fresh deploy can
  // lag behind. Poll for a newer stamped version and offer a reload.
  if (location.protocol.startsWith('http') && versionTag.textContent !== 'dev') {
    const current = versionTag.textContent;
    setInterval(async () => {
      try {
        const res = await fetch(location.href, { cache: 'no-store' });
        const html = await res.text();
        const match = html.match(/v\d+ · [0-9a-f]{8}/);
        if (match && match[0] !== current) {
          versionTag.textContent = `${match[0]} available — click to update`;
          versionTag.classList.add('update-available');
          versionTag.onclick = () => location.reload(true);
        }
      } catch (e) { /* offline etc. — try again next tick */ }
    }, 60000);
  }

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
