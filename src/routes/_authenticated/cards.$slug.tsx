import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  ArrowLeft,
  Printer,
  Download,
  Save,
  Check,
  Scissors,
  Radio,
  Star,
  Copy,
  Palette,
  Pipette,
  Store,
  Sparkles,
  Heart,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ownedBusinessQuery } from "@/lib/queries";
import { shortUrl } from "@/lib/reviewcard";
import { exportA4SheetPdf } from "@/lib/print";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageMeta } from "@/lib/meta";
import { toast } from "sonner";
import { ReviewCardItem, ContactlessNfcIcon } from "@/components/ReviewCardItem";

export const Route = createFileRoute("/_authenticated/cards/$slug")({
  head: () => pageMeta("Card Studio", "Design and print Google Review cards and A4 print sheets."),
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(ownedBusinessQuery(params.slug)),
  component: CardStudio,
});

// Color conversion helpers for Google-style color picker
function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6 && clean.length !== 3) return { r: 26, g: 115, b: 232 };
  const expanded =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(expanded, 16);
  if (isNaN(num)) return { r: 26, g: 115, b: 232 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHsl(r: number, g: number, b: number) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case red:
        h = (green - blue) / d + (green < blue ? 6 : 0);
        break;
      case green:
        h = (blue - red) / d + 2;
        break;
      case blue:
        h = (red - green) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function rgbToCmyk(r: number, g: number, b: number) {
  if (r === 0 && g === 0 && b === 0) return { c: 0, m: 0, y: 0, k: 100 };
  const c1 = 1 - r / 255;
  const m1 = 1 - g / 255;
  const y1 = 1 - b / 255;
  const k = Math.min(c1, Math.min(m1, y1));
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((c1 - k) / (1 - k)) * 100),
    m: Math.round(((m1 - k) / (1 - k)) * 100),
    y: Math.round(((y1 - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

const THEME_PALETTES = [
  { name: "Google Blue", hex: "#1a73e8" },
  { name: "Google Red", hex: "#ea4335" },
  { name: "Google Amber", hex: "#fbbc05" },
  { name: "Google Green", hex: "#34a853" },
  { name: "Luxury Onyx", hex: "#18181b" },
  { name: "Forest Emerald", hex: "#065f46" },
  { name: "Ruby Burgundy", hex: "#991b1b" },
  { name: "Royal Indigo", hex: "#4338ca" },
  { name: "Sunset Coral", hex: "#f97316" },
  { name: "Deep Violet", hex: "#7c3aed" },
];

function CardStudio() {
  const { slug } = Route.useParams();
  const { data: b } = useSuspenseQuery(ownedBusinessQuery(slug));

  const initialUrl = typeof window !== "undefined" ? shortUrl(slug, "qr") : `/r/${slug}`;

  // Customization state
  const [bizName, setBizName] = useState(b.name || "Business Name");
  const [category, setCategory] = useState(b.category || "Local Business");
  const [headline, setHeadline] = useState("Review Us On Google");
  const [color, setColor] = useState(b.theme?.primary || "#1a73e8");
  const [qrDotColor, setQrDotColor] = useState("#000000");
  const [qrBgColor, setQrBgColor] = useState("#ffffff");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [includeNfc, setIncludeNfc] = useState(true);
  const [includeStars, setIncludeStars] = useState(true);
  const [showCutGuides, setShowCutGuides] = useState(true);
  const [viewMode, setViewMode] = useState<"a4" | "single">("a4");
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [copiedHex, setCopiedHex] = useState(false);

  // Card Edition State (Personalized vs Universal Card without business name)
  const [cardEdition, setCardEdition] = useState<"business" | "universal">("business");
  const [universalTemplate, setUniversalTemplate] = useState<"google" | "star" | "nfc" | "heart">(
    "google",
  );
  const [universalTitle, setUniversalTitle] = useState("GOOGLE REVIEWS");
  const [universalSubtitle, setUniversalSubtitle] = useState("OFFICIAL REVIEW CARD");
  const [qrDestination, setQrDestination] = useState<"review" | "activate">("review");

  // Determine QR URL: direct review page or phone activation onboarding
  const currentTargetUrl =
    qrDestination === "activate"
      ? typeof window !== "undefined"
        ? `${window.location.origin}/activate/${slug}`
        : `/activate/${slug}`
      : typeof window !== "undefined"
        ? shortUrl(slug, "qr")
        : `/r/${slug}`;

  // Apply Universal / Pre-Printed Design Template
  const applyUniversalTemplate = (tpl: "google" | "star" | "nfc" | "heart") => {
    setUniversalTemplate(tpl);
    if (tpl === "google") {
      setUniversalTitle("GOOGLE REVIEWS");
      setUniversalSubtitle("OFFICIAL REVIEW CARD");
      setHeadline("Review Us On Google");
      setColor("#1a73e8");
      setQrDotColor("#000000");
    } else if (tpl === "star") {
      setUniversalTitle("RATE OUR SERVICE");
      setUniversalSubtitle("YOUR 5-STAR REVIEW MATTERS");
      setHeadline("Rate Us 5 Stars on Google");
      setColor("#d97706");
      setQrDotColor("#18181b");
    } else if (tpl === "nfc") {
      setUniversalTitle("TAP OR SCAN TO REVIEW");
      setUniversalSubtitle("NO APP NEEDED · 10 SECONDS");
      setHeadline("Tap Phone or Scan QR Code");
      setColor("#18181b");
      setQrDotColor("#1a73e8");
    } else if (tpl === "heart") {
      setUniversalTitle("YOUR OPINION MATTERS");
      setUniversalSubtitle("HELP US SERVE YOU BETTER");
      setHeadline("How Was Your Experience?");
      setColor("#065f46");
      setQrDotColor("#065f46");
    }
  };

  // Generate crisp QR code whenever target URL, qrDotColor, or qrBgColor changes
  useEffect(() => {
    QRCode.toDataURL(currentTargetUrl, {
      margin: 1,
      errorCorrectionLevel: "M",
      width: 600,
      color: {
        dark: qrDotColor || "#000000",
        light: qrBgColor || "#ffffff",
      },
    })
      .then(setQrCodeDataUrl)
      .catch((err) => console.error("QR Code generation error:", err));
  }, [currentTargetUrl, qrDotColor, qrBgColor]);

  // Save design to Supabase card_designs table
  const handleSave = async () => {
    if (!b.id) return;
    setSaving(true);
    try {
      const designPayload = {
        bizName,
        category,
        headline,
        color,
        qrDotColor,
        qrBgColor,
        cardEdition,
        universalTemplate,
        universalTitle,
        universalSubtitle,
        qrDestination,
        includeNfc,
        includeStars,
        showCutGuides,
      };

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("User not authenticated");

      const { error } = await supabase.from("card_designs").insert({
        business_id: b.id,
        owner_id: user.user.id,
        name: `${cardEdition === "universal" ? universalTitle : bizName} | A4 Print Card`,
        design: designPayload,
      });

      if (error) throw error;
      toast.success("Card design saved successfully");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save design");
    } finally {
      setSaving(false);
    }
  };

  // Export A4 PDF
  const handleDownloadPdf = async () => {
    setExportingPdf(true);
    try {
      await exportA4SheetPdf({
        name: cardEdition === "universal" ? universalTitle : bizName,
        category: cardEdition === "universal" ? universalSubtitle : category,
        url: currentTargetUrl,
        color,
        qrDotColor,
        qrBgColor,
        headline,
        includeNfc,
        includeStars,
        logo: cardEdition === "universal" ? undefined : b.logo,
        isUniversal: cardEdition === "universal",
        universalBadge: universalTemplate,
        universalTitle,
        universalSubtitle,
        cardId: b.slug.toUpperCase(),
      });
      toast.success("A4 PDF sheet exported");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setExportingPdf(false);
    }
  };

  const copyColorHex = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(color);
      setCopiedHex(true);
      toast.success(`Copied ${color} to clipboard`);
      setTimeout(() => setCopiedHex(false), 2000);
    }
  };

  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

  const initials =
    bizName
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "RC";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ---------------- SCREEN HEADER ---------------- */}
      <header className="print:hidden sticky top-0 z-40 flex flex-wrap items-center justify-between gap-4 border-b bg-white px-6 py-3.5 shadow-xs">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <div className="h-4 w-px bg-slate-200" />
          <h1 className="font-display text-lg font-bold">
            {b.name} <span className="text-muted-foreground font-normal">| Print Studio</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={exportingPdf}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {exportingPdf ? "Generating PDF..." : "Export PDF"}
          </Button>

          <Button
            size="sm"
            onClick={() => window.print()}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Printer className="h-4 w-4" />
            Print A4 Sheet
          </Button>
        </div>
      </header>

      {/* ---------------- MAIN LAYOUT ---------------- */}
      <div className="mx-auto flex flex-col lg:flex-row print:block">
        {/* Left Sidebar Controls */}
        <aside className="print:hidden w-full lg:w-96 border-r bg-white p-6 space-y-6 shrink-0">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sheet & Card Layout
            </h2>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                variant={viewMode === "a4" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("a4")}
                className="justify-start gap-2"
              >
                <Printer className="h-4 w-4" />
                A4 (4 Cards)
              </Button>
              <Button
                variant={viewMode === "single" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("single")}
                className="justify-start gap-2"
              >
                <Radio className="h-4 w-4" />
                Single Card
              </Button>
            </div>
          </div>

          {/* Card Edition Selection: Personalized vs Universal Pre-Printed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Card Edition
              </h2>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {cardEdition === "universal" ? "Blank / Activation Mode" : "Branded Business"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCardEdition("personalized")}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  cardEdition === "personalized"
                    ? "border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs ring-1 ring-blue-600"
                    : "border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Store className="h-3.5 w-3.5 text-blue-600" />
                  <span>Personalized</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  With business name & logo
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCardEdition("universal")}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  cardEdition === "universal"
                    ? "border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs ring-1 ring-blue-600"
                    : "border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span>Universal</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  No business name · Phone activate
                </p>
              </button>
            </div>

            {/* Universal Template Styles & Activation Routing */}
            {cardEdition === "universal" && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-blue-900">Card Design Style</span>
                    <span className="text-[10px] text-blue-600 font-medium">4 Styles</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTemplateSelect("google")}
                      className={`p-2 rounded-lg border text-left text-xs transition-all flex items-center gap-2 ${
                        universalTemplate === "google"
                          ? "bg-white border-blue-600 shadow-xs font-bold text-blue-900 ring-1 ring-blue-500"
                          : "bg-white/80 border-slate-200 hover:bg-white text-slate-700"
                      }`}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-black text-blue-600">
                        G
                      </span>
                      <span className="truncate text-[11px]">Google Classic</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTemplateSelect("star")}
                      className={`p-2 rounded-lg border text-left text-xs transition-all flex items-center gap-2 ${
                        universalTemplate === "star"
                          ? "bg-white border-amber-600 shadow-xs font-bold text-amber-900 ring-1 ring-amber-500"
                          : "bg-white/80 border-slate-200 hover:bg-white text-slate-700"
                      }`}
                    >
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
                      <span className="truncate text-[11px]">5-Star Gold</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTemplateSelect("nfc")}
                      className={`p-2 rounded-lg border text-left text-xs transition-all flex items-center gap-2 ${
                        universalTemplate === "nfc"
                          ? "bg-white border-slate-900 shadow-xs font-bold text-slate-900 ring-1 ring-slate-800"
                          : "bg-white/80 border-slate-200 hover:bg-white text-slate-700"
                      }`}
                    >
                      <ContactlessNfcIcon size={16} className="text-slate-800 shrink-0" />
                      <span className="truncate text-[11px]">Smart NFC</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTemplateSelect("heart")}
                      className={`p-2 rounded-lg border text-left text-xs transition-all flex items-center gap-2 ${
                        universalTemplate === "heart"
                          ? "bg-white border-emerald-600 shadow-xs font-bold text-emerald-900 ring-1 ring-emerald-500"
                          : "bg-white/80 border-slate-200 hover:bg-white text-slate-700"
                      }`}
                    >
                      <Heart className="h-4 w-4 text-emerald-600 fill-emerald-600 shrink-0" />
                      <span className="truncate text-[11px]">Feedback</span>
                    </button>
                  </div>
                </div>

                {/* QR Destination Target */}
                <div className="pt-2 border-t border-blue-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block mb-1.5">
                    Target Destination
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQrDestination("activate")}
                      className={`py-1.5 px-2 rounded-md text-[11px] font-medium border text-center transition-colors ${
                        qrDestination === "activate"
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs font-bold"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Activation Flow
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrDestination("direct")}
                      className={`py-1.5 px-2 rounded-md text-[11px] font-medium border text-center transition-colors ${
                        qrDestination === "direct"
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs font-bold"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Direct Review
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-blue-700 leading-tight">
                    {qrDestination === "activate"
                      ? "Pre-printed cards encode /activate/$code. When scanned on a phone, anyone can claim and activate the card."
                      : "Directly opens the customer review page."}
                  </p>
                </div>

                <div className="pt-2 border-t border-blue-200/60">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full h-8 text-xs bg-white text-blue-700 hover:bg-blue-50 border-blue-200 font-semibold gap-1.5 shadow-xs"
                  >
                    <Link to="/cards/batch">
                      <Printer className="h-3.5 w-3.5 text-blue-600" />
                      Print 4 Different Cards on A4 →
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Google-style Color Picker Widget */}
          <div className="rounded-xl border bg-slate-900 p-4 text-white shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold tracking-wide uppercase text-slate-400 flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-blue-400" />
                Colour Picker
              </span>
              <button
                type="button"
                onClick={copyColorHex}
                title="Copy HEX Code"
                className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
              >
                {copiedHex ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-mono">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-mono">Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Gradient / Visual Color Preview Box with embedded native Color Dialog */}
            <div className="relative mt-3 h-28 w-full rounded-lg overflow-hidden shadow-inner border border-slate-700/60 group cursor-pointer">
              <div
                className="absolute inset-0 transition-colors"
                style={{ backgroundColor: color }}
              />
              <div className="absolute inset-0 bg-linear-to-r from-white via-transparent to-black opacity-30" />
              <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-40" />

              <label
                htmlFor="nativeColorPicker"
                className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity cursor-pointer text-xs font-medium text-white"
              >
                <Pipette className="h-5 w-5 mb-1 text-white drop-shadow" />
                Click to open spectrum
              </label>

              <input
                id="nativeColorPicker"
                type="color"
                value={color.startsWith("#") && color.length === 7 ? color : "#1a73e8"}
                onChange={(e) => setColor(e.target.value)}
                className="absolute opacity-0 pointer-events-auto inset-0 w-full h-full cursor-pointer"
              />
            </div>

            {/* Hue Rainbow Slider Bar */}
            <div className="mt-3">
              <div className="relative h-3 w-full rounded-full overflow-hidden shadow-inner border border-slate-700">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
                  }}
                />
              </div>
            </div>

            {/* HEX Input Field with Copy button */}
            <div className="mt-3.5 flex items-center justify-between rounded-lg bg-slate-800/90 border border-slate-700 px-3 py-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400">HEX</span>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  maxLength={7}
                  className="bg-transparent font-mono text-xs font-semibold text-white focus:outline-none w-20"
                />
              </div>
              <button
                type="button"
                onClick={copyColorHex}
                className="text-slate-400 hover:text-white transition-colors p-1"
                title="Copy Hex"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* RGB, HSL, CMYK Breakdown Metrics */}
            <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
              <div className="rounded-md bg-slate-800/70 border border-slate-700/60 p-1.5">
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                  RGB
                </div>
                <div className="text-[10px] font-mono font-medium text-slate-200 mt-0.5 truncate">
                  {rgb.r}, {rgb.g}, {rgb.b}
                </div>
              </div>
              <div className="rounded-md bg-slate-800/70 border border-slate-700/60 p-1.5">
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                  HSL
                </div>
                <div className="text-[10px] font-mono font-medium text-slate-200 mt-0.5 truncate">
                  {hsl.h}°, {hsl.s}%, {hsl.l}%
                </div>
              </div>
              <div className="rounded-md bg-slate-800/70 border border-slate-700/60 p-1.5">
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                  CMYK
                </div>
                <div className="text-[10px] font-mono font-medium text-slate-200 mt-0.5 truncate">
                  {cmyk.c}%, {cmyk.m}%
                </div>
              </div>
            </div>

            {/* Palette Swatches */}
            <div className="mt-3.5 pt-3 border-t border-slate-800">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-2">
                Preset Palettes
              </div>
              <div className="flex flex-wrap gap-2">
                {THEME_PALETTES.map((p) => (
                  <button
                    key={p.hex}
                    type="button"
                    onClick={() => setColor(p.hex)}
                    title={p.name}
                    style={{ backgroundColor: p.hex }}
                    className="relative h-7 w-7 rounded-full border-2 border-slate-700 shadow-xs transition-transform hover:scale-110 focus:outline-none"
                  >
                    {color.toLowerCase() === p.hex.toLowerCase() && (
                      <Check className="mx-auto h-3.5 w-3.5 text-white drop-shadow-sm" />
                    )}
                  </button>
                ))}
                {b.theme?.primary && (
                  <button
                    type="button"
                    onClick={() => setColor(b.theme.primary)}
                    title="Brand Primary"
                    style={{ backgroundColor: b.theme.primary }}
                    className="relative h-7 w-7 rounded-full border-2 border-white shadow-xs transition-transform hover:scale-110 focus:outline-none"
                  >
                    {color.toLowerCase() === b.theme.primary.toLowerCase() && (
                      <Check className="mx-auto h-3.5 w-3.5 text-white drop-shadow-sm" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* QR Code Colors Customization */}
          <div className="space-y-4 border-t pt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                QR Code Colors
              </h2>
              <span className="text-[10px] text-muted-foreground font-medium">Dots & Frame</span>
            </div>

            {/* QR Dots Color */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">QR Pattern / Dots</label>
                <span className="font-mono text-[11px] text-slate-500">{qrDotColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-slate-300 shadow-xs shrink-0 cursor-pointer group">
                  <div className="absolute inset-0" style={{ backgroundColor: qrDotColor }} />
                  <input
                    type="color"
                    value={
                      qrDotColor.startsWith("#") && qrDotColor.length === 7 ? qrDotColor : "#000000"
                    }
                    onChange={(e) => setQrDotColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Pick QR Dot Color"
                  />
                </div>
                <Input
                  value={qrDotColor}
                  onChange={(e) => setQrDotColor(e.target.value)}
                  className="h-8 font-mono text-xs w-24"
                  maxLength={7}
                />
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQrDotColor("#000000")}
                    title="Classic Black"
                    style={{ backgroundColor: "#000000" }}
                    className="h-6 w-6 rounded-full border border-slate-300 transition-transform hover:scale-110"
                  />
                  <button
                    type="button"
                    onClick={() => setQrDotColor(color)}
                    title="Match Card Theme Color"
                    style={{ backgroundColor: color }}
                    className="h-6 w-6 rounded-full border border-slate-300 transition-transform hover:scale-110"
                  />
                  <button
                    type="button"
                    onClick={() => setQrDotColor("#0f172a")}
                    title="Midnight Slate"
                    style={{ backgroundColor: "#0f172a" }}
                    className="h-6 w-6 rounded-full border border-slate-300 transition-transform hover:scale-110"
                  />
                </div>
              </div>
            </div>

            {/* QR Background Color */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">QR Frame Background</label>
                <span className="font-mono text-[11px] text-slate-500">{qrBgColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-slate-300 shadow-xs shrink-0 cursor-pointer group">
                  <div className="absolute inset-0" style={{ backgroundColor: qrBgColor }} />
                  <input
                    type="color"
                    value={
                      qrBgColor.startsWith("#") && qrBgColor.length === 7 ? qrBgColor : "#ffffff"
                    }
                    onChange={(e) => setQrBgColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Pick QR Background Color"
                  />
                </div>
                <Input
                  value={qrBgColor}
                  onChange={(e) => setQrBgColor(e.target.value)}
                  className="h-8 font-mono text-xs w-24"
                  maxLength={7}
                />
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQrBgColor("#ffffff")}
                    title="Crisp White"
                    style={{ backgroundColor: "#ffffff" }}
                    className="h-6 w-6 rounded-full border border-slate-300 transition-transform hover:scale-110"
                  />
                  <button
                    type="button"
                    onClick={() => setQrBgColor("#f8fafc")}
                    title="Soft Slate"
                    style={{ backgroundColor: "#f8fafc" }}
                    className="h-6 w-6 rounded-full border border-slate-300 transition-transform hover:scale-110"
                  />
                  <button
                    type="button"
                    onClick={() => setQrBgColor("#fffbeb")}
                    title="Warm Cream"
                    style={{ backgroundColor: "#fffbeb" }}
                    className="h-6 w-6 rounded-full border border-slate-300 transition-transform hover:scale-110"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card Content Settings */}
          <div className="space-y-4 border-t pt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Card Content
              </h2>
              <span className="text-[10px] text-muted-foreground font-medium">
                {cardEdition === "universal" ? "No Business Name" : "Custom Brand"}
              </span>
            </div>

            {cardEdition === "universal" ? (
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="universalTitleInput"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Header Title (Printed on Card)
                  </label>
                  <Input
                    id="universalTitleInput"
                    value={universalTitle}
                    onChange={(e) => setUniversalTitle(e.target.value)}
                    placeholder="REVIEW US ON GOOGLE"
                    maxLength={32}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="universalSubtitleInput"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Header Subtitle / Tagline
                  </label>
                  <Input
                    id="universalSubtitleInput"
                    value={universalSubtitle}
                    onChange={(e) => setUniversalSubtitle(e.target.value)}
                    placeholder="SCAN OR TAP WITH PHONE"
                    maxLength={36}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="bizNameInput" className="text-xs font-semibold text-slate-700">
                    Business Display Name
                  </label>
                  <Input
                    id="bizNameInput"
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    placeholder="The Night Watch Cafe"
                    maxLength={40}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="bizCategoryInput"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Category or Subtitle
                  </label>
                  <Input
                    id="bizCategoryInput"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Specialty Coffee & Bakery"
                    maxLength={40}
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label htmlFor="ctaHeadlineInput" className="text-xs font-semibold text-slate-700">
                Review Call-to-Action
              </label>
              <Input
                id="ctaHeadlineInput"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Review Us On Google"
                maxLength={35}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Target URL / NFC Payload
              </label>
              <p className="rounded-md border bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600 break-all select-all">
                {currentTargetUrl}
              </p>
            </div>
          </div>

          {/* Print & Elements Toggles */}
          <div className="space-y-3 border-t pt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Card Options
            </h2>

            <label className="flex items-center justify-between text-sm cursor-pointer">
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                5-Star Rating Badge
              </span>
              <input
                type="checkbox"
                checked={includeStars}
                onChange={(e) => setIncludeStars(e.target.checked)}
                className="h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between text-sm cursor-pointer">
              <span className="flex items-center gap-2">
                <ContactlessNfcIcon size={16} className="text-blue-600" />
                NFC "Tap Phone" Banner
              </span>
              <input
                type="checkbox"
                checked={includeNfc}
                onChange={(e) => setIncludeNfc(e.target.checked)}
                className="h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between text-sm cursor-pointer">
              <span className="flex items-center gap-2">
                <Scissors className="h-4 w-4 text-slate-400" />
                Show Cut Guidelines
              </span>
              <input
                type="checkbox"
                checked={showCutGuides}
                onChange={(e) => setShowCutGuides(e.target.checked)}
                className="h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>
        </aside>

        {/* ---------------- CENTER CANVAS / PREVIEW AREA ---------------- */}
        <main className="flex-1 bg-slate-100 p-6 md:p-10 flex justify-center items-start overflow-auto print:p-0 print:bg-white print:overflow-visible">
          {viewMode === "a4" ? (
            /* A4 Print Sheet (4 Cards in 2x2 grid, 95x136mm each) */
            <div
              className={`print:m-0 print:shadow-none bg-white shadow-2xl relative transition-all duration-200 ${
                showCutGuides ? "show-cut-guides" : ""
              }`}
              style={{
                width: "210mm",
                minHeight: "297mm",
                padding: "9.5mm 7mm",
                display: "grid",
                gridTemplateColumns: "95mm 95mm",
                gridTemplateRows: "136mm 136mm",
                gap: "6mm 6mm",
                justifyContent: "center",
                boxSizing: "border-box",
              }}
            >
              {/* Center Cut Lines across sheet */}
              {showCutGuides && (
                <>
                  <div
                    className="absolute pointer-events-none left-0 right-0 border-t border-dashed border-slate-400/80"
                    style={{ top: "calc(9.5mm + 136mm + 3mm)" }}
                  />
                  <div
                    className="absolute pointer-events-none top-0 bottom-0 border-l border-dashed border-slate-400/80"
                    style={{ left: "calc(7mm + 95mm + 3mm)" }}
                  />
                </>
              )}

              {/* 4 Cards Rendered on A4 Page */}
              {[1, 2, 3, 4].map((slot) => (
                <div key={slot} className="relative" style={{ width: "95mm", height: "136mm" }}>
                  {showCutGuides && (
                    <span className="print:hidden absolute -top-4 right-1 text-[8px] font-mono text-slate-400 pointer-events-none">
                      ✂ cut
                    </span>
                  )}
                  <ReviewCardItem
                    name={bizName}
                    category={category}
                    color={color}
                    qrDotColor={qrDotColor}
                    qrBgColor={qrBgColor}
                    headline={headline}
                    url={currentTargetUrl}
                    qr={qrCodeDataUrl}
                    logo={b.logo}
                    initials={initials}
                    includeStars={includeStars}
                    includeNfc={includeNfc}
                    isUniversal={cardEdition === "universal"}
                    universalBadge={universalTemplate}
                    headerTitle={universalTitle}
                    headerSubtitle={universalSubtitle}
                    cardId={b.slug.toUpperCase()}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Single Card Focused View */
            <div className="py-8 flex flex-col items-center">
              <div
                className="bg-white shadow-xl rounded-2xl p-4 border"
                style={{
                  width: "105mm",
                  height: "150mm",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div style={{ width: "95mm", height: "136mm" }}>
                  <ReviewCardItem
                    name={bizName}
                    category={category}
                    color={color}
                    qrDotColor={qrDotColor}
                    qrBgColor={qrBgColor}
                    headline={headline}
                    url={currentTargetUrl}
                    qr={qrCodeDataUrl}
                    logo={b.logo}
                    initials={initials}
                    includeStars={includeStars}
                    includeNfc={includeNfc}
                    isUniversal={cardEdition === "universal"}
                    universalBadge={universalTemplate}
                    headerTitle={universalTitle}
                    headerSubtitle={universalSubtitle}
                    cardId={b.slug.toUpperCase()}
                  />
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Standard 95mm × 136mm Counter Card
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Global Print Styles to enforce exact A4 100% scale output */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, aside, .print\\:hidden {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
}
