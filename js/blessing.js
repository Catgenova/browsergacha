// Blessing: an instance-level windfall rolled the moment a hero is
// summoned. A Blessed copy (1 in 1,000) carries +20% base stats and a
// silver pulse; a Godtouched copy (1 in 10,000) carries +40% and gold.
// The mark lives on the roster ENTRY, not the character: two copies of
// the same hero can differ, and sacrificing a blessed copy loses it.

const Blessing = (() => {
  const KINDS = {
    blessed: {
      id: 'blessed', name: 'Blessed', mark: 'blessed-mark',
      chance: 1 / 1000, statMult: 1.20,
      color: '#cdd6e4', glow: '215, 226, 245',
      blurb: '+20% HP, ATK and DEF',
    },
    godtouched: {
      id: 'godtouched', name: 'Godtouched', mark: 'godtouched-mark',
      chance: 1 / 10000, statMult: 1.40,
      color: '#ffd76a', glow: '255, 215, 106',
      blurb: '+40% HP, ATK and DEF',
    },
  };

  // The kind's glyph as markup: the tailored SVG mark (see js/icons.js).
  function markHtml(kind) {
    const b = KINDS[kind];
    if (!b) return '';
    return typeof Icons !== 'undefined' ? Icons.svg(b.mark) : '';
  }

  // One roll decides both: the rarer outcome owns the bottom slice of
  // the range so each lands at exactly its advertised odds.
  function roll(rng = Math.random) {
    const r = rng();
    if (r < KINDS.godtouched.chance) return 'godtouched';
    if (r < KINDS.godtouched.chance + KINDS.blessed.chance) return 'blessed';
    return null;
  }

  function of(kind) { return KINDS[kind] || null; }
  function statMult(kind) { return KINDS[kind] ? KINDS[kind].statMult : 1; }

  // The roster-card mark: the kind's SVG glyph in its own colour.
  function iconHtml(kind) {
    const b = KINDS[kind];
    if (!b) return '';
    return `<span class="card-blessing blessing-${b.id}"` +
      ` title="${b.name} — ${b.blurb}">${markHtml(kind)}</span>`;
  }

  return { KINDS, roll, of, statMult, iconHtml, markHtml };
})();
