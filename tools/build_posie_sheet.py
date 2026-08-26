import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Posie'
PANEL = (16, 22, 9, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('posieidle.png',   7, 'idle'),
    ('posieidle1.png',  6, 'fidget1'),
    ('posieidle2.png',  7, 'fidget2'),
    ('posieskill1.png', 10, 'bloom'),
    ('posieskill2.png', 10, 'windfall'),
    ('posieskill3.png',  8, 'summer'),
    ('posiedeath.png',   8, 'death'),
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

html = r'''<title>Posie, Boughbearer of the Whisperchime</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amaranth:ital,wght@0,700;1,700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: the orchard at dusk. Deep
     leaf-shadow under blossom cream and pollen gold, set in Amaranth's
     soft italic serif. Every color painted explicitly. */
  :root {
    --ground: #0f1409;
    --panel: #101609;
    --panel-2: #1a2212;
    --line: #3c4a24;
    --ink: #f4f0dc;
    --muted: #9aa87e;
    --leaf: #f2e08a;
    --vellum: #fbf6df;
    --leaf-dim: #6f7a3a;
    --display: 'Amaranth', 'Georgia', serif;
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
    background: radial-gradient(ellipse 62% 46% at 50% 62%, rgba(242,224,138,.14), transparent 70%), var(--panel);
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
    text-shadow: 0 4px 0 rgba(0,0,0,.5), 0 0 34px rgba(242,224,138,.26); }
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
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>5&#x2605; Wind &middot; Whisperchime &middot; No. 7</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Posie idle animation, a small figure in leaf and cream carrying a flowering bough taller than herself" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 5</span></div>
      <h1>POSIE</h1>
      <div class="title-line">Boughbearer of the Whisperchime</div>
      <div class="badges">
        <span class="badge light">Wind</span>
        <span class="badge">Back-line Support</span>
        <span class="badge">Healing &middot; Chain &middot; Ward</span>
        <span class="badge sect">Whisperchime &middot; No. 7</span>
      </div>
      <p class="lede">She carries a bough taller than she is, and it does
      not stop where she points it. Two of her heals are measured off
      <b>her own pool</b> &#x2014; every point of HP she is given feeds the
      whole party &#x2014; and the third is measured off <b>the patient's</b>,
      so it lands hardest on whoever has the most to lose. What spills
      past full does not spill: it <b>sets as a shield</b>.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1695</div><div class="sub">her pool IS the heal</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">87</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">108</div></div>
    <div class="stat spd"><div class="k">SPD</div><div class="v">112</div></div>
  </div>

  <h2><span class="glyph">&#x273F;</span> The bough</h2>
  <p class="section-sub">A back-line healer built around one unusual
  sentence: her signature skill re-casts <i>itself</i> on whoever is worst
  off, at even odds, for as long as the rolls keep coming.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Pour.</b> Bloom and High Summer heal for a
      share of <b>Posie's</b> max HP &#x2014; building her HP builds every
      heal she casts.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Swing.</b> Windfall heals for a share of
      the <b>patient's</b> pool, then rolls <b>50%</b> to jump to the
      lowest ally and do it again.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Set.</b> Overflow past full becomes a
      <b>2-turn shield</b>, so a chain that lands on a healthy party is
      never wasted.</div>
  </div>

  <h2><span class="glyph">&#x273F;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Bloom</h3>
      <div class="meta">Single ally &middot; <b>20% of POSIE's max HP</b></div>
      <p>Tip the bough over one ally: heals them for <b>20% of Posie's own
      max HP</b>.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 3</div>
      <h3>Windfall</h3>
      <div class="meta">Single ally &middot; <b>20% of THEIR max HP &middot; 50% to swing on</b></div>
      <p>Heal one ally for <b>20% of their own max HP</b> &#x2014; then a
      <b>50% chance</b> to swing on to the <b>lowest-HP ally</b> and heal
      again, over and over while the rolls hold. Each jump re-picks, so
      the bough follows the wounded down the line.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 5</div>
      <h3>High Summer</h3>
      <div class="meta">All allies &middot; <b>25% of POSIE's max HP &middot; +30% RES, 2 turns</b></div>
      <p>The whole bough opens at once: heal <b>every ally</b> for <b>25%
      of Posie's max HP</b> and raise their <b>Resistance by 30% for 2
      turns</b> &#x2014; the stat that refuses debuffs, buff-stripping and
      AP drain alike.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Nothing Falls Far</h3>
      <div class="meta">On healing past full</div>
      <p>Overflow is not spilled: it settles on that ally as a <b>shield
      for 2 turns</b>. A chain that reaches a full-health party still
      leaves something behind.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Back hex</div>
      <h3>Bough Bearer</h3>
      <div class="meta">Back row &middot; <b>+15% chain chance</b></div>
      <p>Standing back, the bough finds its own way onward: <b>+15%</b> for
      a healing chain to swing again &#x2014; 50% becomes <b>65%</b>, and
      the average run gets meaningfully longer.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x273F;</span> How long the swing runs</h2>
  <p class="section-sub">Each link is an independent coin flip, so the
  chain has no fixed length &#x2014; only odds. From the back hex those odds
  are 65%.</p>
  <div class="engine-box">
    <div class="engine-step"><b>50%</b> base &#x2014; the average cast heals
      <b>2 times</b>, and one run in eight reaches four.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>65%</b> from the back hex &#x2014; the
      average cast heals nearly <b>3 times</b>.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>12 links</b> is the safety rail, not a
      design limit: reaching it is about one run in four thousand.</div>
  </div>

  <h2><span class="glyph">&#x273F;</span> Frames</h2>
  <p class="section-sub">Seven strips: a breathing idle with two fidgets,
  a pour for each skill, and a fall.</p>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">The bough, shouldered.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">Shifting the weight.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">Petals settling.</div></div>
    <div class="clip"><img src="%%bloom%%" alt="Bloom"><div class="cap"><b>Bloom</b> &middot; %%nf_bloom%%f</div><div class="note">Tip it over, once.</div></div>
    <div class="clip"><img src="%%windfall%%" alt="Windfall"><div class="cap"><b>Windfall</b> &middot; %%nf_windfall%%f</div><div class="note">The swing that keeps going.</div></div>
    <div class="clip"><img src="%%summer%%" alt="High Summer"><div class="cap"><b>High Summer</b> &middot; %%nf_summer%%f</div><div class="note">The whole bough at once.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">Set down.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Wind</div></div>
    <div><div class="k">Rarity</div><div class="v">5&#x2605;</div></div>
    <div><div class="k">Role</div><div class="v">Back-line Support</div></div>
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

out = '/home/user/browsergacha/docs/posie-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
