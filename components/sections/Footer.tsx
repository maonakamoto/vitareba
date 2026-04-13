import { COMPANY } from "@/lib/config/company";

export default function Footer() {
  return (
    <footer>
      <div className="foot-logo">
        Vita<span>Re</span>Ba · Surf Your Life
      </div>
      <div className="foot-legal">
        © {COMPANY.foundingYear} {COMPANY.name} · All psychedelic therapies
        within Swiss regulatory frameworks
      </div>
    </footer>
  );
}
