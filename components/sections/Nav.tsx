"use client";

interface NavProps {
  onAssessmentOpen: () => void;
}

export default function Nav({ onAssessmentOpen }: NavProps) {
  return (
    <nav className="vitareba-nav">
      <div className="logo">
        Vita<span>Re</span>Ba
      </div>
      <div className="nav-links">
        {[
          ["#pillars", "Programmes"],
          ["#approach", "Approach"],
          ["#diagnostics", "Diagnostics"],
          ["#longevity", "Longevity"],
          ["#pricing", "Pricing"],
          ["#team", "Team"],
        ].map(([href, label]) => (
          <a key={href} href={href}>
            {label}
          </a>
        ))}
      </div>
      <button className="nav-btn" onClick={onAssessmentOpen}>
        Take the Inflection Edge
      </button>
    </nav>
  );
}
