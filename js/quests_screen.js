// Quests screen: daily and monthly boards with progress bars, claim
// buttons, and reset countdowns.

class QuestsScreen {
  constructor(app) {
    this.app = app;
    this.el = document.getElementById('screen-quests');
    this.boardsEl = document.getElementById('quest-boards');
  }

  enter() {
    this.refresh();
  }

  exit() {}
  update() {}
  draw() {}

  refresh() {
    const boards = [
      { type: 'daily', title: 'Daily Quests' },
      { type: 'weekly', title: 'Weekly Quests' },
      { type: 'monthly', title: 'Monthly Quests' },
    ];
    this.boardsEl.innerHTML = boards.map(({ type, title }) => {
      const q = GameState.questState(type);
      const rows = Quests.DEFS[type].map((def) => {
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
    }).join('') + this.achievementsHtml();

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
  }

  // Achievements: one-time goals, grouped, that never reset. These are
  // the long arc — filling out a race, pushing every boss, mastering a
  // hero — as opposed to the daily counters above.
  achievementsHtml() {
    const groups = {};
    for (const a of ACHIEVEMENTS.LIST) (groups[a.group] ||= []).push(a);
    return Object.entries(groups).map(([group, list]) => {
      const done = list.filter((a) => ACHIEVEMENTS.state(a).done).length;
      const rows = list.map((a) => {
        const st = ACHIEVEMENTS.state(a);
        const pct = Math.round((st.have / st.need) * 100);
        return `
          <div class="quest-row ${st.claimed ? 'quest-claimed' : st.done ? 'quest-done' : ''}">
            <div class="quest-info">
              <div class="quest-name">${a.name}<span class="ach-detail"> — ${a.detail}</span></div>
              <div class="quest-bar"><div class="quest-fill" style="width:${pct}%"></div></div>
              <div class="quest-progress">${st.have} / ${st.need}</div>
            </div>
            <div class="quest-reward">${ACHIEVEMENTS.rewardText(a.reward)}</div>
            <button class="panel-btn quest-claim ach-claim ${st.done && !st.claimed ? 'gold' : ''}"
              data-id="${a.id}" ${st.done && !st.claimed ? '' : 'disabled'}>
              ${st.claimed ? 'Claimed ✓' : 'Claim'}
            </button>
          </div>`;
      }).join('');
      return `
        <div class="quest-board">
          <div class="quest-board-header">
            <h3>${group} Achievements</h3>
            <span class="quest-reset">${done}/${list.length} complete · never resets</span>
          </div>
          ${rows}
        </div>`;
    }).join('');
  }
}
