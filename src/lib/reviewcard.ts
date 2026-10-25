export type LinkType =
  | "whatsapp"
  | "phone"
  | "email"
  | "instagram"
  | "facebook"
  | "website"
  | "menu"
  | "directions"
  | "custom"
  | "youtube"
  | "x"
  | "linkedin";

export interface BizLink {
  id: string;
  type: LinkType;
  label: string;
  value: string;
  hidden?: boolean;
  icon?: LinkType;
  message?: string;
}
export interface Business {
  id?: string;
  status?: "draft" | "published" | "paused" | "archived";
  placeId?: string;
  mapsUrl?: string;
  cover?: string;
  logoPath?: string;
  logoOriginalPath?: string;
  coverPath?: string;
  slug: string;
  name: string;
  tagline: string;
  logo?: string | undefined;
  logoOriginal?: string;
  logoShape?: "circle" | "rounded" | "square" | "rectangle";
  category: string;
  reviewUrl: string;
  links: BizLink[];
  buttonOrder?: string[];
  reviewLabel?: string;
  theme: {
    primary: string;
    buttonStyle: "rounded" | "pill" | "square";
    background?: string;
    text?: string;
    buttonBackground?: string;
    buttonText?: string;
    reviewText?: string;
    font?: "sans" | "serif";
    logoSize?: number;
    spacing?: number;
  };
}

const KEY = "reviewcard.businesses";
const RESERVED = ["admin", "api", "login", "new", "dashboard", "r", "app"];

export const LINK_LABELS: Record<LinkType, string> = {
  whatsapp: "WhatsApp",
  phone: "Call us",
  email: "Email",
  instagram: "Instagram",
  facebook: "Facebook",
  website: "Website",
  menu: "Menu",
  directions: "Directions",
  custom: "Link",
  youtube: "YouTube",
  x: "X",
  linkedin: "LinkedIn",
};

export const THEME_COLORS = ["#1f4d3a", "#b4532a", "#1e3a5f", "#7a2e3b", "#2b2b2b", "#8a6d1c"];

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Only https, http, tel, mailto are allowed anywhere. */
export function isSafeUrl(u: string) {
  try {
    return ["https:", "http:", "tel:", "mailto:"].includes(new URL(u).protocol);
  } catch {
    return false;
  }
}

export function buildLinkUrl(l: BizLink): string | null {
  const v = l.value.trim();
  if (!v) return null;
  // Explicit destinations override the button type, including Google links.
  if (/^https?:\/\//i.test(v)) return isSafeUrl(v) ? v : null;
  if (/^[a-z][a-z\d+.-]*:/i.test(v)) return isSafeUrl(v) ? v : null;
  let url = v;
  switch (l.type) {
    case "whatsapp":
      url = `https://wa.me/${v.replace(/\D/g, "")}${l.message ? `?text=${encodeURIComponent(l.message)}` : ""}`;
      break;
    case "phone":
      url = `tel:${v.replace(/[^\d+]/g, "")}`;
      break;
    case "email":
      url = `mailto:${v}`;
      break;
    case "instagram":
      url = v.startsWith("http") ? v : `https://instagram.com/${v.replace(/^@/, "")}`;
      break;
    case "directions":
      url = v.startsWith("http")
        ? v
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v)}`;
      break;
    default:
      if (!/^[a-z]+:/i.test(v)) url = `https://${v}`;
  }
  return isSafeUrl(url) ? url : null;
}

export function reviewUrlFromInput(v: string) {
  const t = v.trim();
  if (!t) return "";
  if (/^ChIJ[\w-]+$/.test(t)) return `https://search.google.com/local/writereview?placeid=${t}`;
  return /^https?:\/\//i.test(t) && isSafeUrl(t) ? t : "";
}

export const REVIEW_BUTTON_ID = "__review__";
export const MAX_LOGO_BYTES = 5 * 1024 * 1024;
export function logoSizeAllowed(size: number) {
  return size <= MAX_LOGO_BYTES;
}
export function isHexColor(value: string) {
  return /^#[\da-f]{6}$/i.test(value);
}
export function buttonIds(b: Business): string[] {
  const ids = b.links.map((l) => l.id);
  return [
    REVIEW_BUTTON_ID,
    ...new Set([...(b.buttonOrder ?? []).filter((id) => ids.includes(id)), ...ids]),
  ];
}
export function moveButton(b: Business, active: string, over: string): string[] {
  const order = buttonIds(b);
  const from = order.indexOf(active),
    to = order.indexOf(over);
  if (from <= 0 || to <= 0) return order;
  order.splice(from, 1);
  order.splice(to, 0, active);
  return order;
}

const SAMPLE: Business = {
  slug: "chai-corner",
  name: "Chai Corner",
  tagline: "Masala chai & fresh snacks since 1998",
  category: "Café",
  reviewUrl: "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4",
  links: [
    { id: "1", type: "whatsapp", label: "Order on WhatsApp", value: "919876543210" },
    { id: "2", type: "instagram", label: "Instagram", value: "@chaicorner" },
    { id: "3", type: "menu", label: "See our menu", value: "example.com/menu" },
    { id: "4", type: "directions", label: "Get directions", value: "Chai Corner, Bengaluru" },
  ],
  theme: { primary: "#1f4d3a", buttonStyle: "pill" },
};

export function loadBusinesses(): Business[] {
  if (typeof window === "undefined") return [SAMPLE];
  try {
    const raw = localStorage.getItem(KEY);
    const list: Business[] = raw ? JSON.parse(raw) : [];
    return list.some((b) => b.slug === SAMPLE.slug) ? list : [SAMPLE, ...list];
  } catch {
    return [SAMPLE];
  }
}

export function saveBusiness(b: Business) {
  const list = loadBusinesses().filter((x) => x.slug !== b.slug);
  localStorage.setItem(KEY, JSON.stringify([...list, b]));
}

export function slugAvailable(slug: string) {
  return (
    slug.length >= 3 && !RESERVED.includes(slug) && !loadBusinesses().some((b) => b.slug === slug)
  );
}

export function validSlug(slug: string) {
  return (
    /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug) &&
    ![...RESERVED, "auth", "settings"].includes(slug)
  );
}

/** QR encodes only the short URL plus a source tag. */
export function shortUrl(slug: string, source?: string) {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/r/${slug}${source ? `?s=${source}` : ""}`;
}
