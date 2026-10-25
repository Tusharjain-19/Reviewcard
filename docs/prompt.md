# prompt.md — Build Prompts for ReviewCard

Use these with your AI IDE (Cursor, Claude Code, Windsurf, etc.). Put `PRD.md` and `database.md` in the project root first so the AI can read them. Run the prompts **in order**, one per session, and test before moving on.

---

## 0. Master context prompt (paste at the start of every session)

```
You are a senior full-stack engineer building "ReviewCard": a Linktree-style
platform for offline local businesses (restaurants, salons, clinics, shops).

Each business gets:
1. A mobile-first link page at /r/[slug] with a prominent "Leave us a Google review"
   button plus WhatsApp, Instagram, website, menu, directions, and custom links.
2. A QR code (and later an NFC sticker) that opens that page.
3. A physical card designer: templates + canvas editor, exported as print-ready PDF.

Read PRD.md and database.md in the project root before writing code. They are the
source of truth. If something conflicts, ask me before deviating.

Stack: Next.js (App Router, TypeScript), Tailwind, shadcn/ui, Supabase (Postgres,
Auth, Storage), Google Places API, Vercel.

Rules:
- Mobile-first, accessible (WCAG AA, 48px tap targets), fast (public page < 150KB).
- NEVER build review gating. Every customer goes straight to the Google review.
- QR/NFC must encode ONLY the short URL (+ ?s= source tag), never the destination.
- Use the Supabase service role key on the server only. Never in client code.
- Validate all URLs (allow only https, http, tel, mailto). Sanitize user input.
- Use server actions / route handlers with zod validation.
- Keep components small, typed, and documented. Add loading and error states.
- After each task: list files changed, how to run, how to test manually.
Ask a clarifying question only if truly blocked; otherwise make a sensible choice
and note it.
```

---

## Phase 1 — Project setup and database

```
Task: Initialize the project and database.

1. Create a Next.js 14+ App Router project with TypeScript, Tailwind, ESLint, and
   shadcn/ui. Use the src/ directory and the @/ import alias.
2. Install: @supabase/supabase-js @supabase/ssr zod react-hook-form
   @hookform/resolvers qrcode lucide-react clsx.
3. Create .env.example with:
   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
   SUPABASE_SERVICE_ROLE_KEY, GOOGLE_PLACES_API_KEY, NEXT_PUBLIC_APP_URL.
4. Create /supabase/migrations/0001_init.sql using the exact schema, enums,
   triggers, indexes, and RLS policies from database.md.
5. Create /supabase/seed.sql with 1 admin profile placeholder and 3 sample
   businesses with links.
6. Create typed Supabase clients: browser client, server client (cookies), and a
   service-role admin client (server-only, add `import "server-only"`).
7. Generate TypeScript types for the tables in /src/types/db.ts.
8. Add a README with setup steps.

Acceptance: `npm run dev` works, migration runs cleanly in Supabase, types compile.
```

## Phase 2 — Auth and admin shell

```
Task: Authentication and the admin layout.

1. Supabase Auth with email + password and Google OAuth. Pages: /login, and a
   /auth/callback route.
2. Middleware that protects /dashboard and /businesses/*. Redirect unauthenticated
   users to /login.
3. On first login, create a row in profiles. The first user becomes role 'admin'
   (make this configurable via an env ADMIN_EMAILS list instead).
4. Admin layout: sidebar (Dashboard, Businesses, Templates, Settings), top bar with
   user menu, responsive (drawer on mobile).
5. /dashboard: stat cards (total businesses, published, scans last 7 days) and a
   searchable, filterable businesses table (name, slug, status, created, actions).
   Empty state with an "Add business" CTA.

Acceptance: login/logout works, protected routes enforced, dashboard renders from DB.
```

## Phase 3 — Business onboarding wizard

```
Task: Build /businesses/new as a 6-step wizard with autosave to draft.

Steps:
1. Basics: name, category (select), tagline, logo upload (Supabase Storage `logos`
   bucket, max 2MB, png/jpg/webp/svg, preview + crop to square).
2. Google location: search box using Google Places Autocomplete via a server route
   /api/places/search (key stays server-side, use session tokens). Show results with
   address; on select call /api/places/details, save place_id, build
   google_review_url = https://search.google.com/local/writereview?placeid=<id>,
   show a small map preview and a "Test review link" button (opens in new tab).
   Fallback: "Paste g.page review link manually".
3. Links: add/remove/reorder (drag handle, use dnd-kit) links of types WhatsApp,
   phone, email, Instagram, Facebook, YouTube, X, LinkedIn, website, menu, custom.
   WhatsApp input takes a phone number, builds https://wa.me/<digits>?text=<optional
   message>. Instagram accepts @handle and builds the URL. Custom link: label + URL +
   icon picker. The Google review link is auto-added as the primary link and cannot
   be deleted.
4. Slug: auto-suggest from name, live availability check (debounced) against
   businesses.slug and slug_history, reserved words blocked, show final URL preview.
5. Theme: primary color, background, font (from a curated list of 6), button style
   (rounded/pill/square), light/dark. Live phone-frame preview of the public page.
6. Review and publish: summary, onboarding rules checkbox ("I understand reviews
   must not be gated or incentivized"), Publish button sets status = 'published'.
   After publish show the short URL, a QR preview, and buttons: "Design card",
   "Download QR", "Open page".

Use zod schemas shared by client and server. Every step validates before Next.
Show clear errors. Persist drafts so a refresh does not lose progress.

Acceptance: a business can be created end to end in under 3 minutes and appears in
the dashboard as published.
```

## Phase 4 — Public link page and redirects

```
Task: Build the public pages.

1. /r/[slug] server component:
   - Look up the business by slug (status published). If not found, check
     slug_history and 301 redirect to the current slug. If paused, show a friendly
     "This page is unavailable" page. Otherwise 404.
   - Render: logo, name, tagline, then the primary Google review button (large,
     above the fold, star icon), then the other links as full-width buttons with
     icons, then a small footer "Powered by ReviewCard" (hideable later).
   - Apply theme from businesses.theme using CSS variables.
   - Read ?s= (qr|nfc|other) and log a 'view' event asynchronously (use
     after()/waitUntil, never block rendering) with device_type, os, country, city
     from request headers (no raw IP stored).
   - Metadata: title, description, Open Graph image (logo), favicon.
   - Use ISR with on-demand revalidation when a business or its links change.
2. /r/[slug]/go/[linkId]: look up the link, log a 'click' event, 302 redirect to
   link.url. Re-validate the URL scheme before redirecting.
3. /r/[slug]/review: 302 to google_review_url (log click on the primary link).
4. Make all link buttons point to /go/[linkId] so clicks are tracked.
5. Performance: no client JS unless needed, next/image for the logo, system or
   next/font fonts only, total page weight < 150KB.

Acceptance: Lighthouse mobile performance 95+, accessibility 95+. Review button
opens the correct Google review screen.
```

## Phase 5 — QR generation

```
Task: QR code utilities and export.

1. Create /src/lib/qr.ts: generateQrSvg({ url, fg, bg, ec = 'Q', logo?, margin = 4 }).
   Enforce contrast ratio >= 4.5:1 (throw or auto-correct). If a center logo is used,
   force error correction 'H' and limit logo to 20% of QR width.
2. Route GET /api/businesses/[id]/qr?format=svg|png|pdf&source=qr|nfc|<tag>:
   - URL encoded = `${APP_URL}/r/${slug}?s=${source}`
   - SVG vector; PNG at 1200px+; PDF at true size.
3. UI on the business page: QR preview, source selector, download buttons, copy URL,
   and a note "Print at least 2.5 x 2.5 cm and test-scan before printing in bulk".
4. Auth check: only admin or the owner can download.

Acceptance: QR scans on iPhone and Android camera; URL contains slug and source tag.
```

## Phase 6 — Card designer (the core differentiator)

```
Task: Build the in-browser card designer at
/businesses/[id]/cards/new and /businesses/[id]/cards/[designId].

Libraries: react-konva (or fabric.js if you judge it better, and tell me why),
zustand for editor state, html-to-image not needed.

Flow:
1. Format picker: credit_card (85.6x54mm), table_stand_a6 (105x148mm),
   sticker_square (50x50mm), standee_a5 (148x210mm), custom.
2. Template picker (from templates table, filtered by category). Selecting a
   template clones its canvas JSON into a new design with placeholders resolved
   from the business ({{business.name}}, {{business.logo}}, {{business.url}},
   {{business.tagline}}, {{theme.primary}}).
3. Editor:
   - Canvas works in millimetres with a visible zoom (fit to screen), rulers
     optional. Show bleed (3mm) and safe-area (4mm) guides toggleable.
   - Elements: text, image (upload to design-assets bucket), shape (rect, circle,
     line), icon (social icons, 5 stars, "tap here" NFC icon, phone, map pin),
     QR (aspect ratio locked, cannot be distorted below minimum size).
   - Controls: drag, resize, rotate, duplicate, delete, layer up/down, align,
     snap to guides, undo/redo (keyboard shortcuts), lock element.
   - Property panel: font (curated 12 incl. one Devanagari), size, weight, color,
     alignment, opacity; fill and stroke for shapes; QR fg/bg and optional logo.
   - Front/back tabs.
4. Scan checker (runs live and before export). Warnings or errors for:
   QR smaller than 25mm, contrast < 4.5:1, QR overlapped by other elements,
   quiet zone < 4 modules violated, QR outside the safe area, text smaller than 6pt.
   Block export on errors, allow on warnings with confirmation.
5. Save: designs table (front_canvas, back_canvas, format, dimensions, bleed,
   scan_check). Autosave with debounce. "Duplicate to another format" scales the
   layout proportionally.
6. Canvas JSON must follow the versioned format in database.md section 6.

Seed 8 templates (2 each: food, salon/clinic, retail, minimal) for credit_card and
table_stand_a6. Clean modern layouts with the QR prominent, "Scan to review us on
Google" text, and star icons. Do NOT use the Google logo.

Acceptance: a user can pick a template, tweak text/colors, pass the scan checker, and
save in under 2 minutes.
```

## Phase 7 — Print-ready export

```
Task: Export designs.

1. Route POST /api/designs/[id]/export?format=pdf|png.
2. PDF: use pdf-lib to build a vector PDF at true physical size
   (width + 2*bleed by height + 2*bleed), embed fonts, draw text as text, QR as vector
   paths, images at 300 DPI max. Add crop marks outside the bleed. One page per side
   (front, back). Offer an option "without crop marks".
3. PNG: render at 300 DPI from the canvas for previews.
4. Store files in the private `exports` bucket, insert into design_exports, return a
   signed URL (expires in 1 hour).
5. UI: Export dialog (PDF print-ready, PNG preview, QR only SVG), a status spinner,
   and a checklist: "Print a proof, test-scan with iPhone and Android, matte
   lamination recommended".
6. Verify the exported PDF dimensions match the physical size exactly and that the
   QR still decodes (add a test using a QR decoder library on a rasterised export).

Acceptance: opening the PDF in Acrobat shows correct size, bleed and crop marks; the
QR scans from a printed or on-screen proof.
```

## Phase 8 — Cards registry, NFC helper, source tags

```
Task: Physical card tracking and NFC support.

1. Table `cards` (see database.md). UI at /businesses/[id]/cards-registry (or a tab):
   add a card (type, label like "Table 4", unique source_tag, quantity, printed_at).
2. Each card's QR/NFC URL = /r/[slug]?s=<source_tag>. Link designs to a card
   optionally so the QR inside the design uses that source tag.
3. /businesses/[id]/nfc page:
   - Shows the exact URL to write (with ?s=nfc), a Copy button, and step-by-step
     instructions: install "NFC Tools", Write, Add a record, URL/URI, paste, write,
     then lock the tag (read-only).
   - Recommended chips: NTAG213 (144 bytes) or NTAG215. Mention on-metal tags.
   - Optional: if 'NDEFReader' exists in the browser (Android Chrome), a "Write to
     tag" button using Web NFC with a clear permission and error flow.
4. Analytics should break scans down by source tag.

Acceptance: encoding a sticker with the shown URL opens the page when tapped and logs
source = nfc.
```

## Phase 9 — Analytics dashboard

```
Task: Per-business and global analytics.

1. /businesses/[id]/analytics: date range (7/30/90 days), cards for total views,
   unique-ish visitors (approximate, no cookies), review button clicks, click-through
   rate; line chart views over time; donut for source (qr/nfc/direct); bar chart for
   top links; table by card source tag; device split.
2. Global admin dashboard: top businesses by scans, total scans, new businesses.
3. CSV export.
4. Use SQL aggregate queries (see database.md section 7). Create a daily_stats rollup
   table + cron (Supabase scheduled function) if scan_events grows large.
5. Use recharts. Empty states with guidance ("No scans yet. Print your card!").

Acceptance: scans produced by testing the QR appear within a minute.
```

## Phase 10 — Hardening and launch

```
Task: Production readiness.

1. Rate-limit: slug availability, places search, click redirects (basic IP limit
   using Upstash or in-memory fallback).
2. Security review: RLS test cases (owner A cannot read business B), service role
   usage only server-side, URL scheme allow-list, file upload type/size checks, CSRF
   safe route handlers, security headers.
3. Error monitoring (Sentry) and an uptime check hitting a sample /r/slug.
4. Add privacy policy and terms pages (no gating, no incentivized reviews, anonymous
   analytics).
5. SEO: noindex on admin, sensible robots.txt, sitemap not needed for /r pages
   (they are for QR use) — set noindex optionally per business.
6. E2E tests (Playwright): onboarding flow, public page, redirect, slug history,
   QR download, card export.
7. Seed 8 templates, write a launch checklist, and a user guide for onboarding a
   business and printing a card.

Acceptance: all tests pass, Lighthouse 95+, RLS verified, production deploy on Vercel
with the custom domain.
```

---

## Phase 11+ (later, one prompt each when ready)

- **Owner portal:** magic-link login, owner can edit own business, links, theme, card designs, view stats.
- **Billing:** Razorpay subscriptions, plans, feature gates, invoices.
- **Custom domains:** per-business `review.cafearoma.com` via Vercel Domains API, verification, `domains` table.
- **Bulk onboarding:** CSV upload, auto-find Place IDs, batch card generation.
- **Reseller mode:** agency accounts, white-label branding, commission tracking.
- **Print ordering:** integrate a print vendor API, `print_orders` table, order status.
- **Google rating on page:** Places Details API, cached rating and review count, refresh daily.
- **EN/HI toggle:** i18n for the public page.
- **Multi-location chains:** `locations` table, location picker page.

---

## Quick prompts for small fixes (copy as needed)

**Debug**

```
The [feature] is failing with [error]. Read the relevant files, explain the root
cause first, then propose the minimal fix. Do not refactor unrelated code.
```

**Review**

```
Review the code you just wrote against PRD.md and database.md. List any deviations,
security issues (especially RLS and URL validation), accessibility gaps, and missing
edge cases. Then fix them.
```

**Polish UI**

```
Polish the [page] UI: spacing, typography, empty/loading/error states, mobile
layout at 360px width, and keyboard focus styles. Keep the existing design tokens.
```

**Add a template**

```
Add a new card template named "[name]" for format [format], category [category].
Layout: [describe]. Colors from {{theme.primary}}. Include QR (min 28mm), the text
"Scan to review us on Google", 5 stars, and the business name/logo placeholders.
Insert it into the seed file and verify it passes the scan checker.
```
