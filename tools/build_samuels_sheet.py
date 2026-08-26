import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Samuels'
PANEL = (16, 13, 20, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('samuelsidle.png',    7, 'idle'),
    ('samuelsidle1.png',   6, 'fidget1'),
    ('samuelsidle2.png',   7, 'fidget2'),
    ('samuelsskill1.png', 12, 'stab'),
    ('samuelsskill2.png', 12, 'toss'),
    ('samuelsskill3.png', 12, 'flurry'),
    ('samuelsdeath.png',   8, 'death'),
]

def clip(fname, fps):
    im = Image.open(f'{SRC}/{fname}').convert('RGBA')
    w, h = im.size
    frames = max(1, round(w / h))
    fw = w // frames
    cells = []
    for i in range(frames):
        # Authored facing RIGHT already — no mirroring needed to match
        # the board's facing-right convention.
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

html = r'''<title>Samuels, Stabby Triplets of the Firetroupe</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fugaz+One&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: thrown steel under gaslight. Night
     slate, knife silver and blood red, set in Fugaz One's fast italic
     lettering. Every color painted explicitly. */
  :root {
    --ground: #0e0c12;
    --panel: #100d14;
    --panel-2: #1a1620;
    --line: #3a3048;
    --ink: #ece8f2;
    --muted: #948aa8;
    --blade: #d8dce8;
    --blood: #ff4a55;
    --blade-dim: #5a5470;
    --display: 'Fugaz One', 'Georgia', sans-serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink);
    font-family: var(--mono); font-size: 15px; line-height: 1.65; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }
  .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px; }
  .eyebrow b { color: var(--blood); font-weight: 500; }
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art { flex: 0 0 300px; position: relative;
    background: radial-gradient(ellipse 62% 46% at 50% 62%, rgba(255,74,85,.13), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--blade-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--blade); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 400; font-size: 62px; line-height: 1.05;
    color: var(--ink); text-wrap: balance; letter-spacing: 1px;
    text-shadow: 0 4px 0 rgba(0,0,0,.45), 0 0 34px rgba(255,74,85,.30); }
  .title-line { font-size: 14px; color: var(--blood); letter-spacing: 3px;
    font-family: var(--display); text-transform: uppercase; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.fire { border-color: var(--blade-dim); color: var(--blood); }
  .badge.sect { border-color: var(--blade); color: var(--blade); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-size: 22px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.35; }
  .stat.atk .v { color: var(--blood); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  h2 { font-family: var(--display); font-weight: 400; font-size: 22px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 1px; text-transform: uppercase; }
  h2 .glyph { color: var(--blood); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .engine-box { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    justify-content: center; font-size: 13px; color: var(--muted); text-align: center; }
  .engine-step { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 250px; }
  .engine-step b { color: var(--blood); font-weight: 500; }
  .engine-arrow { color: var(--blade-dim); font-size: 20px; }
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--blade-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 400; font-size: 17px; letter-spacing: 1px; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--blade); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--blood); font-weight: 500; }
  .ability.passive-card { border-color: var(--blade-dim); }
  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }
  .acquire { margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap; align-items: baseline; }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-size: 16px; color: var(--blade); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--blood); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>3&#x2605; Fire &middot; Firetroupe &middot; No. 5</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Samuels idle animation, three knife-juggling brothers stacked in a tower" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 3</span></div>
      <h1>SAMUELS</h1>
      <div class="title-line">Stabby Triplets of the Firetroupe</div>
      <div class="badges">
        <span class="badge fire">Fire</span>
        <span class="badge">Front-line DPS</span>
        <span class="badge">Triple striker</span>
        <span class="badge sect">Firetroupe &middot; the knife act</span>
      </div>
      <p class="lede">One roster slot, three brothers. Every skill the
      Samuels boys throw is <b>three separate strikes</b>, each rolling
      <b>its own crit</b> &#x2014; and while nobody has laid a hand on the
      tower, every knife goes in 30% harder.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1315</div></div>
    <div class="stat atk"><div class="k">ATK</div><div class="v">132</div><div class="sub">split three ways</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">86</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">106</div><div class="sub">first to the flourish</div></div>
  </div>

  <h2><span class="glyph">&#x2694;</span> The act</h2>
  <p class="section-sub">A crit machine that pays out in volume: three
  rolls per cast, extra crit chance stapled to the knives, and +30% crit
  damage from the front hex. Keep the triplets unhurt and the arithmetic
  compounds.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Throw in threes.</b> Every skill is three
      separate strikes &#x2014; three crit rolls, three chances to spike.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Sharpen the odds.</b> The knives carry
      <b>+15&#x2013;20% crit chance each</b>, and the front hex pays
      <b>+30% crit damage</b>.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Stay clean.</b> At full HP the triplets
      deal <b>+30% damage</b> &#x2014; Not a Scratch.</div>
  </div>

  <h2><span class="glyph">&#x2694;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Stab, Stab, Stab</h3>
      <div class="meta">Single enemy &middot; <b>3 &times; 35% ATK</b> &middot; +15% crit each</div>
      <p>One knife from each brother: <b>3 separate strikes of 35%
      ATK</b>, each with <b>15% extra chance to crit</b>.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 3</div>
      <h3>Aim for the Middle</h3>
      <div class="meta">Single enemy &middot; <b>3 &times; 40% ATK</b> &middot; center tile &times;2</div>
      <p>Three thrown blades of <b>40% ATK each</b> &#x2014; a target on the
      <b>center tile takes double</b> from every one.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 5</div>
      <h3>Triplet Flurry</h3>
      <div class="meta">Single enemy &middot; <b>3 &times; 55% ATK</b> &middot; +20% crit each</div>
      <p>All three brothers commit: <b>3 separate strikes of 55% ATK</b>,
      each with <b>20% extra chance to crit</b>.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Not a Scratch</h3>
      <div class="meta">At full HP &middot; <b>+30% damage</b></div>
      <p>At full HP the triplets deal <b>30% extra damage</b> &#x2014;
      untouched, they are unbearable.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Front hex</div>
      <h3>Knife's Edge</h3>
      <div class="meta">Front row &middot; <b>+30% Crit Damage</b></div>
      <p>From the front hex crits land with <b>+30% Crit Damage</b> &#x2014;
      the points go in first.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x2694;</span> The show</h2>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle tower"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">The tower holds, knives ready.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">Passing blades between brothers.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">A wobble, corrected.</div></div>
    <div class="clip"><img src="%%stab%%" alt="Stab, Stab, Stab"><div class="cap"><b>Stab, Stab, Stab</b> &middot; %%nf_stab%%f</div><div class="note">Three knives, one beat.</div></div>
    <div class="clip"><img src="%%toss%%" alt="Aim for the Middle"><div class="cap"><b>Aim for the Middle</b> &middot; %%nf_toss%%f</div><div class="note">The blade leaves on the flash.</div></div>
    <div class="clip"><img src="%%flurry%%" alt="Triplet Flurry"><div class="cap"><b>Triplet Flurry</b> &middot; %%nf_flurry%%f</div><div class="note">All three commit.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">The tower comes down.</div></div>
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
    html = html.replace(f'%%nf_{name}%%', str(NF[name]))

out = '/home/user/browsergacha/docs/samuels-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
