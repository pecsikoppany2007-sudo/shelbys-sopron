# Jogi oldal (site/jogi.html) generátor: impresszum + adatkezelési tájékoztató + sütik, HU|DE|EN.
# A Katlan Borozó jogi szövegéből általánosítva (2026-10-30), az oldal.json "funkciok" kapcsolói szerint.
# Üres üzemeltetői adat = narancs [kitöltendő] jelölés; az elesites.py ilyenkor nem engedi élesíteni.
# Tények: Netlify, Inc., 101 2nd Street, San Francisco, CA 94105, privacy@netlify.com, EU-US DPF (netlify.com/privacy, 2026-04-10).
#         NAIH 1055 Budapest, Falk Miksa utca 9–11., 1363 Budapest Pf. 9., +36 1 391 1400, ugyfelszolgalat@naih.hu.
# Ez minta szöveg, nem jogi tanácsadás: nagyobb ügyfélnél (webshop, űrlap, analitika) nézesse át jogász.
import html as H
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / 'oldal.json').read_text())
F = CFG.get('funkciok', {})
O = CFG.get('uzemelteto', {})
LANGS = CFG.get('nyelvek', ['hu'])
ALL = ('hu', 'de', 'en')

TODO = {
    'nev': ('cégnév vagy egyéni vállalkozó neve', 'Firmenname', 'company name'),
    'szekhely': ('székhely', 'Sitz', 'registered office'),
    'nyilv': ('cégjegyzékszám / nyilvántartási szám', 'Registernummer', 'registration number'),
    'adoszam': ('adószám', 'Steuernummer', 'tax number'),
    'email': ('e-mail cím', 'E-Mail-Adresse', 'e-mail address'),
}


def S3(s):
    p = s.split('|')
    return (p[0], p[1] if len(p) > 1 else p[0], p[2] if len(p) > 2 else p[0])


def J(*parts):
    out = ['', '', '']
    for p in parts:
        for i in range(3):
            out[i] += p if isinstance(p, str) else p[i]
    return tuple(out)


def own(k):
    v = (O.get(k) or '').strip()
    if v:
        e = H.escape(v)
        return (f'<a href="mailto:{e}">{e}</a>',) * 3 if k == 'email' else (e,) * 3
    return tuple('<mark class="todo">[kitöltendő: ' + TODO[k][i] + ']</mark>' for i in range(3))


def missing():
    return [k for k in TODO if not (O.get(k) or '').strip()]


nev = H.escape(CFG['nev'])
cim = H.escape(CFG['cim'])
tel = CFG.get('telefon', '')
tel_a = f'<a href="tel:{tel.replace(" ", "")}">{H.escape(tel)}</a>' if tel else ''
store_key = (CFG.get('rovid') or 'oldal') + '-lang'
egyeni = O.get('tipus', 'egyeni') == 'egyeni'

NETLIFY = 'Netlify, Inc., 101 2nd Street, San Francisco, CA 94105, USA · <a href="mailto:privacy@netlify.com">privacy@netlify.com</a> · <a href="https://www.netlify.com" rel="noopener">netlify.com</a>'
NAIH = 'Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH), 1055 Budapest, Falk Miksa utca 9–11.; postacím: 1363 Budapest, Pf. 9.; telefon: +36 1 391 1400; e-mail: <a href="mailto:ugyfelszolgalat@naih.hu">ugyfelszolgalat@naih.hu</a>; <a href="https://www.naih.hu" rel="noopener">naih.hu</a>'
NAIH3 = (NAIH, NAIH.replace('postacím', 'Postanschrift').replace('telefon', 'Telefon').replace('e-mail:', 'E-Mail:'),
         NAIH.replace('Nemzeti Adatvédelmi és Információszabadság Hatóság', 'Hungarian National Authority for Data Protection and Freedom of Information').replace('postacím', 'postal address').replace('telefon', 'phone'))

# ---------------------------------------------------------------- impresszum
imp = [
    ('p', J(S3('A weboldal üzemeltetője és a(z) |Betreiber der Website und von |The website and '), (nev,) * 3, S3(' fenntartója:|:| are run by:'))),
    ('dl', [
        (S3('Üzemeltető (egyéni vállalkozó)|Betreiber (Einzelunternehmer)|Operator (sole trader)') if egyeni else S3('Üzemeltető cég|Betreiberfirma|Operating company'), own('nev')),
        (S3('Székhely|Sitz|Registered office'), own('szekhely')),
        (S3('Nyilvántartási szám|Registernummer|Registration no.') if egyeni else S3('Cégjegyzékszám|Firmenbuchnummer|Company registration no.'), own('nyilv')),
        (S3('Adószám|Steuernummer|Tax number'), own('adoszam')),
        (S3('Az üzlet címe|Adresse|Address'), (f'{nev}, {cim}',) * 3),
    ] + ([(S3('Telefon|Telefon|Phone'), (tel_a,) * 3)] if tel else []) + [
        (S3('E-mail|E-Mail|E-mail'), own('email')),
        (S3('Tárhelyszolgáltató|Hosting-Anbieter|Hosting provider'), (NETLIFY,) * 3),
    ]),
]
fot = CFG.get('fotok') or {}
if fot:
    imp.append(('p', tuple(H.escape(fot.get(l, fot.get('hu', ''))) for l in ALL)))

# ---------------------------------------------------------------- adatkezelés
short = [S3('A weboldalon nincs regisztráció és hírlevél.|Die Website hat keine Registrierung und keinen Newsletter.|The website has no sign-up and no newsletter.')]
if not F.get('urlap'):
    short.append(S3(' Űrlap sincs.| Es gibt auch kein Formular.| There is no form either.'))
if not F.get('analitika'):
    short.append(S3(' Nem mérjük a látogatottságot, és nem használunk hirdetési vagy követőkódot.| Wir messen keine Besucherzahlen und verwenden keine Werbe- oder Tracking-Codes.| We do not measure visits and use no advertising or tracking code.'))
short.append(S3(' Személyes adatot a tárhelyszolgáltató technikai naplói rögzítenek, ezen kívül csak azt kezeljük, amit Ön megad nekünk.| Personenbezogene Daten erfassen die technischen Protokolle des Hosting-Anbieters; darüber hinaus verarbeiten wir nur, was Sie uns mitteilen.| Personal data is recorded in the hosting provider’s technical logs; beyond that we only process what you give us.'))

priv = [
    ('p', S3('Ebben a tájékoztatóban leírjuk, milyen személyes adatot kezelünk a weboldallal kapcsolatban, miért és meddig, és milyen jogai vannak. Az adatkezelő a fent megnevezett üzemeltető, a fenti elérhetőségeken. Az adatkezelésre az Európai Unió általános adatvédelmi rendelete (GDPR, 2016/679/EU rendelet) és az információs önrendelkezési jogról és az információszabadságról szóló 2011. évi CXII. törvény vonatkozik.'
             '|In dieser Erklärung beschreiben wir, welche personenbezogenen Daten wir im Zusammenhang mit der Website verarbeiten, warum und wie lange, und welche Rechte Sie haben. Verantwortlich ist der oben genannte Betreiber, erreichbar unter den oben genannten Kontaktdaten. Es gelten die Datenschutz-Grundverordnung der EU (DSGVO, Verordnung (EU) 2016/679) und das ungarische Gesetz CXII von 2011 über informationelle Selbstbestimmung und Informationsfreiheit.'
             '|This notice explains what personal data we process in connection with the website, why and for how long, and what rights you have. The controller is the operator named above, reachable at the contact details above. The processing is governed by the EU General Data Protection Regulation (GDPR, Regulation (EU) 2016/679) and Hungarian Act CXII of 2011 on informational self-determination and freedom of information.')),
    ('h3', S3('Röviden|Kurz gesagt|In short')),
    ('p', J(*short)),
]
n = [0]


def sec(title):
    n[0] += 1
    priv.append(('h3', J(f'{n[0]}. ', S3(title))))


sec('A weboldal megnyitása|Aufruf der Website|Visiting the website')
priv.append(('ul', [
    S3('<b>Adatok:</b> IP-cím, a látogatás időpontja, a megnyitott oldal, a böngésző és az eszköz típusa, a hivatkozó oldal.|<b>Daten:</b> IP-Adresse, Zeitpunkt des Besuchs, aufgerufene Seite, Browser- und Gerätetyp, verweisende Seite.|<b>Data:</b> IP address, time of the visit, the page opened, browser and device type, referring page.'),
    S3('<b>Cél:</b> a weboldal kiszolgálása, a biztonság védelme és a hibák elhárítása.|<b>Zweck:</b> Bereitstellung der Website, Sicherheit und Fehlerbehebung.|<b>Purpose:</b> delivering the website, keeping it secure and fixing errors.'),
    S3('<b>Jogalap:</b> jogos érdek (GDPR 6. cikk (1) bekezdés f) pont). Ezek nélkül az oldal nem tudna megjelenni, és az adatokat nem használjuk az Ön azonosítására.|<b>Rechtsgrundlage:</b> berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO). Ohne diese Daten könnte die Seite nicht angezeigt werden; wir nutzen sie nicht, um Sie zu identifizieren.|<b>Legal basis:</b> legitimate interest (Article 6(1)(f) GDPR). The page could not be shown without this data, and we do not use it to identify you.'),
    S3('<b>Meddig:</b> a naplókat a tárhelyszolgáltató a szolgáltatás nyújtásához szükséges ideig őrzi, utána törli.|<b>Speicherdauer:</b> der Hosting-Anbieter bewahrt die Protokolle so lange auf, wie es für den Betrieb nötig ist, und löscht sie danach.|<b>How long:</b> the hosting provider keeps the logs for as long as needed to run the service, then deletes them.'),
    S3('<b>Adatfeldolgozó:</b> Netlify, Inc. (USA), a weboldal tárhelyszolgáltatója. Az adatok az Egyesült Államokba kerülhetnek; ennek alapja az EU–USA adatvédelmi keretrendszer (Data Privacy Framework), amelyhez a Netlify csatlakozott.|<b>Auftragsverarbeiter:</b> Netlify, Inc. (USA), der Hosting-Anbieter der Website. Die Daten können in die USA übermittelt werden; Grundlage ist das EU-US-Datenschutzrahmenabkommen (Data Privacy Framework), dem Netlify beigetreten ist.|<b>Processor:</b> Netlify, Inc. (USA), the website’s hosting provider. The data may be transferred to the United States under the EU–U.S. Data Privacy Framework, in which Netlify participates.'),
]))
if F.get('telefonos_foglalas'):
    keep = CFG.get('foglalas_megorzes') or {}
    sec('Asztalfoglalás telefonon|Telefonische Tischreservierung|Booking a table by phone')
    priv.append(('ul', [
        S3('<b>Adatok:</b> név, telefonszám, a foglalás napja, időpontja és a létszám, valamint amit Ön kér.|<b>Daten:</b> Name, Telefonnummer, Tag, Uhrzeit und Personenzahl der Reservierung sowie Ihre Wünsche.|<b>Data:</b> name, phone number, the day, time and party size of the booking, and anything you ask for.'),
        S3('<b>Cél:</b> a foglalás nyilvántartása, és ha szükséges, visszahívás a foglalással kapcsolatban.|<b>Zweck:</b> Erfassung der Reservierung und, falls nötig, ein Rückruf dazu.|<b>Purpose:</b> recording the booking and, if needed, calling you back about it.'),
        S3('<b>Jogalap:</b> a szerződés megkötését megelőzően, az Ön kérésére tett lépések (GDPR 6. cikk (1) bekezdés b) pont).|<b>Rechtsgrundlage:</b> Maßnahmen vor Vertragsschluss auf Ihre Anfrage (Art. 6 Abs. 1 lit. b DSGVO).|<b>Legal basis:</b> steps taken at your request before entering into a contract (Article 6(1)(b) GDPR).'),
        J(S3('<b>Meddig:</b> |<b>Speicherdauer:</b> |<b>How long:</b> '), tuple(keep.get(l, '') for l in ALL), '.'),
    ]))
if F.get('email_kapcsolat'):
    sec('Levél e-mailben|E-Mail an uns|Writing to us by e-mail')
    priv.append(('ul', [
        S3('<b>Adatok:</b> e-mail cím, név és a levél tartalma.|<b>Daten:</b> E-Mail-Adresse, Name und Inhalt der Nachricht.|<b>Data:</b> e-mail address, name and the content of your message.'),
        S3('<b>Cél és jogalap:</b> válasz az Ön kérdésére vagy kérésére (GDPR 6. cikk (1) bekezdés b) és f) pont).|<b>Zweck und Rechtsgrundlage:</b> Beantwortung Ihrer Frage oder Anfrage (Art. 6 Abs. 1 lit. b und f DSGVO).|<b>Purpose and legal basis:</b> answering your question or request (Article 6(1)(b) and (f) GDPR).'),
        S3('<b>Meddig:</b> az ügy elintézéséig; utána töröljük, kivéve, ha jogszabály hosszabb megőrzést ír elő (például számla esetén).|<b>Speicherdauer:</b> bis die Sache erledigt ist; danach löschen wir sie, außer ein Gesetz schreibt eine längere Aufbewahrung vor (zum Beispiel bei Rechnungen).|<b>How long:</b> until the matter is settled; then we delete it, unless the law requires us to keep it longer (for example for invoices).'),
    ]))
if F.get('urlap'):
    sec('Kapcsolatfelvételi űrlap|Kontaktformular|Contact form')
    priv.append(('ul', [
        S3('<b>Adatok:</b> az űrlapon megadott név, e-mail cím vagy telefonszám és az üzenet.|<b>Daten:</b> Name, E-Mail-Adresse oder Telefonnummer und Nachricht aus dem Formular.|<b>Data:</b> the name, e-mail address or phone number and message you enter in the form.'),
        S3('<b>Cél és jogalap:</b> válasz az Ön megkeresésére; az Ön hozzájárulása, amelyet az űrlap elküldésekor ad meg (GDPR 6. cikk (1) bekezdés a) pont), és amelyet bármikor visszavonhat.|<b>Zweck und Rechtsgrundlage:</b> Beantwortung Ihrer Anfrage; Ihre Einwilligung beim Absenden (Art. 6 Abs. 1 lit. a DSGVO), die Sie jederzeit widerrufen können.|<b>Purpose and legal basis:</b> answering your enquiry; your consent given when you send the form (Article 6(1)(a) GDPR), which you can withdraw at any time.'),
        S3('<b>Adatfeldolgozó:</b> Netlify, Inc. (Netlify Forms), a fenti feltételekkel.|<b>Auftragsverarbeiter:</b> Netlify, Inc. (Netlify Forms), wie oben.|<b>Processor:</b> Netlify, Inc. (Netlify Forms), as above.'),
        S3('<b>Meddig:</b> az ügy elintézéséig, legfeljebb egy évig.|<b>Speicherdauer:</b> bis die Sache erledigt ist, höchstens ein Jahr.|<b>How long:</b> until the matter is settled, at most one year.'),
    ]))
if len(LANGS) > 1:
    sec('Nyelvválasztás|Sprachauswahl|Language choice')
    priv.append(('p', S3(f'Ha nyelvet választ, a böngészője megjegyzi (helyi tárhely, „{store_key}”), hogy legközelebb is azon a nyelven nyíljon meg az oldal. Ez csak az Ön eszközén marad, hozzánk nem jut el. A böngésző beállításaiban az oldal adatainak törlésével bármikor eltávolíthatja.'
                         f'|Wenn Sie eine Sprache wählen, merkt sich Ihr Browser diese Wahl (lokaler Speicher, „{store_key}“), damit die Seite beim nächsten Mal in derselben Sprache öffnet. Die Angabe bleibt auf Ihrem Gerät und erreicht uns nicht. Sie können sie jederzeit löschen, indem Sie in den Browsereinstellungen die Daten dieser Website entfernen.'
                         f'|When you choose a language, your browser remembers it (local storage, “{store_key}”) so that the page opens in the same language next time. It stays on your device and never reaches us. You can remove it at any time by clearing this site’s data in your browser settings.')))
if F.get('google_tablazat_menu'):
    sec('Az étlap betöltése|Laden der Speisekarte|Loading the menu')
    priv.append(('p', S3('Az étlapot és az árakat egy Google-táblázatból töltjük be, hogy mindig frissek legyenek. Ehhez a böngészője kapcsolódik a Google (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Írország) szerveréhez, és ilyenkor a Google megkapja az Ön IP-címét. Sütit ez a betöltés nem helyez el. Jogalap: jogos érdek (GDPR 6. cikk (1) bekezdés f) pont).'
                         '|Speisekarte und Preise laden wir aus einer Google-Tabelle, damit sie immer aktuell sind. Dabei verbindet sich Ihr Browser mit einem Server von Google (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland), und Google erhält Ihre IP-Adresse. Dabei werden keine Cookies gesetzt. Rechtsgrundlage: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO).'
                         '|We load the menu and prices from a Google spreadsheet so that they are always up to date. For this your browser connects to a Google server (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland), and Google receives your IP address. No cookies are set by this. Legal basis: legitimate interest (Article 6(1)(f) GDPR).')))
if F.get('terkep_kattintasra'):
    sec('Térkép|Karte|Map')
    priv.append(('p', S3('A térkép (Google Térkép) csak akkor töltődik be, ha a „Térkép betöltése” gombra kattint. Ekkor a böngészője kapcsolódik a Google szerveréhez, a Google megkapja az IP-címét, és sütiket helyezhet el; erre a Google saját adatkezelési szabályai vonatkoznak. Jogalap: az Ön hozzájárulása, amelyet a gombra kattintással ad meg (GDPR 6. cikk (1) bekezdés a) pont).'
                         '|Die Karte (Google Maps) lädt erst, wenn Sie auf „Karte laden“ klicken. Dann verbindet sich Ihr Browser mit Google, Google erhält Ihre IP-Adresse und kann Cookies setzen; dafür gelten die Datenschutzregeln von Google. Rechtsgrundlage: Ihre Einwilligung durch den Klick (Art. 6 Abs. 1 lit. a DSGVO).'
                         '|The map (Google Maps) only loads when you click “Load the map”. Your browser then connects to Google, Google receives your IP address and may set cookies; Google’s own privacy rules apply. Legal basis: your consent given by clicking (Article 6(1)(a) GDPR).')))
if F.get('beagyazas_kattintasra'):
    sec('Videók és közösségi tartalmak|Videos und Social-Media-Inhalte|Videos and social media content')
    priv.append(('p', S3('A videók (YouTube) és a közösségi tartalmak (például Instagram) csak akkor töltődnek be, ha a lejátszás vagy a betöltés gombra kattint. Ekkor a böngészője kapcsolódik az adott szolgáltató szerveréhez, amely megkapja az IP-címét, és sütiket helyezhet el; erre a szolgáltató saját adatkezelési szabályai vonatkoznak. A YouTube-videókat a sütiket csökkentő (youtube-nocookie.com) módban ágyazzuk be. Jogalap: az Ön hozzájárulása, amelyet a kattintással ad meg (GDPR 6. cikk (1) bekezdés a) pont).'
                         '|Videos (YouTube) und Social-Media-Inhalte (zum Beispiel Instagram) laden erst, wenn Sie auf Abspielen oder Laden klicken. Dann verbindet sich Ihr Browser mit dem jeweiligen Anbieter, der Ihre IP-Adresse erhält und Cookies setzen kann; es gelten dessen Datenschutzregeln. YouTube-Videos binden wir im erweiterten Datenschutzmodus (youtube-nocookie.com) ein. Rechtsgrundlage: Ihre Einwilligung durch den Klick (Art. 6 Abs. 1 lit. a DSGVO).'
                         '|Videos (YouTube) and social media content (for example Instagram) only load when you click play or load. Your browser then connects to that provider, which receives your IP address and may set cookies; its own privacy rules apply. We embed YouTube videos in privacy-enhanced mode (youtube-nocookie.com). Legal basis: your consent given by clicking (Article 6(1)(a) GDPR).')))
if F.get('analitika'):
    sec('Látogatottságmérés|Besuchermessung|Visit measurement')
    priv.append(('p', ('<mark class="todo">[kitöltendő: melyik eszköz (pl. Plausible, Google Analytics), milyen adat, hozzájárulás-kérés módja]</mark>',) * 3))
links = CFG.get('kulso_linkek') or []
if links:
    ls = ', '.join(H.escape(x) for x in links)
    sec('Hivatkozások más oldalakra|Links zu anderen Seiten|Links to other sites')
    priv.append(('p', S3(f'Az oldalon hivatkozások vezetnek ide: {ls}. Ezek csak akkor nyílnak meg, ha rájuk kattint, és onnantól az adott szolgáltató saját adatkezelési szabályai érvényesek.'
                         f'|Links führen zu: {ls}. Sie öffnen sich nur, wenn Sie darauf klicken; ab dann gelten die Datenschutzregeln des jeweiligen Anbieters.'
                         f'|Links lead to: {ls}. They only open when you click them, and from then on that provider’s own privacy rules apply.')))
priv += [
    ('h3', S3('Az Ön jogai|Ihre Rechte|Your rights')),
    ('p', S3('Kérheti, hogy tájékoztassuk az Önről kezelt adatokról, és hogy másolatot adjunk róluk; hogy helyesbítsük, töröljük vagy korlátozzuk a kezelésüket; tiltakozhat a jogos érdeken alapuló adatkezelés ellen, és ahol alkalmazható, kérheti az adatok hordozhatóságát (GDPR 15–21. cikk). Kérését a fenti elérhetőségeken jelezheti; legkésőbb egy hónapon belül válaszolunk.'
             '|Sie können Auskunft über die zu Ihrer Person verarbeiteten Daten und eine Kopie davon verlangen, deren Berichtigung, Löschung oder die Einschränkung der Verarbeitung; Sie können der Verarbeitung aufgrund berechtigten Interesses widersprechen und, soweit anwendbar, Datenübertragbarkeit verlangen (Art. 15–21 DSGVO). Wenden Sie sich dazu an die oben genannten Kontaktdaten; wir antworten innerhalb eines Monats.'
             '|You can ask us what data we hold about you and for a copy of it; ask us to correct or delete it or to restrict its use; object to processing based on legitimate interest; and, where it applies, ask for data portability (Articles 15–21 GDPR). Contact us at the details above; we reply within one month.')),
    ('h3', S3('Panasz|Beschwerde|Complaints')),
    ('p', J(S3('Ha úgy érzi, megsértettük a jogait, panaszt tehet a felügyeleti hatóságnál: |Wenn Sie meinen, dass wir Ihre Rechte verletzt haben, können Sie sich bei der Aufsichtsbehörde beschweren: |If you think we have breached your rights, you can complain to the supervisory authority: '), NAIH3,
            S3('. Bírósághoz is fordulhat; a pert a lakóhelye vagy tartózkodási helye szerinti törvényszék előtt is megindíthatja.|. Sie können sich auch an ein Gericht wenden; die Klage kann auch beim Gericht Ihres Wohn- oder Aufenthaltsortes erhoben werden.|. You can also go to court; you may bring the case before the regional court of your place of residence or stay.'))),
    ('h3', S3('Adatbiztonság|Datensicherheit|Security')),
    ('p', S3('Az oldal titkosított kapcsolaton (HTTPS) érhető el. Az Ön által megadott adatokhoz csak azok férnek hozzá, akiknek a munkájukhoz szükséges.|Die Seite ist nur über eine verschlüsselte Verbindung (HTTPS) erreichbar. Auf Ihre Angaben greifen nur die Personen zu, die sie für ihre Arbeit brauchen.|The site is only served over an encrypted connection (HTTPS). Only people who need your details for their work can see them.')),
    ('p', J(S3('Hatályos: |Gültig ab: |Effective from: '), tuple(CFG.get('hatalyos', ['', '', ''])), '. ', S3('Ha a weboldal változik, ezt a tájékoztatót is frissítjük.|Wenn sich die Website ändert, aktualisieren wir diese Erklärung.|If the website changes, we update this notice.'))),
]

# ---------------------------------------------------------------- sütik
if F.get('analitika'):
    cook = [('p', ('<mark class="todo">[kitöltendő: analitika sütijei és a hozzájárulás-kérő ablak leírása]</mark>',) * 3)]
else:
    cook = [('p', S3('A weboldal magától nem használ sütiket (cookie), és nem tölt be külső követő- vagy hirdetési kódot, ezért nincs süti-ablak sem. A betűtípusokat és minden más fájlt a saját tárhelyünkről töltjük be.'
                     '|Die Website verwendet von sich aus keine Cookies und lädt keine fremden Tracking- oder Werbe-Codes, deshalb gibt es auch kein Cookie-Fenster. Schriften und alle anderen Dateien kommen von unserem eigenen Hosting.'
                     '|The website uses no cookies of its own and loads no third-party tracking or advertising code, so there is no cookie banner either. Fonts and all other files come from our own hosting.'))]
    if F.get('terkep_kattintasra'):
        cook.append(('p', S3('Kivétel a térkép: ha a „Térkép betöltése” gombra kattint, a Google sütiket helyezhet el (lásd fent).|Ausnahme ist die Karte: wenn Sie auf „Karte laden“ klicken, kann Google Cookies setzen (siehe oben).|The one exception is the map: if you click “Load the map”, Google may set cookies (see above).')))
    if len(LANGS) > 1:
        cook.append(('p', S3('A böngészőjében csak a választott nyelvet tároljuk (lásd fent). Ez az Ön által kifejezetten kért funkcióhoz szükséges, ezért nem kell hozzá hozzájárulás (az elektronikus hírközlésről szóló 2003. évi C. törvény 155. § (4) bekezdése).'
                             '|In Ihrem Browser speichern wir nur die gewählte Sprache (siehe oben). Sie ist für eine von Ihnen ausdrücklich gewünschte Funktion nötig und braucht daher keine Einwilligung (§ 155 Abs. 4 des ungarischen Gesetzes C von 2003 über die elektronische Kommunikation).'
                             '|We store only the language you chose in your browser (see above). It is needed for a function you explicitly asked for, so it needs no consent (section 155(4) of Hungarian Act C of 2003 on electronic communications).')))

LEGAL = [
    ('impresszum', S3('Impresszum|Impressum|Legal notice'), imp),
    ('adatkezeles', S3('Adatkezelési tájékoztató|Datenschutzerklärung|Privacy notice'), priv),
    ('sutik', S3('Sütik|Cookies|Cookies'), cook),
]
PAGE = {
    'title': S3(f'Jogi tudnivalók · {nev}|Rechtliches · {nev}|Legal · {nev}'),
    'h1': S3('Jogi tudnivalók|Rechtliches|Legal'),
    'lead': S3('Ki üzemelteti az oldalt, milyen adatot kezelünk, és mire használjuk.|Wer die Seite betreibt, welche Daten wir verarbeiten und wofür.|Who runs the site, what data we process and what for.'),
    'back': S3('Vissza a főoldalra|Zurück zur Startseite|Back to the home page'),
}


def block(b, i):
    k, v = b
    if k == 'p':
        return f'<p>{v[i]}</p>'
    if k == 'h3':
        return f'<h3>{v[i]}</h3>'
    if k == 'ul':
        return '<ul>' + ''.join(f'<li>{x[i]}</li>' for x in v) + '</ul>'
    if k == 'dl':
        return '<dl>' + ''.join(f'<dt>{a[i]}</dt><dd>{b2[i]}</dd>' for a, b2 in v) + '</dl>'
    raise ValueError(k)


def build(indexed=False):
    arts = []
    for i, l in enumerate(ALL):
        if l not in LANGS:
            continue
        secs = ''.join(f'<section id="{sid if i == 0 else sid + "-" + l}" class="jogi__sec"><h2>{t[i]}</h2>{"".join(block(b, i) for b in bl)}</section>' for sid, t, bl in LEGAL)
        arts.append(f'<article lang="{l}" data-jogi="{l}"{"" if i == 0 else " hidden"}><h1>{PAGE["h1"][i]}</h1><p class="jogi__lead">{PAGE["lead"][i]}</p>{secs}<p><a href="./">{PAGE["back"][i]}</a></p></article>')
    btns = ''.join(f'<button type="button" data-l="{l}" lang="{l}" aria-pressed="{str(l == LANGS[0]).lower()}">{l.upper()}</button>' for l in LANGS)
    robots = '' if indexed and not missing() else '<meta name="robots" content="noindex">\n'
    return f'''<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{PAGE["title"][0]}</title>
<meta name="description" content="{nev}: impresszum, adatkezelési tájékoztató, sütik.">
{robots}<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="css/kit.css">
<style>
.jogi{{max-width:760px;margin:0 auto;padding:48px 16px 96px}}
.jogi h1{{font:400 clamp(2rem,6vw,3.2rem)/1.1 var(--betu-cim);margin:.4em 0 .3em}}
.jogi h2{{font:400 1.6rem/1.2 var(--betu-cim);margin:2.2em 0 .6em}}
.jogi h3{{font-size:1.05rem;margin:1.6em 0 .4em}}
.jogi dl{{display:grid;grid-template-columns:minmax(0,13em) minmax(0,1fr);gap:.4em 1em}}
.jogi dt{{color:var(--halvany)}}.jogi dd{{margin:0}}
@media (max-width:560px){{.jogi dl{{grid-template-columns:1fr}}.jogi dd{{margin-bottom:.6em}}}}
.jogi a{{text-underline-offset:3px}}
.jogi__lead{{color:var(--halvany)}}
.jogi__nyelv{{display:flex;gap:4px;justify-content:flex-end}}
.jogi__nyelv button{{background:none;border:0;min-width:44px;min-height:44px;color:var(--halvany)}}
.jogi__nyelv button[aria-pressed="true"]{{color:var(--szoveg);text-decoration:underline;text-underline-offset:4px}}
mark.todo{{background:#ff9a3c;color:#1a1000;padding:0 .25em}}
</style>
</head>
<body>
<main class="jogi">
<div class="jogi__nyelv" role="group" aria-label="Nyelv / Sprache / Language">{btns}</div>
{"".join(arts)}
</main>
<script>
(function(){{var K='{store_key}',L={json.dumps(LANGS)},T={json.dumps(dict(zip(ALL, PAGE["title"])), ensure_ascii=False)};
function set(l,s){{if(L.indexOf(l)<0)l=L[0];document.documentElement.lang=l;document.title=T[l];
[].forEach.call(document.querySelectorAll('[data-jogi]'),function(a){{a.hidden=a.getAttribute('data-jogi')!==l}});
[].forEach.call(document.querySelectorAll('[data-l]'),function(b){{b.setAttribute('aria-pressed',String(b.getAttribute('data-l')===l))}});
if(s)try{{localStorage.setItem(K,l)}}catch(e){{}}}}
var l=null;try{{l=localStorage.getItem(K)}}catch(e){{}}
if(!l){{var n=(navigator.languages||[navigator.language||'hu']).map(function(x){{return String(x).slice(0,2)}});l=n.filter(function(x){{return L.indexOf(x)>-1}})[0]||(L.indexOf('en')>-1?'en':L[0])}}
set(l);document.addEventListener('click',function(e){{var b=e.target.closest('[data-l]');if(b)set(b.getAttribute('data-l'),true)}});
var h=location.hash.slice(1);if(h&&l!==L[0]){{var t=document.getElementById(h+'-'+l);if(t)t.scrollIntoView()}}}})();
</script>
</body>
</html>
'''


if __name__ == '__main__':
    out = ROOT / 'site' / 'jogi.html'
    out.write_text(build('--indexelt' in sys.argv))
    m = missing()
    print('jogi.html kész' + (' | kitöltendő: ' + ', '.join(m) if m else ' | minden üzemeltetői adat megvan'))
