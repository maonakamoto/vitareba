@~/.claude/CLAUDE.md

# VitaReBa — Project Standards

**What this is:** Clinical patient management platform for VitaReBa GmbH — a metabolic psychiatry & systemic longevity clinic in Zürich, founded by Manuel (also founder of Surf Your Life). Flagship programme is ADHD diagnosis and optimisation for high performers.

The platform has two parts:
1. **Public marketing site** — multilingual (de/en/fr/it), lands at `/de/`, primary CTA is the Inflection Edge self-assessment overlay
2. **Patient portal + admin panel** — authenticated, database-backed, at `/dashboard` (patients) and `/admin` (Manuel)

**Stack:** Next.js 16 (App Router) · TypeScript strict · Tailwind v4 · Neon PostgreSQL · Drizzle ORM · NextAuth 5 · Resend email · Vercel (hosting + cron + blob storage)

---

## Mission

**Who:** Manuel Schabus, metabolic psychiatry clinician at VitaReBa Zürich, and his high-performer ADHD patients.
**Problem:** Patients need frictionless daily data collection so their biology is visible; Manuel needs instant clarity on which patients need attention — and the marketing site must let curious visitors experience the Inflection Edge *before* hitting an auth wall.
**Success:** Manuel opens the admin and knows — without calling anyone — exactly who needs attention today. Patients check in daily because the portal shows them it matters. Visitors complete the Inflection Edge without being asked to register first, then convert because the results made them want to.

---

## Architecture

```
proxy.ts                  → Auth guard (portal/admin) + locale routing (marketing) [Next.js middleware]

app/
  (auth)/                 → Non-localized auth pages (/login, /register, etc.) — portal users
  [locale]/(auth)/        → Localized auth pages (/de/login, etc.) — marketing site visitors
  (portal)/               → Patient-facing authenticated area
    dashboard/            → Patient home: assessment results, goals, check-in prompt, booking
    assessment/           → Take the Inflection Edge questionnaire
    assessments/          → History + trend chart
    checkin/              → Daily wellness check-in (sleep, energy, mood, focus, stress)
    bookings/             → Consultation booking (Calendly + manual)
    messages/[threadId]/  → Secure async messaging with Manuel
    profile/              → Patient profile management
    layout.tsx            → Portal shell with PortalNav
  (admin)/admin/          → Manuel-facing authenticated area
    patients/             → Patient list with signal badges
    patients/[id]/        → Full patient view (tabs: profile, assessments, goals, notes, docs)
    bookings/             → All bookings across patients
    messages/             → All message threads
    reports/              → Live metrics: signal distribution, assessment tiers, programmes
    layout.tsx            → Admin shell
  api/
    auth/                 → NextAuth handler + password reset
    account/              → Registration
    profile/              → Patient profile CRUD
    assessment/           → Save/fetch Inflection Edge results
    checkin/              → Daily check-in upsert/history
    bookings/             → Booking CRUD
    messages/[threadId]/  → Thread messages + email notification on send
    goals/                → Patient clinical goals (read)
    documents/            → Document list + upload (Vercel Blob)
    admin/patients/       → Patient list + detail (admin only)
    admin/patients/[id]/  → Goals, notes, programme assignment (admin only)
    cron/                 → Scheduled jobs (all require CRON_SECRET bearer)
      checkin-reminder    → Daily 07:00 — remind patients to check in
      checkin-dip-alert   → Daily 09:00 — alert admin on wellness dips
      signals             → Daily 02:00 — compute patient signals, alert on critical
      emails              → Daily 08:00 — process email queue
      weekly-digest       → Sunday 08:00 — weekly summary to patients
    webhooks/calendly/    → Calendly invitee.created / invitee.canceled → bookings table
  [locale]/               → Localized marketing site (de/en/fr/it)
  page.tsx                → Root redirect → /de/
  layout.tsx              → Root layout: fonts, metadata, SessionProvider
  manifest.ts             → PWA manifest (start_url: /dashboard)

components/
  sections/               → Public marketing page sections (14 files, each with .module.css)
  Assessment/             → Inflection Edge overlay (public, no auth required)
  portal/                 → Portal UI: PortalNav, UserDropdown, trend charts
  admin/                  → Admin UI: patient cards, forms, inline compose

lib/
  db/
    schema.ts             → SSOT: all Drizzle table definitions + relations
    index.ts              → Lazy Drizzle singleton (Neon serverless)
  auth/
    index.ts              → NextAuth config (Credentials + Google, DrizzleAdapter)
    guards.ts             → requireSession() / requireAdmin() for API routes
    edge.ts               → Edge-compatible auth for middleware
    types.ts              → Custom session/token types
  config/                 → All constants and labels (SSOT — never hardcode elsewhere)
    company.ts            → Name, email, address, PORTAL_URL, getAdminEmails()
    programmes.ts         → PROGRAMME_CONFIG, PHASE_CONFIG, enum values
    admin.ts              → Signal thresholds, signal labels/colors
    portal.ts             → CHECKIN_SCALE, CHECKIN_HISTORY_DAYS, profile completeness fields
    booking-status.ts     → Booking status labels and badge colors
    email-sequences.ts    → Email send-delay constants
    auth.ts               → BCRYPT_SALT_ROUNDS, token expiry
  domain/                 → Business logic (no HTTP, no rendering)
    signals.ts            → computePatientSignal() — pure, injectable, tested
    profile.ts            → computeProfileCompleteness()
    auth.ts               → Login/register Zod schemas
    email-queue.ts        → enqueueWelcomeSequence(), enqueueAssessmentSequence()
  email/
    index.ts              → sendEmail() via Resend
    templates.ts          → All HTML email template generators
  assessment/
    data.ts               → SSOT: QUESTIONS, DIMENSIONS, INTERPRETATIONS, VERDICT_TIERS, scoreColor()
  utils/
    format.ts             → formatDateShort(), formatDateLong()
  i18n/
    navigation.ts         → next-intl locale navigation helpers

i18n/routing.ts           → Locales: de (default), en, fr, it
messages/                 → Translation files: de.json, en.json, fr.json, it.json
```

---

## Database Schema (Drizzle + Neon PostgreSQL)

Tables: `users`, `accounts`, `sessions`, `verificationTokens` (NextAuth), `profiles`, `dailyCheckins` (unique on user_id+date), `assessmentResults`, `bookings`, `documents`, `threads`, `threadMessages` (with `readAt` for unread tracking), `patientNotes`, `programmeAssignments`, `clinicalGoals`, `emailQueue`

**Migrations:** `pnpm db:push` to apply schema changes to Neon. Run after any edits to `lib/db/schema.ts`.

---

## SSOT — Where Each Thing Lives

| What | Where | Never in |
|------|-------|----------|
| Design tokens (colors, spacing) | `app/globals.css` `:root` | Hardcoded hex anywhere |
| Shared utility CSS | `app/globals.css` | Duplicated across modules |
| Component-specific CSS | Co-located `.module.css` | `globals.css` or inline `style={{}}` |
| Company info (name, email, PORTAL_URL) | `lib/config/company.ts` | Hardcoded in components |
| Programme/phase labels | `lib/config/programmes.ts` | Any component |
| Signal thresholds + labels | `lib/config/admin.ts` | Any component |
| Assessment questions, scoring | `lib/assessment/data.ts` | Any component |
| DB schema | `lib/db/schema.ts` | Separate type files |
| Portal route paths | `lib/config/routes.ts` PORTAL_ROUTES | Hardcoded strings |
| Auth pages routing | `proxy.ts` (derives from PORTAL_ROUTES) | Scattered guards |

**The 2-file test:** Adding a team member = 1 file. Changing company email = 1 file. Adding a programme phase = 1 file. More than that → architecture is wrong.

---

## Middleware Routing Model

`proxy.ts` at the project root handles two distinct routing concerns (Next.js middleware):

```
/dashboard, /assessment, /assessments, /bookings, /checkin,
/messages, /profile, /admin, /api
  → PORTAL mode: auth-guard only, no locale routing
  → Unauthenticated → redirect to /login?returnTo=...
  → Non-admin hitting /admin → redirect to /dashboard

Everything else (/, /de/*, /en/*, etc.)
  → MARKETING mode: next-intl locale routing
  → Logged-in users on /de/login, /de/register, etc. → redirect to /dashboard or /admin/patients
```

**Adding a new portal route:** Add it to `PORTAL_ROUTES` in `lib/config/routes.ts` — the middleware derives `PORTAL_PREFIXES` from this automatically. No need to touch `proxy.ts`.

---

## Patient Signal System

`lib/domain/signals.ts` → `computePatientSignal()` — pure function, testable.

| Signal | Conditions |
|--------|-----------|
| `new` | Registered < `NEW_PATIENT_GRACE_DAYS` days ago |
| `critical` | No check-in ≥ 5 days, OR 3 consecutive declining wellness days, OR assessment dropped > 10 pts |
| `attention` | No assessment yet, OR has assessment but no booking |
| `active` | Everything normal |

Used in: `/admin/patients` list, `/api/cron/signals` (alerts admin on first `critical` transition), `/admin/reports`.

---

## Cron Jobs

All routes under `/api/cron/*` require `Authorization: Bearer CRON_SECRET`. Scheduled in `vercel.json`:

| Route | Schedule | Purpose |
|-------|----------|---------|
| `cron/emails` | Daily 08:00 | Process email queue (welcome, assessment, engagement sequences) |
| `cron/signals` | Daily 02:00 | Compute signals, email admin on new criticals |
| `cron/checkin-reminder` | Daily 07:00 | Remind patients to check in (skips opted-out + already-done) |
| `cron/checkin-dip-alert` | Daily 09:00 | Alert admin on consecutive wellness dips |
| `cron/weekly-digest` | Sunday 08:00 | Weekly summary email to patients |

---

## Clinical Goals

Goals are set by admin per patient (`/api/admin/patients/[id]/goals`). Each goal has:
- `title` — e.g. "Improve sustained focus"
- `metric` — optional key linking to data source: `"focus"`, `"mood"`, `"overallScore"`, etc.
- `baseline`, `target`, `current` — 0–100 integers
- Progress: `((current - baseline) / (target - baseline)) * 100` — NOT `current/target`

`cron/signals` auto-updates `current` from latest check-in averages or assessment scores when `metric` is set.

---

## Email System

- **Provider:** Resend (`lib/email/index.ts`)
- **From address:** `RESEND_FROM` env var. Use `onboarding@resend.dev` until `vitareba.ch` is DNS-verified in Resend dashboard.
- **Templates:** `lib/email/templates.ts` — all emails defined here, imported by cron routes and API routes
- **Queue:** `emailQueue` table — sequences scheduled on assessment/registration, processed by `cron/emails`
- **Immediate sends:** password reset, new message notification (fire-and-forget in API routes)

---

## Document Storage

Documents are stored in Vercel Blob. The `documents.fileUrl` column stores the blob URL. Upload via `/api/documents` (POST with FormData). `DocumentAddForm` handles the upload client-side.

---

## Design System

All values live in `globals.css`. Never invent new values.

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
| `--warn` | `#d4820a` | Warning states |
| `--danger` | `#e05a5a` | Low scores, errors |

### Typography

| Use | Font | Weight | Class |
|-----|------|--------|-------|
| Section titles | Cormorant Garamond | 300 | `.sec-title` — use `<em>` for italics |
| Eyebrow labels | DM Sans | 400 | `.eyebrow` — uppercase, tracked |
| Body text | DM Sans | 300 | default |
| Buttons | DM Sans | 400 | letter-spacing: 0.08em |

**Rule:** Cormorant = emotional weight (headings, prices, quotes). DM Sans = clarity (labels, body, buttons).

### Key CSS Classes

| Class | Purpose |
|-------|---------|
| `.section-inner` | Max-width container (1100px, centered) for marketing sections |
| `.sec-title` | Large serif section heading |
| `.eyebrow` | Small uppercase label |
| `.hr-rule` | Light border divider |
| `.btn-dark` | Dark filled CTA button |
| `.btn-outline` | Outlined CTA button |

Portal-specific CSS lives in `app/(portal)/portal.module.css` (shared card styles, page layout).
Admin-specific CSS lives in `app/(admin)/admin.module.css`.

### Responsive Strategy

Mobile-first. Base = mobile. `@media (min-width: 768px)` = desktop.
Use `@media (max-width: 767px)` to hide desktop-only elements. Never `max-width: 768px` (off-by-one at exactly 768px).

---

## Assessment — How It Works

The Inflection Edge runs both as a public overlay (marketing site → conversion) and as a logged-in portal page (`/assessment`). Completing the assessment while logged in saves results to the DB.

```
lib/assessment/data.ts
  DIMENSIONS (5)         → Arousal, Divergent, Hyperfocus, Volatility, Environment
  QUESTIONS (30)         → 6 per dimension
  VERDICT_TIERS          → 4 tiers: Deep Friction / Managed Tension / Asymmetric Performance / Optimised
  INTERPRETATIONS        → per-dimension text, 3 tiers each
  scoreColor(score)      → CSS var string for score colouring
```

**Scoring:** Each Q answered 1–5. Per dimension: `(sum / maxPossible) * 100`. Overall: mean of dimension scores.

**To add a question / change interpretations:** Edit only `lib/assessment/data.ts`.

---

## Connection to Surf Your Life

VitaReBa and Surf Your Life are separate brands — same founder, different platforms.

| | VitaReBa | Surf Your Life |
|---|---|---|
| Domain | Clinical / medical | Coaching / transformation |
| Audience | ADHD high performers, longevity patients | Burnout recovery, general wellbeing |
| Contact | `manuel@surfyourlife.org` (SSOT: `lib/config/company.ts`) | Same founder |

**Do not** merge codebases. **Do not** share components. They share philosophy, not code.

---

## Commands

```bash
pnpm dev          # local dev server (localhost:3000)
pnpm build        # production build — run before every push
pnpm lint         # eslint
pnpm db:push      # push schema changes to Neon DB
pnpm db:generate  # generate migration files
pnpm db:studio    # Drizzle Studio for DB inspection
```

**Before every push:** `pnpm build` must pass locally. Never rely on Vercel to catch TypeScript errors.

## Deploy Workflow (agentic — do this every push)

After every `git push`, monitor to completion before reporting done:

```bash
prev=$(vercel ls --prod 2>/dev/null | grep orangecat | head -1 | awk '{print $3}')
while true; do
  row=$(vercel ls --prod 2>/dev/null | grep orangecat | head -1)
  url=$(echo "$row" | awk '{print $3}')
  status=$(echo "$row" | awk '{print $5}')
  [ "$url" != "$prev" ] && echo "DEPLOY $status: $url"
  echo "$status" | grep -qE "^Ready$" && echo "✓ live" && break
  echo "$status" | grep -qiE "Error|Failed|Canceled" && echo "✗ failed — check: vercel logs $url" && break
  sleep 8
done
```

If deployment fails: `vercel logs <url>` → fix → `pnpm build` → push again.

---

## Red Flags

- Color hex directly in component → use `var(--teal)` etc.
- Inline `style={{}}` in a component → move to co-located `.module.css`
- New portal route not added to `PORTAL_ROUTES` in `lib/config/routes.ts` → unauthenticated users get a 404
- Signal threshold hardcoded in a cron route → belongs in `lib/config/admin.ts`
- Email template inline in an API route → belongs in `lib/email/templates.ts`
- `style={{}}` props on portal/admin pages → use portal.module.css / admin.module.css
- Goal progress as `(current/target)*100` → correct formula is `((current-baseline)/(target-baseline))*100`
- `computePatientSignal` logic modified without updating tests in `lib/domain/signals.test.ts`
