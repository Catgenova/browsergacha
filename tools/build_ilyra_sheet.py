import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Ilyra'
PANEL = (16, 21, 11, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('ilyraidle.png',   7, 'idle'),
    ('ilyraidle1.png',  6, 'fidget1'),
    ('ilyraidle2.png',  7, 'fidget2'),
    ('ilyraskill1.png', 10, 'clear'),
    ('ilyraskill2.png', 10, 'following'),
    ('ilyraskill3.png', 10, 'changing'),
    ('ilyradeath.png',   8, 'death'),
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

html = r'''<title>Ilyra, Windward of the Whisperchime</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gloock&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: a hedgerow at first light. Deep
     olive shade under linen cream and foxglove pink, set in Gloock's
     high-contrast serif. Every color painted explicitly. */
  :root {
    --ground: #0e1209;
    --panel: #10150b;
    --panel-2: #1a2113;
    --line: #3b4a26;
    --ink: #f4f1e6;
    --muted: #9aa886;
    --leaf: #e8a8d0;
    --vellum: #f2ede0;
    --leaf-dim: #7a5a6a;
    --display: 'Gloock', 'Georgia', serif;
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
    background: radial-gradient(ellipse 62% 46% at 50% 62%, rgba(232,168,208,.13), transparent 70%), var(--panel);
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
    text-shadow: 0 4px 0 rgba(0,0,0,.5), 0 0 34px rgba(232,168,208,.26); }
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
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>3&#x2605; Wind &middot; Whisperchime &middot; No. 7</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Ilyra idle animation, a healer in olive and linen robes holding a vine staff hung with pink bell flowers" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 3</span></div>
      <h1>ILYRA</h1>
      <div class="title-line">Windward of the Whisperchime</div>
      <div class="badges">
        <span class="badge light">Wind</span>
        <span class="badge">Back-line Support</span>
        <span class="badge">Cleanse &middot; Heal &middot; Tempo</span>
        <span class="badge sect">Whisperchime &middot; No. 7</span>
      </div>
      <p class="lede">The question with Ilyra is never <i>what</i> she does
      &#x2014; every skill she has heals off <b>her own pool</b> and lifts
      <b>one curse</b> &#x2014; only <b>how many people</b> she does it to.
      And the enemy pays for it: every hex laid on her side hands her
      <b>10 turn meter</b>, so a team that leans on debuffs is winding her
      up to undo them.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1900</div><div class="sub">her pool IS the heal</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">105</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">135</div></div>
    <div class="stat spd"><div class="k">SPD</div><div class="v">110</div></div>
  </div>

  <h2><span class="glyph">&#x273F;</span> One mercy, three widths</h2>
  <p class="section-sub">Her whole kit is the same sentence at a widening
  scope, and the narrower the reach the bigger the number.</p>
  <div class="engine-box">
    <div class="engine-step"><b>One ally &#x2014; 15%.</b> No cooldown, so
      the cleanse is always available to somebody.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>The front row &#x2014; 20%.</b> The biggest
      number, aimed where the hexes land.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Everyone &#x2014; 15%.</b> A curse off every
      single ally at once.</div>
  </div>

  <h2><span class="glyph">&#x273F;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Clear Sky</h3>
      <div class="meta">Single ally &middot; <b>15% of ILYRA's max HP &middot; cleanse 1</b></div>
      <p>One ally is aired out: heals for <b>15% of Ilyra's own max HP</b>
      and lifts <b>one debuff</b>.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 3</div>
      <h3>Following Wind</h3>
      <div class="meta">Front row &middot; <b>20% of ILYRA's max HP &middot; cleanse 1 each</b></div>
      <p>The front rank gets the weather at its back: heals the
      <b>FRONT row</b> for <b>20% of Ilyra's max HP</b> each and lifts
      <b>one debuff</b> from each.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 5</div>
      <h3>Changing Weather</h3>
      <div class="meta">All allies &middot; <b>15% of ILYRA's max HP &middot; cleanse 1 each</b></div>
      <p>The whole field turns over: heals <b>every ally</b> for <b>15% of
      Ilyra's max HP</b> and lifts <b>one debuff</b> from each.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Kindly Hours</h3>
      <div class="meta">Whenever her side is cursed</div>
      <p>Every debuff laid on her team hands Ilyra <b>10 turn meter</b>
      &#x2014; poisons and burns included, and her own misfortune counts.
      The more the enemy hexes, the sooner she answers.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Back hex</div>
      <h3>Still Air</h3>
      <div class="meta">Back row &middot; <b>+30% Resistance</b></div>
      <p>Standing back, the wind bends around her: <b>+30% Resistance</b>
      &#x2014; which now refuses <b>debuffs, buff-stripping and AP drain
      alike</b>, since every taking rolls against it.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x273F;</span> Against a debuff team</h2>
  <p class="section-sub">Most healers are worse the more the enemy
  controls. Ilyra is the opposite: the enemy's own hexes are her tempo.</p>
  <div class="engine-box">
    <div class="engine-step"><b>They curse.</b> Every hex on her side is
      <b>+10 meter</b> to her, stacking with no cap per turn.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>She answers sooner.</b> Ten hexes across a
      long fight is a whole extra turn of cleansing.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>She is hard to hex herself.</b> +30%
      Resistance from the back hex, on top of the 15% floor everything
      already has to clear.</div>
  </div>

  <h2><span class="glyph">&#x273F;</span> Frames</h2>
  <p class="section-sub">Seven strips, nine frames each: a breathing idle
  with two fidgets, a cast for every skill, and a fall.</p>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">The staff, and the bells.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">Weight shifting.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">Listening to the air.</div></div>
    <div class="clip"><img src="%%clear%%" alt="Clear Sky"><div class="cap"><b>Clear Sky</b> &middot; %%nf_clear%%f</div><div class="note">A ring of light, one hand.</div></div>
    <div class="clip"><img src="%%following%%" alt="Following Wind"><div class="cap"><b>Following Wind</b> &middot; %%nf_following%%f</div><div class="note">Pushed to the front rank.</div></div>
    <div class="clip"><img src="%%changing%%" alt="Changing Weather"><div class="cap"><b>Changing Weather</b> &middot; %%nf_changing%%f</div><div class="note">The whole field turns.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">The bells go quiet.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Wind</div></div>
    <div><div class="k">Rarity</div><div class="v">3&#x2605;</div></div>
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

out = '/home/user/browsergacha/docs/ilyra-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
