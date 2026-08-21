# Builds docs/javarious-sheet.html: the hero dossier for Javarious.
#
# Two things differ from the Toll and Catherine builders.
#
# Every frame is mirrored. His strips are authored facing left and the
# game flips him (sprite.faceLeft), so a dossier cut straight from the
# files would show a character facing the opposite way to the one in the
# game.
#
# The Dawn Reliquary clip gets the shield painted on. The skill raises a
# shield and the game draws that as a gold bubble, so the last five
# frames of the clip -- the ones after the light gathers -- carry the
# bubble the same way the board does: frame 0 of the bubble sheet,
# multiply-tinted gold, at 75% opacity, sized to enclose him.

import base64, io, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets/heroes/Javarious')
BUBBLE = os.path.join(ROOT,
    'assets/bubble_pop_one_spritesheet_512px_by_512px_per_frame.png')
PANEL = (30, 26, 19, 255)   # --panel, so a clip has no visible box around it
SIZE = 280
GOLD = (255, 215, 106)
BUBBLE_ALPHA = 0.75

# (file, frames, fps, clip name) -- mirrors sprite.strips in the hero def.
STRIPS = [
    ('javariousidle.png',   9,  5, 'idle'),
    ('javariousidle1.png',  9,  6, 'fidget1'),
    ('javariousidle2.png',  9,  6, 'fidget2'),
    ('javariousidle3.png',  9,  6, 'fidget3'),
    ('javariousready.png',  9,  6, 'ready'),
    ('javariousskill1.png', 9, 12, 'cut'),
    ('javariousskill2.png', 9,  9, 'reliquary'),
    ('javariousskill3.png', 14, 12, 'sweep'),
    ('javariousdeath.png',  17, 10, 'death'),
]
SHIELD_ON = {'reliquary': 5}   # clip name -> shield drawn on the last N frames


def gold_bubble():
    """Frame 0 of the bubble sheet, painted gold the way js/sprites.js
    does it: multiply the colour in, then restore the original alpha."""
    sheet = Image.open(BUBBLE).convert('RGBA')
    cell = sheet.crop((0, 0, 512, 512))
    tint = Image.new('RGB', cell.size, GOLD)
    lit = Image.new('RGB', cell.size, (0, 0, 0))
    lit.paste(cell.convert('RGB'))
    from PIL import ImageChops
    painted = ImageChops.multiply(lit, tint)
    out = painted.convert('RGBA')
    alpha = cell.getchannel('A').point(lambda a: int(a * BUBBLE_ALPHA))
    out.putalpha(alpha)
    return out


def clip(fname, frames, fps, shield_last=0):
    im = Image.open(os.path.join(SRC, fname)).convert('RGBA')
    w, h = im.size
    assert w % frames == 0, f'{fname}: {w}px does not divide into {frames} frames'
    fw = w // frames
    cells = [im.crop((i * fw, 0, (i + 1) * fw, h)) for i in range(frames)]
    # Mirrored to match the game, which flips him for facing right.
    cells = [c.transpose(Image.FLIP_LEFT_RIGHT) for c in cells]

    bubble = None
    if shield_last:
        # One size and position for the whole run, taken from the union of
        # the shielded frames -- a bubble that resized every frame would
        # pulse for the wrong reason.
        boxes = [c.getbbox() for c in cells[-shield_last:] if c.getbbox()]
        left = min(b[0] for b in boxes); top = min(b[1] for b in boxes)
        right = max(b[2] for b in boxes); bottom = max(b[3] for b in boxes)
        fig_h = bottom - top
        # The bubble fills ~73% of its own frame, so the frame is drawn
        # bigger than the figure for the bubble itself to enclose it.
        side = int(fig_h * 1.12 / 0.73)
        bubble = (gold_bubble().resize((side, side), Image.LANCZOS),
                  (left + right) // 2 - side // 2,
                  (top + bottom) // 2 - side // 2)

    out = []
    for i, cell in enumerate(cells):
        bg = Image.new('RGBA', cell.size, PANEL)
        bg.alpha_composite(cell)
        if bubble and i >= frames - shield_last:
            img, bx, by = bubble
            bg.alpha_composite(img, (bx, by))
        out.append(bg.convert('RGB').resize((SIZE, SIZE), Image.NEAREST))

    buf = io.BytesIO()
    out[0].save(buf, format='GIF', save_all=True, append_images=out[1:],
                duration=int(1000 / fps), loop=0, optimize=True)
    return 'data:image/gif;base64,' + base64.b64encode(buf.getvalue()).decode()


IMG = {name: clip(f, n, fps, SHIELD_ON.get(name, 0)) for f, n, fps, name in STRIPS}


html = r'''<title>Javarious, Leader of Reverence</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
  :root {
    --ground: #16130f;
    --panel: #1e1a13;
    --panel-2: #26211a;
    --line: #4a3f2c;
    --ink: #efe8da;
    --muted: #a99b80;
    --gold: #ffd76a;
    --dawn: #f2b13c;
    --teal: #7ae8d8;
    --teal-dim: #3f8a80;
    --dawn-dim: #8a6a2e;
    --display: 'Chakra Petch', 'Trebuchet MS', sans-serif;
    --mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: var(--ground);
    color: var(--ink);
    font-family: var(--mono);
    font-size: 15px;
    line-height: 1.65;
  }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 24px 72px; }

  .eyebrow {
    font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--muted); margin-bottom: 18px;
  }
  .eyebrow b { color: var(--dawn); font-weight: 500; }

  /* ---- Hero header ---- */
  .hero { display: flex; gap: 36px; align-items: stretch; flex-wrap: wrap; }
  .hero-art {
    flex: 0 0 300px; position: relative;
    background:
      radial-gradient(ellipse 60% 45% at 50% 62%, rgba(242,177,60,.16), transparent 70%),
      var(--panel);
    border: 2px solid var(--line); border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    min-height: 320px;
  }
  .hero-art img { width: 280px; max-width: 100%; display: block; }
  .hero-art .tag {
    position: absolute; top: 10px; left: 12px;
    font-size: 11px; letter-spacing: 2px; color: var(--dawn-dim);
    text-transform: uppercase;
  }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--gold); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 {
    font-family: var(--display); font-weight: 700; font-size: 66px;
    line-height: .95; color: var(--ink); text-wrap: balance;
    text-shadow: 0 0 32px rgba(242,177,60,.35);
  }
  .title-line { font-size: 16px; color: var(--dawn); letter-spacing: 1px; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge {
    font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px;
  }
  .badge.light { border-color: var(--dawn-dim); color: var(--dawn); }
  .lede { color: var(--muted); max-width: 56ch; margin-top: 8px; }
  .lede b { color: var(--ink); font-weight: 500; }

  /* ---- Stats ---- */
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 40px; }
  .stat {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 12px 16px;
  }
  .stat .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .stat .v {
    font-family: var(--display); font-size: 30px; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.15;
  }
  .stat.atk .v { color: var(--dawn); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  .stats-note { font-size: 12px; color: var(--muted); margin-top: 8px; }

  /* ---- Sections ---- */
  h2 {
    font-family: var(--display); font-weight: 600; font-size: 30px;
    margin: 64px 0 6px; color: var(--ink);
  }
  h2 .glyph { color: var(--dawn); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }

  /* ---- Signature ---- */
  .sig-grid { display: flex; gap: 20px; flex-wrap: wrap; }
  .sig-copy { flex: 1 1 360px; }
  .sig-copy ul { list-style: none; display: flex; flex-direction: column; gap: 14px; }
  .sig-copy li { padding-left: 22px; position: relative; color: var(--ink); }
  .sig-copy li::before { content: '\2726'; position: absolute; left: 0; color: var(--dawn); font-size: 12px; top: 4px; }
  .sig-copy li b { color: var(--dawn); font-weight: 500; }
  .sig-copy li .dim { color: var(--muted); }
  .sig-box {
    flex: 0 0 300px; background: var(--panel); border: 2px solid var(--line);
    border-radius: 8px; padding: 10px; text-align: center;
  }
  .sig-box img { width: 100%; max-width: 280px; display: block; margin: 0 auto; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }

  /* ---- Abilities ---- */
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px;
  }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--dawn-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 600; font-size: 24px; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--gold); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--dawn); font-weight: 500; }
  .ability.passive-card { border-color: var(--dawn-dim); }

  .dmg-table-box { margin-top: 22px; overflow-x: auto; background: var(--panel); border: 2px solid var(--line); border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; min-width: 620px; font-size: 13px; }
  th, td { padding: 9px 14px; text-align: right; font-variant-numeric: tabular-nums; }
  thead th { color: var(--muted); font-weight: 500; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid var(--line); }
  tbody th { text-align: left; font-weight: 500; color: var(--ink); white-space: nowrap; }
  tbody tr + tr td, tbody tr + tr th { border-top: 1px solid #2f2819; }
  td.max { color: var(--dawn); font-weight: 600; }
  .table-cap { font-size: 12px; color: var(--muted); padding: 10px 14px 12px; }

  /* ---- Gallery ---- */
  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .clip { background: var(--panel); border: 2px solid var(--line); border-radius: 8px; padding: 10px; }
  .clip img { width: 100%; display: block; border-radius: 4px; }
  .clip .cap b { color: var(--ink); font-weight: 500; }
  .clip .note { font-size: 11px; color: var(--muted); letter-spacing: 0; text-transform: none; margin-top: 2px; }

  /* ---- Footer ---- */
  .acquire {
    margin-top: 64px; background: var(--panel-2); border: 2px solid var(--line);
    border-radius: 8px; padding: 20px 24px; display: flex; gap: 28px; flex-wrap: wrap;
    align-items: baseline;
  }
  .acquire .k { font-size: 11px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; }
  .acquire .v { font-family: var(--display); font-size: 22px; color: var(--gold); }
  .acquire .v.hl { color: var(--dawn); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--dawn); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>
<style>
  /* Javarious-only additions on top of the shared dossier styles. */
  .teal { color: var(--teal); }
  .shield-note {
    border-left: 3px solid var(--teal-dim);
    background: var(--panel);
    padding: 14px 18px; border-radius: 0 6px 6px 0; margin: 18px 0;
  }
  .chain { display: grid; gap: 10px; margin: 18px 0 6px; }
  .chain .step {
    display: grid; grid-template-columns: 30px 1fr; gap: 14px; align-items: start;
    background: var(--panel); border: 1px solid var(--line);
    border-radius: 6px; padding: 12px 16px;
  }
  .chain .n {
    font-family: var(--display); font-weight: 700; font-size: 20px;
    color: var(--teal); line-height: 1.2;
  }
  .bench { width: 100%; border-collapse: collapse; margin: 14px 0 6px; }
  .bench th, .bench td {
    text-align: left; padding: 9px 12px; border-bottom: 1px solid var(--line);
    font-size: 14px;
  }
  .bench th { color: var(--muted); font-weight: 500; font-size: 12px;
    letter-spacing: 1.5px; text-transform: uppercase; }
  .bench td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .bench tr:last-child td { border-bottom: none; }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>5&#9733; Light</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle</span>
      <img src="%%idle%%" alt="Javarious idle animation, greatsword planted at his side" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;<span class="rank">RARITY 5</span></div>
      <h1>JAVARIOUS</h1>
      <div class="title-line">Leader of Reverence</div>
      <div class="badges">
        <span class="badge light">&#9728; Light</span>
        <span class="badge">Front-line carry</span>
        <span class="badge">Shield &amp; strike</span>
      </div>
      <p class="lede">A greatsword carry who hits <b>twice as hard while he is untouched</b>
      &mdash; which sounds like a contradiction on the front line until you read
      the shield. <span class="teal">Absorbed damage never reaches HP</span>, so a shielded
      Javarious <em>is</em> a full-health Javarious. The bubble is not his safety net.
      It is his win condition.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">1650</div></div>
    <div class="stat atk"><div class="k">ATK</div><div class="v">258</div><div class="sub">and his shield</div></div>
    <div class="stat"><div class="k">DEF</div><div class="v">125</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">110</div></div>
    <div class="stat"><div class="k">Crit</div><div class="v">15%</div><div class="sub">&times;1.5 damage</div></div>
  </div>
  <div class="stats-note">Base values at level 1 &mdash; stats scale with level and &#9733; ascension like every hero.</div>

  <h2><span class="glyph">&#10022;</span> Dawn Reliquary</h2>
  <div class="section-sub">His signature moment, and the only skill in his kit that does no damage at all.</div>
  <div class="sig-grid">
    <div class="sig-copy">
      <ul>
        <li><b>He plants the blade and takes the light in.</b> Four frames of gathering, then the shield closes around him for the rest of the clip.</li>
        <li><b>Heal 20% ATK, shield 30% ATK, three turns.</b> The heal restores the full-health condition; the shield protects it.</li>
        <li><b>Cast it at full health on purpose.</b> The heal does nothing there, and that is fine &mdash; the shield is what he came for.</li>
        <li><span class="dim">The bubble on the last five frames is the same art the board draws: frame 0 of the bubble effect, painted gold, at 75% opacity.</span></li>
      </ul>
    </div>
    <div class="sig-box">
      <img src="%%reliquary%%" alt="Javarious planting his sword as a gold bubble shield closes around him" width="280" height="280">
      <div class="cap">Gather &middot; take the light &middot; shielded</div>
    </div>
  </div>

  <div class="shield-note">
    <b class="teal">How a shield works.</b> It is a pool of absorbed damage with a
    lifetime, and it sits <em>after</em> mitigation: a ward reduces what arrives, and
    the shield eats what is left, so the two stack rather than compete. It is spent
    oldest stack first. Break it with a hit and the bubble bursts; let it run out its
    duration and it simply fades, because nothing broke it.
  </div>

  <h2><span class="glyph">&#10022;</span> The loop</h2>
  <div class="section-sub">Four pieces that only make sense together.</div>
  <div class="chain">
    <div class="step"><div class="n">1</div><div><b>Open at full health.</b>
      Unbroken Cut and Daybreak Sweep both land for double while his HP bar is untouched
      &mdash; 310% and 280% ATK.</div></div>
    <div class="step"><div class="n">2</div><div><b>Every blow feeds the bubble.</b>
      On a front hex, 10% of the damage he deals is added to his own shield. The hex that
      puts him in reach of the enemy is the hex that pays for standing there.</div></div>
    <div class="step"><div class="n">3</div><div><b>The bubble takes the hit, not his HP.</b>
      While it holds, he is still at full health, so the doubling survives being attacked.</div></div>
    <div class="step"><div class="n">4</div><div><b>The light mends him back.</b>
      At the start of his turn he draws 5% of whatever shield is still standing back as HP,
      which is what closes the gap after a hit spills through.</div></div>
  </div>

  <h2><span class="glyph">&#10022;</span> Kit</h2>
  <div class="section-sub">Two attacks that reward being untouched, and one skill whose whole job is keeping him that way.</div>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; no cooldown</div>
      <h3>Unbroken Cut</h3>
      <div class="meta">Single target &middot; <b>155% ATK</b> &middot; <span class="hl">310% at full health</span></div>
      <p>A clean cut at one enemy. His whole rotation is built to keep this doubled.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; 3-turn cooldown</div>
      <h3>Dawn Reliquary</h3>
      <div class="meta">Self &middot; <b>heal 20% ATK</b> &middot; <b>shield 30% ATK</b>, 3 turns</div>
      <p>No damage, no target but himself. Restores the condition and then defends it.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; 4-turn cooldown</div>
      <h3>Daybreak Sweep</h3>
      <div class="meta">Enemy front rank &middot; <b>140% ATK</b> &middot; <span class="hl">280% at full health</span></div>
      <p>One sweep across every enemy holding a front hex, each of them feeding the shield.</p>
    </div>
  </div>

  <div class="passive-card">
    <div class="slot">Positional &middot; front hex only</div>
    <h3>Gathering Dawn</h3>
    <p>Every blow Javarious lands adds <b>10% of its damage</b> to his shield. Off the front
    line it does nothing at all &mdash; and neither, in practice, does the rest of him.</p>
  </div>

  <div class="passive-card">
    <div class="slot">Passive &middot; always on</div>
    <h3>Light Kept In</h3>
    <p>At the start of his turn he mends <b>5% of whatever shield is still standing</b>.
    A bigger bubble is a bigger heal, so the two halves of the kit compound.</p>
  </div>

  <h2><span class="glyph">&#10022;</span> On the bench</h2>
  <div class="section-sub">Measured at 10&#9733; level 100, ungeared, 7v7 inside his own archetype.</div>
  <table class="bench">
    <tr><th>Measurement</th><th>Javarious</th><th>Front-row DPS median</th></tr>
    <tr><td>Damage per second</td><td class="num teal">93.2</td><td class="num">101.2</td></tr>
    <tr><td>Share of the median</td><td class="num teal">0.92&times;</td><td class="num">1.00&times;</td></tr>
    <tr><td>Turns spent at full health</td><td class="num">13%</td><td class="num">&mdash;</td></tr>
    <tr><td>Damage absorbed by the shield</td><td class="num">~3,900</td><td class="num">&mdash;</td></tr>
  </table>
  <p class="dim">That 93.2 is his <em>floor</em>, not his average: it is what he does with the
  doubling almost never firing. At max level his ATK is around 4,700 against an HP pool near
  30,000, so a shield worth 30% ATK is under 5% of one bar &mdash; enough to blunt a hit,
  not enough to hold full health against a whole front line. The turns where it does hold
  spike well above the number in that table.</p>

  <h2><span class="glyph">&#10022;</span> Animations</h2>
  <div class="section-sub">Nine strips, 256px frames. Authored facing left and mirrored here,
    the same way the game flips him to face the enemy.</div>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle animation"><div class="cap"><b>Idle</b></div><div class="note">9 frames &middot; his resting loop</div></div>
    <div class="clip"><img src="%%ready%%" alt="Ready stance animation"><div class="cap"><b>Ready</b></div><div class="note">9 frames &middot; loops while it is his turn</div></div>
    <div class="clip"><img src="%%cut%%" alt="Unbroken Cut animation"><div class="cap"><b>Unbroken Cut</b></div><div class="note">9 frames &middot; connects on frame 8</div></div>
    <div class="clip"><img src="%%reliquary%%" alt="Dawn Reliquary animation with the shield"><div class="cap"><b>Dawn Reliquary</b></div><div class="note">9 frames &middot; shielded from frame 5</div></div>
    <div class="clip"><img src="%%sweep%%" alt="Daybreak Sweep animation"><div class="cap"><b>Daybreak Sweep</b></div><div class="note">14 frames &middot; the longest in his set</div></div>
    <div class="clip"><img src="%%death%%" alt="Death animation"><div class="cap"><b>Death</b></div><div class="note">17 frames &middot; freezes on the final pose</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Idle Fidget I</b></div><div class="note">plays every 8&ndash;15s of idling</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Idle Fidget II</b></div><div class="note">plays every 8&ndash;15s of idling</div></div>
    <div class="clip"><img src="%%fidget3%%" alt="Idle fidget three"><div class="cap"><b>Idle Fidget III</b></div><div class="note">plays every 8&ndash;15s of idling</div></div>
  </div>

  <h2><span class="glyph">&#10022;</span> Getting him</h2>
  <div class="acquire">
    <p><b>Temporal Scrolls only.</b> Dark and Light heroes cannot be summoned from Common or
    Rare scrolls at all. Temporal Scrolls come from chapter-end campaign clears, the
    monthly quest board, boss stages 15 and up, and every fiftieth floor of the Endless Tower.</p>
  </div>

  <div class="foot">Browser Gacha &middot; hero dossier generated from the game's own sprite
    sheets and bench runs &middot; <span class="dim">tools/build_javarious_sheet.py</span></div>
</div>
'''

for name, uri in IMG.items():
    html = html.replace(f'%%{name}%%', uri)

# The published page is wrapped in a <head> this file does not control, so
# it cannot declare its own charset; escaping means the glyphs never
# depend on one being supplied.
html = ''.join(c if ord(c) < 128 else f'&#x{ord(c):x};' for c in html)

out = os.path.join(ROOT, 'docs/javarious-sheet.html')
with open(out, 'w') as f:
    f.write(html)
print(out, os.path.getsize(out) // 1024, 'KB')
