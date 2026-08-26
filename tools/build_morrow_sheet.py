import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Morrow'
PANEL = (24, 20, 32, 255)   # --panel-2, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('morrowidle.png',   7, 'idle'),
    ('morrowidle1.png',  6, 'fidget1'),
    ('morrowidle2.png',  7, 'fidget2'),
    ('morrowskill1.png', 11, 'break'),
    ('morrowskill2.png', 11, 'bloom'),
    ('morrowskill3.png', 10, 'bear'),
    ('morrowdeath.png',   8, 'death'),
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

html = r'''<title>Morrow, Pallbearer of the Nightflowers</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bitter:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: turned earth at night. Cold
     violet-black ground, wisteria for everything living, bone for the
     text, and old gold kept strictly for the bands on the maul. Bitter,
     a sturdy slab, because he is a working gravedigger and the page
     should feel like it weighs something. Every color painted
     explicitly. */
  :root {
    --ground: #0c0a10;
    --panel: #110e16;
    --panel-2: #181420;
    --line: #362e46;
    --ink: #efeaf2;
    --muted: #9990a6;
    --wisteria: #a678e8;
    --wisteria-dim: #5a3f88;
    --gold: #c8a84a;
    --display: 'Bitter', 'Georgia', serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink);
    font-family: var(--mono); font-size: 15px; line-height: 1.65; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }
  .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px; }
  .eyebrow b { color: var(--wisteria); font-weight: 500; }
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art { flex: 0 0 300px; position: relative;
    background: radial-gradient(ellipse 62% 46% at 50% 62%, rgba(166,120,232,.14), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--wisteria-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--gold); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 700; font-size: 66px; line-height: 1.04;
    color: var(--ink); text-wrap: balance; letter-spacing: -1px;
    text-shadow: 0 4px 0 rgba(0,0,0,.55), 0 0 34px rgba(166,120,232,.22); }
  .title-line { font-size: 15px; color: var(--wisteria); letter-spacing: 2px;
    font-family: var(--display); font-style: italic; font-weight: 400; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.light { border-color: var(--wisteria-dim); color: var(--wisteria); }
  .badge.sect { border-color: var(--gold); color: var(--gold); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-weight: 700; font-size: 24px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.35; }
  .stat.def .v { color: var(--wisteria); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  h2 { font-family: var(--display); font-weight: 400; font-size: 26px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 0; }
  h2 .glyph { color: var(--wisteria); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .engine-box { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    justify-content: center; font-size: 13px; color: var(--muted); text-align: center; }
  .engine-step { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 250px; }
  .engine-step b { color: var(--wisteria); font-weight: 500; }
  .engine-arrow { color: var(--wisteria-dim); font-size: 20px; }
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--wisteria-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 700; font-size: 19px; letter-spacing: 0; }
  .ability .ladder { margin-top: 10px; padding-top: 9px;
    border-top: 1px solid var(--line); font-family: var(--mono);
    font-size: 11px; line-height: 1.7; color: var(--muted); }
  .ability .ladder b { color: var(--ink); font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase; font-size: 10px; }
  .ability .ladder i { font-style: normal; color: var(--ink); }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--gold); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--wisteria); font-weight: 500; }
  .ability.passive-card { border-color: var(--wisteria-dim); }

  /* The body count, and what it is worth. */
  .ledger { background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; overflow-x: auto; }
  .ledger table { width: 100%; border-collapse: collapse; min-width: 460px; }
  .ledger th, .ledger td { text-align: left; padding: 12px 18px;
    border-bottom: 1px solid var(--line); font-size: 13px; }
  .ledger thead th { font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
    color: var(--muted); font-weight: 400; background: var(--panel); }
  .ledger tbody tr:last-child td { border-bottom: none; }
  .ledger td.n { font-variant-numeric: tabular-nums; text-align: right;
    font-family: var(--display); font-weight: 700; font-size: 17px; color: var(--wisteria); }
  .ledger td.who { color: var(--muted); }

  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }
  .acquire { margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap; align-items: baseline; }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-weight: 700; font-size: 16px; color: var(--wisteria); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--wisteria); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>4&#x2605; Dark &middot; Nightflower &middot; No. 6</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Morrow idle animation, a hooded gravedigger with a gold-banded maul and wisteria growing off his back" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 4</span></div>
      <h1>MORROW</h1>
      <div class="title-line">Pallbearer of the Nightflowers</div>
      <div class="badges">
        <span class="badge light">Dark</span>
        <span class="badge">Front Tank</span>
        <span class="badge">Taunt &middot; Cover &middot; Attrition</span>
        <span class="badge sect">Nightflower &middot; No. 6</span>
      </div>
      <p class="lede">A hooded gravedigger with an entire wisteria growing
      off his back. Everything he throws is priced off <b>DEF</b>, so the
      gear that keeps him standing is the gear that hits. He volunteers
      for the whole enemy team at once, is fed by <b>every corpse it
      makes &#x2014; whoever it belonged to</b>, and his last swing is the
      weight of all of them.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">2165</div><div class="sub">the biggest body in the sect</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">95</div><div class="sub">unused &#x2014; he hits off DEF</div></div>
    <div class="stat def"><div class="k">DEF</div><div class="v">151</div><div class="sub">every number in his kit</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">90</div></div>
  </div>

  <h2><span class="glyph">&#x2740;</span> One stat, both jobs</h2>
  <p class="section-sub">Nothing in Morrow's kit reads ATK. Damage,
  survival and the size of his finisher all come off the same number,
  which means there is no gearing decision to get wrong &#x2014; and no
  turn where a tank build makes him useless.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Wisteria</b> taunts the entire enemy
      team onto him and raises DEF <b>50%</b> to survive it.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Grave Soil</b> mends him <b>10% max HP</b>
      per body, either side, all fight.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Pallbearer</b> charges the whole count
      to one enemy &#x2014; <b>+20% DEF a corpse</b>.</div>
  </div>

  <h2><span class="glyph">&#x2740;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Groundbreak</h3>
      <div class="meta">Enemy front row &middot; <b>70% DEF &middot; mends 8% max HP</b></div>
      <p>The maul comes down: <b>70% DEF</b> to the enemy front row, and
      something grows where it landed &#x2014; he <b>mends 8% of his own
      max HP</b>, every turn, forever.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +5% power &rsaquo; +5% power <i>&middot; max Lv 6</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 6 &rarr; 4 fully levelled</div>
      <h3>Wisteria</h3>
      <div class="meta">All enemies &middot; <b>taunt 1 turn &middot; +50% DEF, 2 turns</b></div>
      <p>The garden on his back comes into flower and every eye follows
      it: <b>every enemy</b> has a <b>50% chance</b> to be taunted onto him
      for a turn, and
      Morrow takes <b>+50% DEF for two</b>. Nothing else in the game
      taunts more than a row.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +20% land chance &rsaquo; +20% land chance &rsaquo; +10% land chance &rsaquo; +1 turn &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 7</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 7 &rarr; 5 fully levelled</div>
      <h3>Pallbearer</h3>
      <div class="meta">Single enemy &middot; <b>200% DEF, +20% a corpse</b></div>
      <p>He brings down everything he has had to carry: <b>200% DEF</b> to
      one enemy, and <b>20% more for every unit that has fallen this
      fight</b>, either side. Uncapped, which only matters in a fight that
      has already gone badly for somebody.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power, +5%/death &rsaquo; +10% power, +5%/death &rsaquo; +10% power, +5%/death &rsaquo; +10% power, +5%/death &rsaquo; +10% power, +5%/death &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 8</i></div>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Grave Soil</h3>
      <div class="meta">On any death, either side</div>
      <p>The garden does not ask whose corpse it was: whenever <b>any</b>
      unit on the field falls, <b>Morrow mends 10% of his max HP</b>. He
      gets harder to kill the bloodier it gets.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Front hex</div>
      <h3>Mourner's Row</h3>
      <div class="meta">Front &middot; <b>back-row allies take 20% less</b></div>
      <p>He is standing between them and it: while Morrow holds a front
      hex, <b>every ally on a BACK hex takes 20% less damage</b>. The
      first thing in the game that shelters somebody else by standing
      somewhere.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x2740;</span> What the count is worth</h2>
  <p class="section-sub">Pallbearer at Morrow's base DEF, priced against
  the bodies already on the field. A seven-a-side fight that has gone the
  distance is a very different swing from the one he opens with.</p>
  <div class="ledger">
    <table>
      <thead>
        <tr><th>Bodies this fight</th><th class="who">Reads as</th><th style="text-align:right">Multiplier</th></tr>
      </thead>
      <tbody>
        <tr><td>0</td><td class="who">opening swing</td><td class="n">&times;2.00</td></tr>
        <tr><td>3</td><td class="who">their front row is gone</td><td class="n">&times;2.60</td></tr>
        <tr><td>5</td><td class="who">the fight has turned</td><td class="n">&times;3.00</td></tr>
        <tr><td>8</td><td class="who">both sides are thin</td><td class="n">&times;3.60</td></tr>
      </tbody>
    </table>
  </div>

  <h2><span class="glyph">&#x2740;</span> Frames</h2>
  <p class="section-sub">Seven strips at nine frames each. Watch what he
  is carrying: it slams and leaves flowers behind, it lights the whole
  garden on his back, and in the third the head of the maul stands up as
  a coffin.</p>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">Shouldering it.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">Shifting the weight.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">The censer swinging.</div></div>
    <div class="clip"><img src="%%break%%" alt="Groundbreak"><div class="cap"><b>Groundbreak</b> &middot; %%nf_break%%f</div><div class="note">Skill 1 &#x2014; and something sprouts.</div></div>
    <div class="clip"><img src="%%bloom%%" alt="Wisteria"><div class="cap"><b>Wisteria</b> &middot; %%nf_bloom%%f</div><div class="note">Skill 2 &#x2014; the whole garden lights.</div></div>
    <div class="clip"><img src="%%bear%%" alt="Pallbearer"><div class="cap"><b>Pallbearer</b> &middot; %%nf_bear%%f</div><div class="note">Skill 3 &#x2014; the maul stands up as a coffin.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">Someone else digs this one.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Dark</div></div>
    <div><div class="k">Rarity</div><div class="v">4&#x2605;</div></div>
    <div><div class="k">Role</div><div class="v">Front Tank</div></div>
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

out = '/home/user/browsergacha/docs/morrow-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
