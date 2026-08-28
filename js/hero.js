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
    // Blessing: this copy rolled Blessed (+20%) or Godtouched (+40%) at
    // summon time. Like attunement it lifts HP/ATK/DEF and leaves speed
    // alone, so the turn economy is not part of the lottery.
    this.blessing = progress?.blessing || null;
    if (this.blessing && typeof Blessing !== 'undefined') {
      const m = Blessing.statMult(this.blessing);
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
    // Blessed/Godtouched company: a chance to come back from a killing
    // blow, at most once per battle.
    this.resurrectChance = 0;
    this.resurrected = false;
    // One refused killing blow per fight, for a hero carrying a
    // `lastEmber` hook.
    this.emberSpent = false;
    // Reverence sect pack: an opening shield (% of max HP, granted by
    // applyParty) and shields off every blow dealt.
    this.synergyStartShield = 0;
    this.synergyShieldOnDeal = 0;
    // Cryst sect pack: one free freeze attempt as the battle opens
    // (fired by the battle screen) and a flat bonus on freeze rolls.
    this.synergyOpeningFreeze = 0;
    this.synergyFreezeChance = 0;
    // Firetroupe sect pack: chance for landed hits to Oilslick the
    // victim (burns tick twice as hard on the oiled).
    this.synergyOilOnHit = 0;

    // Crystal mirrors (Echo/Aniani): charges that do NOT mitigate. One
    // breaks per hit taken, reflecting 25% of the damage that got
    // through back at the attacker (see takeDamage), and every one of
    // her skills pays a flat bonus per mirror still intact — so they
    // are her damage as much as her answer to being hit.
    // Sprite variants per count live in unit.mirrorSheets.
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

  // Carrying a burn (Lucian's fire DoT)? His whole kit asks this.
  burning() {
    return this.statusEffects.some((fx) =>
      fx.kind === 'dot' && fx.flavor === 'burn');
  }

  // Frozen: the ice-flavoured stun, held as a debuff rather than a
  // status of its own (Abilities.freeze). Read often enough now -- by
  // Cryst's pack and by anything that wants to hit a held target harder
  // -- to be worth a name instead of the same `some()` in six places.
  frozen() {
    return this.statusEffects.some((fx) =>
      fx.kind === 'debuff' && fx.stat === 'freeze');
  }

  // Oilslicked: the Firetroupe's mark. Burns tick for DOUBLE on an oiled
  // target (see the dot loop), and their pack pays extra for hitting one.
  oiled() {
    return this.statusEffects.some((fx) => fx.stat === 'oilslicked');
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
    if (!this.positional) return false;
    if (this.slot && this.slot.position === this.positional.position) return true;
    // A chart says you are where you need to be. Polo's map hands the
    // whole crew their hex bonus wherever they happen to be standing;
    // it is read HERE because every positional in the game already
    // funnels through this one question, so nothing has to be taught
    // about it individually.
    if (this.statusEffects.some((fx) => fx.stat === 'charted')) return true;
    // And a passive can carry the chart permanently (Polo's own dead
    // reckoning). Read off `passives` rather than hookSources(), which
    // would ask this same question and loop.
    return (this.passives || []).some((p) => p.hooks && p.hooks.alwaysPositioned);
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
      // mult scales (HP, SPD); add is flat, for the crit stats that are
      // already fractions (Knife's Edge crit damage).
      if (this.positional.mult) value *= this.positional.mult;
      if (this.positional.add) value += this.positional.add;
    }

    // Status effects: `add` is a flat bonus (crit stats), `mult` scales.
    for (const fx of this.statusEffects) {
      if (fx.stat !== stat) continue;
      if (fx.add) value += fx.add;
      if (fx.mult) value *= fx.mult;
    }

    // Passive stat scaling. A hook here must read battle state only --
    // never another effectiveStat -- or it recurses through this very
    // line (Lysandra's stance reads whether her thread is still tied).
    for (const p of this.hookSources()) {
      const hook = p.hooks && p.hooks.statMult;
      if (hook) value *= hook(this, stat) || 1;
    }

    if (stat === 'critChance') return Math.min(1, Math.max(0, value));
    if (stat === 'critDamage') return value;
    return Math.round(value);
  }

  // Outgoing damage multiplier: positional 'damage' bonuses and passive
  // damageDealtMult hooks (e.g. bonus vs front-row targets) stack here.
  // `ability` is the skill being resolved, for a passive that pays out
  // on one skill rather than all three; it is absent when damage is
  // dealt outside an ability (reflects, thorns, a bench probe).
  damageDealtMult(target, ability = null) {
    let m = 1;
    if (this.positionalActive() && this.positional.stat === 'damage') {
      m *= this.positional.mult;
    }
    for (const p of this.hookSources()) {
      const hook = p.hooks && p.hooks.damageDealtMult;
      if (hook) m *= hook(this, target, ability) || 1;
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
  //
  // BOTH START AT 15. They used to start at zero, which meant nothing on
  // the field had any resistance at all and the contest was a formality
  // -- every hex landed, and accuracy was a stat that could not do
  // anything. Equal floors keep that default (15 against 15 is still a
  // certainty) while giving both sides a real number to move.
  //
  // Accuracy tops out at 100 and resistance at 85, deliberately unequal:
  // a fully-built attacker can always beat a fully-built defender, so no
  // amount of stacking makes anything immune. The 15% floor in
  // Abilities.debuffLands is the other end of the same promise.
  static get BASE_ACCURACY() { return 0.15; }

  static get BASE_RESISTANCE() { return 0.15; }

  debuffAccuracy() {
    let a = Unit.BASE_ACCURACY + this.gearAccuracy;
    for (const p of this.hookSources()) {
      if (p.hooks && p.hooks.accuracyAdd) a += p.hooks.accuracyAdd;
    }
    // Timed accuracy buffs (Slick's Fresh Coat) ride the status list.
    for (const fx of this.statusEffects) {
      if (fx.stat === 'accuracy' && fx.add) a += fx.add;
    }
    return Math.min(1, Math.max(0, a));
  }

  debuffResistance() {
    // Bosses hold half again on top of the floor: they are the fight
    // accuracy exists FOR, and the one place a debuff kit should have to
    // build for its hexes to stick.
    let r = Unit.BASE_RESISTANCE + (this.isBoss ? 0.50 : 0) + this.gearResistance;
    for (const p of this.hookSources()) {
      if (p.hooks && p.hooks.resistanceAdd) r += p.hooks.resistanceAdd;
    }
    // Timed resistance buffs (Posie's High Summer) ride the status
    // list, the same way accuracy buffs do above.
    for (const fx of this.statusEffects) {
      if (fx.stat === 'resistance' && fx.add) r += fx.add;
    }
    return Math.min(0.85, Math.max(0, r));
  }

  // A target under a heal-lock cannot be mended by anything that routes
  // through heal(): a cast, a regen tick, a drain, a lifesteal rider.
  // Reviving is NOT healing and is deliberately left alone -- Unit.revive
  // sets HP directly and never comes through here.
  healBlocked() {
    return this.statusEffects.some((fx) =>
      fx.kind === 'debuff' && fx.stat === 'healblock');
  }

  // A sealed target takes no new blessings at all. Asher's Nothing For
  // You writes this flag as an ordinary debuff, so it cleanses, it
  // resists, and it expires like everything else hostile.
  buffsSealed() {
    return this.statusEffects.some((fx) =>
      fx.kind === 'debuff' && fx.stat === 'buffblock');
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
  damageTakenMult(attacker) {
    return this.damageTakenBreakdown(attacker).total;
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
  damageTakenBreakdown(attacker) {
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
      // Hooks may read who is swinging (Lin shrugs off burning or
      // taunted attackers); most ignore the second argument.
      if (hook) total *= hook(this, attacker) || 1;
    }
    // Cover: a LIVING ALLY may reduce what this unit takes just by
    // standing somewhere (Morrow's Mourner's Row shelters the back
    // hexes from a front one). The reduction is theirs, so it is
    // credited to them rather than vanishing into the victim's own
    // defences. Scanned the same way meterGuarded scans for a guard.
    const cover = typeof Battle !== 'undefined' ? Battle.active : null;
    if (cover) {
      for (const ally of cover.livingUnits(this.team)) {
        if (ally === this) continue;
        for (const p of (ally.hookSources ? ally.hookSources() : [])) {
          const hook = p.hooks && p.hooks.coverMult;
          if (!hook) continue;
          const m = hook(ally, this) || 1;
          if (m === 1) continue;
          total *= m;
          contributors.push({ source: ally, mult: m });
        }
      }
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
    const { total, contributors } = this.damageTakenBreakdown(opts.attacker);
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

  // Book a landed hit. The attacker is credited the WHOLE of it -- that
  // is the number the battle log prints, and a damage column that
  // disagreed with the log was the thing players noticed first. The
  // share owed to whoever set the hit up is booked separately, under
  // `facilitated`, so a buffer's contribution is visible without being
  // quietly subtracted from the hero who swung. The two ledgers
  // double-count the same damage on purpose; see js/meter.js.
  bookDamage(target, dealt, crit) {
    if (typeof Meter === 'undefined' || dealt <= 0) return;
    Meter.damage(this, dealt);
    const assists = this.outgoingAssists(crit)
      .concat(target.defBreakAssists ? target.defBreakAssists() : [])
      .concat(target.amplifyAssists ? target.amplifyAssists() : [])
      // Never hand credit across the line: an enemy's own debuff on an
      // enemy is not an assist to this attack.
      .filter((a) => a.mult > 1 && a.source.team === this.team);
    if (!assists.length) return;
    const { shares } = Unit.assistShares(dealt, assists);
    // Flagged while the assist share is booked, so tooling can tell a
    // setup hero's share of somebody else's swing from damage they dealt
    // themselves (test/archetypes.js reads this).
    Unit.assisting = true;
    try {
      for (const s of shares) Meter.facilitated(s.source, s.amount);
    } finally {
      Unit.assisting = false;
    }
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
    // Soul Bond: whatever lands on her lands on the far end of the
    // thread, unmitigated -- no DEF curve, no dodge, no second roll.
    // Read BEFORE her own absorb, so what the bond pays is the blow
    // that was thrown rather than what got past her shield: a shield is
    // her business, not theirs.
    //
    // The guard is the whole safety of the mechanic. Without it a
    // bonded enemy who reflects (crystal mirrors, thorns) would bounce
    // damage back into her, which would mirror again, forever.
    if (amount > 0 && !Unit.bondRinging) {
      const b = typeof Battle !== 'undefined' ? Battle.active : null;
      if (b) {
        const bound = b.livingUnits().filter((u) => u !== this &&
          u.statusEffects.some((fx) => fx.stat === 'soulbond' && fx.source === this));
        if (bound.length) {
          Unit.bondRinging = true;
          try {
            for (const far of bound) {
              const paid = far.takeDamage(amount);
              if (typeof Meter !== 'undefined') Meter.damage(this, paid);
              if (b.addFloatingText) b.addFloatingText(far, `\u2740 -${paid}`, '#e05a9a');
              if (b.log) {
                b.log(`The thread pulls — ${far.name} takes ${paid} with ` +
                  `${this.name}.` + (far.alive ? '' : ` ${far.name} is defeated!`),
                  'log-system');
              }
            }
          } finally { Unit.bondRinging = false; }
        }
      }
    }
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
    // A `lastEmber` hook (Stella's coal) refuses the first killing blow
    // of the fight outright. She is not brought BACK -- she never goes
    // down -- so her wards, her blessings and her cooldowns all survive
    // with her, which is what separates it from a revive. Checked ahead
    // of the blessing's resurrect roll, so a Godtouched copy still has
    // its own return in hand afterwards.
    if (!this.alive && !this.emberSpent &&
        this.hookSources().some((p) => p.hooks && p.hooks.lastEmber)) {
      this.emberSpent = true;
      this.hp = 1;
      if (typeof Battle !== 'undefined' && Battle.active) {
        Battle.active.addFloatingText(this, '\u2726', '#e8a83a');
        Battle.active.log(`${this.name} will not go out.`, 'log-system');
      }
    }
    // Blessed/Godtouched company: the killing blow may not stick. One
    // return per battle, at 30% HP, statuses wiped like any other death.
    if (!this.alive && this.resurrectChance > 0 && !this.resurrected &&
        Math.random() < this.resurrectChance) {
      this.resurrected = true;
      this.statusEffects = [];
      this.hp = Math.max(1, Math.round(this.maxHp * 0.30));
      if (typeof Battle !== 'undefined' && Battle.active) {
        Battle.active.addFloatingText(this, '✶ RESURRECTED', '#ffd76a');
        Battle.active.log(
          `A blessing holds — ${this.name} resurrects at 30% HP!`, 'log-system');
      }
    }
    if (!this.alive) {
      // A death rings through the whole field BEFORE the body is
      // cleared, because what the fallen was carrying is exactly what
      // the watchers care about (Sable is paid for a poisoned corpse).
      // Guarded like the debuff ring: a hook that kills something must
      // not set itself off.
      if (!Unit.deathRinging) {
        const b = typeof Battle !== 'undefined' ? Battle.active : null;
        if (b) {
          // The fight's body count, both sides. Morrow's last swing is
          // priced off it, so it is kept on the battle rather than
          // recounted from a field that has already cleared its dead.
          b.deaths = (b.deaths || 0) + 1;
          Unit.deathRinging = true;
          try {
            // The victim hears its OWN death, and hears it first: a
            // passive that only pays out when its owner falls (Jack's
            // powder keg) has no other moment to fire in. Everyone who
            // read this hook before it did so to be paid for somebody
            // ELSE dying, and all three of them already guard against a
            // self-death -- Morrow on `!unit.alive`, Lenore on
            // `victim === unit`, Sable on the victim being an enemy --
            // so adding the corpse to the ring changes nothing for
            // them.
            for (const watcher of [this, ...b.livingUnits()]) {
              for (const p of (watcher.hookSources ? watcher.hookSources() : [])) {
                const hook = p.hooks && p.hooks.onUnitDied;
                // `killer` was in scope here all along and simply never
                // handed over. Everything that read this hook before
                // cared only about the corpse; a hook that pays the
                // hero who LANDED the blow (the Razorwings' 4pc) needs
                // to know whose blow it was. Null for a death nobody
                // dealt -- a poison tick, a reflect, running out of HP
                // to a hazard -- which is exactly when nobody should be
                // paid for it.
                if (hook) hook(watcher, { victim: this, killer: attacker, battle: b });
              }
            }
          } finally { Unit.deathRinging = false; }
        }
      }
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
      // Reverence sect (7pc): every blow shields its dealer for a cut
      // of the damage — the party-wide copy of Gathering Dawn, on the
      // same three-turn shield.
      if (this.synergyShieldOnDeal > 0) {
        this.addShield(Math.round(amount * this.synergyShieldOnDeal), 3, this);
      }
      // Firetroupe sect (7pc): a landed hit may slick the victim in
      // oil. The 10% roll is the whole gate — no second resist roll.
      if (this.synergyOilOnHit > 0 && target && target.alive &&
          target.team !== this.team &&
          Math.random() < this.synergyOilOnHit) {
        target.addStatusEffect({ kind: 'debuff', stat: 'oilslicked', turns: 2, source: this });
        if (battle) {
          battle.addFloatingText(target, '≋ OILSLICKED', '#d8b04a');
          battle.log(`${target.name} is slicked in oil — burns tick ` +
            'twice as hard (2 turns).', 'log-system');
        }
      }
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
      // Teammates can answer a blow that landed on this unit (Koe's
      // Silent Alarm). Fired inside the retaliation guard, so a
      // reaction can never chain into another reaction.
      for (const mate of battle.livingUnits(this.team)) {
        for (const p of mate.hookSources()) {
          const hook = p.hooks && p.hooks.onAllyStruck;
          if (hook) hook(mate, { ally: this, amount, attacker, battle });
        }
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
    // One gate for every kind of mending there is, because every kind
    // of mending already comes through this method.
    if (this.healBlocked()) return 0;
    // A `healTakenAdd` hook widens what this unit gets OUT of a mend,
    // wherever the mend came from (Bo's pouch -- everything that goes
    // in him goes further). Distinct from healBoostAdd, which widens
    // what its owner hands OUT; this one is read on the patient.
    let taken = amount;
    for (const p of this.hookSources()) {
      if (p.hooks && p.hooks.healTakenAdd) taken *= 1 + p.hooks.healTakenAdd;
    }
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + Math.round(taken));
    const healed = this.hp - before;
    if (healed > 0 && typeof Meter !== 'undefined') {
      const by = source || this;
      const assists = (opts.assists || []).filter((a) =>
        a.mult > 1 && a.source !== by && a.source.team === by.team);
      if (!assists.length) {
        Meter.healing(by, healed);
      } else {
        // Same rule as a hit: the healer is credited the whole mend and
        // the buffs that multiplied it are booked as facilitation, so
        // the healing column matches what the log said was restored.
        const { shares } = Unit.assistShares(healed, assists);
        Meter.healing(by, healed);
        Unit.assisting = true;
        try {
          for (const s of shares) Meter.facilitated(s.source, s.amount);
        } finally {
          Unit.assisting = false;
        }
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
    // The seal is checked HERE rather than at the ability that casts a
    // buff, because roughly a hundred hook call sites hand out
    // blessings without ever passing through applyEffect. This is the
    // one gate they all share. Heals-over-time, shields and bubbles are
    // not stat buffs and still land.
    if (e.kind === 'buff' && this.buffsSealed()) return false;
    // A `buffExtraTurns` hook on whoever HANDED this out keeps it up
    // longer (Wanda's call carries). The sibling of debuffExtraTurns
    // (Vex) and shieldExtraTurns (Peck); the family was missing its
    // friendly member. Read off the source rather than the recipient,
    // because it is the caller's blessing, not the receiver's luck.
    if (e.kind === 'buff' && e.turns > 0) {
      const from = e.source || Unit.hookOwner;
      // Including a blessing she puts on herself: it is still hers.
      if (from && from.hookSources) {
        for (const p of from.hookSources()) {
          if (p.hooks && p.hooks.buffExtraTurns) e.turns += p.hooks.buffExtraTurns;
        }
      }
    }
    // Effects a passive or positional hook puts on SOMEONE ELSE belong to
    // the hook's owner. Abilities pass `source` explicitly; the ~150 hook
    // call sites in the data files do not, and without this every rally
    // and every armour break they hand out is anonymous.
    if (e.source === undefined && Unit.hookOwner && Unit.hookOwner !== this) {
      e.source = Unit.hookOwner;
    }
    // Incoming-damage reductions from the SAME caster refresh rather
    // than stack. damageTakenBreakdown multiplies every damageTaken
    // status it finds, and a ward whose duration outruns its own
    // cooldown always overlaps itself -- Talon's Snub the Cable (3
    // turns, 2-turn cooldown) reached four stacks and 87.5% prevented,
    // which is not a number any card offers. Two DIFFERENT casters
    // still stack: that is two heroes protecting one body, and it
    // should be worth more than one.
    if (e.kind === 'buff' && e.stat === 'damageTaken' && typeof e.mult === 'number') {
      const held = this.statusEffects.find((fx) => fx.kind === 'buff' &&
        fx.stat === 'damageTaken' && fx.source === e.source);
      if (held) {
        held.turns = Math.max(held.turns, e.turns);
        held.mult = Math.min(held.mult, e.mult); // keep the deeper cover
        return true;
      }
    }
    this.statusEffects.push(e);
    // A hostile status landing rings through the victim's OWN side:
    // passives that answer their team's misfortune (Ilyra's Kindly
    // Hours) hear it here, which is the one place every debuff passes
    // through — ability, passive hook or set bonus alike. The guard
    // keeps a hook that answers by applying another status from
    // setting itself off.
    // A blessing landing rings through the receiver's OWN side, so a
    // passive that answers the team being buffed (Evelune's chord)
    // hears it here -- the one place every buff passes through,
    // ability and hook alike. The ring is guarded, so a hook that
    // answers by applying another buff cannot set itself off, and a
    // spread copy never spreads again.
    if (e.kind === 'buff' && !Unit.buffRinging) {
      const bb = typeof Battle !== 'undefined' ? Battle.active : null;
      if (bb) {
        Unit.buffRinging = true;
        try {
          for (const ally of bb.livingUnits(this.team)) {
            for (const p of (ally.hookSources ? ally.hookSources() : [])) {
              const hook = p.hooks && p.hooks.onAllyBuffed;
              if (hook) hook(ally, { receiver: this, effect: e, battle: bb });
            }
          }
        } finally { Unit.buffRinging = false; }
      }
    }
    if ((e.kind !== 'debuff' && e.kind !== 'dot') || Unit.debuffRinging) return true;
    const battle = typeof Battle !== 'undefined' ? Battle.active : null;
    if (!battle) return true;
    Unit.debuffRinging = true;
    try {
      for (const ally of battle.livingUnits(this.team)) {
        for (const p of (ally.hookSources ? ally.hookSources() : [])) {
          const hook = p.hooks && p.hooks.onAllyDebuffed;
          if (hook) hook(ally, { victim: this, effect: e, battle });
        }
      }
    } finally { Unit.debuffRinging = false; }
    return true;
  }

  tickStatusEffects() {
    for (const fx of this.statusEffects) fx.turns--;
    this.statusEffects = this.statusEffects.filter((fx) => fx.turns > 0);
  }

  // ---- Turns / cooldowns -------------------------------------------------

  readyAbilities() {
    // `requires` names a status stat the caster must carry (Silas's
    // Lumen Arrow fires only from Aiming Stance).
    return this.abilities.filter((a) => a.cooldownRemaining === 0 &&
      (!a.def.requires ||
        this.statusEffects.some((fx) => fx.stat === a.def.requires)) &&
      !this.blockedByOwnStatus(a.def));
  }

  // The inverse of `requires`: `blockedWhile` names a status this unit
  // has put on someone ELSE, and the ability stays unavailable for as
  // long as anyone alive is still wearing it. Lysandra cannot throw a
  // second thread while the first is still tied to something living.
  blockedByOwnStatus(abilityDef) {
    const stat = abilityDef && abilityDef.blockedWhile;
    if (!stat) return false;
    const b = typeof Battle !== 'undefined' ? Battle.active : null;
    if (!b) return false;
    return b.livingUnits().some((u) => u !== this &&
      u.statusEffects.some((fx) => fx.stat === stat && fx.source === this));
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
      // Oilslicked (the Firetroupe's mark): burns tick for DOUBLE on an
      // oiled target. Checked at tick time, so a slick applied after
      // the burn still feeds it.
      const tick = (fx.flavor === 'burn' && this.oiled()) ? fx.amount * 2 : fx.amount;
      const dealt = (typeof Abilities !== 'undefined' && fx.source)
        // The tick's size was locked in when the poison was cast, so
        // whatever buffs the caster carries NOW did not buy it: no assist
        // split on this one.
        ? Abilities.strike(fx.source, this, tick,
            { dodge: false, reflect: false, assist: false, redirect: false }).amount
        : this.takeDamage(tick); // sourceless tick: nobody to credit
      // strike() books the meter itself; crediting it again here would
      // count every tick twice.
      const burn = fx.flavor === 'burn';
      // Fire tells the other side something: units opposing the burn
      // victim may answer each tick (Cleo reads the flames and heals).
      if (burn && battle) {
        for (const watcher of battle.livingUnits(
          this.team === TEAM.PLAYER ? TEAM.ENEMY : TEAM.PLAYER)) {
          for (const p of watcher.hookSources()) {
            const hook = p.hooks && p.hooks.onEnemyBurnTick;
            if (hook) hook(watcher, { victim: this, amount: dealt, battle });
          }
        }
      }
      results.push({
        label: burn ? 'Burn' : 'Poison',
        message: `${this.name} ${burn ? 'burns for' : 'suffers'} ${dealt}` +
          ` ${burn ? 'fire' : 'poison'} damage.` +
          (this.alive ? '' : ` ${this.name} succumbs!`),
        floats: [{ target: this, text: `-${dealt}`,
          color: burn ? '#ff9a5a' : '#a8e85a' }],
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
  //
  // A laddered ability returns 1 here: its levels buy explicit deltas
  // (see skillBonusFor) rather than a blanket multiplier, and applying
  // both would pay it twice.
  skillPowerFor(abilityDef) {
    if (abilityDef && abilityDef.levelUps) return 1;
    const st = this.abilities.find((a) => a.def === abilityDef);
    return st ? Progression.skillPower(st.level) : 1;
  }

  // The earned rungs for one ability, as a bag of deltas: mult, perMirror,
  // cooldown, debuffChance, debuffPower, duration. Empty for an ability
  // with no ladder, so every consumer can add unconditionally.
  skillBonusFor(abilityDef) {
    if (!abilityDef || !abilityDef.levelUps) return {};
    const st = this.abilities.find((a) => a.def === abilityDef);
    return Progression.skillLadder(abilityDef, st ? st.level : 1);
  }

  // A laddered skill's cooldown after its earned -1 rungs. Never drops
  // a cooldown-free skill into one, and never below 1: a skill 3 that
  // could reach 0 would fire every turn.
  cooldownFor(abilityDef) {
    const base = (abilityDef && abilityDef.cooldown) || 0;
    if (base <= 0) return 0;
    const bonus = this.skillBonusFor(abilityDef).cooldown || 0;
    return Math.max(1, base + bonus);
  }

  useAbility(abilityState) {
    // Cooldown reduction (Wolf set 6pc) shortens every real cooldown.
    const cd = this.cooldownFor(abilityState.def);
    abilityState.cooldownRemaining = cd > 0 ? Math.max(0, cd - this.gearCdr) : 0;
    this.turnMeter = 0;
    // Meter refunds a hook can promise (Tanner's second wind): applied
    // after the reset, so the refund is a head start on the next fill.
    for (const p of this.hookSources()) {
      const hook = p.hooks && p.hooks.meterRefund;
      const refund = hook ? hook(this) : 0;
      // Uncapped for the same reason as every other meter gain: the
      // refund is a head start, and a head start must never subtract.
      if (refund > 0) this.turnMeter += CONFIG.TURN_METER_MAX * refund;
    }
  }
}
