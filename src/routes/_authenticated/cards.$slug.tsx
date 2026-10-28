import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState, lazy, Suspense, useRef } from "react";
import QRCode from "qrcode";
import {
  ArrowLeft,
  Printer,
  Download,
  Save,
  Move,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Scissors,
  Check,
  Palette,
  SlidersHorizontal,
  ChevronRight,
  Radio,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { ownedBusinessQuery } from "@/lib/queries";
import { shortUrl } from "@/lib/reviewcard";
import { exportReviewCardPdf } from "@/lib/print";
import { CardExportDialog } from "@/components/CardExportDialog";
import {
  type CanvasElement,
  createDefaultA6Elements,
  STICKER_SVGS,
  isLightColor,
} from "@/components/CardCanvaEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageMeta } from "@/lib/meta";
import { toast } from "sonner";
import { ReviewCardItem, ContactlessNfcIcon } from "@/components/ReviewCardItem";
import { BrandLogo } from "@/components/BrandLogo";

// Client-only lazy import of Konva Canva Editor (preserves SSR safety per AGENTS.md rules)
const CardCanvaEditor = lazy(() =>
  import("@/components/CardCanvaEditor").then((m) => ({ default: m.CardCanvaEditor })),
);

export const Route = createFileRoute("/_authenticated/cards/$slug")({
  head: () =>
    pageMeta(
      "Card Studio",
      "Choose default Google Review card design or customize in Canva Studio.",
    ),
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(ownedBusinessQuery(params.slug)),
  component: CardStudio,
});

const QUICK_THEMES = [
  { id: "clean-white", name: "Minimal Light", color: "#ffffff", tag: "Pure Light" },
  { id: "google-blue", name: "Google Blue", color: "#1a73e8", tag: "Official" },
  { id: "emerald", name: "Artisan Emerald", color: "#065f46", tag: "Cafe & Organic" },
  { id: "ruby", name: "Ruby Bistro", color: "#991b1b", tag: "Restaurant" },
  { id: "amber", name: "Warm Amber", color: "#d97706", tag: "Coffee & Bakery" },
  { id: "onyx", name: "Luxury Onyx", color: "#18181b", tag: "Modern Dark" },
];

const HEADLINE_SUGGESTIONS = [
  "Review Us On Google",
  "How Was Your Experience?",
  "Tap Phone or Scan QR",
  "Loved Your Visit? Review Us",
];

function CardStudio() {
  const { slug } = Route.useParams();
  const { data: b } = useSuspenseQuery(ownedBusinessQuery(slug));

  const initialUrl = typeof window !== "undefined" ? shortUrl(slug, "qr") : `/r/${slug}`;
  const [currentTargetUrl] = useState(initialUrl);

  // User-friendly view mode: "default" (Normal provided card) | "canva" (Custom Drag & Drop Studio) | "a4" (Print Sheet)
  const [viewMode, setViewMode] = useState<"default" | "canva" | "a4">("default");

  // Card customization state (Default to Light Mode #ffffff)
  const [bizName, setBizName] = useState(b.name || "Business Name");
  const [category, setCategory] = useState(b.category || "Local Business");
  const [headline, setHeadline] = useState("Review Us On Google");
  const [color, setColor] = useState("#ffffff"); // Pure Light Mode default
  const [qrDotColor] = useState("#000000");
  const [qrBgColor] = useState("#ffffff");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [includeNfc, setIncludeNfc] = useState(true);
  const [includeStars, setIncludeStars] = useState(true);
  const [customDesign, setCustomDesign] = useState<string | null>(null);
  const [customDesignName, setCustomDesignName] = useState<string>("");
  const [customQrX, setCustomQrX] = useState(32.5);
  const [customQrY, setCustomQrY] = useState(74);
  const [customQrSize, setCustomQrSize] = useState(40);
  const [customQrFrame, setCustomQrFrame] = useState<"white" | "none" | "dark">("white");

  // Export & modal state
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(0.85);
  const [showCutGuides, setShowCutGuides] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Hidden file input for custom background artwork
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Canva Elements State (Interactive A6 elements with Light Mode default)
  const [elements, setElements] = useState<CanvasElement[]>(() =>
    createDefaultA6Elements({
      businessName: b.name || "Business Name",
      category: b.category || "Local Business",
      headline: "Review Us On Google",
      logoUrl: b.logo,
      cardColor: "#ffffff",
    }),
  );

  // Synchronized element updates
  const handleElementsChange = (newElements: CanvasElement[]) => {
    setElements(newElements);
    const nameEl = newElements.find((e) => e.id === "elem-biz-name");
    if (nameEl?.text && nameEl.text !== bizName) {
      setBizName(nameEl.text);
    }
    const catEl = newElements.find((e) => e.id === "elem-biz-cat");
    if (catEl?.text && catEl.text !== category) {
      setCategory(catEl.text);
    }
    const headEl = newElements.find((e) => e.id === "elem-cta-headline");
    if (headEl?.text && headEl.text !== headline) {
      setHeadline(headEl.text);
    }
    const qrEl = newElements.find((e) => e.id === "elem-qr-code");
    if (qrEl) {
      setCustomQrX(qrEl.x);
      setCustomQrY(qrEl.y);
      setCustomQrSize(qrEl.width);
      if (qrEl.qrFrame) setCustomQrFrame(qrEl.qrFrame);
    }
  };

  // NFC & Review Badge Style in Default Design
  const [nfcStyle, setNfcStyle] = useState<"color" | "auto" | "white" | "dark">("color");
  const [reviewBadge, setReviewBadge] = useState<
    "google" | "googleBadge" | "star5" | "location" | "heart"
  >("google");

  // Color change adapter with adaptive element colors
  const handleColorSelect = (newColor: string) => {
    setColor(newColor);
    const light = isLightColor(newColor);
    const newTextFill = light ? "#0f172a" : "#ffffff";
    const newSubFill = light ? "#475569" : "rgba(255, 255, 255, 0.90)";
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === "elem-biz-name" || el.id === "elem-nfc-title") {
          return { ...el, fill: newTextFill };
        }
        if (el.id === "elem-cta-headline") {
          return { ...el, fill: light ? "#1a73e8" : newColor };
        }
        if (el.id === "elem-biz-cat" || el.id === "elem-nfc-sub" || el.id === "elem-footer-url") {
          return { ...el, fill: newSubFill };
        }
        if (el.id === "elem-review-panel") {
          return {
            ...el,
            fill: light ? "#f8fafc" : "#ffffff",
            stroke: light ? "#e2e8f0" : undefined,
          };
        }
        if (el.id === "elem-sticker-nfc") {
          if (nfcStyle === "color" || el.stickerType === "nfcColor") {
            return {
              ...el,
              stickerType: "nfcColor",
              src: STICKER_SVGS.nfcColor,
            };
          }
          return {
            ...el,
            stickerType: light ? "nfc" : "nfcWhite",
            src: light ? STICKER_SVGS.nfc : STICKER_SVGS.nfcWhite,
          };
        }
        return el;
      }),
    );
  };

  const handleNfcStyleSelect = (style: "color" | "auto" | "white" | "dark") => {
    setNfcStyle(style);
    const light = isLightColor(color);
    const targetType =
      style === "color"
        ? "nfcColor"
        : style === "white"
          ? "nfcWhite"
          : style === "dark"
            ? "nfcDark"
            : light
              ? "nfc"
              : "nfcWhite";
    const targetSrc = STICKER_SVGS[targetType];

    setElements((prev) =>
      prev.map((el) => {
        if (el.id === "elem-sticker-nfc") {
          return {
            ...el,
            stickerType: targetType,
            src: targetSrc,
          };
        }
        return el;
      }),
    );
  };

  const handleReviewBadgeSelect = (
    badge: "google" | "googleBadge" | "star5" | "location" | "heart",
  ) => {
    setReviewBadge(badge);
    const src = STICKER_SVGS[badge];
    const width =
      badge === "google" ? 6 : badge === "googleBadge" ? 45 : badge === "star5" ? 33 : 8;
    const height =
      badge === "google" ? 6 : badge === "googleBadge" ? 9 : badge === "star5" ? 5.5 : 8;
    const x = Number(((105 - width) / 2).toFixed(1));
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === "elem-sticker-google") {
          return {
            ...el,
            stickerType: badge,
            src,
            width,
            height,
            x,
          };
        }
        return el;
      }),
    );
  };

  const handleHeadlineSelect = (text: string) => {
    setHeadline(text);
    setElements((prev) => prev.map((el) => (el.id === "elem-cta-headline" ? { ...el, text } : el)));
  };

  const handleToggleNfc = (checked: boolean) => {
    setIncludeNfc(checked);
    const light = isLightColor(color);
    const nfcType =
      nfcStyle === "color"
        ? "nfcColor"
        : nfcStyle === "white"
          ? "nfcWhite"
          : nfcStyle === "dark"
            ? "nfcDark"
            : light
              ? "nfc"
              : "nfcWhite";
    const nfcSrc = STICKER_SVGS[nfcType];

    setElements((prev) => {
      if (checked) {
        if (prev.some((e) => e.id === "elem-sticker-nfc")) return prev;
        return [
          ...prev,
          {
            id: "elem-sticker-nfc",
            type: "sticker" as const,
            stickerType: nfcType,
            x: 23,
            y: 118,
            width: 11,
            height: 11,
            src: nfcSrc,
          },
          {
            id: "elem-nfc-title",
            type: "text" as const,
            x: 36.5,
            y: 118,
            width: 55,
            height: 6,
            text: "Tap Phone on Card",
            fontSize: 8.5,
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontWeight: "bold" as const,
            fill: light ? "#0f172a" : "#ffffff",
            align: "left" as const,
          },
        ];
      }
      return prev.filter(
        (e) => e.id !== "elem-sticker-nfc" && e.id !== "elem-nfc-title" && e.id !== "elem-nfc-sub",
      );
    });
  };

  const handleToggleStars = (checked: boolean) => {
    setIncludeStars(checked);
    setElements((prev) => {
      if (checked) {
        if (prev.some((e) => e.id === "elem-sticker-stars")) return prev;
        return [
          ...prev,
          {
            id: "elem-sticker-stars",
            type: "sticker" as const,
            stickerType: "star5" as const,
            x: 36,
            y: 39,
            width: 33,
            height: 5.5,
            src: STICKER_SVGS.star5,
          },
        ];
      }
      return prev.filter((e) => e.id !== "elem-sticker-stars");
    });
  };

  // Generate crisp QR code whenever target URL changes
  useEffect(() => {
    QRCode.toString(currentTargetUrl, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
      color: {
        dark: qrDotColor || "#000000",
        light: qrBgColor || "#ffffff",
      },
    })
      .then((svg) => {
        setQrCodeDataUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
      })
      .catch((err) => console.error("QR Code generation error:", err));
  }, [currentTargetUrl, qrDotColor, qrBgColor]);

  // Artwork file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP, SVG)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomDesign(dataUrl);
      setCustomDesignName(file.name);
      toast.success("Card artwork uploaded successfully");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomDesign = () => {
    setCustomDesign(null);
    setCustomDesignName("");
    toast.success("Custom artwork removed");
  };

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
        customDesign,
        customQrX,
        customQrY,
        customQrSize,
        customQrFrame,
        elements,
      };

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("User not authenticated");

      const { error } = await supabase.from("card_designs").insert({
        business_id: b.id,
        owner_id: user.user.id,
        name: `${bizName} | Canva A6 Review Card`,
        design: designPayload as unknown as Json,
      });

      if (error) throw error;
      toast.success("Card design saved to cloud");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save design");
    } finally {
      setSaving(false);
    }
  };

  // Open Export PDF Dialog (supports 1 A6 card, 2 on A4, 4 on A4, copies, and cut marks)
  const handleDownloadPdf = () => {
    setExportDialogOpen(true);
  };

  // Execute PDF generation from dialog
  const handleRunExport = async (options: {
    copies: number;
    layout: "a6-single" | "a4-2cards" | "a4-4cards";
    showCutGuidelines: boolean;
  }) => {
    setExportingPdf(true);
    try {
      await exportReviewCardPdf({
        card: {
          name: bizName,
          category,
          url: currentTargetUrl,
          color,
          qrDotColor,
          qrBgColor,
          headline,
          includeNfc,
          includeStars,
          logo: b.logo,
          cardId: b.slug.toUpperCase(),
          customDesign,
          qrX: customQrX,
          qrY: customQrY,
          qrSize: customQrSize,
          qrFrame: customQrFrame,
          elements,
        },
        copies: options.copies,
        layout: options.layout,
        showCutGuidelines: options.showCutGuidelines,
      });
      toast.success("Card PDF downloaded successfully");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleFitScreen = () => {
    if (typeof window === "undefined") return;
    const availableWidth = window.innerWidth - 64;
    const a4PixelWidth = 794;
    const scale = Math.min(1.2, Math.max(0.4, availableWidth / a4PixelWidth));
    setZoomScale(Number(scale.toFixed(2)));
  };

  const initials =
    bizName
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "RC";

  return (
    <div className="min-h-screen w-full bg-[#f1f3f5] text-slate-900 flex flex-col overflow-x-hidden font-sans">
      {/* Hidden File Input for Custom Background Uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* ---------------- 1. TOP HEADER WITH DESIGN MODE SELECTOR ---------------- */}
      <header className="print:hidden sticky top-0 z-40 h-14 bg-white border-b border-slate-200/90 px-3 sm:px-6 flex items-center justify-between gap-3 shadow-2xs shrink-0">
        {/* Left: Back Link & Business Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink-0">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5 text-slate-600 hover:text-slate-900 h-8 px-2 sm:px-2.5 text-xs font-semibold"
          >
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </Button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2 min-w-0">
            <BrandLogo size="sm" showWordmark={false} to="/dashboard" />
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="font-display text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[140px] sm:max-w-xs">
                {b.name}
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                A6 Light Mode
              </span>
            </div>
          </div>
        </div>

        {/* Center: Design Mode Switcher (Default Design vs Custom Canva Studio vs A4 Sheet) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("default")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "default"
                ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Palette className="h-3.5 w-3.5 text-blue-600" />
            <span>Default Design</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("canva")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "canva"
                ? "bg-white text-purple-700 shadow-2xs border border-purple-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Move className="h-3.5 w-3.5 text-purple-600" />
            <span>Custom Canva Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("a4")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "a4"
                ? "bg-white text-blue-700 shadow-2xs border border-blue-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Printer className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden sm:inline">A4 Print Sheet</span>
            <span className="sm:hidden">A4</span>
          </button>
        </div>

        {/* Right: Save & Export PDF Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-8 px-2.5 sm:px-3 gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border-slate-200"
            title="Save card design to cloud"
          >
            <Save className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">{saving ? "Saving…" : "Save Design"}</span>
          </Button>

          {/* Canva Purple Export PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={exportingPdf}
            className="h-8 px-3 sm:px-3.5 gap-1.5 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-xs flex items-center cursor-pointer transition-all active:scale-98 disabled:opacity-50"
            title="Download print-ready PDF (A6 single or A4 sheet)"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{exportingPdf ? "Generating…" : "Export PDF"}</span>
          </button>
        </div>
      </header>

      {/* ---------------- 2. MAIN WORKSPACE VIEW ---------------- */}
      <div className="flex-1 w-full flex flex-col overflow-hidden">
        {viewMode === "default" ? (
          /* =========================================================================
             VIEW 1: DEFAULT DESIGN (Provided standard clean review card)
             ========================================================================= */
          <div className="flex-1 w-full overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-start animate-fade-in">
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Easy Controls & Quick Tweaks */}
              <div className="lg:col-span-5 space-y-4">
                {/* Intro Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Default Review Card</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Clean, standard Light Mode A6 layout (105 × 148 mm).
                      </p>
                    </div>
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                      Ready to Print
                    </span>
                  </div>

                  {/* 1-Click Color Themes */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Card Theme Color</span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {color}
                      </span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {QUICK_THEMES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleColorSelect(t.color)}
                          className={`p-2 rounded-xl border transition-all text-left flex items-center gap-2 cursor-pointer ${
                            color.toLowerCase() === t.color.toLowerCase()
                              ? "border-blue-600 bg-blue-50/50 shadow-2xs"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div
                            className="h-5 w-5 rounded-md border border-slate-300 shrink-0"
                            style={{ backgroundColor: t.color }}
                          />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-800 truncate">
                              {t.name}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Review Headline Selector */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-700">Review Headline</label>
                    <div className="flex flex-wrap gap-1.5">
                      {HEADLINE_SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleHeadlineSelect(s)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            headline === s
                              ? "bg-slate-900 text-white border-slate-900 font-bold"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <Input
                      value={headline}
                      onChange={(e) => handleHeadlineSelect(e.target.value)}
                      placeholder="Custom headline..."
                      className="h-8 text-xs mt-1.5 bg-slate-50"
                      maxLength={40}
                    />
                  </div>

                  {/* Badges & Elements Configuration */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 block">Card Elements & Badges</label>
                      <span className="text-[10px] text-slate-600 font-medium bg-slate-100 px-1.5 py-0.5 rounded">Default Mode</span>
                    </div>

                    {/* Replaceable Review Badge / Sticker */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-slate-600">Review Brand Badge</label>
                        <span className="text-[10px] text-slate-600">Click to replace</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleReviewBadgeSelect("google")}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                            reviewBadge === "google"
                              ? "bg-blue-50 border-blue-500 text-blue-700 shadow-xs ring-1 ring-blue-500"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span className="w-5 h-5 flex items-center justify-center shrink-0">
                            <img src={STICKER_SVGS.google} alt="Google 'G'" className="w-4 h-4 object-contain" />
                          </span>
                          <span className="truncate">Google 'G' Logo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReviewBadgeSelect("googleBadge")}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                            reviewBadge === "googleBadge"
                              ? "bg-blue-50 border-blue-500 text-blue-700 shadow-xs ring-1 ring-blue-500"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span className="w-5 h-5 flex items-center justify-center shrink-0">
                            <img src={STICKER_SVGS.googleBadge} alt="Reviews Badge" className="w-4 h-4 object-contain" />
                          </span>
                          <span className="truncate">Reviews Badge</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReviewBadgeSelect("star5")}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                            reviewBadge === "star5"
                              ? "bg-amber-50 border-amber-500 text-amber-800 shadow-xs ring-1 ring-amber-500"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span className="text-amber-500 text-xs">★★★★★</span>
                          <span className="truncate">5 Gold Stars</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReviewBadgeSelect("location")}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                            reviewBadge === "location"
                              ? "bg-red-50 border-red-500 text-red-700 shadow-xs ring-1 ring-red-500"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span className="w-5 h-5 flex items-center justify-center shrink-0">
                            <img src={STICKER_SVGS.location} alt="Location" className="w-4 h-4 object-contain" />
                          </span>
                          <span className="truncate">Map Pin Badge</span>
                        </button>
                      </div>
                    </div>

                    {/* NFC Section */}
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs py-0.5">
                        <span className="flex items-center gap-2 text-slate-700 font-medium">
                          <ContactlessNfcIcon size={16} variant={nfcStyle} className="text-blue-600" />
                          NFC "Tap Phone" Logo
                        </span>
                        <input
                          type="checkbox"
                          checked={includeNfc}
                          onChange={(e) => handleToggleNfc(e.target.checked)}
                          className="h-4 w-4 rounded-sm border-gray-300 text-blue-600 cursor-pointer"
                        />
                      </div>

                      {includeNfc && (
                        <div className="pl-6 space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-600 block">NFC Logo Style:</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleNfcStyleSelect("color")}
                              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                                nfcStyle === "color"
                                  ? "bg-blue-50 border-blue-500 text-blue-700 shadow-xs ring-1 ring-blue-500"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span>🌈</span>
                              <span>Multicolor</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNfcStyleSelect("auto")}
                              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                                nfcStyle === "auto"
                                  ? "bg-blue-50 border-blue-500 text-blue-700 shadow-xs ring-1 ring-blue-500"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <ContactlessNfcIcon size={14} variant="currentColor" className="text-blue-600" />
                              <span>Standard</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNfcStyleSelect("white")}
                              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                                nfcStyle === "white"
                                  ? "bg-slate-800 border-slate-900 text-white shadow-xs ring-1 ring-slate-900"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span className="w-3.5 h-3.5 rounded-full bg-slate-800 flex items-center justify-center text-white text-[8px]">W</span>
                              <span>White Badge</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNfcStyleSelect("dark")}
                              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                                nfcStyle === "dark"
                                  ? "bg-slate-800 border-slate-900 text-white shadow-xs ring-1 ring-slate-900"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span className="w-3.5 h-3.5 rounded-full bg-slate-900 flex items-center justify-center text-white text-[8px]">D</span>
                              <span>Dark Badge</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Star Rating Toggle */}
                    <div className="flex items-center justify-between text-xs py-1 border-t border-slate-100">
                      <span className="flex items-center gap-2 text-slate-700 font-medium">
                        <span className="text-amber-500 font-bold">★★★★★</span>
                        5-Star Rating Row
                      </span>
                      <input
                        type="checkbox"
                        checked={includeStars}
                        onChange={(e) => handleToggleStars(e.target.checked)}
                        className="h-4 w-4 rounded-sm border-gray-300 text-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* THE PROMINENT CTA TO CUSTOM CANVA STUDIO */}
                <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/80 p-4 shadow-sm hover:shadow-md transition-all hover-card-lift">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Move className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        Want to Customize Everything?
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Freely move & resize elements, upload custom background artwork, change
                        fonts, and add stickers.
                      </p>
                      <button
                        type="button"
                        onClick={() => setViewMode("canva")}
                        className="mt-3 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-transform active:scale-98"
                      >
                        <Move className="h-3.5 w-3.5" />
                        Open Custom Canva Studio
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Print Sheet Shortcut Button */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setViewMode("a4")}
                    variant="outline"
                    className="flex-1 h-9 text-xs font-bold gap-1.5 border-slate-300 text-slate-700 hover:bg-white"
                  >
                    <Printer className="h-4 w-4 text-blue-600" />
                    Preview A4 Sheet (4 Cards)
                  </Button>
                </div>
              </div>

              {/* Right Column: Centered A6 Live Preview Card */}
              <div className="lg:col-span-7 flex flex-col items-center justify-center">
                <div className="w-full flex items-center justify-between mb-2 px-2">
                  <span className="text-xs font-semibold text-slate-500">
                    Live Physical Card Preview
                  </span>
                  <span className="text-xs font-mono text-slate-500">105 × 148 mm · A6 Size</span>
                </div>

                <div
                  className="bg-white rounded-3xl shadow-xl border border-slate-300/80 p-5 flex items-center justify-center transition-all hover:shadow-2xl"
                  style={{ width: "115mm", minHeight: "158mm" }}
                >
                  <div style={{ width: "105mm", height: "148mm" }}>
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
                      nfcStyle={nfcStyle}
                      cardId={b.slug.toUpperCase()}
                      customDesign={customDesign}
                      qrX={customQrX}
                      qrY={customQrY}
                      qrSize={customQrSize}
                      qrFrame={customQrFrame}
                      cardWidth={105}
                      cardHeight={148}
                      elements={elements}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    Export A6 Print PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="h-4 w-4 text-blue-600" />
                    Print Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : viewMode === "canva" ? (
          /* =========================================================================
             VIEW 2: CUSTOM CANVA STUDIO (Interactive Drag & Drop Canvas)
             ========================================================================= */
          <div className="h-[calc(100vh-56px)] w-full overflow-hidden flex flex-col animate-fade-in">
            {/* Top Canva Notice Bar */}
            <div className="bg-purple-50/90 border-b border-purple-200/80 px-4 py-1.5 flex items-center justify-between text-xs text-purple-900 shrink-0">
              <span className="font-semibold flex items-center gap-1.5">
                <Move className="h-3.5 w-3.5 text-purple-600" />
                Custom Canva Studio Active — Click any text or sticker to drag, resize, or edit.
              </span>
              <button
                type="button"
                onClick={() => setViewMode("default")}
                className="font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer text-[11px]"
              >
                ← Back to Default Design
              </button>
            </div>

            <Suspense
              fallback={
                <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-[#f1f3f5]">
                  <div className="h-9 w-9 animate-spin rounded-full border-3 border-purple-600 border-t-transparent" />
                  <p className="text-xs font-semibold text-slate-600">Loading Canva Studio…</p>
                </div>
              }
            >
              {isClient && (
                <CardCanvaEditor
                  customDesign={customDesign}
                  customDesignName={customDesignName}
                  qrDataUrl={qrCodeDataUrl}
                  logoUrl={b.logo}
                  businessName={bizName}
                  category={category}
                  headline={headline}
                  cardColor={color}
                  onColorChange={handleColorSelect}
                  elements={elements}
                  onElementsChange={handleElementsChange}
                  onUploadFile={handleFileUpload}
                  onRemoveUpload={handleRemoveCustomDesign}
                  onApplyPreset={(preset) => {
                    handleColorSelect(preset.color);
                    handleHeadlineSelect(preset.headline);
                  }}
                  qrX={customQrX}
                  qrY={customQrY}
                  qrSize={customQrSize}
                  qrFrame={customQrFrame}
                  onChangePosition={(x, y) => {
                    setCustomQrX(x);
                    setCustomQrY(y);
                  }}
                  onChangeSize={(size) => {
                    setCustomQrSize(size);
                  }}
                  onUploadClick={() => fileInputRef.current?.click()}
                />
              )}
            </Suspense>
          </div>
        ) : (
          /* =========================================================================
             VIEW 3: A4 PRINT SHEET (4 Cards on standard A4 paper with cut guidelines)
             ========================================================================= */
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-start print:p-0 print:bg-white print:overflow-visible animate-fade-in">
            {/* Zoom & Cut Guides Toolbar */}
            <div className="w-full max-w-[794px] mb-4 flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-xs print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Printer className="h-4 w-4 text-blue-600" /> A4 Cut Sheet · 4 Cards (210 × 297
                  mm)
                </span>
                <label className="flex items-center gap-1.5 ml-3 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCutGuides}
                    onChange={(e) => setShowCutGuides(e.target.checked)}
                    className="h-3.5 w-3.5 rounded-sm border-gray-300 text-blue-600"
                  />
                  <span>Show Cut Lines</span>
                </label>
              </div>

              {/* Zoom Stepper */}
              <div className="flex items-center gap-1 ml-auto">
                <button
                  type="button"
                  onClick={handleFitScreen}
                  className="px-2 py-1 text-xs font-semibold rounded-md border bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                  title="Fit to Screen Width"
                >
                  <Maximize2 className="h-3 w-3 text-blue-600" />
                  Fit
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale((s) => Math.max(0.35, Number((s - 0.08).toFixed(2))))}
                  className="h-7 w-7 rounded-md border flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
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
                  className="h-7 w-7 rounded-md border flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale(1)}
                  className="px-2 py-1 text-xs font-semibold rounded-md border text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="100% Physical Size"
                >
                  100%
                </button>
              </div>
            </div>

            {/* Scalable Container for A4 Sheet */}
            <div
              className="relative flex justify-center items-start transition-all max-w-full pb-16"
              style={{
                width: `${Math.round(794 * zoomScale)}px`,
                height: `${Math.round(1123 * zoomScale)}px`,
              }}
            >
              <div
                className={`origin-top-left transition-transform duration-150 absolute top-0 left-0 print:static print:transform-none print:m-0 print:shadow-none bg-white shadow-2xl rounded-sm ${
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
                {/* Center Cut Lines across A4 sheet */}
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

                {/* 4 Cards on A4 Sheet */}
                {[1, 2, 3, 4].map((slot) => (
                  <div key={slot} className="relative" style={{ width: "95mm", height: "136mm" }}>
                    {showCutGuides && (
                      <span className="print:hidden absolute -top-4 right-1 text-[8px] font-mono text-slate-400 pointer-events-none flex items-center gap-0.5">
                        <Scissors className="h-2.5 w-2.5 inline" /> cut
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
                      cardId={b.slug.toUpperCase()}
                      customDesign={customDesign}
                      qrX={customQrX}
                      qrY={customQrY}
                      qrSize={customQrSize}
                      qrFrame={customQrFrame}
                      cardWidth={95}
                      cardHeight={136}
                      elements={elements}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---------------- 3. EXPORT PDF DIALOG MODAL ---------------- */}
      <CardExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={handleRunExport}
        exporting={exportingPdf}
        businessName={bizName}
      />

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
          main, div {
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
