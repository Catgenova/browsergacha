# Art assets

## Hero spritesheets

Drop hero spritesheets into `assets/heroes/` as one PNG per hero, e.g.
`assets/heroes/sir_pixel.png`. Until the PNG exists, the game generates a
pixel-art placeholder automatically, so nothing breaks while art is pending.

### Sheet layout

- One animation per **row**, frames laid out **left to right**.
- All frames in a sheet share one fixed frame size (e.g. 32×32).
- Sprites should face **right** — the engine mirrors them for the enemy side.
- Transparent background.

### Wiring a sheet up

Declare the sheet in the hero's definition (`js/data/heroes.js`):

```js
sprite: {
  src: 'assets/heroes/sir_pixel.png',
  frameW: 32,
  frameH: 32,
  animations: {
    idle:   { row: 0, frames: 4, fps: 6,  loop: true  },
    attack: { row: 1, frames: 5, fps: 10, loop: false },
  },
},
```

`idle` and `attack` are the two animations used today; more (hit, death,
cast…) can be added as new rows later — the animation player already supports
arbitrary named animations.
