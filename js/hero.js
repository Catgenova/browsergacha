// Unit: a hero or enemy instance placed on the battle grid.
// Built from a definition object (js/data/heroes.js, js/data/enemies.js).

class Unit {
  // `progress` ({ level, stars }) scales base stats; omitted -> level 1
  // at the def's own rarity (unscaled).
  constructor(def, team, progress) {
    this.def = def;
    this.id = `${team}-${def.id}-${Math.floor(Math.random() * 1e6)}`;
    this.name = def.name;
    this.team = team;
    this.level = progress?.level ?? 1;
    this.stars = progress?.stars ?? def.rarity ?? 1;
    this.isBoss = !!def.isBoss;
    this.element = def.element || null;

    // Base stats: scaled by level and stars, then modified by any
    // equipped gear (main stats + set bonuses).
    const scaled = Progression.scaledStats(def, this.level, this.stars);
    const stats = Gear.applyToStats(scaled, progress?.gear || []);
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.baseAtk = stats.atk;
    this.baseDef = stats.def;
    this.speed = stats.speed;
    this.baseCritChance = stats.critChance ?? 0.15; // 15% base
    this.baseCritDamage = stats.critDamage ?? 1.5;  // crits deal 150%
    this.gearDodge = stats.dodge || 0;
    this.gearExtraTurn = stats.extraTurn || 0;
    this.gearAccuracy = stats.accuracy || 0;
    this.gearResistance = stats.resistance || 0;
    this.gearDotBoost = stats.dotBoost || 0;

    // Turn meter: 0..TURN_METER_MAX, fills with speed.
    this.turnMeter = 0;

    // Abilities: instantiate cooldown state per ability.
    this.abilities = (def.abilities || []).map((a) => ({
      def: a,
      cooldownRemaining: 0,
    }));

    // Passives: heroes carry one, bosses carry several (def.passives).
    this.passives = def.passives || (def.passive ? [def.passive] : []);
    this.passive = this.passives[0] || null; // legacy single-passive alias
    this.positional = def.positional || null;

    // Status effects: { kind, stat, mult, turns }
    this.statusEffects = [];

    // Grid placement (set by Battle when placed)
    this.slot = null;

    // Rendering state (set once sprites load)
    this.animator = null;
    this.motionState = null; // active attack-movement (see Battle.motionPos)
    this.spriteTint = def.tint || {};
    this.hitFlash = 0; // seconds of white flash remaining after taking damage
  }

  get alive() {
    return this.hp > 0;
  }

  enemyTeam() {
    return this.team === TEAM.PLAYER ? TEAM.ENEMY : TEAM.PLAYER;
  }

  // ---- Stats -------------------------------------------------------------

  // Positional bonus applies only when placed in the matching position.
  positionalActive() {
    return (
      this.positional &&
      this.slot &&
      this.slot.position === this.positional.position
    );
  }

  effectiveStat(stat) {
    let value;
    switch (stat) {
      case 'atk': value = this.baseAtk; break;
      case 'def': value = this.baseDef; break;
      case 'speed': value = this.speed; break;
      case 'critChance': value = this.baseCritChance; break;
      case 'critDamage': value = this.baseCritDamage; break;
      default: return 0;
    }

    if (this.positionalActive() && this.positional.stat === stat) {
      value *= this.positional.mult;
    }

    // Status effects: `add` is a flat bonus (crit stats), `mult` scales.
    for (const fx of this.statusEffects) {
      if (fx.stat !== stat) continue;
      if (fx.add) value += fx.add;
      if (fx.mult) value *= fx.mult;
    }

    if (stat === 'critChance') return Math.min(1, Math.max(0, value));
    if (stat === 'critDamage') return value;
    return Math.round(value);
  }

  // Outgoing damage multiplier: positional 'damage' bonuses and passive
  // damageDealtMult hooks (e.g. bonus vs front-row targets) stack here.
  damageDealtMult(target) {
    let m = 1;
    if (this.positionalActive() && this.positional.stat === 'damage') {
      m *= this.positional.mult;
    }
    for (const p of this.passives) {
      const hook = p.hooks && p.hooks.damageDealtMult;
      if (hook) m *= hook(this, target) || 1;
    }
    return m;
  }

  // Chance to fully evade an incoming damaging hit (gear set bonuses +
  // dodgeAdd passive hooks), capped so nothing becomes unhittable.
  dodgeChance() {
    let d = this.gearDodge;
    for (const p of this.passives) {
      if (p.hooks && p.hooks.dodgeAdd) d += p.hooks.dodgeAdd;
    }
    return Math.min(0.75, d);
  }

  // Debuff accuracy (attacker) vs resistance (defender): a debuff lands
  // with chance 1 - max(0, resistance - accuracy), floored at 15%.
  debuffAccuracy() {
    let a = this.gearAccuracy;
    for (const p of this.passives) {
      if (p.hooks && p.hooks.accuracyAdd) a += p.hooks.accuracyAdd;
    }
    return a;
  }

  debuffResistance() {
    let r = this.gearResistance;
    for (const p of this.passives) {
      if (p.hooks && p.hooks.resistanceAdd) r += p.hooks.resistanceAdd;
    }
    return r;
  }

  // Damage-over-time amplification (Snake set, venom passives).
  dotBoost() {
    let d = this.gearDotBoost;
    for (const p of this.passives) {
      if (p.hooks && p.hooks.dotBoostAdd) d += p.hooks.dotBoostAdd;
    }
    return d;
  }

  // Chance to immediately take another turn after acting.
  extraTurnChance() {
    let c = this.gearExtraTurn;
    for (const p of this.passives) {
      if (p.hooks && p.hooks.extraTurnAdd) c += p.hooks.extraTurnAdd;
    }
    return Math.min(0.6, c);
  }

  // Incoming damage multiplier from vulnerability marks ('damageTaken'
  // status effects) and defensive passives.
  damageTakenMult() {
    let m = 1;
    for (const fx of this.statusEffects) {
      if (fx.stat === 'damageTaken' && fx.mult) m *= fx.mult;
    }
    for (const p of this.passives) {
      const hook = p.hooks && p.hooks.damageTakenMult;
      if (hook) m *= hook(this) || 1;
    }
    return m;
  }

  // ---- Health ------------------------------------------------------------

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.18;
    if (!this.alive) {
      this.turnMeter = 0;
      this.statusEffects = [];
      // Death animation (freezes on its last frame) when the hero has one.
      if (this.animator && this.animator.sheet.animations.death) {
        this.animator.play('death');
      }
    }
  }

  // Return from the dead at a fraction of max HP.
  revive(pct) {
    if (this.alive) return;
    this.hp = Math.max(1, Math.round(this.maxHp * pct));
    this.statusEffects = [];
    this.turnMeter = 0;
    this.hitFlash = 0;
    if (this.animator) this.animator.play('idle');
    // Counts as a heal for heal-reactive passives.
    if (typeof Battle !== 'undefined' && Battle.active) {
      Battle.active.onUnitHealed(this, this.hp);
    }
  }

  heal(amount) {
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    const healed = this.hp - before;
    // Heal event bus: lets passives react to any ally being healed.
    if (healed > 0 && typeof Battle !== 'undefined' && Battle.active) {
      Battle.active.onUnitHealed(this, healed);
    }
    return healed;
  }

  // ---- Status effects ----------------------------------------------------

  addStatusEffect(fx) {
    this.statusEffects.push({ ...fx });
  }

  tickStatusEffects() {
    for (const fx of this.statusEffects) fx.turns--;
    this.statusEffects = this.statusEffects.filter((fx) => fx.turns > 0);
  }

  // ---- Turns / cooldowns -------------------------------------------------

  readyAbilities() {
    return this.abilities.filter((a) => a.cooldownRemaining === 0);
  }

  // Returns an array of display results:
  //   { label, message, floats: [{ target, text, color }] }
  startTurn(battle) {
    // Cooldowns tick down at the start of this unit's own turn.
    for (const a of this.abilities) {
      if (a.cooldownRemaining > 0) a.cooldownRemaining--;
    }

    const results = [];

    // Heal-over-time ticks (before durations decrement).
    for (const fx of this.statusEffects) {
      if (fx.kind !== 'hot') continue;
      const healed = this.heal(fx.amount);
      if (healed > 0) {
        results.push({
          label: 'Regrowth',
          message: `${this.name} regrows ${healed} HP.`,
          floats: [{ target: this, text: `+${healed}`, color: '#7ae87a' }],
        });
      }
    }

    // Damage-over-time ticks (poison etc.) — these can kill.
    for (const fx of this.statusEffects) {
      if (fx.kind !== 'dot' || !this.alive) continue;
      this.takeDamage(fx.amount);
      results.push({
        label: 'Poison',
        message: `${this.name} suffers ${fx.amount} poison damage.` +
          (this.alive ? '' : ` ${this.name} succumbs!`),
        floats: [{ target: this, text: `-${fx.amount}`, color: '#a8e85a' }],
      });
    }

    this.tickStatusEffects();

    for (const p of this.passives) {
      if (p.hooks && p.hooks.onTurnStart) {
        const r = p.hooks.onTurnStart(this, battle);
        if (r) results.push(r);
      }
    }
    return results;
  }

  useAbility(abilityState) {
    abilityState.cooldownRemaining = abilityState.def.cooldown;
    this.turnMeter = 0;
  }
}
