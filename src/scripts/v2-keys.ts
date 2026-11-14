/**
 * Single-key shortcuts and their switch (§5.3).
 *
 * One letter each, only when you are not typing, not inside a dialog, and not
 * holding a modifier. The switch in the help dialog turns the letters off and is
 * remembered in tui.keys; Ctrl K and the palette button keep working either way.
 */

const KEY_STORE = 'tui.keys';

function keysOn(): boolean {
  try {
    return localStorage.getItem(KEY_STORE) !== 'off';
  } catch {
    return true;
  }
}

function setKeys(on: boolean) {
  try {
    localStorage.setItem(KEY_STORE, on ? 'on' : 'off');
  } catch {
    /* private mode: the setting lasts for this page */
  }
  const button = document.getElementById('keys-switch');
  if (button) button.setAttribute('aria-checked', String(on));
  // No status message: the switch shows its own state, and the hint line now
  // says what still works instead of a one-off confirmation.
  window.dispatchEvent(new CustomEvent('tui:keys', { detail: on }));
}

const dialogOpen = () => !!document.querySelector('.dialog:not([hidden])');

function typing(el: HTMLElement | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

const openDialog = (name: string) => window.dispatchEvent(new CustomEvent('tui:open-dialog', { detail: name }));

const sections = () => [...document.querySelectorAll<HTMLElement>('.turn')];

function stepSection(dir: 1 | -1) {
  const turns = sections();
  const index = turns.findIndex((turn) => turn.classList.contains('is-current'));
  const next = turns[(index < 0 ? 0 : index + dir + turns.length) % turns.length];
  if (!next) return;
  next.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.dispatchEvent(new CustomEvent('tui:flash', { detail: next.id }));
}

document.addEventListener('keydown', (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (dialogOpen() || typing(document.activeElement as HTMLElement)) return;
  if (!keysOn()) return;

  switch (event.key) {
    case 't':
      event.preventDefault();
      openDialog('theme');
      break;
    case 'l':
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('tui:set-lang', {
        detail: document.documentElement.dataset.lang === 'es' ? 'en' : 'es',
      }));
      break;
    case 'j':
      event.preventDefault();
      stepSection(1);
      break;
    case 'k':
      event.preventDefault();
      stepSection(-1);
      break;
    case '?':
      event.preventDefault();
      openDialog('keys');
      break;
    default:
      break;
  }
});

document.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('#keys-switch');
  if (!button) return;
  event.preventDefault();
  setKeys(button.getAttribute('aria-checked') !== 'true');
});

// restore the switch on load
const switchButton = document.getElementById('keys-switch');
switchButton?.setAttribute('aria-checked', String(keysOn()));

export {};
