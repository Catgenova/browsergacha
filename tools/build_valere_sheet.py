import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Valere'
PANEL = (28, 18, 28, 255)   # --panel-2, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('valereidle.png',   7, 'idle'),
    ('valereidle1.png',  6, 'fidget1'),
    ('valereidle2.png',  7, 'fidget2'),
    ('valereskill1.png', 11, 'rose'),
    ('valereskill2.png', 11, 'bouquet'),
    ('valereskill3.png', 11, 'rarer'),
    ('valeredeath.png',   8, 'death'),
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

html = r'''<title>Valere, Suitor of the Nightflowers</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Marcellus&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: a calling card left on a dark
     table. Aubergine ground, ivory for his gloves and cravat, and one
     deep rose red for the flower he is holding out -- the only warm
     color anywhere on the page, used only where the gift is. Marcellus,
     an engraved Roman capital, because he is a man with a card case.
     Every color painted explicitly. */
  :root {
    --ground: #0e090e;
    --panel: #140d14;
    --panel-2: #1c121c;
    --line: #3e2a3e;
    --ink: #f2ecef;
    --muted: #a1909e;
    --rose: #d4485e;
    --rose-dim: #7a2838;
    --ivory: #efe6dc;
    --display: 'Marcellus', 'Georgia', serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink);
    font-family: var(--mono); font-size: 15px; line-height: 1.65; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }
  .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px; }
  .eyebrow b { color: var(--rose); font-weight: 500; }
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art { flex: 0 0 300px; position: relative;
    background: radial-gradient(ellipse 62% 46% at 50% 62%, rgba(212,72,94,.13), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--rose-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--rose); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-size: 68px; line-height: 1.06;
    color: var(--ink); text-wrap: balance; letter-spacing: 4px;
    text-shadow: 0 4px 0 rgba(0,0,0,.55), 0 0 34px rgba(212,72,94,.20); }
  .title-line { font-size: 15px; color: var(--rose); letter-spacing: 3px;
    font-family: var(--display); }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.light { border-color: var(--rose-dim); color: var(--rose); }
  .badge.sect { border-color: var(--ivory); color: var(--ivory); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-size: 24px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.35; }
  .stat.spd .v { color: var(--rose); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  h2 { font-family: var(--display); font-size: 26px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 2px; }
  h2 .glyph { color: var(--rose); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .engine-box { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    justify-content: center; font-size: 13px; color: var(--muted); text-align: center; }
  .engine-step { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 250px; }
  .engine-step b { color: var(--rose); font-weight: 500; }
  .engine-arrow { color: var(--rose-dim); font-size: 20px; }
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--rose-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-size: 19px; letter-spacing: 1px; }
  .ability .ladder { margin-top: 10px; padding-top: 9px;
    border-top: 1px solid var(--line); font-family: var(--mono);
    font-size: 11px; line-height: 1.7; color: var(--muted); }
  .ability .ladder b { color: var(--ink); font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase; font-size: 10px; }
  .ability .ladder i { font-style: normal; color: var(--ink); }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--ivory); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--rose); font-weight: 500; }
  .ability.passive-card { border-color: var(--rose-dim); }

  /* Who the door is opened for. */
  .guests { background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; overflow-x: auto; }
  .guests table { width: 100%; border-collapse: collapse; min-width: 520px; }
  .guests th, .guests td { text-align: left; padding: 12px 18px;
    border-bottom: 1px solid var(--line); font-size: 13px; }
  .guests thead th { font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
    color: var(--muted); font-weight: 400; background: var(--panel); }
  .guests tbody tr:last-child td { border-bottom: none; }
  .guests td.who { font-family: var(--display); font-size: 16px; color: var(--rose);
    letter-spacing: 1px; }
  .guests td.what { color: var(--muted); }

  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }
  .acquire { margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap; align-items: baseline; }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-size: 16px; color: var(--rose); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--rose); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>4&#x2605; Dark &middot; Nightflower &middot; No. 6</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Valere idle animation, a top-hatted dandy with a huge bouquet, offering a single dark rose" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 4</span></div>
      <h1>VALERE</h1>
      <div class="title-line">Suitor of the Nightflowers</div>
      <div class="badges">
        <span class="badge light">Dark</span>
        <span class="badge">Back Support</span>
        <span class="badge">Debuff &middot; Enable &middot; Transfer</span>
        <span class="badge sect">Nightflower &middot; No. 6</span>
      </div>
      <p class="lede">Not a curse-flinger &#x2014; a <b>suitor</b>. Everything
      he does is <em>presented</em> rather than thrown. He is the sect's
      door-opener: strip the enemy's Resistance and every affliction the
      rest of them throw simply <b>sticks</b>. And when his own side is
      the one suffering, he gathers it up and <b>hands it to somebody
      else</b>.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1310</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">112</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">96</div></div>
    <div class="stat spd"><div class="k">SPD</div><div class="v">114</div><div class="sub">he goes first, on purpose</div></div>
  </div>

  <h2><span class="glyph">&#x2740;</span> Nobody else lowers Resistance</h2>
  <p class="section-sub">Resistance is the stat every debuff in the game
  is rolled against, and until Valere the only hero who touched it was
  Posie &#x2014; raising it, on your own side. Taking it <em>off</em> the
  enemy was an empty seat. It is now his.</p>
  <div class="engine-box">
    <div class="engine-step"><b>The Whole Bouquet</b> takes <b>30%
      Resistance</b> off the entire enemy team.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Everything after it lands.</b> Poison,
      threads, taunts, seals &#x2014; all rolled against a number he
      just removed.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>And he cannot be refused</b> by anyone
      already carrying something.</div>
  </div>

  <h2><span class="glyph">&#x2740;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>A Rose For You</h3>
      <div class="meta">Single enemy &middot; <b>90% ATK &middot; -30% ATK, 2 turns</b></div>
      <p>A gift they can rarely refuse: <b>90% ATK</b>, and a <b>50% chance</b> their attack falls
      <b>30% for two turns</b>. Handed over personally.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +20% land chance &rsaquo; +20% land chance &rsaquo; +10% land chance &rsaquo; +10% effect <i>&middot; max Lv 6</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 5 &rarr; 3 fully levelled</div>
      <h3>The Whole Bouquet</h3>
      <div class="meta">All enemies &middot; <b>-30% Resistance &middot; -20% DEF, 2 turns</b></div>
      <p>Every bloom at once. Two <b>50%</b> rolls made apart on every enemy &#x2014; one for
      <b>-30% Resistance</b>, one for <b>-20% DEF</b>. This is the turn that makes the other
      five Nightflowers work.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +20% land chance &rsaquo; +20% land chance &rsaquo; +10% land chance &rsaquo; +10% effect &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 7</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 8 &rarr; 6 fully levelled</div>
      <h3>Something Rarer</h3>
      <div class="meta">Single enemy &middot; <b>the whole bouquet, and -30% DEF</b></div>
      <p>He presents one enemy with everything his own side was carrying:
      <b>every debuff and poison on his team moves onto them</b>, with the
      time it had left. A separate <b>50%</b> roll drops their DEF <b>30% for three
      turns</b> on top &#x2014; bought to certain, never a dead turn.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +20% land chance &rsaquo; +20% land chance &rsaquo; +10% land chance &rsaquo; +10% effect &rsaquo; +10% effect &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 8</i></div>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Nothing Is Refused</h3>
      <div class="meta">Against anyone already afflicted</div>
      <p>He cannot force the first flower on anyone &#x2014; but a debuff he lays on an enemy <b>already carrying one can never
      be resisted</b>. The 50% gate still has to open first &#x2014; the
      passive beats their Resistance, not his own roll. Take one and you
      take the rest.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Back hex</div>
      <h3>Long Stems</h3>
      <div class="meta">Back &middot; <b>+1 turn on his debuffs</b></div>
      <p>Cut long, they keep: every debuff Valere inflicts lasts <b>one
      turn longer</b> while he holds a back hex &#x2014; the Bouquet
      included.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x2740;</span> Who the door is opened for</h2>
  <p class="section-sub">Valere does almost nothing on his own. What he
  is worth is measured in what the rest of the sect gets to land once he
  has been round with the bouquet.</p>
  <div class="guests">
    <table>
      <thead>
        <tr><th>Nightflower</th><th class="what">What they need to stick</th><th>What the Bouquet does for it</th></tr>
      </thead>
      <tbody>
        <tr><td class="who">Sable</td><td class="what">poison, on everyone</td><td>Two skills that seed the whole field, all rolled</td></tr>
        <tr><td class="who">Lysandra</td><td class="what">the Soul Bond, and a row-wide taunt</td><td>One thread at a time &#x2014; a refusal costs a whole cooldown</td></tr>
        <tr><td class="who">Morrow</td><td class="what">a taunt on the entire enemy team</td><td>Five separate rolls on one cast</td></tr>
        <tr><td class="who">Noctelle</td><td class="what">-30% Speed on the back row</td><td>Her only debuff, and the reason she is fast</td></tr>
        <tr><td class="who">Sawyer</td><td class="what">two scattered debuffs a swing</td><td>His passive pays per debuff on the target</td></tr>
      </tbody>
    </table>
  </div>

  <h2><span class="glyph">&#x2740;</span> Frames</h2>
  <p class="section-sub">Seven strips at nine frames each. Watch his
  hands: the first offers one rose and ends empty, the second lights
  every bloom he is carrying at once, and the third turns the whole
  bouquet a different colour.</p>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">Waiting to be asked.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">Adjusting the brim.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">Turning a stem over.</div></div>
    <div class="clip"><img src="%%rose%%" alt="A Rose For You"><div class="cap"><b>A Rose For You</b> &middot; %%nf_rose%%f</div><div class="note">Skill 1 &#x2014; and his hand ends empty.</div></div>
    <div class="clip"><img src="%%bouquet%%" alt="The Whole Bouquet"><div class="cap"><b>The Whole Bouquet</b> &middot; %%nf_bouquet%%f</div><div class="note">Skill 2 &#x2014; every bloom at once.</div></div>
    <div class="clip"><img src="%%rarer%%" alt="Something Rarer"><div class="cap"><b>Something Rarer</b> &middot; %%nf_rarer%%f</div><div class="note">Skill 3 &#x2014; a different colour entirely.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">The bouquet goes down first.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Dark</div></div>
    <div><div class="k">Rarity</div><div class="v">4&#x2605;</div></div>
    <div><div class="k">Role</div><div class="v">Back Support</div></div>
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

out = '/home/user/browsergacha/docs/valere-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
