/* global React, SITE, fmtFt, fmtPct */

// ── Bónusz Életprogram Kalkulátor — Excel-ellenőrzött számítás ─────────────
// Fix paraméterek
var CALC_ASSET_FEE  = 0.0119;   // 1,19% vagyonarányos alapkezelési díj
var CALC_ADMIN_FT   = 990;      // 990 Ft/hó adminisztrációs díj (3. évtől)
var CALC_BONUS_PCT  = 0.79;     // éves díj × 79% → bónusz számla
var CALC_BONUS_STEP = 0.01;     // bónusz jóváírás: bonus_szamla × 1% × év
var CALC_MAX_SZJA   = 130000;   // max SZJA visszatérítés/év (Ft)
var RATE_STEPS      = [0.05, 0.10, 0.15];  // csúszka pozíciók: 5% / 10% / 15%

// Számítási lépések (éves kompounding):
//   bonus_szamla = havi * 12 * 0,79
//   eves_bef[1]  = havi*12 − bonus_szamla
//   eves_bef[2]  = havi*6 + (havi−990)*6  (admin díj csak 2. félévtől)
//   eves_bef[3+] = (havi − 990) × 12
//   r29[n]       = (egyenleg[n-1] + eves_bef[n]) × (1 + rate)
//   bonusz_evi[n]= bonus_szamla × 0,01 × n
//   egyenleg[n]  = r29[n] × (1 − 0,0119) + bonusz_evi[n]
//
// SZJA alszámla (csak Nyugdíj mód, 2,81% éves nettó hozam):
//   szja_ev  = min(havi * 12 * 0,20 ; 130 000)
//   1. évben nincs jóváírás: credit[1] = 0
//   2. évtől: credit[y] = szja_ev
//   szjaAcc[y] = (szjaAcc[y-1] + credit[y]) × 1,0281
var CALC_SZJA_RATE = 0.0281;   // 2,81% éves nettó hozam az SZJA alszámlán

function calcBonus(monthly, activeYears, withSzja, rate) {
  var bonus_szamla = monthly * 12 * CALC_BONUS_PCT;
  var szja_ev      = withSzja ? Math.min(monthly * 12 * 0.20, CALC_MAX_SZJA) : 0;
  var balance      = 0;
  var szjaAcc      = 0;   // SZJA alszámla felhalmozott értéke (kamatozó)
  var cumBonus     = 0;
  var yearlyData   = [];

  for (var y = 1; y <= activeYears; y++) {
    // Éves befektetett összeg (3 sávos logika)
    var ann;
    if      (y === 1) { ann = monthly * 12 - bonus_szamla; }
    else if (y === 2) { ann = monthly * 12 - CALC_ADMIN_FT * 6; }
    else              { ann = (monthly - CALC_ADMIN_FT) * 12; }

    var r29       = (balance + ann) * (1 + rate);
    var asset_fee = r29 * CALC_ASSET_FEE;
    var bon_ev    = bonus_szamla * CALC_BONUS_STEP * y;
    cumBonus     += bon_ev;
    balance       = r29 * (1 - CALC_ASSET_FEE) + bon_ev;

    // SZJA alszámla: 1. évben credit=0, 2. évtől credit=szja_ev; kamatozik 2,81%/év
    var szja_credit = (withSzja && y > 1) ? szja_ev : 0;
    if (withSzja) {
      szjaAcc = (szjaAcc + szja_credit) * (1 + CALC_SZJA_RATE);
    }

    yearlyData.push({
      year:        y,
      ann:         Math.round(ann),
      r29:         Math.round(r29),
      bon_ev:      Math.round(bon_ev),
      bon_cum:     Math.round(cumBonus),
      asset_fee:   Math.round(asset_fee),
      balance:     Math.round(balance),
      szja_cum:    Math.round(szjaAcc),
      szja_ev_yr:  Math.round(szja_credit),
      hozam_cum:   Math.round(balance) - monthly * 12 * y,
    });
  }

  return {
    balance:   Math.round(balance),
    grossPaid: monthly * 12 * activeYears,
    bonusCum:  Math.round(cumBonus),
    szja:      Math.round(szjaAcc),
    total:     Math.round(balance) + Math.round(szjaAcc),
    hozam:     Math.round(balance) - (monthly * 12 * activeYears),
    yearlyData: yearlyData,
  };
}


function RefreshIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  );
}

function InfoTooltip({ text }) {
  var [open, setOpen] = React.useState(false);
  var wrapRef = React.useRef(null);

  React.useEffect(function() {
    if (!open) return;
    function handle(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    document.addEventListener('touchstart', handle);
    return function() {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('touchstart', handle);
    };
  }, [open]);

  return (
    <span className="info-tip" ref={wrapRef}>
      <button
        type="button"
        className="info-tip-btn"
        onClick={function(e) { e.stopPropagation(); setOpen(function(v) { return !v; }); }}
        aria-label="Információ"
      >i</button>
      {open && (
        <span className="info-tip-box" role="tooltip">{text}</span>
      )}
    </span>
  );
}

function PreCalc() {
  var [monthly, setMonthly] = React.useState("");
  var [age,     setAge]     = React.useState("");
  var [errors,  setErrors]  = React.useState({});
  var [toast,   setToast]   = React.useState(false);

  function validate() {
    var errs = {};
    var m = parseInt(monthly, 10);
    var a = parseInt(age, 10);
    if (!monthly || isNaN(m) || m < 10000 || m > 200000)
      errs.monthly = "10 000 – 200 000 Ft közötti összeget adj meg";
    if (!age || isNaN(a) || a < 18 || a > 64)
      errs.age = "18 – 64 év közötti kort adj meg";
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    var errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    window.dispatchEvent(new CustomEvent("precalc:apply", {
      detail: { monthly: parseInt(monthly, 10), age: parseInt(age, 10) }
    }));

    var target = document.getElementById("kalkulator");
    if (target) target.scrollIntoView({ behavior: "smooth" });

    setToast(true);
    setTimeout(function() { setToast(false); }, 3200);
  }

  return (
    <section className="precalc-section reveal">
      <div className="container">
        <div className="precalc-inner">
          <div className="precalc-text">
            <div className="section-eyebrow">GYORS KALKULÁCIÓ</div>
            <h2 className="precalc-title">Mennyi lenne a megtakarításod?</h2>
          </div>
          <form className="precalc-form" onSubmit={handleSubmit} noValidate>
            <div className={"precalc-field" + (errors.monthly ? " has-error" : "")}>
              <label className="precalc-label" htmlFor="pc-monthly">Havi összeg (Ft)</label>
              <input
                id="pc-monthly"
                className="precalc-input"
                type="number"
                min="10000"
                max="200000"
                step="1000"
                placeholder="pl. 50 000"
                value={monthly}
                onChange={function(e) { setMonthly(e.target.value); }}
              />
              {errors.monthly && <span className="precalc-error">{errors.monthly}</span>}
            </div>
            <div className={"precalc-field" + (errors.age ? " has-error" : "")}>
              <label className="precalc-label" htmlFor="pc-age">Jelenlegi életkor</label>
              <input
                id="pc-age"
                className="precalc-input"
                type="number"
                min="18"
                max="64"
                step="1"
                placeholder="pl. 50"
                value={age}
                onChange={function(e) { setAge(e.target.value); }}
              />
              {errors.age && <span className="precalc-error">{errors.age}</span>}
            </div>
            <button type="submit" className="btn btn-primary precalc-btn">
              Megmutatom <span className="btn-arrow"/>
            </button>
          </form>
          {toast && (
            <div className="precalc-toast">✓ Az adataid alapján számolunk</div>
          )}
        </div>
      </div>
    </section>
  );
}
window.PreCalc = PreCalc;

function smoothScrollTo(targetY, duration) {
  var startY = window.pageYOffset;
  var distance = targetY - startY;
  var startTime = null;
  function easing(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    var elapsed = timestamp - startTime;
    var progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, startY + distance * easing(progress));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

var MONTHLY_PRESETS = [20000, 25000, 30000, 50000, 100000, 200000];

/* ── Szám-blokk helper komponensek ── */
function SzamFt({ v }) {
  return (
    <span className="szam-blokk">
      <span className="szam-ertek">{fmtFt(v)}</span>
      <span className="szam-egyseg">Ft</span>
    </span>
  );
}
function SzamEur({ v }) {
  return (
    <span className="szam-blokk">
      <span className="szam-egyseg elol">≈</span>
      <span className="szam-ertek">{fmtFt(v)}</span>
      <span className="szam-egyseg">EUR</span>
    </span>
  );
}

function Calculator() {
  var [tab,       setTab]      = React.useState("likvid");
  var [monthly,   setMonthly]  = React.useState(50000);
  var [years,     setYears]    = React.useState(10);
  var [age,       setAge]      = React.useState(50);
  var [ageStr,    setAgeStr]   = React.useState("50");
  var [rateIdx,   setRateIdx]  = React.useState(2);
  var [eurRate,   setEurRate]  = React.useState(400);
  var [eurStr,    setEurStr]   = React.useState("400");
  var [fxLoading, setFxLoad]   = React.useState(true);
  var [fxError,   setFxErr]    = React.useState(false);
  var [fxUpdated, setFxUpd]    = React.useState(null);
  var [showTable, setShowTbl]  = React.useState(false);
  var detailRef = React.useRef(null);

  var nyugdijYears = Math.max(1, 65 - age);
  var activeYears  = tab === "likvid" ? years : nyugdijYears;
  var withSzja     = tab === "nyugdij";

  async function fetchFx() {
    setFxLoad(true);
    setFxErr(false);
    var rate = null;
    try {
      var r1 = await fetch("https://open.er-api.com/v6/latest/EUR", { signal: AbortSignal.timeout(5000) });
      if (!r1.ok) throw new Error();
      var d1 = await r1.json();
      if (d1 && d1.rates && d1.rates.HUF) rate = Math.round(d1.rates.HUF);
    } catch(e) {}
    if (!rate) {
      try {
        var r2 = await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json", { signal: AbortSignal.timeout(5000) });
        if (!r2.ok) throw new Error();
        var d2 = await r2.json();
        if (d2 && d2.eur && d2.eur.huf) rate = Math.round(d2.eur.huf);
      } catch(e) {}
    }
    if (rate) {
      setEurRate(rate);
      setEurStr(String(rate));
      var now = new Date();
      setFxUpd(String(now.getHours()).padStart(2,"0") + ":" + String(now.getMinutes()).padStart(2,"0"));
    } else {
      setFxErr(true);
      setTimeout(function() { setFxErr(false); }, 3000);
    }
    setFxLoad(false);
  }
  React.useEffect(function() { fetchFx(); }, []);

  // Tab-váltáskor az újonnan mountolt .reveal elem nem kap .in-t automatikusan,
  // mert a reveal motor csak scroll/resize-ra figyel.
  // requestAnimationFrame garantálja, hogy React már a DOM-ba írta az új elemet.
  React.useEffect(function() {
    requestAnimationFrame(function() {
      if (typeof window.__revealCheck === 'function') window.__revealCheck();
    });
  }, [tab]);

  // PreCalc-tól érkező adatok fogadása
  React.useEffect(function() {
    function onPreCalc(e) {
      if (e.detail.monthly) setMonthly(e.detail.monthly);
      if (e.detail.age)     { setAge(e.detail.age); setAgeStr(String(e.detail.age)); }
    }
    window.addEventListener("precalc:apply", onPreCalc);
    return function() { window.removeEventListener("precalc:apply", onPreCalc); };
  }, []);

  var calcRate = RATE_STEPS[rateIdx];
  var result  = React.useMemo(function() {
    return calcBonus(monthly, activeYears, withSzja, RATE_STEPS[rateIdx]);
  }, [monthly, activeYears, withSzja, rateIdx]);

  var totalEur = Math.round(result.total / Math.max(1, eurRate));

  return (
    <section className="section calculator" id="kalkulator">
      <div className="container">
        <div className="calc-grid">

          {/* ── Bal panel ── */}
          <div className="calc-left">
            <div className="section-eyebrow reveal">Kalkulátor</div>
            <h2 className="reveal">Bónusz Életprogram<br/>Kalkulátor</h2>
            <p className="lead reveal">
              Számold ki, mennyit érhet megtakarításod a futamidő végén,
              adókedvezménnyel és hűségbónusszal együtt.
            </p>

            {/* Fülek */}
            <div className="calc-tabs-sor reveal">
              <div className="calc-tabs">
                <button
                  className={"calc-tab-btn" + (tab === "likvid" ? " active" : "")}
                  onClick={function() { setTab("likvid"); }}>Likvid</button>
                <button
                  className={"calc-tab-btn" + (tab === "nyugdij" ? " active" : "")}
                  onClick={function() { setTab("nyugdij"); }}>Nyugdíj</button>
              </div>
              {/* ── Mobil: scroll gomb ── */}
              <button
                className="calc-mobil-scroll-btn"
                onClick={function() {
                  var el = document.querySelector('.calc-result');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}>
                Eredmény megtekintése <span className="calc-mobil-scroll-nyil">↓</span>
              </button>
            </div>

            {/* Havi befizetés — kártyagombok + egyéni összeg */}
            <div className="calc-control reveal">
              <span className="calc-control-label">Havi befizetés</span>
              <div className="calc-card-btns">
                {MONTHLY_PRESETS.map(function(v) {
                  return (
                    <button key={v}
                      className={"calc-card-btn" + (monthly === v ? " active" : "")}
                      onClick={function() { setMonthly(v); }}>
                      {fmtFt(v)}
                    </button>
                  );
                })}
              </div>
              <div className="calc-input-row">
                <input type="number" className="calc-number-input"
                  min={10000} max={200000} step={1000} value={monthly}
                  onChange={function(e) {
                    var v = Number(e.target.value);
                    if (!isNaN(v) && v > 0) setMonthly(v);
                  }}/>
                <span className="calc-number-unit">Ft / hó</span>
              </div>
            </div>

            {/* Futamidő — Likvid: 10, 15, 20 év */}
            {tab === "likvid" && (
              <div className="calc-control reveal">
                <span className="calc-control-label">Futamidő</span>
                <div className="calc-card-btns">
                  <button className={"calc-card-btn" + (years === 10 ? " active" : "")}
                    onClick={function() { setYears(10); }}>10 év</button>
                  <button className={"calc-card-btn" + (years === 15 ? " active" : "")}
                    onClick={function() { setYears(15); }}>15 év</button>
                  <button className={"calc-card-btn" + (years === 20 ? " active" : "")}
                    onClick={function() { setYears(20); }}>20 év</button>
                </div>
              </div>
            )}

            {/* Kor — Nyugdíj */}
            {tab === "nyugdij" && (
              <div className="calc-control reveal">
                <span className="calc-control-label">Jelenlegi kora</span>
                <div className="calc-input-row">
                  <input type="number" className="calc-number-input"
                    min={18} max={64} step={1} value={ageStr}
                    onKeyDown={function(e) {
                      var nav = ["Backspace","Delete","Tab","ArrowLeft","ArrowRight","ArrowUp","ArrowDown"];
                      if (nav.indexOf(e.key) !== -1) return;
                      if (e.key < "0" || e.key > "9") { e.preventDefault(); return; }
                      var cur = e.target.value;
                      if (cur.length >= 2) { e.preventDefault(); return; }
                      if (cur.length === 1) {
                        var candidate = Number(cur + e.key);
                        if (candidate < 18 || candidate > 64) { e.preventDefault(); return; }
                      }
                    }}
                    onChange={function(e) {
                      var raw = e.target.value;
                      if (raw === "") { setAgeStr(""); return; }
                      var v = Number(raw);
                      if (isNaN(v)) return;
                      setAgeStr(raw);
                      setAge(v);
                    }}
                    onBlur={function(e) {
                      var v = Number(e.target.value);
                      var clamped = isNaN(v) || v < 18 ? 18 : v > 64 ? 64 : v;
                      setAge(clamped);
                      setAgeStr(String(clamped));
                    }}/>
                  <span className="calc-number-unit">év</span>
                </div>
                <span className="calc-age-range-hint">18–64 év között adható meg</span>
                <div className="calc-age-note">
                  Futamidő: <strong>{nyugdijYears} év</strong>
                  <span className="calc-age-note-sub">(65 éves korig)</span>
                </div>
              </div>
            )}

            {/* Éves elvárt hozam — kártyagombok */}
            <div className="calc-control reveal">
              <span className="calc-control-label">Éves elvárt hozam</span>
              <div className="calc-card-btns">
                {RATE_STEPS.map(function(r, i) {
                  return (
                    <button key={r}
                      className={"calc-card-btn" + (rateIdx === i ? " active" : "")}
                      onClick={function() { setRateIdx(i); }}>
                      {Math.round(r * 100)}%
                    </button>
                  );
                })}
              </div>
            </div>

            {/* EUR/HUF árfolyam */}
            <div className="calc-fx-block reveal">
              <div className="calc-eur-main-row">
                <span className="calc-eur-label">🇪🇺 EUR / HUF árfolyam</span>
                <div className="calc-eur-controls">
                  <div className="calc-eur-input-wrap">
                    <input type="number" className="calc-eur-input"
                      value={eurStr} min={300} max={700} step={1}
                      onChange={function(e) {
                        setEurStr(e.target.value);
                        var v = Number(e.target.value);
                        if (v > 0) setEurRate(v);
                      }}
                      aria-label="EUR/HUF árfolyam"/>
                    <span className="calc-eur-unit">Ft / EUR</span>
                  </div>
                  <button
                    className={"calc-eur-live-btn" + (fxLoading ? " loading" : "") + (fxError ? " error" : "")}
                    onClick={fetchFx} disabled={fxLoading}>
                    <RefreshIcon/> {fxError ? "Nem sikerült" : "Élő árfolyam"}
                  </button>
                </div>
              </div>
              {fxUpdated && (
                <div className="calc-fx-footer">
                  <span className="calc-fx-updated">Frissítve: {fxUpdated}</span>
                </div>
              )}
            </div>

          </div>

          {/* ── Jobb panel — eredmény ── */}
          <div className="calc-result reveal">
            <div className="calc-result-eyebrow">VÁRHATÓ ÉRTÉK {activeYears} ÉV MÚLVA</div>
            <div className="calc-headline">
              <SzamFt v={result.total} />
            </div>
            <div className="calc-eur-equiv"><SzamEur v={totalEur} /></div>

            <p className="calc-sub">
              {Math.round(calcRate * 100)}% éves bruttó hozammal, havi {fmtFt(monthly)} Ft
              befizetés mellett, {activeYears} éven át.
            </p>

            <div className="calc-breakdown">
              <div className="item item-toke">
                <div className="lbl">Összes tőke <InfoTooltip text="Az általad befizetett pénz teljes összege a megtakarítási időszak alatt." /></div>
                <div className="val"><SzamFt v={result.grossPaid} /></div>
                {eurRate > 0 && <div className="val-eur"><SzamEur v={Math.round(result.grossPaid / eurRate)} /></div>}
              </div>
              <div className="item gain">
                <div className="lbl">Hozam <InfoTooltip text="A megtakarítás ideje alatt a kamatos kamat elv alapján összegyűlt pénzösszeg." /></div>
                <div className="val">+<SzamFt v={result.hozam} /></div>
                {eurRate > 0 && <div className="val-eur"><SzamEur v={Math.round(result.hozam / eurRate)} /></div>}
              </div>
              {withSzja && (
                <div className="item gain">
                  <div className="lbl">SZJA visszatérítés</div>
                  <div className="val">+<SzamFt v={result.szja} /></div>
                  {eurRate > 0 && <div className="val-eur"><SzamEur v={Math.round(result.szja / eurRate)} /></div>}
                </div>
              )}
              <div className="item total-item">
                <div className="lbl">Végösszeg <InfoTooltip text="A megtakarítási időszak lejárata után kifizethető pénzösszeg." /></div>
                <div className="val"><SzamFt v={result.total} /></div>
                {eurRate > 0 && <div className="val-eur"><SzamEur v={Math.round(result.total / eurRate)} /></div>}
              </div>
            </div>

            <button
              className={"calc-detail-toggle" + (showTable ? " open" : "")}
              onClick={function() {
                var isNowOpen = !showTable;
                setShowTbl(isNowOpen);
                if (isNowOpen && detailRef.current) {
                  setTimeout(function() {
                    var targetY = detailRef.current.getBoundingClientRect().top + window.pageYOffset - 80;
                    smoothScrollTo(targetY, 1200);
                  }, 80);
                }
              }}>
              <span className="calc-detail-toggle-label">
                Éves részletes kimutatás {showTable ? "elrejtése" : "megtekintése"}
              </span>
              <span className="calc-detail-arrow">▼</span>
            </button>

            <div className="calc-disclaimer">
              <div className="calc-disclaimer-header">
                <span className="calc-disclaimer-title">Tájékoztató számítás</span>
                <InfoTooltip text="Vázlatszerű tájékoztatás — *adminisztrációs költség a 13. hónaptól" />
              </div>
              <div className="calc-disclaimer-pills">
                <span className="calc-disclaimer-pill">{Math.round(calcRate * 100)}% éves bruttó hozam</span>
                <span className="calc-disclaimer-pill">1,19% éves alapkezelési díj</span>
                <span className="calc-disclaimer-pill">990 Ft / hó admin (3. évtől)</span>
              </div>
              <p className="calc-disclaimer-note">
                A tényleges hozam a piaci körülményektől eltérhet.<br/>
                A hűségbónusz és SZJA visszatérítés a szerződéskötéskor érvényes jogszabályok szerint érvényesíthető.
              </p>
            </div>
          </div>

          {/* ── Teljes szélességű éves tábla ── */}
          <div className={"calc-detail-wrap" + (showTable ? " is-open" : "")} ref={detailRef}>
            <button className="calc-back-link" onClick={function() {
              var el = document.getElementById("kalkulator");
              if (el) smoothScrollTo(el.getBoundingClientRect().top + window.pageYOffset - 80, 1200);
            }}>↑ Vissza a kalkulátorhoz</button>
            <div className="calc-summary-cards">
              <div className="calc-summary-card toke-card">
                <div className="calc-summary-label">ÖSSZES TŐKE</div>
                <div className="calc-summary-value"><SzamFt v={result.grossPaid} /></div>
                {eurRate > 0 && <div className="calc-summary-eur"><SzamEur v={Math.round(result.grossPaid / eurRate)} /></div>}
              </div>
              <div className="calc-summary-card hozam-card">
                <div className="calc-summary-label">HOZAM</div>
                <div className="calc-summary-value bonus"><SzamFt v={result.hozam} /></div>
                {eurRate > 0 && <div className="calc-summary-eur"><SzamEur v={Math.round(result.hozam / eurRate)} /></div>}
              </div>
              {withSzja && (
                <div className="calc-summary-card">
                  <div className="calc-summary-label">SZJA VISSZATÉRÍTÉS</div>
                  <div className="calc-summary-value bonus"><SzamFt v={result.szja} /></div>
                  {eurRate > 0 && <div className="calc-summary-eur"><SzamEur v={Math.round(result.szja / eurRate)} /></div>}
                </div>
              )}
              <div className="calc-summary-card vegso-card">
                <div className="calc-summary-label">VÉGSŐ EGYENLEG</div>
                <div className="calc-summary-value"><SzamFt v={result.total} /></div>
                {eurRate > 0 && <div className="calc-summary-eur"><SzamEur v={Math.round(result.total / eurRate)} /></div>}
              </div>
            </div>
            <div className="calc-detail-full">
              <div className={"ev-lista" + (withSzja ? " szja-mod" : "")}>
                {result.yearlyData.map(function(row) {
                  return (
                    <div key={row.year} className={"ev-kartya" + (row.year % 5 === 0 ? " milestone" : "")}>
                      <div className="ev-szam">
                        <span className="ev-cimke">ÉV</span>
                        <span className="ev-ertek">{row.year}.</span>
                      </div>
                      <div className="ev-adat toke-szin">
                        <span className="adat-cimke">TŐKE</span>
                        <span className="adat-ft"><SzamFt v={monthly * 12} /></span>
                        {eurRate > 0 && <span className="adat-eur"><SzamEur v={Math.round(monthly * 12 / eurRate)} /></span>}
                      </div>
                      <div className="ev-adat hozam-szin">
                        <span className="adat-cimke">HOZAM</span>
                        <span className="adat-ft"><SzamFt v={row.hozam_cum} /></span>
                        {eurRate > 0 && <span className="adat-eur"><SzamEur v={Math.round(row.hozam_cum / eurRate)} /></span>}
                      </div>
                      {withSzja && (
                        <div className="ev-adat bonusz">
                          <span className="adat-cimke">SZJA</span>
                          <span className="adat-ft"><SzamFt v={row.szja_cum} /></span>
                        </div>
                      )}
                      <div className="ev-adat egyenleg">
                        <span className="adat-cimke">EGYENLEG</span>
                        <span className="adat-ft"><SzamFt v={row.balance + row.szja_cum} /></span>
                        {eurRate > 0 && <span className="adat-eur"><SzamEur v={Math.round((row.balance + row.szja_cum) / eurRate)} /></span>}
                      </div>
                    </div>
                  );
                })}
                <div className="ev-kartya osszesen">
                  <div className="ev-szam">
                    <span className="ev-ertek">ÖSSZ.</span>
                  </div>
                  <div className="ev-adat toke-szin">
                    <span className="adat-cimke">TŐKE</span>
                    <span className="adat-ft"><SzamFt v={result.grossPaid} /></span>
                  </div>
                  <div className="ev-adat hozam-szin">
                    <span className="adat-cimke">HOZAM</span>
                    <span className="adat-ft"><SzamFt v={result.hozam} /></span>
                  </div>
                  {withSzja && (
                    <div className="ev-adat bonusz">
                      <span className="adat-cimke">SZJA</span>
                      <span className="adat-ft"><SzamFt v={result.szja} /></span>
                    </div>
                  )}
                  <div className="ev-adat egyenleg">
                    <span className="adat-cimke">EGYENLEG</span>
                    <span className="adat-ft"><SzamFt v={result.total} /></span>
                    {eurRate > 0 && <span className="adat-eur"><SzamEur v={Math.round(result.total / eurRate)} /></span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
window.Calculator = Calculator;

function Timeline() {
  var t = SITE.timeline;
  var sectionRef  = React.useRef(null);
  var wrapperRef  = React.useRef(null);
  var progressRef = React.useRef(null);
  var glowRef     = React.useRef(null);
  var titleRef    = React.useRef(null);

  React.useEffect(function() {
    var section  = sectionRef.current;
    var wrapper  = wrapperRef.current;
    var progress = progressRef.current;
    var glow     = glowRef.current;
    if (!section) return;

    function onScroll() {
      var rect = section.getBoundingClientRect();
      section.style.setProperty("--parallax-y", (-rect.top * 0.3) + "px");

      if (wrapper && progress && glow) {
        // Unified progress: timeline section TOP → bemutatkozás section BOTTOM
        var teamSec = document.getElementById("tortenetunk");
        var tlTop   = section.getBoundingClientRect().top + window.pageYOffset;
        var teamBot = teamSec
          ? teamSec.getBoundingClientRect().bottom + window.pageYOffset
          : section.getBoundingClientRect().bottom + window.pageYOffset;
        var totalH  = Math.max(1, teamBot - tlTop);
        var tlH     = section.offsetHeight;
        var tlFrac  = Math.min(0.998, tlH / totalH);  // időarány a timeline-ra

        var scrolled = window.pageYOffset + window.innerHeight * 0.6 - tlTop;
        var unified  = Math.max(0, Math.min(1, scrolled / totalH));

        // Timeline sávja: 0 → 100% amíg unified ≤ tlFrac
        var tlProg = Math.min(1, unified / tlFrac);
        progress.style.height = (tlProg * 100) + "%";
        glow.style.top = Math.max(0, tlProg * 100 - 2) + "%";

        // Bemutatkozás folytatódó vonal: töltődik miután a timeline sáv tele
        var teamEl = document.querySelector(".br2-vonal-progress");
        if (teamEl) {
          var teamProg = unified <= tlFrac
            ? 0
            : Math.min(1, (unified - tlFrac) / (1 - tlFrac));
          teamEl.style.height = (teamProg * 100) + "%";
        }
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) entry.target.classList.add("lathato");
      });
    }, { threshold: 0.2 });

    if (wrapper) {
      wrapper.querySelectorAll(".lepes-sor").forEach(function(el) { observer.observe(el); });
    }
    if (titleRef.current) observer.observe(titleRef.current);

    return function() {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <section className="section timeline hogyan-szekció" id="folyamat" ref={sectionRef}>
      <div className="container">
        <div className="section-eyebrow reveal">{t.eyebrow}</div>
        <div className="tl-header">
          <h2 className="szekció-cím" ref={titleRef}>{t.title}</h2>
          <p className="lead tl-lead">{t.lead}</p>
        </div>
        <div className="timeline-wrapper" ref={wrapperRef}>
          <div className="timeline-center-vonal">
            <div className="timeline-center-progress" ref={progressRef}/>
            <div className="timeline-glow" ref={glowRef}/>
          </div>
          {t.steps.map(function(s, i) {
            var isBal = i % 2 === 0;
            var delay = (i * 0.15) + "s";
            var kozep = (
              <div className="lepes-kozep">
                <div className="lepes-pont">
                  <div className={"lepes-vizszintes " + (isBal ? "bal" : "jobb")}/>
                </div>
              </div>
            );
            var tartalom = (
              <div className="lepes-tartalom" data-n={s.n} style={{ transitionDelay: delay }}>
                <div className="lepes-szam-wrapper">
                  <div className="lepes-szam">{parseInt(s.n, 10)}</div>
                  <h3 className="lepes-cim">{s.title}</h3>
                </div>
                <p className="lepes-szoveg">{s.text}</p>
              </div>
            );
            return (
              <div key={s.n} className={"lepes-sor " + (isBal ? "bal" : "jobb")}>
                {isBal ? tartalom : <div className="lepes-ures"/>}
                {kozep}
                {isBal ? <div className="lepes-ures"/> : tartalom}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
window.Timeline = Timeline;

function useCountUp(target, duration) {
  const [display, setDisplay] = React.useState("0");
  const [started, setStarted] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(function() {
    var el = ref.current;
    if (!el) return;
    var io = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting) { setStarted(true); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(el);
    return function() { io.disconnect(); };
  }, []);

  React.useEffect(function() {
    if (!started) return;
    // Extract numeric part and affixes
    var match = String(target).match(/^([A-Za-z\s]*)([0-9]+(?:[.,][0-9]+)?)([^0-9]*)$/);
    if (!match) { setDisplay(target); return; }
    var prefix = match[1], numStr = match[2], suffix = match[3];
    var end = parseFloat(numStr.replace(",", "."));
    var startFrom = numStr === "2021" ? 2000 : 0;
    var steps = 60;
    var step = 0;
    var id = setInterval(function() {
      step++;
      var progress = step / steps;
      var ease = 1 - Math.pow(1 - progress, 3);
      var cur = Math.round(startFrom + (end - startFrom) * ease);
      if (step >= steps) { setDisplay(target); clearInterval(id); }
      else setDisplay(prefix + cur + suffix);
    }, duration / steps);
    return function() { clearInterval(id); };
  }, [started, target, duration]);

  return [display, ref];
}

function Team() {
  var chartRef    = React.useRef(null);
  var sectionRef  = React.useRef(null);
  var imgColRef   = React.useRef(null);
  var canvasRef   = React.useRef(null);
  var chartPctRef = React.useRef(null);
  var chartDone   = React.useRef(false);   // Chart.js csak egyszer init-elődik

  React.useEffect(function() {
    var section = sectionRef.current;
    if (!section) return;

    var isMobile = window.matchMedia('(max-width: 768px)').matches;
    var imgCol   = imgColRef.current;
    var photo    = imgCol ? imgCol.querySelector('.br2-photo') : null;
    var cleanups = [];

    // ── 1. Spotlight: egérkövető radial gradient ──────────────────────────
    function onMouseMove(e) {
      if (isMobile) return;
      var rect = section.getBoundingClientRect();
      section.style.setProperty('--spotlight-x', (e.clientX - rect.left) + 'px');
      section.style.setProperty('--spotlight-y', (e.clientY - rect.top)  + 'px');
    }
    section.addEventListener('mousemove', onMouseMove);
    cleanups.push(function() { section.removeEventListener('mousemove', onMouseMove); });

    // ── 2. Kép: scroll parallax ───────────────────────────────────────────
    function onScroll() {
      if (isMobile || !photo) return;
      var rect = section.getBoundingClientRect();
      // rect.top: positive = section below fold, negative = scrolled past
      var pct  = Math.max(-1, Math.min(1, rect.top / window.innerHeight));
      var shift = pct * -35; // -35px … +35px
      photo.style.transform = 'translateY(' + shift + 'px)';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    cleanups.push(function() { window.removeEventListener('scroll', onScroll); });
    onScroll();

    // ── 3. Headline szó-szó reveal ────────────────────────────────────────
    var headline = section.querySelector('.br2-headline');
    if (headline) {
      var parts = headline.innerHTML.split(/(<br\s*\/?>)/i);
      headline.innerHTML = parts.map(function(part) {
        if (/<br/i.test(part)) return part;
        return part.split(/\s+/).filter(Boolean).map(function(w) {
          return '<span class="szo-wrapper"><span class="szo">' + w + '</span></span>';
        }).join(' ');
      }).join('');

      var headIO = new IntersectionObserver(function(entries) {
        if (!entries[0].isIntersecting) return;
        headline.querySelectorAll('.szo').forEach(function(szo, i) {
          setTimeout(function() { szo.classList.add('lathato'); }, i * 90);
        });
        headIO.disconnect();
      }, { threshold: 0.2 });
      headIO.observe(headline);
      cleanups.push(function() { headIO.disconnect(); });
    }

    // ── 4. Stat counter + arany aláhúzás reveal ───────────────────────────
    var statRows = section.querySelectorAll('.stat-sor');
    var statIO   = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var row    = entry.target;
        var szam   = row.querySelector('.stat-szam');
        row.classList.add('lathato');
        statIO.unobserve(row);
        if (!szam) return;
        // Ha szam-ertek span van benne, csak azt animáljuk (egység érintetlen marad)
        var ertek = szam.querySelector('.szam-ertek');
        var animTarget = ertek || szam;
        var orig = animTarget.textContent.trim();
        if (/[A-Za-z]/.test(orig)) return;   // "Top 10" — nem animálunk
        var num  = parseFloat(orig.replace(/\s/g, '').replace(',', '.'));
        if (isNaN(num)) return;
        var isYear = num > 1900 && num < 2100;
        var from   = isYear ? 2000 : 0;
        var dur    = 1200;
        var t0     = null;
        function ease(t) { return 1 - Math.pow(1 - t, 3); }
        function tick(ts) {
          if (!t0) t0 = ts;
          var p = Math.min(1, (ts - t0) / dur);
          animTarget.textContent = Math.round(from + (num - from) * ease(p));
          if (p < 1) requestAnimationFrame(tick);
          else animTarget.textContent = orig;
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    statRows.forEach(function(r) { statIO.observe(r); });
    cleanups.push(function() { statIO.disconnect(); });

    // ── 5. Canvas: lebegő arany részecskék ───────────────────────────────
    var pCanvas = canvasRef.current;
    var animId  = null;
    if (pCanvas && !isMobile) {
      var pCtx = pCanvas.getContext('2d');
      function resizeCanvas() {
        pCanvas.width  = section.offsetWidth;
        pCanvas.height = section.offsetHeight;
      }
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      cleanups.push(function() { window.removeEventListener('resize', resizeCanvas); });

      var pts = [];
      for (var pi = 0; pi < 35; pi++) {
        pts.push({
          x:     Math.random() * pCanvas.width,
          y:     Math.random() * pCanvas.height,
          r:     Math.random() * 2.0 + 0.5,
          vx:    (Math.random() - 0.5) * 0.32,
          vy:    (Math.random() - 0.5) * 0.32,
          alpha: Math.random() * 0.42 + 0.08,
          phase: Math.random() * Math.PI * 2,
        });
      }
      function drawParticles() {
        pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
        pts.forEach(function(p) {
          p.x += p.vx; p.y += p.vy; p.phase += 0.013;
          if (p.x < 0) p.x = pCanvas.width;
          if (p.x > pCanvas.width)  p.x = 0;
          if (p.y < 0) p.y = pCanvas.height;
          if (p.y > pCanvas.height) p.y = 0;
          var a = p.alpha * (0.6 + 0.4 * Math.sin(p.phase));
          pCtx.beginPath();
          pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          pCtx.fillStyle = 'rgba(201,168,76,' + a.toFixed(3) + ')';
          pCtx.fill();
        });
        animId = requestAnimationFrame(drawParticles);
      }
      animId = requestAnimationFrame(drawParticles);
      cleanups.push(function() { if (animId) cancelAnimationFrame(animId); });
    }

    // ── 7. Mutató-szám számlálók (252M, 929) + glow ───────────────────────
    // Csak a .szam-ertek span-t animáljuk — a .szam-egyseg (Ft/db) végig látható
    var mutatoElems = section.querySelectorAll('.mutato-szam');
    var mutatoIO    = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var container = entry.target;
        var ertek     = container.querySelector('.szam-ertek');
        if (!ertek) { mutatoIO.unobserve(container); return; }
        var orig   = ertek.textContent.trim();
        var digits = orig.replace(/[^\d]/g, '');
        var target = parseInt(digits, 10);
        if (isNaN(target)) { mutatoIO.unobserve(container); return; }
        var dur = 1800;
        var t0  = null;
        function ease(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }
        function fmt(n) {
          return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        }
        function tick(ts) {
          if (!t0) t0 = ts;
          var p   = Math.min(1, (ts - t0) / dur);
          var cur = Math.round(target * ease(p));
          ertek.textContent = fmt(cur);
          if (p < 1) requestAnimationFrame(tick);
          else {
            ertek.textContent = orig;
            container.classList.add('szam-kesz');
          }
        }
        requestAnimationFrame(tick);
        mutatoIO.unobserve(container);
      });
    }, { threshold: 0.4 });
    mutatoElems.forEach(function(el) { mutatoIO.observe(el); });
    cleanups.push(function() { mutatoIO.disconnect(); });

    // ── 8. Chart.js — lazy init, animált, center counter ─────────────────
    var chartCanvas = chartRef.current;
    var chart       = null;
    var chartPctEl  = chartPctRef.current;

    if (chartCanvas && typeof window.Chart !== 'undefined') {
      var chartIO = new IntersectionObserver(function(entries) {
        if (!entries[0].isIntersecting || chartDone.current) return;
        chartDone.current = true;
        chart = new window.Chart(chartCanvas, {
          type: 'doughnut',
          data: {
            labels: ['Élet', 'Nem gépjármű', 'Gépjármű'],
            datasets: [{
              data: [92.18, 5.27, 2.55],
              backgroundColor: ['#c9a84c', 'rgba(201,168,76,0.38)', 'rgba(201,168,76,0.16)'],
              borderColor:     ['rgba(201,168,76,0.7)', 'rgba(201,168,76,0.35)', 'rgba(201,168,76,0.2)'],
              borderWidth: 1.5,
              hoverOffset: 6,
            }],
          },
          options: {
            cutout: '68%',
            responsive: true,
            maintainAspectRatio: true,
            animation: {
              duration: 1400,
              easing: 'easeInOutQuart',
              animateRotate: true,
              animateScale: true,
              onProgress: function(anim) {
                if (!chartPctEl || !anim.numSteps) return;
                var p = anim.currentStep / anim.numSteps;
                chartPctEl.textContent = (p * 92.18).toFixed(2) + '%';
              },
              onComplete: function() {
                if (chartPctEl) chartPctEl.textContent = '92.18%';
              },
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: { label: function(ctx) { return ' ' + ctx.label + ': ' + ctx.parsed + '%'; } },
                backgroundColor: 'rgba(17,17,17,0.92)',
                borderColor: 'rgba(201,168,76,0.25)',
                borderWidth: 1,
                titleColor: 'rgba(255,255,255,0.55)',
                bodyColor: '#c9a84c',
                padding: 10,
              },
            },
          },
        });
        chartIO.disconnect();
      }, { threshold: 0.3 });
      chartIO.observe(chartCanvas);
      cleanups.push(function() { chartIO.disconnect(); if (chart) chart.destroy(); });
    }

    return function() { cleanups.forEach(function(fn) { fn(); }); };
  }, []);

  return (
    <section className="br2-section bemutatkozas" id="tortenetunk" ref={sectionRef}>

      {/* ── Részecske-canvas ── */}
      <canvas id="bemutatkozas-canvas" ref={canvasRef} />

      {/* ── Teljes-szélességű 45 / 55 rács ── */}
      <div className="br2-grid">

        {/* BAL: fotó — full bleed + overlays */}
        <div className="br2-img-col" ref={imgColRef}>
          <img src="assets/balogh_richard.jpg" alt="Balogh Richárd" className="br2-photo" />
          <div className="br2-kep-felso-fade" />
          <div className="br2-kep-jobb-fade" />
          <div className="br2-kep-also-fade" />
        </div>

        {/* JOBB: tartalom */}
        <div className="br2-content-col">
          <div className="br2-eyebrow">BEMUTATKOZÁS</div>
          <h2 className="br2-headline">
            Pénzügyi tanácsadás,<br/>ahogy lennie kellene.
          </h2>
          <div className="br2-divider" />
          <div className="br2-bio">
            <p>Balogh Richárd vagyok, biztosításközvetítő, aki hisz abban, hogy a megfelelő döntések ma meghatározzák a holnapot.</p>
            <p>Személyre szabott megoldásokat kínálok életbiztosítás, nyugdíjtervezés és vagyonvédelem területén. Nyitott kommunikáció, hosszú távú bizalom, valódi eredmények.</p>
            <p>2021-ben igazgatósági szinten elnyertem Az Év Tanácsadója díjat, 1 400 tanácsadó közül a top 10-ben végeztem országosan. Ezt a kivételes elismerést 2025-ben is sikerült megszereznem: az Allianz közel 130 éves hazai történetében elsőként nyert valaki kétszer egymást követően ilyen rangos díjat.</p>
          </div>

          {/* Stat sorok — EREDMÉNYEK felirattal */}
          <div className="br2-eredmenyek-label">EREDMÉNYEK</div>
          <div className="br2-stats">
            <div className="stat-sor">
              <span className="stat-szam">Top 10</span>
              <span className="stat-elvalaszto" />
              <span className="stat-leiras">1 400 főből országosan</span>
            </div>
            <div className="stat-sor">
              <span className="stat-szam">2021</span>
              <span className="stat-elvalaszto" />
              <span className="stat-leiras">Az Év Tanácsadója</span>
            </div>
            <div className="stat-sor">
              <span className="stat-szam">2025</span>
              <span className="stat-elvalaszto" />
              <span className="stat-leiras">Az Év Tanácsadója, <em>elsőként kétszer</em></span>
            </div>
            <div className="stat-sor">
              <span className="stat-szam">
                <span className="szam-blokk">
                  <span className="szam-ertek">929</span>
                  <span className="szam-egyseg">db</span>
                </span>
              </span>
              <span className="stat-elvalaszto" />
              <span className="stat-leiras">Élő szerződés</span>
              <span className="stat-valtozas">+5% ↑</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Adatblokk + kördiagram + Hitelesített — container-ben ── */}
      <div className="container">

        {/* Mutatók + diagram egy sorban */}
        <div className="br2-adatok-sor reveal">
          <div className="mutato-elem">
            <div className="mutato-cimke">GONDOZOTT ÁLLOMÁNY</div>
            <div className="mutato-szam">
              <span className="szam-blokk">
                <span className="szam-ertek">252 336 286</span>
                <span className="szam-egyseg">Ft</span>
              </span>
            </div>
            <div className="mutato-valtozas">+7% előző évhez</div>
          </div>
          <div className="mutato-elem">
            <div className="mutato-cimke">ÉLŐ SZERZŐDÉSEK</div>
            <div className="mutato-szam">
              <span className="szam-blokk">
                <span className="szam-ertek">929</span>
                <span className="szam-egyseg">db</span>
              </span>
            </div>
            <div className="mutato-valtozas">+5% előző időszak</div>
          </div>
          <div className="diagram-wrapper reveal" style={{ transitionDelay: "150ms" }}>
            <div className="br2-chart-wrap">
              <canvas ref={chartRef} />
              <div className="br2-chart-center">
                <span className="br2-chart-center-label">ÁLLOMÁNY</span>
                <span className="br2-chart-center-pct" ref={chartPctRef}>0%</span>
                <span className="br2-chart-center-cat">Élet</span>
              </div>
            </div>
            <div className="br2-legend">
              <div className="jelm-sor jelm-kiemelt">
                <span className="br2-legend-dot" style={{ background: '#c9a84c' }} />
                <span className="jelm-szoveg">Élet</span>
                <span className="jelm-szazalek">92.18%</span>
              </div>
              <div className="jelm-sor">
                <span className="br2-legend-dot" style={{ background: 'rgba(201,168,76,0.45)' }} />
                <span className="jelm-szoveg">Nem gépjármű</span>
                <span className="jelm-szazalek">5.27%</span>
              </div>
              <div className="jelm-sor">
                <span className="br2-legend-dot" style={{ background: 'rgba(201,168,76,0.2)' }} />
                <span className="jelm-szoveg">Gépjármű</span>
                <span className="jelm-szazalek">2.55%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Hitelesített tanácsadó blokk ── */}
        <div className="br-hitelesitett reveal">
          <div className="br-hit-header">
            <div className="br-hit-ikon">✓</div>
            <div className="br-hit-cim">Hitelesített tanácsadó vagyok</div>
          </div>
          <p className="br-hit-alcim">
            Regisztrációm és jogosultságom az alábbi hivatalos nyilvántartásokban ellenőrizhető:
          </p>
          <div className="br-hit-gombok">
            <a href="https://regiszter.mnb.hu/Person" className="br-hit-gomb br-mnb-gomb" target="_blank" rel="noopener noreferrer">
              <span className="br-gomb-ikon">🏛</span>
              <span className="br-gomb-szoveg">
                <span className="br-gomb-cim">MNB Ügynökazonosító · <span style={{fontWeight:400, opacity:0.75}}>120071700176</span></span>
                <span className="br-gomb-alcim">Keresés: „Balogh Richárd Imre", Magyar Nemzeti Bank nyilvántartás →</span>
              </span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
window.Team = Team;
