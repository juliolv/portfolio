
  /* ========================================================================
     RENDER: lists built from SITE + I18N
     ======================================================================== */
  function renderHero() {
    $('#hero-kv').innerHTML = t('hero.card').map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('');
    var tips = $('#tips');
    tips.classList.toggle('tips--chips', touch);
    if (touch) {
      tips.innerHTML = SITE.chips.map(function (k) { return '<li><button type="button" class="btn" data-act="cmd:' + k + '">' + k + '</button></li>'; }).join('');
      return;
    }
    tips.innerHTML = SITE.tips.map(function (k) {
      return '<li><button type="button" class="tip" data-act="' + k.act + '"><span class="tip__key">' + withKey(k.label) + '</span><span class="tip__desc">' + t('hero.tips.' + k.id) + '</span></button></li>';
    }).join('');
  }
  function renderWork() {
    var L = t('work.labels'), items = t('work.items');
    $('#work-list').innerHTML = SITE.work.map(function (w, i) {
      var c = items[i], open = !!state.open[i];
      return '<li class="row' + (open ? ' is-open' : '') + '" data-i="' + i + '">' +
        '<button class="row__head" type="button" aria-expanded="' + open + '" aria-controls="proj-' + i + '">' +
        '<span class="row__mark" aria-hidden="true">' + (open ? '▾' : '▸') + '</span><span class="row__name">' + c.name + '</span><span class="row__meta">' + c.period + '</span></button>' +
        '<p class="row__sum">' + c.problem + '</p>' +
        '<div class="row__body" id="proj-' + i + '"><div class="row__inner"><dl class="man">' +
        '<dt>' + L.role + '</dt><dd>' + c.role + '</dd>' +
        '<dt>' + L.stack + '</dt><dd><span class="tags">' + w.stack.map(function (s) { return '<span class="tag">' + s + '</span>'; }).join('') + '</span></dd>' +
        '<dt>' + L.outcome + '</dt><dd>' + c.outcome + '</dd></dl>' +
        '<p class="row__foot">' + (w.href ? '<a class="link" href="' + w.href + '" target="_blank" rel="noopener">' + t('work.view') + ' ↗</a>' : '<span class="tag tag--dashed">' + t('work.soon') + '</span>') + '</p>' +
        '</div></div></li>';
    }).join('');
  }
  function renderDevlog() {
    var items = t('devlog.items');
    $('#todo-list').innerHTML = SITE.devlog.map(function (d, i) {
      var c = items[i];
      return '<li class="todo__item"><span class="todo__id">#' + d.issue + '</span>' +
        '<span class="todo__st status status--' + d.status + '"><span aria-hidden="true">' + GLYPH[d.status] + '</span> ' + t('status.' + d.status) + '</span>' +
        (d.date ? '<time class="todo__date" datetime="' + d.date + '">' + d.date + '</time>' : '<span class="todo__date">' + t('status.tbd') + '</span>') +
        '<span class="todo__title">' + c.title + '</span>' +
        '<a class="link todo__link" href="' + SITE.links.repo + '/issues/' + d.issue + '" target="_blank" rel="noopener">' + t('devlog.issue') + ' #' + d.issue + ' ↗</a>' +
        '<p class="todo__note">' + c.note + '</p></li>';
    }).join('');
    $('#mini-todo').innerHTML = SITE.devlog.map(function (d, i) {
      return '<li><a href="#devlog"><span class="status status--' + d.status + '" aria-hidden="true">' + GLYPH[d.status] + '</span><span class="sr-only">' + t('status.' + d.status) + ' </span><span>#' + d.issue + ' ' + items[i].title + '</span></a></li>';
    }).join('');
    var done = SITE.devlog.filter(function (d) { return d.status === 'done'; }).length;
    $('#todo-count').textContent = done + '/' + SITE.devlog.length;
  }
  function renderExperience() {
    $('#exp-list').innerHTML = t('experience.items').map(function (e) {
      return '<li class="glog__item' + (e.edu ? ' glog__item--edu' : '') + '"><p class="glog__role">' + e.role + ' <span class="glog__org">· ' + e.org + '</span></p><p class="glog__when">' + e.when + '</p>' + (e.text ? '<p class="glog__text">' + e.text + '</p>' : '') + '</li>';
    }).join('');
  }
  function renderStack() {
    var groups = t('stack.groups');
    $('#stack-list').innerHTML = SITE.stack.map(function (g, i) {
      return '<section class="tree"><h3 class="tree__name">' + g.dir + '/ <span class="tree__sub">' + groups[i] + '</span></h3><ul>' +
        g.items.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul></section>';
    }).join('');
  }
  function renderAbout() {
    $('#about-body').innerHTML = t('about.body').map(function (p, i) { return '<p' + (i ? ' class="muted"' : '') + '>' + p + '</p>'; }).join('');
  }
  function renderAgents() {
    var cur = SITE.devlog.filter(function (d) { return d.status === 'progress'; })[0];
    var issue = cur ? '#' + cur.issue + ' ' + t('devlog.items')[SITE.devlog.indexOf(cur)].title : '';
    $('#agents').innerHTML = SITE.agents.map(function (a) {
      var st = a.status === 'learning' ? 'progress' : 'done', glyph = a.status === 'learning' ? '◐' : '●';
      return '<li class="agent"><span class="status status--' + st + '" aria-hidden="true">' + glyph + '</span>' +
        '<span class="agent__name">' + a.name + ' <span class="muted">· ' + t('side.' + a.status) + '</span></span>' +
        '<p class="agent__desc">' + fmt(t('agents.' + a.id), { issue: issue }) + '</p>' +
        (a.subs ? '<ul class="agent__subs">' + a.subs.map(function (s) { return '<li>' + t('agents.' + s) + '</li>'; }).join('') + '</ul>' : '') + '</li>';
    }).join('');
    $('#agents-count').textContent = SITE.agents.length;
  }
  /* Context meter: page text as tokens (≈ 4 characters each); "used" grows as you read. */
  var ctxSizes = null, ctxSeen = {};
  function updateContext() {
    if (state.view !== 'home') return;
    if (!ctxSizes) ctxSizes = SECTIONS.map(function (id) { var el = document.getElementById(id); return el ? Math.round(el.textContent.replace(/\s+/g, ' ').length / 4) : 0; });
    var total = 0, used = 0, seen = 0;
    SECTIONS.forEach(function (id, i) {
      var el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top < window.innerHeight * 0.85) ctxSeen[id] = true;
      total += ctxSizes[i]; if (ctxSeen[id]) { used += ctxSizes[i]; seen++; }
    });
    var pct = Math.round((used / Math.max(total, 1)) * 100), cells = 14, f = Math.round((pct / 100) * cells);
    var k = function (n) { return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n); };
    $('#ctx-bar').innerHTML = '█'.repeat(f) + '<i>' + '░'.repeat(cells - f) + '</i>';
    $('#ctx-nums').textContent = '≈ ' + k(used) + ' / ' + k(total) + ' ' + t('side.tokens');
    $('#ctx-read').textContent = seen + '/' + SECTIONS.length + ' ' + t('side.read');
    $('#ctx-pct').textContent = pct + '%';
    $('#ctx').setAttribute('aria-valuenow', pct);
  }

  /* design system view: values are read live from the page */
  var COLOR_TOKENS = ['bg', 'panel', 'element', 'border', 'border-strong', 'text', 'muted', 'accent', 'accent-fg', 'accent-subtle', 'ok', 'warn', 'danger', 'select'];
  function cssVar(n) { return getComputedStyle(root).getPropertyValue('--' + n).trim(); }
  function renderSwatches() {
    var el = $('#ds-swatches'); if (!el) return;
    el.innerHTML = COLOR_TOKENS.map(function (n) {
      return '<div class="swatch"><div class="swatch__chip" style="background:var(--' + n + ')"></div><div class="swatch__meta">--' + n + '<span>' + cssVar(n) + '</span></div></div>';
    }).join('');
  }
  function renderSystem() {
    renderSwatches();
    var sample = t('ds.sample');
    $('#ds-type').innerHTML = [1, 2, 3, 4, 5, 6, 7].map(function (n) {
      return '<div class="row2"><code>--fs-' + n + (n === 7 ? ' · clamp' : ' · ' + cssVar('fs-' + n)) + '</code><span class="row2__sample" style="font-size:var(--fs-' + n + ');line-height:1.25' + (n > 4 ? ';font-weight:700' : '') + '">' + sample + '</span></div>';
    }).join('');
    $('#ds-space').innerHTML = [1, 2, 3, 4, 5, 6, 7, 8].map(function (n) {
      return '<div class="row2"><code>--sp-' + n + ' · ' + cssVar('sp-' + n) + '</code><span class="row2__bar" style="width:var(--sp-' + n + ')"></span></div>';
    }).join('');
    $('#ds-shape').innerHTML = ['r-0', 'r-1', 'r-box'].map(function (n) { return '<span class="shape" style="border-radius:var(--' + n + ')">' + n + '</span>'; }).join('') +
      '<span class="shape" style="border-width:var(--bw)">bw</span><span class="shape" style="border-width:var(--bw-2)">bw-2</span><span class="shape" style="box-shadow:var(--elev)">elev</span>';
    $('#ds-motion').innerHTML = [['dur-fast', 'ease-out'], ['dur-base', 'ease-out'], ['dur-slow', 'ease-out'], ['dur-slow', 'ease-in-out']].map(function (r) {
      return '<button type="button" class="row2 motion-row"><code>--' + r[0] + ' · ' + r[1] + '</code><span class="track"><i style="transition-duration:var(--' + r[0] + ');transition-timing-function:var(--' + r[1] + ')"></i></span></button>';
    }).join('');
    $('#ds-layers').innerHTML = ['z-bar', 'z-dock', 'z-menu', 'z-dialog', 'z-tip'].map(function (n) {
      return '<div class="row2"><code>--' + n + '</code><span style="font-size:var(--fs-2)">' + cssVar(n) + '</span></div>';
    }).join('');
    $('#ds-skins').innerHTML = ['system'].concat(SKIN_IDS).map(function (id) {
      var preview = id === 'system' ? 'ayu-dark' : id;
      return '<button type="button" class="skin-card" data-skin-pick="' + id + '" aria-pressed="' + (id === state.choice) + '">' +
        '<span class="mini" data-skin="' + preview + '"><span><b>❯</b> /work</span><span class="mini__muted">● List(work/)</span><span class="mini__bar"><i></i><i></i><i></i></span></span>' +
        '<span>' + skinName(id) + '<small>' + skinDesc(id) + '</small></span></button>';
    }).join('');
  }

  function renderAll() {
    renderHero(); renderWork(); renderDevlog(); renderExperience(); renderStack(); renderAbout(); renderAgents(); ctxSizes = null; updateContext();
    $('#email-text').textContent = SITE.email;
    $$('[data-kbd]').forEach(function (k) { k.textContent = touch ? t('ui.menuShort') : KEY; });
    if (matchMedia('(max-width: 640px)').matches) $('#cmd').setAttribute('placeholder', t('ui.placeholderShort'));
    if (state.view === 'system') renderSystem();
    syncSkinUI(); syncSegs();
  }

  /* ========================================================================
     COMPONENT: language switch + segmented radiogroup (shared)
     ======================================================================== */
  function syncSegs() {
    $$('[data-seg="lang"]').forEach(function (seg) {
      $$('[role="radio"]', seg).forEach(function (b) {
        var on = b.getAttribute('data-value') === state.lang;
        b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
      });
    });
  }
  /* page title + description follow the language */
  function applyMeta() {
    document.title = t('meta.title');
    var md = document.querySelector('meta[name="description"]'); if (md) md.setAttribute('content', t('meta.description'));
  }
  function setLang(l) {
    state.lang = l; store.set('tui.lang', l);
    root.setAttribute('lang', l);
    applyI18n(document); renderAll(); applyMeta();
    $('#typed').textContent = t('hero.role');
    setStatus(''); onScroll(true);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-seg] [role="radio"]');
    if (b) setLang(b.getAttribute('data-value'));
  });
  document.addEventListener('keydown', function (e) {
    var b = e.target.closest && e.target.closest('[data-seg] [role="radio"]');
    if (!b) return;
    var dir = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    var opts = $$('[role="radio"]', b.closest('[data-seg]')), n = opts[(opts.indexOf(b) + dir + opts.length) % opts.length];
    setLang(n.getAttribute('data-value')); n.focus();
  });

  /* ========================================================================
     COMPONENT: expandable project rows + tabs + motion demo
     ======================================================================== */
  function toggleRow(row, force) {
    var open = force != null ? force : !row.classList.contains('is-open');
    row.classList.toggle('is-open', open);
    var head = $('.row__head', row);
    head.setAttribute('aria-expanded', open ? 'true' : 'false');
    $('.row__mark', head).textContent = open ? '▾' : '▸';
    state.open[+row.getAttribute('data-i')] = open;
  }
  document.addEventListener('click', function (e) {
    var h = e.target.closest('.row__head'); if (h) toggleRow(h.closest('.row'));
    var m = e.target.closest('.motion-row'); if (m) m.classList.toggle('is-on');
    var tab = e.target.closest('[role="tab"]'); if (tab) selectTab(tab);
  });
  document.addEventListener('keydown', function (e) {
    var h = e.target.closest && e.target.closest('.row__head');
    if (h && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End')) {
      e.preventDefault();
      var heads = $$('.row__head'), i = heads.indexOf(h);
      var n = e.key === 'Home' ? 0 : e.key === 'End' ? heads.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + heads.length) % heads.length;
      heads[n].focus(); return;
    }
    var tab = e.target.closest && e.target.closest('[role="tab"]');
    if (!tab) return;
    var tabs = $$('[role="tab"]', tab.parentNode), j = tabs.indexOf(tab), k = -1;
    if (e.key === 'ArrowRight') k = (j + 1) % tabs.length; else if (e.key === 'ArrowLeft') k = (j - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') k = 0; else if (e.key === 'End') k = tabs.length - 1;
    if (k < 0) return;
    e.preventDefault(); selectTab(tabs[k]); tabs[k].focus();
  });
  function selectTab(tab) {
    $$('[role="tab"]', tab.parentNode).forEach(function (x) {
      var on = x === tab;
      x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
  }
