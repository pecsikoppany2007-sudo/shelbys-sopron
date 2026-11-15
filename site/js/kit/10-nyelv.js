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
