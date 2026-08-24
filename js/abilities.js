// Ability resolution. Abilities are data (see js/data/heroes.js); this module
// turns an ability definition + caster + target into concrete effects.
//
// Ability definition shape:
//   {
//     id, name, description,
//     cooldown: N,            // turns; 0 = usable every turn
//     targeting: 'enemy' | 'ally' | 'self' | 'all-enemies' | 'all-allies',
//     effects: [ { type, ... } ],
//     animation: 'attack',    // which animation the caster plays
//   }
//
// Effect types implemented so far:
//   { type: 'damage', mult: 1.0 }         — mult × caster ATK, reduced by DEF
//   { type: 'heal',   mult: 0.5 }         — mult × caster ATK restored
//   { type: 'buff',   stat, mult, turns } — temporary stat multiplier
//   { type: 'debuff', stat, mult, turns } — temporary stat multiplier (< 1)

const Abilities = (() => {
  // Caster-state conditions an effect can key a bonus off, via
  //   { bonusWhen: { state: 'fullHp', mult: 2 } }
  // Named states rather than a predicate, so hero data stays data.
  const CASTER_STATES = {
    fullHp: (u) => u.hp >= u.maxHp,
    hurt: (u) => u.hp < u.maxHp,
    lowHp: (u) => u.hp / u.maxHp < 0.4,
    shielded: (u) => (u.shieldTotal ? u.shieldTotal() : 0) > 0,
  };

  function bonusWhenMult(effect, caster) {
    const cond = effect.bonusWhen;
    if (!cond) return 1;
    const test = CASTER_STATES[cond.state];
    return test && test(caster) ? cond.mult : 1;
  }

  function damageFormula(rawAtk, targetDef) {
    // Simple mitigation curve; keeps damage positive and DEF meaningful.
    const mitigation = targetDef / (targetDef + 300);
    return Math.max(1, Math.round(rawAtk * (1 - mitigation)));
  }

  // Debuff landing roll: accuracy (attacker) offsets resistance
  // (defender); the land chance is floored at 15%.
  function debuffLands(caster, target) {
    const resistance = target.debuffResistance ? target.debuffResistance() : 0;
    const accuracy = caster.debuffAccuracy ? caster.debuffAccuracy() : 0;
    const chance = Math.max(0.15, 1 - Math.max(0, resistance - accuracy));
    return Math.random() < chance;
  }

  // Resolve one effect against one unit. Returns a log-friendly result.
  // ---- The damage pipeline ----------------------------------------------
  // ONE path from a raw figure to HP actually lost, so nothing can score
  // damage by going around the defences. `raw` is the attacker's side of
  // the sum, already multiplied out; everything the defender gets to do
  // about it happens here:
  //
  //   DEF curve -> crit -> dodge -> guard/ward multipliers -> reflect
  //
  // Whatever the number was scaled off — ATK, DEF, max HP, or a passive
  // that just wants to deal 2% of something — it arrives here and is
  // mitigated the same way.
  //
  // The RNG is drawn in a fixed order (dodge, crit, reflect) so a seeded
  // replay stays a replay.
  function strike(caster, target, raw, opts = {}) {
    const dodged = opts.dodge === false
      ? false
      : Math.random() < (target.dodgeChance ? target.dodgeChance() : 0);
    // ignoreDef: a fraction of the target's DEF the blow slips past
    // (Ari's lancing shot) — the curve sees the rest.
    let dmg = damageFormula(raw,
      target.effectiveStat('def') * (1 - (opts.ignoreDef || 0)));
    let crit = false;
    if (opts.crit) {
      crit = Math.random() < caster.effectiveStat('critChance');
      if (crit) dmg = Math.round(dmg * caster.effectiveStat('critDamage'));
    }
    if (dodged) {
      // Credit the dodger with the hit that never landed, then let
      // dodge-reactive passives answer (Oak's riposte).
      target.bookDodge(dmg);
      if (target.dodged) target.dodged(caster);
      return { kind: 'damage', target, amount: 0, dodged: true };
    }
    // Bubble (Tanner): a held breath that eats ONE entire hit, then
    // pops. Checked after the dodge — a hit that never came doesn't pop
    // it — and before everything else: the bubble takes the whole blow.
    const bi = target.statusEffects.findIndex((fx) => fx.kind === 'bubble');
    if (bi !== -1) {
      const fx = target.statusEffects[bi];
      target.statusEffects.splice(bi, 1);
      // The prevented hit is the bubble-blower's mitigation.
      if (typeof Meter !== 'undefined' && Meter.mitigated) {
        Meter.mitigated(fx.source || target, dmg);
      }
      return { kind: 'damage', target, amount: 0, bubbled: true };
    }
    // Defensive multipliers (guard passives, wards, resonance) blunt the
    // hit. blunt() books who prevented what — a ward cast by a support
    // belongs to that support, not to the ally standing behind it.
    dmg = target.blunt(dmg);
    // Reflect (Boar set 6pc / bristle passives): the whole hit bounces
    // back to the attacker instead of landing. Skipped when there is no
    // blow to bounce — a poison already inside you is not incoming.
    if (opts.reflect !== false &&
        target.reflectChance && Math.random() < target.reflectChance()) {
      const bounced = caster.takeDamage(dmg, target);
      target.bookReflect(dmg, bounced);
      return { kind: 'damage', target, amount: 0, reflected: true,
        reflectAmount: bounced };
    }
    const dealt = target.takeDamage(dmg, caster);
    // DEF buffs pushed the target up the mitigation curve; the slice the
    // curve turned away because of them is the buffers' mitigation.
    if (target.defGuardCredit) target.defGuardCredit(dmg);
    // A hit is rarely one hero's work: an ATK buff, a crit buff, a shove
    // up the action bar or an armour break on the target all bought part
    // of it. bookDamage splits the credit and books the remainder here.
    if (opts.assist === false) Meter.damage(caster, dealt);
    else caster.bookDamage(target, dealt, crit);
    // Hooks that answer landing a blow (Javarious builds his shield out
    // of his own damage). After the books, so a hook sees a settled hit.
    if (caster.dealt) caster.dealt(dealt, target);
    // Crystalline (Polarus): striking a hero wearing the crystal is how
    // you catch the cold — 30% chance the attacker freezes. Guarded like
    // retaliation so a frozen counter can never chain into another.
    if (!Unit.retaliating && dealt > 0 && caster.alive &&
        caster.team !== target.team &&
        target.statusEffects.some((fx) => fx.kind === 'buff' && fx.stat === 'crystalline') &&
        Math.random() < 0.30 + (target.synergyFreezeChance || 0)) {
      Unit.retaliating = true;
      try {
        const r = freeze(target, caster);
        const battle = typeof Battle !== 'undefined' ? Battle.active : null;
        if (battle && r && !r.resisted) {
          battle.addFloatingText(caster, '❄ FROZEN', '#8ee8ff', true);
          battle.log(`${caster.name} strikes the crystal and freezes solid for ${r.turns} turns!`, 'log-system');
        }
      } finally {
        Unit.retaliating = false;
      }
    }
    return { kind: 'damage', target, amount: dealt, crit };
  }

  // The battle the current execute() is resolving in, for effects that
  // fire deeper in the pipeline than the battle reference travels.
  let currentBattle = null;

  // Freeze: the ice-flavored stun — the frozen unit loses its turns.
  // One door for every source (Polarus's bolt, the Crystalline counter,
  // his passive) so the resist check and the freezer's onFroze hooks
  // (the Frost Throne's cooldown refund) always run together.
  function freeze(caster, target, turns = 2, battle = null) {
    if (!target.alive) return null;
    if (!debuffLands(caster, target)) {
      return { kind: 'debuff', target, stat: 'freeze', resisted: true };
    }
    target.addStatusEffect({ kind: 'debuff', stat: 'freeze', turns, source: caster });
    for (const p of (caster.hookSources ? caster.hookSources() : [])) {
      if (p.hooks && p.hooks.onFroze) p.hooks.onFroze(caster, target);
    }
    // Team-wide watchers: everyone opposing the frozen unit hears about
    // it, whoever landed the ice (Angelica's tally counts the King's
    // freezes as gladly as her own).
    const b = battle || currentBattle ||
      (typeof Battle !== 'undefined' ? Battle.active : null);
    if (b) {
      for (const u of b.livingUnits()) {
        if (u.team === target.team) continue;
        for (const p of (u.hookSources ? u.hookSources() : [])) {
          if (p.hooks && p.hooks.onEnemyFrozen) p.hooks.onEnemyFrozen(u, target, caster, b);
        }
      }
    }
    return { kind: 'freeze', target, turns };
  }

  // Healing past full is information some heroes act on (Cain turns the
  // overflow into damage). Fired for every direct heal that overshoots,
  // with the battle resolved the same way freeze resolves it.
  function notifyOverheal(caster, overflow, target) {
    if (overflow <= 0) return;
    const b = currentBattle ||
      (typeof Battle !== 'undefined' ? Battle.active : null);
    for (const p of (caster.hookSources ? caster.hookSources() : [])) {
      if (p.hooks && p.hooks.onOverheal) {
        p.hooks.onOverheal(caster, { overflow, target, battle: b });
      }
    }
  }

  // `power` is the caster's skill-level multiplier for the ability this
  // effect belongs to; it scales damage/heal/poison numbers only.
  function applyEffect(effect, caster, target, power = 1) {
    switch (effect.type) {
      case 'damage':
      case 'damageDef': {
        // 'damageDef' scales off the caster's DEF instead of ATK (Boar
        // tank-bruiser kits, Toll's bell); everything downstream is
        // identical, which is the point — a big DEF stat must not be a
        // way around the mitigation curve.
        const scaleStat = effect.type === 'damageDef' ? 'def' : 'atk';
        // perMirror: extra multiplier per active crystal mirror (Echo).
        const mult = effect.mult +
          (effect.perMirror || 0) * (caster.mirrors || 0);
        const elemMult = Elements.mult(caster.element, target.element);
        let raw = caster.effectiveStat(scaleStat) * mult * power *
          caster.damageDealtMult(target) * elemMult;
        // Combo hits: multiplied damage against a marked status — by
        // stat (methane fog) or by kind (detonating poisons).
        // Conditional on the CASTER's own state (Javarious at full HP).
        raw *= bonusWhenMult(effect, caster);
        if (effect.bonusVs && target.statusEffects.some((fx) =>
            (effect.bonusVs.stat && fx.stat === effect.bonusVs.stat) ||
            (effect.bonusVs.kind && fx.kind === effect.bonusVs.kind))) {
          raw *= effect.bonusVs.mult;
        }
        // Conditional on where the TARGET stands (Sawyer hunts the
        // center hex). Position is a battle-grid fact, so this only
        // fires in real formations — bench duels have no hexes.
        if (effect.bonusPosition && target.slot &&
            target.slot.position === effect.bonusPosition.position) {
          raw *= effect.bonusPosition.mult;
        }
        // Flat riders scaled off the TARGET's max HP (Ari): from the
        // effect itself and from targetHpBonus hooks. Added after the
        // multipliers — the rider is a share of the victim, not of the
        // swing — then mitigated like everything else.
        let hpFrac = effect.targetHpPct || 0;
        for (const p of (caster.hookSources ? caster.hookSources() : [])) {
          if (p.hooks && p.hooks.targetHpBonus) hpFrac += p.hooks.targetHpBonus;
        }
        if (hpFrac > 0) raw += target.maxHp * hpFrac;
        return { ...strike(caster, target, raw,
          { crit: true, ignoreDef: effect.ignoreDef }), elem: elemMult };
      }
      case 'heal': {
        const boost = 1 + (caster.healingBoost ? caster.healingBoost() : 0);
        const amount = Math.round(caster.effectiveStat('atk') * effect.mult * power * boost);
        // ATK-scaled, so an attack buff on the healer multiplied this
        // mend and its granter takes that share of the credit.
        const healed = target.heal(amount, caster, { assists: caster.healAssists(true) });
        notifyOverheal(caster, amount - healed, target);
        return { kind: 'heal', target, amount: healed };
      }
      case 'healHpPct': {
        // Heal scaled off the CASTER's max HP; optional bigger cut for
        // front-row targets.
        const front = target.slot && target.slot.position === POSITION.FRONT;
        const pct = front && effect.frontPct ? effect.frontPct : effect.pct;
        const hpBoost = 1 + (caster.healingBoost ? caster.healingBoost() : 0);
        const amount = Math.round(caster.maxHp * pct * power * hpBoost);
        const healed = target.heal(amount, caster,
          { assists: caster.healAssists(false) }); // max-HP scaled: gifts only
        notifyOverheal(caster, amount - healed, target);
        return { kind: 'heal', target, amount: healed };
      }
      case 'hot': {
        // Heal-over-time: fixed amount (locked at cast) at the start of
        // each of the target's turns.
        target.addStatusEffect({
          kind: 'hot',
          amount: Math.round(caster.maxHp * effect.pct * power *
            (1 + (caster.healingBoost ? caster.healingBoost() : 0))),
          turns: effect.turns,
          source: caster, // so each tick is credited to whoever cast it
        });
        return { kind: 'hot', target, turns: effect.turns };
      }
      case 'damageHpPct': {
        // Scaled off the caster's max HP rather than a combat stat, and
        // mitigated like everything else — a large HP pool is not a way
        // around the DEF curve any more than a large DEF stat is.
        const raw = caster.maxHp * effect.pct * power *
          caster.damageDealtMult(target) *
          Elements.mult(caster.element, target.element);
        return strike(caster, target, raw);
      }
      case 'shield': {
        // A pool that eats damage before HP. Scaled off the caster's ATK
        // like a heal, and boosted by the same healing modifiers -- both
        // are HP the target does not lose.
        const boost = 1 + (caster.healingBoost ? caster.healingBoost() : 0);
        const amount = Math.round(caster.effectiveStat('atk') * effect.mult * power * boost);
        const gained = target.addShield(amount, effect.turns, caster);
        return { kind: 'shield', target, amount: gained, turns: effect.turns };
      }
      case 'taunt': {
        // Force attackers onto this unit for a few turns.
        target.addStatusEffect({ kind: 'buff', stat: 'taunt', turns: effect.turns || 2 });
        return { kind: 'taunt', target, turns: effect.turns || 2 };
      }
      case 'mirrors': {
        // Replenish crystal mirrors (clamped to the unit's own maximum).
        const gained = target.addMirrors ? target.addMirrors(effect.count) : 0;
        return { kind: 'mirrors', target, amount: gained };
      }
      case 'cleanse': {
        // Strip debuffs (poisons included) from the target — all of
        // them, or only the oldest `count` when the effect names a
        // limit (Leonardo lifts two, not everything).
        let left = effect.count || Infinity;
        let removed = 0;
        target.statusEffects = target.statusEffects.filter((fx) => {
          if ((fx.kind !== 'debuff' && fx.kind !== 'dot') || left <= 0) return true;
          left--; removed++;
          return false;
        });
        return { kind: 'cleanse', target, count: removed };
      }
      case 'revive': {
        if (target.alive) return null;
        target.revive(effect.pct, caster);
        return { kind: 'revive', target, amount: target.hp };
      }
      case 'turnMeter': {
        // Push the target's action bar by a fraction of max (negative cuts).
        const before = target.turnMeter;
        target.turnMeter = Math.max(0, Math.min(CONFIG.TURN_METER_MAX,
          target.turnMeter + effect.amount * CONFIG.TURN_METER_MAX));
        // Remember who paid for the push, so the turn it buys can credit
        // its damage back (see Unit.outgoingAssists).
        const gained = target.turnMeter - before;
        if (gained > 0 && target !== caster && target.meterGifts) {
          target.meterGifts.push({ source: caster, amount: gained });
        }
        return { kind: 'meter', target, amount: effect.amount };
      }
      case 'dot': {
        // Poison / damage-over-time: locked in at cast off the caster's
        // ATK, amplified by DoT boosts, resisted like any debuff.
        if (!debuffLands(caster, target)) {
          return { kind: 'debuff', target, stat: 'dot', resisted: true };
        }
        const amount = Math.round(caster.effectiveStat('atk') * effect.pct *
          power * (1 + caster.dotBoost()));
        // Clinging-flame passives can extend inflicted DoT durations.
        let dotTurns = effect.turns;
        for (const p of (caster.hookSources ? caster.hookSources() : caster.passives || [])) {
          if (p.hooks && p.hooks.dotExtraTurns) dotTurns += p.hooks.dotExtraTurns;
        }
        target.addStatusEffect({ kind: 'dot', amount, turns: dotTurns, source: caster });
        return { kind: 'dot', target, amount, turns: dotTurns };
      }
      case 'stun': {
        // Stun: the target skips its next turn(s). `chance` gates the
        // roll (default always), then resistance applies like a debuff.
        if (effect.chance !== undefined && Math.random() >= effect.chance) {
          return null; // the stun simply doesn't trigger — no log noise
        }
        if (!debuffLands(caster, target)) {
          return { kind: 'debuff', target, stat: 'stun', resisted: true };
        }
        const turns = effect.turns || 1;
        target.addStatusEffect({ kind: 'debuff', stat: 'stun', turns });
        return { kind: 'stun', target, turns };
      }
      case 'buff':
      case 'debuff': {
        // Debuffs can be resisted (accuracy vs resistance); buffs always
        // land. Debuffer passives can extend applied debuff durations.
        let turns = effect.turns;
        if (effect.type === 'debuff') {
          if (!debuffLands(caster, target)) {
            return { kind: 'debuff', target, stat: effect.stat, resisted: true };
          }
          for (const p of (caster.hookSources ? caster.hookSources() : caster.passives || [])) {
            if (p.hooks && p.hooks.debuffExtraTurns) turns += p.hooks.debuffExtraTurns;
          }
          // Dark resonance 7pc: a coin flip for one more turn of misery.
          if (caster.synergyDebuffExtraChance > 0 &&
              Math.random() < caster.synergyDebuffExtraChance) {
            turns += 1;
          }
        }
        target.addStatusEffect({
          kind: effect.type,
          stat: effect.stat,
          mult: effect.mult,
          // Who granted it. A damageTaken ward is a support's whole
          // contribution, and without this the mitigation it produces is
          // credited to the ally who was not hit.
          source: caster,
          add: effect.add,
          turns,
        });
        return { kind: effect.type, target, stat: effect.stat, turns };
      }
      case 'freeze': {
        // `chance` gates the roll (default always); the Cryst sect pack
        // sharpens every freeze roll; resistance applies like any
        // debuff inside freeze() itself.
        if (effect.chance !== undefined &&
            Math.random() >= effect.chance + (caster.synergyFreezeChance || 0)) {
          return null; // no trigger, no log noise
        }
        return freeze(caster, target, effect.turns || 2);
      }
      case 'bubble': {
        // A blue glass sphere around the target: it absorbs one whole
        // incoming hit, pops, and is gone. Recasting refreshes the timer
        // instead of stacking a second sphere.
        const turns = effect.turns || 2;
        const held = target.statusEffects.find((fx) => fx.kind === 'bubble');
        if (held) {
          held.turns = turns;
          return { kind: 'bubble', target, turns, refreshed: true };
        }
        target.addStatusEffect({ kind: 'bubble', turns, source: caster });
        return { kind: 'bubble', target, turns };
      }
      case 'removeStatus': {
        // Strip every status matching `stat` off the target — Polarus's
        // shatter melting the ice he just profited from.
        const before = target.statusEffects.length;
        target.statusEffects = target.statusEffects.filter((fx) => fx.stat !== effect.stat);
        const count = before - target.statusEffects.length;
        return count > 0 ? { kind: 'removeStatus', target, stat: effect.stat, count } : null;
      }
      case 'randomDebuffs': {
        // A grab-bag hex (Sawyer): draw `count` DIFFERENT debuffs from
        // the standard book, each applied through the normal debuff path
        // so accuracy, resistance and duration extensions all hold.
        const pool = [
          { stat: 'atk', mult: 0.75 },
          { stat: 'def', mult: 0.75 },
          { stat: 'speed', mult: 0.75 },
          { stat: 'critChance', add: -0.15 },
          { stat: 'damageTaken', mult: 1.25 },
        ];
        const count = Math.min(effect.count || 1, pool.length);
        const out = [];
        for (let i = 0; i < count; i++) {
          const pick = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
          const res = applyEffect(
            { type: 'debuff', turns: effect.turns, ...pick },
            caster, target, power);
          if (res) out.push(res);
        }
        return out;
      }
      default:
        console.warn('Unknown effect type', effect.type);
        return null;
    }
  }

  // ---- Who an ability points at -----------------------------------------
  // The UI has to answer two questions before a target exists: which side
  // is this aimed at, and does the player have to pick someone. Both used
  // to be re-derived from hardcoded lists of targeting names in ui.js,
  // which meant a new targeting kind silently pointed at the wrong side.
  const ENEMY_TARGETING = ['enemy', 'enemy-row', 'all-enemies',
    'front-enemies', 'back-enemies', 'front-and-center-enemies'];
  const ALLY_TARGETING = ['ally', 'dead-ally', 'all-allies', 'front-allies',
    'self-and-wounded-allies', 'lowest-allies'];

  // 'enemy' | 'ally' | 'self'
  function sideOf(targeting) {
    if (targeting === 'self') return 'self';
    if (ALLY_TARGETING.includes(targeting)) return 'ally';
    if (ENEMY_TARGETING.includes(targeting)) return 'enemy';
    return 'enemy'; // the default case in resolveTargets is a single enemy
  }

  // Does the player have to click someone, or does it fire on select?
  function needsTarget(targeting) {
    return ['enemy', 'enemy-row', 'ally', 'dead-ally'].includes(targeting);
  }

  // Expand targeting into the concrete list of units affected.
  function resolveTargets(ability, caster, chosenTarget, battle) {
    switch (ability.targeting) {
      case 'self':
        return [caster];
      case 'all-enemies':
        return battle.livingUnits(caster.enemyTeam());
      case 'all-allies':
        return battle.livingUnits(caster.team);
      case 'enemy-row':
        // The chosen enemy plus everyone in its hex row (same y).
        // A boss spans every row, so it is always included.
        if (!chosenTarget) return [];
        return battle.livingUnits(caster.enemyTeam())
          .filter((u) => u.isBoss || Math.abs(u.slot.y - chosenTarget.slot.y) < 2);
      case 'front-allies':
        // Every living ally standing in a front-position hex.
        return battle.livingUnits(caster.team)
          .filter((u) => u.slot.position === POSITION.FRONT);
      case 'lowest-allies': {
        // The `allyCount` most-wounded living allies, the caster
        // included on equal terms — pure triage, no self bias (Cain).
        const n = ability.allyCount || 2;
        return battle.livingUnits(caster.team)
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)
          .slice(0, n);
      }
      case 'self-and-wounded-allies': {
        // The caster plus the `allyCount` most-wounded OTHER allies
        // (lowest HP fraction first) — triage healing.
        const n = ability.allyCount || 2;
        const others = battle.livingUnits(caster.team)
          .filter((u) => u !== caster)
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)
          .slice(0, n);
        return [caster, ...others];
      }
      case 'front-and-center-enemies': {
        // Everyone holding a front or center hex — the wall and its
        // keystone together (Bit's breakthrough). A boss spans every
        // hex; an empty front still catches one random enemy.
        const pool = battle.livingUnits(caster.enemyTeam());
        const wall = pool.filter((u) => u.isBoss ||
          u.slot.position === POSITION.FRONT ||
          u.slot.position === POSITION.CENTER);
        if (wall.length > 0) return wall;
        return pool.length > 0
          ? [pool[Math.floor(Math.random() * pool.length)]] : [];
      }
      case 'back-enemies':
        // Every living enemy standing in a back-position hex (a boss
        // spans every hex, so it always qualifies).
        return battle.livingUnits(caster.enemyTeam())
          .filter((u) => u.isBoss || u.slot.position === POSITION.BACK);
      case 'front-enemies': {
        // Every living enemy in a front-position hex; if nobody holds
        // the front line, the sweep still catches one random enemy.
        const pool = battle.livingUnits(caster.enemyTeam());
        const front = pool.filter(
          (u) => u.isBoss || u.slot.position === POSITION.FRONT);
        if (front.length > 0) return front;
        return pool.length > 0
          ? [pool[Math.floor(Math.random() * pool.length)]]
          : [];
      }
      case 'dead-ally':
        // A chosen fallen teammate (revives).
        return chosenTarget && !chosenTarget.alive ? [chosenTarget] : [];
      case 'ally':
      case 'enemy':
      default:
        return chosenTarget ? [chosenTarget] : [];
    }
  }

  // Chain-cast depth. A kit can loop (Oak's skill 3 chains back into
  // skill 1), so a run of hot rolls is cut off rather than trusted to
  // the dice.
  let chainDepth = 0;

  function execute(ability, caster, chosenTarget, battle) {
    // Remembered for effects that fire deeper in the pipeline than the
    // battle reference travels (freeze's team-wide watcher hooks).
    currentBattle = battle || currentBattle;
    const targets = resolveTargets(ability, caster, chosenTarget, battle);
    // Skill-level power: +10% per level past 1 on this ability's numbers.
    const power = caster.skillPowerFor ? caster.skillPowerFor(ability) : 1;
    const results = [];
    for (const target of targets) {
      for (const effect of ability.effects) {
        const res = applyEffect(effect, caster, target, power);
        // A composite effect (randomDebuffs) reports one result per
        // debuff it landed, so the log narrates each hex separately.
        if (Array.isArray(res)) results.push(...res);
        else if (res) results.push(res);
      }
    }
    // Optional rider effects the ability applies to the caster itself.
    for (const effect of ability.selfEffects || []) {
      const res = applyEffect(effect, caster, caster, power);
      if (Array.isArray(res)) results.push(...res);
      else if (res) results.push(res);
    }
    // Cat set: any damaged target can lose 20% of its turn meter.
    const drainChance = caster.apDrainChance ? caster.apDrainChance() : 0;
    if (drainChance > 0) {
      const damaged = new Set();
      for (const res of results) {
        if (res.kind === 'damage' && res.amount > 0 && !res.dodged &&
            !res.reflected && res.target.alive) {
          damaged.add(res.target);
        }
      }
      for (const victim of damaged) {
        if (Math.random() < drainChance) {
          victim.turnMeter = Math.max(0, victim.turnMeter - CONFIG.TURN_METER_MAX * 0.20);
          results.push({ kind: 'meter', target: victim, amount: -0.20 });
        }
      }
    }
    // Wolf set: single-target damaging attacks can stun the victim.
    const stunChance = caster.stunChance ? caster.stunChance() : 0;
    if (stunChance > 0 && ability.targeting === 'enemy' &&
        ability.effects.some((e) => e.type === 'damage') &&
        chosenTarget && chosenTarget.alive &&
        !chosenTarget.statusEffects.some((fx) => fx.stat === 'stun') &&
        Math.random() < stunChance) {
      if (debuffLands(caster, chosenTarget)) {
        chosenTarget.addStatusEffect({ kind: 'debuff', stat: 'stun', turns: 1 });
        results.push({ kind: 'stun', target: chosenTarget, turns: 1 });
      } else {
        results.push({ kind: 'debuff', target: chosenTarget, stat: 'stun', resisted: true });
      }
    }
    // Aiming stances (Silas). Two rules, both generic to the stat:
    // a stance is SPENT by the damaging cast it empowered — after the
    // whole volley, so every target of a row shot pays double — and a
    // LANDED single-target hit breaks the victim's stance (a volley
    // doesn't, and neither does an arrow they dodged).
    const dealsDamage = ability.effects.some((e) =>
      e.type === 'damage' || e.type === 'damageDef' || e.type === 'damageHpPct');
    if (dealsDamage) {
      const spent = caster.statusEffects.findIndex((fx) => fx.stat === 'aiming');
      if (spent !== -1) caster.statusEffects.splice(spent, 1);
    }
    if (ability.targeting === 'enemy' && chosenTarget && dealsDamage &&
        results.some((r) => r.kind === 'damage' && r.amount > 0 &&
          r.target === chosenTarget && !r.dodged && !r.reflected)) {
      const broke = chosenTarget.statusEffects.findIndex((fx) => fx.stat === 'aiming');
      if (broke !== -1) {
        chosenTarget.statusEffects.splice(broke, 1);
        if (battle && battle.addFloatingText) {
          battle.addFloatingText(chosenTarget, 'AIM BROKEN', '#ff9a5a');
        }
        if (battle && battle.log) {
          battle.log(`The blow knocks ${chosenTarget.name} out of their stance!`, 'log-system');
        }
      }
    }
    // Chain casts: an ability can name a chance to immediately cast
    // another of the caster's abilities as part of the same action — a
    // free cast that touches no cooldown and rides the same animation
    // beat. It follows the same victim while they stand, else finds
    // whoever is left; depth is capped at 4 links.
    if (ability.chain && caster.alive && chainDepth < 4 &&
        Math.random() < ability.chain.chance) {
      const next = (caster.def.abilities || []).find((a) => a.id === ability.chain.id);
      const foes = battle
        ? battle.livingUnits().filter((u) => u.team !== caster.team) : [];
      const mark = chosenTarget && chosenTarget.alive
        ? chosenTarget
        : foes[Math.floor(Math.random() * foes.length)];
      if (next && mark) {
        if (battle && battle.addFloatingText) {
          battle.addFloatingText(caster, `⛓ ${next.name}!`, '#ffd76a');
        }
        if (battle && battle.log) {
          battle.log(`${caster.name}'s fervor chains into ${next.name}!`,
            caster.team === TEAM.PLAYER ? 'log-player' : 'log-enemy');
        }
        chainDepth++;
        try {
          results.push(...execute(next, caster, mark, battle));
        } finally {
          chainDepth--;
        }
      }
    }
    return results;
  }

  // `strike` is exported so passive and positional hooks can deal damage
  // through the same pipeline instead of calling takeDamage directly,
  // which used to skip the DEF curve, dodge, guards, reflect AND the
  // damage meter all at once.
  return { execute, resolveTargets, damageFormula, strike, freeze, applyEffect,
    sideOf, needsTarget };
})();
