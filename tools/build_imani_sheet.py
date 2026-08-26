import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Imani'
PANEL = (17, 20, 13, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('imaniidle.png',   7, 'idle'),
    ('imaniidle1.png',  6, 'fidget1'),
    ('imaniidle2.png',  7, 'fidget2'),
    ('imaniskill1.png', 11, 'note'),
    ('imaniskill2.png', 11, 'two'),
    ('imaniskill3.png', 11, 'peal'),
    ('imanideath.png',   8, 'death'),
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

html = r'''<title>Imani, Chimewright of the Whisperchime</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+SC:wght@400;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: struck brass in a dark room. Deep
     moss ground under bell gold and undyed linen, set in Cormorant SC's
     wide small caps. Every color painted explicitly. */
  :root {
    --ground: #0f120c;
    --panel: #11140d;
    --panel-2: #1b2015;
    --line: #3f4a2c;
    --ink: #f2f0e2;
    --muted: #9ca487;
    --leaf: #e8c86a;
    --vellum: #efe9d4;
    --leaf-dim: #7a6a34;
    --display: 'Cormorant SC', 'Georgia', serif;
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
  h1 { font-family: var(--display); font-weight: 700; font-size: 72px; line-height: 1.05;
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
      <img src="%%idle%%" alt="Imani idle animation, a seated figure behind a horizontal bar hung with brass bells" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 4</span></div>
      <h1>IMANI</h1>
      <div class="title-line">Chimewright of the Whisperchime</div>
      <div class="badges">
        <span class="badge light">Wind</span>
        <span class="badge">Center DPS</span>
        <span class="badge">Scatter &middot; Punish &middot; Slow</span>
        <span class="badge sect">Whisperchime &middot; No. 7</span>
      </div>
      <p class="lede">The sect's namesake, sitting behind a bar of bells
      she never stops ringing. Two of her three skills <b>choose their own
      victims</b>, and her passive is the exact inverse of Galen's: where
      he breaks what has been stripped bare, Imani hits hardest into an
      enemy <b>still wearing everything their supports gave them</b>
      &#x2014; <b>+20% per buff</b>.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1850</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">175</div><div class="sub">+15% on the centre hex</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">120</div></div>
    <div class="stat spd"><div class="k">SPD</div><div class="v">116</div></div>
  </div>

  <h2><span class="glyph">&#x2749;</span> Two directions at once</h2>
  <p class="section-sub">The Whisperchime pulls both ways, and that is
  the point: Galen wants the enemy stripped, Imani wants them decorated.
  Whichever the fight gives you, somebody in the sect is being paid.</p>
  <div class="engine-box">
    <div class="engine-step"><b>They buff.</b> Imani's bells answer
      <b>+20% per buff</b> &#x2014; three blessings is <b>&times;1.6</b>.</div>
    <div class="engine-arrow">&#x2194;</div>
    <div class="engine-step"><b>They are stripped.</b> Galen's <b>Bare
      Branches</b> pays <b>+25%</b> into anything carrying nothing.</div>
    <div class="engine-arrow">&#x2194;</div>
    <div class="engine-step"><b>Tumble in the middle</b>, tearing
      blessings off &#x2014; deciding which of them gets fed.</div>
  </div>

  <h2><span class="glyph">&#x2749;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Single Note</h3>
      <div class="meta">Single enemy &middot; <b>125% ATK</b></div>
      <p>One bell, struck clean: <b>125% ATK</b> to a single enemy &#x2014;
      the only time she picks her own target.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 3</div>
      <h3>Two Bells</h3>
      <div class="meta">2 random enemies &middot; <b>130% ATK each</b></div>
      <p>The bar swings twice: <b>130% ATK</b> to <b>two random</b>
      enemies &#x2014; never the same one twice.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 5</div>
      <h3>All The Bells</h3>
      <div class="meta">3 random enemies &middot; <b>130% ATK &middot; -30% SPD, 2 turns</b></div>
      <p>Every bell at once: <b>130% ATK</b> to <b>three random</b>
      enemies, and the sound drags at them &#x2014; <b>-30% Speed for 2
      turns</b>.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Answering Bells</h3>
      <div class="meta">Against buffed enemies</div>
      <p>Deals <b>20% extra damage for every buff the target carries</b>.
      One blessing is <b>&times;1.2</b>; a fully rallied boss is a wall of
      noise.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Center hex</div>
      <h3>Chime Bar</h3>
      <div class="meta">Center &middot; <b>+15% ATK</b></div>
      <p>The middle, where the whole chime hangs: <b>+15% ATK</b> on every
      bell she rings.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x2749;</span> On randomness</h2>
  <p class="section-sub">Two of her skills give up target choice, and get
  paid in reach for it. What they never do is waste a swing.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Always distinct.</b> Two Bells never rings
      the same enemy twice; nor does All The Bells.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Never wasted.</b> Against a thinned field
      she simply hits everyone still standing.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>The slow follows the hit.</b> Only the
      enemies the peal actually rang for lose speed.</div>
  </div>

  <h2><span class="glyph">&#x2749;</span> Frames</h2>
  <p class="section-sub">Seven strips: a breathing idle with two fidgets,
  a peal for each skill, and a fall.</p>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">The bar, never quite still.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">A hand along the bells.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">Listening for the note.</div></div>
    <div class="clip"><img src="%%note%%" alt="Single Note"><div class="cap"><b>Single Note</b> &middot; %%nf_note%%f</div><div class="note">One bell, struck clean.</div></div>
    <div class="clip"><img src="%%two%%" alt="Two Bells"><div class="cap"><b>Two Bells</b> &middot; %%nf_two%%f</div><div class="note">The bar swings twice.</div></div>
    <div class="clip"><img src="%%peal%%" alt="All The Bells"><div class="cap"><b>All The Bells</b> &middot; %%nf_peal%%f</div><div class="note">Everything at once.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">The last note.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Wind</div></div>
    <div><div class="k">Rarity</div><div class="v">4&#x2605;</div></div>
    <div><div class="k">Role</div><div class="v">Center DPS</div></div>
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

out = '/home/user/browsergacha/docs/imani-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
