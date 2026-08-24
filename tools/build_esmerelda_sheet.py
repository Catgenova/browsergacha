import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Esmerelda'
PANEL = (24, 10, 14, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('esmereldaidle.png',   17,  7, 'idle'),
    ('esmereldaidle1.png',   7,  6, 'fidget1'),
    ('esmereldaidle2.png',   7,  7, 'fidget2'),
    ('esmereldaskill1.png',  9, 12, 'lash'),
    ('esmereldaskill2.png',  9, 10, 'gather'),
    ('esmereldaskill3.png',  9, 12, 'arc'),
    ('esmereldadeath.png',  16,  8, 'death'),
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

html = r'''<title>Esmerelda, Firedancer of the Firetroupe</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sansita+Swashed:wght@500;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: silk and embers. Wine-dark ground,
     ribbon crimson and flame gold, set in Sansita Swashed's flowing
     letterforms. Every color painted explicitly. */
  :root {
    --ground: #16070c;
    --panel: #180a0e;
    --panel-2: #221016;
    --line: #4d222c;
    --ink: #f4e3e0;
    --muted: #a87e82;
    --silk: #ff5a6e;
    --flame: #ffb04a;
    --silk-dim: #8a3040;
    --display: 'Sansita Swashed', 'Georgia', cursive;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink);
    font-family: var(--mono); font-size: 15px; line-height: 1.65; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }
  .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px; }
  .eyebrow b { color: var(--silk); font-weight: 500; }
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art { flex: 0 0 300px; position: relative;
    background: radial-gradient(ellipse 62% 46% at 50% 62%, rgba(255,90,110,.15), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--silk-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--flame); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 700; font-size: 64px; line-height: 1.1;
    color: var(--ink); text-wrap: balance;
    text-shadow: 0 4px 0 rgba(0,0,0,.4), 0 0 34px rgba(255,90,110,.38); }
  .title-line { font-size: 15px; color: var(--silk); letter-spacing: 2px;
    font-family: var(--display); font-weight: 500; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.fire { border-color: var(--silk-dim); color: var(--silk); }
  .badge.sect { border-color: var(--flame); color: var(--flame); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-weight: 700; font-size: 24px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.35; }
  .stat.atk .v { color: var(--silk); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  h2 { font-family: var(--display); font-weight: 700; font-size: 26px;
    margin: 64px 0 6px; color: var(--ink); }
  h2 .glyph { color: var(--silk); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .engine-box { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    justify-content: center; font-size: 13px; color: var(--muted); text-align: center; }
  .engine-step { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 250px; }
  .engine-step b { color: var(--silk); font-weight: 500; }
  .engine-arrow { color: var(--silk-dim); font-size: 20px; }
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--silk-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 700; font-size: 20px; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--flame); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--silk); font-weight: 500; }
  .ability.passive-card { border-color: var(--silk-dim); }
  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }
  .acquire { margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap; align-items: baseline; }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-weight: 500; font-size: 17px; color: var(--flame); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--silk); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>3&#x2605; Fire &middot; Firetroupe &middot; No. 5</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Esmerelda idle animation, a dancer turning slow figures with a burning silk ribbon" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 3</span></div>
      <h1>Esmerelda</h1>
      <div class="title-line">Firedancer of the Firetroupe</div>
      <div class="badges">
        <span class="badge fire">Fire</span>
        <span class="badge">Front-line DPS</span>
        <span class="badge">Burn spreader</span>
        <span class="badge sect">Firetroupe &middot; third act</span>
      </div>
      <p class="lede">Between the strongman and the firebreather comes the
      silk. Esmerelda's ribbons <b>leave a burn on everything they
      touch</b>, her dance <b>draws that heat home as healing</b>, and the
      longer the field smolders, the harder she is to put out.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1550</div></div>
    <div class="stat atk"><div class="k">ATK</div><div class="v">165</div><div class="sub">the ribbon's edge</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">110</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">104</div><div class="sub">always mid-turn</div></div>
  </div>

  <h2><span class="glyph">&#x273f;</span> The dance</h2>
  <p class="section-sub">A front-liner who seeds burns on both rows, then
  cashes the field's smolder in as front-row healing. She is the
  Firetroupe's tempo: the more of the enemy team on fire, the more the
  troupe's front line gets back.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Set the silk alight.</b> Ribbon Lash and
      Trailing Flame each leave a <b>burn</b> ticking 3% max HP.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Gather the embers.</b> Every enemy DoT on the
      field pays <b>20% of her ATK</b> in healing to each front-row ally.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Return to the flame.</b> Moth to Flame lands
      her hits <b>15% harder</b> on anything already burning.</div>
  </div>

  <h2><span class="glyph">&#x273f;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Ribbon Lash</h3>
      <div class="meta">Single enemy &middot; <b>110% ATK + burn</b></div>
      <p>Lash one enemy with a burning silk for <b>110% ATK</b> and leave a
      burn eating <b>3% of their max HP</b> per turn for 2 turns.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 3</div>
      <h3>Gathering Embers</h3>
      <div class="meta">Front-row allies &middot; <b>20% ATK per enemy DoT</b></div>
      <p>Draw the heat home: heal every front-row ally for <b>20% of her
      ATK per damage-over-time</b> burning on the enemy team. A field of
      four burns is an 80%-ATK heal for the whole front line.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 5</div>
      <h3>Trailing Flame</h3>
      <div class="meta">Enemy back row &middot; <b>125% ATK + burn each</b></div>
      <p>Send the ribbons arcing over the wall: <b>125% ATK</b> to the enemy
      back row, each victim left with a <b>2-turn burn</b> of their own.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Moth to Flame</h3>
      <div class="meta">vs burning enemies &middot; <b>+15% damage</b></div>
      <p>Deals <b>15% extra damage to burning enemies</b> &#x2014; the dance
      always returns to the fire.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Front hex</div>
      <h3>Vanguard Press</h3>
      <div class="meta">Front row &middot; <b>+25% vs enemy front</b></div>
      <p>From the front hex she deals <b>25% more damage to the enemy front
      row</b> &#x2014; the ribbon is longest at the footlights.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x273f;</span> The show</h2>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle ribbon dance"><div class="cap"><b>Idle</b> &middot; 17f</div><div class="note">Slow figures, silk never still.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; 7f</div><div class="note">A flourish for the crowd.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; 7f</div><div class="note">Rewinding the ribbon.</div></div>
    <div class="clip"><img src="%%lash%%" alt="Ribbon Lash"><div class="cap"><b>Ribbon Lash</b> &middot; 9f</div><div class="note">The silk snaps and catches.</div></div>
    <div class="clip"><img src="%%gather%%" alt="Gathering Embers"><div class="cap"><b>Gathering Embers</b> &middot; 9f</div><div class="note">The heat comes home.</div></div>
    <div class="clip"><img src="%%arc%%" alt="Trailing Flame"><div class="cap"><b>Trailing Flame</b> &middot; 9f</div><div class="note">Over the wall in one sweep.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; 16f</div><div class="note">The ribbon settles last.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Fire</div></div>
    <div><div class="k">Row</div><div class="v">Front</div></div>
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

out = '/home/user/browsergacha/docs/esmerelda-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
