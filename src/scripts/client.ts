/* Client behavior: theme, language, command palette, reveal, status bar.
   No framework, no hydration — one small module. */

type Theme = 'system' | 'light' | 'dark';
type Lang = 'en' | 'es';

const root = document.documentElement;
const store = {
  get<T extends string>(key: string, fallback: T): T {
    try {
      return (localStorage.getItem(key) as T) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private mode */
    }
  },
};

/* ---------------------------------------------------------------- theme -- */

function themeLabel(theme: Theme, lang: string): string {
  const labels: Record<Theme, [string, string]> = {
    system: ['system', 'sistema'],
    light: ['light', 'claro'],
    dark: ['dark', 'oscuro'],
  };
  return labels[theme][lang === 'es' ? 1 : 0];
}

function setTheme(theme: Theme, persist = true) {
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
  if (persist) store.set('theme', theme);

  document.querySelectorAll<HTMLElement>('[data-seg="theme"] .seg__opt').forEach((btn) => {
    btn.setAttribute('aria-checked', String(btn.dataset.value === theme));
  });

  const label = document.getElementById('sb-theme');
  if (label) label.textContent = themeLabel(theme, root.dataset.lang ?? 'en');
}

/* ----------------------------------------------------------------- lang -- */

function setLang(lang: Lang, persist = true) {
  root.dataset.lang = lang;
  root.lang = lang;
  if (persist) store.set('lang', lang);

  document.querySelectorAll<HTMLElement>('[data-seg="lang"] .seg__opt').forEach((btn) => {
    btn.setAttribute('aria-checked', String(btn.dataset.value === lang));
  });
  const label = document.getElementById('sb-lang');
  if (label) label.textContent = lang.toUpperCase();

  const themeOut = document.getElementById('sb-theme');
  if (themeOut) themeOut.textContent = themeLabel(store.get<Theme>('theme', 'system'), lang);

  // Keep the long-form date/labels that are rendered per language in sync.
  document.querySelectorAll<HTMLElement>('[data-lang-label]').forEach((el) => {
    const value = el.dataset[`lang${lang === 'es' ? 'Es' : 'En'}`];
    if (value) el.textContent = value;
  });
}

/* ------------------------------------------------------- nav indicator -- */

const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav__link'));
const indicator = document.getElementById('nav-ind');

function markActive(id: string) {
  let active: HTMLAnchorElement | undefined;
  navLinks.forEach((link) => {
    const on = link.dataset.nav === id;
    if (on) {
      link.setAttribute('aria-current', 'true');
      active = link;
    } else {
      link.removeAttribute('aria-current');
    }
  });

  if (indicator && active) {
    indicator.style.left = `${active.offsetLeft}px`;
    indicator.style.width = `${active.offsetWidth}px`;
    indicator.style.transform = 'scaleX(1)';
  } else if (indicator) {
    indicator.style.transform = 'scaleX(0)';
  }

  const crumb = document.getElementById('crumb');
  if (crumb) crumb.textContent = id && id !== 'top' ? `/${id}` : '';

  const path = document.getElementById('sb-path');
  if (path) path.textContent = id && id !== 'top' ? `~/julio/${id}` : '~/julio';
}

/* ------------------------------------------------------------- reveal -- */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

function setupReveal() {
  const targets = document.querySelectorAll<HTMLElement>('.reveal');
  if (reduced.matches || !('IntersectionObserver' in window)) return;

  targets.forEach((el) => el.classList.add('is-pending'));

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('is-pending');
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
  );

  targets.forEach((el) => io.observe(el));
}

/* ------------------------------------------------------- section watch -- */

function setupSectionWatch() {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('main .section[id], section.hero[id]'));
  if (!sections.length || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) markActive((visible.target as HTMLElement).id);
    },
    { rootMargin: '-20% 0px -55% 0px', threshold: [0.1, 0.5] }
  );

  sections.forEach((section) => io.observe(section));
}

/* --------------------------------------------------------- copy email -- */

function setupCopy() {
  document.querySelectorAll<HTMLElement>('[data-copy-email]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const address = document.getElementById('email-text')?.textContent?.trim() ?? '';
      const msg = document.getElementById('sb-msg');
      try {
        await navigator.clipboard.writeText(address);
        if (msg) msg.textContent = root.dataset.lang === 'es' ? 'copiado' : 'copied';
      } catch {
        if (msg) msg.textContent = root.dataset.lang === 'es' ? 'selecciona la dirección' : 'select the address';
      }
      window.setTimeout(() => {
        if (msg) msg.textContent = '';
      }, 2000);
    });
  });
}

/* -------------------------------------------------------------- palette -- */

type PaletteItem = { label: string; hint?: string; href: string };

function setupPalette() {
  const palette = document.getElementById('palette');
  const input = document.getElementById('palette-input') as HTMLInputElement | null;
  const list = document.getElementById('palette-list');
  if (!palette || !input || !list) return;

  const labelFor = (link: HTMLElement): string => {
    const lang = root.dataset.lang ?? 'en';
    const span = link.querySelector<HTMLElement>(`.bi--${lang}`) ?? link;
    return (span.textContent ?? '').trim();
  };

  const buildItems = (): PaletteItem[] =>
    navLinks.map((link) => ({
      label: labelFor(link),
      hint: (() => {
        const href = link.getAttribute('href') ?? '/';
        return href.startsWith('/#') ? `~/julio/${href.slice(2)}` : href;
      })(),
      href: link.getAttribute('href') ?? '/',
    }));

  let items: PaletteItem[] = buildItems();
  let filtered = items;
  let cursor = 0;

  function render() {
    list!.innerHTML = '';
    if (!filtered.length) {
      const empty = document.createElement('li');
      empty.className = 'palette__empty';
      empty.textContent = '—';
      list!.append(empty);
      return;
    }
    filtered.forEach((item, i) => {
      const li = document.createElement('li');
      li.className = 'palette__opt';
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === cursor));
      li.innerHTML = `${item.label}<small>${item.hint ?? ''}</small>`;
      li.addEventListener('mouseenter', () => {
        cursor = i;
        render();
      });
      li.addEventListener('click', () => go(item));
      list!.append(li);
    });
  }

  function go(item: PaletteItem) {
    close();
    window.location.href = item.href;
  }

  function open() {
    palette!.hidden = false;
    input!.value = '';
    items = buildItems();
    filtered = items;
    cursor = 0;
    render();
    window.setTimeout(() => input!.focus(), 0);
  }

  function close() {
    palette!.hidden = true;
    input!.blur();
  }

  function filter(term: string) {
    const q = term.trim().toLowerCase();
    filtered = q ? items.filter((i) => i.label.toLowerCase().includes(q)) : items;
    cursor = 0;
    render();
  }

  input.addEventListener('input', () => filter(input.value));

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      cursor = Math.min(cursor + 1, filtered.length - 1);
      render();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      cursor = Math.max(cursor - 1, 0);
      render();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = filtered[cursor];
      if (item) go(item);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  });

  document.querySelectorAll<HTMLElement>('[data-palette-open]').forEach((btn) =>
    btn.addEventListener('click', open)
  );
  document.querySelectorAll<HTMLElement>('[data-palette-close]').forEach((el) =>
    el.addEventListener('click', close)
  );

  document.addEventListener('keydown', (event) => {
    const isK = event.key.toLowerCase() === 'k';
    if (isK && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      palette!.hidden ? open() : close();
      return;
    }
    if (event.key === 'Escape' && !palette!.hidden) {
      event.preventDefault();
      close();
    }
  });
}

/* -------------------------------------------------------------- scroll -- */

function setupScrollMeter() {
  const pct = document.getElementById('sb-pct');
  if (!pct) return;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
    pct.textContent = `${value}%`;
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

/* ----------------------------------------------------------------- boot -- */

function boot() {
  setTheme(store.get<Theme>('theme', 'system'), false);
  setLang(store.get<Lang>('lang', 'en'), false);

  document.querySelectorAll<HTMLElement>('[data-seg="theme"] .seg__opt').forEach((btn) =>
    btn.addEventListener('click', () => setTheme(btn.dataset.value as Theme))
  );
  document.querySelectorAll<HTMLElement>('[data-seg="lang"] .seg__opt').forEach((btn) =>
    btn.addEventListener('click', () => setLang(btn.dataset.value as Lang))
  );

  const initial = root.dataset.active || 'top';
  markActive(initial === 'design-system' ? 'design-system' : initial);
  setupReveal();
  if (!root.dataset.active) setupSectionWatch();
  setupCopy();
  setupPalette();
  setupScrollMeter();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
