import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Bit'
PANEL = (14, 18, 24, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

# (file, frames, fps, clip name) — mirrors sprite.strips in the hero def.
STRIPS = [
    ('bitidle.png',    9,  5, 'idle'),
    ('bitidle1.png',   9,  6, 'fidget1'),
    ('bitidle2.png',   9,  6, 'fidget2'),
    ('bitskill1.png',  9, 11, 'boresweep'),
    ('bitskill2.png',  9, 11, 'coresample'),
    ('bitskill3.png', 15, 12, 'breakthrough'),
    ('bitdeath.png',   9,  7, 'death'),
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

html = r'''<title>Bit, Engine of Cryst</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Audiowide&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: the machine hall. Crystal-machine
     blue and worked brass on dark iron — the court's industry, not its
     throne room. Every ground and color is painted explicitly. */
  :root {
    --ground: #0b0f14;
    --panel: #0e1218;
    --panel-2: #141a22;
    --line: #2c4258;
    --ink: #ecf3f8;
    --muted: #8ba2b4;
    --crystal: #5ec2f0;
    --gleam: #bfe9ff;
    --crystal-dim: #33688a;
    --brass: #cf9a44;
    --display: 'Audiowide', 'Trebuchet MS', sans-serif;
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
  .eyebrow b { color: var(--crystal); font-weight: 500; }

  /* ---- Hero header ---- */
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art {
    flex: 0 0 300px; position: relative;
    background:
      radial-gradient(ellipse 62% 46% at 50% 58%, rgba(94,194,240,.14), transparent 70%),
      var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    min-height: 320px;
  }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag {
    position: absolute; top: 10px; left: 12px;
    font-size: 11px; letter-spacing: 2px; color: var(--crystal-dim);
    text-transform: uppercase;
  }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--gleam); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 {
    font-family: var(--display); font-weight: 400; font-size: 84px;
    line-height: .95; color: var(--ink); text-wrap: balance; letter-spacing: 4px;
    text-shadow: 0 0 34px rgba(94,194,240,.4);
  }
  .title-line { font-size: 15px; color: var(--crystal); letter-spacing: 5px;
    font-family: var(--display); text-transform: uppercase; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge {
    font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px;
  }
  .badge.water { border-color: var(--crystal-dim); color: var(--crystal); }
  .badge.sect { border-color: var(--brass); color: var(--brass); }
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
    font-family: var(--display); font-size: 28px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.2;
  }
  .stat.def .v { color: var(--crystal); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  .stats-note { font-size: 12px; color: var(--muted); margin-top: 8px; }

  /* ---- Sections ---- */
  h2 {
    font-family: var(--display); font-weight: 400; font-size: 24px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 3px; text-transform: uppercase;
  }
  h2 .glyph { color: var(--crystal); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }

  /* ---- The drill heads ---- */
  .heads-box {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px 16px; overflow-x: auto;
  }
  .heads { display: grid; grid-template-columns: repeat(3, minmax(190px, 1fr)); gap: 14px; min-width: 620px; }
  .head {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 16px; text-align: center;
  }
  .head .who { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .head .num {
    font-family: var(--display); font-size: 42px; line-height: 1.1;
    color: var(--crystal); font-variant-numeric: tabular-nums;
  }
  .head .what { font-size: 12px; color: var(--muted); }
  .head .what b { color: var(--ink); font-weight: 500; }
  .heads-cap { font-size: 12px; color: var(--muted); margin-top: 14px; }
  .heads-cap b { color: var(--crystal); font-weight: 500; }

  /* ---- The hardening loop ---- */
  .loop-box {
    margin-top: 22px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 22px 20px; display: flex; gap: 12px;
    flex-wrap: wrap; align-items: center; justify-content: center;
    font-size: 13px; color: var(--muted); text-align: center;
  }
  .loop-step {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink);
  }
  .loop-step b { color: var(--crystal); font-weight: 500; }
  .loop-arrow { color: var(--crystal-dim); font-size: 20px; }

  /* ---- Abilities ---- */
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px;
  }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--crystal-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 400; font-size: 19px; letter-spacing: 1px; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--gleam); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--crystal); font-weight: 500; }
  .ability.passive-card { border-color: var(--crystal-dim); }

  .dmg-table-box { margin-top: 22px; overflow-x: auto; background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; min-width: 620px; font-size: 13px; }
  th, td { padding: 9px 14px; text-align: right; font-variant-numeric: tabular-nums; }
  thead th { color: var(--muted); font-weight: 500; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid var(--line); }
  tbody th { text-align: left; font-weight: 500; color: var(--ink); white-space: nowrap; }
  tbody tr + tr td, tbody tr + tr th { border-top: 1px solid #1a2530; }
  td.max { color: var(--crystal); font-weight: 600; }
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
  .acquire .v { font-family: var(--display); font-size: 20px; color: var(--gleam); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--crystal); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>5&#x2605; Water &middot; Cryst Sect &middot; No. 1</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Bit idle animation, a hulking crystal construct with a drill for an arm" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 5</span></div>
      <h1>BIT</h1>
      <div class="title-line">Engine of Cryst</div>
      <div class="badges">
        <span class="badge water">&#x1f4a7; Water</span>
        <span class="badge">Front-row tank</span>
        <span class="badge">DEF-scaled DPS</span>
        <span class="badge sect">Cryst Sect &middot; the engine</span>
      </div>
      <p class="lede">The court didn't hire its digging done &#x2014; it <b>built
      the digger</b>, out of its own crystal, around the biggest drill the mine
      ever cut. Every number in Bit's kit scales off <b>his DEF</b>: the wall
      is the weapon, and everything that hardens the wall sharpens it.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">2180</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">76</div><div class="sub">ceremonial — see DEF</div></div>
    <div class="stat def"><div class="k">DEF</div><div class="v">263</div><div class="sub">the stat every skill swings with</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">90</div></div>
    <div class="stat"><div class="k">Crit</div><div class="v">15%</div><div class="sub">&#xd7;1.5 damage</div></div>
  </div>
  <div class="stats-note">Base values at level 1 &#x2014; stats scale with level and &#x2605; ascension like every hero.</div>

  <h2><span class="glyph">&#x2699;</span> Three Drill Heads</h2>
  <div class="section-sub">All three casts are shares of <b style="color:var(--ink)">his
    DEF</b>, mitigated like any hit — a big DEF stat is not a way around the curve,
    it's just his ATK by another name.</div>
  <div class="heads-box">
    <div class="heads">
      <div class="head">
        <div class="who">Bore Sweep &middot; every turn</div>
        <div class="num">80%</div>
        <div class="what">DEF to the <b>enemy front row</b>, and 30% of their DEF stripped for a turn</div>
      </div>
      <div class="head">
        <div class="who">Core Sample &middot; 3-turn cooldown</div>
        <div class="num">125%</div>
        <div class="what">DEF into <b>one enemy</b> — the bit at full bore</div>
      </div>
      <div class="head">
        <div class="who">Breakthrough &middot; 5-turn cooldown</div>
        <div class="num">90%</div>
        <div class="what">DEF to the <b>front row AND center</b> — the wall and its keystone at once</div>
      </div>
    </div>
    <div class="heads-cap">The Bore Sweep's DEF strip is team service: <b>everyone's
      next hit lands harder</b>, not just his.</div>
  </div>

  <h2><span class="glyph">&#x2692;</span> Case-Hardened</h2>
  <div class="section-sub">His passive rewards exactly what a tank wants anyway: carrying
    a DEF buff turns on <b style="color:var(--ink)">+20% damage</b>. Andrew's Shore Up,
    water resonance, any rally — the harder the shell, the harder it drills.</div>
  <div class="loop-box">
    <span class="loop-step">A DEF buff lands <b>&#x25a3;</b></span>
    <span class="loop-arrow">&#x2192;</span>
    <span class="loop-step">DEF rises &#x2014; <b>every cast pays more</b></span>
    <span class="loop-arrow">+</span>
    <span class="loop-step">Case-Hardened: <b>&#xd7;1.20</b> on top</span>
    <span class="loop-arrow">&#x2192;</span>
    <span class="loop-step">the buffed wall <b>out-hits the carries</b></span>
  </div>

  <h2><span class="glyph">&#x2726;</span> Kit</h2>
  <div class="section-sub">Three drill settings, a hardening clause, and the hex he
    was poured to stand on.</div>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; no cooldown</div>
      <h3>Bore Sweep</h3>
      <div class="meta">Enemy front row &middot; <b>80% DEF each</b> &middot; &#x2212;30% DEF, 1 turn</div>
      <p>The drill dragged across the enemy line. It grinds <b>and</b> it
      strips &#x2014; the wall ahead is softer for whoever swings next.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; 3-turn cooldown</div>
      <h3>Core Sample</h3>
      <div class="meta">Single target &middot; <b>125% DEF</b></div>
      <p>The bit swells to full bore and goes <b>through</b> one enemy.
      Geology as a threat.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; 5-turn cooldown</div>
      <h3>Breakthrough</h3>
      <div class="meta">Front row + center &middot; <b>90% DEF each</b></div>
      <p>Fifteen frames of wind-up and the wall comes down &#x2014; the
      front line and the <b>keystone behind it</b> in one drive.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Case-Hardened</h3>
      <p>While carrying a <b>DEF buff</b>, damage is increased 20%. Buff
      the tank; the tank returns the favor.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Position bonus &middot; front hex</div>
      <h3>Bedrock</h3>
      <p><b>+25% DEF</b> from a front hex &#x2014; which is +25% to every
      number in his kit. Some things you build on.</p>
    </div>
  </div>

  <div class="dmg-table-box">
    <table>
      <thead>
        <tr><th style="text-align:left">Skill power by skill level (% of his DEF)</th>
          <th>Lv 1</th><th>Lv 2</th><th>Lv 3</th><th>Lv 4</th><th>Lv 5</th></tr>
      </thead>
      <tbody>
        <tr><th>Bore Sweep, each</th><td>80</td><td>88</td><td>96</td><td>104</td><td class="max">112</td></tr>
        <tr><th>Core Sample</th><td>125</td><td>138</td><td>150</td><td>163</td><td class="max">175</td></tr>
        <tr><th>Breakthrough, each</th><td>90</td><td>99</td><td>108</td><td>117</td><td class="max">126</td></tr>
      </tbody>
    </table>
    <div class="table-cap">Skill levels add +10% power per level (max Lv 5) &#x2014; raised in Improve
      by sacrificing another Bit. The DEF strip, the hardening and Bedrock are fixed.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Animations</h2>
  <div class="section-sub">Hand-drawn 256px strips &#x2014; seven in all, the
    breakthrough running fifteen frames.</div>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle animation"><div class="cap"><b>Idle</b></div><div class="note">the engine idles heavy</div></div>
    <div class="clip"><img src="%%boresweep%%" alt="Bore Sweep animation"><div class="cap"><b>Bore Sweep</b></div><div class="note">the drill bites on frame 6</div></div>
    <div class="clip"><img src="%%coresample%%" alt="Core Sample animation"><div class="cap"><b>Core Sample</b></div><div class="note">full bore before the slam</div></div>
    <div class="clip"><img src="%%breakthrough%%" alt="Breakthrough animation"><div class="cap"><b>Breakthrough</b></div><div class="note">fifteen frames; the drive lands on 10</div></div>
    <div class="clip"><img src="%%death%%" alt="Death animation"><div class="cap"><b>Death</b></div><div class="note">the crystal comes apart</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Idle Fidget I</b></div><div class="note">plays every 8&#x2013;15s of idling</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Idle Fidget II</b></div><div class="note">plays every 8&#x2013;15s of idling</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Rare Summon Scroll &#x1f4dc;</div><div class="v">5&#x2605; band &middot; 2%</div></div>
    <div style="flex:1 1 300px"><div class="k">Where he comes from</div>
      <div style="font-size:13px;color:var(--muted)">Water heroes summon from Common and Rare Scrolls
      &#x2014; the 5&#x2605; band lives on the Rare Scroll only. Pity guarantees a
      5&#x2605; by the 40th pull.</div></div>
  </div>

  <div class="foot">Play him now at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a> &middot; seventh of the Cryst sect &#x2014; the court runs seven strong now, and the engine walks in front.</div>
</div>
'''

for k, v in IMG.items():
    html = html.replace(f'%%{k}%%', v)

# Emit pure ASCII. A published artifact is wrapped in a <head> this file
# does not control, so it cannot declare its own charset; escaping means
# the glyphs never depend on one being supplied.
html = ''.join(c if ord(c) < 128 else f'&#x{ord(c):x};' for c in html)

out = '/home/user/browsergacha/docs/bit-sheet.html'
with open(out, 'w') as f:
    f.write(html)
print(out, os.path.getsize(out) // 1024, 'KB')
