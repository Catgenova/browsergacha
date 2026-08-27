// Damage meter: who actually did the work.
//
// Tracks four contributions per hero — damage dealt, healing done,
// damage mitigated (hits dodged, reflected, or blunted by defensive
// effects), and damage facilitated — at two scopes: the current battle,
// and everything since the page was opened.
//
// Damage and healing are GROSS: a hero is credited the whole of every
// hit they land and every point they mend, which is the number the
// battle log prints. Facilitated is the separate ledger for setup —
// the slice of somebody ELSE's swing that an ATK buff, a crit buff, an
// armour break, a damage amplifier or a shove up the action bar bought.
//
// The two ledgers deliberately DOUBLE-COUNT the same damage: it appears
// in full under the hero who swung and again, in part, under each hero
// who made the swing bigger. That is the honest answer to two different
// questions — "who hit it" and "who set it up" — and it is why they are
// separate columns rather than one number split between them. Adding
// Damage and Facilitated together is meaningless; neither column alone
// is misleading.
//
// Recording is centralized here so every path that deals damage or
// heals (abilities, passives, poisons, gear regen) lands in the same
// ledger. Only the player's heroes are tallied; the meter answers
// "how is my team performing", not "what did the rats do".
//
// Healing is booked from exactly one place — Unit.heal()/Unit.revive(),
// crediting their `source` — so callers must pass the healer rather than
// tallying it themselves, or the same HP gets counted twice. A heal with
// no source belongs to whoever received it (self-mending, gear regen).

const Meter = (() => {
  const KINDS = ['damage', 'healing', 'mitigated', 'facilitated'];
  const blank = () => ({ damage: {}, healing: {}, mitigated: {}, facilitated: {} });
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
    // Somebody else's hit or mend, in the part this hero bought.
    facilitated: (unit, amount) => add('facilitated', unit, Math.round(amount)),

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
