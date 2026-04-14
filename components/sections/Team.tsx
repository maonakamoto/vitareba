import { getTranslations } from "next-intl/server";
import styles from "./Team.module.css";

const TEAM_META = [
  { initials: "M", name: "Manuel" },
  { initials: "DM", name: "Dr. Montagna" },
  { initials: "DK", name: "Dr. Kondratiuk" },
];

export default async function Team() {
  const t = await getTranslations("team");
  const members = t.raw("members") as Array<{ role: string; bio: string }>;

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
          {TEAM_META.map((meta, i) => (
            <div key={meta.name} className={styles.card}>
              <div className={styles.avatar}>{meta.initials}</div>
              <div className={styles.name}>{meta.name}</div>
              <div className={styles.role}>{members[i].role}</div>
              <p className={styles.bio}>{members[i].bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
