import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Koe'
PANEL = (14, 13, 16, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('koeidle.png',    7, 'idle'),
    ('koeidle1.png',   6, 'fidget1'),
    ('koeidle2.png',   7, 'fidget2'),
    ('koeskill1.png', 10, 'remedy'),
    ('koeskill2.png', 10, 'rope'),
    ('koeskill3.png', 10, 'wall'),
    ('koedeath.png',   8, 'death'),
]

def clip(fname, fps):
    im = Image.open(f'{SRC}/{fname}').convert('RGBA')
    w, h = im.size
    frames = max(1, round(w / h))
    fw = w // frames
    cells = []
    for i in range(frames):
        # Drawn unmirrored, matching the board's display of Koe.
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

html = r'''<title>Koe, Mime of the Firetroupe</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Limelight&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: greasepaint and silence. Near-black
     stage, chalk white, and ONE red accent &#x2014; the sash &#x2014; set in
     Limelight's deco marquee letters. Every color painted explicitly. */
  :root {
    --ground: #0d0c0f;
    --panel: #0e0d10;
    --panel-2: #18161b;
    --line: #3a3740;
    --ink: #f2f0ec;
    --muted: #928e9a;
    --chalk: #e8e6e0;
    --sash: #e83a44;
    --chalk-dim: #55525c;
    --display: 'Limelight', 'Georgia', serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink);
    font-family: var(--mono); font-size: 15px; line-height: 1.65; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }
  .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px; }
  .eyebrow b { color: var(--sash); font-weight: 500; }
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art { flex: 0 0 300px; position: relative;
    background: radial-gradient(ellipse 62% 46% at 50% 62%, rgba(232,230,224,.08), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--chalk-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--chalk); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 400; font-size: 66px; line-height: 1.05;
    color: var(--ink); text-wrap: balance; letter-spacing: 3px;
    text-shadow: 0 4px 0 rgba(0,0,0,.5), 0 0 34px rgba(232,230,224,.18); }
  .title-line { font-size: 14px; color: var(--sash); letter-spacing: 3px;
    font-family: var(--display); text-transform: uppercase; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.fire { border-color: var(--chalk-dim); color: var(--sash); }
  .badge.sect { border-color: var(--chalk); color: var(--chalk); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-size: 22px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.35; }
  .stat.spd .v { color: var(--sash); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  h2 { font-family: var(--display); font-weight: 400; font-size: 22px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 2px; }
  h2 .glyph { color: var(--sash); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .engine-box { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    justify-content: center; font-size: 13px; color: var(--muted); text-align: center; }
  .engine-step { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 250px; }
  .engine-step b { color: var(--sash); font-weight: 500; }
  .engine-arrow { color: var(--chalk-dim); font-size: 20px; }
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--chalk-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 400; font-size: 17px; letter-spacing: 1px; }
  .ability .ladder { margin-top: 10px; padding-top: 9px;
    border-top: 1px solid var(--line); font-family: var(--mono);
    font-size: 11px; line-height: 1.7; color: var(--muted); }
  .ability .ladder b { color: var(--ink); font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase; font-size: 10px; }
  .ability .ladder i { font-style: normal; color: var(--ink); }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--chalk); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--sash); font-weight: 500; }
  .ability.passive-card { border-color: var(--chalk-dim); }
  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }
  .acquire { margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap; align-items: baseline; }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-size: 16px; color: var(--chalk); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--sash); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>4&#x2605; Fire &middot; Firetroupe &middot; No. 5</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Koe idle animation, a white-faced mime in striped trousers and a red sash" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 4</span></div>
      <h1>KOE</h1>
      <div class="title-line">Mime of the Firetroupe</div>
      <div class="badges">
        <span class="badge fire">Fire</span>
        <span class="badge">Back-line Support</span>
        <span class="badge">Cleanse &middot; Tempo &middot; Bubble</span>
        <span class="badge sect">Firetroupe &middot; the silent act</span>
      </div>
      <p class="lede">Koe never says a word. The remedy is invisible and
      <b>fits whoever receives it</b>, the rope that hauls the front line
      forward <b>does not exist</b>, and the wall &#x2014; press both palms
      flat &#x2014; <b>eats one entire hit</b> anyway. When a burning enemy
      touches an ally, help arrives before anyone asks.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1555</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">102</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">106</div></div>
    <div class="stat spd"><div class="k">SPD</div><div class="v">108</div><div class="sub">always in position</div></div>
  </div>

  <h2><span class="glyph">&#x25cb;</span> The act</h2>
  <p class="section-sub">A support who trades in things that are not
  there: percent-of-target healing that scales with whoever is hurt,
  tempo the enemy cannot see coming, and the one wall in the game that
  stops a hit completely.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Give nothing.</b> The invisible remedy
      heals <b>15% of the ally's own pool</b> and lifts 2 debuffs.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Pull nothing.</b> The rope hauls the front
      line <b>+30% SPD and +20% turn meter</b> at once.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Build nothing.</b> The Invisible Wall is a
      <b>Bubble on every front-row ally</b> &#x2014; one whole hit, gone.</div>
  </div>

  <h2><span class="glyph">&#x25cb;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Something From Nothing</h3>
      <div class="meta">Single ally &middot; <b>15% of THEIR max HP + cleanse 2</b></div>
      <p>Produce an invisible remedy: heal one ally for <b>15% of their
      own max HP</b> and lift <b>2 debuffs</b>, oldest first.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +5% heal &rsaquo; +5% heal &rsaquo; +5% heal &rsaquo; +1 cleansed &rsaquo; +1 cleansed <i>&middot; max Lv 6</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 4 &rarr; 2 fully levelled</div>
      <h3>Pull the Rope</h3>
      <div class="meta">Front-row allies &middot; <b>+30% SPD, 2 turns &middot; +20% meter</b></div>
      <p>Haul the front line forward on a rope only Koe can see:
      <b>30% SPD for 2 turns</b> and <b>20% turn meter</b>, paid
      immediately.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +5% boon &rsaquo; +5% boon &rsaquo; +1 turn &rsaquo; +5% drain &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 7</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 6 &rarr; 4 fully levelled</div>
      <h3>The Invisible Wall</h3>
      <div class="meta">Front-row allies &middot; <b>Bubble, 2 turns</b></div>
      <p>Press both palms flat and the wall is THERE: every front-row
      ally gains a <b>Bubble</b> that absorbs <b>one whole hit</b> before
      it pops.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +1 turn &rsaquo; +1 turn &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 5</i></div>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Silent Alarm</h3>
      <div class="meta">Reactive &middot; <b>free Something From Nothing</b></div>
      <p>When an ally is struck by a <b>burning enemy</b>, Koe answers at
      once &#x2014; the remedy, cast on them, free.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Back hex</div>
      <h3>Vanishing Act</h3>
      <div class="meta">Back row &middot; <b>+15% Dodge</b></div>
      <p><b>+15% dodge</b> &#x2014; you cannot hit what refuses to be
      seen.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x25cb;</span> The show</h2>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">Waiting in perfect silence.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">Trapped in the invisible box.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">A tip of the hat to nobody.</div></div>
    <div class="clip"><img src="%%remedy%%" alt="Something From Nothing"><div class="cap"><b>Something From Nothing</b> &middot; %%nf_remedy%%f</div><div class="note">Open palms, and it appears.</div></div>
    <div class="clip"><img src="%%rope%%" alt="Pull the Rope"><div class="cap"><b>Pull the Rope</b> &middot; %%nf_rope%%f</div><div class="note">Hand over hand on nothing.</div></div>
    <div class="clip"><img src="%%wall%%" alt="The Invisible Wall"><div class="cap"><b>The Invisible Wall</b> &middot; %%nf_wall%%f</div><div class="note">Both palms flat. It holds.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">The act ends without a sound.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Fire</div></div>
    <div><div class="k">Row</div><div class="v">Back</div></div>
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

out = '/home/user/browsergacha/docs/koe-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
