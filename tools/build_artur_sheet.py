import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Artur'
PANEL = (20, 16, 10, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('arturidle.png',    7, 'idle'),
    ('arturidle1.png',   6, 'fidget1'),
    ('arturidle2.png',   7, 'fidget2'),
    ('arturskill1.png', 10, 'note'),
    ('arturskill2.png', 10, 'letter'),
    ('arturskill3.png', 10, 'page'),
    ('arturdeath.png',   8, 'death'),
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

html = r'''<title>Artur, Scribe of Reverence</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: the scriptorium. Candle-dark sepia
     under parchment cream and gold leaf, set in Uncial Antiqua's
     manuscript hand. Every color painted explicitly. */
  :root {
    --ground: #131008;
    --panel: #14100a;
    --panel-2: #1e1810;
    --line: #46381e;
    --ink: #f2ead8;
    --muted: #a8967a;
    --leaf: #ffc95a;
    --vellum: #e8dcc0;
    --leaf-dim: #7a6228;
    --display: 'Uncial Antiqua', 'Georgia', serif;
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
    background: radial-gradient(ellipse 62% 46% at 50% 62%, rgba(255,201,90,.12), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--leaf-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--leaf); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 400; font-size: 62px; line-height: 1.05;
    color: var(--ink); text-wrap: balance; letter-spacing: 2px;
    text-shadow: 0 4px 0 rgba(0,0,0,.5), 0 0 34px rgba(255,201,90,.25); }
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
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>3&#x2605; Light &middot; Reverence &middot; No. 4</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Artur idle animation, a hooded scribe in white and gold vestments holding an open tome" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 3</span></div>
      <h1>ARTUR</h1>
      <div class="title-line">Scribe of Reverence</div>
      <div class="badges">
        <span class="badge light">Light</span>
        <span class="badge">Back-line Support</span>
        <span class="badge">Crit &middot; Tempo</span>
        <span class="badge sect">Reverence &middot; the scriptorium</span>
      </div>
      <p class="lede">The order's record is whatever Artur writes, and he
      writes his allies' turns <b>early</b>. A margin note sharpens a
      crit, gold leaf makes it land heavier, the page turns for the whole
      party at once &#x2014; and what is set down in <b>permanent ink</b>,
      no enemy can scratch out.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1450</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">101</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">110</div></div>
    <div class="stat spd"><div class="k">SPD</div><div class="v">112</div><div class="sub">the pen is quick</div></div>
  </div>

  <h2><span class="glyph">&#x270E;</span> The record</h2>
  <p class="section-sub">A tempo-and-crit support with no heal and no
  shield: he pays his allies in turns taken sooner and crits that land
  harder, and his passive makes the whole team's action bars untouchable.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Annotate.</b> Margin Note and Illuminated
      Letter buff <b>crit chance and crit damage</b>, each with <b>30%
      meter</b> attached.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Turn the page.</b> The whole party
      advances <b>15% turn meter</b> at once.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Ink holds.</b> Effects that would drain
      the team's meters are <b>refused</b> while he lives.</div>
  </div>

  <h2><span class="glyph">&#x270E;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Margin Note</h3>
      <div class="meta">Single ally &middot; <b>+30% Crit Chance, 2 turns &middot; +30% meter</b></div>
      <p>A sharp annotation in one ally's margin: <b>+30% Crit Chance for
      2 turns</b> and <b>30% turn meter</b> at once.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +5% boon &rsaquo; +5% boon &rsaquo; +5% boon &rsaquo; +1 turn &rsaquo; +5% drain <i>&middot; max Lv 6</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 4 &rarr; 2 fully levelled</div>
      <h3>Illuminated Letter</h3>
      <div class="meta">Single ally &middot; <b>+60% Crit Damage, 2 turns &middot; +30% meter</b></div>
      <p>Gold leaf on one ally's initial: <b>+60% Crit Damage for 2
      turns</b> and <b>30% turn meter</b> at once.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +5% boon &rsaquo; +5% boon &rsaquo; +5% boon &rsaquo; +1 turn &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 7</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 6 &rarr; 4 fully levelled</div>
      <h3>Turn the Page</h3>
      <div class="meta">All allies &middot; <b>+15% turn meter</b></div>
      <p>The whole chapter advances: <b>every ally gains 15% turn
      meter</b>.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +5% drain &rsaquo; +5% drain &rsaquo; +5% drain &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 6</i></div>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Permanent Ink</h3>
      <div class="meta">Team-wide &middot; <b>meter drains refused</b></div>
      <p>What Artur has written stands: effects that would <b>drain his
      team's turn meters are refused</b> while he lives.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Back hex</div>
      <h3>Shorthand</h3>
      <div class="meta">Back row &middot; <b>+15 SPD</b></div>
      <p><b>+15 SPD</b> &#x2014; the pen moves faster than the sword.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x270E;</span> The manuscript</h2>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">Reading, always reading.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">A page checked twice.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">Ink on the thumb.</div></div>
    <div class="clip"><img src="%%note%%" alt="Margin Note"><div class="cap"><b>Margin Note</b> &middot; %%nf_note%%f</div><div class="note">The quill flicks its verdict.</div></div>
    <div class="clip"><img src="%%letter%%" alt="Illuminated Letter"><div class="cap"><b>Illuminated Letter</b> &middot; %%nf_letter%%f</div><div class="note">The page takes its gold.</div></div>
    <div class="clip"><img src="%%page%%" alt="Turn the Page"><div class="cap"><b>Turn the Page</b> &middot; %%nf_page%%f</div><div class="note">The chapter moves for everyone.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">The book closes itself.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Light</div></div>
    <div><div class="k">Row</div><div class="v">Back</div></div>
    <div><div class="k">Summon</div><div class="v">Temporal Scrolls &middot; 3&#x2605; band</div></div>
    <div><div class="k">Sect</div><div class="v">Reverence &middot; No. 4</div></div>
  </div>

  <p class="foot">Sheet drawn from the live hero definition
  (js/data/heroes/humans.js) and the uploaded spritesheets, untouched.
  Play at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a>.</p>
</div>
'''

for name, uri in IMG.items():
    html = html.replace(f'%%{name}%%', uri)
    html = html.replace(f'%%nf_{name}%%', str(NF[name]))

out = '/home/user/browsergacha/docs/artur-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
