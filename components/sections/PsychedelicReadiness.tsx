import styles from "./PsychedelicReadiness.module.css";

const PHASES = [
  {
    n: "1",
    title: "Physical Diagnostics",
    text: "Full metabolic workup, cardiovascular assessment, medication review, and contraindication screening. We identify and address any biological factors that could affect your experience and its longevity benefits.",
  },
  {
    n: "2",
    title: "Metabolic Optimisation",
    text: "Targeted supplementation, gut health protocol, sleep architecture improvement, and nervous system regulation. Building the biological foundation for both neuroplasticity and the cellular longevity effects of psychedelic therapy.",
  },
  {
    n: "3",
    title: "Psychological Readiness",
    text: "Intention setting, breathwork training, mindfulness practice, and integration framework preparation. Ensuring you have the tools to process and sustain the insights that emerge — for lasting change.",
  },
];

export default function PsychedelicReadiness() {
  return (
    <section className={styles.section}>
      <div className="section-inner">
        <div className={styles.grid}>
          <div>
            <div className="eyebrow">Psychedelic Readiness Programme</div>
            <div className="sec-title">
              Three months.
              <br />
              <em>Complete preparation.</em>
            </div>
            <p className="sec-sub" style={{ marginTop: "1rem" }}>
              A structured protocol for anyone considering psychedelic-assisted
              therapy — whether with us or with a referral partner clinic. We
              ensure your body, metabolism and mind are optimally prepared.
            </p>

            <div className={styles.callout}>
              <div className={styles.calloutTitle}>
                Beyond neuroplasticity: the longevity dimension
              </div>
              <div className={styles.calloutText}>
                A 2025 study published in Nature&apos;s npj Aging found that
                psilocybin extended human cellular lifespan by up to 57%,
                preserved telomere length, and increased survival of aged mice
                by 30%. The compound upregulates SIRT1 — a key gene in
                longevity and DNA repair — and reduces oxidative stress at the
                cellular level. These findings suggest psychedelics may be
                potent geroprotective agents, making metabolic preparation even
                more critical.
              </div>
              <div className={styles.calloutCite}>
                Kato et al., npj Aging, 2025 · Emory University / Baylor
                College of Medicine
              </div>
            </div>
          </div>

          <div>
            <div className={styles.phases}>
              {PHASES.map((phase) => (
                <div key={phase.n} className={styles.phase}>
                  <div className={styles.phaseN}>{phase.n}</div>
                  <div>
                    <div className={styles.phaseTitle}>{phase.title}</div>
                    <div className={styles.phaseText}>{phase.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className={styles.body}>
              Available for individual clients and referral partners —
              psychedelic clinics, retreat centres, and medical practitioners
              seeking thorough pre-treatment preparation for their patients.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
