"use client";

import { useState, useCallback } from "react";
import {
  DIMENSIONS,
  QUESTIONS,
  INTERPRETATIONS,
  VERDICT_TIERS,
  type DimensionId,
} from "@/lib/assessment/data";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Screen = "intro" | "question" | "results";

export default function Assessment({ isOpen, onClose }: Props) {
  const [screen, setScreen] = useState<Screen>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(QUESTIONS.length).fill(null)
  );

  const start = useCallback(() => {
    setCurrentQ(0);
    setAnswers(Array(QUESTIONS.length).fill(null));
    setScreen("question");
  }, []);

  const selectAnswer = useCallback((value: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentQ] = value;
      return next;
    });
  }, [currentQ]);

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
    setAnswers(Array(QUESTIONS.length).fill(null));
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    // Reset after animation
    setTimeout(() => setScreen("intro"), 300);
  }, [onClose]);

  // Score computation
  const dimScores = useCallback((): Record<DimensionId, number> => {
    const totals: Record<string, number> = {};
    const counts: Record<string, number> = {};

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

    const result: Record<string, number> = {};
    DIMENSIONS.forEach((d) => {
      result[d.id] =
        counts[d.id] > 0
          ? Math.round((totals[d.id] / (counts[d.id] * 5)) * 100)
          : 0;
    });
    return result as Record<DimensionId, number>;
  }, [answers]);

  const overallScore = useCallback((): number => {
    const scores = dimScores();
    const vals = Object.values(scores);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [dimScores]);

  const q = QUESTIONS[currentQ];
  const dim = DIMENSIONS.find((d) => d.id === q?.dimension);
  const answered = answers[currentQ];
  const progress = ((currentQ + 1) / QUESTIONS.length) * 100;
  const dimIndex = DIMENSIONS.findIndex((d) => d.id === q?.dimension);

  if (!isOpen) return null;

  return (
    <div className={`overlay${isOpen ? " open" : ""}`}>
      <div className="ov-pb">
        <div
          className="ov-pb-fill"
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
      <button className="ov-close" onClick={handleClose}>
        ×
      </button>

      {/* INTRO */}
      {screen === "intro" && (
        <div className="ov-screen active">
          <div className="ov-eyebrow">VitaReBa · ADHD Performance Instrument</div>
          <div className="ov-h1">
            Inflection
            <br />
            <em>Edge</em>
          </div>
          <div className="ov-h2">Your neurotype. Mapped precisely.</div>
          <p className="ov-sub">
            30 questions · 5 dimensions · One precision performance blueprint
            mapping when your ADHD brain operates at its ceiling — and what is
            currently preventing it.
          </p>
          <div className="ov-stats">
            <div>
              <div className="ov-stat-n">30</div>
              <div className="ov-stat-l">Questions</div>
            </div>
            <div>
              <div className="ov-stat-n">5</div>
              <div className="ov-stat-l">Dimensions</div>
            </div>
            <div>
              <div className="ov-stat-n">8 min</div>
              <div className="ov-stat-l">Duration</div>
            </div>
          </div>
          <div className="ov-dims">
            {DIMENSIONS.map((d) => (
              <div key={d.id} className="ov-dim">
                <div className="ov-dim-icon">{d.icon}</div>
                <div className="ov-dim-name">{d.name}</div>
              </div>
            ))}
          </div>
          <button className="ov-start-btn" onClick={start}>
            Begin Assessment
          </button>
          <p className="ov-disc">
            Grounded in peer-reviewed research. Not a clinical diagnostic tool.
          </p>
        </div>
      )}

      {/* QUESTION */}
      {screen === "question" && q && dim && (
        <div className="ov-screen active">
          <div className="q-dim-label">
            {dim.icon} {dim.name}
          </div>
          <div className="q-prog">
            {currentQ + 1} / {QUESTIONS.length} · Dimension {dimIndex + 1} of{" "}
            {DIMENSIONS.length}
          </div>
          <div className="q-track">
            <div className="q-track-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="q-text">{q.text}</div>
          <div className="q-btns">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                className={`q-btn${answered === v ? " selected" : ""}`}
                onClick={() => selectAnswer(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="q-scale">
            <span>Strongly disagree</span>
            <span>Strongly agree</span>
          </div>
          <div className="q-nav">
            <button className="q-prev" onClick={goPrev} disabled={currentQ === 0}>
              ← Back
            </button>
            <button
              className={`q-next${answered !== null ? " enabled" : ""}`}
              onClick={answered !== null ? goNext : undefined}
            >
              {currentQ === QUESTIONS.length - 1 ? "See Results →" : "Next →"}
            </button>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {screen === "results" && <ResultsScreen scores={dimScores()} overall={overallScore()} onRestart={restart} />}
    </div>
  );
}

function ResultsScreen({
  scores,
  overall,
  onRestart,
}: {
  scores: Record<DimensionId, number>;
  overall: number;
  onRestart: () => void;
}) {
  const verdict = VERDICT_TIERS.find(
    (t) => overall >= t.minScore && overall <= t.maxScore
  ) ?? VERDICT_TIERS[VERDICT_TIERS.length - 1];

  return (
    <div className="ov-screen active">
      <div className="v-card">
        <div className="v-score">
          {overall}
          <span>/100</span>
        </div>
        <div className="v-name">{verdict.name}</div>
        <p className="v-text">{verdict.text}</p>
      </div>

      <div className="r-scores">
        {DIMENSIONS.map((dim) => {
          const score = scores[dim.id as DimensionId];
          return (
            <div key={dim.id} className="r-score-card">
              <div className="r-sc-icon">{dim.icon}</div>
              <div className="r-sc-name">{dim.name}</div>
              <div
                className="r-sc-n"
                style={{ color: score >= 60 ? "#2a7a8a" : score >= 40 ? "#d4820a" : "#e05a5a" }}
              >
                {score}
              </div>
              <div className="r-sc-bar">
                <div
                  className="r-sc-fill"
                  style={{
                    width: `${score}%`,
                    background: score >= 60 ? "#2a7a8a" : score >= 40 ? "#d4820a" : "#e05a5a",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div>
        {DIMENSIONS.map((dim) => {
          const score = scores[dim.id as DimensionId];
          const interp = INTERPRETATIONS[dim.id as DimensionId].find(
            (i) => score < i.maxScore
          ) ?? INTERPRETATIONS[dim.id as DimensionId][INTERPRETATIONS[dim.id as DimensionId].length - 1];
          return (
            <div key={dim.id} className="r-dim">
              <div className="r-dim-top">
                <div className="r-dim-name">
                  {dim.icon} {dim.name}
                </div>
                <div
                  className="r-dim-score"
                  style={{
                    color: score >= 60 ? "#2a7a8a" : score >= 40 ? "#d4820a" : "#e05a5a",
                  }}
                >
                  {score}
                </div>
              </div>
              <div className="r-dim-bar">
                <div
                  className="r-dim-fill"
                  style={{
                    width: `${score}%`,
                    background: score >= 60 ? "#2a7a8a" : score >= 40 ? "#d4820a" : "#e05a5a",
                  }}
                />
              </div>
              <div className="r-dim-text">{interp.text}</div>
            </div>
          );
        })}
      </div>

      <div className="r-cta">
        <div className="r-cta-title">Ready to go deeper?</div>
        <div className="r-cta-sub">
          Your Inflection Edge results are the starting point. The full
          diagnostic picture awaits.
        </div>
        <div className="r-cta-btns">
          <a href="mailto:manuel@surfyourlife.org" className="r-btn-p">
            Book a Discovery Call
          </a>
          <button className="r-btn-o" onClick={onRestart}>
            Retake Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
