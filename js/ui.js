// DOM UI for the battle screen: ability bar, target selection, battle log,
// end banner. Rebindable to a fresh Battle via bind().

class UI {
  constructor(renderer, canvas) {
    this.renderer = renderer;
    this.canvas = canvas;
    this.battle = null;

    this.abilityBar = document.getElementById('ability-bar');
    this.heroNameEl = document.getElementById('active-hero-name');
    this.buttonsEl = document.getElementById('ability-buttons');
    this.targetHint = document.getElementById('target-hint');
    this.logEl = document.getElementById('battle-log');
    this.logFilter = 'all';
    document.querySelectorAll('.log-filter').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.log-filter').forEach((b) =>
          b.classList.toggle('active', b === btn));
        this.setLogFilter(btn.dataset.filter);
      });
    });
    this.bindKeys();

    // Status legend: the pips are meaningless until you're told what
    // they are, so the key is one click away from the battle.
    this.legendEl = document.getElementById('status-legend');
    const legendBtn = document.getElementById('legend-btn');
    if (legendBtn && this.legendEl) {
      legendBtn.addEventListener('click', () => this.toggleLegend());
      document.getElementById('legend-close')
        .addEventListener('click', () => this.toggleLegend(false));
    }
    this.bannerEl = document.getElementById('battle-banner');
    this.bannerTitle = document.getElementById('banner-title');
    this.bannerSub = document.getElementById('banner-sub');
    this.bannerReturn = document.getElementById('banner-return');
    this.bannerRetry = document.getElementById('banner-retry');
    this.bannerNext = document.getElementById('banner-next');
    this.bannerAdvance = document.getElementById('banner-advance');

    this.activeHero = null;
    this.selectedAbility = null; // ability state awaiting a target
    this.onReturn = null;        // wired by the app (back to team screen)
    this.onRetry = null;         // boss banner: refight the same stage
    this.onNextStage = null;     // boss banner: advance to the next stage
    this.onAdvance = null;       // campaign banner: straight into the next mission

    canvas.addEventListener('click', (e) => this.onCanvasClick(e));
    canvas.addEventListener('mousemove', (e) => this.onCanvasMove(e));
    this.bannerReturn.addEventListener('click', () => {
      this.bannerEl.classList.add('hidden');
      if (this.onReturn) this.onReturn();
    });
    this.bannerRetry.addEventListener('click', () => {
      this.bannerEl.classList.add('hidden');
      if (this.onRetry) this.onRetry();
    });
    this.bannerNext.addEventListener('click', () => {
      this.bannerEl.classList.add('hidden');
      if (this.onNextStage) this.onNextStage();
    });
    this.bannerAdvance.addEventListener('click', () => {
      this.bannerEl.classList.add('hidden');
      if (this.onAdvance) this.onAdvance();
    });
  }

  // Attach to a (new) battle and reset all transient UI.
  bind(battle) {
    this.battle = battle;
    this.hideAbilityBar();
    this.bannerEl.classList.add('hidden');
    this.logEl.innerHTML = '';

    battle.onLog = (msg, cls) => this.appendLog(msg, cls);
    battle.onPlayerTurn = (unit) => this.showAbilityBar(unit);
  }

  canvasPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CONFIG.CANVAS_W / rect.width),
      y: (e.clientY - rect.top) * (CONFIG.CANVAS_H / rect.height),
    };
  }

  // ---- Ability bar -------------------------------------------------------

  showAbilityBar(unit) {
    this.activeHero = unit;
    this.selectedAbility = null;
    this.heroNameEl.textContent = `${unit.name}'s turn`;
    this.buttonsEl.innerHTML = '';
    this.targetHint.classList.add('hidden');
    this.renderer.targetingMode = null;
    this.renderer.targetingSource = null;

    unit.abilities.forEach((abilityState) => {
      const a = abilityState.def;
      const btn = document.createElement('button');
      btn.className = 'ability-btn';
      btn.title = a.description;

      const cdText =
        abilityState.cooldownRemaining > 0
          ? `<span class="cd-label cd-remaining">CD: ${abilityState.cooldownRemaining} turns</span>`
          : `<span class="cd-label">${a.cooldown > 0 ? `CD ${a.cooldown}` : 'No CD'}</span>`;
      const iconHtml = a.icon
        ? `<img class="ability-icon" src="${Sprites.assetUrl(a.icon)}" alt="">`
        : '';
      const lvText = abilityState.level > 1 ? ` Lv${abilityState.level}` : '';
      // Which side this points at, marked before it is clicked — an
      // ability that fires the moment you select it never gets a target
      // prompt, so the button is the only chance to say so.
      const side = Abilities.sideOf(a.targeting);
      const SIDE = {
        enemy: { label: 'Enemy', glyph: '\u2694' },
        ally: { label: a.targeting === 'dead-ally' ? 'Fallen ally' : 'Ally', glyph: '\u271a' },
        self: { label: 'Self', glyph: '\u25c9' },
      }[side];
      btn.classList.add(`side-${side}`);
      const sideHtml =
        `<span class="side-label">${SIDE.glyph} ${SIDE.label}</span>`;
      btn.innerHTML = `${iconHtml}${a.name}${lvText}${sideHtml}${cdText}`;
      btn.title = `${a.description}\n\nTargets: ${SIDE.label.toLowerCase()}` +
        (Abilities.needsTarget(a.targeting) ? ' \u2014 pick one' : ' \u2014 fires at once');

      // Revives need a fallen ally to exist.
      const needsDead = a.targeting === 'dead-ally' &&
        !this.battle.units.some((u) => !u.alive && u.team === TEAM.PLAYER);
      btn.disabled = abilityState.cooldownRemaining > 0 || needsDead;
      btn.addEventListener('click', () => this.selectAbility(abilityState, btn));
      this.buttonsEl.appendChild(btn);
    });

    this.abilityBar.classList.remove('hidden');
  }

  hideAbilityBar() {
    this.abilityBar.classList.add('hidden');
    this.renderer.targetingMode = null;
    this.renderer.targetingSource = null;
    this.renderer.rowMode = false;
    this.renderer.hoveredUnit = null;
    this.activeHero = null;
    this.selectedAbility = null;
  }

  selectAbility(abilityState, btn) {
    if (typeof Sound !== 'undefined') Sound.play('click');
    this.buttonsEl.querySelectorAll('.ability-btn').forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    this.selectedAbility = abilityState;

    const targeting = abilityState.def.targeting;
    if (!Abilities.needsTarget(targeting)) {
      this.commit(null); // hits a whole side or the caster — fire at once
      return;
    }
    // 'enemy', 'enemy-row' (pick any enemy in the row), 'ally', or
    // 'dead-ally' (pick a fallen teammate).
    this.renderer.targetingMode =
      targeting === 'ally' ? 'ally' :
      targeting === 'dead-ally' ? 'dead-ally' : 'enemy';
    this.renderer.targetingSource = this.battle.activeUnit;
    this.renderer.rowMode = targeting === 'enemy-row';
    // Name the side rather than saying "a target" — which side to click
    // is the whole question at this moment.
    const HINT = {
      enemy: targeting === 'enemy-row'
        ? '\u2694 Click an ENEMY \u2014 the whole row is hit'
        : '\u2694 Click an ENEMY to attack',
      ally: '\u271a Click an ALLY to help',
      'dead-ally': '\u271a Click a FALLEN ally to revive',
    }[targeting === 'enemy-row' ? 'enemy' : targeting] || 'Select a target\u2026';
    this.targetHint.textContent = HINT;
    this.targetHint.classList.remove('hint-enemy', 'hint-ally', 'hint-self');
    this.targetHint.classList.add(`hint-${Abilities.sideOf(targeting)}`);
    this.targetHint.classList.remove('hidden');
  }

  commit(target) {
    const hero = this.activeHero;
    const ability = this.selectedAbility;
    // No hero deciding means no ability to commit. Unreachable while the
    // bar is display:none, but performAbility(null) throws on the
    // caster's animator, so it is not worth leaving to the layout.
    if (!hero || !ability) return;
    this.hideAbilityBar();
    this.battle.performAbility(hero, ability, target);
  }

  // ---- Canvas interaction ------------------------------------------------

  onCanvasClick(e) {
    if (!this.battle || !this.selectedAbility || !this.renderer.targetingMode) return;
    const mode = this.renderer.targetingMode;
    const { x, y } = this.canvasPoint(e);
    const unit = this.battle.unitAt(x, y, mode === 'dead-ally');
    if (!unit) return;

    const valid =
      (mode === 'enemy' && unit.team === TEAM.ENEMY && unit.alive) ||
      (mode === 'ally' && unit.team === TEAM.PLAYER && unit.alive) ||
      (mode === 'dead-ally' && unit.team === TEAM.PLAYER && !unit.alive);
    if (valid) this.commit(unit);
  }

  onCanvasMove(e) {
    if (!this.battle || !this.renderer.targetingMode) {
      this.canvas.style.cursor = 'default';
      return;
    }
    const { x, y } = this.canvasPoint(e);
    const unit = this.battle.unitAt(x, y, this.renderer.targetingMode === 'dead-ally');
    this.renderer.hoveredUnit = unit;
    this.canvas.style.cursor = unit ? 'pointer' : 'default';
  }

  // ---- Log & banner ------------------------------------------------------

  // Log filters: in a 7v7 the log is a firehose, and the line you
  // wanted has usually scrolled past by the time you look. Filters keep
  // one side's actions (or just the system lines), and identical
  // consecutive lines collapse into a ×N counter instead of repeating.
  setLogFilter(filter) {
    this.logFilter = filter;
    this.logEl.classList.toggle('filter-player', filter === 'log-player');
    this.logEl.classList.toggle('filter-enemy', filter === 'log-enemy');
    this.logEl.classList.toggle('filter-system', filter === 'log-system');
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  // The log follows the newest line, but only while the player is already
  // reading the bottom of it. Scroll up to check what happened and the
  // view stays put until you come back down.
  atLogBottom() {
    return this.logEl.scrollHeight - this.logEl.scrollTop
      - this.logEl.clientHeight < 24;
  }

  appendLog(message, cls) {
    const follow = this.atLogBottom();
    // Collapse an immediate repeat rather than printing it again.
    const last = this.logEl.lastElementChild;
    if (last && last.dataset.msg === message && last.className.startsWith(cls)) {
      const n = Number(last.dataset.count || 1) + 1;
      last.dataset.count = n;
      last.textContent = `${message}  ×${n}`;
      if (follow) this.logEl.scrollTop = this.logEl.scrollHeight;
      return;
    }
    const line = document.createElement('div');
    line.className = cls;
    line.dataset.msg = message;
    line.textContent = message;
    this.logEl.appendChild(line);
    // Keep the log bounded; ancient lines are never read.
    while (this.logEl.childElementCount > 300) {
      this.logEl.removeChild(this.logEl.firstElementChild);
    }
    if (follow) this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  toggleLegend(force) {
    if (!this.legendEl) return;
    const show = force === undefined
      ? this.legendEl.classList.contains('hidden') : force;
    if (show) {
      const rows = document.getElementById('legend-rows');
      const icons = Renderer.STATUS_ICONS;
      const buffable = new Set(['atk', 'def', 'speed', 'critChance', 'critDamage']);
      rows.innerHTML = Object.entries(icons).map(([key, ic]) => {
        const glyph = ic.color ? ic.glyph : `${ic.glyph}▲/${ic.glyph}▼`;
        const color = ic.color || '#8ecbff';
        const note = buffable.has(key)
          ? '▲ raised, ▼ lowered' : (ic.note || ic.title);
        return `<div class="legend-row">
          <span class="legend-glyph" style="color:${color}">${glyph}</span>
          <span class="legend-name">${ic.title}</span>
          <span class="legend-note">${note}</span>
        </div>`;
      }).join('') + `
        <div class="legend-row">
          <span class="legend-glyph" style="color:#8ee8ff">◆n</span>
          <span class="legend-name">Crystal mirrors</span>
          <span class="legend-note">charges remaining</span>
        </div>
        <div class="legend-row">
          <span class="legend-glyph" style="color:#ff9a5a">⚠</span>
          <span class="legend-name">Charging</span>
          <span class="legend-note">this skill lands next turn</span>
        </div>
        <div class="legend-row">
          <span class="legend-glyph" style="color:#ffd76a">★</span>
          <span class="legend-name">Position bonus</span>
          <span class="legend-note">standing in the right hex</span>
        </div>
        <div class="legend-row">
          <span class="legend-glyph" style="color:#ffd76a">▲ WEAK</span>
          <span class="legend-name">Elemental</span>
          <span class="legend-note">▲ you hit harder · ▼ they resist</span>
        </div>`;
    }
    this.legendEl.classList.toggle('hidden', !show);
  }

  // Keyboard: 1/2/3 fire abilities, Q/W/E pick the first three targets,
  // Escape backs out of targeting, Space toggles auto, Enter dismisses
  // the end-of-battle banner. Ignored while typing in a field.
  bindKeys() {
    window.addEventListener('keydown', (e) => {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      // Only act while the battle screen is the one on screen.
      const screen = document.getElementById('screen-battle');
      if (!screen || screen.classList.contains('hidden')) return;

      if (e.key === 'Escape') {
        if (this.legendEl && !this.legendEl.classList.contains('hidden')) {
          this.toggleLegend(false);
          e.preventDefault();
          return;
        }
        if (this.renderer.targetingMode) {
          this.renderer.targetingMode = null;
          this.renderer.targetingSource = null;
          this.selectedAbility = null;
          this.buttonsEl.querySelectorAll('.ability-btn')
            .forEach((b) => b.classList.remove('selected'));
          this.targetHint.classList.add('hidden');
          e.preventDefault();
        }
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        const retreat = document.getElementById('retreat-btn');
        if (retreat) { retreat.click(); e.preventDefault(); }
        return;
      }
      if (e.key === 'k' || e.key === 'K') {
        this.toggleLegend();
        e.preventDefault();
        return;
      }
      if (e.key === ' ') {
        const auto = document.getElementById('auto-btn');
        if (auto) { auto.click(); e.preventDefault(); }
        return;
      }
      if (e.key === 'Enter') {
        const banner = document.getElementById('battle-banner');
        if (banner && !banner.classList.contains('hidden')) {
          document.getElementById('banner-return').click();
          e.preventDefault();
        }
        return;
      }
      // Ability hotkeys, only while this hero is actually deciding.
      if ('123'.includes(e.key) && !this.abilityBar.classList.contains('hidden')) {
        const btn = this.buttonsEl.querySelectorAll('.ability-btn')[Number(e.key) - 1];
        if (btn && !btn.disabled) { btn.click(); e.preventDefault(); }
        return;
      }
      // Target hotkeys while choosing.
      const targetKeys = 'qwertyu';
      if (this.renderer.targetingMode && targetKeys.includes(e.key.toLowerCase())) {
        const side = this.renderer.targetingMode === 'enemy'
          ? this.battle.livingUnits(TEAM.ENEMY)
          : this.battle.livingUnits(TEAM.PLAYER);
        const pick = side[targetKeys.indexOf(e.key.toLowerCase())];
        if (pick) { this.commit(pick); e.preventDefault(); }
      }
    });
  }

  // opts: { retry, next } toggle the boss-flow buttons.
  showBanner(winner, subText = '', opts = {}) {
    this.hideAbilityBar();
    if (typeof Sound !== 'undefined') {
      Sound.play(winner === TEAM.PLAYER ? 'victory' : 'defeat');
    }
    this.bannerTitle.textContent = winner === TEAM.PLAYER ? 'VICTORY' : 'DEFEAT';
    // Multi-line rewards (XP, level-ups) arrive as <br>-separated text.
    this.bannerSub.innerHTML = subText;
    this.bannerRetry.classList.toggle('hidden', !opts.retry);
    this.bannerNext.classList.toggle('hidden', !opts.next);
    this.bannerNext.textContent = opts.nextLabel || 'Next Stage';
    this.bannerAdvance.classList.toggle('hidden', !opts.advance);
    this.bannerAdvance.textContent = opts.advanceLabel || 'Next Mission';
    this.bannerAdvance.title = opts.advanceTitle || '';
    this.bannerEl.classList.remove('hidden');
    this.appendLog(winner === TEAM.PLAYER ? 'Victory!' : 'Defeat…', 'log-system');
  }
}
