# database.md — ReviewCard Database Design

**Database:** PostgreSQL (Supabase)
**Why a database is required:** every business needs a stored profile, a unique slug that resolves on every scan, editable links (so printed cards never change), saved card designs, and scan analytics. Without it you cannot edit after printing or track QR vs NFC.

---

## 1. Entity overview

```
users ──< businesses ──< links
              │ ├──< designs ──< design_exports
              │ ├──< cards (physical items)
              │ ├──< slug_history
              │ └──< scan_events
templates (global, used by designs)
```

- **businesses**: the core entity (one link page per business)
- **links**: buttons on the page
- **cards**: physical items placed in the world (QR card, NFC sticker, table stand, receipt QR); each has its own source tag for analytics
- **designs**: saved card-designer files (canvas JSON) per business
- **templates**: starting designs
- **scan_events**: anonymous views and clicks
- **slug_history**: old slugs that must keep redirecting

## 2. Schema (SQL)

```sql
-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ENUMS
create type user_role as enum ('admin', 'owner', 'reseller');
create type business_status as enum ('draft', 'published', 'paused');
create type link_type as enum (
  'whatsapp','phone','email','instagram','facebook','youtube',
  'x','linkedin','website','menu','maps','custom'
);
create type card_type as enum ('qr_card','nfc_sticker','table_stand','receipt','poster','other');
create type event_type as enum ('view','click');
create type event_source as enum ('qr','nfc','direct','other');
create type card_format as enum ('credit_card','table_stand_a6','sticker_square','standee_a5','custom');

-- USERS (profile table linked to Supabase auth.users)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       citext unique not null,
  full_name   text,
  role        user_role not null default 'owner',
  created_at  timestamptz not null default now()
);

-- BUSINESSES
create table public.businesses (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid references public.profiles(id) on delete set null,
  created_by        uuid references public.profiles(id) on delete set null,
  slug              citext unique not null
                    check (slug ~ '^[a-z0-9]([a-z0-9-]{1,38})[a-z0-9]$'),
  name              text not null,
  tagline           text,
  category          text,                       -- restaurant, salon, clinic, retail, gym...
  google_place_id   text not null,
  google_review_url text not null,              -- built from place id or manual g.page link
  google_maps_url   text,
  logo_url          text,
  cover_url         text,
  theme             jsonb not null default '{
    "primary":"#1a73e8","background":"#ffffff","text":"#111111",
    "font":"Inter","button_style":"rounded","mode":"light"
  }',
  status            business_status not null default 'draft',
  language          text not null default 'en',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index businesses_owner_idx on public.businesses(owner_id);
create index businesses_status_idx on public.businesses(status);

-- LINKS
create table public.links (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  type          link_type not null,
  label         text not null,
  url           text not null
                check (url ~* '^(https?://|tel:|mailto:)'),   -- blocks javascript: etc.
  icon          text,
  sort_order    int not null default 0,
  is_visible    boolean not null default true,
  is_primary    boolean not null default false,   -- the Google review button
  created_at    timestamptz not null default now()
);
create index links_business_order_idx on public.links(business_id, sort_order);

-- SLUG HISTORY (permanent redirects)
create table public.slug_history (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  old_slug    citext unique not null,
  created_at  timestamptz not null default now()
);

-- CARDS (physical items)
create table public.cards (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  type         card_type not null,
  source_tag   text not null,           -- appended as ?s=<tag> e.g. qr, nfc, table4
  label        text,                    -- "Table 4", "Counter sticker"
  printed_at   date,
  quantity     int default 1,
  notes        text,
  created_at   timestamptz not null default now(),
  unique (business_id, source_tag)
);

-- TEMPLATES (global)
create table public.templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text,                     -- food, salon, clinic, retail, minimal
  format      card_format not null,
  canvas      jsonb not null,           -- elements with data bindings e.g. {{business.name}}
  preview_url text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- DESIGNS (saved card-designer files)
create table public.designs (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  template_id   uuid references public.templates(id) on delete set null,
  card_id       uuid references public.cards(id) on delete set null,
  name          text not null,
  format        card_format not null,
  width_mm      numeric(6,2) not null,
  height_mm     numeric(6,2) not null,
  bleed_mm      numeric(4,2) not null default 3,
  front_canvas  jsonb not null,
  back_canvas   jsonb,
  scan_check    jsonb,                  -- last scan-checker result
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index designs_business_idx on public.designs(business_id);

-- DESIGN EXPORTS
create table public.design_exports (
  id          uuid primary key default gen_random_uuid(),
  design_id   uuid not null references public.designs(id) on delete cascade,
  format      text not null check (format in ('pdf','png','svg')),
  file_url    text not null,
  created_at  timestamptz not null default now()
);

-- SCAN EVENTS (anonymous analytics, high volume)
create table public.scan_events (
  id           bigint generated always as identity primary key,
  business_id  uuid not null references public.businesses(id) on delete cascade,
  card_id      uuid references public.cards(id) on delete set null,
  link_id      uuid references public.links(id) on delete set null,
  event_type   event_type not null,
  source       event_source not null default 'direct',
  device_type  text,                    -- mobile, tablet, desktop
  os           text,
  country      text,
  city         text,
  created_at   timestamptz not null default now()
);
create index scan_events_biz_time_idx on public.scan_events(business_id, created_at desc);
create index scan_events_link_idx on public.scan_events(link_id);

-- updated_at trigger
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

create trigger businesses_updated before update on public.businesses
  for each row execute function set_updated_at();
create trigger designs_updated before update on public.designs
  for each row execute function set_updated_at();
```

## 3. Slug rules

- Regex enforced in DB: 3 to 40 chars, a-z, 0-9, hyphen, no leading/trailing hyphen.
- Reserved words enforced in app layer: `admin, api, login, logout, dashboard, r, app, settings, static, _next, www`.
- Slug lookup order on `/r/[slug]`: `businesses.slug` first, then `slug_history.old_slug` (301 redirect to the current slug).
- When a slug changes: insert the old slug in `slug_history` inside the same transaction.

## 4. Row Level Security (Supabase)

```sql
alter table public.businesses enable row level security;
alter table public.links enable row level security;
alter table public.cards enable row level security;
alter table public.designs enable row level security;
alter table public.design_exports enable row level security;
alter table public.scan_events enable row level security;
alter table public.slug_history enable row level security;
alter table public.profiles enable row level security;

-- helper
create or replace function public.is_admin() returns boolean as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$ language sql stable security definer;

-- businesses
create policy "public read published" on public.businesses
  for select using (status = 'published');
create policy "owner or admin read" on public.businesses
  for select using (owner_id = auth.uid() or public.is_admin());
create policy "admin insert" on public.businesses
  for insert with check (public.is_admin() or owner_id = auth.uid());
create policy "owner or admin update" on public.businesses
  for update using (owner_id = auth.uid() or public.is_admin());
create policy "admin delete" on public.businesses
  for delete using (public.is_admin());

-- links (public read for visible links of published businesses)
create policy "public read links" on public.links
  for select using (
    is_visible and exists (
      select 1 from public.businesses b
      where b.id = links.business_id and b.status = 'published')
  );
create policy "owner or admin manage links" on public.links
  for all using (
    exists (select 1 from public.businesses b
            where b.id = links.business_id
              and (b.owner_id = auth.uid() or public.is_admin()))
  );

-- designs / cards / exports: same owner-or-admin pattern via business_id
create policy "owner or admin designs" on public.designs
  for all using (
    exists (select 1 from public.businesses b
            where b.id = designs.business_id
              and (b.owner_id = auth.uid() or public.is_admin()))
  );
create policy "owner or admin cards" on public.cards
  for all using (
    exists (select 1 from public.businesses b
            where b.id = cards.business_id
              and (b.owner_id = auth.uid() or public.is_admin()))
  );

-- scan_events: no public read; inserts happen server-side with the service role.
create policy "owner or admin read events" on public.scan_events
  for select using (
    exists (select 1 from public.businesses b
            where b.id = scan_events.business_id
              and (b.owner_id = auth.uid() or public.is_admin()))
  );
```

Notes:

- Public pages are rendered server-side. Use the **service role key only on the server** to read by slug and to insert scan events.
- Never expose the service role key to the browser.

## 5. Storage buckets (Supabase Storage)

| Bucket          | Access                | Contents                                            |
| --------------- | --------------------- | --------------------------------------------------- |
| `logos`         | public read           | business logos, covers (max 2 MB, png/jpg/webp/svg) |
| `design-assets` | public read           | images uploaded into the card designer              |
| `exports`       | private (signed URLs) | generated PDFs/PNGs                                 |

Path convention: `{business_id}/{uuid}.{ext}`

## 6. Canvas JSON shape (designs.front_canvas)

Store the editor state in a stable, versioned format:

```json
{
  "version": 1,
  "unit": "mm",
  "width": 85.6,
  "height": 54,
  "bleed": 3,
  "background": { "type": "color", "value": "#ffffff" },
  "elements": [
    {
      "id": "e1",
      "type": "text",
      "x": 6,
      "y": 8,
      "w": 50,
      "h": 10,
      "rotation": 0,
      "text": "{{business.name}}",
      "font": "Poppins",
      "size": 14,
      "weight": 700,
      "color": "#111111",
      "align": "left"
    },
    {
      "id": "e2",
      "type": "qr",
      "x": 55,
      "y": 12,
      "w": 28,
      "h": 28,
      "locked_ratio": true,
      "data": "{{business.url}}?s={{card.source_tag}}",
      "fg": "#000000",
      "bg": "#ffffff",
      "ec": "Q",
      "logo": null
    },
    { "id": "e3", "type": "icon", "icon": "stars-5", "x": 6, "y": 30, "w": 30, "h": 6 },
    {
      "id": "e4",
      "type": "image",
      "src": "storage://design-assets/...",
      "x": 0,
      "y": 0,
      "w": 20,
      "h": 20
    }
  ]
}
```

- `{{...}}` placeholders are resolved at render/export time from the business, so a logo or name change flows into saved designs if the user chooses "sync".
- `version` allows future migrations of the editor format.

## 7. Key queries

**Resolve a slug (public page, server-side)**

```sql
select b.*, coalesce(json_agg(l order by l.sort_order) filter (where l.id is not null), '[]') as links
from public.businesses b
left join public.links l on l.business_id = b.id and l.is_visible
where b.slug = $1 and b.status = 'published'
group by b.id;
```

**Old slug fallback**

```sql
select b.slug from public.slug_history h
join public.businesses b on b.id = h.business_id
where h.old_slug = $1;
```

**Scans by source, last 30 days**

```sql
select source, count(*) from public.scan_events
where business_id = $1 and event_type = 'view'
  and created_at > now() - interval '30 days'
group by source;
```

**Top clicked links**

```sql
select l.label, count(*) as clicks
from public.scan_events e join public.links l on l.id = e.link_id
where e.business_id = $1 and e.event_type = 'click'
  and e.created_at > now() - interval '30 days'
group by l.label order by clicks desc;
```

## 8. Scaling and maintenance

- `scan_events` is the only high-volume table. Insert asynchronously (do not block the page render).
- When it passes ~10M rows: partition by month (`created_at`) or roll up into a `daily_stats(business_id, date, source, views, clicks)` table via a nightly job, keeping raw events for 90 days.
- Cache published pages at the edge; revalidate on business/link update.
- Backups: Supabase daily backups, plus export `businesses`, `links`, `slug_history` weekly (these must never be lost: they keep printed cards alive).
- Never hard-delete a published business's slug. Prefer `status = 'paused'`.

## 9. Privacy

- No names, phone numbers, emails or exact IPs of customers stored.
- `country` / `city` come from coarse IP lookup at the edge; the IP itself is discarded.
- Custom link URLs are validated on write (scheme allow-list) and again on redirect.

## 10. Future tables (not in v1)

- `subscriptions(id, business_id, plan, status, razorpay_id, current_period_end)`
- `domains(id, business_id, hostname, verified_at)` for custom domains
- `resellers`, `reseller_businesses` for agency mode
- `print_orders(id, business_id, design_id, qty, vendor, status, address)`
- `locations(id, business_id, place_id, name)` for multi-location chains
