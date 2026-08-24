import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Slick'
PANEL = (20, 14, 8, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('slickidle.png',    7, 'idle'),
    ('slickidle1.png',   6, 'fidget1'),
    ('slickidle2.png',   7, 'fidget2'),
    ('slickskill1.png', 12, 'splash'),
    ('slickskill2.png', 10, 'coat'),
    ('slickskill3.png', 12, 'spill'),
    ('slickdeath.png',   8, 'death'),
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

html = r'''<title>Slick, Barrel Man of the Firetroupe</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chango&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: oak staves and standing oil. Tar
     browns under lamplight amber, set in Chango's plump barrel
     lettering. Every color painted explicitly. */
  :root {
    --ground: #120d06;
    --panel: #140e08;
    --panel-2: #1e150c;
    --line: #46331a;
    --ink: #f2e8d8;
    --muted: #a8946e;
    --oil: #d8b04a;
    --ember: #ff8a4a;
    --oil-dim: #7a6228;
    --display: 'Chango', 'Georgia', sans-serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink);
    font-family: var(--mono); font-size: 15px; line-height: 1.65; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }
  .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px; }
  .eyebrow b { color: var(--oil); font-weight: 500; }
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art { flex: 0 0 300px; position: relative;
    background: radial-gradient(ellipse 62% 46% at 50% 62%, rgba(216,176,74,.14), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--oil-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--oil); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 400; font-size: 60px; line-height: 1.05;
    color: var(--ink); text-wrap: balance; letter-spacing: 1px;
    text-shadow: 0 5px 0 rgba(0,0,0,.45), 0 0 34px rgba(216,176,74,.35); }
  .title-line { font-size: 14px; color: var(--oil); letter-spacing: 3px;
    font-family: var(--display); text-transform: uppercase; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.fire { border-color: var(--oil-dim); color: var(--ember); }
  .badge.sect { border-color: var(--oil); color: var(--oil); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-size: 22px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.35; }
  .stat.hp .v { color: var(--oil); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  h2 { font-family: var(--display); font-weight: 400; font-size: 22px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 1px; text-transform: uppercase; }
  h2 .glyph { color: var(--oil); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .engine-box { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    justify-content: center; font-size: 13px; color: var(--muted); text-align: center; }
  .engine-step { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 250px; }
  .engine-step b { color: var(--oil); font-weight: 500; }
  .engine-arrow { color: var(--oil-dim); font-size: 20px; }
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--oil-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 400; font-size: 17px; letter-spacing: 1px; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--ember); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--oil); font-weight: 500; }
  .ability.passive-card { border-color: var(--oil-dim); }
  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }
  .acquire { margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap; align-items: baseline; }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-size: 16px; color: var(--oil); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--oil); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>3&#x2605; Fire &middot; Firetroupe &middot; No. 5</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Slick idle animation, a wooden barrel brimming over with black pitch" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 3</span></div>
      <h1>SLICK</h1>
      <div class="title-line">Barrel Man of the Firetroupe</div>
      <div class="badges">
        <span class="badge fire">Fire</span>
        <span class="badge">Center support</span>
        <span class="badge">Pure debuffer</span>
        <span class="badge sect">Firetroupe &middot; the supply</span>
      </div>
      <p class="lede">The act nobody watches and every act needs. Slick
      never swings once: he is the troupe's <b>oil supply</b>, painting
      Oilslicked across the enemy team so that <b>every burn ticks twice
      as hard</b> &#x2014; and anyone who kicks the barrel wears it.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat hp"><div class="k">HP</div><div class="v">1800</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">110</div><div class="sub">never used in anger</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">140</div><div class="sub">solid oak</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">100</div></div>
  </div>

  <h2><span class="glyph">&#x25c9;</span> The supply line</h2>
  <p class="section-sub">Oilslicked is the Firetroupe's mark: while it
  holds, <b>burn damage-over-time ticks for double</b> on that target.
  Slick is the only hero who applies it on demand &#x2014; pair him with the
  troupe's burners and the arithmetic takes care of itself.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Oil the field.</b> Splash Zone slicks the
      front row; The Big Spill slicks <b>everyone</b>, 3 turns at a time.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Light the field.</b> Lucian and Esmerelda's
      burns tick <b>twice as hard</b> on every oiled target.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Stay in the ring.</b> From the center hex his
      debuffs land with <b>+20% accuracy</b> &#x2014; more after a Fresh Coat.</div>
  </div>

  <h2><span class="glyph">&#x25c9;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Splash Zone</h3>
      <div class="meta">Enemy front row &middot; <b>Oilslicked, 3 turns</b></div>
      <p>Slop a wave of pitch over the enemy front row, leaving them
      <b>Oilslicked for 3 turns</b> &#x2014; burns tick twice as hard on an
      oiled target.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 3</div>
      <h3>Fresh Coat</h3>
      <div class="meta">Self &middot; <b>+30% SPD, +30% Accuracy</b> &middot; 2 turns</div>
      <p>Slick his own staves with a fresh coat of oil: <b>+30% SPD</b> and
      <b>+30% debuff Accuracy</b> for 2 turns. Nothing sticks to a greased
      barrel &#x2014; and nothing he throws misses.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 5</div>
      <h3>The Big Spill</h3>
      <div class="meta">All enemies &middot; <b>Oilslicked, 3 turns</b></div>
      <p>Tip the whole barrel: <b>every enemy is Oilslicked for 3
      turns</b>. The finale starts when someone brings a match.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Backsplash</h3>
      <div class="meta">On being struck &middot; <b>Oilslick the attacker</b></div>
      <p>Hit the barrel, wear the barrel: any enemy who strikes Slick is
      <b>Oilslicked for 2 turns</b> on the follow-through.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Center hex</div>
      <h3>Center Ring</h3>
      <div class="meta">Center &middot; <b>+20% debuff Accuracy</b></div>
      <p>From the middle of the ring his debuffs land with <b>+20%
      Accuracy</b> &#x2014; every eye on the center act.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x25c9;</span> The show</h2>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle bubbling"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">The pitch never stops bubbling.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">A heavy drip down the front.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">Settling in the staves.</div></div>
    <div class="clip"><img src="%%splash%%" alt="Splash Zone"><div class="cap"><b>Splash Zone</b> &middot; %%nf_splash%%f</div><div class="note">The front row gets wet.</div></div>
    <div class="clip"><img src="%%coat%%" alt="Fresh Coat"><div class="cap"><b>Fresh Coat</b> &middot; %%nf_coat%%f</div><div class="note">Oil down his own staves.</div></div>
    <div class="clip"><img src="%%spill%%" alt="The Big Spill"><div class="cap"><b>The Big Spill</b> &middot; %%nf_spill%%f</div><div class="note">The whole barrel goes over.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">The staves give way.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Fire</div></div>
    <div><div class="k">Row</div><div class="v">Center</div></div>
    <div><div class="k">Summon</div><div class="v">Any scroll &middot; 3&#x2605; band</div></div>
    <div><div class="k">Sect</div><div class="v">Firetroupe &middot; No. 5</div></div>
  </div>

  <p class="foot">Sheet drawn from the live hero definition
  (js/data/heroes/humans.js) and the uploaded spritesheets, untouched.
  Play at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a>.</p>
</div>
'''

for name, uri in IMG.items():
    html = html.replace(f'%%{name}%%', uri)
    html = html.replace(f'%%nf_{name}%%', str(NF[name]))

out = '/home/user/browsergacha/docs/slick-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
