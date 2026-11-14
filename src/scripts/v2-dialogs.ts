/**
 * v2 dialogs: theme picker, shortcuts, help (§5.2 of the handoff).
 *
 * Theme picker semantics, per the handoff:
 *   arrows / Home / End / hover  → preview instantly, nothing saved
 *   Enter or click               → apply and save
 *   Esc or the backdrop          → revert to what was saved when it opened
 *
 * A choice is a theme AND a variant: every theme ships a dark and a light
 * palette and both are offered side by side. `mode` is null when the reader has
 * not chosen one, which is the state that follows the OS — that is the only
 * thing prefers-color-scheme decides. Once a variant is picked, `data-mode` says
 * so and the media query no longer has a say.
 *
 * The list is a radiogroup with roving tabindex: Tab enters on the current
 * choice, arrows move within the group, and only one card is in the tab order.
 */

const APP = document.querySelector<HTMLElement>('.app');
const SKIN_KEY = 'tui.skin';
const MODE_KEY = 'tui.mode';
/** The theme table, from the same payload the boot script reads. */
const THEME_DATA = JSON.parse(
  (document.getElementById('v2-theme-data')?.textContent ?? '{"themes":[],"legacy":{},"fallback":"custom"}')
);
const THEME_IDS: string[] = THEME_DATA.themes ?? [];
const FALLBACK: string = THEME_DATA.fallback ?? 'custom';
const msg = document.getElementById('st-msg');
/** The picker's own radiogroup. Scoped: the design-system view renders a second
 *  set of cards, and focusing or arrow-stepping through those (hidden, and
 *  inside an inert subtree while a dialog is open) silently does nothing. */
const pickerCards = [...document.querySelectorAll<HTMLElement>('.dialog[data-dlg="theme"] [data-skin-pick]')];
/** Every card that mirrors the active choice, including the design-system view. */
const allCards = [...document.querySelectorAll<HTMLElement>('[data-skin-pick]')];
const HOVER_OK = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const LIGHT = window.matchMedia('(prefers-color-scheme: light)');

type Mode = 'dark' | 'light';
interface Choice {
  id: string;
  /** null = no explicit choice, so the OS decides. */
  mode: Mode | null;
}

let opener: HTMLElement | null = null;
/** First paint sets the theme from storage; only later changes cross-fade. */
let booted = false;
/** What is saved. Not what is on screen — arrows preview without saving. */
let committed: Choice = { id: FALLBACK, mode: null };
/** What is on screen right now. */
let previewing: Choice = { id: FALLBACK, mode: null };

/* ---------------------------------------------------------------- helpers -- */

/** The variant actually on screen. Without a choice, the OS is the choice. */
function effectiveMode(choice: Choice): Mode {
  return choice.mode ?? (LIGHT.matches ? 'light' : 'dark');
}

function cardMode(card: HTMLElement): Mode {
  return card.dataset.modePick === 'light' ? 'light' : 'dark';
}

function choiceName(choice: Choice): string {
  const card = allCards.find((c) => c.dataset.skinPick === choice.id && cardMode(c) === effectiveMode(choice));
  const es = document.documentElement.dataset.lang === 'es';
  if (card) return (es ? card.dataset.skinNameEs : card.dataset.skinName) ?? choice.id;
  return choice.id;
}

function savedChoice(): Choice {
  const read = (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const stored = read(SKIN_KEY);
  const mode = read(MODE_KEY);
  // Includes the old nine-skin ids: a returning visitor keeps the nearest theme
  // instead of landing on an id with no tokens behind it.
  let id = FALLBACK;
  if (stored && THEME_IDS.includes(stored)) id = stored;
  else if (stored && THEME_DATA.legacy?.[stored]) id = THEME_DATA.legacy[stored];
  return { id, mode: mode === 'dark' || mode === 'light' ? mode : null };
}

/**
 * Paint a choice: tokens, checked card, roving tabindex, label, current mark.
 * `data-mode` is removed, not set to "auto": its absence is what lets the media
 * query decide.
 */
function paint(choice: Choice, announce = false) {
  const root = document.documentElement;
  root.dataset.skin = choice.id;
  if (choice.mode) root.dataset.mode = choice.mode;
  else delete root.dataset.mode;

  previewing = choice;
  const shown = effectiveMode(choice);

  allCards.forEach((card) => {
    const on = card.dataset.skinPick === choice.id && cardMode(card) === shown;
    if (pickerCards.includes(card)) {
      // The picker is a radiogroup: one checked card, one tab stop.
      card.setAttribute('aria-checked', String(on));
      card.tabIndex = on ? 0 : -1;
    } else {
      // The design-system view mirrors the choice as plain buttons, so every card
      // stays reachable by Tab and the state is pressed, not checked.
      card.setAttribute('aria-pressed', String(on));
    }
    const mark = card.querySelector<HTMLElement>('.skin-card__cur');
    if (mark) mark.hidden = !on;
  });

  const label = document.querySelector<HTMLElement>('.skinbtn__label');
  if (label) label.textContent = cardLabel(choice.id);
  if (announce && msg) msg.textContent = `theme: ${choiceName(choice)}`;
  if (booted) window.dispatchEvent(new CustomEvent('tui:skin', { detail: choice.id }));
}

/** The theme's name alone: the button is small, and the variant is on the card. */
function cardLabel(id: string): string {
  const card = allCards.find((c) => c.dataset.skinPick === id);
  if (!card) return id;
  const es = document.documentElement.dataset.lang === 'es';
  const full = (es ? card.dataset.skinNameEs : card.dataset.skinName) ?? id;
  return full.split(' · ')[0];
}

/** Apply and persist. An explicit variant pins the mode; null hands it back. */
function save(choice: Choice) {
  try {
    localStorage.setItem(SKIN_KEY, choice.id);
    if (choice.mode) localStorage.setItem(MODE_KEY, choice.mode);
    else localStorage.removeItem(MODE_KEY);
  } catch {
    /* private mode: the choice lasts for this page */
  }
  committed = choice;
  paint(choice, true);
}

/* ------------------------------------------------------------ open/close -- */

function focusables(panel: HTMLElement): HTMLElement[] {
  return [...panel.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]')].filter(
    // tabIndex mirrors the roving tabindex: the unselected cards are -1 and must
    // not count as focusable, or Tab escapes the panel.
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
          ? pickerCards.find(
              (card) => card.dataset.skinPick === committed.id && cardMode(card) === effectiveMode(committed)
            )
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

/** Arrow movement: one across, one theme down, wrapping at both ends. */
function neighbour(card: HTMLElement, key: string): HTMLElement | null {
  const index = pickerCards.indexOf(card);
  if (index < 0) return null;
  // Two cards per theme, so a row is two wide however it wraps.
  const perRow = 2;

  switch (key) {
    case 'ArrowRight':
      return pickerCards[step(index, 1)];
    case 'ArrowLeft':
      return pickerCards[step(index, -1)];
    case 'ArrowDown':
      return pickerCards[index + perRow] ?? pickerCards[index];
    case 'ArrowUp':
      return pickerCards[index - perRow] ?? pickerCards[index];
    case 'Home':
      return pickerCards[0];
    case 'End':
      return pickerCards[pickerCards.length - 1];
    default:
      return null;
  }
}

function choiceOf(card: HTMLElement): Choice {
  return { id: card.dataset.skinPick!, mode: cardMode(card) };
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
    save(choiceOf(card));
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
  const active = document.activeElement as HTMLElement | null;
  if (active?.dataset?.skinPick) {
    // Enter or Space applies the preview and saves it. Handled here rather than
    // relying on a button's native click, so the behaviour is explicit and works
    // for role="radio" in every browser.
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      save(choiceOf(active));
      close();
      return;
    }

    const next = neighbour(active, event.key);
    if (next) {
      event.preventDefault();
      paint(choiceOf(next));
      next.focus();
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
        paint(choiceOf(card));
      }
    });
  });
}

window.addEventListener('tui:open-dialog', (event) => {
  const name = (event as CustomEvent<string>).detail;
  if (name) open(name);
});

window.addEventListener('tui:close-dialog', () => close());

// Picking a theme from the palette names the theme only, so the mode stays as the
// reader left it (an explicit variant survives; "not chosen" keeps following the OS).
window.addEventListener('tui:set-skin', (event) => {
  const id = (event as CustomEvent<string>).detail;
  if (id) save({ id, mode: savedChoice().mode });
});

/* ------------------------------------------------------------ initial state -- */

committed = savedChoice();
paint(committed);
booted = true;

// With no explicit variant the palette follows the OS live, so the "current" mark
// and the label have to move with it. The colours are CSS and need no help.
LIGHT.addEventListener('change', () => {
  const saved = savedChoice();
  if (!saved.mode) paint(saved);
});

export {};
