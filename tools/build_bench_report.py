#!/usr/bin/env python3
"""Render the archetype bench's CSV into a readable report.

    node test/archetypes.js --sims 25 --csv > bench.csv
    python3 tools/build_bench_report.py bench.csv docs/bench-report.html

Every figure on the page is read out of the CSV; nothing is transcribed
by hand, so re-running the bench and re-running this is the whole update
path.
"""
import csv
import re
import html
import json
import statistics
import sys
from pathlib import Path

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else 'bench.csv')
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else 'docs/bench-report.html')
META = json.loads(Path(sys.argv[3] if len(sys.argv) > 3 else 'heroes.json').read_text())
# The lift bench (test/lift.js --csv). Optional: the page renders without
# it, because the two benches are run separately and one should not be
# able to block the other.
LIFT = Path(sys.argv[4]) if len(sys.argv) > 4 else None

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

# ---- The rarity curve -----------------------------------------------------
# The design goal is 5-star around 1.25x their bucket median, 3-star ON the
# median, and the cheap shelves below it. This block reads the curve straight
# off the same CSV rather than trusting a per-skill balance pass to have moved
# it, and it prints the median BENCHED POWER beside it -- because if power is
# inverted by rarity, no amount of skill tuning can right the curve.
TARGET = {5: 1.25, 4: 1.10, 3: 1.00, 2: 0.85, 1: 0.70}
curve_rows = []
for star in (5, 4, 3, 2, 1):
    band = [r for r in rows if int(r['rarity']) == star]
    if not band:
        continue
    med = statistics.median([r['_x'] for r in band])
    pw = statistics.median([float(r['power']) for r in band])
    want = TARGET[star]
    off = med - want
    tag = 'over' if off > 0.12 else ('under' if off < -0.12 else 'mid')
    curve_rows.append(f'''<tr class="{tag}">
    <th scope="row">{star}&#9733;</th>
    <td class="num st">{len(band)}</td>
    <td class="num key">{med:.2f}&times;</td>
    <td class="num">{want:.2f}&times;</td>
    <td class="dev">{bar(med / want)}</td>
    <td class="num x">{off:+.2f}</td>
    <td class="num">{pw:,.0f}</td>
  </tr>''')

# Benched power at the SAME stars and level should climb with rarity, and
# for a long time it fell: see the prose this feeds. The ratio below is the
# dearest shelf over the cheapest -- above 1 is right way up.
pw_by_star = {int(r['rarity']): [] for r in rows}
for r in rows:
    pw_by_star[int(r['rarity'])].append(float(r['power']))
_cheapest = statistics.median(pw_by_star[min(pw_by_star)])
_dearest = statistics.median(pw_by_star[max(pw_by_star)])
power_spread = f'{_dearest / _cheapest:.2f}'

# ---------------------------------------------------------------------------
# The lift bench. The mirror above is structurally blind to a party buff --
# both sides get it, so it cancels -- and blind to a summoner, whose output
# is credited to the body it stood up. This measures the other thing: the
# same party twice against a fixed wave, once with the hero and once
# without, paired on the seed, reported as time-to-clear.
# ---------------------------------------------------------------------------
lift_rows, lift_head, lift_note = [], '', ''
if LIFT and LIFT.exists():
    lraw = LIFT.read_text().splitlines()
    lift_head = next((l for l in lraw if l.startswith('Lift bench')), '')
    lstart = next((i for i, l in enumerate(lraw) if l.startswith('hero,')), None)
    if lstart is not None:
        lift_data = list(csv.DictReader(lraw[lstart:]))
        # A hero is only comparable if the wave actually fell on both
        # sides. A censored run is dropped rather than quietly averaged in.
        clean = [r for r in lift_data
                 if int(r['clearedWith']) == 100 and int(r['clearedWithout']) == 100]
        lift_note = ('Every hero cleared the wave in all 25 paired runs, so no reading '
                     'here is censored.' if len(clean) == len(lift_data) else
                     f'{len(clean)} of {len(lift_data)} heroes cleared the wave in every '
                     'paired run; the rest are omitted rather than averaged from a '
                     'censored fight.')
        widest = max((abs(f(r['faster'])) for r in clean), default=1) or 1
        for r in clean:
            m = META.get(r['name']) or {}
            v = f(r['faster'])
            err = f(r['fasterErr'])
            # Inside one standard error of nothing is not a reading.
            flat = abs(v) <= err
            tag = 'flat' if flat else ('over' if v > 0 else 'under')
            w = min(50.0, abs(v) / widest * 50)
            side = (f'<i class="fill over" style="left:50%;width:{w:.1f}%"></i>' if v > 0
                    else f'<i class="fill under" style="right:50%;width:{w:.1f}%"></i>')
            lift_rows.append(f'''<tr class="{tag}">
    <th scope="row">{html.escape(r['name'])}</th>
    <td class="num st">{r['rarity']}</td>
    <td class="sect">{html.escape(m.get('sect') or '&mdash;')}</td>
    <td class="num">{num(r['withoutTicks'])}</td>
    <td class="num">{num(r['withTicks'])}</td>
    <td class="num key">{'+' if v > 0 else ''}{v:,.0f}</td>
    <td class="num">&plusmn;{err:,.0f}</td>
    <td class="dev"><span class="bar"><i class="mid"></i>{side}</span></td>
    <td class="num x">{f(r['fasterPct']):+.1f}%</td>
  </tr>''')

lift_section = ''
if lift_rows:
    lift_section = f'''
  <section>
    <h2>Lift &mdash; what the mirror cannot see</h2>
    <h3>The same party twice against a fixed wave, once with the hero and once without</h3>
    <p class="run">{html.escape(lift_head)}</p>
    <p class="sub">A mirror gives both sides the same party buff, so it cancels and every
    pure buffer reads at or below nothing above. This bench is asymmetric instead: paired
    on the seed, the only difference is whether the hero is on the board, and the reading
    is <b>ticks saved on the clear</b>. Positive is faster.
    A row within one standard error of zero is drawn flat, because that is not a reading.
    {html.escape(lift_note)}</p>
    <p class="sub"><b>Read this as clear speed, not worth.</b> The party wins this wave
    comfortably and nobody dies in it, so healing and mitigation buy almost nothing here
    and a hero whose value is survival will read low by construction. It is the companion
    to the mirror, not its verdict.</p>
    <div class="scroll" style="margin-top:20px">
      <table>
        <thead><tr>
          <th scope="col">Hero</th><th scope="col" class="num">&#9733;</th>
          <th scope="col">Sect</th>
          <th scope="col" class="num">Ticks without</th><th scope="col" class="num">Ticks with</th>
          <th scope="col" class="num key">Ticks saved</th><th scope="col" class="num">&plusmn;</th>
          <th scope="col" class="dev">vs nothing</th><th scope="col" class="num x"></th>
        </tr></thead>
        <tbody>{''.join(lift_rows)}</tbody>
      </table>
    </div>
  </section>'''

def _sims(line, default):
    """The sims-per-hero a bench header reports, e.g. "25 seeded sims
    each" or "15 paired fights each"."""
    m = re.search(r'(\d+)\s+(?:seeded sims|paired fights)', line or '')
    return m.group(1) if m else default

arch_cmd = f'node test/archetypes.js --sims {_sims(head, "25")} --csv'
lift_head = LIFT.read_text().splitlines()[0] if LIFT and LIFT.exists() else ''
lift_cmd = f'node test/lift.js --csv {_sims(lift_head, "25")} 1600'

TEMPLATE = Path('tools/bench_report.template.html').read_text()
page = (TEMPLATE
        # The footer names the exact commands that produced the page,
        # so it has to be read out of the data like everything else. It
        # was hardcoded at 25 sims for both benches and quietly went
        # wrong the first time the lift sweep was run at a different
        # count -- on a page whose whole claim is that no figure on it is
        # transcribed by hand.
        .replace('%%ARCHCMD%%', html.escape(arch_cmd))
        .replace('%%LIFTCMD%%', html.escape(lift_cmd))
        .replace('%%HEADER%%', html.escape(head))
        .replace('%%NHEROES%%', str(len(rows)))
        .replace('%%NFLAG%%', str(len(flagged)))
        .replace('%%SECTLINE%%', html.escape(sect_line))
        .replace('%%FLAGROWS%%', ''.join(flag_rows))
        .replace('%%CURVEROWS%%', ''.join(curve_rows))
        .replace('%%PWSPREAD%%', power_spread)
        .replace('%%LIFT%%', lift_section)
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
