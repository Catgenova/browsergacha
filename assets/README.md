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

### Currently expected uploads

- `assets/heroes/florence/idle.png` — 9 frames (provided art: armored
  knight, red plume, crystal sword)
- `assets/heroes/florence/attack.png` — pending

### Legacy single-sheet format

One PNG per hero, one animation per row, frames left-to-right, fixed frame
size declared in the def (`src`/`frameW`/`frameH`/`animations`). Still
supported; strips are preferred for new art.
