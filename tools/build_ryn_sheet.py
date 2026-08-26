import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Ryn'
PANEL = (14, 19, 18, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('rynidle.png',   7, 'idle'),
    ('rynidle1.png',  6, 'fidget1'),
    ('rynidle2.png',  7, 'fidget2'),
    ('rynskill1.png', 14, 'crosscut'),
    ('rynskill2.png', 14, 'shear'),
    ('rynskill3.png', 14, 'gale'),
    ('ryndeath.png',   8, 'death'),
]

def clip(fname, fps):
    im = Image.open(f'{SRC}/{fname}').convert('RGBA')
    w, h = im.size
    frames = max(1, round(w / h))
    fw = w // frames
    cells = []
    for i in range(frames):
        # Authored facing left; mirrored here to match the board's
        # facing-right convention (the asset files stay untouched).
        cell = im.crop((i * fw, 0, (i + 1) * fw, h)).transpose(Image.FLIP_LEFT_RIGHT)
        bg = Image.new('RGBA', cell.size, PANEL)
        bg.alpha_composite(cell)
        cells.append(bg.convert('RGB').resize((SIZE, SIZE), Image.NEAREST))
    buf = io.BytesIO()
    cells[0].save(buf, format='GIF', save_all=True, append_images=cells[1:],
                  duration=int(1000 / fps), loop=0, optimize=True)
    return 'data:image/gif;base64,' + base64.b64encode(buf.getvalue()).decode(), frames

IMG, NF = {}, {}
for f, fps, name in STRIPS:
    IMG[name], NF[name] = clip(f, fps)

html = r'''<title>Ryn, Crosswind of the Whisperchime</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: moving air. Iron-dark green under
     brass edge and dust, set in Archivo Black's blunt weight. Every
     color painted explicitly. */
  :root {
    --ground: #0d1110;
    --panel: #0e1312;
    --panel-2: #171f1b;
    --line: #35482f;
    --ink: #f0f2e8;
    --muted: #94a48c;
    --leaf: #e8c86a;
    --vellum: #dfe6cf;
    --leaf-dim: #6f6a30;
    --display: 'Archivo Black', 'Georgia', sans-serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink);
    font-family: var(--mono); font-size: 15px; line-height: 1.65; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }
  .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px; }
  .eyebrow b { color: var(--leaf); font-weight: 500; }
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art { flex: 0 0 300px; position: relative;
    background: radial-gradient(ellipse 62% 46% at 50% 62%, rgba(232,200,106,.13), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--leaf-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--leaf); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 400; font-size: 58px; line-height: 1.05;
    color: var(--ink); text-wrap: balance; letter-spacing: 2px;
    text-shadow: 0 4px 0 rgba(0,0,0,.5), 0 0 34px rgba(232,200,106,.26); }
  .title-line { font-size: 15px; color: var(--leaf); letter-spacing: 2px;
    font-family: var(--display); }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.light { border-color: var(--leaf-dim); color: var(--leaf); }
  .badge.sect { border-color: var(--vellum); color: var(--vellum); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-size: 22px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.35; }
  .stat.spd .v { color: var(--leaf); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  h2 { font-family: var(--display); font-weight: 400; font-size: 24px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 1px; }
  h2 .glyph { color: var(--leaf); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .engine-box { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    justify-content: center; font-size: 13px; color: var(--muted); text-align: center; }
  .engine-step { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 250px; }
  .engine-step b { color: var(--leaf); font-weight: 500; }
  .engine-arrow { color: var(--leaf-dim); font-size: 20px; }
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--leaf-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 400; font-size: 18px; letter-spacing: 1px; }
  .ability .ladder { margin-top: 10px; padding-top: 9px;
    border-top: 1px solid var(--line); font-family: var(--mono);
    font-size: 11px; line-height: 1.7; color: var(--muted); }
  .ability .ladder b { color: var(--ink); font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase; font-size: 10px; }
  .ability .ladder i { font-style: normal; color: var(--ink); }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--vellum); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--leaf); font-weight: 500; }
  .ability.passive-card { border-color: var(--leaf-dim); }
  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }
  .acquire { margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap; align-items: baseline; }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-size: 16px; color: var(--leaf); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--leaf); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>4&#x2605; Wind &middot; Whisperchime &middot; No. 7</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Ryn idle animation, a lean fighter with a green scarf holding two curved brass chakrams" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 4</span></div>
      <h1>RYN</h1>
      <div class="title-line">Crosswind of the Whisperchime</div>
      <div class="badges">
        <span class="badge light">Wind</span>
        <span class="badge">Front-line DPS</span>
        <span class="badge">Speed &middot; Breakpoints</span>
        <span class="badge sect">Whisperchime &middot; No. 7</span>
      </div>
      <p class="lede">No utility, no apology. Three swings of the same
      pair of chakrams &#x2014; what makes her frightening is underneath
      them: <b>Terminal Velocity</b> reads her SPEED and pays it back as
      damage, <b>+20% for every full 50</b>. Every point of haste on this
      hero is damage waiting for the next <b>breakpoint</b>.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1140</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">108</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">75</div></div>
    <div class="stat spd"><div class="k">SPD</div><div class="v">128</div><div class="sub">also her damage stat</div></div>
  </div>

  <h2><span class="glyph">&#x00BB;</span> The breakpoints</h2>
  <p class="section-sub">The passive steps, it does not slide: 149 SPD
  pays exactly what 100 does. Building Ryn means hunting the next
  threshold, from gear, from her hex, or from an ally.</p>
  <div class="engine-box">
    <div class="engine-step"><b>100 SPD &#x2014; &times;1.4.</b> Two full
      fifties. Where she starts, near enough.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>150 SPD &#x2014; &times;1.6.</b> The real
      target. Her front hex plus SPD boots gets most of the way.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>200 SPD &#x2014; &times;1.8.</b> Buff
      territory: a tempo skill can carry her there for two turns.</div>
  </div>

  <h2><span class="glyph">&#x00BB;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Crosscut</h3>
      <div class="meta">Single enemy &middot; <b>100% ATK</b></div>
      <p>One clean pass of both chakrams: <b>100% ATK</b> to a single
      enemy, every turn, forever.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power <i>&middot; max Lv 6</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 4 &rarr; 2 fully levelled</div>
      <h3>Shear</h3>
      <div class="meta">Single enemy &middot; <b>140% ATK</b></div>
      <p>Both blades through the same gap: <b>140% ATK</b> to a single
      enemy.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 7</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 6 &rarr; 4 fully levelled</div>
      <h3>Scything Gale</h3>
      <div class="meta">Enemy front row &middot; <b>130% ATK</b></div>
      <p>A running cut down the whole line: <b>130% ATK</b> to the enemy
      <b>FRONT row</b>.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 8</i></div>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Terminal Velocity</h3>
      <div class="meta">Scales on her own SPD</div>
      <p>Deals <b>20% more damage for every full 50 SPD</b> she has, read
      as she fights &#x2014; gear, her hex and any ally's tempo buff all
      count toward the next step.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Front hex</div>
      <h3>Headwind</h3>
      <div class="meta">Front row &middot; <b>+10% SPD</b></div>
      <p>Out front, where the wind is already moving: <b>+10% SPD</b>
      &#x2014; which on this hero is not just turn order, it is damage.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x00BB;</span> Who she wants beside her</h2>
  <p class="section-sub">Ryn is the sect's payoff for tempo. Anything
  that hands her speed hands her damage, and the Whisperchime is full of
  it.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Tumble's Quickstep.</b> +30% team SPD
      takes her from <b>141 to 183</b> on the front hex &#x2014; straight
      through the 150 step, &times;1.4 to &times;1.6.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>SPD boots.</b> The only slot that rolls
      flat speed, and the cheapest road to a threshold.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Ilyra behind her.</b> Cleansing a SPD
      debuff off Ryn is worth a fifth of her damage.</div>
  </div>

  <h2><span class="glyph">&#x00BB;</span> Frames</h2>
  <p class="section-sub">Seven strips, nine frames each. Authored facing
  left, flagged rather than mirrored &#x2014; the files ship untouched.</p>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">Both blades, low.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">A roll of the wrist.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">Shifting weight forward.</div></div>
    <div class="clip"><img src="%%crosscut%%" alt="Crosscut"><div class="cap"><b>Crosscut</b> &middot; %%nf_crosscut%%f</div><div class="note">One pass.</div></div>
    <div class="clip"><img src="%%shear%%" alt="Shear"><div class="cap"><b>Shear</b> &middot; %%nf_shear%%f</div><div class="note">Both through one gap.</div></div>
    <div class="clip"><img src="%%gale%%" alt="Scything Gale"><div class="cap"><b>Scything Gale</b> &middot; %%nf_gale%%f</div><div class="note">Down the whole line.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">Still at last.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Wind</div></div>
    <div><div class="k">Rarity</div><div class="v">4&#x2605;</div></div>
    <div><div class="k">Role</div><div class="v">Front-line DPS</div></div>
    <div><div class="k">Sect</div><div class="v">Whisperchime &middot; No. 7</div></div>
  </div>

  <p class="foot">Sheet drawn from the live hero definition
  (js/data/heroes/humans.js) and the uploaded spritesheets, untouched.
  Play at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a>.</p>
</div>
'''

for name, uri in IMG.items():
    html = html.replace(f'%%{name}%%', uri)
    html = html.replace(f'%%nf_{name}%%', str(NF[name]))

out = '/home/user/browsergacha/docs/ryn-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
