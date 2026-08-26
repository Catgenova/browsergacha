#!/usr/bin/env python3
"""Point every dossier's Kit section at the ladder the GAME actually uses.

The skill-level rework (docs/skill-level-process.md) moved every base
cooldown on skills 2 and 3, put a 50% gate on every hex, and replaced the
blanket level-up multiplier with an explicit ladder of rungs. The sheets
were written before any of that: they quote the old cooldowns and say
nothing at all about how a skill levels.

This walks every tools/build_*_sheet.py and, per ability card:

  * rewrites the cooldown in the slot line, keeping whichever wording
    that sheet chose ("Cooldown 3" / "3-turn cooldown") and any rider
    after it, and appends what the cooldown becomes fully levelled;
  * inserts (or refreshes) a `Skill ups` line listing the rungs in the
    order they are bought, and the level cap.

Prose is left alone -- it is hand-written per hero and per sect. What
this DOES do is report every card whose prose describes a gated effect
without mentioning the roll, so those can be fixed by hand.

  python3 tools/sync_sheet_kits.py            # report only
  python3 tools/sync_sheet_kits.py --write
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / 'tools'

DUMP = r'''
const { loadGame } = require('./test/harness.js');
const g = loadGame();
const P = g.Progression;
// One label per rung, in the order the rungs are bought. Same vocabulary
// as Progression.skillBonusText, but per-step rather than cumulative --
// the sheet is documenting a ladder, not a total.
const pct = (v) => Math.round(v * 100);
function label(rung, ability) {
  const mends = (ability.effects || []).some((e) =>
    /^heal/.test(e.type) || e.type === 'hot' || e.type === 'revive' ||
    e.type === 'shield' || e.healDealt !== undefined);
  const out = [];
  if (rung.mult) out.push(`+${pct(rung.mult)}% power`);
  if (rung.perMirror) out.push(`+${pct(rung.perMirror)}%/mirror`);
  if (rung.perDeath) out.push(`+${pct(rung.perDeath)}%/death`);
  if (rung.heal) out.push(`+${pct(rung.heal)}% ${mends ? 'heal' : 'power'}`);
  if (rung.debuffChance) out.push(`+${pct(rung.debuffChance)}% land chance`);
  if (rung.debuffPower) out.push(`+${pct(rung.debuffPower)}% effect`);
  if (rung.buffPower) out.push(`+${pct(rung.buffPower)}% boon`);
  if (rung.cleanseCount) out.push(`+${rung.cleanseCount} cleansed`);
  if (rung.stripCount) out.push(`+${rung.stripCount} taken`);
  if (rung.meter) out.push(`+${pct(rung.meter)}% drain`);
  if (rung.per) out.push(`+${rung.per} ATK each`);
  if (rung.chain) out.push(`+${pct(rung.chain)}% chain`);
  if (rung.refund) out.push(`+${rung.refund} turn back`);
  if (rung.duration) out.push(`+${rung.duration} turn`);
  if (rung.cooldown) out.push(`${rung.cooldown} cooldown`);
  return out.join(', ');
}
const out = {};
for (const h of Object.values(g.HEROES)) {
  out[h.id] = (h.abilities || []).map((a, i) => {
    const cap = P.skillCap(a, i);
    return {
      name: a.name,
      cooldown: a.cooldown || 0,
      levelled: P.skillCooldown(a, cap),
      cap,
      rungs: (a.levelUps || []).map((r) => label(r, a)),
      gates: (a.effects || []).filter((e) => e.chance !== undefined && e.type !== 'bounce')
                              .map((e) => e.type),
    };
  });
}
console.log(JSON.stringify(out));
'''

# "Skill 2 &middot; Cooldown 3" / "Skill 2 &middot; 3-turn cooldown",
# with anything after it (" &middot; One at a time") preserved.
SLOT = re.compile(
    r'(<div class="slot">Skill (?P<n>[123])\s*(?:&middot;|·)\s*)'
    r'(?P<body>(?:Cooldown\s+(?P<a>\d+))|(?:(?P<b>\d+)-turn cooldown))'
    r'(?P<rest>[^<]*)</div>')

LADDER = re.compile(r'\n\s*<div class="ladder">.*?</div>', re.S)

CSS = '''  .ability .ladder { margin-top: 10px; padding-top: 9px;
    border-top: 1px solid var(--line); font-family: var(--mono);
    font-size: 11px; line-height: 1.7; color: var(--muted); }
  .ability .ladder b { color: var(--ink); font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase; font-size: 10px; }
  .ability .ladder i { font-style: normal; color: var(--ink); }
'''
CSS_ANCHOR = '  .ability .meta {'


def live():
    raw = subprocess.run(['node', '-e', DUMP], cwd=ROOT, check=True,
                         capture_output=True, text=True).stdout
    return json.loads(raw)


def ladder_html(ab):
    if not ab['rungs']:
        return ''
    steps = ' &rsaquo; '.join(ab['rungs'])
    return (f'\n      <div class="ladder"><b>Skill ups</b> &middot; {steps}'
            f' <i>&middot; max Lv {ab["cap"]}</i></div>')


def main():
    write = '--write' in sys.argv
    data = live()
    touched, unmentioned = [], []
    for script in sorted(TOOLS.glob('build_*_sheet.py')):
        hero = script.name[len('build_'):-len('_sheet.py')]
        if hero not in data:
            continue
        kit = data[hero]
        src = script.read_text()
        moves = []

        # --- 1. cooldown in the slot line ---------------------------
        def fix_slot(m):
            i = int(m.group('n')) - 1
            if i >= len(kit):
                return m.group(0)
            ab = kit[i]
            was = int(m.group('a') or m.group('b'))
            if was != ab['cooldown']:
                moves.append(f'{ab["name"]} cd {was}->{ab["cooldown"]}')
            body = (f'Cooldown {ab["cooldown"]}' if m.group('a')
                    else f'{ab["cooldown"]}-turn cooldown')
            tail = m.group('rest')
            # State what investment buys, once, right where the cost is.
            drop = f' &rarr; {ab["levelled"]} fully levelled'
            if ab['levelled'] != ab['cooldown'] and drop not in tail:
                tail = drop + tail
            return f'{m.group(1)}{body}{tail}</div>'

        out = SLOT.sub(fix_slot, src)

        # --- 2. the ladder line -------------------------------------
        out = LADDER.sub('', out)
        cards = list(re.finditer(
            r'<div class="slot">Skill ([123])[^<]*</div>', out))
        for m in reversed(cards):
            i = int(m.group(1)) - 1
            if i >= len(kit):
                continue
            block = ladder_html(kit[i])
            if not block:
                continue
            # Land it at the end of the card, after the last </p>.
            stop = out.find('\n    </div>', m.end())
            last_p = out.rfind('</p>', m.end(), stop)
            at = (last_p + len('</p>')) if last_p != -1 else stop
            out = out[:at] + block + out[at:]

        # --- 3. the style rule --------------------------------------
        if '.ability .ladder' not in out and CSS_ANCHOR in out:
            out = out.replace(CSS_ANCHOR, CSS + CSS_ANCHOR, 1)

        # --- 4. report prose that never mentions its own roll -------
        # Scanned against the PROSE only: the ladder line inserted above
        # says "land chance" on every gated skill, so including it would
        # make this check pass itself.
        for i, ab in enumerate(kit):
            if not ab['gates']:
                continue
            m = re.search(r'<div class="slot">Skill %d[^<]*</div>(.*?)\n    </div>'
                          % (i + 1), out, re.S)
            if not m:
                continue
            prose = ' '.join(re.findall(r'<p>(.*?)</p>', m.group(1), re.S))
            # Odds get stated in words as often as digits on these
            # sheets, and all of these are a real statement of the roll.
            told = ('chance' in prose or 'coin' in prose or '50%' in prose or
                    'three-in-ten' in prose or 'Half the time' in prose or
                    'half the time' in prose or 'rolls made apart' in prose)
            if not told:
                unmentioned.append(
                    f'{hero} s{i + 1} {ab["name"]} ({", ".join(ab["gates"])})')

        if out != src:
            touched.append((hero, moves))
            if write:
                script.write_text(out)

    for hero, moves in touched:
        print(f'{hero:<12} {", ".join(moves) or "ladder only"}')
    print(f'\n{len(touched)} sheet builders {"updated" if write else "would change"}')
    if unmentioned:
        print(f'\n{len(unmentioned)} cards describe a gated effect without '
              f'mentioning the roll -- fix these by hand:')
        for u in unmentioned:
            print(f'  {u}')


if __name__ == '__main__':
    main()
