import { describe, expect, it } from "vitest";
import {
  buildLinkUrl,
  buttonIds,
  isHexColor,
  logoSizeAllowed,
  moveButton,
  REVIEW_BUTTON_ID,
  reviewUrlFromInput,
  type Business,
  type LinkType,
} from "./reviewcard";

const business: Business = {
  slug: "test",
  name: "Test",
  tagline: "",
  category: "",
  reviewUrl: "https://google.com",
  links: [
    { id: "website", type: "website", label: "Website", value: "https://example.com" },
    { id: "email", type: "email", label: "Email", value: "hello@example.com" },
  ],
  theme: { primary: "#123456", buttonStyle: "pill" },
};
describe("Business customisation rules", () => {
  it("accepts logos up to and including 5MB", () => {
    expect(logoSizeAllowed(5 * 1024 * 1024)).toBe(true);
    expect(logoSizeAllowed(5 * 1024 * 1024 + 1)).toBe(false);
  });
  it.each<LinkType>([
    "whatsapp",
    "phone",
    "email",
    "instagram",
    "facebook",
    "website",
    "menu",
    "directions",
    "custom",
  ])("keeps a direct Google HTTPS destination on %s buttons", (type) => {
    expect(
      buildLinkUrl({ id: "x", label: "Google", type, value: "https://www.google.com/maps" }),
    ).toBe("https://www.google.com/maps");
  });
  it("keeps the review button first when Email is dragged above it", () => {
    const buttonOrder = moveButton(business, "email", REVIEW_BUTTON_ID);
    expect(buttonIds({ ...business, buttonOrder })).toEqual([REVIEW_BUTTON_ID, "website", "email"]);
  });
  it("allows Email to move above Website but below review", () => {
    const buttonOrder = moveButton(business, "email", "website");
    expect(buttonIds({ ...business, buttonOrder })).toEqual([REVIEW_BUTTON_ID, "email", "website"]);
  });
  it("accepts six-digit hex colour codes", () => {
    expect(isHexColor("#aB12f0")).toBe(true);
    expect(isHexColor("#zz1234")).toBe(false);
  });
  it("rejects unsafe destinations", () => {
    expect(buildLinkUrl({ id: "x", type: "email", label: "X", value: "javascript:alert(1)" })).toBe(
      null,
    );
    expect(reviewUrlFromInput("javascript:alert(1)")).toBe("");
  });
  it("retains normal contact destinations", () => {
    expect(
      buildLinkUrl({ id: "x", type: "email", label: "Email", value: "hello@example.com" }),
    ).toBe("mailto:hello@example.com");
  });
});
