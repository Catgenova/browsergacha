// Attunement: the second axis a hero grows along.
//
// Stars come from sacrificing heroes; attunement comes from beating the
// elemental boss of your hero's own element. Each attunement adds 10% to
// a hero's base stats, and a hero can hold as many attunements as it has
// stars -- so a fully attuned 10-star hero is at +100%, and a 3-star one
// tops out at +30% until it stars up.
//
// A hero can only take its own element. There is no cross-attuning: the
// Fire boss pays Fire, and Fire is what a Fire hero drinks.

const Attune = (() => {
  const SIZES = ['small', 'medium', 'large'];
  const SIZE_LABEL = { small: 'Small', medium: 'Medium', large: 'Large' };
  const MAX = 10;
  const STAT_PER = 0.10;   // +10% base stats per attunement

  // What each step costs. Small carries 1-3, medium 4-6, large 7-10,
  // and inside each band the price climbs 5 at a time.
  const COST = {
    1:  { size: 'small',  n: 5 },
    2:  { size: 'small',  n: 10 },
    3:  { size: 'small',  n: 15 },
    4:  { size: 'medium', n: 5 },
    5:  { size: 'medium', n: 10 },
    6:  { size: 'medium', n: 15 },
    7:  { size: 'large',  n: 5 },
    8:  { size: 'large',  n: 10 },
    9:  { size: 'large',  n: 15 },
    10: { size: 'large',  n: 20 },
  };

  // The cost of going from `have` attunements to have + 1.
  function costFor(have) {
    return COST[have + 1] || null;
  }

  // Base-stat multiplier at a given attunement count.
  function statMult(count) {
    return 1 + STAT_PER * Math.max(0, Math.min(MAX, count));
  }

  // ---- Drops -------------------------------------------------------------
  //
  // Floors 1-8 pay Small, with a chance of Medium that grows across the
  // band; 9-15 pay Medium the same way against Large; 16-20 pay Large in
  // quantity. The upgrade chance is what makes climbing worth it before
  // the next band opens, rather than a wall at floor 9.
  const BANDS = [
    { from: 1,  to: 8,  base: 'small',  up: 'medium', chance: [0.05, 0.40] },
    { from: 9,  to: 15, base: 'medium', up: 'large',  chance: [0.05, 0.40] },
    { from: 16, to: 20, base: 'large',  up: null,     chance: [0, 0] },
  ];

  function bandFor(stage) {
    return BANDS.find((b) => stage >= b.from && stage <= b.to) || BANDS[0];
  }

  // How many of the band's own size a clear pays, before upgrades.
  function quantityFor(stage) {
    const band = bandFor(stage);
    if (band.up === null) {
      // The top band is the payout band: 6 at floor 16 up to 10 at 20.
      return 6 + (stage - band.from);
    }
    // 3 at the bottom of a band, 6 at the top.
    const t = (stage - band.from) / Math.max(1, band.to - band.from);
    return Math.round(3 + t * 3);
  }

  // Chance that any one drop comes up a size larger.
  function upgradeChance(stage) {
    const band = bandFor(stage);
    if (!band.up) return 0;
    const t = (stage - band.from) / Math.max(1, band.to - band.from);
    return band.chance[0] + (band.chance[1] - band.chance[0]) * t;
  }

  // Roll a clear's payout: { small, medium, large } counts.
  function roll(stage) {
    const band = bandFor(stage);
    const out = { small: 0, medium: 0, large: 0 };
    const chance = upgradeChance(stage);
    for (let i = 0; i < quantityFor(stage); i++) {
      const up = band.up && Math.random() < chance;
      out[up ? band.up : band.base]++;
    }
    return out;
  }

  // A one-line description of what a stage pays, for the picker.
  function payoutText(stage) {
    const band = bandFor(stage);
    const n = quantityFor(stage);
    const base = `${n} ${SIZE_LABEL[band.base]}`;
    if (!band.up) return base;
    return `${base} · ${Math.round(upgradeChance(stage) * 100)}% each upgrades to ` +
      SIZE_LABEL[band.up];
  }

  // A hero's star row, with the attuned ones burning in their element's
  // colour. This is where attunement is legible at a glance -- on the
  // card, in the detail panel, in the improve list -- so it is built in
  // one place rather than three.
  function starsHtml(stars, attune = 0, element = null) {
    const info = (typeof Elements !== 'undefined' && element)
      ? Elements.info(element) : null;
    // Every star is drawn individually so the attuned ones read at a
    // glance; past five they wrap onto a second row (max is 10, so two
    // rows always fit) rather than collapsing into a "6★" count.
    const star = (i) => (i < attune && info)
      ? `<span class="star-attuned" style="color:${info.color}">&#9733;</span>`
      : '&#9733;';
    const all = Array.from({ length: stars }, (_, i) => star(i));
    if (stars <= 5) return all.join('');
    return `<span class="star-stack"><span class="star-row">${all.slice(0, 5).join('')}</span>` +
      `<span class="star-row">${all.slice(5).join('')}</span></span>`;
  }

  return { SIZES, SIZE_LABEL, MAX, STAT_PER, COST, costFor, statMult, starsHtml,
    BANDS, bandFor, quantityFor, upgradeChance, roll, payoutText };
})();
