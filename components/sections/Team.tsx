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
    <section id="team" className="team-section">
      <div className="section-inner">
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <div className="eyebrow">Clinical Team</div>
        </div>
        <div className="sec-title" style={{ textAlign: "center" }}>
          Built around <em>precision.</em>
        </div>
        <div className="team-grid">
          {TEAM.map((member) => (
            <div key={member.name} className="team-card">
              <div className="team-avatar">{member.initials}</div>
              <div className="team-name">{member.name}</div>
              <div className="team-role">{member.role}</div>
              <p className="team-bio">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
