"use client";

const NAV_LINKS = [
  { href: "#pillars", label: "Programmes" },
  { href: "#approach", label: "Approach" },
  { href: "#diagnostics", label: "Diagnostics" },
  { href: "#longevity", label: "Longevity" },
  { href: "#pricing", label: "Pricing" },
  { href: "#team", label: "Team" },
] as const;

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
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </div>
      <button className="nav-btn" onClick={onAssessmentOpen}>
        Take the Inflection Edge
      </button>
    </nav>
  );
}
