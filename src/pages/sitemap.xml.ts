import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

/**
 * Static endpoint: prerendered at build time to dist/sitemap.xml.
 * URLs are composed from Astro.site and the deploy base so the project-page
 * subpath (/portfolio on GitHub Pages) is never lost.
 */
export const GET: APIRoute = async ({ site }) => {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const origin = site ?? new URL('https://juliolv.github.io');
  const abs = (path: string) => new URL(`${base}${path}`, origin).href;

  const items = (await getCollection('work')).sort((a, b) => a.data.order - b.data.order);

  const entries = [
    { loc: abs('/'), changefreq: 'monthly', priority: '1.0' },
    { loc: abs('/design-system/'), changefreq: 'monthly', priority: '0.6' },
    ...items.map((item) => ({
      loc: abs(`/work/${item.id}/`),
      changefreq: 'yearly',
      priority: '0.7',
    })),
  ];

  const body = entries
    .map(
      ({ loc, changefreq, priority }) =>
        `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
    )
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
