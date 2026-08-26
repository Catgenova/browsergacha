import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Leonardo'
PANEL = (28, 25, 53, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

# (file, frames, fps, clip name) — mirrors sprite.strips in the hero def.
STRIPS = [
    ('leonardoidle.png',   9,  5, 'idle'),
    ('leonardoidle1.png',  9,  6, 'fidget1'),
    ('leonardoidle2.png',  9,  6, 'fidget2'),
    ('leonardoskill1.png', 9, 10, 'processional'),
    ('leonardoskill2.png', 9, 10, 'calltoarms'),
    ('leonardoskill3.png', 9, 10, 'rite'),
    ('leonardodeath.png',  9,  7, 'death'),
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

html = r'''<title>Leonardo, Herald of Reverence</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: a Light hero read at dusk, gilt on
     twilight indigo. Every ground and color is painted explicitly. */
  :root {
    --ground: #141220;
    --panel: #1c1935;
    --panel-2: #241f42;
    --line: #3d3766;
    --ink: #ece8f4;
    --muted: #9a93bb;
    --gilt: #f5d87a;
    --radiance: #ffe9a8;
    --gilt-dim: #8f7f3e;
    --display: 'Cinzel', 'Georgia', serif;
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
  .eyebrow b { color: var(--gilt); font-weight: 500; }

  /* ---- Hero header ---- */
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art {
    flex: 0 0 300px; position: relative;
    background:
      radial-gradient(ellipse 60% 45% at 50% 62%, rgba(245,216,122,.15), transparent 70%),
      var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    min-height: 320px;
  }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag {
    position: absolute; top: 10px; left: 12px;
    font-size: 11px; letter-spacing: 2px; color: var(--gilt-dim);
    text-transform: uppercase;
  }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--gilt); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 {
    font-family: var(--display); font-weight: 700; font-size: 62px;
    line-height: 1; color: var(--ink); text-wrap: balance; letter-spacing: 2px;
    text-shadow: 0 0 32px rgba(245,216,122,.35);
  }
  .title-line { font-size: 16px; color: var(--gilt); letter-spacing: 1px; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge {
    font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px;
  }
  .badge.light { border-color: var(--gilt-dim); color: var(--gilt); }
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
    font-family: var(--display); font-size: 30px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.15;
  }
  .stat.spd .v { color: var(--gilt); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  .stats-note { font-size: 12px; color: var(--muted); margin-top: 8px; }

  /* ---- Sections ---- */
  h2 {
    font-family: var(--display); font-weight: 600; font-size: 28px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 1px;
  }
  h2 .glyph { color: var(--gilt); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }

  /* ---- The round (buff uptime timeline) ---- */
  .round-box {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 20px 20px 16px; overflow-x: auto;
  }
  .round { display: grid; grid-template-columns: 120px repeat(6, minmax(64px, 1fr)); gap: 6px; min-width: 560px; align-items: center; }
  .round .h { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; text-align: center; }
  .round .rowk { font-size: 12px; color: var(--ink); letter-spacing: 1px; white-space: nowrap; }
  .round .rowk small { display: block; color: var(--muted); letter-spacing: 0; }
  .cell { height: 26px; border-radius: 4px; background: var(--panel-2); border: 1px solid var(--line); }
  .cell.on {
    background: linear-gradient(180deg, var(--radiance), var(--gilt));
    border-color: var(--gilt); box-shadow: 0 0 10px rgba(245,216,122,.35);
  }
  .cell.cast { position: relative; }
  .cell.cast::after {
    content: attr(data-note); position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; letter-spacing: 1px; color: #141220; font-weight: 600;
  }
  .round-cap { font-size: 12px; color: var(--muted); margin-top: 12px; }
  .round-cap b { color: var(--gilt); font-weight: 500; }

  /* ---- Abilities ---- */
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px;
  }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--gilt-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 600; font-size: 22px; letter-spacing: 1px; }
  .ability .ladder { margin-top: 10px; padding-top: 9px;
    border-top: 1px solid var(--line); font-family: var(--mono);
    font-size: 11px; line-height: 1.7; color: var(--muted); }
  .ability .ladder b { color: var(--ink); font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase; font-size: 10px; }
  .ability .ladder i { font-style: normal; color: var(--ink); }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--gilt); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--gilt); font-weight: 500; }
  .ability.passive-card { border-color: var(--gilt-dim); }

  /* ---- Gallery ---- */
  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
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
  .acquire .v { font-family: var(--display); font-size: 22px; color: var(--gilt); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--gilt); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>3&#x2605; Light &middot; Reverence Sect</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Leonardo idle animation, trumpet at rest" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 3</span></div>
      <h1>LEONARDO</h1>
      <div class="title-line">Herald of Reverence</div>
      <div class="badges">
        <span class="badge light">&#x2600;&#xfe0f; Light</span>
        <span class="badge">Center support</span>
        <span class="badge">Buffs &amp; cleansing</span>
        <span class="badge">Completes Reverence, No. 4</span>
      </div>
      <p class="lede">The sect's gilded trumpeter, and the fourth name that
      completes Reverence's roster. He never swings a weapon: every turn is a
      proclamation &#x2014; <b>the whole party marches faster, hits harder, and
      walks out from under its curses</b> &#x2014; and an enemy who dares to be
      ready before him is put back in their place.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1200</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">133</div><div class="sub">he never uses it</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">120</div></div>
    <div class="stat spd"><div class="k">SPD</div><div class="v">106</div><div class="sub">the herald leads</div></div>
    <div class="stat"><div class="k">Crit</div><div class="v">15%</div><div class="sub">&#xd7;1.5 damage</div></div>
  </div>
  <div class="stats-note">Base values at level 1 &#x2014; stats scale with level and &#x2605; ascension like every hero.</div>

  <h2><span class="glyph">&#x266A;</span> The Herald's Round</h2>
  <div class="section-sub">His skills interlock into a marching order. Alternating
    Processional with the others keeps the party's speed lit on every single turn,
    and strength up two turns in every three.</div>
  <div class="round-box">
    <div class="round">
      <div></div>
      <div class="h">T1</div><div class="h">T2</div><div class="h">T3</div>
      <div class="h">T4</div><div class="h">T5</div><div class="h">T6</div>
      <div class="rowk">He plays&#x2026;<small>one call per turn</small></div>
      <div class="cell cast on" data-note="SPD"></div>
      <div class="cell cast on" data-note="ATK"></div>
      <div class="cell cast on" data-note="SPD"></div>
      <div class="cell cast on" data-note="RITE"></div>
      <div class="cell cast on" data-note="SPD"></div>
      <div class="cell cast on" data-note="ATK"></div>
      <div class="rowk">+25% SPD<small>whole party</small></div>
      <div class="cell on"></div><div class="cell on"></div><div class="cell on"></div>
      <div class="cell on"></div><div class="cell on"></div><div class="cell on"></div>
      <div class="rowk">+30% ATK<small>whole party</small></div>
      <div class="cell"></div><div class="cell on"></div><div class="cell on"></div>
      <div class="cell"></div><div class="cell"></div><div class="cell on"></div>
    </div>
    <div class="round-cap">One possible six-turn round. <b>Processional has no cooldown</b>,
      so the party's +25% SPD simply never goes out &#x2014; and every point of speed his
      hymns buy is credited back to Leonardo on the damage meter.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Kit</h2>
  <div class="section-sub">Three proclamations and no attacks &#x2014; a pure voice. The
    fourth card is the vow that punishes anyone readier than the party he sings for.</div>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; no cooldown</div>
      <h3>Processional</h3>
      <div class="meta">All allies &middot; <b>+25% SPD, 2 turns</b></div>
      <p>The herald sets the pace. Cast on rotation it is <b>permanent</b> &#x2014;
      the whole party outruns the enemy line for the entire fight.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +5% boon &rsaquo; +5% boon &rsaquo; +5% boon &rsaquo; +5% boon &rsaquo; +1 turn <i>&middot; max Lv 6</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; 4-turn cooldown &rarr; 2 fully levelled</div>
      <h3>Call to Arms</h3>
      <div class="meta">All allies &middot; <b>+30% ATK, 2 turns</b></div>
      <p>A ringing proclamation before the blow lands. Time it ahead of the
      party's biggest turns.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +5% boon &rsaquo; +5% boon &rsaquo; +5% boon &rsaquo; +1 turn &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 7</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; 5-turn cooldown &rarr; 3 fully levelled</div>
      <h3>Rite of Absolution</h3>
      <div class="meta">All allies &middot; <b>lifts up to 2 debuffs each</b></div>
      <p>Poisons, slows, armor breaks, ATK curses &#x2014; the two oldest afflictions
      on <b>every ally</b> are struck from the record at once.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +1 cleansed &rsaquo; +1 cleansed &rsaquo; +1 cleansed &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 6</i></div>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Exalted Rebuke</h3>
      <p>Carrying <b>3 or more buffs</b> at the start of his turn, the herald rebukes
      the enemy with the fullest turn meter: <b>-20% turn meter</b>. His own hymns
      supply two &#x2014; the third blessing must come from an ally, a positional,
      or a resonance.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Position bonus &middot; center hex</div>
      <h3>Warding Circle</h3>
      <p>From the center hex, at the start of each of his turns, he quietly
      <b>lifts one debuff from a hobbled teammate</b> &#x2014; absolution between
      the rites.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Animations</h2>
  <div class="section-sub">Hand-drawn 256px strips &#x2014; seven in all, nine frames each,
    including two timed idle fidgets.</div>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle animation"><div class="cap"><b>Idle</b></div><div class="note">his resting loop, trumpet lowered</div></div>
    <div class="clip"><img src="%%processional%%" alt="Processional animation"><div class="cap"><b>Processional</b></div><div class="note">the pace-setting call &middot; lands on frame 6</div></div>
    <div class="clip"><img src="%%calltoarms%%" alt="Call to Arms animation"><div class="cap"><b>Call to Arms</b></div><div class="note">the war proclamation &middot; lands on frame 6</div></div>
    <div class="clip"><img src="%%rite%%" alt="Rite of Absolution animation"><div class="cap"><b>Rite of Absolution</b></div><div class="note">the absolving fanfare &middot; lands on frame 6</div></div>
    <div class="clip"><img src="%%death%%" alt="Death animation"><div class="cap"><b>Death</b></div><div class="note">freezes on the final pose</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Idle Fidget I</b></div><div class="note">plays every 8&#x2013;15s of idling</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Idle Fidget II</b></div><div class="note">plays every 8&#x2013;15s of idling</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Temporal Scroll &#x1f300;</div><div class="v">3&#x2605; band &middot; 85%</div></div>
    <div style="flex:1 1 300px"><div class="k">Where he comes from</div>
      <div style="font-size:13px;color:var(--muted)">Light and Dark heroes summon <em>only</em> from Temporal Scrolls
      &#x2014; 1% from any hunt or boss stage 15+, guaranteed every 50th tower floor,
      or 500 &#x1f48e; in the Shop.</div></div>
  </div>

  <div class="foot">Play him now at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a> &middot; fourth voice of the Reverence sect, beside Catherine, Toll and Javarious.</div>
</div>
'''

for k, v in IMG.items():
    html = html.replace(f'%%{k}%%', v)

# Emit pure ASCII. A published artifact is wrapped in a <head> this file
# does not control, so it cannot declare its own charset; escaping means
# the glyphs never depend on one being supplied.
html = ''.join(c if ord(c) < 128 else f'&#x{ord(c):x};' for c in html)

out = '/home/user/browsergacha/docs/leonardo-sheet.html'
with open(out, 'w') as f:
    f.write(html)
print(out, os.path.getsize(out) // 1024, 'KB')
