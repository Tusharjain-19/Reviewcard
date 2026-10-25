import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import QRCode from "qrcode";
import {
  ArrowLeft,
  Printer,
  Download,
  Save,
  Check,
  Scissors,
  Star,
  RefreshCw,
  Sparkles,
  Heart,
  Palette,
  ExternalLink,
  Plus,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
} from "lucide-react";
import { exportA4SheetPdf, type ReviewCardSheetOptions } from "@/lib/print";
import { saveBatchBlankCards } from "@/lib/businesses.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageMeta } from "@/lib/meta";
import { toast } from "sonner";
import { ReviewCardItem, ContactlessNfcIcon } from "@/components/ReviewCardItem";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/_authenticated/cards/batch")({
  head: () =>
    pageMeta(
      "Batch Card Studio",
      "Generate multiple non-activated QR cards on A4 sheets for phone activation.",
    ),
  component: BatchCardStudio,
});

interface CardSlotData {
  id: string; // e.g. "RC-4821"
  qrDataUrl: string;
}

const TEMPLATE_PRESETS = {
  google: {
    badge: "google" as const,
    title: "REVIEW US ON GOOGLE",
    subtitle: "SCAN OR TAP WITH PHONE",
    headline: "Rate Us 5 Stars on Google",
    color: "#1a73e8",
    qrDotColor: "#000000",
  },
  star: {
    badge: "star" as const,
    title: "RATE YOUR EXPERIENCE",
    subtitle: "YOUR 5-STAR REVIEW MATTERS",
    headline: "Rate Us 5 Stars on Google",
    color: "#d97706",
    qrDotColor: "#18181b",
  },
  nfc: {
    badge: "nfc" as const,
    title: "TAP OR SCAN TO REVIEW",
    subtitle: "NO APP NEEDED · 10 SECONDS",
    headline: "Tap Phone or Scan QR Code",
    color: "#18181b",
    qrDotColor: "#1a73e8",
  },
  heart: {
    badge: "heart" as const,
    title: "YOUR OPINION MATTERS",
    subtitle: "HELP US SERVE YOU BETTER",
    headline: "How Was Your Experience?",
    color: "#065f46",
    qrDotColor: "#065f46",
  },
};

const THEME_PALETTES = [
  { name: "Google Blue", hex: "#1a73e8" },
  { name: "Midnight Slate", hex: "#18181b" },
  { name: "Forest Emerald", hex: "#065f46" },
  { name: "Ruby Burgundy", hex: "#991b1b" },
  { name: "Warm Amber", hex: "#d97706" },
  { name: "Deep Indigo", hex: "#4338ca" },
  { name: "Vibrant Cyan", hex: "#0891b2" },
  { name: "Rich Rose", hex: "#e11d48" },
];

function generateRandomCardId(prefix = "RC"): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix.toUpperCase()}-${num}`;
}

function generateIdSequence(prefix = "RC", count = 4, isClient = false): string[] {
  const cleanPrefix = prefix.trim().toUpperCase() || "RC";
  const baseNum = isClient ? Math.floor(1000 + Math.random() * (9000 - count)) : 1001;
  const list: string[] = [];
  for (let i = 0; i < count; i++) {
    list.push(`${cleanPrefix}-${baseNum + i}`);
  }
  return list;
}

const qrCache = new Map<string, string>();

async function getFastQrDataUrl(
  targetUrl: string,
  dotColor = "#000000",
  bgColor = "#ffffff",
): Promise<string> {
  const cacheKey = `${targetUrl}:${dotColor}:${bgColor}`;
  const cached = qrCache.get(cacheKey);
  if (cached) return cached;

  try {
    const svg = await QRCode.toString(targetUrl, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
      color: {
        dark: dotColor,
        light: bgColor,
      },
    });
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    qrCache.set(cacheKey, dataUrl);
    return dataUrl;
  } catch (err) {
    console.error("Fast QR generation failed:", err);
    return "";
  }
}

function BatchCardStudio() {
  const [prefix, setPrefix] = useState("RC");
  const [cardCount, setCardCount] = useState<number>(4);
  const [codes, setCodes] = useState<string[]>(() => generateIdSequence("RC", 4, false));
  const [slots, setSlots] = useState<CardSlotData[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const [zoomScale, setZoomScale] = useState<number>(1);

  // Auto-fit responsive zoom scale on mobile/tablet mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const w = window.innerWidth;
      if (w < 400) setZoomScale(0.38);
      else if (w < 640) setZoomScale(0.42);
      else if (w < 1024) setZoomScale(0.72);
      else setZoomScale(1);
    }
  }, []);

  const handleFitScreen = () => {
    if (typeof window === "undefined") return;
    const padding = window.innerWidth < 640 ? 24 : 48;
    const availableWidth = window.innerWidth - (window.innerWidth >= 1024 ? 384 : 0) - padding;
    const target = Math.max(0.35, Math.min(1.2, Number((availableWidth / 794).toFixed(2))));
    setZoomScale(target);
  };

  // Card Design Settings
  const [template, setTemplate] = useState<"google" | "star" | "nfc" | "heart">("google");
  const [color, setColor] = useState(TEMPLATE_PRESETS.google.color);
  const [qrDotColor, setQrDotColor] = useState(TEMPLATE_PRESETS.google.qrDotColor);
  const [qrBgColor, setQrBgColor] = useState("#ffffff");
  const [headerTitle, setHeaderTitle] = useState(TEMPLATE_PRESETS.google.title);
  const [headerSubtitle, setHeaderSubtitle] = useState(TEMPLATE_PRESETS.google.subtitle);
  const [headline, setHeadline] = useState(TEMPLATE_PRESETS.google.headline);

  // Toggles
  const [includeNfc, setIncludeNfc] = useState(true);
  const [includeStars, setIncludeStars] = useState(true);
  const [showCutGuides, setShowCutGuides] = useState(true);

  // Status
  const [exportingPdf, setExportingPdf] = useState(false);
  const saveBatch = useServerFn(saveBatchBlankCards);
  const [savingDb, setSavingDb] = useState(false);
  const [mobileTab, setMobileTab] = useState<"controls" | "preview">("preview");

  // Randomize IDs and calculate scale for mobile on client mount
  useEffect(() => {
    setCodes(generateIdSequence("RC", 4, true));
    if (typeof window !== "undefined" && window.innerWidth < 850) {
      const scale = Math.max(0.42, Math.min(0.85, (window.innerWidth - 32) / 800));
      setZoomScale(scale);
    }
  }, []);

  // Update card count
  const handleSetQuantity = (newCount: number) => {
    setCardCount(newCount);
    const cleanPrefix = prefix.trim().toUpperCase() || "RC";
    if (newCount > codes.length) {
      const additional = generateIdSequence(cleanPrefix, newCount - codes.length);
      setCodes([...codes, ...additional]);
    } else {
      setCodes(codes.slice(0, newCount));
    }
    setActiveSheetIndex(0);
    toast.success(`Set batch to ${newCount} cards (${Math.ceil(newCount / 4)} sheets)`);
  };

  const handleAddMoreCards = () => {
    const nextCount = cardCount + 4;
    handleSetQuantity(nextCount);
  };

  // Regeneration of fresh IDs for all cards
  const handleRegenerateCodes = () => {
    const cleanPrefix = prefix.trim().toUpperCase() || "RC";
    const newCodes = generateIdSequence(cleanPrefix, cardCount);
    setCodes(newCodes);
    toast.success(`Generated ${cardCount} new unique Card IDs`);
  };

  const handleUpdateCode = (index: number, val: string) => {
    const updated = [...codes];
    updated[index] = val.trim().toUpperCase();
    setCodes(updated);
  };

  const handleTemplateSelect = (t: "google" | "star" | "nfc" | "heart") => {
    setTemplate(t);
    const p = TEMPLATE_PRESETS[t];
    setHeaderTitle(p.title);
    setHeaderSubtitle(p.subtitle);
    setHeadline(p.headline);
    setColor(p.color);
    setQrDotColor(p.qrDotColor);
  };

  // Generate QR codes for all codes with high-speed SVG generator + cache
  useEffect(() => {
    let active = true;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    Promise.all(
      codes.map(async (code) => {
        const cleanSlug = code.toLowerCase().replace(/[^a-z0-9-]/g, "");
        const targetUrl = `${origin}/activate/${cleanSlug}`;
        const qrDataUrl = await getFastQrDataUrl(
          targetUrl,
          qrDotColor || "#000000",
          qrBgColor || "#ffffff",
        );
        return { id: code, qrDataUrl };
      }),
    ).then((res) => {
      if (active) setSlots(res);
    });
    return () => {
      active = false;
    };
  }, [codes, qrDotColor, qrBgColor]);

  // Export all cards to Multi-Page A4 PDF
  const handleExportPdf = async () => {
    setExportingPdf(true);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    try {
      const cardsList: ReviewCardSheetOptions[] = codes.map((c) => {
        const cleanSlug = c.toLowerCase().replace(/[^a-z0-9-]/g, "");
        return {
          name: headerTitle,
          category: headerSubtitle,
          url: `${origin}/activate/${cleanSlug}`,
          color,
          qrDotColor,
          qrBgColor,
          headline,
          includeNfc,
          includeStars,
          isUniversal: true,
          universalBadge: template,
          universalTitle: headerTitle,
          universalSubtitle: headerSubtitle,
          cardId: c,
        };
      });

      await exportA4SheetPdf(cardsList);
      toast.success(`Exported ${codes.length} cards across ${Math.ceil(codes.length / 4)} page(s)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleSaveToDatabase = async () => {
    setSavingDb(true);
    try {
      const res = await saveBatch({
        data: {
          codes,
          title: headerTitle,
          subtitle: headerSubtitle,
          color,
        },
      });
      if (res.createdCount > 0) {
        toast.success(`Saved ${res.createdCount} non-activated cards to database!`);
      } else {
        toast.info("All cards in this batch are already recorded in database.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save cards to database");
    } finally {
      setSavingDb(false);
    }
  };

  const totalSheets = Math.max(1, Math.ceil(codes.length / 4));
  const currentSheetSlots = slots.slice(activeSheetIndex * 4, activeSheetIndex * 4 + 4);

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-slate-100 flex flex-col">
      {/* Top Application Bar */}
      <header className="print:hidden border-b bg-white px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 sticky top-0 z-30 shadow-xs max-w-full overflow-x-hidden">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
          <Button variant="ghost" size="sm" asChild className="gap-1 text-slate-600 h-9 px-2 sm:px-3 text-xs">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </Button>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-2 min-w-0">
            <BrandLogo size="sm" showWordmark={false} to="/dashboard" />
            <h1 className="font-display text-xs sm:text-base font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2 truncate">
              <span className="truncate">Batch Studio</span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 shrink-0">
                {codes.length} Cards
              </span>
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button
            onClick={handleSaveToDatabase}
            disabled={savingDb}
            variant="outline"
            size="sm"
            className="h-9 px-2.5 sm:px-3 gap-1.5 border-emerald-300 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 font-semibold text-xs"
          >
            <Save className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">{savingDb ? "Saving..." : `Save to DB (${codes.length})`}</span>
            <span className="sm:hidden">{savingDb ? "..." : `Save (${codes.length})`}</span>
          </Button>

          <Button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            size="sm"
            className="h-9 px-2.5 sm:px-3.5 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{exportingPdf ? "Generating..." : `Export PDF (${codes.length})`}</span>
            <span className="sm:hidden">{exportingPdf ? "..." : `PDF (${codes.length})`}</span>
          </Button>
        </div>
      </header>

      {/* Mobile Tab Switcher (< 1024px) */}
      <div className="lg:hidden print:hidden border-b bg-white p-2 sticky top-14.25 z-30 flex gap-2 shadow-2xs">
        <button
          type="button"
          onClick={() => setMobileTab("controls")}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === "controls"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:text-slate-900"
          }`}
        >
          <Palette className="h-4 w-4" />
          Batch Settings
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === "preview"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:text-slate-900"
          }`}
        >
          <Layers className="h-4 w-4" />
          Sheet Preview
        </button>
      </div>

      {/* Main Studio Body: Sidebar Controls + Center Canvas */}
      <div className="flex-1 flex flex-col lg:flex-row print:block">
        {/* Left Settings Sidebar */}
        <aside
          className={`print:hidden w-full lg:w-96 border-b lg:border-b-0 lg:border-r bg-white p-4 sm:p-5 space-y-6 shrink-0 lg:h-[calc(100vh-57px)] lg:overflow-y-auto ${
            mobileTab === "preview" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Card Quantity Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Batch Quantity
              </h2>
              <span className="text-xs font-bold text-blue-600">{codes.length} Cards total</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[4, 8, 12, 16].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => handleSetQuantity(count)}
                  className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all text-center ${
                    cardCount === count
                      ? "border-blue-600 bg-blue-50 text-blue-700 shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {count} Cards
                  <span className="block text-[10px] font-normal text-slate-500">
                    {count / 4} {count === 4 ? "Sheet" : "Sheets"}
                  </span>
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMoreCards}
              className="w-full gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add 4 More Blank Cards
            </Button>
          </div>

          {/* Unique Card IDs Management */}
          <div className="space-y-3 border-t pt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Card Code Prefix & IDs
              </h2>
              <button
                type="button"
                onClick={handleRegenerateCodes}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                Randomize
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="prefixInput"
                className="text-xs font-semibold text-slate-600 shrink-0"
              >
                Prefix:
              </label>
              <Input
                id="prefixInput"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                placeholder="RC"
                className="h-8 font-mono uppercase text-xs w-24 text-center font-bold"
                maxLength={6}
              />
              <span className="text-[11px] text-slate-500">Printed below QR code</span>
            </div>

            {/* Scrollable list of generated codes */}
            <div className="rounded-xl border bg-slate-50/70 p-2.5 max-h-44 overflow-y-auto space-y-1.5">
              {codes.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-[10px] text-slate-400 w-5">#{i + 1}</span>
                  <Input
                    value={c}
                    onChange={(e) => handleUpdateCode(i, e.target.value)}
                    className="h-7 text-xs font-mono uppercase font-bold tracking-wider bg-white"
                    maxLength={20}
                  />
                  <span className="text-[10px] text-emerald-600 font-semibold px-1.5 py-0.5 bg-emerald-50 rounded">
                    Draft
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Style Templates */}
          <div className="space-y-3 border-t pt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Style Preset
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { key: "google", label: "Google Official", desc: "Classic Google Brand" },
                  { key: "star", label: "5-Star Gold", desc: "Warm Amber & Stars" },
                  { key: "nfc", label: "Modern Onyx", desc: "Black Minimalist NFC" },
                  { key: "heart", label: "Emerald Care", desc: "Green Hospitality" },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleTemplateSelect(t.key)}
                  className={`p-2.5 text-left rounded-xl border transition-all ${
                    template === t.key
                      ? "border-blue-600 bg-blue-50/60 ring-1 ring-blue-600"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">{t.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Color Swatches */}
          <div className="space-y-3 border-t pt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Card Color
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {THEME_PALETTES.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                  className="relative h-7 w-7 rounded-full border-2 border-white shadow-xs transition-transform hover:scale-110 focus:outline-none"
                >
                  {color.toLowerCase() === c.hex.toLowerCase() && (
                    <Check className="mx-auto h-3.5 w-3.5 text-white drop-shadow-sm" />
                  )}
                </button>
              ))}
              <div className="relative h-7 w-7 rounded-full border border-slate-300 overflow-hidden cursor-pointer">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  title="Custom Color"
                />
              </div>
            </div>
          </div>

          {/* Card Text Content */}
          <div className="space-y-3 border-t pt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Universal Card Text
            </h2>

            <div className="space-y-1.5">
              <label htmlFor="headerTitleBatch" className="text-xs font-semibold text-slate-700">
                Header Title (Printed on Card)
              </label>
              <Input
                id="headerTitleBatch"
                value={headerTitle}
                onChange={(e) => setHeaderTitle(e.target.value)}
                maxLength={32}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="headerSubBatch" className="text-xs font-semibold text-slate-700">
                Header Subtitle / Tagline
              </label>
              <Input
                id="headerSubBatch"
                value={headerSubtitle}
                onChange={(e) => setHeaderSubtitle(e.target.value)}
                maxLength={36}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ctaBatch" className="text-xs font-semibold text-slate-700">
                Review Headline
              </label>
              <Input
                id="ctaBatch"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                maxLength={35}
              />
            </div>
          </div>

          {/* QR Code Colors Customization */}
          <div className="space-y-3 border-t pt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              QR Code Colors
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  QR Pattern / Dots
                </label>
                <div className="flex items-center gap-1.5">
                  <div
                    className="relative h-7 w-7 rounded-md border border-slate-300 shrink-0 overflow-hidden cursor-pointer"
                    style={{ backgroundColor: qrDotColor }}
                  >
                    <input
                      type="color"
                      value={qrDotColor}
                      onChange={(e) => setQrDotColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                  <Input
                    value={qrDotColor}
                    onChange={(e) => setQrDotColor(e.target.value)}
                    className="h-7 font-mono text-[11px]"
                    maxLength={7}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">QR Background</label>
                <div className="flex items-center gap-1.5">
                  <div
                    className="relative h-7 w-7 rounded-md border border-slate-300 shrink-0 overflow-hidden cursor-pointer"
                    style={{ backgroundColor: qrBgColor }}
                  >
                    <input
                      type="color"
                      value={qrBgColor}
                      onChange={(e) => setQrBgColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                  <Input
                    value={qrBgColor}
                    onChange={(e) => setQrBgColor(e.target.value)}
                    className="h-7 font-mono text-[11px]"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card Options Toggles */}
          <div className="space-y-3 border-t pt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Print Options
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

        {/* Center Canvas / Sheet Viewer */}
        <main
          className={`flex-1 bg-slate-200/70 p-3 sm:p-4 md:p-8 flex flex-col items-center justify-start overflow-x-auto print:p-0 print:bg-white print:overflow-visible ${
            mobileTab === "controls" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Sheet Selector & Zoom Toolbar */}
          <div className="w-full max-w-212.5 mb-4 flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-xl border shadow-xs print:hidden">
            {/* Sheet Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto">
              <span className="text-xs font-semibold text-slate-500 px-2 shrink-0 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" /> Sheet:
              </span>
              {Array.from({ length: totalSheets }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSheetIndex(idx)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all shrink-0 ${
                    activeSheetIndex === idx
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Sheet {idx + 1} ({idx * 4 + 1}–{Math.min((idx + 1) * 4, codes.length)})
                </button>
              ))}
            </div>

            {/* Scale / Zoom Controls for Mobile & Desktop */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={handleFitScreen}
                className="px-2 py-1 text-xs font-semibold rounded-md border bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                title="Fit Sheet to Screen Width"
              >
                <Maximize2 className="h-3.5 w-3.5 text-blue-600" />
                Fit
              </button>
              <button
                type="button"
                onClick={() => setZoomScale((s) => Math.max(0.35, Number((s - 0.08).toFixed(2))))}
                className="h-7 w-7 rounded-md border flex items-center justify-center text-slate-600 hover:bg-slate-100"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs font-mono font-semibold text-slate-600 px-1 w-12 text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale((s) => Math.min(1.4, Number((s + 0.08).toFixed(2))))}
                className="h-7 w-7 rounded-md border flex items-center justify-center text-slate-600 hover:bg-slate-100"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(1)}
                className="px-2 py-1 text-xs font-semibold rounded-md border text-slate-600 hover:bg-slate-100 ml-1"
                title="Reset Zoom to 100%"
              >
                100%
              </button>
            </div>
          </div>

          {/* Scalable Container for A4 Sheet with responsive bounding box */}
          <div
            className="relative flex justify-center items-start transition-all max-w-full"
            style={{
              width: `${Math.round(794 * zoomScale)}px`,
              height: `${Math.round(1123 * zoomScale)}px`,
            }}
          >
            {/* A4 Sheet Container (210mm x 297mm) */}
            <div
              className={`origin-top-left transition-transform duration-150 absolute top-0 left-0 print:static print:transform-none print:m-0 print:shadow-none bg-white shadow-2xl ${
                showCutGuides ? "show-cut-guides" : ""
              }`}
              style={{
                transform: `scale(${zoomScale})`,
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
              {/* Center Cut Guidelines */}
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

              {/* Render the 4 cards for current active sheet */}
              {currentSheetSlots.map((slot, index) => {
                const globalIndex = activeSheetIndex * 4 + index;
                return (
                  <div
                    key={globalIndex}
                    className="relative"
                    style={{ width: "95mm", height: "136mm" }}
                  >
                    {showCutGuides && (
                      <span className="print:hidden absolute -top-4 right-1 text-[8px] font-mono text-slate-400 pointer-events-none">
                        Card #{globalIndex + 1} ✂ cut
                      </span>
                    )}
                    <ReviewCardItem
                      name={headerTitle}
                      category={headerSubtitle}
                      color={color}
                      qrDotColor={qrDotColor}
                      qrBgColor={qrBgColor}
                      headline={headline}
                      qr={slot.qrDataUrl}
                      initials="G"
                      includeNfc={includeNfc}
                      includeStars={includeStars}
                      isUniversal={true}
                      universalBadge={template}
                      cardId={slot.id}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* ---------------- MOBILE FLOATING BOTTOM ACTION BAR ---------------- */}
      <div className="lg:hidden print:hidden fixed bottom-3 left-3 right-3 z-40 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-2.5 flex items-center justify-between gap-2">
        {mobileTab === "controls" ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveToDatabase}
              disabled={savingDb}
              className="flex-1 h-10 font-bold text-xs gap-1.5"
            >
              <Save className="h-4 w-4" />
              {savingDb ? "Saving..." : "Save to DB"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setMobileTab("preview")}
              className="flex-1 h-10 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm"
            >
              <Eye className="h-4 w-4" />
              Sheet Preview →
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMobileTab("controls")}
              className="flex-1 h-10 font-bold text-xs gap-1.5 text-slate-700"
            >
              <Palette className="h-4 w-4" />
              Settings
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={exportingPdf}
              onClick={handleExportPdf}
              className="flex-1 h-10 font-bold text-xs bg-slate-900 hover:bg-black text-white gap-1.5 shadow-sm"
            >
              <Download className="h-4 w-4" />
              {exportingPdf ? "Exporting..." : "Export PDF"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => window.print()}
              className="h-10 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              title="Print"
            >
              <Printer className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
