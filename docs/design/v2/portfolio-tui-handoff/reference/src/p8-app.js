
  /* ========================================================================
     COMPONENT: view router, section tracking, nav indicators
     ======================================================================== */
  function navTo(id) {
    if ((location.hash || '').slice(1) === id) route(true); else location.hash = id;
  }
  function flash(el) {
    if (!el || el.id === 'top' || !el.classList.contains('turn')) return;
    el.classList.remove('is-flash'); void el.offsetWidth; el.classList.add('is-flash');
    setTimeout(function () { el.classList.remove('is-flash'); }, 1000);
  }
  /* Move keyboard and screen reader focus to the section that was asked for. */
  function focusHeading(sec) {
    if (!sec) return;
    var h = sec.matches('h1, h2') ? sec : sec.querySelector('h1, h2');
    if (!h) return;
    if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
    h.focus({ preventScroll: true });
  }
  function route(force, boot) {
    var h = (location.hash || '').slice(1);
    var view = h === 'design-system' ? 'system' : 'home';
    var changed = view !== state.view;
    state.view = view;
    $$('[data-view]').forEach(function (m) { m.hidden = m.getAttribute('data-view') !== view; });
    var el = view === 'home' && h ? document.getElementById(h) : null;
    if (changed || force) {
      var beh = (changed || reduced.matches) ? 'auto' : 'smooth';
      if (el) { el.scrollIntoView({ behavior: beh, block: 'start' }); flash(el); }
      else window.scrollTo({ top: 0, behavior: beh });
    }
    if (view === 'system') renderSystem();
    if (!boot) {
      if (el) focusHeading(el);
      else if (changed || force) focusHeading(view === 'system' ? $('#view-system h1') : $('#hero-name'));
    }
    onScroll(true);
  }
  function moveInd(container, ind, axis) {
    if (!container || !ind || !container.offsetParent) return;
    var a = container.querySelector('[aria-current="true"]');
    if (!a) { ind.style.transform = axis === 'y' ? 'translateY(0) scaleY(0)' : 'translateX(0) scaleX(0)'; return; }
    if (axis === 'y') { ind.style.transform = 'translateY(' + a.offsetTop + 'px) scaleY(' + a.offsetHeight + ')'; return; }
    var pad = 8;
    ind.style.transform = 'translateX(' + (a.offsetLeft + pad) + 'px) scaleX(' + Math.max(a.offsetWidth - pad * 2, 1) + ')';
    if (container.scrollWidth > container.clientWidth) {
      container.scrollTo({ left: a.offsetLeft - (container.clientWidth - a.offsetWidth) / 2, behavior: behavior() });
    }
  }
  function syncNav() {
    var key = state.view === 'system' ? 'design-system' : state.section;
    $$('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === key) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    $$('#view-home [data-turn]').forEach(function (el) { el.classList.toggle('is-current', state.view === 'home' && el.id === state.section); });
    $('#crumb').textContent = key === 'top' ? '' : '/' + key;
    moveInd($('#files'), $('#files-ind'), 'y');
    moveInd($('#tabstrip'), $('#tabstrip-ind'), 'x');
  }
  var ticking = false;
  function onScroll(now) {
    if (ticking && now !== true) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1), y = window.scrollY || 0;
      var cur = 'top';
      if (state.view === 'home') {
        var line = window.innerHeight * 0.38;
        SECTIONS.forEach(function (id) { var el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= line) cur = id; });
        if (y >= max - 2) cur = 'contact';
      }
      state.section = cur; syncNav(); updateContext();
      compactDock(y, max);
    });
  }
  /* Phones: the dock shrinks to one line while scrolling down, expands on scroll up. */
  var lastY = 0, dockEl = document.querySelector('.dock'), narrow = matchMedia('(max-width: 899px)');
  function compactDock(y, max) {
    if (!dockEl) return;
    if (!narrow.matches || y < 80 || y >= max - 2 || document.activeElement === cmdEl() || !document.getElementById('menu').hidden) { dockEl.classList.remove('is-compact'); lastY = y; return; }
    if (Math.abs(y - lastY) < 8) return;
    dockEl.classList.toggle('is-compact', y > lastY); lastY = y;
  }
  function cmdEl() { return document.getElementById('cmd'); }
  function step(d) {
    var i = SECTIONS.indexOf(state.section), n = Math.max(0, Math.min(SECTIONS.length - 1, i + d));
    var el = document.getElementById(SECTIONS[n]);
    if (el) { el.scrollIntoView({ behavior: behavior(), block: 'start' }); flash(el); focusHeading(el); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('hashchange', function () { route(false); });

  /* ========================================================================
     COMPONENT: commands (shared by slash menu and palette)
     ======================================================================== */
  function runNav(id, spin) {
    var label = '/' + (id === 'design-system' ? 'design' : id);
    if (spin && !reduced.matches) {
      setStatus(t('search.running') + ' ' + label, true);
      setTimeout(function () { navTo(id); setStatus('✓ ' + label, false, 2200); }, 320);
    } else navTo(id);
  }
  function hire() { runNav('contact', true); setTimeout(copyEmail, reduced.matches ? 0 : 700); }
  function baseCommands() {
    var go = function (id) { return function () { runNav(id, true); }; };
    var ext = function (k) { return function () { openExternal(SITE.links[k]); }; };
    var L = [['work', go('work'), 'go'], ['devlog', go('devlog'), 'go'], ['experience', go('experience'), 'go'], ['stack', go('stack'), 'go'],
      ['about', go('about'), 'go'], ['contact', go('contact'), 'go'], ['design', go('design-system'), 'go'],
      ['theme', openThemes, 'app'], ['lang', function () { setLang(state.lang === 'en' ? 'es' : 'en'); }, 'app'],
      ['github', ext('github'), 'links'], ['linkedin', ext('linkedin'), 'links'], ['cv', ext('cv'), 'links'], ['repo', ext('repo'), 'links'],
      ['copy', copyEmail, 'actions'], ['hire', hire, 'actions'], ['help', openHelp, 'actions']];
    return L.map(function (c) { return { key: '/' + c[0], name: c[0], desc: t('cmd.' + c[0]), run: c[1], group: c[2] }; });
  }
  function variants(base) {
    if (base === 'theme') {
      return ['system'].concat(SKIN_IDS).map(function (id) {
        return { key: '/theme ' + id, name: id, desc: skinDesc(id), run: function () { setChoice(id); setStatus('✓ ' + t('palette.themePrefix') + skinName(id), false, 2400); } };
      });
    }
    return ['en', 'es'].map(function (l) { return { key: '/lang ' + l, name: l, desc: l === 'en' ? 'English' : 'Español', run: function () { setLang(l); } }; });
  }
  function runKey(key) { var c = baseCommands().filter(function (x) { return x.key === key; })[0]; if (c) c.run(); }
  function slashItems(raw) {
    var q = raw.toLowerCase(), m = q.match(/^\/(theme|lang)\s+(\S*)$/);
    if (m) return variants(m[1]).filter(function (v) { return v.name.indexOf(m[2]) === 0; });
    if (/\s/.test(q)) return [];
    return baseCommands().filter(function (c) { return c.key.indexOf(q) === 0 || (q.length > 1 && c.desc.toLowerCase().indexOf(q.slice(1)) > -1); });
  }

  /* ========================================================================
     COMPONENT: prompt with slash-command menu + live search
     "/" lists commands; plain text searches projects, stack, devlog and
     experience by name, tag and title, ranked, inside the same menu.
     ======================================================================== */
  var cmd = $('#cmd'), menu = $('#menu'), mItems = [], mSel = 0, mNote = '', annT;
  function keepVisible(list, el) {
    if (!el) return;
    var top = el.offsetTop, bot = top + el.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top; else if (bot > list.scrollTop + list.clientHeight) list.scrollTop = bot - list.clientHeight;
  }
  function closeMenu() { menu.hidden = true; mItems = []; mNote = ''; cmd.setAttribute('aria-expanded', 'false'); cmd.removeAttribute('aria-activedescendant'); }
  function hl(label, q) {
    var i = q ? label.toLowerCase().indexOf(q) : -1;
    if (i < 0) return esc(label);
    return esc(label.slice(0, i)) + '<mark>' + esc(label.slice(i, i + q.length)) + '</mark>' + esc(label.slice(i + q.length));
  }
  function renderMenu() {
    if (!mItems.length && !mNote) { closeMenu(); return; }
    menu.hidden = false; cmd.setAttribute('aria-expanded', 'true');
    menu.innerHTML = (mNote ? '<div class="opt-note" role="presentation">' + esc(mNote) + '</div>' : '') + mItems.map(function (it, i) {
      return '<div class="opt" role="option" id="mo-' + i + '" data-i="' + i + '" aria-selected="' + (i === mSel) + '"><span class="opt__key">' + (it.html || esc(it.key)) + '</span><span class="opt__desc">' + esc(it.desc) + '</span></div>';
    }).join('');
    if (mItems.length) { cmd.setAttribute('aria-activedescendant', 'mo-' + mSel); keepVisible(menu, $('#mo-' + mSel)); }
    else cmd.removeAttribute('aria-activedescendant');
  }
  function searchIndex() {
    var idx = [], work = t('work.items'), groups = t('stack.groups');
    ['work', 'devlog', 'experience', 'stack', 'about', 'contact'].forEach(function (id) {
      idx.push({ label: t('cmd.' + id), where: '/' + id, tags: [t('nav.' + id), id], text: t(id + '.q'), run: function () { runNav(id, false); } });
    });
    SITE.work.forEach(function (w, i) {
      var c = work[i];
      idx.push({ label: c.name, where: t('nav.work') + '/ · ' + c.period, tags: w.stack, text: [c.problem, c.role, c.outcome].join(' '), run: function () { openProject(i); } });
    });
    SITE.devlog.forEach(function (d, i) {
      var c = t('devlog.items')[i];
      idx.push({ label: '#' + d.issue + ' ' + c.title, where: t('nav.devlog') + '/ · ' + t('status.' + d.status), tags: [], text: c.note, run: function () { runNav('devlog', false); } });
    });
    t('experience.items').forEach(function (e) {
      idx.push({ label: e.role, where: t('nav.experience') + ' · ' + e.org, tags: [e.org], text: e.text, run: function () { runNav('experience', false); } });
    });
    SITE.stack.forEach(function (g, gi) {
      g.items.forEach(function (it) { idx.push({ label: it, where: 'stack/' + g.dir, tags: [groups[gi]], text: '', run: function () { runNav('stack', false); } }); });
    });
    baseCommands().forEach(function (c) { if (c.group !== 'go') idx.push({ label: c.key, where: c.desc, tags: [c.desc], text: '', run: c.run }); });
    return idx;
  }
  function searchItems(raw) {
    var q = raw.toLowerCase(), toks = q.split(/\s+/);
    return searchIndex().map(function (e) {
      var L = e.label.toLowerCase(), tags = e.tags.map(function (x) { return x.toLowerCase(); }), W = e.where.toLowerCase(), X = (e.text || '').toLowerCase();
      var all = L + ' ' + tags.join(' ') + ' ' + W + ' ' + X;
      if (!toks.every(function (tk) { return all.indexOf(tk) > -1; })) return null;
      var s = 0, tag = null;
      if (L.indexOf(q) === 0) s += 100; else if ((' ' + L).indexOf(' ' + q) > -1) s += 60; else if (L.indexOf(q) > -1) s += 40;
      e.tags.forEach(function (tg) { var l = tg.toLowerCase(); if (l === q) { s += 50; tag = tg; } else if (l.indexOf(q) > -1) { s += 25; tag = tag || tg; } });
      if (W.indexOf(q) > -1) s += 10;
      if (X.indexOf(q) > -1) s += 5;
      var extra = tag && L.indexOf(q) < 0 && W.indexOf(tag.toLowerCase()) < 0 ? ' · ' + tag : '';
      return { score: s || 1, key: e.label, html: hl(e.label, q), desc: e.where + extra, run: e.run };
    }).filter(Boolean).sort(function (a, b) { return b.score - a.score; }).slice(0, 8);
  }
  function openProject(i) {
    var go = function () {
      var row = $$('#work-list .row')[i]; if (!row) return;
      toggleRow(row, true);
      row.scrollIntoView({ behavior: behavior(), block: 'center' });
      $('.row__head', row).focus({ preventScroll: true }); flash($('#work'));
      setStatus('✓ ' + t('work.items')[i].name, false, 2400);
    };
    if (state.view !== 'home') { location.hash = 'work'; setTimeout(go, 120); } else go();
  }
  function updateMenu() {
    var raw = cmd.value, q = raw.trim(); mSel = 0; mNote = '';
    if (raw.charAt(0) === '/') {
      mItems = slashItems(raw);
      if (!mItems.length && raw.length > 1) mNote = fmt(t('search.unknown'), { c: raw.split(/\s+/)[0] });
    } else if (q) {
      mItems = searchItems(q);
      mNote = mItems.length ? fmt(t('search.result'), { n: mItems.length, q: q }) : fmt(t('search.none'), { q: q });
    } else { closeMenu(); return; }
    renderMenu();
    clearTimeout(annT);
    if (mNote) annT = setTimeout(function () { if (!menu.hidden && mNote) setStatus(mNote, false, 3000); }, 600);
  }
  function pushHist(raw) { state.hist.push(raw); state.hi = -1; }
  function afterRun() { if (matchMedia('(pointer: coarse)').matches) cmd.blur(); }
  function execRaw(raw) {
    pushHist(raw); cmd.value = ''; closeMenu();
    if (raw.charAt(0) === '/') {
      var parts = raw.slice(1).split(/\s+/), name = parts[0].toLowerCase();
      var c = baseCommands().filter(function (x) { return x.name === name; })[0];
      if (!c) setStatus(fmt(t('search.unknown'), { c: '/' + name }), false, 3600);
      else if (parts[1] && (name === 'theme' || name === 'lang')) {
        var v = variants(name).filter(function (x) { return x.name === parts[1].toLowerCase(); })[0];
        if (v) v.run(); else setStatus(fmt(t('search.badarg'), { a: parts[1], c: '/' + name }), false, 3600);
      } else c.run();
    } else setStatus(fmt(t('search.none'), { q: raw }), false, 3600);
    afterRun();
  }
  $('#prompt').addEventListener('submit', function (e) {
    e.preventDefault();
    var raw = cmd.value.trim(); if (!raw) return;
    if (!menu.hidden && mItems.length) { var it = mItems[mSel]; pushHist(raw); cmd.value = ''; closeMenu(); it.run(); afterRun(); return; }
    execRaw(raw);
  });
  cmd.addEventListener('input', function () { state.hi = -1; updateMenu(); });
  cmd.addEventListener('focus', function () { $('.dock').classList.remove('is-compact'); if (cmd.value.trim()) updateMenu(); });
  cmd.addEventListener('blur', closeMenu);
  cmd.addEventListener('keydown', function (e) {
    var open = !menu.hidden && mItems.length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (open) { e.preventDefault(); mSel = (mSel + (e.key === 'ArrowDown' ? 1 : -1) + mItems.length) % mItems.length; renderMenu(); }
      else if (state.hist.length) {
        e.preventDefault();
        state.hi = Math.max(-1, Math.min(state.hist.length - 1, state.hi + (e.key === 'ArrowUp' ? 1 : -1)));
        cmd.value = state.hi < 0 ? '' : state.hist[state.hist.length - 1 - state.hi];
      }
    } else if (e.key === 'Tab' && open) {
      var it = mItems[mSel];
      if (it.key.charAt(0) === '/') { e.preventDefault(); cmd.value = it.key + (it.key === '/theme' || it.key === '/lang' ? ' ' : ''); updateMenu(); }
    }
  });
  menu.addEventListener('mousedown', function (e) { e.preventDefault(); });
  menu.addEventListener('click', function (e) {
    var o = e.target.closest('[data-i]'); if (!o) return;
    var it = mItems[+o.getAttribute('data-i')]; pushHist(cmd.value); cmd.value = ''; closeMenu(); it.run(); afterRun();
  });
  function focusPrompt(prefill) { cmd.focus(); if (prefill) { cmd.value = prefill; updateMenu(); } }

  /* ========================================================================
     COMPONENT: dialog (command palette, theme picker, help)
     ======================================================================== */
  var dlg = { open: false, type: null, ret: null, commit: false };
  function openDialog(type, title, build) {
    if (dlg.open) closeDialog(true);
    dlg.ret = document.activeElement; dlg.type = type; dlg.commit = false;
    $('#dlg-title').textContent = title;
    var body = $('#dlg-body'); body.innerHTML = ''; build(body);
    $('#dlg').hidden = false; dlg.open = true;
  }
  function closeDialog(silent) {
    if (!dlg.open) return;
    if (dlg.type === 'themes' && !dlg.commit) applySkin(skinFor(state.choice), false);
    $('#dlg').hidden = true; dlg.open = false; dlg.type = null;
    var r = dlg.ret; if (!silent && r && r.focus) r.focus();
  }
  function trapTab(e) {
    var f = $$('#dlg button, #dlg input, #dlg [tabindex="0"], #dlg a[href]').filter(function (el) { return !el.disabled; });
    if (!f.length) return;
    var i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && (i === f.length - 1 || i === -1)) { e.preventDefault(); f[0].focus(); }
  }
  function paletteItems() {
    var order = ['go', 'app', 'links', 'actions'];
    var names = { go: t('palette.gGo'), app: t('palette.gApp'), links: t('palette.gLinks'), actions: t('palette.gActions') };
    var all = baseCommands().map(function (c) { return { label: c.desc, hint: c.key, group: c.group, run: c.run }; });
    ['system'].concat(SKIN_IDS).forEach(function (id) { all.push({ label: t('palette.themePrefix') + skinName(id), hint: skinDesc(id), group: 'app', run: function () { setChoice(id); } }); });
    ['en', 'es'].forEach(function (l) { all.push({ label: t('palette.langPrefix') + (l === 'en' ? 'English' : 'Español'), hint: l === state.lang ? '●' : '', group: 'app', run: function () { setLang(l); } }); });
    var out = [];
    order.forEach(function (g) { all.filter(function (x) { return x.group === g; }).forEach(function (x) { x.gname = names[g]; out.push(x); }); });
    return out;
  }
  function openPalette() {
    openDialog('palette', t('palette.title'), function (body) {
      body.innerHTML = '<div class="dialog__field"><span class="prompt__glyph" aria-hidden="true">❯</span><input id="pal-in" class="prompt__input" type="text" role="combobox" aria-expanded="true" aria-controls="pal-list" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="' + esc(t('palette.placeholder')) + '" aria-label="' + esc(t('palette.title')) + '"></div>' +
        '<div class="dialog__list" id="pal-list" role="listbox" aria-label="' + esc(t('palette.title')) + '"></div>' +
        '<div class="dialog__hint" aria-hidden="true"><span>↑↓ ' + t('palette.hNav') + '</span><span>↵ ' + t('palette.hRun') + '</span><span>esc ' + t('palette.hClose') + '</span></div>';
      var input = $('#pal-in'), list = $('#pal-list'), all = paletteItems(), items = [], sel = 0;
      function draw() {
        var q = input.value.trim().toLowerCase();
        items = all.filter(function (x) { return !q || (x.label + ' ' + x.hint + ' ' + x.gname).toLowerCase().indexOf(q) > -1; });
        if (sel >= items.length) sel = Math.max(items.length - 1, 0);
        if (!items.length) { list.innerHTML = '<p class="dialog__note">' + t('palette.empty') + '</p>'; input.removeAttribute('aria-activedescendant'); return; }
        var g = null, h = '';
        items.forEach(function (x, i) {
          if (x.gname !== g) { g = x.gname; h += '<div class="opt-group" role="presentation">' + g + '</div>'; }
          h += '<div class="opt" role="option" id="po-' + i + '" data-i="' + i + '" aria-selected="' + (i === sel) + '"><span class="opt__key" style="min-width:0">' + esc(x.label) + '</span><span class="opt__desc" style="text-align:right">' + esc(x.hint) + '</span></div>';
        });
        list.innerHTML = h; input.setAttribute('aria-activedescendant', 'po-' + sel); keepVisible(list, $('#po-' + sel));
      }
      function run(i) { var x = items[i]; if (!x) return; closeDialog(); x.run(); }
      input.addEventListener('input', function () { sel = 0; draw(); });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(items.length, 1); draw(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + items.length) % Math.max(items.length, 1); draw(); }
        else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
      });
      list.addEventListener('click', function (e) { var o = e.target.closest('[data-i]'); if (o) run(+o.getAttribute('data-i')); });
      list.addEventListener('mousemove', function (e) { var o = e.target.closest('[data-i]'); if (o && +o.getAttribute('data-i') !== sel) { sel = +o.getAttribute('data-i'); draw(); } });
      draw(); setTimeout(function () { input.focus(); }, 0);
    });
  }
  function openThemes() {
    var ids = ['system'].concat(SKIN_IDS), sel = Math.max(ids.indexOf(state.choice), 0);
    openDialog('themes', t('themes.title'), function (body) {
      body.innerHTML = '<p class="dialog__note">' + t('themes.note') + '</p><div class="dialog__list" id="th-list" role="listbox" tabindex="0" aria-label="' + esc(t('themes.title')) + '"></div>' +
        '<div class="dialog__hint" aria-hidden="true"><span>↑↓ ' + t('themes.hMove') + '</span><span>↵ ' + t('themes.hApply') + '</span><span>esc ' + t('themes.hCancel') + '</span></div>';
      var list = $('#th-list');
      function draw() {
        list.innerHTML = ids.map(function (id, i) {
          return '<div class="opt" role="option" id="to-' + i + '" data-i="' + i + '" aria-selected="' + (i === sel) + '">' + swatchHtml(id) + '<span class="opt__key" style="min-width:18ch">' + skinName(id) + '</span><span class="opt__desc">' + esc(skinDesc(id)) + '</span>' + (id === state.choice ? '<span class="opt__end">● ' + t('ui.current') + '</span>' : '') + '</div>';
        }).join('');
        list.setAttribute('aria-activedescendant', 'to-' + sel); keepVisible(list, $('#to-' + sel));
      }
      function preview() { applySkin(skinFor(ids[sel]), false); draw(); }
      function commit() { dlg.commit = true; setChoice(ids[sel]); closeDialog(); setStatus('✓ ' + t('palette.themePrefix') + skinName(ids[sel]), false, 2400); }
      list.addEventListener('keydown', function (e) {
        var n = sel;
        if (e.key === 'ArrowDown') n = (sel + 1) % ids.length; else if (e.key === 'ArrowUp') n = (sel - 1 + ids.length) % ids.length;
        else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = ids.length - 1;
        else if (e.key === 'Enter') { e.preventDefault(); commit(); return; } else return;
        e.preventDefault(); sel = n; preview();
      });
      list.addEventListener('click', function (e) { var o = e.target.closest('[data-i]'); if (o) { sel = +o.getAttribute('data-i'); commit(); } });
      list.addEventListener('mousemove', function (e) {
        if (!matchMedia('(hover: hover)').matches) return;
        var o = e.target.closest('[data-i]'); if (o && +o.getAttribute('data-i') !== sel) { sel = +o.getAttribute('data-i'); preview(); }
      });
      draw(); setTimeout(function () { list.focus(); }, 0);
    });
  }
  function openHelp() {
    openDialog('help', t('help.title'), function (body) {
      var rows = function (r, dim) { return r.map(function (x) { return '<span class="kbd"' + (dim ? ' style="opacity:.5"' : '') + '>' + withKey(x[0]) + '</span><span' + (dim ? ' class="muted"' : '') + '>' + x[1] + '</span>'; }).join(''); };
      function draw() {
        body.innerHTML = '<button type="button" class="switch" role="switch" id="keys-switch" aria-checked="' + state.keys + '"><span>' + t('help.toggle') + '</span><span class="switch__state" aria-hidden="true">' + t(state.keys ? 'help.on' : 'help.off') + '</span></button>' +
          '<div class="helptable"><p class="helptable__note">' + t('help.toggleNote') + '</p>' +
          '<h3>' + t('help.always') + '</h3>' + rows(t('help.alwaysRows')) +
          '<h3>' + t('help.single') + '</h3>' + rows(t('help.singleRows'), !state.keys) +
          '<h3>' + t('help.inPrompt') + '</h3>' + rows(t('help.prompt')) + '</div>';
        $('#keys-switch').addEventListener('click', function () {
          state.keys = !state.keys; store.set('tui.keys', state.keys ? 'on' : 'off');
          setStatus(''); draw(); $('#keys-switch').focus();
        });
      }
      draw(); setTimeout(function () { $('#keys-switch').focus(); }, 0);
    });
  }

  /* ========================================================================
     GLOBAL: click delegation + keyboard shortcuts
     ======================================================================== */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (a && (location.hash || '').slice(1) === a.getAttribute('href').slice(1)) { e.preventDefault(); route(true); }
    var act = e.target.closest('[data-act]');
    if (act) {
      var v = act.getAttribute('data-act');
      if (v === 'themes') openThemes(); else if (v === 'palette') openPalette(); else if (v === 'help') openHelp();
      else if (v.indexOf('cmd:') === 0) runKey(v.slice(4));
    }
    var g = e.target.closest('[data-goto]'); if (g) navTo(g.getAttribute('data-goto'));
    if (e.target.closest('[data-copy-email]')) copyEmail();
    var sp = e.target.closest('[data-skin-pick]'); if (sp) setChoice(sp.getAttribute('data-skin-pick'));
    if (e.target.closest('[data-dlg-close]')) closeDialog();
  });
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if (dlg.open && dlg.type === 'palette') closeDialog(); else openPalette(); return; }
    if (e.key === 'Escape') {
      if (dlg.open) { closeDialog(); return; }
      if (!menu.hidden) { closeMenu(); return; }
      if (document.activeElement === cmd) cmd.blur();
      return;
    }
    if (dlg.open) { if (e.key === 'Tab') trapTab(e); return; }
    /* Single-key shortcuts: switchable in the help dialog (WCAG 2.1.4), never while typing
       or inside widgets that use letter or arrow keys themselves. */
    if (!state.keys) return;
    var tag = e.target.tagName, typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable;
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest && e.target.closest('[role="listbox"], [role="tablist"], [role="radiogroup"]')) return;
    switch (e.key) {
      case '/': e.preventDefault(); focusPrompt('/'); break;
      case '?': e.preventDefault(); openHelp(); break;
      case 't': openThemes(); break;
      case 'l': setLang(state.lang === 'en' ? 'es' : 'en'); break;
      case 'j': step(1); break;
      case 'k': step(-1); break;
    }
  });

  /* ========================================================================
     MOTION: hero typed line + scroll reveal
     ======================================================================== */
  function typeHero() {
    var el = $('#typed'), full = t('hero.role'), mark = $('#boot-mark');
    if (reduced.matches) { el.textContent = full; return; }
    /* loading: Braille spinner in the welcome box title, resting on ⠚, then hidden */
    var f = 0;
    mark.textContent = SPIN[0]; mark.hidden = false;
    var spin = setInterval(function () { f = (f + 1) % SPIN.length; mark.textContent = SPIN[f]; }, 80);
    var done = function () {
      clearInterval(spin); mark.textContent = MARK;
      setTimeout(function () { mark.hidden = true; mark.textContent = ''; }, 450);
    };
    var i = 0; el.textContent = '';
    (function stepType() {
      if (full !== t('hero.role')) { el.textContent = t('hero.role'); done(); return; }
      el.textContent = full.slice(0, ++i);
      if (i < full.length) setTimeout(stepType, 26 + Math.random() * 30); else done();
    })();
  }
  function setupReveal() {
    if (reduced.matches || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.remove('is-pending'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('#view-home .reveal').forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add('is-pending'); io.observe(el); }
    });
  }

  /* ========================================================================
     BOOT
     ======================================================================== */
  $$('[data-href]').forEach(function (a) { a.href = SITE.links[a.getAttribute('data-href')]; });
  $('#email-link').href = 'mailto:' + SITE.email;
  root.setAttribute('lang', state.lang);
  applyI18n(document); renderAll(); applyMeta(); setStatus('');
  route(!!(location.hash || '').slice(1), true);
  typeHero(); setupReveal();
})();
</script>
