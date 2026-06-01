/* global React */
// Balogh Richárd — site content (Hungarian copy)

const SITE = {
  brand: {
    name: "Balogh Richárd",
    role: "PÉNZÜGYI TANÁCSADÓ",
    location: "Országos lefedettség, személyesen: Debrecen és Budapest",
    monogram: "BR",
  },
  nav: [
    { href: "#foooldal",       label: "Főoldal" },
    { href: "#szolgaltatasok", label: "Szolgáltatások" },
    { href: "#kalkulator",     label: "Kalkulátor" },
    { href: "#tortenetunk",    label: "Történetem" },
    { href: "#kapcsolat",      label: "Kapcsolat" },
  ],
  hero: {
    eyebrow: "BÓNUSZ ÉLETPROGRAM",
    h1html: "Tervezd meg a következő <em>10 évedet</em>.",
    sub: "Segítek megépíteni azt a vagyont, amire egész életedben szükséged lesz, kamatadó-mentesen, hűségbónusszal, teljes átláthatósággal.",
    primary: "Számold ki",
    secondary: "Beszéljünk",
    // Coverr CDN — golden-hour ambient cityscape; muted/looping
    videoSrc: "assets/hero.mp4",
    fallback: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1800&q=80",
  },
  services: {
    eyebrow: "SZOLGÁLTATÁSOK",
    title: "Amit más termék nem ad meg.",
    lead: "Öt ok, amiért ez a program hosszú távon valóban különbséget jelent, és amiről érdemes személyesen is beszélni.",
    items: [
      {
        n: "01",
        title: "Magasabb hozam",
        desc: "A bankbetét hosszú távon nem dolgozik neked. Eszközalapjaink akár évi 7–15%-os hozamot is hozhatnak, én segítek kiválasztani azt, ami a te kockázatvállalásodhoz illik.",
        img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80",
      },
      {
        n: "02",
        title: "Kamatadó-mentes megtakarítás",
        desc: "10 év után a teljes hozam a tiéd marad, sem kamatadó, sem szochó. Nem kiskapu: törvényi juttatás, amiről a legtöbb ember sajnos nem tud.",
        img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80",
      },
      {
        n: "03",
        title: "Rugalmas feltételek",
        desc: "Az élet nem mindig megy terv szerint. Ha szükség van rá, szüneteltethetsz, átrendezhetsz, vagy részösszeget vehetsz ki. A program alkalmazkodik hozzád, nem fordítva.",
        img: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1200&q=80",
      },
      {
        n: "04",
        title: "Hűségbónusz",
        desc: "Aki kitart, kap érte valamit. A futamidő végén a felhalmozott tőkén felül egy külön bónuszt írunk jóvá, ezt más megtakarítási formánál egyszerűen nem találod meg.",
        img: "https://images.unsplash.com/photo-1607863680198-23d4b2565df0?w=1200&q=80",
      },
      {
        n: "05",
        title: "Átlátható költségszerkezet",
        desc: "Minden forint számít. Az alacsony díjszerkezet azt jelenti, hogy a hozam nagyobb részét te látod, nem az adminisztráció viszi el. Mindent előre megmutatunk, semmi rejtett tétel.",
        img: "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=1200&q=80",
      },
    ],
  },
  calculator: {
    eyebrow: "MEGTAKARÍTÁSI KALKULÁTOR",
    title: "Mutassa meg, mennyit szeretne félretenni.",
    lead: "Húzza a csúszkát a tervezett havi összegre. Az alábbi becslés a Bónusz Életprogram átlagos, hosszú távú hozamával számol — 7,2% évi átlaggal, 10 éves futamidőre.",
    annualReturn: 0.072, // 7.2%
    years: 10,
    minMonthly: 10000,
    maxMonthly: 200000,
    stepMonthly: 5000,
    defaultMonthly: 50000,
    bonusRatePct: 5, // 5% loyalty bonus on contributions
    disclaimer:
      "Az itt szereplő adatok tájékoztató jellegűek és nem minősülnek ajánlattételnek. A tényleges hozam a választott eszközalaptól és a piaci viszonyoktól függően eltérhet. Részletes feltételekért keressen meg személyesen.",
  },
  timeline: {
    eyebrow: "A FOLYAMAT",
    title: "Hogyan dolgozunk együtt",
    lead: "Az első találkozótól a havi kontrollig, egy átlátható, négy lépcsős folyamat, amiben mindig te diktálod a tempót.",
    steps: [
      {
        n: "01",
        title: "Helyzetfelmérés",
        text: "Egy díjmentes, kötetlen beszélgetés keretében átnézzük a jelenlegi pénzügyi helyzetedet, a céljaidat és a kockázatviselő képességedet. Bizonyos kérdésekre talán te is most válaszolsz először.",
      },
      {
        n: "02",
        title: "Személyre szabott igényfelmérés",
        text: "Az igényeid alapján kidolgozok egy javaslatot, összegekkel, eszközalapokkal, lejáratokkal. Azt mutatja meg, mit tesz a pénzed a te munkád helyett, ha hagyod.",
      },
      {
        n: "03",
        title: "Szerződéskötés",
        text: "Csak akkor írunk alá, ha minden részlettel tisztában vagy. Egy megbízható biztosítói háttérrel, több mint 130 év tapasztalatával.",
      },
      {
        n: "04",
        title: "Évenkénti felülvizsgálat",
        text: "A program nem statikus. Évente leülünk, értékeljük az eredményeket, és ha kell, finomhangoljuk a stratégiát az életed változásaihoz.",
      },
    ],
  },
  team: {
    eyebrow: "TÖRTÉNETEM",
    title: "Aki mellett biztos kezekben van",
    lead: "[Ide jön egy rövid bemutatkozó szöveg — pár mondatban arról, hogy ki vagyok és miért érdemes velem dolgozni.]",
    members: [
      {
        role: "PÉNZÜGYI TANÁCSADÓ",
        name: "Balogh Richárd",
        bio: "[hiányzó szöveg bemutatkozáshoz]",
        img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1200&q=80",
        creds: [
          { num: "10+", lbl: "Aktív ügyfél" },
          { num: "4", lbl: "Év tapasztalat" },
          { num: "7,2%", lbl: "Átlagos hozam" },
        ],
        side: "left",
      },
    ],
  },
  contact: {
    eyebrow: "KAPCSOLAT",
    title: "Beszéljünk a terveidről.",
    lead: "Az első konzultáció díjmentes és kötelezettségmentes. Hívj, írj, vagy hagyj üzenetet, 24 órán belül válaszolok személyesen.",
    items: [
      { icon: "phone",   lbl: "TELEFON", val: "06 30 266 4050" },
      { icon: "mail",    lbl: "E-MAIL",  val: "imre.balogh.richard@allianztanacsado.hu" },
      { icon: "map-pin", lbl: "IRODA",   val: "Országos lefedettség, személyesen: Debrecen és Budapest" },
    ],
  },
  footer: {
    tagline:
      "Független pénzügyi tanácsadás. A Bónusz Életprogram unit-linked életbiztosítási termék.",
    columns: [
      {
        head: "OLDALAK",
        links: [
          { label: "Főoldal",       href: "#foooldal" },
          { label: "Szolgáltatások", href: "#szolgaltatasok" },
          { label: "Kalkulátor",    href: "#kalkulator" },
          { label: "Történetem",   href: "#tortenetunk" },
          { label: "Kapcsolat",     href: "#kapcsolat" },
        ],
      },
      {
        head: "KÖVESSE",
        links: [
          { label: "LinkedIn", href: "#" },
          { label: "Facebook", href: "#" },
          { label: "YouTube",  href: "#" },
        ],
      },
    ],
    base: "© 2026 Balogh Richárd Pénzügyi Tanácsadó. Minden jog fenntartva.",
  },
  quiz: {
    eyebrow: "SZEMÉLYRE SZABOTT JAVASLAT",
    title: "Néhány kérdés a tervéről.",
    lead: "Két perc alatt válaszolsz, én pedig 24 órán belül összeállítok egy személyes javaslatot a megtakarítási céljaidhoz.",
    questions: [
      {
        id: "goal",
        q: "Mi a megtakarítás elsődleges célja?",
        help: "Több válasz közül egyet választhat — ez segít a megfelelő portfólió beállításában.",
        kind: "options",
        options: [
          { v: "retirement", label: "Nyugdíj-kiegészítés", help: "Hosszú táv, biztonságos hozam" },
          { v: "kids",       label: "Gyermek jövője",       help: "Tanulás, otthonteremtés" },
          { v: "house",      label: "Lakásvásárlás",        help: "5–15 éven belül" },
          { v: "freedom",    label: "Pénzügyi függetlenség", help: "Tartalék és szabadság" },
        ],
      },
      {
        id: "horizon",
        q: "Mennyi időre tervez?",
        help: "A program minimum 10 éves, de hosszabb futamidő tipikusan jobb eredményt hoz.",
        kind: "options",
        options: [
          { v: "10",  label: "10 év",      help: "Minimum futamidő" },
          { v: "15",  label: "15 év",      help: "Ajánlott egyensúly" },
          { v: "20",  label: "20+ év",     help: "Maximális hozampotenciál" },
          { v: "?",   label: "Még nem tudom", help: "Beszéljük át" },
        ],
      },
      {
        id: "monthly",
        q: "Havonta mennyit tudna félretenni?",
        help: "Tájékoztató összeg — a végleges keretet közösen alakítjuk ki.",
        kind: "options",
        options: [
          { v: "10-25",  label: "10 – 25 ezer Ft",  help: "Kezdő keret" },
          { v: "25-50",  label: "25 – 50 ezer Ft",  help: "Tipikus" },
          { v: "50-100", label: "50 – 100 ezer Ft", help: "Aktív vagyonépítés" },
          { v: "100+",   label: "100 ezer Ft felett", help: "Vagyonkezelés" },
        ],
      },
      {
        id: "experience",
        q: "Volt már megtakarítási vagy befektetési terméke?",
        help: "Akármi, ami nem készpénz vagy bankbetét.",
        kind: "options",
        options: [
          { v: "none",     label: "Nem, ez lenne az első", help: "Nyugodtan kezdjük az alapoknál" },
          { v: "passive",  label: "Volt, de kifutott",     help: "Új koncepciót keresek" },
          { v: "active",   label: "Igen, jelenleg is van", help: "Bővíteném vagy átrendezném" },
          { v: "investor", label: "Aktívan befektetek",    help: "Portfóliót diverzifikálnék" },
        ],
      },
      {
        id: "contact",
        kind: "contact",
        q: "Hová küldjem a személyes javaslatot?",
        help: "Az adataidat kizárólag a javaslatod összeállítására használom, harmadik félnek soha nem adom át.",
      },
    ],
  },
};

window.SITE = SITE;
