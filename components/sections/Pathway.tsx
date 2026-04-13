import styles from "./Pathway.module.css";

const STEPS = [
  {
    n: "1",
    sub: "Entry Point",
    title: "Inflection Edge Assessment",
    text: "Our proprietary 30-question, 5-dimension performance instrument. Produces your Neurotype Blueprint and frames the entire diagnostic conversation.",
    tags: ["Online · Free", "5 Dimensions", "Performance Blueprint"],
  },
  {
    n: "2",
    sub: "Clinical Diagnosis",
    title: "Formal ADHD Diagnostic",
    text: "Comprehensive psychiatric assessment by our metabolic psychiatrist. Beyond checklists — we assess ADHD type, comorbidities, rejection sensitivity, executive function, and your specific performance phenotype.",
    tags: ["DSM-5 / ICD-11", "Comorbidity Mapping", "Medication Review"],
  },
  {
    n: "3",
    sub: "Biological Layer",
    title: "Full Metabolic Workup",
    text: "The assessment that sets VitaReBa apart. We examine the biological systems driving your presentation — gut-brain axis, neurotransmitters, mitochondrial function, hormones, micronutrients, toxins, HRV, circadian rhythm and more.",
    tags: ["Gut · Brain Axis", "Mitochondrial", "HRV · Circadian", "Toxins"],
  },
  {
    n: "4",
    sub: "Neuroplasticity & Longevity",
    title: "Psychedelic-State Therapy",
    text: "Ketamine-assisted therapy and structured breathwork protocols inducing non-ordinary states — creating windows of heightened neuroplasticity. Research now shows psychedelics also preserve telomere length, upregulate longevity genes (SIRT1), and reduce oxidative stress at the cellular level.",
    tags: [
      "Ketamine-Assisted",
      "Breathwork",
      "Neuroplasticity",
      "Longevity",
      "Swiss Law",
    ],
  },
  {
    n: "5",
    sub: "Longevity Medicine",
    title: "VitaReBa Technology Protocol",
    text: "ADHD reduces life expectancy by up to 13 years. Our longevity medicine technologies directly address this — mitochondrial health, nervous system recovery, cellular longevity, and the biological foundations of sustained cognitive performance.",
    tags: ["H₂ Therapy", "IHHT", "PEMF", "Infrared", "HRV Biofeedback"],
  },
  {
    n: "6",
    sub: "Performance Architecture",
    title: "Surf Your Life + Home Harmony",
    text: "The coaching layer that converts clinical insights into daily architecture. You redesign how you work, lead, decide and recover — based on your specific neurotype. Includes a full audit of your personal and professional environments.",
    tags: ["Surf Your Life", "Home Harmony", "90-Day Programme"],
  },
];

export default function Pathway() {
  return (
    <section className={styles.section}>
      <div className="section-inner">
        <div className="section-header">
          <div className="eyebrow">Clinical Pathway</div>
        </div>
        <h2 className="sec-title sec-title-center">
          Six layers. <em>One integrated protocol.</em>
        </h2>
        <div className={styles.grid}>
          {STEPS.map((step) => (
            <div key={step.n} className={styles.card}>
              <div className={styles.n}>{step.n}</div>
              <div className={styles.sub}>{step.sub}</div>
              <div className={styles.title}>{step.title}</div>
              <p className={styles.text}>{step.text}</p>
              <div className="tags">
                {step.tags.map((tag) => (
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
