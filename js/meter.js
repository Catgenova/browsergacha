// Damage meter: who actually did the work.
//
// Tracks three contributions per hero — damage dealt, healing done, and
// damage mitigated (hits dodged, reflected, or blunted by defensive
// effects) — at two scopes: the current battle, and everything since
// the page was opened.
//
// Recording is centralized here so every path that deals damage or
// heals (abilities, passives, poisons, gear regen) lands in the same
// ledger. Only the player's heroes are tallied; the meter answers
// "how is my team performing", not "what did the rats do".

const Meter = (() => {
  const KINDS = ['damage', 'healing', 'mitigated'];
  const blank = () => ({ damage: {}, healing: {}, mitigated: {} });
  let battle = blank();
  let session = blank();

  function add(kind, unit, amount) {
    if (!unit || !unit.def || amount <= 0) return;
    if (unit.team !== TEAM.PLAYER) return;
    const key = unit.def.id;
    for (const store of [battle, session]) {
      const bucket = store[kind];
      if (!bucket[key]) bucket[key] = { name: unit.name, value: 0 };
      bucket[key].value += amount;
    }
  }

  return {
    KINDS,
    damage: (unit, amount) => add('damage', unit, Math.round(amount)),
    healing: (unit, amount) => add('healing', unit, Math.round(amount)),
    mitigated: (unit, amount) => add('mitigated', unit, Math.round(amount)),

    // A fresh battle clears the battle scope; the session keeps running.
    resetBattle() { battle = blank(); },
    resetSession() { session = blank(); battle = blank(); },

    // Rows for one kind at one scope, biggest first, with each hero's
    // share of the total for the bars.
    rows(kind, scope = 'battle') {
      const store = scope === 'session' ? session : battle;
      const list = Object.entries(store[kind] || {})
        .map(([id, e]) => ({ id, name: e.name, value: e.value }))
        .filter((r) => r.value > 0)
        .sort((a, b) => b.value - a.value);
      const total = list.reduce((s, r) => s + r.value, 0);
      const top = list.length ? list[0].value : 0;
      for (const r of list) {
        r.share = total > 0 ? r.value / total : 0;
        r.bar = top > 0 ? r.value / top : 0;
      }
      return { list, total };
    },
  };
})();
