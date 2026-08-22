import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Oak'
PANEL = (32, 26, 19, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

# (file, frames, fps, clip name) — mirrors sprite.strips in the hero def.
STRIPS = [
    ('oakidle.png',   9,  5, 'idle'),
    ('oakilde1.png',  9,  6, 'fidget1'),
    ('oakidle2.png',  9,  6, 'fidget2'),
    ('oakskill1.png', 9, 12, 'confession'),
    ('oakskill2.png', 9, 12, 'penance'),
    ('oakskill3.png', 7, 10, 'absolution'),
    ('oakdeath.png',  9,  7, 'death'),
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

html = r'''<title>Oak, Confessor of Reverence</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bitter:wght@600;700;800&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: ember and old timber — the
     confessional at candle-light. Every ground and color is painted
     explicitly. */
  :root {
    --ground: #16120e;
    --panel: #201a13;
    --panel-2: #281f15;
    --line: #4a3b28;
    --ink: #efe6d8;
    --muted: #a4937c;
    --ember: #e8944a;
    --candle: #f8d898;
    --seal: #cf6a52;
    --ember-dim: #8a6238;
    --display: 'Bitter', 'Georgia', serif;
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
      radial-gradient(ellipse 60% 45% at 50% 62%, rgba(232,148,74,.15), transparent 70%),
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
  .stars { color: var(--candle); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 {
    font-family: var(--display); font-weight: 800; font-size: 72px;
    line-height: .95; color: var(--ink); text-wrap: balance;
    text-shadow: 0 0 30px rgba(232,148,74,.35);
  }
  .title-line { font-size: 16px; color: var(--ember); letter-spacing: 1px; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge {
    font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px;
  }
  .badge.light { border-color: var(--ember-dim); color: var(--ember); }
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
    font-family: var(--display); font-weight: 700; font-size: 30px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.15;
  }
  .stat.atk .v { color: var(--ember); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  .stats-note { font-size: 12px; color: var(--muted); margin-top: 8px; }

  /* ---- Sections ---- */
  h2 {
    font-family: var(--display); font-weight: 700; font-size: 30px;
    margin: 64px 0 6px; color: var(--ink);
  }
  h2 .glyph { color: var(--ember); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }

  /* ---- The cycle ---- */
  .cycle-box {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px 18px; overflow-x: auto;
  }
  .cycle { display: flex; align-items: stretch; justify-content: center; gap: 0; min-width: 640px; }
  .rite {
    flex: 0 1 180px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 14px 16px; text-align: center;
  }
  .rite h3 { font-family: var(--display); font-weight: 700; font-size: 20px; color: var(--ink); }
  .rite .pct { font-family: var(--display); font-weight: 800; font-size: 30px; color: var(--ember);
    font-variant-numeric: tabular-nums; }
  .rite .cd { font-size: 11px; letter-spacing: 1px; color: var(--muted); text-transform: uppercase; }
  .link {
    align-self: center; text-align: center; padding: 0 10px; flex: 0 0 auto;
  }
  .link .arrow { font-size: 22px; color: var(--ember-dim); line-height: 1; }
  .link .chance {
    display: inline-block; margin-top: 4px; font-size: 12px; font-weight: 600;
    color: var(--ground); background: var(--seal); border-radius: 999px;
    padding: 1px 10px; letter-spacing: 1px;
  }
  .loopback {
    margin: 14px auto 0; text-align: center; font-size: 12px; color: var(--muted);
  }
  .loopback .chance {
    display: inline-block; font-size: 12px; font-weight: 600;
    color: var(--ground); background: var(--seal); border-radius: 999px;
    padding: 1px 10px; letter-spacing: 1px; margin: 0 6px;
  }
  .cycle-cap { font-size: 12px; color: var(--muted); margin-top: 14px; }
  .cycle-cap b { color: var(--ember); font-weight: 600; }

  /* ---- Abilities ---- */
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px;
  }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--ember-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 700; font-size: 23px; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--candle); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--ember); font-weight: 500; }
  .ability.passive-card { border-color: var(--ember-dim); }

  .dmg-table-box { margin-top: 22px; overflow-x: auto; background: var(--panel); border: 2px solid var(--line); border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; min-width: 620px; font-size: 13px; }
  th, td { padding: 9px 14px; text-align: right; font-variant-numeric: tabular-nums; }
  thead th { color: var(--muted); font-weight: 500; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid var(--line); }
  tbody th { text-align: left; font-weight: 500; color: var(--ink); white-space: nowrap; }
  tbody tr + tr td, tbody tr + tr th { border-top: 1px solid #322818; }
  td.max { color: var(--ember); font-weight: 600; }
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
  .acquire .v { font-family: var(--display); font-weight: 700; font-size: 22px; color: var(--candle); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--ember); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>4&#x2605; Light &middot; Reverence Sect</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Oak idle animation, robed confessor at rest" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 4</span></div>
      <h1>OAK</h1>
      <div class="title-line">Confessor of Reverence</div>
      <div class="badges">
        <span class="badge light">&#x2600;&#xfe0f; Light</span>
        <span class="badge">Front-line DPS</span>
        <span class="badge">Chain caster</span>
        <span class="badge">Reverence Sect</span>
      </div>
      <p class="lede">The sect's quiet interrogator: a robed monk who stands in
      the front rank and takes confessions by force. His three rites <b>chain
      into one another on hot dice</b>, a single opening strike sometimes
      running the entire cycle &#x2014; and a blow that misses him is a
      confession he answers on the spot.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1450</div></div>
    <div class="stat atk"><div class="k">ATK</div><div class="v">230</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">130</div><div class="sub">his real armor is the dodge</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">100</div></div>
    <div class="stat"><div class="k">Crit</div><div class="v">15%</div><div class="sub">&#xd7;1.5 damage</div></div>
  </div>
  <div class="stats-note">Base values at level 1 &#x2014; stats scale with level and &#x2605; ascension like every hero.</div>

  <h2><span class="glyph">&#x26D3;</span> The Confession Cycle</h2>
  <div class="section-sub">Every rite carries a chance to cast the next one immediately &#x2014;
    free, in the same action, touching no cooldown. The dice decide how long the
    sermon runs; four links is the cap.</div>
  <div class="cycle-box">
    <div class="cycle">
      <div class="rite">
        <div class="cd">Skill 1 &middot; no CD</div>
        <h3>Confession</h3>
        <div class="pct">110%</div>
        <div class="cd">ATK, one target</div>
      </div>
      <div class="link"><div class="arrow">&#x2192;</div><span class="chance">20%</span></div>
      <div class="rite">
        <div class="cd">Skill 2 &middot; 3-turn CD</div>
        <h3>Penance</h3>
        <div class="pct">150%</div>
        <div class="cd">ATK, one target</div>
      </div>
      <div class="link"><div class="arrow">&#x2192;</div><span class="chance">25%</span></div>
      <div class="rite">
        <div class="cd">Skill 3 &middot; 5-turn CD</div>
        <h3>Absolution</h3>
        <div class="pct">175%</div>
        <div class="cd">ATK, one target</div>
      </div>
    </div>
    <div class="loopback">&#x21BA; Absolution carries a<span class="chance">30%</span>chance
      to begin the cycle again with Confession.</div>
    <div class="cycle-cap">What the dice are worth: counting every possible chain, a cast of
      Confession averages <b>&#x2248;151% ATK</b>, Penance <b>&#x2248;205%</b>, and Absolution
      <b>&#x2248;220%</b> &#x2014; and a chained rite never consumes its cooldown, so a lucky
      Penance proc is pure extra.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Kit</h2>
  <div class="section-sub">Three single-target rites, a counter-attack hiding in his footwork,
    and a front-hex bonus that feeds it.</div>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; no cooldown</div>
      <h3>Confession</h3>
      <div class="meta">Single target &middot; <b>110% ATK</b> &middot; 20% &#x2192; Penance</div>
      <p>A measured opening strike. One swing in five turns into something
      much worse for the target.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; 3-turn cooldown</div>
      <h3>Penance</h3>
      <div class="meta">Single target &middot; <b>150% ATK</b> &middot; 25% &#x2192; Absolution</div>
      <p>The price of what was confessed. A quarter of the time, the
      sentence is carried out immediately.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; 5-turn cooldown</div>
      <h3>Absolution</h3>
      <div class="meta">Single target &middot; <b>175% ATK</b> &middot; 30% &#x2192; Confession</div>
      <p>The final rite &#x2014; which sometimes turns out not to be final
      at all, as the cycle begins again.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Confessor's Riposte</h3>
      <p>When Oak <b>dodges</b> an attack, he has a <b>50% chance to answer
      with Confession</b> on the spot &#x2014; his attacker's miss becomes an
      opening, and the riposte can chain like any other cast.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Position bonus &middot; front hex</div>
      <h3>Ghost Step</h3>
      <p>From a front hex: <b>+15% chance to dodge</b>. The line holds because
      he is never quite where the blow lands &#x2014; and every slip is a
      chance at a free Confession.</p>
    </div>
  </div>

  <div class="dmg-table-box">
    <table>
      <thead>
        <tr><th style="text-align:left">Skill power by skill level</th>
          <th>Lv 1</th><th>Lv 2</th><th>Lv 3</th><th>Lv 4</th><th>Lv 5</th></tr>
      </thead>
      <tbody>
        <tr><th>Confession, % ATK</th><td>110</td><td>121</td><td>132</td><td>143</td><td class="max">154</td></tr>
        <tr><th>Penance, % ATK</th><td>150</td><td>165</td><td>180</td><td>195</td><td class="max">210</td></tr>
        <tr><th>Absolution, % ATK</th><td>175</td><td>192.5</td><td>210</td><td>227.5</td><td class="max">245</td></tr>
      </tbody>
    </table>
    <div class="table-cap">Skill levels add +10% power per level (max Lv 5) &#x2014; raised in Improve
      by sacrificing another Oak. Chain chances never change; the dice are the dice.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Animations</h2>
  <div class="section-sub">Hand-drawn 256px strips &#x2014; seven in all, including two timed idle fidgets.</div>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle animation"><div class="cap"><b>Idle</b></div><div class="note">9 frames &middot; his resting loop</div></div>
    <div class="clip"><img src="%%confession%%" alt="Confession animation"><div class="cap"><b>Confession</b></div><div class="note">9 frames &middot; the strike lands on frame 6</div></div>
    <div class="clip"><img src="%%penance%%" alt="Penance animation"><div class="cap"><b>Penance</b></div><div class="note">9 frames &middot; the blow lands on frame 6</div></div>
    <div class="clip"><img src="%%absolution%%" alt="Absolution animation"><div class="cap"><b>Absolution</b></div><div class="note">7 frames &middot; the final rite lands on frame 5</div></div>
    <div class="clip"><img src="%%death%%" alt="Death animation"><div class="cap"><b>Death</b></div><div class="note">9 frames &middot; freezes on the final pose</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Idle Fidget I</b></div><div class="note">plays every 8&#x2013;15s of idling</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Idle Fidget II</b></div><div class="note">plays every 8&#x2013;15s of idling</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Temporal Scroll &#x1f300;</div><div class="v">4&#x2605; band &middot; 12%</div></div>
    <div style="flex:1 1 300px"><div class="k">Where he comes from</div>
      <div style="font-size:13px;color:var(--muted)">Light and Dark heroes summon <em>only</em> from Temporal Scrolls
      &#x2014; 1% from any hunt or boss stage 15+, guaranteed every 50th tower floor,
      or 500 &#x1f48e; in the Shop.</div></div>
  </div>

  <div class="foot">Play him now at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a> &middot; fifth of the Reverence sect, beside Catherine, Toll, Javarious and Leonardo.</div>
</div>
'''

for k, v in IMG.items():
    html = html.replace(f'%%{k}%%', v)

# Emit pure ASCII. A published artifact is wrapped in a <head> this file
# does not control, so it cannot declare its own charset; escaping means
# the glyphs never depend on one being supplied.
html = ''.join(c if ord(c) < 128 else f'&#x{ord(c):x};' for c in html)

out = '/home/user/browsergacha/docs/oak-sheet.html'
with open(out, 'w') as f:
    f.write(html)
print(out, os.path.getsize(out) // 1024, 'KB')
