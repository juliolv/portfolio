const { chromium } = require('playwright');
const sizes = [
  ['galaxy-s-360', 360, 780, true], ['iphone-se-375', 375, 667, true], ['iphone-15-393', 393, 852, true],
  ['pixel-412', 412, 915, true], ['iphone-pro-max-430', 430, 932, true],
  ['laptop-1366', 1366, 768, false], ['mac-1440', 1440, 900, false], ['laptop-1536', 1536, 864, false], ['fullhd-1920', 1920, 1080, false]];
(async () => {
  const b = await chromium.launch();
  for (const [name, w, h, mobile] of sizes) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 3 : 1, isMobile: mobile, hasTouch: mobile, colorScheme: 'dark' });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file:///home/claude/tui/test.html'); await p.waitForTimeout(1500);
    const r = await p.evaluate(() => {
      const vw = innerWidth, out = [];
      const bar = document.querySelector('.titlebar__row');
      const barOverflow = bar.scrollWidth - bar.clientWidth;
      const fonts = {}; let small = [];
      document.querySelectorAll('.app *').forEach(el => {
        if (!el.offsetParent || !el.childNodes.length) return;
        const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        if (!hasText) return;
        const fs = parseFloat(getComputedStyle(el).fontSize); fonts[fs] = (fonts[fs] || 0) + 1;
      });
      const targets = [...document.querySelectorAll('.app a, .app button, .app input')].filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(); return [e.textContent.trim().slice(0, 18) || e.getAttribute('aria-label') || e.id, Math.round(r.width), Math.round(r.height)]; });
      const tiny = targets.filter(t => t[2] < 32);
      const dock = Math.round(document.querySelector('.dock').getBoundingClientRect().height);
      const hero = Math.round(document.querySelector('.welcome').getBoundingClientRect().height);
      const name = parseFloat(getComputedStyle(document.querySelector('.hero__name')).fontSize);
      const body = parseFloat(getComputedStyle(document.querySelector('.hero__pitch')).fontSize);
      const content = Math.round(document.querySelector('.transcript').getBoundingClientRect().width);
      return { overflow: document.documentElement.scrollWidth - vw, barOverflow, fonts, tinyTargets: tiny.length, tinyEx: tiny.slice(0, 6), dock, hero, name, body, content };
    });
    console.log(name, JSON.stringify(r), errs.length ? 'ERR ' + errs : '');
    await p.screenshot({ path: `au-${name}.png` });
    await ctx.close();
  }
  await b.close();
})();
