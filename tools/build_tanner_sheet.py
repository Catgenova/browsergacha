import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Tanner'
PANEL = (14, 17, 26, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

# (file, frames, fps, clip name) — mirrors sprite.strips in the hero def.
STRIPS = [
    ('tanneridle.png',   13,  6, 'idle'),
    ('tanneridle1.png',   9,  6, 'fidget1'),
    ('tanneridle2.png',   9,  6, 'fidget2'),
    ('tannerskill1.png',  9, 10, 'gesture'),
    ('tannerskill2.png',  9, 11, 'favor'),
    ('tannerskill3.png',  9, 10, 'bubblecourt'),
    ('tannerdeath.png',   9,  7, 'death'),
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

html = r'''<title>Tanner, Prince of Cryst</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Italiana&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: the court ball after dark. Navy
     velvet and powder blue, a thread of gilt braid — the prince's
     wardrobe, not the throne's ice. Every color painted explicitly. */
  :root {
    --ground: #0d101a;
    --panel: #0e1220;
    --panel-2: #151a2c;
    --line: #303e60;
    --ink: #eef1f8;
    --muted: #8f9ab8;
    --powder: #8ac4f0;
    --gleam: #cfe8ff;
    --powder-dim: #40638a;
    --gilt: #d0aa58;
    --display: 'Italiana', 'Georgia', serif;
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
  .eyebrow b { color: var(--powder); font-weight: 500; }

  /* ---- Hero header ---- */
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art {
    flex: 0 0 300px; position: relative;
    background:
      radial-gradient(ellipse 62% 46% at 50% 58%, rgba(138,196,240,.14), transparent 70%),
      var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    min-height: 320px;
  }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag {
    position: absolute; top: 10px; left: 12px;
    font-size: 11px; letter-spacing: 2px; color: var(--powder-dim);
    text-transform: uppercase;
  }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--gleam); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 {
    font-family: var(--display); font-weight: 400; font-size: 92px;
    line-height: .9; color: var(--ink); text-wrap: balance; letter-spacing: 8px;
    text-shadow: 0 0 34px rgba(138,196,240,.4);
  }
  .title-line { font-size: 17px; color: var(--powder); letter-spacing: 6px;
    font-family: var(--display); text-transform: uppercase; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge {
    font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px;
  }
  .badge.water { border-color: var(--powder-dim); color: var(--powder); }
  .badge.sect { border-color: var(--gilt); color: var(--gilt); }
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
  .stat.spd .v { color: var(--powder); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  .stats-note { font-size: 12px; color: var(--muted); margin-top: 8px; }

  /* ---- Sections ---- */
  h2 {
    font-family: var(--display); font-weight: 400; font-size: 30px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 4px; text-transform: uppercase;
  }
  h2 .glyph { color: var(--powder); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }

  /* ---- The bubble ---- */
  .bubble-box {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px;
    flex-wrap: wrap; align-items: center; justify-content: center;
    font-size: 13px; color: var(--muted); text-align: center;
  }
  .bubble-step {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink);
  }
  .bubble-step b { color: var(--powder); font-weight: 500; }
  .bubble-arrow { color: var(--powder-dim); font-size: 20px; }

  /* ---- The gifts ---- */
  .gifts-box {
    margin-top: 22px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 24px 20px 16px; overflow-x: auto;
  }
  .gifts { display: grid; grid-template-columns: repeat(3, minmax(190px, 1fr)); gap: 14px; min-width: 620px; }
  .gift {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 16px; text-align: center;
  }
  .gift .who { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .gift .num {
    font-family: var(--display); font-size: 44px; line-height: 1.1;
    color: var(--powder); font-variant-numeric: tabular-nums;
  }
  .gift .what { font-size: 12px; color: var(--muted); }
  .gift .what b { color: var(--ink); font-weight: 500; }
  .gifts-cap { font-size: 12px; color: var(--muted); margin-top: 14px; }
  .gifts-cap b { color: var(--powder); font-weight: 500; }

  /* ---- Abilities ---- */
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px;
  }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--powder-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 400; font-size: 25px; letter-spacing: 2px; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--gleam); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--powder); font-weight: 500; }
  .ability.passive-card { border-color: var(--powder-dim); }

  .dmg-table-box { margin-top: 22px; overflow-x: auto; background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; min-width: 620px; font-size: 13px; }
  th, td { padding: 9px 14px; text-align: right; font-variant-numeric: tabular-nums; }
  thead th { color: var(--muted); font-weight: 500; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid var(--line); }
  tbody th { text-align: left; font-weight: 500; color: var(--ink); white-space: nowrap; }
  tbody tr + tr td, tbody tr + tr th { border-top: 1px solid #1c2438; }
  td.max { color: var(--powder); font-weight: 600; }
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
  .foot a { color: var(--powder); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>4&#x2605; Water &middot; Cryst Sect &middot; No. 1</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Tanner idle animation, a plumed young prince swaying with his cane" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 4</span></div>
      <h1>TANNER</h1>
      <div class="title-line">Prince of Cryst</div>
      <div class="badges">
        <span class="badge water">&#x1f4a7; Water</span>
        <span class="badge">Back-row support</span>
        <span class="badge">Tempo &amp; bubbles</span>
        <span class="badge sect">Cryst Sect &middot; the prince</span>
      </div>
      <p class="lede">The heir does not fight; the heir <b>arranges</b>. Tanner
      spends his turns handing other people theirs &#x2014; favor here, a wave
      of the cane there &#x2014; and when things get serious, the whole court
      steps inside <b>soap-thin bubbles that swallow one entire hit each</b>.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1300</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">118</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">122</div></div>
    <div class="stat spd"><div class="k">SPD</div><div class="v">108</div><div class="sub">a prince is never late</div></div>
    <div class="stat"><div class="k">Crit</div><div class="v">15%</div><div class="sub">&#xd7;1.5 damage</div></div>
  </div>
  <div class="stats-note">Base values at level 1 &#x2014; stats scale with level and &#x2605; ascension like every hero.</div>

  <h2><span class="glyph">&#x25cb;</span> The Bubble Court</h2>
  <div class="section-sub">His signature is absolute, not proportional: a bubble does
    not reduce a hit &#x2014; it <b style="color:var(--ink)">voids one whole hit</b>,
    whatever its size, then pops. Blown over the entire team at once, for 2 turns.</div>
  <div class="bubble-box">
    <span class="bubble-step">Bubble Court: <b>every ally</b> wrapped in blue glass</span>
    <span class="bubble-arrow">&#x2192;</span>
    <span class="bubble-step">one incoming hit &#x2014; <b>any</b> hit &#x2014; is swallowed whole</span>
    <span class="bubble-arrow">&#x2192;</span>
    <span class="bubble-step"><b>&#x1fae7; pop</b> &#x2014; the bubble is spent; unburst ones fade after 2 turns</span>
  </div>

  <h2><span class="glyph">&#x2655;</span> Rank Has Its Duties</h2>
  <div class="section-sub">Everything else in the kit is patronage: attack for the
    favorite, turns for the laggard, and only a token splash of actual healing.</div>
  <div class="gifts-box">
    <div class="gifts">
      <div class="gift">
        <div class="who">Royal Favor &middot; one ally</div>
        <div class="num">+50 AP</div>
        <div class="what">on the spot, plus <b>+30% ATK for 2 turns</b> &#x2014; half a turn, handed over</div>
      </div>
      <div class="gift">
        <div class="who">Noblesse Oblige &middot; every turn</div>
        <div class="num">+10 AP</div>
        <div class="what">to the ally <b>furthest from acting</b>, free, at his turn start</div>
      </div>
      <div class="gift">
        <div class="who">Royal Gesture &middot; every turn</div>
        <div class="num">5%</div>
        <div class="what">of his max HP as a heal &#x2014; <b>a token of concern</b>, nothing more</div>
      </div>
    </div>
    <div class="gifts-cap">The meter he hands out is credited back: damage dealt on
      turns <b>he bought</b> books to the prince in the battle report.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Kit</h2>
  <div class="section-sub">A token, a favor, and the court's bubble &#x2014; with a
    second wind for a prince in genuine peril.</div>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; no cooldown</div>
      <h3>Royal Gesture</h3>
      <div class="meta">One ally &middot; <b>5% of his max HP</b> healed</div>
      <p>A conjured droplet, dispensed with princely economy. It is the
      thought that counts.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; 3-turn cooldown</div>
      <h3>Royal Favor</h3>
      <div class="meta">One ally &middot; <b>+30% ATK, 2 turns</b> &middot; <b>+50 turn meter</b></div>
      <p>The cane flourish that makes someone's whole day: hit harder,
      and <b>go now</b>. Point it at your carry.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; 5-turn cooldown</div>
      <h3>Bubble Court</h3>
      <div class="meta">All allies &middot; 2 turns &middot; each bubble voids <b>one whole hit</b></div>
      <p>The spin that blows the court inside its glass. Timed before a
      boss's big turn, it deletes the entire volley.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Noblesse Oblige</h3>
      <p>At the start of each of his turns, the ally with the <b>lowest
      turn meter</b> gains +10. Rank has its duties.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Position bonus &middot; back hex</div>
      <h3>Second Wind</h3>
      <p>Below half HP, each of his turns starts the next fill with
      <b>+20 turn meter</b>. A wounded prince is a busy one.</p>
    </div>
  </div>

  <div class="dmg-table-box">
    <table>
      <thead>
        <tr><th style="text-align:left">Skill power by skill level</th>
          <th>Lv 1</th><th>Lv 2</th><th>Lv 3</th><th>Lv 4</th><th>Lv 5</th></tr>
      </thead>
      <tbody>
        <tr><th>Royal Gesture, % of his max HP</th><td>5.0</td><td>5.5</td><td>6.0</td><td>6.5</td><td class="max">7.0</td></tr>
      </tbody>
    </table>
    <div class="table-cap">Skill levels add +10% power per level (max Lv 5) &#x2014; raised in Improve
      by sacrificing another Tanner. The favor, the meter gifts and the bubbles are fixed: patronage does not scale, it simply is.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Animations</h2>
  <div class="section-sub">Hand-drawn 256px strips &#x2014; seven in all, the idle
    alone running thirteen frames of princely sway.</div>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle animation"><div class="cap"><b>Idle</b></div><div class="note">thirteen frames on the cane</div></div>
    <div class="clip"><img src="%%gesture%%" alt="Royal Gesture animation"><div class="cap"><b>Royal Gesture</b></div><div class="note">the droplet, dispensed on frame 6</div></div>
    <div class="clip"><img src="%%favor%%" alt="Royal Favor animation"><div class="cap"><b>Royal Favor</b></div><div class="note">blue plumes scatter on frame 6</div></div>
    <div class="clip"><img src="%%bubblecourt%%" alt="Bubble Court animation"><div class="cap"><b>Bubble Court</b></div><div class="note">the spin that blows the glass</div></div>
    <div class="clip"><img src="%%death%%" alt="Death animation"><div class="cap"><b>Death</b></div><div class="note">freezes on the final pose</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Idle Fidget I</b></div><div class="note">plays every 8&#x2013;15s of idling</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Idle Fidget II</b></div><div class="note">plays every 8&#x2013;15s of idling</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Rare Summon Scroll &#x1f4dc;</div><div class="v">4&#x2605; band &middot; 18%</div></div>
    <div style="flex:1 1 300px"><div class="k">Where he comes from</div>
      <div style="font-size:13px;color:var(--muted)">Water heroes summon from Common and Rare Scrolls
      &#x2014; the 4&#x2605; band lives on the Rare Scroll only.</div></div>
  </div>

  <div class="foot">Play him now at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a> &middot; eighth of the Cryst sect &#x2014; the King rules, the engine digs, the chaplain mends, and the prince makes sure everyone gets their turn.</div>
</div>
'''

for k, v in IMG.items():
    html = html.replace(f'%%{k}%%', v)

# Emit pure ASCII. A published artifact is wrapped in a <head> this file
# does not control, so it cannot declare its own charset; escaping means
# the glyphs never depend on one being supplied.
html = ''.join(c if ord(c) < 128 else f'&#x{ord(c):x};' for c in html)

out = '/home/user/browsergacha/docs/tanner-sheet.html'
with open(out, 'w') as f:
    f.write(html)
print(out, os.path.getsize(out) // 1024, 'KB')
