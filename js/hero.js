// Unit: a hero or enemy instance placed on the battle grid.
// Built from a definition object (js/data/heroes.js, js/data/enemies.js).

class Unit {
  // Set while a retaliation hook is resolving; see struck().
  static retaliating = false;

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
    // equipped gear (main stats + set bonuses). Bosses declaring
    // level-5/level-100 anchors use their own per-stat curves.
    const scaled = (def.isBoss && def.stats5 && def.stats100)
      ? Progression.bossScaledStats(def, this.level)
      : Progression.scaledStats(def, this.level, this.stars);
    // Attunement: +10% base stats per step, before gear. Speed is left
    // alone deliberately -- a flat percentage on it would reorder the
    // whole turn economy, and attunement is meant to be a power curve
    // rather than a second speed stat.
    this.attune = progress?.attune || 0;
    if (this.attune > 0 && typeof Attune !== 'undefined') {
      const m = Attune.statMult(this.attune);
      scaled.hp = Math.round(scaled.hp * m);
      scaled.atk = Math.round(scaled.atk * m);
      scaled.def = Math.round(scaled.def * m);
    }
    // `statScale` retunes one deployment of a unit without touching its
    // definition. The campaign uses it to hold its chapter holders to a
    // curve of their own: the boss roster is unevenly tuned relative to
    // level, and the boss-stage ladder depends on those exact numbers.
    const k = progress?.statScale;
    if (k && k !== 1) {
      scaled.hp = Math.max(1, Math.round(scaled.hp * k));
      scaled.atk = Math.max(1, Math.round(scaled.atk * k));
      scaled.def = Math.max(0, Math.round(scaled.def * k));
    }
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
    this.gearStun = stats.stun || 0;
    this.gearCdr = stats.cdr || 0;
    this.gearReflect = stats.reflect || 0;
    this.gearRegen = stats.regen || 0;
    this.gearHealBoost = stats.healBoost || 0;
    this.gearApDrain = stats.apDrain || 0;
    this.gearApGain = stats.apGain || 0;
    this.gearAccuracy = stats.accuracy || 0;
    this.gearResistance = stats.resistance || 0;
    this.gearDotBoost = stats.dotBoost || 0;

    // Party synergy (element resonance 7pc channels): a flat
    // incoming-damage cut (Light), turn meter fed by enemy turns
    // (Wind), and a chance for debuffs to run an extra turn (Dark).
    this.synergyTakenMult = 1;
    this.synergyApOnEnemyTurn = 0;
    this.synergyDebuffExtraChance = 0;

    // Crystal mirrors (Echo): charges that halve incoming hits, breaking
    // one per hit. Sprite variants per count live in unit.mirrorSheets.
    this.mirrorMax = def.mirrors ? def.mirrors.max : 0;
    this.mirrors = def.mirrors ? (def.mirrors.start ?? def.mirrors.max) : 0;
    this.mirrorSheets = null; // count -> SpriteSheet, loaded with the animator

    // Turn meter: 0..TURN_METER_MAX, fills with speed.
    this.turnMeter = 0;
    // Action-bar pushes other heroes have handed this unit since its last
    // turn, and the set that paid for the turn currently being taken.
    this.meterGifts = [];
    this.turnGifts = [];

    // Abilities: instantiate cooldown state per ability. Player heroes
    // carry saved skill levels (+10% power each past 1); enemies stay 1.
    this.abilities = (def.abilities || []).map((a, i) => ({
      def: a,
      cooldownRemaining: 0,
      level: (progress && progress.skills && progress.skills[i]) || 1,
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

  // Everything that can carry behavior hooks right now: the hero's
  // passives, plus their positional bonus while they stand in the hex
  // it calls for. Positionals are hook-driven like passives, so a
  // position can change how a hero fights, not just their stat line.
  hookSources() {
    if (!this.positional || !this.positional.hooks) return this.passives;
    return this.positionalActive()
      ? this.passives.concat(this.positional) : this.passives;
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
    for (const p of this.hookSources()) {
      const hook = p.hooks && p.hooks.damageDealtMult;
      if (hook) m *= hook(this, target) || 1;
    }
    return m;
  }

  // Chance to fully evade an incoming damaging hit (gear set bonuses +
  // dodgeAdd passive hooks), capped so nothing becomes unhittable.
  dodgeChance() {
    let d = this.gearDodge;
    for (const p of this.hookSources()) {
      const hook = p.hooks && p.hooks.dodgeAdd;
      // Numbers add flat; functions gate the bonus on state (hex, HP...).
      if (hook) d += typeof hook === 'function' ? (hook(this) || 0) : hook;
    }
    return Math.min(0.75, d);
  }

  // Debuff accuracy (attacker) vs resistance (defender): a debuff lands
  // with chance 1 - max(0, resistance - accuracy), floored at 15%.
  debuffAccuracy() {
    let a = this.gearAccuracy;
    for (const p of this.hookSources()) {
      if (p.hooks && p.hooks.accuracyAdd) a += p.hooks.accuracyAdd;
    }
    return a;
  }

  debuffResistance() {
    let r = this.gearResistance;
    for (const p of this.hookSources()) {
      if (p.hooks && p.hooks.resistanceAdd) r += p.hooks.resistanceAdd;
    }
    return r;
  }

  // Damage-over-time amplification (Snake set, venom passives).
  dotBoost() {
    let d = this.gearDotBoost;
    for (const p of this.hookSources()) {
      if (p.hooks && p.hooks.dotBoostAdd) d += p.hooks.dotBoostAdd;
    }
    return d;
  }

  // Chance to stun the target of a single-target attack (Wolf set +
  // stunAdd passive hooks). Stuns are resisted like any debuff.
  stunChance() {
    let s = this.gearStun;
    for (const p of this.hookSources()) {
      if (p.hooks && p.hooks.stunAdd) s += p.hooks.stunAdd;
    }
    return Math.min(0.6, s);
  }

  // Chance to drain 20% of a damaged target's turn meter (Cat set +
  // apDrainAdd passive hooks).
  apDrainChance() {
    let a = this.gearApDrain;
    for (const p of this.hookSources()) {
      if (p.hooks && p.hooks.apDrainAdd) a += p.hooks.apDrainAdd;
    }
    return Math.min(0.6, a);
  }

  // Outgoing-healing amplifier (Bear set 6pc + healBoostAdd hooks):
  // heals, HP%-heals, and HoTs this unit casts are this much stronger.
  healingBoost() {
    let h = this.gearHealBoost;
    for (const p of this.hookSources()) {
      if (p.hooks && p.hooks.healBoostAdd) h += p.hooks.healBoostAdd;
    }
    return h;
  }

  // Chance to bounce an incoming hit entirely back at the attacker
  // (Boar set 6pc + reflectAdd passive hooks).
  reflectChance() {
    let r = this.gearReflect;
    for (const p of this.hookSources()) {
      if (p.hooks && p.hooks.reflectAdd) r += p.hooks.reflectAdd;
    }
    return Math.min(0.5, r);
  }

  // Chance to immediately take another turn after acting.
  extraTurnChance() {
    let c = this.gearExtraTurn;
    for (const p of this.hookSources()) {
      if (p.hooks && p.hooks.extraTurnAdd) c += p.hooks.extraTurnAdd;
    }
    return Math.min(0.6, c);
  }

  // Incoming damage multiplier from vulnerability marks ('damageTaken'
  // status effects) and defensive passives.
  damageTakenMult() {
    return this.damageTakenBreakdown().total;
  }

  // The same multiplier, plus who is responsible for it.
  //
  // A ward cast by a support and a guard passive of the target's own are
  // both just numbers here, but they belong to different heroes. Without
  // the split, every point of damage a protector prevents is credited to
  // the ally who was not hit, and the protector's whole contribution is
  // invisible — on the meter and on the balance bench alike.
  //
  // `contributors` lists sourced reductions as { source, mult }; anything
  // the unit does for itself is left out and falls to the unit.
  damageTakenBreakdown() {
    let total = this.synergyTakenMult || 1;
    const contributors = [];
    for (const fx of this.statusEffects) {
      if (fx.stat === 'damageTaken' && fx.mult) {
        total *= fx.mult;
        // A ward the unit put on itself is its own business.
        if (fx.source && fx.source !== this) {
          contributors.push({ source: fx.source, mult: fx.mult });
        }
      }
    }
    for (const p of this.hookSources()) {
      const hook = p.hooks && p.hooks.damageTakenMult;
      if (hook) total *= hook(this) || 1;
    }
    return { total, contributors };
  }

  // Apply this unit's defences to an incoming figure and book who
  // prevented what. Returns the damage that still gets through.
  //
  // `selfCredit: false` books only the wards other heroes cast, not what
  // this unit did for itself — for damage that is a harness construct
  // rather than a real hit, where crediting the unit would inflate its
  // own numbers with something no enemy ever dealt.
  blunt(raw, opts = {}) {
    const { total, contributors } = this.damageTakenBreakdown();
    const through = Math.round(raw * total);
    const prevented = raw - through;
    if (prevented <= 0 || typeof Meter === 'undefined') return through;
    // Shares in proportion to how much each factor reduced: a 13% ward
    // beside a 10% guard passive splits the credit 13 to 10.
    const wardShare = contributors
      .reduce((sum, c) => sum + Math.max(0, 1 - c.mult), 0);
    const ownShare = Math.max(0, Math.max(0, 1 - total) - wardShare);
    const totalShare = wardShare + ownShare;
    if (totalShare > 0 && wardShare > 0) {
      for (const c of contributors) {
        Meter.mitigated(c.source, prevented * (Math.max(0, 1 - c.mult) / totalShare));
      }
      if (opts.selfCredit !== false) {
        Meter.mitigated(this, prevented * (ownShare / totalShare));
      }
    } else if (opts.selfCredit !== false) {
      Meter.mitigated(this, prevented);
    }
    return through;
  }

  // ---- Assist credit -----------------------------------------------------
  //
  // The offensive mirror of damageTakenBreakdown/blunt. A hero whose kit
  // is pure setup -- attack up, crit up, a shove up the action bar, an
  // armour break on the target -- deals no damage of their own, so every
  // point their work produced used to be booked to whoever swung. On the
  // meter they read as idle, and on the balance bench they came back
  // "no kit for it" rather than ranking at all.
  //
  // Each entry is { source, mult }, where mult is the factor by which
  // that hero multiplied this hit. bookDamage() splits the hit between
  // them and the attacker, so the total still equals the damage dealt.

  // Multipliers on THIS unit's outgoing damage that another hero supplied.
  outgoingAssists(crit) {
    const out = [];
    for (const fx of this.statusEffects) {
      if (!fx.source || fx.source === this) continue;
      if (fx.stat === 'atk' && fx.mult > 1) {
        // Damage is linear in ATK all the way through the DEF curve.
        out.push({ source: fx.source, mult: fx.mult });
      } else if (crit && fx.stat === 'critDamage') {
        const cd = this.effectiveStat('critDamage');
        const base = fx.mult ? cd / fx.mult : cd - (fx.add || 0);
        if (base > 0 && cd > base) out.push({ source: fx.source, mult: cd / base });
      } else if (crit && fx.stat === 'critChance' && fx.add > 0) {
        // The crit landed. The odds it landed BECAUSE of this buff are
        // the share of the crit chance the buff supplied, so credit that
        // share of the crit's extra damage -- unbiased across many hits.
        const c = this.effectiveStat('critChance');
        const cd = this.effectiveStat('critDamage');
        const share = c > 0 ? Math.min(1, fx.add / c) : 0;
        const part = share * (1 - 1 / Math.max(1, cd));
        if (part > 0 && part < 1) out.push({ source: fx.source, mult: 1 / (1 - part) });
      }
    }
    return out.concat(this.giftAssists());
  }

  // Action-bar pushes: if half the meter that produced this turn was a
  // gift, half of what the turn does belongs to whoever gave it. Shared
  // between the damage and healing books — a bought turn is a bought
  // turn whatever the unit spends it on.
  giftAssists() {
    const out = [];
    const gifts = (this.turnGifts || []).filter((g) => g.source && g.source !== this);
    const given = gifts.reduce((sum, g) => sum + g.amount, 0);
    if (given > 0) {
      // Capped: a turn is never entirely somebody else's doing, and the
      // unit still had to have the kit to spend it on.
      const share = Math.min(0.6, given / CONFIG.TURN_METER_MAX);
      const mult = 1 / (1 - share);
      for (const g of gifts) {
        out.push({ source: g.source, mult: 1 + (mult - 1) * (g.amount / given) });
      }
    }
    return out;
  }

  // A speed buff buys turn meter the way a meter push does, just spread
  // over time: each tick, the share of the fill that sourced speed buffs
  // supplied is banked as a meter gift from those heroes, and the turn
  // it eventually buys pays them back through the same books as any
  // push. Without this a speed-anthem hero's whole kit metered as zero.
  // Only multiplier buffs count — that is what every speed kit applies,
  // and it matches how effectiveStat composes them.
  bankSpeedGifts(fill) {
    let product = 1;
    let parts = null;
    for (const fx of this.statusEffects) {
      if (fx.kind !== 'buff' || fx.stat !== 'speed') continue;
      if (!fx.source || fx.source === this || !(fx.mult > 1)) continue;
      product *= fx.mult;
      (parts ||= []).push(fx);
    }
    if (!parts) return;
    const bought = fill * (1 - 1 / product);
    const weight = parts.reduce((sum, fx) => sum + (fx.mult - 1), 0);
    for (const fx of parts) {
      const amount = bought * ((fx.mult - 1) / weight);
      // Merged per source: this runs every tick, and a gift list growing
      // by twenty entries a second is a leak, not a ledger.
      const gift = this.meterGifts.find((g) => g.source === fx.source);
      if (gift) gift.amount += amount;
      else this.meterGifts.push({ source: fx.source, amount });
    }
  }

  // The healing mirror of outgoingAssists: who multiplied the mend this
  // unit is casting. Turn gifts always apply — the turn itself was
  // partly bought — but ATK buffs only when the heal actually scales off
  // ATK; a percent-of-max-HP mend owes an attack buff nothing.
  healAssists(atkScaled) {
    const out = [];
    if (atkScaled) {
      for (const fx of this.statusEffects) {
        if (!fx.source || fx.source === this) continue;
        if (fx.stat === 'atk' && fx.mult > 1) out.push({ source: fx.source, mult: fx.mult });
      }
    }
    return out.concat(this.giftAssists());
  }

  // Armour breaks on THIS unit (the target), expressed as how much more
  // damage an incoming hit does because of them. The DEF curve is not
  // linear, so the multiplier is measured against the DEF this unit would
  // have had without the sourced reductions.
  defBreakAssists() {
    let product = 1;
    const parts = [];
    for (const fx of this.statusEffects) {
      if (fx.stat !== 'def' || !fx.source || fx.source === this) continue;
      if (!(fx.mult > 0) || fx.mult >= 1) continue;
      product *= fx.mult;
      parts.push(fx);
    }
    if (!parts.length) return [];
    const now = this.effectiveStat('def');
    const base = now / product;
    const ratio = (base + 300) / (now + 300); // damageFormula's curve
    if (!(ratio > 1)) return [];
    const weight = parts.reduce((sum, fx) => sum + (1 / fx.mult - 1), 0);
    return parts.map((fx) => ({
      source: fx.source,
      mult: 1 + (ratio - 1) * ((1 / fx.mult - 1) / weight),
    }));
  }

  // Dodges and reflects are prevention the defender owns outright.
  // Methods rather than inline Meter calls so tooling (the archetype
  // bench) can see whose incoming hit was avoided.
  bookDodge(prevented) {
    if (typeof Meter !== 'undefined') Meter.mitigated(this, prevented);
  }

  bookReflect(prevented, bounced) {
    if (typeof Meter === 'undefined') return;
    Meter.mitigated(this, prevented); // bounced away entirely
    Meter.damage(this, bounced);      // and dealt back
  }

  // Damage-taken marks on THIS unit (the target): the offensive twin of
  // the armour break. The extra slice of every hit an amplify causes
  // belongs to whoever branded the target with it.
  amplifyAssists() {
    const out = [];
    for (const fx of this.statusEffects) {
      if (fx.kind !== 'debuff' || fx.stat !== 'damageTaken' || !fx.source) continue;
      if (fx.mult > 1) out.push({ source: fx.source, mult: fx.mult });
    }
    return out;
  }

  // The defensive mirror of defBreakAssists: sourced DEF buffs push
  // this unit up the mitigation curve, and the damage the curve turned
  // away because of them is those heroes' mitigation — the same claim a
  // ward has on the hits it blunts. `through` is the hit that landed.
  defGuardCredit(through) {
    if (through <= 0 || typeof Meter === 'undefined') return;
    let product = 1;
    let parts = null;
    for (const fx of this.statusEffects) {
      if (fx.kind !== 'buff' || fx.stat !== 'def') continue;
      if (!fx.source || fx.source === this || !(fx.mult > 1)) continue;
      product *= fx.mult;
      (parts ||= []).push(fx);
    }
    if (!parts) return;
    const now = this.effectiveStat('def');
    const base = now / product;
    const ratio = (now + 300) / (base + 300); // damageFormula's curve
    if (!(ratio > 1)) return;
    const prevented = through * (ratio - 1);
    const weight = parts.reduce((sum, fx) => sum + (fx.mult - 1), 0);
    for (const fx of parts) {
      Meter.mitigated(fx.source, prevented * ((fx.mult - 1) / weight));
    }
  }

  // Book a landed hit, splitting off the share owed to whoever set it up.
  bookDamage(target, dealt, crit) {
    if (typeof Meter === 'undefined' || dealt <= 0) return;
    const assists = this.outgoingAssists(crit)
      .concat(target.defBreakAssists ? target.defBreakAssists() : [])
      .concat(target.amplifyAssists ? target.amplifyAssists() : [])
      // Never hand credit across the line: an enemy's own debuff on an
      // enemy is not an assist to this attack.
      .filter((a) => a.mult > 1 && a.source.team === this.team);
    if (!assists.length) { Meter.damage(this, dealt); return; }
    const { assisted, shares } = Unit.assistShares(dealt, assists);
    // Flagged while the assist share is booked, so tooling can tell a
    // setup hero's share of somebody else's swing from damage they dealt
    // themselves (test/archetypes.js reads this).
    Unit.assisting = true;
    try {
      for (const s of shares) Meter.damage(s.source, s.amount);
    } finally {
      Unit.assisting = false;
    }
    Meter.damage(this, dealt - assisted);
  }

  // Split a booked total between its owner and the assists that
  // multiplied it: the assisted slice is what the multipliers added, and
  // each assist takes a cut proportional to its own contribution.
  static assistShares(total, assists) {
    const product = assists.reduce((m, a) => m * a.mult, 1);
    const assisted = total * (1 - 1 / product);
    const weight = assists.reduce((sum, a) => sum + (a.mult - 1), 0);
    return {
      assisted,
      shares: assists.map((a) => ({
        source: a.source, amount: assisted * ((a.mult - 1) / weight),
      })),
    };
  }

  // ---- Health ------------------------------------------------------------

  // Returns the damage actually dealt. `attacker` (when known) is who
  // dealt it — crystal mirrors reflect a cut of the hit back at them.
  takeDamage(amount, attacker = null) {
    // Crystal mirrors: every hit shatters one mirror, which reflects 25%
    // of the damage back at the attacker. The reflected hit is dealt
    // without an attacker, so mirrors can never chain off each other.
    if (this.mirrors > 0 && amount > 0) {
      this.addMirrors(-1);
      if (typeof Battle !== 'undefined' && Battle.active) {
        Battle.active.addFloatingText(this, '◆ SHATTER', '#8ee8ff');
      }
      if (attacker && attacker !== this && attacker.alive) {
        const back = Math.max(1, Math.round(amount * 0.25));
        const bounced = attacker.takeDamage(back);
        if (typeof Meter !== 'undefined') Meter.damage(this, bounced);
        if (typeof Battle !== 'undefined' && Battle.active) {
          Battle.active.addFloatingText(attacker, `-${back}`, '#8ee8ff');
          Battle.active.log(
            `${this.name}'s mirror shatters — ${back} damage reflects back at ${attacker.name}!` +
            (attacker.alive ? '' : ` ${attacker.name} is defeated!`), 'log-system');
        }
      }
    }
    // Shields eat the blow before HP does. This sits AFTER the mitigation
    // pipeline on purpose: a ward reduces what arrives, and the shield
    // then absorbs what is left, so the two stack rather than competing.
    const absorbed = this.absorb(amount);
    amount -= absorbed;
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.18;
    if (!this.alive) {
      this.turnMeter = 0;
      this.statusEffects = [];
      // Death animation (freezes on its last frame) when the hero has one.
      // A unit can die DURING ITS OWN ACTION -- reflected damage killed
      // the caster mid-swing -- and playing 'death' replaces the action
      // animation, discarding its completion callback. That callback is
      // what advances the battle (afterAction), so it must survive: hand
      // it to the fallback timer so it still fires a beat later.
      if (this.animator) {
        const pending = this.animator.onComplete;
        if (this.animator.sheet.animations.death) this.animator.play('death');
        else this.animator.onComplete = null;
        if (pending) this.animator.fallbackTimer = { wait: 0.4, onComplete: pending };
      }
    } else if (amount + absorbed > 0) {
      this.struck(amount, attacker);
    }
    return amount;
  }

  // ---- Shields -----------------------------------------------------------
  //
  // A shield is a pool of absorbed damage with a lifetime, held as an
  // ordinary status effect so it expires, stacks and reads on the
  // nameplate like everything else. It is spent oldest-first, which
  // matters: the stack about to run out should be the one doing the work.

  shieldTotal() {
    let n = 0;
    for (const fx of this.statusEffects) {
      if (fx.kind === 'shield') n += Math.max(0, fx.amount);
    }
    return n;
  }

  addShield(amount, turns, source = null) {
    const value = Math.round(amount);
    if (value <= 0) return 0;
    this.addStatusEffect({ kind: 'shield', amount: value, turns, source });
    return value;
  }

  // Spend shield against an incoming figure; returns how much it ate.
  absorb(amount) {
    if (amount <= 0) return 0;
    const before = this.shieldTotal();
    let left = amount;
    let taken = 0;
    for (const fx of this.statusEffects) {
      if (fx.kind !== 'shield' || left <= 0) continue;
      const eaten = Math.min(fx.amount, left);
      fx.amount -= eaten;
      left -= eaten;
      taken += eaten;
      // Absorbed damage is prevented damage, and it belongs to whoever
      // put the shield up -- the same rule Unit.blunt applies to wards.
      if (typeof Meter !== 'undefined') Meter.mitigated(fx.source || this, eaten);
    }
    if (taken > 0) {
      this.statusEffects = this.statusEffects.filter(
        (fx) => fx.kind !== 'shield' || fx.amount > 0);
      // Broken by a hit, as opposed to running out its duration: the
      // bubble bursts. Expiry gets no burst, because nothing broke it.
      if (before > 0 && this.shieldTotal() === 0 &&
          typeof Battle !== 'undefined' && Battle.active && this.slot) {
        Battle.active.spawnImpact('shield_bubble', this.slot.x, this.slot.y - 14);
      }
    }
    return taken;
  }

  // The other side of struck(): hooks that answer LANDING a blow. Fires
  // once per target actually damaged, from Abilities.strike, after the
  // hit has been booked.
  //
  // Guarded the same way retaliation is, and for the same reason: a hook
  // here that deals damage of its own would otherwise feed itself.
  dealt(amount, target) {
    if (amount <= 0 || Unit.dealing) return;
    const battle = typeof Battle !== 'undefined' ? Battle.active : null;
    Unit.dealing = true;
    const prevOwner = Unit.hookOwner;
    Unit.hookOwner = this;
    try {
      for (const p of this.hookSources()) {
        const hook = p.hooks && p.hooks.onDealtDamage;
        if (hook) hook(this, { amount, target, battle });
      }
    } finally {
      Unit.dealing = false;
      Unit.hookOwner = prevOwner;
    }
  }

  // Retaliation: hooks that answer being hit. Fires only on a hit that
  // was survived, so a killing blow never triggers a response.
  //
  // Re-entrancy is guarded globally rather than per unit: damage dealt BY
  // a retaliation must not count as a strike, or two retaliating units
  // bounce hits off each other until the stack gives out.
  struck(amount, attacker) {
    if (Unit.retaliating) return;
    const battle = typeof Battle !== 'undefined' ? Battle.active : null;
    if (!battle) return;
    Unit.retaliating = true;
    const prevOwner = Unit.hookOwner;
    Unit.hookOwner = this;
    try {
      for (const p of this.hookSources()) {
        const hook = p.hooks && p.hooks.onStruck;
        if (hook) hook(this, { amount, attacker, battle });
      }
    } finally {
      Unit.retaliating = false;
      Unit.hookOwner = prevOwner;
    }
  }

  // The slip-side of struck(): hooks that answer a hit that never landed
  // (Oak ripostes out of a dodge). Same retaliation guard, so two
  // dodge-happy units can never ping-pong forever.
  dodged(attacker) {
    if (Unit.retaliating) return;
    const battle = typeof Battle !== 'undefined' ? Battle.active : null;
    if (!battle) return;
    Unit.retaliating = true;
    const prevOwner = Unit.hookOwner;
    Unit.hookOwner = this;
    try {
      for (const p of this.hookSources()) {
        const hook = p.hooks && p.hooks.onDodge;
        if (hook) hook(this, { attacker, battle });
      }
    } finally {
      Unit.retaliating = false;
      Unit.hookOwner = prevOwner;
    }
  }

  // Gain (or lose) crystal mirrors, clamped to 0..max. Returns the actual
  // change; swaps the sprite sheet to the matching mirror-count variant.
  addMirrors(n) {
    if (this.mirrorMax <= 0) return 0;
    const before = this.mirrors;
    this.mirrors = Math.max(0, Math.min(this.mirrorMax, this.mirrors + n));
    if (this.mirrors !== before) this.syncMirrorSheet();
    return this.mirrors - before;
  }

  syncMirrorSheet() {
    if (!this.animator || !this.mirrorSheets) return;
    const sheet = this.mirrorSheets[this.mirrors];
    // Variant sheets mirror the base sheet's animation structure, so the
    // player's current animation and frame stay valid across the swap.
    if (sheet) this.animator.sheet = sheet;
  }

  // Return from the dead at a fraction of max HP. `source` is whoever
  // brought them back, credited with the restored HP on the meter.
  revive(pct, source = null) {
    if (this.alive) return;
    this.hp = Math.max(1, Math.round(this.maxHp * pct));
    if (typeof Meter !== 'undefined') Meter.healing(source || this, this.hp);
    this.statusEffects = [];
    this.turnMeter = 0;
    this.hitFlash = 0;
    if (this.animator) this.animator.play('idle');
    // Counts as a heal for heal-reactive passives.
    if (typeof Battle !== 'undefined' && Battle.active) {
      Battle.active.onUnitHealed(this, this.hp);
    }
  }

  // `source` is whoever caused the healing, for the damage meter; it
  // defaults to the unit healing itself (regeneration, self-mending).
  // `opts.assists` ({ source, mult } entries, see healAssists) splits
  // the booked healing with the heroes whose buffs multiplied it, the
  // same way bookDamage splits a hit.
  heal(amount, source = null, opts = {}) {
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    const healed = this.hp - before;
    if (healed > 0 && typeof Meter !== 'undefined') {
      const by = source || this;
      const assists = (opts.assists || []).filter((a) =>
        a.mult > 1 && a.source !== by && a.source.team === by.team);
      if (!assists.length) {
        Meter.healing(by, healed);
      } else {
        const { assisted, shares } = Unit.assistShares(healed, assists);
        for (const s of shares) Meter.healing(s.source, s.amount);
        Meter.healing(by, healed - assisted);
      }
    }
    // Heal event bus: lets passives react to any ally being healed.
    if (healed > 0 && typeof Battle !== 'undefined' && Battle.active) {
      Battle.active.onUnitHealed(this, healed);
    }
    return healed;
  }

  // ---- Status effects ----------------------------------------------------

  addStatusEffect(fx) {
    const e = { ...fx };
    // Effects a passive or positional hook puts on SOMEONE ELSE belong to
    // the hook's owner. Abilities pass `source` explicitly; the ~150 hook
    // call sites in the data files do not, and without this every rally
    // and every armour break they hand out is anonymous.
    if (e.source === undefined && Unit.hookOwner && Unit.hookOwner !== this) {
      e.source = Unit.hookOwner;
    }
    this.statusEffects.push(e);
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
    // Whatever pushed this unit up the action bar since its last turn is
    // what bought THIS turn; hold it for the duration so the damage the
    // turn produces can be credited back.
    this.turnGifts = this.meterGifts;
    this.meterGifts = [];

    // Cooldowns tick down at the start of this unit's own turn.
    for (const a of this.abilities) {
      if (a.cooldownRemaining > 0) a.cooldownRemaining--;
    }

    const results = [];

    // Heal-over-time ticks (before durations decrement).
    for (const fx of this.statusEffects) {
      if (fx.kind !== 'hot') continue;
      const healed = this.heal(fx.amount, fx.source || this);
      if (healed > 0) {
        results.push({
          label: 'Regrowth',
          message: `${this.name} regrows ${healed} HP.`,
          floats: [{ target: this, text: `+${healed}`, color: '#7ae87a' }],
        });
      }
    }

    // Gear regeneration (Bear set 6pc): a fixed cut of max HP per turn.
    if (this.gearRegen > 0) {
      const healed = this.heal(Math.round(this.maxHp * this.gearRegen), this);
      if (healed > 0) {
        results.push({
          label: 'Regeneration',
          message: `${this.name}'s gear restores ${healed} HP.`,
          floats: [{ target: this, text: `+${healed}`, color: '#7ae87a' }],
        });
      }
    }

    // Damage-over-time ticks (poison etc.) — these can kill.
    //
    // The tick is locked in at cast off the caster's ATK, and what it
    // COSTS is the target's business, same as any other hit: it goes
    // through the shared pipeline. Two of that pipeline's steps make no
    // sense here and are switched off — you cannot dodge a poison that
    // is already in you, and there is no incoming blow to reflect.
    for (const fx of this.statusEffects) {
      if (fx.kind !== 'dot' || !this.alive) continue;
      const dealt = (typeof Abilities !== 'undefined' && fx.source)
        // The tick's size was locked in when the poison was cast, so
        // whatever buffs the caster carries NOW did not buy it: no assist
        // split on this one.
        ? Abilities.strike(fx.source, this, fx.amount,
            { dodge: false, reflect: false, assist: false }).amount
        : this.takeDamage(fx.amount); // sourceless tick: nobody to credit
      // strike() books the meter itself; crediting it again here would
      // count every tick twice.
      results.push({
        label: 'Poison',
        message: `${this.name} suffers ${dealt} poison damage.` +
          (this.alive ? '' : ` ${this.name} succumbs!`),
        floats: [{ target: this, text: `-${dealt}`, color: '#a8e85a' }],
      });
    }

    this.tickStatusEffects();

    const prevOwner = Unit.hookOwner;
    Unit.hookOwner = this;
    try {
      for (const p of this.hookSources()) {
        if (p.hooks && p.hooks.onTurnStart) {
          const r = p.hooks.onTurnStart(this, battle);
          if (r) results.push(r);
        }
      }
    } finally {
      Unit.hookOwner = prevOwner;
    }
    return results;
  }

  // Skill-level multiplier for one of this unit's abilities (looked up
  // by def reference, since Abilities.execute receives the def alone).
  skillPowerFor(abilityDef) {
    const st = this.abilities.find((a) => a.def === abilityDef);
    return st ? Progression.skillPower(st.level) : 1;
  }

  useAbility(abilityState) {
    // Cooldown reduction (Wolf set 6pc) shortens every real cooldown.
    const cd = abilityState.def.cooldown;
    abilityState.cooldownRemaining = cd > 0 ? Math.max(0, cd - this.gearCdr) : 0;
    this.turnMeter = 0;
  }
}
