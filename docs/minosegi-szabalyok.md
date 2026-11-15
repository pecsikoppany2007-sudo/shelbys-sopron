# Minőségi szabályok (a díjnyertes stúdiók szabályaiból)

Forrás: a darkroom.engineering nyilvános csapatszabályai (cc-settings, MIT licenc; a mozgásszabályaik Emil Kowalski MIT-licencű
anyagán alapulnak), a mi tapasztalatainkkal kiegészítve. A saját, részletes listánk: `allando-weboldal-szabalyok.md` (projekt-fájlok).
A minőségkapu (`npm test`) ezek közül mindent ellenőriz, amit gép ellenőrizni tud. A többi a te szemed és ízlésed dolga.

## 1. Mielőtt az első szakaszt megírod: az öt pontos terv

1. **Kinek szól, és mit akar, amikor megnyitja?** Például: turista a Várkerületen, asztalt akar foglalni ma estére.
2. **Mi az az egy állítás, amit az oldalnak be kell bizonyítania?** Egy sima mondatban.
3. **Mi a bizonyíték?** Valódi fotó, valódi étlap, valódi vélemény forrással, valódi szám. Bizonyíték nélküli szakasz nem kerül fel.
4. **Egy vizuális ötlet, ami a helyből jön:** az anyaga, a története, a neve. Ilyen volt a Darlingnál a telefon és a lámpák, a Cafe Flow-nál a neon.
5. **Betű, szín, sarokkerekítés, sűrűség:** mind tudatos döntés, és a stílusválasztóból jön.

Ha az 1–3. pont hiányzik, kérdezd meg. Logót, véleményt, számot vagy arcot soha ne találj ki.

## 2. A „sablonos oldal” jelei (ha 3 együtt van, újra kell gondolni)

- Kis jelvény a cím fölött, ami semmit nem jelent be.
- Középre zárt cím, alatta szürke alcím, mellette két gomb.
- Minden szakasz ugyanaz: kis színes felirat, nagy középre zárt cím, szürke alcím, rács.
- Három egyforma kártya ikonnal a tetején.
- „Hogyan működik”: számozott karikák vonallal összekötve.
- Számláló sáv, ami görgetésre pörög fel.
- Logósor, avatarhalom vagy ötcsillagos sor a valódi bizonyíték helyett.
- Minden csempe egyforma súlyú „bento” rács.
- Kitöltésnek használt GYIK és négyoszlopos lábléc.

**Szinte mindig reflex, kerülendő:** színátmenetes szöveg a címen; lila–kék vagy neon a sötéten; ragyogás a gombok alatt; elmosott foltok
a hero mögött; halványuló pont- vagy rácsháttér; üvegkártyák alapból; színes csík a kártyák szélén; kártya a kártyában; egy nagy kerekítés
mindenen; kis, ritkított nagybetűs felirat minden szakasz fölött; villám-, pajzs- vagy szikra-ikon; pulzáló „élő” pötty; minden szakasz
beúszik görgetésre; mindenhol ugyanaz a bő térköz.

## 3. Szöveg

- Tényből indulj, ne jelzőből: mit csinál a hely, kinek, milyen bizonyítékkal.
- Tilos: „Nem X. Hanem Y.”, önmagának feltett kérdés („Az eredmény? …”), kíváncsiságkeltő fél mondat, mindenhol hármas felsorolás,
  csattanós zárómondat, üres jelzők (egyedülálló, prémium élmény, varázslatos, páratlan), „Akár X vagy, akár Y…”.
- Nincs gondolatjel helyett kötőjel-trükk, nincs felkiáltójel, nincs emoji felsorolásjelként. Egyféle írásmód a címekben és a gombokon.
- Ellenőrzés: elférne ez a bekezdés változtatás nélkül egy konkurens oldalán is? Ha igen, még nincs benne tény.

## 4. Mozgás

| Gyakoriság | Döntés |
|---|---|
| naponta százszor (menü, nyelvváltó) | nincs animáció |
| sokszor (hover, lista) | alig észrevehető, vagy semmi |
| alkalmanként (menü nyitása, ablak) | normál animáció |
| ritkán, először (intro, nagy pillanat) | itt van a „varázslat” helye |

- Tokenek a `kit.css`-ben: `--ease-out` (be- és kilépés), `--ease-in-out` (mozgás a képernyőn), `--ease-drawer`. `ease-in` felületen soha.
- Időtartam: gombnyomás 100–160 ms, lenyíló 150–250 ms, ablak 200–500 ms. A felület animációi 300 ms alatt maradnak.
- Csak `transform`, `opacity` és (felfedéshez) `clip-path` mozog. Belépés soha nem `scale(0)`-ról, hanem `scale(.95)` + átlátszóságból.
- Gyorsan ismételhető dolgon (váltó, gomb) CSS transition, nem keyframe. Hover-mozgás csak `@media (hover:hover) and (pointer:fine)` alatt.
- Végtelen animáció és képkockánkénti írás csak akkor fut, ha látszik (IntersectionObserver). Az opacity 0 nem állítja le.
- Képkockánkénti ciklusban nincs `getBoundingClientRect` és társai (előbb minden olvasás, aztán minden írás).
- Képkocka-keret: 8 ms (120 Hz), nem 16,7. Lerp képkocka-függetlenül: `1 - (1 - k)^(dt/16.67)` (lásd `30-kurzor.js`).
- Érzés ellenőrzése: 2–5× lassítva, valódi telefonon, és másnap friss szemmel.

## 5. Teljesítmény (a kapu ellenőrzi)

- Költségvetés: JS < 300 KB, CSS < 100 KB, betűk < 100 KB, az első képernyő képei < 500 KB, egy kép < 1 MB, egy ikon < 40 KB.
- Minden `img`/`video`/`iframe` kap `width`/`height`-et (vagy `aspect-ratio`-t). A nyitókép: `fetchpriority="high"`, nem lusta, `preload`.
- Betű: saját tárhelyen, woff2, subset, `font-display: swap`. A kritikus betű `preload`.
- Hosszú, képernyőn kívüli szakasz: `.lusta` osztály (`content-visibility: auto`).
- Külső kód (térkép, videó, Instagram) csak homlokzat mögött, kattintásra. Ez a GDPR miatt is kötelező.
