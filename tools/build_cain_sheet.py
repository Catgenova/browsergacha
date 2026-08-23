import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Cain'
PANEL = (18, 20, 24, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

# (file, frames, fps, clip name) — mirrors sprite.strips in the hero def.
STRIPS = [
    ('cainidle.png',    9,  5, 'idle'),
    ('cainidle1.png',   9,  6, 'fidget1'),
    ('cainidle2.png',   9,  6, 'fidget2'),
    ('cainskill1.png',  9, 10, 'tidemend'),
    ('cainskill2.png',  9, 10, 'twinmercies'),
    ('cainskill3.png',  9, 10, 'quickening'),
    ('caindeath.png',   9,  7, 'death'),
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

html = r'''<title>Cain, Chaplain of Cryst</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cardo:wght@400;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: the chapel font at evening. Vestment
     white and font-water teal on a stone-dark ground, a thread of candle
     gold. Every ground and color is painted explicitly. */
  :root {
    --ground: #101216;
    --panel: #12141a;
    --panel-2: #181c22;
    --line: #34404c;
    --ink: #f0f2ee;
    --muted: #97a4a8;
    --font-water: #7adcd8;
    --gleam: #c8f6f2;
    --water-dim: #3c7a78;
    --candle: #d8b468;
    --lash: #e2917a;
    --display: 'Cardo', 'Georgia', serif;
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
  .eyebrow b { color: var(--font-water); font-weight: 500; }

  /* ---- Hero header ---- */
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art {
    flex: 0 0 300px; position: relative;
    background:
      radial-gradient(ellipse 62% 46% at 50% 58%, rgba(122,220,216,.13), transparent 70%),
      var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    min-height: 320px;
  }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag {
    position: absolute; top: 10px; left: 12px;
    font-size: 11px; letter-spacing: 2px; color: var(--water-dim);
    text-transform: uppercase;
  }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--gleam); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 {
    font-family: var(--display); font-weight: 700; font-size: 84px;
    line-height: .95; color: var(--ink); text-wrap: balance; letter-spacing: 5px;
    text-shadow: 0 0 34px rgba(122,220,216,.35);
  }
  .title-line { font-size: 16px; color: var(--font-water); letter-spacing: 4px;
    font-family: var(--display); text-transform: uppercase; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge {
    font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px;
  }
  .badge.water { border-color: var(--water-dim); color: var(--font-water); }
  .badge.sect { border-color: var(--candle); color: var(--candle); }
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
  .stat.hp .v { color: var(--font-water); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  .stats-note { font-size: 12px; color: var(--muted); margin-top: 8px; }

  /* ---- Sections ---- */
  h2 {
    font-family: var(--display); font-weight: 700; font-size: 28px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 3px; text-transform: uppercase;
  }
  h2 .glyph { color: var(--font-water); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }

  /* ---- Mercy by the measure ---- */
  .measure-box {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px 16px; overflow-x: auto;
  }
  .measures { display: grid; grid-template-columns: repeat(3, minmax(190px, 1fr)); gap: 14px; min-width: 620px; }
  .measure {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 16px; text-align: center;
  }
  .measure .who { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .measure .num {
    font-family: var(--display); font-size: 46px; line-height: 1.1;
    color: var(--font-water); font-variant-numeric: tabular-nums;
  }
  .measure .what { font-size: 12px; color: var(--muted); }
  .measure .what b { color: var(--ink); font-weight: 500; }
  .measure-cap { font-size: 12px; color: var(--muted); margin-top: 14px; }
  .measure-cap b { color: var(--font-water); font-weight: 500; }

  /* ---- The overflow ---- */
  .over-box {
    margin-top: 22px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 22px 20px; display: flex; gap: 12px;
    flex-wrap: wrap; align-items: center; justify-content: center;
    font-size: 13px; color: var(--muted); text-align: center;
  }
  .over-step {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink);
  }
  .over-step b { color: var(--font-water); font-weight: 500; }
  .over-step.lash b { color: var(--lash); }
  .over-arrow { color: var(--water-dim); font-size: 20px; }

  /* ---- Abilities ---- */
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px;
  }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--water-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 700; font-size: 23px; letter-spacing: 1px; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--gleam); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--font-water); font-weight: 500; }
  .ability.passive-card { border-color: var(--water-dim); }

  .dmg-table-box { margin-top: 22px; overflow-x: auto; background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; min-width: 620px; font-size: 13px; }
  th, td { padding: 9px 14px; text-align: right; font-variant-numeric: tabular-nums; }
  thead th { color: var(--muted); font-weight: 500; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid var(--line); }
  tbody th { text-align: left; font-weight: 500; color: var(--ink); white-space: nowrap; }
  tbody tr + tr td, tbody tr + tr th { border-top: 1px solid #202830; }
  td.max { color: var(--font-water); font-weight: 600; }
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
  .foot a { color: var(--font-water); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>4&#x2605; Water &middot; Cryst Sect &middot; No. 1</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Cain idle animation, an old bearded chaplain in white and teal with a crystal-topped staff" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 4</span></div>
      <h1>CAIN</h1>
      <div class="title-line">Chaplain of Cryst</div>
      <div class="badges">
        <span class="badge water">&#x1f4a7; Water</span>
        <span class="badge">Back-row support</span>
        <span class="badge">Overheal converter</span>
        <span class="badge sect">Cryst Sect &middot; the chaplain</span>
      </div>
      <p class="lede">The court's old confessor measures every mercy in shares
      of <b>his own enormous constitution</b> &#x2014; and wastes none of it.
      Blessing poured past a full ally does not spill on the chapel floor: it
      <b>lashes the healthiest enemy as damage</b>. Kindness, fully accounted.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat hp"><div class="k">HP</div><div class="v">2100</div><div class="sub">the pool every heal is cut from</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">110</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">150</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">96</div></div>
    <div class="stat"><div class="k">Crit</div><div class="v">15%</div><div class="sub">&#xd7;1.5 damage</div></div>
  </div>
  <div class="stats-note">Base values at level 1 &#x2014; stats scale with level and &#x2605; ascension like every hero.</div>

  <h2><span class="glyph">&#x2695;</span> Mercy by the Measure</h2>
  <div class="section-sub">Every heal in his kit is a fixed share of <b
    style="color:var(--ink)">Cain's own max HP</b> &#x2014; not the patient's, not his
    ATK. Build him tall and every mercy grows with him.</div>
  <div class="measure-box">
    <div class="measures">
      <div class="measure">
        <div class="who">Tidemend &middot; every turn</div>
        <div class="num">30%</div>
        <div class="what">of his pool, one ally &#x2014; <b>630 HP</b> at level 1, before any building</div>
      </div>
      <div class="measure">
        <div class="who">Twin Mercies &middot; 3-turn cooldown</div>
        <div class="num">35%</div>
        <div class="what">each, to the <b>two most-wounded allies</b> &#x2014; pure triage, himself included</div>
      </div>
      <div class="measure">
        <div class="who">Quickening Waters &middot; 5-turn cooldown</div>
        <div class="num">50%</div>
        <div class="what">to one ally, who leaves the font with <b>+30% SPD for 2 turns</b></div>
      </div>
    </div>
    <div class="measure-cap">HP%, HP flat and HP-set gear are all <b>healing stats</b> on
      him &#x2014; and every point of surplus becomes ammunition (below).</div>
  </div>

  <h2><span class="glyph">&#x26F2;</span> The Overflow</h2>
  <div class="section-sub">His passive closes the ledger: healing past full converts,
    point for point, into damage on the <b style="color:var(--ink)">healthiest enemy by
    HP%</b> &#x2014; the one who least expects to be touched.</div>
  <div class="over-box">
    <span class="over-step">Heal a full-ish ally <b>&#x26F2;</b></span>
    <span class="over-arrow">&#x2192;</span>
    <span class="over-step">the surplus is measured</span>
    <span class="over-arrow">&#x2192;</span>
    <span class="over-step">Spillway: <b>&#xd7;1.25</b> from a back hex</span>
    <span class="over-arrow">&#x2192;</span>
    <span class="over-step lash">the healthiest enemy is <b>lashed</b></span>
  </div>

  <h2><span class="glyph">&#x2726;</span> Kit</h2>
  <div class="section-sub">Three mercies in rising measures, and the accounting that
    makes over-healing a strategy instead of a mistake.</div>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; no cooldown</div>
      <h3>Tidemend</h3>
      <div class="meta">One ally &middot; <b>30% of Cain's max HP</b></div>
      <p>The daily office. Cast it on the wounded and it mends; cast it on
      the whole and <b>the surplus goes hunting</b>.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; 3-turn cooldown</div>
      <h3>Twin Mercies</h3>
      <div class="meta">Two most-wounded allies &middot; <b>35% of his max HP each</b></div>
      <p>The font finds the two emptiest vessels on its own &#x2014; no
      aiming, no self-bias. Triage as liturgy.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; 5-turn cooldown</div>
      <h3>Quickening Waters</h3>
      <div class="meta">One ally &middot; <b>50% of his max HP</b> &middot; +30% SPD, 2 turns</div>
      <p>Half of everything he is, poured into one ally &#x2014; who stands
      up <b>faster than they went down</b>.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Nothing Is Wasted</h3>
      <p>Overheal converts to damage against the <b>highest-HP% enemy</b>,
      mitigated like any strike. Every point of mercy lands somewhere.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Position bonus &middot; back hex</div>
      <h3>Spillway</h3>
      <p>Overheal damage is <b>increased 25%</b>. The channel runs deeper
      from the rear.</p>
    </div>
  </div>

  <div class="dmg-table-box">
    <table>
      <thead>
        <tr><th style="text-align:left">Heal share by skill level (% of his max HP)</th>
          <th>Lv 1</th><th>Lv 2</th><th>Lv 3</th><th>Lv 4</th><th>Lv 5</th></tr>
      </thead>
      <tbody>
        <tr><th>Tidemend</th><td>30</td><td>33</td><td>36</td><td>39</td><td class="max">42</td></tr>
        <tr><th>Twin Mercies, each</th><td>35</td><td>39</td><td>42</td><td>46</td><td class="max">49</td></tr>
        <tr><th>Quickening Waters</th><td>50</td><td>55</td><td>60</td><td>65</td><td class="max">70</td></tr>
      </tbody>
    </table>
    <div class="table-cap">Skill levels add +10% power per level (max Lv 5) &#x2014; raised in Improve
      by sacrificing another Cain. Bigger shares heal harder and overflow harder alike.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Animations</h2>
  <div class="section-sub">Hand-drawn 256px strips &#x2014; seven in all, nine frames each.</div>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle animation"><div class="cap"><b>Idle</b></div><div class="note">the staff crystal keeps vigil</div></div>
    <div class="clip"><img src="%%tidemend%%" alt="Tidemend animation"><div class="cap"><b>Tidemend</b></div><div class="note">the orb charges and bursts on frame 5</div></div>
    <div class="clip"><img src="%%twinmercies%%" alt="Twin Mercies animation"><div class="cap"><b>Twin Mercies</b></div><div class="note">the waters wind out on frame 7</div></div>
    <div class="clip"><img src="%%quickening%%" alt="Quickening Waters animation"><div class="cap"><b>Quickening Waters</b></div><div class="note">the blessing crests on frame 7</div></div>
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

  <div class="foot">Play him now at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a> &middot; sixth of the Cryst sect &#x2014; the King freezes, the archers finish, and the chaplain keeps the whole court standing.</div>
</div>
'''

for k, v in IMG.items():
    html = html.replace(f'%%{k}%%', v)

# Emit pure ASCII. A published artifact is wrapped in a <head> this file
# does not control, so it cannot declare its own charset; escaping means
# the glyphs never depend on one being supplied.
html = ''.join(c if ord(c) < 128 else f'&#x{ord(c):x};' for c in html)

out = '/home/user/browsergacha/docs/cain-sheet.html'
with open(out, 'w') as f:
    f.write(html)
print(out, os.path.getsize(out) // 1024, 'KB')
