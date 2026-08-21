// Quests screen: daily and monthly boards with progress bars, claim
// buttons, and reset countdowns.

class QuestsScreen {
  constructor(app) {
    this.app = app;
    this.el = document.getElementById('screen-quests');
    this.boardsEl = document.getElementById('quest-boards');
    // Achievement groups fold shut unless they hold something claimable
    // or the player opened them; overrides live here for the session.
    this.groupOpen = new Map();
  }

  enter() {
    this.refresh();
  }

  exit() {}
  update() {}
  draw() {}

  refresh() {
    // Assembled in independent pieces. Every card here is generated from
    // data -- 28 quests and 150-odd achievements, each running its own
    // progress function -- and one bad entry used to take the whole
    // screen down to nothing, with no clue on the page as to why. Now a
    // failure costs its own section and says what broke.
    const parts = [];
    parts.push(this.guarded('Quests', () => this.boardsHtml()));
    parts.push(this.guarded('Achievements', () => this.achievementsHtml()));
    this.boardsEl.innerHTML = parts.join('');

    this.boardsEl.querySelectorAll('.quest-claim:not([disabled])').forEach((btn) => {
      btn.addEventListener('click', () => {
        GameState.claimQuest(btn.dataset.type, btn.dataset.id);
        this.refresh();
      });
    });

    this.boardsEl.querySelectorAll('.ach-claim:not([disabled])').forEach((btn) => {
      btn.addEventListener('click', () => {
        const a = ACHIEVEMENTS.LIST.find((x) => x.id === btn.dataset.id);
        if (a) GameState.claimAchievement(a.id, a.reward);
        this.refresh();
      });
    });

    // Accordion headers: click to open or close an achievement group.
    this.boardsEl.querySelectorAll('.quest-board[data-group] .quest-board-header')
      .forEach((hdr) => {
        hdr.addEventListener('click', () => {
          const board = hdr.closest('.quest-board');
          const group = board.dataset.group;
          const nowOpen = board.classList.toggle('quest-collapsed') === false;
          this.groupOpen.set(group, nowOpen);
          const caret = hdr.querySelector('.ach-caret');
          if (caret) caret.textContent = nowOpen ? '▾' : '▸';
        });
      });
  }

  // Run one section's builder; on a throw, return a visible panel naming
  // the section and the error instead of losing the page.
  guarded(label, build) {
    try {
      return build();
    } catch (e) {
      console.error(`${label} failed to render`, e);
      const msg = String((e && e.message) || e).replace(/[&<>]/g,
        (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
      return `<div class="quest-board">
        <div class="quest-board-header"><h3>${label}</h3>
          <span class="quest-reset">failed to render</span></div>
        <div class="quest-error">${msg}</div>
      </div>`;
    }
  }

  boardsHtml() {
    const boards = [
      { type: 'daily', title: 'Daily Quests' },
      { type: 'weekly', title: 'Weekly Quests' },
      { type: 'monthly', title: 'Monthly Quests' },
    ];
    return boards.map(({ type, title }) => {
      const q = GameState.questState(type);
      // Ready-to-claim first, in-progress next, claimed last.
      const rank = (def) => {
        const done = (q.counters[def.counter] || 0) >= def.goal;
        const claimed = !!q.claimed[def.id];
        return claimed ? 2 : done ? 0 : 1;
      };
      const rows = [...Quests.DEFS[type]].sort((a, b) => rank(a) - rank(b))
        .map((def) => {
        const have = Math.min(q.counters[def.counter] || 0, def.goal);
        const done = have >= def.goal;
        const claimed = !!q.claimed[def.id];
        const pct = Math.round((have / def.goal) * 100);
        return `
          <div class="quest-row ${claimed ? 'quest-claimed' : done ? 'quest-done' : ''}">
            <div class="quest-info">
              <div class="quest-name">${def.name}</div>
              <div class="quest-bar"><div class="quest-fill" style="width:${pct}%"></div></div>
              <div class="quest-progress">${have} / ${def.goal}</div>
            </div>
            <div class="quest-reward">${Quests.rewardLabel(def.reward)}</div>
            <button class="panel-btn quest-claim ${done && !claimed ? 'gold' : ''}"
              data-type="${type}" data-id="${def.id}"
              ${done && !claimed ? '' : 'disabled'}>
              ${claimed ? 'Claimed ✓' : 'Claim'}
            </button>
          </div>`;
      }).join('');
      const countdown = Quests.formatCountdown(Quests.timeToReset(type));
      return `
        <div class="quest-board">
          <div class="quest-board-header">
            <h3>${title}</h3>
            <span class="quest-reset">Resets in ${countdown}</span>
          </div>
          ${rows}
        </div>`;
    }).join('');
  }

  // Achievements: one-time goals, grouped, that never reset. These are
  // the long arc — filling out a race, pushing every boss, mastering a
  // hero — as opposed to the daily counters above.
  achievementsHtml() {
    const groups = {};
    for (const a of ACHIEVEMENTS.LIST) (groups[a.group] ||= []).push(a);
    // One guarded read per achievement, shared by the header count and
    // the row. Reading it twice meant the count could throw before the
    // row-level guard ever got a chance to catch it.
    const stateOf = (a) => {
      try {
        return ACHIEVEMENTS.state(a);
      } catch (e) {
        console.error(`achievement ${a.id} failed`, e);
        return { error: String((e && e.message) || e) };
      }
    };
    const entries = Object.entries(groups).map(([group, list]) => {
      const states = new Map(list.map((a) => [a, stateOf(a)]));
      const claimable = list.filter((a) => {
        const st = states.get(a);
        return st.done && !st.claimed;
      }).length;
      return { group, list, states, claimable };
    });
    // Groups holding rewards rise to the top of the page.
    entries.sort((a, b) => (b.claimable > 0) - (a.claimable > 0));
    return entries.map(({ group, list, states, claimable }) => {
      const done = list.filter((a) => states.get(a).done).length;
      const rank = (a) => {
        const st = states.get(a);
        return st.error ? 3 : st.claimed ? 2 : st.done ? 0 : 1;
      };
      const rows = [...list].sort((a, b) => rank(a) - rank(b)).map((a) => {
        const st = states.get(a);
        if (st.error) {
          return `<div class="quest-row"><div class="quest-info">
            <div class="quest-name">${a.name}</div>
            <div class="quest-error">${st.error}</div>
          </div></div>`;
        }
        const pct = Math.round((st.have / st.need) * 100);
        return `
          <div class="quest-row ${st.claimed ? 'quest-claimed' : st.done ? 'quest-done' : ''}">
            <div class="quest-info">
              <div class="quest-name">${a.name}<span class="ach-detail"> \u2014 ${a.detail}</span></div>
              <div class="quest-bar"><div class="quest-fill" style="width:${pct}%"></div></div>
              <div class="quest-progress">${st.have} / ${st.need}</div>
            </div>
            <div class="quest-reward">${ACHIEVEMENTS.rewardText(a.reward)}</div>
            <button class="panel-btn quest-claim ach-claim ${st.done && !st.claimed ? 'gold' : ''}"
              data-id="${a.id}" ${st.done && !st.claimed ? '' : 'disabled'}>
              ${st.claimed ? 'Claimed \u2713' : 'Claim'}
            </button>
          </div>`;
      }).join('');
      // Folded by default: these boards are the long game, and with a
      // hundred-plus rows they would bury the daily boards. A group
      // stays open when something in it is ready to claim, or when the
      // player opened it themselves this session.
      const open = this.groupOpen.has(group)
        ? this.groupOpen.get(group)
        : claimable > 0;
      return `
        <div class="quest-board ${open ? '' : 'quest-collapsed'}" data-group="${group}">
          <div class="quest-board-header ach-toggle" title="${open ? 'Collapse' : 'Expand'} ${group}">
            <h3><span class="ach-caret">${open ? '▾' : '▸'}</span>${group} Achievements</h3>
            <span class="quest-reset">${claimable
              ? `<span class="ach-claimable">${claimable} to claim</span> · ` : ''}${
              done}/${list.length} complete · never resets</span>
          </div>
          <div class="quest-rows">${rows}</div>
        </div>`;
    }).join('');
  }
}
