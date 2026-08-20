import base64, os

D = '/tmp/claude-0/-home-user-browsergacha/46c6a0ed-0d90-5725-901e-c82b76954727/scratchpad/toll/gifs'
def uri(name):
    with open(f'{D}/{name}', 'rb') as f:
        return 'data:image/gif;base64,' + base64.b64encode(f.read()).decode()

IMG = {k: uri(f'{k}.gif') for k in
       ['idle', 'ready', 'attack', 'skill3', 'death', 'fidget1', 'fidget2']}

html = r'''<title>Toll, Bellringer of Reverence</title>
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
    --bell: #f2b13c;
    --bell-dim: #8a6a2e;
    --steel: #cdd6e4;
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
  .eyebrow b { color: var(--bell); font-weight: 500; }

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
    font-size: 11px; letter-spacing: 2px; color: var(--bell-dim);
    text-transform: uppercase;
  }
  .hero-id { flex: 1 1 380px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .stars { color: var(--gold); font-size: 20px; letter-spacing: 5px; }
  .stars .rank { font-size: 12px; letter-spacing: 2px; color: var(--muted); margin-left: 8px; vertical-align: 3px; }
  h1 {
    font-family: var(--display); font-weight: 700; font-size: 72px;
    line-height: .95; color: var(--ink); text-wrap: balance;
    text-shadow: 0 0 32px rgba(242,177,60,.35);
  }
  .title-line { font-size: 16px; color: var(--bell); letter-spacing: 1px; }
  .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .badge {
    font-size: 12px; padding: 3px 12px; border-radius: 999px;
    border: 1px solid var(--line); color: var(--muted); letter-spacing: 1px;
  }
  .badge.light { border-color: var(--bell-dim); color: var(--gold); }
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
  .stat.def .v { color: var(--bell); }
  .stat .sub { font-size: 11px; color: var(--muted); }
  .stats-note { font-size: 12px; color: var(--muted); margin-top: 8px; }

  /* ---- Sections ---- */
  h2 {
    font-family: var(--display); font-weight: 600; font-size: 30px;
    margin: 64px 0 6px; color: var(--ink);
  }
  h2 .glyph { color: var(--bell); }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 22px; max-width: 70ch; }

  /* ---- Retaliation ---- */
  .mirror-grid { display: flex; gap: 20px; flex-wrap: wrap; }
  .mirror-copy { flex: 1 1 360px; }
  .mirror-copy ul { list-style: none; display: flex; flex-direction: column; gap: 14px; }
  .mirror-copy li { padding-left: 22px; position: relative; color: var(--ink); }
  .mirror-copy li::before { content: '\25C6'; position: absolute; left: 0; color: var(--bell); font-size: 12px; top: 4px; }
  .mirror-copy li b { color: var(--bell); font-weight: 500; }
  .mirror-copy li .dim { color: var(--muted); }
  .shatter-box {
    flex: 0 0 300px; background: var(--panel); border: 2px solid var(--line);
    border-radius: 8px; padding: 10px; text-align: center;
  }
  .shatter-box img { width: 100%; max-width: 280px; display: block; margin: 0 auto; }
  .cap { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 8px; }

  /* ---- Abilities ---- */
  .abilities { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .ability {
    background: var(--panel); border: 2px solid var(--line); border-radius: 8px;
    padding: 18px 20px; display: flex; flex-direction: column; gap: 8px;
  }
  .ability .slot { font-size: 11px; letter-spacing: 2px; color: var(--bell-dim); text-transform: uppercase; }
  .ability h3 { font-family: var(--display); font-weight: 600; font-size: 24px; }
  .ability .meta { font-size: 12px; color: var(--muted); }
  .ability .meta b { color: var(--gold); font-weight: 500; }
  .ability p { font-size: 13.5px; color: var(--ink); }
  .ability p b { color: var(--bell); font-weight: 500; }
  .ability.passive-card { border-color: var(--bell-dim); }

  .dmg-table-box { margin-top: 22px; overflow-x: auto; background: var(--panel); border: 2px solid var(--line); border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; min-width: 640px; font-size: 13px; }
  th, td { padding: 9px 14px; text-align: right; font-variant-numeric: tabular-nums; }
  thead th { color: var(--muted); font-weight: 500; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid var(--line); }
  tbody th { text-align: left; font-weight: 500; color: var(--ink); white-space: nowrap; }
  tbody tr + tr td, tbody tr + tr th { border-top: 1px solid #2f2819; }
  td.max { color: var(--bell); font-weight: 600; }
  td.na { color: var(--muted); }
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
  .acquire .v.cy { color: var(--bell); }
  .foot { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .foot a { color: var(--bell); }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="wrap">
  <div class="eyebrow">Browser Gacha &middot; Hero Dossier &middot; <b>5&#9733; Light</b></div>

  <div class="hero">
    <div class="hero-art">
      <span class="tag">Idle &middot; the bell at rest</span>
      <img src="%%idle%%" alt="Toll idle animation, a bronze bell-bodied knight resting on his clapper staff" width="280" height="280">
    </div>
    <div class="hero-id">
      <div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;<span class="rank">RARITY 5</span></div>
      <h1>TOLL</h1>
      <div class="title-line">Bellringer of Reverence</div>
      <div class="badges">
        <span class="badge light">&#9728; Light</span>
        <span class="badge">Front-row tank</span>
        <span class="badge">DEF scaling</span>
      </div>
      <p class="lede">A bell wearing armour, or armour cast as a bell &mdash; nobody has asked.
      Every one of his numbers is priced in <b>DEF</b>, and the two that matter most are not
      his to spend: <b>being hit is his attack</b>. Strike him and the peal goes out across the
      whole enemy line; strike him while he holds the front and the same blow mends your party.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="k">HP</div><div class="v">2650</div></div>
    <div class="stat"><div class="k">ATK</div><div class="v">96</div><div class="sub">unused by his kit</div></div>
    <div class="stat def"><div class="k">DEF</div><div class="v">300</div><div class="sub">drives everything</div></div>
    <div class="stat"><div class="k">SPD</div><div class="v">84</div><div class="sub">slowest 5&#9733;</div></div>
    <div class="stat"><div class="k">Crit</div><div class="v">15%</div><div class="sub">&times;1.5 damage</div></div>
  </div>
  <div class="stats-note">Base values at level 1 &mdash; stats scale with level and &#9733; ascension like every hero.</div>

  <h2><span class="glyph">&#9670;</span> Being Hit Is The Attack</h2>
  <div class="section-sub">Toll has no resource to spend and nothing to set up. His two best abilities are ones the enemy chooses to trigger.</div>
  <div class="mirror-grid">
    <div class="mirror-copy">
      <ul>
        <li><b>Every blow answered.</b> Each time Toll takes a hit and survives it, the bell rings for <b>10% of his DEF to every living enemy</b> &mdash; not the attacker, the whole line.</li>
        <li><b>The ward mends.</b> Held in a front hex, that same blow restores <b>5% of his DEF to the entire party</b>. One attack on him heals five allies.</li>
        <li><b>He has to live through it.</b> A killing blow rings nothing. The retaliation checks that he survived, which is what the 2650 HP is paying for.</li>
        <li><b>The bell cannot answer itself.</b> Retaliation damage is not a strike, so two Tolls facing each other trade one ring apiece instead of ringing until one dies.</li>
        <li><span class="dim">Both hooks fire on the attacker's turn and resolve inline &mdash; he never takes an extra turn for them.</span></li>
      </ul>
    </div>
    <div class="shatter-box">
      <img src="%%skill3%%" alt="Toll swinging his clapper into the bell, a burst of light on the strike" width="280" height="280">
      <div class="cap">The Reckoning &mdash; calling in the debt</div>
    </div>
  </div>

  <h2><span class="glyph">&#9670;</span> Kit</h2>
  <div class="section-sub">Not one number scales off ATK. Building him tanky is building his damage, his healing, and his survival at once.</div>
  <div class="abilities">
    <div class="ability">
      <div class="slot">Skill 1 &middot; no cooldown</div>
      <h3>First Toll</h3>
      <div class="meta">Enemy front hexes &middot; <b>50% DEF</b></div>
      <p>Ring the bell over the front line. Hits <b>every front-hex enemy</b> &mdash; up to three &mdash; for 50% of his DEF each.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 2 &middot; 3-turn cooldown</div>
      <h3>Full Peal</h3>
      <div class="meta">All enemies &middot; <b>50% DEF</b></div>
      <p>The same swing, carried across the whole field. <b>Every living enemy</b> takes 50% of his DEF.</p>
    </div>
    <div class="ability">
      <div class="slot">Skill 3 &middot; 5-turn cooldown</div>
      <h3>The Reckoning</h3>
      <div class="meta">All enemies &middot; <b>&minus;30% DEF, &minus;30% ATK</b> &middot; 2 turns</div>
      <p>No damage at all. The entire enemy formation loses <b>30% DEF and 30% ATK</b> for two turns &mdash; softening them for the bell while blunting what they can do back.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Passive</div>
      <h3>Every Blow Answered</h3>
      <p>Each time Toll is struck <em>and survives</em>, the bell rings: <b>10% of his DEF to ALL enemies</b>. Scales with how many of them there are, and with how badly they want him dead.</p>
    </div>
    <div class="ability passive-card">
      <div class="slot">Position bonus &middot; front hex</div>
      <h3>Tolling Ward</h3>
      <p>While Toll holds a front hex, each blow he survives <b>mends the whole party for 5% of his DEF</b>. Out of position, the ward is silent.</p>
    </div>
  </div>

  <div class="dmg-table-box">
    <table>
      <thead>
        <tr><th style="text-align:left">Raw output, % of DEF</th>
          <th>1 foe</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7 foes</th></tr>
      </thead>
      <tbody>
        <tr><th>First Toll (front hexes)</th><td>50</td><td>100</td><td class="max">150</td><td class="na">150</td><td class="na">150</td><td class="na">150</td><td class="na">150</td></tr>
        <tr><th>Full Peal (all)</th><td>50</td><td>100</td><td>150</td><td>200</td><td>250</td><td>300</td><td class="max">350</td></tr>
        <tr><th>Every Blow Answered (per hit taken)</th><td>10</td><td>20</td><td>30</td><td>40</td><td>50</td><td>60</td><td class="max">70</td></tr>
        <tr><th>Tolling Ward (healing, per hit taken)</th><td colspan="7" style="text-align:right">5% of DEF to each of up to 7 allies &mdash; <span style="color:var(--bell)">35% at a full party</span></td></tr>
      </tbody>
    </table>
    <div class="table-cap">Totals across the formation, before the target's own defences. Like every damage
      path in the game, each hit then runs the DEF curve, guards, and dodge &mdash; a big DEF stat is not a
      way around mitigation. Skill levels add +10% power per level (max Lv 5, Skill Tomes from the Endless Tower).</div>
  </div>

  <h2><span class="glyph">&#9670;</span> Animations</h2>
  <div class="section-sub">Hand-drawn 256px strips, nine frames each &mdash; eleven for the fall.</div>
  <div class="gallery">
    <div class="clip"><img src="%%idle%%" alt="Idle animation"><div class="cap"><b>Idle</b></div><div class="note">9 frames &middot; his resting loop</div></div>
    <div class="clip"><img src="%%ready%%" alt="Ready stance animation"><div class="cap"><b>Ready</b></div><div class="note">9 frames &middot; clapper raised, waiting to act</div></div>
    <div class="clip"><img src="%%attack%%" alt="First Toll and Full Peal attack animation"><div class="cap"><b>First Toll / Full Peal</b></div><div class="note">9 frames &middot; one swing serves both, near or wide</div></div>
    <div class="clip"><img src="%%skill3%%" alt="The Reckoning animation"><div class="cap"><b>The Reckoning</b></div><div class="note">9 frames &middot; the strike that calls in the debt</div></div>
    <div class="clip"><img src="%%death%%" alt="Death animation"><div class="cap"><b>Death</b></div><div class="note">11 frames &middot; the bell goes over</div></div>
    <div class="clip"><img src="%%fidget1%%" alt="Idle fidget one"><div class="cap"><b>Fidget I</b></div><div class="note">idle variant &middot; cuts in between resting loops</div></div>
    <div class="clip"><img src="%%fidget2%%" alt="Idle fidget two"><div class="cap"><b>Fidget II</b></div><div class="note">idle variant &middot; cuts in between resting loops</div></div>
  </div>

  <div class="acquire">
    <div><div class="k">Rare Scroll &#10024;</div><div class="v">2%</div></div>
    <div><div class="k">Temporal Scroll &#127744;</div><div class="v">3%</div></div>
    <div><div class="k">Pity</div><div class="v cy">40 pulls</div></div>
    <div style="flex:1 1 240px"><div class="k">Where</div>
      <div style="font-size:13px;color:var(--muted)">Light 5&#9733;, so the Temporal Scroll pool is the reliable route &mdash;
      Dark and Light only appear there.</div></div>
  </div>

  <div class="foot">Play him now at <a href="https://catgenova.github.io/browsergacha/">catgenova.github.io/browsergacha</a> &middot; in the pool since build v205.</div>
</div>
'''

for k, v in IMG.items():
    html = html.replace(f'%%{k}%%', v)

out = '/home/user/browsergacha/docs/toll-sheet.html'
with open(out, 'w') as f:
    f.write(html)
print(out, os.path.getsize(out) // 1024, 'KB')
