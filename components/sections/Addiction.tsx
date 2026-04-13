const CARDS = [
  {
    label: "Fully Private",
    text: "No clinical setting. No institutional record. Complete discretion from first contact to final session.",
  },
  {
    label: "Dual Diagnosis",
    text: "ADHD and addiction treated together — not sequentially. The metabolic root causes of both are addressed simultaneously.",
  },
  {
    label: "Switzerland-Based",
    text: "Access to world-class Swiss medical infrastructure, legal therapeutic frameworks, and an environment of absolute safety.",
  },
  {
    label: "International Clients",
    text: "Full concierge coordination. We receive clients from across Europe, the Middle East and beyond.",
  },
];

export default function Addiction() {
  return (
    <section className="addiction-section">
      <div className="section-inner">
        <div className="addiction-grid">
          <div>
            <div
              className="eyebrow"
              style={{ color: "rgba(184,150,10,.7)" }}
            >
              Addiction Treatment
            </div>
            <div className="sec-title" style={{ color: "#fff" }}>
              Where ADHD ends
              <br />
              and addiction{" "}
              <em style={{ fontStyle: "italic", color: "rgba(255,255,255,.35)" }}>
                begins
              </em>
              <br />
              is rarely obvious.
            </div>
          </div>

          <div>
            <p
              style={{
                fontSize: ".88rem",
                color: "rgba(255,255,255,.4)",
                lineHeight: "1.85",
                marginBottom: "1.5rem",
              }}
            >
              ADHD and addiction are among the most frequently co-occurring
              conditions in high-performing adults. For many, substance use —
              alcohol, stimulants, prescription medications — begins as
              self-medication for an undiagnosed or undertreated ADHD brain.
            </p>
            <p
              style={{
                fontSize: ".88rem",
                color: "rgba(255,255,255,.4)",
                lineHeight: "1.85",
                marginBottom: "2rem",
              }}
            >
              We offer exclusive, fully private addiction treatment in
              Switzerland — integrated with the complete metabolic and
              psychiatric picture. Not a clinic setting. Not an institutional
              programme. A discreet, evidence-based, deeply personal process.
            </p>

            <div className="addiction-cards">
              {CARDS.map((card) => (
                <div key={card.label} className="addiction-card">
                  <div className="addiction-card-label">{card.label}</div>
                  <div className="addiction-card-text">{card.text}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              <a
                href="mailto:manuel@surfyourlife.org"
                style={{
                  display: "inline-block",
                  border: "1px solid rgba(255,255,255,.18)",
                  color: "rgba(255,255,255,.55)",
                  padding: ".85rem 2rem",
                  fontSize: ".7rem",
                  letterSpacing: ".16em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  borderRadius: ".2rem",
                  transition: "all .3s",
                }}
              >
                Enquire Confidentially
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
