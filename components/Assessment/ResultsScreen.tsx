import {
  DIMENSIONS,
  VERDICT_TIERS,
  INTERPRETATIONS,
  scoreColor,
  type DimensionId,
} from "@/lib/assessment/data";
import { COMPANY } from "@/lib/config/company";
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
  const verdict =
    VERDICT_TIERS.find((t) => overall >= t.minScore && overall <= t.maxScore) ??
    VERDICT_TIERS[VERDICT_TIERS.length - 1];

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
          const bands = INTERPRETATIONS[dim.id];
          const interp =
            bands.find((i) => score <= i.maxScore) ??
            bands[bands.length - 1];
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
              <div className={styles.rDimText}>{interp.text}</div>
            </div>
          );
        })}
      </div>

      <div className={styles.rCta}>
        <div className={styles.rCtaTitle}>Ready to go deeper?</div>
        <div className={styles.rCtaSub}>
          Your Inflection Edge results are the starting point. The full
          diagnostic picture awaits.
        </div>
        <div className={styles.rCtaBtns}>
          <a href={`mailto:${COMPANY.email}`} className={styles.rBtnP}>
            Book a Discovery Call
          </a>
          <button className={styles.rBtnO} onClick={onRestart}>
            Retake Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
