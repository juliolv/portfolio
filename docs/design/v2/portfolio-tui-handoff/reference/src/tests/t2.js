const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  const watch = (p, tag) => { p.on('pageerror', e => errs.push(tag + ' ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(tag + ' ' + m.text())); };
  const p = await b.newPage({ viewport: { width: 1280, height: 820 } }); watch(p, 'desk');
  await p.goto('file:///home/claude/tui/test.html'); await p.waitForTimeout(700);
  await p.evaluate(() => window.scrollTo(0, 900)); await p.waitForTimeout(300);
  const y0 = await p.evaluate(() => scrollY);
  await p.focus('#cmd'); await p.keyboard.type('react'); await p.waitForTimeout(150);
  const opts = await p.$$eval('#menu .opt', els => els.map(e => e.innerText.replace(/\s+/g, ' ')));
  console.log('menu for "react":', JSON.stringify(opts));
  console.log('note:', await p.textContent('#menu .opt-note'), '| page stayed put:', (await p.evaluate(() => scrollY)) === y0);
  await p.screenshot({ path: 's-react.png' });
  await p.fill('#cmd', ''); await p.keyboard.type('booking'); await p.waitForTimeout(100); await p.keyboard.press('Enter'); await p.waitForTimeout(700);
  console.log('Enter on "booking" ->', await p.evaluate(() => { const a = document.activeElement; return a.className + ' expanded=' + a.getAttribute('aria-expanded') + ' ' + a.innerText.replace(/\s+/g, ' '); }));
  await p.focus('#cmd'); await p.keyboard.type('zzz'); await p.waitForTimeout(100);
  console.log('no match note:', await p.textContent('#menu .opt-note'));
  await p.fill('#cmd', ''); await p.keyboard.type('/nope'); await p.waitForTimeout(100);
  console.log('unknown note:', await p.textContent('#menu .opt-note'));
  await p.fill('#cmd', ''); await p.keyboard.type('/wo'); await p.keyboard.press('Enter'); await p.waitForTimeout(700);
  console.log('/wo ->', await p.evaluate(() => document.activeElement.id));
  // phone
  const ctx = await b.newContext({ ...devices['iPhone 13'] }); const m = await ctx.newPage(); watch(m, 'phone');
  await m.goto('file:///home/claude/tui/test.html'); await m.waitForTimeout(900);
  console.log('chips:', JSON.stringify(await m.$$eval('#tips button', e => e.map(x => x.textContent))), '| hint:', await m.textContent('#st-msg'), '| palette btn:', await m.textContent('[data-kbd]'));
  const dockH = () => m.evaluate(() => Math.round(document.querySelector('.dock').getBoundingClientRect().height));
  console.log('dock at top:', await dockH());
  await m.screenshot({ path: 'm-top.png' });
  for (let i = 0; i < 6; i++) { await m.mouse.wheel(0, 300); await m.waitForTimeout(80); }
  await m.waitForTimeout(400); console.log('dock scrolling down:', await dockH());
  await m.screenshot({ path: 'm-down.png' });
  await m.mouse.wheel(0, -200); await m.waitForTimeout(400); console.log('dock scrolling up:', await dockH());
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
