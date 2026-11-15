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
