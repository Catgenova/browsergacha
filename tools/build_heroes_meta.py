#!/usr/bin/env python3
"""Hero display name -> {title, sect}, read out of the game data.

    python3 tools/build_heroes_meta.py heroes.json

The bench CSVs identify a hero by its display name and nothing else, so
the report needs a lookup to put a title and a sect beside each row.
Built from js/ rather than kept by hand, because a hand-kept copy of the
roster is a copy of the roster that goes stale.
"""
import json
import subprocess
import sys
from pathlib import Path

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else 'heroes.json')
ROOT = Path(__file__).resolve().parent.parent

SCRIPT = r'''
const { loadGame } = require('./test/harness.js');
const g = loadGame();
const { HEROES, RACES } = g;
const out = {};
for (const def of Object.values(HEROES)) {
  const sect = RACES.sectOf(def);
  out[def.name] = { title: def.title || '', sect: sect ? sect.name : '' };
}
console.log(JSON.stringify(out, null, 1));
'''

res = subprocess.run(['node', '-e', SCRIPT], cwd=ROOT, capture_output=True, text=True)
if res.returncode != 0:
    sys.exit(res.stderr.strip() or 'node failed')
data = json.loads(res.stdout)
OUT.write_text(json.dumps(data, indent=1))
print(OUT, len(data), 'heroes')
