/**
 * v2 dialogs: theme picker, shortcuts, help (§5.2 of the handoff).
 *
 * The markup is rendered at build time (the skin list comes from
 * src/data/skins.ts); this module only opens, closes, traps focus, applies the
 * chosen skin and persists it.
 */

const DIALOGS = document.querySelectorAll<HTMLElement>('.dialog');
const APP = document.querySelector<HTMLElement>('.app');
const SKIN_KEY = 'tui.skin';
const msg = document.getElementById('st-msg');

let opener: HTMLElement | null = null;

/* ---------------------------------------------------------------- helpers -- */

function skinName(id: string): string {
  return document.querySelector<HTMLElement>(`[data-skin-pick="${id}"]`)?.dataset.skinName ?? id;
}

function syncSkinControls(id: string) {
  document.querySelectorAll<HTMLElement>('[data-skin-pick]').forEach((card) => {
    card.setAttribute('aria-pressed', String(card.dataset.skinPick === id));
  });
  const label = document.querySelector<HTMLElement>('.skinbtn__label');
  if (label) label.textContent = skinName(id);
}

/** "system" is a choice, not a skin: it resolves to one and stores nothing. */
function systemSkin(): string {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'ayu-light' : 'ayu-dark';
}

function applySkin(id: string, announce = true) {
  const root = document.documentElement;
  root.dataset.skin = id === 'system' ? systemSkin() : id;
  try {
    if (id === 'system') localStorage.removeItem(SKIN_KEY);
    else localStorage.setItem(SKIN_KEY, id);
  } catch {
    /* private mode: the choice lives for this page only */
  }
  syncSkinControls(id);
  if (announce && msg) msg.textContent = `theme: ${skinName(id)}`;
}

/* ------------------------------------------------------------ open/close -- */

function focusables(panel: HTMLElement): HTMLElement[] {
  return [...panel.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])')].filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
  );
}

function open(name: string, from?: HTMLElement) {
  const dialog = document.querySelector<HTMLElement>(`.dialog[data-dlg="${name}"]`);
  if (!dialog) return;
  opener = from ?? (document.activeElement as HTMLElement);
  dialog.hidden = false;
  if (APP) APP.inert = true;
  document.body.classList.add('dlg-open');

  const panel = dialog.querySelector<HTMLElement>('.dialog__panel')!;

  if (name === 'theme') {
    const current = document.documentElement.dataset.skin ?? '';
    dialog.querySelector<HTMLElement>(`[data-skin-pick="${current}"]`)?.focus();
  } else {
    focusables(panel)[0]?.focus();
  }

  if (name === 'theme') panel.dataset.opened = 'theme';
}

function close() {
  const open = document.querySelector<HTMLElement>('.dialog:not([hidden])');
  if (!open) return;
  open.hidden = true;
  if (APP) APP.inert = false;
  document.body.classList.remove('dlg-open');
  opener?.focus({ preventScroll: true });
  opener = null;
}

function isOpen(): boolean {
  return !!document.querySelector('.dialog:not([hidden])');
}

/* ---------------------------------------------------------------- events -- */

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;

  const trigger = target.closest<HTMLElement>('[data-open-dlg]');
  if (trigger) {
    event.preventDefault();
    open(trigger.dataset.openDlg!, trigger);
    return;
  }

  if (target.closest('[data-dlg-close]')) {
    event.preventDefault();
    close();
    return;
  }

  // clicking the backdrop (but not the panel) closes
  const dialog = target.classList.contains('dialog') ? target : null;
  if (dialog) close();
});

document.addEventListener('click', (event) => {
  const card = (event.target as HTMLElement).closest<HTMLElement>('[data-skin-pick]');
  if (!card) return;
  applySkin(card.dataset.skinPick!);
});

document.addEventListener('keydown', (event) => {
  // Ctrl/⌘ K focuses the prompt: the palette in v1, the prompt itself here
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    const input = document.getElementById('cmd');
    input?.focus();
    return;
  }

  if (event.key === '?' && !isOpen()) {
    const tag = (document.activeElement as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    event.preventDefault();
    open('keys');
    return;
  }

  if (!isOpen()) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    close();
    return;
  }

  // keep Tab inside the open panel
  const panel = document.querySelector<HTMLElement>('.dialog:not([hidden]) .dialog__panel');
  if (!panel || event.key !== 'Tab') return;
  const items = focusables(panel);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

// the prompt asks for a dialog by name
window.addEventListener('tui:open-dialog', (event) => {
  const name = (event as CustomEvent<string>).detail;
  if (name) open(name);
});

/* ------------------------------------------------------------ initial state -- */

let stored: string | null = null;
try {
  stored = localStorage.getItem(SKIN_KEY);
} catch {
  /* storage blocked: stay on the system choice */
}
const known = !!stored && !!document.querySelector(`[data-skin-pick="${stored}"]`);
applySkin(known ? stored! : 'system', false);

// When the choice is "system", follow the OS live instead of going stale.
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
  let choice: string | null = null;
  try {
    choice = localStorage.getItem(SKIN_KEY);
  } catch {
    choice = null;
  }
  if (!choice) {
    document.documentElement.dataset.skin = systemSkin();
    syncSkinControls('system');
  }
});

export {};
