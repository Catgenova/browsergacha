import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Sable'
PANEL = (21, 26, 18, 255)   # --panel-2, so a clip has no visible box around it
SIZE = 280

STRIPS = [
    ('sableidle.png',   7, 'idle'),
    ('sableidle1.png',  6, 'fidget1'),
    ('sableidle2.png',  7, 'fidget2'),
    ('sableskill1.png', 11, 'seedfall'),
    ('sableskill2.png', 11, 'flower'),
    ('sableskill3.png', 11, 'garden'),
    ('sabledeath.png',   8, 'death'),
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

html = r'''<title>Sable, Gravetender of the Nightflowers</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: a night garden. Near-black with a
     green bias, pale lilac for the bloom, and the game's own poison
     green -- the exact color of the plate a player sees on a poisoned
     enemy -- reserved for every number that IS poison. Newsreader for
     the display, which has the botanical-plate look without the
     costume. Every color painted explicitly. */
  :root {
    --ground: #0a0c09;
    --panel: #0f120d;
    --panel-2: #151a12;
    --line: #2f3a28;
    --ink: #eef2e6;
    --muted: #94a088;
    --seed: #a8e85a;
    --seed-dim: #4d6b2c;
    --bloom: #d8c4ea;
    --display: 'Newsreader', 'Georgia', serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink);
    font-family: var(--mono); font-size: 15px; line-height: 1.65; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }
  .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px; }
  .eyebrow b { color: var(--seed); font-weight: 500; }
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art { flex: 0 0 300px; position: relative;
    background: radial-gradient(ellipse 62% 46% at 50% 62%, rgba(216,196,234,.13), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--seed-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--bloom); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 600; font-size: 76px; line-height: 1.02;
    color: var(--ink); text-wrap: balance; letter-spacing: 1px;
    text-shadow: 0 4px 0 rgba(0,0,0,.55), 0 0 34px rgba(168,232,90,.18); }
  .title-line { font-size: 15px; color: var(--bloom); letter-spacing: 2px;
    font-family: var(--display); font-style: italic; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.light { border-color: var(--seed-dim); color: var(--seed); }
  .badge.sect { border-color: var(--bloom); color: var(--bloom); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-weight: 600; font-size: 24px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.35; }
  .stat.atk .v { color: var(--seed); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  h2 { font-family: var(--display); font-weight: 400; font-size: 26px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 0; }
  h2 .glyph { color: var(--seed); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .engine-box { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    justify-content: center; font-size: 13px; color: var(--muted); text-align: center; }
  .engine-step { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 250px; }
  .engine-step b { color: var(--seed); font-weight: 500; }
  .engine-arrow { color: var(--seed-dim); font-size: 20px; }
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--seed-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 600; font-size: 19px; letter-spacing: 0; }
  .ability .ladder { margin-top: 10px; padding-top: 9px;
    border-top: 1px solid var(--line); font-family: var(--mono);
    font-size: 11px; line-height: 1.7; color: var(--muted); }
  .ability .ladder b { color: var(--ink); font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase; font-size: 10px; }
  .ability .ladder i { font-style: normal; color: var(--ink); }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--bloom); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--seed); font-weight: 500; }
  .ability.passive-card { border-color: var(--seed-dim); }

  /* The ledger: the same seed, waited out and cashed in. */
  .ledger { background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; overflow-x: auto; }
  .ledger table { width: 100%; border-collapse: collapse; min-width: 480px; }
  .ledger th, .ledger td { text-align: left; padding: 12px 18px;
    border-bottom: 1px solid var(--line); font-size: 13px; }
  .ledger thead th { font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
    color: var(--muted); font-weight: 400; background: var(--panel); }
  .ledger tbody tr:last-child td { border-bottom: none; }
  .ledger td.n { font-variant-numeric: tabular-nums; text-align: right;
    font-family: var(--display); font-weight: 600; font-size: 17px; color: var(--seed); }
  .ledger td.who { color: var(--muted); }
  .ledger tbody tr.total td { background: var(--panel); }
  .ledger tbody tr.total td, .ledger tbody tr.total td.n { color: var(--bloom); }

  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }
  .acquire { margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap; align-items: baseline; }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-weight: 600; font-size: 16px; color: var(--seed); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--seed); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>3&#x2605; Dark &middot; Nightflower &middot; No. 6</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Sable idle animation, a robed caster holding a tall staff crowned with a pale bloom" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 3</span></div>
      <h1>SABLE</h1>
      <div class="title-line">Gravetender of the Nightflowers</div>
      <div class="badges">
        <span class="badge light">Dark</span>
        <span class="badge">Back-line DPS</span>
        <span class="badge">Poison &middot; Detonate</span>
        <span class="badge sect">Nightflower &middot; No. 6</span>
      </div>
      <p class="lede">The second Nightflower wired, and the first hero in
      the game whose damage mostly <b>has not happened yet</b>. He does
      not attack so much as <b>plant</b>: every skill leaves ordinary
      poison behind &#x2014; the same plate you already read at a glance,
      not a recoloured one &#x2014; and his second skill is the flower
      opening, when <b>every poison on the field comes due at once</b>.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1135</div></div>
    <div class="stat atk"><div class="k">ATK</div><div class="v">151</div><div class="sub">every seed is priced off this</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">76</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">108</div><div class="sub">poisons tick +30% on a back hex</div></div>
  </div>

  <h2><span class="glyph">&#x2740;</span> Poison, not a new word for poison</h2>
  <p class="section-sub">Sable inflicts the game's <em>ordinary</em>
  damage-over-time. No bespoke flavour, no private colour, no separate
  icon to learn: a poisoned enemy under Sable looks exactly like a
  poisoned enemy under anyone else, because the point of a debuff plate
  is that you can read the board without stopping.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Seedfall</b> plants two. <b>Grave
      Garden</b> plants the whole field.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Open The Flower</b> cashes every poison
      in for its remaining ticks, all at once.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>What Grows Back</b> pays him <b>15 AP</b>
      for any poisoned enemy that dies &#x2014; so a seed is never wasted.</div>
  </div>

  <h2><span class="glyph">&#x2740;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Seedfall</h3>
      <div class="meta">2 random enemies &middot; <b>70% ATK &middot; poison 30% ATK, 3 turns</b></div>
      <p>Seed scatters across the field: <b>70% ATK</b> to <b>two random,
      never-the-same</b> enemies, each with a <b>50% chance</b> to be left poisoned. His
      whole-fight resource, on no cooldown.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +20% land chance &rsaquo; +20% land chance &rsaquo; +10% land chance &rsaquo; +10% effect <i>&middot; max Lv 6</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 4 &rarr; 2 fully levelled</div>
      <h3>Open The Flower</h3>
      <div class="meta">All enemies &middot; <b>detonate every poison</b></div>
      <p>No damage of its own. The bloom on his staff opens and every
      seeded enemy answers: <b>all remaining ticks land immediately</b>
      and the poison burns itself out. It pays <b>exactly</b> what
      waiting would have &#x2014; it only stops making you wait.</p>
      <div class="ladder"><b>Skill ups</b> &middot; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 3</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 6 &rarr; 4 fully levelled</div>
      <h3>Grave Garden</h3>
      <div class="meta">All enemies &middot; <b>110% ATK &middot; poison 30% ATK, 3 turns</b></div>
      <p>The whole field goes to seed: <b>110% ATK</b> to every enemy,
      and a <b>50% chance each</b> to be poisoned. The fuse for the
      flower.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +10% power &rsaquo; +20% land chance &rsaquo; +20% land chance &rsaquo; +10% land chance &rsaquo; +10% effect &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 8</i></div>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>What Grows Back</h3>
      <div class="meta">On a poisoned enemy's death</div>
      <p>Nothing seeded is ever wasted: whenever a <b>poisoned enemy
      dies</b>, Sable gains <b>15 AP</b>. A field he has planted is a
      field that keeps handing him turns as it thins.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Back hex</div>
      <h3>Deep Roots</h3>
      <div class="meta">Back &middot; <b>+30% poison</b></div>
      <p>What is planted from a distance has time to take hold: every
      poison he inflicts <b>ticks 30% harder</b> while he holds a back
      hex.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x2740;</span> The seed, waited out and cashed in</h2>
  <p class="section-sub">One Grave Garden seed on one enemy, at Sable's
  base ATK from a back hex, against a target with ordinary armour. The
  point of the table is the last row: detonating is not a damage bonus
  and not a discount &#x2014; it is the same number, sooner.</p>
  <div class="ledger">
    <table>
      <thead>
        <tr><th>What happens</th><th class="who">When</th><th style="text-align:right">Damage</th></tr>
      </thead>
      <tbody>
        <tr><td>Poison ticks</td><td class="who">start of its turn</td><td class="n">41</td></tr>
        <tr><td>Poison ticks</td><td class="who">the turn after</td><td class="n">41</td></tr>
        <tr><td>Poison ticks, and is spent</td><td class="who">the turn after that</td><td class="n">41</td></tr>
        <tr class="total"><td><b>Or: Open The Flower</b></td><td class="who">immediately</td><td class="n">123</td></tr>
      </tbody>
    </table>
  </div>

  <h2><span class="glyph">&#x2740;</span> Any poison is a fuse</h2>
  <p class="section-sub">Open The Flower does not check whose poison it
  is. It detonates every damage-over-time on the field &#x2014; which
  makes Sable an unexpectedly good partner for the one sect that already
  lives on burning things.</p>
  <div class="engine-box">
    <div class="engine-step"><b>The Firetroupe burn</b> &#x2014; Lucian,
      Esmerelda, Lin all leave fire ticking.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Sable opens the flower</b> and every one
      of those burns comes due in the same instant.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>And he is paid for the corpses</b>
      &#x2014; a burn counts as poison for What Grows Back.</div>
  </div>

  <h2><span class="glyph">&#x2740;</span> Frames</h2>
  <p class="section-sub">Seven strips at nine frames each. Watch the
  staff: it charges for the scatter, opens wide for the flower, and in
  the third it draws a ritual wheel that detonates and winds back in.</p>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">The bloom, waiting.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">A sleeve settling.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">Turning the staff over.</div></div>
    <div class="clip"><img src="%%seedfall%%" alt="Seedfall"><div class="cap"><b>Seedfall</b> &middot; %%nf_seedfall%%f</div><div class="note">Skill 1 &#x2014; the scatter.</div></div>
    <div class="clip"><img src="%%flower%%" alt="Open The Flower"><div class="cap"><b>Open The Flower</b> &middot; %%nf_flower%%f</div><div class="note">Skill 2 &#x2014; nothing is thrown.</div></div>
    <div class="clip"><img src="%%garden%%" alt="Grave Garden"><div class="cap"><b>Grave Garden</b> &middot; %%nf_garden%%f</div><div class="note">Skill 3 &#x2014; the wheel, and the return.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">Back into the ground.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Dark</div></div>
    <div><div class="k">Rarity</div><div class="v">3&#x2605;</div></div>
    <div><div class="k">Role</div><div class="v">Back-line DPS</div></div>
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

out = '/home/user/browsergacha/docs/sable-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
