/* Design-system page behavior: tabs, motion demos, live token values.
   Loaded only on /design-system/. */

const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ tabs -- */

function setupTabs() {
  const list = document.querySelector<HTMLElement>('.tabs[role="tablist"]');
  if (!list) return;

  const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls') ?? ''));

  function select(index: number, focus = true) {
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      const panel = panels[i];
      if (panel) panel.hidden = !on;
    });
    if (focus) tabs[index]?.focus();
  }

  tabs.forEach((tab, i) => tab.addEventListener('click', () => select(i, false)));

  list.addEventListener('keydown', (event) => {
    const current = Math.max(tabs.findIndex((tab) => tab.tabIndex === 0), 0);
    let next = current;

    if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;

    event.preventDefault();
    select(next); // arrow keys move and activate
  });
}

/* --------------------------------------------------------- motion demos -- */

function setupMotionRows() {
  document.querySelectorAll<HTMLButtonElement>('.motion-row').forEach((row) => {
    row.addEventListener('click', () => {
      const on = row.classList.toggle('is-on');
      row.setAttribute('aria-pressed', String(on));
    });
  });
}

/* ------------------------------------------------------- live token values -- */

function refreshSwatches() {
  const computed = getComputedStyle(document.documentElement);

  document.querySelectorAll<HTMLElement>('[data-hex]').forEach((el) => {
    const value = computed.getPropertyValue(`--${el.dataset.hex}`).trim();
    if (value) el.textContent = value;
  });

  // The dark column is only meaningful as documentation of the other theme.
  document.querySelectorAll<HTMLElement>('[data-hex-dark]').forEach((el) => {
    el.hidden = document.documentElement.dataset.theme === 'dark';
  });
}

function boot() {
  setupTabs();
  setupMotionRows();
  refreshSwatches();

  document.addEventListener('pf:theme', refreshSwatches);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', refreshSwatches);
  if (!prefersReduced()) document.fonts?.ready.then(refreshSwatches);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

export {};
