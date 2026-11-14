const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ javaScriptEnabled: false, viewport: { width: 1280, height: 820 }, colorScheme: 'dark' });
  await p.goto('file:///home/claude/tui/test.html');
  const txt = await p.evaluate(() => document.body.innerText);
  for (const s of ['Julio López', 'senior full-stack software engineer', 'Operations platform', 'Modern full-stack ecosystem', 'Example Corp', 'TanStack Table', 'agentic developer tooling', 'you@example.com', 'Environment setup'])
    console.log(txt.includes(s) ? 'ok  ' : 'MISS', s);
  console.log('hidden JS-only controls:', await p.evaluate(() => [...document.querySelectorAll('.needs-js')].every(e => getComputedStyle(e).display === 'none')));
  console.log('hrefs filled:', await p.evaluate(() => [...document.querySelectorAll('[data-href]')].every(a => a.getAttribute('href'))));
  await p.screenshot({ path: 'nojs.png', fullPage: true });
  // JS on: keys toggle
  const q = await b.newPage({ viewport: { width: 1280, height: 820 } });
  const errs = []; q.on('pageerror', e => errs.push(e.message)); q.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await q.goto('file:///home/claude/tui/test.html'); await q.waitForTimeout(800);
  await q.keyboard.press('?'); await q.waitForTimeout(200);
  console.log('help open:', await q.evaluate(() => !document.querySelector('#dlg').hidden));
  await q.screenshot({ path: 'help.png' });
  await q.keyboard.press('Enter'); await q.waitForTimeout(200);
  console.log('switch now:', await q.getAttribute('#keys-switch', 'aria-checked'));
  await q.keyboard.press('Escape');
  await q.keyboard.press('t'); await q.waitForTimeout(200);
  console.log('t ignored when off:', await q.evaluate(() => document.querySelector('#dlg').hidden));
  console.log('hint:', await q.textContent('#st-msg'));
  await q.keyboard.press('Control+k'); await q.waitForTimeout(200);
  console.log('ctrl+k still works:', await q.evaluate(() => !document.querySelector('#dlg').hidden));
  await q.keyboard.press('Escape');
  await q.reload(); await q.waitForTimeout(500);
  await q.keyboard.press('t'); await q.waitForTimeout(200);
  console.log('off persists after reload:', await q.evaluate(() => document.querySelector('#dlg').hidden));
  console.log('rows collapsed with JS:', await q.evaluate(() => getComputedStyle(document.querySelectorAll('.row__body')[1]).visibility));
  console.log('errors', JSON.stringify(errs));
  await b.close();
})();
