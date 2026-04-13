@~/.claude/CLAUDE.md

# VitaReBa — Project Standards

**What this is:** Marketing and booking website for VitaReBa GmbH, a metabolic psychiatry & systemic longevity clinic in Zürich run by Manu (founder of Surf Your Life). Flagship programme is ADHD for high performers. Connected to surf-your-life.org — shares the SYL Clock methodology and Manu as founder.

**Stack:** Next.js (App Router) · TypeScript strict · Tailwind v4 · Vercel

---

## Architecture

```
app/
  page.tsx           → Landing page (client component — controls assessment state)
  layout.tsx         → Root layout: fonts (Cormorant Garamond + DM Sans), metadata
  globals.css        → SSOT for ALL design tokens and component styles

components/
  sections/          → One file per page section (Nav, Hero, ImpactStats, ...)
  Assessment.tsx     → Interactive Inflection Edge assessment overlay

lib/
  assessment/
    data.ts          → SSOT for questions, dimensions, interpretations, verdict tiers
```

### Design Tokens — SSOT in globals.css

All colors, fonts, and component CSS live in `app/globals.css`. Never inline design values in components — use CSS classes defined there.

```css
--ink: #1a1a22      /* dark background & text */
--teal: #2a7a8a     /* primary accent */
--gold: #b8960a     /* secondary accent */
--off: #f8f7f4      /* off-white sections */
--border: #e5e0d8   /* borders */
--muted: #888a96    /* secondary text */
```

**Fonts:**
- `--font-cormorant` / `Cormorant Garamond` (serif) — headings, quotes, prices
- `--font-dm-sans` / `DM Sans` (sans-serif) — body, labels, buttons

---

## Principles — How They Apply Here

### SSOT

- `lib/assessment/data.ts` is the SSOT for all assessment content (questions, dimensions, scoring, interpretations). Never hardcode assessment data in components.
- `app/globals.css` is the SSOT for all design tokens and CSS. Never duplicate color/spacing values.
- Config arrays (PILLARS, TEAM, PROGRAMS, etc.) live at the top of their section component — not scattered inline in JSX.

### SoC

Each section component has ONE job: render its section. No business logic in sections.

Assessment state lives in `app/page.tsx` (top-level client component) and is passed down as props. Assessment scoring logic lives in `Assessment.tsx`, not in sections.

### Adding content

To add/edit section content (team members, programmes, stats):
- Edit the data array at the top of the relevant section component
- Adding a new field should require 1–2 files max — if it requires 5+, the architecture is wrong

### Adding sections

1. Create `components/sections/YourSection.tsx`
2. Import and place in `app/page.tsx`
3. Add CSS classes to `app/globals.css`

---

## Design

**Aesthetic:** Editorial luxury — dark ink backgrounds with off-white and teal accents. Cormorant Garamond for emotional weight, DM Sans for clarity. White space creates gravitas.

**Responsive breakpoint:** 768px. All sections stack to single column. Nav links hide on mobile.

**Key UX pattern:** Assessment overlay (Inflection Edge) is the primary CTA throughout the page. It's triggered from Nav, Hero, and bottom CTA section.

---

## Connection to Surf Your Life

VitaReBa and Surf Your Life share:
- Manu (Manuel) as founder
- The SYL Clock framework (4 dimensions: Health, Mindset, Relationships, Career)
- The "Surf Your Life" coaching layer (90-day programme, Home Harmony)
- Email: `manuel@surfyourlife.org`
- Philosophy: ADHD as a performance system, not a deficit

They are separate brands/sites. VitaReBa is the clinical/medical offering; Surf Your Life is the coaching platform.

---

## Deployment

- GitHub: `g-but/vitareba`
- Vercel: auto-deploy from main branch
- Domain: TBD (vitareba.ch / vitareba.com)

## Commands

```bash
pnpm dev          # local dev server
pnpm build        # production build
pnpm lint         # eslint
```
