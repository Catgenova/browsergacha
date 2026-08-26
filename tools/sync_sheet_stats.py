#!/usr/bin/env python3
"""Point every dossier's stat tiles at the numbers the GAME actually uses.

js/data/balance.js rewrites def.stats at load, so the figures authored in
js/data/heroes/*.js are not what a player ever sees. The sheets were
quoting the authored ones. This walks every tools/build_*_sheet.py,
replaces the four stat tiles with the post-balance values, and leaves
everything else -- prose, multipliers, riders -- alone.

Run it after any balance change, then re-run the build scripts.

  node -e "...dump live stats..." > live_stats.json
  python3 tools/sync_sheet_stats.py live_stats.json
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / 'tools'

# Dump the post-balance statlines straight out of the game.
DUMP = '''
const { loadGame } = require('./test/harness.js');
const g = loadGame();
const out = {};
for (const h of Object.values(g.HEROES)) out[h.id] = h.stats;
console.log(JSON.stringify(out));
'''

TILE = re.compile(
    r'(<div class="k">(HP|ATK|DEF|SPD)</div><div class="v">)(\d+)(</div>)')
KEY = {'HP': 'hp', 'ATK': 'atk', 'DEF': 'def', 'SPD': 'speed'}


def live_stats():
    raw = subprocess.run(['node', '-e', DUMP], cwd=ROOT, check=True,
                         capture_output=True, text=True).stdout
    return json.loads(raw)


def main():
    stats = live_stats()
    changed, skipped = [], []
    for script in sorted(TOOLS.glob('build_*_sheet.py')):
        hero = script.name[len('build_'):-len('_sheet.py')]
        if hero not in stats:
            skipped.append(hero)
            continue
        s = script.read_text()
        moved = []

        def fix(m):
            want = stats[hero][KEY[m.group(2)]]
            if int(m.group(3)) != want:
                moved.append(f'{m.group(2)} {m.group(3)}->{want}')
            return f'{m.group(1)}{want}{m.group(4)}'

        out = TILE.sub(fix, s)
        if out != s:
            script.write_text(out)
            changed.append((hero, moved))
    for hero, moved in changed:
        print(f'{hero:<12} {", ".join(moved)}')
    print(f'\n{len(changed)} sheet builders updated, '
          f'{len(list(TOOLS.glob("build_*_sheet.py"))) - len(changed) - len(skipped)} '
          f'already correct, {len(skipped)} without a hero: {" ".join(skipped) or "none"}')


if __name__ == '__main__':
    main()
