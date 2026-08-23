// The fight picker on the Battle screen's idle panel.
//
// Three panes, left to right:
//   MODES     Hunt / Boss / Elemental Rift / Tower
//   STAGES    the level ladder as buttons — cleared ✓ (repeatable for
//             bosses and rifts), the next stage open, the rest locked.
//             The tower shows its last twenty floors greyed out with
//             only the next floor selectable: the climb never repeats.
//   INFO      variant buttons (hunt environment / boss / element),
//             then a card describing exactly what the chosen fight
//             fields — formation or boss statline at that level — and
//             the repeat picker + launch button.
//
// Selections write straight into GameState.waveSettings/bossSettings/
// attuneSettings, so the battle builder reads them exactly as before.

class BattleSelect {
  constructor(app) {
    this.app = app;
    this.host = document.getElementById('battle-select');
    this.mode = 'hunt';
    if (this.host) {
      // One delegated listener; every button carries its action in data-.
      this.host.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-act]');
        if (!btn || btn.disabled) return;
        this.onAction(btn.dataset);
      });
      this.host.addEventListener('change', (e) => {
        if (e.target.id !== 'bs-repeat') return;
        const v = e.target.value === 'inf' ? 'inf' : Number(e.target.value);
        if (this.mode === 'hunt') GameState.setWaveSettings({ repeat: v });
        if (this.mode === 'boss') GameState.setBossSettings({ repeat: v });
        if (this.mode === 'rift') GameState.setAttuneSettings({ repeat: v });
        if (this.mode === 'dungeon') GameState.setDungeonSettings({ repeat: v });
      });
    }
  }

  onAction(d) {
    if (d.act === 'mode') { this.mode = d.mode; this.render(); return; }
    if (d.act === 'variant') {
      if (this.mode === 'hunt') GameState.setWaveSettings({ location: Number(d.v) });
      if (this.mode === 'boss') GameState.setBossSettings({ boss: d.v });
      if (this.mode === 'rift') GameState.setAttuneSettings({ boss: d.v });
      if (this.mode === 'dungeon') GameState.setDungeonSettings({ boss: d.v });
      this.render();
      return;
    }
    if (d.act === 'stage') {
      const st = Number(d.v);
      if (this.mode === 'hunt') GameState.setWaveSettings({ stage: st });
      if (this.mode === 'boss') GameState.setBossSettings({ stage: st });
      if (this.mode === 'rift') GameState.setAttuneSettings({ stage: st });
      if (this.mode === 'dungeon') GameState.setDungeonSettings({ stage: st });
      this.render();
      return;
    }
    if (d.act === 'launch') {
      if (GameState.teamSize() === 0) return;
      // A boss whose chapter is uncleared shows in the picker but takes
      // no challengers -- same rule the old picker enforced.
      if (this.mode === 'boss' && !Campaign.bossUnlocked(GameState.bossSettings.boss)) return;
      const battleMode = {
        hunt: 'wave', boss: 'boss', rift: 'attune', dungeon: 'dungeon', tower: 'tower',
      }[this.mode];
      this.app.screens.battle.requestBattle(battleMode);
      this.app.showScreen('battle');
    }
  }

  // ---- What the current mode is pointing at ------------------------------

  huntOpen(loc) {
    return !!LOCATION_ENEMIES[loc] && Campaign.locationUnlocked(loc);
  }

  // Clamp saved selections against what is actually unlocked, so the
  // ladder and info always describe a fight the launch button can start.
  current() {
    if (this.mode === 'hunt') {
      const ws = GameState.waveSettings;
      if (!this.huntOpen(ws.location)) GameState.setWaveSettings({ location: 0 });
      return GameState.waveSettings;
    }
    if (this.mode === 'boss') {
      const bs = GameState.bossSettings;
      if (!(bs.boss in BOSSES) || !Campaign.bossUnlocked(bs.boss)) {
        const first = Object.keys(BOSSES).find((k) => Campaign.bossUnlocked(k));
        GameState.setBossSettings({ boss: first || 'dragon' });
      }
      const def = BOSSES[GameState.bossSettings.boss];
      const cleared = GameState.bossStageCleared(def.id);
      const maxPick = Math.min(Progression.BOSS_MAX_STAGE, cleared + 1);
      if (GameState.bossSettings.stage > maxPick) GameState.setBossSettings({ stage: maxPick });
      return { ...GameState.bossSettings, def, cleared, maxPick };
    }
    if (this.mode === 'rift') {
      const as = GameState.attuneSettings;
      if (!(as.boss in ELEMENTAL_BOSSES)) GameState.setAttuneSettings({ boss: 'fire' });
      const def = ELEMENTAL_BOSSES[GameState.attuneSettings.boss];
      const cleared = GameState.attuneStageCleared(def.attuneId);
      const maxPick = Math.min(Progression.BOSS_MAX_STAGE, cleared + 1);
      if ((GameState.attuneSettings.stage || 1) > maxPick) {
        GameState.setAttuneSettings({ stage: maxPick });
      }
      return { ...GameState.attuneSettings, def, cleared, maxPick };
    }
    if (this.mode === 'dungeon') {
      const ds = GameState.dungeonSettings;
      if (!(ds.boss in DUNGEON_BOSSES)) GameState.setDungeonSettings({ boss: 'whetstone' });
      const def = DUNGEON_BOSSES[GameState.dungeonSettings.boss];
      const cleared = GameState.bossStageCleared(def.id);
      const maxPick = Math.min(Progression.BOSS_MAX_STAGE, cleared + 1);
      if ((GameState.dungeonSettings.stage || 1) > maxPick) {
        GameState.setDungeonSettings({ stage: maxPick });
      }
      return {
        ...GameState.dungeonSettings, def, cleared, maxPick,
        runsLeft: GameState.dungeonRunsLeft(def.id),
      };
    }
    return { next: GameState.towerBest + 1 };
  }

  // ---- Render ------------------------------------------------------------

  render() {
    if (!this.host) return;
    const cur = this.current();
    this.host.innerHTML = `
      <div id="bs-modes">${this.modesHtml()}</div>
      <div id="bs-stages">${this.stagesHtml(cur)}</div>
      <div id="bs-info">
        ${this.variantsHtml(cur)}
        <div class="bs-card">${this.infoHtml(cur)}</div>
        ${this.launchHtml(cur)}
      </div>`;
    // Keep the selected stage in view without yanking the pane around.
    const sel = this.host.querySelector('.bs-stage.selected, .bs-stage.next');
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  modesHtml() {
    const modes = [
      { id: 'hunt', label: 'Hunt' },
      { id: 'boss', label: 'Boss' },
      { id: 'rift', label: 'Elemental Rift' },
      { id: 'dungeon', label: 'Dungeon' },
      { id: 'tower', label: 'Tower' },
    ];
    return modes.map((m) =>
      `<button class="bs-mode${m.id === this.mode ? ' active' : ''}"
        data-act="mode" data-mode="${m.id}">${m.label}</button>`).join('');
  }

  stagesHtml(cur) {
    const rows = [];
    if (this.mode === 'hunt') {
      for (let st = 0; st <= 20; st++) {
        const lv = st === 0 ? 1 : st * 5;
        rows.push(`<button class="bs-stage${st === cur.stage ? ' selected' : ''}"
          data-act="stage" data-v="${st}">${st === 0 ? 'Training' : `Stage ${st}`}
          <span class="bs-lv">Lv ${lv}</span></button>`);
      }
    } else if (this.mode === 'boss' || this.mode === 'rift' || this.mode === 'dungeon') {
      // The same twenty-rung ladder everywhere it applies: clear a rung
      // to open the next. Dungeons call theirs floors.
      const word = this.mode === 'dungeon' ? 'Floor' : 'Stage';
      for (let st = 1; st <= Progression.BOSS_MAX_STAGE; st++) {
        const locked = st > cur.maxPick;
        const state = st === cur.stage ? ' selected'
          : st <= cur.cleared ? ' cleared'
          : st === cur.maxPick ? ' next' : '';
        rows.push(`<button class="bs-stage${state}${locked ? ' locked' : ''}"
          data-act="stage" data-v="${st}" ${locked ? 'disabled' : ''}>
          ${word} ${st} <span class="bs-lv">Lv ${Progression.bossLevel(st)}</span>
          ${st <= cur.cleared ? '<span class="bs-mark">✓</span>'
            : locked ? '<span class="bs-mark">🔒</span>' : ''}</button>`);
      }
    } else {
      // Tower: the last twenty floors greyed out (the climb never goes
      // back), the next floor selectable at the bottom.
      const next = cur.next;
      for (let f = Math.max(1, next - 20); f < next; f++) {
        rows.push(`<button class="bs-stage cleared locked" disabled>
          Floor ${f} <span class="bs-lv">Lv ${Math.max(2, Math.ceil(f * 1.5))}</span>
          <span class="bs-mark">✓</span></button>`);
      }
      rows.push(`<button class="bs-stage selected" data-act="stage" data-v="${next}">
        Floor ${next} <span class="bs-lv">Lv ${Math.max(2, Math.ceil(next * 1.5))}</span>
        ${next % 10 === 0 ? '<span class="bs-mark">BOSS</span>' : ''}</button>`);
    }
    return `<div class="bs-stage-list">${rows.join('')}</div>`;
  }

  variantsHtml(cur) {
    let btns = '';
    if (this.mode === 'hunt') {
      btns = CONFIG.LOCATION_NAMES.map((n, i) => {
        const open = this.huntOpen(i);
        return `<button class="bs-variant${i === cur.location ? ' active' : ''}"
          data-act="variant" data-v="${i}" ${open ? '' : 'disabled'}
          title="${open ? `Hunt in the ${n}` : 'Unlocks with campaign progress'}">
          ${n}${open ? '' : ' 🔒'}</button>`;
      }).join('');
    } else if (this.mode === 'boss') {
      btns = Object.entries(BOSSES).map(([key, b]) => {
        const open = Campaign.bossUnlocked(key);
        return `<button class="bs-variant${key === cur.boss ? ' active' : ''}"
          data-act="variant" data-v="${key}" ${open ? '' : 'disabled'}
          title="${open ? b.title || b.name : "Clear this boss's campaign chapter first"}">
          ${Elements.badge(b.element)} ${b.name}${open ? '' : ' 🔒'}</button>`;
      }).join('');
    } else if (this.mode === 'rift') {
      const boosted = typeof Events !== 'undefined' ? Events.boostedElements() : [];
      btns = Object.entries(ELEMENTAL_BOSSES).map(([key, b]) => {
        const info = Elements.info(b.element);
        const hot = boosted.includes(b.attuneId || b.element);
        return `<button class="bs-variant${key === cur.boss ? ' active' : ''}"
          data-act="variant" data-v="${key}"
          ${info ? `style="color:${key === cur.boss ? '' : info.color}"` : ''}
          title="${b.name} — ${b.title || ''}${hot ? ' — 2× drops today!' : ''}">${info ? info.emoji : ''} ${info ? info.name : key}${hot ? ' ⚡2×' : ''}</button>`;
      }).join('');
    } else if (this.mode === 'dungeon') {
      btns = Object.entries(DUNGEON_BOSSES).map(([key, b]) => {
        const icon = b.whetstonesPer > 0 ? '🪨' : b.arcanaPer > 0 ? '✦'
          : b.diamondsFor ? '💎' : '⭐';
        return `<button class="bs-variant${key === cur.boss ? ' active' : ''}"
          data-act="variant" data-v="${key}"
          title="${b.dungeonName} — ${b.title || ''}">${icon} ${b.dungeonName}</button>`;
      }).join('');
    } else {
      return '';
    }
    const eventLine = this.mode === 'rift' && typeof Events !== 'undefined'
      ? `<div class="bs-event">⚡ ${Events.scheduleLabel()}</div>` : '';
    return `<div class="bs-variants">${btns}</div>${eventLine}`;
  }

  infoHtml(cur) {
    if (this.mode === 'hunt') {
      const loc = cur.location;
      const lv = cur.stage === 0 ? 1 : cur.stage * 5;
      const pool = [...new Set((LOCATION_ENEMIES[loc] || [])
        .map((id) => ENEMIES[id]).filter(Boolean))];
      const count = Math.min(7, Math.max(2, GameState.teamSize() + 1));
      return `
        <div class="bs-title">${CONFIG.LOCATION_NAMES[loc] || 'Hunt'}
          — ${cur.stage === 0 ? 'Training ground' : `Stage ${cur.stage}`}</div>
        <div class="bs-line">Fields <b>${count}</b> enemies at Lv ~${lv}
          (your team +1, up to 7), composed with a front line to break and
          casters behind it.</div>
        <div class="bs-sub">Local enemies</div>
        <div class="bs-line">${pool.map((e) =>
          `${Elements.badge(e.element)} ${e.name}`).join(' · ') || '—'}</div>
        <div class="bs-sub">Rewards</div>
        <div class="bs-line">XP and Whetstones scaled to enemy levels, a
          trickle of Arcana${cur.stage === 0 ? '. The training ground stays at level 1.' : '.'}</div>`;
    }
    if (this.mode === 'boss' || this.mode === 'rift' || this.mode === 'dungeon') {
      const def = cur.def;
      const lv = Progression.bossLevel(cur.stage);
      const s = Progression.bossScaledStats(def, lv);
      const elInfo = def.element && Elements.info(def.element);
      const cleared = cur.stage <= cur.cleared;
      const drops = this.mode === 'boss'
        ? (Gear.SETS[def.gearSet] ? `${Gear.SETS[def.gearSet].name} set gear —
            higher stages roll rarer.` : '—')
        : this.mode === 'dungeon'
          ? (def.whetstonesPer > 0
            ? `<b>${def.whetstonesPer * cur.stage}</b> Whetstones 🪨 every clear
              (${def.whetstonesPer} × floor). No gear here — pure polishing money.`
            : def.arcanaPer > 0
              ? `<b>${def.arcanaPer * cur.stage}</b> Arcana ✦ every clear
                (${def.arcanaPer} × floor). No gear here — pure enchanting money.`
            : def.diamondsFor
              ? `<b>${def.diamondsFor(cur.stage)}</b> Diamonds 💎 every clear —
                50 💎 at floor 1 rising to 250 💎 at floor 20. The hardest
                fight in the dungeons, and the richest.`
              : `<b>${(Progression.enemyXp(lv) * (def.xpMult || 6)).toLocaleString()}</b>
                XP ⭐ for every team member, every clear — about
                ${Math.round((def.xpMult || 6) / 6)}× what a boss fight of this
                level pays. No gear here — pure schooling.`)
        : `${Attune.payoutText(cur.stage)} ${elInfo ? elInfo.name : ''} Elements.${
            typeof Events !== 'undefined' &&
            Events.elementBoost(def.attuneId || def.element) > 1
              ? ' <b>⚡ Doubled today by the event schedule!</b>' : ''}`;
      const word = this.mode === 'dungeon' ? 'Floor' : 'Stage';
      return `
        <div class="bs-title">${Elements.badge(def.element)} ${def.name}
          <span class="bs-stagechip">${word} ${cur.stage} · Lv ${lv}
          ${cleared ? '· ✓ cleared' : cur.stage === cur.maxPick ? '· open' : ''}</span></div>
        <div class="bs-line">${def.title || ''}</div>
        <div class="bs-stats">
          <span><b>${s.hp.toLocaleString()}</b> HP</span>
          <span><b>${s.atk}</b> ATK</span>
          <span><b>${s.def}</b> DEF</span>
          <span><b>${s.speed}</b> SPD</span>
        </div>
        <div class="bs-line">Fights alone from the center tile and spans the
          whole formation.</div>
        <div class="bs-sub">Skills</div>
        <div class="bs-line">${(def.abilities || []).map((a) => a.name).join(' · ')}</div>
        <div class="bs-sub">Drops</div>
        <div class="bs-line">${drops}</div>
        ${this.mode === 'dungeon' ? (() => {
          const limit = GameState.dungeonRunsPerDay(def.id);
          return `
        <div class="bs-sub">Daily attempts</div>
        <div class="bs-line">${cur.runsLeft > 0
          ? `<b>${cur.runsLeft}</b> of ${limit} challenge${limit > 1 ? 's' : ''} left today.`
          : `<b>${limit > 1 ? `All ${limit} spent` : "Today's challenge is spent"}</b>
            — the gate reopens in
            ${Quests.formatCountdown(Quests.timeToReset('daily'))}.`}</div>`;
        })() : ''}`;
    }
    const next = cur.next;
    const lv = Math.max(2, Math.ceil(next * 1.5));
    return `
      <div class="bs-title">Endless Tower — Floor ${next}</div>
      <div class="bs-line">Best floor: <b>${GameState.towerBest}</b>. The climb
        always takes the next floor; enemy levels rise ~1.5 per floor
        forever.${next % 10 === 0 ? ' <b>A boss guards this floor.</b>' : ''}</div>
      <div class="bs-stats"><span>Enemies at <b>Lv ~${lv}</b></span></div>
      <div class="bs-sub">Rewards</div>
      <div class="bs-line">Every floor drops a Common Scroll, every 5th a
        Rare, every 50th a Temporal Scroll. On Auto the climb chains as
        long as you keep winning.</div>`;
  }

  launchHtml(cur) {
    const size = GameState.teamSize();
    const bossLocked = this.mode === 'boss' && !Campaign.bossUnlocked(cur.boss);
    const spent = this.mode === 'dungeon' && cur.runsLeft <= 0;
    const labels = { hunt: 'Fight!', boss: 'Boss!', rift: 'Attune!', dungeon: 'Delve!', tower: 'Climb!' };
    // Repeats only for cleared content; the tower chains on its own.
    let repeat = '';
    if (this.mode !== 'tower') {
      const uncleared = (this.mode !== 'hunt') && cur.stage > cur.cleared;
      const val = this.mode === 'hunt' ? GameState.waveSettings.repeat
        : this.mode === 'boss' ? GameState.bossSettings.repeat
        : this.mode === 'dungeon' ? GameState.dungeonSettings.repeat
        : GameState.attuneSettings.repeat;
      const opts = ['1', '3', '5', '10'].concat(this.mode === 'rift' ? [] : ['inf']);
      repeat = `<select id="bs-repeat" title="${uncleared
        ? 'Repeats unlock once the stage is cleared' : 'How many battles to chain'}"
        ${uncleared ? 'disabled' : ''}>
        ${opts.map((o) => `<option value="${o}" ${String(uncleared ? '1' : val) === o ? 'selected' : ''}>
          ${o === 'inf' ? '∞' : `×${o}`}</option>`).join('')}
      </select>`;
    }
    return `<div class="bs-launch">
      ${repeat}
      <button class="panel-btn gold" data-act="launch" ${size === 0 || bossLocked || spent ? 'disabled' : ''}
        title="${size === 0 ? 'Place a team on the Team screen first'
          : bossLocked ? "Clear this boss's campaign chapter to challenge it"
          : spent ? "The day's challenges are spent — the gate reopens at midnight"
          : 'Start the fight'}">
        ${labels[this.mode]}</button>
      ${size === 0 ? '<span class="bs-note">Place a team first</span>'
        : bossLocked ? '<span class="bs-note">Clear its campaign chapter first</span>'
        : spent ? '<span class="bs-note">No challenges left today</span>' : ''}
    </div>`;
  }
}
