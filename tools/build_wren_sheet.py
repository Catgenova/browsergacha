import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Wren'
PANEL = (16, 19, 21, 255)   # --panel-2, so a clip has no visible box around it
SIZE = 280

# The uploaded strips are wired to the skills they ACTUALLY animate --
# skill1's file is her third skill, 'skill 2 3' is her second, skill3's
# file is her first. Filenames are read exactly as delivered, space and
# all; nothing on disk is renamed.
STRIPS = [
    ('wrenidle.png',      7, 'idle'),
    ('wrenidle1.png',     6, 'fidget1'),
    ('wrenidle2.png',     7, 'fidget2'),
    ('wrenskill3.png',   11, 'breakwater'),
    ('wrenskill 2 3.png', 11, 'shoulder'),
    ('wrenskill1.png',   11, 'haul'),
    ('wrendeath.png',     8, 'death'),
]

def clip(fname, fps):
    im = Image.open(f'{SRC}/{fname}').convert('RGBA')
    w, h = im.size
    frames = max(1, round(w / h))
    fw = w // frames
    cells = []
    for i in range(frames):
        # Authored facing right; drawn as delivered.
        cell = im.crop((i * fw, 0, (i + 1) * fw, h))
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

html = r'''<title>Wren, Windbreak of the Whisperchime</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: wet stone at the harbour wall. Cold
     slate ground, salt-white ink, a single bar of sea-glass green for
     everything that moves. Bodoni Moda's high-contrast cut against a
     mono, because she is a wall with an edge on it. Every color painted
     explicitly, so the page holds on either host ground. */
  :root {
    --ground: #0b0e10;
    --panel: #101315;
    --panel-2: #171c1f;
    --line: #2f3c40;
    --ink: #eef3f2;
    --muted: #8fa3a3;
    --glass: #7fd6bd;
    --glass-dim: #3d6f63;
    --salt: #d9e6e4;
    --display: 'Bodoni Moda', 'Didot', Georgia, serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink);
    font-family: var(--mono); font-size: 15px; line-height: 1.65; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }
  .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px; }
  .eyebrow b { color: var(--glass); font-weight: 500; }
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art { flex: 0 0 300px; position: relative;
    background: radial-gradient(ellipse 62% 46% at 50% 62%, rgba(127,214,189,.12), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--glass-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--glass); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 700; font-size: 76px; line-height: 1.02;
    color: var(--ink); text-wrap: balance; letter-spacing: 1px;
    text-shadow: 0 4px 0 rgba(0,0,0,.55), 0 0 34px rgba(127,214,189,.22); }
  .title-line { font-size: 15px; color: var(--glass); letter-spacing: 2px;
    font-family: var(--display); font-style: italic; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.light { border-color: var(--glass-dim); color: var(--glass); }
  .badge.sect { border-color: var(--salt); color: var(--salt); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-size: 24px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.35; }
  .stat.hp .v { color: var(--glass); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  h2 { font-family: var(--display); font-weight: 400; font-size: 26px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 1px; }
  h2 .glyph { color: var(--glass); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .engine-box { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    justify-content: center; font-size: 13px; color: var(--muted); text-align: center; }
  .engine-step { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 250px; }
  .engine-step b { color: var(--glass); font-weight: 500; }
  .engine-arrow { color: var(--glass-dim); font-size: 20px; }
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--glass-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 400; font-size: 19px; letter-spacing: 1px; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--salt); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--glass); font-weight: 500; }
  .ability.passive-card { border-color: var(--glass-dim); }
  /* The swap diagram: two rows of hexes, before and after. */
  .swap { display: grid; grid-template-columns: 1fr auto 1fr; gap: 18px;
    align-items: center; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 24px 20px; }
  .swap-side { display: flex; flex-direction: column; gap: 10px; }
  .swap-side .lab { font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
    color: var(--muted); text-align: center; }
  .row { display: flex; gap: 8px; justify-content: center; }
  .hex { flex: 0 0 auto; min-width: 78px; text-align: center; padding: 10px 8px;
    border: 2px solid var(--line); border-radius: 6px; background: var(--panel);
    font-size: 11px; letter-spacing: 1px; color: var(--muted); }
  .hex b { display: block; font-family: var(--display); font-size: 14px;
    letter-spacing: 0; color: var(--ink); font-weight: 400; }
  .hex.moved { border-color: var(--glass); color: var(--glass); }
  .hex.moved b { color: var(--glass); }
  .swap-mid { font-size: 26px; color: var(--glass-dim); text-align: center; }
  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }
  .clip .file { font-size: 10px; color: var(--glass-dim); letter-spacing: 0;
    text-transform: none; margin-top: 2px; }
  .acquire { margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap; align-items: baseline; }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-size: 16px; color: var(--glass); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--glass); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>3&#x2605; Wind &middot; Whisperchime &middot; No. 7</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Wren idle animation, a braced front-line figure holding her ground" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 3</span></div>
      <h1>WREN</h1>
      <div class="title-line">Windbreak of the Whisperchime</div>
      <div class="badges">
        <span class="badge light">Wind</span>
        <span class="badge">Front-line Tank</span>
        <span class="badge">HP-scaling &middot; Displacement</span>
        <span class="badge sect">Whisperchime &middot; No. 7</span>
      </div>
      <p class="lede">The wall the rest of the sect stands behind. Every
      swing she throws is measured off <b>her own health pool</b>, so
      stacking HP makes her harder to kill and harder to survive at the
      same time. Her third skill is the Whisperchime thesis in one move:
      reach past the wall, <b>haul the back line out into the open</b>,
      and shove the wall in behind them &#x2014; then bill everyone
      standing in the wrong hex.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat hp"><div class="k">HP</div><div class="v">2290</div><div class="sub">+20% on a front hex</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">86</div><div class="sub">unused &#x2014; she hits off HP</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">153</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">92</div></div>
  </div>

  <h2><span class="glyph">&#x2749;</span> Health is the damage stat</h2>
  <p class="section-sub">Nothing in Wren's kit reads ATK. Every number
  below is a percentage of her <em>own</em> maximum HP, which means the
  gear that keeps her alive is the same gear that makes her hit &#x2014;
  and the front-hex bonus compounds into both at once.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Stand on a front hex.</b> Windbreak
      raises her max HP by <b>20%</b>, applied once, at placement.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>2400 becomes 2880.</b> Every HP substat
      you hang on her raises the floor <em>and</em> the ceiling.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Breakwater hits for 10% of that</b>
      &#x2014; into the whole enemy front row, on no cooldown.</div>
  </div>

  <h2><span class="glyph">&#x2749;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Breakwater</h3>
      <div class="meta">Enemy front row &middot; <b>10% of Wren's max HP</b></div>
      <p>A shoulder into the whole line: <b>10% of her own max HP</b> as
      damage to every enemy in the front row, every turn, forever.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 3</div>
      <h3>Shoulder Check</h3>
      <div class="meta">Single enemy &middot; <b>15% of Wren's max HP</b></div>
      <p>Everything she has, into one of them: <b>15% of her own max
      HP</b> to a single target.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 5</div>
      <h3>Out You Come</h3>
      <div class="meta">Single enemy &middot; <b>10% of max HP &middot; rank swap</b></div>
      <p>Reach past the wall: <b>10% of her max HP</b> as damage, and the
      target <b>trades hexes with whoever was covering them</b>. Their
      caster ends up out in the open; their wall ends up shoved in
      behind.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Out Of Place</h3>
      <div class="meta">Against displaced enemies</div>
      <p><b>+30% damage</b> to any enemy standing outside their own
      positional hex &#x2014; anyone the wind has moved, <b>including
      everyone she just moved herself</b>.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Front hex</div>
      <h3>Windbreak</h3>
      <div class="meta">Front &middot; <b>+20% max HP</b></div>
      <p>The body in the gap: <b>+20% maximum HP</b> while she holds a
      front hex &#x2014; which is <b>+20% to every number in her kit</b>
      as well.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x2749;</span> What the swap actually does</h2>
  <p class="section-sub">Out You Come is a symmetric trade, not a pull.
  The engine pairs each hex in one row with the hex directly opposite it
  in the other, so it works from either end &#x2014; drag a back-line
  caster forward, or shove a front-line bruiser out of the way. The
  centre hex has no opposite number and is exempt.</p>
  <div class="swap">
    <div class="swap-side">
      <div class="lab">Before</div>
      <div class="row">
        <div class="hex">Front<b>Bruiser</b></div>
      </div>
      <div class="row">
        <div class="hex">Back<b>Healer</b></div>
      </div>
    </div>
    <div class="swap-mid">&#x21C4;</div>
    <div class="swap-side">
      <div class="lab">After</div>
      <div class="row">
        <div class="hex moved">Front<b>Healer</b></div>
      </div>
      <div class="row">
        <div class="hex moved">Back<b>Bruiser</b></div>
      </div>
    </div>
  </div>
  <div class="engine-box" style="margin-top:14px">
    <div class="engine-step"><b>Both are now displaced.</b> Neither
      stands on their own positional hex any more.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Both lose their hex bonus</b> &#x2014;
      the healer's resistance, the bruiser's damage, gone.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Both owe Wren 30%.</b> Out Of Place
      turns her own skill into her own setup.</div>
  </div>

  <h2><span class="glyph">&#x2749;</span> Frames</h2>
  <p class="section-sub">Seven strips at nine frames each. The uploads
  arrived labelled out of order, and are wired to the skills they
  actually animate rather than the skills they are named for &#x2014;
  the files themselves were left exactly as delivered, spaces and all.</p>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">Braced, waiting for weight.</div><div class="file">wrenidle.png</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">Resetting her footing.</div><div class="file">wrenidle1.png</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">A look down the line.</div><div class="file">wrenidle2.png</div></div>
    <div class="clip"><img src="%%breakwater%%" alt="Breakwater"><div class="cap"><b>Breakwater</b> &middot; %%nf_breakwater%%f</div><div class="note">Skill 1 &#x2014; a shoulder into the whole row.</div><div class="file">wrenskill3.png</div></div>
    <div class="clip"><img src="%%shoulder%%" alt="Shoulder Check"><div class="cap"><b>Shoulder Check</b> &middot; %%nf_shoulder%%f</div><div class="note">Skill 2 &#x2014; all of it into one of them.</div><div class="file">wrenskill 2 3.png</div></div>
    <div class="clip"><img src="%%haul%%" alt="Out You Come"><div class="cap"><b>Out You Come</b> &middot; %%nf_haul%%f</div><div class="note">Skill 3 &#x2014; the reach past the wall.</div><div class="file">wrenskill1.png</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">The wall comes down.</div><div class="file">wrendeath.png</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Wind</div></div>
    <div><div class="k">Rarity</div><div class="v">3&#x2605;</div></div>
    <div><div class="k">Role</div><div class="v">Front-line Tank</div></div>
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

out = '/home/user/browsergacha/docs/wren-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
