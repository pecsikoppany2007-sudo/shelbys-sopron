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
