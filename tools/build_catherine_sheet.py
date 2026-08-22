import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Catherine'
PANEL = (30, 26, 19, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

# (file, frames, fps, clip name) — mirrors sprite.strips in the hero def.
STRIPS = [
    ('catherineidle.png',   9,  5, 'idle'),
    ('catherineidle1.png',  9,  6, 'fidget1'),
    ('catherineidle2.png',  9,  6, 'fidget2'),
    ('catherineskill1.png', 17, 13, 'attack'),
    ('catherineskill2.png', 9,  10, 'heal'),
    ('catherineskill3.png', 17, 13, 'sweep'),
    ('catherinedeath.png',  9,  7, 'death'),
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

html = r'''<title>Catherine, White Paladin</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  :root {
    --ground: #16130f;
    --panel: #1e1a13;
    --panel-2: #26211a;
    --line: #4a3f2c;
    --ink: #efe8da;
    --muted: #a99b80;
    --gold: #ffd76a;
    --halo: #f2b13c;
    --halo-dim: #8a6a2e;
    --display: 'Chakra Petch', 'Trebuchet MS', sans-serif;
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
  .eyebrow b { color: var(--halo); font-weight: 500; }

  /* ---- Hero header ---- */
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art {
    flex: 0 0 300px; position: relative;
    background:
      radial-gradient(ellipse 60% 45% at 50% 62%, rgba(242,177,60,.16), transparent 70%),
      var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    min-height: 320px;
  }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag {
    position: absolute; top: 10px; left: 12px;
    font-size: 11px; letter-spacing: 2px; color: var(--halo-dim);
    text-transform: uppercase;
  }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--gold); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 {
    font-family: var(--display); font-weight: 700; font-size: 66px;
    line-height: .95; color: var(--ink); text-wrap: balance;
    text-shadow: 0 0 32px rgba(242,177,60,.35);
  }
  .title-line { font-size: 16px; color: var(--halo); letter-spacing: 1px; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge {
    font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px;
  }
  .badge.light { border-color: var(--halo-dim); color: var(--halo); }
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
  .stat.atk .v { color: var(--halo); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  .stats-note { font-size: 12px; color: var(--muted); margin-top: 8px; }

  /* ---- Sections ---- */
  h2 {
    font-family: var(--display); font-weight: 600; font-size: 30px;
    margin: 64px 0 6px; color: var(--ink);
  }
  h2 .glyph { color: var(--halo); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }

  /* ---- Signature ---- */
  .sig-grid { display: flex; gap: 20px; flex-wrap: wrap; }
  .sig-copy { flex: 1 1 360px; }
  .sig-copy ul { list-style: none; display: flex; flex-direction: column; gap: 14px; }
  .sig-copy li { padding-left: 22px; position: relative; color: var(--ink); }
  .sig-copy li::before { content: '\2726'; position: absolute; left: 0; color: var(--halo); font-size: 12px; top: 4px; }
  .sig-copy li b { color: var(--halo); font-weight: 500; }
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
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--halo-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 600; font-size: 24px; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--gold); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--halo); font-weight: 500; }
  .ability.passive-card { border-color: var(--halo-dim); }

  .dmg-table-box { margin-top: 22px; overflow-x: auto; background: var(--panel); border: 2px solid var(--line); border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; min-width: 620px; font-size: 13px; }
  th, td { padding: 9px 14px; text-align: right; font-variant-numeric: tabular-nums; }
  thead th { color: var(--muted); font-weight: 500; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid var(--line); }
  tbody th { text-align: left; font-weight: 500; color: var(--ink); white-space: nowrap; }
  tbody tr + tr td, tbody tr + tr th { border-top: 1px solid #2f2819; }
  td.max { color: var(--halo); font-weight: 600; }
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
  .acquire .v { font-family: var(--display); font-size: 22px; color: var(--gold); }
  .acquire .v.hl { color: var(--halo); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--halo); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha · Hero Dossier · <b>4★ Light</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Catherine idle animation, flail in hand" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">★★★★<span class="rank">RARITY 4</span></div>
      <h1>CATHERINE</h1>
      <div class="title-line">White Paladin of Reverence</div>
      <div class="badges">
        <span class="badge light">☀️ Light</span>
        <span class="badge">Front-line support</span>
        <span class="badge">Heals &amp; buffs</span>
      </div>
      <p class="lede">A flail-swinging paladin in white plate who holds the front rank
      herself. She <b>triages the wounded</b>, blesses the whole front line with
      strength and guard, and answers every heal in the party with a
      protective ward.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1700</div></div>
    <div class="stat atk"><div class="k">ATK</div><div class="v">200</div><div class="sub">scales her heals too</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">160</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">98</div></div>
    <div class="stat"><div class="k">Crit</div><div class="v">15%</div><div class="sub">×1.5 damage</div></div>
  </div>
  <div class="stats-note">Base values at level 1 — stats scale with level and ★ ascension like every hero.</div>

  <h2><span class="glyph">✦</span> Reverent Sweep</h2>
  <div class="section-sub">Her signature moment: the flail whirled through the whole enemy front line.</div>
  <div class="sig-grid">
    <div class="sig-copy">
      <ul>
        <li><b>Eight frames of wind-up.</b> The flail head spins faster and faster before it ever leaves her side.</li>
        <li><b>Then the burst.</b> On frames 11–12 the chain whips into a full radial arc — that is when the sweep lands, on <b>every enemy standing in a front hex</b>.</li>
        <li><b>150% ATK to each of them.</b> One swing, the whole line pays.</li>
        <li><span class="dim">The recovery trails a long arc of light where the flail passed.</span></li>
      </ul>
    </div>
    <div class="sig-box">
      <img src="%%sweep%%" alt="Catherine whirling her flail through the enemy front line" width="280" height="280">
      <div class="cap">Wind-up · burst · trail</div>
    </div>
  </div>

  <h2><span class="glyph">✦</span> Kit</h2>
  <div class="section-sub">One attack, one triage heal, one front-line sweep — plus a ward that answers every heal in the party.</div>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 · no cooldown</div>
      <h3>Reverent Strike</h3>
      <div class="meta">Single target · <b>120% ATK</b></div>
      <p>A full swing of the flail at one enemy.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 · 3-turn cooldown</div>
      <h3>Consecrated Mercy</h3>
      <div class="meta">Herself + 2 allies · <b>30% ATK</b> each</div>
      <p>Heals Catherine and the <b>2 most-wounded allies</b> — picked by lowest HP percentage, so the healing always finds who needs it.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 · 5-turn cooldown</div>
      <h3>Reverent Sweep</h3>
      <div class="meta">Enemy front line · <b>150% ATK</b> each</div>
      <p>Whirls the flail through <b>every enemy in a front hex</b> in one sweeping arc.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Vow of Reverence</h3>
      <p>Any ally restored to health is shielded: <b>+12% DEF for 2 turns</b>. One ward at a time — it won't stack off repeated ticks.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Position bonus · front hex</div>
      <h3>Shieldbearer</h3>
      <p>While placed in a front hex, Catherine gains <b>+18% DEF</b>.</p>
    </div>
  </div>

  <div class="dmg-table-box">
    <table>
      <thead>
        <tr><th style="text-align:left">Skill power by skill level</th>
          <th>Lv 1</th><th>Lv 2</th><th>Lv 3</th><th>Lv 4</th><th>Lv 5</th></tr>
      </thead>
      <tbody>
        <tr><th>Reverent Strike, % ATK</th><td>120</td><td>132</td><td>144</td><td>156</td><td class="max">168</td></tr>
        <tr><th>Consecrated Mercy, % ATK each</th><td>30</td><td>33</td><td>36</td><td>39</td><td class="max">42</td></tr>
        <tr><th>Reverent Sweep, % ATK each</th><td>150</td><td>165</td><td>180</td><td>195</td><td class="max">210</td></tr>
      </tbody>
    </table>
    <div class="table-cap">Skill levels add +10% power per level (max Lv 5) — raised in Improve by sacrificing another Catherine.</div>
  </div>

  <h2><span class="glyph">✦</span> Animations</h2>
  <div class="section-sub">Hand-drawn 256px strips — seven in all, including two timed idle fidgets.</div>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle animation"><div class="cap"><b>Idle</b></div><div class="note">9 frames · her resting loop</div></div>
    <div class="clip"><img src="%%attack%%" alt="Reverent Strike animation"><div class="cap"><b>Reverent Strike</b></div><div class="note">17 frames · the flail head connects on frame 12</div></div>
    <div class="clip"><img src="%%heal%%" alt="Consecrated Mercy animation"><div class="cap"><b>Consecrated Mercy</b></div><div class="note">9 frames · the radiance crests on frame 7</div></div>
    <div class="clip"><img src="%%sweep%%" alt="Reverent Sweep animation"><div class="cap"><b>Reverent Sweep</b></div><div class="note">17 frames · the radial burst lands on 12</div></div>
    <div class="clip"><img src="%%death%%" alt="Death animation"><div class="cap"><b>Death</b></div><div class="note">9 frames · freezes on the final pose</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Idle Fidget I</b></div><div class="note">plays every 8–15s of idling</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Idle Fidget II</b></div><div class="note">plays every 8–15s of idling</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Temporal Scroll 🌀</div><div class="v">12%</div></div>
    <div><div class="k">Common / Rare</div><div class="v hl">—</div></div>
    <div style="flex:1 1 300px"><div class="k">Where she comes from</div>
      <div style="font-size:13px;color:var(--muted)">Light and Dark heroes summon <em>only</em> from Temporal Scrolls — 1% from any hunt or boss stage 15+, guaranteed every 50th tower floor.</div></div>
  </div>

  <div class="foot">Play her now at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a> · in the pool since build v171.</div>
</div>
'''

for k, v in IMG.items():
    html = html.replace(f'%%{k}%%', v)

# Emit pure ASCII. A published artifact is wrapped in a <head> this file
# does not control, so it cannot declare its own charset; escaping means
# the glyphs never depend on one being supplied.
html = ''.join(c if ord(c) < 128 else f'&#x{ord(c):x};' for c in html)

out = '/home/user/browsergacha/docs/catherine-sheet.html'
with open(out, 'w') as f:
    f.write(html)
print(out, os.path.getsize(out) // 1024, 'KB')
