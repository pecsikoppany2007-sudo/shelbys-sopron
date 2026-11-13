/* Shelby's Gin Bar – bemutató oldal, v5: egy éjszaka 18:00-tól 02:00-ig.
   GSAP + ScrollTrigger. Egérrel Lenis (lassabb, puhább görgetés), érintőn natív görgetés: ott semmi nem követi az ujjat,
   csak egyszeri, időzített mozgások vannak. A fejléc csíkján halad az este, ahogy lefelé görget; v6: gyertyafény és régi film (címkártya, írisz, szemcse),
   a címek szavanként jönnek elő a sötétből, gyertyafény-foltok lobognak a címek mögött, az egér is visz egy kis fényt. */
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
      skip: 'Zum Inhalt', introSkip: 'Zum Fortfahren klicken', hTop: 'Öffnung', navPult: 'Auf der Bar', navRev: 'Bewertungen', navEnd: 'Sperrstunde', ntLbl: 'Die Stunden des Abends', nowLbl: 'jetzt', lastCall: 'Freitag und Samstag schließen wir um 2:00 Uhr', navPince: 'Der Keller', navGin: 'Gins', navMenu: 'Getränkekarte', navHours: 'Öffnungszeiten', menuBtn: 'Menü',
      heroTitle: 'Gin-Bar in Sopron, im Keller der Várkerület 22',
      heroLead: 'Über 50 Gins, dazu Tonics und Cocktails. Dienstag bis Donnerstag bis Mitternacht, Freitag und Samstag bis 2 Uhr früh geöffnet.',
      book: 'Tisch reservieren', seeMenu: 'Getränkekarte', byPhone: 'Reservierung telefonisch:',
      pinceTitle: 'Der Keller', pinceTxt: 'Von der Straßentür führt eine Treppe hinunter in den Gewölbekeller. Wände aus Stein und Ziegel, hinter der Bar rotes Licht, in den Nischen Kerzen und Gin. Auch im Sommer bleibt es kühl.',
      capPince: 'Die Bar, dahinter die Flaschen', capLepcso: 'Die Treppe von der Straße', capFulke: 'Kerze und Gin in der Nische', capKalitka: 'Vogelkäfig und Kerzen auf der Bar', capKand: 'Gin Tonic mit Zitrone, dahinter der Kamin', capTabla: 'Die Tafel über der Bar',
      polcTitle: 'Auf der Bar', polcTxt: 'In den Ginflaschen auf der Bar leuchten Lichterketten. Die Flaschen stammen von den eigenen Fotos der Bar.',
      ginTitle: 'Empfehlung des Hauses', ginTxt: 'Aus über 50 Gins empfehlen wir diese sieben, je 4 cl. Das Tonic wählen Sie an der Bar: Fever-Tree, Thomas Henry, Schweppes oder Kinley.',
      menuTitle: 'Getränkekarte', menuNote: 'Preise in Forint, nach der Karte in der Bar, Änderungen vorbehalten. An der Bar bekommen Sie immer die aktuelle Karte. Kein Alkohol unter 18 Jahren.',
      igTxt: 'Das Wochenendangebot, etwa das Black Gin Weekend oder das Tiki Cocktail Weekend, steht auf Instagram:',
      revTitle: 'Bewertungen', revScore: 'bei Google, aus 211 Bewertungen', revLang: 'Die Zitate stehen im ungarischen Original.',
      hoursTitle: 'Öffnungszeiten', addrLbl: 'Adresse', telLbl: 'Telefon', doorNote: 'Die Tür liegt an der Várkerület, die Bar ist unten an der Treppe.',
      mapBtn: 'Karte laden', mapNote: 'Die Karte ist ein Dienst von Google und wird erst nach dem Klick geladen.', capAjto: 'Der Eingang an der Várkerület',
      legal: 'Impressum und Datenschutz', credit: 'Die Fotos stammen von der Instagram- und Facebook-Seite der Bar sowie aus Google-Uploads von Gästen, farblich bearbeitet. Website: kettő.'
    },
    en: {
      skip: 'Skip to content', introSkip: 'Click to continue', hTop: 'Opening', navPult: 'On the bar', navRev: 'Reviews', navEnd: 'Closing time', ntLbl: 'The hours of the evening', nowLbl: 'now', lastCall: 'On Friday and Saturday we close at 2:00 am', navPince: 'The cellar', navGin: 'Gins', navMenu: 'Drinks', navHours: 'Opening hours', menuBtn: 'Menu',
      heroTitle: 'Gin bar in Sopron, in the cellar at Várkerület 22',
      heroLead: 'More than 50 gins, with tonics and cocktails. Open until midnight Tuesday to Thursday, and until 2 am on Friday and Saturday.',
      book: 'Book a table', seeMenu: 'Drinks menu', byPhone: 'Book by phone:',
      pinceTitle: 'The cellar', pinceTxt: 'From the street door a staircase leads down into the vaulted cellar. Stone and brick walls, red light behind the bar, candles and gin in the niches. It stays cool even in summer.',
      capPince: 'The bar, with the bottles behind it', capLepcso: 'The stairs from the street', capFulke: 'Candle and gin in a niche', capKalitka: 'Birdcage and candles on the bar', capKand: 'Gin and tonic with lemon, the fireplace behind', capTabla: 'The sign above the bar',
      polcTitle: 'On the bar', polcTxt: 'Fairy lights glow inside the gin bottles on the bar. The bottles come from the bar\u2019s own photos.',
      ginTitle: 'House selection', ginTxt: 'Out of more than 50 gins, these are the seven we recommend, served as 4 cl. Pick the tonic at the bar: Fever-Tree, Thomas Henry, Schweppes or Kinley.',
      menuTitle: 'Drinks', menuNote: 'Prices in forints, from the menu we use at the bar, and they may change. At the bar you always get the current menu. No alcohol under 18.',
      igTxt: 'We post the weekend offer, such as Black Gin Weekend or Tiki Cocktail Weekend, on Instagram:',
      revTitle: 'Reviews', revScore: 'on Google, from 211 reviews', revLang: 'The quotes are in the original Hungarian.',
      hoursTitle: 'Opening hours', addrLbl: 'Address', telLbl: 'Phone', doorNote: 'The door opens from Várkerület, the bar is at the bottom of the stairs.',
      mapBtn: 'Load map', mapNote: 'The map is a Google service and only loads after you click.', capAjto: 'The entrance on Várkerület',
      legal: 'Legal notice and privacy', credit: 'Photos come from the bar’s Instagram and Facebook pages and from guests’ Google uploads, colour corrected. Website: kettő.'
    }
  };
  var LI = { hu: 0, de: 1, en: 2 }, lang = 'hu', huText = {};
  $$('[data-i18n]').forEach(function (el) { huText[el.getAttribute('data-i18n')] = el.textContent; });
  var HU = { hTop: 'Nyitás', navPult: 'A pulton', navRev: 'Vélemények', navEnd: 'Záróra', ntLbl: 'Az este órái', nowLbl: 'most' };
  for (var hk in HU) if (!(hk in huText)) huText[hk] = HU[hk];
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
    var b = bud(), now = $('#ntNow'), rel = (b.m - 18 * 60 + 1440) % 1440;
    now.hidden = !(s.open && rel <= 480);
    if (!now.hidden) now.style.left = (rel / 480 * 100).toFixed(2) + '%';
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

  /* ------------------------------------------------------------------ kirajzolás */
  function pic(n, sizes) {
    var big = { kalitka2: 1600, fulke: 1600, buborek: 1300, tal: 1300, gt2: 1300, koktel2: 1300, monkey: 1100, opihr2: 1100, ginmare2: 1100, brock: 1100, amuerte2: 1100 }[n] || 1300;
    var small = { 1600: 800, 1300: 700, 1100: 600 }[big];
    return '<img data-k="' + n + '" src="img/' + n + '-' + big + '.webp?v=7" srcset="img/' + n + '-' + small + '.webp?v=7 ' + small + 'w, img/' + n + '-' + big + '.webp?v=7 ' + big + 'w" sizes="' + sizes + '" alt="' + esc(PICS[n] || '') + '" decoding="async">';
  }
  function renderGins() {
    $('#ginList').innerHTML = GINS.map(function (g, i) {
      var sm = { 1600: 800, 1300: 700, 1100: 600 }[{ fulke: 1600, kalitka2: 1600 }[g[3]] || 1100];
      return '<li class="' + (reduced ? '' : 'rv') + '" style="--i:' + i + '" data-i="' + i + '"><img class="gl__t" src="img/' + g[3] + '-' + sm + '.webp?v=7" alt="" loading="lazy" decoding="async"><span class="gl__n">' + esc(g[0]) + '</span><span class="gl__d">' + esc(L(g[1])) + '</span><span class="gl__p">' + price(g[2]) + '<small>4 cl</small></span></li>';
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

  /* ------------------------------------------------------------------ címek: szavanként, lassan jönnek elő a sötétből */
  function splitBl() {
    $$('.bl').forEach(function (h) {
      var tx = h.getAttribute('data-txt') || h.textContent; h.setAttribute('data-txt', tx); h.setAttribute('aria-label', tx);
      h.innerHTML = tx.split(/[ \n\t]+/).filter(Boolean).map(function (w, i) { return '<span class="wd" aria-hidden="true" style="--i:' + i + '">' + esc(w) + '</span>'; }).join(' ');
    });
  }
  /* gyertyafény-foltok a címek mögött; csak akkor lobognak, amikor látszanak */
  function initCandles() {
    var vs = ['', ' cdl--b', ' cdl--c'];
    var els = $$('.pince__txt,.ginek__head,.fenyek__head,.menu__head,.rev,.panel').map(function (c, i) {
      c.insertAdjacentHTML('afterbegin', '<i class="cdl' + vs[i % 3] + '" aria-hidden="true"></i>'); return c.firstElementChild;
    });
    if (reduced) return;
    var o = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('on', e.isIntersecting); }); }) : null;
    els.forEach(function (e) { if (o) o.observe(e); else e.classList.add('on'); });
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
    $$('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
    $$('.nt__h').forEach(function (a) { a.setAttribute('aria-label', a.firstChild.textContent + ':00, ' + t(a.getAttribute('data-k'))); a.title = t(a.getAttribute('data-k')); });
    $('#ntNow').setAttribute('data-t', t('nowLbl'));
    renderLive(); renderHours(); renderLive(); renderGins(); renderTabs(); renderMenu();
    splitBl();
    $$('.bl').forEach(function (h) { if (ready && h.getBoundingClientRect().top < innerHeight) h.classList.add('lit'); });
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
  /* ginek: egérrel a gin fotója kis késéssel követi a mutatót, a mozgás irányába alig dől */
  (function () {
    if (!rich) return;
    var gl = $('#ginList'), pv = $('#gpv'), px = 0, py = 0, tx = 0, ty = 0, vx = 0, run = false, cur = -1;
    function show(i) {
      if (i === cur) return; cur = i;
      if (i < 0) { pv.classList.toggle('on', false); return; }
      var n = GINS[i][3], im = $('img[data-k="' + n + '"]', pv);
      if (!im) { pv.insertAdjacentHTML('beforeend', pic(n, '320px')); im = pv.lastElementChild; }
      $$('img', pv).forEach(function (x) { x.classList.toggle('is-on', x === im); });
      pv.classList.add('on');
    }
    function tick() {
      var dx = tx - px; px += dx * .14; py += (ty - py) * .14; vx += (dx * .02 - vx) * .2;
      pv.style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0) rotate(' + Math.max(-6, Math.min(6, vx)).toFixed(2) + 'deg)';
      if (Math.abs(dx) < .2 && Math.abs(ty - py) < .2 && cur < 0) { run = false; gsap.ticker.remove(tick); }
    }
    gl.addEventListener('mousemove', function (e) {
      tx = e.clientX + 36; ty = e.clientY - pv.offsetHeight * .62;
      if (!run) { if (cur < 0) { px = tx; py = ty; } run = true; gsap.ticker.add(tick); }
      var li = e.target.closest('li'); show(li ? +li.getAttribute('data-i') : -1);
    });
    gl.addEventListener('mouseleave', function () { show(-1); });
  })();

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

  /* fejléc: a nyitókép után sötét háttér; alatta az éjszaka csíkja.
     Minden szakasz egy óra (18 nyitás, 19 pince, 20 ginek, 21 pult, 22 itallap, 23 vélemények, 00 nyitvatartás, 02 lábléc),
     a kitöltés és a pont a görgetéssel együtt halad az órák között. */
  var hd = $('#hd'), navA = $$('.hd__nav a'), ntFill = $('#ntFill'), ntDot = $('#ntDot'), ntH = $$('.nt__h'), nt = $('#nt');
  var HSEC = [['top', 0], ['pince', 1], ['ginek', 2], ['pult', 3], ['itallap', 4], ['velemenyek', 5], ['nyitva', 6]], hPos = [], ntW = 0, lastH = -1;
  function measureNight() {
    var y = lenis ? lenis.scroll : scrollY;
    hPos = HSEC.map(function (x) { return [document.getElementById(x[0]).getBoundingClientRect().top + y, x[1]]; });
    hPos[0][0] = 0;
    hPos.push([Math.max(document.documentElement.scrollHeight - innerHeight, hPos[hPos.length - 1][0] + 1), 8]);
    ntW = nt.clientWidth;
  }
  var calmT = 0;
  function onScroll(y) {
    if (!reduced) { html.classList.remove('calm'); clearTimeout(calmT); calmT = setTimeout(function () { html.classList.add('calm'); }, 350); }
    hd.classList.toggle('is-solid', y > innerHeight * 0.8);
    if (!hPos.length) return;
    var p = y + innerHeight * .35, h = 0;
    if (y >= hPos[hPos.length - 1][0] - 2) h = 8;
    else for (var i = 0; i < hPos.length - 1; i++) {
      if (p >= hPos[i][0] && p < hPos[i + 1][0]) { h = hPos[i][1] + (p - hPos[i][0]) / (hPos[i + 1][0] - hPos[i][0]) * (hPos[i + 1][1] - hPos[i][1]); break; }
      if (i === hPos.length - 2) h = p < hPos[0][0] ? 0 : 8;
    }
    var f = Math.max(0, Math.min(1, h / 8));
    ntFill.style.transform = 'scaleX(' + f.toFixed(4) + ')';
    ntDot.style.transform = 'translate3d(' + (f * ntW).toFixed(1) + 'px,0,0)';
    var fh = Math.floor(h + .001);
    if (fh !== lastH) {
      lastH = fh;
      ntH.forEach(function (a) { a.classList.toggle('on', +a.getAttribute('data-h') === fh); });
      var cur = { 1: 0, 2: 1, 4: 2, 6: 3 }[fh]; navA.forEach(function (a, i) { a.classList.toggle('is-cur', i === cur); });
    }
  }
  if (lenis) lenis.on('scroll', function (l) { onScroll(l.scroll); });
  else addEventListener('scroll', function () { onScroll(scrollY); }, { passive: true });
  ScrollTrigger.addEventListener('refresh', function () { measureNight(); onScroll(lenis ? lenis.scroll : scrollY); });

  /* ------------------------------------------------------------------ kurzor: kis világos pont, linken nagy áttetsző körré nő */
  var cur = $('#cur'), cg = $('#cglow'), gx = innerWidth / 2, gy = innerHeight / 2, tgx = gx, tgy = gy, gRun = false;
  function gTick() {
    gx += (tgx - gx) * .07; gy += (tgy - gy) * .07;
    cg.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px,0)';
    if (Math.abs(tgx - gx) < .3 && Math.abs(tgy - gy) < .3) { gRun = false; gsap.ticker.remove(gTick); }
  }
  if (rich) {
    addEventListener('mousemove', function (e) {
      cur.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)'; cur.style.opacity = 1;
      tgx = e.clientX; tgy = e.clientY; if (!cg.classList.contains('on')) { gx = tgx; gy = tgy; cg.classList.add('on'); }
      if (!gRun) { gRun = true; gsap.ticker.add(gTick); }
    }, { passive: true });
    document.addEventListener('mouseleave', function () { cg.classList.remove('on'); });
    document.addEventListener('mouseover', function (e) { var on = !!e.target.closest('a,button,[role="tab"],.gl li'); if (on !== cur.classList.contains('on-link')) cur.classList.toggle('on-link', on); });
    addEventListener('mousedown', function () { cur.classList.add('down'); });
    addEventListener('mouseup', function () { cur.classList.remove('down'); });
    document.addEventListener('mouseleave', function () { cur.style.opacity = 0; });
    document.addEventListener('mouseenter', function () { cur.style.opacity = 1; });
  }

  /* ------------------------------------------------------------------ nyitókép: felkapcsolnak a fények (WebGL, csak valódi GPU-n)
     Sötét pultnál indulunk: előbb a lámpásban a mécses gyullad meg pislákolva, aztán balról jobbra kigyullad a vörös pult,
     végül feljön a fény. Utána a mécses finoman pislákol, egérre a kép alig mozdul, lefelé görgetve a pult elsötétül. */
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
      ' float m1=el(o,vec2(.068,.736),vec2(.035,.05))+.6*el(o,vec2(.068,.72),vec2(.07,.1));',
      ' float m2=0.;',
      ' float red=smoothstep(.06,.32,c.r-max(c.g,c.b));',
      ' float reg=smoothstep(.34,.46,o.y);',
      ' float sweep=smoothstep(uBar,uBar-.22,o.x);',
      ' float bar=reg*sweep*(.45+.75*red);',
      ' float lit=uAmb+(1.-uAmb)*clamp(m1*uC1*f1+m2*uC2*f2+bar,0.,1.15);',
      ' lit=mix(lit,lit*f1*.5+lit*f2*.5,(m1+m2)*.6*uAmb);',
      ' lit*=1.-uDim*(.5-.42*clamp(m1+m2,0.,1.));',
      ' vec3 col=c*lit;',
      ' col+=vec3(1.,.55,.22)*(.10*uC1*f1*el(o,vec2(.068,.72),vec2(.09,.12)))*(1.-.6*uAmb);',
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
    var src = heroImg.currentSrc || heroImg.src, mob = /hero3m-/.test(src);
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
      gl.uniform2f(U.uCr, mob ? .239 : 0, mob ? .522 : 1); gl.uniform1f(U.uK, canHover ? 1.03 : 1);
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

  /* a pulton: a palackok sorban felkapcsolnak, mint egy valódi palacklámpa (felvillan, visszaesik, aztán ég).
     Asztali gépen a görgetés viszi (kitűzve), és az egérre a sor alig fordul; érintőn egyszer, időzítve fut le. */
  function initBottles() {
    if (reduced) return;
    var pal = $('#pal'), it = $$('.pal__it', pal), N = it.length, st = { w: 0 };
    function flick(f) { return f <= 0 ? 0 : f < .12 ? f / .12 * .75 : f < .22 ? .75 - (f - .12) / .1 * .55 : f < .3 ? .2 + (f - .22) / .08 * .5 : f < .4 ? .7 - (f - .3) / .1 * .15 : Math.min(1, .55 + (f - .4) / .6 * .45); }
    function upd() {
      var w = st.w * (N + .6);
      it.forEach(function (el, i) { el.style.setProperty('--on', flick(Math.min(1, Math.max(0, (w - i) / 1.6))).toFixed(3)); });
    }
    upd();
    if (rich) {
      ScrollTrigger.create({ trigger: '#pult', start: 'top top', end: 'bottom bottom', scrub: .5, onUpdate: function (x) { st.w = Math.min(1, x.progress / .85); upd(); } });
      var rx = 0, ry = 0, tx = 0, ty = 0, on = false;
      function tilt() { rx += (tx - rx) * .06; ry += (ty - ry) * .06; pal.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)'; if (Math.abs(tx - rx) < .01 && Math.abs(ty - ry) < .01) { on = false; gsap.ticker.remove(tilt); } }
      $('#pult').addEventListener('mousemove', function (e) { ty = (e.clientX / innerWidth - .5) * 7; tx = -(e.clientY / innerHeight - .5) * 3; if (!on) { on = true; gsap.ticker.add(tilt); } });
    } else if (pal.scrollWidth > pal.clientWidth + 8) {
      // vízszintes sor: amelyik palack beúszik középre, az kapcsol fel
      it.forEach(function (el) { el.style.setProperty('--on', 0); });
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting || e.target._lit) return;
          var o = { f: 0 }, el = e.target; el._lit = true;
          gsap.to(o, { f: 1, duration: 1.5, ease: 'none', delay: .15, onUpdate: function () { el.style.setProperty('--on', flick(o.f).toFixed(3)); } });
        });
      }, { threshold: .8 });
      it.forEach(function (el) { io.observe(el); });
    } else ScrollTrigger.create({ trigger: pal, start: 'top 70%', once: true, onEnter: function () { gsap.to(st, { w: 1, duration: 3.6, ease: 'none', onUpdate: upd }); } });
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
    }
    if (G.lightUp) G.lightUp();
    else if (!reduced) gsap.fromTo(heroImg, { opacity: .25 }, { opacity: 1, duration: 2.4, ease: 'power2.inOut', clearProps: 'opacity' });
  }
  function runIntro() {
    if (!html.classList.contains('intro-on')) { heroIn(); return; }
    html.classList.add('intro-run');
    var inn = $('.intro__in'), wd = $('.intro__word'), clk = $('.intro__clk'), pl = $('.intro__place'), gw = $('.intro__glow'), ir = { r: 0 };
    var R = Math.hypot(innerWidth, innerHeight) / 2 + 20;
    var tl = gsap.timeline({ onComplete: done });
    // sötétben áll a címkártya, 17:59; meggyullad a gyertya (a fény lentről, lassan nő és lobog), 18:00 lesz,
    // a fény felhozza a logót; végül íriszként, körben kinyílik a nyitókép
    tl.fromTo(inn, { opacity: 0 }, { opacity: 1, duration: .9, ease: 'power1.out' }, .1)
      .fromTo([pl, clk], { opacity: 0 }, { opacity: 1, duration: 1, ease: 'power1.out', stagger: .25 }, .3)
      .to(gw, { keyframes: [{ opacity: .55, scale: .32, duration: .14 }, { opacity: .3, scale: .3, duration: .18 }, { opacity: 1, scale: 1, duration: 1.6, ease: 'power2.out' }] }, 1.05)
      .to($$('.intro__clk .rl span'), { yPercent: -100, duration: .8, ease: 'expo.inOut', stagger: .06 }, 1.5)
      .fromTo(inn, { scale: .975 }, { scale: 1, duration: 3.8, ease: 'power2.out' }, 0)
      .to(wd, { opacity: 1, duration: 1.5, ease: 'power1.inOut' }, 1.9)
      .to(wd, { filter: 'drop-shadow(0 0 26px rgba(255,170,86,.35))', duration: 1.2, ease: 'power2.out' }, 2.3)
      .to(ir, { r: R, duration: 1.25, ease: 'power2.inOut', onUpdate: function () { intro.style.setProperty('--ir', ir.r.toFixed(1) + 'px'); } }, 3.7)
      .add(heroIn, 3.75);
    function skip() { if (tl.progress() < .7) tl.timeScale(5); }
    intro.addEventListener('click', skip); addEventListener('keydown', skip, { once: true }); addEventListener('wheel', skip, { once: true, passive: true }); addEventListener('touchstart', skip, { once: true, passive: true });
    function done() { intro.style.removeProperty('--ir'); html.classList.remove('intro-on', 'intro-run'); try { sessionStorage.setItem('sg-intro', '1'); } catch (e) {} if (lenis) lenis.start(); ScrollTrigger.refresh(); }
    if (lenis) lenis.stop();
  }

  /* ------------------------------------------------------------------ indulás */
  applyLang(startLang);
  var lw = innerWidth, lh = innerHeight;
  addEventListener('resize', function () {
    var dw = innerWidth !== lw, dh = Math.abs(innerHeight - lh) > 160;
    if (!dw && !dh) return;
    lw = innerWidth; lh = innerHeight;
    measureNight();
  });
  setInterval(renderLive, 60000);
  splitQuotes();
  document.fonts.ready.then(function () {
    ready = true; initCandles();
    observeBl(); initReveal(); initQuotes(); initBottles(); initParallax();
    runIntro();
    ScrollTrigger.refresh();
  });
})();
