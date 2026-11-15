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
