import styles from "./Team.module.css";

const TEAM = [
  {
    initials: "M",
    name: "Manuel",
    role: "Founder · Surf Your Life",
    bio: "The architect behind VitaReBa's integrated approach. Combining performance coaching with metabolic psychiatry to build the life architecture high-performing minds need.",
  },
  {
    initials: "DM",
    name: "Dr. Montagna",
    role: "Metabolic Psychiatrist",
    bio: "Specialist in metabolic psychiatry with deep expertise in ADHD, addiction and the biological substrates of cognitive performance.",
  },
  {
    initials: "DK",
    name: "Dr. Kondratiuk",
    role: "Clinical Lead",
    bio: "Leading the clinical diagnostic protocol and overseeing the integration of metabolic workups with psychiatric assessment and treatment planning.",
  },
];

export default function Team() {
  return (
    <section id="team" className={styles.section}>
      <div className="section-inner">
        <div className="section-header">
          <div className="eyebrow">Clinical Team</div>
        </div>
        <h2 className="sec-title sec-title-center">
          Built around <em>precision.</em>
        </h2>
        <div className={styles.grid}>
          {TEAM.map((member) => (
            <div key={member.name} className={styles.card}>
              <div className={styles.avatar}>{member.initials}</div>
              <div className={styles.name}>{member.name}</div>
              <div className={styles.role}>{member.role}</div>
              <p className={styles.bio}>{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
