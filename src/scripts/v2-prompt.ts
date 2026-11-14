/**
 * v2 prompt: slash commands, live search, history (§5.1 of the handoff).
 *
 * Search data is embedded at build time in #v2-search-data, so this module has
 * no fetches and no knowledge of Astro.
 */

type Kind = 'section' | 'project' | 'devlog' | 'experience' | 'stack' | 'command';

interface Item {
  kind: Kind;
  label: string;
  meta?: string;
  hash?: string;
  tags?: string[];
  body?: string;
  cmd?: string;
  desc?: string;
  /** Project rows are addressed by their index in the transcript. */
  index?: number;
}

interface Payload {
  items: Item[];
  commands: Item[];
  email: string;
  links: Record<string, string>;
}

const data: Payload = JSON.parse(document.getElementById('v2-search-data')?.textContent ?? '{}');
const input = document.getElementById('cmd') as HTMLInputElement | null;
const menu = document.getElementById('menu');
const msg = document.getElementById('st-msg');

if (input && menu) {
  let results: Item[] = [];
  let cursor = 0;
  let mode: 'idle' | 'command' | 'search' = 'idle';
  const history: string[] = [];
  let historyAt = -1;

  /* ------------------------------------------------------------ scoring -- */

  const WORD_START = (w: string) => new RegExp(`(^|[^a-z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');

  function score(item: Item, words: string[]): number {
    let total = 0;
    const label = item.label.toLowerCase();
    const tags = (item.tags ?? []).map((t) => t.toLowerCase());
    const meta = (item.meta ?? '').toLowerCase();
    const body = (item.body ?? '').toLowerCase();

    for (const word of words) {
      let best = 0;
      if (label.startsWith(word)) best = 100;
      else if (WORD_START(word).test(label)) best = 60;
      else if (label.includes(word)) best = 40;

      if (!best) {
        if (tags.some((t) => t === word)) best = 50;
        else if (tags.some((t) => t.includes(word))) best = 25;
      }
      if (!best && meta.includes(word)) best = 10;
      if (!best && body.includes(word)) best = 5;

      if (!best) return -1; // every word must match somewhere
      total += best;
    }
    return total;
  }

  function ranked(items: Item[], query: string, limit = 8): Item[] {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return items
      .map((item) => ({ item, score: score(item, words) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.item);
  }

  /* ----------------------------------------------------------- rendering -- */

  const escape = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);

  function highlight(label: string, query: string): string {
    const first = query.trim().split(/\s+/)[0];
    if (!first) return escape(label);
    const at = label.toLowerCase().indexOf(first.toLowerCase());
    if (at < 0) return escape(label);
    return `${escape(label.slice(0, at))}<mark>${escape(label.slice(at, at + first.length))}</mark>${escape(label.slice(at + first.length))}`;
  }

  function render(query: string) {
    menu!.hidden = !results.length;
    input!.setAttribute('aria-expanded', String(results.length > 0));
    menu!.innerHTML = '';

    if (!results.length) {
      if (query.trim()) {
        menu!.hidden = false;
        menu!.innerHTML = `<p class="opt-note">No match for “${escape(query.trim())}”. Type / to see commands.</p>`;
      }
      return;
    }

    results.forEach((item, i) => {
      const option = document.createElement('div');
      option.className = 'opt';
      option.id = `opt-${i}`;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', String(i === cursor));
      option.innerHTML =
        `<span class="opt__key">${mode === 'command' ? escape(item.cmd ?? '') : highlight(item.label, query)}</span>` +
        `<span class="opt__desc">${escape(mode === 'command' ? item.desc ?? '' : item.meta ?? '')}</span>` +
        `<span class="opt__end" aria-hidden="true">${item.kind === 'command' ? '↵' : '→'}</span>`;

      option.addEventListener('mousedown', (event) => event.preventDefault()); // keep focus
      option.addEventListener('mouseenter', () => {
        cursor = i;
        paint();
      });
      option.addEventListener('click', () => run(i));
      menu!.append(option);
    });

    const note = document.createElement('p');
    note.className = 'opt-note';
    note.textContent =
      mode === 'command'
        ? `${results.length} command${results.length === 1 ? '' : 's'}`
        : `${results.length} match${results.length === 1 ? '' : 'es'} for “${query.trim()}”`;
    menu!.append(note);

    paint();
    announce(note.textContent);
  }

  function paint() {
    menu!.querySelectorAll<HTMLElement>('.opt').forEach((option, i) => {
      const on = i === cursor;
      option.setAttribute('aria-selected', String(on));
      if (on) {
        input!.setAttribute('aria-activedescendant', option.id);
        option.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  let announceTimer = 0;
  function announce(text: string) {
    window.clearTimeout(announceTimer);
    announceTimer = window.setTimeout(() => {
      if (msg) msg.textContent = text;
    }, 600);
  }

  /* ------------------------------------------------------------- running -- */

  function openExternal(url: string) {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.append(a);
    a.click();
    a.remove();
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(data.email);
      if (msg) msg.textContent = `✓ copied ${data.email}`;
    } catch {
      if (msg) msg.textContent = 'select the address to copy it';
    }
  }

  function goHash(hash: string, focusTarget = true) {
    const el = document.querySelector(hash);
    if (!el) {
      window.location.href = `/portfolio/${hash}`;
      return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (focusTarget) {
      const heading = el.querySelector<HTMLElement>('h2, h1');
      heading?.setAttribute('tabindex', '-1');
      heading?.focus({ preventScroll: true });
    }
  }

  function toggleLang() {
    const root = document.documentElement;
    const next = root.dataset.lang === 'es' ? 'en' : 'es';
    root.dataset.lang = next;
    root.lang = next;
    if (msg) msg.textContent = next.toUpperCase();
  }

  function runCommand(cmd: string) {
    if (msg) msg.textContent = `✓ ${cmd}`;
    switch (cmd) {
      case '/work':
      case '/devlog':
      case '/experience':
      case '/stack':
      case '/about':
      case '/contact':
        goHash(`#${cmd.slice(1)}`);
        break;
      case '/design':
        window.location.href = '/portfolio/design-system/';
        break;
      case '/github':
        openExternal(data.links.github);
        break;
      case '/linkedin':
        openExternal(data.links.linkedin);
        break;
      case '/repo':
        openExternal(data.links.repo);
        break;
      case '/cv':
        openExternal(data.links.cv);
        break;
      case '/copy':
        void copyEmail();
        break;
      case '/hire':
        goHash('#contact');
        void copyEmail();
        break;
      case '/lang':
        toggleLang();
        break;
      case '/theme':
      case '/help':
        window.dispatchEvent(new CustomEvent('tui:open-dialog', { detail: cmd.slice(1) }));
        break;
      default:
        if (msg) msg.textContent = `Unknown command ${cmd}. Type / to see all commands.`;
        return;
    }
  }

  function expandProject(index: number) {
    const row = document.querySelectorAll<HTMLElement>('.row')[index];
    if (!row) return;
    const head = row.querySelector<HTMLElement>('.row__head');
    const body = row.querySelector<HTMLElement>('.row__body');
    row.classList.add('is-open');
    head?.setAttribute('aria-expanded', 'true');
    if (body) body.hidden = false;
    const mark = row.querySelector('.row__mark');
    if (mark) mark.textContent = '▾';
    row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    head?.focus({ preventScroll: true });
  }

  function run(index: number) {
    const item = results[index];
    if (!item) return;

    const typed = input!.value.trim();
    if (typed) history.push(typed);
    historyAt = -1;
    close();
    input!.value = '';

    if (item.kind === 'command') {
      runCommand(item.cmd ?? '');
      return;
    }
    if (item.kind === 'project' && typeof item.index === 'number') {
      expandProject(item.index);
      return;
    }
    if (item.hash) goHash(item.hash);
  }

  /* -------------------------------------------------------------- events -- */

  function close() {
    window.clearTimeout(announceTimer); // a pending "N matches" must not overwrite a command result
    menu!.hidden = true;
    input!.setAttribute('aria-expanded', 'false');
    results = [];
    cursor = 0;
    mode = 'idle';
  }

  function update() {
    const query = input!.value;
    if (query.startsWith('/')) {
      mode = 'command';
      const typed = query.slice(1).toLowerCase();
      results = data.commands.filter((c) => (c.cmd ?? '').slice(1).startsWith(typed));
      cursor = 0;
      render(query);
      return;
    }
    if (!query.trim()) {
      close();
      return;
    }
    mode = 'search';
    results = ranked(data.items, query);
    cursor = 0;
    render(query);
  }

  input.addEventListener('input', update);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (results.length) {
        cursor = (cursor + 1) % results.length;
        paint();
      } else if (history.length) {
        historyAt = historyAt < 0 ? history.length - 1 : Math.max(historyAt - 1, 0);
        input.value = history[historyAt];
        update();
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length) {
        cursor = (cursor - 1 + results.length) % results.length;
        paint();
      } else if (history.length) {
        historyAt = Math.min(historyAt + 1, history.length - 1);
        input.value = history[historyAt];
        update();
      }
    } else if (event.key === 'Tab') {
      const item = results[cursor];
      if (mode === 'command' && item?.cmd) {
        event.preventDefault();
        input.value = `${item.cmd} `;
        update();
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      run(cursor);
    } else if (event.key === 'Escape') {
      if (!menu!.hidden) {
        event.preventDefault();
        close();
      } else {
        input.blur();
      }
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && document.activeElement !== input && !event.metaKey && !event.ctrlKey) {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      event.preventDefault();
      input.focus();
    }
  });
}

export {};
