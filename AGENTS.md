<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Design System

**Tailwind version:** v4. No `tailwind.config.*` file exists. Tailwind is loaded via `@import "tailwindcss"` in `app/globals.css`. There is no `@theme` block. All design tokens are `:root` CSS custom properties in `globals.css`. Do not create a `tailwind.config.*` file.

**JS token file:** `lib/config/theme.ts` exports named constants (`COLOR_INK`, `COLOR_TEAL`, etc.) with hex values for use in Recharts SVG attributes, Satori OG images, and PWA manifest (contexts that cannot read CSS vars). Keep in sync with `globals.css` manually. Do NOT use these constants in JSX classNames.

### CSS Custom Properties (`app/globals.css` `:root`)

**Base palette:**
```
--ink:        #1a1a22    Primary text, dark backgrounds
--ink2:       #3a3a4a    Secondary dark text
--muted:      #71727c    Nav links, captions, metadata (WCAG AA on white)
--faint:      #c4c0b8    Decorative lines, faint text
--teal:       #2a7a8a    Primary accent: CTAs, links, active states
--teal-dark:  #1e6672    Teal hover state
--gold:       #b8960a    Secondary accent: highlights, decorative
--off:        #f8f7f4    Off-white section backgrounds
--light:      #f1ede7    Light section backgrounds
--border:     #e5e0d8    Borders, dividers
--warn:       #d4820a    Warning states
--danger:     #e05a5a    Low scores, errors
--purple:     #6366f1    Sleep metric in check-in trend chart
--white:      #ffffff
--footer-bg:  #111118
```

**White opacity scale** (for dark/ink-background sections):
```
--white-3 through --white-97
Steps: 3, 5, 6, 7, 8, 10, 12, 15, 18, 20, 25, 30, 35, 40, 50, 55, 58, 60, 62, 75, 80, 90, 97
```

**Color opacity scales** (via `color-mix(in srgb, var(--x) N%, transparent)`):
```
Teal:   --teal-6  --teal-8  --teal-10  --teal-12  --teal-15  --teal-18  --teal-20  --teal-25  --teal-30  --teal-50  --teal-60  --teal-70
Gold:   --gold-6  --gold-12  --gold-20  --gold-30  --gold-70
Danger: --danger-10
Warn:   --warn-8  --warn-10
Muted:  --muted-8  --muted-10  --muted-12  --muted-18
```

**Shadow scale:**
```
--shadow-sm: 0 4px 16px rgba(0,0,0,0.10)
--shadow-md: 0 8px 32px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)
--shadow-lg: 0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)
```

**Border radius scale:**
```
--radius-xs: 0.2rem   --radius-sm: 0.25rem  --radius-md: 0.4rem
--radius-lg: 0.5rem   --radius-xl: 0.875rem --radius-2xl: 1rem   --radius-full: 50%
```

**Transition timing:**
```
--transition-fast: 0.15s   --transition-normal: 0.3s   --transition-slow: 0.4s
```

**Z-index scale:**
```
--z-nav: 100   --z-overlay: 200   --z-overlay-pb: 201   --z-overlay-close: 202
```

**Layout:**
```
--section-pad-y: 6rem   --section-pad-x: 3rem
```

### Typography

| Use | Font | Weight | Class |
|-----|------|--------|-------|
| Section titles | Cormorant Garamond (`--font-cormorant`) | 300 | `.sec-title` — use `<em>` for teal italics |
| Eyebrow labels | DM Sans (`--font-dm-sans`) | 400 | `.eyebrow` — uppercase, tracked |
| Body text | DM Sans | 300 | default (html font-size: 112% = ~17.9px effective) |
| Buttons | DM Sans | 400 | letter-spacing: 0.08em, uppercase |

### Semantic CSS Classes (defined in `globals.css` — use these, not arbitrary Tailwind values)

| Class | Purpose |
|-------|---------|
| `.section-inner` | Max-width 1100px container |
| `.eyebrow` | Small uppercase `--teal` label |
| `.eyebrow-gold` | Same but `--gold-70` |
| `.sec-title` | Cormorant serif heading with `<em>` teal italics |
| `.sec-title-light` | White variant for dark sections |
| `.sec-sub` | Body subtitle, `--muted`, max-width 34rem |
| `.btn-dark` | Dark filled CTA (`--ink` bg, white text) |
| `.btn-outline` | Outlined CTA, inverts on hover |
| `.tags` / `.tag` | Teal tag pill container + pill |
| `.score-good` / `.score-warn` / `.score-bad` | Score color utilities — use className, not style |
| `.pct-good` / `.pct-warn` / `.pct-bad` | Profile completeness color utilities |
| `.booking-status-pending` / `-confirmed` / `-attended` / `-cancelled` | Badge color combos |
| `.hr-rule` | 1px `--border` divider |
| `.hr-dark` | 1px `--white-5` divider for dark sections |
| `.sr-only` | Visually hidden, accessible to screen readers |

Portal-specific CSS: `app/(portal)/portal.module.css`.
Admin-specific CSS: `app/(admin)/admin.module.css`.
Marketing section CSS: co-located `components/sections/*.module.css`.

### SSOT Rule

All design tokens live in `app/globals.css` only. Tailwind config MUST reference CSS vars (`'var(--name)'`), never literal values. Components MUST use semantic Tailwind classes, never arbitrary values like `bg-[#hex]`.

**Violations to fix when touching UI:**
- `bg-[#hex]` / `text-[#hex]` in className → CSS var + semantic class
- `style={{ color: '#hex' }}` → CSS var + className
- Literal hex in tailwind.config → `'var(--color-name)'`
- Same token defined in 2+ files → consolidate to globals.css

**Audit:** `grep -r '\[#' src/` — every result is a violation.
