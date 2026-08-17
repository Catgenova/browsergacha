// Battle screen: builds a Battle from the saved team, generates an enemy
// wave, and runs the existing engine/renderer/UI against it.

class BattleScreen {
  constructor(app) {
    this.app = app;
    this.el = document.getElementById('screen-battle');
    this.canvas = document.getElementById('battle-canvas');
    app.hiDpiCanvases.push({ el: this.canvas, w: CONFIG.CANVAS_W, h: CONFIG.CANVAS_H });
    this.renderer = new Renderer(this.canvas);
    this.ui = new UI(this.renderer, this.canvas);
    this.ui.onReturn = () => app.showScreen('team');
    this.battle = null;

    // Autobattle toggle (persists across battles within the session).
    this.auto = false;
    this.autoBtn = document.getElementById('auto-btn');
    this.autoBtn.addEventListener('click', () => {
      this.auto = !this.auto;
      this.autoBtn.textContent = `Auto: ${this.auto ? 'ON' : 'OFF'}`;
      this.autoBtn.classList.toggle('auto-on', this.auto);
      if (this.battle) this.battle.setAuto(this.auto);
    });
  }

  // Entering the screen starts a fresh battle unless one is still running.
  async enter() {
    if (!this.battle || this.battle.state === BattleState.ENDED) {
      await this.startNewBattle();
    }
  }

  exit() {}

  async startNewBattle() {
    const team = GameState.getTeam();
    const battle = new Battle();

    // Player side: saved team placements.
    for (const [slot, heroId] of Object.entries(team)) {
      const def = HEROES[heroId];
      if (!def) continue;
      battle.placeUnit(new Unit(def, TEAM.PLAYER), Number(slot));
    }

    // Enemy side: a random wave sized against the team.
    const enemyDefs = Object.values(ENEMIES);
    const count = Math.min(7, Math.max(2, GameState.teamSize() + 1));
    const slotOrder = [1, 2, 6, 0, 3, 5, 4]; // fill front-to-back
    this.rewardGems = 75 + 50 * count;
    for (let i = 0; i < count; i++) {
      const def = enemyDefs[Math.floor(Math.random() * enemyDefs.length)];
      battle.placeUnit(new Unit(def, TEAM.ENEMY), slotOrder[i]);
    }

    // Load sprites (cached sheets, one animator per unit).
    for (const unit of battle.units) {
      const sheet = await Sprites.getSheet(unit.def);
      unit.animator = new AnimationPlayer(sheet);
      unit.animator.play('idle');
      unit.animator.elapsed = Math.random() * 0.5; // desync idle bobbing
    }

    // Preload impact/projectile effect sheets (null when art is absent).
    for (const id of Object.keys(EFFECTS)) {
      const sheet = await Sprites.getEffectSheet(id);
      if (sheet) battle.effectSheets[id] = sheet;
    }

    this.battle = battle;
    this.renderer.setBattle(battle);
    this.ui.bind(battle);
    battle.autoMode = this.auto;
    battle.onAutoTakeover = () => this.ui.hideAbilityBar();

    battle.onBattleEnd = (winner) => {
      if (winner === TEAM.PLAYER) {
        GameState.addGems(this.rewardGems);
        this.ui.showBanner(winner, `+${this.rewardGems} 💎`);
      } else {
        this.ui.showBanner(winner, 'Your team was wiped out.');
      }
      // battle.state is now ENDED, so the next enter() starts a new battle.
    };

    battle.log('Battle start! Click an ability, then a target.', 'log-system');
  }

  update(dt) {
    if (this.battle) this.battle.update(dt);
  }

  draw() {
    this.renderer.draw();
  }
}
