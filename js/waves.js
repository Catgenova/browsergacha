// Enemy wave composition.
//
// Waves used to be uniform random draws from a location's pool, which
// produced shapeless clumps: five strikers, or five healers, with no
// front line and nothing to prioritize. Now a wave is built to a
// template — a line to break through, threats behind it, sometimes
// support keeping them up — and each enemy is placed where its role
// belongs. That gives the AI profiles and the threat rules something
// to actually work with.

const Waves = (() => {
  // What an enemy is for, read off its kit and statline.
  function roleOf(def) {
    const abilities = def.abilities || [];
    const has = (types) => abilities.some((a) =>
      a.effects.some((e) => types.includes(e.type)));
    if (has(['heal', 'healHpPct', 'hot', 'revive', 'cleanse'])) return 'support';
    if (has(['dot']) || abilities.some((a) => a.effects.some((e) =>
      e.type === 'debuff' || e.type === 'stun'))) return 'controller';
    const s = def.stats || {};
    const bulk = (s.hp || 0) / 10 + (s.def || 0);
    const punch = (s.atk || 0) + (s.speed || 0) / 2;
    return bulk > punch ? 'tank' : 'striker';
  }

  // Wave shapes by size. Roles are requested in order; anything the
  // pool can't supply falls back to whatever is available, so a
  // location full of brawlers still fields a wave.
  function template(count) {
    const shape = ['tank', 'striker', 'striker', 'controller', 'support',
      'striker', 'tank'];
    return shape.slice(0, count);
  }

  // Build a wave of `count` enemies from `pool`, honouring the template
  // and avoiding the same enemy filling the whole line.
  function compose(pool, count) {
    if (!pool.length) return [];
    const byRole = {};
    for (const def of pool) (byRole[roleOf(def)] ||= []).push(def);
    const wanted = template(count);
    const picked = [];
    const take = (list) => list[Math.floor(Math.random() * list.length)];
    for (const role of wanted) {
      // Prefer an unused member of the requested role, then any unused
      // enemy at all, then accept a repeat.
      const candidates = (byRole[role] || []).filter((d) => !picked.includes(d));
      const fallback = pool.filter((d) => !picked.includes(d));
      const from = candidates.length ? candidates : (fallback.length ? fallback : pool);
      picked.push(take(from));
    }
    return picked.map((def) => ({ def, role: roleOf(def) }));
  }

  // Deal a composed wave into formation slots: the line goes in front,
  // support and controllers behind it, strikers wherever is left.
  //
  // `slots` is the enemy formation (index -> { position }). Returns
  // [{ def, slotIndex }].
  function deploy(wave, slots) {
    const order = slots.map((s, i) => ({ i, position: s.position }));
    const front = order.filter((s) => s.position === POSITION.FRONT).map((s) => s.i);
    const center = order.filter((s) => s.position === POSITION.CENTER).map((s) => s.i);
    const back = order.filter((s) => s.position === POSITION.BACK).map((s) => s.i);
    const queues = {
      tank: [...front, ...center, ...back],
      striker: [...front, ...center, ...back],
      controller: [...back, ...center, ...front],
      support: [...back, ...center, ...front],
    };
    const used = new Set();
    const out = [];
    // Tanks claim the line first, then support hides at the back, then
    // everyone else fills in.
    const priority = ['tank', 'support', 'controller', 'striker'];
    for (const role of priority) {
      for (const entry of wave) {
        if (entry.role !== role || entry.placed) continue;
        const slot = queues[role].find((i) => !used.has(i));
        if (slot === undefined) continue;
        used.add(slot);
        entry.placed = true;
        out.push({ def: entry.def, slotIndex: slot });
      }
    }
    // Anything left over (more enemies than matching slots) takes a seat.
    for (const entry of wave) {
      if (entry.placed) continue;
      const slot = [...front, ...center, ...back].find((i) => !used.has(i));
      if (slot === undefined) break;
      used.add(slot);
      out.push({ def: entry.def, slotIndex: slot });
    }
    return out;
  }

  return { roleOf, compose, deploy, template };
})();
