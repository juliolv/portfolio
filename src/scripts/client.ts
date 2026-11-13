/* Client behavior, ported from the animation/interaction handoff.

   Ground rules kept here:
   - durations and easings come from CSS tokens, never literals;
   - reduced motion is read at the moment of each action, not once at load;
   - nothing is hidden waiting for an animation (reveal only touches elements
     that start below the fold).

   One deliberate deviation: the handoff's single-page view router (§7) is
   replaced by a real route, /design-system/. Same behaviour, real URL, and the
   spec page is indexable. */

type Theme = 'system' | 'light' | 'dark';
type Lang = 'en' | 'es';

interface Cmd {
  group: string;
  label: string;
  hint: string;
  run: () => void;
}

interface UiCopy {
  status: Record<string, string>;
  theme: Record<Theme, string>;
  palette: Record<string, string>;
}

const root = document.documentElement;
const KEY_THEME = 'pf.theme';
const KEY_LANG = 'pf.lang';
const PAD = 8;

const config = (() => {
  const el = document.getElementById('site-config');
  try {
    return JSON.parse(el?.textContent ?? '{}');
  } catch {
    return { site: { email: '', links: {} }, en: {}, es: {} };
  }
})();

const ui = { en: config.en as UiCopy, es: config.es as UiCopy };
const SITE = config.site as { email: string; links: Record<string, string>; base: string };
const BASE = (SITE.base || '/').replace(/\/$/, '');

const store = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage blocked: session-only state still works */
    }
  },
};

const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const copy = (key: string) => ui[state.lang]?.status?.[key] ?? key;

const state = {
  theme: (root.dataset.themePref as Theme) || 'system',
  lang: (root.dataset.lang as Lang) || 'en',
  section: 'top',
};

const nav = document.getElementById('nav');
const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav__link'));
const indicator = document.getElementById('nav-ind');
const sectionEls = Array.from(document.querySelectorAll<HTMLElement>('#top, main .section[id]')).filter(
  (el) => el.id
);

/* ---------------------------------------------------------------- theme -- */

let themeAnimTimer = 0;

function refreshThemeLabel() {
  const label = document.getElementById('sb-theme');
  if (label) label.textContent = ui[state.lang]?.theme?.[state.theme] ?? state.theme;
}

function syncSegmented(selector: string, current: string) {
  document.querySelectorAll<HTMLElement>(selector).forEach((group) => {
    group.querySelectorAll<HTMLElement>('.seg__opt').forEach((btn) => {
      const on = btn.dataset.value === current;
      btn.setAttribute('aria-checked', String(on));
      btn.tabIndex = on ? 0 : -1; // roving tabindex
    });
  });
}

function applyTheme(next: Theme, options: { persist?: boolean; animate?: boolean } = {}) {
  const { persist = true, animate = true } = options;
  const changed = state.theme !== next;
  state.theme = next;
  root.dataset.themePref = next;

  const crossfade = animate && changed && !prefersReduced();
  if (crossfade) {
    root.classList.add('theme-anim');
    void root.offsetHeight; // commit the class before colours change
  }

  if (next === 'system') delete root.dataset.theme;
  else root.dataset.theme = next;

  if (persist) store.set(KEY_THEME, next);

  if (crossfade) {
    window.clearTimeout(themeAnimTimer);
    themeAnimTimer = window.setTimeout(() => root.classList.remove('theme-anim'), 320);
  }

  syncSegmented('[data-seg="theme"]', next);
  refreshThemeLabel();
  document.dispatchEvent(new CustomEvent('pf:theme', { detail: { theme: next } }));
}

/* ----------------------------------------------------------------- lang -- */

function refreshStatusLang() {
  const label = document.getElementById('sb-lang');
  if (label) label.textContent = state.lang.toUpperCase();
}

/** Two-level lookup for the JS-authored strings that live in #site-config. */
function lookup(path: string): string {
  const [section, key] = path.split('.');
  const bag = ui[state.lang] as unknown as Record<string, Record<string, string>>;
  return bag?.[section]?.[key] ?? '';
}

function applyStrings() {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    if (el.querySelector('.bi')) return; // rendered as a bilingual pair; CSS decides
    const key = el.dataset.i18n;
    if (key) el.textContent = lookup(key);
  });

  document.querySelectorAll<HTMLElement>('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr?.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':');
      if (attr && key) el.setAttribute(attr.trim(), lookup(key.trim()));
    });
  });
}

function applyLang(next: Lang, options: { persist?: boolean } = {}) {
  const { persist = true } = options;
  if (state.lang === next) return;

  state.lang = next;
  root.dataset.lang = next;
  root.lang = next;
  if (persist) store.set(KEY_LANG, next);

  syncSegmented('[data-seg="lang"]', next);
  refreshStatusLang();
  refreshThemeLabel();
  applyStrings();
  fillRole(roleText()); // translated string at once — never retypes
  updateIndicator();
  document.dispatchEvent(new CustomEvent('pf:lang', { detail: { lang: next } }));
}

/* ---------------------------------------------------------- typed line -- */

let typedTimer = 0;
let typedEl: HTMLElement | null = null;
let ghostEl: HTMLElement | null = null;
let roleEl: HTMLElement | null = null;

function roleText(): string {
  if (!roleEl) return '';
  return (state.lang === 'es' ? roleEl.dataset.roleEs : roleEl.dataset.roleEn) ?? '';
}

/** The ghost layer reserves the final width so typing cannot shift layout. */
function setGhost(text: string) {
  if (!ghostEl) return;
  const caret = ghostEl.querySelector('.caret');
  ghostEl.textContent = `› ${text}`;
  if (caret) ghostEl.append(caret);
}

function fillRole(text: string) {
  window.clearTimeout(typedTimer);
  typedTimer = 0;
  setGhost(text);
  if (typedEl) typedEl.textContent = text;
}

function setupTyped() {
  roleEl = document.querySelector('.hero__role');
  typedEl = document.getElementById('typed');
  ghostEl = document.querySelector('.hero__ghost');
  if (!roleEl || !typedEl || !ghostEl) return;

  const full = roleText();
  setGhost(full);

  if (prefersReduced()) {
    typedEl.textContent = full; // caret stays visible, not blinking (CSS)
    return;
  }

  typedEl.textContent = '';
  let i = 0;
  const step = () => {
    i += 1;
    typedEl!.textContent = full.slice(0, i);
    if (i < full.length) typedTimer = window.setTimeout(step, 26 + Math.random() * 30);
  };
  typedTimer = window.setTimeout(step, 120);
}

/* ------------------------------------------------------------- reveal -- */

function setupReveal() {
  if (prefersReduced() || !('IntersectionObserver' in window)) return;

  // Only elements that start below the fold are ever hidden.
  const below = Array.from(document.querySelectorAll<HTMLElement>('.reveal')).filter(
    (el) => el.getBoundingClientRect().top > window.innerHeight
  );
  if (!below.length) return;

  below.forEach((el) => el.classList.add('is-pending'));

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('is-pending');
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px' }
  );

  below.forEach((el) => io.observe(el));
}

/* ----------------------------------------------- sections and indicator -- */

function updateIndicator() {
  const link = navLinks.find((l) => l.dataset.nav === state.section);

  if (!indicator || !link || state.section === 'top') {
    if (indicator) indicator.style.transform = 'scaleX(0)'; // collapses at the top
    return;
  }

  // The bar is 1px wide and scaled, so only transform animates.
  const width = Math.max(link.offsetWidth - PAD * 2, 1);
  indicator.style.width = '1px';
  indicator.style.transform = `translateX(${link.offsetLeft + PAD}px) scaleX(${width})`;

  if (nav && nav.scrollWidth > nav.clientWidth + 1) {
    const target = link.offsetLeft + link.offsetWidth / 2 - nav.clientWidth / 2;
    nav.scrollTo({ left: Math.max(target, 0), behavior: prefersReduced() ? 'auto' : 'smooth' });
  }
}

function markActive(id: string) {
  navLinks.forEach((link) => {
    if (link.dataset.nav === id) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });

  const crumb = document.getElementById('crumb');
  if (crumb) crumb.textContent = id && id !== 'top' ? `/${id}` : '';

  const path = document.getElementById('sb-path');
  if (path) path.textContent = id && id !== 'top' ? `~/julio/${id}` : '~/julio';

  updateIndicator();
}

function computeSection(): string {
  const line = window.innerHeight * 0.38;
  let active = 'top';
  for (const el of sectionEls) {
    if (el.getBoundingClientRect().top <= line) active = el.id;
  }
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (window.scrollY >= max - 2) active = 'contact'; // a short last section may never reach the line
  return active;
}

function updatePercent() {
  const pct = document.getElementById('sb-pct');
  if (!pct) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const value = max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0;
  pct.textContent = `${value}%`;
}

let raf = 0;

function onScroll() {
  if (raf) return;
  raf = window.requestAnimationFrame(() => {
    raf = 0;
    if (!root.dataset.active) {
      const active = computeSection();
      if (active !== state.section) {
        state.section = active;
        markActive(active);
      }
    }
    updatePercent();
  });
}

/* --------------------------------------------------------- status bar -- */

let messageTimer = 0;

function say(key: string, extra = '') {
  const msg = document.getElementById('sb-msg');
  if (!msg) return;
  msg.textContent = extra || copy(key);
  window.clearTimeout(messageTimer);
  messageTimer = window.setTimeout(() => {
    msg.textContent = copy('ready');
  }, 3200);
}

/* ----------------------------------------------------------- copy email -- */

async function copyEmail() {
  const address = SITE.email || document.getElementById('email-text')?.textContent?.trim() || '';
  try {
    await navigator.clipboard.writeText(address);
    say('copied', `${copy('copied')} ${address}`);
  } catch {
    // Fall back to selecting the visible address so the user can copy it by hand.
    const visible = document.getElementById('email-text');
    if (visible) {
      const range = document.createRange();
      range.selectNodeContents(visible);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    say('copyFailed');
  }
}

function openExternal(url: string) {
  if (!url) return;
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.append(a);
  a.click();
  a.remove();
}

function goTo(hash: string) {
  const el = document.querySelector(hash);
  if (!el) return;
  el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' });
  if (window.location.hash !== hash) history.replaceState(null, '', hash);
}

/* ------------------------------------------------------------- palette -- */

function navLabel(id: string): string {
  const link = navLinks.find((l) => l.dataset.nav === id);
  if (!link) return id;
  const span = link.querySelector<HTMLElement>(`.bi--${state.lang}`) ?? link;
  return (span.textContent ?? id).trim();
}

function paletteCommands(): Cmd[] {
  const p = ui[state.lang].palette;
  const links = SITE.links;
  const strip = (url: string) => (url ?? '').replace(/^https?:\/\//, '');
  const list: Cmd[] = [];

  list.push({ group: p.gGo, label: p.top, hint: '#top', run: () => goTo('#top') });
  ['work', 'devlog', 'experience', 'stack', 'about', 'contact'].forEach((id) => {
    list.push({ group: p.gGo, label: navLabel(id), hint: `#${id}`, run: () => goTo(`#${id}`) });
  });
  list.push({
    group: p.gGo,
    label: navLabel('design-system'),
    hint: '/design-system/',
    run: () => {
      window.location.href = `${BASE}/design-system/`;
    },
  });

  (['system', 'light', 'dark'] as Theme[]).forEach((theme) => {
    list.push({
      group: p.gTheme,
      label: ui[state.lang].theme[theme],
      hint: state.theme === theme ? '●' : '',
      run: () => applyTheme(theme),
    });
  });

  list.push({ group: p.gLang, label: p.langEn, hint: state.lang === 'en' ? '●' : '', run: () => applyLang('en') });
  list.push({ group: p.gLang, label: p.langEs, hint: state.lang === 'es' ? '●' : '', run: () => applyLang('es') });

  list.push({
    group: p.gLinks,
    label: `${p.openLink}GitHub`,
    hint: strip(links.github),
    run: () => openExternal(links.github),
  });
  list.push({
    group: p.gLinks,
    label: `${p.openLink}LinkedIn`,
    hint: strip(links.linkedin),
    run: () => openExternal(links.linkedin),
  });
  list.push({ group: p.gLinks, label: p.repo, hint: strip(links.repo), run: () => openExternal(links.repo) });
  list.push({ group: p.gLinks, label: p.cv, hint: strip(links.cv), run: () => openExternal(links.cv) });

  list.push({ group: p.gActions, label: p.copyEmail, hint: '', run: () => void copyEmail() });

  return list;
}

function setupPalette() {
  const palette = document.getElementById('palette');
  const input = document.getElementById('palette-input') as HTMLInputElement | null;
  const list = document.getElementById('palette-list');
  if (!palette || !input || !list) return;

  let commands: Cmd[] = [];
  let filtered: Cmd[] = [];
  let cursor = 0;
  let returnFocus: HTMLElement | null = null;

  function syncSelection() {
    const options = list!.querySelectorAll<HTMLElement>('.palette__opt');
    options.forEach((option, i) => {
      option.setAttribute('aria-selected', String(i === cursor));
      if (i === cursor) {
        input!.setAttribute('aria-activedescendant', option.id);
        option.scrollIntoView({ block: 'nearest' });
      }
    });
    if (!options.length) input!.removeAttribute('aria-activedescendant');
  }

  function render() {
    list!.innerHTML = '';
    input!.setAttribute('aria-expanded', 'true');

    if (!filtered.length) {
      const empty = document.createElement('li');
      empty.className = 'palette__empty';
      empty.setAttribute('role', 'presentation');
      empty.textContent = ui[state.lang].palette.empty;
      list!.append(empty);
      input!.removeAttribute('aria-activedescendant');
      return;
    }

    let group = '';
    filtered.forEach((cmd, i) => {
      if (cmd.group !== group) {
        group = cmd.group;
        const heading = document.createElement('li');
        heading.className = 'palette__group';
        heading.setAttribute('role', 'presentation');
        heading.textContent = group;
        list!.append(heading);
      }

      const option = document.createElement('li');
      option.className = 'palette__opt';
      option.id = `pal-opt-${i}`;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', String(i === cursor));

      const label = document.createElement('span');
      label.textContent = cmd.label;
      option.append(label);

      if (cmd.hint) {
        const hint = document.createElement('small');
        hint.textContent = cmd.hint;
        option.append(hint);
      }

      option.addEventListener('mouseenter', () => {
        cursor = i;
        syncSelection();
      });
      option.addEventListener('click', () => run(i));
      list!.append(option);
    });

    syncSelection();
  }

  function filter(term: string) {
    const q = term.trim().toLowerCase();
    filtered = q
      ? commands.filter((c) => `${c.label} ${c.hint} ${c.group}`.toLowerCase().includes(q))
      : commands;
    cursor = 0; // typing resets the selection
    render();
  }

  function open() {
    returnFocus = document.activeElement as HTMLElement | null;
    commands = paletteCommands(); // rebuilt so labels follow the current language
    filtered = commands;
    cursor = 0;
    palette!.hidden = false;
    input!.value = '';
    render();
    input!.focus();
  }

  function close() {
    palette!.hidden = true;
    input!.blur();
    if (returnFocus?.isConnected) returnFocus.focus();
  }

  function run(index: number) {
    const cmd = filtered[index];
    if (!cmd) return;
    close();
    cmd.run();
  }

  input.addEventListener('input', () => filter(input.value));

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      cursor = filtered.length ? (cursor + 1) % filtered.length : 0;
      syncSelection();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      cursor = filtered.length ? (cursor - 1 + filtered.length) % filtered.length : 0;
      syncSelection();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      run(cursor);
    } else if (event.key === 'Tab') {
      event.preventDefault(); // focus stays in the field
    }
  });

  document.querySelectorAll<HTMLElement>('[data-palette-open]').forEach((btn) =>
    btn.addEventListener('click', open)
  );
  document.querySelectorAll<HTMLElement>('[data-palette-close]').forEach((el) =>
    el.addEventListener('click', close)
  );

  document.addEventListener('keydown', (event) => {
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    const modifier = isMac ? event.metaKey : event.ctrlKey;

    if (event.key.toLowerCase() === 'k' && modifier) {
      event.preventDefault();
      if (palette!.hidden) open();
      else close();
      return;
    }

    if (event.key === 'Escape' && !palette!.hidden) {
      event.preventDefault();
      close();
    }
  });
}

/* ------------------------------------------------------ segmented input -- */

function setupSegmented(selector: string, onSelect: (value: string) => void) {
  document.querySelectorAll<HTMLElement>(selector).forEach((group) => {
    const opts = Array.from(group.querySelectorAll<HTMLElement>('.seg__opt'));
    if (!opts.length) return;

    opts.forEach((btn) => btn.addEventListener('click', () => onSelect(btn.dataset.value!)));

    group.addEventListener('keydown', (event) => {
      const from = Math.max(opts.findIndex((b) => b.tabIndex === 0), 0);
      let next = from;

      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (from + 1) % opts.length;
      else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (from - 1 + opts.length) % opts.length;
      else return;

      event.preventDefault();
      opts[next].focus();
      onSelect(opts[next].dataset.value!); // selection follows focus
    });
  });
}

/* ---------------------------------------------------------------- boot -- */

/**
 * Each step is isolated: one failing behaviour must never take the rest of the
 * page with it. (The first version of this file lost scroll tracking and the
 * palette shortcut because a single step threw.)
 */
function step(name: string, run: () => void) {
  try {
    run();
  } catch (error) {
    console.error('[pf] step failed:', name, error);
  }
}

function boot() {
  step('state', () => {
    state.theme = (root.dataset.themePref as Theme) || 'system';
    state.lang = (root.dataset.lang as Lang) || 'en';

    syncSegmented('[data-seg="theme"]', state.theme);
    syncSegmented('[data-seg="lang"]', state.lang);
    refreshStatusLang();
    refreshThemeLabel();
    applyStrings();
  });

  step('active section', () => {
    const active = root.dataset.active || '';
    state.section = active || 'top';
    markActive(state.section);
  });

  step('status bar', () => {
    const ready = document.getElementById('sb-msg');
    if (ready) ready.textContent = copy('ready');
  });

  step('typed line', setupTyped);
  step('reveal', setupReveal);
  step('theme control', () => setupSegmented('[data-seg="theme"]', (value) => applyTheme(value as Theme)));
  step('language control', () => setupSegmented('[data-seg="lang"]', (value) => applyLang(value as Lang)));
  step('palette', setupPalette);

  step('copy email', () =>
    document.querySelectorAll<HTMLElement>('[data-copy-email]').forEach((btn) =>
      btn.addEventListener('click', () => void copyEmail())
    )
  );

  step('nav links', () =>
    navLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        const hash = link.hash; // '#work', independent of the deploy base
        if (!hash || hash !== window.location.hash) return;
        event.preventDefault();
        goTo(hash); // clicking the current section re-scrolls it
      });
    })
  );

  step('scroll tracking', () => {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('load', updateIndicator);
    document.fonts?.ready.then(updateIndicator);
    // A hidden tab can swallow the rAF callback; never leave the guard stuck.
    document.addEventListener('visibilitychange', () => {
      raf = 0;
      onScroll();
    });
    onScroll();
  });

  step('os scheme', () => {
    // While the preference is "system", follow the OS scheme.
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (state.theme === 'system') {
        document.dispatchEvent(new CustomEvent('pf:theme', { detail: { theme: 'system' } }));
      }
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

export {};
