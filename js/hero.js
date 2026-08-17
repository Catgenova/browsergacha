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

  startTurn(battle) {
    // Cooldowns tick down at the start of this unit's own turn.
    for (const a of this.abilities) {
      if (a.cooldownRemaining > 0) a.cooldownRemaining--;
    }
    this.tickStatusEffects();

    // Passive hook: onTurnStart. Returns null or a display result:
    //   { label, message, floats: [{ target, text, color }] }
    if (this.passive && this.passive.hooks && this.passive.hooks.onTurnStart) {
      return this.passive.hooks.onTurnStart(this, battle) || null;
    }
    return null;
  }

  useAbility(abilityState) {
    abilityState.cooldownRemaining = abilityState.def.cooldown;
    this.turnMeter = 0;
  }
}
