import QRCode from "qrcode";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFImage,
  type PDFPage,
  type PDFFont,
} from "pdf-lib";
import type { CanvasElement } from "@/components/CardCanvaEditor";
import { STICKER_SVGS } from "@/components/CardCanvaEditor";

export const FORMATS = {
  card: { label: "Credit card", width: 85.6, height: 54 },
  a6: { label: "A6 table stand", width: 105, height: 148 },
  sticker: { label: "Square sticker", width: 50, height: 50 },
  a5: { label: "A5 poster", width: 148, height: 210 },
} as const;
export type Format = keyof typeof FORMATS;
export interface DesignElement {
  id: string;
  type: "text" | "qr" | "logo" | "shape";
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  fontSize?: number;
  color?: string;
  rotation?: number;
}
export interface CardDesign {
  format: Format;
  template: string;
  background: string;
  elements: DesignElement[];
  back: DesignElement[];
}
export const TEMPLATES = [
  "Food classic",
  "Food bold",
  "Salon elegant",
  "Salon modern",
  "Clinic clean",
  "Clinic calm",
  "Retail bold",
  "Minimal",
];
export function templateDesign(
  format: Format,
  template: string,
  name: string,
  primary = "#183b2a",
): CardDesign {
  const f = FORMATS[format];
  const qr = format === "card" ? 25 : format === "sticker" ? 30 : format === "a6" ? 40 : 50;
  const bold = template.toLowerCase().includes("bold");
  const elegant = template.toLowerCase().includes("elegant");
  const band = template !== "Minimal";
  const elements: DesignElement[] = [
    ...(band
      ? [
          {
            id: "brand-band",
            type: "shape" as const,
            x: 0,
            y: 0,
            width: f.width,
            height: 1.5,
            color: primary,
          },
        ]
      : []),
    {
      id: "name",
      type: "text",
      x: 4,
      y: 4,
      width: f.width - 8,
      height: 10,
      text: name,
      fontSize: format === "sticker" ? 3 : bold ? 6 : elegant ? 4.5 : 5,
      color: primary,
    },
    {
      id: "caption",
      type: "text",
      x: 4,
      y: format === "card" ? 19 : format === "sticker" ? 43 : 16,
      width: format === "card" ? f.width - qr - 16 : f.width - 8,
      height: format === "sticker" ? 3 : 12,
      text: format === "sticker" ? "Scan to review" : "Scan to review us on Google",
      fontSize: format === "sticker" ? 2 : 3,
      color: primary,
    },
    {
      id: "qr",
      type: "qr",
      x: format === "card" ? f.width - qr - 4 : (f.width - qr) / 2,
      y: format === "card" ? 20 : format === "sticker" ? 12 : 34,
      width: qr,
      height: qr,
    },
  ];
  return {
    format,
    template,
    background: template.includes("calm")
      ? "#e4f1ed"
      : template.includes("modern")
        ? "#f1edf7"
        : "#ffffff",
    elements,
    back: [
      {
        id: "back-title",
        type: "text",
        x: 4,
        y: 8,
        width: f.width - 8,
        height: 14,
        text: name,
        fontSize: 5,
        color: primary,
      },
      {
        id: "back-caption",
        type: "text",
        x: 4,
        y: 26,
        width: f.width - 8,
        height: 12,
        text: "Thank you for supporting local",
        fontSize: 3,
        color: primary,
      },
    ],
  };
}
export function scanWarnings(d: CardDesign, side: "elements" | "back" = "elements"): string[] {
  const els = d[side];
  const qr = els.find((e) => e.type === "qr");
  if (!qr) return side === "back" ? [] : ["Add a QR code to the front"];
  const warnings: string[] = [];
  if (qr.width < 25 || qr.height < 25) warnings.push("QR must be at least 25 mm");
  const f = FORMATS[d.format];
  if (qr.x < 4 || qr.y < 4 || qr.x + qr.width > f.width - 4 || qr.y + qr.height > f.height - 4)
    warnings.push("QR extends beyond the 4 mm safe area");
  if (
    els.some(
      (e) =>
        e.id !== qr.id &&
        e.x < qr.x + qr.width &&
        e.x + e.width > qr.x &&
        e.y < qr.y + qr.height &&
        e.y + e.height > qr.y,
    )
  )
    warnings.push("Another element overlaps the QR code");
  return warnings;
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const pt = (mm: number) => (mm * 72) / 25.4;
const colour = (hex: string) => {
  const h = hex.replace("#", "");
  return rgb(
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  );
};
export async function exportCardPdf(d: CardDesign, url: string, logo?: string) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const f = FORMATS[d.format];
  const pad = 8;
  const width = pt(f.width + pad * 2),
    height = pt(f.height + pad * 2);
  for (const elements of [d.elements, d.back]) {
    const page = pdf.addPage([width, height]);
    page.setTrimBox(pt(pad), pt(pad), pt(f.width), pt(f.height));
    page.setBleedBox(pt(pad - 3), pt(pad - 3), pt(f.width + 6), pt(f.height + 6));
    page.drawRectangle({
      x: pt(pad - 3),
      y: pt(pad - 3),
      width: pt(f.width + 6),
      height: pt(f.height + 6),
      color: colour(d.background),
    });
    for (const e of elements) {
      const x = pt(pad + e.x),
        y = height - pt(pad + e.y + e.height);
      if (e.type === "qr") {
        const qr = QRCode.create(url, { errorCorrectionLevel: "Q" });
        const count = qr.modules.size;
        const module = pt(e.width) / (count + 8);
        page.drawRectangle({ x, y, width: pt(e.width), height: pt(e.height), color: rgb(1, 1, 1) });
        for (let row = 0; row < count; row++)
          for (let col = 0; col < count; col++)
            if (qr.modules.get(row, col))
              page.drawRectangle({
                x: x + (col + 4) * module,
                y: y + pt(e.height) - (row + 5) * module,
                width: module,
                height: module,
                color: rgb(0, 0, 0),
              });
      } else if (e.type === "text") {
        const size = pt(e.fontSize ?? 3);
        const words = (e.text ?? "").replace(/[^\x20-\x7E]/g, "?").split(/\s+/);
        let line = "",
          yy = height - pt(pad + e.y) - size;
        for (const word of words) {
          const candidate = line ? `${line} ${word}` : word;
          if (font.widthOfTextAtSize(candidate, size) > pt(e.width) && line) {
            page.drawText(line, { x, y: yy, size, font, color: colour(e.color ?? "#183b2a") });
            yy -= size * 1.2;
            line = word;
          } else line = candidate;
        }
        if (line)
          page.drawText(line, { x, y: yy, size, font, color: colour(e.color ?? "#183b2a") });
      } else if (e.type === "shape")
        page.drawRectangle({
          x,
          y,
          width: pt(e.width),
          height: pt(e.height),
          color: colour(e.color ?? "#183b2a"),
        });
      else if (e.type === "logo" && logo) {
        const image = await loadPdfImage(pdf, logo);
        if (image) {
          page.drawImage(image, { x, y, width: pt(e.width), height: pt(e.height) });
        }
      }
    }
    const marks = [
      { x: pt(pad), y: pt(pad) },
      { x: pt(pad + f.width), y: pt(pad) },
      { x: pt(pad), y: pt(pad + f.height) },
      { x: pt(pad + f.width), y: pt(pad + f.height) },
    ];
    for (const m of marks) {
      const left = m.x === pt(pad),
        bottom = m.y === pt(pad);
      page.drawLine({
        start: { x: m.x + (left ? -pt(6) : pt(4)), y: m.y },
        end: { x: m.x + (left ? -pt(4) : pt(6)), y: m.y },
        thickness: 0.4,
        color: rgb(0, 0, 0),
      });
      page.drawLine({
        start: { x: m.x, y: m.y + (bottom ? -pt(6) : pt(4)) },
        end: { x: m.x, y: m.y + (bottom ? -pt(4) : pt(6)) },
        thickness: 0.4,
        color: rgb(0, 0, 0),
      });
    }
  }
  const bytes = await pdf.save();
  downloadBlob(
    new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
    "reviewcard-print.pdf",
  );
}

export interface ReviewCardSheetOptions {
  name: string;
  category: string;
  url: string;
  color: string;
  headline?: string | undefined;
  qrDotColor?: string | undefined;
  qrBgColor?: string | undefined;
  includeNfc?: boolean | undefined;
  includeStars?: boolean | undefined;
  logo?: string | null | undefined;
  isUniversal?: boolean | undefined;
  universalBadge?: "google" | "star" | "nfc" | "heart" | undefined;
  universalTitle?: string | undefined;
  universalSubtitle?: string | undefined;
  cardId?: string | undefined;
  customDesign?: string | null | undefined;
  qrX?: number | undefined;
  qrY?: number | undefined;
  qrSize?: number | undefined;
  qrFrame?: "white" | "none" | "dark" | undefined;
  elements?: CanvasElement[] | undefined;
}

export interface ExportCardPdfOptions {
  card: ReviewCardSheetOptions;
  copies?: number | undefined; // 1, 2, 4, etc.
  layout?: "a6-single" | "a4-2cards" | "a4-4cards" | undefined;
  showCutGuidelines?: boolean | undefined;
}

// Vector SVG Assets for Pixel-Perfect PDF Export (Rendered at 300 DPI)
const GOOGLE_G_BADGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="#ffffff"/><g transform="translate(46, 46)"><path fill="#4285F4" d="M106.85 55.21c0-3.15-.27-6.3-8.55-9.31H54v20.29h29.7c-1.3 6.84-5.13 12.6-10.8 16.56v13.72h17.46c10.21-9.4 16.49-23.26 16.49-41.26z"/><path fill="#34A853" d="M54 108c14.58 0 26.77-4.86 35.68-13.09l-17.46-13.72c-4.86 3.24-11.02 5.22-18.22 5.22-14.04 0-25.96-9.45-30.24-22.18H5.62v14.17C14.67 96.12 33.12 108 54 108z"/><path fill="#FBBC05" d="M23.76 64.23c-1.12-3.24-1.71-6.7-1.71-10.23s.59-6.99 1.71-10.23V29.6H5.62C1.98 36.81 0 45.09 0 54s1.98 17.19 5.62 24.4l18.14-14.17z"/><path fill="#EA4335" d="M54 21.37c7.96 0 15.07 2.74 20.7 8.1l15.39-15.39C80.73 5.35 68.54 0 54 0 33.12 0 14.67 11.88 5.62 29.6l18.14 14.17c4.28-12.73 16.2-22.4 30.24-22.4z"/></g></svg>`;

const GOOGLE_G_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>`;

const FIVE_STARS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="56" viewBox="0 0 160 26"><g fill="#f59e0b">${[0, 1, 2, 3, 4].map((i) => `<path transform="translate(${i * 32 + 4}, 1)" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>`).join("")}</g></svg>`;

const NFC_BOTTOM_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round"><path d="M5.5 9.4 A 3.2 3.2 0 0 1 5.5 14.6" /><path d="M9.2 7.2 A 6.2 6.2 0 0 1 9.2 16.8" /><path d="M13.0 5.0 A 9.5 9.5 0 0 1 13.0 19.0" /><path d="M16.8 2.8 A 13.0 13.0 0 0 1 16.8 21.2" /></svg>`;

const STAR_BADGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="#ffffff"/><path fill="#f59e0b" transform="translate(40, 40) scale(5)" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;

const HEART_BADGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="#ffffff"/><path fill="#059669" transform="translate(40, 40) scale(5)" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

const NFC_BLUE_BADGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 24 24" fill="none" stroke-width="2.3" stroke-linecap="round"><path d="M5.5 9.4 A 3.2 3.2 0 0 1 5.5 14.6" stroke="#4285F4" /><path d="M9.2 7.2 A 6.2 6.2 0 0 1 9.2 16.8" stroke="#EA4335" /><path d="M13.0 5.0 A 9.5 9.5 0 0 1 13.0 19.0" stroke="#FBBC05" /><path d="M16.8 2.8 A 13.0 13.0 0 0 1 16.8 21.2" stroke="#34A853" /></svg>`;

const WHITE_PANEL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="680" viewBox="0 0 85 85"><rect x="0" y="0" width="85" height="85" rx="4.5" ry="4.5" fill="#ffffff"/></svg>`;

const WHITE_CIRCLE_BADGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="#ffffff"/></svg>`;

export function sanitizePdfText(text: string): string {
  return (text || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

export interface FittedTextLines {
  lines: string[];
  fontSize: number;
}

export function fitTextLines(
  text: string,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  maxWidth: number,
  maxLines: number = 2,
  startSize: number = 11.5,
  minSize: number = 7.0,
): FittedTextLines {
  const clean = sanitizePdfText(text);
  if (!clean) return { lines: [], fontSize: startSize };

  // 1. Check if the full text fits on a single line (from startSize down to 8.5)
  for (let s = startSize; s >= 8.5; s -= 0.5) {
    if (font.widthOfTextAtSize(clean, s) <= maxWidth) {
      return { lines: [clean], fontSize: s };
    }
  }

  if (maxLines === 1) {
    for (let s = 8.0; s >= minSize; s -= 0.5) {
      if (font.widthOfTextAtSize(clean, s) <= maxWidth) {
        return { lines: [clean], fontSize: s };
      }
    }
    return { lines: [clean], fontSize: minSize };
  }

  // 2. Try wrapping into 2 balanced lines
  const words = clean.split(/\s+/);
  if (words.length === 1) {
    const word = words[0]!;
    const mid = Math.ceil(word.length / 2);
    for (let s = 10.0; s >= minSize; s -= 0.5) {
      const l1 = word.slice(0, mid);
      const l2 = word.slice(mid);
      if (Math.max(font.widthOfTextAtSize(l1, s), font.widthOfTextAtSize(l2, s)) <= maxWidth) {
        return { lines: [l1, l2], fontSize: s };
      }
    }
    return { lines: [word.slice(0, mid), word.slice(mid)], fontSize: minSize };
  }

  // Find optimal word split for 2 lines: try larger font sizes first
  for (let s = 10.5; s >= minSize; s -= 0.5) {
    for (let i = 1; i < words.length; i++) {
      const l1 = words.slice(0, i).join(" ");
      const l2 = words.slice(i).join(" ");
      if (font.widthOfTextAtSize(l1, s) <= maxWidth && font.widthOfTextAtSize(l2, s) <= maxWidth) {
        return { lines: [l1, l2], fontSize: s };
      }
    }
  }

  // Fallback: split near middle at minSize so full text is always shown
  let bestIdx = 1;
  let minDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const l1 = words.slice(0, i).join(" ");
    const l2 = words.slice(i).join(" ");
    const diff = Math.abs(l1.length - l2.length);
    if (diff < minDiff) {
      minDiff = diff;
      bestIdx = i;
    }
  }
  return {
    lines: [words.slice(0, bestIdx).join(" "), words.slice(bestIdx).join(" ")],
    fontSize: minSize,
  };
}

export function fitSingleLineText(
  text: string,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  maxWidth: number,
  startSize: number = 7.0,
  minSize: number = 5.2,
): { text: string; fontSize: number } {
  const clean = sanitizePdfText(text);
  if (!clean) return { text: "", fontSize: startSize };
  for (let s = startSize; s >= minSize; s -= 0.3) {
    if (font.widthOfTextAtSize(clean, s) <= maxWidth) {
      return { text: clean, fontSize: Number(s.toFixed(1)) };
    }
  }
  return { text: clean, fontSize: minSize };
}

function getCardBgSvg(colorHex: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="1088" viewBox="0 0 95 136"><rect x="0" y="0" width="95" height="136" rx="5" ry="5" fill="${colorHex}"/></svg>`;
}

async function loadPdfImage(pdf: PDFDocument, src: string): Promise<PDFImage | null> {
  try {
    const dataUrl = src.startsWith("data:")
      ? src
      : src.startsWith("<svg")
        ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(src)}`
        : src;

    if (typeof document !== "undefined") {
      const pngBytes = await new Promise<Uint8Array | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const baseW = img.naturalWidth || 300;
            const baseH = img.naturalHeight || 300;
            const scaleFactor = Math.max(2, Math.min(4, Math.ceil(1600 / Math.max(baseW, baseH))));
            canvas.width = Math.max(baseW * scaleFactor, 1200);
            canvas.height = Math.max(baseH * scaleFactor, 1200);
            const ctx = canvas.getContext("2d");
            if (!ctx) return resolve(null);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              if (!blob) return resolve(null);
              blob
                .arrayBuffer()
                .then((buf) => resolve(new Uint8Array(buf)))
                .catch(() => resolve(null));
            }, "image/png");
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = dataUrl;
      });

      if (pngBytes) {
        return await pdf.embedPng(pngBytes);
      }
    }

    if (dataUrl.startsWith("data:image/svg+xml")) {
      return null;
    }

    const res = await fetch(dataUrl);
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf[0] === 0x89 && buf[1] === 0x50) {
      return await pdf.embedPng(buf);
    }
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      return await pdf.embedJpg(buf);
    }
    try {
      return await pdf.embedPng(buf);
    } catch {
      return await pdf.embedJpg(buf);
    }
  } catch (e) {
    console.warn("Could not embed image in PDF:", e);
    return null;
  }
}

export async function exportA4SheetPdf(
  cardOrCards: ReviewCardSheetOptions | ReviewCardSheetOptions[],
) {
  const cards = Array.isArray(cardOrCards) ? cardOrCards : [cardOrCards];
  const firstCard = cards[0];
  if (!firstCard) return;
  const pdf = await PDFDocument.create();
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);

  // 1. Preload common vector marks and icons
  const [
    googleBadgeImg,
    googleGIconImg,
    fiveStarsImg,
    nfcBottomIconImg,
    starBadgeImg,
    heartBadgeImg,
    nfcBadgeImg,
    whitePanelImg,
    whiteCircleBadgeImg,
  ] = await Promise.all([
    loadPdfImage(pdf, GOOGLE_G_BADGE_SVG),
    loadPdfImage(pdf, GOOGLE_G_ICON_SVG),
    loadPdfImage(pdf, FIVE_STARS_SVG),
    loadPdfImage(pdf, NFC_BOTTOM_ICON_SVG),
    loadPdfImage(pdf, STAR_BADGE_SVG),
    loadPdfImage(pdf, HEART_BADGE_SVG),
    loadPdfImage(pdf, NFC_BLUE_BADGE_SVG),
    loadPdfImage(pdf, WHITE_PANEL_SVG),
    loadPdfImage(pdf, WHITE_CIRCLE_BADGE_SVG),
  ]);

  // Preload card backgrounds, custom logos, and uploaded custom designs
  const cardBgMap = new Map<string, PDFImage>();
  const logoMap = new Map<string, PDFImage>();
  const customDesignMap = new Map<string, PDFImage>();

  for (const c of cards) {
    const col = c.color || "#1a73e8";
    if (!cardBgMap.has(col)) {
      const bgImg = await loadPdfImage(pdf, getCardBgSvg(col));
      if (bgImg) cardBgMap.set(col, bgImg);
    }
    if (c.logo && !logoMap.has(c.logo)) {
      const img = await loadPdfImage(pdf, c.logo);
      if (img) logoMap.set(c.logo, img);
    }
    if (c.customDesign && !customDesignMap.has(c.customDesign)) {
      const img = await loadPdfImage(pdf, c.customDesign);
      if (img) customDesignMap.set(c.customDesign, img);
    }
  }

  // A4 dimensions in pt (210 x 297 mm)
  const pageWidth = pt(210);
  const pageHeight = pt(297);

  // Card size: 95 x 136 mm
  const cardW = 95;
  const cardH = 136;
  const marginX = 7;
  const marginY = 9.5;
  const gapX = 6;
  const gapY = 6;

  const positions = [
    { x: marginX, y: 297 - marginY - cardH }, // Top Left (Slot 1)
    { x: marginX + cardW + gapX, y: 297 - marginY - cardH }, // Top Right (Slot 2)
    { x: marginX, y: 297 - marginY - cardH - gapY - cardH }, // Bottom Left (Slot 3)
    { x: marginX + cardW + gapX, y: 297 - marginY - cardH - gapY - cardH }, // Bottom Right (Slot 4)
  ];

  const cardsPerPage = 4;
  const numPages = Math.max(1, Math.ceil(cards.length / cardsPerPage));

  for (let pageIdx = 0; pageIdx < numPages; pageIdx++) {
    const page = pdf.addPage([pageWidth, pageHeight]);

    // Cut guidelines across page (subtle dashed print marks)
    const cutColor = rgb(0.72, 0.75, 0.8);
    page.drawLine({
      start: { x: 0, y: pt(297 - marginY - cardH - gapY / 2) },
      end: { x: pageWidth, y: pt(297 - marginY - cardH - gapY / 2) },
      thickness: 0.5,
      dashArray: [4, 3],
      color: cutColor,
    });
    page.drawLine({
      start: { x: pt(marginX + cardW + gapX / 2), y: 0 },
      end: { x: pt(marginX + cardW + gapX / 2), y: pageHeight },
      thickness: 0.5,
      dashArray: [4, 3],
      color: cutColor,
    });

    for (let i = 0; i < positions.length; i++) {
      const cardIndex = pageIdx * cardsPerPage + i;
      if (cardIndex >= cards.length && cards.length > 1) continue;
      const pos = positions[i];
      if (!pos) continue;
      const card = cards[cardIndex] ?? firstCard;
      const primaryCol = colour(card.color || "#1a73e8");
      const x = pt(pos.x);
      const y = pt(pos.y);
      const w = pt(cardW);
      const h = pt(cardH);

      // --- CUSTOM UPLOADED CANVA DESIGN WITH DRAGGABLE QR CODE ---
      if (card.customDesign && customDesignMap.has(card.customDesign)) {
        const designImg = customDesignMap.get(card.customDesign)!;
        page.drawImage(designImg, { x, y, width: w, height: h });

        const qrMmSize = card.qrSize ?? 40;
        const qrMmX = card.qrX ?? (cardW - qrMmSize) / 2;
        const qrMmY = card.qrY ?? (cardH - qrMmSize) / 2;

        const qrPtSize = pt(qrMmSize);
        const qrPtX = x + pt(qrMmX);
        const qrPtY = y + h - pt(qrMmY + qrMmSize);

        const qrBgCol = colour(card.qrBgColor || "#ffffff");
        const qrDotCol = colour(card.qrDotColor || "#000000");

        if (card.qrFrame === "white") {
          const pad = pt(2);
          page.drawRectangle({
            x: qrPtX - pad,
            y: qrPtY - pad,
            width: qrPtSize + pad * 2,
            height: qrPtSize + pad * 2,
            color: rgb(1, 1, 1),
          });
        } else if (card.qrFrame === "dark") {
          const pad = pt(2);
          page.drawRectangle({
            x: qrPtX - pad,
            y: qrPtY - pad,
            width: qrPtSize + pad * 2,
            height: qrPtSize + pad * 2,
            color: rgb(0.06, 0.09, 0.16),
          });
        }

        const qr = QRCode.create(card.url, { errorCorrectionLevel: "M" });
        const count = qr.modules.size;
        const module = qrPtSize / (count + 4);

        if (card.qrFrame !== "none") {
          page.drawRectangle({
            x: qrPtX,
            y: qrPtY,
            width: qrPtSize,
            height: qrPtSize,
            color: qrBgCol,
          });
        }

        for (let r = 0; r < count; r++) {
          for (let c = 0; c < count; c++) {
            if (qr.modules.get(r, c)) {
              page.drawRectangle({
                x: qrPtX + (c + 2) * module,
                y: qrPtY + qrPtSize - (r + 3) * module,
                width: module,
                height: module,
                color: qrDotCol,
              });
            }
          }
        }

        continue;
      }

      // 1. Card Background with 5mm rounded corners
      const bgImg = cardBgMap.get(card.color || "#1a73e8");
      if (bgImg) {
        page.drawImage(bgImg, { x, y, width: w, height: h });
      } else {
        page.drawRectangle({ x, y, width: w, height: h, color: primaryCol });
      }

      // 2. Card Header
      const avatarSize = pt(14);
      const avatarX = x + pt(5);
      const avatarY = y + h - pt(5.5) - avatarSize;
      const textX = avatarX + avatarSize + pt(3.5);
      const maxTextWidth = w - pt(5) - (textX - x);

      if (card.isUniversal) {
        const badgeImg =
          card.universalBadge === "star"
            ? starBadgeImg
            : card.universalBadge === "heart"
              ? heartBadgeImg
              : card.universalBadge === "nfc"
                ? nfcBadgeImg
                : googleBadgeImg;

        if (badgeImg) {
          page.drawImage(badgeImg, {
            x: avatarX,
            y: avatarY,
            width: avatarSize,
            height: avatarSize,
          });
        }

        const titleFit = fitTextLines(
          card.universalTitle || "REVIEW US ON GOOGLE",
          fontBold,
          maxTextWidth,
          2,
          10.5,
          7.0,
        );
        const subFit = fitSingleLineText(
          card.universalSubtitle || "SCAN OR TAP WITH PHONE",
          fontRegular,
          maxTextWidth,
          6.8,
          5.2,
        );

        if (titleFit.lines.length === 1) {
          page.drawText(titleFit.lines[0]!, {
            x: textX,
            y: avatarY + pt(7.5),
            size: titleFit.fontSize,
            font: fontBold,
            color: rgb(1, 1, 1),
          });
          page.drawText(subFit.text, {
            x: textX,
            y: avatarY + pt(1.8),
            size: subFit.fontSize,
            font: fontRegular,
            color: rgb(0.92, 0.92, 0.92),
          });
        } else if (titleFit.lines.length >= 2) {
          page.drawText(titleFit.lines[0]!, {
            x: textX,
            y: avatarY + pt(9.5),
            size: titleFit.fontSize,
            font: fontBold,
            color: rgb(1, 1, 1),
          });
          page.drawText(titleFit.lines[1]!, {
            x: textX,
            y: avatarY + pt(5.3),
            size: titleFit.fontSize,
            font: fontBold,
            color: rgb(1, 1, 1),
          });
          page.drawText(subFit.text, {
            x: textX,
            y: avatarY + pt(1.2),
            size: subFit.fontSize,
            font: fontRegular,
            color: rgb(0.92, 0.92, 0.92),
          });
        }
      } else {
        const logoImg = card.logo ? logoMap.get(card.logo) : undefined;
        if (logoImg) {
          page.drawImage(logoImg, {
            x: avatarX,
            y: avatarY,
            width: avatarSize,
            height: avatarSize,
          });
        } else {
          // Circular badge with business initials
          if (whiteCircleBadgeImg) {
            page.drawImage(whiteCircleBadgeImg, {
              x: avatarX,
              y: avatarY,
              width: avatarSize,
              height: avatarSize,
            });
          } else {
            page.drawRectangle({
              x: avatarX,
              y: avatarY,
              width: avatarSize,
              height: avatarSize,
              color: rgb(1, 1, 1),
            });
          }
          const initials =
            card.name
              .split(" ")
              .map((w) => w[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase() || "RC";
          const initSize = initials.length > 2 ? 9.5 : 11;
          const initW = fontBold.widthOfTextAtSize(initials, initSize);
          page.drawText(initials, {
            x: avatarX + (avatarSize - initW) / 2,
            y: avatarY + (avatarSize - initSize) / 2 + 1,
            size: initSize,
            font: fontBold,
            color: primaryCol,
          });
        }

        // Full Business Name without truncation (auto-fits 1 or 2 lines)
        const nameText = (card.name || "Business Name").trim();
        const hasCategory = Boolean(card.category && card.category.trim());
        const catText = (card.category || "Business").trim().toUpperCase();

        const nameFit = fitTextLines(nameText, fontBold, maxTextWidth, 2, 12.0, 7.2);
        const catFit = fitSingleLineText(catText, fontRegular, maxTextWidth, 7.0, 5.2);

        if (nameFit.lines.length === 1) {
          if (hasCategory) {
            page.drawText(nameFit.lines[0]!, {
              x: textX,
              y: avatarY + pt(7.8),
              size: nameFit.fontSize,
              font: fontBold,
              color: rgb(1, 1, 1),
            });
            page.drawText(catFit.text, {
              x: textX,
              y: avatarY + pt(1.8),
              size: catFit.fontSize,
              font: fontRegular,
              color: rgb(0.92, 0.92, 0.92),
            });
          } else {
            const centeredY = avatarY + (avatarSize - nameFit.fontSize) / 2 + 1;
            page.drawText(nameFit.lines[0]!, {
              x: textX,
              y: centeredY,
              size: nameFit.fontSize,
              font: fontBold,
              color: rgb(1, 1, 1),
            });
          }
        } else if (nameFit.lines.length >= 2) {
          if (hasCategory) {
            page.drawText(nameFit.lines[0]!, {
              x: textX,
              y: avatarY + pt(9.6),
              size: nameFit.fontSize,
              font: fontBold,
              color: rgb(1, 1, 1),
            });
            page.drawText(nameFit.lines[1]!, {
              x: textX,
              y: avatarY + pt(5.3),
              size: nameFit.fontSize,
              font: fontBold,
              color: rgb(1, 1, 1),
            });
            page.drawText(catFit.text, {
              x: textX,
              y: avatarY + pt(1.2),
              size: catFit.fontSize,
              font: fontRegular,
              color: rgb(0.92, 0.92, 0.92),
            });
          } else {
            page.drawText(nameFit.lines[0]!, {
              x: textX,
              y: avatarY + pt(7.8),
              size: nameFit.fontSize,
              font: fontBold,
              color: rgb(1, 1, 1),
            });
            page.drawText(nameFit.lines[1]!, {
              x: textX,
              y: avatarY + pt(3.6),
              size: nameFit.fontSize,
              font: fontBold,
              color: rgb(1, 1, 1),
            });
          }
        }
      }

      // 3. Inner White Review Panel (4.5mm rounded corners)
      const panelPadX = pt(5);
      const panelX = x + panelPadX;
      const panelW = w - panelPadX * 2;
      const panelH = pt(85);
      const panelY = y + pt(16);

      if (whitePanelImg) {
        page.drawImage(whitePanelImg, {
          x: panelX,
          y: panelY,
          width: panelW,
          height: panelH,
        });
      } else {
        page.drawRectangle({
          x: panelX,
          y: panelY,
          width: panelW,
          height: panelH,
          color: rgb(1, 1, 1),
        });
      }

      // Panel Header: Google "G" logo icon + "Google Reviews"
      const googleGSize = pt(5.2);
      const googleText = "Google Reviews";
      const gTextW = fontBold.widthOfTextAtSize(googleText, 8.5);
      const totalGoogleW = googleGSize + pt(1.8) + gTextW;
      const googleStartX = panelX + (panelW - totalGoogleW) / 2;
      const googleY = panelY + panelH - pt(7.5);

      if (googleGIconImg) {
        page.drawImage(googleGIconImg, {
          x: googleStartX,
          y: googleY - pt(0.5),
          width: googleGSize,
          height: googleGSize,
        });
      }
      page.drawText(googleText, {
        x: googleStartX + googleGSize + pt(1.8),
        y: googleY + pt(0.8),
        size: 8.5,
        font: fontBold,
        color: rgb(0.12, 0.16, 0.24),
      });

      // 5 Golden Stars
      if (card.includeStars !== false) {
        const starsW = pt(30);
        const starsH = pt(5);
        if (fiveStarsImg) {
          page.drawImage(fiveStarsImg, {
            x: panelX + (panelW - starsW) / 2,
            y: panelY + panelH - pt(14),
            width: starsW,
            height: starsH,
          });
        }
      }

      // Headline (dynamically auto-fitted to review panel width)
      const headline = sanitizePdfText(card.headline || "Review Us On Google");
      const maxHeadW = panelW - pt(6);
      let headSize = 10.5;
      while (headSize > 7.5 && fontBold.widthOfTextAtSize(headline, headSize) > maxHeadW) {
        headSize -= 0.5;
      }
      const headW = fontBold.widthOfTextAtSize(headline, headSize);
      page.drawText(headline, {
        x: panelX + (panelW - headW) / 2,
        y: panelY + panelH - pt(19),
        size: headSize,
        font: fontBold,
        color: primaryCol,
      });

      // QR Code
      const qrSize = pt(40);
      const qrX = panelX + (panelW - qrSize) / 2;
      const qrY = panelY + pt(11);
      const qr = QRCode.create(card.url, { errorCorrectionLevel: "M" });
      const count = qr.modules.size;
      const module = qrSize / (count + 4);

      const qrBgCol = colour(card.qrBgColor || "#ffffff");
      const qrDotCol = colour(card.qrDotColor || "#000000");

      page.drawRectangle({
        x: qrX,
        y: qrY,
        width: qrSize,
        height: qrSize,
        color: qrBgCol,
      });

      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (qr.modules.get(r, c)) {
            page.drawRectangle({
              x: qrX + (c + 2) * module,
              y: qrY + qrSize - (r + 3) * module,
              width: module,
              height: module,
              color: qrDotCol,
            });
          }
        }
      }

      // Short URL under QR Code (matching templet.html)
      const rawUrl = card.url ? card.url.replace(/^https?:\/\//i, "") : "reviewcard.link";
      const displayUrl = rawUrl.length > 30 ? rawUrl.slice(0, 28) + "…" : rawUrl;
      const urlW = fontBold.widthOfTextAtSize(displayUrl, 7.2);
      page.drawText(displayUrl, {
        x: panelX + (panelW - urlW) / 2,
        y: panelY + pt(3.8),
        size: 7.2,
        font: fontBold,
        color: rgb(0.28, 0.33, 0.41),
      });

      // Printed Card ID (if present)
      if (card.cardId) {
        const idText = `ID: ${card.cardId}`;
        const idW = fontBold.widthOfTextAtSize(idText, 6);
        page.drawText(idText, {
          x: panelX + (panelW - idW) / 2,
          y: panelY + pt(1.2),
          size: 6,
          font: fontBold,
          color: rgb(0.45, 0.52, 0.62),
        });
      }

      // 4. Bottom NFC Bar (Centered transparent broadcast waves without background circle)
      if (card.includeNfc !== false) {
        const nfcIconSize = pt(8.5);
        const topText = "Tap Phone on Card";
        const topTextW = fontBold.widthOfTextAtSize(topText, 8.5);
        const subText = "Instant NFC review link";
        const subTextW = fontRegular.widthOfTextAtSize(subText, 6.8);
        const textBlockW = Math.max(topTextW, subTextW);
        const totalNfcW = nfcIconSize + pt(3.5) + textBlockW;
        const nfcStartX = x + (w - totalNfcW) / 2;

        if (nfcBottomIconImg) {
          page.drawImage(nfcBottomIconImg, {
            x: nfcStartX,
            y: y + pt(3.5),
            width: nfcIconSize,
            height: nfcIconSize,
          });
        }

        page.drawText(topText, {
          x: nfcStartX + nfcIconSize + pt(3.5),
          y: y + pt(8.5),
          size: 8.5,
          font: fontBold,
          color: rgb(1, 1, 1),
        });

        page.drawText(subText, {
          x: nfcStartX + nfcIconSize + pt(3.5),
          y: y + pt(5.0),
          size: 6.8,
          font: fontRegular,
          color: rgb(0.92, 0.92, 0.92),
        });
      }
    }
  }

  const bytes = await pdf.save();
  const pdfName =
    Array.isArray(cardOrCards) && cardOrCards.length > 1
      ? `reviewcards-batch-${cardOrCards.length}-cards.pdf`
      : `reviewcard-${(firstCard.name || "card").toLowerCase().replace(/[^a-z0-9]/g, "-")}-a4-sheet.pdf`;

  downloadBlob(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), pdfName);
}

// -------------------------------------------------------------
// STANDALONE A6 & MULTI-QUANTITY REVIEW CARD PDF EXPORT ENGINE
// -------------------------------------------------------------

async function renderSingleCardOnPage(
  pdf: PDFDocument,
  page: PDFPage,
  card: ReviewCardSheetOptions,
  x: number, // in pt
  y: number, // in pt
  w: number, // in pt
  h: number, // in pt
  cardMmW: number,
  cardMmH: number,
  assets: {
    googleBadgeImg: PDFImage | null;
    googleGIconImg: PDFImage | null;
    fiveStarsImg: PDFImage | null;
    nfcBottomIconImg: PDFImage | null;
    starBadgeImg: PDFImage | null;
    heartBadgeImg: PDFImage | null;
    nfcBadgeImg: PDFImage | null;
    whitePanelImg: PDFImage | null;
    whiteCircleBadgeImg: PDFImage | null;
  },
  fonts: { bold: PDFFont; regular: PDFFont },
  preloaded: {
    cardBgMap: Map<string, PDFImage>;
    logoMap: Map<string, PDFImage>;
    customDesignMap: Map<string, PDFImage>;
    stickerMap: Map<string, PDFImage>;
  },
) {
  const primaryCol = colour(card.color || "#1a73e8");
  const scale = cardMmW / 105; // Relative to A6 base width (105mm)

  // --- BRANCH 1: CANVA STUDIO INTERACTIVE ELEMENTS ---
  if (card.elements && card.elements.length > 0) {
    if (card.customDesign && preloaded.customDesignMap.has(card.customDesign)) {
      const designImg = preloaded.customDesignMap.get(card.customDesign)!;
      page.drawImage(designImg, { x, y, width: w, height: h });
    } else {
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        color: primaryCol,
      });
    }

    for (const elem of card.elements) {
      if (elem.type === "text") {
        const cleanText = sanitizePdfText(elem.text || "");
        if (!cleanText) continue;
        const fontSize = Math.max(5, (elem.fontSize || 12) * scale * 0.95);
        const font = elem.fontWeight === "bold" ? fonts.bold : fonts.regular;
        const fontCol = colour(elem.fill || "#ffffff");
        const textW = font.widthOfTextAtSize(cleanText, fontSize);
        let textX = x + pt(elem.x * scale);
        if (elem.align === "center") {
          textX += (pt(elem.width * scale) - textW) / 2;
        } else if (elem.align === "right") {
          textX += pt(elem.width * scale) - textW;
        }
        const textY = y + h - pt((elem.y + (elem.height || 8)) * scale);
        page.drawText(cleanText, {
          x: textX,
          y: textY,
          size: fontSize,
          font,
          color: fontCol,
        });
      } else if (elem.type === "qr") {
        const qrMmSize = (elem.width || 40) * scale;
        const qrPtSize = pt(qrMmSize);
        const qrPtX = x + pt(elem.x * scale);
        const qrPtY = y + h - pt((elem.y + (elem.width || 40)) * scale);

        const qrBgCol = colour(card.qrBgColor || "#ffffff");
        const qrDotCol = colour(card.qrDotColor || "#000000");

        if (elem.qrFrame === "white") {
          const pad = pt(2 * scale);
          page.drawRectangle({
            x: qrPtX - pad,
            y: qrPtY - pad,
            width: qrPtSize + pad * 2,
            height: qrPtSize + pad * 2,
            color: rgb(1, 1, 1),
          });
        } else if (elem.qrFrame === "dark") {
          const pad = pt(2 * scale);
          page.drawRectangle({
            x: qrPtX - pad,
            y: qrPtY - pad,
            width: qrPtSize + pad * 2,
            height: qrPtSize + pad * 2,
            color: rgb(0.06, 0.09, 0.16),
          });
        }

        const qr = QRCode.create(card.url, { errorCorrectionLevel: "M" });
        const count = qr.modules.size;
        const module = qrPtSize / (count + 4);

        if (elem.qrFrame !== "none") {
          page.drawRectangle({
            x: qrPtX,
            y: qrPtY,
            width: qrPtSize,
            height: qrPtSize,
            color: qrBgCol,
          });
        }

        for (let r = 0; r < count; r++) {
          for (let c = 0; c < count; c++) {
            if (qr.modules.get(r, c)) {
              page.drawRectangle({
                x: qrPtX + (c + 2) * module,
                y: qrPtY + qrPtSize - (r + 3) * module,
                width: module,
                height: module,
                color: qrDotCol,
              });
            }
          }
        }
      } else if (elem.type === "logo" && card.logo && preloaded.logoMap.has(card.logo)) {
        const logoImg = preloaded.logoMap.get(card.logo)!;
        const logoX = x + pt(elem.x * scale);
        const logoY = y + h - pt((elem.y + elem.height) * scale);
        const logoW = pt(elem.width * scale);
        const logoH = pt(elem.height * scale);
        page.drawRectangle({
          x: logoX,
          y: logoY,
          width: logoW,
          height: logoH,
          color: rgb(1, 1, 1),
        });
        page.drawImage(logoImg, {
          x: logoX + pt(1 * scale),
          y: logoY + pt(1 * scale),
          width: logoW - pt(2 * scale),
          height: logoH - pt(2 * scale),
        });
      } else if (
        elem.type === "sticker" &&
        elem.stickerType &&
        preloaded.stickerMap.has(elem.stickerType)
      ) {
        const stickerImg = preloaded.stickerMap.get(elem.stickerType)!;
        page.drawImage(stickerImg, {
          x: x + pt(elem.x * scale),
          y: y + h - pt((elem.y + elem.height) * scale),
          width: pt(elem.width * scale),
          height: pt(elem.height * scale),
        });
      }
    }
    return;
  }

  // --- BRANCH 2: CUSTOM DESIGN BACKGROUND WITH MOVABLE QR ---
  if (card.customDesign && preloaded.customDesignMap.has(card.customDesign)) {
    const designImg = preloaded.customDesignMap.get(card.customDesign)!;
    page.drawImage(designImg, { x, y, width: w, height: h });

    const qrMmSize = card.qrSize ?? 40;
    const qrMmX = card.qrX ?? (cardMmW - qrMmSize) / 2;
    const qrMmY = card.qrY ?? (cardMmH - qrMmSize) / 2;

    const qrPtSize = pt(qrMmSize);
    const qrPtX = x + pt(qrMmX);
    const qrPtY = y + h - pt(qrMmY + qrMmSize);

    const qrBgCol = colour(card.qrBgColor || "#ffffff");
    const qrDotCol = colour(card.qrDotColor || "#000000");

    if (card.qrFrame === "white") {
      const pad = pt(2);
      page.drawRectangle({
        x: qrPtX - pad,
        y: qrPtY - pad,
        width: qrPtSize + pad * 2,
        height: qrPtSize + pad * 2,
        color: rgb(1, 1, 1),
      });
    } else if (card.qrFrame === "dark") {
      const pad = pt(2);
      page.drawRectangle({
        x: qrPtX - pad,
        y: qrPtY - pad,
        width: qrPtSize + pad * 2,
        height: qrPtSize + pad * 2,
        color: rgb(0.06, 0.09, 0.16),
      });
    }

    const qr = QRCode.create(card.url, { errorCorrectionLevel: "M" });
    const count = qr.modules.size;
    const module = qrPtSize / (count + 4);

    if (card.qrFrame !== "none") {
      page.drawRectangle({
        x: qrPtX,
        y: qrPtY,
        width: qrPtSize,
        height: qrPtSize,
        color: qrBgCol,
      });
    }

    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.modules.get(r, c)) {
          page.drawRectangle({
            x: qrPtX + (c + 2) * module,
            y: qrPtY + qrPtSize - (r + 3) * module,
            width: module,
            height: module,
            color: qrDotCol,
          });
        }
      }
    }
    return;
  }

  // --- BRANCH 3: STANDARD REVIEW CARD TEMPLATE ---
  page.drawRectangle({ x, y, width: w, height: h, color: primaryCol });

  // White panel for QR code
  const panelW = pt(85 * scale);
  const panelH = pt(85 * scale);
  const panelX = x + (w - panelW) / 2;
  const panelY = y + pt(15 * scale);

  if (assets.whitePanelImg) {
    page.drawImage(assets.whitePanelImg, {
      x: panelX,
      y: panelY,
      width: panelW,
      height: panelH,
    });
  } else {
    page.drawRectangle({
      x: panelX,
      y: panelY,
      width: panelW,
      height: panelH,
      color: rgb(1, 1, 1),
    });
  }

  // Header Title
  const cleanTitle = sanitizePdfText(card.name || "Business Name");
  const titleSize = Math.max(8, 14 * scale);
  const titleW = fonts.bold.widthOfTextAtSize(cleanTitle, titleSize);
  page.drawText(cleanTitle, {
    x: x + (w - titleW) / 2,
    y: y + h - pt(16 * scale),
    size: titleSize,
    font: fonts.bold,
    color: rgb(1, 1, 1),
  });

  // Header Subtitle
  const cleanSub = sanitizePdfText(card.category || "Review Us On Google");
  const subSize = Math.max(6, 9 * scale);
  const subW = fonts.regular.widthOfTextAtSize(cleanSub, subSize);
  page.drawText(cleanSub, {
    x: x + (w - subW) / 2,
    y: y + h - pt(23 * scale),
    size: subSize,
    font: fonts.regular,
    color: rgb(0.9, 0.95, 1),
  });

  // Google G Badge
  if (assets.googleBadgeImg) {
    const gSize = pt(18 * scale);
    page.drawImage(assets.googleBadgeImg, {
      x: panelX + (panelW - gSize) / 2,
      y: panelY + panelH - gSize / 2,
      width: gSize,
      height: gSize,
    });
  }

  // 5 Stars Badge
  if (assets.fiveStarsImg && card.includeStars !== false) {
    const starW = pt(45 * scale);
    const starH = pt(8 * scale);
    page.drawImage(assets.fiveStarsImg, {
      x: panelX + (panelW - starW) / 2,
      y: panelY + panelH - pt(18 * scale),
      width: starW,
      height: starH,
    });
  }

  // QR Code
  const qrMm = 45 * scale;
  const qrPt = pt(qrMm);
  const qrX = panelX + (panelW - qrPt) / 2;
  const qrY = panelY + pt(10 * scale);

  const qr = QRCode.create(card.url, { errorCorrectionLevel: "M" });
  const count = qr.modules.size;
  const module = qrPt / (count + 4);

  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.modules.get(r, c)) {
        page.drawRectangle({
          x: qrX + (c + 2) * module,
          y: qrY + qrPt - (r + 3) * module,
          width: module,
          height: module,
          color: colour(card.qrDotColor || "#000000"),
        });
      }
    }
  }

  // Bottom NFC Wave
  if (assets.nfcBottomIconImg && card.includeNfc !== false) {
    const nfcSize = pt(11 * scale);
    page.drawImage(assets.nfcBottomIconImg, {
      x: x + (w - nfcSize) / 2,
      y: y + pt(3 * scale),
      width: nfcSize,
      height: nfcSize,
    });
  }
}

export async function exportReviewCardPdf(options: ExportCardPdfOptions) {
  const card = options.card;
  const copies = Math.max(1, Math.min(50, options.copies ?? 1));
  const layout = options.layout ?? (copies === 1 ? "a6-single" : "a4-4cards");
  const showCutGuides = options.showCutGuidelines !== false;

  const pdf = await PDFDocument.create();
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);

  // Preload common vector marks and icons
  const [
    googleBadgeImg,
    googleGIconImg,
    fiveStarsImg,
    nfcBottomIconImg,
    starBadgeImg,
    heartBadgeImg,
    nfcBadgeImg,
    whitePanelImg,
    whiteCircleBadgeImg,
  ] = await Promise.all([
    loadPdfImage(pdf, GOOGLE_G_BADGE_SVG),
    loadPdfImage(pdf, GOOGLE_G_ICON_SVG),
    loadPdfImage(pdf, FIVE_STARS_SVG),
    loadPdfImage(pdf, NFC_BOTTOM_ICON_SVG),
    loadPdfImage(pdf, STAR_BADGE_SVG),
    loadPdfImage(pdf, HEART_BADGE_SVG),
    loadPdfImage(pdf, NFC_BLUE_BADGE_SVG),
    loadPdfImage(pdf, WHITE_PANEL_SVG),
    loadPdfImage(pdf, WHITE_CIRCLE_BADGE_SVG),
  ]);

  const assets = {
    googleBadgeImg,
    googleGIconImg,
    fiveStarsImg,
    nfcBottomIconImg,
    starBadgeImg,
    heartBadgeImg,
    nfcBadgeImg,
    whitePanelImg,
    whiteCircleBadgeImg,
  };

  const fonts = { bold: fontBold, regular: fontRegular };

  const cardBgMap = new Map<string, PDFImage>();
  const logoMap = new Map<string, PDFImage>();
  const customDesignMap = new Map<string, PDFImage>();
  const stickerMap = new Map<string, PDFImage>();

  const col = card.color || "#1a73e8";
  const bgImg = await loadPdfImage(pdf, getCardBgSvg(col));
  if (bgImg) cardBgMap.set(col, bgImg);

  if (card.logo) {
    const img = await loadPdfImage(pdf, card.logo);
    if (img) logoMap.set(card.logo, img);
  }
  if (card.customDesign) {
    const img = await loadPdfImage(pdf, card.customDesign);
    if (img) customDesignMap.set(card.customDesign, img);
  }

  // Preload vector sticker SVGs
  for (const [key, svgUrl] of Object.entries(STICKER_SVGS)) {
    const img = await loadPdfImage(pdf, svgUrl);
    if (img) stickerMap.set(key, img);
  }

  const preloaded = { cardBgMap, logoMap, customDesignMap, stickerMap };

  if (layout === "a6-single") {
    // Exact A6 page (105 x 148 mm)
    const a6W = pt(105);
    const a6H = pt(148);
    for (let c = 0; c < copies; c++) {
      const page = pdf.addPage([a6W, a6H]);
      await renderSingleCardOnPage(
        pdf,
        page,
        card,
        0,
        0,
        a6W,
        a6H,
        105,
        148,
        assets,
        fonts,
        preloaded,
      );
    }
  } else if (layout === "a4-2cards") {
    // 2 cards per A4 page (centered vertically with cut guidelines)
    const a4W = pt(210);
    const a4H = pt(297);
    const cardW = 105;
    const cardH = 148;
    const cutColor = rgb(0.72, 0.75, 0.8);
    const numPages = Math.ceil(copies / 2);

    for (let p = 0; p < numPages; p++) {
      const page = pdf.addPage([a4W, a4H]);
      if (showCutGuides) {
        page.drawLine({
          start: { x: 0, y: pt(148.5) },
          end: { x: a4W, y: pt(148.5) },
          thickness: 0.5,
          dashArray: [4, 3],
          color: cutColor,
        });
      }

      // Card 1 (Top)
      const topX = pt((210 - cardW) / 2);
      const topY = pt(148.5 + (148.5 - cardH) / 2);
      await renderSingleCardOnPage(
        pdf,
        page,
        card,
        topX,
        topY,
        pt(cardW),
        pt(cardH),
        cardW,
        cardH,
        assets,
        fonts,
        preloaded,
      );

      // Card 2 (Bottom)
      const card2Idx = p * 2 + 1;
      if (card2Idx < copies) {
        const botX = pt((210 - cardW) / 2);
        const botY = pt((148.5 - cardH) / 2);
        await renderSingleCardOnPage(
          pdf,
          page,
          card,
          botX,
          botY,
          pt(cardW),
          pt(cardH),
          cardW,
          cardH,
          assets,
          fonts,
          preloaded,
        );
      }
    }
  } else {
    // a4-4cards: 4 cards in 2x2 grid per A4 page (95 x 136 mm each with 6mm gaps)
    const a4W = pt(210);
    const a4H = pt(297);
    const cardW = 95;
    const cardH = 136;
    const marginX = 7;
    const marginY = 9.5;
    const gapX = 6;
    const gapY = 6;
    const cutColor = rgb(0.72, 0.75, 0.8);

    const positions = [
      { x: marginX, y: 297 - marginY - cardH },
      { x: marginX + cardW + gapX, y: 297 - marginY - cardH },
      { x: marginX, y: 297 - marginY - cardH - gapY - cardH },
      { x: marginX + cardW + gapX, y: 297 - marginY - cardH - gapY - cardH },
    ];

    const numPages = Math.ceil(copies / 4);

    for (let p = 0; p < numPages; p++) {
      const page = pdf.addPage([a4W, a4H]);
      if (showCutGuides) {
        page.drawLine({
          start: { x: 0, y: pt(297 - marginY - cardH - gapY / 2) },
          end: { x: a4W, y: pt(297 - marginY - cardH - gapY / 2) },
          thickness: 0.5,
          dashArray: [4, 3],
          color: cutColor,
        });
        page.drawLine({
          start: { x: pt(marginX + cardW + gapX / 2), y: 0 },
          end: { x: pt(marginX + cardW + gapX / 2), y: a4H },
          thickness: 0.5,
          dashArray: [4, 3],
          color: cutColor,
        });
      }

      for (let s = 0; s < 4; s++) {
        const slotIdx = p * 4 + s;
        if (slotIdx >= copies) break;
        const pos = positions[s]!;
        await renderSingleCardOnPage(
          pdf,
          page,
          card,
          pt(pos.x),
          pt(pos.y),
          pt(cardW),
          pt(cardH),
          cardW,
          cardH,
          assets,
          fonts,
          preloaded,
        );
      }
    }
  }

  const bytes = await pdf.save();
  const safeName = (card.name || "card").toLowerCase().replace(/[^a-z0-9]/g, "-");
  const fileName =
    layout === "a6-single"
      ? `reviewcard-${safeName}-a6-${copies}-copy.pdf`
      : `reviewcard-${safeName}-${layout}-${copies}-cards.pdf`;

  downloadBlob(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), fileName);
}
