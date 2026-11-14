/**
 * v2 shell: section tracking, the context meter and the language toggle
 * (§3.4 sidebar, §5.3 current section, §5.4 language).
 *
 * Tracking runs on scroll, inside a requestAnimationFrame, and writes only
 * when the current section or the read count actually changes — the meter is
 * monotonic, so scrolling back up never un-reads a section.
 */

type Lang = 'en' | 'es';

const root = document.documentElement;
const LANG_KEY = 'tui.lang';
const msg = document.getElementById('st-msg');

const turns = [...document.querySelectorAll<HTMLElement>('.turn')];
/** The welcome box counts as the first "section" in the meter: 7 in total. */
const blocks = [...document.querySelectorAll<HTMLElement>('.welcome, .turn')];
const meta = JSON.parse(document.getElementById('v2-meta')?.textContent ?? '{}') as {
  title?: Record<Lang, string>;
  desc?: Record<Lang, string>;
  hint?: Record<Lang, string>;
  hintTouch?: Record<Lang, string>;
  placeholder?: Record<Lang, string>;
  placeholderPhone?: Record<Lang, string>;
};

/** Touch is a capability, not a width: a small window with a mouse is not a phone. */
const TOUCH = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
const PHONE = () => window.matchMedia('(max-width: 640px)').matches;
let lang: Lang = 'en';

const hintEl = document.getElementById('st-msg');
const promptInput = document.getElementById('cmd') as HTMLInputElement | null;
const paletteButton = document.getElementById('palette-btn');
const dock = document.querySelector<HTMLElement>('.dock');

/** Text and affordances that depend on the input device, not on the language alone. */
function paintChrome() {
  if (TOUCH) root.classList.add('is-touch');

  const tips = document.getElementById('tips');
  if (tips) tips.classList.toggle('tips--chips', TOUCH);

  if (paletteButton) {
    const kbd = paletteButton.querySelector('.kbd');
    if (kbd) kbd.textContent = TOUCH ? 'menu' : 'Ctrl K';
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
  return (TOUCH ? meta.hintTouch?.[lang] : meta.hint?.[lang]) ?? '';
}

// The status line is the shortcut hint until something has to be said, and the
// reference hides it on phones unless it is saying something. Tracking the text
// keeps that honest without every module knowing about the class.
hintEl && new MutationObserver(() => {
  if (!hintEl) return;
  hintEl.classList.toggle('is-hint', hintEl.textContent === hintText());
}).observe(hintEl, { childList: true, characterData: true, subtree: true });

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

  try {
    localStorage.setItem(LANG_KEY, next);
  } catch {
    /* private mode */
  }

  // text lengths differ per language, so the meter has to recount
  metrics = null;
  measure();
  paintChrome();
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
const ctx = document.querySelector<HTMLElement>('.ctx');
const ctxBar = document.querySelector<HTMLElement>('.ctx__bar');
const ctxNums = document.querySelector<HTMLElement>('.ctx__nums');
const ctxRead = document.querySelector<HTMLElement>('.ctx__read');
const ctxPct = document.getElementById('ctx-pct');

let currentId = '';
/** Nav clicks set the section themselves; scroll updates pause briefly after. */
let currentLock = 0;
let maxRead = 0;
let metrics: { tokens: number[]; total: number } | null = null;

/** tokens ≈ text length ÷ 4, per section; recomputed when the language changes */
function measure() {
  if (metrics) return metrics;
  const tokens = blocks.map((block) => Math.round((block.textContent ?? '').length / 4));
  metrics = { tokens, total: tokens.reduce((a, b) => a + b, 0) || 1 };
  return metrics;
}

/** 14 cells: filled ones are glyphs, empty ones are wrapped so they can be muted */
function paintBar(pct: number) {
  if (!ctxBar) return;
  const cells = 14;
  const filled = Math.round((pct / 100) * cells);
  ctxBar.innerHTML = '█'.repeat(filled) + (filled < cells ? `<i>${'█'.repeat(cells - filled)}</i>` : '');
}

function paintMeter(read: number) {
  const { tokens, total } = measure();
  const used = tokens.slice(0, read).reduce((a, b) => a + b, 0);
  const pct = Math.min(100, Math.round((used / total) * 100));

  paintBar(pct);
  if (ctxNums) ctxNums.textContent = `≈ ${(used / 1000).toFixed(1)}k / ${Math.round(total / 1000)}k tokens · ${pct}%`;
  if (ctxRead) ctxRead.textContent = `${read}/${blocks.length} sections read`;
  if (ctxPct) ctxPct.textContent = `${pct}%`;
  if (ctx) {
    ctx.setAttribute('aria-valuenow', String(pct));
    ctx.setAttribute('aria-valuetext', `${pct}%, ${read} of ${blocks.length} sections read`);
  }
}

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
  }

  const fileLink = files?.querySelector<HTMLElement>('a[aria-current="true"]');
  if (fileLink && filesInd && files) {
    const f = fileLink.getBoundingClientRect();
    const s = files.getBoundingClientRect();
    const y = f.top - s.top;
    filesInd.style.transform = `translateY(${y}px) scaleY(${f.height})`;
  }
}

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
  const readLine = viewport * 0.85; // a section counts as read once its top passes this

  let index = -1;
  let read = 0;

  // A prompt pinned under the bar is current, and it wins outright: that is the
  // section whose answer you are reading.
  turns.forEach((turn, i) => {
    const r = turn.getBoundingClientRect();
    // The section has to *cover* the line: past a section's end the space before
    // the next one belongs to nobody, and the last section that merely ended is
    // not what is on screen.
    if (r.top <= line && r.bottom > line) index = i;
  });

  blocks.forEach((block) => {
    if (block.getBoundingClientRect().top <= readLine) read += 1;
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

  if (read > maxRead) {
    maxRead = read;
    paintMeter(maxRead);
  }
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
  const atEnd = y + window.innerHeight >= document.documentElement.scrollHeight - 4;

  if (atTop || atEnd || y < lastY - 4) dock.classList.remove('is-compact');
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
paintMeter(0);
update();

export {};
