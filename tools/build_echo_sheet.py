import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Echo'
PANEL = (16, 18, 24, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

# (file, frames, fps, clip name) -- mirrors sprite.strips in the hero def.
# The originals ARE the six-mirror sheets; gen/ holds the shattered
# variants the engine swaps in as her mirrors break.
STRIPS = [
    ('Echoidle.png',        9, 5, 'idle'),
    ('Echoready.png',       9, 6, 'ready'),
    ('Echoskill1and2.png',  9, 10, 'lance'),
    ('echoskill3.png',      9, 10, 'shatter'),
    ('Echodeath.png',      24, 8, 'death'),
    ('Echoidle2.png',       9, 7, 'fidget1'),
    ('echoidle1.png',       9, 7, 'fidget2'),
    ('gen/echoidle_m3.png', 9, 5, 'idle3'),
    ('gen/echoidle_m0.png', 9, 5, 'idle0'),
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

html = r'''<title>Aniani, Mirror Bulwark</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Marcellus+SC&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: the mirror hall. Silvered glass and
     prism cyan on a deep reflecting dark -- the same Cryst water as the
     King's court, but seen in a surface rather than worn as a crown.
     Every ground and color is painted explicitly. */
  :root {
    --ground: #0b0d12;
    --panel: #101218;
    --panel-2: #171b24;
    --line: #2e3646;
    --ink: #eef2f8;
    --muted: #8f9ab0;
    --prism: #8ee8ff;
    --silver: #dce6f2;
    --prism-dim: #3d6c84;
    --gold: #c8a83a;
    --break: #e88a8a;
    --display: 'Marcellus SC', 'Georgia', serif;
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
  .eyebrow b { color: var(--prism); font-weight: 500; }

  /* ---- Hero header ---- */
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art {
    flex: 0 0 300px; position: relative;
    background:
      radial-gradient(ellipse 62% 46% at 50% 58%, rgba(142,232,255,.14), transparent 70%),
      var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    min-height: 320px;
  }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag {
    position: absolute; top: 10px; left: 12px;
    font-size: 11px; letter-spacing: 2px; color: var(--prism-dim);
    text-transform: uppercase;
  }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--silver); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 {
    font-family: var(--display); font-weight: 400; font-size: 76px;
    line-height: .95; color: var(--ink); text-wrap: balance; letter-spacing: 6px;
    text-shadow: 0 0 36px rgba(142,232,255,.42);
  }
  .title-line { font-size: 15px; color: var(--prism); letter-spacing: 4px;
    font-family: var(--display); text-transform: uppercase; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge {
    font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px;
  }
  .badge.water { border-color: var(--prism-dim); color: var(--prism); }
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
  .stat.def .v { color: var(--prism); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  .stats-note { font-size: 12px; color: var(--muted); margin-top: 8px; }

  /* ---- Sections ---- */
  h2 {
    font-family: var(--display); font-weight: 400; font-size: 27px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 4px; text-transform: uppercase;
  }
  h2 .glyph { color: var(--prism); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .section-sub b { color: var(--ink); font-weight: 500; }

  /* ---- The six mirrors ---- */
  .mirror-box {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px 18px;
  }
  .pips { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 18px; }
  .pip {
    width: 46px; height: 46px; border-radius: 8px;
    border: 2px solid var(--prism-dim); background: var(--panel);
    color: var(--prism); font-size: 20px;
    display: flex; align-items: center; justify-content: center;
  }
  .pip.gone { border-color: var(--line); color: var(--line); background: transparent; }
  .halves { display: grid; grid-template-columns: repeat(2, minmax(240px, 1fr)); gap: 14px; }
  .half {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 16px 18px;
  }
  .half .who { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .half .num {
    font-family: var(--display); font-size: 34px; line-height: 1.2;
    color: var(--prism); font-variant-numeric: tabular-nums;
  }
  .half p { font-size: 12.5px; color: var(--muted); }
  .half p b { color: var(--ink); font-weight: 500; }
  .mirror-cap { font-size: 12px; color: var(--muted); margin-top: 16px; }
  .mirror-cap b { color: var(--prism); font-weight: 500; }

  /* ---- The shattering loop ---- */
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
  .loop-step b { color: var(--prism); font-weight: 500; }
  .loop-step i { color: var(--break); font-style: normal; font-weight: 500; }
  .loop-arrow { color: var(--prism-dim); font-size: 20px; }

  /* ---- Abilities ---- */
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability {
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px;
  }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--prism-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 400; font-size: 22px; letter-spacing: 2px; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--silver); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--prism); font-weight: 500; }
  .ability.passive-card { border-color: var(--prism-dim); }

  .dmg-table-box { margin-top: 22px; overflow-x: auto; background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; min-width: 620px; font-size: 13px; }
  th, td { padding: 9px 14px; text-align: right; font-variant-numeric: tabular-nums; }
  thead th { color: var(--muted); font-weight: 500; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid var(--line); }
  tbody th { text-align: left; font-weight: 500; color: var(--ink); white-space: nowrap; }
  tbody tr + tr td, tbody tr + tr th { border-top: 1px solid #1a1f2a; }
  td.max { color: var(--prism); font-weight: 600; }
  td.min { color: var(--break); }
  .table-cap { font-size: 12px; color: var(--muted); padding: 10px 14px 12px; }
  .table-cap b { color: var(--ink); font-weight: 500; }

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
  .acquire .v { font-family: var(--display); font-size: 22px; color: var(--silver); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--prism); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>5&#x2605; Water &middot; Cryst Sect &middot; No. 1</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle &middot; six mirrors</span>
      <img src="%%idle%%" alt="Aniani idle animation, an armoured woman ringed by six floating crystal mirrors" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 5</span></div>
      <h1>ANIANI</h1>
      <div class="title-line">Mirror Bulwark</div>
      <div class="badges">
        <span class="badge water">&#x1f4a7; Water</span>
        <span class="badge">Front-hex bulwark</span>
        <span class="badge">Scales off DEF</span>
        <span class="badge sect">Cryst Sect &middot; No. 1 &middot; the Mirror</span>
      </div>
      <p class="lede">Polarus rules the court; Aniani is the surface it
      sees itself in. She fights from the <b>front hex</b> behind six
      floating crystal mirrors, and those mirrors are her whole design:
      they are <b>her armour and her damage at once</b>. Every skill she
      owns is priced in <b>DEF, multiplied by how many mirrors are still
      intact</b> &#x2014; so the longer she goes unhit, the harder she
      hits back.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1875</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">86</div><div class="sub">unused &#x2014; nothing she casts reads it</div></div>
    <div class="stat def"><div class="k">DEF</div><div class="v">207</div><div class="sub">the stat every skill is priced in</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">96</div></div>
    <div class="stat"><div class="k">Crit</div><div class="v">15%</div><div class="sub">&#xd7;1.5 damage</div></div>
  </div>
  <div class="stats-note">Base values at level 1 &#x2014; stats scale with level and &#x2605; ascension like every hero.
    She is normalised to the same 520 power budget as the rest of the roster; the 5&#x2605; is the level ceiling, not extra stats.</div>

  <h2><span class="glyph">&#x25c6;</span> The Six Mirrors</h2>
  <div class="section-sub">She opens every battle with <b>six crystal mirrors</b> and can
    never hold more. They are not a shield in the usual sense &#x2014; they do not
    reduce the blow. They <b>answer</b> it, and then one of them is gone.</div>
  <div class="mirror-box">
    <div class="pips">
      <span class="pip">&#x25c6;</span><span class="pip">&#x25c6;</span><span class="pip">&#x25c6;</span>
      <span class="pip">&#x25c6;</span><span class="pip">&#x25c6;</span><span class="pip">&#x25c6;</span>
    </div>
    <div class="halves">
      <div class="half">
        <div class="who">On every hit she takes</div>
        <div class="num">&#x2212;1 mirror</div>
        <p>One mirror shatters per <b>hit</b>, not per point of damage. A
        chip from a row sweep costs her exactly as much glass as a
        boss's full swing &#x2014; so <b>many small hits strip her far
        faster</b> than one big one.</p>
      </div>
      <div class="half">
        <div class="who">What the shattering does</div>
        <div class="num">25% back</div>
        <p>The breaking mirror reflects <b>a quarter of the damage that
        got through</b> straight back at whoever landed it. The bounce is
        dealt without an attacker of its own, so mirrors can
        <b>never chain</b> off each other &#x2014; and the reflected damage is
        credited to her on the meter.</p>
      </div>
    </div>
    <div class="mirror-cap">The reflect is measured <b>after her mitigation and before her shields</b>:
      it is a cut of what actually reached her, not of what was aimed at her.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Glass Is the Damage</h2>
  <div class="section-sub">Here is the part that makes her more than a wall. Every one of her
    three skills adds a flat bonus <b>per mirror still floating</b>. At six she is a
    5&#x2605; damage dealer swinging her own DEF; at zero she is a tank with a stick.</div>
  <div class="dmg-table-box">
    <table>
      <thead>
        <tr><th style="text-align:left">Skill power, % of her DEF</th>
          <th>6&#x25c6;</th><th>5&#x25c6;</th><th>4&#x25c6;</th><th>3&#x25c6;</th>
          <th>2&#x25c6;</th><th>1&#x25c6;</th><th>0&#x25c6;</th></tr>
      </thead>
      <tbody>
        <tr><th>Mirror Lance <span style="color:var(--muted)">(60 + 30/mirror)</span></th>
          <td class="max">240</td><td>210</td><td>180</td><td>150</td><td>120</td><td>90</td><td class="min">60</td></tr>
        <tr><th>Prism Wave <span style="color:var(--muted)">(40 + 20/mirror)</span></th>
          <td class="max">160</td><td>140</td><td>120</td><td>100</td><td>80</td><td>60</td><td class="min">40</td></tr>
        <tr><th>Resonant Shatter <span style="color:var(--muted)">(70 + 40/mirror)</span></th>
          <td class="max">310</td><td>270</td><td>230</td><td>190</td><td>150</td><td>110</td><td class="min">70</td></tr>
      </tbody>
    </table>
    <div class="table-cap">At level 1 her DEF is <b>207</b>, so a full-mirror Mirror Lance swings
      <b>497</b> before the target's mitigation &#x2014; from a unit standing in the front rank.
      Prism Wave pays its number to <b>every enemy in a row</b>.</div>
  </div>

  <h2><span class="glyph">&#x21bb;</span> The Shattering Loop</h2>
  <div class="section-sub">Her mirrors run down as the fight goes on, and she has exactly two ways
    to put them back. Standing in the front hex is one of them, which is why that is where she belongs.</div>
  <div class="loop-box">
    <span class="loop-step">Six mirrors <b>&#x25c6;&#x25c6;&#x25c6;&#x25c6;&#x25c6;&#x25c6;</b></span>
    <span class="loop-arrow">&#x2192;</span>
    <span class="loop-step">she is struck &#x2014; <i>glass breaks</i>, 25% reflects</span>
    <span class="loop-arrow">&#x2192;</span>
    <span class="loop-step">her skills get <b>weaker</b></span>
    <span class="loop-arrow">&#x2192;</span>
    <span class="loop-step">front hex reforms <b>+1 each turn</b></span>
    <span class="loop-arrow">&#x2192;</span>
    <span class="loop-step">Resonant Shatter reforms <b>+2</b></span>
  </div>

  <h2><span class="glyph">&#x2726;</span> Kit</h2>
  <div class="section-sub">A lance, a row sweep, and the burst that spends the glass and then
    hands two pieces of it back. Every number below is a <b>percentage of her DEF</b>.</div>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; no cooldown</div>
      <h3>Mirror Lance</h3>
      <div class="meta">Single target &middot; <b>60% DEF</b> &middot; <b>+30% per mirror</b></div>
      <p>The mirrors swing forward and fire as one shaft of focused light.
      Her every-turn attack, and at full glass her <b>hardest single hit
      per turn</b> at 240% DEF.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; 3-turn cooldown</div>
      <h3>Prism Wave</h3>
      <div class="meta">Enemy row &middot; <b>40% DEF</b> &middot; <b>+20% per mirror</b></div>
      <p>The same light, split and spread across <b>an entire enemy
      row</b>. Lower per head than the Lance and worth far more against
      three of them.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; 5-turn cooldown</div>
      <h3>Resonant Shatter</h3>
      <div class="meta">Single target &middot; <b>70% DEF</b> &middot; <b>+40% per mirror</b> &middot; then <b>reform 2</b></div>
      <p>The mirrors converge and detonate against one enemy &#x2014;
      <b>310% DEF</b> at full glass, her largest number in the kit. Then
      the crystal <b>reforms two mirrors</b>, so the burst pays for part of
      its own upkeep rather than emptying her.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Crystal Aegis</h3>
      <p>Begins battle with <b>6 crystal mirrors</b>. Every hit she takes
      shatters one, reflecting <b>25% of that damage</b> back at the
      attacker. The mirrors are the passive; everything else in her kit
      is a way of spending or rebuilding them.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Position bonus &middot; front hex</div>
      <h3>Resonance</h3>
      <p>From the front rank she <b>reforms 1 crystal mirror at the start
      of every turn</b>. Off the front hex she has no way back up but
      Resonant Shatter &#x2014; which is why a back-row Aniani slowly stops
      being a threat.</p>
    </div>
  </div>

  <div class="dmg-table-box">
    <table>
      <thead>
        <tr><th style="text-align:left">Skill power by skill level, at six mirrors</th>
          <th>Lv 1</th><th>Lv 2</th><th>Lv 3</th><th>Lv 4</th><th>Lv 5</th></tr>
      </thead>
      <tbody>
        <tr><th>Mirror Lance, % DEF</th><td>240</td><td>264</td><td>288</td><td>312</td><td class="max">336</td></tr>
        <tr><th>Prism Wave, % DEF each</th><td>160</td><td>176</td><td>192</td><td>208</td><td class="max">224</td></tr>
        <tr><th>Resonant Shatter, % DEF</th><td>310</td><td>341</td><td>372</td><td>403</td><td class="max">434</td></tr>
      </tbody>
    </table>
    <div class="table-cap">Skill levels add +10% power per level (max Lv 5) &#x2014; raised in Improve by
      sacrificing another Aniani. The level multiplier applies to the <b>whole mirror-boosted
      number</b>, not just the flat part, so levelling her is worth most on a full set of glass.
      The 25% reflect, the six-mirror cap and the reforms are fixed.</div>
  </div>

  <h2><span class="glyph">&#x2746;</span> Standing in the Court</h2>
  <div class="section-sub">She is the second name on the Cryst roster and the sect's only
    mirror. The <b>Cryst sect pack</b> opens a battle with a free freeze attempt and adds a flat
    bonus to every freeze roll the team makes &#x2014; Aniani lands none of them herself, but she is
    a body that holds the front while Polarus and Angelica do.</div>

  <h2><span class="glyph">&#x2726;</span> Animations</h2>
  <div class="section-sub">Hand-drawn 256px strips. The engine keeps a full sheet <b>per mirror
    count</b>, so the glass you see floating around her is the glass she actually has
    &#x2014; the sheet swaps the moment one breaks.</div>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle animation at six mirrors"><div class="cap"><b>Idle &middot; 6&#x25c6;</b></div><div class="note">the full set, turning slowly</div></div>
    <div class="clip"><img src="%%idle3%%" alt="Idle animation at three mirrors"><div class="cap"><b>Idle &middot; 3&#x25c6;</b></div><div class="note">half the glass gone</div></div>
    <div class="clip"><img src="%%idle0%%" alt="Idle animation with no mirrors"><div class="cap"><b>Idle &middot; 0&#x25c6;</b></div><div class="note">stripped bare &#x2014; minimum damage</div></div>
    <div class="clip"><img src="%%ready%%" alt="Ready stance animation"><div class="cap"><b>Ready</b></div><div class="note">her turn comes up</div></div>
    <div class="clip"><img src="%%lance%%" alt="Mirror Lance animation"><div class="cap"><b>Lance &amp; Wave</b></div><div class="note">skills 1 and 2 share the strip; hits on frame 8</div></div>
    <div class="clip"><img src="%%shatter%%" alt="Resonant Shatter animation"><div class="cap"><b>Resonant Shatter</b></div><div class="note">the mirrors converge and blow</div></div>
    <div class="clip"><img src="%%death%%" alt="Death animation"><div class="cap"><b>Death</b></div><div class="note">twenty-four frames, the longest on the roster</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Idle Fidget I</b></div><div class="note">full-mirror art only; every 8&#x2013;16s</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Idle Fidget II</b></div><div class="note">full-mirror art only; every 8&#x2013;16s</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Rare Summon Scroll &#x1f4dc;</div><div class="v">5&#x2605; band &middot; 2%</div></div>
    <div style="flex:1 1 300px"><div class="k">Where she comes from</div>
      <div style="font-size:13px;color:var(--muted)">Water heroes summon from Common and Rare Scrolls
      &#x2014; the 5&#x2605; band lives on the Rare Scroll only. Pity guarantees a
      5&#x2605; by the 40th pull.</div></div>
  </div>

  <div class="foot">Play her now at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a> &middot; Cryst Sect No. 1 &#x2014; Polarus holds the throne, Aniani holds the front.</div>
</div>
'''

for k, v in IMG.items():
    html = html.replace(f'%%{k}%%', v)

# Emit pure ASCII. A published artifact is wrapped in a <head> this file
# does not control, so it cannot declare its own charset; escaping means
# the glyphs never depend on one being supplied.
html = ''.join(c if ord(c) < 128 else f'&#x{ord(c):x};' for c in html)

out = '/home/user/browsergacha/docs/echo-sheet.html'
with open(out, 'w') as f:
    f.write(html)
print(out, os.path.getsize(out) // 1024, 'KB')
