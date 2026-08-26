import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Lenore'
PANEL = (22, 20, 34, 255)   # --panel-2, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('lenoreidle.png',   7, 'idle'),
    ('lenoreidle1.png',  6, 'fidget1'),
    ('lenoreidle2.png',  7, 'fidget2'),
    ('lenoreskill1.png', 10, 'toll'),
    ('lenoreskill2.png', 11, 'muffled'),
    ('lenoreskill3.png', 11, 'ring'),
    ('lenoredeath.png',   8, 'death'),
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

html = r'''<title>Lenore, Passing Bell of the Nightflowers</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cardo:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: a chapel with one candle left. Deep
     indigo-violet ground, old gold on the bell's bands, and pale silver
     -- the flash at the end of the peal -- for every figure that is
     hers. Cardo, a liturgical book serif, set quiet. Every color
     painted explicitly. */
  :root {
    --ground: #0b0a12;
    --panel: #100e19;
    --panel-2: #161422;
    --line: #322e46;
    --ink: #f0eef6;
    --muted: #9791ab;
    --silver: #d8dcf0;
    --silver-dim: #5d6288;
    --gold: #c9a961;
    --display: 'Cardo', 'Georgia', serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink);
    font-family: var(--mono); font-size: 15px; line-height: 1.65; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }
  .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px; }
  .eyebrow b { color: var(--silver); font-weight: 500; }
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art { flex: 0 0 300px; position: relative;
    background: radial-gradient(ellipse 62% 46% at 50% 62%, rgba(216,220,240,.11), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--silver-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--gold); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 700; font-size: 68px; line-height: 1.04;
    color: var(--ink); text-wrap: balance; letter-spacing: 3px;
    text-shadow: 0 4px 0 rgba(0,0,0,.55), 0 0 34px rgba(216,220,240,.20); }
  .title-line { font-size: 15px; color: var(--silver); letter-spacing: 2px;
    font-family: var(--display); font-style: italic; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.light { border-color: var(--silver-dim); color: var(--silver); }
  .badge.sect { border-color: var(--gold); color: var(--gold); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-weight: 700; font-size: 24px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.35; }
  .stat.hp .v { color: var(--silver); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  h2 { font-family: var(--display); font-weight: 400; font-size: 27px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 1px; }
  h2 .glyph { color: var(--silver); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .engine-box { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    justify-content: center; font-size: 13px; color: var(--muted); text-align: center; }
  .engine-step { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 250px; }
  .engine-step b { color: var(--silver); font-weight: 500; }
  .engine-arrow { color: var(--silver-dim); font-size: 20px; }
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--silver-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 700; font-size: 19px; letter-spacing: 1px; }
  .ability .ladder { margin-top: 10px; padding-top: 9px;
    border-top: 1px solid var(--line); font-family: var(--mono);
    font-size: 11px; line-height: 1.7; color: var(--muted); }
  .ability .ladder b { color: var(--ink); font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase; font-size: 10px; }
  .ability .ladder i { font-style: normal; color: var(--ink); }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--gold); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--silver); font-weight: 500; }
  .ability.passive-card { border-color: var(--silver-dim); }

  /* The two centre hexes, side by side. */
  .split { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 14px; }
  .split .card { background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 18px 20px; }
  .split .card h4 { font-family: var(--display); font-weight: 700; font-size: 18px;
    letter-spacing: 1px; color: var(--ink); }
  .split .card .rank { font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
    color: var(--silver-dim); margin-bottom: 6px; }
  .split .card p { font-size: 13px; color: var(--muted); margin-top: 6px; }
  .split .card b { color: var(--silver); font-weight: 500; }

  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }
  .acquire { margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap; align-items: baseline; }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-weight: 700; font-size: 16px; color: var(--silver); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--silver); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>3&#x2605; Dark &middot; Nightflower &middot; No. 6</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Lenore idle animation, a hooded acolyte holding up a great funeral bell wreathed in lilies" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 3</span></div>
      <h1>LENORE</h1>
      <div class="title-line">Passing Bell of the Nightflowers</div>
      <div class="badges">
        <span class="badge light">Dark</span>
        <span class="badge">Center Support</span>
        <span class="badge">Mend &middot; Brace &middot; Shield</span>
        <span class="badge sect">Nightflower &middot; No. 6</span>
      </div>
      <p class="lede">The sect has two other bell-carriers and neither of
      them rings <em>this</em> one. Toll's is a war bell; Imani's is a
      chime bar. Lenore's is the <b>passing bell</b> &#x2014; the one rung
      for the dead. Every figure she hands out is a share of her own
      pool, and her whole hero is one line: <b>a bell rung for a death is
      a bell she rings again sooner</b>.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat hp"><div class="k">HP</div><div class="v">1630</div><div class="sub">every mend is a slice of this</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">97</div><div class="sub">unused &#x2014; nothing scales off it</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">123</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">106</div></div>
  </div>

  <h2><span class="glyph">&#x2740;</span> She is paid in bad news</h2>
  <p class="section-sub">Most supports are strongest when the fight is
  going well and they have time to set up. Lenore is the opposite: she
  does nothing special in a clean fight, and every ally she loses hands
  her the rest of her kit a turn early.</p>
  <div class="engine-box">
    <div class="engine-step"><b>An ally falls.</b> The bell is rung for
      them &#x2014; that is the whole job.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Every cooldown drops a turn.</b> Muffled
      Peal and Open Ring both come back sooner.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Exactly when it is needed.</b> A collapse
      is the moment the team wants both of them.</div>
  </div>

  <h2><span class="glyph">&#x2740;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Single Toll</h3>
      <div class="meta">Worst-off ally &middot; <b>20% of her max HP</b></div>
      <p>One ring, for whoever needs it. There is <b>no target to
      pick</b> &#x2014; the bell finds the ally actually bleeding, which
      is usually not the one you would have clicked.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +5% heal &rsaquo; +5% heal &rsaquo; +5% heal &rsaquo; +5% heal &rsaquo; +5% heal <i>&middot; max Lv 6</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 6 &rarr; 4 fully levelled</div>
      <h3>Muffled Peal</h3>
      <div class="meta">All allies &middot; <b>+30% DEF &middot; 10% max HP a turn, 2 turns</b></div>
      <p>Rung muffled, the way it is rung for the dead: the whole team
      braces at <b>+30% DEF</b> and regenerates <b>10% of her max HP a
      turn</b> for two. Nothing else in the game puts a regen on the
      entire team.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +5% boon &rsaquo; +2% heal &rsaquo; +2% heal &rsaquo; +1 turn &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 7</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 7 &rarr; 5 fully levelled</div>
      <h3>Open Ring</h3>
      <div class="meta">All allies &middot; <b>20% max HP &middot; shield 10%, 2 turns</b></div>
      <p>The bell opened all the way: every ally recovers <b>20% of her
      max HP</b> and takes a <b>shield worth 10% of it</b>. Shields
      existed on exactly one hero before her, and only on himself.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +5% heal &rsaquo; +5% heal &rsaquo; +5% heal &rsaquo; +5% heal &rsaquo; +1 turn &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 8</i></div>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>The Passing Bell</h3>
      <div class="meta">On an ally's death</div>
      <p>Whenever an <b>ally</b> falls, every one of her cooldowns drops
      by <b>1 turn</b>. Not enemies, and not herself &#x2014; she does
      not ring her own.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Center hex</div>
      <h3>Bell Tower</h3>
      <div class="meta">Center &middot; <b>5% max HP to everyone, each turn</b></div>
      <p>At the start of each of her turns, <b>every ally recovers 5% of
      her max HP</b>. The bell does not stop ringing.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x2740;</span> Two bells, one hex</h2>
  <p class="section-sub">There is only one centre hex, and the sect has
  two supports who want it. That is deliberate: they answer different
  problems, and you should rarely be unsure which one the fight needs.</p>
  <div class="split">
    <div class="card">
      <div class="rank">4&#x2605; &middot; Evelune</div>
      <h4>Tempo</h4>
      <p>Hands the team its cooldowns back, holds everyone's blessings a
      turn longer, carries a quarter of every buff to a second ally.
      <b>Worth most on a team already full of things to amplify.</b></p>
    </div>
    <div class="card">
      <div class="rank">3&#x2605; &middot; Lenore</div>
      <h4>Bulk</h4>
      <p>Mends, regenerates, braces and shields &#x2014; all priced off
      her own health pool, all aimed at the whole line at once.
      <b>Worth most when the problem is simply that people are
      dying.</b></p>
    </div>
  </div>

  <h2><span class="glyph">&#x2740;</span> Frames</h2>
  <p class="section-sub">Seven strips at nine frames each. Watch the
  bell: it tips and rings once, then throws a storm of sigils that
  settles over her, and in the third it fills with light and empties all
  of it downward at once.</p>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">Held up, waiting.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">The weight swinging.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">Steadying the shaft.</div></div>
    <div class="clip"><img src="%%toll%%" alt="Single Toll"><div class="cap"><b>Single Toll</b> &middot; %%nf_toll%%f</div><div class="note">Skill 1 &#x2014; one ring.</div></div>
    <div class="clip"><img src="%%muffled%%" alt="Muffled Peal"><div class="cap"><b>Muffled Peal</b> &middot; %%nf_muffled%%f</div><div class="note">Skill 2 &#x2014; it settles rather than strikes.</div></div>
    <div class="clip"><img src="%%ring%%" alt="Open Ring"><div class="cap"><b>Open Ring</b> &middot; %%nf_ring%%f</div><div class="note">Skill 3 &#x2014; all of it, downward.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">Nobody rings this one.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Dark</div></div>
    <div><div class="k">Rarity</div><div class="v">3&#x2605;</div></div>
    <div><div class="k">Role</div><div class="v">Center Support</div></div>
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

out = '/home/user/browsergacha/docs/lenore-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
