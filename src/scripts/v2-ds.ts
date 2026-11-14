/**
 * Design-system view (§10): hash routing, tabs, and token values read live
 * from the page.
 *
 * Nothing here knows a colour. Every swatch, size and duration comes from
 * getComputedStyle on :root, so switching skin updates the whole view and the
 * page cannot document tokens it no longer uses.
 */

const root = document.documentElement;
const view = document.getElementById('view-system');
const site = document.getElementById('view-site');

const read = (name: string) => getComputedStyle(root).getPropertyValue(name).trim();

/* ------------------------------------------------------------------- tabs -- */

const tabs = [...document.querySelectorAll<HTMLButtonElement>('#view-system .tab')];

function selectTab(index: number, focus = true) {
  tabs.forEach((tab, i) => {
    const on = i === index;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    const panel = document.getElementById(tab.getAttribute('aria-controls') ?? '');
    if (panel) panel.hidden = !on;
  });
  if (focus) tabs[index]?.focus();
}

tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(i, false));
  tab.addEventListener('keydown', (event) => {
    const keys: Record<string, number> = {
      ArrowRight: (i + 1) % tabs.length,
      ArrowLeft: (i - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    const next = keys[event.key];
    if (next === undefined) return;
    event.preventDefault();
    selectTab(next);
  });
});

/* ---------------------------------------------------------------- tokens --- */

const COLORS = [
  'bg', 'panel', 'element', 'border', 'border-strong', 'text', 'muted',
  'accent', 'accent-fg', 'accent-subtle', 'select', 'ok', 'warn', 'danger',
];

const TYPE = ['--fs-1', '--fs-2', '--fs-3', '--fs-4', '--fs-5', '--fs-6', '--fs-7'];
const SPACE = ['--sp-1', '--sp-2', '--sp-3', '--sp-4', '--sp-5', '--sp-6', '--sp-7', '--sp-8'];
const MOTION = ['--dur-fast', '--dur-base', '--dur-slow', '--ease-out', '--ease-in-out'];
const LAYERS = ['--z-bar', '--z-dock', '--z-menu', '--z-dialog', '--z-tip'];

function fillSwatches() {
  const host = document.querySelector('[data-ds="swatches"]');
  if (!host) return;
  host.innerHTML = COLORS.map((name) => `
    <div class="swatch">
      <div class="swatch__chip" style="background:var(--${name})"></div>
      <div class="swatch__meta">--${name}<span>${read(`--${name}`)}</span></div>
    </div>`).join('');
}

function fillType() {
  const host = document.querySelector('[data-ds="type"]');
  if (!host) return;
  host.innerHTML = TYPE.map((name) => `
    <div class="row2">
      <code>${name}<br><span class="muted">${read(name)}</span></code>
      <span class="row2__sample" style="font-size:var(${name});line-height:1.2">Aa 0123</span>
    </div>`).join('');
}

function fillSpace() {
  const host = document.querySelector('[data-ds="space"]');
  if (!host) return;
  host.innerHTML = SPACE.map((name) => {
    const value = read(name);
    return `
      <div class="row2">
        <code>${name}<br><span class="muted">${value}</span></code>
        <span class="row2__bar" style="width:${value}"></span>
      </div>`;
  }).join('');
}

function fillShape() {
  const host = document.querySelector('[data-ds="shape"]');
  if (!host) return;
  const shapes = ['--r-0', '--r-1', '--r-box'];
  host.innerHTML = shapes
    .map((name) => `<span class="shape" style="border-radius:var(${name})">${name}</span>`)
    .join('') +
    ['--bw', '--bw-2']
      .map((name) => `<span class="shape" style="border-width:var(${name});border-color:var(--accent)">${name}</span>`)
      .join('');
}

function fillMotion() {
  const host = document.querySelector('[data-ds="motion"]');
  if (!host) return;
  host.innerHTML = MOTION.map((name) => `
    <button class="row2" type="button" data-play="${name}">
      <code>${name}<br><span class="muted">${read(name)}</span></code>
      <span class="track"><i></i></span>
    </button>`).join('');

  host.querySelectorAll<HTMLElement>('[data-play]').forEach((row) => {
    row.addEventListener('click', () => {
      row.classList.toggle('is-on');
      window.setTimeout(() => row.classList.remove('is-on'), 1200);
    });
  });
}

function fillLayers() {
  const host = document.querySelector('[data-ds="layers"]');
  if (!host) return;
  host.innerHTML = LAYERS.map((name) => `
    <div class="row2">
      <code>${name}</code>
      <span>${read(name)}</span>
    </div>`).join('');
}

function fillAll() {
  fillSwatches();
  fillType();
  fillSpace();
  fillShape();
  fillMotion();
  fillLayers();
}

fillAll();
window.addEventListener('tui:skin', fillAll);

/* --------------------------------------------------------------- routing --- */

function route() {
  const on = location.hash === '#design-system';
  if (site) site.hidden = on;
  if (view) view.hidden = !on;
  if (on) {
    fillAll(); // the skin may have changed since the last visit
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    // Focus the heading, not the tab: a route change should announce the view,
    // and focusing a tab draws a ring nobody asked for.
    document.getElementById('ds-title')?.focus({ preventScroll: true });
  }
}

window.addEventListener('hashchange', route);
route();

export {};
