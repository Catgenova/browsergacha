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
    // Banner shortcuts: refight, or push on to the next stage/floor. A
    // campaign node has no ladder to climb, so its "next" is the map.
    this.ui.onRetry = () => {
      if (this.campaignFight) {
        this.requestCampaign(this.campaignFight.nodeId, this.campaignFight.tier);
        this.enter();
      } else if (this.towerFight) {
        this.requestBattle('tower');
        this.enter();
      } else if (this.attuneFight) {
        this.requestBattle('attune');
        this.enter();
      } else if (this.dungeonFight) {
        this.requestBattle('dungeon');
        this.enter();
      } else {
        this.launchBossStage(this.bossFight ? this.bossFight.stage : 1);
      }
    };
    // Straight into the next campaign fight without a detour through the
    // map. bannerOpts only offers this when there IS one.
    this.ui.onAdvance = () => {
      if (!this.campaignFight) return;
      const t = this.campaignFight.tier;
      const next = Campaign.nextMission(Campaign.node(this.campaignFight.nodeId), t);
      if (!next) { app.showScreen('campaign'); return; }
      GameState.setCampaignChapter(Campaign.chapterFor(next.id).id);
      this.requestCampaign(next.id, t);
      this.enter();
    };
    this.ui.onNextStage = () => {
      if (this.campaignFight) {
        app.showScreen('campaign');
      } else if (this.towerFight) {
        this.requestBattle('tower'); // always climbs best + 1
        this.enter();
      } else if (this.attuneFight) {
        GameState.setAttuneSettings({ stage: this.attuneFight.stage + 1 });
        this.requestBattle('attune');
        this.enter();
      } else if (this.dungeonFight) {
        GameState.setDungeonSettings({ stage: this.dungeonFight.stage + 1 });
        this.requestBattle('dungeon');
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

    // Idle-state buttons. "Fight again" reuses the banner's own retry, so
    // repeating a fight is one code path rather than two.
    const idleAgain = document.getElementById('idle-again');
    if (idleAgain) {
      idleAgain.addEventListener('click', () => {
        this.showIdle(false);
        if (this.ui.onRetry) this.ui.onRetry();
      });
    }
    const idleTeam = document.getElementById('idle-team');
    if (idleTeam) idleTeam.addEventListener('click', () => app.showScreen('team'));
    const idleCampaign = document.getElementById('idle-campaign');
    if (idleCampaign) idleCampaign.addEventListener('click', () => app.showScreen('campaign'));

    // Auto-battle tactics: three decisions the AI used to make for the
    // player. Changes apply to the fight in progress, not just the next
    // one — the point is being able to react to a fight going badly.
    this.tacticsPanel = document.getElementById('tactics-panel');
    const tacticsBtn = document.getElementById('tactics-btn');
    if (tacticsBtn && this.tacticsPanel) {
      tacticsBtn.addEventListener('click', () => {
        const open = this.tacticsPanel.classList.toggle('hidden');
        if (!open) this.renderTactics();
      });
      document.getElementById('tactics-close').addEventListener('click',
        () => this.tacticsPanel.classList.add('hidden'));
    }


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

    // Retreat: abandon the fight. Forfeiting a long battle by mis-click
    // would be miserable, so the first press arms it and the second
    // confirms; it disarms itself after a few seconds.
    // "Stop after this fight": let the current battle finish and pay
    // out normally, but end the repeat chain there. Only shown while a
    // chain would actually continue.
    this.stopChainBtn = document.getElementById('stop-chain-btn');
    if (this.stopChainBtn) {
      this.stopChainBtn.addEventListener('click', () => {
        this.cancelChain();
        if (this.battle && this.battle.state !== BattleState.ENDED) {
          this.battle.log('The chain ends after this fight.', 'log-system');
        }
        this.refreshStopChain();
      });
    }
    this.retreatBtn = document.getElementById('retreat-btn');
    this.retreatArmed = false;
    if (this.retreatBtn) {
      this.retreatBtn.addEventListener('click', () => {
        if (!this.battle || this.battle.state === BattleState.ENDED) {
          // Nothing to retreat from — just leave.
          this.retreat();
          return;
        }
        if (this.retreatArmed) {
          this.retreat();
          return;
        }
        this.armRetreat(true);
        this.retreatTimer = 4;
      });
    }
  }

  armRetreat(on) {
    this.retreatArmed = on;
    if (!this.retreatBtn) return;
    this.retreatBtn.textContent = on ? 'Retreat? Confirm' : 'Retreat';
    this.retreatBtn.classList.toggle('armed', on);
    if (!on) this.retreatTimer = null;
  }

  // Abandon the current fight: no rewards, no chain, no lingering
  // "battle in progress" state. The team is released (gear unlocks) and
  // the player lands back on the team screen.
  retreat() {
    this.armRetreat(false);
    this.cancelChain();
    if (this.battle && this.battle.state !== BattleState.ENDED) {
      this.battle.log('You sound the retreat — the fight is abandoned.', 'log-system');
      // End it without firing onBattleEnd: retreating earns nothing.
      this.battle.onBattleEnd = null;
      this.battle.pendingAuto = null;
      this.battle.state = BattleState.ENDED;
      this.battle.activeUnit = null;
    }
    this.finishedUnseen = false; // there is no result to come back to
    this.ui.hideAbilityBar();
    this.app.showScreen('team');
  }

  // What the last fight was and what it paid.
  //
  // The banner says all of this and then disappears, which is fine when
  // you are watching and useless when a chain has been grinding in
  // another tab. This keeps the most recent result on the battle screen
  // until the next one replaces it.
  // Paint the tactics panel from AI.TACTICS, so a new option shows up
  // here the moment it exists rather than needing a second edit.
  renderTactics() {
    const rows = document.getElementById('tactics-rows');
    if (!rows) return;
    const current = AI.tactics();
    const AXES = [
      ['target', 'Who to hit'],
      ['skills', 'When to spend skills'],
      ['support', 'When to heal'],
    ];
    rows.innerHTML = AXES.map(([key, label]) => {
      const opts = AI.TACTICS[key].map((o) =>
        `<option value="${o.id}"${o.id === current[key] ? ' selected' : ''}>` +
        `${o.name}</option>`).join('');
      const hint = (AI.TACTICS[key].find((o) => o.id === current[key]) || {}).hint || '';
      return `<div class="tactic-row">
        <label>${label}</label>
        <select data-axis="${key}">${opts}</select>
        <div class="tactic-hint">${hint}</div>
      </div>`;
    }).join('');
    rows.querySelectorAll('select').forEach((sel) => {
      sel.addEventListener('change', () => {
        GameState.setTactic(sel.dataset.axis, sel.value);
        this.renderTactics();
      });
    });
  }

  recordResult(winner, lines) {
    const what = this.campaignFight
      ? (() => {
        const node = Campaign.node(this.campaignFight.nodeId);
        const ch = node && Campaign.chapterFor(node.id);
        return ch ? `${ch.title} — ${node.name}` : 'Campaign';
      })()
      : this.attuneFight
        ? `${this.attuneFight.name}, stage ${this.attuneFight.stage}`
        : this.dungeonFight
          ? `${this.dungeonFight.name}, floor ${this.dungeonFight.stage}`
        : this.bossFight
          ? `${this.bossFight.name}, stage ${this.bossFight.stage}`
        : this.towerFight
          ? `Endless Tower, floor ${this.towerFight.floor}`
          : `${CONFIG.LOCATION_NAMES[GameState.waveSettings.location] || 'Hunt'}` +
            ` — stage ${GameState.waveSettings.stage}`;
    this.lastResult = {
      won: winner === TEAM.PLAYER,
      what,
      lines: lines.filter((l) => !/Next battle in|Climbing on in/.test(l)),
      // A snapshot: the live ledger resets when the next fight starts.
      damage: Meter.rows('damage', 'battle').list.slice(0, 5),
      healing: Meter.rows('healing', 'battle').list.slice(0, 3),
      at: this.clock || 0,
    };
    this.drawSummary();
  }

  drawSummary() {
    const el = document.getElementById('battle-summary');
    if (!el) return;
    const r = this.lastResult;
    if (!r) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    const bar = (rows) => rows.map((x) =>
      `<span class="sum-hero">${x.name} <b>${x.value.toLocaleString()}</b></span>`).join('');
    el.innerHTML =
      `<div class="sum-head ${r.won ? 'won' : 'lost'}">` +
        `<span class="sum-verdict">${r.won ? 'Victory' : 'Defeat'}</span>` +
        `<span class="sum-what">${r.what}</span></div>` +
      `<div class="sum-lines">${r.lines.join('<br>')}</div>` +
      (r.damage.length ? `<div class="sum-row"><span class="sum-k">Damage</span>${bar(r.damage)}</div>` : '') +
      (r.healing.length ? `<div class="sum-row"><span class="sum-k">Healing</span>${bar(r.healing)}</div>` : '');
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
    } else if (mode === 'attune') {
      const as = GameState.attuneSettings;
      const cleared = GameState.attuneStageCleared(as.boss);
      if (as.stage <= cleared) {
        const r = as.repeat;
        this.chainRemaining = r === 'inf' ? Infinity : Math.max(0, Number(r) - 1);
      }
    } else if (mode === 'dungeon') {
      const ds = GameState.dungeonSettings;
      const def = DUNGEON_BOSSES[ds.boss] || DUNGEON_BOSSES.whetstone;
      if (ds.stage <= GameState.bossStageCleared(def.id)) {
        const r = ds.repeat;
        // A chain can never book more fights than the day has attempts.
        const cap = Math.max(0, GameState.dungeonRunsLeft(def.id) - 1);
        this.chainRemaining = Math.min(cap,
          r === 'inf' ? Infinity : Math.max(0, Number(r) - 1));
      }
    } else if (mode === 'tower') {
      // The climb chains upward as long as auto keeps winning.
      this.chainRemaining = Infinity;
    }
  }

  // Campaign nodes are fought one at a time — no repeat chain. A node
  // is a fixed encounter you either beat or come back to, and looping
  // it would turn the spine of the game into a farm.
  requestCampaign(nodeId, tierId = 'normal') {
    this.pendingMode = 'campaign';
    this.campaignNodeId = nodeId;
    this.campaignTier = tierId;
    this.cancelChain();
    this.chainMode = 'campaign';
  }

  // The stop button earns its place only while a chain would continue:
  // more rounds queued, a between-rounds countdown, or an auto tower
  // climb (which chains as long as auto keeps winning).
  refreshStopChain() {
    if (!this.stopChainBtn) return;
    const chaining = this.chainRemaining > 0 || this.chainCountdown != null ||
      (this.chainMode === 'tower' && this.auto && this.isFighting());
    this.stopChainBtn.classList.toggle('hidden', !chaining);
  }

  cancelChain() {
    this.chainRemaining = 0;
    this.chainCountdown = null;
  }

  // What the end-of-battle banner offers, by mode: boss banners offer
  // Retry always and Next Stage when it's unlocked, tower banners offer
  // Retry and Next Floor, and a campaign node offers a refight, the next
  // mission, and a way back to the map.
  bannerOpts(winner) {
    if (this.campaignFight) {
      const opts = { retry: true, next: true, nextLabel: 'To Campaign' };
      // Only after a win: losing leaves the same fight as "next", which
      // is what Retry is for.
      if (winner === TEAM.PLAYER) {
        const t = this.campaignFight.tier;
        const next = Campaign.nextMission(Campaign.node(this.campaignFight.nodeId), t);
        if (next) {
          const ch = Campaign.chapterFor(next.id);
          const tier = Campaign.tier(t);
          opts.advance = true;
          opts.advanceLabel = `Next: ${next.name}`;
          opts.advanceTitle = `${ch.title} — ${next.name} · Lv ` +
            `${Campaign.levelFor(next, t)}` +
            (t === 'normal' ? '' : ` · ${tier.label}`);
        }
      }
      return opts;
    }
    if (this.towerFight) {
      return { retry: true, next: true, nextLabel: 'Next Floor' };
    }
    if (this.dungeonFight) {
      const cleared = GameState.bossStageCleared(this.dungeonFight.bossId);
      const next = this.dungeonFight.stage + 1;
      return {
        retry: true,
        next: next <= Math.min(Progression.BOSS_MAX_STAGE, cleared + 1),
        nextLabel: 'Next Floor',
      };
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
    this.drawSummary();
    // Coming back to a finished fight clears the "battle over" marker.
    this.finishedUnseen = false;
    this.drawMeter();

    // Only a fight somebody actually asked for. Opening this tab used to
    // roll a fresh hunt whenever nothing was running, so navigating here
    // -- or coming back to read the result of the fight you just won --
    // spent your team on a battle nobody chose.
    if (this.pendingMode) {
      const mode = this.pendingMode;
      this.pendingMode = null;
      this.showIdle(false);
      await this.startNewBattle(mode);
      return;
    }
    this.showIdle(!this.isFighting());
  }

  // The empty state. `on` false puts the board back.
  showIdle(on) {
    const el = document.getElementById('battle-idle');
    if (!el) return;
    el.classList.toggle('hidden', !on);
    // The picker REPLACES the battle UI: idle mode hides the arena, the
    // control row, the log and the meter, leaving the picker (and the
    // last-battle summary) as the whole page.
    this.el.classList.toggle('idle-mode', on);
    if (!on) return;

    // The fight picker owns this panel's lower half; re-render so
    // stage unlocks, the tower floor and team size are current.
    if (!this.selectUi) this.selectUi = new BattleSelect(this.app);
    this.selectUi.render();

    // The end-of-battle banner and the idle notice are two answers to the
    // same question, so only one is ever up.
    this.ui.hideBanner();
    this.ui.hideAbilityBar();
    this.armRetreat(false);

    const r = this.lastResult;
    const sub = document.getElementById('idle-sub');
    if (sub) {
      sub.textContent = r
        ? `Last fight: ${r.what} \u2014 ${r.won ? 'won' : 'lost'}. The result is below.`
        : 'Pick a fight below, or take the next campaign mission.';
    }
    // "Again" only when there is something to repeat.
    const again = document.getElementById('idle-again');
    if (again) again.classList.toggle('hidden', !r);
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
    // Roster uids, because that is what a screen has in hand. The units
    // themselves only know which CHARACTER they are, so the committed
    // team is read off the saved team instead.
    for (const uid of Object.values(GameState.getTeam())) ids.add(uid);
    return ids;
  }

  async startNewBattle(mode = 'wave') {
    const team = GameState.getTeam();
    this.showIdle(false);
    this.armRetreat(false);
    Meter.resetBattle(); // the session tally keeps running
    const battle = new Battle();

    // Player side: saved team placements, at their saved level/stars.
    for (const [slot, heroId] of Object.entries(team)) {
      const def = GameState.defOf(heroId);
      if (!def) continue;
      const progress = GameState.progressOf(heroId);
      if (progress) progress.gear = GameState.equippedPieces(heroId);
      battle.placeUnit(new Unit(def, TEAM.PLAYER, progress), Number(slot));
    }
    // Race synergy: 3/5/7 heroes of one race empower each other.
    this.raceBonuses = RACES.applyParty(
      battle.units.filter((u) => u.team === TEAM.PLAYER));

    // A campaign node whose id no longer resolves (chapter data moved
    // under an old save) falls back to a hunt rather than fielding an
    // empty enemy side.
    const campNode = mode === 'campaign' ? Campaign.node(this.campaignNodeId) : null;
    if (mode === 'campaign' && !campNode) mode = 'wave';

    // Cleared once for every mode; only the dungeon branch sets it.
    this.dungeonFight = null;

    let bgPin = null;
    if (mode === 'campaign') {
      // A campaign node: a fixed line-up at a fixed level, or the
      // chapter's holder alone on the field.
      const ch = Campaign.chapterFor(campNode.id);
      // A tier the player has not opened cannot be fought, whatever the
      // request said.
      const tierId = Campaign.tierUnlocked(ch, this.campaignTier)
        ? this.campaignTier : 'normal';
      const tier = Campaign.tier(tierId);
      this.bossFight = null;
      this.towerFight = null;
      this.attuneFight = null;
      this.campaignFight = { nodeId: campNode.id, tier: tierId };
      const level = Campaign.levelFor(campNode, tierId);
      const pay = Campaign.payout(campNode, tierId);
      this.rewardXp = pay.xp;
      this.rewardWhetstones = pay.whetstones;
      this.rewardArcana = pay.arcana;
      bgPin = ch.location;
      // Same map, same line-up, harder enemies: the tier is a stat scale
      // on top of whatever the node already fields.
      const banner = tierId === 'normal' ? '' : ` [${tier.label}]`;
      if (campNode.type === 'boss') {
        const def = BOSSES[ch.boss];
        bgPin = def.background || bgPin;
        battle.placeUnit(new Unit(def, TEAM.ENEMY, {
          level, stars: def.rarity, statScale: Campaign.holderScaleFor(ch, tierId),
          gear: Campaign.gearFor(campNode, tierId, def),
        }), 0);
        this.introLog = `${ch.title}${banner} — ${campNode.name}: ` +
          `the ${def.name} holds the way! (Lv ${level})`;
      } else {
        const scale = Campaign.enemyScale(tierId);
        for (const { def, slotIndex } of
             Campaign.encounter(campNode, battle.enemySlots, tierId)) {
          battle.placeUnit(new Unit(def, TEAM.ENEMY, {
            level, stars: def.rarity, statScale: scale,
            gear: Campaign.gearFor(campNode, tierId, def),
          }), slotIndex);
        }
        this.introLog = `${ch.title}${banner} — ${campNode.name} (Lv ${level}).`;
      }
    } else if (mode === 'boss') {
      // A boss fights alone from the center tile, spanning the formation.
      // The player picks a boss and any unlocked stage (clearing one
      // unlocks the next). Stage N = boss level 5*N.
      this.campaignFight = null;
      this.attuneFight = null;
      const def = BOSSES[GameState.bossSettings.boss] || BOSSES.dragon;
      const cleared = GameState.bossStageCleared(def.id);
      const maxPick = Math.min(Progression.BOSS_MAX_STAGE, cleared + 1);
      const stage = Math.min(Math.max(1, GameState.bossSettings.stage), maxPick);
      const level = Progression.bossLevel(stage);
      // Carry the display name: bossId is the save key (def.id), which is
      // NOT the key BOSSES is indexed by, so it cannot be looked back up.
      this.bossFight = { bossId: def.id, name: def.name, stage, gearSet: def.gearSet || 'dragon' };
      this.towerFight = null;
      this.rewardXp = Progression.enemyXp(level) * 6; // worth a full wave
      this.rewardWhetstones = 10 + level * 2;
      this.rewardArcana = 3 + Math.ceil(stage / 2);
      battle.placeUnit(new Unit(def, TEAM.ENEMY, { level, stars: def.rarity }), 0);
      bgPin = def.background || null; // boss arenas pin their own backdrop
      this.introLog = `Stage ${stage}: the ${def.name} descends! (Lv ${level})`;
    } else if (mode === 'attune') {
      // Elemental boss: the same shape as a gear boss, paying the
      // Elements that attune a hero of its own element.
      this.campaignFight = null;
      this.bossFight = null;
      this.towerFight = null;
      const as = GameState.attuneSettings;
      const def = ELEMENTAL_BOSSES[as.boss] || ELEMENTAL_BOSSES.fire;
      const cleared = GameState.attuneStageCleared(def.attuneId);
      const maxPick = Math.min(Progression.BOSS_MAX_STAGE, cleared + 1);
      const stage = Math.min(Math.max(1, as.stage), maxPick);
      const level = Progression.bossLevel(stage);
      this.attuneFight = { element: def.attuneId, name: def.name, stage };
      this.rewardXp = Progression.enemyXp(level) * 6;
      this.rewardWhetstones = 10 + level * 2;
      this.rewardArcana = 3 + Math.ceil(stage / 2);
      battle.placeUnit(new Unit(def, TEAM.ENEMY, { level, stars: def.rarity }), 0);
      bgPin = def.background || null;
      this.introLog = `Stage ${stage}: the ${def.name} rises! (Lv ${level})`;
    } else if (mode === 'dungeon') {
      // Material dungeon: a twenty-floor boss ladder that pays the
      // Blacksmith's bills — Whetstones in the Grindhouse, Arcana in the
      // Arcanum Vault — scaled by the floor. No gear drops here.
      this.campaignFight = null;
      this.bossFight = null;
      this.attuneFight = null;
      this.towerFight = null;
      const ds = GameState.dungeonSettings;
      const def = DUNGEON_BOSSES[ds.boss] || DUNGEON_BOSSES.whetstone;
      // A challenge is spent the moment the fight starts, three per
      // dungeon per day. Out of attempts (a stale banner button, a
      // chain that outran the ledger) drops back to the picker, which
      // shows the count and the reset time.
      if (!GameState.useDungeonRun(def.id)) {
        this.cancelChain();
        this.showIdle(true);
        return;
      }
      const cleared = GameState.bossStageCleared(def.id);
      const maxPick = Math.min(Progression.BOSS_MAX_STAGE, cleared + 1);
      const stage = Math.min(Math.max(1, ds.stage), maxPick);
      const level = Progression.bossLevel(stage);
      this.dungeonFight = {
        bossId: def.id, name: def.name, stage,
        diamonds: def.diamondsFor ? def.diamondsFor(stage) : 0,
      };
      // The Proving Grounds overrides the standard boss x6 on XP.
      this.rewardXp = Progression.enemyXp(level) * (def.xpMult || 6);
      this.rewardWhetstones = def.whetstonesPer * stage;
      this.rewardArcana = def.arcanaPer * stage;
      battle.placeUnit(new Unit(def, TEAM.ENEMY, { level, stars: def.rarity }), 0);
      bgPin = def.background || null;
      this.introLog = `${def.dungeonName}, floor ${stage}: the ${def.name} awaits! (Lv ${level})`;
    } else if (mode === 'tower') {
      // Endless Tower: always fight the floor above your best. Enemy
      // levels climb ~1.5 per floor forever; every 10th floor a random
      // boss guards the way (extrapolating past its Lv 100 anchors).
      this.bossFight = null;
      this.campaignFight = null;
      this.attuneFight = null;
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
      this.attuneFight = null;
      this.campaignFight = null;
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

    // Load sprites (cached sheets, one animator per unit) -- ALL of it
    // in parallel. Only the units actually in this fight are fetched,
    // but fetching them one at a time (and their strips one at a time)
    // made a 7v7 fight a hundred sequential requests.
    await Promise.all([
      ...battle.units.map(async (unit) => {
        const sheet = await Sprites.getSheet(unit.def);
        unit.animator = new AnimationPlayer(sheet);
        unit.animator.play('idle');
        unit.animator.elapsed = Math.random() * 0.5; // desync idle bobbing
        // Mirror-count sprite variants (Aniani): start on the sheet
        // matching the unit's opening mirror count.
        if (unit.def.mirrorSprites) {
          unit.mirrorSheets = await Sprites.getMirrorSheets(unit.def);
          unit.syncMirrorSheet();
        }
      }),
      // Impact/projectile effect sheets (null when art is absent);
      // cached across battles, so only the first fight pays at all.
      ...Object.keys(EFFECTS).map(async (id) => {
        const sheet = await Sprites.getEffectSheet(id);
        if (sheet) battle.effectSheets[id] = sheet;
      }),
    ]);

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
            if (typeof Sound !== 'undefined') Sound.play('levelup');
            levelUps.push(`${GameState.defOf(heroId).name} Lv ${r.level}!`);
          }
        }
        GameState.addWhetstones(this.rewardWhetstones);
        GameState.addArcana(this.rewardArcana);
        GameState.questBump('wins');
        // A win with the whole party still standing. Cheap to check here
        // and the only counter that says anything about HOW a fight went.
        if (battle.livingUnits(TEAM.PLAYER).length ===
            battle.units.filter((u) => u.team === TEAM.PLAYER).length) {
          GameState.questBump('flawless');
        }
        // Party bonuses: raceBonuses is the applyParty summary from this
        // battle's build -- any active pack/resonance counts, and a
        // seven-strong group counts as a full one.
        if ((this.raceBonuses || []).length > 0) {
          GameState.questBump('synergyWins');
          if (this.raceBonuses.some((b) => b.count >= 7)) {
            GameState.questBump('fullSynergyWins');
          }
        }
        // Campaign nodes bump their own counter below, by node type.
        if (!this.campaignFight) {
          const asBoss = this.bossFight || this.dungeonFight ||
            (this.towerFight && this.towerFight.isBossFloor);
          GameState.questBump(asBoss ? 'bossWins' : 'huntWins');
        }
        // A dungeon pays only its own currency; zero lines say nothing.
        const sub = [
          [`+${this.rewardXp} XP each`,
            this.rewardWhetstones > 0 ? `+${this.rewardWhetstones} 🪨` : '',
            this.rewardArcana > 0 ? `+${this.rewardArcana} ✦` : '',
          ].filter(Boolean).join(' · '),
          ...levelUps,
        ];
        // A lucky glint: every battle won, of any kind, has a 1% chance
        // to shake a few Diamonds loose.
        if (Math.random() < 0.01) {
          const d = 1 + Math.floor(Math.random() * 3);
          GameState.addDiamonds(d);
          sub.push(`💎 ${d} Diamond${d > 1 ? 's' : ''} glitter in the wreckage!`);
        }
        // Random scroll drops (10% Common, 3% Rare) apply outside the
        // tower and the campaign — both pay their own fixed rewards.
        if (!this.towerFight && !this.campaignFight) {
          if (Math.random() < 0.10) {
            GameState.addScrolls('common', 1);
            sub.push('A Common Summon Scroll drops! 📜');
          }
          if (Math.random() < 0.03) {
            GameState.addScrolls('rare', 1);
            sub.push('A RARE Summon Scroll drops! ✨');
          }
          // Normal hunts can also shed a Temporal Scroll (1%); bosses
          // keep their own stage-15+ roll below, and dungeons pay
          // materials only.
          if (!this.bossFight && !this.dungeonFight && Math.random() < 0.01) {
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
          if (floor % 10 === 0) {
            // Boss floors pay Diamonds, in growing steps of fifty.
            const diamonds = 50 * (floor / 10);
            GameState.addDiamonds(diamonds);
            sub.push(`Floor reward: ${diamonds} 💎 Diamonds!`);
          }
          if (floor % 20 === 0) {
            // Every 20th floor used to pay Skill Tomes. Skills are bought
            // with heroes now, so the milestone pays arcana instead.
            const arcana = 100 * (floor / 20);
            GameState.addArcana(arcana);
            sub.push(`Floor reward: ${arcana} Arcana! ✦`);
          }
        }
        if (this.campaignFight) {
          const node = Campaign.node(this.campaignFight.nodeId);
          const ch = Campaign.chapterFor(node.id);
          const tierId = this.campaignFight.tier;
          const tier = Campaign.tier(tierId);
          // Each tier records its own clear, so every difficulty has a
          // first clear of its own to pay out.
          const isFirst = GameState.recordCampaignClear(
            Campaign.clearKey(node.id, tierId));
          sub.unshift(`${ch.title} — ${node.name} cleared!` +
            (tierId === 'normal' ? '' : ` (${tier.label})`));
          // The one-off bonus is what the campaign is actually for;
          // re-running a node pays only the XP and materials above.
          if (isFirst) {
            const bonus = Campaign.firstClearBonus(node, tierId);
            if (bonus.scrolls) {
              for (const [kind, n] of Object.entries(bonus.scrolls)) {
                GameState.addScrolls(kind, n);
                const icon = kind === 'rare' ? '✨' : kind === 'temporal' ? '🌀' : '📜';
                sub.push(`${bonus.label}: ${n}× ${icon}`);
              }
            }
            if (bonus.unlocks) {
              sub.push(`The ${CONFIG.LOCATION_NAMES[ch.location]} opens for hunting, ` +
                `and the ${BOSSES[ch.boss].name} will now take challengers.`);
            }
            // Clearing a holder opens the next difficulty for THIS
            // chapter, so say so where the player is looking.
            if (node.type === 'boss') {
              const nextTier = Campaign.TIER_IDS[Campaign.tierIndex(tierId) + 1];
              if (nextTier) {
                sub.push(`${ch.title} on ${Campaign.tier(nextTier).label} is now open — ` +
                  `${Campaign.tier(nextTier).reward}x rewards.`);
              }
            }
          }
          GameState.questBump(node.type === 'boss' ? 'bossWins' : 'huntWins');
          GameState.questBump('campaignWins');
        }
        if (this.attuneFight) {
          const { element, stage } = this.attuneFight;
          GameState.recordAttuneClear(element, stage);
          const drops = Attune.roll(stage);
          GameState.addElements(element, drops);
          const info = Elements.info(element);
          const bits = Attune.SIZES
            .filter((size) => drops[size] > 0)
            .map((size) => `${drops[size]} ${Attune.SIZE_LABEL[size]}`);
          sub.unshift(`Stage ${stage} cleared!`);
          sub.push(`${info ? info.emoji : ''} ${bits.join(' · ')} ${info ? info.name : element} Elements!`);
        }
        if (this.dungeonFight) {
          GameState.recordBossClear(this.dungeonFight.bossId, this.dungeonFight.stage);
          sub.unshift(`Floor ${this.dungeonFight.stage} cleared!`);
          if (this.dungeonFight.diamonds > 0) {
            GameState.addDiamonds(this.dungeonFight.diamonds);
            sub.push(`💎 ${this.dungeonFight.diamonds} Diamonds from the hoard!`);
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
        this.recordResult(winner, sub);
        this.ui.showBanner(winner, sub.join('<br>'), this.bannerOpts(winner));
      } else {
        this.cancelChain(); // a wipe ends the hunt
        this.recordResult(winner, ['Your team was wiped out.']);
        this.ui.showBanner(winner, 'Your team was wiped out.', this.bannerOpts(winner));
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
    this.refreshStopChain();
    if (this.battle) this.battle.update(dt);
    // The armed retreat lapses if it isn't confirmed.
    if (this.retreatTimer != null) {
      this.retreatTimer -= dt;
      if (this.retreatTimer <= 0) this.armRetreat(false);
    }

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
