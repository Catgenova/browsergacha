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
    const pieces = this.allPieces()
      .filter((p) => this.filter === 'all' || p.slot === this.filter)
      .sort((a, b) =>
        rarityRank[b.rarity] - rarityRank[a.rarity] || b.level - a.level || b.plus - a.plus);

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
              <span class="bs-row-name" style="color:${color}">${Gear.pieceName(p)}</span>
              <span class="bs-row-info">Lv ${p.level} · ${Gear.statText(Gear.baseStat(p).stat, Gear.baseStat(p).value)}</span>
              ${wearer && HEROES[wearer] ? `<span class="bs-row-wearer">${HEROES[wearer].name}</span>` : ''}
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
    const subsHtml = piece.subs.length
      ? piece.subs.map((s) => `<div class="set-bonus">${Gear.subLabel(s)}</div>`).join('')
      : '<div class="set-bonus">No substats yet</div>';

    this.detailEl.innerHTML = `
      <div class="detail-name" style="color:${rar.color}">${Gear.pieceName(piece)}</div>
      <div class="detail-stats">
        ${rar.name} · Lv ${piece.level}/${capLevel} · ${Gear.statText(base.stat, base.value)}
        ${wearer && HEROES[wearer] ? `<br>Equipped by ${HEROES[wearer].name}` : '<br>Unequipped'}
      </div>
      <div class="detail-section">Substats (${piece.subs.length}/${rar.maxSubs})</div>
      ${subsHtml}
      ${nextMilestone ? `<div class="set-bonus">Next substat roll/boost at +${nextMilestone}</div>` : ''}
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
      <div class="detail-section">Maintenance</div>
      <div class="gear-actions">
        <button id="bs-salvage" class="panel-btn danger">Salvage</button>
      </div>
      <div id="bs-message" class="set-bonus"></div>
    `;

    const msg = (text) => {
      const el = document.getElementById('bs-message');
      if (el) el.textContent = text;
    };

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
