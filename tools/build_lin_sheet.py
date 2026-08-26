import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Lin'
PANEL = (22, 10, 10, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('linidle.png',    7, 'idle'),
    ('linidle1.png',   6, 'fidget1'),
    ('linidle2.png',   7, 'fidget2'),
    ('linskill1.png', 10, 'taunt'),
    ('linskill2.png', 10, 'blaze'),
    ('linskill3.png', 10, 'barricade'),
    ('lindeath.png',   8, 'death'),
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

html = r'''<title>Lin, Balance Act of the Firetroupe</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Yeseva+One&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: the balance act. Deep maroon under
     circus-ball scarlet and brass, set in Yeseva One's poised display
     serifs. Every color painted explicitly. */
  :root {
    --ground: #150808;
    --panel: #160a0a;
    --panel-2: #211010;
    --line: #4d2424;
    --ink: #f4e6de;
    --muted: #a88480;
    --ball: #ff5a48;
    --brass: #e8b04a;
    --ball-dim: #8a342c;
    --display: 'Yeseva One', 'Georgia', serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink);
    font-family: var(--mono); font-size: 15px; line-height: 1.65; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }
  .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px; }
  .eyebrow b { color: var(--ball); font-weight: 500; }
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art { flex: 0 0 300px; position: relative;
    background: radial-gradient(ellipse 62% 46% at 50% 62%, rgba(255,90,72,.14), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--ball-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--brass); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 400; font-size: 68px; line-height: 1.05;
    color: var(--ink); text-wrap: balance; letter-spacing: 2px;
    text-shadow: 0 4px 0 rgba(0,0,0,.45), 0 0 34px rgba(255,90,72,.32); }
  .title-line { font-size: 14px; color: var(--ball); letter-spacing: 3px;
    font-family: var(--display); text-transform: uppercase; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.fire { border-color: var(--ball-dim); color: var(--ball); }
  .badge.sect { border-color: var(--brass); color: var(--brass); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-size: 23px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.35; }
  .stat.hp .v { color: var(--ball); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  h2 { font-family: var(--display); font-weight: 400; font-size: 24px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 1px; }
  h2 .glyph { color: var(--ball); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .engine-box { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    justify-content: center; font-size: 13px; color: var(--muted); text-align: center; }
  .engine-step { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 250px; }
  .engine-step b { color: var(--ball); font-weight: 500; }
  .engine-arrow { color: var(--ball-dim); font-size: 20px; }
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--ball-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 400; font-size: 19px; letter-spacing: 1px; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--brass); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--ball); font-weight: 500; }
  .ability.passive-card { border-color: var(--ball-dim); }
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
  .foot a { color: var(--ball); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>4&#x2605; Fire &middot; Firetroupe &middot; No. 5</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Lin idle animation, an acrobat balancing one-legged atop a big red circus ball" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 4</span></div>
      <h1>LIN</h1>
      <div class="title-line">Balance Act of the Firetroupe</div>
      <div class="badges">
        <span class="badge fire">Fire</span>
        <span class="badge">Front-line Tank</span>
        <span class="badge">Taunt &middot; Bodyguard</span>
        <span class="badge sect">Firetroupe &middot; the balance act</span>
      </div>
      <p class="lede">Nobody looks away from the girl on the ball. Lin
      <b>pulls the enemy backline's next turn onto herself</b>, sets the
      ball rolling with fire, and when the line needs holding she stops
      performing entirely &#x2014; <b>planting the ball as a barricade</b>
      that eats every hit meant for her front row.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat hp"><div class="k">HP</div><div class="v">1930</div><div class="sub">the act absorbs</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">97</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">139</div><div class="sub">poised, not braced</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">96</div></div>
  </div>

  <h2><span class="glyph">&#x25cf;</span> The act</h2>
  <p class="section-sub">A tank that taxes the enemy's decisions instead
  of their damage: the backline wastes its turns on her, the front row
  burns twice over, and her biggest play is choosing not to act at all.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Steal the show.</b> The enemy back row's
      next turn must be spent throwing <b>skill 1 at Lin</b>.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Light the ball.</b> The enemy front row
      takes <b>two burns each</b> &#x2014; double fuel for the troupe's
      oil.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Plant the ball.</b> Blocker: she skips her
      turns but <b>absorbs every front-row hit at 25% off</b>.</div>
  </div>

  <h2><span class="glyph">&#x25cf;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Center of Attention</h3>
      <div class="meta">Enemy back row &middot; <b>Taunt, 1 turn</b></div>
      <p>A flourish nobody can ignore: taunts the enemy back row &#x2014;
      on its next turn each victim <b>must throw its skill 1 at Lin</b>
      and nothing else.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 3</div>
      <h3>Blazing Ball</h3>
      <div class="meta">Enemy front row &middot; <b>2 burns each</b></div>
      <p>Set the ball alight and roll it down the line: the enemy front
      row takes <b>2 burns</b>, each eating <b>3% of their max HP</b> per
      turn for 2 turns.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 5</div>
      <h3>Ball Barricade</h3>
      <div class="meta">Self &middot; <b>Blocker, 2 turns</b></div>
      <p>Plant the ball and brace: Lin <b>cannot act</b>, but <b>absorbs
      all damage aimed at front-row allies, mitigating 25%</b> of it. She
      holds the braced pose for as long as the buff lasts.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Used to the Heat</h3>
      <div class="meta">vs burning enemies &middot; <b>&#x2212;15% damage taken</b></div>
      <p>Takes <b>15% less damage from burning enemies</b> &#x2014; she
      dances over fire for a living.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Front hex</div>
      <h3>Limelight</h3>
      <div class="meta">vs taunted enemies &middot; <b>&#x2212;15% damage taken</b></div>
      <p>Takes <b>15% less damage from taunted enemies</b> &#x2014; they
      swing half-blinded by the spotlight.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x25cf;</span> The show</h2>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle balance"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">One leg, never a wobble.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">Rolling the ball beneath her.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">A bow for the crowd.</div></div>
    <div class="clip"><img src="%%taunt%%" alt="Center of Attention"><div class="cap"><b>Center of Attention</b> &middot; %%nf_taunt%%f</div><div class="note">All eyes up here.</div></div>
    <div class="clip"><img src="%%blaze%%" alt="Blazing Ball"><div class="cap"><b>Blazing Ball</b> &middot; %%nf_blaze%%f</div><div class="note">The ball catches, the row cooks.</div></div>
    <div class="clip"><img src="%%barricade%%" alt="Ball Barricade"><div class="cap"><b>Ball Barricade</b> &middot; %%nf_barricade%%f</div><div class="note">She dismounts and plants it &#x2014; and holds.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">The ball rolls on without her.</div></div>
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
    html = html.replace(f'%%nf_{name}%%', str(NF[name]))

out = '/home/user/browsergacha/docs/lin-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
