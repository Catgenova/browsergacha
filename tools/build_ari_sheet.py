import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Ari'
PANEL = (14, 22, 24, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

# (file, frames, fps, clip name) — mirrors sprite.strips in the hero def.
STRIPS = [
    ('ariidle.png',    9,  5, 'idle'),
    ('ariidle1.png',   9,  6, 'fidget1'),
    ('ariidle2.png',   9,  6, 'fidget2'),
    ('ariskill1.png', 11, 12, 'crystbarb'),
    ('ariskill2.png', 12, 12, 'lancingshot'),
    ('ariskill3.png',  9, 11, 'marrowvolley'),
    ('arideath.png',   9,  7, 'death'),
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

html = r'''<title>Ari, Crystquiver</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Teko:wght@500;600&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: the hunt at first light. Deep
     spruce-dark ground, bowstring white, and the pale cyan of a drawn
     crystal arrow. Every ground and color is painted explicitly. */
  :root {
    --ground: #0c1416;
    --panel: #0e161a;
    --panel-2: #142024;
    --line: #2a444a;
    --ink: #eef4f4;
    --muted: #8aa4a6;
    --arrow: #82e4e0;
    --gleam: #cef8f4;
    --arrow-dim: #3f7c7c;
    --fletch: #e2ddc8;
    --display: 'Teko', 'Arial Narrow', sans-serif;
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
  .eyebrow b { color: var(--arrow); font-weight: 500; }

  /* ---- Hero header ---- */
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art {
    flex: 0 0 300px; position: relative;
    background:
      radial-gradient(ellipse 62% 46% at 50% 58%, rgba(130,228,224,.13), transparent 70%),
      var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    min-height: 320px;
  }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag {
    position: absolute; top: 10px; left: 12px;
    font-size: 11px; letter-spacing: 2px; color: var(--arrow-dim);
    text-transform: uppercase;
  }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--gleam); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 {
    font-family: var(--display); font-weight: 600; font-size: 96px;
    line-height: .9; color: var(--ink); text-wrap: balance; letter-spacing: 6px;
    text-shadow: 0 0 32px rgba(130,228,224,.4);
  }
  .title-line { font-size: 18px; color: var(--arrow); letter-spacing: 6px;
    font-family: var(--display); text-transform: uppercase; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge {
    font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px;
  }
  .badge.water { border-color: var(--arrow-dim); color: var(--arrow); }
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
    font-family: var(--display); font-size: 34px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.1;
  }
  .stat.atk .v { color: var(--arrow); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  .stats-note { font-size: 12px; color: var(--muted); margin-top: 8px; }

  /* ---- Sections ---- */
  h2 {
    font-family: var(--display); font-weight: 600; font-size: 34px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 3px; text-transform: uppercase;
  }
  h2 .glyph { color: var(--arrow); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }

  /* ---- The quiver (three arrows) ---- */
  .quiver-box {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px 16px; overflow-x: auto;
  }
  .quiver { display: grid; grid-template-columns: repeat(3, minmax(190px, 1fr)); gap: 14px; min-width: 620px; }
  .arrowcard {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 16px; text-align: center;
  }
  .arrowcard .who { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .arrowcard .num {
    font-family: var(--display); font-size: 52px; line-height: 1;
    color: var(--arrow); font-variant-numeric: tabular-nums;
  }
  .arrowcard .what { font-size: 12px; color: var(--muted); }
  .arrowcard .what b { color: var(--ink); font-weight: 500; }
  .quiver-cap { font-size: 12px; color: var(--muted); margin-top: 14px; }
  .quiver-cap b { color: var(--arrow); font-weight: 500; }

  /* ---- The free arrow ---- */
  .free-box {
    margin-top: 22px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 22px 24px; display: flex; gap: 20px;
    flex-wrap: wrap; align-items: center;
  }
  .free-box .flash {
    font-family: var(--display); font-size: 44px; color: var(--gleam);
    line-height: 1; letter-spacing: 2px; text-shadow: 0 0 24px rgba(130,228,224,.5);
  }
  .free-box .what { flex: 1 1 300px; font-size: 13px; color: var(--muted); }
  .free-box .what b { color: var(--ink); font-weight: 500; }

  /* ---- Abilities ---- */
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px;
  }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--arrow-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 600; font-size: 27px; letter-spacing: 1px; line-height: 1; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--gleam); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--arrow); font-weight: 500; }
  .ability.passive-card { border-color: var(--arrow-dim); }

  .dmg-table-box { margin-top: 22px; overflow-x: auto; background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; min-width: 620px; font-size: 13px; }
  th, td { padding: 9px 14px; text-align: right; font-variant-numeric: tabular-nums; }
  thead th { color: var(--muted); font-weight: 500; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid var(--line); }
  tbody th { text-align: left; font-weight: 500; color: var(--ink); white-space: nowrap; }
  tbody tr + tr td, tbody tr + tr th { border-top: 1px solid #1a2c30; }
  td.max { color: var(--arrow); font-weight: 600; }
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
  .acquire .v { font-family: var(--display); font-size: 26px; color: var(--gleam); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--arrow); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>3&#x2605; Water &middot; Back-line DPS</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Ari idle animation, a hooded archer with a crystal-strung bow" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 3</span></div>
      <h1>ARI</h1>
      <div class="title-line">Crystquiver</div>
      <div class="badges">
        <span class="badge water">&#x1f4a7; Water</span>
        <span class="badge">Back-line DPS</span>
        <span class="badge">Freeze finisher</span>
      </div>
      <p class="lede">The huntress who walks behind the winter. Ari's three
      arrows each cheat a different way &#x2014; one slips armor, one taxes the
      victim's own bulk &#x2014; and the moment <b>anyone's ice</b> locks an
      enemy solid, her bow answers on its own: <b>a free Crystbarb into the
      frozen quarry</b>, no turn spent.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1080</div></div>
    <div class="stat atk"><div class="k">ATK</div><div class="v">240</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">88</div><div class="sub">the back row is the armor</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">105</div></div>
    <div class="stat"><div class="k">Crit</div><div class="v">15%</div><div class="sub">&#xd7;1.5 damage</div></div>
  </div>
  <div class="stats-note">Base values at level 1 &#x2014; stats scale with level and &#x2605; ascension like every hero.</div>

  <h2><span class="glyph">&#x27B3;</span> Three Arrows, Three Cheats</h2>
  <div class="section-sub">Every shot is single-target, and each one gets past the
    defender's math a different way.</div>
  <div class="quiver-box">
    <div class="quiver">
      <div class="arrowcard">
        <div class="who">Crystbarb &middot; every turn</div>
        <div class="num">110%</div>
        <div class="what">ATK &middot; <b>no cooldown</b> &#x2014; and the arrow her passive fires free</div>
      </div>
      <div class="arrowcard">
        <div class="who">Lancing Shot &middot; 3-turn cooldown</div>
        <div class="num">135%</div>
        <div class="what">ATK &middot; slips past <b>10% of the target's DEF</b></div>
      </div>
      <div class="arrowcard">
        <div class="who">Marrow Volley &middot; 5-turn cooldown</div>
        <div class="num">140%</div>
        <div class="what">ATK <b>+ 5% of the target's max HP</b> folded into the blow</div>
      </div>
    </div>
    <div class="quiver-cap">From a back hex, <b>Giantslayer</b> adds another 2% of the
      target's max HP to every one of them &#x2014; the bigger the target, the more the
      quiver charges.</div>
  </div>

  <h2><span class="glyph">&#x2746;</span> The Free Arrow</h2>
  <div class="section-sub">Her passive turns every freeze on the field into her
    damage. Polarus's court freezes constantly &#x2014; his bolt, his crystal, his
    winter &#x2014; and Angelica's ladder rolls every turn. Each one is an arrow.</div>
  <div class="free-box">
    <div class="flash">FREEZE &#x2192; CRYSTBARB</div>
    <div class="what">The moment an enemy is frozen &#x2014; <b>by anyone</b> &#x2014;
      Ari casts Crystbarb at them immediately, <b>without spending a turn</b>. A frozen
      enemy can't dodge their turn back: they stand there and take the follow-up.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Kit</h2>
  <div class="section-sub">Three cheating arrows and the instinct that looses a
    fourth whenever the ice sets.</div>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; no cooldown</div>
      <h3>Crystbarb</h3>
      <div class="meta">Single target &middot; <b>110% ATK</b></div>
      <p>A crystal-tipped arrow, drawn and loosed clean. The drumbeat &#x2014;
      and the shot her passive repeats <b>for free</b>.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; 3-turn cooldown</div>
      <h3>Lancing Shot</h3>
      <div class="meta">Single target &middot; <b>135% ATK</b> &middot; ignores 10% DEF</div>
      <p>The bow charged to full crystal glow. The point finds the seams:
      a tenth of the target's armor <b>simply isn't there</b>.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; 5-turn cooldown</div>
      <h3>Marrow Volley</h3>
      <div class="meta">Single target &middot; <b>140% ATK + 5% target max HP</b></div>
      <p>A fanned volley that charges by the pound: the blow folds in
      <b>a twentieth of whatever the target is made of</b>.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Frozen Quarry</h3>
      <p>When an enemy becomes frozen &#x2014; anyone's ice &#x2014; she
      <b>casts Crystbarb on them instantly</b>, free of charge and outside
      the turn order.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Position bonus &middot; back hex</div>
      <h3>Giantslayer</h3>
      <p>Attacks add <b>2% of the target's max HP</b> to the damage. The
      bigger they are, the harder she hits them.</p>
    </div>
  </div>

  <div class="dmg-table-box">
    <table>
      <thead>
        <tr><th style="text-align:left">Skill power by skill level</th>
          <th>Lv 1</th><th>Lv 2</th><th>Lv 3</th><th>Lv 4</th><th>Lv 5</th></tr>
      </thead>
      <tbody>
        <tr><th>Crystbarb, % ATK</th><td>110</td><td>121</td><td>132</td><td>143</td><td class="max">154</td></tr>
        <tr><th>Lancing Shot, % ATK</th><td>135</td><td>149</td><td>162</td><td>176</td><td class="max">189</td></tr>
        <tr><th>Marrow Volley, % ATK</th><td>140</td><td>154</td><td>168</td><td>182</td><td class="max">196</td></tr>
      </tbody>
    </table>
    <div class="table-cap">Skill levels add +10% power per level (max Lv 5) &#x2014; raised in Improve
      by sacrificing another Ari. The DEF bypass and both max-HP riders are fixed shares, outside the scaling.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Animations</h2>
  <div class="section-sub">Hand-drawn 256px strips &#x2014; seven in all, the two big
    shots running eleven and twelve frames.</div>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle animation"><div class="cap"><b>Idle</b></div><div class="note">an arrow always nocked</div></div>
    <div class="clip"><img src="%%crystbarb%%" alt="Crystbarb animation"><div class="cap"><b>Crystbarb</b></div><div class="note">eleven frames; the arrow flies on 8</div></div>
    <div class="clip"><img src="%%lancingshot%%" alt="Lancing Shot animation"><div class="cap"><b>Lancing Shot</b></div><div class="note">twelve frames; full crystal glow before the loose</div></div>
    <div class="clip"><img src="%%marrowvolley%%" alt="Marrow Volley animation"><div class="cap"><b>Marrow Volley</b></div><div class="note">the fan opens on frame 7</div></div>
    <div class="clip"><img src="%%death%%" alt="Death animation"><div class="cap"><b>Death</b></div><div class="note">freezes on the final pose</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Idle Fidget I</b></div><div class="note">plays every 8&#x2013;15s of idling</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Idle Fidget II</b></div><div class="note">plays every 8&#x2013;15s of idling</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Common Scroll &#x1f4dc;</div><div class="v">3&#x2605; band &middot; 10%</div></div>
    <div><div class="k">Rare Scroll &#x1f4dc;</div><div class="v">3&#x2605; band &middot; 80%</div></div>
    <div style="flex:1 1 260px"><div class="k">Where she comes from</div>
      <div style="font-size:13px;color:var(--muted)">Water heroes summon from Common and Rare
      Scrolls alike &#x2014; a 3&#x2605; is the Rare Scroll's bread and butter.</div></div>
  </div>

  <div class="foot">Play her now at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a> &middot; the huntress of the Cryst crystal &#x2014; no sect pin, but wherever the King's winter goes, her arrows follow.</div>
</div>
'''

for k, v in IMG.items():
    html = html.replace(f'%%{k}%%', v)

# Emit pure ASCII. A published artifact is wrapped in a <head> this file
# does not control, so it cannot declare its own charset; escaping means
# the glyphs never depend on one being supplied.
html = ''.join(c if ord(c) < 128 else f'&#x{ord(c):x};' for c in html)

out = '/home/user/browsergacha/docs/ari-sheet.html'
with open(out, 'w') as f:
    f.write(html)
print(out, os.path.getsize(out) // 1024, 'KB')
