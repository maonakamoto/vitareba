"use client";

import { usePathname } from "next/navigation";
import {
  DIMENSIONS,
  getVerdict,
  getInterpretation,
  scoreColor,
  type DimensionId,
} from "@/lib/assessment/data";
import { COMPANY } from "@/lib/config/company";
import { AUTH_ROUTES } from "@/lib/config/routes";
import { routing } from "@/i18n/routing";
import styles from "./Assessment.module.css";

interface ResultsScreenProps {
  scores: Record<DimensionId, number>;
  overall: number;
  onRestart: () => void;
}

export default function ResultsScreen({
  scores,
  overall,
  onRestart,
}: ResultsScreenProps) {
  const verdict = getVerdict(overall);
  // Preserve the visitor's marketing-site locale through to /register so a
  // German visitor on /de/ taking the overlay doesn't suddenly land on
  // English /register. In portal context (no /[locale] prefix) we fall
  // through to the canonical AUTH_ROUTES.register.
  const pathname = usePathname();
  const seg = pathname.split("/")[1];
  const isLocalePrefixed = (routing.locales as readonly string[]).includes(seg);
  const registerHref = isLocalePrefixed
    ? `/${seg}${AUTH_ROUTES.register}`
    : AUTH_ROUTES.register;

  return (
    <div className={`${styles.ovScreen} ${styles.active}`}>
      <div className={styles.vCard}>
        <div className={styles.vScore}>
          {overall}
          <span>/100</span>
        </div>
        <div className={styles.vName}>{verdict.name}</div>
        <p className={styles.vText}>{verdict.text}</p>
      </div>

      <div className={styles.rScores}>
        {DIMENSIONS.map((dim) => {
          const score = scores[dim.id];
          return (
            <div key={dim.id} className={styles.rScoreCard}>
              <div className={styles.rScIcon}>{dim.icon}</div>
              <div className={styles.rScName}>{dim.name}</div>
              <div className={styles.rScN} style={{ color: scoreColor(score) }}>
                {score}
              </div>
              <div className={styles.rScBar}>
                <div
                  className={styles.rScFill}
                  style={{ width: `${score}%`, background: scoreColor(score) }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div>
        {DIMENSIONS.map((dim) => {
          const score = scores[dim.id];
          return (
            <div key={dim.id} className={styles.rDim}>
              <div className={styles.rDimTop}>
                <div className={styles.rDimName}>
                  {dim.icon} {dim.name}
                </div>
                <div
                  className={styles.rDimScore}
                  style={{ color: scoreColor(score) }}
                >
                  {score}
                </div>
              </div>
              <div className={styles.rDimBar}>
                <div
                  className={styles.rDimFill}
                  style={{ width: `${score}%`, background: scoreColor(score) }}
                />
              </div>
              <div className={styles.rDimText}>{getInterpretation(dim.id, score)}</div>
            </div>
          );
        })}
      </div>

      <div className={styles.rCta}>
        <div className={styles.rCtaTitle}>This is your starting point.</div>
        <div className={styles.rCtaSub}>
          A 30-minute discovery call with {COMPANY.clinicianName} translates these scores into a concrete plan — which dimensions to address first, what interventions are available, and what a {COMPANY.shortName} programme looks like for your specific profile.
        </div>
        <div className={styles.rCtaSubSpaced}>
          No commitment. Just clarity.
        </div>
        <div className={styles.rCtaBtns}>
          <a
            href={registerHref}
            className={styles.rBtnP}
            onClick={() => {
              try {
                sessionStorage.setItem(
                  "pendingAssessment",
                  JSON.stringify({ scores, overallScore: overall })
                );
              } catch {
                // sessionStorage unavailable — proceed without saving
              }
            }}
          >
            Save results + book a call →
          </a>
          <button type="button" className={styles.rBtnO} onClick={onRestart}>
            Retake Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
