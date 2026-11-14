/**
 * v2 dialogs: theme picker, shortcuts, help (§5.2 of the handoff).
 *
 * Theme picker semantics, per the handoff:
 *   arrows / Home / End / hover  → preview instantly, nothing saved
 *   Enter or click               → apply and save
 *   Esc or the backdrop          → revert to what was saved when it opened
 *
 * The list is a radiogroup with roving tabindex: Tab enters on the current
 * choice, arrows move within the group, and only one card is in the tab order.
 */

const APP = document.querySelector<HTMLElement>('.app');
const SKIN_KEY = 'tui.skin';
const msg = document.getElementById('st-msg');
const cards = [...document.querySelectorAll<HTMLElement>('[data-skin-pick]')];
const HOVER_OK = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

let opener: HTMLElement | null = null;
/** What is saved. Not what is on screen — arrows preview without saving. */
let committed = 'system';
/** What is on screen right now. */
let previewing = 'system';

/* ---------------------------------------------------------------- helpers -- */

function systemSkin(): string {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'ayu-light' : 'ayu-dark';
}

function skinName(id: string): string {
  return cards.find((card) => card.dataset.skinPick === id)?.dataset.skinName ?? id;
}

function savedChoice(): string {
  try {
    const stored = localStorage.getItem(SKIN_KEY);
    if (stored && cards.some((card) => card.dataset.skinPick === stored)) return stored;
  } catch {
    /* storage blocked: the system choice stands */
  }
  return 'system';
}

/** Paint a choice: tokens, checked card, roving tabindex, label, current mark. */
function paint(id: string, announce = false) {
  document.documentElement.dataset.skin = id === 'system' ? systemSkin() : id;
  previewing = id;

  cards.forEach((card) => {
    const on = card.dataset.skinPick === id;
    card.setAttribute('aria-checked', String(on));
    card.tabIndex = on ? 0 : -1;
    const mark = card.querySelector<HTMLElement>('.skin-card__cur');
    if (mark) mark.hidden = !on;
  });

  const label = document.querySelector<HTMLElement>('.skinbtn__label');
  if (label) label.textContent = skinName(id);
  if (announce && msg) msg.textContent = `theme: ${skinName(id)}`;
}

/** Apply and persist. "system" stores nothing, which is how it follows the OS. */
function save(id: string) {
  try {
    if (id === 'system') localStorage.removeItem(SKIN_KEY);
    else localStorage.setItem(SKIN_KEY, id);
  } catch {
    /* private mode: the choice lasts for this page */
  }
  committed = id;
  paint(id, true);
}

/* ------------------------------------------------------------ open/close -- */

function focusables(panel: HTMLElement): HTMLElement[] {
  return [...panel.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]')].filter(
    // tabIndex mirrors the roving tabindex: the nine unselected cards are -1 and
    // must not count as focusable, or Tab escapes the panel.
    (el) => el.tabIndex >= 0 && !el.hasAttribute('disabled') && el.offsetParent !== null
  );
}

function open(name: string, from?: HTMLElement) {
  const dialog = document.querySelector<HTMLElement>(`.dialog[data-dlg="${name}"]`);
  if (!dialog) return;
  opener = from ?? (document.activeElement as HTMLElement);

  if (name === 'theme') {
    committed = savedChoice(); // remember what to revert to
    paint(committed);
  }

  dialog.hidden = false;
  if (APP) APP.inert = true;
  document.body.classList.add('dlg-open');

  if (name === 'theme') {
    cards.find((card) => card.dataset.skinPick === committed)?.focus();
  } else {
    focusables(dialog.querySelector<HTMLElement>('.dialog__panel')!)[0]?.focus();
  }
}

function close() {
  const dialog = document.querySelector<HTMLElement>('.dialog:not([hidden])');
  if (!dialog) return;
  dialog.hidden = true;
  if (APP) APP.inert = false;
  document.body.classList.remove('dlg-open');
  opener?.focus({ preventScroll: true });
  opener = null;
}

/** Esc, the close button and the backdrop: undo any preview, then close. */
function dismiss() {
  if (document.querySelector('.dialog[data-dlg="theme"]:not([hidden])')) paint(committed);
  close();
}

function isOpen(): boolean {
  return !!document.querySelector('.dialog:not([hidden])');
}

/* --------------------------------------------------------------- picking -- */

function step(from: number, delta: number): number {
  return (from + delta + cards.length) % cards.length;
}

/** Arrow movement: one across, one column down, wrapping at both ends. */
function neighbour(current: string, key: string): string | null {
  const index = cards.findIndex((card) => card.dataset.skinPick === current);
  if (index < 0) return null;

  const columns = new Set(cards.map((card) => Math.round(card.offsetLeft))).size || 1;

  switch (key) {
    case 'ArrowRight':
      return cards[step(index, 1)].dataset.skinPick!;
    case 'ArrowLeft':
      return cards[step(index, -1)].dataset.skinPick!;
    case 'ArrowDown': {
      const next = index + columns;
      return cards[next]?.dataset.skinPick ?? cards[index].dataset.skinPick!;
    }
    case 'ArrowUp': {
      const next = index - columns;
      return cards[next]?.dataset.skinPick ?? cards[index].dataset.skinPick!;
    }
    case 'Home':
      return cards[0].dataset.skinPick!;
    case 'End':
      return cards[cards.length - 1].dataset.skinPick!;
    default:
      return null;
  }
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

  // pick first: a card sits inside the theme dialog, not inside a closer
  const card = target.closest<HTMLElement>('[data-skin-pick]');
  if (card) {
    save(card.dataset.skinPick!);
    close();
    return;
  }

  if (target.closest('[data-dlg-close]')) {
    event.preventDefault();
    dismiss();
    return;
  }

  if (target.classList.contains('dialog')) dismiss();
});

document.addEventListener('keydown', (event) => {
  // Ctrl/⌘ K focuses the prompt: the palette in v1, the prompt itself here
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (isOpen()) return; // focus stays in the dialog; its trap owns the keyboard
    document.getElementById('cmd')?.focus();
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
    dismiss();
    return;
  }

  // arrows / Home / End inside the picker preview without saving
  const onCard = (document.activeElement as HTMLElement)?.dataset?.skinPick;
  if (onCard) {
    // Enter or Space applies the preview and saves it. Handled here rather than
    // relying on a button's native click, so the behaviour is explicit and works
    // for role="radio" in every browser.
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      save(onCard);
      close();
      return;
    }

    const next = neighbour(onCard, event.key);
    if (next) {
      event.preventDefault();
      paint(next);
      cards.find((card) => card.dataset.skinPick === next)?.focus();
      return;
    }
  }

  if (event.key !== 'Tab') return;
  const panel = document.querySelector<HTMLElement>('.dialog:not([hidden]) .dialog__panel');
  if (!panel) return;
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

// Hover previews too, but only where hovering is real (not on touch).
if (HOVER_OK) {
  cards.forEach((card) => {
    card.addEventListener('pointerenter', () => {
      if (document.querySelector('.dialog[data-dlg="theme"]:not([hidden])')) {
        paint(card.dataset.skinPick!);
      }
    });
  });
}

window.addEventListener('tui:open-dialog', (event) => {
  const name = (event as CustomEvent<string>).detail;
  if (name) open(name);
});

/* ------------------------------------------------------------ initial state -- */

committed = savedChoice();
paint(committed);

// While the choice is "system", follow the OS live instead of going stale.
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
  if (savedChoice() === 'system') paint('system');
});

export {};
