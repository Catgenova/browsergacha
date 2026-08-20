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

  updateCurrencies() {
    document.getElementById('scroll-common-count').textContent = GameState.scrollsCommon.toLocaleString();
    document.getElementById('scroll-rare-count').textContent = GameState.scrollsRare.toLocaleString();
    document.getElementById('scroll-temporal-count').textContent = GameState.scrollsTemporal.toLocaleString();
    document.getElementById('whetstone-count').textContent = GameState.whetstones.toLocaleString();
    document.getElementById('arcana-count').textContent = GameState.arcana.toLocaleString();
    document.getElementById('tome-count').textContent = GameState.tomes.toLocaleString();
  },

  // Is this hero committed to a fight that's currently running? Gear
  // changes are refused for them until the battle ends.
  heroInBattle(heroId) {
    const bs = this.screens.battle;
    return !!bs && bs.lockedHeroIds && bs.lockedHeroIds().has(heroId);
  },

  // Battle tab marker: a live fight pulses, a finished one the player
  // hasn't looked at yet sits solid until they open the tab.
  updateBattleBadge() {
    const badge = document.getElementById('battle-badge');
    if (!badge) return;
    const bs = this.screens.battle;
    const fighting = !!bs && bs.isFighting && bs.isFighting() && this.active !== bs;
    const done = !!bs && bs.finishedUnseen;
    const state = fighting ? 'fighting' : done ? 'done' : '';
    if (badge.dataset.state === state) return; // no DOM churn per frame
    badge.dataset.state = state;
    badge.textContent = fighting ? '⚔' : done ? '✓' : '';
    badge.classList.toggle('hidden', !state);
    badge.classList.toggle('battle-live', fighting);
    badge.classList.toggle('battle-done', done && !fighting);
  },

  // Canvases that should render at device resolution: {el, w, h} with
  // logical (CSS) dimensions. Registered by screens at construction.
  hiDpiCanvases: [],

  // Scale the fixed 960px layout to fill the viewport (no scrolling).
  fitToScreen() {
    const root = document.getElementById('game-root');
    root.style.transform = 'none';
    // Fit the WIDTH and the core play area's height only. Long content
    // (the roster grid, summon results) scrolls instead of shrinking the
    // whole game — a 400-hero roster must never zoom the UI out.
    const CORE_H = 980; // topbar + canvas + controls; lists overflow below
    const h = Math.min(root.offsetHeight, CORE_H);
    // Phones are narrower than the 960px design width, so the usual 0.5
    // floor would force sideways scrolling. Let small screens shrink
    // further rather than overflow — legibility beats a fixed minimum
    // when the alternative is half the board off-screen.
    // Measure the LAYOUT viewport, not window.innerWidth: on mobile the
    // visual viewport grows to cover overflow, so innerWidth reports the
    // overflowing width and scaling against it never converges.
    const vw = Math.min(window.innerWidth || Infinity,
      document.documentElement.clientWidth || Infinity);
    const vh = Math.min(window.innerHeight || Infinity,
      document.documentElement.clientHeight || Infinity);
    const floor = vw < 760 ? 0.25 : 0.5;
    const pad = vw < 760 ? 8 : 24;
    const k = Math.max(floor, Math.min(
      (vw - pad) / root.offsetWidth,
      (vh - pad) / h,
      2.5 // sanity cap for huge monitors
    ));
    root.style.transform = `scale(${k})`;
    // Scaling leaves the layout box at its unscaled size; trim the
    // leftover so page scroll matches what's visible. Height scales from
    // the top (one margin); width from the center (split both sides).
    root.style.marginBottom = `${Math.round(root.offsetHeight * (k - 1))}px`;
    const mx = Math.round(root.offsetWidth * (k - 1) / 2);
    root.style.marginLeft = `${mx}px`;
    root.style.marginRight = `${mx}px`;

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
    const checkForUpdate = async () => {
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
    };
    checkForUpdate(); // immediately on load, in case this page is stale
    setInterval(checkForUpdate, 60000);
  }

  App.screens.summon = new SummonScreen(App);
  App.screens.team = new TeamScreen(App);
  App.screens.blacksmith = new BlacksmithScreen(App);
  App.screens.quests = new QuestsScreen(App);
  App.screens.campaign = new CampaignScreen(App);
  App.screens.compendium = new CompendiumScreen(App);
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

  // Campaign badge: a dot while any reachable node is still unbeaten,
  // so the spine of the game keeps asking to be walked.
  const campaignBadge = document.getElementById('campaign-badge');
  const updateCampaignBadge = () => {
    if (!campaignBadge) return;
    const open = CAMPAIGN.CHAPTERS.some((ch) =>
      Campaign.chapterUnlocked(ch) &&
      ch.nodes.some((n) => Campaign.nodeUnlocked(n) && !Campaign.nodeCleared(n)));
    campaignBadge.classList.toggle('hidden', !open);
  };

  // Quest badge: a dot on the tab whenever rewards are claimable.
  const questBadge = document.getElementById('quest-badge');
  const updateQuestBadge = () => {
    const claimable = GameState.claimableQuestCount() +
      (typeof ACHIEVEMENTS !== 'undefined' ? ACHIEVEMENTS.claimableCount() : 0);
    questBadge.classList.toggle('hidden', claimable === 0);
  };
  GameState.onChange(() => {
    App.updateCurrencies(); updateQuestBadge(); updateCampaignBadge();
  });
  App.updateCurrencies();
  updateQuestBadge();
  updateCampaignBadge();
  App.showScreen('team');

  // Keep the layout fitted: on window resize and whenever screen content
  // changes height (roster growth, summon results, screen switches).
  window.addEventListener('resize', () => App.fitToScreen());
  new ResizeObserver(() => App.fitToScreen())
    .observe(document.getElementById('game-root'));
  App.fitToScreen();

  // Game clock. requestAnimationFrame drives visible play; because
  // browsers pause rAF (and throttle timers) in background tabs, a
  // 1s interval keeps simulating while hidden by catching the clock up
  // in fixed sub-steps — auto-battles and chains keep farming.
  let lastTime = performance.now();
  function advance(now, draw) {
    // Cap catch-up so a long-suspended tab doesn't grind on return.
    let remaining = Math.min(120, (now - lastTime) / 1000);
    lastTime = now;
    if (!App.active) return;
    // The battle screen keeps simulating even when another tab is up, so
    // hunts and chains run while the player summons or reads the
    // compendium. It just doesn't draw.
    const bg = App.screens.battle !== App.active &&
      App.screens.battle && App.screens.battle.isFighting()
      ? App.screens.battle : null;
    while (remaining > 0) {
      const dt = Math.min(0.05, remaining);
      App.active.update(dt);
      if (bg) bg.update(dt);
      remaining -= dt;
    }
    if (draw) App.active.draw();
    App.updateBattleBadge();
  }
  function frame(now) {
    advance(now, true);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  setInterval(() => {
    if (document.hidden) advance(performance.now(), false);
  }, 1000);
})();
