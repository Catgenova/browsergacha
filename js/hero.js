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
    let value = stat === 'atk' ? this.baseAtk : stat === 'def' ? this.baseDef : this.speed;

    if (this.positionalActive() && this.positional.stat === stat) {
      value *= this.positional.mult;
    }

    for (const fx of this.statusEffects) {
      if (fx.stat === stat) value *= fx.mult;
    }

    return Math.round(value);
  }

  // ---- Health ------------------------------------------------------------

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.18;
    if (!this.alive) {
      this.turnMeter = 0;
      this.statusEffects = [];
    }
  }

  heal(amount) {
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - before;
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

  startTurn() {
    // Cooldowns tick down at the start of this unit's own turn.
    for (const a of this.abilities) {
      if (a.cooldownRemaining > 0) a.cooldownRemaining--;
    }
    this.tickStatusEffects();

    // Passive hook: onTurnStart (e.g. regeneration).
    if (this.passive && this.passive.hooks && this.passive.hooks.onTurnStart) {
      return this.passive.hooks.onTurnStart(this) || null;
    }
    return null;
  }

  useAbility(abilityState) {
    abilityState.cooldownRemaining = abilityState.def.cooldown;
    this.turnMeter = 0;
  }
}
