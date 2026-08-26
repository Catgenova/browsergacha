import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Sawyer'
PANEL = (20, 16, 32, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

# (file, frames, fps, clip name) — mirrors sprite.strips in the hero def.
STRIPS = [
    ('sawyeridle.png',    9,  5, 'idle'),
    ('sawyeridle1.png',   9,  6, 'fidget1'),
    ('sawyeridle2.png',   9,  8, 'fidget2'),
    ('sawyerskill1.png',  9, 12, 'petalfall'),
    ('sawyerskill2.png',  9, 10, 'nightbloom'),
    ('sawyerskill3.png', 15, 12, 'deadheading'),
    ('sawyerdeath.png',   8,  7, 'death'),
]

def clip(fname, frames, fps):
    im = Image.open(f'{SRC}/{fname}').convert('RGBA')
    w, h = im.size
    assert w % frames == 0, f'{fname}: {w}px does not divide into {frames} frames'
    fw = w // frames
    cells = []
    for i in range(frames):
        cell = im.crop((i * fw, 0, (i + 1) * fw, h))
        bg = Image.new('RGBA', cell.size, PANEL)
        bg.alpha_composite(cell)
        cells.append(bg.convert('RGB').resize((SIZE, SIZE), Image.NEAREST))
    buf = io.BytesIO()
    cells[0].save(buf, format='GIF', save_all=True, append_images=cells[1:],
                  duration=int(1000 / fps), loop=0, optimize=True)
    return 'data:image/gif;base64,' + base64.b64encode(buf.getvalue()).decode()

IMG = {name: clip(f, n, fps) for f, n, fps, name in STRIPS}

html = r'''<title>Sawyer, Blade of the Nightflowers</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Marcellus&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: a night garden. Violet blade-light
     on near-black loam, his armor's gold kept to a supporting thread.
     Every ground and color is painted explicitly. */
  :root {
    --ground: #0d0a12;
    --panel: #14101f;
    --panel-2: #1b1428;
    --line: #3b2b52;
    --ink: #efe9f4;
    --muted: #9c8db0;
    --violet: #b285f0;
    --bloom: #d5b5ff;
    --violet-dim: #6a4a9a;
    --gold: #c8963a;
    --wilt: #d88a9a;
    --display: 'Marcellus', 'Georgia', serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: var(--ground);
    color: var(--ink);
    font-family: var(--mono);
    font-size: 15px;
    line-height: 1.65;
  }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }

  .eyebrow {
    font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px;
  }
  .eyebrow b { color: var(--violet); font-weight: 500; }

  /* ---- Hero header ---- */
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art {
    flex: 0 0 300px; position: relative;
    background:
      radial-gradient(ellipse 62% 46% at 50% 58%, rgba(178,133,240,.17), transparent 70%),
      var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    min-height: 320px;
  }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag {
    position: absolute; top: 10px; left: 12px;
    font-size: 11px; letter-spacing: 2px; color: var(--violet-dim);
    text-transform: uppercase;
  }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--bloom); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 {
    font-family: var(--display); font-weight: 400; font-size: 82px;
    line-height: .95; color: var(--ink); text-wrap: balance; letter-spacing: 6px;
    text-shadow: 0 0 36px rgba(178,133,240,.45);
  }
  .title-line { font-size: 15px; color: var(--violet); letter-spacing: 4px;
    font-family: var(--display); text-transform: uppercase; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge {
    font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px;
  }
  .badge.dark { border-color: var(--violet-dim); color: var(--violet); }
  .badge.sect { border-color: var(--gold); color: var(--gold); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }

  /* ---- Stats ---- */
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 16px;
  }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v {
    font-family: var(--display); font-size: 30px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.15;
  }
  .stat.atk .v { color: var(--violet); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  .stats-note { font-size: 12px; color: var(--muted); margin-top: 8px; }

  /* ---- Sections ---- */
  h2 {
    font-family: var(--display); font-weight: 400; font-size: 27px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 4px; text-transform: uppercase;
  }
  h2 .glyph { color: var(--violet); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }

  /* ---- The seed packet (random debuff pool) ---- */
  .packet-box {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px 16px; overflow-x: auto;
  }
  .packet { display: grid; grid-template-columns: repeat(5, minmax(140px, 1fr)); gap: 12px; min-width: 760px; }
  .seed {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 14px 12px; text-align: center;
  }
  .seed .num {
    font-family: var(--display); font-size: 34px; line-height: 1.1;
    color: var(--wilt); font-variant-numeric: tabular-nums;
  }
  .seed .what { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .packet-cap { font-size: 12px; color: var(--muted); margin-top: 14px; }
  .packet-cap b { color: var(--violet); font-weight: 500; }

  /* ---- Deadheading the center ---- */
  .center-box {
    margin-top: 22px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 24px 20px; display: flex; gap: 24px;
    flex-wrap: wrap; align-items: center; justify-content: center;
  }
  .cut {
    flex: 1 1 220px; max-width: 300px; text-align: center;
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 16px;
  }
  .cut.center-cut { border-color: var(--violet-dim); }
  .cut .who { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .cut .num {
    font-family: var(--display); font-size: 52px; line-height: 1.1;
    color: var(--ink); font-variant-numeric: tabular-nums;
  }
  .cut.center-cut .num { color: var(--bloom); text-shadow: 0 0 24px rgba(178,133,240,.5); }
  .cut .what { font-size: 12px; color: var(--muted); }
  .cut .what b { color: var(--ink); font-weight: 500; }

  /* ---- Abilities ---- */
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px;
  }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--violet-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 400; font-size: 22px; letter-spacing: 2px; }
  .ability .ladder { margin-top: 10px; padding-top: 9px;
    border-top: 1px solid var(--line); font-family: var(--mono);
    font-size: 11px; line-height: 1.7; color: var(--muted); }
  .ability .ladder b { color: var(--ink); font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase; font-size: 10px; }
  .ability .ladder i { font-style: normal; color: var(--ink); }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--bloom); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--violet); font-weight: 500; }
  .ability.passive-card { border-color: var(--violet-dim); }

  .dmg-table-box { margin-top: 22px; overflow-x: auto; background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; min-width: 620px; font-size: 13px; }
  th, td { padding: 9px 14px; text-align: right; font-variant-numeric: tabular-nums; }
  thead th { color: var(--muted); font-weight: 500; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid var(--line); }
  tbody th { text-align: left; font-weight: 500; color: var(--ink); white-space: nowrap; }
  tbody tr + tr td, tbody tr + tr th { border-top: 1px solid #251b38; }
  td.max { color: var(--violet); font-weight: 600; }
  .table-cap { font-size: 12px; color: var(--muted); padding: 10px 14px 12px; }

  /* ---- Gallery ---- */
  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }

  /* ---- Footer ---- */
  .acquire {
    margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap;
    align-items: baseline;
  }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-size: 22px; color: var(--bloom); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--violet); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>5&#x2605; Dark &middot; Nightflower &middot; No. 6</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Sawyer idle animation, a swordsman in black and gold resting a violet blade" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 5</span></div>
      <h1>SAWYER</h1>
      <div class="title-line">Blade of the Nightflowers</div>
      <div class="badges">
        <span class="badge dark">&#x1f319; Dark</span>
        <span class="badge">Front-row DPS</span>
        <span class="badge">Debuff engine</span>
        <span class="badge sect">Nightflower &middot; No. 6</span>
      </div>
      <p class="lede">He was written as a Nightflower years before the
      sect existed &#x2014; Petalfall, Night Bloom, Deadheading, a passive
      called Wilting Garden &#x2014; and has since been recognised as one.
      Sawyer tends the enemy line the way a gardener tends a bed: every cut
      scatters a pair of hexes over the wound, <b>the drooping are cut
      easier</b>, and the finest bloom &#x2014; whoever holds the <b>center
      hex</b> &#x2014; is deadheaded first.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1090</div></div>
    <div class="stat atk"><div class="k">ATK</div><div class="v">170</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">77</div><div class="sub">Night Bloom pays the rent</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">104</div></div>
    <div class="stat"><div class="k">Crit</div><div class="v">15%</div><div class="sub">&#xd7;1.5 damage</div></div>
  </div>
  <div class="stats-note">Base values at level 1 &#x2014; stats scale with level and &#x2605; ascension like every hero.</div>

  <h2><span class="glyph">&#x273F;</span> The Seed Packet</h2>
  <div class="section-sub">Every Petalfall Cut draws <b style="color:var(--ink)">two of these
    five hexes at random</b> &#x2014; always two different ones &#x2014; and plants them on the
    target for 2 turns. They pass the same accuracy-versus-resistance check as any debuff.</div>
  <div class="packet-box">
    <div class="packet">
      <div class="seed"><div class="num">&#x2212;25%</div><div class="what">ATK</div></div>
      <div class="seed"><div class="num">&#x2212;25%</div><div class="what">DEF</div></div>
      <div class="seed"><div class="num">&#x2212;25%</div><div class="what">SPD</div></div>
      <div class="seed"><div class="num">&#x2212;15%</div><div class="what">Crit chance</div></div>
      <div class="seed"><div class="num">+25%</div><div class="what">Damage taken</div></div>
    </div>
    <div class="packet-cap">The hexes are not just disruption &#x2014; they are fertilizer for his
      passive: <b>Wilting Garden pays +10% damage per debuff on the target</b>, up to +60%.
      Cut, let it droop, cut again.</div>
  </div>

  <h2><span class="glyph">&#x2702;</span> Deadheading the Center</h2>
  <div class="section-sub">His 5-turn finisher runs one enemy through for 230% ATK &#x2014;
    and the unit standing on the <b style="color:var(--ink)">center hex</b> of the enemy
    flower takes half again more. Keystones, standard bearers, wards: the game's best
    center-hex passives all become a reason to be cut first.</div>
  <div class="center-box">
    <div class="cut">
      <div class="who">Front or back hex</div>
      <div class="num">230%</div>
      <div class="what">ATK, single target</div>
    </div>
    <div class="cut center-cut">
      <div class="who">Center hex</div>
      <div class="num">345%</div>
      <div class="what">ATK &#x2014; the <b>+50%</b> center bonus, before crits and hexes</div>
    </div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Kit</h2>
  <div class="section-sub">A hex-scattering cutter, a triple war-paint, and the
    center-hunting shear &#x2014; with a garden that makes each feed the next.</div>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; no cooldown</div>
      <h3>Petalfall Cut</h3>
      <div class="meta">Single target &middot; <b>150% ATK</b> &middot; 2 random debuffs, 2 turns</div>
      <p>Carve one enemy, with a <b>50% chance</b> to scatter <b>two
      different hexes</b> from the seed packet over them. The bread-and-butter cut that keeps the garden planted.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +10% power &rsaquo; +20% land chance &rsaquo; +20% land chance &rsaquo; +10% land chance <i>&middot; max Lv 6</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; 4-turn cooldown &rarr; 2 fully levelled</div>
      <h3>Night Bloom</h3>
      <div class="meta">Self &middot; <b>+30% ATK, +30% DEF, +30% SPD</b> &middot; 3 turns</div>
      <p>Comes into flower: all three war paints at once. The DEF is what lets
      a carry statline <b>stand in the front row</b> and keep cutting.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +5% boon &rsaquo; +5% boon &rsaquo; +5% boon &rsaquo; +1 turn &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 7</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; 6-turn cooldown &rarr; 4 fully levelled</div>
      <h3>Deadheading</h3>
      <div class="meta">Single target &middot; <b>230% ATK</b> &middot; +50% vs the center hex</div>
      <p>Runs one enemy through. Against whoever holds the <b>center tile</b>,
      the thrust lands half again harder &#x2014; cut the central bloom first.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 8</i></div>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Wilting Garden</h3>
      <p>Deals <b>+10% damage per debuff on the target</b>, up to +60% &#x2014;
      flowers cut easiest once they droop. His own hexes count, and so does
      everyone else's.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Position bonus &middot; front hex</div>
      <h3>Reckless Charge</h3>
      <p>From a front hex: <b>deals 20% more damage, takes 10% more</b>.
      A blade with no guard &#x2014; Night Bloom is the guard.</p>
    </div>
  </div>

  <div class="dmg-table-box">
    <table>
      <thead>
        <tr><th style="text-align:left">Skill power by skill level</th>
          <th>Lv 1</th><th>Lv 2</th><th>Lv 3</th><th>Lv 4</th><th>Lv 5</th></tr>
      </thead>
      <tbody>
        <tr><th>Petalfall Cut, % ATK</th><td>150</td><td>165</td><td>180</td><td>195</td><td class="max">210</td></tr>
        <tr><th>Deadheading, % ATK</th><td>230</td><td>253</td><td>276</td><td>299</td><td class="max">322</td></tr>
        <tr><th>&nbsp;&nbsp;&#x2026;against the center hex</th><td>345</td><td>380</td><td>414</td><td>449</td><td class="max">483</td></tr>
      </tbody>
    </table>
    <div class="table-cap">Skill levels follow each skill&#x27;s own ladder &#x2014; see the <b>Skill ups</b> line on each card, and the level cap that comes with it. Levels are raised in Improve by sacrificing another copy. The hex draw, the war paints and the center bonus are fixed.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Animations</h2>
  <div class="section-sub">Hand-drawn 256px strips &#x2014; seven in all, from the resting
    sway to the fifteen-frame skewer.</div>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle animation"><div class="cap"><b>Idle</b></div><div class="note">the blade rests point-down</div></div>
    <div class="clip"><img src="%%petalfall%%" alt="Petalfall Cut animation"><div class="cap"><b>Petalfall Cut</b></div><div class="note">the dark burst blooms on frame 7</div></div>
    <div class="clip"><img src="%%nightbloom%%" alt="Night Bloom animation"><div class="cap"><b>Night Bloom</b></div><div class="note">the sweep that lights the sword white</div></div>
    <div class="clip"><img src="%%deadheading%%" alt="Deadheading animation"><div class="cap"><b>Deadheading</b></div><div class="note">fifteen frames; the skewer lands on 12</div></div>
    <div class="clip"><img src="%%death%%" alt="Death animation"><div class="cap"><b>Death</b></div><div class="note">freezes on the final pose</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Idle Fidget I</b></div><div class="note">plays every 8&#x2013;15s of idling</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Idle Fidget II</b></div><div class="note">a full flourish, slash trails and all</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Temporal Scroll &#x1f300;</div><div class="v">5&#x2605; band &middot; 3%</div></div>
    <div style="flex:1 1 300px"><div class="k">Where he comes from</div>
      <div style="font-size:13px;color:var(--muted)">Light and Dark heroes summon <em>only</em> from Temporal Scrolls
      &#x2014; 1% from any hunt or boss stage 15+, guaranteed every 50th tower floor,
      or 500 &#x1f48e; in the Shop. Pity guarantees a 5&#x2605; by the 40th pull.</div></div>
  </div>

  <div class="foot">Play him now at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a> &middot; Nightflower, order No. 6 &#x2014; the sect he ends up leading has eight other members, and every one of them exists to hand him a target that has already drooped.</div>
</div>
'''

for k, v in IMG.items():
    html = html.replace(f'%%{k}%%', v)

# Emit pure ASCII. A published artifact is wrapped in a <head> this file
# does not control, so it cannot declare its own charset; escaping means
# the glyphs never depend on one being supplied.
html = ''.join(c if ord(c) < 128 else f'&#x{ord(c):x};' for c in html)

out = '/home/user/browsergacha/docs/sawyer-sheet.html'
with open(out, 'w') as f:
    f.write(html)
print(out, os.path.getsize(out) // 1024, 'KB')
