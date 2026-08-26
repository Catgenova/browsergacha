import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Tumble'
PANEL = (13, 20, 17, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

# He has two strips and no more. The idle file ships as 'tumbeidle.png'.
STRIPS = [
    ('tumbeidle.png',    10, 'idle'),
    ('tumbledeath.png',  10, 'death'),
]

def clip(fname, fps):
    im = Image.open(f'{SRC}/{fname}').convert('RGBA')
    w, h = im.size
    frames = max(1, round(w / h))
    fw = w // frames
    cells = []
    for i in range(frames):
        # Drawn unmirrored: he spins facing the viewer, so there is no
        # authored side to correct.
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

html = r'''<title>Tumble, Whirling Dervish of the Whisperchime</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Righteous&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: the open air. Night-green ground
     under leaf green and bleached wood, set in Righteous' leaning
     display face. Every color painted explicitly. */
  :root {
    --ground: #0c1210;
    --panel: #0d1411;
    --panel-2: #142018;
    --line: #2f4a34;
    --ink: #eaf2e4;
    --muted: #8fa892;
    --leaf: #8fe06a;
    --vellum: #e6d9b4;
    --leaf-dim: #4e7a3e;
    --display: 'Righteous', 'Georgia', sans-serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink);
    font-family: var(--mono); font-size: 15px; line-height: 1.65; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }
  .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px; }
  .eyebrow b { color: var(--leaf); font-weight: 500; }
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art { flex: 0 0 300px; position: relative;
    background: radial-gradient(ellipse 62% 46% at 50% 62%, rgba(143,224,106,.13), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--leaf-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--leaf); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 400; font-size: 62px; line-height: 1.05;
    color: var(--ink); text-wrap: balance; letter-spacing: 2px;
    text-shadow: 0 4px 0 rgba(0,0,0,.5), 0 0 34px rgba(143,224,106,.28); }
  .title-line { font-size: 15px; color: var(--leaf); letter-spacing: 2px;
    font-family: var(--display); }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.light { border-color: var(--leaf-dim); color: var(--leaf); }
  .badge.sect { border-color: var(--vellum); color: var(--vellum); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-size: 22px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.35; }
  .stat.spd .v { color: var(--leaf); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  h2 { font-family: var(--display); font-weight: 400; font-size: 24px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 1px; }
  h2 .glyph { color: var(--leaf); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .engine-box { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    justify-content: center; font-size: 13px; color: var(--muted); text-align: center; }
  .engine-step { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 250px; }
  .engine-step b { color: var(--leaf); font-weight: 500; }
  .engine-arrow { color: var(--leaf-dim); font-size: 20px; }
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--leaf-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 400; font-size: 18px; letter-spacing: 1px; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--vellum); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--leaf); font-weight: 500; }
  .ability.passive-card { border-color: var(--leaf-dim); }
  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }
  .acquire { margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap; align-items: baseline; }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-size: 16px; color: var(--leaf); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--leaf); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>4&#x2605; Wind &middot; Whisperchime &middot; No. 7</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle &middot; the spin</span>
      <img src="%%idle%%" alt="Tumble idle animation, a bearded dervish spinning in a skirt of leaves and wood slats, wind and petals trailing" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 4</span></div>
      <h1>TUMBLE</h1>
      <div class="title-line">Whirling Dervish of the Whisperchime</div>
      <div class="badges">
        <span class="badge light">Wind</span>
        <span class="badge">Center Support</span>
        <span class="badge">Strip &middot; Tempo &middot; Control</span>
        <span class="badge sect">Whisperchime &middot; No. 7</span>
      </div>
      <p class="lede">He owns <b>two poses</b>: a spin and a fall. Every
      skill he throws is the same whirl at a different distance, and what
      the whirl does is <b>take things away</b> &#x2014; blessings off the
      front rank, then the ground itself. His finisher <b>turns the whole
      enemy formation one hex clockwise</b>, so their wall ends up in the
      back and their casters land on the front line.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1360</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">101</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">93</div></div>
    <div class="stat spd"><div class="k">SPD</div><div class="v">118</div><div class="sub">never stops moving</div></div>
  </div>

  <h2><span class="glyph">&#x21bb;</span> The whirl</h2>
  <p class="section-sub">A center-hex support who wins by disarrangement:
  he strips the enemy's buffs, gets paid in turn meter for every one he
  takes, hands the party his own tempo, and then rearranges the field
  itself so nobody is standing where their kit wants them.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Strip.</b> Passing Whirl hits the front
      row and rolls <b>50% per target</b> to tear a blessing away.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Get paid.</b> Chime Tax returns <b>10
      turn meter</b> for every blessing torn &#x2014; a buffed front row
      spins him back around fast.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Turn the floor.</b> Carousel sweeps both
      outer rows and <b>rotates the enemy team one hex clockwise</b>.</div>
  </div>

  <h2><span class="glyph">&#x21bb;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Passing Whirl</h3>
      <div class="meta">Enemy front row &middot; <b>50% ATK each &middot; 50% strip</b></div>
      <p>Whirl through the enemy front row for <b>50% ATK</b> each, with a
      <b>50% chance</b> to tear <b>one blessing</b> off each of them.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 3</div>
      <h3>Quickstep</h3>
      <div class="meta">All allies &middot; <b>+30% Speed, 2 turns</b></div>
      <p>The whole troupe picks up his tempo: <b>+30% Speed</b> to every
      ally for <b>2 turns</b>, himself included.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 5</div>
      <h3>Carousel</h3>
      <div class="meta">Enemy front &amp; back rows &middot; <b>50% ATK &middot; rotate 1 hex</b></div>
      <p>A spin wide enough to catch <b>both outer rows</b> for <b>50%
      ATK</b>, and the whole enemy formation <b>turns one hex
      clockwise</b> around its middle. The center hex is the pivot and
      never moves; everyone else changes rank.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Chime Tax</h3>
      <div class="meta">On every blessing stripped</div>
      <p>Each buff Tumble tears away pays him <b>10 turn meter</b>. Three
      stripped in one whirl is <b>30 meter</b> back &#x2014; the more the
      enemy buffs, the faster he comes around again.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Center hex</div>
      <h3>Eye of the Ring</h3>
      <div class="meta">Center &middot; <b>+35% debuff Accuracy</b></div>
      <p>Standing in the middle of the ring, <b>+35% Accuracy</b> &#x2014;
      the strips land through resistance that would shrug them off
      anywhere else.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x21bb;</span> What the carousel costs</h2>
  <p class="section-sub">Rotation is not damage; it is displacement. Every
  positional bonus on the enemy side is recomputed from where they land,
  and a formation built around who stands where comes apart a hex at a
  time.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Front &#x2192; back.</b> Their bruisers
      spin off the front line and stop soaking.</div>
    <div class="engine-arrow">&#x21bb;</div>
    <div class="engine-step"><b>Back &#x2192; front.</b> Their casters
      arrive on the front rank, in reach of everything.</div>
    <div class="engine-arrow">&#x21bb;</div>
    <div class="engine-step"><b>Center holds.</b> Whoever holds the middle
      is the pivot &#x2014; the one hex the spin never touches.</div>
  </div>

  <h2><span class="glyph">&#x21bb;</span> Every frame he has</h2>
  <p class="section-sub">Two strips, and only two. The spin does duty for
  every action in the kit &#x2014; skill one, skill two and skill three are
  the same revolution at different speeds &#x2014; so as long as he is
  alive, he is spinning.</p>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle spin"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">The spin. Also skills 1, 2 and 3.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">The only time he stops.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Wind</div></div>
    <div><div class="k">Rarity</div><div class="v">4&#x2605;</div></div>
    <div><div class="k">Role</div><div class="v">Center Support</div></div>
    <div><div class="k">Sect</div><div class="v">Whisperchime &middot; No. 7</div></div>
  </div>

  <p class="foot">Sheet drawn from the live hero definition
  (js/data/heroes/humans.js) and the uploaded spritesheets, untouched.
  Play at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a>.</p>
</div>
'''

for name, uri in IMG.items():
    html = html.replace(f'%%{name}%%', uri)
    html = html.replace(f'%%nf_{name}%%', str(NF[name]))

out = '/home/user/browsergacha/docs/tumble-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
