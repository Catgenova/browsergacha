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

  // Meter-drain protection (Artur's Permanent Ink): a living teammate
  // carrying a meterGuard hook voids anything that would push this
  // unit's action bar backwards.
  function meterGuarded(victim) {
    const b = typeof Battle !== 'undefined' ? Battle.active : null;
    if (!b) return false;
    return b.livingUnits(victim.team).some((u) =>
      (u.hookSources ? u.hookSources() : []).some(
        (p) => p.hooks && p.hooks.meterGuard));
  }

  // Debuff landing roll: accuracy (attacker) offsets resistance
  // (defender); the land chance is floored at 15%.
  function debuffLands(caster, target) {
    // A caster may hold a `noResistWhenAfflicted` hook: once the target
    // is already carrying something hostile, nothing else of that
    // caster's is refused (Valere -- you took the first flower, you
    // will take the rest). Checked before the roll rather than folded
    // into accuracy, because it is a rule, not a number.
    for (const p of (caster.hookSources ? caster.hookSources() : [])) {
      if (!(p.hooks && p.hooks.noResistWhenAfflicted)) continue;
      const afflicted = (target.statusEffects || []).some(
        (fx) => fx.kind === 'debuff' || fx.kind === 'dot');
      if (afflicted) return true;
    }
    const resistance = target.debuffResistance ? target.debuffResistance() : 0;
    const accuracy = caster.debuffAccuracy ? caster.debuffAccuracy() : 0;
    // resistPierce: a share of the target's ward the caster reads
    // straight through, taken off BEFORE the contest. Not the same as
    // handing the caster more accuracy: accuracy is subtracted from
    // whatever resistance is left, so a flat +20% and piercing 20% only
    // agree when resistance happens to be 100%. Capped short of 1 like
    // the DEF equivalent, so stacking can never delete a ward outright.
    let pierce = 0;
    for (const p of (caster.hookSources ? caster.hookSources() : [])) {
      if (p.hooks && p.hooks.resistPierce) pierce += p.hooks.resistPierce;
    }
    const seen = resistance * (1 - Math.min(0.9, pierce));
    const chance = Math.max(0.15, 1 - Math.max(0, seen - accuracy));
    return Math.random() < chance;
  }

  // Anything TAKEN from an unwilling target is the same contest: laying
  // a debuff on them, tearing a blessing off them, or draining their
  // turn meter all roll the caster's accuracy against their resistance.
  // Giving something away (a buff, a heal, meter handed to an ally)
  // never rolls — nobody resists a gift.
  const takeLands = debuffLands;

  // Drain turn meter from an unwilling target, honouring both the guard
  // (Artur's Permanent Ink refuses the drain outright) and the
  // resistance contest. `frac` is the positive share of the bar to
  // remove. Exported so the ~dozen passives that reach for an enemy's
  // meter directly all obey the same rule.
  function drainMeter(caster, target, frac, opts = {}) {
    if (!target || !target.alive || !(frac > 0)) return null;
    if (meterGuarded(target)) {
      return { kind: 'meter', target, amount: 0, guarded: true };
    }
    // Application gate, ahead of the guard's cousin the accuracy
    // contest: taking someone's turn away is as hostile as any hex, so
    // it rolls the same 50% base and levels to a certainty the same way.
    // Only effects that AUTHOR a chance are gated -- a passive that
    // drains meter, and every hero not yet swept, behave as before.
    if (opts.chance !== undefined) {
      const odds = Math.min(1, opts.chance + (opts.bonus || 0));
      if (Math.random() >= odds) {
        return { kind: 'meter', target, amount: 0, missed: true };
      }
    }
    if (caster && caster !== target && !takeLands(caster, target)) {
      return { kind: 'meter', target, amount: 0, resisted: true };
    }
    const before = target.turnMeter;
    target.turnMeter = Math.max(0, target.turnMeter - CONFIG.TURN_METER_MAX * frac);
    return { kind: 'meter', target,
      amount: (target.turnMeter - before) / CONFIG.TURN_METER_MAX };
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
    // Blocker (Lin): a planted guard absorbs every enemy hit aimed at a
    // front-row ally, a quarter softer for the stance. DoT ticks pass
    // redirect: false — a poison already in you cannot be bodyguarded.
    if (opts.redirect !== false && caster.team !== target.team &&
        target.slot && target.slot.position === POSITION.FRONT &&
        !target.statusEffects.some((fx) => fx.stat === 'blocker')) {
      const b = typeof Battle !== 'undefined' ? Battle.active : null;
      const guard = b && b.livingUnits(target.team).find((u) =>
        u !== target && u.slot &&
        u.statusEffects.some((fx) => fx.stat === 'blocker'));
      if (guard) {
        target = guard;
        raw *= 0.75;
        opts = { ...opts, dodge: false }; // a planted guard absorbs, never slips
      }
    }
    const dodged = opts.dodge === false
      ? false
      : Math.random() < (target.dodgeChance ? target.dodgeChance() : 0);
    // ignoreDef: a fraction of the target's DEF the blow slips past
    // (Ari's lancing shot) — the curve sees the rest. A caster can also
    // carry armour-blindness of its own through a `defIgnoreAdd` hook
    // (Phil's slop, which does not care what anybody is wearing); that
    // applies to EVERYTHING it throws, on top of whatever the effect
    // already slips past. Capped short of 1 so no amount of stacking
    // ever deletes DEF outright.
    let pen = opts.ignoreDef || 0;
    for (const p of (caster && caster.hookSources ? caster.hookSources() : [])) {
      const add = p.hooks && p.hooks.defIgnoreAdd;
      if (!add) continue;
      // A number for blindness that never varies (Phil's slop does not
      // care what anybody is wearing); a FUNCTION for blindness that
      // reads the target (Cryst's quiver only slips past a frozen one).
      pen += typeof add === 'function' ? (add(caster, target) || 0) : add;
    }
    let dmg = damageFormula(raw,
      target.effectiveStat('def') * (1 - Math.min(0.9, pen)));
    let crit = false;
    if (opts.crit) {
      // Crit shelter (Mavros): a blow can be refused its crit outright.
      // Read on the VICTIM's own hooks AND on every living ally, the way
      // cover is -- an armoured bird shelters somebody else by standing
      // where he stands, so the hook decides for itself who it covers.
      //
      // It short-circuits the roll rather than rolling and discarding:
      // a shelter that consumed randomness would quietly shift every
      // later roll in the fight.
      let proof = false;
      const field = (typeof Battle !== 'undefined' && Battle.active) || null;
      const guards = field && Array.isArray(field.units) &&
        field.units.includes(target)
        ? [target, ...field.livingUnits(target.team)] : [target];
      for (const g of guards) {
        for (const p of (g.hookSources ? g.hookSources() : [])) {
          const hook = p.hooks && p.hooks.critProof;
          if (hook && hook(g, target)) { proof = true; break; }
        }
        if (proof) break;
      }
      if (!proof) {
        // critAdd: a per-hit crit-chance rider (Samuels's knives), on top
        // of whatever the caster's own chance already is.
        const chance = Math.min(1,
          caster.effectiveStat('critChance') + (opts.critAdd || 0));
        crit = Math.random() < chance;
        if (crit) dmg = Math.round(dmg * caster.effectiveStat('critDamage'));
      }
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
    dmg = target.blunt(dmg, { attacker: caster });
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
    // Encore (fire 4pc): a CRIT can land a second time, for half
    // the swing. A real second blow -- it re-enters strike, so the DEF
    // curve, dodge, reflect, wards and a planted blocker all answer it
    // exactly as they answered the first.
    //
    // Two rules keep it from running away. It is guarded like the
    // crystal counter above, so an echo can never echo; and it is thrown
    // with `crit: false`, so the follow-up is a plain blow rather than a
    // second lottery ticket that could roll its way into a third.
    if (crit && dealt > 0 && !Unit.echoing && caster.alive && target.alive &&
        caster.team !== target.team) {
      let chance = 0;
      for (const p of (caster.hookSources ? caster.hookSources() : [])) {
        if (p.hooks && p.hooks.critEcho) chance += p.hooks.critEcho;
      }
      if (chance > 0 && Math.random() < Math.min(1, chance)) {
        Unit.echoing = true;
        let again = null;
        try {
          again = strike(caster, target, raw * 0.5, { ...opts, crit: false });
        } finally {
          Unit.echoing = false;
        }
        const battle = currentBattle ||
          (typeof Battle !== 'undefined' ? Battle.active : null);
        if (battle && again && again.amount > 0) {
          battle.addFloatingText(target, `\u{1F525} ${again.amount}`, '#ff9a4a');
          battle.log(`The fire catches twice — ${target.name} takes another ` +
            `${again.amount}.`, 'log-system');
        }
        return { kind: 'damage', target, amount: dealt, crit,
          echo: again ? again.amount : 0 };
      }
    }
    // Split shaft (Rizzo): a CRIT carries on past the bird it hit and
    // finds the weakest thing still standing. Sibling to the encore
    // above and deliberately the other shape -- the encore hits the SAME
    // target a second time, this one hits a DIFFERENT one, so a kit
    // carrying both is widening rather than doubling.
    //
    // Guarded by the same `Unit.echoing` latch, and thrown with
    // `crit: false`, so a split can never split again.
    if (crit && dealt > 0 && !Unit.echoing && caster.alive &&
        caster.team !== target.team) {
      let share = 0;
      for (const p of (caster.hookSources ? caster.hookSources() : [])) {
        const c = p.hooks && p.hooks.critCarry;
        if (c) share = Math.max(share, typeof c === 'function' ? (c(caster) || 0) : c);
      }
      // The FIELD is Battle.active -- "one battle at a time", per the
      // Battle constructor. `currentBattle` is only this call's
      // convenience and is sticky (it is assigned, never cleared), so it
      // can still be pointing at a fight that finished. That does not
      // matter to the encore above, which uses it for logging alone, but
      // it matters entirely here, where the battle decides WHO gets shot.
      // A rules test caught the split landing on an enemy from a
      // different battle; the containment check below is the guard.
      const battle = (typeof Battle !== 'undefined' && Battle.active) || currentBattle;
      const here = battle && Array.isArray(battle.units) &&
        battle.units.includes(target);
      if (share > 0 && here) {
        const onward = battle.livingUnits(target.team)
          .filter((u) => u !== target)
          .sort((a, b) => a.hp - b.hp)[0];
        if (onward) {
          Unit.echoing = true;
          let split = null;
          try {
            split = strike(caster, onward, raw * share, { ...opts, crit: false });
          } finally {
            Unit.echoing = false;
          }
          if (split && split.amount > 0) {
            battle.addFloatingText(onward, `\u27a4 ${split.amount}`, '#ffd76a');
            battle.log(`The shaft splits — ${onward.name} takes ${split.amount}.`,
              'log-system');
          }
          return { kind: 'damage', target, amount: dealt, crit,
            split: split ? split.amount : 0 };
        }
      }
    }
    return { kind: 'damage', target, amount: dealt, crit };
  }

  // The battle the current execute() is resolving in, for effects that
  // fire deeper in the pipeline than the battle reference travels.
  let currentBattle = null;
  // The ability being resolved, for hooks that fire deeper in the
  // pipeline than the ability reference travels. A passive that only
  // pays out on ONE of its hero's skills (Noctelle's Moth Dust) reads
  // this rather than every skill having to carry a rider.
  let currentAbility = null;
  // How many units the current cast is landing on. A storm is worse in
  // a crowd: `perTarget` prices a skill off the size of the group it
  // catches, which is the whole reason a sweep-first sect exists.
  // Distinct from perDeath (bodies already down) and perMirror (charges
  // the caster is holding) -- this one counts who is being hit RIGHT
  // NOW, and is 1 for an ordinary single-target strike.
  let currentTargetCount = 1;

  // A blessing entered into the record cannot be torn out of it: a buff
  // whose SOURCE carries an `unstrippableBuffs` hook (Orri) survives
  // both a strip and a steal. Read off the source rather than the
  // wearer, because it is the archivist's note that protects it and not
  // the bird carrying it.
  function pinned(fx) {
    const from = fx && fx.source;
    if (!from || !from.hookSources) return false;
    return from.hookSources().some((p) => p.hooks && p.hooks.unstrippableBuffs);
  }

  // How many enemies of `caster` are currently burning. The Phoenix
  // Court prices its blessings off this: their damage dealers light the
  // fires and their court cashes them, so the two halves of the sect
  // have to be played together to be worth anything. The mirror of the
  // Gulldiggers' perTarget -- same shape of idea, a different thing
  // counted.
  function firesLit(caster) {
    const b = currentBattle ||
      (typeof Battle !== 'undefined' ? Battle.active : null);
    if (!b || !caster.enemyTeam) return 0;
    return b.livingUnits(caster.enemyTeam()).filter(
      (u) => u.burning && u.burning()).length;
  }

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
    // And the same waste, reported to the whole side. `onOverheal` is
    // the HEALER's -- Peck catches what his own pot spills -- and a
    // hero who catches what OTHER people spill needs a different hook
    // rather than a widened one, or Peck would quietly start warding off
    // every mend in the party.
    const field = (typeof Battle !== 'undefined' && Battle.active) || b;
    if (!field || typeof field.livingUnits !== 'function') return;
    for (const ally of field.livingUnits(caster.team)) {
      for (const p of (ally.hookSources ? ally.hookSources() : [])) {
        if (p.hooks && p.hooks.onAllyOverheal) {
          const r = p.hooks.onAllyOverheal(ally, { overflow, target, healer: caster });
          if (r && r.floats && field.addFloatingText) {
            r.floats.forEach((f) => field.addFloatingText(f.target, f.text, f.color));
          }
        }
      }
    }
  }

  // Deadweight (Hollowbone 3pc): a curse laid by these birds drags. The
  // weight is stamped onto the affliction AS IT LANDS rather than read
  // off the field afterwards, and that is the whole reason the tier is
  // affordable: effectiveStat runs on every meter tick and every damage
  // calculation, so a version that scanned the opposing team for a hook
  // would be paid for thousands of times a fight. Unit.effectiveStat
  // reads `speedBite` out of the status loop it was already running.
  //
  // It also lays no second icon, which is the standing rule for this
  // roster -- the drag rides on the curse that is already showing.
  // A hex holder who drinks (Rend's Open Mouth): an affliction landing
  // anywhere on his side is COPIED onto him as well. The original stays
  // where it fell -- this is not a rescue, it is a hero being paid for
  // other people's bad luck -- and it feeds the passive without a cast.
  function sinkAffliction(victim, fx) {
    const b = fieldFor(victim);
    if (!b || typeof b.livingUnits !== 'function') return;
    for (const ally of b.livingUnits(victim.team)) {
      if (ally === victim) continue;
      const drinks = (ally.hookSources ? ally.hookSources() : [])
        .some((p) => p.hooks && p.hooks.afflictionSink);
      if (drinks) ally.addStatusEffect({ ...fx });
    }
  }

  // A plague that gets around (Pox). A curse he lands may take a second
  // bird as well -- a COPY, so the original is untouched, and the copy
  // is never itself spread: the call sites below only ever offer the
  // affliction that was actually cast, so there is no chain to run away
  // with and no latch needed to stop one.
  //
  // Sibling to sinkAffliction above and pointed the other way: that one
  // copies onto the caster's OWN side, this one onto the victim's.
  function spreadAffliction(caster, victim, fx) {
    let chance = 0;
    for (const p of (caster && caster.hookSources ? caster.hookSources() : [])) {
      if (p.hooks && p.hooks.debuffSpread) chance += p.hooks.debuffSpread;
    }
    if (chance <= 0 || Math.random() >= Math.min(1, chance)) return null;
    const b = fieldFor(victim);
    if (!b || typeof b.livingUnits !== 'function') return null;
    const others = b.livingUnits(victim.team).filter((u) => u !== victim);
    if (!others.length) return null;
    const onto = others[Math.floor(Math.random() * others.length)];
    onto.addStatusEffect({ ...fx });
    // Announced from HERE rather than from the result Battle unpacks,
    // and that is not a detail. Battle's handler is a chain of
    // `else if (res.kind === ...)`, so a branch that matched on a
    // `spreadTo` field would swallow the debuff's own line -- the cast
    // would report a plague and never report the hex it was actually
    // casting. The spread is an extra thing that happened, so it says
    // so extra.
    if (b.addFloatingText) b.addFloatingText(onto, '\u2623', '#8ae85a');
    if (b.log) b.log(`It gets around — ${onto.name} catches it too.`, 'log-enemy');
    return onto;
  }

  function deadweight(caster, fx) {
    let bite = 0;
    for (const p of (caster && caster.hookSources ? caster.hookSources() : [])) {
      if (p.hooks && p.hooks.slowPerDebuff) bite += p.hooks.slowPerDebuff;
    }
    if (bite > 0) fx.speedBite = bite;
    return fx;
  }

  // The battle a given unit is actually standing in.
  //
  // `currentBattle` is this call's convenience and it is STICKY -- it is
  // assigned and never cleared -- so it can be pointing at a fight that
  // finished. That does not matter to a log line, and it matters
  // entirely to anything that uses the battle to decide who gets hit,
  // who gets shot or who drinks a curse. Battle.active is the field
  // ("one battle at a time", per the Battle constructor); the
  // containment check is what catches both of them being wrong.
  function fieldFor(unit) {
    const live = (typeof Battle !== 'undefined' && Battle.active) || null;
    if (live && Array.isArray(live.units) && live.units.includes(unit)) return live;
    if (currentBattle && Array.isArray(currentBattle.units) &&
        currentBattle.units.includes(unit)) return currentBattle;
    return live || currentBattle || null;
  }

  // How much of the caster's own side is still on its feet, the caster
  // included. Counts BODIES rather than heroes, so a raised summon is
  // one of them -- which is the whole interlock on Necros: the thing he
  // digs up makes the swing he was already making land harder.
  function livingAllies(caster) {
    const b = fieldFor(caster);
    if (!b || typeof b.livingUnits !== 'function') return 1;
    return b.livingUnits(caster.team).length;
  }

  // ---- Summoning -------------------------------------------------------
  //
  // A hex the raised body can stand on: one with nobody in it, or one
  // holding a corpse. A corpse is CONSUMED -- pulled off the board and
  // out of battle.units -- and that is a real cost rather than flavour,
  // because a bird dragged apart for parts can no longer be raised by
  // Nestora, revived by Emily or brought back by anything else.
  //
  // Searched front-first, because a raised body goes where the body
  // was: in the way.
  function freeHex(battle, team) {
    const slots = battle.slotsFor ? battle.slotsFor(team) : [];
    const order = [POSITION.FRONT, POSITION.CENTER, POSITION.BACK];
    for (const want of order) {
      for (const slot of slots) {
        if (slot.position !== want) continue;
        if (!slot.unit) return { slot, corpse: null };
        if (!slot.unit.alive) return { slot, corpse: slot.unit };
      }
    }
    return null;
  }

  // Build one, seat it, and hand back the body. Its statline is a SHARE
  // of the summoner's rather than numbers of its own, so a summon is
  // worth exactly as much as the bird that raised it and every point of
  // gear and every star on the summoner is spent on it too.
  function raiseBody(caster, def, share, battle) {
    const spot = freeHex(battle, caster.team);
    if (!spot) return null;
    if (spot.corpse) {
      battle.units = battle.units.filter((u) => u !== spot.corpse);
      spot.corpse.slot = null;
    }
    spot.slot.unit = null;
    const body = new Unit(def, caster.team, {
      level: caster.level, stars: def.rarity || 2,
    });
    // The share, applied AFTER construction so the def's own ratios are
    // only ever the shape of the thing and never its size.
    // A `summonHpAdd` hook widens what comes up (Necros's Gravecircle).
    let hpShare = share.hp || 0.5;
    for (const p of (caster.hookSources ? caster.hookSources() : [])) {
      if (p.hooks && p.hooks.summonHpAdd) hpShare *= 1 + p.hooks.summonHpAdd;
    }
    body.maxHp = Math.max(1, Math.round(caster.maxHp * hpShare));
    body.hp = body.maxHp;
    body.baseAtk = Math.max(1, Math.round(caster.effectiveStat('atk') * (share.atk || 0.5)));
    body.baseDef = Math.max(1, Math.round(caster.effectiveStat('def') * (share.def || 0.5)));
    body.speed = Math.max(1, Math.round(caster.effectiveStat('speed') * (share.speed || 1)));
    // Raised, not rested: it joins the order at the back of the queue
    // rather than acting the moment it lands.
    body.turnMeter = 0;
    body.raisedBy = caster;
    battle.placeUnit(body, spot.slot.index);
    // A body that arrives mid-fight still needs something to draw. The
    // sheet is already warm -- battle_screen preloads summon art up
    // front whenever a summoner is fielded -- so this resolves on the
    // spot rather than showing a placeholder for a frame. Guarded for
    // the node suite, which has no sprite pipeline at all.
    if (typeof Sprites !== 'undefined' && typeof AnimationPlayer !== 'undefined') {
      Sprites.getSheet(def).then((sheet) => {
        body.animator = new AnimationPlayer(sheet);
        body.animator.play('idle');
      }).catch(() => {});
    }
    return { body, consumed: spot.corpse };
  }

  // Permanent growth (Nestora's nest). Written onto BASE attack rather
  // than handed out as a blessing, and that is the whole mechanic:
  //
  //   * nothing can strip, steal or dispel it -- Asher, Cleo, Solari and
  //     every enemy strip on the roster read `statusEffects`, and this
  //     is not in there;
  //   * death does not take it -- Unit.revive wipes statusEffects, so a
  //     bird raised by an ordinary buffer comes back with nothing, and
  //     one Nestora raised comes back as itself;
  //   * and it does not expire, which is why it is capped instead.
  //
  // The original base is remembered on first use so the growth compounds
  // against the statline the hero walked in with rather than against
  // itself. Party mods (RACES.applyParty) write base stats the same way
  // and run before any of this, so what is remembered already includes
  // them.
  function raiseAtk(unit, pct, cap) {
    if (!unit || !unit.alive || !(pct > 0)) return 0;
    const held = unit.raisedAtk || 0;
    const add = Math.min(pct, Math.max(0, cap - held));
    if (add <= 0) return 0;
    if (unit.raisedAtkBase === undefined) unit.raisedAtkBase = unit.baseAtk;
    unit.raisedAtk = held + add;
    unit.baseAtk = Math.round(unit.raisedAtkBase * (1 + unit.raisedAtk));
    return add;
  }

  // `power` is the caster's skill-level multiplier for the ability this
  // effect belongs to; it scales damage/heal/poison numbers only.
  function applyEffect(effect, caster, target, power = 1) {
    switch (effect.type) {
      case 'damage':
      case 'damageDef':
      case 'damageHp': {
        // 'damageDef' scales off the caster's DEF instead of ATK (Boar
        // tank-bruiser kits, Toll's bell) and 'damageHp' off the
        // caster's own MAX HP (Franz's bonks); everything downstream is
        // identical, which is the point — a big DEF or HP stat must not
        // be a way around the mitigation curve.
        const scaleStat = effect.type === 'damageDef' ? 'def' : 'atk';
        const scaleBase = effect.type === 'damageHp'
          ? caster.maxHp : caster.effectiveStat(scaleStat);
        // perMirror: extra multiplier per active crystal mirror (Echo).
        // perDeath: extra multiplier per body already on the field this
        // fight, either side (Morrow swings the weight of everyone he
        // has buried). Uncapped on purpose -- it only gets big in a
        // fight that has already gone badly for somebody.
        const bodies = (currentBattle && currentBattle.deaths) ||
          ((typeof Battle !== 'undefined' && Battle.active &&
            Battle.active.deaths) || 0);
        // Ladder rungs (docs/skill-level-process.md) add points to the
        // modifier rather than multiplying it. `perMirror` gets its own
        // rung value because on a mirror-scaled kit the per-mirror term
        // IS the skill — raising only the flat part would make a
        // level-up worth a fraction of what it is worth on anyone else.
        const lad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        // A hit priced off the caster's own max HP takes the SMALL rate:
        // ten points of a health pool is a different order of number
        // from ten points of an attack stat, so it rides the `heal` rung
        // like every other percentage-of-a-pool figure in the game.
        const rate = effect.type === 'damageHp' ? (lad.heal || 0) : (lad.mult || 0);
        // perTarget counts every body BEYOND the first, so a sweep that
        // catches one enemy is worth exactly its printed multiplier and
        // the bonus is purely what the crowd adds.
        const crowd = Math.max(0, currentTargetCount - 1);
        const mult = effect.mult + rate +
          ((effect.perMirror || 0) + (lad.perMirror || 0)) * (caster.mirrors || 0) +
          ((effect.perDeath || 0) + (lad.perDeath || 0)) * bodies +
          ((effect.perTarget || 0) + (lad.perTarget || 0)) * crowd +
          // perAlly: priced off how much of your OWN side is still
          // standing (Necros). Every other crowd term on this line
          // counts the enemy; this one counts the people behind you, and
          // it shrinks as they fall -- which is what makes a summoner's
          // basic attack care whether he has raised anything.
          ((effect.perAlly || 0) + (lad.perAlly || 0)) * livingAllies(caster) +
          // perDebuff: priced off what the CASTER is carrying, not the
          // target. Every other conditional on this line asks what is
          // wrong with the enemy; this one asks what is wrong with you
          // (Rend, whose armour is other people's curses and whose big
          // swing is that armour thrown).
          ((effect.perDebuff || 0) + (lad.perDebuff || 0)) *
            caster.statusEffects.filter(
              (fx) => fx.kind === 'debuff' || fx.kind === 'dot').length;
        const elemMult = Elements.mult(caster.element, target.element);
        let raw = scaleBase * mult * power *
          caster.damageDealtMult(target, currentAbility) * elemMult;
        // Combo hits: multiplied damage against a marked status — by
        // stat (methane fog) or by kind (detonating poisons).
        // Conditional on the CASTER's own state (Javarious at full HP).
        raw *= bonusWhenMult(effect, caster);
        if (effect.bonusVs && target.statusEffects.some((fx) =>
            (effect.bonusVs.stat && fx.stat === effect.bonusVs.stat) ||
            (effect.bonusVs.flavor && fx.flavor === effect.bonusVs.flavor) ||
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
        const hit = { ...strike(caster, target, raw,
          { crit: true, critAdd: effect.critAdd, ignoreDef: effect.ignoreDef }),
          elem: elemMult };
        // `resetOnKill`: a blow that finishes something hands its own
        // cooldown straight back (Shrike's larder). The assassin's chain
        // -- and gated by needing an actual kill at a seven's
        // multiplier, which is a far harder condition than it reads.
        if (effect.resetOnKill && !target.alive && hit.amount > 0) {
          const mine = (caster.abilities || []).find((a) => a.def === currentAbility);
          if (mine) mine.cooldownRemaining = 0;
          hit.reset = true;
        }
        // `healDealt` turns the wound into a mend: a share of the damage
        // ACTUALLY dealt (post-mitigation, post-dodge) is handed to
        // someone on the caster's side. `to` picks who — 'lowest-ally'
        // hunts the ally in the worst shape, 'self' keeps it. A dodged
        // or absorbed hit heals nothing, which is the point.
        if (effect.healDealt && hit.amount > 0) {
          // The share kept is priced off damage, so it takes the small
          // `heal` rate rather than the ATK/DEF one.
          const mends = drainToAllies(
            { ...effect.healDealt,
              frac: (effect.healDealt.frac === undefined ? 1 : effect.healDealt.frac) +
                (lad.heal || 0) },
            caster, hit.amount);
          if (mends.length) return [hit, ...mends];
        }
        return hit;
      }
      case 'heal': {
        const boost = 1 + (caster.healingBoost ? caster.healingBoost(target) : 0);
        // ATK-priced, so it takes the ATK/DEF rate: `mult` points, not
        // the smaller `heal` steps an HP-priced mend uses.
        const hLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        const amount = Math.round(
          caster.effectiveStat('atk') * (effect.mult + (hLad.mult || 0)) * power * boost);
        // ATK-scaled, so an attack buff on the healer multiplied this
        // mend and its granter takes that share of the credit.
        if (target.healBlocked()) return { kind: 'heal', target, amount: 0, blocked: true };
        const healed = target.heal(amount, caster, { assists: caster.healAssists(true) });
        notifyOverheal(caster, amount - healed, target);
        return { kind: 'heal', target, amount: healed };
      }
      case 'healHpPct': {
        // Heal scaled off the CASTER's max HP; optional bigger cut for
        // front-row targets. `targetPct` scales off the TARGET's pool
        // instead (Koe's mime remedy fits whoever receives it).
        const front = target.slot && target.slot.position === POSITION.FRONT;
        // Heal rungs add points to the percentage. HP-priced numbers
        // move in fives, not tens: a percentage of a health pool is a
        // far larger figure than a percentage of an attack stat.
        const healLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        // perTarget cuts both ways. On a sweep it prices the storm off
        // the size of the crowd it catches; on a pot of stew it prices
        // the helping off the number of mouths at the table. Same
        // arithmetic, same sect, opposite side of the field -- and it
        // is the only healing in the game that is BETTER for being
        // shared out rather than thinner.
        const mouths = Math.max(0, currentTargetCount - 1);
        const pct = (front && effect.frontPct ? effect.frontPct
          : (effect.pct ?? effect.targetPct)) + (healLad.heal || 0) +
          ((effect.perTarget || 0) + (healLad.perTarget || 0)) * mouths +
          // A Court mend runs on the same fuel its blessings do.
          ((effect.perBurn || 0) + (healLad.perBurn || 0)) * firesLit(caster);
        const hpBoost = 1 + (caster.healingBoost ? caster.healingBoost(target) : 0);
        const pool = effect.targetPct && !effect.pct ? target.maxHp : caster.maxHp;
        const amount = Math.round(pool * pct * power * hpBoost);
        if (target.healBlocked()) return { kind: 'heal', target, amount: 0, blocked: true };
        const healed = target.heal(amount, caster,
          { assists: caster.healAssists(false) }); // max-HP scaled: gifts only
        notifyOverheal(caster, amount - healed, target);
        return { kind: 'heal', target, amount: healed };
      }
      case 'healPerDot': {
        // Esmerelda's gathering: an ATK-scaled heal that grows with
        // every DoT currently ticking on the ENEMY team — the fires on
        // the field are the medicine.
        const b = currentBattle ||
          (typeof Battle !== 'undefined' ? Battle.active : null);
        const foes = b
          ? b.livingUnits().filter((u) => u.team !== caster.team) : [];
        const count = foes.reduce((n, u) =>
          n + u.statusEffects.filter((fx) => fx.kind === 'dot').length, 0);
        if (count === 0) return { kind: 'heal', target, amount: 0 };
        const boost = 1 + (caster.healingBoost ? caster.healingBoost(target) : 0);
        // ATK-priced per fire, so it takes the ATK rate.
        const pdLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        const amount = Math.round(caster.effectiveStat('atk') *
          (effect.pct + (pdLad.mult || 0)) * count * power * boost);
        const healed = target.heal(amount, caster,
          { assists: caster.healAssists(true) });
        notifyOverheal(caster, amount - healed, target);
        return { kind: 'heal', target, amount: healed };
      }
      case 'hot': {
        // Heal-over-time: fixed amount (locked at cast) at the start of
        // each of the target's turns.
        const hotLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        target.addStatusEffect({
          kind: 'hot',
          amount: Math.round(caster.maxHp * (effect.pct + (hotLad.heal || 0)) * power *
            (1 + (caster.healingBoost ? caster.healingBoost(target) : 0))),
          // A heal-over-time is a friendly effect, so a duration rung
          // lengthens it exactly as it lengthens a buff.
          turns: effect.turns + (hotLad.duration || 0),
          source: caster, // so each tick is credited to whoever cast it
        });
        return { kind: 'hot', target, turns: effect.turns };
      }
      case 'damageHpPct': {
        // Scaled off the caster's max HP rather than a combat stat, and
        // mitigated like everything else — a large HP pool is not a way
        // around the DEF curve any more than a large DEF stat is.
        // HP-priced damage moves in the same small steps an HP-priced
        // heal does, so it takes the `heal` rate rather than `mult`.
        const hpLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        const raw = caster.maxHp * (effect.pct + (hpLad.heal || 0)) * power *
          caster.damageDealtMult(target, currentAbility) *
          Elements.mult(caster.element, target.element);
        return strike(caster, target, raw);
      }
      case 'shield': {
        // A pool that eats damage before HP. Scaled off the caster's ATK
        // like a heal, and boosted by the same healing modifiers -- both
        // are HP the target does not lose.
        //
        // `pct` scales off the caster's own MAX HP instead, the way
        // healHpPct and hot already do, for a caster whose whole kit is
        // priced off her pool rather than her attack (Lenore).
        const boost = 1 + (caster.healingBoost ? caster.healingBoost(target) : 0);
        // A shield is HP the target does not lose, so it takes the rate
        // its own pricing implies: `heal` points on an HP-priced ward,
        // `mult` points on an ATK-priced one. Duration lengthens it.
        const shLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        // A ward shared round the table takes the same crowd bonus a
        // shared pot does.
        const shared = ((effect.perTarget || 0) + (shLad.perTarget || 0)) *
          Math.max(0, currentTargetCount - 1);
        const base = effect.pct !== undefined
          ? caster.maxHp * (effect.pct + (shLad.heal || 0) + shared)
          : caster.effectiveStat('atk') * (effect.mult + (shLad.mult || 0) + shared);
        // A `shieldPowerAdd` hook widens the pot itself (Click's Long
        // Peal), the sibling of shieldExtraTurns below: one hook for how
        // big a ward is, one for how long it lasts.
        let shPower = 1;
        for (const p of (caster.hookSources ? caster.hookSources() : [])) {
          if (p.hooks && p.hooks.shieldPowerAdd) shPower += p.hooks.shieldPowerAdd;
        }
        const amount = Math.round(base * power * boost * shPower);
        // A `shieldExtraTurns` hook (Peck's centre hex) keeps the pot
        // warm a turn longer than the recipe says.
        let shExtra = 0;
        for (const p of (caster.hookSources ? caster.hookSources() : [])) {
          if (p.hooks && p.hooks.shieldExtraTurns) shExtra += p.hooks.shieldExtraTurns;
        }
        const shTurns = effect.turns + (shLad.duration || 0) + shExtra;
        const gained = target.addShield(amount, shTurns, caster);
        return { kind: 'shield', target, amount: gained, turns: shTurns };
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
      case 'raise': {
        // Hand-aimed growth, on the same budget the passive spends from:
        // one cap per bird, however the points get there.
        const rLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        const gained = raiseAtk(target, effect.pct + (rLad.buffPower || 0), effect.cap);
        if (gained <= 0) return { kind: 'raise', target, amount: 0, full: true };
        return { kind: 'raise', target, amount: gained };
      }
      case 'summon': {
        // Two branches, and the second one is the interesting half. With
        // a hex free (empty, or holding a corpse) the body gets up. With
        // the board full there is nowhere to put anything, so the power
        // goes into a living bird instead: a hard attack buff, its guard
        // opened, and 30% of the health it is standing on taken as the
        // price. The magic gets out either way -- that is the hero.
        const b = fieldFor(caster);
        const def = typeof SUMMONS !== 'undefined' ? SUMMONS[effect.id] : null;
        if (!b || !def) return null;
        const raised = raiseBody(caster, def, effect.share || {}, b);
        if (raised) {
          return { kind: 'summon', target: raised.body, consumed: raised.consumed };
        }
        // Nowhere to stand, so the power goes into a living bird. The
        // recipient is CHOSEN here rather than taken from the cast: the
        // skill is `self`-targeted precisely so this branch can pick,
        // because handing the auto-battler a skill that cuts 30% off
        // whoever it fancies is how the most-wounded ally gets picked
        // and killed by their own summoner. It goes to the hardest
        // hitter who is not Necros -- an attack buff wants the biggest
        // attack, and a support taking his own health for his own
        // blessing is not the trade being offered.
        const fb = effect.fallback || {};
        const host = b.livingUnits(caster.team)
          .filter((u) => u !== caster)
          .sort((x, y) => y.effectiveStat('atk') - x.effectiveStat('atk'))[0];
        if (!host) return { kind: 'possess', target: caster, cut: 0, none: true };
        const cut = Math.max(0, Math.round(host.hp * (fb.hpCut || 0)));
        host.addStatusEffect({ kind: 'buff', stat: 'atk',
          mult: fb.atk || 1.4, turns: fb.turns || 3, source: caster });
        host.addStatusEffect({ kind: 'debuff', stat: 'def',
          mult: fb.def || 0.7, turns: fb.turns || 3, source: caster });
        // No clamp, and none is needed: the price is a fraction of
        // CURRENT health, so hp - round(hp * 0.3) leaves at least 70% of
        // whatever was there and cannot reach zero from any starting
        // value. A Math.max(1, ...) was written here first and could not
        // be made to bite, which is the tell that it was decoration.
        // (Aurek's floor is real because his cost is a fraction of MAX
        // health, which a wounded bird can absolutely be killed by.)
        host.hp -= cut;
        return { kind: 'possess', target: host, cut, turns: fb.turns || 3 };
      }
      case 'cleanse': {
        // Strip debuffs (poisons included) from the target — all of
        // them, or only the oldest `count` when the effect names a
        // limit (Leonardo lifts two, not everything).
        const cleanseLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        let left = effect.count
          ? effect.count + (cleanseLad.cleanseCount || 0) : Infinity;
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
        const revLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        // `perDeath` reads what the fight has already cost (Malachar's
        // lantern gives back more the more it has taken in). Written on
        // the effect without this it was a silent no-op -- the card said
        // a number the engine never looked at.
        const bodies = effect.perDeath
          ? ((fieldFor(target) || {}).deaths || 0) : 0;
        target.revive(effect.pct + (revLad.heal || 0) +
          (effect.perDeath || 0) * bodies, caster);
        return { kind: 'revive', target, amount: target.hp };
      }
      case 'turnMeter': {
        // Push the target's action bar by a fraction of max (negative cuts).
        // A cut is refused outright while a meterGuard ally stands
        // (Artur's Permanent Ink).
        if (effect.amount < 0) {
          // Taking meter is a contest; the helper owns the guard and
          // the resistance roll alike. A `meter` rung deepens the drain.
          const mLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
          return drainMeter(caster, target, -effect.amount + (mLad.meter || 0),
            { chance: effect.chance, bonus: mLad.debuffChance || 0 });
        }
        const before = target.turnMeter;
        // No ceiling. Meters overfill past TURN_METER_MAX so that turn
        // order among everyone already at 100% stays concrete, and
        // clamping here made a gift into a punishment: pushing a unit
        // sitting at 140% "up" by 30% used to drop them to 100%.
        const giftLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        // A call is worth more the more of the crew answers it: the
        // sect's crowd bonus, on tempo. Fourth and last place perTarget
        // lands -- damage, mends, wards and now the action bar.
        const answering = ((effect.perTarget || 0) + (giftLad.perTarget || 0)) *
          Math.max(0, currentTargetCount - 1);
        // And a `meterGiftAdd` hook widens what its owner hands out
        // (Wanda's back hex), the way healBoostAdd widens a mend.
        let giftMult = 1;
        for (const p of (caster.hookSources ? caster.hookSources() : [])) {
          if (p.hooks && p.hooks.meterGiftAdd) giftMult += p.hooks.meterGiftAdd;
        }
        target.turnMeter = Math.max(0, target.turnMeter +
          (effect.amount + (giftLad.meter || 0) + answering) *
          giftMult * CONFIG.TURN_METER_MAX);
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
        // `targetHpPct` scales the tick off the VICTIM's max HP instead
        // (Lucian's burn), and `flavor` names the debuff for anything
        // that asks who is burning.
        const dotLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        if (effect.chance !== undefined) {
          const odds = Math.min(1, effect.chance + (dotLad.debuffChance || 0));
          if (Math.random() >= odds) {
            return { kind: 'debuff', target, stat: 'dot', missed: true };
          }
        }
        if (!debuffLands(caster, target)) {
          return { kind: 'debuff', target, stat: 'dot', resisted: true };
        }
        // Fire SPREADS, for a caster who carries a `burnRekindle` hook
        // (Flurry): setting a burn on something already alight lays
        // that many EXTRA fires beside it rather than one. Extra
        // plates, not extra turns -- a stack of three flames on the
        // nameplate says at a glance that this thing is cooking, where
        // a single flame with a longer invisible fuse says nothing.
        // Every copy ticks in its own right, so the payoff is immediate
        // instead of deferred to the end of a duration.
        let spread = 0;
        if (effect.flavor && target.statusEffects.some(
          (fx) => fx.kind === 'dot' && fx.flavor === effect.flavor)) {
          for (const p of (caster.hookSources ? caster.hookSources() : [])) {
            if (p.hooks && p.hooks.burnRekindle) spread += p.hooks.burnRekindle;
          }
        }
        // Severity rungs deepen the tick. A DoT priced off the victim's
        // pool moves in the same small steps every HP-priced number does.
        const amount = effect.targetHpPct
          ? Math.round(target.maxHp * (effect.targetHpPct + (dotLad.debuffPower || 0)) * power *
              (1 + caster.dotBoost()))
          : Math.round(caster.effectiveStat('atk') * (effect.pct + (dotLad.debuffPower || 0)) *
              power * (1 + caster.dotBoost()));
        // Clinging-flame passives can extend inflicted DoT durations.
        let dotTurns = effect.turns;
        for (const p of (caster.hookSources ? caster.hookSources() : caster.passives || [])) {
          if (p.hooks && p.hooks.dotExtraTurns) dotTurns += p.hooks.dotExtraTurns;
        }
        for (let i = 0; i <= spread; i++) {
          // Poisons drag too: a curse is a curse whether it is a stat cut
          // or something eating you, and a tier that skipped the DoT
          // half would read as a bug to anybody playing a poison kit.
          target.addStatusEffect(deadweight(caster, { kind: 'dot', amount,
            turns: dotTurns, flavor: effect.flavor || null, source: caster }));
          // Poisons are drunk too. The first pass sank stat cuts and not
          // these, which left Rend's mouth inconsistent with his own
          // passive and his own cooldown -- both of which count a
          // poison as a curse -- and in a dark meta that is most of what
          // is being thrown.
          const laid = { kind: 'dot', amount, turns: dotTurns,
            flavor: effect.flavor || null, source: caster };
          sinkAffliction(target, laid);
          spreadAffliction(caster, target, laid);
        }
        // A caster with `dotBitesOnApply` (Flurry) lights fires that
        // take AT ONCE: every fresh plate pays one tick the moment it
        // lands instead of waiting for the victim's turn to come round.
        // Deliberately a DIFFERENT axis from the Court's tiers, which
        // buy fires, tick size and duration -- this front-loads what is
        // already there, so it adds rather than multiplying into them.
        //
        // Through the same pipe a tick uses, oil doubling included: you
        // cannot dodge a poison already in you, and there is no
        // incoming blow to reflect.
        let bites = false;
        for (const p of (caster.hookSources ? caster.hookSources() : [])) {
          if (p.hooks && p.hooks.dotBitesOnApply) bites = true;
        }
        if (bites) {
          const oiled = effect.flavor === 'burn' && target.oiled && target.oiled();
          const bite = oiled ? amount * 2 : amount;
          for (let i = 0; i <= spread && target.alive; i++) {
            strike(caster, target, bite,
              { dodge: false, reflect: false, assist: false, redirect: false });
          }
        }
        // A caster can be paid for the moment something catches
        // (Stoddard hears the smoke go up). Fired on the LANDING only,
        // so a resisted or missed application pays nothing.
        for (const p of (caster.hookSources ? caster.hookSources() : [])) {
          if (p.hooks && p.hooks.onBurnLit) {
            caster.turnMeter += CONFIG.TURN_METER_MAX * p.hooks.onBurnLit;
            if (currentBattle && currentBattle.addFloatingText) {
              currentBattle.addFloatingText(caster, '\u25b2', '#e8903a');
            }
          }
        }
        return { kind: 'dot', target, amount, turns: dotTurns,
          flavor: effect.flavor || null, fires: 1 + spread };
      }
      case 'atkPerDebuff': {
        // Forge heat (Lucian): permanent flat ATK for each enemy
        // carrying the named DoT flavor right now, banked up to a
        // per-battle cap — the fight itself is the fuel.
        const b = currentBattle ||
          (typeof Battle !== 'undefined' ? Battle.active : null);
        const foes = b
          ? b.livingUnits().filter((u) => u.team !== caster.team) : [];
        const count = foes.filter((u) => u.statusEffects.some((fx) =>
          fx.kind === 'dot' && fx.flavor === effect.flavor)).length;
        const banked = caster.forgeBanked || 0;
        // A `per` rung raises how much ATK each burning enemy is worth.
        const forgeLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        const perHead = effect.per + (forgeLad.per || 0);
        const gain = Math.max(0, Math.min(effect.cap - banked, count * perHead));
        if (gain > 0) {
          caster.forgeBanked = banked + gain;
          caster.baseAtk += gain;
        }
        return { kind: 'forge', target: caster, amount: gain, count,
          banked: caster.forgeBanked || 0, cap: effect.cap };
      }
      case 'spendPouch': {
        // Everything Balmor has been given, given back. A per-battle
        // bank on the unit, filled by his own passive off blows he
        // takes and emptied here -- the same shape as Lucian's forge
        // heat, which also lives on the caster and also only means
        // anything alongside the kit that fills it.
        //
        // Thrown as an ordinary blow: it can be dodged, it can be
        // reflected, and the DEF curve answers it. A stored hit is
        // still a hit, unlike a poison already inside somebody.
        // `store` names the property the bank lives on, so a second
        // hero banking a second thing does not need a second case.
        // Defaults to Balmor's bill.
        const store = effect.store || 'pouch';
        const held = Math.round(caster[store] || 0);
        if (held <= 0) return { kind: 'pouch', target, amount: 0, spent: 0 };
        caster[store] = 0;
        const hit = strike(caster, target, held, {});
        return { kind: 'pouch', target, amount: hit.amount, spent: held };
      }
      case 'bounce': {
        // A ricochet (Lucian): hit, then `chance` to leap to another
        // enemy and hit again, indefinitely. With one enemy standing it
        // bounces back into them. Each hop is a full ordinary strike.
        const b = currentBattle ||
          (typeof Battle !== 'undefined' ? Battle.active : null);
        const results = [];
        let mark = target;
        for (let hops = 0; hops < 30; hops++) { // runaway guard: p(30)≈2e-4
          results.push(applyEffect(
            { type: 'damage', mult: effect.mult }, caster, mark, power));
          if (Math.random() >= (effect.chance ?? 0.75)) break;
          const foes = b
            ? b.livingUnits().filter((u) => u.team !== caster.team)
            : (mark.alive ? [mark] : []);
          if (!foes.length) break;
          const others = foes.filter((u) => u !== mark);
          mark = others.length
            ? others[Math.floor(Math.random() * others.length)] : foes[0];
        }
        return results;
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
        const ladder = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        // Duration rungs extend BUFFS only. An ability can carry a buff
        // and a debuff at once -- Morrow's Wisteria wards himself while
        // taunting the enemy team -- and a blanket rung would silently
        // lengthen the hex as well as the ward. Debuff duration is not
        // one of the four rules; if it ever becomes one it needs to say
        // which half of a mixed skill it lengthens.
        if (effect.type === 'buff' && ladder.duration) turns += ladder.duration;
        // Severity rungs move the debuff AWAY FROM NEUTRAL, so the same
        // rung reads correctly on a reduction and an amplification
        // alike: a -30% DEF break (mult 0.70) deepens to 0.65, while a
        // +30% damage-taken mark (mult 1.30) rises to 1.35.
        let mult = effect.mult;
        // A `debuffPowerAdd` hook deepens every hex its owner lands, the
        // way the rung deepens one skill (Hollowbone's Rigor, which
        // prices the depth off speed). Same arithmetic, same direction,
        // one number: severity always moves AWAY from neutral.
        let severity = ladder.debuffPower || 0;
        if (effect.type === 'debuff') {
          for (const p of (caster.hookSources ? caster.hookSources() : [])) {
            const add = p.hooks && p.hooks.debuffPowerAdd;
            if (add) severity += typeof add === 'function' ? (add(caster, target) || 0) : add;
          }
        }
        if (severity > 0 && typeof mult === 'number' && effect.type === 'debuff') {
          mult = mult < 1 ? Math.max(0, mult - severity) : mult + severity;
        }
        if (effect.type === 'debuff') {
          // Base application chance (docs/skill-level-process.md): a
          // separate gate rolled BEFORE the accuracy-versus-resistance
          // contest, so a swept debuff is a coin flip at level 1 and a
          // certainty once its chance rungs are bought. Effects with no
          // `chance` are unswept and always attempt, as they always did.
          if (effect.chance !== undefined) {
            const odds = Math.min(1, effect.chance + (ladder.debuffChance || 0));
            if (Math.random() >= odds) {
              return { kind: 'debuff', target, stat: effect.stat, missed: true };
            }
          }
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
        // Buff severity rungs, mirroring debuffPower: `mult` moves away
        // from 1, and an `add`-style grant (Eli's flat crit chance) takes
        // the points straight on.
        let addAmt = effect.add;
        // A `buffPowerAdd` hook on the caster (Polo's chart table) is
        // the same points from a different place -- the blessing
        // equivalent of healBoostAdd -- so it is folded in here and
        // moved away from neutral by exactly the rule above.
        let deepen = ladder.buffPower || 0;
        if (effect.type === 'buff') {
          for (const p of (caster.hookSources ? caster.hookSources() : [])) {
            const add = p.hooks && p.hooks.buffPowerAdd;
            if (!add) continue;
            // A number for a blessing that is worth the same to
            // everybody (Polo's chart table); a FUNCTION for one that
            // reads WHO IS RECEIVING it (Kiri's hover is worth more to
            // a fast wing). The same two shapes defIgnoreAdd takes, for
            // the same reason.
            deepen += typeof add === 'function' ? (add(caster, target) || 0) : add;
          }
          // perBurn: the Phoenix Court's blessing is worth more for
          // every fire already lit on the other side.
          const perBurn = (effect.perBurn || 0) + (ladder.perBurn || 0);
          if (perBurn) deepen += perBurn * firesLit(caster);
          for (const p of (caster.hookSources ? caster.hookSources() : [])) {
            if (p.hooks && p.hooks.perBurnAdd) {
              deepen += p.hooks.perBurnAdd * firesLit(caster);
            }
          }
        }
        if (effect.type === 'buff' && deepen) {
          if (typeof mult === 'number') {
            mult = mult < 1 ? Math.max(0, mult - deepen) : mult + deepen;
          }
          if (typeof addAmt === 'number') {
            addAmt = addAmt < 0 ? addAmt - deepen : addAmt + deepen;
          }
        }
        if (effect.type === 'buff' && target.buffsSealed()) {
          return { kind: 'buff', target, stat: effect.stat, sealed: true };
        }
        // ONE object, stamped once, used by all three of the things that
        // want it. The first pass built a second `laid` for the copies
        // and it never went through deadweight, so a curse that spread
        // dragged a victim's speed once however many copies of it they
        // were wearing -- a browser probe caught three hexes on one bird
        // slowing it by exactly one hex's worth.
        const laid = deadweight(effect.type === 'debuff' ? caster : null, {
          kind: effect.type,
          stat: effect.stat,
          // `mult`, not `effect.mult`: severity rungs have already been
          // folded in above.
          mult,
          // Who granted it. A damageTaken ward is a support's whole
          // contribution, and without this the mitigation it produces is
          // credited to the ally who was not hit.
          source: caster,
          add: addAmt,
          turns,
        });
        target.addStatusEffect(laid);
        if (effect.type === 'debuff') {
          sinkAffliction(target, laid);
          spreadAffliction(caster, target, laid);
        }
        return { kind: effect.type, target, stat: effect.stat, turns };
      }
      case 'freeze': {
        // `chance` gates the roll (default always); the Cryst sect pack
        // sharpens every freeze roll; resistance applies like any
        // debuff inside freeze() itself.
        // A freeze is a chance-gated hostile effect like any other hex,
        // so its gate takes debuffChance rungs too.
        const fLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        if (effect.chance !== undefined &&
            Math.random() >= Math.min(1, effect.chance + (fLad.debuffChance || 0) +
              (caster.synergyFreezeChance || 0))) {
          return null; // no trigger, no log noise
        }
        return freeze(caster, target, effect.turns || 2);
      }
      case 'bubble': {
        // A blue glass sphere around the target: it absorbs one whole
        // incoming hit, pops, and is gone. Recasting refreshes the timer
        // instead of stacking a second sphere.
        const bubLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        const turns = (effect.turns || 2) + (bubLad.duration || 0);
        const held = target.statusEffects.find((fx) => fx.kind === 'bubble');
        if (held) {
          held.turns = turns;
          return { kind: 'bubble', target, turns, refreshed: true };
        }
        target.addStatusEffect({ kind: 'bubble', turns, source: caster });
        return { kind: 'bubble', target, turns };
      }
      case 'stripBuffs': {
        // Tear buffs OFF an enemy — the hostile mirror of cleanse:
        // oldest first, up to `count`. A caster with a stripBurnChance
        // hook (Cleo's Cruel Fortune) may replace each torn buff with a
        // 2-turn burn — the roll is the whole gate, like the sect oil.
        // A rider strip (Tumble's whirl) rolls per target before it
        // reaches for anything.
        const stLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        if (effect.chance !== undefined &&
            Math.random() >= Math.min(1, effect.chance + (stLad.debuffChance || 0))) {
          return { kind: 'stripBuff', target, count: 0, rolled: true };
        }
        // Tearing a blessing off is taking something from an unwilling
        // target, so it answers to accuracy against resistance like any
        // debuff would.
        if (!takeLands(caster, target)) {
          return { kind: 'stripBuff', target, count: 0, resisted: true };
        }
        let left = (effect.count || 1) + (stLad.stripCount || 0);
        let removed = 0;
        target.statusEffects = target.statusEffects.filter((fx) => {
          if (fx.kind !== 'buff' || left <= 0 || pinned(fx)) return true;
          left--; removed++;
          return false;
        });
        if (removed === 0) return { kind: 'stripBuff', target, count: 0 };
        let burnChance = 0;
        for (const p of (caster.hookSources ? caster.hookSources() : [])) {
          if (p.hooks && p.hooks.stripBurnChance) burnChance += p.hooks.stripBurnChance;
        }
        let burned = 0;
        for (let i = 0; i < removed; i++) {
          if (burnChance > 0 && Math.random() < burnChance) {
            target.addStatusEffect({ kind: 'dot', turns: 2, flavor: 'burn',
              amount: Math.round(target.maxHp * 0.03), source: caster });
            burned++;
          }
        }
        // Anyone who profits from tearing buffs off hears about it —
        // Tumble's Chime Tax turns each one into turn meter.
        const prevOwner = Unit.hookOwner;
        Unit.hookOwner = caster;
        try {
          for (const p of (caster.hookSources ? caster.hookSources() : [])) {
            if (p.hooks && p.hooks.onStripBuff) {
              p.hooks.onStripBuff(caster, { count: removed, target });
            }
          }
        } finally { Unit.hookOwner = prevOwner; }
        return { kind: 'stripBuff', target, count: removed, burned };
      }
      case 'transferDebuffs': {
        // The inverse of stealBuffs: every affliction on the CASTER'S
        // OWN SIDE comes off and goes onto one enemy, keeping whatever
        // turns it had left. A taking like any other, so it contests --
        // though by then the target is usually already carrying
        // something, which is exactly when Valere cannot be refused.
        const b = currentBattle ||
          (typeof Battle !== 'undefined' ? Battle.active : null);
        if (!b) return null;
        const mine = b.livingUnits(caster.team);
        const hostile = (fx) => fx.kind === 'debuff' || fx.kind === 'dot';
        const moving = mine.flatMap((ally) => ally.statusEffects.filter(hostile));
        if (moving.length === 0) return { kind: 'transferDebuffs', target, count: 0 };
        // Rolled BEFORE anything is lifted, so a refusal leaves every
        // affliction exactly where it was rather than needing to be put
        // back on the right ally afterwards.
        if (!takeLands(caster, target)) {
          return { kind: 'transferDebuffs', target, count: 0, resisted: true };
        }
        for (const ally of mine) {
          ally.statusEffects = ally.statusEffects.filter((fx) => !hostile(fx));
        }
        for (const fx of moving) {
          // Re-sourced to the man who handed it over: a poison ticking
          // on an enemy must not credit the enemy who first cast it.
          target.addStatusEffect({ ...fx, source: caster });
        }
        return { kind: 'transferDebuffs', target, count: moving.length,
          stats: moving.map((fx) => fx.stat || fx.kind) };
      }
      case 'drawDebuffs': {
        // The other direction. Valere's transferDebuffs takes the
        // party's afflictions and puts them on an ENEMY, which removes
        // them from the fight; this takes them onto the CASTER, which
        // does not. It is a worse trade for anyone but Rend, and that is
        // the point -- on him a curse is armour, so the only hero who
        // wants this is the one who is paid for holding it.
        //
        // No contest roll: nothing is being done TO anybody. He is
        // taking his own side's afflictions off his own side, and a bird
        // volunteering to be poisoned does not get to resist itself.
        const b = fieldFor(caster);
        if (!b) return null;
        const hostile = (fx) => fx.kind === 'debuff' || fx.kind === 'dot';
        const mine = b.livingUnits(caster.team).filter((u) => u !== caster);
        const moving = mine.flatMap((ally) => ally.statusEffects.filter(hostile));
        if (!moving.length) return { kind: 'drawDebuffs', target: caster, count: 0 };
        for (const ally of mine) {
          ally.statusEffects = ally.statusEffects.filter((fx) => !hostile(fx));
        }
        // Carried over WITH whatever they were worth and whatever turns
        // they had left -- including the Deadweight stamped on them by
        // whoever cast them, which is why a Hollowbone mirror is a
        // genuinely strange fight.
        for (const fx of moving) caster.addStatusEffect({ ...fx });
        return { kind: 'drawDebuffs', target: caster, count: moving.length };
      }
      case 'soulBond': {
        // Tie the thread. An ordinary debuff so it cleanses, resists
        // and is read off the plate like anything else hostile -- but
        // it does not expire on a clock: it holds until the target dies
        // or somebody cuts it. Only one at a time; the ability that
        // casts it is gated on that (see Unit.blockedByOwnStatus).
        if (!debuffLands(caster, target)) {
          return { kind: 'debuff', target, stat: 'soulbond', resisted: true };
        }
        target.addStatusEffect({ kind: 'debuff', stat: 'soulbond',
          turns: Infinity, source: caster });
        return { kind: 'soulBond', target };
      }
      case 'cooldownReduce': {
        // Hand an ally their skills back early. The ability being cast
        // is skipped -- a refresh that refreshed itself would never go
        // on cooldown at all -- and a skill already ready is untouched
        // rather than driven negative.
        const cdLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        const by = (effect.turns || 1) + (cdLad.refund || 0);
        let moved = 0;
        for (const a of (target.abilities || [])) {
          if (a.def === currentAbility) continue;
          if (a.cooldownRemaining <= 0) continue;
          const was = a.cooldownRemaining;
          a.cooldownRemaining = Math.max(0, was - by);
          moved += was - a.cooldownRemaining;
        }
        return { kind: 'cooldownReduce', target, turns: by, moved };
      }
      case 'cooldownPush': {
        // The hostile mirror of cooldownReduce, and an axis nothing on
        // the roster has ever touched: allies get their skills back
        // early, and until Crook nobody took an enemy's away. It is not
        // an action-bar drain wearing a different coat -- a drain moves
        // WHEN you act, this moves WHAT you can do when you get there.
        //
        // Gated at the roster-standard 50% every taking is held to, and
        // contested afterwards like any other: pushing a skill out of
        // somebody's reach is done TO them.
        const pushLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        if (effect.chance !== undefined &&
            Math.random() >= Math.min(1, effect.chance + (pushLad.debuffChance || 0))) {
          return { kind: 'cooldownPush', target, turns: 0, rolled: true };
        }
        if (!takeLands(caster, target)) {
          return { kind: 'cooldownPush', target, turns: 0, resisted: true };
        }
        let by = (effect.turns || 1) + (pushLad.refund || 0);
        for (const p of (caster.hookSources ? caster.hookSources() : [])) {
          if (p.hooks && p.hooks.cooldownPushAdd) by += p.hooks.cooldownPushAdd;
        }
        // A skill that is READY is pushed too -- otherwise the effect
        // does nothing at all against a fresh enemy, which is exactly
        // the enemy worth using it on. Capped against the skill's own
        // cooldown so it can never be shelved for longer than a fresh
        // cast of it would take.
        //
        // The cap is also what leaves a slot-one filler alone: its own
        // cooldown is zero, so min(0, anything) is zero and it is never
        // taken. An explicit `if (cap <= 0) continue` was written here
        // first and could not be made to bite, which is the tell.
        let moved = 0;
        for (const a of (target.abilities || [])) {
          const cap = (a.def && a.def.cooldown) || 0;
          const was = a.cooldownRemaining;
          a.cooldownRemaining = Math.min(cap, was + by);
          moved += a.cooldownRemaining - was;
        }
        return { kind: 'cooldownPush', target, turns: by, moved };
      }
      case 'extendBuffs': {
        // Hold the note: every blessing the target is wearing runs
        // longer. Buffs only -- a debuff is somebody else's chord --
        // and it creates nothing, so a target with nothing on stays
        // with nothing on.
        const exLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        const by = (effect.turns || 1) + (exLad.duration || 0);
        let held = 0;
        for (const fx of target.statusEffects) {
          if (fx.kind !== 'buff') continue;
          fx.turns += by;
          held++;
        }
        return { kind: 'extendBuffs', target, turns: by, count: held };
      }
      case 'detonate': {
        // Cash a damage-over-time in for everything it had left: the
        // remaining ticks land at once and the poison is gone. Not a
        // new debuff and not a recolour of one -- the player reads the
        // ordinary poison plate and knows exactly what is about to be
        // spent.
        //
        // EVERY dot on the target goes up, not only the caster's own,
        // so a Firetroupe burn is as good a fuse as Sable's own poison.
        // Ticks are locked in at cast, so the sum is exact: detonating
        // deals precisely what waiting would have.
        const fuses = target.statusEffects.filter((fx) => fx.kind === 'dot');
        if (fuses.length === 0) return null;
        const frac = effect.frac === undefined ? 1 : effect.frac;
        let total = 0, turns = 0;
        for (const fx of fuses) {
          total += fx.amount * Math.max(0, fx.turns) * frac;
          turns += Math.max(0, fx.turns);
        }
        total = Math.round(total);
        target.statusEffects = target.statusEffects.filter((fx) => fx.kind !== 'dot');
        if (total <= 0) return { kind: 'detonate', target, amount: 0, fuses: fuses.length };
        // Through the same pipe a tick uses: you cannot dodge a poison
        // already in you, and there is no incoming blow to reflect.
        const hit = strike(caster, target, total,
          { dodge: false, reflect: false, redirect: false });
        return { kind: 'detonate', target, amount: hit.amount,
          fuses: fuses.length, turns };
      }
      case 'stealBuffs': {
        // Not a strip: the blessing comes OFF them and goes ON him,
        // carrying whatever turns it had left. Oldest first, up to
        // `count`. Taking something from an unwilling target is a
        // contest like any debuff, and a caster whose own buffs are
        // sealed still takes them away — he just cannot wear them.
        // Same admission as a strip: reaching into someone's blessings
        // is taking something from an unwilling target, so it rolls the
        // 50% gate first and the accuracy contest second.
        const thLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        if (effect.chance !== undefined &&
            Math.random() >= Math.min(1, effect.chance + (thLad.debuffChance || 0))) {
          return { kind: 'stealBuff', target, count: 0, missed: true };
        }
        if (!takeLands(caster, target)) {
          return { kind: 'stealBuff', target, count: 0, resisted: true };
        }
        const taken = [];
        let left = (effect.count || 1) + (thLad.stripCount || 0);
        target.statusEffects = target.statusEffects.filter((fx) => {
          if (fx.kind !== 'buff' || left <= 0 || pinned(fx)) return true;
          left--; taken.push(fx);
          return false;
        });
        for (const fx of taken) {
          // Re-sourced to the thief: the numbers it produces from here
          // on are his, not the support's who cast it.
          caster.addStatusEffect({ ...fx, source: caster });
        }
        // A steal is still a removal, so anyone paid for tearing
        // blessings off (Tumble's Chime Tax) is paid for this too.
        const prevOwner = Unit.hookOwner;
        Unit.hookOwner = caster;
        try {
          for (const p of (caster.hookSources ? caster.hookSources() : [])) {
            if (p.hooks && p.hooks.onStripBuff) {
              p.hooks.onStripBuff(caster, { count: taken.length, target });
            }
          }
        } finally { Unit.hookOwner = prevOwner; }
        return { kind: 'stealBuff', target, count: taken.length,
          stats: taken.map((fx) => fx.stat) };
      }
      case 'healBlock': {
        // Cut them off from help. An ordinary debuff, so it cleanses,
        // resists and expires like the rest, and `stat` is a flag
        // rather than a number the way freeze and the seal are.
        const turns = effect.turns || 2;
        const hbLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        if (effect.chance !== undefined &&
            Math.random() >= Math.min(1, effect.chance + (hbLad.debuffChance || 0))) {
          return { kind: 'debuff', target, stat: 'healblock', missed: true };
        }
        if (!debuffLands(caster, target)) {
          return { kind: 'debuff', target, stat: 'healblock', resisted: true };
        }
        const held = target.statusEffects.find(
          (fx) => fx.kind === 'debuff' && fx.stat === 'healblock');
        if (held) {
          held.turns = Math.max(held.turns, turns);
          return { kind: 'healBlock', target, turns: held.turns, refreshed: true };
        }
        spreadAffliction(caster, target,
          { kind: 'debuff', stat: 'healblock', turns, source: caster });
        target.addStatusEffect({ kind: 'debuff', stat: 'healblock', turns,
          source: caster });
        return { kind: 'healBlock', target, turns };
      }
      case 'buffBlock': {
        // Seal the target against every new blessing for a few turns.
        // Written as an ordinary debuff so it cleanses, resists and
        // expires like the rest; `stat` is a flag, not a number, the
        // same way freeze is.
        const turns = effect.turns || 3;
        const bbLad = caster.skillBonusFor ? caster.skillBonusFor(currentAbility) : {};
        if (effect.chance !== undefined &&
            Math.random() >= Math.min(1, effect.chance + (bbLad.debuffChance || 0))) {
          return { kind: 'debuff', target, stat: 'buffblock', missed: true };
        }
        if (!debuffLands(caster, target)) {
          return { kind: 'debuff', target, stat: 'buffblock', resisted: true };
        }
        const held = target.statusEffects.find(
          (fx) => fx.kind === 'debuff' && fx.stat === 'buffblock');
        if (held) {
          held.turns = Math.max(held.turns, turns);
          return { kind: 'buffBlock', target, turns: held.turns, refreshed: true };
        }
        target.addStatusEffect({ kind: 'debuff', stat: 'buffblock', turns,
          source: caster });
        return { kind: 'buffBlock', target, turns };
      }
      case 'swapRank': {
        // Haul a back-line enemy out from behind their wall, and put
        // whoever was covering them in the back. The flower pairs by
        // ROW — every back hex has exactly one front hex level with it
        // — so "the one in front of you" is never ambiguous.
        //
        // The trade is symmetric, so it reads the same whichever end of
        // the row was struck; the middle column has no partner and is
        // left alone.
        const battle = currentBattle;
        if (!battle || !target.slot) return null;
        const here = target.slot;
        if (here.position === POSITION.CENTER) return null;
        const wantFront = here.position === POSITION.BACK;
        const slots = (battle.slotsFor ? battle.slotsFor(target.team) : [])
          .filter((sl) => sl.position ===
            (wantFront ? POSITION.FRONT : POSITION.BACK));
        const partner = slots
          .sort((a, b) => Math.abs(a.y - here.y) - Math.abs(b.y - here.y))[0];
        if (!partner || partner === here) return null;
        const other = battle.units.find(
          (u) => u.slot === partner && u.team === target.team && u.alive);
        // Both halves of the link are repaired: the hexes' occupants and
        // the fighters' hexes, so nothing on the board disagrees.
        here.unit = other || null;
        partner.unit = target;
        target.slot = partner;
        if (other) other.slot = here;
        return { kind: 'swapRank', target, other, toFront: wantFront };
      }
      case 'rotateFormation': {
        // Spin a whole side one hex around its own middle. The six ring
        // hexes are ordered by their angle on SCREEN, so "clockwise"
        // means clockwise as the player sees it — the enemy flower is
        // drawn mirrored, and reading the geometry rather than the slot
        // numbering keeps the spin honest on either side of the field.
        // The middle hex is the pivot and never moves.
        //
        // What it costs the victim is position: front-line bruisers are
        // carried into the back, back-line casters are swung onto the
        // front, and every positional bonus is recomputed from where
        // they land.
        const battle = currentBattle;
        if (!battle) return null;
        const side = effect.side === 'allies' ? caster.team : caster.enemyTeam();
        const slots = (battle.slotsFor ? battle.slotsFor(side) : [])
          .filter((sl) => sl.position !== POSITION.CENTER);
        if (slots.length < 2) return null;
        const cx = slots.reduce((a, sl) => a + sl.x, 0) / slots.length;
        const cy = slots.reduce((a, sl) => a + sl.y, 0) / slots.length;
        // Screen y grows downward, so ascending atan2 IS clockwise.
        const ring = [...slots].sort((a, b) =>
          Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
        if (effect.dir === 'ccw') ring.reverse();
        // Who stands where comes off the unit list rather than the
        // hexes' own back-pointers, so a half-built board (or a corpse
        // still lying in its hex) cannot desync the spin.
        const standing = battle.units.filter((u) => u.slot && u.team === side);
        const riders = ring.map((sl) => standing.find((u) => u.slot === sl) || null);
        if (!riders.some(Boolean)) return null;
        let moved = 0;
        ring.forEach((sl, i) => {
          const rider = riders[(i - 1 + ring.length) % ring.length];
          sl.unit = rider || null;
          if (rider) {
            if (rider.slot !== sl) moved++;
            rider.slot = sl;
          }
        });
        return moved > 0
          ? { kind: 'rotate', target, side, count: moved, dir: effect.dir || 'cw' }
          : null;
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
          // The grab-bag's own `chance` rides on each drawn hex, so the
          // application gate (and its rungs) works here exactly as it
          // does on a named debuff. Without this the gate on the parent
          // effect would be silently ignored.
          const res = applyEffect(
            { type: 'debuff', turns: effect.turns, chance: effect.chance, ...pick },
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

  // Targetings that resolve to a group the moment they are cast, with no
  // click in between. Both the AI (js/battle.js) and the ability bar
  // (js/ui.js) need to know whether such a set is empty before spending
  // a turn on it, and they used to keep separate lists of these names.
  const GROUP_TARGETINGS = ['all-enemies', 'all-allies',
    'front-enemies', 'back-enemies', 'front-and-center-enemies',
    'flank-enemies', 'random-enemy', 'random-enemies',
    'front-allies', 'self-and-wounded-allies', 'lowest-allies'];

  // A sweep aimed at one hex row, and the rows it falls back through.
  // `order[0]` is what the card says it hits; the rest is where it goes
  // when nobody is standing there.
  const ROW_SWEEPS = {
    'back-enemies': { side: 'enemy',
      order: [POSITION.BACK, POSITION.CENTER, POSITION.FRONT] },
    'front-allies': { side: 'ally',
      order: [POSITION.FRONT, POSITION.CENTER, POSITION.BACK] },
  };

  function sweepPool(sweep, caster, battle) {
    return battle.livingUnits(
      sweep.side === 'ally' ? caster.team : caster.enemyTeam());
  }

  // A row sweep whose row is empty collapses onto the next row in from
  // it rather than fizzling: a back-row skill that finds nobody in the
  // back reaches the centre instead, and only stops when the whole side
  // is down. The turn is never wasted, and a sweep stays a sweep --
  // it lands on a ROW, not on one unlucky body. A boss spans every hex,
  // so it satisfies the first row it is checked against.
  function collapseRow(pool, order) {
    for (const position of order) {
      const row = pool.filter((u) => u.isBoss || u.slot.position === position);
      if (row.length > 0) return row;
    }
    return [];
  }

  // Where a row sweep will ACTUALLY land, when that differs from where
  // it is aimed. Null when the printed row is occupied and the two are
  // the same, so a caller only has to speak up when they are not.
  function rowFallback(ability, caster, battle) {
    const sweep = ROW_SWEEPS[ability.targeting];
    if (!sweep) return null;
    const pool = sweepPool(sweep, caster, battle);
    const holds = (p) => pool.some((u) => u.isBoss || u.slot.position === p);
    if (holds(sweep.order[0])) return null;
    const landed = sweep.order.find(holds);
    return landed ? { side: sweep.side, aimed: sweep.order[0], landed } : null;
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
      case 'back-enemies': {
        // Every living unit standing in the named hex row -- and, when
        // nobody is standing there, the next row in (see collapseRow).
        // A boss spans every hex, so it always qualifies.
        const sweep = ROW_SWEEPS[ability.targeting];
        return collapseRow(sweepPool(sweep, caster, battle), sweep.order);
      }
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
      case 'random-enemy':
      case 'random-enemies': {
        // Enemies chosen by the wind rather than by the player — Galen's
        // pinwheel goes where it goes, and Imani's chimes ring for
        // whoever they ring for. `targetCount` names how many DISTINCT
        // enemies to draw (one by default); a thin field simply gets
        // everyone standing.
        const pool = battle.livingUnits(caster.enemyTeam()).slice();
        const want = Math.max(1, ability.targetCount || 1);
        const picked = [];
        while (picked.length < want && pool.length > 0) {
          picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        }
        return picked;
      }
      case 'flank-enemies': {
        // Both outer rows at once — the front line and the back line —
        // leaving whoever holds the middle untouched (Tumble's whirl
        // passes them by). A boss spans every hex, so it always counts;
        // if only the centre is standing, the sweep still finds it.
        const pool = battle.livingUnits(caster.enemyTeam());
        const flanks = pool.filter((u) => u.isBoss ||
          u.slot.position === POSITION.FRONT ||
          u.slot.position === POSITION.BACK);
        return flanks.length > 0 ? flanks : pool;
      }
      case 'front-enemies': {
        // Every living enemy in a front-position hex; if nobody holds
        // the front line, the sweep still catches one random enemy.
        const pool = battle.livingUnits(caster.enemyTeam());
        // A long weapon reaches past the rank it is aimed at. A
        // `reachesCenter` hook (Ike's pike) folds the centre hex into
        // every front sweep its owner casts -- not one named skill, so
        // it is worth exactly as much as the number of front sweeps the
        // hero has, which for a Gulldigger is all of them.
        const reach = (caster.hookSources ? caster.hookSources() : [])
          .some((p) => p.hooks && p.hooks.reachesCenter);
        const front = pool.filter(
          (u) => u.isBoss || u.slot.position === POSITION.FRONT ||
            (reach && u.slot.position === POSITION.CENTER));
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

  // Hand a share of damage dealt back to the caster's side as healing.
  // `spec` is { to, frac }: 'lowest-ally' finds the ally in the worst
  // shape (the caster included — she is an ally), 'self' is the caster.
  // A `drainSelfShare` hook (Noctelle's back-hex Lamplight) adds a
  // SECOND mend to the caster on top, so the drain feeds two people.
  function drainToAllies(spec, caster, dealt) {
    const b = currentBattle ||
      (typeof Battle !== 'undefined' ? Battle.active : null);
    const frac = spec.frac === undefined ? 1 : spec.frac;
    const share = Math.round(dealt * frac);
    if (share <= 0) return [];
    const allies = b ? b.livingUnits(caster.team) : [caster];
    let mark = caster;
    if (spec.to === 'lowest-ally' && allies.length) {
      mark = allies.slice().sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
    }
    const out = [];
    const mend = (who, amount) => {
      if (!who || !who.alive || amount <= 0) return;
      const healed = who.heal(amount, caster, { assists: caster.healAssists(false) });
      notifyOverheal(caster, amount - healed, who);
      out.push({ kind: 'heal', target: who, amount: healed, drained: true });
    };
    mend(mark, share);
    let selfShare = 0;
    for (const p of (caster.hookSources ? caster.hookSources() : [])) {
      if (p.hooks && p.hooks.drainSelfShare) selfShare += p.hooks.drainSelfShare;
    }
    // Already the lowest ally: the hex pays her once, not twice.
    if (selfShare > 0 && mark !== caster) {
      mend(caster, Math.round(dealt * frac * selfShare));
    }
    return out;
  }

  function execute(ability, caster, chosenTarget, battle) {
    // Remembered for effects that fire deeper in the pipeline than the
    // battle reference travels (freeze's team-wide watcher hooks).
    currentBattle = battle || currentBattle;
    const prevAbility = currentAbility;
    currentAbility = ability;
    try {
      return executeInner(ability, caster, chosenTarget, battle);
    } finally { currentAbility = prevAbility; }
  }

  function executeInner(ability, caster, chosenTarget, battle) {
    const targets = resolveTargets(ability, caster, chosenTarget, battle);
    // Skill-level power: +10% per level past 1 on this ability's numbers.
    const power = caster.skillPowerFor ? caster.skillPowerFor(ability) : 1;
    const results = [];
    // The size of the group this cast caught, held for the whole sweep
    // so every victim is priced off the same crowd -- the last bird hit
    // takes the same storm as the first, even if the first one died to
    // it. Saved and restored because a chain-cast (Oak) resolves a
    // second ability inside this one.
    const prevCrowd = currentTargetCount;
    currentTargetCount = Math.max(1, targets.length);
    try {
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
      // A rider is aimed at ONE bird -- the caster -- however wide the
      // sweep that carried it was.
      currentTargetCount = 1;
      for (const effect of ability.selfEffects || []) {
        const res = applyEffect(effect, caster, caster, power);
        if (Array.isArray(res)) results.push(...res);
        else if (res) results.push(res);
      }
    } finally { currentTargetCount = prevCrowd; }
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
          const drained = drainMeter(caster, victim, 0.20);
          if (drained) results.push(drained);
        }
      }
    }
    // A sweep that actually caught a crowd pays the caster's onSweepHit
    // hooks, once per body it landed on (Hallow's Eye of the Storm).
    // Counted per VICTIM rather than per cast, so a storm over seven
    // birds is worth seven times a storm over one -- and a sweep that
    // found a single target is worth nothing at all, which is the whole
    // point of a sect built to fight wide.
    if (targets.length > 1) {
      const sweptSources = (caster.hookSources ? caster.hookSources() : [])
        .filter((p) => p.hooks && p.hooks.onSweepHit);
      if (sweptSources.length > 0) {
        const struck = new Set();
        for (const res of results) {
          if (res.kind === 'damage' && res.amount > 0 && !res.dodged && !res.reflected) {
            struck.add(res.target);
          }
        }
        for (let i = 0; i < struck.size; i++) {
          for (const p of sweptSources) {
            const out = p.hooks.onSweepHit(caster, battle || currentBattle);
            // Only the last one floats: seven identical arrows stacked
            // on one sprite is noise, not information.
            if (out && out.floats && i === struck.size - 1 && currentBattle &&
                currentBattle.addFloatingText) {
              out.floats.forEach(
                (f) => currentBattle.addFloatingText(f.target, f.text, f.color));
            }
          }
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
    // A hook can widen the channel (Posie's back hex makes her bough
    // jump more often), and a kit can raise its own depth rail: hers is
    // meant to run "indefinitely", which in practice means long enough
    // that the rail is never the thing that stops it.
    let chainChance = ability.chain
      ? ability.chain.chance +
        ((caster.skillBonusFor ? caster.skillBonusFor(ability) : {}).chain || 0)
      : 0;
    if (ability.chain) {
      for (const p of (caster.hookSources ? caster.hookSources() : [])) {
        if (p.hooks && p.hooks.chainChanceAdd) chainChance += p.hooks.chainChanceAdd;
      }
    }
    const chainCap = (ability.chain && ability.chain.maxDepth) || 4;
    if (ability.chain && caster.alive && chainDepth < chainCap &&
        Math.random() < chainChance) {
      const next = (caster.def.abilities || []).find((a) => a.id === ability.chain.id);
      // Which way the link points: a healing chain hunts the ally who
      // needs it most, everything else follows the victim it started on.
      const allies = battle ? battle.livingUnits(caster.team) : [];
      const foes = battle
        ? battle.livingUnits().filter((u) => u.team !== caster.team) : [];
      const mark = ability.chain.to === 'lowest-ally'
        ? allies.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]
        : (chosenTarget && chosenTarget.alive
          ? chosenTarget
          : foes[Math.floor(Math.random() * foes.length)]);
      if (next && mark) {
        if (battle && battle.addFloatingText) {
          battle.addFloatingText(caster, `⛓ ${next.name}!`, '#ffd76a');
        }
        if (battle && battle.log) {
          battle.log(`${caster.name}'s ${ability.chain.to === 'lowest-ally'
            ? 'bough swings on' : 'fervor chains'} into ${next.name}!`,
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
    sideOf, needsTarget, takeLands, drainMeter, rowFallback, raiseAtk,
    freeHex, raiseBody, GROUP_TARGETINGS };
})();
