// Blacksmith screen: the home of all item upgrading and maintenance.
// Lists the whole gear inventory (equipped pieces included, tagged with
// their wearer), with polishing (levels), enchanting (+0..+15), and
// salvaging handled here.

class BlacksmithScreen {
  constructor(app) {
    this.app = app;
    this.el = document.getElementById('screen-blacksmith');
    this.filtersEl = document.getElementById('bs-filters');
    this.listEl = document.getElementById('bs-list');
    this.detailEl = document.getElementById('bs-detail');
    this.filter = 'all';
    this.selectedUid = null;

    // Inventory order. Rarity is the default because "what is my best
    // piece" is the usual question, but assembling a six-piece set means
    // reading by set instead, so that ordering is a click away and is
    // remembered between visits.
    this.sortEl = document.getElementById('bs-sort');
    this.sort = 'rarity';
    try {
      const saved = localStorage.getItem('bg_gearSort');
      if (saved) this.sort = saved;
    } catch (e) { /* storage unavailable: the default is fine */ }
    if (this.sortEl) {
      this.sortEl.value = this.sort;
      // A saved value naming a sort that no longer exists leaves the
      // select blank; fall back rather than render an empty control.
      if (!this.sortEl.value) { this.sort = 'rarity'; this.sortEl.value = this.sort; }
      this.sortEl.addEventListener('change', () => {
        this.sort = this.sortEl.value;
        try { localStorage.setItem('bg_gearSort', this.sort); } catch (e) {}
        this.refresh();
      });
    }

    // Bulk salvage: every unequipped piece below the chosen rarity.
    this.bulkRarity = document.getElementById('bs-bulk-rarity');
    document.getElementById('bs-bulk-salvage').addEventListener('click', () => {
      const rarity = this.bulkRarity.value;
      const rank = Gear.RARITY_ORDER.indexOf(rarity);
      const count = GameState.unequippedGear()
        .filter((p) => Gear.RARITY_ORDER.indexOf(p.rarity) < rank).length;
      if (count === 0) {
        this.refresh();
        this.message(`No unequipped items below ${Gear.RARITIES[rarity].name}.`);
        return;
      }
      if (!confirm(`Salvage ${count} unequipped item${count > 1 ? 's' : ''} below ${Gear.RARITIES[rarity].name}? This destroys them.`)) return;
      const r = GameState.salvageAllBelow(rarity);
      this.refresh();
      this.message(`Salvaged ${r.count} items for ${r.whetstones} 🪨${r.arcana ? ` and ${r.arcana} ✦` : ''}.`);
    });
  }

  message(text) {
    const el = document.getElementById('bs-toolbar-msg');
    if (el) el.textContent = text;
  }

  enter() {
    this.refresh();
  }

  exit() {}
  update() {}
  draw() {}

  // Inventory = every piece, worn or not.
  allPieces() {
    const pieces = [];
    const seen = new Set();
    for (const p of GameState.unequippedGear()) {
      pieces.push(p);
      seen.add(p.uid);
    }
    for (const heroId of GameState.ownedHeroIds()) {
      for (const p of GameState.equippedPieces(heroId)) {
        if (!seen.has(p.uid)) {
          pieces.push(p);
          seen.add(p.uid);
        }
      }
    }
    return pieces;
  }

  refresh() {
    const slots = ['all', ...Gear.SLOTS];
    this.filtersEl.innerHTML = slots.map((s) =>
      `<button class="panel-btn bs-filter ${this.filter === s ? 'gold' : ''}" data-slot="${s}">
        ${s === 'all' ? 'All' : Gear.SLOT_LABELS[s]}
      </button>`).join('');
    this.filtersEl.querySelectorAll('.bs-filter').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.filter = btn.dataset.slot;
        this.refresh();
      });
    });

    const rarityRank = Object.fromEntries(Gear.RARITY_ORDER.map((r, i) => [r, i]));
    const setOrder = Object.keys(Gear.SETS);
    const slotOrder = Gear.SLOTS;
    // Every ordering falls through to the same tie-break, so a list only
    // ever reorders by the thing that was asked for.
    const byQuality = (a, b) =>
      rarityRank[b.rarity] - rarityRank[a.rarity] ||
      b.level - a.level || b.plus - a.plus ||
      String(a.uid).localeCompare(String(b.uid));
    const wearerName = (p) => {
      const id = GameState.wearerOf(p.uid);
      const def = id && GameState.defOf(id);
      return def ? def.name : '';
    };
    const SORTS = {
      rarity: byQuality,
      // Sets group together, and within a set the best piece leads — so
      // the gap in a six-piece set is visible at a glance.
      set: (a, b) => setOrder.indexOf(a.set) - setOrder.indexOf(b.set) || byQuality(a, b),
      level: (a, b) => b.level - a.level || b.plus - a.plus || byQuality(a, b),
      slot: (a, b) => slotOrder.indexOf(a.slot) - slotOrder.indexOf(b.slot) || byQuality(a, b),
      // Worn pieces first, grouped by their wearer; the bench follows.
      wearer: (a, b) => {
        const wa = wearerName(a);
        const wb = wearerName(b);
        if (!wa !== !wb) return wa ? -1 : 1;
        return wa.localeCompare(wb) || byQuality(a, b);
      },
    };
    const pieces = this.allPieces()
      .filter((p) => this.filter === 'all' || p.slot === this.filter)
      .sort(SORTS[this.sort] || SORTS.rarity);

    if (!pieces.some((p) => p.uid === this.selectedUid)) {
      this.selectedUid = pieces.length ? pieces[0].uid : null;
    }

    this.listEl.innerHTML = pieces.length === 0
      ? '<div class="details-empty">No gear yet — defeat the Dragon boss to earn set pieces.</div>'
      : pieces.map((p) => {
          const wearer = GameState.wearerOf(p.uid);
          const color = Gear.RARITIES[p.rarity].color;
          const iconSrc = Gear.icon(p);
          return `
            <div class="bs-row ${p.uid === this.selectedUid ? 'bs-row-selected' : ''}" data-uid="${p.uid}">
              ${iconSrc ? `<img class="detail-icon" src="${Sprites.assetUrl(iconSrc)}" alt="">` : ''}
              <span class="bs-row-name" style="color:${color}">${p.locked ? '🔒 ' : ''}${Gear.pieceName(p)}</span>
              <span class="bs-row-info">Lv ${p.level} · ${Gear.statText(Gear.baseStat(p).stat, Gear.baseStat(p).value)}</span>
              ${wearer && GameState.defOf(wearer) ? `<span class="bs-row-wearer">${GameState.defOf(wearer).name}</span>` : ''}
            </div>`;
        }).join('');
    this.listEl.querySelectorAll('.bs-row').forEach((row) => {
      row.addEventListener('click', () => {
        this.selectedUid = row.dataset.uid;
        this.refresh();
      });
    });

    this.renderDetail();
  }

  renderDetail() {
    const piece = this.selectedUid ? GameState.gearById(this.selectedUid) : null;
    if (!piece) {
      this.detailEl.innerHTML = '<div class="details-empty">Select a piece to work on it.</div>';
      return;
    }

    const rar = Gear.RARITIES[piece.rarity];
    const base = Gear.baseStat(piece);
    const capLevel = Gear.maxLevel(piece);
    const atMax = piece.level >= capLevel;
    const polishCost = atMax ? 0 : Gear.polishCost(piece.level);
    const atMaxPlus = piece.plus >= Gear.MAX_PLUS;
    const enchCost = atMaxPlus ? 0 : Gear.arcanaCost(piece.plus);
    const nextMilestone = atMaxPlus ? null : Math.ceil((piece.plus + 1) / 3) * 3;
    const wearer = GameState.wearerOf(piece.uid);
    const pending = piece.pendingSubs || null;
    const subsHtml = piece.subs.length
      ? piece.subs.map((s, i) => {
        if (!pending || !pending[i]) {
          return `<div class="set-bonus">${Gear.subLabel(s)}</div>`;
        }
        // Side by side, with the direction marked, so the choice does
        // not require reading two numbers and doing the sum.
        const up = pending[i].value > s.value;
        const same = pending[i].value === s.value;
        return `<div class="sub-compare">
          <span class="sub-old">${Gear.subLabel(s)}</span>
          <span class="sub-arrow ${same ? '' : up ? 'up' : 'down'}">
            ${same ? '=' : up ? '\u25b2' : '\u25bc'}</span>
          <span class="sub-new ${same ? '' : up ? 'up' : 'down'}">${Gear.subLabel(pending[i])}</span>
        </div>`;
      }).join('')
      : '<div class="set-bonus">No substats yet</div>';
    const rerollCost = Gear.rerollCost(piece);
    const better = pending ? Gear.subsScore(pending) - Gear.subsScore(piece.subs) : 0;

    // The piece's set bonuses, with the tiers its wearer has actually
    // switched on lit up — an unequipped piece (or a bench hero short of
    // the count) shows them dimmed, so what a full set buys is always
    // one glance away.
    const set = Gear.SETS[piece.set];
    const wornCount = wearer
      ? GameState.equippedPieces(wearer).filter((p) => p.set === piece.set).length
      : 0;
    const setHtml = set ? `
      <div class="detail-section">${set.name} Set${wearer ? ` (${wornCount}/6 equipped)` : ''}</div>
      ${set.bonuses.map((b) => wornCount >= b.pieces
        ? `<div class="set-bonus set-bonus-live">✓ ${b.label}</div>`
        : `<div class="set-bonus">${b.label}</div>`).join('')}` : '';

    this.detailEl.innerHTML = `
      <div class="detail-name" style="color:${rar.color}">${Gear.pieceName(piece)}</div>
      <div class="detail-stats">
        ${rar.name} · Lv ${piece.level}/${capLevel} · ${Gear.statText(base.stat, base.value)}
        ${wearer && GameState.defOf(wearer) ? `<br>Equipped by ${GameState.defOf(wearer).name}` : '<br>Unequipped'}
      </div>
      <div class="detail-section">Substats (${piece.subs.length}/${rar.maxSubs + Gear.MAX_PLUS / 3})</div>
      ${subsHtml}
      ${nextMilestone ? `<div class="set-bonus">Next substat roll at +${nextMilestone}</div>` : ''}
      ${setHtml}
      <div class="detail-section">Upgrade</div>
      <div class="gear-actions">
        <button id="bs-polish" class="panel-btn"
          ${atMax || GameState.whetstones < polishCost ? 'disabled' : ''}>
          ${atMax ? 'Max level' : `Polish (${polishCost} 🪨)`}
        </button>
        <button id="bs-auto-polish" class="panel-btn" title="Keep polishing until the item caps or whetstones run out"
          ${atMax || GameState.whetstones < polishCost ? 'disabled' : ''}>Auto 🪨</button>
      </div>
      <div class="gear-actions">
        <button id="bs-enchant" class="panel-btn"
          ${atMaxPlus || GameState.arcana < enchCost ? 'disabled' : ''}>
          ${atMaxPlus ? 'Max +15'
            : `Enchant +${piece.plus + 1} (${enchCost} ✦ · ${Math.round(Gear.enchantSuccessRate(piece.plus) * 100)}%)`}
        </button>
        <button id="bs-auto-enchant" class="panel-btn" title="Keep attempting enchants until +15 or arcana runs out"
          ${atMaxPlus || GameState.arcana < enchCost ? 'disabled' : ''}>Auto ✦</button>
      </div>
      ${piece.subs.length ? `
      <div class="detail-section">Reroll</div>
      <div class="gear-actions">
        ${pending ? `
          <button id="bs-reroll-keep" class="panel-btn gold">Keep ${better > 0 ? '\u25b2' : better < 0 ? '\u25bc' : ''}</button>
          <button id="bs-reroll-drop" class="panel-btn danger">Discard</button>
          <span class="set-bonus">${better > 0 ? 'The new roll is stronger overall.'
            : better < 0 ? 'The new roll is weaker overall.' : 'Much of a muchness.'}</span>
        ` : `
          <button id="bs-reroll" class="panel-btn"
            ${GameState.arcana < rerollCost ? 'disabled' : ''}
            title="Roll new VALUES for this item's substats. You see the result before deciding.">
            Reroll substats (${rerollCost} \u2726)
          </button>
        `}
      </div>` : ''}
      <div class="detail-section">Maintenance</div>
      <div class="gear-actions">
        <button id="bs-lock" class="panel-btn" title="Locked gear is safe from Salvage all and stays where you put it">${piece.locked ? '🔒 Locked' : '🔓 Lock'}</button>
        <button id="bs-salvage" class="panel-btn danger" ${piece.locked ? 'disabled title="Unlock it first"' : ''}>Salvage</button>
      </div>
      <div id="bs-message" class="set-bonus"></div>
    `;

    const msg = (text) => {
      const el = document.getElementById('bs-message');
      if (el) el.textContent = text;
    };

    const rerollBtn = document.getElementById('bs-reroll');
    if (rerollBtn && !rerollBtn.disabled) {
      rerollBtn.addEventListener('click', () => {
        const r = GameState.rerollGear(piece.uid);
        this.refresh();
        if (r) msg(`Rolled for ${r.cost} \u2726 — keep it or discard it.`);
      });
    }
    const keepBtn = document.getElementById('bs-reroll-keep');
    if (keepBtn) {
      keepBtn.addEventListener('click', () => {
        GameState.keepReroll(piece.uid);
        this.refresh();
        msg('New substats kept.');
      });
    }
    const dropBtn = document.getElementById('bs-reroll-drop');
    if (dropBtn) {
      dropBtn.addEventListener('click', () => {
        GameState.discardReroll(piece.uid);
        this.refresh();
        msg('Roll discarded — the original substats stand.');
      });
    }
    const polishBtn = document.getElementById('bs-polish');
    if (polishBtn && !polishBtn.disabled) {
      polishBtn.addEventListener('click', () => {
        if (GameState.polishGear(piece.uid)) this.refresh();
      });
    }
    const enchantBtn = document.getElementById('bs-enchant');
    if (enchantBtn && !enchantBtn.disabled) {
      enchantBtn.addEventListener('click', () => {
        const r = GameState.enchantGear(piece.uid);
        this.refresh();
        if (!r) return;
        if (r.success) {
          msg(r.milestone ? `Success! ${r.milestone}` : `Enchant succeeds: +${piece.plus + 1}!`);
        } else {
          msg('The enchant fizzles — the Arcana is lost.');
        }
      });
    }
    const autoPolishBtn = document.getElementById('bs-auto-polish');
    if (autoPolishBtn && !autoPolishBtn.disabled) {
      autoPolishBtn.addEventListener('click', () => {
        const r = GameState.autoPolishGear(piece.uid);
        this.refresh();
        const p = GameState.gearById(piece.uid);
        msg(`Polished ${r.levels} level${r.levels === 1 ? '' : 's'} to Lv ${p.level} for ${r.spent} 🪨.`);
      });
    }
    const autoEnchantBtn = document.getElementById('bs-auto-enchant');
    if (autoEnchantBtn && !autoEnchantBtn.disabled) {
      autoEnchantBtn.addEventListener('click', () => {
        const r = GameState.autoEnchantGear(piece.uid);
        this.refresh();
        const p = GameState.gearById(piece.uid);
        const extra = r.milestones.length ? ` ${r.milestones.join(' · ')}` : '';
        msg(`${r.attempts} attempt${r.attempts === 1 ? '' : 's'}, ${r.successes} succeeded — now +${p.plus} (${r.spent} ✦ spent).${extra}`);
      });
    }
    const lockBtn = document.getElementById('bs-lock');
    if (lockBtn) {
      lockBtn.addEventListener('click', () => {
        GameState.toggleGearLock(piece.uid);
        this.refresh();
      });
    }

    const salvageBtn = document.getElementById('bs-salvage');
    if (salvageBtn) {
      salvageBtn.addEventListener('click', () => {
        if (!confirm(`Salvage ${Gear.pieceName(piece)}? This destroys the item.`)) return;
        const r = GameState.salvageGear(piece.uid);
        this.selectedUid = null;
        this.refresh();
        if (r) msg(`Salvaged for ${r.whetstones} 🪨${r.arcana ? ` and ${r.arcana} ✦` : ''}.`);
      });
    }
  }
}
