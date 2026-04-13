import styles from "./Pillars.module.css";

const PILLARS = [
  {
    icon: "🧬",
    name: "Metabolic Psychiatry",
    desc: "The overarching framework. We assess psychiatric conditions through metabolic, biological and physiological root causes — neuroinflammation, mitochondrial health, gut-brain axis, circadian rhythmics, and stress markers. Because mental health and longevity share the same biological foundation. Advanced diagnostics delivered via clinic sessions and home test kits.",
    tags: [
      "Neuroinflammation",
      "Gut-Brain Axis",
      "Mitochondrial",
      "Longevity",
      "Home Test Kits",
    ],
    featured: false,
  },
  {
    icon: "⚡",
    name: "ADHD for High Performers",
    desc: "Our flagship programme featuring the proprietary SYL Clock — mapping your symptoms across four life dimensions: health, mindset, relationships and career. Formal diagnosis, metabolic workup, longevity medicine and 90 days of Surf Your Life transformation coaching.",
    tags: ["SYL Clock", "4 Dimensions", "90-Day Coaching", "Surf Your Life"],
    featured: true,
  },
  {
    icon: "🍄",
    name: "Psychedelic Readiness",
    desc: "A three-month structured preparation protocol combining physical diagnostics, metabolic optimisation and psychological readiness assessment. Emerging research shows psychedelics don't just support neuroplasticity — they may extend cellular lifespan, preserve telomeres, and promote healthier aging.",
    tags: [
      "3-Month Protocol",
      "Physical Readiness",
      "Neuroplasticity",
      "Longevity",
      "Swiss Framework",
    ],
    featured: false,
  },
];

export default function Pillars() {
  return (
    <section id="pillars" className={styles.section}>
      <div className="section-inner">
        <div className="section-header">
          <div className="eyebrow">Our Three Pillars</div>
        </div>
        <h2 className="sec-title sec-title-center">
          Three programmes. <em>One integrated approach.</em>
        </h2>
        <p className={`sec-sub ${styles.secSub}`}>
          Each programme addresses a different entry point — but all share the
          same metabolic foundation, the same clinical rigour, and the same
          commitment to treating root causes, not symptoms.
        </p>
        <div className={styles.grid}>
          {PILLARS.map((pillar) => (
            <div
              key={pillar.name}
              className={`${styles.pillar} ${pillar.featured ? styles.featured : ""}`}
            >
              <div className={styles.icon}>{pillar.icon}</div>
              <div className={styles.name}>{pillar.name}</div>
              <p className={styles.desc}>{pillar.desc}</p>
              <div className="tags">
                {pillar.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
