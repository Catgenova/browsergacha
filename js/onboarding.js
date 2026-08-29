// First-run tour.
//
// A brand-new save lands on the team screen with five heroes, seven
// hexes and no explanation of any of it: that hexes have rows, that a
// hero standing on the hex their training suits switches on a whole
// extra ability, or that the campaign is the spine everything else
// hangs off. This walks a new player through that in seven steps.
//
// Only genuinely new saves see it (js/state.js treats a save that came
// off disk as already onboarded); anyone can replay it from the ? in
// the top bar.

const Onboarding = (() => {
  // Each step points at something already on screen. `el` is looked up
  // when the step is shown, so a control that is hidden at that moment
  // (the boss row before it unlocks) just falls back to a centred card.
  const STEPS = [
    {
      title: 'Welcome to Browser Gacha',
      body: 'You command seven heroes on a hex grid. Where they stand matters as ' +
        'much as who they are. This takes about a minute — skip it any time, ' +
        'and replay it from the ? in the top bar.',
    },
    {
      el: '#team-canvas',
      title: 'The board has rows',
      body: 'Front hexes take the hits. Center and back sit behind them, and most ' +
        'enemy kits have to work to reach them. Click a hero below, then click a ' +
        'hex to place them; click a placed hero and another hex to move or swap.',
    },
    {
      el: '#hero-details',
      title: 'Every hero has a hex that suits them',
      body: 'Select a hero and this panel shows their positional bonus — a whole ' +
        'extra ability that only switches on while they stand in the right row. ' +
        'A tank in the back row is a tank with its passive turned off.',
    },
    {
      el: '#roster-section',
      title: 'Your roster',
      body: 'Duplicates star heroes up; levels come from fighting. Favourite a hero ' +
        'to pin them to the top, and use Report when you want to know who is ' +
        'actually worth the investment.',
    },
    {
      // No target: the campaign lost its own nav tab and lives behind the
      // Battle tab's Campaign button, which sits inside a panel that is
      // hidden while a fight is running -- so there is nothing reliable to
      // point at. A null target centres the card, which position() already
      // handles, and the step that follows shows where fights start.
      el: null,
      title: 'The campaign is the spine',
      body: 'Clearing campaign nodes is what unlocks hunts, bosses and later ' +
        'chapters. You will find it on the Battle tab, next to the hunt and ' +
        'boss pickers. First clears pay scrolls — chapter-end fights pay ' +
        'Temporal Scrolls, which are the only source of Dark and Light heroes.',
    },
    {
      el: '.nav-tab[data-screen="summon"]',
      title: 'Scrolls become heroes',
      body: 'Common and Rare scrolls summon from the ordinary roster; Temporal ' +
        'scrolls are the Dark and Light one. You start with five scrolls and a ' +
        'rare — spend them whenever you like, there is nothing to save up for.',
    },
    {
      el: '.nav-tab[data-screen="battle"]',
      title: 'Now send them in',
      body: 'Every fight starts on the Battle tab — hunts, bosses, elemental ' +
        'bosses and the tower each have a picker there, and the campaign is ' +
        'one button away. Battles run themselves if you want them to (Auto), ' +
        'and they keep running while you are off summoning or reading the ' +
        'compendium.',
    },
  ];

  let root = null;
  let index = 0;
  let onFinish = null;

  function teardown() {
    if (root) root.remove();
    root = null;
    window.removeEventListener('resize', position);
    window.removeEventListener('scroll', position, true);
    window.removeEventListener('keydown', onKey);
  }

  function finish(completed) {
    teardown();
    if (typeof GameState !== 'undefined') GameState.setOnboarded(true);
    const cb = onFinish;
    onFinish = null;
    if (cb) cb(completed);
  }

  function onKey(e) {
    if (e.key === 'Escape') finish(false);
    else if (e.key === 'Enter' || e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') back();
  }

  function next() {
    if (index >= STEPS.length - 1) { finish(true); return; }
    index++;
    render();
  }

  function back() {
    if (index === 0) return;
    index--;
    render();
  }

  // Put the spotlight over the step's target and the card beside it,
  // clamped to the viewport so a card never hangs off the edge.
  function position() {
    if (!root) return;
    const step = STEPS[index];
    const spot = root.querySelector('.ob-spot');
    const card = root.querySelector('.ob-card');
    const target = step.el ? document.querySelector(step.el) : null;
    const rect = target && target.offsetParent !== null
      ? target.getBoundingClientRect() : null;

    if (!rect || rect.width === 0) {
      // Nothing to point at: centre the card and light the whole screen.
      spot.classList.add('hidden');
      card.style.left = '50%';
      card.style.top = '50%';
      card.style.transform = 'translate(-50%, -50%)';
      return;
    }
    spot.classList.remove('hidden');
    const pad = 6;
    spot.style.left = `${rect.left - pad}px`;
    spot.style.top = `${rect.top - pad}px`;
    spot.style.width = `${rect.width + pad * 2}px`;
    spot.style.height = `${rect.height + pad * 2}px`;

    card.style.transform = 'none';
    const cw = card.offsetWidth;
    const chh = card.offsetHeight;
    const gap = 14;
    // Below the target when there is room, otherwise above it.
    let top = rect.bottom + gap;
    if (top + chh > window.innerHeight - 8) top = rect.top - gap - chh;
    top = Math.max(8, Math.min(top, window.innerHeight - chh - 8));
    let left = rect.left + rect.width / 2 - cw / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - cw - 8));
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  }

  function render() {
    const step = STEPS[index];
    root.innerHTML = `
      <div class="ob-spot"></div>
      <div class="ob-card" role="dialog" aria-modal="true">
        <div class="ob-step">Step ${index + 1} of ${STEPS.length}</div>
        <h3>${step.title}</h3>
        <p>${step.body}</p>
        <div class="ob-actions">
          <button class="panel-btn ob-skip">Skip tour</button>
          <span class="ob-dots">${STEPS.map((_, i) =>
            `<i class="${i === index ? 'on' : ''}"></i>`).join('')}</span>
          <button class="panel-btn ob-back"${index === 0 ? ' disabled' : ''}>Back</button>
          <button class="panel-btn gold ob-next">${
            index === STEPS.length - 1 ? 'Start playing' : 'Next'}</button>
        </div>
      </div>`;
    root.querySelector('.ob-skip').onclick = () => finish(false);
    root.querySelector('.ob-back').onclick = back;
    root.querySelector('.ob-next').onclick = next;

    // Bring the target into view first. On a phone the nav strip scrolls
    // sideways, so a tab near the end of it can sit entirely off-screen;
    // without this the spotlight lands outside the viewport and the step
    // points at nothing.
    const target = step.el ? document.querySelector(step.el) : null;
    if (target && target.offsetParent !== null) {
      target.scrollIntoView({ block: 'center', inline: 'center' });
    }
    position();
    requestAnimationFrame(position);
  }

  // Start the tour. `done` fires whether it was completed or skipped.
  function start(done = null) {
    if (root) return;
    onFinish = done;
    index = 0;
    root = document.createElement('div');
    root.id = 'onboarding';
    document.body.appendChild(root);
    window.addEventListener('resize', position);
    // Capture phase: the page scrolls, and so does the nav strip on a
    // phone. Either moves the target out from under the spotlight.
    window.addEventListener('scroll', position, true);
    window.addEventListener('keydown', onKey);
    render();
    // The team screen's canvas settles a frame after enter(); re-measure
    // so the first spotlight is not aimed at a half-laid-out board.
    requestAnimationFrame(position);
  }

  function active() { return !!root; }

  return { start, active, STEPS };
})();
