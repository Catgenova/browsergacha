# Reworking skill level-ups

The old system was one blanket multiplier: `skillPower(level) = 1 + 0.10
* (level - 1)`, applied to every number in the ability. On a damage
skill that worked. On a skill that only lands a debuff it did nothing at
all — levelling a pure-debuff skill five times changed no value a player
could observe.

The replacement gives every skill an explicit **ladder of upgrades**,
one per level, drawn from four kinds of improvement. A single skill may
mix them, and most should.

## The four rules

### 1. Damage and healing → raise the modifier

- A skill scaling off **ATK or DEF**: `+10%` per level-up.
- A skill scaling off **max HP**: `+5%` per level-up.

"+10%" means ten percentage points on the modifier itself: a 120% ATK
skill goes 120 → 130 → 140. HP-priced skills move in fives because a
percentage of a health pool is a much larger number than a percentage of
an attack stat.

### 2. Cooldowns → the last two level-ups take one turn each

- **Every skill 2 and skill 3 has its base cooldown increased by 1.**
- The **final two** upgrades on the ladder are each `-1 cooldown`.

So a skill lands weaker than it used to and ends up better: an old
`cd 5` becomes `cd 6` at level 1 and `cd 4` fully levelled. Skills with
no cooldown (most skill 1s) skip this rule and spend every rung on
something else.

### 3. Debuffs → a real application chance, and severity

- The **base chance to apply is 50%**, rolled *before* the existing
  accuracy-versus-resistance contest. This is a new, separate gate.
- Level-ups raise that chance toward **100%**, in steps of **10–20%**.
- The **severity** of the debuff is also fair game for a rung: a -30%
  DEF break becoming -40%.

A debuff skill must be able to reach 100% application chance by max
level, so the rungs spent on chance have to add up to +50.

### 4. Buffs → duration, and severity

- Level-ups can extend the **duration** in turns.
- Level-ups can raise the **severity** of the buff.

## Level caps by slot

| Slot | Upgrade rungs | Max level |
|---|---|---|
| Skill 1 | 5 | 6 |
| Skill 2 | 6 | 7 |
| Skill 3 | 7 | 8 |

The **rung count** is the number that matters: five, six and seven
upgrades. A skill starts at level 1, so its cap is one above its rungs.
Deeper skills get longer ladders, which is what lets a skill 3 afford
both a damage track and two cooldown reductions.

## Scaling terms other than the flat modifier

Some kits price a skill as `flat + something-per-stack` — Aniani's
mirrors, Morrow's bodies on the field. A rung must raise **both** halves,
because on those kits the per-stack term is the skill: Aniani's Mirror
Lance is 60% flat and 30% per mirror, so at six mirrors the flat part is
a quarter of her damage and a rung that only touched it would be worth a
fraction of what the same rung is worth on anyone else.

Her rungs are `+10% flat, +5% per mirror`. Readouts list the two halves
separately, never summed: `+50% power` and `+25%/mirror` is +50% with
the glass gone and +200% with all six up, so one fused number would be
true at no mirror count at all.

## Worked example

The shape to aim for, from the brief:

**Before** — front row attack 120% and reduce DEF -30% for 2 turns, cd 5

**After (base)** — front row attack 120% and a **50% chance** to reduce
DEF -30% for 2 turns, **cd 6**

**The ladder** — `+20% ATK modifier` · `+25% debuff chance` · `+25%
debuff chance` · `+10% debuff power` · `-1 cooldown` · `-1 cooldown`

Note what this does to the feel of the skill: at level 1 it is a
coinflip that costs an extra turn of cooldown, and fully levelled it is
a guaranteed, harder-hitting, faster-cycling version of the old one.
Investment moves a skill from unreliable to certain, which is a far more
interesting axis than "the number got bigger".

## Working method

We go **hero by hero**. For each:

1. Read the current kit — base numbers, cooldowns, what each effect does.
2. Apply the four rules to produce the new **base** (cooldown +1 on
   skills 2 and 3, debuff chances set to 50%).
3. Write the **ladder** for each skill, one rung per level, using the
   rungs available for that slot.
4. Propose it as numbered points so it can be edited before it is built.
5. Build, test, verify in-game, commit.

## Deviations recorded during the sweep

Two places where the rules as written produce something wrong, and what
was done instead. Both are deliberate and both should be revisited.

**Hard CC on a cooldown-free skill keeps its authored gate.** Setting a
freeze to a 50% base and letting rungs carry it to 100% is correct on a
skill with a cooldown. On a skill 1, which fires every single turn, a
100% freeze is a permanent lockout — the enemy never acts again. Polarus
and Angelica's skill 1 freezes therefore keep their authored 30% base
and spend at most two rungs, reaching 50%. Their cooldown-gated freezes
follow the rule in full.

**A ladder may be shorter than its slot.** Some skills genuinely have
fewer improvable axes than rungs available: Silas's Aiming Stance is a
flag with no magnitude and no meaningful duration, so cooldown is its
only axis and it carries two rungs, not seven. `skillCap` is the
ladder's real length, capped by the slot — padding a ladder with rungs
that buy nothing is worse than a short one.

## Migration

The roster is swept hero by hero, so at any moment most abilities have
no ladder. An ability **without** `levelUps` keeps the legacy blanket
multiplier and the legacy cap of 5; one **with** a ladder takes its
slot's cap and its explicit rungs, and is excluded from the blanket
multiplier so its rungs are not paid twice. Both paths are covered by
tests, because a half-migrated system that quietly zeroed the unswept
heroes would be worse than no migration at all.

The proposal step is not optional. These are balance decisions, and the
numbers are worth arguing about before they are code.
