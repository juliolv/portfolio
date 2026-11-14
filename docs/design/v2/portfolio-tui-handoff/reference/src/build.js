// Build: assemble the parts, render the page once in English, and bake the
// rendered markup back into the HTML so crawlers and no-JS visitors get content.
const fs = require('fs');
const { chromium } = require('playwright');
const parts = ['p1-head.html', 'p2-css.html', 'p3-body.html', 'p4-en.js', 'p5-es.js', 'p6-core.js', 'p7-render.js', 'p8-app.js'];
const wrap = (s) => '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="icon" type="image/svg+xml" href="favicon.svg"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>' + s + '</body></html>';
(async () => {
  const src = parts.map((p) => fs.readFileSync(p, 'utf8')).join('');
  fs.writeFileSync('template.html', wrap(src));
  const b = await chromium.launch();
  const ctx = await b.newContext({ locale: 'en-US', reducedMotion: 'reduce', colorScheme: 'dark' });
  const p = await ctx.newPage();
  await p.goto('file://' + __dirname + '/template.html');
  await p.waitForTimeout(300);
  const html = await p.evaluate(() => {
    const app = document.querySelector('.app').cloneNode(true);
    const dlg = document.querySelector('#dlg').cloneNode(true);
    app.querySelectorAll('[aria-current]').forEach((e) => e.removeAttribute('aria-current'));
    app.querySelectorAll('.is-current, .is-flash, .is-pending').forEach((e) => e.classList.remove('is-current', 'is-flash', 'is-pending'));
    ['#files-ind', '#tabstrip-ind'].forEach((s) => app.querySelector(s).removeAttribute('style'));
    const menu = app.querySelector('#menu'); menu.innerHTML = ''; menu.hidden = true;
    const cmd = app.querySelector('#cmd'); cmd.removeAttribute('aria-activedescendant'); cmd.setAttribute('aria-expanded', 'false');
    app.querySelector('#crumb').textContent = '';
    dlg.querySelector('#dlg-body').innerHTML = ''; dlg.hidden = true;
    return '\n' + app.outerHTML + '\n\n' + dlg.outerHTML + '\n';
  });
  await b.close();
  const out = ['p1-head.html', 'p2-css.html'].map((f) => fs.readFileSync(f, 'utf8')).join('') + html +
    ['p4-en.js', 'p5-es.js', 'p6-core.js', 'p7-render.js', 'p8-app.js'].map((f) => fs.readFileSync(f, 'utf8')).join('');
  fs.writeFileSync('portfolio-tui.html', out);
  fs.writeFileSync('test.html', wrap(out));
  console.log('built', out.length, 'bytes');

  // ---------- GitHub Pages folder: site/ ----------
  const SITE_URL = 'https://juliolv.github.io/portfolio/';
  const meta = { title: 'Julio López · Senior full-stack software engineer',
    description: 'Portfolio of Julio López, a senior full-stack engineer with 10+ years building web platforms and internal tools, now focused on agentic developer tooling. Built in public with Hermes Agent.' };
  const skins = JSON.parse(fs.readFileSync('skins.json', 'utf8'));
  const esc = (x) => x.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}">
<link rel="canonical" href="${SITE_URL}">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${skins['ayu-dark'].bg}">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="${skins['ayu-light'].bg}">
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Julio López">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:url" content="${SITE_URL}">
<meta property="og:image" content="${SITE_URL}og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Julio López, senior full-stack software engineer. Terminal-style portfolio card.">
<meta property="og:locale" content="en_US">
<meta property="og:locale:alternate" content="es_ES">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(meta.title)}">
<meta name="twitter:description" content="${esc(meta.description)}">
<meta name="twitter:image" content="${SITE_URL}og.png">
<style>body{margin:0}[hidden]{display:none!important}</style>
</head>
<body>
`;
  // drop the artifact-only lines (artifact title, viewport-fit hint, inline data-URI favicon)
  const body = out.replace(/^<title>[^<]*<\/title>\n<meta name="claude:viewport-fit-sides"[^>]*>\n<link rel="icon"[^>]*>\n/, '');
  if (body === out) throw new Error('artifact head lines not found');
  fs.mkdirSync('site', { recursive: true });
  fs.writeFileSync('site/index.html', head + body + '</body>\n</html>\n');
  fs.copyFileSync('404.html', 'site/404.html');
  fs.copyFileSync('favicon.svg', 'site/favicon.svg');
  const b2 = await chromium.launch();
  const pg = await b2.newPage({ viewport: { width: 1200, height: 630 } });
  await pg.goto('file://' + __dirname + '/og-src.html'); await pg.waitForTimeout(150);
  await pg.screenshot({ path: 'site/og.png' });
  for (const [file, src, size] of [['site/favicon-32.png', 'favicon.svg', 32], ['site/apple-touch-icon.png', 'apple-icon.svg', 180]]) {
    const ip = await b2.newPage({ viewport: { width: size, height: size }, colorScheme: 'dark' });
    await ip.setContent(`<body style="margin:0"><img src="data:image/svg+xml;base64,${fs.readFileSync(src).toString('base64')}" width="${size}" height="${size}" style="display:block"></body>`);
    await ip.waitForTimeout(100); await ip.screenshot({ path: file, omitBackground: true });
  }
  await b2.close();
  console.log('site/ written');
})();
