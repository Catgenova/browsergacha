# Card text

Every description a player reads — skill, passive, positional — is
**mechanics only**. Targets, modifiers, effects. No narration, no
in-world voice, no explanation of what the hero is doing or why. The
design comments in the def files carry the "why"; the card carries the
what.

The rule of thumb: a card should read like a line from a rules
reference, not a line from a story.

```
BAD   He takes a piece off whatever is nearest: 70% of his DEF to one enemy.
GOOD  One enemy: 70% DEF damage.

BAD   Set the ball alight and roll it down the line: two burns roll at the
      enemy front row, each a separate 50% chance, each eating 3% of their
      max HP per turn for 2 turns.
GOOD  Enemy front row: 2 separate 50% chances: 3% of target max HP per turn
      for 2 turns.
```

## Skills

```
<Scope>: <clause>; <clause>. <extras>.
```

- **Scope** is the targeting, spelled out: `One enemy`, `All allies`,
  `Enemy front row`, `One enemy and their row`, `The 2 lowest-health
  allies`, `2 random enemies`, `One fallen ally`, `Self`.
- **Clauses**, one per effect, separated by `;` — `110% ATK damage`,
  `heals 20% of caster max HP`, `+30% SPD for 2 turns`, `shield worth
  100% ATK for 3 turns`, `removes 1 debuff`. Effects on the caster are
  prefixed `self:`.
- **Riders that change a number** fold into parentheses on their clause:
  `(ignores 15% DEF)`, `(+5% per living ally)`, `(always crits)`.
- **Gates** print as the roll: `50% chance: -20% ATK for 2 turns`.
- **Repeats** collapse: `3 hits of 55% ATK damage`, `2 separate 50%
  chances: ...`.
- **Extras** — an extra turn, a chain, a requirement — come after the
  clause list as their own sentence.

Conditional and positional bonuses print **the resulting total**, not
the increase: `230% ATK damage (345% vs the center row)`. The total is
the number that decides whether you spend the turn.

## Passives

```
<Trigger>: <effect>.
```

or, for a permanent modifier with no trigger, just the effect.

```
When struck: 10% DEF damage to all enemies.
Start of each turn: removes 1 debuff from the most debuffed ally.
Whenever any enemy is frozen: permanent +10% ATK for the rest of the battle.
On overhealing: the overflow becomes a shield on that ally for 2 turns.
+25% damage to front-row enemies.
-5% damage taken per living enemy, up to -30%.
```

The trigger vocabulary is small and reused: `Start of each turn`, `When
struck`, `On dealing damage`, `On a dodge`, `On overhealing`, `On a
kill`, `On death`, `Whenever an ally is <healed|struck|buffed|debuffed>`,
`Whenever any unit on the field dies`, `Once per battle`.

## Positionals

```
<Front|Center|Back> hex: <effect>.
```

The prefix is the requirement, not decoration, and it must name the hex
the positional actually pays out on.

## The hero is never named

Cards do not say "he", "she", "his", "her", or the hero's own name. The
subject of a passive is the hero holding it, so `+15% Dodge` needs no
subject at all; where one is unavoidable, it is `this hero`, `caster` or
`the caster`. Another hero's name appears only when the name IS the
mechanic (Andrew checks the party for Aniani and Polarus), and an
ability name only when the passive casts that ability.

## What holds this in place

Four rules in `test/data.test.js`:

- *ability descriptions quote the numbers the ability actually applies* —
  damage, DoT and healing modifiers on a card must match the effect.
- *card text never narrates* — no gendered prose anywhere on the roster.
- *a positional card names the hex it actually wants* — the prefix must
  match `positional.position`.
- *passive cards quote the numbers their hooks actually carry* — every
  declarative hook value (`dodgeAdd`, `defIgnoreAdd`, `debuffExtraTurns`,
  a positional's flat `stat`/`mult`) must appear in the text.

Skill descriptions are **generated** from effect data rather than
written, which is why they cannot drift. Passive hooks are functions, so
those numbers are held by the declarative rule above and by review.
