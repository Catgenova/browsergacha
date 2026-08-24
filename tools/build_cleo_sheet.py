import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Cleo'
PANEL = (18, 11, 20, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('cleoidle.png',    7, 'idle'),
    ('cleoidle1.png',   6, 'fidget1'),
    ('cleoidle2.png',   7, 'fidget2'),
    ('cleoskill1.png', 10, 'kind'),
    ('cleoskill2.png', 10, 'twin'),
    ('cleoskill3.png', 10, 'reversed'),
    ('cleodeath.png',   8, 'death'),
]

def clip(fname, fps):
    im = Image.open(f'{SRC}/{fname}').convert('RGBA')
    w, h = im.size
    frames = max(1, round(w / h))
    fw = w // frames
    cells = []
    for i in range(frames):
        # Authored facing RIGHT already — no mirroring needed to match
        # the board's facing-right convention.
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

html = r'''<title>Cleo, Fortune Teller of the Firetroupe</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: the reading tent. Incense-dark plum,
     crystal-ball gold and shawl crimson, set in Cinzel Decorative's
     ornamented capitals. Every color painted explicitly. */
  :root {
    --ground: #110a13;
    --panel: #120b14;
    --panel-2: #1c121e;
    --line: #44304a;
    --ink: #f2e9e2;
    --muted: #a08ba4;
    --gold: #ffc95a;
    --shawl: #e8484a;
    --gold-dim: #7a5f2e;
    --display: 'Cinzel Decorative', 'Georgia', serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink);
    font-family: var(--mono); font-size: 15px; line-height: 1.65; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }
  .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px; }
  .eyebrow b { color: var(--gold); font-weight: 500; }
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art { flex: 0 0 300px; position: relative;
    background: radial-gradient(ellipse 62% 46% at 50% 62%, rgba(255,201,90,.13), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--gold-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--gold); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 700; font-size: 60px; line-height: 1.05;
    color: var(--ink); text-wrap: balance; letter-spacing: 2px;
    text-shadow: 0 4px 0 rgba(0,0,0,.5), 0 0 34px rgba(255,201,90,.28); }
  .title-line { font-size: 14px; color: var(--gold); letter-spacing: 3px;
    font-family: var(--display); text-transform: uppercase; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.fire { border-color: var(--gold-dim); color: var(--shawl); }
  .badge.sect { border-color: var(--gold); color: var(--gold); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-weight: 700; font-size: 21px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.35; }
  .stat.spd .v { color: var(--gold); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  h2 { font-family: var(--display); font-weight: 700; font-size: 21px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 1px; }
  h2 .glyph { color: var(--gold); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .engine-box { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    justify-content: center; font-size: 13px; color: var(--muted); text-align: center; }
  .engine-step { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 250px; }
  .engine-step b { color: var(--gold); font-weight: 500; }
  .engine-arrow { color: var(--gold-dim); font-size: 20px; }
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--gold-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 700; font-size: 16px; letter-spacing: 1px; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--gold); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--gold); font-weight: 500; }
  .ability.passive-card { border-color: var(--gold-dim); }
  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }
  .acquire { margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap; align-items: baseline; }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-weight: 700; font-size: 15px; color: var(--gold); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--gold); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>5&#x2605; Fire &middot; Firetroupe &middot; No. 5</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Cleo idle animation, a silver-haired fortune teller seated over a glowing crystal ball" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 5</span></div>
      <h1>CLEO</h1>
      <div class="title-line">Fortune Teller of the Firetroupe</div>
      <div class="badges">
        <span class="badge fire">Fire</span>
        <span class="badge">Back-line Support</span>
        <span class="badge">Triage &middot; Buff strip</span>
        <span class="badge sect">Firetroupe &middot; the reading tent</span>
      </div>
      <p class="lede">The ball already knows who falls next. Cleo's
      healing <b>finds the lowest bar on its own</b>, her wisps come back
      from the enemy line <b>carrying their stolen blessings</b>, and
      every time a fire the troupe lit takes its bite, <b>she reads it
      and someone is mended</b>.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">2050</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">155</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">145</div></div>
    <div class="stat spd"><div class="k">SPD</div><div class="v">110</div><div class="sub">saw it coming</div></div>
  </div>

  <h2><span class="glyph">&#x2726;</span> The reading</h2>
  <p class="section-sub">The Firetroupe's burn economy, closed into a
  loop: the troupe lights fires, every tick of those fires pays healing
  through Cleo, and the enemies' own buffs are torn away &#x2014; sometimes
  replaced with more fire.</p>
  <div class="engine-box">
    <div class="engine-step"><b>The ball chooses.</b> Her heals target the
      <b>lowest-HP allies automatically</b> &#x2014; pure triage.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>The flames report.</b> Every enemy burn
      tick heals the lowest ally <b>5% of their pool</b>.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>The luck turns.</b> Fortunes Reversed
      strips a buff from <b>every enemy</b> &#x2014; 20% to leave a burn in
      its place, from the back hex.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>A Kind Fortune</h3>
      <div class="meta">Lowest-HP ally &middot; <b>20% of THEIR max HP</b></div>
      <p>The ball finds whoever needs it most: heals the lowest-HP ally
      for <b>20% of their max HP</b>.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 3</div>
      <h3>Twin Fates</h3>
      <div class="meta">2 lowest-HP allies &middot; <b>25% each + cleanse 1</b></div>
      <p>Two readings at once: heals the <b>2 lowest-HP allies for 25%
      of their max HP</b> each and lifts <b>one debuff</b> from each.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 5</div>
      <h3>Fortunes Reversed</h3>
      <div class="meta">All enemies &middot; <b>strip 1 buff each</b></div>
      <p>The wisps fly out and come back with stolen luck: <b>strips one
      buff from every enemy</b>, oldest first.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Read the Flames</h3>
      <div class="meta">Per enemy burn tick &middot; <b>heal 5% max HP</b></div>
      <p>Every fire tells her something: each time an enemy takes burn
      damage, the <b>lowest-HP ally is healed for 5% of their max
      HP</b>.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Back hex</div>
      <h3>Cruel Fortune</h3>
      <div class="meta">On buff strip &middot; <b>20% to burn, 2 turns</b></div>
      <p>Each buff she strips has a <b>20% chance to be replaced with a
      2-turn burn</b> &#x2014; the cards were never going to be kind.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x2726;</span> The show</h2>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">The ball glows; she waits.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">A pass of the hand.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">Something surfaces in the glass.</div></div>
    <div class="clip"><img src="%%kind%%" alt="A Kind Fortune"><div class="cap"><b>A Kind Fortune</b> &middot; %%nf_kind%%f</div><div class="note">Gold light, gently spent.</div></div>
    <div class="clip"><img src="%%twin%%" alt="Twin Fates"><div class="cap"><b>Twin Fates</b> &middot; %%nf_twin%%f</div><div class="note">The flame reads double.</div></div>
    <div class="clip"><img src="%%reversed%%" alt="Fortunes Reversed"><div class="cap"><b>Fortunes Reversed</b> &middot; %%nf_reversed%%f</div><div class="note">The wisps go collecting.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">The ball flares once, and bursts.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Fire</div></div>
    <div><div class="k">Row</div><div class="v">Back</div></div>
    <div><div class="k">Summon</div><div class="v">Rare Scrolls &middot; 5&#x2605; band</div></div>
    <div><div class="k">Sect</div><div class="v">Firetroupe &middot; No. 5</div></div>
  </div>

  <p class="foot">Sheet drawn from the live hero definition
  (js/data/heroes/humans.js) and the uploaded spritesheets, untouched.
  Play at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a>.</p>
</div>
'''

for name, uri in IMG.items():
    html = html.replace(f'%%{name}%%', uri)
    html = html.replace(f'%%nf_{name}%%', str(NF[name]))

out = '/home/user/browsergacha/docs/cleo-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
