/* global React, SITE, Icon */

function Nav() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
      if (window.scrollY > 80 && open) setOpen(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <nav className={"nav" + (scrolled ? " scrolled" : "") + (open ? " nav-open" : "")}>
      <div className="nav-inner">
        <a className="logo" href="#foooldal" onClick={close}>
          <span className="logo-nev-blokk">
            <span className="logo-fonev">{SITE.brand.name}</span>
            <span className="logo-szerepkor">Főtanácsadó</span>
          </span>
        </a>
        <ul className="nav-links">
          {SITE.nav.map((l) =>
            <li key={l.href}><a href={l.href}>{l.label}</a></li>
          )}
        </ul>
        <a href="#kapcsolat" className="nav-cta">Konzultáció →</a>
        <button
          className={"nav-burger" + (open ? " is-open" : "")}
          aria-label="Menü"
          aria-expanded={open}
          onClick={() => setOpen(!open)}>
          <span /><span /><span />
        </button>
      </div>

      <div className={"nav-drawer" + (open ? " is-open" : "")} aria-hidden={!open}>
        <ul className="nav-drawer-links">
          {SITE.nav.map((l) =>
            <li key={l.href}>
              <a href={l.href} onClick={close}>{l.label}</a>
            </li>
          )}
        </ul>
        <a href="#kapcsolat" className="nav-drawer-cta" onClick={close}>
          Konzultáció →
        </a>
      </div>
    </nav>
  );
}
window.Nav = Nav;

function Hero() {
  const showVideo = React.useState(function() {
    return typeof window !== "undefined" && window.innerWidth >= 768;
  })[0];

  const [monthly, setMonthly] = React.useState("");
  const [age,     setAge]     = React.useState("");
  const [errors,  setErrors]  = React.useState({});
  const [toast,   setToast]   = React.useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    var errs = {};
    var m = parseInt(monthly, 10);
    var a = parseInt(age, 10);
    if (!monthly || isNaN(m) || m < 10000 || m > 200000)
      errs.monthly = "10 000 – 200 000 Ft";
    if (!age || isNaN(a) || a < 18 || a > 64)
      errs.age = "18 – 64 év";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    window.dispatchEvent(new CustomEvent("precalc:apply", {
      detail: { monthly: m, age: a }
    }));
    var target = document.getElementById("kalkulator");
    if (target) target.scrollIntoView({ behavior: "smooth" });
    setToast(true);
    setTimeout(function() { setToast(false); }, 3200);
  }

  return (
    <section className="hero" id="foooldal">
      {showVideo && (
        <video className="hero-video" autoPlay muted loop playsInline preload="auto">
          <source src={SITE.hero.videoSrc} type="video/mp4" />
        </video>
      )}
      <div className="hero-overlay" />
      <div className="hero-grain" />
      <div className="hero-inner">
        <div className="hero-meta hero-anim-up">
          <span className="smallcaps" style={{ fontWeight: "700" }}>{SITE.brand.location}</span>
        </div>
        <h1 className="hero-foim hero-anim-fade">
          <span className="sor-normal">Tervezd meg</span>
          <span className="sor-normal">a következő</span>
          <span className="sor-kiemelt">10 évedet.</span>
        </h1>
        <p className="hero-sub hero-anim-up">{SITE.hero.sub}</p>

        <div className="hero-precalc-card hero-anim-down">
          <div className="hero-precalc-header">
            <span className="hero-precalc-eyebrow">Ingyenes kalkuláció</span>
            <p className="hero-precalc-lead">
              Add meg a tervezett havi összeget és jelenlegi korodat,
              azonnal megmutatjuk, mennyit érhet megtakarításod a futamidő végén.
            </p>
          </div>
          <form className="hero-precalc" onSubmit={handleSubmit} noValidate>
            <div className="hero-precalc-row">
              <div className={"hero-precalc-field" + (errors.monthly ? " has-error" : "")}>
                <label className="hero-precalc-label" htmlFor="hp-monthly">Havi összeg (Ft)</label>
                <input
                  id="hp-monthly"
                  className="hero-precalc-input"
                  type="number"
                  min="10000"
                  max="200000"
                  step="1000"
                  placeholder="pl. 50 000"
                  value={monthly}
                  onChange={function(e) { setMonthly(e.target.value); }}
                />
                {errors.monthly && <span className="hero-precalc-error">{errors.monthly}</span>}
              </div>
              <div className={"hero-precalc-field" + (errors.age ? " has-error" : "")}>
                <label className="hero-precalc-label" htmlFor="hp-age">Jelenlegi életkor</label>
                <input
                  id="hp-age"
                  className="hero-precalc-input"
                  type="number"
                  min="18"
                  max="64"
                  step="1"
                  placeholder="pl. 50"
                  value={age}
                  onChange={function(e) { setAge(e.target.value); }}
                />
                {errors.age && <span className="hero-precalc-error">{errors.age}</span>}
              </div>
              <button type="submit" className="btn btn-primary hero-precalc-btn">
                Megnézem a kalkulációt <span className="btn-arrow" />
              </button>
            </div>
            {toast && <div className="hero-precalc-toast">✓ Az adataid alapján számolunk</div>}
          </form>
        </div>

        <div className="gorgessen-jelzo hero-anim-fade">
          <span>Görgessen</span>
          <span className="gorgessen-nyil">↓</span>
        </div>

      </div>
    </section>);
}
window.Hero = Hero;

function Services() {
  return (
    <section className="section" id="szolgaltatasok">
      <div className="container">
        <div className="section-eyebrow reveal">{SITE.services.eyebrow}</div>
        <div className="services-head">
          <h2 className="reveal">{SITE.services.title}</h2>
          <p className="lead reveal">{SITE.services.lead}</p>
        </div>
        <div className="services-grid">
          {SITE.services.items.map((it) =>
          <article className="service-card reveal" key={it.n} tabIndex={0}>
              <div className="img" style={{ backgroundImage: `url(${it.img})` }} />
              <div className="veil" />
              <div className="body">
                <span className="num">{it.n}</span>
                <h3>{it.title}</h3>
                <p>{it.desc}</p>
              </div>
            </article>
          )}
        </div>
      </div>
    </section>);

}
window.Services = Services;