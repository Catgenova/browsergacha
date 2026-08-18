// Character elements and the elemental combat cycle.
//
// Every character is Wind, Water, Fire, Dark, or Light.
//   - Basic cycle: Water > Fire > Wind > Water. The advantaged side
//     deals +15% damage and takes -15% from its prey.
//   - Dark and Light each deal +25% to each other (no reduction).
//   - Dark and Light heroes can only be SUMMONED from Temporal Scrolls.

const ELEMENTS = {
  wind:  { id: 'wind',  name: 'Wind',  emoji: '🍃', color: '#7ae87a' },
  water: { id: 'water', name: 'Water', emoji: '💧', color: '#8ecbff' },
  fire:  { id: 'fire',  name: 'Fire',  emoji: '🔥', color: '#ff9a5a' },
  dark:  { id: 'dark',  name: 'Dark',  emoji: '🌙', color: '#b48aff' },
  light: { id: 'light', name: 'Light', emoji: '☀️', color: '#ffd76a' },
};

const Elements = (() => {
  // ADV[a] is the element `a` preys on.
  const ADV = { water: 'fire', fire: 'wind', wind: 'water' };
  const BASIC = ['wind', 'water', 'fire'];
  const TEMPORAL = ['dark', 'light'];

  // Damage multiplier for attacker element `a` hitting defender `d`.
  function mult(a, d) {
    if (!a || !d) return 1;
    if ((a === 'dark' && d === 'light') || (a === 'light' && d === 'dark')) {
      return 1.25;
    }
    if (ADV[a] === d) return 1.15; // advantage: hit harder
    if (ADV[d] === a) return 0.85; // disadvantage: prey resists
    return 1;
  }

  function info(el) {
    return ELEMENTS[el] || null;
  }

  function badge(el) {
    return ELEMENTS[el] ? ELEMENTS[el].emoji : '';
  }

  return { ADV, BASIC, TEMPORAL, mult, info, badge };
})();
