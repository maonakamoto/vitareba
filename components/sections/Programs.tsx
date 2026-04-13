import { COMPANY } from "@/lib/config/company";
import styles from "./Programs.module.css";

const PROGRAMS = [
  {
    name: "Edge Diagnostic",
    price: "CHF 2,400",
    note: "One-time · 2 sessions",
    desc: "The most complete ADHD biological picture available in Switzerland. Formal diagnosis, full metabolic workup, and your personalised Neurotype Blueprint.",
    items: [
      "Inflection Edge assessment",
      "Formal ADHD diagnostic",
      "Full metabolic workup",
      "Neurotype Blueprint session",
      "Medication & supplement protocol",
    ],
    featured: false,
    badge: null,
    btnLabel: "Enquire",
    btnStyle: "outline" as const,
  },
  {
    name: "Riding the Wave",
    price: "CHF 8,500",
    note: "90-day programme",
    desc: "The complete integrated programme — clinical diagnosis, biological optimisation, longevity medicine, and 90 days of Surf Your Life transformation coaching.",
    items: [
      "Everything in Edge Diagnostic",
      "90-day Surf Your Life coaching",
      "SYL Clock full mapping",
      "VitaReBa technology protocol",
      "Home Harmony environment audit",
      "Psychedelic therapy assessment",
    ],
    featured: true,
    badge: "Most chosen",
    btnLabel: "Begin the Journey",
    btnStyle: "primary" as const,
  },
  {
    name: "Full Ocean",
    price: "CHF 18,000",
    note: "Annual · Fully concierge",
    desc: "The comprehensive annual architecture — ongoing biological monitoring, regular consultations, psychedelic therapy, and continuous performance optimisation.",
    items: [
      "Everything in Riding the Wave",
      "Psychedelic-assisted therapy",
      "Quarterly metabolic retesting",
      "Monthly consultations",
      "Annual Inflection instruments retake",
    ],
    featured: false,
    badge: null,
    btnLabel: "Enquire",
    btnStyle: "outline" as const,
  },
];

export default function Programs() {
  return (
    <section id="pricing" className={styles.section}>
      <div className="section-inner">
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <div className="eyebrow">Programme Architecture</div>
        </div>
        <div className="sec-title" style={{ textAlign: "center" }}>
          Three entry points. <em>One destination.</em>
        </div>

        <div className={styles.grid}>
          {PROGRAMS.map((prog) => (
            <div
              key={prog.name}
              className={`${styles.prog} ${prog.featured ? styles.featured : ""}`}
            >
              {prog.badge && <div className={styles.badge}>{prog.badge}</div>}
              <div
                className={styles.name}
                style={prog.featured ? { marginTop: ".5rem" } : {}}
              >
                {prog.name}
              </div>
              <div className={styles.price}>{prog.price}</div>
              <div className={styles.note}>{prog.note}</div>
              <p className={styles.desc}>{prog.desc}</p>
              {prog.items.map((item) => (
                <div key={item} className={styles.item}>
                  <span className={styles.check}>✦</span>
                  {item}
                </div>
              ))}
              <a
                href={`mailto:${COMPANY.email}`}
                className={`${styles.btn} ${
                  prog.btnStyle === "primary" ? styles.btnPrimary : styles.btnOutline
                }`}
              >
                {prog.btnLabel}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
