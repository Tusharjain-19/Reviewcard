import { describe, it, expect } from "vitest";
import { FORMATS, scanWarnings, templateDesign } from "./print";
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
});
