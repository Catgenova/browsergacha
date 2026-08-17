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
    this.bannerEl = document.getElementById('battle-banner');
    this.bannerTitle = document.getElementById('banner-title');
    this.bannerSub = document.getElementById('banner-sub');
    this.bannerReturn = document.getElementById('banner-return');

    this.activeHero = null;
    this.selectedAbility = null; // ability state awaiting a target
    this.onReturn = null;        // wired by the app (back to team screen)

    canvas.addEventListener('click', (e) => this.onCanvasClick(e));
    canvas.addEventListener('mousemove', (e) => this.onCanvasMove(e));
    this.bannerReturn.addEventListener('click', () => {
      this.bannerEl.classList.add('hidden');
      if (this.onReturn) this.onReturn();
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

    unit.abilities.forEach((abilityState) => {
      const a = abilityState.def;
      const btn = document.createElement('button');
      btn.className = 'ability-btn';
      btn.title = a.description;

      const cdText =
        abilityState.cooldownRemaining > 0
          ? `<span class="cd-label cd-remaining">CD: ${abilityState.cooldownRemaining} turns</span>`
          : `<span class="cd-label">${a.cooldown > 0 ? `CD ${a.cooldown}` : 'No CD'}</span>`;
      btn.innerHTML = `${a.name}${cdText}`;

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
    this.renderer.rowMode = false;
    this.renderer.hoveredUnit = null;
    this.activeHero = null;
    this.selectedAbility = null;
  }

  selectAbility(abilityState, btn) {
    this.buttonsEl.querySelectorAll('.ability-btn').forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    this.selectedAbility = abilityState;

    const targeting = abilityState.def.targeting;
    if (targeting === 'self' || targeting === 'all-enemies' ||
        targeting === 'all-allies' || targeting === 'front-allies' ||
        targeting === 'back-enemies') {
      this.commit(null); // no target needed — fire immediately
    } else {
      // 'enemy', 'enemy-row' (pick any enemy in the row), 'ally', or
      // 'dead-ally' (pick a fallen teammate).
      this.renderer.targetingMode =
        targeting === 'ally' ? 'ally' :
        targeting === 'dead-ally' ? 'dead-ally' : 'enemy';
      this.renderer.rowMode = targeting === 'enemy-row';
      this.targetHint.classList.remove('hidden');
    }
  }

  commit(target) {
    const hero = this.activeHero;
    const ability = this.selectedAbility;
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

  appendLog(message, cls) {
    const line = document.createElement('div');
    line.className = cls;
    line.textContent = message;
    this.logEl.appendChild(line);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  showBanner(winner, subText = '') {
    this.hideAbilityBar();
    this.bannerTitle.textContent = winner === TEAM.PLAYER ? 'VICTORY' : 'DEFEAT';
    this.bannerSub.textContent = subText;
    this.bannerEl.classList.remove('hidden');
    this.appendLog(winner === TEAM.PLAYER ? 'Victory!' : 'Defeat…', 'log-system');
  }
}
