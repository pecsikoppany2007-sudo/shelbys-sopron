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
