/* global React, SITE, Icon, fmtFt */

function Quiz() {
  const qs = SITE.quiz.questions;
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState({});
  const [contact, setContact] = React.useState({ name: "", email: "", phone: "", note: "" });
  const [submitted, setSubmitted] = React.useState(false);

  const total = qs.length;
  const current = qs[step];
  const progress = Math.round(((submitted ? total : step) / total) * 100);

  const setAns = (id, v) => setAnswers((a) => ({ ...a, [id]: v }));

  const canAdvance =
    !current ? true :
    current.kind === "options" ? !!answers[current.id] :
    current.kind === "contact"  ? contact.name.trim() && contact.email.trim() :
    true;

  // ── Lead delivery via Formspree ────────────────────────────────────
  // Replace FORMSPREE_ID below with the real ID from formspree.io
  // (sign up free, create form, copy the f/XXXXX from the endpoint URL).
  // Until then, submissions log to console + show success state.
  const FORMSPREE_ID = "YOUR_FORMSPREE_ID"; // ← cseréld ki

  const submitLead = async () => {
    const labelFor = (qid, val) => {
      const q = qs.find((x) => x.id === qid);
      if (!q || !q.options) return val || "—";
      const opt = q.options.find((o) => o.v === val);
      return opt ? opt.label : val || "—";
    };
    const payload = {
      _subject: `Új érdeklődő — ${contact.name}`,
      _replyto: contact.email,
      név: contact.name,
      email: contact.email,
      telefon: contact.phone || "—",
      megjegyzés: contact.note || "—",
      cél: labelFor("goal", answers.goal),
      futamidő: labelFor("horizon", answers.horizon),
      havi_keret: labelFor("monthly", answers.monthly),
      tapasztalat: labelFor("experience", answers.experience),
      forrás: "baloghrichard.hu — kérdőív",
      időpont: new Date().toLocaleString("hu-HU"),
    };
    if (FORMSPREE_ID && FORMSPREE_ID !== "YOUR_FORMSPREE_ID") {
      try {
        await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        console.warn("Lead delivery failed:", e);
      }
    } else {
      console.info("[Quiz] Lead (placeholder, Formspree ID not set):", payload);
    }
  };

  const next = () => {
    if (step < total - 1) {
      setStep(step + 1);
    } else {
      submitLead();
      setSubmitted(true);
    }
  };
  const back = () => step > 0 && setStep(step - 1);

  // Map answers → readable summary
  const labelFor = (qid, val) => {
    const q = qs.find((x) => x.id === qid);
    if (!q || !q.options) return val || "—";
    const opt = q.options.find((o) => o.v === val);
    return opt ? opt.label : val || "—";
  };

  if (submitted) {
    return (
      <div className="quiz">
        <div className="quiz-progress" style={{ width: "100%" }}/>
        <div className="quiz-thanks">
          <div className="check"><Icon name="check" size={24}/></div>
          <h3>Köszönöm, {contact.name.split(" ")[0] || "kedves érdeklődő"}.</h3>
          <p>
            A javaslatodat összeállítom és <strong>24 órán belül</strong> visszajelzek
            a megadott elérhetőségen.
          </p>
          <div className="quiz-summary" style={{ marginTop: "var(--s-7)", textAlign: "left" }}>
            <div className="row"><span className="k">Cél</span><span className="v">{labelFor("goal", answers.goal)}</span></div>
            <div className="row"><span className="k">Futamidő</span><span className="v">{labelFor("horizon", answers.horizon)}</span></div>
            <div className="row"><span className="k">Havi keret</span><span className="v">{labelFor("monthly", answers.monthly)}</span></div>
            <div className="row"><span className="k">Tapasztalat</span><span className="v">{labelFor("experience", answers.experience)}</span></div>
            <div className="row"><span className="k">Kapcsolat</span><span className="v">{contact.email}</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz">
      <div className="quiz-progress" style={{ width: progress + "%" }}/>
      <div className="quiz-step-meta">
        <span className="smallcaps">Kérdés {step + 1} / {total}</span>
        <span className="smallcaps">{progress}%</span>
      </div>
      <h3 className="quiz-q">{current.q}</h3>
      <p className="quiz-help">{current.help}</p>

      {current.kind === "options" && (
        <div className="quiz-options">
          {current.options.map((opt) => (
            <button
              key={opt.v}
              className={"quiz-option" + (answers[current.id] === opt.v ? " selected" : "")}
              onClick={() => setAns(current.id, opt.v)}
            >
              <span className="opt-label">{opt.label}</span>
              <span className="opt-help">{opt.help}</span>
            </button>
          ))}
        </div>
      )}

      {current.kind === "contact" && (
        <>
          <div className="quiz-input-row">
            <input className="quiz-input" placeholder="Teljes név"
              value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })}/>
            <input className="quiz-input" placeholder="E-mail" type="email"
              value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })}/>
          </div>
          <div className="quiz-input-row">
            <input className="quiz-input" placeholder="Telefon (opcionális)"
              value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })}/>
            <input className="quiz-input" placeholder="Bármi, amit jó tudnom (opcionális)"
              value={contact.note} onChange={(e) => setContact({ ...contact, note: e.target.value })}/>
          </div>
        </>
      )}

      <div className="quiz-actions">
        <div className="left">
          {step > 0 && (
            <button className="btn btn-ghost" onClick={back}>
              <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><span className="btn-arrow"/></span>
              Vissza
            </button>
          )}
        </div>
        <button className="btn btn-primary" disabled={!canAdvance} onClick={next}
          style={{ opacity: canAdvance ? 1 : 0.4, cursor: canAdvance ? "pointer" : "not-allowed" }}>
          {step === total - 1 ? "Beküldés" : "Tovább"}
          <span className="btn-arrow"/>
        </button>
      </div>
    </div>
  );
}
window.Quiz = Quiz;

function Contact() {
  const c = SITE.contact;
  return (
    <section className="section contact" id="kapcsolat">
      <div className="container">
        <div className="contact-grid">
          <div className="contact-left reveal">
            <div className="section-eyebrow">{c.eyebrow}</div>
            <h2>{c.title}</h2>
            <p className="lead">{c.lead}</p>
            <ul className="contact-list">
              {c.items.map((it) => (
                <li key={it.lbl}>
                  <Icon name={it.icon} size={20}/>
                  <div>
                    <div className="lbl">{it.lbl}</div>
                    <div className="val">{it.val}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="reveal">
            <Quiz/>
          </div>
        </div>
      </div>
    </section>
  );
}
window.Contact = Contact;

function Footer() {
  const f = SITE.footer;
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div className="col brand-col">
            <a className="logo" href="#foooldal">
              <span className="mark">{SITE.brand.monogram}</span>
              <span>{SITE.brand.name}</span>
            </a>
            <p>{f.tagline}</p>
          </div>
          {f.columns.map((col) => (
            <div className="col" key={col.head}>
              <h4>{col.head}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}><a href={l.href}>{l.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-base">
          <span>{f.base}</span>
        </div>
      </div>
    </footer>
  );
}
window.Footer = Footer;
