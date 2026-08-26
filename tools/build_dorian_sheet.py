import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Dorian'
PANEL = (20, 19, 26, 255)   # --panel-2, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('dorianidle.png',   7, 'idle'),
    ('dorianidle1.png',  6, 'fidget1'),
    ('dorianidle2.png',  7, 'fidget2'),
    ('dorianskill1.png', 11, 'sweep'),
    ('dorianskill2.png', 11, 'set'),
    ('dorianskill3.png', 11, 'lit'),
    ('doriandeath.png',   8, 'death'),
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

html = r'''<title>Dorian, Glaive of the Nightflowers</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Faustina:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: a cold room and a lit edge. Neutral
     near-black, linen white for the shirt, and one electric violet --
     the colour the blade goes in the third strip -- reserved strictly
     for the two locks and what they are worth. Faustina, a sharp
     contemporary serif, because he is a duellist and not a mourner.
     Every color painted explicitly. */
  :root {
    --ground: #0a0a0e;
    --panel: #0f0f15;
    --panel-2: #14131a;
    --line: #2e2c3c;
    --ink: #f0eff4;
    --muted: #948fa4;
    --edge: #c86aff;
    --edge-dim: #5f3a86;
    --linen: #ece7e0;
    --wound: #ff7a7a;
    --display: 'Faustina', 'Georgia', serif;
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
    background: radial-gradient(ellipse 62% 46% at 50% 62%, rgba(200,106,255,.13), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--edge-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--edge); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 700; font-size: 70px; line-height: 1.02;
    color: var(--ink); text-wrap: balance; letter-spacing: 0;
    text-shadow: 0 4px 0 rgba(0,0,0,.55), 0 0 34px rgba(200,106,255,.22); }
  .title-line { font-size: 15px; color: var(--edge); letter-spacing: 2px;
    font-family: var(--display); font-style: italic; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.light { border-color: var(--edge-dim); color: var(--edge); }
  .badge.sect { border-color: var(--linen); color: var(--linen); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-weight: 700; font-size: 24px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.35; }
  .stat.atk .v { color: var(--edge); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  h2 { font-family: var(--display); font-weight: 400; font-size: 27px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 0; }
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
  .ability h3 { font-family: var(--display); font-weight: 700; font-size: 19px; letter-spacing: 0; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--linen); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--edge); font-weight: 500; }
  .ability.passive-card { border-color: var(--edge-dim); }

  /* Exactly what the lock stops. */
  .rules { background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; overflow-x: auto; }
  .rules table { width: 100%; border-collapse: collapse; min-width: 520px; }
  .rules th, .rules td { text-align: left; padding: 12px 18px;
    border-bottom: 1px solid var(--line); font-size: 13px; }
  .rules thead th { font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
    color: var(--muted); font-weight: 400; background: var(--panel); }
  .rules tbody tr:last-child td { border-bottom: none; }
  .rules td.stop { color: var(--wound); font-weight: 500; }
  .rules td.pass { color: var(--muted); }
  .rules td.why { color: var(--muted); }

  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }
  .acquire { margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap; align-items: baseline; }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-weight: 700; font-size: 16px; color: var(--edge); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--edge); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>5&#x2605; Dark &middot; Nightflower &middot; No. 6</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Dorian idle animation, a duellist in a white shirt holding a long-hafted glaive" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 5</span></div>
      <h1>DORIAN</h1>
      <div class="title-line">Glaive of the Nightflowers</div>
      <div class="badges">
        <span class="badge light">Dark</span>
        <span class="badge">Front-line DPS</span>
        <span class="badge">Heal-lock &middot; Seal</span>
        <span class="badge sect">Nightflower &middot; No. 6</span>
      </div>
      <p class="lede">He does not out-damage a healer. He <b>removes the
      healer from the argument</b>. Both his locks are single-target and
      both are ordinary debuffs on ordinary plates &#x2014; the seal is
      the same one Asher casts &#x2014; and his passive pays him
      <b>20% for each one the target is wearing</b>. Against a team with
      no sustain he is a plain 5&#x2605;. Against one built on it, he is
      the reason it does not work.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat atk"><div class="k">ATK</div><div class="v">260</div></div>
    <div class="stat"><div class="k">HP</div><div class="v">1800</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">135</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">112</div><div class="sub">+40% accuracy on a front hex</div></div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Nothing stopped a heal before him</h2>
  <p class="section-sub">The game had a seal for blessings and no answer
  at all for mending &#x2014; every cast, every regen, every drain landed
  unconditionally. Cutting that off is the one genuinely new thing in
  Dorian's kit, and it gates in the single place every kind of healing
  already passes through.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Cut them off.</b> Nothing For The Pain
      shuts the mending for 2 turns.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Shut the other door.</b> No Physician
      adds the seal &#x2014; no new blessings either.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Then swing.</b> Past Helping is at
      <b>&times;1.40</b> against an enemy under both.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Low Sweep</h3>
      <div class="meta">Single enemy &middot; <b>140% ATK</b></div>
      <p>The glaive comes across at knee height: <b>140% ATK</b>. No
      trick to it &#x2014; it is the stroke he spams into a target that
      can no longer be repaired.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 3</div>
      <h3>Nothing For The Pain</h3>
      <div class="meta">Single enemy &middot; <b>150% ATK &middot; no healing, 2 turns</b></div>
      <p><b>150% ATK</b>, and for two turns <b>nothing can heal them</b>
      &#x2014; no cast, no regen, no drain, no lifesteal.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 5</div>
      <h3>No Physician</h3>
      <div class="meta">Single enemy &middot; <b>190% ATK &middot; both locks, 2 turns</b></div>
      <p>The lit blade: <b>190% ATK</b> to one enemy who for two turns can
      neither <b>be healed</b> nor <b>take any new blessing</b>. Their
      support can spend every turn they have and change nothing.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Past Helping</h3>
      <div class="meta">Per lock on the target</div>
      <p><b>+20% damage for each of his two locks</b> the target is
      under. One is <b>&times;1.20</b>; an enemy who can be neither
      mended nor blessed takes <b>&times;1.40</b>. Other people's debuffs
      do not count &#x2014; only his.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Front hex</div>
      <h3>Reach</h3>
      <div class="meta">Front &middot; <b>+40% accuracy</b></div>
      <p>The highest accuracy bonus of any hex in the game, and the one
      stat a lock-based carry actually needs: <b>every lock he throws is
      rolled against their Resistance</b>, and a refused lock is a whole
      cooldown wasted.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Exactly what the lock stops</h2>
  <p class="section-sub">A brand-new debuff is only as good as its
  edges, so these are all of them. It gates inside the single method
  every kind of mending in the game already calls.</p>
  <div class="rules">
    <table>
      <thead>
        <tr><th>Coming at a cut-off target</th><th>Result</th><th class="why">Why</th></tr>
      </thead>
      <tbody>
        <tr><td>A cast heal</td><td class="stop">Refused</td><td class="why">The turn is spent and the log says so</td></tr>
        <tr><td>A heal-over-time tick</td><td class="stop">Refused</td><td class="why">Every tick routes through the same method</td></tr>
        <tr><td>A drain or lifesteal rider</td><td class="stop">Refused</td><td class="why">Same &#x2014; the attacker keeps the damage, loses the mend</td></tr>
        <tr><td>A shield</td><td class="pass">Lands</td><td class="why">A shield is not healing; it is HP they never lose</td></tr>
        <tr><td>A revive</td><td class="pass">Lands</td><td class="why">Coming back is not being patched up</td></tr>
        <tr><td>A cleanse</td><td class="pass">Lands &#x2014; and lifts it</td><td class="why">It is an ordinary debuff, and it expires on its own</td></tr>
      </tbody>
    </table>
  </div>

  <h2><span class="glyph">&#x2726;</span> Frames</h2>
  <p class="section-sub">Seven strips at nine frames each. He is a
  bladesman rather than a caster, so two of the three are just good
  footwork &#x2014; and the third is the only time anything lights up.</p>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">Weight forward.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">Rolling the haft.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">Checking the line.</div></div>
    <div class="clip"><img src="%%sweep%%" alt="Low Sweep"><div class="cap"><b>Low Sweep</b> &middot; %%nf_sweep%%f</div><div class="note">Skill 1 &#x2014; across, at the knee.</div></div>
    <div class="clip"><img src="%%set%%" alt="Nothing For The Pain"><div class="cap"><b>Nothing For The Pain</b> &middot; %%nf_set%%f</div><div class="note">Skill 2 &#x2014; a set, not a swing.</div></div>
    <div class="clip"><img src="%%lit%%" alt="No Physician"><div class="cap"><b>No Physician</b> &middot; %%nf_lit%%f</div><div class="note">Skill 3 &#x2014; the only lit stroke.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">Nobody comes for him either.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Dark</div></div>
    <div><div class="k">Rarity</div><div class="v">5&#x2605;</div></div>
    <div><div class="k">Role</div><div class="v">Front-line DPS</div></div>
    <div><div class="k">Sect</div><div class="v">Nightflower &middot; No. 6 &middot; complete</div></div>
  </div>

  <p class="foot">Sheet drawn from the live hero definition
  (js/data/heroes/humans.js) and the uploaded spritesheets, untouched.
  Play at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a>.</p>
</div>
'''

for name, uri in IMG.items():
    html = html.replace(f'%%{name}%%', uri)
    html = html.replace(f'%%nf_{name}%%', str(NF[name]))

out = '/home/user/browsergacha/docs/dorian-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
