// Tags: at-a-glance labels for a hero definition — position + role
// ("Front Line DPS", "Center Support"), what the kit actually does
// (Healer, Shielder, Buffer, Debuffer, DoT), the race or sect, and the
// element. Derived from the kit rather than hand-written, so 385
// heroes stay honestly labelled as their data changes; the role logic
// is the same test/archetypes.js uses to bench them.

const Tags = (() => {
  const POS_LABEL = {
    [POSITION.FRONT]: 'Front Line',
    [POSITION.CENTER]: 'Center',
    [POSITION.BACK]: 'Back Line',
  };
  const MEND = ['heal', 'healHpPct', 'hot', 'revive', 'cleanse'];

  // Support / Tank / DPS, mirroring the bench classifier: a hero who
  // mends allies (not just themselves) is support, one whose kit mostly
  // points at their own side is support, and the rest split on whether
  // their statline is bulk or punch.
  function role(def) {
    // A def can name its role outright (Catherine's stats read tanky
    // but she is a DPS); the derivation below covers everyone else.
    if (def.role) {
      return { tank: 'Tank', dps: 'DPS', support: 'Support' }[def.role] || 'DPS';
    }
    const abilities = def.abilities || [];
    const mendsAllies = abilities.some((a) =>
      Abilities.sideOf(a.targeting) === 'ally' &&
      (a.effects || []).some((e) => MEND.includes(e.type)));
    if (mendsAllies) return 'Support';
    const forAllies = abilities.filter((a) =>
      ['ally', 'self'].includes(Abilities.sideOf(a.targeting))).length;
    if (forAllies > abilities.length / 2) return 'Support';
    const s = def.stats || {};
    const bulk = (s.hp || 0) / 10 + (s.def || 0);
    const punch = (s.atk || 0) + (s.speed || 0) / 2;
    return bulk > punch ? 'Tank' : 'DPS';
  }

  // What the kit does beyond its role, as extra chips.
  function kit(def) {
    const abilities = def.abilities || [];
    const bySide = (side) => abilities
      .filter((a) => Abilities.sideOf(a.targeting) === side)
      .flatMap((a) => a.effects || []);
    const allyFx = bySide('ally');
    const enemyFx = bySide('enemy');
    const selfFx = [...bySide('self'), ...abilities.flatMap((a) => a.selfEffects || [])];
    const out = [];
    if (allyFx.some((e) => MEND.includes(e.type))) out.push('Healer');
    if ([...allyFx, ...selfFx].some((e) => e.type === 'shield')) out.push('Shielder');
    if (allyFx.some((e) => e.type === 'buff' || e.type === 'turnMeter')) out.push('Buffer');
    if (enemyFx.some((e) => e.type === 'debuff')) out.push('Debuffer');
    if (enemyFx.some((e) => e.type === 'dot')) out.push('DoT');
    return out;
  }

  // The full chip list for one hero: [{ kind, text, color? }].
  function of(def) {
    const tags = [];
    const pos = (def.positional && POS_LABEL[def.positional.position]) || 'Front Line';
    tags.push({ kind: 'role', text: `${pos} ${role(def)}` });
    for (const k of kit(def)) tags.push({ kind: 'kit', text: k });
    const sect = RACES.sectOf(def);
    const race = RACES.of(def);
    if (sect) tags.push({ kind: 'race', text: `${sect.name} Sect` });
    else if (race) tags.push({ kind: 'race', text: RACES.NAMES[race] });
    const info = def.element && Elements.info(def.element);
    if (info) tags.push({ kind: 'element', text: info.name, color: info.color });
    return tags;
  }

  function html(def) {
    return '<div class="hero-tags">' + of(def).map((t) =>
      `<span class="hero-tag tag-${t.kind}"${
        t.color ? ` style="border-color:${t.color};color:${t.color}"` : ''}>${t.text}</span>`
    ).join('') + '</div>';
  }

  return { of, html, role };
})();
