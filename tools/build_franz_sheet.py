import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Franz'
PANEL = (26, 13, 11, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('franzidle.png',    9,  5, 'idle'),
    ('franzidle1.png',   9,  6, 'fidget1'),
    ('franzidle2.png',   9,  7, 'fidget2'),
    ('franzskill1.png',  9, 12, 'bonk'),
    ('franzskill2.png',  9, 11, 'flattener'),
    ('franzskill3.png', 14, 12, 'collapse'),
    ('franzdeath.png',   9,  7, 'death'),
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

html = r'''<title>Franz, Strongman of the Firetroupe</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bungee&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: the strongman poster. Iron reds
     under showlight coral, set in Bungee's sideshow lettering. Every
     color painted explicitly. */
  :root {
    --ground: #190d0b;
    --panel: #1a0d0b;
    --panel-2: #241210;
    --line: #4d2820;
    --ink: #f2e4dc;
    --muted: #a8867a;
    --show: #ff7a5a;
    --brass: #e8b04a;
    --show-dim: #8a4230;
    --display: 'Bungee', 'Georgia', sans-serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink);
    font-family: var(--mono); font-size: 15px; line-height: 1.65; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }
  .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px; }
  .eyebrow b { color: var(--show); font-weight: 500; }
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art { flex: 0 0 300px; position: relative;
    background: radial-gradient(ellipse 62% 46% at 50% 62%, rgba(255,122,90,.16), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--show-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--brass); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 400; font-size: 66px; line-height: 1;
    color: var(--ink); text-wrap: balance; letter-spacing: 2px;
    text-shadow: 0 5px 0 rgba(0,0,0,.4), 0 0 34px rgba(255,122,90,.4); }
  .title-line { font-size: 14px; color: var(--show); letter-spacing: 3px;
    font-family: var(--display); text-transform: uppercase; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.fire { border-color: var(--show-dim); color: var(--show); }
  .badge.sect { border-color: var(--brass); color: var(--brass); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-size: 22px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.35; }
  .stat.hp .v { color: var(--show); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  h2 { font-family: var(--display); font-weight: 400; font-size: 22px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 2px; text-transform: uppercase; }
  h2 .glyph { color: var(--show); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .engine-box { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    justify-content: center; font-size: 13px; color: var(--muted); text-align: center; }
  .engine-step { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 250px; }
  .engine-step b { color: var(--show); font-weight: 500; }
  .engine-arrow { color: var(--show-dim); font-size: 20px; }
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--show-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 400; font-size: 17px; letter-spacing: 1px; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--brass); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--show); font-weight: 500; }
  .ability.passive-card { border-color: var(--show-dim); }
  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }
  .acquire { margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap; align-items: baseline; }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-size: 16px; color: var(--brass); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--show); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>4&#x2605; Fire &middot; Firetroupe &middot; No. 5</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Franz idle animation, a barrel-chested strongman rolling his shoulders" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 4</span></div>
      <h1>FRANZ</h1>
      <div class="title-line">Strongman of the Firetroupe</div>
      <div class="badges">
        <span class="badge fire">Fire</span>
        <span class="badge">Front-line DPS</span>
        <span class="badge">HP-scaled swings</span>
        <span class="badge sect">Firetroupe &middot; second act</span>
      </div>
      <p class="lede">The poster act. Franz does not swing a stat line
      &#x2014; he swings <b>himself</b>: every blow deals a share of his own
      max HP, he hits <b>harder the more hurt he is</b>, and the front hex
      keeps knitting him back so the show never stops.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat hp"><div class="k">HP</div><div class="v">2100</div><div class="sub">the whole act</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">130</div><div class="sub">stage dressing</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">135</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">98</div></div>
  </div>

  <h2><span class="glyph">&#x25a0;</span> The act</h2>
  <p class="section-sub">A front-liner who wants to be hurt but not healed
  too fast: the regen sets his floor, the missing health sets his fury.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Take the stage.</b> Every skill deals a cut
      of his <b>2100-and-climbing max HP</b>, not his ATK.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Take the hits.</b> Showman's Blood pays up
      to <b>+30% damage</b> in proportion to his missing health.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Never fall.</b> On the front hex, Hearthblood
      knits back <b>5% max HP</b> at the start of every turn.</div>
  </div>

  <h2><span class="glyph">&#x25a0;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Bonk</h3>
      <div class="meta">Single enemy &middot; <b>20% max HP</b></div>
      <p>Bring the hammer down on one enemy for <b>20% of Franz's own max
      HP</b> as damage.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 3</div>
      <h3>Row Flattener</h3>
      <div class="meta">Enemy front row &middot; <b>20% max HP each</b></div>
      <p>Sweep the enemy front row for <b>20% of his own max HP</b> as
      damage to each of them.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 5</div>
      <h3>Tent Collapse</h3>
      <div class="meta">All enemies &middot; <b>15% max HP each</b></div>
      <p>Bring the whole show down: <b>15% of his own max HP</b> as damage
      to the entire enemy team. The 14-frame finisher earns its wind-up.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Showman's Blood</h3>
      <div class="meta">Scales with missing health</div>
      <p>Deals up to <b>30% extra damage</b> in proportion to his missing
      health &#x2014; the crowd loves a wounded strongman.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Front hex</div>
      <h3>Hearthblood</h3>
      <div class="meta">Front row &middot; <b>5% max HP regen</b></div>
      <p>Regenerates <b>5% max HP at the start of his turn</b> &#x2014; the
      hearth keeps its keeper warm.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x25a0;</span> The show</h2>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle sway"><div class="cap"><b>Idle</b> &middot; 9f</div><div class="note">Rolling the shoulders.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; 9f</div><div class="note">Playing to the crowd.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; 9f</div><div class="note">The flex.</div></div>
    <div class="clip"><img src="%%bonk%%" alt="Bonk attack"><div class="cap"><b>Bonk</b> &middot; 9f</div><div class="note">The hammer comes down.</div></div>
    <div class="clip"><img src="%%flattener%%" alt="Row Flattener"><div class="cap"><b>Row Flattener</b> &middot; 9f</div><div class="note">The whole row at once.</div></div>
    <div class="clip"><img src="%%collapse%%" alt="Tent Collapse"><div class="cap"><b>Tent Collapse</b> &middot; 14f</div><div class="note">The long wind-up, the whole tent.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; 9f</div><div class="note">The final bow.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Fire</div></div>
    <div><div class="k">Row</div><div class="v">Front</div></div>
    <div><div class="k">Summon</div><div class="v">Rare Scrolls &middot; 4&#x2605; band</div></div>
    <div><div class="k">Sect</div><div class="v">Firetroupe &middot; No. 5</div></div>
  </div>

  <p class="foot">Sheet drawn from the live hero definition
  (js/data/heroes/humans.js) and the uploaded spritesheets, untouched.
  Play at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a>.</p>
</div>
'''

for name, uri in IMG.items():
    html = html.replace(f'%%{name}%%', uri)

out = '/home/user/browsergacha/docs/franz-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
