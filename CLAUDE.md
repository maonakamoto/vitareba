@~/.claude/CLAUDE.md

# VitaReBa — Project Standards

**What this is:** Marketing and intake website for VitaReBa GmbH — a metabolic psychiatry & systemic longevity clinic in Zürich, founded by Manuel (also founder of Surf Your Life). Flagship programme is ADHD diagnosis and optimisation for high performers. The site's primary conversion goal is getting visitors to take the Inflection Edge self-assessment.

**Stack:** Next.js (App Router) · TypeScript strict · Tailwind v4 · Vercel · No database (static marketing site)

---

## Architecture

```
app/
  page.tsx              → Landing page (client component — holds assessmentOpen state)
  layout.tsx            → Root layout: fonts, metadata, OG/Twitter/JSON-LD
  globals.css           → Design tokens (:root vars), base resets, shared utilities only
  opengraph-image.tsx   → Dynamic OG image (edge runtime, ImageResponse)
  sitemap.ts            → Sitemap route

components/
  Logo.tsx              → Brand logo (presentational — wrap in <a> at call site if clickable)
  sections/             → One file per page section, each with co-located .module.css
    Nav.tsx             → Fixed nav with CTA button (hidden on mobile via CSS)
    Hero.tsx            → Two-panel hero: clinical left, coaching right
    ImpactStats.tsx     → Stat row (STATS config array)
    Pillars.tsx         → 3-pillar grid (PILLARS config array)
    Approach.tsx        → Sticky-scroll approach steps (ITEMS config array)
    Pathway.tsx         → Patient pathway steps (STEPS config array)
    Diagnostics.tsx     → Diagnostic tools overview (DIAGNOSTIC_CATEGORIES config array)
    SylClock.tsx        → SYL Clock 4-dimension framework (SYL_DIMENSIONS config array)
    PsychedelicReadiness.tsx → Psychedelic therapy section (PHASES config array)
    Addiction.tsx       → Addiction/dependency care section (CARDS config array)
    Programs.tsx        → 3-tier pricing cards (PROGRAMS config array)
    Team.tsx            → Team bios (TEAM config array)
    Cta.tsx             → Bottom CTA driving assessment open
    Footer.tsx          → Links, address, copyright
  Assessment/
    index.tsx           → Overlay controller: intro → question → results flow
    ResultsScreen.tsx   → Results display (scores, dimension interpretations, CTA)
    Assessment.module.css → All overlay CSS

lib/
  assessment/
    data.ts             → SSOT: QUESTIONS, DIMENSIONS, INTERPRETATIONS, VERDICT_TIERS, scoreColor()
  config/
    company.ts          → SSOT: company name, email, address, foundingYear
```

---

## Principles — Applied to This Codebase

### SSOT — Where Each Thing Lives

This is a static marketing site. There is no database. The SSOTs are:

| What | Where | Never in |
|------|-------|----------|
| Design tokens (colors, spacing) | `app/globals.css` `:root` | Hardcoded hex values anywhere |
| Shared utility CSS (eyebrow, sec-title, etc.) | `app/globals.css` | Duplicated across modules |
| Component-specific CSS | Co-located `.module.css` file | `globals.css` or `style={}` props |
| Company info (name, email, address) | `lib/config/company.ts` | Hardcoded in any component |
| Assessment content (questions, scoring) | `lib/assessment/data.ts` | Any component |
| Section content (team bios, programs, stats) | Config array at top of each section file | Scattered inline in JSX |
| Assessment open/close state | `app/page.tsx` | Any section component |

**The 2-file test:** Adding a new team member should touch exactly 1 file (`Team.tsx`). Changing the company email should touch 1 file (`company.ts`). If it takes more, the architecture is wrong.

### DRY

**CSS classes are the shared language.** If two components need the same visual treatment, define a shared CSS class in `globals.css` — don't copy the declarations.

**Config arrays, not inline JSX repetition.** Every section with repeated items has a typed const array at the file top:
```typescript
// RIGHT — Programs.tsx
const PROGRAMS = [
  { name: "Edge Diagnostic", price: "CHF 2,400", ... },
  { name: "Riding the Wave", price: "CHF 8,500", ... },
] as const;

// WRONG
<div>Edge Diagnostic · CHF 2,400</div>
<div>Riding the Wave · CHF 8,500</div>
```

**Shared utilities:** `scoreColor()` is defined once in `lib/assessment/data.ts` and imported by `Assessment/index.tsx`. Never duplicate color logic.

### SoC — Each Layer's Job

| Layer | Job | Not its job |
|-------|-----|-------------|
| `globals.css` | Visual rules, design tokens, responsive breakpoints | Content, data |
| `lib/assessment/data.ts` | Assessment questions, scoring, interpretations | Rendering, state |
| `lib/config/company.ts` | Company metadata | Formatting, rendering |
| Section components (`components/sections/`) | Render one section of the page | Business logic, state |
| `Assessment/index.tsx` | Assessment overlay flow (intro → questions → results) | Section content |
| `app/page.tsx` | Compose sections, hold assessment open/close state | Render content |

**Section components must not:**
- Import from other section components
- Hold global state
- Know about the assessment internals (they just call `onAssessmentOpen()`)

**Page size limits:**
- Section components: ≤ 200 lines. If over, extract a sub-component.
- `Assessment/index.tsx` + `ResultsScreen.tsx`: combined ~300 lines across 2 files. Keep each under 200 lines.
- `globals.css`: no hard limit, but each section's CSS should be clearly labeled with a `/* ─── SECTION NAME ─ */` comment.

### YAGNI — What Doesn't Exist Yet (Don't Add Prematurely)

This is a **static marketing site.** The following do not exist and should not be built until explicitly required:

- Contact / booking form backend (emails go to `mailto:` links for now)
- CMS or any database
- User authentication
- Blog / content management
- Analytics beyond Vercel's built-in
- Newsletter subscription
- A/B testing

Do not add loading states, error boundaries, or fallback UI for content that is statically defined. If it's in the code, it renders. No async = no loading states needed.

### KISS

- Assessment state is a plain `Record<string, number>` object (`answers`). Not a reducer, not a context, not Zustand.
- The overlay renders as `null` when closed — no portal, no transition library, no animation framework.
- Responsive design is two breakpoints max: base (mobile) and `min-width: 768px` (desktop). Never add a third breakpoint without justification.
- `useMemo` for computed values (`dimScores`, `overallScore`). `useState` for UI state. That's it.

---

## Design System

All values live in `globals.css`. Reference this table — never invent new values.

### Color Tokens

| Token | Hex | Used for |
|-------|-----|----------|
| `--ink` | `#1a1a22` | Primary text, dark backgrounds |
| `--ink2` | `#3a3a4a` | Secondary dark text |
| `--muted` | `#888a96` | Nav links, captions, metadata |
| `--faint` | `#c4c0b8` | Decorative lines, faint text |
| `--teal` | `#2a7a8a` | Primary accent: CTAs, links, active states |
| `--teal-dark` | `#1e6672` | Teal hover state |
| `--gold` | `#b8960a` | Secondary accent: highlights, decorative |
| `--off` | `#f8f7f4` | Off-white section backgrounds |
| `--light` | `#f1ede7` | Light section backgrounds |
| `--border` | `#e5e0d8` | Borders, dividers |
| `--warn` | `#d4820a` | Assessment medium score |
| `--danger` | `#e05a5a` | Assessment low score, errors |

### Typography

| Use | Font | Weight | Class / Note |
|-----|------|--------|------|
| Section titles | Cormorant Garamond | 300 | `.sec-title` — use `<em>` for italics |
| Eyebrow labels | DM Sans | 400 | `.eyebrow` — uppercase, tracked |
| Body text | DM Sans | 300 | default body |
| Prices, stats | Cormorant Garamond | 300 | `.prog-price`, `.stat-value` |
| Buttons | DM Sans | 400 | letter-spacing: 0.08em |

**Rule:** Cormorant = emotional weight (headings, prices, quotes). DM Sans = clarity (labels, body, buttons). Never swap them.

### Spacing Scale

| Token | Value | Used for |
|-------|-------|---------|
| `--section-pad-y` | `6rem` (desktop) | Section vertical padding |
| `--section-pad-x` | `3rem` (desktop) | Section horizontal padding |
| Mobile section padding | `4rem 1.5rem` | Base (no variable) |

### Key CSS Classes

| Class | Purpose |
|-------|---------|
| `.section-inner` | Max-width container (1100px, centered) |
| `.sec-title` | Large serif section heading |
| `.eyebrow` | Small uppercase label above headings |
| `.hr-rule` | Light border divider between sections |
| `.hr-dark` | Dark border divider (before Programs) |
| `.btn-dark` | Dark filled CTA button |
| `.btn-outline` | Outlined CTA button |
| `.prog` / `.prog.featured` | Pricing card (normal / highlighted) |
| `.ov-*` | Assessment overlay elements |
| `.q-*` | Assessment question elements |
| `.r-*` | Assessment results elements |

### Responsive Strategy

**Mobile-first.** Base styles = mobile (single column, reduced padding). `@media (min-width: 768px)` = desktop (multi-column grids, larger type, more padding).

```css
/* Base = mobile */
.hero {
  display: grid;
  grid-template-columns: 1fr; /* single column on mobile */
}

/* Desktop override */
@media (min-width: 768px) {
  .hero {
    grid-template-columns: 1fr 1fr;
  }
}
```

**The only other media query** is `@media (max-width: 767px)` for hiding elements that should not appear on mobile (e.g., `.nav-btn`). Never use `(max-width: 768px)` — off-by-one causes both rules to fire at exactly 768px.

### Accessibility Minimums

- Touch targets: `min-height: 2.75rem` (44px equivalent) on all interactive elements
- All `<a>` used as buttons: `display: block; text-align: center; text-decoration: none`
- Nav logo: plain text — no image, no alt needed
- Focus states: browser default is acceptable for now; do not remove them

---

## Assessment — How It Works

The Inflection Edge assessment is the page's primary conversion mechanism.

**Data flow:**
```
lib/assessment/data.ts
  DIMENSIONS (5)         → rendered as result dimension cards
  QUESTIONS (30)         → 6 questions per dimension
  VERDICT_TIERS          → overall score interpretation (3 tiers)
  INTERPRETATIONS        → per-dimension interpretation text (3 tiers each)
  scoreColor(score)      → returns CSS var string for score colouring

Assessment/index.tsx
  answers: Record<string, number>    → { [questionId]: 1–5 }
  screen: "intro" | "q" | "results"  → overlay flow state
  dimScores (useMemo)    → { [dimensionId]: 0–100 }
  overallScore (useMemo) → 0–100
```

**Scoring:** Each question answered 1–5. Per dimension: `(sum / maxPossible) * 100`. Overall: mean of dimension scores.

**To add a question:** Edit only `lib/assessment/data.ts`. Nothing else changes.
**To change interpretations:** Edit only `lib/assessment/data.ts`. Nothing else changes.
**To change the overlay design:** Edit `Assessment/index.tsx` + `Assessment/Assessment.module.css`.

---

## Adding Content

### New section content (team member, program, stat)
Edit the config array at the top of the relevant section file. One file touched.

### New section
1. Create `components/sections/YourSection.tsx` with a typed config array
2. Import and add to `app/page.tsx` between existing sections
3. Add CSS classes to `globals.css` under a clearly labelled comment block
4. One `<hr className="hr-rule" />` between each section (use `hr-dark` only before Programs)

### New design token
Add it to `:root {}` in `globals.css` before using it anywhere. Never use a raw value more than once.

---

## Connection to Surf Your Life

VitaReBa and Surf Your Life are **separate brands** sharing the same founder and philosophy.

| | VitaReBa | Surf Your Life |
|---|---|---|
| Domain | Clinical / medical | Coaching / transformation |
| Audience | ADHD high performers, longevity patients | Burnout recovery, general wellbeing |
| Contact | `manuel@surfyourlife.org` | Same founder |
| Framework | SYL Clock (Health, Mindset, Relations, Career) | Same framework |

**Do not** merge these codebases. **Do not** share components across repos. They share branding philosophy, not code.

---

## Deployment

- **GitHub:** `g-but/vitareba`
- **Vercel:** auto-deploy from `main` → `vitareba.vercel.app`
- **Domain:** TBD (`vitareba.ch` / `vitareba.com`)
- **Preview URLs:** every PR gets a Vercel preview automatically

Never commit `.env.local`. There are currently no secrets (static site), but keep the habit.

---

## Commands

```bash
pnpm dev        # local dev server (localhost:3000)
pnpm build      # production build (run before pushing)
pnpm lint       # eslint
```

**Before every push:** run `pnpm build` locally. The build must pass — never rely on Vercel to catch TypeScript or import errors.

---

## Red Flags — Stop and Rethink If You See

- Adding a color hex directly in a component (`color: #2a7a8a`) → use `var(--teal)`
- Writing the same JSX structure more than twice → extract a component or config array
- Putting assessment content in `Assessment/index.tsx` → belongs in `lib/assessment/data.ts`
- Using `useEffect` to compute a derived value → use `useMemo`
- Adding a `max-width: 768px` query → use `max-width: 767px` (or rethink: is mobile-first better?)
- A section component importing from another section component → never, they're siblings
- Hardcoding `manuel@surfyourlife.org` in a component → import from `lib/config/company.ts`
- A component over 200 lines → extract a sub-component
