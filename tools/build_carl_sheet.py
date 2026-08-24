import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Carl'
PANEL = (26, 19, 11, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('carlidle.png',    9,  5, 'idle'),
    ('carlidle1.png',   9,  6, 'fidget1'),
    ('carlidle2.png',   9,  7, 'fidget2'),
    ('carlskill1.png',  9, 12, 'clobber'),
    ('carlskill2.png',  9, 11, 'swing'),
    ('carlskill3.png',  9, 11, 'poledrive'),
    ('carldeath.png',   9,  7, 'death'),
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

html = r'''<title>Carl, Tentpole of the Firetroupe</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: tent canvas by torchlight. Ochre
     and iron on deep umber, set in a slab face that could hold a roof
     up. Every color painted explicitly. */
  :root {
    --ground: #17110a;
    --panel: #1a130b;
    --panel-2: #241a0f;
    --line: #4d3a1e;
    --ink: #f2e8d8;
    --muted: #a8937a;
    --canvas: #e8a83a;
    --torch: #ff9a5a;
    --canvas-dim: #8a6528;
    --display: 'Alfa Slab One', 'Georgia', serif;
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
  .eyebrow b { color: var(--canvas); font-weight: 500; }

  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art {
    flex: 0 0 300px; position: relative;
    background:
      radial-gradient(ellipse 62% 46% at 50% 62%, rgba(232,168,58,.15), transparent 70%),
      var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    min-height: 320px;
  }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag {
    position: absolute; top: 10px; left: 12px;
    font-size: 11px; letter-spacing: 2px; color: var(--canvas-dim);
    text-transform: uppercase;
  }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--canvas); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 {
    font-family: var(--display); font-weight: 400; font-size: 74px;
    line-height: 1; color: var(--ink); text-wrap: balance; letter-spacing: 3px;
    text-shadow: 0 6px 0 rgba(0,0,0,.35), 0 0 34px rgba(232,168,58,.35);
  }
  .title-line { font-size: 15px; color: var(--canvas); letter-spacing: 4px;
    font-family: var(--display); text-transform: uppercase; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge {
    font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px;
  }
  .badge.fire { border-color: var(--canvas-dim); color: var(--torch); }
  .badge.sect { border-color: var(--canvas); color: var(--canvas); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }

  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 16px;
  }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v {
    font-family: var(--display); font-size: 24px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.3;
  }
  .stat.hp .v { color: var(--canvas); }
  .stat .sub { font-size: 11px; color: var(--muted); }

  h2 {
    font-family: var(--display); font-weight: 400; font-size: 24px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 2px; text-transform: uppercase;
  }
  h2 .glyph { color: var(--canvas); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }

  .engine-box {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px;
    flex-wrap: wrap; align-items: center; justify-content: center;
    font-size: 13px; color: var(--muted); text-align: center;
  }
  .engine-step {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 250px;
  }
  .engine-step b { color: var(--canvas); font-weight: 500; }
  .engine-arrow { color: var(--canvas-dim); font-size: 20px; }

  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px;
  }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--canvas-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 400; font-size: 19px; letter-spacing: 1px; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--torch); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--canvas); font-weight: 500; }
  .ability.passive-card { border-color: var(--canvas-dim); }

  .dmg-table-box { margin-top: 22px; overflow-x: auto; background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; min-width: 620px; font-size: 13px; }
  th, td { padding: 9px 14px; text-align: right; font-variant-numeric: tabular-nums; }
  thead th { color: var(--muted); font-weight: 500; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid var(--line); }
  tbody th { text-align: left; font-weight: 500; color: var(--ink); white-space: nowrap; }
  tbody tr + tr td, tbody tr + tr th { border-top: 1px solid #33261a; }
  td.max { color: var(--canvas); font-weight: 600; }
  .table-cap { font-size: 12px; color: var(--muted); padding: 10px 14px 12px; }

  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }

  .acquire {
    margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap;
    align-items: baseline;
  }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-size: 18px; color: var(--canvas); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--torch); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>3&#x2605; Fire &middot; Firetroupe &middot; No. 5</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Carl idle animation, a broad red-clad strongman standing easy" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 3</span></div>
      <h1>CARL</h1>
      <div class="title-line">Tentpole of the Firetroupe</div>
      <div class="badges">
        <span class="badge fire">Fire</span>
        <span class="badge">Front-line tank</span>
        <span class="badge">HP-scaled swings</span>
        <span class="badge sect">Firetroupe &middot; third act</span>
      </div>
      <p class="lede">The troupe's load-bearing member. Carl's weapon is his
      own constitution: every swing deals a share of <b>his max HP</b>, and
      every blow he soaks makes that pool &#x2014; and therefore the next
      swing &#x2014; <b>permanently bigger</b>. Hitting him is feeding him.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat hp"><div class="k">HP</div><div class="v">2000</div><div class="sub">the weapon itself</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">100</div><div class="sub">stage dressing</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">155</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">95</div></div>
  </div>

  <h2><span class="glyph">&#x25a0;</span> The appetite</h2>
  <p class="section-sub">A tank whose damage grows from tanking: the loop
  only asks the enemy to keep doing what they were doing anyway.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Stand there.</b> On the front hex the
      Tentpole carries <b>+15% max HP</b> before anything happens.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Get hit.</b> Iron Appetite converts
      <b>10% of damage received into max HP</b>, up to +50% of his
      starting pool.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Hit back.</b> Every skill scales off max
      HP &#x2014; the beating he took is now in the swing.</div>
  </div>

  <h2><span class="glyph">&#x25a0;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Clobber</h3>
      <div class="meta">Single enemy &middot; <b>15% max HP</b></div>
      <p>Clobber one enemy for <b>15% of Carl's own max HP</b> as damage.
      No wind-up, no apology.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 3</div>
      <h3>Pole Swing</h3>
      <div class="meta">Single enemy &middot; <b>20% max HP</b></div>
      <p>Bring the tentpole around on one enemy for <b>20% of his own max
      HP</b> as damage.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 5</div>
      <h3>Bring Down the Pole</h3>
      <div class="meta">Single enemy &middot; <b>25% max HP &middot; +50% vs front row</b></div>
      <p>Drive the pole into one enemy for <b>25% of his own max HP</b>
      &#x2014; a <b>FRONT-row</b> victim takes 50% more. Tanks first.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Iron Appetite</h3>
      <div class="meta">On taking damage</div>
      <p>Gains max HP equal to <b>10% of damage received</b>, up to
      <b>+50% of his starting max HP</b> &#x2014; every beating makes him
      bigger.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Front hex</div>
      <h3>Tentpole</h3>
      <div class="meta">Front row &middot; <b>+15% max HP</b></div>
      <p>The whole show leans on him &#x2014; placed up front, the pole
      stands <b>15% taller</b>, and every swing with it.</p>
    </div>
  </div>

  <div class="dmg-table-box">
    <table>
      <thead><tr><th>Swing (base max HP 2000)</th><th>Backfield</th><th>Front hex (+15%)</th><th>Front hex, appetite full (+50%)</th></tr></thead>
      <tbody>
        <tr><th>Clobber (15%)</th><td>300</td><td>345</td><td>518</td></tr>
        <tr><th>Pole Swing (20%)</th><td>400</td><td>460</td><td>690</td></tr>
        <tr><th>Bring Down the Pole (25%)</th><td>500</td><td>575</td><td>863</td></tr>
        <tr><th>&#x2026;against a front-row victim (&#xd7;1.5)</th><td>750</td><td>863</td><td class="max">1294</td></tr>
      </tbody>
    </table>
    <p class="table-cap">Raw swing before defenses, level 1 stats, no gear.
    The appetite column reads the cap off the front-hex pool
    (2300 &#xd7; 1.5 = 3450 max HP), which is the fed strongman at
    full size.</p>
  </div>

  <h2><span class="glyph">&#x25a0;</span> The act</h2>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle sway"><div class="cap"><b>Idle</b> &middot; 9f</div><div class="note">Holding the roof up.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; 9f</div><div class="note">A stretch between shows.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; 9f</div><div class="note">Knuckles, cracked.</div></div>
    <div class="clip"><img src="%%clobber%%" alt="Clobber attack"><div class="cap"><b>Clobber</b> &middot; 9f</div><div class="note">The no-apology swing.</div></div>
    <div class="clip"><img src="%%swing%%" alt="Pole Swing"><div class="cap"><b>Pole Swing</b> &middot; 9f</div><div class="note">The pole comes around.</div></div>
    <div class="clip"><img src="%%poledrive%%" alt="Bring Down the Pole"><div class="cap"><b>Bring Down the Pole</b> &middot; 9f</div><div class="note">Tanks first.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; 9f</div><div class="note">The tent comes down with him.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Fire</div></div>
    <div><div class="k">Row</div><div class="v">Front</div></div>
    <div><div class="k">Summon</div><div class="v">Rare Scrolls &middot; 3&#x2605; band</div></div>
    <div><div class="k">Sect</div><div class="v">Firetroupe &middot; No. 5</div></div>
  </div>

  <p class="foot">Sheet drawn from the live hero definition
  (js/data/heroes/humans.js) and the uploaded spritesheets, untouched.
  Play at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a>.</p>
</div>
'''

for name, uri in IMG.items():
    html = html.replace(f'%%{name}%%', uri)

out = '/home/user/browsergacha/docs/carl-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
