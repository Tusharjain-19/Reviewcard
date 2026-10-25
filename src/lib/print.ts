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
  headline?: string;
  qrDotColor?: string;
  qrBgColor?: string;
  includeNfc?: boolean;
  includeStars?: boolean;
  logo?: string;
  isUniversal?: boolean;
  universalBadge?: "google" | "star" | "nfc" | "heart";
  universalTitle?: string;
  universalSubtitle?: string;
  cardId?: string;
}

async function loadPdfImage(pdf: PDFDocument, src: string): Promise<PDFImage | null> {
  try {
    if (typeof document !== "undefined") {
      const pngBytes = await new Promise<Uint8Array | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || 200;
            canvas.height = img.naturalHeight || 200;
            const ctx = canvas.getContext("2d");
            if (!ctx) return resolve(null);
            ctx.drawImage(img, 0, 0);
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
        img.src = src;
      });

      if (pngBytes) {
        return await pdf.embedPng(pngBytes);
      }
    }

    const res = await fetch(src);
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
    console.warn("Could not embed logo in PDF:", e);
    return null;
  }
}

export async function exportA4SheetPdf(
  cardOrCards: ReviewCardSheetOptions | ReviewCardSheetOptions[],
) {
  const cards = Array.isArray(cardOrCards) ? cardOrCards : [cardOrCards];
  const firstCard = cards[0];
  const pdf = await PDFDocument.create();
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);

  // Preload logos for cards
  const logoMap = new Map<string, PDFImage>();
  for (const c of cards) {
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

    // Cut lines across page
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
      const card = cards[cardIndex] || firstCard;
      const primaryCol = colour(card.color || "#1a73e8");
      const x = pt(pos.x);
      const y = pt(pos.y);
      const w = pt(cardW);
      const h = pt(cardH);

      // 1. Card Background
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        color: primaryCol,
      });

      // 2. Card Header
      const avatarSize = pt(14);
      const avatarX = x + pt(5);
      const avatarY = y + h - pt(5) - avatarSize;
      page.drawRectangle({
        x: avatarX,
        y: avatarY,
        width: avatarSize,
        height: avatarSize,
        color: rgb(1, 1, 1),
      });

      if (card.isUniversal) {
        // Universal badge symbol (no business initials or business name)
        const badgeSymbol =
          card.universalBadge === "google"
            ? "G"
            : card.universalBadge === "star"
              ? "*"
              : card.universalBadge === "nfc"
                ? "))"
                : "♥";

        const symbolW = fontBold.widthOfTextAtSize(badgeSymbol, 11);
        page.drawText(badgeSymbol, {
          x: avatarX + (avatarSize - symbolW) / 2,
          y: avatarY + pt(3.5),
          size: 11,
          font: fontBold,
          color: primaryCol,
        });

        const titleText = (card.universalTitle || "REVIEW US ON GOOGLE").slice(0, 24);
        page.drawText(titleText, {
          x: avatarX + avatarSize + pt(3.5),
          y: avatarY + pt(7.5),
          size: 9.5,
          font: fontBold,
          color: rgb(1, 1, 1),
        });

        const subText = (card.universalSubtitle || "SCAN OR TAP WITH PHONE").slice(0, 30);
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

      // 3. Review Panel (white background)
      const panelPadX = pt(5);
      const panelX = x + panelPadX;
      const panelW = w - panelPadX * 2;
      const panelH = pt(85);
      const panelY = y + pt(16);

      page.drawRectangle({
        x: panelX,
        y: panelY,
        width: panelW,
        height: panelH,
        color: rgb(1, 1, 1),
      });

      // Panel Header: Google Reviews
      const googleText = "Google Reviews";
      const gTextW = fontBold.widthOfTextAtSize(googleText, 9);
      page.drawText(googleText, {
        x: panelX + (panelW - gTextW) / 2,
        y: panelY + panelH - pt(7),
        size: 9,
        font: fontBold,
        color: rgb(0.15, 0.2, 0.3),
      });

      // Stars
      if (card.includeStars !== false) {
        const starText = "* * * * *";
        const starW = fontBold.widthOfTextAtSize(starText, 10);
        page.drawText(starText, {
          x: panelX + (panelW - starW) / 2,
          y: panelY + panelH - pt(12),
          size: 10,
          font: fontBold,
          color: rgb(0.96, 0.62, 0.04),
        });
      }

      // Headline
      const headline = card.headline || "Review Us On Google";
      const headW = fontBold.widthOfTextAtSize(headline, 10);
      page.drawText(headline, {
        x: panelX + (panelW - headW) / 2,
        y: panelY + panelH - pt(17.5),
        size: 10,
        font: fontBold,
        color: primaryCol,
      });

      // QR Code
      const qrSize = pt(40);
      const qrX = panelX + (panelW - qrSize) / 2;
      const qrY = panelY + pt(13);
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

      // Printed Card ID below QR code
      if (card.cardId) {
        const idText = `Card ID: ${card.cardId}`;
        const idW = fontBold.widthOfTextAtSize(idText, 7.5);
        page.drawText(idText, {
          x: panelX + (panelW - idW) / 2,
          y: panelY + pt(4.5),
          size: 7.5,
          font: fontBold,
          color: rgb(0.2, 0.25, 0.35),
        });
      }

      // 4. Bottom NFC Bar (Centered in middle & lifted slightly)
      if (card.includeNfc !== false) {
        const nfcText = "Tap Phone on Card | Instant NFC Review";
        const nfcW = fontBold.widthOfTextAtSize(nfcText, 7.5);
        page.drawText(nfcText, {
          x: x + (w - nfcW) / 2,
          y: y + pt(7.5),
          size: 7.5,
          font: fontBold,
          color: rgb(1, 1, 1),
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
