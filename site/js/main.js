/* Shelby's Gin Bar – bemutató oldal.
   GSAP + ScrollTrigger. Egérrel Lenis (lassabb, puhább görgetés), érintőn natív görgetés: ott semmi nem követi az ujjat,
   csak egyszeri, időzített mozgások vannak. A nyitóképen felkapcsolnak a fények (WebGL), az átjáróban egy 3D copa pohár telik meg, mindkettő csak valódi GPU-n. */
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
    ['Gin Mare', ['Rozmaring, bazsalikom, olíva, kakukkfű', 'Rosmarin, Basilikum, Olive, Thymian', 'Rosemary, basil, olive, thyme'], 2800, 'ginmare2'],
    ['Brockmans', ['Bogyós gyümölcsök és citrus', 'Beeren und Zitrus', 'Berries and citrus'], 2800, 'brock'],
    ['Monkey 47', ['47 féle alapanyag a Fekete-erdőből', '47 Zutaten aus dem Schwarzwald', '47 botanicals from the Black Forest'], 3800, 'monkey'],
    ['Amuerte', ['Kokalevél és papaya', 'Kokablatt und Papaya', 'Coca leaf and papaya'], 4300, 'amuerte2'],
    ['Opihr', ['Kardamom, koriander, gyömbér', 'Kardamom, Koriander, Ingwer', 'Cardamom, coriander, ginger'], 2600, 'opihr2'],
    ['Nordés', ['Menta, levendula, eukaliptusz', 'Minze, Lavendel, Eukalyptus', 'Mint, lavender, eucalyptus'], 2600, 'kalitka2']
  ];
  var MENU = [
    { k: ['Gin & tonic', 'Gin & Tonic', 'Gin & tonic'], pic: 'gt2', one: true, items: [
      ['Klasszikus', ['London dry gin és tonik', 'London Dry Gin und Tonic', 'London dry gin and tonic'], 2500],
      ['Citrus', ['Citrusos gin és tonik', 'Zitrus-Gin und Tonic', 'Citrus gin and tonic'], 2600],
      ['Ladies Dream', ['Pink gin és wildberry tonik', 'Pink Gin und Wildberry-Tonic', 'Pink gin and wild berry tonic'], 2600],
      ['Virgin', ['Alkoholmentes gin és tonik', 'Alkoholfreier Gin und Tonic', 'Alcohol-free gin and tonic'], 2500]
    ] },
    { k: ['Koktélok', 'Cocktails', 'Cocktails'], pic: 'koktel2', items: [
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
  var PICS = { kalitka2: 'Kalitka a pulton a Shelby\'s itallapjai között', fulke: 'Kőfülke gyertyával és ginekkel', ginmare2: 'Gin Mare palack, rozmaring, lámpás és gin-tonik egy kőfülkében', brock: 'Brockmans palack és gin-tonik uborkaszalaggal, mellette Fever-Tree tonik', monkey: 'Monkey 47 palack', amuerte2: 'Fekete Amuerte Coca Gin palack koponyás címkével', opihr2: 'Opihr palack egy madárkalitkában, előtte gin-tonik', gt2: 'A pultos csipesszel tesz zöld díszítést egy jeges gin-tonikba', koktel2: 'A pultos szűrőn át tölti a zöld koktélt egy talpas pohárba', buborek: 'Buborékok egy rózsaszín italban, közelről', tal: 'Sajt- és sonkatál a pulton' };

  /* ------------------------------------------------------------------ nyelvek */
  var T = {
    de: {
      skip: 'Zum Inhalt', introSkip: 'Zum Fortfahren klicken', navPince: 'Der Keller', navGin: 'Gins', navMenu: 'Getränkekarte', navHours: 'Öffnungszeiten', menuBtn: 'Menü',
      heroTitle: 'Gin-Bar in Sopron, im Keller der Várkerület 22',
      heroLead: 'Über 50 Gins, dazu Tonics und Cocktails. Dienstag bis Donnerstag bis Mitternacht, Freitag und Samstag bis 2 Uhr früh geöffnet.',
      book: 'Tisch reservieren', seeMenu: 'Getränkekarte', byPhone: 'Reservierung telefonisch:',
      pinceTitle: 'Der Keller', pinceTxt: 'Von der Straßentür führt eine Treppe hinunter in den Gewölbekeller. Wände aus Stein und Ziegel, hinter der Bar rotes Licht, in den Nischen Kerzen und Gin. Auch im Sommer bleibt es kühl.',
      capPince: 'Unter dem Ziegelgewölbe', capLepcso: 'Die Treppe von der Straße', capFulke: 'Kerze und Gin in der Nische', capKalitka: 'Vogelkäfig und Kerzen auf der Bar', capKand: 'Gin Tonic mit Zitrone, dahinter der Kamin', capTabla: 'Die Tafel über der Bar',
      polcTitle: 'Hinter der Bar', polcTxt: 'In den Flaschen leuchten Lichterketten, die Cocktails werden an der Bar gemixt. Die Fotos stammen von der Instagram- und Facebook-Seite der Bar.', sk2: 'Grüner Cocktail mit Basilikum', sk3: 'Roter Cocktail mit Orangenschale', sk4: 'Cocktail neben der Karte', sk5: 'Cocktail mit Schaum',
      ginTitle: 'Empfehlung des Hauses', ginTxt: 'Aus über 50 Gins empfehlen wir diese sieben, je 4 cl. Das Tonic wählen Sie an der Bar: Fever-Tree, Thomas Henry, Schweppes oder Kinley.',
      menuTitle: 'Getränkekarte', menuNote: 'Preise in Forint, nach der Karte in der Bar, Änderungen vorbehalten. An der Bar bekommen Sie immer die aktuelle Karte. Kein Alkohol unter 18 Jahren.',
      igTxt: 'Das Wochenendangebot, etwa das Black Gin Weekend oder das Tiki Cocktail Weekend, steht auf Instagram:',
      revTitle: 'Bewertungen', revScore: 'bei Google, aus 211 Bewertungen', revLang: 'Die Zitate stehen im ungarischen Original.',
      hoursTitle: 'Öffnungszeiten', addrLbl: 'Adresse', telLbl: 'Telefon', doorNote: 'Die Tür liegt an der Várkerület, die Bar ist unten an der Treppe.',
      mapBtn: 'Karte laden', mapNote: 'Die Karte ist ein Dienst von Google und wird erst nach dem Klick geladen.', capAjto: 'Der Eingang an der Várkerület',
      legal: 'Impressum und Datenschutz', credit: 'Die Fotos stammen von der Instagram- und Facebook-Seite der Bar sowie aus Google-Uploads von Gästen, farblich bearbeitet. 3D-Modelle: Helindu, Adamante, Arkify (CC BY 4.0). Website: kettő.'
    },
    en: {
      skip: 'Skip to content', introSkip: 'Click to continue', navPince: 'The cellar', navGin: 'Gins', navMenu: 'Drinks', navHours: 'Opening hours', menuBtn: 'Menu',
      heroTitle: 'Gin bar in Sopron, in the cellar at Várkerület 22',
      heroLead: 'More than 50 gins, with tonics and cocktails. Open until midnight Tuesday to Thursday, and until 2 am on Friday and Saturday.',
      book: 'Book a table', seeMenu: 'Drinks menu', byPhone: 'Book by phone:',
      pinceTitle: 'The cellar', pinceTxt: 'From the street door a staircase leads down into the vaulted cellar. Stone and brick walls, red light behind the bar, candles and gin in the niches. It stays cool even in summer.',
      capPince: 'Under the brick vault', capLepcso: 'The stairs from the street', capFulke: 'Candle and gin in a niche', capKalitka: 'Birdcage and candles on the bar', capKand: 'Gin and tonic with lemon, the fireplace behind', capTabla: 'The sign above the bar',
      polcTitle: 'Behind the bar', polcTxt: 'Fairy lights glow inside the bottles, and the cocktails are mixed at the bar. The photos come from the bar\u2019s Instagram and Facebook pages.', sk2: 'Green cocktail with basil', sk3: 'Red cocktail with orange peel', sk4: 'Cocktail by the menu', sk5: 'Cocktail with foam',
      ginTitle: 'House selection', ginTxt: 'Out of more than 50 gins, these are the seven we recommend, served as 4 cl. Pick the tonic at the bar: Fever-Tree, Thomas Henry, Schweppes or Kinley.',
      menuTitle: 'Drinks', menuNote: 'Prices in forints, from the menu we use at the bar, and they may change. At the bar you always get the current menu. No alcohol under 18.',
      igTxt: 'We post the weekend offer, such as Black Gin Weekend or Tiki Cocktail Weekend, on Instagram:',
      revTitle: 'Reviews', revScore: 'on Google, from 211 reviews', revLang: 'The quotes are in the original Hungarian.',
      hoursTitle: 'Opening hours', addrLbl: 'Address', telLbl: 'Phone', doorNote: 'The door opens from Várkerület, the bar is at the bottom of the stairs.',
      mapBtn: 'Load map', mapNote: 'The map is a Google service and only loads after you click.', capAjto: 'The entrance on Várkerület',
      legal: 'Legal notice and privacy', credit: 'Photos come from the bar’s Instagram and Facebook pages and from guests’ Google uploads, colour corrected. 3D models: Helindu, Adamante, Arkify (CC BY 4.0). Website: kettő.'
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
    var big = { kalitka2: 1600, fulke: 1600, buborek: 1300, tal: 1300, gt2: 1300, koktel2: 1300, monkey: 1100, opihr2: 1100, ginmare2: 1100, brock: 1100, amuerte2: 1100 }[n] || 1300;
    var small = { 1600: 800, 1300: 700, 1100: 600 }[big];
    return '<img data-k="' + n + '" src="img/' + n + '-' + big + '.webp?v=2" srcset="img/' + n + '-' + small + '.webp?v=2 ' + small + 'w, img/' + n + '-' + big + '.webp?v=2 ' + big + 'w" sizes="' + sizes + '" alt="' + esc(PICS[n] || '') + '" decoding="async">';
  }
  var ginI = -1;
  function renderGins() {
    $('#ginList').innerHTML = GINS.map(function (g, i) {
      return '<li class="' + (reduced ? '' : 'rv') + (i === ginI ? ' is-on' : '') + '" style="--i:' + i + '"><button type="button" data-i="' + i + '" aria-pressed="' + (i === ginI) + '"><b>' + esc(g[0]) + '</b><em>' + price(g[2]) + ' · 4 cl</em><span>' + esc(L(g[1])) + '</span></button></li>';
    }).join('');
  }
  function swapPic(frame, n, sizes, instant) {
    var cur = $('img.is-on', frame);
    if (cur && cur.getAttribute('data-k') === n) return;
    var im = $('img[data-k="' + n + '"]', frame);
    if (!im) { frame.insertAdjacentHTML('beforeend', pic(n, sizes)); im = frame.lastElementChild; }
    if (instant) { $$('img', frame).forEach(function (x) { x.classList.remove('was', 'is-on'); }); im.classList.add('nt', 'is-on'); frame.appendChild(im); requestAnimationFrame(function () { requestAnimationFrame(function () { im.classList.remove('nt'); }); }); return; }
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
  function renderMenu(instant) {
    var g = MENU[tabI], list = $('#menuList');
    list.setAttribute('aria-labelledby', 'tab' + tabI);
    list.classList.toggle('one', !!g.one); list.classList.toggle('static', !!instant);
    $('#pgCat').textContent = L(g.k);
    $$('[data-no]').forEach(function (n) { n.textContent = 2 + tabI * 2 + (n.getAttribute('data-no') === 'r' ? 1 : 0); });
    list.innerHTML = g.items.map(function (it, k) {
      return '<div class="mi" style="--i:' + k + '"><b>' + esc(L(it[0])) + '</b><em>' + price(it[2]) + '</em>' + (it[1] ? '<span>' + esc(L(it[1])) + '</span>' : '') + '</div>';
    }).join('');
    swapPic($('#menuFrame'), g.pic, '(min-width: 1000px) 40vw, 90vw', instant);
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
  /* itallap lapozása: asztali gépen valódi lapfordítás a gerinc körül, máshol sima csere */
  var turning = false;
  function snap(el, cls) { var c = el.cloneNode(true); c.removeAttribute('id'); $$('[id]', c).forEach(function (x) { x.removeAttribute('id'); }); $$('[role],[aria-live]', c).forEach(function (x) { x.removeAttribute('role'); x.removeAttribute('aria-live'); }); var l = $('.menu__list', c); if (l) l.classList.add('static'); if (cls) c.classList.add(cls); return c; }
  function setTab(i, focus) {
    if (i === tabI) return;
    var book = $('#book'), wide = rich && innerWidth > 1000;
    if (!wide || turning) { tabI = i; renderTabs(); renderMenu(); if (focus) $('#tab' + tabI).focus(); return; }
    turning = true;
    var dir = i > tabI ? 1 : -1, pL = $('#pgL'), pR = $('#pgR');
    var oL = snap(pL), oR = snap(pR);
    tabI = i; renderTabs(); renderMenu(true); if (focus) $('#tab' + tabI).focus();
    var nL = snap(pL, 'back'), nR = snap(pR, 'back');
    var leaf = document.createElement('div'), cover = document.createElement('div');
    leaf.className = 'leaf leaf--' + (dir > 0 ? 'f' : 'b'); leaf.setAttribute('aria-hidden', 'true');
    cover.className = 'cover'; cover.setAttribute('aria-hidden', 'true'); cover.style.left = dir > 0 ? '0' : '50%';
    if (dir > 0) { leaf.appendChild(oR); leaf.appendChild(nL); cover.appendChild(oL); } else { leaf.appendChild(oL); leaf.appendChild(nR); cover.appendChild(oR); }
    [oL, oR].forEach(function (x) { x.style.position = 'absolute'; x.style.inset = '0'; x.style.minHeight = '0'; });
    book.appendChild(cover); book.appendChild(leaf);
    var st = { a: 0 };
    gsap.to(st, { a: 1, duration: 1.05, ease: 'power2.inOut', onUpdate: function () {
      var a = st.a, sh = Math.sin(a * Math.PI);
      leaf.style.transform = 'rotateY(' + (dir > 0 ? -180 * a : 180 * a).toFixed(2) + 'deg)';
      leaf.style.setProperty('--sh', (a < .5 ? a * 1.2 : (1 - a) * 1.2).toFixed(3));
      cover.style.setProperty('--sh', ((1 - a) * .9 * (a > .5 ? 1 : sh)).toFixed(3));
    }, onComplete: function () { leaf.remove(); cover.remove(); turning = false; } });
  }
  $('#tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    setTab(+b.id.slice(3));
  });
  $('#tabs').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    setTab((tabI + (e.key === 'ArrowRight' ? 1 : MENU.length - 1)) % MENU.length, true); e.preventDefault();
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

  /* ------------------------------------------------------------------ nyitókép: felkapcsolnak a fények (WebGL, csak valódi GPU-n)
     Sötét pultnál indulunk: előbb a két mécses gyullad meg pislákolva, aztán balról jobbra kigyullad a vörös hátsó pult,
     végül feljön a fény. Utána a mécsesek finoman pislákolnak, egérre a kép alig mozdul, lefelé görgetve a pult elsötétül. */
  var hero = $('#top'), heroImg = $('#heroImg'), G = { ok: false };
  if (!reduced && hwGpu && !window.__noGl) (function () {
    var cv = $('#heroGl'), gl = cv.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
    if (!gl) return;
    var vs = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
    var fs = [
      'precision highp float;varying vec2 v;uniform sampler2D uI;uniform vec2 uRes,uIs,uM,uCr;uniform float uT,uAmb,uC1,uC2,uBar,uDim,uK;',
      'vec2 cover(vec2 q){vec2 s=uRes/uIs;float k=max(s.x,s.y)*uK;vec2 sz=uIs*k;vec2 off=(uRes-sz)*vec2(.58,.52);return (q*uRes-off)/sz;}',
      'float el(vec2 a,vec2 c,vec2 r){vec2 d=(a-c)/r;return exp(-dot(d,d));}',
      'void main(){',
      ' vec2 uv=cover(vec2(v.x,1.-v.y)+uM); vec3 c=texture2D(uI,uv).rgb;',
      ' vec2 o=vec2(uCr.x+uv.x*uCr.y,uv.y);',                       // az eredeti (teljes) fotó koordinátái
      ' float f1=1.+.07*sin(uT*11.)*sin(uT*4.3+1.)+.03*sin(uT*23.7);',
      ' float f2=1.+.07*sin(uT*9.2+2.)*sin(uT*5.1)+.03*sin(uT*19.3+1.);',
      ' float m1=el(o,vec2(.383,.535),vec2(.075,.1))+.8*el(o,vec2(.39,.76),vec2(.035,.16));',
      ' float m2=el(o,vec2(.778,.56),vec2(.085,.11))+.8*el(o,vec2(.79,.8),vec2(.04,.17));',
      ' float red=smoothstep(.06,.32,c.r-max(c.g,c.b));',
      ' float reg=smoothstep(.31,.4,o.x)*smoothstep(.62,.5,o.y);',
      ' float sweep=smoothstep(uBar,uBar-.22,o.x);',
      ' float bar=reg*sweep*(.45+.75*red);',
      ' float lit=uAmb+(1.-uAmb)*clamp(m1*uC1*f1+m2*uC2*f2+bar,0.,1.15);',
      ' lit=mix(lit,lit*f1*.5+lit*f2*.5,(m1+m2)*.6*uAmb);',
      ' lit*=1.-uDim*(.5-.42*clamp(m1+m2,0.,1.));',
      ' vec3 col=c*lit;',
      ' col+=vec3(1.,.55,.22)*(.10*uC1*f1*el(o,vec2(.383,.53),vec2(.11,.14))+.10*uC2*f2*el(o,vec2(.778,.55),vec2(.12,.15)))*(1.-.6*uAmb);',
      ' col+=vec3(.9,.08,.04)*.06*bar*(1.-uAmb);',
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
    var U = {}; ['uI', 'uRes', 'uIs', 'uM', 'uCr', 'uT', 'uAmb', 'uC1', 'uC2', 'uBar', 'uDim', 'uK'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
    // ugyanazt a fájlt töltjük, amelyet a böngésző a <picture>-ből választott
    var src = heroImg.currentSrc || heroImg.src, mob = /herom-/.test(src);
    var img = new Image(); img.src = src; hero.classList.add('gl-wait');
    G.L = { amb: .12, c1: 0, c2: 0, bar: -.25, dim: 0 }; G.m = [0, 0]; G.t = [0, 0]; G.vis = true; G.run = false; G.on = false;
    function size() {
      var dpr = Math.min(devicePixelRatio || 1, canHover ? 1.5 : 1.25), w = hero.clientWidth, h = hero.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(U.uRes, cv.width, cv.height);
    }
    img.decode().then(function () {
      var tx = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      gl.uniform1i(U.uI, 0); gl.uniform2f(U.uIs, img.naturalWidth, img.naturalHeight);
      gl.uniform2f(U.uCr, mob ? .30 : 0, mob ? .56 : 1); gl.uniform1f(U.uK, canHover ? 1.03 : 1);
      size(); G.ok = true; frame(); hero.classList.add('gl-on'); hero.classList.remove('gl-wait'); G.kick();
    }).catch(function () { hero.classList.remove('gl-wait'); });
    var t0 = performance.now();
    function frame() {
      G.m[0] += (G.t[0] - G.m[0]) * .06; G.m[1] += (G.t[1] - G.m[1]) * .06;
      var L = G.L;
      gl.uniform2f(U.uM, G.m[0], G.m[1]);
      gl.uniform1f(U.uT, (performance.now() - t0) / 1000);
      gl.uniform1f(U.uAmb, L.amb); gl.uniform1f(U.uC1, L.c1); gl.uniform1f(U.uC2, L.c2); gl.uniform1f(U.uBar, L.bar); gl.uniform1f(U.uDim, L.dim);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!G.vis) { G.run = false; gsap.ticker.remove(frame); }
    }
    G.frame = frame;
    G.kick = function () { if (G.ok && G.vis && !G.run) { G.run = true; gsap.ticker.add(frame); } };
    // a felkapcsolás: mécsesek pislákolva, aztán a vörös pult balról jobbra, végül a teljes fény
    G.lightUp = function () {
      var L = G.L, tl = gsap.timeline();
      tl.to(L, { c1: .9, duration: .06 }, .15).to(L, { c1: .25, duration: .08 }, .23).to(L, { c1: 1, duration: .5, ease: 'power2.out' }, .33)
        .to(L, { c2: .8, duration: .06 }, .55).to(L, { c2: .2, duration: .1 }, .62).to(L, { c2: 1, duration: .5, ease: 'power2.out' }, .74)
        .to(L, { bar: 1.25, duration: 1.6, ease: 'power2.inOut' }, 1.0)
        .to(L, { amb: 1, duration: 1.8, ease: 'power2.inOut' }, 1.6);
      return tl;
    };
    if (canHover) hero.addEventListener('mousemove', function (e) { G.t = [(e.clientX / innerWidth - .5) * .012, (e.clientY / innerHeight - .5) * .008]; });
    // lefelé görgetve a pult fényei elhalványulnak, a mécsesek maradnak
    ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', onUpdate: function (s) { G.L.dim = s.progress; } });
    var ro = new ResizeObserver(function () { if (G.ok) { size(); G.frame(); } }); ro.observe(hero);
    new IntersectionObserver(function (es) { G.vis = es[0].isIntersecting; if (G.vis) G.kick(); }).observe(hero);
  })();

  /* ------------------------------------------------------------------ 3D copa pohár (three.js modul, csak valódi GPU-n, lustán töltve) */
  function initGlass(stage) {
    if (reduced || !hwGpu || window.__noGl || !('IntersectionObserver' in window)) return null;
    var cv = document.createElement('canvas'), S = { p: 0, mx: 0, my: 0, dpr: rich ? 1.5 : 2 }, ready = false, vis = false, run = false, asked = false;
    cv.className = 'tunnel__gl'; stage.appendChild(cv);
    function tick() { if (!ready || !vis) { gsap.ticker.remove(tick); run = false; return; } S.frame(); }
    S.kick = function () { if (ready && vis && !run) { run = true; gsap.ticker.add(tick); } };
    new IntersectionObserver(function (es) {
      var e = es[es.length - 1];
      if (e.isIntersecting && !asked) {
        asked = true;
        import(new URL('js/glass.js?v=2', document.baseURI).href).then(function (m) { return m.init(cv, S); })
          .then(function () { ready = true; cv.classList.add('on'); S.kick(); })
          .catch(function () { cv.remove(); });
      }
    }, { rootMargin: '120% 0px' }).observe(stage);
    new IntersectionObserver(function (es) { vis = es[es.length - 1].isIntersecting; S.kick(); }).observe(stage);
    if (rich) addEventListener('mousemove', function (e) { S.mx = e.clientX / innerWidth * 2 - 1; S.my = e.clientY / innerHeight * 2 - 1; }, { passive: true });
    S.cv = cv;
    return S;
  }

  /* ------------------------------------------------------------------ átjáró: keretek egymás mögött, mint a boltívek; középen a pohár megtelik */
  function initTunnel() {
    var tun = $('#tunnel'), st = $('#tunnelStage');
    if (!rich) {
      // érintőn és kis képernyőn: egy képernyőnyi jelenet, a pohár egyszer, időzítve megtelik
      var M = initGlass(st);
      if (!M) return;
      tun.classList.add('is-mob');
      var played = false;
      new IntersectionObserver(function (es) {
        if (played || !es[es.length - 1].isIntersecting) return;
        played = true;
        gsap.to(M, { p: .84, duration: 7.5, ease: 'none', delay: .3, onUpdate: function () { M.kick && M.kick(); } });
      }, { threshold: .55 }).observe(tun);
      return;
    }
    var N = 7, gap = 650, fr = [];
    for (var i = 0; i < N; i++) {
      var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('class', 'deco tunnel__fr'); s.setAttribute('data-deco', 'tunnel');
      st.insertBefore(s, st.firstChild); fr.push(s);
    }
    drawAllDeco();
    var end = $('.tunnel__end', st), D = N * gap + 700, GS = initGlass(st);
    function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
    function upd(p) {
      var z0 = p * D;
      fr.forEach(function (s, i) {
        var z = -(i + 1) * gap + z0;
        var o = z > 700 ? 0 : z > 380 ? 1 - (z - 380) / 320 : z < -3600 ? 0 : z < -2600 ? (z + 3600) / 1000 : 1;
        s.style.transform = 'translate3d(0,0,' + z.toFixed(1) + 'px)'; s.style.opacity = (o * (GS ? .75 : 1)).toFixed(3);
      });
      var ze = -D + z0;
      end.style.transform = 'translate3d(0,0,' + ze.toFixed(1) + 'px)';
      end.style.setProperty('--d', (1 - Math.min(1, Math.max(0, (p - .72) / .26)) * .85).toFixed(3));
      if (GS) { GS.p = p; GS.cv.style.opacity = (sm(.0, .07, p) * (1 - sm(.86, .95, p))).toFixed(3); }
    }
    upd(0);
    ScrollTrigger.create({ trigger: '#tunnel', start: 'top bottom', end: 'bottom bottom', scrub: true, onUpdate: function (s) { upd(s.progress); } });
  }

  /* a pult mögül: balról jobbra végigfut a polc alatti vörös LED, és ahol elhalad, ott kigyullad a kép.
     Asztali gépen a görgetés viszi, érintőn egyszer, időzítve fut le. */
  function initShelf() {
    if (reduced) return;
    $$('[data-shelf]').forEach(function (sh) {
      var it = $$('.sh', sh), N = it.length, st = { w: 0 };
      function upd() {
        var w = st.w * N;
        it.forEach(function (el, i) {
          var s = Math.min(1, Math.max(0, w - i)), l = Math.min(1, Math.max(0, (w - i - .15) / .7));
          el.style.setProperty('--s', s.toFixed(3)); el.style.setProperty('--l', (l * l * (3 - 2 * l)).toFixed(3));
        });
      }
      upd();
      if (rich) ScrollTrigger.create({ trigger: sh, start: 'top 85%', end: 'bottom 55%', scrub: .6, onUpdate: function (x) { st.w = x.progress * 1.04; upd(); } });
      else ScrollTrigger.create({ trigger: sh, start: 'top 75%', once: true, onEnter: function () { gsap.to(st, { w: 1.04, duration: 2.2, ease: 'power1.inOut', onUpdate: upd }); } });
    });
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
    if (G.lightUp) G.lightUp();
    else if (!reduced) gsap.fromTo(heroImg, { opacity: .25 }, { opacity: 1, duration: 2.4, ease: 'power2.inOut', clearProps: 'opacity' });
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
    observeBl(); initReveal(); initQuotes(); initTunnel(); initShelf(); initParallax();
    runIntro();
    ScrollTrigger.refresh();
  });
})();
