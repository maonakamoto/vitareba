"use client";

interface HeroProps {
  onAssessmentOpen: () => void;
}

export default function Hero({ onAssessmentOpen }: HeroProps) {
  return (
    <div className="hero">
      <div className="hero-l">
        <div className="hero-eyebrow">
          Zürich · 8008 · International Patients Welcome
        </div>
        <div className="hero-title">
          Metabolic
          <br />
          Psychiatry &<br />
          <em>Systemic Longevity.</em>
        </div>
        <p className="hero-sub">
          We go beyond diagnosis. We decode the biology behind your mind — and
          the environment around it — to design a personalised path to sustained
          high performance, longevity and wellbeing.
        </p>
        <div className="spec-pills">
          {[
            "ADHD",
            "Longevity",
            "Addiction",
            "Burnout",
            "High Performance",
            "Psychedelic Therapy",
          ].map((pill) => (
            <span key={pill} className="spec-pill">
              {pill}
            </span>
          ))}
        </div>
      </div>

      <div className="hero-r">
        <div className="hero-r-eyebrow">Our Flagship Programme</div>
        <div className="hero-r-title">
          ADHD & the
          <br />
          <em>High-Performing Mind</em>
        </div>
        <p className="hero-r-sub">
          A world-first integrated programme combining formal ADHD diagnostics,
          metabolic medicine, longevity technologies, psychedelic-state
          therapies and personalised Surf Your Life performance coaching.
        </p>
        <div className="quote-bar">
          &ldquo;The ADHD brain is not a broken lake that needs calming. It is a
          powerful ocean — and you were never taught to surf it.&rdquo;
        </div>
        <div className="hero-btns">
          <button className="btn-dark" onClick={onAssessmentOpen}>
            Take the Inflection Edge →
          </button>
          <a
            href="mailto:manuel@surfyourlife.org"
            className="btn-outline"
          >
            Book Consultation
          </a>
        </div>
      </div>
    </div>
  );
}
