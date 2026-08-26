# Correcting a hero's shadow

Every hero stands on a soft dark ellipse. Getting it wrong is quietly
expensive: a shadow that is too small makes a heavy character look like
they are hovering, one that is too large makes a slim one look like they
are standing in a pit, and one that is offset makes the whole sprite look
like it is sliding off the tile. This is how to fix one.

The rule underneath all of it: **the shadow describes the character's
mass, not their frame.** The frame is an artist's canvas and says nothing
about the person drawn inside it.

## What the engine already does for you

Two numbers are measured from the idle art at load time, in
`measureContentBounds()` (`js/sprites.js`). You do not author either by
hand unless the measurement is wrong.

| Field | What it is | Measured from |
|---|---|---|
| `sheet.shadowOffsetX` | how far the feet sit from frame centre, in display px | centroid of the lowest content rows |
| `sheet.shadowRX` | the disc's radius, in display px | ground footprint blended with body span |

`shadowRX` is a blend, `0.55 x footprint + 0.45 x body span`, halved to a
radius and scaled to display size. The two halves are both load-bearing:

- **Footprint alone is wrong.** It made Catherine — visually one of the
  heaviest units on the field — cast a 10px coin, because she stands with
  her heels together.
- **Body span alone is wrong too.** It is what the old code effectively
  used (`frameW * 0.3`), and it gave a seated Imani and a slim Noctelle
  the same disc.

The result is clamped to **13–32 display px**. The clamp exists so one
stray pixel or one ground-sweeping cape cannot produce an absurd disc.

## The process

### 1. Put the hero on the ground and look

```
node tools/shadow_lab.js              # contact sheets, whole roster
node tools/shadow_lab.js ryn imani    # a few heroes, blown up
```

This drops each hero onto a real battle background at the real ground
line, draws the shadow the renderer would draw, and writes PNGs to
`tools/out/shadow/`. It also prints a table of measured radii against the
old frame-width estimate.

Open the images. **Do not skip to the numbers** — the whole point is that
a radius is only right or wrong relative to the art above it, and the
table cannot tell you that. The lab loads the game's own `sprites.js`, so
what it draws is what battle draws.

### 2. Read the art for where the mass is

For each hero that looks wrong, ask in this order:

1. **Is the disc under the feet?** If it is off to one side, the problem
   is `shadowOffsetX`, not size. See "when the offset is wrong" below.
2. **Where does this character actually meet the ground?** Boots, a
   seated pose, a barrel, a ball, a hovering root system. That patch is
   the floor of the shadow's size.
3. **How much of them is over that patch?** A figure balanced on one toe
   still has a body overhead and deserves more than the toe. This is the
   part pure contact-area measurement gets wrong.
4. **Is any of the width cloth rather than body?** A cape or train that
   sweeps behind the heels reads as mass to the measurement and as
   nothing to the eye. This is the most common reason a shadow is too big.

### 3. Override only what the measurement got wrong

Add `shadowScale` to the hero's `sprite` block. It multiplies the
measured radius; `1` (the default) means the art was read correctly.

```js
sprite: {
  displayH: 96,
  // Measured 23, but his idle is drawn mid-air above his own
  // leaf-spin. A grounded disc that size reads as him standing in a
  // hole; pulled in so he floats.
  shadowScale: 0.8,
  strips: { ... },
},
```

**Always write down what you saw**, not what you set. `shadowScale: 0.8`
is unreviewable a month later; "his idle is drawn mid-air" is a fact
anybody can check against the art.

Rough calibration, from the heroes tuned so far:

| Situation | Direction | Example |
|---|---|---|
| Closed or formal stance, heavy character | up, 1.2–1.4 | Catherine 1.3, Tanner 1.4 |
| Several small bodies in one frame | up, ~1.2 | Samuels 1.2 |
| Drawn airborne in idle | down, ~0.8 | Tumble 0.8 |
| Cape or train sweeping the ground | down, 0.7–0.85 | Wren 0.72 |
| Seated, or a wide prop taking the weight | leave it | Imani, Slick, Lin |

**The clamp bites after the scale.** A hero already at the 32px ceiling
needs a scale low enough to drop them under it before anything changes —
Wren at `0.85` looked like a no-op for exactly that reason, and needed
`0.72`. If an override appears to do nothing, check the raw measurement
first.

### 4. Look again

Re-run the lab on just the heroes you touched. Two or three rounds is
normal; the numbers are a means, the picture is the check.

### 5. Verify against the real renderer

The lab and `Renderer.drawShadow()` read the same `sheet.shadowRX`, but
that is a property of the current code, not a law. If you change either,
confirm they still agree before believing the contact sheets.

## When the offset is wrong

Size and position are separate problems with separate knobs. If the disc
is under the wrong part of the character, set `shadowOffsetX` (display px,
positive = right of frame centre) in the `sprite` block; a non-zero value
suppresses the measurement entirely. Reach for this when the art has the
character standing well off-centre in their frame, or when a large prop
drags the measured centroid away from the actual boots.

Note that the offset is mirrored automatically for flipped sprites, so
author it for the art as drawn, not as it appears on the enemy side.

## Adding a new hero

Run `node tools/shadow_lab.js <id>` as part of landing the hero, in the
same pass as the facing audit. The default measurement is right for most
uploads — of 47 heroes, 42 needed no override at all — so the expected
outcome is that you look once and change nothing.

## What this deliberately does not do

- **No per-hero authored radius.** The radius is derived, so re-exported
  art stays correct without anyone remembering to re-tune it. The
  override is for judgement, not for data.
- **No shape other than a circle.** Every shadow is one ellipse at a
  fixed 0.34 squash. Per-hero silhouettes would track poses better and
  are not worth the authoring cost.
- **No opacity or colour per hero.** All shadows share one value in
  `drawShadow()`. If a hero's shadow reads wrong at the correct size, the
  problem is usually the background, not the hero.
- **No altitude handling here.** Jumps already shrink and fade the disc
  at runtime; that is motion, not art, and lives in the renderer.
