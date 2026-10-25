# PRD: ReviewCard — Linktree for Businesses + Physical Card Designer

**Working title:** ReviewCard (name TBD)
**Version:** 2.0
**Owner:** Tushar
**Related files:** `database.md` (schema), `prompt.md` (build prompts)

---

## 1. Product summary

ReviewCard is a Linktree-style platform built for **offline, local businesses** (restaurants, cafes, salons, clinics, gyms, shops). Each business gets:

1. A mobile-first **link page** at a custom URL (`yourdomain.com/r/cafe-aroma`) with a big **"Leave us a Google review"** button plus WhatsApp, Instagram, website, menu, directions and any custom links.
2. A **QR code** (and later an **NFC sticker**) that opens that page.
3. A **designed physical card / table stand / sticker**, created inside the platform with a card designer, exported print-ready, and placed at the counter or table.

**What makes it different from Linktree:** Linktree lives online. This product bridges **offline to online**: the physical card is part of the product, the Google review is the primary goal, and everything (page, QR, NFC, print file) is generated from one business profile.

## 2. Problem

- Customers rarely leave Google reviews because it takes too many steps (search business, scroll, find "Write a review").
- Businesses have their presence scattered: Maps, Instagram, WhatsApp, website, menu PDFs.
- Existing link-in-bio tools are not designed for walk-in customers, do not generate print assets, and do not know about Google review links.
- Getting a QR card designed and printed means going to a designer, then a printer, with no way to edit it later.

## 3. Goals and non-goals

### Goals

1. Onboard a business in **under 3 minutes**.
2. Customer path: scan or tap, then review in **at most 2 taps**.
3. Generate a **print-ready card** (PDF with bleed) in under 2 minutes using templates.
4. Links editable any time **without reprinting** (dynamic URL).
5. NFC-ready from day one (same URL architecture).
6. Support many businesses under one admin; later self-serve owners and resellers.

### Non-goals (v1)

- Replying to or reading Google reviews via the Business Profile API
- Review gating (sending only happy customers to Google). **Prohibited by Google; never build.**
- Native mobile apps
- Payments, loyalty, CRM

## 4. Personas

| Persona                       | Needs                                                                |
| ----------------------------- | -------------------------------------------------------------------- |
| **Platform admin (you/team)** | Onboard businesses fast, manage all, export prints, see global stats |
| **Business owner** (v2)       | Edit links/theme, download card, see scan stats, reorder prints      |
| **Reseller / agency** (v3)    | Manage many client businesses under one account, white-label         |
| **End customer**              | Scan/tap, instant page, no login, review easily                      |

## 5. Core user flows

### 5.1 Onboard a business (admin)

1. Admin Panel, **Add Business**.
2. Enter name, category, logo.
3. Search Google Places, pick the business. Save Place ID, auto-build review link, show a **Test link** button.
4. Add links: WhatsApp (number, optional pre-filled message), Instagram, website, Facebook, YouTube, phone, menu URL, and **custom links** (label + URL + icon).
5. Choose slug (live availability check, suggestions).
6. Pick theme (color, font, button style), live phone preview.
7. Publish. Short URL + QR + NFC URL generated.
8. Go to **Card Designer** (flow 5.2).

### 5.2 Design a card

1. Choose a **format**: credit-card (85.6x54 mm), table stand (A6 / 105x148 mm), square sticker (50x50 mm), A5 poster/standee.
2. Choose a **template** (filtered by category: food, salon, clinic, retail, minimal).
3. Template auto-fills business name, logo, brand colors, tagline, QR, "Scan to review us on Google" text, stars, social icons.
4. Edit in the designer: move/resize elements, change text/fonts/colors, upload background, toggle front/back.
5. **Scan check:** the designer warns if QR is too small, low contrast, or overlapped.
6. Export: print-ready PDF (3 mm bleed, crop marks), PNG preview, SVG QR only.
7. Save design to the business (can re-open and edit later).

### 5.3 Customer scan

1. Scan QR or tap NFC and open `/r/cafe-aroma?s=qr` (or `s=nfc`).
2. See logo, name, big review button, secondary link buttons.
3. Tap review and Google's review screen opens for that business.

### 5.4 Edit later

Change anything in the profile and the page updates instantly at the same URL. Printed cards stay valid.

## 6. Functional requirements

Priority: **P0** = MVP, **P1** = soon after, **P2** = later.

### 6.1 Business profile (P0)

- Name, tagline, category, logo, cover image
- Google Place ID (required), review URL auto-built, Maps URL
- Link types: WhatsApp, phone, email, Instagram, Facebook, YouTube, X, LinkedIn, website, menu, custom
- Drag-reorder, show/hide, icon per link
- Status: draft / published / paused

### 6.2 Google review link (P0)

- Places Autocomplete with map preview to pick Place ID
- Review URL: `https://search.google.com/local/writereview?placeid=<PLACE_ID>`
- Test button; fallback to manual paste of a `g.page/.../review` link

### 6.3 Custom URL (P0)

- `yourdomain.com/r/<slug>`; lowercase a-z, 0-9, hyphen; 3 to 40 chars
- Reserved words blocked (`admin`, `api`, `login`, `dashboard`, `r`, `app`)
- Slug is permanent after print. Changing it keeps old slug as a redirect (`slug_history`).
- P2: custom domain per business

### 6.4 QR code (P0)

- Encodes only short URL + source tag (`?s=qr`); each physical item can have its own tag
- Export SVG, PNG (1200px+), PDF
- Error correction Q or H, optional center logo, brand color with enforced contrast (min 4.5:1, dark on light)
- Quiet zone min 4 modules

### 6.5 Card designer (P0 basic, P1 advanced)

- Canvas editor in browser (Fabric.js or Konva) with real mm dimensions
- Templates: 8 at launch (2 per major category), data-bound placeholders
- Elements: text, image/logo, shapes, QR (locked aspect ratio, cannot be distorted), icons (social, stars, NFC tap icon), background color/image
- Controls: drag, resize, rotate, layers, align, undo/redo, font picker (limited curated set, Google Fonts incl. Devanagari)
- Front and back sides
- Safe-area and bleed guides
- **Scan checker (P0):** min QR size 2.5 cm, contrast check, quiet zone check, overlap check
- Export: PDF with 3 mm bleed + crop marks, PNG, per-side files
- Save/reopen designs; duplicate design for another format
- P1: batch generate (same template for 50 businesses), AI auto-layout suggestion
- P2: order printing in-app via print partner

### 6.6 NFC (P0 architecture, P1 tooling)

- NFC stores same short URL with `?s=nfc`
- Chips: NTAG213 (144 bytes) or NTAG215
- "Encode NFC" screen shows exact URL, copy button, instructions (NFC Tools app / Web NFC on Android)
- Recommend locking tags after write
- Designer includes "Tap here" NFC icon element

### 6.7 Public link page (P0)

- Mobile-first, LCP under 1.5 s on 4G, page under 150 KB excluding logo
- Review CTA above the fold, always first
- Large tap targets (min 48 px)
- Theme per business, curated font set
- Open Graph tags, favicon from logo
- No login, no cookie banner needed (no tracking cookies)
- P2: EN/HI toggle, Google rating + review count display (Places Details, cached)

### 6.8 Analytics (P1)

- Views, unique visitors (anonymous), source (qr/nfc/direct), per-card source
- Link clicks via `/go/[linkId]` redirect
- Time series, device type, coarse location
- Per-business dashboard + global admin; CSV export

### 6.9 Admin panel (P0)

- Auth (email + password / Google)
- Business list with search/filter, create/edit/duplicate/pause/delete
- Card designs list per business

### 6.10 Owner portal (P2)

- Magic-link login, own business only
- Edit links/theme, edit card, download files, stats, billing (Razorpay)

### 6.11 Reseller mode (P3)

- Agency account with many businesses, white-label domain and branding, commission tracking

## 7. Information architecture (screens)

**Admin / owner app**

- `/login`
- `/dashboard` — business list, global stats
- `/businesses/new` — onboarding wizard (steps: basics, Google, links, slug, theme, publish)
- `/businesses/[id]` — overview, links, theme, analytics tabs
- `/businesses/[id]/cards` — saved designs
- `/businesses/[id]/cards/new` — format and template picker
- `/businesses/[id]/cards/[designId]` — card designer
- `/businesses/[id]/nfc` — NFC encoding helper
- `/settings`

**Public**

- `/r/[slug]` — link page
- `/r/[slug]/go/[linkId]` — click redirect + log
- `/r/[slug]/review` — direct Google review redirect

## 8. Compliance and policy

1. **No review gating.** Everyone goes straight to Google review. Document this in onboarding.
2. **No incentivized reviews.** Add note and checkbox in onboarding and ToS.
3. Never auto-post or write reviews for customers. Future AI suggestions must be customer-editable and customer-submitted.
4. Analytics store no personal data (no phone, name, exact IP). Short privacy policy page (DPDP Act aware).
5. Store Place ID only from Places API (allowed); avoid long-term caching of other Places content.
6. Respect trademarks: templates must not use Google logo in a misleading way; use "Review us on Google" text and a generic star icon, follow Google brand guidelines if using the G logo.

## 9. Non-functional requirements

| Area           | Requirement                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Performance    | Public page LCP under 1.5 s on 4G; designer interactive in under 3 s                                                          |
| Availability   | 99.9% public pages (dead QR on printed card is unacceptable)                                                                  |
| Scalability    | 100k scans/day via edge cache, async logging                                                                                  |
| Security       | Auth, RLS, server-side API keys, rate limiting, input validation, URL sanitization on custom links (block `javascript:` etc.) |
| Accessibility  | WCAG AA contrast, 48 px tap targets                                                                                           |
| Browsers       | Last 2 versions Chrome, Safari, Samsung Internet; iOS + Android camera scan                                                   |
| Data safety    | Daily backups, never hard-delete published slugs                                                                              |
| Print accuracy | PDF exports at true physical size, 300 DPI images, vector QR/text                                                             |

## 10. Tech stack

| Layer           | Choice                                                                          |
| --------------- | ------------------------------------------------------------------------------- |
| App             | Next.js (App Router, TypeScript) + Tailwind + shadcn/ui                         |
| Hosting         | Vercel (edge cache, ISR, custom domains)                                        |
| DB/Auth/Storage | Supabase (Postgres, Auth, Storage buckets for logos/designs/exports)            |
| Maps            | Google Places API (Autocomplete + Details)                                      |
| QR              | `qr-code-styling` or `qrcode` (SVG output)                                      |
| Card designer   | Konva (react-konva) or Fabric.js                                                |
| PDF export      | `pdf-lib` (vector, bleed, crop marks) / server route with Puppeteer as fallback |
| Analytics       | Own `scan_events` table, optional Plausible                                     |
| Payments (v2)   | Razorpay                                                                        |
| Monitoring      | Sentry + uptime monitor on a sample slug                                        |

## 11. API outline

**Public**

- `GET /r/[slug]` — page, logs view
- `GET /r/[slug]/go/[linkId]` — log click, 302 to target
- `GET /r/[slug]/review` — 302 to Google review

**Authenticated**

- `POST/PATCH/DELETE /api/businesses`
- `GET /api/places/search?q=`, `GET /api/places/details?placeId=`
- `GET /api/slug-available?slug=`
- `GET /api/businesses/:id/qr?format=svg|png|pdf&source=qr|nfc`
- `POST/PATCH/DELETE /api/businesses/:id/links`
- `GET/POST/PATCH /api/businesses/:id/designs`
- `POST /api/designs/:id/export?format=pdf|png`
- `GET /api/businesses/:id/stats?range=30d`

## 12. Physical product specs

**Formats**

| Format            | Size         | Notes                        |
| ----------------- | ------------ | ---------------------------- |
| Credit-card style | 85.6 x 54 mm | QR 2.5 to 3 cm, double-sided |
| Table stand (A6)  | 105 x 148 mm | QR 4 cm                      |
| Square sticker    | 50 x 50 mm   | QR 3 cm, NFC chip behind     |
| A5 standee        | 148 x 210 mm | QR 5 cm                      |

- Bleed 3 mm, safe margin 4 mm, 300 DPI, CMYK-friendly colors
- Matte lamination (glossy glare hurts scanning)
- Always print a proof and test-scan on iPhone and Android
- NFC: NTAG213/215; on-metal tags for metal surfaces; keep QR as backup on the same card

## 13. Business model (hypotheses to validate)

| Plan         | Idea                                                          |
| ------------ | ------------------------------------------------------------- |
| One-time kit | Rs 499 to 999: page setup + 1 designed printed QR card        |
| Kit + NFC    | Rs 899 to 1,499                                               |
| Monthly (v2) | Rs 99 to 299: edits, analytics, owner portal, custom domain   |
| Add-ons      | Extra stands, custom design, multi-location, reseller pricing |

## 14. Success metrics

- Onboard time under 3 min; card design time under 2 min
- Scan-to-review-click above 30%
- 10 businesses month 1, 50 by month 3
- Public page LCP under 1.5 s
- Owner-reported review gain per month
- Churn under 5% monthly (when subscriptions start)

## 15. Risks and mitigations

| Risk                                 | Mitigation                                                     |
| ------------------------------------ | -------------------------------------------------------------- |
| Wrong Place ID                       | Map preview + mandatory Test link before publish               |
| Printed URL dies                     | Own domain, permanent slugs, redirects, renew domain for years |
| Poor scan quality                    | Scan checker, EC level Q/H, proof print                        |
| Google policy breaches by businesses | Onboarding rules, no gating built in                           |
| Designer complexity                  | Start with templates + limited editing, add features gradually |
| Places API cost                      | Session tokens, cache Place ID only, restrict key              |
| Print colors differ from screen      | Proof first, use safe brand colors, offer color note           |

## 16. Roadmap

**Phase 1 — MVP (1 to 2 weeks):** auth, business CRUD, Places search, links, slug, public page, QR export, scan logging.
**Phase 2 — Card designer (2 weeks):** templates, canvas editor, scan checker, PDF export with bleed, saved designs.
**Phase 3 — NFC and analytics (1 week):** source tags, NFC helper, dashboard, slug history.
**Phase 4 — Owner portal and billing (2 to 3 weeks):** magic link, Razorpay, custom domains, CSV bulk onboarding.
**Phase 5 — Scale:** reseller mode, in-app print ordering, multi-location, Google rating display, EN/HI.

## 17. Open questions

1. Final product name and short domain
2. Direct sales only, or resellers/agencies too?
3. Print partner: local vendor or integrated vendor API?
4. Show Google rating + review count on the page at launch?
5. English-only or EN + Hindi at launch?

## 18. MVP launch checklist

- [ ] Buy short domain
- [ ] Supabase project, run `database.md` schema
- [ ] Google Cloud project, restricted Places API key
- [ ] Admin auth + Add Business wizard
- [ ] Public `/r/[slug]` page
- [ ] Click redirect + scan logging
- [ ] QR export
- [ ] 2 card templates + basic designer
- [ ] Print one proof, test-scan on 3 phones
- [ ] Onboard 3 real businesses
- [ ] Order 5 NTAG213 stickers, test NFC flow
