# Browser Gacha — Hero Battler

A turn-based hero battler with gacha summon mechanics, built in vanilla
JavaScript + canvas. No build step.

## Running

Open `index.html` directly in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Screens

- **Summon** — spend gems on ×1 (100) or ×10 (900) pulls. Rates: 3★ 70% /
  4★ 25% / 5★ 5%; a ×10 guarantees a 4★+, and a 5★ is guaranteed within 40
  pulls (pity). Duplicates are tracked as copies on the roster.
- **Team** — the team builder. Click a roster hero, then a hex to place
  them; click a placed hero, then another hex to move or swap. Hexes where
  the selected hero's positional bonus activates glow gold. Fight! starts
  a battle against a randomly generated enemy wave.
- **Battle** — the turn-based combat itself. Victory pays out gems, which
  loop back into summons.

Progress (gems, roster, team layout, pity) persists in `localStorage`.

## Battle layout

Each side fields up to **7 units** on a hex "flower": a center hex ringed by
6, players on the left, enemies mirrored on the right. Slots fall into three
position categories used by positional bonuses:

- **front** — the 3 hexes closest to the enemy
- **center** — the middle hex
- **back** — the 3 hexes furthest from the enemy

## Heroes

Every hero (defined in `js/data/heroes.js`) has:

- **3 active abilities** — one with no cooldown, one short cooldown, one long
  cooldown (cooldowns tick on the hero's own turns)
- **1 passive ability** — hook-based (e.g. `onTurnStart` regen)
- **1 positional bonus** — a stat boost active only in its matching position
  (a ★ appears next to the hero when it's live)
- **Pixel-art spritesheet** — idle + attack animations
  (see `assets/README.md`; a generated placeholder is used until real art
  lands)

Above each unit: name, **health bar**, and **turn meter**. Turn meters fill
by speed; a full meter grants a turn. Player heroes pause the battle for
ability + target input; enemies act on simple AI.

## Code map

| File | What it does |
|---|---|
| `js/config.js` | Tunables: layout, turn meter, sprite scale |
| `js/state.js` | Persistent player state: gems, roster, team, pity |
| `js/gacha.js` | Summon rates, pity, pull resolution |
| `js/hex.js` | Hex math + the 7-slot formation builder |
| `js/sprites.js` | Spritesheet loading, animation playback, placeholder art |
| `js/abilities.js` | Ability/effect resolution (damage, heal, buff, debuff) |
| `js/hero.js` | `Unit` class: stats, HP, turn meter, cooldowns, statuses |
| `js/data/heroes.js` | Hero definitions (first hero: **Sir Pixel**) |
| `js/data/enemies.js` | Enemy definitions |
| `js/battle.js` | Battle engine: turn order, actions, enemy AI |
| `js/render.js` | Canvas drawing: grid, sprites, bars, floating text |
| `js/ui.js` | DOM UI: ability bar, targeting, battle log |
| `js/battle_screen.js` | Battle screen: team → battle, enemy waves, rewards |
| `js/team_screen.js` | Team builder screen |
| `js/summon_screen.js` | Gacha summon screen |
| `js/main.js` | App shell: nav, screen switching, game loop |

## Roadmap

- [ ] More heroes, real spritesheets
- [ ] Status effect icons, stuns, and richer effect types
- [ ] Stages / waves and progression
- [ ] Hero leveling / dupe-powered upgrades
