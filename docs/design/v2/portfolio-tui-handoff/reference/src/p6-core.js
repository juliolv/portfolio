
  /* ========================================================================
     CORE: helpers, state, storage
     ======================================================================== */
  var root = document.documentElement;
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
  var KEY = isMac ? '⌘K' : 'Ctrl K';
  var touch = matchMedia('(hover: none) and (pointer: coarse)').matches;
  var GLYPH = { done: '●', progress: '◐', planned: '○' };
  var SECTIONS = ['top', 'work', 'devlog', 'experience', 'stack', 'about', 'contact'];
  var state = {
    lang: (function () {
      var s = store.get('tui.lang');
      if (s === 'en' || s === 'es') return s;
      return /^es\b/i.test(navigator.language || '') ? 'es' : 'en';
    })(),
    choice: (function () { var s = store.get('tui.skin'); return SKIN_IDS.indexOf(s) > -1 ? s : 'system'; })(),
    keys: store.get('tui.keys') !== 'off',
    view: 'home', section: 'top', open: { 0: true }, hist: [], hi: -1, asks: 0
  };
  function t(key) {
    var v = key.split('.').reduce(function (o, p) { return o == null ? o : o[p]; }, I18N[state.lang]);
    return v == null ? key : v;
  }
  function fmt(s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function withKey(s) { return s.replace('{k}', KEY); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function behavior() { return reduced.matches ? 'auto' : 'smooth'; }

  /* ========================================================================
     COMPONENT: skins (color themes). Any element with data-skin previews one.
     ======================================================================== */
  function systemSkin() {
    var ht = root.getAttribute('data-theme');
    if (ht === 'light') return 'ayu-light';
    if (ht === 'dark') return 'ayu-dark';
    return matchMedia('(prefers-color-scheme: light)').matches ? 'ayu-light' : 'ayu-dark';
  }
  function skinName(id) { if (id === 'system') return 'system'; for (var i = 0; i < SKINS.length; i++) if (SKINS[i].id === id) return SKINS[i].name; return id; }
  function skinDesc(id) {
    if (id === 'system') return t('themes.desc.system');
    var s = SKINS.filter(function (x) { return x.id === id; })[0];
    return t('themes.' + s.kind) + ' · ' + s.by;
  }
  function skinFor(choice) { return choice === 'system' ? systemSkin() : choice; }
  function applySkin(name, anim) {
    if (anim && !reduced.matches) {
      root.classList.add('theme-anim');
      setTimeout(function () { root.classList.remove('theme-anim'); }, 320);
    }
    root.setAttribute('data-skin', name);
    if (state.view === 'system') renderSwatches();
  }
  function syncSkinUI() {
    $('#skin-name').textContent = skinName(state.choice);
    $$('[data-skin-pick]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-skin-pick') === state.choice ? 'true' : 'false'); });
  }
  function setChoice(choice) {
    state.choice = choice; store.set('tui.skin', choice);
    applySkin(skinFor(choice), true); syncSkinUI();
  }
  try { matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () { if (state.choice === 'system') applySkin(systemSkin(), true); }); } catch (e) {}
  try {
    new MutationObserver(function () { if (state.choice === 'system') applySkin(systemSkin(), true); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  } catch (e) {}
  function swatchHtml(id) {
    if (id === 'system') {
      return '<span class="sw" aria-hidden="true">' + ['ayu-dark', 'ayu-light'].map(function (s) {
        return '<i data-skin="' + s + '" style="background:var(--bg)"></i><i data-skin="' + s + '" style="background:var(--accent)"></i>';
      }).join('') + '</span>';
    }
    return '<span class="sw" data-skin="' + id + '" aria-hidden="true"><i style="background:var(--bg)"></i><i style="background:var(--panel)"></i><i style="background:var(--accent)"></i><i style="background:var(--ok)"></i><i style="background:var(--warn)"></i></span>';
  }

  /* ========================================================================
     COMPONENT: i18n applier
     ======================================================================== */
  function applyI18n(scope) {
    $$('[data-i18n]', scope).forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    $$('[data-i18n-attr]', scope).forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var p = pair.split(':'); el.setAttribute(p[0], t(p[1]));
      });
    });
  }

  /* ========================================================================
     COMPONENT: status line (message + one-shot spinner)
     ======================================================================== */
  /* Braille spinner; the mark ⠚ is the letter j in Braille and is the resting frame. */
  var stTimer, spinTimer, MARK = '⠚', SPIN = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  function setStatus(msg, spin, ms) {
    var el = $('#st-msg');
    clearTimeout(stTimer); clearInterval(spinTimer);
    el.classList.toggle('is-hint', !msg);
    if (!msg) { el.textContent = touch ? t('ui.hintTouch') : withKey(t(state.keys ? 'ui.hint' : 'ui.hintOff')); return; }
    if (spin) {
      var i = 0;
      el.innerHTML = '<span class="spin" aria-hidden="true">' + (reduced.matches ? MARK : SPIN[0]) + '</span> ' + esc(msg);
      if (!reduced.matches) {
        spinTimer = setInterval(function () { i = (i + 1) % SPIN.length; var s = el.querySelector('.spin'); if (s) s.textContent = SPIN[i]; }, 80);
      }
    } else el.textContent = msg;
    if (ms) stTimer = setTimeout(function () { setStatus(''); }, ms);
  }

  /* ========================================================================
     COMPONENT: copy email, external links
     ======================================================================== */
  function copyEmail() {
    var done = function () { setStatus('✓ ' + t('ui.copied') + ' ' + SITE.email, false, 3200); };
    var fail = function () {
      var r = document.createRange(); r.selectNodeContents($('#email-text'));
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      setStatus(t('ui.copyFailed'), false, 3200);
    };
    try { navigator.clipboard.writeText(SITE.email).then(done, fail); } catch (e) { fail(); }
  }
  function openExternal(url) {
    var a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
  }
