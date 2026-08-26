// Hero definitions. Every hero follows the same contract:
//   - 3 active abilities: one no-cooldown, one short cooldown, one long
//     cooldown. A 1-STAR is the exception and carries exactly one, which
//     must be cooldown-free: the bottom of a sect is a body with a knife
//     rather than a kit, and its single skill has to be pressable every turn.
//   - 1 passive ability: hooks.onTurnStart(unit, battle) -> null | {
//       label, message, floats: [{ target, text, color }] }
//   - 1 positional bonus, active only in the matching grid position
//   - sprite: spritesheet reference (placeholder art is generated when the
//     PNG is absent — drop real sheets into assets/heroes/ to replace it)
//
// Rarity drives gacha rates and rough stat budgets (3★ < 4★ < 5★).
//
// The roster itself lives in js/data/heroes/*.js, one file per race,
// each registering its heroes into this table. Splitting it keeps any
// single content change to a reviewable diff instead of a 23k-line one.

const HEROES = {};
