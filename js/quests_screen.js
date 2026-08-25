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
    // Every board -- the timed quest boards AND the achievement groups
    // -- competes for the top of the page: anything holding a claimable
    // reward rises above everything that does not, dailies included.
    // Ties keep their natural order (daily, weekly, monthly, then the
    // achievement groups).
    const boards = [
      ...this.guardedBoards('Login', () => this.loginBoard()),
      ...this.guardedBoards('Quests', () => this.questBoards()),
      ...this.guardedBoards('Journey', () => this.journeyBoard()),
      ...this.guardedBoards('Achievements', () => this.achievementBoards()),
    ].map((b, i) => ({ ...b, i }));
    boards.sort((a, b) => ((b.claimable > 0) - (a.claimable > 0)) || (a.i - b.i));
    // Claiming re-sorts the page (the claimed row sinks, its board may
    // drop out of the claimable block), which used to yank the viewport
    // along with the moved content. Rebuild, then put the scroll back
    // exactly where the player left it.
    const sx = window.scrollX, sy = window.scrollY;
    this.boardsEl.innerHTML = boards.map((b) => b.html).join('');
    window.scrollTo(sx, sy);

    const first7Btn = this.boardsEl.querySelector('.first7-claim:not([disabled])');
    if (first7Btn) {
      first7Btn.addEventListener('click', () => {
        const got = GameState.claimFirstSeven();
        this.loginMsg = got && got.error === 'roster-full'
          ? 'The roster is full — make room before claiming today\'s hero.' : '';
        if (got && !got.error && typeof Sound !== 'undefined') Sound.play('claim');
        this.refresh();
      });
    }
    const monthBtn = this.boardsEl.querySelector('.month-claim:not([disabled])');
    if (monthBtn) {
      monthBtn.addEventListener('click', () => {
        const got = GameState.claimMonthly();
        this.loginMsg2 = got
          ? `Stamped! +${got.reward.label}${got.milestone
              ? ` — and the ${got.stamps}-login bonus: ${got.milestone.label}` : ''}`
          : '';
        if (got && typeof Sound !== 'undefined') Sound.play('claim');
        this.refresh();
      });
    }
    const catchUpBtn = this.boardsEl.querySelector('.login-catchup:not([disabled])');
    if (catchUpBtn) {
      catchUpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const got = GameState.buyLoginCatchUp();
        this.loginMsg2 = got && got.error === 'diamonds'
          ? `Not enough Diamonds — the catch-up costs ${got.cost} 💎.` : '';
        if (got && !got.error && typeof Sound !== 'undefined') Sound.play('claim');
        this.refresh();
      });
    }

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

  // Two separate login boards: the one-time First Seven Days hero
  // track, and the monthly stamp calendar (its own daily claim, drawn
  // as a real month grid, collapsible once today is stamped).
  loginBoard() {
    return [...this.firstSevenBoard(), ...this.monthlyBoard()];
  }

  firstSevenBoard() {
    const info = GameState.loginInfo();
    const trackDone = info.cycle >= Events.LOGIN_WEEK.length;
    if (trackDone) return []; // finished for good — the board retires
    const claimable = info.firstSevenClaimable ? 1 : 0;
    const chips = Events.LOGIN_WEEK.map((r, i) => {
      const done = i < info.cycle;
      const today = i === info.cycle && claimable;
      const next = i === info.cycle && !claimable;
      return `<div class="login-chip${done ? ' login-done-chip' : ''}${today ? ' login-today' : ''}${next ? ' login-next' : ''}">
        <div class="login-chip-day">Day ${i + 1}</div>
        <div class="login-chip-reward">${r.label}</div>
        ${done ? '<div class="login-chip-tag">✓ CLAIMED</div>'
          : today ? '<div class="login-chip-tag">TODAY</div>'
          : next ? '<div class="login-chip-tag">NEXT</div>' : ''}
      </div>`;
    }).join('');
    return [{
      claimable,
      html: `<div class="quest-board">
        <div class="quest-board-header"><h3>🎁 First Seven Days</h3>
          <span class="quest-reset">${claimable
            ? 'Today\'s hero is ready!'
            : `Next hero in ${Quests.formatCountdown(Quests.timeToReset('daily'))}`}</span>
        </div>
        <div class="login-sub">Your first seven login days — any seven, they
          need not be consecutive — each bring a hero to the roster.</div>
        <div class="login-track">${chips}</div>
        ${this.loginMsg ? `<div class="login-msg">${this.loginMsg}</div>` : ''}
        <button class="first7-claim panel-btn gold" ${claimable ? '' : 'disabled'}>
          ${claimable
            ? `Claim day ${info.cycle + 1}: ${Events.LOGIN_WEEK[info.cycle].label}`
            : 'Claimed — come back tomorrow'}</button>
      </div>` }];
  }

  monthlyBoard() {
    const info = GameState.loginInfo();
    const claimable = info.monthlyClaimable ? 1 : 0;
    const now = new Date();
    const today = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthName = now.toLocaleString('default', { month: 'long' });
    const stamped = new Set(info.stampedDays);
    const cells = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const cls = stamped.has(d) ? 'cal-stamped'
        : d === today ? (claimable ? 'cal-today' : 'cal-stamped')
        : d < today ? 'cal-missed' : 'cal-future';
      const dayReward = Events.calendarDayReward(now.getFullYear(), now.getMonth(), d);
      cells.push(`<div class="cal-day ${cls}" title="${dayReward.label}">
        <span class="cal-num">${d}</span>
        ${stamped.has(d) || (d === today && !claimable) ? '<span class="cal-check">✓</span>' : ''}
      </div>`);
    }
    const nextStamp = info.stamps + (claimable ? 1 : 0);
    const monthNow = Events.calendarDayReward(now.getFullYear(), now.getMonth(), today);
    const nextMilestone = Events.LOGIN_MONTH_MILESTONES[nextStamp];
    const milestones = Object.entries(Events.LOGIN_MONTH_MILESTONES)
      .map(([n, r]) => `<span class="login-milestone${info.stamps >= Number(n) ? ' login-done' : ''}">
        ${n} logins: ${r.label}${info.stamps >= Number(n) ? ' ✓' : ''}</span>`)
      .join('');
    const missed = GameState.loginMissedDays();
    const cost = GameState.loginCatchUpCost();
    const canAfford = GameState.diamonds >= cost;
    const catchUp = missed > 0 ? `
        <div class="login-catchup-row">
          <span class="login-missed">${missed} day${missed > 1 ? 's' : ''} missed
            this month — buy the stamps back?</span>
          <button class="login-catchup panel-btn" ${canAfford ? '' : 'disabled'}
            title="${canAfford ? `Stamp all ${missed} missed days and collect their rewards`
              : `Needs ${cost} 💎 — you have ${GameState.diamonds}`}">
            Catch up (${cost} 💎)</button>
        </div>` : '';
    // Collapsible: shut by default once today is stamped, unless the
    // player opened it this session (the achievement accordion's rules).
    const group = 'monthly_login';
    const open = this.groupOpen.has(group) ? this.groupOpen.get(group) : claimable > 0;
    return [{
      claimable,
      html: `<div class="quest-board ${open ? '' : 'quest-collapsed'}" data-group="${group}">
        <div class="quest-board-header">
          <h3><span class="ach-caret">${open ? '▾' : '▸'}</span>📅 ${monthName} Login Calendar</h3>
          <span class="quest-reset">${claimable
            ? 'Today\'s stamp is ready!'
            : `Stamped ✓ — next in ${Quests.formatCountdown(Quests.timeToReset('daily'))}`}
            · ${info.stamps} stamped</span>
        </div>
        <div class="quest-rows">
          <div class="login-calendar">${cells.join('')}</div>
          <div class="login-month">
            <div class="login-month-line">${claimable
              ? `Today's stamp (stamp ${nextStamp}) adds <b>${monthNow.label}</b>${nextMilestone
                  ? ` — plus the ${nextStamp}-login bonus: <b>${nextMilestone.label}</b>` : ''}.`
              : 'Today is stamped — the calendar rolls on tomorrow.'}</div>
            <div class="login-milestones">${milestones}</div>
          </div>
          ${catchUp}
          ${this.loginMsg2 ? `<div class="login-msg">${this.loginMsg2}</div>` : ''}
          <button class="month-claim panel-btn gold" ${claimable ? '' : 'disabled'}>
            ${claimable ? 'Stamp today' : 'Stamped — come back tomorrow'}</button>
        </div>
      </div>` }];
  }

  // Run one section's builder (which returns [{claimable, html}]); on a
  // throw, return a visible panel naming the section and the error
  // instead of losing the page.
  guardedBoards(label, build) {
    try {
      return build();
    } catch (e) {
      console.error(`${label} failed to render`, e);
      const msg = String((e && e.message) || e).replace(/[&<>]/g,
        (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
      return [{ claimable: 0, html: `<div class="quest-board">
        <div class="quest-board-header"><h3>${label}</h3>
          <span class="quest-reset">failed to render</span></div>
        <div class="quest-error">${msg}</div>
      </div>` }];
    }
  }

  questBoards() {
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
      const claimable = Quests.DEFS[type].filter((def) =>
        (q.counters[def.counter] || 0) >= def.goal && !q.claimed[def.id]).length;
      return { claimable, html: `
        <div class="quest-board">
          <div class="quest-board-header">
            <h3>${title}</h3>
            <span class="quest-reset">${claimable
              ? `<span class="ach-claimable">${claimable} to claim</span> · ` : ''}Resets in ${countdown}</span>
          </div>
          ${rows}
        </div>` };
    });
  }

  // The Journey: a thousand lifetime quests that never reset. Each
  // counter is a chain of escalating rungs, and only the NEXT unclaimed
  // rung of each chain is shown — the board stays fifteen rows tall no
  // matter how deep the ladders run. Progress reads the lifetime
  // totals, so play from before the board existed already counts.
  journeyBoard() {
    const q = GameState.questState('journey');
    const defs = Quests.DEFS.journey;
    const clearedTotal = defs.reduce((n, d) => n + (q.claimed[d.id] ? 1 : 0), 0);
    const claimable = defs.reduce((n, d) =>
      n + (!q.claimed[d.id] && GameState.stat(d.counter) >= d.goal ? 1 : 0), 0);
    // The lowest unclaimed rung of each chain (defs are in tier order).
    const nextRung = new Map();
    for (const def of defs) {
      if (!q.claimed[def.id] && !nextRung.has(def.counter)) nextRung.set(def.counter, def);
    }
    const rank = (def) => (GameState.stat(def.counter) >= def.goal ? 0 : 1);
    const rows = [...nextRung.values()].sort((a, b) => rank(a) - rank(b))
      .map((def) => {
        const raw = GameState.stat(def.counter);
        const have = Math.min(raw, def.goal);
        const done = raw >= def.goal;
        const pct = Math.round((have / def.goal) * 100);
        return `
          <div class="quest-row ${done ? 'quest-done' : ''}">
            <div class="quest-info">
              <div class="quest-name">${def.name}
                <span class="quest-tier">· rung ${def.tier}/${def.tiers}</span></div>
              <div class="quest-bar"><div class="quest-fill" style="width:${pct}%"></div></div>
              <div class="quest-progress">${have.toLocaleString()} / ${def.goal.toLocaleString()}</div>
            </div>
            <div class="quest-reward">${Quests.rewardLabel(def.reward)}</div>
            <button class="panel-btn quest-claim ${done ? 'gold' : ''}"
              data-type="journey" data-id="${def.id}"
              ${done ? '' : 'disabled'}>Claim</button>
          </div>`;
      }).join('');
    return [{ claimable, html: `
      <div class="quest-board">
        <div class="quest-board-header">
          <h3>The Journey</h3>
          <span class="quest-reset">${claimable
            ? `<span class="ach-claimable">${claimable} to claim</span> · ` : ''}${clearedTotal.toLocaleString()} / ${defs.length.toLocaleString()} quests cleared · never resets</span>
        </div>
        ${rows}
      </div>` }];
  }

  // Achievements: one-time goals, grouped, that never reset. These are
  // the long arc — filling out a race, pushing every boss, mastering a
  // hero — as opposed to the daily counters above.
  achievementBoards() {
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
    // Relative order among the groups: claimables first (the page-level
    // sort in refresh() interleaves them with the quest boards).
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
      return { claimable, html: `
        <div class="quest-board ${open ? '' : 'quest-collapsed'}" data-group="${group}">
          <div class="quest-board-header ach-toggle" title="${open ? 'Collapse' : 'Expand'} ${group}">
            <h3><span class="ach-caret">${open ? '▾' : '▸'}</span>${group} Achievements</h3>
            <span class="quest-reset">${claimable
              ? `<span class="ach-claimable">${claimable} to claim</span> · ` : ''}${
              done}/${list.length} complete · never resets</span>
          </div>
          <div class="quest-rows">${rows}</div>
        </div>` };
    });
  }
}
