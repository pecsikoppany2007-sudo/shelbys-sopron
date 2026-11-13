/* Shelby's Gin Bar – bemutató oldal.
   GSAP + ScrollTrigger. Egérrel Lenis (lassabb, puhább görgetés), érintőn natív görgetés: ott semmi nem követi az ujjat,
   csak egyszeri, időzített mozgások vannak. A nyitókép fölött egy gin-tonikos pohár lencséje mozog (WebGL), csak valódi GPU-n. */
(function () {
  'use strict';
  var html = document.documentElement;
  if (!window.gsap || !window.ScrollTrigger) { html.classList.remove('intro-on', 'lang-pending'); return; }
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ autoRound: false });

  var canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hwGpu = (function () {
    try {
      var c = document.createElement('canvas'), g = c.getContext('webgl');
      if (!g) return false;
      var ext = g.getExtension('WEBGL_debug_renderer_info');
      var r = ext ? String(g.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
      var lose = g.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
      return !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(r);
    } catch (e) { return false; }
  })();
  var rich = canHover && !reduced && innerWidth >= 1024;
  if (rich) html.classList.add('rich');
  if (reduced) html.classList.add('no-anim');

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  /* ------------------------------------------------------------------ adatok (a bár itallapja alapján) */
  var HOURS = { 0: null, 1: null, 2: ['18:00', '24:00'], 3: ['18:00', '24:00'], 4: ['18:00', '24:00'], 5: ['18:00', '26:00'], 6: ['18:00', '26:00'] };
  var DAYS = [['Vasárnap', 'Sonntag', 'Sunday'], ['Hétfő', 'Montag', 'Monday'], ['Kedd', 'Dienstag', 'Tuesday'], ['Szerda', 'Mittwoch', 'Wednesday'], ['Csütörtök', 'Donnerstag', 'Thursday'], ['Péntek', 'Freitag', 'Friday'], ['Szombat', 'Samstag', 'Saturday']];
  var GINS = [
    ["Hendrick's", ['Rózsaszirom és uborka', 'Rosenblätter und Gurke', 'Rose petals and cucumber'], 2800, 'fulke'],
    ['Gin Mare', ['Rozmaring, bazsalikom, olíva, kakukkfű', 'Rosmarin, Basilikum, Olive, Thymian', 'Rosemary, basil, olive, thyme'], 2800, 'ginmare'],
    ['Brockmans', ['Bogyós gyümölcsök és citrus', 'Beeren und Zitrus', 'Berries and citrus'], 2800, 'gyertya'],
    ['Monkey 47', ['47 féle alapanyag a Fekete-erdőből', '47 Zutaten aus dem Schwarzwald', '47 botanicals from the Black Forest'], 3800, 'monkey'],
    ['Amuerte', ['Kokalevél és papaya', 'Kokablatt und Papaya', 'Coca leaf and papaya'], 4300, 'amuerte'],
    ['Opihr', ['Kardamom, koriander, gyömbér', 'Kardamom, Koriander, Ingwer', 'Cardamom, coriander, ginger'], 2600, 'opihr'],
    ['Nordés', ['Menta, levendula, eukaliptusz', 'Minze, Lavendel, Eukalyptus', 'Mint, lavender, eucalyptus'], 2600, 'kalitka2']
  ];
  var MENU = [
    { k: ['Gin & tonic', 'Gin & Tonic', 'Gin & tonic'], pic: 'levendula', one: true, items: [
      ['Klasszikus', ['London dry gin és tonik', 'London Dry Gin und Tonic', 'London dry gin and tonic'], 2500],
      ['Citrus', ['Citrusos gin és tonik', 'Zitrus-Gin und Tonic', 'Citrus gin and tonic'], 2600],
      ['Ladies Dream', ['Pink gin és wildberry tonik', 'Pink Gin und Wildberry-Tonic', 'Pink gin and wild berry tonic'], 2600],
      ['Virgin', ['Alkoholmentes gin és tonik', 'Alkoholfreier Gin und Tonic', 'Alcohol-free gin and tonic'], 2500]
    ] },
    { k: ['Koktélok', 'Cocktails', 'Cocktails'], pic: 'sour', items: [
      ['Gin Fizz', null, 2400], [['Kotyogós gin-tonik', 'Gin Tonic im Glas', 'Gin and tonic in a jar'], null, 2600], ["Hendrick's Basil Smash", null, 3300],
      ['Gin Gimlet', null, 2200], [['Gin-shot', 'Gin-Shot', 'Gin shot'], ['2 cl', '2 cl', '2 cl'], 900], ['Gentleman Sour', null, 3300],
      ['Cosmopolitan', null, 2700], ['White Lady', null, 2600], ['Daiquiri', null, 2200], ['Cape Codder', null, 2600],
      ['Cucumber Cooler', null, 2600], ['Aperol Spritz', ['Proseccóval', 'mit Prosecco', 'with prosecco'], 2700], ['Hugo', null, 2400], [['Tatratea koktél', 'Tatratea-Cocktail', 'Tatratea cocktail'], null, 2400]
    ] },
    { k: ['Alkoholmentes', 'Alkoholfrei', 'Alcohol-free'], pic: 'buborek', items: [
      [['Limonádé', 'Limonade', 'Lemonade'], ['Lime, bodza vagy málna', 'Limette, Holunder oder Himbeere', 'Lime, elderflower or raspberry'], 1400],
      ['Thomas Henry', ['Tonik', 'Tonic', 'Tonic'], 1200], ['Fever-Tree Indian', ['Tonik', 'Tonic', 'Tonic'], 1200], ['Fever-Tree Mediterranean', ['Tonik', 'Tonic', 'Tonic'], 1200],
      ['Schweppes Wild Berry', null, 800], ['Schweppes Tonic', null, 800], ['Kinley', null, 800],
      ['Special Ice Tea', null, 1200], [['Tőzegáfonya', 'Cranberry', 'Cranberry'], null, 900], ['Coca-Cola', null, 790], ['Red Bull', null, 1200],
      [['Theodora szénsavmentes víz', 'Theodora stilles Wasser', 'Theodora still water'], null, 690]
    ] },
    { k: ['Ételek', 'Essen', 'Food'], pic: 'tal', one: true, items: [
      [['Nachos-tál', 'Nachos-Teller', 'Nachos platter'], null, 2500],
      [['Mediterrán sajttál', 'Mediterraner Käseteller', 'Mediterranean cheese platter'], null, 4500]
    ] }
  ];
  var PICS = { kalitka2: 'Kalitka a pulton a Shelby\'s itallapjai között', fulke: 'Kőfülke gyertyával és ginekkel', ginmare: 'Gin Mare palack rozmaring mellett', gyertya: 'Gyertyatartó és ginek a boltív alatt', monkey: 'Monkey 47 palack', amuerte: 'Amuerte palackok a boltív alatt', opihr: 'Opihr palack és a Shelby\'s itallapja', levendula: 'Levendulás gin-tonik szárított narancskarikával felülről', sour: 'Két zöld koktél bazsalikomlevéllel', buborek: 'Buborékok egy rózsaszín italban, közelről', tal: 'Sajt- és sonkatál a pulton' };

  /* ------------------------------------------------------------------ nyelvek */
  var T = {
    de: {
      skip: 'Zum Inhalt', introSkip: 'Zum Fortfahren klicken', navPince: 'Der Keller', navGin: 'Gins', navMenu: 'Getränkekarte', navHours: 'Öffnungszeiten', menuBtn: 'Menü',
      heroTitle: 'Gin-Bar in Sopron, im Keller der Várkerület 22',
      heroLead: 'Über 50 Gins, dazu Tonics und Cocktails. Dienstag bis Donnerstag bis Mitternacht, Freitag und Samstag bis 2 Uhr früh geöffnet.',
      book: 'Tisch reservieren', seeMenu: 'Getränkekarte', byPhone: 'Reservierung telefonisch:',
      pinceTitle: 'Der Keller', pinceTxt: 'Von der Straßentür führt eine Treppe hinunter in den Gewölbekeller. Wände aus Stein und Ziegel, hinter der Bar rotes Licht, in den Nischen Kerzen und Gin. Auch im Sommer bleibt es kühl.',
      capPince: 'Der Keller vom Fuß der Treppe', hzTitle: 'Von der Bar', hzTxt: 'Fotos von Gästen, was von der Bar an ihren Tisch kam. Am Wochenende gibt es ein eigenes Angebot, etwa den Ginito: Gin und Mojito in einem.', capLev: 'Gin Tonic mit Lavendel', capRoz: 'Gin Tonic mit Rosmarin', capSour: 'Grüne Cocktails mit Basilikum', capPink: 'Pink Gin mit Beeren', capKri: 'Kristallgläser', capKok: 'Cocktails an der Bar', capNar: 'Orangenscheibe, Eis', capKal3: 'Vogelkäfig zwischen zwei Laternen', capBog: 'Erdbeere und Heidelbeere auf Eis', capPoh: 'Zitronenzeste, Kamin', capLepcso: 'Die Treppe von der Straße', capFulke: 'Kerze und Gin in der Nische', capKalitka: 'Opihr im Vogelkäfig', capTabla: 'Die Tafel über der Bar',
      ginTitle: 'Empfehlung des Hauses', ginTxt: 'Aus über 50 Gins empfehlen wir diese sieben, je 4 cl. Das Tonic wählen Sie an der Bar: Fever-Tree, Thomas Henry, Schweppes oder Kinley.',
      menuTitle: 'Getränkekarte', menuNote: 'Preise in Forint, nach der Karte in der Bar, Änderungen vorbehalten. An der Bar bekommen Sie immer die aktuelle Karte. Kein Alkohol unter 18 Jahren.',
      igTxt: 'Das Wochenendangebot, etwa das Black Gin Weekend oder das Tiki Cocktail Weekend, steht auf Instagram:',
      revTitle: 'Bewertungen', revScore: 'bei Google, aus 211 Bewertungen', revLang: 'Die Zitate stehen im ungarischen Original.',
      hoursTitle: 'Öffnungszeiten', addrLbl: 'Adresse', telLbl: 'Telefon', doorNote: 'Die Tür liegt an der Várkerület, die Bar ist unten an der Treppe.',
      mapBtn: 'Karte laden', mapNote: 'Die Karte ist ein Dienst von Google und wird erst nach dem Klick geladen.', capAjto: 'Der Eingang an der Várkerület',
      legal: 'Impressum und Datenschutz', credit: 'Die Fotos stammen aus Google-Uploads von Gästen, farblich bearbeitet. Website: kettő.'
    },
    en: {
      skip: 'Skip to content', introSkip: 'Click to continue', navPince: 'The cellar', navGin: 'Gins', navMenu: 'Drinks', navHours: 'Opening hours', menuBtn: 'Menu',
      heroTitle: 'Gin bar in Sopron, in the cellar at Várkerület 22',
      heroLead: 'More than 50 gins, with tonics and cocktails. Open until midnight Tuesday to Thursday, and until 2 am on Friday and Saturday.',
      book: 'Book a table', seeMenu: 'Drinks menu', byPhone: 'Book by phone:',
      pinceTitle: 'The cellar', pinceTxt: 'From the street door a staircase leads down into the vaulted cellar. Stone and brick walls, red light behind the bar, candles and gin in the niches. It stays cool even in summer.',
      capPince: 'The cellar from the foot of the stairs', hzTitle: 'From the bar', hzTxt: 'Guests\u2019 photos of what came from the bar to their table. At weekends there is a separate offer, such as the Ginito, gin and mojito in one.', capLev: 'Lavender gin and tonic', capRoz: 'Gin and tonic with rosemary', capSour: 'Green cocktails with basil', capPink: 'Pink gin with berries', capKri: 'Crystal glasses', capKok: 'Cocktails on the bar', capNar: 'Orange slice, ice', capKal3: 'Birdcage between two lanterns', capBog: 'Strawberry and blueberry on ice', capPoh: 'Lemon peel, fireplace', capLepcso: 'The stairs from the street', capFulke: 'Candle and gin in a niche', capKalitka: 'Opihr in the birdcage', capTabla: 'The sign above the bar',
      ginTitle: 'House selection', ginTxt: 'Out of more than 50 gins, these are the seven we recommend, served as 4 cl. Pick the tonic at the bar: Fever-Tree, Thomas Henry, Schweppes or Kinley.',
      menuTitle: 'Drinks', menuNote: 'Prices in forints, from the menu we use at the bar, and they may change. At the bar you always get the current menu. No alcohol under 18.',
      igTxt: 'We post the weekend offer, such as Black Gin Weekend or Tiki Cocktail Weekend, on Instagram:',
      revTitle: 'Reviews', revScore: 'on Google, from 211 reviews', revLang: 'The quotes are in the original Hungarian.',
      hoursTitle: 'Opening hours', addrLbl: 'Address', telLbl: 'Phone', doorNote: 'The door opens from Várkerület, the bar is at the bottom of the stairs.',
      mapBtn: 'Load map', mapNote: 'The map is a Google service and only loads after you click.', capAjto: 'The entrance on Várkerület',
      legal: 'Legal notice and privacy', credit: 'Photos are guests’ Google uploads, colour corrected. Website: kettő.'
    }
  };
  var LI = { hu: 0, de: 1, en: 2 }, lang = 'hu', huText = {};
  $$('[data-i18n]').forEach(function (el) { huText[el.getAttribute('data-i18n')] = el.textContent; });
  function nb(s) { return lang === 'hu' ? String(s).replace(/(^|[\s(„])(a|az|A|Az|és|is|50|22\.) /g, '$1$2 ') : s; }
  function t(k) { var d = T[lang] || {}; return nb(k in d ? d[k] : huText[k] || ''); }
  function L(a) { return a == null ? '' : nb(typeof a === 'string' ? a : (a[LI[lang]] != null ? a[LI[lang]] : a[0])); }
  function ft(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : ' '); }
  function price(p) { return ft(p) + ' Ft'; }

  /* ------------------------------------------------------------------ budapesti idő (EU nyári időszámítás szabálya) */
  function lastSun(y, m) { var d = new Date(Date.UTC(y, m + 1, 0)); return d.getUTCDate() - d.getUTCDay(); }
  function bud() {
    var n = new Date(), y = n.getUTCFullYear();
    var s = Date.UTC(y, 2, lastSun(y, 2), 1), e = Date.UTC(y, 9, lastSun(y, 9), 1);
    var b = new Date(n.getTime() + ((n.getTime() >= s && n.getTime() < e) ? 2 : 1) * 3600000);
    return { d: b.getUTCDay(), m: b.getUTCHours() * 60 + b.getUTCMinutes() };
  }
  function mins(s) { var p = s.split(':'); return +p[0] * 60 + +p[1]; }
  function hm(s) { if (mins(s) === 1440) return '24:00'; var m = mins(s) % 1440; return Math.floor(m / 60) + ':' + ('0' + m % 60).slice(-2); }
  function status() {
    var b = bud(), y = (b.d + 6) % 7, h = HOURS[b.d], hy = HOURS[y];
    if (hy && mins(hy[1]) > 1440 && b.m < mins(hy[1]) - 1440) return { open: true, till: hy[1] };
    if (h && b.m >= mins(h[0]) && b.m < mins(h[1])) return { open: true, till: h[1] };
    if (h && b.m < mins(h[0])) return { open: false, day: 0, at: h[0] };
    for (var i = 1; i < 8; i++) { var d = (b.d + i) % 7; if (HOURS[d]) return { open: false, day: i, dd: d, at: HOURS[d][0] }; }
    return { open: false };
  }
  function renderLive() {
    var s = status(), el = $('#live'), txt;
    el.classList.toggle('is-open', !!s.open);
    if (s.open) txt = L(['Most nyitva, ' + hm(s.till) + '-ig', 'Jetzt geöffnet, bis ' + hm(s.till), 'Open now, until ' + hm(s.till)]);
    else if (s.day === 0) txt = L(['Ma ' + hm(s.at) + '-kor nyitunk', 'Heute ab ' + hm(s.at), 'Opens today at ' + hm(s.at)]);
    else if (s.day === 1) txt = L(['Holnap ' + hm(s.at) + '-kor nyitunk', 'Morgen ab ' + hm(s.at), 'Opens tomorrow at ' + hm(s.at)]);
    else txt = L([DAYS[s.dd][0] + ' ' + hm(s.at) + '-kor nyitunk', DAYS[s.dd][1] + ' ab ' + hm(s.at), 'Opens ' + DAYS[s.dd][2] + ' at ' + hm(s.at)]);
    $('#liveTxt').textContent = txt;
    var b = bud();
    $$('#hours tr').forEach(function (tr) { tr.classList.toggle('is-today', +tr.getAttribute('data-d') === b.d); });
  }
  function renderHours() {
    var rows = [[2, 3, 4], [5, 6], [1, 0]];
    var J = { hu: ['–', ' és '], de: [' bis ', ' und '], en: ['–', ' and '] }[lang];
    var names = function (g) { var x = L(DAYS[g[0]]), y = L(DAYS[g[g.length - 1]]); if (lang === 'hu') y = y.toLowerCase(); return x + (g.length === 3 ? J[0] : J[1]) + y; };
    var b = bud();
    $('#hours tbody').innerHTML = rows.map(function (g) {
      var h = HOURS[g[0]], today = g.indexOf(b.d) > -1;
      return '<tr data-d="' + (today ? b.d : g[0]) + '" class="' + (h ? '' : 'closed') + '"><th scope="row" data-t="' + esc(L(['ma', 'heute', 'today'])) + '">' + esc(names(g)) + '</th><td>' +
        (h ? hm(h[0]) + '–' + hm(h[1]) : esc(L(['Zárva', 'Geschlossen', 'Closed']))) + '</td></tr>';
    }).join('');
  }

  /* ------------------------------------------------------------------ art deco keret (a logó keretének vonalai, mindig 1 px) */
  function decoPath(w, h, o) {
    var k = o.k || 1, s = 12 * k, a = 4 * k, b = 9 * k, c = 26 * k, ch = 7 * k, d = [];
    function seg(x1, y1, x2, y2) { d.push('M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1)); }
    function poly(p) { d.push('M' + p.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('L') + 'Z'); }
    function corner(fx, fy) {
      var X = function (x) { return fx ? w - x : x; }, Y = function (y) { return fy ? h - y : y; };
      poly([[X(0), Y(0)], [X(s), Y(0)], [X(s), Y(s)], [X(0), Y(s)]]);
      poly([[X(b + ch), Y(b)], [X(c), Y(b)], [X(c), Y(c)], [X(b), Y(c)], [X(b), Y(b + ch)]]);
      seg(X(c), Y(c), X(b + ch / 2), Y(b + ch / 2));
      seg(X(c), Y(c), X(b + ch + (c - b - ch) * .45), Y(b));
      seg(X(c), Y(c), X(b), Y(b + ch + (c - b - ch) * .45));
    }
    corner(0, 0); corner(1, 0); corner(0, 1); corner(1, 1);
    // két külső vonal
    seg(s, a, w - s, a); seg(s, h - a, w - s, h - a); seg(a, s, a, h - s); seg(w - a, s, w - a, h - s);
    seg(c, b, w - c, b); seg(c, h - b, w - c, h - b); seg(b, c, b, h - c); seg(w - b, c, w - b, h - c);
    // belső vonal, középen V-bemélyedés rombusszal (fent és lent), oldalt rombusz
    var mx = w / 2, v = 22 * k, vd = 13 * k;
    if (o.mid) {
      seg(c, c, mx - v, c); seg(mx - v, c, mx, c + vd); seg(mx, c + vd, mx + v, c); seg(mx + v, c, w - c, c);
      seg(c, h - c, mx - v, h - c); seg(mx - v, h - c, mx, h - c - vd); seg(mx, h - c - vd, mx + v, h - c); seg(mx + v, h - c, w - c, h - c);
      var r = 3.6 * k;
      poly([[mx, c - r * .2 - r], [mx + r, c - r * .2], [mx, c - r * .2 + r], [mx - r, c - r * .2]]);
      poly([[mx, h - c + r * .2 - r], [mx + r, h - c + r * .2], [mx, h - c + r * .2 + r], [mx - r, h - c + r * .2]]);
    } else { seg(c, c, w - c, c); seg(c, h - c, w - c, h - c); }
    if (o.side) {
      var my = h / 2, r2 = 5 * k, x0 = (b + c) / 2;
      seg(c, c, c, my - 3 * r2); seg(c, my + 3 * r2, c, h - c); seg(w - c, c, w - c, my - 3 * r2); seg(w - c, my + 3 * r2, w - c, h - c);
      poly([[x0, my - r2 * 2], [x0 + r2 * 1.4, my], [x0, my + r2 * 2], [x0 - r2 * 1.4, my]]);
      poly([[w - x0, my - r2 * 2], [w - x0 + r2 * 1.4, my], [w - x0, my + r2 * 2], [w - x0 - r2 * 1.4, my]]);
      seg(c, my - 3 * r2, x0 + r2 * 1.4, my); seg(c, my + 3 * r2, x0 + r2 * 1.4, my);
      seg(w - c, my - 3 * r2, w - x0 - r2 * 1.4, my); seg(w - c, my + 3 * r2, w - x0 - r2 * 1.4, my);
    } else { seg(c, c, c, h - c); seg(w - c, c, w - c, h - c); }
    return d.join('');
  }
  var DECO = { hero: { k: 1.25, mid: true, side: true }, panel: { k: 1, mid: true, side: true }, gin: { k: 1, mid: false, side: false }, tunnel: { k: 1.6, mid: true, side: true } };
  function drawDeco(svg) {
    var r = svg.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height);
    if (!w || !h || svg._w === w && svg._h === h) return;
    svg._w = w; svg._h = h;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.innerHTML = '<path d="' + decoPath(w, h, DECO[svg.getAttribute('data-deco')] || {}) + '"/>';
  }
  function drawAllDeco() { $$('svg.deco').forEach(drawDeco); }

  /* ------------------------------------------------------------------ kirajzolás */
  function pic(n, sizes) {
    var big = { kalitka2: 1600, fulke: 1600, gyertya: 1300, amuerte: 1300, levendula: 1300, sour: 1300, buborek: 1300, tal: 1300, monkey: 1100, opihr: 1100, ginmare: 1100 }[n] || 1300;
    var small = { 1600: 800, 1300: 700, 1100: 600 }[big];
    return '<img data-k="' + n + '" src="img/' + n + '-' + big + '.webp?v=1" srcset="img/' + n + '-' + small + '.webp?v=1 ' + small + 'w, img/' + n + '-' + big + '.webp?v=1 ' + big + 'w" sizes="' + sizes + '" alt="' + esc(PICS[n] || '') + '" decoding="async">';
  }
  var ginI = -1;
  function renderGins() {
    $('#ginList').innerHTML = GINS.map(function (g, i) {
      return '<li class="' + (reduced ? '' : 'rv') + (i === ginI ? ' is-on' : '') + '" style="--i:' + i + '"><button type="button" data-i="' + i + '" aria-pressed="' + (i === ginI) + '"><b>' + esc(g[0]) + '</b><em>' + price(g[2]) + ' · 4 cl</em><span>' + esc(L(g[1])) + '</span></button></li>';
    }).join('');
  }
  function swapPic(frame, n, sizes) {
    var cur = $('img.is-on', frame);
    if (cur && cur.getAttribute('data-k') === n) return;
    var im = $('img[data-k="' + n + '"]', frame);
    if (!im) { frame.insertAdjacentHTML('beforeend', pic(n, sizes)); im = frame.lastElementChild; }
    $$('img', frame).forEach(function (x) { x.classList.remove('was'); if (x.classList.contains('is-on') && x !== im) { x.classList.remove('is-on'); x.classList.add('was'); } });
    frame.appendChild(im);
    var go = function () { requestAnimationFrame(function () { requestAnimationFrame(function () { im.classList.add('is-on'); }); }); };
    if (im.complete) go(); else { im.onload = go; im.onerror = go; }
  }
  function selGin(i) {
    if (i === ginI) return;
    ginI = i;
    $$('#ginList li').forEach(function (li, k) { li.classList.toggle('is-on', k === i); $('button', li).setAttribute('aria-pressed', k === i); });
    swapPic($('#ginFrame'), i < 0 ? 'kalitka2' : GINS[i][3], '(min-width: 900px) 40vw, 90vw');
  }

  var tabI = 0;
  function renderTabs() {
    $('#tabs').innerHTML = MENU.map(function (g, i) { return '<button type="button" role="tab" id="tab' + i + '" aria-controls="menuList" aria-selected="' + (i === tabI) + '" tabindex="' + (i === tabI ? 0 : -1) + '">' + esc(L(g.k)) + '</button>'; }).join('');
  }
  function renderMenu() {
    var g = MENU[tabI], list = $('#menuList');
    list.setAttribute('aria-labelledby', 'tab' + tabI);
    list.classList.toggle('one', !!g.one);
    list.innerHTML = g.items.map(function (it, k) {
      return '<div class="mi" style="--i:' + k + '"><b>' + esc(L(it[0])) + '</b><em>' + price(it[2]) + '</em>' + (it[1] ? '<span>' + esc(L(it[1])) + '</span>' : '') + '</div>';
    }).join('');
    swapPic($('#menuFrame'), g.pic, '(min-width: 1000px) 30vw, 80vw');
  }

  /* ------------------------------------------------------------------ címek soronkénti felfedése */
  function splitBl() {
    $$('.bl').forEach(function (h) {
      var tx = h.getAttribute('data-txt') || h.textContent; h.setAttribute('data-txt', tx); h.setAttribute('aria-label', tx);
      h.innerHTML = tx.split(/[ \n\t]+/).map(function (w) { return '<span class="w" aria-hidden="true">' + esc(w) + '</span>'; }).join(' ');
      var lines = [], top = null;
      $$('.w', h).forEach(function (w) { var o = w.offsetTop; if (top === null || Math.abs(o - top) > 4) { lines.push([]); top = o; } lines[lines.length - 1].push(w.textContent); });
      h.innerHTML = lines.map(function (l, i) { return '<span class="ln" aria-hidden="true" style="--l:' + i + '"><span class="ln__i">' + esc(l.join(' ')) + '</span></span>'; }).join('');
    });
  }
  function splitQuotes() {
    $$('.q p').forEach(function (p) {
      var tx = p.getAttribute('data-txt') || p.textContent; p.setAttribute('data-txt', tx);
      p.innerHTML = '<span class="sr">' + esc(tx) + '</span>' + tx.split(' ').map(function (w) { return '<span class="w" aria-hidden="true">' + esc(w) + '</span>'; }).join(' ');
      if (reduced) $$('.w', p).forEach(function (w) { w.classList.add('on'); });
    });
  }

  var ready = false;
  function applyLang(l, save) {
    lang = T[l] || l === 'hu' ? l : 'hu';
    html.lang = lang;
    $$('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n'), v = t(k);
      if (el.classList.contains('bl')) { el.removeAttribute('data-txt'); el.textContent = v; }
      else if (el.textContent !== v) el.textContent = v;
    });
    $('.rev__lang').hidden = lang === 'hu';
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang); });
    renderLive(); renderHours(); renderLive(); renderGins(); renderTabs(); renderMenu();
    splitBl();
    $$('.bl').forEach(function (h) { if (ready && h.getBoundingClientRect().top < innerHeight) h.classList.add('is-in'); });
    if (ready) { $('#ginList').classList.add('is-in'); observeBl(); ScrollTrigger.refresh(); }
    if (save) try { localStorage.setItem('sg-lang', lang); } catch (e) {}
    html.classList.remove('lang-pending');
  }
  var startLang = null;
  try { startLang = localStorage.getItem('sg-lang'); } catch (e) {}
  if (!startLang) { var nl = (navigator.languages || [navigator.language || 'hu']).map(function (x) { return String(x).slice(0, 2); }); startLang = nl.filter(function (x) { return x === 'hu' || x === 'de' || x === 'en'; })[0] || 'en'; }

  $$('.lang button').forEach(function (b) { b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang'), true); }); });
  $('#tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var i = +b.id.slice(3); if (i === tabI) return;
    tabI = i; renderTabs(); renderMenu();
  });
  $('#tabs').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    tabI = (tabI + (e.key === 'ArrowRight' ? 1 : MENU.length - 1)) % MENU.length;
    renderTabs(); renderMenu(); $('#tab' + tabI).focus(); e.preventDefault();
  });
  var gl = $('#ginList');
  gl.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) selGin(+b.getAttribute('data-i')); });
  if (canHover) {
    gl.addEventListener('mouseover', function (e) { var b = e.target.closest('button'); if (b) selGin(+b.getAttribute('data-i')); });
    gl.addEventListener('mouseleave', function () { selGin(-1); });
  }
  gl.addEventListener('focusin', function (e) { var b = e.target.closest('button'); if (b) selGin(+b.getAttribute('data-i')); });

  /* térkép csak kattintásra */
  $('#mapBtn').addEventListener('click', function () {
    var m = $('#map');
    m.insertAdjacentHTML('beforeend', '<iframe title="Shelby\'s Gin Bar a térképen" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=Shelby%27s+Gin+Bar,+Sopron,+V%C3%A1rker%C3%BClet+22&output=embed"></iframe>');
    $('#mapBtn').hidden = true; $('p', m).hidden = true;
  });

  /* mobil menü */
  var burger = $('#burger'), sheet = $('#sheet');
  function setSheet(on) {
    burger.setAttribute('aria-expanded', on); sheet.hidden = !on;
    if (lenis) { if (on) lenis.stop(); else lenis.start(); }
    document.body.style.overflow = on ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setSheet(burger.getAttribute('aria-expanded') !== 'true'); });
  sheet.addEventListener('click', function (e) { if (e.target === sheet || e.target.closest('a')) setSheet(false); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) { setSheet(false); burger.focus(); } });

  /* ------------------------------------------------------------------ felfedések */
  var io = 'IntersectionObserver' in window;
  var blObs = io ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); blObs.unobserve(e.target); } }); }, { rootMargin: '0px 0px -12% 0px' }) : null;
  function observeBl() { $$('.bl:not(.is-in)').forEach(function (h) { if (h.id === 'heroTitle') return; if (blObs) blObs.observe(h); else h.classList.add('is-in'); }); }
  var phObs = io ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); phObs.unobserve(e.target); } }); }, { rootMargin: '0px 0px -12% 0px' }) : null;
  function initReveal() {
    if (reduced || !phObs) { $('#ginList').classList.add('is-in'); return; }
    $$('.ph').forEach(function (p) { p.classList.add('rv'); phObs.observe(p); });
    phObs.observe($('#ginList'));
  }

  /* vélemények: a szavak sorban gyúlnak ki */
  function initQuotes() {
    if (reduced) return;
    $$('.q').forEach(function (q) {
      var ws = $$('.w', q);
      if (rich) {
        ScrollTrigger.create({ trigger: q, start: 'top 85%', end: 'bottom 45%', onUpdate: function (s) { var n = Math.round(s.progress * ws.length); ws.forEach(function (w, i) { w.classList.toggle('on', i < n); }); } });
      } else {
        ScrollTrigger.create({ trigger: q, start: 'top 82%', once: true, onEnter: function () { ws.forEach(function (w, i) { setTimeout(function () { w.classList.add('on'); }, i * 70); }); } });
      }
    });
  }

  /* ------------------------------------------------------------------ smooth görgetés (egér) */
  var lenis = null;
  if (canHover && !reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  function goTo(el) {
    if (lenis) lenis.scrollTo(el === 0 ? 0 : el, { offset: el === 0 ? 0 : -70, duration: 1.6 });
    else if (el === 0) scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]'); if (!a) return;
    var id = a.getAttribute('href').slice(1), el = id === 'top' ? 0 : document.getElementById(id);
    if (el === null) return;
    e.preventDefault(); goTo(el);
    if (el && el.focus) { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); }
  });

  /* fejléc: a nyitókép után sötét, lefelé görgetve elbújik, felfelé visszajön */
  var hd = $('#hd'), lastY = 0, navA = $$('.hd__nav a');
  var secs = ['pince', 'ginek', 'itallap', 'nyitva'].map(function (id) { return document.getElementById(id); });
  function onScroll(y) {
    var hh = innerHeight * 0.8;
    hd.classList.toggle('is-solid', y > hh);
    hd.classList.toggle('is-hidden', y > hh + 200 && y > lastY + 2 && sheet.hidden);
    if (y < lastY - 2 || y < hh) hd.classList.remove('is-hidden');
    lastY = y;
    var cur = -1; secs.forEach(function (s, i) { if (s.getBoundingClientRect().top < innerHeight * .4) cur = i; });
    navA.forEach(function (a, i) { a.classList.toggle('is-cur', i === cur); });
  }
  if (lenis) lenis.on('scroll', function (l) { onScroll(l.scroll); });
  else addEventListener('scroll', function () { onScroll(scrollY); }, { passive: true });

  /* ------------------------------------------------------------------ kurzor */
  var cur = $('#cur'), mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my, curRun = false;
  if (rich) {
    var cd = $('.cur__d', cur), cr = $('.cur__r', cur), rot = 45;
    gsap.set([cd, cr], { rotation: 45 });
    addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; gsap.set(cd, { x: mx, y: my }); if (!curRun) { curRun = true; gsap.ticker.add(curTick); } }, { passive: true });
    var curTick = function () {
      cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
      gsap.set(cr, { x: cx, y: cy });
      if (Math.abs(mx - cx) < .1 && Math.abs(my - cy) < .1) { curRun = false; gsap.ticker.remove(curTick); }
    };
    document.addEventListener('mouseover', function (e) {
      var on = !!e.target.closest('a,button,[role="tab"]');
      if (on !== cur.classList.contains('on-link')) { cur.classList.toggle('on-link', on); rot += 90; gsap.to(cr, { rotation: rot, duration: .6, ease: 'expo.out' }); }
    });
    document.addEventListener('mouseleave', function () { cur.style.opacity = 0; });
    document.addEventListener('mouseenter', function () { cur.style.opacity = 1; });
  }

  /* ------------------------------------------------------------------ pohár-lencse a nyitóképen (WebGL) */
  var hero = $('#top'), heroImg = $('#heroImg'), G = { ok: false };
  if (!reduced && hwGpu && !window.__noGl) (function () {
    var cv = $('#heroGl'), gl = cv.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
    if (!gl) return;
    var vs = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
    var fs = [
      'precision highp float;varying vec2 v;uniform sampler2D uI;uniform vec2 uRes,uM,uIs;uniform float uR,uT,uZ,uP;',
      'vec2 cover(vec2 q){vec2 s=uRes/uIs;float k=max(s.x,s.y);vec2 sz=uIs*k;vec2 off=(uRes-sz)*vec2(.58,.52);return (q*uRes-off)/sz;}',
      'float h1(float n){return fract(sin(n)*43758.5453);}',
      'void main(){',
      ' vec2 px=vec2(v.x,1.-v.y)*uRes; vec2 c=(px-uRes*.5)/uZ+uRes*.5;',
      ' vec2 uv=cover(c/uRes); vec3 col=texture2D(uI,uv).rgb;',
      ' vec2 d=px-uM; float r=length(d)/uR;',
      ' if(uR>1.&&r<1.08){',
      '  float rr=min(r,1.);',
      '  float bulge=.62+.38*rr*rr;',  // nagyít a közepén, a peremnél összenyom
      '  vec2 q=uM+d*bulge; vec2 cq=(q-uRes*.5)/uZ+uRes*.5;',
      '  vec2 dir=normalize(d+1e-4)*rr*rr*uR*.009;',
      '  vec3 g;g.r=texture2D(uI,cover((cq+dir)/uRes)).r;g.g=texture2D(uI,cover(cq/uRes)).g;g.b=texture2D(uI,cover((cq-dir)/uRes)).b;',
      '  g*=1.12; g=mix(g,g*vec3(.96,1.,1.02),.5);',
      // buborékok: oszlopokban felszállnak
      '  float bub=0.;',
      '  for(int i=0;i<14;i++){float fi=float(i);float sx=(h1(fi*3.1)-.5)*1.5;float sp=.10+h1(fi*7.7)*.16;float y=1.-fract(h1(fi*1.3)+uT*sp)*2.2;',
      '   vec2 bp=vec2(sx+sin(uT*1.3+fi)*.03,y);float br=.018+h1(fi*5.3)*.03;float dd=length(d/uR-bp)/br;',
      '   bub+=smoothstep(1.,.75,dd)*smoothstep(.45,.9,dd)*.9+smoothstep(.5,0.,length(d/uR-bp-vec2(-.3,-.3)*br)/br)*.6;}',
      '  g+=vec3(1.,.97,.9)*bub*.55*smoothstep(1.,.85,rr);',
      // perem: vékony világos gyűrű, fent balra csillanás
      '  float rim=smoothstep(.9,.985,rr)*smoothstep(1.06,.99,r);',
      '  float spec=pow(max(0.,dot(normalize(d+1e-4),normalize(vec2(-.7,-.7)))),6.)*smoothstep(.72,.9,rr)*smoothstep(1.,.93,rr);',
      '  g+=vec3(.95,.86,.62)*rim*.55+vec3(1.)*spec*.5;',
      '  float m=smoothstep(1.02,.99,r)*uP; col=mix(col,g,m);',
      '  col*=1.-.35*smoothstep(1.,1.08,r)*smoothstep(1.2,1.08,r)*uP;',
      ' }',
      ' gl_FragColor=vec4(col,1.);}'
    ].join('\n');
    function sh(tp, src) { var x = gl.createShader(tp); gl.shaderSource(x, src); gl.compileShader(x); return gl.getShaderParameter(x, gl.COMPILE_STATUS) ? x : null; }
    var a = sh(gl.VERTEX_SHADER, vs), b = sh(gl.FRAGMENT_SHADER, fs);
    if (!a || !b) return;
    var pr = gl.createProgram(); gl.attachShader(pr, a); gl.attachShader(pr, b); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['uI', 'uRes', 'uM', 'uIs', 'uR', 'uT', 'uZ', 'uP'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
    var img = new Image(); img.src = innerWidth > 1700 ? 'img/bar-2400.webp?v=1' : 'img/bar-1600.webp?v=1';
    G.m = [innerWidth * .62, innerHeight * .42]; G.t = [G.m[0], G.m[1]]; G.p = 0; G.pt = 0; G.z = 1; G.vis = true; G.run = false;
    G.R = 0;
    function size() {
      var dpr = Math.min(devicePixelRatio || 1, 1.75), w = hero.clientWidth, h = hero.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); G.dpr = dpr;
      gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(U.uRes, cv.width, cv.height);
      G.R = Math.min(Math.max(w * .13, 130), 230);
      gl.uniform1f(U.uR, G.R * dpr);
    }
    img.decode().then(function () {
      var tx = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      gl.uniform1i(U.uI, 0); gl.uniform2f(U.uIs, img.naturalWidth, img.naturalHeight);
      size(); G.ok = true; frame(performance.now()); hero.classList.add('gl-on'); G.kick();
    }).catch(function () {});
    var t0 = performance.now();
    function frame() {
      var k = 0.11;
      G.m[0] += (G.t[0] - G.m[0]) * k; G.m[1] += (G.t[1] - G.m[1]) * k;
      G.p += (G.pt - G.p) * 0.08;
      gl.uniform2f(U.uM, G.m[0] * G.dpr, G.m[1] * G.dpr);
      gl.uniform1f(U.uT, (performance.now() - t0) / 1000);
      gl.uniform1f(U.uZ, G.z); gl.uniform1f(U.uP, G.p);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      var still = Math.abs(G.t[0] - G.m[0]) < .2 && Math.abs(G.t[1] - G.m[1]) < .2 && Math.abs(G.pt - G.p) < .002;
      if ((still && G.pt === 0) || !G.vis) { G.run = false; gsap.ticker.remove(frame); }
    }
    G.frame = frame;
    G.kick = function () { if (G.ok && G.vis && !G.run) { G.run = true; gsap.ticker.add(frame); } };
    if (canHover) {
      hero.addEventListener('mousemove', function (e) {
        var r = hero.getBoundingClientRect();
        if (e.target.closest('a,button,.hero__txt h1,.hero__lead,.hero__tel')) { G.pt = 0; cur.classList.remove('on-lens'); G.kick(); return; }
        G.t = [e.clientX - r.left, e.clientY - r.top]; G.pt = 1; cur.classList.add('on-lens'); G.kick();
      });
      hero.addEventListener('mouseleave', function () { G.pt = 0; cur.classList.remove('on-lens'); G.kick(); });
    } else {
      // érintőn a pohár magától lassan átúszik a pulton, aztán elhalványul
      G.auto = function () {
        var w = hero.clientWidth, h = hero.clientHeight, o = { a: 0 };
        G.m = [w * .9, h * .3]; G.t = G.m.slice(); G.pt = 1; G.kick();
        gsap.to(o, { a: 1, duration: 7, ease: 'sine.inOut', onUpdate: function () { G.t = [w * (.85 - .55 * o.a), h * (.32 + .1 * Math.sin(o.a * 3.1))]; G.kick(); }, onComplete: function () { G.pt = 0; G.kick(); } });
      };
    }
    var ro = new ResizeObserver(function () { if (G.ok) { size(); G.frame(); } }); ro.observe(hero);
    new IntersectionObserver(function (es) { G.vis = es[0].isIntersecting; if (G.vis) G.kick(); }).observe(hero);
  })();

  /* ------------------------------------------------------------------ átjáró: keretek egymás mögött, mint a boltívek */
  function initTunnel() {
    if (!rich) return;
    var st = $('#tunnelStage'), N = 7, gap = 650, fr = [];
    for (var i = 0; i < N; i++) {
      var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('class', 'deco tunnel__fr'); s.setAttribute('data-deco', 'tunnel');
      st.insertBefore(s, st.firstChild); fr.push(s);
    }
    drawAllDeco();
    var end = $('.tunnel__end', st), D = N * gap + 700;
    function upd(p) {
      var z0 = p * D;
      fr.forEach(function (s, i) {
        var z = -(i + 1) * gap + z0;
        var o = z > 700 ? 0 : z > 380 ? 1 - (z - 380) / 320 : z < -3600 ? 0 : z < -2600 ? (z + 3600) / 1000 : 1;
        s.style.transform = 'translate3d(0,0,' + z.toFixed(1) + 'px)'; s.style.opacity = o.toFixed(3);
      });
      var ze = -D + z0;
      end.style.transform = 'translate3d(0,0,' + ze.toFixed(1) + 'px)';
      end.style.setProperty('--d', (1 - Math.min(1, Math.max(0, (p - .35) / .5)) * .85).toFixed(3));
    }
    upd(0);
    ScrollTrigger.create({ trigger: '#tunnel', start: 'top bottom', end: 'bottom bottom', scrub: true, onUpdate: function (s) { upd(s.progress); } });
  }

  /* a pultról: kitűzött vízszintes sor */
  function initHz() {
    if (!rich) return;
    var sec = $('#pult'), tr = $('#hzTrack'), ims = $$('.hz__ph img', tr), dist = 0;
    function meas() { dist = Math.max(0, tr.scrollWidth - innerWidth); sec.style.height = (innerHeight + dist) + 'px'; }
    meas();
    ScrollTrigger.create({ trigger: sec, start: 'top top', end: function () { return '+=' + dist; }, scrub: true, invalidateOnRefresh: true, onRefreshInit: meas,
      onUpdate: function (s) { var x = -dist * s.progress; tr.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
        ims.forEach(function (im) { var r = im.parentNode.getBoundingClientRect(); var c = (r.left + r.width / 2) / innerWidth - .5; im.style.setProperty('--px', (c * -40).toFixed(1) + 'px'); }); } });
  }

  /* pince fotói: asztali gépen belső parallaxis */
  function initParallax() {
    if (!rich) return;
    $$('.ph').forEach(function (p) {
      var im = $('.ph__in img', p);
      ScrollTrigger.create({ trigger: p, start: 'top bottom', end: 'bottom top', scrub: true, onUpdate: function (s) { im.style.setProperty('--py', ((s.progress - .5) * -36).toFixed(1) + 'px'); } });
    });
  }

  /* ------------------------------------------------------------------ nyitás */
  var intro = $('#intro');
  function heroIn() {
    var h1 = $('#heroTitle');
    h1.classList.add('is-in');
    if (!reduced) {
      gsap.from('.hero__lead,.hero__btns,.hero__tel', { opacity: 0, y: 18, duration: 1.2, ease: 'expo.out', stagger: .12, delay: .35, clearProps: 'all' });
      gsap.fromTo('#heroMedia', { scale: 1.08 }, { scale: 1, duration: 2.6, ease: 'expo.out', clearProps: 'transform' });
      gsap.fromTo('.hero__frame', { opacity: 0 }, { opacity: 1, duration: 1.6, delay: .3, ease: 'power2.out' });
    }
    if (G.auto) setTimeout(G.auto, 900);
  }
  function runIntro() {
    if (!html.classList.contains('intro-on')) { heroIn(); return; }
    html.classList.add('intro-run');
    var inn = $('.intro__in'), fr = $('.intro__frame'), wd = $('.intro__word');
    var tl = gsap.timeline({ onComplete: done });
    var cl = { v: 50 };
    tl.to(cl, { v: 0, duration: 1.25, ease: 'expo.inOut', onUpdate: function () { fr.style.clipPath = 'inset(' + cl.v.toFixed(2) + '% -2% ' + cl.v.toFixed(2) + '% -2%)'; } }, .15)
      .fromTo(inn, { scale: .94 }, { scale: 1, duration: 2.4, ease: 'power2.out' }, 0)
      .to(wd, { opacity: 1, duration: .25 }, .85)
      .fromTo(wd, { maskPosition: '100% 0', webkitMaskPosition: '100% 0' }, { maskPosition: '0% 0', webkitMaskPosition: '0% 0', duration: 1.25, ease: 'power2.inOut' }, .85)
      .to(inn, { scale: 7, opacity: 0, duration: 1.05, ease: 'power3.in' }, 2.55)
      .to(intro, { backgroundColor: 'rgba(14,12,10,0)', duration: .7, ease: 'power1.in' }, 2.95)
      .add(heroIn, 3.0);
    function skip() { if (tl.progress() < .7) tl.timeScale(5); }
    intro.addEventListener('click', skip); addEventListener('keydown', skip, { once: true }); addEventListener('wheel', skip, { once: true, passive: true }); addEventListener('touchstart', skip, { once: true, passive: true });
    function done() { html.classList.remove('intro-on', 'intro-run'); try { sessionStorage.setItem('sg-intro', '1'); } catch (e) {} if (lenis) lenis.start(); ScrollTrigger.refresh(); }
    if (lenis) lenis.stop();
  }

  /* ------------------------------------------------------------------ indulás */
  applyLang(startLang);
  drawAllDeco();
  var lw = innerWidth, lh = innerHeight;
  addEventListener('resize', function () {
    var dw = innerWidth !== lw, dh = Math.abs(innerHeight - lh) > 160;
    if (!dw && !dh) return;
    lw = innerWidth; lh = innerHeight;
    drawAllDeco();
    if (dw) { splitBl(); $$('.bl').forEach(function (h) { if (h.getBoundingClientRect().top < innerHeight) h.classList.add('is-in'); }); }
  });
  setInterval(renderLive, 60000);
  splitQuotes();
  document.fonts.ready.then(function () {
    splitBl(); ready = true;
    observeBl(); initReveal(); initQuotes(); initTunnel(); initHz(); initParallax();
    runIntro();
    ScrollTrigger.refresh();
  });
})();
