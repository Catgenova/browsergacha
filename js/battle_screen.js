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
    // Banner shortcuts: refight, or push on to the next stage/floor.
    this.ui.onRetry = () => {
      if (this.towerFight) {
        this.requestBattle('tower');
        this.enter();
      } else {
        this.launchBossStage(this.bossFight ? this.bossFight.stage : 1);
      }
    };
    this.ui.onNextStage = () => {
      if (this.towerFight) {
        this.requestBattle('tower'); // always climbs best + 1
        this.enter();
      } else {
        this.launchBossStage((this.bossFight ? this.bossFight.stage : 0) + 1);
      }
    };
    this.battle = null;

    // Autobattle toggle (persists across battles within the session),
    // with a 3x speed toggle available while auto is on.
    this.auto = false;
    this.speed = 1;
    this.autoBtn = document.getElementById('auto-btn');
    this.speedBtn = document.getElementById('speed-btn');
    this.autoBtn.addEventListener('click', () => {
      this.auto = !this.auto;
      this.autoBtn.textContent = `Auto: ${this.auto ? 'ON' : 'OFF'}`;
      this.autoBtn.classList.toggle('auto-on', this.auto);
      this.speedBtn.classList.toggle('hidden', !this.auto);
      if (!this.auto) this.setSpeed(1); // manual play always runs at 1x
      if (this.battle) this.battle.setAuto(this.auto);
    });
    this.speedBtn.addEventListener('click', () => {
      this.setSpeed(this.speed === 1 ? 3 : 1);
    });

    // Damage meter: which contribution to show, over what stretch.
    this.meterKind = 'damage';
    this.meterScope = 'battle';
    this.meterRowsEl = document.getElementById('meter-rows');
    this.meterTotalEl = document.getElementById('meter-total');
    document.querySelectorAll('.meter-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.meterKind = btn.dataset.kind;
        document.querySelectorAll('.meter-tab').forEach((b) =>
          b.classList.toggle('active', b === btn));
        this.drawMeter();
      });
    });
    document.querySelectorAll('.meter-scope').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.meterScope = btn.dataset.scope;
        document.querySelectorAll('.meter-scope').forEach((b) =>
          b.classList.toggle('active', b === btn));
        this.drawMeter();
      });
    });
    this.meterTimer = 0;
  }

  // Repaint the meter panel from the ledger.
  drawMeter() {
    if (!this.meterRowsEl) return;
    const { list, total } = Meter.rows(this.meterKind, this.meterScope);
    const LABEL = { damage: 'damage dealt', healing: 'healing done', mitigated: 'damage mitigated' };
    if (list.length === 0) {
      this.meterRowsEl.innerHTML =
        `<div class="meter-empty">No ${LABEL[this.meterKind]} yet.</div>`;
    } else {
      this.meterRowsEl.innerHTML = list.map((r) => `
        <div class="meter-row k-${this.meterKind}">
          <div class="meter-fill" style="width:${Math.round(r.bar * 100)}%"></div>
          <div class="meter-line">
            <span class="meter-name">${r.name}</span>
            <span class="meter-value">${r.value.toLocaleString()}</span>
            <span class="meter-share">${Math.round(r.share * 100)}%</span>
          </div>
        </div>`).join('');
    }
    this.meterTotalEl.textContent = '';
    const scope = this.meterScope === 'session' ? 'Session' : 'Battle';
    this.meterTotalEl.innerHTML =
      `${scope} ${LABEL[this.meterKind]}: <b>${total.toLocaleString()}</b>`;
  }

  setSpeed(mult) {
    this.speed = mult;
    this.speedBtn.textContent = `Speed: ${mult}×`;
    this.speedBtn.classList.toggle('auto-on', mult > 1);
    if (this.battle) this.battle.speedMult = mult;
  }

  // Fight buttons request a specific battle before switching screens.
  // A wave request arms the repeat chain from the hunt settings.
  requestBattle(mode) {
    this.pendingMode = mode;
    this.cancelChain();
    this.chainMode = mode;
    if (mode === 'wave') {
      const r = GameState.waveSettings.repeat;
      this.chainRemaining = r === 'inf' ? Infinity : Math.max(0, Number(r) - 1);
    } else if (mode === 'boss') {
      // Only already-cleared stages may be repeated.
      const bs = GameState.bossSettings;
      const bossDef = BOSSES[bs.boss] || BOSSES.dragon;
      const cleared = GameState.bossStageCleared(bossDef.id);
      if (bs.stage <= cleared) {
        const r = bs.repeat;
        this.chainRemaining = r === 'inf' ? Infinity : Math.max(0, Number(r) - 1);
      }
    } else if (mode === 'tower') {
      // The climb chains upward as long as auto keeps winning.
      this.chainRemaining = Infinity;
    }
  }

  cancelChain() {
    this.chainRemaining = 0;
    this.chainCountdown = null;
  }

  // Boss banners offer Retry always, and Next Stage when it's unlocked;
  // tower banners offer Retry and Next Floor.
  bossBannerOpts() {
    if (this.towerFight) {
      return { retry: true, next: true, nextLabel: 'Next Floor' };
    }
    if (!this.bossFight) return {};
    const cleared = GameState.bossStageCleared(this.bossFight.bossId);
    const next = this.bossFight.stage + 1;
    return {
      retry: true,
      next: next <= Math.min(Progression.BOSS_MAX_STAGE, cleared + 1),
      nextLabel: 'Next Stage',
    };
  }

  // Start a boss fight at a specific stage (banner Retry / Next Stage).
  launchBossStage(stage) {
    GameState.setBossSettings({ stage });
    this.requestBattle('boss');
    this.enter();
  }

  // Entering the screen starts a fresh battle unless one is still running
  // (an explicit fight request always starts fresh).
  async enter() {
    // Coming back to a finished fight clears the "battle over" marker.
    this.finishedUnseen = false;
    this.drawMeter();
    if (this.pendingMode || !this.battle ||
        (this.battle.state === BattleState.ENDED && this.chainCountdown == null)) {
      const mode = this.pendingMode || 'wave';
      this.pendingMode = null;
      await this.startNewBattle(mode);
    }
  }

  // Leaving the tab no longer stops the fight — battles (and their
  // chains) run in the background while the player summons or reads the
  // compendium. Only an explicit new fight request cancels a chain.
  exit() {}

  // A fight is live while a battle is running or a chain is between
  // rounds; the Battle tab badges off this.
  isFighting() {
    return !!this.battle &&
      (this.battle.state !== BattleState.ENDED || this.chainCountdown != null);
  }

  // Heroes committed to the current fight — they can't change gear
  // mid-battle. Covers the between-rounds pause of a chain too, since
  // the same team is about to be redeployed.
  lockedHeroIds() {
    const ids = new Set();
    if (!this.isFighting()) return ids;
    for (const u of this.battle.units) {
      if (u.team === TEAM.PLAYER) ids.add(u.def.id);
    }
    for (const heroId of Object.values(GameState.getTeam())) ids.add(heroId);
    return ids;
  }

  async startNewBattle(mode = 'wave') {
    const team = GameState.getTeam();
    Meter.resetBattle(); // the session tally keeps running
    const battle = new Battle();

    // Player side: saved team placements, at their saved level/stars.
    for (const [slot, heroId] of Object.entries(team)) {
      const def = HEROES[heroId];
      if (!def) continue;
      const progress = GameState.progressOf(heroId);
      if (progress) progress.gear = GameState.equippedPieces(heroId);
      battle.placeUnit(new Unit(def, TEAM.PLAYER, progress), Number(slot));
    }
    // Race synergy: 3/5/7 heroes of one race empower each other.
    this.raceBonuses = RACES.applyParty(
      battle.units.filter((u) => u.team === TEAM.PLAYER));

    let bgPin = null;
    if (mode === 'boss') {
      // A boss fights alone from the center tile, spanning the formation.
      // The player picks a boss and any unlocked stage (clearing one
      // unlocks the next). Stage N = boss level 5*N.
      const def = BOSSES[GameState.bossSettings.boss] || BOSSES.dragon;
      const cleared = GameState.bossStageCleared(def.id);
      const maxPick = Math.min(Progression.BOSS_MAX_STAGE, cleared + 1);
      const stage = Math.min(Math.max(1, GameState.bossSettings.stage), maxPick);
      const level = Progression.bossLevel(stage);
      this.bossFight = { bossId: def.id, stage, gearSet: def.gearSet || 'dragon' };
      this.towerFight = null;
      this.rewardXp = Progression.enemyXp(level) * 6; // worth a full wave
      this.rewardWhetstones = 10 + level * 2;
      this.rewardArcana = 3 + Math.ceil(stage / 2);
      battle.placeUnit(new Unit(def, TEAM.ENEMY, { level, stars: def.rarity }), 0);
      bgPin = def.background || null; // boss arenas pin their own backdrop
      this.introLog = `Stage ${stage}: the ${def.name} descends! (Lv ${level})`;
    } else if (mode === 'tower') {
      // Endless Tower: always fight the floor above your best. Enemy
      // levels climb ~1.5 per floor forever; every 10th floor a random
      // boss guards the way (extrapolating past its Lv 100 anchors).
      this.bossFight = null;
      const floor = GameState.towerBest + 1;
      const level = Math.max(2, Math.ceil(floor * 1.5));
      const isBossFloor = floor % 10 === 0;
      this.towerFight = { floor, isBossFloor };
      if (isBossFloor) {
        const keys = Object.keys(BOSSES);
        const def = BOSSES[keys[(floor / 10 - 1) % keys.length]];
        this.rewardXp = Progression.enemyXp(level) * 6;
        this.rewardWhetstones = 10 + level * 2;
        this.rewardArcana = 3 + Math.ceil(floor / 10);
        battle.placeUnit(new Unit(def, TEAM.ENEMY, { level, stars: def.rarity }), 0);
        bgPin = def.background || null;
        this.introLog = `Tower floor ${floor}: the ${def.name} bars the way! (Lv ${level})`;
      } else {
        // Wave floors rotate through the enemy races (and their homes).
        const raceLocs = Object.keys(LOCATION_ENEMIES).map(Number);
        const loc = raceLocs[(floor - 1) % raceLocs.length];
        bgPin = loc;
        const poolIds = LOCATION_ENEMIES[loc];
        const enemyDefs = poolIds.map((id) => ENEMIES[id]).filter(Boolean);
        const count = Math.min(7, Math.max(2, GameState.teamSize() + 1));
        this.rewardXp = 0;
        let totalLevels = 0;
        // Composed wave: a line, threats behind it, support at the back.
        const placements = Waves.deploy(
          Waves.compose(enemyDefs, count), battle.enemySlots);
        for (const { def, slotIndex } of placements) {
          const lv = Math.max(1, level + Math.floor(Math.random() * 3) - 1);
          totalLevels += lv;
          this.rewardXp += Progression.enemyXp(lv);
          battle.placeUnit(new Unit(def, TEAM.ENEMY, { level: lv, stars: def.rarity }), slotIndex);
        }
        this.rewardWhetstones = 3 + Math.round(totalLevels * 0.8);
        this.rewardArcana = 1 + Math.floor(totalLevels / 15);
        this.introLog = `Tower floor ${floor} — enemies at Lv ~${level}.`;
      }
    } else {
      // Hunt: the player picks a location (backdrop) and a stage that
      // sets enemy levels (stage N -> level ~5N), independent of the
      // deployed team.
      this.bossFight = null;
      this.towerFight = null;
      const ws = GameState.waveSettings;
      bgPin = ws.location;
      // Stage 0 is the level-1 training ground; stage N is level ~5N.
      const baseLevel = ws.stage === 0 ? 1 : ws.stage * 5;
      // Each location fields its own enemy race (clearing rats, canyon
      // birds); fall back to the clearing pool for safety.
      const poolIds = LOCATION_ENEMIES[ws.location] || LOCATION_ENEMIES[0];
      const enemyDefs = poolIds.map((id) => ENEMIES[id]).filter(Boolean);
      const count = Math.min(7, Math.max(2, GameState.teamSize() + 1));
      this.rewardXp = 0;
      let totalEnemyLevels = 0;
      // Waves are composed by role and deployed by position, so fights
      // have a shape: a line to break, casters behind it.
      const placements = Waves.deploy(
        Waves.compose(enemyDefs, count), battle.enemySlots);
      for (const { def, slotIndex } of placements) {
        // The training ground stays exactly level 1; real stages jitter.
        const level = ws.stage === 0
          ? 1
          : Math.max(1, baseLevel + Math.floor(Math.random() * 3) - 1);
        totalEnemyLevels += level;
        this.rewardXp += Progression.enemyXp(level);
        battle.placeUnit(new Unit(def, TEAM.ENEMY, { level, stars: def.rarity }), slotIndex);
      }
      this.rewardWhetstones = 3 + Math.round(totalEnemyLevels * 0.8);
      this.rewardArcana = 1 + Math.floor(totalEnemyLevels / 15);
      this.introLog =
        `Hunting in the ${CONFIG.LOCATION_NAMES[ws.location] || 'wilds'} — Stage ${ws.stage}.`;
    }

    // Load sprites (cached sheets, one animator per unit).
    for (const unit of battle.units) {
      const sheet = await Sprites.getSheet(unit.def);
      unit.animator = new AnimationPlayer(sheet);
      unit.animator.play('idle');
      unit.animator.elapsed = Math.random() * 0.5; // desync idle bobbing
      // Mirror-count sprite variants (Echo): start on the sheet matching
      // the unit's opening mirror count.
      if (unit.def.mirrorSprites) {
        unit.mirrorSheets = await Sprites.getMirrorSheets(unit.def);
        unit.syncMirrorSheet();
      }
    }

    // Preload impact/projectile effect sheets (null when art is absent).
    for (const id of Object.keys(EFFECTS)) {
      const sheet = await Sprites.getEffectSheet(id);
      if (sheet) battle.effectSheets[id] = sheet;
    }

    this.battle = battle;
    this.renderer.setBattle(battle, bgPin);
    this.ui.bind(battle);
    battle.autoMode = this.auto;
    battle.speedMult = this.auto ? this.speed : 1;
    battle.onAutoTakeover = () => this.ui.hideAbilityBar();

    battle.onBattleEnd = (winner) => {
      if (winner === TEAM.PLAYER) {
        // The whole party earns XP, fallen members included.
        const levelUps = [];
        for (const heroId of Object.values(GameState.getTeam())) {
          const before = GameState.progressOf(heroId);
          const r = GameState.addXp(heroId, this.rewardXp);
          if (r && r.levelsGained > 0 && before) {
            levelUps.push(`${HEROES[heroId].name} Lv ${r.level}!`);
          }
        }
        GameState.addWhetstones(this.rewardWhetstones);
        GameState.addArcana(this.rewardArcana);
        GameState.questBump('wins');
        const asBoss = this.bossFight || (this.towerFight && this.towerFight.isBossFloor);
        GameState.questBump(asBoss ? 'bossWins' : 'huntWins');
        const sub = [
          `+${this.rewardXp} XP each · +${this.rewardWhetstones} 🪨 · +${this.rewardArcana} ✦`,
          ...levelUps,
        ];
        // Random scroll drops (10% Common, 3% Rare) apply outside the
        // tower — tower floors pay guaranteed scrolls instead.
        if (!this.towerFight) {
          if (Math.random() < 0.10) {
            GameState.addScrolls('common', 1);
            sub.push('A Common Summon Scroll drops! 📜');
          }
          if (Math.random() < 0.03) {
            GameState.addScrolls('rare', 1);
            sub.push('A RARE Summon Scroll drops! ✨');
          }
          // Normal hunts can also shed a Temporal Scroll (1%); bosses
          // keep their own stage-15+ roll below.
          if (!this.bossFight && Math.random() < 0.01) {
            GameState.addScrolls('temporal', 1);
            sub.push('A TEMPORAL Scroll shimmers into being! 🌀');
          }
        }
        if (this.towerFight) {
          const floor = this.towerFight.floor;
          GameState.recordTowerClear(floor);
          sub.unshift(`Tower floor ${floor} cleared!`);
          // Guaranteed scroll ladder: a Common every floor, a Rare
          // every 5th, a Temporal (Dark/Light) every 50th.
          GameState.addScrolls('common', 1);
          sub.push('Floor reward: a Common Summon Scroll 📜');
          if (floor % 5 === 0) {
            GameState.addScrolls('rare', 1);
            sub.push('Floor reward: a RARE Summon Scroll! ✨');
          }
          if (floor % 50 === 0) {
            GameState.addScrolls('temporal', 1);
            sub.push('Floor reward: a TEMPORAL Scroll! 🌀');
          }
          if (floor % 20 === 0) {
            // Skill Tomes drop ONLY here — every 20th floor, scaling
            // with height (floor 20 -> 1 tome, 40 -> 2, 60 -> 3 ...).
            const tomes = floor / 20;
            GameState.addTomes(tomes);
            sub.push(`Floor reward: ${tomes} Skill Tome${tomes > 1 ? 's' : ''}! 📖`);
          }
        }
        if (this.bossFight) {
          GameState.recordBossClear(this.bossFight.bossId, this.bossFight.stage);
          sub.unshift(`Stage ${this.bossFight.stage} cleared!`);
          // Temporal Scrolls: 1% from boss stages 15 and up.
          if (this.bossFight.stage >= 15 && Math.random() < 0.01) {
            GameState.addScrolls('temporal', 1);
            sub.push('A TEMPORAL Scroll shimmers into being! 🌀');
          }
          // Bosses drop a piece of THEIR set; higher stages drop rarer.
          const piece = Gear.drop(this.bossFight.gearSet, this.bossFight.stage);
          GameState.addGear(piece);
          sub.push(`Loot: ${Gear.describe(piece)}`);
        }
        // Battle chaining (hunts and cleared boss stages): keep fighting
        // until the count runs out, pausing briefly on the banner.
        if (this.chainRemaining > 0 &&
            (this.chainMode !== 'tower' || this.auto)) {
          const left = this.chainRemaining === Infinity
            ? '∞' : this.chainRemaining;
          sub.push(this.chainMode === 'tower'
            ? 'Climbing on in 2.5s…'
            : `Next battle in 2.5s… (${left} more)`);
          this.chainRemaining--;
          // Simulation-clock countdown so chains keep running while the
          // tab is hidden (real-time timers get throttled).
          this.chainCountdown = 2.5;
        }
        this.ui.showBanner(winner, sub.join('<br>'), this.bossBannerOpts());
      } else {
        this.cancelChain(); // a wipe ends the hunt
        this.ui.showBanner(winner, 'Your team was wiped out.', this.bossBannerOpts());
      }
      // Finished while the player was elsewhere: flag the Battle tab so
      // they know the result is waiting (a continuing chain isn't a
      // finish — the next round starts on its own).
      if (this.app.active !== this && this.chainCountdown == null) {
        this.finishedUnseen = true;
      }
      // battle.state is now ENDED, so the next enter() starts a new battle.
    };

    if (this.introLog) battle.log(this.introLog, 'log-system');
    for (const b of this.raceBonuses || []) {
      battle.log(`${b.title} ×${b.count}: ${b.labels.join(' · ')}`, 'log-system');
    }
    battle.log('Battle start! Click an ability, then a target.', 'log-system');
  }

  update(dt) {
    if (this.battle) this.battle.update(dt);
    // Meter refresh: often enough to feel live, rarely enough to be free.
    if (this.app.active === this) {
      this.meterTimer -= dt;
      if (this.meterTimer <= 0) { this.meterTimer = 0.25; this.drawMeter(); }
    }
    // Between-battle chain pause, on the simulation clock.
    if (this.chainCountdown !== null && this.chainCountdown !== undefined) {
      this.chainCountdown -= dt;
      if (this.chainCountdown <= 0) {
        this.chainCountdown = null;
        // Chains continue whether or not the Battle tab is on screen.
        if (this.battle.state === BattleState.ENDED) {
          this.startNewBattle(this.chainMode || 'wave');
        }
      }
    }
  }

  draw() {
    this.renderer.draw();
  }
}
