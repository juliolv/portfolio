/**
 * Command palette (§5.2): one listbox over sections, themes, languages, links and
 * actions, on Ctrl K or the title-bar button.
 *
 * It shares the dialog shell with the theme picker and the help table, so focus
 * trapping, Esc, the backdrop and focus restore are the same code path.
 */

interface Entry {
  group: 'go' | 'appearance' | 'links' | 'actions';
  label: Record<'en' | 'es', string>;
  hint?: Record<'en' | 'es', string>;
  hash?: string;
  url?: string;
  skin?: string;
  lang?: 'en' | 'es';
  action?: 'copy' | 'keys' | 'theme';
}

const raw = document.getElementById('v2-palette-data')?.textContent;
const entries: Entry[] = raw ? JSON.parse(raw) : [];
const titles = JSON.parse(document.getElementById('v2-palette-titles')?.textContent ?? '{}') as Record<string, Record<'en' | 'es', string>>;

const dialog = document.querySelector<HTMLElement>('.dialog[data-dlg="palette"]');
const input = document.getElementById('pal-input') as HTMLInputElement | null;
const list = document.getElementById('pal-list');
const lang = (): 'en' | 'es' => (document.documentElement.dataset.lang === 'es' ? 'es' : 'en');

let results: Entry[] = [];
let cursor = 0;
let optionIds: string[] = [];

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);

function matches(entry: Entry, query: string): boolean {
  if (!query) return true;
  const haystack = `${entry.label[lang()]} ${entry.hint?.[lang()] ?? ''} ${entry.label.en}`.toLowerCase();
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

function render() {
  if (!list || !input) return;
  // The field's placeholder is copy too, and it is server-rendered in English.
  input.placeholder = titles.placeholder?.[lang()] ?? input.placeholder;
  const query = input.value;
  results = entries.filter((entry) => matches(entry, query));
  cursor = Math.min(cursor, Math.max(results.length - 1, 0));
  optionIds = [];

  if (!results.length) {
    list.innerHTML = `<p class="opt-note">${esc((titles.noResults?.[lang()] ?? 'No match for “{q}”').replace('{q}', query.trim()))}</p>`;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    return;
  }

  let group = '';
  list.innerHTML = results
    .map((entry, i) => {
      let html = '';
      if (entry.group !== group) {
        group = entry.group;
        html += `<p class="opt-group">${esc(titles[group]?.[lang()] ?? group)}</p>`;
      }
      const id = `pal-${i}`;
      optionIds.push(id);
      const hint = entry.hint?.[lang()] ?? (entry.url ? entry.url.replace(/^https?:\/\//, '') : '');
      html += `<div class="opt" role="option" id="${id}" data-i="${i}" aria-selected="${i === cursor}">
        <span class="opt__key">${esc(entry.label[lang()])}</span>
        <span class="opt__desc">${esc(hint)}</span>
        <span class="opt__end" aria-hidden="true">↵</span>
      </div>`;
      return html;
    })
    .join('');

  input.setAttribute('aria-expanded', 'true');
  paint();
}

function paint() {
  list?.querySelectorAll<HTMLElement>('.opt').forEach((option) => {
    const on = Number(option.dataset.i) === cursor;
    option.setAttribute('aria-selected', String(on));
    if (on) {
      input?.setAttribute('aria-activedescendant', option.id);
      option.scrollIntoView({ block: 'nearest' });
    }
  });
}

function run(entry: Entry | undefined) {
  if (!entry) return;
  const close = () => window.dispatchEvent(new CustomEvent('tui:close-dialog'));

  if (entry.hash) {
    close();
    location.hash = entry.hash.slice(1);
    window.dispatchEvent(new CustomEvent('tui:flash', { detail: entry.hash.slice(1) }));
    return;
  }
  if (entry.url) {
    close();
    window.open(entry.url, '_blank', 'noopener');
    return;
  }
  if (entry.skin) {
    close();
    window.dispatchEvent(new CustomEvent('tui:set-skin', { detail: entry.skin }));
    return;
  }
  if (entry.lang) {
    close();
    window.dispatchEvent(new CustomEvent('tui:set-lang', { detail: entry.lang }));
    return;
  }
  if (entry.action === 'copy') {
    navigator.clipboard?.writeText(document.getElementById('email-text')?.textContent?.trim() ?? '').then(
      () => { window.dispatchEvent(new CustomEvent('tui:close-dialog')); },
      () => { window.dispatchEvent(new CustomEvent('tui:close-dialog')); }
    );
    return;
  }
  if (entry.action === 'keys') {
    close();
    window.dispatchEvent(new CustomEvent('tui:open-dialog', { detail: 'keys' }));
    return;
  }
  if (entry.action === 'theme') {
    close();
    window.dispatchEvent(new CustomEvent('tui:open-dialog', { detail: 'theme' }));
  }
}

input?.addEventListener('input', () => {
  cursor = 0;
  render();
});

list?.addEventListener('mousemove', (event) => {
  const option = (event.target as HTMLElement).closest<HTMLElement>('.opt');
  if (!option) return;
  cursor = Number(option.dataset.i);
  paint();
});

list?.addEventListener('click', (event) => {
  const option = (event.target as HTMLElement).closest<HTMLElement>('.opt');
  if (!option) return;
  run(results[Number(option.dataset.i)]);
});

input?.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    if (!results.length) return;
    cursor = (cursor + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
    paint();
  } else if (event.key === 'Enter') {
    event.preventDefault();
    run(results[cursor]);
  } else if (event.key === 'Tab') {
    event.preventDefault(); // stay in the field; this is a listbox, not a form
  }
});

// The dialog shell tells us when it is ready, so the query is always fresh.
window.addEventListener('tui:dialog-opened', (event) => {
  if ((event as CustomEvent<string>).detail !== 'palette' || !input) return;
  input.value = '';
  cursor = 0;
  render();
  input.focus();
});

// Descriptions are per language, so an open palette re-renders on a switch.
window.addEventListener('tui:lang', () => {
  if (dialog && !dialog.hidden) render();
});

export {};
