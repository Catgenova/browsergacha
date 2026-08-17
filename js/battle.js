// Battle engine: turn meters fill in "real time"; when a unit's meter is
// full it takes a turn. Player heroes pause the battle and wait for input;
// enemies act via simple AI after a short delay.

const BattleState = {
  TICKING: 'ticking',        // meters filling, nobody acting
  PLAYER_INPUT: 'player',    // waiting for the player to pick ability + target
  ACTING: 'acting',          // an action/animation is resolving
  ENDED: 'ended',
};

class Battle {
  constructor() {
    this.playerSlots = Hex.buildFormation(
      TEAM.PLAYER, CONFIG.PLAYER_FORMATION_X, CONFIG.FORMATION_Y, CONFIG.HEX_SIZE
    );
    this.enemySlots = Hex.buildFormation(
      TEAM.ENEMY, CONFIG.ENEMY_FORMATION_X, CONFIG.FORMATION_Y, CONFIG.HEX_SIZE
    );

    this.units = [];
    this.state = BattleState.TICKING;
    this.activeUnit = null;
    this.autoMode = false;      // player heroes act via AI when true
    this.onAutoTakeover = null; // notify UI when auto seizes a pending turn

    // Transient view data
    this.floatingTexts = []; // { x, y, text, color, age }
    this.onLog = null;       // (message, cls) => void, wired by UI
    this.onPlayerTurn = null;
    this.onBattleEnd = null;
  }

  slotsFor(team) {
    return team === TEAM.PLAYER ? this.playerSlots : this.enemySlots;
  }

  // Place a unit into a formation slot (0 = center, 1-6 = ring).
  placeUnit(unit, slotIndex) {
    const slot = this.slotsFor(unit.team)[slotIndex];
    if (slot.unit) throw new Error(`Slot ${slotIndex} on ${unit.team} side is occupied`);
    slot.unit = unit;
    unit.slot = slot;
    this.units.push(unit);
  }

  livingUnits(team = null) {
    return this.units.filter((u) => u.alive && (team === null || u.team === team));
  }

  log(message, cls = 'log-system') {
    if (this.onLog) this.onLog(message, cls);
  }

  // ---- Main update loop --------------------------------------------------

  update(dt) {
    // Animations & flashes always advance.
    for (const u of this.units) {
      if (u.animator) u.animator.update(dt);
      if (u.hitFlash > 0) u.hitFlash = Math.max(0, u.hitFlash - dt);
    }
    for (const ft of this.floatingTexts) ft.age += dt;
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.age < 1.1);

    if (this.state !== BattleState.TICKING) return;

    // Advance turn meters (speed buffs/debuffs apply here).
    for (const u of this.livingUnits()) {
      u.turnMeter += u.effectiveStat('speed') * CONFIG.TICK_SPEED_SCALE * dt * 10;
    }

    // Highest overfilled meter acts first.
    const ready = this.livingUnits()
      .filter((u) => u.turnMeter >= CONFIG.TURN_METER_MAX)
      .sort((a, b) => b.turnMeter - a.turnMeter);

    if (ready.length > 0) this.beginTurn(ready[0]);
  }

  beginTurn(unit) {
    this.activeUnit = unit;
    unit.turnMeter = CONFIG.TURN_METER_MAX;

    const passiveResult = unit.startTurn(this);
    if (passiveResult) {
      (passiveResult.floats || []).forEach((f) =>
        this.addFloatingText(f.target, f.text, f.color));
      this.log(passiveResult.message,
        unit.team === TEAM.PLAYER ? 'log-player' : 'log-enemy');
    }

    // A damaging passive may have just ended the battle.
    const winner = this.checkEnd();
    if (winner) {
      this.activeUnit = null;
      this.state = BattleState.ENDED;
      if (this.onBattleEnd) this.onBattleEnd(winner);
      return;
    }

    if (unit.team === TEAM.PLAYER && !this.autoMode) {
      this.state = BattleState.PLAYER_INPUT;
      if (this.onPlayerTurn) this.onPlayerTurn(unit);
    } else {
      this.state = BattleState.ACTING;
      setTimeout(() => this.autoAct(unit), CONFIG.AI_DELAY);
    }
  }

  // Toggle autobattle. If a player hero is already waiting for input,
  // auto takes over their pending turn immediately.
  setAuto(on) {
    this.autoMode = on;
    if (on && this.state === BattleState.PLAYER_INPUT && this.activeUnit) {
      const unit = this.activeUnit;
      this.state = BattleState.ACTING;
      if (this.onAutoTakeover) this.onAutoTakeover();
      setTimeout(() => this.autoAct(unit), CONFIG.AI_DELAY);
    }
  }

  // ---- Actions -----------------------------------------------------------

  // Player (or AI) commits to an ability + target. Plays the caster's
  // animation, applies effects at completion, then resumes ticking.
  performAbility(caster, abilityState, target) {
    this.state = BattleState.ACTING;
    const ability = abilityState.def;

    const finish = () => {
      if (!caster.alive) { this.afterAction(caster, abilityState); return; }
      const results = Abilities.execute(ability, caster, target, this);
      this.reportResults(caster, ability, results);
      this.afterAction(caster, abilityState);
    };

    if (caster.animator && ability.animation) {
      caster.animator.play(ability.animation, finish);
    } else {
      finish();
    }
  }

  reportResults(caster, ability, results) {
    const cls = caster.team === TEAM.PLAYER ? 'log-player' : 'log-enemy';
    for (const res of results) {
      if (res.kind === 'damage') {
        this.addFloatingText(res.target, `-${res.amount}`, '#ff6a6a');
        this.log(`${caster.name} uses ${ability.name}: ${res.amount} damage to ${res.target.name}.`, cls);
        if (!res.target.alive) this.log(`${res.target.name} is defeated!`, 'log-system');
      } else if (res.kind === 'heal') {
        this.addFloatingText(res.target, `+${res.amount}`, '#7ae87a');
        this.log(`${caster.name} uses ${ability.name}: heals ${res.target.name} for ${res.amount}.`, cls);
      } else if (res.kind === 'buff' || res.kind === 'debuff') {
        const arrow = res.kind === 'buff' ? '▲' : '▼';
        this.addFloatingText(res.target, `${res.stat.toUpperCase()} ${arrow}`, res.kind === 'buff' ? '#8ecbff' : '#d78aff');
        this.log(`${res.target.name}'s ${res.stat.toUpperCase()} ${res.kind === 'buff' ? 'rises' : 'falls'} for ${res.turns} turns.`, cls);
      }
    }
  }

  afterAction(caster, abilityState) {
    caster.useAbility(abilityState);
    this.activeUnit = null;

    const winner = this.checkEnd();
    if (winner) {
      this.state = BattleState.ENDED;
      if (this.onBattleEnd) this.onBattleEnd(winner);
      return;
    }
    this.state = BattleState.TICKING;
  }

  checkEnd() {
    if (this.livingUnits(TEAM.ENEMY).length === 0) return TEAM.PLAYER;
    if (this.livingUnits(TEAM.PLAYER).length === 0) return TEAM.ENEMY;
    return null;
  }

  // ---- AI (enemies, and player heroes in autobattle) ---------------------

  autoAct(unit) {
    if (this.state === BattleState.ENDED || !unit.alive) return;

    const ready = unit.readyAbilities();
    if (ready.length === 0) {
      // Nothing usable (shouldn't happen with a 0-CD ability): skip turn.
      this.afterAction(unit, unit.abilities[0]);
      return;
    }

    // Hold support abilities (heals/buffs on allies) while nobody is hurt.
    const anyWounded = this.livingUnits(unit.team).some((u) => u.hp / u.maxHp < 0.8);
    const usable = ready.filter((a) => {
      const supportOnly = a.def.effects.every((e) => e.type === 'heal' || e.type === 'buff');
      const targetsAllies = ['ally', 'all-allies', 'self'].includes(a.def.targeting);
      return !(supportOnly && targetsAllies && !anyWounded);
    });
    const pool = usable.length > 0 ? usable : ready;

    // Prefer the longest-cooldown ready ability; fall back to basics.
    const choice = pool.slice().sort((a, b) => b.def.cooldown - a.def.cooldown)[0];

    let target = null;
    if (choice.def.targeting === 'enemy') {
      // Focus fire the lowest-HP enemy.
      const enemies = this.livingUnits(unit.enemyTeam());
      target = enemies.slice().sort((a, b) => a.hp - b.hp)[0];
    } else if (choice.def.targeting === 'ally') {
      // Support the most wounded ally.
      const allies = this.livingUnits(unit.team);
      target = allies.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    }
    this.performAbility(unit, choice, target);
  }

  // ---- View helpers ------------------------------------------------------

  addFloatingText(unit, text, color) {
    if (!unit.slot) return;
    this.floatingTexts.push({
      x: unit.slot.x + (Math.random() * 16 - 8),
      y: unit.slot.y - 40,
      text,
      color,
      age: 0,
    });
  }

  unitAt(px, py) {
    // Hit test against a box around each living unit's sprite.
    for (const u of this.livingUnits()) {
      const size = u.animator ? u.animator.sheet.size() : { w: 48, h: 48 };
      const halfW = size.w / 2 + 6;
      const halfH = size.h / 2 + 6;
      if (Math.abs(px - u.slot.x) <= halfW && Math.abs(py - u.slot.y) <= halfH) {
        return u;
      }
    }
    return null;
  }
}
