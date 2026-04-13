import styles from "./Approach.module.css";

const ITEMS = [
  {
    n: "01",
    title: "Metabolic Psychiatry",
    body: "We assess the biological substrate of your mental performance — the body systems that directly regulate attention, arousal, mood and energy. No other clinic in Switzerland combines these layers in a single diagnostic protocol.",
  },
  {
    n: "02",
    title: "ADHD as a Performance System",
    body: "ADHD is not a deficit. It is an asymmetric performance profile — with extraordinary peaks, real costs, and specific conditions under which it excels. We map your profile precisely and build the architecture that turns asymmetry into advantage.",
  },
  {
    n: "03",
    title: "Psychedelic-Assisted Therapy",
    body: "Ketamine-assisted therapy and structured breathwork protocols within Swiss regulatory frameworks. We create windows of heightened neuroplasticity — and our three-month readiness programme ensures you enter these experiences from the strongest possible foundation.",
  },
  {
    n: "04",
    title: "International Patients",
    body: "We receive patients from across Europe, the Middle East and beyond. Full concierge coordination for travel, accommodation and scheduling — complete discretion from first contact to final session.",
  },
];

export default function Approach() {
  return (
    <section id="approach" className={styles.section}>
      <div className="section-inner">
        <div className={styles.grid}>
          <div className={styles.sticky}>
            <div className="eyebrow">Our Approach</div>
            <h2 className="sec-title">
              We diagnose
              <br />
              and <em>design.</em>
            </h2>
            <p className="sec-sub sec-sub-mt">
              Standard psychiatry diagnoses and prescribes. We map the full
              biological picture and build a personalised architecture for your
              mind and body.
            </p>
          </div>
          <div className={styles.items}>
            {ITEMS.map((item) => (
              <div key={item.n} className={styles.item}>
                <div className={styles.itemN}>{item.n}</div>
                <div className={styles.itemTitle}>{item.title}</div>
                <p className={styles.itemBody}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
