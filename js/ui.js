// DOM UI: ability bar, target selection, battle log, end banner.

class UI {
  constructor(battle, renderer, canvas) {
    this.battle = battle;
    this.renderer = renderer;
    this.canvas = canvas;

    this.abilityBar = document.getElementById('ability-bar');
    this.heroNameEl = document.getElementById('active-hero-name');
    this.buttonsEl = document.getElementById('ability-buttons');
    this.targetHint = document.getElementById('target-hint');
    this.logEl = document.getElementById('battle-log');
    this.bannerEl = document.getElementById('battle-banner');

    this.activeHero = null;
    this.selectedAbility = null; // ability state awaiting a target

    battle.onLog = (msg, cls) => this.appendLog(msg, cls);
    battle.onPlayerTurn = (unit) => this.showAbilityBar(unit);
    battle.onBattleEnd = (winner) => this.showBanner(winner);

    canvas.addEventListener('click', (e) => this.onCanvasClick(e));
    canvas.addEventListener('mousemove', (e) => this.onCanvasMove(e));
  }

  canvasPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
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

      btn.disabled = abilityState.cooldownRemaining > 0;
      btn.addEventListener('click', () => this.selectAbility(abilityState, btn));
      this.buttonsEl.appendChild(btn);
    });

    this.abilityBar.classList.remove('hidden');
  }

  hideAbilityBar() {
    this.abilityBar.classList.add('hidden');
    this.renderer.targetingMode = null;
    this.renderer.hoveredUnit = null;
    this.activeHero = null;
    this.selectedAbility = null;
  }

  selectAbility(abilityState, btn) {
    // Toggle selection highlight
    this.buttonsEl.querySelectorAll('.ability-btn').forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    this.selectedAbility = abilityState;

    const targeting = abilityState.def.targeting;
    if (targeting === 'self' || targeting === 'all-enemies' || targeting === 'all-allies') {
      // No target needed — fire immediately.
      this.commit(null);
    } else {
      this.renderer.targetingMode = targeting; // 'enemy' | 'ally'
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
    if (!this.selectedAbility || !this.renderer.targetingMode) return;
    const { x, y } = this.canvasPoint(e);
    const unit = this.battle.unitAt(x, y);
    if (!unit) return;

    const mode = this.renderer.targetingMode;
    const valid =
      (mode === 'enemy' && unit.team === TEAM.ENEMY) ||
      (mode === 'ally' && unit.team === TEAM.PLAYER);
    if (valid) this.commit(unit);
  }

  onCanvasMove(e) {
    if (!this.renderer.targetingMode) {
      this.canvas.style.cursor = 'default';
      return;
    }
    const { x, y } = this.canvasPoint(e);
    const unit = this.battle.unitAt(x, y);
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

  showBanner(winner) {
    this.hideAbilityBar();
    this.bannerEl.textContent = winner === TEAM.PLAYER ? 'VICTORY' : 'DEFEAT';
    this.bannerEl.classList.remove('hidden');
    this.appendLog(winner === TEAM.PLAYER ? 'Victory!' : 'Defeat…', 'log-system');
  }
}
