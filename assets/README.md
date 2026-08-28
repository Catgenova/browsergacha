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

## Bird sects — one folder per SECT

The avian sects break the one-folder-per-hero rule above: a whole sect
shares a folder and each bird is one strip inside it.

```
assets/heroes/gulldigger/Hallowidle.png
assets/heroes/phoenixcourt/flurryidle.png
```

Nine birds to a sect, built to a fixed star shape rather than to
whatever rarities got written first — one 1★, two 2★, three 3★, two 4★
and a single 5★ — and every member shares the sect's element. The
Gulldiggers are water, the Phoenix Court fire.

Nothing enforces the filename spelling; the def's `src` is the only
source of truth, so the case just has to match whatever lands (both
`Korvididle.png` and `flurryidle.png` exist today). What the engine does
care about is the facing: art is expected to face **right**, and a bird
drawn facing left is corrected with `sprite.faceLeft: true` in the def
rather than by touching the upload.

### Razorwings — the wind sect ✅

`assets/heroes/razorwings/` is full: nine birds, No. 10, wind, built to
the 1/2/3/2/1 shape. Tervan, Kiri, Strix, Calima, Mendral, Balmor,
Brannoc, Cirrus, Nehru.

### Sunbrood — open

`assets/heroes/sunbrood/` is open and empty, waiting on art. **No. 11**
when it is registered: 1 through 10 are spoken for, including
Shadowflower and the Hedge, whose numbers are spent and can never be
reissued.

Nothing is assumed in code and nothing should be — the sect goes into
`js/data/heroes/` and `RACES.SECTS` with its first member, since a
standing order with nobody in it fails the data tests. But for what it
is worth, the roster has an obvious hole shaped like this one. The
three bird sects so far are Gulldigger (water), Phoenix Court (fire)
and Razorwings (wind), which leaves light and dark unspoken for; and
light is the thinnest element in the game at nine heroes, every one of
them a Herald of Reverence, against 18 or 19 apiece for water, wind and
fire. A light brood would square that in one go.

Tell me the element and the roster when the art lands and I will build
to whatever it actually is.

### Getting a bird on the field

Idle alone is enough: a hero with only `idle.png` plays it for
everything, and the engine routes an ability that has no strip of its
own through a fallback timer so the turn still resolves. Actions can
follow later.

Two things that have bitten before, both now caught by tests. Filenames
are case-sensitive when served, and the case in this folder is not
consistent (`Mendralidle.png` sits beside `kiriidle.png`) — a def
pointing at the wrong case does not throw, it silently falls back to
the generated placeholder and looks fine everywhere but the browser.
And art is expected to face **right**; a bird drawn facing left is
corrected with `sprite.faceLeft: true` in the def rather than by
touching the upload.

### Legacy single-sheet format

One PNG per hero, one animation per row, frames left-to-right, fixed frame
size declared in the def (`src`/`frameW`/`frameH`/`animations`). Still
supported; strips are preferred for new art.

## Effect spritesheets

Standalone impact/projectile effects live in `assets/` and are registered
in `js/data/effects.js` (frames, fps, `vertical: true` for stacked strips).
Abilities reference them via `impact: '<id>'`; damage abilities default to
`strike`. Current set: `slash`, `strike`, `punch`, `slam`,
`windshear_wave` (Prism Break's projectile).

### Vivian — expected uploads (assets/heroes/vivian/)

| File | Purpose |
|---|---|
| `hedgeidle.png` | standard idle loop |
| `hedgeidle2.png` / `hedgeidle3.png` | timed idle variations |
| `hedgeready.png` | ready pose (her turn) |
| `hedgeskill1.png` | cast animation (skills 1 and 2) |
| `hedgeskill3.png` | attack animation (skill 3) |
| `hedgedeath.png` | death (freezes on last frame) |

Defs assume 9 frames per strip until the real sheets land — tell Claude
the frame counts (or they'll be read from the upload) and any holds.
