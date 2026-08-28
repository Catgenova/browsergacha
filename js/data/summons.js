// Summons: bodies that only exist inside a fight.
//
// Deliberately NOT in HEROES, and that separation is the whole point.
// Everything that walks the roster reads that table -- the gacha, the
// compendium, the team screen, the power ladder, the balance pass in
// js/data/balance.js, and every data test that sweeps "every hero".
// A thing you can never own, never level, never gear and never seat
// before a fight does not belong in any of them, and putting it there
// to save a table would have meant nine exemptions instead.
//
// So a summon is hero-SHAPED (a def with abilities, a passive slot, a
// positional, a sprite) and lives in its own table. Abilities.applyEffect
// builds one mid-battle when a `summon` effect resolves.
//
// Their statlines are a SHARE of the summoner's rather than numbers of
// their own: see the `share` on the effect. Two consequences worth
// stating -- a summon is worth exactly as much as the bird that raised
// it, so investing in Necros invests in them; and they are immune to
// js/data/balance.js, which only touches HEROES, so there is no budget
// for them to be off.
//
// Both are two-star kits by the roster's own rule (slot one and slot
// two, nothing else) and both are front-row bodies, because a thing
// dragged out of a corpse goes where the corpse was: in the way.

const SUMMONS = {
  // The heavy one. A bone cassowary is mostly casque and claw, and it
  // hits the front rank in front of it.
  crossowary_undead: {
    id: 'crossowary_undead',
    summon: true,
    element: 'dark',
    name: 'Bone Cassowary',
    title: 'Raised by the Hollowbone',
    rarity: 2,
    // Overwritten at summon time by the caster's share; these are the
    // RATIOS the share is spread across, and nothing else.
    stats: { hp: 1200, atk: 180, def: 120, speed: 104 },
    tint: { body: '#e8dcc0', helm: '#c8b898', weapon: '#8a7a5a', shield: '#6a5a3a' },
    sprite: {
      displayH: 88,
      strips: {
        idle: { src: 'assets/heroes/hollowbone/crossowaryundeadidle.png',
                frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'crossowary_kick', name: 'Kick',
        icon: 'assets/icons/fc823.png',
        description: 'A dead leg still swings: 90% ATK to one enemy.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 0.90 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'crossowary_gore', name: 'Gore',
        icon: 'assets/icons/fc1141.png',
        description: 'Head down and through: 120% ATK to the enemy FRONT row.',
        cooldown: 4, targeting: 'front-enemies', animation: 'idle', impact: 'slam',
        effects: [{ type: 'damage', mult: 1.20 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    positional: POSITIONALS.reckless_charge,
  },

  // The sharp one. A bone heron is a beak on a stick, and it goes
  // through armour rather than around it.
  heron_undead: {
    id: 'heron_undead',
    summon: true,
    element: 'dark',
    name: 'Bone Heron',
    title: 'Raised by the Hollowbone',
    rarity: 2,
    stats: { hp: 980, atk: 220, def: 90, speed: 118 },
    tint: { body: '#e8dcc0', helm: '#c8b898', weapon: '#8a7a5a', shield: '#6a5a3a' },
    sprite: {
      displayH: 92,
      strips: {
        idle: { src: 'assets/heroes/hollowbone/heronundeadidle.png',
                frames: 9, fps: 5, loop: true },
      },
    },
    abilities: [
      {
        id: 'heron_spear', name: 'Spear',
        icon: 'assets/icons/fc823.png',
        description: 'One long jab: 85% ATK to one enemy, past 25% of their DEF.',
        cooldown: 0, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [{ type: 'damage', mult: 0.85, ignoreDef: 0.25 }],
        levelUps: [
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
          { mult: 0.1 },
        ],
      },
      {
        id: 'heron_pin', name: 'Pin',
        icon: 'assets/icons/fc1141.png',
        description: 'Through and into the ground: 130% ATK to one enemy, with a 50% ' +
          'chance to cut their Speed 25% for 2 turns.',
        cooldown: 4, targeting: 'enemy', animation: 'idle', impact: 'strike',
        effects: [
          { type: 'damage', mult: 1.30 },
          { type: 'debuff', stat: 'speed', mult: 0.75, turns: 2, chance: 0.5 },
        ],
        levelUps: [
          { mult: 0.1 },
          { debuffChance: 0.25 },
          { mult: 0.1 },
          { debuffChance: 0.25 },
          { cooldown: -1 },
          { cooldown: -1 },
        ],
      },
    ],
    positional: POSITIONALS.vanguard_press,
  },
};
