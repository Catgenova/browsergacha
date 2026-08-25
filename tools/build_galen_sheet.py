import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Galen'
PANEL = (12, 20, 19, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('galenidle.png',   7, 'idle'),
    ('galenidle1.png',  6, 'fidget1'),
    ('galenidle2.png',  7, 'fidget2'),
    ('galenskill1.png', 12, 'gust'),
    ('galenskill2.png', 12, 'stripwind'),
    ('galenskill3.png', 12, 'squall'),
    ('galendeath.png',  10, 'death'),
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

html = r'''<title>Galen, Pinwheel of the Whisperchime</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Teko:wght@400;600&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: a high cold sky. Slate-green dark
     under pinwheel white and brass, set in Teko's tall condensed
     face. Every color painted explicitly. */
  :root {
    --ground: #0b1211;
    --panel: #0c1413;
    --panel-2: #13201d;
    --line: #2c4740;
    --ink: #eef4f0;
    --muted: #8ba79c;
    --leaf: #7fe0c0;
    --vellum: #f0ecd8;
    --leaf-dim: #3f7a68;
    --display: 'Teko', 'Georgia', sans-serif;
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
    background: radial-gradient(ellipse 62% 46% at 50% 62%, rgba(127,224,192,.13), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--leaf-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--leaf); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 600; font-size: 78px; line-height: 1.05;
    color: var(--ink); text-wrap: balance; letter-spacing: 2px;
    text-shadow: 0 4px 0 rgba(0,0,0,.5), 0 0 34px rgba(127,224,192,.26); }
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
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>3&#x2605; Wind &middot; Whisperchime &middot; No. 7</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Galen idle animation, a headbanded fighter in green and white holding a tall staff topped with a pinwheel" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 3</span></div>
      <h1>GALEN</h1>
      <div class="title-line">Pinwheel of the Whisperchime</div>
      <div class="badges">
        <span class="badge light">Wind</span>
        <span class="badge">Back-line DPS</span>
        <span class="badge">Strip &middot; Reach &middot; Execute</span>
        <span class="badge sect">Whisperchime &middot; No. 7</span>
      </div>
      <p class="lede">The sect takes things away; Galen is the one who
      <b>profits from having taken them</b>. Two of his three skills tear
      blessings off, and everything he throws lands <b>25% harder</b> on
      an enemy already stripped bare &#x2014; so his own second skill sets
      up his own third, and a Tumble on the field sets up all of them.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1450</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">175</div><div class="sub">the whole point</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">95</div></div>
    <div class="stat spd"><div class="k">SPD</div><div class="v">114</div></div>
  </div>

  <h2><span class="glyph">&#x2735;</span> The turn of the wheel</h2>
  <p class="section-sub">A back-line damage dealer whose damage is gated
  on a condition he creates himself: strip first, hit harder after.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Strip.</b> Stripwind tears <b>two</b>
      blessings off one enemy; Squall tears <b>one</b> off every enemy in
      the back row.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Break.</b> Bare Branches pays <b>+25%
      damage</b> into anything carrying no buffs at all.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Reach.</b> Squall ignores the wall
      entirely and lands on the enemy <b>back row</b> &#x2014; where the
      buffs usually come from.</div>
  </div>

  <h2><span class="glyph">&#x2735;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Gust</h3>
      <div class="meta">Random enemy &middot; <b>125% ATK</b></div>
      <p>Let the pinwheel choose: <b>125% ATK</b> to a <b>random</b>
      enemy. No aim, no cooldown.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 3</div>
      <h3>Stripwind</h3>
      <div class="meta">Single enemy &middot; <b>140% ATK &middot; strip 2</b></div>
      <p>A cutting pass on one enemy: <b>140% ATK</b>, and <b>two
      blessings</b> are torn away.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 5</div>
      <h3>Squall</h3>
      <div class="meta">Enemy back row &middot; <b>120% ATK &middot; strip 1 each</b></div>
      <p>The wind reaches over the wall: <b>120% ATK</b> to the enemy
      <b>back row</b>, tearing <b>one blessing</b> off each of them.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Bare Branches</h3>
      <div class="meta">Against unbuffed enemies</div>
      <p>Deals <b>25% extra damage</b> to enemies carrying no buffs at all
      &#x2014; what the wind has already stripped, it breaks.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Back hex</div>
      <h3>Weathervane</h3>
      <div class="meta">Back row &middot; <b>+20% debuff Accuracy</b></div>
      <p>Back where he can watch the whole field turn: <b>+20%
      Accuracy</b>. Stripping is a contested roll, so this is what makes
      his strips actually land on a stubborn target.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x2735;</span> Why accuracy matters to a DPS</h2>
  <p class="section-sub">Tearing a blessing off is a <i>taking</i>, and
  every taking in this game rolls the caster's accuracy against the
  target's resistance. For Galen that roll is not a side effect &#x2014; it
  is the switch that turns his passive on.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Strip resisted</b> &#x2014; the target keeps
      its buffs, and his next hit is at plain damage.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Strip lands</b> &#x2014; the target is bare,
      and everything after it hits for <b>125%</b>.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Back hex</b> &#x2014; <b>+20% accuracy</b>
      is the difference between those two outcomes against resistant
      enemies.</div>
  </div>

  <h2><span class="glyph">&#x2735;</span> Frames</h2>
  <p class="section-sub">Seven strips: a breathing idle with two fidgets,
  a pass for each skill, and a long fall.</p>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">The wheel, turning.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">A shift of the grip.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">Reading the air.</div></div>
    <div class="clip"><img src="%%gust%%" alt="Gust"><div class="cap"><b>Gust</b> &middot; %%nf_gust%%f</div><div class="note">Wherever it points.</div></div>
    <div class="clip"><img src="%%stripwind%%" alt="Stripwind"><div class="cap"><b>Stripwind</b> &middot; %%nf_stripwind%%f</div><div class="note">Two blessings gone.</div></div>
    <div class="clip"><img src="%%squall%%" alt="Squall"><div class="cap"><b>Squall</b> &middot; %%nf_squall%%f</div><div class="note">Over the wall.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">The wheel stops.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Wind</div></div>
    <div><div class="k">Rarity</div><div class="v">3&#x2605;</div></div>
    <div><div class="k">Role</div><div class="v">Back-line DPS</div></div>
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

out = '/home/user/browsergacha/docs/galen-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
