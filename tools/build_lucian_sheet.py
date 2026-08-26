import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Lucian'
PANEL = (29, 21, 13, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

# (file, frames, fps, clip name) — mirrors sprite.strips in the hero def.
# NOTE: the skill 2 strip was uploaded as "lucien" — referenced exactly.
STRIPS = [
    ('lucianidle.png',    9,  5, 'idle'),
    ('lucianidle1.png',   9,  6, 'fidget1'),
    ('lucianidle2.png',   9,  7, 'fidget2'),
    ('lucianskill1.png',  9, 12, 'lash'),
    ('lucienskill2.png',  9, 10, 'forge'),
    ('lucianskill3.png',  9, 12, 'arc'),
    ('luciandeath.png',   9,  7, 'death'),
]

def clip(fname, frames, fps):
    im = Image.open(f'{SRC}/{fname}').convert('RGBA')
    w, h = im.size
    assert w % frames == 0, f'{fname}: {w}px does not divide into {frames} frames'
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
    return 'data:image/gif;base64,' + base64.b64encode(buf.getvalue()).decode()

IMG = {name: clip(f, n, fps) for f, n, fps, name in STRIPS}

html = r'''<title>Lucian, Firebrand of the Firetroupe</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rye&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: the fire show after dark. Soot
     browns lit by ember orange and flame gold — a circus poster nailed
     to the troupe's wagon. Every color painted explicitly. */
  :root {
    --ground: #151009;
    --panel: #1d150d;
    --panel-2: #251a10;
    --line: #4a3520;
    --ink: #f0e6d8;
    --muted: #a8927a;
    --ember: #ff9a5a;
    --gleam: #ffd76a;
    --ember-dim: #8a5230;
    --display: 'Rye', 'Georgia', serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: var(--ground);
    color: var(--ink);
    font-family: var(--mono);
    font-size: 15px;
    line-height: 1.65;
  }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }

  .eyebrow {
    font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px;
  }
  .eyebrow b { color: var(--ember); font-weight: 500; }

  /* ---- Hero header ---- */
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art {
    flex: 0 0 300px; position: relative;
    background:
      radial-gradient(ellipse 62% 46% at 50% 62%, rgba(255,154,90,.16), transparent 70%),
      var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    min-height: 320px;
  }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag {
    position: absolute; top: 10px; left: 12px;
    font-size: 11px; letter-spacing: 2px; color: var(--ember-dim);
    text-transform: uppercase;
  }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--gleam); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 {
    font-family: var(--display); font-weight: 400; font-size: 64px;
    line-height: 1; color: var(--ink); text-wrap: balance; letter-spacing: 4px;
    text-shadow: 0 0 34px rgba(255,154,90,.45);
  }
  .title-line { font-size: 15px; color: var(--ember); letter-spacing: 4px;
    font-family: var(--display); text-transform: uppercase; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge {
    font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px;
  }
  .badge.fire { border-color: var(--ember-dim); color: var(--ember); }
  .badge.sect { border-color: var(--gleam); color: var(--gleam); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }

  /* ---- Stats ---- */
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 16px;
  }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v {
    font-family: var(--display); font-size: 26px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.25;
  }
  .stat.atk .v { color: var(--ember); }
  .stat .sub { font-size: 11px; color: var(--muted); }

  /* ---- Sections ---- */
  h2 {
    font-family: var(--display); font-weight: 400; font-size: 26px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 3px; text-transform: uppercase;
  }
  h2 .glyph { color: var(--ember); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }

  /* ---- The engine ---- */
  .engine-box {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px;
    flex-wrap: wrap; align-items: center; justify-content: center;
    font-size: 13px; color: var(--muted); text-align: center;
  }
  .engine-step {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 240px;
  }
  .engine-step b { color: var(--ember); font-weight: 500; }
  .engine-arrow { color: var(--ember-dim); font-size: 20px; }

  /* ---- Ricochet odds ---- */
  .odds-box {
    margin-top: 22px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 24px 20px 16px; overflow-x: auto;
  }
  .odds { display: grid; grid-template-columns: repeat(5, minmax(120px, 1fr)); gap: 14px; min-width: 640px; }
  .odd {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 14px 12px; text-align: center;
  }
  .odd .who { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .odd .num {
    font-family: var(--display); font-size: 34px; line-height: 1.15;
    color: var(--ember); font-variant-numeric: tabular-nums;
  }
  .odd .what { font-size: 12px; color: var(--muted); }
  .odds-cap { font-size: 12px; color: var(--muted); margin-top: 14px; }
  .odds-cap b { color: var(--ember); font-weight: 500; }

  /* ---- Abilities ---- */
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px;
  }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--ember-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 400; font-size: 21px; letter-spacing: 1px; }
  .ability .ladder { margin-top: 10px; padding-top: 9px;
    border-top: 1px solid var(--line); font-family: var(--mono);
    font-size: 11px; line-height: 1.7; color: var(--muted); }
  .ability .ladder b { color: var(--ink); font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase; font-size: 10px; }
  .ability .ladder i { font-style: normal; color: var(--ink); }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--gleam); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--ember); font-weight: 500; }
  .ability.passive-card { border-color: var(--ember-dim); }

  .dmg-table-box { margin-top: 22px; overflow-x: auto; background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; min-width: 620px; font-size: 13px; }
  th, td { padding: 9px 14px; text-align: right; font-variant-numeric: tabular-nums; }
  thead th { color: var(--muted); font-weight: 500; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid var(--line); }
  tbody th { text-align: left; font-weight: 500; color: var(--ink); white-space: nowrap; }
  tbody tr + tr td, tbody tr + tr th { border-top: 1px solid #33241a; }
  td.max { color: var(--ember); font-weight: 600; }
  .table-cap { font-size: 12px; color: var(--muted); padding: 10px 14px 12px; }

  /* ---- Gallery ---- */
  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }

  /* ---- Footer ---- */
  .acquire {
    margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap;
    align-items: baseline;
  }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-size: 20px; color: var(--gleam); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--ember); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>5&#x2605; Fire &middot; Firetroupe &middot; No. 5</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Lucian idle animation, a red-clad fire performer at ease" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 5</span></div>
      <h1>LUCIAN</h1>
      <div class="title-line">Firebrand of the Firetroupe</div>
      <div class="badges">
        <span class="badge fire">Fire</span>
        <span class="badge">Back-row DPS</span>
        <span class="badge">Burn engine</span>
        <span class="badge sect">Firetroupe &middot; founding member</span>
      </div>
      <p class="lede">First of a new order. Lucian works like a fire show:
      <b>light something</b>, let it spread, and feed on the glow &#x2014;
      every burning enemy stokes his forge with <b>permanent ATK</b>, and
      the finale is a flame that <b>refuses to stop bouncing</b>.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">975</div></div>
    <div class="stat atk"><div class="k">ATK</div><div class="v">189</div><div class="sub">before the forge</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">64</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">106</div></div>
  </div>

  <h2><span class="glyph">&#x2666;</span> The burn engine</h2>
  <p class="section-sub">Three verbs, one loop. The burn is not decoration:
  it is fuel for everything else in the kit.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Light it.</b> Cinder Lash leaves a burn
      eating <b>3% of the victim's max HP</b> every turn.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Feed on it.</b> Stoke the Forge banks
      <b>+50 permanent ATK per burning enemy</b>, up to 1000 a battle.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Cash out.</b> Wildfire Arc ricochets at
      <b>125% ATK per hit</b> &#x2014; and the forge already made that ATK bigger.</div>
  </div>

  <h2><span class="glyph">&#x2666;</span> Ricochet odds</h2>
  <p class="section-sub">Every hit has a 75% chance to leap to another
  enemy and strike again, indefinitely. With one enemy standing, the fire
  leaps back into them.</p>
  <div class="odds-box">
    <div class="odds">
      <div class="odd"><div class="who">2+ hits</div><div class="num">75%</div><div class="what">of casts</div></div>
      <div class="odd"><div class="who">3+ hits</div><div class="num">56%</div><div class="what">of casts</div></div>
      <div class="odd"><div class="who">5+ hits</div><div class="num">32%</div><div class="what">of casts</div></div>
      <div class="odd"><div class="who">8+ hits</div><div class="num">13%</div><div class="what">of casts</div></div>
      <div class="odd"><div class="who">Expected</div><div class="num">4</div><div class="what">hits per cast</div></div>
    </div>
    <p class="odds-cap">Expected total: <b>~500% ATK per cast</b> (4 hits
    &#xd7; 125%), swinging from a single 125% lash to a run the table
    never forgets.</p>
  </div>

  <h2><span class="glyph">&#x2666;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Cinder Lash</h3>
      <div class="meta">Single enemy &middot; <b>110% ATK</b></div>
      <p>Lash one enemy with a <b>50% chance</b> to set them alight: the
      burn eats <b>3% of their
      max HP</b> at the start of each of their turns, for 3 turns. The
      bigger they are, the better they burn.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +10% power &rsaquo; +20% land chance &rsaquo; +20% land chance &rsaquo; +10% land chance <i>&middot; max Lv 6</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 4 &rarr; 2 fully levelled</div>
      <h3>Stoke the Forge</h3>
      <div class="meta">Self &middot; <b>permanent ATK</b></div>
      <p>Draw heat from the field: gain <b>50 ATK for the rest of the
      fight per burning enemy</b>, banking up to <b>1000 ATK</b> per
      battle. The fires do not need to be his.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10 ATK each &rsaquo; +10 ATK each &rsaquo; +10 ATK each &rsaquo; +10 ATK each &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 7</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 6 &rarr; 4 fully levelled</div>
      <h3>Wildfire Arc</h3>
      <div class="meta">Ricochet &middot; <b>125% ATK per hit</b></div>
      <p>Hurl fire that strikes for <b>125% ATK</b>, then leaps to another
      enemy with a <b>75% chance, indefinitely</b>. Alone on the field,
      the flame leaps back into the same enemy.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 8</i></div>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>By Firelight</h3>
      <div class="meta">While any enemy burns</div>
      <p>While at least one enemy carries a burn, Lucian fights at
      <b>+30% ATK</b> &#x2014; he works best by the light of his own fires.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Back hex</div>
      <h3>Pyre Sight</h3>
      <div class="meta">Back row &middot; <b>+30% accuracy</b></div>
      <p>From the back of the tent the fire lights every mark &#x2014; his
      burns and debuffs land through resistance far more often.</p>
    </div>
  </div>

  <div class="dmg-table-box">
    <table>
      <thead><tr><th>Swing (base ATK 280)</th><th>0 forged</th><th>+500 forged</th><th>+1000 forged</th></tr></thead>
      <tbody>
        <tr><th>Cinder Lash (110%)</th><td>308</td><td>858</td><td>1408</td></tr>
        <tr><th>Wildfire Arc, one hit (125%)</th><td>350</td><td>975</td><td>1600</td></tr>
        <tr><th>Wildfire Arc, expected (4 hits)</th><td>1400</td><td>3900</td><td class="max">6400</td></tr>
        <tr><th>&#x2026;with By Firelight (+30%)</th><td>1820</td><td>5070</td><td class="max">8320</td></tr>
      </tbody>
    </table>
    <p class="table-cap">Raw swing before defenses, level 1 stats, no gear
    &#x2014; the point is the shape: the forge turns every later Arc into a
    bigger finale, and the burns themselves tick off max HP untouched by DEF.</p>
  </div>

  <h2><span class="glyph">&#x2666;</span> The show</h2>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle sway"><div class="cap"><b>Idle</b> &middot; 9f</div><div class="note">At ease between acts.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; 9f</div><div class="note">A flourish for the crowd.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; 9f</div><div class="note">Testing the flame.</div></div>
    <div class="clip"><img src="%%lash%%" alt="Cinder Lash attack"><div class="cap"><b>Cinder Lash</b> &middot; 9f</div><div class="note">The strike that starts the fire.</div></div>
    <div class="clip"><img src="%%forge%%" alt="Stoke the Forge"><div class="cap"><b>Stoke the Forge</b> &middot; 9f</div><div class="note">Heat drawn in, kept for good.</div></div>
    <div class="clip"><img src="%%arc%%" alt="Wildfire Arc"><div class="cap"><b>Wildfire Arc</b> &middot; 9f</div><div class="note">The finale that keeps going.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; 9f</div><div class="note">The last light goes out.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Fire</div></div>
    <div><div class="k">Row</div><div class="v">Back</div></div>
    <div><div class="k">Summon</div><div class="v">Rare Scrolls &middot; 5&#x2605; at 2%</div></div>
    <div><div class="k">Pity</div><div class="v">5&#x2605; within 100 plain pulls</div></div>
    <div><div class="k">On arrival</div><div class="v">Auto-favourited</div></div>
  </div>

  <p class="foot">Sheet drawn from the live hero definition
  (js/data/heroes/humans.js) and the uploaded spritesheets, untouched.
  Play at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a>.</p>
</div>
'''

for name, uri in IMG.items():
    html = html.replace(f'%%{name}%%', uri)

out = '/home/user/browsergacha/docs/lucian-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
