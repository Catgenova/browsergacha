#!/usr/bin/env python3
"""Render the archetype bench's CSV into a readable report.

    node test/archetypes.js --sims 25 --csv > bench.csv
    python3 tools/build_bench_report.py bench.csv docs/bench-report.html

Every figure on the page is read out of the CSV; nothing is transcribed
by hand, so re-running the bench and re-running this is the whole update
path.
"""
import csv
import html
import json
import statistics
import sys
from pathlib import Path

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else 'bench.csv')
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else 'docs/bench-report.html')
META = json.loads(Path(sys.argv[3] if len(sys.argv) > 3 else 'heroes.json').read_text())

raw = SRC.read_text().splitlines()
head = next(l for l in raw if l.startswith('Archetype bench'))
start = next(i for i, l in enumerate(raw) if l.startswith('archetype,'))
# The CSV block is followed by the bench's own prose (an OUTLIERS list,
# a timing line). Stop at the first line that is not a data row, or the
# reader happily parses the epilogue into sixteen more heroes.
block = [raw[start]]
for line in raw[start + 1:]:
    if not line.strip():
        continue
    if line.count(',') != raw[start].count(','):
        break
    block.append(line)
rows = list(csv.DictReader(block))

# The bench judges each bucket on the axis that bucket exists for.
BUCKETS = [
    ('front_tank',    'Front row — Tank',    'ehp',     'Effective HP'),
    ('front_dps',     'Front row — DPS',     'dps',     'Damage a second'),
    ('center_support', 'Center — Support',   'worth/s', 'Worth a second'),
    ('center_dps',    'Center — DPS',        'dps',     'Damage a second'),
    ('back_support',  'Back row — Support',  'worth/s', 'Worth a second'),
    ('back_dps',      'Back row — DPS',      'dps',     'Damage a second'),
]
# Read out of the bench's own reporting: a hero more than double or less
# than half its bucket's median is called out rather than left in a list.
HIGH, LOW = 2.0, 0.5

f = lambda v: float(v or 0)
num = lambda v: f'{f(v):,.1f}' if f(v) % 1 else f'{int(f(v)):,}'

buckets = []
flagged = []
for key, label, axis, axis_label in BUCKETS:
    members = [r for r in rows if r['archetype'] == key]
    if not members:
        continue
    med = statistics.median(f(r[axis]) for r in members)
    for r in members:
        r['_x'] = f(r[axis]) / med if med else 0
    members.sort(key=lambda r: -r['_x'])
    for r in members:
        # Damage, healing and mitigation share one currency; a blessing
        # and a hex do not. A hero holding a field full of them is not
        # idle, so a low headline is only called out when the hero is
        # quiet on every axis the bench can see.
        r['_works'] = f(r.get('boons')) >= 1 or f(r.get('hexes')) >= 1
        if r['_x'] >= HIGH or (r['_x'] <= LOW and not r['_works']):
            flagged.append((label, axis_label, r))
    buckets.append((key, label, axis, axis_label, med, members))

flagged.sort(key=lambda t: -abs(t[2]['_x'] - 1))
sects = {}
for _, _, r in flagged:
    s = (META.get(r['hero']) or {}).get('sect') or '—'
    sects[s] = sects.get(s, 0) + 1

def bar(x):
    """A deviation bar: 1.0x sits on the centre line, and the widest
    reading in the set pins the right edge."""
    span = 4.0
    if x >= 1:
        w = min(50.0, (min(x, span) - 1) / (span - 1) * 50)
        return (f'<span class="bar"><i class="mid"></i>'
                f'<i class="fill over" style="left:50%;width:{w:.1f}%"></i></span>')
    w = (1 - x) * 50
    return (f'<span class="bar"><i class="mid"></i>'
            f'<i class="fill under" style="right:50%;width:{w:.1f}%"></i></span>')

def cls(x, works=False):
    if x >= HIGH:
        return 'over'
    return 'under' if x <= LOW and not works else ''

table_rows = []
for key, label, axis, axis_label, med, members in buckets:
    body = []
    for r in members:
        m = META.get(r['hero']) or {}
        tag = cls(r['_x'], r.get('_works'))
        body.append(f'''<tr class="{tag}">
        <th scope="row"><span class="nm">{html.escape(r['hero'])}</span><span class="ti">{html.escape(m.get('title') or '')}</span></th>
        <td class="num st">{r['rarity']}</td>
        <td class="sect">{html.escape(m.get('sect') or '—')}</td>
        <td class="num">{num(r['dps'])}</td>
        <td class="num">{num(r['heal/s'])}</td>
        <td class="num">{num(r['mit/s'])}</td>
        <td class="num ctrl">{f(r.get('boons')):.2f}</td>
        <td class="num ctrl">{f(r.get('hexes')):.2f}</td>
        <td class="num">{num(r['taken/s'])}</td>
        <td class="num key">{num(r[axis])}</td>
        <td class="dev">{bar(r['_x'])}</td>
        <td class="num x">{r['_x']:.2f}&times;</td>
      </tr>''')
    table_rows.append(f'''
  <section class="bucket" id="{key}">
    <h3>{html.escape(label)}</h3>
    <p class="meta">{len(members)} heroes &middot; judged on <b>{html.escape(axis_label.lower())}</b> &middot; median <b>{num(str(med))}</b></p>
    <div class="scroll">
      <table>
        <thead><tr>
          <th scope="col">Hero</th><th scope="col" class="num">&#9733;</th><th scope="col">Sect</th>
          <th scope="col" class="num">Dmg/s</th><th scope="col" class="num">Heal/s</th>
          <th scope="col" class="num">Mit/s</th>
          <th scope="col" class="num ctrl">Boons</th><th scope="col" class="num ctrl">Hexes</th>
          <th scope="col" class="num">Taken/s</th>
          <th scope="col" class="num key">{html.escape(axis_label)}</th>
          <th scope="col" class="dev">vs median</th><th scope="col" class="num x"></th>
        </tr></thead>
        <tbody>{''.join(body)}</tbody>
      </table>
    </div>
  </section>''')

flag_rows = []
for label, axis_label, r in flagged:
    m = META.get(r['hero']) or {}
    tag = cls(r['_x'], r.get('_works'))
    flag_rows.append(f'''<tr class="{tag}">
    <th scope="row">{html.escape(r['hero'])}</th>
    <td class="sect">{html.escape(m.get('sect') or '—')}</td>
    <td class="where">{html.escape(label)}</td>
    <td class="where">{html.escape(axis_label)}</td>
    <td class="num key">{num(r[BUCKETS[[b[1] for b in BUCKETS].index(label)][2]])}</td>
    <td class="dev">{bar(r['_x'])}</td>
    <td class="num x">{r['_x']:.2f}&times;</td>
  </tr>''')

sect_line = ', '.join(f'{n} {s}' for s, n in
                      sorted(sects.items(), key=lambda kv: -kv[1]))

TEMPLATE = Path('tools/bench_report.template.html').read_text()
page = (TEMPLATE
        .replace('%%HEADER%%', html.escape(head))
        .replace('%%NHEROES%%', str(len(rows)))
        .replace('%%NFLAG%%', str(len(flagged)))
        .replace('%%SECTLINE%%', html.escape(sect_line))
        .replace('%%FLAGROWS%%', ''.join(flag_rows))
        .replace('%%BUCKETS%%', ''.join(table_rows)))

# The published page is wrapped in a skeleton we do not control, so
# there is no <meta charset> to rely on: an em-dash written as a raw
# UTF-8 byte comes back as mojibake. Everything outside ASCII goes out
# as a numeric entity instead, which is charset-proof.
page = ''.join(c if ord(c) < 128 else f'&#{ord(c)};' for c in page)

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(page)
print(OUT, len(page), 'bytes;', len(rows), 'heroes,', len(flagged), 'flagged')
bad = [c for c in page if ord(c) > 127]
print('non-ascii:', bad[:8] if bad else 'none')
