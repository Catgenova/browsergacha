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
    Battle.active = this; // heal event bus target (one battle at a time)
    this.playerSlots = Hex.buildFormation(
      TEAM.PLAYER, CONFIG.PLAYER_FORMATION_X, CONFIG.FORMATION_Y, CONFIG.HEX_SIZE
    );
    this.enemySlots = Hex.buildFormation(
      TEAM.ENEMY, CONFIG.ENEMY_FORMATION_X, CONFIG.FORMATION_Y, CONFIG.HEX_SIZE
    );

    this.units = [];
    this.state = BattleState.TICKING;
    // Turn-limited fights (the World Rift): total unit turns allowed,
    // null = fight to the finish.
    this.turnLimit = null;
    this.turnsTaken = 0;
    this.activeUnit = null;
    this.autoMode = false;      // player heroes act via AI when true
    this.onAutoTakeover = null; // notify UI when auto seizes a pending turn

    // Transient view data
    this.floatingTexts = []; // { x, y, text, color, age }
    this.visualEffects = []; // { kind, sx, sy, ex, ey, age, duration, player }
    this.effectSprites = []; // one-shot impact effects { x, y, player, done }
    this.effectSheets = {};  // effectId -> SpriteSheet, preloaded by the screen
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
    // Max-HP positional bonuses apply once, at placement.
    if (unit.positional && unit.positional.stat === 'hp' &&
        slot.position === unit.positional.position) {
      unit.maxHp = Math.round(unit.maxHp * unit.positional.mult);
      unit.hp = unit.maxHp;
    }
    this.units.push(unit);
  }

  // Called (via the heal event bus) whenever any unit is actually healed.
  onUnitHealed(healedUnit, amount) {
    for (const u of this.livingUnits(healedUnit.team)) {
      for (const p of (u.hookSources ? u.hookSources() : u.passives || [])) {
        const hook = p.hooks && p.hooks.onAllyHealed;
        if (!hook) continue;
        const res = hook(u, healedUnit, this);
        if (res && res.floats) {
          res.floats.forEach((f) => this.addFloatingText(f.target, f.text, f.color));
        }
      }
    }
  }

  livingUnits(team = null) {
    return this.units.filter((u) => u.alive && (team === null || u.team === team));
  }

  log(message, cls = 'log-system') {
    if (this.onLog) this.onLog(message, cls);
  }

  // ---- Main update loop --------------------------------------------------

  update(dt) {
    // Battle speed multiplier (3x auto-battle): scales animations,
    // meters, and effect timers alike.
    dt *= this.speedMult || 1;
    // Animations & flashes always advance.
    for (const u of this.units) {
      if (u.animator) {
        // Stance holds: a strip can declare `stanceHold: '<stat>'` —
        // while the unit carries that status and would otherwise idle,
        // it holds the strip's final frame instead (Silas stays
        // crouched and drawn for as long as Aiming Stance lasts).
        // A hold is sticky: once engaged, `animator.holding` names the
        // strip, and the hold keeps owning the animator while it is
        // still showing that strip with nothing pending. Without the
        // stickiness the held strip fails the idle check next tick,
        // update() completes it back to idle, and the hold re-engages a
        // frame later — a visible flicker between crouch and idle. An
        // action re-taking the animator (play() clears the flag) or the
        // status expiring releases it.
        let held = false;
        const idling = ['idle', 'idle2', 'idle3', 'ready'].includes(u.animator.current);
        const holding = u.animator.holding &&
          u.animator.holding === u.animator.current && !u.animator.onComplete;
        if (u.alive && (idling || holding)) {
          for (const [name, a] of Object.entries(u.animator.sheet.animations)) {
            if (a.stanceHold &&
                u.statusEffects.some((fx) => fx.stat === a.stanceHold)) {
              u.animator.current = name;
              u.animator.frame = a.frames - 1;
              u.animator.elapsed = 0;
              u.animator.holding = name;
              held = true;
              break;
            }
          }
        }
        if (!held) {
          u.animator.holding = null;
          u.animator.update(dt);
        }
      }
      if (u.hitFlash > 0) u.hitFlash = Math.max(0, u.hitFlash - dt);
    }
    for (const ft of this.floatingTexts) ft.age += dt;
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.age < 1.1);
    for (const fx of this.visualEffects) {
      fx.age += dt;
      if (fx.player) fx.player.update(dt);
    }
    this.visualEffects = this.visualEffects.filter((fx) => fx.age < fx.duration);
    for (const fx of this.effectSprites) fx.player.update(dt);
    this.effectSprites = this.effectSprites.filter((fx) => !fx.done);

    // Stall watchdog: an action that never completes (its animation
    // callback lost, however that happened) would freeze the battle in
    // ACTING forever. Ten sim-seconds is longer than any animation; at
    // that point the turn is force-finished.
    if (this.state === BattleState.ACTING && this.acting) {
      this.acting.t += dt;
      if (this.acting.t > 10) {
        const { caster, abilityState } = this.acting;
        this.log(`${caster.name}'s action never resolved — pressing on.`, 'log-system');
        if (caster.animator) {
          caster.animator.onComplete = null;
          caster.animator.fallbackTimer = null;
        }
        caster.motionState = null;
        this.afterAction(caster, abilityState);
      }
    }

    // Pending AI action (simulation-clock replacement for setTimeout).
    if (this.pendingAuto) {
      this.pendingAuto.wait -= dt;
      if (this.pendingAuto.wait <= 0) {
        const { unit } = this.pendingAuto;
        this.pendingAuto = null;
        this.autoAct(unit);
      }
    }

    if (this.state !== BattleState.TICKING) return;

    // Advance turn meters (speed buffs/debuffs apply here). The share
    // of the fill a sourced speed buff supplied is banked as a meter
    // gift, so the turn it buys credits the buffer (Unit.bankSpeedGifts).
    for (const u of this.livingUnits()) {
      const fill = u.effectiveStat('speed') * CONFIG.TICK_SPEED_SCALE * dt * 10;
      u.turnMeter += fill;
      u.bankSpeedGifts(fill);
    }

    // Highest overfilled meter acts first.
    const ready = this.livingUnits()
      .filter((u) => u.turnMeter >= CONFIG.TURN_METER_MAX)
      .sort((a, b) => b.turnMeter - a.turnMeter);

    if (ready.length > 0) {
      // A turn-limited fight (the World Rift) ends when the clock runs
      // out, whoever is standing — the score is the point, not a kill.
      if (this.turnLimit && this.turnsTaken >= this.turnLimit) {
        this.activeUnit = null;
        this.state = BattleState.ENDED;
        if (this.onBattleEnd) this.onBattleEnd(TEAM.PLAYER);
        return;
      }
      this.turnsTaken++;
      if (this.turnLimit) {
        const left = this.turnLimit - this.turnsTaken;
        if ([30, 20, 10, 5, 3, 2, 1].includes(left)) {
          this.log(`The rift closes in ${left} turn${left === 1 ? '' : 's'}!`, 'log-system');
        } else if (left === 0) {
          this.log('The final turn — the rift is closing!', 'log-system');
        }
      }
      this.beginTurn(ready[0]);
    }
  }

  beginTurn(unit) {
    this.activeUnit = unit;
    unit.turnMeter = CONFIG.TURN_METER_MAX;

    // Stun check happens BEFORE startTurn ticks statuses away: a stunned
    // unit loses this turn (its DoTs/HoTs and cooldowns still tick).
    // Freeze is the ice-flavored stun and skips the turn the same way.
    const stunned = unit.statusEffects.some((fx) => fx.stat === 'stun');
    const frozen = !stunned && unit.statusEffects.some((fx) => fx.stat === 'freeze');

    // Alert stance while it's this unit's turn (falls back to idle if the
    // hero has no ready animation).
    if (unit.animator) unit.animator.play('ready');

    for (const res of unit.startTurn(this)) {
      (res.floats || []).forEach((f) =>
        this.addFloatingText(f.target, f.text, f.color));
      if (res.message) {
        this.log(res.message, unit.team === TEAM.PLAYER ? 'log-player' : 'log-enemy');
      }
    }

    // A damaging passive or poison tick may have just ended the battle.
    const winner = this.checkEnd();
    if (winner) {
      this.activeUnit = null;
      this.state = BattleState.ENDED;
      if (this.onBattleEnd) this.onBattleEnd(winner);
      return;
    }

    // Poison can kill a unit at the start of its own turn: skip the act.
    if (!unit.alive) {
      this.activeUnit = null;
      this.state = BattleState.TICKING;
      return;
    }

    // Stunned or frozen: the turn is spent recovering — no action.
    if (stunned || frozen) {
      unit.turnMeter = 0;
      this.addFloatingText(unit, frozen ? '❄ FROZEN' : 'STUNNED', '#8ee8ff', true);
      this.log(frozen
        ? `${unit.name} is frozen solid and loses the turn!`
        : `${unit.name} is stunned and loses the turn!`, 'log-system');
      if (unit.animator && unit.animator.current === 'ready') {
        unit.animator.play('idle');
      }
      this.activeUnit = null;
      this.grantTurnApGain(unit); // a lost turn is still a turn
      this.state = BattleState.TICKING;
      return;
    }

    // Boss telegraph: a heavy skill winding up is announced a turn
    // early, so the party can guard, cleanse or burst instead of being
    // surprised. The wind-up is spent on the boss's normal action.
    this.updateTelegraph(unit);

    if (unit.team === TEAM.PLAYER && !this.autoMode) {
      this.state = BattleState.PLAYER_INPUT;
      if (this.onPlayerTurn) this.onPlayerTurn(unit);
    } else {
      this.state = BattleState.ACTING;
      // AI "thinking" pause runs on the simulation clock so background
      // catch-up ticks (throttled tabs) keep battles moving.
      this.pendingAuto = { unit, wait: CONFIG.AI_DELAY / 1000 };
    }
  }

  // Bosses (and any unit flagged `telegraphs`) broadcast their heaviest
  // ready skill one turn before it lands. `unit.telegraph` holds the
  // ability being charged; the renderer paints it on the nameplate and
  // autoAct honours it so the promise is kept.
  updateTelegraph(unit) {
    if (!unit.isBoss && !(unit.def && unit.def.telegraphs)) return;
    // A charge that was announced last turn is spent this turn.
    if (unit.telegraph) {
      const still = unit.abilities.find((a) => a.def === unit.telegraph.def);
      if (!still || still.cooldownRemaining > 0) unit.telegraph = null;
      return; // it fires this turn — say nothing new
    }
    const heavy = unit.readyAbilities()
      .filter((a) => a.def.cooldown >= 4 &&
        a.def.effects.some((e) => e.type === 'damage' ||
          e.type === 'damageDef' || e.type === 'damageHpPct'))
      .sort((a, b) => b.def.cooldown - a.def.cooldown)[0];
    if (!heavy) return;
    unit.telegraph = { def: heavy.def };
    this.addFloatingText(unit, `⚠ ${heavy.def.name}`, '#ff9a5a', true);
    this.log(`${unit.name} begins charging ${heavy.def.name} — brace for it!`,
      'log-system');
  }

  // Toggle autobattle. If a player hero is already waiting for input,
  // auto takes over their pending turn immediately.
  setAuto(on) {
    this.autoMode = on;
    if (on && this.state === BattleState.PLAYER_INPUT && this.activeUnit) {
      const unit = this.activeUnit;
      this.state = BattleState.ACTING;
      if (this.onAutoTakeover) this.onAutoTakeover();
      this.pendingAuto = { unit, wait: CONFIG.AI_DELAY / 1000 };
    }
  }

  // ---- Actions -----------------------------------------------------------

  // Player (or AI) commits to an ability + target. Plays the caster's
  // animation; effects land on the animation's hitFrame if it declares
  // one, otherwise at completion. Animations with motion phases move the
  // caster across the field, tracking the selected target.
  performAbility(caster, abilityState, target) {
    this.state = BattleState.ACTING;
    // Watchdog context: if the action's completion callback is ever
    // lost, update() force-finishes the turn instead of stalling the
    // battle forever.
    this.acting = { caster, abilityState, t: 0 };
    const ability = abilityState.def;
    const strip = caster.animator && ability.animation
      ? caster.animator.sheet.animations[ability.animation]
      : null;

    let applied = false;
    const applyNow = () => {
      if (applied) return;
      applied = true;
      if (!caster.alive) return;
      if (ability.vfx === 'windshear' && target && target.slot) {
        this.spawnWindshear(caster, target);
      }
      const results = Abilities.execute(ability, caster, target, this);
      this.reportResults(caster, ability, results);
    };

    if (!strip) {
      applyNow();
      this.afterAction(caster, abilityState);
      return;
    }

    // Movement: precompute anchor points around the chosen target. Target
    // anchors need a chosen target; the caster-local ones (origin, air,
    // hover) don't, so self/ally abilities can still levitate or recoil.
    if (strip.motion && caster.slot) {
      const anchors = {
        origin: { x: caster.slot.x, y: caster.slot.y },
        originAir: { x: caster.slot.x, y: caster.slot.y - 120 },
        // A gentler lift than originAir — ascension/levitation poses.
        originHover: { x: caster.slot.x, y: caster.slot.y - 46 },
      };
      if (target && target.slot) {
        const dir = Math.sign(target.slot.x - caster.slot.x) || 1;
        const tw = target.animator ? target.animator.sheet.size().w : 48;
        anchors.targetFront = { x: target.slot.x - dir * (tw / 2 + 26), y: target.slot.y };
        anchors.targetBehind = { x: target.slot.x + dir * (tw / 2 + 30), y: target.slot.y };
      }
      // Phases that need a target anchor can't run without one.
      const usable = strip.motion.every(
        (ph) => anchors[ph.from] && anchors[ph.to]);
      if (usable) {
        caster.motionState = { anim: ability.animation, phases: strip.motion, anchors };
      }
    }

    // Frame-triggered side effects (dust clouds etc.) declared on the
    // strip: { frame, effect, at: anchorName|'self', dx, dy }.
    const firedFx = new Set();
    const frameEffectsAt = (f) => {
      for (const fe of strip.frameEffects || []) {
        if (f < fe.frame || firedFx.has(fe)) continue;
        firedFx.add(fe);
        let pos;
        if (fe.at === 'self' || !caster.motionState) {
          pos = this.motionPos(caster);
        } else {
          pos = caster.motionState.anchors[fe.at] || { x: caster.slot.x, y: caster.slot.y };
        }
        this.spawnImpact(fe.effect, pos.x + (fe.dx || 0), pos.y + (fe.dy || 0));
      }
    };

    if (strip.hitFrame || strip.frameEffects) {
      caster.animator.onFrameChange = (f) => {
        if (strip.hitFrame && f >= strip.hitFrame) applyNow();
        frameEffectsAt(f);
      };
    }

    caster.animator.play(ability.animation, () => {
      caster.animator.onFrameChange = null;
      applyNow(); // no hitFrame declared -> effects land here
      caster.motionState = null;
      this.afterAction(caster, abilityState);
    });
  }

  // One-shot impact effect (see js/data/effects.js) at a field position.
  // opts.rotate is in radians (drawn around the effect's center).
  spawnImpact(effectId, x, y, opts = {}) {
    const sheet = this.effectSheets[effectId];
    if (!sheet) return;
    const fx = {
      x, y,
      rotate: opts.rotate || 0,
      flipY: !!opts.flipY,
      player: new AnimationPlayer(sheet),
      done: false,
    };
    fx.player.play('play', () => { fx.done = true; });
    this.effectSprites.push(fx);
  }

  // A shearing wave that flies from the caster's blade through the
  // target's hex row.
  spawnWindshear(caster, target) {
    const start = this.motionPos(caster);
    const dir = Math.sign(target.slot.x - caster.slot.x) || 1;
    const rowY = target.slot.y;
    const row = this.livingUnits(caster.enemyTeam())
      .filter((u) => Math.abs(u.slot.y - rowY) < 2);
    // End just past the farthest enemy in the row (in the travel direction).
    const farX = row.length
      ? Math.max(...row.map((u) => u.slot.x * dir)) * dir
      : target.slot.x;
    const fx = {
      kind: 'windshear',
      sx: start.x + dir * 24,
      sy: start.y,
      ex: farX + dir * 90,
      ey: rowY,
      age: 0,
      duration: 0.35,
      dir,
      player: null,
    };
    // Sprite wave when the effect sheet is available; the renderer falls
    // back to drawn crescents otherwise.
    if (this.effectSheets.windshear_wave) {
      fx.player = new AnimationPlayer(this.effectSheets.windshear_wave);
      fx.player.play('play');
    }
    this.visualEffects.push(fx);
  }

  // Ground point directly beneath a unit and its current height above it
  // (0 when standing). Air anchors map to their ground equivalents and
  // arcs are ignored, so jumps report real altitude for shadow shrink.
  // A small in-place jump some animation strips carry (Silas's idle
  // fidget springs off the ground): a sine arc over the strip's hop
  // frames. Zero whenever the current animation has none.
  hopHeight(unit) {
    if (!unit.animator) return 0;
    const anim = unit.animator.sheet.animations[unit.animator.current];
    if (!anim || !anim.hop) return 0;
    const [a, b] = anim.hop.frames;
    const f = unit.animator.frame + 1;
    if (f < a || f > b) return 0;
    return Math.sin(Math.PI * ((f - a) / Math.max(1, b - a))) * anim.hop.height;
  }

  motionGround(unit) {
    const pos = this.motionPos(unit);
    const ms = unit.motionState;
    if (!ms || !unit.animator || unit.animator.current !== ms.anim) {
      return { x: pos.x, groundY: unit.slot.y, height: this.hopHeight(unit) };
    }
    const f = unit.animator.frame + 1;
    let phase = ms.phases[ms.phases.length - 1];
    for (const p of ms.phases) {
      if (f <= p.frames[1]) { phase = p; break; }
    }
    const t = unit.animator.progressIn(phase.frames);
    const grounded = (name) =>
      (name === 'originAir' || name === 'originHover') ? 'origin' : name;
    const from = ms.anchors[grounded(phase.from)];
    const to = ms.anchors[grounded(phase.to)];
    const groundY = from.y + (to.y - from.y) * t;
    return { x: pos.x, groundY, height: Math.max(0, groundY - pos.y) };
  }

  // Current draw position for a unit moving through an attack animation.
  motionPos(unit) {
    const ms = unit.motionState;
    if (!ms || !unit.animator || unit.animator.current !== ms.anim) {
      return { x: unit.slot.x, y: unit.slot.y - this.hopHeight(unit) };
    }
    const f = unit.animator.frame + 1;
    let phase = ms.phases[ms.phases.length - 1];
    for (const p of ms.phases) {
      if (f <= p.frames[1]) { phase = p; break; }
    }
    const t = unit.animator.progressIn(phase.frames);
    const from = ms.anchors[phase.from];
    const to = ms.anchors[phase.to];
    const x = from.x + (to.x - from.x) * t;
    let y = from.y + (to.y - from.y) * t;
    if (phase.arc) y -= phase.arc * 4 * t * (1 - t); // parabolic air arc
    return { x, y };
  }

  reportResults(caster, ability, results) {
    const cls = caster.team === TEAM.PLAYER ? 'log-player' : 'log-enemy';
    const statLabel = {
      atk: 'ATK', def: 'DEF', speed: 'SPD',
      critChance: 'CRIT', critDamage: 'CRIT DMG',
    };
    // Impact effects: one per affected unit. Damage defaults to 'strike';
    // non-damage abilities show one only when they declare an impact.
    // Enemy casters spawn no impact vfx for now — the hero's white hit
    // flash carries the feedback.
    const impacted = new Set();
    for (const res of results) {
      if (caster.team !== TEAM.PLAYER) break;
      const wantImpact = res.kind === 'damage' ? (ability.impact || 'strike') : ability.impact;
      if (wantImpact && res.target.slot && !impacted.has(res.target)) {
        impacted.add(res.target);
        this.spawnImpact(wantImpact, res.target.slot.x, res.target.slot.y - 14,
          { rotate: (ability.impactRotate || 0) * Math.PI / 180, flipY: !!ability.impactFlipY });
      }
    }
    for (const res of results) {
      if (res.kind === 'damage') {
        // One cue per resolution; Sound collapses repeats inside a few
        // milliseconds so a seven-target sweep is a hit, not a spike.
        if (typeof Sound !== 'undefined' && !res.dodged) {
          Sound.play(res.crit ? 'crit' : 'hit');
        }
        if (res.bubbled) {
          this.addFloatingText(res.target, '🫧 POP', '#5ec2f0', true);
          this.log(`${res.target.name}'s bubble bursts — the whole hit is swallowed!`, cls);
        } else if (res.reflected) {
          this.addFloatingText(res.target, 'REFLECT!', '#ffd76a', true);
          this.addFloatingText(caster, `-${res.reflectAmount}`, '#ff6a6a');
          this.log(`${res.target.name} REFLECTS ${caster.name}'s ${ability.name} — ${res.reflectAmount} damage bounces back!`, cls);
          if (!caster.alive) this.log(`${caster.name} is defeated!`, 'log-system');
        } else if (res.dodged) {
          this.addFloatingText(res.target, 'DODGE', '#8ee8ff');
          this.log(`${res.target.name} dodges ${caster.name}'s ${ability.name}!`, cls);
        } else if (res.crit) {
          this.addFloatingText(res.target, `-${res.amount}!`, '#ffb02e', true);
          this.log(`${caster.name} uses ${ability.name}: CRITICAL! ${res.amount} damage to ${res.target.name}.`, cls);
        } else {
          this.addFloatingText(res.target, `-${res.amount}`, '#ff6a6a');
          this.log(`${caster.name} uses ${ability.name}: ${res.amount} damage to ${res.target.name}.`, cls);
        }
        // Elemental verdict: say it out loud, since it swings the hit
        // by 15-25% and nothing on screen used to mention it.
        if (res.elem > 1) {
          this.addFloatingText(res.target, 'WEAK!', '#ffd76a');
          this.log(`  ${Elements.info(caster.element).name} beats ${Elements.info(res.target.element).name} — +${Math.round((res.elem - 1) * 100)}% damage.`, cls);
        } else if (res.elem < 1) {
          this.addFloatingText(res.target, 'RESIST', '#8ecbff');
          this.log(`  ${Elements.info(res.target.element).name} resists ${Elements.info(caster.element).name} — ${Math.round((1 - res.elem) * 100)}% less damage.`, cls);
        }
        if (!res.target.alive) {
          if (typeof Sound !== 'undefined') Sound.play('death');
          this.log(`${res.target.name} is defeated!`, 'log-system');
        }
      } else if (res.kind === 'heal') {
        // A heal onto a full-health target is a real outcome, not an
        // event: Javarious casts his at full HP on purpose, for the
        // shield that comes with it. Say nothing rather than "for 0".
        if (res.amount > 0) {
          if (typeof Sound !== 'undefined') Sound.play('heal');
          this.addFloatingText(res.target, `+${res.amount}`, '#7ae87a');
          this.log(`${caster.name} uses ${ability.name}: heals ${res.target.name} for ${res.amount}.`, cls);
        }
      } else if (res.kind === 'cleanse') {
        if (res.count > 0) {
          this.addFloatingText(res.target, 'CLEANSED', '#ffe8a8');
          this.log(`${res.target.name} is cleansed of ${res.count} debuff${res.count > 1 ? 's' : ''}.`, cls);
        }
      } else if (res.kind === 'revive') {
        this.addFloatingText(res.target, '✚ REVIVED', '#ffe8a8', true);
        this.log(`${caster.name} uses ${ability.name}: ${res.target.name} returns to the fight with ${res.amount} HP!`, cls);
      } else if (res.kind === 'hot') {
        this.addFloatingText(res.target, 'HoT ▲', '#7ae87a');
        this.log(`${res.target.name} is blessed with regrowth for ${res.turns} turns.`, cls);
      } else if (res.kind === 'meter') {
        this.addFloatingText(res.target, 'METER ▼', '#d78aff');
        this.log(`${res.target.name}'s action bar is cut by ${Math.round(-res.amount * 100)}%.`, cls);
      } else if (res.kind === 'taunt') {
        this.addFloatingText(res.target, '⚑ TAUNT', '#ffd76a', true);
        this.log(`${res.target.name} draws the enemy's attention for ${res.turns} turns!`, cls);
      } else if (res.kind === 'mirrors') {
        if (res.amount > 0) {
          this.addFloatingText(res.target, `◆ +${res.amount}`, '#8ee8ff');
          this.log(`${res.target.name} reforms ${res.amount} crystal mirror${res.amount > 1 ? 's' : ''}.`, cls);
        }
      } else if (res.kind === 'shield') {
        if (typeof Sound !== 'undefined') Sound.play('ward');
        this.addFloatingText(res.target, `\u25a3 +${res.amount}`, '#7ae8d8');
        this.log(`${res.target.name} raises a shield for ${res.amount} ` +
          `(${res.turns} turn${res.turns > 1 ? 's' : ''}).`, cls);
      } else if (res.kind === 'bubble') {
        this.addFloatingText(res.target, '○ BUBBLE', '#5ec2f0');
        this.log(res.refreshed
          ? `${res.target.name}'s bubble is blown anew (${res.turns} turns).`
          : `${res.target.name} is wrapped in a bubble — the next hit pops harmlessly (${res.turns} turns).`, cls);
      } else if (res.kind === 'freeze') {
        this.addFloatingText(res.target, '❄ FROZEN', '#8ee8ff', true);
        this.log(`${res.target.name} freezes solid for ${res.turns} turn${res.turns > 1 ? 's' : ''}!`, cls);
      } else if (res.kind === 'removeStatus') {
        if (res.stat === 'freeze') {
          this.addFloatingText(res.target, 'THAWED', '#8ee8ff');
          this.log(`The ice shatters off ${res.target.name}.`, cls);
        }
      } else if (res.kind === 'stun') {
        this.addFloatingText(res.target, '✶ STUNNED', '#8ee8ff', true);
        this.log(`${res.target.name} is stunned for ${res.turns} turn${res.turns > 1 ? 's' : ''}!`, cls);
      } else if (res.kind === 'dot') {
        this.addFloatingText(res.target, 'POISON ▲', '#a8e85a');
        this.log(`${res.target.name} is poisoned for ${res.amount} per turn (${res.turns} turns).`, cls);
      } else if (res.kind === 'buff' || res.kind === 'debuff') {
        // A ward gets its own note — it is the one buff whose whole
        // value is invisible until something hits the ally wearing it.
        if (typeof Sound !== 'undefined' && !res.resisted &&
            res.kind === 'buff' && res.stat === 'damageTaken') {
          Sound.play('ward');
        }
        if (res.resisted) {
          this.addFloatingText(res.target, 'RESIST', '#c8c2da');
          this.log(`${res.target.name} resists ${caster.name}'s debuff!`, cls);
        } else if (res.stat === 'methane') {
          this.addFloatingText(res.target, 'GAS ☁', '#b8e85a');
          this.log(`${res.target.name} is shrouded in methane fog for ${res.turns} turns!`, cls);
        } else if (res.stat === 'damageTaken') {
          // Vulnerability mark: more damage taken.
          this.addFloatingText(res.target, 'VULN ▲', '#d78aff');
          this.log(`${res.target.name} is marked vulnerable for ${res.turns} turns.`, cls);
        } else if (res.stat === 'crystalline') {
          // Polarus's mantle: attackers risk freezing on contact.
          this.addFloatingText(res.target, '◈ CRYSTALLINE', '#8ee8ff');
          this.log(`${res.target.name} takes on Crystalline form — strike it and freeze (${res.turns} turns).`, cls);
        } else if (res.stat === 'aiming') {
          // Silas's stance: held until spent by a shot or broken by a
          // landed single-target hit — not a timed buff.
          this.addFloatingText(res.target, '◎ AIMING', '#ffe8a8');
          this.log(`${res.target.name} settles into Aiming Stance — the next shot strikes double.`, cls);
        } else {
          const label = statLabel[res.stat] || res.stat.toUpperCase();
          const arrow = res.kind === 'buff' ? '▲' : '▼';
          this.addFloatingText(res.target, `${label} ${arrow}`, res.kind === 'buff' ? '#8ecbff' : '#d78aff');
          this.log(`${res.target.name}'s ${label} ${res.kind === 'buff' ? 'rises' : 'falls'} for ${res.turns} turns.`, cls);
        }
      }
    }
  }

  afterAction(caster, abilityState) {
    this.acting = null;
    caster.useAbility(abilityState);
    this.activeUnit = null;
    // Back to plain idle if the turn ended without an action animation.
    if (caster.animator && caster.animator.current === 'ready') {
      caster.animator.play('idle');
    }

    const winner = this.checkEnd();
    if (winner) {
      this.state = BattleState.ENDED;
      if (this.onBattleEnd) this.onBattleEnd(winner);
      return;
    }

    // Cat set 6pc: every completed turn feeds AP to the prowlers.
    this.grantTurnApGain(caster);

    // Extra turns. An ability can promise one outright (extraTurn: true —
    // Eli's Quickening Sigil); otherwise the chance-based channels roll
    // (Rat set 6pc / boss passives). Never both, so one encore per turn.
    if (caster.alive && abilityState && abilityState.def && abilityState.def.extraTurn) {
      caster.turnMeter = CONFIG.TURN_METER_MAX;
      this.addFloatingText(caster, 'EXTRA TURN', '#ffd76a', true);
      this.log(`${caster.name} moves again at once!`, 'log-system');
    } else if (caster.alive && Math.random() < caster.extraTurnChance()) {
      caster.turnMeter = CONFIG.TURN_METER_MAX;
      this.addFloatingText(caster, 'EXTRA TURN', '#ffd76a', true);
      this.log(`${caster.name} seizes another turn!`, 'log-system');
    }

    this.state = BattleState.TICKING;
  }

  // Cat set 6pc: wearers gain a slice of turn meter whenever ANY unit's
  // turn completes (their own included — a head start on the refill).
  // Wind resonance 7pc feeds here too, but only off OPPOSING turns:
  // `ended` is the unit whose turn just finished.
  grantTurnApGain(ended) {
    for (const u of this.livingUnits()) {
      let gain = u.gearApGain > 0 ? u.gearApGain : 0;
      if (u.synergyApOnEnemyTurn > 0 && ended && ended.team !== u.team) {
        gain += u.synergyApOnEnemyTurn;
      }
      if (gain > 0) {
        u.turnMeter = Math.min(CONFIG.TURN_METER_MAX,
          u.turnMeter + CONFIG.TURN_METER_MAX * gain);
      }
    }
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

    // Hold defensive support (heals / HoTs / cleanses / DEF buffs on
    // allies) while nobody is hurt or debuffed. Offensive buffs (ATK,
    // crit, speed) are worth using anytime.
    const allies = this.livingUnits(unit.team);
    // How hurt an ally has to be before a heal is worth spending. Fixed
    // for enemies; the player's own tactics move it (see js/ai.js).
    const hurtBelow = AI.healThreshold(unit);
    const anyImpaired =
      allies.some((u) => u.hp / u.maxHp < hurtBelow) ||
      allies.some((u) => u.statusEffects.some(
        (fx) => fx.kind === 'debuff' || fx.kind === 'dot'));
    const usable = ready.filter((a) => {
      const defensiveOnly = a.def.effects.every((e) =>
        e.type === 'heal' || e.type === 'healHpPct' || e.type === 'hot' ||
        e.type === 'cleanse' || (e.type === 'buff' && e.stat === 'def'));
      const targetsAllies = ['ally', 'all-allies', 'self', 'front-allies',
        'self-and-wounded-allies'].includes(a.def.targeting);
      return !(defensiveOnly && targetsAllies && !anyImpaired);
    });
    // Skip group-target abilities whose target set is currently empty
    // (e.g. a back-row nuke when no enemy holds a back hex).
    const groupTargetings = ['all-enemies', 'back-enemies', 'front-enemies', 'front-allies',
      'all-allies', 'self-and-wounded-allies'];
    const withTargets = (usable.length > 0 ? usable : ready).filter((a) => {
      if (a.def.targeting === 'dead-ally') {
        return this.units.some((u) => !u.alive && u.team === unit.team);
      }
      return !groupTargetings.includes(a.def.targeting) ||
        Abilities.resolveTargets(a.def, unit, null, this).length > 0;
    });
    const pool = withTargets.length > 0 ? withTargets : ready;

    // Ability choice and target selection come from the unit's AI
    // profile (see js/ai.js): a wolf pack hunts healers, drakes spread
    // venom, bruisers go through the front line.
    const profile = AI.profileFor(unit);
    // A charged skill fires — a telegraph the boss ignores is a lie.
    const charged = unit.telegraph &&
      pool.find((a) => a.def === unit.telegraph.def);
    const choice = charged || profile.pick(pool, unit, this) ||
      pool.slice().sort((a, b) => b.def.cooldown - a.def.cooldown)[0];
    if (charged) unit.telegraph = null;

    let target = null;
    if (choice.def.targeting === 'enemy' || choice.def.targeting === 'enemy-row') {
      // The last enemy can fall between this unit's turn being granted
      // and it acting — a poison tick, a reflect, a death rattle — so
      // there may be nothing left to swing at.
      const enemies = this.livingUnits(unit.enemyTeam());
      if (enemies.length === 0) return;
      if (choice.def.targeting === 'enemy') {
        target = profile.focus(enemies, unit, this) ||
          enemies.slice().sort((a, b) => a.hp - b.hp)[0];
      } else {
        // Aim at the row with the most enemies, weakest member as anchor.
        const rows = new Map();
        for (const e of enemies) {
          const key = Math.round(e.slot.y);
          if (!rows.has(key)) rows.set(key, []);
          rows.get(key).push(e);
        }
        let best = null;
        for (const arr of rows.values()) {
          if (!best || arr.length > best.length) best = arr;
        }
        target = best.slice().sort((a, b) => a.hp - b.hp)[0];
      }
    } else if (choice.def.targeting === 'ally') {
      // Support the most wounded ally.
      target = allies.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    } else if (choice.def.targeting === 'dead-ally') {
      // Raise the fallen ally with the largest HP pool first.
      target = this.units
        .filter((u) => !u.alive && u.team === unit.team)
        .sort((a, b) => b.maxHp - a.maxHp)[0];
    }
    this.performAbility(unit, choice, target);
  }

  // ---- View helpers ------------------------------------------------------

  addFloatingText(unit, text, color, big = false) {
    if (!unit.slot) return;
    this.floatingTexts.push({
      x: unit.slot.x + (Math.random() * 16 - 8),
      y: unit.slot.y - 40,
      text,
      color,
      big,
      age: 0,
    });
  }

  unitAt(px, py, includeDead = false) {
    // Hit test against a box around each unit's sprite (which is
    // anchored feet-on-tile, so its center sits above the slot center).
    const pool = includeDead ? this.units.filter((u) => u.slot) : this.livingUnits();
    for (const u of pool) {
      const size = u.animator ? u.animator.sheet.size() : { w: 48, h: 48 };
      const centerY = u.slot.y - size.h / 2 + 5;
      const halfW = size.w / 2 + 6;
      const halfH = size.h / 2 + 6;
      if (Math.abs(px - u.slot.x) <= halfW && Math.abs(py - centerY) <= halfH) {
        return u;
      }
    }
    return null;
  }
}
