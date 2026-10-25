import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb, type PDFImage } from "pdf-lib";

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
}

// Vector SVG Assets for Pixel-Perfect PDF Export (Rendered at 300 DPI)
const GOOGLE_G_BADGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="#ffffff"/><g transform="translate(46, 46)"><path fill="#4285F4" d="M106.85 55.21c0-3.15-.27-6.3-8.55-9.31H54v20.29h29.7c-1.3 6.84-5.13 12.6-10.8 16.56v13.72h17.46c10.21-9.4 16.49-23.26 16.49-41.26z"/><path fill="#34A853" d="M54 108c14.58 0 26.77-4.86 35.68-13.09l-17.46-13.72c-4.86 3.24-11.02 5.22-18.22 5.22-14.04 0-25.96-9.45-30.24-22.18H5.62v14.17C14.67 96.12 33.12 108 54 108z"/><path fill="#FBBC05" d="M23.76 64.23c-1.12-3.24-1.71-6.7-1.71-10.23s.59-6.99 1.71-10.23V29.6H5.62C1.98 36.81 0 45.09 0 54s1.98 17.19 5.62 24.4l18.14-14.17z"/><path fill="#EA4335" d="M54 21.37c7.96 0 15.07 2.74 20.7 8.1l15.39-15.39C80.73 5.35 68.54 0 54 0 33.12 0 14.67 11.88 5.62 29.6l18.14 14.17c4.28-12.73 16.2-22.4 30.24-22.4z"/></g></svg>`;

const GOOGLE_G_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>`;

const FIVE_STARS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="56" viewBox="0 0 160 26"><g fill="#f59e0b">${[0, 1, 2, 3, 4].map((i) => `<path transform="translate(${i * 32 + 4}, 1)" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>`).join("")}</g></svg>`;

const NFC_BOTTOM_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.88"/><g stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" fill="none"><path d="M14 16a7 7 0 0 1 0 8"/><path d="M18 13a11 11 0 0 1 0 14"/><path d="M22 10a15 15 0 0 1 0 20"/><path d="M10 19a2.5 2.5 0 0 1 0 2"/></g></svg>`;

const STAR_BADGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="#ffffff"/><path fill="#f59e0b" transform="translate(40, 40) scale(5)" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;

const HEART_BADGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="#ffffff"/><path fill="#059669" transform="translate(40, 40) scale(5)" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

const NFC_BLUE_BADGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="#ffffff"/><g stroke="#1a73e8" stroke-width="7" stroke-linecap="round" fill="none" transform="translate(48, 48) scale(2.6)"><path d="M6 8a9 9 0 0 1 0 8"/><path d="M10 5a14 14 0 0 1 0 14"/><path d="M14 2a19 19 0 0 1 0 20"/><path d="M2 11a4 4 0 0 1 0 2"/></g></svg>`;

const WHITE_PANEL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="680" viewBox="0 0 85 85"><rect x="0" y="0" width="85" height="85" rx="4.5" ry="4.5" fill="#ffffff"/></svg>`;

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
            canvas.width = Math.max(img.naturalWidth || 200, 400);
            canvas.height = Math.max(img.naturalHeight || 200, 400);
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
  ] = await Promise.all([
    loadPdfImage(pdf, GOOGLE_G_BADGE_SVG),
    loadPdfImage(pdf, GOOGLE_G_ICON_SVG),
    loadPdfImage(pdf, FIVE_STARS_SVG),
    loadPdfImage(pdf, NFC_BOTTOM_ICON_SVG),
    loadPdfImage(pdf, STAR_BADGE_SVG),
    loadPdfImage(pdf, HEART_BADGE_SVG),
    loadPdfImage(pdf, NFC_BLUE_BADGE_SVG),
    loadPdfImage(pdf, WHITE_PANEL_SVG),
  ]);

  // Preload card backgrounds and custom logos
  const cardBgMap = new Map<string, PDFImage>();
  const logoMap = new Map<string, PDFImage>();

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

    // Cut guidelines across page
    const cutColor = rgb(0.7, 0.7, 0.7);
    page.drawLine({
      start: { x: 0, y: pt(297 - marginY - cardH - gapY / 2) },
      end: { x: pageWidth, y: pt(297 - marginY - cardH - gapY / 2) },
      thickness: 0.5,
      color: cutColor,
    });
    page.drawLine({
      start: { x: pt(marginX + cardW + gapX / 2), y: 0 },
      end: { x: pt(marginX + cardW + gapX / 2), y: pageHeight },
      thickness: 0.5,
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

        // Header Title
        const titleText = (card.universalTitle || "REVIEW US ON GOOGLE").slice(0, 26);
        page.drawText(titleText, {
          x: avatarX + avatarSize + pt(3.5),
          y: avatarY + pt(7.5),
          size: 9.5,
          font: fontBold,
          color: rgb(1, 1, 1),
        });

        // Header Subtitle
        const subText = (card.universalSubtitle || "SCAN OR TAP WITH PHONE").slice(0, 32);
        page.drawText(subText, {
          x: avatarX + avatarSize + pt(3.5),
          y: avatarY + pt(1.5),
          size: 6.5,
          font: fontRegular,
          color: rgb(0.92, 0.92, 0.92),
        });
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
          page.drawRectangle({
            x: avatarX,
            y: avatarY,
            width: avatarSize,
            height: avatarSize,
            color: rgb(1, 1, 1),
          });
          const initials =
            card.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase() || "RC";
          page.drawText(initials, {
            x: avatarX + pt(3),
            y: avatarY + pt(3.5),
            size: 11,
            font: fontBold,
            color: primaryCol,
          });
        }

        // Business Name
        const nameText = card.name.length > 20 ? card.name.slice(0, 18) + "…" : card.name;
        page.drawText(nameText, {
          x: avatarX + avatarSize + pt(3.5),
          y: avatarY + pt(7.5),
          size: 11,
          font: fontBold,
          color: rgb(1, 1, 1),
        });

        // Category
        const catText = (card.category || "Business").toUpperCase();
        page.drawText(catText, {
          x: avatarX + avatarSize + pt(3.5),
          y: avatarY + pt(1.5),
          size: 7,
          font: fontRegular,
          color: rgb(0.92, 0.92, 0.92),
        });
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

      // Headline
      const headline = card.headline || "Review Us On Google";
      const headW = fontBold.widthOfTextAtSize(headline, 10);
      page.drawText(headline, {
        x: panelX + (panelW - headW) / 2,
        y: panelY + panelH - pt(19),
        size: 10,
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

      // Printed Card ID
      if (card.cardId) {
        const idText = `CARD ID: ${card.cardId}`;
        const idW = fontBold.widthOfTextAtSize(idText, 7);
        page.drawText(idText, {
          x: panelX + (panelW - idW) / 2,
          y: panelY + pt(3.5),
          size: 7,
          font: fontBold,
          color: rgb(0.28, 0.33, 0.41),
        });
      }

      // 4. Bottom NFC Bar
      if (card.includeNfc !== false) {
        const nfcIconSize = pt(9.5);
        const topText = "Tap Phone on Card";
        const topTextW = fontBold.widthOfTextAtSize(topText, 8.2);
        const subText = "Instant NFC review link";
        const subTextW = fontRegular.widthOfTextAtSize(subText, 6.5);
        const textBlockW = Math.max(topTextW, subTextW);
        const totalNfcW = nfcIconSize + pt(3.5) + textBlockW;
        const nfcStartX = x + (w - totalNfcW) / 2;

        if (nfcBottomIconImg) {
          page.drawImage(nfcBottomIconImg, {
            x: nfcStartX,
            y: y + pt(3.2),
            width: nfcIconSize,
            height: nfcIconSize,
          });
        }

        page.drawText(topText, {
          x: nfcStartX + nfcIconSize + pt(3.5),
          y: y + pt(8.2),
          size: 8.2,
          font: fontBold,
          color: rgb(1, 1, 1),
        });

        page.drawText(subText, {
          x: nfcStartX + nfcIconSize + pt(3.5),
          y: y + pt(4.8),
          size: 6.5,
          font: fontRegular,
          color: rgb(0.9, 0.9, 0.9),
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
