import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Andrew'
PANEL = (22, 18, 16, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

# (file, frames, fps, clip name) — mirrors sprite.strips in the hero def
# (the skill 3 strip's capital A is an upstream quirk, kept as uploaded).
STRIPS = [
    ('andrewidle.png',    9,  5, 'idle'),
    ('andrewidle1.png',   9,  6, 'fidget1'),
    ('andrewidle2.png',   9,  6, 'fidget2'),
    ('andrewskill1.png',  9, 12, 'pickwork'),
    ('andrewskill2.png',  9, 10, 'shoreup'),
    ('Andrewskill3.png',  9, 11, 'crystalspoil'),
    ('andrewdeath.png',   9,  7, 'death'),
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

html = r'''<title>Andrew, Casualty of Cryst</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Staatliches&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: the mine under the frozen court.
     Lamplit leather-brown loam, the raw crystal teal he hauls as the
     accent — the working end of the palette Polarus wears as a crown.
     Every ground and color is painted explicitly. */
  :root {
    --ground: #12100d;
    --panel: #161210;
    --panel-2: #1e1915;
    --line: #4a3c2e;
    --ink: #f0ebe2;
    --muted: #a89882;
    --crystal: #6ad8d0;
    --gleam: #b0f0ea;
    --crystal-dim: #3d7a74;
    --lamplight: #d8a850;
    --loss: #d88a7a;
    --display: 'Staatliches', 'Arial Narrow', sans-serif;
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
  .eyebrow b { color: var(--crystal); font-weight: 500; }

  /* ---- Hero header ---- */
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art {
    flex: 0 0 300px; position: relative;
    background:
      radial-gradient(ellipse 62% 46% at 50% 58%, rgba(106,216,208,.13), transparent 70%),
      var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    min-height: 320px;
  }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag {
    position: absolute; top: 10px; left: 12px;
    font-size: 11px; letter-spacing: 2px; color: var(--crystal-dim);
    text-transform: uppercase;
  }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--gleam); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 {
    font-family: var(--display); font-weight: 400; font-size: 84px;
    line-height: .95; color: var(--ink); text-wrap: balance; letter-spacing: 5px;
    text-shadow: 0 0 32px rgba(106,216,208,.35);
  }
  .title-line { font-size: 16px; color: var(--crystal); letter-spacing: 4px;
    font-family: var(--display); text-transform: uppercase; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge {
    font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px;
  }
  .badge.water { border-color: var(--crystal-dim); color: var(--crystal); }
  .badge.sect { border-color: var(--lamplight); color: var(--lamplight); }
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
  .stat.atk .v { color: var(--crystal); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  .stats-note { font-size: 12px; color: var(--muted); margin-top: 8px; }

  /* ---- Sections ---- */
  h2 {
    font-family: var(--display); font-weight: 400; font-size: 30px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 3px; text-transform: uppercase;
  }
  h2 .glyph { color: var(--crystal); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }

  /* ---- The two masters ledger ---- */
  .masters-box {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px 16px; overflow-x: auto;
  }
  .masters { display: grid; grid-template-columns: repeat(2, minmax(230px, 1fr)); gap: 14px; min-width: 500px; }
  .master {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 16px; text-align: center;
  }
  .master.gives { border-color: var(--crystal-dim); }
  .master .who { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .master .num {
    font-family: var(--display); font-size: 48px; line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }
  .master.gives .num { color: var(--crystal); }
  .master.takes .num { color: var(--loss); }
  .master .what { font-size: 12px; color: var(--muted); }
  .master .what b { color: var(--ink); font-weight: 500; }
  .masters-cap { font-size: 12px; color: var(--muted); margin-top: 14px; }
  .masters-cap b { color: var(--crystal); font-weight: 500; }

  /* ---- Undermine ---- */
  .under-box {
    margin-top: 22px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 22px 24px; display: flex; gap: 24px;
    flex-wrap: wrap; align-items: center;
  }
  .under-box .num {
    font-family: var(--display); font-size: 56px; color: var(--loss);
    line-height: 1; font-variant-numeric: tabular-nums;
  }
  .under-box .what { flex: 1 1 300px; font-size: 13px; color: var(--muted); }
  .under-box .what b { color: var(--ink); font-weight: 500; }

  /* ---- Abilities ---- */
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px;
  }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--crystal-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 400; font-size: 24px; letter-spacing: 2px; }
  .ability .ladder { margin-top: 10px; padding-top: 9px;
    border-top: 1px solid var(--line); font-family: var(--mono);
    font-size: 11px; line-height: 1.7; color: var(--muted); }
  .ability .ladder b { color: var(--ink); font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase; font-size: 10px; }
  .ability .ladder i { font-style: normal; color: var(--ink); }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--gleam); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--crystal); font-weight: 500; }
  .ability.passive-card { border-color: var(--crystal-dim); }

  .dmg-table-box { margin-top: 22px; overflow-x: auto; background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; min-width: 620px; font-size: 13px; }
  th, td { padding: 9px 14px; text-align: right; font-variant-numeric: tabular-nums; }
  thead th { color: var(--muted); font-weight: 500; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid var(--line); }
  tbody th { text-align: left; font-weight: 500; color: var(--ink); white-space: nowrap; }
  tbody tr + tr td, tbody tr + tr th { border-top: 1px solid #2c2419; }
  td.max { color: var(--crystal); font-weight: 600; }
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
  .acquire .v { font-family: var(--display); font-size: 24px; color: var(--gleam); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--crystal); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>3&#x2605; Water &middot; Cryst Sect &middot; No. 1</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Andrew idle animation, a weary miner with a pick on his shoulder and raw crystals on his back" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 3</span></div>
      <h1>ANDREW</h1>
      <div class="title-line">Casualty of Cryst</div>
      <div class="badges">
        <span class="badge water">&#x1f4a7; Water</span>
        <span class="badge">Center support</span>
        <span class="badge">Meter control</span>
        <span class="badge sect">Cryst Sect &middot; the workhand</span>
      </div>
      <p class="lede">Somebody has to dig the crystal the court is named for.
      Andrew hauls a pick, a basket of raw Cryst, and the whole arrangement's
      fine print: <b>Aniani's company lifts him</b>, <b>the King's eye grinds
      him down</b>, and either way the tunnel gets shored and the enemy's
      footing gets dug out from underneath.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1100</div></div>
    <div class="stat atk"><div class="k">ATK</div><div class="v">176</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">106</div><div class="sub">Shore Up counts him too</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">98</div></div>
    <div class="stat"><div class="k">Crit</div><div class="v">15%</div><div class="sub">&#xd7;1.5 damage</div></div>
  </div>
  <div class="stats-note">Base values at level 1 &#x2014; stats scale with level and &#x2605; ascension like every hero.</div>

  <h2><span class="glyph">&#x2692;</span> Two Masters</h2>
  <div class="section-sub">His passive reads like his contract: who he shares the
    field with decides what shape he's in. Both clauses hold as long as the
    teammate stands &#x2014; permanent for the fight, no dispelling it away.</div>
  <div class="masters-box">
    <div class="masters">
      <div class="master gives">
        <div class="who">Beside Aniani &middot; the mirror keeps him whole</div>
        <div class="num">+30% ATK</div>
        <div class="what">the one member of the court who <b>treats him like a person</b></div>
      </div>
      <div class="master takes">
        <div class="who">Under Polarus &middot; the King's quota</div>
        <div class="num">&#x2212;30% DEF</div>
        <div class="what">royalty watching makes a man <b>work past what's safe</b></div>
      </div>
    </div>
    <div class="masters-cap">Both can hold at once &#x2014; field all three of Cryst and
      Andrew swings harder <b>and</b> bruises easier. Choose his company like it matters,
      because it does.</div>
  </div>

  <h2><span class="glyph">&#x26CF;</span> Undermine</h2>
  <div class="section-sub">His center-tile bonus is the job itself: at the start of
    every one of his turns, he digs the ground out from under someone.</div>
  <div class="under-box">
    <div class="num">&#x2212;30%</div>
    <div class="what"><b>DEF, on a random enemy, for 2 turns — every turn, free.</b>
      It costs no cast and stacks with everything: a standing supply of broken
      footing for the whole team to swing into.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Kit</h2>
  <div class="section-sub">A working swing, a braced tunnel, and a basket of sharp
    spoil for the back line.</div>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; no cooldown</div>
      <h3>Pickwork</h3>
      <div class="meta">Single target &middot; <b>110% ATK</b> &middot; &#x2212;15 action points</div>
      <p>An honest swing with a <b>50% chance</b> to knock <b>15 AP</b>
      off the target's bar
      &#x2014; the mine teaches you where to hit so things stop moving.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +10% power &rsaquo; +20% land chance &rsaquo; +20% land chance &rsaquo; +10% land chance <i>&middot; max Lv 6</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; 4-turn cooldown &rarr; 2 fully levelled</div>
      <h3>Shore Up</h3>
      <div class="meta">All allies &middot; <b>+30% DEF</b> &middot; 2 turns</div>
      <p>Brace the whole team the way you brace a tunnel: properly, and
      before the roof asks. The classic center-support beat.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +5% boon &rsaquo; +5% boon &rsaquo; +5% boon &rsaquo; +1 turn &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 7</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; 5-turn cooldown &rarr; 3 fully levelled</div>
      <h3>Crystal Spoil</h3>
      <div class="meta">Enemy back row &middot; <b>90% ATK each</b></div>
      <p>A basketful of sharp off-cuts hurled across the enemy <b>back
      line</b> &#x2014; the healers and snipers all catch a share.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 8</i></div>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Two Masters</h3>
      <p>Beside <b>Aniani</b>: +30% ATK, permanent. Under <b>Polarus</b>:
      &#x2212;30% DEF, also permanent. The court gives and the court takes.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Position bonus &middot; center hex</div>
      <h3>Undermine</h3>
      <p>At the start of every turn, a random enemy loses <b>30% DEF for
      2 turns</b>. He digs; the team profits.</p>
    </div>
  </div>

  <div class="dmg-table-box">
    <table>
      <thead>
        <tr><th style="text-align:left">Skill power by skill level</th>
          <th>Lv 1</th><th>Lv 2</th><th>Lv 3</th><th>Lv 4</th><th>Lv 5</th></tr>
      </thead>
      <tbody>
        <tr><th>Pickwork, % ATK</th><td>110</td><td>121</td><td>132</td><td>143</td><td class="max">154</td></tr>
        <tr><th>Crystal Spoil, % ATK each</th><td>90</td><td>99</td><td>108</td><td>117</td><td class="max">126</td></tr>
      </tbody>
    </table>
    <div class="table-cap">Skill levels follow each skill&#x27;s own ladder &#x2014; see the <b>Skill ups</b> line on each card, and the level cap that comes with it. Levels are raised in Improve by sacrificing another copy. The AP cut, the brace and both masters' clauses are fixed.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Animations</h2>
  <div class="section-sub">Hand-drawn 256px strips &#x2014; seven in all, nine frames each.</div>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle animation"><div class="cap"><b>Idle</b></div><div class="note">the pick rests on his shoulder</div></div>
    <div class="clip"><img src="%%pickwork%%" alt="Pickwork animation"><div class="cap"><b>Pickwork</b></div><div class="note">the swing lands on frame 6</div></div>
    <div class="clip"><img src="%%shoreup%%" alt="Shore Up animation"><div class="cap"><b>Shore Up</b></div><div class="note">the crystals on his back take the light</div></div>
    <div class="clip"><img src="%%crystalspoil%%" alt="Crystal Spoil animation"><div class="cap"><b>Crystal Spoil</b></div><div class="note">the spoil bursts on frame 7</div></div>
    <div class="clip"><img src="%%death%%" alt="Death animation"><div class="cap"><b>Death</b></div><div class="note">freezes on the final pose</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Idle Fidget I</b></div><div class="note">plays every 8&#x2013;15s of idling</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Idle Fidget II</b></div><div class="note">plays every 8&#x2013;15s of idling</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Common Scroll &#x1f4dc;</div><div class="v">3&#x2605; band &middot; 10%</div></div>
    <div><div class="k">Rare Scroll &#x1f4dc;</div><div class="v">3&#x2605; band &middot; 80%</div></div>
    <div style="flex:1 1 260px"><div class="k">Where he comes from</div>
      <div style="font-size:13px;color:var(--muted)">Water heroes summon from Common and Rare
      Scrolls alike &#x2014; a 3&#x2605; is the Rare Scroll's bread and butter.</div></div>
  </div>

  <div class="foot">Play him now at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a> &middot; fourth of the Cryst sect &#x2014; below Polarus, beside Aniani and Tide, and carrying the whole court on his back.</div>
</div>
'''

for k, v in IMG.items():
    html = html.replace(f'%%{k}%%', v)

# Emit pure ASCII. A published artifact is wrapped in a <head> this file
# does not control, so it cannot declare its own charset; escaping means
# the glyphs never depend on one being supplied.
html = ''.join(c if ord(c) < 128 else f'&#x{ord(c):x};' for c in html)

out = '/home/user/browsergacha/docs/andrew-sheet.html'
with open(out, 'w') as f:
    f.write(html)
print(out, os.path.getsize(out) // 1024, 'KB')
