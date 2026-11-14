#!/usr/bin/env node
/**
 * WCAG AA contrast check for every skin in src/styles/tokens.css.
 *
 *   node scripts/check-contrast.mjs          # table + summary
 *   node scripts/check-contrast.mjs --check  # exit 1 if any pair fails
 *
 * The v2 handoff requires 4.5:1 for text, muted, accent and the status colours
 * against every surface, and 3:1 for --border-strong. This reads the real
 * stylesheet, so a hand-edited token cannot sneak past.
 */

import { readFileSync } from 'node:fs';

const CSS = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const CHECK = process.argv.includes('--check');

const TEXT = 4.5;
const UI = 3;

/* --- parse: one entry per theme and mode -----------------------------------
   A theme is a `[data-skin="id"]` block; its light palette is the same selector
   inside `@media (prefers-color-scheme: light)`. Both are checked, because both
   are what a reader actually sees — the mode follows the OS, not a setting. */
const TOKENS = /(--[a-z0-9-]+)\s*:\s*([^;]+);/g;

function readTokens(css) {
  const tokens = {};
  for (const t of css.matchAll(TOKENS)) tokens[t[1]] = t[2].trim();
  return tokens;
}

function blocks() {
  const out = {};
  const rule = /\[data-skin="([a-z-]+)"\]\s*\{([^}]*)\}/g;

  // dark: everything outside a media query (the light ones are picked out below)
  const lightRegions = [...CSS.matchAll(/@media \(prefers-color-scheme: light\)\s*\{([\s\S]*?)\n\}/g)].map((m) => m[1]);
  const darkOnly = CSS.replace(/@media \(prefers-color-scheme: light\)\s*\{[\s\S]*?\n\}/g, '');

  for (const m of darkOnly.matchAll(rule)) out[`${m[1]} · dark`] = readTokens(m[2]);

  for (const region of lightRegions) {
    for (const m of region.matchAll(rule)) {
      const base = out[`${m[1]} · dark`] ?? {};
      out[`${m[1]} · light`] = { ...base, ...readTokens(m[2]) };
    }
  }
  return out;
}

const hex = (v) => {
  const m = /^#([0-9a-f]{6})$/i.exec(v ?? '');
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const luminance = ([r, g, b]) => {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

const ratio = (a, b) => {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

const SURFACES = ['--bg', '--panel', '--element'];
const PAIRS = [];
for (const fg of ['--text', '--muted', '--accent']) {
  for (const bg of SURFACES) PAIRS.push([fg, bg, TEXT]);
}
for (const fg of ['--ok', '--warn', '--danger']) {
  for (const bg of ['--bg', '--panel']) PAIRS.push([fg, bg, TEXT]);
}
PAIRS.push(['--text', '--accent-subtle', TEXT]);
PAIRS.push(['--accent-fg', '--accent', TEXT], ['--border-strong', '--bg', UI]);

const skins = blocks();
const failures = [];
const pad = (s, n) => String(s).padEnd(n);

console.log(`contrast · ${Object.keys(skins).length} theme palettes · AA text ${TEXT}:1 · UI ${UI}:1`);
console.log('─'.repeat(78));

for (const [id, tokens] of Object.entries(skins)) {
  let worst = { name: '', value: Infinity };
  const bad = [];

  for (const [fg, bg, min] of PAIRS) {
    const a = hex(tokens[fg]);
    const b = hex(tokens[bg]);
    if (!a || !b) {
      bad.push(`${fg}/${bg} (unparseable)`);
      continue;
    }
    const r = ratio(a, b);
    if (r < worst.value) worst = { name: `${fg}/${bg}`, value: r };
    if (r < min) bad.push(`${fg}/${bg} ${r.toFixed(2)} < ${min}`);
  }

  const status = bad.length ? `✕ ${bad.length}` : '✓';
  console.log(`${pad(id, 26)} ${status.padEnd(5)} worst ${worst.value.toFixed(2)}:1  ${worst.name}`);
  for (const b of bad) failures.push(`${id}: ${b}`);
}

console.log('─'.repeat(78));

if (failures.length) {
  console.error(`${failures.length} failing pair(s):`);
  for (const f of failures) console.error(`  ✕ ${f}`);
  if (CHECK) process.exit(1);
} else {
  console.log('every theme passes AA in both modes, on every documented pair.');
}
