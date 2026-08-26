import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/coral'
PANEL = (11, 24, 36, 255)   # --panel-2, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('coralidle.png',   5, 'idle'),
    ('coralidle1.png',  7, 'fidget1'),
    ('coralidle2.png',  7, 'fidget2'),
    ('coralidle3.png',  7, 'fidget3'),
    ('coralready.png',  7, 'ready'),
    ('coralskill1.png', 10, 'lash'),
    ('coralskill3.png', 10, 'spear'),
    ('coraldeath.png',   7, 'death'),
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

html = r'''<title>Coral, Tide Caller of the Hedge</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: deep water with the light a long
     way up. Abyssal navy, tide-blue for the numbers, and a single warm
     coral for her name and the one stat she is built around. Abril
     Fatface on the display -- heavy, blunt, the weight of a wave
     landing. Every color painted explicitly. */
  :root {
    --ground: #050d14;
    --panel: #08131c;
    --panel-2: #0b1824;
    --line: #1d3d52;
    --ink: #e6f2f8;
    --muted: #7fa3b8;
    --tide: #4fc8e8;
    --tide-dim: #2a6c86;
    --coral: #ff8a72;
    --foam: #eaf6fb;
    --display: 'Abril Fatface', 'Georgia', serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink);
    font-family: var(--mono); font-size: 15px; line-height: 1.65; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }
  .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px; }
  .eyebrow b { color: var(--tide); font-weight: 500; }
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art { flex: 0 0 300px; position: relative;
    background: radial-gradient(ellipse 62% 46% at 50% 58%, rgba(79,200,232,.16), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--tide-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--tide); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-size: 68px; line-height: 1.02;
    color: var(--coral); text-wrap: balance; letter-spacing: 1px;
    text-shadow: 0 4px 0 rgba(0,0,0,.6), 0 0 38px rgba(255,138,114,.28); }
  .title-line { font-size: 15px; color: var(--tide); letter-spacing: 2px;
    font-family: var(--display); }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.water { border-color: var(--tide-dim); color: var(--tide); }
  .badge.sect { border-color: var(--coral); color: var(--coral); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-size: 26px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.3; }
  .stat.atk .v { color: var(--coral); }
  .stat.hp .v { color: var(--muted); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  h2 { font-family: var(--display); font-size: 26px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 0; }
  h2 .glyph { color: var(--tide); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .section-sub b { color: var(--ink); font-weight: 500; }
  .engine-box { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    justify-content: center; font-size: 13px; color: var(--muted); text-align: center; }
  .engine-step { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 250px; }
  .engine-step b { color: var(--tide); font-weight: 500; }
  .engine-arrow { color: var(--tide-dim); font-size: 20px; }
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--tide-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-size: 20px; }
  .ability .ladder { margin-top: 10px; padding-top: 9px;
    border-top: 1px solid var(--line); font-family: var(--mono);
    font-size: 11px; line-height: 1.7; color: var(--muted); }
  .ability .ladder b { color: var(--ink); font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase; font-size: 10px; }
  .ability .ladder i { font-style: normal; color: var(--ink); }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--foam); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--tide); font-weight: 500; }
  .ability p .warm { color: var(--coral); font-weight: 500; }
  .ability.passive-card { border-color: var(--tide-dim); }
  .maths { width: 100%; border-collapse: collapse; font-size: 13px;
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; overflow: hidden; }
  .maths th { text-align: left; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
    color: var(--muted); font-weight: 400; padding: 12px 16px; border-bottom: 2px solid var(--line); }
  .maths th.num, .maths td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .maths td { padding: 10px 16px; border-bottom: 1px solid var(--line); color: var(--ink); }
  .maths tr:last-child td { border-bottom: none; }
  .maths td.lab { color: var(--muted); }
  .maths td .big { color: var(--coral); font-weight: 600; }
  .maths td .never { color: var(--muted); font-style: italic; }
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
  .acquire .v { font-family: var(--display); font-size: 18px; color: var(--tide); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--tide); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>4&#x2605; Water &middot; Hedge &middot; No. 3</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Coral idle animation, a tide caller holding a long staff in blue light" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 4</span></div>
      <h1>CORAL</h1>
      <div class="title-line">Tide Caller of the Hedge</div>
      <div class="badges">
        <span class="badge water">Water</span>
        <span class="badge">Striker</span>
        <span class="badge">Three skills, no utility</span>
        <span class="badge sect">Hedge &middot; No. 3</span>
      </div>
      <p class="lede">The <b>highest attack stat of any 4-star</b> bolted
      onto the <b>smallest health pool in the game</b>. Nothing in her
      kit heals, shields, buffs, cleanses or curses &#x2014; three
      damage skills and a passive that pays her for hitting the people
      hitting back. She is the roster's clearest trade: everything
      forward, nothing held in reserve.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat atk"><div class="k">ATK</div><div class="v">195</div><div class="sub">highest of any 4&#x2605;</div></div>
    <div class="stat hp"><div class="k">HP</div><div class="v">860</div><div class="sub">lowest on the roster</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">71</div><div class="sub">second lowest</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">110</div></div>
  </div>

  <h2><span class="glyph">&#x2248;</span> One stat, three skills</h2>
  <p class="section-sub">Figures are a Lv&nbsp;30 4-star Coral at
  <b>478 ATK</b>, skills at cap, <b>before the target's DEF is
  applied</b> &mdash; the mitigation curve treats her hits like anyone
  else's. The right-hand column is Riptide, her passive: a flat 25% more
  against an enemy standing on a <b>front</b> hex.</p>
  <div class="maths-wrap">
    <table class="maths">
      <thead><tr><th>Skill</th><th class="num">Base</th><th class="num">Maxed</th><th class="num">Base hit</th><th class="num">Maxed hit</th><th class="num">Maxed, front-hex target</th></tr></thead>
      <tbody>
        <tr><td class="lab">Tide Lash &mdash; every turn</td><td class="num">110%</td><td class="num">160%</td><td class="num">526</td><td class="num">765</td><td class="num"><span class="big">956</span></td></tr>
        <tr><td class="lab">Undertow &mdash; enemy back row</td><td class="num">90%</td><td class="num">130%</td><td class="num">430</td><td class="num">621</td><td class="num">776 <span class="never">only on a collapse</span></td></tr>
        <tr><td class="lab">Maelstrom Spear</td><td class="num">240%</td><td class="num">290%</td><td class="num">1,147</td><td class="num">1,386</td><td class="num"><span class="big">1,733</span></td></tr>
      </tbody>
    </table>
  </div>

  <h2><span class="glyph">&#x2248;</span> The contradiction in her kit</h2>
  <p class="section-sub"><b>Riptide pays only against enemies on a front
  hex. Undertow reaches only enemies on a back hex.</b> In the ordinary
  case her one area skill is the single skill her passive cannot touch,
  and no amount of positioning, gear or levels brings the two
  together.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Against one back-liner, don't.</b> A
      capped Tide Lash is 160% on no cooldown; a capped Undertow is 130%
      on a five-turn one. One body back there is not worth the
      button.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Against three, always.</b> Three
      back-hex enemies is 390% of her attack in one cast, and it is the
      only sweep she owns.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Against an empty back row, it collapses
      forward.</b> A row sweep that finds its row empty walks inward
      until it finds one that is not &#x2014; the centre, then the
      front. The turn is never wasted.</div>
  </div>
  <p class="section-sub" style="margin-top:16px">And that collapse is
  the <em>only</em> way the two halves of her kit ever meet. When the
  enemy back row is empty and the sweep falls all the way to the front,
  Undertow is hitting front-hex enemies &#x2014; so <b>Riptide finally
  pays on it</b>, at 776 a body. It is the one case her passive and her
  sweep agree on, and she does not get to choose when it happens. (A
  boss is the other exception, in the other direction: it spans every
  hex, so it always satisfies the printed row and nothing collapses.)</p>

  <h2><span class="glyph">&#x2248;</span> Drain the Line</h2>
  <p class="section-sub">Her hex sits in the <b>centre</b>, and it is
  the one place her two halves agree: 15% on <em>any</em> hit to knock
  20% off the victim's action bar. Per-hit, not per-cast &mdash; which
  is the one advantage Undertow has left.</p>
  <div class="maths-wrap">
    <table class="maths">
      <thead><tr><th>Cast, from the centre hex</th><th class="num">Hits</th><th class="num">Chance of at least one drain</th></tr></thead>
      <tbody>
        <tr><td class="lab">Tide Lash / Maelstrom Spear</td><td class="num">1</td><td class="num">15.0%</td></tr>
        <tr><td class="lab">Undertow, two back-liners</td><td class="num">2</td><td class="num">27.8%</td></tr>
        <tr><td class="lab">Undertow, a full back row</td><td class="num">3</td><td class="num"><span class="big">38.6%</span></td></tr>
      </tbody>
    </table>
  </div>
  <p class="section-sub" style="margin-top:16px">And the centre costs
  her nothing: Riptide reads the <em>target's</em> hex, not hers, so
  she keeps the full passive while standing where the drain lives.</p>

  <h2><span class="glyph">&#x2248;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Tide Lash</h3>
      <div class="meta">One enemy &middot; <b>110% ATK</b> &rarr; 160%</div>
      <p>Five straight power rungs, no gate, no rider. The largest
      no-cooldown multiplier she can reach, and against a front-hex
      target it is <span class="warm">200% of her attack</span> once
      Riptide is counted &#x2014; on a button she can press every single
      turn.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power <i>&middot; max Lv 6</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 7 &rarr; 5 fully levelled</div>
      <h3>Undertow</h3>
      <div class="meta">Enemy back row &middot; <b>90% ATK</b> &rarr; 130%</div>
      <p>Her only sweep, and her only awkward button. It goes where
      Riptide does not, and it needs two or three bodies back there to
      beat simply pressing Tide Lash again. Two of its six rungs go to
      the cooldown rather than the number.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 7</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 8 &rarr; 6 fully levelled</div>
      <h3>Maelstrom Spear</h3>
      <div class="meta">One enemy &middot; <b>240% ATK</b> &rarr; 290%</div>
      <p>The kill. <span class="warm">1,733 before mitigation</span>
      into a front-hex target at cap, off a 4-star &#x2014; and the
      cleanest place on the roster to spend somebody else's damage-taken
      debuff. Vex's Doom Mark takes this number to <span class="warm">2,600</span>.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; +10% power &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 8</i></div>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Riptide</h3>
      <div class="meta">Enemies on a <b>front</b> hex</div>
      <p><b>+25% damage</b>, on everything she throws at them. Reads the
      target's hex rather than her own, so it costs her no positioning
      &#x2014; but it is also the reason Undertow reads as a different
      hero's skill.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Centre hex</div>
      <h3>Drain the Line</h3>
      <div class="meta">Centre &middot; <b>15% per hit</b> to strip 20% action bar</div>
      <p>The only tempo she has, and she shares it with nobody &#x2014;
      no other hero on the roster carries this hex. Rolled per hit,
      which quietly makes her sweep her best tempo button even when it
      is her worst damage button.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x2248;</span> How to build her</h2>
  <p class="section-sub">A pure striker with no gates to close is the
  simplest ladder in the game: every rung she takes is either a bigger
  number or a shorter wait.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Tide Lash first.</b> Five power rungs on
      a skill with no cooldown is the highest-value levelling on her
      sheet, by a distance.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>ATK, crit, ATK.</b> Every skill reads
      one stat. There is no second consideration and no rider to feed
      &#x2014; the whole kit is one number.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Then anything that keeps her alive.</b>
      860 HP behind 71 DEF is the frailest body in the game. She does
      not need to be tanky; she needs to survive one hit she did not
      expect.</div>
  </div>

  <h2><span class="glyph">&#x2248;</span> The two-hero sect</h2>
  <p class="section-sub">Every other sect fields nine. <b>The Hedge
  fields two</b> &#x2014; Coral and Vex, and no one else. The two kits
  read like one hero split down the middle, which is either the point of
  the sect or the reason it never grew.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Vex marks.</b> A capped Doom Mark puts
      +50% damage taken on one body for five turns, and holds -30% DEF
      on the whole enemy team permanently.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Coral collects.</b> She is the largest
      single number a 4-star can point at a marked target, and she has
      nothing else to do with her turn.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Neither survives being looked at.</b>
      The lowest health pool in the game and one of the softest, on the
      same team. The Hedge wants seven allies it does not have.</div>
  </div>

  <h2><span class="glyph">&#x2248;</span> Frames</h2>
  <p class="section-sub">Eight strips, and only two casts among them
  &#x2014; the staff sweep serves <b>both</b> Tide Lash and Undertow,
  with the spinning burst kept for the spear. Three fidgets, all of them
  long. Authored facing right; the files ship untouched.</p>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">Staff at rest, water moving.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">Sixteen frames, the longest.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">A turn of the shaft.</div></div>
    <div class="clip"><img src="%%fidget3%%" alt="Idle fidget three"><div class="cap"><b>Fidget III</b> &middot; %%nf_fidget3%%f</div><div class="note">Settling the stance.</div></div>
    <div class="clip"><img src="%%ready%%" alt="Ready stance"><div class="cap"><b>Ready</b> &middot; %%nf_ready%%f</div><div class="note">Her turn; the tide gathers.</div></div>
    <div class="clip"><img src="%%lash%%" alt="Tide Lash"><div class="cap"><b>Tide Lash</b> &middot; %%nf_lash%%f</div><div class="note">Also serves Undertow.</div></div>
    <div class="clip"><img src="%%spear%%" alt="Maelstrom Spear"><div class="cap"><b>Maelstrom Spear</b> &middot; %%nf_spear%%f</div><div class="note">Six frames; the spin is the tell.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">Nine frames, frozen on the last.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Water</div></div>
    <div><div class="k">Rarity</div><div class="v">4&#x2605;</div></div>
    <div><div class="k">Role</div><div class="v">Striker</div></div>
    <div><div class="k">Sect</div><div class="v">Hedge &middot; No. 3</div></div>
  </div>

  <p class="foot">Sheet drawn from the live hero definition
  (js/data/heroes/humans.js) and the uploaded spritesheets, untouched.
  Play at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a>.</p>
</div>
'''

for name, uri in IMG.items():
    html = html.replace(f'%%{name}%%', uri)
    html = html.replace(f'%%nf_{name}%%', str(NF[name]))

out = '/home/user/browsergacha/docs/coral-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
print('frames:', NF)
