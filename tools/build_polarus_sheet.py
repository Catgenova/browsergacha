import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Polarus'
PANEL = (15, 20, 30, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

# (file, frames, fps, clip name) — mirrors sprite.strips in the hero def.
STRIPS = [
    ('polarusidle.png',    9,  5, 'idle'),
    ('polarusidle1.png',   9,  6, 'fidget1'),
    ('polarusidle2.png',   9,  6, 'fidget2'),
    ('polarusskill1.png',  9, 12, 'glacialbolt'),
    ('polarusskill2.png',  9, 10, 'mantle'),
    ('polarusskill3.png',  9, 10, 'shatterfall'),
    ('polarusdeath.png',  17,  7, 'death'),
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

html = r'''<title>Polarus, King of Cryst</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Forum&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: the frozen court. Glacial cyan on
     deep midwinter blue, the crown's gold kept as a supporting thread.
     Every ground and color is painted explicitly. */
  :root {
    --ground: #0a0e16;
    --panel: #0f141e;
    --panel-2: #151c2a;
    --line: #2b3d55;
    --ink: #eaf2f8;
    --muted: #8ba0b8;
    --ice: #7ad8e8;
    --rime: #c8f0ff;
    --ice-dim: #3d7a8a;
    --gold: #d8b060;
    --display: 'Forum', 'Georgia', serif;
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
  .eyebrow b { color: var(--ice); font-weight: 500; }

  /* ---- Hero header ---- */
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art {
    flex: 0 0 300px; position: relative;
    background:
      radial-gradient(ellipse 62% 46% at 50% 58%, rgba(122,216,232,.15), transparent 70%),
      var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    min-height: 320px;
  }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag {
    position: absolute; top: 10px; left: 12px;
    font-size: 11px; letter-spacing: 2px; color: var(--ice-dim);
    text-transform: uppercase;
  }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--rime); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 {
    font-family: var(--display); font-weight: 400; font-size: 80px;
    line-height: .95; color: var(--ink); text-wrap: balance; letter-spacing: 7px;
    text-shadow: 0 0 36px rgba(122,216,232,.45);
  }
  .title-line { font-size: 15px; color: var(--ice); letter-spacing: 4px;
    font-family: var(--display); text-transform: uppercase; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge {
    font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px;
  }
  .badge.water { border-color: var(--ice-dim); color: var(--ice); }
  .badge.sect { border-color: var(--gold); color: var(--gold); }
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
  .stat.atk .v { color: var(--ice); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  .stats-note { font-size: 12px; color: var(--muted); margin-top: 8px; }

  /* ---- Sections ---- */
  h2 {
    font-family: var(--display); font-weight: 400; font-size: 27px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 4px; text-transform: uppercase;
  }
  h2 .glyph { color: var(--ice); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }

  /* ---- The three doors into the ice ---- */
  .doors-box {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px 16px; overflow-x: auto;
  }
  .doors { display: grid; grid-template-columns: repeat(3, minmax(190px, 1fr)); gap: 14px; min-width: 620px; }
  .door {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 16px; text-align: center;
  }
  .door .who { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .door .num {
    font-family: var(--display); font-size: 44px; line-height: 1.1;
    color: var(--ice); font-variant-numeric: tabular-nums;
  }
  .door .what { font-size: 12px; color: var(--muted); }
  .door .what b { color: var(--ink); font-weight: 500; }
  .doors-cap { font-size: 12px; color: var(--muted); margin-top: 14px; }
  .doors-cap b { color: var(--ice); font-weight: 500; }

  /* ---- The throne loop ---- */
  .loop-box {
    margin-top: 22px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 22px 20px; display: flex; gap: 12px;
    flex-wrap: wrap; align-items: center; justify-content: center;
    font-size: 13px; color: var(--muted); text-align: center;
  }
  .loop-step {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink);
  }
  .loop-step b { color: var(--ice); font-weight: 500; }
  .loop-arrow { color: var(--ice-dim); font-size: 20px; }

  /* ---- Abilities ---- */
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px;
  }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--ice-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 400; font-size: 22px; letter-spacing: 2px; }
  .ability .ladder { margin-top: 10px; padding-top: 9px;
    border-top: 1px solid var(--line); font-family: var(--mono);
    font-size: 11px; line-height: 1.7; color: var(--muted); }
  .ability .ladder b { color: var(--ink); font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase; font-size: 10px; }
  .ability .ladder i { font-style: normal; color: var(--ink); }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--rime); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--ice); font-weight: 500; }
  .ability.passive-card { border-color: var(--ice-dim); }

  .dmg-table-box { margin-top: 22px; overflow-x: auto; background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; min-width: 620px; font-size: 13px; }
  th, td { padding: 9px 14px; text-align: right; font-variant-numeric: tabular-nums; }
  thead th { color: var(--muted); font-weight: 500; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid var(--line); }
  tbody th { text-align: left; font-weight: 500; color: var(--ink); white-space: nowrap; }
  tbody tr + tr td, tbody tr + tr th { border-top: 1px solid #1c2636; }
  td.max { color: var(--ice); font-weight: 600; }
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
  .acquire .v { font-family: var(--display); font-size: 22px; color: var(--rime); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--ice); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>5&#x2605; Water &middot; Cryst Sect &middot; No. 1</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Polarus idle animation, a white-bearded king in fur and teal robes" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 5</span></div>
      <h1>POLARUS</h1>
      <div class="title-line">King of Cryst</div>
      <div class="badges">
        <span class="badge water">&#x1f4a7; Water</span>
        <span class="badge">Center-tile DPS</span>
        <span class="badge">Freeze engine</span>
        <span class="badge sect">Cryst Sect &middot; No. 1 &middot; the King</span>
      </div>
      <p class="lede">The court that Aniani mirrors and Tide's blade was cut
      for has a throne, and this is who sits on it. Polarus rules from the
      <b>center hex</b> and turns the fight into his own winter: everything
      he does can leave an enemy <b>frozen where they stand</b>, and every
      freeze hands him his next cast sooner.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1170</div></div>
    <div class="stat atk"><div class="k">ATK</div><div class="v">166</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">88</div><div class="sub">the crystal answers for him</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">100</div></div>
    <div class="stat"><div class="k">Crit</div><div class="v">15%</div><div class="sub">&#xd7;1.5 damage</div></div>
  </div>
  <div class="stats-note">Base values at level 1 &#x2014; stats scale with level and &#x2605; ascension like every hero.</div>

  <h2><span class="glyph">&#x2746;</span> Three Doors Into the Ice</h2>
  <div class="section-sub">Freeze is a hard lockout &#x2014; a frozen unit <b
    style="color:var(--ink)">loses its turns for 2 turns</b> &#x2014; and his whole kit
    is ways of handing it out. Every freeze passes the usual accuracy-versus-resistance check.</div>
  <div class="doors-box">
    <div class="doors">
      <div class="door">
        <div class="who">Glacial Bolt &middot; on hit</div>
        <div class="num">30%</div>
        <div class="what">chance per cast &#x2014; <b>no cooldown</b>, so it rolls every turn</div>
      </div>
      <div class="door">
        <div class="who">Crystalline &middot; on being struck</div>
        <div class="num">30%</div>
        <div class="what">chance the <b>attacker</b> freezes on contact, for 2 turns of Mantle</div>
      </div>
      <div class="door">
        <div class="who">The King's Winter &middot; every hit</div>
        <div class="num">5%</div>
        <div class="what">chance on <b>any damage he deals</b> &#x2014; Shatterfall rolls it seven times</div>
      </div>
    </div>
    <div class="doors-cap">The ice is also ammunition: <b>Shatterfall pays 300% ATK to
      frozen enemies</b> (against 80% to everyone else), then melts every freeze it spent.</div>
  </div>

  <h2><span class="glyph">&#x265A;</span> The Frost Throne</h2>
  <div class="section-sub">His center-tile bonus closes the loop: every enemy frozen
    &#x2014; by the bolt, the crystal, or the winter &#x2014; refunds <b
    style="color:var(--ink)">1 turn of cooldown on every ability</b>. The freezes feed
    the casts, and the casts feed the freezes.</div>
  <div class="loop-box">
    <span class="loop-step">Freeze an enemy <b>&#x2746;</b></span>
    <span class="loop-arrow">&#x2192;</span>
    <span class="loop-step"><b>&#x2212;1 turn</b> on every cooldown</span>
    <span class="loop-arrow">&#x2192;</span>
    <span class="loop-step">Mantle and Shatterfall come back sooner</span>
    <span class="loop-arrow">&#x2192;</span>
    <span class="loop-step">more casts, <b>more freezes</b></span>
  </div>

  <h2><span class="glyph">&#x2726;</span> Kit</h2>
  <div class="section-sub">A freezing bolt, a mantle that punishes contact, and the
    shatter that cashes the whole winter in.</div>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; no cooldown</div>
      <h3>Glacial Bolt</h3>
      <div class="meta">Single target &middot; <b>125% ATK</b> &middot; 30% freeze, 2 turns</div>
      <p>A shard of court ice. The damage is steady; the <b>three-in-ten lockout</b> is the reason it goes out every
      turn &#x2014; and the reason it is the one hex the ladder never
      carries past <b>50%</b>.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% land chance &rsaquo; +10% land chance <i>&middot; max Lv 6</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; 4-turn cooldown &rarr; 2 fully levelled</div>
      <h3>Crystalline Mantle</h3>
      <div class="meta">Self &middot; 2 turns &middot; attackers: <b>30% freeze on contact</b></div>
      <p>Takes on <b>Crystalline form</b>: for two turns, anyone who lands a
      blow on him risks freezing solid mid-swing. A center-tile king who
      makes focusing him a mistake.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +1 turn &rsaquo; +1 turn &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 5</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; 6-turn cooldown &rarr; 4 fully levelled</div>
      <h3>Shatterfall</h3>
      <div class="meta">All enemies &middot; <b>80% ATK</b> &middot; <b>300%</b> to the frozen &middot; then thaws</div>
      <p>The whole court sweeps the enemy team. The unfrozen feel a chill;
      the frozen take <b>300% ATK</b> outright &#x2014; and then the ice
      shatters away, spent.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 8</i></div>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>The King's Winter</h3>
      <p>Every hit he lands carries the cold: <b>5% chance to freeze</b> the
      victim solid for 2 turns. Seven Shatterfall hits are seven rolls.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Position bonus &middot; center hex</div>
      <h3>Frost Throne</h3>
      <p>From the center tile: freezing an enemy &#x2014; by any means &#x2014;
      refunds <b>1 turn of cooldown on every ability</b>. The throne keeps
      the winter turning.</p>
    </div>
  </div>

  <div class="dmg-table-box">
    <table>
      <thead>
        <tr><th style="text-align:left">Skill power by skill level</th>
          <th>Lv 1</th><th>Lv 2</th><th>Lv 3</th><th>Lv 4</th><th>Lv 5</th></tr>
      </thead>
      <tbody>
        <tr><th>Glacial Bolt, % ATK</th><td>125</td><td>138</td><td>150</td><td>163</td><td class="max">175</td></tr>
        <tr><th>Shatterfall, % ATK each</th><td>80</td><td>88</td><td>96</td><td>104</td><td class="max">112</td></tr>
        <tr><th>&nbsp;&nbsp;&#x2026;against the frozen</th><td>300</td><td>330</td><td>360</td><td>390</td><td class="max">420</td></tr>
      </tbody>
    </table>
    <div class="table-cap">Skill levels follow each skill&#x27;s own ladder &#x2014; see the <b>Skill ups</b> line on each card, and the level cap that comes with it. Levels are raised in Improve by sacrificing another copy. The freeze odds, the Mantle counter and the throne's refund are fixed.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Animations</h2>
  <div class="section-sub">Hand-drawn 256px strips &#x2014; seven in all, from the regal
    sway to a seventeen-frame death.</div>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle animation"><div class="cap"><b>Idle</b></div><div class="note">the king holds court</div></div>
    <div class="clip"><img src="%%glacialbolt%%" alt="Glacial Bolt animation"><div class="cap"><b>Glacial Bolt</b></div><div class="note">the shard leaves his hand on frame 5</div></div>
    <div class="clip"><img src="%%mantle%%" alt="Crystalline Mantle animation"><div class="cap"><b>Crystalline Mantle</b></div><div class="note">the whiteout into crystal form</div></div>
    <div class="clip"><img src="%%shatterfall%%" alt="Shatterfall animation"><div class="cap"><b>Shatterfall</b></div><div class="note">the court-wide frost, crackling on frame 6</div></div>
    <div class="clip"><img src="%%death%%" alt="Death animation"><div class="cap"><b>Death</b></div><div class="note">seventeen frames; freezes on the final pose</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Idle Fidget I</b></div><div class="note">plays every 8&#x2013;15s of idling</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Idle Fidget II</b></div><div class="note">plays every 8&#x2013;15s of idling</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Rare Summon Scroll &#x1f4dc;</div><div class="v">5&#x2605; band &middot; 2%</div></div>
    <div style="flex:1 1 300px"><div class="k">Where he comes from</div>
      <div style="font-size:13px;color:var(--muted)">Water heroes summon from Common and Rare Scrolls
      &#x2014; the 5&#x2605; band lives on the Rare Scroll only. Pity guarantees a
      5&#x2605; by the 40th pull.</div></div>
  </div>

  <div class="foot">Play him now at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a> &middot; the King of Cryst, order No. 1 &#x2014; Aniani mirrors his court, and Tide carries his blade.</div>
</div>
'''

for k, v in IMG.items():
    html = html.replace(f'%%{k}%%', v)

# Emit pure ASCII. A published artifact is wrapped in a <head> this file
# does not control, so it cannot declare its own charset; escaping means
# the glyphs never depend on one being supplied.
html = ''.join(c if ord(c) < 128 else f'&#x{ord(c):x};' for c in html)

out = '/home/user/browsergacha/docs/polarus-sheet.html'
with open(out, 'w') as f:
    f.write(html)
print(out, os.path.getsize(out) // 1024, 'KB')
