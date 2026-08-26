import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/vivian'
PANEL = (18, 26, 16, 255)   # --panel-2, so a clip has no visible box around it
SIZE = 280

# The idle filename carries an upstream 'png' twice over -- kept exactly
# as uploaded.
STRIPS = [
    ('hedgeidlepng.png', 5, 'idle'),
    ('hedgeidle1.png',   7, 'fidget1'),
    ('hedgeidle2.png',   7, 'fidget2'),
    ('hedgeready.png',   7, 'ready'),
    ('hedgeskill1.png', 10, 'mend'),
    ('hedgeskill3.png', 10, 'briar'),
    ('hedgedeath.png',   7, 'death'),
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

html = r'''<title>Vivian, Hedge Mage of the Whisperchime</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Eczar:wght@500;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: a hedgerow after rain. Wet-bark dark
     under new-growth green, with briar red kept strictly for the one
     skill that hurts anybody. Eczar for the display -- a warm bookish
     serif with a thorn in it. Every color painted explicitly. */
  :root {
    --ground: #0b1109;
    --panel: #0e150b;
    --panel-2: #121a10;
    --line: #2e4526;
    --ink: #eef4e8;
    --muted: #93a889;
    --leaf: #8fd66a;
    --leaf-dim: #4a7238;
    --briar: #e07a8a;
    --cream: #ecefd8;
    --display: 'Eczar', 'Georgia', serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink);
    font-family: var(--mono); font-size: 15px; line-height: 1.65; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }
  .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px; }
  .eyebrow b { color: var(--leaf); font-weight: 500; }
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art { flex: 0 0 300px; position: relative;
    background: radial-gradient(ellipse 62% 46% at 50% 60%, rgba(143,214,106,.14), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--leaf-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--leaf); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 700; font-size: 66px; line-height: 1.02;
    color: var(--ink); text-wrap: balance; letter-spacing: 1px;
    text-shadow: 0 4px 0 rgba(0,0,0,.5), 0 0 34px rgba(143,214,106,.25); }
  .title-line { font-size: 15px; color: var(--leaf); letter-spacing: 2px;
    font-family: var(--display); font-style: italic; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.wind { border-color: var(--leaf-dim); color: var(--leaf); }
  .badge.sect { border-color: var(--cream); color: var(--cream); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-size: 24px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.35; }
  .stat.hp .v { color: var(--leaf); }
  .stat.atk .v { color: var(--muted); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  h2 { font-family: var(--display); font-weight: 700; font-size: 24px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 0; }
  h2 .glyph { color: var(--leaf); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .section-sub b { color: var(--ink); font-weight: 500; }
  .engine-box { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 24px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    justify-content: center; font-size: 13px; color: var(--muted); text-align: center; }
  .engine-step { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); max-width: 250px; }
  .engine-step b { color: var(--leaf); font-weight: 500; }
  .engine-arrow { color: var(--leaf-dim); font-size: 20px; }
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--leaf-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 700; font-size: 19px; }
  .ability .ladder { margin-top: 10px; padding-top: 9px;
    border-top: 1px solid var(--line); font-family: var(--mono);
    font-size: 11px; line-height: 1.7; color: var(--muted); }
  .ability .ladder b { color: var(--ink); font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase; font-size: 10px; }
  .ability .ladder i { font-style: normal; color: var(--ink); }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--cream); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--leaf); font-weight: 500; }
  .ability p .thorn { color: var(--briar); font-weight: 500; }
  .ability.passive-card { border-color: var(--leaf-dim); }
  .maths { width: 100%; border-collapse: collapse; font-size: 13px;
    background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; overflow: hidden; }
  .maths th { text-align: left; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
    color: var(--muted); font-weight: 400; padding: 12px 16px; border-bottom: 2px solid var(--line); }
  .maths th.num, .maths td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .maths td { padding: 10px 16px; border-bottom: 1px solid var(--line); color: var(--ink); }
  .maths tr:last-child td { border-bottom: none; }
  .maths td.lab { color: var(--muted); }
  .maths td .big { color: var(--leaf); font-weight: 600; }
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
  .acquire .v { font-family: var(--display); font-size: 16px; color: var(--leaf); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--leaf); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>4&#x2605; Wind &middot; Whisperchime &middot; No. 7</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Vivian idle animation, a robed hedge mage with a staff standing in green light" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 4</span></div>
      <h1>VIVIAN</h1>
      <div class="title-line">Hedge Mage of the Whisperchime</div>
      <div class="badges">
        <span class="badge wind">Wind</span>
        <span class="badge">Healer</span>
        <span class="badge">HP-priced &middot; self-accelerating</span>
        <span class="badge sect">Whisperchime &middot; No. 7</span>
      </div>
      <p class="lede">The healer you build wrong if you build her like a
      healer. Every number in her kit &#x2014; the mend, the regrowth,
      even the thorns &#x2014; is a percentage of <b>her own maximum
      HP</b>. Her ATK stat does nothing. Stack health and she heals
      harder, hits harder, and lives longer with the same piece of
      gear.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat hp"><div class="k">HP</div><div class="v">1475</div><div class="sub">her real offence stat</div></div>
    <div class="stat atk"><div class="k">ATK</div><div class="v">125</div><div class="sub">unused by every skill</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">107</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">100</div><div class="sub">plus what she feeds herself</div></div>
  </div>

  <h2><span class="glyph">&#x00BB;</span> The loop</h2>
  <p class="section-sub">Sympathetic Growth is the part that makes her
  more than a mend button: it pays her <b>5% of a turn every time any
  ally is healed</b> &#x2014; including by her own regrowth, ticking on
  the front row, on turns she is not even acting.</p>
  <div class="engine-box">
    <div class="engine-step"><b>Thicket Blessing on the front row.</b>
      Regrowth on up to three allies, for four turns.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Every tick is an ally healed.</b> Three
      front-liners regrowing is three separate heals a round &#x2014;
      <b>15% of a turn</b> handed back to her each time round.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>She comes up sooner.</b> And the first
      thing she does with the turn is heal somebody, which pays her
      again. The loop is the hero.</div>
  </div>

  <h2><span class="glyph">&#x00BB;</span> Why HP is her damage stat</h2>
  <p class="section-sub">Figures are a Lv&nbsp;30 4-star Vivian at
  <b>3,614 max HP</b>, skills at cap. The right-hand column is what the
  same skill pays from the <b>back hex</b>, where Field Medic adds 25% to
  everything she casts.</p>
  <div class="maths-wrap">
    <table class="maths">
      <thead><tr><th>Skill</th><th class="num">Base</th><th class="num">Maxed</th><th class="num">Maxed, back hex</th></tr></thead>
      <tbody>
        <tr><td class="lab">Verdant Mend &mdash; back-row ally</td><td class="num">361</td><td class="num">1,265</td><td class="num"><span class="big">1,581</span></td></tr>
        <tr><td class="lab">Verdant Mend &mdash; front-row ally</td><td class="num">723</td><td class="num">1,626</td><td class="num"><span class="big">2,033</span></td></tr>
        <tr><td class="lab">Thicket Blessing &mdash; per tick, per ally</td><td class="num">181</td><td class="num">398</td><td class="num"><span class="big">497</span></td></tr>
        <tr><td class="lab">Briar Burst &mdash; damage</td><td class="num">723</td><td class="num">1,084</td><td class="num">1,084</td></tr>
      </tbody>
    </table>
  </div>
  <p class="section-sub" style="margin-top:16px">Two things fall out of
  that table. The <b>front-hex bonus on Verdant Mend never closes</b>
  &mdash; her heal rungs add their points on top of whichever cut
  applies, so the 10%/20% split becomes 35%/45% and a front-liner is
  always the better patient by a flat ten points of her pool. And
  <b>Briar Burst is not a healer dabbling in damage</b>: 1,084 off a
  4-star support is real, and it is priced off the same stat she was
  already stacking.</p>

  <h2><span class="glyph">&#x00BB;</span> Kit</h2>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; No cooldown</div>
      <h3>Verdant Mend</h3>
      <div class="meta">One ally &middot; <b>10% of Vivian's max HP</b>, 20% on a front hex</div>
      <p>The every-turn mend. Priced off <b>her</b> pool, not the
      patient's, so it does not shrink when the ally it is saving is a
      squishy one &#x2014; and it feeds her own bar on the way out.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +5% heal &rsaquo; +5% heal &rsaquo; +5% heal &rsaquo; +5% heal &rsaquo; +5% heal <i>&middot; max Lv 6</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; Cooldown 6 &rarr; 4 fully levelled</div>
      <h3>Thicket Blessing</h3>
      <div class="meta">Front row &middot; <b>5% of her max HP per turn</b>, 4 turns &rarr; 11% for 5 turns</div>
      <p>Bless the entire front row with regrowth. The single best button
      she owns, because every tick on every ally is another
      <b>Sympathetic Growth</b> trigger &#x2014; healing over time on a
      full front row is also haste over time on her.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +2% heal &rsaquo; +2% heal &rsaquo; +2% heal &rsaquo; +1 turn &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 7</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; Cooldown 7 &rarr; 5 fully levelled</div>
      <h3>Briar Burst</h3>
      <div class="meta">One enemy &middot; <b>20% of her max HP</b> &middot; 50% AP cut</div>
      <p>Lash an enemy with thorns for <span class="thorn">20% of
      Vivian's max HP</span>, with a <b>50% chance</b> to cut their action
      bar in half. The gate is bought to certain by her chance rungs; the
      damage is not gated at all.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +5% power &rsaquo; +5% power &rsaquo; +20% land chance &rsaquo; +20% land chance &rsaquo; +10% land chance &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 8</i></div>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Sympathetic Growth</h3>
      <div class="meta">Whenever ANY ally is healed</div>
      <p><b>+5% action bar</b> &#x2014; not just from her own casts.
      Another healer on the team accelerates her too, and so does every
      individual tick of a regrowth she left running four turns ago.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Positional &middot; Back hex</div>
      <h3>Field Medic</h3>
      <div class="meta">Back row &middot; <b>+25% to every heal she casts</b></div>
      <p>A quarter more on the mend and on every regrowth tick, which is
      the largest positional bonus available to a healer &#x2014; and it
      costs her nothing, because nothing in her kit wants her up front.</p>
    </div>
  </div>

  <h2><span class="glyph">&#x00BB;</span> How to build her</h2>
  <p class="section-sub">Unusually for a support, her gear priorities are
  not arguable. Two of the four stats do nothing at all.</p>
  <div class="engine-box">
    <div class="engine-step"><b>HP, then HP.</b> It is her healing, her
      regrowth and her damage in one stat. There is no diminishing return
      to find &#x2014; every point pays into all three.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Then SPD.</b> The passive already
      accelerates her; speed compounds with it rather than replacing
      it.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Never ATK.</b> Not one skill reads it.
      An ATK roll on Vivian is a dead substat.</div>
  </div>

  <h2><span class="glyph">&#x00BB;</span> Who she wants beside her</h2>
  <p class="section-sub">She is a Whisperchime by sect and a hedge-witch
  by trade &#x2014; the title is older than the sect list, and the kit
  reads like the hedgerow rather than the wind.</p>
  <div class="engine-box">
    <div class="engine-step"><b>A full front row.</b> Three bodies out
      front means three regrowth ticks a round, which is three
      accelerations. Two front-liners is a third of her engine
      missing.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>A second healer.</b> Sympathetic Growth
      fires on <em>any</em> ally being healed &#x2014; Ilyra or Posie
      working alongside her is free tempo for Vivian.</div>
    <div class="engine-arrow">&#x2192;</div>
    <div class="engine-step"><b>Somebody who wants to be low.</b> Tide's
      Last Stand pays +35% ATK under 40% HP; a healer who can hold that
      line without overshooting it is worth the hex.</div>
  </div>

  <h2><span class="glyph">&#x00BB;</span> Frames</h2>
  <p class="section-sub">Seven strips. Two casting animations only
  &#x2014; the mend and the thorns &#x2014; because Thicket Blessing
  re-uses the cast. Authored facing right; the files ship untouched,
  upstream filenames and all.</p>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle"><div class="cap"><b>Idle</b> &middot; %%nf_idle%%f</div><div class="note">Staff planted, listening.</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b> &middot; %%nf_fidget1%%f</div><div class="note">A glance to the row.</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b> &middot; %%nf_fidget2%%f</div><div class="note">Eight frames, the short one.</div></div>
    <div class="clip"><img src="%%ready%%" alt="Ready stance"><div class="cap"><b>Ready</b> &middot; %%nf_ready%%f</div><div class="note">Her turn; the staff comes up.</div></div>
    <div class="clip"><img src="%%mend%%" alt="Verdant Mend"><div class="cap"><b>Verdant Mend</b> &middot; %%nf_mend%%f</div><div class="note">Also serves the Blessing.</div></div>
    <div class="clip"><img src="%%briar%%" alt="Briar Burst"><div class="cap"><b>Briar Burst</b> &middot; %%nf_briar%%f</div><div class="note">The one time she reaches out.</div></div>
    <div class="clip"><img src="%%death%%" alt="Death"><div class="cap"><b>Death</b> &middot; %%nf_death%%f</div><div class="note">Twenty-five frames, slow to fall.</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Element</div><div class="v">Wind</div></div>
    <div><div class="k">Rarity</div><div class="v">4&#x2605;</div></div>
    <div><div class="k">Role</div><div class="v">Healer</div></div>
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

out = '/home/user/browsergacha/docs/vivian-sheet.html'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(html)
print(out, len(html))
bad = [(i, c) for i, c in enumerate(html) if ord(c) > 127]
print('non-ascii:', bad[:10] if bad else 'none')
