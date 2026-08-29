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
    const d = document.getElementById('diamond-count');
    if (d) d.textContent = GameState.diamonds.toLocaleString();
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

  // Back each registered canvas at the resolution it is actually drawn
  // at, so sprites are resampled once (source -> device pixels).
  // `cssScale` is how large the canvas is on screen relative to its
  // logical size: the layout scale on desktop, measured on mobile where
  // the canvas is fluid.
  sizeCanvases(mobile, layoutScale) {
    const dpr = window.devicePixelRatio || 1;
    for (const c of this.hiDpiCanvases) {
      let cssW;
      if (mobile) {
        // Fluid width, aspect held by the backing store's own ratio --
        // but owned by the STYLESHEET, not by an inline style. The
        // battle canvas sits inside a crop wrapper that pulls it left
        // and scales it up to compensate (width 127.66%, margin-left
        // -13.83%); an inline `width: 100%` here beat that rule on
        // specificity, so the canvas kept the negative margin and lost
        // the matching zoom. It ended up shifted 51px off the left of
        // its own crop -- clipping the player's front rank away and
        // leaving a dead strip on the right. Clearing the inline width
        // lets each canvas take the width its own rule asks for.
        c.el.style.width = '';
        c.el.style.height = '';
        cssW = c.el.getBoundingClientRect().width || c.w;
      } else {
        c.el.style.width = `${c.w}px`;
        c.el.style.height = `${c.h}px`;
        cssW = c.w * layoutScale;
      }
      const q = Math.min((cssW / c.w) * dpr, 3);
      const w = Math.max(1, Math.round(c.w * q));
      if (c.el.width !== w) {
        c.el.width = w;
        c.el.height = Math.max(1, Math.round(c.h * q));
      }
    }
  },

  // Shrink the layout when the window is too small for it (no scrolling
  // the play area). The shell is FLUID now, so width never drives this:
  // #game-root is already the window less the body padding, and only
  // falls back to a transform below the 960px design floor. What is
  // left is the vertical fit -- a short window still has to show the
  // whole board -- so the scale is a height fit, clamped at 1 because
  // zooming a full-width layout past 1 would push it off both edges.
  //
  // Phones are the exception. Shrinking a 960px layout into 390px means a
  // 0.4x scale, which renders body text at 6px and leaves every button a
  // 30x14px tap target — the whole UI legible only to someone holding the
  // phone an inch from their face. Below the breakpoint the layout
  // reflows at real size instead (see the mobile block in style.css) and
  // only the canvases scale.
  // 899 rather than a phone-only 768: a tablet in portrait (820px) was
  // still getting the desktop layout at 0.83x, which is 9px hero names on
  // a touch screen. The existing stacking rules already break at 900, so
  // the two agree.
  MOBILE_MAX: 899,

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
    // Reflow rather than shrink on a phone.
    const mobile = vw <= this.MOBILE_MAX;
    document.documentElement.classList.toggle('is-mobile', mobile);
    if (mobile) {
      root.style.marginBottom = '0';
      root.style.marginLeft = '0';
      root.style.marginRight = '0';
      this.sizeCanvases(true, 1);
      return;
    }

    const floor = 0.5;
    const pad = 24; // the body's 12px, both sides
    const k = Math.max(floor, Math.min(
      1,                          // never zoom past life size
      (vw - pad) / root.offsetWidth, // only bites under the 960 floor
      (vh - pad) / h
    ));
    root.style.transform = k === 1 ? 'none' : `scale(${k})`;
    // Scaling leaves the layout box at its unscaled size; trim the
    // leftover so page scroll matches what's visible. Only the height
    // needs it: k never exceeds 1, so a shrunk layout sits inside its
    // own box with room to spare rather than overflowing the sides.
    root.style.marginBottom = `${Math.round(root.offsetHeight * (k - 1))}px`;
    root.style.marginLeft = '0';
    root.style.marginRight = '0';

    this.sizeCanvases(false, k);
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
  App.screens.roster = new RosterScreen(App);
  App.screens.blacksmith = new BlacksmithScreen(App);
  App.screens.shop = new ShopScreen(App);
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
  //
  // Normal only, deliberately. Hard and Expert are replay content the
  // player opts into; a badge that lit up forever the moment Hard
  // unlocked would stop meaning anything.
  const campaignBadge = document.getElementById('campaign-badge');
  const updateCampaignBadge = () => {
    if (!campaignBadge) return;
    const open = CAMPAIGN.CHAPTERS.some((ch) =>
      Campaign.chapterUnlocked(ch, 'normal') &&
      ch.nodes.some((n) => Campaign.nodeUnlocked(n, 'normal') &&
        !Campaign.nodeCleared(n, 'normal')));
    campaignBadge.classList.toggle('hidden', !open);
  };

  // Mute: the label is the state, and the choice sticks between visits.
  const muteBtn = document.getElementById('mute-btn');
  if (muteBtn) {
    const paint = () => {
      const off = Sound.isMuted();
      muteBtn.textContent = off ? '🔇' : '🔊';
      muteBtn.classList.toggle('muted', off);
      muteBtn.title = off ? 'Sound off — click to unmute' : 'Sound on — click to mute';
    };
    muteBtn.addEventListener('click', () => {
      Sound.toggle();
      paint();
      Sound.play('click'); // silent when muting, audible when unmuting
    });
    paint();
  }

  // Quest badge: a dot on the tab whenever rewards are claimable.
  const questBadge = document.getElementById('quest-badge');
  const updateQuestBadge = () => {
    const claimable = GameState.claimableQuestCount() +
      (typeof ACHIEVEMENTS !== 'undefined' ? ACHIEVEMENTS.claimableCount() : 0) +
      (GameState.loginClaimable && GameState.loginClaimable() ? 1 : 0);
    questBadge.classList.toggle('hidden', claimable === 0);
  };
  GameState.onChange(() => {
    App.updateCurrencies(); updateQuestBadge(); updateCampaignBadge();
  });
  App.updateCurrencies();
  updateQuestBadge();
  updateCampaignBadge();
  // Emoji-to-SVG upgrader: one initial pass over the static page, then
  // a MutationObserver keeps every future render emoji-free.
  if (typeof Icons !== 'undefined') Icons.install();
  App.showScreen('team');

  // First-run tour. It points at controls on the team screen, so it waits
  // for that screen to be up and laid out before measuring anything.
  const helpBtn = document.getElementById('help-btn');
  if (helpBtn) {
    helpBtn.addEventListener('click', async () => {
      if (Onboarding.active()) return;
      await App.showScreen('team');
      requestAnimationFrame(() => Onboarding.start());
    });
  }
  if (!GameState.onboarded) {
    // Two frames: one for the screen's own layout, one for fitToScreen's
    // transform. A spotlight measured before either is aimed at nothing.
    requestAnimationFrame(() => requestAnimationFrame(() => Onboarding.start()));
  }

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
    // One bad frame must not kill the game: an uncaught throw here would
    // skip the re-arm below and freeze every canvas on the page for good.
    try {
      advance(now, true);
    } catch (e) {
      console.error('frame error:', e);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  setInterval(() => {
    if (document.hidden) advance(performance.now(), false);
  }, 1000);
})();
