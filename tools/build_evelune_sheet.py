import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Evelune'
PANEL = (24, 20, 34, 255)   # --panel-2, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('eveluneidle.png',   7, 'idle'),
    ('eveluneidle1.png',  6, 'fidget1'),
    ('eveluneidle2.png',  7, 'fidget2'),
    ('eveluneskill1.png', 11, 'note'),
    ('eveluneskill2.png', 11, 'again'),
    ('eveluneskill3.png', 10, 'chord'),
    ('evelunedeath.png',   8, 'death'),
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

html = r'''<title>Evelune, First Chair of the Nightflowers</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: a recital hall after dark. Deep
     indigo-plum ground, lily white for her, and warm brass gold for
     everything that is HELD -- the held chord, the returned turn, the
     carried note. Spectral for the display: an engraved, printed-
     programme serif. Every color painted explicitly. */
  :root {
    --ground: #0b0912;
    --panel: #100d18;
    --panel-2: #181422;
    --line: #362c48;
    --ink: #f0ecf6;
    --muted: #9b90ac;
    --brass: #e8c274;
    --brass-dim: #7a6034;
    --lily: #e9e2f2;
    --display: 'Spectral', 'Georgia', serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink);
    font-family: var(--mono); font-size: 15px; line-height: 1.65; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }
  .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px; }
  .eyebrow b { color: var(--brass); font-weight: 500; }
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art { flex: 0 0 300px; position: relative;
    background: radial-gradient(ellipse 62% 46% at 50% 62%, rgba(232,194,116,.13), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--brass-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--brass); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 600; font-size: 70px; line-height: 1.04;
    color: var(--ink); text-wrap: balance; letter-spacing: 1px;
    text-shadow: 0 4px 0 rgba(0,0,0,.55), 0 0 34px rgba(232,194,116,.20); }
  .title-line { font-size: 15px; color: var(--brass); letter-spacing: 2px;
    font-family: var(--display); font-style: italic; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.light { border-color: var(--brass-dim); color: var(--brass); }
  .badge.sect { border-color: var(--lily); color: var(--lily); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-weight: 600; font-size: 24px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.35; }
  .stat.spd .v { color: var(--brass); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  h2 { font-family: var(--display); font-weight: 400; font-size: 26px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 0; }
  h2 .glyph { color: var(--brass); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .engine-box { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    justify-content: center; font-size: 13px; color: var(--muted); text-align: center; }
  .engine-step { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 250px; }
  .engine-step b { color: var(--brass); font-weight: 500; }
  .engine-arrow { color: var(--brass-dim); font-size: 20px; }
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--brass-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 600; font-size: 19px; letter-spacing: 0; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--lily); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--brass); font-weight: 500; }
  .ability.passive-card { border-color: var(--brass-dim); }

  /* Two bars, same blessing: how long it actually stays on. */
  .uptime { background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 24px 20px; display: grid; gap: 18px; }
  .row-lab { font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 6px; }
  .turns { display: flex; gap: 6px; flex-wrap: wrap; }
  .turn { flex: 1 1 60px; min-width: 60px; text-align: center; padding: 10px 6px;
    border: 2px solid var(--line); border-radius: 6px; background: var(--panel);
    font-size: 11px; letter-spacing: 1px; color: var(--muted);
    font-variant-numeric: tabular-nums; }
  .turn.on { border-color: var(--brass); color: var(--brass); }
  .turn.held { border-color: var(--brass); color: var(--ground);
    background: var(--brass); font-weight: 600; }
  .uptime .note { font-size: 12px; color: var(--muted); }

  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }
  .acquire { margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap; align-items: baseline; }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-weight: 600; font-size: 16px; color: var(--brass); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--brass); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>4&#x2605; Dark &middot; Nightflower &middot; No. 6</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Evelune idle animation, a robed harpist playing a tall lily-wound harp" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 4</span></div>
      <h1>EVELUNE</h1>
      <div class="title-line">First Chair of the Nightflowers</div>
      <div class="badges">
        <span class="badge light">Dark</span>
        <span class="badge">Center Support</span>
        <span class="badge">Tempo &middot; Amplify</span>
        <span class="badge sect">Nightflower &middot; No. 6</span>
      </div>
      <p class="lede">The first hero in the game who <b>creates almost
      nothing of her own</b>. She hands the team its cooldowns back a
      turn early, holds everyone else's blessings a turn longer, and
      carries a quarter of every blessing to a second ally. On a team
      with nothing to amplify she is an ordinary 4&#x2605;; on a team
      full of supports she is the reason the whole thing runs.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1800</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">135</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">130</div></div>
    <div class="stat spd"><div class="k">SPD</div><div class="v">118</div><div class="sub">+25% on the center hex</div></div>
  </div>

  <h2><span class="glyph">&#x266a;</span> She is a multiplier, not a source</h2>
  <p class="section-sub">Every other support in the game gives you a
  number. Evelune gives you <em>more of the numbers you already had</em>
  &#x2014; which is why she wants company, and why she is the wrong pick
  on a team of pure carries.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Sooner.</b> Play It Again takes a turn
      off <b>every ally's</b> cooldowns.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Longer.</b> Hold The Chord adds a turn
      to <b>every blessing the team is wearing</b>.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Wider.</b> The Chord Carries copies
      <b>a quarter of every buff</b> onto a second ally.</div>
  </div>

  <h2><span class="glyph">&#x266a;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Struck Note</h3>
      <div class="meta">Single enemy &middot; <b>130% ATK &middot; -20 AP</b></div>
      <p>One note, struck hard: <b>130% ATK</b>, and the discord costs
      them <b>20 AP</b> off their action bar. Taking meter is contested
      &#x2014; her accuracy against their resistance &#x2014; like any
      other taking.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 4</div>
      <h3>Play It Again</h3>
      <div class="meta">All allies &middot; <b>-1 turn on every cooldown</b></div>
      <p>The same phrase, sooner: <b>every ally gets a turn back</b> off
      all of their cooldowns. It never refreshes itself, and a skill
      already ready is left alone.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 5</div>
      <h3>Hold The Chord</h3>
      <div class="meta">All allies &middot; <b>15% of her max HP &middot; +1 turn on every buff</b></div>
      <p>A chord held open over the whole line: mends every ally for
      <b>15% of Evelune's max HP</b>, and <b>every blessing the team is
      wearing lasts a turn longer</b>. It creates nothing &#x2014;
      debuffs are somebody else's chord, and an unblessed ally just gets
      the mend.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>The Chord Carries</h3>
      <div class="meta">On any buff landing on an ally</div>
      <p>A note struck on one string sounds the next: <b>every buff that
      lands on an ally has a 25% chance to also land on another
      ally</b>, with the time it had left. The copy never carries again,
      and a sealed ally is never a destination.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Center hex</div>
      <h3>First Chair</h3>
      <div class="meta">Center &middot; <b>+25% SPD</b></div>
      <p>From the middle of the ring the whole formation plays to her
      time: <b>+25% Speed</b>, which for a hero whose whole job is tempo
      is the only stat that compounds.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x266a;</span> What a turn is worth</h2>
  <p class="section-sub">One 2-turn attack buff on one ally, with and
  without Evelune sitting in the middle. She did not cast it and she did
  not make it bigger &#x2014; she just refused to let it end.</p>
  <div class="uptime">
    <div>
      <div class="row-lab">Without her</div>
      <div class="turns">
        <div class="turn on">T1 &middot; on</div>
        <div class="turn on">T2 &middot; on</div>
        <div class="turn">T3 &middot; gone</div>
        <div class="turn">T4 &middot; gone</div>
      </div>
    </div>
    <div>
      <div class="row-lab">With Hold The Chord</div>
      <div class="turns">
        <div class="turn on">T1 &middot; on</div>
        <div class="turn on">T2 &middot; on</div>
        <div class="turn held">T3 &middot; held</div>
        <div class="turn">T4 &middot; gone</div>
      </div>
    </div>
    <p class="note">Half again as much buff, from a skill that also
    healed the whole team. And a quarter of the time, a second ally was
    wearing the same thing the moment it was cast.</p>
  </div>

  <h2><span class="glyph">&#x266a;</span> Frames</h2>
  <p class="section-sub">Seven strips, eight to ten frames each. Watch
  the harp rather than the harpist: it holds a violet sigil for the
  note, throws gold sparks along the strings for the refrain, and in the
  third it turns entirely to brass and stays there.</p>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">Playing regardless.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">A hand along the frame.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">Listening back.</div></div>
    <div class="clip"><img src="%%note%%" alt="Struck Note"><div class="cap"><b>Struck Note</b> &middot; %%nf_note%%f</div><div class="note">Skill 1 &#x2014; the sigil in the strings.</div></div>
    <div class="clip"><img src="%%again%%" alt="Play It Again"><div class="cap"><b>Play It Again</b> &middot; %%nf_again%%f</div><div class="note">Skill 2 &#x2014; gold along the wire.</div></div>
    <div class="clip"><img src="%%chord%%" alt="Hold The Chord"><div class="cap"><b>Hold The Chord</b> &middot; %%nf_chord%%f</div><div class="note">Skill 3 &#x2014; nothing is thrown.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">The hall goes quiet.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Dark</div></div>
    <div><div class="k">Rarity</div><div class="v">4&#x2605;</div></div>
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

out = '/home/user/browsergacha/docs/evelune-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
