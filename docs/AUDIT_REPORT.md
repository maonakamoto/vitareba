# Codebase Audit Report

**Date**: 2026-04-13  
**Auditor**: Claude Code  
**Branch**: main  
**Commit**: cf80f2b

---

## Executive Summary

The vitareba codebase is in excellent shape. A comprehensive five-phase audit found no critical bugs, no security issues, and no architectural violations. The CSS modules refactor and accessibility/SEO improvements from the prior session have landed cleanly — TypeScript strict mode passes, lint is clean, and the assessment scoring logic is mathematically correct.

Three minor issues remain: CSS opacity values are expressed as raw `rgba()` rather than design tokens (SSOT violation), one string is hardcoded in the Assessment overlay instead of imported from config, and the sitemap uses a hardcoded URL string. None block shipping.

The site is production-ready.

---

## Health Score

| Area | Score | Notes |
|------|-------|-------|
| First Principles | 9/10 | One SSOT violation (rgba opacity tokens) |
| Best Practices | 9/10 | One hardcoded string; `index.tsx` at 278 lines |
| Mission Alignment | 10/10 | Three CTA entry points, all anchors wired, SEO complete |
| Functional Correctness | 10/10 | Scoring logic verified, state threading clean |
| UI/UX & Responsive | 10/10 | Mobile-first throughout, a11y complete in overlay |
| **Overall** | **9.6/10** | Production-ready, three minor cleanup items |

---

## Phase 1: First Principles

### SSOT

**PASS** — Company info (name, email, address, foundingYear) is centralized in `lib/config/company.ts` and imported everywhere it appears. No hardcoded company strings in components.

Assessment content (questions, dimensions, interpretations, scoring) lives entirely in `lib/assessment/data.ts`. Section config arrays (STATS, PILLARS, PROGRAMS, TEAM, etc.) are at the top of each section file. Design tokens are in `globals.css :root`.

**MINOR VIOLATION** — CSS opacity variants are expressed as raw `rgba()` throughout module files rather than CSS custom properties:

| File | Value | Should be |
|------|-------|-----------|
| `app/globals.css:76` | `rgba(255, 255, 255, 0.35)` | `--white-35` or similar |
| `app/globals.css:80` | `rgba(184, 150, 10, 0.7)` | `var(--gold)` at 70% |
| `app/globals.css:112` | `rgba(255, 255, 255, 0.05)` | `--white-05` |
| `components/sections/Hero.module.css:23` | `rgba(42, 122, 138, 0.2)` | `--teal` at 20% |
| `components/sections/Addiction.module.css:40` | `rgba(184, 150, 10, 0.7)` | duplicates globals value |
| `components/Assessment/Assessment.module.css:72` | `rgba(42, 122, 138, 0.6)` | `--teal` at 60% |

### Dead code

**PASS** — No unused exports, imports, or variables. Removed `clsx`, `lucide-react`, and `tailwind-merge` from package.json in the prior session.

### God components

**BORDERLINE** — `components/Assessment/index.tsx` is 278 lines, above the 200-line guideline in CLAUDE.md. The component is split correctly with `ResultsScreen.tsx` (107 lines) as a sibling, so combined complexity is ~385 lines across 2 files. Acceptable for now; watch if the overlay grows.

### Config arrays vs inline JSX

**PASS** — All sections with repeated items (NAV_LINKS, PILLARS, PROGRAMS, TEAM, STATS, ITEMS, STEPS, DIMENSIONS, etc.) use typed config arrays with `.map()` rendering. No inline repetition found.

---

## Phase 2: Best Practices

### TypeScript

**PASS** — `pnpm typecheck` exits clean. Strict mode enabled. No `any` types, no `@ts-ignore`.

### Lint

**PASS** — `pnpm lint` exits clean. Zero errors, zero warnings.

### Button safety

**PASS** — All `<button>` elements declare `type="button"`. Verified across Nav, Hero, Cta, Assessment, and ResultsScreen.

### Hardcoded strings

**MINOR** — `components/Assessment/index.tsx:164` hardcodes `"VitaReBa · ADHD Performance Instrument"` as the overlay eyebrow. All other company references use `COMPANY.*` from config.

### Semantic HTML

**PASS** — One `<h1>` in Hero (main page title), `<h2>` on all section titles. Assessment overlay uses `<div>` headings with explicit `id="assessment-title"` for ARIA (correct, as it's a dialog heading not a document heading).

### Inline styles

**PASS (by design)** — Four `style={{}}` instances in `ResultsScreen.tsx` (lines 44, 50, 73, 81) all use `scoreColor(score)` which returns a CSS var string (`var(--teal)`, `var(--warn)`, `var(--danger)`), and `width: \`${score}%\`` for the dynamic progress bar. These cannot be moved to static CSS; the pattern is correct.

### Mobile-first CSS

**PASS** — All module CSS files use base styles for mobile and `@media (min-width: 768px)` for desktop. No incorrect `max-width: 768px` queries found.

---

## Phase 3: Mission Alignment

### Assessment CTA prominence

**PASS** — The primary conversion action is present in three locations, all wired to `assessmentOpen` state in `app/page.tsx`:

1. **Nav** (`Nav.tsx:33`) — "Take the Inflection Edge" button; desktop-only (hidden on mobile via `max-width: 767px`)
2. **Hero** (`Hero.tsx:63`) — "Take the Inflection Edge →" button; always visible including mobile
3. **Bottom CTA** (`Cta.tsx:26`) — "Take the Inflection Edge →" just before footer; always visible

### Anchor links

**PASS** — All six nav links resolve to matching section `id` attributes:

| Nav href | Section id | Component |
|----------|-----------|-----------|
| `#pillars` | `id="pillars"` | Pillars.tsx |
| `#approach` | `id="approach"` | Approach.tsx |
| `#diagnostics` | `id="diagnostics"` | Diagnostics.tsx |
| `#longevity` | `id="longevity"` | SylClock.tsx |
| `#pricing` | `id="pricing"` | Programs.tsx |
| `#team` | `id="team"` | Team.tsx |

### Contact / booking

**PASS** — `mailto:` links present in Hero (Book Consultation), Cta (Book a Discovery Call), and ResultsScreen (Book a Discovery Call). All use `COMPANY.email` from config. Full address in Footer.

### SEO completeness

**PASS** — `app/layout.tsx` exports:

- `title`, `description`, `keywords` ✓
- `openGraph` (title, description, url, siteName, type, locale) ✓
- `twitter` (card: summary_large_image, title, description) ✓
- `robots` (index: true, follow: true) ✓
- `alternates.canonical` ✓
- `metadataBase` (resolves OG image URL) ✓
- JSON-LD MedicalBusiness schema (name, description, url, email, address, foundingDate, medicalSpecialty) ✓
- Dynamic OG image via `app/opengraph-image.tsx` (edge runtime, ImageResponse) ✓

### Sitemap and robots.txt

**PASS** — Both exist and are correctly formed.

**MINOR** — `app/sitemap.ts` hardcodes `https://vitareba.vercel.app` instead of reading from `NEXT_PUBLIC_SITE_URL`. Low impact for a static single-URL sitemap, but inconsistent with how `layout.tsx` handles it.

---

## Phase 4: Functional Correctness

### Assessment data

**PASS** — `lib/assessment/data.ts` contains:
- 30 QUESTIONS (6 per dimension, some reversed)
- 5 DIMENSIONS with icons and names
- INTERPRETATIONS with 3 bands per dimension (maxScore: 45, 70, 100)
- 4 VERDICT_TIERS (Deep Friction → Optimised Neurotype)
- `scoreColor()` returning CSS var strings based on score thresholds

### Scoring logic

**PASS** — Verified in `Assessment/index.tsx:68-98`:

- Reversed questions correctly flip score: `6 - raw` (maps 1→5, 5→1)
- Dimension score: `Math.round((totals[d.id] / (counts[d.id] * 5)) * 100)` — correct percentage formula
- No division-by-zero: guarded by `counts[d.id] > 0`
- Overall score: mean of 5 dimension scores

### Results screen

**PASS** — `ResultsScreen.tsx` renders: overall score, verdict tier name and text, 5 dimension cards with scores and progress bars, per-dimension interpretation text, restart button, and booking CTA.

### Conditional mounting

**PASS** — `app/page.tsx`: `{assessmentOpen && <Assessment onClose={...} />}`. Component only enters the DOM when the overlay is open; full teardown on close means no stale state.

### State threading

**PASS** — `onAssessmentOpen` flows correctly from `page.tsx` → `Nav`, `Hero`, `Cta`.

---

## Phase 5: UI/UX & Responsive Design

### Mobile-first

**PASS** — Base (mobile) styles: single-column grid, reduced padding. Desktop overrides via `@media (min-width: 768px)`. Verified in Nav, Hero, Programs, Pathway, Addiction, Assessment overlay.

### Touch targets

**PASS** — All interactive elements meet `min-height: 2.75rem` (44px equivalent) on mobile. Assessment answer buttons are 3rem × 3rem (48px). Verified across Nav, Hero, Programs, Cta, Assessment.

### Focus states

**PASS** — `Assessment.module.css` has `:focus-visible` rules on all interactive elements: `.ovClose`, `.ovStartBtn`, `.qBtn`, `.qPrev`, `.qNext`. Section buttons have hover states.

### Overlay accessibility

**PASS** — `Assessment/index.tsx` overlay has:
- `role="dialog"` and `aria-modal="true"`
- `aria-labelledby="assessment-title"` pointing to the intro heading
- `aria-label="Close assessment"` on the × button
- `aria-live="polite" aria-atomic="true"` on the progress indicator
- `aria-label` and `aria-pressed` on answer buttons
- Body scroll lock on mount, restored on unmount

### Images

**PASS** — No `<img>` tags. Logo is SVG; section icons are emoji/unicode. No alt text gaps.

### Footer mobile

**PASS** — `Footer.module.css` has `@media (max-width: 767px)` stacking columns with `flex-direction: column`.

### Nav mobile

**PASS (design choice)** — Nav links and CTA button are hidden on mobile (logo only). Hero and bottom CTA sections provide the primary mobile conversion path. No hamburger menu; acceptable for a single-page scroll site.

---

## Action Items

### P2 — Minor cleanup (non-blocking)

1. **Tokenize CSS opacity variants** (`globals.css`, 6 module files)  
   Add `--white-05`, `--white-10`, `--teal-20`, `--teal-60`, `--gold-70` to `:root` in `globals.css`. Replace all `rgba()` occurrences that reference design token colors. Improves SSOT consistency.

2. **Move hardcoded overlay eyebrow to config** (`Assessment/index.tsx:164`)  
   `"VitaReBa · ADHD Performance Instrument"` should be a constant. Either add to `lib/config/company.ts` or create `lib/config/assessment.ts` with assessment metadata.

3. **Sitemap SITE_URL** (`app/sitemap.ts`)  
   Replace hardcoded `https://vitareba.vercel.app` with `process.env.NEXT_PUBLIC_SITE_URL ?? "https://vitareba.vercel.app"` — consistent with how `layout.tsx` handles it.

### P3 — Watch list (no action now)

- `Assessment/index.tsx` at 278 lines — above the 200-line guideline. Monitor; extract intro or keyboard handler sub-component if it grows past 300.
- No mobile hamburger — acceptable now. Revisit if analytics show mobile users not reaching the assessment.
