// @ts-check
import { defineConfig } from 'astro/config';

// Static output: every page is prerendered to HTML at build time.
// No adapter, no server runtime — deploys to Vercel as static assets.
export default defineConfig({
  site: 'https://juliolv.github.io',
  // Project Pages live under /<repo>/ — every internal link must carry this.
  base: '/portfolio',
  output: 'static',
  build: {
    // Inline small stylesheets to save a request on a mostly-text site.
    inlineStylesheets: 'auto',
  },
  devToolbar: { enabled: false },
});
