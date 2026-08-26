import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/florence'
PANEL = (17, 22, 30, 255)   # --panel-2, so a clip has no visible box around it
SIZE = 280

# The strip filenames carry an upstream capital K and one lowercase
# 'knightdeath' -- kept exactly as uploaded.
STRIPS = [
    ('KnightIdle.png',      5, 'idle'),
    ('Knightidle2.png',     7, 'fidget1'),
    ('Knightidle3.png',     7, 'fidget2'),
    ('Knightready.png',     7, 'ready'),
    ('Knightbuff.png',     13, 'resonance'),
    ('Knightjumpslash.png',11, 'prism'),
    ('knightdeath.png',     7, 'death'),
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

html = r'''<title>Tide, Crystal Blade of Cryst</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: a blade of court ice held up to the
     light. Deep hall-blue ground, and one hard white -- the crit flash --
     kept strictly for the numbers that only appear when she connects.
     Michroma for the display: faceted, machined, cut rather than drawn.
     Every color painted explicitly. */
  :root {
    --ground: #0a0e15;
    --panel: #0e131c;
    --panel-2: #11161e;
    --line: #2b3b52;
    --ink: #eaf1f8;
    --muted: #8b9db4;
    --edge: #7fd4ff;
    --flash: #ffffff;
    --edge-dim: #3a6a8c;
    --steel: #cdd8e6;
    --display: 'Michroma', 'Trebuchet MS', sans-serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink);
    font-family: var(--mono); font-size: 15px; line-height: 1.65; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }
  .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px; }
  .eyebrow b { color: var(--edge); font-weight: 500; }
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art { flex: 0 0 300px; position: relative;
    background: radial-gradient(ellipse 62% 46% at 50% 60%, rgba(127,212,255,.14), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--edge-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--edge); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 400; font-size: 62px; line-height: 1.05;
    color: var(--ink); text-wrap: balance; letter-spacing: 4px;
    text-shadow: 0 4px 0 rgba(0,0,0,.5), 0 0 34px rgba(127,212,255,.3); }
  .title-line { font-size: 14px; color: var(--edge); letter-spacing: 4px;
    font-family: var(--display); text-transform: uppercase; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.water { border-color: var(--edge-dim); color: var(--edge); }
  .badge.sect { border-color: var(--steel); color: var(--steel); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-size: 20px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.35; }
  .stat.atk .v { color: var(--edge); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  h2 { font-family: var(--display); font-weight: 400; font-size: 22px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 2px; }
  h2 .glyph { color: var(--edge); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .engine-box { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    justify-content: center; font-size: 13px; color: var(--muted); text-align: center; }
  .engine-step { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 250px; }
  .engine-step b { color: var(--edge); font-weight: 500; }
  .engine-arrow { color: var(--edge-dim); font-size: 20px; }
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--edge-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 400; font-size: 16px; letter-spacing: 1px; }
  .ability .ladder { margin-top: 10px; padding-top: 9px;
    border-top: 1px solid var(--line); font-family: var(--mono);
    font-size: 11px; line-height: 1.7; color: var(--muted); }
  .ability .ladder b { color: var(--ink); font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase; font-size: 10px; }
  .ability .ladder i { font-style: normal; color: var(--ink); }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--steel); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--edge); font-weight: 500; }
  .ability.passive-card { border-color: var(--edge-dim); }
  .maths { width: 100%; border-collapse: collapse; font-size: 13px;
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; overflow: hidden; }
  .maths th { text-align: left; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
    color: var(--muted); font-weight: 400; padding: 12px 16px; border-bottom: 2px solid var(--line); }
  .maths th.num, .maths td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .maths td { padding: 10px 16px; border-bottom: 1px solid var(--line); color: var(--ink); }
  .maths tr:last-child td { border-bottom: none; }
  .maths td.lab { color: var(--muted); }
  .maths td .hit { color: var(--flash); font-weight: 600; }
  .maths-wrap { overflow-x: auto; }
  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }
  .acquire { margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap; align-items: baseline; }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-size: 14px; color: var(--edge); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--edge); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>4&#x2605; Water &middot; Cryst &middot; No. 1</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Tide idle animation, an armoured knight at rest holding a long crystal blade" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 4</span></div>
      <h1>TIDE</h1>
      <div class="title-line">Crystal Blade of Cryst</div>
      <div class="badges">
        <span class="badge water">Water</span>
        <span class="badge">Front-line DPS</span>
        <span class="badge">Crit &middot; Ramp</span>
        <span class="badge sect">Cryst &middot; No. 1</span>
      </div>
      <p class="lede">Cryst's only pure duellist, and the one hero on the
      roster whose damage is built rather than rolled. <b>Blade Dance</b>
      refreshes her every single turn; <b>Crystal Resonance</b> is the
      window she opens for herself. Everything else in the kit exists to
      make the moment she connects worth more than the moment she
      swings.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1025</div></div>
    <div class="stat atk"><div class="k">ATK</div><div class="v">170</div><div class="sub">multiplied, not added to</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">92</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">105</div><div class="sub">115 while dancing</div></div>
  </div>

  <h2><span class="glyph">&#x00BB;</span> The window</h2>
  <p class="section-sub">Read her as three turns, not one. The passive
  keeps her sharp for free, Resonance buys the burst, and Prism Break is
  what the burst is spent on &#x2014; a whole enemy row inside the same
  buff.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Blade Dance, every turn.</b> +15% SPD and
      +5% crit, re-applied at the start of each of her turns. Free, silent,
      and always on while she is acting.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Crystal Resonance.</b> +50% crit chance
      AND +50% crit damage for 3 turns &#x2014; <b>+65% / +65%</b> over
      4 turns fully levelled.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Prism Break inside it.</b> 170% ATK to a
      whole enemy row, at <b>220%</b> maxed, with the crit numbers still
      up. This is the turn the fight is decided on.</div>
  </div>

  <h2><span class="glyph">&#x00BB;</span> What a point of crit is worth</h2>
  <p class="section-sub">Crit chance and crit damage multiply each other,
  which is why Resonance grants both and why stacking one without the
  other wastes half of her. Everyone starts at <b>15% for &times;1.5</b>,
  so her floor is already &times;1.075 &mdash; what the kit buys is the
  distance from there. Skills at max; Slash's focus lands on the swing
  <em>after</em> the one that cast it.</p>
  <div class="maths-wrap">
    <table class="maths">
      <thead><tr><th>State</th><th class="num">Crit chance</th><th class="num">Crit damage</th><th class="num">Average hit</th><th class="num">vs her floor</th></tr></thead>
      <tbody>
        <tr><td class="lab">Unbuffed floor</td><td class="num">15%</td><td class="num">&times;1.50</td><td class="num">&times;1.075</td><td class="num">&mdash;</td></tr>
        <tr><td class="lab">Dancing &mdash; any turn she acts</td><td class="num">20%</td><td class="num">&times;1.50</td><td class="num">&times;1.100</td><td class="num">+2%</td></tr>
        <tr><td class="lab">Dancing, after a levelled Slash</td><td class="num">29%</td><td class="num">&times;1.50</td><td class="num">&times;1.145</td><td class="num">+7%</td></tr>
        <tr><td class="lab">Inside Resonance</td><td class="num"><span class="hit">94%</span></td><td class="num"><span class="hit">&times;2.15</span></td><td class="num"><span class="hit">&times;2.081</span></td><td class="num"><span class="hit">+94%</span></td></tr>
      </tbody>
    </table>
  </div>
  <p class="section-sub" style="margin-top:16px">Read the last row twice.
  Resonance is not a bonus on top of her damage &mdash; it is
  <b>almost double</b> everything she does, for four turns, on a
  four-turn cooldown once it is fully levelled. Tide outside her window
  is a 4-star with a 100% ATK basic. Tide inside it is the reason to
  bring her.</p>

  <h2><span class="glyph">&#x00BB;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Crystal Slash</h3>
      <div class="meta">Single enemy &middot; <b>100% ATK</b> &middot; self-buff</div>
      <p>A crystal-edged cut for <b>100% ATK</b> that focuses her:
      <b>+5% crit chance</b> on herself for a turn. It is the filler swing,
      and it is also how she keeps her own numbers climbing between
      cooldowns.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +2% boon &rsaquo; +2% boon <i>&middot; max Lv 6</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 6 &rarr; 4 fully levelled</div>
      <h3>Crystal Resonance</h3>
      <div class="meta">Self &middot; <b>+50% crit chance &amp; +50% crit damage</b>, 3 turns</div>
      <p>Attune to the blade. Both halves of the crit equation at once,
      which is what makes it worth a six-turn cooldown &#x2014; and the
      only skill she has that does not touch the enemy at all.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +5% boon &rsaquo; +5% boon &rsaquo; +5% boon &rsaquo; +1 turn &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 7</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 8 &rarr; 6 fully levelled</div>
      <h3>Prism Break</h3>
      <div class="meta">One enemy row &middot; <b>170% ATK</b></div>
      <p>Leap skyward and hurl a shearing wave that cuts an <b>entire
      enemy row</b> for 170% ATK. The longest cooldown in her kit and the
      only skill that hits more than one target &#x2014; hold it for
      Resonance.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 8</i></div>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Blade Dance</h3>
      <div class="meta">At the start of each of her turns</div>
      <p><b>+15% SPD and +5% crit chance</b> for one turn, re-applied
      every turn she takes. It never logs and never stacks past a single
      turn &#x2014; but it means she is never at her base numbers while
      the fight is going.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Front hex</div>
      <h3>Last Stand</h3>
      <div class="meta">Front row &middot; <b>+35% ATK below 40% HP</b></div>
      <p>The closer to death, the harder the swing. A deliberate trap:
      the hex that pays her the most is also the hex that gets her hit,
      and the bonus only exists once she is nearly gone.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x00BB;</span> Who she wants beside her</h2>
  <p class="section-sub">She generates her own crit and nothing else.
  Everything she is missing &#x2014; survival at low HP, a reason to be
  there when Resonance comes up &#x2014; has to come from the hex beside
  her.</p>
  <div class="engine-box">
    <div class="engine-step"><b>A healer who reads HP, not ATK.</b>
      Last Stand wants her under 40% and alive. Vivian's mend is priced
      off the healer's own pool, so it does not shrink as Tide's does.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Anything that stalls the enemy row.</b>
      A freeze or an AP drain buys the turn she needs for Prism Break to
      land inside Resonance rather than after it.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Crit-damage gear, not crit chance.</b>
      Resonance already hands her +65% chance. Chance she can get; the
      damage multiplier is the half she cannot buy twice.</div>
  </div>

  <h2><span class="glyph">&#x00BB;</span> Frames</h2>
  <p class="section-sub">Seven strips. The jump-slash carries a full
  motion track &#x2014; take-off, an airborne hold, a landing cloud
  &#x2014; and is re-used for both the single-target leap and the row
  wave, played on different holds. Authored facing right; the files ship
  untouched.</p>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">Blade down, weight back.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">A check along the edge.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">The long hold at frame seven.</div></div>
    <div class="clip"><img src="%%ready%%" alt="Ready stance"><div class="cap"><b>Ready</b> &middot; %%nf_ready%%f</div><div class="note">Her turn, guard up.</div></div>
    <div class="clip"><img src="%%resonance%%" alt="Crystal Resonance"><div class="cap"><b>Crystal Resonance</b> &middot; %%nf_resonance%%f</div><div class="note">Attuning; holds at sixteen.</div></div>
    <div class="clip"><img src="%%prism%%" alt="Prism Break"><div class="cap"><b>Prism Break</b> &middot; %%nf_prism%%f</div><div class="note">Up, across, down.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">Twenty-two frames; the longest fall on the roster.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Water</div></div>
    <div><div class="k">Rarity</div><div class="v">4&#x2605;</div></div>
    <div><div class="k">Role</div><div class="v">Front-line DPS</div></div>
    <div><div class="k">Sect</div><div class="v">Cryst &middot; No. 1</div></div>
  </div>

  <p class="foot">Sheet drawn from the live hero definition
  (js/data/heroes/humans.js) and the uploaded spritesheets, untouched.
  Play at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a>.</p>
</div>
'''

for name, uri in IMG.items():
    html = html.replace(f'%%{name}%%', uri)
    html = html.replace(f'%%nf_{name}%%', str(NF[name]))

out = '/home/user/browsergacha/docs/florence-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
