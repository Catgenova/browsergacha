import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Asher'
PANEL = (20, 16, 26, 255)   # --panel-2, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('asheridle.png',   7, 'idle'),
    ('asheridle1.png',  6, 'fidget1'),
    ('asheridle2.png',  7, 'fidget2'),
    ('asherskill1.png', 11, 'downstroke'),
    ('asherskill2.png', 11, 'helping'),
    ('asherskill3.png', 11, 'nothing'),
    ('asherdeath.png',   8, 'death'),
]

def clip(fname, fps):
    im = Image.open(f'{SRC}/{fname}').convert('RGBA')
    w, h = im.size
    frames = max(1, round(w / h))
    fw = w // frames
    cells = []
    for i in range(frames):
        # Authored facing right (the hammer lands on the right in both
        # skill strips); drawn as delivered.
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

html = r'''<title>Asher, Bell Thief of the Whisperchime</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,700;9..144,900&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: a lamp-lit room after the silver is
     gone. Ink-violet ground, bone-white text, and one bar of stolen
     purple -- the same purple the battle log floats when a blessing
     changes hands -- with brass reserved strictly for numbers he took.
     Fraunces at 900 for the display, because he is heavy and pleased
     with himself. Every color painted explicitly. */
  :root {
    --ground: #0b0910;
    --panel: #100d16;
    --panel-2: #17131f;
    --line: #372c47;
    --ink: #f1ecf5;
    --muted: #9d92ae;
    --stolen: #c79aff;
    --stolen-dim: #6a4e92;
    --brass: #d9ab63;
    --bone: #e6dfd2;
    --display: 'Fraunces', 'Georgia', serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink);
    font-family: var(--mono); font-size: 15px; line-height: 1.65; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }
  .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px; }
  .eyebrow b { color: var(--stolen); font-weight: 500; }
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art { flex: 0 0 300px; position: relative;
    background: radial-gradient(ellipse 62% 46% at 50% 62%, rgba(199,154,255,.14), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--stolen-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--brass); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 900; font-size: 74px; line-height: 1.02;
    color: var(--ink); text-wrap: balance; letter-spacing: -1px;
    text-shadow: 0 4px 0 rgba(0,0,0,.55), 0 0 34px rgba(199,154,255,.24); }
  .title-line { font-size: 15px; color: var(--stolen); letter-spacing: 2px;
    font-family: var(--display); font-weight: 400; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.light { border-color: var(--stolen-dim); color: var(--stolen); }
  .badge.sect { border-color: var(--bone); color: var(--bone); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-weight: 700; font-size: 24px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.35; }
  .stat.atk .v { color: var(--brass); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  h2 { font-family: var(--display); font-weight: 400; font-size: 26px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 0; }
  h2 .glyph { color: var(--stolen); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .engine-box { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    justify-content: center; font-size: 13px; color: var(--muted); text-align: center; }
  .engine-step { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 250px; }
  .engine-step b { color: var(--stolen); font-weight: 500; }
  .engine-arrow { color: var(--stolen-dim); font-size: 20px; }
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--stolen-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 700; font-size: 19px; letter-spacing: 0; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--bone); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--stolen); font-weight: 500; }
  .ability.passive-card { border-color: var(--stolen-dim); }

  /* The ledger: what leaves them, what he puts on, what it is worth. */
  .ledger { background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; overflow-x: auto; }
  .ledger table { width: 100%; border-collapse: collapse; min-width: 520px; }
  .ledger th, .ledger td { text-align: left; padding: 12px 18px;
    border-bottom: 1px solid var(--line); font-size: 13px; }
  .ledger thead th { font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
    color: var(--muted); font-weight: 400; background: var(--panel); }
  .ledger tbody tr:last-child td { border-bottom: none; }
  .ledger td.n { font-variant-numeric: tabular-nums; text-align: right;
    font-family: var(--display); font-weight: 700; font-size: 17px; color: var(--brass); }
  .ledger td.who { color: var(--muted); }
  .ledger td b { color: var(--stolen); font-weight: 500; }
  .ledger tbody tr.total td { background: var(--panel); }
  .ledger tbody tr.total td.n { color: var(--stolen); font-size: 20px; }

  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }
  .acquire { margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap; align-items: baseline; }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-weight: 700; font-size: 16px; color: var(--stolen); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--stolen); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>5&#x2605; Wind &middot; Whisperchime &middot; No. 7</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Asher idle animation, a hammer-carrying front-line fighter shifting his weight" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 5</span></div>
      <h1>ASHER</h1>
      <div class="title-line">Bell Thief of the Whisperchime</div>
      <div class="badges">
        <span class="badge light">Wind</span>
        <span class="badge">Front-line DPS</span>
        <span class="badge">Steal &middot; Seal &middot; Snowball</span>
        <span class="badge sect">Whisperchime &middot; No. 7</span>
      </div>
      <p class="lede">The one member of the sect who gets <b>stronger for
      meeting a buffed enemy team</b>. Everyone else tears blessings off
      and drops them; Asher <b>puts them on</b>. His passive pays
      <b>25% for every buff he is wearing</b>, so the swing that undresses
      their carry is the same swing that dresses him &#x2014; and his
      third skill shuts the door behind it, so their support cannot put
      any of it back.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">2000</div></div>
    <div class="stat atk"><div class="k">ATK</div><div class="v">245</div><div class="sub">before anything he steals</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">150</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">106</div><div class="sub">+30% accuracy on a front hex</div></div>
  </div>

  <h2><span class="glyph">&#x2749;</span> Theft is not a strip</h2>
  <p class="section-sub">Galen tears blessings off and they are gone.
  Tumble tears them off and gets paid in turn meter. Asher takes them
  <em>intact</em> &#x2014; the same stat, the same size, whatever turns
  it had left &#x2014; and they finish their duration on him instead.
  Two things move at once, and both of them move his way.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Off them.</b> Their carry loses the ATK
      buff their support just spent a turn casting.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Onto him.</b> Same buff, same timer, now
      credited to Asher rather than the support who cast it.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>And it pays twice.</b> Borrowed Weather
      adds <b>+25%</b> for it &#x2014; on top of the stat itself.</div>
  </div>

  <h2><span class="glyph">&#x2749;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Downstroke</h3>
      <div class="meta">Single enemy &middot; <b>130% ATK</b></div>
      <p>The hammer comes down on one of them for <b>130% ATK</b>. No
      trick to it &#x2014; but it is the swing that cashes in everything
      the other two skills put on him.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 3</div>
      <h3>Helping Myself</h3>
      <div class="meta">Single enemy &middot; <b>150% ATK &middot; steal 1 buff</b></div>
      <p><b>150% ATK</b>, and <b>one buff comes off them and onto
      Asher</b> with whatever time it had left.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 5</div>
      <h3>Nothing For You</h3>
      <div class="meta">Single enemy &middot; <b>175% ATK &middot; steal 2 &middot; seal 3 turns</b></div>
      <p><b>175% ATK</b>, <b>two</b> of their buffs move onto Asher, and
      the target is <b>sealed against every new blessing for 3
      turns</b> &#x2014; their healer can still heal them, but nobody can
      rebuild what he just took.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Borrowed Weather</h3>
      <div class="meta">Scales with his own buffs</div>
      <p><b>+25% damage for every buff Asher is carrying</b> &#x2014; his
      own, his supports', and everything he has taken. Four buffs is
      <b>&times;2.00</b>.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Front hex</div>
      <h3>Clapper</h3>
      <div class="meta">Front &middot; <b>+30% accuracy</b></div>
      <p>The striker inside the bell, and it never misses the rim:
      <b>+30% accuracy</b>, which is what every theft and every seal is
      rolled against.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x2749;</span> One rotation into a rallied team</h2>
  <p class="section-sub">Assume the enemy carry opens under three
  blessings from their own support. This is what Asher's next three
  turns are worth, counting only the passive &#x2014; the stolen stats
  themselves are on top.</p>
  <div class="ledger">
    <table>
      <thead>
        <tr><th>Turn</th><th>What he does</th><th class="who">Buffs on him</th><th style="text-align:right">Borrowed Weather</th></tr>
      </thead>
      <tbody>
        <tr><td>1</td><td><b>Nothing For You</b> &#x2014; 175%, takes two, seals for 3</td><td class="who">2</td><td class="n">&times;1.50</td></tr>
        <tr><td>2</td><td><b>Helping Myself</b> &#x2014; 150%, takes their last one</td><td class="who">3</td><td class="n">&times;1.75</td></tr>
        <tr><td>3</td><td><b>Downstroke</b> &#x2014; 130%, wearing all of it</td><td class="who">3</td><td class="n">&times;1.75</td></tr>
        <tr class="total"><td>&mdash;</td><td>Their support recasts into the seal</td><td class="who">3</td><td class="n">refused</td></tr>
      </tbody>
    </table>
  </div>

  <h2><span class="glyph">&#x2749;</span> What the seal does and does not stop</h2>
  <p class="section-sub">Nothing For You writes an ordinary debuff, which
  means it plays by every rule the rest of them play by.</p>
  <div class="engine-box">
    <div class="engine-step"><b>It is rolled.</b> Accuracy against
      resistance, like any debuff &#x2014; a high-resistance boss can
      simply refuse it.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>It cleanses.</b> Any cleanse lifts it
      early, and it expires on its own after 3 turns.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Stat buffs only.</b> Heals, heals-over-time,
      shields and bubbles all still reach the sealed target.</div>
  </div>

  <h2><span class="glyph">&#x2749;</span> Frames</h2>
  <p class="section-sub">Seven strips at nine frames each: a breathing
  idle with two fidgets, a hammer for each skill, and a fall.</p>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">Weight on the back foot.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">Rolling the haft over.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">Sizing up what they are wearing.</div></div>
    <div class="clip"><img src="%%downstroke%%" alt="Downstroke"><div class="cap"><b>Downstroke</b> &middot; %%nf_downstroke%%f</div><div class="note">Skill 1 &#x2014; straight overhead.</div></div>
    <div class="clip"><img src="%%helping%%" alt="Helping Myself"><div class="cap"><b>Helping Myself</b> &middot; %%nf_helping%%f</div><div class="note">Skill 2 &#x2014; the thrust that lifts it.</div></div>
    <div class="clip"><img src="%%nothing%%" alt="Nothing For You"><div class="cap"><b>Nothing For You</b> &middot; %%nf_nothing%%f</div><div class="note">Skill 3 &#x2014; the full swing, and the door.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">Everything he took goes with him.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Wind</div></div>
    <div><div class="k">Rarity</div><div class="v">5&#x2605;</div></div>
    <div><div class="k">Role</div><div class="v">Front-line DPS</div></div>
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

out = '/home/user/browsergacha/docs/asher-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
