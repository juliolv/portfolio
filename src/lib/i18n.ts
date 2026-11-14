import en from '../i18n/en.json';
import es from '../i18n/es.json';

export type Lang = 'en' | 'es';
export const LANGS: readonly Lang[] = ['en', 'es'] as const;

const dicts: Record<Lang, any> = { en, es };

/** Build-time string lookup. Dot paths, e.g. t('en', 'work.title'). */
export function t(lang: Lang, path: string): any {
  const value = path.split('.').reduce<any>((acc, key) => (acc == null ? acc : acc[key]), dicts[lang] ?? dicts.en);
  return value ?? path;
}

/** Same as t() but guarantees a string, for text nodes. */
export function s(lang: Lang, path: string): string {
  const v = t(lang, path);
  return Array.isArray(v) ? v.join(' ') : String(v);
}

/** Site-level config. Every outbound link lives here, in one place. */
export const SITE = {
  brand: 'julio',
  name: 'Julio López',
  email: 'you@example.com',
  links: {
    github: 'https://github.com/juliolv',
    linkedin: 'https://www.linkedin.com/in/your-handle',
    cv: '/cv.pdf',
    repo: 'https://github.com/juliolv/portfolio',
    pages: 'https://juliolv.github.io/portfolio/',
  },
  /**
   * The fleet that builds this site, as the sidebar reports it. Descriptions are
   * copy (i18n `agents.<id>`); a `{issue}` placeholder is filled from the devlog
   * entry marked in progress, so the sidebar cannot drift from the devlog.
   */
  agents: [
    { id: 'hermes', name: 'hermes', status: 'learning' as const },
    { id: 'opencode', name: 'opencode', status: 'active' as const, subs: ['orchestrator', 'reviewers'] as const },
    { id: 'claude', name: 'claude code', status: 'active' as const },
  ],
};

/** Prefix a site-absolute path with the deploy base ('' locally, '/portfolio' on Pages). */
const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
export const url = (path: string): string => `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
