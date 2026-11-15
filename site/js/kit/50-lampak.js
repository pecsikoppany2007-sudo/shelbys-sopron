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
