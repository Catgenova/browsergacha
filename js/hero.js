// Unit: a hero or enemy instance placed on the battle grid.
// Built from a definition object (js/data/heroes.js, js/data/enemies.js).

class Unit {
  constructor(def, team) {
    this.def = def;
    this.id = `${team}-${def.id}-${Math.floor(Math.random() * 1e6)}`;
    this.name = def.name;
    this.team = team;

    // Base stats
    this.maxHp = def.stats.hp;
    this.hp = def.stats.hp;
    this.baseAtk = def.stats.atk;
    this.baseDef = def.stats.def;
    this.speed = def.stats.speed;
    this.baseCritChance = def.stats.critChance ?? 0.15; // 15% base
    this.baseCritDamage = def.stats.critDamage ?? 1.5;  // crits deal 150%

    // Turn meter: 0..TURN_METER_MAX, fills with speed.
    this.turnMeter = 0;

    // Abilities: instantiate cooldown state per ability.
    this.abilities = (def.abilities || []).map((a) => ({
      def: a,
      cooldownRemaining: 0,
    }));

    this.passive = def.passive || null;
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
    const hook = this.passive && this.passive.hooks && this.passive.hooks.damageDealtMult;
    if (hook) m *= hook(this, target) || 1;
    return m;
  }

  // Incoming damage multiplier from vulnerability marks ('damageTaken'
  // status effects).
  damageTakenMult() {
    let m = 1;
    for (const fx of this.statusEffects) {
      if (fx.stat === 'damageTaken' && fx.mult) m *= fx.mult;
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

    this.tickStatusEffects();

    if (this.passive && this.passive.hooks && this.passive.hooks.onTurnStart) {
      const r = this.passive.hooks.onTurnStart(this, battle);
      if (r) results.push(r);
    }
    return results;
  }

  useAbility(abilityState) {
    abilityState.cooldownRemaining = abilityState.def.cooldown;
    this.turnMeter = 0;
  }
}
