"""Scale a hero's numbers and keep its description honest.

A balance pass changes an effect and leaves the ability text quoting the
old figure — that has happened twice now, once across 82 poison
descriptions. This does both at once, or refuses.

    python3 tools/tune.py bear_runefur damage=0.56
    python3 tools/tune.py cat_lightpurr heal=0.7 hot=0.7

Fields are matched per effect type: `mult` for damage/heal/damageDef,
`pct` for hot/dot/damageHpPct. Every scaled number is looked up in the
ability's description and rewritten; a number that appears more than
once there is reported rather than guessed at.
"""
import re
import sys
import glob

FIELD = {
    'damage': 'mult', 'damageDef': 'mult', 'heal': 'mult',
    'hot': 'pct', 'dot': 'pct', 'damageHpPct': 'pct', 'healHpPct': 'pct',
}


def fmt(x):
    return f'{x:.10f}'.rstrip('0').rstrip('.')


def hero_span(src, hid):
    i = src.find(f'\n  {hid}: {{')
    if i < 0:
        return None
    m = re.search(r'\n  [a-z0-9_]+: \{', src[i + 5:])
    return (i, i + 5 + m.start() if m else len(src))


def tune(hid, factors, apply=True):
    for path in glob.glob('js/data/heroes/*.js'):
        src = open(path).read()
        span = hero_span(src, hid)
        if not span:
            continue
        start, end = span
        block = src[start:end]
        changes, problems = [], []
        for etype, k in factors.items():
            field = FIELD.get(etype)
            if not field:
                problems.append(f'unknown effect type {etype}')
                continue
            pat = re.compile(rf"(\{{\s*type:\s*'{etype}',[^}}]*?\b{field}:\s*)([0-9.]+)")
            for m in pat.finditer(block):
                old = float(m.group(2))
                new = round(old * k, 3)
                changes.append((m.start(2), m.end(2), fmt(old), fmt(new), etype))
        # Rewrite the numbers back-to-front so earlier offsets stay valid.
        for s0, e0, old, new, etype in sorted(changes, reverse=True):
            block = block[:s0] + new + block[e0:]
        # Then the descriptions: percentages are the value x100.
        for _, _, old, new, etype in changes:
            o_pct, n_pct = fmt(float(old) * 100), fmt(float(new) * 100)
            hits = len(re.findall(rf'(?<![\d.]){re.escape(o_pct)}%', block))
            if hits == 0:
                problems.append(f'{etype} {o_pct}% not quoted in any description')
            elif hits > 1:
                problems.append(f'{etype} {o_pct}% appears {hits}x — rewrite by hand')
            else:
                block = re.sub(rf'(?<![\d.]){re.escape(o_pct)}%', f'{n_pct}%', block, count=1)
        if apply and not problems:
            open(path, 'w').write(src[:start] + block + src[end:])
        return {'file': path, 'changes': [(o, n, t) for _, _, o, n, t in changes],
                'problems': problems}
    return {'problems': [f'{hid} not found']}


if __name__ == '__main__':
    hid = sys.argv[1]
    factors = {}
    for arg in sys.argv[2:]:
        k, v = arg.split('=')
        factors[k] = float(v)
    r = tune(hid, factors)
    for o, n, t in r.get('changes', []):
        print(f'  {t:12} {o} -> {n}')
    for p in r['problems']:
        print(f'  !! {p}')
    sys.exit(1 if r['problems'] else 0)
