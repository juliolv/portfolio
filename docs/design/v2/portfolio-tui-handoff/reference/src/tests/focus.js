const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 1280, height: 820 } });
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('file:///home/claude/tui/test.html'); await p.waitForTimeout(700);
  const active = () => p.evaluate(() => { const a = document.activeElement; return a.id || a.tagName; });
  await p.focus('#cmd'); await p.keyboard.type('/work'); await p.keyboard.press('Enter'); await p.waitForTimeout(600);
  console.log('/work ->', await active());
  await p.keyboard.press('j'); await p.waitForTimeout(500); console.log('j ->', await active());
  await p.keyboard.press('Control+k'); await p.keyboard.type('stack'); await p.keyboard.press('Enter'); await p.waitForTimeout(700);
  console.log('palette Stack ->', await active());
  await p.focus('#cmd'); await p.keyboard.type('react'); await p.keyboard.press('Enter'); await p.waitForTimeout(600);
  console.log('search ->', await active(), '| status:', await p.textContent('#st-msg'));
  await p.focus('#cmd'); await p.keyboard.type('/nope'); await p.keyboard.press('Enter'); await p.waitForTimeout(600);
  console.log('unknown ->', await active(), '| status:', await p.textContent('#st-msg'));
  console.log('title en:', await p.title());
  await p.click('[data-seg="lang"] [data-value="es"]'); await p.waitForTimeout(200); console.log('title es:', await p.title());
  // GitHub Pages build over http under /portfolio/
  const http = require('http'), fs = require('fs'), path = require('path');
  const srv = http.createServer((req, res) => {
    let u = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    if (!u.startsWith('/portfolio/')) { res.writeHead(404); return res.end(fs.readFileSync('site/404.html')); }
    let f = path.join('site', u.slice('/portfolio/'.length) || 'index.html');
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404, {'content-type':'text/html'}); return res.end(fs.readFileSync('site/404.html')); }
    const ct = { '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png' }[path.extname(f)] || 'application/octet-stream';
    res.writeHead(200, { 'content-type': ct }); res.end(fs.readFileSync(f));
  }).listen(8765);
  const s = await b.newPage({ viewport: { width: 1280, height: 820 }, colorScheme: 'light' });
  s.on('pageerror', e => errs.push('site ' + e.message)); s.on('console', m => m.type() === 'error' && errs.push('site ' + m.text()));
  await s.goto('http://localhost:8765/portfolio/'); await s.waitForTimeout(600);
  console.log('site title:', await s.title(), '| skin', await s.evaluate(() => document.documentElement.dataset.skin));
  console.log('og tags:', await s.evaluate(() => document.querySelectorAll('meta[property^="og:"]').length), '| icons ok:',
    await s.evaluate(async () => (await Promise.all(['favicon.svg','favicon-32.png','apple-touch-icon.png','og.png'].map(f => fetch(f).then(r => r.status)))).join(',')));
  const n = await b.newPage({ viewport: { width: 900, height: 420 }, colorScheme: 'dark' });
  n.on('pageerror', e => errs.push('404 ' + e.message));
  await n.goto('http://localhost:8765/portfolio/old-page'); await n.waitForTimeout(400);
  console.log('404 path shown:', await n.textContent('#path'));
  await n.screenshot({ path: '404.png' });
  srv.close(); console.log('errors', JSON.stringify(errs)); await b.close();
})();
