// Combat AI profiles: how a unit picks what to do and who to do it to.
//
// Every enemy used to think the same way — fire the longest cooldown,
// hit whoever has the least HP left — which made a rat and a dragon
// play identically. A profile changes two decisions:
//
//   pick(candidates, unit, battle)  -> which ability to use
//   focus(enemies, unit, battle)    -> who to point it at
//
// Profiles are assigned by race, with bosses naming their own. The
// player's own heroes on autobattle used to be locked to the balanced
// default; they now fight to the player's own tactics (see TACTICS
// below), which is the difference between autobattle being a way to skip
// a fight and autobattle being a way to play one.

const AI = (() => {
  const byHp = (a, b) => a.hp - b.hp;
  const byHpFrac = (a, b) => a.hp / a.maxHp - b.hp / b.maxHp;
  const longestCd = (a, b) => b.def.cooldown - a.def.cooldown;
  const isDamaging = (a) => a.def.effects.some(
    (e) => e.type === 'damage' || e.type === 'damageDef' ||
      e.type === 'damageHpPct' || e.type === 'dot');

  // Squishiest target: lowest effective HP pool once DEF is accounted
  // for — the one who actually dies soonest, not just the lowest bar.
  const softest = (list) => list.slice().sort((a, b) =>
    (a.hp * (1 + a.effectiveStat('def') / 300)) -
    (b.hp * (1 + b.effectiveStat('def') / 300)))[0];

  // ---- Threat -------------------------------------------------------------
  // Standing in the front rank means being in the way. Without this the
  // front line protected nobody: AI picked the softest target on the
  // board and walked straight past the wall to the healer.
  //
  // A unit that taunts is chosen outright. Otherwise the front rank is
  // strongly preferred, and back-rank units are only reached once the
  // line thins out — so formation is a defensive decision, not decor.
  const FRONT_WEIGHT = 4;
  const BACK_WEIGHT = 1;

  function taunting(list) {
    return list.filter((u) => u.statusEffects &&
      u.statusEffects.some((fx) => fx.stat === 'taunt'));
  }

  // Narrow a candidate list to who is actually reachable, then let the
  // profile choose among them.
  function reachable(list) {
    const taunts = taunting(list);
    if (taunts.length) return taunts;
    const front = list.filter((u) => u.isBoss ||
      (u.slot && u.slot.position === POSITION.FRONT));
    if (front.length === 0) return list;
    // With a line still standing, the back rank is mostly shielded —
    // but never completely: a determined attacker can still get through.
    const back = list.filter((u) => !front.includes(u));
    const roll = Math.random() * (front.length * FRONT_WEIGHT + back.length * BACK_WEIGHT);
    return roll < front.length * FRONT_WEIGHT ? front : (back.length ? back : front);
  }

  const PROFILES = {
    // The old behavior, kept as the baseline.
    balanced: {
      name: 'Balanced',
      pick: (c) => c.slice().sort(longestCd)[0],
      focus: (e) => e.slice().sort(byHp)[0],
    },

    // Rats swarm whoever is already bleeding — they finish things.
    scavenger: {
      name: 'Scavenger',
      pick: (c) => c.slice().sort(longestCd)[0],
      focus: (e) => {
        const wounded = e.filter((u) => u.hp / u.maxHp < 0.6);
        return (wounded.length ? wounded : e).slice().sort(byHp)[0];
      },
    },

    // Birds and cats go over the line for the back rank.
    stooper: {
      name: 'Stooper',
      pick: (c) => c.slice().sort(longestCd)[0],
      focus: (e) => {
        const back = e.filter((u) => !u.isBoss && u.slot &&
          u.slot.position === POSITION.BACK);
        return softest(back.length ? back : e);
      },
    },

    // Minotaurs and boars hit whatever is biggest and in the way.
    bruiser: {
      name: 'Bruiser',
      pick: (c) => {
        // Save the long cooldown for a target worth spending it on.
        const heavy = c.filter((a) => a.def.cooldown >= 4);
        return (heavy.length ? heavy : c).slice().sort(longestCd)[0];
      },
      focus: (e) => {
        const front = e.filter((u) => u.isBoss || (u.slot &&
          u.slot.position === POSITION.FRONT));
        const pool = front.length ? front : e;
        return pool.slice().sort((a, b) => b.maxHp - a.maxHp)[0];
      },
    },

    // Snakes and drakes stack venom, then leave it to work.
    venomous: {
      name: 'Venomous',
      pick: (c, unit, battle) => {
        const enemies = battle.livingUnits(unit.enemyTeam());
        const unpoisoned = enemies.some(
          (u) => !u.statusEffects.some((fx) => fx.kind === 'dot'));
        const poisons = c.filter((a) => a.def.effects.some((e) => e.type === 'dot'));
        if (unpoisoned && poisons.length) return poisons.sort(longestCd)[0];
        return c.slice().sort(longestCd)[0];
      },
      // Spread the venom: prefer someone not already rotting.
      focus: (e) => {
        const clean = e.filter((u) => !u.statusEffects.some((fx) => fx.kind === 'dot'));
        return softest(clean.length ? clean : e);
      },
    },

    // Wolves cut the healers out of the pack first.
    pack: {
      name: 'Pack Hunter',
      pick: (c) => c.slice().sort(longestCd)[0],
      focus: (e) => {
        const healers = e.filter((u) => (u.abilities || []).some((a) =>
          a.def.effects.some((x) => x.type === 'heal' ||
            x.type === 'healHpPct' || x.type === 'hot')));
        return softest(healers.length ? healers : e);
      },
    },

    // Bears wade in and keep themselves standing.
    warden: {
      name: 'Warden',
      pick: (c, unit) => {
        // Mend first when badly hurt, otherwise swing.
        if (unit.hp / unit.maxHp < 0.5) {
          const mends = c.filter((a) => a.def.effects.some((e) =>
            e.type === 'heal' || e.type === 'healHpPct' || e.type === 'hot'));
          if (mends.length) return mends.sort(longestCd)[0];
        }
        return c.slice().sort(longestCd)[0];
      },
      focus: (e) => e.slice().sort(byHp)[0],
    },

    // Bosses spend their big skills the moment they are up, and hunt
    // whoever is holding the party together.
    tyrant: {
      name: 'Tyrant',
      pick: (c) => {
        const damaging = c.filter(isDamaging);
        return (damaging.length ? damaging : c).slice().sort(longestCd)[0];
      },
      focus: (e, unit, battle) => {
        const support = e.filter((u) => (u.abilities || []).some((a) =>
          a.def.effects.some((x) => x.type === 'heal' || x.type === 'healHpPct' ||
            x.type === 'hot' || x.type === 'cleanse' || x.type === 'revive')));
        if (support.length) return softest(support);
        // Otherwise break the biggest damage threat.
        return e.slice().sort((a, b) =>
          b.effectiveStat('atk') - a.effectiveStat('atk'))[0];
      },
    },
  };

  // ---- Player tactics -----------------------------------------------------
  //
  // Autobattle used to borrow the enemy AI's balanced profile, which
  // meant every hero on auto fired its longest cooldown at whoever had
  // the least HP left, forever. These are the three decisions worth
  // handing to the player, and each one maps onto a real branch below.

  const isHealer = (u) => (u.abilities || []).some((a) =>
    a.def.effects.some((x) => x.type === 'heal' || x.type === 'healHpPct' ||
      x.type === 'hot' || x.type === 'revive'));
  const inFront = (u) => u.isBoss || (u.slot && u.slot.position === POSITION.FRONT);

  const FOCUS = {
    lowest: (e) => e.slice().sort(byHp)[0],
    softest: (e) => softest(e),
    healers: (e) => {
      const healers = e.filter(isHealer);
      return softest(healers.length ? healers : e);
    },
    threat: (e) => e.slice().sort((a, b) =>
      b.effectiveStat('atk') - a.effectiveStat('atk'))[0],
    front: (e) => {
      const front = e.filter(inFront);
      return (front.length ? front : e).slice().sort(byHp)[0];
    },
  };

  const TACTICS = {
    target: [
      { id: 'lowest', name: 'Finish the wounded',
        hint: 'Whoever has the least HP left.' },
      { id: 'softest', name: 'Squishiest first',
        hint: 'Lowest effective HP once DEF is counted -- who actually dies soonest.' },
      { id: 'healers', name: 'Healers first',
        hint: 'Cut the supports out before the damage, when the line lets you through.' },
      { id: 'threat', name: 'Biggest attacker',
        hint: 'Break the highest ATK on the board first.' },
      { id: 'front', name: 'Front line first',
        hint: 'Chew through the wall before going looking for the back row.' },
    ],
    skills: [
      { id: 'burst', name: 'Spend skills freely',
        hint: 'Always fire the longest cooldown that is up.' },
      { id: 'boss', name: 'Hold big skills for bosses',
        hint: '4+ turn cooldowns are saved until a boss is on the field.' },
      { id: 'basic', name: 'Basics only',
        hint: 'Never spend a cooldown. Slower, but nothing is wasted on trash.' },
    ],
    support: [
      { id: 'hurt', name: 'Heal below 80%', threshold: 0.8,
        hint: 'Top the party up early.' },
      { id: 'low', name: 'Heal below 50%', threshold: 0.5,
        hint: 'Hold heals until they are worth their full value.' },
      { id: 'always', name: 'Heal whenever it is up', threshold: 1.01,
        hint: 'Overheals and all -- for heal-scaling kits.' },
    ],
  };

  const DEFAULT_TACTICS = { target: 'lowest', skills: 'burst', support: 'hurt' };

  function tactics() {
    const saved = typeof GameState !== 'undefined' ? GameState.tactics : null;
    return { ...DEFAULT_TACTICS, ...(saved || {}) };
  }

  // The HP fraction below which an ally counts as worth healing. Enemies
  // keep the old fixed threshold; only the player's tactics move it.
  function healThreshold(unit) {
    if (!unit || unit.team !== TEAM.PLAYER) return 0.8;
    const id = tactics().support;
    const opt = TACTICS.support.find((o) => o.id === id);
    return opt ? opt.threshold : 0.8;
  }

  // Build the player's profile from the current tactics.
  function playerProfile() {
    const t = tactics();
    const focus = FOCUS[t.target] || FOCUS.lowest;
    return withThreat({
      name: 'Your tactics',
      pick: (candidates, unit, battle) => {
        let pool = candidates;
        if (t.skills === 'basic') {
          const basics = candidates.filter((a) => a.def.cooldown === 0);
          if (basics.length) pool = basics;
        } else if (t.skills === 'boss') {
          const bossHere = battle.livingUnits(unit.enemyTeam()).some((u) => u.isBoss);
          if (!bossHere) {
            const cheap = candidates.filter((a) => a.def.cooldown < 4);
            if (cheap.length) pool = cheap;
          }
        }
        return pool.slice().sort(longestCd)[0];
      },
      focus,
    });
  }

  // Which profile a unit fights with.
  const BY_RACE = {
    rat: 'scavenger', avian: 'stooper', cat: 'stooper',
    minotaur: 'bruiser', boar: 'bruiser', bear: 'warden',
    snake: 'venomous', drake: 'venomous', wolf: 'pack',
    human: 'balanced',
  };

  // Wrap a profile so its target choice respects threat. Profiles that
  // deliberately hunt a role (pack hunters after healers) still get to
  // choose — but only from who they can actually reach.
  function withThreat(profile) {
    if (profile._threatWrapped) return profile;
    const focus = profile.focus;
    const wrapped = {
      ...profile,
      focus: (enemies, unit, battle) => {
        const pool = reachable(enemies);
        return focus(pool, unit, battle) || pool[0];
      },
      _threatWrapped: true,
    };
    return wrapped;
  }

  function profileFor(unit) {
    // The player's heroes fight to the player's tactics on auto.
    if (unit.team === TEAM.PLAYER) return playerProfile();
    if (unit.def && unit.def.ai && PROFILES[unit.def.ai]) {
      return withThreat(PROFILES[unit.def.ai]);
    }
    if (unit.isBoss) return withThreat(PROFILES.tyrant);
    const race = typeof RACES !== 'undefined' ? RACES.of(unit.def) : null;
    return withThreat(PROFILES[BY_RACE[race]] || PROFILES.balanced);
  }

  return { PROFILES, BY_RACE, profileFor, reachable, taunting,
    TACTICS, DEFAULT_TACTICS, tactics, healThreshold, playerProfile };
})();
