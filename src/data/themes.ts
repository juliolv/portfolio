/**
 * The six themes, derived from tokens.css.
 *
 * Every entry ships two palettes. The mode is not a choice the picker offers:
 * it comes from the operating system, and tokens.css switches the whole theme in
 * a `prefers-color-scheme` query before first paint. That is why there is no
 * "System" card any more — following the system is what a theme does, not a
 * seventh option.
 *
 * The five ports were picked for having a real light variant as well as a dark
 * one. Dracula, Tokyo Night and Nord are dark-only, so they are not here.
 */

export interface Theme {
  id: string;
  name: string;
  nameEs: string;
  credit: { en: string; es: string };
  /** Two palettes, so both are shown: bg, panel, text, accent. */
  dark: [string, string, string, string];
  light: [string, string, string, string];
}

export const THEMES: Theme[] = [
  {
    id: 'custom',
    name: 'Custom',
    nameEs: 'Personalizado',
    credit: { en: 'this site', es: 'Esta web' },
    dark: ['#0c0f14', '#11151c', '#c9c7c1', '#e8b86a'],
    light: ['#fbf9f5', '#f6f2ea', '#31353b', '#8a5a1e'],
  },
  {
    id: 'ayu',
    name: 'Ayu',
    nameEs: 'Ayu',
    credit: { en: 'by dempfi', es: 'de dempfi' },
    dark: ['#0d1017', '#0f131a', '#bfbdb6', '#e6b450'],
    light: ['#fcfcfc', '#f8f9fa', '#3e4348', '#8c5e1c'],
  },
  {
    id: 'catppuccin',
    name: 'Catppuccin',
    nameEs: 'Catppuccin',
    credit: { en: 'Mocha / Latte', es: 'Mocha / Latte' },
    dark: ['#1e1e2e', '#181825', '#cdd6f4', '#cba6f7'],
    light: ['#eff1f5', '#e6e9ef', '#4c4f69', '#7d35dc'],
  },
  {
    id: 'rose-pine',
    name: 'Rosé Pine',
    nameEs: 'Rosé Pine',
    credit: { en: 'by mvllow', es: 'de mvllow' },
    dark: ['#191724', '#1f1d2e', '#e0def4', '#ebbcba'],
    light: ['#faf4ed', '#f2e9e1', '#575279', '#8a5451'],
  },
  {
    id: 'solarized',
    name: 'Solarized',
    nameEs: 'Solarized',
    credit: { en: 'by Ethan Schoonover', es: 'de Ethan Schoonover' },
    dark: ['#002b36', '#073642', '#9facac', '#c5a337'],
    light: ['#fdf6e3', '#f7f0dd', '#3f4d52', '#7f6400'],
  },
  {
    id: 'gruvbox',
    name: 'Gruvbox',
    nameEs: 'Gruvbox',
    credit: { en: 'by morhetz', es: 'de morhetz' },
    dark: ['#282828', '#1d2021', '#ebdbb2', '#fabd2f'],
    light: ['#fbf1c7', '#f2e5bc', '#3c3836', '#80570f'],
  },
];

export const DEFAULT_THEME = 'custom';
export const THEME_IDS: string[] = THEMES.map((t) => t.id);

/**
 * Ids stored by the nine-skin build. Without this a returning visitor keeps an
 * id no longer in the table, gets no tokens at all, and sees an unstyled page.
 * Dark-only themes collapse onto the nearest port that does have a light mode.
 */
export const LEGACY_SKINS: Record<string, string> = {
  'ayu-dark': 'ayu', 'ayu-light': 'ayu',
  'catppuccin-mocha': 'catppuccin', 'catppuccin-latte': 'catppuccin',
  'rose-pine': 'rose-pine', 'rose-pine-dawn': 'rose-pine',
  system: 'custom', 'solarized-dark': 'solarized', 'solarized-light': 'solarized',
  'gruvbox-dark': 'gruvbox', 'gruvbox-light': 'gruvbox',
  dracula: 'custom', 'tokyo-night': 'custom', nord: 'custom',
};
