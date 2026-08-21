// Generates the Balance Sheet: the archetype bench's full table as a
// standalone page, to be published as an artifact and re-published after
// every balance pass.
//
//   node test/balance_sheet.js              # default, 9 sims
//   node test/balance_sheet.js --sims 25    # steadier numbers, slower
//
// Writes docs/balance-sheet.html. The page carries the build it was
// measured from, so two passes can always be told apart.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const bench = require('./archetypes');
const data = bench.bench();

const ROOT = path.join(__dirname, '..');
const git = (args, fallback) => {
  try { return execFileSync('git', args, { cwd: ROOT }).toString().trim(); }
  catch (e) { return fallback; }
};
// The stamp records the game code the numbers came from. Measuring with
// uncommitted balance edits is the normal case mid-pass, so say so rather
// than quietly crediting the last commit.
const sha = git(['rev-parse', '--short=8', 'HEAD'], 'working copy');
const dirty = git(['status', '--porcelain', 'js'], '') !== '';
const build = dirty ? `${sha} + uncommitted edits` : sha;
const measured = new Date().toISOString().slice(0, 16).replace('T', ' ');

// ---- Shape the numbers for the page --------------------------------------

const median = (xs) => {
  if (!xs.length) return 0;
  const s = xs.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const COLUMNS = [
  { key: 'dps', label: 'dps', dp: 1 },
  { key: 'direct', label: 'direct', dp: 1 },
  { key: 'poison', label: 'poison', dp: 1 },
  { key: 'heal/s', label: 'heal/s', dp: 1 },
  { key: 'mit/s', label: 'mit/s', dp: 1 },
  { key: 'taken/s', label: 'taken/s', dp: 1 },
  { key: 'mit%', label: 'mit %', dp: 1 },
  { key: 'ehp', label: 'ehp', dp: 0 },
];

const HEROES = require('./harness').loadGame().HEROES;

const buckets = data.order.map((key) => {
  const headline = data.headline[key];
  const rows = data.buckets[key].slice()
    .sort((a, b) => b[headline] - a[headline]);
  for (const r of rows) r.can = bench.kitCan(HEROES[r.id], headline);
  // Median over the heroes that can post this metric — a buffer's zero
  // heal/s is not a data point about healing.
  const mid = median(rows.filter((r) => r.can).map((r) => r[headline]));
  let outliers = 0;
  for (const r of rows) {
    r.ratio = mid > 0 ? r[headline] / mid : 0;
    r.flag = !r.can ? 'na'
      : r.ratio >= 2 ? 'over'
      : r.ratio <= 0.4 ? 'under' : '';
    if (r.flag === 'over' || r.flag === 'under') outliers++;
  }
  return { key, title: data.titles[key], headline, median: mid, outliers, rows };
});

const totalOutliers = buckets.reduce((n, b) => n + b.outliers, 0);

// ---- Page ----------------------------------------------------------------

const esc = (s) => String(s).replace(/[&<>"]/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// The published page is wrapped in a <head> this file does not control,
// so it cannot declare a charset. Emitting pure ASCII removes the
// question: markup gets numeric entities, JSON gets \uXXXX escapes.
const asciiHtml = (s) => s.replace(/[^\x00-\x7F]/g,
  (c) => '&#x' + c.codePointAt(0).toString(16) + ';');
const asciiJson = (s) => s.replace(/[^\x00-\x7F]/g,
  (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));

const payload = JSON.stringify({
  build, measured, meta: data.meta, columns: COLUMNS,
  buckets: buckets.map((b) => ({
    key: b.key, title: b.title, headline: b.headline,
    median: b.median, outliers: b.outliers,
    rows: b.rows.map((r) => ({
      name: r.name, rarity: r.rarity, ratio: r.ratio, flag: r.flag,
      v: COLUMNS.map((c) => r[c.key]),
    })),
  })),
});

const html = `<title>Archetype Balance Sheet</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap">
<style>
:root {
  --ground:#f5f3f8; --panel:#ffffff; --panel-2:#faf9fc; --line:#e0dae9;
  --line-strong:#c9c0d8; --ink:#221d31; --ink-dim:#6b6383; --ink-faint:#9990ad;
  --accent:#8a6410; --accent-soft:#f0e3c2;
  --over:#b8442a; --over-soft:#f7e0d9; --under:#1f6699; --under-soft:#d9e8f5;
  --stripe:#efecf4;
  --radius:3px;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --ground:#15121e; --panel:#1d1929; --panel-2:#221d31; --line:#322b46;
    --line-strong:#463c60; --ink:#e8e4f2; --ink-dim:#9990b2; --ink-faint:#6b6386;
    --accent:#f0c14b; --accent-soft:#3a3018;
    --over:#e2755c; --over-soft:#3a231d; --under:#5b9dd9; --under-soft:#182a3a;
    --stripe:#1a1626;
  }
}
:root[data-theme="dark"] {
  --ground:#15121e; --panel:#1d1929; --panel-2:#221d31; --line:#322b46;
  --line-strong:#463c60; --ink:#e8e4f2; --ink-dim:#9990b2; --ink-faint:#6b6386;
  --accent:#f0c14b; --accent-soft:#3a3018;
  --over:#e2755c; --over-soft:#3a231d; --under:#5b9dd9; --under-soft:#182a3a;
  --stripe:#1a1626;
}

* { box-sizing:border-box; }
body {
  margin:0; background:var(--ground); color:var(--ink);
  font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
  font-size:13px; line-height:1.5;
  -webkit-font-smoothing:antialiased;
}
.wrap { max-width:1280px; margin:0 auto; padding:28px 20px 64px; display:flex; flex-direction:column; gap:22px; }

/* ---- Masthead ---- */
.mast { display:flex; flex-wrap:wrap; align-items:flex-end; gap:16px 28px; padding-bottom:16px; border-bottom:2px solid var(--line-strong); }
h1 {
  font-family:Archivo,system-ui,sans-serif; font-weight:700;
  font-size:clamp(26px,4vw,38px); letter-spacing:-0.02em; line-height:1;
  margin:0; text-wrap:balance;
}
.lede { color:var(--ink-dim); margin:6px 0 0; max-width:62ch; font-size:12.5px; }
.provenance { margin-left:auto; text-align:right; font-size:11.5px; color:var(--ink-dim); }
.provenance b { color:var(--ink); font-weight:500; }

/* ---- Run parameters ---- */
.params { display:flex; flex-wrap:wrap; gap:0; border:1px solid var(--line); border-radius:var(--radius); background:var(--panel); overflow:hidden; }
.param { flex:1 1 120px; padding:9px 13px; border-right:1px solid var(--line); }
.param:last-child { border-right:0; }
.param dt { margin:0; font-size:10px; letter-spacing:.09em; text-transform:uppercase; color:var(--ink-faint); }
.param dd { margin:2px 0 0; font-weight:500; font-variant-numeric:tabular-nums; }

/* ---- Summary strip / jump nav ---- */
.summary { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:9px; list-style:none; margin:0; padding:0; }
.sum {
  display:block; width:100%; text-align:left; cursor:pointer;
  background:var(--panel); border:1px solid var(--line); border-left:3px solid var(--line-strong);
  border-radius:var(--radius); padding:10px 12px; color:inherit; font:inherit;
}
.sum:hover { border-color:var(--line-strong); background:var(--panel-2); }
.sum:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
.sum.has-out { border-left-color:var(--over); }
.sum-t { font-family:Archivo,system-ui,sans-serif; font-weight:600; font-size:12px; letter-spacing:.02em; }
.sum-n { display:flex; justify-content:space-between; align-items:baseline; margin-top:5px; font-variant-numeric:tabular-nums; }
.sum-med { font-size:17px; font-weight:700; color:var(--accent); }
.sum-unit { font-size:10.5px; color:var(--ink-faint); }
.sum-meta { margin-top:3px; font-size:10.5px; color:var(--ink-dim); }

/* ---- Controls ---- */
.controls { display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
input[type=search] {
  font:inherit; font-size:12.5px; color:var(--ink); background:var(--panel);
  border:1px solid var(--line-strong); border-radius:var(--radius);
  padding:7px 11px; min-width:230px;
}
input[type=search]:focus-visible { outline:2px solid var(--accent); outline-offset:1px; }
.hint { font-size:11.5px; color:var(--ink-faint); }

/* ---- Tables ---- */
section { border:1px solid var(--line); border-radius:var(--radius); background:var(--panel); overflow:hidden; scroll-margin-top:12px; }
.head { display:flex; flex-wrap:wrap; align-items:baseline; gap:8px 14px; padding:12px 14px; border-bottom:1px solid var(--line); background:var(--panel-2); }
.head h2 { font-family:Archivo,system-ui,sans-serif; font-size:14px; font-weight:700; letter-spacing:.03em; margin:0; }
.head .by { font-size:11.5px; color:var(--ink-dim); }
.head .by b { color:var(--accent); font-weight:500; }
.scroll { overflow-x:auto; }
table { border-collapse:collapse; width:100%; font-variant-numeric:tabular-nums; }
th, td { padding:5px 9px; text-align:right; white-space:nowrap; }
th:first-child, td:first-child { text-align:left; }
/* The hero column is second (rank leads), so it needs saying. */
th[data-c="-1"], td.name { text-align:left; }
thead th {
  position:sticky; top:0; z-index:1; background:var(--panel-2);
  font-size:10px; letter-spacing:.07em; text-transform:uppercase; font-weight:500;
  color:var(--ink-dim); border-bottom:1px solid var(--line-strong); cursor:pointer;
  user-select:none;
}
thead th:hover { color:var(--ink); }
thead th:focus-visible { outline:2px solid var(--accent); outline-offset:-2px; }
thead th.is-headline { color:var(--accent); box-shadow:inset 0 -2px 0 var(--accent); }
thead th .dir { opacity:0; }
thead th.sorted .dir { opacity:1; }
tbody tr:nth-child(even) { background:var(--stripe); }
tbody tr:hover { background:var(--accent-soft); }
td.name { font-weight:500; }
td.rank { color:var(--ink-faint); width:1%; padding-right:2px; }
td.dim { color:var(--ink-faint); }
tr.over td.name { box-shadow:inset 3px 0 0 var(--over); }
tr.under td.name { box-shadow:inset 3px 0 0 var(--under); }
.na { color:var(--ink-faint); font-style:italic; }

/* Deviation: a diverging bar around the bucket median. */
.dev { width:210px; }
.devwrap { display:flex; align-items:center; gap:9px; justify-content:flex-end; }
.devbox { position:relative; height:12px; width:130px; flex:none; background:var(--stripe); border-radius:1px; }
.devbox::before { content:""; position:absolute; left:50%; top:0; bottom:0; width:1px; background:var(--line-strong); }
.devbar { position:absolute; top:2px; bottom:2px; border-radius:1px; }
.devbar.up { left:50%; background:var(--over); }
.devbar.dn { right:50%; background:var(--under); }
.devnum { width:52px; text-align:right; flex:none; color:var(--ink-dim); }
.devnum.over { color:var(--over); }
.devnum.under { color:var(--under); }

footer { color:var(--ink-dim); font-size:11.5px; border-top:1px solid var(--line); padding-top:14px; }
footer p { margin:0 0 7px; max-width:78ch; }
footer code { background:var(--panel-2); border:1px solid var(--line); border-radius:2px; padding:1px 5px; }
.empty { padding:14px; color:var(--ink-faint); }
@media (prefers-reduced-motion:reduce) { * { animation:none !important; transition:none !important; } }
</style>

<div class="wrap">
  <header class="mast">
    <div>
      <h1>Archetype Balance Sheet</h1>
      <p class="lede">Every hero at max stars and max level with no gear, measured against
        its own archetype. Ranked on the one number its role exists to produce.</p>
    </div>
    <div class="provenance">
      build <b>${esc(build)}</b><br>measured <b>${esc(measured)}</b>
    </div>
  </header>

  <dl class="params" id="params"></dl>

  <div class="summary" id="summary"></div>

  <div class="controls">
    <input type="search" id="filter" placeholder="Filter by hero name…" aria-label="Filter by hero name">
    <span class="hint" id="count"></span>
    <span class="hint">Click any column to re-sort. The gold column is what the bucket is ranked on.</span>
  </div>

  <div id="tables"></div>

  <footer>
    <p><b>Protocol.</b> For each archetype a fixed sparring cast is drawn from that same
      archetype &mdash; six allies and seven opponents, the median-power members of the bucket.
      Every hero is dropped into the same fight in place of one ally, so the only thing that
      changes between runs is the hero under test. Both formations are filled: an ability that
      hits a row or the whole field is worth nothing against a half-empty board, so a smaller
      squad quietly undervalues every hero whose kit scales with target count. Runs are seeded,
      so a difference between two heroes is a difference in the heroes.</p>
    <p><b>Reading poison.</b> Poison used to skip the DEF curve entirely, which made
      it worth about 9&#xd7; ordinary damage at this max-level premise and put a DoT carry
      at the top of every bucket. It now goes through the same pipeline as everything
      else &mdash; there are no damage paths left that bypass mitigation. The column stays
      because the split is still worth seeing: a tick is locked in at cast off the
      caster's ATK and cannot crit or be dodged, so a hero leaning on it trades burst
      for damage that lands whatever the target does.</p>
    <p><b>Regenerate after a balance pass.</b> <code>node test/balance_sheet.js</code>, then
      re-publish this file to the same URL.</p>
  </footer>
</div>

<script id="data" type="application/json">${asciiJson(payload).replace(/</g, '\\u003c')}</script>
<script>
const D = JSON.parse(document.getElementById('data').textContent);
const fmt = (n, dp) => n.toLocaleString(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp });

document.getElementById('params').innerHTML = [
  ['heroes', D.meta.heroes],
  ['stars', D.meta.stars + '\\u2605'],
  ['level', D.meta.level],
  ['gear', 'none'],
  ['squad', D.meta.squad + 'v' + D.meta.squad],
  ['sims each', D.meta.sims],
  ['window', D.meta.window + 's'],
  ['attrition', Math.round(D.meta.attrition * 100) + '%/s'],
].map(([k, v]) => '<div class="param"><dt>' + k + '</dt><dd>' + v + '</dd></div>').join('');

document.getElementById('summary').innerHTML = D.buckets.map((b) =>
  '<button class="sum' + (b.outliers ? ' has-out' : '') + '" data-jump="' + b.key + '">' +
    '<div class="sum-t">' + b.title + '</div>' +
    '<div class="sum-n"><span class="sum-med">' + fmt(b.median, 1) + '</span>' +
      '<span class="sum-unit">median ' + b.headline + '</span></div>' +
    '<div class="sum-meta">' + b.rows.length + ' heroes \\u00b7 ' +
      (b.outliers ? b.outliers + ' outlier' + (b.outliers === 1 ? '' : 's') : 'none off median') +
    '</div>' +
  '</button>').join('');

document.querySelectorAll('[data-jump]').forEach((el) => el.addEventListener('click', () => {
  const t = document.getElementById(el.dataset.jump);
  if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
}));

// Sort state per bucket; every bucket opens on its own headline metric,
// descending — the ranking the bench itself uses.
const sortState = {};
for (const b of D.buckets) {
  sortState[b.key] = { col: D.columns.findIndex((c) => c.key === b.headline), dir: -1 };
}
// Column -1 is the hero name and -2 the rarity; everything else indexes
// the metric array.
const byCol = (r, c) => (c === -1 ? r.name : c === -2 ? r.rarity : r.v[c]);

function devCell(ratio, flag) {
  if (flag === 'na') return '<td class="dev"><span class="na">no kit for it</span></td>';
  // Log scale: these are ratios, so 2x above and 0.5x below are the same
  // distance from the centre line and should read that way. The bar
  // saturates at 2x / 0.5x, which is exactly the outlier threshold.
  const span = ratio > 0 ? Math.min(1, Math.abs(Math.log2(ratio))) * 50 : 50;
  const bar = ratio >= 1
    ? '<div class="devbar up" style="width:' + span + '%"></div>'
    : '<div class="devbar dn" style="width:' + span + '%"></div>';
  const cls = flag === 'over' ? ' over' : flag === 'under' ? ' under' : '';
  return '<td class="dev"><div class="devwrap"><div class="devbox">' + bar +
    '</div><span class="devnum' + cls + '">' + ratio.toFixed(2) + '\\u00d7</span></div></td>';
}

function drawBucket(b, q) {
  const st = sortState[b.key];
  const rows = b.rows
    .map((r, i) => ({ r, seed: i }))
    .filter(({ r }) => !q || r.name.toLowerCase().includes(q))
    .sort((a, x) => {
      const av = byCol(a.r, st.col);
      const xv = byCol(x.r, st.col);
      const cmp = typeof av === 'string' ? av.localeCompare(xv) : av - xv;
      // dir -1 is descending, which is how every bucket opens.
      return cmp * st.dir || a.seed - x.seed; // stable within ties
    });
  const th = (c, label, extra) =>
    '<th tabindex="0" data-b="' + b.key + '" data-c="' + c + '" class="' + (extra || '') +
    (st.col === c ? ' sorted' : '') + '">' + label +
    ' <span class="dir">' + (st.dir < 0 ? '\\u25be' : '\\u25b4') + '</span></th>';
  const head = '<tr><th></th>' + th(-1, 'hero') + th(-2, '\\u2605') +
    D.columns.map((c, i) => th(i, c.label, c.key === b.headline ? 'is-headline' : '')).join('') +
    '<th>vs median</th></tr>';
  const body = rows.map(({ r }, i) =>
    '<tr class="' + r.flag + '"><td class="rank">' + (i + 1) + '</td>' +
    '<td class="name">' + r.name + '</td><td class="dim">' + r.rarity + '</td>' +
    D.columns.map((c, ci) =>
      '<td' + (r.v[ci] === 0 ? ' class="dim"' : '') + '>' + fmt(r.v[ci], c.dp) + '</td>').join('') +
    devCell(r.ratio, r.flag) + '</tr>').join('');
  const table = rows.length
    ? '<div class="scroll"><table><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>'
    : '<div class="empty">No hero here matches that filter.</div>';
  return {
    shown: rows.length,
    html: '<section id="' + b.key + '">' +
      '<div class="head"><h2>' + b.title + '</h2>' +
      '<span class="by">' + b.rows.length + ' heroes \\u00b7 ranked on <b>' + b.headline +
      '</b> \\u00b7 median ' + fmt(b.median, 1) + '</span></div>' + table + '</section>',
  };
}

function draw() {
  const q = document.getElementById('filter').value.trim().toLowerCase();
  let shown = 0;
  let total = 0;
  const parts = D.buckets.map((b) => {
    const out = drawBucket(b, q);
    total += b.rows.length;
    shown += out.shown;
    return out.html;
  });
  document.getElementById('tables').innerHTML = parts.join('');
  document.getElementById('count').textContent =
    q ? shown + ' of ' + total + ' heroes' : total + ' heroes';

  document.querySelectorAll('thead th[data-c]').forEach((el) => {
    const go = () => {
      const st = sortState[el.dataset.b];
      const c = Number(el.dataset.c);
      st.dir = st.col === c ? -st.dir : -1; // re-click flips direction
      st.col = c;
      draw();
    };
    el.addEventListener('click', go);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });
}

document.getElementById('filter').addEventListener('input', () => draw());
draw();
</script>
`;

fs.mkdirSync(path.join(ROOT, 'docs'), { recursive: true });
const out = path.join(ROOT, 'docs', 'balance-sheet.html');
fs.writeFileSync(out, asciiHtml(html));
console.log(`Balance sheet written: ${path.relative(ROOT, out)}`);
console.log(`  build ${build} · ${data.meta.heroes} heroes · ${data.meta.sims} sims each`);
console.log(`  ${buckets.map((b) => `${b.key} ${b.rows.length}`).join(' · ')}`);
console.log(`  ${totalOutliers} outlier(s) across all buckets`);
