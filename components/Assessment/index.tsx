"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  DIMENSIONS,
  QUESTIONS,
  type DimensionId,
} from "@/lib/assessment/data";
import { COMPANY } from "@/lib/config/company";
import ResultsScreen from "./ResultsScreen";
import styles from "./Assessment.module.css";

interface Props {
  onClose: () => void;
}

type Screen = "intro" | "question" | "results";

const emptyAnswers = () => Array<number | null>(QUESTIONS.length).fill(null);

export default function Assessment({ onClose }: Props) {
  const [screen, setScreen] = useState<Screen>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(emptyAnswers());

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const start = useCallback(() => {
    setCurrentQ(0);
    setAnswers(emptyAnswers());
    setScreen("question");
  }, []);

  const selectAnswer = useCallback(
    (value: number) => {
      setAnswers((prev) => {
        const next = [...prev];
        next[currentQ] = value;
        return next;
      });
    },
    [currentQ]
  );

  const goNext = useCallback(() => {
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ((q) => q + 1);
    } else {
      setScreen("results");
    }
  }, [currentQ]);

  const goPrev = useCallback(() => {
    if (currentQ > 0) setCurrentQ((q) => q - 1);
  }, [currentQ]);

  const restart = useCallback(() => {
    setScreen("intro");
    setCurrentQ(0);
    setAnswers(emptyAnswers());
  }, []);

  const dimScores = useMemo((): Record<DimensionId, number> => {
    const totals = {} as Record<DimensionId, number>;
    const counts = {} as Record<DimensionId, number>;

    DIMENSIONS.forEach((d) => {
      totals[d.id] = 0;
      counts[d.id] = 0;
    });

    QUESTIONS.forEach((q, i) => {
      const raw = answers[i];
      if (raw === null) return;
      const score = q.reversed ? 6 - raw : raw;
      totals[q.dimension] += score;
      counts[q.dimension] += 1;
    });

    const result = {} as Record<DimensionId, number>;
    DIMENSIONS.forEach((d) => {
      result[d.id] =
        counts[d.id] > 0
          ? Math.round((totals[d.id] / (counts[d.id] * 5)) * 100)
          : 0;
    });
    return result;
  }, [answers]);

  const overallScore = useMemo((): number => {
    const vals = Object.values(dimScores);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [dimScores]);

  const q = QUESTIONS[currentQ];
  const dim = DIMENSIONS.find((d) => d.id === q?.dimension);
  const answered = answers[currentQ];
  const progress = ((currentQ + 1) / QUESTIONS.length) * 100;
  const dimIndex = DIMENSIONS.findIndex((d) => d.id === q?.dimension);

  const handleAnswerKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setAnswers((prev) => {
          const next = [...prev];
          const cur = prev[currentQ];
          next[currentQ] = cur === null ? 1 : Math.min(5, cur + 1);
          return next;
        });
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setAnswers((prev) => {
          const next = [...prev];
          const cur = prev[currentQ];
          next[currentQ] = cur === null ? 5 : Math.max(1, cur - 1);
          return next;
        });
      } else if (e.key === "Enter" && answered !== null) {
        goNext();
      }
    },
    [currentQ, answered, goNext]
  );

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="assessment-title"
    >
      <div className={styles.ovPb}>
        <div
          className={styles.ovPbFill}
          style={{
            width:
              screen === "results"
                ? "100%"
                : screen === "question"
                ? `${progress}%`
                : "0%",
          }}
        />
      </div>
      <button
        type="button"
        className={styles.ovClose}
        onClick={onClose}
        aria-label="Close assessment"
      >
        ×
      </button>

      {/* INTRO */}
      {screen === "intro" && (
        <div className={`${styles.ovScreen} ${styles.active}`}>
          <div className={styles.ovEyebrow}>
            {COMPANY.shortName} · ADHD Performance Instrument
          </div>
          <div className={styles.ovH1} id="assessment-title">
            Inflection
            <br />
            <em>Edge</em>
          </div>
          <div className={styles.ovH2}>Your neurotype. Mapped precisely.</div>
          <p className={styles.ovSub}>
            30 questions · 5 dimensions · One precision performance blueprint
            mapping when your ADHD brain operates at its ceiling — and what is
            currently preventing it.
          </p>
          <div className={styles.ovStats}>
            <div>
              <div className={styles.ovStatN}>30</div>
              <div className={styles.ovStatL}>Questions</div>
            </div>
            <div>
              <div className={styles.ovStatN}>5</div>
              <div className={styles.ovStatL}>Dimensions</div>
            </div>
            <div>
              <div className={styles.ovStatN}>8 min</div>
              <div className={styles.ovStatL}>Duration</div>
            </div>
          </div>
          <div className={styles.ovDims}>
            {DIMENSIONS.map((d) => (
              <div key={d.id} className={styles.ovDim}>
                <div className={styles.ovDimIcon}>{d.icon}</div>
                <div className={styles.ovDimName}>{d.name}</div>
              </div>
            ))}
          </div>
          <button type="button" className={styles.ovStartBtn} onClick={start}>
            Begin Assessment
          </button>
          <p className={styles.ovDisc}>
            Grounded in peer-reviewed research. Not a clinical diagnostic tool.
          </p>
        </div>
      )}

      {/* QUESTION */}
      {screen === "question" && q && dim && (
        <div className={`${styles.ovScreen} ${styles.active}`}>
          <div className={styles.qDimLabel}>
            {dim.icon} {dim.name}
          </div>
          <div
            className={styles.qProg}
            aria-live="polite"
            aria-atomic="true"
          >
            {currentQ + 1} / {QUESTIONS.length} · Dimension {dimIndex + 1} of{" "}
            {DIMENSIONS.length}
          </div>
          <div className={styles.qTrack}>
            <div
              className={styles.qTrackFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className={styles.qText}>{q.text}</div>
          <div className={styles.qBtns} onKeyDown={handleAnswerKey}>
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                className={`${styles.qBtn}${answered === v ? ` ${styles.selected}` : ""}`}
                onClick={() => selectAnswer(v)}
                aria-label={`Rate ${v} out of 5`}
                aria-pressed={answered === v}
              >
                {v}
              </button>
            ))}
          </div>
          <div className={styles.qScale}>
            <span>Strongly disagree</span>
            <span>Strongly agree</span>
          </div>
          <div className={styles.qNav}>
            <button
              type="button"
              className={styles.qPrev}
              onClick={goPrev}
              disabled={currentQ === 0}
            >
              ← Back
            </button>
            <button
              type="button"
              className={`${styles.qNext}${answered !== null ? ` ${styles.enabled}` : ""}`}
              onClick={goNext}
              disabled={answered === null}
            >
              {currentQ === QUESTIONS.length - 1 ? "See Results →" : "Next →"}
            </button>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {screen === "results" && (
        <ResultsScreen
          scores={dimScores}
          overall={overallScore}
          onRestart={restart}
        />
      )}
    </div>
  );
}
