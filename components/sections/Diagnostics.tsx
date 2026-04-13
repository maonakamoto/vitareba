import styles from "./Diagnostics.module.css";

const DIAGNOSTIC_CATEGORIES = [
  {
    cat: "Gut · Brain Axis",
    items: [
      "Complete microbiome analysis",
      "Intestinal permeability markers",
      "Neurotransmitter precursor status",
      "Inflammatory cascade mapping",
    ],
  },
  {
    cat: "Mitochondrial Health",
    items: [
      "Cellular energy production capacity",
      "Oxidative stress burden",
      "Mitochondrial efficiency markers",
      "Energy metabolism pathways",
    ],
  },
  {
    cat: "Hormones",
    items: [
      "Full cortisol rhythm & stress axis",
      "Thyroid comprehensive panel",
      "Sex hormones & adrenal function",
      "Insulin & metabolic regulators",
    ],
  },
  {
    cat: "Micronutrients & Toxins",
    items: [
      "Key mineral & vitamin status",
      "Omega fatty acid profile",
      "Heavy metal & environmental toxin load",
      "Inflammatory & oxidative markers",
    ],
  },
  {
    cat: "HRV · Circadian · Sleep",
    items: [
      "Heart rate variability baseline",
      "Circadian rhythm mapping",
      "Sleep architecture assessment",
      "Autonomic nervous system regulation",
    ],
  },
  {
    cat: "Stress & Serotonin Markers",
    items: [
      "Serotonin & dopamine metabolism",
      "Cortisol awakening response",
      "GABA & glutamate balance",
      "Adrenal reserve capacity",
    ],
  },
];

export default function Diagnostics() {
  return (
    <section id="diagnostics" className={styles.section}>
      <div className="section-inner">
        <div className={styles.intro}>
          <div>
            <div className="eyebrow">Diagnostic Depth</div>
            <h2 className="sec-title">
              The most complete
              <br />
              biological picture
              <br />
              <em>available.</em>
            </h2>
          </div>
          <div>
            <p className="sec-sub">
              Our metabolic workup examines six biological systems that directly
              influence cognitive performance, mood and energy. Available
              in-clinic and via home test kits for international patients.
            </p>
          </div>
        </div>

        <div className={styles.grid}>
          {DIAGNOSTIC_CATEGORIES.map((category) => (
            <div key={category.cat} className={styles.dc}>
              <div className={styles.cat}>{category.cat}</div>
              {category.items.map((item) => (
                <div key={item} className={styles.item}>
                  <div className={styles.dot} />
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
