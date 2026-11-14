/**
 * The nine skins, derived from tokens.css.
 *
 * The picker renders from this table, and the contrast gate reads the same
 * token names, so a new skin is declared once and every surface follows.
 */

export interface Skin {
  id: string;
  name: string;
  mode: 'dark' | 'light';
  /** Swatch colours: background, accent, ok, warn, danger. */
  swatch: [string, string, string, string, string];
}

export const SKINS: Skin[] = [
  {
    id: 'ayu-dark',
    name: 'Ayu Dark',
    mode: 'dark',
    swatch: ['#0d1017', '#e6b450', '#aad94c', '#ffb454', '#d95757'],
  },
  {
    id: 'ayu-light',
    name: 'Ayu Light',
    mode: 'light',
    swatch: ['#fcfcfc', '#8c5e1c', '#5a7800', '#8c652a', '#c44444'],
  },
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    mode: 'dark',
    swatch: ['#1e1e2e', '#cba6f7', '#a6e3a1', '#f9e2af', '#f38ba8'],
  },
  {
    id: 'catppuccin-latte',
    name: 'Catppuccin Latte',
    mode: 'light',
    swatch: ['#eff1f5', '#7832d2', '#2f751f', '#8f5b13', '#cc0f37'],
  },
  {
    id: 'dracula',
    name: 'Dracula',
    mode: 'dark',
    swatch: ['#282a36', '#bd93f9', '#50fa7b', '#f1fa8c', '#ff5a5a'],
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    mode: 'dark',
    swatch: ['#1a1b26', '#7aa2f7', '#9ece6a', '#e0af68', '#f7768e'],
  },
  {
    id: 'nord',
    name: 'Nord',
    mode: 'dark',
    swatch: ['#2e3440', '#acd3de', '#a3be8c', '#ebcb8b', '#daa3a9'],
  },
  {
    id: 'rose-pine',
    name: 'Rosé Pine',
    mode: 'dark',
    swatch: ['#191724', '#ebbcba', '#9ccfd8', '#f6c177', '#eb6f92'],
  },
  {
    id: 'rose-pine-dawn',
    name: 'Rosé Pine Dawn',
    mode: 'light',
    swatch: ['#faf4ed', '#905754', '#286983', '#966421', '#9e576b'],
  },
];

export const DEFAULT_SKIN = 'ayu-dark';
export const SKIN_IDS = SKINS.map((s) => s.id);
