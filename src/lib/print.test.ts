import { describe, it, expect } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import {
  FORMATS,
  scanWarnings,
  templateDesign,
  fitTextLines,
  fitSingleLineText,
  sanitizePdfText,
} from "./print";

describe("Print specifications", () => {
  it("uses the requested physical sizes", () => {
    expect(FORMATS.card).toMatchObject({ width: 85.6, height: 54 });
    expect(FORMATS.a6).toMatchObject({ width: 105, height: 148 });
    expect(FORMATS.sticker).toMatchObject({ width: 50, height: 50 });
    expect(FORMATS.a5).toMatchObject({ width: 148, height: 210 });
  });
  it("rejects QR smaller than 25 mm", () => {
    const d = templateDesign("card", "Minimal", "Cafe");
    const qr = d.elements.find((e) => e.type === "qr");
    if (qr) qr.width = 24;
    expect(scanWarnings(d)).toContain("QR must be at least 25 mm");
  });
  it("warns on QR overlap", () => {
    const d = templateDesign("card", "Minimal", "Cafe");
    d.elements.push({ id: "overlap", type: "shape", x: 60, y: 22, width: 10, height: 10 });
    expect(scanWarnings(d)).toContain("Another element overlaps the QR code");
  });
  it("keeps the default card QR inside safe margins", () => {
    expect(scanWarnings(templateDesign("card", "Minimal", "Cafe"))).toEqual([]);
  });

  describe("Full Business Name Fitting (No Truncation)", () => {
    it("preserves full business name on a single line when it fits", async () => {
      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);
      const maxTextWidth = 191.3; // (95 - 5 - 14 - 3.5 - 5) mm in pt

      const res = fitTextLines("The Artisan Bakery", font, maxTextWidth, 2);
      expect(res.lines).toHaveLength(1);
      expect(res.lines[0]).toBe("The Artisan Bakery");
      expect(res.lines[0]).not.toContain("…");
      expect(font.widthOfTextAtSize(res.lines[0]!, res.fontSize)).toBeLessThanOrEqual(maxTextWidth);
    });

    it("preserves full long business name across 2 lines without ellipsis truncation", async () => {
      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);
      const maxTextWidth = 191.3;
      const longName = "Dr. Samantha's Dental & Orthodontic Care";

      const res = fitTextLines(longName, font, maxTextWidth, 2);
      expect(res.lines.length).toBeGreaterThanOrEqual(1);
      expect(res.lines.join(" ")).toBe(longName);
      expect(res.lines.join(" ")).not.toContain("…");
      for (const line of res.lines) {
        expect(font.widthOfTextAtSize(line, res.fontSize)).toBeLessThanOrEqual(maxTextWidth);
      }
    });

    it("preserves multi-word long business name without cutting off characters", async () => {
      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);
      const maxTextWidth = 191.3;
      const longName = "Bella Vista Italian Bistro & Pizzeria";

      const res = fitTextLines(longName, font, maxTextWidth, 2);
      expect(res.lines.join(" ")).toBe(longName);
      for (const line of res.lines) {
        expect(font.widthOfTextAtSize(line, res.fontSize)).toBeLessThanOrEqual(maxTextWidth);
      }
    });

    it("sanitizes smart quotes and accents for clean PDF encoding", () => {
      expect(sanitizePdfText("‘Bella’s Bistro’")).toBe("'Bella's Bistro'");
      expect(sanitizePdfText("“Luxe Dental”")).toBe('"Luxe Dental"');
    });

    it("auto-fits category text within available width", async () => {
      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const maxTextWidth = 191.3;
      const longCategory = "COSMETIC & FAMILY DENTISTRY & SURGICAL ORTHODONTICS";

      const res = fitSingleLineText(longCategory, font, maxTextWidth);
      expect(res.text).toBe(longCategory);
      expect(font.widthOfTextAtSize(res.text, res.fontSize)).toBeLessThanOrEqual(maxTextWidth);
    });
  });
});
