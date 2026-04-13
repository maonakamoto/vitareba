"use client";

interface CtaProps {
  onAssessmentOpen: () => void;
}

export default function Cta({ onAssessmentOpen }: CtaProps) {
  return (
    <div className="cta-section">
      <div className="cta-eyebrow">Begin Here</div>
      <div className="cta-title">
        Your ocean.
        <br />
        <em>Precisely mapped.</em>
      </div>
      <p className="cta-sub">
        Start with the Inflection Edge — our free ADHD performance assessment.
        In 8 minutes you will have the most precise picture of your neurotype
        you have ever seen. Your results are your Epoch — the beginning of a
        new chapter.
      </p>
      <div className="cta-btns">
        <button className="cta-btn-primary" onClick={onAssessmentOpen}>
          Take the Inflection Edge →
        </button>
        <a
          href="mailto:manuel@surfyourlife.org"
          className="cta-btn-outline"
        >
          Book a Discovery Call
        </a>
      </div>
      <p className="cta-note">
        VitaReBa GmbH · Zollikerstrasse 183 · 8008 Zürich ·
        manuel@surfyourlife.org
      </p>
    </div>
  );
}
