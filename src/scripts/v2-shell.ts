/**
 * v2 shell: section tracking and the language toggle (§3.4 sidebar, §5.3
 * current section, §5.4 language).
 *
 * Tracking runs on scroll, inside a requestAnimationFrame, and writes only when
 * the current section actually changes. There is no reading meter: the sidebar
 * reports where you are, not how much of a simulated context window you used.
 */

type Lang = 'en' | 'es';

const root = document.documentElement;
const LANG_KEY = 'tui.lang';
const msg = document.getElementById('st-msg');

const turns = [...document.querySelectorAll<HTMLElement>('.turn')];
const meta = JSON.parse(document.getElementById('v2-meta')?.textContent ?? '{}') as {
  title?: Record<Lang, string>;
  desc?: Record<Lang, string>;
  hint?: Record<Lang, string>;
  hintTouch?: Record<Lang, string>;
  hintOff?: Record<Lang, string>;
  placeholder?: Record<Lang, string>;
  placeholderPhone?: Record<Lang, string>;
};

/** Touch is a capability, not a width: a small window with a mouse is not a phone. */
const TOUCH = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
/** Mirrors tui.keys, so the status hint can say what still works. */
let shortcutsOn = true;
try {
  shortcutsOn = localStorage.getItem('tui.keys') !== 'off';
} catch {
  /* storage blocked: shortcuts stay on */
}
const PHONE = () => window.matchMedia('(max-width: 640px)').matches;
let lang: Lang = 'en';

const hintEl = document.getElementById('st-msg');
const promptInput = document.getElementById('cmd') as HTMLInputElement | null;
const paletteButton = document.getElementById('palette-btn');
const dock = document.querySelector<HTMLElement>('.dock');

/**
 * Attributes are copy too: aria-labels and tooltips were server-rendered in
 * English and never swapped. Elements carry both languages in data attributes;
 * this writes the active one.
 */
function applyAttributes() {
  document.querySelectorAll<HTMLElement>('[data-label-en], [data-tip-en]').forEach((el) => {
    const label = el.getAttribute(`data-label-${lang}`);
    if (label) el.setAttribute('aria-label', label);
    const tip = el.getAttribute(`data-tip-${lang}`);
    if (tip) el.setAttribute('data-tip', tip);
  });
}

/** Text and affordances that depend on the input device, not on the language alone. */
function paintChrome() {
  applyAttributes();
  if (TOUCH) root.classList.add('is-touch');

  const tips = document.getElementById('tips');
  if (tips) tips.classList.toggle('tips--chips', TOUCH);

  if (paletteButton) {
    // A keycap inside a button is two frames; this is plain text in the button.
    // Phones get the word too: "Ctrl K" is the longest label in a row that has
    // to fit brand + language + theme without touching both edges.
    const key = paletteButton.querySelector('.btn__key');
    if (key) key.textContent = TOUCH || PHONE() ? 'menu' : 'Ctrl K';
  }

  if (promptInput) {
    promptInput.placeholder =
      (PHONE() ? meta.placeholderPhone?.[lang] : meta.placeholder?.[lang]) ?? '';
  }
  if (hintEl) {
    hintEl.textContent = hintText();
    hintEl.classList.add('is-hint');
  }
}

function hintText(): string {
  if (!shortcutsOn) return meta.hintOff?.[lang] ?? '';
  return (TOUCH ? meta.hintTouch?.[lang] : meta.hint?.[lang]) ?? '';
}

window.addEventListener('tui:keys', (event) => {
  shortcutsOn = Boolean((event as CustomEvent<boolean>).detail);
  paintChrome();
});

// The status line is the shortcut hint until something has to be said, and the
// reference hides it on phones unless it is saying something. Tracking the text
// keeps that honest without every module knowing about the class.
hintEl && new MutationObserver(() => {
  if (!hintEl) return;
  hintEl.classList.toggle('is-hint', hintEl.textContent === hintText());
}).observe(hintEl, { childList: true, characterData: true, subtree: true });

/* Transient messages ("copied", "shortcuts off") come through here: the status
   line is this module's element, so it also owns putting the hint back. */
let sayTimer = 0;
window.addEventListener('tui:say', (event) => {
  const text = (event as CustomEvent<string>).detail;
  if (!hintEl || !text) return;
  hintEl.textContent = text;
  hintEl.classList.remove('is-hint');
  window.clearTimeout(sayTimer);
  sayTimer = window.setTimeout(() => {
    if (!hintEl) return;
    hintEl.textContent = hintText();
    hintEl.classList.add('is-hint');
  }, 2600);
});

/* ------------------------------------------------------------------ language -- */

function readLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === 'en' || stored === 'es') return stored;
  } catch {
    /* storage blocked: fall through to the navigator */
  }
  return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en';
}

function applyLang(next: Lang, announce = true) {
  lang = next;
  root.dataset.lang = next;
  root.lang = next;

  if (meta.title?.[next]) document.title = meta.title[next];
  const desc = document.querySelector('meta[name="description"]');
  if (desc && meta.desc?.[next]) desc.setAttribute('content', meta.desc[next]);

  document.querySelectorAll<HTMLElement>('[data-lang-to]').forEach((button) => {
    button.setAttribute('aria-checked', String(button.dataset.langTo === next));
  });

  // The CV follows the language too, and it is a download: the href has to be
  // right before the click, not after a reload.
  document.querySelectorAll<HTMLAnchorElement>('[data-cv]').forEach((link) => {
    const href = link.getAttribute(`data-cv-${next}`);
    if (href) link.setAttribute('href', href);
  });

  try {
    localStorage.setItem(LANG_KEY, next);
  } catch {
    /* private mode */
  }

  // text lengths differ per language, and so does the copy in the chrome, which
  // is why it repaints rather than waiting for the next scroll.
  paintChrome();
  // Spanish labels are longer: the strip may overflow now when it did not.
  paintStripMore();
  window.dispatchEvent(new CustomEvent('tui:lang', { detail: next }));
  if (announce && msg) msg.textContent = next.toUpperCase();
}

document.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-lang-to]');
  if (!button) return;
  event.preventDefault();
  applyLang(button.dataset.langTo as Lang);
});

/* -------------------------------------------------------------- shared state -- */

const strip = document.querySelector<HTMLElement>('.tabstrip');
const stripInd = document.querySelector<HTMLElement>('.tabstrip__ind');
const files = document.querySelector<HTMLElement>('.files');
const filesInd = document.querySelector<HTMLElement>('.files__ind');
let currentId = '';
/** Nav clicks set the section themselves; scroll updates pause briefly after. */
let currentLock = 0;

function setCurrent(id: string) {
  if (id === currentId) return;
  currentId = id;
  turns.forEach((turn) => turn.classList.toggle('is-current', turn.id === id));
  document.querySelectorAll<HTMLElement>('[data-nav]').forEach((link) => {
    if (link.dataset.nav === id) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
  moveIndicators();
}

function moveIndicators() {
  const stripLink = strip?.querySelector<HTMLElement>('a[aria-current="true"]');
  if (stripLink && stripInd && strip) {
    const a = stripLink.getBoundingClientRect();
    const s = strip.getBoundingClientRect();
    const x = a.left - s.left + strip.scrollLeft;
    stripInd.style.transform = `translateX(${x}px) scaleX(${a.width})`;
    // Phones: the nav is a scroller, so the current tab has to be brought into
    // view when the section changes — otherwise the highlight moves off-screen.
    if (a.left < s.left + 8 || a.right > s.right - 28) {
      stripLink.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  const fileLink = files?.querySelector<HTMLElement>('a[aria-current="true"]');
  if (fileLink && filesInd && files) {
    const f = fileLink.getBoundingClientRect();
    const s = files.getBoundingClientRect();
    const y = f.top - s.top;
    filesInd.style.transform = `translateY(${y}px) scaleY(${f.height})`;
  }

  paintStripMore();
}

/* The strip's "there is more" chevron, and its honest removal. */
const stripMore = document.querySelector<HTMLElement>('.tabstrip__more');

function paintStripMore() {
  if (!strip || !stripMore) return;
  const end = strip.scrollWidth - strip.clientWidth;
  stripMore.classList.toggle('is-hidden', end <= 4 || strip.scrollLeft >= end - 4);
}

strip?.addEventListener('scroll', paintStripMore, { passive: true });
window.addEventListener('resize', paintStripMore);

function update() {
  // The design-system view is a sibling of the transcript; while it is open the
  // section tracker and the reading meter have nothing to say.
  if (!document.getElementById('view-system')?.hidden) return;

  const viewport = window.innerHeight;
  // Sticky prompts stack under the title bar, so the current section is the one
  // whose prompt has slid behind it. A fixed fraction of the viewport would skip
  // short sections entirely: `about` is shorter than any such line.
  const bar = parseFloat(getComputedStyle(root).getPropertyValue('--bar-h')) || 48;
  // scroll-margin-top parks a section just below the bar, so the line has to sit
  // at least that low or the section you just jumped to never becomes current.
  const margin = turns[0] ? parseFloat(getComputedStyle(turns[0]).scrollMarginTop) || 0 : 0;
  const line = bar + margin + 2;

  let index = -1;

  // A prompt pinned under the bar is current, and it wins outright: that is the
  // section whose answer you are reading.
  turns.forEach((turn, i) => {
    const r = turn.getBoundingClientRect();
    // The section has to *cover* the line: past a section's end the space before
    // the next one belongs to nobody, and the last section that merely ended is
    // not what is on screen.
    if (r.top <= line && r.bottom > line) index = i;
  });

  // Nothing pinned (short page, or scrolled to the end): the section taking up
  // the most of the viewport is the one on screen.
  if (index < 0) {
    let best = 0;
    turns.forEach((turn, i) => {
      const r = turn.getBoundingClientRect();
      const visible = Math.max(0, Math.min(r.bottom, viewport) - Math.max(r.top, 0));
      if (visible > best + 1) {
        best = visible;
        index = i;
      }
    });
    if (index < 0 && turns.length) index = 0;
  }

  // At the end of the document the last section is what is on screen, even if a
  // taller one above it still covers the line.
  const atEnd = window.scrollY + viewport >= document.documentElement.scrollHeight - 4;
  if (atEnd && turns.length) index = turns.length - 1;

  const id = index >= 0 ? turns[index].id : '';
  if (id && Date.now() >= currentLock) setCurrent(id);
}

document.addEventListener('click', (event) => {
  const link = (event.target as HTMLElement).closest<HTMLElement>('[data-nav]');
  if (!link?.dataset.nav) return;
  currentLock = Date.now() + 800;
  setCurrent(link.dataset.nav);
});

let lastY = window.scrollY;

/** Phones: the dock drops to one line while you scroll down, and comes back when
    you scroll up, reach either end, or touch the prompt. */
function compactDock() {
  if (!dock || !window.matchMedia('(max-width: 899px)').matches) {
    dock?.classList.remove('is-compact');
    return;
  }
  const y = window.scrollY;
  const atTop = y < 12;

  // Reaching the end used to expand the bar as well, which meant the dock moved
  // 36px at the exact moment the reader arrived — the jump they noticed. It stays
  // compact at the end now, and comes back on a scroll up, at the top, or on focus.
  if (atTop || y < lastY - 4) dock.classList.remove('is-compact');
  else if (y > lastY + 6) dock.classList.add('is-compact');

  lastY = y;
}

promptInput?.addEventListener('focus', () => dock?.classList.remove('is-compact'));
window.addEventListener('resize', () => {
  paintChrome();
  compactDock();
});

let queued = false;
function onScroll() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    update();
    compactDock();
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);

// The page height changes under us — the dock compacts, the meter recounts,
// Spanish reflows. Without this the end-of-document rule can be evaluated
// against a height that no longer exists.
if ('ResizeObserver' in window) {
  new ResizeObserver(() => onScroll()).observe(document.body);
}
window.addEventListener('tui:lang', onScroll);
window.addEventListener('tui:set-lang', (event) => {
  const next = (event as CustomEvent<string>).detail;
  if (next === 'en' || next === 'es') applyLang(next);
});

applyLang(readLang(), false);
update();

export {};


/* The dock is sticky over the transcript, so the last section can sit behind it.
   Measure it rather than guess: it is 96px at 1440 and taller on a phone once the
   status line wraps, and `.main > .transcript` reserves exactly this much. */
if (dock) {
  // --dock-h is the *expanded* height: the transcript reserves that much, and a
  // value that shrank with the compact state would move the whole page under the
  // reader every time the dock reacted to their scroll.
  const statusLine = dock.querySelector<HTMLElement>('.status-line');
  const reportDock = () => {
    if (dock.classList.contains('is-compact')) return;
    root.style.setProperty('--dock-h', `${Math.round(dock.getBoundingClientRect().height)}px`);
    if (statusLine) root.style.setProperty('--dock-slide', `${Math.round(statusLine.getBoundingClientRect().height)}px`);
  };
  reportDock();
  new ResizeObserver(reportDock).observe(dock);
}

/* Devlog phases fold to their heading. A plain button does the work: native
   keyboard support, `aria-expanded` for the state, `hidden` for the panel. */
document.addEventListener('click', (event) => {
  const toggle = (event.target as HTMLElement).closest<HTMLElement>('.devlog__toggle');
  if (!toggle) return;
  const group = toggle.closest<HTMLElement>('.devlog__group');
  const list = group?.querySelector<HTMLElement>('.todo');
  if (!group || !list) return;

  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  group.classList.toggle('is-open', !open);
  list.hidden = open;
  const caret = toggle.querySelector('.devlog__caret');
  if (caret) caret.textContent = open ? '▸' : '▾';
});
