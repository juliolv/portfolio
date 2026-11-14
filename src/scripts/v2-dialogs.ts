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
/** The theme table, from the same payload the boot script reads. */
const THEME_DATA = JSON.parse(
  (document.getElementById('v2-theme-data')?.textContent ?? '{"themes":[],"legacy":{},"fallback":"custom"}')
);
const THEME_IDS: string[] = THEME_DATA.themes ?? [];
const FALLBACK: string = THEME_DATA.fallback ?? 'custom';
const msg = document.getElementById('st-msg');
/** The picker's own radiogroup. Scoped: the design-system view renders a second
 *  set of skin cards, and focusing or arrow-stepping through those (hidden, and
 *  inside an inert subtree while a dialog is open) silently does nothing. */
const pickerCards = [...document.querySelectorAll<HTMLElement>('.dialog[data-dlg="theme"] [data-skin-pick]')];
/** Every card that mirrors the active skin, including the design-system view. */
const allCards = [...document.querySelectorAll<HTMLElement>('[data-skin-pick]')];
const HOVER_OK = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

let opener: HTMLElement | null = null;
/** First paint sets the skin from storage; only later changes cross-fade. */
let booted = false;
/** What is saved. Not what is on screen — arrows preview without saving. */
let committed = FALLBACK;
/** What is on screen right now. */
let previewing = FALLBACK;

/* ---------------------------------------------------------------- helpers -- */

function skinName(id: string): string {
  const card = allCards.find((c) => c.dataset.skinPick === id);
  if (!card) return id;
  const es = document.documentElement.dataset.lang === 'es';
  return (es ? card.dataset.skinNameEs : card.dataset.skinName) ?? id;
}

function savedChoice(): string {
  try {
    const stored = localStorage.getItem(SKIN_KEY);
    // Includes the old nine-skin ids: a returning visitor keeps the nearest
    // theme instead of landing on an id with no tokens behind it.
    if (stored && THEME_IDS.includes(stored)) return stored;
    if (stored && THEME_DATA.legacy && THEME_DATA.legacy[stored]) return THEME_DATA.legacy[stored];
  } catch {
    /* storage blocked: the default stands */
  }
  return FALLBACK;
}

/** Paint a choice: tokens, checked card, roving tabindex, label, current mark. */
function paint(id: string, announce = false) {
  // Theme only: the light/dark palette is a media query in tokens.css, so there
  // is no mode to set here and nothing to keep in sync with the OS.
  document.documentElement.dataset.skin = id;
  previewing = id;

  allCards.forEach((card) => {
    const on = card.dataset.skinPick === id;
    if (pickerCards.includes(card)) {
      // The picker is a radiogroup: one checked card, one tab stop.
      card.setAttribute('aria-checked', String(on));
      card.tabIndex = on ? 0 : -1;
    } else {
      // The design-system view mirrors the skin as plain buttons, so every card
      // stays reachable by Tab and the state is pressed, not checked.
      card.setAttribute('aria-pressed', String(on));
    }
    const mark = card.querySelector<HTMLElement>('.skin-card__cur');
    if (mark) mark.hidden = !on;
  });

  const label = document.querySelector<HTMLElement>('.skinbtn__label');
  if (label) label.textContent = skinName(id);
  if (announce && msg) msg.textContent = `theme: ${skinName(id)}`;
  if (booted) window.dispatchEvent(new CustomEvent('tui:skin', { detail: id }));
}

/** Apply and persist. The mode still follows the OS whatever is stored. */
function save(id: string) {
  try {
    localStorage.setItem(SKIN_KEY, id);
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

  // Focus on the next frame: a dialog opened by Enter or Space is still inside
  // the activating element's click, and the browser's own focus-on-activation
  // lands after this handler — which would leave focus on <body> and make the
  // arrows do nothing.
  requestAnimationFrame(() => {
    const panel = dialog.querySelector<HTMLElement>('.dialog__panel')!;
    const target =
      name === 'palette'
        ? panel.querySelector<HTMLElement>('#pal-input')
        : name === 'theme'
          ? pickerCards.find((card) => card.dataset.skinPick === committed)
          : focusables(panel)[0];

    target?.focus();

    // Other modules own what goes inside a dialog (the palette builds its list),
    // so they get a hook after focus has landed.
    window.dispatchEvent(new CustomEvent('tui:dialog-opened', { detail: name }));
  });
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
  return (from + delta + pickerCards.length) % pickerCards.length;
}

/** Arrow movement: one across, one column down, wrapping at both ends. */
function neighbour(current: string, key: string): string | null {
  const index = pickerCards.findIndex((card) => card.dataset.skinPick === current);
  if (index < 0) return null;

  const columns = new Set(pickerCards.map((card) => Math.round(card.offsetLeft))).size || 1;

  switch (key) {
    case 'ArrowRight':
      return pickerCards[step(index, 1)].dataset.skinPick!;
    case 'ArrowLeft':
      return pickerCards[step(index, -1)].dataset.skinPick!;
    case 'ArrowDown': {
      const next = index + columns;
      return pickerCards[next]?.dataset.skinPick ?? pickerCards[index].dataset.skinPick!;
    }
    case 'ArrowUp': {
      const next = index - columns;
      return pickerCards[next]?.dataset.skinPick ?? pickerCards[index].dataset.skinPick!;
    }
    case 'Home':
      return pickerCards[0].dataset.skinPick!;
    case 'End':
      return pickerCards[pickerCards.length - 1].dataset.skinPick!;
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
    if (isOpen()) return; // the palette is already the only thing on screen
    open('palette');
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
      pickerCards.find((card) => card.dataset.skinPick === next)?.focus();
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
  pickerCards.forEach((card) => {
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

window.addEventListener('tui:close-dialog', () => close());

// Picking a skin from the palette goes through the same save path as the picker.
window.addEventListener('tui:set-skin', (event) => {
  const id = (event as CustomEvent<string>).detail;
  if (id) save(id);
});

/* ------------------------------------------------------------ initial state -- */

committed = savedChoice();
paint(committed);
booted = true;

// A theme's palette follows the OS live; re-paint so the label and the "current"
// mark keep up with a mode switch (the colours are CSS and need no help).
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
  paint(savedChoice());
});

export {};
