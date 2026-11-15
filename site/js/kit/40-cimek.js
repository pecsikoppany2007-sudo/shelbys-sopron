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
