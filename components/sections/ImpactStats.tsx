import styles from "./ImpactStats.module.css";

const STATS = [
  {
    number: "13",
    unit: " yrs",
    label: "Reduced life expectancy for adults with persistent ADHD",
    source: "Barkley & Fischer, 2019",
  },
  {
    number: "4×",
    unit: "",
    label:
      "Higher risk of accidental injury, substance abuse and metabolic disease",
    source: "Journal of Attention Disorders",
  },
  {
    number: "40",
    unit: "%",
    label:
      "Of ADHD adults have clinically significant sleep disorders affecting cellular recovery",
    source: "Barkley, 2015",
  },
  {
    number: "#1",
    unit: "",
    label:
      "ADHD presents a greater mortality risk than poor diet, inactivity, obesity and smoking — combined",
    source: "Barkley, CHADD 2018",
  },
];

export default function ImpactStats() {
  return (
    <section className={styles.section}>
      <div className="section-inner">
        <div className={styles.header}>
          <div className={`eyebrow ${styles.eyebrowDim}`}>
            The Numbers No One Talks About
          </div>
        </div>
        <h2 className={`sec-title ${styles.secTitle}`}>
          ADHD is not just a performance issue.
          <br />
          <em>It&apos;s a longevity issue.</em>
        </h2>

        <div className={styles.grid}>
          {STATS.map((stat) => (
            <div key={stat.label} className={styles.card}>
              <div className={styles.n}>
                {stat.number}
                {stat.unit && (
                  <span className={styles.unit}>{stat.unit}</span>
                )}
              </div>
              <div className={styles.label}>{stat.label}</div>
              <div className={styles.source}>{stat.source}</div>
            </div>
          ))}
        </div>

        <div className={styles.text}>
          <p>
            These are not just cognitive challenges. Untreated ADHD drives
            metabolic dysfunction, accelerated cellular aging, chronic
            inflammation, and poor self-regulation of the exact health
            behaviours that determine how long and how well you live.{" "}
            <em>
              This is why metabolic psychiatry and longevity medicine must work
              together
            </em>{" "}
            — and why VitaReBa exists.
          </p>
        </div>
      </div>
    </section>
  );
}
