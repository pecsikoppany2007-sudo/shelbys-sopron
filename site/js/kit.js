/* A beallit.py fűzi össze a js/kit/ modulokból, ne kézzel szerkeszd. */
/* Alapkészlet: közös segédek. Minden modul a window.KIT-re épül, a beállítás a window.OLDAL-ban van (oldal.js, a beallit.py írja). */
(function () {
  'use strict';
  var html = document.documentElement;
  var K = window.KIT = window.KIT || {};
  K.html = html;
  K.cfg = window.OLDAL || {};
  K.$ = function (s, r) { return (r || document).querySelector(s); };
  K.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  K.esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  /* egér vagy érintő: érintőn semmi nem követi a görgetést (web-motion-lessons) */
  K.canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  K.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!K.canHover) html.classList.add('is-touch');
  if (K.reduced) html.classList.add('no-anim');
  /* valódi GPU? a szoftveres (SwiftShader, llvmpipe) gépen a nehéz WebGL-t kihagyjuk */
  K.hwGpu = function () {
    if (K._gpu != null) return K._gpu;
    try {
      var c = document.createElement('canvas'), g = c.getContext('webgl');
      if (!g) return (K._gpu = false);
      var ext = g.getExtension('WEBGL_debug_renderer_info');
      var r = ext ? String(g.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
      var lose = g.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
      return (K._gpu = !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(r));
    } catch (e) { return (K._gpu = false); }
  };
  /* budapesti idő Intl nélkül (az Intl timeZone lassú telefonon ~100 ms): EU nyári időszámítás szabálya */
  function lastSun(y, m) { var d = new Date(Date.UTC(y, m + 1, 0)); return d.getUTCDate() - d.getUTCDay(); }
  K.bud = function () {
    var n = Date.now(), y = new Date(n).getUTCFullYear();
    var s = Date.UTC(y, 2, lastSun(y, 2), 1), e = Date.UTC(y, 9, lastSun(y, 9), 1);
    var b = new Date(n + ((n >= s && n < e) ? 2 : 1) * 3600000);
    return { d: b.getUTCDay(), m: b.getUTCHours() * 60 + b.getUTCMinutes(), t: b.getTime() };
  };
  K.store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  /* csak valódi méretváltásnál mérünk újra (a telefon címsora is küld resize-t) */
  var subs = [], lw = innerWidth, lh = innerHeight;
  K.onResize = function (f) { subs.push(f); };
  addEventListener('resize', function () {
    if (innerWidth === lw && Math.abs(innerHeight - lh) <= 160) return;
    lw = innerWidth; lh = innerHeight; subs.forEach(function (f) { f(); });
  });
})();

/* Nyelvváltó: a magyar szöveg a HTML-ben van (data-i18n="kulcs"), a többi a szovegek.js-ben (window.SZOVEG = { de: {...}, en: {...} }).
   Indulás: elmentett választás, különben a böngésző első hu/de/en nyelve, különben angol. Élő váltás = friss betöltés eredménye. */
(function () {
  'use strict';
  var K = window.KIT, T = window.SZOVEG || {}, langs = K.cfg.nyelvek || ['hu'];
  var key = (K.cfg.rovid || 'oldal') + '-lang', hu = {}, subs = [];
  K.$$('[data-i18n]').forEach(function (el) { hu[el.getAttribute('data-i18n')] = el.innerHTML; });
  K.$$('[data-i18n-attr]').forEach(function (el) {
    el.getAttribute('data-i18n-attr').split(',').forEach(function (p) { var a = p.split(':'); hu[a[1]] = el.getAttribute(a[0]); });
  });
  /* magyarban nem törő szóköz a névelő és a rövid kötőszó után */
  function nb(s) { return K.lang === 'hu' ? String(s).replace(/(^|[\s(„>])(a|az|A|Az|és|is|s) /g, '$1$2 ') : s; }
  K.t = function (k) { var d = T[K.lang] || {}; return nb(k in d ? d[k] : (k in hu ? hu[k] : '')); };
  /* [hu, de, en] tömbből a mostani nyelv */
  K.L = function (a) { if (a == null) return ''; if (typeof a === 'string') return nb(a); var i = langs.indexOf(K.lang); return nb(a[i] != null && a[i] !== '' ? a[i] : a[0]); };
  K.onLang = function (f) { subs.push(f); };
  K.setLang = function (l, save) {
    K.lang = langs.indexOf(l) > -1 ? l : langs[0];
    K.html.lang = K.lang;
    K.$$('[data-i18n]').forEach(function (el) { var v = K.t(el.getAttribute('data-i18n')); if (el.innerHTML !== v) el.innerHTML = v; });
    K.$$('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(',').forEach(function (p) { var a = p.split(':'); el.setAttribute(a[0], K.t(a[1])); });
    });
    K.$$('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === K.lang)); });
    if (T[K.lang] && T[K.lang]._title) document.title = T[K.lang]._title; else if (hu._title) document.title = hu._title;
    if (save) K.store.set(key, K.lang);
    subs.forEach(function (f) { f(K.lang); });
    K.html.classList.remove('lang-pending');
  };
  var t = K.$('title'); if (t) hu._title = t.textContent;
  var start = K.store.get(key);
  if (!start || langs.indexOf(start) < 0) {
    var nl = (navigator.languages || [navigator.language || 'hu']).map(function (x) { return String(x).slice(0, 2); });
    start = nl.filter(function (x) { return langs.indexOf(x) > -1; })[0] || (langs.indexOf('en') > -1 ? 'en' : langs[0]);
  }
  K.lang = start;
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-lang]');
    if (b) { e.preventDefault(); K.setLang(b.getAttribute('data-lang'), true); }
  });
})();

/* Puha görgetés (a Cafe Flow v2 érzése, kopi "smooth" szava): egérrel Lenis, lassabb, puhább kerék; érintőn natív görgetés.
   A Lenis a GSAP órájáról fut, a ScrollTrigger vele frissül. Belső linkek a címre érkeznek (offset = fejléc). */
(function () {
  'use strict';
  var K = window.KIT;
  K.lenis = null;
  K.startSmooth = function (opt) {
    opt = opt || {};
    if (!K.canHover || K.reduced || !window.Lenis) return null;
    var l = new Lenis({ lerp: opt.lerp || 0.085, wheelMultiplier: opt.wheel || 0.9, smoothWheel: true });
    K.lenis = l;
    if (window.gsap) {
      if (window.ScrollTrigger) l.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { l.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { l.raf(t); requestAnimationFrame(raf); })(performance.now());
    }
    return l;
  };
  /* horgonylinkek: Lenis-szel puhán, nélküle natívan; mindig a fejléc alá */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-nosmooth')) return;
    var id = a.getAttribute('href'); if (id.length < 2 && id !== '#') return;
    var el = id === '#' || id === '#top' ? 0 : document.getElementById(id.slice(1));
    if (el === null) return;
    e.preventDefault();
    var off = -(parseFloat(getComputedStyle(K.html).getPropertyValue('--fejlec')) || 70);
    if (K.lenis) K.lenis.scrollTo(el, { offset: el === 0 ? 0 : off, duration: 1.6 });
    else scrollTo({ top: el === 0 ? 0 : el.getBoundingClientRect().top + scrollY + off, behavior: K.reduced ? 'auto' : 'smooth' });
    if (el && el.focus) { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); }
    history.replaceState(null, '', id);
  });
})();

/* Kurzor (csak egérrel): kis pont, linkek fölött nagyobb gyűrű, fotón pötty; mögötte lomhán követő halvány fény ("lámpa").
   Szín: --kurzor és --kurzor-feny a CSS-ben. Egyedi állapot: data-cur="light|photo|szoveg" bármelyik elemen. */
(function () {
  'use strict';
  var K = window.KIT;
  K.startCursor = function (opt) {
    opt = opt || {};
    if (!K.canHover || K.cursor) return;
    var cur = document.createElement('div'); cur.className = 'kurzor'; cur.setAttribute('aria-hidden', 'true');
    var lamp = opt.lamp === false ? null : document.createElement('div');
    document.body.appendChild(cur);
    if (lamp) { lamp.className = 'kurzor-feny'; lamp.setAttribute('aria-hidden', 'true'); document.body.appendChild(lamp); }
    K.cursor = cur;
    var tx = -100, ty = -100, cx = -100, cy = -100, gx = -400, gy = -400, raf = 0, seen = false;
    var k0 = K.reduced ? 1 : 0.2, kg0 = K.reduced ? 1 : 0.085, last = 0;
    /* képkocka-független lerp (14islands/lerp ötlete): 120 Hz-es kijelzőn sem lesz gyorsabb, 30 Hz-en sem lomhább */
    function fr(k, dt) { return 1 - Math.pow(1 - k, dt / 16.667); }
    function loop(now) {
      var dt = last ? Math.min(64, now - last) : 16.667; last = now;
      var k = fr(k0, dt), kg = fr(kg0, dt);
      cx += (tx - cx) * k; cy += (ty - cy) * k;
      cur.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      if (lamp) { gx += (tx - gx) * kg; gy += (ty - gy) * kg; lamp.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px,0)'; }
      var d = Math.abs(tx - cx) + Math.abs(ty - cy) + (lamp ? Math.abs(tx - gx) + Math.abs(ty - gy) : 0);
      raf = d > 0.15 ? requestAnimationFrame(loop) : (last = 0);
    }
    document.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!seen) { seen = true; cx = gx = tx; cy = gy = ty; K.html.classList.add('van-kurzor'); cur.classList.add('is-on'); if (lamp) lamp.classList.add('is-on'); }
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    var photoSel = opt.photo || 'img, picture, [data-cur="photo"]';
    document.addEventListener('mouseover', function (e) {
      var el = e.target; if (!el.closest) return;
      var link = !!el.closest('a, button, [role="tab"], [role="radio"], label, summary');
      var tag = el.closest('[data-cur]'), st = tag ? tag.getAttribute('data-cur') : '';
      cur.classList.toggle('is-link', link);
      cur.classList.toggle('is-photo', !link && (st === 'photo' || !!el.closest(photoSel)));
      cur.classList.toggle('is-light', st === 'light'); if (lamp) lamp.classList.toggle('is-light', st === 'light');
      cur.classList.toggle('is-text', !link && !!el.closest('input, textarea, [contenteditable]'));
    });
    K.html.addEventListener('mouseleave', function () { cur.classList.remove('is-on'); if (lamp) lamp.classList.remove('is-on'); });
    K.html.addEventListener('mouseenter', function () { if (seen) { cur.classList.add('is-on'); if (lamp) lamp.classList.add('is-on'); } });
  };
})();

/* Címek sorokra bontva (.bl): soronként csúsznak be maszk mögül, amikor tényleg látszanak (~84% a képernyőn).
   overflow: clip + clip-margin, hogy az ékezet és a g/j ne vágódjon (a "Társaságokn" hiba, web-test-lessons). Nyelvváltáskor újrabont. */
(function () {
  'use strict';
  var K = window.KIT;
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -16% 0px' }) : null;
  K.splitLines = function (root) {
    K._lines = true;
    K.$$('.bl', root).forEach(function (h) {
      var src = h.hasAttribute('data-bl-src') ? h.getAttribute('data-bl-src') : h.textContent;
      var tx = src.replace(/\s+/g, ' ').trim();
      h.setAttribute('data-bl-src', tx); h.setAttribute('aria-label', tx);
      h.innerHTML = tx.split(' ').map(function (w) { return '<span class="w">' + K.esc(w) + '</span>'; }).join(' ');
      var lines = [], top = null;
      K.$$('.w', h).forEach(function (w) { var o = w.offsetTop; if (top === null || Math.abs(o - top) > 4) { lines.push([]); top = o; } lines[lines.length - 1].push(w.textContent); });
      h.innerHTML = lines.map(function (l, i) { return '<span class="ln" aria-hidden="true" style="--l:' + i + '"><span class="ln__i">' + K.esc(l.join(' ')) + '</span></span>'; }).join('');
      if (K.reduced || !io) h.classList.add('is-in');
      else if (!h.classList.contains('is-in') && !h.hasAttribute('data-bl-kezi')) io.observe(h);
    });
  };
  /* nyelvváltáskor a data-i18n frissíti a szöveget: a forrást töröljük, hogy az új szöveg bontódjon */
  K.onLang(function () {
    if (!K._lines) return;
    K.$$('.bl').forEach(function (h) { if (h.hasAttribute('data-i18n')) h.removeAttribute('data-bl-src'); });
    K.splitLines();
  });
  K.onResize(function () { if (K._lines) K.splitLines(); });
})();

/* Függőlámpák (Darling v2): a .lampas címek fölé lámpa kerül, és amikor a cím a képbe ér, vibrálva felkapcsol, fénykúppal.
   Csak CSS animáció (lampOn), a lefutás után az is-on osztály leveszi a külön réteget. Szín: --lampa a CSS-ben. */
(function () {
  'use strict';
  var K = window.KIT;
  var HTML = '<span class="lampa" aria-hidden="true"><svg viewBox="0 0 40 20"><path class="lampa__bura" d="M20 1.5c-3 0-5 2-5.6 4.6C8.2 7 3 11.4 1.5 18.5h37C37 11.4 31.8 7 25.6 6.1 25 3.5 23 1.5 20 1.5z"/></svg><i class="lampa__izzo"></i><i class="lampa__kup"></i></span>';
  var io = 'IntersectionObserver' in window && !K.reduced ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (!e.isIntersecting) return; io.unobserve(e.target); e.target.setAttribute('data-ego', ''); var l = e.target.querySelector('.lampa'); if (l) l.classList.add('is-lit'); });
  }, { rootMargin: '0px 0px -22% 0px' }) : null;
  K.hangLamps = function () {
    K._lamps = true;
    K.$$('.lampas').forEach(function (h) {
      if (h.querySelector('.lampa')) return;
      h.insertAdjacentHTML('beforeend', HTML.replace('lampa"', 'lampa' + (h.hasAttribute('data-ego') || !io ? ' is-on' : '') + '"'));
      if (io && !h.hasAttribute('data-ego')) io.observe(h);
    });
  };
  document.addEventListener('animationend', function (e) {
    if (e.animationName === 'lampOn' && e.target.classList.contains('lampa__kup')) e.target.parentNode.classList.add('is-on');
  });
  K.onLang(function () { if (K._lamps) K.hangLamps(); });
})();

/* Nyitvatartás: táblázat + "most nyitva" sor budapesti idő szerint. OLDAL.nyitvatartas: 7 pár, vasárnappal kezdve; 25:30 = éjjel fél kettő.
   OLDAL.kivetelek: { "2026-12-24": ["10:00","14:00"], "2026-12-25": ["",""] } = ünnepnap, rendkívüli nyitvatartás (a táblázat alatt is megjelenik). */
(function () {
  'use strict';
  var K = window.KIT, W = K.cfg.nyitvatartas, X = K.cfg.kivetelek || {};
  if (!W) return;
  function ymd(t) { return new Date(t).toISOString().slice(0, 10); }
  /* a mai naptól i nappal későbbi nap nyitvatartása (kivétel > heti rend) */
  function day(b, i) { var k = ymd(b.t + i * 864e5); return X[k] || W[(b.d + i + 7) % 7]; }
  var DAYS = [['vasárnap', 'Sonntag', 'Sunday'], ['hétfő', 'Montag', 'Monday'], ['kedd', 'Dienstag', 'Tuesday'], ['szerda', 'Mittwoch', 'Wednesday'], ['csütörtök', 'Donnerstag', 'Thursday'], ['péntek', 'Freitag', 'Friday'], ['szombat', 'Samstag', 'Saturday']];
  K.DAYS = DAYS;
  function mins(s) { if (!s) return -1; var p = s.split(':'); return +p[0] * 60 + +p[1]; }
  function hm(s) { var m = mins(s) % 1440; return Math.floor(m / 60) + ':' + ('0' + m % 60).slice(-2); }
  K.openStatus = function () {
    var b = K.bud(), h = day(b, 0), hy = day(b, -1);
    if (hy[1] && mins(hy[1]) > 1440 && b.m < mins(hy[1]) - 1440) return { open: true, till: hy[1] };
    if (h[0] && b.m >= mins(h[0]) && b.m < mins(h[1])) return { open: true, till: h[1] };
    if (h[0] && b.m < mins(h[0])) return { open: false, when: 0, at: h[0] };
    for (var i = 1; i < 15; i++) { var n = day(b, i); if (n[0]) return { open: false, when: i, at: n[0], day: (b.d + i) % 7 }; }
    return { open: false, when: -1 };
  };
  function render() {
    var tb = K.$('[data-nyitvatartas] tbody');
    if (tb) {
      var b = K.bud();
      tb.innerHTML = [1, 2, 3, 4, 5, 6, 0].map(function (d) {
        var h = W[d], v = h[0] ? hm(h[0]) + '–' + hm(h[1]) : K.L(['zárva', 'geschlossen', 'closed']);
        return '<tr' + (d === b.d ? ' class="is-ma"' : '') + '><th scope="row">' + K.esc(K.L(DAYS[d])) + '</th><td>' + v + '</td></tr>';
      }).join('');
    }
    /* közelgő kivételek (a következő 21 napban) a táblázat alatt */
    var kx = K.$('[data-kivetelek]');
    if (kx) {
      var b2 = K.bud(), now = ymd(b2.t), lim = ymd(b2.t + 21 * 864e5);
      var up = Object.keys(X).sort().filter(function (k) { return k >= now && k <= lim; });
      kx.hidden = !up.length;
      kx.innerHTML = up.map(function (k) {
        var p = k.split('-'), dd = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).getUTCDay(), v = X[k];
        var dt = K.L([p[1].replace(/^0/, '') + '. ' + p[2].replace(/^0/, '') + '.', +p[2] + '.' + +p[1] + '.', +p[2] + '/' + +p[1]]);
        return '<li>' + K.esc(dt + ' ' + K.L(DAYS[dd])) + ': ' + (v[0] ? hm(v[0]) + '–' + hm(v[1]) : K.esc(K.L(['zárva', 'geschlossen', 'closed']))) + '</li>';
      }).join('');
    }
    var el = K.$('[data-most]'); if (!el) return;
    var s = K.openStatus(), txt;
    if (s.open) txt = K.L(['Most nyitva, ' + hm(s.till) + '-ig', 'Jetzt geöffnet, bis ' + hm(s.till), 'Open now, until ' + hm(s.till)]);
    else if (s.when === 0) txt = K.L(['Ma ' + hm(s.at) + '-kor nyitunk', 'Heute ab ' + hm(s.at), 'Opens today at ' + hm(s.at)]);
    else if (s.when === 1) txt = K.L(['Holnap ' + hm(s.at) + '-kor nyitunk', 'Morgen ab ' + hm(s.at), 'Opens tomorrow at ' + hm(s.at)]);
    else if (s.when > 1) txt = K.L([DAYS[s.day][0].replace(/^./, function (c) { return c.toUpperCase(); }) + ' ' + hm(s.at) + '-kor nyitunk', DAYS[s.day][1] + ' ab ' + hm(s.at), 'Opens ' + DAYS[s.day][2] + ' at ' + hm(s.at)]);
    else txt = '';
    el.textContent = txt; el.classList.toggle('is-open', !!s.open);
  }
  K.renderHours = render;
  K.onLang(render);
  setInterval(render, 60000);
})();

/* Apróságok, amik minden oldalon kellenek: mobil menü, térkép csak kattintásra (süti-mentes alap), lap címe, ha elnavigálsz. */
(function () {
  'use strict';
  var K = window.KIT;
  /* mobil menü: gomb + aria-expanded, Esc zár, linkre zár */
  var burger = K.$('[data-menu-gomb]'), nav = K.$('[data-menu]');
  if (burger && nav) {
    var set = function (o) { burger.setAttribute('aria-expanded', String(o)); K.html.classList.toggle('menu-nyitva', o); if (K.lenis) o ? K.lenis.stop() : K.lenis.start(); };
    burger.addEventListener('click', function () { set(burger.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { set(false); burger.focus(); } });
  }
  /* térkép, videó, Instagram: a külső szolgáltató csak a gombnyomás után töltődik be (GDPR; a jogi oldal ezt írja le).
     <div data-terkep="https://www.google.com/maps?q=...&output=embed"> vagy <div data-beagyazas="https://www.youtube-nocookie.com/embed/ID">
     benne egy magyarázó mondat és egy <button>. A kapu megbukik, ha bármi kattintás előtt külső szerverhez nyúl. */
  K.$$('[data-terkep], [data-beagyazas]').forEach(function (box) {
    var b = box.querySelector('button'); if (!b) return;
    b.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = box.getAttribute('data-terkep') || box.getAttribute('data-beagyazas'); f.title = b.getAttribute('data-cim') || 'Beágyazott tartalom';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.setAttribute('allowfullscreen', '');
      box.innerHTML = ''; box.appendChild(f); box.classList.add('is-betoltve');
    });
  });
  /* kapcsolati űrlap (Netlify Forms): beküldés oldalváltás nélkül, köszönő üzenet a helyén; JS nélkül is működik (sima POST) */
  K.$$('form[data-netlify]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('[type="submit"]'), msg = form.querySelector('[data-urlap-uzenet]');
      if (btn) btn.disabled = true;
      fetch(form.getAttribute('action') || '/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() })
        .then(function (r) { if (!r.ok) throw 0; form.reset(); if (msg) { msg.textContent = K.t('urlapOk') || 'Köszönjük, megkaptuk. Hamarosan válaszolunk.'; msg.hidden = false; msg.focus(); } })
        .catch(function () { if (msg) { msg.textContent = K.t('urlapHiba') || 'Nem sikerült elküldeni. Kérjük, hívjon minket telefonon.'; msg.hidden = false; msg.focus(); } })
        .then(function () { if (btn) btn.disabled = false; });
    });
  });
  /* lap címe, ha másik fülre vált: a hely saját mondata (szovegek.js: _vissza) */
  var base = null;
  document.addEventListener('visibilitychange', function () {
    var away = K.t('_vissza'); if (!away) return;
    if (document.hidden) { base = document.title; document.title = away; } else if (base) document.title = base;
  });
})();

/* Film-intro (Darling v2 receptje, ajtó nélkül, mert kopi nem szereti a nyitó/ajtós felfedést):
   sötétben gépelt felirat a hely címével, alatta a mostani nap és budapesti idő, filmfelirat, aztán a fény vibrálva felkapcsol,
   és a mozivászon csíkjai elhúzódnak. Munkamenetenként egyszer; kattintás, billentyű, görgetés vagy koppintás kihagyja.
   A <head> inline szkriptje teszi fel az intro-on osztályt, így nincs villanás. Csak WAAPI transform/opacity. */
(function () {
  'use strict';
  var K = window.KIT, C = K.cfg.intro || {};
  K.introKey = (K.cfg.rovid || 'oldal') + '-intro';
  K.runIntro = function (done) {
    var el = K.$('#intro');
    if (!el || !K.html.classList.contains('intro-on') || !el.animate) {
      if (el) el.parentNode.removeChild(el);
      K.html.classList.remove('intro-on'); done(); return;
    }
    try { sessionStorage.setItem(K.introKey, '1'); } catch (e) {}
    var b = K.bud(), hh = Math.floor(b.m / 60), mm = ('0' + b.m % 60).slice(-2);
    var l1 = K.L(C.sor1 || K.cfg.cim || '');
    var day = K.DAYS ? K.L(K.DAYS[b.d]) : '';
    K.$('.intro__l1', el).innerHTML = l1.split('').map(function (c) { return '<b>' + (c === ' ' ? '&nbsp;' : K.esc(c)) + '</b>'; }).join('');
    K.$('.intro__l2', el).textContent = (K.lang === 'hu' ? day : day.replace(/^./, function (c) { return c.toUpperCase(); })) + ', ' + hh + ':' + mm;
    K.$('.intro__sub', el).textContent = K.L(C.felirat || '');
    var skipTxt = K.$('.intro__skip', el);
    if (skipTxt) skipTxt.textContent = K.canHover ? K.L(['Kattints a kihagyáshoz', 'Klicken zum Überspringen', 'Click to skip']) : K.L(['Koppints a kihagyáshoz', 'Tippen zum Überspringen', 'Tap to skip']);
    var anims = [], timers = [], finished = false, E = 'cubic-bezier(.16,1,.3,1)', IO = 'cubic-bezier(.77,0,.18,1)';
    function A(x, kf, o) { if (!x) return null; var a = x.animate(kf, Object.assign({ fill: 'both' }, o)); anims.push(a); return a; }
    function T(f, ms) { timers.push(setTimeout(f, ms)); }
    /* 1. gépelt felirat + idő */
    K.$$('.intro__l1 b', el).forEach(function (c, k) { A(c, [{ opacity: 0 }, { opacity: 1 }], { duration: 70, delay: 350 + k * 48, easing: 'linear' }); });
    var t1 = 350 + l1.length * 48;
    A(K.$('.intro__l2', el), [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: t1 + 150, easing: E });
    A(K.$('.intro__cap', el), [{ opacity: 1 }, { opacity: 0 }], { duration: 700, delay: t1 + 1500, easing: 'ease-in' });
    /* 2. filmfelirat */
    var t2 = t1 + 1250;
    A(K.$('.intro__sub', el), [{ opacity: 0 }, { opacity: 1, offset: .12 }, { opacity: 1, offset: .8 }, { opacity: 0 }], { duration: 2300, delay: t2, easing: 'linear' });
    /* 3. a fény bemelegedő izzóként felkapcsol: a sötét fátyol vibrálva eltűnik */
    var t3 = t2 + 1900;
    A(K.$('.intro__sotet', el), [{ opacity: 1 }, { opacity: .45, offset: .07 }, { opacity: .92, offset: .11 }, { opacity: .3, offset: .19 }, { opacity: .8, offset: .23 }, { opacity: 0, offset: .5 }, { opacity: 0 }], { duration: 1600, delay: t3, easing: 'linear' });
    /* 4. a mozivászon csíkjai elhúzódnak */
    A(K.$('.intro__csik--f', el), [{ transform: 'none' }, { transform: 'translateY(-101%)' }], { duration: 1300, delay: t3 + 900, easing: IO });
    var last = A(K.$('.intro__csik--a', el), [{ transform: 'none' }, { transform: 'translateY(101%)' }], { duration: 1300, delay: t3 + 900, easing: IO });
    T(finish, t3 + 500);
    function finish() { if (finished) return; finished = true; done(); }
    function cleanup() {
      anims.forEach(function (a) { a.cancel(); });
      K.html.classList.remove('intro-on');
      if (el.parentNode) el.parentNode.removeChild(el);
      removeEventListener('keydown', skip);
    }
    last.onfinish = cleanup;
    T(function () { el.classList.add('is-skip'); }, 1600);
    function skip() {
      if (el.__sk) return; el.__sk = true;
      timers.forEach(clearTimeout); anims.forEach(function (a) { a.pause(); });
      el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, easing: 'ease-out', fill: 'forwards' }).onfinish = cleanup;
      finish();
    }
    el.addEventListener('click', skip); el.addEventListener('wheel', skip, { passive: true }); el.addEventListener('touchstart', skip, { passive: true });
    addEventListener('keydown', skip);
  };
})();

/* Étlap / árlista adatból: data/menu.json (a Decap CMS ezt szerkeszti) vagy egy közzétett Google-táblázat CSV-je (OLDAL.tablazat_csv).
   Táblázat oszlopai: kategoria_hu, kategoria_de, kategoria_en, nev_hu, nev_de, nev_en, leiras_hu, leiras_de, leiras_en, ar
   Először mindig a beégetett JSON jelenik meg (nincs üres lap), a táblázat 4 mp-en belül felülírja, ha elérhető. */
(function () {
  'use strict';
  var K = window.KIT, box = K.$('[data-etlap]');
  K.menuFromCsv = function (t) { return fromRows(csv(t)); };
  if (!box) return;
  var data = null;
  function csv(text) {
    var rows = [], row = [], f = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
      else f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  function fromRows(rows) {
    var head = (rows.shift() || []).map(function (h) { return h.trim().toLowerCase(); });
    var cats = [], by = {};
    rows.forEach(function (r) {
      var g = function (n) { var i = head.indexOf(n); return i > -1 && r[i] != null ? r[i].trim() : ''; };
      if (!g('nev_hu')) return;
      var key = g('kategoria_hu');
      if (!by[key]) { by[key] = { nev: [key, g('kategoria_de'), g('kategoria_en')], tetelek: [] }; cats.push(by[key]); }
      by[key].tetelek.push({ nev: [g('nev_hu'), g('nev_de'), g('nev_en')], leiras: [g('leiras_hu'), g('leiras_de'), g('leiras_en')], ar: g('ar') });
    });
    return { kategoriak: cats };
  }
  function ft(n) { var s = String(n).replace(/\s/g, ''); return /^\d+$/.test(s) ? s.replace(/\B(?=(\d{3})+(?!\d))/g, K.lang === 'en' ? ',' : ' ') + ' Ft' : K.esc(n); }
  function render() {
    if (!data) return;
    box.innerHTML = data.kategoriak.map(function (c) {
      return '<section class="etlap__kat"><h3>' + K.esc(K.L(c.nev)) + '</h3><ul>' + c.tetelek.map(function (t) {
        var d = K.L(t.leiras);
        return '<li><span class="etlap__nev">' + K.esc(K.L(t.nev)) + '</span><span class="etlap__ar">' + (t.ar ? ft(t.ar) : '') + '</span>' + (d ? '<span class="etlap__leiras">' + K.esc(d) + '</span>' : '') + '</li>';
      }).join('') + '</ul></section>';
    }).join('');
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  K.onLang(render);
  fetch(box.getAttribute('data-etlap') || 'data/menu.json').then(function (r) { return r.json(); }).then(function (j) { if (!data) { data = j; render(); } }).catch(function () {});
  var url = K.cfg.tablazat_csv;
  if (url) {
    var ctl = 'AbortController' in window ? new AbortController() : null;
    setTimeout(function () { if (ctl) ctl.abort(); }, 4000);
    fetch(url, ctl ? { signal: ctl.signal, cache: 'no-store' } : {}).then(function (r) { if (!r.ok) throw 0; return r.text(); })
      .then(function (t) { var d = fromRows(csv(t)); if (d.kategoriak.length) { data = d; render(); } }).catch(function () {});
  }
})();
