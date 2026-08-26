import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/emily'
PANEL = (34, 30, 48, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

# (file, frames, fps, clip name) — mirrors sprite.strips in the hero def.
STRIPS = [
    ('emilyidle.png',   9,  4, 'idle'),
    ('emilyidle1.png',  9,  6, 'fidget1'),
    ('emilyidle2.png',  9,  6, 'fidget2'),
    ('emilyskill1.png', 9, 10, 'lightmend'),
    ('emilyskill2.png', 9, 10, 'chorus'),
    ('emilyskill3.png', 9, 10, 'seconddawn'),
    ('emilydeath.png', 17,  8, 'death'),
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

html = r'''<title>Emily, Dawn Cleric</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: first light on pre-dawn violet.
     Every ground and color is painted explicitly. */
  :root {
    --ground: #191622;
    --panel: #221e30;
    --panel-2: #2a2540;
    --line: #453e5e;
    --ink: #f0ecf4;
    --muted: #a49cbe;
    --dawn: #f2b88e;
    --halo: #ffe6c0;
    --dawn-dim: #8f6f52;
    --display: 'Cormorant Garamond', 'Georgia', serif;
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
  .eyebrow b { color: var(--dawn); font-weight: 500; }

  /* ---- Hero header ---- */
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art {
    flex: 0 0 300px; position: relative;
    background:
      radial-gradient(ellipse 65% 45% at 50% 60%, rgba(242,184,142,.17), transparent 70%),
      var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    min-height: 320px;
  }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag {
    position: absolute; top: 10px; left: 12px;
    font-size: 11px; letter-spacing: 2px; color: var(--dawn-dim);
    text-transform: uppercase;
  }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--halo); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 {
    font-family: var(--display); font-weight: 700; font-size: 76px;
    line-height: .9; color: var(--ink); text-wrap: balance;
    text-shadow: 0 0 34px rgba(242,184,142,.4);
  }
  .title-line { font-size: 17px; font-family: var(--display); font-style: italic;
    color: var(--dawn); letter-spacing: 1px; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge {
    font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px;
  }
  .badge.light { border-color: var(--dawn-dim); color: var(--dawn); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }

  /* ---- Stats ---- */
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 16px;
  }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v {
    font-family: var(--display); font-weight: 600; font-size: 32px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.1;
  }
  .stat.atk .v { color: var(--dawn); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  .stats-note { font-size: 12px; color: var(--muted); margin-top: 8px; }

  /* ---- Sections ---- */
  h2 {
    font-family: var(--display); font-weight: 600; font-size: 34px;
    margin: 64px 0 6px; color: var(--ink);
  }
  h2 .glyph { color: var(--dawn); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }

  /* ---- Signature ---- */
  .sig-grid { display: flex; gap: 20px; flex-wrap: wrap; }
  .sig-copy { flex: 1 1 360px; }
  .sig-copy ul { list-style: none; display: flex; flex-direction: column; gap: 14px; }
  .sig-copy li { padding-left: 22px; position: relative; color: var(--ink); }
  .sig-copy li::before { content: '\2726'; position: absolute; left: 0; color: var(--dawn); font-size: 12px; top: 4px; }
  .sig-copy li b { color: var(--dawn); font-weight: 500; }
  .sig-copy li .dim { color: var(--muted); }
  .sig-box {
    flex: 0 0 300px; background: var(--panel); border: 2px solid var(--line);
    border-radius: 8px; padding: 10px; text-align: center;
  }
  .sig-box img { width: 100%; max-width: 280px; display: block; margin: 0 auto; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }

  /* ---- Abilities ---- */
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px;
  }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--dawn-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 600; font-size: 26px; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--halo); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--dawn); font-weight: 500; }
  .ability.passive-card { border-color: var(--dawn-dim); }

  .dmg-table-box { margin-top: 22px; overflow-x: auto; background: var(--panel); border: 2px solid var(--line); border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; min-width: 620px; font-size: 13px; }
  th, td { padding: 9px 14px; text-align: right; font-variant-numeric: tabular-nums; }
  thead th { color: var(--muted); font-weight: 500; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid var(--line); }
  tbody th { text-align: left; font-weight: 500; color: var(--ink); white-space: nowrap; }
  tbody tr + tr td, tbody tr + tr th { border-top: 1px solid #322c48; }
  td.max { color: var(--dawn); font-weight: 600; }
  .table-cap { font-size: 12px; color: var(--muted); padding: 10px 14px 12px; }

  /* ---- Gallery ---- */
  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }

  /* ---- Footer ---- */
  .acquire {
    margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap;
    align-items: baseline;
  }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-weight: 600; font-size: 24px; color: var(--halo); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--dawn); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>4&#x2605; Light &middot; Reverence Sect</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Emily idle animation, staff of first light" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 4</span></div>
      <h1>Emily</h1>
      <div class="title-line">Dawn Cleric</div>
      <div class="badges">
        <span class="badge light">&#x2600;&#xfe0f; Light</span>
        <span class="badge">Center support</span>
        <span class="badge">Heals, cleanses &amp; revives</span>
        <span class="badge">Reverence Sect</span>
      </div>
      <p class="lede">Reverence's gentlest hand, and the one healer in the game
      who refuses to accept a death. She mends one ally at a time in gold
      light, purifies the whole party in a single chorus &#x2014; and when someone
      falls anyway, <b>she simply brings the dawn back around</b>.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1085</div><div class="sub">scales her heals</div></div>
    <div class="stat atk"><div class="k">ATK</div><div class="v">159</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">96</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">105</div></div>
    <div class="stat"><div class="k">Crit</div><div class="v">15%</div><div class="sub">&#xd7;1.5 damage</div></div>
  </div>
  <div class="stats-note">Base values at level 1 &#x2014; stats scale with level and &#x2605; ascension like every hero.</div>

  <h2><span class="glyph">&#x2726;</span> Second Dawn</h2>
  <div class="section-sub">Her signature: the strongest revival in the roster &#x2014; nobody else brings an ally back with as much life.</div>
  <div class="sig-grid">
    <div class="sig-copy">
      <ul>
        <li><b>A halo builds through nine frames.</b> The light gathers low and rises, cresting on the final beat &#x2014; that is when the revival lands.</li>
        <li><b>A fallen ally stands back up with 40% of their max HP.</b> Debuffs gone, action bar reset &#x2014; a second morning, not a stay of execution.</li>
        <li><b>Seven-turn cooldown.</b> One resurrection per stretch of battle; spend it on the hero the fight cannot be won without.</li>
        <li><span class="dim">Timing note: she can pre-empt a loss &#x2014; a chorus to keep the line standing, the dawn held in reserve for whoever slips through.</span></li>
      </ul>
    </div>
    <div class="sig-box">
      <img src="%%seconddawn%%" alt="Emily calling a fallen ally back with a radiant halo" width="280" height="280">
      <div class="cap">The halo crests &middot; the fallen rise</div>
    </div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Kit</h2>
  <div class="section-sub">A whole kit with no attack in it: one focused mend, one purifying chorus,
    one resurrection &#x2014; and a passive that quietly lifts a curse every turn she takes.</div>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; no cooldown</div>
      <h3>Lightmend</h3>
      <div class="meta">Single ally &middot; heals <b>30% of her max HP</b></div>
      <p>Bathes one ally in light. Her bread and butter &#x2014; a third of her
      own life total handed over as healing, every turn, forever. Build
      her HP and every mend grows with it.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; 5-turn cooldown</div>
      <h3>Purifying Chorus</h3>
      <div class="meta">All allies &middot; heals <b>20% of her max HP</b> each + cleanse</div>
      <p>Heals <b>every ally at once</b> and strips their debuffs &#x2014; poisons
      included. The answer to a bad turn the whole party took together.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; 7-turn cooldown</div>
      <h3>Second Dawn</h3>
      <div class="meta">A fallen ally &middot; <b>revives at 40% max HP</b></div>
      <p>Calls a dead teammate back to the fight at <b>40% max HP</b> &#x2014;
      the strongest revival in the game.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Serenity</h3>
      <p>At the start of her turn, <b>removes one debuff from the most
      afflicted ally</b> &#x2014; free, automatic, every single turn.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Position bonus &middot; center hex</div>
      <h3>Press the Flank</h3>
      <p>From the center hex she deals <b>+20% damage to enemies below half
      HP</b> &#x2014; academic for a cleric who never swings, a bonus she mostly
      carries rather than uses &#x2014; her work is keeping yours alive.</p>
    </div>
  </div>

  <div class="dmg-table-box">
    <table>
      <thead>
        <tr><th style="text-align:left">Skill power by skill level</th>
          <th>Lv 1</th><th>Lv 2</th><th>Lv 3</th><th>Lv 4</th><th>Lv 5</th></tr>
      </thead>
      <tbody>
        <tr><th>Lightmend, % of her max HP</th><td>30</td><td>33</td><td>36</td><td>39</td><td class="max">42</td></tr>
        <tr><th>Purifying Chorus, % of her max HP each</th><td>20</td><td>22</td><td>24</td><td>26</td><td class="max">28</td></tr>
        <tr><th>Second Dawn, % max HP restored</th><td>40</td><td>40</td><td>40</td><td>40</td><td class="max">40</td></tr>
      </tbody>
    </table>
    <div class="table-cap">Skill levels add +10% power per level (max Lv 5) &#x2014; raised in Improve by
      sacrificing another Emily. The revival's 40% is fixed: a second life doesn't scale.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Animations</h2>
  <div class="section-sub">Hand-drawn 256px strips &#x2014; seven in all, including two timed idle
    fidgets and a seventeen-frame fall.</div>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle animation"><div class="cap"><b>Idle</b></div><div class="note">9 frames &middot; her resting loop</div></div>
    <div class="clip"><img src="%%lightmend%%" alt="Lightmend animation"><div class="cap"><b>Lightmend</b></div><div class="note">9 frames &middot; the blessing lands on frame 6</div></div>
    <div class="clip"><img src="%%chorus%%" alt="Purifying Chorus animation"><div class="cap"><b>Purifying Chorus</b></div><div class="note">9 frames &middot; the chorus crests on frame 6</div></div>
    <div class="clip"><img src="%%seconddawn%%" alt="Second Dawn animation"><div class="cap"><b>Second Dawn</b></div><div class="note">9 frames &middot; the revival lands as the halo peaks</div></div>
    <div class="clip"><img src="%%death%%" alt="Death animation"><div class="cap"><b>Death</b></div><div class="note">17 frames &middot; the long fall, frozen on the last</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Idle Fidget I</b></div><div class="note">plays every 7&#x2013;14s of idling</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Idle Fidget II</b></div><div class="note">plays every 7&#x2013;14s of idling</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Temporal Scroll &#x1f300;</div><div class="v">4&#x2605; band &middot; 12%</div></div>
    <div style="flex:1 1 300px"><div class="k">Where she comes from</div>
      <div style="font-size:13px;color:var(--muted)">Light and Dark heroes summon <em>only</em> from Temporal Scrolls
      &#x2014; 1% from any hunt or boss stage 15+, guaranteed every 50th tower floor,
      or 500 &#x1f48e; in the Shop.</div></div>
  </div>

  <div class="foot">Play her now at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a> &middot; eighth of the Reverence Sect, beside Catherine, Toll, Javarious, Leonardo, Oak, Silas and Eli.</div>
</div>
'''

for k, v in IMG.items():
    html = html.replace(f'%%{k}%%', v)

# Emit pure ASCII. A published artifact is wrapped in a <head> this file
# does not control, so it cannot declare its own charset; escaping means
# the glyphs never depend on one being supplied.
html = ''.join(c if ord(c) < 128 else f'&#x{ord(c):x};' for c in html)

out = '/home/user/browsergacha/docs/emily-sheet.html'
with open(out, 'w') as f:
    f.write(html)
print(out, os.path.getsize(out) // 1024, 'KB')
