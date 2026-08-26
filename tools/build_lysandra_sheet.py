import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Lysandra'
PANEL = (26, 18, 30, 255)   # --panel-2, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('lysandraidle.png',   7, 'idle'),
    ('lysandraidle1.png',  6, 'fidget1'),
    ('lysandraidle2.png',  7, 'fidget2'),
    ('lysandraskill1.png', 11, 'stitch'),
    ('lysandraskill2.png', 11, 'knot'),
    ('lysandraskill3.png', 11, 'bond'),
    ('lysandradeath.png',  10, 'death'),
]

def clip(fname, fps):
    im = Image.open(f'{SRC}/{fname}').convert('RGBA')
    w, h = im.size
    frames = max(1, round(w / h))
    fw = w // frames
    cells = []
    for i in range(frames):
        # Authored facing right; drawn as delivered.
        cell = im.crop((i * fw, 0, (i + 1) * fw, h))
        bg = Image.new('RGBA', cell.size, PANEL)
        bg.alpha_composite(cell)
        cells.append(bg.convert('RGB').resize((SIZE, SIZE), Image.NEAREST))
    buf = io.BytesIO()
    cells[0].save(buf, format='GIF', save_all=True, append_images=cells[1:],
                  duration=int(1000 / fps), loop=0, optimize=True)
    return 'data:image/gif;base64,' + base64.b64encode(buf.getvalue()).decode(), frames

IMG, NF = {}, {}
for f, fps, name in STRIPS:
    IMG[name], NF[name] = clip(f, fps)

html = r'''<title>Lysandra, Needleworker of the Nightflowers</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gelasio:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: a sewing room at midnight. Plum-
     black ground, bone-white for her, and one thread of hot pink --
     the exact color the battle log floats when the bond pulls -- for
     everything that IS the thread. Gelasio for the display: a plain,
     sturdy book serif, because she is a working craftsman and not a
     mystic. Every color painted explicitly. */
  :root {
    --ground: #0d090f;
    --panel: #120d15;
    --panel-2: #1a121e;
    --line: #3d2c44;
    --ink: #f2ecf2;
    --muted: #a08fa6;
    --thread: #e05a9a;
    --thread-dim: #7a3357;
    --bone: #ece4ea;
    --display: 'Gelasio', 'Georgia', serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink);
    font-family: var(--mono); font-size: 15px; line-height: 1.65; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }
  .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px; }
  .eyebrow b { color: var(--thread); font-weight: 500; }
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art { flex: 0 0 300px; position: relative;
    background: radial-gradient(ellipse 62% 46% at 50% 62%, rgba(224,90,154,.13), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--thread-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--thread); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 600; font-size: 66px; line-height: 1.04;
    color: var(--ink); text-wrap: balance; letter-spacing: 0;
    text-shadow: 0 4px 0 rgba(0,0,0,.55), 0 0 34px rgba(224,90,154,.20); }
  .title-line { font-size: 15px; color: var(--thread); letter-spacing: 2px;
    font-family: var(--display); font-style: italic; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.light { border-color: var(--thread-dim); color: var(--thread); }
  .badge.sect { border-color: var(--bone); color: var(--bone); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-weight: 600; font-size: 24px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.35; }
  .stat.def .v { color: var(--thread); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  h2 { font-family: var(--display); font-weight: 400; font-size: 26px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 0; }
  h2 .glyph { color: var(--thread); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .engine-box { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    justify-content: center; font-size: 13px; color: var(--muted); text-align: center; }
  .engine-step { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 250px; }
  .engine-step b { color: var(--thread); font-weight: 500; }
  .engine-arrow { color: var(--thread-dim); font-size: 20px; }
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--thread-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 600; font-size: 19px; letter-spacing: 0; }
  .ability .ladder { margin-top: 10px; padding-top: 9px;
    border-top: 1px solid var(--line); font-family: var(--mono);
    font-size: 11px; line-height: 1.7; color: var(--muted); }
  .ability .ladder b { color: var(--ink); font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase; font-size: 10px; }
  .ability .ladder i { font-style: normal; color: var(--ink); }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--bone); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--thread); font-weight: 500; }
  .ability.passive-card { border-color: var(--thread-dim); }

  /* What the thread does and does not stop for. */
  .rules { background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; overflow-x: auto; }
  .rules table { width: 100%; border-collapse: collapse; min-width: 500px; }
  .rules th, .rules td { text-align: left; padding: 12px 18px;
    border-bottom: 1px solid var(--line); font-size: 13px; }
  .rules thead th { font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
    color: var(--muted); font-weight: 400; background: var(--panel); }
  .rules tbody tr:last-child td { border-bottom: none; }
  .rules td.yes { color: var(--thread); font-weight: 500; }
  .rules td.no { color: var(--muted); }

  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }
  .acquire { margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap; align-items: baseline; }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-weight: 600; font-size: 16px; color: var(--thread); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--thread); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>4&#x2605; Dark &middot; Nightflower &middot; No. 6</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Lysandra idle animation, a robed figure holding a great needle across a spool on her arm" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 4</span></div>
      <h1>LYSANDRA</h1>
      <div class="title-line">Needleworker of the Nightflowers</div>
      <div class="badges">
        <span class="badge light">Dark</span>
        <span class="badge">Front-line DPS</span>
        <span class="badge">Bond &middot; Taunt</span>
        <span class="badge sect">Nightflower &middot; No. 6</span>
      </div>
      <p class="lede">Not a spear &#x2014; a <b>needle</b>, and the disc on
      her arm is a <b>spool</b>. Her damage is not really hers: she runs a
      thread through one enemy, drags the rest of their line onto her, and
      lets them <b>kill their own carry by hitting her</b>. Every point in
      her statline is there to keep her standing while that happens.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1310</div><div class="sub">the anvil, not the hammer</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">121</div></div>
    <div class="stat def"><div class="k">DEF</div><div class="v">107</div><div class="sub">+30% on a front hex</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">108</div></div>
  </div>

  <h2><span class="glyph">&#x2740;</span> Her damage is their damage</h2>
  <p class="section-sub">Every other carry in the game asks how hard it
  can hit. Lysandra asks how hard the enemy can hit <em>her</em> &#x2014;
  and then charges it to whoever is on the other end of the thread.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Soul Bond</b> ties one enemy. Everything
      she takes from here on, they take too.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Slip Knot</b> taunts their whole front
      row onto her needle for a turn.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Their own line kills their carry</b>,
      and every blow is credited to her.</div>
  </div>

  <h2><span class="glyph">&#x2740;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Running Stitch</h3>
      <div class="meta">Single enemy &middot; <b>130% ATK &middot; mends 20% of it</b></div>
      <p>One clean stitch: <b>130% ATK</b>, and Lysandra <b>mends for 20%
      of what it cost them</b>. Sustain, because her whole plan is to
      stand there and take it.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +5% heal <i>&middot; max Lv 6</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 4 &rarr; 2 fully levelled</div>
      <h3>Slip Knot</h3>
      <div class="meta">Enemy front row &middot; <b>110% ATK &middot; taunt, 1 turn</b></div>
      <p>A loop thrown over the whole line: <b>110% ATK</b> to the enemy
      front row, and a <b>50% chance each</b> to be
      <b>taunted onto her needle</b>.
      This is the setup &#x2014; every swing they answer with lands on the
      bond as well.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +20% land chance &rsaquo; +20% land chance &rsaquo; +10% land chance &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 7</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 6 &rarr; 4 fully levelled &middot; One at a time</div>
      <h3>Soul Bond</h3>
      <div class="meta">Single enemy &middot; <b>160% ATK &middot; the thread</b></div>
      <p><b>160% ATK</b> and a thread run through them. While it holds,
      <b>every point of damage Lysandra takes is dealt to them as well,
      unmitigated</b>. She cannot throw a second thread until that one is
      <b>dead or cut</b> &#x2014; and the cooldown is up.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 8</i></div>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Pull It Taut</h3>
      <div class="meta">While a bond of hers holds</div>
      <p>Committed while the thread is tied: <b>+25% ATK and +25% DEF</b>
      for as long as a Soul Bond of hers is still on something living. Cut
      the thread and she loses the stance with it.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Front hex</div>
      <h3>Spool</h3>
      <div class="meta">Front &middot; <b>+30% DEF</b></div>
      <p>The thread only holds if the anvil holding it does:
      <b>+30% DEF</b> on a front hex, stacking with her stance into a
      carry that genuinely does not fall over.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x2740;</span> What the thread pays for</h2>
  <p class="section-sub">Soul Bond is deliberately literal: whatever
  lands on her lands on them, at full size, with no second roll. These
  are the edges worth knowing.</p>
  <div class="rules">
    <table>
      <thead>
        <tr><th>Damage to Lysandra</th><th>Does the bond pay?</th><th>Why</th></tr>
      </thead>
      <tbody>
        <tr><td>An ordinary hit</td><td class="yes">Yes, in full</td><td>No DEF curve on their end, no dodge roll</td></tr>
        <tr><td>Poison ticking on her</td><td class="yes">Yes</td><td>All damage counts, not just attacks</td></tr>
        <tr><td>A hit her shield eats</td><td class="yes">Yes</td><td>A shield is her business, not theirs</td></tr>
        <tr><td>Their own reflect coming back</td><td class="no">Once, then it stops</td><td>The ring is guarded &#x2014; no infinite loop</td></tr>
        <tr><td>Damage to a teammate</td><td class="no">No</td><td>The thread runs through her alone</td></tr>
      </tbody>
    </table>
  </div>

  <h2><span class="glyph">&#x2740;</span> Frames</h2>
  <p class="section-sub">Seven strips, nine frames each &#x2014; except a
  <b>seventeen-frame death</b>, the longest in the roster. Watch the
  thread rather than the needle: skill two draws a loop and pulls it into
  a knot, and skill three ties it off.</p>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">Needle across the spool.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">Checking the tension.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">A charm resettling.</div></div>
    <div class="clip"><img src="%%stitch%%" alt="Running Stitch"><div class="cap"><b>Running Stitch</b> &middot; %%nf_stitch%%f</div><div class="note">Skill 1 &#x2014; in, and out.</div></div>
    <div class="clip"><img src="%%knot%%" alt="Slip Knot"><div class="cap"><b>Slip Knot</b> &middot; %%nf_knot%%f</div><div class="note">Skill 2 &#x2014; the loop, and the pull.</div></div>
    <div class="clip"><img src="%%bond%%" alt="Soul Bond"><div class="cap"><b>Soul Bond</b> &middot; %%nf_bond%%f</div><div class="note">Skill 3 &#x2014; tied off.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">Seventeen frames. She takes her time.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Dark</div></div>
    <div><div class="k">Rarity</div><div class="v">4&#x2605;</div></div>
    <div><div class="k">Role</div><div class="v">Front-line DPS</div></div>
    <div><div class="k">Sect</div><div class="v">Nightflower &middot; No. 6</div></div>
  </div>

  <p class="foot">Sheet drawn from the live hero definition
  (js/data/heroes/humans.js) and the uploaded spritesheets, untouched.
  Play at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a>.</p>
</div>
'''

for name, uri in IMG.items():
    html = html.replace(f'%%{name}%%', uri)
    html = html.replace(f'%%nf_{name}%%', str(NF[name]))

out = '/home/user/browsergacha/docs/lysandra-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
