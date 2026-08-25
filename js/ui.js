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
    // Unit inspector: the sheet behind any fighter on the field.
    this.inspectEl = document.getElementById('inspect-panel');
    this.inspected = null;
    const inspectClose = document.getElementById('inspect-close');
    if (inspectClose) {
      inspectClose.addEventListener('click', () => this.showInspect(null));
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

      // Revives need a fallen ally to exist; stance-gated shots need
      // the stance up (Silas's Lumen Arrow).
      const needsDead = a.targeting === 'dead-ally' &&
        !this.battle.units.some((u) => !u.alive && u.team === TEAM.PLAYER);
      const needsStance = a.requires &&
        !unit.statusEffects.some((fx) => fx.stat === a.requires);
      if (needsStance) btn.title += '\n\nNeeds Aiming Stance — cast it first.';
      btn.disabled = abilityState.cooldownRemaining > 0 || needsDead || needsStance;
      btn.addEventListener('click', () => this.selectAbility(abilityState, btn));
      this.buttonsEl.appendChild(btn);
    });

    this.abilityBar.classList.remove('hidden');
  }

  // The banner is dismissed by its own buttons; this lets the screen
  // take it down too, when it replaces the banner with something else.
  hideBanner() {
    if (this.bannerEl) this.bannerEl.classList.add('hidden');
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
    if (!this.battle) return;
    const mode = this.renderer.targetingMode;
    const { x, y } = this.canvasPoint(e);
    const unit = this.battle.unitAt(x, y, !mode || mode === 'dead-ally');

    // Picking a target comes first — mid-cast, a click is an order.
    if (this.selectedAbility && mode) {
      if (!unit) return;
      const valid =
        (mode === 'enemy' && unit.team === TEAM.ENEMY && unit.alive) ||
        (mode === 'ally' && unit.team === TEAM.PLAYER && unit.alive) ||
        (mode === 'dead-ally' && unit.team === TEAM.PLAYER && !unit.alive);
      if (valid) this.commit(unit);
      return;
    }
    // Otherwise a click is a question: who is this, and what is on it?
    this.showInspect(unit && unit === this.inspected ? null : unit);
  }

  onCanvasMove(e) {
    if (!this.battle) {
      this.canvas.style.cursor = 'default';
      return;
    }
    const { x, y } = this.canvasPoint(e);
    const mode = this.renderer.targetingMode;
    const unit = this.battle.unitAt(x, y, !mode || mode === 'dead-ally');
    // Hovering names a unit whether or not an ability is up: the plate
    // spells out who it is, and the cursor says it can be inspected.
    this.renderer.hoveredUnit = unit;
    this.canvas.style.cursor = unit ? 'pointer' : 'default';
  }

  // ---- Unit inspector ----------------------------------------------------

  // The full sheet for one fighter: what it is, what it is carrying
  // right now (with turns left and who put it there), and its kit with
  // live cooldowns. Passing null closes the panel.
  showInspect(unit) {
    this.inspected = unit && unit.alive !== undefined ? unit : null;
    if (!this.inspectEl) return;
    if (!this.inspected) {
      this.inspectEl.classList.add('hidden');
      return;
    }
    // Stand on the far side of whoever is being read: your side holds
    // the left of the field and the enemy the right, so the panel never
    // covers its own subject (nor the click that would close it).
    const onLeft = unit.team === TEAM.ENEMY;
    this.inspectEl.classList.toggle('on-left', onLeft);
    this.inspectEl.classList.toggle('on-right', !onLeft);
    document.getElementById('inspect-title').textContent =
      `${unit.name}${unit.level ? ` · Lv ${unit.level}` : ''}`;
    document.getElementById('inspect-body').innerHTML = this.inspectHtml(unit);
    this.inspectEl.classList.remove('hidden');
  }

  inspectHtml(unit) {
    const n = (v) => Math.round(v || 0).toLocaleString();
    const pct = (v) => `${Math.round((v || 0) * 1000) / 10}%`;
    const elInfo = unit.element && typeof Elements !== 'undefined'
      ? Elements.info(unit.element) : null;
    const side = unit.team === TEAM.PLAYER ? 'Your side' : 'Enemy';
    const hpPct = Math.max(0, Math.round((unit.hp / unit.maxHp) * 100));
    const shield = unit.shieldTotal ? unit.shieldTotal() : 0;

    // Statuses, with the turns left and the hand behind them — the
    // nameplate icons say WHAT is on; this says how long and from whom.
    const fx = (unit.statusEffects || []).map((f) => {
      const key = f.kind === 'dot' ? (f.flavor === 'burn' ? 'burn' : 'dot')
        : f.kind === 'hot' || f.kind === 'bubble' ? f.kind
        : f.stat === 'damageTaken' ? (f.kind === 'buff' ? 'ward' : 'vulnerable')
        : f.stat;
      const def = typeof StatusIcons !== 'undefined' ? StatusIcons.DEFS[key] : null;
      const good = f.kind === 'buff' || f.kind === 'hot' || f.kind === 'bubble' ||
        f.kind === 'shield';
      const name = def ? def.title : (f.stat || f.kind);
      const amount = f.mult ? ` ×${f.mult}` : f.amount ? ` ${n(f.amount)}` : '';
      const turns = f.turns > 0 ? `${f.turns} turn${f.turns > 1 ? 's' : ''}` : '—';
      const from = f.source && f.source.name && f.source !== unit
        ? ` · from ${f.source.name}` : '';
      return `<div class="insp-fx ${good ? 'fx-good' : 'fx-bad'}">
        ${name}${amount} <span class="insp-dim">${turns}${from}</span></div>`;
    }).join('');

    const kit = (unit.abilities || []).map((a) => {
      const d = a.def || a;
      const cd = a.cooldownRemaining > 0
        ? `<span class="insp-cd">${a.cooldownRemaining} turn${a.cooldownRemaining > 1 ? 's' : ''}</span>`
        : '<span class="insp-ready">ready</span>';
      return `<div class="insp-skill"><b>${d.name}</b> ${cd}
        <div class="insp-dim">${d.description || ''}</div></div>`;
    }).join('');

    return `
      <div class="insp-head">
        ${side}${elInfo ? ` · <span style="color:${elInfo.color}">${elInfo.name}</span>` : ''}
        ${unit.def && unit.def.title ? ` · ${unit.def.title}` : ''}
      </div>
      <div class="insp-hp">
        <div class="insp-hp-bar"><div class="insp-hp-fill" style="width:${hpPct}%"></div></div>
        <span>${n(unit.hp)} / ${n(unit.maxHp)} HP${shield ? ` (+${n(shield)} shield)` : ''}</span>
      </div>
      <div class="insp-stats">
        ATK ${n(unit.effectiveStat('atk'))} · DEF ${n(unit.effectiveStat('def'))} ·
        SPD ${n(unit.effectiveStat('speed'))}
      </div>
      <div class="insp-stats insp-dim">
        CRIT ${pct(unit.effectiveStat('critChance'))} ·
        CRIT DMG ${pct(unit.effectiveStat('critDamage'))} ·
        ACC ${pct(unit.debuffAccuracy ? unit.debuffAccuracy() : 0)} ·
        RES ${pct(unit.debuffResistance ? unit.debuffResistance() : 0)} ·
        DODGE ${pct(unit.dodgeChance ? unit.dodgeChance() : 0)}
      </div>
      <div class="insp-sub">Status${fx ? '' : ' — none'}</div>
      ${fx}
      <div class="insp-sub">Kit</div>
      ${kit}`;
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
      // The same plates the battlefield draws, rendered at legend size.
      const img = (key, variant) =>
        `<img class="legend-icon" src="${StatusIcons.dataURL(key, variant, 18)}"
           width="18" height="18" alt="">`;
      rows.innerHTML = StatusIcons.LEGEND.map((key) => {
        const def = StatusIcons.DEFS[key];
        const plates = def.stat ? img(key, 'buff') + img(key, 'debuff') : img(key, 'buff');
        const note = def.stat
          ? 'green raised, red lowered' : (def.note || def.title);
        return `<div class="legend-row">
          <span class="legend-glyph">${plates}</span>
          <span class="legend-name">${def.title}</span>
          <span class="legend-note">${note}</span>
        </div>`;
      }).join('') + `
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
    this.bannerTitle.textContent =
      opts.title || (winner === TEAM.PLAYER ? 'VICTORY' : 'DEFEAT');
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
