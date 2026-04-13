const DIMENSIONS = [
  {
    icon: "💚",
    name: "Health",
    text: "Energy, sleep, nutrition, exercise, substance use — the biological foundation everything else rests on.",
  },
  {
    icon: "🧠",
    name: "Mindset",
    text: "Focus patterns, emotional regulation, inner narrative, decision quality and cognitive performance under pressure.",
  },
  {
    icon: "🤝",
    name: "Relationships",
    text: "Communication patterns, rejection sensitivity, trust, intimacy and how your neurotype shapes your connections.",
  },
  {
    icon: "🚀",
    name: "Career",
    text: "Leadership style, productivity architecture, team dynamics, strategic thinking and professional trajectory.",
  },
];

export default function SylClock() {
  return (
    <section id="longevity" className="syl-section">
      <div className="section-inner">
        <div className="syl-grid">
          <div>
            <div
              className="eyebrow"
              style={{ color: "rgba(42,122,138,.7)" }}
            >
              Proprietary Instrument
            </div>
            <div className="sec-title" style={{ color: "#fff" }}>
              The SYL Clock.
              <br />
              <em>Four dimensions. One picture.</em>
            </div>
            <p
              style={{
                fontSize: ".85rem",
                color: "rgba(255,255,255,.4)",
                lineHeight: "1.85",
                marginTop: "1.2rem",
                maxWidth: "28rem",
              }}
            >
              The Surf Your Life Clock maps your ADHD symptoms across the four
              dimensions that matter most. Not just how your brain works — but
              how it shows up in every area of your life. The result is the most
              actionable performance map available.
            </p>
          </div>

          <div>
            <div className="syl-dims">
              {DIMENSIONS.map((dim) => (
                <div key={dim.name} className="syl-dim">
                  <div className="syl-dim-icon">{dim.icon}</div>
                  <div className="syl-dim-name">{dim.name}</div>
                  <div className="syl-dim-text">{dim.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
