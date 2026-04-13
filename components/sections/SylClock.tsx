import styles from "./SylClock.module.css";

const SYL_DIMENSIONS = [
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
    <section id="longevity" className={styles.section}>
      <div className="section-inner">
        <div className={styles.grid}>
          <div>
            <div className={`eyebrow ${styles.eyebrowDim}`}>
              Proprietary Instrument
            </div>
            <h2 className="sec-title sec-title-light">
              The SYL Clock.
              <br />
              <em>Four dimensions. One picture.</em>
            </h2>
            <p className={styles.body}>
              The Surf Your Life Clock maps your ADHD symptoms across the four
              dimensions that matter most. Not just how your brain works — but
              how it shows up in every area of your life. The result is the most
              actionable performance map available.
            </p>
          </div>

          <div>
            <div className={styles.dims}>
              {SYL_DIMENSIONS.map((dim) => (
                <div key={dim.name} className={styles.dim}>
                  <div className={styles.dimIcon}>{dim.icon}</div>
                  <div className={styles.dimName}>{dim.name}</div>
                  <div className={styles.dimText}>{dim.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
