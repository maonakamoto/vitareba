import styles from "@/app/(admin)/admin.module.css";
import { EXERCISE_FREQUENCY_OPTIONS } from "@/lib/config/portal";

type Profile = {
  phone?: string | null;
  dateOfBirth?: string | null;
  city?: string | null;
  occupation?: string | null;
  mainConcern?: string | null;
  goals?: string | null;
  diagnosisHistory?: string | null;
  currentMedications?: string | null;
  currentSupplements?: string | null;
  sleepHoursAvg?: number | null;
  exerciseFrequency?: string | null;
};

function getExerciseLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return EXERCISE_FREQUENCY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

const SUB_LABEL_STYLE = {
  fontSize: "0.65rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  color: "var(--muted)",
  marginBottom: "0.5rem",
};

const TABLE_STYLE = {
  width: "100%",
  fontSize: "0.82rem",
  borderCollapse: "collapse" as const,
  marginBottom: "1rem",
};

function ProfileRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <tr>
      <td style={{ color: "var(--muted)", padding: "0.3rem 0", width: "40%", verticalAlign: "top" }}>{label}</td>
      <td style={{ color: "var(--ink2)", padding: "0.3rem 0", lineHeight: 1.5 }}>
        {value || <span style={{ color: "var(--faint)" }}>—</span>}
      </td>
    </tr>
  );
}

export function PatientProfileCard({ profile }: { profile: Profile | null | undefined }) {
  const pr = profile;
  return (
    <div className={styles.card}>
      <p className={styles.cardLabel}>Profile</p>

      <p style={SUB_LABEL_STYLE}>Contact</p>
      <table style={TABLE_STYLE}>
        <tbody>
          <ProfileRow label="Phone" value={pr?.phone} />
          <ProfileRow label="Date of birth" value={pr?.dateOfBirth} />
          <ProfileRow label="City" value={pr?.city} />
          <ProfileRow label="Occupation" value={pr?.occupation} />
        </tbody>
      </table>

      <p style={SUB_LABEL_STYLE}>Clinical</p>
      <table style={TABLE_STYLE}>
        <tbody>
          <ProfileRow label="Main concern" value={pr?.mainConcern} />
          <ProfileRow label="Goals" value={pr?.goals} />
          <ProfileRow label="Diagnosis history" value={pr?.diagnosisHistory} />
          <ProfileRow label="Medications" value={pr?.currentMedications} />
          <ProfileRow label="Supplements" value={pr?.currentSupplements} />
        </tbody>
      </table>

      <p style={{ ...SUB_LABEL_STYLE, marginBottom: "0.5rem" }}>Lifestyle</p>
      <table style={{ ...TABLE_STYLE, marginBottom: 0 }}>
        <tbody>
          <tr>
            <td style={{ color: "var(--muted)", padding: "0.3rem 0", width: "40%" }}>Sleep avg</td>
            <td style={{ color: "var(--ink2)", padding: "0.3rem 0" }}>
              {pr?.sleepHoursAvg != null
                ? `${pr.sleepHoursAvg}h/night`
                : <span style={{ color: "var(--faint)" }}>—</span>}
            </td>
          </tr>
          <tr>
            <td style={{ color: "var(--muted)", padding: "0.3rem 0" }}>Exercise</td>
            <td style={{ color: "var(--ink2)", padding: "0.3rem 0" }}>{getExerciseLabel(pr?.exerciseFrequency)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
