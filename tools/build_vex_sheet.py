import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/vex'
PANEL = (22, 16, 31, 255)   # --panel-2, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('vexidle.png',   5, 'idle'),
    ('vexidle1.png',  7, 'fidget1'),
    ('vexidle2.png',  7, 'fidget2'),
    ('vexidle3.png',  7, 'fidget3'),
    ('vexready.png',  7, 'ready'),
    ('vexskill1.png', 10, 'pin'),
    ('vexskill2.png', 10, 'malaise'),
    ('vexskill3.png', 10, 'doom'),
    ('vexdeath.png',   7, 'death'),
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

html = r'''<title>Vex, Doll Witch of the Hedge</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Grenze+Gotisch:wght@500;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: candle-light in a curtained room.
     Bruise-violet on near-black, with the brass of the pin kept for the
     numbers that matter and a thin red reserved for the rolls she
     loses. Grenze Gotisch on the display -- a spiked face that still
     reads clean at 60px. Every color painted explicitly. */
  :root {
    --ground: #0d0812;
    --panel: #120c19;
    --panel-2: #16101f;
    --line: #38254c;
    --ink: #ece6f4;
    --muted: #9d8bb0;
    --violet: #b98fe0;
    --violet-dim: #6c4a94;
    --brass: #d9b871;
    --miss: #e0788f;
    --display: 'Grenze Gotisch', 'Palatino Linotype', serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink);
    font-family: var(--mono); font-size: 15px; line-height: 1.65; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }
  .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px; }
  .eyebrow b { color: var(--violet); font-weight: 500; }
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art { flex: 0 0 300px; position: relative;
    background: radial-gradient(ellipse 60% 44% at 50% 62%, rgba(185,143,224,.16), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--violet-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--violet); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 700; font-size: 70px; line-height: 1.02;
    color: var(--ink); text-wrap: balance; letter-spacing: 2px;
    text-shadow: 0 4px 0 rgba(0,0,0,.55), 0 0 34px rgba(185,143,224,.3); }
  .title-line { font-size: 15px; color: var(--violet); letter-spacing: 2px;
    font-family: var(--display); }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.dark { border-color: var(--violet-dim); color: var(--violet); }
  .badge.sect { border-color: var(--brass); color: var(--brass); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-size: 26px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.3; }
  .stat.spd .v { color: var(--violet); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  h2 { font-family: var(--display); font-weight: 700; font-size: 27px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 1px; }
  h2 .glyph { color: var(--violet); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .section-sub b { color: var(--ink); font-weight: 500; }
  .engine-box { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    justify-content: center; font-size: 13px; color: var(--muted); text-align: center; }
  .engine-step { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 250px; }
  .engine-step b { color: var(--violet); font-weight: 500; }
  .engine-arrow { color: var(--violet-dim); font-size: 20px; }
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--violet-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 700; font-size: 22px; letter-spacing: 1px; }
  .ability .ladder { margin-top: 10px; padding-top: 9px;
    border-top: 1px solid var(--line); font-family: var(--mono);
    font-size: 11px; line-height: 1.7; color: var(--muted); }
  .ability .ladder b { color: var(--ink); font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase; font-size: 10px; }
  .ability .ladder i { font-style: normal; color: var(--ink); }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--brass); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--violet); font-weight: 500; }
  .ability p .roll { color: var(--miss); font-weight: 500; }
  .ability.passive-card { border-color: var(--violet-dim); }
  .maths { width: 100%; border-collapse: collapse; font-size: 13px;
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; overflow: hidden; }
  .maths th { text-align: left; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
    color: var(--muted); font-weight: 400; padding: 12px 16px; border-bottom: 2px solid var(--line); }
  .maths th.num, .maths td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .maths td { padding: 10px 16px; border-bottom: 1px solid var(--line); color: var(--ink); }
  .maths tr:last-child td { border-bottom: none; }
  .maths td.lab { color: var(--muted); }
  .maths td .big { color: var(--violet); font-weight: 600; }
  .maths td .bad { color: var(--miss); }
  .maths tr.closed td { background: rgba(185,143,224,.08); }
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
  .acquire .v { font-family: var(--display); font-size: 18px; color: var(--violet); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--violet); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>4&#x2605; Dark &middot; Hedge &middot; No. 3</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Vex idle animation, a crouched witch cradling a pinned doll" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 4</span></div>
      <h1>VEX</h1>
      <div class="title-line">Doll Witch of the Hedge</div>
      <div class="badges">
        <span class="badge dark">Dark</span>
        <span class="badge">Debuffer</span>
        <span class="badge">Five gates &middot; all 50%</span>
        <span class="badge sect">Hedge &middot; No. 3</span>
      </div>
      <p class="lede">Five separate application rolls across three
      skills &#x2014; <b>more gated effects than any other hero on the
      roster</b>. Nothing she does is guaranteed at level one and
      everything she does is guaranteed at cap. Levelling Vex does not
      make her hex harder. It makes her hex <b>certainly</b>.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">965</div><div class="sub">she is not meant to be hit</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">155</div><div class="sub">one skill reads it</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">81</div></div>
    <div class="stat spd"><div class="k">SPD</div><div class="v">115</div><div class="sub">5th fastest on the roster</div></div>
  </div>

  <h2><span class="glyph">&#x203B;</span> Levelling buys certainty</h2>
  <p class="section-sub">Every debuff in the game rolls a <b>50% land
  chance before the accuracy contest even begins</b> &mdash; a failed
  gate reads MISS, not RESIST, and it is the only kind of failure a
  skill-up can remove. Vex carries five of those gates. Doom Mark
  carries two of them at once, which makes it the clearest picture of
  what her skill levels actually buy:</p>
  <div class="maths-wrap">
    <table class="maths">
      <thead><tr><th>Doom Mark at&hellip;</th><th class="num">Each half lands</th><th class="num">Both halves</th><th class="num">Exactly one</th><th class="num">Neither</th></tr></thead>
      <tbody>
        <tr><td class="lab">Level 1</td><td class="num">50%</td><td class="num">25%</td><td class="num">50%</td><td class="num"><span class="bad">25%</span></td></tr>
        <tr><td class="lab">Level 2</td><td class="num">70%</td><td class="num">49%</td><td class="num">42%</td><td class="num"><span class="bad">9%</span></td></tr>
        <tr><td class="lab">Level 3</td><td class="num">90%</td><td class="num">81%</td><td class="num">18%</td><td class="num"><span class="bad">1%</span></td></tr>
        <tr class="closed"><td class="lab">Level 4 &mdash; gate closed</td><td class="num">100%</td><td class="num"><span class="big">100%</span></td><td class="num">0%</td><td class="num">0%</td></tr>
      </tbody>
    </table>
  </div>
  <p class="section-sub" style="margin-top:16px">A quarter of level-one
  Doom Marks do nothing at all. Three rungs later that number is zero,
  and the four rungs above it are pure profit &mdash; deeper numbers and
  two turns off the cooldown. <b>Creeping Malaise closes on the same
  schedule</b> (levels 1&ndash;4); Pinprick's chance rungs sit higher up
  its ladder and close at its cap of 6.</p>

  <h2><span class="glyph">&#x203B;</span> How long a hex sticks</h2>
  <p class="section-sub">Her passive adds a turn to everything she
  lands. Her hex &mdash; <b>Hexweaver, on the back row</b> &mdash; adds
  another one on top, and the two stack rather than overwriting. She is
  the only hero on the roster carrying either.</p>
  <div class="maths-wrap">
    <table class="maths">
      <thead><tr><th>Hex, at cap</th><th class="num">Printed</th><th class="num">+ Vile Persistence</th><th class="num">+ back hex</th><th class="num">Cooldown</th></tr></thead>
      <tbody>
        <tr><td class="lab">Pinprick &mdash; -15% ATK</td><td class="num">2</td><td class="num">3</td><td class="num"><span class="big">4</span></td><td class="num">none</td></tr>
        <tr class="closed"><td class="lab">Creeping Malaise &mdash; -30% DEF, -20% SPD, all enemies</td><td class="num">2</td><td class="num">3</td><td class="num"><span class="big">4</span></td><td class="num">4</td></tr>
        <tr><td class="lab">Doom Mark &mdash; +50% damage taken, -40% ATK</td><td class="num">3</td><td class="num">4</td><td class="num"><span class="big">5</span></td><td class="num">6</td></tr>
      </tbody>
    </table>
  </div>
  <p class="section-sub" style="margin-top:16px">Read the highlighted
  row twice. A fully-levelled Creeping Malaise lasts <b>four turns and
  comes back off cooldown in four</b> &mdash; from the back hex, a
  maxed Vex holds <b>-30% DEF and -20% SPD on the entire enemy team,
  permanently</b>, recasting on the turn it would have expired. Doom
  Mark is five turns on a six-turn cooldown: one turn of daylight in
  six.</p>

  <h2><span class="glyph">&#x203B;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Pinprick</h3>
      <div class="meta">One enemy &middot; <b>90% ATK</b> &rarr; 110% &middot; -15% ATK, 2 turns</div>
      <p>Her only attack, and the only place her ATK stat is read at
      all. <span class="roll">50% to land the hex</span> &#x2014; bought
      to certain by the top three rungs, which is why the damage rungs
      sit at the bottom where they can be taken early.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +10% power &rsaquo; +20% land chance &rsaquo; +20% land chance &rsaquo; +10% land chance <i>&middot; max Lv 6</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 6 &rarr; 4 fully levelled</div>
      <h3>Creeping Malaise</h3>
      <div class="meta">ALL enemies &middot; <b>-25% DEF</b> &rarr; -30% &middot; <b>-15% SPD</b> &rarr; -20%</div>
      <p>Two curses over the whole enemy line, and <span class="roll">each
      is its own 50% roll</span> &#x2014; the two are rolled apart, so an
      enemy can take the slowdown without the armour break, or neither.
      Her best button and
      the one to level first: it is the team debuff the rest of the
      roster is priced against.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +20% land chance &rsaquo; +20% land chance &rsaquo; +10% land chance &rsaquo; +5% effect &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 7</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 8 &rarr; 6 fully levelled</div>
      <h3>Doom Mark</h3>
      <div class="meta">One enemy &middot; <b>+40% damage taken</b> &rarr; +50% &middot; <b>-30% ATK</b> &rarr; -40%</div>
      <p>Condemn one body: it hits harder for everyone else and hits
      back softer. <span class="roll">Two independent 50% rolls</span>,
      both of them closable. The damage half is a multiplier on the
      whole team's output, which makes Vex a damage skill worn by
      somebody else.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +20% land chance &rsaquo; +20% land chance &rsaquo; +10% land chance &rsaquo; +5% effect &rsaquo; +5% effect &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 8</i></div>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Vile Persistence</h3>
      <div class="meta">Every debuff she lands</div>
      <p><b>+1 turn</b>, on all five of them. Unique to Vex &#x2014; no
      other hero's passive lengthens a hex, and it is what turns her
      two-turn curses into something the enemy team never gets out
      from under.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Back hex</div>
      <h3>Hexweaver</h3>
      <div class="meta">Back row &middot; <b>+20% debuff Accuracy</b> and <b>+1 more turn</b></div>
      <p>Also unique to her. The extra turn stacks with the passive; the
      accuracy is the answer to the <em>other</em> way a hex fails
      &#x2014; the resistance contest, which no skill-up can touch. Put
      her on the back hex and leave her there.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x203B;</span> How to build her</h2>
  <div class="engine-box">
    <div class="engine-step"><b>Skill levels before gear.</b> No
      substat in the game is worth as much to Vex as closing a 50%
      gate. Malaise to 4, Doom Mark to 4, then everything else.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Accuracy, then SPD.</b> Accuracy beats
      resistance; speed decides whether the curse lands before the
      enemy's opener or after it. She is already 5th fastest &mdash;
      push her to first.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Then survival.</b> 965 HP behind 81 DEF
      is a body that dies to one stray cleave. Whatever keeps her
      standing keeps the debuffs up.</div>
  </div>

  <h2><span class="glyph">&#x203B;</span> The two-hero sect</h2>
  <p class="section-sub">Every other sect fields nine. <b>The Hedge
  fields two</b> &#x2014; Vex and Coral, and no one else. It is less a
  sect than a working arrangement, and the two kits read like one hero
  split down the middle.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Vex marks.</b> +50% damage taken on a
      body that is also 30% softer from Malaise, for five turns.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Coral collects.</b> The highest attack
      stat of any 4-star, three skills that do nothing but damage, and a
      passive that pays 25% more into the front row.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Neither survives being looked at.</b>
      Two of the frailest bodies in the game on one team. The Hedge
      wants seven allies it does not have.</div>
  </div>

  <h2><span class="glyph">&#x203B;</span> Frames</h2>
  <p class="section-sub">Nine strips &#x2014; a full set, three fidgets
  and a separate cast for each of the three skills. Her art is a
  crouched pose, so the board draws her <b>25% shorter than the house
  height</b> rather than scaling the crouch away. Authored facing right;
  the files ship untouched.</p>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">Rocking the doll.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">A look up from the work.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">Adjusting the pins.</div></div>
    <div class="clip"><img src="%%fidget3%%" alt="Idle fidget three"><div class="cap"><b>Fidget III</b> &middot; %%nf_fidget3%%f</div><div class="note">The long one, sixteen frames.</div></div>
    <div class="clip"><img src="%%ready%%" alt="Ready stance"><div class="cap"><b>Ready</b> &middot; %%nf_ready%%f</div><div class="note">Her turn; the doll comes up.</div></div>
    <div class="clip"><img src="%%pin%%" alt="Pinprick"><div class="cap"><b>Pinprick</b> &middot; %%nf_pin%%f</div><div class="note">The pin goes in mid-shake.</div></div>
    <div class="clip"><img src="%%malaise%%" alt="Creeping Malaise"><div class="cap"><b>Creeping Malaise</b> &middot; %%nf_malaise%%f</div><div class="note">Wide curse, whole line.</div></div>
    <div class="clip"><img src="%%doom%%" alt="Doom Mark"><div class="cap"><b>Doom Mark</b> &middot; %%nf_doom%%f</div><div class="note">The doll takes hexfire.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">Eight frames, frozen on the last.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Dark</div></div>
    <div><div class="k">Rarity</div><div class="v">4&#x2605;</div></div>
    <div><div class="k">Role</div><div class="v">Debuffer</div></div>
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

out = '/home/user/browsergacha/docs/vex-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
print('frames:', NF)
