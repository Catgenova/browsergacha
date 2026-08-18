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

  // Fight buttons request a specific battle before switching screens.
  requestBattle(mode) {
    this.pendingMode = mode;
  }

  // Entering the screen starts a fresh battle unless one is still running
  // (an explicit fight request always starts fresh).
  async enter() {
    if (this.pendingMode || !this.battle || this.battle.state === BattleState.ENDED) {
      const mode = this.pendingMode || 'wave';
      this.pendingMode = null;
      await this.startNewBattle(mode);
    }
  }

  exit() {}

  async startNewBattle(mode = 'wave') {
    const team = GameState.getTeam();
    const battle = new Battle();

    // Player side: saved team placements, at their saved level/stars.
    const teamLevels = [];
    for (const [slot, heroId] of Object.entries(team)) {
      const def = HEROES[heroId];
      if (!def) continue;
      const progress = GameState.progressOf(heroId);
      teamLevels.push(progress ? progress.level : 1);
      battle.placeUnit(new Unit(def, TEAM.PLAYER, progress), Number(slot));
    }

    // Enemy side: a random wave sized against the team, leveled around
    // the party's average so difficulty (and XP) tracks progress.
    const avgLevel = Math.max(
      1,
      Math.round(teamLevels.reduce((a, b) => a + b, 0) / (teamLevels.length || 1))
    );
    if (mode === 'boss') {
      // A boss fights alone from the center tile, spanning the formation.
      // Stages: fight the next uncleared stage (replay the last once all
      // 20 are done). Stage N = boss level 5*N.
      const def = BOSSES.dragon;
      const cleared = GameState.bossStageCleared(def.id);
      const stage = Math.min(Progression.BOSS_MAX_STAGE, cleared + 1);
      const level = Progression.bossLevel(stage);
      this.bossFight = { bossId: def.id, stage };
      this.rewardGems = 300 + 100 * stage;
      this.rewardXp = Progression.enemyXp(level) * 6; // worth a full wave
      battle.placeUnit(new Unit(def, TEAM.ENEMY, { level, stars: def.rarity }), 0);
      battle.log(`Stage ${stage}: the ${def.name} descends! (Lv ${level})`, 'log-system');
    } else {
      this.bossFight = null;
      const enemyDefs = Object.values(ENEMIES);
      const count = Math.min(7, Math.max(2, GameState.teamSize() + 1));
      const slotOrder = [1, 2, 6, 0, 3, 5, 4]; // fill front-to-back
      this.rewardGems = 75 + 50 * count;
      this.rewardXp = 0;
      for (let i = 0; i < count; i++) {
        const def = enemyDefs[Math.floor(Math.random() * enemyDefs.length)];
        const level = Math.max(1, avgLevel + Math.floor(Math.random() * 3) - 1);
        this.rewardXp += Progression.enemyXp(level);
        battle.placeUnit(new Unit(def, TEAM.ENEMY, { level, stars: def.rarity }), slotOrder[i]);
      }
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
        // The whole party earns XP, fallen members included.
        const levelUps = [];
        for (const heroId of Object.values(GameState.getTeam())) {
          const before = GameState.progressOf(heroId);
          const r = GameState.addXp(heroId, this.rewardXp);
          if (r && r.levelsGained > 0 && before) {
            levelUps.push(`${HEROES[heroId].name} Lv ${r.level}!`);
          }
        }
        const sub = [`+${this.rewardGems} 💎 · +${this.rewardXp} XP each`, ...levelUps];
        if (this.bossFight) {
          GameState.recordBossClear(this.bossFight.bossId, this.bossFight.stage);
          sub.unshift(`Stage ${this.bossFight.stage} cleared!`);
        }
        this.ui.showBanner(winner, sub.join('<br>'));
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
