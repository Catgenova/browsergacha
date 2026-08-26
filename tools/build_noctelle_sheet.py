import base64, io, os
from PIL import Image

SRC = '/home/user/browsergacha/assets/heroes/Noctelle'
PANEL = (20, 16, 28, 255)   # --panel, so a clip has no visible box around it
SIZE = 280

# (file, frames, fps, clip name) — mirrors sprite.strips in the hero def.
STRIPS = [
    ('noctelleidle.png',    9, 7, 'idle'),
    ('noctelleidle1.png',   9, 6, 'fidget'),
    ('noctelleskill1.png',  9, 11, 'silentwing'),
    ('noctelleskill2.png',  9, 11, 'nightbloom'),
    ('noctelleskill3.png',  9, 11, 'mothdust'),
    ('noctelledeath.png',  17, 8, 'death'),
]

def clip(fname, frames, fps):
    im = Image.open(f'{SRC}/{fname}').convert('RGBA')
    w, h = im.size
    assert w % frames == 0, f'{fname}: {w}px does not divide into {frames} frames'
    fw = w // frames
    cells = []
    for i in range(frames):
        cell = im.crop((i * fw, 0, (i + 1) * fw, h))
        bg = Image.new('RGBA', cell.size, PANEL)
        bg.alpha_composite(cell)
        cells.append(bg.convert('RGB').resize((SIZE, SIZE), Image.NEAREST))
    buf = io.BytesIO()
    cells[0].save(buf, format='GIF', save_all=True, append_images=cells[1:],
                  duration=int(1000 / fps), loop=0, optimize=True)
    return 'data:image/gif;base64,' + base64.b64encode(buf.getvalue()).decode()

IMG = {name: clip(f, n, fps) for f, n, fps, name in STRIPS}

html = r'''<title>Noctelle, Silent Moth of the Nightflowers</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gilda+Display&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  /* A committed single-theme sheet: a moth at a dark window. Dusk
     purple ground, wing-eye violet, and the pale bloom of her staff,
     set in Gilda Display's fine night serif. Every color painted
     explicitly. */
  :root {
    --ground: #100c16;
    --panel: #14101c;
    --panel-2: #1c1728;
    --line: #3a3050;
    --ink: #efe9f4;
    --muted: #9a8fb0;
    --wing: #b98af0;
    --bloom: #e0b4ff;
    --wing-dim: #5c4480;
    --wound: #e08a9a;
    --display: 'Gilda Display', 'Georgia', serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink);
    font-family: var(--mono); font-size: 15px; line-height: 1.65; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }
  .eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px; }
  .eyebrow b { color: var(--wing); font-weight: 500; }

  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art { flex: 0 0 300px; position: relative;
    background: radial-gradient(ellipse 62% 46% at 50% 58%, rgba(185,138,240,.15), transparent 70%), var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; min-height: 320px; }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag { position: absolute; top: 10px; left: 12px; font-size: 11px;
    letter-spacing: 2px; color: var(--wing-dim); text-transform: uppercase; }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--bloom); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 { font-family: var(--display); font-weight: 400; font-size: 66px; line-height: 1.05;
    color: var(--ink); text-wrap: balance; letter-spacing: 3px;
    text-shadow: 0 0 36px rgba(185,138,240,.42); }
  .title-line { font-size: 14px; color: var(--wing); letter-spacing: 3px;
    font-family: var(--display); text-transform: uppercase; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge { font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px; }
  .badge.dark { border-color: var(--wing-dim); color: var(--wing); }
  .badge.sect { border-color: var(--bloom); color: var(--bloom); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }

  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 12px 16px; }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v { font-family: var(--display); font-size: 30px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.15; }
  .stat.hp .v { color: var(--wing); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  .stats-note { font-size: 12px; color: var(--muted); margin-top: 8px; }

  h2 { font-family: var(--display); font-weight: 400; font-size: 27px;
    margin: 64px 0 6px; color: var(--ink); letter-spacing: 4px; text-transform: uppercase; }
  h2 .glyph { color: var(--wing); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }
  .section-sub b { color: var(--ink); font-weight: 500; }

  .ledger-box { background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 24px 20px 18px; }
  .ledger { display: grid; grid-template-columns: repeat(3, minmax(190px, 1fr)); gap: 14px; }
  .entry { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 16px 18px; text-align: center; }
  .entry .who { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .entry .num { font-family: var(--display); font-size: 40px; line-height: 1.15;
    color: var(--wing); font-variant-numeric: tabular-nums; }
  .entry .what { font-size: 12px; color: var(--muted); }
  .entry .what b { color: var(--ink); font-weight: 500; }
  .ledger-cap { font-size: 12px; color: var(--muted); margin-top: 16px; }
  .ledger-cap b { color: var(--wing); font-weight: 500; }

  .loop-box { margin-top: 22px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 22px 20px; display: flex; gap: 12px;
    flex-wrap: wrap; align-items: center; justify-content: center;
    font-size: 13px; color: var(--muted); text-align: center; }
  .loop-step { background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 18px; color: var(--ink); }
  .loop-step b { color: var(--wing); font-weight: 500; }
  .loop-step i { color: var(--wound); font-style: normal; font-weight: 500; }
  .loop-arrow { color: var(--wing-dim); font-size: 20px; }

  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--wing-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 400; font-size: 22px; letter-spacing: 2px; }
  .ability .ladder { margin-top: 10px; padding-top: 9px;
    border-top: 1px solid var(--line); font-family: var(--mono);
    font-size: 11px; line-height: 1.7; color: var(--muted); }
  .ability .ladder b { color: var(--ink); font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase; font-size: 10px; }
  .ability .ladder i { font-style: normal; color: var(--ink); }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--bloom); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--wing); font-weight: 500; }
  .ability .art-note { font-size: 12px; color: var(--muted); font-style: italic; }
  .ability.passive-card { border-color: var(--wing-dim); }

  .dmg-table-box { margin-top: 22px; overflow-x: auto; background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; min-width: 620px; font-size: 13px; }
  th, td { padding: 9px 14px; text-align: right; font-variant-numeric: tabular-nums; }
  thead th { color: var(--muted); font-weight: 500; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid var(--line); }
  tbody th { text-align: left; font-weight: 500; color: var(--ink); white-space: nowrap; }
  tbody tr + tr td, tbody tr + tr th { border-top: 1px solid #241d33; }
  td.max { color: var(--wing); font-weight: 600; }
  .table-cap { font-size: 12px; color: var(--muted); padding: 10px 14px 12px; }
  .table-cap b { color: var(--ink); font-weight: 500; }

  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel-2); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }

  .acquire { margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap;
    align-items: baseline; }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-size: 22px; color: var(--bloom); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--wing); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>3&#x2605; Dark &middot; Nightflower Sect &middot; No. 6</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Noctelle idle animation, a hooded figure with moth wings holding a flower-headed staff" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#x2605;&#x2605;&#x2605;<span class="rank">RARITY 3</span></div>
      <h1>NOCTELLE</h1>
      <div class="title-line">Silent Moth of the Nightflowers</div>
      <div class="badges">
        <span class="badge dark">&#x1f319; Dark</span>
        <span class="badge">Back-hex support</span>
        <span class="badge">Scales off her own HP</span>
        <span class="badge sect">Nightflower Sect &middot; No. 6</span>
      </div>
      <p class="lede">The first Nightflower written, and the sect's thesis in
      one hero: <b>nothing she does is free, and everything she gives was
      taken from someone</b> &#x2014; usually her. Every number in her kit is a
      percentage of <b>her own maximum HP</b>, spent as damage and landing as
      healing on whoever is worst off. Her health bar is not a survival
      stat. It is her ammunition.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat hp"><div class="k">HP</div><div class="v">1935</div><div class="sub">every skill is priced in this</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">88</div><div class="sub">unused &#x2014; nothing she casts reads it</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">111</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">104</div></div>
    <div class="stat"><div class="k">Crit</div><div class="v">15%</div><div class="sub">&#xd7;1.5 damage</div></div>
  </div>
  <div class="stats-note">Base values at level 1 &#x2014; stats scale with level and &#x2605; ascension like every hero.
    She sits on the same 520 power budget as the rest of the roster; the 3&#x2605; is the level ceiling (30), not smaller stats.
    <b style="color:var(--ink)">Gear her for HP</b>: it is the only stat her kit actually reads.</div>

  <h2><span class="glyph">&#x2767;</span> The Wound Is The Mend</h2>
  <div class="section-sub">All three skills are percentages of her own maximum HP, so every
    number below moves when her HP bar does. At level 1 that pool is <b>1935</b>.</div>
  <div class="ledger-box">
    <div class="ledger">
      <div class="entry">
        <div class="who">Silent Wing &middot; every turn</div>
        <div class="num">194</div>
        <div class="what">10% of her pool, dealt to one enemy <b>and mended onto the worst-off ally</b></div>
      </div>
      <div class="entry">
        <div class="who">Nightbloom &middot; 3-turn</div>
        <div class="num">387</div>
        <div class="what">20% of her pool as a heal, <b>plus one debuff lifted</b></div>
      </div>
      <div class="entry">
        <div class="who">Moth Dust &middot; 5-turn</div>
        <div class="num">194</div>
        <div class="what">10% to <b>every enemy in the back row</b> &#x2014; <b>387</b> each against Wind</div>
      </div>
    </div>
    <div class="ledger-cap">None of it touches her ATK. A 3&#x2605; support who reads
      <b>only HP</b> is unusually easy to gear: every point of health is simultaneously
      her survivability, her damage and her healing.</div>
  </div>

  <h2><span class="glyph">&#x21bb;</span> Lamplight</h2>
  <div class="section-sub">Silent Wing normally costs her nothing and gives the mend away.
    From the <b>back hex</b> her positional closes that circuit: the life she drains feeds
    her as well, so the same cast damages an enemy, heals the worst-off ally,
    <b>and heals her</b>. Back row is not a preference for her; it is the kit.</div>
  <div class="loop-box">
    <span class="loop-step">Silent Wing hits for <b>10% of her pool</b></span>
    <span class="loop-arrow">&#x2192;</span>
    <span class="loop-step">worst-off ally mended <b>the same amount</b></span>
    <span class="loop-arrow">&#x2192;</span>
    <span class="loop-step">back hex: <b>she is mended too</b></span>
    <span class="loop-arrow">&#x2192;</span>
    <span class="loop-step">no cooldown &#x2014; <i>every single turn</i></span>
  </div>

  <h2><span class="glyph">&#x2726;</span> Kit</h2>
  <div class="section-sub">A drain that mends, a bloom that cleans, and a cloud of scales
    over the enemy back line. Each card notes what the animation is actually doing,
    since her three strips are easy to tell apart once you know what to look for.</div>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; no cooldown</div>
      <h3>Silent Wing</h3>
      <div class="meta">Single target &middot; <b>10% of her max HP</b> &middot; heals the lowest ally for the same</div>
      <p>Her every-turn cast. The damage is modest; the point is that it
      arrives as <b>healing on whoever needs it most</b>, with no cooldown
      and no resource but her own pool.</p>
      <p class="art-note">Art: she gathers a single dark orb in her free
      hand and looses it &#x2014; one focused shot, no spread.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +5% heal &rsaquo; +5% heal &rsaquo; +5% heal &rsaquo; +5% heal &rsaquo; +5% heal <i>&middot; max Lv 6</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; 4-turn cooldown &rarr; 2 fully levelled</div>
      <h3>Nightbloom</h3>
      <div class="meta">One ally &middot; <b>20% of her max HP</b> &middot; <b>lifts 1 debuff</b></div>
      <p>Her real heal, at double Silent Wing's rate, and the only
      cleanse in her kit. The debuff it takes is the <b>oldest one</b> on
      the target, not the worst.</p>
      <p class="art-note">Art: a pale flower blooms open on her staff
      head and a ring of light gathers &#x2014; the one strip of the three
      with no projectile in it.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +5% heal &rsaquo; +5% heal &rsaquo; +5% heal &rsaquo; +1 cleansed &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 7</i></div>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; 6-turn cooldown &rarr; 4 fully levelled</div>
      <h3>Moth Dust</h3>
      <div class="meta">Enemy back row &middot; <b>10% of her max HP</b> each &middot; <b>&#x2212;30% SPD, 2 turns</b></div>
      <p>Her reach past the front line: every enemy in the <b>back row</b> takes
      the hit, then a <b>50% chance each</b> to be <b>slowed 30% for two
      turns</b>. The slow rolls its gate and then the accuracy contest;
      the damage answers to neither.</p>
      <p class="art-note">Art: her wings spread wide and a burst of
      luminous scales carries outward &#x2014; the only strip where the
      effect leaves her body in every direction.</p>
      <div class="ladder"><b>Skill ups</b> &middot; +5% power &rsaquo; +5% power &rsaquo; +20% land chance &rsaquo; +20% land chance &rsaquo; +10% land chance &rsaquo; -1 cooldown &rsaquo; -1 cooldown <i>&middot; max Lv 8</i></div>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Dust On The Wind</h3>
      <p>Moth Dust deals <b>double damage to Wind heroes</b> &#x2014; the
      scales find nothing to cling to on anyone else. It is a clean
      counter-pick line: the <b>Whisperchime</b> (sect No. 7) is
      all-Wind, so a 3&#x2605; support answers their entire back row for
      387 a head.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Position bonus &middot; back hex</div>
      <h3>Lamplight</h3>
      <p>From the back rank, <b>Silent Wing mends her for the same amount
      it gives away</b>. The drain stops being charity and becomes
      sustain &#x2014; on a no-cooldown skill, every turn of the fight.</p>
    </div>
  </div>

  <div class="dmg-table-box">
    <table>
      <thead>
        <tr><th style="text-align:left">Skill power by skill level</th>
          <th>Lv 1</th><th>Lv 2</th><th>Lv 3</th><th>Lv 4</th><th>Lv 5</th></tr>
      </thead>
      <tbody>
        <tr><th>Silent Wing, % of her max HP</th><td>10</td><td>11</td><td>12</td><td>13</td><td class="max">14</td></tr>
        <tr><th>&nbsp;&nbsp;&#x2026;at level 1, in HP</th><td>194</td><td>213</td><td>232</td><td>252</td><td class="max">271</td></tr>
        <tr><th>Nightbloom heal, % of her max HP</th><td>20</td><td>22</td><td>24</td><td>26</td><td class="max">28</td></tr>
        <tr><th>&nbsp;&nbsp;&#x2026;at level 1, in HP</th><td>387</td><td>426</td><td>464</td><td>503</td><td class="max">542</td></tr>
        <tr><th>Moth Dust, % each</th><td>10</td><td>11</td><td>12</td><td>13</td><td class="max">14</td></tr>
        <tr><th>&nbsp;&nbsp;&#x2026;against Wind</th><td>20</td><td>22</td><td>24</td><td>26</td><td class="max">28</td></tr>
      </tbody>
    </table>
    <div class="table-cap">Skill levels follow each skill&#x27;s own ladder &#x2014; see the <b>Skill ups</b> line on each card, and the level cap that comes with it. Levels are raised in Improve by sacrificing another copy. The cleanse, the &#x2212;30% slow and the Wind doubling are
      <b>fixed</b>: levels move the percentages, not the riders.</div>
  </div>

  <h2><span class="glyph">&#x2726;</span> Animations</h2>
  <div class="section-sub">Hand-drawn 256px strips, 9 frames each but the death at 17.
    Authored facing right, like the rest of the Nightflowers, so she is drawn
    unmirrored on the hero side and flipped as an enemy.</div>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle animation"><div class="cap"><b>Idle</b></div><div class="note">the wings breathe, the staff hangs</div></div>
    <div class="clip"><img src="%%fidget%%" alt="Idle fidget"><div class="cap"><b>Idle Fidget</b></div><div class="note">plays every 8&#x2013;15s of idling</div></div>
    <div class="clip"><img src="%%silentwing%%" alt="Silent Wing animation"><div class="cap"><b>Silent Wing</b></div><div class="note">one orb gathered and loosed</div></div>
    <div class="clip"><img src="%%nightbloom%%" alt="Nightbloom animation"><div class="cap"><b>Nightbloom</b></div><div class="note">the staff flower opens &#x2014; the heal</div></div>
    <div class="clip"><img src="%%mothdust%%" alt="Moth Dust animation"><div class="cap"><b>Moth Dust</b></div><div class="note">wings spread, scales carry outward</div></div>
    <div class="clip"><img src="%%death%%" alt="Death animation"><div class="cap"><b>Death</b></div><div class="note">seventeen frames; freezes on the last</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Temporal Scroll &#x1f300;</div><div class="v">3&#x2605; band &middot; 85%</div></div>
    <div style="flex:1 1 300px"><div class="k">Where she comes from</div>
      <div style="font-size:13px;color:var(--muted)">Dark heroes summon from
      <b style="color:var(--ink)">Temporal Scrolls only</b> &#x2014; Common and Rare scrolls
      draw Wind, Water and Fire. Temporal never rolls below 3&#x2605;, so she is one of
      its most common results rather than a chase.</div></div>
  </div>

  <div class="foot">Play her now at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a> &middot; Nightflower Sect No. 6 &#x2014; the first of them written, and the one who pays for everything herself.</div>
</div>
'''

for k, v in IMG.items():
    html = html.replace(f'%%{k}%%', v)

# Emit pure ASCII. A published artifact is wrapped in a <head> this file
# does not control, so it cannot declare its own charset; escaping means
# the glyphs never depend on one being supplied.
html = ''.join(c if ord(c) < 128 else f'&#x{ord(c):x};' for c in html)

out = '/home/user/browsergacha/docs/noctelle-sheet.html'
with open(out, 'w') as f:
    f.write(html)
print(out, os.path.getsize(out) // 1024, 'KB')
