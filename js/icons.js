// Icons: the game's emoji, redrawn. Every pictograph the UI used to
// borrow from the emoji font is now a hand-drawn inline SVG in the
// game's own palette, tailored to what it MEANS here (the 🌀 is a
// temporal spiral, the 🪨 a whetstone block, the ✦ an arcana star).
//
// Two delivery paths:
//   - Icons.svg(name) hands markup to code that composes HTML.
//   - Icons.install() upgrades the page automatically: an initial pass
//     plus a MutationObserver replace mapped emoji in TEXT nodes with
//     the SVG in place (bound listeners survive — elements are never
//     recreated), and scrub emoji out of attributes (title,
//     placeholder) where markup cannot go, leaving plain words.
// Canvas text is out of scope on purpose — the renderer draws its own
// monochrome glyphs and shapes there.

const Icons = (() => {
  // Palette shorthand.
  const GOLD = '#ffd76a', CYAN = '#8ecbff', PURPLE = '#b48aff',
    GREEN = '#7ae87a', ORANGE = '#ff9a5a', GREY = '#9a92b8',
    PARCH = '#e8d8a8', STONE = '#9a97a6', PALE = '#e8e4d8',
    RED = '#ff7a6a', DIM = '#6b6486';

  // Each icon is the inner markup of a 24x24 viewBox.
  const DEFS = {
    // ---- Currencies -----------------------------------------------------
    'scroll-common': `<rect x="5" y="4" width="14" height="16" rx="2" fill="${PARCH}"/>
      <rect x="3" y="3" width="4" height="5" rx="2" fill="#c9b585"/>
      <rect x="17" y="16" width="4" height="5" rx="2" fill="#c9b585"/>
      <path d="M8 9h8M8 12h8M8 15h5" stroke="#7a6a45" stroke-width="1.4" stroke-linecap="round"/>`,
    sparkle: `<path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" fill="${GOLD}"/>
      <circle cx="19" cy="5" r="1.6" fill="${GOLD}" opacity="0.8"/>
      <circle cx="5" cy="19" r="1.2" fill="${GOLD}" opacity="0.6"/>`,
    swirl: `<path d="M12 3a9 9 0 1 1-9 9 7 7 0 0 0 7 7 7 7 0 0 0 0-14 5 5 0 0 0-5 5 5 5 0 0 0 5 5 3 3 0 0 0 3-3 3 3 0 0 0-3-3" fill="none" stroke="${PURPLE}" stroke-width="2.2" stroke-linecap="round"/>`,
    whetstone: `<path d="M4 15l5-6 6-2 5 4-2 6-9 2z" fill="${STONE}"/>
      <path d="M9 9l6-2 5 4-8 1z" fill="#c2bfcc"/>
      <path d="M4 15l8-3 8 1" fill="none" stroke="#6f6c7c" stroke-width="1.2"/>`,
    diamond: `<path d="M7 4h10l4 5-9 12L3 9z" fill="${CYAN}"/>
      <path d="M7 4l5 5 5-5M3 9h18M12 9l0 11" fill="none" stroke="#dff2ff" stroke-width="1.2" opacity="0.9"/>`,
    arcana: `<path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z" fill="${CYAN}"/>
      <path d="M12 6.5l1.5 4L17.5 12l-4 1.5L12 17.5l-1.5-4L6.5 12l4-1.5z" fill="#eaf7ff"/>`,
    'star-xp': `<path d="M12 2l3 6.6 7 .9-5.2 4.8 1.4 6.9L12 17.7l-6.2 3.5 1.4-6.9L2 9.5l7-.9z" fill="${GOLD}"/>`,

    // ---- Elements -------------------------------------------------------
    'el-water': `<path d="M12 2C8 8 5 11.5 5 15a7 7 0 0 0 14 0c0-3.5-3-7-7-13z" fill="${CYAN}"/>
      <path d="M9 14.5a3.5 4.5 0 0 0 2.5 4.6" fill="none" stroke="#eaf7ff" stroke-width="1.6" stroke-linecap="round"/>`,
    'el-fire': `<path d="M12 2c1 4-4 6-4 11a6.5 6.5 0 0 0 13 0c0-3-1.6-5-3-6.5.2 2-.6 3-1.6 3.5C17 7 15 3.5 12 2z" fill="${ORANGE}"/>
      <path d="M12 21a3.4 3.4 0 0 1-3.4-3.4c0-2 1.7-3 2.6-4.8.9 1.2 4.2 2.5 4.2 5A3.4 3.4 0 0 1 12 21z" fill="${GOLD}"/>`,
    'el-wind': `<path d="M20 4C11 5 5 10 4 20c7-1 13-6 16-16z" fill="${GREEN}"/>
      <path d="M4 20C9 13 14 9 20 4" fill="none" stroke="#2f7a3a" stroke-width="1.5"/>`,
    'el-light': `<circle cx="12" cy="12" r="5" fill="${GOLD}"/>
      <path d="M12 1.5v3.4M12 19.1v3.4M1.5 12h3.4M19.1 12h3.4M4.6 4.6L7 7M17 17l2.4 2.4M19.4 4.6L17 7M7 17l-2.4 2.4" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"/>`,
    'el-dark': `<path d="M20 14.5A9 9 0 0 1 9.5 4 9 9 0 1 0 20 14.5z" fill="${PURPLE}"/>
      <circle cx="17" cy="6" r="1.2" fill="${PURPLE}" opacity="0.8"/>`,

    // ---- UI verbs and places -------------------------------------------
    lock: `<rect x="5" y="10" width="14" height="11" rx="2.5" fill="${GOLD}"/>
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" fill="none" stroke="${GOLD}" stroke-width="2.6"/>
      <circle cx="12" cy="15.5" r="1.7" fill="#5a4a1e"/>`,
    unlock: `<rect x="5" y="10" width="14" height="11" rx="2.5" fill="${GREY}"/>
      <path d="M8 10V7.5a4 4 0 0 1 7.8-1.2" fill="none" stroke="${GREY}" stroke-width="2.6"/>
      <circle cx="12" cy="15.5" r="1.7" fill="#3b3650"/>`,
    bolt: `<path d="M13.5 2L5 13.5h5L10.5 22 19 10.5h-5z" fill="${GOLD}"/>`,
    snowflake: `<path d="M12 2v20M3.3 7l17.4 10M20.7 7L3.3 17M12 5.5l2.2-2.2M12 5.5L9.8 3.3M12 18.5l2.2 2.2M12 18.5l-2.2 2.2M5.5 8.2l-3-.8M5.5 8.2l.8-3M18.5 15.8l3 .8M18.5 15.8l-.8 3M18.5 8.2l3-.8M18.5 8.2l-.8-3M5.5 15.8l-3 .8M5.5 15.8l.8 3" fill="none" stroke="${CYAN}" stroke-width="1.6" stroke-linecap="round"/>`,
    swords: `<path d="M4 4l9 9M20 4l-9 9" stroke="${PALE}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M13 13l4 4M11 13l-4 4" stroke="${PALE}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M15.5 18.5l3-3M5.5 15.5l3 3" stroke="${GOLD}" stroke-width="2.6" stroke-linecap="round"/>`,
    gift: `<rect x="4" y="10" width="16" height="11" rx="1.5" fill="#b06a5a"/>
      <rect x="3" y="7" width="18" height="4" rx="1" fill="#c98a6a"/>
      <path d="M12 7v14M12 7C9 7 7.5 4 9.5 3S12 5 12 7zm0 0c3 0 4.5-3 2.5-4S12 5 12 7z" fill="none" stroke="${GOLD}" stroke-width="1.8"/>`,
    calendar: `<rect x="3" y="5" width="18" height="16" rx="2" fill="${PALE}"/>
      <rect x="3" y="5" width="18" height="5" rx="2" fill="${RED}"/>
      <path d="M7.5 3v4M16.5 3v4" stroke="#4a3450" stroke-width="2" stroke-linecap="round"/>
      <path d="M7 13h3M7 17h3M14 13h3M14 17h3" stroke="${DIM}" stroke-width="1.8" stroke-linecap="round"/>`,
    prism: `<path d="M4 18a8 8 0 0 1 16 0" fill="none" stroke="${RED}" stroke-width="2"/>
      <path d="M6.7 18a5.3 5.3 0 0 1 10.6 0" fill="none" stroke="${GOLD}" stroke-width="2"/>
      <path d="M9.4 18a2.6 2.6 0 0 1 5.2 0" fill="none" stroke="${CYAN}" stroke-width="2"/>`,
    masks: `<path d="M4 4c2.5 1 5 1 7.5 0 0 6-1 10-3.75 10S4 10 4 4z" fill="${GOLD}"/>
      <path d="M12.5 10c2.5 1 5 1 7.5 0 0 6-1 10-3.75 10S12.5 16 12.5 10z" fill="${PURPLE}"/>
      <path d="M6 7.5h1.4M9.2 7.5h1.4M14.5 13.5h1.4M17.7 13.5h1.4" stroke="#2a2438" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M6.5 10.5c.8.8 2 .8 2.8 0" fill="none" stroke="#2a2438" stroke-width="1.3"/>
      <path d="M15 17.7c.8-.8 2-.8 2.8 0" fill="none" stroke="#2a2438" stroke-width="1.3"/>`,
    'sound-on': `<path d="M4 9v6h4l5 4V5L8 9z" fill="${PALE}"/>
      <path d="M16 9a4.2 4.2 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" fill="none" stroke="${PALE}" stroke-width="1.8" stroke-linecap="round"/>`,
    'sound-off': `<path d="M4 9v6h4l5 4V5L8 9z" fill="${DIM}"/>
      <path d="M16 9.5l5 5M21 9.5l-5 5" stroke="${RED}" stroke-width="2" stroke-linecap="round"/>`,
    cog: `<path d="M12 2l1.2 3 3.1-1 1.7 2.6 3 .9-.3 3.2L23 12l-2.3 1.3.3 3.2-3 .9-1.7 2.6-3.1-1L12 22l-1.2-3-3.1 1-1.7-2.6-3-.9.3-3.2L1 12l2.3-1.3-.3-3.2 3-.9L7.7 4l3.1 1z" fill="${GREY}"/>
      <circle cx="12" cy="12" r="3.4" fill="#2a2438"/>`,
    tent: `<path d="M12 3l9 15H3z" fill="${RED}"/>
      <path d="M12 3l-3.5 15h7z" fill="${GOLD}"/>
      <path d="M2 18h20l-1.5 3h-17z" fill="#a04a3e"/>
      <circle cx="12" cy="2.6" r="1.2" fill="${GOLD}"/>`,
    hall: `<path d="M3 9l9-6 9 6z" fill="${PALE}"/>
      <path d="M4 10h16v2H4z" fill="${GREY}"/>
      <path d="M6 12v6M10 12v6M14 12v6M18 12v6" stroke="${PALE}" stroke-width="2.2"/>
      <path d="M3 19h18v2.5H3z" fill="${GREY}"/>`,
    crown: `<path d="M4 8l4 4 4-7 4 7 4-4v10H4z" fill="${GOLD}"/>
      <circle cx="4" cy="7" r="1.4" fill="${GOLD}"/><circle cx="20" cy="7" r="1.4" fill="${GOLD}"/>
      <circle cx="12" cy="4" r="1.4" fill="${GOLD}"/>
      <path d="M4 18h16" stroke="#8a6a20" stroke-width="1.6"/>`,
    skull: `<path d="M12 2a8 8 0 0 0-8 8c0 3 1.4 5 3 6v4h10v-4c1.6-1 3-3 3-6a8 8 0 0 0-8-8z" fill="${PALE}"/>
      <circle cx="9" cy="10.5" r="2" fill="#2a2438"/><circle cx="15" cy="10.5" r="2" fill="#2a2438"/>
      <path d="M10.5 20v-2.6M13.5 20v-2.6" stroke="#2a2438" stroke-width="1.4"/>
      <path d="M12 12.6l1 2h-2z" fill="#2a2438"/>`,
    target: `<circle cx="12" cy="12" r="9" fill="${RED}"/>
      <circle cx="12" cy="12" r="6" fill="${PALE}"/>
      <circle cx="12" cy="12" r="3" fill="${RED}"/>`,
    chains: `<rect x="3" y="8.5" width="10" height="7" rx="3.5" fill="none" stroke="${GREY}" stroke-width="2.2"/>
      <rect x="11" y="8.5" width="10" height="7" rx="3.5" fill="none" stroke="${GREY}" stroke-width="2.2"/>`,
    chart: `<rect x="4" y="12" width="4" height="8" fill="${CYAN}"/>
      <rect x="10" y="7" width="4" height="13" fill="${GOLD}"/>
      <rect x="16" y="10" width="4" height="10" fill="${GREEN}"/>
      <path d="M3 21h18" stroke="${GREY}" stroke-width="1.6"/>`,
    'arrow-up': `<path d="M12 3l7 8h-4v10h-6V11H5z" fill="${GREEN}"/>`,
    bubble: `<circle cx="12" cy="12" r="9" fill="none" stroke="${CYAN}" stroke-width="1.8"/>
      <path d="M7.2 9.5A5.8 5.8 0 0 1 10 6.6" fill="none" stroke="#eaf7ff" stroke-width="1.8" stroke-linecap="round"/>`,
    crystal: `<path d="M12 2l6 6-6 14-6-14z" fill="${CYAN}"/>
      <path d="M6 8h12M12 2v20" stroke="#eaf7ff" stroke-width="1.1" opacity="0.8"/>`,
    warning: `<path d="M12 3L1.8 20.5h20.4z" fill="${GOLD}"/>
      <path d="M12 9.5v5" stroke="#4a3a10" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="12" cy="17.6" r="1.4" fill="#4a3a10"/>`,
    'blessed-mark': `<path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z" fill="none" stroke="#cdd6e4" stroke-width="1.8"/>`,
    'godtouched-mark': `<path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z" fill="${GOLD}"/>`,
    cloud: `<path d="M7 18a4 4 0 0 1 0-8 5.5 5.5 0 0 1 10.6 1.3A3.6 3.6 0 0 1 17.5 18z" fill="${GREY}"/>`,
    'plus-heal': `<path d="M9.5 3h5v6.5H21v5h-6.5V21h-5v-6.5H3v-5h6.5z" fill="${GREEN}"/>`,
    flag: `<path d="M6 22V3" stroke="${GREY}" stroke-width="2" stroke-linecap="round"/>
      <path d="M6 4h12l-3 4 3 4H6z" fill="${RED}"/>`,
    burst: `<path d="M12 2l1.8 6.2L20 6l-4.2 4.6L22 12l-6.2 1.4L20 18l-6.2-.2L12 22l-1.8-6.2L4 18l4.2-4.6L2 12l6.2-1.4L4 6l6.2.2z" fill="${GOLD}"/>`,
  };

  // Emoji -> { n: icon name, w: plain word for attribute text }.
  const MAP = {
    '📜': { n: 'scroll-common', w: 'Common Scroll' },
    '✨': { n: 'sparkle', w: 'Rare Scroll' },
    '🌀': { n: 'swirl', w: 'Temporal Scroll' },
    '🪨': { n: 'whetstone', w: 'Whetstones' },
    '✦': { n: 'arcana', w: 'Arcana' },
    '💎': { n: 'diamond', w: 'Diamonds' },
    '⭐': { n: 'star-xp', w: 'XP' },
    '💧': { n: 'el-water', w: 'Water' },
    '🔥': { n: 'el-fire', w: 'Fire' },
    '🍃': { n: 'el-wind', w: 'Wind' },
    '☀️': { n: 'el-light', w: 'Light' },
    '☀': { n: 'el-light', w: 'Light' },
    '🌙': { n: 'el-dark', w: 'Dark' },
    '🔒': { n: 'lock', w: 'Locked' },
    '🔓': { n: 'unlock', w: 'Unlocked' },
    '⚡': { n: 'bolt', w: 'Event' },
    '❄': { n: 'snowflake', w: 'Frozen' },
    '⚔': { n: 'swords', w: 'Battle' },
    '🎁': { n: 'gift', w: 'Gift' },
    '📅': { n: 'calendar', w: 'Calendar' },
    '🌈': { n: 'prism', w: 'Prismatic' },
    '🎭': { n: 'masks', w: 'Motley' },
    '🔊': { n: 'sound-on', w: 'Sound on' },
    '🔇': { n: 'sound-off', w: 'Muted' },
    '⚙': { n: 'cog', w: 'Settings' },
    '🎪': { n: 'tent', w: 'Shop' },
    '🏛': { n: 'hall', w: 'Sect' },
    '👑': { n: 'crown', w: 'Holder' },
    '☠': { n: 'skull', w: 'Deadly' },
    '🎯': { n: 'target', w: 'Aimed' },
    '⛓': { n: 'chains', w: 'Stunned' },
    '📊': { n: 'chart', w: 'Report' },
    '⬆': { n: 'arrow-up', w: 'Up' },
    '🫧': { n: 'bubble', w: 'Bubble' },
    '💠': { n: 'crystal', w: 'Mirror' },
    '⚠': { n: 'warning', w: 'Warning' },
    '☁': { n: 'cloud', w: 'Cloud' },
    '✚': { n: 'plus-heal', w: 'Heal' },
    '⚑': { n: 'flag', w: 'Marked' },
    '✶': { n: 'burst', w: 'Burst' },
  };

  // One regex over every mapped emoji (longest first so '☀️' beats
  // '☀'), tolerating a trailing variation selector.
  const KEYS = Object.keys(MAP).sort((a, b) => b.length - a.length);
  const RX = new RegExp(`(?:${KEYS.map((k) =>
    k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\uFE0F?`, 'gu');

  function svg(name, cls = '') {
    const body = DEFS[name];
    if (!body) return '';
    return `<svg class="icon${cls ? ` ${cls}` : ''}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
  }

  function iconify(str) {
    return String(str).replace(RX, (m) => {
      const hit = MAP[m.replace(/\uFE0F$/, '')] || MAP[m];
      return hit ? svg(hit.n) : '';
    }).replace(/\uFE0F/g, '');
  }

  // Plain words for places markup cannot go (title=, placeholder=).
  function plain(str) {
    return String(str).replace(RX, (m) => {
      const hit = MAP[m.replace(/\uFE0F$/, '')] || MAP[m];
      return hit ? hit.w : '';
    }).replace(/\uFE0F/g, '').replace(/  +/g, ' ').trim();
  }

  const ATTRS = ['title', 'placeholder', 'aria-label'];

  // Replace emoji inside one element subtree, in place: text nodes get
  // real SVG nodes (bound listeners survive — nothing is recreated),
  // attributes get plain words. Idempotent — a clean tree is a no-op.
  function upgrade(root) {
    if (!root) return;
    if (root.nodeType === Node.ELEMENT_NODE || root.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      if (root.nodeType === Node.ELEMENT_NODE) scrubAttrs(root);
      const els = root.querySelectorAll('*');
      for (const el of els) scrubAttrs(el);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const dirty = [];
      let n;
      while ((n = walker.nextNode())) {
        if (RX.test(n.nodeValue)) dirty.push(n);
        RX.lastIndex = 0;
      }
      for (const node of dirty) upgradeText(node);
    } else if (root.nodeType === Node.TEXT_NODE) {
      if (RX.test(root.nodeValue)) upgradeText(root);
      RX.lastIndex = 0;
    }
  }

  function scrubAttrs(el) {
    // SVG icons never carry these attributes, so this cannot touch our
    // own output. OPTION text cannot hold markup either — covered by
    // upgradeText falling back to words inside <option>/<title>.
    for (const a of ATTRS) {
      const v = el.getAttribute && el.getAttribute(a);
      if (v && RX.test(v)) el.setAttribute(a, plain(v));
      RX.lastIndex = 0;
    }
  }

  function upgradeText(node) {
    const parent = node.parentNode;
    if (!parent) return;
    const tag = parent.nodeName;
    // Markup cannot live inside these: words instead.
    if (tag === 'OPTION' || tag === 'TEXTAREA' || tag === 'TITLE' ||
        tag === 'SCRIPT' || tag === 'STYLE') {
      node.nodeValue = plain(node.nodeValue);
      return;
    }
    const tpl = document.createElement('template');
    tpl.innerHTML = iconify(escapeHtml(node.nodeValue));
    parent.replaceChild(tpl.content, node);
  }

  function escapeHtml(s) {
    return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }

  // The automatic pass: upgrade what the page starts with, then keep
  // upgrading whatever any screen renders, forever. Our own insertions
  // contain no mapped emoji, so the observer converges immediately.
  let observer = null;
  function install() {
    upgrade(document.body);
    if (observer) return;
    observer = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === 'characterData') upgrade(r.target);
        else for (const added of r.addedNodes) upgrade(added);
      }
    });
    observer.observe(document.body,
      { childList: true, subtree: true, characterData: true });
  }

  return { svg, iconify, plain, upgrade, install, MAP, DEFS };
})();
