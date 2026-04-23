import { getTranslations } from "next-intl/server";
import styles from "./Team.module.css";
import { TEAM_MEMBERS } from "@/lib/config/team";

export default async function Team() {
  const t = await getTranslations("team");
  const members = t.raw("members") as Record<string, { role: string; bio: string }>;

  return (
    <section id="team" className={styles.section}>
      <div className="section-inner">
        <div className="section-header">
          <div className="eyebrow">{t("eyebrow")}</div>
        </div>
        <h2 className="sec-title sec-title-center">
          {t("heading")} <em>{t("headingEm")}</em>
        </h2>
        <div className={styles.grid}>
          {TEAM_MEMBERS.map((member) => {
            const m = members[member.key];
            if (!m) return null;
            return (
              <div key={member.key} className={styles.card}>
                <div className={styles.avatar}>{member.initials}</div>
                <div className={styles.name}>{member.name}</div>
                <div className={styles.role}>{m.role}</div>
                <p className={styles.bio}>{m.bio}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
