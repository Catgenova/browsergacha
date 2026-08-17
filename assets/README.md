# Art assets

## Uploading sprites

Put hero animation strips in `assets/heroes/<hero_id>/`, one PNG per
animation. Easiest way: on GitHub, open the folder (e.g.
`assets/heroes/florence/`) on the **main** branch and use
**Add file → Upload files** — the site redeploys automatically.

Expected files per hero:

| File | Purpose |
|---|---|
| `idle.png` | Idle loop |
| `attack.png` | Attack (played once per hit) |

### Strip format (preferred)

- All frames for one animation in a **single horizontal row**, equal widths.
- Transparent background; character facing **right** (the engine mirrors
  enemies).
- Frame size is auto-detected from `image width ÷ frame count`, so any
  resolution works — the engine scales art to the hero's `displayH`.

Wire-up in the hero definition (`js/data/heroes.js`):

```js
sprite: {
  displayH: 88, // on-screen height in px
  strips: {
    idle:   { src: 'assets/heroes/florence/idle.png',   frames: 9, fps: 8,  loop: true  },
    attack: { src: 'assets/heroes/florence/attack.png', frames: 6, fps: 12, loop: false },
  },
},
```

**Important:** the `frames` count in the definition must match the strip —
if your attack strip has a different number of frames, say so (or update
the definition) or the slicing will be off.

Missing strips degrade gracefully: no `attack.png` yet means attacks
briefly play idle instead; no `idle.png` means the hero uses the generated
pixel placeholder. Nothing breaks while art is in progress.

### Timed idle variants

A strip can be declared as an occasional variation of the base idle — it
plays through once every `every: [min, max]` seconds of idling, then the
loop resumes:

```js
idle2: { src: '.../Knightidle2.png', frames: 9, fps: 8, loop: false,
         variantOf: 'idle', every: [7, 14] },
```

With several variants declared, each firing picks one at random.

### Per-frame holds

`holds` maps 1-based frame numbers to a duration multiplier — use it to
make a pose linger without duplicating frames in the strip:

```js
holds: { 7: 5 },       // frame 7 lasts 5 ticks
holds: { 6: 3, 9: 3 }, // frames 6 and 9 last 3 ticks each
```

### Florence — current status

- `KnightIdle.png` — ✅ standard idle loop (9 frames, 256×256)
- `Knightidle2.png` — ✅ timed variation (helmet adjust, holds on 4, 6 & 8)
- `Knightidle3.png` — ✅ timed variation (kneeling rest, hold on 7)
- `Knightready.png` — ✅ ready stance (loops on her turn)
- `Knightbuff.png` — ✅ Crystal Resonance cast (17 frames)
- `attack.png` — pending

### Legacy single-sheet format

One PNG per hero, one animation per row, frames left-to-right, fixed frame
size declared in the def (`src`/`frameW`/`frameH`/`animations`). Still
supported; strips are preferred for new art.
