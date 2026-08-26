import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Silas'
PANEL = (23, 29, 40, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

# (file, frames, fps, clip name) — mirrors sprite.strips in the hero def.
# fidget1 carries the in-game hop: the same sine arc battle.js applies
# (hop frames 5-9, 30px peak), baked into the clip so the sheet shows
# the spring the game shows.
HOP = [0, 0, 0, 0, 0, 21, 30, 21, 0]

STRIPS = [
    ('silasidle.png',   9,  5, 'idle'),
    ('silasidle1.png',  9,  6, 'fidget1'),
    ('silasidle2.png',  9,  6, 'fidget2'),
    ('silasskill1.png', 9, 12, 'boltshot'),
    ('silasskill2.png', 8, 11, 'lumenarrow'),
    ('silasskill3.png', 9, 10, 'stance'),
    ('silasdeath.png',  9,  7, 'death'),
]

def clip(fname, frames, fps, lift=None):
    im = Image.open(f'{SRC}/{fname}').convert('RGBA')
    w, h = im.size
    assert w % frames == 0, f'{fname}: {w}px does not divide into {frames} frames'
    fw = w // frames
    cells = []
    for i in range(frames):
        cell = im.crop((i * fw, 0, (i + 1) * fw, h))
        bg = Image.new('RGBA', cell.size, PANEL)
        dy = -(lift[i] if lift and i < len(lift) else 0)
        bg.alpha_composite(cell, (0, dy))
        cells.append(bg.convert('RGB').resize((SIZE, SIZE), Image.NEAREST))
    buf = io.BytesIO()
    cells[0].save(buf, format='GIF', save_all=True, append_images=cells[1:],
                  duration=int(1000 / fps), loop=0, optimize=True)
    return 'data:image/gif;base64,' + base64.b64encode(buf.getvalue()).decode()

IMG = {name: clip(f, n, fps, HOP if name == 'fidget1' else None)
       for f, n, fps, name in STRIPS}

html = r'''<title>Silas, Boltcaster of Reverence</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: a white-gold sightline through cold
     steel night. Every ground and color is painted explicitly. */
  :root {
    --ground: #10141c;
    --panel: #171d28;
    --panel-2: #1d2534;
    --line: #34405a;
    --ink: #e8edf4;
    --muted: #8fa0b8;
    --bolt: #ffe9a0;
    --sight: #e8c86a;
    --sight-dim: #7a6b3e;
    --broken: #d87a6a;
    --display: 'Rajdhani', 'Trebuchet MS', sans-serif;
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
  .eyebrow b { color: var(--sight); font-weight: 500; }

  /* ---- Hero header ---- */
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art {
    flex: 0 0 300px; position: relative;
    background:
      radial-gradient(ellipse 60% 45% at 50% 62%, rgba(255,233,160,.13), transparent 70%),
      var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    min-height: 320px;
  }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag {
    position: absolute; top: 10px; left: 12px;
    font-size: 11px; letter-spacing: 2px; color: var(--sight-dim);
    text-transform: uppercase;
  }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--bolt); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 {
    font-family: var(--display); font-weight: 700; font-size: 74px;
    line-height: .9; color: var(--ink); text-wrap: balance; letter-spacing: 3px;
    text-shadow: 0 0 30px rgba(255,233,160,.3);
  }
  .title-line { font-size: 16px; color: var(--sight); letter-spacing: 2px;
    font-family: var(--display); font-weight: 600; text-transform: uppercase; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge {
    font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px;
  }
  .badge.light { border-color: var(--sight-dim); color: var(--sight); }
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
    font-family: var(--display); font-weight: 700; font-size: 32px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.1;
  }
  .stat.atk .v { color: var(--sight); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  .stats-note { font-size: 12px; color: var(--muted); margin-top: 8px; }

  /* ---- Sections ---- */
  h2 {
    font-family: var(--display); font-weight: 700; font-size: 30px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 1px; text-transform: uppercase;
  }
  h2 .glyph { color: var(--sight); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }

  /* ---- The stance (state diagram) ---- */
  .stance-box {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px 18px; overflow-x: auto;
  }
  .states { display: flex; align-items: stretch; justify-content: center; min-width: 640px; }
  .state {
    flex: 0 1 210px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 14px 16px; text-align: center;
  }
  .state.aiming { border-color: var(--sight); box-shadow: 0 0 16px rgba(232,200,106,.2); }
  .state h3 { font-family: var(--display); font-weight: 700; font-size: 20px;
    letter-spacing: 1px; text-transform: uppercase; color: var(--ink); }
  .state.aiming h3 { color: var(--sight); }
  .state .what { font-size: 12px; color: var(--muted); margin-top: 6px; }
  .state .what b { color: var(--bolt); font-weight: 500; }
  .flow { align-self: center; text-align: center; padding: 0 12px; flex: 0 0 auto; }
  .flow .arrow { font-size: 22px; color: var(--sight-dim); line-height: 1; }
  .flow .why { font-size: 11px; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }
  .breaks {
    margin: 16px auto 0; max-width: 560px; text-align: center;
    font-size: 12.5px; color: var(--muted);
    border-top: 1px dashed var(--line); padding-top: 12px;
  }
  .breaks b { color: var(--broken); font-weight: 600; }
  .breaks .hold { color: var(--sight); font-weight: 500; }

  /* ---- Abilities ---- */
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px;
  }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--sight-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 700; font-size: 24px; letter-spacing: 1px; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--bolt); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--sight); font-weight: 500; }
  .ability.passive-card { border-color: var(--sight-dim); }

  .dmg-table-box { margin-top: 22px; overflow-x: auto; background: var(--panel); border: 2px solid var(--line); border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; min-width: 620px; font-size: 13px; }
  th, td { padding: 9px 14px; text-align: right; font-variant-numeric: tabular-nums; }
  thead th { color: var(--muted); font-weight: 500; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid var(--line); }
  tbody th { text-align: left; font-weight: 500; color: var(--ink); white-space: nowrap; }
  tbody tr + tr td, tbody tr + tr th { border-top: 1px solid #242c3e; }
  td.max { color: var(--sight); font-weight: 600; }
  .table-cap { font-size: 12px; color: var(--muted); padding: 10px 14px 12px; }

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
  .acquire .v { font-family: var(--display); font-weight: 700; font-size: 22px; color: var(--bolt); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--sight); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>3&#x2605; Light &middot; Reverence Sect</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Silas idle animation, crossbow lowered" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 3</span></div>
      <h1>SILAS</h1>
      <div class="title-line">Boltcaster of Reverence</div>
      <div class="badges">
        <span class="badge light">&#x2600;&#xfe0f; Light</span>
        <span class="badge">Back-line DPS</span>
        <span class="badge">Stance marksman</span>
        <span class="badge">Reverence Sect</span>
      </div>
      <p class="lede">The sect's marksman, patient to the point of stillness. His
      whole game is one decision, over and over: <b>spend the turn shooting, or
      spend it aiming</b> &#x2014; because an aimed shot strikes double, an aimed
      row shot needs the stance to fire at all, and while he holds his aim he
      is maddeningly hard to hit.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">925</div></div>
    <div class="stat atk"><div class="k">ATK</div><div class="v">201</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">76</div><div class="sub">stay in the back</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">104</div></div>
    <div class="stat"><div class="k">Crit</div><div class="v">15%</div><div class="sub">&#xd7;1.5 damage</div></div>
  </div>
  <div class="stats-note">Base values at level 1 &#x2014; stats scale with level and &#x2605; ascension like every hero.</div>

  <h2><span class="glyph">&#x25CE;</span> The Aiming Stance</h2>
  <div class="section-sub">Not a timed buff &#x2014; a held state. It stays up until
    something spends it or something breaks it, and everything in his kit
    bends around which of the two happens first.</div>
  <div class="stance-box">
    <div class="states">
      <div class="state">
        <h3>At Rest</h3>
        <div class="what">Boltshot at <b>115%</b>.<br>Lumen Arrow is sealed.</div>
      </div>
      <div class="flow"><div class="arrow">&#x2192;</div><div class="why">Aiming Stance &middot; 2-turn CD</div></div>
      <div class="state aiming">
        <h3>&#x1F3AF; Aiming</h3>
        <div class="what"><b>+25% dodge</b> while held.<br>Lumen Arrow unlocks.<br>Next shot strikes <b>double</b>.</div>
      </div>
      <div class="flow"><div class="arrow">&#x2192;</div><div class="why">any shot fired</div></div>
      <div class="state">
        <h3>The Shot</h3>
        <div class="what">Boltshot &#x2192; <b>230%</b>.<br>Lumen Arrow &#x2192; <b>400%</b> to a whole row.<br>The stance is spent.</div>
      </div>
    </div>
    <div class="breaks">A <b>landed single-target hit breaks the stance</b> &#x2014; the
      counterplay is to shoot the archer. But a volley never breaks it
      (<span class="hold">AoE is beneath his notice</span>), and neither does an
      arrow he dodged &#x2014; which, while aiming, is one attack in four.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Kit</h2>
  <div class="section-sub">Two shots, one decision, and the two passives that make
    patience pay.</div>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; no cooldown</div>
      <h3>Boltshot</h3>
      <div class="meta">Single target &middot; <b>115% ATK</b> &middot; 230% aimed</div>
      <p>A snapped shot. Fired from the stance it strikes double &#x2014; the
      filler that stops being filler when he takes a breath first.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; 3-turn cooldown &middot; needs the stance</div>
      <h3>Lumen Arrow</h3>
      <div class="meta">Enemy row &middot; <b>200% ATK each</b> &middot; 400% aimed</div>
      <p>A holy arrow driven through an <b>entire enemy row</b>. It can only
      be loosed from Aiming Stance &#x2014; and since firing spends the stance,
      every Lumen Arrow is an aimed one: <b>400% ATK to everything in the
      line</b>.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; 2-turn cooldown</div>
      <h3>Aiming Stance</h3>
      <div class="meta">Self &middot; held until spent or broken</div>
      <p>Settle, draw, hold. The next shot deals <b>100% extra damage</b>; the
      stance survives volleys and dodged arrows, and falls only to a direct
      hit that lands. On the field he <b>stays crouched and drawn</b> &#x2014;
      the pose holds for as long as the stance does.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Stillness of the Marksman</h3>
      <p>While in Aiming Stance, Silas has a <b>+25% chance to dodge</b> &#x2014;
      the archer who refuses to flinch is the one you cannot seem to hit.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Position bonus &middot; back hex</div>
      <h3>Dawn Piercer</h3>
      <p>From a back hex he deals <b>+20% damage to Dark-element enemies</b>.
      An aimed Lumen Arrow through a dark row lands at <b>480% ATK</b> apiece.</p>
    </div>
  </div>

  <div class="dmg-table-box">
    <table>
      <thead>
        <tr><th style="text-align:left">Skill power by skill level</th>
          <th>Lv 1</th><th>Lv 2</th><th>Lv 3</th><th>Lv 4</th><th>Lv 5</th></tr>
      </thead>
      <tbody>
        <tr><th>Boltshot, % ATK</th><td>115</td><td>126.5</td><td>138</td><td>149.5</td><td class="max">161</td></tr>
        <tr><th>Boltshot aimed, % ATK</th><td>230</td><td>253</td><td>276</td><td>299</td><td class="max">322</td></tr>
        <tr><th>Lumen Arrow (always aimed), % ATK each</th><td>400</td><td>440</td><td>480</td><td>520</td><td class="max">560</td></tr>
      </tbody>
    </table>
    <div class="table-cap">Skill levels add +10% power per level (max Lv 5) &#x2014; raised in Improve
      by sacrificing another Silas. Aimed figures are the stance's &#xd7;2 applied to the leveled shot.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Animations</h2>
  <div class="section-sub">Hand-drawn 256px strips &#x2014; seven in all, including two timed idle fidgets.</div>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle animation"><div class="cap"><b>Idle</b></div><div class="note">9 frames &middot; his resting loop</div></div>
    <div class="clip"><img src="%%boltshot%%" alt="Boltshot animation"><div class="cap"><b>Boltshot</b></div><div class="note">9 frames &middot; the release snaps on frame 6</div></div>
    <div class="clip"><img src="%%lumenarrow%%" alt="Lumen Arrow animation"><div class="cap"><b>Lumen Arrow</b></div><div class="note">8 frames &middot; loosed on frame 5</div></div>
    <div class="clip"><img src="%%stance%%" alt="Aiming Stance animation"><div class="cap"><b>Aiming Stance</b></div><div class="note">9 frames &middot; he settles, draws &#x2014; and stays on the last frame while the stance lasts</div></div>
    <div class="clip"><img src="%%death%%" alt="Death animation"><div class="cap"><b>Death</b></div><div class="note">9 frames &middot; freezes on the final pose</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one, a short hop"><div class="cap"><b>Idle Fidget I</b></div><div class="note">a short spring off the ground &#x2014; airborne on frames 6&#x2013;8 &middot; every 8&#x2013;15s</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Idle Fidget II</b></div><div class="note">plays every 8&#x2013;15s of idling</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Temporal Scroll &#x1f300;</div><div class="v">3&#x2605; band &middot; 85%</div></div>
    <div style="flex:1 1 300px"><div class="k">Where he comes from</div>
      <div style="font-size:13px;color:var(--muted)">Light and Dark heroes summon <em>only</em> from Temporal Scrolls
      &#x2014; 1% from any hunt or boss stage 15+, guaranteed every 50th tower floor,
      or 500 &#x1f48e; in the Shop.</div></div>
  </div>

  <div class="foot">Play him now at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a> &middot; sixth of the Reverence sect, beside Catherine, Toll, Javarious, Leonardo and Oak.</div>
</div>
'''

for k, v in IMG.items():
    html = html.replace(f'%%{k}%%', v)

# Emit pure ASCII. A published artifact is wrapped in a <head> this file
# does not control, so it cannot declare its own charset; escaping means
# the glyphs never depend on one being supplied.
html = ''.join(c if ord(c) < 128 else f'&#x{ord(c):x};' for c in html)

out = '/home/user/browsergacha/docs/silas-sheet.html'
with open(out, 'w') as f:
    f.write(html)
print(out, os.path.getsize(out) // 1024, 'KB')
