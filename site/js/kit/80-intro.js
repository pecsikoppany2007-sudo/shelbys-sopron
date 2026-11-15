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
