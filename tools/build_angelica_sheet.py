import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Angelica'
PANEL = (16, 20, 26, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

# (file, frames, fps, clip name) — mirrors sprite.strips in the hero def.
STRIPS = [
    ('angelicaidle.png',    9,  5, 'idle'),
    ('angelicaidle1.png',   9,  6, 'fidget1'),
    ('angelicaidle2.png',   9,  6, 'fidget2'),
    ('angelicaskill1.png',  9, 12, 'shardcast'),
    ('angelicaskill2.png',  9, 11, 'rimeorb'),
    ('angelicaskill3.png',  9, 10, 'crystlance'),
    ('angelicadeath.png',  17,  7, 'death'),
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

html = r'''<title>Angelica, Crystcaster</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Philosopher:wght@400;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: frost twilight. Pale robe-white and
     staff-crystal teal on a cold slate ground — quieter than the King's
     midnight court, all measured accumulation. Every ground and color
     is painted explicitly. */
  :root {
    --ground: #0e1218;
    --panel: #101a1a;
    --panel-2: #162224;
    --line: #2e4a4e;
    --ink: #edf4f2;
    --muted: #8fa8a8;
    --teal: #7ae0e8;
    --gleam: #c8f4f8;
    --teal-dim: #3d7a80;
    --robe: #e0dcc8;
    --display: 'Philosopher', 'Georgia', sans-serif;
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
  .eyebrow b { color: var(--teal); font-weight: 500; }

  /* ---- Hero header ---- */
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art {
    flex: 0 0 300px; position: relative;
    background:
      radial-gradient(ellipse 62% 46% at 50% 58%, rgba(122,224,232,.14), transparent 70%),
      var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    min-height: 320px;
  }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag {
    position: absolute; top: 10px; left: 12px;
    font-size: 11px; letter-spacing: 2px; color: var(--teal-dim);
    text-transform: uppercase;
  }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--gleam); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 {
    font-family: var(--display); font-weight: 700; font-size: 74px;
    line-height: .95; color: var(--ink); text-wrap: balance; letter-spacing: 4px;
    text-shadow: 0 0 32px rgba(122,224,232,.4);
  }
  .title-line { font-size: 16px; color: var(--teal); letter-spacing: 5px;
    font-family: var(--display); text-transform: uppercase; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge {
    font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px;
  }
  .badge.water { border-color: var(--teal-dim); color: var(--teal); }
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
  .stat.atk .v { color: var(--teal); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  .stats-note { font-size: 12px; color: var(--muted); margin-top: 8px; }

  /* ---- Sections ---- */
  h2 {
    font-family: var(--display); font-weight: 700; font-size: 27px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 3px; text-transform: uppercase;
  }
  h2 .glyph { color: var(--teal); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }

  /* ---- The odds ladder ---- */
  .odds-box {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px 16px; overflow-x: auto;
  }
  .odds { display: grid; grid-template-columns: repeat(3, minmax(180px, 1fr)); gap: 14px; min-width: 600px; }
  .odd {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 16px; text-align: center;
  }
  .odd .who { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .odd .num {
    font-family: var(--display); font-size: 46px; line-height: 1.1;
    color: var(--teal); font-variant-numeric: tabular-nums;
  }
  .odd .what { font-size: 12px; color: var(--muted); }
  .odd .what b { color: var(--ink); font-weight: 500; }
  .odds-cap { font-size: 12px; color: var(--muted); margin-top: 14px; }
  .odds-cap b { color: var(--teal); font-weight: 500; }

  /* ---- The tally ---- */
  .tally-box {
    margin-top: 22px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 22px 24px; display: flex; gap: 10px;
    flex-wrap: wrap; align-items: center;
  }
  .tally-chip {
    background: var(--panel); border: 2px solid var(--teal-dim); border-radius: 999px;
    padding: 6px 16px; font-family: var(--display); font-size: 18px;
    color: var(--teal); font-variant-numeric: tabular-nums;
  }
  .tally-chip.faded { border-color: var(--line); color: var(--muted); }
  .tally-note { flex: 1 1 260px; font-size: 13px; color: var(--muted); }
  .tally-note b { color: var(--ink); font-weight: 500; }

  /* ---- Abilities ---- */
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px;
  }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--teal-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 700; font-size: 22px; letter-spacing: 1px; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--gleam); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--teal); font-weight: 500; }
  .ability.passive-card { border-color: var(--teal-dim); }

  .dmg-table-box { margin-top: 22px; overflow-x: auto; background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; min-width: 620px; font-size: 13px; }
  th, td { padding: 9px 14px; text-align: right; font-variant-numeric: tabular-nums; }
  thead th { color: var(--muted); font-weight: 500; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid var(--line); }
  tbody th { text-align: left; font-weight: 500; color: var(--ink); white-space: nowrap; }
  tbody tr + tr td, tbody tr + tr th { border-top: 1px solid #1d2c30; }
  td.max { color: var(--teal); font-weight: 600; }
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
  .acquire .v { font-family: var(--display); font-size: 22px; color: var(--gleam); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--teal); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>3&#x2605; Water &middot; Back-line DPS</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Angelica idle animation, a hooded caster in white and teal with a crystal-tipped staff" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 3</span></div>
      <h1>ANGELICA</h1>
      <div class="title-line">Crystcaster</div>
      <div class="badges">
        <span class="badge water">&#x1f4a7; Water</span>
        <span class="badge">Back-line DPS</span>
        <span class="badge">Freeze scaler</span>
      </div>
      <p class="lede">Three casts, three freeze chances, and a ledger that never
      forgets: <b>every enemy frozen in the fight</b> &#x2014; by her staff or
      anyone else's winter &#x2014; adds another tenth to her ATK, <b>for the
      rest of the fight</b>. She starts as the quietest thing on the field and
      ends it as the arithmetic says she must.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1100</div></div>
    <div class="stat atk"><div class="k">ATK</div><div class="v">235</div><div class="sub">before the tally starts</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">90</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">102</div></div>
    <div class="stat"><div class="k">Crit</div><div class="v">15%</div><div class="sub">&#xd7;1.5 damage</div></div>
  </div>
  <div class="stats-note">Base values at level 1 &#x2014; stats scale with level and &#x2605; ascension like every hero.</div>

  <h2><span class="glyph">&#x2746;</span> The Odds Ladder</h2>
  <div class="section-sub">Every cast in her kit is single-target damage with a freeze
    rider, and the odds climb with the cooldown. Freeze is the hard lockout &#x2014;
    a frozen unit loses its turns for 2 turns &#x2014; and every attempt passes the
    usual accuracy-versus-resistance check.</div>
  <div class="odds-box">
    <div class="odds">
      <div class="odd">
        <div class="who">Shardcast &middot; every turn</div>
        <div class="num">30%</div>
        <div class="what">90% ATK &middot; <b>no cooldown</b> &#x2014; the steady drumbeat</div>
      </div>
      <div class="odd">
        <div class="who">Rimeorb &middot; 3-turn cooldown</div>
        <div class="num">40%</div>
        <div class="what">125% ATK &#x2014; the packed sphere hits harder and sticks oftener</div>
      </div>
      <div class="odd">
        <div class="who">Cryst Lance &middot; 5-turn cooldown</div>
        <div class="num">50%</div>
        <div class="what">150% ATK &#x2014; <b>a coin flip</b> on a full lockout</div>
      </div>
    </div>
    <div class="odds-cap">Beside <b>Polarus</b> the ice comes from everywhere at once &#x2014;
      and her passive doesn't care whose ice it is.</div>
  </div>

  <h2><span class="glyph">&#x2211;</span> Cold Arithmetic</h2>
  <div class="section-sub">Her passive is a running total: <b style="color:var(--ink)">+10%
    ATK, permanent for the fight, for every enemy frozen by anyone</b>. It never expires,
    never resets, and stacks without a cap.</div>
  <div class="tally-box">
    <span class="tally-chip">+10%</span>
    <span class="tally-chip">+20%</span>
    <span class="tally-chip">+30%</span>
    <span class="tally-chip">+40%</span>
    <span class="tally-chip faded">+&#x2026;</span>
    <div class="tally-note">Four freezes into the fight she swings <b>1.4&#xd7;
      her base ATK</b> &#x2014; onto casts that themselves roll more freezes.
      The winter compounds.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Kit</h2>
  <div class="section-sub">Three shots up the same ladder, the ledger that makes them
    grow, and a forge that likes her standing well back.</div>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; no cooldown</div>
      <h3>Shardcast</h3>
      <div class="meta">Single target &middot; <b>90% ATK</b> &middot; 30% freeze, 2 turns</div>
      <p>A shard off the staff crystal. Modest on its own &#x2014; but it rolls
      the freeze die <b>every single turn</b>.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; 3-turn cooldown</div>
      <h3>Rimeorb</h3>
      <div class="meta">Single target &middot; <b>125% ATK</b> &middot; 40% freeze, 2 turns</div>
      <p>A sphere of packed rime, conjured and hurled. The middle rung of
      the ladder: better damage, better odds.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; 5-turn cooldown</div>
      <h3>Cryst Lance</h3>
      <div class="meta">Single target &middot; <b>150% ATK</b> &middot; 50% freeze, 2 turns</div>
      <p>The staff driven home. Half the time the target simply
      <b>stops</b> &#x2014; and her tally ticks up either way if it lands.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Cold Arithmetic</h3>
      <p><b>+10% ATK for the rest of the fight</b> every time an enemy is
      frozen &#x2014; hers, the King's, anyone's. The ledger only ever goes up.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Position bonus &middot; back hex</div>
      <h3>Cold Forge</h3>
      <p>From a back hex: <b>+15% ATK and +10% DEF</b>. The craft is better
      done unhurried.</p>
    </div>
  </div>

  <div class="dmg-table-box">
    <table>
      <thead>
        <tr><th style="text-align:left">Skill power by skill level</th>
          <th>Lv 1</th><th>Lv 2</th><th>Lv 3</th><th>Lv 4</th><th>Lv 5</th></tr>
      </thead>
      <tbody>
        <tr><th>Shardcast, % ATK</th><td>90</td><td>99</td><td>108</td><td>117</td><td class="max">126</td></tr>
        <tr><th>Rimeorb, % ATK</th><td>125</td><td>138</td><td>150</td><td>163</td><td class="max">175</td></tr>
        <tr><th>Cryst Lance, % ATK</th><td>150</td><td>165</td><td>180</td><td>195</td><td class="max">210</td></tr>
      </tbody>
    </table>
    <div class="table-cap">Skill levels add +10% power per level (max Lv 5) &#x2014; raised in Improve
      by sacrificing another Angelica. The freeze odds and the tally's tenth are fixed.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Animations</h2>
  <div class="section-sub">Hand-drawn 256px strips &#x2014; seven in all, from the hooded
    sway to a seventeen-frame death.</div>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle animation"><div class="cap"><b>Idle</b></div><div class="note">the staff crystal breathes</div></div>
    <div class="clip"><img src="%%shardcast%%" alt="Shardcast animation"><div class="cap"><b>Shardcast</b></div><div class="note">the crystal flares on frame 7</div></div>
    <div class="clip"><img src="%%rimeorb%%" alt="Rimeorb animation"><div class="cap"><b>Rimeorb</b></div><div class="note">the orb leaves her hand on frame 7</div></div>
    <div class="clip"><img src="%%crystlance%%" alt="Cryst Lance animation"><div class="cap"><b>Cryst Lance</b></div><div class="note">the burst crackles out on frame 7</div></div>
    <div class="clip"><img src="%%death%%" alt="Death animation"><div class="cap"><b>Death</b></div><div class="note">seventeen frames; freezes on the final pose</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Idle Fidget I</b></div><div class="note">plays every 8&#x2013;15s of idling</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Idle Fidget II</b></div><div class="note">plays every 8&#x2013;15s of idling</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Common Scroll &#x1f4dc;</div><div class="v">3&#x2605; band &middot; 10%</div></div>
    <div><div class="k">Rare Scroll &#x1f4dc;</div><div class="v">3&#x2605; band &middot; 80%</div></div>
    <div style="flex:1 1 260px"><div class="k">Where she comes from</div>
      <div style="font-size:13px;color:var(--muted)">Water heroes summon from Common and Rare
      Scrolls alike &#x2014; a 3&#x2605; is the Rare Scroll's bread and butter.</div></div>
  </div>

  <div class="foot">Play her now at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a> &middot; a caster of the Cryst crystal &#x2014; no sect pin yet, but the King's winter already pays her wages.</div>
</div>
'''

for k, v in IMG.items():
    html = html.replace(f'%%{k}%%', v)

# Emit pure ASCII. A published artifact is wrapped in a <head> this file
# does not control, so it cannot declare its own charset; escaping means
# the glyphs never depend on one being supplied.
html = ''.join(c if ord(c) < 128 else f'&#x{ord(c):x};' for c in html)

out = '/home/user/browsergacha/docs/angelica-sheet.html'
with open(out, 'w') as f:
    f.write(html)
print(out, os.path.getsize(out) // 1024, 'KB')
