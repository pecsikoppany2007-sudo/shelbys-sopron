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
