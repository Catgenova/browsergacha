import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Eli'
PANEL = (20, 18, 30, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

# (file, frames, fps, clip name) — mirrors sprite.strips in the hero def
# (the capital-E idle and transposed 'ile' fidget are upstream quirks,
# referenced exactly as uploaded).
STRIPS = [
    ('Eliidle.png',    9,  5, 'idle'),
    ('ileidle1.png',   9,  6, 'fidget1'),
    ('eliidle2.png',   9,  6, 'fidget2'),
    ('eliskill1.png',  9, 12, 'sigilbolt'),
    ('eliskill2.png',  9, 12, 'sealingglyph'),
    ('eliskill3.png',  9, 10, 'quickening'),
    ('elideath.png',   9,  7, 'death'),
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

html = r'''<title>Eli, Sigil of Reverence</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Julius+Sans+One&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: a living glyph inscribed in gold on
     deep indigo vellum. Every ground and color is painted explicitly. */
  :root {
    --ground: #12101c;
    --panel: #14121e;
    --panel-2: #1c1930;
    --line: #3a3458;
    --ink: #ece9f2;
    --muted: #9a92b4;
    --gold: #f0c860;
    --glow: #ffe9a8;
    --gold-dim: #85713a;
    --drain: #9a8ae0;
    --display: 'Julius Sans One', 'Trebuchet MS', sans-serif;
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
  .eyebrow b { color: var(--gold); font-weight: 500; }

  /* ---- Hero header ---- */
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art {
    flex: 0 0 300px; position: relative;
    background:
      radial-gradient(ellipse 62% 46% at 50% 58%, rgba(240,200,96,.16), transparent 70%),
      var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    min-height: 320px;
  }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag {
    position: absolute; top: 10px; left: 12px;
    font-size: 11px; letter-spacing: 2px; color: var(--gold-dim);
    text-transform: uppercase;
  }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--glow); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 {
    font-family: var(--display); font-weight: 400; font-size: 78px;
    line-height: .95; color: var(--ink); text-wrap: balance; letter-spacing: 10px;
    text-shadow: 0 0 34px rgba(240,200,96,.4);
  }
  .title-line { font-size: 15px; color: var(--gold); letter-spacing: 4px;
    font-family: var(--display); text-transform: uppercase; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge {
    font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px;
  }
  .badge.light { border-color: var(--gold-dim); color: var(--gold); }
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
    font-family: var(--display); font-size: 30px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.15;
  }
  .stat.atk .v { color: var(--gold); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  .stats-note { font-size: 12px; color: var(--muted); margin-top: 8px; }

  /* ---- Sections ---- */
  h2 {
    font-family: var(--display); font-weight: 400; font-size: 27px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 4px; text-transform: uppercase;
  }
  h2 .glyph { color: var(--gold); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }

  /* ---- The tempo ledger ---- */
  .ledger-box {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px 16px; overflow-x: auto;
  }
  .ledger { display: grid; grid-template-columns: repeat(3, minmax(180px, 1fr)); gap: 14px; min-width: 600px; }
  .entry {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 16px; text-align: center;
  }
  .entry.gain { border-color: var(--gold-dim); }
  .entry .who { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .entry .num {
    font-family: var(--display); font-size: 44px; line-height: 1.1;
    color: var(--drain); font-variant-numeric: tabular-nums;
  }
  .entry.gain .num { color: var(--gold); }
  .entry .what { font-size: 12px; color: var(--muted); }
  .entry .what b { color: var(--ink); font-weight: 500; }
  .ledger-cap { font-size: 12px; color: var(--muted); margin-top: 14px; }
  .ledger-cap b { color: var(--gold); font-weight: 500; }

  /* ---- Abilities ---- */
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px;
  }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--gold-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 400; font-size: 22px; letter-spacing: 2px; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--glow); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--gold); font-weight: 500; }
  .ability.passive-card { border-color: var(--gold-dim); }

  .dmg-table-box { margin-top: 22px; overflow-x: auto; background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; min-width: 620px; font-size: 13px; }
  th, td { padding: 9px 14px; text-align: right; font-variant-numeric: tabular-nums; }
  thead th { color: var(--muted); font-weight: 500; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid var(--line); }
  tbody th { text-align: left; font-weight: 500; color: var(--ink); white-space: nowrap; }
  tbody tr + tr td, tbody tr + tr th { border-top: 1px solid #262138; }
  td.max { color: var(--gold); font-weight: 600; }
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
  .acquire .v { font-family: var(--display); font-size: 22px; color: var(--glow); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--gold); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>3&#x2605; Light &middot; Reverence Sect</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Eli idle animation, a living sigil turning in the air" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 3</span></div>
      <h1>ELI</h1>
      <div class="title-line">Sigil of Reverence</div>
      <div class="badges">
        <span class="badge light">&#x2600;&#xfe0f; Light</span>
        <span class="badge">Back-row DPS</span>
        <span class="badge">Tempo control</span>
        <span class="badge">Reverence Sect</span>
      </div>
      <p class="lede">Not a person carrying a sigil &#x2014; <b>the sigil itself</b>,
      a wheel of living scripture the sect keeps at the back of the line. Eli
      plays the turn order like an instrument: every brand he lands sets an
      enemy's next turn further away, and when the moment is right he
      inscribes himself and <b>simply takes another one</b>.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">915</div></div>
    <div class="stat atk"><div class="k">ATK</div><div class="v">195</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">76</div><div class="sub">keep him inscribed, not hit</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">106</div></div>
    <div class="stat"><div class="k">Crit</div><div class="v">15%</div><div class="sub">&#xd7;1.5 damage</div></div>
  </div>
  <div class="stats-note">Base values at level 1 &#x2014; stats scale with level and &#x2605; ascension like every hero.</div>

  <h2><span class="glyph">&#x29BF;</span> The Tempo Ledger</h2>
  <div class="section-sub">Every entry in his kit is a transaction against the turn
    order &#x2014; the enemy's meter drained away, or a whole turn minted for himself.</div>
  <div class="ledger-box">
    <div class="ledger">
      <div class="entry">
        <div class="who">Sigil Bolt &middot; one enemy</div>
        <div class="num">&#x2212;20%</div>
        <div class="what">turn meter, every single cast &#x2014; <b>no cooldown</b></div>
      </div>
      <div class="entry">
        <div class="who">Sealing Glyph &middot; enemy back row</div>
        <div class="num">&#x2212;15%</div>
        <div class="what">turn meter from <b>each</b> of their casters and archers</div>
      </div>
      <div class="entry gain">
        <div class="who">Quickening Sigil &middot; himself</div>
        <div class="num">+1</div>
        <div class="what"><b>whole extra turn</b>, taken immediately &#x2014; guaranteed, not rolled</div>
      </div>
    </div>
    <div class="ledger-cap">The arithmetic compounds: a drained enemy falls below half
      meter, and his passive punishes exactly that &#x2014; <b>+25% damage to enemies
      below half turn meter</b>. Slow them, then hit them for slowing down.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Kit</h2>
  <div class="section-sub">Two draining brands, one self-inscription &#x2014; and the
    judgment that makes the draining pay twice.</div>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; no cooldown</div>
      <h3>Sigil Bolt</h3>
      <div class="meta">Single target &middot; <b>100% ATK</b> &middot; &#x2212;20% meter</div>
      <p>Brand one enemy. The damage is honest; the <b>fifth of a turn they
      lose</b> is the real price.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; 3-turn cooldown</div>
      <h3>Sealing Glyph</h3>
      <div class="meta">Enemy back row &middot; <b>90% ATK each</b> &middot; &#x2212;15% meter each</div>
      <p>A glyph cast across the enemy <b>back line</b> &#x2014; the healers and
      snipers all pushed away from their next turn at once.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; 5-turn cooldown</div>
      <h3>Quickening Sigil</h3>
      <div class="meta">Self &middot; <b>+30% SPD, +25% Crit</b> for 3 turns &middot; then act again</div>
      <p>Inscribes himself and <b>immediately takes another turn</b> &#x2014;
      the buffs land, and the first empowered cast follows before anyone
      else moves.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Sigil's Judgment</h3>
      <p>Deals <b>+25% damage to enemies below half turn meter</b> &#x2014; the
      ones his own brands have already slowed. Drain, then judge.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Position bonus &middot; back hex</div>
      <h3>Windrunner</h3>
      <p>From a back hex: <b>+12% SPD and +8% dodge</b>. The sigil turns
      faster than anything trying to reach it.</p>
    </div>
  </div>

  <div class="dmg-table-box">
    <table>
      <thead>
        <tr><th style="text-align:left">Skill power by skill level</th>
          <th>Lv 1</th><th>Lv 2</th><th>Lv 3</th><th>Lv 4</th><th>Lv 5</th></tr>
      </thead>
      <tbody>
        <tr><th>Sigil Bolt, % ATK</th><td>100</td><td>110</td><td>120</td><td>130</td><td class="max">140</td></tr>
        <tr><th>Sealing Glyph, % ATK each</th><td>90</td><td>99</td><td>108</td><td>117</td><td class="max">126</td></tr>
      </tbody>
    </table>
    <div class="table-cap">Skill levels add +10% power per level (max Lv 5) &#x2014; raised in Improve
      by sacrificing another Eli. The meter drains and the extra turn are fixed: tempo is tempo.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Animations</h2>
  <div class="section-sub">Hand-drawn 256px strips &#x2014; seven in all, nine frames each,
    including two timed idle fidgets.</div>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle animation"><div class="cap"><b>Idle</b></div><div class="note">the sigil turns at rest</div></div>
    <div class="clip"><img src="%%sigilbolt%%" alt="Sigil Bolt animation"><div class="cap"><b>Sigil Bolt</b></div><div class="note">the brand lands on frame 6</div></div>
    <div class="clip"><img src="%%sealingglyph%%" alt="Sealing Glyph animation"><div class="cap"><b>Sealing Glyph</b></div><div class="note">the row-wide seal, cast on frame 6</div></div>
    <div class="clip"><img src="%%quickening%%" alt="Quickening Sigil animation"><div class="cap"><b>Quickening Sigil</b></div><div class="note">the self-inscription flares on frame 6</div></div>
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

  <div class="foot">Play him now at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a> &middot; seventh of the Reverence sect, beside Catherine, Toll, Javarious, Leonardo, Oak and Silas.</div>
</div>
'''

for k, v in IMG.items():
    html = html.replace(f'%%{k}%%', v)

# Emit pure ASCII. A published artifact is wrapped in a <head> this file
# does not control, so it cannot declare its own charset; escaping means
# the glyphs never depend on one being supplied.
html = ''.join(c if ord(c) < 128 else f'&#x{ord(c):x};' for c in html)

out = '/home/user/browsergacha/docs/eli-sheet.html'
with open(out, 'w') as f:
    f.write(html)
print(out, os.path.getsize(out) // 1024, 'KB')
